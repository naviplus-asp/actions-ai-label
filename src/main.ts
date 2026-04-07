import {
  computeLabelChanges,
  detectAiToolsFromCoAuthors,
  type AiToolEmailMap,
} from "./label-changes.ts";

type Repo = { owner: string; repo: string };

type GitHubScript = {
  github: {
    rest: {
      issues: {
        listLabelsOnIssue(params: Repo & { issue_number: number }): Promise<{
          data: { name: string }[];
        }>;
        getLabel(params: Repo & { name: string }): Promise<unknown>;
        createLabel(
          params: Repo & { name: string; color: string; description: string },
        ): Promise<unknown>;
        addLabels(params: Repo & { issue_number: number; labels: string[] }): Promise<unknown>;
        removeLabel(params: Repo & { issue_number: number; name: string }): Promise<unknown>;
      };
      pulls: {
        listCommits(params: Repo & { pull_number: number; per_page?: number; page?: number }): Promise<{
          data: { commit: { message: string } }[];
        }>;
      };
    };
  };
  context: {
    payload: {
      pull_request?: {
        number?: number;
        body?: string;
        base?: { repo?: { owner: { login: string }; name: string } };
      };
    };
    repo: Repo;
    issue: { number: number };
  };
  core: { setFailed(msg: string | Error): void };
};

function parseBooleanInput(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  return value.trim().toLowerCase() === "true";
}

function parseJsonInput<T>(value: string | undefined, fallback: T, name: string): T {
  if (!value) return fallback;
  const parsed: unknown = JSON.parse(value);

  if (parsed === null || parsed === undefined) {
    throw new Error(`${name} must not be null`);
  }

  return parsed as T;
}

async function listPullRequestCommitMessages(
  github: GitHubScript["github"],
  repo: Repo,
  pullNumber: number,
): Promise<string[]> {
  const commitMessages: string[] = [];
  let page = 1;

  while (true) {
    const { data } = await github.rest.pulls.listCommits({
      ...repo,
      pull_number: pullNumber,
      per_page: 100,
      page,
    });

    if (data.length === 0) break;

    commitMessages.push(...data.map((commit) => commit.commit.message));

    if (data.length < 100) break;
    page += 1;
  }

  return commitMessages;
}

export default async function run({ github, context, core }: GitHubScript): Promise<void> {
  try {
    const aiTools = parseJsonInput<string[]>(process.env.AI_TOOLS_JSON, [], "ai_tools");
    const aiToolEmails = parseJsonInput<AiToolEmailMap>(
      process.env.AI_TOOL_EMAILS_JSON,
      {},
      "ai_tool_emails",
    );
    const sectionHeading = process.env.SECTION_HEADING || "## 使用した生成AI";
    const labelColor = process.env.LABEL_COLOR || "7B68EE";
    const labelDescription = process.env.LABEL_DESCRIPTION || "生成AIツール";
    const enableCoAuthorEmailDetection = parseBooleanInput(
      process.env.ENABLE_COAUTHOR_EMAIL_DETECTION,
      false,
    );

    const pr = context.payload.pull_request;
    if (!pr) return;

    const base = pr.base?.repo;
    const repo = base ? { owner: base.owner.login, repo: base.name } : context.repo;
    const issueNumber = context.issue.number;

    let commitDetectedTools: string[] = [];
    let commitManagedTools: string[] = [];

    if (enableCoAuthorEmailDetection) {
      const commitMessages = await listPullRequestCommitMessages(
        github,
        repo,
        pr.number ?? issueNumber,
      );

      commitManagedTools = Object.keys(aiToolEmails);
      commitDetectedTools = detectAiToolsFromCoAuthors(commitMessages, aiToolEmails);
    }

    const { data: labels } = await github.rest.issues.listLabelsOnIssue({
      ...repo,
      issue_number: issueNumber,
    });
    const currentLabels = labels.map((label) => label.name);

    const changes = computeLabelChanges(
      pr.body || "",
      sectionHeading,
      aiTools,
      currentLabels,
      commitDetectedTools,
      commitManagedTools,
    );

    if (!changes) return;

    for (const tool of changes.toAdd) {
      try {
        await github.rest.issues.getLabel({ ...repo, name: tool });
      } catch (error: unknown) {
        const status =
          error && typeof error === "object" && "status" in error
            ? (error as { status?: number }).status
            : undefined;

        if (status === 404) {
          await github.rest.issues.createLabel({
            ...repo,
            name: tool,
            color: labelColor,
            description: labelDescription,
          });
        } else {
          throw new Error(`Failed to get label "${tool}" (status: ${status ?? "unknown"})`);
        }
      }

      await github.rest.issues.addLabels({
        ...repo,
        issue_number: issueNumber,
        labels: [tool],
      });
    }

    for (const tool of changes.toRemove) {
      await github.rest.issues.removeLabel({
        ...repo,
        issue_number: issueNumber,
        name: tool,
      });
    }
  } catch (error: unknown) {
    core.setFailed(error instanceof Error ? error : String(error));
  }
}

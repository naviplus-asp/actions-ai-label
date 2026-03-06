import { computeLabelChanges } from "./label-changes.ts";

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
    };
  };
  context: {
    payload: {
      pull_request?: {
        body?: string;
        base?: { repo?: { owner: { login: string }; name: string } };
      };
    };
    repo: Repo;
    issue: { number: number };
  };
  core: { setFailed(msg: string | Error): void };
};

export default async function run({ github, context, core }: GitHubScript): Promise<void> {
  const aiTools: string[] = JSON.parse(process.env.AI_TOOLS_JSON || "[]");
  const sectionHeading = process.env.SECTION_HEADING || "## 使用した生成AI";
  const labelColor = process.env.LABEL_COLOR || "7B68EE";
  const labelDescription = process.env.LABEL_DESCRIPTION || "生成AIツール";

  const pr = context.payload.pull_request;
  if (!pr?.body) return;

  const base = pr.base?.repo;
  const repo = base ? { owner: base.owner.login, repo: base.name } : context.repo;
  const issueNumber = context.issue.number;

  const { data: labels } = await github.rest.issues.listLabelsOnIssue({
    ...repo,
    issue_number: issueNumber,
  });
  const currentLabels = labels.map((l) => l.name);

  const changes = computeLabelChanges(pr.body, sectionHeading, aiTools, currentLabels);
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
}

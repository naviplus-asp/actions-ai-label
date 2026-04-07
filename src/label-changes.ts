/**
 * Pure logic: given PR body, section heading, tool list, and current labels,
 * returns which labels to add and which to remove.
 * Exported for unit testing.
 */
export interface LabelChanges {
  toAdd: string[];
  toRemove: string[];
}

export type AiToolEmailMap = Record<string, string[]>;

export function extractCoAuthorEmails(commitMessages: string[]): string[] {
  const emails = new Set<string>();

  for (const message of commitMessages) {
    const matches = message.matchAll(/^Co-authored-by:\s+.+<([^>]+)>$/gim);
    for (const match of matches) {
      const email = match[1]?.trim().toLowerCase();
      if (email) {
        emails.add(email);
      }
    }
  }

  return [...emails];
}

export function detectAiToolsFromCoAuthors(
  commitMessages: string[],
  aiToolEmails: AiToolEmailMap,
): string[] {
  const coAuthorEmails = new Set(extractCoAuthorEmails(commitMessages));
  const detectedTools: string[] = [];

  for (const [tool, emails] of Object.entries(aiToolEmails)) {
    const matched = emails.some((email) => coAuthorEmails.has(email.trim().toLowerCase()));
    if (matched) {
      detectedTools.push(tool);
    }
  }

  return detectedTools;
}

export function computeLabelChanges(
  body: string,
  sectionHeading: string,
  aiTools: string[],
  currentLabels: string[],
  commitDetectedTools: string[] = [],
  commitManagedTools: string[] = [],
): LabelChanges | null {
  const desiredLabels = new Set(commitDetectedTools);
  const managedLabels = new Set(commitManagedTools);

  if (body.includes(sectionHeading)) {
    for (const tool of aiTools) {
      managedLabels.add(tool);
      const checked = body.includes(`- [x] ${tool}`) || body.includes(`- [X] ${tool}`);
      if (checked) {
        desiredLabels.add(tool);
      }
    }
  }

  if (managedLabels.size === 0) {
    return null;
  }

  const toAdd: string[] = [];
  const toRemove: string[] = [];

  for (const tool of managedLabels) {
    const hasLabel = currentLabels.includes(tool);

    if (desiredLabels.has(tool) && !hasLabel) {
      toAdd.push(tool);
    } else if (!desiredLabels.has(tool) && hasLabel) {
      toRemove.push(tool);
    }
  }

  return { toAdd, toRemove };
}

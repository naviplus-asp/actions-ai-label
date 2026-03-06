/**
 * Pure logic: given PR body, section heading, tool list, and current labels,
 * returns which labels to add and which to remove.
 * Exported for unit testing.
 */
export interface LabelChanges {
  toAdd: string[];
  toRemove: string[];
}

export function computeLabelChanges(
  body: string,
  sectionHeading: string,
  aiTools: string[],
  currentLabels: string[],
): LabelChanges | null {
  if (!body.includes(sectionHeading)) {
    return null;
  }
  const toAdd: string[] = [];
  const toRemove: string[] = [];
  for (const tool of aiTools) {
    const checked = body.includes(`- [x] ${tool}`) || body.includes(`- [X] ${tool}`);
    const hasLabel = currentLabels.includes(tool);
    if (checked && !hasLabel) {
      toAdd.push(tool);
    } else if (!checked && hasLabel) {
      toRemove.push(tool);
    }
  }
  return { toAdd, toRemove };
}

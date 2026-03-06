import { describe, expect, it } from "vitest";
import { computeLabelChanges } from "./label-changes.ts";

const sectionHeading = "## 使用した生成AI";

describe("computeLabelChanges", () => {
  it("returns null when body does not contain section heading", () => {
    const body = "Some other content";
    const result = computeLabelChanges(body, sectionHeading, ["Cursor"], []);
    expect(result).toBeNull();
  });

  it("returns toAdd for checked tools that do not have label", () => {
    const body = `${sectionHeading}\n\n- [x] Cursor\n- [ ] GitHub Copilot`;
    const result = computeLabelChanges(body, sectionHeading, ["Cursor", "GitHub Copilot"], []);
    expect(result).not.toBeNull();
    expect(result?.toAdd).toEqual(["Cursor"]);
    expect(result?.toRemove).toEqual([]);
  });

  it("accepts uppercase [X] as checked", () => {
    const body = `${sectionHeading}\n\n- [X] Cursor`;
    const result = computeLabelChanges(body, sectionHeading, ["Cursor"], []);
    expect(result?.toAdd).toEqual(["Cursor"]);
  });

  it("returns toRemove for unchecked tools that have label", () => {
    const body = `${sectionHeading}\n\n- [ ] Cursor\n- [x] GitHub Copilot`;
    const result = computeLabelChanges(
      body,
      sectionHeading,
      ["Cursor", "GitHub Copilot"],
      ["Cursor", "GitHub Copilot"],
    );
    expect(result?.toAdd).toEqual([]);
    expect(result?.toRemove).toEqual(["Cursor"]);
  });

  it("returns empty arrays when labels already match checkboxes", () => {
    const body = `${sectionHeading}\n\n- [x] Cursor\n- [ ] GitHub Copilot`;
    const result = computeLabelChanges(
      body,
      sectionHeading,
      ["Cursor", "GitHub Copilot"],
      ["Cursor"],
    );
    expect(result?.toAdd).toEqual([]);
    expect(result?.toRemove).toEqual([]);
  });

  it("handles multiple tools and mixed add/remove", () => {
    const body = `${sectionHeading}\n\n- [x] Cursor\n- [ ] GitHub Copilot\n- [x] Claude Code`;
    const result = computeLabelChanges(
      body,
      sectionHeading,
      ["Cursor", "GitHub Copilot", "Claude Code"],
      ["GitHub Copilot"],
    );
    expect(result?.toAdd).toHaveLength(2);
    expect(result?.toAdd).toContain("Cursor");
    expect(result?.toAdd).toContain("Claude Code");
    expect(result?.toRemove).toEqual(["GitHub Copilot"]);
  });
});

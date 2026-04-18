/**
 * Loads a SKILL.md file from .agents/skills/<skillName>/SKILL.md at runtime.
 * Strips the YAML frontmatter (--- ... ---) and returns the markdown body.
 *
 * This allows agent knowledge to be edited in SKILL.md files without
 * requiring code changes — the updated content is picked up on next invocation.
 *
 * Falls back to the provided defaultPrompt if the file cannot be read
 * (e.g. in edge runtime, client bundle, or serverless environments without
 * filesystem access).
 */
export function loadSkillPrompt(skillName: string, defaultPrompt: string): string {
  try {
    // Dynamic require to avoid bundling fs/path into client components.
    // These modules are only available server-side where the agents actually execute.
    const fs = require("fs");
    const path = require("path");

    const skillPath = path.join(process.cwd(), ".agents", "skills", skillName, "SKILL.md");
    const raw = fs.readFileSync(skillPath, "utf-8");

    // Strip YAML frontmatter (--- ... ---)
    const stripped = raw.replace(/^---[\s\S]*?---\s*/, "").trim();

    return stripped || defaultPrompt;
  } catch (e) {
    // Filesystem unavailable (client bundle, edge runtime, missing file, etc.) — use inline fallback
    return defaultPrompt;
  }
}


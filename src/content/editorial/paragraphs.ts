// Paragraph splitting for the rooms' plain prose. Lives beside the editorial
// parser rather than in src/lib/content.ts because that module loads content through
// Vite's import.meta.glob, which the build-time export script (tsx, no Vite) cannot run.

/** Splits prose text into paragraphs on blank lines; a line break inside a paragraph becomes a space. */
export const paragraphs = (text: string): string[] =>
  text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, ' ').trim())
    .filter((paragraph) => paragraph.length > 0)

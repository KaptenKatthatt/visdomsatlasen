import { cleanHtml } from './html'
import type { RawChapter } from './chapters'

// Standard Ebooks puts each chapter in a <section epub:type="chapter"> with
// <p> paragraphs; the chapter number is taken from the id's trailing digits (chapter-7,
// the-enchiridion-7 …). Shared by the Tao Te Ching and Epictetus' Handbook.
export const parseStandardEbook = (xhtml: string): RawChapter[] => {
  const chapters: RawChapter[] = []
  const sectionRe = /<section id="([^"]+)"[^>]*epub:type="[^"]*chapter[^"]*"[^>]*>([\s\S]*?)<\/section>/g
  let match: RegExpExecArray | null
  while ((match = sectionRe.exec(xhtml)) !== null) {
    const chapter = Number((match[1] ?? '').match(/(\d+)$/)?.[1] ?? '0')
    const paragraphs = [...(match[2] ?? '').matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)]
      .map((p) => cleanHtml(p[1] ?? ''))
      .filter((t) => t.length > 0)
    chapters.push({ chapter, verses: paragraphs.map((source, i) => ({ verse: i + 1, source })) })
  }
  return chapters
}

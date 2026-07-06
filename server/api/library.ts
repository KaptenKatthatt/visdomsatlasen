import { Hono } from 'hono'
import { getChapter, getWork, listWorks } from '../library/repository'
import { searchVerses } from '../library/search'

export const libraryRouter = new Hono()

libraryRouter.get('/works', (c) => c.json({ works: listWorks() }))

libraryRouter.get('/works/:id', (c) => {
  const result = getWork(c.req.param('id'))
  if (!result) return c.json({ error: 'not_found' }, 404)
  return c.json(result)
})

libraryRouter.get('/books/:bookId/chapters/:n', (c) => {
  const n = Number(c.req.param('n'))
  if (!Number.isInteger(n) || n < 1) return c.json({ error: 'bad_chapter' }, 400)
  const view = getChapter(c.req.param('bookId'), n)
  if (!view) return c.json({ error: 'not_found' }, 404)
  return c.json(view)
})

libraryRouter.get('/search', (c) => {
  const q = c.req.query('q') ?? ''
  return c.json({ query: q, hits: searchVerses(q) })
})

# Search

## Purpose

Search helps users deliberately find a question, reflection room, source, tradition or person inside the Library.

It is a tool for intentional discovery.

It is not a recommendation feed.

It is not a content browser designed to keep the user moving.

It should help the user find what they came for and then step aside.

---

## Core Principle

> Search should feel like asking a librarian, not activating an attention engine.

The result should be clear, finite and understandable.

The user should never feel that the application is trying to persuade them to keep searching.

---

## Relationship to the Reading Room

Search belongs to the Library.

It must not appear inside the active Reading Room as a prominent control.

When a user opens a reflection room from search results:

- search results disappear
- Library navigation recedes
- Reading Room mode takes over
- the room is presented without surrounding recommendations

After leaving the room, the user may return to the previous search state.

---

## Search Entry

Search should be easy to find inside the Library.

Suggested Swedish placeholder:

> Sök efter en fråga, tanke eller källa

The placeholder should communicate that the user does not need to know:

- an exact title
- an author
- a tradition
- a technical term

Search should support natural language.

Examples:

- Hur lever man med osäkerhet?
- Tankar om förlåtelse
- Något om döden
- Epiktetos
- Predikaren
- Stoicism och kontroll
- Vad är ett gott liv?

---

## Search Scope

Search may include:

- questions
- themes
- reflection rooms
- paths
- sources
- source passages
- traditions
- people and authors
- historical context
- public tags and keywords

Private notes may be included only in the user’s own private search context.

Private note content must never enter a shared or public index.

---

## Result Priority

Results should generally be prioritised in this order:

1. Exact question matches
2. Related questions
3. Themes
4. Reflection rooms
5. Paths
6. Sources
7. Traditions
8. People and authors
9. Historical context

This order reflects the human-question-first structure of Visdomsatlasen.

A famous author should not automatically outrank a directly relevant question.

---

## Search Intent

Search should attempt to distinguish between common forms of intent.

### Human Question

Example:

> Hur hanterar man sorg?

Prioritise:

- relevant questions
- themes
- reflection rooms
- paths

### Concept or Theme

Example:

> Mod

Prioritise:

- the Mod theme
- connected questions
- relevant rooms

### Known Source

Example:

> Enchiridion

Prioritise:

- the source record
- relevant passages
- connected rooms
- historical context

### Person or Author

Example:

> Marcus Aurelius

Prioritise:

- the person page
- works
- connected questions
- connected rooms

### Tradition

Example:

> Taoism

Prioritise:

- the tradition page
- central questions
- sources
- connected rooms

The interface does not need to announce the inferred intent.

It should simply order the results helpfully.

---

## Query Behaviour

Search should:

- ignore leading and trailing whitespace
- treat uppercase and lowercase equally
- support partial words where useful
- tolerate common spelling errors
- support Swedish characters
- handle singular and plural forms
- recognise common alternative names
- recognise translated and original titles
- recognise established abbreviations

Examples:

- `Epictetus` should find `Epiktetos`
- `Ecclesiastes` should find `Predikaren`
- `Tao Te Ching` should also find `Daodejing`
- `Marcus Aurelius` should find `Marcus Aurelius` even when a Swedish room title does not mention him

Aliases must be editorially controlled.

---

## Swedish Language Support

The initial search experience should be optimised for Swedish.

The search index should support:

- å, ä and ö
- Swedish inflections
- common compound words
- alternative Swedish translations
- English and original-language source titles when available

Search may normalise characters internally, but displayed text must preserve correct spelling.

For example, searching for `forlatelse` may return content about `förlåtelse`.

This is a convenience feature, not a replacement for correct language.

---

## Search Trigger

Search should not send a request after every single keystroke without restraint.

Recommended behaviour:

- begin searching after two meaningful characters
- debounce input briefly
- update results without disruptive loading
- submit immediately when the user presses Enter

A local index may respond without visible delay.

Remote search should use a quiet loading state.

---

## Empty Query

Before the user types, the search view should not display:

- trending searches
- popular rooms
- recommended authors
- recently popular topics
- personalised suggestions

A small amount of neutral guidance is permitted.

Example Swedish copy:

> Sök bland frågor, rum, källor och traditioner.

The interface may also show the main Library categories.

---

## Search Suggestions

Suggestions may be shown while typing when they directly help complete the current query.

Allowed suggestions:

- matching question titles
- matching themes
- source titles
- author names
- known aliases

Suggestions must not be based on:

- popularity
- engagement
- commercial value
- inferred emotional state
- private note analysis
- other users’ behaviour

Suggestions should complete intent, not manufacture it.

---

## Result Grouping

Results should be grouped by type.

Suggested Swedish section labels:

- Frågor
- Teman
- Rum
- Vandringar
- Källor
- Traditioner
- Personer
- Anteckningar

Only groups containing results should be shown.

The most relevant group should appear first.

---

## Number of Results

Search should remain finite and restrained.

Recommended initial display:

- up to 5 results per group
- up to 20 results in total
- explicit action to show more within a group

Suggested Swedish label:

> Visa fler

Do not use infinite scrolling.

The user should understand that the result set has an end.

---

## Result Previews

### Question Result

Show:

- question text
- short description
- number of connected rooms only if genuinely useful

Avoid displaying popularity or activity.

### Theme Result

Show:

- theme label
- one-sentence description

### Reflection Room Result

Show:

- title
- short summary
- connected question or theme
- approximate reading time

Do not lead with author or tradition.

### Path Result

Show:

- title
- short introduction
- central question
- number of rooms

Do not show progress unless the user has explicitly opened that path before, and even then only use the last location for orientation.

### Source Result

Show:

- title
- author or attributed origin
- approximate date
- source type

### Person Result

Show:

- name
- historical period
- short identifying description

### Note Result

Show only in private search:

- note excerpt
- connected room or source
- last edited date

---

## Result Ranking

Ranking should prioritise relevance rather than engagement.

Possible ranking signals:

1. Exact title match
2. Exact alias match
3. Exact question match
4. Match in primary theme
5. Match in room title
6. Match in room summary
7. Match in source title
8. Match in keywords
9. Match in extended context

Ranking must not use:

- clicks
- saves
- reading duration
- completion
- popularity
- recent global activity
- retention
- conversion
- session length

---

## Editorial Keywords

Content may include editorial keywords to improve discovery.

Keywords should represent:

- common user language
- synonyms
- related concepts
- alternative translations
- historical terminology
- common misspellings where useful

Example:

```ts
type SearchMetadata = {
  aliases?: string[];
  keywords?: string[];
  relatedTerms?: string[];
};
```

Keywords must not become visible clutter in the normal interface.

---

## Synonyms

The search system should support a controlled synonym map.

Examples:

```ts
const synonyms = {
  oro: ["ångest", "ängslan", "bekymmer", "rastlöshet"],
  lugn: ["stillhet", "ro", "sinnesro"],
  död: ["döden", "dödlighet", "livets slut"],
  mening: ["livsmening", "syfte"],
  förlåtelse: ["förlåta", "försoning"],
};
```

Synonyms should improve recall without collapsing important distinctions.

For example, `sorg` and `lidande` may be related, but they are not identical.

---

## Typo Tolerance

Search should tolerate small spelling errors.

Examples:

- `epiktetos` and `epictetos`
- `förlåtele`
- `stoism`
- `tao te ching`

Typo tolerance should remain conservative.

The system should not return loosely related results with false confidence.

---

## No Results

When no results are found, the interface should remain calm and useful.

Suggested Swedish copy:

> Vi hittade inget som stämde med din sökning.

Optional guidance:

> Prova ett bredare ord eller sök efter en fråga, ett tema eller en källa.

Possible actions:

- clear the search
- return to Library categories
- view all themes

Do not show unrelated recommendations merely to fill the page.

---

## Ambiguous Results

When a query has several plausible meanings, show clearly separated result groups.

Example query:

> Marcus

Possible groups:

- Personer
- Källor
- Rum

Do not force the user through a clarification step when grouped results are sufficient.

---

## Filters

Filters should remain optional and collapsed by default.

Possible filters:

- content type
- theme
- tradition
- historical period
- source type
- language

Suggested Swedish label:

> Filtrera

Filters should help refine an existing result set.

They should not be required before searching.

---

## Filter Behaviour

Active filters must be visible and easy to remove.

The interface should clearly show:

- which filters are active
- how many results remain
- how to reset all filters

Avoid complex nested filter systems.

The Library is not an academic research database.

---

## Search History

Search history is optional.

The first version does not require it.

If added later:

- it should remain local or private
- the user should be able to clear it
- it should not create recommendations
- it should not be treated as an interest profile

Do not show previous searches automatically on the home screen.

---

## Privacy

Public search queries should collect as little personal data as practical.

Search analytics must not be used to infer:

- religion
- political beliefs
- mental health
- emotional state
- personal crises
- philosophical identity

Queries involving death, suffering, faith or despair may be deeply personal.

They must not be used for behavioural profiling.

---

## Notes Search

Private note search must be separated from the public content index.

Requirements:

- search only the current user’s notes
- do not expose note text in logs
- do not use note matches to rank public content
- do not send note content to external services without explicit consent
- make note results visually identifiable as private

Suggested Swedish label:

> Privat anteckning

---

## AI and Semantic Search

The initial version does not require AI-powered semantic search.

A conventional full-text index with:

- good metadata
- aliases
- synonyms
- typo tolerance
- editorial keywords

is sufficient.

AI-assisted search may be considered later only if it solves a demonstrated user need.

It must not:

- invent answers
- replace source results with generated summaries
- analyse private notes without consent
- hide why a result matched
- introduce engagement-based ranking

---

## Search Answers

Search should return content records, not generate authoritative answers to philosophical or historical questions.

For example, a search for:

> Vad är meningen med livet?

should return:

- relevant questions
- reflection rooms
- paths
- source material

It should not produce one definitive generated answer above the results.

Visdomsatlasen offers perspectives, not a search-engine verdict.

---

## Highlighting Matches

Matched words may be highlighted in summaries.

Highlighting should:

- use accessible markup
- preserve readability
- avoid excessive visual noise
- not rely on colour alone

Do not highlight every occurrence in long text.

---

## Search State

When a user opens a result and returns, preserve:

- the query
- active filters
- scroll position
- expanded result groups

This allows the user to explore without repeating work.

Search state may be temporary.

It does not need to become permanent user history.

---

## URL State

Search queries and filters may be represented in the URL.

Example:

```text
/library/search?q=förlåtelse&type=room
```

Benefits:

- browser navigation works correctly
- results can be revisited
- search state survives refresh
- public searches can be shared

Private note filters or identifiers must not be included in shareable URLs.

---

## Keyboard Behaviour

Search should support:

- focusing the field through normal tab order
- submitting with Enter
- moving through suggestions with arrow keys
- closing suggestions with Escape
- opening a selected result with Enter

Keyboard behaviour must follow familiar web conventions.

---

## Mobile Experience

On mobile:

- the search field should remain easy to reach
- the keyboard should not cover essential controls
- result groups should appear in one column
- filters should remain collapsed
- opening a result should preserve the search state
- result previews should remain concise
- no horizontal scrolling should be required

The search experience should not resemble a dense desktop database compressed onto a phone.

---

## Desktop Experience

On desktop, the interface may use:

- a wider result column
- a restrained filter sidebar
- grouped result sections
- keyboard-friendly navigation

Additional space should improve overview.

It must not introduce more promotional content or more simultaneous choices.

---

## Accessibility

Search must support:

- a programmatically associated field label
- screen-reader announcements for result updates
- keyboard-accessible suggestions
- visible focus states
- semantic result headings
- sufficient contrast
- scalable text
- clear empty and error states

Dynamic updates must not repeatedly interrupt screen readers.

---

## Performance

Search should feel immediate for the expected Library size.

Suggested targets:

- local result update within 100 milliseconds where practical
- remote result response within 500 milliseconds under normal conditions
- no visible layout shift when results update
- no blocking of the main reading interface

Large source texts may be indexed separately from concise Library metadata.

---

## Indexing

Only approved public content should enter the public search index.

Include:

- published questions
- published themes
- published rooms
- published paths
- published sources
- approved people and tradition records

Exclude:

- drafts
- archived content
- editorial notes
- unpublished translations
- internal review comments
- private user data

---

## Suggested Search Document

```ts
type SearchDocument = {
  id: string;
  entityType:
    | "question"
    | "theme"
    | "room"
    | "path"
    | "source"
    | "tradition"
    | "person";
  entityId: string;
  title: string;
  summary?: string;
  body?: string;
  aliases?: string[];
  keywords?: string[];
  themeIds?: string[];
  traditionIds?: string[];
  language: string;
  status: "published";
};
```

Private notes should use a separate model and index.

---

## Suggested Search Response

```ts
type SearchResult = {
  entityType:
    | "question"
    | "theme"
    | "room"
    | "path"
    | "source"
    | "tradition"
    | "person"
    | "note";
  entityId: string;
  title: string;
  summary?: string;
  matchedField?: string;
  score: number;
};
```

The numeric score is internal.

It should not be shown to the user.

---

## Suggested Initial Implementation

The first implementation should use:

1. A generated index of published content.
2. Exact and partial text matching.
3. Swedish normalisation.
4. Editorial aliases and keywords.
5. Controlled synonyms.
6. Conservative typo tolerance.
7. Grouped finite results.
8. No AI dependency.
9. No behavioural ranking.
10. A separate private notes search.

This approach is understandable, testable and sufficient for the initial content volume.

---

## Analytics

Permitted search analytics should focus on product quality.

Examples:

- searches returning no results
- broken result links
- slow response times
- indexing failures
- common terms missing from metadata

Query logging should be minimised and anonymised where possible.

Search analytics must not be used for:

- emotional profiling
- targeted persuasion
- engagement optimisation
- personalised recommendations
- advertising
- ranking content by popularity

---

## Error States

If search fails technically, use clear and quiet language.

Suggested Swedish copy:

> Sökningen kunde inte genomföras just nu.

Possible actions:

- Försök igen
- Gå tillbaka till Biblioteket

Do not replace failed results with unrelated content.

---

## Acceptance Criteria

Search is correctly implemented when:

- [ ] Search is available inside the Library but does not interrupt the Reading Room.
- [ ] Users can search using natural Swedish language.
- [ ] Questions and themes rank ahead of authors when more relevant.
- [ ] Results are grouped by content type.
- [ ] Result sets are finite and use no infinite scrolling.
- [ ] Published content is separated from drafts and internal editorial data.
- [ ] Ranking uses relevance rather than engagement.
- [ ] Popularity, saves and reading duration do not affect ranking.
- [ ] Private notes are searched separately and remain private.
- [ ] No-results states do not contain unrelated recommendations.
- [ ] Search state is preserved when returning from a result.
- [ ] The experience works well on mobile and with a keyboard.
- [ ] No emojis are used.

---

## Out of Scope

The first version does not need:

- generative search answers
- conversational search
- voice search
- image search
- automatic emotional interpretation
- personalised ranking
- collaborative filtering
- trending searches
- sponsored results
- popularity metrics
- infinite scrolling
- complex academic query syntax
- external web search

The purpose of search is to help the user locate material already curated inside Visdomsatlasen.

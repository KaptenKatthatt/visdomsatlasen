# Implementation Roadmap

## Purpose

This roadmap defines how Visdomsatlasen should be implemented from the current application into a coherent first release.

The work should proceed in small, verifiable stages.

Each stage should leave the application in a working state.

The implementation must preserve the core product principles:

- one thought at a time
- minimal decision-making
- human questions before authorities
- sources remain visible and verifiable
- no engagement optimisation
- no progress pressure
- mobile-first reading
- calm, finite navigation

---

## Core Principle

> Build the Reading Room first. Everything else exists to support it.

The project should not begin by constructing a complete content database, advanced search system or broad Library taxonomy.

The first priority is to make one reflection room feel complete.

---

## Implementation Strategy

The recommended order is:

```text
Foundation
    ↓
Content models
    ↓
Reading Room
    ↓
Home and entry
    ↓
Room selection
    ↓
Library
    ↓
Paths
    ↓
Sources and context
    ↓
Saved items and notes
    ↓
Search
    ↓
Accessibility and quality review
    ↓
Initial release
```

Each phase should be reviewed before the next phase begins.

---

# Phase 0: Audit the Existing Application

## Goal

Understand what can be retained, revised or removed from the current codebase.

Do not rebuild blindly.

## Tasks

- inspect the current project structure
- identify the framework and routing solution
- review existing components
- review styling and design tokens
- inspect existing content models
- identify current state management
- identify storage and backend dependencies
- review accessibility issues
- review mobile behaviour
- list unused or duplicate code
- identify features that conflict with the new direction

## Deliverable

Create:

`/docs/audits/current-application.md`

The audit should classify existing parts as:

- keep
- adapt
- replace
- remove
- investigate

## Verification

The phase is complete when:

- [ ] The current application structure is documented.
- [ ] Existing reusable components are identified.
- [ ] Conflicting features are listed.
- [ ] No major architectural decision depends on an unverified assumption.

---

# Phase 1: Establish the Foundation

## Goal

Create a stable technical base before implementing the product experience.

## Tasks

- confirm the project structure
- confirm TypeScript strict mode
- configure linting
- configure formatting
- configure tests
- define import conventions
- define component organisation
- define content directories
- define route conventions
- establish design tokens
- establish typography
- establish spacing and responsive rules

## Recommended Directory Structure

```text
src/
  app/
  components/
  features/
    reading-room/
    library/
    paths/
    search/
    notes/
    sources/
  content/
    rooms/
    questions/
    themes/
    paths/
    sources/
    people/
    traditions/
  lib/
  routes/
  styles/
  types/
  tests/
```

The exact structure may differ if the current framework has established conventions.

Consistency is more important than copying this structure literally.

## Deliverables

- strict TypeScript configuration
- working lint command
- working test command
- documented project structure
- initial design tokens
- base responsive layout

## Verification

The phase is complete when:

- [ ] The project builds successfully.
- [ ] Type checking passes.
- [ ] Linting passes.
- [ ] Tests can run.
- [ ] The application renders on mobile and desktop.
- [ ] No feature implementation depends on temporary duplicate architecture.

---

# Phase 2: Define the Editorial Content Models

## Goal

Create one consistent data model for all public content.

The interface should not be built around hard-coded page content.

## Required Models

Define models for:

- reflection rooms
- themes
- questions
- paths
- sources
- source passages
- traditions
- people
- room-source relations
- editorial review status

## Reflection Room Model

A starting model may look like:

```ts
type ReflectionRoom = {
  id: string;
  slug: string;
  title: string;
  opening: string;
  body: string;
  thoughtToCarry: string;
  reflectionQuestions: string[];
  primaryQuestionId: string;
  themeIds: string[];
  sourceRelations: RoomSourceRelation[];
  readingTimeMinutes: number;
  language: string;
  status: "draft" | "review" | "published" | "archived";
  createdAt: string;
  updatedAt: string;
};
```

## Content Validation

Add runtime validation for editorial data.

Validation should detect:

- missing IDs
- duplicate slugs
- invalid relations
- missing source references
- unpublished linked content
- empty required fields
- unsupported status values
- invalid reading times
- rooms without a primary question
- published rooms without a primary source

## Content Format

Use a format that remains readable and reviewable.

Suitable initial options include:

- Markdown with front matter
- MDX with restricted components
- JSON generated from validated Markdown
- TypeScript content objects for a very small initial set

Markdown with front matter is preferred if editors should be able to work without editing application code.

## Verification

The phase is complete when:

- [ ] All core content types have validated schemas.
- [ ] Relations between content records are checked automatically.
- [ ] Invalid published content fails the build or validation command.
- [ ] At least one complete reflection room can be loaded from editorial content.
- [ ] Editorial data is separate from user state.

---

# Phase 3: Build the Reading Room

## Goal

Create the application’s central experience before building surrounding navigation.

Implement according to:

`/docs/specs/reading-room.md`

## Initial Scope

Build one complete reflection room with:

- title
- quiet opening
- core text
- visual pause
- thought to carry
- questions in stillness
- visible source summary
- optional expanded context
- save action placeholder
- note action placeholder
- return action

## Reading Layout

Prioritise:

- readable line length
- comfortable text size
- strong hierarchy
- generous whitespace
- stable mobile layout
- minimal persistent navigation
- no competing side content

## Do Not Add Yet

Do not add:

- recommendations
- room carousels
- next-room navigation
- advanced settings
- search inside the room
- progress indicators
- engagement tracking

## Verification

The phase is complete when:

- [ ] One room feels complete when opened directly.
- [ ] The room works without the Library.
- [ ] The text is the dominant element.
- [ ] The user can reach the source information.
- [ ] The user can leave without being prompted to continue.
- [ ] The layout works at common mobile widths.
- [ ] Keyboard and screen-reader navigation work.
- [ ] No emojis are present.

---

# Phase 4: Build Home and Entry

## Goal

Allow the user to enter one room through one simple theme choice.

Implement according to:

`/docs/specs/home-and-entry.md`

## Tasks

- create the home threshold
- add the primary question
- add four to six initial themes
- create theme controls
- connect theme selection to one room
- add a secondary Library entry
- add an optional “choose for me” action if needed
- remove dashboard-style home content

## Initial Swedish UI Copy

Primary question:

> Vad vill du bära med dig idag?

Supporting text:

> Välj en tanke att stanna hos en stund.

Initial themes:

- Lugn
- Mening
- Mod
- Sanning
- Lidande
- Människan

## Verification

The phase is complete when:

- [ ] The user can open a room with one choice.
- [ ] No intermediate page appears.
- [ ] No more than eight primary choices appear.
- [ ] The Library remains secondary.
- [ ] Returning users see the same calm threshold.
- [ ] No activity, streak or progress information appears.

---

# Phase 5: Implement Room Selection

## Goal

Select one appropriate published room after a theme choice.

Implement according to:

`/docs/specs/room-selection.md`

## Initial Strategy

Use:

- one editorial default room per theme
- a small approved alternative set
- recent-room avoidance
- no behavioural ranking
- no machine learning
- no private-data analysis

## Tasks

- implement eligible-room filtering
- exclude drafts and archived rooms
- support editorial defaults
- store a small local recent-room history
- avoid immediate repetition when possible
- implement calm empty-theme handling
- write deterministic unit tests

## Verification

The phase is complete when:

- [ ] Only published rooms can be selected.
- [ ] The selected theme remains authoritative.
- [ ] Immediate repetition is avoided when alternatives exist.
- [ ] Repetition remains possible over time.
- [ ] Selection does not use saves, notes or reading duration.
- [ ] Empty themes never expose drafts.
- [ ] Selection logic has automated tests.

---

# Phase 6: Build the Library

## Goal

Provide deliberate exploration without turning the application into a feed.

Implement according to:

`/docs/specs/library.md`

## Initial Library Scope

Include:

- Questions
- Themes
- Rooms
- Sources
- Paths
- Saved items entry

Traditions and people may initially exist as supporting records without receiving full top-level sections.

## Tasks

- build the Library landing page
- build question pages
- build theme pages
- build finite room listings
- build basic source pages
- connect Library rooms to Reading Room mode
- preserve Library location when returning
- avoid infinite scrolling

## Verification

The phase is complete when:

- [ ] Questions and themes appear before people and traditions.
- [ ] Room lists are finite.
- [ ] No popularity indicators appear.
- [ ] Opening a room removes Library distractions.
- [ ] Browser back navigation restores the previous Library state.
- [ ] The Library remains usable on mobile.

---

# Phase 7: Implement Paths

## Goal

Offer optional curated sequences without turning them into courses.

Implement according to:

`/docs/specs/paths.md`

## Initial Scope

Create two or three short paths.

Recommended first paths:

- Vägen mot lugn
- Att leva med mod
- Vad ger livet mening?

Each path should contain four or five rooms.

## Tasks

- create path overview pages
- connect ordered room IDs
- add “continue the path” as a secondary action
- add “stay here” as an equal exit
- remember the last opened room
- add saved-path support later through shared saved state

## Verification

The phase is complete when:

- [ ] Every room remains complete outside the path.
- [ ] No room opens automatically.
- [ ] No completion percentage is shown.
- [ ] The user can leave after any room.
- [ ] Last position is used only for orientation.
- [ ] Paths do not use course terminology.

---

# Phase 8: Implement Sources and Context

## Goal

Make every published reflection traceable and honest.

Implement according to:

`/docs/specs/source-and-context.md`

## Tasks

- create canonical source records
- create source passage records
- connect rooms to sources
- display visible source summaries
- build expandable source details
- distinguish quotation, translation, paraphrase and adaptation
- record copyright status
- record authorship and dating uncertainty
- build full source pages in the Library
- create editorial source validation

## Publication Gate

A room must not be publishable unless:

- it has a primary source
- its usage type is declared
- direct quotations have exact references
- copyright status is recorded
- uncertainty is represented where relevant
- editorial prose is distinguished from source wording

## Verification

The phase is complete when:

- [ ] Every published room has a visible source.
- [ ] Paraphrases are not presented as quotations.
- [ ] Direct quotations include edition information.
- [ ] Expanded context is optional.
- [ ] Source pages can be reached from rooms.
- [ ] Invalid source relations fail validation.

---

# Phase 9: Implement Saved Items and Notes

## Goal

Allow users to preserve places and thoughts without introducing productivity pressure.

Implement according to:

`/docs/specs/notes-and-saved.md`

## Initial Storage Strategy

The first version may use local device storage.

Keep the storage layer abstract enough to support future synchronisation.

## Tasks

- save and unsave rooms
- save and unsave paths
- build the saved section
- add optional note fields
- implement autosave
- connect notes to their origin
- support note editing and deletion
- add data export
- keep recently opened state separate

## Privacy Requirements

- notes are private
- notes do not affect room selection
- notes do not enter public search
- notes are not processed by AI
- note content is not included in analytics

## Verification

The phase is complete when:

- [ ] Saving is optional and quiet.
- [ ] Notes remain closed by default.
- [ ] Notes autosave reliably.
- [ ] Notes remain connected to their original room or source.
- [ ] Saved paths show no completion state.
- [ ] Personal data can be exported.
- [ ] Clearing local data behaves predictably.

---

# Phase 10: Implement Search

## Goal

Allow deliberate discovery inside the Library.

Implement according to:

`/docs/specs/search.md`

## Initial Search Strategy

Use a conventional generated search index.

Include:

- exact matching
- partial matching
- Swedish normalisation
- aliases
- controlled synonyms
- conservative typo tolerance
- grouped finite results

Do not introduce AI search in the first version.

## Tasks

- generate the public search index
- exclude drafts and internal metadata
- implement the search field
- implement grouped result sections
- rank questions and themes appropriately
- preserve search state
- add optional collapsed filters
- create a separate private note search
- implement no-results and error states

## Verification

The phase is complete when:

- [ ] Natural Swedish queries produce useful results.
- [ ] Results are finite and grouped.
- [ ] Questions outrank authors when more relevant.
- [ ] No popularity signal affects ranking.
- [ ] Private notes remain separate.
- [ ] Search state survives navigation.
- [ ] Keyboard behaviour follows normal conventions.
- [ ] No-results pages contain no unrelated recommendations.

---

# Phase 11: Accessibility and Reading Quality

## Goal

Review the complete experience as a reading application rather than only as a technical product.

## Accessibility Review

Verify:

- semantic page structure
- correct heading levels
- keyboard navigation
- visible focus states
- screen-reader labels
- disclosure controls
- contrast
- touch-target sizes
- scalable text
- reduced motion
- form error handling

## Reading Review

Verify:

- line length
- paragraph spacing
- heading rhythm
- font rendering
- comfortable mobile text size
- distraction-free room layout
- source readability
- long-note editing
- dark-mode readability, if dark mode exists

## Device Review

Test at minimum:

- narrow mobile
- common modern mobile
- tablet
- laptop
- large desktop
- keyboard-only navigation
- reduced-motion preference
- enlarged browser text

## Verification

The phase is complete when:

- [ ] All core flows work with keyboard navigation.
- [ ] Text remains readable at 200% zoom.
- [ ] No important state relies only on colour.
- [ ] The Reading Room remains calm at all supported sizes.
- [ ] Dynamic search updates do not overwhelm screen readers.
- [ ] Reduced motion is respected.

---

# Phase 12: Content Preparation

## Goal

Prepare enough high-quality material for the first release without overfilling the application.

## Recommended Initial Content

### Themes

Six themes:

- Lugn
- Mening
- Mod
- Sanning
- Lidande
- Människan

### Questions

Approximately 12–18 questions.

Each theme should connect to at least two meaningful questions.

### Reflection Rooms

Approximately 18–30 published rooms.

Each primary theme should contain at least three rooms.

### Paths

Two or three paths.

Each path should contain four or five existing rooms.

### Sources

Enough verified source records to support every published room.

Do not create placeholder sources.

## Content Quality

Every room must pass review for:

- clarity
- source accuracy
- tone
- reading length
- Swedish language quality
- unnecessary repetition
- distinction between source and editorial prose
- suitability for slow reading

## Verification

The phase is complete when:

- [ ] Every visible theme contains published rooms.
- [ ] Every published room has verified sources.
- [ ] No placeholder content appears in production.
- [ ] Initial paths contain no weak filler rooms.
- [ ] UI states have real Swedish copy.
- [ ] Content feels coherent despite drawing from several traditions.

---

# Phase 13: Performance and Offline Behaviour

## Goal

Ensure the calm experience is not undermined by slow or unstable behaviour.

## Tasks

- minimise initial JavaScript
- avoid loading the entire Library on the home screen
- preload the selected room when practical
- cache a useful offline room set
- avoid layout shifts
- optimise font loading
- split large source material from core room payloads
- cache the generated search index appropriately
- test local storage limits
- provide calm offline errors

## Suggested Targets

- the home screen should become usable quickly on a mobile connection
- theme selection should open a cached room without noticeable delay
- the Reading Room should not shift after text appears
- search should feel immediate at the initial content scale

## Verification

The phase is complete when:

- [ ] The home screen does not load the complete content collection.
- [ ] Core room text is not blocked by non-essential features.
- [ ] Offline behaviour is understandable.
- [ ] Font loading does not cause severe reading disruption.
- [ ] Search and navigation remain responsive on a mid-range mobile device.

---

# Phase 14: Analytics and Error Reporting

## Goal

Collect only the information required to maintain technical quality.

## Allowed Measurements

Examples:

- page-load failures
- broken source links
- invalid content relations
- search failures
- searches with no results, preferably anonymised
- uncaught application errors
- offline loading failures

## Prohibited Optimisation

Do not optimise for:

- session length
- rooms per session
- daily return rate
- streaks
- number of continued readings
- save conversion
- note creation
- path completion
- emotional engagement

## Verification

The phase is complete when:

- [ ] Analytics are documented.
- [ ] Private notes are excluded.
- [ ] Sensitive query data is minimised.
- [ ] No engagement dashboard is used to shape room selection.
- [ ] Error reporting does not collect unnecessary personal text.

---

# Phase 15: Release Review

## Goal

Confirm that the implemented product still matches the intended experience.

## Product Review Questions

Before release, ask:

- Can a user reach one meaningful text with one choice?
- Does the Reading Room feel complete on its own?
- Is the interface asking the user to continue unnecessarily?
- Are questions more prominent than famous names?
- Are sources visible and honest?
- Is anything presented as a quotation when it is not?
- Does the Library have a clear end?
- Do saved items feel like bookmarks rather than tasks?
- Do paths feel optional?
- Does search help the user leave search?
- Does the app work comfortably on mobile?
- Has any dashboard logic entered the experience?
- Are there any emojis in the interface?

## Release Gate

The first release is ready when:

- [ ] One-choice entry works.
- [ ] Reading Room quality is high.
- [ ] All published rooms pass source validation.
- [ ] The Library is finite and calm.
- [ ] Search is relevant and private.
- [ ] Notes remain optional and local or private.
- [ ] Accessibility review is complete.
- [ ] Mobile testing is complete.
- [ ] No engagement or gamification features remain.
- [ ] No placeholder content remains.
- [ ] Error and offline states are understandable.

---

# Recommended Milestones

## Milestone 1: The Chair

Deliver:

- one complete reflection room
- mobile reading layout
- source summary
- optional context
- no surrounding application complexity

This milestone proves the central experience.

---

## Milestone 2: The Doorway

Deliver:

- home threshold
- initial themes
- one-choice room entry
- basic room selection

This milestone proves that the user can reach the chair easily.

---

## Milestone 3: The Shelves

Deliver:

- Library
- questions
- themes
- room listings
- source pages

This milestone proves that exploration can remain finite and calm.

---

## Milestone 4: The Bookmarks

Deliver:

- saved rooms
- notes
- recently opened orientation
- local export

This milestone proves that personal return does not require productivity mechanics.

---

## Milestone 5: The Catalogue

Deliver:

- search
- aliases
- Swedish language support
- grouped finite results
- private notes search

This milestone proves that a larger collection remains findable.

---

## Milestone 6: The First Complete Library

Deliver:

- reviewed initial content
- two or three paths
- verified source records
- accessibility review
- offline and performance improvements
- first public release

---

# Recommended Codex Workflow

Each implementation task should follow this structure:

```text
1. Read the relevant specification.
2. Inspect the current implementation.
3. Describe the smallest safe change.
4. Implement only that change.
5. Run type checking, linting and tests.
6. Test the affected user flow.
7. Report changed files and verification results.
8. Stop before beginning the next phase.
```

Codex must not claim completion without evidence.

Each task report should include:

- files changed
- behaviour implemented
- commands run
- test results
- known limitations
- next recommended task

---

# Task Size

Prefer tasks that can be reviewed independently.

Good task examples:

- Create the validated reflection-room schema.
- Build the mobile Reading Room text layout.
- Add the visible source summary.
- Connect one theme to one editorial default room.
- Add local recent-room avoidance.
- Build the Library question page.
- Generate the public search index.

Avoid tasks such as:

- Build the whole application.
- Finish the Library.
- Add all content.
- Improve the design.
- Implement personalisation.

Large tasks hide mistakes and make review difficult.

---

# Definition of Done

A task is complete only when:

- the requested behaviour exists
- the implementation matches the relevant specification
- type checking passes
- linting passes
- relevant tests pass
- mobile behaviour has been checked
- accessibility impact has been considered
- no unrelated feature has been added
- changed files are reported
- remaining limitations are stated honestly

A visual mock-up alone is not an implementation.

A component that has not been connected to the real flow is not complete.

Code that has not been verified is not complete.

---

# Deferred Features

The following should remain deferred until a demonstrated need exists:

- user accounts
- cloud synchronisation
- collaborative notes
- social sharing
- comments
- public profiles
- AI-generated rooms
- AI-generated answers
- AI analysis of personal notes
- semantic vector search
- personalised recommendations
- notifications
- daily reminders
- native mobile applications
- complex editorial administration
- automatic translations
- public contribution workflows

Deferring these features protects the core experience and reduces unnecessary architecture.

---

# Final Implementation Principle

> Visdomsatlasen is successful when it becomes easy to enter, easy to trust and easy to leave.

The implementation should not be judged by how many features it contains.

It should be judged by whether one carefully sourced thought can receive the user’s full attention.

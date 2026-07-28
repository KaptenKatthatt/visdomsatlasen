# Paths

## Purpose

Paths are optional, carefully curated sequences through several reflection rooms.

They are not courses.

They are not reading plans.

They are not programmes to complete.

A path offers a gentle direction for users who want to stay with one human question over time without having to choose each next step themselves.

---

## Core Principle

> A path should feel like following a quiet trail, not progressing through a curriculum.

The user may enter a path, leave it, return later or never finish it.

Nothing is locked.

Nothing is marked as overdue.

Nothing depends on completion.

---

## Relationship to the Reading Room

The Reading Room remains the primary experience.

A path does not replace it.

Every stop must stand on its own: each room in a path remains a complete,
freestanding reflection room, reached as ever from the threshold, the library,
search and Sparat, with its ordinary ending (save, note).

**Implemented as (editor's decision 2026-07-28, »Den långsamma rullen«):**
within a path, the same texts are read in the path's own reading flow — one
slow, continuous scroll (`/vandring/<slug>/las`) — never room by room in the
Reading Room. The freestanding room page carries no path context at all.

The user should never feel that a room is incomplete because it belongs to a larger path.

---

## Relationship to the Library

Paths are their own section beside the Library (editor's decision 2026-07-28):
they live behind the »Vandringar« nav tab, at their own addresses —
`/vandringar` (the list), `/vandring/<slug>` (the anteroom/overview) and
`/vandring/<slug>/las` (the reading flow). The old `/bibliotek/…` addresses
forward. Paths remain findable in the library's search.

They must not dominate the home experience.

Users who only want a single reflection room should never need to interact with paths.

---

## User Intent

Paths are useful when the user wants:

- gentle direction
- fewer decisions
- several perspectives on one question
- a theme to return to over several days
- a coherent but unforced reading experience

Paths should reduce decision-making.

They must not create a new form of obligation.

---

## Suggested Swedish Terminology

Primary label:

> Vandringar

Alternative labels may be tested, but the language must remain calm and non-academic.

Avoid:

- Kurs
- Program
- Plan
- Modul
- Nivå
- Utmaning
- Serie

Suggested path titles:

- Vägen mot lugn
- Att leva med mod
- Att möta lidandet
- Att börja om
- Vad ger livet mening?
- Att leva med det man inte kan styra
- Att förstå människan
- Att möta döden
- Att förlåta
- Att vara sann mot sig själv

---

## Path Structure

A path contains:

- one title
- one short introduction
- one central human question
- three to seven reflection rooms
- one optional closing reflection
- source metadata
- editorial notes

A path should remain short enough to feel graspable.

Recommended length:

- minimum: 3 rooms
- preferred: 4–6 rooms
- maximum: 7 rooms

Longer sequences should be divided into separate paths.

---

## Path Introduction

The introduction should explain why the rooms belong together.

It should not explain the entire path.

Recommended length:

- 50–120 words

The introduction must not contain:

- promises of transformation
- learning objectives
- deadlines
- completion language
- instructions to read in a specific rhythm

Example Swedish UI copy:

> Den här vandringen samlar några tankar om sådant vi inte kan styra. Du kan följa den i ordning, återvända senare eller stanna vid ett enda rum.

---

## Sequence

A path has an editorial order.

The order should create a meaningful progression in thought.

Examples:

```text
Oro
    ↓
Kontroll
    ↓
Acceptans
    ↓
Närvaro
    ↓
Lugn
```

Or:

```text
Rädsla
    ↓
Ansvar
    ↓
Handling
    ↓
Mod
```

The order should not feel like increasing difficulty.

It should feel like one thought opening into another.

---

## One Stop at a Time

When the user reads a path, only the current room should be in front of the eye.

The full path must not appear as a dense checklist beside the text.

A quiet path overview may be available before entering or after leaving a room.

**Implemented as (editor's decision 2026-07-28):** the flow keeps this promise
with silence rather than with pages: a full screen height of empty paper, with
the fold (`···`) resting in the middle, separates each room from the next. The
previous text is guaranteed out of view, and it takes a moment of scrolling
through the quiet before the next title rises. Inside the flow, navigation
recedes entirely — the only control is the bottom bar (see Moving Between
Stops).

---

## Moving Between Stops

There must be no autoplay.

The next room must never open automatically.

The user must never feel that continuing is the preferred or correct choice.

**Implemented as (editor's decision 2026-07-28, »Den långsamma rullen«):**
there are no controls between rooms at all — no buttons, no arrows, no trail
footer. One goes on by reading on: the next room follows after a full screen of
silence (see One Stop at a Time), and going back is scrolling back. Continuing
and stopping are therefore offered in exactly the same voice — none of them is
a call to action, and feeling done in the middle is as good an ending as the
last room.

The rooms in the flow are pure reading: no save button, no per-room actions,
and a mute source line — just the work's name in caps, per room, with no
unfolding and no link; the source apparatus lives in the library. After the
last room come the closing reflection, the central question and a single
»Skriv ner en tanke«, with air down toward the bottom bar.

The bottom bar is the flow's only control: a still bar on a hairline, whose
chevron always leads back to the path's anteroom (the overview). One must
never feel trapped in the flow.

Leaving a path is done by navigating away — the chevron, or out to another
part of the app — never by a control inside the text. The trail footer that
this section previously described (2026-07-26), and the two labelled buttons
before it, are gone: the freestanding room page carries no path context.

---

## Completion

Paths do not need to be completed.

The application must not use:

- completion percentages
- progress rings
- streaks
- deadlines
- overdue states
- congratulations
- badges
- certificates
- “X of Y completed”

A path may remember the last room opened so the user can return without searching.

This is orientation, not progress tracking.

In the flow, this memory follows the reading itself: the room whose beginning
last passed the top of the screen is remembered (shown quietly in Sparat, never
in the flow). Nothing is ticked off, and the path overview's markers stay
identical to one another — a marker never fills from having been somewhere.

---

## Returning to a Path

When the user returns, the application may offer:

> Fortsätt där du stannade

This must remain neutral.

Do not use language such as:

- Du har bara tre kvar
- Slutför din vandring
- Du ligger efter
- Fortsätt din serie
- Håll din vana vid liv

The user may also restart, choose another room or leave the path entirely.

Leaving is done by navigating away, not by dismissing the path from inside a
room (see Moving Between Stops). Nothing holds the reader in a path: no
confirmation, no cost to leaving, and nothing that has to be finished first.

---

## Path Overview

A path overview may contain:

- title
- short introduction
- central question
- list of room titles, each with its own thought

The overview should not resemble a syllabus.

**Implemented as (editor's decision 2026-07-27):** the page is read in the order
one walks it. Title and introduction, a little air, the fold (`···`), and then
the trail straight away — the head of the trail claims no screen of its own, so
the walk is visible without scrolling for it. The central question comes **last
of all**, after the stops: it is the thought one leaves with rather than an
introduction to what follows, and nothing stands below it.

Three things this list once allowed were removed rather than built: approximate
total reading time, source traditions, and the last visited room. The first two
read as a syllabus; the third belongs in Sparat, where it is orientation for
returning rather than a cue on the trail itself. The remembered room is still
kept (see Completion) — it is simply not shown here.

Each stop opens the path's reading flow at that room (the room's slug as the
anchor), so the overview is where one chooses where to step in — the walk
itself happens in the flow (2026-07-28).

Room titles should be presented as places along a path, not tasks.

---

## Source Diversity

A path may draw from several sources and traditions.

Source diversity is useful when it deepens the question.

It must not be forced for appearance or balance.

The path may contain:

- several rooms based on one tradition
- several traditions addressing the same question
- historical and modern perspectives
- conflicting perspectives

The human question remains primary.

---

## Naming Sources

Authors, books and traditions should not dominate path titles or room titles.

Prefer:

> Att leva med det man inte kan styra

Over:

> En stoisk väg genom Epiktetos och Marcus Aurelius

Source details should remain available inside each room and in optional path metadata.

---

## Editorial Selection

Every room in a path must have a clear reason to be there.

A room should be removed if it:

- repeats an earlier thought
- weakens the sequence
- adds information without deepening reflection
- exists only to represent another tradition
- makes the path feel longer than necessary

A shorter, coherent path is preferable to a comprehensive one.

---

## Suggested Initial Paths

The first version should contain only a small number of paths.

Recommended initial set:

### Vägen mot lugn

Possible room sequence:

- Det du inte kan styra
- Att låta något vara olöst
- När tankarna fortsätter
- Att återvända till nuet

### Att leva med mod

Possible room sequence:

- Rädsla utan flykt
- Det första lilla steget
- Mod utan säkerhet
- Att stå kvar

### Att möta lidandet

Possible room sequence:

- När livet inte går att förklara
- Motstånd och acceptans
- Att bära det svåra
- Mening utan enkla svar

### Att börja om

Possible room sequence:

- Att erkänna det som varit
- Förlåtelse
- Att släppa skammen
- Ett nytt steg

### Vad ger livet mening?

Possible room sequence:

- Det som inte varar
- Ansvar
- Gemenskap
- Att leva sant

These are editorial starting points, not permanent categories.

---

## Discoverability

Paths should be easy to find but not aggressively promoted.

Possible locations:

- a quiet section in the Library
- a secondary option below the Reading Room themes
- saved paths
- search results

Avoid:

- large promotional banners
- featured carousels
- “popular paths”
- “trending journeys”
- personalised engagement recommendations

---

## Saving a Path

A user may save a path.

Saving means:

> I may want to return to this later.

It does not mean:

> I have committed to finishing this.

Saved paths should appear quietly in the saved section.

Do not display completion metrics.

---

## Notes

Notes belong to individual rooms — written where a room is read freestanding.

The flow offers a single »Skriv ner en tanke« at its very end, and that note
belongs to the path itself (origin `path`), not to any one room (2026-07-28).

The application should not prompt the user to write after every stop.

Writing remains voluntary.

---

## Mobile Experience

Paths are mobile first.

On mobile:

- the introduction should remain short
- only one room should be opened at a time
- the overview should remain compact
- the next action should be clear but quiet
- there should be no persistent progress interface
- navigation must not cover the reading area

---

## Accessibility

Paths must support:

- semantic ordered relationships without requiring visual arrows
- screen readers
- keyboard navigation
- clear focus states
- scalable text
- reduced motion
- understandable labels

The path sequence should remain clear even when visual design is removed.

---

## Data Requirements

Each path should include:

```ts
type Path = {
  id: string;
  slug: string;
  title: string;
  introduction: string;
  centralQuestionId: string;
  roomIds: string[];
  closingReflection?: string;
  status: "draft" | "review" | "published" | "archived";
  createdAt: string;
  updatedAt: string;
  editorialNotes?: string;
};
```

The order of `roomIds` defines the editorial sequence.

User state should be stored separately from editorial content.

Example:

```ts
type PathUserState = {
  pathId: string;
  lastOpenedRoomId?: string;
  saved: boolean;
  updatedAt: string;
};
```

No completion percentage is required.

---

## Acceptance Criteria

Paths are correctly implemented when:

- [ ] Each path centres on one human question or closely related theme.
- [ ] Every room remains complete when read independently.
- [ ] Paths contain no course language.
- [ ] The next room never opens automatically.
- [ ] The user can stop after any room without pressure.
- [ ] No completion percentage or achievement system is shown.
- [ ] The last opened room may be remembered only for orientation.
- [ ] Sources remain available but do not dominate the experience.
- [ ] Paths remain short and editorially coherent.
- [ ] The experience works well on mobile.
- [ ] No emojis are used.

---

## Out of Scope

Paths must not include:

- mandatory reading order
- locked rooms
- tests
- quizzes
- assignments
- certificates
- deadlines
- daily schedules
- streaks
- completion rewards
- social comparison
- automated coaching
- engagement-based recommendations

These features would turn a path into a course or habit system, which conflicts with the purpose of Visdomsatlasen.

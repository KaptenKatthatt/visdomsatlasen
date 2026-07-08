# Notes and Saved Items

## Purpose

Notes and saved items allow the user to preserve thoughts worth returning to.

They must remain quiet, private and optional.

They are not productivity tools.

They are not collections to optimise.

They are not a measure of progress.

A saved room should feel like a bookmark placed inside a book.

A note should feel like a sentence written in the margin.

---

## Core Principle

> Notes preserve a thought. Saved items preserve a place.

Neither feature should create pressure to organise, complete or review anything.

---

## Relationship to the Reading Room

Notes and saving are secondary actions inside the Reading Room.

They must never interrupt the reading experience.

The primary experience remains:

```text
Read
    ↓
Pause
    ↓
Reflect
    ↓
Leave when the moment feels complete
```

Saving or writing a note is always optional.

The application must not prompt the user to do either.

---

## Saved Items

The user may save:

- reflection rooms
- paths
- questions
- original sources

Saved items should be stored in one quiet section.

Suggested Swedish label:

> Sparat

Avoid labels such as:

- Min samling
- Mina framsteg
- Favoriter att slutföra
- Läslista
- Att göra

The saved section should feel personal but not task-oriented.

---

## Saving a Room

A room may include one quiet save control.

Suggested Swedish labels:

> Spara

or:

> Spara tanken

The control should not dominate the page.

After saving, feedback should remain subtle.

Suggested confirmation:

> Sparad

Do not use:

- celebration
- animation
- badges
- counters
- streaks
- achievement language

---

## Removing a Saved Item

Removing an item should be simple and reversible when possible.

Suggested Swedish label:

> Ta bort från sparat

No warning dialog is required unless removal also deletes a personal note.

The application should not make saving or unsaving feel consequential.

---

## Saved Section

The saved section may contain:

- saved reflection rooms
- saved paths
- saved questions
- saved sources
- notes

The section should be finite and easy to scan.

It must not become a content feed.

Recommended grouping:

```text
Rum
Vandringar
Frågor
Källor
Anteckningar
```

Only show sections that contain saved items.

---

## Saved Item Preview

A saved room preview should contain only:

- title
- short summary
- theme or question
- date saved, if useful

Do not display:

- reading progress
- completion state
- popularity
- number of visits
- rankings
- recommendation labels

Metadata should remain restrained.

---

## Empty State

When nothing has been saved, use calm and direct language.

Suggested Swedish copy:

> Du har inte sparat något ännu.

Optional secondary text:

> När en text berör dig kan du lägga ett bokmärke här.

Avoid pressure or encouragement to build a collection.

---

## Notes

Notes are private reflections written by the user.

They should not feel like:

- journaling homework
- a productivity system
- a knowledge-management database
- a social post
- an assignment

The note feature exists only to preserve a thought that might otherwise disappear.

---

## Writing a Note

Inside a room, the user may open a note field through a quiet action.

Suggested Swedish label:

> Skriv ner en tanke

The field should remain closed by default.

The application must not ask the user to write after every room.

---

## Note Prompt

The note field may contain a subtle placeholder.

Suggested Swedish placeholder:

> Skriv det du vill bära med dig.

Avoid guided prompts such as:

- Vad lärde du dig?
- Hur ska du använda detta?
- Beskriv tre insikter.
- Sätt upp ett mål.

The user decides what, if anything, should be written.

---

## Note Length

Notes may be short or long.

The interface should work equally well for:

- one sentence
- a short paragraph
- a longer reflection

Do not impose minimum length.

A practical maximum may exist for technical reasons, but it should be generous and invisible under normal use.

---

## Autosave

Notes should save automatically.

The user should not need to manage a save workflow.

Autosave feedback should be subtle.

Suggested Swedish status:

> Sparat

Avoid persistent spinners or success notifications.

---

## Editing Notes

The user may edit a note at any time.

Editing should not create visible versions, scores or revision history in the interface.

Technical versioning may exist internally for recovery, but it should remain hidden unless needed.

---

## Deleting Notes

Deleting a note should require a simple confirmation because the content is personal and may not be recoverable.

Suggested Swedish confirmation:

> Ta bort anteckningen?

Actions:

- Ta bort
- Avbryt

If recovery is available, a temporary undo action may be shown.

---

## Notes and Sources

Each note should retain a connection to the room, question, path or source where it was created.

This allows the user to return to the original context.

A note should never become detached from its origin unless the user explicitly creates a standalone note in a future version.

---

## Notes Overview

The notes overview should be calm and chronological.

Possible display:

- note excerpt
- connected room title
- date last edited

Do not use:

- productivity dashboards
- tag clouds
- completion counts
- writing streaks
- word-count goals
- daily review prompts

Search may be added if the user has many notes.

---

## Sorting

Default sorting should be simple.

Recommended default:

> Senast ändrad

Optional alternatives:

- Äldst
- Titel

Avoid complex sorting and filtering unless real user need appears.

---

## Search

Search may include saved items and notes.

Search results should remain grouped by type.

Example:

```text
Rum
Anteckningar
Källor
Vandringar
```

Search must not expose private note content outside the user’s own account or device.

---

## Privacy

Notes are private by default.

They must never be:

- public
- indexed by search engines
- used for social features
- shared automatically
- used to generate public recommendations
- exposed to other users

If cloud synchronisation is introduced, notes should be protected in transit and at rest.

---

## AI Access

AI must not read or process personal notes unless the user explicitly requests it.

The application must not silently use notes to:

- personalise recommendations
- infer beliefs
- infer emotional state
- build behavioural profiles
- generate engagement prompts

Any future AI-assisted note feature must be opt-in and transparent.

---

## Local Storage and Synchronisation

The first implementation may store notes and saved items locally.

If synchronisation is later added:

- the local copy should remain usable offline
- conflicts should be resolved safely
- user data should be exportable
- accidental loss should be recoverable
- synchronisation should remain invisible during normal use

The user should not need to understand the storage architecture.

---

## Export

The user should be able to export personal notes and saved references.

Preferred formats:

- Markdown
- JSON
- plain text

The export should include:

- note text
- connected room or source
- creation date
- last updated date

Saved items without notes may be exported as a simple list of references.

---

## Import

Import is optional for the first version.

If added later, it should accept the same open formats used for export.

The user’s reflections must never be locked into one implementation of Visdomsatlasen.

---

## Bookmarks vs Notes

Saving and writing a note are separate actions.

Saving means:

> I want to find this place again.

Writing a note means:

> I want to preserve what this brought to mind.

The interface should not require one action before the other.

---

## Saved Paths

A saved path means the user may want to return.

It does not represent a commitment to finish.

The saved path preview may show the last opened room for orientation.

Do not show:

- completion percentage
- remaining rooms
- overdue state
- completion encouragement

---

## Recently Opened Items

Recently opened rooms may be stored for orientation.

This history should remain secondary.

It must not appear as a demanding queue.

Suggested Swedish heading:

> Senast besökt

Avoid:

- Fortsätt läsa
- Du har inte läst klart
- Återuppta din aktivitet

Recently opened items may be cleared by the user.

---

## Visual Design

Notes and saved items should use the same calm visual language as the rest of Visdomsatlasen.

They should resemble:

- bookmarks
- margin notes
- a private notebook

They should not resemble:

- task cards
- dashboards
- social posts
- collectible tiles

No emojis should be used.

---

## Mobile Experience

On mobile:

- save controls should be reachable but unobtrusive
- note fields should open without covering the source text unnecessarily
- the keyboard should not cause layout instability
- notes should autosave reliably
- long notes should remain comfortable to edit
- saved lists should remain finite and easy to scan

A full-screen note editor may be used on small screens if it improves focus.

---

## Accessibility

Notes and saved items must support:

- semantic labels
- keyboard navigation
- screen readers
- visible focus states
- large touch targets
- scalable text
- sufficient contrast
- clear confirmation before destructive actions

Save state must not rely on colour alone.

---

## Data Requirements

Editorial content and user state must remain separate.

Example saved item state:

```ts
type SavedItem = {
  id: string;
  itemType: "room" | "path" | "question" | "source";
  itemId: string;
  savedAt: string;
};
```

Example note:

```ts
type Note = {
  id: string;
  ownerId?: string;
  parentType: "room" | "path" | "question" | "source";
  parentId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};
```

Example recently opened state:

```ts
type RecentItem = {
  itemType: "room" | "path" | "question" | "source";
  itemId: string;
  openedAt: string;
};
```

User-generated data must not be stored inside editorial content files.

---

## Acceptance Criteria

Notes and saved items are correctly implemented when:

- [ ] Saving is optional and visually quiet.
- [ ] Saved items do not display progress or achievement metrics.
- [ ] Notes remain closed until the user chooses to write.
- [ ] Notes save automatically.
- [ ] Notes remain connected to their original context.
- [ ] Personal notes are private by default.
- [ ] AI does not access notes without explicit user consent.
- [ ] Saved paths do not imply an obligation to finish.
- [ ] Recently opened items are used only for orientation.
- [ ] User data can be exported in an open format.
- [ ] The experience works well on mobile.
- [ ] No emojis are used.

---

## Out of Scope

The first version should not include:

- social sharing of notes
- public profiles
- collaborative notebooks
- comments
- likes
- writing goals
- note streaks
- achievement systems
- automatic AI analysis of notes
- emotional profiling
- engagement-based reminders
- complex knowledge graphs built from personal notes

These features would make the experience more demanding, less private or more product-oriented than intended.

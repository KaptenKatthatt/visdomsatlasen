# Reading Room

## Purpose

The Reading Room is the primary experience of Visdomsatlasen.

It should give the user a defined moment with one thought, without any demand to perform, continue reading or make additional choices.

A single visit to the Reading Room should be able to constitute the entire visit to the application.

---

## Core Principle

> The Reading Room should feel like a comfortable armchair, a good book and time that does not need to be used for anything else.

The Reading Room is not a feed.

It is not a homepage filled with recommendations.

It is not a list of content.

It is a place where the user stays with one text.

---

## Entry into the Reading Room

When the user opens Visdomsatlasen, the Reading Room should be the clear starting point.

The user is presented with the question:

> Vad vill du bära med dig idag?

Below the question, a small number of universal human themes are shown.

Examples:

- Lugn
- Mening
- Mod
- Sanning
- Lidande
- Människan

The number of choices should remain low.

Six options are a guideline, not a strict requirement.

More specific entry points such as Jesus, Stoicism, history and individual traditions belong primarily in the Library.

---

## Minimum Possible Decision-Making

The user should not need to choose:

- author
- book
- tradition
- historical period
- text length
- difficulty
- reading order

The user only chooses what they need at that moment.

The application then selects an appropriate reflection room within that theme.

---

## Direct Entry

The flow should remain short:

```text
Open the application
    ↓
Choose a theme
    ↓
The Reading Room opens
    ↓
Read and pause
    ↓
Leave when the experience feels complete
```

No intermediate pages are required between the theme and the reflection room.

---

## One Room at a Time

The Reading Room always displays one reflection room.

It must not contain:

- lists of additional texts
- related rooms
- recommendations
- next buttons
- autoplay
- popular content
- unread indicators
- progress bars

The user should never feel that something else is waiting.

---

## Room Structure

A reflection room consists of the following sections.

### 1. Title

A short and quiet title.

Examples:

- Det du inte kan styra
- Att döma en annan
- När allt känns osäkert
- Att bära sorg
- Mod utan säkerhet

The title should describe the thought, not the source.

Avoid names of people, books and traditions in the main title.

### 2. Quiet Opening

Two to four short paragraphs that help the user settle into the question.

The opening should not:

- explain everything
- teach
- summarize the source material
- tell the user how they should feel

It should simply open the room.

### 3. Core Text

The core text is the main part of the room.

It should:

- focus on one idea
- be comfortable to read slowly
- work without prior knowledge
- remain concentrated
- avoid informational filler

Guideline:

- approximately 250–600 words
- approximately 3–6 minutes of calm reading

Shorter is preferable when the text still feels complete.

### 4. Pause

After the core text, there should be clear visual space.

No new function should immediately demand attention.

The pause may consist of:

- additional vertical space
- a subtle divider
- a short empty area
- one quiet sentence

The pause must not contain animations or calls to action.

### 5. Thought to Carry

A short thought that gathers the essence of the room.

It should be:

- one sentence
- easy to remember
- free from preaching
- free from names and authority

It should not be presented as a final answer.

### 6. Questions in Stillness

A maximum of three open questions.

The questions should help the user remain with the thought.

They must not feel like assignments.

Avoid wording such as:

- What have you learned?
- How will you apply this?
- What is the correct answer?
- Write three examples.

Prefer questions such as:

- What happens when you try to control what lies beyond your influence?
- Is there something you can leave unresolved today?
- What would courage mean in this situation?

### 7. Source

The source is shown below a thin horizontal rule, as the first line of the
room's quiet colophon: the name of the author — or, when no author fits,
the work — set in small letter-spaced capitals in the soft meta colour,
the same typographic voice as the theme label at the top of the room.

Example:

```text
EPIKTETOS ▾
```

The downward caret is deliberate. It promises that the content opens in
place — it does not lead away. Tapping the name reveals the full source
information (work, passage, editorial treatment, translation status,
uncertainty) in a quiet sheet or inline expansion that returns the reader
to the same spot. It must contain no links onward.

The source must always be present.

It must never be hidden.

However, everything beyond the name is shown only on request.

The rationale: the pull of onward clicking lives in navigation, not in
links themselves. Doors that open in place and end are self-limiting.

### 8. Optional Context

Historical context is the second line of the colophon, in the same
letter-spaced capitals, with the same downward caret:

```text
HISTORISK BAKGRUND ▾
```

It has no frame or border. Tapping unfolds the context text in place,
directly below the line, as one more quiet paragraph. Collapsing it —
or ignoring it — is equally natural.

Deeper material remains collapsed by default.

It must not lead directly to additional rooms, and the unfolded text
must contain no links.

The room's final line is always the inward action (Skriv ner en tanke),
never a door.

---

## Ending the Room

When the user reaches the end, the room should feel complete.

No new text should begin automatically.

No recommendation should be shown.

Permitted concluding actions:

- Save the thought
- Write a note
- View the source
- Return to the Reading Room
- Close the application

Closing the application is a valid and desired outcome.

---

## Returning to the Reading Room

When the user returns after reading a room, the application must not show:

- how much has been read
- what has been missed
- how many rooms remain
- daily goals
- statistics

The Reading Room always begins again in the present.

The question returns:

> Vad vill du bära med dig idag?

---

## Selecting a Text

When a theme is selected, the application may choose a room using one of the following methods:

1. An editorially selected default room.
2. A calm random selection among approved rooms.
3. A room the user has not opened recently.

Selection must not be optimized for engagement.

It must not create an addictive recommendation feed.

User history may only be used to avoid unnecessary repetition.

---

## When the User Wants to Choose

A quiet option may be available:

> Välj en annan text

It should not be the primary action.

When opened, it should show a small number of alternatives rather than the entire Library.

Example:

```text
Lugn

Det du inte kan styra
Att låta något vara olöst
När tankarna inte vill tystna
```

No more than three to five options should be shown at once.

---

## Notes

Notes should be optional and private.

They should not feel like journaling, productivity or an assignment.

A simple control is sufficient:

> Skriv ner en tanke

The note field should not open automatically.

---

## Saved Rooms

The user may save a room for later.

Saving should remain quiet.

It must not be described as:

- collecting
- achievement
- library points
- completed content

It is simply a bookmark placed inside a book.

The save action lives at the end of the room, after the source reference.
The reader should not encounter it until the reading is finished.

The reading top bar contains no bookmark icon. Chapter bookmarks belong to
the Library texts only, where they mark where the reader stopped — like a
bookmark in a physical Bible, or on a Kindle. Rooms are read whole and are
saved whole.

---

## Visual Design

When the user is inside the Reading Room, the rest of the navigation should recede.

The focus should remain on:

- text
- typography
- whitespace
- reading rhythm

The Reading Room must never use emojis.

Icons should only be used when their meaning is immediately clear.

Text labels are often preferable.

---

## Mobile Experience

The Reading Room is developed mobile first.

On mobile:

- the text should be comfortable to read with one hand
- line length should remain limited
- text size should be sufficiently large
- touch targets should be accessible
- fixed elements must not cover the text
- navigation should remain quiet

Reading is more important than the amount of information visible on the screen.

---

## Accessibility

The Reading Room should support:

- adjustable text size
- sufficient colour contrast
- screen readers
- keyboard navigation
- reduced motion
- clear heading hierarchy
- semantic HTML

Calm must never be achieved by reducing clarity.

---

## Acceptance Criteria

The Reading Room is correctly implemented when:

- [ ] The user can open the application and reach a text with one choice.
- [ ] Only one reflection room is shown at a time.
- [ ] The room has no automatic next content.
- [ ] The source is available but not visually dominant.
- [ ] Deeper context is optional and collapsed by default.
- [ ] The user can leave without feeling that something remains unfinished.
- [ ] The interface contains no performance tracking.
- [ ] The interface contains no engagement-driven recommendations.
- [ ] The experience works well on mobile.
- [ ] The text is the clearest element on the page.
- [ ] No emojis are used.

---

## Out of Scope

The following do not belong in the Reading Room:

- full-text search
- advanced filters
- people indexes
- tradition indexes
- timelines
- large collections
- social features
- automatic reading plans
- gamification

These features belong either in the Library or nowhere in Visdomsatlasen.

# Home and Entry

## Purpose

The home experience is the threshold into Visdomsatlasen.

Its purpose is not to present the full application.

It is not a dashboard.

It is not a catalogue.

It is not a place for updates, statistics or recommendations.

The home experience should help the user enter the Reading Room with as little effort as possible.

---

## Core Principle

> The home experience should ask for one simple choice and then get out of the way.

The user should not need to understand the structure of Visdomsatlasen before using it.

The first visit should be as easy as every later visit.

---

## Primary Question

The main question on the home screen is:

> Vad vill du bära med dig idag?

This question is the primary entry into the Reading Room.

It should receive the strongest visual emphasis on the page.

No competing headline, promotion or content section should draw more attention.

---

## Primary Themes

Below the main question, the user is shown a small number of broad human themes.

Initial recommended set:

- Lugn
- Mening
- Mod
- Sanning
- Lidande
- Människan

These themes are not permanent simply because they appear in the first version.

They should be reviewed editorially over time.

The visible set should remain small.

Recommended:

- minimum: 4
- preferred: 6
- maximum: 8

A larger taxonomy may exist internally, but the home screen should not expose it.

---

## Theme Selection

Selecting a theme should open an appropriate reflection room directly.

The user should not pass through:

- a theme overview
- a list of rooms
- a filter screen
- a source selection
- a reading-length choice
- a difficulty choice

The intended flow is:

```text
Open Visdomsatlasen
    ↓
Choose one theme
    ↓
Enter one reflection room
```

One choice should be enough.

---

## Theme Labels

Theme labels should be:

- short
- familiar
- emotionally understandable
- broad enough to contain several questions
- free from academic language
- free from religious terminology

Good examples:

- Lugn
- Mod
- Mening
- Sorg
- Förlåtelse
- Ansvar
- Hopp
- Frihet

Avoid labels such as:

- Existentialism
- Soteriology
- Moral philosophy
- Christian ethics
- Hellenistic thought
- Psychological resilience

Those concepts may exist in the Library or source metadata, but not as primary home choices.

---

## Tone of the Home Screen

The home screen should feel like an invitation.

It should not feel like:

- onboarding
- a content portal
- a productivity dashboard
- a meditation streak screen
- a learning platform
- a personalised feed

The page should create the sense that nothing is required.

---

## Supporting Text

A short supporting sentence may appear near the main question.

It should remain brief.

Suggested Swedish copy:

> Välj en tanke att stanna hos en stund.

Alternative:

> En enda tanke räcker.

Only one supporting sentence should be shown.

Long explanatory introductions belong elsewhere.

---

## Brand Presence

The name Visdomsatlasen should be visible but restrained.

The brand must not dominate the purpose of the screen.

The user should notice the invitation before noticing the product identity.

A small title or wordmark is sufficient.

---

## Layout

The page should contain very few primary elements.

Recommended structure:

```text
Visdomsatlasen

Vad vill du bära med dig idag?

Välj en tanke att stanna hos en stund.

Lugn
Mening
Mod
Sanning
Lidande
Människan

Biblioteket
```

This is a conceptual structure, not a requirement to use a literal vertical list.

The visual design may use:

- quiet text links
- restrained tiles
- a simple grid
- book-tab-like controls

The theme controls must not resemble colourful app cards.

---

## Theme Presentation

Themes should receive equal visual weight.

No theme should appear:

- trending
- featured
- recommended
- personalised
- more important than another

The interface should not create a hierarchy unless there is a clear editorial reason.

---

## Optional Random Entry

A quiet secondary action may offer a room without requiring a theme choice.

Suggested Swedish label:

> Välj åt mig

Alternative:

> Öppna ett rum

This action should choose among approved reflection rooms.

The selection should not be based on engagement optimisation.

It may consider:

- recently opened rooms, to avoid immediate repetition
- editorial balance
- published status
- theme availability

It must not attempt to infer the user’s emotional state.

---

## Returning Users

The home screen should remain almost identical for returning users.

Do not replace the main question with:

- Fortsätt där du slutade
- Välkommen tillbaka
- Du läste senast
- Dagens mål
- Din aktivitet

The application always begins in the present.

Recently opened material may be available elsewhere as a secondary orientation feature.

It must not take over the threshold experience.

---

## First-Time Users

The first-time experience should not require a multi-step onboarding flow.

The interface should be understandable without explanation.

A short optional introduction may be available behind a secondary link.

Suggested Swedish label:

> Om Visdomsatlasen

The introduction may explain:

- what the Reading Room is
- that one text is enough
- that sources are available
- that there is no progress system

The user should be able to ignore this and begin immediately.

---

## Navigation

Primary navigation should remain visually quiet on the home screen.

Recommended destinations:

- Läsrummet
- Biblioteket
- Sparat
- Inställningar

The current home experience may itself represent Läsrummet.

If so, a separate home destination is unnecessary.

Avoid duplicating:

- Hem
- Start
- Läsrummet

when they lead to essentially the same place.

---

## Library Entry

The Library should be available as a secondary action.

Suggested Swedish label:

> Gå till Biblioteket

or simply:

> Biblioteket

It should not compete visually with the primary themes.

Entering the Library is a deliberate choice to explore.

---

## Saved Entry

A quiet link to saved rooms and notes may be available.

Suggested Swedish label:

> Sparat

It should not display:

- counts
- unread indicators
- notification dots
- progress

The user should not feel that saved material is waiting to be dealt with.

---

## Time of Day

The home screen should not change its message based on time of day unless the change is purely atmospheric and does not create new choices.

Avoid:

- morning routines
- evening goals
- daily prompts
- time-sensitive content
- “today’s streak”
- “your morning reflection”

Visdomsatlasen should be equally welcoming at any hour.

---

## Daily Content

A “daily thought” should not be the primary home experience.

Daily content can create:

- obligation
- fear of missing something
- habit pressure
- unnecessary temporality

If a daily room is introduced later, it should remain optional and available without expiry.

Missing a day must have no consequence.

---

## Personalisation

The home screen should not become a personalised recommendation feed.

Allowed personalisation is limited to reducing friction.

Examples:

- remembering text-size preferences
- remembering light or dark appearance
- avoiding immediate room repetition
- remembering preferred language settings

Do not personalise the visible themes based on inferred beliefs, emotional state or reading history.

---

## Transition into the Reading Room

After theme selection, the transition should feel direct and calm.

It may use a subtle page transition to support orientation.

It must not use:

- loading theatrics
- inspirational quotations
- animated progress indicators
- artificial waiting
- sound effects

If loading is required, use a quiet and accessible state.

---

## Error States

If no room is available for a selected theme, the application should fail calmly.

Suggested Swedish copy:

> Det finns inget färdigt rum här ännu.

Optional secondary action:

> Välj ett annat tema

Do not expose technical errors to the user.

Do not substitute an unreviewed draft.

---

## Offline Behaviour

The home screen and a useful set of reflection rooms should be available offline where practical.

If a selected room is unavailable offline, say so clearly and quietly.

Suggested Swedish copy:

> Den här texten är inte tillgänglig utan anslutning ännu.

Offer a return action rather than a complex error screen.

---

## Mobile Experience

The home experience is mobile first.

On mobile:

- the primary question should appear without unnecessary scrolling
- theme choices should be easy to reach
- controls should have accessible touch sizes
- the screen should not feel crowded
- secondary navigation should remain visually quiet
- no fixed element should dominate the view

The user should be able to enter a reflection room comfortably with one hand.

---

## Desktop Experience

On desktop, additional space should create calm rather than more content.

Do not fill the page with:

- additional themes
- source previews
- featured paths
- recent content
- statistics

A larger screen should feel like a larger reading room, not a larger dashboard.

---

## Accessibility

The home experience must support:

- semantic headings
- keyboard navigation
- visible focus states
- screen readers
- large touch targets
- scalable text
- sufficient colour contrast
- reduced motion

Theme controls must be understandable without relying on colour or position alone.

---

## No Emojis

The home experience must never use emojis.

This includes:

- theme labels
- buttons
- empty states
- onboarding
- system feedback
- decorative elements

If a symbol is needed, use restrained typography or a carefully selected icon with a clear purpose.

---

## Acceptance Criteria

The home and entry experience is correctly implemented when:

- [ ] The primary question is the clearest element on the screen.
- [ ] The user can enter a reflection room with one choice.
- [ ] No dashboard, feed or content catalogue appears before the Reading Room.
- [ ] The visible theme set contains no more than eight choices.
- [ ] Themes are broad human experiences rather than source categories.
- [ ] Returning users are not shown progress or unfinished activity.
- [ ] The Library remains available but secondary.
- [ ] No engagement metrics or notification indicators are shown.
- [ ] The page works well on mobile.
- [ ] The screen feels calm even before a room is opened.
- [ ] No emojis are used.

---

## Out of Scope

The home screen must not include:

- news
- trending rooms
- personalised content feeds
- popularity rankings
- completion tracking
- reading statistics
- streaks
- daily goals
- social activity
- promotional carousels
- featured authors
- featured traditions
- large content indexes
- mandatory onboarding

These features would increase decision-making and weaken the purpose of the threshold experience.

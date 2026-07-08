# Room Selection

## Purpose

Room selection determines which reflection room is opened after the user chooses a theme in the Reading Room.

The selection process should reduce decision-making without becoming opaque, manipulative or engagement-driven.

The user makes one broad choice.

The application then chooses one suitable room.

---

## Core Principle

> Selection should feel like opening a well-chosen page, not entering a recommendation engine.

The application may help the user begin.

It must not attempt to hold the user’s attention.

---

## Selection Input

The primary input is the theme selected by the user.

Examples:

- Lugn
- Mening
- Mod
- Sanning
- Lidande
- Människan

The selected theme defines the eligible room set.

The application must not infer a different theme from:

- reading history
- personal notes
- time of day
- device usage
- emotional profiling
- external data

The user’s explicit choice remains authoritative.

---

## Eligible Rooms

A room may be selected only when it:

- has `published` status
- belongs to the selected theme
- has passed all required editorial checks
- has valid source references
- is available in the current language
- can be rendered in the Reading Room
- is available offline when the application is offline

Draft, review, archived or incomplete rooms must never be selected.

---

## Selection Modes

The system may support the following selection modes.

### Editorial Default

Each theme may define one default room.

This is the safest initial implementation.

Example:

```ts
type Theme = {
  id: string;
  slug: string;
  label: string;
  defaultRoomId: string;
};
```

The default room should be:

- broadly relevant
- easy to enter without context
- representative of the theme
- calm in tone
- suitable for repeated reading

---

### Quiet Rotation

A theme may rotate through a small editorially approved set of rooms.

The purpose is to avoid immediate repetition.

It is not intended to maximise novelty.

The system may consider:

- the most recently opened room within the theme
- a short local history of recently shown rooms
- editorial priority
- room availability

It must not consider engagement metrics.

---

### User-Initiated Random Selection

A secondary action such as:

> Välj åt mig

may select one room from all eligible themes or from a chosen theme.

The result should be genuinely restrained.

Do not present a rapid sequence of random rooms.

One selection is enough.

---

## Recommended Initial Strategy

The first implementation should use:

1. An editorial default for each theme.
2. A small list of alternative rooms.
3. Local recent-history avoidance.
4. No behavioural personalisation.

This keeps the system predictable and easy to verify.

---

## Recent-History Avoidance

The application may remember recently opened room IDs.

This memory exists only to reduce unnecessary repetition.

Recommended behaviour:

- avoid the last room shown within the same theme
- optionally avoid the last two or three rooms
- allow repetition when no suitable alternative exists
- never mark repetition as failure

Example:

```ts
type RoomSelectionHistory = {
  recentRoomIds: string[];
  updatedAt: string;
};
```

The history should remain small.

It is not an activity log.

---

## Repetition

Repetition is not inherently negative.

A room may be worth revisiting.

The system should avoid immediate repetition, but it should not prevent rooms from returning over time.

Do not create a rule that every room must be seen before any room repeats.

That would turn selection into hidden progress tracking.

---

## Editorial Weight

Rooms may include an optional editorial weight.

Example:

```ts
type RoomSelectionMetadata = {
  roomId: string;
  themeIds: string[];
  selectionWeight?: number;
  isDefault?: boolean;
};
```

Weight may be used to make some rooms appear more often.

It must only reflect editorial suitability.

It must not reflect:

- popularity
- click-through rate
- reading duration
- return frequency
- save rate
- note activity

Default weight should be equal.

---

## Multiple Themes

A room may belong to more than one theme.

Example:

```ts
type RoomThemeRelation = {
  roomId: string;
  themeIds: string[];
};
```

A room about accepting uncertainty may belong to:

- Lugn
- Mod
- Mening

The room should still have one primary question and one central idea.

Theme membership is a selection aid, not the room’s identity.

---

## Source Diversity

Selection should not force source diversity.

The system must not choose a room merely because the previous room came from another tradition.

Source origin should not be part of engagement balancing.

However, the editorial set within a theme may intentionally contain several perspectives where they genuinely deepen the theme.

---

## Selection Transparency

The user does not need to see the internal selection logic.

The interface should simply open the room.

The system must not display:

- “Recommended for you”
- “Chosen by our algorithm”
- “Because you read...”
- confidence scores
- ranking explanations

The selection should feel quiet and natural.

---

## Choosing Another Room

A secondary action may allow the user to request another room.

Suggested Swedish copy:

> Välj en annan text

This action should not create a slot-machine interaction.

Recommended limits:

- show three to five editorial alternatives
- or make one additional selection
- avoid repeated reshuffling
- do not animate the result theatrically

The user should not be encouraged to browse repeatedly before reading.

---

## Empty Theme State

If a theme has no eligible rooms, the application must not substitute:

- a draft
- an unverified room
- a loosely related theme
- AI-generated temporary content

Suggested Swedish copy:

> Det finns inget färdigt rum här ännu.

Optional actions:

- Välj ett annat tema
- Gå till Biblioteket

The failure state should remain calm and honest.

---

## Single Available Room

If only one eligible room exists for a theme, open it.

Do not apologise for the lack of alternatives.

Do not expose internal inventory.

One carefully chosen room is sufficient.

---

## Offline Selection

When offline, selection must use only locally available published rooms.

If the theme contains no offline room, show a clear message.

The application must not appear to load indefinitely.

Offline selection should follow the same recent-history rules when practical.

---

## Saved Rooms

Saved state should not increase the probability that a room is selected.

Saving means the user wants to find a room again.

It does not mean the application should repeatedly present it.

Similarly, unsaved rooms must not be treated as lower quality.

---

## Notes and Private Data

Personal notes must never influence room selection.

The system must not analyse notes to infer:

- emotional state
- beliefs
- problems
- preferred traditions
- mental health
- future reading needs

Any future feature that uses personal text must require explicit, specific consent.

---

## Time and Location

Room selection must not change according to:

- morning or evening
- weekday
- season
- location
- weather
- current events

unless the user explicitly chooses such a mode in a future version.

The default experience remains timeless.

---

## Analytics

Selection analytics may be used only to identify technical problems.

Examples:

- a room fails to load
- a theme has no eligible rooms
- a broken relation references a missing room

Analytics must not be used to optimise:

- clicks
- session length
- retention
- room completion
- saves
- continued reading

---

## Deterministic Testing

The selection function should allow deterministic testing.

Example:

```ts
type SelectRoomOptions = {
  themeId: string;
  eligibleRooms: Room[];
  recentRoomIds?: string[];
  seed?: string;
};
```

A test seed may be used to reproduce a selection.

Production use does not need to expose the seed.

---

## Suggested Selection Algorithm

A simple selection process is preferred.

```text
1. Load published rooms connected to the selected theme.
2. Remove rooms unavailable in the current context.
3. Exclude the most recently shown room when alternatives exist.
4. Prefer the editorial default on the first visit.
5. Otherwise select from the remaining editorial set.
6. Open one room.
```

No machine-learning model is required.

No remote recommendation service is required.

---

## Example Pseudocode

```ts
function selectRoom({
  themeId,
  eligibleRooms,
  recentRoomIds = [],
}: SelectRoomOptions): Room | null {
  const themeRooms = eligibleRooms.filter((room) =>
    room.themeIds.includes(themeId),
  );

  if (themeRooms.length === 0) {
    return null;
  }

  const defaultRoom = themeRooms.find((room) => room.isDefault);

  if (recentRoomIds.length === 0 && defaultRoom) {
    return defaultRoom;
  }

  const recentSet = new Set(recentRoomIds.slice(0, 3));

  const nonRecentRooms = themeRooms.filter((room) => !recentSet.has(room.id));

  const candidates = nonRecentRooms.length > 0 ? nonRecentRooms : themeRooms;

  return chooseEditoriallyWeightedRoom(candidates);
}
```

The implementation may differ, but it should remain understandable without specialised recommendation knowledge.

---

## Data Requirements

Suggested theme model:

```ts
type Theme = {
  id: string;
  slug: string;
  label: string;
  description?: string;
  defaultRoomId?: string;
  roomIds: string[];
  status: "draft" | "published" | "archived";
};
```

Suggested selection state:

```ts
type ThemeSelectionState = {
  themeId: string;
  recentRoomIds: string[];
  lastSelectedAt?: string;
};
```

Selection state belongs to user or device state.

It must not be stored inside editorial room files.

---

## Acceptance Criteria

Room selection is correctly implemented when:

- [ ] One theme choice opens one published reflection room.
- [ ] Draft and unverified rooms can never be selected.
- [ ] Immediate repetition is avoided when alternatives exist.
- [ ] Repetition remains possible over time.
- [ ] Selection does not use engagement metrics.
- [ ] Selection does not analyse notes or private user text.
- [ ] Source traditions do not affect selection unless editorially configured.
- [ ] The user can request another room without entering an endless shuffle loop.
- [ ] Empty themes fail calmly and never show unreviewed content.
- [ ] Offline selection only uses locally available rooms.
- [ ] The algorithm is simple, testable and understandable.
- [ ] No emojis are used in related UI copy.

---

## Out of Scope

Room selection must not include:

- machine-learning recommendations
- behavioural profiling
- emotional inference
- recommendation feeds
- popularity ranking
- collaborative filtering
- engagement optimisation
- automatic theme switching
- note analysis
- daily scheduling
- urgency
- hidden progress systems
- infinite reshuffling

These features would make selection more manipulative, more opaque or more demanding than intended.

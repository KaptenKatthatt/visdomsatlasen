# Review Language Checklist

## Purpose

The purpose of this checklist is to ensure that every room in Visdomsatlasen shares the same calm, timeless and reflective voice.

The goal is not beautiful writing.

The goal is clear, quiet and honest writing.

---

# 1. Tone

Read the room from beginning to end.

Ask yourself:

- [ ] Does the text feel calm?
- [ ] Does the text feel respectful?
- [ ] Does the text feel timeless?
- [ ] Does the text feel human?
- [ ] Does the text invite reflection rather than instruction?

---

# 2. Clarity

- [ ] Every sentence is easy to understand.
- [ ] Difficult words have been removed or explained.
- [ ] Paragraphs are short and comfortable to read.
- [ ] The reader never has to reread a sentence to understand it.

---

# 3. Rhythm

Read the text slowly.

- [ ] Does it breathe naturally?
- [ ] Is there enough whitespace?
- [ ] Do sections feel balanced?
- [ ] Are there natural pauses?
- [ ] Does the text encourage slow reading?

---

# 4. Remove AI Language

Look for generic AI phrases and remove them.

Examples include:

- "It is important to remember..."
- "In conclusion..."
- "Throughout history..."
- "This shows that..."
- "On the other hand..."
- "In today's society..."
- "Ultimately..."
- "One can say that..."

If a sentence sounds like it could appear in any AI-generated article, rewrite it.

---

# 4b. The Opening Must Not Tease

The opening (`## Öppning`) grounds the reader in something ordinary and familiar.
It must **land in the reader's everyday, or in an open question.** It must never
introduce the source — that is the job of `## Kärna`.

A **teaser** is any closing line that invites the reader to want more without
telling them what: a curiosity gap. It is clickbait, and it is not allowed. It
usually hides in a short final paragraph that points ahead to the source or the
story.

Forbidden (real examples that were removed):

- "Zhuangzi, den lekfullaste av de gamla kinesiska böckerna, berättar om en kock."
- "Daodejing har en bild för det."
- "En av buddhismens äldsta verser vänder blicken mot själva fasthållandet."
- "En gammal japansk sång vänder på den förutsättningen."
- "För över två tusen år sedan stod en gammal man inför en domstol i Aten … och vägrade spela med."

The fix: **delete the teaser line.** Let the opening end on the everyday
observation (or an open question), and let `## Kärna` name the source and tell the
story directly. Nothing is lost — the source is named in `## Kärna` and
`## Historisk kontext`.

This rule is enforced automatically: `check:content` (via
`src/content/redaktion/oppningsvakt.ts`) fails the build when a room's opening
teases, for drafts as well as published rooms. The check is a heuristic backstop
for the shapes we have seen — it is not a substitute for reading the opening and
asking: *does this lure, or does it simply begin?*

---

# 4c. The Opening Builds to a Landing

Decided by the editor 2026-07-17, after reviewing the batch-4 rooms: an opening
must not be a thin paragraph of throat-clearing. It carries its own arc — it
tells a whole story before the source ever appears.

The shape, in two paragraphs:

1. **Build the everyday concretely.** Small, specific scenes the reader
   recognizes — not abstractions. Not "vardagen rymmer friktion" but "någon
   tränger sig före i kön, någon svarar snävt på ett vänligt menat meddelande".
   Let the small things accumulate into the feeling the room is about.
2. **Turn, and land.** Examine the feeling the first paragraph built — does it
   hold? — and end on a *slutkläm*: often the room's own conclusion, stated
   plainly in the reader's language, with no source in sight.

Examples of landings (from approved rooms):

- "… Kanske är krockarna undantagen, inte regeln, och sanningen om oss den
  motsatta: vi är gjorda för att verka tillsammans." (Gjorda för varandra)
- "… Kanske är det inte livet som är för kort. Kanske är det vi som gör det
  kort." (Livets korthet)

When the opening lands the conclusion itself, the Kärna must not re-introduce
it as news. Let the source *confirm* what the reader just arrived at: "Marcus
Aurelius … påminde sig om detsamma", "En romersk filosof kom fram till just
det". The insight belongs to the reader first; the source joins them.

This does not loosen the teaser rule: the opening still never names or hints
at the source. A slutkläm states the thought outright — the opposite of a
curiosity gap that dangles it.

---

# 5. Remove Unnecessary Words

Read every paragraph.

For each sentence, ask:

- [ ] Does this sentence add something?
- [ ] Can it be shorter?
- [ ] Can two sentences become one?
- [ ] Does this explain something the reader already understands?

When in doubt, remove it.

---

# 6. Reflection

The room should create space for thought.

- [ ] Does the room leave unanswered questions?
- [ ] Does the reader have space to think?
- [ ] Does the room avoid forcing a conclusion?
- [ ] Does the room avoid preaching?

---

# 7. Respect the Reader

- [ ] The room assumes the reader is intelligent.
- [ ] The room never talks down to the reader.
- [ ] The room never tells the reader what to believe.
- [ ] The room presents ideas without demanding agreement.

---

# 8. The Red Pen

Perform one final editing pass.

Delete anything that is:

- repetitive
- obvious
- decorative
- verbose
- unnecessary

Every remaining sentence should earn its place.

---

# Final Reading

Put the text aside for a few minutes.

Then read it again slowly.

Ask yourself:

- [ ] Does this feel like Visdomsatlasen?
- [ ] Would I enjoy reading this in complete silence?
- [ ] Would I recommend this room to someone I care about?
- [ ] Does the room leave me with one clear thought rather than many competing ideas?

If any answer is **No**, revise the room before publishing.

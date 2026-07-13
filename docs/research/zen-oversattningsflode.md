# Översättningsflöde för klassiska zentexter

Forskningsrapport för Visdomsatlasen. Frågan: hur skapar vi egna svenska
översättningar av äldre japanska och kinesiska zentexter (public domain) med
hjälp av Ollama Cloud-modeller via Hermes-gatewayen — vilken modell, vilket
arbetsflöde, och med vilka skyddsräcken?

Testdatum: 2026-07-13. Experimentkod och rådata: `docs/research/zen-experiment/`
(passager med proveniens, samtliga modellutdata) och `scripts/zen-experiment/`
(körbart harness). Allt i denna rapport som kräver specialistverifiering är
markerat **[kräver specialistgranskning]**.

---

## 1. Exekutiv rekommendation

*(fylls i efter experimentkörningen)*

---

## 2. Källtabell

| # | Författare | Verk | Datering | Källspråk | Upphovsrätt (original) | Svårighet | Skäl för urval |
|---|---|---|---|---|---|---|---|
| P1 | Hakuin Ekaku (1686–1769) | Zazen wasan (坐禅和讃) | ca 1750-tal | Tidigmodern japanska (7-5-vers) | Public domain (död 1769) | Enkel | Enkel undervisningstext för lekfolk; testar ton och naturlig svenska |
| P2 | Wumen Huikai (1183–1260) | Wumenguan/Mumonkan, fall 7 med kommentar och vers | 1228 | Klassisk kinesiska (läst som kanbun) | Public domain (1228) | Medel | Kōan + kommentar; tre register; öppen segmentering i Taishō-interpunktionen |
| P3 | Dōgen (1200–1253) | Shōbōgenzō: Genjōkōan, öppningen | 1233 | Klassisk japanska (wabun) | Public domain (död 1253) | Svår | Språkligt svåraste författaren; omdiskuterade termer (豊倹, 跳出) |
| P4 | Linji Yixuan (d. 866); red. 1120 | Rinzai-roku: 無位真人-passagen | 800-tal/1120 | Klassisk kinesiska med Tang-talspråk | Public domain | Svår | Tung buddhistisk terminologi; filologiskt omtvistade ord (赤肉團, 面門, 乾屎橛) |
| P5 | Dōgen (1200–1253) | Shōbōgenzō: Uji, öppningen | 1240 | Kanbun-citat + klassisk japanska | Public domain (död 1253) | Mycket svår | Genuint tvetydigt nyckelord (有時); språkbyte mitt i passagen |

Fullständig proveniens (utgåva, transkriptionskälla med länk, PD-motivering,
transkriptionsanmärkningar) ligger i `docs/research/zen-experiment/passages/*.json`.
Kinesiskan är teckenexakt ur Taishō-utgåvan via CBETA:s XML
([T48n2005](https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T48/T48n2005.xml),
[T47n1985](https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T47/T47n1985.xml));
japanskan är kryssverifierad mot flera oberoende transkriptioner men bör
kollationeras mot SAT-databasen eller tryckt utgåva före publicering
**[kräver specialistgranskning]**.

Viktig distinktion: *originalen* är fria; *moderna utgåvors* interpunktion,
kanaval och styckeindelning är redaktionella tillägg (Taishō 1924–34, CBETA,
Iwanami). Vi återger utgåvans text med attribution och dokumenterar det som
utgåveberoende — inte som del av 1200-talstexten.

## Jämförelsereferenser (konsulterade, aldrig kopierade)

Etablerade översättningar användes som riktmärken vid poängsättningen, med
exakt attribution och utan att deras formuleringar återanvänds i föreslagna
svenska texter:

- *The Record of Linji*, öv. Ruth Fuller Sasaki, red. Thomas Yūhō Kirchner
  (University of Hawai'i Press, 2009) — standardutgåvan med Iriya Yoshitakas
  och Yanagida Seizans filologi ([UH Press](https://uhpress.hawaii.edu/title/the-record-of-linji/)).
- Norman Waddell & Masao Abe, *The Heart of Dōgen's Shōbōgenzō* (SUNY Press, 2002) —
  Genjōkōan och Uji.
- Kazuaki Tanahashi (red.), *Treasury of the True Dharma Eye* (Shambhala, 2010) —
  Genjōkōan och Uji ([förlagssida](https://www.shambhala.com/dogen/)).
- Shōhaku Okumura, *Realizing Genjōkōan* (Wisdom Publications, 2010) — kommentar
  ([Wisdom](https://wisdomexperience.org/product/realizing-genj%C5%8Dk%C5%8D/)).
- Katsuki Sekida, *Two Zen Classics: Mumonkan and Hekiganroku* (Weatherhill, 1977)
  och Zenkei Shibayama, *Zen Comments on the Mumonkan* (Harper & Row, 1974) — Mumonkan.
- Översiktskatalog över Genjōkōan-översättningar:
  [thezensite](http://www.thezensite.com/ZenTeachings/Dogen_Teachings/GenjoKoan8.htm).

Någon etablerad svensk översättning av Dōgen eller Rinzai-roku hittades inte i
sökningen (2026-07-13); svenskan bedöms därför mot norm för svensk sakprosa och
mot de engelska standardöversättningarnas semantik, inte mot en svensk
föregångare. **[kräver specialistgranskning om svensk utgåva finns]**

Terminologi kontrollerades mot fritt tillgängliga ordboksverk, främst Soothill &
Hodous, *A Dictionary of Chinese Buddhist Terms* (1937, public domain) samt
öppna poster i Digital Dictionary of Buddhism (buddhism-dict.net).

---

## 3. Modelljämförelse

*(fylls i efter experimentkörningen; exakta modelltaggar, kontextlängder och
datum dokumenteras maskinellt i `results/modeller.json`)*

---

## 4. Flödesjämförelse

*(fylls i efter experimentkörningen)*

---

## 5. Felanalys

*(fylls i efter experimentkörningen)*

---

## 6. Rekommenderad produktionspipeline

*(utkast — justeras efter experimentets utfall)*

Repeterbart flöde för en ny textpassage, i linje med
`docs/specs/source-and-context.md`, `docs/checklists/verify-sources.md` och
regeln att AI aldrig publicerar ensamt:

1. **Källverifiering.** Identifiera verk, författare, datering, språktyp.
   Hämta texten ur en spårbar transkription (CBETA/SAT för kanon; namngiven
   utgåva för japanska verk). Dokumentera Taishō-nummer eller motsvarande.
2. **Upphovsrättsverifiering.** Kontrollera originalets PD-status (upphovsmannens
   dödsår) och transkriptionens licens separat. Skilj original från utgåva.
3. **Originaltranskription.** Lägg passagen som teckenexakt fil med
   proveniensmetadata (formatet i `passages/*.json`).
4. **Modellöversättning.** Kör det rekommenderade flödet (se §1) med den
   rekommenderade modellen via Hermes. Ordagrann + läsbar version, tvetydighets-
   och terminologinoter, konfidens.
5. **Terminologiordlista.** För in valda termåtergivningar i en gemensam ordlista
   så att samma term återges lika i hela atlasen; avvikelser motiveras.
6. **Korsmodellsgranskning.** Låt granskningsmodellen (se §1) granska mot
   originalet med granskningsprotokollet (flöde D-prompten).
7. **Mänsklig granskning.** Redaktören läser original, översättning och noter
   mot `docs/checklists/review-language.md` och `verify-sources.md`; vid behov
   konsulteras specialist på klassisk japanska/kinesiska.
8. **Redaktionell slutbearbetning.** Anpassa till Visdomsatlasens ton
   (lugn, seriös, utan att tvetydigheter döljs); notera alla medvetna avsteg.
9. **Proveniensmetadata.** Spara översättningsposten (format i §7) tillsammans
   med rummet/källpassagen; publicering beslutas av ägaren enligt
   redaktionsflödet i CLAUDE.md.

---

## 7. Rekommenderat format för översättningspost

*(utkast — fältet `flode` m.m. låses efter §1)*

JSON (eller frontmatter) per översatt passage, förslagsvis under
`src/content/kallpassager/` när Fas 8 byggs:

```json
{
  "id": "rinzai-mui-shinnin",
  "original": "上堂云：「赤肉團上有一無位真人…",
  "kallreferens": {
    "verk": "Zhenzhou Linji Huizhao chanshi yulu",
    "utgava": "Taishō T47n1985, 0496c10–14",
    "transkription": "CBETA xml-p5 (hämtad 2026-07-13)",
    "lank": "https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T47/T47n1985.xml",
    "upphovsratt": "original public domain; interpunktion CBETA"
  },
  "engelskArbetsoversattning": null,
  "svenskOrdagrann": "…",
  "svenskLasbar": "…",
  "terminologinoter": [{ "term": "無位真人", "atergivning": "…", "motivering": "…" }],
  "osakerheter": ["…"],
  "modell": { "namn": "…", "digest": "…", "flode": "…", "datum": "2026-07-13" },
  "granskning": [
    { "typ": "korsmodell", "modell": "…", "datum": "…", "resultat": "…" },
    { "typ": "mansklig", "granskare": "ägaren", "datum": "…", "beslut": "…" }
  ],
  "status": "utkast"
}
```

Principer: originalet och dess proveniens är obligatoriska; den engelska
arbetsöversättningen sparas när den använts (transparens om härledningsvägen);
ordagrann och läsbar version hålls isär; osäkerheter följer med posten hela
vägen till publicering i stället för att strykas under putsningen.

---

## Bilagor

- Rådata: `docs/research/zen-experiment/results/` (alla prompter och svar,
  latenser, modellmetadata).
- Harness: `scripts/zen-experiment/run.ts` (återupptagbar; körs via
  `.github/workflows/zen-experiment.yml`).
- Modellkatalogläget 2026-07: Ollama Cloud omfattar bl.a. deepseek-v3.2 (671B),
  GLM-5.1, Kimi K2.6, Qwen 3.6-familjen, MiniMax M3, gpt-oss och Gemma 4;
  prissättning per abonnemang (Free/Pro/Max, debiterat efter GPU-tid). Källor:
  [Ollama cloud-katalog](https://ollama.com/search?c=cloud),
  [ollama/ollama på GitHub](https://github.com/ollama/ollama),
  [webreactiva: Ollama Cloud-modeller](https://www.webreactiva.com/blog/modelos-ollama-cloud),
  [angelo-lima: Ollama 2026](https://angelo-lima.fr/en/ollama-2026-state-of-the-art-en/).

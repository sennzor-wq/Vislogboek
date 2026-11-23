# Project work queue — Vislogboek

**Doel:** operationele eerstvolgende taken vastleggen. Dit bestand vervangt geen productvisie, roadmap of audit; het verwijst naar de bestaande canonieke documenten.
**Leidende repositorystatus:** actuele `main` en GitHub Actions.
**Laatste bijgewerkte context:** 23 november 2026.

## Algemene regels

- Volg `AGENTS.md` voor startprocedure, zelfstandige werkcyclus, Quality Gates en veiligheidsgrenzen.
- `PROJECT_CONTEXT.md` is leidend voor product-/architectuurafspraken.
- `VISLOGBOEK_VERBETERPLAN.md` is leidend voor fasering en acceptatiecriteria.
- `FASE2_PROGNOSE_AUDIT.md` is het bestaande auditbewijs voor Fase 2.
- Deze queue bevat alleen de operationele volgorde en actuele status; kopieer geen uitgebreide auditbevindingen hierheen.
- Werk steeds één taak tegelijk af. Na een geslaagde gate ga je door met de eerstvolgende taak die geen eigenaarbesluit vereist.
- Mergen naar `main` is nooit automatisch toegestaan.

## Actieve opdracht

**Hoofddoel:** Fase 2 van de bestaande prognose verbeteren en valideren, zodat de bestaande prognose betrouwbaarder wordt voor het voorspellen van visomstandigheden. De bestaande centrale prognose-engine blijft de enige bron van prognose-uitvoer; VisCoach gebruikt de prognose voor samenhangend advies. Maak geen afzonderlijke "VisCoach-prognose".

**Vaste grenzen:**
- Geen ongefundeerde biologische waarden, gewichten, coördinaten of weersgegevens.
- Geen verlies of onnodige duplicatie van data.
- Geen dagelijkse of meervoudige meetplicht voor de visser zonder aantoonbare noodzaak.
- Geen nieuwe UI-/productfunctie voordat de kandidaatlogica technisch en inhoudelijk is gevalideerd.
- Dagprognose, tijdvakprognose en persoonlijke vangkans houden hun eigen betekenis.
- Respecteer strikt de `targetTime`-as-of-grens; latere gegevens mogen eerdere prognoses niet beïnvloeden.
- Een groene Quality Gate is geen bewijs van biologische voorspellende nauwkeurigheid.

## Eerstvolgende taken

### F2-WP18 — kandidaat thermische uitvoer per intervalsegment
**Status:** technisch afgerond in open draft PR #218; 6 weerscenario’s × 10 soorten, volledige scorematrix, exacte tijdvakscorepariteit voor alle 10 soorten, persoonlijke vangkans null zonder sessies, immutable-snapshotreplay en volledige GitHub Quality Gate zijn groen op commit `fc08c636d99f3d32e4949fa76f7037f8c8948822` (run [45206087992](https://github.com/sennzor-wq/Vislogboek/actions/runs/45206087992)). De kandidaatcontracttest rapporteert 221 geslaagd, 0 mislukt. PR blijft draft en is niet gemerged; kandidaat staat dus nog niet op `main`.
**Branch:** `feat/fase2-thermal-interval-candidates`
**PR:** https://github.com/sennzor-wq/Vislogboek/pull/218

Acties:
1. Controleer de actuele PR-diff en meest recente Quality Gate-run; ga niet uit van eerder waargenomen status.
2. Controleer TypeScript-contracten en testdata in `src/services/prognosisIntervalThermal.ts` en `test-prognosis-interval-thermal.ts`.
3. **Afgerond:** zowel segmentatie als kandidaathelper ontvangen dezelfde daadwerkelijk gefilterde forecast-input; de test controleert dat het ontbrekende uur niet opnieuw wordt aangeleverd.
4. **Afgerond:** contracttests dekken ontbrekende thermische basisdata, expliciete unknown/null-semantiek, as-of-invariant en de kalibratiepariteit.
5. **Afgerond:** volledige bestaande Quality Gate geslaagd, inclusief typecheck, alle tests, dependency audits en productiebuild; run [45206087992](https://github.com/sennzor-wq/Vislogboek/actions/runs/45206087992).
5a. **Afgerond — synthetische simulatie:** 6 weerscenario’s (koud/stabiel, mild/stabiel, warm/stabiel, heet/stabiel, opwarming en afkoeling) × 10 doelsoorten = 60 deterministische combinaties; per combinatie worden bronstatus, finite temperatuur, efficiëntiegrenzen, 1–10 kandidaat-score en reproduceerbaarheid gecontroleerd. Extra checks testen extreme forecastwijzigingen ná `targetTime`, onvoldoende weershistorie zonder meetanker, beide Amsterdamse DST-overgangen en exacte scorepariteit met het bestaande representatieve tijdvak inclusief lokale kalibratie. De thermische kandidaat blijft beschikbaar terwijl persoonlijke vangkans zonder sessiehistorie null blijft. Een synthetische immutable `PrognosisSnapshot`-fixture is ook opnieuw doorgerekend vanuit exact opgeslagen `weatherInput` en `inputContext` (stekcontext en kalibratie); replay-uitvoer is identiek aan directe berekening.
6. **Afgerond via diff-review:** dagscore, tijdvakscore, bestaande intervaloutput, persoonlijke vangkans, UI en opgeslagen data zijn niet gewijzigd. De kandidaat gebruikt dezelfde gevalideerde lokale temperatuurkalibratie als de bestaande dag-/tijdvakprognose, uitsluitend voor modelschattingen; echte metingen en unknown-uitkomsten worden niet gecorrigeerd.
7. **Afgerond:** bestaande Fase-2-audit en queue bijgewerkt met exacte code- en CI-bewijsstatus.
8. Laat PR #218 open voor eigenaarbeoordeling; niet mergen zonder expliciete toestemming.

Acceptatie:
- Typecheck en volledige GitHub Quality Gate zijn aantoonbaar groen.
- Contracttests bewijzen exact targetTime, geen toekomstlek, expliciet onbekend bij ontbrekende data en behoud van segmentstructuur.
- Volledige diff bevat alleen bedoelde geïsoleerde kandidaatuitvoer, tests en noodzakelijke CI-wijziging.
- Geen claims over biologische validiteit of sessieaggregatie.

### F2-WP20 — herkomst en onderbouwing thermische soortparameters
**Status:** afgerond — read-only audit.

Alle tien operationele profielen zijn naast de centrale thermal-evidence-registry gelegd. De exacte optimum- en curvebreedtewaarden zijn geïnventariseerd. Geen code, score, profielparameter of gebruikersdata gewijzigd.

**Uitkomst van de bestaande registry-classificatie:**
- **Aerobe-scopebewijs, niet goedgekeurd voor numerieke voorspelling:** Baars en Snoekbaars. Studies zijn contextgebonden; bij baars is de relatie met lichaamsmassa expliciet, bij snoekbaars betreft het volwassen kweekvis.
- **Alleen metabool bewijs, niet goedgekeurd:** Karper, Brasem, Snoek en Voorn. Metabolisme/zuurstofverbruik is geen directe meting van activiteit, voedselopname of vangbaarheid.
- **Geen vergelijkbaar thermisch fysiologiebewijs in de huidige registry:** Zeelt, Meerval, Roofblei en Overig. Andere gedrags-/voedingsbronnen veranderen deze classificatie niet automatisch.

**Parameterconclusie:** alle tien optimumwaarden en alle twintig koude-/warme curvebreedtes blijven voorlopige modelprioren. De geregistreerde studies leveren geen volledige, overdraagbare set van soortspecifieke optimum- én breedteparameters voor Nederlandse veldsituaties. Zie Fase-2-audit §210.

**Acceptatie:** herkomststatus per soort vastgelegd; fysiologisch bewijs onderscheiden van metabolisme, voeding en vangst; geen ongefundeerde herkalibratie uitgevoerd.

### F2-WP21 — gerichte primaire-literatuurcontrole thermische parameter-overdraagbaarheid
**Status:** afgerond — broncontrole, geen modelwijziging.

Een gerichte cross-check van primaire studies is uitgevoerd voor soorten waarbij een studie gemakkelijk te ruim als temperatuur-optimum kan worden geïnterpreteerd. De bevindingen staan in Fase-2-audit §211:
- Baars: aerobe-scopeoptimum verschilt met lichaamsmassa; kleine vissen onder 40 g vertoonden in deze studie geen afname bij hogere testtemperatuur.
- Snoekbaars: volwassen kweekvis had een brede 80%-aerobe-scopeband; 13–25 °C verschilde niet significant, terwijl juveniele studies een hogere band rapporteerden.
- Karper: de geregistreerde studie met voedselopname vond een piek rond 28 °C bij de geteste Aziatische ondersoort en twee grootteklassen; dit is voedingsintensiteit, niet de fysiologische activiteitsscore.
- Zeelt: de gevonden hoge-temperatuurstudie betrof larvale groei/overleving en voedselbeschikbaarheid onder kweekcondities, niet volwassen veldactiviteit.
- Meerval: veld-EMG ondersteunt temperatuurafhankelijke bewegingsactiviteit als context, maar levert geen directe voedingscurve of universeel optimum.

**Besluit:** geen van deze uitkomsten mag zonder outcome-, levensfase-, grootte- en contextmatch als vervanging van de bestaande thermische prior worden gebruikt. Geen score of parameter aangepast.

### F2-WP22 — dekking en uitkomstclassificatie voedings-/foerageerbewijs
**Status:** afgerond — read-only registeraudit.

De bestaande research registry is per concrete doelsoort geïnventariseerd op directe uitkomsttypen voor voedingsintensiteit, voedingsincidentie/-ritme, foerageergedrag, dieet en prooikeuze. De dekking en interpretatiebeperkingen staan in audit §212.

**Uitkomst:** alle negen concrete soorten hebben geregistreerde voedings-/gedragsbronnen, maar niet dezelfde uitkomstmaten. Roofblei heeft vooral voedingsincidentie/dieet/prooikeuze, terwijl andere soorten ook voedingsintensiteit of -ritme hebben. De service liet voedingsincidentie aanvankelijk weg; dat is apart gecorrigeerd in draft PR #220. Alle geïnventariseerde entries blijven niet-goedgekeurd voor numerieke voorspelling.

**Besluit:** geen numerieke voedingsfactor, dagdeelbonus of temperatuurinteractie activeren. Gedrag, maagvulling, dieet, prooikeuze en directe voedselopname blijven gescheiden. Geen code of score gewijzigd.

### F2-WP23 — voedingsincidentie als afzonderlijke evidence-uitkomst beschikbaar maken
**Status:** technisch afgerond in draft PR #220; niet gemerged.

De read-only WP22-audit vond dat het register voor Roofblei een directe voedingsincidentie-/vacuïteitsproxy bevatte, maar dat de service alleen voedingsintensiteit, voedingsritme, foerageren en dieet terugleverde. Daardoor verdween die afzonderlijke uitkomst uit de servicecontext. In PR #220 is een aparte property `feedingIncidence` toegevoegd en wordt Roofblei geclassificeerd als `feeding-incidence-and-diet`; het wordt nadrukkelijk niet als voedingsintensiteit of voedingsritme behandeld.

**Validatie:** volledige Quality Gate groen op commit `634697faa57521ec6a47e04ae93a6cd694fc1117`, run [45205373427](https://github.com/sennzor-wq/Vislogboek/actions/runs/45205373427). De bestaande test controleert dat de Roofblei-bron zichtbaar blijft als incidentie, zonder goedkeuring of numerieke scoring.

### F2-WP24 — integratiegrenzen soortspecifieke evidence in prognose en habitatmodel
**Status:** afgerond — read-only architectuur-/gebruiksaudit.

De huidige codekoppelingen zijn nagegaan:
- Thermische evidence-context en tijdgebonden voedings-/bewegingscontext worden in de bestaande prognosis engine aangeroepen.
- De aparte feeding-evidence-service wordt momenteel nergens vanuit prognosis/VisCoach aangeroepen; de registrydata is dus beschikbaar als service, maar nog niet onderdeel van het gebruikersadvies.
- Het habitatbewegingsmodel gebruikt de soortnaam alleen in een koude-water-uitlegzin. Zonekeuze wordt verder bepaald door algemene thermische drempels, watertype, lokale structuur, tijdvak en directe waarnemingen; er is geen soortspecifieke evidence lookup.
- Geen van deze bevindingen rechtvaardigt automatische numerieke voedings- of habitatfactoren.

**Besluit:** huidige grenzen expliciet vastgelegd in audit §214. Een eventuele kwalitatieve voedingscontext in VisCoach en een echte soortspecifieke habitatbewegingslaag zijn afzonderlijke product-/modelkeuzes. Geen UI, advieslogica, score of code gewijzigd.

### F2-WP25 — synthetische robuustheidsmatrix habitatbewegingsengine
**Status:** technisch afgerond in draft PR #221; niet gemerged.

De generieke habitatbewegingsengine is met synthetische invoer doorgerekend voor alle 10 doelsoorten in 4 thermische contexten (koud, gematigd, warm en thermisch onbekend): 40 scenario's. Daarnaast zijn 10 scenario's getest waarin directe waarneming van aasbellen voorrang moet houden, ook als thermische context en stekgegevens ontbreken.

**Validatie:** primaire/alternatieve zones, bewegingshypothese, omgevingscontext, expliciete unknown-afhandeling en observatieprioriteit zijn gecontroleerd. Volledige Quality Gate groen op commit `f07a7239ae8bde8a9f0330069240646deda79dfd`, run [45206942007](https://github.com/sennzor-wq/Vislogboek/actions/runs/45206942007).

**Beperking:** de engine blijft generiek en de test valideert technische robuustheid, geen soortspecifieke habitatvoorspelling. Geen engine-regels, scores of UI gewijzigd.

## Openstaande eigenaarbeslissingen

**Open draft PR's — alle vier bewust ongemerged; eigenaarreview vereist:**
- [PR #217](https://github.com/sennzor-wq/Vislogboek/pull/217) — bestaande Fase-2-audit en werkvoorraad.
- [PR #218](https://github.com/sennzor-wq/Vislogboek/pull/218) — thermische intervalkandidaat en synthetische contract-/pariteitstests.
- [PR #220](https://github.com/sennzor-wq/Vislogboek/pull/220) — feeding-incidence als afzonderlijke evidence-uitkomst.
- [PR #221](https://github.com/sennzor-wq/Vislogboek/pull/221) — synthetische habitatbewegingsmatrix.

Geen PR mergen zonder expliciete eigenaarstoestemming. Controleer vóór review/merge altijd actuele diff en Quality Gate.

**Product-/modelkeuzes die niet automatisch worden doorgevoerd:**
- Of kwalitatieve voedingscontext (zonder numerieke bonus) zichtbaar moet worden in Prognose/VisCoach; de feeding-evidence-service is nog niet geïntegreerd.
- Of en hoe het generieke habitatbewegingsmodel later soortspecifiek moet worden; daarvoor is eerst een passende bronset en afbakening van responsmaten nodig.

**Scopebesluit:** WP19 (empirische kandidaatvalidatie/modelvergelijking) wordt op besluit van de eigenaar niet uitgevoerd en staat niet langer in de actieve werkvoorraad. Er zijn momenteel geen echte sessie-/prognosedata beschikbaar; dit is daarom geen actieve blokkade. De historische schema-audit blijft alleen als naslag in Fase-2-audit §209. Synthetische tests blijven technische tests en worden niet als empirische validatie gepresenteerd.

## Voortgangslog

| Datum | Werkpakket | Gebeurtenis | Bewijs/status |
|---|---|---|---|
| 2026-11-23 | F2-WP17 | Scoresemantiek en intervalgereedheid onderzocht; vastgelegd in Fase-2-audit §206. | Documentatie staat in draft PR #217; niet gemerged. |
| 2026-11-23 | F2-WP18 | 60 synthetische soort-/weerscenario-combinaties met volledige 6×10-scorematrix, tijdvakscorepariteit voor alle 10 soorten, persoonlijke vangkans null zonder sessies, targetTime-, DST- en immutable-snapshotreplaytests; 221 kandidaatcontractchecks groen. | Commit `fc08c636d99f3d32e4949fa76f7037f8c8948822`; run [45206087992](https://github.com/sennzor-wq/Vislogboek/actions/runs/45206087992); PR #218 open/draft, niet gemerged. |
| 2026-11-23 | F2-WP20 | Read-only audit van alle 10 thermische profielen tegen de soortspecifieke registry-classificatie; geen numerieke parameter is als empirisch gevalideerd aangemerkt. | Fase-2-audit §210; geen runtimewijziging. |
| 2026-11-23 | F2-WP21 | Primaire-literatuurcontrole op uitkomstmaat, levensfase, lichaamsgrootte en overdraagbaarheid voor baars, snoekbaars, karper, zeelt en meerval. | Fase-2-audit §211; geen runtimewijziging. |
| 2026-11-23 | F2-WP22 | Per soort dekking van geregistreerde voedings-/foerageeruitkomsten geïnventariseerd; alle bronnen blijven niet-goedgekeurd voor numerieke scoring. | Fase-2-audit §212; geen runtimewijziging. |
| 2026-11-23 | F2-WP23 | Feeding-incidence als afzonderlijke uitkomst in evidence-service beschikbaar gemaakt; Roofblei blijft buiten intensiteit/ritmeclassificatie. | PR #220; commit `634697faa57521ec6a47e04ae93a6cd694fc1117`; run [45205373427](https://github.com/sennzor-wq/Vislogboek/actions/runs/45205373427) groen; draft/niet gemerged. |
| 2026-11-23 | F2-WP24 | Codekoppelingen van thermische, diel-, voedings- en habitat-evidence read-only gecontroleerd; ontbrekende integratie en generieke habitatlogica vastgelegd. | Fase-2-audit §214; geen runtimewijziging. |
| 2026-11-23 | F2-WP25 | Habitatbewegingsengine synthetisch getest: 10 soorten × 4 thermische contexten + 10 directe-waarnemingsscenario's; volledige Quality Gate groen. | PR #221; commit `f07a7239ae8bde8a9f0330069240646deda79dfd`; run [45206942007](https://github.com/sennzor-wq/Vislogboek/actions/runs/45206942007); draft/niet gemerged. |
| 2026-11-23 | Agent-werkwijze | Deze permanente instructies en operationele queue opgesteld. | PR #219 gemerged naar `main` op commit `0634b80c1f0796b919f24cccce4bb1dd8c793d5d`. |
| 2026-11-23 | F2-WP19 (historische schema-audit) | De schema-/replayhaalbaarheid is read-only onderzocht en vastgelegd in audit §209; geen echte steekproef of segmentlabels vastgesteld. | Alleen historische documentatie; verdere empirische validatie is op besluit van de eigenaar niet in scope. |

| 2026-11-23 | Scopebesluit WP19 | Eigenaar heeft besloten WP19 niet uit te voeren zolang er geen echte sessie-/prognosedata beschikbaar zijn; WP19 is uit de actieve werkvoorraad verwijderd en vormt geen blokkade. | Vastgelegd in Fase-2-audit §216; geen data, tests of validatieresultaten verzonnen. |

## Bijwerken van deze queue

Bij iedere betekenisvolle taak:
- werk status en bewijs bij;
- houd precies één eerstvolgende taak bovenaan;
- verwijder afgeronde taken niet uit de historie, maar verplaats ze naar het voortgangslog;
- voeg geen dubbele auditinhoud toe;
- noteer blokkades en eigenaarbesluiten expliciet.

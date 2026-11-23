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
**Status:** technisch afgerond in open draft PR #218; uitgebreide synthetische scenario-matrix, controleerbare scenariouitvoer, pariteit met de bestaande tijdvakscore, immutable-snapshotreplay en volledige GitHub Quality Gate zijn groen op commit `f2eebc52c8434ddde6e9ab2993f4aae365c20d11` (run [45203638825](https://github.com/sennzor-wq/Vislogboek/actions/runs/45203638825)). PR blijft draft en is niet gemerged; kandidaat staat dus nog niet op `main`.
**Branch:** `feat/fase2-thermal-interval-candidates`
**PR:** https://github.com/sennzor-wq/Vislogboek/pull/218

Acties:
1. Controleer de actuele PR-diff en meest recente Quality Gate-run; ga niet uit van eerder waargenomen status.
2. Controleer TypeScript-contracten en testdata in `src/services/prognosisIntervalThermal.ts` en `test-prognosis-interval-thermal.ts`.
3. **Afgerond:** zowel segmentatie als kandidaathelper ontvangen dezelfde daadwerkelijk gefilterde forecast-input; de test controleert dat het ontbrekende uur niet opnieuw wordt aangeleverd.
4. **Afgerond:** contracttests dekken ontbrekende thermische basisdata, expliciete unknown/null-semantiek, as-of-invariant en de kalibratiepariteit.
5. **Afgerond:** volledige bestaande Quality Gate geslaagd, inclusief typecheck, alle tests, dependency audits en productiebuild; run [45203638825](https://github.com/sennzor-wq/Vislogboek/actions/runs/45203638825).
5a. **Afgerond — synthetische simulatie:** 6 weerscenario’s (koud/stabiel, mild/stabiel, warm/stabiel, heet/stabiel, opwarming en afkoeling) × 10 doelsoorten = 60 deterministische combinaties; per combinatie worden bronstatus, finite temperatuur, efficiëntiegrenzen, 1–10 kandidaat-score en reproduceerbaarheid gecontroleerd. Extra checks testen extreme forecastwijzigingen ná `targetTime`, onvoldoende weershistorie zonder meetanker, beide Amsterdamse DST-overgangen en exacte scorepariteit met het bestaande representatieve tijdvak inclusief lokale kalibratie. De thermische kandidaat blijft beschikbaar terwijl persoonlijke vangkans zonder sessiehistorie null blijft. Een synthetische immutable `PrognosisSnapshot`-fixture is ook opnieuw doorgerekend vanuit exact opgeslagen `weatherInput` en `inputContext` (stekcontext en kalibratie); replay-uitvoer is identiek aan directe berekening.
6. **Afgerond via diff-review:** dagscore, tijdvakscore, bestaande intervaloutput, persoonlijke vangkans, UI en opgeslagen data zijn niet gewijzigd. De kandidaat gebruikt dezelfde gevalideerde lokale temperatuurkalibratie als de bestaande dag-/tijdvakprognose, uitsluitend voor modelschattingen; echte metingen en unknown-uitkomsten worden niet gecorrigeerd.
7. **Afgerond:** bestaande Fase-2-audit en queue bijgewerkt met exacte code- en CI-bewijsstatus.
8. Laat PR #218 open voor eigenaarbeoordeling; niet mergen zonder expliciete toestemming.

Acceptatie:
- Typecheck en volledige GitHub Quality Gate zijn aantoonbaar groen.
- Contracttests bewijzen exact targetTime, geen toekomstlek, expliciet onbekend bij ontbrekende data en behoud van segmentstructuur.
- Volledige diff bevat alleen bedoelde geïsoleerde kandidaatuitvoer, tests en noodzakelijke CI-wijziging.
- Geen claims over biologische validiteit of sessieaggregatie.

### F2-WP19 — kandidaatvalidatie en modelvergelijking
**Status:** code-level haalbaarheid onderzocht; empirische validatie is geblokkeerd totdat een echte, geanonimiseerde export van lokale sessie-/prognosedata beschikbaar is. WP18 heeft een groene volledige Quality Gate, maar PR #218 blijft open en ongemerged.
Acties:
1. **Afgerond — schema-audit:** `PrognosisSnapshot` bewaart de exacte `weatherInput`, `inputContext`, doelvenster, soort, model-/engineversies en voorspelde uitvoer. `inputContext` bevat onder meer stek-/dieptecontext, historische watertemperatuurmetingen, historische feature-snapshots en de bij die prognoserun gebruikte lokale watertemperatuurkalibratie.
2. **Afgerond — uitkomstkoppeling:** snapshots kunnen aan een voltooide sessie worden gekoppeld met `actualOutcome` en `actualTargetCatchesCount`; de uitkomst is sessiebreed (`catch`/`skunk_confirmed`), geen automatisch segmentlabel.
3. **Afgerond — tijdstempelkwaliteit:** vangstrecords hebben een tijdstempel en optionele invoer-/legacy-kwaliteitsvlaggen. Alleen records met aantoonbaar bekende soort, aantallen en tijdstippen mogen eventueel aan een segment worden gekoppeld; dit bewijst nog niet dat alle vangsten volledig zijn geregistreerd.
4. **Geblokkeerd op echte data — datadekking:** er zijn in deze werksessie geen echte sessies of historische prognoses beschikbaar gesteld. Daarom is geen persoonlijke export, steekproefomvang of soort-/seizoens-/stekdekking vastgesteld. GitHub heeft geen toegang tot de lokale Dexie/IndexedDB. De synthetische simulaties toetsen uitsluitend softwaregedrag en randgevallen; zij vervangen geen echte historische validatie.
5. **Gedeeltelijk — synthetische replay geslaagd:** een immutable snapshot-fixture reconstrueert dezelfde kandidaatuitvoer uit `weatherInput` en `inputContext`, inclusief stekcontext en exacte lokale temperatuurkalibratie; er zijn nul persoonlijke sessies nodig voor deze technische replay. **Open voor echte data:** inventariseer echte snapshots op volledigheid, versieherkomst en oorspronkelijke as-of-invoer zodra zulke data beschikbaar zijn. Houd de chronologische train-/testscheiding strikt.
6. **Open — segmentlabels:** gebruik sessiebrede vangstuitkomsten niet als bewijs dat ieder afzonderlijk segment goed/slecht was. Segmenttoewijzing kan hoogstens bij aantoonbaar betrouwbare vangsttijdstempels; nulvangst per segment vereist volledige gebeurtenisregistratie die nu niet is aangetoond.
7. **Open — thermische vergelijking:** een achteraf geregistreerde watertemperatuurmeting kan alleen het segment ondersteunen waarin het fysieke meetmoment valt en alleen als zij na de voorspelling is verricht. Eén optionele meting per sessie valideert niet automatisch alle segmenten en valideert geen biologische activiteitsscore.
8. Geen gewichten fitten, geen scoreparameters aanpassen en geen kandidaat integreren op basis van synthetische of onvoldoende data.

Acceptatie:
- Reproduceerbare validatieopzet met expliciete datadekking en chronologische scheiding.
- Geen future leakage.
- Geen modelwijziging op basis van onvoldoende of synthetische data.
- Duidelijke beslissing: verder onderzoek, aanvullende dataverzameling of onderbouwd modelvoorstel.

### F2-WP20 — herkomst en onderbouwing thermische soortparameters
**Status:** afgerond — read-only audit.

Alle tien operationele profielen zijn naast de centrale thermal-evidence-registry gelegd. De exacte optimum- en curvebreedtewaarden zijn geïnventariseerd. Geen code, score, profielparameter of gebruikersdata gewijzigd.

**Uitkomst van de bestaande registry-classificatie:**
- **Aerobe-scopebewijs, niet goedgekeurd voor numerieke voorspelling:** Baars en Snoekbaars. Studies zijn contextgebonden; bij baars is de relatie met lichaamsmassa expliciet, bij snoekbaars betreft het volwassen kweekvis.
- **Alleen metabool bewijs, niet goedgekeurd:** Karper, Brasem, Snoek en Voorn. Metabolisme/zuurstofverbruik is geen directe meting van activiteit, voedselopname of vangbaarheid.
- **Geen vergelijkbaar thermisch fysiologiebewijs in de huidige registry:** Zeelt, Meerval, Roofblei en Overig. Andere gedrags-/voedingsbronnen veranderen deze classificatie niet automatisch.

**Parameterconclusie:** alle tien optimumwaarden en alle twintig koude-/warme curvebreedtes blijven voorlopige modelprioren. De geregistreerde studies leveren geen volledige, overdraagbare set van soortspecifieke optimum- én breedteparameters voor Nederlandse veldsituaties. Zie Fase-2-audit §210.

**Acceptatie:** herkomststatus per soort vastgelegd; fysiologisch bewijs onderscheiden van metabolisme, voeding en vangst; geen ongefundeerde herkalibratie uitgevoerd.

## Openstaande eigenaarbeslissingen

- PR #217 — documentatie-auditintervalscore: open draft, niet gemerged.
- PR #218 — kandidaat thermische segmentuitvoer: open draft, technisch groen, niet gemerged; eigenaarreview vereist.
- Beide PR's moeten op actuele status en diff worden gecontroleerd. Geen merge uitvoeren zonder expliciete eigenaarstoestemming.

## Voortgangslog

| Datum | Werkpakket | Gebeurtenis | Bewijs/status |
|---|---|---|---|
| 2026-11-23 | F2-WP17 | Scoresemantiek en intervalgereedheid onderzocht; vastgelegd in Fase-2-audit §206. | Documentatie staat in draft PR #217; niet gemerged. |
| 2026-11-23 | F2-WP18/WP19 | 60 synthetische soort-/weerscenario-combinaties, targetTime-, datadekking-, DST-, tijdvakpariteit- en immutable-snapshotreplaytests; 201 kandidaatcontractchecks groen. | Commit `f2eebc52c8434ddde6e9ab2993f4aae365c20d11`; run [45203638825](https://github.com/sennzor-wq/Vislogboek/actions/runs/45203638825); PR #218 open/draft, niet gemerged. |
| 2026-11-23 | F2-WP20 | Read-only audit van alle 10 thermische profielen tegen de soortspecifieke registry-classificatie; geen numerieke parameter is als empirisch gevalideerd aangemerkt. | Fase-2-audit §210; geen runtimewijziging. |
| 2026-11-23 | Agent-werkwijze | Deze permanente instructies en operationele queue opgesteld. | PR #219 gemerged naar `main` op commit `0634b80c1f0796b919f24cccce4bb1dd8c793d5d`. |
| 2026-11-23 | F2-WP19 | Schema-audit bevestigt replaybare prognosesnapshots, maar lokale echte steekproef en segmentlabels zijn niet via GitHub beschikbaar. | Empirische validatie wacht op echte geanonimiseerde export; geen nauwkeurigheidsclaim of modelwijziging. |

## Bijwerken van deze queue

Bij iedere betekenisvolle taak:
- werk status en bewijs bij;
- houd precies één eerstvolgende taak bovenaan;
- verwijder afgeronde taken niet uit de historie, maar verplaats ze naar het voortgangslog;
- voeg geen dubbele auditinhoud toe;
- noteer blokkades en eigenaarbesluiten expliciet.

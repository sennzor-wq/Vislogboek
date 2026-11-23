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
**Status:** kandidaat-implementatie staat in open draft PR #218; CI-status moet opnieuw live worden gecontroleerd.
**Branch:** `feat/fase2-thermal-interval-candidates`
**PR:** https://github.com/sennzor-wq/Vislogboek/pull/218

Acties:
1. Controleer de actuele PR-diff en meest recente Quality Gate-run; ga niet uit van eerder waargenomen status.
2. Controleer TypeScript-contracten en testdata in `src/services/prognosisIntervalThermal.ts` en `test-prognosis-interval-thermal.ts`.
3. Corrigeer de test die een ontbrekende uurforecast claimt te testen maar mogelijk nog de volledige forecast-array doorgeeft; voer de helper voor die test uit met de daadwerkelijk gefilterde forecast-input.
4. Breid alleen noodzakelijke contracttests uit voor ontbrekende thermische basisdata, expliciete unknown/null-semantiek en strikte targetTime-as-of-invariant.
5. Laat de volledige bestaande Quality Gate slagen. Herstel failures binnen deze scope.
6. Controleer dat dagscore, tijdvakscore, bestaande intervaloutput, persoonlijke vangkans, UI en opgeslagen data niet onbedoeld zijn gewijzigd.
7. Werk de bestaande Fase-2-audit en deze queue bij met exacte bewijsstatus.
8. Laat PR #218 open voor eigenaarbeoordeling; niet mergen zonder expliciete toestemming.

Acceptatie:
- Typecheck en volledige GitHub Quality Gate zijn aantoonbaar groen.
- Contracttests bewijzen exact targetTime, geen toekomstlek, expliciet onbekend bij ontbrekende data en behoud van segmentstructuur.
- Volledige diff bevat alleen bedoelde geïsoleerde kandidaatuitvoer, tests en noodzakelijke CI-wijziging.
- Geen claims over biologische validiteit of sessieaggregatie.

### F2-WP19 — kandidaatvalidatie en modelvergelijking
**Status:** nog niet gestart; pas starten nadat WP18 technisch is geaccepteerd door de Quality Gate en de kandidaatcontracten helder zijn.
Acties:
1. Bepaal welke echte, onafhankelijke sessie-/uitkomstdata beschikbaar zijn en welke relevante prognosesnapshots/weer-/watertemperatuurdata werkelijk bewaard zijn.
2. Onderzoek of een chronologische, leakage-vrije backtest van segmentkandidaten mogelijk is.
3. Vergelijk kandidaatuitvoer met bestaande prognose-uitvoer zonder de productie-engine te wijzigen.
4. Rapporteer samplegrootte, soort-/seizoens-/watertype-dekking, ontbrekende waarden, onzekerheid en beperkingen.
5. Geen gewichten fitten, geen scoreparameters aanpassen en geen kandidaat integreren zonder voldoende onafhankelijke data en expliciete onderbouwing.
6. Werk bestaande audit/roadmap bij en definieer de volgende toetsbare stap.

Acceptatie:
- Reproduceerbare validatieopzet met expliciete datadekking en chronologische scheiding.
- Geen future leakage.
- Geen modelwijziging op basis van onvoldoende of synthetische data.
- Duidelijke beslissing: verder onderzoek, aanvullende dataverzameling of onderbouwd modelvoorstel.

## Openstaande eigenaarbeslissingen

- PR #217 — documentatie-auditintervalscore: open draft, niet gemerged.
- PR #218 — kandidaat thermische segmentuitvoer: open draft, niet gemerged.
- Beide PR's moeten op actuele status en diff worden gecontroleerd. Geen merge uitvoeren zonder expliciete eigenaarstoestemming.

## Voortgangslog

| Datum | Werkpakket | Gebeurtenis | Bewijs/status |
|---|---|---|---|
| 2026-11-23 | F2-WP17 | Scoresemantiek en intervalgereedheid onderzocht; vastgelegd in Fase-2-audit §206. | Documentatie staat in draft PR #217; niet gemerged. |
| 2026-11-23 | F2-WP18 | Geïsoleerde kandidaathelper en contracttest toegevoegd. | Draft PR #218; CI en contracttests opnieuw live verifiëren. |
| 2026-11-23 | Agent-werkwijze | Deze permanente instructies en operationele queue opgesteld. | PR voor eigenaarreview; nog niet gemerged. |

## Bijwerken van deze queue

Bij iedere betekenisvolle taak:
- werk status en bewijs bij;
- houd precies één eerstvolgende taak bovenaan;
- verwijder afgeronde taken niet uit de historie, maar verplaats ze naar het voortgangslog;
- voeg geen dubbele auditinhoud toe;
- noteer blokkades en eigenaarbesluiten expliciet.

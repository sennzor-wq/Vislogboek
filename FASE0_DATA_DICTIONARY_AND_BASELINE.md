# Fase 0 — datadictionary en technische nulmeting

**Status:** read-only audit afgerond op 6 november 2026  
**Geaudite codebasis:** `main` op `65f56c4a7408d874defa415212b74cd165f01147`  
**CI-run:** [Vislogboek Quality Gate #42273675118](https://github.com/sennzor-wq/Vislogboek/actions/runs/42273675118) — geslaagd  
**Scope:** repository, TypeScript-domeintypen, Dexie-schema, backupcontract, services, UI-koppelingen, tests en CI-configuratie. Geen applicatiecode gewijzigd.

> Deze audit inspecteert de code en de geautomatiseerde fixtures. De feitelijke IndexedDB-inhoud op een gebruikersapparaat is niet op afstand uitgelezen. De datadictionary beschrijft dus het opslagcontract, niet de actuele aantallen of kwaliteit van persoonlijke records.

## 1. Uitkomst in het kort

Fase 0 is gereed als read-only fundament voor de volgende implementatiefase:

- De bestaande domeinmodellen en de tien persistente Dexie-tabellen zijn geïnventariseerd.
- Alle persistente tabellen zijn opgenomen in het actuele backupcontract (backupformaat v5).
- Het onderscheid tussen gepland, werkelijk, gemeten, geschat, waargenomen en onbekend is in de typen aanwezig.
- Sessies blijven de primaire observatie-eenheid; optionele hengelrecords beschrijven aanvullende inspanning.
- De bestaande prognose-, temperatuur-, tactische, evaluatie- en backupservices zijn geïdentificeerd. Er is geen reden om voor deze verantwoordelijkheden een tweede engine of database te bouwen.
- De Quality Gate op de exacte auditbasis is volledig geslaagd: dependency-audits, typecheck, de in CI geselecteerde regressiesuites, productiebuild en controle op private artefacten.
- De datadictionary maakt expliciet welke velden bruikbaar zijn voor welke analyses en wanneer onbekende of onvolledige data buiten een analyse moet blijven.

Dit is geen claim dat de app wetenschappelijk gevalideerd is of dat de persoonlijke database van de gebruiker inhoudelijk is opgeschoond.

## 2. Technische nulmeting

| Onderdeel | Vastgestelde basis |
|---|---|
| Repository | `sennzor-wq/Vislogboek` |
| Basisbranch | `main` |
| Baselinecommit | `65f56c4a7408d874defa415212b74cd165f01147` |
| Front-end | React 19, TypeScript, Vite 8 |
| Lokale opslag | Dexie 4 / IndexedDB |
| Database | `VislogboekDB`, Dexie schema versie 4 |
| Back-up | JSON, exportcontract versie 5 |
| Weerbron | Open-Meteo via `weatherService.ts` |
| Tijdzone | Centrale datum-/tijdhelpers met `Europe/Amsterdam` |
| Architectuur | Offline-first; prognose en analyses via bestaande services |

### Quality Gate op baseline

Run #42273675118 is uitgevoerd op exact de baselinecommit hierboven. Alle stappen zijn als `success` gerapporteerd:

1. Dependencies installeren met frozen lockfile.
2. Productie- en volledige dependency vulnerability audit.
3. TypeScript typecheck.
4. Amsterdam timezone/DST regressies.
5. Prognose-, thermische, Brier-, forward-validation-, research-registry- en positioneringstests.
6. Waterthermische koppeling, leren, historisch profiel en synthetische validatie.
7. Veilige verwijdering, sessiesnapshot, VisCoach-normalisatie, legacy-import, backup security en volledige backup-roundtrip.
8. Hengelinspanning en sessiecoach.
9. Productiebuild.
10. Controle dat private artefacten niet in `dist` terechtkomen.

De workflow heeft 29 afgeronde stappen (inclusief setup- en cleanupstappen); de inhoudelijke Quality Gate-stappen zijn allemaal geslaagd. Er is geen afzonderlijke handmatige Android-/browserpraktijktest uitgevoerd of geclaimd.

### Testinventaris en CI-dekking

De repository bevat de volgende relevante testbestanden:

- In CI uitgevoerd: `test-date-time.ts`, `test-thermal-and-prognosis.ts`, `test-brier-integration.ts`, `test-forward-validation.ts`, `test-advanced-prognosis-modules.ts`, `test-research-registry.ts`, `test-rod-positioning.ts`, `test-water-thermal-coupling.ts`, `test-water-temperature-learning.ts`, `test-water-history-profile.ts`, `test-water-temperature-synthetic-validation.ts`, `test-safe-deletion.ts`, `test-session-snapshot-commit.ts`, `test-viscoach-part1.ts`, `test-backup-import.ts`, `test-audit-data-integrity.ts`, `test-security-backup-validation.ts`, `test-backup-roundtrip.ts`, `test-session-rods.ts` en `test-session-coach.ts`.
- Niet in de huidige CI-workflow: `test-weather-enrichment.ts` en `test-viscoach-greetings.ts`. Deze zijn bestaande tests, maar hun dekking is niet door de genoemde baseline-run bewezen.
- `test-core-logic.ts` is bewust niet in CI opgenomen omdat het live Open-Meteo-aanroepen doet; de workflowcomment vermeldt dat deze suite pas terugkeert wanneer netwerkafhankelijkheden gemockt zijn.
- `package.json` heeft geen generiek `test`-script. CI voert de tests rechtstreeks uit met `bun run tsx ...`; de scripts `lint`, `build`, `test:audit-data-integrity` en `test:viscoach-greetings` zijn wel gedefinieerd.

## 3. Datadictionary

De volledige velddefinities staan in `src/types/index.ts`. Onderstaande tabel beschrijft de functionele betekenis en het veilige gebruik. Optionele velden blijven onbekend wanneer ze ontbreken; afgeleide waarden mogen niet als gebruikersmeting worden gepresenteerd.

| Entiteit / opslag | Belangrijke velden | Bron en verplichtheid | Betrouwbaarheid en toegestaan gebruik |
|---|---|---|---|
| **FishingLocation** — `locations` | `id`, `name`, `latitude`, `longitude`, `waterType`, `waterDepth`, `waterFacingDirection`, `habitatFeatures`, timestamps | ID/naam/timestamps verplicht in type; GPS, watertype, diepte, oeverrichting en habitat optioneel; gebruikersinvoer | Naam/ID identificeren de stek. GPS is nodig voor locatiegebonden weer. Ontbrekende diepte/geometrie blijft onbekend en blokkeert stellige tactische positionering. |
| **FishingSession** — `sessions` | `id`, `locationId`, `startTime`, `endTime`, `durationMinutes`, `plannedEndTime`, `plannedDurationHours`, `outcome`, `targetSpecies`, `rodCount`, `participantCount`, `technique`, `baitAndFeed`, `bitesCount`, `missedCount`, watermetingvelden, `weatherSnapshot`, `presenceObservations`, `snapshotId`, `legacyImportQuality` | Starttijd en outcome verplicht in type; overige context grotendeels optioneel; gebruikersinvoer, import of gekoppelde appberekening | Werkelijke duur alleen uit geregistreerde werkelijke duur of werkelijk start-/eindtijdpaar. Geplande duur is geen gerealiseerde inspanning. `catch`, `skunk_confirmed` en `unknown` blijven verschillende uitkomsten. Legacy-vlaggen geven ontbrekende broninformatie aan. |
| **CatchItem** — `catches` | `id`, `sessionId`, `species`, `count`, `timestamp`, optioneel `locationId`, gewicht/lengte, hengel, aas, techniek, foto en `legacyImportQuality` | Soort, aantal en tijd zijn verplicht in het huidige type; legacy-import kan expliciet aangeven dat bronwaarden onbekend waren | Alleen soortspecifieke vangstregels ondersteunen een doelsoortvangst. `weightKg: null` betekent onbekend, niet nul. Groepsgewicht is niet per vis te interpreteren. |
| **PresenceObservation** — `presenceObservations` | `id`, `locationId`, optioneel `sessionId`, `observationType`, `timestamp`, notitie | Afzonderlijke gebruikerswaarneming; type en tijd verplicht | Springen/rollen, aasbellen, recente vangst en geen waarneming zijn geen vangstregistraties. Geen waarneming is geen bewijs van afwezigheid. Legacywaarde `aanbeten` is expliciet verouderd; nieuwe aanbeten horen in sessietellers. |
| **WeatherSnapshot** — ingebed in sessie/snapshot | Luchttemperatuur, druk, wind, bewolking, neerslag, bron en `capturedAt`; optioneel vochtigheid, dauwpunt, straling en watertemperatuur | Weerprovider, historische bron of handmatige invoer; snapshot wordt op sessie-/prognosemoment bewaard | `temperature` is luchttemperatuur. Watertemperatuur mag alleen worden gevuld als bekend; bron en tijdstip zijn essentieel. Ontbrekende waarden zijn geen neutrale meting. |
| **WeatherCacheEntry** — `weatherCache` | `id`, coördinaten, `fetchedAt`, uurlijkse forecast en optionele dagsamenvatting | Open-Meteo/cache | Tijdelijke ondersteunende brondata; bij evaluatie moet de daadwerkelijk gebruikte forecast uit de snapshot worden gebruikt, niet een later bijgewerkte cache. |
| **SessionRod** — `sessionRods` | `id`, `sessionId`, `rodNumber`, optionele zone, techniek, presentatie, actieve intervallen en events | Optionele per-hengelregistratie door gebruiker | Aanvullende inspannings- en tactiekcontext. Hengels zijn geen onafhankelijke sessies of onafhankelijke bewijssteekproeven. |
| **RodActiveInterval / SessionRodEvent** — genest in hengelrecord | Werkelijke start/eindtijd per actief interval; eventtype `bite`, `missed`, `catch` of `other` | Gebruikersregistratie; eindtijd kan ontbreken zolang interval loopt | Hengeluren alleen afleiden uit werkelijke actieve intervallen. Onvolledige intervallen moeten als onvolledig herkenbaar blijven. |
| **PlannedFishingSession** — `plannedSessions` | `id`, `locationId`, `targetSpecies`, `plannedStartTime`, optionele eindtijd, status, `planSnapshotId`, `startedSessionId` | Bewuste planning door gebruiker; starttijd/soort/stek verplicht in type | Een plan is geen actieve sessie, geen gerealiseerde inspanning en geen nulvangst. De planprognose blijft apart van de startsnapshot. |
| **PrognosisSnapshot** — `prognosisSnapshots` | Runsoort, inputfingerprint/context, volledige `prognosisData`, exacte `weatherInput`, forecasttijd, doelsoort, locatie, doelvenster, duur/duur-bekend, voorspelde waarden, onzekerheid, model-/engineversies, sessiekoppeling en latere uitkomstvelden | Door prognose-engine aangemaakt; runcontext deels optioneel voor legacycompatibiliteit | Primaire onveranderlijke voorspelling. Voorspelde waarden/condities mogen niet worden overschreven door uitkomsten. `durationHours: 0` is expliciet onbekend wanneer `durationKnown` ontbreekt/false is; nooit als nul uur inspanning tellen. |
| **PrognosisInputContext** — genest in snapshot | Berekeningstijd, tijdzone, doeldatum, doelsoort, duur, stekcontext, IDs van historische sessies/vangsten/waarnemingen, temperatuurwaarnemingen, fingerprint, samenvatting en weertijdstip | Vastgelegd bij een prognoserun; optioneel op oude snapshots | Herleidbaarheid naar de invoer op dat moment. IDs verwijzen naar bronrecords; historische aantallen alleen gebruiken als de onderliggende records voldoen aan de kwaliteitsregels. |
| **CoachAdviceRecord** — `coachAdviceRecords` | Sessie- en snapshot-ID, vorig advies, trigger, samenvatting, aanbeveling, onderbouwing, gewijzigde factoren, vertrouwen, gebruikersreactie, uitgevoerde tactiek en coach-/engineversies | Aangemaakt door sessiecoach; optionele gebruikersfeedback | Legt advies en reactie vast, niet een tweede prognose. Evaluatie van het advies vereist onderscheid tussen aanbeveling, acceptatie, aanpassing en werkelijk uitgevoerde tactiek. |
| **AppSettings** — `settings` | Standaardstek/coördinaten, standaardsoort/duur, thema, back-updatum en optionele thuislocatie | Lokale gebruikersinstellingen | Voorkeuren en defaults voor UI; geen bewijs van werkelijk bezochte stek of sessieduur. |

### 3.1 Betrouwbaarheidsregels voor coachinvoer

1. **Gemeten:** expliciete watertemperatuur met meettijd, bron/methode en waar beschikbaar meetdiepte. Alleen dan geschikt als meetpaar voor temperatuurvalidatie.
2. **Voorspeld:** weersverwachting en prognose-uitvoer, met bron-/ophaaltijd en modelversie. Niet verwarren met latere waarnemingen.
3. **Geschat:** waterthermische uitvoer met status, anker, onzekerheid en herkomst. Nooit als meting presenteren.
4. **Waargenomen:** zichtbare visactiviteit, aanbeten en andere gebruikerswaarnemingen blijven afzonderlijke gebeurtenistypen.
5. **Werkelijk resultaat:** doelsoortvangsten uit vangstrecords; bevestigde nulvangst alleen bij expliciet `skunk_confirmed` en voldoende bekende sessie-inspanning.
6. **Onbekend/onvolledig:** ontbrekende soort, tijd, duur, weer, geometrie of herkomst niet aanvullen met plausibele defaults. Sluit een record uit van analyses waarvoor het ontbrekende veld essentieel is.
7. **Historisch/import:** legacy-kwaliteitsvlaggen blijven leidend. Een achteraf ingevoerd record is niet automatisch een vooraf vastgelegde voorspelling.

## 4. Opslag- en backupcontract

### Dexie-tabellen

Database `VislogboekDB`, schema versie 4, bevat tien persistente tabellen:

1. `locations`
2. `sessions`
3. `catches`
4. `weatherCache`
5. `settings`
6. `prognosisSnapshots`
7. `presenceObservations`
8. `sessionRods`
9. `plannedSessions`
10. `coachAdviceRecords`

### JSON-backup

Backupformaat versie 5 exporteert alle tien tabellen. `settings` wordt als de `user_settings`-record opgeslagen; de overige collecties worden als arrays geëxporteerd. Foto's zijn onderdeel van de sessie-/vangstrecords (Base64 data URL of foto-URL), niet een afzonderlijke Dexie-tabel.

De backupservice heeft afzonderlijke stappen voor normalisatie, payloadlimieten, importinspectie, merge, restore en replace. De CI-suite bevat legacy-fixture-, security- en roundtriptests. De testuitkomst ondersteunt compatibiliteit van de geteste fixtures en paden; ze bewijst niet dat elk denkbaar extern backupbestand foutloos is.

## 5. Bestaande code-eigenaren — geen dubbele implementaties

| Verantwoordelijkheid | Bestaande eigenaar |
|---|---|
| Centrale prognose en orkestratie | `src/services/prognosisEngine.ts` |
| Soortbiologie / fysiologische profielen | `src/services/fishProfiles.ts` |
| Weer ophalen en cache | `src/services/weatherService.ts` |
| Waterthermische schatting | `src/services/waterThermalEngine.ts` |
| Historische temperatuurwaarnemingen | `src/services/waterTemperatureHistory.ts` |
| Wind/oeverrelatie | `src/services/bankWindEngine.ts` |
| Habitat en beweging | `src/services/habitatMovementEngine.ts` |
| Hengelpositionering | `src/services/rodPositioningEngine.ts` |
| Voorvoeradvies | `src/services/prebaitEngine.ts` |
| Datakwaliteit | `src/services/dataQualityEngine.ts` |
| Tegenstrijdige modelsignalen | `src/services/modelConsistencyEngine.ts` |
| Brier, BSS en kalibratie | `src/services/evaluationEngine.ts` |
| Bron-/kennisregister | `src/services/researchRegistry.ts` |
| Sessiegebonden coachcoördinatie | `src/services/sessionCoachService.ts` |
| VisCoach plan/start | `src/services/viscoachService.ts` |
| Lokale opslag en schema | `src/db/db.ts`, `src/types/index.ts` |
| Backup/import/export | `src/services/backupService.ts` |

De UI is opgebouwd uit de bestaande tab-/schermcomponenten in `src/components`, met centrale samenhang in `src/App.tsx`. Nieuwe functionaliteit hoort op de bestaande eigenaar aan te sluiten.

## 6. Geconstateerde aandachtspunten voor latere fasen

Dit zijn auditbevindingen en aandachtspunten, geen wijzigingen die binnen de read-only Fase 0 zijn uitgevoerd.

1. **Seedgedrag bij database-initialisatie:** `initializeDatabaseOnce()` schrijft bij de eerste initialisatie historische locaties, sessies, vangsten en een vaste Lokkershoek-referentiesessie naar de lokale database. Bevestig vóór een volgende distributie-/onboardingwijziging dat deze ingebouwde historische data en benchmarkseeding bewust gewenst blijven in een gebruikersinstallatie.
2. **Backupversie versus Dexie-versie:** Dexie schema v4 en JSON-backup v5 zijn verschillende versienummers met verschillende verantwoordelijkheden. Houd migraties en compatibiliteit afzonderlijk gedocumenteerd.
3. **Niet alle tests draaien in CI:** `test-weather-enrichment.ts` en `test-viscoach-greetings.ts` staan niet in de workflow. `test-core-logic.ts` is vanwege live netwerkafhankelijkheid bewust uitgesloten. Beslis per suite of deze gemockt en aan CI toegevoegd moet worden; dit is geen blocker voor de huidige geslaagde workflow.
4. **README is nog template-georiënteerd:** de huidige README beschrijft een generieke AI Studio-app en noemt `GEMINI_API_KEY`, terwijl de applicatie als offline-first Vislogboek is ingericht. Dit is documentatie-/onboardingwerk buiten de acceptatie van deze Fase 0 datadictionary.
5. **Praktijkvalidatie ontbreekt nog:** geslaagde synthetische tests en CI zijn geen bewijs van voorspellende nauwkeurigheid in echte wateren. Echte temperatuurmeetparen en chronologische sessie-uitkomsten moeten in de nulmeting worden verzameld.

## 7. Wat de coach verantwoord kan gebruiken

**Direct bruikbaar wanneer ingevuld en valide:** doelsoort, stek-ID, start-/eindtijd, expliciete sessie-uitkomst, soortspecifieke vangstregels, aanbeten/missers, hengelaantal, optionele hengelintervallen, methode/aaspresentatie, expliciete aanwezigheidwaarnemingen, weersnapshot en expliciete watertemperatuurmetingen.

**Alleen conditioneel bruikbaar:** GPS en lokale weercontext (coördinaten vereist); waterdiepte/watertype voor thermische context; oeveroriëntatie/habitat voor specifieke positionering; duur/hengeluren voor inspanningsvergelijking; persoonlijke vangstkans/Brier voor voldoende complete en vergelijkbare sessies; historische temperatuurprofielen bij voldoende echte meetpunten.

**Niet als feit gebruiken:** ontbrekende waarden, geplande duur als werkelijke duur, luchttemperatuur als watertemperatuur, waarneming als vangst, algemene sessie-uitkomst als soortspecifieke vangst zonder vangstregistratie, of een coachadvies als bewijs dat de tactiek is uitgevoerd.

## 8. Fase 0-acceptatie

| Acceptatiepunt uit implementatieplan | Resultaat |
|---|---|
| Types, Dexie-schema, formulieren/services en backup/import/export geïnventariseerd | **Gereed** — repository- en codecontractaudit uitgevoerd |
| Gecontroleerde datadictionary | **Gereed** — sectie 3 en 3.1 |
| Betrouwbare coachinvoer en ontbrekende gegevens expliciet | **Gereed** — sectie 3.1 en 7 |
| Oude backups en sessies compatibel houden | **Bestaande bescherming aanwezig en CI-getest** — legacyfixture/import/roundtrip; geen universele compatibiliteitsgarantie |
| Baselinecommit en Quality Gate vastgelegd | **Gereed** — commit en run in sectie 2 |
| Geen applicatiegedrag gewijzigd | **Gereed** — uitsluitend read-only audit en documentatie; de audit is eerst op `documentation` vastgelegd en daarna als ondersteunend document naar `main` overgenomen. Er is geen applicatiecode of gebruikersdatabase gewijzigd. |

**Conclusie:** Fase 0 is afgerond als read-only audit en gegevensfundament. Openstaande punten hierboven worden meegenomen naar de relevante volgende fase; ze worden niet stilzwijgend in Fase 0 opgelost.

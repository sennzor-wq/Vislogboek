# Fase 0 — uitgebreide optimalisatie-audit

**Status:** in uitvoering — read-only  
**Peildatum:** 15 november 2026  
**Geaudite branch:** `main`  
**App-codebaseline bij start audit:** `4831fd6d7a200467c29773c574be7090674eca29`  
**Actuele app-codebaseline voor hercontrole:** `20f53dc34d572105a26ee0b5c692ba74e546bc02`  
**Actuele main HEAD:** `18fe8848535435624c9579130b253adfe289b732` (documentatiecommit, parent is de app-codebaseline hierboven).  
**Baselinecorrectie:** sinds de oorspronkelijke auditbaseline zijn 28 commits toegevoegd. De vergelijking toont wijzigingen in app-code en tests, waaronder db.ts, backupService.ts, evaluationEngine.ts, prognosisEngine.ts en de regressietests. De eerdere auditconclusies zijn daarom niet zonder hercontrole op de huidige code toepasbaar.  
**Doel:** de bestaande technische nulmeting aanvullen met de expliciete traceerbaarheid van blueprint → code → UI → test en met de dataveiligheids-, prognose-, stekleren- en VisCoach-vragen uit `VISLOGBOEK_VERBETERPLAN.md`.

> Dit is een voortgangsrapport, geen afgeronde audit. Er is alleen repository-inhoud onderzocht. De IndexedDB van een echte gebruikersinstallatie is niet uitgelezen. Er is geen applicatiecode, lokale database of vangstregistratie gewijzigd.

## 1. Repositorybasis

| Controle | Bevinding |
|---|---|
| Leidende branch | `main` |
| Baselinecommit | `4831fd6d7a200467c29773c574be7090674eca29` |
| Openstaande PR's | Geen gevonden bij controle op 15 november 2026 |
| Branches | Meerdere historische feature-, audit- en documentatiebranches aanwezig; `main` blijft de enige bron van waarheid |
| Bestaande technische nulmeting | `FASE0_DATA_DICTIONARY_AND_BASELINE.md`, uitgevoerd op oudere commit `65f56c4a7408d874defa415212b74cd165f01147` |
| CI op huidige baseline | Quality Gate run #503 (`43723261161`) en alle daaropvolgende runs op documentatiecommits eindigden vrijwel direct als failure. De meest recente run na de auditdocumentatie-updates is #511 (`43724488095`): jobstart faalde direct, zonder zichtbare workflowstappen of beschikbare logs. Run #510 (`43724438477`) had `runner_id=0`, geen stappen en geen logs. Een rerun van run #503 is aangevraagd maar bleef eveneens failure. Oorzaak is dus **onbekend en lijkt vóór de eerste workflowstap te ontstaan**; dit is niet als codefout of geslaagde test te classificeren. |
| Workflow | `.github/workflows/ci.yml`; typecheck, dependency audits, regressiesuites en productiebuild |

De eerdere fase-0-datadictionary blijft geldig als historische audit op de toenmalige commit. Deze nieuwe audit heeft een bredere scope en moet de huidige `main` opnieuw aan de actuele productblauwdruk koppelen. De twee audits mogen niet als dezelfde afronding worden gepresenteerd.

## 2. Eerste traceerbaarheidsmatrix

| Onderwerp / eis | Huidige code en UI | Bestaande testdekking | Voorlopige status / vervolg |
|---|---|---|---|
| Database-initialisatie en benchmarkdata | `src/db/db.ts`: `initializeDatabaseOnce()` wordt vanuit `App.tsx` tijdens laden aangeroepen. De functie schrijft de vaste sessie `benchmark-session-20261019` en vier vangstrecords opnieuw via `put()`, en verwijdert andere vangsten die aan die sessie hangen. | `test-safe-deletion.ts` test dat expliciet als benchmark gemarkeerde records niet verwijderd kunnen worden; dit bewijst niet dat de huidige seeded sessie beschermd is. | **Risico bevestigd.** De vaste sessie en vangsten hebben `isBenchmark: false`; classificatie en herkomst moeten eerst worden vastgesteld. Geen verwijdering tijdens fase 0. |
| Historische records uit backup | `src/data/historicalData.ts` meldt expliciet dat 5 locaties, 10 sessies en 16 vangsten zijn geïmporteerd uit `vislogboek-backup-2026-10-26_50803f8b.json`. `src/db/db.ts` seedt deze records wanneer hun IDs ontbreken. | Legacy-/backup-/dataintegriteitstests bestaan; geen test bewijst dat persoonlijke backuprecords als productie-fixture veilig zijn voor distributie naar nieuwe installaties. | **Beschermen.** Dit zijn backup-afgeleide records en mogen niet als ongeldig benchmarkmateriaal worden verwijderd. Wel onderzoeken hoe persoonlijke seeddata uit het normale nieuwe-installatiepad kan worden gehaald zonder bestaande lokale records te wissen. |
| Numerieke biologische activiteitsindex | `src/services/prognosisEngine.ts`: de huidige index wordt berekend uit `thermalEff` via `metabolicCeiling`; temperatuur is de enige factor met numerieke scorebijdrage. Druk, wind, seizoen, tijd/licht, bewolking en neerslag worden verwerkt als context met score 0. | Prognose-/thermische tests bestaan; `test-rod-positioning.ts` toetst tactische scenario's, niet de empirische juistheid van alle biologische factorresponsen. | **Gedeeltelijk.** Voorzichtigheid tegen ongefundeerde gewichten is goed; de blueprintfactoren moeten volledig worden geïnventariseerd en onderbouwd. |
| Soortspecifieke basisbiologie | `src/services/fishProfiles.ts` bevat soortprofielen, voorkeursperioden/-windrichtingen, drempels en bronnen. | `test-research-registry.ts`, prognosetests en positioneringstests bestaan. | **Aanwezig als basis, validatie onzeker.** Bronnen moeten per soort en per claim worden gecontroleerd; groeirelatie mag bijvoorbeeld niet zonder meer als vangstactiviteitscurve worden gebruikt. |
| Habitat-/bewegingsanalyse | `src/services/habitatMovementEngine.ts` maakt primaire/alternatieve zones en benoemt ontbrekende habitat-, temperatuur- en windgegevens. | Positionering- en advanced-moduletests bestaan. | **Gedeeltelijk.** Er is al een habitat-/bewegingslaag; audit moet nog aantonen hoe volledig deze per soort, stek en tijdsverloop is. |
| Lerend stekprofiel per stek en soort | Persoonlijke sessieanalyse zit in `prognosisEngine.ts`; thermische historie in `waterTemperatureHistory.ts`; soortprofielen in `fishProfiles.ts`; habitat en positionering in afzonderlijke engines. In de huidige services-directory is geen centrale `spotLearningEngine.ts` aangetroffen. | Tests voor temperatuurleren, historisch profiel, Brier/forward validation en positionering bestaan. | **Geen geïntegreerd profiel aangetoond.** Eerst vaststellen welke aggregatie al in bestaande functies zit; pas daarna beslissen of een centrale leerlaag ontbreekt. |
| Wind-/werprichtingadvies | `src/services/sessionCoachService.ts` voegt de sectie “Wind en werprichting” alleen toe wanneer `positioning.windContext.isStrongWind === true`. De UI `src/components/viscoach/VisCoachView.tsx` toont de resulterende aanbeveling. | `test-session-coach.ts` bevat expliciet de verwachting dat bij zwakke wind de windsectie ontbreekt. `test-rod-positioning.ts` test geometriebeperkingen en scenario's. | **Afwijking van gewenste productrichting bevestigd.** Bestaande test encodeert het huidige gedrag; fase 4 moet deze test bewust aanpassen naar relevante windcontext bij rustige/matige wind, zonder ongegronde werprichting. |
| Gesloten leercyclus | `sessionCoachService.ts` bewaart advies, gebruikersreactie en uitgevoerde tactiek; prognose-snapshots en evaluatie bestaan. | `test-session-coach.ts`, `test-session-coach-integration.ts`, `test-brier-integration.ts`, `test-forward-validation.ts`. | **Softwarematige bouwstenen aanwezig.** Onafhankelijke beoordeling van prognosekwaliteit en tactische advieswaarde en praktijkbewijs blijven nodig. |

## 3. Dataveiligheid — voorlopige bevindingen

### 3.1 Vaste sessie van 19 oktober 2026

In `src/db/db.ts` staat een hard-coded sessie met ID `benchmark-session-20261019` en vier canonieke vangstrecords:
- 3 brasems (groepregistratie),
- 1 zeelt,
- 1 karper,
- later nog 3 brasems.

De sessie beschrijft in totaal acht vissen. De code zet of houdt `isBenchmark: false`; de vier vangsten hebben geen expliciete benchmarkvlag. De init-functie gebruikt `put()` voor de vier canonieke IDs en verwijdert alle andere vangsten die aan deze sessie hangen. Dit betekent dat een handmatig gewijzigde vangst met een van die canonieke IDs bij de volgende app-runtime opnieuw kan worden overschreven, en dat extra vangsten gekoppeld aan deze sessie worden verwijderd.

De ID/constantennaam wijst op benchmarkherkomst, maar de recordvelden zelf markeren het niet als benchmark. De herkomst is nog niet definitief bewezen. **Niet verwijderen of omzetten voordat de bronbackup en alle verwijzingen zijn gecontroleerd.**

### 3.2 Historische backupdata

`src/data/historicalData.ts` identificeert zichzelf als import uit een concrete Vislogboek-backup van 26 oktober 2026 en bevat 10 sessies en 16 vangsten, met onder meer drie expliciet bevestigde nulvangstsessies. Deze records zijn geen onderdeel van de vier canonieke vangsten hierboven. Ze moeten als potentieel echte gebruikersdata worden beschermd. Het feit dat ze in broncode staan, is op zichzelf juist reden om de productie-seed te herzien: nieuwe installaties horen niet automatisch persoonlijke backuprecords te ontvangen.

### 3.3 Verwijzings- en beschermingsketen

- `src/db/db.ts` bevat verwijderbeveiliging op basis van `session.isBenchmark` en `snapshot.isBenchmark`.
- `test-safe-deletion.ts` controleert die bescherming met expliciet als benchmark gemarkeerde fixtures.
- De vaste sessie van 19 oktober is in de huidige constante juist `isBenchmark: false`; de bestaande benchmarkbescherming beschermt die dus niet op basis van dit veld.
- `src/services/evaluationEngine.ts` sluit snapshots met `isBenchmark: true` en sessies met `isBenchmark: true` uit. De import van `BENCHMARK_SESSION_ID` moet op resterend gebruik worden gecontroleerd.
- Een volledige repositorybrede inventaris van alle ID-verwijzingen, UI-verwijzingen en fixturegebruik is nog open.

## 4. Prognose- en coachbevindingen

### 4.1 Activiteit versus locatie

De code maakt al een nuttig onderscheid tussen de numerieke activiteitsscore en de aparte habitat-/positioneringsanalyses. Wind kan als context voor oppervlaktevoedsel en zoneverplaatsing worden beschreven zonder automatisch de totale activiteitsscore te verhogen. Dit concept moet behouden blijven.

De huidige activiteitsscore is echter thermisch gedreven. De volgende auditstap is niet simpelweg extra gewichten toevoegen, maar per factor vastleggen: biologische hypothese, soort, levensstadium indien relevant, watertype, tijdsvertraging, meetbron, interactie, onzekerheid, score- of habitatrol en beschikbare literatuur/praktijkdata.

### 4.2 Coachadvies

De coachlaag is geen lege placeholder: zij combineert bestaande prognose-, habitat-, positionerings- en voeruitvoer. De concrete windbeperking is dat de tekstsectie alleen verschijnt bij sterke wind. De huidige test legt die beperking vast. Fase 4 moet dus zowel implementatie als testverwachting bewust wijzigen, en mag niet simpelweg elke situatie een exacte kompasrichting geven.

## 5. Baseline- en validatiebeperkingen

- De app-codebaseline bij start van de audit was `4831fd6d7a200467c29773c574be7090674eca29`. Alle commits die daarna voor deze audit zijn gemaakt, wijzigden uitsluitend documentatie.
- De nieuwste Quality Gate-run #511 (`43724488095`) op de huidige documentatie-head faalde vóór zichtbare workflowstappen. Ook runs #503–#510 en de rerun van #503 faalden op dezelfde manier; bij run #510 is expliciet `runner_id=0` en een lege stappenlijst gerapporteerd. De oorzaak is onbekend en lijkt bij runner-/workflowstart te liggen; er is geen testresultaat beschikbaar.
- De oudere geslaagde Quality Gate #491 / run #42423374317 is op een eerdere commit uitgevoerd en mag niet worden gepresenteerd als bewijs voor de huidige baseline.
- De repository heeft deterministische tests voor veel services, maar de audit moet nog controleren welke blueprint-eisen niet door een gerichte regressietest worden afgedekt.
- Er is geen toegang tot de werkelijke IndexedDB-inhoud van een gebruiker via deze repository-audit. Aantallen, lokale afwijkingen en persoonlijke records kunnen dus niet worden vastgesteld.
- De bestaande Brier/BSS-implementatie gebruikt vooraf vastgelegde prognoses, sessiekoppelingen, deduplicatie en chronologische rolling baseline. Dit is een nuttige technische basis, maar de score is alleen betrouwbaar voor de kwaliteit van de onderliggende echte, vergelijkbare sessiedata.

## 6. Open werk om fase 0 af te ronden

- [ ] Volledige blueprint → code → UI → test-matrix voor alle relevante VisCoach- en projectcontext-eisen.
- [ ] Repositorybrede verwijzingsinventaris van benchmark-IDs, `isBenchmark`, historische seeddata, evaluatie, snapshots, veilige verwijdering, UI en tests.
- [ ] Herkomst van de sessie van 19 oktober en de vier canonieke vangsten vaststellen; onderscheid maken tussen synthetische benchmarkdata en echte gebruikersdata.
- [ ] Vaststellen of `HISTORICAL_*` alleen bedoeld is als persoonlijke migratie-/fixturedata en veilig uit het nieuwe-installatiepad kan worden gehaald zonder bestaande lokale gegevens te raken.
- [ ] Huidige Quality Gate rerun beoordelen; bij falen de precieze oorzaak vaststellen en baseline opnieuw vastleggen.
- [ ] Prognosefactoren uit de volledige productblauwdruk inventariseren, inclusief niet-beschikbare invoer en reeds bestaande modelrollen.
- [ ] Spotprofiel en sessie-aggregatie volledig volgen, inclusief nulvangsten, inspanning, hengeluren, doelsoort en datakwaliteit.
- [ ] VisCoach-adviesketen tot de daadwerkelijke UI en alle relevante tests afronden.
- [ ] Reproduceerbare huidige softwarebaseline en bekende beperkingen vastleggen.

**Fase 0 blijft in uitvoering totdat deze punten zijn afgehandeld of expliciet als niet uitvoerbaar / niet beschikbaar zijn gemotiveerd. Tot die tijd start fase 1 niet.**


## 7. Aanvullende ketencontrole — 15 november 2026

### 7.1 Prognose en stekvergelijking

De centrale orkestratie in `src/services/prognosisEngine.ts` roept bestaande modules aan:
- `analyzeRodPositioning()` voor hengelpositionering;
- `analyzeBankWind()` voor wind/oeverrelatie;
- `analyzeHabitatMovement()` voor habitat- en bewegingshypothesen;
- `calculatePrebaitPlan()` voor voorvoeradvies bij ondersteunde soorten.

Dit bevestigt dat fase 4 bestaande modules moet integreren en aanscherpen, niet een parallelle tactische engine moet introduceren.

Er zijn twee verschillende historische sessiefilters:
- `getSimilarSessions()` selecteert afgeronde sessies op doelsoort en tijdvak en sluit expliciet gemarkeerde benchmarks en onbetrouwbare starttijden uit. Deze selectie filtert niet op stek-ID.
- `getComparableSessions()` filtert voor de statistische vangstkans wél op doelsoort en, wanneer opgegeven, locatie-ID. Doelsoortsucces vereist een vangstrecord van de doelsoort; bevestigde nulvangst blijft een aparte uitkomst. Voor de Poisson-berekening worden sessies zonder bekende werkelijke duur niet als blootstelling gebruikt.

Dit is een nuttige basis, maar nog geen aangetoond, volledig stekprofiel: een centrale leerlaag moet onder meer inspanning, hengeluren, tactiek, weers-/watercontext, soort en onzekerheid op sessieniveau samenbrengen. Vangsten binnen één sessie zijn geen onafhankelijke sessie-observaties.

### 7.2 Geometrie en werprichting

- `bankWindEngine.ts` vereist een vastgelegde `waterFacingDirection` om de wind ten opzichte van de gekozen oever te configureren. Een GPS-punt alleen vertelt niet aan welke kant van het water de visser staat.
- `rodPositioningEngine.ts` bouwt wind-/werprichtingsscenario's en maakt een exacte aanbevolen richting alleen definitief wanneer voldoende persoonlijke sessie-evidentie voor een favoriete werprichting bestaat. Zonder die onderbouwing geeft de engine geen vaste kompasrichting.
- De centrale coachtekst in `sessionCoachService.ts` laat de windsectie echter alleen zien als `isStrongWind` waar is. Bij sterke wind kan de coach dus voorzichtig zijn over geometrie; bij rustige wind verdwijnt de windcontext volledig.

De fase-4-wijziging moet dit onderscheid behouden: windcontext mag ook bij lichte/matige wind worden uitgelegd, maar een exacte werprichting blijft geblokkeerd zolang de geometrie en/of persoonlijke bewijsbasis onvoldoende zijn.

### 7.3 UI- en adviesketen

`viscoachService.ts` bouwt het plan op basis van de gekozen stek, doelsoort, gewenste start/eindtijd, sessies en vangsten en roept `calculateDayPrognosis()` aan. `VisCoachView.tsx` gebruikt vervolgens `buildVisCoachAdviceText()` voor samenvatting, aanbeveling en rationale in het plan. De sessiecoach bewaart daarnaast adviesrecords en feedback over uitgevoerde tactiek. De volledige UI-keten is dus aanwezig, maar de inhoudelijke kwaliteit hangt af van de engine-uitvoer en de beperkingen hierboven.

### 7.4 Regressietest die huidige windbeperking vastlegt

`test-session-coach.ts` test expliciet dat de tekst “Wind en werprichting” ontbreekt bij 5 km/u wind. Dit is geen ontbrekende testdekking: het is een test die het huidige gedrag bewust vastlegt. In fase 4 moet de testverwachting worden aangepast naar een relevante windcontext zonder gefingeerde werprichting; alleen de implementatie wijzigen zonder deze test bewust te herzien is niet voldoende.


## 8. Aanvullende controles — 15 november 2026 (vervolg)

### 8.1 Herkomstcontrole referentiesessie 19 oktober

De repository bevat naast de historische TypeScript-data ook de fixture `test-fixtures/legacy/vislogboek-backup-2026-10-26.json`. In deze oorspronkelijke backup staat een beschermde/referentiesessie op 19 oktober 2026:
- backup-ID: `ref-2026-10-19-lokkershoek`;
- omschrijving: Lokkershoek, Culemborg;
- tijd: 19:00–22:00;
- techniek: vaste hengel;
- acht afzonderlijke vangstregels, waaronder één karper van circa 10 kg, één zeelt en zes brasems;
- regionale weerscontext: o.a. windrichting O en luchtdruk 1026,1 hPa.

De hard-coded sessie in `src/db/db.ts` beschrijft dezelfde datum, tijd en acht vissen, met dezelfde soortverdeling en circa 10 kg karper, maar:
- gebruikt ID `benchmark-session-20261019` en locatie-ID `spot-mvp1g19d-dfemr2`;
- noemt Feeder & Karperhengel / Feeder-Statisch in plaats van vaste hengel;
- heeft vier gegroepeerde vangstrecords in plaats van de acht individuele backupregels;
- bevat afwijkende weerswaarden (o.a. windrichting 230° ZW en druk 1018 hPa);
- wordt als `isBenchmark: false` opgeslagen en overschrijft bij initialisatie de vier canonieke vangst-ID's.

**Conclusie:** de vaste database-sessie lijkt inhoudelijk sterk verwant aan, of afgeleid van, de echte beschermde referentiesessie uit de backup. De verschillen zijn materieel en de precieze bewerkingsgeschiedenis is niet bewezen. Dit is dus geen vrijbrief om de records als synthetische benchmark te verwijderen. Behandel ze voorlopig als mogelijk echte gebruikers-/referentiedata. De juiste vervolgstap is een veld-voor-veld provenance- en ID-relatie-audit; tot die tijd niet verwijderen, niet samenvoegen en niet automatisch herschrijven.

### 8.2 CI, Actions-limiet en lokale uitvoerbaarheid

De repositorymetadata bevestigt dat `sennzor-wq/Vislogboek` op GitHub als **private** repository staat. Daarmee is de eerder genoemde Actions-billinglimiet een plausibele verklaring voor het niet starten van hosted runners, maar niet bewezen: de repository-audit geeft geen inzage in account-/organisatieverbruik, resterend inbegrepen compute, billing hold of runnerbeschikbaarheid. De gerapporteerde `runner_id=0` en lege stappenlijsten wijzen erop dat de job niet aan een runner is begonnen; ze identificeren de oorzaak niet.

De workflow `.github/workflows/ci.yml` definieert zelf een brede deterministische suite: dependency-audits, TypeScript-typecheck, datum/DST-tests, prognose-/thermische tests, Brier- en forward-validation, research registry, positionering, waterthermiek, veilige verwijdering, backup/import/security/round-trip, sessiehengels, VisCoach en productiebuild. Dit is aanzienlijk vollediger dan de scripts-sectie in `package.json`, die slechts twee convenience-scripts declareert (`test:viscoach-greetings` en `test:audit-data-integrity`). De overige suites worden in CI direct met `bun run tsx <testbestand>` gestart. Dat is op zichzelf geen ontbrekende dekking.

**Werkafspraak:** GitHub Actions wordt niet langer als kritieke afhankelijkheid voor het afronden van de statische fase-0-audit behandeld. We kunnen broncode, workflow, scripts en testdoelen inspecteren zonder runner. Typecheck, tests en build tellen pas als uitgevoerd wanneer ze in een lokale of CI-runtime daadwerkelijk zijn gedraaid en de exitstatus/logs beschikbaar zijn. De huidige audit heeft deze opdrachten nog niet lokaal uitgevoerd; er wordt dus geen softwaretest als geslaagd gemarkeerd. De exacte Actions-billingoorzaak blijft open totdat de eigenaar de usage/billingstatus controleert of een runner weer start.

### 8.3 Testinventaris — huidige workflow

De Quality Gate bevat expliciete opdrachten voor de volgende testgroepen (bestandsnamen uit `.github/workflows/ci.yml`):
- `test-date-time.ts`, `test-thermal-and-prognosis.ts`, `test-brier-integration.ts`, `test-forward-validation.ts`;
- `test-advanced-prognosis-modules.ts`, `test-research-registry.ts`, `test-rod-positioning.ts`;
- `test-water-thermal-coupling.ts`, `test-water-temperature-learning.ts`, `test-water-history-profile.ts`, `test-water-temperature-synthetic-validation.ts`;
- `test-safe-deletion.ts`, `test-session-snapshot-commit.ts`;
- `test-viscoach-part1.ts`, `test-backup-import.ts`, `test-audit-data-integrity.ts`, `test-security-backup-validation.ts`, `test-backup-roundtrip.ts`;
- `test-session-rods.ts`, `test-session-coach.ts`, `test-session-coach-integration.ts`, `test-viscoach-greetings.ts`, `test-weather-enrichment.ts`;
- daarna `bun run lint` (TypeScript `tsc --noEmit`) en `bun run build`.

`test-core-logic.ts` is bewust niet opgenomen omdat het momenteel live Open-Meteo-netwerkverzoeken doet en nog niet is gemockt. De workflow controleert daarnaast dat private artefacten niet in `dist` belanden. De audit moet nog per blueprint-eis vaststellen of de bestaande test de gewenste inhoudelijke invariant daadwerkelijk controleert; alleen aanwezigheid in de workflow is geen bewijs van adequaatheid.

### 8.4 Bijgewerkte status en resterende fase-0-acties

- CI-billinglimiet: **plausibele hypothese, niet geverifieerd**; private repo bevestigd, accountverbruik niet beschikbaar.
- Testworkflow: **statisch geïnventariseerd**; niet lokaal of via een runner uitgevoerd op de huidige baseline.
- 19-oktober-sessie: **provenance-risico aangescherpt**; sterke inhoudelijke overeenkomst met de backup-referentiesessie, maar materiële verschillen. Niet verwijderen.
- Legacy backupfixture: **testbron aanwezig**; blijft behouden en wordt niet als productie-seed of opruimdoel behandeld.
- Nog open: volledige repositorybrede ID-verwijzingsinventaris, blueprintfactorenmatrix, volledige UI/engine-keten, en reproduceerbare lokale softwarebaseline.


### 8.5 Backup-import-, restore- en evaluatieketen — concrete inconsistenties

Vervolginspectie van `src/services/backupService.ts`, `src/services/evaluationEngine.ts`, `src/services/prognosisEngine.ts` en de UI toont extra risico's:

1. **Backup-normalisatie wist de beschermde status.** In `normalizeRawBackup()` wordt zowel ID `ref-2026-10-19-lokkershoek` als `BENCHMARK_SESSION.id` expliciet naar `isBenchmark: false` genormaliseerd. De oorspronkelijke fixture markeert de 19-oktobersessie juist als `protected: true` en `is_reference: true`. De importnormalisatie vertaalt die velden niet naar de beschermingsstatus.
2. **Merge-import kan vangsten zonder sessie importeren.** `mergeImportData()` slaat sessies met `isBenchmark: true` over, maar de daaropvolgende vangstlus voegt alle nieuwe vangsten toe zonder te controleren of hun `sessionId` in de database bestaat of in dezelfde import wordt toegelaten. Dit kan verweesde vangstrecords opleveren. De bestaande importvalidatie moet hierop worden getoetst.
3. **Restore voegt de ingebouwde referentieset na herstel altijd toe.** `restoreBackupData()` wist eerst de tabellen en herstelt vervolgens de backup, maar voegt daarna `BENCHMARK_LOCATION`, `BENCHMARK_SESSION` en de vier `BENCHMARK_CATCHES` toe als hun eigen IDs ontbreken. Een backup met de oorspronkelijke referentiesessie onder ID `ref-2026-10-19-lokkershoek` krijgt daardoor ook de afwijkende ingebouwde sessie onder ID `benchmark-session-20261019`, inclusief vier extra gegroepeerde vangsten. Dit kan dubbele representaties van dezelfde referentiegebeurtenis opleveren.
4. **Benchmarkfilters zijn vlag-afhankelijk, niet ID-afhankelijk.** `evaluationEngine.ts` sluit snapshots en sessies uit op `isBenchmark === true`; de import van `BENCHMARK_SESSION_ID` wordt in het bekeken bestand niet verder gebruikt. `prognosisEngine.ts` filtert vergelijkbare/afgeronde sessies eveneens op `isBenchmark`, niet op de vaste ID. Omdat de vaste sessie als false wordt opgeslagen, kan zij als gewone gebruikerssessie meetellen in prognosehistorie en evaluatie-input. De sessielijst laat benchmarkbescherming en verwijderblokkade eveneens afhangen van `session.isBenchmark`; de vaste sessie met false wordt dus niet als beschermd getoond.
5. **Statistiek/UI-controle nog open.** `StatsView.tsx` bevat expliciete snapshot-benchmarkfiltering; de volledige sessie-/vangststatistiekroute moet nog worden nagelopen op onbedoeld meetellen van de referentieset.

Deze punten versterken het besluit: geen opruiming of simpele vlagwijziging in fase 0. Eerst is een eenduidig datacontract nodig voor de oorspronkelijke backupreferentie, de ingebouwde test-/benchmarkrepresentatie, vangstkoppelingen, merge-import, volledige restore en modeluitsluiting. Een latere oplossing moet tests bevatten voor import van de echte legacyfixture, merge met en zonder aanwezige referentiesessie, volledige restore, herhaalde initialisatie, nul verweesde vangsten en exact één representatie van de referentiegebeurtenis.

### 8.6 Update open fase-0-acties

- [ ] Traceer `normalizeRawBackup()` en alle import-/restorepaden op behoud van `protected` / `is_reference` en benchmarkstatus.
- [ ] Test of `mergeImportData()` vangsten toevoegt waarvan de sessie wordt overgeslagen of niet bestaat.
- [ ] Test of restore van de echte legacyfixture een tweede representatie van de 19-oktoberreferentiesessie toevoegt.
- [ ] Controleer alle prognose-, evaluatie-, statistiek- en UI-filters op expliciete ID's én op vlaggen; kies later één canonieke representatie en één bron van waarheid.
- [ ] Controleer de sessie-/vangststatistiekroute op meetellen van benchmarkrecords.


### 8.7 UI-statistieken en schijnbare testdekking

De sessie-/vangststatistieken lopen via `StatsView.tsx` rechtstreeks naar `calculateStats(sessions, catches, filter)`. `statsEngine.ts` filtert op locatie, uitkomst, techniek en datum, maar sluit `session.isBenchmark` niet uit. De hard-coded 19-oktobersessie met `isBenchmark: false` telt dus als gewone sessie mee in de cijfers en vangst-per-uurstatistieken.

Ook de bestaande `test-backup-import.ts` dekt de echte merge-import niet af: de test simuleert de skipregels handmatig op basis van expliciete IDs (`BENCHMARK_SESSION.id` en `ref-2026-10-19-lokkershoek`) en vangstprefixen. De productiefunctie `normalizeRawBackup()` zet de legacy referentiesessie echter op `isBenchmark: false`, en `mergeImportData()` vertrouwt daarna op de vlag. De test controleert dus niet dat de daadwerkelijke import hetzelfde resultaat geeft als de simulatie.

**Auditconclusie:** de referentieset kan op dit moment op verschillende plekken verschillend worden behandeld: beschermd in een testfixture, als gewone sessie genormaliseerd, bij restore naast een tweede ingebouwde representatie geplaatst, en in statistieken/prognoses mogelijk als echte gebruikersdata meegeteld. Dit moet als één end-to-end datacontract worden opgelost, niet als een losse UI- of seedfix.


## 9. Productblauwdruk → code → UI → test: factor- en modelrolmatrix

Deze matrix is gebaseerd op de bindende uitgangspunten in `PROJECT_CONTEXT.md` (secties 3–8 en 10) en de VisCoach-roadmap (secties 4, 5 en 7). Dit is een statische broncode-inspectie, geen empirische validatie.

| Factor / concept uit blauwdruk | Huidige code/engine | Huidige modelrol | Auditstatus / nog te toetsen |
|---|---|---|---|
| Gemeten watertemperatuur | `waterThermalEngine.ts`, `waterTemperatureHistory.ts`, `prognosisEngine.ts` | Leidende thermische invoer wanneer geldig en aanwezig | **Aanwezig.** Provenance, meetdiepte/-tijd, lokale representativiteit en uncertainty bandbreedte per watertype controleren. |
| Geschatte watertemperatuur | `waterThermalEngine.ts`, `prognosisEngine.ts` | Alternatief wanneer geen bruikbare meting beschikbaar is; herkenbaar als schatting | **Aanwezig.** Modelkalibratie en foutmarges per water-/stektype controleren. |
| Luchttemperatuur / thermische historie | `weatherService.ts`, `waterThermalEngine.ts` | Invoer voor thermische ontwikkeling; niet rechtstreeks presenteren als watertemperatuur | **Aanwezig als thermische invoer.** Lag, hysterese, instraling, wind, vochtigheid en diepte-effecten verder toetsen. |
| Temperatuurrespons per soort | `fishProfiles.ts` + `calculateThermalEfficiency()` | Enige directe numerieke bijdrage aan de biologische activiteitsindex | **Gedeeltelijk / parameters voorlopig.** Exacte optimum-, breedte- en tolerantieparameters zijn niet door de algemene bronverwijzingen bewezen; validatie per soort, levensfase en watertype ontbreekt. |
| Luchtdruk en druktrend | `findPressureTrend()`, `prognosisEngine.ts` | Weerscontext; scorebijdrage 0 | **Bewust niet als directe factor gebruikt.** Blijft zo totdat soortspecifiek bewijs de relatie met activiteit/voedselopname ondersteunt. |
| Windrichting, snelheid en winddraaiing | `prognosisEngine.ts`, `bankWindEngine.ts`, `habitatMovementEngine.ts`, `rodPositioningEngine.ts` | Context, oppervlaktedrift, wind-/oeverrelatie en tactiek; scorebijdrage 0 | **Meerdere engines aanwezig.** Geen automatische algemene scorebonus; lokale geometrie en stroming bepalen toepasbaarheid. UI-coachtekst heeft de reeds vastgestelde strong-wind-beperking. |
| Seizoen | `getSeason()`, `fishProfiles.ts`, tactische engines | Context en input voor habitat-/positioneringsregels; scorebijdrage 0 | **Gedeeltelijk.** Seizoensgewichten in profielen zijn voorlopig en worden niet in de centrale activiteitsindex toegepast. Controleer op dubbeltelling met temperatuur. |
| Tijdstip / dag-nacht / schemering | `TIME_SLOT_HOURS`, `fishProfiles.ts`, `prognosisEngine.ts` | Voorkeursperiode als beschrijvende context; scorebijdrage 0 | **Gedeeltelijk.** Tijdvakvoorkeuren en crepusculaire hypothese zijn niet kwantitatief gevalideerd; astronomische schemering is niet hetzelfde als vaste tijdvaklabels. |
| Bewolking en neerslag | `prognosisEngine.ts`, weerdata | Beschrijvende weerscontext; scorebijdrage 0 | **Aanwezig als context.** Geen gevalideerde soort-/watertypegebonden effectgrootte. |
| Zoninstraling / lichtintensiteit | Thermische engine en weersinvoer; tijdvakcontext in prognose | Kan indirect in thermische ontwikkeling en tactische interpretatie doorwerken | **Niet aangetoond als expliciete zelfstandige activiteitsscorefactor.** Beschikbaarheid, bron, dekking en mogelijke dubbeltelling moeten worden vastgesteld. |
| Waterdiepte, watertype, bodem, dekking en lokale structuur | Locatietype + `habitatMovementEngine.ts`, `rodPositioningEngine.ts`, `bankWindEngine.ts` | Habitat-/bewegings- en positioneringscontext | **Gedeeltelijk.** Locatievelden zijn optioneel; volledigheid en daadwerkelijke invloed per engine/UI controleren. |
| Stroming, waterbeweging, waterstand, zicht en zuurstof | Habitat-/positioneringsregels bevatten contextuele aannames; geen complete afzonderlijke meetketen aangetoond | Context / lokale hypothese, niet centrale activiteitsindex | **Onvolledig/onzeker.** Scheid gemeten, afgeleid en niet beschikbaar; voorkom dat zuurstof of stroming als feit wordt gepresenteerd zonder invoer. |
| Maanstand / solunar | In de gecontroleerde centrale scoreketen niet aangetroffen | Geen aangetoonde scorebijdrage | **Niet aangetoond.** Alleen toevoegen na afzonderlijke bewijs- en productbeoordeling; niet nodig om fase 0 af te ronden. |
| Waargenomen activiteit / aanwezigheid | `presenceObservations`, sessieregistratie, `habitatMovementEngine.ts` | Lokale aanwezigheidssignalen, los van vangst | **Bouwstenen aanwezig.** Controleer tijd, zone, soortzekerheid en hoe signalen worden gebruikt zonder aanwezigheid als vangst te tellen. |
| Doelsoortvangst / nulvangst / onbekend | Sessie-uitkomst, vangstrecords, `getSimilarSessions()`, `getComparableSessions()` | Persoonlijke vangkans en historische vergelijkbaarheid | **Gedeeltelijk aanwezig.** Benchmark- en referentiesessies kunnen momenteel door foutieve vlaggen als gewone data meetellen; eerst datacontract oplossen. |
| Effectieve vistijd / hengeluren | `sessionEffortEngine.ts`, `sessionRods` | Inspanning als vergelijkingscontext | **Bouwstenen aanwezig.** Controleer of hengeluren werkelijk worden gebruikt in kansschatting en stekprofiel, en of ontbrekende intervallen onbekend blijven. |
| Aas, voer, methode en presentatie | Sessietypen, `prebaitEngine.ts`, coachservices | Tactisch advies en vergelijkingscontext | **Gedeeltelijk.** Audit welke invoer in de vergelijkingsfilters en coachbeslissing werkelijk meeweegt; voorkom causale claims op basis van kleine aantallen. |

### 9.1 Onderzoeksregister en modelgoedkeuring

`src/services/researchRegistry.ts` bevat op de huidige codebaseline zeven registraties. Alle zeven hebben `approvedForPrediction: false`. De geregistreerde onderwerpen zijn hoofdzakelijk watertemperatuur, thermische modellen, temperatuur en groei/voedselopname, plus karperdagritme en zeeltvoederefficiëntie.

De functie `isApprovedPredictionKnowledge()` controleert expliciete goedkeuring en bewijskracht. De gecontroleerde `prognosisEngine.ts` en `fishProfiles.ts` importeren deze functie/het register echter niet; de temperatuurresponsparameters in `fishProfiles.ts` worden rechtstreeks gebruikt door `calculateThermalEfficiency()`. Dit bewijst niet dat de parameters onjuist zijn, maar de formele goedkeuringspoort van het register is niet aantoonbaar verbonden met de actieve modelcode.

**Open auditvraag:** welke bronnen en empirische onderbouwing rechtvaardigen de huidige exacte temperatuurparameters per soort, en hoe wordt vastgelegd dat deze parameters voorlopig zijn zolang het register geen directe modelgoedkeuring geeft?

### 9.2 Activiteit versus vangstkans — juiste scheiding, maar benchmarkvervuilingsrisico

De roadmap en projectcontext eisen afzonderlijke behandeling van biologische activiteit, persoonlijke kans op een gelande doelvis, verwachte aantallen en lokale aanwezigheidssignalen. De code houdt de thermische activiteitsindex gescheiden van de historische sessie-/vangstkansberekening. Dit is architectonisch in lijn met de blauwdruk.

De huidige activiteitsscore is expliciet thermisch gedreven. De persoonlijke kans gebruikt historische sessies, doelsoort, tijdvak, locatie en werkelijke sessieduur waar beschikbaar. De audit moet nog bepalen of methode, aas/voer, effectieve visuren en hengeluren daadwerkelijk voldoende worden meegenomen. Door de foutieve benchmark-/referentievlaggen kan de kwaliteit van die persoonlijke historie bovendien vervuild zijn.

### 9.3 Volgende fase-0-controles

- [ ] Volledige datadictionary: veld, type, bron, optioneel/verplicht, provenance, kwaliteitsniveau en downstream gebruik.
- [ ] Volg of effectieve visuren/hengeluren, methode, aas/voer en waarnemingen de kansberekening en coach daadwerkelijk beïnvloeden, of alleen worden opgeslagen/getoond.
- [ ] Controleer de precieze thermische parameters en bronkoppeling per soort; registreer wat literatuur ondersteunt versus wat voorlopig heuristisch is.
- [ ] Controleer of `researchRegistry`-goedkeuring bewust buiten de runtime-code staat of dat een echte modelgoedkeuringscontrole ontbreekt.
- [ ] Volg zoninstraling, zuurstof, stroming, waterstand, zicht en maanstand door types → weer-/waterbron → engine → UI → tests; markeer niet beschikbare factoren expliciet.
- [ ] Beoordeel tests op inhoudelijke dekking van de blauwdruk, niet alleen op aanwezigheid in de Quality Gate.


## 10. Datadictionary, registratie-UI en daadwerkelijke inspanning

### 10.1 Beschikbare kernvelden en invoer

De centrale types `src/types/index.ts` bevatten al veel van de gewenste gegevens:
- **Locatie:** naam, GPS, watertype, waterdiepte, optionele `waterFacingDirection` en `habitatFeatures`.
- **Sessie:** start/eindtijd, werkelijke duur, aparte geplande duur/eindtijd, doelsoort(en), totaal hengelaantal, deelnemers, techniek, aas/voer, aanbeten/gemiste vissen, diepte, watertemperatuur met meettijd/-bron/-methode/-diepte, waarnemingstypen, weercontext, snapshotkoppeling en legacy-kwaliteitsvlaggen.
- **Vangst:** sessie-/locatiekoppeling, soort, aantal, gewicht/lengte, tijd, hengel, aas, techniek, notities, foto en legacy-kwaliteitsvlaggen.
- **Hengeldetails:** hengelnummer, positiezone, techniek, aas/presentatie, werkelijke actieve intervallen en gebeurtenissen (aanbeet, gemist, vangst, overig).
- **Prognose:** tijdvakfactoren, thermische status, onzekerheid, bron-/provenancevelden, modelversie, invoerfingerprint en onveranderlijke snapshotdata.

### 10.2 UI-defaults kunnen ontbrekende informatie als ingevuld opslaan

In `SessionModal.tsx` worden voor een nieuwe sessie standaardwaarden ingesteld:
- doelsoort: Karper;
- hengelaantal: 2;
- techniek: “Statisch / Feeder”;
- aas/voer: “Boilies, maden & mais”.

Deze waarden worden in de sessiepayload opgeslagen, ook wanneer de gebruiker ze niet bewust heeft bevestigd of aangepast. Dit is een UX-keuze, maar voor latere modelanalyse kan het onbekende/ongekozen informatie laten lijken op een echte observatie. De audit moet beoordelen of defaults duidelijk als voorstel worden gemarkeerd en/of als onbevestigd worden opgeslagen, zonder de snelle invoer onnodig ingewikkeld te maken.

Ook `LocationModal.tsx` vult ontbrekende GPS-coördinaten standaard met 51.9610, 5.2280 en slaat die waarden op als locatiecoördinaten. Wanneer een gebruiker een nieuwe stek invoert en deze coördinaten niet bewust aanpast of via GPS ophaalt, kan weer- en windanalyse daardoor aan een verkeerde locatie worden gekoppeld. De ontbrekende GPS-positie moet onderscheiden blijven van een echte locatiecoördinaat.

### 10.3 Oeveroriëntatie en habitatkenmerken: type aanwezig, UI-invoer niet aangetoond

`FishingLocation` bevat `waterFacingDirection` en `habitatFeatures`. De gecontroleerde `LocationModal.tsx` biedt echter alleen naam, omschrijving, watertype, diepte, GPS en notities; geen expliciete invoer voor oeveroriëntatie of gestructureerde habitatkenmerken. `bankWindEngine.ts` heeft de oeveroriëntatie nodig om de wind-oeverrelatie te bepalen. Daardoor bestaat de type-/enginecapaciteit, maar is de configuratie via de standaard stekeditor niet aangetoond. Een GPS-punt of vrije notitie mag niet als vervanging voor oeveroriëntatie worden behandeld.

### 10.4 Hengeluren worden berekend en getoond, maar niet aantoonbaar in de vangkans gebruikt

`sessionEffortEngine.ts` berekent werkelijke hengeluren uit actieve intervallen en voorkomt dubbeltelling van overlappende intervallen per hengel. `SessionsView.tsx` toont deze uitkomst bij sessiedetails. De actieve invoer van hengeldetails wordt via `App.tsx` en `db.sessionRods` opgeslagen.

De gecontroleerde vangkansroute in `prognosisEngine.ts` gebruikt echter sessieduur via `getSessionDurationHours()` voor de Poisson-blootstelling en niet `calculateSessionRodEffort()` of `sessionRods`. Hengeluren worden dus op dit moment aantoonbaar berekend/getoond, maar hun invloed op de persoonlijke vangkans of het stekprofiel is niet aangetoond. Dit is een verschil met de roadmap, die hengeluren als context voor eerlijke vergelijkingen wil gebruiken. Hengeluren mogen overigens niet zonder verdere onderbouwing als onafhankelijke vangstkansen worden vermenigvuldigd.

### 10.5 Techniek en aas/voer in historische vergelijkingen

De prognose-engine ontvangt een optionele `technique` en bewaart deze in snapshots/invoercontext. De historische vergelijkingsselectie `getComparableSessions()` filtert echter op soort en optioneel locatie, niet op techniek of aas/voer. `getSimilarSessions()` filtert op soort en tijdvak, niet op locatie, methode of aas. De huidige persoonlijke historie is dus minder tactisch vergelijkbaar dan de productblauwdruk beoogt. Dit kan bewust zijn wegens beperkte data, maar de UI moet niet suggereren dat de kansschatting al volledig methode-/aasgespecificeerd is.

### 10.6 Bijgewerkte open acties

- [ ] Beoordeel sessie-defaults voor doelsoort, hengelaantal, techniek en aas/voer als mogelijke bron van onbevestigde invoer.
- [ ] Verwijder geen GPS-waarde uit bestaande gebruikersdata; bepaal hoe nieuwe locaties zonder bevestigde coördinaten als onbekende locatie kunnen blijven bestaan.
- [ ] Volg `waterFacingDirection` en `habitatFeatures` van type tot invoer, opslag, engine en UI; bevestig dat er geen verborgen configuratieroute bestaat.
- [ ] Bepaal hoe hengeluren als vergelijkingscontext veilig kunnen worden meegenomen, zonder hengels als onafhankelijke sessies te behandelen.
- [ ] Bepaal welke techniek-/aas-/voerfilters verantwoord zijn bij de huidige kleine dataset; toon ontbrekende vergelijkbaarheid expliciet.


## 11. Statistiek- en legacykwaliteitscontrole

### 11.1 Onbekend vangstaantal telt als één vis in algemene statistieken

`normalizeRawBackup()` bewaart een vangstrecord waarvan het aantal ontbreekt als `count: 0` en markeert `legacyImportQuality.countKnown: false`. Dat is op zichzelf een goede manier om ontbrekende broninformatie niet te verzinnen.

`src/services/statsEngine.ts` berekent `totalFishCaught` echter met `(c.count || 1)`. Daardoor wordt `count: 0` (de expliciete representatie van onbekend aantal) als één vis geteld. Dezelfde totaaltelling voedt onder meer vangsten per uur en gemiddeld aantal vissen per sessie. De algemene statistieken kunnen hierdoor legacyvangsten met onbekend aantal overschatten. De prognose-Poissonroute filtert zulke vangstrecords wél met `legacyImportQuality.countKnown !== false` en `count > 0`, waardoor statistiek- en prognosegedrag uiteenlopen.

**Status:** concreet datakwaliteits-/statistiekrisico bevestigd via statische code-inspectie. Nog niet lokaal uitgevoerd of met een regressietest gereproduceerd.

### 11.2 Gevolg voor de acceptatie

Voeg in een latere implementatiefase regressietests toe voor:
- vangst met bekend aantal 1;
- groepsvangst met bekend aantal groter dan 1;
- onbekend aantal (`count: 0`, `countKnown: false`);
- legacyrecord zonder kwaliteitsvlag (backwards compatibility expliciet bepalen);
- correcte berekening van totaal, vangsten per uur en gemiddelde per sessie.

Een onbekend aantal mag niet stilzwijgend als één vis worden geïnterpreteerd. Toon desnoods het aantal geregistreerde vangstrecords apart van het bekende aantal vissen.



## 12. Besluit eigenaar: ingebouwde benchmark mag volledig verdwijnen (15 november 2026)

De gebruiker heeft expliciet bevestigd dat de ingebouwde benchmark-/demonstratiesessie uit de beginfase van de app volledig mag verdwijnen. Het was ooit een topvisavond die tijdelijk als benchmark diende, maar heeft geen blijvende betekenis meer. Deze toestemming omvat het verwijderen van de ingebouwde benchmarklocatie, -sessie en -vangsten en het verwijderen van alle productie-initialisatie-, restore-, statistiek-, prognose-, evaluatie-, UI- en testafhankelijkheden die uitsluitend voor deze ingebouwde benchmark bestaan.

**Afbakening:** deze toestemming is niet automatisch toestemming om de oorspronkelijke backupfixture of echte vangstregistraties te verwijderen. De backupfixture bevat een eigen historische referentiesessie (`ref-2026-10-19-lokkershoek`) met acht vangstregels. Die brondata blijft behouden tenzij later expliciet anders besloten. Bij opschoning moeten alle andere gebruikersdata, relaties, IDs en backupinhoud behouden blijven. Een benchmarkspecifieke testfixture mag alleen worden verwijderd als de audit aantoont dat deze uitsluitend de obsolete ingebouwde benchmark representeert; anders wordt de test omgebouwd naar een fixture-onafhankelijke regressietest.

**Implementatievoorwaarden voor fase 1:**
1. Verwijder ingebouwde benchmark seed en alle vaste-ID upsert-/delete-logica uit normale database-initialisatie.
2. Verwijder benchmarkinjectie uit volledige restore; een restore moet exact de inhoud van de backup herstellen en geen ingebouwde demo-data toevoegen.
3. Maak merge-import referentieel consistent: geen vangsten importeren waarvan de sessie in die import wordt overgeslagen of niet bestaat.
4. Verwijder de obsolete benchmark uit prognose-/evaluatie-/statistiek/UI-paden; behoud generieke ondersteuning voor expliciet als benchmark gemarkeerde testdata alleen waar tests/evaluatie dit nodig hebben.
5. Verwijder of herschrijf alleen tests die uitsluitend de ingebouwde demo-avond valideren; vervang ze door tests voor normale lege installatie, import, restore en behoud van echte gegevens.
6. Verifieer idempotentie: herhaald starten mag geen demo-data terugzetten, bestaande records overschrijven of records verwijderen.
7. Test migratie met een database waarin de ingebouwde benchmark al bestaat: verwijder alleen de exact geïdentificeerde ingebouwde IDs en alleen wanneer de records aantoonbaar de ingebouwde benchmark zijn; behoud de backup-referentiesessie en alle niet-gerelateerde data.
8. Voer voor implementatie een volledige diff-/afhankelijkheidscontrole uit; rapporteer afzonderlijk statische inspectie, daadwerkelijk uitgevoerde tests en praktijkvalidatie.

**Status:** toestemming voor het verwijderen van de ingebouwde benchmark is gegeven. Nog geen applicatiecode of database gewijzigd. De fase-0-audit en exacte verwijzingsinventaris blijven nodig vóór de uitvoering.


## 13. Afbakening technische verwijdering ingebouwde benchmark — aanvullende inventaris

Na expliciete toestemming is de codeketen nogmaals nagelopen. De ingebouwde dataset bestaat uit:
- locatie-ID `benchmark-location-lokkershoek` (oude locatie; initialisatie probeert deze alleen te verwijderen als er geen sessies meer aan hangen);
- sessie-ID `benchmark-session-20261019`;
- vier catch-ID's `benchmark-catch-brasem-1`, `benchmark-catch-zeelt`, `benchmark-catch-karper`, `benchmark-catch-brasem-2` (samen acht vissen);
- bijbehorende vaste seed- en upsert-/delete-logica in `initializeDatabaseOnce()`;
- herstelinjectie van locatie, sessie en vier vangsten in `restoreBackupData()`;
- benchmarkbescherming/labels en verwijderblokkades in sessie- en locatie-UI en veilige deletefuncties;
- imports en speciale uitzonderingen in `prognosisEngine.ts`, `evaluationEngine.ts`, `backupService.ts`, prognose-invoerfingerprints en tests.

### 13.1 Wat moet verdwijnen en wat generiek mag blijven

De volgende functionaliteit is uitsluitend gekoppeld aan de obsolete ingebouwde avond en moet in fase 1 verdwijnen: vaste IDs en objecten uit `db.ts`; de sessie-/vangstseed en canonical catch rewrite/delete-loop; de speciale mapping van de 19-oktoberreferentie naar Lokkershoek in backupnormalisatie; restore-injectie; benchmarkbadge-/beschermingscopy die alleen deze vaste avond voorstelt; de obsolete test die eist dat deze sessie bestaat; imports van `BENCHMARK_SESSION_ID` die alleen die vaste ID blokkeren; en test-/merge-simulaties die de ingebouwde locatie/sessie/vangst als een verplichte referentie behandelen.

Generieke uitsluiting van expliciet als benchmark gemarkeerde synthetische evaluatiedata mag blijven waar dit nodig is om modelvalidatie onafhankelijk te houden. Dat is geen reden om een vaste demo-sessie in iedere gebruikersdatabase te seeden. Generieke `isBenchmark`-semantiek, indien behouden, moet duidelijk beperkt zijn tot test-/evaluatiedata en mag geen echte backup- of gebruikerssessies op ID/datum/locatie stilzwijgend veranderen.

### 13.2 Bestaande tests die moeten worden vervangen/aangepast

- `test-thermal-and-prognosis.ts` bevat assertions dat de vaste sessie-ID bestaat, `isBenchmark: false` is en vier canonieke catches bevat. Vervang door tests dat een lege installatie geen ingebouwde demo-records krijgt en dat echte historische gebruikersdata correct wordt ingelezen.
- `test-brier-integration.ts` verwacht dat `initializeDatabase()` de benchmarksessie aanmaakt en daarna als protected benchmark verwijdert. Vervang dit door onafhankelijke validatietests met synthetische benchmarkfixtures die niet via productiedatabase-initialisatie worden aangemaakt.
- `test-backup-import.ts` importeert de ingebouwde benchmarkconstanten en simuleert speciale uitsluitingen voor de oude IDs. Vervang door end-to-end tests op de werkelijke `inspectImportFile()`/`normalizeRawBackup()`/`mergeImportData()`-keten, inclusief behoud van legitieme legacyreferentiedata.
- `test-backup-roundtrip.ts` bouwt zijn testdatabase met de ingebouwde benchmarkconstanten. Gebruik volledig lokale fixture-objecten en test dat export→restore exact dezelfde records teruggeeft zonder app-injectie.
- `test-safe-deletion.ts` test generieke expliciete `isBenchmark: true` bescherming. Beslis in implementatie of generieke beschermde testdata nog nodig is; verwijder in elk geval de claim dat de ingebouwde Lokkershoek-sessie beschermd moet blijven.
- `test-forward-validation.ts` controleert dat een sessie met expliciete benchmarkstatus niet wordt gesynchroniseerd/e geëvalueerd. Deze generieke modelvalidatie-invariant kan blijven met een geïsoleerde testfixture.

### 13.3 Migratie van bestaande lokale databases

De implementatie moet een eenmalige, transactionele migratie uitvoeren die alleen de exact genoemde ingebouwde IDs verwijdert. De sessie moet eerst worden opgezocht op exact ID; de vier catches alleen verwijderen wanneer hun `sessionId` gelijk is aan die ingebouwde sessie-ID en hun IDs in de expliciete allowlist staan. De oude benchmarklocatie alleen verwijderen als exact de obsolete locatie-ID aanwezig is én geen niet-benchmark sessie ernaar verwijst; anders behoud de locatie en rapporteer het conflict. Verwijder geen records op basis van alleen datum, locatie, soort, gewicht of vergelijkbare inhoud. De echte legacybackupreferentie (`ref-2026-10-19-lokkershoek`) blijft behouden.

De migratie moet idempotent zijn, atomair uitgevoerd worden en een herstel-/backupstrategie volgen. Test vóór en na migratie de aantallen en IDs van alle niet-benchmark locaties, sessies, catches, snapshots, waarnemingen, hengeldetails en geplande sessies. Bestaande gebruikerdata buiten de exacte ingebouwde allowlist mag byte-/veldgetrouw niet wijzigen.


## 14. Extra dataseed-risico: echte historische backupdata wordt op nieuwe installaties ingevoegd

De initialisatie in `db.ts` doet naast de ingebouwde benchmark nog iets zelfstandigs: zij seedt `HISTORICAL_LOCATIONS`, `HISTORICAL_SESSIONS` en `HISTORICAL_CATCHES` als records met ontbrekende IDs. `historicalData.ts` vermeldt expliciet dat deze 5 locaties, 10 sessies en 16 vangsten zijn geïmporteerd uit een concrete backup van 26 oktober 2026 (`vislogboek-backup-2026-10-26_50803f8b.json`). Dit zijn geen synthetische benchmarkrecords maar persoonlijke historische registraties.

Dit betekent dat een nieuwe installatie nu automatisch een kopie van die historische gebruikersdata krijgt. Het verwijderen van de ingebouwde benchmark mag deze historische seeding niet per ongeluk verwijderen of aanpassen, maar het bredere dataprivacy-/provenanceprobleem moet afzonderlijk worden opgelost. Gewenste richting: een nieuwe installatie start met een lege persoonlijke database en voorbeelddata is opt-in en duidelijk als voorbeeld gemarkeerd; bestaande installaties behouden hun reeds aanwezige records. Een migratie mag deze historische IDs niet blind wissen, omdat een bestaande gebruiker ze mogelijk als echte data heeft behouden of aangepast.

`initializeDatabaseOnce()` initialiseert bovendien standaardinstellingen met Lokkershoek Pier als default. Na het verwijderen van de ingebouwde benchmark moet gecontroleerd worden of deze default nog een bewuste productkeuze is en of de stek bestaat op basis van echte historische locatiegegevens. Geen defaultcoördinaten of historische records verwijderen op basis van benchmarkverwantschap.

## 15. Correctie en nadere precisering van benchmarkverwijzingen

De ingebouwde sessie en locatie zijn in de huidige code feitelijk met `isBenchmark: false` gedefinieerd. De term 'beschermde benchmark' in diverse foutmeldingen en UI-labels is daardoor generieke functionaliteit voor expliciet gemarkeerde records, niet de feitelijke status van deze vaste ingebouwde sessie. De vaste sessie is niet door `isBenchmark` beschermd; de seed blijft haar juist als gewone sessie toevoegen/updaten. De audit beschrijft daarom vanaf dit punt de vaste set als **ingebouwde demo-/referentiesessie** en reserveert **expliciete benchmarkfixture** voor testrecords die daadwerkelijk `isBenchmark: true` hebben.

Bij fase 1 moet ook de ongebruikte/obsoleet geworden import `BENCHMARK_SESSION_ID` in `evaluationEngine.ts` worden onderzocht en verwijderd als die geen functionele rol heeft. De import in `prognosisEngine.ts` moet worden verwijderd als die niet daadwerkelijk wordt gebruikt. Generieke `isBenchmark`-filters kunnen blijven voor geïsoleerde evaluatietestfixtures; vaste datum-/ID-uitzonderingen mogen niet blijven bestaan.



## 16. Aanvullend eigenaarbesluit: alle historische vangstregistraties mogen verdwijnen (15 november 2026)

De eigenaar heeft de eerdere beperkte toestemming voor alleen de ingebouwde demo-/benchmarkavond uitgebreid: **alle reeds aanwezige historische vangstregistraties mogen worden verwijderd** om met een schone vangstdataset in 2026 verder te gaan. Dit omvat dus ook de historische vangstrecords uit de persoonlijke backupfixture van 26 oktober 2026 die eerder als echte historische gebruikersdata beschermd werden. De eerdere formulering dat deze historische vangsten zonder nieuwe toestemming behouden moeten blijven, is hiermee vervangen.

De toestemming geldt voor historische vangstregistraties die vóór de reset bestaan. Ze is geen toestemming om toekomstige vangsten na de reset te wissen. Nieuwe installaties mogen historische vangsten niet automatisch seedden; restore mag geen data toevoegen die niet in de backup staat. Een eenmalige migratie moet exact afgebakend, idempotent en veilig zijn, met aantoonbaar behoud van nieuwe registraties.

**Niet stilzwijgend inbegrepen:** historische sessies zonder vangsten, locaties, instellingen, prognosesnapshots, waarnemingen en andere gebruikersgegevens. Die blijven behouden totdat de eigenaar expliciet anders beslist. De vraag of sessies zonder vangsten ook verwijderd mogen worden, staat nog open. Er is nog geen app-code, migratie of gebruikersdatabase gewijzigd.


## Verplichte GitHub-werkwijze — altijd toepassen

- Bundel alle aanpassingen die bij één opdracht/werkeenheid horen in **één enkele Git-commit**. Sla nooit bestanden één voor één op via afzonderlijke commits.
- Gebruik standaard de commit-message-suffix **`[skip ci]`**, zodat documentatie- en andere wijzigingen niet onbedoeld GitHub Actions starten.
- Laat `[skip ci]` uitsluitend weg wanneer de gebruiker expliciet vraagt om de GitHub Action(s) te laten draaien.
- Als de gebruikte GitHub-interface geen multi-file commit in één keer ondersteunt, gebruik dan Git Trees + één commit (of een gelijkwaardige atomische Git-operatie). Gebruik niet als workaround meerdere Contents API-writes.
- Controleer vóór het committen de volledige verzamelde diff en de actuele HEAD van `main`; commit alleen de bedoelde bestanden.
- Controleer na het committen dat precies één commit is aangemaakt en dat alle bedoelde bestanden daarin zitten. Rapporteer commit-SHA, gewijzigde bestanden en of CI bewust is overgeslagen.
- Deze regel geldt voor documentatie, code, tests, configuratie, workflows en alle andere repositorybestanden. Alleen een expliciete afwijkende opdracht van de gebruiker kan hiervan afwijken.


## 17. Definitieve scope schone start: alle historische sessies én vangsten (15 november 2026)

De eigenaar heeft bevestigd dat niet alleen alle historische vangstrecords, maar ook **alle historische sessies zonder vangsten** verwijderd mogen worden. Dit vervangt de open vraag uit §16 en de eerdere beperking dat sessies behouden moesten blijven.

De eenmalige migratie mag alle bestaande records in `sessions` en `catches` verwijderen. Afgeleide sessiegegevens moeten relationeel worden afgehandeld:
- `sessionRods` en sessiegebonden `coachAdviceRecords` verwijderen;
- `presenceObservations` alleen verwijderen wanneer `sessionId` naar een verwijderde sessie verwijst; locatiegebonden waarnemingen zonder sessiekoppeling behouden;
- `prognosisSnapshots` behouden als voorspellinghistorie, maar koppelingen naar verwijderde sessies en de bijbehorende feitelijke uitkomstvelden verwijderen zodat ze niet meer als geëvalueerde sessie gelden;
- `plannedSessions` behouden en alleen een `startedSessionId` ontkoppelen als die naar een verwijderde sessie verwees;
- locaties, instellingen, weercache en niet-sessiegebonden waarnemingen behouden.

Productie-initialisatie moet alle automatische historische data-seeding verwijderen. Een nieuwe installatie start zonder vooraf geladen locaties, sessies en vangsten. Een expliciete restore blijft de door de gebruiker gekozen backup herstellen, maar voegt nooit extra ingebouwde benchmarkdata toe. Merge-import mag geen vangsten, hengeldetails, sessiegebonden waarnemingen of coachadviezen toevoegen als hun ouder-sessie niet daadwerkelijk is toegelaten.

**Acceptatiecriteria:** een v4→v5 migratietest met bestaande sessies/vangsten en alle relevante relaties; behoud van locaties, weercache, geplande sessies en losse waarnemingen; snapshots correct ontkoppeld; lege nieuwe installatie; herhaald initialiseren; en bewijs dat na de migratie nieuw ingevoerde sessies/vangsten blijven bestaan. Statische inspectie, uitgevoerde tests en praktijkvalidatie worden afzonderlijk gerapporteerd.

**Status:** toestemming compleet; implementatie nog niet uitgevoerd. Deze paragraaf vervangt de eerdere open afbakening in §16.


## 18. Implementatie schone start — codewijziging voorbereid (15 november 2026)

De v4→v5 database-upgrade voert een eenmalige reset uit van alle bestaande sessies en vangsten. De migratie ruimt sessiegebonden hengeldetails en coachadviezen op, verwijdert alleen sessiegekoppelde presence-observaties, ontkoppelt snapshots en wist hun feitelijke uitkomstvelden, en ontkoppelt geplande sessies. Locaties, instellingen, weercache, prognosehistorie en locatiegebonden waarnemingen blijven behouden. De oude technische benchmarklocatie wordt alleen verwijderd als geen gepland plan ernaar verwijst.

Automatische historische data-seeding is uit productie-initialisatie verwijderd; restore injecteert geen vaste benchmarkrecords meer. Merge-import laat vangsten en sessiegebonden afhankelijkheden alleen toe wanneer de ouder-sessie bestaat. De vaste benchmark-ID-uitzonderingen zijn uit de backup-normalisatie gehaald, zodat een handmatig geselecteerde backup niet op basis van een historische datum/ID wordt aangepast.

Een afzonderlijke v4→v5 regressietest is toegevoegd, inclusief behoud van na de migratie aangemaakte sessies en vangsten. **Uitvoering van tests/build/lint moet nog worden bevestigd; deze codewijziging mag dus nog niet als software-getest of praktijk-gevalideerd worden gerapporteerd.**


## 19. Read-only hercontrole op actuele main — 15 november 2026, 17:47

Deze sectie legt de eerste hercontrole vast. Dit is nadrukkelijk nog geen afronding van fase 0.

### 19.1 Repository- en Quality Gate-status

- De actuele main HEAD is 18fe8848535435624c9579130b253adfe289b732. De parent is 20f53dc34d572105a26ee0b5c692ba74e546bc02, waarop de huidige applicatiecode staat.
- De GitHub-vergelijking vanaf de oorspronkelijke auditbaseline 4831fd6 toont 28 commits en wijzigingen in zowel documentatie als applicatiecode/tests. De traceerbaarheidsmatrix moet daarom tegen de huidige code worden afgerond.
- Er zijn op dit moment geen open pull requests. De twee open projectissues zijn #49 en #50.
- Er zijn veel historische branches. main blijft volgens de bestaande projectafspraak de enige bron van waarheid; er is geen reden om nu nieuwe branches te maken of oude branches blind te verwijderen.
- De meest recente waargenomen Quality Gate-run is 43726513010 op commit 55a5062. De job eindigde als failure en rapporteerde geen uitgevoerde stappen. Dit levert geen testresultaat op. De oorzaak is onbekend en is niet als applicatiecodefout vastgesteld.
- De huidige main-commits na die run bevatten [skip ci]. Tijdens deze hercontrole is geen workflow gestart of opnieuw uitgevoerd.

### 19.2 Schone-startmigratie en testdekking

- Databaseversie 5 bevat een eenmalige upgrade van v4 naar v5. De migratie verwijdert alle sessies en vangsten die vóór de upgrade aanwezig zijn, inclusief bevestigde nulvangstsessies. Dit komt overeen met het expliciete eigenaarbesluit van 15 november 2026.
- De migratie verwijdert sessiegebonden hengeldetails en coachadviesrecords, verwijdert presence-observaties die gekoppeld zijn aan de oude sessies, ontkoppelt snapshots die naar die sessies verwijzen of via session.snapshotId aan die sessies gekoppeld waren, en wist bij die snapshots de evaluatie-uitkomstvelden.
- Geplande sessies blijven behouden; een verwijzing naar een verwijderde gestarte sessie wordt leeggemaakt. Locaties, instellingen, weercache, losse locatie-waarnemingen en niet-gekoppelde prognosesnapshots blijven behouden. De oude technische benchmarklocatie wordt alleen verwijderd wanneer geen gepland plan ernaar verwijst.
- Nieuwe database-initialisatie zaait geen historische locaties, sessies of vangsten meer; alleen standaardinstellingen worden aangemaakt. Die standaardinstellingen verwijzen nog wel naar de naam en coördinaten van Lokkershoek Pier. Controleer in de resterende UI-audit of dit zonder aangemaakte locatie tot verwarring of een onbedoelde weer-/locatiecontext leidt.
- test-clean-start-migration.ts en het package-script bestaan, maar de test wordt niet aangeroepen in .github/workflows/ci.yml. De test is niet uitgevoerd. De bestaande test dekt een representatieve v4-database, een lege nieuwe installatie en behoud van na de migratie ingevoerde sessies/vangsten.
- Aanvullende migratietestgevallen blijven nodig: een geëvalueerde snapshot zonder geldige sessiekoppeling, verweesde sessiegebonden waarnemingen en een expliciete controle dat alle bedoelde evaluatievelden na reset leeg zijn. De actuele test bewijst deze randgevallen niet.

### 19.3 Backup en restore — concrete compatibiliteitsbevinding

- collectBackupData en restoreBackupData verwerken tien persistente tabellen. restoreBackupData wist en vult die tabellen binnen één IndexedDB read/write-transactie.
- replaceWithImportData maakt eerst een JSON-export via exportDatabaseToJson en voert daarna de volledige restore uit. De huidige round-triptest test restoreBackupData rechtstreeks; de volledige replaceWithImportData-flow en het daadwerkelijke veiligheidsdownloadpad zijn niet aangetoond.
- Er is een concrete legacy-importcompatibiliteitsfout gevonden. De meegeleverde legacyfixture van versie 2 heeft het formaat met spots en geneste catches. normalizeRawBackup verwerkt dit via de tweede normalisatieroute, maar geeft daarin geen lege plannedSessions- en coachAdviceRecords-arrays terug.
- inspectImportFile vereist inmiddels beide arrays voor elke backup. Daardoor wordt deze legacyfixture bij de gebruikersimport afgewezen voordat de preview verschijnt. test-backup-import.ts test alleen normalizeRawBackup en test niet de volledige inspectImportFile-route met deze fixture. De round-triptest test wel een platte legacy v2-structuur, maar niet dit daadwerkelijke spots/catches-formaat.
- validateBackupPayloadLimits neemt plannedSessions en coachAdviceRecords niet op in de collectie- en totaalrecordlimieten. Dit is een aanvullende validatie-/robuustheidslacune.
- Deze punten moeten als gerichte backupregressies worden getest voordat de backup- en restoreketen als volledig gevalideerd wordt beschouwd.

### 19.4 Prognose, evaluatie en leercyclus

- evaluatePrognosisPerformance berekent een gemiddelde Brier-score en kalibratiegroepen. Alleen geldige, vooraf vastgelegde prognoses met een afgeronde, gekoppelde sessie en overeenkomende uitkomst tellen mee. Per sessie en doelsoort wordt de vroegste geldige snapshot gebruikt. Er zijn minimaal vijf onafhankelijke uitkomsten nodig voor de Brier-score.
- De Brier Skill Score vergelijkt op dezelfde testgevallen met een rolling baseline van eerdere sessies van dezelfde doelsoort waarvan de uitkomst vóór het prognosemoment bekend was. Dit beperkt future leakage in die baseline.
- De StatsView toont geaggregeerde Brier/BSS en kalibratiegroepen. Een individuele foutkaart die verklaart waarom een specifieke Brier-bijdrage hoog of laag was, is in de huidige UI niet aangetoond.
- De prognose-engine gebruikt de Brier-score niet als directe terugkoppeling. De persoonlijke vangstkans wordt wel gevoed door historische succesfrequentie en een Poisson-vangsttempo. Watertemperatuurkalibratie is een afzonderlijke route.
- dataQualityEngine is in de prognose-engine geïntegreerd, maar beoordeelt momenteel vooral herkomst en beschikbaarheid van drie invoercategorieën: watertemperatuur, weersverwachting en vergelijkbare sessiehistorie. Dit is geen volledige controle op dubbele records, verkeerde koppelingen, foutieve vangstaantallen of onjuiste meetwaarden.
- researchRegistry bevat kennisitems met approvedForPrediction op false. De functie isApprovedPredictionKnowledge bestaat, maar een runtime-goedkeuringscontrole in de actieve prognose-/soortprofielketen is niet aangetoond.
- Persoonlijke vergelijkingen zijn gedeeltelijk gescheiden: getSimilarSessions filtert op doelsoort en tijdvak, terwijl getComparableSessions filtert op doelsoort en eventueel locatie. Techniek en aas/voer zijn geen harde vergelijkingsfilters. De Poisson-laag gebruikt bekende sessieduur en bekende aantallen waar beschikbaar.

### 19.5 Invoerkwaliteit en VisCoach

- LocationModal vult een nieuwe locatie standaard in met vaste coördinaten 51.9610, 5.2280 en schrijft deze fallback ook bij opslaan. Als de gebruiker die waarden niet bewust controleert, kan een locatie met onjuiste GPS-data ontstaan.
- FishingLocation bevat waterFacingDirection en habitatFeatures en de wind-/positioneringsengines gebruiken deze velden, maar LocationModal biedt geen zichtbare invoervelden om ze vast te leggen.
- SessionModal vult nieuwe sessies standaard in met doelsoort Karper, twee hengels, techniek Statisch / Feeder en aas/voer Boilies, maden & mais. Deze waarden worden in de sessiepayload opgeslagen als de gebruiker ze niet aanpast. Dit kan persoonlijke vergelijkingsdata vervuilen wanneer de defaults niet overeenkomen met de werkelijke sessie.
- statsEngine telt vangstrecords met count 0 of onbekend als één vis via count || 1. De Poisson-prognoselaag sluit onbekende aantallen juist uit. Daardoor kunnen statistieken en prognosehistorie verschillende aantallen vissen rapporteren.
- De VisCoach-tekst toont een wind-/werprichtingssectie alleen wanneer isStrongWind true is. De bestaande test verwacht dat de sectie bij zwakke wind ontbreekt. Dit blijft een bekende afwijking van de gewenste bredere windcontext; exacte werprichting mag alleen worden gegeven wanneer de geometrie voldoende bekend is.

### 19.6 Nog open om fase 0 af te ronden

- De volledige blueprint → code → UI → test-matrix is nog niet af.
- De repositorybrede inventaris van alle benchmark-ID's, isBenchmark-verwijzingen, historische import-/seedpaden en fixtureafhankelijkheden moet nog volledig worden afgetekend.
- De legacy backupfout en de ontbrekende collectiegrenzen moeten worden omgezet in concrete regressietests en daarna in een latere implementatiefase worden hersteld.
- De migratietest moet in de Quality Gate worden opgenomen of op een andere reproduceerbare manier aantoonbaar worden uitgevoerd. Er mag geen CI-run worden gestart zonder expliciete opdracht van de gebruiker.
- Typecheck, relevante tests en productiebuild zijn op de huidige app-codebaseline niet aantoonbaar uitgevoerd. De Quality Gate levert momenteel geen bruikbare testuitvoering omdat de job vóór de eerste stap faalt.
- De IndexedDB van een echte gebruikersinstallatie is niet toegankelijk via deze repository-audit; lokale gebruikersdata en een echte browserrestore moeten apart worden gecontroleerd.

**Conclusie:** fase 0 blijft in uitvoering. De code voor de schone start is aanwezig, maar nog niet softwarematig gevalideerd. De legacy backup-import bevat een aantoonbaar probleem. Er zijn nog geen productcode- of gebruikersdatamutaties uitgevoerd tijdens deze audit.


## 20. Vervolgcontrole en testbasis op actuele main — 16 november 2026

### 20.1 Repositorystatus en wijzigingsscope

- De actuele `main`-commit vóór deze documentatie-/CI-update is `5dbf3b4e8afcd67f5d879f2944c6f60eea71c55f`.
- Deze commit verwijdert de ongebruikte `scripts/generate-historical-data.ts`, die historische data uit een persoonlijke backupfixture kon genereren. Er is geen caller of package-script voor dit bestand gevonden. De clean-startafspraak blijft leidend: geen historische vangst-/sessiedata automatisch seedden.
- `test-core-logic.ts` gebruikt nu eigen synthetische evaluatiegegevens in plaats van verwijderde benchmarkconstanten en bevat geen afhankelijkheid meer van de oude historische Lokkershoek-vangstfixture.
- `test-forward-validation.ts` gebruikt een eigen synthetische benchmark-ID in plaats van de verwijderde productieconstante.
- De wijziging is één commit geweest. Er is geen gebruikersdatabase of bestaande lokale IndexedDB aangepast.

### 20.2 Uitgevoerde controle

- Op 16 november heeft de eigenaar lokaal `bun run lint` uitgevoerd. Uitvoer: `tsc --noEmit`; er werden geen TypeScript-fouten gerapporteerd.
- Dit bewijst alleen dat de TypeScript-typecheck op de lokale checkout slaagt. Het bewijst niet dat tests, dependency-audits of de productiebuild slagen.
- De bestaande GitHub Actions-workflow bevat al `test-forward-validation.ts`, maar riep `test-clean-start-migration.ts` nog niet aan. Het package-script `test:clean-start-migration` bestaat wel. Deze audit-update voegt die regressietest toe aan de Quality Gate.
- `test-core-logic.ts` is bewust niet aan de bestaande CI-workflow toegevoegd: de test doet live Open-Meteo-aanroepen en is daardoor niet deterministisch/offline. De gewijzigde test moet nog afzonderlijk op een netwerkbeschikbare lokale omgeving worden uitgevoerd, tenzij de externe aanroepen later geïsoleerd/gemockt worden.

### 20.3 Nog uit te voeren — geen resultaten vooruitlopen

- De Quality Gate op de bijgewerkte `main` moet alle workflowstappen uitvoeren. Typecheck, tests, dependency-audits en productiebuild zijn pas geslaagd nadat de bijbehorende GitHub Actions-run groen is.
- Controleer expliciet de clean-startmigratietest en forward-validationtests in de workflow-uitvoer.
- Voer `test-core-logic.ts` lokaal uit en beoordeel iedere fout inhoudelijk. Herstel geen test door historische seeddata terug te plaatsen, assertions zonder bewijs af te zwakken of tests uit te schakelen.
- Als de Quality Gate faalt, classificeer de fout eerst als workflow-/runnerprobleem, dependencyprobleem, bestaande regressie of fout in de recente wijziging. Pas daarna gericht aan.
- De volledige blueprint → code → UI → test-matrix, de repositorybrede benchmark-/seedverwijzingsaudit en de concrete backup-importregressies uit §19 zijn nog niet afgetekend.

**Conclusie:** fase 0 blijft in uitvoering. De typecheck is bevestigd; de volledige softwarevalidatie is nog pending. Fase 1 start niet voordat de audit en de vereiste regressiecontroles aantoonbaar zijn afgerond.


## 21. Quality Gate-run 529 — runner startte niet (16 november 2026)

De commit `26576d0c78a6c9cbbae42d8a90180fb2248ba782` activeerde Quality Gate-run [#529](https://github.com/sennzor-wq/Vislogboek/actions/runs/43836519603). De run eindigde vrijwel direct met conclusie `failure`.

- De job `Typecheck, tests and production build` is aangemaakt, maar de GitHub Actions-job bevatte nul uitgevoerde stappen.
- Het ophalen van de joblogs leverde geen beschikbare logblob op (404 / BlobNotFound).
- Er is dus geen bewijs dat dependencies zijn geïnstalleerd, de typecheck/tests zijn uitgevoerd of de productiebuild is gestart.
- Dit is geen testfailure en mag niet als applicatiecodefout worden geclassificeerd. De oorzaak van het niet starten is met de beschikbare rungegevens niet vast te stellen; een runner-/accountlimiet is mogelijk maar niet bewezen.

**Vervolg:** laat de deterministische clean-startmigratietest lokaal uitvoeren zolang de GitHub-runner geen stappen start. Daarna kan de audit verder met de lokale core-logic-test (die live Open-Meteo gebruikt) en de resterende code-/UI-matrix. Geen herhaalde CI-runs starten zonder aanwijzing dat de runner weer beschikbaar is.


## 22. Core-logic testanalyse en fixturecorrectie — 16 november 2026

De eigenaar heeft op de lokale checkout `bun run tsx test-core-logic.ts` uitgevoerd: **26 geslaagd, 25 mislukt**. De failures zijn inhoudelijk geclassificeerd voordat code is aangepast:

- **Temperatuurrespons (groep 1):** de test gaf luchttemperaturen door maar liet de watertemperatuur ongemeten. De huidige thermische engine weigert bewust een fictieve watertemperatuur. De testfixture moet daarom een expliciete synthetische watermeting aanleveren; de productie-regel voor ontbrekende waterdata blijft intact.
- **Persoonlijke vangststatistiek (groep 3 en 5):** meerdere synthetische sessies hadden `outcome: 'catch'` maar geen gekoppelde `CatchItem`. De engine sluit zulke sessies terecht uit als doelsoortsucces. De tests krijgen expliciete synthetische doelsoortvangsten. De fixtures leveren hiervoor minimaal 72 uur voorafgaande synthetische uurlijkse weersdata aan, zodat de weather-only route een expliciete modelschatting kan maken zonder een lokale meting te fingeren.
- **Viswaarnemingen (groep 4):** de bestaande test eiste een numerieke aanwezigheidsbonus, maar de productiecode bevat geen empirisch gevalideerde bonusfactor. Er wordt geen arbitraire bonus toegevoegd. De waarneming blijft contextinformatie en de prognose vermeldt expliciet dat er geen numerieke bonus wordt toegepast zolang het effect niet empirisch is gevalideerd.

De testfixtures en deze expliciete onzekerheidsnotitie zijn voorbereid in één wijzigingsset. **De aangepaste tests zijn nog niet opnieuw uitgevoerd**; de uitslag blijft dus pending. De live Open-Meteo-afhankelijkheid van deze suite blijft bestaan. Geen historische data is teruggezet en er is geen CI-run gestart.


### Aanvullende correctie — weather-only fixtures

Bij controle van de thermische invoer bleek dat de vorige testcorrectie voor de temperatuurcurves een waarde via `userWaterTemp` meegaf. Dat veld betekent een echte lokale meting, niet een schatting. Dit was semantisch onjuist voor deze tests. De fixtures zijn daarom aangepast: ze gebruiken nu minimaal 72 uur synthetische voorafgaande weersdata en laten `userWaterTemp` leeg. Daarmee testen ze expliciet de weather-only schattingsroute. De dedicated tests voor een echte lokale meting blijven afzonderlijk bestaan. Deze wijziging is nog niet lokaal uitgevoerd; de suite blijft pending.


## 23. Volledige lokale Quality Gate-validatie — 16 november 2026

De eigenaar heeft de volledige set stappen uit de actuele `.github/workflows/ci.yml` lokaal uitgevoerd, omdat de eerder waargenomen GitHub Actions-runner (#529) geen workflowstappen startte. Er is voor deze validatie geen nieuwe GitHub Actions-run gestart.

### 23.1 Dependencycontrole en statische analyse
- `bun install --frozen-lockfile`: voltooid; 490 installs gecontroleerd over 619 packages, zonder wijzigingen.
- `bun audit --prod`: geen kwetsbaarheden gevonden (188 packages gecontroleerd).
- `bun audit --audit-level=high`: geen kwetsbaarheden op high-niveau gevonden (568 packages gecontroleerd; 3 meldingen onder de ingestelde drempel).
- `bun run lint`: `tsc --noEmit` voltooid zonder TypeScript-diagnostiek.

### 23.2 Lokale tests
De eigenaar rapporteerde de volgende resultaten:
- `test-date-time.ts`: 17 geslaagd, 0 mislukt.
- `test-thermal-and-prognosis.ts`: 40 geslaagd, 0 mislukt.
- `test-brier-integration.ts`: 48 geslaagd, 0 mislukt.
- `test-forward-validation.ts`: 28 geslaagd, 0 mislukt.
- `test-advanced-prognosis-modules.ts`: 80 geslaagd, 0 mislukt.
- `test-research-registry.ts`: research registry-, soortenbiologie-evidence- en soortprofielbronlinktests voltooid.
- `test-rod-positioning.ts`: 96 geslaagd, 0 mislukt.
- `test-water-thermal-coupling.ts`: 32 geslaagd, 0 mislukt.
- `test-water-temperature-learning.ts`: 15 geslaagd, 0 mislukt.
- `test-water-history-profile.ts`: 13 geslaagd, 0 mislukt.
- `test-water-temperature-synthetic-validation.ts`: 12 geslaagd, 0 mislukt.
- `test-safe-deletion.ts`: 29 geslaagd, 0 mislukt.
- `test-session-snapshot-commit.ts`: 11 geslaagd, 0 mislukt.
- `test-viscoach-part1.ts`: 28 geslaagd, 0 mislukt.
- `test-backup-import.ts`: uitgevoerd; de uitvoer controleerde het v2-backupformaat, aantallen locaties/sessies/vangsten, sessies zonder locatie, onbekende uitkomsten en gewichten, plus een merge-simulatie. De uitvoer bevatte geen expliciete totaaltelling met geslaagd/mislukt; daarom wordt hier geen formele testsamenvatting geclaimd.
- `test:audit-data-integrity`: 12 geslaagd, 0 mislukt.
- `test:clean-start-migration`: 16 geslaagd, 0 mislukt.
- `test-security-backup-validation.ts`: voltooid met melding dat de security-backup-validatietests geslaagd zijn.
- `test-backup-roundtrip.ts`: 41 geslaagd, 0 mislukt.
- `test-session-rods.ts`: 10 geslaagd, 0 mislukt.
- `test-session-coach.ts`: 48 geslaagd, 0 mislukt.
- `test-session-coach-integration.ts`: door de eigenaar uitgevoerd zonder fouten.
- `test-viscoach-greetings.ts`: door de eigenaar uitgevoerd zonder fouten.
- `test-weather-enrichment.ts`: door de eigenaar uitgevoerd zonder fouten.
- Aanvullend, buiten de workflow: `test-core-logic.ts` is lokaal opnieuw uitgevoerd met 51 geslaagd, 0 mislukt. Deze test blijft buiten de CI-workflow zolang de live Open-Meteo-afhankelijkheid niet geïsoleerd of gemockt is.

### 23.3 Productiebuild en privacycontrole
- `bun run build`: geslaagd. Vite transformeerde 1699 modules en bouwde de productie-output; de PWA-serviceworker en precache werden gegenereerd.
- Er waren twee niet-blokkerende waarschuwingen: gebruik van `__dirname` in `vite.config.ts` met de native config loader, en een JavaScript-chunk van circa 802 kB boven de standaardgrens van 500 kB. Dit zijn optimalisatiepunten, geen buildfouten.
- De controle op privéartefacten in `dist` is uitgevoerd en gaf: `PASS: No private artifacts detected in dist`.

### 23.4 Interpretatie en resterende scope
De volledige Quality Gate-commandoset is lokaal uitgevoerd zonder gemelde fouten; de drie laatst resterende workflowtests en de productieprivacycontrole zijn eveneens bevestigd. Dit is lokale validatie door de eigenaar, geen GitHub-hosted Actions-run. De backup-importtest heeft geen expliciete formele eindtelling in de vastgelegde uitvoer en wordt daarom apart genuanceerd.

Fase 0 is hiermee **niet automatisch afgerond**. De resterende auditwerkzaamheden uit §19–22 blijven gelden: de volledige blueprint → code → UI → test-matrix, repositorybrede benchmark-/seedverwijzingsaudit, gerichte legacy-backup-importregressies en controle van de eerder gevonden backupvalidatiegrenzen. Ook moet de daadwerkelijke `replaceWithImportData`-flow en het veiligheidsdownloadpad worden afgedekt. Fase 1 blijft gesloten totdat deze auditonderdelen zijn afgerond en beoordeeld.


## 24. Gerichte hercontrole backup-import en restoreketen — 16 november 2026

Deze controle is read-only uitgevoerd op `main` commit `60ac3c631522b1c2884a2313d91241dbb8053ceb`. Er is geen applicatiecode, testcode, backupbestand of gebruikersdatabase gewijzigd.

### 24.1 Legacy v2-backup: afwijzing vóór importpreview bevestigd

De aanwezige legacyfixture `test-fixtures/legacy/vislogboek-backup-2026-10-26.json` heeft rootvelden `format`, `version`, `exported_at`, `sessions`, `spots`, `settings` en `photos`. Het betreft versie 2 met 5 stekken, 11 sessies en 24 vangsten die genest onder de sessies staan. Er zijn op rootniveau geen platte `locations`-, `catches`-, `plannedSessions`- of `coachAdviceRecords`-collecties.

De feitelijke keten in `src/services/backupService.ts` is:
1. `inspectImportFile()` parseert het JSON-bestand en roept `normalizeRawBackup()` aan.
2. De legacyroute (Geval 2: `spots` en geneste `catches`) zet de stekken, sessies en vangsten om.
3. De returnwaarde van deze route bevat standaardarrays voor `weatherCache`, `prognosisSnapshots`, `presenceObservations` en `sessionRods`, maar niet voor `plannedSessions` en `coachAdviceRecords`.
4. `inspectImportFile()` eist vervolgens dat alle negen hoofdcollecties arrays zijn, inclusief `plannedSessions` en `coachAdviceRecords`.

**Conclusie: defect bevestigd.** De bestaande versie-2-legacyfixture wordt door de volledige inspectieroute afgewezen voordat de importpreview wordt getoond. Dit is geen theoretisch risico.

### 24.2 Waarom de bestaande test dit niet detecteert

`test-backup-import.ts` leest de legacyfixture en roept alleen `normalizeRawBackup(raw)` aan. De test roept `inspectImportFile()` niet aan en controleert dus niet of het bestand de volledige gebruikersimportvalidatie passeert.

`test-backup-roundtrip.ts` test wel `inspectImportFile()`, maar gebruikt voor de legacygevallen platte v2/v3-objecten met `locations`, `sessions` en `catches`. Het specifieke historische `spots` + geneste `catches`-formaat ontbreekt in die inspectieregressietests.

### 24.3 Backup-limietcontrole mist twee collecties

`validateBackupPayloadLimits()` bouwt zijn collectie-overzicht op uit locaties, sessies, vangsten, weercache, prognosesnapshots, aanwezigheidwaarnemingen en hengeldetails. `plannedSessions` en `coachAdviceRecords` ontbreken zowel in de per-collectielimieten als in de totale recordtelling en de daaropvolgende recursieve inspectie.

De bestandsgroottegrens van 50 MB blijft wel van toepassing. De ontbrekende collectiegrenzen betekenen echter dat deze twee collecties niet dezelfde expliciete aantals-, record-ID-, nesting- en veldvalidatie krijgen als de andere persistente collecties. Dit moet als afzonderlijk beveiligings-/robuustheidspunt worden afgedekt.

### 24.4 Vervang-herstel en veiligheidsdownload

De aangeroepen keten is `SettingsView.handleConfirmReplace()` → `replaceWithImportData()` → `exportDatabaseToJson()` → `restoreBackupData()`.

- `replaceWithImportData()` maakt eerst een veiligheidsbackup via `exportDatabaseToJson()` en start daarna de restore.
- `exportDatabaseToJson()` maakt de JSON-Blob, start een browserdownload via een tijdelijke anchor en revoke't de object-URL direct na de klik.
- `restoreBackupData()` wist en vult de tien persistente tabellen in één IndexedDB read/write-transactie.
- De UI meldt na terugkeer dat de veiligheidsbackup is gedownload.
- `test-backup-roundtrip.ts` test `restoreBackupData()` rechtstreeks; het test niet `replaceWithImportData()`, de daadwerkelijke downloadtrigger of de complete UI-flow.

**Conclusie:** de codevolgorde is statisch vastgesteld, maar de veiligheidsdownload en de volledige vervang-flow zijn niet end-to-end aangetoond. Dit blijft een expliciet test-/browservalidatiepunt; de audit claimt niet dat de download in iedere browser aantoonbaar is voltooid.

### 24.5 Fase-0-uitkomst en vervolg

Bevestigde bevindingen:
- Legacy v2 `spots`/geneste-`catches`-backup wordt afgewezen door `inspectImportFile()`.
- De bestaande legacy-importtest mist de volledige inspectieroute.
- `plannedSessions` en `coachAdviceRecords` ontbreken in de payloadlimiet- en recursieve inspectie.
- De volledige `replaceWithImportData()`- en veiligheidsdownloadketen heeft geen directe integratietest.

De bevindingen zijn uitsluitend vastgelegd; **er is bewust geen code- of testfix uitgevoerd**, omdat fase 0 read-only blijft. De correcties en regressietests horen bij de uitvoeringsfase nadat de audit is afgerond en geaccepteerd. Fase 0 blijft open; fase 1 blijft gesloten.


## 25. Traceerbaarheidsmatrix — kernketen prognose → VisCoach → sessie → evaluatie (16 november 2026)

Deze matrix is een read-only controle van de actuele implementatie op `main` commit `5a06318d892c6868b0d4c78648bebe2485b7a55e`. "Aanwezig" betekent dat code én een concrete UI- of servicekoppeling zijn aangetroffen; het betekent niet automatisch dat de volledige browserflow end-to-end is gevalideerd.

| Blueprint-eis / gebruikersfunctie | Code en serviceketen | UI-koppeling | Testbewijs | Status en beperking |
|---|---|---|---|---|
| VisCoach als primaire instap en hervatten van actieve sessies | `src/App.tsx`: standaardtab `viscoach`, welkomstmodal, actieve sessies detecteren en na laden naar sessies navigeren. `VisCoachWelcomeModal.tsx` selecteert en bewaart dagelijkse begroeting lokaal. | Modal opent bij app-start en bij kiezen van VisCoach; acties openen plan, actieve sessies of stekken. | `test-viscoach-greetings.ts`; `test-viscoach-part1.ts` test oudere basiscontext, niet de volledige modalinteractie. | **Aanwezig, gedeeltelijk getest.** Geen browser-/component-E2E-test voor eerste app-start, modalacties of hervatten. |
| Contextuele welkomsttekst en variatie | `src/services/visCoachGreetingService.ts`; selectie gebruikt datum, sessie-uitkomst, dagen sinds laatste sessie en weercontext. `VisCoachWelcomeModal.tsx` gebruikt lokale opslag voor dagkeuze en recente IDs. | Welkomstmodal haalt weer op voor de eerste locatie met geldige coördinaten; begroeting blijft dezelfde lokale kalenderdag staan. | `test-viscoach-greetings.ts`: bibliotheekgrootte 240, weerscategorieën, eerdere vangst/nulvangst, pauze en herhalingsvermijding. | **Aanwezig.** Test bewijst de selectieservice; niet de volledige browseropslag-/weerfoutflow. |
| Visplan met doelsoort, stek, starttijd en optionele eindtijd | `VisCoachView.tsx` → `buildVisCoachPlan()` in `viscoachService.ts` → `getForecast()`, `calculateDayPrognosis()`, temperatuurhistorie en kalibratie. | Doelsoort, stek en starttijd verplicht; eindtijd expliciet optioneel. UI meldt dat zonder eindtijd geen sessieduur wordt verzonnen. | Geen gerichte test aangetroffen die `buildVisCoachPlan()` met weer, tijdzone en invoervarianten integraal doorloopt. `test-viscoach-part1.ts` test Haversine/contexthelpers, niet deze planfunctie. | **Aanwezig, testdekking gedeeltelijk.** GPS-coördinaten en bruikbare weersverwachting zijn harde voorwaarden voor het plan. |
| Plan koppelen aan exact gekozen tijdvenster | `resolveSelectedTimeSlot()` bepaalt het tijdvak uit start/eindtijd. `buildVisCoachPlan()` bewaart `targetWindowStart`, `targetWindowEnd` en `chosenSlot` in de pending snapshot. | Plan toont het gekozen tijdvak apart van het beste tijdvak uit de dagprognose. | Geen directe test voor `resolveSelectedTimeSlot()` of tijdvenstergrenzen aangetroffen. | **Gedeeltelijk / inhoudelijke afwijking.** De coachaanbeveling wordt opgebouwd uit de volledige dagprognose via `buildVisCoachAdviceText(plan.prognosis)`; die tekst gebruikt `prognosis.bestTimeSlot`, niet het gekozen `plan.selectedTimeSlot`. Daardoor kan de tekst een ander tijdvak als beste noemen dan het tijdvak waarvoor de gebruiker het plan heeft aangevraagd. Dit moet later met een gerichte test en expliciete productbeslissing worden opgelost. |
| Vooruit plannen en annuleren | `saveVisCoachPlan()` slaat plan-snapshot en `PlannedFishingSession` op in één IndexedDB-transactie; `cancelVisCoachPlan()` markeert de planning als geannuleerd. | `VisCoachView.tsx` toont actieve plannen en biedt opslaan, starten en annuleren. | In de aangetroffen testsuite geen gerichte lifecycletest voor save → reload → cancel → start van een geplande sessie. | **Aanwezig, onvoldoende direct getest.** De transactie is zichtbaar in code; gebruikersflow is niet end-to-end bewezen. |
| Sessie starten met voorafgaande prognosesnapshot | `SessionModal.tsx` berekent bij live start zo nodig `createLiveSnapshotForSessionStart()`; controleert dat forecasttimestamp vóór werkelijke starttijd ligt. `App.tsx` gebruikt `saveSessionWithPrognosisSnapshot()` om sessie en snapshot atomair te bewaren en maakt daarna het eerste coachadvies. | Zowel VisCoach als de bestaande sessie-interface starten via dezelfde SessionModal. | `test-session-snapshot-commit.ts`; `test-session-coach.ts` test startadvies/feedback en tijdsvolgorde. | **Aanwezig, service-/databasegedrag getest.** Geen volledige UI-test van alle startpaden (direct starten, vanuit plan en vanuit PrognoseView). |
| Actieve sessie automatisch herbeoordelen | `App.tsx` triggert `reassessActiveSessions()` bij app-resume, zichtbaarheid/pageshow, weerupdate, vangst en relevante sessiewijziging/waarneming. `sessionCoachService.ts` gebruikt dezelfde prognose-engine, fingerprint, betekenisvolle factoren en bevestigingslogica. | Actieve sessie toont startadvies, tussentijdse adviezen en knop "Opnieuw beoordelen". | `test-session-coach.ts`; `test-session-coach-integration.ts` test bevestiging over twee afzonderlijke weersupdates, hervatten, geen duplicaten en offline cache. | **Aanwezig, sterke service-integratiedekking.** Geen browser-E2E voor eventlisteners, zichtbaarheid, echte netwerkupdate of meerdere gelijktijdige app-tabs. |
| Alleen praktisch relevante wijzigingen nieuw advies laten opleveren | `prognosisSignature()` vergelijkt advies, tijdvak, zone, windrelatie/-positie, habitat en voorvoer; atomische persistentie controleert duplicaten en baseline opnieuw. | UI toont gewijzigde factoren en aanleiding van ieder advies. | `test-session-coach.ts` en `test-session-coach-integration.ts`. | **Aanwezig en servicegetest.** De hysterese is specifiek voor automatische weersupdates; handmatige heranalyse en expliciete sessiewijzigingen worden direct verwerkt. |
| Gebruikersreactie en uitgevoerde tactiek registreren | `updateCoachAdviceFeedback()` slaat reactie en tactiek met afzonderlijke tijdstippen op; oorspronkelijke adviesinhoud en snapshotreferentie blijven staan. | `SessionsView.tsx`: opgevolgd/aangepast/niet gevolgd en tekstveld voor uitgevoerde tactiek. | `test-session-coach.ts` controleert opslag en behoud van oorspronkelijke adviesinhoud. | **Aanwezig, servicegetest.** Geen UI-E2E voor feedbackknoppen en opslaan van tactiek. |
| Prognose na sessie evalueren | `evaluationEngine.ts`: Brier-score, kalibratiebins en chronologische rolling baseline/BSS; sluit ongeldige, benchmark- en niet-voorafgaande snapshots uit en dedupliceert per sessie/doelsoort. | `StatsView.tsx` toont evaluatie in geavanceerde details; minimaal vijf onafhankelijke sessies vereist voor Brier-weergave. | `test-brier-integration.ts`; aanvullende core-logic- en auditintegriteitstests. | **Aanwezig en servicegetest.** Kleine steekproeven blijven expliciet voorlopig; geen bewijs van praktijknauwkeurigheid zonder voldoende echte, onafhankelijke sessies. |
| Watertemperatuurmodel evalueren | `evaluateWaterTemperaturePerformance()` gebruikt vooraf voorspelde en later handmatig/imported gemeten waarden; MAE, RMSE en bias. Kalibratie via `getWaterTemperatureCalibration()`. | `StatsView.tsx` toont MAE/RMSE/bias en benoemt minimaal acht geldige metingen per stek/seizoen voor kalibratie. | `test-water-thermal-coupling.ts`, `test-water-temperature-learning.ts`, `test-water-temperature-synthetic-validation.ts`, `test-water-history-profile.ts`. | **Aanwezig en servicegetest.** Synthetische tests bewijzen technische werking, geen biologische of praktijknauwkeurigheid. |

### 25.1 Belangrijkste conclusies uit de kernketen

1. De kernketen is niet slechts een verzameling losse services: de App koppelt plan, sessie, snapshot, live herbeoordeling, adviesfeedback en evaluatie daadwerkelijk aan elkaar.
2. De service-/databaselaag heeft gerichte integratietests voor snapshotcommit, coachherbeoordeling, feedback en evaluatiematen.
3. De grootste testlacune in deze keten is de gebruikersinterface: in `package.json` staan geen browser-/component-E2E-scripts of E2E-framework. De huidige testinventaris bestaat uit losse TypeScript-tests. UI-routes en eventlisteners zijn daarom vooral statisch gevolgd, niet automatisch in een browser doorlopen.
4. Er is één concrete inhoudelijke afwijking gevonden: het gekozen tijdvenster van een VisCoach-plan wordt opgeslagen en getoond, maar de gegenereerde aanbeveling verwijst nog naar het beste tijdvak van de gehele dagprognose. Dit is een auditbevinding, geen wijzigingsopdracht; fase 0 blijft read-only.
5. De volledige productbelofte — betere vangsten of aantoonbaar betere tactiek — is niet bewezen door de aanwezigheid van code of groene synthetische tests. Daarvoor zijn voldoende echte, onafhankelijke sessies en chronologische praktijkvalidatie nodig.

### 25.2 Openstaande matrixdelen

Deze eerste matrix dekt alleen de kernketen prognose → VisCoach → sessie → evaluatie. Nog te traceren:
- stekgegevens en lokale geometrie: locatie-editor → habitat-/wind-/positioneringsengines → coachweergave;
- waterthermiek: lokale meting, schatting bij ontbrekende meting, historische waarnemingen en doorwerking in de prognosehorizon;
- persoonlijke leer-/aggregatielaag per stek en doelsoort, inclusief sessie-inspanning, hengeluren, nulvangsten en onbekende gegevens;
- benchmark-/seeddata en alle resterende code-, test-, UI- en documentatieverwijzingen;
- volledige backup-/restoreketen (bevindingen reeds vastgelegd in §24);
- overige eisen uit `VISCOACH_PRODUCT_ROADMAP.md` en `IMPLEMENTATION_PLAN_32_IMPROVEMENTS.md`.

**Fasestatus:** fase 0 blijft in uitvoering. Geen productcode of gebruikersdata gewijzigd. Fase 1 blijft gesloten.


## 26. Traceerbaarheidsmatrix — stekgegevens, geometrie, wind en habitat (16 november 2026)

Read-only controle op `main` commit `c7ad4a60e07170f8e9ee6e9a5591dfdff453906f`.

| Blueprint-eis | Code / UI-keten | Testbewijs | Status en beperking |
|---|---|---|---|
| Lokale stekgegevens beheren | `LocationsView.tsx` → `LocationModal.tsx` → `App.handleSaveLocation()` → IndexedDB `locations`. De editor bevat naam, beschrijving/oeverzijde, watertype, gemiddelde waterdiepte, GPS en vrije notities/bodemverloop. | Geen directe LocationModal-/browserinteractietest aangetroffen. | **Aanwezig, invoer gedeeltelijk.** Watertype kan expliciet Onbekend blijven; diepte is optioneel. |
| GPS-coördinaten van een stek vastleggen | `LocationModal.tsx` ondersteunt handmatige coördinaten en browser-geolocatie. | Geen directe UI-test aangetroffen. | **Gedeeltelijk / risico op foutieve invoer.** Een nieuwe locatie start met vaste standaardcoördinaten `51.9610, 5.2280`; ongeldige/lege waarden vallen bij opslaan terug op `51.961, 5.228`. Als de gebruiker dit niet bewust vervangt, kan een stek met niet-bevestigde Culemborg-coördinaten worden opgeslagen. Dit is strijdig met de eis dat ontbrekende lokale context niet stilzwijgend als bekend wordt behandeld. |
| Oeveroriëntatie vastleggen voor windanalyse | `PrognosisView.tsx` heeft `handleQuickSetWaterFacing()`, schrijft `waterFacingDirection` naar de locatie en herberekent de prognose. `bankWindEngine.ts` gebruikt die richting voor de relatieve wind/oeverhoek. | `test-advanced-prognosis-modules.ts` test acht kompasrichtingen, aanlandige/aflandige/zijwind en ontbrekende oriëntatie. | **Aanwezig, maar verspreid in UI.** Oeveroriëntatie staat niet in het algemene locatieformulier; de gebruiker moet de instelling vanuit Prognose bereiken. |
| Habitat-/structuurgegevens per stek vastleggen | `habitatMovementEngine.ts` leest `waterType`, `waterDepth`, `habitatFeatures` en vrije locatie-notities. De locatie-editor heeft een vrije notitie voor bodemverloop, maar geen gestructureerde invoer voor `habitatFeatures`. | `test-advanced-prognosis-modules.ts` test bekende structuur, ontbrekende diepte/watertype en directe waarnemingen. | **Gedeeltelijk.** De engine kan gestructureerde habitatkenmerken verwerken, maar de standaard locatie-editor biedt geen zichtbare gestructureerde invoer daarvoor. Vrije notities zijn geen gelijkwaardige, gevalideerde velden. |
| Wind-/oeverrelatie analyseren | `calculateDayPrognosis()` integreert `bankWindEngine.ts`; windrichting, snelheid, oeveroriëntatie en thermische context bepalen relatie en oeverbeoordeling. | `test-advanced-prognosis-modules.ts` bevat scenario's voor windrichting, winterkou en ontbrekende oriëntatie. | **Aanwezig en unitgetest.** Het resultaat blijft een zoekhypothese; één GPS-punt beschrijft geen volledige oevervorm of watergrens. |
| Hengelpositie en waarschijnlijke viszone | `rodPositioningEngine.ts` maakt soort-/seizoens-/thermische zoekhypothesen; `habitatMovementEngine.ts` bepaalt primaire en alternatieve zone; beide worden in de dagprognose opgenomen en in `PrognosisView.tsx` weergegeven. | `test-rod-positioning.ts` en `test-advanced-prognosis-modules.ts` testen positionering, seizoenen, stromend/stilstaand water, habitat en directe observaties. | **Aanwezig en uitgebreid scenario-getest.** Dit zijn modelmatige zoekzones, geen vastgestelde vislocaties. |
| Geen schijnnauwkeurige kaart-/bodem-/werprichtingclaims | Habitat-engine meldt ontbrekende sonar/bathymetrie, waterdiepte en lokale kenmerken; wind-/positioneringslogica houdt ontbrekende oeveroriëntatie expliciet onbekend. | `test-advanced-prognosis-modules.ts` test expliciet geen verzonnen diepte-/watertype-/sonaraannames en scenario's bij onbekende oeveroriëntatie. | **Gedeeltelijk aanwezig.** De engines beperken ongefundeerde claims, maar de editor kan door standaard-GPS nog steeds niet-bevestigde locatiecontext vastleggen. |
| Tactische informatie in VisCoach tonen | `buildVisCoachAdviceText()` vertaalt bestaande positionerings-, habitat-, wind- en voeruitvoer naar tekst; `VisCoachView` en actieve sessies tonen advies. | `test-session-coach.ts`, `test-session-coach-integration.ts`; de test voor lichte wind legt bewust vast dat de windsectie ontbreekt. | **Aanwezig, met bekende UX-afwijking.** De windsectie wordt alleen getoond bij `strongWind`; zie audit §7.4. De engine kan meer windcontext hebben dan de coachtekst toont. |

### 26.1 Bevestigde aandachtspunten

1. **Standaard-GPS is niet veilig als standaardwaarde.** Nieuwe stekken krijgen direct coördinaten rond Culemborg, ook wanneer de gebruiker de locatie niet heeft vastgesteld. De fallback bij ongeldige invoer doet hetzelfde. Hierdoor kan weersinformatie voor de verkeerde plaats aan een stek worden gekoppeld. Dit is een concreet datakwaliteitsrisico.
2. **Stekgeometrie is beperkt.** De app bewaart één GPS-punt en een globale kijkrichting; er is geen vastgelegde oeverpolygoon, watergrens, dieptekaart of sonarprofiel. De engines erkennen deze beperking en mogen daarom geen precieze werp-/vispositie claimen.
3. **Habitatinvoer is niet volledig ontsloten.** De engine accepteert `habitatFeatures`, maar de gewone locatie-editor biedt alleen vrije notities en geen gestructureerde habitatselectie. Controleer in een latere productfase of de bestaande vrije notities voldoende zijn of dat een kleine, gevalideerde invoer nodig is.
4. **Oeveroriëntatie is een aparte prognose-instelling.** De gebruiker kan deze instellen vanuit Prognose, maar niet direct in het standaardformulier van de stek. Dit is functioneel aanwezig maar minder vindbaar.
5. De unit-/scenariotests bewijzen de deterministische engine-uitvoer voor ingevoerde context; zij bewijzen niet dat de gebruiker die context correct heeft ingevoerd of dat de voorspelde zone op het echte water klopt.

### 26.2 Vervolg

- Controleer de waterthermiek-/temperatuurketen afzonderlijk, inclusief gemeten versus geschatte temperatuur en hergebruik van de laatst bekende lokale meting.
- Controleer of de locatie-editor de vereiste velden uit de productblauwdruk volledig ondersteunt.
- Houd deze bevindingen read-only tot fase 0 formeel is afgerond en geaccepteerd.

**Fasestatus:** fase 0 blijft in uitvoering; geen applicatiecode of gebruikersdata gewijzigd.


## 27. Traceerbaarheidsmatrix — watertemperatuurmeting en prognosehorizon (16 november 2026)

Read-only controle van de temperatuurketen op `main` commit `5de590a0d61e464f9a6191a94d749fc85306f4c6`.

| Blueprint-eis | Code / UI-keten | Testbewijs | Status en beperking |
|---|---|---|---|
| Actuele lokale meting heeft voorrang | `PrognosisView.tsx` biedt optionele handmatige temperatuurinvoer; `calculateDayPrognosis()` geeft deze door aan `analyzeWaterThermalDevelopment()`. De thermische engine geeft een geldige actuele meting voorrang op historie en schatting. | `test-water-thermal-coupling.ts`, `test-water-history-profile.ts`, `test-water-temperature-synthetic-validation.ts`. | **Aanwezig en getest** voor de actuele prognose-invoer. |
| Zonder lokale meting toch een schatting maken | `waterThermalEngine.ts` kan een weerafgeleide schatting maken bij voldoende voorafgaande weersdekking; bij minimaal 72 uur weerhistorie wordt een weather-only schatting gemaakt. Een historisch profiel uit echte metingen kan de schatting als seizoensreferentie verbeteren. Zonder voldoende data blijft de waarde onbekend. | `test-water-thermal-coupling.ts`, `test-water-history-profile.ts`, `test-water-temperature-synthetic-validation.ts`. | **Aanwezig en synthetisch getest.** Een weather-only puntschatting zonder lokale waterreferentie wordt expliciet als indicatief getoond, zonder numeriek onzekerheidsinterval. |
| Eerdere lokale meting als startpunt voor toekomstige dagen | `waterThermalEngine.ts` zoekt de laatste geldige sessiemeting op dezelfde stek en extrapoleert met de beschikbare uurlijkse weersontwikkeling, mits diepte en weersdekking voldoende zijn. Oudere metingen worden als schattingsanker gebruikt, niet als actuele meting. | `test-water-thermal-coupling.ts` test een meting van de vorige dag, een 48-uurs anker, ontbrekende weerdekking en het verschil tussen vandaag en een toekomstige dag. `test-water-temperature-synthetic-validation.ts` test opwarm- en afkoelscenario's, onzekerheidsmarges en future leakage. | **Aanwezig en getest** op basis van sessiestarttijd als meettijd. Zie de concrete timestamp-afwijking hieronder. |
| Meting vastleggen met meettijdstip, methode, diepte en herkomst | `SessionModal.tsx` heeft velden voor temperatuur, meetdatum/-tijd, methode, meetdiepte en herkomst. `autoSyncSessionOutcomeToSnapshot()` valideert meettijd, bron en methode en bewaart de echte meettijd op de snapshot. | `test-water-temperature-learning.ts` test evaluatie van voorspelde en later gemeten temperatuur en sluit ontbrekende metadata uit. | **Aanwezig voor registratie en snapshotvalidatie.** De timestamp wordt niet consistent gebruikt door alle daaropvolgende thermische leer-/schattingsroutes. |
| Historisch seizoensprofiel opbouwen uit echte metingen | `collectHistoricalWaterTemperatureObservations()` combineert snapshotmetingen en sessiemetingen; `deriveHistoricalWaterTemperatureProfile()` filtert benchmark, toekomst, ongeldige waarden en seizoensafstand. Zelfde stek: minimaal 3 metingen; terugval naar vergelijkbaar watertype binnen 50 km: minimaal 5 metingen van minimaal 2 stekken. | `test-water-history-profile.ts`; synthetische validatie in `test-water-temperature-synthetic-validation.ts`. | **Aanwezig en getest**, maar de combinatie van snapshot- en sessiebron kan dezelfde fysieke meting dubbel tellen wanneer hun tijdstempels verschillen. |
| Temperatuurmodel evalueren en voorzichtig kalibreren | `evaluationEngine.ts` koppelt voorspelde temperatuur aan latere meting met bekende meetmetadata; MAE, RMSE en bias. Lokale seizoenskalibratie pas na minimaal 8 geldige paren. | `test-water-temperature-learning.ts`; `StatsView.tsx` toont metrics in geavanceerde statistieken. | **Aanwezig en getest.** Dit valideert temperatuurfout, niet automatisch de biologische vangstprognose. |

### 27.1 Bevestigde timestamp-inconsistentie

De UI registreert expliciet `waterTemperatureMeasuredAt` en vermeldt dat het meettijdstip niet meer van de sessiestart wordt afgeleid. De verdere thermische keten gebruikt echter niet overal dat veld:

1. `collectHistoricalWaterTemperatureObservations()` voegt een sessiemeting toe met `timestamp: session.startTime`, ook wanneer `session.waterTemperatureMeasuredAt` aanwezig is.
2. `analyzeWaterThermalDevelopment()` bouwt de meetankers uit `historicalSessions` eveneens met `new Date(session.startTime)`.
3. `reassessActiveSessions()` geeft `session.waterTemperature` door als `userMeasuredWaterTemp`. De thermische engine kent die invoer de referentietijd `currentDateRef` (het moment van herbeoordeling) toe en controleert hier niet `waterTemperatureMeasuredAt`.

Daarom kunnen twee concrete afwijkingen ontstaan:
- Een meting die tijdens de sessie later is verricht, wordt als meetanker op de sessiestart gedateerd. De geschatte ouderdom en de weersontwikkeling sinds de meting zijn dan onjuist.
- Bij een actieve sessie kan dezelfde oude meting bij iedere herbeoordeling opnieuw als actuele meting worden aangeboden, omdat de herbeoordelingsdatum als meettijd wordt gebruikt.

Daarnaast bewaart `autoSyncSessionOutcomeToSnapshot()` de meting met de juiste `waterTemperatureMeasuredAt` op de gekoppelde snapshot. Omdat de collectie-helper ook de sessiemeting op `session.startTime` toevoegt, kan dezelfde fysieke meting tweemaal in het historische profiel terechtkomen als beide tijdstempels verschillen.

**Conclusie: defect/consistentieprobleem bevestigd door statische code-trace.** De bestaande tests dekken de veroudering van een meting op basis van `session.startTime`, maar niet het verschil tussen sessiestart en expliciet meettijdstip, noch het opnieuw actueel maken van een oude meting bij live herbeoordeling. Er is nog geen runtime-regressietest die dit scenario bewijst; de codepaden zijn direct zichtbaar en voldoende om de testlacune en het risico vast te leggen.

### 27.2 Vereiste regressiedekking voor een latere uitvoeringsfase

- Sessie start om 18:00, watertemperatuur gemeten om 20:00: het meetanker moet 20:00 gebruiken.
- Actieve sessie wordt om 22:00 opnieuw beoordeeld: de meting van 20:00 mag niet als nieuwe meting van 22:00 worden gelabeld.
- Dezelfde meting bestaat zowel op sessie als snapshot: historisch profiel telt deze één keer, op de echte meettijd.
- Meting na het prognosetijdstip of na de sessie-eindtijd blijft uitgesloten.
- Zonder expliciet meettijdstip/methode/herkomst wordt de waarde niet als gevalideerde lokale meting behandeld.

**Fasestatus:** fase 0 blijft read-only en in uitvoering. Er is geen applicatiecode of gebruikersdata gewijzigd.


## 28. Traceerbaarheidsmatrix — persoonlijk leren, sessie-inspanning en tactiek (16 november 2026)

Read-only controle van de huidige implementatie op `main` commit `46c90e06309f80c69f48bb6872ad75f28df92f2d`.

| Blueprint-eis | Code / UI-keten | Testbewijs | Status en beperking |
|---|---|---|---|
| Persoonlijke vangstervaring per stek en doelsoort | `prognosisEngine.ts`: `getComparableSessions()` filtert op doelsoort en optioneel exact `locationId`; alleen voltooide vangst-/bevestigde nulvangstsessies tellen mee. Vangstrecords moeten de doelsoort bevestigen. | `test-core-logic.ts` bevat scenario's voor soort-/stekselectie, onbekende uitkomsten, benchmarkuitsluiting en bevestigde nulvangsten. | **Aanwezig, gedeeltelijk geïntegreerd.** Dit is een beperkte sessie-aggregatie in de prognose-engine, geen afzonderlijke centrale stekleerlaag. |
| Persoonlijke vangstkans corrigeren voor werkelijke sessieduur | `getSessionDurationHours()` gebruikt geregistreerde duur of geldige start/eindtijd; Poisson-rate = bekende doelvangsten / totale geldige sessieduur, met bevestigde nulvangsten in de blootstellingsnoemer. De geplande duur bepaalt vervolgens de kans op minimaal één vangst. | `test-core-logic.ts` test duur/exposure en nulvangsten; `test-session-coach.ts` en andere prognosetests gebruiken dezelfde engine. | **Aanwezig en getest.** Alleen sessieduur wordt gebruikt; werkelijke hengeluren worden niet in de vangst-rate verwerkt. |
| Persoonlijke invloed van techniek, aas en tactiek op vangstprognose | `calculateDayPrognosis()` accepteert context voor techniek en voorvoer; de persoonlijke `comparableSessions`-selectie filtert echter alleen op soort en stek. Er wordt geen vergelijkbare sessieset op `technique`, `baitAndFeed`, hengelpositie of aasaanbieding gebruikt voor de Poisson-rate. | Geen test aangetroffen die techniek-/aasgescheiden vangstprognoses vergelijkt. | **Ontbreekt in de persoonlijke vangst-rate.** De engine gebruikt sessieduur en doelsoort/locatie, maar de productbelofte van methode-/tactiekgespecificeerd persoonlijk leren is hiermee nog niet gerealiseerd. |
| Persoonlijk leerresultaat voor aas-/werprichting | `rodPositioningEngine.ts` analyseert op dezelfde stek en doelsoort de geregistreerde `baitDirection`; vereist minimaal 11 voltooide sessies en 6 richtingsregistraties. | `test-rod-positioning.ts` test onder de drempel, onvoldoende richtingregistraties en een voldoende groot profiel. | **Aanwezig, smal en voorzichtig.** Het is een kwalitatieve richtingnuance, geen centrale tactiek-/methodevergelijking. |
| Sessiedetails per hengel vastleggen | `SessionModal.tsx` laat optioneel hengelpositie, techniek, aas/presentatie, actieve intervallen en gebeurtenissen per hengel vastleggen; App bewaart de records in `sessionRods`. | `test-session-rods.ts` test opslagstructuur-/inspanninghelperregels en overlap/ontbrekende intervallen. | **Aanwezig als registratie.** De sessie blijft terecht de primaire observatie-eenheid; details per hengel worden niet automatisch als onafhankelijke sessies behandeld. |
| Werkelijke hengeluren berekenen en gebruiken | `sessionEffortEngine.ts` biedt `calculateSessionRodEffort()` en `closeOpenRodIntervals()`. `SessionsView.tsx` importeert `calculateSessionRodEffort`, maar de naam komt in het bestand alleen in de import voor; er is geen aanroep. `prognosisEngine.ts` en `statsEngine.ts` gebruiken de helper niet. | `test-session-rods.ts` test de helper geïsoleerd, inclusief overlap en ontbrekende intervallen. | **Helper aanwezig, productintegratie ontbreekt.** De test bewijst de helper, niet dat hengeluren in sessieoverzicht, statistieken of persoonlijke prognoses terechtkomen. |
| Groepssessies onderscheiden van hengels en deelnemers | Types bevatten `participantCount`, `rodCount` en per-hengelrecords. | `test-session-rods.ts` test de scheiding tussen deelnemers, totaal aantal hengels en één primaire sessie. | **Registratie aanwezig; leer-/statistiekintegratie beperkt.** Prognose-rate gebruikt sessieduur, niet deelnemers- of hengeluren. |
| Statistieken respecteren onbekende vangstaantallen | `statsEngine.ts` telt `count || 1` in totale, soort-, locatie- en tijdvakstatistieken. Dat behandelt een onbekend aantal (bijvoorbeeld `legacyImportQuality.countKnown === false`) als één vis. `SessionsView.tsx` gebruikt wel `getKnownCatchCount()` en telt een onbekend aantal als nul bekende vissen. | Geen directe testaanroep van `calculateStats()` aangetroffen in de beschikbare tests; `test-core-logic.ts` importeert de functie, maar voert geen `calculateStats()`-aanroep uit. | **Bevestigd consistentieprobleem en testgat.** Het statistiekdashboard kan onbekende aantallen als echte vissen tellen, terwijl het sessieoverzicht die aantallen als onbekend behandelt. |
| Centrale leerlaag per stek × doelsoort | Service-inventaris bevat losse modules voor prognose, positionering, habitat, thermiek, evaluatie, voorvoer en sessie-inspanning. Er is geen `spotLearningEngine.ts` of vergelijkbare centrale aggregatieservice aangetroffen. | Geen centrale profiel-/aggregatietests aangetroffen. | **Niet aangetoond / waarschijnlijk ontbrekend.** De bestaande deelmodellen moeten eerst in kaart worden gebracht; pas daarna kan worden besloten of een centrale laag echt nodig is. |

### 28.1 Belangrijkste conclusies

1. De app leert al op beperkte wijze van echte sessies: de Poisson-vangst-rate gebruikt doelsoort, stek, bekende vangsten, bevestigde nulvangsten en werkelijke sessieduur.
2. De persoonlijke vangstkans is nog niet uitgesplitst naar techniek, aas/voer, hengelpositie of feitelijke hengelinzet. Dat betekent dat een sessie met method feeder en een statische boiliepresentatie in dezelfde soort-/stekbasis kunnen vallen.
3. De richtingmodule is het enige expliciet aangetroffen persoonlijke tactiekprofiel met een hoge datadrempel. Het is bewust een lichte nuance, geen robuust causaal leermodel.
4. Per-hengeldata worden opgeslagen en de helper voor hengeluren is getest, maar de helper is niet aangesloten op de productweergave of de prognose-/statistiekaggregatie. De huidige vangst-rate is per sessie-uur, niet per actieve hengeluur.
5. Het statistiekdashboard heeft een concreet telrisico: `count || 1` behandelt onbekende aantallen als één. Dit wijkt af van de kwaliteitsbewuste weergave in `SessionsView.tsx`.
6. De roadmap-kandidaat `spotLearningEngine.ts` is nog niet aangetroffen. De audit kan daarom niet bevestigen dat er al één reproduceerbaar profiel bestaat waarin thermiek, habitat, tactiek, vangstdata en onzekerheid per stek × doelsoort samenkomen.

### 28.2 Vereiste vervolgstappen na fase-0-acceptatie

- Regressietests voor `calculateStats()` bij onbekende soort/aantallen, onbekende sessieduur, andere soorten en bevestigde nulvangst.
- Beslissen welke inspanningseenheid voor welke maatstaf geldt: sessie-uren voor visserinspanning, hengeluren voor hengelinzet. Niet ongemerkt door elkaar gebruiken.
- Vaststellen welke minimumaantallen nodig zijn voordat techniek-/aas-/richtingsegmenten een persoonlijke nuance mogen geven; kleine steekproeven moeten terugvallen op de bredere stek-/soortbasis.
- Pas na die inventarisatie bepalen of een centrale `spotLearningEngine` ontbreekt en welke bestaande services daarin moeten worden samengebracht.
- Geen causaliteitsclaim afleiden uit een hogere vangstfrequentie bij een tactiek; sessieomstandigheden en selectie-effecten moeten zichtbaar blijven.

**Fasestatus:** fase 0 blijft read-only en in uitvoering; geen applicatiecode of gebruikersdata gewijzigd.


## 29. Traceerbaarheidsmatrix — biologische prognosefactoren en scorebijdrage (16 november 2026)

Read-only controle van de biologische activiteitsscore, thermische schatting, habitat-/bewegingsanalyse en tests op de actuele `main`-baseline `9bec9071c33851847030bf593d34e8e2c482d3ca`. De fase-2-blauwdruk in `VISLOGBOEK_VERBETERPLAN.md` vraagt om een soortspecifieke beoordeling van biologische, meteorologische, hydrologische, seizoensgebonden en lokale factoren. Zij noemt nog geen volledig vastgelegde, afzonderlijke canonieke lijst met alle factoren; onderstaande inventaris combineert daarom de expliciete blauwdrukeisen met de factoren die de bestaande profielen en engines daadwerkelijk modelleren.

### 29.1 Factorenmatrix

| Factor / invoer | Huidige codeketen | Werkelijke rol in de biologische activiteitsscore | Status en beperking |
|---|---|---|---|
| Watertemperatuur (gemeten of geschat) | `waterThermalEngine.ts` → `calculateThermalEfficiency()` in `fishProfiles.ts` → `prognosisEngine.ts` | **Directe numerieke bijdrage.** Soortspecifieke thermische efficiëntie wordt via `1 + 9 × efficiency^0.85` omgerekend naar een relatieve index van 1–10. | **Actief in score.** De score is uitsluitend hierop gebaseerd. Profielparameters zijn modelinstellingen; hun biologische/empirische validatie is niet aangetoond. |
| Historische watertrend en thermische traagheid | `waterThermalEngine.ts`, `waterTemperatureHistory.ts` | Geen afzonderlijke bonus. Beïnvloedt de geschatte watertemperatuur die vervolgens de thermische score voedt. | **Indirect actief via temperatuur.** Meetankers/timestamp-inconsistentie staat in §27. |
| Luchttemperatuur en voorafgaande weersontwikkeling | `waterThermalEngine.ts` | Geen directe scoreterm; draagt bij aan de modelschatting van watertemperatuur. | **Indirect actief via temperatuur.** De schatting blijft afhankelijk van weerdekking en onzekerheid. |
| Zonnestraling, bewolking en thermische opwarming | `weatherService.ts` → `waterThermalEngine.ts` | Zonnestraling/bewolking kan de thermische schatting beïnvloeden; bewolking heeft daarnaast een aparte contextregel zonder scorebijdrage. | **Indirect via temperatuur / anders context.** Geen apart gevalideerd licht-effect op activiteit. |
| Windmenging | `waterThermalEngine.ts` | Kan thermische ontwikkeling/menging beïnvloeden en daarmee indirect de geschatte watertemperatuur; geen eigen activiteitsscoreterm. | **Indirect via temperatuur.** Geen afzonderlijke biologische windbonus. |
| Waterdiepte | `waterThermalEngine.ts`, `habitatMovementEngine.ts`, `bankWindEngine.ts` | Onderdeel van thermische traagheid/schattingscontext en habitat-/zonebeschrijving; geen rechtstreekse scoreterm. | **Indirect thermisch en actief in habitatcontext.** Een geregistreerde gemiddelde diepte is geen bodemprofiel. |
| Luchtdruk en druktrend | `findPressureTrend()` en `prognosisEngine.ts` | Score is expliciet 0; impact blijft neutraal. Ook de habitatmodule presenteert de trend als context. | **Alleen context.** Profielvelden `pressureSensitivity` en `optimalPressureRange` veranderen de score niet. |
| Windsnelheid en windrichting | `prognosisEngine.ts`, `bankWindEngine.ts`, `habitatMovementEngine.ts`, `rodPositioningEngine.ts` | Score is expliciet 0. Wind wordt geduid voor oppervlaktecontext, oeverrelatie, lokale verplaatsing en positionering. | **Alleen context voor totale activiteit; actief in oever-/habitat-/positioneringsadvies.** Voorkeurswindrichtingen en disruptiedrempels zijn voorlopig. |
| Seizoen | `getSeason()`, `fishProfiles.ts`, `habitatMovementEngine.ts` | Seizoenfactor heeft score 0. `seasonalWeights` in soortprofielen worden niet in de activiteitsscore toegepast. Seizoen wordt wel gebruikt in habitatduiding. | **Alleen context/habitat.** Seizoensprioren zijn voorlopige metadata, geen actieve scoregewichten. |
| Tijdstip, dagdeel en schemering | `preferredSlots` en `crepuscularBonus` in `fishProfiles.ts`; `prognosisEngine.ts` | Score is expliciet 0; voorkeur wordt als voorlopige notitie getoond. | **Alleen context.** Geen gevalideerde numerieke dagdeel-/schemerbonus. |
| Bewolking en neerslag | `prognosisEngine.ts`, `habitatMovementEngine.ts` | Score is expliciet 0; profielvoorkeuren worden beschrijvend vermeld. | **Alleen context.** Geen soort- en watertypegevalideerde bonus/malus. |
| Watertype, habitatkenmerken, oeveroriëntatie en locatiecontext | `habitatMovementEngine.ts`, `bankWindEngine.ts`, `rodPositioningEngine.ts` | Geen bijdrage aan de totale biologische activiteitsscore. Ze beïnvloeden zones, lokale beweging, oeverwind en tactische positionering. | **Actief in habitat-/bewegings-/tactisch model.** Gestructureerde habitatinvoer en geometrie blijven beperkt; zie §26. |
| Directe waarnemingen: springen/rollen, aasbellen, aanbeten | `analyzeHabitatMovement()` | Geen numerieke activiteitsscorebijdrage. Waarnemingen kunnen de primaire habitatzone direct bepalen of beïnvloeden. | **Actief als lokale observatie/habitatbewijs.** Geen formele weging in de totale activiteitsscore. |
| Persoonlijke sessies, vangsten en nulvangsten | `getSimilarSessions()` en Poisson-rate in `prognosisEngine.ts` | Niet opgenomen in de biologische activiteitsscore. Worden gebruikt voor een afzonderlijke persoonlijke vangstkans binnen de opgegeven sessieduur. | **Afzonderlijke vangstkans.** Niet verwarren met biologische activiteit; segmentatie naar techniek/aas ontbreekt volgens §28. |
| Voorvoer, aas en techniek | `prebaitEngine.ts` en coach-/sessiecontext | Geen bijdrage aan de biologische activiteitsscore. Voorvoerplan en tactiek worden afzonderlijk berekend/geadviseerd. | **Tactische advieslaag.** Geen empirisch aangetoonde invloed op de biologische index. |

### 29.2 Wat de score exact doet

Per tijdvak wordt de geldige gemeten watertemperatuur gebruikt als die beschikbaar is; anders de beschikbare thermische schatting. `calculateThermalEfficiency(effectiveTemp, profile)` levert de soortspecifieke thermische efficiëntie. De engine berekent vervolgens:

`activityScore = round(clamp(1 + 9 × thermalEfficiency^0.85, 1, 10), 1)`

Alle overige factorobjecten — luchtdruk, wind, seizoen, tijdstip/licht, bewolking en neerslag — hebben `score: 0` en `impact: neutraal`. Wanneer geen bruikbare watertemperatuur beschikbaar is, wordt intern een placeholder gebruikt om de berekening technisch te kunnen uitvoeren, maar `activityScoreAvailable` is `false` en de conclusie meldt dat de index niet betrouwbaar te bepalen is. De placeholder mag dus niet als echte prognose worden geïnterpreteerd.

### 29.3 Hydrologische en biologische dekking: wat nog niet aantoonbaar gemodelleerd wordt

De huidige engines bevatten geen expliciete, gestructureerde invoer-/responsketen voor onder meer:
- opgeloste zuurstof (DO) of zuurstofverzadiging;
- waterhelderheid/troebelheid als meetwaarde;
- stroomsnelheid, actuele stromingsrichting of debiet (watertype kan wel rivier/kanaal onderscheiden);
- waterstand en verandering van waterstand;
- prooidichtheid/natuurlijk voedselaanbod als actuele meet- of waarnemingsreeks;
- levensstadium, paaifase of voortplantingsstatus van de doelvis;
- een gestructureerd bodem-/diepteprofiel of lokale temperatuur op meerdere dieptes.

Een deel van de lokale structuur kan via vrije notities of habitatlabels worden beschreven, en de habitatmodule noemt ontbrekende gegevens expliciet. Dat is niet gelijk aan een gestructureerd meetmodel of een kwantitatieve biologische respons. Deze punten zijn **niet aangetoond als actieve factoren**; de audit doet geen uitspraak dat elk ervan noodzakelijk een numerieke scorefactor moet worden.

### 29.4 Testdekking en bewijsgrenzen

| Controle | Aangetroffen testdekking | Conclusie |
|---|---|---|
| Thermische schatting en ontwikkeling | `test-thermal-and-prognosis.ts`, `test-water-thermal-coupling.ts`, `test-water-history-profile.ts`, `test-water-temperature-synthetic-validation.ts` | Thermische keten en synthetische scenario's zijn getest; dit bewijst niet dat de biologische activiteitscurve voor echte vissen empirisch juist is. |
| Soort-/temperatuurprofielen | Profiel- en prognosetests bestaan; thermische efficiëntie wordt gebruikt door de score. | Geen aangetroffen onafhankelijke praktijkvalidatie van alle soortspecifieke optimale temperaturen, toleranties en curvebreedtes. |
| Wind/oever/habitat | `test-advanced-prognosis-modules.ts`, `test-rod-positioning.ts` | Scenario's voor de aparte oever-/habitat-/positioneringsmodules; geen bewijs dat wind de totale activiteitsscore correct zou moeten wijzigen. |
| Factoren zonder scorebijdrage | Bestaande tests controleren onder meer dat de index binnen bereik blijft en dat contextmodules functioneren. | Geen aangetroffen systematische invariantietests die per factor aantonen dat variatie in druk, wind, seizoen, dagdeel, bewolking en neerslag de thermische index niet verandert. |
| Interacties en tijdsvertraging | Thermische tests bevatten weersverloopscenario's; habitat bevat enkele gecombineerde contextregels. | Geen volledige testmatrix voor soort × seizoen × levensstadium × watertype × factorinteractie of vertraging. |
| Biologische uitkomstvalidatie | Geen bewijs van voldoende onafhankelijke, chronologische praktijksessies voor de activiteitsscore zelf. | Synthetische tests zijn geen praktijkvalidatie; de huidige score kan nog niet als gekalibreerde vangst- of voedingskans worden gepresenteerd. |

### 29.5 Auditconclusie

1. **De huidige engine is geen multi-factor biologische activiteitsscore.** Het is een soortspecifieke thermische index met daarnaast afzonderlijke persoonlijke vangstkans-, habitat-, oeverwind-, positionerings- en voorvoeranalyses.
2. De huidige scheiding is op zichzelf verstandig: wind kan de locatie van vis beïnvloeden zonder de totale activiteit te verhogen; druk, licht en neerslag krijgen geen arbitraire bonus.
3. De belangrijkste aantoonbare lacune ten opzichte van fase 2 is niet simpelweg “meer factoren optellen”, maar het ontbreken van een complete, expliciet geprioriteerde factorinventaris met per factor biologische hypothese, soort/levensstadium, tijdschaal, databron, onzekerheid, interactie en rol.
4. Er zijn profielvelden en wetenschappelijke referenties aanwezig, maar de referenties onderbouwen niet automatisch de exacte numerieke modelparameters. De bestaande tests toetsen vooral softwaregedrag en synthetische scenario's, niet de biologische juistheid van de score.
5. Een echte uitbreiding is dus **waarschijnlijk nodig om fase 2 volledig te halen**, maar het is nog niet verantwoord om nu te bepalen welke extra factoren numeriek moeten meetellen of welke gewichten zij krijgen. Eerst moeten de ontbrekende factoren, beschikbare databronnen en valideerbaarheid per soort worden vastgesteld. Sommige factoren kunnen terecht context- of habitatfactor blijven.

### 29.6 Vervolg na afronding van de read-only audit

- Maak een canonieke factorcatalogus uit de oorspronkelijke product-/biologische bronnen en koppel elke factor aan soort, levensstadium, watertype, tijdschaal, databron, meetstatus, hypothese, richting, interacties en onzekerheid.
- Classificeer per factor expliciet: score, thermische schatting, habitat/beweging, tactiek, context, niet beschikbaar of bewust uitgesloten.
- Voeg eerst tests toe die de huidige scheiding bewijzen: wijzig één contextfactor terwijl temperatuur gelijk blijft en controleer dat de biologische index gelijk blijft; test daarnaast thermische respons per soort.
- Beoordeel voor elke kandidaatfactor of betrouwbare invoer in de offline-first app beschikbaar en praktisch registreerbaar is.
- Pas daarna een modelontwerp, parameters en chronologische backtest vaststellen. Geen scoregewichten of productcode wijzigen in fase 0.

**Fasestatus:** fase 0 blijft read-only en in uitvoering. Geen applicatiecode, gebruikersdata of prognose-uitvoer gewijzigd.

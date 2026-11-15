# Fase 0 — uitgebreide optimalisatie-audit

**Status:** in uitvoering — read-only  
**Peildatum:** 15 november 2026  
**Geaudite branch:** `main`  
**App-codebaseline bij start audit:** `4831fd6d7a200467c29773c574be7090674eca29`  
**Documentatie:** latere commits op `main` wijzigen uitsluitend audit-/projectdocumentatie; er zijn geen app-codebestanden gewijzigd.  
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

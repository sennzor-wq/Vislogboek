# Fase 2 — uitvoeringsresultaten

**Doel van dit bestand:** afzonderlijk, controleerbaar uitvoeringsverslag naast de roadmap, architectuur en inhoudelijke audit. De roadmap bepaalt de volgorde; dit bestand registreert wat daadwerkelijk is gecontroleerd, uitgevoerd, getest en nog openstaat.

**Repository:** `sennzor-wq/Vislogboek`  
**Leidende branch:** `main`  
**Startbasis van dit verslag:** `a28a4a2e99e7995aba6430e8602c0448ea058fe9`  
**Laatste bijgewerkte onderdeel:** runtime-mapping historische sessievelden — eerste technische mapping  
**Status Fase 2:** open; Fase 3 blijft geblokkeerd tot formele acceptatie.

## Werkwijze en bewijsregels

Per werkonderdeel registreren we:
1. Roadmap-/auditverwijzing en doel.
2. Gecontroleerde codepaden en concrete bevindingen.
3. Eventuele implementatie en gewijzigde bestanden.
4. Uitgevoerde tests/builds met exacte uitkomst.
5. Resterende punten, afhankelijkheden en hervattingspunt.

Een code-inspectie wordt niet als test gerapporteerd. Een geslaagde test wordt niet als biologische/praktijkvalidatie gepresenteerd. Persoonlijke IndexedDB-data zijn niet via de repository beschikbaar; er worden dus geen actuele aantallen sessies of vangsten verondersteld.

## Werkonderdeel 1 — runtime-mapping historische sessievelden

**Roadmapbasis:** `FASE2_PROGNOSE_AUDIT.md` §179; `MODELARCHITECTUUR_FASE2.md` §148; `PROJECT_ZELFLERENDE_PROGNOSE.md` fasen A–B.  
**Type werk:** read-only codecontrole.  
**Gecontroleerde basis:** `main` op `a28a4a2e99e7995aba6430e8602c0448ea058fe9`.  
**Status:** eerste technische mapping uitgevoerd; aanvullende datakwaliteits- en UI-trace volgt.

### 1.1 Feitelijke gegevensstroom

- `createLiveSnapshotForSessionStart` haalt de sessies, vangsten, prognosesnapshots en stekken rechtstreeks uit de lokale Dexie-tabellen.
- De actuele berekening krijgt de historische `FishingSession[]` en `CatchItem[]` rechtstreeks mee in `calculateDayPrognosis`.
- `createPrognosisHistoryFeatureSnapshot` kopieert een beperkte, expliciete selectie historische sessie-, vangst- en observatievelden naar `PrognosisInputContext`. Deze kopie wordt met de snapshot bewaard voor herleidbaarheid/fingerprinting; de berekening leest deze kopie niet terug als vervanging voor de live records.
- Historische watertemperatuur heeft een aparte gegevensroute via `collectHistoricalWaterTemperatureObservations` en de thermische engine.
- De bestaande engines gebruiken dus al een deel van de historische informatie. Dat betekent niet dat ieder opgeslagen veld al een voorspellende correctie krijgt.

### 1.2 Velden die aantoonbaar in huidige runtimeberekeningen worden gebruikt

| Historisch gegeven | Huidig gebruik | Reikwijdte en begrenzing |
|---|---|---|
| Sessie-uitkomst | Persoonlijke vangsthistorie en vergelijkbare sessies per tijdvak | Alleen voltooide `catch`/`skunk_confirmed`-sessies; benchmarks uitgesloten. Een `catch` telt alleen als doelsoortsucces wanneer een passende vangstregistratie bestaat. |
| Doelsoort | Selectie van vergelijkbare sessies, vangsten, voorvoerhistorie en positioneringshistorie | Soort moet overeenkomen met de gekozen prognosedoelsoort. |
| Stek-ID | Persoonlijke vangstkans, voorvoerhistorie, thermische meetprofielen en positioneringshistorie | De persoonlijke vangstkans kan op de gekozen stek worden begrensd; de tijdvakvergelijking in `getSimilarSessions` filtert niet op stek. |
| Werkelijke sessieduur | Poisson-vangsttempo en kans voor de gevraagde sessieduur | Alleen bekende, positieve werkelijke duur; geplande duur is geen gerealiseerde blootstelling. |
| Vangstsoort en aantal | Bevestigen doelsoortsucces en berekenen doelvis-aantallen per geregistreerd uur | Onbekende soort-/aantalkwaliteit wordt uitgesloten; bevestigde nulvangsten tellen mee in de blootstellingsnoemer. |
| Sessie-starttijd | Persoonlijke ervaring per tijdvak | Sessies worden ingedeeld op starttijd, niet op het daadwerkelijke vangsttijdstip. |
| Fysieke watertemperatuurmeetevents | Historisch thermisch profiel voor toekomstige schattingen | Geldige events uit `waterTemperatureMeasurements[]` worden gebruikt; benchmark, ongeldige waarden/tijden en onbekende bron/methode worden uitgesloten. |
| Scalaire fysieke watertemperatuur | Laatst bekende meetanker in de thermische engine en legacy-terugval | De sessiemodal spiegelt de meest recente bruikbare eventmeting naar de scalaire compatibiliteitsvelden. De eventhistorie en het actuele meetanker zijn verschillende rollen. |
| Stekdiepte en watertype | Thermische traagheid en selectie van vergelijkbare historische temperatuurprofielen | Dit zijn stekkenmerken; sessiediepte kan bij meetevents als metadata-terugval worden gebruikt. |
| Voorvoeren (`prebaited`) en `baitAndFeed` | Beschrijvende persoonlijke vergelijking in het voorvoeradvies | Zelfde stek en doelsoort; minimaal vijf geclassificeerde sessies, waarvan minimaal twee met en twee zonder voorvoeren. De uitkomst is correlatief, geen causaal bewijs. |
| Aasaanbiedingsrichting (`baitDirection`) | Persoonlijke positioneringshistorie | Zelfde stek; minimaal elf voltooide sessies en minimaal zes met bruikbare richting. Dit is tactische context, geen vangstkanscorrectie. |

**Belangrijke drempels in de huidige code:**
- Persoonlijke vangsthistorie: minimaal vijf vergelijkbare sessies voordat een vangstkans wordt getoond.
- Poisson-blootstellingsmodel: minimaal vijf sessies met bekende werkelijke duur en bruikbare vangstaantallen.
- Historisch temperatuurprofiel: minimaal drie metingen op dezelfde stek; terugval naar vergelijkbaar watertype binnen 50 km vraagt minimaal vijf metingen uit ten minste twee stekken.
- Persoonlijke voorvoer- en positioneringsvergelijkingen hanteren de hierboven genoemde eigen minimumaantallen.

Dit zijn bestaande softwarefilters, geen bewijs dat de uitkomsten biologisch gevalideerd zijn.

### 1.3 Context die wel wordt gebruikt of getoond, maar geen gevalideerde biologische scorecorrectie vormt

- Luchtdruk en druktrend worden als weerscontext getoond; er wordt geen automatische biologische bonus of aftrek toegepast.
- Wind, bewolking, neerslag en seizoen blijven context in de thermische activiteitsscore. Praktische wind-/oeverinformatie kan wel door de afzonderlijke tactische modules worden gebruikt.
- Tijdstip/licht wordt beschrijvend gekoppeld aan de beschikbare evidence en zonnecontext; er is geen numerieke tijdvakbonus.
- De bestaande thermische soortrespons blijft de voorlopige numerieke basis voor thermische activiteitspotentie. Zij wordt niet gelijkgesteld aan voedingsintensiteit, aanwezigheid of persoonlijke vangstkans.

### 1.4 Opgeslagen velden die in deze gecontroleerde prognoseketen niet als historische voorspellende correctie worden toegepast

| Veld / gegevensgroep | Huidige bevinding |
|---|---|
| Historische `technique` | Wordt in de history feature snapshot bewaard, maar de persoonlijke vangstberekening corrigeert niet op basis van historische techniek. De actuele techniek kan wel aan het huidige voorvoerplan worden doorgegeven. |
| Historische aas-/voerbeschrijving op sessie- of vangstniveau | Wordt deels als historie bewaard en `baitAndFeed` wordt gebruikt om voorvoeren te classificeren wanneer `prebaited` ontbreekt; er is geen gevalideerde aas-/voercorrectie op de algemene vangstkans. |
| `bitesCount` en `missedCount` | Opgeslagen sessie-uitkomsten; in de hier getraceerde prognoseberekening geen zelfstandige historische correctie. |
| `rodCount`, `participantCount`, `rodTypes` | Worden niet als correctie in de algemene prognose of Poisson-vangstkans gebruikt. |
| Hengelrecords, `SessionRodEvent[]` en `RodActiveInterval[]` | De actieve intervallen kunnen in een afzonderlijke beschrijvende tijdvak-/blootstellingsaudit worden gebruikt. Deze audit is geen actieve voorspellende correctie in de algemene prognose. |
| Vangstgewicht en -lengte | Worden bewaard, maar zijn geen input voor de huidige vangstkans- of thermische activiteitsscore. |
| Historische vangsttijdstippen | Automatisch voorgestelde tijden worden voor de beschrijvende tijdvak-audit uitgesloten; alleen door de gebruiker aangepaste tijdstippen binnen de sessie tellen daar als tijdvakvangst. De algemene persoonlijke tijdvakervaring gebruikt de sessiestarttijd. |
| Historische `presenceObservations` op sessierecord | Worden niet automatisch als historische tijdreeks in de sessiestartprognose geladen. De sessiestartcontext zet `presenceObservation` op `onbekend` en `observationIds` op een lege lijst. Een expliciet actuele observatie kan wel als kwalitatieve context aan de engine worden doorgegeven. |
| Vrije notities en foto's | Worden bewust niet in de whitelisted prognosehistorie gekopieerd en zijn geen numerieke modelinput. |
| Historische `weatherSnapshot` van een sessie | Wordt in de hier gecontroleerde persoonlijke leerberekeningen niet als historische weerscorrectie gebruikt; de nieuwe prognose gebruikt de actuele forecast. |

### 1.5 Kandidaten voor later onderzoek — nog niet activeren

1. Techniekgebonden vangstresultaten, mits sessies voldoende vergelijkbaar zijn en techniekregistratie betrouwbaar is.
2. Aas-/voercombinaties en presentatie, met expliciete scheiding tussen beschrijvende associatie en causaal effect.
3. Aanbeten en missers, pas na heldere definities en vergelijkbare inspanning; deze zijn geen directe meting van voedselopname.
4. Hengeluren en tijdvakvangsten als vangbaarheid per geregistreerde inspanning, met behoud van onbekende blootstelling als onbekend.
5. Tijdstempels van vangsten alleen waar provenance betrouwbaar is; automatische formulier-open-tijden blijven uitgesloten.
6. Waarnemingen van springen/rollen en aasbellen als kwalitatieve context, niet als gemeten voedingsintensiteit of bewijs van afwezigheid.

Geen van deze kandidaten krijgt in dit werkonderdeel een nieuw gewicht, score, verplichte invoer of automatische correctie.

### 1.6 Eerste conclusie

De prognose gebruikt al historische sessies, vangstuitkomsten, duur, doelsoort, tijdvakervaring, fysieke temperatuurhistorie en specifieke persoonlijke voorvoer-/positioneringsvergelijkingen. Niet alle sessievelden zijn echter actieve voorspellers. Vooral techniek, aasdetails, aanbeten/missers, hengelinzet en historische aanwezigheidssignalen zijn nog geen gevalideerde algemene voorspellende correcties.

De huidige code bevat daardoor een bruikbare basis voor persoonlijke historie, maar nog geen volledig zelflerend model dat alle geregistreerde sessiecontext automatisch weegt. De volgende stap is niet om willekeurig al deze velden aan de score toe te voegen, maar om de volledige Prognosepagina-/VisCoach-aanroepketen en de deterministische datakwaliteitsfilters te controleren, daarna de roadmapacties voor diagnose en validatie concreet uit te voeren.

### 1.7 Uitgevoerde controles en beperkingen

- [x] `READ-FIRST.md` gelezen.
- [x] `AGENTS.md` gelezen.
- [x] Relevante Fase 2-audit, architectuur, centrale context, productroadmap, zelflerende-prognose-roadmap, implementatieplan en Fase 0-datadictionary geraadpleegd.
- [x] Actuele `main`-code van prognose-engine, temperatuurhistorie, thermische engine, voorvoerengine, positionering, habitatcontext, sessie-invoer, types en inspannings-/tijdvak-audit geïnspecteerd.
- [x] Branch-head en uitgangscommit gecontroleerd.
- [ ] Volledige UI-aanroepketen Prognosepagina en VisCoach nog nalopen.
- [ ] Deterministische datakwaliteits- en uitsluitingsregels end-to-end nalopen.
- [ ] Relevante bestaande regressietests uitvoeren op een lokale checkout of via CI.
- [ ] Bevindingen vertalen naar concrete roadmapimplementaties waar de bestaande besluiten dat toestaan.

**Geen code, database, gebruikersdata, invoervelden, scores, gewichten of bestaande temperatuurbanden gewijzigd.** Dit onderdeel is code-inspectie; er zijn in deze sessie geen tests of build uitgevoerd. Er is dus geen testresultaat of biologische validatie geclaimd.

## Hervattingspunt

Vervolg met de volledige call-chain van `PrognosisView` en VisCoach, daarna de datakwaliteits-/uitsluitingsaudit. Houd de historische leerroute gescheiden van de aparte temperatuur-forecast-evaluatie. Werk afgeronde resultaten hier bij; wijzig de roadmap/audit alleen wanneer een formele status of besluit daadwerkelijk verandert.

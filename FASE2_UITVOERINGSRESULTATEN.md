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
## Werkonderdeel 2 — Prognosepagina- en VisCoach-aanroepketen; tijdvakscore versus gebruikersplanning

**Roadmapbasis:** Fase 2 geïntegreerde soortspecifieke prognose en tijdvakrespons; FASE2_PROGNOSE_AUDIT.md §§171–179; eigenaarverduidelijking van 21 november 2026.  
**Type werk:** read-only runtime-/UI-trace.  
**Gecontroleerde basis:** main op f57c9c7de5d2f7860fae92ced834397a84c99ab2.  
**Status:** call-chain gecontroleerd; productmatige lacunes en vervolgaudit vastgelegd. Geen runtimewijziging.

### 2.1 Prognosepagina → centrale engine → dag- en tijdvakuitvoer

- PrognosisView haalt de uurverwachting op voor de geselecteerde stek en roept calculateDayPrognosis aan voor vandaag plus zeven dagen.
- De gekozen doelsoort, stek, sessieduur, optionele gemeten watertemperatuur, historische sessies/vangsten, historische watertemperatuurmetingen, lokale temperatuurkalibratie en zonnegegevens gaan als invoer mee.
- De engine verdeelt iedere dag in vier tijdvakken: Nacht 00:00–06:00, Ochtend 06:00–12:00, Middag 12:00–18:00 en Avond 18:00–24:00.
- Per tijdvak wordt, waar mogelijk, de thermische toestand opnieuw doorgerekend naar een representatief uur uit dat tijdvak. Dit zijn vier tijdspecifieke projecties vanaf hetzelfde geldige meetanker, niet vier onafhankelijke temperatuurmodellen.
- De tijdvakscore wordt op dit moment uitsluitend bepaald door de voorlopige soortspecifieke thermische efficiëntie: 1 + 9 × efficiency^0.85, afgerond op één decimaal en begrensd op 1–10.
- Luchtdruk, wind, seizoen, tijd/licht, bewolking en neerslag worden per tijdvak als context uitgewerkt. Hun FactorBreakdown.score is in de huidige code 0; ze wijzigen de biologische activiteitsscore niet.
- De dagscore is het rekenkundig gemiddelde van de vier tijdvakactiviteitsscores. Als niet alle vier tijdvakken een bruikbare thermische score hebben, wordt activityScoreAvailable=false; de interne numerieke fallback 5.0 wordt in de Prognosepagina als N/B getoond en niet als echte score gepresenteerd.
- De rangschikking van het beste tijdvak kijkt alleen naar toekomstige/actieve tijdvakken. Het bestaande onderscheid 'geen betekenisvol verschil' gebruikt momenteel een technisch verschil van minimaal 0,1 punt. Dit is een bestaande codegrens, geen door de eigenaar goedgekeurde toekomstige adviesgrens.
- De dagscore zelf middelt alle vier tijdvakken; bij vandaag kunnen daar dus ook al verstreken tijdvakken in zitten. Dit is iets anders dan de rangschikking van alleen toekomstige tijdvakken.

### 2.2 Historische vangstkans is een afzonderlijke uitkomst

De centrale engine berekent naast de thermische activiteitsscore een persoonlijke historische vangstkans. Die gebruikt geldige vergelijkbare sessies, bevestigde doelsoortvangsten/nulvangsten, werkelijke sessieduur en bruikbare vangstaantallen. Bij voldoende data wordt een Poisson-vangsttempo omgerekend naar een kans voor de opgegeven sessieduur. De engine documenteert expliciet dat deze kans nog niet numeriek wordt gecorrigeerd met thermische activiteit, voeding of habitat, omdat die koppeling niet empirisch is gevalideerd.

De persoonlijke vangstkans is dus geen tweede biologische activiteitsscore en mag niet ongemerkt met de thermische score worden samengevoegd.

### 2.3 VisCoach → dezelfde centrale prognose-engine → adviestekst

- VisCoachView vraagt doelsoort, stek, gewenste starttijd en optioneel gewenste eindtijd.
- buildVisCoachPlan valideert de tijden/duur, haalt de weersverwachting op en roept eveneens calculateDayPrognosis aan. Er is geen tweede biologische score-engine in VisCoach.
- De gekozen starttijd wordt als targetTimeSlot aan de engine meegegeven voor tijdspecifieke tactische weerscontext. Die parameter verandert de dagbrede activiteitsscore of tijdvakscore niet.
- De service bewaart de geplande start/eindtijd en de sessieduur in het plan en de snapshot. Als de eindtijd ontbreekt, blijft de duur onbekend; de coach verzint die niet.
- resolveSelectedTimeSlot geeft alleen een tijdvak terug als het opgegeven interval binnen één tijdvak valt (met een beperkte middernachtbehandeling). Een sessie die meerdere tijdvakken bestrijkt, krijgt geen afzonderlijk geselecteerd tijdvak.
- buildVisCoachAdviceText benoemt bij één geselecteerd tijdvak de bestaande tijdvakconclusie. Bij meerdere tijdvakken zegt de tekst dat de sessie meerdere tijdvakken bestrijkt. De tekst vergelijkt de numerieke kwaliteit van het volledige gevraagde interval niet met alternatieve starttijden.
- De huidige VisCoach-kaart toont plan.prognosis.activityScore: dat is de dagbrede gemiddelde score, niet een score voor het door de gebruiker gekozen sessievenster. De dagbrede beste tijdvakvoorkeur wordt daarnaast getoond.
- De huidige coach maakt dus nog geen kwantitatieve afweging 'jouw gekozen start/eindtijd versus het duidelijk betere alternatief' en adviseert nog niet automatisch om de sessie te verschuiven.

### 2.4 Productdoel verduidelijkt door de eigenaar (leidend voor verdere Fase 2-uitwerking)

De eigenaar bevestigt het volgende gewenste eindgedrag:

1. Houd de gebruikerservaring numeriek en eenvoudig: een score per doelsoort en dag, plus een score per relevant tijdvak/sessieperiode.
2. Alle relevante prognose-elementen moeten uiteindelijk een onderbouwde bijdrage kunnen leveren. Factoren mogen niet worden geactiveerd met willekeurige gewichten, onjuiste causaliteit of dubbeltelling.
3. De prognose rangschikt gunstige dagen en tijdvakken voor de gekozen vissoort.
4. VisCoach beoordeelt de daadwerkelijk opgegeven starttijd én duur als één sessievenster. Als de kwaliteit vergelijkbaar is, respecteert de coach de planning van de visser.
5. Alleen wanneer een alternatief aantoonbaar en betekenisvol gunstiger is, adviseert VisCoach een andere starttijd of sessieduur en legt kort uit waarom.
6. De Prognosepagina blijft de gezaghebbende bron voor de prognose en toont de feitelijke scores, context, datakwaliteit en onzekerheid. VisCoach brengt dezelfde uitkomsten samen tot één praktisch advies en mag geen eigen concurrerende score of prognose maken.

Er is met deze verduidelijking geen numerieke verschilgrens, factorgewicht, scoremapping of adviesdrempel goedgekeurd. De huidige 0,1-puntgrens is daarom niet automatisch de toekomstige VisCoach-beslisgrens.

### 2.5 Concrete lacunes voor Fase 2

| Onderwerp | Huidige situatie | Benodigd vervolg |
|---|---|---|
| Biologische score per soort | Voorlopige thermische prior is de enige numerieke activiteitsscore | Per factor/respons bewijs, beschikbaarheid, soort-/levensfasebereik en toegestane rol vastleggen; pas daarna scorebijdrage |
| Score per tijdvak | Alleen thermische projectie; overige factorbijdragen zijn nul | Responsen op de passende tijdschaal beoordelen; onzekerheid en ontbrekende data per tijdvak behouden |
| Dagscore | Gemiddelde van vier tijdvakscorewaarden; N/B als niet alle tijdvakken beschikbaar zijn | Vaststellen of dagscore de hele kalenderdag of alleen resterende/toekomstige periode moet representeren; geen stilzwijgende wijziging |
| Gebruikersvenster | Coach kan één tijdvak herkennen, maar geen vensterscore over meerdere tijdvakken berekenen | Een sessievenster op basis van starttijd en duur kunnen beoordelen met dezelfde tijdvakuitvoer, inclusief gedeeltelijke overlap |
| Alternatief advies | Geen numerieke vergelijking van gebruikersvenster met alternatieven | Beslisregel voor 'vergelijkbaar' versus 'wezenlijk beter' onderbouwen en door eigenaar laten goedkeuren |
| Persoonlijke vangsthistorie | Aparte vangstkans, sessiestarttijdvak en Poisson-blootstellingsroute | Alleen als afzonderlijke persoonlijke uitkomst gebruiken; niet verwarren met biologische activiteit of voedingsintensiteit |
| Onzekerheid/kwaliteit | Er zijn bestaande temperatuur- en weerkwaliteitsvelden; per score is niet elk ontbrekend element een afzonderlijke onzekerheidsbijdrage | End-to-end controleren welke ontbrekende velden de berekening blokkeren, welke N/B opleveren en welke alleen context missen |

### 2.6 Belangrijke grens en vervolg

De code-inspectie bevestigt dat de bestaande architectuur al één centrale prognose-engine deelt tussen Prognosepagina en VisCoach. De ontbrekende functie is niet een tweede coach-engine, maar een voldoende onderbouwde, tijdvensterbewuste score-/advieslaag die dezelfde centrale prognose-uitvoer gebruikt.

**Volgende werkstap:** voltooi de deterministische datakwaliteits- en uitsluitingsaudit end-to-end: uurdekking per tijdvak, geldigheid/provenance van thermische invoer, behandeling van ontbrekende factoren, historische sessie-/vangstfilters en de exacte beschikbaarheidsstatus die bij dag-, tijdvak- en persoonlijke vangstuitvoer hoort. Daarna kan de Fase 2-crosswalk per factor/respons worden omgezet naar concrete implementeerbare onderdelen en tests.

Geen runtimecode, schema, database, gebruikersdata, invoervelden, scores, gewichten, temperatuurcurves of UI gewijzigd. Dit werkonderdeel is code-/UI-inspectie; er zijn hiervoor geen tests of build uitgevoerd en geen biologische validatie geclaimd.

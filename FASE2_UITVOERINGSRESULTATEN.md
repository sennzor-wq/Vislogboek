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
## Werkonderdeel 3 — deterministische datakwaliteit en uitsluitingsregels

**Roadmapbasis:** Fase 2 acceptatie-eis voor zichtbare ontbrekende/onbetrouwbare invoer; audit §§172–175 en §179.  
**Type werk:** read-only controle van datakwaliteits-, temperatuurhistorie-, thermische en sessieselectiecode plus bestaande gerichte tests.  
**Gecontroleerde basis:** main op afd1b967d267aec6259a218c0087ddf05a3629d5.  
**Status:** belangrijkste filters en beperkingen in kaart gebracht; nog geen test/build uitgevoerd.

### 3.1 Centrale datakwaliteitsbeoordeling

- dataQualityEngine beoordeelt per invoer of een waarde aanwezig is en op basis van status of deze bruikbaar is. Nul is expliciet een geldige waarde.
- Ontbrekende waarden en status unknown zijn niet bruikbaar. Measured wordt als hoog, forecast als middel, modelled als laag maar bruikbaar en userReported als middel beoordeeld.
- De code waarschuwt terecht dat een als measured aangeleverde waarde nog geen onafhankelijke controle van meetmethode of meetkwaliteit betekent.
- De huidige prognose bouwt deze centrale kwaliteitsrapportage voor drie groepen: watertemperatuur, weersverwachting en vergelijkbare sessiehistorie. Dit is geen volledige kwaliteitsbeoordeling van iedere biologische factor.
- De persoonlijke vangstkans wordt aanvullend verborgen wanneer de thermische invoer niet bruikbaar is of de totale weersdekking niet als Volledig is geclassificeerd. De thermische activiteitsscore zelf wordt niet door dezelfde volledige weersdekkingseis geblokkeerd; de eigen beschikbaarheidsregel is of er een gemeten of geschatte watertemperatuur beschikbaar is.

### 3.2 Uurdekking en thermische invoer

- De dagbrede weerkwaliteitscontrole telt per kernveld het aantal geldige uurwaarden voor luchttemperatuur, luchtdruk, wind, neerslag en bewolking. De laagste telling wordt gebruikt als validHours. Volledig vereist minimaal 18 geldige uren en geen kernveld onder 12; Gedeeltelijk vereist minimaal 6; anders Onvoldoende.
- Dit is een dagbrede dekkingstoets. De vier tijdvakken krijgen daarnaast eigen veldcontroles. Voor elk tijdvak is minimaal de helft van de urenconfiguratie aan geldige waarden vereist voor de betreffende contextvelden.
- Voor de thermische schatting zijn minimaal zes geldige luchttemperatuur-uurwaarden op de doeldag nodig. Bij onvoldoende dekking kan een recent lokaal meetanker tot 24 uur oud of een historisch temperatuurprofiel als beperktere terugval worden gebruikt.
- Weer-gestuurde extrapolatie vanaf een ouder lokaal meetanker vereist bekende diepte, maximaal 96 uur ouderdom, minimaal 65% dekking van de periode en voldoende uurwaarden. Bij een recente meting van maximaal 24 uur kan bij ontbrekende dekking een brede ±1,0 °C-stabiliteitsmarge worden getoond.
- Zonder lokaal meetanker kan een modelschatting worden gemaakt wanneer minimaal 72 uur voorafgaande weerhistorie beschikbaar is. Zonder lokaal of historisch waterreferentiepunt kan die schatting een numerieke puntwaarde hebben maar geen numerieke onzekerheidsrange; de code noemt dit expliciet indicatief met hoge, niet-gekwantificeerde onzekerheid.
- Belangrijk aandachtspunt voor de latere score: analyzeTimeSlot beschouwt een eindige geschatte watertemperatuur als voldoende om een thermische score te berekenen, ook wanneer de schatting alleen weerafgeleid is en geen numerieke onzekerheidsrange heeft. De onzekerheidsnotitie blijft beschikbaar, maar de scorebeschikbaarheid zelf maakt dit onderscheid niet zichtbaar. Dit vraagt een expliciete model-/productbeslissing voordat we een volgende scorearchitectuur vastleggen; geen automatische blokkade of correctie toegevoegd.
- Wanneer een tijdvak geen eigen representatief uur uit de forecast heeft, kan de tijdvakberekening terugvallen op de dagbrede thermische analyse. Daardoor is een afzonderlijke tijdvakscore niet in alle situaties gebaseerd op een zelfstandige tijdvaktemperatuurprojectie.

### 3.3 Historische watertemperatuur: bron, deduplicatie en uitsluiting

- De gedeelde collector leest geldige fysieke events uit waterTemperatureMeasurements[] en ondersteunt oudere scalaire sessiemetingen wanneer er geen eventarray met items aanwezig is.
- Sessie-events vereisen een numerieke temperatuur tussen 0 en 35 °C, een parsebaar meettijdstip en bekende bron én methode. Benchmarksessies en sessies zonder locatie worden uitgesloten.
- Snapshotmetingen vereisen een locatie, numerieke meetwaarde, meettijdstip en bekende bron/methode. Benchmarkgekoppelde snapshots worden uitgesloten wanneer de gekoppelde benchmarksessie in de aangeleverde sessielijst aanwezig is.
- Bij een sessie met een niet-lege eventarray wordt de scalaire legacy-terugval niet gebruikt, ook niet wanneer alle events in die array vervolgens door validatiefilters worden uitgesloten. Dit is een compatibiliteits-/datakwaliteitspunt om bij eventuele migratie of import te testen; er is geen bewijs dat huidige gebruikersdata hierdoor verloren gaan en er is niets aangepast.
- Voor een historisch profiel tellen alleen metingen vóór de doeldag, uit dezelfde of een aangrenzende Amsterdamse kalendermaand, met geldige temperatuur en zonder benchmarkstatus. Identieke fysieke metingen worden gededupliceerd op stek, meettijd, temperatuur en meetdiepte.
- Voorkeur is minimaal drie geldige metingen op dezelfde stek. Terugval vereist hetzelfde bekende watertype, maximaal 50 km afstand, vergelijkbare totale waterdiepte en minimaal vijf metingen van minimaal twee stekken. Verschillende bekende meetdieptelagen worden niet samengevoegd; ambiguïteit leidt tot geen profiel.

### 3.4 Persoonlijke sessie- en vangstfilters

- Tijdvakervaring gebruikt afgeronde sessies met outcome catch of skunk_confirmed, sluit benchmarks en sessies met onbekende starttijd uit, vereist een overeenkomende doelsoort en deelt de sessie in op de starttijd.
- Voor een catch-sessie moet ten minste één vangstrecord van de doelsoort met bekende soortherkomst bestaan. Deze tijdvakervaring filtert niet op stek; zij is dus een bredere persoonlijke tijdvakreferentie.
- De persoonlijke vangstkans gebruikt alleen afgeronde, niet-benchmark sessies die bij de doelsoort passen en, wanneer opgegeven, op de gekozen stek plaatsvonden. Een catch-uitkomst telt alleen als doelsoortsucces wanneer een bijbehorend vangstrecord met bekende soortherkomst bestaat.
- Voor het Poisson-vangsttempo tellen alleen sessies met bekende positieve werkelijke duur en bruikbare doelsoortvangstaantallen of een bevestigde nulvangst. Onbekende duur wordt niet ingevuld; de gewenste sessieduur wordt alleen gebruikt om de kans voor de toekomstige sessie te berekenen.
- De softwareminimums (onder meer vijf vergelijkbare sessies en vijf bruikbare blootstellingssessies) zijn bestaande beschikbaarheidsfilters, geen bewijs van voldoende wetenschappelijke steekproefomvang.

### 3.5 Bestaande testdekking — alleen inspectie, niet uitgevoerd in dit werkonderdeel

De repository bevat gerichte tests in onder meer test-thermal-and-prognosis.ts, test-water-temperature-learning.ts, test-water-temperature-synthetic-validation.ts en test-water-thermal-coupling.ts. De geïnspecteerde tests dekken onder andere:
- toekomstig weerdata-as-of en future leakage;
- ontbrekende meetmetadata en uitsluiting van ongeldige temperatuurvalidatieparen;
- uitsluiting van toekomstige metingen en benchmarkmetingen;
- temperatuurprofiel-/thermische ankergevallen en beperkte dekking;
- herkomst van automatische versus door gebruiker aangepaste vangsttijdstippen.

In de geïnspecteerde testbestanden is geen dedicated suite voor dataQualityEngine aangetroffen. Ook is nog geen gerichte regressietest gevonden voor de volledige combinatie van tijdvak-forecastdekking, een ontbrekende tijdvaktemperatuurschatting, weer-only puntinschatting zonder onzekerheidsrange en de uiteindelijke zichtbare scorebeschikbaarheid. Dit zijn testkandidaten, geen aangetoonde runtimefouten.

### 3.6 Vervolg

De datakwaliteitsregels zijn grotendeels expliciet en voorzichtig, maar de volgende integrale punten moeten nog worden vastgesteld voordat de scorearchitectuur kan worden omgezet:
1. Per tijdvak vastleggen welke thermische bronstatus de score mag voeden en hoe weer-only schattingen met niet-gekwantificeerde onzekerheid worden weergegeven.
2. Vaststellen wanneer een tijdvakscore echt tijdspecifiek is en wanneer deze op dagbrede thermische context terugvalt.
3. De zichtbare scorebeschikbaarheid scheiden van de aanwezigheid van een interne puntwaarde; onbekend mag niet ongemerkt een neutrale of schijnnauwkeurige score worden.
4. De bestaande sessie-/vangstfilters met gerichte regressietests vastzetten, inclusief locatieverschil tussen tijdvakervaring en persoonlijke vangkans.
5. Daarna pas de factor-/respons-crosswalk vertalen naar toegestane scorebijdragen en tijdvensteraggregatie.

Geen runtimecode, schema, database, gebruikersdata, invoervelden, scores, gewichten of temperatuurcurves gewijzigd. Dit onderdeel is code-/testinspectie; de tests zijn niet uitgevoerd en biologische validatie is niet geclaimd.


## Werkonderdeel 4 — primaire-broncontrole karper en actuele registry-integriteit

**Roadmapbasis:** Fase 2 audit §171.8 (primaire bronnen/overdraagbaarheid) en §150 (responsen gescheiden houden).  
**Type werk:** gerichte volledige-tekstcontrole van één reeds geregistreerde primaire studie; read-only bron-/registrycontrole.  
**Gecontroleerde basis:** main op 23929eaa7268b596721fc08fdf12ea7baaf9ad76.  
**Status:** bron gecontroleerd; bestaande registratie bevestigd; geen modelactivatie.

- De volledige publicatie van Oyugi et al. (2012) is gecontroleerd. Het betreft juveniele karper (90–105 mm, circa 21,5 g) in gecontroleerde aquaria bij 16/20/24/28 °C, met 2-mm pellets en maden. De gemeten respons is consumptiesnelheid van aangeboden voedselitems, niet totale dagelijkse voedselopname, volwassen veldgedrag of hengelvangbaarheid.
- De voersnelheid steeg significant van 16 naar 24 °C; tussen 24 en 28 °C was geen significante verdere stijging van deze gemeten snelheid. Voedseltype en voedseldichtheid beïnvloedden de respons. Groei was een afzonderlijke uitkomst.
- De bestaande registry-entry `common-carp-juvenile-foraging-temperature-2012` classificeert `foraging_behavior` en `growth` apart, beschrijft de juveniele gecontroleerde context en blijft `approvedForPrediction: false`. De volledige-tekstcontrole geeft geen reden om deze bron te activeren of de bestaande volwassen-karpercurve aan te passen.
- De actuele registry is geteld: 94 unieke IDs, 94 niet-goedgekeurd, 0 numeriek goedgekeurd, geen dubbele IDs. De verouderde actuele telling 93 in audit §171 is gecorrigeerd; historische tellingen blijven als historische momentopname behouden.
- Geen runtimecode, tests, score, gewicht, curveparameter, UI, database of gebruikersdata gewijzigd. Dit onderdeel is bron-/documentatiecontrole; geen biologische veldvalidatie of modelprestatie geclaimd.

**Volgende stap:** gerichte controle van de scorebeschikbaarheid en onzekerheidsdoorgifte per thermisch tijdvak, gevolgd door een kleine regressietest voor het gevonden randgeval indien de actuele code bevestigt dat het reproduceerbaar is.


## Werkonderdeel 5 — thermische bronprovenance en ontbrekende onzekerheidsband correct weergegeven

**Roadmapbasis:** Fase 2 audit §§171, 181; producteis dat de Prognosepagina altijd de feitelijke bron en onzekerheid toont.  
**Type werk:** kleine runtimepresentatiereparatie met gerichte regressietests.  
**Gecontroleerde basis:** main op affef1e5cab0c9bb879a457d91e6e54cdbbcaaf3.  
**Status:** geïmplementeerd; volledige Quality Gate geslaagd.

### Uitgevoerde wijziging

- `src/services/prognosisEngine.ts`: de thermische factoromschrijving gebruikt nu `waterTemperatureStatus` en onderscheidt een schatting vanaf een recente lokale meting, een historisch profiel en een indicatieve weer-only schatting.
- Bij een weer-only schatting zonder lokale waterreferentie wordt de hoge, niet-gekwantificeerde onzekerheid expliciet in de factoromschrijving vermeld.
- `waterTemperatureInfo.note` toont alleen een numerieke onzekerheidsband wanneer die bestaat; anders meldt de tekst expliciet dat geen kwantificeerbare marge beschikbaar is. De eerdere mogelijke `undefined–undefined`-tekst is daarmee voorkomen.
- `test-thermal-and-prognosis.ts`: drie nieuwe assertions voor bronstatus, onzekerheidstekst en afwezigheid van een fictieve band.
- `test-water-thermal-coupling.ts`: bestaande assertion aangepast zodat deze de feitelijke weer-only herkomst controleert in plaats van de oude onjuiste claim "via thermische traagheid".

### Validatie en scope

Quality Gate #1049 is volledig geslaagd op exact commit `affef1e5cab0c9bb879a457d91e6e54cdbbcaaf3` (43 succesvolle stappen, 0 gefaalde stappen), inclusief typecheck, kernprognose-/thermische tests, waterthermische koppeling, volledige overige tests en productiebuild.

De eerste validatiepoging #1047 faalde op een TypeScript optional-property guard in de nieuwe test; #1048 faalde op een bestaande regressieassertion die nog de oude, onjuiste bronomschrijving verwachtte. Beide zijn gericht hersteld; de definitieve run #1049 is groen.

Geen wijziging aan scoreformule, factorweging, temperatuurcurve, thermische puntwaarde, gebruikersdata, database, gebruikersinvoer of VisCoach-advieslogica. Dit is een nauwkeurigheidsverbetering van uitleg/provenance, geen biologische validatie.

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


## Werkonderdeel 6 — onzekerheidslabel zichtbaar gemaakt in compacte Prognosepagina

**Roadmapbasis:** eigenaarseis van 21 november 2026 dat de Prognosepagina altijd de juiste bron- en onzekerheidsinformatie toont; audit §182.  
**Type werk:** kleine UI-presentatieverbetering met bestaande bronstatus; geen nieuwe scorelogica.  
**Gecontroleerde basis:** main op 970964ab5892fd241e051d62462a41c0113d2042.  
**Status:** geïmplementeerd; volledige Quality Gate geslaagd.

Wanneer een score steunt op een weer-only watertemperatuurpuntwaarde zonder lokale waterreferentie en zonder kwantificeerbare onzekerheidsband, wordt nu ook in de compacte weergave een zichtbare indicatie getoond:
- dagselectie: `Indicatief`;
- hoofdscore: `Indicatieve temperatuurbron`;
- compacte temperatuurregel: `Indicatieve schatting — hoge, niet-gekwantificeerde onzekerheid`.

De classificatie gebruikt de bestaande `waterTemperatureStatus` en `estimatedRange`; zij introduceert geen nieuwe parameter of schatting. Metingen, lokale meetanker-schattingen en historische profielschattingen krijgen deze specifieke waarschuwing niet.

Quality Gate #1051 is volledig geslaagd op exact `970964ab5892fd241e051d62462a41c0113d2042` (43 succesvolle stappen, 0 gefaald), inclusief typecheck, regressietests en productiebuild. Er is geen geïsoleerde React-componenttestinrichting in de repository; daarom is de UI-voorwaarde statisch gecontroleerd en door de volledige typecheck/build geborgd.

Geen wijziging aan numerieke score, modelcurve, gewichten, database, gebruikersinvoer of VisCoach-scorelogica. Dit verbetert de presentatie van onzekerheid, niet de biologische voorspelvaliditeit.


## Werkonderdeel 7 — read-only runtimecontrole score-, tijdvak- en sessieduurkoppeling (21 november 2026)

**Roadmapbasis:** Fase 2; vervolg op audit §182, architectuur §148 en werkonderdeel 6.  
**Type werk:** read-only codecontrole van de bestaande Prognose-engine en Prognosepagina. Geen nieuw biologisch bronnenonderzoek en geen runtimewijziging.  
**Gecontroleerde basis:** main op `225fce27f3f2ae0077ce4d0fa3feeebc74c8f97b`.  
**Status:** controle uitgevoerd; bevindingen vastgelegd; vervolgonderzoek afgebakend.

### 7.1 Wat de huidige numerieke score daadwerkelijk meet

In `src/services/prognosisEngine.ts`, functie `analyzeTimeSlot`:

- De huidige numerieke `activityScore` wordt uitsluitend berekend uit de voorlopige soortspecifieke thermische efficiëntiecurve voor watertemperatuur: `1 + 9 × thermalEff^0.85`, begrensd op 1–10 en afgerond op één decimaal.
- De overige zichtbare factoren — luchtdruk, wind, seizoen, tijdstip/licht, bewolking en neerslag — leveren momenteel context en krijgen geen numerieke bonus of aftrek.
- Bij ontbrekende watertemperatuur wordt intern een neutrale placeholder gebruikt om de berekening technisch af te ronden, maar `activityScoreAvailable=false` voorkomt dat die placeholder als geldige score wordt gepresenteerd.
- Een geschatte watertemperatuur kan de score wel voeden. Voor weer-only schattingen zonder lokale referentie is de hoge, niet-gekwantificeerde onzekerheid inmiddels zichtbaar gemaakt in audit §181–182.

Dit is dus geen samengestelde score van alle prognosefactoren en geen gevalideerde voedings-, aanwezigheids- of vangstkansscore.

### 7.2 Hoe de dag- en tijdvakscore nu worden bepaald

- De engine berekent vier afzonderlijke tijdvakuitkomsten: Nacht, Ochtend, Middag en Avond.
- Voor ieder tijdvak wordt, waar mogelijk, een thermische toestand berekend op het representatieve midden van de beschikbare uurlijkse forecastwaarden. Dit zijn vier tijdstipgerichte berekeningen vanaf dezelfde beschikbare meet-/historische basis, geen vier onafhankelijke biologische modellen.
- De dagscore is het rekenkundig gemiddelde van de vier tijdvak-activiteitsscores. De dagscore wordt als niet beschikbaar gemarkeerd zodra één van de vier tijdvakken geen bruikbare thermische score heeft.
- Het thermisch gunstigste tijdvak wordt gezocht binnen de nog niet verstreken of actieve tijdvakken. Een verschil van ten minste 0,1 punt tussen beschikbare scores wordt momenteel als betekenisvol behandeld; anders wordt geen winnaar aangewezen.
- De score is daarmee een thermische rangschikking van tijdvakken, niet een beoordeling van de volledige geplande vissessie.

### 7.3 Wat sessieduur en gekozen starttijd nu wel en niet doen

- `sessionDurationHours` wordt begrensd en gebruikt in de persoonlijke Poisson-vangkans en de verwachte vangstopbrengst. Deze duur verandert de thermische `activityScore` of de rangschikking van de vier tijdvakken niet.
- De persoonlijke vangstkans blijft een afzonderlijke historische baseline op basis van vergelijkbare sessies, bekende visduur en doelsoortvangsten. Thermische activiteit wordt niet als numerieke correctie op die vangkans toegepast.
- `targetTimeSlot` kan aan de engine worden meegegeven voor tijdgevoelige tactische weerscontext. De code documenteert expliciet dat dit de dagbrede beste-tijdvakscore niet verandert.
- De Prognosepagina rekent de dagprognose opnieuw wanneer de gekozen sessieduur verandert, maar de thermische tijdvakscore blijft inhoudelijk onafhankelijk van die duur.
- De huidige code berekent dus nog niet de thermische score over het volledige door de gebruiker gekozen interval (starttijd plus duur), en vergelijkt dat interval nog niet rechtstreeks met een alternatief interval.

### 7.4 Wat bewust niet is aangepast

Geen scoreformule, thermische curve, gewicht, grenswaarde, biologische bronstatus, persoonlijke vangstkans, tijdvakindeling, database, snapshot, gebruikersdata of gebruikersinvoer gewijzigd. Er is geen nieuwe biologische informatie gezocht of dubbel geregistreerd. Dit werkonderdeel is uitsluitend code-inspectie; geen implementatie, testuitvoering of biologische validatie geclaimd.

### 7.5 Eerstvolgende uitvoering

**Werkonderdeel 8 — ontwerp- en contractcontrole voor een sessie-intervalscore en vergelijking met alternatief.**

Volgorde:
1. Breng de bestaande typen en gegevenscontracten voor `DayPrognosis`, `TimeSlotAnalysis`, sessie-starttijd, sessieduur en VisCoach-input volledig in kaart.
2. Controleer hoe een gekozen interval dat meerdere bestaande tijdvakken overlapt, zonder dubbele telling of verzonnen tijdresolutie kan worden beschreven.
3. Leg vast welke bestaande gegevens werkelijk tijdspecifiek beschikbaar zijn en welke alleen als context gelden.
4. Onderzoek hoe de bestaande persoonlijke vangstbaseline naast — en nadrukkelijk niet vermengd met — thermische activiteitspotentie kan worden getoond.
5. Formuleer pas daarna een voorstel voor de vergelijking tussen het gekozen interval en een alternatief, inclusief de reeds door de eigenaar gewenste regel: bij marginale verschillen de gebruikersplanning respecteren; alleen bij een aantoonbaar betekenisvol verschil een verschuiving adviseren.

**Geen nieuwe gewichten, drempels, biologische correcties of scoreformules invoeren voordat de bestaande contracten volledig zijn gecontroleerd en eventuele productkeuzes aan de eigenaar zijn voorgelegd.** Hergebruik de bestaande biologische bronregistratie; nieuw literatuuronderzoek is alleen toegestaan wanneer een concreet, nog onbeantwoord bewijsprobleem wordt aangetoond.

Fase 2 blijft open en Fase 3 blijft geblokkeerd.



## Werkonderdeel 8 — contractcontrole tijdsinterval en vastlegging geïntegreerde score-eis (21 november 2026)

**Roadmapbasis:** Fase 2; vervolg op werkonderdeel 7, audit §183 en architectuur §149.  
**Type werk:** read-only contract-/runtime-inspectie en documentatie van de expliciete producteis. Geen runtimewijziging, geen nieuwe biologische bronnenzoektocht.  
**Gecontroleerde basis:** main op `6103f43190d6764d2501a929e4b7faf548f683ec`.  
**Status:** gedeeltelijke contractcontrole uitgevoerd; belangrijke beperkingen vastgesteld; verdere type-/call-chain-inspectie blijft open.

### 8.1 Bestaande interval- en tijdvakcontracten

- `PrognosisOptions` bevat `sessionDurationHours` en `targetTimeSlot`, maar geen expliciete `sessionStartAt`, `sessionEndAt` of algemeen sessie-interval.
- `targetTimeSlot` is een categorische tijdvakkeuze voor tactische context. De codecomment vermeldt expliciet dat deze keuze de dagbrede beste-tijdvakscore niet wijzigt.
- De algemene Prognosepagina berekent acht kalenderdagen en geeft de gekozen sessieduur mee, maar geen door de gebruiker gekozen starttijd. De sessiestartknop start direct op het actuele moment en bepaalt het tijdvak uit de actuele Amsterdamse tijd.
- `createLiveSnapshotForSessionStart` gebruikt `now` als startmoment en geeft het actuele tijdvak en de duur door. Dit ondersteunt een live-startsnapshot, niet een vrij gepland toekomstig interval.
- Historische `FishingSession`-records bevatten start-/eindtijd en/of duur. `getSessionDurationHours` gebruikt een geldige expliciete duur, of leidt deze af uit bekende start- en eindtijd; ongeldige/onbekende duur blijft onbekend. Dit historische sessiecontract is geen toekomstig prognose-intervalcontract.
- De vier bestaande tijdvakken zijn Nacht, Ochtend, Middag en Avond. Per tijdvak worden weerssamples geaggregeerd en waar mogelijk wordt een thermische toestand op een representatief forecastmoment berekend. Bij ontbrekende tijdvakforecast kan de analyse terugvallen op de dagbrede thermische analyse.
- De huidige dagscore is het gemiddelde van de vier tijdvak-thermische scores en wordt niet beschikbaar verklaard als een tijdvakscore ontbreekt. De toekomstselectie vergelijkt alleen niet-verstreken/actieve tijdvakken. Dit is geen duurgewogen beoordeling van een geplande vissessie.

### 8.2 Factorstatus volgens de actuele code

| Onderdeel | Huidige rol in numerieke `activityScore` | Beschikbare contract-/context |
|---|---|---|
| Watertemperatuur | Enige actieve numerieke bijdrage via voorlopige soortcurve | Gemeten of geschat; bronstatus en onzekerheid bestaan |
| Luchtdruk en trend | Geen numerieke bijdrage | Tijdvakgemiddelde en 12-uurs trendbeschrijving |
| Wind en richting | Geen numerieke bijdrage | Tijdvakgemiddelde; praktische oever-/presentatiecontext via gespecialiseerde modules |
| Seizoen | Geen numerieke bijdrage | Kalenderclassificatie |
| Tijdstip/licht | Geen numerieke bijdrage | Tijdvak, soortspecifieke diel-context en schemer/zonsituatie |
| Bewolking/neerslag | Geen numerieke bijdrage | Tijdvakgemiddelden/totaal; huidige code toont context |
| Persoonlijke sessiehistorie | Geen correctie op thermische score | Tijdvakervaring op startsessie; aparte vangstbaseline/Poisson-uitkomst |
| Waarnemingen/habitat/tactiek | Geen numerieke correctie op thermische score | Gespecialiseerde context-/coachmodules; eigen bewijs- en onzekerheidsregels |

### 8.3 Gevolgen voor een echte sessie-intervalscore

Een intervalscore kan niet correct worden afgeleid door de bestaande vier tijdvakscoregetallen simpelweg op te tellen of ongewogen te middelen. Een sessie kan een deel van een tijdvak, meerdere tijdvakken of middernacht overlappen; de huidige contracten leggen geen expliciete intervaldekking of duurweging vast. Bovendien zijn tijdvakwaarden deels gebaseerd op representatieve uurpunten en kan thermische context terugvallen op een dagbrede analyse.

Voor een latere contractuitbreiding moeten minimaal expliciet worden bepaald:
- starttijd en eindtijd als tijdstempels met Amsterdamse tijdzone/offset en eenduidige datumgrens;
- hoe intervallen over tijdvakken en middernacht worden gesegmenteerd;
- welke forecast-/thermische gegevens werkelijk beschikbaar zijn binnen ieder segment en hoe dekking wordt berekend;
- hoe overlap, ontbrekende segmenten en onzekerheid worden weergegeven zonder ontbrekende perioden als neutraal effect te tellen;
- hoe de door de gebruiker gekozen sessie naast een alternatief wordt vergeleken, met behoud van de gebruikersplanning bij marginale verschillen;
- hoe persoonlijke vangstbaseline apart wordt getoond en niet ongevalideerd wordt opgeteld bij biologische activiteitspotentie.

### 8.4 Vastgelegde producteis voor de volledige prognose

De eigenaar heeft expliciet bevestigd dat alle prognoseonderdelen volledig moeten worden uitgewerkt, zodat relevante onderdelen niet alleen context blijven maar daadwerkelijk bijdragen aan een geïntegreerde score. Dit einddoel is nu vastgelegd in audit §183 en architectuur §149.

Dit betekent niet dat iedere factor ongeacht bewijs automatisch een gewicht krijgt. Per factor moet de Fase 2-audit vaststellen welke respons wordt voorspeld, welk bestaand bewijs daarvoor bruikbaar is, welke data/tijdsresolutie beschikbaar zijn, hoe onzekerheid en interacties worden behandeld en welke onafhankelijke validatie nodig is. De bestaande bronregistry/factorinventaris wordt hergebruikt; geen dubbel onderzoek of dubbele registratie.

### 8.5 Wat niet is gewijzigd en wat nog openstaat

Geen runtimecode, type, scoreformule, factorgewicht, temperatuurcurve, drempel, database, snapshot, gebruikersinvoer of gebruikersdata gewijzigd. Geen tests uitgevoerd; geen biologische validatie geclaimd.

**Vervolg binnen werkonderdeel 8:** de precieze type-definities en volledige VisCoach-call chain nog lokaliseren en inspecteren; daarna de minimale intervalcontractopties formuleren. Parallel hieraan wordt de factor-/respons-crosswalk gebruikt om de bestaande factoren te koppelen aan het geïntegreerde scoredoel. Er wordt geen formule geïmplementeerd voordat de eigenaar de voorgestelde architectuur en bewijsgrenzen heeft goedgekeurd.



### 8.6 Correctie na volledige VisCoach-call-chain-inspectie (21 november 2026)

De eerdere formulering in §8.1 dat er geen expliciet gepland interval in VisCoach bestaat, was te breed en wordt hierbij gecorrigeerd. De algemene Prognosepagina heeft geen vrij gekozen start-/eindtijd; de afzonderlijke VisCoach-planflow heeft deze functionaliteit wél.

Gecontroleerde bestanden:
- `src/components/viscoach/VisCoachView.tsx`: gewenste starttijd en optionele eindtijd.
- `src/services/viscoachService.ts`: `VisCoachPlanInput`, `buildVisCoachPlan`, `resolveSelectedTimeSlot`, snapshot-opbouw.
- `src/types/index.ts`: `PlannedFishingSession`, `PrognosisSnapshot`, `PrognosisInputContext`, `TimeSlotAnalysis`, `DayPrognosis`.
- `src/services/timeSlotExposureEngine.ts`: bestaande segmentatie van hengelintervallen.

Vastgesteld:
1. VisCoach berekent duur uit het gekozen start-/eindmoment (maximaal 24 uur), geeft de duur door aan de prognose-engine en bewaart intervalstart/-einde in pending snapshot en inputfingerprint.
2. De persoonlijke Poisson-vangstbaseline gebruikt de duur; de thermische activiteitsscore niet.
3. Alleen het starttijdvak wordt als `targetTimeSlot` aan de engine doorgegeven voor tactische context.
4. De prognose-engine berekent de dagprognose voor de startdatum. De intervalgrenzen worden niet gebruikt om de thermische tijdvakscore op segmentniveau te berekenen.
5. `resolveSelectedTimeSlot` kan alleen een tijdvak teruggeven als het gekozen interval geheel in één tijdvak past. Tijdvakoverschrijdende sessies hebben geen geselecteerd tijdvak; datumoverschrijding wordt niet algemeen ondersteund.
6. De snapshot bewaart de intervalgrenzen, maar `PrognosisInputContext` bewaart deze niet als expliciete start-/eindtijd. Het interval is dus niet volledig als modelinvoercontext gereproduceerd, ondanks opslag in snapshot/fingerprint.
7. `timeSlotExposureEngine` biedt een bestaande technische referentie voor intervalsegmentatie over Amsterdamse tijdvakken en DST, maar berekent hengelblootstelling, niet biologische activiteitspotentie.

De eerdere conclusie is dus aangescherpt: het geplande interval bestaat al in VisCoach; een echte prognosescore over dat interval ontbreekt. Geen parallel intervalobject nodig. Volgende stap is vaststellen hoe de bestaande intervalgrenzen als reproduceerbare modelinput kunnen worden verbonden aan segmentgewijze tijdvak-/weers-/temperatuurgegevens, inclusief ontbrekende dekking en meerdere kalenderdagen.

Geen runtimecode gewijzigd, geen scoreformule of gewichten gewijzigd, geen tests uitgevoerd en geen biologische validatie geclaimd.



### 8.7 FactorBreakdown-uitvoer versus werkelijke scorebijdrage

Inspectie van `analyzeTimeSlot` en `src/types/index.ts` bevestigt dat ieder zichtbaar factorveld al een `FactorBreakdown` heeft met `score`, `impact`, `title`, `detail` en `dataAvailable`. De daadwerkelijke invulling is echter:
- Thermische watertemperatuur: berekende deelscore op basis van thermische efficiëntie; dit is de enige actieve numerieke input voor `activityScore`.
- Luchtdruk, wind, seizoen, tijd/licht en bewolking/neerslag: score 0 en impact neutraal; uitsluitend context in de huidige implementatie.
- `dataAvailable` betekent alleen dat invoer aanwezig/bruikbaar is, niet dat de relatie biologisch gevalideerd is.

Daarnaast bevat `DayPrognosis` aparte modules voor persoonlijke vangstkans/verwachte vangsten, aanwezigheid, thermische ontwikkeling, oeverwind, habitat/beweging, positionering en voorvoer. Deze meten verschillende responsen en zijn niet zonder meer onderling optelbaar.

**Vervolgstap:** bouw de bestaande factorinventaris en research registry om tot een factor-/respons-crosswalk. Geen nieuwe bronnen verzamelen zolang de bestaande registry geen concrete bewijsleemte aantoont. Per factor/module de doelrespons, tijdsresolutie, lokale invoer, bewijsstatus, mogelijke interactie, scoregeschiktheid en validatievoorwaarde vastleggen.



## Werkonderdeel 8 — voortgang 8.8: eerste factor-/respons-crosswalk (22 november 2026)

**Type werk:** read-only inspectie van de bestaande prognosefactoren, aanvullende engines, types en de volledige research registry; documentatie van de eerste crosswalk. Geen nieuwe literatuurzoektocht en geen runtimewijziging.

### Uitgevoerd
- De volledige actuele `researchRegistry.ts` is geteld en op unieke IDs gecontroleerd: 94 records, 0 numeriek goedgekeurd, geen dubbele IDs.
- De zes zichtbare `FactorBreakdown`-factoren zijn gekoppeld aan hun huidige inputs en de feitelijke `analyzeTimeSlot`-implementatie.
- De aparte modules voor voedingsbewijs, aanwezigheid/waarnemingen, habitat/beweging, persoonlijke vangstkans, oeverwind, hengelpositionering en voorvoer zijn gekoppeld aan hun eigen respons-/adviesdoel.
- Bestaande bronrecords zijn als voorbeelden gekoppeld; er zijn geen bronnen dubbel geregistreerd.
- Interacties en mogelijke dubbeltelling tussen temperatuur, seizoen, licht, bewolking, wind, habitat, aanwezigheid, voeding en vangbaarheid zijn expliciet vastgelegd.

### Belangrijkste bevindingen
1. De bestaande thermische curve blijft de enige actieve numerieke bijdrage aan `activityScore`, maar is een voorlopige thermische prior.
2. Tijdgebonden directe voedingsrespons is de meest kansrijke afzonderlijke kandidaat voor verdere scorecontractcontrole; bestaande studies zijn contextgebonden en geen bron is numeriek goedgekeurd.
3. Drukbewijs is beperkt en soort-/responsgebonden; er is geen registrybasis voor een universele drukbonus. Voor wind, wolken en regen ontbreekt een passende directe algemene scorebasis.
4. Seizoen moet worden ontleed in temperatuur, fotoperiode, levenscyclus en habitat om dubbeltelling te voorkomen.
5. Persoonlijke vangstkans, aanwezigheid/habitat en tactiek meten verschillende uitkomsten. Positionering en voorvoer zijn advieslagen, geen extra activiteitsscores.
6. VisCoach blijft de advies- en tactieklaag die de bestaande Prognose-informatie gebruikt; er wordt geen aparte VisCoach-prognose geïntroduceerd.

### Status en vervolg
De eerste crosswalk staat in audit §186 en de architectuurregels in §152. **Werkonderdeel 8 is nog niet gesloten**: de kandidaat voedings-/foerageerlaag en daarna persoonlijke vangstkans en aanwezigheid/habitat moeten nog op hun volledige invoer-, tijdsresolutie-, bewijs- en validatiecontract worden gecontroleerd. De volgende stap is die gerichte code-/typecontrole van de bestaande `feedingEvidenceService` en de bijbehorende tijdvak-/soortcontext, zonder scoreactivatie.

Geen code, tests, scoreformule, gewichten, drempels, bronstatus, gebruikersdata, snapshots of UI gewijzigd. Geen biologische validatie geclaimd. Fase 2 blijft open; Fase 3 blijft geblokkeerd.


## Werkonderdeel 8 — voortgang 8.9: voedings-/foerageerevidence-contract gecontroleerd (22 november 2026)

**Type werk:** read-only inspectie van bestaande services, registry-queryfuncties en soorttypen. Geen nieuwe literatuurzoektocht en geen runtimewijziging.

### Vastgesteld
- `feedingEvidenceService` groepeert voedselopname, voedingsritme, foerageergedrag, dieet en prooikeuze.
- De generieke registry-query neemt soortspecifieke én soortneutrale records mee. De service filtert niet op levensfase, watertype, seizoen, habitat of onderzoeksopzet.
- `dielBehaviorEvidenceService` sluit generieke bronnen uit en houdt voedingsritme, locomotorische activiteit en habitatgebruik apart.
- Geen bron is numeriek goedgekeurd; de approval-lijst blijft leeg. De service is bewijsindex/context, geen voedingsscore.
- Registry-recordaantallen per soort zijn dekking, geen effectgroottes of onafhankelijke steekproefomvang.
- Roofblei en Overig hebben in de huidige query geen directe voedingsintensiteits-/ritmebronnen; dieet of beweging mag dit gat niet opvullen.

### Vervolg
Controleer de Prognosepagina-weergave om te verifiëren dat directe voeding, foerageren, dieet/prooikeuze en beweging niet als één voorspelde voedingsuitkomst worden gepresenteerd. Daarna volgen de persoonlijke vangstkans en de kwaliteit van aanwezigheid-/habitatlabels.

Geen code, tests, scoreformule, gewichten, drempels, bronstatus, UI of gebruikersdata gewijzigd. Werkonderdeel 8 blijft open; Fase 2 blijft open en Fase 3 geblokkeerd.


## Werkonderdeel 8 — voortgang 8.10: gebruikersweergave voedingsbewijs gecontroleerd (22 november 2026)

Read-only controle van `PrognosisView.tsx` en registry-querysemantiek:
- De Prognosepagina toont brongebonden onderzoekscontext alleen bij een geselecteerde soort.
- Voedselopname/-ritme en foerageergedrag worden afzonderlijk weergegeven, met samenvatting, beperkingen, referenties en bewijsstatus.
- De UI zegt expliciet dat dit geen actuele voedingsvoorspelling is en geen invloed heeft op thermische activiteitspotentie, beste tijdvak of persoonlijke vangstkans.
- Dieet/prooikeuze wordt niet als voedingsintensiteit gepresenteerd.
- Generieke registry-records hebben momenteel geen passende `measuredOutcomes` voor deze query; er is geen generieke bron die ongemerkt als soortspecifieke voedingsstudie wordt getoond.

**Beoordeling:** consumentencontract is op dit punt inhoudelijk gescheiden; geen UI-fix nodig. Volgende stap: persoonlijke vangstkans en aanwezigheid-/habitatwaarnemingen controleren. Geen code, UI, score, tests of gebruikersdata gewijzigd.


## Werkonderdeel 8 — voortgang 8.11: persoonlijke vangstkans en aanwezigheid/habitat gecontroleerd (22 november 2026)

**Type werk:** read-only controle van prognose-engine, evaluatie-engine, habitatengine, types, database-synchronisatie en hoofd-aanroeppaden.

### Vastgesteld
- De persoonlijke Poisson-vangkans is een aparte soort-/optionele stekbaseline per geplande duur. Techniek, aas/voer, hengeltype en starttijdvak filteren of corrigeren de kans momenteel niet.
- De tijdvakgebonden persoonlijke ervaring telt sessies per doelsoort en starttijdvak, maar is niet stekspecifiek.
- Brier-validatie toetst de vooraf vastgelegde vangstkans tegen afgeronde sessie-uitkomsten met modelversie-, exacte tijdvenster- en duurmatching; dit is geen validatie van thermische activiteit, voeding of habitat.
- Aanwezigheidslabels blijven kwalitatieve context. Nieuwe sessiesamenvattingsrecords krijgen bij synchronisatie `session.updatedAt` als registratietijd, niet aantoonbaar het fysieke waarnemingstijdstip.
- De Prognosepagina geeft een geselecteerde enkelvoudige waarneming door; VisCoach geeft momenteel onbekend door. De optionele waarnemingenarray wordt in deze gecontroleerde hoofd-aanroeppaden niet gevuld.
- Habitat-/bewegingsuitvoer is een regelgebaseerde zoekhypothese en geen gekalibreerde aanwezigheidskans. De code bevat heuristische temperatuur-/seizoenschakels die niet als gevalideerde grenzen mogen worden gelezen.

### Vervolg
Controleer de historische sessie-/vangstfeatures (techniek, aas/voer, hengeltype, aasrichting, voorvoer, aanbeten en vangsttijd) op feitelijke runtimeconsumptie en snapshotprovenance. Daarna kan de eerste factor-/respons-crosswalk worden afgesloten.

Geen runtimecode, types, database, snapshots, scoreformule, gewichten, drempels, bronstatus, UI of gebruikersdata gewijzigd. Geen tests of biologische validatie geclaimd. Werkonderdeel 8 en Fase 2 blijven open; Fase 3 blijft geblokkeerd.


## Werkonderdeel 8 — voortgang 8.12: runtime-mapping historische sessiefeatures (22 november 2026)

**Type werk:** read-only controle van `createPrognosisHistoryFeatureSnapshot`, `prognosisEngine`, `rodPositioningEngine` en `prebaitEngine`.

### Actieve historische consumptie
- Thermische meetgeschiedenis voedt de thermische engine/profielroute.
- Sessie-uitkomst, doelsoort, optionele stek, bekende duur en vangstsoort/-aantal voeden de persoonlijke vangstbaseline.
- Starttijdvak voedt afzonderlijke persoonlijke tijdvakervaring; deze is niet stekspecifiek.
- Aasrichting voedt een persoonlijke positioneringsnuance op dezelfde stek/doelsoort (minimaal 11 sessies, minimaal 6 met richting).
- Voorvoerstatus voedt een beschrijvende vergelijking op dezelfde stek/doelsoort (minimaal 5 geclassificeerde sessies, minimaal 2 per groep).

### Alleen opgeslagen/kandidaat, geen huidige voorspellende correctie
Hengeltype, sessietotalen aanbeten/gemiste vissen, historische aas-/techniekcombinaties, vangsttijd als fijnmazig label, sessiewaterdiepte en exacte voorvoerdagen/-hoeveelheden worden niet als huidige correctie op de geïntegreerde activiteitsscore of persoonlijke Poisson-kans gebruikt. Snapshotopslag is geen runtimeconsumptie.

De bestaande legacyfallback van vrije voeromschrijving bij ontbrekende `prebaited` kan “geen voorvoer” onbedoeld classificeren; deze bekende beperking blijft staan en er is geen dataherclassificatie uitgevoerd.

### Vervolg
De eerste crosswalk is nu op hoofdlijnen compleet. Volgende stap is een volledigheids-/consistentiecontrole van audit §186–190 tegen de eerder gesloten auditbesluiten en de roadmap, gevolgd door een geordende lijst van resterende Fase 2-poorten. Geen nieuwe brede literatuurzoektocht en geen score-/runtimewijziging.

Geen code, tests, types, database, snapshots, UI, score, gewichten, bronstatus of gebruikersdata gewijzigd. Werkonderdeel 8 blijft open tot de crosswalk-review is afgerond.


## Werkonderdeel 8 — voortgang 8.13: crosswalk-review en intervalcontractvoorstel (22 november 2026)

### Consistentie-review
De crosswalk §§186–190 is vergeleken met de bestaande formele acceptatiecrosswalk (§89), factorinventaris (§102), scoredoel (§103), evaluatiekader (§131), toelatingsmatrix (§132), engine-roadmap en VisCoach-roadmap. Geen tegenstrijdig productdoel of tweede prognosemodel gevonden. De bestaande 1–10-score blijft biologische activiteit-/voedings-/foerageerpotentie; persoonlijke vangstkans, habitat-aanwezigheid, vangbaarheid, tactiek en betrouwbaarheid blijven afzonderlijke responsen/lagen.

### Nieuw gevonden technische voorwaarde voor intervalscoring
De waterThermalEngine beperkt de ankergestuurde weatherSinceAnchor-update tot het expliciete doelmoment. De volledige daggemiddelden/-extremen en noon-gecentreerde 24-/72-uursvensters blijven echter in trend- en fallbackroutes actief. De bestaande tijdstiptest controleert niet dat wijziging van forecasturen ná targetTime de eerdere doeltemperatuur onveranderd laat. Deze strikte as-of-invariant moet worden getest en waar nodig hersteld vóór de tijdpuntuitvoer als intervalscore-input wordt hergebruikt.

### Intervalcontract
Audit §192 legt vast:
- hergebruik van bestaande targetWindowStart/targetWindowEnd, met expliciete opname in PrognosisInputContext;
- geen intervalscore wanneer de eindtijd onbekend is;
- segmentatie over uurlijkse forecaststappen, zesuurs-tijdvakken, middernacht en DST;
- doorlopende thermische toestand vanaf hetzelfde meetanker;
- factorresolutie mag niet fijner worden gemaakt dan de bron;
- duurgewogen segmentbeoordeling met expliciete coverage/uncertainty; geen ontbrekende data als neutraal;
- alternatieven vergelijken bij gelijke duur, soort, stek en forecast-as-of;
- prognose-engine berekent, VisCoach vertaalt; persoonlijke vangstkans blijft apart.

**Werkonderdeel 8 is hiermee afgerond als read-only audit en contractvoorstel.** Er is geen runtimecode, type, scoreformule, gewicht, drempel of gebruikersdata gewijzigd. De strict-as-of-correctie, intervalscore, geïntegreerde score en testimplementatie zijn vervolgwerk en blijven open. Fase 2 blijft niet geaccepteerd; Fase 3 blijft geblokkeerd.


## Werkonderdeel 8 — correctie 8.14: status punt 5 en voorvoer-confidence-gating (22 november 2026)

Read-only hercontrole van prebaitEngine, PrognosisView, VisCoachView en sessionCoachService, naast de bestaande formele audit §§163–170.

- Punt 5 is al formeel afgerond in §170; de confidence-gate is geen open taak. De algemene PrognosisView verbergt exacte campagne- en sessiegrammen bij Matig/Laag. VisCoach verbergt campagnegrammen bij Matig/Laag en sessiegrammen bovendien wanneer sessieduur onbekend is.
- De confidence-status Redelijk vereist een gemeten watertemperatuur, bruikbaar watertype en positieve stekdiepte. Dit is invoercompleetheid, geen biologische validatie van de gramhoeveelheid.
- De bestaande engine-uitvoer/temperatuurbanden/grameffecten zijn door eigenaarbesluit §163 behouden; ze zijn praktische tactiekheuristieken, niet goedgekeurde biologische normen.
- De VisCoach-intake vraagt geen techniek; de optionele hengel-/methodepreset blijft een apart productbesluit.
- De algemene Prognosepagina heeft een zichtbare sessieduurselector met standaard 3 uur. VisCoach laat de eindtijd optioneel en toont geen sessiegrammen zonder expliciet bekende duur, ook al gebruikt de engine intern een technische standaard voor een verborgen sessiehoeveelheid.

**Status:** punt 5 niet heropend; geen code of parameters gewijzigd en geen tests opnieuw uitgevoerd. De actuele volgende technische poort is de strikte targetTime-as-of-invariant uit audit §192.2.


## Werkonderdeel 9 — voortgang 9.1: strikte targetTime-as-of-audit (22 november 2026)

**Type werk:** read-only inspectie van waterThermalEngine.ts en bestaande thermische regressietests.

### Correcte bestaande waarborgen
- Meetankers ná targetTime worden uitgesloten.
- De ankergestuurde weatherSinceAnchor-reeks eindigt op targetTime.
- Bij bekende diepte en voldoende dekking wordt de watertemperatuur chronologisch vanaf hetzelfde meetanker bijgewerkt.
- Forecastpayloads met een as-of na calculatedAt worden geweigerd.

### Resterende afwijking
Dagbrede temperatuur-, wind-, cloud- en stralingsstatistieken worden uit de volledige doeldag berekend; 24-/72-uursvensters zijn aan lokale 12:00 gekoppeld. Deze waarden worden gebruikt in trend-/context en fallbackroutes. Daardoor is de tijdstipuitvoer niet voor alle paden strikt onafhankelijk van weeruren na targetTime.

De bestaande tests controleren een stabiele ankergestuurde reeks en forecast-as-of, maar veranderen geen latere uren terwijl de eerdere uren gelijk blijven. De benodigde metamorfische testmatrix staat in audit §194.4 en omvat meetanker, historisch profiel, weather-only, onbekende diepte, onvoldoende dekking, verschillende doeluren, ontbrekende uren en DST.

**Status:** alleen audit/testontwerp. Geen code of tests gewijzigd of uitgevoerd. Volgende technische stap is test-first implementatie binnen de bestaande waterThermalEngine; daarvoor is een normale codewijzigingsworkflow nodig. Fase 2 blijft open; Fase 3 geblokkeerd.


## Hervattingspunt 24 november 2026 — inhoudelijke beoordeling PR #223

**Leidende opdracht:** volg `READ-FIRST.md`: verbeter de bestaande prognose in de bestaande weergave op basis van `SOORTSPECIFIEKE_SCOREWEGING_PER_VIS.md` en `SOORTSPECIFIEKE_SCORE_WEGING.md`. Geen parallelle prognose-engine, geen nieuwe product-/UI-functie als vervanging van modelwerk en geen ongefundeerde gewichten.

### Actuele repository- en PR-status

- `main` staat op `13d1f87d67c18f29ac8a94ea6ecbdd8cedfabe37`.
- PR [#223](https://github.com/sennzor-wq/Vislogboek/pull/223) staat open, is niet gemerged en heeft head `5cb00c30c761e4bfe1ed229cf70aab875dc7b726` op `feat/fase2-prognosis-evidence-flow`.
- De PR bevat 9 gewijzigde bestanden en 25 commits. De actuele GitHub Quality Gate is geslaagd: run [#1245](https://github.com/sennzor-wq/Vislogboek/actions/runs/45369232513) op de genoemde head. Dit bewijst technische regressiecontrole, geen biologische juistheid of voorspellende nauwkeurigheid.
- Er is geen toestemming om PR #223 te mergen.

### Inhoudelijke beoordeling PR #223

1. **Evidence en modelgrenzen:** de PR trekt de eerdere niet-onderbouwde percentages terecht in. Fysiologische activiteit, voedings-/foerageerrespons, lokale aanwezigheid/habitat en empirische vangkans blijven verschillende uitkomsten. De nieuwe meervalbron is als niet-goedgekeurd voor voorspelling geregistreerd.
2. **Bestaande dagscore:** de dagaggregatie gebruikt nu een expliciete helper en toont bij ontbrekende tijdvakken geen fictieve 5,0 meer; de beschikbaarheidsvlag blijft leidend en de verborgen compatibiliteitswaarde is 0. De vier huidige tijdvakken zijn echter ieder vast 360 minuten, waardoor de productie-aanroep bij volledige dekking nog steeds rekenkundig gelijk is aan het gemiddelde van vier tijdvakscores. De test met ongelijke segmentduren test de helper, niet een echte variabele interval-/dagsegmentatie.
3. **Voedingsrespons:** `feedingActivity` is een afzonderlijke evidence-assessment met `score: null` en `predictionEligible: false`. De broninventaris wordt dus niet als numerieke voedingsrespons gebruikt en verandert de bestaande fysiologische score niet. De assessment is op dit moment bron-/soortgebonden, niet een berekende dag- of tijdvakrespons op de weersomstandigheden.
4. **Scopepunt:** de PR voegt een nieuwe voedingskaart toe aan `PrognosisView` voordat een kwantitatieve responsfunctie is gevalideerd. Dit is geen verbetering van de bestaande 1–10-score en botst met de werkvoorraadregel dat geen nieuwe UI-/productfunctie wordt toegevoegd voordat de kandidaatlogica inhoudelijk en technisch is gevalideerd. Behandel deze kaart daarom als niet-geaccepteerd onderdeel; niet als afgeronde prognosefunctionaliteit.
5. **Conclusie:** de evidence-documentatie en het expliciet onbekend houden van niet-gevalideerde voedingsrespons zijn inhoudelijk nuttig. PR #223 levert nog geen soortspecifieke factorweging of extra gevalideerde bijdrage aan de bestaande numerieke prognose. De PR is technisch groen, maar de nieuwe UI-kaart is een open scopepunt en de PR mag niet als voltooiing van de hoofdopdracht worden beschouwd.

### Eerstvolgende hoofdtaak

Het soortspecifieke wegingsvoorstel is uitgewerkt in SOORTSPECIFIEKE_SCOREWEGING_PER_VIS.md §16. Het is een inhoudelijk uitgangspunt, geen goedgekeurde runtime-configuratie. De numerieke fysiologische index behoudt voorlopig temperatuur als enige actieve factor; voedingsresponsen krijgen per soort een onderzoekprioriteit maar nog geen arbitrair percentage. Aanwezigheid/habitat en empirische vangkans blijven gescheiden.

**Volgende stap:** eigenaarreview van §16. Na inhoudelijk akkoord volgt één samenhangende runtime-implementatie van de toegelaten responsfuncties in de bestaande engine. Tot die tijd blijven bestaande scoreberekening en UI ongewijzigd.

## Werkonderdeel 10 — soortspecifiek wegingsvoorstel V0.1 (24 november 2026)

**Status:** voorstel uitgewerkt; wacht op inhoudelijke eigenaarreview. Geen runtimecode, scores, gewichten of UI gewijzigd in dit werkonderdeel.

- De huidige fysiologische 1–10-score is expliciet afgebakend als thermische/fysiologische potentie. Temperatuur blijft voorlopig de enige actieve factor (1,00 normalisatie); de bewijsstatus verschilt per soort.
- Aerobe-scopegegevens bij baars en snoekbaars zijn onderscheiden van metabolismegegevens bij karper, brasem, snoek en blankvoorn. Metabolisme is niet als directe meting van activiteit aangemerkt.
- Voor voedingsrespons is per soort een eerste parameterprioriteit vastgelegd. Voedselopname, maagvulling, voedingsritme, foerageergedrag, dieet en prooikeuze blijven gescheiden.
- Zuurstof is alleen een mogelijke limiter bij passende lokale invoer en drempelrespons; licht/seizoen zijn conditionele voedingsmodulatoren; wind, druk, neerslag, bewolking, stroming en prooiaanbod krijgen geen zelfstandige numerieke bonus zonder passende responsdata.
- De matrix kent bewust nog geen numerieke voedingspercentages toe: de huidige bronnen meten niet dezelfde responsvariabele of context en leveren geen vergelijkbare effectgroottes. Een percentage zou schijnprecisie zijn.
- De inhoudelijke onderbouwing en soorttabellen staan in SOORTSPECIFIEKE_SCOREWEGING_PER_VIS.md §16; de algemene toelatingscriteria blijven in SOORTSPECIFIEKE_SCORE_WEGING.md.

**Acceptatie:** soort-/uitkomstrollen en grenzen vastgelegd; geen willekeurige getallen toegevoegd; geen runtimewijziging gedaan voordat de eigenaar het voorstel heeft beoordeeld.

**Hervatpunt:** eigenaarreview van §16. Na akkoord: de toegelaten responsfuncties implementeren in de bestaande prognose-engine, met tests voor alle soorten, dag-/tijdvakpariteit, ontbrekende invoer en de bestaande targetTime-as-of-invariant.

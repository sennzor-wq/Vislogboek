# Fase 2 — audit bestaande biologische prognose

**Status:** eerste code-audit uitgevoerd; factorinventarisatie en UI-/test-traceerbaarheid lopen nog  
**Peildatum:** 16 november 2026  
**Branch:** `main`  
**Commit bij start:** `dd1238e3139fa048fe808c399282a5b1fe1fda12`  
**Doel:** de bestaande prognose- en deel-engines in kaart brengen voordat biologische modelwijzigingen worden voorgesteld.

> Dit document registreert wat in de code aantoonbaar aanwezig is. Een modelparameter in code is niet automatisch biologisch gevalideerd. Deze eerste audit wijzigt geen app-code, geen modeluitvoer en geen gebruikersgegevens.

## 1. Eerste bevestigde bevindingen

### 1.1 Activiteitsindex

Bestand: `src/services/prognosisEngine.ts`, in het bijzonder de tijdvakberekening rond de temperatuur- en factoranalyse.

- De huidige biologische activiteitsindex wordt uitsluitend numeriek beïnvloed door de soortspecifieke thermische efficiëntie.
- De thermische efficiëntie komt uit `calculateThermalEfficiency()` in `src/services/fishProfiles.ts`: een begrensde, asymmetrische Gaussische respons op basis van `thermalOptimum`, `thermalWidthCold` en `thermalWidthWarm`.
- De actuele score wordt berekend als `1 + 9 × thermalEfficiency^0.85`, begrensd op 1–10.
- Wanneer watertemperatuur ontbreekt, wordt intern een placeholder van 0,5 gebruikt voor de tussenberekening. De factor zelf wordt als niet beschikbaar weergegeven en de conclusie zegt expliciet dat de activiteitsindex niet betrouwbaar te bepalen is. Nog te controleren: of alle UI-uitvoer en opgeslagen snapshots deze onzekerheid consequent respecteren en nergens de placeholder als een echte prognose presenteren.
- De code maakt onderscheid tussen echte gemeten watertemperatuur en een geschatte watertemperatuur. Luchttemperatuur wordt niet als vervanging voor watertemperatuur gebruikt.

### 1.2 Soortprofielen

Bestand: `src/services/fishProfiles.ts`.

Er zijn negen concrete vissoorten (Karper, Brasem, Snoek, Baars, Voorn, Zeelt, Snoekbaars, Meerval en Roofblei) plus het generieke terugvalprofiel Overig.

De profielen bevatten onder meer:
- thermische optimum- en breedteparameters;
- voorkeursperioden en een schemernotitie;
- voorlopige windrichtingsvoorkeuren en winddrempels;
- luchtdruksensitiviteit en een drukbereik;
- regen- en bewolkingsvoorkeur;
- relatieve seizoensgewichten.

De code documenteert zelf dat de numerieke thermische modelinstellingen voorlopig zijn en dat de bronnen de biologische context ondersteunen, maar niet automatisch de exacte numerieke parameters. Verschillende velden zijn expliciet heuristisch of voorlopig. De profielen zijn daarom een nuttige biologische basisstructuur, maar geen bewijs dat de numerieke responscurves al per soort empirisch zijn vastgesteld.

### 1.3 Factoren die nu alleen context zijn

In `prognosisEngine.ts` worden luchtdruk, wind, seizoen, tijdstip/licht, bewolking en neerslag als uitlegbare context getoond. Hun numerieke factorbijdrage aan de activiteitsindex is momenteel nul. De code licht toe dat de relaties onvoldoende soort-, levensstadium- en watertype-specifiek gevalideerd zijn.

Dit is een bewuste beperking om ongefundeerde bonus-/malusfactoren te vermijden; het betekent niet dat deze omstandigheden biologisch irrelevant zijn. De vervolg-audit moet per factor bepalen of deze hoort bij:
1. totale activiteit/voedingsactiviteit;
2. habitatkeuze of lokale verplaatsing;
3. praktische visbaarheid/visserijomstandigheden;
4. alleen beschrijvende context;
5. bewust buiten het model.

### 1.4 Bestaande deel-engines

- `waterThermalEngine.ts`: combineert actuele of recente echte watertemperatuurmetingen, historische watertemperatuurprofielen en weersontwikkeling. De code houdt bronstatus, meettijdstip, weersdekking en onzekerheid bij. Bij onvoldoende uurdata kan alleen een recent meetanker of historisch profiel worden teruggegeven; zonder bruikbare basis blijft de temperatuur onbekend.
- `waterTemperatureHistory.ts`: verzamelt echte watertemperatuurwaarnemingen uit sessies en prognosesnapshots en bouwt een locatie-/seizoensprofiel.
- `habitatMovementEngine.ts`: aparte ruimtelijke analyse die onder meer stek/habitat, waterthermiek, oeverwind, wind, druktrend, bewolking, aanwezigheidwaarnemingen en historische sessies kan gebruiken. Dit is conceptueel gescheiden van de totale activiteitsindex.
- `bankWindEngine.ts` en `rodPositioningEngine.ts`: bestaande ruimtelijke/wind- en positioneringsanalyse; deze moeten in de factor-/datastroommatrix worden gevolgd, niet opnieuw worden gebouwd.
- `evaluationEngine.ts`: gebruikt onveranderlijke prognosesnapshots en afgeronde, gekoppelde sessie-uitkomsten. Per sessie/doelsoort telt de vroegste voorspelling mee; de Brier Skill Score gebruikt een chronologische rolling baseline met alleen eerdere uitkomsten van dezelfde doelsoort. De huidige rapportage vereist minimaal vijf geëvalueerde sessies voor de Brier-score en minimaal vijf eerdere trainingsuitkomsten per testvoorspelling voor de baseline. Dit zijn softwarematige minimumdrempels, geen garantie voor statistische robuustheid.

## 2. Eerste risicopunten en open vragen

1. **Score bij ontbrekende watertemperatuur:** verifieer de volledige keten van berekende tijdvakscore naar UI, prognosesnapshot, export en evaluatie. De interne placeholder mag niet als betrouwbare activiteitsscore worden gelezen.
2. **Herkomst thermische parameters:** koppel per soort de optimum-/breedtewaarden aan bronnen die daadwerkelijk activiteit, voedselopname, metabolisme of fysiologische respons onderzoeken. Groei- of aquacultuurdata mogen niet zonder overdraagbaarheidsargument worden gebruikt als directe vangst-/activiteitscurve.
3. **Tijdsafhankelijkheid:** controleer of huidige thermiek alleen de doeldag-/tijdvaktemperatuur gebruikt en waar voorafgaande 24/72-uursontwikkeling, opwarm-/afkoelsnelheid en eventuele vertraging worden verwerkt.
4. **Seizoen en tijdstip:** profielvelden bestaan, maar tellen niet mee in de activiteitsindex. Bepaal of betrouwbare soortspecifieke veldliteratuur een afzonderlijke bijdrage ondersteunt, rekening houdend met overlap met watertemperatuur en daglengte.
5. **Wind en habitat:** onderzoek de overdracht van `bankWindEngine` naar `habitatMovementEngine` en UI. Windrichting mag niet zonder lokale oever-/geometriecontext als generieke activiteitsbonus worden gebruikt.
6. **Luchtdruk:** de huidige score kent geen drukbonus. Beoordeel eerst of er bewijs is voor een onafhankelijk, reproduceerbaar effect nadat frontpassage, wind, temperatuur en seizoen zijn onderscheiden.
7. **Neerslag/bewolking/licht:** onderscheid effecten op zicht, prooibeschikbaarheid, verstoring en habitat van effecten op totale voedingsactiviteit.
8. **Evaluatiedata:** controleer aantallen en kwaliteit van echte, onafhankelijke sessies per soort, seizoen, watertype en locatie. Met een kleine of scheve dataset mogen geen modelgewichten worden geleerd.

## 3. Vervolg van de audit

- Maak de volledige factorinventaris uit de goedgekeurde blueprint en koppel iedere factor aan code, UI, dataherkomst, onzekerheid en tests.
- Volg de prognoseketen van `calculateDayPrognosis` tot UI en opgeslagen snapshot.
- Volg de habitat-/windketen afzonderlijk.
- Controleer de testdekking voor gemeten, geschatte en onbekende watertemperatuur, soorten, tijdvakken, seizoenen en ontbrekende weersvelden.
- Bepaal welke echte sessies beschikbaar zijn voor chronologische backtests; rapporteer aantallen en beperkingen.
- Pas pas na deze audit een modelvoorstel toe. Eerst een toetsbare hypothese en baseline, daarna pas code.

## 4. Afbakening

Deze eerste audit is read-only. Er zijn geen numerieke gewichten gewijzigd, geen nieuwe prognose-engine toegevoegd, geen bestaande factor geactiveerd en geen sessie-/vangstgegevens aangepast.


## 5. Ontwerpdoel — soortspecifiek biologisch voorspellingsmodel

**Status:** richtinggevend ontwerp, nog niet geïmplementeerd of biologisch gevalideerd  
**Vastgelegd:** 16 november 2026  
**Besluit producteigenaar:** dit ontwerp is het doel voor fase 2; de technische uitwerking moet de bestaande engines hergebruiken.

### 5.1 Wat het model uiteindelijk moet voorspellen

Vislogboek moet niet één ongedifferentieerde score maken van alle invloeden. Het model moet drie biologisch verschillende vragen beantwoorden:

1. **Activiteit:** hoe waarschijnlijk is het dat de soort in het betreffende tijdvak actief is?
2. **Voedselactiviteit:** hoe waarschijnlijk is actief foerageren/voedsel zoeken, onderscheiden van alleen bewegen of fysiologisch actief zijn?
3. **Habitat en locatie:** in welke diepte-, oever-, bodem-, structuur- of waterzone is de soort onder de omstandigheden waarschijnlijker aanwezig?

Deze uitkomsten mogen elkaar beïnvloeden, maar blijven afzonderlijk uitlegbaar. Een vis kan actief zijn zonder op de gekozen stek te liggen; een vis kan aanwezig zijn zonder op dat moment te azen.

Een eventuele **vangstverwachting** is een volgende, aparte vertaling. Die moet ook rekening houden met sessieduur, vistechniek, presentatie, aas/voer, bereikbaarheid en inspanning. Een biologische activiteitsindex is niet hetzelfde als een vangstkans.

### 5.2 De zeven factorfamilies uit het illustratieve voorbeeld

De eerder besproken verdeling is uitsluitend een conceptueel voorbeeld. De percentages zijn nadrukkelijk geen vastgestelde biologische waarheden, geen startgewichten en geen opdracht om de score tot een gewogen som te reduceren.

| Factorfamilie | Voorbeelden van relevante invoer | Mogelijke biologische rol |
|---|---|---|
| Watertemperatuur en temperatuurverloop | actuele gemeten/geschatte temperatuur, thermische historie, opwarming/afkoeling, diepte en thermische vertraging | metabolisme, thermische voorkeur, activiteit en voedselopname |
| Wind en waterbeweging | richting, snelheid, duur, windfetch, oeveroriëntatie, golfslag, menging en eventuele stroming | lokale waterverdeling, voedseltransport, menging/zuurstof en habitatkeuze |
| Seizoen en levenscyclus | dag van het jaar, fotoperiode, voortplantingsperiode, overwintering en soort-/levensfase | seizoensritme, energiebehoefte, verspreiding en gedrag |
| Licht en dag-/nachtritme | zonsopkomst/-ondergang, schemering, daglengte, bewolking en lichtverandering | zicht, predatierisico, foerageervensters en activiteitstijd |
| Luchtdruk en drukverandering | absolute druk, trend, snelheid van verandering en passage van weersystemen | mogelijk indirecte weers-/gedragscontext; zelfstandig effect eerst aantonen |
| Neerslag en weersverandering | hoeveelheid, duur, timing, temperatuur van neerslag en gekoppelde frontpassage | troebelheid, afstroming, verstoring, voedselbeschikbaarheid en lokale omstandigheden |
| Zuurstof, stroming en overige watercondities | gemeten zuurstof indien beschikbaar, waterverversing, diepte, watertype, vegetatie, bodem en structuur | fysiologische geschiktheid en soortspecifieke habitatgeschiktheid |

De factorfamilies zijn een inventaris, geen garantie dat elke invoer beschikbaar is of in elke soortscore hoort. Een niet gemeten zuurstofwaarde mag bijvoorbeeld niet uit alleen temperatuur of wind als feit worden afgeleid.

**Besproken illustratieve verdeling (karper als voorbeeld, uitsluitend conceptueel):** watertemperatuur/verloop 30%; wind/waterbeweging 17%; seizoen/levenscyclus 15%; licht/dag-nachtritme 12%; luchtdruk/verandering 8%; neerslag/weersverandering 8%; zuurstof/stroming/overige watercondities 10%. Dit telt op tot 100% als denkkader, maar is nadrukkelijk géén gevalideerde weging, géén codeparameter en géén voorgeschreven lineaire formule. Andere soorten krijgen niet automatisch dezelfde verdeling. De uiteindelijke modelvorm en invloed per soort worden pas na bronbeoordeling en backtesting bepaald.

### 5.3 Soortspecifieke biologische profielen

Iedere doelsoort krijgt een eigen responsprofiel. Dezelfde factor kan per soort een andere richting, sterkte, drempel, tijdsvertraging of habitatbetekenis hebben. Het profiel moet waar bewijs beschikbaar is rekening houden met:

- thermische respons: optimum, tolerantie, asymmetrie en acclimatisatie;
- activiteit versus foerageren: soortspecifieke dag-/nacht-/schemervensters en voedselzoekgedrag;
- seizoen en levenscyclus: voortplanting, overwintering, migratie/verplaatsing en seizoensgebonden energiebehoefte;
- habitat: waterdiepte, bodem, vegetatie, structuur, stroming, watertype en beschutting;
- weersrespons: wind, menging, licht, neerslag en druk als afzonderlijke hypotheses, niet als universele regels;
- waar verantwoord: levensfase, grootteklasse en relevante ecologische verschillen.

Een profielveld krijgt een bewijsstatus en bronverwijzing. We onderscheiden minimaal: goed onderbouwde biologische relatie, indirect bewijs met overdraagbaarheidsargument, lokale empirische aanwijzing, voorlopige hypothese en onbekend. Een bron over groei of aquacultuur bewijst niet automatisch een vangst- of foerageercurve in vrij levend water.

### 5.4 Modelarchitectuur: meerdere lagen, geen universele procentensom

De beoogde architectuur bestaat uit samenwerkende, maar gescheiden lagen:

1. **Omgevingslaag:** normaliseert metingen, weersverwachtingen, locatiekenmerken en tijdreeksen. Elke waarde houdt bron, meet-/schattingsstatus, tijdstip, ruimtelijke toepasbaarheid en onzekerheid.
2. **Biologische responslaag:** vertaalt omstandigheden via het profiel van de gekozen soort naar thermische geschiktheid, tijd-/seizoensrespons en andere onderbouwde reacties.
3. **Activiteits-/foerageerlaag:** schat activiteit en voedselzoekgedrag afzonderlijk. Interacties en drempels zijn toegestaan wanneer biologisch aannemelijk en toetsbaar; eenvoudige optelling is niet verplicht.
4. **Habitat-/bewegingslaag:** schat waar de soort zich onder die omstandigheden kan concentreren. Hergebruik hiervoor de bestaande habitat-, wind- en positioneringsengines; geen tweede parallelle ruimtelijke engine.
5. **Lokale leerlaag:** verfijnt alleen met voldoende vergelijkbare, echte waarnemingen van dezelfde stek/soort en met chronologische scheiding tussen leren en toetsen. Dit is de latere koppeling met fase 3; fase 2 moet de invoer en grenzen daarvoor definiëren.
6. **Betrouwbaarheidslaag:** rapporteert datadekking, bronkwaliteit, steekproefomvang en onzekerheid. Onbekend blijft onbekend; een ontbrekende factor wordt niet stilzwijgend als neutraal of gemiddeld behandeld.

De uiteindelijke prognose combineert deze uitkomsten transparant. De precieze wiskundige vorm (gewogen score, responsfuncties, interacties of een hybride model) wordt pas gekozen na de factorinventaris, literatuurbeoordeling, code-/datatrace en baselinevalidatie.

### 5.5 Bewijs- en kalibratieregels

- Begin met biologisch verdedigbare responsfuncties en expliciete onzekerheidsmarges; leer niet blind alle gewichten uit vangstdata.
- Een parameter is niet gevalideerd omdat hij in code staat of omdat een literatuurbron een verwant biologisch proces beschrijft.
- Test per soort en relevante context. Deel informatie tussen soorten alleen wanneer een gedeelde fysiologische of ecologische basis dat rechtvaardigt.
- Onderzoek interacties, confounding en tijdsvertraging. Voorbeelden: wind × oeveroriëntatie × diepte; temperatuur × voorafgaande 24/72-uursverandering; licht × seizoen; drukverandering × frontpassage.
- Houd ontbrekende invoer, schattingen en echte metingen gescheiden. Lokale watertemperatuurmetingen mogen de thermische schatting voor komende dagen ankeren, met toenemende onzekerheid naarmate de tijd verstrijkt.
- Gebruik chronologische backtests en vergelijk altijd met de huidige baseline en een eenvoudige referentievoorspelling. Geen toekomstige sessie-informatie in een historische voorspelling.
- Rapporteer uitkomsten per soort en, waar de data dit toelaten, per seizoen, watertype en locatie. Kleine of scheve steekproeven leveren geen harde soortgewichten op.
- Bewaar modelversie en gebruikte input in de onveranderlijke prognosesnapshot, zodat oude prognoses reproduceerbaar blijven.

### 5.6 Grenzen en niet-doelen

- Geen universele karpergewichten kopiëren naar andere soorten.
- Geen vaste 100%-weging implementeren alleen omdat een voorbeeldtabel optelt tot 100%.
- Geen luchtdruk-, wind-, regen-, bewolkings- of zuurstofbonus activeren zonder bewijs en tests.
- Geen vangstkans rechtstreeks afleiden uit een biologische activiteitsindex.
- Geen nieuwe engine bouwen voordat de bestaande engineketen volledig is gevolgd.
- Geen modelclaim baseren op synthetische benchmarks of alleen softwaretests.

### 5.7 Concrete audit- en bouwvolgorde

1. Maak de factor → hypothese → soort → tijdschaal → databron → code → UI → snapshot → testmatrix compleet.
2. Volg alle UI-ingangen en opslagpaden van de prognose, inclusief ontbrekende, geschatte en gemeten watertemperatuur.
3. Volg de habitat-/wind-/positioneringsketen en bepaal welke bestaande uitkomsten herbruikbaar zijn.
4. Inventariseer per soort de huidige profielvelden, bronkwaliteit en ontbrekende biologische kenmerken.
5. Controleer tests en bepaal welke echte, onafhankelijke sessiegegevens op dit moment beschikbaar zijn. De lokale database van het apparaat is niet vanuit de repository-audit uitleesbaar; de clean-startafspraak betekent bovendien dat nieuwe persoonlijke waarnemingen vanaf nul moeten worden verzameld.
6. Stel pas daarna een modelbaseline en toetsbare kandidaat-respons voor. Implementatie volgt pas na review van aannames, tests en evaluatieplan.

**Fase 2 blijft in audit.** Dit ontwerp is door de producteigenaar opgedragen als doelrichting, maar is nog niet geïmplementeerd, gevalideerd of geaccepteerd als voorspellend model.


## 6. Tweede auditronde — prognoseketen, UI, snapshots en tests

**Peildatum:** 16 november 2026  
**Scope:** read-only inspectie van `PrognosisView.tsx`, `prognosisEngine.ts`, `types/index.ts`, `waterThermalEngine.ts`, `waterTemperatureHistory.ts`, `habitatMovementEngine.ts`, `bankWindEngine.ts`, `rodPositioningEngine.ts`, `evaluationEngine.ts` en bestaande prognose-/habitat-tests.

### 6.1 Bevestigde gegevensstroom

1. `src/components/prognosis/PrognosisView.tsx` haalt uurweersdata op en berekent een horizon van vandaag plus zeven dagen.
2. De view verzamelt historische watertemperatuurwaarnemingen uit sessies en snapshots, haalt lokale temperatuurkalibratie op en geeft soort, locatie, sessieduur, aanwezigheid, vangsten en voorvoercontext door aan `calculateDayPrognosis()`.
3. `prognosisEngine.ts` analyseert tijdvakken en gebruikt `waterThermalEngine.ts` voor gemeten/geschatte watertemperatuur. De thermische respons is de enige huidige numerieke bijdrage aan de biologische activiteitsscore.
4. De view toont bij ontbrekende thermische basisgegevens expliciet `N/B` in dag-, tijdvak- en activiteitsoverzichten. De conclusie meldt dat de score en beste vistijd niet betrouwbaar te bepalen zijn.
5. `savePrognosisSnapshot()` bewaart de volledige prognose-uitvoer, weersinvoer, inputcontext en fingerprint. Als de activiteitsindex niet beschikbaar is, wordt `predictedActivityScore` als `null` opgeslagen en wordt de beschikbaarheidsstatus expliciet bewaard. De persoonlijke vangstkans blijft eveneens `null` als er onvoldoende geldige eigen sessiegegevens zijn.
6. De evaluatie-engine gebruikt vooraf vastgelegde snapshots en afgeronde gekoppelde sessies. Per sessie en doelsoort telt alleen de vroegste voorspelling. De rolling baseline gebruikt uitsluitend eerdere uitkomsten van dezelfde doelsoort.

### 6.2 Belangrijke nuance: activiteit en persoonlijke vangstkans

De huidige persoonlijke vangstkans is een aparte Poisson-blootstellingsberekening op basis van eigen vangsten per geregistreerd visuur en geplande sessieduur. Als er voldoende sessies zijn, wordt het historische vangsttempo momenteel nog licht gemoduleerd met de dagactiviteitsscore via `actFactor = 0.88 + (dayScore / 10) × 0.24`.

Dat is een bestaande koppeling tussen biologische activiteit en persoonlijke vangstverwachting; het is geen bewijs dat de huidige activiteitsscore biologisch volledig is. In de toekomstige architectuur moet deze relatie expliciet worden getoetst en gekalibreerd, zodat activiteit, foerageren, habitat en vangbaarheid niet ongemerkt in elkaar overlopen.

### 6.3 Ontbrekende temperatuur: veilige UI, maar één tekstuele inconsistentie

De onderzochte UI en snapshotopslag respecteren `activityScoreAvailable`: bij ontbrekende temperatuur wordt `N/B` getoond en `predictedActivityScore` als `null` opgeslagen. Ook tests controleren dat zonder bruikbare thermische basis geen activiteitsscore of persoonlijke vangstkans als geldig wordt gepresenteerd.

De tekstuele inconsistentie is in dezelfde auditwerkstroom gecorrigeerd: wanneer zowel meting als schatting ontbreekt, zegt de onzekerheidsnotitie nu expliciet dat de biologische activiteitsindex niet beschikbaar is en dat luchttemperatuur geen vervanging is. In `test-core-logic.ts` zijn gerichte assertions toegevoegd voor de beschikbaarheidsvlag en de juiste tekst. De wijziging verandert geen score, invoer of prognosegedrag. De aangepaste test is nog niet uitgevoerd; de correctie is dus geïmplementeerd maar nog niet softwarematig gevalideerd.

### 6.4 Wat bestaande tests al afdekken

- `test-thermal-and-prognosis.ts`: thermische traagheid, voorafgaande 24/72-uursontwikkeling, zon/bewolking, warme dagen/koude nachten, afkoeling, diepteverschillen, gemeten versus geschatte watertemperatuur, ontbrekende weerdata en onvoldoende persoonlijke sessiehistorie.
- `test-advanced-prognosis-modules.ts`: oeveroriëntatie en windrelatie, wind-/werpadvies, habitatzones, seizoens-/temperatuurcontext, directe viswaarnemingen, ontbrekende locatiegegevens en integratie in de dagprognose.
- `evaluationEngine.ts`: chronologische rolling baseline, minimumaantallen, uitsluiten van onvolledige/ongeldige sessies en evaluatie per doelsoort.

Deze testfixtures zijn synthetische softwaretests. Zij bewijzen dat de huidige codepaden en veiligheidsregels functioneren, niet dat een biologische respons of voorspelling in echte vissessies nauwkeurig is.

### 6.5 Factor-/datadekking: eerste status

| Factorfamilie | Huidige data/codebasis | Huidige rol in activiteitsscore | Open auditpunt |
|---|---|---|---|
| Watertemperatuur en verloop | Thermische engine, lokale metingen, historische locatie-/seizoensprofielen, uurweer, diepte en stralings-/windmengingcontext | **Actief; enige numerieke bijdrage** | Soortparameters, lag, trendfeatures en onzekerheid wetenschappelijk onderbouwen en toetsen |
| Wind en waterbeweging | Uurwind, richting, oeveroriëntatie, bankWind- en habitat-/positioneringsanalyse | Geen activiteitsscore; wel ruimtelijke/praktische context | Scheid windgedreven habitatverplaatsing, menging en vangbaarheid; controleer lokale geometrie en tijdsduur |
| Seizoen en levenscyclus | Kalenderseizoen en voorlopige soortprofielvelden; habitatengine gebruikt seizoen | Geen activiteitsscore; habitatcontext | Fotoperiode, voortplanting en levensfase ontbreken als volwaardige, onderbouwde soortrespons |
| Licht en dag-/nachtritme | Tijdvakken, schemernotities en bewolkings-/zonnestralingscontext in thermische analyse | Geen activiteitsscore | Scheid lichtregime van kalenderseizoen en temperatuur; toets soortspecifieke vensters |
| Luchtdruk en verandering | Uurdruk en 12-uurs trend | Geen activiteitsscore; beschrijvende context | Alleen opnemen als onafhankelijk effect aantoonbaar is na controle voor frontsituatie en andere covariaten |
| Neerslag en weersverandering | Uurneerslag en bewolking | Geen activiteitsscore; beschrijvende context | Neerslag, afstroming, troebelheid en frontpassage uit elkaar halen; huidige profielvoorkeuren zijn heuristisch |
| Zuurstof, stroming en overige watercondities | Watertype (o.a. rivier/kanaal) en habitat-/dieptekenmerken; geen directe opgeloste-zuurstofmeting aangetoond in deze prognoseketen | Geen activiteitsscore | Geen zuurstofwaarde afleiden zonder meting of expliciet gevalideerde proxy; stroming en habitatdata verfijnen |

### 6.6 Beschikbare echte validatiedata

De repository bevat testfixtures en code voor sessie-/vangsthistorie, maar de persoonlijke IndexedDB op het apparaat kan niet via deze GitHub-audit worden uitgelezen. De afgesproken clean start betekent dat de nieuwe persoonlijke meetreeks vanaf nul moet worden opgebouwd. Er kan daarom in deze audit geen actuele steekproefomvang per soort, seizoen of stek worden geclaimd. De bestaande evaluatie-engine kan later echte vooraf opgeslagen prognoses en gekoppelde sessies chronologisch toetsen; de minimale softwaredrempel van vijf sessies is geen garantie voor voldoende statistische power.

### 6.7 Volgende concrete auditacties

1. Controleer alle soortenprofielen systematisch (10 profielvermeldingen inclusief `Overig`) op parameterherkomst, biologische betekenis en ontbrekende eigenschappen; corrigeer de bron-/bewijsstatus, niet willekeurig de waarden.
2. Traceer thermische input en de 24/72-uurs tijdreeks tot de precieze features die per tijdvak worden gebruikt; onderzoek vertraging en mogelijke dubbeltelling van seizoen/licht.
3. Traceer de aanroepen en overdracht tussen bankWind-, habitatMovement- en rodPositioning-engine; bepaal welke ruimtelijke uitkomsten in de UI en snapshots terechtkomen.
4. Maak tests voor de tekstuele inconsistentie bij ontbrekende temperatuur en controleer dat alle onbeschikbare invoerstatussen in snapshots behouden blijven.
5. Definieer een nulbaseline en evaluatieprotocol voor activiteit, voedselzoekgedrag, habitatvoorspelling en vangstkans afzonderlijk.

**Status:** de gegevensstroom is deels getraceerd en de eerste factor-/datadekking staat hierboven. De volledige bronbeoordeling per soort, alle UI-/snapshotdetails van de habitatketen en het kandidaatmodel zijn nog open. Fase 2 blijft in audit; geen modelgewichten of prognosegedrag gewijzigd.


## 7. Eerste literatuur- en bewijsinventaris per soort

**Status:** gerichte literatuurverkenning; geen systematische review en geen modelparameter-validatie. De studies hieronder ondersteunen specifieke biologische relaties, maar hun populaties, levensfasen, watertypen en meetuitkomsten verschillen. Ze mogen niet rechtstreeks worden omgezet naar universele vangstpercentages of thermische gewichten.

### 7.1 Eerste relevante bronnen en overdraagbaarheidsgrenzen

| Soort | Relevante bron(nen) | Wat de bron ondersteunt | Wat de bron niet bewijst |
|---|---|---|---|
| Karper | [Chen et al. (2012), temperatuur en voedingsritme](https://doi.org/10.1016/S1006-8104(12)60039-7); [Oyugi et al. (2012), temperatuur en foerageergedrag van juvenielen](https://doi.org/10.1016/j.jtherbio.2011.11.005) | Temperatuur hangt samen met voedingshoeveelheid en dagelijkse voedingspieken; de pieken en respons veranderen bij koudere temperaturen | Geen directe vangstkans voor volwassen karper in Nederlandse buitenwateren; de juvenielenstudie is geen volwassen veldpopulatie |
| Brasem | [Vašek & Kubečka (2004), in-situ zoöplanktonconsumptie](https://nas.er.usgs.gov/queries/references/ReferenceViewer.aspx?refnum=35171); [Jurajda et al. (2018), winteractiviteit in reservoir](https://doi.org/10.1111/fme.12275); [Cittadino et al. (2026), seizoensbeweging in verbonden wetland](https://doi.org/10.1007/s10750-026-06142-x) | Directe maagvullings-/consumptiedata tonen overdag hogere zoöplanktonopname bij subadulten/volwassen planktoneters; andere leeftijds-/habitatcontexten kunnen nachtelijke opname geven. Winter- en habitatstudies voegen ruimtelijke context toe | Geen universeel dagritme; dieet, lengteklasse, seizoen, helderheid en habitat zijn bepalend |
| Snoek | [Lucas et al. (1991), directe hartslagtelemetrie van wilde snoek](https://doi.org/10.1111/j.1095-8649.1991.tb04366.x); [Filleul & Le Louarn (1998), voedingsritme van 0+ snoek](https://doi.org/10.1051/limn/1998001); [Nolan et al. (2025), laaglandrivierbeweging](https://doi.org/10.1007/s10750-024-05533-2) | Hartslagtelemetrie registreerde dat wilde snoek kleine prooien overdag ving; de daaropvolgende verteringsactiviteit liep door in middag en nacht. Jonge 0+ snoek vertoonde diurnale predatie en een bifasisch ritme in de planktonfase. Laaglandrivieronderzoek beschrijft daarnaast habitatbeweging | Voedingsritme bij 0+ snoek is niet overdraagbaar op volwassen snoek; de hartslagstudie betrof slechts twee vissen en specifieke prooicondities. Beweging blijft een aparte respons |
| Baars | [Rask (1986), veldonderzoek naar dagritme en dieet](https://urn.fi/URN:NBN:fi-fe201705296927); [Fedorova & Drozzhina (1982), Ladogameer](https://app.eurekamag.com/research/005/090/005090190.php); [Frontiers-studie (2021), pelagische herfstvoeding](https://doi.org/10.3389/fenvs.2021.670125); [Jacobsen et al. (2002/2015), telemetrie en meervergelijking](https://doi.org/10.1111/jfb.12613) | Directe maaginhoud-/voedingsstudies tonen water- en prooigebonden verschillen; de Ladoga-studie vond meer twilight feeding, terwijl de Finse en Bodenmeer-studies andere seizoens-/habitatpatronen laten zien | Geen vaste universele voorkeursuren; prooigemeenschap, seizoen, pelagisch/littoraal habitat en helderheid beïnvloeden de uitkomst |
| Voorn (blankvoorn) | [Jamet et al. (1990), leeftijdsafhankelijke voedingscyclus](https://doi.org/10.1127/archiv-hydrobiol/118/1990/371); [Vašek & Kubečka (2004), in-situ zoöplanktonconsumptie](https://nas.er.usgs.gov/queries/references/ReferenceViewer.aspx?refnum=35171); [roach feeding shift (2008)](https://doi.org/10.1111/j.1095-8649.2008.02020.x) | Meerdere directe maaginhoud-/voedselopnamestudies tonen leeftijds-, seizoen- en dieetafhankelijke dag-/nachtpatronen | Geen vaste dag-/nachtregel onafhankelijk van leeftijd, helderheid, predatiedruk, voedseltype en seizoen |
| Zeelt | [Herrero et al. (2005), voedingsritme en locomotorische activiteit](https://doi.org/10.1016/j.physbeh.2005.02.015); [USGS soortprofiel](https://nas.er.usgs.gov/Queries/FactSheet.aspx?SpeciesID=652) | Sterke nachtelijke activiteit in gecontroleerde omstandigheden; ondiep, langzaam/stilstaand en vegetatierijk habitat is relevant; tolerantie voor lage zuurstof is beschreven | Laboratoriumritme is niet automatisch een veldvangstcurve; brede tolerantie is geen bewijs voor optimale activiteit |
| Snoekbaars | [Fedorova & Drozzhina (1982), dagelijkse voedingscyclus in Ladogameer](https://app.eurekamag.com/research/005/090/005090190.php); [winter-/voorjaarsvoedingsstudie (2020)](https://doi.org/10.1111/are.14401); [Poulet et al. (2005), kanaaltelemetrie](https://doi.org/10.1007/s10750-004-6823-6) | Directe voedingsdata tonen een vroege-ochtendpiek in juni–augustus en een tweede avondpiek in september; telemetrie beschrijft daarnaast schemerbeweging en seizoens-/paaicontext | Een Ladogameer-ritme of Franse kanaalstudie is geen algemene Nederlandse jaarcurve; prooigedrag en voortplanting beïnvloeden de uitkomst |
| Meerval | [Boujard (1995), directe nachtelijke voeropname in gecontroleerde opstelling](https://doi.org/10.1016/0031-9384(95)00109-V); [Sajdlová et al. (2025), nachtelijke voedselopname bij vroege juvenielen](https://doi.org/10.1111/jfb.16072); [Santos et al. (2025), volwassen veldtelemetrie](https://doi.org/10.1111/eff.12817); [Slavík & Horký (2012), veldtelemetrie](https://doi.org/10.1111/j.1095-8649.2012.03436.x) | Directe nachtvoeding is aangetoond in een gecontroleerde opstelling en bij vroege juvenielen in drie reservoirs; volwassen veldtelemetrie meet schemer-/nachtbeweging en dieptegebruik | Volwassen accelerometerdata zijn geen directe voedselopname; Portugal/mediterrane omstandigheden en individuele variatie beperken overdraagbaarheid naar Nederlandse wateren |
| Roofblei | [Kärgenberg et al. (2020), migratie in rivier-meersysteem](https://doi.org/10.1111/jfb.14454); [Horký & Slavík (2017), dag-/seizoensbeweging](https://doi.org/10.1080/03949370.2016.1230560); [ontogenetische dieetstudie (2018)](https://doi.org/10.1111/eff.12414) | Seizoensmigratie, habitatgebruik en levensfasegebonden prooikeuze zijn beschreven | Directe dag-/nachtmetingen van voedselopname of voedingsintensiteit ontbreken; migratie en dieet zijn geen bewijs voor een vaste dagelijkse voedingspiek |

### 7.2 Wat dit betekent voor het bestaande profielbestand

- De negen soortprofielen plus `Overig` bevatten al soortspecifieke temperatuurcurves, tijdvakvoorkeuren, windnotities, drukvelden, regen-/bewolkingsnotities en seizoensprioren. Het bestaan van die velden betekent niet dat de precieze getallen door de bronnen worden gedragen.
- Directe tijdgebonden voedselopname is nu geregistreerd voor karper, brasem, blankvoorn, snoek, baars, zeelt, snoekbaars en meerval, maar de opzetten en levensfasen verschillen sterk (veldmaaginhoud, hartslagtelemetrie, juveniele veldwaarneming of gecontroleerde voeropname). Voor roofblei is wel dieet-/prooikeuze- en bewegingsbewijs aanwezig, maar nog geen directe dagelijkse voedingsintensiteit. Geen van deze bronnen levert op zichzelf een universele vangstcurve.
- Het algemene overzicht van Volkoff & Rønnestad over temperatuur en voeding is achtergrond voor visfysiologie, geen vervanging voor soortspecifieke veldvalidatie.
- De in het profielbestand genoemde groeistudie voor vier soorten (Tien et al., 2024) meet groei. Groei kan samenhangen met temperatuur en voeding, maar is geen rechtstreekse maat voor dagelijkse activiteit, foerageergedrag of vangbaarheid.
- `Overig` is geen biologische soort. Het mag daarom niet dezelfde schijn van soortspecifieke nauwkeurigheid krijgen als een geïdentificeerde doelsoort.

### 7.3 Eerste ontwerpconsequenties

1. **Geen vaste voorkeursuren als harde waarheid.** Gebruik tijdvakvoorkeuren als hypotheses met onzekerheid; licht, helderheid, prooien, levensfase en waterbody kunnen het patroon verschuiven.
2. **Habitat moet soortspecifiek én watertype-afhankelijk zijn.** Dezelfde soort kan ander gedrag vertonen in een helder meer, troebel meer, kanaal of verbonden rivier-/wetlandstelsel.
3. **Beweging, activiteit en voeding zijn verschillende labels.** Telemetrie meet vaak beweging of locatiegebruik; maaginhoud, voeropname of directe voedingsobservatie meet andere uitkomsten.
4. **Thermische parameters zijn nog niet gevalideerd.** De literatuur ondersteunt dat temperatuur ertoe doet, maar de huidige Gaussische optimum-/breedtewaarden zijn niet rechtstreeks af te leiden uit de gevonden uiteenlopende studies.
5. **Levensfase en individuele variatie moeten in bewijsstatus worden vermeld.** Waar het model geen levensfase kent, mag het geen precisie claimen die de bronpopulatie niet ondersteunt.


### 7.4 Nog ontbrekende brondekking

De directe dag-/nachtinventarisatie is voor acht van de negen concrete soorten inmiddels uitgebreid. De grootste resterende leemte is directe, dagdeel-resolved voedselopname bij roofblei; daarnaast zijn volwassen velddata voor meerval en breed toepasbare velddata voor snoek, snoekbaars en brasem/blankvoorn schaars. De beschikbare bronnen voor karper, zeelt, snoek, baars, blankvoorn, brasem, snoekbaars en meerval blijven gebonden aan specifieke wateren, seizoenen, prooien of levensfasen. Ook onafhankelijke gegevens over drukverandering, wind, zuurstof, stroming, regen en interacties zijn nodig voordat die factoren numeriek kunnen bijdragen.

**Conclusie:** er is voldoende bewijs om soortspecifieke verschillen en habitat-/tijdspatronen serieus te modelleren, maar niet om nu al betrouwbare vaste percentages of exacte responsgewichten te publiceren. De volgende stap is de bestaande parameter- en bronverwijzingen één voor één te auditen en per modeluitkomst een expliciete bewijsstatus toe te kennen.


### 7.5 Koppeling aan het centrale research register

De eerste broninventaris uit §7.1 is nu ook als soortgerichte kennis vastgelegd in `src/services/researchRegistry.ts`. Voor alle negen concrete profielsoorten bestaat minimaal één expliciete soortgekoppelde registratie. De aanvullende registraties betreffen onder meer karperfoerageren, brasemwinteractiviteit en wetlandbeweging, snoek- en snoekbaarsbeweging, baars- en blankvoornactiviteit/habitat, zeeltvoedingsritme, meervalvoeding/individuele variatie en roofbleimigratie.

**Dit is bronregistratie, geen modelactivatie.** Alle nieuwe registraties hebben `approvedForPrediction: false`. Ze documenteren welke responsvariabele is onderzocht en welke beperkingen gelden. De bestaande thermische profielparameters blijven voorlopig; geen van deze bronnen rechtvaardigt zonder aanvullende analyse een automatische numerieke bonus, vaste voorkeursuren of een directe vangstkans.

De DOI-vermelding bij de snoek-/snoekbaarsstudie is gecorrigeerd: DOI `10.1007/s10750-024-05533-2` betreft Nolan et al., *Movements and habitat use of native and invasive piscivorous fishes in a temperate and channelized lowland river* (online gepubliceerd in 2024; jaargang 2025), niet Cittadino et al. (2024).



**Runtime-koppeling:** de repositorybrede broncontrole vond dat geen prognose-, profiel-, habitat- of positioneringsengine de registerinhoud of `isApprovedPredictionKnowledge()` momenteel raadpleegt. `dataQualityEngine.ts` importeert alleen het type `DataStatus`. Het register is dus op dit moment een centrale bewijsadministratie en testbron, nog geen technische runtime-poort. Vóór een nieuwe factor numeriek wordt geactiveerd, moet de implementatie expliciet aan de relevante registratie worden gekoppeld en moet een regressietest aantonen dat niet-goedgekeurde kennis geen scorebijdrage kan leveren.


### 7.6 Evidence-matrix per soort en responsvariabele

De matrix hieronder classificeert de geregistreerde bronnen naar wat zij daadwerkelijk meten. Een bron kan voor de ene modeluitkomst bruikbaar zijn en voor een andere ongeschikt. De register-ID's verwijzen naar de volledige samenvatting, bron en beperkingen in `src/services/researchRegistry.ts`.

| Soort | Voedselopname / foerageren | Activiteit / locomotie | Habitat / beweging | Groei / overige thermische context | Huidige modelconclusie |
|---|---|---|---|---|---|
| Karper | `common-carp-temperature-feeding-rhythm-2012`; `common-carp-juvenile-foraging-temperature-2012`; `common-carp-diel-grazing-food-type-2009` — directe voedings-/graasmetingen, deels gecontroleerd, tank- en juveniele context | Voedingsritme is geen zelfstandige zwemactiviteitsmeting | Geen specifieke telemetriebron in het huidige register | Juveniele studie meet ook groei; algemene temperatuurreview is achtergrond | Soortspecifieke voedsel- en dagritmehypothesen; bewijs is nog onvoldoende voor een volwassen Nederlandse veldcurve of exacte vangstweging |
| Brasem | `bream-roach-in-situ-diel-zooplankton-feeding-2004` — in-situ maagvulling/zoöplanktonconsumptie; overwegend daggebonden in één stuwmeer | `common-bream-winter-activity-reservoir-2018` — telemetrie-/activiteitscontext | `common-bream-wetland-seasonal-movement-2026` — seizoensbeweging en gebruik van verbonden zijwateren | `freshwater-fish-temperature-growth-four-species-tien-2024` — groei, geen acute activiteit | Direct voedingsbewijs bestaat, maar is voedsel- en lengteklassegebonden; niet vertalen naar een universele dagbonus |
| Snoek | `northern-pike-heart-rate-feeding-day-1991`; `pike-juvenile-feeding-rhythm-first-year-1998`; `northern-pike-field-seasonal-feeding-diet-2025` — wilde hartslagtelemetrie registreert voedselopname overdag; jonge 0+ snoek heeft een diurnaal/bifasisch voedingsritme; veldmaaginhoud beschrijft seizoensdieet | `northern-pike-diel-movement-lac-ste-anne-1980` — locomotorisch ritme | `northern-pike-lowland-river-movement-habitat-2025`; `pike-dusk-habitat-change-visibility-2012` | Geen soortspecifieke groeistudie in het register | Direct voedingsbewijs bestaat, maar de dagelijkse bronnen zijn klein of levensfasegebonden; geen volwassen Nederlandse jaarcurve |
| Baars | `perch-field-diel-feeding-seasonal-diet-1986`; `perch-diel-feeding-lake-constance-2021`; `perch-lake-ladoga-diel-feeding-1982` — directe maaginhoud-/voedingsritmedata uit verschillende meren en seizoenen | `european-perch-activity-habitat-lakes-2002-2025` — telemetrie en habitatactiviteit | Littoraal/pelagisch gebruik en verschillen naar trofische toestand | `freshwater-fish-temperature-growth-four-species-tien-2024` — groei, geen acute activiteit | Direct dagritmebewijs bestaat, maar de patronen verschillen per meer, seizoen, prooigemeenschap en habitat |
| Voorn | `roach-diel-diet-and-habitat-shifts-2002-2004` (Haertel & Eckmann: voedingsintensiteit/dieet/habitat); `roach-autumnal-diel-feeding-shift-2008`; `bream-roach-in-situ-diel-zooplankton-feeding-2004`; `roach-diel-feeding-cycle-lake-aydat-1990` | `roach-diel-movement-clear-turbid-lakes-2004` (Jacobsen et al.: radio-telemetrie, alleen beweging/habitat) | Dag-/nachtverschuiving tussen littoraal en pelagisch habitat; niet gelijk aan één uniforme voedingspiek | `freshwater-fish-temperature-growth-four-species-tien-2024` — groei, geen acute activiteit | Meerdere directe voedingsbronnen; leeftijd, dieet, helderheid en seizoen bepalen mede het dagritme; bewegingsbewijs blijft gescheiden |
| Zeelt | `tench-nocturnal-feeding-locomotor-rhythm-2005`; `tench-temperature-feeding-efficiency-2026`; `tench-field-diel-seasonal-feeding-2018` — gecontroleerde voedingsmetingen plus direct veldonderzoek naar maaginhoud en dag-/seizoensritme | Nachtelijk locomotorisch ritme onder gecontroleerde condities | Geen soortspecifieke lokale stekvalidatie | Voedselefficiëntie/body condition onder twee experimentele temperaturen; geen volledige veldcurve | Sterkste directe tijdvakbewijs in het register, maar één veldwater en beperkte seizoensdekking; geen harde nachtbonus |
| Snoekbaars | `pikeperch-lake-ladoga-daily-feeding-rhythm-1982`; `pikeperch-winter-spring-feeding-temperature-2020`; `asp-pikeperch-ontogenetic-diet-two-reservoirs-2018` — directe seizoensgebonden voedingsritmes plus gecontroleerde voedselopname en levensfasegebonden prooikeuze | `pikeperch-diel-activity-drainage-canal-2005`; `pikeperch-diel-distribution-elbe-river-2008` — locomotie en verdeling | Bestaande kanaal- en rivierhabitatbronnen | `freshwater-fish-temperature-growth-four-species-tien-2024` — groei, geen acute activiteit | Direct voedingsbewijs bestaat, maar tijdvensters zijn seizoens- en prooicontextgebonden; geen Nederlandse jaarcurve |
| Meerval | `european-catfish-diel-feeding-self-feeder-1995`; `juvenile-catfish-night-foraging-reservoirs-2025` — gecontroleerde nachtvoeding (levensfase onbekend) en directe nachtelijke voedselopname bij vroege juvenielen | `adult-catfish-diel-activity-reservoir-2025`; `european-catfish-feeding-and-activity-rhythms-1995-2012` (Slavík & Horký, 2012) — volwassen veldbeweging/accelerometer- en EMG-activiteit, geen directe voedselopname | Dieptegebruik en individuele/seizoensgebonden verplaatsing verschillen per rivier/reservoir | Geen soortspecifieke groeistudie in het register | Directe voedingsdata zijn levensfase-/opzetgebonden; volwassen veldtelemetrie is alleen bewegingsbewijs, geen bewijs voor een vaste nachtvoorkeur |
| Roofblei | `asp-pikeperch-ontogenetic-diet-two-reservoirs-2018` — directe maaginhoud/stabiele isotopen; sterke levensfasegebonden overgang naar visetend dieet | Diel-/seizoensbeweging via telemetrie | `asp-diel-seasonal-movement-river-lake-2016-2020` — migratie tussen rivier, meer, paaigebied en winterhabitat | Geen soortspecifieke groeistudie in het register | Dieet/prooikeuze is onderbouwd, maar directe dagelijkse voedingsintensiteit ontbreekt; levensfase kan de interpretatie sterk veranderen |
| Overig | Geen soortspecifieke bronnen | Geen soortspecifieke bronnen | Geen soortspecifieke bronnen | Geen soortspecifieke bronnen | Alleen generieke terugval; geen soortspecifieke biologische precisie |

**Modelimplicatie:** directe voedings-/foerageerdata zijn nu geregistreerd voor alle negen concrete soorten, maar de bewijskwaliteit en het type meting verschillen sterk. Sommige bronnen meten veldmaagvulling of daadwerkelijke consumptie; andere zijn gecontroleerde kweek-/tankstudies of meten alleen dieet/prooikeuze. Geografische overdraagbaarheid, voedselbeschikbaarheid, lengte-/leeftijdsklasse en reproductiestatus beperken de toepassing. De voedingslaag moet daarom per soort de responsvariabele, opzet, levensfase, habitat en onzekerheid expliciet meenemen. Telemetrie, groei en dieet mogen niet als onderling uitwisselbare proxies worden gebruikt.

Alle gekoppelde registraties blijven `approvedForPrediction: false`. De matrix is een classificatie van bestaande literatuur, geen vrijgave van numerieke modelinvloeden. De nieuwe bronverwijzingen zijn ook gekoppeld aan de canonieke `scientificReferences` van de soortprofielen in `fishProfiles.ts`; geen profielparameter of bestaande score is hiermee aangepast.


## 8. Parameterinventaris bestaande soortprofielen

**Canonieke bron:** `src/services/fishProfiles.ts` op `main`. Dit bestand is de enige operationele bron van waarheid voor soortprofielwaarden en de thermische responsfunctie.

De negen concrete soortprofielen en de generieke fallback `Overig` bevatten de thermische parameters, beschrijvende tijdvakvoorkeuren en overige voorlopige omgevingsvoorkeuren. De actuele waarden worden bewust niet nogmaals als tabel in deze audit gekopieerd: raadpleeg altijd het bronbestand zelf om verouderde documentatie te voorkomen.

### 8.1 Wat de profielvelden betekenen

- `thermalOptimum`, `thermalWidthCold` en `thermalWidthWarm` vormen de parameters voor de huidige asymmetrische Gaussische thermische respons.
- De profielbreedtes bepalen hoe snel de theoretische thermische efficiëntie afneemt aan de koude en warme kant van het optimum.
- Het code-optimum bereik is een apart profielveld voor de uitlegtekst; het is niet automatisch hetzelfde als een empirisch vastgesteld fysiologisch optimum of een vangstoptimum.
- Voorkeursvakken zijn beschrijvende hypotheses. De huidige activiteitsscore kent er geen numerieke bonus aan toe.
- Windrichting, windsnelheidsdrempel, luchtdruksensitiviteit/-bereik, regen, bewolking en seizoensvelden blijven voorlopig en veranderen de huidige numerieke activiteitsscore niet.
- Het profiel `Overig` is uitsluitend een generieke terugvaloptie en geen soortspecifieke biologische voorspelling.

### 8.2 Parameterbeoordeling

Voor geen van de negen concrete soorten is in deze audit aangetoond dat de huidige combinatie van thermisch optimum, koude-/warme breedte en code-optimum bereik rechtstreeks uit een geschikte veldstudie is afgeleid. De literatuurverkenning in §7 ondersteunt dat soortverschillen bestaan, maar bevat uiteenlopende meetuitkomsten en experimentele/veldcontexten. De huidige getallen blijven daarom **voorlopige modelaannames**.

Vervolg per soort:
1. traceer iedere parameter naar de exacte bron en de gemeten responsvariabele;
2. noteer soort, levensfase, populatie, watertype, temperatuurgebied, onderzoeksopzet en beperkingen;
3. bepaal of de bron activiteit, foerageren, groei, overleving of thermische voorkeur meet;
4. gebruik geen groeidata als directe voedings- of vangstcurve zonder expliciet overdraagbaarheidsargument;
5. waar directe data ontbreken: markeer de parameter als hypothese en toon hogere onzekerheid, in plaats van een preciezer getal te verzinnen.

**Besluit:** geen profielwaarde wordt aangepast op basis van deze inventaris. De waarden blijven uitsluitend in `fishProfiles.ts`; de audit registreert betekenis, status en bewijsbeperkingen, niet een tweede kopie van de parameters.


## 9. Habitat-, wind- en positioneringsketen

**Read-only trace op main, 16 november 2026.**

### 9.1 Bestaande verantwoordelijkheden

- **bankWindEngine.ts:** berekent de geometrische relatie tussen windherkomst, windrichting waarin de wind blaast en de geregistreerde kijkrichting vanaf de oever. Zonder bekende oeveroriëntatie, bruikbare winddata, thermische basis of watertype wordt geen definitieve oeverrelatie berekend. De output bevat onder meer aanlandig/aflandig, golfwerking, drift en positioneringsadvies.
- **habitatMovementEngine.ts:** ontvangt doelsoort, stek/habitat, thermische analyse, bankwind, tijdvak, waarnemingen, historische sessies, wind, druktrend en bewolking. De output bestaat uit een primaire en alternatieve habitatzone, een kwalitatieve bewegingshypothese, omgevingscontext, databronnen, ontbrekende informatie en een confidence-label.
- **rodPositioningEngine.ts:** geeft tactische zoek-/hengelpositioneringshypothesen op basis van soort, watertype, diepte, seizoen, temperatuur, wind en eventueel persoonlijke sessies. De module documenteert expliciet dat zij onafhankelijk is van de biologische activiteitsindex en Poisson-vangkans en geen bonuspunten of kansverhogingen berekent.

### 9.2 Wat deze engines wel en niet voorspellen

De habitatengine levert op dit moment **kwalitatieve zones en verklaringen**, geen gekalibreerde numerieke kans dat een vis op een specifieke stek aanwezig is. De confidenceLevel is eveneens een heuristisch label: de huidige toekenning hangt vooral af van het aantal gebruikerswaarnemingen en het bestaan van oeveroriëntatie of waterdiepte. Dit is geen statistisch betrouwbaarheidsinterval en mag niet als bijvoorbeeld 70% aanwezigheid worden vertaald.

De bankWind- en rod-positioning-uitkomsten zijn bruikbaar voor praktische stekkeuze en visserijadvies, maar hun aanwezigheid bewijst niet dat de biologische activiteit of vangstkans numeriek wordt voorspeld. De drie modules moeten daarom in het uiteindelijke model als afzonderlijke bewijs-/advieslagen worden behandeld, tenzij een later validatieonderzoek een expliciete koppeling rechtvaardigt.

### 9.3 UI en snapshot

De PrognosisView toont bankwind en habitatbeweging in de geavanceerde details. De volledige DayPrognosis wordt in de bestaande prognosesnapshot als prognosisData bewaard; daarmee kunnen de kwalitatieve habitatuitkomsten worden gereproduceerd voor zover de bijbehorende inputcontext en engineversies zijn vastgelegd. De exacte dekking van alle habitatinvoer in de verschillende snapshotbouwers blijft onderdeel van de resterende vergelijking tussen handmatige prognose, VisCoach-plan, sessiestart en sessie-update.

### 9.4 Databeperkingen en vervolg

- Locatie kan watertype, diepte, oeveroriëntatie, habitatkenmerken en notities bevatten, maar de volledigheid en feitelijke nauwkeurigheid hangen af van gebruikersinvoer.
- Directe aanwezigheidssignalen (springen/rollen, aasbellen, aanbeten, recente vangst) zijn waardevolle observaties, maar niet-waarnemen is geen bewijs van afwezigheid.
- Waterhelderheid, gedetailleerde bodem-/dieptekaart, actuele zuurstof en kwantitatieve stroming zijn niet als algemene, betrouwbare lokale meetreeks aangetoond.
- De habitatengine voegt ontbrekende context toe aan missingInformation en verlaagt in de prognoseketen de confidence naar Laag wanneer belangrijke velden ontbreken. Dit voorkomt een deel van de schijnzekerheid, maar vervangt geen gekalibreerde aanwezigheidsschatting.

**Conclusie:** bestaande ruimtelijke modules vormen een bruikbare basis voor stek- en positioneringsadvies. Ze zijn nog geen probabilistisch, soortspecifiek aanwezigheidsmodel. Fase 2 moet de bestaande kwalitatieve uitkomsten behouden en eerst een datacontract plus validatieplan maken voordat numerieke aanwezigheidskansen worden toegevoegd.


## 10. Watertemperatuurprovenance — implementatiestatus en resterende beperkingen

### Oorspronkelijke auditbevinding

De read-only hercontrole van 16 november 2026 vond dat sessiemetingen met `session.startTime` werden gedateerd, terwijl de types al een expliciet `waterTemperatureMeasuredAt` bevatten. Ook konden sessie- en snapshotkopieën van dezelfde meting door verschillende tijdstempels dubbel meetellen. De meetdatum in `SessionModal.tsx` was optioneel en werd niet automatisch ingevuld.

### Huidige implementatie

De oorspronkelijke tekortkomingen zijn aangepakt in de volgende commits:

- [c854dc3](https://github.com/sennzor-wq/Vislogboek/commit/c854dc396d344c8217c95fde83ea58aeea8a5317): sessie- en snapshotmetingen worden alleen gebruikt met een parsebaar expliciet meettijdstip en bekende bron/methode. De thermische engine gebruikt `waterTemperatureMeasuredAt`; er is geen fallback naar `session.startTime`.
- [bea2f8b](https://github.com/sennzor-wq/Vislogboek/commit/bea2f8baa305fb8bbc8ddacf1fed8454c973e72e): historische meetrecords bewaren record-ID/type, registratiemoment, bron, methode en meetdiepte in de inputcontext.
- [78de199](https://github.com/sennzor-wq/Vislogboek/commit/78de199054186db7a96bd60f6ac7fbce76601d12): live coach-herbeoordeling geeft de sessietemperatuur niet langer door als actuele meting; de sessiemeting wordt als historisch anker gebruikt.

De historische profielberekening normaliseert meettijdstippen naar absolute tijd voor deduplicatie op locatie, meetmoment en temperatuur. De collector bewaart de bronrecords afzonderlijk in de snapshot-inputcontext; de profielberekening telt equivalente metingen eenmaal. Benchmarkmetingen en records met onbekende meetbron/-methode of ontbrekend meettijdstip worden uitgesloten van de historische temperatuurreeks. De onderliggende gebruikersrecords blijven behouden.

### Resterende beperkingen

1. Er is nog geen gedeeld fysiek `measurementId` dat sessie- en snapshotrecord expliciet aan elkaar koppelt. De huidige deduplicatie gebruikt locatie + absoluut meetmoment + temperatuur. Dit voorkomt dubbele telling door tijdzone-notatie, maar blijft een deterministische match en geen expliciete meet-ID-koppeling.
2. De inputcontext bewaart zowel de sessie- als snapshotbronrecord; `historicalWaterTemperatureSampleCount` is daardoor het aantal opgenomen bronrecords, terwijl de effectieve profiel-`sampleCount` na deduplicatie het aantal unieke meetcombinaties weergeeft.
3. **Opgelost:** de actuele handmatige watertemperatuurinvoer staat in alle vier de prognose-/snapshotbouwers als afzonderlijk `manualWaterTemperatureInput`-object in `PrognosisInputContext`. Het fysieke meettijdstip, de methode en meetdiepte blijven onbekend als ze niet expliciet zijn ingevoerd.
4. **Deels opgelost in de replaybare-history-werkstroom:** alle vier de builders bewaren nu whitelisted sessie-, vangst- en waarnemingsfeatures naast de record-ID's. Vrije notities en foto's worden bewust niet gekopieerd. Volledige replay vereist daarnaast dat modelcode en profielparameters via de vastgelegde model-/engineversies reproduceerbaar blijven; een historische runtime/container wordt niet gearchiveerd.

### Validatie en vervolg

Gerichte regressietests staan in `test-water-history-profile.ts`, `test-water-thermal-coupling.ts`, `test-water-temperature-synthetic-validation.ts` en `test-session-coach-integration.ts`. De volledige Quality Gate is op 16 november 2026 groen uitgevoerd op de uiteindelijke fixbranch: TypeScript, alle regressies, backup-/restoretests en productiebuild zijn geslaagd. Omdat de repository public is, zijn de commits zonder `[skip ci]` gemaakt. De replaybare-history-werkstroom is vervolgens volledig groen gevalideerd in Quality Gate [#43930702270](https://github.com/sennzor-wq/Vislogboek/actions/runs/43930702270), inclusief typecheck, alle regressietests, backup-/restoretests en productiebuild.

De actuele handmatige temperatuurinvoer en compacte historische feature-snapshot zijn vastgelegd. Een gedeelde fysieke meet-ID kan later worden toegevoegd als praktijkdata aantonen dat de huidige deduplicatiesleutel onvoldoende is; daarnaast blijft model-/engineversiebeheer noodzakelijk voor reproduceerbaarheid.


### Aanvulling — actuele handmatige watertemperatuur als snapshot-invoer

De handmatige watertemperatuur is nu een afzonderlijk veld in `PrognosisInputContext` en valt daardoor mee in de inputfingerprint. De prognoseweergave en live sessiestart bewaren de ingevoerde temperatuur en het registratiemoment van de prognoserun. Het fysieke meettijdstip, de meetmethode en de meetdiepte blijven expliciet `null` wanneer die gegevens niet zijn opgegeven; het registratiemoment wordt dus nooit ten onrechte als meetmoment gepresenteerd. De VisCoach-planbuilder en coach-herbeoordeling zetten dit veld expliciet op `null`, omdat zij geen actuele handmatige meting ontvangen en de sessiemeting bij herbeoordeling via de historische meetwaarnemingen loopt.

De CI-suite `test-thermal-and-prognosis.ts` controleert dat ontbrekende/ongeldige invoer geen object oplevert en dat een gewijzigde handmatige temperatuur een andere inputfingerprint geeft. Een aanvullende integratieregressie controleert dat een sessiemeting van een uur eerder bij VisCoach-herbeoordeling niet als actuele meting wordt gepresenteerd, maar met het expliciete meettijdstip als historisch anker een `estimated_from_measurement`-schatting oplevert. De thermische engine behandelt daarom alleen een expliciet voor de huidige prognoserun ingevoerde meting als actueel; sessiemetingen blijven historische ankers, ook als ze minder dan zes uur oud zijn. De volledige Quality Gate is groen op de uiteindelijke fixbranch. De compacte replaybare feature-snapshot is in de daaropvolgende werkstroom toegevoegd en afzonderlijk gevalideerd; zie de aanvulling hieronder.


### Aanvulling — replaybare historische modelinvoer (16 november 2026)

De prognosecontext bewaart nu naast ID's en fingerprints ook een compacte, versieerbare whitelist van de historische kenmerken die de bestaande engines kunnen gebruiken:

- Sessies: locatie, start/eindtijd, werkelijke duur, uitkomst, doelsoorten, importkwaliteitsvlaggen, techniek, aasrichting, voorvoerstatus/-beschrijving, diepte en volledige watertemperatuur-meetprovenance.
- Vangsten: sessie-/locatiekoppeling, soort, aantal, gewicht/lengte, tijdstip, aas/techniek en importkwaliteitsvlaggen.
- Waarnemingen: locatie-/sessiekoppeling, waarnemingstype en tijdstip.
- Temperatuurkalibratie: toegepaste correctie, aantal paren en seizoen.
- `historyFeatureSchemaVersion: 1` maakt de vorm van de feature-snapshot expliciet. De gedeelde helper sorteert records deterministisch en sluit benchmarkrecords plus hun gekoppelde vangsten/waarnemingen uit.
- Vrije notities, foto's, base64-inhoud en andere niet-modelrelevante persoonlijke tekst worden niet gekopieerd.
- `historyFingerprint` wordt uit dezelfde featurepayload en historische watertemperatuurwaarnemingen opgebouwd. De volledige snapshot-inputfingerprint bevat daarnaast de inputcontext en exacte weersinvoer.

Dezelfde helper wordt gebruikt door `PrognosisView`, live sessiestart, VisCoach-planning en VisCoach-herbeoordeling. Regressies controleren dat modelrelevante wijzigingen (zoals aasrichting en voorvoerstatus) de fingerprint wijzigen en dat privénotities/foto-inhoud niet in de snapshot terechtkomen. Een integratietest controleert ook de daadwerkelijk opgeslagen coachsnapshot.

**Resterende grens:** dit legt de historische data-input vast, maar archiveert niet de uitvoerbare modelcode. Reproduceerbaarheid blijft afhankelijk van het consequent verhogen van `modelVersion`/`engineVersions` wanneer logica of profielparameters wijzigen. De volledige Quality Gate voor deze featurebranch moet nog slagen voordat de wijziging op `main` komt.

## 11. Voortgangscheckpoint — voedingsbewijs geregistreerd (16 november 2026)

**PR #54 is gemerged naar `main`** als commit [16c2ebd](https://github.com/sennzor-wq/Vislogboek/commit/16c2ebd63f18a9913fa7234c2774c24ddada4d8a). De wijziging breidt het centrale researchregister en de canonieke soortprofielen uit met soortspecifieke voedings-/dieetbronnen voor alle negen concrete soorten. De Quality Gate op de exacte PR-head is volledig groen: [run #43932012809](https://github.com/sennzor-wq/Vislogboek/actions/runs/43932012809). De eerdere overlappende run #43931990396 is geannuleerd; dit is geen testfout. De Quality Gate op de mergecommit is gestart als [run #43933698267](https://github.com/sennzor-wq/Vislogboek/actions/runs/43933698267) en stond bij dit checkpoint nog in de wachtrij.

**Inhoudelijke grens:** alle nieuwe bronnen blijven `approvedForPrediction: false`. De profielparameters en runtime-prognose-uitkomsten zijn niet gewijzigd. Dieet/prooikeuze, directe voedingsintensiteit, locomotie/telemetrie, habitat en groei blijven aparte bewijssoorten.

**Waar we zijn gebleven:** de literatuurdekking is voldoende uitgebreid om de eerste kwalitatieve voedingslaag te ontwerpen, maar niet om één uniforme numerieke voedingsscore te rechtvaardigen. De eerstvolgende code-audit moet het bestaande `researchRegistry.ts`-schema, `fishProfiles.ts` en de prognose-/UI-contracten naast elkaar leggen en per soort vaststellen welke kwalitatieve uitspraak direct door welk bewijs wordt gedragen. Ontbrekende kennis (bijvoorbeeld lokale prooibeschikbaarheid of levensfase) blijft expliciet onbekend.

**Acties hierna:**
1. Controleer dat Quality Gate #43933698267 op de mergecommit volledig groen eindigt.
2. Ontwerp een afzonderlijke kwalitatieve voedings-/foerageeruitkomst met bewijsstatus, bronverwijzing, toepassingscontext en onzekerheid; geen numerieke bijdrage aan de activiteitsindex.
3. Bepaal per soort welke bronuitspraken geschikt zijn voor runtime-context en welke alleen in de onderzoeksdocumentatie thuishoren.
4. Voeg tests toe voor bewijsherkomst, niet-goedgekeurde bronnen, ontbrekende context en scheiding tussen activiteit, voeding, habitat en vangstkans.
5. Pas daarna de UI-integratie en chronologische evaluatiegrenzen toe. Fase 2 blijft open totdat de audit, implementatie, tests en acceptatiecriteria zijn afgerond.


## 12. Gemeten uitkomsten expliciet geclassificeerd (16 november 2026)

PR [#55](https://github.com/sennzor-wq/Vislogboek/pull/55) is gemerged als [f6c959c](https://github.com/sennzor-wq/Vislogboek/commit/f6c959c109fb096c75a6028cfa77cf89efa81574). Het researchregister heeft nu een expliciete `ResearchOutcome`-classificatie en `getResearchByOutcome(species, outcome)`. Geregistreerde studies worden geclassificeerd naar wat zij werkelijk meten: voedselopname, voedingsritme, foerageergedrag, dieet/prooikeuze, locomotorische activiteit, habitatgebruik, groei of voedingsfysiologie.

De regressies bewaken expliciet dat dieet-/prooikeuzebewijs van Roofblei niet als gemeten voedingsintensiteit wordt teruggegeven en dat groeibewijs een aparte uitkomst blijft. De classificatie is een literatuurfilter, geen toestemming om de bron als runtimefactor te gebruiken. Alle registraties blijven `approvedForPrediction: false`; er is geen prognosecode, UI, parameter of score gewijzigd.

**Quality Gate:** PR-head [#43934137768](https://github.com/sennzor-wq/Vislogboek/actions/runs/43934137768) is volledig groen, inclusief typecheck, alle regressietests en productiebuild. De Quality Gate op de mergecommit moet nog worden gecontroleerd.

**Volgende stap:** maak op basis van de gemeten-uitkomstclassificatie een per-soort toepasbaarheidsmatrix voor de eerste kwalitatieve voedingscontext. Maak onderscheid tussen (a) direct gemeten voedingsintensiteit/-ritme, (b) alleen foraginggedrag, (c) alleen dieet/prooikeuze en (d) indirecte beweging/habitat. De app mag alleen categorieën (a) en eventueel (b) als voorzichtig geformuleerde voedingscontext tonen; (c) mag uitsluitend dieet/prooikeuze beschrijven en (d) mag niet als voedingsbewijs dienen. Geen numerieke factor activeren.


## 13. Per-soort toepasbaarheid van voedingsbewijs (16 november 2026)

Deze beoordeling combineert de evidence matrix (§7.6) met de expliciete `ResearchOutcome`-labels uit het researchregister. De status beschrijft welke kwalitatieve uitspraak een bron ondersteunt; het is geen modelscore en geen vrijgave voor numerieke voorspelling.

| Soort | Direct gemeten voedselopname/-ritme | Alleen foraging/dieet/prooikeuze | Beperkingen voor de eerste voedingscontext |
|---|---|---|---|
| Karper | Gecontroleerde studies meten voedingsritme/-intensiteit en graastijd | Juveniele studie meet foerageergedrag en groei; andere studie varieert voedseltype | Vooral tank-/gesimuleerde vijvercondities en juvenielen; geen volwassen Nederlandse veldcurve. Alleen als gecontroleerde biologische context tonen |
| Brasem | In-situ consumptie/maagvulling van zoöplankton en dag-nachtverschil | — | Eén stuwmeer en specifieke voedsel-/lengteklassen; geen universele dagbonus |
| Snoek | Veld-maagvulling als voedingsintensiteitsmaat | Dieet/prooikeuze | Eén Anatolisch stuwmeer; seizoens- en temperatuurrelaties waren niet significant. Geen tijdvakpiek of seizoensbonus afleiden |
| Baars | Directe veldmetingen van voedingsactiviteit en dagritme | Dieet en prooikeuze per lengteklasse | Eén klein Fins meer; tijdvakpatroon verschilde tussen seizoenen. Niet zonder lokale validatie op Nederlandse wateren projecteren |
| Voorn | In-situ zoöplanktonconsumptie en veldbewijs voor seizoensafhankelijk dag-/schemervoeden | Dieet- en habitatverschuivingen | Voedseltype, helderheid, habitat en seizoen beïnvloeden patroon; geen vaste dag-nachtregel |
| Zeelt | Directe veld-maaginhoud/voedingsintensiteit met avond- en nachtpieken; gecontroleerd nachtelijk voedingsritme | Dieet-/leeftijdsverschillen | Veldpatroon uit één klein eutroof water; gecontroleerde studies zijn niet gelijk aan vrij levende populaties. Geen harde nachtbonus |
| Snoekbaars | Gecontroleerde voedselopname bij gekweekte broedvis | Dieet/prooikeuze naar levensfase | Geen directe volwassen-wilde veldcurve voor voedingsritme; gecontroleerde temperatuurrespons niet rechtstreeks vertalen naar lokale tijdvakscore |
| Meerval | Gecontroleerde nachtvoeding en veld-maagvulling/seizoensvariatie | Dieet naar lengte/leeftijd | Veldstudie uit één diep reservoir; telemetrie toont individuele locomotorische variatie, niet automatisch voedingsintensiteit |
| Roofblei | Geen directe bron voor dagelijkse voedingsintensiteit of voedingsritme | Maaginhoud/stabiele isotopen tonen levensfasegebonden dieet en prooikeuze | Alleen dieetcontext naar levensfase; telemetrie/migratie mag niet als voedingsactiviteit worden gebruikt |
| Overig | Geen soortspecifiek bewijs | Geen soortspecifiek bewijs | Geen soortspecifieke voedingsuitspraak; generieke fallback blijft expliciet beperkt |

### Besluit voor de eerste kwalitatieve voedingscontext

- Alleen `feeding_intensity` en `feeding_rhythm` ondersteunen uitspraken over gemeten voedselopname/-ritme. `foraging_behavior` ondersteunt uitsluitend gedrag dat in die studie is waargenomen.
- `diet_composition` en `prey_selection` ondersteunen uitsluitend dieet-/prooikeuzecontext. Ze mogen nooit een tijdvakpiek, voedingsintensiteit of activiteitsscore opleveren.
- `locomotor_activity` en `habitat_use` blijven in de ruimtelijke laag; groei blijft thermische/groeicontext. Geen van deze uitkomsten is een proxy voor voedselopname.
- Alle uitkomsten blijven informatief zolang `approvedForPrediction` false is. De eerste UI mag dus brongebonden biologische context tonen, geen voorspelde voedingskans of numerieke voedingsscore.
- Onbekende lokale prooibeschikbaarheid, levensfase, populatieverschillen en overdraagbaarheid worden niet ingevuld. Als een contextvoorwaarde nodig is maar ontbreekt, wordt de claim weggelaten of expliciet als beperkt gemarkeerd.

**Volgende stap:** implementeer eerst een pure, geteste service die per soort de toegestane kwalitatieve evidence-context samenstelt. Pas daarna volgt beperkte UI-presentatie als onderzoekscontext, duidelijk gescheiden van prognosescore en vangstkans.


## 14. Kwalitatieve voedingsbewijsservice (16 november 2026)

PR [#56](https://github.com/sennzor-wq/Vislogboek/pull/56) is gemerged als [d10e33e](https://github.com/sennzor-wq/Vislogboek/commit/d10e33e4005ab782e1fdbb80aa5457e546ed6f42). `src/services/feedingEvidenceService.ts` bundelt per soort de geregistreerde uitkomsten voedselopname, voedingsritme, foerageergedrag, dieet en prooikeuze. De service geeft ook de expliciet goedgekeurde voedingsbronnen apart terug via `isApprovedPredictionKnowledge`.

De service is bewust puur en niet gekoppeld aan `calculateDayPrognosis()` of de UI. Ze produceert geen score, kans, tijdvakrangschikking of voorspelling. De tests controleren alle soorten, Roofblei als dieet-only, Snoek zonder bewezen dagritme, Zeelt met direct voedings-/ritmebewijs en Overig zonder soortspecifieke evidence. De nieuwe test is onderdeel van de Quality Gate.

**Validatie:** PR-head Quality Gate [#43934866369](https://github.com/sennzor-wq/Vislogboek/actions/runs/43934866369) is volledig groen, inclusief typecheck, nieuwe voedingsbewijsservice-tests, bestaande regressies, backup/restore en productiebuild. De mergecommit-Quality-Gate moet nog worden gecontroleerd.

**Huidige grens:** de service levert nu alleen gestructureerde evidence-context. Er is nog geen UI-uitvoer en geen numerieke/kwalitatieve voedingsprognose. Volgende stap is de outputcontract- en UI-review: alleen brongebonden onderzoekscontext tonen, met zichtbare beperking dat dit geen voorspelling is. Geen effect op activiteitsindex of persoonlijke vangstkans.


## 15. Voedingsliteratuur zichtbaar gemaakt in de prognose-UI (16 november 2026)

De prognoseweergave toont nu per geselecteerde doelsoort een aparte sectie **Wat zegt onderzoek over voeding?**. Deze sectie groepeert bronnen naar (1) gemeten voedselopname/-ritme, (2) foerageergedrag en (3) dieet/prooikeuze. Per bron zijn de neutrale samenvatting, beperkingen, bronverwijzingen en bewijsstatus uit het centrale register te openen. Dubbele bronnen met meerdere relevante uitkomsten worden binnen een groep ontdubbeld.

De sectie is expliciet gelabeld als biologische achtergrond uit gepubliceerde studies, niet als actuele voedingsvoorspelling voor de geselecteerde stek of datum. Voor de keuze 'Algemeen' wordt geen soortspecifieke broncontext verzonnen; de gebruiker wordt gevraagd een soort te selecteren. De UI leest uitsluitend `getSpeciesFeedingEvidenceContext()` en schrijft niets terug naar de prognose-engine. Er wordt geen voedingsscore, tijdvakrangschikking of vangstkans berekend of gewijzigd.

De documentatiecommit met deze UI-integratie wordt door de normale Quality Gate gevalideerd. De eerdere documentatiecontrole [#43935102399](https://github.com/sennzor-wq/Vislogboek/actions/runs/43935102399) is volledig groen.

**Volgende stap:** PR-controle op typecheck, regressietests en productiebuild; daarna merge alleen bij volledig groen. Vervolgens beoordelen of een brongebonden lokale voedingsobservatie (bijv. waargenomen aasbellen/foerageeractiviteit) als afzonderlijke gebruikerswaarneming aan de toekomstige voedingslaag kan worden gekoppeld. Geen automatische voedingsbonus zonder validatie.


## 16. Lokale foerageerwaarnemingen: datakwaliteit en gebruiksgemak (16 november 2026)

Audit van `PresenceObservation`, `SessionModal` en `syncSessionPresenceObservations()` toont een belangrijke beperking. De sessie-editor bewaart waarnemingen als een set categorieën op sessieniveau (`presenceObservations`). Bij synchronisatie wordt voor een nieuw record `session.updatedAt` gebruikt als zowel `timestamp` als `createdAt`. Dit is het registratiemoment van de sessie-update, niet noodzakelijk het werkelijke moment waarop aasbellen, bodemwoeling of foerageren is waargenomen. Per sessie kan bovendien maar één record per type bestaan; herhaalde waarnemingen binnen één sessie zijn niet afzonderlijk vast te leggen. De structuur bevat geen expliciete soortidentificatie of identificatiezekerheid.

De huidige prognose gebruikt de gekozen `presenceObservation` uitsluitend voor een verklarende notitie en expliciete onzekerheidscontext; er wordt geen numerieke bonus toegepast. Deze bestaande gegevens mogen daarom niet als nauwkeurig getimede voedingsmetingen of als trainingslabels voor een tijdvakgebonden voedingsmodel worden behandeld.

### Productbesluit: geen extra invoerdruk in de huidige fase

Een aparte, herhaalbare foerageerregistratie met verplicht waarnemingstijdstip, soortherkenning, diepte en gedragscategorieën is technisch denkbaar, maar wordt **niet opgenomen in de huidige implementatie-roadmap**. De gebruiker moet tijdens het vissen niet worden belast met veel extra handelingen of een uitgebreide registratieprocedure. Gebruiksgemak en een laagdrempelige sessie-ervaring wegen zwaarder dan het verzamelen van maximaal veel meetvelden.

De bestaande sessiewaarnemingen blijven uitsluitend globale, kwalitatieve context. We vullen ontbrekende waarnemingstijden niet automatisch aan en gebruiken deze records niet als tijdvakgebonden trainingslabels. Een eventuele latere uitbreiding is alleen zinvol als die optioneel, zeer snel en aantoonbaar gebruiksvriendelijk kan worden ingevoerd, zonder dat de gebruiker meerdere verplichte velden moet invullen. Eerst moet worden aangetoond dat de extra data het prognosemodel werkelijk verbeteren. Tot die tijd geen nieuwe registratie-UI, databasemigratie of numerieke modelinvloed.


## 17. Thermische soortrespons: parameterstatus en interpretatie (16 november 2026)

De thermische respons is momenteel de enige numerieke invoer van de activiteitsindex. De implementatie in `fishProfiles.ts` gebruikt per soort een asymmetrische Gaussische curve rond `thermalOptimum`, met afzonderlijke koude-/warmtebreedtes en een ondergrens van 0,08. De uiteindelijke index gebruikt daarnaast de transformatie `1 + 9 × efficiency^0.85`.

De code bevat geen bron- of fitmetadata waaruit blijkt dat deze curvevorm, optimumwaarden, breedteparameters, efficiëntievloer of exponent per soort zijn geschat uit representatieve veldmetingen. De algemene literatuurverwijzingen ondersteunen het mechanisme dat temperatuur fysiologie en voedselopname beïnvloedt, maar rechtvaardigen niet automatisch de exacte waarden voor iedere soort, levensfase en Nederlands watertype. De `optimalTempRange` en `tolerableTempRange` zijn profielgrenzen; ze zijn geen gevalideerde fysiologische optimum-/tolerantiegrenzen.

De oude beschrijvingen trokken te sterke conclusies: lage temperatuur werd geformuleerd als een afgedwongen spaarstand/sterk geremde foerageerdrang en hoge temperatuur als zuurstofstress. Dat volgt niet uit de beschikbare invoer. De teksten zijn daarom afgezwakt naar een relatieve modelschatting. De nieuwe formulering maakt expliciet dat profielgrenzen geen bewezen winterrustgrens zijn en dat zuurstofstress niet kan worden afgeleid zonder opgeloste-zuurstofmeting. Dit wijzigt de curve, parameters en score niet.

### Tijdvakbeperking

`calculateDayPrognosis()` voert één thermische analyse per doeldatum uit en geeft diezelfde analyse door aan de vier tijdvakken. De huidige tijdstip-/schemeringsprofielen hebben scorebijdrage nul. Daardoor is de thermische activiteitsscore binnen dezelfde dag voor alle tijdvakken gelijk; de engine kan op basis van deze thermische laag alleen geen biologisch beste uurvak onderscheiden. De UI mag een tijdvakvoorkeur uit literatuur dus niet presenteren alsof deze al numeriek is doorgerekend.

### Validatiegrens en vervolg

De bestaande thermische tests toetsen softwaregedrag met gecontroleerde/synthetische scenario's (watertraagheid, meetankers, waterdiepte, ontbrekende data en scorekoppeling). Ze bewijzen niet dat de soortcurves of hun parameters biologisch juist zijn. Door de clean start is er nog geen representatieve lokale vangst-/activiteitsreeks om deze parameters te fitten of chronologisch te valideren.

Vervolg: per soort en responsvariabele de brondata en overdraagbaarheid beoordelen; parameters als voorlopig labelen zolang exacte brononderbouwing ontbreekt; pas daarna een toetsbare curvehypothese vergelijken met een eenvoudige baseline. Geen nieuwe factorweging of numerieke tijdvakbonus op basis van de huidige profielnotities.


## 18. Prognose-uitvoer benoemt de werkelijke scope van de score

De 1–10-score werd in koppen en conclusies aangeduid als 'biologische activiteit', terwijl de huidige numerieke berekening uitsluitend de voorlopige thermische soortcurve gebruikt. Dit kon de indruk wekken dat de app totale activiteit of foerageergedrag voorspelt. De UI en conclusies benoemen deze uitkomst nu als **thermische activiteitspotentie**. De toelichting maakt expliciet dat wind, luchtdruk, seizoen, tijdstip, bewolking en neerslag momenteel alleen context zijn en de score niet wijzigen.

Ook de laatste resterende conclusie over een 'inactieve winterstand' is verwijderd. Een lage thermische modelschatting bewijst geen winterrust, volledige inactiviteit of stop van voedselopname. De interne veldnaam `activityScore` blijft ongewijzigd om bestaande snapshots en compatibiliteit te behouden; de betekenis is in typecommentaar en UI verduidelijkt.

De berekening, numerieke uitkomsten, vangstkans en tijdvakrangschikking zijn niet gewijzigd. Een regressietest bewaakt dat lage temperatuur niet als bewezen winterrust wordt gepresenteerd.


## 19. Thermische fysiologie: gemeten responsen onderscheiden (16 november 2026)

Het researchregister onderscheidt nu expliciet `metabolic_rate` en `aerobic_scope` van voedselopname, voedingsritme en algemene activiteit. Dit voorkomt dat zuurstofverbruik of fysiologische capaciteit als direct bewijs voor foerageergedrag wordt gebruikt.

De eerste gecontroleerde literatuurinventaris levert onder meer:
- Karper: acute metabole respons rond een acclimatisatietemperatuur van 19 °C; geen volledige langetermijncurve.
- Snoek: zuurstofverbruik/onderhoudsmetabolisme bij beperkte temperatuurpunten; geen compleet optimum.
- Baars: standaard-/maximale stofwisseling en aerobe scope bij 15–28 °C; het optimum voor aerobe scope verschuift met lichaamsmassa.
- Brasem en blankvoorn: standaard- en routinezuurstofverbruik over 5–23 °C; verschillende temperatuurgevoeligheid en lichaamsmassaeffecten.
- Snoekbaars: volwassen aquacultuurvis met maximale aerobe scope rond 18,8 °C en een breed 80%-bereik van 10,4–26,9 °C; juvenielen vertonen een ander temperatuur-/groeibereik.

Deze bronnen meten verschillende fysiologische responsen en onderzoeksopzetten. Geen van deze registraties is goedgekeurd als directe hengel-, voedings- of activiteitsfactor. De bevindingen ondersteunen dat één vaste curve per soort mogelijk te grof is, met name door lichaamsgrootte en levensfase. Ze rechtvaardigen nog geen wijziging van bestaande `thermalOptimum`-/breedteparameters. Alle records blijven `approvedForPrediction: false`.


## 20. Thermische brondekking per soort en grens van parameterherziening

De thermische fysiologiebronnen uit §19 zijn nu ook als traceerbare referenties aan de canonieke soortprofielen gekoppeld. De dekking is ongelijk:

| Soort | Directe thermische fysiologie in het register | Wat de bron wel/niet ondersteunt |
|---|---|---|
| Karper | Acute metabole respons na acclimatisatie op 19 °C | Temperatuurgevoelig metabolisme; geen langetermijnoptimum of volledige veldcurve |
| Snoek | Zuurstofverbruik bij beperkte temperatuurpunten (2 en 14 °C) | Metabolische context; onvoldoende punten voor een volledige optimumcurve |
| Baars | SMR, MMR en aerobe scope bij 15–28 °C | Directe fysiologische curve-informatie; optimale aerobe scope/voorkeur verschuift met lichaamsmassa |
| Brasem | SMR/RMR bij 5–23 °C | Temperatuur- en lichaamsgrootte-afhankelijk metabolisme; geen directe hengelactiviteit |
| Voorn | SMR/RMR bij 5–23 °C | Temperatuur- en lichaamsgrootte-afhankelijk metabolisme; geen directe hengelactiviteit |
| Zeelt | Geen passende multi-temperatuur whole-animal aerobe-scopecurve in het huidige register | Bestaande cel-/voedingsfysiologie en losse zuurstofmetingen zijn geen volledige veldcurve |
| Snoekbaars | SMR, MMR en aerobe scope bij volwassen kweekvis, 13–28 °C | Volwassen optimum rond 18,8 °C; brede 80%-scope en aantoonbare levensfaseverschillen |
| Meerval | Veld-EMG/locomotorische activiteit en afzonderlijke voedings-/groeicontext | Temperatuurassociatie met beweging is niet gelijk aan aerobe scope of een complete metabole curve |
| Roofblei | Geen geschikte soortspecifieke thermische fysiologiecurve in het huidige register | Geen numerieke optimum-/breedteparameter afleiden uit dieet of telemetrie |

### Modelbesluit

Een enkele `thermalOptimum` per soort kan bij Baars en Snoekbaars relevante lichaamsgrootte-/levensfaseverschillen verbergen. Toch voegen we geen verplicht lengte-, leeftijds- of levensfaseveld toe aan de gebruikersinvoer. De vangstlengtes die soms worden geregistreerd zijn bovendien selectief en geen representatieve steekproef van de aanwezige populatie.

Daarom blijven alle huidige thermische profielparameters voorlopig. Geen numerieke aanpassing op basis van één laboratoriumstudie of een responsvariabele die niet overeenkomt met de modeluitkomst. Eerst bepalen we per soort of de beoogde fysiologische laag gebaseerd moet worden op aerobe scope, metabole snelheid of een andere direct gemeten respons; die uitkomsten mogen niet door elkaar worden gehaald.


## 21. Ontwerpbesluit: tijdvakken mogen gelijkwaardig uitkomen (16 november 2026)

De gebruiker verduidelijkt dat een beste tijdvak niet geforceerd hoeft te worden. Als relevante omstandigheden tussen tijdvakken gelijk blijven en er geen soortspecifieke biologische factor is die een verschil onderbouwt, mag de prognose alle tijdvakken als praktisch gelijkwaardig tonen. De visser kiest dan zelf wanneer hij vist; de app hoeft geen nacht- of ander tijdvak als winnaar aan te wijzen.

Een soortspecifiek natuurlijk dagritme (bijvoorbeeld schemering, nacht of ochtend) mag wél een tijdvakvoorkeur opleveren wanneer passend direct gedragsbewijs dit ondersteunt. Het bewijs moet aansluiten op de uitkomst: voedingsritme/foerageeractiviteit voor voedingsvoorkeur, locomotie voor bewegingsactiviteit, enzovoort. Niet elke nachtactieve beweging bewijst bijvoorbeeld een hogere voedingsactiviteit of vangstkans.

Ontwerpuitkomsten:
1. Duidelijke, onderbouwde voorkeur.
2. Kleine/onzekere verschillen zonder stellige winnaar.
3. Geen betekenisvol verschil: tijdvakken gelijkwaardig presenteren.

Er wordt geen standaard nacht-/schemerbonus ingevoerd. Numerieke drempels voor betekenisvolle verschillen worden pas vastgesteld na bronbeoordeling, modelontwerp en validatie; geen arbitraire drempel of gewicht. Dit besluit verandert de huidige berekening niet en heft de bestaande beperking op de gedeelde thermische daganalyse nog niet op.


## 22. Correcte samenvatting bij gelijkwaardige tijdvakken (16 november 2026)

De tijdvakselectie kende al de uitkomst `Geen betekenisvol onderscheid`, maar de samenvatting viel voor zowel die uitkomst als 'geen toekomstig tijdvak meer' in dezelfde `else`-tak. Daardoor meldde de UI bij gelijkwaardige scores ten onrechte dat alle tijdvakken verstreken waren. De samenvatting onderscheidt deze situaties nu expliciet:
- onvoldoende thermische basisgegevens: geen betrouwbare tijdvakduiding;
- gelijkwaardige beschikbare tijdvakken: geen onderbouwde beste tijd, kies een praktisch passend moment;
- alle tijdvakken verstreken: bekijk de prognose voor morgen;
- wel een onderscheidende score: toon het beste toekomstige tijdvak.

Een regressietest bewaakt zowel de gelijkwaardige als de volledig verstreken situatie. De onderliggende scores en tijdvakselectie zijn niet gewijzigd.


## 23. Soortspecifiek dagritme: beweging is niet automatisch voedselopname (16 november 2026)

De broninventaris is uitgebreid met directe, soortspecifieke tijdsbewijzen voor snoek, snoekbaars en roofblei. De uitkomsten zijn bewust gescheiden:

| Soort | Gemeten respons | Bevinding | Modelgrens |
|---|---|---|---|
| Snoek | Voedselopname-/verteringsmetabolisme en locomotorische activiteit (aparte studies) | Hartslagtelemetrie rapporteerde overdag gevangen kleine prooien; een andere kleine telemetriestudie vond weinig beweging 's nachts en geen duidelijk schemerpiekpatroon. | Voedselvangsttijd is niet hetzelfde als verteringstijd; beweging van een hinderlaagjager is geen directe jachtmaat. |
| Snoekbaars | Locomotorische activiteit en habitatpositie | Twee telemetriestudies vonden vaak een bewegingspiek rond de schemering. In de Elbe lag de vis 's nachts ondiep bij de oever, waarschijnlijk rustend; individuele variatie bestaat. | Geen directe voedingspiek afleiden uit beweging of nachtelijke locatie. |
| Roofblei | Locomotorische activiteit en habitatgebruik | Een 32 maanden durende studie met 53 volwassen vissen en 12.435 bewegingsgebeurtenissen vond meestal hogere beweging rond dageraad/schemering, maar sterke maand-/jaarvariatie en in sommige zomermaanden geen duidelijk dagritme. | Noordelijk, aaneengesloten meer-riviersysteem; geen directe voedselopname of overdraagbare vaste bonus. |

Nieuwe registraties blijven allemaal `approvedForPrediction: false`. Snoekbaars is in de profieltekst niet langer zonder nuance een uitgesproken nachtjager; de tekst benoemt de schemeringsgerichte bewegingsbevinding en individuele/seizoens-/habitatvariatie. De snoekprofieltekst maakt duidelijk dat stilstand bij een hinderlaagjager niet gelijkstaat aan inactiviteit of afwezigheid van jacht.

Deze bronnen maken een latere tijdvaklaag beter onderbouwbaar, maar activeren nog geen numerieke factor. De tijdvaklaag moet eerst onderscheid kunnen maken tussen zonne-gerelateerde schemerperioden en vaste klokblokken, en tussen locomotie, foerageren en daadwerkelijke voedselopname. Geen automatische nachtbonus.


## 24. Directe dagritmebronnen voor snoek en snoekbaars (16 november 2026)

De broninventaris is aangevuld met twee studies die daadwerkelijk voedingsritme behandelen:
- Jonge snoek (<1 jaar): dagactieve jacht in de onderzochte ontwikkelingsstadia; in de planktivore fase een bifasisch voedingsritme. Dit bewijs is uitsluitend levensfasegebonden en mag niet als volwassen snoekritme worden gebruikt.
- Snoekbaars in het Ladogameer: een vroege ochtendpiek in juni–augustus en een tweede avondpiek in september. De uitkomst is seizoensgebonden en lokaal; exacte methodedetails/steekproefomvang moeten bij toekomstig hergebruik van de oorspronkelijke publicatie worden geverifieerd.

Daarnaast is een snoekstudie toegevoegd die habitatwisselingen rond schemering meet, zonder prooien of soortgenoten. Dit is locomotorisch/habitatbewijs, geen voedingsmeting. Alle bronnen blijven niet-goedgekeurd voor numerieke voorspelling. De kwalitatieve snoekbaarsprofielvoorkeur is teruggebracht tot ochtend/avond; nachtelijke ondiepe aanwezigheid blijft niet gelijk aan een bewezen nachtelijke voedingspiek.


## 25. Herziening van kwalitatieve soortspecifieke dagdelen (16 november 2026)

De kwalitatieve profielvoorkeuren zijn opnieuw vergeleken met de gemeten voedingsritmes:
- **Karper:** algemene nachtvoorkeur verwijderd. Bronnen beschrijven ochtend-/avondpieken in sommige omstandigheden, maar ook meer graastijd overdag dan 's nachts in een andere opzet.
- **Brasem:** nacht- en vaste schemerpiek verwijderd. In-situ consumptieonderzoek toont overwegend daggebonden voedselopname en lagere maagvulling 's nachts.
- **Zeelt:** profiel aangepast naar avond/nacht op basis van gemeten voedingspieken 18:00–21:00 en 00:00–03:00 in één klein eutroof water en aanvullend nachtelijk voedingsgedrag in gecontroleerd onderzoek. Dit blijft lokaal/contextafhankelijk.
- **Blankvoorn:** de seizoensafhankelijke verschuiving van dag naar schemering/nacht in een boreaal meer is expliciet gemaakt; geen universele Nederlandse winterregel.
- **Baars:** profieltekst vermeldt nu dat ochtend-/avondpieken in mei/juni kunnen verschuiven naar middag in juli/augustus.
- **Algemeen/Overig:** geen soortspecifieke dagdeelvoorkeur meer; de UI communiceert dat gebrek aan bewijs niet als een negatief tijdvak.

Deze voorkeursperioden zijn kwalitatieve literatuurcontext en veranderen geen activiteitsscore, tijdvakscore of vangstkans. Vaste klokblokken zijn grof en kunnen zonsopkomst/schemering niet in elk seizoen goed representeren; een latere tijdvaklaag moet zonne-relative perioden kunnen verwerken.


## 26. Gescheiden servicecontract voor dagritmebewijs (16 november 2026)

De pure service `dielBehaviorEvidenceService.ts` bundelt per soort drie afzonderlijke bewijsstromen: direct gemeten voedingsritme, locomotorische activiteit en habitatgebruik. Alleen expliciet aan de soort gekoppelde bronnen worden teruggegeven; generieke bronnen worden niet als soortspecifiek dagritme gepresenteerd. De service geeft ook een scope-label terug (voedingsritme en beweging, alleen voedingsritme, alleen beweging of geen soortspecifiek tijdsbewijs) en scheidt goedgekeurde bronnen apart.

Dit is uitsluitend een data-/evidencecontract. Het berekent geen tijdvakscore, leest geen vrije-teksttrefwoorden uit bronbeschrijvingen om perioden te raden, activeert geen bron en verandert geen prognose. De roofblei-tests bewaken expliciet dat telemetrie alleen als beweging/habitat wordt getoond en niet als direct voedingsritme.


## 27. Lokale zonsopkomst/-ondergang als tijdvakcontext (16 november 2026)

De weerrespons bevat al lokale zonsopkomst en zonsondergang per datum. Deze gegevens worden nu doorgegeven aan de prognose-engine en per bestaand kloktijdvak als kwalitatieve context getoond. Een breed venster van één uur vóór en na het zonne-event markeert of het tijdvak de overgang rond zonsopkomst of zonsondergang omvat. Dit venster is nadrukkelijk geen formele astronomische schemerberekening en telt niet mee in een score.

De vaste tijdvakken (00–06, 06–12, 12–18, 18–24) blijven voorlopig ongewijzigd. De gebruiker kan daardoor zien wanneer de lokale overgang valt, ook wanneer die in een ander klokblok valt dan in een ander seizoen. Ontbrekende zonsopkomst/-ondergang blijft onbekend; er wordt geen standaardtijd verzonnen. Regressietests controleren dat de context per datum wordt gekoppeld en geen numerieke bonus toevoegt.


## 28. Civiele dageraad en schemering (16 november 2026)

De brede vaste ±60-minutencontext rond zonsopkomst/-ondergang is vervangen door een schatting van **civiele dageraad en civiele schemering** (zonmiddelpunt op −6°). De berekening gebruikt de lokale zonsopkomst/-ondergang uit de weerbron en de breedtegraad van de gekozen stek; het verschil tussen standaard zonsopkomst (−0,833°) en −6° wordt via een NOAA-zonstandbenadering bepaald. Zo blijft de lokale klok/tijdzone van de weerbron behouden en verschuiven de overgangsperioden seizoensmatig.

De uitkomst wordt alleen als context aan de bestaande kloktijdvakken gekoppeld. Ontbrekende of ongeldige coördinaten/tijden blijven onbekend; er wordt geen vaste duur verzonnen. De civiele schemering is een astronomische lichtperiode, geen bewijs dat een bepaalde vis op dat moment voert. De score blijft ongewijzigd.


## 29. Soortspecifieke dag-/nachtritmes: literatuurinventarisatie (16 november 2026)

Nieuwe primaire/veldgerichte bronnen zijn toegevoegd aan `researchRegistry.ts`, zonder modelgoedkeuring:

- **Blankvoorn en brasem:** in-situ zoöplanktonconsumptie bij subadulten/volwassen vissen was overdag hoger en nam ’s nachts af (Vasek & Kubecka 2004). Bij jonge blankvoorn en brasem werd in een andere meerstudie nachtelijke pelagische aanwezigheid/voedselopname gevonden (Bohl 1979/1980). Voor blankvoorn vond Jamet et al. (1990) bovendien leeftijdsafhankelijke voedingsperioden. Dit is geen tegenspraak die met één gemiddelde bonus mag worden gladgestreken: dieet, lengte/leeftijd, seizoen, helderheid en habitat verschillen.
- **Baars:** een herfstcampagne in het pelagische deel van het Bodenmeer vond maaginhoud/voedselopname oplopen richting de schemering en een minimum voor zonsopkomst (Frontiers in Environmental Science 2021). Eén seizoen en één prooicontext; niet generaliseren.
- **Meerval:** naast de bestaande laboratoriumbron over nachtelijke vrijwillige voedselopname is nu veldbewijs voor nachtelijke voedselopname bij vroege juvenielen toegevoegd (Sajdlová et al. 2025). De levensfase- en pelagische context moet expliciet blijven.
- **Karper, zeelt en snoekbaars:** er stonden al directe voedingsritmebronnen in het register. Deze blijven informatief; de karperbron beschrijft ochtend- en avondpieken onder gecontroleerde omstandigheden, zeelt vooral nachtelijke voeropname in een gecontroleerde opstelling en snoekbaars seizoensafhankelijke ochtend-/avondpatronen.
- **Snoek:** direct voedingsbewijs is beperkt en deels levensfasegebonden; bewegingsstilstand is bij een hinderlaagjager geen betrouwbare proxy voor jacht of voedselopname.
- **Roofblei:** beschikbare dag-/schemergegevens betreffen vooral telemetrische beweging, niet directe voedselopname. Geen voedingsvoorkeur afleiden uit beweging alleen.

**Modelbesluit:** alle nieuwe registraties blijven `approvedForPrediction: false`. De bronnen ondersteunen eerst een genuanceerde bewijskaart per soort, levensfase, habitat, seizoen en gemeten respons. Er wordt nog geen tijdvakscore aangepast. Ook waar een veldstudie een voedingspiek laat zien, ontbreken vaak representatieve gegevens voor alle seizoenen en Nederlandse watertypen.


## 30. VisCoach: gekozen sessievenster en levensfase

De code-audit bevestigde dat de VisCoach-weergave het gekozen tijdvak al toont en de viscoach-service dit als selectedTimeSlot aan de geplande snapshot koppelt. De centrale adviesvertaling gebruikte echter uitsluitend DayPrognosis.bestTimeSlot, waardoor de tekst een ander dagdeel kon aanbevelen dan de gebruiker had gekozen. Dit is een presentatielaagfout; de onderliggende dagprognose wordt niet opnieuw berekend.

De correctie laat de adviesvertaling expliciet het geselecteerde tijdvak ontvangen. Bij één tijdvak wordt de conclusie uit timeSlots[selectedTimeSlot] gebruikt. Bij een sessie die meerdere tijdvakken omvat, wordt geen globale dagwinnaar als sessieadvies gepresenteerd. Bestaande callers zonder geplande tijdvakcontext behouden hun bestaande gedrag. Regressietests bewaken zowel het enkelvoudige als het meer-tijdvakkenscenario.

**Levensfasebesluit:** levensfase is geen verplichte invoer. Alleen betrouwbare, expliciet bekende levensfase-informatie mag later als soortspecifieke modifier worden gebruikt. Ontbrekende levensfase blijft onbekend; lengte alleen is geen automatische leeftijdsclassificatie. Er is geen nieuwe UI- of registratievraag toegevoegd.


## 31. Volwassen meerval: schemerpiek in beweging is geen voedingsmeting

Santos et al. (2025; online 27 november 2024) volgden tien volwassen Europese meervallen in het Portugese Belver-reservoir met akoestische biotelemetrie, 3D-versnellingsmeters en druksensoren. De gemeten locomotorische activiteit piekte doorgaans rond de schemering en lag hoger in de nacht dan overdag; de diepteverdeling verschilde sterk per seizoen en individu. De studie noemt predatie/foerageren als waarschijnlijke verklaring voor een deel van de bewegingspieken, maar meet geen directe voedselopname.

De bron is daarom uitsluitend geregistreerd als locomotorische activiteit en habitat-/dieptegebruik. De overdraagbaarheid is beperkt door één Portugees reservoir, mediterrane omstandigheden en tien volwassen vissen. De studie wordt niet gebruikt om een directe voedingsritmefactor of universele schemerbonus te activeren. De bestaande 1995-studie blijft directe voedingsdata uit een gecontroleerde opstelling; de 2025-studie vult alleen volwassen veldbeweging aan.


## 32. Evidence-matrix herzien: tijdgebonden voedselopname versus beweging

De oudere samenvatting in §7.1–§7.6 is bijgewerkt na de aanvullende literatuurcontrole. Directe dagdeel-resolved voedselopname is nu geregistreerd voor acht van de negen concrete soorten: karper, brasem, blankvoorn, snoek, baars, zeelt, snoekbaars en meerval. De meetopzetten lopen uiteen van maaginhoud en in-situ consumptie tot hartslagtelemetrie en gecontroleerde voeropname; meerdere bronnen zijn beperkt tot juvenielen, één seizoen of één specifieke prooigemeenschap. Voor roofblei is wel dieet-/prooikeuzebewijs en telemetrie beschikbaar, maar geen overtuigende directe dagelijkse voedingsintensiteit.

De volwassen meervalstudie van Santos et al. (2025) is apart als locomotorische activiteit en diepte-/habitatgebruik geclassificeerd. De accelerometers registreerden een schemerpiek en hogere nachtelijke activiteit, maar geen voedselopname. Daarmee blijft de scheiding tussen voedingsritme en beweging ook binnen één soort expliciet. Alle registraties blijven niet-goedgekeurd voor numerieke voorspelling; de factorinventaris en kandidaatresponsen zijn nog niet gevalideerd op lokale, chronologisch gescheiden vangstdata.


### Aanvulling baars — Ladogameerbron apart aan soort gekoppeld

Fedorova & Drozzhina (1982) onderzochten zowel snoekbaars als baars. De bestaande registratie was alleen aan snoekbaars gekoppeld. Er is daarom een aparte baarsregistratie toegevoegd: deze beschrijft directe voedingsintensiteit en dagritme, maar meldt voor baars juist géén uitgesproken vaste dagelijkse pieken; de relatieve schemerintensiteit hing samen met prooigedrag. Dit voorkomt dat de bron ten onrechte alleen als snoekbaarsbewijs wordt getoond of als harde schemervoorkeur wordt geïnterpreteerd.


## 33. Mergecontrole en vervolgprioriteit — VisCoach en dagritme-evidence (16 november 2026)

De volgende twee wijzigingen zijn op `main` verwerkt:

- **PR #70 — gekozen vistijd in VisCoach:** mergecommit `8088f194ecc1d6a08a2ba2f28d8495a8166cd6f3`. De coachvertaling gebruikt de geselecteerde `TimeSlotAnalysis.conclusion` voor één tijdvak. Een sessie die meerdere tijdvakken omvat krijgt geen kunstmatige dagdeelwinnaar. Regressietests dekken enkelvoudige en meervoudige tijdvakken. Dit herstelt de eerder in de fase-0-kernketenaudit gevonden mismatch tussen planselectie en adviescopy.
- **PR #71 — aanvullende soortspecifieke evidence:** mergecommit `4c95d55f513cdde175d1e108a7553a9c87d5bf8b`. Volwassen Europese meerval uit een Portugees reservoir is uitsluitend als locomotorische activiteit/dieptegebruik geregistreerd; de studie meet geen directe voedselopname. Fedorova & Drozzhina (1982) is ook expliciet aan baars gekoppeld. Voor baars wordt geen vaste dagelijkse voedingspiek afgeleid; relatieve schemeractiviteit hing samen met prooigedrag.

De records blijven niet-goedgekeurd voor numerieke voorspelling. Geen activiteitsscore, tijdvakgewicht, vangstkans of soortparameter is gewijzigd. De levensfase blijft een optionele interne nuance; onbekende levensfase wordt niet uit vangstlengte afgeleid en levert geen extra gebruikersvraag op.

**Volgende auditstap:** voer een systematische overdraagbaarheidscontrole uit over de bestaande diel-evidence per soort. Leg per bron vast: gemeten respons, soortidentiteit, levensfase, seizoen, watertype/habitat, meetmethode, steekproef-/onderzoeksopzet en overdraagbaarheid naar Nederlandse binnenwateren. Houd directe voedselopname/-ritme gescheiden van foraging, locomotie, habitat en dieet/prooikeuze. Een studie mag alleen een kwalitatieve voedingsclaim ondersteunen wanneer de gemeten respons dat daadwerkelijk toelaat. Geen numerieke tijdvakscore of bonus zolang onafhankelijke lokale validatie ontbreekt.


## 34. Eerste soort-voor-soort overdraagbaarheidsmatrix voor dagritmebewijs (16 november 2026)

**Status:** kwalitatieve audit van de huidige registraties in `researchRegistry.ts`; geen nieuwe brongoedkeuring en geen modelactivatie. De matrix beoordeelt niet welke soort 'het beste' bewijs heeft, maar welke conclusie de geregistreerde studies wel en niet toelaten.

| Soort | Direct tijdgebonden voedingsbewijs in register | Belangrijkste overdraagbaarheidsgrens | Veilige conclusie voor VisCoach nu |
|---|---|---|---|
| **Karper** | Ja, maar hoofdzakelijk gecontroleerde studies: ochtend-/avondritme in voedselopname en meer daggraastijd in een gesimuleerde vijver. Aanvullend juveniel foerageeronderzoek bij verschillende temperaturen. | Ondersoort/populatie, kunstmatig voer, kleine tanks en juveniele levensfase; geen representatieve Nederlandse veldreeks. | Alleen uitleggen dat studies contextafhankelijke dagritmes en voedseltype-effecten laten zien. Geen algemene nacht-, dag- of schemerwinnaar. |
| **Brasem** | Ja. In-situ maaginhoud/zoöplanktonconsumptie bij subadulten en adulten wijst in één stuwmeer op overwegend dagvoeding; ander onderzoek bij jonge vissen beschrijft nachtelijke pelagische voeding/aanwezigheid. | Leeftijdsklasse, dieet en pelagisch versus littoraal habitat veranderen het patroon; studies zijn niet uit Nederlandse stekken afkomstig. | Tegenstrijdigheid zichtbaar houden. Geen universele dag- of nachtvoorkeur zonder bekende levensfase, prooitype en habitatcontext. |
| **Blankvoorn** | Ja, meerdere veldstudies: dagvoeding, leeftijdsafhankelijke middag-/schemer-/nachtpatronen en een herfstverschuiving naar schemering/nacht in een boreaal meer. | Sterke afhankelijkheid van seizoen, leeftijd/grootte, dieet, licht en habitat; geografische context verschilt van Nederlandse wateren. | Een contextafhankelijke kwalitatieve beschrijving is verdedigbaar; geen vaste tijdvakbonus of één soortbreed optimum. |
| **Snoek** | Beperkt. Vrijlevende hartslagtelemetrie geeft voedings-/verteringscontext maar geen robuuste piek in dagelijkse voedselopname; een directe dagritmestudie betreft jonge snoek in het eerste levensjaar. | Volwassen en juveniele snoek mogen niet worden samengevoegd. Prooivangsttijd en daaropvolgende vertering zijn verschillende responsen; veldstudies zijn geografisch beperkt. | Geen volwassen snoek-dagdeelwinnaar. Het juveniele patroon alleen noemen wanneer die levensfase betrouwbaar bekend is. |
| **Baars** | Ja, meerdere veldbronnen. Er zijn ochtend-/avondpieken die in de zomer naar middag kunnen verschuiven, een herfstcampagne met schemergerelateerde maaginhoud en een Ladogameerbron zonder vaste dagelijkse piek. | Sterke invloed van seizoen, prooiaanbod, lengteklasse en pelagisch/littoraal habitat; enkele bronnen hebben beperkte metadata. | Geen vaste schemerbonus. Hoogstens contextgebonden voedingspatronen noemen met seizoen/habitat en onzekerheid erbij. |
| **Zeelt** | Ja. Gecontroleerde zelfgestuurde voedselopname toont nachtelijk ritme; een veldstudie in één klein eutroof water vond avond- en nachtelijke pieken. | Veldbewijs komt uit één water en één vegetatieperiode; gecontroleerde voeropstellingen zijn niet gelijk aan natuurlijk foerageren of hengelvangbaarheid. | Avond-/nachtcontext als beperkte literatuurbevinding, niet als universele voorkeur of numerieke bonus. |
| **Snoekbaars** | Ja, één directe seizoensgebonden dagritmestudie in het Ladogameer; daarnaast gecontroleerde winter-/voorjaarsvoedingsmetingen zonder volledige dagritmeconclusie. | Eén meer, groeiseizoen, prooiverspreiding en voortplantingsstatus; aanvullende temperatuurstudie gebruikt gekweekte broedvis. | Alleen de lokale/maandgebonden ochtend- en avondbevinding beschrijven; niet generaliseren naar elk Nederlands water of elk seizoen. |
| **Meerval** | Ja: Boujard (1995) rapporteert sterk nachtelijke voedselopname in een gecontroleerde zelfvoeropstelling (levensfase niet vastgesteld); daarnaast is er veldbewijs voor vroege juveniele nachtelijke pelagische voedselopname. | Boujard meet voerautomaatgedrag onder gecontroleerde omstandigheden; sociale huisvesting beïnvloedt het ritme. Juveniele velddata zijn pelagisch. Twee volwassen veldtelemetriestudies meten alleen beweging/EMG en diepte, geen voedselopname. | Nachtelijke voedingscontext is biologisch aannemelijk, maar context- en levensfasegrenzen moeten zichtbaar blijven. Geen numerieke bonus of generieke nachtelijke vangstvoorspelling. |
| **Roofblei** | Geen overtuigende directe dagdeel-resolved voedselopname/-ritmebron in het huidige register. | Beschikbare bronnen gaan vooral over dieet/prooikeuze, levensfaseverschuiving en locomotorische activiteit; dat is geen gemeten voedingspiek. | Geen soortspecifieke dagdeelvoorkeur presenteren. Neutrale uitleg dat directe tijdgebonden voedingsdata ontbreekt. |

### 34.1 Overkoepelende bevindingen

1. De dekking is niet gelijk verdeeld: een soort kan meerdere directe voedingsstudies hebben, maar die kunnen onderling verschillen in levensfase, seizoen, prooitype of habitat.
2. Een veldstudie is niet automatisch overdraagbaar naar Nederland; een gecontroleerde studie is niet automatisch waardeloos, maar ondersteunt meestal een beperktere mechanistische of kwalitatieve uitspraak.
3. 'Directe voedselopname' is nog niet hetzelfde als 'hengelvangbaarheid'. Geen enkele rij rechtvaardigt op zichzelf een numerieke vangstkans- of tijdvakbonus.
4. Telemetrie van volwassen meerval en beweging-/habitatstudies bij andere soorten blijven afzonderlijke responsen. Ze mogen geen voedingspiek invullen wanneer voedselopname niet is gemeten.
5. Het ontbreken van betrouwbare lokale levensfase-informatie is een structurele onzekerheid. De app vraagt dit niet verplicht uit en leidt leeftijd niet af uit alleen vangstlengte.

### 34.2 Besluit en vervolg

De matrix is een broninventarisatie, geen formele meta-analyse of gekwantificeerde kwaliteitsbeoordeling. Voor iedere kandidaat-claim die later in VisCoach zichtbaar wordt, moet de oorspronkelijke publicatie waar mogelijk opnieuw worden gecontroleerd op steekproefomvang, exacte bemonsteringstijden, meetmethode, levensfase, seizoen en habitat. Secundaire samenvattingen en onvolledige bibliografische metadata blijven expliciet gemarkeerd.

**Volgende stap:** controleer de primaire publicaties voor de zwakst overdraagbare claims en maak per kandidaat-claim een expliciet besluit: alleen achtergrondinformatie, kwalitatief bruikbaar met context, of onvoldoende bewijs. Pas na die review kunnen UI-teksten worden aangescherpt. Alle huidige records blijven `approvedForPrediction: false`; geen numerieke tijdvak- of biologische score activeren.


## 35. Bohl-bron expliciet geregistreerd en soortnaam Voorn verduidelijkt (16 november 2026)

Bij de primaire broncontrole bleek dat Bohl (1979; DOI 10.1007/BF00545241) al in de literatuurtoelichting werd genoemd, maar nog niet als afzonderlijke registratie in `researchRegistry.ts` stond. De studie is nu expliciet toegevoegd voor de app-profielen Brasem en Voorn, met gemeten uitkomsten `feeding_intensity`, `feeding_rhythm` en `habitat_use`. De bron beschrijft juveniele blankvoorn en brasem (naast ruisvoorn en alver) in kleine Beierse meren: nachtelijke pelagische aanwezigheid en voedselopname vóór middernacht. In de winter werd geen periodieke migratie of voeding gevonden.

De registratie bewaart de cruciale begrenzing: dit is juveniel, pelagisch, plankton-gerelateerd gedrag en geen bewijs voor nachtelijke bodemvoeding bij volwassen brasem of blankvoorn. De bevinding mag daarom naast het overwegend daggebonden subadult/adult Římov-resultaat blijven staan; deze resultaten worden niet tot één universeel dagritme gemiddeld. De bron blijft `approvedForPrediction: false`.

**Soortnaamcontrole:** het bestaande interne type `Voorn` is gekoppeld aan `Rutilus rutilus`, dus blankvoorn. De zichtbare profielnaam is gecorrigeerd van 'Blankvoorn / Ruisvoorn' naar 'Blankvoorn'. Ruisvoorn is een andere soort (`Scardinius erythrophthalmus`) en heeft nog geen afzonderlijk app-profiel; het interne type `Voorn` en bestaande opgeslagen waarden blijven ongewijzigd om compatibiliteit te behouden. Een apart ruisvoorn-profiel vereist later een expliciet datamodel-/UX-besluit.


## 36. Primaire-broncontrole baars — Bodenmeer-studie begrensd tot juveniele 0+ vis

De volledige publicatie van Bretzel et al. (2021; DOI 10.3389/fenvs.2021.670125) is gecontroleerd. De studie onderzocht de voedingsrelatie tussen driedoornige stekelbaars en juveniele 0+ baars in de pelagische zone van de Obersee (Bodenmeer). De 24-uursanalyse van maaginhoud is gebaseerd op herfstgegevens uit 2018; de studie bevat daarnaast een beperkte voorjaarssteekproef, maar die levert geen gelijkwaardige 24-uursreeks voor baars op. Voor baars werden voedings-/maagvullingspieken rond dageraad en schemering beschreven, met een sterke daling na 21:00 en een minimum vóór zonsopkomst.

De registratie is aangescherpt: **juveniele 0+ baars, pelagisch habitat, herfst 2018, specifieke prooigemeenschap**. De studie mag niet worden gebruikt als adult-profiel of als universele baarsvoorkeur. Maaginhoud/maagvulling is een proxy voor recente voedselopname, niet de totale dagelijkse consumptie of hengelvangbaarheid. De auteurs noemen bovendien verschillende vangstmethoden overdag en 's nachts als potentiële methodische beperking. Bron blijft `approvedForPrediction: false`; geen score of tijdvakgewicht gewijzigd.


## 37. Primaire broncontrole zeelt — veldstudie uit Perm nader begrensd

De volledige beschikbare Engelse publicatie van Bezmaternykh & Shcherbina (2018; DOI 10.1134/S003294521804001X) is gecontroleerd. De auteurs onderzochten 90 zeelten uit één klein, begroeid eutroof water van circa 1,9 ha in Perm krai tijdens de vegetatieperiode van 2013. Van 66 vissen bevatte het spijsverteringskanaal voedsel. Vissen werden met vaste kieuwnetten ongeveer iedere drie uur bemonsterd. De gerapporteerde hoogste voedingsintensiteit lag tussen 18:00–21:00 en 00:00–03:00; de voedselkeuze verschilde tussen leeftijdsgroepen, waaronder vissen van 6–7 jaar.

De registry vermeldt nu steekproef, bemonsteringsinterval, leeftijdsvariatie en één-water/één-jaar-beperking. De meting is maaginhoud-/voedingsindex, niet continue observatie van foerageren of vangbaarheid. De vertaalde Engelse en Russische samenvattingen verschillen over de maand met de laagste consumptie-index; daarom wordt die specifieke maandclaim niet gebruikt. De studie ondersteunt alleen contextgebonden avond-/nachtelijke voedingsintensiteit bij de onderzochte zeeltpopulatie. Geen universele nachtvoorkeur, numerieke bonus of modelparameter. Bron blijft `approvedForPrediction: false`.


## 38. VisCoach: brongebonden biologische context en sessietijd in opgeslagen adviezen

VisCoach toont nu een korte sectie **Biologische context** op basis van het bestaande researchregister. De tekst maakt onderscheid tussen directe tijdgebonden voedselopname, voedingsmetingen zonder dagritme, en uitsluitend beweging/habitat/dieet. Bij direct dagritmebewijs worden levensfase-, seizoen-, habitat- en prooicontext als begrenzing genoemd. De context is expliciet achtergrondinformatie en geen scorebonus of vaste tijdvakvoorkeur. Er is geen levensfase-selector of extra gebruikershandeling toegevoegd.

De primaire sessieadviesregistratie is eveneens gelijkgetrokken met het planadvies: het werkelijke start-/eindtijdvenster van de sessie bepaalt de gebruikte tijdvakconclusie. Wanneer de sessie meerdere tijdvakken beslaat, wordt geen globale dagwinnaar als sessieadvies opgeslagen. Hiermee geldt de gekozen-tijdcorrectie niet alleen voor de planweergave maar ook voor het opgeslagen start-/herbeoordelingsadvies.


## 39. Karper — temperatuurafhankelijk voedingsritme uit 2012 nader begrensd

De gepubliceerde abstract van Chen, Chen & Fan (2012; DOI 10.1016/S1006-8104(12)60039-7) is opnieuw gecontroleerd. De studie betreft expliciet `Cyprinus carpio haematopterus`, niet een onbeperkt representatieve steekproef van alle Europese wilde karpers. De abstract noemt volwassen vissen van 630–850 g en jonge vissen van 61–91 g, getest over 4–34 °C. De gerapporteerde voedingspieken lagen bij 08:00–11:00 en 19:00–23:00; onder 10 °C werd het avondinterval breder tot 04:00. Bij 6 °C bleef de dagelijkse voedselopname zeer laag; de hoogste dagelijkse opname werd bij 28 °C gemeld en nam bij 34 °C weer af.

De registratie noemt nu de ondersoort, gewichtsklassen en temperatuurcontext. Belangrijk: dit zijn experimentele voedselopnamepieken, geen veldmetingen van wilde karper, method-feederactiviteit of hengelvangbaarheid. De hier verifieerbare broninformatie is het abstract; tank-/voeropzet, acclimatisatie, lichtregime en replicatie moeten in de volledige publicatie worden gecontroleerd voordat de evidence-strength wordt verhoogd. De bron blijft `approvedForPrediction: false`; geen score of tijdvakgewicht gewijzigd.


## 40. Roofblei — volledige telemetriebron gecontroleerd, uitsluitend bewegingsbewijs

De volledige beschikbare tekst van Kärgenberg et al. (2022; DOI 10.1007/s10641-022-01298-6) is gecontroleerd. De studie vond plaats in het Estse Emajõgi-meer-riviersysteem. In totaal werden 54 volwassen roofbleien getagd; 53 individuen leverden 12.435 geanalyseerde aankomst-/vertrekgebeurtenissen bij akoestische ontvangers in 2012–2013. De studie definieerde dageraad en schemering als ±1 uur rond lokale zonsopkomst en zonsondergang. In 16 van 24 maandperioden was de bewegingsactiviteit het hoogst rond dageraad en in 6 rond schemering. In juni, juli en september was er geen duidelijk verschil tussen dagdelen; de maandpatronen varieerden ook tussen jaren.

De gemeten respons is verplaatsing tussen detectiezones, niet voedselopname, prooiaanval of jachtsucces. De auteurs noemen een hoofdvoedingsperiode boven circa 12–15 °C, maar die afbakening is gebaseerd op externe literatuur en niet op voedingsmetingen binnen deze telemetriestudie. De populatie is volwassen, noordelijk en sterk migrerend in een doorlopend rivier-meersysteem; bijna 20% van de totale studietijd waarin vissen zich in de grote meren bevonden viel buiten de berekening van rivierbeweging. De bron ondersteunt daarom alleen contextgebonden bewegings-/seizoensinformatie. Geen directe voedingsclaim, tijdvakbonus of vangstkans. De registratie blijft approvedForPrediction false.

## 41. Meerval — Boujard (1995) is direct voedingsbewijs, maar gecontroleerd en sociaal contextgevoelig

Boujard (1995; DOI 10.1016/0031-9384(95)00109-V) beschrijft dagritmes van voedselopname bij Europese meerval die individueel of in groepen werden gehouden en vrije of tijdsbeperkte toegang tot zelfvoerautomaten kregen. De abstract rapporteert sterk nachtelijke voedselopname; bij gedwongen dagvoeren nam de vrijwillige opname af en na terugkeer naar vrije toegang keerde het nachtelijke patroon binnen 24 uur terug. Individueel gehouden vissen konden juist een aritmischer patroon vertonen.

Dit is direct gemeten voedingsgedrag, maar in een gecontroleerde voeropstelling. De beschikbare abstract specificeert geen levensfase, lichaamsgrootte, seizoen of volledige temperatuur-/lichtopzet. Daarom is de bron niet te labelen als adult veldbewijs en mag zij niet worden samengevoegd met de volwassen Portugese telemetrie van Santos et al. (2025) of de EMG-telemetrie van Slavík & Horký (2012), die alleen beweging meten, noch met de vroege juveniele Tsjechische veldstudie (pelagische voedselopname). De bron ondersteunt een soortspecifieke, maar beperkte nachtelijke voedingscontext; geen universele nachtvoorkeur voor alle levensfasen, geen numerieke tijdvakbonus en geen directe vangstkans. approvedForPrediction blijft false.

De aparte registry-entry voor Santos et al. (2025) legt de volwassen veldrespons vast: tien volwassen vissen in het Belver-stuwmeer, 1.322.931 geldige detecties (waarvan 480.826 activiteits- en 842.105 dieptedetecties), gemeten met 3D-accelerometer en druksensor. Activiteit vertoonde doorgaans een schemerpiek, terwijl het verticale dag-nachtpatroon seizoensmatig omkeerde. De respons blijft locomotorische activiteit/diepte; mogelijke predatiepieken zijn geen directe voedselopname. Slavík & Horký (2012) is eveneens afzonderlijk als EMG-bewegingsbewijs geregistreerd.


## 42. Blankvoorn en brasem — voedingsintensiteit, dieetverschuiving en beweging strikt gescheiden

### Blankvoorn: Haertel & Eckmann (2002) versus Jacobsen et al. (2004)

Haertel & Eckmann (2002; DOI 10.1111/j.1095-8649.2002.tb02415.x) beschrijven blankvoorn in een klein mesotroof meer van circa 12 ha. Overdag verbleven de vissen in het littoraal en aten zij vooral littorale prooien; ’s nachts werden zij in het pelagiaal gevonden en domineerden pelagische prooien zoals Daphnia en Chaoborus. De auteurs rapporteren bovendien seizoensverschuivingen in het dagritme van voedingsintensiteit; op geselecteerde dagen werden dieetverandering en voedingsintensiteit met een maagledigingsmethode over 24 uur gekwantificeerd. Dit is direct voedings-/dieetbewijs, maar een habitat- en dieetverschuiving betekent niet automatisch dat de totale voedselopname ’s nachts hoger is.

Jacobsen et al. (2004; DOI 10.1111/j.0022-1112.2004.00436.x) is een aparte radio-telemetriestudie. Blankvoorns van 12–25 cm werden in twee ondiepe meren (helder en troebel) tijdens meerdere 48-uursperioden gevolgd. De bewegingsactiviteit was in beide meren doorgaans het hoogst rond dageraad en schemering en het laagst ’s nachts. Middagactiviteit en ruimtelijke verdeling verschilden echter sterk met helderheid en vermoedelijke predatiedruk. Deze bron meet beweging en habitatgebruik, niet voedselopname. De registry scheidt beide bronnen daarom in afzonderlijke responsen.

### Blankvoorn: Jamet et al. (1990) en leeftijd

Jamet et al. (1990; DOI 10.1127/archiv-hydrobiol/118/1990/371) onderzochten 253 blankvoorns van 98–240 mm in Lac Aydat, met vieruursbemonstering op 20–21 juli 1988. Twee- en driejarige vissen voedden vooral vanaf 14:00 tot de schemering; oudere vissen aten zowel overdag als ’s nachts met variabele intensiteit en periodiciteit. Ook het dieet verschilde tussen leeftijdsgroepen. Dit is een sterk voorbeeld waarom leeftijd een interne onzekerheids-/transferfactor is en geen verplicht gebruikersveld: zonder betrouwbare leeftijdscontext mag de app de jongere tijdsperiode niet op alle blankvoorn toepassen.

### Brasem en blankvoorn: Vašek & Kubečka (2004)

De in-situ studie in het meso-eutrofe Římov-stuwmeer vond bij subadulte/volwassen brasem en blankvoorn die vooral microcrustaceeën aten een overwegend daggebonden voedingsritme met lagere nachtelijke maagvulling. De verschillen waren lengteklasse- en maandafhankelijk: bij brasem 220–330 mm en blankvoorn 200–270 mm in mei, en bij kleinere klassen van circa 110–170 mm in augustus. Dit is geen algemene uitspraak over benthische voeding of aasopname door hengelvis. De bron blijft niet-goedgekeurd voor numerieke voorspelling.


## 43. Fase 2 — formele acceptatiecriteria en huidige status

Fase 2 is pas geaccepteerd wanneer de initiële biologische prognose aantoonbaar evidence-gestuurd, uitlegbaar, veilig en klaar voor lokale verbetering is. Het is nadrukkelijk niet vereist dat elke soort al een numeriek tijdvakgewicht heeft. Een factor zonder voldoende direct en overdraagbaar bewijs blijft beschrijvend of uitgeschakeld.

### Verplichte acceptatiecriteria

1. **Gescheiden biologische responsen**
   - Thermische fysiologische activiteit, voedings-/foerageergedrag, aanwezigheid/habitatgeschiktheid, vangstkans en betrouwbaarheid zijn afzonderlijke uitkomsten.
   - Beweging wordt niet als voedselopname behandeld; habitatgeschiktheid niet als aanwezigheid; groei of verteringsmetabolisme niet als acute vangstactiviteit.
   - De bestaande persoonlijke Poisson-vangstkans blijft herkenbaar als empirische uitgangswaarde en niet als volledige biologische vangstkans.

2. **Bronkwaliteit en overdraagbaarheid**
   - Iedere actieve numerieke factor heeft een direct passende gemeten respons en een controleerbare bron.
   - Per bron zijn soort/populatie, levensfase of grootte, seizoen, watertype/habitat, meetmethode, respons en overdraagbaarheidsbeperkingen vastgelegd. Onbekende kenmerken blijven expliciet onbekend.
   - Abstract-only of secundair ontsloten bewijs mag als context worden geregistreerd, maar blijft niet-goedgekeurd voor numerieke toepassing totdat de onzekerheid is opgelost.
   - Alle factoren die niet aan deze eisen voldoen blijven uit de numerieke prognose.

3. **Water- en omgevingsdata**
   - Watertemperatuur heeft herleidbare herkomst, meettijd en waar beschikbaar methode/diepte; voorspelde waarden tonen hun onzekerheid en actualiteit.
   - Luchttemperatuur vervangt nooit een ontbrekende watertemperatuur.
   - Bij onvoldoende thermische basis geeft het systeem geen stellige thermische conclusie.

4. **Tijdvak- en gedragslogica**
   - Een tijdvakvoorkeur mag alleen steunen op soortspecifiek bewijs voor de relevante voedings-/foerageerrespons.
   - Dageraad-, schemer- of nachtelijke beweging blijft afzonderlijke context en wordt niet automatisch een voedingsbonus.
   - Als bewijs geen betekenisvol onderscheid ondersteunt, blijven tijdvakken gelijkwaardig; er wordt geen kunstmatige winnaar gekozen.
   - De gekozen sessietijd stuurt VisCoach-advies. Bij sessies over meerdere tijdvakken wordt geen globale beste periode opgedrongen.

5. **Lokale leer- en evaluatieketen**
   - Prognoses bewaren reproduceerbare snapshots; afgeronde sessies en uitkomsten worden correct gekoppeld.
   - Historische evaluatie gebruikt alleen informatie die op het voorspeltijdstip beschikbaar was; geen toekomstlekken.
   - Benchmark-/testdata en uitgesloten historische data worden niet als persoonlijke trainingsdata gebruikt.
   - Brier Skill Score en de bestaande baseline blijven chronologisch berekend. Bij kleine aantallen worden softwareminimums niet gepresenteerd als statistisch bewijs.
   - Na de clean start is lokale kalibratie pas een claim wanneer voldoende nieuwe, vergelijkbare sessies bestaan; tot die tijd toont het model onzekerheid en blijft het conservatief.

6. **Gebruiksvriendelijkheid en VisCoach**
   - De gebruiker hoeft geen levensfase, leeftijd of uitgebreid foerageerformulier in te vullen.
   - De normale invoer blijft beperkt tot doelsoort, stek en gewenste starttijd; aanvullende gegevens zijn optioneel en alleen wanneer ze aantoonbaar waarde toevoegen.
   - De Visser houdt altijd de keuze; VisCoach ondersteunt en legt uit, maar schrijft geen stek of tijdvak dwingend voor.

7. **Technische borging**
   - Regressietests bewaken bronclassificatie, ontbrekende data, provenance, sessie-/snapshotkoppeling en chronologische evaluatie.
   - De Quality Gate slaagt op de exacte PR-head en opnieuw op de mergecommit in main.
   - Architectuur, audit en hervattingspunt in issue #49 blijven onderling consistent.

### Huidige status

| Onderdeel | Status |
|---|---|
| Responslagen en bronclassificatie | **Grotendeels geborgd** |
| Waterdata-provenance en onzekerheid | **Gerealiseerd** |
| VisCoach-tijdvakselectie en eenvoudige invoer | **Gerealiseerd** |
| Primaire bron- en overdraagbaarheidsaudit | **Nog bezig** |
| Lokale leer-/evaluatieketen | **Technisch gerealiseerd** |
| Statistische lokale kalibratie na clean start | **Wacht op nieuwe data** |
| Formele Fase 2-acceptatie | **Nog niet vrijgegeven** |

De ontbrekende lokale sessiedata blokkeren niet de technische bouw van een conservatief initiëel model, maar blokkeren wel claims dat soortspecifieke vangstkansen of numerieke tijdvakgewichten lokaal gevalideerd zijn. Fase 3 start pas nadat de bovenstaande implementatiecriteria zijn afgevinkt en de resterende onzekerheden expliciet als niet-actieve factoren zijn vastgelegd.


## 44. Primaire broncontrole — brasem, blankvoorn, snoek en snoekbaars (17 november 2026)

Deze controle verfijnt de overdraagbaarheid van dagritmebronnen. Zij activeert geen score, tijdvakgewicht of vangstkans.

### Brasem en blankvoorn

- **Vašek & Kubečka (2004)**: de beschikbare samenvatting beschrijft in-situ maagvulling en zoöplanktonconsumptie in het meso-eutrofe Římov-stuwmeer. Subadulte/volwassen brasem en blankvoorn die vrijwel uitsluitend microcrustaceeën aten, vertoonden overdag meer voeding en 's nachts een duidelijke daling van maagvulling. De verschillen traden op bij specifieke lengteklassen en maanden. Dit ondersteunt geen algemene dagbonus voor bodemvisserij of aasopname; gedetailleerde steekproef- en bemonsteringsmethoden zijn nog niet onafhankelijk uit de volledige paper geverifieerd.
- De bron wordt daarom uitsluitend als contextspecifiek direct voedingsbewijs behandeld: prooitype, lengteklasse, maand en watertype zijn bepalend. De geregistreerde uitkomst blijft niet-goedgekeurd voor voorspelling.

### Blankvoorn — seizoens- en habitatcontext

- **Haertel & Eckmann (2002)**: de uitgeverssamenvatting van de volledige publicatie beschrijft een klein mesotroof meer van circa 12 ha. Blankvoorn gebruikte overdag vooral het litoraal en 's nachts het pelagiaal; dieet en voedingsintensiteit verschilden per seizoen. Op geselecteerde dagen werden dieetcompositie en voedingsintensiteit over 24 uur met een maagledigingsmethode kwantitatief gevolgd.
- De studie toont dat dieet- en habitatverschuivingen de berekening van dagelijkse rantsoenen beïnvloeden. Zij rechtvaardigt niet dat nachtelijke pelagische aanwezigheid als hogere totale voedselopname of betere vangstkans wordt geïnterpreteerd.
- **Hautala (2008)**: de uitgeverssamenvatting beschrijft vangst-/trappingonderzoek in de oeverzone van een groot boreaal meer. In de herfst verschoof de blankvoornvoeding van dag naar schemering toen de watertemperatuur ongeveer van 20 naar 10 °C daalde; rond 5 °C bleef later in de herfst een laag maar stabiel niveau van nachtelijke activiteit bestaan. De auteurs noemen predatierisico, voedselvraag en voedselbeschikbaarheid als mogelijke verklaringen. De studie is geen bewijs dat temperatuur op zichzelf de verschuiving veroorzaakt en is niet één-op-één overdraagbaar naar Nederlandse wateren.

### Snoek

- **Lucas et al. (1991)**: de volledige uitgeverssamenvatting is gecontroleerd. Hartslagtelemetrie bij snoek in Lochs Kinord en Davan (Schotland), met registraties tot vijf dagen, schatte voedselopname op circa 1,5% van het natte lichaamsgewicht per dag. Kleine prooien werden overdag gevangen; de specifieke dynamische werking van voedsel/verteringsmetabolisme liep door in middag en nacht.
- Dit is directe voedingscontext, maar geen gekwantificeerde verdeling van voedselopname over de dag. Het tijdstip waarop prooien werden gevangen mag niet worden verward met de latere vertering. De beperkte duur en twee meren begrenzen overdracht.

### Snoekbaars

- **Fedorova & Drozhzina (1982)**: de beschikbare secundair ontsloten samenvatting beschrijft een seizoensafhankelijk voedingsritme in het Ladogameer: één vroege ochtendpiek in juni–augustus en een tweede avondpiek in september. In juni speelde reproductieve vastenperiode bij volwassen vissen mee; prooivisverdeling werd als mogelijke verklaring genoemd.
- Omdat de oorspronkelijke volledige publicatie en methodedetails in deze controle niet rechtstreeks zijn geverifieerd, blijft de registratie beperkt bewijs. Geen vaste ochtend-, avond- of schemerbonus; seizoen, reproductiestatus en prooigedrag zijn relevante maar in de app doorgaans onbekende context.

### Registerkwaliteit en besluit

- Een dubbele registratie van dezelfde Poulet et al. (2005)-telemetriestudie is verwijderd. De overblijvende canonieke registratie houdt de gemeten uitkomst expliciet op locomotorische activiteit; zij wordt niet als voedingsritme geteld.
- Tests bewaken de unieke registratie, de scheiding tussen snoekprooivangst en vertering, en de contextbeperkingen van blankvoorn-/brasemvoeding.
- Alle genoemde bronnen blijven `approvedForPrediction: false`. Geen operationele profielparameter, activiteitsscore, tijdvakrangschikking of persoonlijke vangstkans is gewijzigd.
- De primaire broncontrole is nog niet compleet: de volledige methoden van Vašek & Kubečka (2004), de oorspronkelijke tekst van Fedorova & Drozhzina (1982) en verdere soort-/watertype-overdraagbaarheid blijven open.


## 45. Snoekbaars — volledige methodescope van twee telemetriestudies (17 november 2026)

De volledige beschikbare tekst van Poulet et al. (2005) en Horký et al. (2008) is gecontroleerd. Beide zijn directe telemetriemetingen van verplaatsing, geen directe voedingsmetingen.

- **Poulet et al. (2005), Fumemorte-kanaal (Rhônedelta):** 13 volwassen snoekbaarzen werden getagd; 9 konden succesvol worden gevolgd. De studie liep van maart tot juni 2002 tijdens de paaiperiode. Maandelijks werden 24-uursessies uitgevoerd met positiebepaling om de twee uur. Beide seksen vertoonden gemiddeld een bewegingspiek rond avondschemering, maar individuele patronen weken af. De berekende afstand tussen opeenvolgende posities is een minimale afstand en onderschat de werkelijke verplaatsing.
- **Horký et al. (2008), Elbe:** 8 volwassen snoekbaarzen werden radio-getagd en gedurende 12 maanden gevolgd in 47 volledige 24-uurscycli, met posities per circa drie uur. Verplaatsingsactiviteit was significant hoger bij dageraad en schemering dan overdag en 's nachts. De vissen gebruikten overdag dieper water, verplaatsten zich bij twilight richting ondiep water en verbleven 's nachts in de littorale oeverzone. De auteurs interpreteerden die nachtelijke positie waarschijnlijk als rust, niet als jacht.
- De twee onafhankelijke telemetriestudies ondersteunen een terugkerende schemeringspiek in **beweging** bij volwassen snoekbaars in twee verschillende systemen. Zij bewijzen geen schemerpiek in voedselopname, jachtsucces of hengelvangbaarheid. Het Ladogameer-voedingsonderzoek blijft een aparte, secundair ontsloten bron met seizoensgebonden voedingsritme.

De registry vermeldt nu de steekproef, meetfrequentie, periode en beperkingen explicieter. Tests bewaken dat beide studies uitsluitend als locomotorische/habitatcontext beschikbaar zijn. Alle bronnen blijven niet-goedgekeurd voor numerieke voorspelling; er is geen score, tijdvakgewicht of vangstkans aangepast.


## 46. Tijdvakfactor losgekoppeld van verouderde profielvoorkeuren (17 november 2026)

De systematische codecontrole vond dat prognosisEngine.ts de velden preferredSlots en crepuscularBonus uit fishProfiles.ts nog gebruikte voor de verklarende tijdvaktekst. Deze velden wijzigden de numerieke score niet, maar konden wel een schijnbare soortvoorkeur communiceren die niet aansloot op de recent aangescherpte responsclassificatie. Met name beweging/telemetrie mocht daardoor te gemakkelijk als schemer- of voedingsvoorkeur worden gelezen.

De oude profielvelden zijn verwijderd. De tijdvakfactor gebruikt nu uitsluitend de soortgekoppelde dielBehaviorEvidenceService:
- directe tijdgebonden voedingsmetingen worden als context genoemd, met expliciete waarschuwing dat alle huidige bronnen niet-goedgekeurd en contextgebonden zijn;
- uitsluitend bewegings-/habitatbewijs wordt expliciet niet als voedingsvoorkeur vertaald;
- zonder soortspecifiek tijdgebonden bewijs wordt geen voorkeur afgeleid;
- de numerieke tijdvakfactor blijft in alle gevallen neutraal; zonne-/schemercontext blijft afzonderlijk beschrijvend.

Regressietests bewaken karper (direct maar niet-goedgekeurd voedingsritme), roofblei (beweging zonder voedingsritme) en de generieke fallback. Er zijn geen thermische scores, tijdvakrangschikkingen, profieltemperaturen of persoonlijke vangstkansen gewijzigd.


## 47. Audit resterende profielvelden en volledige vijf-responsketen (17 november 2026)

### 47.1 Wat de soortprofielen daadwerkelijk doen

De codecontrole onderscheidt actieve modelparameters van verklarende profielnotities:

- **Actief in de thermische visrespons:** `thermalOptimum`, `thermalWidthCold` en `thermalWidthWarm` voeden de asymmetrische Gaussische efficiëntiecurve. De uitkomst gaat via `1 + 9 × efficiency^0.85` naar de voorlopige thermische activiteitspotentie. Deze waarden zijn nog geen per soort, levensfase en watertype empirisch gefitte Nederlandse veldcurves.
- **Alleen verklarende classificatie:** `optimalTempRange` en `tolerableTempRange` beïnvloeden de tekst en positief/neutraal/negatief-classificatie van de temperatuurfactor, maar niet de berekende thermische efficiëntie zelf. Het zijn voorlopige profielgrenzen, geen gevalideerde fysiologische grenzen.
- **Alleen context / geen biologische scorebijdrage:** windrichting, winddrempel, druk, seizoen, bewolking en neerslag wijzigen de thermische activiteitsscore niet. De profielnotities voor wind, bewolking en regen kunnen wel in tekst verschijnen.
- **Niet aangesloten op de prognoseberekening:** `seasonalWeights`, `pressureSensitivity` en `optimalPressureRange` zijn in de actuele prognoseketen geen numerieke factoren. Een profielwaarde die alleen in het type/object bestaat, is geen actief modelbewijs.

Een specifiek aandachtspunt is `disruptiveWindThresholdKmH`: de grens verschilt per doelsoort, terwijl de bijbehorende tekst gaat over praktische zaken als aasaanbieding, lijncontrole en beetregistratie. Dat zijn geen aangetoonde soortspecifieke biologische drempels. Dit mag niet worden gelezen als een biologische windgevoeligheid of vangstcorrectie.

### 47.2 De vijf responslagen — huidige implementatiestatus

| Responslaag | Huidige implementatie | Wat de uitkomst nadrukkelijk niet betekent |
|---|---|---|
| 1. Thermische activiteitspotentie | Eén voorlopige soortcurve op basis van watertemperatuur; de waterthermische engine levert gemeten/geschatte temperatuur en provenance. | Geen directe meting van totale beweging, voedselopname of vangstkans. |
| 2. Voeding / foerageren | `feedingEvidenceService` toont per soort de geregistreerde responsvariabelen en goedkeuringsstatus. Er wordt nog geen numerieke voedingsintensiteit of foerageerkans berekend. | Een geregistreerde studie of voedingsritme is nog geen lokale, actuele voedingsprognose. |
| 3. Aanwezigheid / habitat | `habitatMovementEngine`, `bankWindEngine` en `rodPositioningEngine` leveren kwalitatieve habitat-, bewegings- en positioneringshypothesen. | Geen gekalibreerde kans dat de doelvis op de gekozen stek aanwezig is. De confidenceLevel is heuristisch. |
| 4. Vangkans | Persoonlijke Poisson-baseline uit vergelijkbare, afgeronde sessies met bekende duur en doelsoortvangsten. De uurvangstsnelheid wordt vermenigvuldigd met een beperkte factor uit de thermische dagscores en omgezet naar een sessieduurkans. | Geen geïntegreerd biologisch model van aanwezigheid × foerageren × aas/techniek. De huidige historie is niet volledig gesegmenteerd op tijdvak of techniek. |
| 5. Betrouwbaarheid / evaluatie | Datakwaliteitsrapport, bron/provenance, onzekerheidsnotities, steekproefgebaseerd catch-confidence-label, Wilson-interval voor historisch sessiesucces en chronologische Brier-/rolling-baseline-evaluatie. | Geen enkel gekalibreerd totaalbetrouwbaarheidspercentage. Het Wilson-interval hoort bij historische sessiesuccesfractie, niet bij de Poisson-duurkans. De softwareminimums bewijzen geen statistische robuustheid. |

### 47.3 Koppelingen en beperkingen die expliciet blijven

- De thermische analyse wordt op dit moment eenmaal voor de doeldag berekend en gedeeld door de vier kloktijdvakken. Omdat de numerieke tijdvakfactor neutraal is, ontstaat geen biologisch tijdvakverschil uit de huidige thermische laag. Gelijke tijdvakken zijn dus een geldige uitkomst; een willekeurige winnaar toevoegen is niet toegestaan.
- De persoonlijke vangstkans gebruikt de thermische dagscore als beperkte correctie op het historische vangsttempo. Voeding en habitat-aanwezigheid zijn daarin nog geen afzonderlijke gekwantificeerde componenten.
- De persoonlijke vangstkans gebruikt de geselecteerde doelsoort en, waar gekozen, stek; de huidige Poisson-baseline is niet afzonderlijk gekalibreerd op techniek, aas, rig of gekozen tijdvak.
- De waterthermische schatting bevat eigen aannames over waterdiepte, thermische traagheid, weersdekking en warmte-uitwisseling. De lokale temperatuurkalibratie is een aparte temperatuurcorrectie en valideert niet automatisch de soortspecifieke visresponscurve.
- Een ontbrekende waarneming blijft onbekend. Geen vis zien is geen bewijs van afwezigheid; sessie-waarnemingen zonder expliciet observatietijdstip zijn geen tijdgebonden trainingslabels.

### 47.4 Vervolg en acceptatievoorwaarden

1. Maak een herkomstmatrix voor alle **actieve** numerieke parameters in zowel de waterthermische schatting als de soortspecifieke visresponscurve. Leg per parameter vast: bron/responsvariabele, meetcontext, soort, levensfase, watertype, overdraagbaarheid, onzekerheid en status (mechanistische prior, empirisch gekalibreerd of uitsluitend heuristisch).
2. Ruim daarna de niet-aangesloten of misleidende profielnotities op. Praktische windpresentatie mag niet afhangen van een niet-onderbouwde soortspecifieke biologische drempel. Verwijder ongebruikte configuratievelden in een afzonderlijke geteste wijziging.
3. Houd de vijf responslagen gescheiden totdat er voor een koppeling directe data, een reproduceerbaar inputcontract en chronologische validatie bestaan.
4. Presenteer de huidige persoonlijke vangstkans expliciet als historische, thermisch gecorrigeerde baseline; niet als geïntegreerde kans uit alle vijf lagen.
5. Breid forward validation alleen uit met echte, chronologisch geldige sessies. Geen synthetische vangsten, teruggeplaatste historie of willekeurige gewichten.
6. Fase 2 blijft open. Fase 3 start pas nadat de actieve parameters, vijf responslagen, snapshot-reproduceerbaarheid, datakwaliteit en forward validation aantoonbaar zijn geaccepteerd.

De volledige Quality Gate op PR #84 mergecommit `7f7f774ae6e0c2bf49f8248b62504ba2b092cf27` is bevestigd: push-run #652 (`44088544933`) is volledig geslaagd, inclusief audits, typecheck, alle regressies en productiebuild.

## 48. Herkomstmatrix actieve thermische parameters (17 november 2026)

### 48.1 Watertemperatuurschatting: codeparameters versus fysische onderbouwing

De huidige `waterThermalEngine.ts` is een vereenvoudigde, heuristische schatter. De fysische richting van de gebruikte factoren is herkenbaar uit de literatuur, maar de concrete coëfficiënten zijn niet afkomstig uit het KNMI-model en zijn nog niet lokaal gefit.

| Onderdeel in code | Huidige instelling | Status / beperking |
|---|---|---|
| Dagelijkse respons op luchttemperatuur | Diepte/watertype kiest `responseWeight` 0,45 / 0,28 / 0,18 | Heuristische fracties; niet gekalibreerd op Lokkershoek of een representatieve Nederlandse plas. |
| Thermische tijdconstante | 54 / 96 / 150 uur afhankelijk van diepteklasse | Heuristische tijdconstanten; geen gemeten warmtecapaciteit of lokale temperatuurprofiel-fit. |
| Historische temperatuurweging | 24-uursgemiddelde 0,65 en 72-uursgemiddelde 0,35 | Technische smoothing-keuze, geen universele fysische verhouding. |
| Zonnestralingsbijdrage | 0,35 bij opwarming en 0,12 bij afkoeling; aanvullende dieptebonussen 0,8 / 0,4 | Heuristische coëfficiënten; geen gevalideerde netto-warmtebalans. |
| Windmenging | Multipliers 0,82 / 0,92 / 1,08 bij grenzen 20 en 9 km/u | Heuristische correctie; werkelijke menging hangt ook af van fetch, vorm, diepte, stratificatie en oeverbeschutting. |
| Onzekerheidsmarge | Onder meer 0,45 °C basis, 0,009 °C per verstreken uur en extra marge bij beperkte dekking | Modelmatige onzekerheidsmarge, geen statistisch gekalibreerd voorspellingsinterval. |
| Lokale temperatuurkalibratie | Minimaal 8 eerdere geldige paren; shrinkage n/(n+8); correctie begrensd op ±1,5 °C | Corrigeert gemiddelde bias per locatie/seizoen. Dit kalibreert niet de fysieke tijdconstanten, warmtefluxen of soortcurve. |

De KNMI-beschrijving ondersteunt kwalitatief dat lucht-waterwarmte-uitwisseling, verdamping, straling, wind en waterdiepte belangrijk zijn. Het KNMI rapporteert circa 1 °C verificatie voor **het eigen operationele model voor stilstaand zoet buitenwater**; die nauwkeurigheid mag niet aan Vislogboek worden toegeschreven. De huidige implementatie is geen kopie van dat model en gebruikt niet dezelfde gedocumenteerde volledige warmtebalans.

Piccolroaz et al. (2024) beschrijven verschillende modelklassen, waaronder 0.5D- en 1D-modellen, waarin stratificatie en verticale menging expliciet kunnen worden meegenomen. Feldbauer et al. (2025) kalibreerden vier 1D-modellen op 73 meren en vonden dat parameters en modelprestaties verschillen tussen modellen en meerclusters; geen enkel model presteerde overal het best. Dit ondersteunt lokale kalibratie en onzekerheidsbewaking, niet het overnemen van één universele set coëfficiënten.

### 48.2 Soortspecifieke thermische curve: wat de bronnen wel en niet dragen

De huidige Gaussische curve gebruikt per soort een `thermalOptimum` en twee breedtes. De onderzochte bronnen meten echter verschillende responsen. SMR/RMR is niet hetzelfde als aerobe scope; aerobe scope is niet hetzelfde als voedselopname; geen van beide is automatisch hengelvangbaarheid.

| Soort | Beschikbare relevante temperatuurdata | Wat ontbreekt voor de huidige curve |
|---|---|---|
| Karper | Moffitt & Crawshaw (1983): acute metabole respons na acclimatisatie op 19 °C, Q10 2,61. Chen et al. (2012): temperatuurafhankelijke voedselopname bij een Aziatische ondersoort in gecontroleerde omstandigheden. | Geen complete, overdraagbare Nederlandse aerobe-scopecurve. De huidige optimum- en breedtewaarden zijn priors, geen gefitte respons. |
| Brasem | Hölker (2006): SMR/RMR bij 5–23 °C en 1–560 g; exponentiële temperatuurafhankelijkheid en grootte-/levensfaseverschillen. | Geen direct gemeten aerobe-scopeoptimum dat de huidige Gaussische top en breedtes valideert. |
| Snoek | Diana (1982): metabole metingen bij onder meer 2 en 14 °C; oudere syntheses bundelen aanvullende zuurstofverbruiksmetingen uit verschillende populaties. | Geen uniforme, gecontroleerde aerobe-scopecurve waarmee een soortbreed optimum en twee Gaussische breedtes kunnen worden gefit. |
| Baars | Christensen et al. (2020): SMR, MMR en aerobe scope bij 15–28 °C. Het optimum voor aerobe scope verschuift met lichaamsmassa; vissen onder 40 g vertoonden geen daling van aerobe scope tot 28 °C. | Een vast optimum voor alle lengtes/levensfasen is niet verdedigbaar; de huidige curve is geen populatie- of groottegecorrigeerde fit. |
| Blankvoorn | Hölker (2003): SMR/RMR bij 5–23 °C en 3–200 g; exponentiële temperatuurafhankelijkheid en lichaamsgrootte-effecten. | Metabole onderhoudsrespons is geen directe aerobe-scope- of voedingsoptimumcurve. |
| Zeelt | Er is beperkte metabole informatie bij een enkele warme meetconditie en aanvullend voedings-/gedragsbewijs. | Geen vergelijkbare multi-temperatuur aerobe-scopecurve; huidige optimum en breedtes blijven heuristisch. |
| Snoekbaars | Frisk et al. (2012): volwassen kweekvissen, zes temperatuurcondities tussen 13 en 28 °C; maximale aerobe scope bij 18,8 °C en 80%-bereik 10,4–26,9 °C. Eerder juveniel kweekonderzoek rapporteerde een hoger optimum. | De huidige profielpiek van 15 °C en het smallere profielbereik sluiten niet aan op de volwassen studie. Maar de bron betreft aquacultuur; overdracht naar vrijlevende Nederlandse vissen en levensfasen is onzeker. Geen parameter wordt zonder verdere validatie aangepast. |
| Meerval | Er zijn afzonderlijke metabole/zuurstof- en bewegingsbronnen, maar geen vergelijkbare soortspecifieke multi-temperatuur aerobe-scopecurve in het huidige register. | Geen onderbouwde soortbrede Gaussische piek of koude-/warme breedte. |
| Roofblei | Geen direct bruikbare soortspecifieke multi-temperatuur aerobe-scopecurve in het huidige register. | Huidige piek en breedtes zijn heuristische fallback-priors. |
| Overig | Geen doelsoortspecifieke fysiologische bron. | Generieke curve mag niet als biologische parameter van een concrete soort worden geïnterpreteerd. |

### 48.3 Belangrijkste modelconclusie

1. De huidige per-soort `thermalOptimum` en `thermalWidthCold/Warm` zijn voorlopige modelpriors. De exacte waarden en curvevorm zijn voor geen van de negen concrete soorten volledig gevalideerd met een passende Nederlandse veldrespons.
2. Een stijgende SMR/RMR met temperatuur bewijst niet dat totale activiteit, aerobe capaciteit of voedselopname tot hetzelfde optimum stijgt. Een Gaussische piek mag niet uit uitsluitend SMR/RMR-data worden afgeleid.
3. Baars en snoekbaars hebben directer aerobe-scopebewijs, maar ook daar zijn lichaamsgrootte, levensfase en gecontroleerde kweekomstandigheden belangrijke transferbeperkingen.
4. De huidige snoekbaarsprofielpiek wijkt af van het gepubliceerde adulte aerobe-scopeoptimum. Dit is een concrete reviewflag, geen opdracht om de waarde nu automatisch te vervangen.
5. De watertemperatuurschatter en de visfysiologische respons moeten apart worden gekalibreerd. Een goede lokale temperatuurfit valideert niet automatisch de biologische curve.

### 48.4 Besluit en volgende stap

- Geen bestaande numerieke parameter, score, tijdvakrangschikking of vangstkans gewijzigd.
- De 2025-meer-modelkalibratiestudie is aan het researchregister toegevoegd als omgevings-/kalibratiekennis, niet als directe voorspellingsregel.
- Volgende modelstap: ontwerp een evidence-aware thermische respons waarbij directe aerobe-scopecurves, metabole Q10-gegevens en voedingsresponsen gescheiden blijven. Gebruik SMR/RMR-only bronnen niet als bewijs voor een fysiologisch optimum. Voor soorten zonder geschikte curve blijft de onzekerheid expliciet en wordt geen schijnprecisie toegevoegd.
- Voor de waterthermische engine volgt een lokale validatie op echte, tijdgestempelde metingen; pas daarna mogen tijdconstanten en warmtefluxcoëfficiënten worden herfit.
- Alle bronnen blijven niet-goedgekeurd voor numerieke voorspelling. Fase 2 blijft open; Fase 3 start niet.

## 49. Thermische bronstatus zichtbaar gemaakt in de prognose (17 november 2026)

De temperatuurfactor toont naast de watertemperatuurrespons een korte soortspecifieke bronstatus. Dit is uitsluitend uitleg; de thermische curve, score, factorimpact, tijdvakken en vangstkans veranderen niet.

- **Baars en snoekbaars:** direct aerobe-scopeonderzoek is geregistreerd, maar de bronnen zijn contextgebonden en niet goedgekeurd voor numerieke voorspelling. Bij baars is lichaamsgrootte relevant; bij snoekbaars gaat het onder meer om volwassen kweekvissen en levensfase.
- **Karper, snoek, brasem en blankvoorn:** metabole temperatuurmetingen zijn geregistreerd, maar geen directe aerobe-scopecurve. SMR/RMR is niet hetzelfde als activiteit of voedselopname en bewijst geen activiteitoptimum.
- **Zeelt, meerval, roofblei en Overig:** geen soortspecifieke meer-temperaturenmeting van aerobe scope of metabolisme in het huidige register. De curve blijft een voorlopige prior en wordt niet als soortspecifiek gevalideerd gepresenteerd.

De factornaam is verduidelijkt van 'Temperatuur & Metabolisme' naar **'Thermische activiteitspotentie'**. Regressietests bewaken de bronclassificatie en non-approval. Er is geen numerieke modelwijziging uitgevoerd.

## 50. Verwijderen van niet-onderbouwde profielvoorkeuren en grenzen (17 november 2026)

De ongebruikte of misleidende profielvelden zijn verwijderd: seizoensgewichten, drukgevoeligheid/-bereik, soortspecifieke windvoorkeuren/-drempels en regen-/bewolkingsvoorkeuren. Ze leverden geen gevalideerde biologische scorebijdrage; enkele werden alleen als voorlopige tekst getoond. Wind-, seizoen-, druk-, bewolkings- en neerslaggegevens blijven feitelijke context zonder profielbonus.

Ook de niet-gevalideerde optimale en tolerabele temperatuurzones zijn uit de soortprofielen verwijderd. De thermische responsberekening behoudt dezelfde voorlopige Gaussische curveparameters (`thermalOptimum`, `thermalWidthCold`, `thermalWidthWarm`), zodat de bestaande numerieke thermische activiteitsscore bij dezelfde temperatuur niet verandert. De temperatuurfactor krijgt voortaan altijd een neutrale impactclassificatie; een positieve/negatieve grens zou een gevalideerd fysiologisch optimum of tolerantie suggereren dat de bronnen niet dragen.

In het soortprofielpaneel worden de interne waarden alleen nog getoond als **voorlopige modelpiek** en **curvebreedtes**, met een expliciete waarschuwing dat dit geen empirisch gevalideerde optimum- of tolerantiegrenzen zijn. Het barometerbereik en de optimale temperatuurzone zijn verwijderd.

Windpresentatie is nu soortneutraal en feitelijk: gemeten richting en snelheid plus een uitleg dat praktische invloed afhangt van stek, oever en methode. Er is geen soortafhankelijke harde-winddrempel of windvoorkeur meer. Seizoen, regen en bewolking krijgen geen niet-onderbouwde profielnotitie.

Regressietests bewaken de neutrale temperatuurimpact en het behoud van de thermische berekening. Geen numerieke thermische parameters, activiteitsscores of persoonlijke vangstkansen gewijzigd.

## 51. Doorwerking van watertemperatuuronzekerheid naar thermische score (17 november 2026)

Wanneer de watertemperatuur geschat is en de waterthermische engine een onder- en bovengrens levert, toont de temperatuurfactor nu ook een indicatieve thermische scoreband. De band wordt berekend door de bestaande voorlopige soortcurve op de grenzen en, indien binnen het interval, de modelpiek toe te passen. De centrale score blijft berekend op de centrale geschatte watertemperatuur en verandert niet.

De tekst benoemt expliciet:
- het temperatuurinterval waarop de band is gebaseerd;
- de bijbehorende relatieve thermische activiteitsscoreband;
- dat dit uitsluitend de doorwerking van watertemperatuuronzekerheid toont;
- dat het geen statistisch betrouwbaarheidsinterval is en de onzekerheid in de soortcurve zelf niet omvat.

Bij een rechtstreeks gemeten watertemperatuur wordt geen geschatte scoreband getoond. Er is geen vangstkans, biologisch gewicht of numerieke modelparameter gewijzigd.

## 52. Persoonlijke vangstkans losgekoppeld van de voorlopige thermische score (17 november 2026)

De Poisson-vangkans gebruikte eerder een vaste thermische multiplier `0,88 + (dagScore / 10) × 0,24`. Deze 0,88–1,12-schaal was niet empirisch afgeleid en koppelde een voorlopige thermische profielcurve rechtstreeks aan persoonlijke vangstfrequentie.

De multiplier is verwijderd. De persoonlijke Poisson-baseline gebruikt nu uitsluitend het historische vangsttempo per geregistreerd visuur en de geplande sessieduur. `hourlyCatchRate` blijft het ruwe historische tempo; `expectedCatches` en `personalCatchChance` worden rechtstreeks uit dit tempo berekend. De thermische activiteitspotentie blijft een afzonderlijke prognoserespons en beïnvloedt de persoonlijke vangstkans niet.

De onzekerheidsnotitie in de app benoemt dat voeding en habitat evenmin numeriek zijn geïntegreerd. Een toekomstige koppeling vereist directe data en chronologische validatie; er wordt geen vervangende multiplier toegevoegd. Regressietest controleert dat een andere thermische dagscores de historische Poisson-vangkans niet wijzigt wanneer historische sessies, soort en duur gelijk blijven.

## 53. Poisson-steekproefbasis en betrouwbaarheidslabel gecorrigeerd (17 november 2026)

De eerdere UI noemde het categorie-label 'Laag/Matig/Redelijk/Hoog' **betrouwbaarheid** en toonde daarbij het aantal vergelijkbare sessies. Dat was niet exact: het label werd berekend uit sessies met bekende duur, terwijl de Poisson-rate alleen sessies gebruikt met zowel bekende duur als bruikbare vangstaantallen. Het aantal vergelijkbare sessies voor de Wilson-basissessiefractie kan dus verschillen van de Poisson-steekproef.

De implementatie is gecorrigeerd:
- `poissonSessionCount` registreert expliciet het aantal sessies dat daadwerkelijk in de Poisson-rate wordt gebruikt.
- De categoriegrenzen voor de steekproefbasis gebruiken nu `poissonSessions.length`, niet het bredere aantal sessies met alleen bekende duur.
- De UI noemt dit **Steekproefbasis**, toont het aantal bruikbare Poisson-sessies en vermeldt via tooltip dat dit geen statistische betrouwbaarheid van de voorspelde Poisson-kans is.
- De Wilson-interval blijft afzonderlijk gekoppeld aan het historische sessiesucces over alle vergelijkbare sessies; dit is geen interval rond de Poisson-duurkans.

Regressietest bevat nu een geval waarin 11 sessies vergelijkbaar zijn, maar slechts 9 bruikbare Poisson-sessies hebben. De steekproefbasis moet dan 'Laag' blijven op basis van N=9.

## 54. Modelonderbouwing onderscheiden van statistische betrouwbaarheid (17 november 2026)

De gebruikerslabels voor waterthermische kwaliteit, stekpositionering en habitatbeweging zijn verduidelijkt. Deze categorieën zijn kwalitatieve indicaties van de beschikbare databasis of onderbouwing; ze zijn geen gekalibreerde waarschijnlijkheden of statistische betrouwbaarheidspercentages.

- Watertemperatuur: **Databasis watertemperatuur**, gebaseerd op meetbron, weersdekking, ouderdom en beschikbaarheid van lokale ankers.
- Positionering: **Onderbouwing stekadvies**, afhankelijk van onder meer oevergeometrie, windinformatie en lokale context.
- Habitat: **Onderbouwing habitatinschatting**, een kwalitatieve indicatie bij een ruimtelijke zoekhypothese.

De persoonlijke Poisson-vangkans blijft afzonderlijk gekoppeld aan de expliciete historische steekproefbasis en het Wilson-interval voor historisch sessiesucces. Er is geen modelberekening gewijzigd.

## 55. Modelversie gescheiden in Brier-evaluatie (17 november 2026)

De persoonlijke Poisson-vangkans is gewijzigd door de ongevalideerde thermische multiplier te verwijderen. Daarom is de prognoseversie verhoogd naar `v2.5-personal-poisson-baseline` en de prognosis-engineversie naar `1.1.0`.

De Brier-evaluatie scoort voortaan uitsluitend momentopnames van de actuele `PROGNOSIS_MODEL_VERSION`. Momentopnames van oudere of afwijkende modelversies worden uitgesloten van de huidige modelscores en expliciet gerapporteerd. Zo worden kansen uit de oude thermisch vermenigvuldigde formule niet vermengd met de nieuwe zuiver historische Poisson-baseline.

De chronologische naive baseline mag nog wel afgeronde sessie-uitkomsten uit oudere modelversies gebruiken: die baseline gebruikt uitsluitend de werkelijk waargenomen uitkomst van een eerder beëindigde sessie, niet de oude voorspelde kans. De traininggeschiedenis blijft dus bruikbaar zonder modelversies te mengen in de te beoordelen voorspellingen.

Regressietest bewaakt beide kanten: oude modelversie wordt niet gescoord, maar een afgeronde oude sessie mag wel als eerdere uitkomst in de rolling baseline dienen.


## 56. Actuele en historische modelversies zichtbaar onderscheiden (17 november 2026)

De Brier-evaluatie rapporteert nu afzonderlijk het totale aantal opgeslagen prognosemomentopnames, het aantal momentopnames van de actuele modelversie en het aantal oudere/afwijkende versies dat buiten de actuele modelscores blijft. De statistiekenweergave toont deze aantallen direct bij de Brier-sectie, zodat het totaal aan bewaarde historie niet wordt verward met de steekproef die de huidige Brier-score voedt.

Oudere snapshots worden niet verwijderd. Hun afgeronde, tijdig bekende sessie-uitkomsten kunnen nog steeds in de chronologische naïeve baseline dienen; alleen hun oude voorspelde kansen worden niet in de score van de actuele modelversie gemengd. Een regressietest bewaakt de tellingen en de versie-isolatie.


## 57. Volledige primaire thermische broncontrole baars en snoekbaars (17 november 2026)

De volledige beschikbare primaire publicaties van Christensen et al. (2020; baars) en Frisk et al. (2012; snoekbaars) zijn opnieuw gecontroleerd. De registry bevat nu de exacte steekproef-, maatklasse-, acclimatisatie- en meetresponsdetails.

- **Baars:** respirometrie bij 120 vissen van 5–882 g op 15, 20, 25 en 28 °C. Het berekende aerobe-scopeoptimum daalde met lichaamsmassa voor gemodelleerde klassen van 40–640 g; onder 40 g werd geen optimum gevonden omdat aerobe scope binnen het onderzochte bereik niet afnam. De aparte shuttle-box temperatuurvoorkeur is bij 37 vissen van 3–74 g gemeten en is niet dezelfde respons als aerobe scope.
- **Snoekbaars:** 70 volwassen kweekvissen; zes meetgroepen 13–28 °C, na minimaal drie weken acclimatisatie. Het berekende maximum van aerobe scope lag op 18,8 °C met een breed afgeleid 80%-bereik van 10,4–26,9 °C. De aerobe scope verschilde statistisch niet tussen 13 en 25 °C; de 28 °C-groep leverde slechts drie complete metingen. De studie gebruikte 24 uur dimlicht en aquacultuurcondities.

Deze bevindingen bevestigen dat een vaste soortbrede Gaussische curve onvoldoende is: bij baars is lichaamsmassa essentieel en bij volwassen snoekbaars is het optimum eerder een breed plateau dan een scherp piekpunt. Beide bronnen meten fysiologische capaciteit, niet directe voedselopname, dagelijkse activiteit of hengelvangbaarheid. Alle registry-items blijven `approvedForPrediction: false`. Geen bestaande `thermalOptimum`, curvebreedte, activiteitsscore of vangstkans is aangepast. De huidige curves blijven voorlopige priors totdat overdraagbaarheid en onafhankelijke lokale validatie zijn aangetoond.


## 58. Brier-evaluatie: voorwaarden voor geldige forward validation (17 november 2026)

De Brier-score blijft de onafhankelijke proper scoring rule voor de vooraf vastgelegde kans op minimaal één gevangen exemplaar van de gekozen doelsoort. De uitkomst is binair: bevestigde vangst = 1, bevestigde nulvangst = 0. Onbekende of niet betrouwbaar vastgestelde uitkomsten worden niet gescoord. De score beoordeelt voorspellingen; hij past zelf geen modelparameters, gewichten of prognoses aan.

### Plaats in de roadmap en harde acceptatievoorwaarde

Dit hoort bij **Fase 2 — validatie- en kwaliteitsgate van de prognoseketen**, direct na de versiezuivere snapshot-evaluatie (§§55–56) en vóór Fase 2 als geheel kan worden geaccepteerd of Fase 3 start. Het is geen nieuwe biologische responslaag en geen runtime-correctiefactor. De Brier-evaluatie is de onafhankelijke meetlat voor de voorspelde uitkomstkans.

De huidige implementatie is pas geschikt als volwaardige validatiepoort wanneer aan alle onderstaande voorwaarden is voldaan:

1. **Voorspelling vooraf vastgelegd:** gebruik uitsluitend onveranderlijke prognosesnapshots die aantoonbaar vóór de bijbehorende vissessie zijn gemaakt. Bewaar modelversie, voorspelde kans, voorspeld tijdvak/duur en relevante prognosecontext.
2. **Uitkomst betrouwbaar:** score alleen afgeronde sessies met bekende doelsoort en expliciet bekende vangstuitkomst. Een bevestigde nulvangst telt als 0; ontbrekende/onbekende vangstregistratie telt niet als nul.
3. **Voorspelde en werkelijk bevistijdvak vergelijkbaar:** de kans voor een geplande sessieduur mag niet zonder correctie worden vergeleken met een wezenlijk andere werkelijke visduur. Registreer/behoud geplande duur en werkelijke visduur afzonderlijk. Totdat een vooraf vastgelegde, gevalideerde methode bestaat om kansen naar de werkelijk bevistijd te herleiden, worden sessies met een materiële duur- of tijdvakafwijking uitgesloten van de primaire Brier-score en apart geteld. Stel geen willekeurige tolerantiegrens in. Een eventuele duurherleiding moet uitsluitend de vooraf opgeslagen voorspelling en informatie van vóór de sessie gebruiken, nooit de vangstuitkomst.
4. **Geen datalek of look-ahead:** de rolling naive baseline gebruikt alleen werkelijke uitkomsten van sessies die aantoonbaar vóór het prognosetijdstip zijn afgerond. De te beoordelen voorspelling en toekomstige sessies mogen de baseline niet beïnvloeden.
5. **Modelversie-isolatie:** de primaire Brier-score bevat uitsluitend snapshots van de actuele prognosemodelversie. Oudere versies blijven zichtbaar als uitgesloten aantallen; hun geldige, eerder bekende uitkomsten mogen alleen als historische waarnemingen voor een latere chronologische baseline dienen.
6. **Soortspecifieke diagnose:** rapporteer naast de totaalscore ook aantallen en Brier-resultaten per doelsoort zodra er voldoende bruikbare waarnemingen zijn. Een totaalgemiddelde mag een verslechtering bij één soort niet verbergen. Kleine aantallen worden expliciet als voorlopig getoond; de bestaande technische ondergrens van vijf is geen bewijs van statistische robuustheid.
7. **Baseline en kalibratie:** toon Brier Skill Score alleen ten opzichte van een correct chronologisch berekende referentie. Voeg kalibratie-inzicht toe: vergelijk voorspelde kansniveaus met de werkelijk waargenomen frequentie, maar toon geen misleidende kalibratiegroepen bij te kleine aantallen. Brier-score, skill score, steekproefbasis en kalibratie zijn verschillende zaken.
8. **Geen automatische zelftraining:** een lagere of hogere Brier-score wijzigt nooit rechtstreeks een biologische factor, profielparameter, tijdvakbonus of vangstkans. Eerst volgt foutdiagnose (datakwaliteit, duur-/tijdvakmismatch, soort, modelversie, onzekerheid en toeval); een modelwijziging vereist een onderbouwde hypothese, nieuwe versie en nieuwe chronologische validatie.

### Huidige status en eerstvolgende acties

- De formule, binaire uitkomstdefinitie, actuele-modelversie-isolatie en chronologische naive baseline vormen een correcte basis.
- De huidige persoonlijke Poisson-kans blijft een beperkte historische baseline en is nog niet de uiteindelijke geïntegreerde biologische vangstprognose.
- De expliciete controle op overeenkomst tussen geplande en werkelijk bevistijd/-duur is nog een open validatiepunt; de huidige evaluatie mag dit niet stilzwijgend als opgelost presenteren.
- Eerstvolgende technische actie: audit van de snapshot- en sessievelden voor geplande duur, werkelijke duur, start/eindtijd en tijdvak; daarna een regressietestmatrix voor gelijke duur, kortere/l langere sessie, verschoven tijdvak, onvolledige sessie en onbekende uitkomst. Implementeer alleen een uitsluitings-/herleidingsregel die door die gegevens en tests wordt gedragen.
- Daarna per-soort rapportage en kalibratie beoordelen op basis van beschikbare aantallen. Geen arbitraire minimumsteekproef of tolerantie toevoegen zonder onderbouwing.
- **Fase 2-acceptatie blijft geblokkeerd** totdat de duur-/tijdvakvergelijkbaarheid, chronologische integriteit, modelversie-isolatie en soortspecifieke diagnostiek aantoonbaar zijn getest. Fase 3 start niet eerder.


## 59. Onafhankelijk evaluatiekader voor de volledige prognose (17 november 2026)

### Hoofdprincipe: voorspellen en beoordelen blijven gescheiden

De prognose-engine maakt zelfstandig een voorspelling op basis van de vooraf beschikbare biologische, thermische, habitat- en omgevingsinformatie. De evaluatielaag beoordeelt die vastgelegde voorspelling pas achteraf tegen onafhankelijke waarnemingen. De Brier-score is dus geen onderdeel van de prognoseberekening, geen stuurvariabele en geen automatische trainingslus.

Een evaluatieresultaat mag niet achteraf de voorspelling wijzigen die het beoordeelt. Een wijziging aan een voorspellend onderdeel vraagt een expliciete, inhoudelijk onderbouwde hypothese, een nieuwe model-/engineversie en nieuwe chronologische forward validation. De bestaande, beperkte watertemperatuurbiascorrectie is een afzonderlijke submodelkalibratie op uitsluitend eerdere temperatuurmeetparen; zij is geen Brier-feedback en mag niet worden veralgemeniseerd naar biologische scores of vangstkansen.

### Evaluatielagen — ieder zijn eigen uitkomstmaat

1. **Vangkans / gerealiseerde vangst**
   - Bestaande basis: Brier-score, chronologische Brier Skill Score en kalibratiegroepen voor de vooraf vastgelegde binaire kans op minimaal één doelvis.
   - Dit beoordeelt de kansuitspraak, niet automatisch de juistheid van elke biologische tussenlaag.
   - De voorwaarden uit §58 blijven gelden, waaronder vergelijkbaarheid van voorspelde en werkelijk bevistijd/-duur.

2. **Watertemperatuur / thermische omgevingsvoorspelling**
   - Bestaande basis: MAE, RMSE en gemiddelde bias tegenover later, fysiek gemeten watertemperatuur.
   - De meting moet een betrouwbaar meetmoment, bron en methode hebben en na de voorspelling liggen.
   - De bestaande lokale biascorrectie gebruikt alleen eerdere meetparen op dezelfde stek en in hetzelfde seizoen; deze blijft begrensd en chronologisch.

3. **Prognoserichting en relatieve omstandigheden**
   - Nog niet als zelfstandige evaluatie geïmplementeerd.
   - Doel: toetsen of vooraf als gunstiger/ongunstiger of hoger/lager gerangschikte omstandigheden achteraf een overeenkomstig verschil in relevante uitkomsten laten zien.
   - Dit vereist vooraf opgeslagen, vergelijkbare voorspellingen en voldoende herhaalde waarnemingen. Vergelijkingen moeten rekening houden met soort, stek, seizoen, werkelijke visduur, techniek en andere relevante verschillen.
   - Een enkele vangst of nulvangst bewijst niet dat de voorspelde richting juist of onjuist was; toeval en detectie-/vangstinspanning blijven meespelen. Geen score of drempel invoeren voordat de uitkomstdefinitie en statistische methode zijn vastgelegd.

4. **Tijdvakvoorspelling**
   - Nog niet als zelfstandige uitkomstvalidatie geïmplementeerd. De bestaande tijdvakcontext en adviezen zijn geen bewijs dat het gekozen tijdvak achteraf het beste was.
   - Toetsing vraagt vooraf vastgelegde tijdvakrangschikkingen en herhaalde, vergelijkbare sessies per soort en context. Vergelijk alleen werkelijk bevistijd en inspanning die bij het voorspelde tijdvak passen.
   - Een sessie in één tijdvak vertelt niet wat dezelfde visser op hetzelfde moment in een alternatief tijdvak had gevangen. Dat niet-waargenomen alternatief is een counterfactual en mag niet als gemeten waarheid worden behandeld.

5. **Habitat / aanwezigheid op de stek**
   - Nog geen gekalibreerde zelfstandige aanwezigheidsvalidatie.
   - Hiervoor zijn tijdgestempelde, soortspecifieke aanwezigheid- of afwezigheidswaarnemingen nodig, met aandacht voor waarnemingsinspanning en detectiekans. 'Niet gezien' is niet automatisch 'niet aanwezig'.
   - Vangstregistraties alleen zijn een onvolmaakte proxy voor aanwezigheid: niet vangen bewijst niet dat de soort niet op de stek was.

6. **Voeding / foerageergedrag**
   - Nog geen zelfstandige kwantitatieve validatie.
   - Alleen directe, voldoende nauwkeurige en tijdgestempelde voedingswaarnemingen kunnen een voorspelling over voedingsactiviteit rechtstreeks toetsen. Beweging, dieptegebruik, habitatkeuze, maagvulling en vangsten zijn verschillende proxies met eigen beperkingen; ze mogen niet zonder onderbouwing als gelijkwaardige voedingslabels worden gebruikt.
   - De bestaande grove sessieobservaties hebben geen betrouwbare gebeurtenistijd en worden daarom niet achteraf omgezet in tijdvakgebonden trainingslabels.

7. **Thermische biologische activiteit**
   - De bestaande thermische activiteitspotentie is een modeluitvoer, geen rechtstreeks gemeten dagelijkse activiteit.
   - MAE/RMSE van watertemperatuur valideert de temperatuurinput, niet de biologische activiteitsscore. Validatie van de activiteitsscore vraagt een passende, onafhankelijke fysiologische of gedragsmatige referentiemaat en een soort-/levensfase-/contextspecifieke overdraagbaarheidsbeoordeling.

8. **Databasis en onzekerheid**
   - Bronbeschikbaarheid, steekproefomvang, ontbrekende gegevens en modelonzekerheid worden apart gerapporteerd.
   - Een kwalitatief label 'onderbouwing' of 'databasis' is geen statistische betrouwbaarheid. Een onzekerheidsinterval moet afzonderlijk op dekking en kalibratie worden getoetst zodra voldoende data beschikbaar is.

### Technische volgorde en acceptatie

- Behoud de bestaande temperatuur- en vangstevaluaties als afzonderlijke modules; voeg geen tweede algemene prognosescore toe die verschillende uitkomsten door elkaar mengt.
- Eerst de open Brier-voorwaarden uit §58 oplossen, in het bijzonder voorspelde versus werkelijk bevistijd/-duur, chronologie en soortspecifieke diagnose.
- Daarna per laag vastleggen: voorspelde grootheid, onafhankelijke waarneming/label, tijdresolutie, vergelijkbaarheid, uitsluitingsregels, geschikte maatstaf en vereiste steekproefbasis.
- Pas daarna afzonderlijke evaluatiemodules en regressietests implementeren. Geen willekeurige scoregewichten, drempels of minimale aantallen verzinnen.
- Resultaten moeten per soort en waar relevant per levensfase, seizoen, habitat en tijdvak te inspecteren zijn; kleine aantallen blijven expliciet voorlopig.
- De evaluatie mag geen verborgen automatische zelftraining worden. Eventuele toekomstige submodelkalibratie moet expliciet afgebakend, chronologisch, versieerbaar en onafhankelijk toetsbaar zijn.
- **Fase 2 blijft geblokkeerd** totdat de vangstkans-evaluatie aan §58 voldoet en de voor de uiteindelijke prognose geclaimde deeluitkomsten aantoonbaar een passende onafhankelijke validatiemethode hebben. Niet elk biologisch mechanisme hoeft al een numerieke score te krijgen; zonder valide waarneming blijft het een transparant onderbouwde hypothese, geen bewezen voorspelling.


## 60. Technische data-readiness per evaluatielaag (17 november 2026)

Deze audit beschrijft wat de huidige types en evaluatie-engine daadwerkelijk vastleggen. Aanwezigheid van een veld betekent niet automatisch dat de waarde compleet, tijdnauwkeurig of geschikt is als onafhankelijke validatielabel.

### Wat al technisch aanwezig is

- **Vangkans:** PrognosisSnapshot.predictedCatchChance, actualOutcome, linkedSessionId, forecastTimestamp, modelVersion en de gekoppelde FishingSession.startTime/endTime vormen de basis voor Brier. De evaluator controleert dat de voorspelling vóór sessiestart is gemaakt, sluit benchmarks/ongeldige uitkomsten uit en kiest de vroegste snapshot per sessie en doelsoort.
- **Temperatuur:** de snapshot bewaart de vooraf geschatte watertemperatuur en meetprovenance; de sessie kan een werkelijk gemeten temperatuur met meettijd, bron, methode en diepte opslaan. evaluateWaterTemperaturePerformance() berekent MAE/RMSE/bias. getWaterTemperatureCalibration() gebruikt uitsluitend eerdere geldige paren op dezelfde stek en in hetzelfde seizoen.
- **Tijd- en inspanningscontext:** snapshots hebben targetSlot, targetWindowStart/End, durationHours en durationKnown; sessies hebben startTime, endTime, durationMinutes, plannedDurationHours en plannedEndTime. Deze velden bieden een basis voor de noodzakelijke vergelijkbaarheidscontrole, maar de huidige Brier-evaluator gebruikt ze nog niet om geplande en werkelijke duur/tijdvensters te vergelijken.
- **Dag- en tijdvakuitvoer:** PrognosisSnapshot.prognosisData bewaart de volledige DayPrognosis, inclusief dagadvies, bestTimeSlot, de vier timeSlots en hun thermische activiteitspotentie. De snapshot heeft daarnaast één targetSlot en één predictedActivityScore.

### Wat nog niet valideerbaar is met de huidige registratie

1. **Brier op vergelijkbare sessieduur:** de huidige evaluator controleert start/eindtijd, maar sluit een mismatch tussen voorspelde duur/tijdvenster en werkelijk bevistijd nog niet uit. Dit blijft de eerste technische prioriteit uit §58.
2. **Brier per doelsoort:** de rolling baseline is intern soortspecifiek, maar EvaluationResult rapporteert de primaire Brier-score en kalibratie momenteel geaggregeerd. Een soortspecifieke diagnostische uitsplitsing ontbreekt nog.
3. **Tijdvakrangschikking:** de dagprognose bewaart activiteitspotentie per tijdvak, maar niet een afzonderlijke, vooraf vastgelegde vangstkans per tijdvak. Een sessie-uitkomst kan bovendien meerdere tijdvakken omvatten. De huidige gegevens rechtvaardigen dus geen claim dat de app al weet welk tijdvak de hoogste vangstkans had.
4. **Werkelijke inspanning per tijdvak:** FishingSession bewaart sessiestart/-einde en geplande duur. Optionele SessionRod.activeIntervals kunnen hengelinzet per tijdvak verfijnen, maar zijn niet gegarandeerd aanwezig. Zonder passende inspanningsregistratie zijn vangstaantallen tussen tijdvakken niet eerlijk vergelijkbaar.
5. **Vangsttijdstip:** CatchItem.timestamp en optionele hengelgebeurtenissen kunnen tijdinformatie bevatten. Hun volledigheid en bronbetrouwbaarheid moeten eerst worden geaudit; vangsttijd alleen levert geen nulvangst- of blootstellingslabel voor elk ander tijdvak.
6. **Habitat/aanwezigheid:** habitatAnalysis is kwalitatieve modeluitvoer. Aanwezigheidsobservaties bestaan, maar de sessie-sync kan session.updatedAt als observatietijd gebruiken; dat is niet noodzakelijk het fysieke waarnemingsmoment. Er is geen gegarandeerd soortspecifiek, tijdgestempeld detectie-/afwezigheidslabel.
7. **Voeding/foerageren en activiteit:** de bestaande sessieobservaties zijn grove context zonder betrouwbare gebeurtenistijd of expliciete soortidentificatie. Ze zijn niet geschikt als tijdvakgebonden voedingslabels. Er bestaat geen continue onafhankelijke meting van dagelijkse activiteit of directe voedselopname in de sessiedata.
8. **Richting/relatieve omstandigheden:** de snapshots bewaren de modeluitvoer en context, maar de actuele sessie-uitkomst alleen is een ruwe vangstproxy. Voor eerlijke vergelijking zijn herhaalde sessies, vergelijkbare inspanning en controle voor soort, stek, seizoen en techniek nodig; een individuele sessie kan geen alternatieve voorspelling als counterfactual valideren.

### Uitvoeringsvolgorde

1. Maak eerst de Brier-eligible set strikt vergelijkbaar op voorspeld en werkelijk tijdvenster/duur, met expliciete tellingen van uitgesloten gevallen en regressietests.
2. Voeg soortspecifieke Brier- en kalibratiediagnostiek toe zonder de bestaande totaalscore te verbergen.
3. Audit de feitelijke betrouwbaarheid van CatchItem.timestamp, SessionRod.activeIntervals en hengelgebeurtenissen voordat tijdvak- of inspanningsvalidatie wordt ontworpen.
4. Ontwerp daarna pas de minimale aanvullende snapshot-/registratievelden voor tijdvakrangschikking. Geen nieuwe verplichte gebruikersinvoer toevoegen zolang bestaande data en optionele automatische registratie volstaan.
5. Houd habitat-, voedings- en fysiologische activiteitsevaluatie geblokkeerd totdat onafhankelijke waarnemingslabels met passende tijd- en soortresolutie beschikbaar zijn.

**Besluit:** de huidige code heeft twee echte evaluatiemodules (vangstkans en watertemperatuur). De overige prognoselagen zijn nog niet afzonderlijk gevalideerd. De aanwezigheid van vier tijdvakken in DayPrognosis maakt ze nog niet tot vier onafhankelijk geëvalueerde vangstprognoses.


## 61. Brier-blootstellingsvergelijking en soortdiagnostiek (17 november 2026)

De huidige vangstkans is een persoonlijke Poisson-baseline die expliciet is berekend voor een vooraf geplande sessieduur. De primaire Brier-score mag daarom alleen een sessie vergelijken waarvan de werkelijke bevistijd overeenkomt met die vooraf voorspelde duur.

### Definitieve vergelijkbaarheidsregel

- De voorspelde duur komt uit de onveranderlijke snapshot (durationHours; 0 of expliciet onbekend is niet bruikbaar).
- De werkelijke duur wordt bepaald uit de gekoppelde sessie (endTime - startTime), niet uit een achteraf gewijzigde geplande duur.
- Vergelijk beide op minuutprecisie. Alleen gelijke duur telt mee in de primaire Brier-score.
- Een afwijkende duur wordt uitgesloten en apart geteld; een ontbrekende/onbekende voorspelde duur wordt eveneens apart geteld.
- Er wordt geen willekeurige tolerantie gekozen en de voorspelde kans wordt niet achteraf naar de werkelijke duur omgerekend. Een dergelijke omzetting vereist eerst een afzonderlijk gevalideerde methode.
- De huidige vangstkans is niet per tijdvak berekend. targetSlot of de vier thermische tijdvakindices worden daarom niet gebruikt om de Brier-eligible set te bepalen. Tijdvakrangschikking blijft een aparte, nog niet gevalideerde evaluatielaag.

### Soortspecifieke diagnose

- Behoud de bestaande totaalscore, rolling baseline en kalibratietabel.
- Rapporteer daarnaast per doelsoort het aantal geldige sessies, de beschrijvende Brier-score, gemiddelde voorspelde kans en gerealiseerde vangstfractie.
- Toon de aantallen altijd naast de scores. Kleine soortsteekproeven blijven beschrijvend; ze bewijzen geen robuuste prestatie.
- Een soortspecifieke score mag de prognose niet bijsturen en wordt niet gebruikt als automatische modeltraining.

### Regressie-acceptatie

- Exact gelijke voorspelde/werkelijke duur telt mee.
- Een sessie met afwijkende duur telt niet mee en verhoogt uitsluitend de mismatchteller.
- Een onbekende of ontbrekende voorspelde duur telt niet mee en verhoogt uitsluitend de onbekende-duurteller.
- Oude modelversies, benchmarks, onvolledige koppelingen, onbekende uitkomsten en niet-vooraf gemaakte voorspellingen blijven uitgesloten.
- De soortuitsplitsing moet dezelfde gevalideerde Brier-eligible set gebruiken als de totaalscore.

**Status bij implementatie:** de codewijziging wordt pas geaccepteerd na een groene Quality Gate op de exacte PR-head en een groene Quality Gate op de mergecommit. Tot die tijd blijft Fase 2 geblokkeerd.


## 62. Tijdelijke, gerichte dependency-audituitzondering (17 november 2026)

De Quality Gate blokkeerde vóór typecheck en tests op GitHub Advisory `GHSA-fc5q-39xc-vjpf` voor transitieve dependency `picomatch@4.0.7` (ReDoS-melding). De melding is nog gepubliceerd als High, maar de upstream-onderhouder betwist de kwetsbaarheidsclassificatie; tijdens deze wijziging was geen bevestigde gepubliceerde patchrelease beschikbaar.

**Besluit:** uitsluitend deze ene GHSA wordt tijdelijk uitgesloten van beide Bun dependency-audits in `.github/workflows/ci.yml`. Alle andere meldingen en auditniveaus blijven actief. Dit is een expliciete risico-uitzondering, geen bewijs dat de dependency veilig of de melding opgelost is.

**Herbeoordeling verplicht:** verwijder de uitzondering zodra (a) een gepatchte picomatch-release beschikbaar is en de dependencyboom daarop kan worden bijgewerkt, of (b) GitHub/upstream de advisory formeel intrekt of inhoudelijk wijzigt. Controleer de dependencyboom en advisory opnieuw bij iedere relevante dependency-update. Geen brede audit-uitschakeling, geen globale ignore en geen wijziging aan productieprognoses.

De uitzondering maakt alleen de resterende Quality Gate-stappen uitvoerbaar; de PR mag pas worden samengevoegd nadat typecheck, alle regressietests, productiebuild en de volledige Quality Gate op de exacte PR-head groen zijn. Daarna is ook een groene Quality Gate op de mergecommit vereist.


## 63. Datakwaliteit vangsttijdstippen en hengelinzet (18 november 2026)

**Scope:** statische code-audit van `CatchItem.timestamp`, `SessionRodEvent`, `RodActiveInterval`, de registratie-UI en `sessionEffortEngine.ts`. Dit is geen analyse van de lokale gebruikersdatabase; die gegevens staan niet in de GitHub-repository en zijn hier niet rechtstreeks uitleesbaar.

### Vangsttijdstip (`CatchItem.timestamp`)

- Het vangstformulier vult een nieuwe vangst standaard met het lokale moment waarop het formulier wordt geopend. De gebruiker kan dit tijdstip aanpassen; bij opslaan wordt het als ISO-tijdstip bewaard.
- `createdAt` wordt afzonderlijk op het opslagmoment gezet. Bij bewerken blijft de oorspronkelijke `createdAt` behouden.
- Er is voor normale nieuwe vangsten geen expliciete herkomst-/bevestigingsstatus die onderscheid maakt tussen de standaardtijd, een bewust aangepast vangsttijdstip en een achteraf ingevoerde vangst.
- De legacy-import kent wel `legacyImportQuality.timestampKnown`; dat veld markeert expliciet onbekende geïmporteerde tijden, maar lost de onzekerheid bij gewone handmatige invoer niet op.
- Het vangstformulier controleert dat de tijd parsebaar is, maar valideert niet dat het tijdstip binnen de gekoppelde sessie valt.
- Een verschil tussen `timestamp` en `createdAt` kan op vertraagde invoer wijzen, maar bewijst niet wanneer de vis werkelijk is gevangen.

**Conclusie:** vangsttijdstippen zijn bruikbaar als geregistreerde tijdlijn, maar zonder expliciete herkomst zijn ze geen uniforme, onafhankelijke ground-truth voor tijdvakgebonden voedingsactiviteit of vangstvalidatie.

### Hengelgebeurtenissen (`SessionRodEvent`)

- Gebeurtenissen zijn optionele, handmatig ingevoerde details per hengel: aanbeet, gemist, vangst of overig.
- Een nieuwe gebeurtenis krijgt standaard het moment van toevoegen; het tijdstip kan worden aangepast. Een leeg tijdstip kan bij opslaan als lege string blijven bestaan.
- Er is geen aparte bron-/bevestigingsvlag en er is geen automatische synchronisatie tussen een opgeslagen `CatchItem` en een gebeurtenis van type `catch`.
- Daardoor zijn gebeurtenissen niet gegarandeerd volledig en kunnen een vangstregistratie en hengelgebeurtenis elkaar overlappen of dubbel beschrijven.
- De huidige hengelinzetberekening gebruikt deze gebeurtenissen niet als blootstellings- of vangstlabel.

**Conclusie:** gebeurtenisregistratie is optionele context, geen complete of onafhankelijke telling van aanbeten/vangsten.

### Actieve hengelperioden (`RodActiveInterval`)

- Actieve perioden zijn optioneel en volledig handmatig. Er is geen automatische start-/stoptimer die werkelijk hengelgebruik vastlegt.
- Het formulier laat lege start- en eindvelden toe; zulke waarden kunnen worden opgeslagen.
- `calculateSessionRodEffort()` telt alleen geldige intervallen, begrenst ze op de sessiegrenzen en voegt overlappende intervallen per hengel samen. Ongeldige of onvolledige intervallen worden niet geschat maar apart geteld.
- Bij het normaal beëindigen van een sessie sluit `closeOpenRodIntervals()` een open interval alleen als de starttijd geldig is en niet na het sessie-einde ligt.
- Bij een actieve sessie kan een geldige open interval tot het evaluatiemoment lopen; bij een afgeronde sessie zonder geldig eindtijdstip wordt deze als onvolledig behandeld.
- De berekening controleert niet of de handmatig opgegeven tijden de werkelijke hengelinzet correct weergeven. De berekende hengeluren zijn daarom alleen een samenvatting van geregistreerde intervallen, geen geverifieerde meetwaarde.

### Gevolgen voor onafhankelijke prognosevalidatie

1. De huidige Brier-score gebruikt sessie-uitkomst en vooraf voorspelde versus werkelijk bevistijd; hij is niet afhankelijk van vangsttijdstippen of hengelgebeurtenissen. Deze audit verandert de Brier-berekening niet.
2. Vangsttijdstippen mogen nog niet als betrouwbare tijdvaklabels voor voedingsactiviteit worden gebruikt.
3. Hengeluren mogen alleen als geregistreerde, expliciete inspanning worden gerapporteerd; ontbrekende intervallen mogen nooit worden aangevuld met sessieduur × aantal hengels.
4. Tijdvak-/hengelinspanningsvalidatie blijft geblokkeerd totdat herkomst, volledigheid en tijdsconsistentie voldoende aantoonbaar zijn.
5. De repository bevat geen lokale gebruikersrecords waarmee de feitelijke dekking of foutfrequentie kan worden gekwantificeerd. Daarover worden dus geen aantallen of betrouwbaarheidscijfers geclaimd.

**Vervolg:** ontwerp eerst een minimale, bij voorkeur automatisch vastgelegde herkomststatus voor vangsttijdstippen en optionele hengelgegevens. Valideer sessiegrenzen en onvolledige invoer met regressietests. Voeg geen verplichte extra registratiehandelingen toe en activeer geen tijdvakbonus of biologische leerlabels op basis van deze velden.


## 64. Bestaande persoonlijke tijdvakervaring is ingedeeld op sessiestart (18 november 2026)

De vier tijdvakken tonen al beschrijvende persoonlijke ervaring. `getSimilarSessions()` deelt een afgeronde sessie volledig in op basis van het lokale uur van `FishingSession.startTime`. Een sessie die Avond én Nacht beslaat, telt dus volledig bij Avond wanneer zij daar start. De vangsttijdstippen en actieve hengelintervallen verdelen de sessie niet over de tijdvakken.

Deze persoonlijke ervaring is een sessiesuccesfractie (succesvolle sessies / geldige sessies), geen tijdvakgebonden vangstkans of vangsttempo. Zij beïnvloedt de thermische `activityScore` en de selectie van `bestTimeSlot` niet; die rangschikking wordt uitsluitend op de thermische tijdvakscore gebaseerd.

De UI-tekst is verduidelijkt naar 'sessies gestart in dit tijdvak' en vermeldt de indeling op starttijd. Een regressietest gebruikt sessies van zes uur die Avond en Nacht overspannen en borgt zowel de starttijdindeling als het ontbreken van invloed op thermische scores. Geen modelberekening of biologische parameter gewijzigd.


## 65. Automatische herkomstregistratie voor vangst- en hengelgebeurtenissen (18 november 2026)

### Besluit en implementatie

- Een nieuwe vangst houdt de bestaande standaard: het lokale tijdstip wordt automatisch ingevuld zodra het vangstformulier opent. De gebruiker kan dit tijdstip blijven aanpassen.
- `CatchItem.timestampEntryMode` legt vast of het tijdstip automatisch is ingevuld (`automatic`) of door de gebruiker is aangepast (`user_adjusted`). Er verschijnt geen extra vraag of verplicht invoerveld.
- Bij bewerken blijft een bestaande herkomststatus behouden als het tijdstip ongewijzigd blijft. Wordt het tijdstip aangepast, dan wordt de status `user_adjusted`.
- Een oude registratie zonder herkomststatus blijft ongeclassificeerd. Een legacy-record met expliciet onbekende tijd blijft onbekend totdat de gebruiker een tijd invult; dat wordt dan `user_adjusted`.
- Nieuwe hengelgebeurtenissen krijgen bij toevoegen automatisch `automatic`; een gewijzigd tijdstip krijgt `user_adjusted`. Ook hier blijven oude records zonder status ongeclassificeerd.
- `user_adjusted` betekent uitsluitend dat de gebruiker het tijdstip heeft aangepast. Het is geen onafhankelijke verificatie dat de vis of gebeurtenis op dat moment plaatsvond.
- Prognosehistorie is verhoogd naar `historyFeatureSchemaVersion: 2`. De whitelisted vangstfeatures nemen `timestampEntryMode` mee; de bestaande fingerprint neemt dit daardoor automatisch mee.
- Hengelgebeurtenissen bewaren hun herkomst in de sessierecords, maar worden niet aan de prognosehistorie toegevoegd: de huidige prognose-engine gebruikt deze gebeurtenissen niet als modelinput. Zo wordt geen ongebruikte persoonlijke eventdata gekopieerd.
- Oude opgeslagen prognosesnapshots met schema 1 blijven geldig en worden niet achteraf herschreven.
- Geen wijziging aan Brier-validatie, tijdvakrangschikking, biologische parameters, activiteitsscores of vangstkansen.

### Validatie

Regressietests dekken automatische standaardtijd, gewijzigde tijd, behoud van bestaande herkomst, ongeclassificeerde oude records en opname van de status in historische featureschema v2. De status is uitsluitend datakwaliteitsmetadata; zij activeert geen tijdvak- of voedingsleerlabel.


## 66. Betrouwbaarheid van geregistreerde hengelinzet (18 november 2026)

De bestaande intervalberekening telde alleen geldige periodes, maar de UI presenteerde bij lege intervalsets alsnog `0.00 uur`. Dat kan worden gelezen als bewezen nul-inzet, terwijl er in werkelijkheid niets is geregistreerd. Dit onderscheid is nu expliciet gemaakt:

- Een hengelrecord zonder actieve periodes betekent **inzet onbekend**, niet nul uur.
- Een intervalrecord met ontbrekende/ongeldige tijden telt als onvolledig; het wordt niet aangevuld op basis van sessieduur of hengelaantal.
- Een lege eindtijdstring is ongeldig en wordt niet verward met een expliciet open interval (null/ontbrekend eindtijdstip tijdens een actieve sessie).
- Alleen geldige intervallen tellen mee. Overlap wordt per hengel samengevoegd; verschillende hengels blijven afzonderlijke hengeluren.
- Intervallen die sessiegrenzen overschrijden worden begrensd op die grenzen en apart geteld. Als de sessiegrenzen zelf ongeldig zijn, worden alle aanwezige intervalrecords als niet valideerbaar geteld.
- Bij gedeeltelijke registratie wordt alleen het geregistreerde subtotaal getoond, met een expliciete waarschuwing dat dit niet automatisch de volledige sessie-inzet is.

De UI noemt nul uur niet langer als er geen intervalregistraties zijn. De berekening blijft beschrijvend en wordt niet gebruikt voor prognosescores, vangstkansen of tijdvakrangschikking. Er is geen nieuwe verplichte gebruikersinvoer toegevoegd.

Regressietests dekken lege sets, gedeeltelijke invoer, lege eindtijd, ongeldige sessiegrenzen en intervallen buiten de sessie.


## 67. Databeschikbaarheid voor eerlijke tijdvakvalidatie (18 november 2026)

### Wat de huidige data wel en niet zegt

1. **Huidige persoonlijke tijdvakervaring:** `getSimilarSessions()` deelt de hele afgeronde sessie in op het lokale startuur. Dit is een sessiestart-cohort en geen uitkomst per tijdvak. Een sessie die Avond en Nacht omvat, wordt niet over beide tijdvakken verdeeld.
2. **Hengelblootstelling:** `SessionRod.activeIntervals` kan expliciete hengeluren leveren. De berekening is nu datakwaliteitsbewust: geen interval betekent onbekende inzet; gedeeltelijke registratie levert alleen een bruikbaar geregistreerd subtotaal; ongeldige intervallen worden uitgesloten en geteld. De intervallen zijn handmatig ingevoerd en niet onafhankelijk gecontroleerd.
3. **Vangsttijd:** `timestampEntryMode=automatic` betekent dat het tijdstip bij openen van het vangstformulier is ingevuld. Dat is een registratiemoment, niet noodzakelijk het exacte vangstmoment. `user_adjusted` betekent dat de gebruiker het tijdstip heeft aangepast; dit blijft een gebruikersrapportage en geen onafhankelijke verificatie. Oude records zonder herkomststatus blijven ongeclassificeerd.
4. **Hengelgebeurtenissen:** gebeurtenissen hebben tijdstip en herkomststatus, maar zijn niet aan een `CatchItem` gekoppeld. Een gebeurtenis van type `catch` mag daarom niet naast een vangstrecord worden opgeteld; dat kan dezelfde vangst dubbel tellen.
5. **Meerdere doelsoorten:** één sessie kan meerdere `targetSpecies` bevatten, terwijl actieve intervallen per hengel geen doelsoort vastleggen. Dezelfde hengeluren zonder meer aan elke soort toeschrijven zou soortspecifieke blootstelling overschatten.

### Veilige ontwerpregels voor een toekomstige beschrijvende tijdvakdiagnose

- Splits alleen geldige actieve hengelintervallen over de bestaande lokale tijdvakken in `Europe/Amsterdam` (Nacht 00–06, Ochtend 06–12, Middag 12–18, Avond 18–24). Gebruik absolute ISO-momenten en de Amsterdamse tijdzone; DST-dagen mogen niet met een vaste UTC-offset worden verwerkt.
- Rapporteer blootstelling als **geregistreerde hengeluren** per tijdvak, met expliciete aantallen intervallen/hengels zonder registratie, onvolledige intervallen en sessies met gedeeltelijke dekking. Nooit ontbrekende intervallen aanvullen vanuit sessieduur of `rodCount`.
- Voor een soortspecifieke blootstellingsvergelijking is de huidige veilige scope beperkt tot sessies met precies één doelsoort. Meersoortige sessies blijven buiten de soortspecifieke noemer totdat hengel-/inspanningstoewijzing betrouwbaar bestaat.
- Automatische vangsttijdstippen niet behandelen als bewezen vangstmoment. `user_adjusted` mag hoogstens in een apart, expliciet als gebruikersgerapporteerd gemarkeerd positief-vangstsignaal worden onderzocht; het is geen gevalideerd voedings- of vangsttijdlabel.
- Een vangstregistratie in een tijdvak bewijst niet dat in andere tijdvakken van dezelfde sessie geen vangsten plaatsvonden. Bij een vangstsessie mogen tijdvakken zonder geregistreerde vangst daarom niet als nulvangst worden gelabeld.
- Een expliciet bevestigde nulvangstsessie (`skunk_confirmed`) kan een sessiebrede nuluitkomst leveren. Toewijzing aan tijdvakken vereist daarnaast valide geregistreerde blootstelling in die tijdvakken; ontbrekende blootstelling blijft onbekend.
- Groepsvangsten met `count > 1` hebben één geregistreerd tijdstip voor de groep. De aantallen kunnen niet worden verdeeld over verschillende tijdstippen.
- Brier-validatie blijft op sessieniveau en gebruikt de bestaande blootstellings-/duurvoorwaarden. Deze tijdvakdiagnose mag geen Brier-score of prognosegewicht aanpassen.

### Besluit

Er is nog geen betrouwbare tijdvakgebonden catch rate of voedingsactiviteit-label beschikbaar. De volgende implementatiestap is uitsluitend een offline, beschrijvende datakwaliteits-/blootstellingsdiagnose met expliciete dekking en uitsluitingen. Pas na controle van die uitkomsten kan worden besloten of een afzonderlijke tijdvakprestatiemaat valideerbaar is. Geen prognosescore, modelparameter of gebruikersinvoer wijzigen in deze stap.


## 68. Standalone tijdvakblootstellingsdiagnose (18 november 2026)

Er is een pure, beschrijvende helper toegevoegd die geldige hengelintervallen splitst over de bestaande Amsterdamse tijdvakken (Nacht/Ochtend/Middag/Avond). De helper:
- gebruikt absolute tijdstempels en `Europe/Amsterdam` via de bestaande tijdzonefunctie; lente- en herfst-DST worden daardoor op werkelijke klokovergangen verdeeld;
- voegt overlappende intervallen per hengel samen, maar telt verschillende hengels afzonderlijk;
- bewaart aantallen geregistreerde intervallen, hengels zonder intervallen, onvolledige intervallen en intervallen buiten sessiegrenzen;
- vult ontbrekende hengeluren nooit aan vanuit sessieduur of `rodCount`;
- geeft uitsluitend geregistreerde blootstelling terug, zonder vangstlabels of soorttoewijzing.

De helper is nog niet aangesloten op de prognose, VisCoach of UI. Er wordt geen catch rate, nulvangst per tijdvak, voedingsactiviteit of Brier-score berekend. De regressietests dekken normale tijdvakgrenzen, overlap, gedeeltelijke dekking, ongeldige invoer en beide DST-overgangen.

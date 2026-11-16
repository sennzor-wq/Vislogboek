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
| Voorn | `roach-diel-diet-and-habitat-shifts-2002-2004`; `roach-autumnal-diel-feeding-shift-2008`; `bream-roach-in-situ-diel-zooplankton-feeding-2004`; `roach-diel-feeding-cycle-lake-aydat-1990` — directe maaginhoud-/voedselopnamebronnen, waaronder leeftijdsafhankelijke patronen | Telemetrie toont verschillen in activiteit tussen heldere en troebele meren | Dag-/nachtverschuiving tussen littoraal en pelagisch habitat | `freshwater-fish-temperature-growth-four-species-tien-2024` — groei, geen acute activiteit | Meerdere directe voedingsbronnen; leeftijd, dieet, helderheid en seizoen bepalen mede het dagritme |
| Zeelt | `tench-nocturnal-feeding-locomotor-rhythm-2005`; `tench-temperature-feeding-efficiency-2026`; `tench-field-diel-seasonal-feeding-2018` — gecontroleerde voedingsmetingen plus direct veldonderzoek naar maaginhoud en dag-/seizoensritme | Nachtelijk locomotorisch ritme onder gecontroleerde condities | Geen soortspecifieke lokale stekvalidatie | Voedselefficiëntie/body condition onder twee experimentele temperaturen; geen volledige veldcurve | Sterkste directe tijdvakbewijs in het register, maar één veldwater en beperkte seizoensdekking; geen harde nachtbonus |
| Snoekbaars | `pikeperch-lake-ladoga-daily-feeding-rhythm-1982`; `pikeperch-winter-spring-feeding-temperature-2020`; `asp-pikeperch-ontogenetic-diet-two-reservoirs-2018` — directe seizoensgebonden voedingsritmes plus gecontroleerde voedselopname en levensfasegebonden prooikeuze | `pikeperch-diel-activity-drainage-canal-2005`; `pikeperch-diel-distribution-elbe-river-2008` — locomotie en verdeling | Bestaande kanaal- en rivierhabitatbronnen | `freshwater-fish-temperature-growth-four-species-tien-2024` — groei, geen acute activiteit | Direct voedingsbewijs bestaat, maar tijdvensters zijn seizoens- en prooicontextgebonden; geen Nederlandse jaarcurve |
| Meerval | `european-catfish-feeding-and-activity-rhythms-1995-2012`; `juvenile-catfish-night-foraging-reservoirs-2025` — gecontroleerde nachtvoeding en directe nachtelijke voedselopname bij vroege juvenielen | `adult-catfish-diel-activity-belver-reservoir-2025`; Slavík & Horký (2012) — volwassen veldbeweging/accelerometer- en EMG-activiteit, geen directe voedselopname | Dieptegebruik en individuele/seasonale verplaatsing verschillen per rivier/reservoir | Geen soortspecifieke groeistudie in het register | Directe voedingsdata zijn levensfase-/opzetgebonden; volwassen veldtelemetrie is alleen bewegingsbewijs, geen bewijs voor een vaste nachtvoorkeur |
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
| **Meerval** | Ja, maar levensfasegebonden: gecontroleerde nachtelijke voedselopname bij adulten en veldwaarnemingen van nachtelijk foerageren bij vroege juvenielen. | De volwassen veldtelemetrie uit Portugal meet beweging/diepte, geen voedselopname. Juveniele pelagische prooi/habitat is niet gelijk aan volwassen bodem-/oevervisserij. | Geen generieke nachtactieve vangstvoorspelling. Voedingsbewijs en volwassen bewegingsbewijs expliciet gescheiden houden. |
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

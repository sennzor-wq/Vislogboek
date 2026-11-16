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
| Brasem | [Jurajda et al. (2018), winteractiviteit in reservoir](https://doi.org/10.1111/fme.12275); [Cittadino et al. (2026), seizoensbeweging in verbonden wetland](https://doi.org/10.1007/s10750-026-06142-x) | Brasem kan ook in winter foerageren; temperatuur, zuurstofprofiel, diepte en habitatbeschikbaarheid beïnvloeden waar activiteit wordt waargenomen | Geen universele winter-/zomerweging; beide studies zijn sterk gebonden aan het onderzochte reservoir/wetland |
| Snoek | [Nolan et al. (2025; online gepubliceerd in 2024), snoek en snoekbaars in een gereguleerde laaglandrivier](https://doi.org/10.1007/s10750-024-05533-2) | Seizoen, temperatuur, rivierafvoer en beschikbaarheid van refugia hangen samen met beweging en habitatgebruik | Beweging is niet hetzelfde als voedselopname of vangbaarheid; de beperkte off-channel habitat van de onderzochte rivier is contextspecifiek |
| Baars | [Jacobsen et al. (2002), activiteit en voedselkeuze via radiotelemetrie](https://orbit.dtu.dk/en/publications/activity-and-food-choice-of-piscivorous-perch-perca-fluviatilis-i/); [Jacobsen et al. (2015), verschil tussen meren](https://doi.org/10.1111/jfb.12613); [globale review (2025)](https://doi.org/10.1007/s11160-025-09924-z) | Dag-/schemerpatronen, licht, temperatuur en habitatgebruik spelen een rol; troebelheid en meertype kunnen het dagritme veranderen | Geen vaste universele voorkeursuren of één constante temperatuursensitiviteit voor alle wateren |
| Voorn (blankvoorn) | [Diel habitat- en voedingsverschuivingen](https://doi.org/10.1111/j.1095-8649.2002.tb02415.x); [gedragsverschillen tussen heldere en troebele meren](https://doi.org/10.1111/j.0022-1112.2004.00436.x) | Dag-/nachtverplaatsing, voedselkeuze, leeftijd en waterhelderheid beïnvloeden voedings- en habitatpatronen | Geen vaste dag-/nachtregel onafhankelijk van helderheid, predatiedruk, leeftijd en voedseltype |
| Zeelt | [Herrero et al. (2005), voedingsritme en locomotorische activiteit](https://doi.org/10.1016/j.physbeh.2005.02.015); [USGS soortprofiel](https://nas.er.usgs.gov/Queries/FactSheet.aspx?SpeciesID=652) | Sterke nachtelijke activiteit in gecontroleerde omstandigheden; ondiep, langzaam/stilstaand en vegetatierijk habitat is relevant; tolerantie voor lage zuurstof is beschreven | Laboratoriumritme is niet automatisch een veldvangstcurve; brede tolerantie is geen bewijs voor optimale activiteit |
| Snoekbaars | [Poulet et al. (2005), telemetrie in drainagekanaal](https://doi.org/10.1007/s10750-004-6823-6); [Cittadino et al. (2024), laaglandrivier](https://doi.org/10.1007/s10750-024-05533-2) | Schemeractiviteit, sekse-/spawningverschillen, temperatuur en seizoensgebonden habitatbeweging kunnen relevant zijn | Een voorjaarsstudie in Zuid-Frankrijk of een specifieke gereguleerde rivier is geen algemene Nederlandse jaarcurve |
| Meerval | [Boujard (1995), voedingsritme](https://doi.org/10.1016/0031-9384(95)00109-V); [Slavík & Horký (2012), veldtelemetrie en energieverbruik](https://doi.org/10.1111/j.1095-8649.2012.03436.x); [juveniele seizoensactiviteit (2016)](https://doi.org/10.1111/jai.13146) | Nachtelijke voeding is in gecontroleerde studies sterk; velddata tonen individuele variatie en mogelijke relaties met temperatuur en stroming | Niet iedere volwassen meerval is uitsluitend nachtactief; groeps-/individueel gedrag en levensfase verschillen |
| Roofblei | [Kärgenberg et al. (2020), migratie in rivier-meersysteem](https://doi.org/10.1111/jfb.14454); [diel en seizoensritme in rivier (2016)](https://doi.org/10.1080/03949370.2016.1230560) | Sterke relatie met verbonden rivier-/meerhabitats, stromende paaiplaatsen en seizoensmigratie; activiteit en beweging variëren per seizoen | Migratie- en habitatgebruik is niet gelijk aan dagelijkse voedingsactiviteit of vangstkans op één stek |

### 7.2 Wat dit betekent voor het bestaande profielbestand

- De negen soortprofielen plus `Overig` bevatten al soortspecifieke temperatuurcurves, tijdvakvoorkeuren, windnotities, drukvelden, regen-/bewolkingsnotities en seizoensprioren. Het bestaan van die velden betekent niet dat de precieze getallen door de bronnen worden gedragen.
- De bronnen voor karper en zeelt bevatten bruikbare aanwijzingen over voedingsritme. Voor baars, blankvoorn, brasem, snoek, snoekbaars, meerval en roofblei zijn de gevonden studies vooral telemetrie, habitat, migratie of algemene ecologie. Die zijn waardevol voor de betreffende modeluitkomst, maar mogen niet als directe voedingscurve worden geïnterpreteerd.
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

De literatuurverkenning is nog niet compleet voor alle factoren en soorten. Vooral directe veldstudies naar voedselopname/foerageren bij snoek, brasem, blankvoorn, snoekbaars en roofblei onder Nederlandse of vergelijkbare laaglandcondities blijven nodig. Ook onafhankelijke gegevens over drukverandering, wind, zuurstof, stroming, regen en interacties zijn nodig voordat die factoren numeriek kunnen bijdragen.

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
| Snoek | `northern-pike-field-seasonal-feeding-diet-2025` — maaginhoud en seizoensvoedingsintensiteit in één Anatolisch stuwmeer; seizoens- en temperatuurrelaties niet significant | Bewegingsmaten via telemetrie | `northern-pike-lowland-river-movement-habitat-2025` — seizoen, temperatuur en off-channel habitat | Geen soortspecifieke groeistudie in het register | Direct dieetbewijs, maar geen betrouwbare dagelijkse voedingscurve of statistisch bewezen seizoensbonus |
| Baars | `perch-field-diel-feeding-seasonal-diet-1986` — veldmetingen van dieet en dagritme; ochtend/avond verschuift naar middag in één Fins meer | Radiotelemetrie en dag-/schemeractiviteit, sterk verschillend per meer | Littoraal/pelagisch gebruik en verschillen naar trofische toestand | `freshwater-fish-temperature-growth-four-species-tien-2024` — groei, geen acute activiteit | Direct dagritmebewijs, maar sterk habitat-, seizoen-, voedsel- en lengteklasseafhankelijk |
| Voorn | `roach-diel-diet-and-habitat-shifts-2002-2004`; `roach-autumnal-diel-feeding-shift-2008`; `bream-roach-in-situ-diel-zooplankton-feeding-2004` — dieet, maagvulling en directe dag-/schemervoeding | Telemetrie toont verschillen in activiteit tussen heldere en troebele meren | Dag-/nachtverschuiving tussen littoraal en pelagisch habitat | `freshwater-fish-temperature-growth-four-species-tien-2024` — groei, geen acute activiteit | Meerdere directe voedingsbronnen; herfst-/lichtcontext is relevant, maar geen vaste dag-nachtregel voor iedere waterpartij |
| Zeelt | `tench-nocturnal-feeding-locomotor-rhythm-2005`; `tench-temperature-feeding-efficiency-2026`; `tench-field-diel-seasonal-feeding-2018` — gecontroleerde voedingsmetingen plus direct veldonderzoek naar maaginhoud en dag-/seizoensritme | Nachtelijk locomotorisch ritme onder gecontroleerde condities | Geen soortspecifieke lokale stekvalidatie | Voedselefficiëntie/body condition onder twee experimentele temperaturen; geen volledige veldcurve | Sterkste directe tijdvakbewijs in het register, maar één veldwater en beperkte seizoensdekking; geen harde nachtbonus |
| Snoekbaars | `pikeperch-winter-spring-feeding-temperature-2020`; `asp-pikeperch-ontogenetic-diet-two-reservoirs-2018` — gecontroleerde voedselopname plus veld-maaginhoud/stabiele isotopen en levensfasegebonden prooikeuze | `pikeperch-diel-activity-drainage-canal-2005` — volwassen vis, voorjaars-/kanaalcontext | Bestaande kanaal- en rivierhabitatbronnen | `freshwater-fish-temperature-growth-four-species-tien-2024` — groei, geen acute activiteit | Direct bewijs voor temperatuurrespons in gekweekte broedvis en levensfasegebonden dieet; niet één-op-één toepasbaar op wilde volwassen snoekbaars |
| Meerval | `european-catfish-feeding-and-activity-rhythms-1995-2012`; `wels-catfish-seasonal-diet-feeding-2025` — gecontroleerde nachtvoeding plus veld-maaginhoud/voorkeur en seizoensvariatie | EMG-telemetrie toont activiteit en grote individuele variatie | Twee riviercontexten; geen universele stekvoorkeur | Geen soortspecifieke groeistudie in het register | Direct voedingsbewijs uit meerdere opzetten; nachtelijke voeding en wintermaagvulling zijn contextafhankelijk, geen vaste winter-/nachtbonus |
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

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

Er is wel een tekstuele inconsistentie in `prognosisEngine.ts`: wanneer zowel meting als schatting ontbreekt, vermeldt een onzekerheidsnotitie dat de berekening de luchttemperatuur gebruikt met verhoogde thermische onzekerheid. Dat botst met de expliciete factor-/conclusietekst dat luchttemperatuur geen vervanging voor watertemperatuur is. De huidige beschikbaarheidsvlag voorkomt dat de placeholder als betrouwbare score wordt getoond, maar deze notitie moet in een gerichte codecorrectie worden aangepast en door tests worden afgedekt. Nog niet gewijzigd.

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
| Snoek | [Cittadino et al. (2024), snoek en snoekbaars in gereguleerde laaglandrivier](https://doi.org/10.1007/s10750-024-05533-2) | Seizoen, temperatuur, rivierafvoer en beschikbaarheid van refugia hangen samen met beweging en habitatgebruik | Beweging is niet hetzelfde als voedselopname of vangbaarheid; de beperkte off-channel habitat van de onderzochte rivier is contextspecifiek |
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


## 8. Parameterinventaris bestaande soortprofielen

**Bron:** `src/services/fishProfiles.ts` op `main`, geverifieerd 16 november 2026. Dit is een inventaris van huidige codewaarden, geen goedkeuring van de biologische juistheid.

| Profiel | Thermisch optimum (°C) | Koude-/warme breedte | Code-optimum bereik (°C) | Voorkeursvakken (heuristisch) |
|---|---:|---:|---:|---|
| Karper | 21,0 | 5,8 / 5,5 | 16–24 | Ochtend, avond, nacht |
| Brasem | 17,5 | 6,2 / 5,8 | 12–21 | Ochtend, avond, nacht |
| Snoek | 12,5 | 6,5 / 6,0 | 8–17 | Ochtend, middag, avond |
| Baars | 16,5 | 6,0 / 5,5 | 11–20 | Ochtend, middag, avond |
| Voorn | 15,0 | 6,5 / 6,0 | 10–19 | Ochtend, middag, avond |
| Zeelt | 20,5 | 5,0 / 5,0 | 16–24 | Ochtend, avond |
| Snoekbaars | 15,0 | 6,2 / 6,0 | 10–18 | Nacht, avond, ochtend |
| Meerval | 22,0 | 5,0 / 5,0 | 18–26 | Nacht, avond |
| Roofblei | 18,5 | 5,5 / 5,0 | 14–23 | Ochtend, middag, avond |
| Overig (fallback) | 16,5 | 6,0 / 5,5 | 12–20 | Ochtend, avond |

### 8.1 Wat de getallen technisch betekenen

- `thermalOptimum`, `thermalWidthCold` en `thermalWidthWarm` vormen de parameters voor de huidige asymmetrische Gaussische thermische respons.
- De profielbreedtes bepalen hoe snel de theoretische thermische efficiëntie afneemt aan de koude en warme kant van het optimum.
- De kolom 'code-optimum bereik' is een apart profielveld voor de uitlegtekst; dit is niet automatisch hetzelfde als een empirisch vastgesteld fysiologisch optimum of een vangstoptimum.
- De voorkeursvakken zijn beschrijvende hypotheses. De huidige activiteitsscore kent er geen numerieke bonus aan toe.
- De profielvelden voor windrichting, windsnelheidsdrempel, luchtdruksensitiviteit/-bereik, regen, bewolking en seizoensgewichten zijn eveneens voorlopig. Ze veranderen de huidige numerieke activiteitsscore niet.
- Het profiel `Overig` gebruikt generieke waarden. Dit is een terugvaloptie wanneer de soort niet is gespecificeerd en geen soortspecifieke biologische voorspelling.

### 8.2 Parameterbeoordeling

Voor geen van de negen concrete soorten is in deze audit al aangetoond dat de huidige combinatie van optimum, koude-/warme breedte en code-optimum bereik rechtstreeks uit een geschikte veldstudie is afgeleid. De literatuurverkenning in §7 ondersteunt dat soortverschillen bestaan, maar bevat uiteenlopende meetuitkomsten en experimentele/veldcontexten. De huidige getallen blijven daarom **voorlopige modelaannames**.

Vervolg per soort:
1. traceer iedere parameter naar de exacte bron en de gemeten responsvariabele;
2. noteer soort, levensfase, populatie, watertype, temperatuurgebied, onderzoeksopzet en beperkingen;
3. bepaal of de bron activiteit, foerageren, groei, overleving of thermische voorkeur meet;
4. gebruik geen groeidata als directe voedings- of vangstcurve zonder expliciet overdraagbaarheidsargument;
5. waar directe data ontbreken: markeer de parameter als hypothese en toon hogere onzekerheid, in plaats van een preciezer getal te verzinnen.

**Besluit:** geen enkele huidige profielwaarde wordt in deze audit aangepast. Eerst wordt de herkomst per parameter beoordeeld en een passende validatiebaseline vastgesteld.

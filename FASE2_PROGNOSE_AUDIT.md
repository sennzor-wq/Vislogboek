# Fase 2 — audit bestaande biologische prognose

**Status:** doorlopende Fase 2-audit; factorinventaris, responsmatrix en productdoel zijn vastgelegd; normalisatie, coverage en onafhankelijke validatie staan nog open  
**Peildatum:** 19 november 2026  
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
- De duurvergelijkbaarheid is geïmplementeerd: de werkelijke sessieduur moet op minuutprecisie overeenkomen met de vooraf vastgelegde duur; afwijkingen en onbekende duur worden afzonderlijk geteld en uitgesloten.
- De aanvullende tijdvenstercontrole is gerealiseerd: bij exacte targetWindowStart/targetWindowEnd worden werkelijke start/eindtijd op minuutprecisie vergeleken; oudere snapshots vallen terug op het vooraf gekozen targetSlot. Zonder beide vormen van tijdcontext wordt de waarneming als tijdvenster-onbekend uitgesloten. Er wordt geen willekeurige tolerantie of achteraf omgerekende kans gebruikt.
- De VisCoach-snapshotroute gaf de geplande tijdvensterwaarden nog niet door aan de persistente sessiesnapshot; dit is hersteld in PR #138.
- De regressietests dekken gelijke duur, afwijkende duur, onbekende duur, verschoven tijdvenster bij gelijke duur en fallback op het gekozen tijdvak. PR #138 is gemerged; zowel de PR-head Quality Gate als de Quality Gate op de mergecommit zijn volledig geslaagd.
- Daarna blijft de beoordeling van lokale kalibratie afhankelijk van voldoende echte, vergelijkbare sessies. Geen arbitraire minimumsteekproef of tolerantie toevoegen.
- **Fase 2-acceptatie blijft geblokkeerd** totdat de Quality Gate groen is, de overige criteria zijn afgevinkt en de resterende wetenschappelijke beperkingen expliciet zijn geaccepteerd. Fase 3 start niet eerder.


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
- **Tijd- en inspanningscontext:** snapshots hebben targetSlot, targetWindowStart/End, durationHours en durationKnown; sessies hebben startTime, endTime, durationMinutes, plannedDurationHours en plannedEndTime. De Brier-evaluator vergelijkt geplande en werkelijke duur op minuutprecisie, plus exacte geplande/werkelijke start- en eindtijd; oudere snapshots vallen terug op het gekozen Amsterdamse starttijdvak. Ontbrekende tijdcontext wordt apart geteld en uitgesloten.
- **Soortdiagnostiek:** EvaluationResult rapporteert naast de totaalscore ook aantallen, Brier-score, gemiddelde voorspelde kans, waargenomen vangstfrequentie en kalibratiebins per doelsoort. Kleine aantallen blijven beschrijvend.
- **Dag- en tijdvakuitvoer:** PrognosisSnapshot.prognosisData bewaart de volledige DayPrognosis, inclusief dagadvies, bestTimeSlot, de vier timeSlots en hun thermische activiteitspotentie. De snapshot heeft daarnaast één targetSlot en één predictedActivityScore.

### Wat nog niet valideerbaar is met de huidige registratie

1. **Tijdvakrangschikking:** de dagprognose bewaart activiteitspotentie per tijdvak, maar niet een afzonderlijke, vooraf vastgelegde vangstkans per tijdvak. Een sessie-uitkomst kan bovendien meerdere tijdvakken omvatten. De huidige gegevens rechtvaardigen dus geen claim dat de app al weet welk tijdvak de hoogste vangstkans had.
2. **Werkelijke inspanning per tijdvak:** FishingSession bewaart sessiestart/-einde en geplande duur. Optionele SessionRod.activeIntervals kunnen hengelinzet per tijdvak verfijnen, maar zijn niet gegarandeerd aanwezig. Zonder passende inspanningsregistratie zijn vangstaantallen tussen tijdvakken niet eerlijk vergelijkbaar.
3. **Vangsttijdstip:** CatchItem.timestamp en optionele hengelgebeurtenissen kunnen tijdinformatie bevatten. Hun volledigheid en bronbetrouwbaarheid moeten eerst worden geaudit; vangsttijd alleen levert geen nulvangst- of blootstellingslabel voor elk ander tijdvak.
4. **Habitat/aanwezigheid:** habitatAnalysis is kwalitatieve modeluitvoer. Aanwezigheidsobservaties bestaan, maar de sessie-sync kan session.updatedAt als observatietijd gebruiken; dat is niet noodzakelijk het fysieke waarnemingsmoment. Er is geen gegarandeerd soortspecifiek, tijdgestempeld detectie-/afwezigheidslabel.
5. **Voeding/foerageren en activiteit:** de bestaande sessieobservaties zijn grove context zonder betrouwbare gebeurtenistijd of expliciete soortidentificatie. Ze zijn niet geschikt als tijdvakgebonden voedingslabels. Er bestaat geen continue onafhankelijke meting van dagelijkse activiteit of directe voedselopname in de sessiedata.
6. **Richting/relatieve omstandigheden:** de snapshots bewaren de modeluitvoer en context, maar de actuele sessie-uitkomst alleen is een ruwe vangstproxy. Voor eerlijke vergelijking zijn herhaalde sessies, vergelijkbare inspanning en controle voor soort, stek, seizoen en techniek nodig; een individuele sessie kan geen alternatieve voorspelling als counterfactual valideren.

### Uitvoeringsvolgorde

1. Audit de feitelijke betrouwbaarheid van CatchItem.timestamp, SessionRod.activeIntervals en hengelgebeurtenissen voordat tijdvak- of inspanningsvalidatie wordt ontworpen.
2. Ontwerp daarna pas de minimale aanvullende snapshot-/registratievelden voor tijdvakrangschikking. Geen nieuwe verplichte gebruikersinvoer toevoegen zolang bestaande data en optionele automatische registratie volstaan.
3. Houd habitat-, voedings- en fysiologische activiteitsevaluatie geblokkeerd totdat onafhankelijke waarnemingslabels met passende tijd- en soortresolutie beschikbaar zijn.

**Besluit:** de huidige code heeft twee echte evaluatiemodules (vangstkans en watertemperatuur). De overige prognoselagen zijn nog niet afzonderlijk gevalideerd. De aanwezigheid van vier tijdvakken in DayPrognosis maakt ze nog niet tot vier onafhankelijk geëvalueerde vangstprognoses.


## 61. Brier-blootstellingsvergelijking en soortdiagnostiek (17 november 2026)

De huidige vangstkans is een persoonlijke Poisson-baseline die expliciet is berekend voor een vooraf geplande sessieduur. De primaire Brier-score mag daarom alleen een sessie vergelijken waarvan de werkelijke bevistijd overeenkomt met die vooraf voorspelde duur.

### Definitieve vergelijkbaarheidsregel

- De voorspelde duur komt uit de onveranderlijke snapshot (durationHours; 0 of expliciet onbekend is niet bruikbaar).
- De werkelijke duur wordt bepaald uit de gekoppelde sessie (endTime - startTime), niet uit een achteraf gewijzigde geplande duur.
- Vergelijk beide op minuutprecisie. Alleen gelijke duur telt mee in de primaire Brier-score.
- Een afwijkende duur wordt uitgesloten en apart geteld; een ontbrekende/onbekende voorspelde duur wordt eveneens apart geteld.
- Er wordt geen willekeurige tolerantie gekozen en de voorspelde kans wordt niet achteraf naar de werkelijke duur omgerekend. Een dergelijke omzetting vereist eerst een afzonderlijk gevalideerde methode.
- De huidige vangstkans is niet per tijdvak berekend. Het opgeslagen targetSlot wordt uitsluitend als fallback gebruikt om te controleren of de sessie in het vooraf gekozen starttijdvak begon; dit creëert geen tijdvakvangstkans en valideert geen rangschikking tussen tijdvakken.

### Soortspecifieke diagnose

- Behoud de bestaande totaalscore, rolling baseline en kalibratietabel.
- Rapporteer daarnaast per doelsoort het aantal geldige sessies, de beschrijvende Brier-score, gemiddelde voorspelde kans en gerealiseerde vangstfractie.
- Toon de aantallen altijd naast de scores. Kleine soortsteekproeven blijven beschrijvend; ze bewijzen geen robuuste prestatie.
- Een soortspecifieke score mag de prognose niet bijsturen en wordt niet gebruikt als automatische modeltraining.

### Regressie-acceptatie

- Exact gelijke voorspelde/werkelijke duur telt mee.
- Een sessie met afwijkende duur telt niet mee en verhoogt uitsluitend de mismatchteller.
- Een onbekende of ontbrekende voorspelde duur telt niet mee en verhoogt uitsluitend de onbekende-duurteller.
- Een verschoven exact tijdvenster telt niet mee; als exact venster ontbreekt, wordt het opgeslagen starttijdvak vergeleken. Zonder beide wordt de tijdcontext als onbekend uitgesloten.
- Oude modelversies, benchmarks, onvolledige koppelingen, onbekende uitkomsten en niet-vooraf gemaakte voorspellingen blijven uitgesloten.
- De soortuitsplitsing moet dezelfde gevalideerde Brier-eligible set gebruiken als de totaalscore.

**Status:** PR #138 is gemerged als 53bf5616b85edf5690043840855a7ebf87b15184. De exacte PR-head Quality Gate #44393169257 en de main mergecommit Quality Gate #44393310926 zijn volledig geslaagd. De technische vergelijkbaarheidscontrole en soortdiagnostiek zijn gerealiseerd; tijdvakrangschikking en de overige biologische tussenlagen blijven afzonderlijke, nog niet gevalideerde uitkomsten.


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


## 69. Beschrijvende tijdvak-vangstbewijsdiagnose (18 november 2026)

Er is een aparte audithelper toegevoegd om vangsttijdregistraties niet te verwarren met bewezen vangstmomenten. De helper werkt alleen op afgeronde, niet-benchmark sessies met precies één doelsoort en een valide sessievenster.

- `automatic` wordt uitsluitend geteld als formulier-open-/registratietijd; het levert geen tijdvakvangstlabel op.
- `user_adjusted` kan een positief, expliciet als gebruikersgerapporteerd signaal opleveren als het tijdstip binnen de sessie valt. Het blijft geen onafhankelijke verificatie.
- Oude/herkomstloze en legacy-onbekende tijden, ongeldige tijden en tijden buiten de sessie worden uitgesloten en apart geteld.
- Een vangst in één tijdvak maakt andere tijdvakken niet tot nulvangst; die blijven onbekend.
- Alleen een expliciet bevestigde nulvangstsessie zonder gekoppelde vangstregistraties kan nulvangstlabels leveren, en alleen voor tijdvakken met geregistreerde hengelblootstelling.
- Bijvangst van een andere soort wordt niet als doelsoortvangst behandeld. Meersoortige sessies worden uitgesloten van soortspecifieke tijdvaklabels.
- Groepsvangst blijft één geregistreerd tijdstip; groepsaantal wordt apart vermeld.
- Tegenstrijdige sessie-uitkomsten (bijvoorbeeld `skunk_confirmed` met gekoppelde vangsten) worden uitgesloten.

De helper is alleen beschrijvend en offline. Geen catch rate, Brier-score, prognosegewicht of biologische leerlabel wordt berekend of geactiveerd.


## 70. Persoonlijke tijdvakervaring explicieter gelabeld (18 november 2026)

De prognosekaart noemde dit blok eerder "Eigen Vangsthistorie in dit tijdvak", terwijl de berekening volledige sessies op hun starttijd groepeert. De kop is gewijzigd naar "Eigen sessie-uitkomsten bij starts in dit tijdvak". De toelichting noemt nu expliciet doelsoortvangst en bij voldoende waarnemingen het percentage sessiesucces, niet een tijdvakgebonden vangstkans of vangsttempo. De onderliggende berekening blijft ongewijzigd: hele sessies worden ingedeeld op starttijd en beïnvloeden geen biologische score of tijdvakrangschikking.


## 71. Dubbele registratie van één brasem-/blankvoornvoedingsstudie geconsolideerd (18 november 2026)

De Římov 2004-studie naar in-situ zoöplanktonconsumptie bij subadulte/volwassen brasem en blankvoorn stond tweemaal in het research register onder verschillende ID's en licht verschillende bibliografische schrijfwijzen. Beide records verwezen naar dezelfde auteurs, titel, tijdschrift en pagina's; het waren geen onafhankelijke studies.

De registratie is geconsolideerd tot één canonieke bron-ID voor beide soorten. De uitgebreidere bronverwijzingen zijn behouden en de relevante beperking uit het dubbele record is samengevoegd: ander veldonderzoek bij juveniele brasem/blankvoorn vond nachtelijke pelagische voedselopname, zodat levensfase en habitat het waargenomen ritme kunnen omkeren.

Dit wijzigt geen bewijsgoedkeuring, numerieke parameter, voedingsscore of tijdvakbonus. De bron blijft `approvedForPrediction: false`. Een regressietest voorkomt dat dezelfde studie opnieuw als twee bewijsrecords wordt ingevoerd.


## 72. Aanvullende veldbron voor seizoensdieet van roofblei (18 november 2026)

Een oudere veldstudie uit de Szczecin Firth (materiaal 1972 en 1974–1975) is toegevoegd als beperkte bron voor dieetcompositie. De auteurs onderzochten expliciet voedselcompositie en frequentie van prooien: zomerdiëten bevatten meerdere vissoorten, terwijl in andere seizoenen vooral spiering werd aangetroffen.

De bron is uitsluitend geregistreerd als `diet_composition`. Zij meet geen voedingsintensiteit, tijdstipgebonden voedselopname of dag-nachtritme. De bestaande conclusie blijft daarom ongewijzigd: voor roofblei is in het register geen directe soortspecifieke diel-feedingbron aanwezig; telemetrie blijft bewegingsbewijs en dieet blijft dieetbewijs. De bron blijft `approvedForPrediction: false`.


## 73. Wild-karpervoeding en wedstrijdvangsten als aparte bewijssoorten (18 november 2026)

De karper-evidencelaag is uitgebreid met drie contextueel verschillende studies:

- **Bajer et al. (2010):** directe veldmeting van maïconsumptie per twee uur gedurende vijf dagen in een meer; consumptie nam sterk toe na zonsondergang en piekte midden in de nacht. Een tweede experiment volgde 34 radio-gemerkte karpers bij een nieuw bijgevoerd punt.
- **Hundt et al. (2022):** PIT-monitoring van 344 karpers bij kunstmatig bijgevoerd gemonitorde stations in Parley Lake; aggregaties waren het actiefst van schemering tot zonsopkomst, met korte voedselbezoeken en grote individuele verschillen.
- **Rahman et al. (2008):** jonge karpers in gesimuleerde vijvers graasden zowel dag als nacht zonder duidelijke dagelijkse piek. Dit vormt gecontroleerd, levensfase-/opzetgebonden tegenbewijs tegen een universeel nachtpatroon.

Daarnaast is **Žák (2021)** geregistreerd onder een nieuw, afzonderlijk uitkomsttype `angler_catch_distribution`: 14 Europese karperwedstrijden lieten meer nachtelijke landingen zien. Dit is wedstrijdvangstverdeling, geen directe meting van voedselopname. De gegevens leveren geen algemeen gevalideerde hengeluren-noemer per tijdvak en mogen daarom niet als feeding-rhythm bron of tijdvakvangstkans worden gebruikt.

Alle vier registraties blijven `approvedForPrediction: false`. De studies ondersteunen een contextgebonden veldhypothese voor nachtelijk foerageren bij volwassen/wilde karper, maar tonen ook verschillen tussen veld, aasstation, wedstrijd en jonge karper in gesimuleerde vijvers. Er is geen universele nachtbonus of modelgewicht geactiveerd.


## 74. Volwassen-karpervoeropname en aasontmoeting versus vangbaarheid (18 november 2026)

Twee aanvullende veldstudies verfijnen de karperlaag:

- **Ghosal et al. (2018):** 30 volwassen karpers werden in een meer van 67 ha met radiozenders gevolgd. Bij een kunstmatig bijgevoerd maïspunt werd voedselconsumptie iedere zes uur gewogen gedurende zeven dagen. De nachtelijke consumptie nam sterk toe en bereikte tegen dag zeven ongeveer tienmaal de dagwaarde. De consumptiereeks was echter descriptief en niet formeel statistisch getoetst; één meer, één baiting-opzet.
- **Monk & Arlinghaus (2017):** whole-lake telemetrie en experimenteel vissen op vaste bijgevoerd-locaties lieten zien dat karper en zeelt het aas bezochten, maar dat gemeten ontmoetings-/bewegingskenmerken individuele vangbaarheid niet significant verklaarden. Gedrag ná het ontmoeten van aas, zoals daadwerkelijke opname, kan bepalender zijn.

Voor de tweede studie is een apart uitkomsttype `angler_vulnerability` toegevoegd. De bron wordt niet als feeding-rhythm of habitatbonus gelezen. Beide bronnen blijven `approvedForPrediction: false`; geen score, tijdvakbonus of modelgewicht verandert.


## 75. Scheiding standaard- en geavanceerde prognoseweergave (18 november 2026)

Productbesluit: de bestaande instelling `showAdvancedPrognosisDetails` is de centrale schakelaar voor detailniveau op de prognosepagina. De instelling verandert uitsluitend de presentatie; berekeningen, modelinputs, opgeslagen prognosesnapshots en biologische onderzoeksregistraties blijven gelijk.

**Standaardweergave**
- Kernuitkomsten: activiteitspotentie, persoonlijke vangkans, beste vistijd en compacte praktische stek-/voeradviezen.
- Geen literatuurkaarten, bronbeperkingen, modelaannames, technische factoruitleg, onzekerheidsdiagnostiek of uitgebreide statistische duiding.
- Bij onvoldoende watertemperatuur blijft een korte, duidelijke waarschuwing zichtbaar; de onderliggende technische datakwaliteit blijft geavanceerd.

**Geavanceerde weergave**
- De volledige sectie “Wat zegt onderzoek over voeding bij [vissoort]?” met de twee gevraagde groepen: gemeten voedselopname/voedingsritme en foerageergedrag.
- Uitgebreide uitleg bij prognose-elementen, tijdvakfactoren, datakwaliteit, onzekerheid, thermische ontwikkeling, habitat-/windanalyses, wetenschappelijke bronnen en biologische modelaannames.

Dieet-/prooikeuze blijft in het onderzoeksregister beschikbaar als wetenschappelijke context, maar wordt niet als extra derde kaart op de prognosepagina getoond. De standaardweergave toont geen verborgen lege uitklapvlakken; tijdvakdetails zijn alleen uitklapbaar in de geavanceerde weergave.

Er zijn geen prognoseberekeningen, biologische scores, factoren of modelgewichten aangepast.


## 76. Wild karper: direct rivierbewijs nuanceert nachtelijke aasstationpatronen (18 november 2026)

Kwak et al. (1992) is toegevoegd aan het centrale research register als directe veldbron voor voedingsintensiteit en dagritme bij gewone karper. De studie bepaalde de voedingschronologie uit maag-/voorkeeldarminhoud in de Vermilion River (Illinois). Bij karper was de voedselopname discontinu en sterk variabel tussen individuen, uren en maanden; de hoogste gemiddelde voedingsintensiteit lag rond zonsopkomst en zonsondergang. De auteurs beschrijven daarnaast verschillen in microhabitat tussen perioden met hoge en lage voedselopname.

Deze bron nuanceert de eerder geregistreerde nachtelijke consumptie bij volwassen wilde karper op kunstmatig bijgevoerd meerpunten (Bajer 2010; Ghosal 2018) en de schemer-/nachtelijke detecties bij bijgevoerd gemonitorde stations (Hundt 2022). Ze staat ook naast de studie met jonge karpers in gesimuleerde vijvers waarin geen duidelijke dagelijkse graaspiek werd gevonden (Rahman 2008). De verschillen zijn contextgebonden; ze ondersteunen geen universele nacht-, ochtend- of schemerbonus.

De bron is geclassificeerd als `feeding_intensity`, `feeding_rhythm` en `habitat_use`, niet als hengelvangbaarheid. De registratie blijft `approvedForPrediction: false`. De uitkomst is niet zonder meer overdraagbaar van één Illinois-rivier naar Nederlandse stilstaande wateren, Lokkershoek of method-feederpresentatie. Er zijn geen score, tijdvakvoorkeur, modelgewicht of vangstkans gewijzigd.


## 77. Meerval: noordelijke veldtelemetrie verfijnt seizoensgebonden dieptegebruik (18 november 2026)

Bergström et al. (2024) is toegevoegd als veldbron voor locomotorische activiteit en habitatgebruik bij volwassen Europese meerval in het Zweedse Möckelnmeer. Van 55 gemerkte dieren werden 15 dataloggers teruggevonden; 11 bevatten langdurige hoogfrequente gegevens. Diepte werd per minuut en temperatuur per vijf minuten geregistreerd. De noordelijke populatie vertoonde seizoensafhankelijk gedrag: hogere nachtelijke verticale activiteit in februari–maart en juli–oktober, geen dag-nachtverschil in april–juni en zeer lage activiteit in december–januari. In juli–oktober stegen dieren rond schemering vanuit diepere bodemlagen naar de bovenste waterlaag en keerden rond dageraad terug.

De auteurs interpreteren het patroon in de warme maanden als waarschijnlijk foerageergedrag. De sensoren maten echter diepte en beweging, niet daadwerkelijke voedselopname. De bron is daarom uitsluitend geregistreerd als `locomotor_activity` en `habitat_use`; niet als `feeding_rhythm`, `feeding_intensity` of vangbaarheid. Dit is bovendien één genetisch onderscheiden noordelijke Zweedse populatie met beperkte teruggewonnen tagreeksen en geen directe overdracht naar Nederlandse wateren.

De registratie blijft `approvedForPrediction: false`. De bron verrijkt de beschrijving van seizoens-/dieptegedrag, maar levert geen nachtbonus, voedingsscore, thermische parameter of numerieke modelbijdrage op.

## 78. Audit soortprofiel-aannames en dekking van de bewijsregistratie (18 november 2026)

### Code- en UI-trace

- `SpeciesProfile` bevat als enige numerieke biologische profielparameters `thermalOptimum`, `thermalWidthCold` en `thermalWidthWarm`. `calculateThermalEfficiency()` gebruikt uitsluitend deze drie voorlopige waarden.
- `description`, `assumptions` en `scientificReferences` zijn verklarende metadata. Ze worden in de geavanceerde prognoseweergave getoond, maar leveren geen numerieke bijdrage aan `activityScore`.
- De overige factoren (wind, druk, seizoen/licht, bewolking, neerslag) blijven context of worden door afzonderlijke habitat-/positioneringsmodules gebruikt. Er is nog geen soortspecifieke wind-, wolken-, regen-, zuurstof- of stromingsbron in het centrale register. De gerichte drukreview in §79 voegt twee beperkte drukbronnen toe; geen daarvan ondersteunt een universele activiteit- of voedingsbonus.
- Alle 86 registraties in `RESEARCH_REGISTRY` hebben `approvedForPrediction: false`. De aanvullende bronnen uit §§97, 100 en 101 zijn uitsluitend context-/bewijsregistraties; geen bron is vrijgegeven als numerieke voorspellingsfactor. Een bronregistratie of evidenceStrength is dus geen toestemming om een factor als numerieke voorspellingsregel te activeren.

### Soortspecifieke dekking in het research register

Onderstaande aantallen zijn **aantallen registerrecords per gemeten uitkomstgroep**, geen aantallen onafhankelijke steekproeven, kwaliteitscijfers of gevalideerde modelparameters. Eén record kan meerdere uitkomsten beschrijven en de overdraagbaarheid verschilt per levensfase, water en onderzoeksopzet.

| Doelsoort | Metabolisme / aerobe scope | Voedselopname / foerageren | Beweging / habitat | Dieet / prooikeuze | Vangbaarheid / vangstverdeling | Totaal records |
|---|---:|---:|---:|---:|---:|---:|
| Karper | 1 | 11 | 6 | 0 | 2 | 14 |
| Brasem | 1 | 5 | 5 | 2 | 0 | 11 |
| Snoek | 1 | 3 | 6 | 1 | 2 | 12 |
| Baars | 1 | 3 | 3 | 1 | 1 | 9 |
| Blankvoorn* | 1 | 6 | 4 | 2 | 0 | 11 |
| Zeelt | 0 | 4 | 2 | 1 | 1 | 5 |
| Snoekbaars | 1 | 3 | 3 | 2 | 0 | 10 |
| Meerval | 0 | 4 | 6 | 1 | 0 | 10 |
| Roofblei | 0 | 0 | 2 | 3 | 0 | 5 |
| **Totaal** | — | — | — | — | — | **86 unieke records** |

### Wat deze dekking betekent

1. **Thermische fysiologie:** voor baars en snoekbaars bestaat relatief directer bewijs voor metabolisme/aerobe scope; voor brasem/blankvoorn bestaan vergelijkende metabolismegegevens; voor karper en snoek zijn de geregistreerde thermische meetpunten beperkt. Voor zeelt, meerval en roofblei ontbreekt in het register een vergelijkbare soortspecifieke metabolisme-/aerobe-scopecurve. Geen van deze bronnen valideert de exacte `thermalOptimum` of curvebreedtes in `fishProfiles.ts`.
2. **Voedselopname:** karper en blankvoorn hebben de breedste geregistreerde voedings-/ritmebasis, maar de bronnen verschillen sterk in veld versus gecontroleerde opzet, levensfase, aasstations en habitat. Brasem, snoek, baars, zeelt, snoekbaars en meerval hebben beperktere of contextgebonden dekking. Voor roofblei ontbreekt directe soortspecifieke dagdeel-resolved voedselopname; dieet- en telemetriebronnen vullen dat gat niet.
3. **Beweging en habitat:** voor meerdere soorten bestaat telemetrie- of veldbewijs, maar beweging, dieptegebruik en habitatkeuze zijn geen directe voedselopname of vangbaarheid. De uitkomstsoorten blijven gescheiden. De vijf extra registraties verdiepen vooral de ruimtelijke context voor meerval, snoek en blankvoorn/brasem; ze leveren geen nieuwe directe voedings- of vangbaarheidslabels.
4. **Belangrijkste soortspecifieke gaten:** voor roofblei ontbreken nog steeds directe tijdgebonden voedselopname- en voedingsritmegegevens; dieet- en bewegingsbronnen vullen dit niet in. Voor meerval bestaan wel meerdere voedingsritme-/voeropnameregistraties, maar een deel komt uit gecontroleerde voeropstellingen en de veldtelemetrie meet vooral beweging/diepte. Voor zeelt is de registerbasis klein en sterk contextafhankelijk. Voor karper is de bronbasis breder, maar aasstation-, gecontroleerde en wilde-veldresponsen blijven niet onderling uitwisselbaar.
5. **Wind, luchtdruk, bewolking, regen, zuurstof en stroming:** voor deze factoren bevat het register momenteel geen soortspecifieke bronregistraties met een onafhankelijk gemeten effect op voedselopname of totale activiteit. Wind blijft bruikbaar voor lokale oever-/positioneringsanalyse, maar niet als generieke activiteitbonus. Luchtdruk en overige weersfactoren blijven context totdat onafhankelijke, soortspecifieke evidence is geregistreerd.
6. **Levensfase en lichaamsgrootte:** meerdere fysiologische en voedingsstudies tonen levensfase- of lichaamsgrootte-effecten. De huidige app vraagt geen verplichte leeftijd of lengte voor de prognose; vangstlengtes zijn bovendien geen representatieve populatiesteekproef. Het model mag daarom geen volwassen/juveniele respons afleiden uit een willekeurige vangstmaat.

### Profielnotities en referenties opgeschoond

- De beschrijvingen en aannames in `fishProfiles.ts` zijn herzien om directe voedselopname, locomotorische activiteit, habitatgebruik en fysiologie niet door elkaar te halen.
- Onvoldoende onderbouwde vaste wind-, druk- en weersclaims zijn verwijderd of expliciet als niet-gevalideerde context geformuleerd. Diel-patronen zijn voorzien van context-/levensfasebeperkingen.
- De numerieke thermische profielwaarden zijn ongewijzigd en blijven voorlopige modelprioren.
- De profielreferentielijsten bevatten 82 vermeldingen. Na de bronupdates in §§100–101 zijn 55 DOI-verwijzingen in het centrale register teruggevonden. Van 27 verwijzingen zonder DOI zijn er 12 op auteursnaam teruggevonden; 15 blijven tijdens deze statische controle ongematcht. Dit zijn niet automatisch onjuiste bronnen; niet-geverifieerde boeken/rapporten blijven uitsluitend achtergrondliteratuur en mogen geen directe modelregel onderbouwen.
- De geavanceerde UI vermeldt nu expliciet dat profielnotities context/aannames zijn en dat bronvermelding geen validatie van de numerieke thermische curve betekent.

### Status en vervolg

Deze stap wijzigt geen thermische optimumwaarde, curvebreedte, activiteitsscore, tijdvakvoorkeur, vangstkans, factorgewicht of gebruikersinvoer. De factorinventaris is nog niet volledig en fase 2 blijft in audit.

Volgende hoofdspoorstappen:
1. Verifieer de niet-gematchte oudere profielreferenties; registreer relevante bronnen met gemeten uitkomst en beperkingen of verwijder ze uit de profielbronlijst.
2. Onderzoek gericht onafhankelijke bronnen voor wind, druk, zicht/troebelheid, neerslag, zuurstof en stroming per soort, met onderscheid tussen activiteit, voedselopname, habitat en visbaarheid.
3. Voltooi de matrix per soort: actief in activiteitsscore, actief in habitat-/positioneringsmodel, alleen context, niet beschikbaar of bewust uitgesloten.
4. Stel pas na die matrix een kandidaatmodel en chronologisch validatieprotocol op. Geen numerieke factor activeren op basis van de huidige bronregistratie alleen.
## 79. Gerichte literatuurcheck luchtdruk en troebelheid (18 november 2026)

### Luchtdruk: beweging is niet hetzelfde als voedselopname

- **Europese baars — Sandberg (2020):** akoestische telemetrie van 54 baarzen in drie boreale meren. Meer dagelijkse luchtdrukvariabiliteit hing samen met minder zwemactiviteit in twee van de drie meren; de relaties met temperatuur en licht waren eveneens niet universeel. Geregistreerd als `locomotor_activity`, beperkte bewijssterkte, niet goedgekeurd voor directe voorspelling.
- **Verwante soort — VanderWeyst (2014):** 12 laboratoriumproeven met juveniele Noord-Amerikaanse yellow perch (*Perca flavescens*) vonden geen significant verband tussen luchtdruk en voedselconsumptie (P = 0,55). De auteur benoemt gewenning aan laboratoriumomstandigheden als verstorende factor. Deze soort is expliciet niet gekoppeld aan Europese baars (*Perca fluviatilis*); de bron blijft alleen een verwante-taxonomische vergelijking.
- **Modelconclusie:** luchtdruk kan in sommige populaties samenhangen met beweging, maar dat bewijst geen hogere of lagere voedselopname. De gegevens ondersteunen geen universele drukbonus, drukmalus of vangstkansregel. Luchtdruk blijft context totdat soort-, water- en respons-specifieke replicatie beschikbaar is.

### Troebelheid en zicht: richting van effect verschilt

- **Zanghi & Ioannou (2024):** review van 281 peer-reviewed studies naar troebelheid en predator-prooi-interacties bij zoetwatervissen. De review vond uiteenlopende gedrags- en foerageerreacties; negatieve effecten kwamen vaker voor bij predatoren dan bij prooivissen, maar de resultaten zijn taxonomisch en geografisch scheef verdeeld. Geregistreerd als algemene omgevingsliteratuur, niet als primaire gemeten uitkomst of soortspecifieke bron, en niet goedgekeurd voor directe voorspelling.
- **Modelconclusie:** troebelheid kan zicht, prooidetectie, predatorrisico en habitatgebruik veranderen, maar de richting hangt af van soort, prooi, levensfase en habitat. Er is geen universele NTU-drempel of vaste activiteitbonus voor de Vislogboek-soorten.

### Wind en overige weers-/waterfactoren

- De gerichte zoekronde leverde geen voldoende sterke, soortspecifieke bron op die een zelfstandige windrichting- of windsnelheidsbonus voor totale activiteit of voedselopname rechtvaardigt.
- Wind blijft wel bruikbaar voor lokale tactiek: oeveroriëntatie, golfslag, mogelijke voedselverplaatsing en werprichting. Dat is een positionerings-/habitatvraag, niet automatisch een hogere totale activiteit.
- Voor neerslag, bewolking als zelfstandige factor, opgeloste zuurstof en stroming is aanvullende soort- en watertype-specifieke bronbeoordeling nodig. Ontbrekende zuurstofmetingen mogen niet uit watertemperatuur of weer worden afgeleid.

Bronnen:
- Sandberg, L. (2020). *Movement of the Eurasian perch (Perca fluviatilis) – individual responses to abiotic factors*. Umeå University, Degree Thesis in Biology, 15 ECTS. https://umu.diva-portal.org/smash/get/diva2:1446518/FULLTEXT01.pdf
- VanderWeyst, D. (2014). *The Effect of Barometric Pressure on Feeding Activity of Yellow Perch*. Journal of Earth and Life Science, 50. https://www.bemidjistate.edu/directory/wp-content/uploads/sites/16/2023/02/2014-VanderWeyst-D.-The-effect-of-barometric-pressure-on-feeding-activity-of-yellow-perch..pdf
- Zanghi, C. & Ioannou, C.C. (2024). *The impact of increasing turbidity on the predator–prey interactions of freshwater fishes*. Freshwater Biology, 70(1), e14354. https://doi.org/10.1111/fwb.14354

**Status:** deze drie bronnen zijn toegevoegd aan het research register met expliciete beperkingen en `approvedForPrediction: false`. Er zijn geen activiteitsscores, thermische parameters, tijdvakbonussen of gewichten aangepast.

## 80. Gerichte audit zuurstof, stroming, regen en bewolking (18 november 2026)

### Opgeloste zuurstof: mogelijk relevant, maar alleen met echte meting

- **Bauer & Schlott (2006):** radio-telemetrie in één met ijs/sneeuw bedekte aquacultuurvijver volgde karper tijdens een winterse zuurstofcrisis. De vissen verplaatsten zich naar ondieper water bij een instromende beek met beter zuurstofgehalte; voeding stopte tijdens de crisis en totale activiteit correleerde significant met opgeloste zuurstof.
- **Benito et al. (2015):** volwassen karpers in één Ebro-reservoir benutten juist ook sterk hypoxische waterlagen (gerapporteerd onder 1,1 mg/L), vooral 's nachts. Stroming en habitatgebruik verschilden tussen individuen.
- **Modelconclusie:** zuurstof kan onder specifieke omstandigheden activiteit, voedselopname en habitatkeuze beïnvloeden, maar karperrespons is contextafhankelijk. Deze twee studies ondersteunen geen universele zuurstofdrempel of algemene zuurstofbonus. Zuurstof mag niet uit temperatuur, regen, bewolking of luchtdruk worden afgeleid. Zonder directe meting blijft de factor onbekend en buiten de numerieke prognose.

### Stroming: beweging, fijne activiteit en voedseltoegankelijkheid scheiden

- **Taylor & Cooke (2012):** meta-analyse van rivierafvoer. Niet-migrerende verplaatsing nam gemiddeld toe bij hogere afvoer (27 effectgroottes) en opwaartse migratie eveneens (8). Neerwaartse migratie en fijne-schaalactiviteit waren niet significant (elk 5 effectgroottes); heterogeniteit en mogelijke inclusie-/publicatiebias bleven aanwezig.
- **Benito et al. (2015):** in één stromingsgevoelig reservoir waren karpers bij hogere stroming gemiddeld minder actief en gebruikten zij ondieper water; individuele variatie was substantieel.
- **Ouellet et al. (2025):** de foodscape-review beschrijft hoe snelheid en turbulentie de energetische kosten en toegankelijkheid van prooien beïnvloeden, terwijl stromingsverandering prooien kan verplaatsen en toegang tot zijhabitats kan veranderen. Dit is een algemeen rivierkader, geen soortspecifieke responsfunctie.
- **Modelconclusie:** stroming kan lokale verplaatsing, habitatkeuze en voedseltoegankelijkheid beïnvloeden, maar meer beweging is niet gelijk aan meer voedselopname of vangstkans. Dit is vooral relevant in stromende systemen; geen algemene bonus voor stilstaand water of een exacte wind-/stromingsregel zonder lokale meting.

### Regen en bewolking: huidige meta-evidence is migratiespecifiek en schaars

- **Schlautmann et al. (2026):** Europese meta-analyse met 112 studies, 685.333 individuen, 953 effectgroottes en 50 soorten onderzocht paaigerelateerde migratie. Watertemperatuur was de meest consistente trigger. Stromingsreacties verschilden tussen soorten en stromingsgilden. Voor regen waren slechts twee studies en voor bewolking één studie beschikbaar; formele conclusies voor deze factoren zijn daardoor niet robuust.
- **Modelconclusie:** paaigerelateerde migratie is niet hetzelfde als dagelijkse activiteit of voedselopname. De lage dekking voor regen en bewolking rechtvaardigt geen dagelijkse activiteitsscore, tijdvakbonus of vangstkansaanpassing. Regen kan hoogstens indirecte context leveren wanneer lokale veranderingen in peil, stroming, troebelheid of habitattoegang daadwerkelijk bekend zijn. Bewolking blijft lichtcontext en mag niet los van soort, zicht en daglicht worden gewogen.

### Bijgewerkte factorstatus

| Factor | Veilige huidige rol | Niet toegestaan op basis van deze bronnen |
|---|---|---|
| Opgeloste zuurstof | Gemeten waterkwaliteit-/habitatcontext; potentieel relevante stressor bij aantoonbare afwijking | Afleiden uit weer/temperatuur; universele drempel of karperbonus |
| Stroming/afvoer | Lokale beweging, habitat en voedseltoegankelijkheid in stromende systemen | Universele activiteit- of vangstbonus; overdracht naar stilstaand water |
| Regen | Indirecte context via gemeten/verifieerbare peil-, stromings- of troebelheidsverandering | Zelfstandige dagelijkse activiteit- of voedingsbonus |
| Bewolking | Lichtcontext, eventueel soortspecifiek te onderzoeken | Algemene bewolkingbonus of vaste tijdvakvoorkeur |

**Registry:** vijf bronnen zijn toegevoegd met expliciete meetuitkomsten en beperkingen. De migratiestudie wordt niet als algemene locomotorische activiteit geclassificeerd omdat de registry nog geen afzonderlijk outcome-type voor paaigerelateerde migratie heeft. Alle nieuwe registraties blijven `approvedForPrediction: false`.

**Modelstatus:** geen thermische parameters, activiteitsscores, factorgewichten, tijdvakvoorkeuren of vangstkansen gewijzigd. De volgende stap is de resterende soortspecifieke dekking en beschikbaarheid van meetdata te toetsen en de volledige factor-/bewijs-/datadekkingsmatrix te sluiten.


## 81. Soortdekking en beschikbaarheid van omgevingsdata (18 november 2026)

### Registrydekking per doelsoort

De centrale research registry bevat nu **64 registratierecords**; geen enkel record is goedgekeurd voor directe voorspelling (`approvedForPrediction: false`). De onderstaande aantallen zijn records per soort, geen telling van onafhankelijke publicaties. Eén studie kan meerdere records of uitkomstclassificaties ondersteunen; zie §62 voor het tellen op studie.

| Doelsoort | Records | Voedings-/dieetcontext geregistreerd | Beweging/habitat geregistreerd | Directe hengelvangbaarheid geregistreerd |
|---|---:|---|---|---|
| Karper | 13 | Ja, meerdere typen | Ja | Ja |
| Brasem | 6 | Ja | Ja | Nog niet in register |
| Snoek | 7 | Ja | Ja | Nog niet in register |
| Baars | 7 | Ja | Ja | Nog niet in register |
| Voorn | 8 | Ja | Ja | Nog niet in register |
| Zeelt | 4 | Ja | Ja | Ja |
| Snoekbaars | 8 | Ja | Ja | Nog niet in register |
| Meerval | 6 | Ja | Ja | Nog niet in register |
| Roofblei | 4 | Ja, vooral dieet/prooi en beperkte voedingscontext | Ja | Nog niet in register |

"Voedings-/dieetcontext" betekent niet dat voor elke soort directe veldmetingen van dagelijkse voedselopname beschikbaar zijn. De geregistreerde uitkomst verschilt per bron: voedselopname, voedingsritme, foerageergedrag, dieetcompositie of prooikeuze. Bewegings-/telemetriebronnen blijven gescheiden van voedingsresponsen. Ontbrekende hengelvangbaarheidsregistraties betekenen dat de registry daarvoor nog geen vergelijkbare soortspecifieke basis bevat; zij bewijzen niet dat er wereldwijd geen onderzoek bestaat.

### Omgevingsfactoren: bewijs versus beschikbare invoer

| Factor | Onderzoeksstatus | Huidige app-invoer | Toegestane rol |
|---|---|---|---|
| Watertemperatuur | Breedste fysiologische bewijsbasis, maar soort-/levensfase- en populatieverschillen blijven; curveparameters nog niet onafhankelijk gevalideerd | Gemeten gebruikerswaarde en modelschatting uit temperatuur-/weershistorie | Huidige thermische activiteitspotentie, met expliciete onzekerheid |
| Wind | Fysische oppervlaktecontext; geen universele soortspecifieke vislocatie- of activiteitsscore | Windsnelheid en -richting uit weersbron; oeveroriëntatie optioneel | Werphoek, lijncontrole, oeverrelatie en voorzichtige oppervlaktedriftcontext |
| Regen | Vooral indirecte routes via peil, stroming, troebelheid en habitatverbinding; weinig directe dagelijkse voedingsdata | Neerslag en neerslagkans uit weersbron | Context; geen zelfstandige dagelijkse activiteit- of vangstbonus |
| Bewolking/licht | Licht kan zicht en gedrag beïnvloeden, maar bewijs is soort-/habitatgebonden; nieuwe meta-analyse betreft paaigerelateerde migratie met zeer weinig cloud-studies | Bewolking en zoninstraling uit weersbron | Lichtcontext; geen algemene tijdvakbonus |
| Opgeloste zuurstof | Specifiek karperbewijs onder uitzonderlijke en uiteenlopende omstandigheden; geen universele grens | Geen directe zuurstofsensor-/meetwaarde in de huidige invoerketen | Alleen gebruiken wanneer later werkelijk gemeten; nu onbekend |
| Stroming/afvoer | Beïnvloedt beweging, habitat en voedseltoegankelijkheid in stromende systemen; richting varieert per respons en soort | Watertype geeft alleen grofweg rivier/kanaal versus stilstaand aan; geen gemeten stroomsnelheid of afvoer | Kwalitatieve watertypecontext; geen numerieke score zonder lokale meting |

### Geconstateerde datagaten

1. **Geen zuurstofdata:** de huidige weerbron levert geen opgeloste zuurstof. Windstilte, luchttemperatuur en watertemperatuur zijn geen vervanging.
2. **Geen lokale stromingsdata:** watertype is geen stroomsnelheid. Een rivier-/reservoirstudie kan niet rechtstreeks naar een plas worden overgezet.
3. **Geen systematische lokale prooibeschikbaarheid:** het model kent geen actuele prooidichtheid, natuurlijke voedselverdeling of lokale voedseltoegankelijkheid.
4. **Beperkte directe vangbaarheidsdekking:** geregistreerde hengelvangbaarheid is geconcentreerd bij karper en zeelt; vangsttijdstippen zijn niet hetzelfde als voedselopname.
5. **Beperkte habitatresolutie:** GPS, waterdiepte en door de gebruiker ingevoerde structuren vervangen geen sonarbeeld, bathymetrische kaart of gemeten lokale stroming.

### Consequentie voor modelarchitectuur

De huidige vijf responslagen blijven gescheiden: fysiologische activiteitspotentie, voedings-/foerageeractiviteit, lokale aanwezigheid/habitat, hengelvangbaarheid en persoonlijke vangstkans. Een bron voor beweging vult geen ontbrekende voedingsmeting aan; voedingsbewijs vult geen vangbaarheidsmeting aan. Omgevingsvariabelen zonder betrouwbare invoer blijven onbekend en worden niet ingevuld met plausibele aannames.

**Volgende fase-2-actie:** sluit de factor-/bewijs-/datadekkingsmatrix per soort en per gemeten respons, inclusief bronkwaliteit, watertype, levensfase, seizoensdekking en beschikbaarheid van invoer. Pas daarna kandidaatmodel en chronologisch validatieprotocol uitwerken. Geen numerieke gewichten, nieuwe drempels of tijdvakbonussen activeren op basis van de huidige registrydekking.


## 82. Actuele registry-dekking per soort en gemeten respons (19 november 2026)

De volgende telling is rechtstreeks opnieuw berekend uit de 86 unieke records in `src/services/researchRegistry.ts`. Alle 86 records hebben `approvedForPrediction: false`. De aantallen hieronder zijn records per soort en gemeten respons, geen aantallen onafhankelijke studies, effectgroottes of bewijsgewichten. Eén record kan meerdere responsen bevatten en een bron kan aan meerdere soorten zijn gekoppeld.

### Voeding, foerageren en prooikeuze

| Soort | Records | Voedingsintensiteit | Voedingsincidentie | Voedingsritme | Foerageergedrag | Voedingsfysiologie | Dieetcompositie | Prooikeuze |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Karper | 14 | 6 | 0 | 7 | 7 | 2 | 0 | 0 |
| Brasem | 11 | 3 | 0 | 3 | 2 | 1 | 0 | 2 |
| Snoek | 12 | 3 | 0 | 1 | 0 | 0 | 1 | 0 |
| Baars | 9 | 3 | 0 | 3 | 0 | 0 | 1 | 1 |
| Blankvoorn | 11 | 5 | 0 | 5 | 1 | 1 | 1 | 1 |
| Zeelt | 5 | 3 | 0 | 2 | 1 | 1 | 1 | 0 |
| Snoekbaars | 10 | 3 | 0 | 1 | 0 | 1 | 2 | 1 |
| Meerval | 10 | 3 | 0 | 3 | 1 | 0 | 1 | 0 |
| Roofblei | 5 | 0 | 1 | 0 | 0 | 0 | 3 | 1 |

### Beweging, habitat en hengelvangbaarheid

| Soort | Locomotorische activiteit | Habitatgebruik | Hengelvangstverdeling | Hengelvangsttempo | Hengelvangbaarheid |
|---|---:|---:|---:|---:|---:|
| Karper | 2 | 6 | 1 | 0 | 1 |
| Brasem | 4 | 4 | 0 | 0 | 0 |
| Snoek | 5 | 4 | 0 | 0 | 2 |
| Baars | 3 | 2 | 0 | 1 | 0 |
| Blankvoorn | 2 | 4 | 0 | 0 | 0 |
| Zeelt | 1 | 1 | 0 | 0 | 1 |
| Snoekbaars | 3 | 2 | 0 | 0 | 0 |
| Meerval | 5 | 5 | 0 | 0 | 0 |
| Roofblei | 2 | 2 | 0 | 0 | 0 |

### Fysiologie en groei

| Soort | Aerobe scope | Metabole snelheid | Groei |
|---|---:|---:|---:|
| Karper | 0 | 1 | 1 |
| Brasem | 0 | 1 | 1 |
| Snoek | 0 | 1 | 1 |
| Baars | 1 | 1 | 1 |
| Blankvoorn | 0 | 1 | 2 |
| Zeelt | 0 | 0 | 1 |
| Snoekbaars | 1 | 1 | 1 |
| Meerval | 0 | 0 | 0 |
| Roofblei | 0 | 0 | 1 |

### Interpretatie en beperkingen

- **Roofblei:** de enige geregistreerde voedingsincidentie is een seizoensgebonden vacuïteits-/lege-maagmeting. Er zijn geen directe registraties voor voedingsintensiteit, voedingsritme of foerageergedrag. Dit ondersteunt geen dagdeelvoorkeur of voedselopnamevolume.
- **Meerval:** de registry bevat voedingsintensiteit en ritme, maar bronnen verschillen in meetcontext; gecontroleerde voeropstellingen en veldtelemetrie mogen niet worden samengevoegd. De recente wintertelemetrie meet vooral beweging/habitat, niet natuurlijke voedselopname.
- **Karper:** de bronbasis is relatief breed, maar bevat uiteenlopende responsen zoals voedselopname in gecontroleerde omstandigheden, bait-stationbezoek en veldgedrag. Deze zijn niet automatisch uitwisselbaar met method-feeder-/pelletvangst.
- **Brasem en blankvoorn:** voedingsmechanica/prooikeuze en bewegings-/activiteitsmetingen zijn beschikbaar, maar een bron voor prooiverwerking is geen directe maat voor dagelijkse voedselopname. De gedeelde Nagelkerke/Sibbing-bron telt bij beide soorten.
- **Snoek, baars en snoekbaars:** meerdere bronnen meten beweging, dieet of voedingsrespons; dit levert niet automatisch een overdraagbare hengelvangbaarheid of lokale tijdvakvangstkans op.
- **Zeelt:** de registerbasis blijft relatief klein en bevat onder meer groei-/reproductiecontext die geen dagelijkse voedingsrespons meet.
- **Fysiologie:** alleen baars en snoekbaars hebben geregistreerde aerobe-scopebronnen; metabole gegevens ontbreken voor zeelt, meerval en roofblei. Groei is een langetermijnrespons en geen dagelijkse activiteitsscore.
- Hengelvangstverdeling, hengelvangsttempo en individuele hengelvangbaarheid blijven afzonderlijke uitkomsten. Geen daarvan is gelijk aan voedselopname of aanwezigheid.
- De aantallen zijn geen kwaliteitsweging. Bronkwaliteit, levensfase/grootte, seizoen, watertype, meetmethode, respons en geografische overdraagbaarheid blijven bepalend.

### Gevolg voor de scoreketen

De registry biedt bruikbare bouwstenen, maar niet voor iedere soort dezelfde responsdekking. Een factor kan pas numeriek bijdragen wanneer de specifieke gemeten respons past bij het doel van de bestaande dagscore en de actuele invoer beschikbaar is. Voedingsfysiologie, prooikeuze, beweging, habitat, groei en hengelvangbaarheid vullen ontbrekende voedingsintensiteit of tijdvakdata niet automatisch aan. Alle 86 records blijven niet-goedgekeurd; geen score, gewicht of tijdvakbonus is geactiveerd.

# Fase 2 — audit bestaande biologische prognose

**Status:** eerste code-audit uitgevoerd; factorinventarisatie en UI-/test-traceerbaarheid lopen nog  
**Peildatum:** 16 november 2026  
**Branch:** `main`  
**Commit bij start:** `dd1238e3139fa048fe808c399282a5b1fe1fda12`  
**Doel:** de bestaande prognose- en deel-engines in kaart brengen voordat biologische modelwijzigingen worden voorgesteld.

> Dit document registreert wat in de code aantoonbaar aanwezig is. Een modelparameter in code is niet automatisch biologisch gevalideerd. Deze eerste audit wijzigt geen app-code, geen modeluitvoer en geen gebruikersgegevens.

## 83. Fase-2-bewijsdekking: actuele matrix en veilige modelrol (18 november 2026)


> **Historische momentopname (18 november 2026):** deze sectie beschrijft de toenmalige 71-recordstatus. De actuele exacte uitkomstdekking staat in §82; de huidige registerteller is 86 unieke records. Gebruik §82 en de actuele crosswalk §89 voor de huidige fase-2-status.


Na PR #134 bevat de research registry **71 records**. De volgende uitsplitsing is rechtstreeks geteld uit `measuredOutcomes` in `src/services/researchRegistry.ts`. Een record kan meerdere responsen bevatten en een gedeeld record kan meerdere soorten noemen; aantallen zijn dus geen onafhankelijke studies of bewijsgewichten.

| Soort | Records | Voedingsintensiteit | Voedingsincidentie | Voedingsritme | Foerageergedrag | Dieet/prooikeuze | Hengelvangsttempo | Hengelvangbaarheid |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Karper | 13 | 5 | 0 | 7 | 7 | 0 | 0 | 1 |
| Brasem | 7 | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| Snoek | 9 | 3 | 0 | 1 | 0 | 1 | 0 | 2 |
| Baars | 8 | 3 | 0 | 3 | 0 | 2 | 1 | 0 |
| Voorn | 8 | 5 | 0 | 5 | 0 | 1 | 0 | 0 |
| Zeelt | 4 | 3 | 0 | 2 | 1 | 1 | 0 | 1 |
| Snoekbaars | 9 | 3 | 0 | 1 | 0 | 3 | 0 | 0 |
| Meerval | 7 | 0 | 0 | 3 | 1 | 1 | 0 | 0 |
| Roofblei | 5 | 1 | 1 | 0 | 0 | 4 | 0 | 0 |

De kolom dieet/prooikeuze combineert hier uitsluitend voor compacte weergave `diet_composition` en `prey_selection`; de onderliggende registry houdt beide outcomes gescheiden. Hengelvangsttempo, vangstverdeling en individuele hengelvangbaarheid blijven eveneens afzonderlijk.

### Beoordeling van bruikbaarheid

- **Meest bruikbaar als biologische context:** directe maaginhoud-/voedingsmetingen en veldwaarnemingen die soort, gemeten respons, seizoen, levensfase en watertype voldoende specificeren. Brasem en snoekbaars hebben met PR #134 een extra soortspecifieke registratie; de meervalbron is uitsluitend laboratoriumritme.
- **Niet rechtstreeks omzetten naar een sessiebonus:** dieet/prooikeuze, locomotorische activiteit, migratie en habitatgebruik. Deze kunnen verklaren waar/waarom een soort voorkomt, maar bewijzen niet dat de vis op dat moment eet of een aangeboden haakaas opneemt.
- **Niet gelijkstellen aan vangstkans:** voedingsintensiteit, maagvulling, aasstationbezoek en hengelvangsttempo zijn geen individuele vangbaarheidskans. De snoekgegevens over kunstaasschuwheid zijn contextgebonden aan populatie, visgrootte, visserijdruk en kunstaas.
- **Belangrijkste resterende lacunes:** roofblei heeft geen geregistreerde directe voedingsintensiteit of voedingsritme; voor meerdere soorten ontbreekt directe hengelvangbaarheidsdekking; lokale prooibeschikbaarheid, opgeloste zuurstof en stroomsnelheid ontbreken als betrouwbare actuele invoer.
- **Lokale toepasbaarheid:** veel studies komen uit één reservoir, rivier, laboratorium of specifieke visserijmethode. Geen automatische overdracht naar Lokkershoek of naar method-feeder-/pelletvisserij zonder passende lokale of methodespecifieke validatie.

### Veilige rol in het huidige model

| Gegevenslaag | Huidige status | Veilige rol |
|---|---|---|
| Thermische fysiologische activiteit | Bestaande voorlopige soortcurve; onafhankelijke parametervalidatie ontbreekt | Bestaande activiteitspotentie met onzekerheid; geen nieuwe curveparameters uit registry alleen |
| Voedingsintensiteit/-ritme | Registry bevat gemengde veld-, maaginhoud- en laboratoriumresponsen | Verklarende context; nog geen algemene numerieke tijdvakbonus |
| Dieet/prooikeuze | Context- en levensfasegebonden | Alleen tactische/biologische duiding als prooitype en lokale context passen |
| Beweging/habitat | Afzonderlijke telemetrie-/habitatbronnen en bestaande habitatengine | Ruimtelijke hypothese; geen automatische voedings- of vangstkansscore |
| Hengelvangsttempo/-vangbaarheid | Enkele contextgebonden bronnen; onvoldoende soort-/methodebrede basis | Diagnostiek en latere validatie; geen overdraagbare catchability-factor |
| Zuurstof/stroming/prooiaanbod | Geen betrouwbare lokale meetinvoer in huidige keten | Onbekend laten; niet afleiden uit wind, weer of grof watertype |

**Conclusie:** de literatuurcontrole voor de negen doelsoorten is voor deze ronde voldoende afgerond. Dit sluit de literatuurinventarisatie af, niet de wetenschappelijke validatie of Fase 2 als geheel. Alle 71 records blijven `approvedForPrediction: false`; geen score, gewicht, tijdvakbonus of drempel is gewijzigd.

### Volgende stap

1. **Replaybaarheid — code-audit uitgevoerd (18 november 2026):** de vier snapshotroutes bewaren de voor de run beschikbare whitelist-features, exacte weersinvoer, locatie-/temperatuurcontext, provenance en model-/engineversies. De bestaande tests bewaken whitelist, fingerprint, privacy en tijdstempelherkomst. Geen aantoonbaar ontbrekend modelinputveld gevonden; de modelcode zelf wordt niet gearchiveerd en versiebeheer blijft daarom essentieel.
2. Beoordeel de resterende Fase-2-acceptatiecriteria en scheid technische afronding van onderdelen die wachten op voldoende echte, chronologisch gekoppelde sessies.
3. Ontwerp en valideer eventuele verdere voedings-/foerageerkoppeling alleen als afzonderlijke responslaag met passende directe evidence; geen dubbele modelberekening of numerieke bonus zonder validatie.
4. Fase 3 start pas na formele Fase-2-acceptatie.


## 84. Actieve numerieke transformaties: biologische prior versus technische omzetting (18 november 2026)

Naast de bron-/parameterinventaris in §48 is de actuele codeketen gecontroleerd op de numerieke omzettingen die daadwerkelijk in de gebruikersuitvoer terechtkomen. Deze audit wijzigt geen berekening.

| Onderdeel | Huidige berekening | Status en begrenzing |
|---|---|---|
| Soortspecifieke thermische respons | Asymmetrische Gaussische efficiëntiecurve met `thermalOptimum`, `thermalWidthCold` en `thermalWidthWarm` | Per soort voorlopige prior; geen van de negen curves is als Nederlandse veldrespons onafhankelijk gefit. Zie §48.2. |
| Thermische activiteitsschaal | `clamp(1 + 9 × thermalEfficiency^0.85, 1, 10)` | De exponent 0,85 en de lineaire omzetting naar 1–10 zijn technische schaalkeuzes, geen empirisch gekalibreerde biologische relatie. De uitkomst blijft thermische activiteitspotentie, geen vangstkans. |
| Persoonlijke vangsttempo `lambda` | Bekende doelvis-aantallen gedeeld door totale geldige geregistreerde visduur | Empirische persoonlijke baseline; alleen vergelijkbare, afgeronde sessies met bekende duur en bruikbare vangstaantallen. Niet een soortbrede biologische parameter. |
| Poisson-duurkans | `P(≥1) = 1 − exp(−lambda × sessieduur)` | Wiskundige omzetting onder een Poisson-aankomstaandname. Homogeniteit/onafhankelijkheid van aanbeten is niet lokaal bewezen; de uitkomst blijft een persoonlijke baseline, niet de geïntegreerde vijf-responsprognose. |
| Vangkansplafond | Technische begrenzing op 0,95 | Conservatieve softwareguard, geen uit data geschatte bovengrens of wetenschappelijke vangstlimiet. |
| Minimale steekproef | Minimaal 5 vergelijkbare sessies; Poisson-berekening vereist minimaal 5 sessies met bekende duur en bruikbare vangstaantallen | Softwarematige minimumvoorwaarden om berekening te tonen, geen bewijs van statistische robuustheid. |
| Vertrouwenslabels | Laag / Matig / Redelijk / Hoog bij 5 / 10 / 18 / 30 bruikbare Poisson-sessies | Technische presentatiedrempels, geen gevalideerde betrouwbaarheidsklassen. De UI moet aantallen en beperkingen blijven tonen. |
| Wilson-interval | Binomiaal interval voor historisch sessiesucces | Beschrijft steekproefvariatie in sessiesucces; is nadrukkelijk geen interval rond de Poisson-duurkans. |

### Acceptatieconsequentie

1. De thermische curve en de omzetting naar 1–10 mogen alleen als voorlopige relatieve activiteitspotentie worden gepresenteerd. De exponent en schaal zijn geen gevalideerde biologische gewichten.
2. De persoonlijke Poisson-uitkomst blijft gescheiden van de thermische score en van de kwalitatieve voedings-/habitatcontext. Er wordt geen verborgen vermenigvuldiging of optelling tussen deze lagen toegepast.
3. Het plafond en de steekproef-/vertrouwensdrempels moeten als technische guards worden gedocumenteerd; ze mogen niet als wetenschappelijke zekerheid worden gepresenteerd.
4. De lokale statistische kalibratie blijft geblokkeerd door de clean start totdat voldoende echte, vergelijkbare sessies beschikbaar zijn. Kleine softwareminimums mogen die blokkade niet opheffen.

**Conclusie:** de actieve numerieke omzettingen zijn nu expliciet onderscheiden in biologische prior, empirische persoonlijke baseline en technische presentatieregel. Geen numerieke parameter, score, plafond of drempel gewijzigd. Fase 2 blijft open.

## 85. Formele Fase-2-acceptatiecontrole — eerste technische crosswalk (18 november 2026)

Deze controle koppelt de zeven formele criteria uit §43 aan de huidige code, tests en bewijsstatus. 'Technisch gerealiseerd' betekent niet automatisch wetenschappelijk gevalideerd of lokaal gekalibreerd.

| Criterium | Technische status | Bewijs-/praktijkstatus | Open punt |
|---|---|---|---|
| 1. Gescheiden biologische responsen | **Grotendeels gerealiseerd**: thermische activiteit, voedings-/foerageercontext, habitat/beweging, persoonlijke vangstbaseline en onzekerheid zijn aparte lagen/services. | De onderlinge begrenzing is expliciet gedocumenteerd en deels door regressies bewaakt. | Controleer nog de volledige UI-/engineketen op ongewenste vermenging; geen onafhankelijke validatie voor alle tussenlagen. |
| 2. Bronkwaliteit en overdraagbaarheid | **Register en bronclassificatie gerealiseerd; numerieke goedkeuring niet**. | 71 records voor negen soorten; populatie-, respons- en contextbeperkingen zijn vastgelegd. Alle 71 records blijven approvedForPrediction: false. | De actieve thermische soortcurves zijn voorlopige priors en niet onafhankelijk gefit aan Nederlandse velddata. Hun rol moet expliciet als beperkte mechanistische prior worden geaccepteerd of verder worden teruggebracht; geen nieuwe voedings-/habitatfactor activeren. |
| 3. Water- en omgevingsdata | **Technisch gerealiseerd** voor herkomst, meettijd, bron/methode/diepte waar beschikbaar, onzekerheid en onbekende watertemperatuur. | Waterthermische foutmaten en chronologische lokale biascorrectie zijn afzonderlijk ingericht. | Lokale kalibratie wacht op voldoende nieuwe meetparen; lucht- en weersdata vervangen geen ontbrekende watermeting. |
| 4. Tijdvak- en gedragslogica | **Grotendeels gerealiseerd**: gekozen sessiestart stuurt de tijdgevoelige VisCoach-context; meerdere tijdvakken worden niet als één bewezen universele beste periode behandeld. | Tijdvakclaims blijven beperkt tot soortspecifiek passend bewijs; geen kunstmatige winnaar of ongefundeerde bonus. | Controleer nog de volledige UI-/enginepaden op consistente toepassing van de gekozen sessietijd; de Brier-tijdvenstervergelijking zelf is gerealiseerd en getest. |
| 5. Lokale leer- en evaluatieketen | **Technisch gerealiseerd voor de huidige evaluatiepoort**. | Snapshots, koppeling, chronologische baseline, modelversie-isolatie, benchmarkuitsluiting, duur-/tijdvenstervergelijking en soortdiagnostiek zijn getest. | Lokale Brier-validatie en kalibratie wachten op voldoende echte, vergelijkbare sessies na clean start. |
| 6. Gebruiksvriendelijkheid en VisCoach | **Technisch gerealiseerd in de huidige invoerflow**: doelsoort, stek en gewenste starttijd; eindtijd optioneel; geen verplichte levensfase- of uitgebreid voedingsformulier. | De visser behoudt de keuze; de app gebruikt alleen aanwezige context. | Geen extra invoervelden toevoegen tenzij aantoonbaar noodzakelijk en gebruiksvriendelijk. |
| 7. Technische borging | **Gerealiseerd voor de huidige wijzigingen**: regressies, typecheck, dependency-audits, productiebuild en artifactcontrole zijn uitgevoerd; PR-head- en main-mergecommit-gates zijn groen. | PR #138 en #139 zijn volledig gevalideerd; issue #49 en de drie leidende documenten zijn bijgewerkt. | Iedere volgende codewijziging blijft dezelfde exacte-head- en mergecommit-gate vereisen; hervattingspunt en issue moeten synchroon blijven. |

### Brier-tijdvenstercontrole — implementatie in deze PR

- Exacte targetWindowStart en optionele targetWindowEnd worden op minuutprecisie vergeleken met de werkelijke sessiestart/eindtijd. Er is geen arbitraire tolerantie en geen achteraf omgerekende kans.
- Als een exact venster ontbreekt, wordt het opgeslagen gekozen targetSlot gebruikt om het werkelijke Amsterdamse starttijdvak te toetsen.
- Als zowel exact venster als gekozen tijdvak ontbreken, wordt de waarneming als tijdvenster-onbekend uitgesloten en apart geteld.
- De VisCoach-route geeft nu de geplande vensterwaarden door bij het atomair opslaan van de sessie en snapshot.
- Regressies testen gelijke duur met verschoven venster, afwijkende/ontbrekende duur, fallback op het gekozen tijdvak en ontbrekende tijdcontext.
- PR [#138](https://github.com/sennzor-wq/Vislogboek/pull/138) is squash-merged als [53bf561](https://github.com/sennzor-wq/Vislogboek/commit/53bf5616b85edf5690043840855a7ebf87b15184). De PR-head Quality Gate [#44393169257](https://github.com/sennzor-wq/Vislogboek/actions/runs/44393169257) en main mergecommit Quality Gate [#44393310926](https://github.com/sennzor-wq/Vislogboek/actions/runs/44393310926) zijn volledig geslaagd.

### Voorlopige acceptatie-uitkomst

Criteria 1, 3, 5, 6 en 7 zijn technisch grotendeels of volledig gerealiseerd; criterium 4 is grotendeels gerealiseerd. Criterium 2 blijft inhoudelijk begrensd door de voorlopige thermische priors en het ontbreken van goedgekeurde numerieke biologische bronnen. De formele Fase 2 is **niet geaccepteerd**. Lokale praktijkvalidatie hoeft niet vooraf volledig beschikbaar te zijn om de softwarefase af te ronden, maar claims van lokale nauwkeurigheid blijven geblokkeerd. Fase 3 start niet voordat de resterende technische en ontwerpbesluiten expliciet zijn afgerond.
## 86. Thermische bronstatus per soort zichtbaar gemaakt (18 november 2026)

De soortprofielmodal toont nu ook de status uit getSpeciesThermalEvidenceContextText(). Daarmee wordt onderscheid gemaakt tussen directe aerobe-scopegegevens, uitsluitend metabole gegevens en ontbrekende vergelijkbare thermische fysiologiebronnen. De bestaande algemene waarschuwing blijft staan: een bronvermelding is geen goedkeuring van de exacte curveparameters.

| Soortgroep | Geregistreerde fysiologische basis | Betekenis voor de huidige curve |
|---|---|---|
| Baars, snoekbaars | Directe aerobe-scopegegevens; alle registraties nog niet goedgekeurd | Relevant fysiologisch bewijs, maar geen vrijgave of onafhankelijke validatie van de huidige Gaussische optimum-/breedteparameters. |
| Karper, snoek, brasem, blankvoorn | Metabole SMR/RMR-gegevens; geen geregistreerde aerobe-scopecurve | Metabolisme is niet hetzelfde als acute activiteit, voedselopname of vangbaarheid; alleen beperkte fysiologische context. |
| Zeelt, meerval, roofblei, overig | Geen vergelijkbare soortspecifieke aerobe-scope- of metabole temperatuurmeting in het huidige register | De curve blijft een generieke/voorlopige prior en is niet soortspecifiek gevalideerd. |

Alle thermische fysiologieregistraties blijven niet-goedgekeurd voor numerieke voorspelling. De bestaande thermische curve wordt nog steeds als voorlopige relatieve activiteitspotentie berekend; deze wordt niet vermenigvuldigd met de persoonlijke vangstkans en levert geen voedings- of vangstbonus. De UI toont nu per soort de bronstatus naast de modelbeperking.

### Resterend acceptatiebesluit

De huidige formele eis dat iedere actieve numerieke factor direct passende meetrespons en traceerbare bron heeft, is strenger dan de status van de huidige thermische prioren. Er is daarom een expliciet ontwerpbesluit nodig: (a) de huidige curve als transparante, niet-gevalideerde mechanistische prior behouden voor een initiële relatieve activiteitspotentie, met deze duidelijke beperkingen, of (b) numerieke thermische activiteit uitschakelen voor soorten zonder voldoende directe fysiologische basis totdat passend bewijs beschikbaar is. Geen van beide keuzes mag als lokaal gevalideerde soortcurve worden gepresenteerd. Er is in deze wijziging geen score, parameter of modeluitkomst aangepast.
## 87. Thermische tijdvakuitvoer onderscheiden van een bewezen vistijd (18 november 2026)

De algemene dagprognose kiest intern een tijdvak met de hoogste relatieve thermische activiteitspotentie. Dit is geen gemeten voedingsritme, geen aangetoonde foerageerpiek en geen vangstkans. De gebruikerskaart en samenvatting noemen dit daarom nu expliciet het **thermisch gunstigste tijdvak**, niet de 'beste vistijd'. Bij gelijkwaardige thermische tijdvakken wordt geen winnaar geforceerd.

De knop 'Start sessie op dit moment' is alleen beschikbaar bij de prognose voor vandaag. Zij legt het werkelijke huidige Amsterdamse starttijdvak vast in targetTimeSlot/targetSlot en gebruikt niet langer het latere thermisch gunstigste tijdvak als sessiestartmetadata. Een prognose voor morgen kan zo niet per ongeluk als startsnapshot voor een sessie die nu begint worden opgeslagen. Dit voorkomt dat de snapshot een tijdvak registreert waarin de sessie feitelijk niet begon. De sessie- en VisCoach-tactiek blijven gebaseerd op de werkelijk gekozen/gestarte sessietijd; bij een sessie over meerdere tijdvakken wordt geen globaal dagwinnaar opgedrongen.

Geen thermische berekening, score, profielparameter, voedingsclaim of vangstkans gewijzigd. De tijdvakuitvoer blijft uitsluitend een relatieve thermische vergelijking; een soortspecifieke voedings-/foerageervoorkeur wordt alleen als brongebonden context getoond wanneer passend bewijs bestaat.

## 88. Resterende meteorologische en hydrologische factoren — bewijs- en datadekkingsbesluit (19 november 2026)

Deze beoordeling sluit de resterende factorinventaris uit de centrale roadmap af voor de huidige onderzoeksronde. Zij voegt geen factor toe aan de numerieke prognose. De beoordeling gebruikt de bestaande research registry (71 records) en de reeds geregistreerde omgevingsbronnen; een registry-record is geen onafhankelijke validatie en geen toestemming voor modelgebruik.

> **Historische momentopname:** deze sectie is opgesteld vóór de latere bronupdates in §§97, 100 en 101. De actuele registerdekking is 86 unieke records; de aanvullende evidence en huidige factorstatus staan in §§99–101.

| Factor | Wat het huidige bewijs ondersteunt | Respons die hiermee wél/niet wordt onderbouwd | Huidige veilige rol |
|---|---|---|---|
| Wind | Geen voldoende directe, soortspecifieke basis in de huidige registry voor een algemene dagelijkse voedings- of vangstrespons. Wind kan lokaal de oppervlakte, drift, werphoek en lijncontrole beïnvloeden. | Praktische presentatie/positionering; niet automatisch fysiologische activiteit, voedselopname, vislocatie of vangbaarheid. | Alleen bestaande positionerings- en tactiekcontext. Geen numerieke prognosebonus. |
| Regen | De Europese migratiemeta-analyse bevat slechts twee relevante studies voor regen; dit is onvoldoende voor een algemene conclusie. | Paaigerelateerde migratie is niet gelijk aan dagelijkse activiteit, voeding of hengelvangst. | Hoogstens context wanneer lokale water-/afvoerdata een aantoonbare verandering laten zien; geen directe regenregel. |
| Bewolking/licht | Dezelfde meta-analyse bevat slechts één studie voor bewolking. Andere fotische studies laten zien dat licht, troebelheid, seizoen en predatierisico samen de foerageeromgeving kunnen veranderen, maar niet met één overdraagbare richting. | Contextafhankelijke licht-/zichtrelatie; geen algemene voedingspiek of vangstkans. | Alleen kwalitatieve context als licht- en waterhelderheidsinformatie werkelijk beschikbaar is; geen bewolkingbonus. |
| Opgeloste zuurstof | Bestaande karpertelemetrie beschrijft een uitzonderlijke winterse zuurstofcrisis waarin activiteit en voedselopname sterk veranderden. Andere karpertelemetrie laat juist gebruik van hypoxische waterlagen zien. | Directe lokale zuurstofmeting kan relevant zijn voor fysiologische stress en habitatkeuze; tolerantie is context- en populatieafhankelijk. | Zonder directe meting onbekend. Geen zuurstofwaarde afleiden uit temperatuur, wind, regen of bewolking; geen universele soortdrempel. |
| Stroming/afvoer | Karpertelemetrie in één stromingsgevoelig reservoir vond verbanden met activiteit en dieptegebruik. Een riviermeta-analyse vond uitkomstafhankelijke relaties met verplaatsing/migratie, niet één algemene activiteitsrespons. | Beweging en habitatgebruik in stromend water; niet automatisch voedingsintensiteit of vangbaarheid en niet zonder meer toepasbaar op stilstaand water. | Alleen bestaande habitat-/bewegingscontext wanneer lokale stroomsnelheid of afvoer betrouwbaar bekend is. Geen numerieke bonus/malus. |
| Luchtdruk | De bestaande registry bevat beperkte, contextgebonden baarsbewegingsinformatie en een niet-overdraagbare yellow-perch-laboratoriumproxy. De Europese migratiemeta-analyse vond geen algemene significante drukrespons. | Geen directe basis voor een universele dagelijkse voedings- of vangstrespons bij de doelsoorten. | Niet als zelfstandige voorspellende factor gebruiken; hoogstens als geregistreerde context voor latere validatie. |
| Troebelheid | Een recente review beschrijft contextafhankelijke effecten op predator-prooi-interactie; overdracht verschilt per soort, zichtstrategie en habitat. | Zicht-/interactiemechanisme, niet rechtstreeks totale activiteit, voedselopname of hengelvangbaarheid. | Alleen kwalitatieve context bij een betrouwbare lokale waarneming/meting; geen algemene bonus. |

### Datadekking en overdraagbaarheid

- De huidige app-invoerketen levert geen betrouwbare, actuele lokale opgeloste-zuurstofmeting of stroomsnelheid voor de gekozen stek. Deze factoren moeten daarom als onbekend worden behandeld, niet als nul en niet als uit weersvariabelen afgeleid.
- Wind en weersverwachting zijn beschikbaar als omgevings-/tactiekcontext, maar vormen op zichzelf geen directe meting van lokale voedselopname of vangbaarheid.
- De beschikbare stromings- en zuurstofstudies zijn sterk contextgebonden (onder meer één Ebro-reservoir en een winterse aquacultuurvijver). Ze rechtvaardigen geen overdracht naar Nederlandse stilstaande recreatiewateren.
- De meta-analyse van Schlautmann et al. (2026; DOI 10.1111/faf.70063) onderzoekt paaigerelateerde migratie bij Europese zoetwatervissen. Zij is nuttig om kennislacunes voor regen, bewolking, stroming en druk te markeren, maar mag niet als bewijs voor dagelijkse hengelvangst worden gebruikt.
- Geen van deze bronnen krijgt door deze audit de status `approvedForPrediction: true`. Er worden geen numerieke factoren, gewichten, drempels, tijdvakbonussen of catchability-regels geactiveerd.

### Besluit voor de volgende fase-2-stap

De resterende weer-/hydrologische factorinventaris is voor deze onderzoeksronde inhoudelijk beoordeeld. De volgende stap is niet meer factoren verzamelen, maar de volledige acceptatiecrosswalk sluiten en het expliciete ontwerpbesluit over de voorlopige thermische priors uit §86 voorbereiden. Daarna kan een kandidaatmodel uitsluitend worden ontworpen met gescheiden responslagen en een chronologisch validatieprotocol. De lokale zuurstof-/stromingsdata en lokale Brier-kalibratie blijven afhankelijk van toekomstige echte metingen en sessies.

**Bronnen voor deze audit:** Benito et al. (2015), DOI 10.1080/00028487.2015.1017656; Bauer & Schlott (2006), DOI 10.1111/j.1365-2109.2005.01426.x; Taylor & Cooke (2012), DOI 10.1139/a2012-009; Ouellet et al. (2025), DOI 10.1002/wat2.1752; Schlautmann et al. (2026), DOI 10.1111/faf.70063; Zanghi & Ioannou (2024), DOI 10.1111/fwb.14354.


## 89. Fase-2-acceptatiecrosswalk — actuele status na kandidaatmodelreview en broncontroles (20 november 2026)

Deze crosswalk vervangt de momentopname van 19 november. Hij is gebaseerd op de actuele code-audit en kandidaatmodelreview §§92–107 en 130–147, de huidige registry op `main` (93 unieke records, 0 numeriek goedgekeurd), de eigenaarbeslissing optie A uit §90 en de aanvullende broncontroles §§141–146 uit PR #189 en §147 uit PR #191 (beide gemerged; exacte PR-head- en mergecommit-Quality-Gates geslaagd).

| Criterium | Actuele status | Aantoonbaar afgerond | Wat nog openstaat |
|---|---|---|---|
| 1. Eén doelrespons en gescheiden biologische responsen | **Doel en scheiding vastgelegd; geïntegreerde score nog niet gerealiseerd** | De eigenaar wil één bestaande 1–10-dagscore als beste verdedigbare verwachting van biologische activiteit en voedsel-/foerageerpotentie. Thermische respons, voeding/foerageren, beweging/habitat, vangbaarheid/persoonlijke vangstkans en datadekking/onzekerheid zijn als afzonderlijke responsen gedefinieerd (§§103–107, 130–134). | De huidige numerieke score is nog uitsluitend de voorlopige thermische prior; er is geen goedgekeurde numerieke voedingsbijdrage. Een geïntegreerde score met evidence-backed componenten, genormaliseerde bijdragen en onderbouwde gewichten bestaat nog niet. De responsdefinitie mag niet worden uitgebreid naar persoonlijke vangstkans, habitat-aanwezigheid of datakwaliteit. |
| 2. Bronkwaliteit, levensfase en overdraagbaarheid | **Broninventaris uitgebreid; actieve thermische uitzondering expliciet geaccepteerd; biologische dekking blijft beperkt** | Op `main` staan 93 unieke registry-records; 0 zijn numeriek goedgekeurd. De eigenaar heeft optie A expliciet gekozen: bestaande thermische curves blijven uitsluitend als transparante voorlopige mechanistische prior actief. Dit is een product-/architectuurbesluit, geen wetenschappelijke validatie van de parameters. De audit onderscheidt directe voedselopname, maaginhoud-/Eggers-schattingen, prooivangst, foerageergedrag, beweging en vangbaarheid (§§107–109, 134–147). | Geen soort heeft een volledig gevalideerde lokale thermische voedselopnamecurve. Nieuwe voedings- of tijdvakfactoren blijven uitgesloten zolang levensfase, voedseltype, meetmethode, watertype en populatiecontext onvoldoende overeenkomen en onafhankelijke labels ontbreken. De meervalbron Filipiak et al. (1997) blijft kandidaat wegens onvolledig geverifieerde opname-/temperatuurmethodiek. |
| 3. Water- en omgevingsdata | **Herkomst en onzekerheid van temperatuur technisch geborgd; lokale dekking van andere factoren beperkt** | Watertemperatuur wordt onderscheiden als gemeten, geschat of onbekend; luchttemperatuur vervangt geen watertemperatuur. Meetprovenance, onzekerheid en temperatuurevaluatie zijn vastgelegd. Wind, druk, zuurstof, troebelheid, stroming en neerslag zijn per respons en bewijsstatus beoordeeld (§§93, 101, 107, 130–134). | Betrouwbare actuele lokale metingen van opgeloste zuurstof, troebelheid en stroming/afvoer ontbreken. Deze factoren blijven onbekend/contextueel en mogen niet uit weerdata worden afgeleid. Lokale thermische bias- en biologische kalibratie vereisen voldoende echte vergelijkbare metingen. |
| 4. Tijdvak- en soortgedrag | **Gedragsbewijs geïnventariseerd; gevalideerde tijdvakvoorspelling ontbreekt** | Directe voedingsritmebronnen zijn van beweging onderscheiden. Jamet et al. (1990) laat leeftijdsafhankelijke dag-/nachtvoeding bij blankvoorn zien; Prejs (1978) toont een ander, dieetgebonden dag-/nachtritme bij macrophyten-etende blankvoorn; Jamet (1994) geeft slechts maandelijkse populatieconsumptieschattingen; de aanvullende primaire controles voor meerval en snoek zijn in §§144–145 afgebakend; Prejs (1978) voegt dieetgebonden blankvoorn-voedingsritme toe in §147. De bestaande sessiestart en tijdvakdiagnostiek blijven feitelijk en worden niet als biologische voorspelling gepresenteerd (§§130–147). | Dezelfde dagbrede thermische respons wordt over vier tijdvakken hergebruikt; er is geen gevalideerde soort-/seizoen-/stekgevoelige tijdvakrespons met passende directe labels. Geen universele schemer-/nachtbonus. Hengeluren en vangsten zijn vangbaarheids-/blootstellingsinformatie, geen directe voedingslabels. |
| 5. Lokale leer- en evaluatieketen | **Evaluatiearchitectuur ontworpen; biologische onafhankelijke validatie ontbreekt** | Brier/BSS evalueert uitsluitend persoonlijke vangstkans; watertemperatuur heeft afzonderlijke MAE/RMSE/bias-evaluatie. Chronologische validatie, factorablaties, vaste modelversies en scheiding van labels zijn vastgelegd (§§103–104, 130–134). | Er zijn geen directe lokale labels voor fysiologische activiteit, voedselopname, habitat-aanwezigheid of biologische tijdvakvoorkeur. Daarom kan de samengestelde biologische 1–10-score nog niet onafhankelijk worden gekalibreerd of gevalideerd. Vangst, aanbeet, beweging en maaginhoudmodel-schattingen mogen dit ontbrekende label niet stilzwijgend vervangen. |
| 6. Gebruiksvriendelijkheid en VisCoach | **Basisarchitectuur en minimale invoer behouden; tactische productkeuzes deels open** | Eén bestaande scoreweergave, doelsoort/plek/starttijd als kerninvoer, centrale prognose voor VisCoach en bestaande gespecialiseerde habitat-/positioneringsengines zijn behouden. Vangstregistratie blijft snel; optionele gegevens blokkeren opslaan niet (§§104, 106, 133–134). | Voorvoergrammen en interne temperatuur-/suitabilityheuristieken zijn onvoldoende onderbouwd en hun gating bij lage datakwaliteit is nog een afzonderlijk eigenaarbesluit. De keuze voor een optionele herbruikbare hengel-/methodepreset versus het huidige vrije tekstveld is ook nog open. Deze tactiek-/UX-punten mogen niet in de biologische dagscore worden vermengd. |
| 7. Technische borging | **Gerealiseerd en gevalideerd voor de huidige wijzigingsreeks** | De gemergde implementatie- en audit-PR's tot en met PR #191 hebben exacte PR-head- en mergecommit-Quality-Gates doorlopen. Voor PR #189 en PR #191 zijn typecheck, volledige tests en production build op de exacte head geslaagd; ook beide mergecommit-gates zijn geslaagd. | Er staat voor deze wijzigingsreeks geen technische gate open. Iedere volgende codewijziging vereist opnieuw tests, diff-review, documentatiesynchronisatie en groene exacte-head- én mergecommit-gates. |

### Formele uitkomst

**Fase 2 is niet geaccepteerd. Fase 3 blijft geblokkeerd.**

De kandidaatarchitectuur is inhoudelijk beschreven en de belangrijkste responsgrenzen zijn expliciet. Dat is nog niet hetzelfde als een gerealiseerd, gevalideerd geïntegreerd prognosemodel. De huidige score blijft een transparante voorlopige thermische prior; er is geen numerieke voedingsbijdrage of gevalideerde tijdvakrangschikking. De 92 registry-records zijn bewijsinventaris, geen 92 gevalideerde effecten; 0 zijn goedgekeurd voor directe numerieke voorspelling.

### Resterende formele acceptatieblokkades

1. **Doelrespons naar kandidaatmodel:** leg de uiteindelijke samenstelling van de ene bestaande dagscore vast en toon per factor welke directe respons hij verklaart, welke data hij nodig heeft en hoe overlap/dubbeltelling wordt voorkomen. De thermische prior blijft een expliciet geaccepteerde uitzondering, niet een gevalideerde voedingsrespons.
2. **Bron- en parametergrenzen:** rond de relevante primaire bron-/methodedetails af; documenteer per soort en levensfase welke responsen wel en niet overdraagbaar zijn. Geen nieuwe factor activeren zonder passende bron, input en onafhankelijke validatie.
3. **Tijdvakmodel:** ontwerp een echte tijdvakrespons op basis van tijdvakgebonden invoer en directe voedings-/foerageerlabels. Tot die tijd geen beste-tijdvakclaim of numerieke bonus.
4. **Onafhankelijke evaluatie:** leg vast welke directe labels en metrics nodig zijn voor activiteit, voeding, habitat en tijdvak. De bestaande Brier-evaluatie blijft alleen voor persoonlijke vangstkans.
5. **Tactische productbesluiten:** eigenaarbesluit over numerieke voorvoerhoeveelheden/gating bij lage invoerkwaliteit en over de optionele hengel-/methodepreset. Deze besluiten zijn afzonderlijk van de biologische score. De keuze voor optie A is al expliciet door de eigenaar gemaakt en is geen open blocker meer.


Lokale praktijkdata zijn niet vereist om het architectuurontwerp af te ronden, maar wel voor lokale kalibratie, onafhankelijke prestatieclaims en veilige numerieke toelating van nieuwe biologische factoren. Er wordt geen Fase 3 gestart voordat de resterende formele acceptatiepunten aantoonbaar zijn afgehandeld.

## 90. Ontwerpbesluit thermische curves — optie A behouden als voorlopige prior (19 november 2026)

**Besluit:** behoud de bestaande soortprofielcurves actief als voorlopige mechanistische prior binnen de bestaande prognose. De curves bepalen uitsluitend de relatieve thermische respons op gemeten of verantwoord geschatte watertemperatuur.

Dit besluit betekent nadrukkelijk niet dat de exacte soortparameters empirisch of lokaal gevalideerd zijn. De bestaande modelpiek, curvebreedtes, efficiëntievloer, exponent en 1–10-schaal blijven voorlopige modelkeuzes. De gebruikersinterface en documentatie moeten dit consequent als **thermische activiteitspotentie** en **voorlopige modelprior** aanduiden.

### Harde scheiding tussen prognoselagen

- Thermische activiteitspotentie beschrijft uitsluitend de relatieve respons van het bestaande temperatuurmodel. Zij is geen directe meting van beweging, voedselopname, aasbezoek of vangbaarheid.
- De thermische curve verhoogt of verlaagt niet zelfstandig de voedingskans, voorvoerhoeveelheid, persoonlijke vangstkans of Brier-uitkomst. Er komt geen verborgen vermenigvuldiging, optelling of nieuwe gewichtsfactor.
- Voedings-/foerageerbewijs blijft een afzonderlijke soortspecifieke laag. Bewegings- of habitatbewijs wordt niet als voedingsbewijs gebruikt.
- Habitat, aanwezigheidshypothesen, wind/positionering, voorvoeren en persoonlijke vangsthistorie blijven bij hun bestaande engines en betekenis. Geen tweede prognose- of VisCoach-engine.
- Een thermische dagschatting is niet automatisch een voedingspiek of beste vistijd. Tijdvakpresentatie moet thermische respons en voedingsgedrag expliciet onderscheiden; de gebruiker houdt de keuze van sessiestart.

### Gevolgen voor bewijs en validatie

Alle bestaande research-registryrecords blijven op hun huidige goedkeuringsstatus; een bronregistratie maakt een numerieke curve niet automatisch gevalideerd. De bronstatus per soort blijft zichtbaar. Er worden geen curveparameters, drempels, soortgewichten of tijdvakbonussen gewijzigd door dit besluit.

De curves mogen voor de huidige software-scope worden behouden als transparante voorlopige prior. Claims dat de exacte parameters biologisch gefit, lokaal gevalideerd of voorspellend voor voeding/vangst zijn, blijven verboden. Latere parameterwijzigingen vereisen passende soort-/levensfase-/watertypebronnen, regressies en onafhankelijke chronologische evaluatie.

### Scopebewaking

Dit is een gerichte keuze binnen de bestaande prognosearchitectuur, geen herontwerp. De prognose blijft de enige bron van modeluitkomsten. VisCoach consumeert de bestaande prognose en de bestaande gespecialiseerde engines en vertaalt deze naar advies en tactiek; VisCoach maakt geen eigen prognose. Bestaande berekeningen blijven behouden tenzij een concrete audit een aantoonbare fout of onveilige claim aanwijst.

De eerdere tijdelijke uitschakeling van de thermische score is teruggedraaid op main in commit bf95145e7ca0523944b01b842957a65d7f93647c. De Quality Gate op deze herstelcommit is volledig geslaagd (run #44492544444). Dit herstel activeert uitsluitend het bestaande thermische modelgedrag; het voegt geen nieuwe biologische factor of vangstkanskoppeling toe.



## 91. Vervolg na ontwerpbesluit — scoreketen, tijdvakvoorkeur en evaluatie (19 november 2026)

### Status na PR #147

Het ontwerpbesluit uit §90 is verwerkt in PR #147 en squash-merged naar `main` als `5acd372a3be0ee31d1a5b7d422659e7ef4fee097`. De Quality Gate op de mergecommit is geslaagd (run #44496021470). Optie A is daarmee als ontwerpkeuze vastgelegd: de bestaande thermische curves blijven uitsluitend een voorlopige, transparante thermische prior. Er zijn geen runtimeberekeningen, parameters of scores gewijzigd.

De keuze over behouden versus uitschakelen is gesloten. De onderliggende wetenschappelijke beperking is dat de exacte soortparameters niet onafhankelijk gevalideerd zijn. Dit mag niet worden verward met brongoedkeuring of lokale voorspelvalidatie. Criterium 2 blijft daarom inhoudelijk begrensd; de formele crosswalk mag dit niet als wetenschappelijke validatie afvinken. De volgende auditstap moet expliciet vaststellen hoe de vooraf goedgekeurde voorlopige prior binnen criterium 2 wordt verantwoord zonder de bewijsnorm voor nieuwe numerieke factoren te verlagen. Tot die beoordeling blijft Fase 2 niet geaccepteerd en Fase 3 geblokkeerd.

### Vastgelegde producteis voor de bestaande prognose

De producteigenaar heeft verduidelijkt dat de huidige scoreweergave behouden moet blijven. Het gaat om verbetering van de bestaande prognoseketen, niet om een tweede score of een nieuwe VisCoach-prognose.

- De bestaande dagscore en presentatie blijven de gebruikersweergave.

**Nadere precisering van de gewenste eindscore:** ieder relevant onderdeel dat in de prognose wordt getoond, moet uiteindelijk een eigen dagelijkse factoruitkomst/contributie leveren en een expliciet, onderbouwd gewicht hebben in de ene bestaande dagscore. De bestaande scorepresentatie blijft ongewijzigd; alle toegelaten bijdragen komen samen in diezelfde score. Dit is het beoogde modeldoel, niet de huidige implementatie. Een factor zonder passende evidence of betrouwbare invoer krijgt geen verzonnen neutrale waarde of arbitrair gewicht: de factor blijft expliciet contextueel/onbekend/uitgesloten totdat hij verantwoord kan bijdragen, en de onzekerheid wordt zichtbaar.

Ook de tijdvakken moeten uiteindelijk afzonderlijk door de relevante factor-keten worden beoordeeld: tijdvakgebonden invoer waar beschikbaar, soortspecifiek voedings-/foerageergedrag, datum/seizoen en stekcontext. Een dagbrede thermische waarde die ongewijzigd naar alle tijdvakken wordt gekopieerd, kan geen echte tijdvakvoorkeur bepalen. De score per tijdvak moet dezelfde bewijs- en onzekerheidsregels volgen als de dagschatting.
 De uiteindelijke dagschatting moet, zodra de audit en validatie dat toelaten, de relevante prognosefactoren samenbrengen in één uitlegbare keten.
- Iedere factor uit de bestaande prognose krijgt expliciet een rol en status: numerieke bijdrage, habitat-/bewegingsinformatie, kwalitatieve context, niet beschikbaar of uitgesloten met reden. Een factor krijgt alleen een numerieke bijdrage wanneer respons, data en bewijs dat rechtvaardigen; ontbrekende data worden niet als een verzonnen neutrale score behandeld.
- Voor factoren die numeriek mogen bijdragen, moet de soort-, seizoen-, water-/stekcontext, richting, onzekerheid, interactie en onderbouwde weging traceerbaar zijn. Geen universele percentages of arbitraire gewichten.
- De tijdvakbeoordeling moet de geselecteerde soort, datum/seizoen en stek meenemen. Soortspecifiek voedings-/foerageergedrag kan de voorkeur van een tijdvak beïnvloeden wanneer het directe bewijs bij de respons en context past. Temperatuurrespons, beweging, voedselopname, habitat-aanwezigheid en vangbaarheid blijven afzonderlijke responsen. Een dagdeelpatroon is nooit op zichzelf een automatische bonus of gegarandeerde winnaar.
- Het huidige thermische tijdvak blijft thermisch zolang geen gevalideerde voedings-/tijdvakrespons beschikbaar is. Wanneer verschillen niet aantoonbaar zijn, wordt geen kunstmatige winnaar geforceerd.
- De gebruiker hoeft geen extra verplichte levensfase- of biologisch formulier in te vullen. De bestaande eenvoudige invoer blijft leidend; onbekende context vergroot onzekerheid.
- De Brier-evaluator toetst de persoonlijke vangstkans aan gekoppelde sessie-uitkomsten en kan aantonen dat kalibratie/prestatie verbetering behoeft. Brier is geen biologische factor, geen directe gewichtstuner en geen correctie die achteraf oude prognoses verandert. Activiteit, voeding, habitat en tijdvakrangschikking vereisen passende eigen evaluatiemaatstaven.
- Sessies, inspanning/tijdvenster, doelsoort, stek, omstandigheden, vangsten en bevestigde nulvangsten kunnen de evaluatie voeden via onveranderlijke prognosesnapshots en kwaliteits-/vergelijkbaarheidsfilters. Onbekende of niet vergelijkbare uitkomsten worden niet als nulvangst geïnterpreteerd.

### Volgende auditstap

Voer nu de kandidaatmodel-audit uit binnen de bestaande `prognosisEngine.ts`-keten: leg voor elke reeds geïnventariseerde factor de huidige codebijdrage, gewenste respons, databeschikbaarheid, bewijsstatus, onzekerheid, interacties en evaluatiemethode naast elkaar. Maak daarna het kandidaatmodel en het chronologische validatieprotocol expliciet, inclusief vergelijking met de huidige baseline en bescherming tegen future leakage. Deze stap is ontwerp en audit; activeer nog geen nieuwe factor, gewicht, tijdvakbonus of runtimeberekening. Houd de bestaande scoreweergave intact. Zie ook de zeven acceptatiecriteria in §43 en de crosswalk in §89.


## 92. Code-audit bestaande score- en tijdvakketen (19 november 2026)

De huidige implementatie in `src/services/prognosisEngine.ts` is rechtstreeks gevolgd van `calculateDayPrognosis()` naar `analyzeTimeSlot()`. Dit is een feitelijke code-audit; er is geen runtimecode gewijzigd.

### Vastgestelde huidige werking

1. `calculateDayPrognosis()` roept `analyzeWaterThermalDevelopment()` één keer per datum aan. Hetzelfde `thermalAnalysis`-object wordt vervolgens aan alle vier tijdvakken (`Nacht`, `Ochtend`, `Middag`, `Avond`) doorgegeven.
2. `analyzeTimeSlot()` haalt voor elk tijdvak dezelfde gemeten of geschatte watertemperatuur uit dat gedeelde object. Dezelfde soortcurve levert daardoor in alle tijdvakken dezelfde `thermalEff` en dezelfde `activityScore` op.
3. Alleen de thermische respons beïnvloedt de huidige numerieke `activityScore`: `1 + 9 × thermalEff^0.85`, begrensd op 1–10. Druk, wind, seizoen, tijdstip/licht, bewolking en neerslag hebben `score: 0` en `impact: neutraal`; zij zijn alleen context.
4. De soortspecifieke diel-/voedingsinformatie wordt via `getSpeciesDielTimeContextText()` als tekst getoond. Zij levert nog geen numerieke tijdvakbijdrage. Persoonlijke sessies per starttijdvak worden als ervaringscontext getoond, niet als bijdrage aan de thermische activiteitsscore.
5. De dagscore is het gemiddelde van de vier tijdvak-`activityScore`-waarden. Omdat die waarden dezelfde gedeelde thermische respons gebruiken, is de huidige dagscore feitelijk dezelfde thermische score en geen gewogen samenvoeging van alle prognosefactoren.
6. De huidige `bestTimeSlot`-sortering vergelijkt diezelfde scores. Wanneer meerdere tijdvakken beschikbaar zijn, leidt dit normaal tot `Geen betekenisvol onderscheid`; de code kan hiermee geen soortspecifieke voedingspiek of beste tijdvak bepalen.
7. De persoonlijke Poisson-vangkans wordt afzonderlijk berekend uit vergelijkbare sessies en sessieduur. Deze wordt niet in de dagactiviteitsscore gemengd.

### Conclusie tegenover de beoogde producteis

De huidige scoreweergave kan behouden blijven, maar de beoogde geïntegreerde scoreketen en soort-/seizoen-/stekgevoelige tijdvakvoorkeur zijn nog niet geïmplementeerd. De factorpresentatie toont meerdere onderdelen, maar hun aanwezigheid op het scherm betekent niet dat zij numeriek bijdragen. De huidige tijdvakuitvoer is op dit moment geen echte vergelijking van tijdvakcondities of voedingsgedrag; zij hergebruikt de dagbrede thermische prior.

Dit is een kritisch functioneel verschil dat in het kandidaatmodel en de UI-tekst expliciet moet worden meegenomen. Het is geen reden om nu ad-hoc factoren of tijdvakbonussen toe te voegen. Eerst moet de volgende stap vaststellen welke tijdsafhankelijke invoer betrouwbaar per tijdvak beschikbaar is, welke responsen direct bewijs hebben, hoe onbekende waarden doorwerken in onzekerheid en hoe de kandidaatuitvoer chronologisch wordt gevalideerd.

### Vervolg

- Maak een factor-voor-factor traceermatrix van de volledige bestaande prognose: invoer → berekening → factorbijdrage → scoreaggregatie → tijdvakrangschikking → UI → snapshot → evaluatie.
- Onderzoek afzonderlijk of waterthermische invoer per tijdvak kan worden afgeleid uit de bestaande waterthermische engine zonder de huidige voorlopige curve te verwarren met voedingsgedrag.
- Ontwerp de beoogde tijdvakrespons met soortspecifiek direct voedings-/foerageerbewijs en relevante seizoen-/stekcontext; beweging/habitat blijft een afzonderlijke laag.
- Leg vast welke factoren alleen context blijven, welke numeriek kandidaat zijn, welke inputdekking ontbreekt en welke onafhankelijke evaluatiemaatstaf nodig is.
- Behoud de huidige scoreweergave en centrale prognosearchitectuur. Geen runtimewijziging, nieuw gewicht, nieuwe score of geforceerde tijdvakwinnaar voordat het kandidaatmodel en validatieprotocol zijn beoordeeld.

Deze bevinding actualiseert de volgende stap uit §91: de kandidaatmodel-audit begint met deze bestaande codeketen als baseline. Fase 2 blijft open; Fase 3 blijft geblokkeerd.


## 93. Factor-naar-UI/snapshot/evaluatie-traceermatrix — huidige baseline (19 november 2026)

Deze matrix vervolledigt de code-audit uit §92. De classificatie beschrijft de huidige implementatie op `main`; zij is geen voorstel om alle factoren direct numeriek te activeren.

| Factor/laag | Huidige code- en gegevensroute | Huidige invloed op bestaande dagscore | Snapshot/evaluatie | Kandidaatstatus voor vervolg |
|---|---|---|---|---|
| Watertemperatuur / thermische respons | `waterThermalEngine.ts` bepaalt gemeten/geschatte watertemperatuur en provenance; `fishProfiles.ts` levert de voorlopige soortcurve; `prognosisEngine.ts` rekent de 1–10 thermische activiteitspotentie. | **Enige numerieke bijdrage** aan `activityScore`. Eén dagelijkse analyse wordt op alle vier tijdvakken hergebruikt. | Prognose en inputcontext worden in snapshot bewaard; voorspelde watertemperatuur wordt apart geëvalueerd met MAE/RMSE/bias. Lokale biascorrectie gebruikt minimaal acht eerdere meetparen op dezelfde stek en hetzelfde seizoen. | Bestaande voorlopige prior behouden; eerst onderzoeken welke tijdsresolutie en onzekerheidsband verantwoord uit de bestaande waterthermische invoer volgen. Exacte soortcurveparameters blijven ongevalideerd. |
| Luchtdruk / druktrend | Uurlijkse weersinvoer en `findPressureTrend()` binnen `prognosisEngine.ts`. | Geen; `score: 0`, alleen beschrijvende context. | In `prognosisData` en snapshot aanwezig als prognose-uitvoer; geen zelfstandige biologische evaluatiemaatstaf. | Context of uitgesloten voor numerieke score totdat directe, overdraagbare respons en passende lokale data bestaan. |
| Wind / windrichting | Uurlijkse weersinvoer in prognose; aparte bestaande bankwind-/positioneringsengines gebruiken wind voor praktische oever-, werp- en presentatiecontext. | Geen bijdrage aan dagelijkse biologische score; geen automatische soortbonus. | Prognose/snapshot bewaren beschikbare context; praktische tactiek blijft een aparte coachlaag. Geen gevalideerde dagelijkse voedings-/vangstevaluatie. | Houd totale activiteit gescheiden van lokale positionering en aas-/lijnpresentatie. Alleen een direct onderbouwde biologische respons kan later een aparte numerieke rol krijgen. |
| Seizoen | Kalendermaand wordt in `analyzeTimeSlot()` afgeleid en als tekstuele context getoond. | Geen; `score: 0`. | Datum zit in prognose/snapshot; geen zelfstandige seizoensscore-evaluatie. | Seizoen kan context/modulator zijn wanneer soortspecifieke interactie direct is onderbouwd en chronologisch toetsbaar is; geen universele seizoensbonus. |
| Tijdstip, licht en diel-/voedingsbewijs | Zon-/schemercontext en `getSpeciesDielTimeContextText()` uit de soortspecifieke evidence-service. Oude vaste profielbonussen zijn verwijderd. | Geen; `score: 0`. Voedingsbewijs is verklarende tekst; beweging/habitat wordt niet als voeding vertaald. | De volledige tijdvakuitvoer zit in `prognosisData`; afzonderlijke tijdvakvangst-/blootstellingsdiagnostiek bestaat, maar is geen gevalideerde tijdvakvoorspelling. | Belangrijkste kandidaat voor soortspecifieke tijdvakrespons, maar alleen met directe voedings-/foerageerdata en passende seizoen-/habitatcontext. Geen generieke schemer-/nachtbonus. |
| Bewolking en neerslag | Uurlijkse weersinvoer wordt per tijdvak samengevat in `analyzeTimeSlot()`. | Geen; `score: 0`, contextueel. | Beschikbare waarden worden via de prognose-uitvoer bewaard; geen onafhankelijke activiteit-/voedingsvalidatie. | Context of uitgesloten totdat respons, richting en overdraagbaarheid per soort en watertype zijn aangetoond. |
| Zuurstof, stroming/afvoer en troebelheid | Niet betrouwbaar als actuele lokale invoer beschikbaar in de huidige prognoseketen; in §88 als bewijs-/datadekkingsbeperking beoordeeld. | Geen bijdrage; onbekend wordt niet uit andere weersfactoren afgeleid. | Geen betrouwbare actuele factorwaarde om onafhankelijk te evalueren. | Niet numeriek activeren zonder betrouwbare lokale meting en passende soort-/watertype-evidence. |
| Habitat, aanwezigheid en beweging | `habitatMovementEngine.ts` gebruikt stekgegevens, thermische context, wind, waarnemingen en historische sessies voor ruimtelijke hypothesen. | Geen directe bijdrage aan de dagelijkse totale activiteitsscore. | Context/waarnemingen zijn deels opgenomen in snapshot-inputcontext; geen gekalibreerde aanwezigheidskans of zelfstandige score-evaluatie. | Blijft een afzonderlijke ruimtelijke responslaag; aanwezigheid/habitatgeschiktheid niet gelijkstellen aan voeding of vangbaarheid. |
| Persoonlijke tijdvakervaring | `getSimilarSessions()` groepeert sessies op starttijdvak en toont aantallen/uitkomsten in de tijdvakdetails. `timeSlotCatchEvidenceAudit.ts` en `timeSlotExposureEngine.ts` leveren afzonderlijke diagnostiek. | Geen bijdrage aan thermische `activityScore`; alleen ervarings-/diagnostische context. | Sessies en vangsten zijn via snapshot-/sessierelaties beschikbaar; tijdvakblootstelling en vangstbewijs hebben expliciete beperkingen rond starttijd, inspanning en bevestigde nulvangst. | Pas bruikbaar als tijdvakmodel na vergelijkbare blootstelling, correcte inspanningsnoemer en voldoende onafhankelijke sessies; sessiestart alleen is geen volledige tijdvakblootstelling. |
| Persoonlijke vangstkans | Historische vergelijkbare sessies en doelsoortvangsten leveren `lambda` en Poisson-duurkans in `prognosisEngine.ts`. | Apart resultaat; niet gemengd in de biologische dagscore. | `predictedCatchChance` en gekoppelde sessie-uitkomst worden door `evaluationEngine.ts` chronologisch met Brier/BSS en kalibratiebins geëvalueerd. | Behouden als afzonderlijke persoonlijke vangstbaseline totdat een gevalideerde biologische koppeling bestaat. Brier stuurt geen biologische factorgewichten rechtstreeks bij. |

### UI- en snapshotbevinding

`PrognosisView.tsx` toont de bestaande dagscore, persoonlijke vangstkans en de afzonderlijke factor-/tijdvakdetails. Dat factoren zichtbaar zijn in de detailweergave betekent niet dat zij aan de score bijdragen. `savePrognosisSnapshot()` bewaart de volledige `prognosisData`, inputcontext en engineversies, naast expliciete velden voor `predictedActivityScore`, `predictedCatchChance` en thermische voorspelling. Dit ondersteunt reproduceerbaarheid, maar de huidige snapshot bevat nog geen afzonderlijke gevalideerde gewichtsbijdrage per factor omdat die bijdragen niet bestaan.

### Evaluatiebevinding

- `evaluatePrognosisPerformance()` evalueert de persoonlijke vangstkans tegen definitieve, aan een afgeronde sessie gekoppelde catch/confirmed-skunk-uitkomsten. De eerste vooraf vastgelegde voorspelling per sessie/doelsoort telt; duur en werkelijk tijdvenster moeten vergelijkbaar zijn. De rolling baseline gebruikt uitsluitend eerdere bekende uitkomsten van dezelfde doelsoort die vóór de voorspelling al waren afgerond.
- `evaluateWaterTemperaturePerformance()` meet temperatuurfout (MAE/RMSE/bias). `getWaterTemperatureCalibration()` kan uitsluitend op eerdere metingen van dezelfde stek en hetzelfde seizoen een beperkte biascorrectie toepassen.
- Er is nog geen onafhankelijke evaluatie voor de thermische activiteitsscore als biologische activiteit, voedingsintensiteit, habitat-aanwezigheid of soortspecifieke tijdvakrangschikking. De bestaande Brier-score mag die leemte niet opvullen.

### Volgende kandidaatmodelstap

De factorinventaris is nu verbonden met code, UI, snapshot en evaluatie. De volgende stap is het kandidaatmodel en validatieprotocol ontwerpen: bepaal per factor welke respons voorspeld wordt, welke tijdschaal/invoer vereist is, welke factoren alleen context blijven, welke factorinteracties verantwoord zijn en welke onafhankelijke maatstaf de uitkomst kan toetsen. Vergelijk chronologisch met de bestaande thermische baseline en voorkom future leakage. De huidige scoreweergave blijft behouden; er worden nog geen numerieke gewichten of nieuwe tijdvakvoorkeuren geactiveerd.


## 94. Kandidaatmodel v0 en chronologisch validatieprotocol — ontwerp, geen activatie (19 november 2026)

Deze sectie vertaalt de bestaande factortrace (§93), de vijf gescheiden responslagen en de producteis uit §91 naar een toetsbaar kandidaatontwerp. Er is geen runtimecode, score, gewicht of parameter gewijzigd.

### 94.1 Beoogde prognoseketen

1. **Invoer en provenance:** doelsoort, stek, datum, beschikbare uurlijkse weersverwachting, waterthermische meting/schatting met onzekerheidsband, lokale zon-/schemertijden, bekende stek-/habitatkenmerken en betrouwbare historische context. Onbekende invoer blijft expliciet onbekend.
2. **Factoruitkomsten per dag:** ieder relevant bestaand prognoseonderdeel levert uiteindelijk een eigen factorresultaat op de interne gemeenschappelijke schaal, met bron, richting, data-dekking, onzekerheid en responsdefinitie. Waar bewijs en data dit toelaten, krijgt de factor een expliciete soort-/contextgebonden bijdrage en onderbouwd gewicht in de bestaande dagscore.
3. **Bestaande totaalscore:** de toegelaten factorbijdragen worden in één bestaande dagelijkse score samengebracht. De huidige 1–10-weergave blijft behouden. Dit betekent niet dat alle zichtbare prognose-uitkomsten in één getal worden gemengd: habitat/aanwezigheid, persoonlijke vangstkans en betrouwbaarheid blijven herkenbare afzonderlijke responsen tenzij een specifieke koppeling onafhankelijk is gevalideerd.
4. **Tijdvakrespons:** Nacht, Ochtend, Middag en Avond worden afzonderlijk beoordeeld met de beschikbare tijdvakcondities, doelsoort, datum/seizoen en stekcontext. Direct soortspecifiek voedings-/foerageerbewijs kan de tijdvakvoorkeur beïnvloeden. Beweging, thermische respons en habitatgebruik zijn niet automatisch voedingsgedrag. De huidige gedeelde dagthermische waarde kan op zichzelf geen tijdvakverschil bepalen.
5. **Uitleg en onzekerheid:** de bestaande detailweergave toont per factor de bijdrage of expliciete status (context, onbekend, uitgesloten). De standaardweergave behoudt de huidige score en kernuitkomsten. Ontbrekende factoren worden niet met een fictieve neutrale waarde gevuld.
6. **VisCoach:** consumeert de centrale prognose en bestaande gespecialiseerde engines. Geen eigen prognose, tweede score of dubbele biologische regels.

### 94.2 Responslagen en scoregrenzen

- **Thermische fysiologische activiteit:** bestaande curves blijven uitsluitend de voorlopige mechanistische prior. Geen automatische omzetting naar voeding, habitat-aanwezigheid of vangbaarheid.
- **Voeding/foerageren:** afzonderlijke soortspecifieke respons; numerieke invloed alleen bij direct passend bewijs en relevante context. Dielgedrag mag tijdvakvoorkeur sturen wanneer de gemeten respons daadwerkelijk voedselopname/foerageren betreft.
- **Habitat/aanwezigheid/beweging:** aparte ruimtelijke uitkomst via bestaande habitatengine; geen automatische bijdrage aan totale fysiologische activiteit.
- **Persoonlijke vangstkans:** bestaande empirische Poisson-baseline blijft apart. Geen thermische, voedings- of habitatcorrectie totdat een koppeling afzonderlijk is gevalideerd.
- **Betrouwbaarheid:** geen optelscore van vertrouwen. Provenance, dekking, bronkwaliteit, onzekerheidsbanden en steekproefgrootte blijven afzonderlijk zichtbaar.

### 94.3 Gewichten en ontbrekende gegevens

Er worden geen vaste percentages, universele soortgewichten of intuïtieve bonussen vooraf ingevuld. Iedere kandidaatfactor moet aantonen: gemeten respons, overdraagbaarheid, relevante tijdschaal, betrouwbare input, richting, interacties en een onafhankelijke evaluatiemaatstaf. Gewichten kunnen pas worden vastgesteld na onderbouwde parameterkeuze en chronologische vergelijking met de baseline.

Nog te besluiten en te testen vóór implementatie:
- normalisatie van verschillende factorresponsen naar een gemeenschappelijke interne schaal;
- optellen versus andere aggregatie en mogelijke interacties;
- omgaan met ontbrekende factoren zonder schijnneutrale score of arbitraire hernormalisatie;
- minimumdekking waarbij een dagscore verantwoord berekend kan worden versus expliciet N/B;
- hoe een dagsamenvatting zich verhoudt tot de vier afzonderlijke tijdvakuitkomsten;
- of en wanneer lokale sessiedata voldoende representatief zijn om een soort-/stek-/seizoensgewicht te kalibreren.

### 94.4 Chronologisch validatieprotocol

1. Bevries de huidige thermische-only dagscore als baseline en behoud per run de bestaande onveranderlijke input-/prognosesnapshot, modelversie en engineversies.
2. Gebruik rolling-origin evaluatie: een voorspelling op tijdstip T mag uitsluitend trainings-/kalibratie-uitkomsten gebruiken die vóór T volledig bekend waren. Houd doelsoort, stek, seizoen, duur en werkelijke blootstelling vergelijkbaar.
3. Vergelijk kandidaat en baseline op dezelfde vooraf vastgelegde, ongeziene sessies. Rapporteer aantallen, uitsluitingen, onzekerheid en prestaties per soort en waar datavolume dit toelaat per seizoen/stek/watertype.
4. **Vangkans:** Brier/BSS blijft uitsluitend de evaluator van de persoonlijke catch probability, met dezelfde sessie-, duur- en tijdvenstercriteria. Geen directe gewichtstuning of terugschrijven naar historische snapshots.
5. **Watertemperatuur:** MAE/RMSE/bias blijft de aparte evaluatie van de thermische schatter; dit valideert niet vanzelf de visfysiologische curve.
6. **Activiteit en voeding:** vereisen directe of voldoende passende onafhankelijke responslabels. Een hengelvangst is geen zuivere meting van fysiologische activiteit of voedselopname.
7. **Tijdvak:** gebruik waar mogelijk betrouwbare tijdgebonden vangstregistratie én geregistreerde hengelblootstelling per tijdvak. Een automatisch ingevuld vangsttijdstip bij het openen van het formulier is geen geverifieerd vangstmoment; een sessiestart alleen bewijst geen volledige tijdvakblootstelling. Bevestigde sessiebrede nulvangst is niet automatisch nulvangst in elk tijdvak.
8. **Habitat/aanwezigheid:** vereist eigen aanwezigheid-/habitatlabels en mag niet met voedings- of vangstlabels worden gevalideerd.
9. Houd modelversies gescheiden, voorkom future leakage, rapporteer ook negatieve resultaten en activeer geen zelflerende gewichtswijziging zonder afzonderlijke review en regressietests.

### 94.5 Uitkomst en resterende fasepoort

Dit is het kandidaatontwerp voor de volgende review, niet een definitief gekozen formule. De precieze normalisatie, aggregatie, missing-data-regel en gewichtsbepaling moeten eerst aan de bestaande acceptatiecriteria worden getoetst. Criterium 2 blijft inhoudelijk begrensd door de ongevalideerde exacte thermische curveparameters; de keuze voor optie A is geen wetenschappelijke validatie. De overige onafhankelijke biologische evaluaties moeten worden ontworpen voordat numerieke voedings- of tijdvakbijdragen kunnen worden geactiveerd.

Fase 2 blijft niet geaccepteerd en Fase 3 blijft geblokkeerd. Er is geen runtimewijziging.

## 95. Kritische documentconsistentiecontrole (19 november 2026)

Bij het vergelijken van de architectuurtekst met de actuele code is een verouderde zin gevonden in §41: de persoonlijke Poisson-vangkans werd daar nog beschreven als voorzien van een thermische dagscorecorrectie. Dat is onjuist. De actuele `prognosisEngine.ts` berekent de persoonlijke Poisson-baseline uit vergelijkbare vangsten en geregistreerde visduur zonder thermische multiplier; §46 en de actuele code zijn leidend. §41 is in dezelfde documentupdate gecorrigeerd.

Ook zijn dubbele sectienummers ontstaan bij de recente architectuurtoevoegingen. De nieuwe architectuursecties zijn hernummerd naar §82–§84 zodat de documentstructuur uniek blijft. Dit is documentcorrectie; geen runtimegedrag gewijzigd.


## 96. Read-only audit: temperatuurafhankelijke voorvoer- en tactiekregels (19 november 2026)

### 96.1 Voorvoerengine — actieve numerieke regels

`prebaitEngine.ts` bevat buiten de uitgeschakelde thermische activiteitsscore nog een aparte temperatuurafhankelijke tactiekberekening:

| Watertemperatuur | Huidige engine-uitkomst | Actieve numerieke consequentie |
|---|---|---|
| Onbekend | Geen voorvoer | 0 dagen / 0 gram |
| < 6 °C | Niet aanbevolen | 0 dagen |
| 6–<10 °C | Beperkt / voorzichtig | 1 dag, 100 g/dag |
| 10–<16 °C | Matig zinvol | maximaal 2 dagen, 250 g/dag |
| 16–22 °C | Zeer zinvol | maximaal 3 dagen, 450 g stilstaand water of 600 g stromend water |
| > 22 °C | Beperkt / voorzichtig | 1 dag, 200 g/dag |

De sessiehoeveelheid gebruikt daarnaast temperatuur-/techniekafhankelijke waarden (onder meer 30–150 g per standaardduur), en `getSpeciesFeed()` past soortfactoren toe: karper 1,00, brasem 0,65 en zeelt 0,55. De interne `suitabilityScore` gebruikt 0/1/4/6/8 en bepaalt mede of een voorvoercampagne wordt ingepland.

### 96.2 Bronbasis en overdraagbaarheid

- **Volkoff & Rønnestad (2020), DOI 10.1080/23328940.2020.1765950:** ondersteunt dat temperatuur voedselopname en vertering beïnvloedt, maar benadrukt grote soort-, acclimatisatie-, levensfase- en blootstellingsverschillen. Dit ondersteunt temperatuur als context, niet de vaste grenzen 6/10/16/22 °C of grammen per stek.
- **Chen et al. (2012), DOI 10.1016/S1006-8104(12)60039-7:** experimentele voedselopname bij de Aziatische ondersoort `Cyprinus carpio haematopterus` over 4–34 °C. Bij 6 °C was de gemeten opname zeer laag maar niet nul; de hoogste dagelijkse opname trad op bij 28 °C en nam bij 34 °C af. Dit valideert niet de huidige grens van 22 °C als omslag naar voorzichtig voeren, en levert geen overdraagbare grammen per voerbeurt voor Nederlandse recreatieve karperstekken.
- **Benjamin, Hill & Ricciardi (2026), DOI 10.1007/s10530-026-03767-w:** bij zeelt werd in een experimentele vergelijking een lagere maximale voedingssnelheid bij 25 °C dan bij 18 °C gevonden. Twee temperatuurbehandelingen in het St. Lawrence-systeem vormen geen volledige curve en ondersteunen geen universele grens van 22 °C of de soortfactor 0,55.
- Voor brasem zijn in het register directe voedings-/dagritmebronnen opgenomen, maar geen passende soortspecifieke temperatuurrespons die de huidige voorvoerbanden of factor 0,65 valideert.

De research registry bevat 71 records; alle 71 staan op `approvedForPrediction: false`. De `feedingEvidenceService` verzamelt directe voedings-, ritme-, foerageer- en dieetbronnen, maar de lijst met expliciet goedgekeurde directe voedingsbronnen is daardoor momenteel leeg. `prebaitEngine.ts` gebruikt deze bewijsstatus niet als voorwaarde voor zijn numerieke drempels of hoeveelheden.

**Conclusie:** de algemene richting dat temperatuur voedingsprocessen beïnvloedt is onderbouwd; de exacte enginegrenzen, geschiktheidsscore, soortfactoren, rivierbonus en gramadviezen zijn niet rechtstreeks gevalideerd. De engine noemt ze zelf conservatieve startindicaties, maar de UI/adviesvertaling moet dit onderscheid prominent houden. `confidenceLevel` meet momenteel de volledigheid van temperatuur-, watertype- en diepte-invoer; het is geen maat voor de wetenschappelijke bewijssterkte van de gramadviezen.

### 96.3 Presentatie- en consistentiecontrole

- De VisCoach-vertaling toont voorafgaande grammen alleen wanneer `confidenceLevel === 'Redelijk'`, en toont sessiegrammen alleen bij bekende sessieduur en redelijke invoerkwaliteit.
- De algemene `PrognosisView` toont de hoeveelheid uit `moments.amountDisplay` momenteel rechtstreeks, ook wanneer de invoerkwaliteit lager is. Dit wijkt af van de bestaande productregel dat exacte grammen bij lagere invoerkwaliteit verborgen blijven.
- De algemene view gebruikte de kop “Gefundeerd voeradvies op maat”, terwijl de engine de waarden zelf als conservatieve startindicaties beschrijft. De kop is daarom verduidelijkt naar “Voorzichtige startindicatie”.
- Een eerdere tussenversie van de prognoseview bevatte tekst uit de tijdelijke optie-B-periode waarin de thermische activiteitsscore uit stond. Die passage is achterhaald door het latere, expliciete ontwerpbesluit optie A (§90) en de herstel-/code-audit (§92): de bestaande thermische prior is actief als enige numerieke dagscorebijdrage. De huidige code berekent thermalEff via calculateThermalEfficiency() en activityScore via 1 + 9 × thermalEff^0.85; bij onbekende watertemperatuur blijft activityScoreAvailable=false en wordt geen geldige score opgeslagen. Dit is een documentcorrectie; er is geen runtimewijziging.

### 96.4 Habitat- en positioneringsregels

De habitat- en positioneringsengines gebruiken nog temperatuurgrenzen als zoekhypothese, onder meer koudwaterregels rond 7–9 °C, een voorjaarsregel rond 11 °C, zeelt rond 11 °C en meerval rond 12 °C. Deze uitkomsten zijn geen numerieke activiteitsscore en worden op meerdere plaatsen expliciet als zoekhypothese/context omschreven. Enkele soortspecifieke teksten (“extreme winterrust”, “diepe inactieve spaarstand” of sterk vertraagde stofwisseling) zijn stelliger dan de huidige bronregistratie rechtvaardigt. De volgende audit moet deze formuleringen per soort koppelen aan passende fysiologische/veldbronnen of ze terugbrengen tot voorzichtige, niet-dwingende zoekhypothesen.

### 96.5 Nog geen runtimebesluit

Er zijn in deze audit geen temperatuurgrenzen, soortfactoren, gramadviezen of habitat-/positioneringsregels aangepast. De uitkomsten blijven buiten de thermische activiteitsscore en mogen niet als gevalideerde vangstkans worden gepresenteerd.

**Ontwerpbesluit nodig:** 
- Optie A: de bestaande voorvoerwaarden behouden als expliciet praktische heuristiek, met prominente waarschuwing, invoerkwaliteitsgrens en lokale bijstelling; of
- Optie B: numerieke geschiktheidsscore en exacte gramadviezen uitschakelen totdat passende soort-/watercontext of lokale praktijkdata de parameters ondersteunen, terwijl kwalitatieve voer- en method-feederadviezen blijven bestaan.

Mijn kwaliteitsadvies is optie B voor de numerieke score en exacte hoeveelheden. Behoud de kwalitatieve tactiek en de beschrijvende persoonlijke vergelijking; gebruik geen exacte grammen als schijnnauwkeurige biologische aanbeveling. Dit vereist expliciete goedkeuring voordat runtimegedrag wordt aangepast.

Criterium 2 en de formele Fase-2-acceptatie blijven open. Fase 3 blijft geblokkeerd.



## 97. Read-only vervolgcontrole: thermische zoekhypothesen in habitat en positionering (19 november 2026)

Deze controle volgt de open actie uit §96.4. Zij beoordeelt de huidige temperatuurafhankelijke tekst-/zonekeuzes in `habitatMovementEngine.ts` en `rodPositioningEngine.ts`. Geen drempel of tactiekregel is gewijzigd.

### 97.1 Generieke habitat-/bewegingsengine

`habitatMovementEngine.ts` gebruikt de volgende generieke classificaties:

| Codevoorwaarde | Huidige rol | Auditbeoordeling |
|---|---|---|
| Watertemperatuur < 8 °C | Koudwater-/winterhypothese; mogelijk stabielere of beschutte zone | Alleen brede context. Geen soortspecifieke grens en geen bewijs dat de vis altijd dieper zit of minder vangbaar is. |
| Voorjaar én opwarmingstrend of temperatuur ≥ 11 °C | Hypothese dat ondiepere zones vaker gebruikt kunnen worden | Richting plausibel als zoekhypothese, maar 11 °C is geen gevalideerde universele omslaggrens; zon, diepte, watertype en lokale temperatuurgradiënt ontbreken. |
| Watertemperatuur ≥ 18 °C | Warme/zomercontext; bij middag schaduwstructuur als mogelijke zone | Contextuele zoekhypothese; geen gemeten soortspecifiek optimum of bewijs voor hogere voedselopname. |

De uitvoer benoemt deze patronen doorgaans als hypothese en vraagt lokale diepte-/structuurcontrole. De engine blijft een aparte ruimtelijke laag; deze classificaties zijn geen dagscorebijdrage en mogen niet als voeding of vangstkans worden geïnterpreteerd.

### 97.2 Soortspecifieke positioneringsregels

| Soort / codevoorwaarde | Huidige tekst of gevolg | Wat het bewijs wel ondersteunt | Wat niet is aangetoond |
|---|---|---|---|
| Snoek: < 7 °C, of < 9 °C bij koude wind | Diepere taluds en prooivisconcentraties; snoek volgt witvis naar diepere hinderlagen | Snoek gebruikt afhankelijk van grootte, dekking, zuurstof en waterlichaam verschillende dieptes; wintergebruik kan ruimtelijk variabel zijn. | Geen universele 7/9 °C-drempel, geen vaste prooivisverplaatsing naar diep water en geen vaste snoekreactie. Pierce et al. (2013) vond flexibele dieptekeuze en sterke invloed van lichaamsgrootte en vegetatiedekking; Kobler et al. (2008) vond in winter grotere activiteitcentra met overlap met zomerlocaties. |
| Zeelt: < 11 °C | “Extreme winterrust”, “diepe inactieve spaarstand” en strikt mijden van ruwe golfslag/stroming | Zeelt kan bij ongunstige omstandigheden in zachte bodem/modder schuilen of ingraven; soort gebruikt vaak ondiepe, rustige, begroeide habitats. | De bronbasis onderbouwt geen vaste 11 °C-omslag, geen universele diepe rustzone en geen volledige inactiviteit. Avlijaš et al. (2018) bespreekt mud-burrowing als reactie op lage temperatuur, zuurstof of waterstand, maar geeft geen 11 °C-drempel of acute voedingsrespons. |
| Meerval: < 12 °C | Diepste overwinteringskuilen/rusttoestand; “stofwisseling vertraagt drastisch” en “zonder actief te jagen” | Europese meerval kan bij lage temperaturen seizoensgebonden aggregaties en diepte-/bewegingsveranderingen vertonen; locatie en populatie zijn belangrijk. | De stellige grens 12–14 °C en afwezigheid van jacht zijn niet universeel. Capra et al. (2023) vond winteraggregatie bij temperaturen onder 9 °C in één Frans meer, maar ook vertrek uit de aggregatie vaker bij schemer/nacht wanneer temperatuur steeg. Bergström et al. (2024) registreerde activiteit bij minder dan 5 °C in een noordelijke populatie. Krey et al. (2026) vond verschil tussen lentische en lotische verticale beweging. Dit is vooral habitat-/bewegingsbewijs, geen voedingsmeting. |
| Voorn: < 7 °C | Diepe havens/kuilen; zonnige middagen korte verplaatsing naar ondiepe luwe oever | Wintermigratie naar zijwateren/stromen en tijdgebonden verplaatsing zijn in specifieke systemen gemeten. | Geen vaste 7 °C-grens en geen algemeen bewijs voor de genoemde zonnige-middagroute. Skov et al. (2008) vond dat een deel van de blankvoornpopulatie in één meren-stroomsysteem in winter naar stromen migreerde; instroommomenten verschilden per seizoen en stroom. Dit is beweging, geen directe voedselopname. |
| Generieke soorten: < 7 °C, of < 9 °C bij koude wind | Diepere rustzone/luwe oever | Een temperatuur-/windcontext kan als voorzichtig zoeksignaal worden vermeld. | Geen generieke biologische drempel of universele dieptekeuze voor alle soorten. |
| Voorjaar: opwarmingstrend of ≥ 11 °C | Ondiepe, zonnige, beschutte zones als mogelijke zoekplek voor karper en witvis | Opwarming en lokale habitat kunnen seizoensgebonden zonegebruik beïnvloeden. | Geen universele 11 °C-grens en geen garantie dat aanlandige wind of ondiep water meer vis of voedsel oplevert. |

### 97.3 Overige positionerings-/windcontext

- `buildWindCastingGuidance()` gebruikt temperatuurbanden (<8 °C, <10 °C bij koude wind, voorjaar ≥11 °C, warm water ≥21 °C) samen met seizoen en wind om de beoordeling van de windkant te formuleren. De actuele tekst zegt expliciet dat windrichting alleen geen vislocatie bewijst; deze rol is positionering/presentatie, niet een biologische score.
- `bankWindEngine.ts` bepaalt de fysieke relatie tussen windrichting en ingestelde oeverkijkrichting. Het leidt geen vislocatie uit wind af.
- De soortspecifieke positioneringsfunctie wordt alleen gebruikt wanneer watertype, bruikbare watertemperatuur en gemiddelde windsnelheid aanwezig zijn. Anders valt zij terug op geregistreerde lokale structuren en een lage-confidence algemene zoekhypothese.
- Gemeten en geschatte watertemperatuur worden in de positioneringsketen onderscheiden, maar de code gebruikt voor meerdere drempels beide als `effectiveWaterTemp`. De onzekerheid van een schatting wordt niet in de numerieke grens zelf verwerkt.

### 97.4 Nieuwe/aanvullende primaire bronnen en status

Vijf bronnen zijn toegevoegd aan `researchRegistry.ts` als niet-goedgekeurde contextregistraties (totaal: 76 records; alle 76 `approvedForPrediction: false`):

- Capra et al. (2023), Europese meerval overwinteringsaggregatie, DOI 10.1186/s40462-023-00373-6 — habitatgebruik/beweging; één ondiep Frans meer.
- Krey et al. (2026), lentische versus lotische meerval-diepte- en verticale beweging, DOI 10.1111/fme.70082 — habitatgebruik/beweging; Lake Constance en twee zijrivieren.
- Pierce et al. (2013), snoekdiepte en thermisch habitat in drie Minnesota-meren, DOI 10.1080/00028487.2013.822422 — habitatgebruik; grootte, dekking en zuurstof beïnvloeden dieptekeuze.
- Kobler et al. (2008), seizoensgebonden activiteitcentra van vrouwelijke snoek in één Duits meer, DOI 10.1111/j.1095-8649.2008.01952.x — habitatgebruik/beweging.
- Skov et al. (2008), wintermigratie van blankvoorn, brasem en ruisvoorn tussen meer en stromen, DOI 10.1111/j.1600-0633.2008.00291.x — habitatgebruik/beweging; migratie en tijdstip verschillen tussen systeem en seizoen.

Avlijaš et al. (2018), DOI 10.1139/cjfas-2017-0171, is als review/risicobeoordeling gebruikt voor de voorzichtige mud-burrowing-context bij zeelt; dit is geen directe studie die de codegrens van 11 °C valideert.

### 97.5 Conclusie en vervolg

De bestaande positioneringsregels zijn zoekhypothesen en mogen niet in de dagelijkse activiteitsscore worden opgenomen. De sterkste tekstuele correctiekandidaat is de meervalregel onder 12 °C: de formulering “zonder actief te jagen” is te absoluut tegenover veldgegevens die populatie- en watertypeverschillen en activiteit bij zeer lage temperaturen laten zien. De zeeltregel onder 11 °C en de snoek-/voornregels onder 7–9 °C hebben eveneens geen gevalideerde exacte drempel.

Er wordt nog geen runtimegedrag aangepast. De volgende auditstap is de bron-/claimtrace per soort afronden en de resterende tactiekregels expliciet classificeren als: behoud als voorzichtige zoekhypothese, uitsluitend beschrijvende context, of verwijderen/afzwakken wegens te stellige claim. De afzonderlijke keuze over het uitschakelen van numerieke voorvoer-suitability en grammen uit §96.5 blijft open en vereist expliciete goedkeuring voordat runtimeberekeningen veranderen.

Fase 2 blijft open; Fase 3 blijft geblokkeerd.


## 98. Correctie van te stellige koudewater-zoekclaims (19 november 2026)

De claim-/brontrace uit §97 is afgerond voor de actieve soortspecifieke koudewaterregels. Vier teksten in `rodPositioningEngine.ts` waren stelliger dan de geregistreerde bronnen rechtvaardigen. De correctie is beperkt tot de formulering en de expliciete onzekerheid; de bestaande temperatuurcondities, zonestructuur en scoreberekeningen blijven ongewijzigd.

| Regel | Correctie | Wat bewust ongewijzigd blijft |
|---|---|---|
| Snoek <7 °C / <9 °C met koude wind | Geen algemene claim meer dat witvis altijd diep trekt en snoek die concentratie volgt; lichaamsgrootte, vegetatie, zuurstof en lokale prooivis worden benoemd. De drempel is expliciet een praktische zoektrigger. | Bestaande conditionele route naar diepe taluds blijft staan; geen numerieke prognosescore. |
| Zeelt <11 °C | “Extreme winterrust” en “diepe inactieve spaarstand” verwijderd. Modder/zachte bodem wordt een mogelijke schuilplek; geen vaste 11 °C-omslag. | Bestaande zonekeuze blijft een voorzichtige zoekhypothese; geen voer-/activiteitsscore. |
| Meerval <12 °C | “Zonder actief te jagen” en universele 12–14 °C-inactiviteitsclaim verwijderd. Populatie-/watertypevariatie en veldactiviteit onder 5 °C worden vermeld. | Bestaande diepere rust-/aggregatiezone blijft alleen een lokale zoekhypothese; geen vaste biologische omslag of activiteitsscore. |
| Voorn <7 °C | Specifieke zonnige-middagverplaatsing naar ondiepe oever verwijderd. Wintermigratie naar verbonden refuges wordt als waterlichaamafhankelijk beschreven. | Bestaande conditionele route naar rustige refuges blijft; geen vaste temperatuurrespons in de dagscore. |
| Generieke koudewaterregel en voorjaarsregel | Taal verduidelijkt naar mogelijke contextinvloed en lokale controle; geen universele visverplaatsing of gegarandeerde voedingszone. | Drempels blijven uitsluitend tactische heuristieken, niet de biologische dagscore. |

Vier regressieasserties bewaken dat de nieuwe teksten geen harde, onbewezen claims terugbrengen. Er zijn geen temperatuurgrenzen, gramadviezen, soortenprofielen, gewichten of tijdvakbonussen gewijzigd.

Deze gerichte tekstcorrectie is noodzakelijk om te voorkomen dat een ruimtelijke zoekhypothese als vaststaand biologisch feit wordt gepresenteerd. Fase 2 blijft open; Fase 3 blijft geblokkeerd.


## 99. Soortspecifieke registerdekking bijgewerkt na aanvullende telemetrie (19 november 2026)

De dekkingstabel in §78 is opnieuw berekend op de actuele `RESEARCH_REGISTRY` op `main`. De vijf aanvullende bronnen uit §97 brengen het register van 71 naar 76 records. De telling per uitkomstgroep is het aantal unieke records per soort dat ten minste één van de uitkomstlabels in die groep bevat; één record kan in meerdere groepen meetellen. Dit zijn geen onafhankelijke steekproefaantallen, effectgroottes of goedgekeurde modelinputs.

- Alle 76 records blijven `approvedForPrediction: false`; de bronstatus is niet gewijzigd.
- De belangrijkste lacune voor een soortspecifieke tijdvakvoorkeur blijft roofblei: er zijn dieet- en bewegingsbronnen, maar geen directe `feeding_intensity`/`feeding_rhythm`-registraties.
- De meervalregistraties omvatten gecontroleerde voedingsritmes en veld-/telemetrieonderzoek; de laatste meet vooral beweging en habitat. Die gegevens mogen niet worden samengevoegd tot een bewezen natuurlijke nachtelijke voedingspiek.
- De nieuwe snoek- en blankvoornbronnen vullen vooral winter-/habitatbeweging aan, niet een directe voedings- of hengelvangstrespons.
- De bestaande thermische bronlacunes blijven bestaan: geen vergelijkbare aerobe-scope-/metabolismebasis voor zeelt, meerval en roofblei; de huidige voorlopige thermische curveparameters zijn daarmee niet gevalideerd.

Deze update verandert geen factorstatus, score, gewicht of runtimeberekening. Volgende stap: de resterende bron-/claimtrace afronden, daarna de formele zevenpunts-crosswalk actualiseren. Fase 2 blijft open; Fase 3 blijft geblokkeerd.


## 100. Bibliografische audit van oudere profielreferenties (19 november 2026)

De statische referentiecontrole uit §78 is verdiept voor zeven oudere referenties die inhoudelijk relevant kunnen lijken voor de prognose. De bibliografische titels zijn gecontroleerd en waar nodig gecorrigeerd in `fishProfiles.ts`; zeven registraties zijn toegevoegd aan `researchRegistry.ts`. Alle blijven `approvedForPrediction: false`.

| Bron | Gecontroleerde inhoud | Correcte modelclassificatie |
|---|---|---|
| Lammens (1985), DOI 10.1007/BF00002913 | Filtervoeding bij brasem; relatie tussen visgrootte, prooigrootte en prooidichtheid | Foraging/prey selection; geen voedingsintensiteit of dagritme |
| Nagelkerke & Sibbing (1996) | Verwerkingsefficiëntie van driehoeksmosselen bij brasem, kolblei en blankvoorn; morfologie en handling time | Feeding physiology/foraging/prey selection; geen dagelijkse voedselopname of tijdvakritme |
| Casselman (1978) | Groei, overleving en activiteit van snoek; spontane zwemactiviteit bij gevoerde laboratoriumvissen | Groei en locomotorische laboratoriumactiviteit; geen veldvoedingsintensiteit |
| Goldspink (1979), DOI 10.1111/j.1095-8649.1979.tb03632.x | Mark-recapture, populatiedichtheid, groei en productie van blankvoorn in Tjeukemeer | Groei/populatieproductie; geen dagelijkse voedingsrespons |
| Neophitou (1993) | Groei, maturiteit en paaitijd van zeelt in Lake Pamvotida | Groei/reproductiecontext; geen dagdeelvoedingsmeting |
| Lappalainen et al. (2003), DOI 10.1034/j.1600-0633.2003.00005.x | Review van maturiteit, fecunditeit, paaiverplaatsing, paaigebied en eiontwikkeling bij snoekbaars | Reproductie-review; geen dagelijkse voedings- of activiteitsmeting |
| Copp et al. (2009), DOI 10.1111/j.1467-2979.2008.00321.x | Review van milieu-ecologie, habitat, dieet en dispersie van Europese meerval in inheems en geïntroduceerd verspreidingsgebied | Algemene ecologische review; geen nieuwe primaire dagdeelrespons |

### Betekenis voor de scoreketen

- De nieuwe bronnen verdiepen vooral voedingsmechanica/prooikeuze, groei en algemene ecologische context. Ze leveren geen nieuwe gevalideerde dagelijkse voedingsintensiteit of vangstkans.
- De Lammens- en Nagelkerke-studies mogen niet als directe aas-/voerrespons worden geïnterpreteerd; hun uitkomst is prooiverwerking of selectie.
- Casselman meet ook locomotorische activiteit, maar de relevante zwemactiviteit is laboratoriumcontext. Dit valideert geen veldactiviteitsscore of de bestaande thermische curve.
- Groei, maturiteit en reproductie zijn langzamere responsen. Zonder expliciete levensfase-invoer of betrouwbare populatiecontext mogen ze niet als dagelijkse factor worden gebruikt.
- De profielvermeldingen van Kestemont (1995) en Tartally (2000) zijn tijdens deze ronde niet onafhankelijk bibliografisch bevestigd. Ze blijven voorlopig als niet-geverifieerde achtergrondreferenties in het profiel en worden niet in de research registry gebruikt als modelbewijs. Ook algemene handboeken en aquacultuur-/larvalevensfasebronnen blijven achtergrondliteratuur.

De bijgewerkte registerdekking telt 83 unieke records. Eén nieuw record (Nagelkerke & Sibbing) is aan zowel brasem als blankvoorn gekoppeld; daarom kan de som van de soorttotalen één hoger zijn dan het aantal unieke records. Alle records blijven niet-goedgekeurd voor directe voorspelling. Geen score, gewicht, thermische curve of tijdvakbonus gewijzigd.

Fase 2 blijft open; Fase 3 blijft geblokkeerd.


## 101. Gerichte audit wind, luchtdruk, troebelheid, zuurstof, neerslag en stroming (19 november 2026)

Deze ronde vult de ontbrekende omgevingsfactoren uit §93 aan. Drie bronnen zijn aan het register toegevoegd; alle drie blijven `approvedForPrediction: false`.

### 101.1 Bevindingen per factor

| Factor | Nieuw/verwerkt bewijs | Gemeten respons | Modelstatus nu |
|---|---|---|---|
| Wind | Nakayama et al. (2018) bij 16 volwassen baarzen: windsnelheid verklaarde een kleiner deel van de beweging dan temperatuur/licht. Hansen et al. (2019) vond dat wind snelheid/richting troebelheid beïnvloedde in één ondiep meer. | Beweging bij baars; sedimentresuspensie/troebelheid bij brasem. Geen zelfstandige voedingsintensiteit. | Context/positionering; geen generieke activiteit- of voedingsbonus. |
| Luchtdruk | Nakayama et al. (2018) en de eerder geregistreerde Sandberg (2020) laten in specifieke baarspopulaties verbanden met beweging zien; effect is contextafhankelijk en kleiner dan temperatuur/licht in de 2018-studie. | Locomotorische activiteit/beweging, niet voedselopname. | Context; geen directe voedings- of universele drukregel. |
| Troebelheid/zicht | Hansen et al. (2019): 448 benthivore brasems in één ondiep meer, vier jaar; activiteit hing met troebelheid samen, vooral onder 15 °C. De review van Zanghi & Ioannou (2024) omvat 281 studies en vindt gemengde, soort-/predatorafhankelijke richtingen. | Brasemactiviteit als PIT-bewegingsproxy; brede review van predator-prooi-effecten. | Kandidaat context-/activiteitsfactor bij passende lokale meting; geen universele NTU-grens en geen automatische voedingsbonus. |
| Opgeloste zuurstof | Bernier et al. (2012): bij karper daalde voeropname 79% onder ernstige chronische hypoxie (10% O₂-verzadiging, circa 0,9 mg/L) in een gecontroleerde proef. | Directe voeropname/voedingsfysiologie bij kleine karpers in tanks. | Biologisch relevante kandidaatfactor voor karper, maar huidige app heeft geen betrouwbare lokale DO-invoer. Niet uit temperatuur, regen of luchtdruk afleiden; nu onbekend/context. |
| Neerslag | De gerichte zoekronde leverde geen voldoende directe, soortspecifieke meting op die neerslag zelfstandig koppelt aan dagelijkse voedselopname of activiteit van de negen app-soorten. | Geen geschikte directe respons voor deze scoreketen gevonden. | Context via weer-/waterontwikkeling; geen zelfstandige scorebijdrage. |
| Stroming/afvoer | Er is ecologisch bewijs voor relatie tussen afvoer, voedselbronnen en dieet bij andere stromingsgebonden soorten, maar in deze ronde geen voldoende overdraagbare directe bron voor de negen app-soorten en hun dagelijkse voedingsrespons. | Geen geschikte directe doelsoortrespons voor de huidige app-factor. | Alleen lokale habitat-/positioneringscontext wanneer actuele stromingsdata bestaan; geen universele scorebijdrage. |

### 101.2 Interpretatie en beperkingen

- De nieuwe baarstelemetrie toont dat wind en luchtdruk beweging kunnen verklaren, maar niet dat deze factoren voedselopname of vangbaarheid verhogen. De studie betrof 16 volwassen piscivore baarzen in één Duits meer; temperatuur en licht waren de sterkere verklarende factoren.
- De brasemstudie meet activiteit in een ondiep meer en de invloed op troebelheid. Wind beïnvloedde troebelheid mede via resuspensie; dit is geen bewijs dat wind direct meer voedselopname veroorzaakt.
- De karper-hypoxiestudie is direct bewijs dat ernstige zuurstofschaarste voedselopname kan onderdrukken. De proef gebruikte kleine karpers, circa 23 °C, tanks en zeer lage zuurstofverzadiging. Zij rechtvaardigt geen lineaire bonus/malus bij normale veldwaarden en geen Nederlandse zuurstofgrens.
- Zuurstof is een belangrijke ontbrekende invoer. Zolang betrouwbare lokale metingen ontbreken, blijft deze factor expliciet onbekend; geen schatting op basis van luchttemperatuur of andere weersfactoren.
- Neerslag en stroming blijven voorlopig context, omdat de gevonden bronnen niet direct genoeg zijn voor soortspecifieke dagelijkse scorebijdragen.

### 101.3 Bronregistraties

Toegevoegd aan `researchRegistry.ts`:
- Nakayama et al. (2018), DOI 10.1111/eff.12393 — baars, locomotorische activiteit/habitatgebruik; wind/druk kleinere effecten dan temperatuur/licht.
- Hansen et al. (2019), DOI 10.4081/jlimnol.2019.1883 — brasem, activiteit/troebelheid; geen directe voedselopnamemeting.
- Bernier et al. (2012), DOI 10.1242/jeb.066183 — karper, directe voeropname onder ernstige hypoxie; gecontroleerde laboratoriumcontext.

Alle 86 registry-records blijven `approvedForPrediction: false`. Geen score, factorgewicht, temperatuurcurve of tijdvakbonus gewijzigd.

Fase 2 blijft open; Fase 3 blijft geblokkeerd.


## 102. Geconsolideerde factor-, input- en evaluatiestatus — auditinventaris gesloten (19 november 2026)

Deze sectie brengt de code-/UI-/snapshottrace (§93), soortspecifieke gemeten responsen (§82), omgevingsbewijs (§101), tactische temperatuurregels (§96–§98) en de formele crosswalk (§89) samen. Dit sluit de inventaris van factoren die in de huidige prognose of aangrenzende tactiekengines voorkomen. Het betekent niet dat alle factoren meetbaar zijn, wetenschappelijk gevalideerd zijn of numeriek mogen bijdragen.

| Factor / element | Respons die het werkelijk beschrijft | Huidige invoer in app | Huidige rol | Eigen evaluatie die nodig is vóór numerieke bijdrage |
|---|---|---|---|---|
| Watertemperatuur / thermische curve | Voorlopige fysiologische thermische activiteitspotentie | Gebruikersmeting en/of modelinschatting met herkomst en onzekerheid | Enige numerieke bijdrage aan bestaande dagscore; optie A: voorlopige prior | Temperatuurinschatting: MAE/RMSE/bias. Thermische activiteit zelf: onafhankelijke soortspecifieke activiteitlabels; exacte curveparameters nog niet gevalideerd. |
| Luchttemperatuur | Weerinput voor thermische ontwikkeling, geen directe watertemperatuur | Uurlijkse weersverwachting | Alleen indirecte input in waterthermische schatting; nooit vervanging van ontbrekende watertemperatuur | Validatie van de waterthermische schatter; geen zelfstandige visrespons zonder direct bewijs. |
| Voedingsintensiteit / voedselopname | Hoeveelheid of snelheid van eten | Alleen literatuur-/sessiecontext; geen actuele lokale meting van natuurlijke voedselopname | Geen numerieke dagscorebijdrage; brongebonden context | Directe voedselopname-/voedingsintensiteitslabels per soort, seizoen en relevante voedsel-/watertypecontext. Vangst is geen zuivere voedselopnamemeting. |
| Voedingsritme / dielgedrag | Wanneer voedselopname/foerageren plaatsvindt | Datum, zon-/schemertijden en soortspecifieke broncontext; geen live voedingssensor | Alleen context; nog geen gevalideerde tijdvakscore | Direct tijdgebonden voedings-/foerageerrespons, met soort-/seizoen-/habitatdekking en onafhankelijke tijdvakvalidatie. Bewegingsritme alleen is onvoldoende. |
| Voedingsfysiologie / prooikeuze / dieet | Verwerkingsmechanica, prooitype of dieetcompositie | Alleen soortprofiel en broncontext | Geen directe dagelijkse voedselopname of aasrespons; tactische context waar relevant | Alleen gebruiken wanneer prooitype/voedsel en levensfase overeenkomen; geen automatische pellet-/haakaasbonus. |
| Licht / dagdeel / seizoen | Omgevingscontext en mogelijke biologische interactie | Zon-/schemertijden, datum/maand, bewolking en instraling uit weerbron | Context en mogelijke modulator; geen universele dagdeel-/seizoensbonus | Soortspecifieke interactie met directe voedings- of activiteitrespons; tijdvakvalidatie. |
| Wind / windrichting | Oever-, oppervlakte-, drift- en presentatiecontext; beperkt veldbewijs voor beweging bij baars | Uurlijkse windsnelheid/-richting; oeveroriëntatie optioneel | Bestaande positionering-/tactiekengines; geen algemene dagelijkse voedingsbonus | Directe soortspecifieke respons die beweging van voedselopname onderscheidt; lokale wind-/oevervalidatie. |
| Luchtdruk / druktrend | In enkele studies context voor locomotorische beweging | Uurlijkse weersdruk en trend | Beschrijvende context; geen zelfstandige scorebijdrage | Repliceerbare soortspecifieke respons, onafhankelijke validatie en aantoonbare extra voorspelwaarde boven temperatuur/licht. |
| Troebelheid / zicht | Zichtcondities en in specifieke context activiteit/predator-prooi-interactie | Geen betrouwbare actuele lokale NTU-/zichtmeting | Context; bream evidence uit één ondiep meer is niet universeel | Lokale meting plus soort-/zichtstrategiegebonden respons; onderscheid tussen beweging, foerageren en voedselopname. |
| Opgeloste zuurstof | Fysiologische stress, habitatkeuze en bij ernstige hypoxie voedselopname | Geen betrouwbare lokale zuurstofmeting | Onbekend; niet uit temperatuur/weer afleiden | Betrouwbare lokale DO-meting met tijd/diepte en soortrespons; geen extrapolatie van ernstige laboratoriumhypoxie naar normale waarden. |
| Neerslag | Indirecte verandering van peil, afvoer, troebelheid of habitattoegang | Uurlijkse neerslagverwachting | Weercontext; geen zelfstandige dagelijkse scorebijdrage | Alleen via werkelijk gemeten/verifieerbare lokale hydrologische verandering en passende soortrespons. |
| Stroming / afvoer | Verplaatsing, habitatgebruik en voedseltoegankelijkheid in stromend water | Watertype hooguit grof; geen lokale stroomsnelheid/afvoer | Kwalitatieve habitatcontext; geen numerieke bijdrage | Lokale stroomsnelheid/afvoer en soort-/responslabels; geen overdracht naar stilstaand water. |
| Habitat / structuur / diepte / stek | Potentiële geschiktheid en ruimtelijke zoekhypothese | GPS, door gebruiker ingevoerde stekken, diepte en structuren waar beschikbaar | Aparte habitat-/positioneringslaag; geen fysiologische activiteit of voedselopname | Onafhankelijke aanwezigheid-/habitatlabels, lokale kaart-/dieptedata en kalibratie; niet gelijkstellen aan vangbaarheid. |
| Lokale prooibeschikbaarheid | Aanwezigheid en toegankelijkheid van natuurlijk voedsel/prooi | Geen actuele lokale prooidichtheid | Onbekend; geen veronderstelde voedselbonus | Lokale prooidichtheid/-verdeling of betrouwbare proxy plus passende soort-/seizoensrespons. |
| Persoonlijke vangstkans | Empirische kans op vangst in vergelijkbare sessies | Historische sessies, vangsten, duur en geregistreerde context | Afzonderlijke Poisson-baseline; Brier/BSS evalueert uitsluitend deze uitkomst | Chronologische Brier/BSS en kalibratie op voldoende vergelijkbare echte sessies; niet vermengen met biologische score. |
| Hengelvangbaarheid / techniek / aas | Respons op presentatie, aas, visserijdruk, visgrootte en ervaring | Sessie-/techniekgegevens en beperkte literatuurdekking | Afzonderlijke vangbaarheidscontext; geen directe biologische activiteitsscore | Eigen vangbaarheids-/catch-rate-uitkomst per techniek, aas, soort en context; geen overdracht tussen vismethoden. |
| Betrouwbaarheid / onzekerheid / datadekking | Kwaliteit en volledigheid van de voorspelling | Provenance, bronstatus, inputdekking, modelversie en steekproefomvang | Kwaliteits-/onzekerheidslaag, geen biologische scorefactor | Kalibratie van onzekerheidsbanden en dekking; geen optelling als extra biologische bonus. |
| Voorvoer-suitability / grammen | Praktische voer-/tactiekindicatie, geen dagelijkse visactiviteit | Temperatuur, stekcontext, soortprofiel en sessieduur waar bekend | Aparte VisCoach-/tactiekengine; niet opnemen in dagscore | Aparte evidence-/uitkomstvalidatie van hoeveelheid en respons; exacte grammen blijven open besluit en moeten bij lage inputkwaliteit worden afgeschermd. |

### 102.1 Wat nu aantoonbaar compleet is

- Alle bestaande prognosefactoren en aangrenzende tactiek-/habitatlagen zijn terug te vinden in de code-/UI-/snapshottrace.
- Per soort zijn de geregistreerde gemeten responsen uitgesplitst; de registry bevat 86 unieke records en alle blijven niet-goedgekeurd voor directe numerieke voorspelling.
- Voor iedere factor is nu expliciet vastgelegd of de app een actuele invoer heeft, welke respons het bewijs werkelijk meet, wat de huidige rol is en welke onafhankelijke evaluatie nog nodig is.
- Ontbrekende zuurstof-, stromings-, troebelheids- en prooigegevens zijn expliciet als onbekend vastgelegd. Zij worden niet uit weersvariabelen afgeleid.
- Beweging, habitat, voeding, prooikeuze, groei, vangbaarheid, persoonlijke vangstkans en onzekerheid blijven gescheiden responsen.

### 102.2 Wat bewust nog niet is besloten

1. **Doelrespons van de bestaande 1–10-score:** de gebruikersweergave blijft één score. De wetenschappelijk zuivere kandidaat is een geïntegreerde biologische activiteit-/voedingspotentie: thermische activiteit plus alleen die voedings-/foerageerfactoren die dezelfde dagelijkse respons onderbouwen. Habitat/aanwezigheid, persoonlijke vangstkans en betrouwbaarheid meten andere uitkomsten en blijven afzonderlijk, tenzij een expliciet ander productdoel wordt gekozen.
2. **Normalisatie en aggregatie:** verschillende responsen mogen niet op basis van hun ruwe waarden worden opgeteld. Eerst moeten schaal, richting, interacties en dubbele telling worden gedefinieerd.
3. **Ontbrekende gegevens:** geen fictieve neutrale factorwaarde en geen automatische hernormalisatie die een ontbrekende ongunstige factor onzichtbaar maakt. De keuze tussen expliciete coverage-/onzekerheidsbehandeling, onderbouwde schatting of N/B moet in het kandidaatmodel worden getest.
4. **Gewichten:** geen vaste universele percentages. Gewichten moeten per respons, soort en waar bewijs dit toelaat seizoen-/watertypecontext, uit directe evidence en chronologische validatie volgen.
5. **Tijdvakscore:** ieder tijdvak krijgt uiteindelijk dezelfde factorarchitectuur met tijdvakgebonden invoer en soortspecifiek voedingsbewijs. De huidige gedeelde dagthermische waarde is geen tijdvakrespons.
6. **Evaluatie:** Brier blijft voor persoonlijke vangstkans; temperatuurfoutmaten voor de watertemperatuurschatter; activiteit, voeding, habitat en tijdvak krijgen eigen labels en metrics.

### 102.3 Auditstatus en vervolg

**De factorinventaris en huidige input-/evidence-status zijn voor de bestaande prognoseketen gesloten. De modelaudit is daarmee nog niet formeel afgerond.** De resterende fase-2-werkzaamheden zijn de doelrespons van de bestaande score expliciet vastleggen, normalisatie en ontbrekende-data-regels ontwerpen, per respons onafhankelijke validatie definiëren en het kandidaatmodel chronologisch vergelijken met de bestaande thermische baseline.

De huidige dagscore blijft ongewijzigd en thermisch bepaald totdat deze ontwerp- en validatiepoorten zijn doorlopen. Geen nieuwe factor, gewicht, tijdvakbonus of tweede score activeren. Fase 2 blijft open; Fase 3 blijft geblokkeerd.


## 103. Vastgesteld productdoel voor de bestaande 1–10-dagscore (19 november 2026)

**Gebruikersbesluit:** de bestaande cijferschaal en scoreweergave blijven behouden. De gebruiker moet met één eenvoudig cijfer snel kunnen zien of een dag naar verwachting gunstig of ongunstig is, met een begrijpelijke onderbouwing. Er komen geen nieuwe verplichte handelingen, geen tweede prognosescore en geen technische deelscores in de standaardweergave.

### 103.1 Wat de score betekent

De bestaande 1–10-dagscore staat voor de **verwachte biologische activiteit- en voedings-/foerageerpotentie van de geselecteerde doelsoort op die dag**. Het gaat om de biologische omstandigheden die activiteit en voedselzoek-/voedingsgedrag kunnen ondersteunen of beperken. Het cijfer is geen rechtstreekse kans op beet of vangst en belooft geen vangst.

De score wordt uiteindelijk opgebouwd uit relevante, voldoende onderbouwde factoren die dezezelfde doelrespons verklaren. De thermische respons blijft de reeds gekozen voorlopige mechanistische basis. Andere factoren kunnen pas een numerieke bijdrage krijgen wanneer hun gemeten respons aansluit op activiteit of voedings-/foerageerpotentie, de invoer voldoende betrouwbaar/beschikbaar is en de bijdrage onafhankelijk is gevalideerd.

### 103.2 Wat de score nadrukkelijk niet betekent

- Geen persoonlijke vangstkans of voorspeld aantal vissen.
- Geen kans dat de vis op de geselecteerde stek aanwezig is; habitat en lokale aanwezigheid blijven een aparte ruimtelijke laag.
- Geen maat voor hengelvangbaarheid, aas-/techniekgeschiktheid of het succes van een bepaalde presentatie.
- Geen maat voor datakwaliteit of zekerheid. Onzekerheid en dekking worden apart en begrijpelijk toegelicht.
- Geen bewijs dat iedere factor voor iedere soort meetbaar of voorspellend is.

### 103.3 Gebruikersweergave

1. Behoud de bestaande numerieke 1–10-schaal, bestaande plaatsing en vertrouwde scoreweergave. De schaal wordt niet vervangen door labels, percentages, sterren, letters of een nieuwe index.
2. Toon één totaalcijfer voor de dag. Geen nieuwe zichtbare deelscores of extra scorekaarten in de standaardweergave.
3. Geef een korte, begrijpelijke onderbouwing van de belangrijkste positieve en negatieve invloeden, bijvoorbeeld temperatuur, relevante soortspecifieke voedings-/dagritme-informatie en weers-/watercontext wanneer deze aantoonbaar bijdragen.
4. Maak duidelijk wanneer een factor ontbreekt, onzeker is of slechts context biedt. Presenteer geen ontbrekende informatie als neutraal of als een bewezen positieve/negatieve invloed.
5. Houd technische details, bronbeperkingen en volledige factorbijdragen beschikbaar in de bestaande verdiepende uitleg; belast de standaardgebruiker er niet mee.
6. De bestaande tijdvakweergave en cijfers blijven vertrouwd. Tijdvakvoorkeuren moeten uiteindelijk met dezelfde doelrespons en passende tijdvakgebonden factoren worden onderbouwd; er wordt geen tweede concurrerende dagscore geïntroduceerd.

### 103.4 Interne modelregels

- Normaliseer elke kandidaatfactor naar een expliciete, vergelijkbare richting/schaal voor dezelfde doelrespons; tel geen ruwe of semantisch verschillende grootheden op.
- Leg per soort vast welke factoren biologisch relevant zijn en welke respons het bewijs meet. Een factor kan voor de ene soort actief zijn en voor een andere uitsluitend context of onbekend.
- Vermijd dubbele telling van gecorreleerde of causaal overlappende factoren (bijvoorbeeld weerinput die al in de watertemperatuurschatting zit én nogmaals als zelfstandige bonus wordt toegevoegd).
- Behandel interacties alleen wanneer er een onderbouwde hypothese en voldoende data zijn; geen generieke multiplicatieve bonussen.
- Bewaar de thermische optie A als voorlopige prior en vergelijk ieder kandidaatmodel chronologisch met de bestaande thermische baseline.
- Houd de dagscore en de persoonlijke vangstkans gescheiden. Brier/BSS blijft de persoonlijke vangstkans evalueren; het is geen scoregewicht of biologische correctiefactor.

### 103.5 Ontwerpvolgorde vóór implementatie

1. Leg per factor de soortspecifieke doelrespons, bewijssterkte, invoerprovenance, tijdsresolutie, datadekking, onzekerheid en eventuele overlap vast.
2. Definieer een robuuste gemeenschappelijke schaal en de vertaling naar de bestaande 1–10-weergave, met stabiele interpretatie van cijfers tussen modelversies.
3. Ontwerp ontbrekende-data- en coverage-regels. Geen stilzwijgende nul, fictieve neutrale waarde of onzichtbare herweging; bepaal wanneer een score verantwoord kan worden berekend en wanneer een waarschuwing of N/B nodig is.
4. Ontwerp gewichten en interacties op basis van directe soortrelevante evidence en chronologische backtests; geen universele percentages of handmatig gekozen bonuspunten.
5. Definieer aparte labels/metrics voor biologische activiteit, voedingsrespons en tijdvakvoorkeur. Valideer daarnaast dat de samengestelde 1–10-score informatief en stabiel is.
6. Vergelijk kandidaatmodellen op ongeziene chronologische data met de huidige thermische baseline, inclusief soort-, seizoen-, water-/stek- en datadekkingssegmenten. Rapporteer ook regressies en onzekerheid.
7. Pas pas na formele Fase-2-acceptatie de runtimeberekening aan; behoud UI en bestaande invoerflow.

**Status:** het productdoel en de gebruikersweergave zijn nu vastgesteld. De numerieke normalisatie, ontbrekende-data-regels, gewichten, interacties en validatie-uitkomsten zijn nog niet vastgesteld. De huidige runtime blijft ongewijzigd; Fase 2 blijft open en Fase 3 geblokkeerd.


## 104. Minimaal vangstregistratiecontract en leerwaarde voor prognose/VisCoach (19 november 2026)

**Gebruikersbesluit:** een vangst registreren mag geen administratieve taak worden. De primaire handeling blijft één eenvoudige actie: **'Vis gevangen'**. Daarna kiest de gebruiker de vissoort. De vangsttijd wordt automatisch vastgelegd op het moment dat het vangstformulier wordt geopend/geregistreerd en blijft aanpasbaar. Een vooraf ingestelde hengel/methode mag optioneel worden gekozen; gewicht is optioneel. Geen andere velden zijn voor deze registratie verplicht.

### 104.1 Minimale gebruikersflow

1. Gebruiker kiest 'Vis gevangen'.
2. Gebruiker selecteert de vissoort (verplicht).
3. Tijdstip wordt automatisch voorgesteld en is aanpasbaar.
4. Een vooraf ingestelde hengel-/methodeconfiguratie kan optioneel worden geselecteerd.
5. Gewicht kan optioneel worden toegevoegd.
6. Opslaan moet zonder verdere vragen kunnen.

Geen verplichte invoer van aas, voer, presentatie, montage, diepte, weersobservaties of materiaalgegevens. Deze informatie mag niet stilzwijgend worden afgeleid of verplicht worden gemaakt. Als de app al een sessiecontext of hengelvoorkeur kent, mag die alleen als niet-bindende standaard worden aangeboden; de gebruiker moet de vangst zonder die keuze kunnen opslaan.

### 104.2 Gegevensmodel en interpretatie

- Iedere vangst is een afzonderlijke gebeurtenis die aan de sessie is gekoppeld. Daardoor kunnen tijdstip, soort, optioneel hengelprofiel/methode en optioneel gewicht per vangst verschillen.
- Een hengelprofiel is een verwijzing naar een vooraf ingestelde configuratie, geen nieuwe uitgebreide materiaalenquête. Het moet optioneel blijven en mag niet worden verward met een bewezen aas-/voer- of presentatie-effect.
- Ontbrekende optionele gegevens blijven null/onbekend; geen standaardgewicht, standaardmethode of fictieve voerkeuze invullen.
- Bestaande vangstregistraties en historische sessies blijven compatibel; geen migratie die oude records kunstmatig aanvult.
- Geen extra registratie van 'geen beet' of 'geen vis' afdwingen. Een sessie zonder vangst is een waargenomen sessie-uitkomst, niet het bewijs dat vissen niet actief waren of niet aten.

### 104.3 Gebruik voor prognose en VisCoach

De eenvoudige vangstgebeurtenissen leveren waardevolle, maar begrensde informatie:
- Soort + tijdstip + sessiecontext kunnen helpen patronen in vangsttijdstippen en succesvolle tijdvakken te analyseren.
- Optioneel hengelprofiel/methode kan later tactiek- en vangbaarheidsanalyses ondersteunen, mits voldoende vergelijkbare sessies bestaan.
- Optioneel gewicht kan vangstgrootte-/populatiecontext ondersteunen, maar is geen directe maat voor dagelijkse voedingsactiviteit.
- De VisCoach mag geregistreerde vangsten gebruiken om praktische adviezen te contextualiseren; hij mag niet concluderen dat een methode of hengel de oorzaak was op basis van één vangst.

Een vangst is geen zuivere meting van biologische voedselopname: stekkeuze, aanwezigheid, hengelvangbaarheid, aas/presentatie, visserijdruk en inspanning beïnvloeden of activiteit in een vangst wordt omgezet. Daarom blijven vangstuitkomsten gescheiden van directe labels voor voedingsactiviteit. Als aanbeten/voedselopname niet expliciet zijn geregistreerd, mogen die niet uit een vangst of nulvangst worden verzonnen.

### 104.4 Ontwerpgrenzen

- Minimaliseer invoerfrictie boven volledigheid van data; alleen vissoort is verplicht binnen de vangstregistratie.
- Geen uitbreiding van de standaardvangstflow met voer-, aas- of presentatievelden.
- Geen nieuwe prognosescore of extra gebruikersvragen.
- Gebruik optionele data alleen voor de responslaag die ze daadwerkelijk kunnen onderbouwen.
- Eventuele latere uitbreiding vereist aantoonbare gebruikerswaarde en mag de snelle basisregistratie niet blokkeren.

**Status:** dit is het vastgestelde product-/registratiecontract voor verdere audit en ontwerp. Het schrijft geen runtimewijziging voor. Bestaande registratiefunctionaliteit moet eerst tegen dit contract worden gecontroleerd; alleen aantoonbare afwijkingen zijn aanleiding voor latere implementatie. Fase 2 blijft open; Fase 3 blijft geblokkeerd.



## 105. Factor-naar-doelresponsmatrix en kandidaatprioriteit (19 november 2026)

Deze stap vertaalt de vastgestelde productdoelrespons uit §103 en de gesloten inventaris uit §102 naar een eerste kandidaatmodelstructuur. Dit is een ontwerp-/auditmatrix, geen numerieke gewichtsverdeling en geen runtime-activatie. De matrix beantwoordt per factor: welk gedrag kan deze factor werkelijk verklaren, hoe dicht ligt dat bij de gewenste dagelijkse activiteit-/voedingspotentie, en wat is nodig voordat hij de bestaande 1–10-score mag beïnvloeden?

### 105.1 Ontwerpprincipe: voorspel de beste verwachting met de gegevens die er wél zijn

De prognose is een informatiebron en adviesinstrument, geen glazen bol. Onvolledige gegevens mogen een bruikbare prognose niet automatisch blokkeren. Het model moet de beste verdedigbare verwachting maken uit de beschikbare informatie, terwijl het expliciet laat zien welke relevante factoren ontbreken of onzeker zijn. Onbekend is niet hetzelfde als neutraal, maar onbekend betekent evenmin dat de hele prognose onbruikbaar is.

Daarom worden drie zaken afzonderlijk behandeld:
- **Verwachte biologische respons:** wat zeggen de beschikbare factoren over activiteit en voedsel-/foerageerpotentie?
- **Datadekking en onzekerheid:** welke relevante factoren zijn gemeten, geschat, contextueel of onbekend?
- **Praktische vangst-/tactiekvertaling:** wat kan de VisCoach met soort, stek, tijdvak, sessiecontext en optionele hengel/methode adviseren?

De gebruiker blijft één bestaande 1–10-dagscore zien. De interne berekening mag meerdere lagen en soortspecifieke bijdragen bevatten; er komen geen zichtbare deelscores of tweede prognose.

### 105.2 Kandidaatprioriteit van zwaar naar licht

De onderstaande volgorde is een **biologische ontwerpprioriteit**, geen vaste universele rangschikking. De daadwerkelijke invloed kan per soort, seizoen, levensfase, watertype en lokale omstandigheden verschillen.

| Kandidaatprioriteit | Factorfamilie | Respons die in de score mag worden onderbouwd | Voorlopige modelrol | Waarom deze positie |
|---|---|---|---|---|
| 1 — fundament | Watertemperatuur en thermische historie | Thermische activiteitspotentie; indirecte randvoorwaarde voor voedselopname | Bestaande voorlopige thermische prior blijft actief | Dit is de enige bestaande numerieke factor en heeft een expliciete soortcurve. Parameters blijven ongevalideerd; thermiek is geen directe voeropname. |
| 2 — directe doelrespons | Voedingsintensiteit, voedselopname en foerageeractiviteit | Hoe actief de soort voedsel zoekt/eet en de aangeboden voedselbron kan benutten | Hoogste kandidaat voor aanvullende biologische scorebijdrage, uitsluitend bij directe passende soortrespons | Sluit het meest direct aan op het gewenste visgedrag. Registrydekking verschilt sterk per soort en meetcontext (§82). |
| 3 — biologische modulators | Seizoen, levenscyclus, acclimatisatie en fysiologische toestand | Verandering van activiteit/voedselbehoefte en thermische/voedingsrespons | Soortspecifieke modifier of interactie; geen generieke seizoensbonus | Kan thermiek en voedselbehoefte veranderen, maar bronrespons en levensfase moeten overeenkomen. |
| 4 — tijdvakmodulators | Licht, fotoperiode, schemering en diel-/voedingsritme | Wanneer activiteit/foerageren binnen de dag waarschijnlijker is | Primair kandidaat voor tijdvakverdeling; dagscore alleen als aantoonbare dagbrede invloed | Kan helpen het beste tijdvak te onderscheiden. Geen universele schemer- of nachtbonus; roofblei heeft momenteel geen directe voedingsritme-/intensiteitsdekking. |
| 5 — watercondities | Opgeloste zuurstof, troebelheid/zicht, stroming en menging | Fysiologische beperking, zicht-/predator-prooireactie, lokale voedseltoegang of habitatbeweging | Soort- en contextgebonden modifier; nu vaak onbekend of context | Potentieel belangrijk, maar actuele lokale meetdekking is beperkt. Ernstige hypoxie bij karper is geen bewijs voor een normale veldgradiënt. |
| 6 — meteorologische context | Wind, windrichting, luchtdruk, bewolking en neerslag | Indirecte verandering in waterbeweging, licht, zicht, habitat of beweging | Eerst bestaande positionerings-/habitatcontext; alleen directe onafhankelijke voedingsrespons kan scorebijdrage rechtvaardigen | Wind/drukbewijs betreft onder meer beweging; neerslag heeft geen geschikte directe doelsoortrespons. Dubbele telling met thermische schatting voorkomen. |
| 7 — lokale voedsel-/habitatcontext | Natuurlijk prooiaanbod, diepte, bodem, vegetatie, structuur en stek | Voedseltoegankelijkheid en lokale aanwezigheid/zoekgebied | Afzonderlijke habitat-/tactieklaag; alleen een aantoonbare directe voedingsrespons kan in de dagscore | Belangrijk voor waar vissen zich bevinden en wat ze kunnen eten, maar niet gelijk aan algemene activiteit of voedselopname. |
| Buiten dagscore | Hengelvangbaarheid, methode, aas/presentatie, persoonlijke vangsthistorie | Kans dat biologische activiteit in een beet/vangst wordt omgezet | VisCoach-/vangbaarheidslaag, niet de biologische 1–10-score | Dit helpt de tactiek en persoonlijke verwachting, maar zou de biologische dagscore vermengen met techniek en inspanning. |
| Buiten dagscore | Datakwaliteit, dekking en onzekerheid | Vertrouwen in de onderbouwing | Aparte onzekerheids-/kwaliteitslaag | Onzekerheid is geen biologische factor en mag de dagscore niet als bonus of straf beïnvloeden. |

### 105.3 Soortspecifieke responsdekking bepaalt toelating

De bronregistratie telt records, geen effectgroottes of kwaliteitsgewichten. Alle 86 records blijven niet-goedgekeurd voor directe numerieke voorspelling. De volgende verschillen bepalen de auditvolgorde:

- **Karper:** relatief brede registratie van voedingsintensiteit, voedingsritme en foerageerrespons; gecontroleerde voeropname, bait-stationbezoek en veldgedrag blijven verschillende meetcontexten. Hypoxiebron toont directe voeropnamevermindering bij ernstige experimentele hypoxie, maar er is geen actuele lokale zuurstofinvoer.
- **Brasem:** voedingsintensiteit en ritme zijn geregistreerd; troebelheidsbewijs meet activiteit via PIT-beweging in één ondiep meer en is geen directe voeropname. Voedingsmechanica/prooikeuze is geen dagelijkse voedselopname.
- **Snoek:** voedingsintensiteit is aanwezig, maar dieet-/bewegingsgegevens mogen niet als directe voedselopname worden behandeld. Dag-/nachtvoorkeur vereist passende directe tijdvakrespons.
- **Baars:** voedingsintensiteit/ritme en beweging zijn vertegenwoordigd; wind-/druktelemetrie betreft vooral beweging, niet voedselopname. Aerobe-scopegegevens zijn geen directe dagelijkse voedingslabels.
- **Blankvoorn:** voedingsintensiteit en ritme zijn relatief goed vertegenwoordigd; mechanica, dieet en beweging blijven onderscheiden van voedselopname.
- **Zeelt:** kleinere bronbasis; voedingsintensiteit/ritme aanwezig, maar groei-/reproductiegegevens zijn geen dagelijkse voedingsrespons. Metabole registratie ontbreekt.
- **Snoekbaars:** voedingsintensiteit is geregistreerd; directe voedingsritmedekking is beperkt. Beweging, dieet en aerobe scope mogen niet zonder overdraagbaarheidsargument als voedselopname worden gebruikt.
- **Meerval:** voedingsintensiteit/ritme aanwezig, maar veldtelemetrie en gecontroleerde voeropstellingen hebben verschillende responsen. Metabole data ontbreken.
- **Roofblei:** geen directe voedingsintensiteit, voedingsritme of foerageergedrag geregistreerd; de ene voedingsincidentie betreft seizoensgebonden maaginhoud/vacuïteit. Geen numerieke voedings- of tijdvakbonus op basis van die bron alleen.

Deze dekking betekent niet dat een soort zonder directe bron geen prognose kan krijgen. De bestaande thermische prior en overige verdedigbare gegevens kunnen een voorlopige verwachting ondersteunen; de ontbrekende responsdekking verlaagt de zekerheid en beperkt welke aanvullende factoren numeriek mogen bijdragen.

### 105.4 Dagscore versus tijdvakadvies

- De **dagscore** blijft één 1–10-uitkomst voor de geselecteerde doelsoort en vat de verwachte biologische activiteit-/voedingspotentie van de dag samen.
- De **tijdvakrangschikking** gebruikt dezelfde doelrespons, maar moet waar mogelijk tijdvakgebonden temperatuurontwikkeling, licht/dagritme, soortspecifieke voedingsrespons en beschikbare stek-/watercontext onderscheiden.
- Een factor die alleen een tijdstip beïnvloedt, krijgt niet automatisch een dagbrede bonus. Een dagbrede factor wordt niet viermaal als onafhankelijke tijdvakbijdrage geteld.
- De huidige gedeelde thermische waarde voor vier tijdvakken is alleen de baseline; zij kan geen gevalideerde beste vistijd bepalen.
- Als de beschikbare informatie geen betekenisvol verschil tussen tijdvakken onderbouwt, mag de VisCoach dat zeggen in plaats van een kunstmatige winnaar te kiezen.
- Het tijdvakadvies blijft praktisch: de gebruiker moet kunnen kiezen om op een gunstiger tijdstip of andere dag te vissen. Het is een relatieve verwachting, geen garantie.

### 105.5 Hoe factoren uiteindelijk gewicht krijgen

Er worden nu geen percentages of vaste punten toegekend. Voor iedere kandidaatfactor moeten eerst de volgende kenmerken zijn ingevuld:

1. Doelsoort(en), relevante levensfase/seizoen/watertype en geografische overdraagbaarheid.
2. Direct gemeten respons en of die activiteit, voedselopname, ritme, beweging, habitat, vangbaarheid of een andere uitkomst is.
3. Richting en vorm van de relatie: gunstig, ongunstig, optimum, drempel, niet-lineair of contextafhankelijk.
4. Bronkwaliteit, onafhankelijke replicatie en onzekerheid.
5. Beschikbare app-invoer, bron/provenance, tijdresolutie en ruimtelijke toepasbaarheid.
6. Overlap/correlatie met reeds opgenomen factoren en mogelijke dubbele telling.
7. Welke onafhankelijke sessie-/veldlabels en evaluatiemaatstaf de voorspelde respons kunnen toetsen.
8. Of de factor voorlopig numeriek kandidaat, uitsluitend context, onbekend of uitgesloten blijft.

De thermische prior blijft voorlopig de enige bestaande numerieke bijdrage. Een kandidaatfactor krijgt pas een runtimegewicht na passende evidence, invoerkwaliteit, vooraf vastgelegde evaluatie en chronologische verbetering ten opzichte van de thermische baseline. Geen automatische gewichtstuning op basis van vangstdata of Brier.

### 105.6 Sessiegegevens als leerbron zonder administratieve last

De minimale vangstflow uit §104 blijft leidend. Soort, tijdstip en sessiecontext leveren basisinformatie; vooraf ingestelde hengel/methode en gewicht zijn optioneel. Ook een sessie zonder vangst is een uitkomst in de context van duur, doelsoort, tijdvak en omstandigheden. Deze gegevens kunnen over meerdere sessies patronen tonen, maar mogen niet als directe meting van voedselopname worden bestempeld. De prognose mag met onvolledige sessiedata blijven werken; lokale kalibratieclaims wachten op voldoende vergelijkbare waarnemingen.

### 105.7 Actuele Fase-2-status en eerstvolgende stap

Het productdoel van de bestaande 1–10-score is vastgesteld in §103; de vangstregistratiegrenzen in §104. Daarmee is de eerdere blocker in §89 om de doelrespons nog te definiëren achterhaald. §89 blijft een historische crosswalk; deze sectie actualiseert de resterende ontwerpstappen.

**Nu afgerond:** factorinventaris, huidige input-/responsstatus, productdoel, minimale vangstregistratie en eerste kandidaatprioriteit per responsfamilie.

**Nog open:** (a) factorrespons-normalisatie en kalibratie naar de bestaande 1–10-schaal; (b) expliciete behandeling van ontbrekende/geschatte invoer zonder de prognose onnodig te blokkeren of onbekend als neutraal te presenteren; (c) interacties/dubbele telling; (d) labels en metrics voor activiteit, voeding, habitat en tijdvak; (e) chronologische vergelijking met de thermische baseline, inclusief segmentatie per soort en relevante context.

De eerstvolgende auditstap is de normalisatie- en coverage-/onzekerheidsarchitectuur ontwerpen, inclusief concrete voorbeelden van voldoende, gedeeltelijke en onvoldoende invoer. Geen runtimegewichten of tijdvakbonussen activeren. Fase 2 blijft open; Fase 3 geblokkeerd.


## 106. Normalisatie, coverage en onzekerheidsarchitectuur (19 november 2026)

**Status:** ontwerpvoorstel voor review; geen numerieke normalisatie, gewichten of runtimegedrag geactiveerd. Deze sectie werkt de eerstvolgende stap uit §105.7 uit.

### 106.1 Wat normalisatie moet oplossen

De factoren hebben verschillende eenheden en betekenis: graden watertemperatuur, uren licht, zuurstofconcentratie, voedingsintensiteit, wind en seizoensfase zijn niet rechtstreeks optelbaar. Elke factor moet daarom eerst worden vertaald naar een respons die bij dezelfde doelsoort en dezelfde doelrespons hoort.

De normalisatie moet aan vijf voorwaarden voldoen:

1. Een factoruitkomst beschrijft een biologisch relevante respons, niet alleen de grootte van de ruwe invoer.
2. De richting en vorm zijn soortspecifiek en mogen optimum-, drempel-, verzadigings- of monotone relaties volgen.
3. Een genormaliseerde waarde is een relatieve responsindex binnen een gedefinieerd referentiedomein; **geen kanspercentage, vangstkans of universele biologische eenheid**.
4. De bron, context, geldigheid en onzekerheid blijven aan de factoruitkomst gekoppeld.
5. Dezelfde referentie en modelversie leveren dezelfde interpretatie op. Geen dagelijkse min-max-normalisatie of rangschikking die de score laat verschuiven doordat andere dagen veranderen.

### 106.2 Voorgestelde normalisatiestroom per factor

Voor iedere toegelaten factor wordt de volgende keten vastgelegd:

1. **Invoer valideren:** eenheid, bereik, tijdstip, ruimtelijke dekking, meetmethode en bronstatus controleren. Een verouderde, ongeldige of niet-representatieve waarde wordt niet als actuele meting gebruikt.
2. **Context selecteren:** doelsoort en waar onderbouwd seizoen, levensfase, watertype, geografische overdraagbaarheid en tijdvak bepalen. Ontbrekende context wordt niet verzonnen.
3. **Responsfunctie kiezen:** op basis van het gemeten biologische eindpunt vaststellen of de relatie optimaal, monotone, drempel-, verzadigings- of interactiegedreven is. De vorm moet uit passend bewijs volgen; niet uit het gewenste scorebeeld.
4. **Naar gemeenschappelijke responsindex vertalen:** de ruwe invoer omzetten naar een begrensde relatieve responsindex (conceptueel 0–1). De index beschrijft alleen de gekozen respons, bijvoorbeeld thermische geschiktheid of directe voedingsintensiteit. Verschillende responsen worden niet samengevoegd voordat duidelijk is dat zij hetzelfde uiteindelijke doel ondersteunen.
5. **Referentie en afwijking bewaren:** naast de responsindex wordt de referentieconditie en de afwijking daarvan bewaard. Zo kan een factor later als bijdrage ten opzichte van een vastgelegde basis worden onderzocht, zonder te doen alsof een ontbrekende factor een gemeten nul- of neutraal effect had.
6. **Onzekerheid en toelatingsstatus toevoegen:** meet-/schattingsstatus, bewijssterkte, toepassingsgebied, onzekerheidsmarge en modelversie blijven afzonderlijke metadata.

De thermische optie A blijft de bestaande voorlopige responsfunctie. De huidige formule en 1–10-uitvoer blijven de baseline; deze stap verandert ze niet. Een thermische efficiëntiewaarde mag niet worden hernoemd tot directe voedselopname.

### 106.3 Van responsindex naar de bestaande 1–10-score

De bestaande score blijft één dagscore voor de verwachte biologische activiteit-/voedingspotentie. De 1–10-schaal is een begrijpelijke relatieve index en wordt niet als percentage of persoonlijke vangstkans gepresenteerd.

De uiteindelijke vertaling moet aan de volgende regels voldoen:

- De scoremapping wordt gekalibreerd op vooraf gedefinieerde biologische referentie-ankers en onafhankelijke evaluatiedata; niet op de hoogste en laagste prognose van de betreffende week.
- Scorewaarden moeten tussen dagen, soorten en modelversies zo stabiel mogelijk interpreteerbaar blijven. Als een nieuwe modelversie de betekenis aantoonbaar verandert, wordt dat als modelversiewijziging gedocumenteerd en historisch reproduceerbaar gehouden.
- Een kandidaatmodel wordt altijd naast de ongewijzigde thermische baseline geëvalueerd. Het moet aantoonbaar extra voorspellende waarde toevoegen; een mooiere verdeling of grotere spreiding is geen bewijs van verbetering.
- De bestaande thermische formule mag niet stilzwijgend worden herschaald om nieuwe factoren passend te maken. Eerst wordt de kalibratie onderzocht; eventuele wijziging vraagt een aparte onderbouwde beslissing.
- Er worden nu geen gewichten, drempels, scoreankers of numerieke bijdragepercentages gekozen. Daarvoor ontbreken nog voldoende goedgekeurde responsbronnen en onafhankelijke labels.

Een 0–1-responsindex is dus een intern normalisatiehulpmiddel, niet een tweede gebruikersscore. De gebruiker blijft de vertrouwde bestaande 1–10-dagscore zien.

### 106.4 Invoerstatussen: gemeten, geschat, contextueel en onbekend

Elke kandidaatfactor krijgt per prognose één expliciete status:

| Status | Betekenis | Numerieke behandeling |
|---|---|---|
| Gemeten en geldig | Actuele, representatieve waarneming met bekende herkomst en eenheid | Mag een responsfunctie voeden als de factor en respons zijn toegelaten |
| Geschat en geldig | Modelschatting met bekende methode, tijdsdekking en onzekerheid | Mag alleen bijdragen binnen het gevalideerde toepassingsgebied; onzekerheid blijft groter/explicieter |
| Proxy of context | Verwante variabele die de doelrespons niet rechtstreeks meet | Uitsluitend context totdat overdraagbaarheid en onafhankelijke respons zijn aangetoond |
| Onbekend/ontbrekend | Geen bruikbare invoer of geen passende bron | Geen factorbijdrage afleiden; expliciet als onbekend registreren |
| Ongeldig/verouderd | Buiten bereik, te oud, verkeerde locatie/resolutie of niet representatief | Niet gebruiken als actuele respons; oorzaak registreren |
| Tegenstrijdig | Geldige bronnen spreken elkaar wezenlijk tegen | Niet willekeurig middelen; bronkwaliteit en onzekerheid beoordelen en zo nodig factor buiten de numerieke bijdrage houden |
| Niet van toepassing | Factor heeft voor deze soort/context geen onderbouwde rol | Niet als ontbrekende verplichte factor behandelen; rol expliciet vastleggen |

Een proxy wordt niet stilzwijgend een meting. Luchttemperatuur wordt bijvoorbeeld geen vervanging voor watertemperatuur; wind of weer wordt geen zuurstofmeting; beweging wordt geen voedingsintensiteit.

### 106.5 Coverage: wanneer blijft een prognose bruikbaar?

Coverage beschrijft intern welke relevante onderbouwing voor de gekozen soort en doelrespons werkelijk beschikbaar is. Het is geen biologische bonus/malus en wordt niet als tweede cijfer aan de gebruiker getoond.

De volgende beslisstructuur is het ontwerpvoorstel:

- **Voldoende onderbouwd:** de belangrijkste responsdragende invoer is geldig en valt binnen het bewijs-/kalibratiedomein. Een prognose kan worden berekend; de uitleg benoemt nog steeds relevante beperkingen.
- **Gedeeltelijk onderbouwd:** een bruikbare basis, zoals de bestaande thermische prior met een gemeten of verdedigbaar geschatte watertemperatuur, is aanwezig, maar een of meer belangrijke aanvullende responsen ontbreken of zijn alleen context. De prognose blijft bruikbaar als voorlopige verwachting; de ontbrekende factoren worden zichtbaar in de verdiepende uitleg en de onzekerheid neemt toe.
- **Onvoldoende onderbouwd:** er is geen bruikbare thermische basis én er zijn geen andere toegelaten, onafhankelijk gevalideerde responsfactoren die de doelrespons kunnen dragen. Dan blijft de uitkomst N/B in plaats van een schijnnauwkeurig cijfer.

Belangrijk onderscheid: de huidige runtime kent alleen de thermische numerieke prior. Daarom blijft zonder bruikbare thermische basis de huidige uitkomst N/B totdat een andere responsfactor formeel is toegelaten en gevalideerd. De toekomstige architectuur mag een prognose zonder temperatuur alleen berekenen als andere directe, gevalideerde responsinformatie dat aantoonbaar ondersteunt; luchttemperatuur of contextfactoren mogen het gat niet vullen.

### 106.6 Ontbrekende factoren zonder verborgen herweging

Ontbrekende waarden mogen niet automatisch als neutraal, gemiddeld, gunstig of ongunstig worden geïnterpreteerd. Ook mag het model niet ongemerkt de gewichten van aanwezige factoren vergroten zodat hun som weer 100% wordt.

Voor de kandidaatarchitectuur gelden daarom:

- Factorbijdragen worden alleen berekend wanneer invoer, responsdefinitie en bewijsstatus aan de toelatingsregels voldoen.
- Niet-beschikbare factoren blijven als ontbrekend geregistreerd; er wordt geen fictieve responswaarde opgeslagen.
- De modeluitkomst wordt expliciet gekoppeld aan het patroon van beschikbare factoren. Een uitkomst met gedeeltelijke dekking mag alleen worden gebruikt als die dekking in de onafhankelijke validatie voldoende betrouwbaar blijkt.
- Er vindt geen automatische hernormalisatie van de resterende gewichten plaats. Als het model bij een bepaald ontbrekend-data-patroon onvoldoende gevalideerd is, valt het terug op een eerder gevalideerde beperktere baseline of geeft het N/B.
- Onzekerheid wordt niet van de biologische score afgetrokken. Een lage datadekking maakt de vis niet biologisch minder actief; zij maakt onze verwachting minder zeker.
- De UI houdt het eenvoudig: dezelfde dagscore en bestaande uitleg, met een begrijpelijke melding dat bepaalde gegevens ontbreken of geschat zijn. Geen extra zichtbare subscore of percentage.

### 106.7 Voorbeelden van voldoende, gedeeltelijke en onvoldoende invoer

| Voorbeeld | Beschikbare informatie | Beoogde behandeling |
|---|---|---|
| A — gedeeltelijk, bruikbaar | Karper; recente lokale watertemperatuurmeting; thermische historie beschikbaar; directe voedingsrespons voor de actuele omstandigheden ontbreekt; zuurstof onbekend | Huidige thermische baseline kan een voorlopige 1–10-verwachting geven. Geen verzonnen zuurstof- of voedingsbonus. Uitleg meldt dat directe voedings-/zuurstofinformatie ontbreekt. |
| B — gedeeltelijk, geschat | Brasem; geen meting op de visdag, maar waterThermalEngine levert een bruikbare temperatuurinschatting met bekende bronstatus en onzekerheid; licht/tijdvak bekend; directe troebelheids- of voedingsrespons niet beschikbaar | Thermische baseline kan voorlopig worden gebruikt binnen de geldigheid van de schatting; schattingsonzekerheid blijft zichtbaar. Tijdstip alleen geeft geen onbewezen voedingsbonus. |
| C — toekomstig voldoende | Een soort met gevalideerde thermische respons én toegelaten directe voedingsrespons; actuele invoer voor beide valt binnen de gevalideerde context; tijdvakrespons heeft eigen passende gegevens | Kandidatenmodel mag de gemeenschappelijke respons en tijdvakrangschikking combineren als onafhankelijke chronologische validatie verbetering toont. Dit is een toekomstig toelatingsscenario, geen huidige runtimefunctionaliteit. |
| D — onvoldoende | Geen bruikbare watertemperatuur of thermische historie; alleen luchttemperatuur, wind en luchtdruk; geen andere toegelaten directe responsbron | Huidige en voorgestelde veilige behandeling is N/B. Weercontext mag geen fictieve biologische score creëren. |
| E — conflicterend | Een recente lokale meting en een modelinschatting verschillen sterk, of bronnen vallen buiten vergelijkbare diepte/tijd/resolutie | Geen willekeurig gemiddelde; bron en representativiteit controleren. Zo nodig alleen de best verdedigbare bron gebruiken met hogere onzekerheid, anders factor uitsluiten en coverage verlagen. |

### 106.8 Interacties en dubbele telling

Voor iedere factor wordt de herkomstketen bijgehouden, zodat dezelfde oorzaak niet meerdere keren als onafhankelijke bijdrage terugkomt. Voorbeelden:

- Watertemperatuurschatting die weersverwachting al gebruikt, mag niet daarnaast een volledige zelfstandige weerbonus krijgen zonder aantoonbaar onafhankelijk effect.
- Wind die via oeveroriëntatie en waterbeweging de habitat-/bewegingsanalyse beïnvloedt, is niet automatisch een extra dagbrede voedingsbijdrage.
- Fotoperiode, zonsopkomst/-ondergang en schemering zijn onderling gekoppeld; zij vormen niet drie onafhankelijke bijdragen.
- Activiteit, beweging, voedselopname en vangst zijn verschillende responsen; correlatie maakt ze niet onderling uitwisselbaar.

Een interactie wordt alleen kandidaat wanneer er een biologisch mechanisme, passende soortspecifieke bron en voldoende gecombineerde data zijn. De interactie wordt vooraf als hypothese vastgelegd en apart getoetst tegen het model zonder die interactie. Geen generieke vermenigvuldigingsfactoren.

### 106.9 Kalibratie- en evaluatievereisten

Voor formele toelating moet ieder modelonderdeel een eigen evaluatieplan hebben:

- **Watertemperatuur:** bestaande MAE/RMSE/bias-controle en geldigheid van de temperatuurbron.
- **Thermische respons:** passend direct biologisch eindpunt; thermische curve niet alleen op groei of aquacultuur fitten.
- **Voedings-/foerageerrespons:** onafhankelijke, soortspecifieke labels die werkelijk voedselopname/foerageren meten; vangst alleen is geen vervangend label.
- **Tijdvakrespons:** tijdgebonden directe respons of voldoende passende veldlabels; geen generieke schemerbonus.
- **Habitat/aanwezigheid:** aparte aanwezigheid-/habitatlabels; beweging alleen als beweging evalueren.
- **Samengestelde 1–10-score:** vooraf gedefinieerde evaluatiemaatstaf en chronologische vergelijking met thermische baseline, gerapporteerd per soort en relevante context.

De persoonlijke vangstkans blijft apart en wordt met Brier/BSS beoordeeld. Brier mag niet worden gebruikt om biologische factorgewichten te leren of de activiteitsscore te corrigeren. Vangstregistratie blijft volgens §104 frictiearm; er worden geen verplichte labels of extra vragen aan de gebruiker toegevoegd om deze evaluatie kunstmatig te vullen.

### 106.10 Nog te besluiten en volgende auditstap

Deze sectie legt de normalisatie- en onzekerheidsprincipes vast als ontwerpvoorstel, maar kiest nog geen definitieve aggregatieformule. De volgende auditstap is:

1. Per kandidaatfactor de exacte responsindex, referentieconditie, functie-vorm en bewijsstatus invullen; begin met de thermische prior en directe voedingsrespons per soort.
2. De actuele app-invoer koppelen aan de statuscategorieën uit §106.4, inclusief tijds-/ruimtelijke geldigheid.
3. Per ontbrekend-data-patroon vaststellen welke historische evaluatiedata beschikbaar zijn en waar voldoende ondersteuning ontbreekt.
4. Een toetsbaar kalibratieplan voor de bestaande 1–10-schaal definiëren, zonder de huidige score te wijzigen.
5. Een onafhankelijke label-/metricmatrix afronden voor activiteit, voeding, habitat en tijdvak.
6. Pas daarna een kandidaataggregatie ontwerpen en chronologisch vergelijken met de thermische baseline.

**Besluitstatus:** ontwerpprincipes vastgelegd voor verdere audit; nog niet formeel geaccepteerd als definitief modelontwerp. Geen runtimecode, gewichten, scoremapping of gebruikersflow gewijzigd. Fase 2 blijft open; Fase 3 geblokkeerd.


## 107. Technische normalisatie-audit van de huidige thermische prior (19 november 2026)

**Doel:** de bestaande numerieke baseline exact beschrijven voordat een kandidaatnormalisatie of kalibratie wordt ontworpen. Dit is een code-audit; er worden geen parameters of runtime-uitkomsten gewijzigd.

### 107.1 Huidige berekening

De huidige keten in `src/services/fishProfiles.ts` en `src/services/prognosisEngine.ts` is:

1. Selecteer de profielparameters voor de gekozen soort.
2. Gebruik de gemeten watertemperatuur als die beschikbaar en geldig is; anders de door `waterThermalEngine` geleverde schatting.
3. Bereken een asymmetrische Gaussische respons:
   `raw = exp(-((T - optimum)^2) / (2 × width^2))`, waarbij `width` de koude of warme breedte is afhankelijk van de positie ten opzichte van het optimum.
4. Begrens de respons op `0.08–1.00`.
5. Zet om naar de bestaande score met `round_0.1(clamp(1 + 9 × efficiency^0.85, 1, 10))`.
6. De dagscore is het gemiddelde van de vier tijdvak-scores. In de huidige code gebruiken alle tijdvakken dezelfde thermische respons; andere factoren hebben geen numerieke invloed op deze score.

Dit is een deterministische profieltransformatie, geen empirisch gekalibreerde relatie tussen watertemperatuur en dagelijkse voedselopname of vangst.

### 107.2 Exacte profielparameters in de huidige code

| Soortprofiel | Optimum (°C) | Koude breedte | Warme breedte |
|---|---:|---:|---:|
| Karper | 21,0 | 5,8 | 5,5 |
| Brasem | 17,5 | 6,2 | 5,8 |
| Snoek | 12,5 | 6,5 | 6,0 |
| Baars | 16,5 | 6,0 | 5,5 |
| Voorn | 15,0 | 6,5 | 6,0 |
| Zeelt | 20,5 | 5,0 | 5,0 |
| Snoekbaars | 15,0 | 6,2 | 6,0 |
| Meerval | 22,0 | 5,0 | 5,0 |
| Roofblei | 18,5 | 5,5 | 5,0 |
| Overig | 16,5 | 6,0 | 5,5 |

De waarden zijn expliciet als voorlopige modelprioren gedocumenteerd. Ze zijn geen gemeten soortoptima, fysiologische tolerantiegrenzen of gevalideerde Nederlandse veldcurves. De tabel registreert wat de code nu doet; zij is geen goedkeuring van de parameters.

### 107.3 Belangrijke eigenschappen van de scoremapping

- Bij het profieloptimum is de thermische efficiëntie 1 en de score 10.
- De efficiëntie wordt onderaan afgekapt op 0,08. Daardoor is de theoretische minimumscore van de huidige mapping ongeveer 2,1/10, niet 1,0/10. De bestaande schaal wordt dus niet volledig benut.
- De scoremapping is een monotone machtsfunctie van de thermische efficiëntie. De exponent 0,85 en de ondergrens 0,08 zijn softwarekeuzes; in de geraadpleegde code is geen empirische kalibratie ervan aangetoond.
- De huidige profielparameters en mapping mogen daarom niet worden geïnterpreteerd als gekalibreerde percentages biologische activiteit. De factorbeschrijving die de efficiëntie als percentage weergeeft, is een relatieve modelschaal en geen gemeten percentage voedselopname of activiteit.
- Een nieuwe kalibratie mag niet alleen de outputspreiding maximaliseren of de score kunstmatig tot 1–10 oprekken. De betekenis moet met vooraf gedefinieerde responsankers en onafhankelijke gegevens worden onderbouwd.

### 107.4 Temperatuurstatus en ontbrekende invoer in de huidige keten

De code onderscheidt:
- **Gemeten:** een expliciet ingevoerde, geldige watertemperatuur; deze wordt als actuele meting behandeld.
- **Geschat:** een bruikbare temperatuur uit een historische meting als anker, thermische ontwikkeling/weerdekking of historisch seizoensprofiel. De bronstatus, ankerleeftijd, onzekerheid en eventuele temperatuurrange worden meegedragen.
- **Onbekend:** geen bruikbare gemeten of geschatte watertemperatuur. Luchttemperatuur wordt niet als vervanging gebruikt.

Bij een onbekende temperatuur gebruikt de interne berekening momenteel een placeholder-efficiëntie van 0,5 om tussenstappen te kunnen uitvoeren. Tegelijk wordt `activityScoreAvailable=false` gezet; de snapshot bewaart `predictedActivityScore=null` en de dagscore wordt niet als beschikbare voorspelling gepresenteerd (de interne fallbackwaarde 5,0 is geen geldige prognose). Dit onderscheid moet in toekomstige code behouden blijven: placeholderwaarden mogen nooit als gemeten, neutrale of voorspellende factorbijdrage in een modelscore of traininglabel terechtkomen.

Een geschatte temperatuur is niet gelijk aan een meting. De huidige code berekent voor een beschikbare geschatte temperatuur ook een indicatieve scoreband op basis van de temperatuurrange. Die band omvat niet de onzekerheid van de soortcurve zelf en is expliciet geen statistisch betrouwbaarheidsinterval.

### 107.5 Consequenties voor normalisatie en latere kalibratie

De huidige thermische prior heeft twee verschillende onzekerheidsbronnen die niet samengevoegd mogen worden:

1. **Invoer-/temperatuuronzekerheid:** hoe goed representeert de gemeten of geschatte watertemperatuur de doeldag, stek, diepte en relevante watermassa?
2. **Respons-/parameteronzekerheid:** hoe goed zijn optimum, koude/warme breedte, responsvorm, ondergrens en exponent onderbouwd voor de doelsoort, levensfase en watertype?

Een nauwe temperatuurrange betekent dus niet automatisch dat de biologische responscurve nauwkeurig bekend is. Latere kalibratie moet beide afzonderlijk rapporteren en evalueren.

De thermische prior blijft de historische baseline waarmee een kandidaatmodel chronologisch wordt vergeleken. Een eventuele toekomstige herkalibratie van de thermische prior zelf moet als afzonderlijke modelwijziging worden geëvalueerd; zij mag niet tegelijk met nieuwe factoren worden aangepast zonder ablatietest, omdat anders niet zichtbaar is welke wijziging de verbetering veroorzaakte.

### 107.6 Nog open

1. Verifieer per soort de herkomst en toepassingscontext van de huidige optimum-/breedteparameters; ontbrekende directe curvegegevens blijven expliciet onbekend.
2. Controleer de precieze statusoverdracht van gemeten/geschatte/onbekende temperatuur naar snapshots en historische evaluaties, zodat placeholders niet als trainingsdata kunnen worden gelezen.
3. Definieer een onafhankelijke thermische responslabel/metric die past bij het doel van de curve; groei, metabolisme, aerobe scope en voedselopname blijven verschillende eindpunten.
4. Ontwerp vaste scoreankers en toets de huidige ondergrens/exponent tegen die labels, zonder de huidige runtime te wijzigen.
5. Pas daarna de directe voedingsrespons en eventuele extra factoren normaliseren en kandidaatmodellen vergelijken met de thermische baseline.

**Besluitstatus:** huidige thermische normalisatie exact in kaart gebracht; wetenschappelijke kalibratie en scoremapping nog niet geaccepteerd. Geen runtimewijziging. Fase 2 blijft open; Fase 3 geblokkeerd.


## 108. Bronherkomst van thermische profielparameters (19 november 2026)

**Onderzoeksvraag:** onderbouwen de bestaande soortprofielbronnen de exacte `thermalOptimum`, `thermalWidthCold` en `thermalWidthWarm` in `fishProfiles.ts`?

### 108.1 Uitkomst van de registry-audit

De 86 records in `src/services/researchRegistry.ts` bevatten geen afzonderlijk gemeten of gevalideerde uitkomst `thermal_efficiency` of `thermal_optimum`. De registry kent als relevante fysiologische uitkomsten onder meer `metabolic_rate` en `aerobic_scope`, maar deze zijn niet gelijk aan dagelijkse voedselopname, foerageeractiviteit of hengelvangbaarheid.

Vijf soortgebonden records bevatten temperatuurgerelateerd metabolisme en/of aerobe scope:

| Soort(en) | Geregistreerde respons | Wat de bron wel ondersteunt | Waarom dit de huidige profielcurve niet valideert |
|---|---|---|---|
| Karper | Metabolisme | Acute zuurstofopname-/hartslag-/ventilatierespons na acclimatisatie op 19 °C | Geen volledige langetermijncurve of dagelijkse voedselopnamecurve |
| Snoek | Metabolisme | Onderhoudsmetabolisme bij 2 en 14 °C | Twee temperatuurpunten; geen asymmetrisch optimum of dagelijkse jacht-/voedingsrespons |
| Baars | Metabolisme, aerobe scope | Meerdere acclimatisatietemperaturen en lichaamsgrootte-afhankelijke aerobe-scope-/voorkeursrespons | Lichaamsgrootte en levensfase beïnvloeden uitkomst; aerobe scope is geen voedselopname |
| Brasem en blankvoorn | Metabolisme | Zuurstofverbruik over 5–23 °C en brede lichaamsmassaklasse | Metabolisme/Q10 is niet de dagelijkse voedingsintensiteit of vangstrespons |
| Snoekbaars | Metabolisme, aerobe scope | Volwassen kweekvis; aerobe-scopebereik en acclimatisatiecontext | Kweek-/levensfasecontext; geen dagelijkse voedselopnamecurve of veldvangstcurve |

Alle vijf records hebben `approvedForPrediction: false`. Ook waar een bron een optimum of temperatuurafhankelijkheid voor metabolisme/aerobe scope rapporteert, mag dat optimum niet worden overgenomen als optimum voor dagelijkse activiteit of voedselopname.

Voor zeelt, meerval, roofblei en het generieke profiel `Overig` is in deze vijf records geen soortspecifieke metabole/aerobe-scopecurve geregistreerd. Dit zegt alleen iets over de huidige registry, niet dat er wereldwijd geen relevante studie bestaat.

### 108.2 Conclusie voor de huidige parameters

De waarden in §107 zijn op dit moment softwarematige prioren. De in `fishProfiles.ts` opgenomen referenties ondersteunen biologische context, maar de registry-audit toont geen directe bron die de exacte combinatie van optimum, koude breedte en warme breedte per soort valideert. Ook een temperatuurgerelateerde voedingsstudie met slechts twee behandelingen of een contextgebonden laboratorium-/kweekexperiment is onvoldoende om de volledige Gaussische curve vast te stellen.

Daarom:
- Geen van de huidige soortcurves wordt op basis van alleen metabolisme, aerobe scope, groei of algemene reviewliteratuur als gevalideerd aangemerkt.
- Een bron die directe voedingsintensiteit meet kan een voedingsrespons onderbouwen, maar alleen binnen haar onderzochte soort, levensfase, temperatuurbehandelingen en context. Zij valideert niet automatisch de huidige thermische efficiëntiecurve.
- De huidige parameters blijven bruikbaar als transparante tijdelijke baseline voor vergelijking, maar mogen niet als wetenschappelijk gekalibreerde biologische waarheid worden beschreven.
- De toelatingsstatus van alle registry-records blijft ongewijzigd; geen bron is door deze audit goedgekeurd.

### 108.3 Benodigde vervolgstap

Maak per soort een parameterherkomstkaart met drie afzonderlijke vragen:

1. Welke bron meet direct temperatuurafhankelijke voedselopname of foerageerintensiteit?
2. Welke bron meet alleen metabolisme/aerobe scope/groei of temperatuurvoorkeur, en mag dus uitsluitend als indirecte biologische context dienen?
3. Welke temperatuurbehandelingen, levensfasen, acclimatisatieduur, watertype en geografische context zijn daadwerkelijk onderzocht?

Als geen passende directe curve beschikbaar is, blijft het profiel een expliciet voorlopige prior en moet onzekerheid over de responsparameter worden behouden. Er worden geen ontbrekende optima uit verwante soorten ingevuld en geen numerieke curveparameters afgeleid uit een ander biologisch eindpunt.

**Besluitstatus:** exacte bronvalidatie voor huidige profielparameters is niet aangetoond. Geen wijziging van parameters, brongoedkeuring of runtime. Fase 2 blijft open; Fase 3 geblokkeerd.


## 109. Directe temperatuur-/voedingsrespons: soortdekking en overdraagbaarheid (19 november 2026)

Deze aanvulling koppelt temperatuurgerelateerde registrybronnen aan het juiste gemeten eindpunt. Het is nadrukkelijk geen parameterfit en geen goedkeuring voor numerieke toepassing.

| Soort | Direct gemeten voedings-/voedselopnamebewijs in register | Context en beperking | Gevolg voor de huidige thermische curve |
|---|---|---|---|
| Karper | Chen et al. (2012): voedselopname bij 4–34 °C; gerapporteerde piek rond 28 °C en lagere opname bij 34 °C. | Aziatische ondersoort, twee grootteklassen, gecontroleerde voeropzet; volledige methode/acclimatisatie nog te controleren. | Relevante directe voedingsrespons, maar niet automatisch de huidige 21 °C profielpiek of veldcurve. |
| Karper | Bauer & Schlott (2006): voeding stopte tijdens een ernstige winterse zuurstofcrisis. | Eén aquacultuurvijver en uitzonderlijke hypoxie; geen normale dagelijkse temperatuurcurve of universele zuurstofdrempel. | Ondersteunt zuurstof als afzonderlijke relevante factor in extreme context; niet als temperatuurcurve. |
| Zeelt | Benjamin et al. (2026): lagere maximale voedselopname bij 25 °C dan bij 18 °C. | Twee temperatuurbehandelingen, invasieve populatie in St. Lawrence-systeem; geen volledig optimum. | Waarschuwt tegen de aanname dat meer warmte altijd meer voeding geeft; valideert de 20,5 °C prior niet. |
| Snoekbaars | Malinovskyi et al. (2020): prooiconsumptie bij 4,5, 8,5 en 12,5 °C nam toe over die behandelingen. | Gekweekte broedvis in winter-/voorpaaiperiode; sekse, reproductiestatus en prooigrootte relevant. | Directe voedingsrespons in beperkte context; geen algemene volwassen veldcurve of bevestiging van 15 °C optimum. |
| Blankvoorn | Hautala (2008): veldwaarneming van seizoensgebonden verschuiving van dag- naar schemer-/nachtvoeding bij afkoeling. | Boreaal meer, ondiepe verlichte litoraalzone; temperatuur, licht en predatierisico verweven. | Ondersteunt mogelijke temperatuur × licht × seizoen-interactie; geen geïsoleerde thermische optimumcurve of vaste tijdvakbonus. |
| Snoek | Yazıcıoğlu et al. (2025): seizoens-maagvullingsindex en temperatuurcorrelatie. | Temperatuurcorrelatie niet significant; maaginhoud is momentopname en geen jachtintensiteit. | Geen numerieke temperatuurrespons afleiden. |
| Meerval | Boujard (1995): sterk nachtelijk voerautomaatritme. | Gecontroleerde voederopstelling; temperatuurcontext in beschikbare samenvatting niet vastgesteld. | Ondersteunt diel-voedingsonderzoek, niet een temperatuurcurve of veldvangstbonus. |
| Meerval | Yazici et al. (2025): seizoensvariatie in maagvulling. | Eén diep Anatolisch stuwmeer; mogelijke verklaringen zijn verweven; maagvulling is geen vangbaarheid. | Alleen context; geen dagelijkse thermische voedingscurve. |

De registry bevat daarnaast metabole/aerobe-scopegegevens voor karper, snoek, baars, brasem/blankvoorn en snoekbaars (§108). Die fysiologische eindpunten blijven gescheiden van de directe voedingsstudies hierboven. Er is in deze inventaris geen rechtvaardiging om de bestaande uniforme Gaussische vorm of exacte optimum-/breedteparameters te laten volgen uit één van deze uiteenlopende responsen.

### 109.1 Gevolg voor responsnormalisatie

- De directe voedingsstudies laten verschillende responsvormen en contexten zien. Een universele Gaussische curve per soort is daarom geen vanzelfsprekende keuze.
- De bron bij zeelt laat zien dat een hogere temperatuur niet automatisch een hogere voedingsrespons betekent; de respons kan tussen twee onderzochte temperaturen al afnemen.
- De karper- en snoekbaarsstudies zijn directe voedingsmetingen, maar contextgebonden. De uitkomsten mogen niet rechtstreeks worden overgezet naar Nederlandse wilde populaties zonder overdraagbaarheidsbeoordeling.
- Bij blankvoorn zijn temperatuur, licht en seizoen verweven. Zonder onafhankelijke scheiding mag dezelfde variatie niet als drie afzonderlijke bijdragen worden opgeteld.
- Voor soorten zonder passende directe temperatuur-voedingscurve blijft de thermische profielcurve een voorlopige prior. Geen curveparameters lenen van een andere soort.
- Alle bronnen blijven in de registry op hun bestaande status; deze audit wijzigt `approvedForPrediction` niet.

### 109.2 Volgende stap

Per soort een responskaart maken waarin de directe voedingsdata, metabole/aerobe-scopecontext en bestaande profielprior afzonderlijk worden vastgelegd. Alleen als de bron voldoende temperatuurbehandelingen, levensfase, acclimatisatie en passende doelrespons bevat, kan zij kandidaat zijn voor een responsfunctie. Anders dient zij uitsluitend als context of kwalitatieve grens. Vervolgens moet worden vastgesteld welke soorten genoeg bewijs hebben voor een soortspecifieke kandidaatcurve en welke voorlopig op de bestaande baseline blijven.

**Besluitstatus:** directe temperatuur-/voedingsrespons per relevante registrybron onderscheiden; geen bron goedgekeurd en geen curveparameter gewijzigd. Fase 2 blijft open; Fase 3 geblokkeerd.


## 110. Soortspecifieke responskaarten: huidige bewijsdekking (19 november 2026)

### 110.1 Leeswijzer en beoordelingsregels

Deze kaarten scheiden vier verschillende biologische responsen:
- **Temperatuur → voedselopname:** directe meting van voedselopname/voedingsintensiteit bij verschillende temperaturen.
- **Dagritme → voeding:** directe of indirecte informatie over wanneer voeding plaatsvindt; kloktijd is alleen overdraagbaar als lichtregime, seizoen, habitat en levensfase vergelijkbaar zijn.
- **Fysiologie:** metabolisme/aerobe scope/groei; nuttige biologische context, maar geen directe voedings- of vangstrespons.
- **Beweging/habitat:** verplaatsing, aanwezigheid of dieptegebruik; niet gelijk aan voeding of vangbaarheid.

Bewijsdekking hieronder beschrijft uitsluitend de huidige 86 registryrecords en de al beoordeelde profielbronnen. Het is geen volledige wereldwijde literatuurreview. **Direct** betekent dat het genoemde eindpunt daadwerkelijk is gemeten; het betekent niet automatisch dat de bron voldoende is voor een voorspellende parameter. Geen van de records is door deze audit goedgekeurd voor automatische modeltoepassing.

### 110.2 Responskaarten per profiel

| Soort | Temperatuur → voedselopname | Dagritme / voeding | Fysiologie / beweging | Huidige modelstatus |
|---|---|---|---|---|
| **Karper** | Directe gecontroleerde voedselopname over 4–34 °C (Chen et al.); consumptie nam toe tot een gerapporteerde piek rond 28 °C en daalde bij 34 °C. Andere ondersoort en beperkte grootteklassen; volledige methode/acclimatisatie nog te toetsen. | Directe veldconsumptie/telemetrie toont nachtelijke consumptie bij bijgevoerd meer, terwijl rivier- en andere studies andere pieken laten zien. Geen universeel nachtpatroon. | Metabolisme/acuut temperatuuronderzoek; ernstige hypoxie kan voedselopname sterk remmen, maar de onderzochte crisiscontext is uitzonderlijk. | **Beperkt direct voedingsbewijs.** Geen geldige basis om huidige 21 °C Gaussische prior te vervangen of 28 °C als Nederlands optimum in te stellen. |
| **Brasem** | Geen directe, passende soortspecifieke temperatuur-voedselopnamecurve in de huidige registry. Metabolisme over meerdere temperaturen en groeionderzoek zijn indirect. | Directe zoöplanktonconsumptie bij subadult/adult overwegend overdag; juveniele pelagische vis kan nachtelijk eten. Levensfase en habitat veranderen de uitkomst. | Veldactiviteit hangt samen met troebelheid in een ondiep meer; dit is geen directe voedselopname. | **Onvoldoende voor thermische voedingscurve; contextueel dagritmebewijs.** |
| **Snoek** | Geen bruikbare directe temperatuur-voedselopnamecurve. Maagvulling-/seizoensstudie vond geen significante temperatuurcorrelatie; metabolisme bij beperkte temperatuurpunten is indirect. | Hartslagtelemetrie onderzocht voeding in wilde snoek; jonge 0+ voedingspatronen zijn niet zonder meer volwassen patroon. | Telemetrie van beweging en habitatwisselingen; weinig beweging betekent niet geen jacht. | **Onvoldoende voor thermische voedingscurve; beperkte directe voedings-/telemetriecontext.** |
| **Baars** | Geen voldoende passende directe temperatuur-voedselopnamecurve in de huidige registry. Aerobe scope en metabolisme zijn indirect en lichaamsgrootte-afhankelijk. | Veldstudies beschrijven seizoensgebonden variatie in ochtend-, avond- en middagactiviteit/voeding; geen vaste kloktijd voor alle wateren. | Sterke fysiologische informatie over temperatuur × lichaamsgrootte, maar geen directe voedingscurve. | **Onvoldoende voor thermische voedingscurve; contextueel dagritmebewijs.** |
| **Voorn** | Geen voldoende passende directe temperatuur-voedselopnamecurve. Metabolisme is onderzocht; dit blijft een ander eindpunt. | Veldonderzoek beschrijft verschuiving van dagvoeding naar schemer-/nachtvoeding in herfst bij afkoeling; andere studies laten levensfase- en habitatverschillen zien. Temperatuur, licht en predatierisico zijn verweven. | Groei-/metabolismegegevens uit Nederlandse meren zijn niet gelijk aan dagelijkse voedselopname. | **Onvoldoende voor geïsoleerde thermische voedingscurve; bruikbaar contextueel tijdritmebewijs.** |
| **Zeelt** | Directe vergelijking bij 18 en 25 °C vond lagere maximale voedselopname bij 25 °C. Twee behandelingen, invasieve populatie in St. Lawrence-systeem; geen volledig optimum. | Veldonderzoek in één klein eutroof water en gecontroleerde studies ondersteunen avond-/nachtvoeding, maar niet als universele kloktijd. | Benthische habitatassociatie is ecologische context; geen dagelijkse activiteitsscore. | **Beperkt direct voedingsbewijs.** Twee punten zijn onvoldoende om een curve of optimum te fitten. |
| **Snoekbaars** | Directe prooiconsumptie bij 4,5 / 8,5 / 12,5 °C in gekweekte broedvis tijdens winter-/voorpaaiperiode; consumptie nam toe over de behandelingen. Sekse/reproductiestatus en kweekcontext beperken overdraagbaarheid. | Schemergebonden beweging in telemetrie; beweging of ondiepe aanwezigheid bewijst geen jacht/voeding. | Aerobe-scopeonderzoek bij volwassen kweekvis; fysiologisch eindpunt, geen voedingscurve. | **Beperkt direct voedingsbewijs in een smalle context.** Geen algemene veldcurve of vaste schemerbonus. |
| **Meerval** | Geen directe temperatuur-voedselopnamecurve in de huidige registry. Maagvulling per seizoen is contextueel en geen directe dagelijkse voedingsmeting. | Gecontroleerde zelfvoeropstelling toont sterk nachtelijk voederpatroon; veld-/maagvullingsbronnen zijn contextgebonden. | Veldtelemetrie beschrijft seizoensbeweging en dieptegebruik; geen gelijkstelling met voedselopname. | **Onvoldoende voor thermische voedingscurve; beperkt gecontroleerd dagritmebewijs.** |
| **Roofblei** | Geen passende directe temperatuur-voedselopnamecurve in de huidige registry. | Telemetrie beschrijft seizoensbeweging rond dageraad/schemering; geen directe voedingsmeting. | Dieet- en bewegingsstudies geven ecologische context, geen voedingsintensiteit of vangbaarheid. | **Onvoldoende directe temperatuur-/voedingsrespons.** |
| **Overig** | Geen soortspecifiek bewijs mogelijk omdat dit een generiek terugvalprofiel is. | Geen soortspecifiek dagritme toekennen. | Geen soortspecifieke fysiologie of habitatvoorkeur veronderstellen. | **Alleen fallback-context; nooit behandelen als een tiende biologisch gevalideerde soort.** |

### 110.3 Wat de responskaarten wel en niet toelaten

1. Voor geen van de tien profielen is op basis van de huidige registry een volledig gevalideerde dagelijkse temperatuur-voedselopnamecurve beschikbaar.
2. Karper, zeelt en snoekbaars hebben directe maar contextgebonden temperatuur-/voedingsmetingen. Die zijn geschikt om hypotheses en onzekerheidsgrenzen te formuleren, niet om zonder verdere validatie parameters te fitten.
3. Voor brasem, snoek, baars, blankvoorn, meerval en roofblei is de huidige temperatuur-voedingsdekking onvoldoende voor een eigen gekwantificeerde curve.
4. Dagritmebewijs kan voor advies en tijdvakcontext relevant zijn, maar mag niet worden vertaald naar een vaste bonus zonder lokale/soortspecifieke verificatie en rekening te houden met levensfase, seizoen, licht en habitat.
5. Fysiologische eindpunten (metabolisme, aerobe scope, groei) kunnen verklarende priors ondersteunen, maar zijn geen substituut voor voedselopname.
6. Beweging/habitat en vangstgegevens blijven afzonderlijke lagen. Een vangst is geen directe voedingslabel en afwezigheid van vangst is geen bewijs van niet-voeden.

### 110.4 Prioriteit voor verdere onderbouwing

- **Eerst:** volledige methoden en ruwe responsgegevens controleren van de contextgebonden directe voedingsstudies voor karper, zeelt en snoekbaars; pas daarna beslissen of een beperkte kandidaatresponsfunctie verantwoord is.
- **Daarna:** soortspecifieke directe temperatuur-/voedingsbronnen zoeken voor brasem, snoek, baars, blankvoorn, meerval en roofblei. Als er geen geschikte bron bestaat, blijft de respons onbekend/voorlopig; geen parameters lenen van verwante soorten.
- **Parallel:** tijdritmebronnen per soort rubriceren naar direct gemeten voeding versus beweging/habitat, met levensfase, seizoen, lichtregime, watertype en prooiaanbod als overdraagbaarheidsvoorwaarden.
- **Vervolgens:** per kandidaatrespons vaste referentieankers en een onafhankelijk label/metric definiëren. Alleen daarna kandidaatcurves toetsen tegen de bestaande thermische baseline.

**Besluitstatus:** eerste soortspecifieke responskaarten voltooid op basis van huidige registry; geen soort heeft op dit moment een volledig gevalideerde thermische voedingscurve. Geen bron goedgekeurd en geen runtimewijziging. Fase 2 blijft open; Fase 3 geblokkeerd.


## 111. Responslabel-nuance: voedselopname versus foerageergedrag (19 november 2026)

De karperbronnen in de registry meten niet allemaal hetzelfde:

- Chen et al. (2012) registreert voedselopname en voedingsritme bij de onderzochte Aziatische karperondersoort, grootteklassen en gecontroleerde temperatuurbehandelingen.
- Oyugi et al. (2012) onderzoekt juveniele gewone karper van circa 90–105 mm bij 16, 20, 24 en 28 °C. De gemeten foerageersnelheid was het hoogst bij 24 °C binnen die proefopzet. Het gemeten eindpunt is foraging rate, niet automatisch totale dagelijkse voedselopname, adult-gedrag of vangbaarheid.
- De wilde-karperstudie van Bajer et al. (2010) meet consumptie van aangeboden maïs in een specifieke veldcontext en telemetrie-/bezoekgedrag bij bijgevoerd punt. Ook dit is niet gelijk aan een universele natuurlijke voedingscurve.

Deze resultaten zijn complementair, maar mogen niet als één dataset worden samengevoegd of als drie onafhankelijke bevestigingen van hetzelfde thermische optimum worden geteld. De levensfase, soort-/ondersoort, experimentele opzet, voedseltype en gemeten respons verschillen.

**Modelconsequentie:** een toekomstige responskaart houdt minimaal aparte labels voor (a) voedselopname/consumptie, (b) foerageersnelheid/voedselzoekgedrag, (c) locomotorische activiteit en (d) vangst. Een bron kan meer dan één label ondersteunen wanneer die werkelijk afzonderlijk zijn gemeten, maar de labels worden niet onderling vervangen. Voor de huidige scoredoelstelling is directe voedingsrespons relevanter dan alleen beweging; foerageergedrag is ondersteunend bewijs en moet als zodanig gemarkeerd blijven.

De algemene review van Volkoff & Rønnestad (2020) onderstreept dat temperatuur effecten heeft op voedsel zoeken, voedselopname en vertering, maar dat die responsen soort-, levensfase-, acclimatisatie- en blootstellingsafhankelijk zijn. De review ondersteunt de scheiding van responslagen; zij levert geen exacte parameters voor de Vislogboek-soortcurves.

**Besluitstatus:** responslabels zijn aangescherpt; geen bronstatus, parameter, gewicht of runtime gewijzigd.

## 112. Nieuwe primaire snoekstudie: temperatuur × prooigedrag × functionele respons (19 november 2026)

**Bron:** Nilsson-Örtman, V., Nilsson, E. & Brönmark, C. (2026). *Effects of temperature and browning on the functional response of a freshwater top predator*. Journal of Animal Ecology, 95(5), 824–836. https://doi.org/10.1111/1365-2656.70233

### 112.1 Wat is daadwerkelijk gemeten

Dit is een primaire laboratoriumstudie met jonge-van-het-jaar (0+) snoek en voornamelijk blankvoorn als prooi. In experiment 1 werden functionele respons en prooiconsumptie onderzocht bij 5, 9 en 13 °C, in helder of matig bruin water en bij vier prooidichtheden (2, 5, 10 en 20 vissen). De 24 behandelingscombinaties werden elk acht keer herhaald (192 proeven). Elke proef duurde gemiddeld circa 23,5 uur, zodat de totale consumptie over een volledige dag-nachtcyclus werd geïntegreerd. De snoeken wogen gemiddeld 51,8 g (n=24; bereik 34,5–79,2 g) en waren circa 165–220 mm lang. De dieren waren 10–13 dagen bij 9 °C geacclimatiseerd en kregen tussen opeenvolgende proeven een vastenperiode van vier dagen.

Experiment 2 onderzocht consumptie bij twee prooidichtheden en vijf gradaties van waterbruining, bij een constante 9 °C. Dit is dus een tweede, afzonderlijke proefopzet; de uitkomsten mogen niet als één temperatuurreeks worden samengevoegd.

### 112.2 Resultaat en interpretatie

- De functionele respons was in vijf van de zes combinaties het best beschreven als Holling type II, maar alternatieve modellen kregen vaak vergelijkbare steun (ΔAIC ≤ 2). De exacte responsvorm is dus in de meeste condities onzeker.
- Alleen bij 5 °C in helder water werd een koepelvormige type-IV-respons gevonden. De hogere consumptie trad vooral op bij een intermediaire prooidichtheid.
- Temperatuur en waterkleur hadden over het algemeen zwakke effecten op aanvalssnelheid en maximale voedselopname. In helder water nam de geschatte aanvalssnelheid toe met temperatuur; in matig bruin water was die vrijwel temperatuuronafhankelijk. De betrouwbaarheidsintervallen overlapten grotendeels.
- De geschatte maximale opname daalde licht met temperatuur in helder water en vertoonde geen consistente trend in bruin water; intervallen overlapten tussen behandelingen.
- In het aparte bruiningsexperiment werd geen significant algemeen effect van waterkleur op prooiconsumptie gevonden, zelfs niet bij de extreemste bruining. Dit resultaat is contextgebonden aan de gebruikte soort, prooi, arena en experimentele omstandigheden.

### 112.3 Bewijsclassificatie en grenzen

**Gemeten eindpunten:** feeding_intensity, foraging_behavior en prey_selection (functionele respons/aanvalssnelheid en dagelijkse prooiconsumptie).

**Bewijswaarde:** directe primaire voedings-/predatiedata voor snoek, een belangrijke aanvulling op de eerdere registrydekking. De studie nuanceert de eerdere formulering dat voor snoek geen bruikbare directe temperatuurgerelateerde voedingsmeting bekend was. De juiste conclusie is nu: er bestaat een directe, maar zeer contextgebonden winterstudie bij 0+ snoek; deze levert geen algemene volwassen veldcurve of universeel temperatuur-optimum.

**Overdraagbaarheidsbeperkingen:**
- 0+ snoek van circa 165–220 mm, geen volwassen sportvispopulatie.
- Winterse temperatuurband van 5–13 °C en Zweedse prooipopulatie/context.
- Voorn was meer dan 95% van de prooien, met kleine aantallen andere cypriniden.
- Gecontroleerde arena's van circa 700 L, gestandaardiseerde vasten- en acclimatisatieperioden.
- De prooiconsumptie integreerde circa 24 uur en is geen bewijs voor een specifiek schemeruur of een vaste tijdvakbonus.
- De auteurs benadrukken onzekerheid in de meeste functionele-responsvormen en voorzichtigheid bij absolute aanvalssnelheden.
- De uitkomst is predatie op levende vis; dit is niet rechtstreeks gelijk aan voedselopname van karperachtigen op hengelaas of aan hengelvangbaarheid.

### 112.4 Gevolg voor de soortkaart en vervolgstap

1. De snoekkaart in §110 moet niet langer stellen dat er geen directe temperatuurgerelateerde voedingsmeting is; zij moet deze 0+-winterstudie als beperkte directe dekking noemen.
2. Deze bron mag niet worden gebruikt om de bestaande snoek-thermische profielcurve te fitten of een algemene 19–20 °C prior te bevestigen: het gemeten eindpunt, levensfase en temperatuurbereik zijn anders.
3. De studie toont dat temperatuur × prooigedrag × waterkleur samen de functionele respons kunnen beïnvloeden. Dit ondersteunt gescheiden responscomponenten en interacties, niet een zelfstandige universele temperatuur- of troebelheidsbonus.
4. De bron is in deze aanvulling als kandidaat voor registratie en verdere bronverificatie vastgelegd; de bestaande registry en approvedForPrediction-statussen zijn niet gewijzigd. Voor formele registry-opname moeten de metadata en uitkomstlabels nog in de registry-audit worden gecontroleerd.

**Besluitstatus:** nieuwe primaire bron inhoudelijk beoordeeld en als beperkte directe snoek-voedingsdekking toegevoegd aan de audit; geen modelparameter, gewicht, bronvrijgave of runtime gewijzigd. Fase 2 blijft open; Fase 3 geblokkeerd.

## 113. Externe literatuurtriage: aanvullende soortkandidaten (19 november 2026)

Deze zoekronde signaleert mogelijke primaire bronnen buiten de huidige registry. De onderstaande publicaties zijn kandidaatbronnen, geen automatisch gevalideerde registry-records. Een kandidaat wordt pas opgenomen na controle van volledige methode, gemeten eindpunt, experimentele eenheid, levensfase, temperatuur/acclimatisatie en bronkwaliteit.

### 113.1 Blankvoorn — voedselzoekgedrag in een temperatuurgradiënt

**Bron:** Smirnov, A.K. & Smirnova, E.S. (2015). *Response of juvenile roach Rutilus rutilus to the heterogeneity of food resources in a temperature gradient*. Vestnik of Astrakhan State Technical University, Series: Fishing Industry, 2015(3), 44–52.

De beschikbare samenvatting beschrijft juveniele blankvoorn die voedsel zocht in een zone die 7–10 °C kouder lag dan de zone met de temperatuurvoorkeur. Hongerige dieren maakten korte voedselzoekbewegingen naar de voedselzone, terwijl zij het grootste deel van de tijd temperaturen dichter bij hun voorkeur bleven selecteren.

**Classificatie:** kandidaat voor foraging behavior en thermoregulatie × voedselbeschikbaarheid. Dit is geen zuivere temperatuur-respons van voedselopname: de studie beschrijft vooral keuze en verplaatsing in een heterotherm systeem. De exacte leeftijd/grootte, temperatuurregeling en kwantitatieve gedragsmaten moeten uit de volledige methode worden gecontroleerd. Geen zelfstandige temperatuurbonus of vaste tijdvakrespons afleiden.

### 113.2 Baars — voedselbeschikbaarheid beïnvloedt temperatuurkeuze en foerageergedrag

**Bron:** Smirnov, A.K. & Smirnova, E.S. (2019). *Behavior of Perch Fry Perca fluviatilis in a Heterothermal Environment at Different Levels of Food Availability*. (Primaire experimentele studie; bibliografische publicatiegegevens en volledige methode nog te verifiëren.)

De beschikbare samenvatting beschrijft 1+ baars in een heterotherm systeem met overmatige, beperkte of afwezige voedselbeschikbaarheid. De uiteindelijke geselecteerde temperatuur verschilde tussen die condities (ongeveer 26, 24 en 22 °C). De gerapporteerde voedselconsumptie over 15 minuten was in twee gevoerde condities vergelijkbaar (circa 14,2 en 15,2% van lichaamsgewicht), ondanks verschil in voedselbeschikbaarheid.

**Classificatie:** kandidaat voor interactie tussen voedselbeschikbaarheid, temperatuurkeuze en foraging behavior; er is ook een directe consumptiemeting, maar geen geïsoleerde temperatuurbehandeling die een voedselopnamecurve oplevert. De temperatuur is door de vis gekozen binnen een gradiënt, niet als een reeks onafhankelijke acclimatisatiebehandelingen opgelegd. Daarom geen temperatuur-optimum of thermische voedselopnamefunctie fitten.

### 113.3 Brasem — jonge levensfase en twee temperatuurbehandelingen

**Bron:** (1985). *Influence of temperature and rate of feeding on nitrogen metabolism of juvenile bream (Abramis brama L.)*. Comparative Biochemistry and Physiology Part A, 82(1), 125–129. DOI: https://doi.org/10.1016/0300-9629(85)90715-7

De beschikbare abstractinformatie noemt brasemfry van circa 75–1400 mg, gevoerd met levend zoöplankton bij 15 ± 1 en 20 ± 1 °C, met een aangeboden rantsoen van 10–15% lichaamsgewicht per dag. De studie rapporteert onder meer stikstofconsumptie en stikstofuitscheiding.

**Classificatie:** relevante kandidaat, maar nog niet als directe temperatuur-voedselopnamecurve aanmerken. De volledige methode moet uitwijzen hoe daadwerkelijke voedselopname/consumptie werd bepaald ten opzichte van het aangeboden rantsoen en hoe de grootteklassen zijn geanalyseerd. Twee temperatuurbehandelingen en zeer jonge levensfasen zouden ook bij bevestigde intake slechts beperkte dekking geven.

### 113.4 Meerval — directe voeracceptatie en consumptie, maar voorlopige bronkwaliteit

**Bron:** Havasi, M., Oláh, T., Felföldi, Z. & Bercsényi, M. *Passing times of two types of feeds in Wels (Silurus glanis) at three different temperatures*. Conferentiebijdrage in de proceedings *Diversification in Inland Finfish Aquaculture*.

De beschikbare proceedingssamenvatting beschrijft fingerlings van gemiddeld circa 38 g bij 15, 20 en 24 °C, met drie replicaten per behandeling en twee voertypen (droogvoer of visprooi). Bij 15 °C accepteerde een kleiner aandeel de pellets dan de visprooi; bij 20 en 24 °C werd in beide voerbehandelingen volledige voeracceptatie gerapporteerd. De dagelijkse geconsumeerde hoeveelheid verschilde sterk tussen voertype en temperatuur.

**Classificatie:** kandidaat voor directe feeding intensity/voeracceptatie bij jonge kweekmeerval. Beperkt door proceedings-bron, kleine experimentele opzet, fingerling-/kweekcontext en sterk voertype-afhankelijk resultaat. Eerst volledige bibliografische gegevens, methode, meetfout en statistiek verifiëren; niet gelijkstellen aan wilde meerval, natuurlijke prooikeuze of hengelaasopname.

### 113.5 Baars — nuttige uitsluitingscontrole

Mehner (1994), *Effects of temperature on allocation of metabolic energy in perch fed submaximal rations*, vergeleek juveniele baars bij 15 en 20 °C met een vaste dagelijkse voedselrantsoen. De studie vond verschillen in energieallocatie naar activiteit/onderhoud en groei, maar doordat de rantsoenhoeveelheid vastlag, levert zij geen temperatuurafhankelijke vrijwillige voedselopnamecurve. Dit blijft fysiologische context, geen directe thermische intake-respons.

### 113.6 Gevolg voor de dekking en prioriteiten

| Soort | Nieuwe kandidaat | Wat de bron mogelijk toevoegt | Huidige beslissing |
|---|---|---|---|
| Blankvoorn | Smirnov & Smirnova (2015) | Voedselzoekgedrag in temperatuurgradiënt | Gedragskandidaat; geen intakecurve |
| Baars | Smirnov & Smirnova (2019) | Voedselbeschikbaarheid × temperatuurkeuze; korte consumptiemeting | Interactiekandidaat; geen opgelegde temperatuurcurve |
| Brasem | Juveniele studie (1985) | Stikstof-/mogelijk intake-eindpunt bij 15 en 20 °C | Methode en intakebepaling eerst verifiëren |
| Meerval | Havasi et al. proceedings | Voeracceptatie en geconsumeerde hoeveelheid bij 15/20/24 °C | Directe kandidaat, lage bron-/overdraagbaarheidszekerheid |
| Baars | Mehner (1994) | Energieallocatie bij vaste rantsoenen | Niet gebruiken als thermische intakecurve |

Deze bronnen veranderen de conclusie van §110 niet: er is nog geen voldoende gevalideerde, overdraagbare dagelijkse temperatuur-voedselopnamecurve voor deze soorten. Ze verfijnen wel de onderzoeksprioriteit: controleer eerst de volledige methode van de brasemstudie en de meervalproceedings, en verifieer de exacte publicatiegegevens van de twee temperatuurgradiëntstudies. Behandel de gemeten gedrags- en intake-eindpunten afzonderlijk.

**Besluitstatus:** vier aanvullende kandidaatsporen en één expliciete uitsluitingscontrole gedocumenteerd; geen bron aan de registry toegevoegd, geen bron goedgekeurd, geen parameter/gewicht/runtime gewijzigd. Fase 2 blijft open; Fase 3 geblokkeerd.




## 114. Vervolgcontrole brasem — stikstofconsumptie versus directe voedselopname (19 november 2026)

De brontriage in §113 is uitgebreid met een tweede, oudere brasemstudie. Dit is een literatuurvervolg, geen brongoedkeuring of modelwijziging.

### 114.1 Juveniele brasem — Tatrai & Penczak (1985)

**Bron:** Tatrai, I. & Penczak, T. (1985). *Influence of temperature and rate of feeding on nitrogen metabolism of juvenile bream (Abramis brama L.)*. Comparative Biochemistry and Physiology Part A, 82(1), 125–129. DOI: 10.1016/0300-9629(85)90715-7.

De uitgeversabstract beschrijft fry van 75–1400 mg natgewicht bij 15 ± 1 en 20 ± 1 °C, dagelijks gevoerd met levend zoöplankton op een aangeboden rantsoen van 10–15% lichaamsgewicht. De publicatie rapporteert onder meer stikstofconsumptie en stikstofuitscheiding. De abstractinformatie alleen maakt nog niet duidelijk hoe niet-geconsumeerd voer werd vastgesteld en hoe de gemeten stikstofconsumptie per individu/maatklasse is berekend.

**Besluit:** kandidaat voor een beperkte, gecontroleerde voedings-/stikstofinname-respons bij zeer jonge brasem. Niet classificeren als gevalideerde vrijwillige voedselopnamecurve totdat de volledige methode is gecontroleerd. Twee temperatuurbehandelingen leveren bovendien geen optimumcurve op.

### 114.2 Brasem over bredere lichaamsmassa — Tatrai (1986)

**Bron:** Tatrai, I. (1986). *Influence of temperature, rate of feeding and body weight on nitrogen metabolism of bream, Abramis brama L.* Comparative Biochemistry and Physiology Part A, 83(3), 543–547. DOI: 10.1016/0300-9629(86)90143-X.

De uitgeversabstract rapporteert metingen van stikstofconsumptie, totale stikstof- en ammon uitscheiding en stikstofabsorptie bij brasem van 0,4–519 g natgewicht en temperaturen van 10, 15 en 20 °C. De vissen kregen dagelijks levend zoöplankton uit het Balatonmeer en gekweekte Tubifex, met aangeboden rantsoenen van 5–15% lichaamsgewicht. De abstract vermeldt dat lichaamsmassa en temperatuur gezamenlijk samenhingen met totale stikstofuitscheiding en dat de uitscheiding niet evenredig toenam met consumptie.

**Besluit:** hogere prioriteit voor volledige methodische controle dan de 1985-fry-studie, omdat meerdere temperatuurpunten en een bredere lichaamsmassaklasse zijn beschreven. De bron blijft vooralsnog abstract-only in deze audit. Stikstofconsumptie is een mogelijk direct afgeleid voedings-eindpunt, maar zonder volledige methode kan niet worden vastgesteld of dit overeenkomt met vrijwillig opgenomen voer, aangeboden rantsoen of een afgeleide stikstofbalans. De studie levert op basis van de abstractgegevens geen dagdeelrespons en geen volledige dagelijkse thermische voedselopnamecurve.

### 114.3 Gevolg voor de soortkaart

- Brasem heeft nu twee aanvullende temperatuurgerelateerde kandidaatbronnen voor stikstof-/voedingsconsumptie, maar geen geverifieerde volledige methode uit deze controle.
- De studies mogen niet worden samengevoegd tot één curve: 1985 betreft fry; 1986 omvat een veel bredere lichaamsmassaklasse en andere rantsoen-/voercontext.
- Stikstofconsumptie, totale stikstofuitscheiding en stikstofabsorptie blijven afzonderlijke responsen. Uitscheiding mag niet als directe maat voor voedselopname worden gebruikt zonder de beschreven balansmethode te controleren.
- Geen van beide studies onderbouwt een volwassen wilde brasemcurve voor Nederlandse binnenwateren, een method-feederrespons of een dag-/tijdvakbonus.

**Status:** Tatrai (1986) toegevoegd als aanvullende kandidaat voor volledige methodecontrole; Tatrai & Penczak (1985) blijft kandidaat met expliciete methode-onzekerheid. Geen bron aan de registry toegevoegd of goedgekeurd, geen score/gewicht/runtime gewijzigd. Fase 2 blijft open; Fase 3 blijft geblokkeerd.


## 115. Snoekbaars — directe prooiconsumptie bij volwassen vissen (19 november 2026)

**Bron:** Malinovskyi, O., Veselý, L., Yanes-Roca, C. & Policar, T. (2022). *The effect of water temperature, prey availability and presence of conspecifics on prey consumption of pikeperch (Sander lucioperca).* Czech Journal of Animal Science, 67(11), 465–473. DOI: 10.17221/162/2022-CJAS.

### 115.1 Experimentele opzet en direct gemeten eindpunt

Experiment 1 gebruikte tien volwassen/ subadulte kweek-/vijverafkomstige snoekbaarzen: vijf mannetjes (gemiddeld 1.070 ± 100 g; 473 ± 22 mm) en vijf vrouwtjes (1.060 ± 100 g; 464 ± 12 mm). Iedere predator verbleef afzonderlijk in een tank van 380 liter. Dezelfde prooisoort, *Pseudorasbora parva*, en vergelijkbare prooigrootte (gemiddeld 2,06 ± 0,4 g) werden aangeboden bij vijf prooidichtheden (3, 6, 12, 24 en 48 prooivissen per tank).

De temperatuur werd in opeenvolgende thermische trials verhoogd van 4,5 naar 8,5 en 12,5 °C. Elke trial duurde 12 dagen, met een geleidelijke temperatuur-/fotoperiodeaanpassing van zeven dagen tussen trials; de volledige proef duurde 64 dagen inclusief initiële aanpassing. Prooien werden dagelijks vervangen. Consumptie werd bepaald door het aantal overlevende prooivissen te tellen, dus via direct getelde verdwenen/geconsumeerde prooien en niet via groei, metabolisme of een aangeboden rantsoen.

### 115.2 Resultaten en interpretatie

De auteurs rapporteren dat prooiconsumptie bij 4,5 °C vrijwel afwezig was, dat een duidelijke stijging optrad bij 8,5 °C en dat consumptie bij 12,5 °C hoger lag. Prooidichtheid had bij alle drie temperaturen een significant effect. De algemene sekseverschillen waren niet statistisch significant. De resultaten ondersteunen dus een interactie tussen temperatuur en beschikbare prooidichtheid; ze ondersteunen geen simpele temperatuurcurve die onafhankelijk van prooiaanbod kan worden toegepast.

Experiment 2 moet afzonderlijk worden gehouden: dit gebruikte kleinere vissen (gemiddeld 560 ± 61 g), een vaste temperatuur van circa 19,8 °C en 1, 2, 4 of 8 snoekbaarzen per tank. De gemiddelde consumptie per predator was hoger in tanks met meerdere soortgenoten dan bij een solitair gehouden predator. Dit is bewijs voor een effect van sociale/tankcontext op consumptie, niet een vierde temperatuurpunt voor Experiment 1.

### 115.3 Grenzen voor overdraagbaarheid

- Sterke directe endpoint-match: dagelijks getelde consumptie van levende prooivissen, met temperatuurbehandelingen en meerdere prooidichtheden.
- De vissen waren afkomstig uit vijver-/kweekcontext en werden in RAS-tanks gehouden; dit is geen veldmeting in Nederlandse open wateren.
- De drie temperatuurtrials volgden oplopend in tijd en zijn niet als gelijktijdige, gerandomiseerde temperatuurbehandelingen beschreven. Temperatuur is daardoor niet volledig los te zien van seizoens-/tijdvolgorde en acclimatisatiegeschiedenis.
- Tien individuele predatoren vormen een beperkte steekproef; het eindpunt is consumptie van één kleine prooivissoort zonder natuurlijke habitatcomplexiteit.
- De proef geeft geen volwassen snoekbaarscurve over het volledige seizoensbereik, geen dagdeelpatroon en geen directe respons op method-feeder-aas of hengelvangbaarheid.

**Besluit:** dit is een sterke, directe kandidaatbron voor een beperkte volwassen snoekbaars-prooiconsumptierespons en voor een expliciete temperatuur × prooibeschikbaarheid-interactie. De bron verdient een hogere bewijsklasse dan studies die alleen groei, voerconversie of metabolisme meten. Zij mag nog niet worden omgezet in een algemene veldcurve of universeel optimum; daarvoor zijn onafhankelijke veld-/soortgelijke studies en verdere temperatuurdekking nodig.

## 116. Baars — voeropname bij twee temperaturen onder verstoringsexperiment (19 november 2026)

**Bron:** Strand, Å., Magnhagen, C. & Alanärä, A. (2007). *Effects of repeated disturbances on feed intake, growth rates and energy expenditures of juvenile perch, Perca fluviatilis.* Aquaculture, 265, 163–168.

De studie onderzocht herhaalde verstoring bij juveniele baars (gemiddeld 39,6 ± 14,7 g) en rapporteerde voeropname en groei bij twee gemeten temperatuurcondities: 16,6 ± 0,7 en 22,7 ± 1,1 °C. Twaalf groepen werden per behandelingscategorie gebruikt. De verstoringsbehandeling verlaagde voeropname, groei en groeiefficiëntie significant; bij beide temperaturen hadden verstoorde groepen een lagere voeropname dan niet-verstoorde groepen.

**Classificatie:** directe voeropname als meeteindpunt, maar geen zuivere temperatuur-responsstudie. De hoofdvraag en experimentele manipulatie betreffen verstoring; de twee temperaturen bieden hoogstens context voor temperatuurafhankelijke voeropname, geen breed geteste of onafhankelijk gevalideerde thermische curve. De studie is bovendien aquacultuurgericht en betreft juveniele baars. De verstoringsgevoeligheid is relevant als bewijs dat stress-/verstoringcontext voeropname kan beïnvloeden, maar mag niet worden vertaald naar een numerieke hengeldrukfactor zonder veldvalidatie.

**Besluit:** kandidaat voor contextuele kennis over verstoring en directe voeropname; niet gebruiken om een thermisch optimum of zelfstandige temperatuurcurve voor wilde baars vast te leggen.

### 116.1 Gevolg voor soortdekking

- Snoekbaars: directe prooiconsumptie bij grotere vissen is nu sterker onderbouwd dan alleen de eerder geïnventariseerde pre-spawning/kweekstudies, maar de temperatuur × prooidichtheid-interactie en de sequentiële proefopzet beperken overdraagbaarheid.
- Baars: er is directe voeropname gemeten, maar de temperatuurvergelijking is niet de primaire experimentele factor. De bestaande conclusie “geen gevalideerde thermische voedselopnamecurve” blijft daarom ongewijzigd.
- Geen van beide studies valideert een dagdeelbonus, een hengelaasrespons, persoonlijke vangstkans of een lokale Culemborg/Lokkershoek-parameter.

**Status:** twee bronnen methodisch geclassificeerd en toegevoegd aan de audit als bewijs/kandidaat, niet aan de goedgekeurde registry. Geen runtime, score, gewicht of gebruikersinvoer gewijzigd. Fase 2 blijft open; Fase 3 blijft geblokkeerd.

## 117. Meerval — proceedingsbron met directe dagelijkse voeropname (19 november 2026)

**Bron:** Havasi, M., Oláh, T., Felföldi, Z. & Bercsényi, M. (2011). *Passing times of two types of feeds in Wels (Silurus glanis) at three different temperatures.* In: *Diversification in Inland Finfish Aquaculture*, Abstract Book, University of South Bohemia, p. 49. ISBN 978-80-87437-14-8.

De volledige abstractboeking is teruggevonden. De proef gebruikte meerval-fingerlings van 38,03 ± 8,04 g, twee voersoorten (commercieel droogvoer en visprooi), drie temperaturen (15, 20 en 24 °C), tien vissen per aquarium en drie replicaten. De auteurs rapporteerden voeracceptatie én dagelijkse gemiddelde geconsumeerde voerhoeveelheid. Bij 15 °C accepteerde 42,4% van de droogvoer-groep het voer, tegenover 90,9% van de groep met visprooi; bij 20 en 24 °C werd in beide voerbehandelingen 100% voeracceptatie gerapporteerd. De dagelijkse consumptie varieerde volgens de abstract tussen 3,20–10,68% lichaamsgewicht voor visprooi en 1,36–4,46% voor droogvoer.

Bij 15 °C lag de gemeten hoeveelheid volgens de auteurs rond de meetfoutgrens, waardoor de passage-/doorgangstijd onzeker was. De abstract rapporteert bij 20 °C start van uitscheiding 26 uur na voeren, gedurende 22 uur; bij 24 °C startte dit na 10 uur en duurde 18 uur.

**Classificatie:** directe dagelijkse voeropname/acceptatie is gerapporteerd, dus dit is een relevantere kandidaat dan uitsluitend groei- of metabolismeonderzoek. De bron blijft een studentpresentatie/abstract in proceedings, met beperkte methodedetails, kleine kweekopzet, fingerling-levensfase en sterk voertype-afhankelijk resultaat. De 15 °C-meetfout maakt vooral de koudebehandeling onzeker. Er is geen basis om de cijfers naar volwassen wilde meerval, natuurlijke prooikeuze of hengelaas te vertalen.

**Besluit:** kandidaat voor een beperkte jonge-kweekmeerval voeracceptatie- en consumptierespons. Geen goedgekeurde dagelijkse thermische curve; volledige ruwe data/statistische methode en onafhankelijke replicatie ontbreken.

## 118. Blankvoorn — historische directe consumptie- en darmdoorgangsliteratuur

### 118.1 Hofer & Niederholzer (1980): dagelijkse relatieve consumptie

**Bron:** Hofer, R. & Niederholzer, R. (1980). *The feeding of roach (Rutilus rutilus L.) and rudd (Scardinius erythrophthalmus L.). 2. Feeding experiments in the laboratory.* Ekologia Polska, 28(1), 61–70.

Een bibliografische samenvatting meldt laboratoriumproeven naar dagelijkse relatieve consumptie en relatieve darminhoud bij vier temperaturen en vier diëten voor blankvoorn en rietvoorn. De gerapporteerde dagelijkse relatieve consumptie verschilde sterk per dieet; bij draadalgen en meelwormen bleef zij onder 8%, terwijl bij Chara/Zannichellia waarden tot 40% werden genoemd.

**Classificatie:** interessante kandidaat voor direct gemeten consumptie onder gecontroleerde temperatuur- en dieetcondities, maar de volledige primaire publicatie en exacte temperatuurbehandelingen, visgrootte, replicaten en meetmethode zijn nog niet gecontroleerd. De sterke dieetafhankelijkheid maakt duidelijk dat een enkele soortcurve niet zonder voedseltype/context kan worden geïnterpreteerd.

**Besluit:** alleen kandidaat voor verdere bronverificatie; niet opnemen in registry en geen numerieke thermische respons afleiden uit de secundaire samenvatting.

### 118.2 Hofer, Forstner & Rettenwander (1982): darmdoorgang is geen voedselopnamecurve

**Bron:** Hofer, R., Forstner, H. & Rettenwander, R. (1982). *Duration of gut passage and its dependence on temperature and food consumption in roach, Rutilus rutilus L: laboratory and field experiments.* Journal of Fish Biology, 20(3), 289–299. DOI: 10.1111/j.1095-8649.1982.tb04710.x.

Deze studie onderzoekt hoe temperatuur, dieet en consumptiesnelheid de darmpassagetijd beïnvloeden. De samenvatting meldt snellere voedselpassage bij hogere temperatuur en hogere consumptie, regressies bij vier temperaturen en een veldmethode om darmpassagetijd en consumptiesnelheid in natuurlijke populaties te schatten.

**Classificatie:** relevante methodische/veldcontext voor het schatten van consumptie, maar het primaire eindpunt is darmpassagetijd als functie van temperatuur en consumptie. Het is geen zelfstandige temperatuur-respons van vrijwillige voedselopname en mag niet als zodanig worden gebruikt.

### 118.3 Gevolg voor blankvoorn

De literatuur biedt nu drie verschillende bewijsrichtingen die gescheiden moeten blijven: (1) voedselzoekgedrag en temperatuurkeuze in een gradiënt (§113), (2) dagelijkse consumptie onder gecontroleerde dieet-/temperatuurcondities (1980, nog te verifiëren), en (3) darmpassagetijd/veldschatting van consumptie (1982). Geen van deze afzonderlijke bronnen levert op dit moment een gevalideerde, overdraagbare dagelijkse thermische voedselopnamecurve voor wilde blankvoorn in Nederlandse binnenwateren.

**Status:** meervalproceedings volledig op abstractniveau methodisch uitgewerkt; twee blankvoornbronnen als kandidaten/meetmethodische context toegevoegd. Geen registry-goedkeuring, geen runtime-, score-, gewicht- of parameterwijziging. Fase 2 blijft open; Fase 3 geblokkeerd.


## 119. Baars en blankvoorn — temperatuurafhankelijke prooivangst en foerageergedrag (19 november 2026)

**Bron:** Linløkken, A.N., Bergman, E. & Greenberg, L. (2010). *Effect of temperature and roach Rutilus rutilus group size on swimming speed and prey capture rate of perch Perca fluviatilis and R. rutilus.* Journal of Fish Biology, 76, 900–912. DOI: 10.1111/j.1095-8649.2010.02545.x.

De studie bevat twee afzonderlijke laboratoriumexperimenten. In het temperatuur-experiment werden baars en blankvoorn getest bij 4, 8, 12, 16 en 20 °C. De gemeten eindpunten waren zwemsnelheid en prooivangst/ capture rate. Baars had een lagere zwemsnelheid en vangstsnelheid dan blankvoorn, vooral bij 4 en 8 °C. Het tweede experiment onderzocht de invloed van aantallen blankvoorns (0, 2, 4 en 6) op beide soorten bij een vaste temperatuur van 16 °C. Bij baars waren zwemsnelheid en vangstsnelheid het laagst bij de hoogste blankvoorn-abundantie; blankvoorn werd relatief weinig beïnvloed. Baars bevond zich tijdens het foerageren vaker dichter bij de bodem, vooral bij hoge blankvoorn-abundantie.

**Classificatie:** directe gedrags-/prooivangstrespons, geen dagelijkse voedselopname. De temperatuurreeks is relevant voor de efficiëntie van het vangen van natuurlijke prooien in een laboratoriumopstelling. Dit is dichter bij foraging success dan groei of metabolisme, maar nog steeds geen hengelaasrespons, geen vrijwillige dagelijkse intake en geen persoonlijke vangstkans. Het groepsgrootte-experiment is een afzonderlijke 16 °C-proef en mag niet worden vermengd met de temperatuurreeks.

**Besluit:** bruikbare kandidaat voor een soortspecifieke, contextgebonden foerageer-/prooivangstrespons bij baars en blankvoorn. Niet gebruiken als thermische voedselopnamecurve of als directe voorspeller van vangst met een hengel. De bestaande soortkaarten blijven correct waar zij stellen dat geen voldoende gevalideerde dagelijkse thermische voedselopnamecurve beschikbaar is.

## 120. Roofblei — volwassen beweging, seizoen en dagdeel (telemetrie, geen voedingsmeting)

**Bron:** Kärgenberg, E., Sandlund, O.T., Thorstad, E.B., Thalfeldt, M., Økland, F., Kaasik, A. & Tambets, M. (2022). *Annual and diel activity cycles of a northern population of the large migratory cyprinid fish asp (Leuciscus aspius).* Environmental Biology of Fishes. DOI: 10.1007/s10641-022-01298-6.

In een natuurlijk Ests meer-riviersysteem zijn volwassen roofbleien gedurende 32 maanden met akoestische telemetrie gevolgd. In de analyse werden 53 individuen en 12.435 bewegingsactiviteit-gebeurtenissen gebruikt. Activiteit in de betekenis van geregistreerde bewegingen was doorgaans hoger rond zonsopkomst of zonsondergang dan midden op de dag of 's nachts, maar de dagdeelpatronen verschilden tussen maanden en waren niet in alle jaren consistent. In juni, juli en september werd geen significant verschil tussen de vier dagperioden gevonden. De bewegingssnelheid hing samen met watertemperatuur en afvoer; de auteurs beschrijven een duidelijke seizoensverhoging van beweging in de warmere periode.

Belangrijk: de studie meet verplaatsingen tussen akoestische ontvangers, geen voedselopname, prooiaanvallen of vangsten. De aanduiding van de warme periode als hoofdvoedingsperiode is gebaseerd op eerder gepubliceerde literatuur en eigen niet-gepubliceerde gegevens, niet op een directe voedingsmeting in deze telemetrieanalyse. Ook werd bijna 20% van de tijd in meren doorgebracht waar beweging niet op dezelfde wijze kon worden gemeten.

**Classificatie:** sterke veldbron voor volwassen roofblei-beweging, seizoensactiviteit en variabele dagdeelpatronen; geen directe voedingsrespons. De studie ondersteunt nadrukkelijk geen universele schemerbonus: de patronen veranderen per maand en ontbreken in meerdere zomermaanden. Habitat, licht en rivierafvoer zijn mede bepalend.

**Besluit:** opnemen als context voor habitat-/bewegingshypothesen en als uitsluitingscontrole tegen het gelijkstellen van beweging aan voeren. Geen tijdvakgewicht, voedingslabel of vangstkans afleiden. De bestaande scheiding tussen activiteit, aanwezigheid, voedselzoekgedrag, daadwerkelijke consumptie en vangbaarheid blijft gehandhaafd.

### 120.1 Gevolg voor de modelarchitectuur

- Prooivangstsnelheid (baars/blankvoorn) is een gedragsmatige tussenmaat en moet gescheiden blijven van dagelijkse voedselopname.
- Telemetriebeweging (roofblei) is een activiteits-/verplaatsingsmaat en mag niet als voedingsactiviteit worden gelabeld.
- Dagdeelrespons is seizoens- en contextafhankelijk; deze bronnen onderbouwen geen vaste ochtend-/schemer-/avondbonus.
- Geen van beide bronnen levert een persoonlijke hengelvangstkans of een bewezen respons op method-feeder-aas.

**Status:** twee aanvullende primaire bronnen methodisch geclassificeerd. Geen bron goedgekeurd voor numerieke runtime, geen score/gewicht/parameter aangepast. Fase 2 blijft open; Fase 3 geblokkeerd.


## 121. Meerval — dagelijkse voerrantsoenen bij twee temperatuurbanden (1997)

**Bron:** Filipiak, J., Sadowski, J. & Trzebiatowski, R. (1997). *Comparative analysis of results of using different food rations in juvenile wels (Silurus glanis) culture.* Acta Ichthyologica et Piscatoria, 27(1), 41–51. DOI: 10.3750/AIP1997.27.1.03.

De studie volgde twee gewichtsklassen juveniele Europese meerval in kooien met koelwater gedurende 49 dagen: circa 65 ± 10 g en 110 ± 10 g per vis. Semi-geëxtrudeerd voer met 48,5% ruw eiwit en 14,4% lipiden werd aangeboden in vijf rantsoenen (1,0; 1,5; 2,0; 2,5 en 3,0% van het metabole lichaamsgewicht, W^0,8). De watertemperatuur daalde gedurende de proef: de auteurs rapporteren een dagelijkse voervraag van circa 2% W^0,8 bij 24–28 °C en maximaal 1,5% W^0,8 bij 18–23 °C. De tekst vermeldt dat de temperatuurdaling samenviel met een afname van de voervraag en een verandering in voederconversie.

**Classificatie:** relevante directe kweekinformatie over dagelijkse voerbehoefte/-rantsoen van juveniele meerval onder twee temperatuurbanden. Dit is niet zonder meer een zuivere vrijwillige voedselopnamecurve: de proef vergelijkt aangeboden rantsoenen, de temperatuur veranderde tijdens de 49-daagse proef en de abstract-/beschikbare tekst maakt niet volledig duidelijk hoe individuele consumptie, voerresten en verzadiging per temperatuurstap zijn vastgesteld. Het betreft bovendien juveniele kweekvis en geëxtrudeerd droogvoer, niet volwassen wilde meerval of natuurlijke prooi/method-feeder-aas.

**Besluit:** toevoegen als kandidaatbewijs voor temperatuurgerelateerde dagelijkse voerbehoefte bij juveniele gekweekte meerval, met lagere bewijskracht voor vrijwillige intake en beperkte overdraagbaarheid. Niet gebruiken om een thermisch optimum, volwassen veldrespons of numerieke runtimecurve af te leiden. De 2011-proceedingsbron (§117) blijft een afzonderlijke voeracceptatie-/consumptieproef met ander visformaat, voer en experimentele opzet; de twee studies mogen niet tot één curve worden samengevoegd.

## 122. Blankvoorn — Hofer & Niederholzer (1980), verificatiestatus van dagelijkse consumptie

**Bron:** Hofer, R. & Niederholzer, R. (1980). *The feeding of roach (Rutilus rutilus L.) and rudd (Scardinius erythrophthalmus L.). 2. Feeding experiments in the laboratory.* Ekologia Polska, 28(1), 61–70.

Een aanvullende bibliografische samenvatting bevestigt dat de studie dagelijkse relatieve consumptie en relatieve darminhoud onderzocht bij vier temperaturen en vier diëten voor blankvoorn en rietvoorn. De gerapporteerde consumptie verschilde sterk per dieet: minder dan 8% lichaamsgewicht voor draadalgen en meelwormen, tegenover maxima tot 40% bij Chara of Zannichellia. De samenvatting noemt bij 16–24 °C ook een relatie tussen consumptie en darmpassagesnelheid.

**Classificatie:** de bibliografische beschrijving ondersteunt dat dagelijkse relatieve consumptie daadwerkelijk onderwerp van de laboratoriumstudie was. De primaire publicatie zelf is in deze auditronde niet volledig toegankelijk/verifieerbaar; exacte temperatuurbehandelingen, visgrootte, replicaten, proefduur, berekening van consumptie en de scheiding tussen aangeboden en werkelijk gegeten voer zijn daarom nog niet gecontroleerd. De sterke dieetafhankelijkheid is een belangrijke beperking voor overdraagbaarheid naar natuurlijke prooi of hengelaas.

**Besluit:** opwaarderen van een louter losse kandidaat naar een bibliografisch bevestigde kandidaat voor directe dagelijkse consumptiemeting, maar niet naar gevalideerd modelbewijs. Geen numerieke curve of temperatuurrespons afleiden totdat de primaire methoden en resultaten zijn gecontroleerd. De darmpassagetijd blijft een afzonderlijke respons en mag niet als voedselopname worden gebruikt.

### 122.1 Gevolg voor soortdekking

- Meerval heeft nu twee afzonderlijke gecontroleerde kweekbronnen over dagelijkse voerbehoefte/consumptie of voeracceptatie (§117 en §121). Beide betreffen juveniele vis en kunstmatig voer; geen van beide valideert volwassen wilde vis of een veldcurve.
- Blankvoorn heeft een sterkere bibliografische aanwijzing voor directe dagelijkse consumptiemeting (§122), maar de primaire methodiek blijft een expliciete verificatiegap.
- Geen van deze bronnen valideert een tijdvakbonus, lokale Nederlandse veldrespons of persoonlijke hengelvangstkans.
- Alle bronnen blijven bewijs voor audit/triage; er wordt geen registry-record goedgekeurd voor numerieke voorspelling.

**Status:** twee aanvullende broncontroles vastgelegd. Geen score, gewicht, parameter, runtime of gebruikersinvoer aangepast. Fase 2 blijft open; Fase 3 blijft geblokkeerd.


## 123. Snoek — wilde veldmetingen van voedselopname en dagritme via hartslagtelemetrie (1991)

**Bron:** Lucas, M.C., Priede, I.G., Armstrong, J.D., Gindy, A.N.Z. & De Vera, L. (1991). *Direct measurements of metabolism, activity and feeding behaviour of pike, Esox lucius L., in the wild, by the use of heart rate telemetry.* Journal of Fish Biology, 39, 325–345.

In juni 1988 werden drie wilde snoeken in twee Schotse meren gevolgd. Twee vissen in Loch Kinord leverden bruikbare langere registraties op van respectievelijk 72 en 90 uur; de derde vis werd 20 uur gevolgd. De auteurs schatten voor de twee Kinord-vissen de dagelijkse voedselopname uit postprandiale hartslag/Specific Dynamic Action op circa 1,4–1,6% van het natte lichaamsgewicht per dag vóór temperatuurcorrectie en circa 0,9–1,4% na correctie. De auteurs vatten de typische opname samen als ongeveer 1,0–1,5% lichaamsgewicht per dag. De waargenomen kleine prooien werden overdag gevangen; de verteringsrespons liep door in middag en avond, met rustige perioden 's nachts. De vermoedelijke prooi bestond uit kleine baarsbroedjes die lokaal zeer talrijk waren. Eén afzonderlijk geschat maaltijdmoment kwam overeen met circa 8 g baars.

De watertemperatuur varieerde tijdens de korte veldregistraties (ongeveer 16–19,5 °C bij vis 1 en 17,5–22 °C bij vis 2). De auteurs corrigeerden de hartslag-baseline voor temperatuur, maar manipuleerden temperatuur niet experimenteel. De voedselopname is indirect berekend uit hartslag en aannames over het deel van maaltijdenergie dat als verteringsmetabolisme vrijkomt; de auteurs bespreken onzekerheden en de kleine, arbeidsintensieve steekproef.

**Classificatie:** waardevolle directe veldbenadering van dagelijkse voedselopname en dagritme bij wilde snoek; sterker voor de scheiding tussen foerageren en verteren dan een uitsluitend laboratoriumgroei-onderzoek. Geen zuivere temperatuur-responsstudie, geen representatieve populatiecurve en geen bewijs dat dezelfde tijdverdeling geldt bij andere prooibeschikbaarheid, seizoenen of wateren.

**Besluit:** gebruiken als contextbewijs voor volwassen/wilde snoekvoeding en voor het onderscheid tussen vangst-/foerageermoment en daaropvolgende vertering. Niet gebruiken als numerieke thermische curve, universele dagdeelbonus of hengelvangstkans. De geschatte opname mag niet worden geïnterpreteerd als een directe meting van aasacceptatie.

## 124. Baars — dagelijkse rantsoenen van volwassen veldvis (Thorpe, 1977)

**Bron:** Thorpe, J.E. (1977). *Daily ration of adult perch, Perca fluviatilis L. during summer in Loch Leven, Scotland.* Journal of Fish Biology, 11(1), 55–68. DOI: 10.1111/j.1095-8649.1977.tb04098.x.

Volwassen baars werd in juni–september 1971 en in juni en augustus 1972 op drie-uursintervallen gedurende volledige 24-uursperioden bemonsterd. De onderzoekers combineerden maaginhoud bij vangst met maagledigingsmetingen bij tijdelijk gekooide vissen om de consumptie tussen bemonsteringstijden te schatten. De berekende dagelijkse rantsoenen daalden van circa 6,5% nat lichaamsgewicht in juni naar circa 3,2% in september. De auteurs merkten op dat maaglediging bij gekooide vissen langzamer was dan bij vrij levende vissen; de berekende voedselomzet was daarom een minimumschatting.

**Classificatie:** directe veldschatting van dagelijkse consumptie bij volwassen baars, met een relevante seizoenscomponent. De studie is geen gecontroleerde temperatuurproef: seizoen, prooiaanbod, reproductieve toestand en andere ecologische factoren veranderen gelijktijdig. De waarden zijn bovendien locatie- en dieetgebonden (Loch Leven) en de methode onderschatte waarschijnlijk de werkelijke voedselomzet.

**Besluit:** belangrijke veldreferentie voor seizoensvariatie in volwassen baarsconsumptie. Niet omzetten naar een temperatuurcurve of rechtstreeks naar vangst met hengelaas. De drie-uursbemonstering is waardevol voor dagritme-analyse, maar de dagelijkse rantsoenwaarden alleen leveren geen universeel beste hengeltijdvak.

## 125. Blankvoorn en brasem — in-situ dag-nachtpatroon van zoöplanktonconsumptie (2004)

**Bron:** Vašek, M. & Kubečka, J. (2004). *In situ diel patterns of zooplankton consumption by subadult/adult roach Rutilus rutilus, bream Abramis brama, and bleak Alburnus alburnus.* Folia Zoologica, 53(2), 203–214.

De studie onderzocht subadulte en adulte blankvoorn, brasem en alver in het meso-eutrofe Římov-reservoir (Tsjechië). De onderzochte vissen foerageerden vrijwel uitsluitend op microcrustaceeën in het plankton. Alle drie soorten vertoonden een daggebonden voedingsperiodiciteit, met een duidelijke daling van maagvulling gedurende de nacht. De dag-nachtvariatie werd vastgesteld bij verschillende lengteklassen en seizoensmomenten: onder meer blankvoorn van circa 200–270 mm en brasem van circa 220–330 mm in mei, en kleinere lengteklassen van circa 110–170 mm in augustus. De samenvatting rapporteert dagelijkse zoöplanktonconsumptie tussen 1,5% nat lichaamsgewicht bij grotere brasem en 9,9% bij kleinere alver; die uitersten mogen niet aan blankvoorn of brasem afzonderlijk worden toegeschreven.

**Classificatie:** veldbewijs voor dag-nachtverschillen in maagvulling/zoöplanktonconsumptie bij subadulte en adulte cypriniden. De waargenomen periodiciteit is gekoppeld aan planktonvoeding, lichtintensiteit, lengteklasse en seizoen. Het is geen directe respons op method-feeder-aas, geen algemene voedingscurve voor andere diëten en geen bewijs dat alle brasem- of blankvoornpopulaties hetzelfde tijdpatroon volgen.

**Besluit:** relevante kwalitatieve veldbron voor soort- en levensfasegebonden dag-nachtcontext bij blankvoorn en brasem. Geen vaste ochtend-/avondbonus afleiden; geen numerieke factor activeren zonder passende lokale validatie en kennis van het relevante voedseltype.

### 125.1 Gevolg voor soortdekking en tijdvakbewijs

- Snoek heeft nu een kleinschalige maar directe veldbenadering van dagelijkse voedselopname en dagritme (§123); temperatuur is gecorrigeerd, niet experimenteel gevarieerd.
- Baars heeft directe volwassen veldschattingen van dagelijkse consumptie en seizoensvariatie (§124), maar geen zuivere temperatuurcurve.
- Blankvoorn en brasem hebben een in-situ dag-nachtbron voor planktonconsumptie (§125); overdraagbaarheid naar benthisch voer, pellets of method-feeder-presentatie is niet aangetoond.
- Dagritme, dagelijkse hoeveelheid, prooivangst, vertering en hengelvangst blijven aparte responsen.
- Geen bron wordt hierdoor automatisch goedgekeurd voor numerieke runtime; alle tijdvakclaims blijven bewijs- en contextgebonden.

**Status:** drie aanvullende veldbronnen methodisch geclassificeerd. Geen score, gewicht, parameter, runtime of gebruikersinvoer aangepast. Fase 2 blijft open; Fase 3 blijft geblokkeerd.


## 126. Meerval — veldtelemetrie nuanceert een universeel nachtpatroon (2012)

**Bron:** Slavík, O. & Horký, P. (2012). *Diel dualism in the energy consumption of the European catfish Silurus glanis.* Journal of Fish Biology, 81, 2223–2234. DOI: 10.1111/j.1095-8649.2012.03436.x.

Twintig Europese meervallen werden met EMG-fysiologische telemetriesensoren gevolgd tijdens dag-nachtcycli in het voorjaar en de zomer in de Elbe en Berounka (Tsjechië). De veldresultaten lieten twee patronen zien in het gebruik van licht- en donkerperioden. Ongeveer 35% van de individuen week af van het lokale, meer gebruikelijke dagritme. Er was aanzienlijke individuele variatie in EMG-activiteit ten opzichte van lichaamsmassa. De auteurs vonden ook dat het patroon van individuen met relatief hoge energieconsumptie verschilde van dat van individuen met een lager energieverbruik. Hogere watertemperatuur hing samen met hogere EMG-waarden; hogere afvoer/stroming hing samen met lagere waarden.

**Classificatie:** veldmeting van locomotorische/fysiologische activiteit en energieverbruik, geen directe voedselopname, prooiaanval of maagvulling. De studie is daarom niet in te zetten als bewijs voor nachtelijk voeren, maar wel als waarschuwing dat één soortbreed dag-nachtpatroon individuele verschillen kan verbergen.

**Besluit:** toevoegen als veldcontext voor meervalactiviteit en individuele ritmevariatie. Niet gebruiken als voedingslabel, temperatuur-voedselopnamecurve of universele nachtbonus. De laboratoriumstudie van Boujard (1995) over sterk nachtelijke zelfvoeractiviteit (§110) blijft een andere respons en experimentele context.

## 127. Bijgewerkte soortdekking na de aanvullende bronaudit (§§117–126)

Deze delta actualiseert de interpretatie van de responskaarten in §110. Zij vervangt geen registryrecord en verandert de operationele bronstatus niet. De aanvullende auditbronnen hieronder zijn niet automatisch aan researchRegistry.ts toegevoegd en geen ervan is goedgekeurd voor numerieke runtime.

| Soort | Aanvullend bevestigd bewijs | Wat dit wél ondersteunt | Wat dit niet ondersteunt |
|---|---|---|---|
| Karper | Bestaande directe gecontroleerde voedselopname- en veldcontext uit §§109–111 | Contextgebonden temperatuur-/voedingsrespons | Een universele lokale curve of vaste optimumwaarde |
| Brasem | In-situ dag-nachtpatroon van planktonconsumptie bij subadult/adult (§125); oudere dagelijkse rantsoen- en stikstofstudies (§114) | Kwalitatieve, dieet- en levensfasegebonden dagvoedingscontext | Een thermische voedselopnamecurve of overdracht naar pellets/benthisch voer zonder validatie |
| Snoek | Hartslagtelemetrie bij wilde snoek, met geschatte dagelijkse opname en overdag foerageren (§123); afzonderlijke 0+-predatiestudie (§112) | Directe maar contextgebonden veld-/predatie-informatie; onderscheid tussen voedselopname en vertering | Een geïsoleerde temperatuurcurve, volwassen populatiegemiddelde of universeel tijdvakgewicht |
| Baars | Volwassen dagelijkse veldrantsoenen en seizoensverloop (§124); temperatuurafhankelijke prooivangst (§119) | Directe consumptie- en foerageertussenmaten in afzonderlijke contexten | Een dagelijkse thermische voedselopnamecurve of hengelaasrespons |
| Blankvoorn | Bibliografisch bevestigde laboratoriumconsumptie bij vier temperaturen en diëten (§122); in-situ dag-nacht-planktonconsumptie (§125); prooivangst (§119) | Directe, maar dieet-/levensfasegebonden consumptie- en foerageercontext | Een gevalideerde thermische curve voor wilde Nederlandse blankvoorn |
| Zeelt | Bestaande directe vergelijking bij 18 en 25 °C (§109) | Beperkte directe temperatuur-voedselopnamevergelijking | Een volledig thermisch optimum of brede veldcurve |
| Snoekbaars | Directe prooiconsumptie bij 4,5/8,5/12,5 °C (§115); volwassen telemetrie betreft beweging, geen voeding (Poulet et al., 2015) | Beperkte gecontroleerde prooiconsumptierespons en afzonderlijke bewegingscontext | Een algemene volwassen veldcurve of vaste schemerbonus |
| Meerval | Juveniele kweekrantsoenen/voeracceptatie (§117 en §121); nocturnale zelfvoerproef (Boujard 1995); individuele veldactiviteit via EMG (§126) | Beperkte directe kweek-voerrespons en sterke context-/individuele verschillen in dagritme en activiteit | Een volwassen wilde dagelijkse thermische voedingscurve of één universeel nachtpatroon |
| Roofblei | Volwassen telemetrie van beweging en variabele dagdeelpatronen (§120) | Seizoens- en habitatgebonden bewegingscontext | Directe voedselopname, prooivangst of een vaste schemerbonus |

**Interpretatie:** de aanvullende bronnen maken de bewijsdekking rijker, maar niet homogener. Een soort kan directe dagelijkse consumptie in een specifieke dieet-/veldcontext hebben zonder dat er een temperatuurcurve beschikbaar is. Evenzo kan telemetrie een dag-nachtritme van beweging tonen zonder iets rechtstreeks over voeren te meten. De centrale bewijsclassificatie blijft daarom per gemeten respons, levensfase, voedseltype, watertype, seizoen en onderzoeksopzet.

**Vervolg:** de volgende stap is niet het activeren van gewichten, maar het sluiten van de formele respons-/bronmatrix en het vaststellen welke responsen überhaupt onafhankelijk kunnen worden geëvalueerd met toekomstige lokale sessiegegevens. Alle ontbrekende of niet-overdraagbare informatie blijft expliciet onzeker. Fase 2 blijft open; Fase 3 blijft geblokkeerd.


## 128. Roofblei — seizoensvariatie in maagvulling en dieet in de Donau (2010)

**Bron:** Krpo-Ćetković, J., Hegediš, A. & Lenhardt, M. (2010). *Diet and growth of asp, Aspius aspius (Linnaeus, 1758), in the Danube River near the confluence with the Sava River (Serbia).* Journal of Applied Ichthyology, 26, 513–521. DOI: 10.1111/j.1439-0426.2010.01456.x.

De studie analyseerde 198 roofbleien uit een 28,5 km lang deel van de Donau. De lengte varieerde van 90 tot 405 mm en het gewicht van 5 tot 567 g; de steekproef bestond voornamelijk uit subadulte vissen van 0+ tot 4+ jaar. Het dieet bestond uitsluitend uit vis, met onder meer alver, blankvoorn en goudvis als belangrijke prooien. De seizoensgebonden vacuïteitsindex (aandeel lege magen) was het hoogst in november (94,1) en het laagst in juli (35,6). De breedte van het trofische niche was het grootst in mei en het kleinst in november.

**Classificatie:** veldonderzoek naar dieet en seizoensgebonden maagvulling bij voornamelijk subadulte roofblei. De vacuïteitsindex is een momentopname van lege magen in de verzamelde steekproef en geen directe dagelijkse consumptiesnelheid of voedingsactiviteit per uur. De studie meet geen temperatuurrespons en de seizoensverschillen kunnen samenhangen met prooiaanbod, migratie, reproductiestatus en andere seizoensprocessen.

**Besluit:** aanvulling op de roofblei-responskaart: er is wel degelijk veldbewijs voor seizoensvariatie in dieet/maagvulling, naast de volwassen bewegings-telemetrie uit §120. Er is nog geen directe volwassen dagelijkse voedselopnamecurve, thermische voedingscurve of gevalideerd dag-nachtritme voor roofblei. De telemetriebeweging en seizoensmaagvulling blijven twee verschillende responsen.

### 128.1 Gevolg voor de soortdekking

- Roofblei: seizoensgebonden dieet en maagvulling zijn nu aanvullend gedocumenteerd in een voornamelijk subadulte rivierpopulatie; volwassen telemetrie geeft afzonderlijke informatie over beweging en dagdeelvariatie.
- De twee bronnen mogen niet worden gecombineerd tot een dagdeel- of temperatuurvoedingsscore: ze meten andere populaties, perioden en responsen.
- De studie ondersteunt geen numerieke voedingsfactor, geen vaste schemerbonus en geen persoonlijke hengelvangstkans.

**Status:** één aanvullende primaire veldbron methodisch geclassificeerd. Geen registry-goedkeuring, score, gewicht, parameter, runtime of gebruikersinvoer gewijzigd. Fase 2 blijft open; Fase 3 geblokkeerd.



## 129. Geactualiseerde Fase-2-acceptatiecrosswalk na audit §§102–128 (19 november 2026)

Deze crosswalk actualiseert de historische momentopname in §89. De productdoelrespons (§103), minimale vangstregistratie (§104), factor-naar-responsmatrix (§105), normalisatie-/coverage-architectuur (§106), technische thermische audit (§107), bronherkomst (§108) en aanvullende soortresponsstudies (§§109–128) zijn nu beschikbaar. De factorinventaris is gesloten; dat betekent niet dat het modelontwerp, de validatie of de formele faseacceptatie klaar is.

| Formeel criterium | Actuele beoordeling | Aantoonbaar gereed | Resterend vóór formele acceptatie |
|---|---|---|---|
| 1. Gescheiden biologische responsen | **Grotendeels geborgd** | Productdoel is vastgelegd: één bestaande 1–10-dagscore voor verwachte biologische activiteit-/voedingspotentie. Thermische respons, voeding/foerageren, beweging/habitat, persoonlijke vangstkans, vangbaarheid en onzekerheid zijn afzonderlijk gedefinieerd. De huidige score blijft uitsluitend thermisch; VisCoach maakt geen tweede prognose. | Definitieve kandidaataggregatie moet aantonen dat uitsluitend responsen met hetzelfde doel worden gecombineerd en geen beweging, habitat, vangbaarheid of betrouwbaarheid binnensluipt. Geen runtime-integratie zolang dit niet gevalideerd is. |
| 2. Bronkwaliteit en overdraagbaarheid | **Gedeeltelijk; formele blocker blijft** | De factor- en soortinventaris is uitgebreid tot §§109–128. Studies zijn per werkelijk gemeten respons geclassificeerd; dieet, beweging, groei, metabolisme, prooivangst en voedselopname worden niet gelijkgesteld. Thermische optie A is expliciet behouden als voorlopige mechanistische prior. | De exacte bestaande thermische curveparameters en scoremapping zijn niet onafhankelijk biologisch gevalideerd. Alle registryrecords blijven approvedForPrediction=false; aanvullende voedingsbronnen zijn kandidaat/context en leveren nog geen toegelaten numerieke voedingsfactor. Optie A is een transparant productbesluit, geen wetenschappelijke validatie. |
| 3. Water- en omgevingsdata | **Technische provenance grotendeels gereed; lokale dekking beperkt** | Gemeten, geschatte en onbekende watertemperatuur zijn onderscheiden; bron, meettijd en onzekerheid worden gevolgd. Luchttemperatuur vervangt geen watertemperatuur. Onbekende zuurstof, troebelheid, stroming en prooiaanbod zijn expliciet onbekend en worden niet uit weer afgeleid. | De statusoverdracht van placeholder/geschatte waarden naar snapshots en evaluatie moet end-to-end aantoonbaar blijven. Er is geen actuele lokale DO-/NTU-/stromingsmeting; deze factoren blijven uitgesloten/context. Lokale thermische responskalibratie wacht op echte meet- en responsdata. |
| 4. Tijdvak- en gedragslogica | **Nog niet biologisch gevalideerd** | Soortspecifiek voedings-/dielbewijs is uitgebreid geïnventariseerd en strikt gescheiden van bewegingstelemetrie. Gekozen sessiestart en tijdmetadata bestaan; geen generieke schemer-/nachtbonus is toegestaan. | Dezelfde dagbrede thermische analyse wordt momenteel in alle vier tijdvakken hergebruikt. Er is geen onafhankelijke tijdvakrespons/score of directe lokale voedingslabelset. Ontwerp moet bepalen wanneer tijdvakken gelijkwaardig blijven en welke tijdvaklabels/metrics geldig zijn. |
| 5. Lokale leer- en evaluatieketen | **Technische basis gereed; biologische evaluatie onvolledig** | Prognosesnapshots, sessiekoppeling, chronologische persoonlijke vangstkans en Brier/BSS bestaan. Watertemperatuur heeft aparte MAE/RMSE/bias-evaluatie. | Brier blijft uitsluitend voor persoonlijke vangstkans. Onafhankelijke labels en metrics voor thermische activiteit, voedselopname/foerageren, habitat/aanwezigheid, tijdvakrangschikking en samengestelde 1–10-score moeten nog worden gedefinieerd en op beschikbare data haalbaar worden gemaakt. Een hengelvangst of nulvangst is geen zuiver voedingslabel. |
| 6. Gebruiksvriendelijkheid en VisCoach | **Productcontract gereed; tactische consistentie deels open** | Eén bestaande score en eenvoudige invoer blijven behouden. Vangstregistratiecontract (§104) vraagt alleen soort; tijdstip automatisch en aanpasbaar; hengel/methode en gewicht optioneel. VisCoach consumeert de centrale prognose. | Bestaande vangstflow moet aantoonbaar tegen §104 zijn gecontroleerd. De exacte numerieke voorvoer-suitability/gramadviezen zijn afzonderlijk geaudit (§96), maar de keuze om ze uit te schakelen is nog niet door de eigenaar goedgekeurd. De afwijking waarbij de algemene prognoseview exacte grammen direct toont bij lage invoerkwaliteit moet worden opgelost of expliciet geaccepteerd; geen runtimewijziging zonder besluit. |
| 7. Technische borging | **Grotendeels gereed; per wijziging opnieuw vereist** | Regressie-/integratietests, snapshot- en evaluatiecontroles en de exacte PR-head/mergecommit Quality Gate-workflow bestaan. PR #175 is op 19 november 2026 gemerged; de mergecommit Quality Gate is completed/success. | Iedere volgende wijziging vereist diff-review, documentatiesynchronisatie en groene Quality Gates op exacte PR-head én mergecommit. De actuele hervattingsstatus moet ook in issue #49 synchroon blijven. |

### 129.1 Formele uitkomst

**Fase 2 is niet geaccepteerd. Fase 3 blijft geblokkeerd.** De grootste inhoudelijke open punten zijn niet meer het verzamelen van een algemene factorlijst, maar de wetenschappelijke toelating van de bestaande numerieke prior, de respons-/scorekalibratie, onafhankelijke biologische evaluatie en de werkelijke tijdvakrespons. De ontbrekende lokale sessiedata verhinderen lokale nauwkeurigheidsclaims, maar blokkeren op zichzelf niet het afronden van een conservatief softwareontwerp.

De thermische optie A blijft de expliciet gekozen voorlopige baseline. Zij mag niet als empirisch gevalideerde soortcurve worden beschreven. Er worden geen nieuwe numerieke voedingsfactoren, gewichten, interacties of tijdvakbonussen geactiveerd. De bestaande 1–10-weergave en eenvoudige gebruikersflow blijven intact.

### 129.2 Volgende werkzaamheden — vaste volgorde

1. **Datamodel- en labelaudit:** controleer welke bestaande sessie-, vangst-, snapshot- en tijdvakgegevens werkelijk beschikbaar zijn voor onafhankelijke evaluatie. Maak expliciet onderscheid tussen directe biologische labels, vangstproxy's en ontbrekende labels; voeg geen verplichte gebruikersinvoer toe.
2. **Evaluatiematrix sluiten:** definieer per respons de geschikte metriek, labelbron, vergelijkingsbaseline, minimumvoorwaarden en beperkingen. Brier blijft alleen voor persoonlijke vangstkans; temperatuurfoutmaten blijven alleen voor de temperatuurschatter.
3. **Thermische prior toelatingsbesluit onderbouwen:** leg per soort vast wat de exacte curveparameters wel/niet ondersteunen, welke parameters uitsluitend softwareprior zijn en welke onafhankelijke responslabels de huidige 1–10-mapping zouden kunnen toetsen.
4. **Tijdvakontwerp toetsen:** bepaal met bestaande tijdstempels en sessieduur welke vergelijkingen werkelijk mogelijk zijn. Geen tijdvakscore claimen zonder bekende blootstelling en passende labels.
5. **Tactische voorvoerafwijking afhandelen:** leg de bestaande exacte gramadviezen en invoerkwaliteitsgrens naast het productdoel. Dit blijft gescheiden van de biologische dagscore en vereist een expliciet runtimebesluit voordat waarden worden gewijzigd.
6. **Formele acceptatie:** werk deze crosswalk bij met aantoonbaar bewijs en sluit elk criterium pas wanneer de bijbehorende voorwaarden werkelijk zijn gehaald. Pas daarna mag Fase 3 starten.

### 129.3 Documentintegriteit en codeconsistentie

De dubbele kopie van §§1–82 is in PR #175 verwijderd; de audit bevat nu één kop van §1 en behoudt §§82–128. Daarnaast is de tussentijdse optie-B-tekst in §96.3 gecorrigeerd: de actuele code en het latere optie-A-besluit bevestigen dat de thermische prior actief is. Dit herstelt alleen de documentbeschrijving; runtimegedrag is niet gewijzigd.

## 130. Audit bestaande sessie-, vangst- en snapshotlabels voor onafhankelijke evaluatie (19 november 2026)

Deze audit controleert welke uitkomsten de huidige datamodellen daadwerkelijk vastleggen en welke daarvan geschikt zijn om de biologische prognoselagen te evalueren. De controle is read-only; er zijn geen nieuwe verplichte velden, labels, berekeningen of gebruikersflows toegevoegd.

### 130.1 Wat de bestaande gegevens werkelijk vastleggen

| Gegevensbron | Aanwezige velden / herkomst | Wat dit betrouwbaar kan ondersteunen | Wat dit niet zelfstandig bewijst |
|---|---|---|---|
| FishingSession | Start/eindtijd, duur, sessie-uitkomst (catch, skunk_confirmed, unknown), doelsoort(en), stek, optionele omstandigheden, bitesCount/missedCount | Afgeronde sessie-uitkomst en persoonlijke vangsthistorie; sessieduur en context wanneer geldig | Geen directe meting van fysiologische activiteit of voedselopname. bitesCount/missedCount zijn sessietotalen zonder noodzakelijk tijdstip. |
| CatchItem | Soort, aantal, optioneel gewicht/lengte, tijdstip, timestampEntryMode, optionele hengel/aas/techniek | Gebeurtenis van een geregistreerde vangst; soort en aantal; tijdvakpositief signaal wanneer tijdstip door gebruiker is aangepast en binnen de sessie valt | Geen zuivere voedingsmeting, geen bewijs dat de vis op dat moment begon te eten en geen bewijs voor causaliteit van aas/methode. |
| SessionRod en activeIntervals | Optionele hengelrecords met expliciete begin-/eindtijden van actieve periodes | Werkelijke geregistreerde hengelblootstelling; berekening van hengeluren per tijdvak | Geen blootstelling afleiden uit alleen sessieduur of totaal aantal hengels. Ontbrekende intervallen betekenen onbekende inzet, niet nul inzet. |
| SessionRodEvent | Optionele gebeurtenis per hengel: bite, missed, catch of other; tijdstip en timestampEntryMode | Tijdgebonden hengelinteractie wanneer gebeurtenis en tijdstip betrouwbaar zijn vastgelegd | Geen directe biologische voedingsintensiteit; gebeurtenissen zijn hengel-/vangbaarheidsuitkomsten. |
| PresenceObservation | Vis springen/rollen, zichtbare aasbellen/bodemwoeling, recente vangst op stek, geen waarnemingen, onbekend | Kwalitatieve context over waargenomen activiteit of mogelijke aanwezigheid | Geen gestandaardiseerde afwezigheidsmeting; 'geen waarnemingen' bewijst geen afwezigheid of inactiviteit. Aasbellen zijn geen gekwantificeerde voedselopname. |
| PrognosisSnapshot | Vooraf voorspelde activityScore, catchChance, tijdvak/tijdvenster, doelsoort, duur, model-/engineversies, inputcontext, werkelijke sessie-uitkomst en optioneel vangstaantal; voorspelde en achteraf gemeten watertemperatuur | Reproduceerbare modelbaseline; persoonlijke vangstkans; afzonderlijke validatie van de watertemperatuurschatter | Bevat geen onafhankelijk gemeten label voor biologische activiteit of voedselopname. actualOutcome is een sessie-uitkomst, geen voedingslabel. |

### 130.2 Tijdstip van vangst: automatische registratie is geen werkelijk vangstmoment

De vangstregistratie vult het tijdstip automatisch in wanneer het formulier wordt geopend. De gebruiker kan het tijdstip aanpassen. De herkomst wordt als automatic of user_adjusted bewaard.

Dit sluit aan op de minimale gebruikersflow uit §104: de gebruiker hoeft niet eerst een tijdstip in te voeren om een vangst op te slaan. Voor wetenschappelijke tijdvakdiagnostiek geldt echter een strengere interpretatie:

- Een automatisch formulier-open-tijdstip is het registratiemoment, niet noodzakelijk het moment waarop de vis daadwerkelijk werd gevangen.
- Een automatische timestamp wordt daarom door de bestaande timeSlotCatchEvidenceAudit expliciet niet als werkelijk vangstmoment geteld.
- Alleen een door de gebruiker aangepast tijdstip binnen de bevestigde sessiegrenzen levert momenteel een positief gebruikersgerapporteerd vangstsignaal voor dat tijdvak.
- Oude records zonder timestamp-herkomst blijven ongeclassificeerd; ze worden niet stilzwijgend als echte vangsttijd behandeld.

**Gevolg:** automatische registratie blijft gebruikersvriendelijk en wordt niet verplicht aangepast. Voor tijdvakvalidatie blijft de automatische tijd alleen provenance van het formuliermoment. Er mag geen vangstpiek uit automatische registratietijden worden afgeleid.

### 130.3 Bestaande tijdvakblootstelling en vangstbewijs

De bestaande timeSlotExposureEngine verdeelt expliciet geregistreerde hengelintervallen over de vier Amsterdamse lokale tijdvakken en berekent hengeluren. De engine houdt rekening met lokale tijdgrenzen en zomertijd. Ontbrekende intervallen worden niet afgeleid uit sessieduur of rodCount.

De bestaande timeSlotCatchEvidenceAudit hanteert al conservatieve labelregels:

1. Alleen een afgeronde sessie met geldige start-/eindtijd en precies één doelsoort is soortspecifiek beoordeelbaar.
2. Benchmarksessies en sessies met onbekende uitkomst worden uitgesloten.
3. Een bevestigde nulvangst geeft uitsluitend een nul-label voor tijdvakken waarin expliciete hengelblootstelling is geregistreerd. Tijdvakken zonder geregistreerde inzet blijven no_recorded_exposure.
4. Bij een sessie met vangst levert een geldige, user_adjusted CatchItem-timestamp een positief signaal voor het betreffende tijdvak.
5. Andere tijdvakken in diezelfde vangstsessie blijven unknown; het ontbreken van een geregistreerde vangst in zo'n tijdvak wordt niet als nul geïnterpreteerd.
6. Automatische, legacy-onbekende, ongeldige of buiten de sessie vallende vangsttijdstippen worden niet als tijdvakvangst gebruikt.
7. Bijvangst van een andere soort en sessies met meerdere doelsoorten worden niet als soortspecifiek positief of negatief label gebruikt.

De bestaande tests bewaken onder meer deze positieve, nul-, onbekende, conflicterende en niet-soortspecifieke situaties. Dit is een **beschrijvende bewijs-/kwaliteitsaudit**, nog geen gekalibreerde tijdvakvoorspeller of onafhankelijke validatiemaatstaf.

### 130.4 Belangrijke datakloof: hengelgebeurtenissen versus vangstregistraties

SessionRodEvent ondersteunt optionele tijdstempels voor aanbeten, gemiste vissen, vangsten en overige gebeurtenissen. De gebruiker kan een gebeurtenistijdstip aanpassen; een niet-aangepaste automatische tijd blijft als automatic herkenbaar.

De huidige timeSlotCatchEvidenceAudit gebruikt SessionRod-gegevens voor actieve hengelintervallen en CatchItem-records voor vangstsignalen, maar verwerkt SessionRodEvent-gebeurtenissen niet in de tijdvaklabels. De bestaande Brier-evaluator gebruikt evenmin deze gebeurtenissen; die toetst uitsluitend de vooraf voorspelde persoonlijke vangstkans aan de afgeronde sessie-uitkomst.

Dit is een aantoonbare toekomstige ontwerpkans, maar geen toestemming om nu automatisch alle gebeurtenissen als trainingslabels te gebruiken:
- Aanbeten en gemiste vissen zijn nuttige hengelinteractie-/vangbaarheidsproxy's, niet directe metingen van voedselopname.
- Een geregistreerde gebeurtenis moet een betrouwbare tijdstempel, doelsoortkoppeling en passende hengelblootstelling hebben.
- De huidige eventregistratie heeft geen verplichte soortkoppeling per gebeurtenis; bij meerdere doelsoorten kan soorttoeschrijving ontbreken.
- Gebeurtenissen kunnen door de gebruiker optioneel worden ingevoerd en zijn daardoor selectief; niet-geregistreerde gebeurtenissen zijn geen nul.
- De eventstroom moet afzonderlijk van CatchItem-vangsten worden geanalyseerd om dubbeltelling van dezelfde vangst te voorkomen.

### 130.5 Label- en evaluatiematrix

| Gewenste respons | Beschikbaar label | Geschikte huidige interpretatie | Status voor Fase 2 |
|---|---|---|---|
| Persoonlijke vangstkans tijdens een sessie | Afgeronde catch/skunk-uitkomst, gekoppeld aan voorafgaande snapshot en vergelijkbare duur/tijdvenster | Brier/BSS en kalibratie van persoonlijke vangstkans | Technisch aanwezig; blijft strikt gescheiden van biologische score. |
| Watertemperatuurschatter | Vooraf voorspelde temperatuur versus achteraf gemeten temperatuur met meettijd/provenance | MAE/RMSE/bias, mits meetlocatie, diepte, tijd en methode vergelijkbaar zijn | Technisch aanwezig; voldoende echte meetparen nodig voor lokale claims. |
| Tijdvakblootstelling | Expliciete activeIntervals per hengel | Hengeluren per tijdvak; geen biologische respons | Beschikbaar wanneer gebruiker dit optioneel registreert; anders onbekend. |
| Tijdvakvangstsignaal | User-adjusted CatchItem-tijdstip plus expliciete hengelblootstelling; bevestigde nulvangst alleen op blootgestelde tijdvakken | Beschrijvende catch-/exposure-context en later eventueel vangbaarheidsevaluatie | Gedeeltelijk beschikbaar; geen directe voedingsrespons en nog geen gekalibreerde tijdvakmetric. |
| Aanbeten/gemiste vissen | Optionele SessionRodEvent of sessietotalen bitesCount/missedCount | Hengelinteractie-/vangbaarheidsproxy, bij betrouwbare tijdstempel en exposure | Niet geïntegreerd in de huidige tijdvaklabelaudit; eerst soorttoeschrijving, dubbeltelling en selectieve registratie beoordelen. |
| Lokale aanwezigheid/habitat | Optionele PresenceObservation | Kwalitatieve waarneming van mogelijke aanwezigheid/activiteit | Geen gestandaardiseerde aanwezigheid-/afwezigheidslabels; 'geen waarnemingen' is geen afwezigheid. |
| Thermische fysiologische activiteit | Geen directe lokale activiteitssensor of gestandaardiseerd biologisch veldlabel in de huidige sessie-/vangstmodellen | Niet vervangen door vangst, beet, beweging of groei | Onafhankelijke labelbron ontbreekt; curve blijft voorlopige mechanistische prior. |
| Voedselopname/voedingsintensiteit | Geen directe lokale voedselopname- of foerageerlabel in de huidige standaardflow | Literatuur blijft context-/kandidaatbewijs; vangst en beet zijn geen directe intake | Onafhankelijke labelbron ontbreekt; geen numerieke voedingsbijdrage toelaten. |
| Samengestelde biologische 1–10-score | Geen onafhankelijk samengesteld biologisch doel-label | Alleen toetsen via vooraf vastgelegde biologische responsmetingen; persoonlijke vangst kan hoogstens een afzonderlijke downstream-uitkomst zijn | Ontwerp en onafhankelijke validatie blijven open. |

### 130.6 Consequenties voor de evaluatiearchitectuur

- De bestaande evaluationEngine is een sessieniveau-evaluator voor persoonlijke vangstkans. Hij gebruikt de vroegste vooraf vastgelegde voorspelling per sessie/doelsoort, een afgeronde gekoppelde sessie, een voorspelling vóór de werkelijke start en passende tijdvenster-/duurvergelijking.
- Deze Brier-evaluatie meet niet de biologische activiteitsscore, voedselopname, habitat-aanwezigheid of tijdvakvoorkeur.
- De timeSlotCatchEvidenceAudit kan de kwaliteit en beschikbaarheid van tijdvakvangst-/blootstellingsgegevens beschrijven, maar berekent geen onafhankelijke voorspelfout, kalibratie of skill-score voor de biologische tijdvakrangschikking.
- De thermische prior heeft een afzonderlijke temperatuurinputvalidatie. Dat valideert de voorspelde watertemperatuur, niet automatisch de fysiologische responsfunctie.
- Voor activiteit en voeding ontbreekt een direct lokaal label. Er mag geen schijnvalidatie ontstaan door dezelfde vangstdata tegelijk als biologische waarheid en als persoonlijke vangstkansuitkomst te gebruiken.

### 130.7 Besluit en vervolgstappen

**Besluit:** de bestaande data bieden een bruikbare technische basis voor persoonlijke vangstkans, temperatuurvalidatie en beperkte beschrijvende tijdvak-/blootstellingsanalyse. Ze leveren momenteel geen directe lokale biologische labels voor fysiologische activiteit of voedselopname. Dat onderscheid is een inhoudelijke grens, geen reden om extra verplichte registratievelden aan de gebruiker toe te voegen.

Vervolg in deze volgorde:
1. Behoud de automatische vangsttijd als laagdrempelige registratietijd en blijf deze uitsluiten als werkelijk vangstmoment zolang de gebruiker hem niet aanpast.
2. Behoud expliciete hengelintervallen als optionele blootstellingsregistratie; ontbrekende intervallen blijven onbekend.
3. Beoordeel afzonderlijk of SessionRodEvent (aanbeet/gemist/vangst) verantwoord kan worden gekoppeld aan tijdvakblootstelling en doelsoort, zonder gebeurtenissen dubbel te tellen. Geen directe voedingsinterpretatie.
4. Definieer de evaluatiemaatstaf voor tijdvak-vangbaarheid alleen als aparte responslaag; laat biologische voedings-/activiteitvalidatie daarvan gescheiden.
5. Leg voor activiteit en voedselopname vast welke onafhankelijke meetlabels in theorie beschikbaar of praktisch haalbaar zijn zonder de vangstflow te verzwaren. Tot die tijd blijven deze responsen niet lokaal gevalideerd.
6. Houd Brier/BSS uitsluitend voor persoonlijke vangstkans en behoud de bestaande sessie-/snapshotvoorwaarden.

Geen runtimewijziging, extra verplicht veld, automatisch trainingslabel of numerieke factor is door deze audit goedgekeurd. Fase 2 blijft open; Fase 3 blijft geblokkeerd.

## 131. Onafhankelijke evaluatiemaatstaven en toelatingspoorten per respons (19 november 2026)

Deze sectie vertaalt de datalabel-audit (§130), de zeven Fase-2-criteria (§43 en §129) en de kandidaatarchitectuur (§§94–106) naar een concreet evaluatiekader. Het is een ontwerpvoorstel. Er worden geen nieuwe metrics in de app geactiveerd, geen minimumaantallen gekozen en geen runtimeberekeningen gewijzigd.

### 131.1 Kernregel: elke metric toetst uitsluitend de respons waarvoor het label geschikt is

Een metric kan alleen iets aantonen over het eindpunt dat daadwerkelijk is gemeten. Een goede vangstscore bewijst niet dat een biologische activiteitsscore juist is; een goede watertemperatuurschatting bewijst niet dat de vis op die temperatuur meer eet. De volgende lagen blijven daarom onafhankelijk.

| Respons / modelonderdeel | Geschikt label of referentie | Kandidaatmetric(s) | Wat de metric kan aantonen | Huidige status |
|---|---|---|---|---|
| Watertemperatuurschatter | Onafhankelijke meting op passende locatie, diepte en tijd, met meetmethode en herkomst | MAE, RMSE, gemiddelde bias; waar een voorspelde band beschikbaar is ook intervaldekking | Fout en systematische afwijking van de voorspelde watertemperatuur | Bestaande aparte evaluatie aanwezig; lokale meetparen bepalen de bewijskracht. |
| Thermische fysiologische respons | Direct gemeten, soort- en contextpassende activiteit-/fysiologierespons, met bekende levensfase, acclimatisatie, watertype en temperatuur | Afhankelijk van het gemeten eindpunt: foutmaat voor een continue respons en/of rangcorrelatie over vooraf vastgelegde condities | Of de soortspecifieke thermische prior de gemeten fysiologische respons ordent of kwantificeert | Geen direct lokaal label in de app; exacte curveparameters blijven voorlopige prior. Groei, aerobe scope of vertering mogen niet zonder responsargument als directe activiteit worden gebruikt. |
| Voedselopname / voedingsintensiteit | Direct gemeten geconsumeerde hoeveelheid per tijdseenheid of gevalideerde directe voedingssnelheid, met voedseltype, visformaat en context | MAE/RMSE of relatieve fout voor continue opname; rangcorrelatie voor relatieve ordening; eventueel Brier/log loss uitsluitend bij een werkelijk binair voedingsgebeurtenislabel | Of een factor de gemeten voedselopname/voedingsintensiteit voorspelt | Geen lokaal direct label. Vangst, aanbeet, dieetcompositie en maagvacuïteit zijn niet automatisch dagelijkse intake. |
| Voedingsritme / tijdvakvoorkeur | Directe tijdgebonden voedselopname of foerageersnelheid binnen dezelfde dag en passende soort-/seizoenscontext | Binnen-dag rangcorrelatie of paargewijze concordantie tussen voorspelde en gemeten tijdvakvolgorde; continue foutmaat wanneer werkelijke tijdvakopname is gemeten | Of het model het relatieve voedingsmoment correct ordent | Geen lokale directe labels. Bewegingsritme alleen is onvoldoende. |
| Habitat / aanwezigheid | Herhaalde, gestandaardiseerde aanwezigheid-/afwezigheidswaarnemingen met expliciete zoekinspanning en detectiecontext | Log loss/Brier of classificatiemaatstaven; occupancy-/detectiemodel wanneer de steekproefopzet dat toelaat | Of de habitat-/aanwezigheidslaag aanwezigheid voorspelt, rekening houdend met detectiekans | Huidige aanwezigheidssignalen zijn opportunistisch en kwalitatief; 'geen waarnemingen' is geen afwezigheid. Geen gekalibreerde aanwezigheidskans. |
| Persoonlijke vangstkans | Vooraf opgeslagen catch-chance en afgeronde, gekoppelde sessie-uitkomst onder vergelijkbare duur en tijdvenster | Brier/BSS en kalibratie, chronologisch met rolling baseline | Of de persoonlijke kans op minstens één vangst overeenkomt met sessie-uitkomsten | Bestaande evaluator aanwezig. Dit blijft de enige huidige Brier-toepassing en geen biologische gewichtstuner. |
| Tijdvak-vangbaarheid / hengelinteractie | Betrouwbaar tijdstip van vangst/aanbeet/gemiste vis plus expliciete hengeluren en doelsoorttoeschrijving | Beschrijvende vangst-/aanbeetfrequentie per hengeluur; later eventueel een exposure-aware count/rate-model met chronologische holdout | Of een tijdvak onder vergelijkbare geregistreerde hengelinzet meer hengelinteracties/vangsten oplevert | Alleen gedeeltelijke optionele data; geen directe voedingsmeting en nog geen gevalideerde tijdvakvoorspeller. |
| Samengestelde 1–10-biologische score | Vooraf gedefinieerde onafhankelijke biologische referentie die dezelfde samengestelde doelrespons meet | Eerst rankcorrelatie/ordening tegen de referentie; fout- of kalibratiemaat alleen wanneer vaste biologische scoreankers zijn gedefinieerd | Of de ene score de bedoelde biologische activiteit-/voedingspotentie betekenisvol en stabiel samenvat | Geen onafhankelijke samengestelde lokale labelset; niet valideerbaar met Brier of vangst alleen. |
| Onzekerheid / coverage | Werkelijke fout/verificatie-uitkomst gegroepeerd naar vooraf gedefinieerde invoer- en bewijsdekking | Intervaldekking en fout/kalibratie per coverageklasse; aantallen en uitsluitingen | Of onzekerheidslabels en gedeeltelijke dekking eerlijk zijn | Ontwerp nog open; onzekerheid blijft buiten de biologische score. |

### 131.2 Specifieke grens tussen tijdvakvoeding en tijdvakvangbaarheid

De app kan op termijn twee verschillende vragen beantwoorden:
- **Biologische tijdvakrespons:** wanneer de doelsoort aantoonbaar meer voedsel opneemt of foerageert. Hiervoor zijn directe tijdgebonden voedingslabels nodig.
- **Praktische hengeluitkomst per tijdvak:** wanneer onder vergelijkbare hengeluren, stek, soort en techniek meer aanbeten of vangsten zijn geregistreerd. Dit is een vangbaarheids-/praktijklaag.

De tweede kan nuttig zijn voor VisCoach, maar mag niet als directe validatie van de eerste worden gebruikt. De huidige optionele SessionRodEvent- en CatchItem-gegevens kunnen hoogstens een beperkte basis vormen voor de tweede. Soorttoeschrijving, timestampkwaliteit, expliciete hengelblootstelling, selectieve registratie en dubbeltelling moeten eerst worden afgedekt. De huidige tijdvakbewijs-audit is beschrijvend; er is nog geen goedgekeurd model of metric die een beste biologisch voedingsmoment valideert.

### 131.3 Chronologische modelvergelijking en factor-toelating

Voor iedere kandidaatfactor en iedere kandidaataggregatie gelden dezelfde vooraf vastgelegde stappen:

1. Definieer de exacte respons, eenheid, observatiemoment, soort, levensfase, seizoen, watertype, geografische context en meetmethode.
2. Leg vóór evaluatie vast welk label de respons werkelijk meet en welke observaties worden uitgesloten.
3. Bevries de huidige thermische baseline en modelversie. Maak geen gelijktijdige wijziging van curveparameters en nieuwe factoren zonder afzonderlijke ablatietests.
4. Gebruik rolling-origin evaluatie. Elke voorspelling gebruikt uitsluitend data die vóór het prognosetijdstip beschikbaar waren.
5. Vergelijk baseline en kandidaat op dezelfde ongeziene sessies/waarnemingen; rapporteer aantallen, ontbrekende data, uitsluitingen, fout/kalibratie en onzekerheid.
6. Voer per factor een ablatietest uit: laat zien of de factor bovenop de bestaande baseline extra informatie toevoegt en of de winst overeind blijft per soort en relevante context.
7. Rapporteer ook regressies, nulresultaten en segmenten met onvoldoende data. Geen modelkeuze op basis van alleen een hogere score-spreiding of een gunstige totale gemiddelde uitkomst.
8. Geen automatische gewichtsaanpassing. Een wijziging vraagt inhoudelijke review, versiebeheer, regressietests en nieuwe chronologische evaluatie.

Er worden in deze stap geen universele minimumaantallen vastgelegd. Een softwareminimum (zoals het bestaande minimum voor het tonen van Brier) is geen bewijs van statistische robuustheid. De vereiste steekproefomvang moet passen bij responsvariatie, effectgrootte, onzekerheid, soortsegmentatie en de geplande evaluatie; bij onvoldoende aantallen blijft de uitkomst beschrijvend of niet-evalueerbaar.

### 131.4 Harde toelatingsregels

- Een label mag niet voor een andere respons worden hergebruikt zonder expliciete, onafhankelijke validatie van die koppeling.
- Vangsten, aanbeten, gemiste vissen en vangstloze sessies zijn geen directe voedselopname- of fysiologische-activiteitslabels.
- Automatische formulier-open-tijdstippen zijn geen werkelijk vangstmoment; alleen betrouwbare, door de gebruiker aangepaste tijdstippen kunnen de huidige beschrijvende tijdvakvangstregistratie voeden.
- Geen geregistreerde hengelintervallen betekent onbekende blootstelling, niet nul hengeluren.
- Geen waarneming betekent geen detectie, niet bewezen afwezigheid.
- Brier/BSS blijft uitsluitend voor persoonlijke vangstkans; temperatuur-MAE/RMSE/bias uitsluitend voor de temperatuurschatter.
- Een factor zonder passend label, bron, betrouwbare input of onafhankelijke evaluatie blijft contextueel, onbekend of uitgesloten; geen numerieke bijdrage.
- Onzekerheid/coverage verandert niet de biologische toestand en wordt niet als bonus of straf bij de score opgeteld.
- De bestaande 1–10-weergave blijft behouden; er komen geen zichtbare deelscores of verplichte gebruikersvelden bij.

### 131.5 Fase-2-status en volgende stap

Het evaluatiekader is nu per respons uitgeschreven, maar de directe labels voor thermische activiteit, voedselopname, habitat-aanwezigheid en biologische tijdvakvoorkeur ontbreken lokaal. Daarom kan dit ontwerp de ontbrekende praktijkdata niet vervangen en wordt er geen numerieke factor toegelaten.

**Volgende stap:** maak de respons-/factor-toelatingsmatrix definitief door per bestaande factor te koppelen: bronstatus, responskaart, actuele invoer, toepassingsgebied, gekozen metric, beschikbaar label en toelatingsbesluit (numeriek kandidaat, uitsluitend context, onbekend of uitgesloten). De thermische prior blijft als expliciet voorlopige baseline apart herkenbaar. Daarna kan een finale kandidaatmodelreview plaatsvinden; geen runtimegewichten of scorewijziging voordat de formele acceptatiepoorten zijn gesloten.

Fase 2 blijft niet geaccepteerd; Fase 3 blijft geblokkeerd.

## 132. Definitieve factor-toelatingsmatrix per respons en doelsoort (19 november 2026)

Deze sectie sluit de factorinventaris uit §§102 en 105 aan op de bron-/responskaarten §§108–128 en het evaluatiekader §131. Het doel is niet om alle factoren numeriek te activeren, maar om per factor vast te leggen wat de huidige code doet, welk eindpunt het bewijs werkelijk meet en of numerieke toelating op dit moment verdedigbaar is.

### 132.1 Betekenis van de toelatingsstatus

- **Actief — voorlopige prior:** bestaande numerieke runtimebijdrage die expliciet als tijdelijke mechanistische baseline behouden is; niet gelijk aan wetenschappelijke goedkeuring.
- **Numerieke kandidaat — niet toegelaten:** er bestaat direct of contextgebonden bewijs dat een responsfunctie kan helpen ontwerpen, maar bewijs, invoer of onafhankelijke validatie voldoet nog niet aan de toelatingspoort.
- **Contextueel:** mag de uitleg of afzonderlijke tactiek-/habitatlaag informeren, maar heeft geen numerieke bijdrage aan de biologische 1–10-dagscore.
- **Onbekend / niet beschikbaar:** de app heeft geen betrouwbare actuele invoer of passend lokaal label; er wordt geen proxy of neutrale waarde verzonnen.
- **Afzonderlijke responslaag:** relevant voor een andere uitkomst, zoals habitat, hengelvangbaarheid, persoonlijke vangstkans, tactiek of datakwaliteit; niet mengen met de biologische score.
- **Uitgesloten:** de gemeten respons of overdraagbaarheid is niet passend voor de beoogde factor; alleen heroverwegen met nieuw passend bewijs.

### 132.2 Factorfamilies en huidige toelating

| Factor / factorfamilie | Wat het bewijs werkelijk meet | Huidige runtime-/productrol | Toelatingsbesluit voor biologische dagscore | Wat nodig is voor heroverweging |
|---|---|---|---|---|
| Watertemperatuur / soortcurve | Thermische fysiologische respons zoals door de voorlopige profielcurve gemodelleerd | Enige numerieke bijdrage aan de bestaande 1–10-activiteitsindex | **Actief — voorlopige prior, expliciete uitzondering** | Directe soort-/levensfase-/contextpassende thermische responslabels; bronherkomst per parameter; onafhankelijke kalibratie van curvevorm, optimum, breedtes en scoremapping. |
| Luchttemperatuur en thermische weersontwikkeling | Indirecte input voor de waterthermische schatter | Alleen indirect via de bestaande waterThermalEngine | **Geen zelfstandige bijdrage** | Eerst onafhankelijke validatie van de watertemperatuurschatter; geen dubbele weerbonus. |
| Voedselopname / voedingsintensiteit | Gemeten hoeveelheid of snelheid van geconsumeerd voedsel | Literatuurcontext via feedingEvidenceService; geen lokale directe voedingsmeting | **Numerieke kandidaat — niet toegelaten** | Passende soort-/levensfase-/voedsel-/temperatuurrespons, betrouwbare lokale of overdraagbare invoer en onafhankelijke voedingslabels/metrics. |
| Voedingsritme / dielgedrag | Wanneer daadwerkelijke voedselopname plaatsvindt | Kwalitatieve soortcontext; geen gevalideerde tijdvakscore | **Contextueel** | Direct tijdgebonden voedingslabel en passende soort-/seizoens-/habitatvalidatie. Bewegingstelemetrie is onvoldoende. |
| Foerageergedrag / prooivangst | Zoekgedrag, aanval of vangst van natuurlijke prooi | Afzonderlijke kwalitatieve bewijsstroom | **Contextueel of numerieke kandidaat per bron; nu niet toegelaten** | Aantonen dat gemeten gedrag overdraagbaar is naar de relevante dagelijkse voedings-/foerageerrespons en lokale voedselbron. Prooivangst is geen dagelijkse voedselopname of hengelaasrespons. |
| Dieet / prooikeuze / maaginhoud | Welke prooi is gegeten of hoe maaginhoud seizoensmatig varieert | Soort-/voedselcontext | **Contextueel; uitgesloten als zelfstandige voedingsintensiteit** | Alleen een direct passend meeteindpunt kan voedingsintensiteit of tijdvakrespons ondersteunen. |
| Seizoen / levenscyclus / acclimatisatie | Modulator van fysiologie, voedselbehoefte of gedrag | Context in soortprofiel en uitleg | **Geen zelfstandige numerieke bonus** | Soortspecifieke interactie met direct gemeten doelrespons en onafhankelijke toetsing. |
| Licht / fotoperiode / schemering | Omgevingscontext; soms tijdgebonden beweging of voeding in specifieke studies | Beschrijvende context | **Geen generieke tijdvak- of dagscorebonus** | Directe soortspecifieke voedings-/activiteitsrespons met tijdvaklabels. Fotoperiode, zonsopkomst en schemering niet dubbel tellen. |
| Wind / windrichting | Oever-, drift-, oppervlakte- en soms bewegings-/habitatrespons | Bestaande bankWind-/positionerings-/habitatlaag | **Afzonderlijke responslaag; geen dagscorebijdrage** | Directe, onafhankelijke voedingsrespons en lokale validatie bovenop temperatuur/licht. |
| Luchtdruk / druktrend | In enkele studies locomotorische beweging of habitatverplaatsing | Beschrijvende context | **Contextueel; geen numerieke bijdrage** | Repliceerbare soortspecifieke doelrespons en aantoonbare extra voorspelwaarde. |
| Bewolking / instraling / neerslag | Licht- of indirecte hydrologische context | Weer-/tijdvakcontext; neerslag geen directe visrespons | **Contextueel; geen zelfstandige bijdrage** | Lokale gemeten tussenstap en directe soortrespons; voorkom dubbele telling met thermische ontwikkeling en licht. |
| Troebelheid / zicht | Zichtcondities, predator-prooi-interactie of beweging in specifieke systemen | Geen betrouwbare actuele lokale meting | **Onbekend / contextueel** | Lokale NTU-/zichtmeting en passende soort-/prooirespons. Geen universele troebelheidsbonus. |
| Opgeloste zuurstof | Fysiologische beperking en bij ernstige hypoxie soms directe voedingsremming | Geen betrouwbare actuele lokale zuurstofinvoer | **Onbekend; uitgesloten van numerieke score** | Lokale DO-metingen met tijd/diepte en een responsfunctie voor normale relevante veldwaarden; extreme laboratoriumhypoxie niet extrapoleren. |
| Stroming / afvoer / waterstand | Verplaatsing, habitatgebruik en voedseltoegankelijkheid in stromend water | Geen lokale stroomsnelheid-/afvoerinvoer; kwalitatieve habitatcontext | **Onbekend / afzonderlijke habitatlaag** | Lokale meting en soort-/watertypepassende responslabels. Niet overzetten naar stilstaand water. |
| Natuurlijk prooi-/voedselaanbod | Lokale hoeveelheid en toegankelijkheid van natuurlijk voedsel | Niet gemeten in de app | **Onbekend** | Lokale betrouwbare prooiproxy of meting en aantoonbare soort-/seizoensrespons. |
| Diepte / bodem / vegetatie / structuur / stek | Habitatgeschiktheid en ruimtelijke zoekhypothese | Bestaande habitatMovement-/rodPositioning-laag | **Afzonderlijke habitat-/aanwezigheidslaag** | Onafhankelijke aanwezigheid-/habitatlabels; niet automatisch fysiologische activiteit of voeding. |
| Persoonlijke vangstkans | Kans op minstens één vangst tijdens vergelijkbare sessie | Bestaande Poisson-baseline; Brier/BSS | **Afzonderlijke responslaag** | Eigen chronologische sessie-evaluatie; geen correctie of gewicht voor biologische dagscore. |
| Hengelvangbaarheid / aas / voer / techniek / hengelinzet | Kans dat activiteit in aanbeet/vangst wordt omgezet | VisCoach-/tactiek-/persoonlijke ervaringslaag | **Afzonderlijke responslaag** | Eigen exposure-aware vangst-/aanbeetdata; niet als biologische activiteit of voedselopname gebruiken. |
| Voorvoer-suitability en exacte grammen | Praktische voer-/tactiekindicatie | Actieve numerieke heuristiek in prebaitEngine, buiten de biologische dagscore | **Niet toegelaten als biologische factor; afzonderlijke tactiekbeslissing open** | Evidence-/uitkomstvalidatie van geschiktheid en hoeveelheden, plus expliciet besluit over de lage-invoerkwaliteitsgrens. Geen stille wijziging van grammen. |
| Datadekking / bronkwaliteit / onzekerheid | Betrouwbaarheid van de onderbouwing | Provenance-, coverage- en onzekerheidsmetadata | **Afzonderlijke kwaliteitslaag; nooit scorebonus/-straf** | Kalibratie van onzekerheidsbanden en prestaties per coverageklasse. |

### 132.3 Soortspecifieke toelatingsstatus van directe voedingsbronnen

De registry bevat 86 records; op de actuele main-code zijn 0 records goedgekeurd voor directe numerieke voorspelling. De feedingEvidenceService filtert goedgekeurde directe voedingsbronnen expliciet en levert daardoor momenteel geen goedgekeurde numerieke voedingsbron. De onderstaande tabel onderscheidt daarom bewijs dat een kandidaatrespons kan informeren van bewijs dat al in de score mag worden gebruikt.

| Doelsoort | Directe of relevante aanvullende respons in de audit | Huidige toelating |
|---|---|---|
| Karper | Directe gecontroleerde voedselopname bij 4–34 °C; veld-/bait-stationbezoek; ernstige hypoxiecontext; afzonderlijk foerageergedrag | Contextgebonden numerieke kandidaat voor voedselopname; geen toegelaten runtimefactor of gevalideerde Nederlandse veldcurve. |
| Brasem | In-situ zoöplanktonconsumptie en dagritme; oudere rantsoen-/stikstofstudies; troebelheidsstudie meet beweging | Voedingsritme/-intensiteit uitsluitend contextgebonden; geen thermische voedingscurve of algemene pellet-/method-feederrespons. |
| Snoek | Wilde hartslagtelemetrie met indirect geschatte dagelijkse intake; 0+ predatie-/prooivangststudie; maaginhoudstudies | Directe veld-/predatiecontext, maar geen volwassen thermische voedingscurve; geen tijdvakbonus. |
| Baars | Voeropname onder verstoring bij twee temperaturen; temperatuurafhankelijke zwemsnelheid/prooivangst; volwassen dagelijks rantsoen | Contextgebonden kandidaatbewijs; geen zuivere temperatuur-voedselopnamecurve of lokale voedingslabelset. |
| Blankvoorn | Historische laboratoriumconsumptiebron met onvolledig geverifieerde methoden; in-situ planktonconsumptie en seizoens-/dielverschuiving | Contextueel; geen toegelaten thermische curve of universele dag-/schemerbonus. |
| Zeelt | Directe maximale voedselopname bij 18 en 25 °C in beperkte populatie-/systeemcontext | Contextgebonden numerieke kandidaat; twee temperatuurpunten valideren geen volledige curve of huidige profielprior. |
| Snoekbaars | Directe prooiconsumptie bij 4,5, 8,5 en 12,5 °C bij gekweekte broedvis in winter-/voorpaaicontext; bewegingstelemetrie afzonderlijk | Sterke contextgebonden kandidaat voor directe prooiconsumptie; geen toegelaten volwassen veldcurve of hengelaasrespons. |
| Meerval | Juveniele kweekvoeracceptatie/dagelijkse consumptie bij 15/20/24 °C; andere kweekrantsoenstudie; afzonderlijk nachtelijk voerritme en EMG-beweging | Directe maar lage-/contextgebonden kweekkandidaat; geen volwassen wilde voedingscurve of universeel nachtpatroon. |
| Roofblei | Seizoensgebonden maagvulling/vacuïteit en dieet; volwassen telemetrie meet beweging | Alleen dieet-/maagvullings- en bewegingscontext; geen directe dagelijkse voedingsintensiteit of tijdvakrespons. |
| Overig | Generiek fallback-profiel zonder eigen soortspecifieke responskaart | Geen soortspecifieke numerieke voedings- of thermische validatie; alleen generieke fallbackcontext. |

Geen van deze kandidaatbronnen wijzigt de goedkeuringsstatus. Voor geen van de tien profielen is in deze audit een volledig gevalideerde soortspecifieke dagelijkse thermische voedselopnamecurve aangetoond. De huidige thermische profielwaarden blijven daarom voorlopige prioren.

### 132.4 Wat daadwerkelijk numeriek actief is — expliciete afbakening

1. **Biologische 1–10-dagscore:** uitsluitend de bestaande thermische efficiëntie uit fishProfiles/prognosisEngine, via de bestaande scoremapping. Dit is de expliciet behouden voorlopige prior uit optie A, geen gevalideerde voedselopname- of vangstcurve.
2. **Persoonlijke vangstkans:** afzonderlijke Poisson-/sessielaag met eigen Brier/BSS-evaluatie. Geen thermische of voedingscorrectie op de biologische score.
3. **Voorvoer:** prebaitEngine heeft afzonderlijke temperatuurbanden, suitabilityScore, soortfactoren en gramadviezen. Deze waarden zijn praktische heuristieken, geen biologische dagscorebijdrage en niet door de research registry evidence-gated. De aparte keuze uit §96.5 blijft open.
4. **Habitat/positionering:** bestaande temperatuur-/wind-/seizoensdrempels sturen kwalitatieve zoekhypothesen en zones. Zij zijn geen activiteitsscore of gekalibreerde aanwezigheidskans.
5. **Overige meteorologische factoren:** wind, druk, seizoen, licht, bewolking en neerslag leveren in de huidige biologische dagscore geen zelfstandige numerieke bijdrage.

### 132.5 Formele consequentie en besluitpunt

De factorinventaris kan nu als **inhoudelijk gesloten** worden beschouwd: iedere bekende factor heeft een respons, inputstatus en huidige rol. De toelatingsmatrix is daarmee nog niet hetzelfde als formele Fase-2-acceptatie.

Er blijft één expliciet spanningspunt tussen productbesluit en bewijscriterium: optie A behoudt de thermische prior actief om de bestaande prognose niet zonder score te laten, terwijl de exacte parameters en curvevorm niet onafhankelijk zijn gevalideerd en geen registrybron hiervoor is goedgekeurd. Dit is transparant als voorlopige uitzondering gedocumenteerd, maar mag niet worden beschreven alsof criterium 2 wetenschappelijk is afgevinkt. De formele acceptatie moet deze uitzondering expliciet blijven erkennen; anders blijft criterium 2 een blocker.

De afzonderlijke numerieke voorvoerheuristiek is geen factor van de biologische 1–10-score, maar heeft wel een open product-/tactiekbesluit over exacte grammen en lage invoerkwaliteit (§96.5). Geen runtimewijziging zonder expliciete goedkeuring.

**Besluit:** geen nieuwe factor, gewicht, interactie, tijdvakbonus of scoremapping toelaten. De bestaande thermische prior blijft de enige numerieke biologische scorebijdrage. De factorstatusmatrix is gesloten voor deze auditronde; formele Fase-2-acceptatie blijft open totdat de bewijsuitzondering en onafhankelijke evaluatiepoorten aantoonbaar zijn afgehandeld. Fase 3 blijft geblokkeerd.

## 133. Conformiteitscontrole minimaal vangstregistratiecontract tegen de huidige UI (19 november 2026)

Deze controle toetst het gebruikersbesluit uit §104 rechtstreeks aan CatchModal.tsx en het huidige CatchItem-datamodel. Read-only audit; geen formulier, databaseveld of gebruikersflow gewijzigd.

### 133.1 Wat de gebruiker nu daadwerkelijk moet doen

| Veld / handeling | Huidige UI en datamodel | Beoordeling tegen §104 |
|---|---|---|
| Vissoort | Verplicht; geen standaardsoort bij een lege sessie, anders kan de sessiedoelsoort vooraf geselecteerd zijn | Conform: de gebruiker kiest/bevestigt de soort. |
| Aantal | Verplicht veld, maar standaardwaarde is 1; een individuele vangst kan direct worden opgeslagen zonder dit veld te wijzigen | Praktisch frictiearm, maar technisch/UI-matig is count verplicht terwijl §104 alleen de soort als verplichte inhoud noemt. De standaardwaarde 1 voorkomt een extra handeling bij één vis. |
| Vangsttijd | Automatisch gevuld bij openen van het formulier en aanpasbaar; herkomst wordt automatic of user_adjusted opgeslagen | Conform. Automatisch formuliermoment blijft registratietijd, geen gegarandeerd werkelijk vangstmoment. |
| Gewicht | Optioneel; leeg wordt null | Conform. |
| Lengte | Optioneel; leeg wordt null | Extra optioneel veld; geen blokkade voor opslaan. |
| Aas | Optioneel vrij tekstveld, eventueel vooraf gevuld vanuit sessiecontext | Geen verplicht veld; blijft optioneel. |
| Techniek/hengel | Optioneel vrij tekstveld; geen selectie uit een opgeslagen hengel-/methodeprofiel | **Niet volledig conform de vastgelegde wens voor een optionele vooraf ingestelde hengel-/methodeconfiguratie.** |
| Foto en notities | Optioneel | Geen verplichte extra invoer. |

De gebruiker kan met de huidige defaults een individuele vangst registreren door de soort te kiezen en direct op te slaan: aantal staat op 1, tijdstip wordt automatisch gevuld en gewicht/aas/techniek/foto/notities hoeven niet te worden ingevuld. De basisflow wordt dus niet door extra verplichte vragen geblokkeerd.

### 133.2 Aantoonbare afwijking: geen vooraf ingestelde hengel-/methodeprofielen

Het huidige CatchItem bevat optionele tekstvelden rod, bait en technique. CatchModal toont voor 'Techniek / Hengel' een vrij tekstveld. In het centrale typebestand bestaat geen opgeslagen RodProfile-, rodPresets- of vergelijkbare profielreferentie die vanuit de vangstregistratie geselecteerd kan worden.

SessionRod is geen vervanging voor zo'n preset: dit is een optioneel detailrecord van een hengel binnen één vissessie, met sessiegebonden techniek, aas/presentatie, actieve intervallen en gebeurtenissen. Het is geen herbruikbaar gebruikersprofiel dat de gebruiker bij iedere vangst kan kiezen.

Daarom is de minimale vangstflow grotendeels conform, maar is het optionele preset-onderdeel uit §104 nog niet geïmplementeerd. Een vrije tekstwaarde mag niet achteraf worden geïnterpreteerd als een genormaliseerd hengelprofiel of bewezen methode-effect.

### 133.3 Veilige vervolgbeslissing

Er zijn twee geldige productrichtingen die niet stilzwijgend door de audit mogen worden gekozen:
- De huidige optionele vrije tekst behouden als voldoende eenvoudige registratie; §104 wordt dan aangepast zodat een preset geen harde eis is.
- Een kleine herbruikbare hengel-/methodekeuze toevoegen als optionele selectie, met een veilige verwijzing naar bestaande gebruikersconfiguratie. Dit vereist een afzonderlijke datamodel-/UI-review, migratiecompatibiliteit en tests; de vangst moet altijd zonder selectie kunnen worden opgeslagen.

De huidige audit kiest niet tussen deze richtingen en wijzigt geen runtimegedrag. De verplichte basis blijft uitsluitend vissoort als betekenisvolle gebruikerskeuze; tijdstip blijft automatisch en aanpasbaar, gewicht optioneel, en er komen geen verplichte aas-/voer-/presentatievelden.

### 133.4 Fase-2-status

Criterium 6 is voor de eenvoudige basisflow grotendeels gerealiseerd. De precieze presetselectie uit §104 is nog niet aanwezig; de eigenaar moet bepalen of vrije tekst voldoende is of dat de optionele presetselectie daadwerkelijk moet worden gebouwd. Dit is een afgebakend product-/datamodelpunt en geen reden om extra verplichte vangstinvoer toe te voegen.

Geen runtimewijziging, migratie of extra verplicht veld. Fase 2 blijft niet geaccepteerd; Fase 3 blijft geblokkeerd.


## 134. Finale kandidaatmodelreview: huidige baseline, doelarchitectuur en toelatingsbesluit (20 november 2026)

Deze review sluit aan op de factor-toelatingsmatrix (§132), de feitelijke vangstflowcontrole (§133), de onafhankelijke evaluatiepoorten (§131) en de gekozen modelarchitectuur. De review is gebaseerd op de actuele `main`-implementatie en is read-only: geen runtimecode, parameters, gewichten, scoremapping, gebruikersinvoer of bestaande registraties zijn gewijzigd.

### 134.1 Feitelijke huidige modelketen op main

| Onderdeel | Aantoonbare huidige werking | Betekenis voor kandidaatmodel |
|---|---|---|
| Canonieke soortrespons | `fishProfiles.ts` bevat de soortprofielen en voorlopige thermische parameters; `prognosisEngine.ts` consumeert deze via `calculateThermalEfficiency()`. | Eén bron van waarheid behouden; geen tweede profielcatalogus of parallelle prognose-engine. |
| Biologische dagscore | Bij beschikbare gemeten of voldoende onderbouwde geschatte watertemperatuur wordt `1 + 9 × thermalEfficiency^0.85` toegepast en begrensd op 1–10. De thermische efficiëntie heeft een vloer van 0,08. | De actieve score is een thermische prior/proxy. Zij is nog geen gevalideerde samengestelde maat voor activiteit én voedselopname. De theoretische minimumscore blijft circa 2,1/10. |
| Ontbrekende temperatuur | De interne rekenplaceholder 0,5 wordt niet als score getoond; zonder bruikbare watertemperatuur concludeert de engine N/B. | Geen ontbrekende factor invullen met een neutrale waarde en geen placeholder als label of trainingsdata gebruiken. |
| Tijdvakken | Dezelfde dagbrede thermische respons wordt hergebruikt in de vier tijdvakken; soortspecifieke dielinformatie verschijnt als context. | De huidige tijdvakuitvoer bewijst geen afzonderlijke biologische tijdvakvoorkeur en mag geen rangorde suggereren die niet uit labels volgt. |
| Voedingsbewijs | `feedingEvidenceService` scheidt voedingsintensiteit, voedingsritme, foerageergedrag, dieet en prooikeuze. Alleen expliciet goedgekeurde kennis kan de goedgekeurde lijst vullen; de actuele registry heeft 0 goedgekeurde records. | Er is momenteel geen toegelaten numerieke voedingsbijdrage. Contextgebonden studies blijven kandidaatbewijs, geen runtimefactor. |
| Habitat en positionering | `habitatMovementEngine`, `bankWindEngine` en `rodPositioningEngine` leveren ruimtelijke/kwalitatieve context buiten de biologische dagscore. | Behouden als afzonderlijke aanwezigheid-/habitatlaag; niet opnemen als activiteit- of voedingsbonus. |
| Persoonlijke vangstkans | De empirische sessielaag gebruikt vooraf opgeslagen snapshots en afgeronde sessie-uitkomsten; Brier/BSS toetst de persoonlijke vangstkans. | Geen vervangend label voor activiteit of voedselopname en geen feedbackgewicht voor de biologische score. |
| Voorvoer | `prebaitEngine` berekent aparte suitability-, timing- en gramadviezen op basis van onder meer temperatuur en datakwaliteit. | Aparte tactiekheuristiek; geen onderdeel van de biologische score en nog geen onafhankelijke bewijsgevalideerde gramvoorspeller. |

### 134.2 Beoordeling van de kandidaatarchitectuur

De passende kandidaat is geen tweede totaalmodel en ook geen ongedifferentieerde optelsom van alle factoren. Het is één versiebeheerste, modulaire prognoseketen met intern gescheiden responsen:

1. **Fysiologische/thermische potentie:** voorlopige soortspecifieke thermische prior, met expliciete bron- en parameteronzekerheid.
2. **Voedings-/foerageerrespons:** afzonderlijke soort-, levensfase-, voedseltype- en contextgebonden respons; alleen numeriek wanneer directe passende bronnen en onafhankelijke labels dit toelaten.
3. **Omgevingsmodulatie:** alleen responsrelevante invloeden, na controle op dubbeltelling en overlap met de thermische schatting.
4. **Habitat/aanwezigheid:** bestaande afzonderlijke ruimtelijke analyse; geen bijdrage aan de totale biologische activiteit-/voedingsrespons zonder passend bewijs.
5. **Vangbaarheid/persoonlijke vangstkans:** afzonderlijke empirische laag met expliciete inspanning; niet vermengen met de biologische score.
6. **Datadekking en onzekerheid:** afzonderlijke metadata; onzekerheid verlaagt de zekerheid van de prognose, niet de biologische score zelf.

De gebruiker blijft één bestaande 1–10-dagscore zien. Intern mogen responscomponenten gescheiden blijven voor bewijs, diagnose en evaluatie. Een samengestelde score mag pas numeriek worden gevormd wanneer de componenten aantoonbaar dezelfde vooraf gedefinieerde doelrespons ondersteunen, de overlap is gecontroleerd, ontbrekende-data-patronen zijn vastgelegd en de combinatie chronologisch onafhankelijk beter of minstens niet slechter presteert dan de baseline op geschikte labels.

### 134.3 Kandidaatbesluit per modelonderdeel

| Onderdeel | Reviewbesluit | Voorwaarde voor latere toelating |
|---|---|---|
| Bestaande thermische curve | **Voorlopige baseline-uitzondering behouden (optie A)**; niet presenteren als gevalideerde soortcurve of dagelijkse voedselopname. | Expliciete eigenaaracceptatie van de beperkte uitzondering; betere soort-/contextdata, vaste referentieankers en onafhankelijke responsvalidatie blijven gewenst. |
| Directe voedingsrespons | **Numeriek niet toegelaten**; alleen context/kandidaatbewijs. | Direct passend responslabel, geverifieerde bronmethoden, toepasbaarheidsgrenzen en onafhankelijke chronologische evaluatie. |
| Seizoen, licht en dielgedrag | **Contextueel per soort**; geen universele schemer-/nachtbonus. | Directe tijdgebonden voedingsrespons voor de relevante soort, levensfase en context. |
| Wind, luchtdruk, neerslag, troebelheid, zuurstof en stroming | **Geen algemene numerieke bijdrage**; onbekende of locatiespecifieke factoren blijven expliciet onbekend/contextueel. | Betrouwbare invoer en een passende soort-/watertype-respons; overlap met reeds gemodelleerde watercondities uitsluiten. |
| Habitat/aanwezigheid | **Afzonderlijke laag**. | Representatieve, gestandaardiseerde aanwezigheid-/afwezigheidslabels met zoekinspanning en detectiekans. |
| Persoonlijke vangstkans | **Afzonderlijke laag**. | Eigen chronologische Brier/BSS- en kalibratie-evaluatie; geen biologische scorefeedback. |
| Tijdvakscore | **Geen nieuwe biologische tijdvakscore of rangorde toelaten**. | Tijdvakgebonden responslabels en geldige blootstelling; vangst per hengeluur blijft vangbaarheidsinformatie, geen voedingslabel. |
| Voorvoergrammen | **Buiten kandidaatmodel biologische score houden**; huidig tactiekadvies niet stilzwijgend wijzigen. | Afzonderlijk besluit over lage invoerkwaliteit en hoeveelheden, plus eigen evidence-/uitkomstvalidatie. |
| Hengel-/methodepreset bij vangst | **Productkeuze open**; vrije tekst blijft optioneel en de vangstflow blijft zonder keuze opslaan. | Eigenaar bepaalt of vrije tekst voldoende is of dat een optionele herbruikbare presetselectie gewenst is. |

### 134.4 Onafhankelijke evaluatie: wat kan nu wel en niet worden bewezen

- Watertemperatuurschatting kan met gemeten temperatuurparen via MAE/RMSE/bias worden geëvalueerd; dit valideert niet automatisch de biologische responscurve.
- Persoonlijke vangstkans kan met de bestaande chronologische Brier/BSS-keten worden geëvalueerd; dit valideert niet de biologische dagscore.
- Tijdvakvangbaarheid kan beperkt beschrijvend worden onderzocht met expliciete hengeluren en betrouwbare vangsttijdstippen; dit valideert geen tijdvakvoedingsvoorkeur.
- Voor lokale fysiologische activiteit, dagelijkse voedselopname/foerageerintensiteit, habitat-aanwezigheid en een samengestelde biologische 1–10-respons ontbreken momenteel geschikte directe labels.
- De huidige historische sessie-uitkomsten mogen daarom niet worden hergebruikt als schijnlabel voor de samengestelde biologische score. Synthetische tests bewijzen softwaregedrag, geen biologische nauwkeurigheid.

### 134.5 Formele reviewuitkomst en hervattingspunt

**Kandidaatarchitectuur inhoudelijk beoordeeld; kandidaatmodel niet numeriek toegelaten.** Optie A blijft uitsluitend als transparante voorlopige thermische baseline bestaan. De huidige runtime blijft ongewijzigd en mag niet worden omschreven als een reeds gerealiseerd gecombineerd activiteit-/voedingsmodel. Er zijn geen nieuwe factoren, gewichten, interacties, scoreankers, tijdvakbonussen of datavelden geactiveerd.

De documentreview kan hiermee als afgerond worden beschouwd, maar de formele Fase-2-acceptatie niet. De onafhankelijke biologische evaluatiepoort blijft open zolang passende labels ontbreken. De eigenaar heeft optie A expliciet geaccepteerd; de voorlopige thermische uitzondering is transparant vastgelegd zonder de bewijsnorm voor nieuwe factoren te verlagen. De afzonderlijke productbesluiten over voorvoergrammen bij lage invoerkwaliteit en de optionele hengel-/methodepreset blijven nog bij de eigenaar.

**Vaste vervolgstappen:**
1. Optie A is al expliciet door de eigenaar gekozen en vastgelegd. Vraag vóór runtimewijzigingen alleen nog de afzonderlijke eigenaarbesluiten over voorvoergrammen/invoerkwaliteit en de optionele hengel-/methodepreset; verander deze punten niet stilzwijgend.
2. Onderzoek of bestaande of extern beschikbare onafhankelijke directe biologische datasets bruikbaar zijn voor responsvalidatie; documenteer populatie, levensfase, meetmethode, context en overdraagbaarheid per dataset.
3. Werk pas daarna referentieankers en kandidaatresponsfuncties uit voor de responsen waarvoor het bewijs werkelijk geschikt is.
4. Voer bij beschikbare labels een rolling-origin vergelijking uit met identieke waarnemingen voor baseline en kandidaat, factorablaties, coverage-strata en rapportage van negatieve uitkomsten.
5. Werk de zevenpunts-crosswalk bij en vraag formele Fase-2-acceptatie pas wanneer de resterende criteria aantoonbaar zijn afgehandeld. Fase 3 blijft geblokkeerd.

Geen runtimewijziging, geen nieuwe gebruikersinvoer en geen wijziging aan historische data.


## 135. Nieuwe open dataset: directe prooiconsumptie bij jonge snoek (20 november 2026)

### 135.1 Bron en meetopzet

Een nieuwe, nog niet in de registry aanwezige publicatie en open dataset zijn gecontroleerd:
- Nilsson-Örtman, V., Nilsson, E. & Brönmark, C. (2026), *Effects of temperature and browning on the functional response of a freshwater top predator*, Journal of Animal Ecology 95(5), 824–836, DOI: 10.1111/1365-2656.70233.
- Bijbehorende ruwe data en reproduceerbare R-code: Dryad DOI 10.5061/dryad.kkwh70sjc.

De studie meet direct hoeveel prooivissen jonge 0+-snoek daadwerkelijk consumeerden:
- Experiment 1: 192 gecontroleerde proeven; 5, 9 en 13 °C; helder versus matig bruin water; vier prooidichtheden (2, 5, 10, 20); gemiddeld circa 23,5 uur per proef.
- Experiment 2: 80 proeven bij 9 °C; twee prooidichtheden en vijf gradaties van verbruining.
- De eerste proef gebruikte 24 snoeken van gemiddeld 51,8 g (range 34,5–79,2 g; circa 165–220 mm), uitsluitend 0+-dieren uit één Zuid-Zweedse meerpopulatie. Blankvoorn vormde meer dan 95% van de prooien.
- De aanvullende volwassen-snoekdata zijn lichaamstemperatuurregistraties van zes dieren in drie grote experimentele vijvers; er zijn geen gelijktijdige voedingslabels. De primaire methodesectie beschrijft experimentele vijvers, hoewel de Dryad-paginabeschrijving de dieren vrijlevend noemt.

### 135.2 Wat deze bron wel en niet toevoegt

**Wel:** direct gemeten, experimentele voedingsintensiteit/functionele respons bij jonge snoek, met temperatuur, zichtconditie en prooidichtheid als expliciete behandelingen. De open CSV-data bevatten onder meer temperatuur, prooidichtheid, replicaat, individuele PIT-tag, trialduur en aantal gegeten prooien. De R-analyse is beschikbaar voor reproduceerbare controle.

**Niet:** een volwassen veldcurve, een algemeen dagelijks rantsoen, een directe fysiologische activiteitsscore, een Nederlandse stekrespons of een tijdvakvoorkeur. De proeven omvatten vrijwel een volledig etmaal en geven geen individuele vangsttijdstippen.

De belangrijkste inhoudelijke uitkomst is dat temperatuur- en verbruiningseffecten op de voedingssnelheid opvallend zwak waren. Alleen bij 5 °C in helder water werd een koepelvormige Type-IV-functionele respons gevonden; bij de meeste andere behandelingen was de exacte responsvorm niet overtuigend te onderscheiden. Dit is een waarschuwing tegen het aannemen van een sterke monotone temperatuurbijdrage voor snoekvoeding en tegen het overzetten van één koude behandeling naar een algemene curve.

### 135.3 Registry- en modelbesluit

De bron is toegevoegd als `northern-pike-functional-response-temperature-browning-2026`, gemeten respons `feeding_intensity`, soort Snoek, bewijssterkte **limited**, `approvedForPrediction: false`. De bron is ook als traceerbare referentie aan het Snoek-profiel gekoppeld. De registry telt hiermee 87 records; nog steeds zijn 0 records goedgekeurd voor directe numerieke voorspelling.

**Geen toelating voor runtime:** de studie mag uitsluitend als direct maar levensfase- en contextgebonden kandidaatbewijs worden gebruikt. Zij valideert de bestaande volwassen Snoek-thermische parameters niet, levert geen generieke temperatuurcurve en rechtvaardigt geen zicht-/troebelheidsbonus. De volwassen lichaamstemperatuurreeks mag niet als voedingslabel aan de jonge-snoekproeven worden gekoppeld.

**Vervolg:** controleer de downloadbare CSV en analysecode op reproduceerbaarheid en op de exacte modelvariabelen/uitsluitingen voordat eventueel een beperkte responskaart of referentie wordt ontworpen. Geen numerieke parameter, gewicht, tijdvakbonus of runtimegedrag gewijzigd.


## 136. Veldschattingen van dagelijkse voedselopname: karper, brasem en blankvoorn (20 november 2026)

Twee aanvullende veldpublicaties zijn bibliografisch en op basis van hun publiek beschikbare samenvattingen getrieerd. Beide schatten dagelijkse voedselopname via maag-/darminhoud en ledigingsmodellen; zij leveren dus relevante voedingsintensiteitsinformatie, maar geen rechtstreeks geobserveerde individuele voedselinname en geen lokale Nederlandse modelvalidatie.

### 136.1 Garcia & Adelman (1985) — karper

Garcia, L.M. & Adelman, I.R. (1985), *An in situ estimate of daily food consumption and alimentary canal evacuation rates of common carp, Cyprinus carpio L.*, Journal of Fish Biology 27(4), 487–493, DOI 10.1111/j.1095-8649.1985.tb03196.x.

De publiek beschikbare samenvatting beschrijft schattingen met intervallen van vier weken van april tot oktober 1979. De berekende dagelijkse consumptie varieerde van 3,87 mg/g visnatgewicht/dag (0,39% lichaamsgewicht) bij 14 °C in april tot 40,75 mg/g/dag (4,08%) bij 26,5 °C in augustus. De ledigingsrate nam exponentieel toe met temperatuur. Een ogenschijnlijk ochtend-/avondverschil in voedselopname was niet statistisch significant.

**Beperking:** het betreft een modelmatige veldschatting via gastro-intestinale lediging. De publiek beschikbare samenvatting geeft geen volledige steekproefomvang, grootteverdeling, exact waterlichaam of volledige methode-/modeldiagnostiek. De seizoens- en temperatuurvariatie mogen daarom niet als zuivere temperatuurcausaliteit of Nederlandse karpercurve worden geïnterpreteerd.

### 136.2 Specziár (2002) — meerdere cypriniden in het Balatonmeer

Specziár, A. (2002), *An in situ estimate of food consumption of five cyprinid species in Lake Balaton*, Journal of Fish Biology 60(5), 1237–1251, DOI 10.1111/j.1095-8649.2002.tb01717.x.

De samenvatting rapporteert modelgeschatte dagelijkse rantsoenen voor karper, brasem en blankvoorn, naast zilverbrasem en giebel, bij watertemperaturen van circa 8,7–25,8 °C. De Eggers- en Elliott–Persson-schattingen verschilden gemiddeld slechts beperkt (−4,3 tot +7,3%). De dagelijkse rantsoenen namen exponentieel toe met temperatuur voor karper en blankvoorn. Voor brasem werd een significante relatie alleen verkregen nadat één rantsoenwaarneming uit de analyse was verwijderd.

**Beperking:** beide rantsoenmodellen gebruiken dezelfde maag-/darminhoudscontext en vormen geen twee onafhankelijke biologische replicaties. Het betreft één groot ondiep Hongaars meer; de volledige primaire steekproef-/methodedetails en onderliggende waarnemingen zijn nog niet gecontroleerd. De brasemrelatie is gevoelig voor een uitgesloten waarneming en mag niet als robuuste curve worden behandeld.

### 136.3 Registrybesluit en modelgrenzen

Beide publicaties zijn opgenomen als `feeding_intensity`-kandidaatbewijs met bewijssterkte **limited** en `approvedForPrediction: false`. De Garcia-bron is gekoppeld aan Karper; de Specziár-bron aan Karper, Brasem en Voorn. De Snoek-, Karper-, Brasem- en Voorn-profielen verwijzen nu naar de passende publicaties.

Deze bronnen vergroten de externe bewijsbasis, maar leveren geen lokale onafhankelijke labels voor de Vislogboek-score en valideren niet de huidige thermische profielparameters. De gemelde rantsoenen mogen niet rechtstreeks worden omgerekend naar vangstkans, method-feederprestatie, voergrammen of tijdvakbonussen. De ochtend-/avondwaarneming bij Garcia is niet significant; voor brasem is de temperatuursamenhang bij Specziár gevoelig voor één weggelaten datapunt.

Registrytelling: 89 records, 0 numeriek goedgekeurd. Geen runtimefactor, parameter, gewicht, interactie of tijdvakbonus geactiveerd. Eerst volledige primaire methoden en steekproefcontext verifiëren voordat responsankers worden overwogen.


## 137. Volwassen baars: dagelijkse veldrantsoenen in Loch Leven (20 november 2026)

Thorpe, J.E. (1977), *Daily ration of adult perch, Perca fluviatilis L. during summer in Loch Leven, Scotland*, Journal of Fish Biology 11(1), 55–68, DOI 10.1111/j.1095-8649.1977.tb04098.x, is toegevoegd als beperkte veldbron voor Baars.

Volwassen baarzen werden tijdens 24-uurscycli om de drie uur bemonsterd in juni–september 1971 en juni/augustus 1972. De dagelijkse rantsoenen werden geschat uit maaginhoud en maaglediging en namen af van circa 6,5% nat lichaamsgewicht per dag in juni tot 3,2% in september.

**Belangrijke beperkingen:** maaglediging bij gekooide vissen was langzamer dan bij vrijlevende vissen; de auteurs beschouwen de rantsoenschattingen daarom als minimale waarden. De studie betreft één Schots meer en zomerperioden. De publiek beschikbare samenvatting bevat geen watertemperatuurreeks, zodat dit geen temperatuur-responscurve oplevert. Het is een voedingsintensiteits-/seizoensbron, geen lokale Nederlandse labelset, geen vangstkansmeting en geen validatie van de thermische profielcurve.

De bron is geregistreerd als `feeding_intensity` en `feeding_rhythm`, bewijssterkte **limited**, `approvedForPrediction: false`, en gekoppeld aan het Baars-profiel. Registrytelling: 90 records, 0 numeriek goedgekeurd. Geen tijdvakbonus of runtimefactor geactiveerd.


## 138. Primaire-methodesectie versus Dryad-metadata: snoekdataset 2026 nader geverifieerd (20 november 2026)

De volledige open-access publicatie van Nilsson-Örtman et al. (2026) is naast de Dryad-datasetbeschrijving gelegd. Deze controle corrigeert twee onnauwkeurigheden en maakt een bronmetadata-conflict expliciet.

### 138.1 Volwassen snoeken: experimentele vijvers, geen natuurlijke veldpopulatie

De primaire methodesectie §2.4 meldt dat zes volwassen snoeken met biosensoren gedurende twaalf maanden zijn gevolgd in **drie grote experimentele vijvers** (70 × 30 m, 1,5 m diep). De dieren werden elektrisch gevangen, naar de vijvers vervoerd, in kooien geacclimatiseerd, op 23 november 2021 met sensoren vrijgelaten in de vijvers en begin oktober 2022 teruggevangen. De meting is lichaamstemperatuur om de 30 minuten.

De Dryad-paginabeschrijving noemt deze dieren "free-ranging adult pike". Dat is zonder de habitatcontext misleidend: de primaire methodesectie specificeert experimentele vijvers. Deze zes dieren leveren uitsluitend thermische validatiegegevens voor de klimaatsimulatie; er zijn geen gekoppelde voedings- of vangstlabels. Ze mogen dus niet worden beschreven als een volwassen natuurlijke veldvoedingsdataset of als bewijs voor volwassen snoek-activiteit.

### 138.2 Experimentele 0+-voedingsdata: steekproef- en uitsluitingsverschil

De primaire publicatie §2.1 rapporteert 24 jonge 0+-snoeken (gemiddeld 51,8 ± 12,8 g; 34,5–79,2 g) voor experiment 1. De Dryad-README vermeldt bij dezelfde beschrijving n=23, terwijl de paper n=24 aangeeft. De paper meldt daarnaast dat drie **proefwaarnemingen** met negatieve gecorrigeerde voedingssnelheid uit de analyse zijn verwijderd omdat de betrokken snoeken nog niet begonnen waren met eten in het laboratorium. De README beschrijft het Outlier-veld daarentegen als drie **individuen**. Deze formuleringen zijn niet equivalent en mogen niet stilzwijgend als hetzelfde uitsluitingsniveau worden geïnterpreteerd.

Voor experiment 2 vermeldt de primaire paper afzonderlijk dat twee dieren wegens schimmelinfectie tijdens de vastenperiode werden uitgesloten; de uiteindelijke steekproef was 22 dieren. Deze uitsluitingen mogen niet worden samengevoegd met de drie negatieve proefwaarnemingen uit experiment 1.

### 138.3 Inhoudelijke interpretatie blijft begrensd

De primaire paper bevestigt de directe meting van gegeten prooien in 0+-snoek, maar ook de nauwe context: winterproeven in laboratoriumarena's, herhaald gebruik van individuele dieren, vier dagen gestandaardiseerd vasten tussen opeenvolgende proeven en vooral jonge cyprinide prooien. De 23,5-uursvensters integreren een volledige dag-nachtcyclus; er zijn geen individuele consumptietijdstippen waarmee een ochtend-/avondscore kan worden afgeleid.

De resultaten blijven relevant als directe functionele voedingsrespons onder gecontroleerde condities. De paper rapporteert opvallend zwakke temperatuur-/verbruiningseffecten en een Type-IV-vorm alleen bij 5 °C in helder water; voor de meeste overige behandelingen was de exacte responsvorm niet overtuigend te onderscheiden. Dit is geen algemene thermische voedselopnamecurve voor volwassen snoek en geen validatie van de huidige profielparameters.

### 138.4 Registry- en toelatingsbesluit

De registrybeperking is aangescherpt: de volwassen lichaamstemperatuurreeks wordt expliciet omschreven als zes volwassen snoeken in experimentele vijvers, zonder voedingslabels. De primaire paper is leidend boven de verkorte habitatomschrijving in de Dryad-metadata. De regressietest bewaakt deze beperking.

De ruwe CSV en Analysis.R zijn via de Dryad-downloadlinks in deze controleomgeving niet rechtstreeks opgehaald (HTTP 403); daarom claimen we geen zelfstandige heruitvoering van de R-analyse of rij-voor-rij-audit van de CSV. De controle berust op de volledige primaire publicatie, de zichtbare Dryad-bestandsbeschrijvingen en de gepubliceerde README. Dat is voldoende voor de hierboven beschreven scopecorrectie, maar niet voor een onafhankelijke reproductie van de modelpassing.

**Besluit:** behoud de bron als directe maar beperkte feeding_intensity-kandidaat voor 0+-snoek, approvedForPrediction=false. De volwassen vijvertemperatuurreeks blijft uitsluitend thermische context, geen voedingslabel. Geen score, factor, gewicht, parameter, tijdvakbonus of runtimegedrag gewijzigd.

Bronnen:
- Nilsson-Örtman, V., Nilsson, E. & Brönmark, C. (2026). Effects of temperature and browning on the functional response of a freshwater top predator. Journal of Animal Ecology, 95(5), 824–836. https://doi.org/10.1111/1365-2656.70233
- Dataset en README: https://doi.org/10.5061/dryad.kkwh70sjc


## 139. Larvale baars en snoekbaars: veldschattingen dagelijkse voedselopname (20 november 2026)

Worischka & Mehner (1998), *Comparison of field-based and indirect estimates of daily food consumption in larval perch and zander*, Journal of Fish Biology 53(5), 1050–1059, DOI 10.1111/j.1095-8649.1998.tb00462.x, is als beperkte aanvullende bron beoordeeld.

De auteurs vergeleken dagelijkse rantsoenen die in het veld werden geschat uit maagvullingsgegevens over een 24-uurscyclus met indirecte bio-energetische modelschattingen. De veldmethode gebruikte uurlijkse bemonstering en zowel lineaire als exponentiële maagledigingsfuncties. De gerapporteerde dagelijkse rantsoenen waren:
- Larvale baars, gemiddelde totale lengte 13,1 mm: 0,21–0,27 g/g/dag.
- Larvale snoekbaars, gemiddelde totale lengte 10,6 mm: 0,31–0,40 g/g/dag.

De hogere waarden kwamen uit het exponentiële maagledigingsmodel. De auteurs vonden bovendien dat schattingen op basis van alleen iedere derde uurmeting slechts 41–72% bedroegen van de schattingen op basis van uurlijkse metingen. Dat onderstreept dat de afgeleide rantsoenen gevoelig zijn voor het bemonsteringsinterval en de gekozen evacuatiefunctie.

**Beperkingen:** dit zijn larvale vissen, geen volwassen sportvispopulaties. De waarden zijn modelgebaseerde veldschattingen uit maagvulling, geen rechtstreeks gewogen individuele voedselopname. De volledige primaire tekst was niet toegankelijk via Wiley (HTTP 403); steekproefomvang, exacte locatie, temperatuurreeks, prooisamenstelling en volledige modeldiagnostiek zijn daarom niet onafhankelijk gecontroleerd.

De bron is geregistreerd als feeding_intensity voor Baars en Snoekbaars, bewijssterkte **limited**, approvedForPrediction=false, en aan beide soortprofielen gekoppeld. De bron levert geen volwassen thermische curve, lokale Nederlandse referentielabels, hengelvangbaarheid of tijdvakbonus. Geen profielparameter, score, gewicht of runtimefactor gewijzigd.


## 140. Volwassen baars en blankvoorn: jaarlijkse veldschatting dagelijkse consumptie (20 november 2026)

Jamet (1994), *Feeding activity of adult roach, perch and ruffe in eutrophic Lake Aydat (France)*, Aquatic Sciences 56(4), 376–387, DOI 10.1007/BF00877183, is als beperkte aanvullende bron beoordeeld.

De studie volgde de voedingsactiviteit van volwassen blankvoorn en baars in één eutroof Frans meer over een jaarlijkse cyclus. Er werd maandelijks bemonsterd van april 1987 tot juli 1988 (juni 1988 uitgezonderd), in littorale en pelagische zones met bodem- en drijvende kieuwnetten. Maaginhoud werd gewogen en de prooien werden geïdentificeerd. Dagelijkse voedselconsumptie werd berekend met het Eggers-model: gemiddelde maaginhoud over 24 uur vermenigvuldigd met een instantane maagledigingsrate die exponentieel afhankelijk is van watertemperatuur. De consumptie werd vervolgens gekoppeld aan de geschatte visstand per leeftijdsklasse.

De studie beschrijft duidelijke seizoensveranderingen in dieet en consumptie. Blankvoorn gebruikte onder meer macro-invertebraten, sediment, macrophyten en fytoplankton; baars consumeerde vooral macro-invertebraten en visbroed. De bron is daarmee relevant voor seizoensgebonden voedingsintensiteit en dieetcontext bij volwassen vissen.

**Beperkingen:** het betreft één eutroof Frans meer met eigen prooiaanbod, zuurstofstratificatie, habitat en visstand. De dagelijkse consumptie is een modelschatting uit maaginhoud en maaglediging, geen rechtstreeks gemeten individuele voedselinname. De temperatuurafhankelijke maaglediging maakt deel uit van de berekening. Maandelijkse bemonstering ondersteunt geen sessie- of uurgebonden tijdvakvoorkeur. Seizoensveranderingen vallen samen met prooiaanbod, voortplanting, zuurstof en habitatgebruik; zij mogen niet als zuivere temperatuurcausaliteit worden gebruikt.

De bron is geregistreerd als feeding_intensity en diet_composition voor Baars en Voorn, bewijssterkte **limited**, approvedForPrediction=false, en gekoppeld aan beide soortprofielen. Zij levert geen lokale Nederlandse labels, volwassen thermische curve, hengelvangbaarheid of validatie van bestaande profielparameters. Geen score, gewicht, parameter of runtimefactor gewijzigd.


## 141. Volwassen blankvoorn: leeftijdsafhankelijke dag-nachtvoeding in Lake Aydat (20 november 2026)

Jamet, Gres, Lair & Lasserre (1990), *Diel feeding cycle of roach (Rutilus rutilus, L.) in eutrophic Lake Aydat (Massif Central, France)*, Archiv für Hydrobiologie 118(3), 371–382, DOI 10.1127/archiv-hydrobiol/118/1990/371, is op basis van de beschikbare primaire samenvatting beoordeeld als direct maar smal feeding-rhythm-bewijs.

Op 20–21 juli 1988 werden volwassen blankvoorns met vieruursintervallen bemonsterd; de maaginhoud van 253 vissen met lengtes van 98–240 mm werd onderzocht op samenstelling en vullingsgraad. De voedingsactiviteit verschilde met leeftijd: jongere 2- en 3-jarige vissen voedden vooral vanaf 14:00 uur tot de schemering en selecteerden cladoceren; oudere vissen voedden zowel overdag als 's nachts, met intensiteit en periodiciteit die per leeftijd verschilden en een gemengd dieet.

**Overdraagbaarheid:** dit is direct maaginhoud-/voedingsritmebewijs, maar slechts één 24-uurscyclus op één zomerdatum in één eutroof Frans meer. De steekproef is leeftijds- en lengtegestructureerd; het patroon is niet één universele blankvoorncurve. Vieruursintervallen geven geen nauwkeurige aanvang/eindtijd en de studie levert geen Nederlandse lokale labels, method-feederrespons, aasvangbaarheid of temperatuurrespons. De bron ondersteunt dat leeftijd en dieet het tijdvakpatroon kunnen wijzigen, niet een algemene dusk-bonus. De volledige primaire tekst en alle methodedetails zijn in deze controle niet onafhankelijk opgehaald; classificatie blijft beperkt tot de bibliografische primaire samenvatting.

**Besluit:** behouden als beperkte, leeftijdsafhankelijke feeding_rhythm-context voor blankvoorn; niet numeriek goedgekeurd en niet vertaald naar vaste tijdvakgewichten. Geen score, gewicht, parameter of runtimefactor gewijzigd.

## 142. Europese meerval: juveniele dagelijkse voerbehoefte in koelwaterkweek (20 november 2026)

Filipiak, Sadowski & Trzebiatowski (1997), *Comparative analysis of results of using different food rations in juvenile wels (Silurus glanis) culture*, Acta Ichthyologica et Piscatoria 27(1), 41–51, DOI 10.3750/AIP1997.27.1.03, is opnieuw beoordeeld als kandidaatbron voor temperatuurafhankelijke dagelijkse voerbehoefte.

De beschikbare primaire artikelweergave/abstract beschrijft twee juveniele gewichtsgroepen (65 ± 10 g en 110 ± 10 g per vis), gehouden in kooien in koelwater gedurende 49 dagen. Semi-geëxtrudeerd voer (48,5% ruw eiwit; 14,4% lipiden; 20,97 kJ/g bruto-energie) werd in vijf aangeboden rantsoenniveaus getest: 1%, 1,5%, 2%, 2,5% en 3% van metabool gewicht (W^0,8). De auteurs rapporteren een dagelijkse voerbehoefte van 2% W^0,8 bij 24–28 °C en maximaal 1,5% W^0,8 bij 18–23 °C.

**Overdraagbaarheid:** de bron is direct relevant voor dagelijkse voerbehoefte binnen een juveniel kweekregime, maar de beschikbare weergave maakt niet voldoende duidelijk hoe feitelijke opname, restvoer, voerfrequentie, replicatie en temperatuurverloop precies zijn gemeten of toegewezen. De temperatuurbanden zijn breed en geen gecontroleerde fijnmazige responscurve. Het gaat om kleine juvenielen, kunstvoer met hoge eiwitfractie en koelwaterkooien; niet om volwassen wilde meerval, natuurlijk prooiaanbod, method-feederpellets of aasopname. De uitkomst is bovendien een kweekrantsoen per metabool gewicht, niet de kans dat een vis op een bepaalde sessie eet of wordt gevangen.

**Besluit:** kandidaat voor verdere methodologische verificatie; niet als gevalideerde thermische curve of actieve parameter gebruiken. Geen registry-goedkeuring, score, gewicht, voorvoerhoeveelheid of runtimefactor op basis van deze samenvatting. De volledige PDF-link gaf in deze controle HTTP 403; de methodeclaims blijven daarom expliciet beperkt.

## 143. Volwassen baars en blankvoorn: primaire methodecontrole Jamet (1994) (20 november 2026)

De volledige primaire tekst van Jamet (1994), *Feeding activity of adult roach, perch and ruffe in eutrophic Lake Aydat (France)*, Aquatic Sciences 56(4), 376–387, DOI 10.1007/BF00877183, is nu gecontroleerd. Dit bevestigt en preciseert audit §140.

De studie bemonsterde maandelijks van april 1987 tot juli 1988 (juni 1988 uitgezonderd) in littorale en pelagische zones met bodem- en drijvende kieuwnetten. Maaginhoud werd gewogen en prooien werden geïdentificeerd. De auteurs berekenden dagelijkse consumptie met het Eggers-model: D24 = 24 × S × R, waarbij S de gemiddelde maaginhoud over 24 uur is en R de instantane maagledigingsrate, die exponentieel afhankelijk is van watertemperatuur. De dagelijkse consumptie werd vervolgens gerelateerd aan de geschatte biomassa/stand van de leeftijdsklassen.

De primaire tekst bevestigt dat de studie een eutroof, gestratificeerd meer betreft (60,3 ha; maximale diepte 15,5 m), met tijdens de zomer gemeten temperatuurverschillen van 22,1 °C aan het oppervlak tot 8,0 °C op de bodem en een lage bodemzuurstofwaarde van 0,9 mg/L. Voedselcompartimenten en seizoenspatronen verschilden duidelijk: onder meer voortplantingsgerelateerde lage voedingsactiviteit in april/mei, hoge consumptie in bepaalde zomer- en herfstperioden, en een winterdieet met veel sediment bij blankvoorn. Bij baars was de voedingsactiviteit in de winter sterk verminderd.

**Methodologische precisering:** dit is een populatie-/leeftijdsklasse-gerelateerde consumptieschatting uit maaginhoud en een temperatuurafhankelijke maagledigingsfunctie, niet een rechtstreeks gemeten individuele dagelijkse opname. Omdat temperatuur onderdeel is van de berekende maaglediging, mag de geschatte consumptie niet onafhankelijk als zuivere temperatuurrespons worden behandeld. Maandelijkse bemonstering kan bovendien geen sessie- of uurgebonden tijdvakscore valideren. Temperatuur, zuurstofstratificatie, prooiaanbod, habitat, voortplanting en seizoensverloop zijn verweven.

**Besluit:** §140 blijft inhoudelijk juist maar is met deze primaire methodedetails aangescherpt. Jamet (1994) blijft limited en approvedForPrediction=false voor Baars en Voorn; alleen seizoens-/dieetcontext, geen thermische curve, lokale Nederlandse referentielabels of tijdvakbonus. Geen score, gewicht, parameter of runtimefactor gewijzigd.


## 144. Europese meerval: primaire veldstudie seizoensmaagvulling en leeftijd (20 november 2026)

Yazici, Yilmaz & Yazıcıoğlu (2025), *Exploring Prey Selectivity and Feeding Habits of Wels Catfish (Silurus glanis L., 1758) in a Deep Anatolian Reservoir: Seasonal, Length, and Age-Dependent Diet Analysis*, Aquaculture Nutrition, Article 4619857, DOI 10.1155/anu/4619857, is nu op de volledige primaire tekst gecontroleerd. De bron was al in de registry opgenomen; deze controle scherpt de interpretatie en overdraagbaarheidsbeperkingen aan.

De studie bemonsterde maandelijks 200 meervallen in Sıddıklı Dam Lake van september 2015 tot augustus 2016. Maaginhoud werd gewogen en geïdentificeerd; de auteurs gebruikten fullness index (FI) en vacuity index (VI) als indicatoren voor voedingsintensiteit, naast dieetindices. De totale lengtes liepen van 20,41 tot 101,0 cm en de leeftijden van 1 tot 11 jaar. De maagvullingsindex verschilde tussen seizoenen: hoogste gemiddelde FI in de winter (0,827) en laagste in de herfst (0,480). Het percentage lege magen was het hoogst in de zomer (48,9%) en laagst in de winter (14,3%).

**Kritische steekproefcontrole:** de seizoensgroepen waren sterk ongelijk verdeeld: voorjaar n=49, zomer n=98, herfst n=46 en winter slechts n=7. Het wintermaximum is daarom bijzonder onzeker en mag niet als sterke wintervoedingsregel worden gelezen. Ook de leeftijdsgroepen waren ongelijk: n varieerde van 3–81 vissen per leeftijd; enkele leeftijdsspecifieke FI-uitspraken rusten op zeer kleine aantallen. De studie toont daarnaast leeftijds- en lengteafhankelijke dieetverschillen.

**Overdraagbaarheid:** dit is direct veldbewijs voor maagvulling/voedingsintensiteit, niet voor individuele dagelijkse voedselopname of vangbaarheid. Er zijn geen individuele voedingsmomenten of diel-tijdvakken gemeten. De methode beschrijft maandelijkse bemonstering en seizoensvergelijking; een bruikbare watertemperatuurreeks per vangst of statistische temperatuurrespons is niet gerapporteerd. De auteurs bespreken temperatuur, vertering, voortplanting en daglengte als mogelijke verklaringen, maar de seizoens-FI mag niet als zuiver temperatuurcausaal effect worden gebruikt. Eén diep Anatolisch stuwmeer met een eigen prooigemeenschap is bovendien geen directe Nederlandse watercontext.

**Besluit:** behoud als limited/moderate veldcontext voor maagvulling, voedingsintensiteit en dieet, approvedForPrediction=false. Geen winterbonus, thermische curve, tijdvakscore of vangstkansregel afleiden. De registry-samenvatting en regressietest zijn aangescherpt met de kleine wintersteekproef en de ontbrekende directe temperatuur-/dielrespons. Geen score, gewicht, parameter of runtimefactor gewijzigd.


## 145. Snoek: primaire veldstudie 2025 — temperatuurcorrelatie en statistische rapportageconflict (20 november 2026)

Yazıcıoğlu, Yazıcı, Yağcı & Yılmaz (2025), *Diet and feeding strategy of northern pike (Esox lucius L., 1758) inhabiting a deep dam lake in Central Anatolia, Türkiye*, Folia Biologica (Kraków) 73(3), 92–103, DOI 10.3409/fb_73-3.10, is op de volledige gepubliceerde primaire PDF gecontroleerd. De bron stond al als limited feeding_intensity/diet_composition in de registry; deze controle corrigeert de precisie van de statistische interpretatie.

De auteurs bemonsterden maandelijks 133 snoeken (23,4–86,6 cm; gemiddelde 53,84 ± 10,51 cm) in Sıddıklı Küçükboğaz Dam Lake van september 2015 tot augustus 2016. De maagvullingsindex (FI = maaginhoudgewicht / visgewicht × 100) was numeriek het hoogst in zomer (1,59) en herfst (1,13), en het laagst in winter (0,51) en voorjaar (1,07). Seizoenssteekproeven: voorjaar n=29, zomer n=21, herfst n=24, winter n=59. De auteurs rapporteerden 73 vissen met voedsel en 60 lege magen.

**Temperatuurcontrole:** de oppervlaktetemperatuur werd maandelijks gemeten en liep in de tabel van 3,10 °C (januari) tot 24,48 °C (juli). De Spearman-correlatie tussen FI en temperatuur was zeer zwak (r_s=0,117) en niet statistisch significant (p>0,05). De studie onderbouwt dus geen kwantitatieve thermische voedingsrespons of temperatuurcurve. De bemonstering gebruikte kieuwnetten die bij schemering werden uitgezet en minimaal 12 uur bleven staan, met ophalen tussen 08:00 en 09:00; dit levert geen individuele voedingsmomenten of diel-tijdvaklabels.

**Statistische rapportageconflict:** het abstract zegt dat seizoensverschillen in voedingsintensiteit niet significant waren, maar vermeldt daarbij K-W p<0,05. Dat is intern tegenstrijdig. De resultaten geven numerieke FI-waarden, maar rapporteren expliciet een niet-significant K-W-resultaat (p>0,05) voor de vacuïteitsindex (VI); er wordt geen eenduidige aparte FI-teststatistiek/p-waarde gepresenteerd. De registry mag daarom niet zonder voorbehoud stellen dat FI-seizoensverschillen statistisch niet significant zijn, noch dat zij significant zijn. De juiste classificatie is: numerieke seizoensvariatie, inferentiële conclusie voor FI onduidelijk door tegenstrijdige/onvolledige rapportage. De temperatuur-FI-correlatie is wel expliciet niet significant.

**Overdraagbaarheid:** één Anatolisch stuwmeer met eigen prooigemeenschap en maandelijkse oppervlaktetemperatuurmetingen; geen Nederlandse lokale labels, geen temperatuurprofiel op diepte en geen tijdstip per individuele maaginhoud. De bron ondersteunt beperkte veldcontext voor dieet en maagvulling, niet directe individuele dagelijkse opname, een volwassen Nederlandse thermische curve of vangbaarheid.

**Besluit:** bron blijft limited en approvedForPrediction=false. Registrytekst is aangepast om het abstract-/resultatenconflict expliciet te bewaren. Geen seizoensbonus, thermische curve, tijdvakscore of runtimefactor afleiden. Geen score, gewicht of parameter gewijzigd.


## 146. PR #189 afgerond: broncontroles, crosswalk en technische borging (20 november 2026)

PR #189 is squash-merged naar `main` als `6661623cb591623c40ba7886a85a0cbb3c99ab86`. De exacte PR-head `27bbb2e0d84ba0df5dd48cf09ea14f766137afd8` doorliep de Quality Gate succesvol (TypeScript typecheck, volledige testreeks en production build). De Quality Gate op de mergecommit is eveneens volledig geslaagd.

De PR heeft audit §§141–145 toegevoegd/aangescherpt, de primaire bronbeperkingen in de registry vastgelegd en de zevenpunts-crosswalk §89 herijkt. De registry blijft 92 records en 0 numeriek goedgekeurde bronnen. Er zijn geen runtime-, score-, gewicht-, parameter-, UX- of invoerwijzigingen uitgevoerd.

De eigenaarbeslissing optie A is expliciet vastgelegd: bestaande thermische curves blijven uitsluitend als voorlopige mechanistische prior actief. De keuze is gesloten; wetenschappelijke validatie van de curveparameters blijft een afzonderlijke beperking.

De huidige wijzigingsreeks is technisch gevalideerd. Dit sluit Fase 2 inhoudelijk niet af: de geïntegreerde biologische dagscore, directe lokale biologische labels, een gevalideerde tijdvakrespons en de afzonderlijke tactische productbesluiten blijven open. **Fase 2 blijft niet geaccepteerd; Fase 3 blijft geblokkeerd.**


## 147. Blankvoorn: Prejs (1978) — dieetgebonden dagritme en geschatte dagelijkse planteninname (20 november 2026)

Prejs, A. (1978), *Lake macrophytes as the food of roach (Rutilus rutilus L.) and rudd (Scardinius erythrophthalmus L.). II. Daily intake of macrophyte food in relation to body size of fish*, Ekologia Polska 26(4), 537–553, is volledig gecontroleerd via de gedigitaliseerde primaire PDF.

**Meetopzet en direct bewijs:** veldwerk en laboratoriumexperimenten vonden plaats rond 20 °C in drie eutrofe meren van het Mazurisch Merengebied. De auteur gebruikte veldmateriaal voor maag-/darminhoud en dagritme; 38 blankvoorns van 18,5–21,0 cm werden gebruikt voor het onderzoek naar dagritme, en 22 blankvoorns voor de analyse van macrophyten in de darm. De darmvullingsindex van de onderzochte plantenetende groep bleef overdag redelijk gelijk. Bij tien blankvoorns (18,5–19,5 cm) die tussen 01:00 en 02:00 uur werden gevangen, hadden vier lege darmen, vijf nog plantenresten in 10–30% van de darm en één alleen achterin gevulde darm. De auteur concludeerde dat opname van macrophyten in deze onderzochte groep tijdens volledige duisternis vrijwel stilviel en rond de ochtend weer begon.

**Dagelijkse rantsoenraming:** de auteur combineerde veldhoeveelheid macrophyten in de darm, passage-/turnover-rate en laboratoriumgegevens. De geschatte natuurlijke dagelijkse rantsoenen lopen in twee varianten uiteen: circa 9,5–4,8% en 15,5–7,7% van vers lichaamsgewicht voor vissen van circa 11 tot 24 cm. Dit is dus geen rechtstreekse individuele veldmeting van dagelijks geconsumeerd gewicht. De passage-rate methode is afhankelijk van aannames over voedselassimilatie, passage en continuïteit van opname; de auteur bespreekt de beperkingen expliciet. De directe laboratoriummetingen voor rudd met Lemna trisulca bedroegen 8–18% BW, terwijl Elodea canadensis slechts 0,2–4% BW opleverde; de vier blankvoorns in de labgroep waren te weinig om deze ruddresultaten als blankvoornparameter te gebruiken.

**Overdraagbaarheid en spanning met andere bronnen:** dit is nuttig direct veldbewijs dat het dag-/nachtritme kan verschillen naar dieet/voedselgilde. Het gaat specifiek om blankvoorn die hoofdzakelijk macrophyten eet, niet om een algemene omnivore populatie en niet om method-feederpellets, boilies of aangeboden visvoer. De auteur waarschuwt zelf dat een nachtelijke voedingspauze niet voor de soort als geheel geldt en afhankelijk kan zijn van populatie, leeftijdsgroep, beschikbaarheid/type voedsel en predatiedruk. Dat verklaart waarom dit resultaat niet mag worden samengevoegd tot één universeel tijdvakprofiel met Jamet et al. (1990) of andere prooigilden.

Er is slechts één thermische context rond 20 °C en geen temperatuurbehandeling; de bron ondersteunt geen temperatuurcurve. De drie meren zijn eutroof en Pools; lokale Nederlandse overdracht is onzeker. De 38 vissen voor het dagritme en de tien nachtelijk gevangen blankvoorns geven beperkte onderbouwing voor een precieze tijdvakgrens.

**Besluit:** opnemen als limited direct feeding_rhythm-context en modelmatige dagelijkse macrophytenrantsoenraming voor blankvoorn, approvedForPrediction=false. Alleen bewijs voor dieet-/populatieafhankelijke variatie; geen numerieke tijdvakbonus, geen pellet-/method-feedervertaling, geen thermische curve of persoonlijke vangstkans. De bron verhoogt de registry naar 93 records; numeriek goedgekeurd blijft 0. Geen runtime, score, gewicht of parameter gewijzigd.


## 148. PR #191 afgerond: Prejs (1978) bron en registry-validatie (20 november 2026)

PR #191 is squash-merged naar `main` als `eeaacfec1813bb1c223e098ef2762956b4323294`. De exacte PR-head `93efe34ba69b37c78ad23c0ef350d5d11008c180` doorliep typecheck, volledige tests en production build succesvol. De mergecommit Quality Gate is eveneens volledig geslaagd.

Prejs (1978) is als 93e registry-record toegevoegd voor blankvoorn, met direct maar dieet-/populatiegebonden veldbewijs voor macrophytenvoeding en een passage-rate-schatting van dagelijkse inname. De bron is limited en approvedForPrediction=false. De auteur waarschuwt expliciet dat de nachtelijke pauze niet als soortbrede regel geldt. Er is geen vertaling naar method-feederpellets, temperatuurcurve, tijdvakbonus of vangstkans.

De registry telt nu 93 records en 0 numeriek goedgekeurd. Geen runtime, score, gewicht, parameter of UX gewijzigd. Fase 2 blijft niet geaccepteerd; Fase 3 blijft geblokkeerd.


## 149. Fase 2 herprioritering: prognose-engine eerst, onderzoek met stopcriteria (20 november 2026)

**Besluit voor de verdere uitvoering:** de prognose-engine en de biologische dag-/tijdvakrespons zijn het primaire Fase-2-doel. De research registry is een hulpmiddel voor ontwerpbesluiten, geen doel op zichzelf. De huidige 93 records (0 numeriek goedgekeurd) rechtvaardigen geen verdere brede bronverzameling zonder concrete vraag die het kandidaatmodel kan veranderen.

### 149.1 Prioriteiten en status

| Prioriteit | Werkstroom | Nodig voor Fase 2? | Uitvoering / grens |
|---|---|---|---|
| P0 | Definitieve doelrespons en samenstelling van de bestaande 1–10-dagscore | Ja | Eén praktische verwachting van biologische activiteit én voedings-/foerageerpotentie. Thermische optie A blijft expliciete voorlopige prior. Geen habitat-, vangbaarheids- of betrouwbaarheidsbonus. |
| P0 | Factorrespons, normalisatie en interacties | Ja | Per factor vastleggen: respons, richting/vorm, schaal, benodigde input, onzekerheid, overlap/confounding en ontbrekende-data-gedrag. Geen gewichten of interacties kiezen zonder inhoudelijke en toetsbare grond. |
| P0 | Tijdvakmodel | Ja | Vier tijdvakken krijgen tijdspecifieke omgevingsinvoer en soort-/seizoensrespons waar bewijs dat ondersteunt. Dezelfde dagwaarde kopiëren of een universele schemerbonus toepassen geldt niet als tijdvakmodel. |
| P0 | Onafhankelijke evaluatie en data-readiness | Ja | Voor elke respons passende labels, metrics, chronologische splitsing, baseline, minimumdekking en beperkingen definiëren. Brier/BSS blijft uitsluitend voor persoonlijke vangstkans. |
| P1 | Gericht brononderzoek | Alleen waar het P0-besluit ervan afhangt | Controleer primaire methoden/overdraagbaarheid voor factoren of soorten die daadwerkelijk in de kandidaatlogica komen. Een onbekende respons blijft expliciet onbekend. |
| P2 | Extra soortkennis over beweging, habitat en gedrag | Nee, optimalisatie achteraf | Alleen toevoegen wanneer het een concrete habitat-/tijdvak-/coachbeslissing verbetert. Bestaande habitatMovement-, bankWind- en rodPositioning-engines hergebruiken. |
| Buiten scope van de engine-gate | Voorvoergrammen en optionele hengel-/methodepreset | Nee | Afzonderlijke tactiek-/productbesluiten; niet gebruiken om de biologische dagscore of fase-2-engineontwerp onnodig te blokkeren. Eventuele numerieke tactiekheuristieken blijven apart te beoordelen. |

### 149.2 Ontwerpvolgorde voor de engine

1. **Featurecontract:** inventariseer per tijdvak welke actuele/afgeleide waarden beschikbaar zijn, met bron, tijdstip, ruimtelijke relevantie, meet-/schattingsstatus en onzekerheid. Hergebruik de bestaande waterThermal-, habitatMovement-, bankWind- en rodPositioning-ketens; bouw geen parallelle engines.
2. **Responscontract:** scheid thermische/fysiologische potentie, voedings-/foerageerrespons en lokale habitat-/aanwezigheidsrespons. Definieer welke componenten werkelijk bijdragen aan de bestaande dagscore en welke uitsluitend context voor VisCoach blijven.
3. **Normalisatie en ontbrekende data:** leg per feature de biologisch betekenisvolle responsfunctie en schaal vast. Onbekend is niet nul, gemiddeld of neutraal. Rapporteer dekking/onzekerheid apart; laat ontbrekende factoren niet stilzwijgend de resterende factoren herwegen.
4. **Interacties en dubbeltelling:** toets alleen vooraf gemotiveerde interacties (bijvoorbeeld watertemperatuur × recente trend of wind × oeveroriëntatie × diepte). Controleer of meerdere features dezelfde onderliggende weers-/waterverandering dubbel representeren.
5. **Dag- en tijdvakuitvoer:** houd dezelfde doelrespons aan. De dagsamenvatting en vier tijdvakken verschillen door tijdspecifieke invoer/respons, niet door achteraf toegevoegde generieke bonussen. Een tijdvakadvies zonder geschikte responsdata wordt als onzeker/contextueel gepresenteerd.
6. **Evaluatiepoort:** vergelijk de kandidaat met de huidige transparante baseline en eenvoudige referenties via chronologische backtests en factorablaties. Gebruik alleen labels die de betreffende respons werkelijk meten; vangstdata zijn geen directe voedingslabels.

### 149.3 Stopcriteria voor aanvullend onderzoek

Een nieuwe bron wordt alleen gezocht of volledig uitgewerkt als vooraf duidelijk is welk open modelbesluit zij kan veranderen: responsclassificatie, parameter-/vormkeuze, overdraagbaarheidsgrens, featuretoelating, tijdvaklogica of evaluatielabel. Stop met zoeken zodra:

- de bron alleen een reeds bekende contextuele relatie herhaalt;
- de bron beweging, habitat, groei, metabolisme of aquacultuurvoer meet terwijl de open vraag directe voedselopname/foerageeractiviteit betreft;
- levensfase, voedseltype, meetmethode of watertype overdracht naar de beoogde toepassing niet rechtvaardigt;
- er geen betrouwbare invoer of onafhankelijk passend label bestaat om de bevinding veilig te gebruiken;
- de uitkomst geen ontwerp-, toelatings- of validatiebesluit verandert.

Geen minimumaantal bronnen per soort, geen doel om de registry verder te laten groeien en geen geforceerde numerieke curve. Onvoldoende bewijs wordt als kennislacune vastgelegd en kan later worden geoptimaliseerd.

### 149.4 Formele fasegrens

Fase 2 moet het engine-ontwerp, de feature-/responscontracten, onzekerheidsregels, tijdvaklogica en onafhankelijke evaluatiepoort toetsbaar afronden. Lokale praktijklabels zijn niet vereist om het ontwerp te documenteren, maar wél voordat lokale kalibratie of prestatieclaims worden gedaan en voordat nieuwe lokale empirische factoren numeriek worden toegelaten. Bestaande vangstregistraties mogen niet als directe activiteit-/voedingslabels worden hernoemd.

De tactische productbesluiten over voorvoergrammen en optionele hengel-/methodepresets worden apart gehouden en zijn geen reden om de biologische engine-ontwerpfase stil te zetten. Er wordt geen runtimefactor, gewicht, scoremapping of gebruikersinvoer aangepast door deze herprioritering. Fase 2 blijft open; Fase 3 blijft geblokkeerd totdat de engine-acceptatiecriteria aantoonbaar zijn afgevinkt.

## 150. Concreet enginecontract: responslagen, featureflow en tijdvaklogica (20 november 2026)

**Doel:** de kandidaatarchitectuur uit §134 vertalen naar een uitvoerbaar contract voor de prognose-engine. Dit is een ontwerpbesluit voor de verdere audit; geen runtimewijziging, geen numerieke toelating en geen wijziging van de gebruikersscore.

### 150.1 Doelrespons versus huidige implementatie

Het productdoel blijft één bestaande 1–10-dagscore voor de verwachte biologische activiteit- en voedings-/foerageerpotentie van de gekozen doelsoort. De huidige code realiseert dat samengestelde doel nog niet: zij berekent uitsluitend een voorlopige thermische prior. Dat verschil moet in code, uitleg en validatie expliciet blijven.

De engine mag componenten intern apart modelleren en evalueren. Een samengestelde numerieke score ontstaat pas wanneer de componenten aantoonbaar dezelfde vooraf gedefinieerde doelrespons ondersteunen en er een onafhankelijke referentie bestaat om de combinatie te toetsen. Een optelsom van thermische efficiëntie, voedingsintensiteit, licht, wind en habitat is niet toegestaan alleen omdat alle factoren biologisch plausibel klinken.

### 150.2 Voorgestelde verwerkingsketen

| Stap | Engine-laag | Invoer en verwerking | Uitvoer / grens |
|---|---|---|---|
| 1 | Canonieke context | Doelsoort, datum, lokaal tijdvak, seizoen, watertype en beschikbare levensfase-/voedselcontext. Ontbrekende context blijft onbekend. | Eén contextobject dat alle responsmodules delen; geen parallelle soortcatalogus. |
| 2 | Dataprovenance en validatie | Meet-/schattingsstatus, eenheid, meettijd, diepte/locatie, bron, geldigheid en onzekerheid. | Alleen valide, representatieve invoer gaat door; conflicten en veroudering blijven expliciet. |
| 3 | Thermische prior | Bestaande waterThermalEngine plus canonieke soortparameters uit fishProfiles; respons op water, niet luchttemperatuur. | Huidige enige numerieke scorebijdrage, expliciet voorlopig. Parameter- en invoeronzekerheid apart. |
| 4 | Directe voedings-/foerageerrespons | feedingEvidenceService en soort-/contextspecifieke responskaarten; alleen directe passende eindpunten mogen kandidaatresponsen leveren. | Momenteel uitsluitend context/kandidaatbewijs: 0 goedgekeurde numerieke voedingsrecords. Geen fictieve voedingsscore. |
| 5 | Tijd-/omgevingsmodulatie | Tijdvakgebonden temperatuurontwikkeling, directe voedingsritmegegevens en uitsluitend gevalideerde omgevingsresponsen. | Modulatoren veranderen een respons alleen als directe evidence, input en onafhankelijke validatie passen. Geen universele schemer-, wind-, druk- of seizoensbonus. |
| 6 | Habitat-/aanwezigheidscontext | Bestaande habitatMovementEngine, bankWindEngine en rodPositioningEngine. | Afzonderlijke ruimtelijke zoekhypothese voor VisCoach; geen dagscorebijdrage of aanwezigheidkans zonder eigen labels. |
| 7 | Scorecompositie en tijdvakken | Alleen toegelaten responsen met een gemeenschappelijk doel, gecontroleerde overlap en gevalideerde ontbrekend-data-patronen. | Eén bestaande 1–10-dagscore en vier tijdvakverwachtingen; geen nieuwe zichtbare subscores. Tot de voorwaarden zijn vervuld blijft de thermische baseline apart herkenbaar. |
| 8 | Uitleg en onzekerheid | Provenance, bewijsstatus, coverage, ontbrekende/geschatte input, modelversie en relevante beperkingen. | Korte uitleg aan gebruiker; onzekerheid is geen biologische bonus of aftrek. |
| 9 | Evaluatie | Eigen labels/metrics per respons, rolling-origin vergelijking, factorablaties en coverage-strata. | Toelating alleen bij aantoonbare aanvullende waarde op ongeziene data; geen automatische gewichtstuning. |

### 150.3 Responscontract per factorfamilie

| Factorfamilie | Primaire respons | Rol in kandidaat-engine | Huidige beslissing |
|---|---|---|---|
| Watertemperatuur en thermische historie | Voorlopige thermische/fysiologische potentie | Baseline/prior; input uit waterThermalEngine, soortcurve uit fishProfiles | Actief als optie-A-uitzondering; niet gevalideerd als dagelijkse voedselopname. |
| Directe voedselopname / voedingsintensiteit | Geconsumeerde hoeveelheid of snelheid | Potentiële directe biologische responscomponent | Niet numeriek toegelaten; broncontext verschilt per soort, levensfase, voedsel en watertype; geen lokale directe labels. |
| Foerageeractiviteit / prooivangst | Voedselzoeken of natuurlijke prooivangst | Alleen kandidaat als eindpunt en overdraagbaarheid passen bij de gekozen doelrespons | Contextueel; niet gelijkstellen aan dagelijkse intake of hengelaasrespons. |
| Voedingsritme / dag-nachtrespons | Wanneer voeding/foerageren plaatsvindt | Primair tijdvakmodule, eventueel dagbreed alleen als een dagbrede verandering direct is aangetoond | Contextueel; bron- en dieet-/levensfasegebonden; geen algemene schemerbonus. |
| Seizoen / levenscyclus / acclimatisatie | Modulator van thermische of voedingsrespons | Interactie/modulator, nooit zelfstandig een algemene bonus | Alleen context tot directe interactie-evidence en validatie bestaan. |
| Licht / fotoperiode / bewolking | Lichtconditie en zonne-relatieve timing | Tijdvakcontext; kandidaatmodulator als directe responsdata bestaan | Geen huidige numerieke bijdrage; fotoperiode, dageraad, schemering en bewolking niet dubbel tellen. |
| Wind / windrichting / luchtdruk / neerslag | Wateroppervlak, drift, lokale beweging of indirecte weercontext | Bestaande tactiek-/habitatcontext; alleen aparte directe voedingsrespons kan heroverweging rechtvaardigen | Geen biologische dagscorebijdrage; overlap met waterthermische schatting bewaken. |
| Zuurstof / troebelheid / stroming / lokaal prooiaanbod | Fysiologische beperking, zicht, lokale toegang of voedselbeschikbaarheid | Potentieel relevante lokale responsen, maar alleen bij betrouwbare actuele invoer | Momenteel onbekend of niet beschikbaar; geen proxy uit weer of temperatuur. |
| Diepte / bodem / vegetatie / structuur / stek | Habitatgeschiktheid en lokale aanwezigheid | Afzonderlijke ruimtelijke laag voor VisCoach | Geen dagscorebijdrage; bestaande engines hergebruiken. |
| Hengeluren / aas / methode / vangsten | Praktische vangbaarheid en persoonlijke sessie-uitkomst | Afzonderlijke tactiek-/vangbaarheidslaag | Geen biologisch activiteit-/voedingslabel; Brier blijft persoonlijke vangstkans. |
| Datadekking / onzekerheid | Betrouwbaarheid van de voorspelling | Metadata en uitleg | Nooit als biologische scorebonus of -straf. |

### 150.4 Tijdvakcontract: vier bestaande vensters, geen kunstmatige winnaar

De code gebruikt vier vaste lokale vensters: nacht 00:00–06:00, ochtend 06:00–12:00, middag 12:00–18:00 en avond 18:00–24:00. analyzeTimeSlot() leest per venster weerssamples en maakt context voor luchtdruk, wind, neerslag, bewolking en zonneovergangen. De actuele biologische thermische berekening ontvangt echter dezelfde thermalAnalysis voor de dag; de vier tijdvakken hergebruiken daardoor dezelfde thermische respons. De huidige tijdvakweergave is dus geen afzonderlijk gevalideerde biologische rangschikking.

Voor een echte tijdvakrespons zijn de volgende eisen nodig:

1. **Tijdspecifieke invoer:** elk venster gebruikt alleen data die voor dat venster beschikbaar en tijdig voorspeld waren. Watertemperatuur per venster mag alleen worden geschat als de waterthermische keten dit met een onderbouwde tijdsontwikkeling en onzekerheid kan leveren; luchttemperatuur is geen vervanging.
2. **Tijdspecifieke biologie:** directe voedings-/foerageerrespons moet waar mogelijk het relevante venster, seizoen, levensfase, voedselgilde en watertype dekken. Dagritme van beweging is geen voedingsritme.
3. **Geen dubbele telling:** dagbrede thermische of seizoensinvloed mag niet vier keer als onafhankelijke factor worden opgeteld. Lichtvariabelen die dezelfde zonneovergang beschrijven worden één context-/responsfamilie.
4. **Geen geforceerde rangorde:** als geen toegelaten respons een verschil tussen vensters onderbouwt, mogen de vensters biologisch niet als verschillend worden gerangschikt. De coach kan praktische context tonen zonder een beste tijd te claimen.
5. **Dagscoreaggregatie:** de bestaande dagscore blijft één getal. Een toekomstige aggregatie van tijdvakresponsen moet rekening houden met de vaste vensterduur, geldige voorspelde blootstelling en vooraf vastgelegde dagrespons. Geen gemiddelde of gewogen som kiezen voordat het gemeenschappelijke label en de evaluatie aantonen dat dit de juiste samenvatting is.
6. **Evaluatie:** tijdvakvoeding en tijdvakvangbaarheid worden apart getoetst. Directe tijdgebonden voedselopname/foerageerlabels toetsen biologische voorkeur; vangsten/aanbeten per expliciet hengeluur toetsen alleen praktijkvangbaarheid.

### 150.5 Kritieke modelkeuze: geen aggregatie vóór gemeenschappelijke referentie

Thermische efficiëntie, directe voedselopname en tijdvakvoorkeur zijn verschillende responsen. Het is biologisch plausibel dat thermische toestand de capaciteit voor activiteit/vertering beïnvloedt en dat voedselbeschikbaarheid of dagritme bepaalt wanneer en hoeveel wordt gegeten. Maar die plausibiliteit levert geen numerieke aggregatieformule op.

Daarom blijft de interne representatie voorlopig componentgericht. Voor een samengestelde 1–10-score moeten we eerst vastleggen welk onafhankelijk meetbaar eindpunt de combinatie vertegenwoordigt, welke vaste referentiecondities de scoreankers bepalen en hoe een samengestelde voorspelling tegen dat eindpunt wordt geëvalueerd. Als zulke labels ontbreken, blijft de thermische prior de bestaande baseline en blijven overige componenten contextueel; we doen niet alsof een ongetoetste optelsom de productdoelrespons al meet.

### 150.6 Eerstvolgende enginewerkzaamheden

1. Verifieer de volledige invoer-/provenanceketen per factor en per tijdvak, inclusief of een voorspelde watertemperatuur werkelijk tijdvakgebonden is of een dagbrede waarde.
2. Maak een responskaart per doelsoort waarin uitsluitend relevante directe voedings-/foerageerbronnen en tijdvakbronnen aan het juiste eindpunt worden gekoppeld; behoud bron-/levensfase-/voedselcontext.
3. Controleer welke onafhankelijke externe datasets de labels uit §131 daadwerkelijk kunnen leveren en welke niet overdraagbaar zijn naar de gewenste wilde Nederlandse visserijcontext.
4. Leg vaste referentieankers en de kandidaat-scorecompositie alleen vast als de gemeenschappelijke referentie meetbaar is; anders documenteer de onopgeloste validatiepoort zonder fictieve formule.
5. Bevries de baseline en ontwerp een reproduceerbare rolling-origin/ablatietest; rapporteer per soort, seizoen, datadekking en respons, inclusief negatieve of niet-evalueerbare uitkomsten.

**Status:** enginecontract inhoudelijk uitgewerkt als ontwerp; nog niet formeel geaccepteerd en niet geïmplementeerd. Geen runtimecode, profielparameter, gewicht, scoremapping, tijdvakbonus, UI of gebruikersinvoer gewijzigd. Fase 2 blijft open; Fase 3 blijft geblokkeerd.


## 151. Gerichte audit van open biologische datasets: bruikbare responsen en grenzen (20 november 2026)

Deze controle richtte zich op de vraag of openbaar beschikbare datasets de onafhankelijke labels kunnen leveren die de engine nodig heeft (§131 en §150). Er is niet gezocht naar meer algemene soortinformatie, maar naar datasets met ruwe meetmomenten en een werkelijk gemeten biologische respons.

### 151.1 Norin et al. (2024) — fysiologie, beweging en dagelijkse voedselopname

De primaire publicatie en methodesectie zijn gecontroleerd. De studie onderzocht juveniele marine Cunner in gecontroleerde aquaria bij 2, 5, 8, 11 en 14 °C. Metabolisme, aerobe scope, bewegingsactiviteit en groei zijn afzonderlijk gemeten. In een snelle afkoelproef werd daarnaast dagelijkse pelletopname bepaald: een vast aantal pellets werd rond 08:30 aangeboden en de resterende opname werd aan het einde van de dag geteld.

De relevante uitkomst voor het engineontwerp is dat thermische plasticiteit van metabolisme niet samenviel met thermische plasticiteit van bewegingsactiviteit. De studie onderstreept dus dat fysiologische capaciteit en feitelijke beweging niet zonder bewijs als dezelfde respons mogen worden behandeld. De voedselopname is een direct dagtotaal, maar geen tijdvakverdeling.

**Toelatingsbesluit:** contextueel bewijs voor het gescheiden modelleren van fysiologie, beweging en voedselopname. Niet overdraagbaar als soortcurve of veldparameter naar de Nederlandse zoetwatersoorten; geen numerieke scorebijdrage of tijdvakbonus. Toegevoegd als 94e registry-record, soortgebonden aan Cunner en approvedForPrediction=false.

### 151.2 Monk & Arlinghaus (2018) — wilde karper/zeelt, telemetrie en aaslocaties

De Dryad-dataset bevat hoogfrequente telemetrieposities van wilde karper en zeelt, diepte-/temperatuursensorinformatie, locaties van acht gevoerde aasplekken, tijden en hoeveelheden aangeboden voer, vangstgegevens en expliciete hengelinzet. De voederregistratie beschrijft wat op de stek werd aangeboden; zij meet niet hoeveel natuurlijk of aangeboden voedsel de vis daadwerkelijk consumeerde. De telemetrie meet positie, beweging en aanwezigheid bij aaslocaties, niet de voedselopname zelf.

De publicatie rapporteert dat het tegenkomen van aas noodzakelijk maar onvoldoende is om individuele vangbaarheid te verklaren. Dit is nuttig voor de scheiding tussen lokale ontmoeting, aasbezoek en uiteindelijke hengelvangbaarheid.

**Toelatingsbesluit:** potentieel bruikbaar voor afzonderlijke habitat-/bewegings-/aasontmoetings- en vangbaarheidsanalyse; geen direct voedingslabel voor de biologische dagscore en geen maat voor dagelijkse natuurlijke voedselopname. Geen runtimefactor.

### 151.3 Rieble et al. (2026) — dagelijkse bewegingsactiviteit van karper en baars

De Dryad-dataset bevat whole-lake akoestische telemetrie, ruwe posities en afgeleide dagelijkse bewegingsactiviteit voor karper en baars in Kleiner Döllnsee (Duitsland), plus vangst-/tagginggegevens en een BACIPS-analyse van catch-and-release-effecten. De dataset bevat geen directe dagelijkse voedselopname of tijdvakgebonden voedingslabels. De gepubliceerde dagelijkse bewegingsreeks is bovendien gekoppeld aan een studie naar vangst-/terugzetbelasting en herstel; die experimentele context moet behouden blijven.

De dataset bevat bij vangstmetingen ook temperatuur, troebelheid en opgeloste zuurstof, maar deze losse meetmomenten bij vangst zijn geen continue onafhankelijke responsreeks voor de hele dag.

**Toelatingsbesluit:** waardevol kandidaatmateriaal voor een latere afzonderlijke bewegings-/habitatlaag en voor inzicht in detectie-/inspanningseisen. Niet gebruiken als voedselopname- of tijdvakvoedingslabel en niet direct overzetten naar een algemene dagelijkse activiteitsscore.

### 151.4 Geconsolideerde conclusie en stopbesluit

De gerichte datasetcontrole levert nuttige bevestiging van de responsgrenzen, maar geen dataset die nu de ontbrekende onafhankelijke Nederlandse veldlabels voor de samengestelde biologische dagscore of tijdvakvoeding oplost:

- Norin et al. meet directe dagelijkse pelletopname, maar bij juveniele marine Cunner in aquaria en zonder tijdvakverdeling.
- Monk & Arlinghaus meet wilde karper-/zeeltbeweging, aaslocatiebezoek en hengelvangbaarheid, maar niet de werkelijk geconsumeerde voedselhoeveelheid.
- Rieble et al. meet dagelijkse beweging van karper/baars, niet voedselopname; de dataset is gericht op effecten en herstel na catch-and-release.

Daarom is het niet verantwoord deze datasets als numerieke voedingsfactoren of tijdvaklabels toe te laten. Ze versterken wel de gekozen architectuur: thermische fysiologie, beweging/aanwezigheid, voedselopname en vangbaarheid moeten aparte responsen blijven. De data kunnen later gericht worden hergebruikt voor hun eigen responslaag, zonder de engine nu te verbreden.

**Stopbesluit:** geen verdere brede datasetzoektocht naar algemene visactiviteit. Hervat gericht onderzoek alleen als een concrete soort-/responsvraag een mogelijk direct label, tijdvakrespons of parameter oplevert. De ontbrekende lokale biologische labels blijven een formele validatiebeperking; geen geforceerde vervanging door vangstdata. Fase 2 blijft open; Fase 3 geblokkeerd.


## 152. Code-audit tijdresolutie waterthermische invoer (20 november 2026)

Deze read-only controle werkt de eerste taak uit §150.6 uit: kan de huidige thermische keten een afzonderlijke watertemperatuurrespons per tijdvak leveren?

### 152.1 Feitelijke implementatie

De huidige code laat het volgende zien:

- analyzeWaterThermalDevelopment() retourneert één WaterThermalAnalysis met één estimatedWaterTemp en één estimatedRange voor de opgegeven doeldatum.
- Voor een toekomstige doeldatum wordt de referentietijd in de huidige implementatie op 12:00 van die doeldatum gezet. Voor de huidige lokale dag wordt vanaf het actuele tijdstip gerekend.
- De optionele targetHour staat wel in ThermalAnalysisOptions, maar wordt in de functie niet gelezen. Er bestaat dus geen werkende uurparameter die een afzonderlijke watertemperatuurschatting per tijdvak oplevert.
- De functie gebruikt uurlijkse weersontwikkeling, maar reduceert die tot één doeldagwaarde/temperatuurband; de aanwezigheid van uurlijkse weersdata betekent niet dat de watertemperatuur zelf per uur beschikbaar is.
- prognosisEngine roept de thermische analyse één keer per dagprognose aan en geeft hetzelfde thermalAnalysis-object door aan de vier analyzeTimeSlot()-aanroepen.
- De vier vensters verzamelen wel afzonderlijke uurlijkse lucht-/weersamples en zonnecontext. Deze samples leveren momenteel uitleg/context voor wind, druk, bewolking en neerslag; zij wijzigen de thermische score niet.

### 152.2 Gevolg voor de prognose

De huidige vier tijdvakuitkomsten hebben geen vier onafhankelijke thermische invoerwaarden. De thermische scorecomponent is daardoor voor alle vensters dezelfde dagbrede respons. De tijdvakverschillen die in de uitleg of praktische context verschijnen mogen niet worden geïnterpreteerd als een gevalideerde biologische rangorde.

Een toekomstig tijdvakmodel mag niet simpelweg de uurlijkse luchttemperatuur door de soortcurve halen. Water reageert vertraagd en afhankelijk van diepte, menging, instraling en lokale watermassa. Een tijdspecifieke watertemperatuurschatting vraagt daarom een expliciet tijdstip, een passende waterthermische toestandsupdate en een eigen onzekerheids-/provenance-uitvoer.

### 152.3 Ontwerpvereisten voor eventuele uitbreiding

1. Definieer de tijdsemantiek expliciet: lokale tijdzone, tijdvakstart/einde, referentietijd en het moment waarop de voorspelling wordt gemaakt.
2. Gebruik alleen weerdata die op het prognosemoment beschikbaar waren; voorkom toekomstlek in historische backtests.
3. Laat de waterthermische engine per gevraagd tijdstip een schatting plus onzekerheidsband en bronstatus teruggeven, alleen als de warmtebalans-/ankerdata dat ondersteunen.
4. Behoud één canonieke waterthermische engine; geen tweede tijdvaktemperatuurmodel naast de bestaande implementatie.
5. Evalueer tijdspecifieke watermetingen apart met MAE/RMSE/bias en passende intervaldekking, per diepte/locatie/watertype en voorspelhorizon.
6. Een tijdspecifieke thermische waarde maakt op zichzelf nog geen tijdvakvoedingsvoorkeur. Daarvoor blijven directe soort-/contextpassende voedingslabels noodzakelijk.
7. Geen vier tijdvaktemperaturen interpoleren of verzinnen wanneer de beschikbare waterdata alleen een dagwaarde ondersteunen; gebruik dan dezelfde thermische context met expliciete beperking.

### 152.4 Besluit en volgende stap

**Vastgesteld:** de huidige code levert één thermische schatting per doeldag; targetHour is ongebruikt en dezelfde analyse wordt gedeeld door de vier tijdvakken. Dit is een concrete technische ontwerpgap voor de latere tijdvak-engine, niet een reden om nu runtimecode aan te passen.

**Volgende stap:** specificeer een minimale, reproduceerbare tijdstipgerichte API voor de bestaande waterThermalEngine en toets eerst of de huidige weer-/waterankers genoeg informatie bieden om een tijdvakschatting te maken. Pas daarna kan worden besloten of code-uitbreiding zinvol is. Directe tijdvakvoedingslabels blijven een afzonderlijke biologische voorwaarde.

Geen runtimewijziging, geen nieuw modelgewicht, geen tijdvakbonus en geen gebruikersinvoer toegevoegd. Fase 2 blijft open; Fase 3 geblokkeerd.


## 153. Thermische toestandsontwikkeling: bestaande functionaliteit en gerichte verbetergrenzen (20 november 2026)

Deze aanvullende read-only code-audit verfijnt §152 na inspectie van de volledige berekening in `src/services/waterThermalEngine.ts`. Het ontwerpbesluit is om de bestaande engine te verbeteren en geen parallelle temperatuurengine te bouwen.

### 153.1 Wat al aanwezig is

De bestaande engine bevat al een eenvoudige thermische toestandsupdate wanneer een bruikbaar echt meetanker en voldoende uurlijkse weersdekking beschikbaar zijn:

- Een echte lokale watertemperatuurmeting kan als starttoestand dienen; de engine werkt die met de beschikbare weersreeks stap voor stap bij.
- De update gebruikt uurlijkse luchttemperatuur, voorafgaande 24-/72-uursgemiddelden, kortgolvige zonnestraling (of bewolking als terugval), wind en een tijdconstante.
- Bij bekende waterdiepte worden momenteel vaste tijdconstanten van 54, 96 of 150 uur gebruikt voor respectievelijk ondiep, middeldiep en dieper water; watertype kan deze waarden verder aanpassen.
- Wind beïnvloedt de bestaande tijdconstante via een eenvoudige mengingsfactor. Zonnestraling beïnvloedt de evenwichtstemperatuur via een beperkte correctie.
- De engine houdt meetankerleeftijd, weersdekking, bronstatus en een onzekerheidsband bij.
- Zonder bruikbaar meetanker kan de bestaande code onder voorwaarden een dagbrede indicatieve schatting maken uit weershistorie, dieptecategorie en/of een historisch waterprofiel. Dat is niet hetzelfde als een lokaal gemeten actuele watertemperatuur.

### 153.2 Wat nog grof of onvoldoende tijdspecifiek is

- De uurlijkse update is nu een interne tussenstap om één doeldagwaarde te produceren. Er wordt geen expliciete temperatuurtoestand voor elk gevraagd tijdstip aan de aanroeper teruggegeven.
- De diepte wordt als één locatiekenmerk gebruikt. De engine modelleert geen afzonderlijke temperatuurprofielen voor oppervlak, middenwater en bodem.
- De huidige tijdconstanten en correcties zijn vaste heuristische waarden; ze zijn niet per waterlichaam of dieptelaag gekalibreerd.
- De zoncorrectie is een vereenvoudigde benadering. Beschikbare straling is niet automatisch de hoeveelheid warmte die de relevante waterlaag opneemt; waterhelderheid, beschaduwing, seizoen, invalshoek en menging kunnen de overdracht beïnvloeden.
- De windfactor is een globale proxy voor menging. Werkelijke menging hangt ook af van fetch, oeveroriëntatie, wateroppervlak, vorm en stratificatie.
- Historische meetrecords kunnen `measurementDepthM` bevatten, maar de huidige thermische update gebruikt dit nog niet als volwaardige dieptelaag-/toestandsdimensie.
- Een onbekende diepte blijft in delen van de bestaande code terecht onbekend; er mag geen standaarddiepte worden verzonnen om een uurcurve te forceren.

### 153.3 Vastgelegd ontwerpbesluit

De thermische berekening wordt voortgezet binnen de bestaande canonieke `waterThermalEngine`. De gewenste richting is een reproduceerbare toestandsfunctie: begin met een tijdgestempelde watermeting of een expliciet als onzeker gemarkeerde historische referentie, verwerk alleen weergegevens die op het prognosemoment beschikbaar zijn en bereken de toestand op een expliciet gevraagd lokaal tijdstip.

De engine moet waar mogelijk onderscheid kunnen maken tussen:
1. gemeten temperatuur, met meettijd, methode en meetdiepte;
2. geschatte bulk-/gemiddelde watertemperatuur;
3. geschatte temperatuur van een specifieke laag, alleen als dieptegegevens en modelbasis dit ondersteunen.

Een oppervlaktetemperatuurmeting mag niet stilzwijgend als bulk- of bodemtemperatuur worden behandeld. Als de meetdiepte onbekend is, blijft dat gegeven expliciet onbekend en hoort de onzekerheid groter te zijn.

De toestandsupdate mag geen luchttemperatuur als watertemperatuur presenteren. Lucht, straling en wind zijn forcings voor de verandering van de watertoestand, niet de toestand zelf. De respons moet geleidelijk en fysisch begrensd blijven; een korte warme middag mag niet zonder onderbouwing een grote sprong in de volledige watermassa veroorzaken.

### 153.4 Volgende technische onderzoekstappen

1. Volg exact hoe `FishingLocation.waterDepth`, meetdiepte, meettijd en waterType vanuit invoer/sessie/snapshot bij de engine aankomen.
2. Controleer de volledigheid en tijdzone van `WeatherHourlyForecast`, in het bijzonder straling, wind, bewolking en forecast-fetchedAt/as-of.
3. Scheid in de bestaande engine de toestand (watertemperatuur) van de forcings (lucht, straling, wind) en leg vast welke huidige parameters heuristisch zijn.
4. Definieer een minimale tijdstipgerichte uitvoer die dezelfde canonieke toestand bijwerkt en provenance, onzekerheid en gebruikte meetdiepte behoudt.
5. Maak tests voor meetanker + tijdsverloop, ondiep versus diep water, zonnig versus bewolkt, wind/menging, ontbrekende uren, onbekende diepte, meetdiepte onbekend en voorspelling zonder toekomstlek.
6. Vergelijk de bestaande daguitvoer met de voorgestelde tijdstipuitvoer voordat runtimegedrag wordt gewijzigd. Evalueer uitsluitend tegen echte tijdgestempelde watertemperatuurmetingen, apart van de biologische visrespons.

Geen runtimecode, tijdconstanten, score, gewichten, UI of gebruikersinvoer gewijzigd. De huidige dagwaarde blijft de enige thermische uitvoer totdat een tijdspecifieke uitbreiding afzonderlijk is ontworpen en getoetst. Fase 2 blijft open; Fase 3 geblokkeerd.


## 154. Dataflow-audit meetdiepte, waterdiepte en weers-as-of (20 november 2026)

Deze audit volgt de daadwerkelijke invoerroute van de bestaande `waterThermalEngine`, vanaf invoerschermen en weersprovider tot historische profielen en prognosesnapshot. Het doel is vast te stellen welke gegevens de bestaande toestandsupdate werkelijk kan gebruiken; er is geen runtimecode gewijzigd.

### 154.1 Waterdiepte versus meetdiepte zijn twee verschillende gegevens

- `FishingLocation.waterDepth` is een optionele locatie-eigenschap, ingevoerd als één waterdiepte in meters. Dit is de enige diepte die `prognosisEngine` op dit moment aan `waterThermalEngine` doorgeeft.
- `FishingSession.waterDepth` bestaat daarnaast als sessiegegeven. De prognose-engine gebruikt dit niet als actuele locatie-diepteparameter; de huidige berekening gebruikt `location.waterDepth`.
- De thermische engine reduceert de locatie-waterdiepte tot drie grove categorieën voor de vaste tijdconstante: maximaal 1,4 m; tussen 1,4 en 3,5 m; dieper dan 3,5 m. Dit is een heuristische diepteproxy, geen gemeten thermische menglaag of temperatuurprofiel.
- De sessieregistratie kan afzonderlijk `waterTemperatureMeasurementDepthM` vastleggen. Dit meetdiepteveld wordt via historische observaties bewaard, maar wordt niet door de thermische toestandupdate gebruikt.

**Gevolg:** waterdiepte beschrijft de watermassa/locatie; meetdiepte beschrijft waar de thermometer de temperatuur heeft gemeten. Die waarden mogen niet als onderling verwisselbaar worden behandeld.

### 154.2 Meetdiepte gaat nu verloren in de profielselectie

`collectHistoricalWaterTemperatureObservations()` bewaart meetdiepte voor sessies en snapshots. Daarna gebruikt `deriveHistoricalWaterTemperatureProfile()` de meetdiepte echter niet bij selectie of aggregatie:

- Alle geldige metingen van dezelfde stek en vergelijkbare kalendermaand kunnen in één profiel terechtkomen, ongeacht of ze aan oppervlak, halverwege of nabij de bodem zijn gemeten.
- De terugval naar nabijgelegen wateren vergelijkt de totale waterdiepte van de locatie, niet de meetdiepte van de temperatuurwaarneming.
- De uiteindelijke mediaan en percentielband kunnen dus verschillende meetlagen combineren.

Dit is een relevante datakwaliteitsbeperking: een oppervlaktetemperatuur en een bodem-/dieptemeting kunnen op een zonnige, gestratificeerde dag verschillende fysieke toestanden beschrijven. Een historisch profiel dat zulke waarden samenvoegt, kan de actuele laagtemperatuur verkeerd voorstellen.

**Besluit:** historische meetdiepte moet in een volgende profielversie een expliciete selectiedimensie zijn. Metingen met onbekende diepte blijven bruikbaar als afzonderlijke categorie met passende onzekerheid, maar mogen niet stilzwijgend bij een bekende dieptelaag worden gevoegd. Geen automatische diepteklasse of interpolatie verzinnen.

### 154.3 Betekenis van de handmatige watertemperatuur in de prognose

De Prognosepagina noemt de optionele invoer expliciet "Gemeten aan stek". De invoer wordt als een handmatige temperatuurwaarde aan `calculateDayPrognosis()` doorgegeven. De helper `createManualWaterTemperatureInput()` bewaart het invoermoment, maar zet het fysieke meettijdstip, de meetmethode en meetdiepte op onbekend/null. In de huidige thermische engine krijgt de waarde het tijdstip van de prognoserun via `currentDateRef` en wordt ze als actuele meetreferentie gebruikt.

Dit is functioneel begrijpelijk voor een gebruiker die zojuist ter plaatse heeft gemeten, maar het onderscheid moet expliciet blijven:
- invoermoment is niet noodzakelijk hetzelfde als fysiek meetmoment;
- de handmatige prognose-invoer bevat geen meetdiepte;
- de waarde is een gebruiker-gerapporteerd actueel anker, geen automatisch geverifieerde of volledig gekarakteriseerde meting.

**Ontwerpbesluit:** behoud de snelle invoer, maar houd deze bronstatus en ontbrekende meetmetadata expliciet. Gebruik haar niet als volledig gevalideerde laagmeting of onafhankelijke kalibratie-observatie. De uitgebreidere sessiemeting met meettijd, methode, herkomst en optionele meetdiepte blijft de route voor rijkere meetmetadata.

### 154.4 Weersdekking en tijdsherkomst

De bestaande provider vraagt Open-Meteo-uurlijkse luchtdata voor `Europe/Amsterdam`, waaronder temperatuur, kortgolvige straling, bewolking en wind. Straling is optioneel en wordt alleen opgenomen wanneer het providerresultaat een plausibele waarde bevat; bewolking is de bestaande terugval. De cache bewaart `fetchedAt`; de prognose ontvangt dit als `weatherUpdatedAt`, bewaart de uurlijkse invoer in `weatherInput` en de berekeningstijd in `forecastTimestamp`/inputcontext.

Er zijn twee aandachtspunten voor een reproduceerbare tijdstipgerichte update:
1. De uurlijkse `time`-strings worden door Open-Meteo met de lokale Amsterdam-tijdzone aangeleverd, maar bevatten niet noodzakelijk een expliciete UTC-offset. De thermische engine gebruikt `Date.parse()`/`new Date()` op die strings. De interpretatie kan daardoor afhangen van de tijdzone van de runtime; de app moet dit expliciet toetsen en zo nodig één gedeelde Europe/Amsterdam-conversie gebruiken.
2. De cache- en prognoseketen bewaart de ophaaltijd en berekeningstijd op verschillende plekken. De toekomstige API moet deze begrippen afzonderlijk en expliciet houden: `forecastAsOf` (wanneer de weerdata is opgehaald), `calculatedAt` (wanneer de prognose is gemaakt), en de geldige lokale tijd van elk weeruur.

De provider levert weersforceringen, geen watertemperatuur. Uurlijkse straling/wind/luchttemperatuur zijn invoer voor de waterthermische toestandsontwikkeling, nooit directe vervangers voor een watermeting.

### 154.5 Concrete gevolgen voor de volgende API-/datatoets

1. Definieer de toestand als minimaal: temperatuurwaarde, fysiek meettijdstip, invoer-/registratietijd, meetdiepte (of onbekend), meetmethode/herkomst, locatie/watertype en onzekerheid.
2. Definieer de watermassa-invoer afzonderlijk: locatie-waterdiepte (met semantiek/bron), eventueel sessie-/stekdiepte en onbekend wanneer niet betrouwbaar bekend.
3. Maak dieptelaagselectie van historische waarnemingen expliciet; meng geen bekende verschillende meetdieptes in één referentieprofiel.
4. Leg tijdzoneconversie vast voor alle weeruur- en meettijdstempels; test zomertijdwissels en runtime met een andere systeemtijdzone.
5. Houd `forecastAsOf`, `calculatedAt` en `targetTime` gescheiden en voorkom dat latere weerupdates in historische voorspellingen lekken.
6. Behoud de bestaande canonieke `waterThermalEngine`; geen parallelle engine en geen nieuwe verplichte gebruikersinvoer.
7. Pas runtime-/profielgedrag pas aan nadat de gewenste semantiek en regressietests zijn vastgesteld.

Geen runtime-, database-, score-, gewicht-, UI- of gebruikersinvoerwijziging. Fase 2 blijft open; Fase 3 geblokkeerd.


## 155. Minimale tijdstipgerichte contractschets en testmatrix (20 november 2026)

Op basis van de code- en testaudit (§152–154) is de volgende minimale uitbreiding van de bestaande `waterThermalEngine` de meest beheerste route. Dit is een ontwerpcontract, geen implementatiebesluit voor runtimecode.

### 155.1 Eén bestaande engine, één expliciet doelmoment

De huidige functie blijft de canonieke thermische engine. De ongebruikte `targetHour` wordt niet als losse uurparameter uitgebreid; het doel is een ondubbelzinnig tijdstip, niet alleen een uurgetal.

Voorgestelde invoersemantiek:
- `targetTime`: het exacte doelmoment als tijdzonebewust moment, afgeleid van lokale datum/tijd in `Europe/Amsterdam`. Geen naïeve datumstring die door de browser-/serverzone kan worden geïnterpreteerd.
- `forecastAsOf`: het moment waarop de gebruikte weersverwachting is opgehaald/beschikbaar was.
- `calculatedAt`: het moment waarop deze prognoseberekening is uitgevoerd.
- `anchor`: bestaande fysieke meetwaarde plus werkelijk meettijdstip, bron/methode en meetdiepte indien bekend. Een ontbrekende meetdiepte blijft expliciet onbekend.
- `location`: bestaande locatiegegevens, waaronder waterdiepte en watertype; deze zijn geen vervanging voor meetdiepte.
- `forecasts`: de reeds beschikbare uurlijkse reeks, met geldige lokale uurmomenten en weersforceringen. De bron-/as-of-herkomst blijft behouden.

De bestaande invoer voor een snelle handmatige "Gemeten aan stek"-waarde blijft ondersteund als aparte gebruikersgerapporteerde actuele invoer. Zij wordt intern niet stilzwijgend gelijkgesteld aan een volledig gekarakteriseerde fysieke meting.

Voorgestelde uitvoer behoudt de bestaande analysevorm en voegt expliciete tijd/provenance toe:
- temperatuurtoestand op `targetTime`;
- onzekerheidsband en datakwaliteit;
- status (gemeten, vanaf meting geëxtrapoleerd, historisch profiel, of onbekend);
- meetanker en leeftijd;
- gebruikte meetdiepte of expliciet onbekend;
- weerdekking en `forecastAsOf`.

### 155.2 Berekeningsstrategie

Voor meerdere tijdvakken moet de engine niet viermaal onafhankelijk een afgeronde dagwaarde aanpassen. De voorkeur is één chronologische toestandsdoorloop vanaf het gekozen meetanker: verwerk de uurlijkse forcings in tijdsvolgorde en leg de toestand vast op elk gevraagd doelmoment. Zo blijft de middagtoestand voortkomen uit de ochtendtoestand en dezelfde voorafgaande warmtegeschiedenis.

Een tijdstip na het laatst beschikbare weeruur krijgt geen verzonnen extrapolatie. Een ontbrekend uur wordt niet automatisch als gemiddeld weer ingevuld. Bij onvoldoende dekking, onbekende diepte of een te oud/onduidelijk meetanker blijft de uitkomst onzeker of onbekend volgens expliciete regels.

De thermische toestand representeert voorlopig één duidelijk omschreven referentietemperatuur, niet een volledig verticaal temperatuurprofiel. Alleen wanneer onafhankelijke metingen op verschillende meetdieptes voldoende dekking geven, kan later een gelaagde toestand worden overwogen. Zonder zulke gegevens mag de engine geen bodem- of oppervlaktetemperatuur afleiden uit een bulkwaarde.

### 155.3 Regressie- en validatietestmatrix

| Testgroep | Verplichte scenario's | Verwachte eigenschap |
|---|---|---|
| Tijdcontinuïteit | Ochtend, middag, avond uit dezelfde meetankerreeks | Middag bouwt voort op ochtend; geen sprong door alleen hogere luchttemperatuur |
| Thermische traagheid | Ondiep versus diep; korte versus langdurige warmte | Diepte beïnvloedt reactiesnelheid binnen aantoonbare grenzen |
| Zon en menging | Straling hoog/laag, bewolking als terugval, wind sterk/zwak | Forcings veranderen de ontwikkeling geleidelijk; ontbreken blijft onbekend |
| Meetdiepte | Oppervlak, middenlaag, dieper, onbekend | Onvergelijkbare lagen worden niet in één profiel samengevoegd |
| Meetanker | Vers, oud, ontbrekend, toekomstige/ongeldige timestamp | Geen toekomstlek; oude meting wordt geen actuele meting |
| Weerdekking | Complete reeks, ontbrekende uren, verouderde cache | Onzekerheid/status reageert op dekking; geen stilzwijgende invulling |
| Tijdzone | Europe/Amsterdam, winter/zomertijd, beide DST-overgangen, runtime in andere zone | Identieke instanties en uurvolgorde ongeacht machinezone |
| Forecast-as-of | Zelfde target met twee verschillende forecastAsOf-momenten | Alleen de weersreeks die op het gekozen voorspelmoment beschikbaar was telt |
| Reproduceerbaarheid | Herberekening uit opgeslagen snapshot-input | Zelfde invoer en engineversie geeft dezelfde thermische uitvoer |

### 155.4 Wat bestaande tests al en nog niet aantonen

De huidige tests controleren al thermische demping, ondiep/middeldiep/diep als grove categorie, zon/bewolking, windproxy, meetankerherkomst, onbekende waterdiepte en opslag van meetdiepte. De synthetische validatietest controleert het gedrag tegen een synthetische referentie, niet tegen een onafhankelijke reeks echte uurlijkse watertemperatuurmetingen.

Nog niet afgedekt zijn: profielselectie op meetdiepte, tijdspecifieke temperatuuruitvoer op meerdere doelmomenten, DST/runtime-tijdzone onafhankelijkheid, expliciete forecast-as-of selectie en continuïteit van één toestand door meerdere tijdvakken.

### 155.5 Besluit en volgende stap

Deze contractschets is de basis voor de resterende data-/acceptatietoets. Eerst moeten de tijdzonehelper en dieptelaagsemantiek worden gekozen en de testdata/fixtures worden vastgesteld. Pas daarna kan een kleine implementatie in de bestaande `waterThermalEngine` worden voorbereid, met regressietests en onafhankelijke meetvalidatie als aparte gates.

Geen runtime-, database-, score-, gewicht-, UI- of gebruikersinvoerwijziging. Fase 2 blijft open; Fase 3 geblokkeerd.



## 156. Meetmomenten als lokale kalibratiebasis en expliciete thermische traagheid (20 november 2026)

Dit onderdeel legt de gebruikerswens vast om watertemperatuur praktisch tijdens vissessies te meten, zonder een dagelijkse meetroutine of vaste meetmomenten te eisen. Het doel is een groeiende, lokale en tijdgestempelde meetreeks waarmee de thermische toestand en de vertraging van water op weersveranderingen later beter kunnen worden getoetst.

### 156.1 Meetfrequentie: opportunistisch tijdens vissessies

- De gebruiker meet watertemperatuur wanneer hij/zij daadwerkelijk gaat vissen en registreert iedere fysieke meting.
- Er is geen verplichting om dagelijks, elk dagdeel of op vaste kloktijden te meten. Niet-gemeten dagen blijven ontbrekend; ze worden niet geïnterpoleerd alsof er waarnemingen zijn.
- Iedere afzonderlijke fysieke meting krijgt een eigen meetmoment. Als tijdens één sessie meerdere metingen worden gedaan, mogen eerdere waarnemingen niet worden overschreven door alleen de laatst ingevoerde sessiewaarde.
- Behoud een snelle, laagdrempelige invoer. Alleen gegevens die al bekend/beschikbaar zijn worden vastgelegd; geen extra verplichte dagelijkse handelingen of uitgebreide vragenlijst.

### 156.2 Context die aan elk meetmoment gekoppeld moet worden

De fysieke watertemperatuurwaarneming moet waar beschikbaar aan de volgende context worden gekoppeld:

- gemeten watertemperatuur in °C;
- exact fysiek meettijdstip, apart van het moment waarop de gebruiker het record opslaat;
- stek/waterlichaam en watertype;
- meetmethode en bron/herkomst;
- meetdiepte, indien bekend, afzonderlijk van de totale waterdiepte;
- luchttemperatuur rond het meetmoment;
- windsnelheid en windrichting rond het meetmoment;
- bewolking en/of zonnestraling wanneer betrouwbare gegevens beschikbaar zijn;
- datum, maand, seizoen en lokaal tijdvak, automatisch afleidbaar uit het fysieke meettijdstip in Europe/Amsterdam;
- bron, tijddekking en ophaal-/as-of-tijd van gekoppelde weersgegevens.

De weerscontext mag uit een betrouwbare tijdspecifieke weerbron worden gekoppeld; dit is geen claim dat de gebruiker zelf luchttemperatuur of wind moet meten. De weerbron en het tijdstip waarop de gegevens beschikbaar kwamen moeten worden bewaard. Als een veld niet betrouwbaar beschikbaar is, blijft het expliciet onbekend. Weersgegevens op het meetmoment zijn context bij de waarneming; de weersreeks ná het meetmoment is de forcing voor de latere toestandsupdate. Deze rollen mogen niet worden verwisseld.

### 156.3 Thermische traagheid: de gemeten watertemperatuur is het startanker

Water heeft thermische massa en reageert vertraagd op veranderingen in luchttemperatuur en weer. De engine mag een gemeten watertemperatuur daarom niet vervangen door de actuele luchttemperatuur of op basis van één koude avond/nacht abrupt meerdere graden laten dalen.

Voorbeeld van het gewenste gedrag: als tijdens een middagsessie 8 °C water wordt gemeten, de luchttemperatuur daarna ongeveer gelijk blijft en er weinig wind is, moet de avond- en volgende-ochtendinschatting in beginsel dicht bij de bestaande waterstaat blijven. Een daling naar bijvoorbeeld 5 °C in de avond of 3–4 °C de volgende ochtend is niet gerechtvaardigd zonder een voldoende sterke, langdurige en passende warmte-uitwisseling die door de invoer en onzekerheidsmarge wordt ondersteund. Dit is een gedragstest, geen vaste temperatuurregel of gegarandeerde uitkomst.

De berekening moet daarom:
1. starten vanaf de meest recente geldige fysieke watermeting met het echte meettijdstip;
2. de weersforceringen sinds dat meettijdstip chronologisch verwerken;
3. luchttemperatuur, straling/bewolking, wind/menging, waterdiepte, watertype en meetdiepte alleen gebruiken voor zover beschikbaar en passend;
4. de waterstaat geleidelijk aanpassen volgens een expliciete thermische tijdsrespons, met onzekerheid die toeneemt bij langere extrapolatie en ontbrekende dekking;
5. dezelfde doorlopende toestand gebruiken voor avond, nacht en volgende ochtend, in plaats van elk tijdvak los vanaf luchttemperatuur te schatten;
6. geen sterke afkoeling of opwarming verzinnen wanneer de relevante weerdata ontbreken of de meting te oud/onduidelijk is.

De huidige engine bevat al een eenvoudige uur-voor-uur demping en diepte-afhankelijke tijdconstanten (zie §§153 en 155). Deze parameters zijn heuristisch. Deze gebruikersinbreng maakt ze niet automatisch gevalideerd: ze moeten met echte lokale metingen worden getoetst en waar nodig worden herzien. Geen willekeurige vaste correctie of nieuwe universele tijdconstante invoeren.

### 156.4 Wat de meetreeks ons moet leren

Door metingen uit verschillende sessies te combineren ontstaat geleidelijk een lokale dataset over:
- hoe watertemperatuur zich op deze stek/watermassa door maanden en seizoenen ontwikkelt;
- hoe snel water reageert op korte versus langdurige warme of koude perioden;
- hoe rustige en winderige omstandigheden samenhangen met de gemeten ontwikkeling;
- mogelijke verschillen tussen ondiep/diep water en bekende meetdieptes;
- verschillen tussen middag-, avond- en ochtendmetingen, zonder te veronderstellen dat elk dagdeel dagelijks wordt bemeten.

Deze reeks kan later tijdconstanten, onzekerheidsbanden en seizoensprofielen helpen beoordelen. Alleen herhaalde, vergelijkbare waarnemingen met voldoende spreiding en dekking kunnen een lokale relatie onderbouwen. Een paar metingen of een correlatie tussen wind en temperatuur bewijzen geen causaliteit en mogen geen schijnprecisie opleveren.

### 156.5 Verplichte tests en grenzen

| Scenario | Verwachte eigenschap |
|---|---|
| 8 °C middagmeting, stabiele luchttemperatuur, weinig wind | Water blijft op korte termijn relatief stabiel; geen abrupte avond-/ochtendval |
| 8 °C middagmeting, langdurige koude-inval en sterke menging | Geleidelijke afkoeling kan optreden; grootte volgt uit forcing, diepte en onzekerheid |
| Zelfde weer, verschillende bekende water-/meetdieptes | Reactiesnelheid mag verschillen, maar alleen binnen onderbouwde modelgrenzen |
| Geen meting op tussenliggende dagen | Geen fictieve waarneming of schijnbaar gemeten dagwaarde toevoegen |
| Meerdere metingen in één sessie | Iedere fysieke meting blijft afzonderlijk herleidbaar en overschrijft de vorige niet |
| Weercontext bij meettijd ontbreekt | Temperatuurmeting blijft behouden; ontbrekende weercontext blijft onbekend |
| Weer na meetmoment ontbreekt | Geen ongefundeerde extrapolatie; onzekerheid/status wordt aangepast |
| Metingen in verschillende maanden/seizoenen | Meetmoment en kalendercontext blijven reproduceerbaar en vergelijkbaar |

**Besluit:** sessiegebonden watertemperatuurmetingen vormen de gewenste praktische basis voor lokale thermische kalibratie. Dagelijkse metingen zijn geen vereiste. Elke meting moet als afzonderlijke tijdgestempelde observatie met beschikbare weerscontext worden bewaard. De bestaande waterThermalEngine blijft de enige engine; de thermische traagheid wordt eerst met deze lokale reeks en onafhankelijke meetvalidatie getoetst voordat parameters of runtimegedrag veranderen.

Geen runtime-, database-, score-, gewicht-, UI- of verplichte invoerwijziging. Fase 2 blijft open; Fase 3 geblokkeerd.


## 157. Fase-2-closeoutcontrole: resterende technische en inhoudelijke poorten (20 november 2026)

Deze controle volgt de roadmapvolgorde uit §149 en de contractuitwerking §§150–156. Zij scheidt documentatiegereedheid, runtimegedrag en empirische validatie. Read-only audit; geen runtime-, database-, score-, parameter-, gewicht- of UI-wijzigingen.

| Criterium | Status | Gereed | Resterend |
|---|---|---|---|
| 1. Doelrespons en responslagen | Ontwerp grotendeels gereed; runtime niet samengesteld | Eén bestaande 1–10-dagscore als productdoel; thermiek, voeding/foerageren, beweging/habitat, vangbaarheid, persoonlijke vangstkans en onzekerheid zijn gescheiden (§§103,105,150). | Actieve score blijft de geaccepteerde voorlopige thermische prior (optie A), niet de uiteindelijke geïntegreerde activiteit-/voedingsrespons. Er is geen onafhankelijke gemeenschappelijke doelreferentie om de lagen veilig samen te voegen. |
| 2. Bronkwaliteit en overdraagbaarheid | Inventaris gereed voor huidige scope; numerieke voedingslaag niet toelaatbaar | Soortresponskaarten en 94 registry-records zijn op eindpunt, levensfase en context geclassificeerd. Geen bron is numeriek goedgekeurd. Optie A is een productuitzondering, geen wetenschappelijke validatie. | Geen overdraagbare bronset valideert de exacte thermische priorparameters voor alle soorten of een numerieke method-feeder-/pelletrespons. Geen bronquota of geforceerde curves meer. |
| 3. Water- en omgevingsdata | Contractontwerp gereed; tijdstipuitvoering en meetcontextregistratie open | Herkomst, meettijd, methode, meetdiepte, onzekerheid en weersforceringen zijn geïnventariseerd. Sessiegebonden meten zonder dagelijkse meetplicht staat in §156. | waterThermalEngine levert één dagbrede temperatuuruitkomst. FishingSession heeft één temperatuurveld; geen afzonderlijke meeteventreeks voor meerdere metingen binnen één sessie. Weerscontext op het fysieke meetmoment wordt niet als onveranderlijke context per meetrecord opgeslagen. Historische profielselectie gebruikt meetdiepte nog niet. |
| 4. Tijdvak- en gedragslogica | Ontwerp gereed; runtime-/biologische rangschikking open | Vier tijdvakken en verbod op generieke schemerbonus zijn vastgelegd. | prognosisEngine deelt dezelfde dagbrede thermalAnalysis met alle tijdvakken. targetHour is geen tijdstip-API. Tijdzone/DST, forecastAsOf en één chronologische toestand per doeltijd moeten technisch worden geïmplementeerd en getest. Directe lokale voedingslabels ontbreken. |
| 5. Evaluatieketen | Technische evaluatoren gereed voor bestaande eindpunten; biologische evaluatie niet mogelijk met huidige labels | Brier/BSS voor persoonlijke vangstkans en MAE/RMSE/bias voor watertemperatuur zijn aanwezig en gescheiden. Snapshots en chronologische evaluatiebasis bestaan. | Geen directe lokale labels voor fysiologische activiteit, voedselopname/foerageren of habitat-aanwezigheid. Vangsten, aanbeten, beweging en nulvangstsessies zijn geen vervangende voedingslabels. |
| 6. Gebruiksvriendelijkheid/tactiek | Basisflow gereed; twee productgaten | Vangst opslaan blijft laagdrempelig; soort is kerninvoer en overige velden optioneel. | De gewenste optionele herbruikbare hengel-/methodepreset ontbreekt; huidige flow heeft vrije tekst. De algemene PrognosisView toont exacte voorvoergrammen ook bij lagere invoerkwaliteit, terwijl VisCoach strenger gate. Exacte grammen en temperatuurbanden zijn niet gevalideerd en vragen expliciet productbesluit. |
| 7. Technische borging | Gereed voor huidige wijzigingsreeks | Exacte PR-head- en mergecommit-Quality-Gates zijn groen, inclusief PR #201. | Iedere volgende codewijziging vereist opnieuw diff-review, regressietests en groene gates op exacte PR-head en mergecommit. |

### 157.1 Concrete codebevindingen in de waterketen

1. waterThermalEngine.ts accepteert targetHour, maar gebruikt deze optie niet; de schatter retourneert één toestand voor de doeldag.
2. prognosisEngine.ts roept de thermische schatter één keer aan en deelt dezelfde thermalAnalysis met Nacht, Ochtend, Middag en Avond. Uurlijkse weerdata leveren dus nog geen tijdspecifieke watertemperatuur.
3. FishingSession bewaart één waterTemperature met waterTemperatureMeasuredAt, methode, bron en meetdiepte. Dit ondersteunt één meting per sessierecord, geen onbeperkte reeks meetevents binnen één sessie.
4. De historische observatiestructuur bewaart meettijd, methode, bron en meetdiepte, maar niet de feitelijke lucht-/wind-/lichtcondities als onveranderlijke context op het fysieke meetmoment. weatherInput in een prognosesnapshot is de forecast voor die prognose, niet automatisch het werkelijk waargenomen weer bij de meting.
5. deriveHistoricalWaterTemperatureProfile() gebruikt kalendermaand, locatie/watertype en locatiediepte, maar measurementDepthM is nog geen selectiedimensie. Verschillende verticale waterlagen mogen niet zonder meer één profielreeks vormen.
6. Uurlijkse weerstrings worden op meerdere plaatsen via new Date(hour.time) verwerkt. Tijdzone-/DST-semantiek moet deterministisch worden getest, onafhankelijk van de runtimezone.
7. forecastAsOf, calculatedAt en targetTime zijn in §155 onderscheiden, maar nog niet als volledig tijdstipgericht runtimecontract geïmplementeerd.

### 157.2 Voorvoer en vangstregistratie

**Voorvoer:** prebaitEngine.ts bevat actieve temperatuurbanden (<6, <10, <16, ≤22 en >22 °C), interne geschiktheidsscores, soortfactoren en concrete grammen voor campagne en sessie. De algemene PrognosisView toont moments.amountDisplay zonder dezelfde strikte confidence-gate die VisCoach toepast. De audit (§96) ondersteunt temperatuur als algemene context, maar niet de exacte grenzen, soortfactoren of hoeveelheden. Optie B (numerieke geschiktheid en exacte grammen uitzetten tot passende onderbouwing bestaat) is het kwaliteitsadvies; runtimewijziging vereist expliciete eigenaarsgoedkeuring.

**Vangstregistratie:** afgesproken flow blijft soort kiezen en opslaan; tijd automatisch invullen maar aanpasbaar; gewicht en hengel/methode optioneel. De gewenste optionele vooraf ingestelde hengel-/methodeconfiguratie ontbreekt nog; vrije tekst is geen preset. De keuze mag nooit verplicht worden.

### 157.3 Grenzen van afronding zonder nieuwe echte data

Thermische software kan technisch worden verbeterd met sessiegebonden metingen, expliciete meetcontext en reproduceerbare tijdstipberekeningen. De gebruiker hoeft niet dagelijks te meten. Tijdconstanten kunnen pas empirisch worden beoordeeld met voldoende echte, vergelijkbare waarnemingen over maanden, weersverlopen en relevante dieptes.

De biologische activiteit-/voedingslaag kan als conservatief ontwerp worden afgerond, maar niet eerlijk als empirisch gevalideerd worden afgevinkt zolang directe onafhankelijke labels ontbreken. Vangsten, aanbeten, beweging of aanwezigheidssignalen zijn geen vervangende voedingslabels. Voeg geen verplichte registratievelden toe om dit kunstmatig op te lossen.

### 157.4 Uitvoeringsvolgorde voor resterende Fase 2

1. Implementeer binnen de bestaande waterThermalEngine een tijdstipgericht contract: tijdzonebewust targetTime, afzonderlijke forecastAsOf/calculatedAt, geldig meetanker, één chronologische toestandsdoorloop en expliciete onzekerheid/provenance.
2. Maak Europe/Amsterdam-uur-/DST-parsing deterministisch en test wintertijd, zomertijd, runtimes buiten Amsterdam, ontbrekende uren en forecast-as-of/future leakage.
3. Maak meetdiepte onderdeel van historische profielselectie; bekende dieptes worden niet met onbekende of andere lagen samengevoegd.
4. Maak meetregistratie geschikt om iedere fysieke meting afzonderlijk te bewaren, inclusief meetmoment en beschikbare weerscontext. Geen dagelijkse meetplicht en geen verplichte extra invoervelden; bestaande sessievelden en snapshots blijven compatibel.
5. Herstel de consistentie van de voorvoerweergave nadat het productbesluit over numerieke grammen is bevestigd; behoud kwalitatieve method-feeder-/voeradviezen.
6. Werk de finale respons-/feature-/evaluatiematrix en zevenpunts-crosswalk bij. Geen geïntegreerde score, nieuwe numerieke factor, gewicht of tijdvakbonus zonder passende onafhankelijke labels en chronologische validatie.

### 157.5 Formele uitkomst

**Fase 2 is nog niet formeel afgerond of geaccepteerd. Fase 3 blijft geblokkeerd.** De literatuur- en architectuurinventaris zijn voldoende ver gevorderd; verder breed literatuur verzamelen is niet de hoofdtaak. De resterende softwarewerkzaamheden zijn concreet afgebakend in §157.4. Onafhankelijke biologische validatie en lokale thermische kalibratie blijven afhankelijk van toekomstige echte meetgegevens en mogen niet door documentatie of synthetische tests worden geclaimd.


## 158. Uitvoering punt 1 — tijdstipgerichte thermische toestand (20 november 2026)

**Status: technisch geïmplementeerd en gevalideerd binnen de bestaande engine.** PR [#203](https://github.com/sennzor-wq/Vislogboek/pull/203) is gemerged. De exacte PR-head Quality Gate én de Quality Gate op de mergecommit zijn geslaagd.

De bestaande `analyzeWaterThermalDevelopment` ondersteunt nu `targetTime` als expliciet doeltijdstip. De prognose berekent voor elk tijdvak een eigen thermische toestand op een representatief forecastmoment. Elke berekening begint bij hetzelfde laatst geldige meetanker en verwerkt de beschikbare uurlijkse weersontwikkeling chronologisch tot het gevraagde moment. Een meting die ná het doelmoment plaatsvond, wordt niet als anker gebruikt. Een actuele meting wordt voor een toekomstig tijdstip behandeld als historisch startanker en niet opnieuw als actuele meting gepresenteerd.

Verstreken tijdvakken worden niet achteraf herschreven met een latere meting; zij behouden de bestaande actuele/dagbrede analyse. De bestaande lokale temperatuur-biascorrectie wordt op de tijdstipgerichte schattingen op dezelfde manier toegepast. De zichtbare 1–10-score, het scoremodel, de database, gebruikersinvoer en UI zijn niet gewijzigd.

Nieuwe regressietests controleren:
- expliciete tijdstempel per berekening;
- een gemeten 8 °C als gedeeld startanker voor middag, avond en volgende ochtend;
- stabiele luchttemperatuur en weinig wind veroorzaken geen ongefundeerde abrupte temperatuurdaling;
- toekomstige schattingen blijven schattingen en behouden de herkomst van hetzelfde meetanker.

De eerste CI-run vond een bestaande dagscore-regressie doordat verstreken tijdvakken met een later meetmoment werden herberekend. Dit is hersteld: verstreken tijdvakken gebruiken de bestaande actuele analyse. De herhaalde volledige Quality Gate is groen, inclusief waterthermische koppeling, alle regressietests en productiebuild.

**Begrenzing:** de targettijd wordt nu doorgegeven en gebruikt, maar de deterministische interpretatie van forecasttijdstempels, `forecastAsOf`, Europe/Amsterdam en zomer-/wintertijd hoort bij punt 2 en is nog open. Dit resultaat valideert ook nog niet de fysieke tijdconstanten; daarvoor zijn echte lokale meetreeksen nodig.

**Volgende stap: punt 2 — tijdzonebewuste en reproduceerbare forecast-/tijdstempelverwerking.** Geen fase-3-overgang.


## 159. Uitvoering punt 2 — tijdzonebewuste forecasttijd en forecast-as-of (20 november 2026)

**Status: technisch geïmplementeerd en gevalideerd.** PR [#205](https://github.com/sennzor-wq/Vislogboek/pull/205) is gemerged; de exacte PR-head en mergecommit Quality Gates zijn groen.

De forecastketen vraagt Open-Meteo nu expliciet om Unix-tijdstempels. Uurlijkse tijden worden direct genormaliseerd naar absolute UTC-ISO-instanties. Daarmee worden zomertijd en wintertijd als werkelijke tijdsverloop behouden; de herhaalde lokale 02:00 krijgt twee verschillende instanties. De daily zonsopkomst/-ondergang wordt terugvertaald naar Amsterdamse lokale datum/tijd voor de bestaande schemerberekening.

Oude cachewaarden blijven bruikbaar: timezone-loze Amsterdam-wandtijden worden bij cachelezing genormaliseerd; bij de herhaalde herfstuurwaarde wordt de tweede opeenvolgende 02:00 aan de latere CET-instant gekoppeld. Niet-bestaande lokale tijden in de voorjaarswisseling worden verworpen. Relevante filters en tijdvakken in de thermische engine, prognose-engine, hengelpositionering en historische temperatuurprofielen gebruiken de gedeelde Amsterdamse datum-/uurparser.

Het moment waarop de forecastpayload is opgehaald (`weatherFetchedAt` / `forecastAsOf`) blijft onderscheiden van het prognoseberekeningstijdstip (`calculatedAt`). Wanneer de opgehaalde forecast aantoonbaar later is dan het berekeningstijdstip of een ongeldige as-of heeft, wordt die weerspayload niet gebruikt. De onveranderlijke snapshot blijft de exacte weersinvoer en ophaaltijd bewaren.

Regressies dekken de dubbele herfst-02:00, de niet-bestaande lente-02:00, tijdvakselectie, thermische chronologie en future-leakage. De bestaande tests voor sessies, coach, historische meetankers, weerverrijking en productiebuild zijn groen.

**Begrenzing:** oude cachegegevens die ooit met de vaste offset van de API zijn opgeslagen, kunnen de historische overgangsuren niet met terugwerkende kracht exact herstellen; ze blijven best-effort genormaliseerd. Nieuwe payloads hebben de exacte absolute tijdstempels. Dit is technische tijd-/provenanceborging, geen empirische validatie van thermische tijdconstanten.

**Volgende stap: punt 3 — meetdiepte meenemen in selectie en vergelijkbaarheid van historische watertemperatuurprofielen.**


## 160. Uitvoering punt 3 — meetdieptebewuste historische temperatuurprofielen (20 november 2026)

**Status: technisch geïmplementeerd en gevalideerd.** PR [#207](https://github.com/sennzor-wq/Vislogboek/pull/207) is gemerged; de exacte PR-head en mergecommit Quality Gates zijn groen.

De historische profielselectie bewaart nu de verticale meetlaag als aparte dimensie, los van de totale waterdiepte. Een profiel combineert nooit bekende meetdieptes met onbekende dieptes of met een andere bekende diepte. Dieptes worden op centimeterprecisie genormaliseerd om identieke invoer zoals 0,40 en 0,4 meter gelijk te behandelen.

Wanneer een expliciete doelmeetdiepte bekend is, gebruikt de selectie uitsluitend metingen op die diepte. Zonder expliciete doelmeetdiepte wordt alleen een eenduidige laag gebruikt: één bekende meetdiepte of uitsluitend onbekende-diepte-metingen. Als meerdere bekende dieptelagen aanwezig zijn en het doelmeetniveau niet bekend is, wordt geen profiel gekozen in plaats van willekeurig lagen te mengen. Dezelfde regel geldt voor de terugval naar nabije stekken van hetzelfde watertype; de bestaande vergelijking van totale waterdiepte blijft afzonderlijk bestaan.

De gekozen profielmeetdiepte wordt als provenance in de thermische analyse teruggegeven. De targetdatum en maandselectie gebruiken de gedeelde Europe/Amsterdam-tijdparser. De bestaande records met onbekende meetdiepte blijven bruikbaar als afzonderlijke onbekende-dieptegroep; er is geen nieuw verplicht invoerveld of databaseschema toegevoegd.

Regressietests controleren meerdere meetlagen op één stek, expliciete diepteselectie, bekende versus onbekende diepte en de nabijgelegen-stekkenfallback. De volledige Quality Gate en productiebuild zijn groen.

**Begrenzing:** de profielselectie is nu dieptebewust, maar als meerdere historische dieptelagen bestaan en het beoogde meetniveau niet bekend is, wordt bewust geen profiel gebruikt. Dat is betrouwbaarder dan een schijnnauwkeurige menging. De thermische tijdconstanten blijven afhankelijk van toekomstige echte lokale meetreeksen.

**Volgende stap: punt 4 — afzonderlijke sessiegebonden meetevents bewaren met meettijdstip en beschikbare weerscontext, zonder dagelijkse meetplicht.**


## 161. Uitvoering punt 4 — afzonderlijke sessiemetingen en weerscontext (20 november 2026)

**Status: implementatie in PR #211; formele afvinking wacht op de exacte PR-head Quality Gate.** Dit onderdeel verbetert registratie en provenance. Het verandert geen score, thermische tijdconstanten, factorweging of verplichte gebruikersinvoer.

### Datamodel en compatibiliteit

Elke fysieke meting wordt als eigen WaterTemperatureMeasurement-record bewaard in FishingSession.waterTemperatureMeasurements[]. Een event bevat een eigen ID en stek-ID (zodat de oorspronkelijke stek behouden blijft als de sessie later wordt aangepast), watertemperatuur, fysiek meetmoment (measuredAt), afzonderlijk registratiemoment (recordedAt), bron en meetmethode, meetdiepte indien bekend, en optionele weerscontext met expliciete status wanneer die context niet beschikbaar is.

De bestaande scalaire FishingSession.waterTemperature*-velden blijven als compatibiliteitssamenvatting bestaan en weerspiegelen de meest recente bruikbare meting. Bestaande sessies zonder event-array blijven leesbaar; bij openen wordt de oude scalaire meting als één legacy-event getoond. Een onbekend oud meetmoment blijft null en wordt niet uit sessiestart of invoermoment verzonnen.

Er is bewust geen nieuwe IndexedDB-tabel of schema-migratie nodig: de meetevents zitten in het bestaande sessierecord en lopen daardoor mee in bestaande sessieopslag, transacties en JSON-back-ups. Back-upimport valideert event-ID's, temperatuur, tijdstempels, bron/methode, meetdiepte en weerscontext.

### Gebruikersflow

De sessie-editor toont een optionele lijst van metingen en een invoer om een volgende meting toe te voegen. Het meettijdstip wordt standaard gevuld met het actuele Europe/Amsterdam-tijdstip en blijft aanpasbaar. De gebruiker kan binnen één sessie meerdere metingen toevoegen of verwijderen. Methode en meetdiepte blijven optioneel. Er is geen dagelijkse meetplicht, geen automatische fictieve tussenmeting en geen verplicht extra formuliermoment.

Een fysiek meettijdstip in de toekomst wordt geweigerd. Oude records zonder exact meetmoment blijven bewaard maar zijn niet geschikt voor tijdsafhankelijke kalibratie.

### Weerscontext en provenance

Bij opslaan probeert de app per stek de dichtstbijzijnde beschikbare uurlijkse weerwaarde te koppelen, uitsluitend wanneer deze maximaal 60 minuten van het fysieke meetmoment afligt. Vastgelegd worden onder meer luchttemperatuur, windsnelheid/-richting, bewolking, druk, neerslag en waar beschikbaar relatieve vochtigheid, dauwpunt en zonnestraling. Ook de bron, het exacte weeruur, het ophaalmoment en het tijdsverschil worden bewaard.

Dit is context uit de Open-Meteo-uurreeks, geen directe lokale weerwaarneming. Ontbrekende data, geen coördinaten of een te grote tijdsafstand leiden tot weatherContextStatus: unavailable; er worden geen standaardwaarden of geschatte omstandigheden ingevuld. Oudere meetmomenten buiten de beschikbare recente uurreeks kunnen dus zonder weerscontext blijven.

### Gebruik in de bestaande prognoseketen

Alle afzonderlijke events worden aan de gedeelde historische watertemperatuur-observatielijst toegevoegd. Elke geldige meting kan zo afzonderlijk bijdragen aan het lokale seizoens-/diepteprofiel. Een sessie- en snapshotkopie van hetzelfde fysieke meetmoment blijven als herleidbare bronrecords beschikbaar; de profielberekening telt dezelfde meting slechts één keer. Events met onbekende bron/methode of zonder exact meetmoment blijven opgeslagen maar worden niet als gevalideerde profielmeting gebruikt.

De meest recente bruikbare sessiemeting blijft beschikbaar als anker voor de bestaande waterThermalEngine. Bij een nieuwe sessie wordt ook het fysieke meettijdstip, los van het moment waarop de snapshot wordt opgeslagen, aan de thermische engine doorgegeven. De engine rekent vanaf dat meetanker door naar het prognosetijdstip; recordedAt wordt nooit als fysieke meettijd gebruikt. De immutable snapshot bewaart het meettijdstip, de methode, meetdiepte en beschikbare weerscontext.

VisCoach herkent een gewijzigde meeteventreeks als nieuwe observatie-invoer. Back-up-roundtrip-, datum/tijd-, historische profiel- en weerscontexttests zijn toegevoegd.

### Begrenzing en acceptatie

De registratie en koppeling van beschikbare weerscontext zijn nog geen empirische validatie van de thermische tijdconstanten. De weerscontext is modeldata en mag niet als gemeten weer worden gepresenteerd. Een event met onbekende meetmethode blijft zichtbaar en bewaard, maar telt volgens de bestaande datakwaliteitsregel niet mee voor profielkalibratie.

**Afvinkcriterium:** PR #211 moet op de definitieve PR-head volledig groen zijn, inclusief typecheck, alle regressietests, backup round-trip en productiebuild. Daarna controle op de mergecommit op main. Bij groen is punt 4 technisch afgerond; lokale thermische kalibratie blijft afhankelijk van toekomstige echte meetreeksen. Daarna volgt punt 5, niet fase 3.

## 162. Acceptatie punt 4 — sessiegebonden meetevents (20 november 2026)

**Status: technisch afgerond en gevalideerd.** PR [#211](https://github.com/sennzor-wq/Vislogboek/pull/211) is gemerged in commit 75032795bfcecd8e4a61b6fa16b4650ba26802dd. Zowel de exacte PR-head als de mergecommit Quality Gate zijn volledig groen.

Punt 4 is hiermee afgevinkt:
- meerdere fysieke meetevents per vissessie worden afzonderlijk bewaard met meettijd, registratietijd, stek, temperatuur, bron/methode en optionele meetdiepte;
- beschikbare uurlijkse Open-Meteo-context wordt uitsluitend gekoppeld binnen 60 minuten van het fysieke meetmoment, met bron, weeruur, ophaaltijd en offset;
- ontbrekende context blijft expliciet onbekend; er worden geen waarden verzonnen;
- de fysieke meettijd wordt als thermisch anker gebruikt, los van het latere opslaan of berekenen van de snapshot;
- alle geldige events worden afzonderlijk aangeboden aan de historische profielketen; dubbele snapshotkopieën tellen in het profiel slechts eenmaal;
- legacy scalar sessievelden en bestaande JSON-back-ups blijven compatibel; er is geen nieuwe IndexedDB-tabel of migratie nodig;
- meetinvoer blijft optioneel en er bestaat geen dagelijkse meetplicht.

De Quality Gate heeft typecheck, Amsterdam-/DST-regressies, thermische en historische profieltests, weerscontextmatching, VisCoach, backup round-trip en productiebuild succesvol uitgevoerd.

**Begrenzing:** de eventregistratie en technische koppeling zijn gevalideerd, maar dit valideert nog niet de fysieke thermische tijdconstanten. De weerscontext is Open-Meteo-modeldata en geen directe lokale weerwaarneming. Meetreeksen over verschillende seizoenen en omstandigheden moeten nog in de praktijk ontstaan.

**Volgende stap: punt 5 — audit en besluit over de numerieke voorvoeradviezen en consistente confidence-gating.** De exacte gramadviezen en temperatuur-/soortgrenzen blijven voorlopig niet gevalideerd; runtimewijzigingen worden niet uitgevoerd zonder expliciete productgoedkeuring. Fase 2 blijft open; fase 3 geblokkeerd.


## 163. Eigenaarbesluit punt 5 — behoud engine, confidence-gating in presentatie (20 november 2026)

**Besluit: goedgekeurd.** De bestaande voorvoerengine blijft inhoudelijk intact. Er worden geen temperatuurbanden, geschiktheidswaarden/-scores, soortfactoren, berekende grammen, campagneplanning, persoonlijke vergelijkingen of overige engine-uitkomsten verwijderd of aangepast. De numerieke waarden blijven beschikbaar als interne modeluitvoer en voor latere evaluatie.

De afgebakende runtimewijziging betreft uitsluitend de presentatie van exacte gramhoeveelheden in de algemene PrognosisView:
- exacte hoeveelheden van voorbereidende voerbeurten worden alleen getoond wanneer de bestaande invoerkwaliteitsclassificatie `Redelijk` is;
- bij `Matig` of `Laag` blijven eventuele geplande momenten en kwalitatieve uitleg zichtbaar, maar wordt de gramwaarde niet getoond;
- ook de numerieke hoeveelheid tijdens de sessie wordt bij lagere invoerkwaliteit niet getoond; het kwalitatieve presentatie-/voeradvies blijft beschikbaar;
- de bestaande temperatuurbanden en kwalitatieve geschiktheidsconclusie blijven ongewijzigd en worden als praktische heuristiek, niet als wetenschappelijk gevalideerde biologische norm, gepresenteerd.

De confidence-level beschrijft uitsluitend de volledigheid/kwaliteit van de ingevoerde temperatuur- en stekgegevens. `Redelijk` is geen bewijs dat de gramhoeveelheid biologisch gevalideerd is; de bestaande waarschuwing daarover blijft staan. Er worden geen nieuwe verplichte velden toegevoegd.

**Buiten scope:** alle andere prognosefactoren, de algemene biologische score, weersanalyse, VisCoach-intake, habitat-/wind-/positioneringsmodules, sessiegegevens en gebruikersdata. Geen temperatuurgrenzen of berekeningsfuncties wijzigen.

**Validatiegrens:** bestaande engine-regressietests blijven de berekende waarden controleren. De UI-wijziging is een presentatielaag-gate; een volledige lokale typecheck/test/build is in deze werksessie niet uitgevoerd en mag niet als groen worden gerapporteerd.


## 164. Vervolgcontrole punt 5 — volledige zichtbare hoeveelheidsroutes (20 november 2026)

**Status: gerichte statische code-audit uitgevoerd; punt 5 nog niet volledig afgesloten.** Deze controle bouwt voort op het eigenaarbesluit §163 en de implementatie op commit `3e46b401ddf08e4706f0ae6c3d896f8d0a8bb330`. Er is geen applicatiecode gewijzigd.

### 164.1 Confidence-classificatie en betekenis

In `prebaitEngine.ts` wordt `Redelijk` alleen toegekend wanneer de watertemperatuur als meting is aangeleverd én watertype en positieve waterdiepte bruikbaar zijn. Een bruikbare modelschatting met watertype, of een gemeten temperatuur met ontbrekende diepte, valt terug op `Matig`. Ontbrekende bruikbare temperatuur of watertype leidt tot `Laag`.

Dit is uitsluitend een invoercompleetheidsregel. De watertype- en dieptewaarden zijn gebruikersregistraties; de classificatie controleert niet of ze fysiek juist zijn. Ook `Redelijk` valideert de biologische juistheid van temperatuurbanden, soortfactoren of gramadviezen niet.

### 164.2 Algemene Prognose — zichtbare uitvoer gecontroleerd

De relevante uitvoer in `PrognosisView.tsx` is gecontroleerd:
- voorafgaande voerbeurten tonen `amountDisplay` alleen bij `Redelijk`; anders blijft het geplande moment zichtbaar met “Hoeveelheid niet weergegeven”;
- de hoeveelheid tijdens de sessie wordt alleen bij `Redelijk` numeriek getoond; bij lagere invoerkwaliteit blijft kwalitatief “Spaarzaam bijvoeren; hoeveelheid niet gekwantificeerd” staan;
- de voersamenstelling, toelichting, method-feederuitleg, beperkingen en eventuele persoonlijke historie blijven afzonderlijke kwalitatieve/contextuele onderdelen;
- in de gecontroleerde voorvoerweergave wordt `totalAmountGrams` niet als alternatieve numerieke totaalsom getoond.

De algemene Prognose geeft een geplande sessieduur via de bestaande selector door; de huidige standaardselectie is 3 uur. Dit is een planningsinstelling, geen gemeten sessieduur. Er is geen nieuw verplicht invoerveld toegevoegd.

### 164.3 VisCoach — zichtbare uitvoer gecontroleerd

De bestaande `buildVisCoachAdviceText`-route in `sessionCoachService.ts` is eveneens gecontroleerd:
- campagnegrammen worden alleen opgenomen bij `confidenceLevel === 'Redelijk'`; bij lagere kwaliteit blijft de voorbereidingsdag/timing zichtbaar zonder gramwaarde;
- sessiegrammen vereisen tegelijk `Redelijk`, een expliciet bekende eindtijd/duur die eindig en groter dan nul is, een actief sessievoeradvies en een positieve berekende hoeveelheid;
- zonder bekende sessieduur blijft het kwalitatieve sessieadvies staan, maar wordt geen sessiehoeveelheid getoond;
- method-feederuitleg blijft instant-presentatie onderscheiden van vooraf aangelegd voer.

De interne engine gebruikt bij ontbrekende duur nog een technische standaard van 3 uur voor de berekening. De VisCoach-presentatielaag laat die sessiegrammen echter niet zien zonder expliciet bekende duur. Dit onderscheid is belangrijk en moet bij toekomstige wijzigingen behouden blijven.

### 164.4 Bestaande regressiedekking

`test-session-coach.ts` bevat gerichte assertions voor:
- exacte campagne- en sessiehoeveelheden bij `Redelijk`;
- verborgen grammen en behouden voorbereidingstiming bij `Matig`;
- ontbrekend watertype zonder onterechte eis om een andere stek te kiezen;
- instant-presentatie zonder verzonnen grammen;
- verborgen sessiehoeveelheid wanneer de duur ontbreekt, terwijl een voldoende onderbouwd voorbereidingsschema zichtbaar kan blijven.

Deze tests zijn in deze vervolgsessie statisch geïnspecteerd, niet uitgevoerd. In de package-scripts staat geen afzonderlijke componenttest voor de algemene `PrognosisView`; de nieuwe UI-gate is daarom nog niet door een uitgevoerde component-/runtime-test bevestigd. Typecheck en productiebuild zijn in deze sessie evenmin uitgevoerd.

### 164.5 Behouden engine-uitvoer en grenzen

`prebaitEngine.ts` is ongewijzigd. De interne temperatuurbanden, geschiktheidsscores, soortfactoren, campagnehoeveelheden, sessiehoeveelheden, persoonlijke vergelijking en method-feederregels blijven berekend en beschikbaar. De zichtbare gate verwijdert of herkalibreert deze informatie niet.

De code-inspectie bevestigt de twee belangrijkste presentatiepaden (algemene Prognose en VisCoach). Dit is geen biologische validatie van de voerregels en geen bewijs dat iedere toekomstige export-, detail- of nieuwe UI-route automatisch dezelfde gate toepast. Nieuwe presentaties moeten dit contract expliciet volgen.

**Vervolg vanaf hier:**
1. Controleer de resterende tests en codepaden rond voorvoerplanning, met name soortondersteuning, voorbereidingstijd, campagnegrenzen, persoonlijke vergelijking en method-feeder-/instant-semantiek.
2. Bepaal of een gerichte regressietest voor de algemene PrognosisView-gate haalbaar is binnen de bestaande testinrichting; voeg geen brede testinfrastructuur of runtimewijziging toe zonder noodzaak.
3. Voer daarna de relevante tests, typecheck en productiebuild uit zodra de beschikbare uitvoeromgeving dit toelaat, en controleer de definitieve diff.
4. Rond punt 5 pas af nadat deze controles zijn vastgelegd. Daarna volgt het resterende Fase-2-closeoutwerk; Fase 3 blijft geblokkeerd.

**Wijzigingsscope van deze controle:** uitsluitend auditdocumentatie. Geen berekeningsregels, gebruikersdata, invoervelden, prognoses of VisCoach-functionaliteit gewijzigd.


## 165. Vervolgcontrole punt 5 — plannergrenzen, soorten en persoonlijke vergelijking (20 november 2026)

**Status: statische engine-audit uitgevoerd; geen runtimewijziging.** De controle betreft `src/services/prebaitEngine.ts` en bouwt voort op §163–164.

### 165.1 Soortondersteuning en temperatuurbanden

De planner wordt momenteel uitsluitend aangemaakt voor Karper, Zeelt en Brasem. Voor andere soorten en de algemene keuze retourneert `calculatePrebaitPlan` geen voorvoerplan. De drie ondersteunde soorten gebruiken dezelfde temperatuurbandstructuur, met soortafhankelijke hoeveelheid-/voermixfactoren:
- Brasem: factor 0,65;
- Zeelt: factor 0,55;
- Karper: factor 1,00.

De huidige temperatuurklassen zijn: onder 6 °C geen vooraf voeren; 6 tot onder 10 °C maximaal één voorafgaande dag; 10 tot onder 16 °C maximaal twee dagen; 16 tot en met 22 °C maximaal drie dagen; boven 22 °C maximaal één dag en terughoudend voeren. Deze grenzen en factoren blijven heuristische code-instellingen, geen gevalideerde soortspecifieke biologische normen. Ze zijn niet gewijzigd.

### 165.2 Voorbereidingstijd en campagnebegrenzing

De opgegeven beschikbare voorbereidingstijd wordt naar een geheel aantal dagen begrensd op 0–3. Het uiteindelijke aantal voorafgaande voerbeurten wordt daarnaast begrensd door de temperatuurklasse, de interne geschiktheidsscore en het werkelijk aantal kalenderdagen tussen planning en sessie. Een sessie op dezelfde dag krijgt dus geen voorafgaande voerbeurt. De planner maakt alleen voorafgaande momenten aan wanneer temperatuur en watertype bruikbaar zijn en de geschiktheidsscore ten minste 4 is.

Dit voorkomt dat de planner een niet-bestaande voorbereidingstijd verzint. De bovengrens van drie dagen is een product-/enginegrens, geen biologische aanbeveling om altijd drie dagen te voeren.

### 165.3 Sessiehoeveelheid en method feeder

De sessiehoeveelheid wordt intern proportioneel geschaald op basis van sessieduur, met een rekenbereik van 0,25 tot 24 uur en een technische standaard van 3 uur wanneer de optie ontbreekt. De zichtbare duurregels uit §164 blijven daarom essentieel: de interne default mag niet als expliciet bekende sessieduur worden gepresenteerd.

Method feeder wordt in de engine terecht als instant-presentatie rond het haakaas beschreven, niet als een afzonderlijke voorafgaande voerbeurt. Een eventuele voorafgaande campagne blijft conceptueel apart. Wel telt de code de berekende sessiehoeveelheid op bij `totalAmountGrams`; de veldnaam kan daardoor gelezen worden als uitsluitend campagnegewicht terwijl de inhoud ook de sessiehoeveelheid omvat. De gecontroleerde PrognosisView toont dit totaal momenteel niet. Geen wijziging voorgesteld zolang het veld niet als gebruikersuitvoer wordt gebruikt.

### 165.4 Persoonlijke voorvoervergelijking

De persoonlijke vergelijking wordt beperkt tot dezelfde stek-ID en doelsoort, sluit benchmark-sessies uit en gebruikt alleen vangstsessies of expliciet bevestigde nulvangsten. Een vangstsessie telt voor de doelsoort alleen mee wanneer een bijbehorende soortspecifieke vangst aanwezig is; bevestigde nulvangsten worden afzonderlijk toegelaten.

Percentages verschijnen pas bij minimaal vijf geclassificeerde sessies, met ten minste twee sessies met en twee zonder voorvoeren. De uitkomst is een beschrijvende vergelijking van het aandeel vangstsessies, geen causale effectschatting en geen vangstgarantie. Deze beperking staat ook in de gegenereerde samenvatting.

**Aandachtspunt voor legacy-registraties:** wanneer het expliciete veld `prebaited` ontbreekt, wordt de vrije tekst `baitAndFeed` gebruikt als terugval. De huidige positieve herkenning controleert alleen of de tekst het woorddeel “voorvoer” bevat. Daardoor kan een tekst als “geen voorvoer” onbedoeld als mét voorvoeren worden geclassificeerd. Dit raakt alleen sessies zonder expliciete boolean en kan de persoonlijke vergelijking vertekenen. Er is geen automatische herclassificatie uitgevoerd en geen historische gebruikersdata gewijzigd. Een eventuele correctie moet conservatief zijn en de bestaande vrije tekst behouden.

### 165.5 Tussenconclusie en eerstvolgende stap

De plannergrenzen, ondersteunde soorten, method-feedersemantiek en persoonlijke vergelijkingsdrempels zijn nu statisch in kaart gebracht. Er zijn geen nieuwe biologische claims of numerieke parameters toegelaten.

Openstaand binnen punt 5:
1. besluit/afbakening voor de legacy-tekstfallback bij persoonlijke voorvoerhistorie (“geen voorvoer” kan positief worden herkend);
2. vaststellen of de ambiguë naam/inhoud van `totalAmountGrams` alleen documentatie behoeft of later een compatibele verduidelijking;
3. gerichte regressiecontrole van de confidence-gate in de algemene PrognosisView en daadwerkelijke uitvoering van relevante tests, typecheck en productiebuild.

Geen van deze punten rechtvaardigt een wijziging van de numerieke voorvoerengine. Voor de legacy-classificatie wordt eerst de veiligste, niet-destructieve correctie bepaald; bestaande vrije tekst en expliciete `prebaited`-waarden moeten behouden blijven. Punt 5 is nog niet afgerond; Fase 2 blijft open en Fase 3 geblokkeerd.


## 166. Eigenaarcorrectie en betekenis totaalsom — vervolg punt 5 (20 november 2026)

### 166.1 Historische sessies / legacy-fallback

De eigenaar heeft bevestigd dat de oudere sessies waarop de fallback-waarschuwing uit §165.4 betrekking had, inmiddels verwijderd zijn. Deze gegevens bestaan niet meer in de huidige dataset. De mogelijke herkenning van de vrije tekst “geen voorvoer” als positieve voorvoerregistratie is daarom **geen actueel probleem in de aanwezige sessies** en vormt geen reden om bestaande data te corrigeren, terug te halen of opnieuw te classificeren.

De code-observatie blijft uitsluitend een toekomstig aandachtspunt voor een eventuele import, herstelactie of nieuwe legacy-dataset. Bij zo'n toekomstige bron moet de import expliciete `prebaited`-waarden respecteren en negatieve vrije tekst niet als positieve registratie interpreteren. Er is geen wijziging aan de fallbacklogica uitgevoerd.

### 166.2 Definitie van `totalAmountGrams`

De engine telt in de lokale accumulatie eerst de grammen van alle voorafgaande campagnebeurten op en telt daarna ook de hoeveelheid van het sessiemoment erbij. Het geretourneerde veld `PrebaitProgramPlan.totalAmountGrams` is dus de **totale geplande hoeveelheid over alle opgenomen momenten: voorafgaande voerbeurten plus de sessiehoeveelheid**. Het is niet uitsluitend het gewicht van de voorafgaande campagne.

De naam is op zichzelf niet fout, maar de interne variabelenaam `totalCampaignGrams` is smaller dan de feitelijke inhoud. In de huidige gecontroleerde PrognosisView wordt dit veld niet als aparte totaalsom getoond; de afzonderlijke momenten en hoeveelheden zijn de relevante uitvoer. Er is daarom geen reden voor een runtimewijziging of een hernoeming die onnodige compatibiliteitsrisico's introduceert. De semantiek is hiermee gedocumenteerd: consumers mogen dit veld niet interpreteren als alleen vooraf gevoerd voer.

### 166.3 Testinventaris en uitvoerbaarheid

De repository bevat `test-session-coach.ts`, met bestaande regressiegevallen voor de coach-presentatie van voorvoer en confidence-gating. Er is daarnaast geen afzonderlijk benoemd `test-prebait-engine`- of `test-prognosis-view`-bestand aangetroffen in de root testinventaris. De test `test-thermal-and-prognosis.ts` controleert andere prognose-/historieaspecten, maar bevat geen gerichte assertions voor `calculatePrebaitPlan` of `totalAmountGrams`.

De package-scripts bieden `lint` (TypeScript `tsc --noEmit`) en een beperkte set benoemde tests; `test-session-coach.ts` is niet als npm-script geregistreerd. In deze werksessie is geen repository-runtime of lokale package-installatie beschikbaar waarmee de tests, typecheck en build daadwerkelijk kunnen worden uitgevoerd. Er wordt daarom geen geslaagde test- of buildstatus geclaimd.

**Vervolg:** de statische audit van punt 5 is inhoudelijk vrijwel rond. Voor een betrouwbare afsluiting resteert een uitvoerbare technische validatie van ten minste de bestaande VisCoach-regressietest, TypeScript typecheck en productiebuild, plus bij voorkeur een gerichte test voor de planneruitvoer als die in de projectruntime kan worden toegevoegd zonder brede testinfrastructuur. Tot die tijd blijft punt 5 open en blijft Fase 3 geblokkeerd.


## 167. Technische validatiepoging punt 5 — uitvoer geblokkeerd (20 november 2026)

De actuele `main` staat op `77f1c5ce5b9c1a84cd0f2921ba05e62c74f6cdc6`. De gevraagde technische validatie is voorbereid aan de hand van de actuele `package.json` en `.github/workflows/ci.yml`. De relevante checks zijn:

- `bun run tsx test-session-coach.ts` — bestaande VisCoach-regressietest voor de confidence-gating;
- `bun run lint` — TypeScript typecheck (`tsc --noEmit`);
- `bun run build` — productiebuild;
- aanvullend de in de Quality Gate opgenomen prognose-/thermische test `bun run tsx test-thermal-and-prognosis.ts`.

Geen van deze commando's is in deze werksessie uitgevoerd. De beschikbare lokale runtime heeft Node.js en npm, maar geen Bun-installatie; bovendien kon de repository niet via Git worden opgehaald omdat de container geen DNS-/netwerktoegang tot GitHub heeft. Er is dus geen geïnstalleerde projectdependencyset waarop een betrouwbare lokale test of build kan draaien. Statische broninspectie is geen vervanging voor deze uitvoering.

De meest recente zichtbare succesvolle Quality Gate-run (#1027, commit `c4f906d09c695c55d9818cea3d1744e5bf85b754`) is **niet** bewijs voor de huidige `main`: de huidige HEAD ligt vier commits verder. De vier latere commits wijzigen onder meer `PrognosisView.tsx`, `FASE2_PROGNOSE_AUDIT.md` en `MODELARCHITECTUUR_FASE2.md`. Voor de huidige HEAD `77f1c5c` zijn geen commit-statuschecks geregistreerd. De oudere groene run wordt daarom niet als validatie van de huidige wijziging aangemerkt.

Er is geen GitHub Actions-run gestart. De repository-instructie vereist dat `[skip ci]` alleen wordt weggelaten wanneer de eigenaar expliciet vraagt om GitHub Actions te laten draaien; de opdracht om technische validatie uit te voeren is hier niet als expliciet verzoek om een Actions-run geïnterpreteerd.

**Uitkomst:** technische validatie blijft open en is geblokkeerd door ontbrekende uitvoeromgeving. Er is geen test-, typecheck- of buildresultaat om als geslaagd te registreren. Punt 5 blijft open; Fase 2 is niet formeel afgerond en Fase 3 blijft geblokkeerd. Vervolg: voer de genoemde checks uit in de projectomgeving met Bun en een frozen lockfile, of geef expliciet toestemming om de GitHub Actions Quality Gate op de actuele `main` te starten.

## 168. Correctie CI-beleid repository — [skip ci] (21 november 2026)

De eerdere repository-instructie om standaard [skip ci] aan commit-messages toe te voegen, stamde uit de periode waarin de repository privé stond. De eigenaar heeft verduidelijkt dat deze afspraak niet bedoeld was voor de publieke repository. De oude regel is daarom vervallen.

**Actueel beleid:** GitHub Actions mag standaard automatisch draaien op relevante commits. Commit-messages bevatten dus geen [skip ci] tenzij er een expliciete, uitzonderlijke reden is om CI over te slaan en dit vooraf met de eigenaar is afgestemd. De historische beschrijving in §167 dat geen Actions-run is gestart vanwege de toenmalige instructie blijft een feitelijke registratie van die werksessie; die instructie is inmiddels achterhaald en mag niet als huidig beleid worden toegepast.

Deze wijziging is uitsluitend documentatie/werkwijze. Er zijn geen applicatiecode, prognoseberekeningen, sessiegegevens of gebruikersdata gewijzigd. De eerstvolgende relevante commit zonder [skip ci] hoort de Quality Gate automatisch te activeren; de uitkomst moet op de exacte commit worden gecontroleerd.

## 169. GitHub Quality Gate #1028 — technische validatie uitgevoerd (21 november 2026)

**Status: volledig geslaagd op de actuele commit ten tijde van uitvoering.** Na correctie van het CI-beleid is de Quality Gate automatisch gestart op `main` en uitgevoerd voor commit `ae476dff6ceb7a73e39ed5b856fd650c34b898fb`.

Workflow-run: [#1028](https://github.com/sennzor-wq/Vislogboek/actions/runs/44906882345). De job `Typecheck, tests and production build` eindigde met conclusie `success`. De volgende controles zijn daadwerkelijk uitgevoerd en geslaagd:

- `bun install --frozen-lockfile`;
- productie- en volledige dependency-audit (met de reeds gedocumenteerde, tijdelijke uitzondering voor GHSA-fc5q-39xc-vjpf);
- TypeScript typecheck via `bun run lint`;
- Amsterdam-/DST-regressietests;
- kernprognose- en thermische tests;
- solar-time-, Brier-, forward-validation- en advanced-prognosis-tests;
- biologische evidence-registry- en soortcontexttests;
- rod-positioning-, water-thermal-, water-temperature-learning- en historische waterprofieltests;
- backup-, restore-, migratie-, verwijderings- en data-integriteitstests;
- VisCoach-sessieadvies (`test-session-coach.ts`), live-herbeoordeling/integratie en welkomstgroettests;
- deterministische weather-enrichmenttests;
- productiebuild en controle dat private artefacten niet in de productie-output terechtkomen.

Dit is de eerste vastgelegde volledige Quality Gate op de commit die de nieuwe CI-afspraak documenteert. §167 blijft behouden als historisch verslag van de eerdere, geblokkeerde validatiepoging; de uitkomst daarvan is inmiddels ingehaald door deze geslaagde run.

**Resterende testdekkingsgrens voor punt 5:** de workflow voert de bestaande VisCoach-regressietest uit, maar bevat nog geen afzonderlijke gerichte test voor de numerieke uitvoer van `calculatePrebaitPlan`/`totalAmountGrams` en geen geïsoleerde componenttest voor de algemene `PrognosisView`-presentatiegate. Typecheck en productiebuild slagen, maar vervangen die specifieke regressieassertions niet. Daarom is de algemene technische Quality Gate groen, terwijl punt 5 nog niet formeel wordt afgesloten. Eerst moet worden bepaald of een kleine, gerichte planner-/presentatietest binnen de bestaande testinrichting haalbaar is; daarna kan de resterende Fase-2-closeout worden afgerond. Fase 3 blijft tot die formele afsluiting geblokkeerd.

## 170. Punt 5 afgerond — plannerregressie en confidence-gating gevalideerd (21 november 2026)

**Status: punt 5 technisch afgerond.** De gerichte plannerregressietest is toegevoegd als `test-prebait-engine.ts` en opgenomen in `.github/workflows/ci.yml`. De test bevat negen assertions voor soortondersteuning, gemeten versus geschatte temperatuur, ontbrekend watertype/diepte, onbekende temperatuur, sessieduur, method-feedersemantiek, totaalsom en de bestaande temperatuurband-/voorbereidingsgrenzen.

Quality Gate-run [#1031](https://github.com/sennzor-wq/Vislogboek/actions/runs/44907219860) is volledig geslaagd op exact `main`-commit `585d15299f95861312d64021949d0ffb6f95218e`. De nieuwe plannerregressietest rapporteerde **9 geslaagd, 0 gefaald**. De bestaande VisCoach-sessieadviestest rapporteerde **75 geslaagd, 0 gefaald**. Ook typecheck, alle overige Quality Gate-tests, productiebuild en de controle op private productieartefacten zijn geslaagd.

### 170.1 Algemene PrognosisView — resterende zichtbare routes

De actuele `PrognosisView.tsx` is opnieuw volledig op numerieke voorvoeruitvoer gecontroleerd. De confidence-gate staat bij regel 1573 (`confidenceLevel === 'Redelijk'`) en beschermt zowel de hoeveelheid per voorafgaande voerbeurt (regel 1655) als de sessiehoeveelheid (regel 1681). `totalAmountGrams` wordt in deze weergave niet als alternatieve numerieke totaalsom getoond. Er is in de repository geen bestaande geïsoleerde React-componenttestinrichting aangetroffen; er is daarom geen brede testinfrastructuur toegevoegd voor deze eenvoudige presentatielogica. De statische routecontrole is gecombineerd met de geslaagde typecheck, bestaande VisCoach-regressietest en productiebuild.

### 170.2 Afsluiting en begrenzing

Punt 5 is afgesloten voor de afgesproken scope: bestaande engine-uitvoer blijft behouden, exacte grammen worden in de algemene PrognosisView alleen bij `Redelijk` getoond, en de relevante planner-/VisCoach-regressies zijn uitvoerbaar en groen. Dit is **geen biologische validatie** van temperatuurbanden, soortfactoren of gramhoeveelheden. `Redelijk` blijft uitsluitend een invoercompleetheidsclassificatie. Er zijn geen numerieke engineparameters of gebruikersgegevens gewijzigd.

De afsluiting van punt 5 betekent niet dat Fase 2 als geheel is afgerond. De resterende biologische audit-, normalisatie-, coverage- en onafhankelijke validatiepunten blijven open. Fase 3 blijft geblokkeerd tot de volledige Fase-2-acceptatiecriteria zijn gehaald.


## 171. Normalisatie- en coveragecontract v1 — kandidaatmodel zonder runtime-activatie (21 november 2026)

**Doel van deze werkeenheid:** de ontwerpstap uit §105.7 en §106 concreter en toetsbaar maken. Dit contract definieert hoe factoruitkomsten, ontbrekende gegevens, bronkwaliteit en onzekerheid in een later kandidaatmodel moeten worden behandeld. Het kent geen numerieke gewichten toe, activeert geen factor en wijzigt geen bestaande berekening.

### 171.1 Actuele crosswalk na afronding van punt 5

De zevenpunts-crosswalk uit §89 blijft als historische momentopname behouden. De status hieronder actualiseert uitsluitend wat sindsdien aantoonbaar is veranderd. De registry telt op de huidige `main` 94 unieke records; 0 zijn numeriek goedgekeurd voor directe voorspelling.

| Criterium | Actuele status per 21-11-2026 | Nog vereist |
|---|---|---|
| 1. Eén doelrespons en gescheiden biologische responsen | Productdoel en responsgrenzen vastgelegd (§103, §§105–107, §134); geïntegreerde score bestaat nog niet | Kandidaatmodel voor thermische activiteit plus uitsluitend passende directe voedings-/foerageerrespons; geen vermenging met habitat, vangbaarheid of persoonlijke vangstkans |
| 2. Bronkwaliteit, levensfase en overdraagbaarheid | 94 bronnen geïnventariseerd; 0 numeriek goedgekeurd. Optie A is als voorlopige thermische prior expliciet geaccepteerd | Per factor aantonen dat soort, levensfase, respons, voedseltype, watertype, meetmethode en geografische context passen; nieuwe factoren blijven geblokkeerd zonder onafhankelijke onderbouwing |
| 3. Water- en omgevingsdata | Temperatuurprovenance en sessiegebonden meetevents technisch geborgd; lokale zuurstof-, troebelheids-, stromings- en prooidata ontbreken | Ontbrekende lokale invoer expliciet blijven markeren; geen afleiding uit niet-gerelateerde weerdata; toekomstige lokale kalibratie |
| 4. Tijdvak- en soortgedrag | Broninventaris aanwezig; technische thermische tijdvakberekening gereed, maar biologische tijdvakrespons niet gevalideerd | Tijdvakgebonden directe voedings-/foerageerlabels en passende soort-/seizoensdekking; geen universele schemerbonus |
| 5. Lokale leer- en evaluatieketen | Evaluatiearchitectuur ontworpen; directe lokale labels voor biologische activiteit en voedselopname ontbreken | Onafhankelijke labels en metrics per respons; chronologische evaluatie tegen vaste baseline |
| 6. Gebruiksvriendelijkheid en VisCoach | Basisflow behouden; voorvoer-confidence-gating technisch afgerond in §170 | Optionele herbruikbare hengel-/methodepreset is nog een afzonderlijk productbesluit; dit mag de biologische score niet blokkeren of verplichte invoer veroorzaken |
| 7. Technische borging | Huidige wijzigingsreeks heeft groene Quality Gates; punt 5 heeft gerichte plannerregressies | Iedere toekomstige codewijziging opnieuw exact-head- en mergecommit-validatie, diff-review en documentatiesynchronisatie |

De eerder als open genoemde factorinventaris is dus niet opnieuw een uitvoertaak: die inventaris is gesloten in §102. De eerdere eigenaarbesluiten over optie A en voorvoer-confidence-gating zijn eveneens gesloten. Het optionele hengel-/methodepresetbesluit blijft apart open.

### 171.2 Responscontract — geen vermenging van labels

Elke kandidaatuitkomst moet expliciet één responsfamilie benoemen:
- `thermal_activity`: voorlopige thermische activiteitspotentie; optie A blijft de enige bestaande numerieke prior.
- `feeding_intensity`: hoeveelheid/snelheid van voedselopname.
- `feeding_rhythm`: timing van voeding/foerageren binnen de dag.
- `foraging_activity`: voedselzoek-/foerageergedrag, alleen waar het werkelijk gemeten is.
- `habitat_presence` / `movement`: ruimtelijke aanwezigheid of beweging, buiten de biologische dagscore tenzij een afzonderlijk productbesluit en passend bewijs bestaan.
- `catchability` / `capture_probability`: hengelvangbaarheid en persoonlijke vangstkans, uitsluitend in de aparte tactiek-/vangstlaag.
- `coverage_uncertainty`: volledigheid en betrouwbaarheid van de onderbouwing; nooit een biologische scorefactor.

Een bron mag alleen bijdragen aan dezelfde respons die de methode daadwerkelijk meet. Maagvulling, maagledigingsmodellen, groei, metabolisme, aerobe scope, beweging, vangst en voedselopname blijven onderscheiden. De 94 registry-records zijn bewijsinventaris, geen 94 onafhankelijke effectschattingen; 0 records zijn numeriek toegelaten.

### 171.3 Factoruitkomstcontract

Een toekomstige factoruitkomst moet minimaal de volgende conceptuele metadata bij zich houden:

| Veld | Betekenis |
|---|---|
| `factorId` en `responseType` | Stabiele factoridentiteit en expliciete doelrespons |
| `speciesScope` / `lifeStageScope` | Soort en levensfase waarop het bewijs van toepassing is |
| `value` / `unit` | Gevalideerde ruwe invoer of responsuitkomst; nooit een ongemarkeerde proxy |
| `normalizedResponse` | Optionele responsindex op vaste referentieschaal; geen kanspercentage |
| `inputStatus` | `measured`, `estimated`, `proxy`, `context_only`, `unknown`, `invalid`, `conflicting` of `not_applicable` |
| `sourceRefs` / `provenance` | Bron, meetmethode, tijdstip, locatie/diepte, ophaalmoment en herkomst |
| `validityWindow` | Geldigheidsduur en temporele/ruimtelijke toepasbaarheid |
| `uncertainty` | Bekende onzekerheid, bandbreedte of expliciete reden waarom die onbekend is |
| `admissionStatus` | `baseline_exception`, `candidate`, `context_only`, `excluded` of `not_yet_evaluable` |
| `overlapGroup` | Factoren die dezelfde onderliggende oorzaak/invoer kunnen dubbeltellen |
| `modelVersion` | Reproduceerbare versie van responsfunctie en referentieankers |

Dit is een architectuurcontract, geen voorstel om nu al velden aan de database of gebruikersinvoer toe te voegen. De bestaande sessie- en snapshotdata blijven behouden; implementatie vereist een afzonderlijk goedgekeurd technisch ontwerp.

### 171.4 Normalisatie en vaste referentieankers

1. Valideer eerst eenheid, fysiek bereik, tijdstip, bron, ruimtelijke dekking, meetmethode en geldigheid.
2. Selecteer daarna uitsluitend een responsfunctie waarvan soort, levensfase, voedseltype, watertype en onderzoekscontext voldoende aansluiten. Niet-passende context wordt niet door een algemene soortcurve ingevuld.
3. Leg vóór evaluatie vaste referentiecondities en de richting van de respons vast. Gebruik geen dagelijkse min-max-normalisatie, rangschikking binnen de actuele voorspelling of referentie die verschuift met de andere dagen in de dataset.
4. Een genormaliseerde index mag conceptueel begrensd zijn op 0–1, maar is nadrukkelijk geen kans, percentage, vangstkans of universele biologische eenheid.
5. Bewaar naast de index de referentieconditie, ruwe invoer, bron, onzekerheid en afwijking ten opzichte van de referentie. Een index zonder provenance is niet toelatingswaardig.
6. De bestaande thermische curve blijft als `baseline_exception` actief volgens optie A. Dit behoudt de bestaande werking, maar verleent geen goedkeuring aan haar exacte biologische parameters.
7. Iedere nieuwe numerieke factor blijft `candidate` totdat onafhankelijke responslabels, toepassingsgebied en chronologische verbetering zijn aangetoond. De huidige registry bevat daarvoor 0 numeriek goedgekeurde records.

Er worden in deze fase geen numerieke ankers, curves, effectgroottes, gewichten of scoremapping gekozen. Die zouden zonder passende labels schijnprecisie opleveren.

### 171.5 Coverage- en ontbrekende-data-contract

Ontbrekende data worden per factor geclassificeerd, niet samengevoegd tot één ondoorzichtige confidence-score:
- **Gemeten:** bruikbare directe waarneming met tijdstip en herkomst.
- **Geschat:** modeluitkomst met zichtbare bron, methode en onzekerheid.
- **Proxy/context:** relevante context, maar geen directe meting van de doelrespons; telt niet numeriek mee.
- **Onbekend:** geen bruikbare invoer; geen nul of neutrale respons invullen.
- **Ongeldig:** buiten fysiek bereik, onjuiste eenheid, toekomstig meetmoment of onbruikbare herkomst; uitsluiten en reden bewaren.
- **Tegenstrijdig:** meerdere plausibele bronnen/metingen die niet zonder onderbouwde regel kunnen worden samengevoegd; conflict zichtbaar houden.
- **Niet van toepassing:** factor is voor deze soort/context aantoonbaar niet van toepassing; onderscheiden van onbekend.

**Geen verborgen herweging:** een ontbrekende factor krijgt geen fictieve neutrale waarde en de gewichten van aanwezige factoren worden niet automatisch opgehoogd. Een algemeen coveragepercentage wordt evenmin berekend zolang geen goedgekeurde factorweging en relevante-factornoemer bestaan.

**Gedeeltelijke prognose:** de bestaande thermische baseline mag blijven functioneren volgens optie A wanneer de thermische invoer bruikbaar is. Een toekomstige gecombineerde kandidaat mag met gedeeltelijke invoer alleen worden vergeleken wanneer precies dat missingness-/coveragepatroon vooraf is vastgelegd en onafhankelijk gevalideerd. Tot die tijd wordt geen gecombineerde score gefingeerd: de baseline blijft herkenbaar als baseline en de ontbrekende responsdekking wordt afzonderlijk gemeld. Dit voorkomt zowel onnodig blokkeren als het stilzwijgend presenteren van een onvolledige combinatie als volledig model.

Voorbeelden:
- Gemeten watertemperatuur + ontbrekende zuurstof: thermische baseline beschikbaar; zuurstof blijft onbekend en levert geen neutrale of negatieve bonus.
- Geschatte watertemperatuur + uitsluitend weerscontext: schatting blijft als geschat gemarkeerd; luchttemperatuur wordt niet als gemeten watertemperatuur gepresenteerd.
- Directe voedingsbron voor juveniele snoek maar volwassen doelvis: bron blijft contextueel/niet-toepasselijk voor die levensfase; geen overdracht.
- Blankvoorn-dagritme uit één dieetgroep: alleen die context kan worden beschreven; geen soortbrede tijdvakbonus.
- Wind-/druktelemetrie die beweging meet: movement-context, niet automatisch feeding-intensity.

### 171.6 Overlap, interacties en tijdsresolutie

- Een inputvariabele mag niet twee keer als onafhankelijke bijdrage worden geteld. Luchttemperatuur die al in de waterthermische schatting zit, wordt niet nogmaals als zelfstandige biologische bonus gebruikt zonder bewijs van een afzonderlijk effect.
- Interacties (bijvoorbeeld temperatuur × zuurstof, licht × leeftijd of seizoen × voedseltype) worden alleen kandidaat wanneer de bron die interactie rechtstreeks ondersteunt en de benodigde invoer beschikbaar is.
- Dagbrede en tijdvakgebonden responsen blijven onderscheiden. Een dagbrede factor wordt niet vier keer als onafhankelijke factor geteld.
- Een tijdvakrespons vereist tijdgebonden biologische labels en passende tijdsresolutie. Het hergebruik van dezelfde dagthermische waarde voor vier tijdvakken is alleen de bestaande baseline, geen bewijs voor een beste tijdvak.
- Als tijdvakverschillen niet met voldoende bewijs zijn vast te stellen, wordt geen kunstmatige winnaar gekozen.

### 171.7 Onafhankelijke evaluatie en baselineprotocol

Voor iedere toekomstige kandidaat geldt vóór runtime-toelating:
1. Leg vooraf de respons, labels, uitsluitingsregels, contextsegmenten en metric vast.
2. Bevries de huidige optie-A-thermische baseline en de modelversie; vergelijk baseline en kandidaat op exact dezelfde ongeziene waarnemingen.
3. Gebruik chronologische rolling-origin evaluatie: uitsluitend gegevens die op het voorspeltijdstip beschikbaar waren mogen input zijn. Geen toekomstige meting, latere correctie of achteraf verrijkte forecast mag teruglekken.
4. Rapporteer prestaties per soort en waar de data het toelaten per levensfase, seizoen, watertype, meetstatus en tijdvak. Kleine of scheve segmenten blijven beschrijvend en krijgen geen modelgewicht.
5. Voer factorablaties uit om te zien of een factor aantoonbaar extra informatie levert boven de baseline en bestaande inputs.
6. Rapporteer onzekerheid, dekking, aantallen, ontbrekende labels en negatieve resultaten naast gemiddelde metrics.
7. Gebruik responsgebonden metrics: MAE/RMSE/bias voor watertemperatuur; passende fout-/kalibratiematen voor directe activiteit of voedselopname; tijdvakrangschikking alleen met directe tijdvaklabels. Brier/BSS blijft uitsluitend voor persoonlijke vangstkans.
8. Geen automatische parameter- of gewichtsaanpassing. Een resultaat is eerst een evaluatierapport en vereist expliciete review voordat een factor wordt toegelaten.

### 171.8 Wat deze stap afrondt en wat nog openstaat

**Afgerond in deze werkeenheid:** de normalisatievolgorde, het factoruitkomstcontract, de expliciete inputstatussen, het ontbreken-van-data-contract, overlapregels en de minimale onafhankelijke baselinevergelijking zijn concreet vastgelegd. Dit is een ontwerp-/documentatiestap, geen code-implementatie of biologische validatie.

**Nog open voor Fase 2:**
1. De relevante primaire bronnen en parametergrenzen per soort/levensfase blijven beoordelen; geen bron is momenteel numeriek goedgekeurd.
2. Vaststellen welke directe biologische labels realistisch beschikbaar kunnen komen en welke responsen niet lokaal observeerbaar zijn. De huidige sessiedata zijn geen directe voedingslabels.
3. Het evaluatieprotocol concretiseren met beschikbare dataset-/labelinventaris en vooraf vastgelegde evaluatievensters; zonder directe labels kan de biologische kandidaat niet onafhankelijk worden gevalideerd.
4. Een afzonderlijke tijdvakrespons ontwerpen zodra passende tijdgebonden voedings-/activiteitslabels beschikbaar zijn.
5. Het optionele hengel-/methodepresetbesluit blijft een aparte UX/productkeuze en mag geen verplichte registratie worden.

Geen applicatiecode, score, gebruikersdata, database, temperatuurcurve, parameter, gewicht of gebruikersflow gewijzigd. Fase 2 blijft niet geaccepteerd; Fase 3 blijft geblokkeerd.


## 172. Audit bestaande lokale labels — wat kan werkelijk biologische respons meten? (21 november 2026)

**Doel:** de in §171 vereiste labelbeschikbaarheid concreet toetsen aan het huidige typeschema en de daadwerkelijke invoerflow. Dit is een read-only code-audit; er zijn geen data, UI of runtimeberekeningen gewijzigd.

### 172.1 Bevindingen per bestaande gegevensbron

| Bestaand veld / event | Wat wordt daadwerkelijk vastgelegd? | Wat mag het onderbouwen? | Wat mag het niet onderbouwen? |
|---|---|---|---|
| `WaterTemperatureMeasurement[]` | Afzonderlijke fysieke watertemperatuurmetingen met meettijd, registratietijd, methode, optionele meetdiepte en beschikbare weerscontext | Lokale temperatuurinput en latere validatie van de watertemperatuurschatter | Visactiviteit, voedselopname of vangstmoment |
| `FishingSession.presenceObservations` | Een sessiebrede lijst met categorieën zoals springen/rollen, aasbellen/bodemwoeling, recente vangst op stek en geen waarnemingen | Kwalitatieve, sessiebrede aanwezigheid-/activiteitscontext | Kwantitatieve voedselopname, exacte tijdvakrespons of bewezen afwezigheid |
| `FishingSession.bitesCount` / `missedCount` | Geaggregeerde sessietotalen zonder tijdstip per gebeurtenis | Algemene sessie-/vangbaarheidscontext, indien volledig en vergelijkbaar | Verdeling over dagdelen of directe voedselopname |
| `CatchItem` | Soort, aantal, sessie, optioneel gewicht/lengte en tijdstip; tijdstipherkomst kan automatic of user_adjusted zijn | Vangstuitkomst en, onder strikte kwaliteitsfilters, beschrijvende vangsttijd-/vangbaarheidsanalyse | Directe voedingsactiviteit of een gegarandeerd exact biologisch gebeurtenismoment |
| `SessionRodEvent` | Hengelgebonden aanbeet/gemist/vangst/overig met tijdstempel en optionele timestampEntryMode | Tijdgebonden hengelinteractie en vangbaarheid, wanneer expliciet en betrouwbaar geregistreerd | Voedselopname of biologische activiteit onafhankelijk van presentatie en hengelinzet |
| `RodActiveInterval[]` | Expliciete actieve inzet per hengel | Blootstellingsduur en exposure-aware vangst-/aanbeetfrequentie | Biologische activiteit zonder hengelinteractie |
| `FishingSession.outcome` | Catch, bevestigde nulvangst, actief of onbekend | Persoonlijke vangstkans bij vergelijkbare, geldige sessies | Biologische inactiviteit of niet eten bij een nulvangst |

### 172.2 Kritische details uit de invoerflow

**Aanwezigheidsobservaties:** `SessionModal` bewaart de selectie als `PresenceObservationType[]` op sessieniveau. De invoerflow registreert geen afzonderlijk tijdstip, duur, frequentie, intensiteit, waarnemer of verificatiemethode per observatie. De categorie `aasbellen_voedselactiviteit` is een kwalitatief visueel signaal (aasbellen/bodemwoeling), niet een directe meting van geconsumeerd voedsel. De categorie `geen_waarnemingen` betekent alleen dat de gebruiker niets heeft waargenomen; zij bewijst geen afwezigheid of inactiviteit.

**Vangsttijdstippen:** `CatchModal` vult het tijdstip bij openen automatisch in. De provenance-helper markeert dit als automatisch tenzij de gebruiker het tijdstip aanpast. `timeSlotCatchEvidenceAudit` sluit automatische, legacy-onbekende, ongeclassificeerde en buiten-sessie tijdstippen uit van tijdvakpositieven. Een handmatig aangepast tijdstip is nog steeds een door de gebruiker gerapporteerd vangstmoment, geen onafhankelijke sensorverificatie. Groepsvangsten kunnen bovendien meerdere vissen in één registratie bundelen.

**Hengelgebeurtenissen en blootstelling:** `SessionRodEvent` en `RodActiveInterval` zijn optioneel. De bestaande effort-engine telt alleen expliciet geregistreerde, geldige actieve intervallen; een ontbrekend interval is onbekende inzet en geen nul uur. Tijdvakvangst-audit gebruikt deze blootstelling beschrijvend en zet ontbrekende vangsten in een tijdvak niet om naar een nulrespons. Dit is correct voor vangbaarheid, maar levert geen biologische voedingslabels op.

**Watertemperatuur:** de nieuwe meetevents verbeteren de lokale predictor- en schattervalidatie. Zij leveren geen responslabel voor visactiviteit of voedselopname. De gekoppelde Open-Meteo-context blijft modeldata en geen directe lokale weerwaarneming.

### 172.3 Wat de huidige dataset retrospectief wel en niet kan evalueren

**Wel, onder de bestaande kwaliteitsfilters:**
- watertemperatuurschatting tegenover latere fysieke meetevents, met aandacht voor meetdiepte, meetmethode, bron, meettijd en forecast-as-of;
- persoonlijke vangstkans tegenover afgeronde, vergelijkbare sessie-uitkomsten;
- beschrijvende hengelvangbaarheid per tijdvak wanneer expliciete hengeluren en betrouwbare, user-adjusted vangst-/hengelgebeurtenissen aanwezig zijn;
- kwalitatieve aanwezigheidssignalen als afzonderlijke context, zonder numerieke responsclaim.

**Niet met de huidige velden:**
- fysiologische activiteit als directe respons;
- hoeveelheid/snelheid van voedselopname;
- een gevalideerde soortspecifieke tijdvakverdeling van voedselopname;
- habitat-aanwezigheid als onafhankelijk gelabelde uitkomst op voldoende schaal;
- causale effecten van aas, voer, techniek of hengelconfiguratie.

De belangrijkste datagrens is daarmee niet het aantal sessies op zich, maar het ontbreken van passende responslabels. Meer vangstregistraties verhogen de waarde van de persoonlijke vangstkans- en vangbaarheidslaag, maar lossen het ontbreken van directe voedingslabels niet automatisch op.

### 172.4 Labelhaalbaarheid en veilige vervolgstap

Er zijn drie gescheiden routes:
1. **Bestaande data benutten zonder nieuwe invoer:** bouw de chronologische evaluatie van temperatuurvoorspelling en persoonlijke vangstkans verder uit; gebruik tijdvakvangst uitsluitend als vangbaarheidsanalyse met expliciete blootstelling.
2. **Bestaande kwalitatieve observaties begrensd gebruiken:** `aasbellen_voedselactiviteit` kan als sessiebrede, subjectieve observatie worden onderzocht in een aparte kwalitatieve analyse. Zonder tijdstip, intensiteit en verificatie is het geen numeriek label en geen tijdvaklabel. `vis_springen_rollen` blijft beweging; `recente_vangst_stek` blijft historische aanwezigheid; `geen_waarnemingen` blijft geen waargenomen signaal.
3. **Toekomstige directe biologische labels:** een optionele, expliciet tijdgebonden waarneming van daadwerkelijk voedings-/foerageergedrag zou de labeldekking kunnen verbeteren. Dit vraagt een afzonderlijk productbesluit over definitie, minimale invoer, betrouwbaarheid en gebruikersfrictie. Er wordt nu geen veld, verplichting of nieuwe UI voorgesteld of toegevoegd.

**Conclusie:** met de huidige lokale velden kan de biologische 1–10-doelrespons niet onafhankelijk worden gevalideerd. De bestaande data zijn wel bruikbaar voor temperatuurvoorspelling, persoonlijke vangstkans, kwalitatieve context en exposure-aware vangbaarheid, mits die responsen gescheiden blijven. Er is geen reden om vangsten, aanbeten of aasbellen achteraf als kwantitatieve voedselopname te herlabelen.

Geen applicatiecode, database, historische gebruikersdata, score, gewicht of gebruikersflow gewijzigd. Fase 2 blijft open; Fase 3 blijft geblokkeerd. Volgende stap: maak per respons een concrete evaluatie-/labelmatrix met beschikbare aantallen en kwaliteitsfilters, en scheid daarin wat nu uitvoerbaar is van wat pas na toekomstige optionele waarnemingen kan worden gevalideerd.


## 173. Respons- en evaluatiematrix op basis van bestaande labels (21 november 2026)

**Doel:** per respons vastleggen wat de bestaande app-data daadwerkelijk kunnen toetsen, welke kwaliteitsfilters nodig zijn, welke metric passend is en welke biologische claims buiten bereik blijven. Dit is een documentatie-/ontwerpstap op basis van de code-inspecties in §172 en de bestaande evaluatie-engine; er worden geen nieuwe labels, scoreberekeningen of runtimepaden geactiveerd.

### 173.1 Matrix

| Respons / evaluatiedoel | Beschikbare labelbron | Minimale kwaliteitsfilters en vergelijkbaarheid | Passende evaluatie | Haalbaarheid met huidige app-data |
|---|---|---|---|---|
| Watertemperatuurvoorspelling | WaterTemperatureMeasurement[] met fysieke temperatuur, measuredAt, bron/methode, optionele meetdiepte en gekoppelde weerscontext | Alleen fysieke, geldige metingen; behoud meettijd en registratietijd; vergelijk dezelfde locatie-/watercontext en waar bekend dezelfde meetdiepte; voorspelling/snapshot moet vóór measuredAt beschikbaar zijn; geen latere forecast of meting als input teruglekken | MAE, RMSE en gemiddelde bias tussen vooraf vastgelegde voorspelling en latere meting; rapporteer aantallen, meetdekking en segmenten naar meetmethode, diepte, bron en tijdsafstand | **Beperkt uitvoerbaar via de huidige snapshotroute.** De huidige evaluatie koppelt één scalaire sessiemeting aan één sessiestartsnapshot; afzonderlijke meetevents uit WaterTemperatureMeasurement[] worden wel verzameld voor historische temperatuurprofielen, maar niet elk als eigen forecast-meetpaar geëvalueerd. Bovendien controleert de bestaande pair-filter dat de forecast vóór de meting ligt en op dezelfde lokale datum valt, maar niet dat het voorspelde targettijdstip exact overeenkomt met measuredAt. Dit valideert dus nog geen volledige meervoudige meetreeks of tijdstipnauwkeurige voorspelling; zie §174. |
| Persoonlijke vangstkans | Immutable PrognosisSnapshot met predictedCatchChance en gekoppelde afgeronde FishingSession.outcome | Alleen actuele modelversie voor de voorspelde kans; voorspelling vóór sessiestart; afgeronde en gekoppelde sessie; bekende catch/skunk-uitkomst; doelsoort gelijk; voorspelde duur en tijdvenster moeten overeenkomen; benchmark, duplicaten, ongeldige koppelingen en onvolledige sessies uitsluiten. Per sessie/doelsoort telt de vroegste voorspelling | Brier-score en kalibratiebins; Brier Skill Score uitsluitend tegen de bestaande chronologische rolling baseline op exact dezelfde testgevallen | **Ja, beperkt en al technisch ondersteund.** De huidige engine toont Brier pas vanaf 5 geëvalueerde voorspellingen; voor BSS zijn per testvoorspelling minimaal 5 eerdere uitkomsten van dezelfde soort nodig en minimaal 5 vergelijkbare testgevallen met baseline. Dit zijn softwaredrempels, geen bewijs van statistische robuustheid |
| Vangbaarheid per tijdvak | User-adjusted vangsttijdstippen en expliciet geregistreerde RodActiveInterval[]; waar betrouwbaar beschikbaar tijdgestempelde hengelgebeurtenissen | Alleen afgeronde, geldige sessies met één doelsoort; bevestigde nulvangst alleen als expliciete nuluitkomst; geen automatische/legacy-onbekende/ongeclassificeerde vangsttijden; tijdstip binnen sessie; expliciete geldige hengelblootstelling per tijdvak; groepsvangsten en ontbrekende hengelinzet afzonderlijk markeren | Beschrijvende vangsten-/aanbetenfrequentie per geregistreerd hengeluur en tijdvak, met aantallen sessies, hengeluren en onzekerheid naast de uitkomst. Geen rangschikking of tijdvakscore zonder voldoende onafhankelijke waarnemingen en passende labels | **Gedeeltelijk.** Bruikbaar als persoonlijke vangbaarheidsanalyse onder expliciete blootstelling. Een vangst is een uitkomst van vis, aas, presentatie, locatie en hengelinzet samen; geen directe maat voor biologische activiteit of voedselopname |
| Kwalitatieve aanwezigheid-/activiteitssignalen | FishingSession.presenceObservations | Sessieniveau behouden; categorie en betekenis afzonderlijk houden; geen_waarnemingen niet als negatieve waarneming coderen; aasbellen/bodemwoeling niet als geconsumeerde hoeveelheid behandelen; geen tijdvaktoewijzing zonder tijdstempel | Alleen frequenties en contextbeschrijving per observatiecategorie; geen numerieke responsmetric of trainingslabel | **Ja, uitsluitend kwalitatief.** Niet geschikt als kwantitatief, tijdgebonden of onafhankelijk geverifieerd biologisch label |
| Fysiologische activiteit / totale biologische activiteit | Geen directe lokale responsmeting in huidige sessievelden; bestaande thermische prior is predictor-/mechanistische uitgangswaarde | Een geldig label moet de bedoelde biologische respons rechtstreeks meten en qua soort, levensfase, tijdstip en context passen. Vangsten, aanbeten, aanwezigheidssignalen en temperatuurmetingen mogen dit label niet vervangen | Alleen na beschikbaarheid van passende directe labels: vooraf vastgelegde fout- en kalibratiematen voor de gekozen respons; vergelijken met bevroren optie-A-thermische baseline | **Nee, niet onafhankelijk valideerbaar met huidige lokale labels.** Optie A blijft een voorlopige prior, geen gevalideerde biologische activiteitsindex |
| Voedselopname / voedingsintensiteit | Geen lokale directe meting van hoeveelheid of snelheid van voedselopname | Directe observatie-/meetmethode moet daadwerkelijk voedselopname meten; soort, levensfase, dieet/voedseltype, habitat en tijdsresolutie moeten passen. Literatuurregistraties blijven broncontext zolang niet expliciet toegelaten | Responsgebonden foutmaten op directe opname-/rantsoenlabels; bron-/populatie- en levensfasegescheiden rapportage | **Nee, niet met huidige lokale sessievelden.** Aasbellen, aanbeten en vangsten zijn geen kwantitatieve opname |
| Voedingsritme / biologische tijdvakrespons | Geen lokale directe tijdgebonden voedingslabels. User-adjusted vangsttijden zijn vangbaarheidsuitkomsten | Directe voedingswaarneming met eigen tijdstip en voldoende tijdsresolutie; observaties moeten onafhankelijk zijn van hengelinzet en vangstregistratie; dagbrede labels niet kunstmatig over tijdvakken verdelen | Tijdvakrespons alleen evalueren op directe tijdvaklabels; rapporteer per tijdvak aantallen en onzekerheid. Geen winnaar kiezen bij onvoldoende dekking | **Nee, niet met huidige lokale labels.** Vangsttijdvakken kunnen alleen vangbaarheid beschrijven |
| Foerageergedrag, habitatgebruik en beweging | Literatuurregister per gemeten uitkomst; lokale sessieobservaties zoals springen/rollen en recente vangst op stek | Beweging, habitatgebruik, foerageren en voedselopname blijven afzonderlijke responsfamilies. Lokale observaties missen vaak tijdstip, duur, intensiteit en onafhankelijke verificatie | Kwalitatieve bron-/observatiebeschrijving; een kwantitatieve validatiemetric pas wanneer een bijpassend onafhankelijk lokaal label bestaat | **Alleen contextueel.** Huidige waarnemingen valideren geen onafhankelijke habitat-aanwezigheidskans of voedingsrespons |

### 173.2 Wat aantallen en datadekking betreft

De actuele steekproefomvang per respons, soort, stek, seizoen of tijdvak is in deze repository-audit **niet vastgesteld**. De relevante persoonlijke gegevens staan in de lokale IndexedDB van het apparaat en zijn niet via de GitHub-repository uit te lezen. De vastgelegde clean-startafspraak betekent bovendien dat de nieuwe persoonlijke meetreeks vanaf nul wordt opgebouwd. Daarom worden hier geen sessieaantallen, meetaantallen, dekkingpercentages of statistische power verondersteld.

De softwarematige minimumdrempels in evaluationEngine.ts (minimaal vijf geëvalueerde voorspellingen voor Brier-weergave; minimaal vijf eerdere uitkomsten per doelsoort voor iedere rolling-baselinevoorspelling; minimaal vijf vergelijkbare testgevallen voor BSS) zijn uitsluitend bestaande implementatieregels. Ze mogen niet worden gepresenteerd als voldoende steekproef voor wetenschappelijke acceptatie.

### 173.3 Evaluatievolgorde en datalekpreventie

1. Begin met temperatuurvoorspellingsvalidatie zodra er voldoende echte meetevents én vooraf vastgelegde voorspellingen zijn. Controleer per meting dat de voorspelling op het meetmoment beschikbaar was en dat geen toekomstinformatie is gebruikt.
2. Beoordeel persoonlijke vangstkans apart met de bestaande snapshot-/sessiekoppeling en de bestaande uitsluitingsregels. Gebruik Brier/BSS uitsluitend voor deze kansrespons.
3. Gebruik tijdvakvangstdata uitsluitend beschrijvend voor vangbaarheid, met expliciete hengeluren en timestamp-provenance. Een ontbrekend tijdvakrecord is geen nulvangstlabel.
4. Houd kwalitatieve aanwezigheidssignalen apart; maak er geen numerieke labels van.
5. Laat fysiologische activiteit, voedselopname en biologisch voedingsritme op **niet evalueerbaar met huidige lokale labels** staan totdat passende directe labels beschikbaar zijn. Een optionele toekomstige invoer is een afzonderlijk productbesluit; geen verplichte velden toevoegen.
6. Bevries voor iedere toekomstige modelvergelijking de baseline en definieer respons, uitsluitingen, meetvenster en metric vooraf. Rapporteer ontbrekende labels, aantallen en negatieve resultaten; leer of wijzig geen gewichten automatisch.

### 173.4 Besluit en vervolg

Deze matrix sluit de inventarisatie van de huidige labelbetekenis en de keuze van passende evaluatiemethoden af. Zij levert nog geen daadwerkelijke evaluatiescore op: daarvoor ontbreken de lokaal opgeslagen data in deze GitHub-omgeving en voor de biologische doelrespons ontbreken directe lokale labels.

**Vervolg binnen Fase 2:** werk de uitvoerbare temperatuur- en persoonlijke-vangkansvalidatie verder uit tegen de bestaande snapshots/meetevents en hun kwaliteitsfilters, zonder lokale gebruikersdata te claimen of te wijzigen. De biologische activiteit-/voedingsrespons blijft geblokkeerd op directe labels. Eerstvolgende concrete technische controle is vaststellen of de bestaande temperatuurmeetevents en immutable prognosesnapshots via de huidige opslag-/evaluatieketen chronologisch één-op-één te koppelen zijn; alleen code en datacontract inspecteren, geen persoonlijke IndexedDB uitlezen of migreren.

Geen applicatiecode, database, lokale gebruikersdata, modelscore, temperatuurcurve, parameter, gewicht of gebruikersflow gewijzigd. Fase 2 blijft niet geaccepteerd; Fase 3 blijft geblokkeerd.


## 174. Read-only controle temperatuurmeetevents ↔ prognosesnapshots (21 november 2026)

**Doel:** de in §173 genoemde bestaande temperatuurvalidatieroute controleren op één-op-één-koppeling, meerdere meetevents per sessie en chronologische tijdsvergelijkbaarheid. Alleen code en datacontract zijn geïnspecteerd; geen lokale IndexedDB, gebruikersdata of runtime is benaderd of gewijzigd.

### 174.1 Wat de code nu vastlegt

- PrognosisSnapshot bevat één predictedWaterTemperature en één set actualWaterTemperature-velden (waarde, meettijd, bron, methode en optionele meetdiepte). De voorspelde waarde wordt alleen gevuld wanneer de vooraf opgeslagen prognose een modelschatting had en geen gemeten watertemperatuur gebruikte.
- FishingSession bevat waterTemperatureMeasurements[] met afzonderlijke events. collectHistoricalWaterTemperatureObservations() neemt alle geldige events mee in de historische temperatuurprofielverzameling. Als er events zijn, slaat de collector de legacy scalaire sessiemeting over om dezelfde sessie niet dubbel in het profiel te tellen.
- De bestaande autoSyncSessionOutcomeToSnapshot() leest voor de snapshot-evaluatie echter de scalaire session.waterTemperature en de bijbehorende scalaire tijd-/bron-/methodevelden. De functie maakt niet voor elk event uit waterTemperatureMeasurements[] een afzonderlijk voorspelling-meetpaar.
- De bestaande validTemperaturePairs() beoordeelt één opgeslagen voorspelde/werkelijke waarde per snapshot. De filters vereisen een geldige voorspelling en meting, bron/methode, locatie en sessiekoppeling, een forecastTimestamp vóór de meting en dezelfde Amsterdamse kalenderdatum. De filter controleert niet expliciet of het thermische targetTimestamp van de voorspelling overeenkomt met het fysieke measuredAt-tijdstip.
- evaluateWaterTemperaturePerformance() rapporteert MAE, RMSE en bias en markeert de software-uitkomst als voldoende vanaf vijf paren. De bestaande lokale biaskalibratie gebruikt een strengere drempel: minimaal acht geldige paren op dezelfde stek en in hetzelfde seizoen. Dit zijn technische drempels, geen wetenschappelijke acceptatiecriteria.

### 174.2 Gevolg voor de evaluatiematrix

1. De registratie van meerdere metingen per sessie is technisch aanwezig en de events kunnen de historische temperatuurprofielen voeden.
2. De bestaande onafhankelijke evaluatie gebruikt nog niet alle afzonderlijke meetevents. De huidige route kan hoogstens de scalaire samenvatting aan de gekoppelde sessiestartsnapshot toetsen.
3. Een meting later op dezelfde dag kan volgens de huidige filter als paar worden geaccepteerd zolang de forecast eerder is; exacte overeenkomst van voorspeld doelmoment en meetmoment wordt niet afgedwongen. Daardoor moet tijdstipnauwkeurigheid eerst worden onderzocht voordat deze paren als nauwkeurige uur-/tijdvakvalidatie worden geïnterpreteerd.
4. Een enkele sessiestartsnapshot is niet automatisch een passende voorspelling voor ieder later meetevent in dezelfde sessie. Een meetevent mag alleen tegen een voorspelling worden geëvalueerd waarvan het doelmoment en de beschikbare informatie aantoonbaar vergelijkbaar zijn.
5. De temperatuurvalidatie uit §173 blijft daarom beperkt tot de huidige snapshotparen; meervoudige eventvalidatie en exacte doelmomentmatching zijn nog niet aangetoond.

### 174.3 Afbakening en vervolg

Dit is een code-auditbevinding, geen opdracht om de bestaande snapshotstructuur of evaluatie-engine nu te wijzigen. De volgende technische stap is een voorstel opstellen voor een veilige evaluatiekoppeling: welke bestaande snapshot-/thermalAnalysis-velden het doelmoment vastleggen, hoe events aan uitsluitend voorafgaande passende voorspellingen worden gekoppeld, hoe één fysiek meetevent dubbel tellen voorkomt en hoe legacy scalaire metingen compatibel blijven.

Voor dat voorstel geldt:
- geen nieuwe verplichte invoer;
- geen wijziging aan bestaande temperatuurbanden, scores of gewichten;
- geen overschrijven van snapshots of historische events;
- geen automatische keuze van een later meetevent als vervanging van een eerdere meting;
- eerst een read-only test-/datacontractontwerp en review, daarna pas eventuele implementatie.

Geen runtimecode, database, lokale gebruikersdata, meetevents of bestaande prognose-uitkomsten gewijzigd. Fase 2 blijft niet geaccepteerd; Fase 3 blijft geblokkeerd.


## 175. Ontwerp veilige event-naar-snapshot-evaluatiekoppeling (21 november 2026)

**Status: ontwerpvoorstel, read-only.** Dit hoofdstuk legt vast hoe meerdere fysieke temperatuurmeetevents in beginsel geëvalueerd kunnen worden zonder bestaande snapshots te overschrijven, zonder toekomstinformatie en zonder één sessie kunstmatig als meerdere onafhankelijke vissessies te tellen. Het is geen goedkeuring of opdracht tot implementatie.

### 175.1 Bestaande gegevens waarop het ontwerp aansluit

- Een meetevent heeft een eigen WaterTemperatureMeasurement.id, measuredAt, recordedAt, locatie (optioneel, anders sessielocatie), temperatuur, meetbron, methode en optionele meetdiepte.
- Een snapshot bewaart de onveranderlijke prognose, forecastTimestamp, locationId, linkedSessionId, predictedWaterTemperature en de volledige prognosisData. De thermische analyse bevat velden targetTimestamp en forecastAsOf, maar targetTimestamp is optioneel en is bij de huidige sessiestart-/sessie-updateberekening doorgaans null; de aanwezigheid van het veld in het type garandeert dus geen bruikbaar doelmoment.
- De huidige sessie-evaluatie gebruikt de sessiebrede scalaire samenvatting (waterTemperature en bijbehorende velden) en schrijft die ene uitkomst naar de snapshot. Zij loopt niet door de afzonderlijke event-array.
- De historische temperatuurprofielcollector verwerkt wel alle geldige eventrecords. Als de event-array niet leeg is, gebruikt hij de legacy scalaire sessiemeting niet nogmaals.

### 175.2 Voorgestelde evaluatie-eenheid

Gebruik voor de uitgebreide evaluatie een afgeleid, read-only paar; sla dit paar niet terug in de bestaande PrognosisSnapshot:

- sessionId
- measurementId (unieke event-ID)
- snapshotId
- locationId
- measuredAt en recordedAt
- predictedAt (forecastTimestamp)
- targetTimestamp uit de bevroren prognosisData.thermalAnalysis
- voorspelde en gemeten temperatuur
- meetbron, meetmethode, meetdiepte
- model-/engineversies en eventuele uitsluitreden

Hiermee blijft de oorspronkelijke voorspelling onveranderd en is ieder evaluatieresultaat herleidbaar tot de twee oorspronkelijke records.

### 175.3 Harde toelatingsregels voor een paar

Een event mag alleen kandidaat zijn wanneer:
1. de event-ID aanwezig en uniek is binnen de sessie;
2. de temperatuur numeriek, eindig en binnen de bestaande plausibiliteitsgrens 0–35 °C ligt;
3. measuredAt parseerbaar is en niet later ligt dan recordedAt of het huidige evaluatiemoment;
4. bron en methode bekend en toegelaten zijn volgens de bestaande validatiefilters (manual/imported en thermometer/probe/other);
5. het event een geldige eigen locatie heeft of aantoonbaar de sessielocatie erft;
6. de sessie niet als benchmark is gemarkeerd.

Een snapshot mag alleen kandidaat zijn wanneer:
1. de snapshot expliciet aan dezelfde sessie is gekoppeld (linkedSessionId gelijk aan session.id) en dezelfde locatiecontext heeft;
2. predictedWaterTemperature een eindige modelschatting is; snapshots met gemeten/ontbrekende temperatuur als voorspelling tellen niet mee;
3. forecastTimestamp parseerbaar is en strikt vóór measuredAt ligt;
4. forecastAsOf uit de opgeslagen thermische analyse niet ná het prognoseberekeningstijdstip ligt;
5. targetTimestamp expliciet aanwezig en parseerbaar is. Een ontbrekend doelmoment mag niet worden vervangen door alleen dezelfde kalenderdag of door het sessiestartmoment.

**Doelmomentmatching blijft een open parameterbesluit.** De code bewaart targetTimestamp, maar er is geen door de bestaande roadmap of broncode onderbouwde toegestane tijdsafstand tussen targetTimestamp en measuredAt vastgesteld. Daarom wordt hier geen willekeurige tolerantie (bijvoorbeeld 30, 60 of 120 minuten) gekozen. Zonder vooraf goedgekeurde tolerantie is alleen een exact tijdstipmatch ondubbelzinnig; als dat voor de echte invoerpraktijk te streng blijkt, moet de eigenaar eerst een onderbouwde maximale tijdsafstand vaststellen. Geen match op alleen dezelfde datum.

### 175.4 Eén-op-één-toewijzing en dubbeltelling

- Eén fysiek event (measurementId) mag maximaal één keer in de evaluatie voorkomen.
- Eén voorspelling (snapshotId) mag maximaal één event valideren. Een snapshot is één voorspelling op één doelmoment en mag niet worden hergebruikt voor meerdere meetmomenten.
- Als meerdere kandidaten overblijven, kies niet stilzwijgend de eerste of dichtstbijzijnde. Markeer het event als ambigu en sluit het uit totdat een deterministische, vooraf goedgekeurde tie-breakregel bestaat.
- Als waterTemperatureMeasurements één of meer events bevat, wordt de scalaire sessiesamenvatting niet daarnaast als tweede meting geteld. De collector past dit principe al toe.
- Als de event-array ontbreekt of leeg is, blijft de bestaande legacy scalaire route afzonderlijk herkenbaar en ongewijzigd; legacywaarden worden niet kunstmatig omgezet naar event-ID's.
- Meerdere meetevents uit één sessie zijn meerdere meetmomenten, maar geen meerdere onafhankelijke sessies. Rapporteer daarom zowel het aantal eventparen als het aantal unieke sessies; gebruik sessieclusters bij onzekerheidsanalyse en laat één sessie niet automatisch zwaarder wegen in modelacceptatie.

### 175.5 Scheiding tussen evaluatie en kalibratie

De eerste implementatie, als die later wordt goedgekeurd, moet eventniveau-MAE/RMSE/bias als aparte evaluatie-uitkomst rapporteren. Gebruik deze nieuwe eventparen niet automatisch voor de bestaande lokale biascorrectie. De bestaande kalibratie is opgezet op snapshotparen en minimaal acht paren per stek/seizoen; meerdere meetmomenten uit één sessie kunnen die telling kunstmatig verhogen en zijn onderling afhankelijk. Een eventuele uitbreiding van kalibratie vereist een aparte analyse op onafhankelijke sessies, met vooraf vastgelegde weging en rolling-origin-validatie. Bestaande correcties, curves en gewichten blijven onaangeroerd.

### 175.6 Testgevallen die vóór implementatie nodig zijn

1. Eén sessie met drie geldige events en drie verschillende passende voorspellingen: drie unieke paren.
2. Eén event met twee even passende snapshots: ambigu, geen paar.
3. Eén snapshot die voor twee events kandidaat is: maximaal één toewijzing; tweede event blijft ongekoppeld.
4. Snapshot berekend ná het fysieke meetmoment: uitgesloten (future leakage).
5. targetTimestamp ontbreekt of valt buiten de later goedgekeurde tijdstolerantie: uitgesloten.
6. Event-ID dubbel binnen één sessie: beide verdachte records uitsluiten of conflict expliciet rapporteren; nooit stilzwijgend dedupliceren op temperatuurwaarde.
7. Event-array gevuld plus legacy scalaire samenvatting: alleen eventrecords tellen.
8. Event-array leeg met een geldige legacy scalaire meting: bestaande legacyroute blijft werken.
9. Andere locatie, benchmark, onbekende meetbron/methode, ongeldige datum of onmogelijke temperatuur: uitgesloten met reden.
10. Twee events uit dezelfde sessie: rapportage toont twee eventparen maar één unieke sessie.

### 175.7 Besluit en vervolgstap

De architectuur biedt genoeg metadata om de risico's en gewenste koppelregels te ontwerpen, maar de huidige opgeslagen sessiesnapshots bevatten niet consequent een bruikbaar doelmoment. Naast de open tijdtolerantie ontbreekt dus een expliciet opgeslagen voorspelling voor het meetmoment. Zie §176. Dit is geen detail dat met een ruimere matchingtolerantie kan worden opgelost. Ik kies die niet namens de eigenaar en voer geen implementatie uit.

Vervolg: controleer de precieze herkomst en semantiek van prognosisData.thermalAnalysis.targetTimestamp voor de sessiestart- en sessie-updateprognoses en leg daarna een voorstel voor de tijdtolerantie voor. Pas na expliciete goedkeuring kan de implementatie worden voorbereid. Geen runtimecode, schema, IndexedDB, gebruikersdata, snapshots, temperatuurcurves, scores, parameters of gewichten gewijzigd. Fase 2 blijft niet geaccepteerd; Fase 3 blijft geblokkeerd.


## 176. Semantiek en persistente beschikbaarheid van thermisch doelmoment (21 november 2026)

**Status: read-only codecontrole.** Dit hoofdstuk controleert of de in §175 vereiste doelmomentinformatie daadwerkelijk wordt opgeslagen voor sessiestart- en sessie-updateprognoses.

### 176.1 Vastgestelde engine-semantiek

- In waterThermalEngine wordt targetTimestamp alleen gevuld wanneer de caller expliciet een geldige targetTime doorgeeft. Zonder expliciet targetTime blijft targetTimestamp null, ook wanneer de engine intern voor de berekening een referentietijd gebruikt (bijvoorbeeld currentDateRef voor vandaag).
- De algemene thermalAnalysis in calculateDayPrognosis wordt aangeroepen zonder targetTime. De sessiestartflow geeft wel currentDateRef en forecastAsOf door, maar geen expliciete targetTime voor deze algemene thermische analyse.
- De sessie-updateflow gebruikt dezelfde algemene prognose-engine. De snapshot bewaart de resulterende prognosisData.thermalAnalysis, waarvan targetTimestamp daardoor niet als exact sessiedoelmoment kan worden beschouwd.
- De engine berekent daarnaast binnen de vier tijdvakanalyses een representatief slotTargetTime (mediaan van de beschikbare uurlijkse weersvoorspellingen in dat tijdvak) en voert daarmee een afzonderlijke thermische analyse uit. Die thermische analyse wordt gebruikt tijdens de tijdvakberekening, maar TimeSlotAnalysis bewaart geen eigen WaterThermalAnalysis-object of targetTimestamp. De exacte tijdvaktemperatuurschatting is dus niet terug te halen uit het opgeslagen TimeSlotAnalysis-contract.
- PrognosisSnapshot bewaart wel targetWindowStart/targetWindowEnd en targetSlot, maar deze beschrijven het sessie-/adviesvenster en zijn geen vervanging voor het exacte thermische target waarop predictedWaterTemperature is berekend.

### 176.2 Gevolg

De huidige snapshot bevat een voorspelde watertemperatuur, maar bij sessiestart en sessie-update geen gegarandeerd expliciet doelmoment dat die voorspelde waarde aan een fysiek meetmoment koppelt. forecastTimestamp en targetWindowStart mogen niet als targetTimestamp worden hernoemd: het zijn andere tijdsbegrippen.

Daarom kan een event uit waterTemperatureMeasurements[] op dit moment niet betrouwbaar aan de bestaande predictedWaterTemperature worden gekoppeld op basis van uitsluitend de huidige persistente snapshotvelden. Exacte matching of een tijdtolerantie zou schijnprecisie geven zolang de voorspelling zelf geen expliciet vastgelegd doelmoment heeft.

### 176.3 Benodigde ontwerpkeuze vóór implementatie

Een eventuele implementatie moet eerst één van deze expliciete routes kiezen en testen:

A. **Voorspelling op concreet meetdoelmoment:** de sessieprognose berekent en bewaart een thermische schatting voor een expliciet doelmoment dat al vóór de meting bekend is. De voorspelde waarde en het doelmoment worden samen immutable opgeslagen. Alleen een fysieke meting die binnen een later goedgekeurde meettolerantie bij dat doelmoment hoort, kan evalueren.

B. **Vooraf vastgelegde tijdvakvoorspellingen:** de prognose bewaart per relevant tijdvak de reeds berekende thermische schatting plus het exacte slotTargetTime. Een meetevent kan alleen tegen de voorspelling van het bijbehorende tijdvak worden geëvalueerd, met expliciete controle op forecastTimestamp, targetTimestamp en meetdiepte. De huidige TimeSlotAnalysis bewaart deze thermische detailuitkomst nog niet.

Deze routes zijn alternatieven, geen combinatie die nu stilzwijgend wordt ingevoerd. De keuze beïnvloedt opslagcontract, evaluatie-eenheid en teststrategie en vraagt daarom expliciete eigenaarbeoordeling. Er wordt geen nieuwe verplichte meetinvoer voorgesteld; de bestaande optionele metingen blijven optioneel.

### 176.4 Correctie op §175 en vervolg

§175 blijft geldig als gewenste kwaliteits- en dubbeltelregels, maar is nog geen direct implementeerbaar koppelcontract. De eerdere formulering dat de huidige snapshotmetadata een opgeslagen thermisch doelmoment bevat, moet worden gelezen als conditioneel: het veld bestaat, maar is voor de huidige sessiestart-/sessie-updateflow niet gegarandeerd gevuld.

Vervolg: vergelijk route A en B op minimale wijzigingsomvang, behoud van immutable snapshots, historische compatibiliteit, forecast-as-of en toetsbaarheid. Leg de afweging voor aan de eigenaar voordat runtimecode of opslagcontract wordt aangepast.

Geen code, schema, IndexedDB, gebruikersdata, snapshots, prognose-uitkomsten, temperatuurcurves, scores, parameters of gewichten gewijzigd. Fase 2 blijft niet geaccepteerd; Fase 3 blijft geblokkeerd.


## 177. Eigenaarbesluit route A — één concreet meetmoment per vissessie als normale werkwijze (21 november 2026)

**Besluit:** de eigenaar kiest route A: een thermische voorspelling voor één concreet meetdoelmoment. De praktische standaard is één optionele fysieke watertemperatuurmeting per vissessie. Meerdere metingen worden niet gevraagd of als normale werkwijze aanbevolen.

### 177.1 Praktische productgrens

- Eén meting per sessie is de normale, voldoende praktische invoer om gedurende langere tijd lokale temperatuurhistorie op te bouwen.
- De meting blijft optioneel; geen dagelijkse meetplicht en geen extra verplichte gebruikershandeling.
- Dit is een normale werkwijze, geen reden om bestaande meerdere meetevents te verwijderen, historische data te reduceren of de bestaande opslagstructuur hard op één event te begrenzen. Compatibiliteit en informatiebehoud blijven leidend.
- De bestaande meeteventreeks blijft de bron voor fysieke metingen. De scalaire sessievelden blijven uitsluitend compatibiliteitssamenvatting; dezelfde fysieke meting mag nooit ook als afzonderlijke scalaire waarneming worden meegeteld.

### 177.2 Gekozen voorspellingsroute

Voor ieder meetevent dat voor temperatuurvalidatie wordt gebruikt, moet één immutable voorspelling bestaan die vóór de fysieke meting is vastgelegd en op één expliciet doelmoment is berekend. De voorspelling bevat ten minste de bestaande predictedWaterTemperature, forecastTimestamp/forecastAsOf, expliciet targetTimestamp, locatie- en sessierelatie en modelprovenance. Het meetevent en de voorspelling worden één-op-één aan elkaar gekoppeld; een bestaande sessiestartsnapshot zonder gegarandeerd targetTimestamp is niet automatisch geschikt.

De voorspelling moet worden vastgelegd vóórdat de fysieke watertemperatuur wordt gemeten. Het later invoeren van een al gemeten temperatuur mag niet leiden tot een achteraf berekende voorspelling die als voorafgaand wordt behandeld. forecastTimestamp moet strikt vóór measuredAt liggen. De voorspelde waarde blijft immutable en mag niet worden overschreven door de fysieke meting.

De technische koppeling moet waar mogelijk verwijzen naar de bestaande immutable snapshot; kopieer de voorspelde temperatuur niet onnodig naar meerdere velden of tabellen. Eén meetevent gebruikt maximaal één snapshot en één snapshot maximaal één meetevent. Bij ontbrekende of ambigue koppeling wordt het paar uitgesloten met reden; er wordt niet gegokt.

### 177.3 Nog niet vastgelegde technische parameters

- De exacte workflow waarmee de voorspelling vóór het fysieke meetmoment wordt vastgelegd, moet worden gecontroleerd tegen de bestaande sessiestart- en meetinvoerflow. Er mag geen voorspelling worden gegenereerd op basis van de al ingevoerde gemeten temperatuur.
- De toegestane afstand tussen targetTimestamp en measuredAt blijft onbeslist. Er wordt geen willekeurige minutenmarge ingevoerd. De gekozen workflow moet een doelmoment opleveren dat in de praktijk bij het ene meetmoment past; als exacte tijdgelijkheid niet realistisch is, is een afzonderlijk onderbouwd tolerantiebesluit nodig.
- Een event zonder expliciete, vooraf vastgelegde voorspelling en passend doelmoment blijft bruikbare fysieke historie voor de bestaande temperatuurprofielen, maar telt niet mee als forecast-evaluatiepaar.
- Bestaande legacy scalaire evaluatie blijft compatibel en wordt niet dubbel geteld naast een eventpaar.

### 177.4 Afbakening en status

Route B (vier opgeslagen tijdvakvoorspellingen) wordt niet verder uitgewerkt of gecombineerd met route A. Er worden geen extra meetmomenten, verplichte invoervelden, nieuwe dagelijkse metingen of tweede temperatuur-engine toegevoegd.

Dit hoofdstuk legt het eigenaarbesluit en het minimale kwaliteitscontract vast. Het is nog geen runtime-implementatie: geen code, databasemigratie, gebruikersdata, bestaande snapshots, temperatuurcurves, scores, parameters of gewichten gewijzigd. Volgende stap: controleer de concrete meet-/sessiestartworkflow en werk de kleinste compatibele implementatie plus gerichte regressietests uit. Fase 2 blijft niet geaccepteerd; Fase 3 blijft geblokkeerd.


## 178. Concrete meetinvoerflow en onafhankelijkheid van de startsnapshot (21 november 2026)

**Status: read-only controle van de bestaande invoer- en opslagketen.** Dit hoofdstuk verfijnt route A op basis van de daadwerkelijke code.

### 178.1 Wat de huidige code doet

- `SessionModal` laat fysieke temperatuurmeetevents invoeren in hetzelfde formulier waarmee een nieuwe sessie wordt gestart.
- Bij het opslaan wordt de meest recente bruikbare meting doorgegeven aan `createLiveSnapshotForSessionStart` als `userWaterTemp` en `manualWaterTemperatureMeasurement`.
- `createLiveSnapshotForSessionStart` gebruikt deze waarde in `createManualWaterTemperatureInput` én als actuele meting voor `calculateDayPrognosis`. De thermische engine kan deze meting dus als huidig meetanker gebruiken.
- `savePrognosisSnapshot` slaat `predictedWaterTemperature` alleen op wanneer de prognose geen actuele gemeten watertemperatuur gebruikt. Bij een startsnapshot die met de zojuist ingevoerde fysieke meting is berekend, wordt `predictedWaterTemperature` daarom `null`; die snapshot vormt geen onafhankelijk temperatuurvoorspellingspaar.
- De sessie-startsnapshot wordt vóór de daadwerkelijke sessiestart berekend en aan de sessie gekoppeld via `session.snapshotId`. De bestaande sessie-uitkomstsynchronisatie gebruikt de scalaire sessietemperatuurvelden om de daadwerkelijke meting aan die snapshot toe te voegen. Bij één meting per sessie is deze bestaande relatie een mogelijke minimale koppeling; de eventreeks blijft de bronregistratie.

### 178.2 Consequentie voor route A

De meting die een forecast moet toetsen, mag niet vooraf in de startsnapshot worden ingevoerd. Voor een valide paar moet de volgorde zijn:
1. Bereken en bewaar de sessievoorspelling zonder de fysieke meetwaarde van diezelfde sessie.
2. Leg in die immutable snapshot een expliciet thermisch targetTimestamp vast dat bij het beoogde meetmoment hoort.
3. Start de sessie en voer de fysieke meting daarna in als afzonderlijk event.
4. Koppel de ene sessiemeting aan de bestaande startsnapshot; sla de voorspelling niet nogmaals op in het meetevent.
5. Laat evaluatie alleen toe als forecastTimestamp strikt vóór measuredAt ligt, targetTimestamp expliciet geldig is, locatie/sessie overeenkomen en het meetmoment binnen een later goedgekeurde tolerantie valt.

Als een gebruiker de temperatuur al heeft gemeten vóórdat de startsnapshot wordt berekend, mag die meting als fysieke historie worden bewaard, maar zij kan niet achteraf als onafhankelijke toets van die startsnapshot worden gebruikt. De bestaande guard die bij een actuele meetinput `predictedWaterTemperature=null` opslaat, voorkomt dat dit ten onrechte als geldig paar wordt geteld.

### 178.3 Afbakening en vervolg

De normale productwerkwijze blijft één optionele meting per sessie. De bestaande event-array en historische meerdere events blijven compatibel; er wordt geen harde één-event-databeperking ingevoerd. Er zijn geen code, schema, UI, gebruikersdata, snapshots, scores of temperatuurparameters gewijzigd.

Volgende technische stap: controleer de precieze `autoSyncSessionOutcomeToSnapshot`- en sessie-updateflow, bepaal hoe de bestaande startsnapshot een expliciet toekomstig meetdoelmoment kan bewaren zonder de forecast-as-of-regel te schenden, en voeg gerichte tests toe voor meting vóór/na snapshot, targetTimestamp, één-op-één-koppeling en legacygedrag. De tijdtolerantie blijft een afzonderlijk open besluit; geen marge verzinnen. Fase 2 blijft open; Fase 3 blijft geblokkeerd.


## 179. Eigenaarcorrectie: historische sessie-informatie is het leerdoel; meten blijft optioneel (21 november 2026)

**Status: productdoel verduidelijkt na read-only codecontrole.** De primaire bedoeling is dat de prognose vóór een toekomstige vissessie steeds beter gebruikmaakt van alle bruikbare informatie die al beschikbaar is uit eerdere sessies. De visser moet kunnen vissen. Een fysieke watertemperatuurmeting op de stek mag tijdens de sessie worden toegevoegd, maar is optioneel. Eén meting per sessie is een praktische normale mogelijkheid, geen verplichting of technische voorwaarde. Er komt geen dagelijkse meetplicht of meetprotocol.

### 179.1 Twee verschillende doelen die niet mogen worden vermengd

1. **Historische leer-/prognose-input:** eerdere sessies, hun geregistreerde omstandigheden en uitkomsten, plus geldige fysieke temperatuurmeetevents leveren informatie voor latere prognoses. Voor deze route hoeft een meting niet aan een vooraf opgeslagen prognosesnapshot of exact thermisch doelmoment gekoppeld te zijn. Een meting die tijdens een sessie wordt ingevoerd, blijft bruikbaar voor latere prognoses.
2. **Temperatuurvoorspellings-evaluatie:** om de fout van een eerdere temperatuurinschatting te berekenen en eventueel een lokale correctie toe te passen, is een betrouwbare voorafgaande schatting met een latere fysieke meting nodig. De strikte forecast-as-of-, snapshot- en doelmomentregels uit §§175–178 zijn uitsluitend kwaliteitsregels voor deze aparte evaluatieroute. Ze mogen het verzamelen of gebruiken van historische meetinformatie niet blokkeren.

Een meting die al bekend is bij het berekenen van dezelfde prognose mag uiteraard als actuele meetinput worden gebruikt. Die specifieke prognose is dan geen onafhankelijke schatting om met diezelfde meting te toetsen. De meting blijft wel geldige historie voor volgende prognoses.

### 179.2 Wat de huidige code aantoonbaar doet

- `collectHistoricalWaterTemperatureObservations` verzamelt geldige afzonderlijke meetevents uit `waterTemperatureMeasurements[]` en ondersteunt oudere scalaire sessiemetingen. Ook geldige snapshotmetingen worden opgenomen.
- `deriveHistoricalWaterTemperatureProfile` dedupliceert dezelfde fysieke meting, sluit metingen na de doeldag uit en gebruikt een lokale seizoens-/maandselectie. Het huidige profiel vraagt minimaal drie metingen op dezelfde stek; de terugval naar vergelijkbare stekken vraagt minimaal vijf metingen van ten minste twee stekken.
- `SessionModal` bewaart iedere fysieke meting als afzonderlijk event en spiegelt de meest recente bruikbare eventmeting naar de scalaire compatibiliteitsvelden. De thermische engine gebruikt die scalaire velden als recent meetanker; de historische profielroute gebruikt de afzonderlijke events.
- De temperatuurkalibratie gebruikt een afzonderlijke subset van geldige vooraf voorspelde snapshotparen. Deze route is niet hetzelfde als de historische temperatuurprofielroute.
- De persoonlijke vangstanalyse gebruikt bevestigde sessies en doelsoort-/locatiefilters. Voor het Poisson-vangsttempo zijn daarnaast bekende sessieduur en bruikbare vangstaantallen nodig. Tijdvakervaring gebruikt doelsoort, starttijdvak en bevestigde uitkomst.

### 179.3 Wat nog niet automatisch wordt geleerd

Niet elk veld dat tijdens een sessie wordt geregistreerd, beïnvloedt momenteel de prognose. De huidige persoonlijke vangstberekening gebruikt bijvoorbeeld geen gevalideerde correctie op basis van techniek, aas/voer of combinaties van weers- en stekomstandigheden. Dat zulke velden in sessies of reproduceerbare snapshotfeatures zijn opgeslagen, betekent niet dat ze al als voorspellende factor worden gebruikt.

De volgende inhoudelijke audit richt zich daarom op een expliciete runtime-mapping:
- daadwerkelijk gebruikte historische velden en hun precieze filters;
- geregistreerde velden die nu alleen worden bewaard of als context dienen;
- kandidaatvelden die met voldoende vergelijkbare sessies onderzocht kunnen worden;
- datakwaliteit, ontbrekende waarden, vergelijkbaarheid en risico op confounding/dubbele telling.

Pas daarna kan per kandidaat worden bepaald of deze verantwoord in de prognose kan worden benut. Geen automatische gewichten, causale claims of nieuwe verplichte invoer toevoegen.

### 179.4 Besluit en afbakening

De eerdere route-A-beslissing uit §177 blijft alleen van toepassing op de aparte temperatuurvoorspellings-evaluatie. De workflowformulering uit §178 mag niet worden gelezen als eis dat de visser eerst een sessie start en daarna pas mag meten, noch als eis om elke sessiemeting aan een exact forecastdoelmoment te koppelen voor historisch gebruik.

Geen runtimecode, schema, IndexedDB, bestaande meetevents, snapshots, temperatuurcurves, scores, gewichten of gebruikersinvoer gewijzigd. Er wordt geen informatie verwijderd of samengevoegd buiten de bestaande deduplicatie van dezelfde fysieke meting. Fase 2 blijft open; Fase 3 blijft geblokkeerd.

**Hervattingspunt:** voer de runtime-mapping van historische sessievelden uit en leg per veld vast of het al prognose-input is, alleen context is of een onderbouwde kandidaat voor later onderzoek is. Geen extra meetlast voor de visser.


## 180. Primaire-broncontrole karper — Oyugi et al. (2012) en grenzen van thermische foerageerrespons (21 november 2026)

**Vraag:** ondersteunt de bestaande bron voor jonge karper een concrete numerieke foerageer-/activiteitsbijdrage of een aanpassing van de bestaande volwassen-karpercurve?

**Broncontrole:** de volledige zes pagina's tellende primaire publicatie van Oyugi, Cucherousset, Baker & Britton (2012), *Effects of temperature on the foraging and growth rate of juvenile common carp, Cyprinus carpio*, Journal of Thermal Biology 37, 89–94, DOI 10.1016/j.jtherbio.2011.11.005, is gecontroleerd (niet alleen het abstract).

### 180.1 Wat daadwerkelijk is gemeten

- Onderzochte vissen waren juveniele gewone karpers, circa 90–105 mm, gemiddeld ongeveer 21,5 g en circa één jaar oud; afkomstig van een aquacultuurbedrijf.
- De experimenten gebruikten gecontroleerde aquaria en vier temperatuurbehandelingen: 16, 20, 24 en 28 °C. De vissen werden vooraf bij 16 °C geacclimatiseerd; bij de hogere behandelingen werd de temperatuur geleidelijk verhoogd en volgde een korte acclimatisatie.
- Er werden drie vissen per tank gebruikt omdat individueel gehouden vissen in de voorproeven niet op het aangeboden voedsel reageerden. De lichtcyclus was vast 14 uur licht / 10 uur donker.
- De directe gedragsrespons was de tijd die een vis nodig had om het vijfde aangeboden voedselitem te consumeren, omgerekend naar items per seconde. De onderzoekers testten zowel maden als 2-mm vismeelpellets en varieerden de voedseldichtheid.
- De gemeten foerageersnelheid nam significant toe van 16 naar 24 °C; tussen 24 en 28 °C werd geen significante verdere toename in de gemeten voersnelheid gevonden. De pellet- en made-respons verschilden. De functionele respons hing mede af van voedseltype en voedseldichtheid.
- Groei werd over langere experimentele perioden apart gemeten. De auteurs rapporteren zelf dat de temperatuurrelatie voor foerageersnelheid niet identiek is aan die voor groei.

### 180.2 Wat deze bron wel en niet ondersteunt

**Wel:** een directe, experimenteel gemeten temperatuurafhankelijkheid van foerageersnelheid bij juveniele karper binnen het onderzochte bereik en onder de beschreven gecontroleerde voer-/tankcondities. Dit is sterker en specifieker dan alleen groei- of metabolismebewijs.

**Niet:**
- geen veldcurve voor volwassen wilde karper in Nederlandse wateren;
- geen universeel thermisch optimum of volledige koude-/warmtetolerantiecurve;
- geen meting van totale dagelijkse voedselopname of natuurlijke foerageertijd over alle dagdelen;
- geen bewijs voor een vaste ochtend-, avond- of nachtbonus;
- geen directe vertaling naar method-feeder-vangbaarheid, haakaasacceptatie of vangstkans;
- geen rechtvaardiging om de bestaande thermische profielparameters of de huidige 1–10-score aan te passen.

### 180.3 Modelbesluit

De bestaande registry-registratie `common-carp-juvenile-foraging-temperature-2012` classificeert de bron al als `foraging_behavior` en `growth`, met beperkte overdraagbaarheid en `approvedForPrediction: false`. De volledige-tekstcontrole bevestigt dat deze begrenzing passend is; de registry hoeft hiervoor niet dubbel te worden uitgebreid.

De bron blijft kandidaatbewijs voor een afzonderlijke juveniele-karper-foerageerrespons, niet voor de algemene volwassen-karperdagscore. Zij levert geen directe Nederlandse veldlabels om een numerieke factor onafhankelijk te valideren. Geen factoractivatie, gewicht, score, curveparameter of tijdvakrangschikking gewijzigd.

### 180.4 Registry-aantallen gecontroleerd

Een directe telling van de actuele `src/services/researchRegistry.ts` op deze `main`-basis geeft 94 unieke IDs, 94 records met `approvedForPrediction: false`, 0 met `true`, en geen dubbele IDs. De vermelding van 93 in §171.1–171.2 was verouderd na de latere toevoeging van het Cunner-record in §151; die actuele status is hierboven gecorrigeerd. Oudere aantallen in historische checkpoints blijven staan als momentopname op hun toenmalige datum.

**Vervolg:** brononderzoek blijft vraaggestuurd; geen brede herhaling van de gesloten factorinventaris. Volgende modelstap is de score-/datakwaliteitsstatus van thermische tijdvakuitvoer en de kandidaatgrens tussen de voorlopige thermische prior en nog niet toegelaten biologische responsen concreet te toetsen. Fase 2 blijft open; Fase 3 blijft geblokkeerd.


## 181. Correcte bron- en onzekerheidsweergave bij thermische tijdvakscore (21 november 2026)

**Status: geïmplementeerd en technisch gevalideerd op main.** Dit is een presentatie-/uitlegbaarheidsreparatie; de bestaande thermische score blijft ongewijzigd.

### 181.1 Vastgestelde afwijkingen

De tijdvakfactoromschrijving noemde iedere geschatte watertemperatuur voorheen "via thermische traagheid". De runtime kent echter meerdere bronstatussen: `estimated_from_measurement`, `estimated_from_history` en `estimated_from_weather`. Bij een weerafgeleide schatting zonder lokale waterreferentie is die oude tekst feitelijk onjuist.

Daarnaast bouwde `waterTemperatureInfo.note` altijd een bereikstring uit `estimatedRange?.[0]` en `estimatedRange?.[1]`. Bij een geldige indicatieve weer-only puntwaarde zonder numerieke onzekerheidsrange kon daardoor de tekst `undefined–undefined` ontstaan.

### 181.2 Reparatie

- De thermische factor benoemt nu de werkelijke bronstatus: recente lokale meting als anker, historisch temperatuurprofiel of indicatieve weerafgeleide schatting.
- Bij `estimated_from_weather` zonder lokale waterreferentie meldt de factor expliciet dat de absolute temperatuur hoge, niet-gekwantificeerde onzekerheid heeft.
- De temperatuurtoelichting toont alleen een numerieke geschatte band als `estimatedRange` daadwerkelijk bestaat. Anders wordt expliciet gemeld dat geen kwantificeerbare onzekerheidsmarge beschikbaar is.
- De bestaande puntwaarde en score blijven behouden. Er is geen automatische scoreblokkade, neutralisering, nieuwe weging of wijziging van de temperatuurcurve toegevoegd. Dit bewaart de bestaande optie-A-werking en maakt de onzekerheid eerlijker zichtbaar.

### 181.3 Regressietests en Quality Gate

Nieuwe assertions in `test-thermal-and-prognosis.ts` controleren:
1. een weer-only schatting zonder lokale waterreferentie blijft herkenbaar als `estimated_from_weather`, met een puntwaarde maar zonder verzonnen interval;
2. de tijdvakfactor noemt de weer-only herkomst en niet-gekwantificeerde onzekerheid, en noemt dit niet ten onrechte thermische traagheid;
3. de gebruikersgerichte temperatuurtoelichting bevat geen `undefined`-band en vermeldt dat geen kwantificeerbare onzekerheidsmarge beschikbaar is.

De bestaande regressie in `test-water-thermal-coupling.ts` is aangepast om de correcte weer-only provenance te toetsen in plaats van de oude onjuiste formulering te eisen.

Quality Gate [#1049](https://github.com/sennzor-wq/Vislogboek/actions/runs/44947264497) is volledig geslaagd op exact `affef1e5cab0c9bb879a457d91e6e54cdbbcaaf3`: typecheck, kernprognose-/thermische tests, waterthermische koppeling, overige regressies, productiebuild en private-artifactcontrole. De twee eerdere tussenruns #1047 en #1048 faalden respectievelijk op een ontbrekende optional-chain in de nieuwe test en op een bestaande testassertion die nog de oude tekst verwachtte; beide testproblemen zijn gecorrigeerd vóór de groene #1049-run.

**Begrenzing:** dit herstelt de waarheid van de bron-/onzekerheidstekst, niet de wetenschappelijke onzekerheid zelf. Een weer-only puntwaarde kan nog steeds de bestaande thermische score voeden; de UI maakt nu expliciet dat de absolute temperatuur hoge, niet-gekwantificeerde onzekerheid heeft. Of en wanneer zo'n score als alleen indicatief moet worden gelabeld of niet beschikbaar moet zijn, blijft een afzonderlijke model-/productbeslissing. Geen biologische validatie geclaimd.


## 182. Compacte Prognosepagina toont onzekerheid bij weer-only temperatuur (21 november 2026)

**Status: geïmplementeerd en technisch gevalideerd op main.** Dit vervolgt §181 en maakt de reeds berekende bron-/onzekerheidsstatus zichtbaar zonder dat de gebruiker geavanceerde details hoeft open te klappen.

Wanneer `waterTemperatureStatus === 'estimated_from_weather'` en er geen `estimatedRange` bestaat, toont de Prognosepagina nu een korte indicatie:
- onder de dagscore in de dagselectie: **Indicatief**;
- bij de hoofdscore: **Indicatieve temperatuurbron**;
- in de compacte watertemperatuurregel: **Indicatieve schatting — hoge, niet-gekwantificeerde onzekerheid**.

De voorwaarde is bewust beperkt tot een weer-only puntwaarde zonder lokale waterreferentie en zonder kwantificeerbare onzekerheidsband. Gemeten temperatuur, schattingen vanaf een lokale meting en historische profielschattingen worden niet onterecht als deze hoge-onzekerheidscategorie gelabeld. De uitgebreide weergave behoudt de bestaande detailuitleg.

Quality Gate [#1051](https://github.com/sennzor-wq/Vislogboek/actions/runs/44947434389) is volledig geslaagd op exact `970964ab5892fd241e051d62462a41c0113d2042`: 43 succesvolle stappen, waaronder TypeScript typecheck, volledige regressies en productiebuild. Er is geen afzonderlijke React-componenttestrunner in de bestaande repository-inrichting; de nieuwe UI-voorwaarde is statisch gecontroleerd en de volledige typecheck/build is groen.

Geen scoreformule, scorewaarde, factorweging, temperatuurcurve, gebruikersdata, database of VisCoach-berekening gewijzigd. Dit is een verbetering van zichtbare onzekerheidscommunicatie; geen biologische validatie.



## 183. Productdoel: geïntegreerde prognosescore over alle relevante prognoseonderdelen (21 november 2026)

**Eigenaarseis:** de prognose moet uiteindelijk niet bestaan uit één numerieke factor met daarnaast meerdere uitsluitend beschrijvende factoren. Alle relevante prognoseonderdelen moeten inhoudelijk worden uitgewerkt en, zodra hun bijdrage voldoende onderbouwd en technisch betrouwbaar is, daadwerkelijk deelnemen aan een geïntegreerde prognosescore.

### 183.1 Gewenst eindbeeld

- De bestaande prognosefactoren blijven herkenbaar en uitlegbaar; zij worden niet stilzwijgend samengevoegd tot een ondoorzichtige totaalscore.
- Relevante factoren zoals watertemperatuur, luchtdruk/-trend, wind, seizoen, tijdstip/licht, bewolking en neerslag moeten elk een expliciet vastgelegde rol in de scorearchitectuur krijgen. Dat kan een numerieke bijdrage, een conditionele bijdrage, een interactie met andere factoren of een gemotiveerde uitsluiting zijn. Alleen context blijven is niet het gewenste eindbeeld wanneer een factor aantoonbaar prognostische waarde kan leveren.
- De factorbijdrage moet passen bij het gemeten biologische eindpunt. Voedselopname, foerageergedrag, aanwezigheid, activiteitspotentie en daadwerkelijke hengelvangst zijn verschillende responsen en mogen niet als onderling uitwisselbare labels worden behandeld.
- Persoonlijke sessiehistorie, waarnemingen, habitat-/bewegingsanalyse, tactiek en vangstkans moeten op hun eigen betekenis worden gebruikt. Een historische vangstkans mag niet zonder validatie als biologische correctie op de activiteitsscore worden geplakt.
- De score moet per relevante periode kunnen worden berekend op basis van de beschikbare tijdspecifieke invoer. Een volledige geplande sessie moet als interval worden beoordeeld; het simpelweg kiezen van één tijdvak op basis van een representatief middelpunt is daarvoor onvoldoende.
- Ontbrekende invoer, lage dekking, onzekerheid, bronkwaliteit en niet-gevalideerde aannames moeten zichtbaar blijven. Ontbrekende gegevens mogen niet ongemerkt een neutrale bonus, aftrek of schijnzekere totaalscore opleveren.

### 183.2 Randvoorwaarden voor activering van scorebijdragen

Een factor wordt pas numeriek geactiveerd wanneer de relevante relatie voldoende is onderbouwd voor de bedoelde soort/levensfase, respons, watertype en tijdschaal, én de invoerkwaliteit en evaluatiemethode zijn vastgelegd. Waar bewijs nog ontbreekt, blijft de factor zichtbaar als context of als expliciet niet-geactiveerde kandidaat. De bestaande bronregistry en eerdere factorinventaris blijven leidend; deze eis is geen opdracht om bronnen dubbel te registreren of ongefundeerde gewichten te kiezen.

Voor iedere geactiveerde bijdrage moeten minimaal doelrespons, richting/vorm van het effect, toepassingsgebied, tijdsresolutie, interacties, onzekerheid, bronherkomst, ontbrekende-dataregel, versie en onafhankelijke validatiecriteria traceerbaar zijn. Gewichten, drempels en niet-lineaire effecten worden niet op basis van intuïtie ingevuld.

### 183.3 Relatie met huidige implementatie

De code-inspectie in werkonderdeel 7 bevestigt dat de huidige `activityScore` uitsluitend de voorlopige thermische watertemperatuurcurve gebruikt. Luchtdruk, wind, seizoen, tijd/licht, bewolking en neerslag leveren momenteel context en geen numerieke scorebijdrage. De huidige score is daarom een beperkte thermische prior, niet het gewenste geïntegreerde prognose-eindproduct.

Dit productdoel wijzigt op zichzelf geen bestaande formule, curve, gewicht, drempel, biologische bronstatus of gebruikersdata. De verdere uitwerking moet eerst de factor-/respons-crosswalk, tijdsresolutie, gegevensdekking en validatievoorwaarden verbinden. De gebruiker heeft nadrukkelijk aangegeven dat alle prognoseonderdelen volledig moeten worden uitgewerkt zodat zij niet uitsluitend context blijven, maar daadwerkelijk kunnen bijdragen aan de score waar dat verantwoord kan.



## 184. Correctie en verdieping: VisCoach beschikt al over een gepland sessie-interval (21 november 2026)

Deze paragraaf corrigeert een te brede conclusie in audit §183 / werkonderdeel 8.1. De algemene Prognosepagina heeft geen vrij ingevoerd sessiestart-/eindtijdinterval, maar **de aparte VisCoach-planflow heeft dat wél**. Dit is bij de vervolginspectie aangetroffen en moet als bestaande functionaliteit worden hergebruikt.

### 184.1 Bestaande VisCoach-contracten

- `VisCoachView` vraagt een gewenste starttijd en optionele gewenste eindtijd via `datetime-local`.
- `VisCoachPlanInput` bevat `desiredStartTime` en `desiredEndTime`; `buildVisCoachPlan` valideert de volgorde en een bekende duur van maximaal 24 uur.
- De duur wordt uit start/eindtijd berekend en aan `calculateDayPrognosis` doorgegeven als `sessionDurationHours`. Dit beïnvloedt de aparte persoonlijke Poisson-vangstbaseline, niet de thermische `activityScore`.
- De VisCoach kiest `targetTimeSlot` op basis van de geplande starttijd. Dit wordt gebruikt voor tactische context, niet voor een score over de volledige geplande periode.
- Het volledige interval wordt opgenomen in `PendingPrognosisSnapshot.targetWindowStart/targetWindowEnd` en in de inputfingerprint. De `PrognosisInputContext` bewaart echter alleen targetDate, targetTimeSlot en sessieduur; geen expliciete start-/eindtijd.
- De weersnapshot `conditions` wordt opgebouwd uit het dichtstbijzijnde uurlijkse forecastpunt bij de starttijd. De volledige uurlijkse reeks wordt apart als `weatherInput` opgeslagen.
- `calculateDayPrognosis` wordt aangeroepen voor alleen de Amsterdamse kalenderdatum van de starttijd. De vier dagtijdvakken worden dus niet op de feitelijke sessie-intervalgrenzen gesneden.

### 184.2 Bestaande beperking van tijdvaktoewijzing

`resolveSelectedTimeSlot(start, end)` geeft alleen een tijdvak terug wanneer het interval geheel binnen één bestaand tijdvak past. Bij een sessie die over een tijdvakgrens heen loopt, wordt geen enkelvoudig geselecteerd tijdvak teruggegeven. Een sessie die een kalenderdatumgrens overschrijdt wordt eveneens niet ondersteund, behalve wanneer de eindtijd exact middernacht van de volgende dag is. Zelfs in dat laatste geval wordt het interval niet als twee segmenten in de prognose-engine doorgerekend.

De huidige tijdvak-engine gebruikt vier vaste dagdelen en berekent de dagscore als gemiddelde van de vier tijdvakscore-uitkomsten. Er is geen bestaande sessie-intervalscore die de relevante tijdvakken proportioneel naar overlapduur weegt. De dagprognose wordt op de startdatum berekend; de weersverwachting van een volgende kalenderdag maakt dus geen deel uit van een doorlopende overnight-sessieanalyse.

### 184.3 Herbruikbare bestaande technische bouwstenen

- Start-/eindtijd en duur bestaan al in VisCoach-planinput en pending snapshot.
- Historische sessies bewaren ISO-starttijd, eindtijd en/of duur; geplande sessies bewaren geplande start- en eindtijd.
- `timeSlotExposureEngine` kan expliciet vastgelegde hengel-actieve intervallen splitsen over Amsterdamse tijdvakken, inclusief datumgrenzen/DST. Deze output is nadrukkelijk beschrijvende hengelblootstelling en geen prognose-/modelinput. De segmentatiecode kan als technische referentie dienen, maar de exposure-uitkomst mag niet als biologische scorefactor worden hergebruikt.
- De bestaande uurlijkse weerinvoer en tijdvakanalyses kunnen als brondata worden hergebruikt, mits de intervalberekening expliciet dekking, ontbrekende uren en forecastgrenzen respecteert.

### 184.4 Gecorrigeerde conclusie

De juiste conclusie is niet dat VisCoach geen sessie-interval kent. De juiste conclusie is: **VisCoach kent en bewaart het geplande interval, maar de huidige numerieke prognose beoordeelt dat interval nog niet als interval.** De duur beïnvloedt de persoonlijke vangstbaseline; het starttijdvak stuurt tactische context; de thermische score blijft dag-/tijdvakgericht. Een intervalscore en vergelijking met alternatieve tijden ontbreken nog.

Deze correctie verandert geen code, bestaande scores, gewichten of gebruikersdata. Werkonderdeel 8 blijft een contract- en architectuuronderzoek.



## 185. FactorBreakdown-contract: zichtbare factorscores zijn nog geen actieve scorebijdragen (21 november 2026)

De runtimecontrole van `analyzeTimeSlot` laat zien dat de `FactorBreakdown`-velden in `TimeSlotAnalysis` al een `score`, `impact` en `dataAvailable` bevatten. Dit is een presentatiedetail/uitvoercontract en mag niet worden verward met daadwerkelijke deelname aan de numerieke `activityScore`.

| FactorBreakdown | Huidige ingevulde score/impact | Huidige betekenis |
|---|---|---|
| Thermische watertemperatuur | Afgeleide thermische deelscore; impact uit thermische curve | Enige factor die de numerieke `activityScore` voedt |
| Luchtdruk & trend | Score 0; impact neutraal | Gemeten/afgeleide weerscontext, expliciet geen bonus/aftrek |
| Wind & oppervlak | Score 0; impact neutraal | Weer- en stekcontext, geen biologische scorecorrectie |
| Seizoensritme | Score 0; impact neutraal | Kalendercontext, geen zelfstandige seizoenscorrectie |
| Tijdstip & licht | Score 0; impact neutraal | Diel-/zoncontext; huidige bronstatus niet goedgekeurd voor score |
| Bewolking & neerslag | Score 0; impact neutraal | Lokale weerscontext, geen biologische bonus/aftrek |

`dataAvailable` beschrijft of de factorinvoer beschikbaar is; het geeft geen indicatie dat het effect biologisch gevalideerd is. Een score 0/neutraal betekent in deze huidige implementatie dus niet dat de natuurkundige of biologische invloed bewezen nul is. Het betekent dat er geen numerieke bijdrage wordt toegepast.

### 185.1 Scheiding van prognosedomeinen

Naast de zes zichtbare factorvelden bevat `DayPrognosis` aanvullende modules: persoonlijke vangstkans/verwachte vangsten, aanwezigheid, thermische analyse, oeverwindanalyse, habitat-/bewegingsanalyse, hengelpositionering en voorvoerplan. Deze uitkomsten hebben verschillende doelresponsen en tijdschalen. Ze zijn niet automatisch onderling optelbare scorefactoren.

De verdere factor-/respons-crosswalk moet daarom per module expliciet classificeren:
- beoogde respons (bijvoorbeeld thermische activiteitspotentie, foerageergedrag, aanwezigheid/beweging, kans op een vangst met deze visser/methode);
- huidige datavelden en tijdsresolutie;
- bestaande bronnen in de research registry en hun goedkeuringsstatus;
- eventuele afhankelijkheden/interacties met andere factoren;
- mogelijke rol in geïntegreerde prognose: numeriek, conditioneel/interactie, context in afwachting van bewijs, of afzonderlijke advieslaag;
- ontbrekende lokale labels en validatievoorwaarden.

Geen numerieke nulscore wordt geïnterpreteerd als biologisch nul-effect. Geen bestaande gespecialiseerde module wordt zonder apart bewijscontract rechtstreeks in de totaalscore opgenomen.



## 186. Eerste factor-/respons-crosswalk op basis van bestaande code en research registry (22 november 2026)

**Doel:** de bestaande prognosefactoren en aanvullende prognosemodules koppelen aan de respons die zij daadwerkelijk kunnen beschrijven, de beschikbare invoer, bestaand bewijs en een passende toekomstige rol. Dit is een eerste inhoudelijke crosswalk, geen goedkeuring van nieuwe scorebijdragen.

**Gecontroleerde basis:** `src/services/prognosisEngine.ts`, `src/types/index.ts`, `src/services/fishProfiles.ts`, `src/services/feedingEvidenceService.ts`, `src/services/dielBehaviorEvidenceService.ts`, `src/services/thermalEvidenceService.ts`, `src/services/habitatMovementEngine.ts`, `src/services/bankWindEngine.ts`, `src/services/rodPositioningEngine.ts`, `src/services/prebaitEngine.ts` en de volledige actuele `src/services/researchRegistry.ts`.

### 186.1 Bewijsadministratie: actuele omvang en betekenis

De registry bevat 94 unieke records, geen dubbele IDs en 0 records met `approvedForPrediction: true`. De records beschrijven verschillende gemeten uitkomsten: onder meer metabolisme/aerobe scope, voedselopname/-ritme, foerageergedrag, locomotorische activiteit, habitatgebruik, groei en hengelvangbaarheid/-vangsttempo. De registry is bewijsadministratie; registratie of `evidenceStrength` alleen activeert geen runtimefactor.

De uitkomstlabels zijn leidend. Een studie naar groei is geen directe activiteitsmeting; locomotorische beweging is geen voedselopname; aanwezigheid bij aas is geen daadwerkelijke aasconsumptie; en aasontmoeting is niet hetzelfde als hengelvangbaarheid. De reeds vastgelegde soort- en bronbeperkingen blijven gelden. Er wordt geen bron opnieuw geregistreerd.

### 186.2 Zichtbare prognosefactoren

| Factor | Beoogde respons (niet verwisselen) | Bestaande invoer en runtime | Bestaand bewijs in registry | Voorlopige rol richting geïntegreerde prognose |
|---|---|---|---|---|
| Watertemperatuur en thermische ontwikkeling | Thermische fysiologische capaciteit/thermische activiteitspotentie; niet automatisch voedselopname of vangstkans | Gemeten of geschatte watertemperatuur, historische metingen/profiel, diepte en weersgedreven thermische toestand. De voorlopige soortcurve levert momenteel de enige numerieke `activityScore`. | Omgevings-/watertemperatuurmodellen plus soortrecords voor metabolisme/aerobe scope en enkele directe voedings-/foerageerresponsen. Voorbeelden: `common-carp-acute-temperature-metabolism-1983`, `european-perch-aerobic-scope-size-temperature-2020`, `adult-pikeperch-aerobic-scope-temperature-2012`, `common-carp-juvenile-foraging-temperature-2012`. | **Bestaande voorlopige numerieke prior behouden als afzonderlijke thermische respons.** Niet als gevalideerde totale visactiviteit presenteren. Soortcurve, levensfase, lokale watertemperatuur, meetdiepte, lag en onzekerheid moeten onafhankelijk worden gekalibreerd. Groei- of metabolismebewijs niet rechtstreeks omzetten naar vangst- of voedingsscore. |
| Luchtdruk en trend | Mogelijke verandering in beweging of voedselopname; afzonderlijk van frontpassage en andere weerscovariaten | Uurlijkse luchtdruk en afgeleide 12-uurs trend. In `FactorBreakdown` nu score 0/neutraal. | Slechts twee duidelijk relevante registry-records: `eurasian-perch-pressure-variability-movement-three-lakes-2020` (beperkt, beweging van Europese baars in drie boreale meren) en `yellow-perch-barometric-pressure-feeding-lab-2014` (verwante soort, laboratorium). Geen directe karper-/lokale vangstvalidatie. | **Kandidaat voor conditionele/interactieve bijdrage, nu niet numeriek.** Eerst soortspecifieke herhaalbaarheid aantonen en druk scheiden van front, wind, temperatuur en licht. Geen universele drukregel. |
| Wind en wateroppervlak | Mogelijke ruimtelijke verplaatsing, menging, drift of verandering in aas-/vispresentatie; dit zijn verschillende mechanismen | Uurlijkse snelheid/richting; oeveroriëntatie via locatie; gespecialiseerde `bankWind`, habitat- en positioneringsmodules. | Registry bevat geen overtuigend direct wind-responsrecord dat een algemene windbonus ondersteunt. Enkele habitat-/abiotische studies noemen wind of verwante omgevingsinvloeden, maar meten niet dezelfde respons voor alle soorten. | **Primair conditionele ruimtelijke/contextlaag.** Mogelijke latere scorebijdrage moet een expliciete respons meten (bijv. habitatbeweging) en afhangen van watertype, oevergeometrie en lokale windblootstelling. Niet tegelijk als onafhankelijke windbonus én als habitat-/mengingscorrectie dubbel tellen. |
| Seizoen en levenscyclus | Seizoensgebonden voedselopname, beweging/habitatgebruik en voortplantingsmigratie; geen zelfstandige universele seizoensrespons | Kalenderseizoen in tijdvak- en habitatlogica; geen expliciete volwaardige levensfase- of fotoperiodedata in de algemene invoer. | Veel bestaande soortrecords over seizoensgebonden voeding, beweging, habitat en paaien, met uiteenlopende soorten, populaties en responsen. Voorbeelden: `tench-field-diel-seasonal-feeding-2018`, `roach-autumnal-diel-feeding-shift-2008`, `european-freshwater-spawning-migration-environmental-triggers-meta-analysis-2026`. | **Vooral modifier/interactie, niet automatisch zelfstandige bonus.** Seizoen moet worden ontleed in temperatuur, fotoperiode, levenscyclus en habitat. Geen dubbele telling van temperatuur of daglengte via een kalenderlabel. |
| Tijdstip, licht en dag-/nachtritme | Tijdgebonden voedselopname/-ritme óf locomotorische activiteit; alleen de werkelijk gemeten respons | Vier vaste tijdvakken, zonsopkomst/-ondergang/schemercontext, bewolking/lichtcontext en soortspecifieke evidence-uitleg. De tijdvakfactor levert nu score 0. | Bestaande directe voedingsritmebronnen én afzonderlijke bewegings-/habitatbronnen. Voor karper o.a. `common-carp-temperature-feeding-rhythm-2012`, `common-carp-adult-bait-site-night-feeding-2018` en `common-carp-wild-night-feeding-lake-2010`; deze zijn contextgebonden en niet numeriek goedgekeurd. | **Sterke kandidaat voor een aparte tijdafhankelijke responslaag**, maar alleen wanneer bronrespons, soort, levensfase, seizoen, habitat en voer-/veldconditie passen. Beweging mag niet als voedingspiek worden gelezen. Een kloktijd uit een tankstudie is geen lokale tijdvakbonus. |
| Bewolking en neerslag | Mogelijke lichtattenuatie, afstroming/troebelheid of verandering van omstandigheden; geen enkelvoudige biologische respons | Uurlijkse bewolking en neerslag; bewolking/licht beïnvloedt ook bestaande thermische berekening. Factor nu score 0/neutraal. | Registry heeft geen direct, passend cloud-cover- of rainfall-effectrecord als algemene voorspellende respons. Er zijn aparte troebelheids-/predator-prooirecords, bijvoorbeeld `freshwater-fish-turbidity-predator-prey-review-2024` en `bream-activity-turbidity-shallow-lake-2019`; troebelheid is niet hetzelfde als bewolking of regen. | **Voorlopig context; mogelijke conditionele mediatoren pas na meting/validatie.** Bewolking niet dubbel tellen als directe lichtfactor én via zonnestraling in thermische toestand. Regen niet gelijkstellen aan troebelheid, afstroming of zuurstof. |
| Stroming, zuurstof en overige watercondities | Beweging, habitatkeuze, voedseltoegang of fysiologische beperking, elk als aparte respons | Watertype, diepte en habitatkenmerken; geen directe opgeloste-zuurstof- of gekwantificeerde stroomsnelheidsmeting aangetoond in de huidige prognose-input. | Bestaande records zoals `common-carp-flow-activity-depth-reservoir-2015`, `freshwater-river-flow-movement-activity-meta-analysis-2012` en `common-carp-winter-oxygen-deficiency-telemetry-2006`. De laatste betreft een uitzonderlijke winterse zuurstofcrisis. | **Conditionele kandidaat wanneer de betreffende variabele echt gemeten of betrouwbaar beschikbaar is.** Geen zuurstof uit temperatuur/weer afleiden en geen stromingsbonus toepassen op stilstaand water. |

### 186.3 Aanvullende prognosemodules en persoonlijke gegevens

| Module/gegevenslaag | Feitelijke respons of taak | Huidige runtime-/databasis | Rol en grens |
|---|---|---|---|
| Voedselopname en foerageerbewijs | Directe voedselopname/-ritme versus foerageergedrag versus dieet/prooikeuze | `feedingEvidenceService` bundelt deze afzonderlijk per soort en toont brongebonden context. Alle huidige bronnen zijn niet-goedgekeurd voor numerieke voorspelling. | **Potentiële eigen biologische responslaag.** Alleen directe voedselopname/-ritme kan een voedingsritme-uitspraak ondersteunen. Foerageergedrag, dieet en prooikeuze blijven onderscheiden. Geen algemene voedingsscore door alle bronnen samen te voegen. |
| Aanwezigheid en lokale waarnemingen | Aanwezigheid/waargenomen activiteit op de stek, niet automatisch toekomstige voedselopname of vangst | Gebruikerswaarnemingen en sessieobservaties worden aan habitat-/bewegingsanalyse doorgegeven. De huidige synchronisatie kan registratie-/update-tijd gebruiken in plaats van het fysieke waarnemingstijdstip. | Registry bevat habitat-, beweging- en aanwezigheidgerelateerde responsen; bronuitkomsten verschillen per soort en studie. | **Afzonderlijke lokale aanwezigheid-/waarnemingslaag.** Eerst tijdstempel, herhaalbare detecties, detectiekans en afwezigheidsregistratie verbeteren. Geen numerieke aanwezigheidsbonus op basis van een niet-tijdgebonden sessievinkje. |
| Habitat en beweging | Ruimtelijke habitatkeuze, dieptegebruik en verplaatsing tussen zones | `habitatMovementEngine` gebruikt onder meer watertype, diepte, habitatkenmerken, temperatuur, wind, druktrend, bewolking, target time slot en waarnemingen. Uitkomst bevat hypothesen, confidence en ontbrekende informatie. | Veel relevante registry-records, maar respons en context zijn soort-/watertypegebonden. | **Eigen ruimtelijke responslaag**, mogelijk later conditioneel in geïntegreerde prognose. Niet als voedselopname of vangstkans behandelen; lokale habitatvalidatie vereist. |
| Persoonlijke sessiehistorie en vangstkans | Kans op ten minste één doelsoortvangst tijdens een sessie voor deze visser/locatie/methodecontext | Vergelijkbare afgeronde sessies, duur, doelsoort en uitkomst; huidige persoonlijke Poisson-baseline en historische sessiepercentages. | Registry bevat beperkte angler-catch-/vulnerability-studies, maar persoonlijke eigen sessies zijn de relevante lokale uitkomstdata. | **Bestaande aparte numerieke vangstkanslaag behouden.** Niet optellen bij thermische activiteit alsof het dezelfde respons is. Alleen later integreren via apart getraind en chronologisch gevalideerd catch-model. |
| Hengelpositionering en oeverwind | Praktische zoekzone, werphoek, oeverrelatie en presentatie | `rodPositioningEngine` en `bankWindEngine`; gebruiken locatie, water-/weercontext, tijdvak en historische gegevens. | Habitat-/bewegingsliteratuur kan zoekhypothesen ondersteunen, maar niet automatisch de vangst van deze visser voorspellen. | **Advies-/tactieklaag.** Uitvoer helpt de gebruiker kiezen waar en hoe te vissen; geen zelfstandige biologische totaalscore. Een toekomstige effectclaim vraagt eigen uitkomstvalidatie. |
| Voorvoerplan | Praktisch voerprogramma/hoeveelheidsindicatie voor ondersteunde soorten | `prebaitEngine` gebruikt thermische analyse, sessieduur, opties en beschikbare historie/context. | Registry bevat voedings-/foerageeronderzoek, maar geen universele gramnorm voor lokale stekken en voerstrategieën. | **Actieadvies, geen prognosefactor.** Hoeveelheden blijven indicatief; geen vangstbonus of scorecorrectie zonder gecontroleerde sessiegegevens. |
| Techniek, aas/voer en materiaal | Mogelijke invloed op vangbaarheid en succes van de gekozen aanpak | Een deel van sessie-/vangstmetadata wordt in de historische feature-whitelist bewaard; niet alle opgeslagen velden zijn actieve prognose-input. | Registry bevat onder meer `common-carp-bait-encounter-angling-vulnerability-2017`, `perch-recreational-angling-catch-rates-21-lakes-2013` en snoek-vangbaarheidsstudies. Deze meten verschillende angler-/vulnerability-responsen. | **Kandidaat voor persoonlijke vangstkans/tactiek**, niet voor thermische activiteit. Vereist voldoende vergelijkbare sessies, inspanningsregistratie en toetsing van methode-/aasconfounding. |

### 186.4 Interacties en dubbeltelling die de latere scorearchitectuur moet voorkomen

1. **Temperatuur × seizoen × tijd/licht:** kalenderseizoen, daglengte en temperatuur kunnen dezelfde seizoensontwikkeling deels representeren. Elk zelfstandig optellen kan hetzelfde signaal dubbel tellen.
2. **Wind × habitat × thermische menging:** wind kan de waterkolom mengen, lokale drift beïnvloeden en ruimtelijke visverdeling veranderen. Deze mechanismen moeten als afzonderlijke responsen worden gemodelleerd en niet drie keer als onafhankelijke windbonus.
3. **Bewolking × licht × thermische warmtebalans:** bewolking beïnvloedt licht en zonnestraling; de thermische engine verwerkt al stralings-/bewolkingscontext. Een extra bewolkingsscore kan daardoor dubbeltellen.
4. **Neerslag × afstroming × troebelheid × stroming:** neerslag is niet hetzelfde als lokale waterinvoer, troebelheid of debiet. Alleen gemeten of expliciet gevalideerde schakels mogen worden gebruikt.
5. **Aanwezigheid × foerageren × aasontmoeting × vangbaarheid:** een vis kan aanwezig zijn zonder te eten, eten zonder het haakaas te nemen, of aas ontmoeten zonder gevangen te worden. Deze responsen moeten gescheiden blijven.
6. **Persoonlijke vangsthistorie × tactiek:** methode, aas, ervaring, stek en inspanning beïnvloeden vangstuitkomsten. Een toekomstige persoonlijke vangstprognose moet deze confounding expliciet behandelen en mag niet als biologische activiteitsscore worden vermomd.

### 186.5 Datagaten en validatiepoorten

- De registry telt 94 records, maar 0 numeriek goedgekeurde bronnen. Dat is geen reden om de registry te negeren; het betekent dat geen van de geregistreerde biologische claims nu zelfstandig een numerieke runtimefactor mag activeren.
- De huidige weersinvoer levert voor meerdere factoren uurlijkse forecastwaarden, maar de invoer is niet gelijk aan een gemeten biologische respons. Vooral lokale stroming, opgeloste zuurstof, troebelheid, prooibeschikbaarheid en levensfase ontbreken als volwaardige prognosevelden.
- De nieuwe persoonlijke sessiereeks begint volgens de afgesproken clean start vanaf nul. De audit kan daarom geen bestaande lokale steekproefomvang of effectgrootte claimen.
- Voor validatie moeten labels vooraf worden gekoppeld aan de respons: thermische metingen voor de waterthermische engine; afzonderlijke tijdgestempelde voedings-/foerageerwaarnemingen voor voedingsrespons; betrouwbare tijdgestempelde aanwezigheid-/bewegingswaarnemingen voor habitatrespons; en afgeronde sessie-uitkomsten met duur/inspanning voor vangstkans.
- De bestaande minimumdrempels in software zijn geen bewijs van statistische power. Chronologische evaluatie, een passende baseline, voldoende dekking en onafhankelijke toetsing blijven noodzakelijk.

### 186.6 Tussenconclusie en vervolg

De eerste crosswalk bevestigt dat het geïntegreerde einddoel niet bereikt wordt door de vijf neutrale `FactorBreakdown`-velden simpelweg gewichten te geven. De prognose bevat meerdere responsdomeinen die eerst afzonderlijk reproduceerbaar en toetsbaar moeten worden gemaakt. De meest kansrijke volgende biologische scorelaag is een soortspecifieke, tijdsafhankelijke voedings-/foerageerrespons, omdat daarvoor al een substantiële bestaande registry en een gescheiden evidence-service bestaan. Die laag is nog niet numeriek goedgekeurd en mag niet worden verward met beweging of habitat.

De volgende auditstap is een gerichte contractcontrole van de kandidaat voedings-/foerageerlaag: per soort vaststellen welke directe responsrecords de service teruggeeft, welke contextfilters al bestaan, welke tijdvak-/seizoensresolutie werkelijk beschikbaar is en welke ontbrekende invoer een numerieke uitspraak verhindert. Daarna volgt een vergelijkbare contractcontrole van persoonlijke vangstkans en lokale aanwezigheid/habitat. Geen nieuwe literatuurzoektocht tenzij deze controles een concreet ontbrekend bewijsprobleem aanwijzen.

**Niet gewijzigd:** geen runtimecode, types, scoreformule, gewichten, drempels, temperatuurcurve, bronstatus, database, snapshots, UI, VisCoach-advies of gebruikersdata. Geen tests uitgevoerd en geen biologische validatie geclaimd. Werkonderdeel 8 blijft open; Fase 2 blijft open en Fase 3 geblokkeerd.


## 187. Contractcontrole voedings-/foerageerevidence-service (22 november 2026)

**Scope:** read-only controle van `feedingEvidenceService.ts`, `dielBehaviorEvidenceService.ts`, registry-query-/approvalfuncties en soorttypen. Geen literatuuronderzoek of runtime-aanpassing.

### 187.1 Feitelijke werking

- `getSpeciesFeedingEvidenceContext(species)` groepeert vijf afzonderlijke gemeten responsen: `feeding_intensity`, `feeding_rhythm`, `foraging_behavior`, `diet_composition` en `prey_selection`.
- De onderliggende `getResearchByOutcome` accepteert zowel soortspecifieke records als generieke records met een lege `species`-array.
- De service filtert niet automatisch op levensfase, watertype, seizoen, habitat, onderzoeksopzet, voerregime of lokale toepasbaarheid. De individuele bronbeperkingen moeten dus vóór eventuele modeltoepassing worden beoordeeld.
- `scope` classificeert alleen de literatuurdekking (direct-feeding, foraging-only, diet-only of none); het is geen voorspelling dat vis op de gekozen dag eet.
- `approvedFeedingEvidence` bevat alleen expliciet goedgekeurde records met bewijssterkte strong/moderate. De huidige registry heeft 0 goedgekeurde records, dus deze lijst is leeg.
- `getSpeciesDielBehaviorEvidenceContext` neemt uitsluitend expliciet soortgebonden records mee en houdt `feeding_rhythm`, `locomotor_activity` en `habitat_use` gescheiden. Ook wanneer tijdgebonden voedingsbronnen bestaan, blijft de huidige tijdvakscore neutraal zolang numerieke goedkeuring ontbreekt.

### 187.2 Registry-dekking per soort

Onderstaande aantallen zijn aantallen registry-records per gemeten respons, op basis van de bestaande query (inclusief generieke records waar de feeding-service die accepteert). Het zijn geen onafhankelijke replicaties, effectgroottes of bewijs van overdraagbaarheid.

| Soort | Voedselopname | Voedingsritme | Foerageergedrag | Beperking |
|---|---:|---:|---:|---|
| Karper | 8 | 7 | 7 | Mix van juveniel labbewijs, volwassen bait-site-veldwerk, habitats en voerregimes |
| Brasem | 4 | 3 | 2 | Prooigebonden bronnen; beweging/habitat blijft aparte respons |
| Snoek | 4 | 1 | 0 | Voedselopname en beweging zijn niet hetzelfde; levensfase/prooiconditie relevant |
| Baars | 6 | 4 | 0 | Veld- en labresponsen; grootte- en seizoensafhankelijkheid |
| Voorn | 8 | 6 | 1 | Voedings-/dieetcontext; habitat en beweging apart houden |
| Zeelt | 3 | 2 | 1 | Beperkter en contextgebonden bronbestand |
| Snoekbaars | 4 | 1 | 0 | Voedingsintensiteit en diel-beweging zijn verschillende responsen |
| Meerval | 3 | 3 | 1 | Verschillende voeropstellingen, levensfasen en habitats |
| Roofblei | 0 | 0 | 0 | Vooral dieet/prooikeuze en beweging; geen directe voedingsintensiteits-/ritmebron |
| Overig | 0 | 0 | 0 | Geen soortspecifieke evidence of fallbackbonus |

### 187.3 Ontwerpconsequentie

De service is geschikt als bewijsindex/contextlaag, niet als score-engine. Een toekomstige voedingsrespons vereist:
1. bronselectie op werkelijk gemeten respons en passende soort/levensfase/habitat/seizoen;
2. gescheiden behandeling van voedselopname, voedingsritme, foerageersnelheid, dieet/prooikeuze en beweging;
3. passende tijdsresolutie en forecastdekking; geen kloktijdbonus afleiden uit een afwijkende tank-/lichtcyclus;
4. expliciete regels voor conflicterende studies, ontbrekend bewijs en ontbrekende lokale invoer;
5. vooraf verzamelde, tijdgestempelde lokale responslabels en chronologische validatie;
6. pas daarna een versiebeheerste responsfunctie met onzekerheid en vergelijking met een eenvoudige baseline.

Vangsten en huidige sessieobservaties zijn geen zuivere voedingslabels. Een vangst bewijst niet dat de hele sessie voedingsactiviteit had; nulvangst bewijst niet dat vis afwezig was of niet at. Het observatiecontract vraagt daarom een aparte controle op fysiek waarnemingstijdstip en herhaalbare gebeurtenissen.

**Conclusie:** er is geen reden om nu nieuwe literatuur te zoeken of de bestaande service te herschrijven. Eerst moet de gebruikersweergave gecontroleerd worden op het onderscheid tussen directe voeding, foerageren, dieet/prooikeuze en beweging. Daarna volgen persoonlijke vangstkans en aanwezigheid-/habitatlabels.

Geen runtimecode, types, scoreformule, gewichten, drempels, bronstatus, UI, VisCoach-advies, snapshots of gebruikersdata gewijzigd. Geen tests of biologische validatie geclaimd. Werkonderdeel 8 en Fase 2 blijven open; Fase 3 blijft geblokkeerd.


## 188. Consumentencontract voedingsliteratuur op de Prognosepagina gecontroleerd (22 november 2026)

**Scope:** read-only inspectie van `src/components/prognosis/PrognosisView.tsx` en verificatie van de registry-querysemantiek. Geen UI-wijziging.

### Vastgesteld
- De sectie **“Wat zegt onderzoek over voeding bij [soort]?”** wordt alleen voor een gekozen doelsoort getoond. Bij keuze Algemeen wordt geen soortspecifieke broncontext verzonnen; de gebruiker wordt gevraagd een soort te kiezen.
- De sectie noemt de inhoud expliciet biologische achtergrond uit gepubliceerde studies, geen actuele voedingsvoorspelling voor stek of datum, en benoemt dat onderzochte populaties/wateren/omstandigheden kunnen afwijken.
- De UI toont twee onderscheiden groepen: **gemeten voedselopname en voedingsritme** en **foerageergedrag**. Per record zijn samenvatting, beperkingen, bronverwijzingen en bewijsstatus/openstelling voor voorspellingsgebruik zichtbaar.
- De UI vermeldt expliciet dat deze literatuurcontext de thermische activiteitspotentie, het thermisch gunstigste tijdvak en de persoonlijke vangstkans niet verandert.
- Dieetcompositie en prooiselectie zitten wel in het servicecontract, maar worden niet in deze twee UI-groepen getoond. Dit is inhoudelijk verdedigbaar zolang dieet/prooikeuze niet wordt gepresenteerd als actuele voedingsintensiteit of tijdvakvoorkeur.
- De generieke queryfunctie kán structureel generieke records accepteren, maar controle van de huidige negen registry-records met een lege soortenlijst laat zien dat geen daarvan een `measuredOutcomes`-label heeft dat door de vijf feeding-outcome queries wordt opgevraagd. Er worden op dit moment dus geen generieke records ongemerkt als soortspecifieke voedingsstudie in deze sectie ingevoegd.

### Beoordeling
De huidige consumentenweergave bewaakt het onderscheid tussen onderzoek en actuele prognose goed. De eerdere servicecontrole blijft wel relevant: de evidence-service is geen score-engine en bronbeperkingen moeten vóór modeltoepassing worden gematcht. Er is op basis van deze controle geen reden voor een UI-fix of wijziging van de bestaande evidence-service.

**Vervolg:** de audit verschuift nu naar de persoonlijke vangstkans en naar het tijdstip/labelcontract van aanwezigheid- en habitatwaarnemingen. Geen runtimecode, UI, scoreformule, gewichten, bronstatus, snapshots of gebruikersdata gewijzigd; geen tests of biologische validatie geclaimd.


## 189. Contractcontrole persoonlijke vangstkans en aanwezigheid-/habitatlabels (22 november 2026)

**Scope:** read-only inspectie van `prognosisEngine.ts`, `evaluationEngine.ts`, `habitatMovementEngine.ts`, de relevante types, database-synchronisatie en de Prognose-/VisCoach-callers. Geen code- of datamutatie.

### 189.1 Persoonlijke vangstkans: wat wordt nu werkelijk voorspeld?

De engine houdt drie uitkomsten uit elkaar:
1. Historisch sessiesucces: geldige sessies met ten minste één doelsoortvangst gedeeld door alle geldige sessies.
2. Vangsttempo `lambda`: geregistreerde doelsoortvangsten gedeeld door de totale bekende visduur, waarbij bevestigde nulvangstsessies meetellen in de blootstellingsduur.
3. Persoonlijke kans op minimaal één doelsoortvangst tijdens de geplande duur: `1 - exp(-lambda × duur)`, met de bestaande bovengrens van 95%.

De vergelijkbare sessies voor deze vangstkans worden gefilterd op:
- afgeronde uitkomst `catch` of `skunk_confirmed`;
- geen benchmark;
- geselecteerde doelsoort (behalve bij Algemeen);
- gekozen stek wanneer een `locationId` is meegegeven;
- bij een sessie met uitkomst catch moet een bekend vangstrecord van de doelsoort bestaan.

De Poisson-blootstellingsset vereist daarnaast een bekende werkelijke duur en bruikbare doelsoortvangstaantallen (bevestigde nulvangsten tellen mee als nulvangst/blootstelling). Er zijn minimaal vijf vergelijkbare sessies nodig voor het historische sessiesucces en minimaal vijf bruikbare duur-/vangstsessies voor het Poisson-vangsttempo. Bij onvoldoende aantallen blijft de kans onbekend.

**Belangrijke scopebeperking:** de huidige persoonlijke Poisson-vangkans filtert niet op techniek, aas/voer, hengeltype of gekozen starttijdvak. De historische sessies worden op soort en optioneel stek samengenomen; duur wordt meegenomen als blootstelling. Dit is dus een persoonlijke soort-/stekbaseline, geen methode-specifieke of tijdvak-specifieke kans. De geselecteerde techniek wordt wel in de prognosecontext opgeslagen, maar is geen filter of correctie in deze berekening.

De aparte `personalExperience` binnen ieder tijdvak gebruikt een andere selectie: doelsoort en starttijdvak, maar geen stekfilter. Dit tijdvakpercentage is dus ervaring over alle opgenomen stekken voor die soort/starttijd, en niet de lokale stekhistorie. Het is bovendien geen tijdvakgebonden Poisson-kans.

### 189.2 Validatie van de persoonlijke vangstkans

De bestaande `evaluationEngine` toetst de opgeslagen voorafgaande vangstkans aan de definitieve uitkomst van een gekoppelde, afgeronde sessie:
- alleen de actuele modelversie;
- voorspelling moet vóór de werkelijke sessiestart zijn opgeslagen;
- per sessie/doelsoort telt de vroegste geldige voorspelling;
- gepland en werkelijk tijdvenster moeten overeenkomen wanneer exacte intervalgrenzen bestaan; anders wordt het oudere targetSlot-contract gebruikt;
- geplande en werkelijke sessieduur moeten op minuutprecisie overeenkomen; afwijkende of onbekende duur wordt uitgesloten;
- Brier-score wordt pas getoond vanaf vijf onafhankelijke sessies; de rolling Brier-skill-baseline vereist minimaal vijf eerdere uitkomsten van dezelfde doelsoort die vóór het prognosemoment aantoonbaar zijn afgerond.

Dit is een passende afzonderlijke evaluatieroute voor de catch-probability-uitkomst, maar de softwareminimums bewijzen geen statistische power. De evaluatie van de huidige Poisson-baseline valideert niet automatisch thermische activiteit, voeding of habitat.

### 189.3 Aanwezigheidswaarnemingen: tijd- en labelkwaliteit

Het type `PresenceObservationType` bevat onder meer springen/rollen, aasbellen/voedselactiviteit, de verouderde waarde aanbeten, recente vangst op de stek, geen waarnemingen en onbekend. De engine presenteert deze als context en kent er geen numerieke aanwezigheidsbonus aan toe. De code merkt expliciet op dat geen waarnemingen geen bewijs van afwezigheid is.

Er bestaat een afzonderlijke `PresenceObservation`-tabel met een timestamp. De synchronisatie vanuit de sessiesamenvatting maakt voor een nieuw waarnemingsrecord echter `session.updatedAt` tot timestamp. Dat is het registratiemoment van de sessiewijziging, niet aantoonbaar het fysieke waarnemingstijdstip. Bestaande eventtimestamps worden behouden. Het huidige type bevat ook geen afzonderlijk veld voor waarnemingsduur of herhaalde aantallen van hetzelfde type binnen één sessie.

De twee gecontroleerde hoofd-aanroeppaden zijn bovendien beperkt:
- Prognosepagina geeft de geselecteerde enkelvoudige `presenceObservation` door.
- VisCoach-planbuilder geeft `presenceObservation: 'onbekend'` door.
- De optionele array `options.observations` wordt wel door de engine naar de habitatmodule doorgegeven, maar wordt in deze twee gecontroleerde aanroeppaden niet gevuld.
- In de Prognosepagina-snapshot worden `observationIds` en `observationCount` op dit pad leeg/0 vastgelegd. De sessiesamenvatting wordt wel via de aparte synchronisatiehelper naar de waarnemingstabel gesynchroniseerd.

**Conclusie:** de huidige waarnemingslabels zijn bruikbaar als kwalitatieve sessiecontext, maar nog geen betrouwbare tijdgebonden trainingslabels voor een numerieke aanwezigheid- of voedingsrespons. Het fysieke waarnemingstijdstip moet worden onderscheiden van het moment waarop de sessie is bijgewerkt. De legacywaarde `aanbeten` moet niet als nieuw eventtype worden gebruikt; nieuwe aanbeten horen volgens het typecontract bij `bitesCount`.

### 189.4 Habitat-/bewegingsmodule

`habitatMovementEngine` levert primaire/alternatieve zones en beweging-/omgevingshypothesen, met confidence en expliciete ontbrekende informatie. Invoer omvat watertype, geregistreerde stekdiepte, habitatkenmerken/notities, thermische analyse, gekozen tijdvak, wind, druktrend, bewolking en waarnemingen. De engine waarschuwt zelf dat geen sonar of gedetailleerde bathymetrische bodemkaart beschikbaar is en dat het lokale bodemverloop ter plaatse moet worden vastgesteld.

De module is regel-/hypothesegebaseerd, niet een gekalibreerd kansmodel voor visaanwezigheid. Er bestaan vaste heuristische schakels zoals koud water onder 8 °C, voorjaarsopwarming vanaf 11 °C en warm water vanaf 18 °C. Deze zijn codevertakkingen/zoekhypothesen, geen gevalideerde biologische grenswaarden of numerieke habitatkans.

### 189.5 Rol in het geïntegreerde prognoseontwerp

- Persoonlijke vangstkans is een bestaande aparte numerieke uitkomst met eigen respons (vangst ≥1 per sessie), eigen invoerselectie en eigen Brier-validatie. Zij mag niet rechtstreeks worden opgeteld bij thermische activiteitspotentie.
- De persoonlijke kans is op dit moment niet methode-/aas-/tijdvakgespecificeerd. Dat is een inhoudelijke modelgrens die vóór toekomstige integratie expliciet moet worden beoordeeld; er wordt nu geen extra filter of correctie geïntroduceerd.
- Aanwezigheid en habitatbeweging zijn aparte responsen. De huidige labels en heuristische zone-uitvoer zijn nog onvoldoende tijdspecifiek en gekalibreerd voor een numerieke aanwezigheidsbijdrage.
- Een toekomstige lokale aanwezigheid-/bewegingslaag vereist betrouwbare eventtijdstempels, herhaalbare waarnemingen, expliciete niet-waargenomen/geen-detectie-status en validatie op latere waarnemingen. Geen-waarneming mag niet als afwezigheid worden gecodeerd.

**Vervolg:** controleer nu de resterende sessie-/vangstfeatures (techniek, aas/voer, hengeltype, aasrichting, voorvoer, aanbeten en vangsttijd) op feitelijke runtime-consumptie en snapshotprovenance. Daarna kan de eerste crosswalk worden afgesloten met een expliciete lijst van bestaande inputs die werkelijk actief zijn, alleen context blijven of pas na nieuwe lokale labels kandidaat zijn.

Geen runtimecode, types, database, snapshots, scoreformule, gewichten, drempels, bronstatus, UI, VisCoach-advies of gebruikersdata gewijzigd. Geen tests of biologische validatie geclaimd.


## 190. Runtime-mapping historische sessie- en vangstfeatures (22 november 2026)

**Scope:** read-only controle van de historische feature-snapshot, prognose-engine, rod-positioning-engine en prebait-engine. Dit vervolgt audit §179 en §189. De vraag is niet welke velden opgeslagen zijn, maar welke velden de huidige berekeningen daadwerkelijk consumeren.

### 190.1 Actief gebruikt in de huidige prognoseberekening

| Veld/bron | Feitelijk gebruik | Scope en beperking |
|---|---|---|
| Sessie-uitkomst, doelsoort, stek-ID | Selectie van afgeronde vergelijkbare sessies voor persoonlijke vangstkans | Soort + optionele exacte stek; benchmarks uitgesloten; vangstsessie vereist een vangstrecord van de doelsoort |
| Sessie-starttijd | Toewijzing aan één van vier tijdvakken voor `personalExperience` | Doelsoort + starttijdvak; geen stekfilter; geen vangstkans over het volledige sessie-interval |
| Werkelijke sessieduur / start- en eindtijd | Blootstellingsduur voor Poisson-vangsttempo en duurvalidatie | Alleen bekende, geldige duur telt; onbekend wordt niet als standaardduur ingevuld |
| Vangstsoort en aantal | Doelsoortsucces en totaal aantal vissen voor het vangsttempo | Bekende soort en bruikbaar aantal vereist; vangsttijd, aas en techniek veranderen de huidige Poisson-rate niet |
| Watertemperatuurmetingen | Recent lokaal meetanker en historische temperatuurprofielen/kalibratie | Eigen thermische gegevensstroom; bron, meetmoment en meetdiepte blijven relevant |
| Stek-waterdiepte, watertype, oeverrichting en habitatkenmerken | Thermische toestand, oeverwind, habitat- en positioneringshypothesen | Huidige stekconfiguratie; niet automatisch afgeleid uit historische sessievelden |
| Aasrichting (`baitDirection`) | Persoonlijke rod-positioning-nuance op dezelfde stek en doelsoort | Minimaal 11 voltooide relevante sessies, waarvan minimaal 6 met geldige richting; een richting moet minimaal 2 sessies hebben om in de vergelijking mee te doen |
| Voorvoerstatus (`prebaited`) en voeromschrijving als legacyfallback | Beschrijvende vergelijking van vangstsessies met/zonder voorvoeren in de prebaitmodule | Zelfde stek en doelsoort; minimaal 5 geclassificeerde sessies, met minimaal 2 per groep. De code noemt dit expliciet beschrijvend en niet-causaal. |
| Huidige techniek | Huidige prebait-/tactiekkeuze, onder meer method-feeder-vertakking | Geen historische techniekfilter of gevalideerde correctie op de persoonlijke vangstkans |

### 190.2 Wel opgeslagen in de reproduceerbare snapshot, maar niet als huidige voorspellende correctie gebruikt

De whitelisted `historicalSessionFeatures` bewaart onder meer techniek, aasrichting, voorvoerstatus, voeromschrijving, sessiewaterdiepte en temperatuurmeetmetadata. `historicalCatchFeatures` bewaart onder meer vangsttijd, aas, techniek, aantal, lengte/gewicht en kwaliteitsvlaggen. Dit is nuttige provenance en voorkomt informatieverlies; het betekent niet dat ieder veld al in de runtimeberekening wordt gebruikt.

In de gecontroleerde prognose-/tactiekengines is geen actieve correctie aangetroffen op basis van:
- hengeltype/rodTypes;
- sessietotalen `bitesCount` en `missedCount`;
- historische aas- of techniekcombinaties per vangst;
- vangsttijd als fijnmazig tijdvaklabel;
- historische sessiewaterdiepte als aparte habitatfeature;
- voorvoerdagen of exacte historische voorvoerhoeveelheden.

Deze velden mogen dus niet worden omschreven als reeds lerende of voorspellende factoren. Zij zijn hoogstens opgeslagen kandidaatdata voor later onderzoek, of worden buiten de prognose gebruikt in andere appfuncties.

### 190.3 Twee bestaande persoonlijke tactiekvergelijkingen

**Hengelpositionering:** de rod-positioning-engine vergelijkt op dezelfde stek en doelsoort de geregistreerde aasaanbiedingsrichting. De drempels zijn minimaal 11 relevante voltooide sessies en minimaal 6 met een geldige richting; per richting zijn minimaal 2 sessies nodig. Dit levert een persoonlijke nuance voor positioneringsadvies, niet een biologische activiteitsscore of vangstkanscorrectie.

**Voorvoeren:** de prebait-engine vergelijkt op dezelfde stek en doelsoort sessies met en zonder voorvoeren. De uitkomst wordt expliciet als beschrijvend en niet-causaal gepresenteerd. Wanneer de expliciete `prebaited`-boolean ontbreekt, gebruikt de code de tekst `baitAndFeed` als fallback door te zoeken naar het woorddeel “voorvoer”. De bestaande auditnotitie over het risico dat “geen voorvoer” hiermee onbedoeld als voorvoer wordt herkend blijft open; er is geen automatische herclassificatie uitgevoerd en geen gebruikersdata aangepast.

### 190.4 Datakwaliteits- en modelgevolg

1. Het huidige persoonlijke vangstmodel is een soort-/stek-/duur-baseline; niet een methode-, hengel-, aas- of tijdvakgestratificeerd model.
2. Aasrichting en voorvoerstatus worden al in beperkte, aparte tactiekmodules benut. Die beschrijvende vergelijkingen mogen niet zonder onafhankelijke toetsing als causale vangstbonus worden toegepast.
3. Techniek, hengeltype, aas/voer, aanbeten, gemiste vissen en vangsttijd zijn waardevolle toekomstige kandidaatfeatures, maar de huidige snapshotregistratie alleen maakt ze niet voorspellend.
4. Voor een toekomstige persoonlijke vangstlaag moeten sessie-inspanning, doelsoort, stek, duur, methode, materiaal, aas/voer, aanbeten en vangsten op vergelijkbare wijze worden vastgelegd. Selectieve invoer en confounding moeten expliciet worden onderzocht; geen extra verplichte velden toevoegen zonder productbesluit.
5. Vangsttijd en aanbeten kunnen een vangbaarheids-/tijdlabel ondersteunen, maar zijn geen directe meting van voedselopname of algemene visactiviteit.

### 190.5 Tussenconclusie van de runtime-mapping

De historische feature-snapshot is breder dan de actieve voorspellende runtime. De huidige actieve historische bijdragen zijn concreet: thermische meetgeschiedenis, persoonlijke soort-/stekvangstbaseline, starttijdvakervaring, aasrichting voor positionering en voorvoerhistorie voor een beschrijvende tactiekvergelijking. Een reeks andere opgeslagen velden wordt nog niet als voorspellende correctie benut.

Daarmee is de eerste factor-/respons-crosswalk op hoofdlijnen compleet: alle zichtbare factoren, aanvullende responsmodules, persoonlijke gegevenslagen en tactiekmodules hebben een expliciete huidige rol en grens. Dit betekent niet dat de geïntegreerde score al ontworpen, geïmplementeerd of gevalideerd is. De volgende stap is de crosswalk als geheel technisch nalopen op volledigheid en tegenstrijdigheden met de bestaande gesloten auditbesluiten, en daarna de resterende ontwerpbesluiten/uitvoeringspoorten rangschikken. Geen nieuwe brede literatuurzoektocht.

Geen runtimecode, types, database, snapshots, scoreformule, gewichten, drempels, bronstatus, UI, VisCoach-advies of gebruikersdata gewijzigd. Geen tests of biologische validatie geclaimd.


## 191. Consistentie-review factor-/respons-crosswalk tegen bestaande acceptatiecriteria (22 november 2026)

De nieuwe crosswalk §§186–190 is vergeleken met de bestaande factorinventaris §§89, 102 en 132, het scoredoel §103, de evaluatiegrenzen §131, de formele zevenpuntsacceptatie en de VisCoach-productroadmap.

### 191.1 Consistentie-uitkomst

Er is geen tegenstrijdig nieuw productdoel of tweede prognosemodel geïntroduceerd. De nieuwe crosswalk vult de bestaande inventaris aan met de actuele codeconsumptie en de concrete contracten van de huidige services.

| Bestaand criterium | Nieuwe dekking | Reviewuitkomst |
|---|---|---|
| 1. Eén doelrespons en gescheiden responsen | §§186.1–186.4, 189.5, 190 | Consistent met §103: de bestaande 1–10-score blijft biologische activiteit- en voedings-/foerageerpotentie. Persoonlijke vangstkans, habitat-aanwezigheid, vangbaarheid en datakwaliteit worden niet stilzwijgend in die respons gemengd. |
| 2. Bronkwaliteit en overdraagbaarheid | §§186.1–186.2, 187 | Consistent met §132: registry is bewijsadministratie; 94 records, 0 numeriek goedgekeurd. De thermische curve blijft uitsluitend de eerder geaccepteerde voorlopige prior. |
| 3. Water- en omgevingsdata | §§186.2, 186.4–186.5, 190 | Consistent met §§153–156: temperatuurprovenance en tijdstipgerichte thermische verwerking blijven eigen technische poort; wind/druk/regen/bewolking zijn geen automatische biologische effecten. Ontbrekende lokale zuurstof, stroming, troebelheid en prooigegevens blijven onbekend. |
| 4. Tijdvak- en soortgedrag | §§186.2, 187–188, 192 | Direct voedingsritme blijft onderscheiden van foerageren, locomotie en habitat. Er bestaat nog geen gevalideerde biologische tijdvakrangschikking. |
| 5. Lokale leer- en evaluatieketen | §§189–190 | Brier/BSS blijft uitsluitend voor persoonlijke vangstkans; temperatuurfoutmaten uitsluitend voor de thermische schatter. Directe lokale activiteit-/voedings-/habitatlabels ontbreken. |
| 6. Gebruiksvriendelijkheid en VisCoach | §§188, 190, 192 | Consistent met de VisCoach-roadmap: Prognose blijft de bron van prognostische uitkomsten; VisCoach vertaalt deze naar één samenhangend advies- en tactiekplan. Geen tweede VisCoach-prognose. Voorvoerhoeveelheden/gating en optionele hengel-/methodepreset blijven aparte productbesluiten. |
| 7. Technische borging | Alle nieuwe controles zijn read-only | Geen codewijziging of Quality Gate geclaimd. Eventuele toekomstige codewijzigingen vereisen diff-review, regressietests en groene gates op exacte PR-head en mergecommit. |

### 191.2 Nog open formele Fase 2-poorten

1. De ene bestaande 1–10-score is nog niet samengesteld uit de uiteindelijke evidence-backed responsbijdragen; alleen de voorlopige thermische prior is actief.
2. Geen numerieke voedings-/foerageerbron is goedgekeurd; soort-/levensfase-/watertypeoverdracht blijft per respons begrensd.
3. Er ontbreken directe lokale biologische labels voor thermische activiteit, voedselopname/foerageren, habitat-aanwezigheid en tijdvakvoorkeur. Deze ontbreken blokkeren numerieke validatie, niet het documenteren van het ontwerp.
4. De tijdvakscore is nog geen volledig gevalideerde tijdvakrespons en de geplande sessie wordt nog niet als interval gescoord.
5. De voorvoergrammen en confidence-gating en de optionele herbruikbare hengel-/methodepreset blijven afzonderlijke eigenaar-/productbesluiten. Ze worden niet in de biologische totaalscore verwerkt.
6. De bestaande waterthermische tijdstipuitvoer vraagt nog een gerichte as-of-/fallbackcontrole voordat zij als tijdspecifieke input voor een intervalscore wordt hergebruikt (zie §192).

**Reviewbesluit:** de eerste factor-/respons-crosswalk is inhoudelijk volledig op hoofdlijnen en consistent met de bestaande product- en acceptatiebesluiten. De crosswalk vervangt §§89/102/132 niet; zij actualiseert de code-/runtime-contractlaag. Werkonderdeel 8 kan als read-only audit- en contractonderzoek worden gesloten zodra het intervalcontractvoorstel in §192 is vastgelegd. Fase 2 zelf blijft open; Fase 3 blijft geblokkeerd.


## 192. Minimaal contractvoorstel voor prognose over het geplande VisCoach-sessie-interval (22 november 2026)

**Status:** ontwerpvoorstel op basis van bestaande contracten; geen runtimebesluit of implementatie. De Prognosepagina blijft de algemene dag-/tijdvakprognose. VisCoach blijft de advieslaag die de prognose-uitkomsten gebruikt. De intervalscore hoort bij de bestaande prognoseketen en vormt geen afzonderlijke VisCoach-prognose.

### 192.1 Bestaande contracten die moeten worden hergebruikt

- De VisCoach-interface heeft al gewenste starttijd en optionele gewenste eindtijd; de maximale bekende sessieduur is 24 uur.
- De planbuilder geeft de berekende duur door aan de persoonlijke vangstkans en bewaart start/einde in PendingPrognosisSnapshot.targetWindowStart/targetWindowEnd en de inputfingerprint.
- PrognosisInputContext bewaart de exacte intervalgrenzen nog niet als expliciete velden. De intervalgrenzen staan dus wel in de snapshot en fingerprint, maar niet volledig in de modelinvoercontext.
- targetTimeSlot wordt uit de starttijd bepaald en is alleen tactische startcontext. Het is geen sessie-intervalscore.
- calculateDayPrognosis berekent één Amsterdamse kalenderdatum; de tijdvakscore gebruikt representatieve tijdpunten. De geplande intervalgrenzen worden niet gebruikt om de thermische of biologische score over de volledige sessie te segmenteren.
- De volledige uurlijkse weersreeks wordt in de snapshot als weatherInput bewaard. De provider levert maximaal acht forecastdagen; het sessie-interval is maximaal 24 uur.
- resolveSelectedTimeSlot kan alleen één tijdvak teruggeven wanneer de hele sessie daarin past. Bij tijdvakoverschrijding geeft het geen tijdvak terug; bij datumoverschrijding ondersteunt het geen algemene segmentberekening.
- timeSlotExposureEngine segmenteert geregistreerde hengeluren over tijdvakken, datumgrenzen en DST. Dit is een technische referentie voor intervalsegmentatie, maar de uitkomst is hengelblootstelling en mag niet als biologische score worden gebruikt.

### 192.2 Eerst te bewaken thermische tijdstipbeperking

De huidige waterThermalEngine accepteert targetTime en beperkt de chronologische weatherSinceAnchor-reeks tot en met dat doelmoment. Dat is echter nog geen volledige garantie dat iedere thermische uitvoer strikt as-of dat tijdstip is:
- De dagelijkse dayAvg, dayMin, dayMax, gemiddelde wind, bewolking en straling worden uit de volledige forecast van de doeldag berekend, ook wanneer deze waarden ná targetTime liggen.
- De 24-/72-uursvensters voor de fallback-/trendberekening zijn aan 12:00 lokale doeldag gekoppeld, niet aan het expliciete targetTime.
- Bij een bruikbaar meetanker, bekende waterdiepte en voldoende weersdekking gebruikt de uiteindelijke ankergestuurde temperatuurupdate wel de chronologische uren tot targetTime. Andere paden (onder meer zonder passend anker of met onvoldoende dekking) kunnen de volledige daggemiddelden en noon-gecentreerde vensters gebruiken voor de geschatte temperatuur. Trend-/contextmetadata gebruiken eveneens dagbrede waarden.
- De bestaande regressietest controleert een stabiele reeks vanaf een meetanker en dat een forecast opgehaald ná het prognoseberekeningstijdstip wordt geweigerd. Zij controleert niet dat het wijzigen van weeruren ná een vroeg targetTime de temperatuur op dat eerdere tijdstip onveranderd laat.

**Vereiste vóór intervalhergebruik:** maak de doelmomentberekening strikt tijdgebonden: alle forcings en rolling 24-/72-uursvensters die de toestand op targetTime beïnvloeden, moeten eindigen op dat doelmoment. Dagbrede samenvattingen mogen als afzonderlijke dagcontext behouden blijven, maar mogen geen toekomstige uren gebruiken om een eerdere thermische toestand te berekenen. Voeg een metamorfische regressietest toe: wijzig alleen weersuren ná het doelmoment en controleer dat de thermische toestand op het eerdere doelmoment niet verandert. Test dit voor meetanker, historisch profiel en weer-only/fallbackroutes, plus ontbrekende uren en forecast-as-of.

Dit is een concrete aanvullende auditbevinding, geen claim dat iedere bestaande temperatuuruitkomst fout is. De ankergestuurde route met voldoende dekking heeft al een chronologische update; de fallbackroutes en dagbrede metadata moeten expliciet worden begrensd.

### 192.3 Voorgesteld minimaal intervalcontract

1. **Eén bron van waarheid voor het interval:** hergebruik targetWindowStart en targetWindowEnd. Neem dezelfde waarden ook expliciet op in PrognosisInputContext zodat de snapshot de gebruikte modelinvoer volledig kan reproduceren. Maak geen parallel VisCoachPrognosis- of tweede intervalobject.
2. **Tijdsemantiek:** bewaar absolute ISO-instanties met ondubbelzinnige Amsterdamse lokale interpretatie; segmentatie gebruikt absolute tijd en Europe/Amsterdam-grenzen. DST, middernacht en datumovergangen worden expliciet getest.
3. **Onbekende eindtijd:** wanneer de gebruiker geen eindtijd invult, blijft de sessieduur onbekend. Er wordt geen standaardduur aangenomen en geen volledige intervalscore of alternatieve-duurvergelijking verzonnen. De prognose kan de gekozen starttijd en beschikbare dag-/tijdvakcontext tonen; VisCoach kan dit vertalen naar een eerste plan.
4. **Bekend interval:** wanneer start en einde bestaan, segmenteer het volledige interval op de grenzen van beschikbare uurlijkse forecaststappen, bestaande zesuurs-tijdvakken en lokale kalenderdatums. Elk segment krijgt een exacte begin-/eindtijd en werkelijke duur; gedeeltelijke eerste/laatste uren tellen alleen voor hun overlapduur.
5. **Doorlopende thermische toestand:** bereken thermische toestand chronologisch vanaf hetzelfde laatst geldige meetanker door de sessie heen. Start niet elk segment opnieuw vanaf de oorspronkelijke meting. Gebruik alleen weerforcings tot het betreffende doelmoment; pas §192.2 eerst toe.
6. **Responsresolutie respecteren:** thermische/weather-input mag de beschikbare uurlijkse resolutie gebruiken. Direct voedings-/foerageerbewijs mag alleen op de tijdsresolutie van de bron worden toegepast (bijvoorbeeld dagdeel of dag); een coarse bron wordt niet kunstmatig tot een uurpiek geïnterpoleerd.
7. **Scorecompositie:** de uiteindelijke biologische activiteit-/voedingspotentie wordt per segment uit dezelfde toegelaten factorarchitectuur opgebouwd. Een sessie-uitkomst wordt over de feitelijke segmentduur beoordeeld; een factor met dagresolutie wordt niet viermaal als onafhankelijke bonus geteld. De precieze normalisatie, responsfuncties en gewichten blijven onderdeel van de aparte scoremodelreview en worden hier niet ingevuld.
8. **Dekking en ontbrekende gegevens:** leg per factor/segment vast welke data beschikbaar zijn, welke duur wordt gedekt en welke onzekerheid geldt. Ontbrekende segmenten zijn onbekend, niet neutraal. Een totaalscore wordt alleen getoond wanneer de later vast te stellen coverage-/kwaliteitsregel dit toestaat; er wordt nu geen willekeurige minimumdekking gekozen.
9. **Alternatief vergelijken:** vergelijk alleen intervallen met dezelfde duur, soort, stek en vergelijkbare forecast-as-of. Bij marginale verschillen of overlappende onzekerheid blijft de oorspronkelijke gebruikersplanning leidend. Een numerieke verschilgrens wordt pas na scorekalibratie en eigenaarbesluit vastgesteld.
10. **Verantwoordelijkheden:** de prognose-engine levert de intervalgebonden biologische uitkomst, factorbijdragen, dekking en onzekerheid. VisCoach vertaalt dit naar het samenhangende verhaal, timingadvies en tactiek. Persoonlijke Poisson-vangkans blijft een aparte uitkomst en wordt niet bij de biologische score opgeteld.

### 192.4 Technische uitvoeringsvarianten

| Variant | Werking | Beoordeling |
|---|---|---|
| A. Alleen bestaande zesuurs-tijdvakken naar overlapduur middelen | De sessie wordt geknipt op Nacht/Ochtend/Middag/Avond; ieder segment gebruikt de bestaande representatieve tijdvakuitkomst. | Kleinste eerste wijziging, maar grof: een sessie van één uur kan dezelfde factorwaarde krijgen als een heel dagdeel en de representatieve tijdpuntscore is niet automatisch een intervalrespons. Alleen bruikbaar als expliciet tijdelijke coarse fallback met zichtbare resolutiebeperking. |
| B. Hybride tijdsegmenten op uurlijkse forecaststappen plus tijdvak-/datumgrenzen | De thermische toestand en weersinput volgen uurlijkse stappen; biologische voedings-/foerageerbronnen behouden hun eigen grovere bronresolutie. Segmentbijdragen worden naar werkelijke overlapduur samengebracht. | **Voorkeursrichting voor het uiteindelijke contract.** Sluit aan op beschikbare forecastresolutie, voorkomt een geforceerde enkelvoudige winnaar en laat per factor de echte bewijsresolutie zien. Vereist eerst de strikte as-of-fix/test uit §192.2 en een goedgekeurde score-/coveragearchitectuur. |

### 192.5 Volgorde vóór implementatie

1. Sluit de strict-as-of-test voor alle thermische tijdstiproutes.
2. Leg intervalgrenzen vast in PrognosisInputContext en bevestig replay-/fingerprintcompatibiliteit; geen tweede intervalbron.
3. Ontwerp de pure segmentatiehelper met Amsterdamse tijd, DST, middernacht, gedeeltelijke uren en ontbrekende forecaststappen.
4. Definieer per factor welke resolutie zij werkelijk ondersteunt en hoe segmentdekking/ontbrekende data worden gerapporteerd.
5. Pas daarna een kandidaat intervalscore toe binnen de bestaande prognose-engine en toets deze tegen de bestaande dag-/thermische baseline. Geen scoreformule, gewichten of drempels zonder afzonderlijke goedkeuring en validatie.

**Status werkonderdeel 8:** de read-only factor-/respons-crosswalk en het intervalcontractvoorstel zijn uitgewerkt. Werkonderdeel 8 kan als audit-/ontwerponderdeel worden afgesloten; de genoemde thermische as-of-correctie, intervalscore, geïntegreerde score en tests zijn afzonderlijke vervolgwerkzaamheden en zijn niet uitgevoerd.

Geen runtimecode, types, database, snapshots, scoreformule, gewichten, drempels, UI, VisCoach-advies of gebruikersdata gewijzigd. Geen tests uitgevoerd; geen biologische validatie geclaimd. Fase 2 blijft open en Fase 3 blijft geblokkeerd.


## 193. Correctie actuele status voorvoer-confidence-gating en punt 5 (22 november 2026)

De consistentie-review in §191.2 noemde voorvoergrammen en confidence-gating nog als afzonderlijke open eigenaar-/productbesluiten. Dat is te breed en wordt hierbij gecorrigeerd op basis van de reeds bestaande formele besluiten en technische validatie in §§163–170.

### 193.1 Wat al is besloten en afgerond

- In §163 heeft de eigenaar expliciet besloten de bestaande prebait-engine en alle huidige temperatuurbanden, suitabilitywaarden, soortfactoren, berekende grammen, campagneplanning en persoonlijke vergelijkingen te behouden.
- De eigenaar heeft uitsluitend een presentatielaag-gate goedgekeurd: exacte grammen in PrognosisView alleen bij confidenceLevel Redelijk; bij Matig/Laag blijven timing en kwalitatieve uitleg zichtbaar, maar niet de exacte hoeveelheden.
- §170 bevestigt dat punt 5 technisch is afgerond. De plannerregressietest had 9 geslaagde assertions; de VisCoach-sessieadviestest had 75 geslaagde assertions; typecheck, overige Quality Gate-tests, productiebuild en private-artifactcontrole waren groen op de vastgelegde main-commit.
- De huidige code is opnieuw gecontroleerd: PrognosisView verbergt campagne- en sessiegrammen bij Matig/Laag. VisCoach toont campagnegrammen alleen bij Redelijk en sessiegrammen alleen bij Redelijk én een expliciet bekende positieve sessieduur.
- Redelijk betekent uitsluitend dat een meting watertemperatuur, watertype en positieve stekdiepte beschikbaar zijn. Het is geen biologische validatie van de temperatuurgrenzen, soortfactoren of gramhoeveelheden.
- Bij ontbrekende sessieduur gebruikt de prebait-engine intern nog een technische standaard van 3 uur voor een niet-zichtbare sessiehoeveelheid. VisCoach toont die hoeveelheid niet zonder expliciete duur. De algemene Prognosepagina heeft een zichtbare duurselector met standaard 3 uur. Deze bestaande semantiek staat al beschreven in §164.3 en wordt niet gewijzigd.

### 193.2 Wat nog open is — en wat niet

**Niet meer open:** de eigenaarbeslissing over confidence-gating en de technische implementatie daarvan. Punt 5 mag niet opnieuw als open werk worden ingepland.

**Wel blijvend begrensd:** de bestaande numerieke voorvoerheuristiek is geen gevalideerde biologische norm. De eigenaar heeft besloten de engine-uitvoer te behouden; dit verleent geen wetenschappelijke goedkeuring aan de exacte hoeveelheden. De heuristiek blijft een afzonderlijke tactiek-/advieslaag buiten de biologische 1–10-score.

**Nog apart open:** de optionele herbruikbare hengel-/methodepreset. De algemene Prognosepagina kan een techniek kiezen; de huidige VisCoach-intake vraagt geen techniek en geeft daardoor geen gekozen method-feedertechniek aan de prebait-engine door. Dit is een afzonderlijk UX-/productbesluit, geen reden om een verplichte invoer toe te voegen of de biologische score te blokkeren.

### 193.3 Correctie op de uitvoeringsvolgorde

De regel in VISLOGBOEK_VERBETERPLAN.md dat punt 5 nog startklaar is, is verouderd. Punt 5 is al afgesloten in §170. De volgende nieuwe technische poort uit deze audit is de strikte targetTime-as-of-invariant in §192.2, vóór intervalscoring. De bestaande normalisatie-/coverage-architectuur in §171 en label-/evaluatiematrix in §§172–173 blijven leidend; deze worden niet opnieuw ontworpen.

Geen engineparameters, gramwaarden, confidence-regels, UI, gebruikersdata of code gewijzigd. Geen nieuwe tests uitgevoerd. Deze correctie heropent punt 5 niet; Fase 2 blijft open en Fase 3 geblokkeerd.


## 194. Gerichte as-of-audit van thermische targetTime en regressietestvoorstel (22 november 2026)

**Scope:** read-only code- en testinspectie van waterThermalEngine.ts en test-thermal-and-prognosis.ts. Geen code- of testwijziging.

### 194.1 Wat al correct tijdgebonden is

- Een meetanker ná het gevraagde doelmoment wordt uitgesloten.
- De ankergestuurde reeks weatherSinceAnchor bevat uitsluitend geldige weeruren ná het meetanker en tot en met estimationTargetMs, gesorteerd op absolute tijd.
- Bij een bekend meetanker, bekende waterdiepte en voldoende weersdekking wordt de uiteindelijke thermische toestand stap voor stap met die chronologische reeks bijgewerkt.
- Forecastdata waarvan de payload-as-of aantoonbaar later is dan het berekeningstijdstip wordt door de bestaande prognoseketen geweigerd.

Dit zijn bestaande waarborgen en moeten bij een correctie behouden blijven.

### 194.2 Gevonden targetTime-afwijking in fallback- en contextpaden

Na de chronologische weatherSinceAnchor-selectie bouwt de engine ook dagbrede kenmerken op:
- dayAvg, dayMin en dayMax gebruiken alle geldige temperatuururen van de volledige doeldag;
- dayAvgWind gebruikt alle geldige winduren van de doeldag;
- zonnestraling, bewolking, dauwpunt en verdampingspotentieel gebruiken dagbrede of volledige 08:00–18:00-vensters;
- de 24-/72-uursgemiddelden worden berekend rond 12:00 lokale doeldag, niet rond het expliciete targetTime.

Deze dagbrede kenmerken worden gebruikt voor trend-/contextuitvoer en in de fallbackschatting zonder passend ankergestuurd pad. Daardoor is de temperatuuruitvoer niet voor alle invoercombinaties strikt invariant voor weersuren ná targetTime. Bij een vroeg doelmoment kunnen latere uren van dezelfde dag in dayAvg en de noon-gecentreerde vensters terechtkomen; bij een doelmoment na 12:00 zijn de rolling windows niet exact de 24/72 uur vóór dat doelmoment.

**Reikwijdte:** dit bewijst niet dat elke bestaande tijdvaktemperatuur fout is. De normale ankergestuurde route met bekende diepte en voldoende dekking verwerkt de temperatuur chronologisch tot het doelmoment. De concrete zwakke plekken zijn de weather-only/historisch-profiel-fallbacks, de route met onbekende diepte en onvoldoende ankerdekking, en dagbrede context die als tijdstipcontext kan worden gelezen.

### 194.3 Wat de huidige test wel en niet bewijst

In test-thermal-and-prognosis.ts scenario 8.3 wordt één stabiele forecastreeks met een echt meetanker gebruikt voor middag, avond en volgende ochtend. Dit test gedeeld meetanker, chronologische ankergestuurde verwerking en het ontbreken van een abrupte temperatuurval. Scenario 8.3.4 test dat een forecastpayload die na calculatedAt is opgehaald niet wordt gebruikt.

Scenario 8.4 test een weather-only schatting met constante temperatuur, wind en bewolking. Deze tests wijzigen geen forecasturen ná targetTime terwijl de uren tot targetTime identiek blijven. Zij bewijzen daarom niet dat een vroegere doeltemperatuur onafhankelijk is van latere forecasturen.

### 194.4 Vereiste metamorfische regressietest

Maak voor hetzelfde targetDate, targetTime, calculatedAt, forecastAsOf, locatie en overige invoer twee forecastreeksen:
- reeks A: de volledige basisreeks;
- reeks B: identiek tot en met targetTime, maar met sterk afwijkende temperatuur, wind, bewolking en straling uitsluitend ná targetTime.

De volgende tijdspecifieke uitkomsten moeten in beide runs gelijk blijven: estimatedWaterTemp, estimatedRange, waterTemperatureStatus, anchorMeasurementTimestamp en de thermische factor-/activityScore op dat doelmoment. Een afzonderlijke dagbrede samenvatting mag veranderen, maar moet als dagcontext herkenbaar blijven en mag de eerdere thermische toestand niet beïnvloeden.

Voer deze invariant uit voor minimaal:
1. vers meetanker + bekende waterdiepte + volledige dekking;
2. oud meetanker + bekende diepte + voldoende dekking;
3. geen meetanker + historisch temperatuurprofiel;
4. geen meetanker + weer-only fallback met voldoende voorafgaande historie;
5. meetanker + onbekende diepte;
6. meetanker + bekende diepte maar onvoldoende dekking, inclusief de fallback die daarna wordt gekozen;
7. targetTime vóór 12:00, exact 12:00 en na 12:00;
8. ontbrekende uren en beide DST-overgangen met absolute tijdstempels;
9. forecastAsOf vóór/na calculatedAt, los van de targetTime-cutoff.

Aanvullende rolling-windowassertions moeten bewijzen dat 24/72 uur eindigt op het exacte targetTime, niet op 12:00. Uren na targetTime mogen niet in die historische vensters worden opgenomen.

### 194.5 Minimaal correctieprincipe

- Houd de bestaande canonieke waterThermalEngine en de correcte ankergestuurde chronologische route intact.
- Scheid dagbrede beschrijvende statistiek van tijdstipgebonden toestandsberekening.
- Laat alle tijdstipgebonden forcings en rolling windows eindigen op het gevraagde doelmoment.
- Wanneer een fallback onvoldoende voorafgaande dekking heeft, gebruik geen latere uren om de eerdere toestand te reconstrueren; behoud de bestaande onbekend-/historisch-profiel-/ruime-onzekerheidsstatus volgens expliciete regels.
- Pas geen nieuwe tijdconstanten, diepteklassen, temperatuurcorrecties of biologische gewichten toe.

**Vervolg:** de testgevallen zijn nu inhoudelijk afgebakend. De eerstvolgende codehandeling zou een gerichte test-first wijziging in de bestaande engine zijn, gevolgd door de minimale correctie die nodig is om de invarianten te laten slagen. Daarvoor is een normale codewijzigingsworkflow nodig; deze read-only audit heeft geen branch, code of tests aangepast.

Geen runtimecode, tests, types, scoreformule, parameters, gewichten, database, snapshots, UI of gebruikersdata gewijzigd. Fase 2 blijft open; Fase 3 blijft geblokkeerd.



## 195. Implementatie en CI-validatie van de targetTime-as-of-correctie (22 november 2026)

**Scope:** minimale correctie in de bestaande `waterThermalEngine` op de afzonderlijke auditbranch. Geen scoreformule, gewichten, thermische tijdconstanten, diepteklassen, gebruikersdata of UI gewijzigd.

### 195.1 Uitgevoerde correctie

- Bij een expliciet `targetTime` worden de doeldagkenmerken voor temperatuur, wind, bewolking, zonnestraling, luchtvochtigheid en dauwpunt uitsluitend opgebouwd uit forecasturen tot en met dat doelmoment.
- De tijdstipgebonden 24-/72-uursvensters eindigen nu op het exacte `targetTime`; uren ná het doelmoment kunnen niet meer in de tijdstiptrend of weather-only fallback terechtkomen.
- De bestaande dagbrede verwerking blijft behouden wanneer geen expliciet `targetTime` is opgegeven. Ook de oude intervalgrenzen voor die dagbrede modus blijven behouden.
- Voor een vroeg doelmoment met minder dan zes uren op de doeldag wordt voldoende voorafgaande 72-uursdekking benut. Zonder die dekking blijft de bestaande veilige fallback voor onvoldoende gegevens gelden.
- De ankergestuurde chronologische extrapolatie, bestaande temperatuurcorrecties en numerieke scoregewichten zijn niet gewijzigd.

### 195.2 Regressiebewijs

Scenario 8.5 in `test-thermal-and-prognosis.ts` vergelijkt twee identieke forecastreeksen tot en met 23 oktober 2026 15:00 lokale tijd. Alleen latere uren worden extreem gewijzigd. Alle vier assertions slagen:
1. weather-only watertemperatuurschatting blijft gelijk;
2. thermische trend en trendbetrouwbaarheid blijven gelijk;
3. extrapolatie vanaf een echt meetanker blijft gelijk;
4. trend en trendbetrouwbaarheid met een echt meetanker blijven gelijk.

De bestaande gelijke-tijdvaktest gebruikt nu een werkelijk stabiele meerdaagse weerreeks. Daardoor toetst zij gelijke omstandigheden in plaats van een doeldag met een echte temperatuurontwikkeling te behandelen alsof elk tijdvak dezelfde toestand moet hebben.

### 195.3 Quality Gate

GitHub Actions Quality Gate run **1096** op branch `audit/thermal-asof-regression`, commit `b23340b33d9288af16d2c3d27296601032bdc53c`:
- TypeScript typecheck: geslaagd.
- Amsterdam timezone/DST-regressietests: geslaagd.
- Kernprognose- en thermische tests: **71 geslaagd, 0 mislukt**.
- Overige prognose-, biologische evidence-, waterthermische, historie-, backup-, sessie-, VisCoach- en voorvoertests: alle geslaagd.
- Productiebuild: geslaagd.
- Controle dat private artefacten ontbreken in de productiebuild: geslaagd.
- Dependency-audits: geslaagd.

### 195.4 Afbakening en resterend bewijs

Deze correctie sluit de aangetoonde future-weather leakage voor de geteste weather-only en meetankerroute. Zij is geen bewijs dat alle combinaties uit §194.4 al afzonderlijk zijn getest. Nog gericht te valideren vóór de intervalscore als volledig afgedekt wordt beschouwd: historisch temperatuurprofiel, onbekende diepte, onvoldoende dekking/fallback, targetmomenten vóór en exact op 12:00, ontbrekende uren en thermische DST-grensgevallen. De bestaande Amsterdamse timezone/DST-suite is groen, maar vervangt deze gerichte thermische combinatietests niet.

PR #214 blijft draft en is niet gemerged. De auditbranch blijft afgescheiden van `main`; er is niets naar `main` gemerged. Geen gebruikersdata of database-inhoud gewijzigd.

**Status:** de minimale as-of-correctie en bijbehorende CI-poort zijn groen. De bredere randgevallenmatrix uit §194.4 blijft open; intervalscoring en Fase 3 blijven geblokkeerd totdat de resterende validatie en formele Fase 2-acceptatie zijn afgerond.



## 196. Uitbreiding targetTime-randgevallenmatrix — test-first (22 november 2026)

Na de minimale correctie uit §195 is de regressiematrix uitgebreid in `test-thermal-and-prognosis.ts` (scenario 8.6). Dit is uitsluitend testcode; de thermische productie-engine is in deze stap niet gewijzigd.

Toegevoegde assertions:
- Onbekende stekdiepte: weer-only temperatuur, trend en trendbetrouwbaarheid blijven invariant bij wijziging van forecasturen ná het doelmoment.
- Historisch seizoensprofiel: een echte meting die pas na het doelmoment/de doeldag plaatsvindt, mag niet in het historische profiel terechtkomen.
- Onvoldoende weersdekking: minder dan zes doeldaguren en onvoldoende voorafgaande 72-uursdekking blijven leiden tot de bestaande veilige status 'Onvoldoende gegevens'; latere uren vullen die dekking niet aan.
- Expliciete doelmomenten 08:00, 12:00 en 15:00: wijziging van uitsluitend latere forecasturen mag temperatuur, trend en trendbetrouwbaarheid niet wijzigen.
- Ontbrekend uur vóór het doelmoment: een datagat mag geen toekomstige weersinformatie laten doorlekken.
- DST-herfstovergang (25 oktober 2026, tweede 02:30 met expliciete +01:00-offset) en lenteovergang (29 maart 2026, 03:30 met expliciete +02:00-offset): de as-of-invariant wordt gecontroleerd met absolute tijdstempels.

**Validatiestatus:** alle aanvullende assertions zijn uitgevoerd in GitHub Actions Quality Gate run **1107** (22 november 2026), branch `audit/thermal-asof-regression`, run-id `45074092372`. Scenario 8.5 en 8.6 zijn volledig groen; de kernprognose-/thermische suite eindigde op **80 geslaagd, 0 mislukt**. De volledige Quality Gate is groen. De matrix dekt nu de hierboven genoemde routes, maar sluit niet automatisch alle denkbare combinaties of alle forecastproviders af.

Geen runtimecode, scoreformule, biologische parameters, gewichten, gebruikersdata, database, snapshots of UI gewijzigd in deze testuitbreiding. PR #214 blijft draft en niet gemerged; `main` blijft ongemoeid. Fase 2 en de as-of-randgevallenpoort blijven open.



### 196.1 Verfijning van de metamorfische mutatie en actuele branchstatus

De testmutatie is verder aangescherpt: voor uren ná het doelmoment worden niet alleen luchttemperatuur, bewolking en wind gewijzigd, maar ook zonnestraling, relatieve luchtvochtigheid en dauwpunt. Daarmee worden alle weercontextvelden geraakt die de thermische engine in de doeldagcontext kan gebruiken.

De actuele branch-head na deze verfijning is `1bc478dff195a5dd20cbcef511da020e1233b083`. Voor deze head is op dit moment geen bijbehorende GitHub Actions-run of commitstatus beschikbaar via de repositorystatuscontrole. De aanvullende matrix blijft daarom **onbevestigd / niet groen** totdat de tests daadwerkelijk op deze commit zijn uitgevoerd. De eerder groene Quality Gate 1096 geldt uitsluitend voor de eerdere testset en mag niet als validatie van scenario 8.6 worden gepresenteerd.



### 196.2 Quality Gate 1107 — aanvullende matrix volledig groen

Na de registratie in §196.1 is Quality Gate run **1107** gestart en succesvol afgerond op commit `cbc7140da786e70f8d8aa40e1ed31f93ff22c850` (run-id `45074092372`).

- TypeScript typecheck: geslaagd.
- Amsterdam timezone/DST-regressietests: geslaagd.
- Kernprognose- en thermische suite: **80 geslaagd, 0 mislukt**.
- Scenario 8.5: alle vier bestaande as-of-assertions geslaagd.
- Scenario 8.6: alle negen aanvullende assertions geslaagd, inclusief onbekende diepte, historisch profiel, onvoldoende dekking, 08:00/12:00/15:00, ontbrekend uur en lente-/herfstovergang.
- Alle overige biologische, thermische, historie-, Brier-, sessie-, VisCoach-, backup-, veiligheid- en voorvoertests: geslaagd.
- Productiebuild: geslaagd.
- Controle op uitsluiting van private artefacten uit productiebuild: geslaagd.
- Dependency-audits: geslaagd.

De testmutatie verandert na targetTime luchttemperatuur, bewolking, wind, zonnestraling, relatieve luchtvochtigheid en dauwpunt. De tests bevestigen dat de thermische uitkomst op het doelmoment gelijk blijft wanneer alleen deze latere invoer verandert.

**Conclusie:** de expliciet geplande targetTime-as-of-randgevallenmatrix uit §196 is technisch gevalideerd. Dit sluit uitsluitend deze auditpoort; het is geen formele afronding van Fase 2 en geen toestemming om de PR te mergen. PR #214 blijft draft; `main` is niet gewijzigd.



## 197. Contractaudit geplande sessiegrenzen in PrognosisInputContext (22 november 2026)

**Scope:** read-only controle van `PrognosisInputContext`, `buildVisCoachPlan`, snapshotopslag en de evaluatievergelijking. Geen runtimecode of types gewijzigd.

### 197.1 Wat al bestaat

- `VisCoachPlanInput` ontvangt `desiredStartTime` en optioneel `desiredEndTime`.
- `buildVisCoachPlan` valideert de volgorde en maximale duur van 24 uur en normaliseert de waarden naar absolute ISO-instanties met `start.toISOString()` en `end?.toISOString() ?? null`.
- `PendingPrognosisSnapshot` en `PrognosisSnapshot` bewaren `targetWindowStart` en `targetWindowEnd` op snapshotniveau.
- `saveVisCoachPlan` geeft dezelfde velden door aan `savePrognosisSnapshot`; de sessiestartopslag geeft ze eveneens door vanuit de pending snapshot.
- `evaluationEngine.getTimeWindowComparison` gebruikt deze snapshotvelden voor vergelijking van geplande en werkelijke start-/eindtijd. Oude snapshots zonder intervalgrenzen vallen terug op het bestaande tijdvakcontract.
- De inputfingerprint van VisCoach neemt momenteel zowel `inputContext` als de genormaliseerde `desiredStartTime`/`desiredEndTime` op. De exacte grenzen worden dus al in de fingerprint vastgelegd, maar buiten `PrognosisInputContext`.

### 197.2 Vastgestelde lacune

`PrognosisInputContext` bevat op dit moment geen `targetWindowStart` of `targetWindowEnd`. Daardoor bewaart de snapshot de intervalgrenzen wel als evaluatiemetadata en fingerprintinput, maar niet als expliciet onderdeel van de gestructureerde modelinvoercontext. Dit is precies de contractlacune uit §192.1.

### 197.3 Minimaal compatibel contract

- Voeg optionele `targetWindowStart?: string` en `targetWindowEnd?: string | null` toe aan `PrognosisInputContext`. Optioneel houdt oude snapshots zonder deze velden geldig; er is geen database-migratie nodig voor deze type-uitbreiding.
- Gebruik bij een nieuwe VisCoach-run één paar genormaliseerde ISO-waarden als bron: `targetWindowStart = start.toISOString()` en `targetWindowEnd = end?.toISOString() ?? null`. Vul daarmee zowel de context als de bestaande top-level snapshotvelden.
- Een onbekende eindtijd blijft expliciet `null`; `sessionDurationHours` blijft `null` en de bestaande opslag-sentinel `durationHours: 0` blijft alleen opslagsemantiek, geen voorspelde duur.
- Behoud top-level `PrognosisSnapshot.targetWindowStart/End` voor bestaande evaluatiecode en legacy snapshots. Dit zijn compatibele projecties van hetzelfde canonieke interval, geen tweede intervalbron.
- `targetTimeSlot` blijft uitsluitend tactische startcontext en wordt niet hergebruikt als intervalgrens.
- `historyFingerprint` blijft ongewijzigd: intervalgrenzen zijn run-/planningsinvoer, geen historische vangst- of meetgeschiedenis.
- De bestaande fingerprint bevat de grenzen al buiten `inputContext`. Na toevoeging aan de context moet de test bewijzen dat dezelfde genormaliseerde waarden in beide representaties staan en dat een gewijzigd interval een andere fingerprint oplevert. Er is geen noodzaak om bestaande opgeslagen fingerprints te herschrijven.

### 197.4 Nog te toetsen vóór implementatie

1. Oude snapshots zonder contextvelden blijven deserialiseren en evalueren via de top-level velden/legacy tijdvakfallback.
2. Nieuwe snapshots bevatten identieke ISO-grenzen in `inputContext` en top-level snapshotvelden.
3. Zonder eindtijd worden `targetWindowEnd: null`, `sessionDurationHours: null`, `durationKnown: false` en `durationHours: 0` consistent bewaard.
4. Verschillende start- of eindtijden veranderen de inputfingerprint; dezelfde genormaliseerde tijden leveren dezelfde fingerprint op.
5. De bestaande evaluatie blijft uitsluitend de top-level snapshotgrenzen gebruiken en behoudt de legacy fallback voor oude snapshots.
6. Tijdzonegedrag van de huidige `new Date(datetime-local)`-invoer en `inputContext.timezone` moet expliciet worden vastgelegd. De UI levert lokale datum/tijdstrings, terwijl de service de runtime-/apparaatzone rapporteert; dit moet vóór verdere Amsterdamse segmentatie worden beoordeeld. Geen stille timezone-aanname introduceren.

**Conclusie:** de intervalgrenzen bestaan al in snapshot- en evaluatiecontracten; de minimale volgende wijziging is ze ook expliciet op te nemen in `PrognosisInputContext`, met dezelfde canonieke ISO-waarden en optionele backward-compatible velden. Eerst test-first valideren; nog geen segmentatiehelper of intervalscore implementeren.

Geen runtimecode, types, database, snapshots, fingerprintdata of gebruikersdata gewijzigd. De targetTime-as-of-poort uit §§195–196 is groen. Fase 2 blijft open; Fase 3 blijft geblokkeerd.



### 197.5 Minimale contextimplementatie en teststatus

De contractuitbreiding is nu minimaal geïmplementeerd op de auditbranch:
- `PrognosisInputContext` heeft optionele `targetWindowStart` en `targetWindowEnd`-velden gekregen; bestaande snapshots blijven daarmee structureel compatibel.
- `buildVisCoachPlan` normaliseert start/einde één keer naar `targetWindowStart`/`targetWindowEnd` en gebruikt exact dezelfde waarden voor context, fingerprintinput, pending snapshot en geretourneerd plan.
- De bestaande top-level snapshotvelden en de bestaande evaluatiefallback zijn niet gewijzigd.
- `historyFingerprint`, databaseschema, migraties, scoreberekening en intervalsegmentatie zijn niet gewijzigd.

In `test-session-snapshot-commit.ts` is een regressietest toegevoegd die de echte VisCoach-planbuilder met een lokale weerscache uitvoert. De test controleert context/top-level gelijkheid, bekende duur, exacte fingerprintpayload, fingerprintwijziging bij een ander eindmoment en het behoud van een onbekende eindtijd als `null`/onbekende duur. De bestaande legacy snapshotfixtures blijven zonder deze optionele velden bestaan.

**Validatiestatus:** GitHub Actions Quality Gate run **1117** is volledig groen (run-id `45074683749`). Typecheck, alle bestaande tests, de nieuwe `test-session-snapshot-commit.ts`-checks (19 geslaagd, 0 mislukt), productiebuild, private-artifactcontrole en dependency-audits zijn geslaagd. De run valideerde de code/testcommit `95753d5bdaf921ee613ca3b90b34dd48871293b5`; de daaropvolgende wijzigingen zijn uitsluitend documentatie.



### 197.6 Quality Gate 1117 — intervalcontext volledig groen

GitHub Actions Quality Gate run **1117** (run-id `45074683749`) is succesvol afgerond op commit `95753d5bdaf921ee613ca3b90b34dd48871293b5`.

- TypeScript typecheck: geslaagd.
- Amsterdam timezone/DST-regressies: geslaagd.
- Alle bestaande prognose-, biologische evidence-, thermische, historie-, Brier-, VisCoach-, backup- en veiligheidstests: geslaagd.
- `test-session-snapshot-commit.ts`: **19 geslaagd, 0 mislukt**. Alle nieuwe planbuilder-, intervalcontext-, fingerprint- en onbekende-eindtijdassertions slagen.
- Productiebuild en private-artifactcontrole: geslaagd.
- Dependency-audits: geslaagd.

De Quality Gate valideerde de code- en testwijzigingen. De daaropvolgende commits op de auditbranch wijzigen uitsluitend documentatie. PR #214 blijft draft en niet gemerged; `main` is ongemoeid.

**Status werkonderdeel 2 van §192.5:** de canonieke intervalgrenzen staan nu ook expliciet in `PrognosisInputContext`, met backward-compatible optionele velden en een groene regressiepoort. De volgende stap is de pure segmentatiehelper uit §192.5 stap 3, maar pas nadat het Amsterdamse tijdzonecontract voor datetime-local-invoer als ontwerpregel is vastgelegd. De intervalscore en Fase 3 blijven geblokkeerd.



## 198. Tijdzonecontract voor geplande VisCoach-intervallen (22 november 2026)

**Scope:** read-only controle van de VisCoach-`datetime-local`-invoer, normalisatie en bestaande Amsterdamse tijdhelpers. Geen UI- of tijdzonecode gewijzigd.

### 198.1 Feitelijk bestaand gedrag

- `VisCoachView` vult de invoervelden met lokale apparaattijd en gebruikt HTML `datetime-local`; de ruwe waarde bevat geen offset.
- `buildVisCoachPlan` parseert deze invoer met `new Date(...)`. Daarmee wordt de wall-clock invoer geïnterpreteerd in de runtime-/apparaatzone.
- De service normaliseert de resulterende absolute momenten naar ISO UTC (`toISOString()`) en bewaart de gebruikte runtimezone in `PrognosisInputContext.timezone`.
- De doelkalenderdatum en de tijdvakindeling worden afzonderlijk in `Europe/Amsterdam` bepaald. Ook de weerprovider levert tijden voor `Europe/Amsterdam`.
- De centrale `parseAppTimestamp` interpreteert legacy tijdzone-loze timestamps als Amsterdamse wall time; de nieuwe geplande intervalgrenzen zijn echter ISO UTC met expliciete `Z` en worden dus als absolute instanties gelezen.

### 198.2 Vastgelegd contract voor segmentatie

Voor de bestaande VisCoach-invoer behouden we het huidige invoergedrag; deze audit verandert geen scherm of gebruikersverwachting.

1. De wall-clock waarde uit `datetime-local` wordt volgens de runtime-/apparaatzone geïnterpreteerd. De daadwerkelijk gebruikte zone staat in `inputContext.timezone`.
2. Direct na parsing worden start en einde absolute ISO-instanties. Dit paar is canoniek voor duur, volgorde, snapshot, fingerprint en replay.
3. Alle intervalrekenkunde gebruikt absolute milliseconden/ISO-instanties; een ISO-UTC-waarde wordt nooit opnieuw als lokale wall time geïnterpreteerd.
4. Kalenderdatum, Nacht/Ochtend/Middag/Avond en segmentgrenzen op Amsterdamse dag-/tijdvakovergangen worden berekend in `Europe/Amsterdam`, passend bij de weerprovider en de bestaande prognosekalender.
5. Bij DST kan de elapsed duur verschillen van het verschil tussen lokale kloklabels. De werkelijke absolute duur is leidend; de bestaande maximumduur van 24 elapsed uren blijft gelden.
6. De runtimezone blijft provenance van de invoer, niet een tweede modeltijdzone. De segmenthelper gebruikt expliciet de Amsterdamse tijdzone voor kalender-/tijdvaklabels.

**Begrenzing:** op apparaten buiten `Europe/Amsterdam` wordt een `datetime-local`-waarde momenteel als apparaattijd ingevoerd, terwijl de prognosekalender Amsterdam gebruikt. Dat is bestaand gedrag en wordt hier niet stilzwijgend gewijzigd. Een eventuele wijziging naar vaste Amsterdamse invoer vraagt een afzonderlijk UX-/productbesluit.

**Conclusie:** het huidige contract is voldoende eenduidig voor een pure segmentatiehelper zolang deze uitsluitend absolute intervalgrenzen gebruikt en expliciet `Europe/Amsterdam` voor lokale segmentlabels toepast. De volgende stap is test-first implementatie van die helper; geen score of biologische factor wordt in deze helper berekend.



## 199. Pure intervalsegmentatiehelper — implementatie en validatievoorstel (22 november 2026)

**Scope:** pure technische helper voor de reeds bestaande geplande intervalgrenzen. Geen prognosescore, factorweging, UI, database of biologische responsberekening.

### 199.1 Implementatie

Nieuw bestand: `src/services/prognosisIntervalEngine.ts`.

De helper `segmentPrognosisInterval`:
- accepteert de canonieke absolute ISO-start-/eindtijd uit §197 en de bestaande uurlijkse forecastreeks;
- weigert ongeldige intervallen en intervallen langer dan 24 verstreken uren;
- geeft bij een onbekende eindtijd expliciet `unknown_end` terug met nul segmenten en null-duur/dekking;
- knipt het interval op absolute uurgrenzen, waardoor gedeeltelijke eerste en laatste uren hun werkelijke overlapduur behouden;
- labelt elk segment met de Amsterdamse kalenderdatum en het bestaande tijdvak (Nacht/Ochtend/Middag/Avond);
- koppelt alleen de forecastsample die het absolute uur vanaf zijn timestamp vertegenwoordigt;
- maakt ontbrekende forecasturen expliciet onbekend; een sample wordt nooit over een ontbrekend uur heen doorgetrokken of geïnterpoleerd;
- behandelt dubbele samples voor hetzelfde absolute uur als ambigu/ontbrekend in plaats van willekeurig één sample te kiezen;
- rapporteert totale, gedekte en ongedekte minuten plus een ruwe tijdsdekkingratio.

De Amsterdamse datum-/tijdvakgrenzen vallen op absolute uurgrenzen; de uurlijkse segmentatie splitst daardoor ook correct op lokale middernacht en de zesuursgrenzen, inclusief 23-/25-uurs DST-dagen. De helper gebruikt absolute ISO-instanties voor duur en overlap en `Europe/Amsterdam` uitsluitend voor lokale labels.

### 199.2 Afbakening

De dekkingratio is uitsluitend temporele aanwezigheid van een forecastsample. Dit is nog geen factor-specifieke dekking: bijvoorbeeld zonnestraling of dauwpunt kan per sample ontbreken en moet later per factor worden beoordeeld. De helper levert geen neutrale factorwaarde, geen biologische score en geen sessieadvies. De bestaande Prognose-engine blijft de enige scorebron; VisCoach blijft de consument/vertaler.

### 199.3 Teststatus

`test-session-snapshot-commit.ts` is uitgebreid met tests voor gedeeltelijke uren, lokale tijdvak-/middernachtgrenzen, ontbrekende uren, herfst- en lente-DST, onbekende eindtijd, ongeldige intervallen, dubbele uurstempels, maximale 24-uursduur en het niet aanvullen van gaten met forecasturen ná het interval.

De eerste volledige testpoging (Quality Gate 1131) vond één onjuiste testverwachting: een interval van 60 minuten bevatte 30 minuten dekking en 30 minuten ontbrekende dekking, niet 60 minuten ontbrekende dekking. De implementatie was correct; de testverwachting is gecorrigeerd. Quality Gate **1132** is daarna volledig groen: typecheck, alle suites, productiebuild, private-artifactcontrole en dependency-audits geslaagd. `test-session-snapshot-commit.ts`: **30 geslaagd, 0 mislukt**.

**Status:** pure segmentatiehelper en beschreven randgevallenmatrix technisch groen. Er is geen score- of biologische code aangesloten op de helper.



## 200. Factorresolutie en datadekking vóór intervalintegratie

**Scope:** read-only audit van de bestaande `analyzeTimeSlot`- en tactische contextpaden in `prognosisEngine.ts`. Doel is bepalen welke bestaande informatie per segment kan worden opgehaald, zonder scores of gewichten te veranderen.

### 200.1 Huidige resolutie per factor/module

| Factor/module | Huidige tijdresolutie | Huidige beschikbaarheidsregel | Huidige score-/rolstatus |
|---|---|---|---|
| Watertemperatuur / thermische activiteitspotentie | Per bestaand 6-uurs tijdvak; thermische analyse voor een tijdvak gebruikt het middelste beschikbare forecastmoment als `targetTime` | Eigen waterThermalEngine-anker-, historie- en weersdekkingregels | Enige factor die de huidige activiteitsscore numeriek bepaalt |
| Luchtdruk | Per 6-uurs tijdvakgemiddelde; trend rond één representatief tijdstip | Minimaal 3 geldige drukmetingen in het 6-uurs tijdvak; trend zoekt een huidige meting binnen 30 min en een eerdere meting rond 12 uur ervoor (tolerantie 3 uur) | Context; score 0 |
| Wind | Per 6-uurs tijdvakgemiddelde en dominante richting | Minimaal 3 geldige records met snelheid, richting en richtingslabel | Context; score 0 |
| Bewolking | Per 6-uurs tijdvakgemiddelde | Minimaal 3 geldige records | Context; score 0 |
| Neerslag | Per 6-uurs tijdvaksom | Minimaal 3 geldige records | Context; score 0 |
| Seizoen | Kalendermaand/-seizoen voor de prognosedatum | Deterministisch uit datum | Altijd context beschikbaar; score 0 |
| Tijdstip/licht | Tijdvak plus soortspecifieke diel-context en optionele civiele schemering | Tijdvak/datum; schemering via locatiecoördinaten en dagelijkse zondata | Context; score 0 |
| Persoonlijke ervaring per tijdvak | Historische sessies gegroepeerd op starttijdvak | Alleen vergelijkbare, afgeronde sessies; percentage pas bij minimaal 5 relevante sessies | Afzonderlijke ervaringstekst, geen thermische score |
| Persoonlijke vangkans | Geplande sessieduur plus historische sessies/vangsten | Alleen geldige sessies met bekende duur en bruikbare uitkomst; anders null/onvoldoende data | Eigen Poisson-kans, niet optellen bij activiteitsscore |
| Aanwezigheidswaarneming | Door gebruiker vastgelegd moment/waarneming | Alleen expliciete waarneming | Kwalitatieve context, geen numerieke bonus |
| Windkant/oeverrelatie | Huidig tactisch starttijdvak | Winddekking, temperatuurcontext, locatie-/watertype en oeveroriëntatie | Tactisch advies, geen activiteitsscore |
| Habitat-/visbeweging | Huidig tactisch starttijdvak plus waarnemingen/historie | Afhankelijk van wind, thermische context, wolken, druktrend, locatie en waarnemingen | Tactische hypothese/advies, geen activiteitsscore |
| Hengelpositionering | Datum, volledige forecastreeks en gekozen tactisch tijdvak | Afhankelijk van locatie, thermische context, wind en historie | Tactisch advies, geen activiteitsscore |
| Voorvoerplan | Doeldatum, beschikbare dagen vooraf, soort en optionele sessieduur | Soortondersteuning en planinvoer | Afzonderlijke tactiek, geen activiteitsscore |
| Hengelblootstelling | Werkelijk geregistreerde hengelactieve intervallen | Alleen expliciete rod-active intervals | Achteraf beschrijvend; geen prognose-input |

### 200.2 Belangrijke scheiding: dagslots versus geplande sessie

De huidige `calculateDayPrognosis` maakt vier vaste tijdvakken. De factorbreakdown gebruikt per tijdvak de beschikbare weersrecords en vaste drempels. Een expliciet VisCoach-starttijdvak beperkt de tactische weercontext tot dat starttijdvak; het geplande eindmoment wordt nog niet gebruikt om wind-, druk-, wolken-, habitat- of positioneringscontext over de volledige sessie te middelen.

De nieuwe segmentatiehelper uit §199 levert daarom nog geen factorwaarden. Hij levert alleen de tijdssegmenten, de Amsterdamse labels en de aanwezigheid/afwezigheid van een forecastrecord per uur. De huidige factorbeschikbaarheid kan niet zonder meer op de segmenten worden gekopieerd: sommige factoren vragen meerdere samples of een voorafgaande 12-uursmeting; andere gebruiken locatie/historie of een andere tijdsresolutie.

### 200.3 Regels voor volgende factorresolutie

1. Behoud bestaande factorsemantiek en drempels; verander ze niet door de segmentatie alleen.
2. Leg per factor vast welke velden vereist zijn, welke geldige waarden tellen, welke historische lookback nodig is en welke minimale dekking geldt.
3. Scheid `weatherAvailable` van `factorAvailable`; één aanwezig forecastrecord betekent niet dat druktrend, windrichting of alle andere velden bruikbaar zijn.
4. Factoren met een context-/adviesrol blijven niet-numeriek zolang er geen onderbouwde biologische scorefunctie bestaat.
5. Thermische activiteitspotentie, persoonlijke vangkans, aanwezigheid, habitatbeweging, hengelpositionering en voorvoeradvies blijven afzonderlijke uitkomsten; niet optellen tot één ongedefinieerde totaalscore.
6. Het bestaande 3-uit-6 tijdvakminimum is een huidige datakwaliteitsregel, geen automatisch minimum voor een kortere geplande sessie. Voor een intervalregel moet de betekenis per factor apart worden vastgesteld.
7. Geen factor krijgt een intervalbonus, -malus of gewicht in deze stap.

**Conclusie:** de segmentatiehelper is een tijds-/dekkingslaag. De volgende technische audit moet per factor de invoervelden, lookback, tijdresolutie en beschikbaarheidsregel mappen naar de segmenten. Pas daarna kan worden bepaald welke bestaande context zinvol per interval kan worden samengevat. De score blijft ongewijzigd.



## 201. Factor-specifieke invoervelden en lookback-contracten

**Scope:** nadere read-only uitwerking van de bestaande validatie en lookback in `prognosisEngine` en `waterThermalEngine`. Geen drempels aangepast.

### 201.1 Weervelden en huidige validatie

| Veld | Huidige geldigheidsrange | Huidige rol |
|---|---:|---|
| Luchttemperatuur | -30 tot 55 °C | Input voor thermische waterontwikkeling; geen vervanging voor watertemperatuur |
| Luchtdruk | 850 tot 1100 hPa | Tijdvakgemiddelde en aparte druktrend |
| Windsnelheid | 0 tot 200 km/u | Tijdvakgemiddelde en tactische windcontext |
| Windrichting | 0 tot 360° plus niet-lege richtingslabel | Vereist voor windrichting-/oevercontext |
| Neerslag | 0 tot 300 mm per uurrecord | Tijdvaksom/context |
| Bewolking | 0 tot 100% | Tijdvakgemiddelde en lichtcontext |
| Relatieve luchtvochtigheid | 0 tot 100% | Thermische weerschatting/context, indien aanwezig |
| Dauwpunt | -50 tot 50 °C | Thermische weerschatting/context, indien aanwezig |
| Zonnestraling | 0 tot 1600 W/m² | Thermische weerschatting/context, indien aanwezig |

### 201.2 Lookback en beschikbaarheid

- De bestaande tijdvakfactoren druk, wind, neerslag en bewolking tellen geldige records binnen het volledige vaste 6-uurs tijdvak. De huidige minimumdrempel is `ceil(6/2) = 3` records.
- Wind vereist in dezelfde records zowel een geldige snelheid als geldige richting en een niet-leeg richtingslabel. Alleen een snelheidsmeting is niet voldoende voor de bestaande windfactor.
- De expliciete VisCoach-starttijdvakcontext gebruikt een eigen regel: als er minder dan zes forecastrecords bestaan, moet ieder beschikbaar record voor de betreffende wind-/bewolkingscontext geldig zijn; de UI-/analysecontext vermeldt dat het tijdvak onvolledig is. Dit is geen algemene regel voor een willekeurig kort interval.
- Druktrend is geen simpele tijdvakgemiddelde: er moet een actuele drukmeting binnen 30 minuten van het representatieve doelmoment bestaan en een eerdere drukmeting binnen 3 uur van het richtpunt 12 uur daarvoor.
- De thermische wateranalyse gebruikt een eigen chronologische 24-/72-uursdekking en wateranker-/diepte-/historiepad. De tijdvakprognose kiest nu één representatief forecastmoment (middelste beschikbare uur) als `targetTime`; dit is niet hetzelfde als ieder intervalsegment afzonderlijk doorrekenen.
- Zonnestraling, luchtvochtigheid en dauwpunt zijn optionele velden. Hun afwezigheid mag niet worden geïnterpreteerd als een gemeten nulwaarde; de thermische engine gebruikt alleen geldige aanwezige waarden.
- Persoonlijke ervaring gebruikt sessies die op het betreffende tijdvak zijn gestart; de 5-sessiedrempel geldt voor het tonen van een catch-rate percentage, niet als universele minimumdekking voor alle factoren.

### 201.3 Intervalmapping zonder nieuwe aannames

Voor een toekomstig interval moeten we de bestaande veldvalidatie behouden, maar de dekkingsnoemer aanpassen aan de werkelijke segmentduur. Dat betekent niet dat de huidige 3-uit-6 drempel automatisch 50% van een korte sessie wordt. Per factor moet expliciet worden gekozen of:
- een geldig sample voor een uursegment voldoende is voor uitsluitend beschrijvende context;
- meerdere samples/lookback nodig blijven (zoals druktrend en thermische waterontwikkeling);
- de factor op een ander niveau blijft (per tijdvak, per kalenderdag of sessiebreed);
- ontbrekende optionele velden alleen die factor onbekend maken, zonder andere factoren te blokkeren.

Er is nog geen minimumpercentage voor intervaldekking gekozen en er is geen biologische drempel of weging afgeleid. Die keuzes blijven open totdat de factoren afzonderlijk zijn gemapt en gevalideerd.

**Conclusie:** de generieke segmentdekking kan niet rechtstreeks als factorbeschikbaarheid worden gebruikt. De volgende stap is per factor een formele resolutie-/dekkingregel vastleggen en pas daarna testen welke samenvattingen voor een sessie-interval technisch en inhoudelijk verantwoord zijn.


## 202. Formele factorresolutiematrix voor geplande sessie-intervallen

**Werkpakket 13 — read-only architectuur- en codeaudit (23 november 2026).** Deze matrix zet de bestaande factorcontracten uit §§200–201 om naar een expliciete keuze voor tijdresolutie bij een gepland interval. De statuskolom maakt onderscheid tussen wat de huidige code daadwerkelijk doet en wat alleen een kandidaat voor latere intervalintegratie is. Er zijn geen runtimebestanden, scores, drempels of gebruikersgegevens gewijzigd.

### 202.1 Beslisregels

1. De bestaande Prognosepagina blijft de enige berekeningsbron; VisCoach consumeert en verwoordt de uitkomsten.
2. De generieke uursegmentatie uit §199 bepaalt uitsluitend intervalgrenzen en aanwezigheid van forecastrecords. Zij verleent geen factorbeschikbaarheid.
3. Bestaande resolutie en semantiek blijven leidend totdat een afzonderlijk testbaar intervalcontract is goedgekeurd.
4. Een factor mag alleen op een fijnere resolutie worden berekend als de vereiste invoer en lookback op die resolutie beschikbaar en gevalideerd zijn. Een uurrecord is niet automatisch voldoende voor een factor die meerdere waarnemingen of historische context vereist.
5. Ontbrekende invoer blijft per factor onbekend; geen nulinvulling, interpolatie, forward-fill of neutrale biologische aanname.
6. Factoren met verschillende rollen worden niet gemiddeld of opgeteld. Thermische activiteitspotentie, persoonlijke vangkans, persoonlijke ervaring, aanwezigheid en tactische adviezen blijven afzonderlijke uitkomsten.
7. Deze matrix kiest nog geen intervaldekkingspercentage, minimumaantal samples voor kortere intervallen, weging of biologische correctie.

### 202.2 Factorresolutiematrix

| Factor/module | Huidige code-resolutie en bron | Benodigde invoer / lookback | Besluit voor intervalresolutie | Ontbrekende of ongeldige data | Rol en status |
|---|---|---|---|---|---|
| Watertemperatuur / thermische activiteitspotentie | Per vast 6-uurs tijdvak; `analyzeTimeSlot` gebruikt het middelste beschikbare forecastmoment als `targetTime`; `waterThermalEngine` rekent met meetanker, historie en weer | Geldige watermeting/geschikte schatting, locatie-/dieptecontext waar vereist, chronologische weerdata tot targetTime en eigen 24-/72-uurslookback | **Kandidaat: per uursegment een afzonderlijke thermische toestand op een expliciet gekozen representatief tijdstip.** De precieze timestampconventie en aggregatie over de sessie zijn nog open; niet simpelweg het bestaande 6-uursresultaat kopiëren | Segment zonder bruikbare thermische toestand blijft onbekend; ontbrekende lookback wordt niet met weer ná targetTime aangevuld | Enige bestaande numerieke activiteitsscore. Kandidaat voor intervaluitwerking, nog niet aangesloten |
| Luchtdruk (absolute context) | Gemiddelde per vast 6-uurs tijdvak in `analyzeTimeSlot` | Geldige drukmetingen 850–1100 hPa; huidige vaste slotdrempel 3 van 6 | **Huidig contract behouden als tijdvakcontext.** Een intervaloverzicht mag tijdvakken afzonderlijk tonen; geen nieuw uursegmentgemiddelde zonder eigen dekkingsregel | Onvoldoende geldige samples = onbekend voor dit tijdvak; de 3-uit-6-drempel niet automatisch verkleinen voor korte intervallen | Niet-numerieke weerscontext |
| Druktrend | Eén representatief doelmoment; `findPressureTrend` zoekt actuele meting binnen 30 min en eerdere meting rond 12 uur ervoor (±3 uur) | Twee geldige drukmetingen met expliciete chronologische relatie | **Tijdstipgebonden context met voorafgaande lookback**, niet een sessiegemiddelde. Per segment alleen kandidaat als beide meetpunten voor dat segment bestaan | Zonder actueel of historisch meetpunt blijft trend onbekend; nooit trend afleiden uit alleen het sessie-interval | Niet-numerieke context; lookback kan vóór sessiestart liggen |
| Wind / windrichting | Gemiddelde en dominante richting per 6-uurs slot; tactische VisCoach-route gebruikt gekozen starttijdvak met eigen volledigheidsregel | Geldige snelheid 0–200 km/u én richting 0–360° en niet-leeg richtingslabel; bestaande slotregel of expliciete startslotregel | **Twee gescheiden contracten behouden:** slotfactor blijft tijdvakgebonden; tactische wind blijft voorlopig starttijdvakgebonden. Per-segmentwind is alleen een kandidaat voor beschrijvende context na een aparte dekkingstest | Snelheid zonder richting/label is geen bruikbare windfactor; onvoldoende samples = onbekend. Geen windrichting afleiden uit gemiddelde of ontbrekende records | Niet-numerieke context; tactische relatie met oever blijft aparte module |
| Bewolking | Gemiddelde per vast 6-uurs tijdvak; tactische route gebruikt gekozen startslot | Geldige bewolking 0–100%; huidige 3-uit-6 slotregel of expliciete startslotregel | **Slotgebonden voor bestaande factor; startslotgebonden voor huidige tactische context.** Per segment alleen kandidaat als beschrijvende uurcontext, niet als biologische score | Onvoldoende geldige records = onbekend; geen nulwaarde bij ontbrekende bewolking | Niet-numerieke weers-/lichtcontext |
| Neerslag | Som per vast 6-uurs tijdvak | Geldige neerslag 0–300 mm per uurrecord; huidige 3-uit-6 slotregel | **Tijdvakgebonden behouden.** Een sessiesom is alleen kandidaat als de volledige intervaldekking en semantiek van de neerslagrecords expliciet zijn vastgesteld; huidige code levert geen gevalideerde intervalsom | Onvoldoende geldige records = onbekend; ontbrekende uren niet als droog/nul tellen | Niet-numerieke weerscontext |
| Seizoen | Kalendermaand/-seizoen van prognosedatum in Amsterdamse context | Geldige lokale kalenderdatum | **Kalenderdaggebonden.** Bij een interval over lokale middernacht mag het label per datum wisselen; geen sessiegemiddelde van seizoenen | Ongeldige datum = onbekend; normale geldige datum is deterministisch beschikbaar | Niet-numerieke context, score 0 |
| Tijdstip / diel- en lichtcontext | Bestaand tijdvak plus soortspecifieke diel-tekst; optionele civiele schemering uit datum, breedtegraad en zonsopkomst/-ondergang | Amsterdamse lokale datum/tijdvak; zondata en locatie voor civiele schemering; bronstatus van soortspecifiek bewijs | **Tijdvak-/segmentgebonden context met kalenderdagafhankelijke zonmomenten.** Segmentlabels kunnen de bestaande tijdvakcontext bepalen, maar geven geen voedingspiek of scorebonus | Ontbrekende zondata/locatie maakt schemering onbekend; niet-goedgekeurd bewijs blijft beschrijvend | Niet-numerieke context; voedingsritme alleen toepassen bij passend goedgekeurd direct voedingsbewijs |
| Persoonlijke ervaring | Historische sessies gegroepeerd op **sessiestarttijdvak** | Afgeronde, vergelijkbare sessies met bekende doelsoortuitkomst; minimaal 5 voor catch-rate-percentage | **Sessie-starttijdvak behouden.** Niet herverdelen over alle tijdvakken die een lange sessie doorkruist; geen kunstmatige verdeling van één sessie over meerdere segmenten | Minder dan 5 vergelijkbare sessies: aantallen/context mogen zichtbaar blijven, percentage blijft null | Persoonlijke ervaringsuitkomst, niet de thermische score |
| Persoonlijke vangkans / Poisson | Sessiebreed; historische vangsttempo λ uit geldige sessies met bekende duur en vangstaantallen, toegepast op geplande sessieduur | Minimaal 5 vergelijkbare sessies én 5 sessies met bekende duur en bruikbare aantallen; geplande duur bekend; centrale weer-/thermische datakwaliteit moet bruikbaar zijn | **Sessiebreed behouden.** Gebruik de canonieke intervalduur; geen segmentkansen optellen of tijdvakscore als numerieke correctie gebruiken | Onbekende eindtijd/duur of onvoldoende historie = null; geen standaardduur in VisCoach | Afzonderlijke persoonlijke uitkomst; geen activiteitsscore en geen gevalideerde koppeling met thermiek/habitat |
| Aanwezigheidswaarnemingen | Expliciete gebruikerswaarneming; aanwezigheidstekst wordt als context doorgegeven | Waarnemingstype en tijdstempel; waarnemingen kunnen aan sessie of stek gekoppeld zijn | **Gebeurtenis-/tijdstempelresolutie.** Alleen waarnemingen die aantoonbaar bij de sessie/periode horen mogen later als intervalcontext worden samengevat; huidige code kent geen numerieke intervalscore | Geen waarneming betekent onbekend, niet afwezig; geen waarneming is geen bewijs van afwezigheid | Kwalitatieve context, geen bonus/malus |
| Windkant/oeverrelatie | Huidig tactisch starttijdvak; `analyzeBankWind` vertaalt windrichting naar fysieke oeverrelatie | Windrichting/snelheid, geregistreerde oeverkijkrichting en watertype; thermische context en seizoen voor duiding | **Voorlopig starttijdvakgebonden.** Een wisselende wind tijdens de sessie kan later als afzonderlijke segmentcontext worden getoond, maar de bestaande module levert geen tijdreeks van oeveradviezen | Zonder oeveroriëntatie of geldige wind geen vaste oeverrelatie; stromend water blijft onderscheiden | Tactische uitleg/positionering, niet numeriek |
| Habitat-/visbeweging | Eén analyse met datum/seizoen, thermische toestand, gekozen targetSlot, lokale habitat en waarnemingen; weercontext komt uit gekozen tactische periode | Watertype, diepte/habitatkenmerken, thermische context, wind/bewolking/druktrend en expliciete waarnemingen/historie | **Voorlopig starttijdvak + sessie-/locatiecontext.** Geen per-uur habitatverandering fabriceren. Een segmentgerichte update is kandidaat voor later, alleen wanneer de vereiste context per segment aantoonbaar beschikbaar is | Ontbrekende watertype-/diepte-/wind-/licht-/thermische context verlaagt confidence of laat onderdelen onbekend; directe waarneming blijft onderscheiden | Tactische hypothese/advies, geen activiteitsscore |
| Hengelpositionering | Eén advies per prognoserun; ontvangt dagforecast, thermische analyse, historie en targetSlot | Locatie, waterdiepte/-type, habitat, thermiek, wind en relevante historie | **Voorlopig gekozen starttijdvak.** Niet middelen over sessie; eventuele herziening per segment is een latere product-/architectuurbeslissing | Ontbrekende context verlaagt confidence; geen default stek of viszone invullen | Tactisch advies, geen activiteitsscore |
| Voorvoerplan | Doeldatum en planningscontext; beschikbare dagen vooraf, soort, thermische basis en optionele sessieduur | Doeldatum, planningDate, beschikbare voorvoerdagen, soort, watertemperatuurstatus, watertype/diepte, techniek | **Doeldag-/campagnegebonden, niet sessiesegmentgebonden.** Starttijd of uursegment verandert de bestaande campagneplanning niet | Onvoldoende thermische basis/watertype/diepte leidt tot ontbrekende of afgeschermde hoeveelheden volgens bestaand contract | Afzonderlijke tactiek; niet optellen bij activiteitsscore |
| Hengelblootstelling | Werkelijk geregistreerde rod-active intervallen, achteraf | Expliciete begin-/eindtijden van hengelactiviteit en sessiecontext | **Werkelijk interval achteraf.** Niet gebruiken als forecastinput en niet verwarren met gepland interval | Onvolledige of buiten-sessie intervallen blijven als datakwaliteitsprobleem herkenbaar | Beschrijvende sessieanalyse, geen prognosefactor |

### 202.3 Uitkomst: wat kan wel en niet naar intervalniveau?

**Vastgesteld als bestaande/veilige resolutie:**
- Thermische respons blijft targetTime-gebonden en heeft per berekening de eigen 24-/72-uurslookback. De huidige score is nog per 6-uurs tijdvak.
- Druktrend blijft een tijdstipmeting met voorafgaande lookback; absolute druk, wind, bewolking en neerslag behouden voorlopig hun bestaande 6-uurs factorcontract.
- Seizoen is kalenderdagcontext; diel/licht is tijdvak-/datumcontext.
- Persoonlijke ervaring blijft gekoppeld aan het starttijdvak van historische sessies.
- Persoonlijke vangkans blijft één sessiebrede Poisson-uitkomst op basis van geplande duur.
- Aanwezigheid blijft een expliciete waarnemingsgebeurtenis.
- Oeverwind, habitat en positionering blijven tactische uitkomsten voor het gekozen starttijdvak.
- Voorvoer blijft een doeldag-/campagne-uitkomst; hengelblootstelling blijft achteraf.

**Alleen kandidaat voor vervolgonderzoek, nog niet besloten:**
- Thermische toestand per uursegment berekenen en vervolgens een sessie-uitkomst samenvatten. Eerst timestampconventie, overlapduur, meetankersemantiek, ontbrekende segmenten en aggregatiecontract vaststellen.
- Wind, bewolking en eventueel neerslag als beschrijvende segmentcontext tonen, mits de factorvelden afzonderlijk geldig zijn. Dit maakt ze nog geen scorefactor.
- Druktrend per segment bepalen wanneer zowel het actuele als het voorafgaande meetpunt aanwezig zijn.
- Waarnemingen aan de geplande sessie koppelen op basis van hun echte tijdstempel.

**Niet verantwoord op basis van de huidige code:**
- De vier bestaande 6-uurscores simpelweg middelen naar de sessieduur.
- De bestaande 3-uit-6 drempel automatisch omzetten naar een percentage voor korte intervallen.
- Een ontbrekend uur als nulweer of neutrale factor behandelen.
- Een sessie-ervaring over alle doorkruiste tijdvakken verdelen.
- Segmentvangstkansen optellen of thermiek, wind, licht, habitat en persoonlijke vangkans tot één ongedefinieerde totaalscore samenvoegen.
- Een uursegment gebruiken als vervanging voor de 12-uurs druktrend of 24-/72-uurs thermische lookback.

### 202.4 Besluit en vervolgpoort

De matrix is een **auditbesluit over behoud van bestaande semantiek**, geen definitieve goedkeuring voor intervalscoring. Er is nog geen factor-specifiek intervalminimum, gewichtsmodel of biologische correctie gekozen. De bestaande 1–10 thermische activiteitsscore blijft ongewijzigd en de VisCoach blijft uitsluitend consument/vertaler van Prognose-uitkomsten.

**Volgende werkstap:** maak op basis van deze matrix een klein interval-outputcontract: welke bestaande factorcontext kan per segment worden weergegeven, welke uitkomst blijft één sessiewaarde, en welke velden blijven onbekend bij onvoldoende dekking. Begin met tests van het contract en de as-of-grens; pas daarna kan worden besloten of enige factorberekening in de bestaande Prognose-engine moet worden uitgebreid. Geen tweede prognose-engine en geen scorewijziging.

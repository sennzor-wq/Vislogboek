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


## 89. Fase-2-acceptatiecrosswalk — actuele status na PR #147–#155 (19 november 2026)

Deze crosswalk vervangt de eerdere momentopname na PR #142. De status is gebaseerd op de actuele code- en broninventaris §§92–101, de gekozen thermische prior uit §90 en de huidige repositorystatus op `main`.

| Criterium | Actuele status | Aantoonbaar afgerond | Wat nog openstaat |
|---|---|---|---|
| 1. Gescheiden biologische responsen | **Technisch grotendeels geborgd** | Thermische respons, voedings-/foerageerbewijs, beweging/habitat, persoonlijke vangstkans en betrouwbaarheid zijn onderscheiden. De volledige factortrace door code, UI, snapshot en evaluatie staat in §93. Koudewater- en omgevingsclaims zijn aangescherpt in §§96–101. | De precieze semantiek van de bestaande 1–10-dagscore moet vóór gewichten worden vastgelegd: de bestaande gebruikersscore blijft één score, maar alleen factoren die dezelfde biologische respons verklaren mogen daarin worden samengebracht. Habitat/aanwezigheid, persoonlijke vangstkans en betrouwbaarheid blijven afzonderlijke responsen tenzij een aparte samengestelde uitkomst expliciet wordt gekozen en gevalideerd. |
| 2. Bronkwaliteit en overdraagbaarheid | **Broninventaris grotendeels afgerond; formele blocker blijft** | 86 unieke registry-records voor negen doelsoorten; alle 86 blijven `approvedForPrediction: false`. Zeven oudere profielreferenties zijn gecorrigeerd/geclassificeerd; aanvullende telemetrie-, troebelheids- en hypoxiebronnen zijn vastgelegd. De keuze uit §90 is gesloten: bestaande thermische curves blijven als voorlopige mechanistische prior actief. | De exacte thermische curveparameters zijn niet onafhankelijk gevalideerd. De gekozen optie A is een transparant product-/architectuurbesluit, geen wetenschappelijke goedkeuring. Nieuwe voedings-, wind-, druk-, troebelheids-, zuurstof-, stromings- of tijdvakfactoren mogen pas numeriek actief worden na passende directe respons, invoerkwaliteit en onafhankelijke validatie. Kestemont (1995) en Tartally (2000) blijven niet-geverifieerde achtergrondreferenties. |
| 3. Water- en omgevingsdata | **Temperatuurprovenance gerealiseerd; overige lokale dekking beperkt** | Watertemperatuur wordt met herkomst, meettijd, bron/methode/diepte waar beschikbaar en onzekerheid verwerkt. Luchttemperatuur vervangt geen ontbrekende watertemperatuur. Wind, druk, troebelheid en hypoxie zijn inhoudelijk onderzocht en per gemeten respons geclassificeerd. | Geen betrouwbare actuele lokale zuurstofmeting of stroomsnelheid/afvoer in de invoerketen. Troebelheid is niet structureel lokaal gemeten. Onbekende factoren blijven onbekend; ze worden niet uit weersdata afgeleid. Lokale thermische biascorrectie wacht op voldoende echte meetparen. |
| 4. Tijdvak- en gedragslogica | **Gedeeltelijk gerealiseerd; biologische tijdvakvoorkeur open** | Gekozen sessiestart stuurt VisCoach-context; startmetadata is feitelijk. De huidige thermische tijdvakpresentatie wordt niet als bewezen beste vistijd verkocht. Soortspecifiek voedings-/dielbewijs is als afzonderlijke context geïnventariseerd. | Dezelfde dagbrede thermische waarde wordt momenteel voor alle vier tijdvakken hergebruikt. Er is nog geen gevalideerde tijdvakscore die tijdvakcondities, soortspecifieke voedingsrespons, seizoen en stek samenbrengt. Tijdvakvangst-/blootstellingsdiagnostiek is nog geen gevalideerde voorspelling. Geen generieke schemer-/nachtbonus. |
| 5. Lokale leer- en evaluatieketen | **Technische basis gerealiseerd; biologische evaluatie onvolledig** | Onveranderlijke prognosesnapshots, sessiekoppeling, chronologische rolling baseline en Brier/BSS voor persoonlijke vangstkans bestaan. Watertemperatuur heeft afzonderlijke MAE/RMSE/bias-evaluatie. | Brier evalueert geen biologische activiteit, voedselopname, habitat-aanwezigheid of tijdvakvoorkeur. Voor die responsen ontbreken nog passende onafhankelijke labels en evaluatiemaatstaven. Lokale kalibratie en prestatieclaims wachten op voldoende echte, vergelijkbare sessies. Geen automatische gewichtstuning. |
| 6. Gebruiksvriendelijkheid en VisCoach | **Huidige basis gerealiseerd; enkele tactische details open** | Bestaande scoreweergave blijft leidend; invoer blijft doelsoort, stek en gewenste starttijd. VisCoach consumeert de centrale prognose en gespecialiseerde engines; geen tweede prognose of verplichte levensfase-/foerageerinvoer. Voorvoerwaarschuwing is hersteld. | Exacte voorvoergrammen worden in de algemene prognoseweergave nog niet op invoerkwaliteit afgeschermd; de afzonderlijke keuze over numerieke voorvoer-suitability/grammen blijft open. Dit staat los van de dagscore en wordt niet stilzwijgend aangepast. |
| 7. Technische borging | **Gerealiseerd voor de huidige wijzigingsreeks** | PR #147–#155 zijn op exacte PR-heads gevalideerd; voor iedere gemergde PR is ook de Quality Gate op de main-mergecommit geslaagd. Regressietests bewaken bronclassificatie, scoregrenzen, tactiekclaims en evaluatie. | Iedere volgende codewijziging vereist opnieuw tests, diff-review, documentatiesynchronisatie en groene exacte-head- én mergecommit-gates. |

### Formele uitkomst

**Fase 2 is nog niet geaccepteerd. Fase 3 blijft geblokkeerd.**

De factorstatus- en datadekkingsinventaris is nu samengebracht in §§82, 93, 101 en 102. De gewenste geïntegreerde scoreketen is nog niet gerealiseerd. De huidige dagscore wordt numeriek uitsluitend door de voorlopige thermische prior bepaald. De overige factoren zijn contextueel of afzonderlijke responslagen. De belangrijkste resterende blockers zijn:

1. De exacte doelrespons van de bestaande 1–10-score expliciet vastleggen, zodat activiteit en voedings-/foerageerrespons niet onbedoeld met habitat, persoonlijke vangstkans of betrouwbaarheid worden vermengd.
2. De doelrespons van de bestaande score bevestigen en de toegestane factorgrenzen/interacties vastleggen; de actuele bron-/inputstatus is samengebracht in §§82, 93, 101 en 102.
3. Een transparante normalisatie-, ontbrekende-data- en aggregatieregel ontwerpen zonder fictieve neutrale waarden of arbitraire herweging.
4. Voor activiteit, voeding, habitat en tijdvak passende onafhankelijke evaluatiemaatstaven en chronologische backtests vastleggen.
5. De thermische prior als voorlopige uitzondering transparant behouden; exacte parameters blijven ongevalideerd en mogen niet als gevalideerde soortcurves worden gepresenteerd.

Lokale sessiedata blokkeren niet het afronden van de softwarearchitectuur, maar wel lokale kalibratie- en nauwkeurigheidsclaims. De bestaande scoreweergave blijft behouden. Er worden geen nieuwe gewichten of tijdvakbonussen geactiveerd voordat bovenstaande punten zijn afgehandeld.

### Volgende stap volgens de roadmap

De factorstatus-/datadekkingsmatrix is samengebracht in §102. De eerstvolgende stap is de doelrespons van de bestaande 1–10-score vastleggen. Daarna pas de ontbrekende-data-regel, normalisatie en kandidaataggregatie uitwerken. Vervolgens per respons een eigen validatieprotocol en chronologische vergelijking met de bestaande thermische baseline. Geen Fase 3-start vóór formele acceptatie.


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
- De tekst over “fysiologische temperatuurefficiëntie” in de prognoseview was verouderd na optie B en is vervangen door een uitleg dat watertemperatuur alleen context is en de thermische activiteitsscore uit staat.

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


# VisCoach – product roadmap en technisch ontwikkelplan

**Documentstatus:** goedgekeurde productarchitectuur; eerste geïntegreerde implementatiemijlpaal samengevoegd in `main`; resterende roadmapfases zijn nog in ontwikkeling  
**Onderzoeks- en peildatum:** 2 november 2026  
**Repository:** `sennzor-wq/Vislogboek`  
**Doel:** de VisCoach ontwikkelen tot de onderscheidende, persoonlijke advies- en begeleidingslaag van Vislogboek.

> **Belangrijk:** dit document is een roadmap, geen opdracht om direct te bouwen. De fases, datavelden en technische voorstellen moeten vóór iedere implementatie worden getoetst aan de actuele code. Er is bij het opstellen van dit document geen applicatiecode of database aangepast.

---

## 1. Samenvatting en productvisie

Vislogboek moet niet proberen de grootste openbare viskaart, vangstcommunity of verzameling kaartlagen te worden. Grote bestaande apps hebben daar al omvangrijke databronnen, gebruikersgemeenschappen en/of sonar- en kaartintegraties voor.

De kans voor Vislogboek ligt in een andere richting:

**Een persoonlijke viscoach die leert van de eigen vissessies, de eigenschappen van een specifieke stek meeneemt, een begrijpelijk visplan maakt, tijdens de sessie kan bijsturen en achteraf controleert of het advies daadwerkelijk hielp.**

De kern is niet een los AI-chatvenster of één algemeen bijtpercentage. Het onderscheid moet ontstaan uit een gesloten en controleerbare leercyclus, met een bewust eenvoudige bediening:

1. Vóór het vissen kan de gebruiker optioneel een sessie vooruit plannen, of direct kiezen voor **Nu vissen**. Voor een prognose kiest de gebruiker alleen de **vissoort, stek en gewenste starttijd**; een eindtijd is optioneel en mag ontbreken als de gebruiker nog niet weet hoelang hij vist.
2. De bestaande prognose- en analysemodules bepalen wat op basis van de gegevens aannemelijk is.
3. VisCoach vertaalt die uitkomsten naar een begrijpelijk plan: wanneer, waar en hoe vissen, inclusief tactische positionering ten opzichte van wind en oever.
4. De gebruiker kan het plan volgen of bewust een ander tijdvak kiezen. Een alternatief wordt alleen nadrukkelijk aanbevolen als het verwachte verschil betekenisvol is en voldoende onderbouwd kan worden.
5. Met één actie start de gebruiker vanuit het plan een sessie. De app opent direct de nieuwe actieve sessie; aanvullende gegevens zoals hengels, methode, aas en voer kunnen daar optioneel worden ingevuld.
6. Tijdens de sessie is VisCoach geïntegreerd in de bestaande actieve sessie-interface. De sessiegebonden coachcoördinator volgt automatisch relevante wijzigingen via bestaande gegevensstromen en laat bij betekenisvolle veranderingen de bestaande prognose- en analysemodules opnieuw beoordelen. Handmatige heranalyse blijft beschikbaar; herinneringen zijn optioneel.
7. Alleen wanneer de gecombineerde verandering praktisch relevant is, wordt een nieuwe prognosesnapshot en/of een afzonderlijk coachadvies vastgelegd. Kleine fluctuaties veroorzaken geen onnodige adviezen. Oorspronkelijke prognoses en eerdere adviezen blijven onveranderlijk.
8. Na afloop worden prognose, coachadvies, werkelijk uitgevoerde aanpak en sessieresultaat afzonderlijk geëvalueerd.
9. Alleen betrouwbare en voldoende vergelijkbare gegevens worden gebruikt om toekomstige prognoses en adviezen te verbeteren.

De productbelofte moet bescheiden en geloofwaardig blijven: VisCoach garandeert geen vangst en doet niet alsof hij vissen exact kan lokaliseren. Hij helpt de gebruiker betere, beter onderbouwde keuzes te maken en wordt persoonlijker naarmate er bruikbare gegevens beschikbaar komen.

### Voorgestelde positionering

**Vislogboek – Leer het water. Begrijp de vis. Verbeter iedere sessie.**

Een persoonlijke, privacygerichte viscoach die de lokale omstandigheden en eigen viservaringen leert begrijpen en helpt bij keuzes vóór, tijdens en na het vissen.

---

## 2. Onderzoek: bestaande visapps en concurrentie

### 2.1 Onderzoeksaanpak en beperkingen

Op 2 november 2026 is een gerichte vergelijking gemaakt van vijf relevante Android-visapps: Fishbrain, Fishing Points, FishAngler, Fish Deeper en Bobber.

Dit is een **selectie van inhoudelijk relevante concurrenten**, geen officiële ranglijst van de vijf meest gedownloade apps in de Google Play Store. De selectie is gemaakt op basis van overlap met één of meer belangrijke onderdelen van Vislogboek: visprognoses, vangstregistratie, persoonlijke historische gegevens, stekken, weer, tactisch advies en/of waterkaarten.

De vergelijking is gebaseerd op publiek beschikbare Google Play-beschrijvingen, officiële productpagina's en helpdocumentatie. Functies, beschikbaarheid, prijzen en gratis/premium-beperkingen kunnen per land, appversie en account verschillen. De beschrijving hieronder is daarom een momentopname, geen volledige praktijktest van iedere app.

### 2.2 De vijf onderzochte apps

#### 1. Fishbrain

Publieke aanbod:
- Grote internationale vangstcommunity en database met vangstlocaties.
- Interactieve viskaarten en dieptekaarten, onder meer via kaartpartners.
- Vangstlogboek, aasregistratie en persoonlijke statistieken.
- Weer, wind, maan en visactiviteitsprognoses.
- BiteTime, BiteGuide en BiteScore voor tijdvensters, omstandigheden en tactische aanwijzingen.
- AI-ondersteunde functies en premiumaanbod voor onder meer geavanceerde kaarten en prognoses.

Relevantie voor Vislogboek:
Fishbrain laat zien dat een combinatie van kaart, community, vangstregistratie en visadvies al een volwassen marktsegment is. Een algemene voorspelling of een advies over wanneer en hoe te vissen is op zichzelf dus niet uniek.

Bronnen:
- [Fishbrain – Google Play](https://play.google.com/store/apps/details?id=com.fishbrain.app)
- [Fishbrain – officiële featurepagina](https://fishbrain.com/features)
- [Fishbrain – logboek](https://fishbrain.com/features/logbook)

#### 2. Fishing Points

Publieke aanbod:
- Visactiviteits- en solunarprognoses.
- Weer, wind, luchtdruk, neerslag en weersradar.
- Getijden, waterstanden en maritieme gegevens waar relevant.
- Nautische kaarten, diepte-informatie en opgeslagen vislocaties.
- Vangstlogboek, waypoints en routes.
- Gratis en Premium-aanbod met verschillen in prognosehorizon, kaarten, radar en aantal opgeslagen locaties.

Relevantie voor Vislogboek:
Weersinformatie combineren met een visactiviteitsscore, dagoverzicht en opgeslagen stekken is een bestaand aanbod. Alleen een mooiere weersweergave of een extra score is geen onderscheidende strategie.

Bronnen:
- [Fishing Points – Google Play](https://play.google.com/store/apps/details?id=com.gregacucnik.fishingpoints)
- [Fishing Points – productuitleg](https://support.fishingpoints.app/hc/en-us/articles/26646581779090-What-is-Fishing-Points)
- [Fishing Points – Free versus Premium](https://support.fishingpoints.app/hc/en-us/articles/26798080270482-Fishing-Points-Free-vs-Premium-plan)

#### 3. FishAngler

Publieke aanbod:
- Viskaarten, openbare vangstlocaties en privé-waypoints.
- Weer- en visprognoses met uurlijkse informatie.
- Vangstlogboek met veel registratie-attributen, zoals soort, aas, locatie, watertemperatuur en omstandigheden.
- Persoonlijke statistieken, aas- en materiaalinzichten.
- Community, groepen en visidentificatie.
- Betaalde VIP-functies voor onder meer bepaalde kaarten, exacte vangstlocaties en advertentievrije ervaring.
- In 2026 is ook FINN gepresenteerd als AI-visgids die gepersonaliseerde gameplans kan maken op basis van locatie, doelsoort, omstandigheden en gebruikersgegevens.

Relevantie voor Vislogboek:
Dit is een belangrijke concurrent voor het idee van een persoonlijke coach. Een plan op basis van de eigen vangsthistorie en een AI-adviseur die vertelt wanneer, waar en hoe te vissen, zijn inmiddels ook bij een grote concurrent aanwezig. Vislogboek mag dus niet claimen dat alleen het hebben van een persoonlijke AI-viscoach uniek is.

Bronnen:
- [FishAngler – Google Play](https://play.google.com/store/apps/details?id=com.fishangler.fishangler)
- [FishAngler – officiële website](https://www.fishangler.com/)
- [FishAngler – FINN en productupdates](https://apps.apple.com/us/app/fishangler-fishing-app/id1073941118)

#### 4. Fish Deeper

Publieke aanbod:
- 2D- en 3D-dieptekaarten.
- Bodemhardheid en onderwaterstructuur.
- Vislocaties, vangstregistratie en weersinformatie.
- Offline kaarten.
- Integratie met Deeper-sonar, sonargegevens en zelfgemaakte bathymetrische kaarten.
- Community- en waterinformatie.

Relevantie voor Vislogboek:
Fish Deeper heeft een sterke positie in het zichtbaar maken van de fysieke onderwaterwereld, zeker in combinatie met sonar. Vislogboek hoeft niet te proberen sonar- of 3D-kaartfunctionaliteit te kopiëren. Het kan wel de beschikbare diepte-, bodem- en stekgegevens gebruiken als invoer voor een beter onderbouwd lokaal advies.

Bronnen:
- [Fish Deeper – Google Play](https://play.google.com/store/apps/details?id=eu.deeper.fishdeeper)
- [Deeper – uitleg over bathymetrische kaarten](https://support.deeper.eu/668053-How-do-I-access-bathymetric-maps-recorded-using-Deeper)

#### 5. Bobber: Fishing Forecast & Log

Publieke aanbod:
- Persoonlijk vangstlogboek met foto's, stekken, trips en materiaal.
- Vergelijkt toekomstige omstandigheden met de omstandigheden die bij eerdere vangsten zijn geregistreerd.
- Rangschikt vergelijkbare omstandigheden en laat zien welke factoren overeenkomen.
- Kan historische vangsten uit foto's helpen importeren.
- Privélogboek en optioneel Pro-abonnement met beperkingen in de gratis versie.

Relevantie voor Vislogboek:
Bobber is een belangrijke inhoudelijke concurrent omdat de app expliciet probeert te leren van de eigen vangsthistorie. Alleen historische vangsten vergelijken met vergelijkbaar weer is dus niet uniek. Vislogboek moet verder gaan met de combinatie van lokale waterkenmerken, doelsoort, methode, inspanning, nulvangsten, waarnemingen, temperatuurontwikkeling en evaluatie van daadwerkelijk gegeven coachadvies.

Bronnen:
- [Bobber – Google Play](https://play.google.com/store/apps/details?id=com.eeronautic.bobber)
- [Bobber – App Store productomschrijving](https://apps.apple.com/nl/app/bobber-fishing-forecast-log/id6804561920)

### 2.3 Wat leren we uit de concurrentievergelijking?

De markt biedt al veel van de volgende functies:
- Vislogboek en vangstregistratie.
- Weer- en uurlijkse visprognoses.
- Wind, luchtdruk, maanstand en solunarvensters.
- Aasadviezen.
- Kaarten, waypoints en diepte-informatie.
- Persoonlijke statistieken.
- Vergelijking van actuele omstandigheden met eerdere vangsten.
- AI- of algoritmische visplannen.

Daarom zijn de volgende ideeën **op zichzelf niet uniek**:
- Een app die zegt welke dag het beste is.
- Een algemeen bijtpercentage.
- Een AI-chatbot die visadvies geeft.
- Een persoonlijke voorspelling op basis van eerdere vangsten.
- Een wind- of oeveradvies zonder diepere lokale onderbouwing.

### 2.4 De kansrijke onderscheidende combinatie

De voorgestelde positionering voor Vislogboek is de combinatie van:

1. **Stek- en waterspecifiek leren:** niet alleen een persoonlijke vangstgeschiedenis, maar een lokaal profiel van water, stek, diepte, thermisch gedrag, soort, methode en tijdvak.
2. **Een doorlopende coachcyclus:** vóór de sessie plannen, tijdens de sessie relevante veranderingen en waarnemingen verwerken, en na afloop het advies en de uitvoering evalueren.
3. **Transparantie en privacy:** inzichtelijk maken waarop een advies rust, welke gegevens ontbreken, hoeveel eigen vergelijkbare sessies beschikbaar zijn en hoe betrouwbaar de uitkomst is. De kernfunctionaliteit blijft lokaal en gratis beschikbaar.

Deze combinatie is een **beoogde positionering**, geen bewezen exclusiviteit. Concurrenten ontwikkelen hun producten door. Het onderscheid moet in de daadwerkelijke werking, gegevenskwaliteit en gebruikerservaring worden bewezen.

---

## 3. Huidige stand van Vislogboek: wat is al aanwezig?

De huidige repository is read-only onderzocht op 2 november 2026. De technische status hieronder is een momentopname en moet in de audit opnieuw worden geverifieerd; de zes aanvullende productprincipes in sectie 4 zijn ontwerpvereisten, geen bewering dat deze al in code bestaan. De onderstaande inventarisatie onderscheidt bestaande onderdelen van producteisen en toekomstig werk. Het bestaan van een service of component betekent niet automatisch dat de volledige gebruikersflow al af is of in de praktijk is gevalideerd.

### 3.1 Bestaande VisCoach-basis

| Onderdeel | Huidige bevinding | Status |
|---|---|---|
| `src/components/viscoach/ViscoachModal.tsx` | Bestaande VisCoach-modal met stekkeuze, thuislocatie, doelsoort, sessieduur en acties om naar prognose te gaan of een sessie te starten | Aanwezig; volledige startpagina/adviesflow nog niet af |
| `src/services/viscoachService.ts` | Afstandsberekening, ophalen/opslaan thuislocatie, duplicaatcontrole steknaam en opbouw van sessiecontext | Aanwezig |
| `test-viscoach-part1.ts` | Tests voor afstand, 5-km-context, doelsoortopties, sessieduur, dubbele steknamen en backupcompatibiliteit | Aanwezig |
| `PROJECT_CONTEXT.md`, sectie 18 | Uitgebreide producteisen voor VisCoach-startpagina, filters, advies, sessiestart, stek toevoegen en hervatten | Vastgelegd; niet hetzelfde als implementatie |

De bestaande modal ondersteunt onder meer:
- Een opgeslagen visstek kiezen.
- Watertype, diepte en GPS-informatie van de gekozen stek tonen.
- Een thuislocatie instellen en de afstand tot de gekozen stek bepalen.
- Een doelvis kiezen uit bestaande opties.
- Een sessieduur kiezen uit presets of een eigen duur invullen (de huidige UI is niet het beoogde definitieve ontwerp).
- Een nieuwe stek vanuit de VisCoach toevoegen, met duplicaatcontrole.
- Doorgaan naar de prognose of een sessie starten.

De beoogde nieuwe instap reduceert de verplichte keuzes tot drie: vissoort, stek en gewenste starttijd. De eindtijd is optioneel; zonder eindtijd wordt geen standaardduur verzonnen. Thuislocatie en afstand mogen ondersteunende context blijven, maar mogen geen extra verplichte intakevragen worden.

De huidige `viscoachService.ts` bouwt een contextobject met stek, thuislocatie, afstand, doelsoort, sessieduur en ontbrekende velden. De service bevat op zichzelf nog geen volledig persoonlijk lerend stekmodel of een complete beslissingsmotor voor tactisch advies.

De bestaande testset bewijst specifieke basislogica. Zij bewijst niet dat alle VisCoach-schermen, startupnavigatie, gegenereerde adviezen, live coaching of de volledige sessiecyclus al werken.

### 3.2 Bestaande analyse- en prognosemodules

De repository bevat al relevante modules die de VisCoach moet hergebruiken:

| Bestand | Bestaande rol | Betekenis voor VisCoach |
|---|---|---|
| `src/services/prognosisEngine.ts` | Centrale prognoseberekening | Bron voor bestaande dag-, tijdvak- en soortprognoses |
| `src/services/waterThermalEngine.ts` | Thermische ontwikkeling en watertemperatuurschatting | Lokale temperatuurontwikkeling en onzekerheid |
| `src/services/evaluationEngine.ts` | Evaluatie van voorspellingen en temperatuurmodel | Objectieve controle van modelprestaties |
| `src/services/fishProfiles.ts` | Soortprofielen en biologische uitgangspunten | Soortspecifieke context |
| `src/services/habitatMovementEngine.ts` | Habitat- en bewegingsanalyse | Mogelijke zones en beweging, voor zover lokale gegevens dit ondersteunen |
| `src/services/bankWindEngine.ts` | Wind ten opzichte van oever/oriëntatie | Wind- en oevercontext |
| `src/services/rodPositioningEngine.ts` | Hengelpositionering | Praktische positioneringsadviezen |
| `src/services/prebaitEngine.ts` | Voorvoerstrategie | Voorvoeradvies waar relevant |
| `src/services/dataQualityEngine.ts` | Datakwaliteit | Ontbrekende of onbetrouwbare gegevens herkennen |
| `src/services/modelConsistencyEngine.ts` | Consistentiecontrole | Tegenstrijdige modeluitkomsten signaleren |
| `src/services/researchRegistry.ts` | Registratie van onderzoeks-/modelinformatie | Herleidbaarheid van aannames en bronnen |

Deze modules zijn een waardevolle basis. De roadmap gaat daarom uit van uitbreiding en samenvoeging via een nieuwe coachlaag, niet van een tweede prognose-engine of dubbele biologische regels.

### 3.3 Bestaande betrouwbaarheid en evaluatie

In de huidige codebasis zijn onder andere aanwezig:
- Validatie van ontbrekende en ongeldige weersvelden.
- Onderscheid tussen gemeten en geschatte watertemperatuur.
- Een watertemperatuurmodel met lokale, seizoensgebonden correctie wanneer voldoende geldige meetparen beschikbaar zijn.
- Temperatuurevaluatie met MAE, RMSE en bias.
- Vangstkans-evaluatie met Brier-score en calibratie.
- Prognosesnapshots die aan een sessie kunnen worden gekoppeld.
- Bescherming tegen bepaalde vormen van datalekken in historische evaluatie, zoals het gebruiken van toekomstige metingen voor eerdere voorspellingen.
- Standaard- en geavanceerde weergave van technische prognose-informatie.

Dit is een belangrijk fundament voor een coach die zijn eigen adviezen moet kunnen controleren. De huidige evaluatie meet echter niet automatisch of een concreet tactisch coachadvies (bijvoorbeeld een hengel verplaatsen of ander aas gebruiken) tot een beter resultaat heeft geleid. Dat vraagt om aanvullende registratie.

### 3.4 Wat nog niet als gerealiseerd mag worden beschouwd

De volgende onderdelen zijn productdoelen of uitbreidingen, niet aantoonbaar volledig gerealiseerde functies:
- De geïntegreerde VisCoach-instap met schermvullende welkomstmodal bij het openen van de app. De modal is een laag boven de bestaande app, geen tweede applicatie of vervanging van de bestaande navigatie.
- Een vaste UX-route van welkomstmodal naar een uitgebreid, zo nodig schermvullend visplan en vervolgens naar de bestaande actieve sessie-interface.
- Een contextgestuurde welkomsttekstbibliotheek met minimaal 200 korte, onderscheidbare tekstvarianten. De selectie gebruikt uitsluitend beschikbare en voldoende betrouwbare bestaande gegevens; een grote tekstenbibliotheek is hiermee expliciet onderdeel van de producteis.
- Een compleet, gebruiksvriendelijk advies dat de gekozen vistijd vergelijkt met relevante alternatieven en omstandigheden, tactiek, positie, wind-/kijk-/werprichting, aas/voer en onzekerheid samenbrengt in één coachplan.
- Een persoonlijk lerend profiel per stek en vissoort dat meer doet dan algemene historische statistieken tonen.
- Een sessiecoach die geïntegreerd is in de actieve sessiepagina en veranderingen en gebruikerswaarnemingen tijdens het vissen omzet in nieuwe tactische voorstellen.
- Een onveranderlijke historie van coachadviezen, uitgevoerde acties en resultaten waarmee de tactische waarde van adviezen kan worden geëvalueerd.

### 3.5 VisCoach-instap, modal en welkomstteksten

#### UX-doel en navigatie
- Bij het openen van de app verschijnt standaard de VisCoach-welkomstmodal als vriendelijke, schermvullende instap. Op desktop mag dit een groot centraal venster met zichtbare app-context erachter zijn; op kleine schermen wordt de modal schermvullend.
- De modal is een presentatie- en navigatielaag boven de bestaande app. Bestaande pagina's, navigatie, sessiebeheer, prognosepagina en logboek blijven bestaan en behouden hun eigen verantwoordelijkheden.
- De modal verschijnt niet opnieuw bij iedere interne paginawissel of rerender. Sluiten beëindigt alleen de welkomstweergave; de gebruiker kan VisCoach later opnieuw openen via de bestaande navigatie.
- De bestaande VisCoach-navigatie-ingang blijft beschikbaar als heropenroute. Deze mag de gebruiker naar dezelfde welkomst-/planervaring brengen; er komt geen concurrerende tweede ingang met afwijkende logica.
- De welkomstmodal biedt een duidelijke primaire actie om een visplan te maken of verder te gaan. Wanneer een actieve sessie bestaat, krijgt **Sessie hervatten** een prominente plek. Een actieve sessie wordt nooit automatisch beëindigd of vervangen door een nieuw plan.
- Vanuit de modal kan het volledige visplan worden geopend in een ruime weergave. Op mobiel gebruikt dit de beschikbare schermruimte. De uitgebreide planweergave mag inhoudelijk rijker zijn dan de korte welkomstmodal, maar blijft een presentatie van bestaande engine-uitvoer.
- Tijdens het daadwerkelijk vissen blijft de bestaande actieve sessie-interface de centrale werkplek. De modal mag de invoer van vangsten, waarnemingen, hengelgegevens en sessie-events niet blokkeren.
- Sluiten, teruggaan en heropenen moeten voorspelbaar werken met toetsenbord, schermlezer, focusbeheer en mobiele terugnavigatie. De modal mag geen onbedoelde blokkade van de rest van de app veroorzaken.

#### Contextselectie voor welkomstteksten
- De bibliotheek bevat minimaal 200 korte, onderscheidbare Nederlandse tekstvarianten. Variatie mag bestaan uit zorgvuldig geschreven vaste zinnen en gecontroleerde tekstsjablonen; de telling mag geen vrijwel identieke varianten als afzonderlijke unieke teksten presenteren.
- Een contextselectie kiest één passende welkomsttekst per app-opening. De tekst blijft tijdens die opening stabiel en wisselt niet bij iedere render of weer-refresh. Direct opeenvolgende openingen vermijden waar mogelijk herhaling.
- Relevante context mag uitsluitend uit bestaande, beschikbare gegevens komen, zoals:
  - datum, seizoen en lokaal tijdstip;
  - actuele of verwachte temperatuur, wind en neerslag voor de relevante locatie en het beoogde vistijdvak;
  - tijd sinds de laatst geregistreerde vissessie;
  - geregistreerde doelsoort, stek en sessiecontext;
  - de uitkomst van de vorige sessie, uitsluitend wanneer die expliciet en betrouwbaar is vastgelegd;
  - bestaande prognose- en tijdvakuitvoer, inclusief onzekerheid waar relevant.
- De selectie weegt context op relevantie en datakwaliteit. Niet ieder beschikbaar gegeven hoeft in de tekst terug te komen; tegenstrijdige of niet-relevante omstandigheden worden niet gecombineerd tot één geforceerde zin.
- Ontbrekende, verouderde of onbetrouwbare gegevens worden niet genoemd alsof ze actueel of bekend zijn. Als onvoldoende context beschikbaar is, kiest de app een neutrale welkomsttekst.
- De tekst mag geen vangst beloven, geen gebruiker verwijten maken over een eerdere nulvangst of lange pauze, en geen biologische bewering doen die niet door bestaande relevante modeluitvoer wordt ondersteund. Bijvoorbeeld: uitspraken over vissen die in groepen op diepte liggen zijn alleen toegestaan als de bestaande soort-/habitatuitvoer dat voor de betreffende context daadwerkelijk onderbouwt.
- De welkomstteksten gebruiken bestaande gegevens en engine-uitvoer. Er komt geen aparte weerservice, prognoseberekening, biologische regelset of tweede adviesengine voor de begroeting.
- De tekstbibliotheek en selectie zijn offline beschikbaar en vereisen geen externe AI-dienst of netwerkverbinding. Nieuwe zinnen mogen later worden toegevoegd zonder de onderliggende prognose- of sessiedata te wijzigen.

#### Acceptatiecriteria
- De welkomstmodal verschijnt bij een nieuwe app-opening, maar niet opnieuw door interne navigatie of gewone componentupdates.
- De gebruiker kan de modal sluiten en via de bestaande VisCoach-navigatie opnieuw openen.
- Bij een actieve sessie is hervatten duidelijk beschikbaar en blijft de bestaande sessie-interface leidend.
- Het uitgebreide visplan is vanuit de modal bereikbaar en schaalt naar mobiel en desktop.
- Er zijn minimaal 200 onderscheidbare korte Nederlandse tekstvarianten; selectie is contextgestuurd, stabiel tijdens één app-opening en voorkomt waar mogelijk directe herhaling.
- Tests dekken ontbrekende/verouderde weersdata, onbekende sessie-uitkomst, geen eerdere sessie, actieve sessie, herhaalde app-openingen, selectie zonder netwerk en het vermijden van niet-onderbouwde biologische claims.
- Bestaande navigatie, sessie-, vangst-, prognose- en logboekfunctionaliteit blijven behouden.

---

## 4. Productprincipes en harde randvoorwaarden

Deze principes gelden voor alle fases.

### 4.1 Betrouwbaarheid boven schijnzekerheid

- Geen verzonnen meetwaarden of standaardwaarden die ontbrekende gegevens verbergen.
- Een schatting moet herkenbaar zijn als schatting.
- Een advies moet de relevante ontbrekende informatie benoemen.
- Een klein aantal vergelijkbare sessies mag niet als sterke persoonlijke kennis worden gepresenteerd.
- Geen precieze vislocatieclaim wanneer diepte, bodem, stekgeometrie of waarnemingen dat niet ondersteunen.
- Een nulvangst is alleen bruikbare negatieve informatie wanneer doelsoort, methode, inspanning en sessie-uitkomst voldoende bekend zijn.

#### Visactiviteit is niet hetzelfde als vangstkans

VisCoach moet twee verschillende begrippen apart berekenen, opslaan, uitleggen en evalueren:

- **Biologische visactiviteit:** hoe actief, mobiel of voedselzoekend de doelsoort naar verwachting is onder de omstandigheden. Dit is een relatieve biologische inschatting, geen bewijs dat vis op de gekozen stek aanwezig is.
- **Vangkans:** de kans op een concreet geregistreerd vangstresultaat binnen de gekozen sessie, gegeven onder meer doelsoort, stek, tijdsvenster, methode, aas, effectieve inspanning en onzekerheid.

Een hoge biologische activiteit betekent dus niet automatisch een hoge persoonlijke vangkans. Aanwezigheid van vis, bereikbaarheid van de vis, bereidheid tot azen, presentatie en vangbaarheid zijn verschillende schakels. De app mag deze niet samenvoegen tot één ondoorzichtige score.

Toon waar relevant afzonderlijk:
- Activiteitsniveau en de biologische factoren die dit ondersteunen.
- Verwachte vangstgelegenheid/vangkans binnen de opgegeven sessie en de gebruikte aannames.
- Lokale aanwezigheidssignalen en de ouderdom/kwaliteit daarvan.
- Datadekking, onzekerheid en de belangrijkste ontbrekende invoer.

Een activiteitsscore wordt niet met Brier-score gevalideerd alsof het een kans op een binaire vangst is. Brier-score en calibratie horen bij duidelijk gedefinieerde binaire uitkomsten; temperatuurvoorspellingen worden afzonderlijk met MAE, RMSE en bias beoordeeld.

#### Vangstinspanning en vergelijkbaarheid

Persoonlijke resultaten moeten rekening houden met de werkelijk geleverde visinspanning. Registreer en gebruik, voor zover betrouwbaar beschikbaar:
- Aantal daadwerkelijk actieve hengels en de periode waarin iedere hengel actief was.
- Werkelijke effectieve vistijd, met onderbrekingen alleen wanneer die betrouwbaar zijn vastgelegd.
- Afgeleide hengeluren (actieve hengels × effectieve uren), naast sessieduur en vangsten per effectief visuur.
- Doelsoort, stek, seizoen/tijdvak, methode, aas/voer en relevante omstandigheden.

Hengeluren zijn een bruikbare blootstellingsmaat, geen perfecte causale maat voor vangstkans. Twee hengels op dezelfde stek zijn niet noodzakelijk twee onafhankelijke kansen. Presenteer deze maat daarom als context voor eerlijke vergelijkingen, niet als natuurkundige waarheid of automatische correctie die alle verschillen oplost.

Vergelijk sessies waar mogelijk bij gelijke of vergelijkbare doelsoort, locatie, tijdvak, methode en inspanning. Maak geplande vistijd, werkelijke sessieduur, effectieve visuren en hengeluren niet onderling uitwisselbaar.

#### Uitkomsten, aanbeten en aanwezigheid afzonderlijk registreren

Het datamodel en de gebruikersflow moeten de volgende situaties van elkaar kunnen onderscheiden, zonder bestaande historische gegevens achteraf te verzinnen:

- Doelsoort gevangen en geland.
- Niet-doelsoort gevangen en geland.
- Beet/aanbeet of duidelijke run, maar vis niet geland (bijvoorbeeld losschieter of gemiste aanslag).
- Visactiviteit/aanwezigheid waargenomen, zoals bellen, rollen, springen of zichtbare vis.
- Geen activiteit waargenomen tijdens de sessie.
- Bevestigde nulvangst: de sessie is daadwerkelijk gevist en de uitkomst is voldoende compleet geregistreerd.
- Onbekend/onvolledig: de gebruiker heeft de uitkomst niet bevestigd of de inspanning/registratie is onvoldoende.

Een waarneming is geen vangst. Geen waarneming is geen bewijs dat er geen vis aanwezig was. Een aanbeet zonder gelande vis is geen nulactiviteit en mag niet als gelande vangst worden geteld. Een niet-doelsoortvangst is wel bewijs van visactiviteit, maar niet automatisch een succes voor de gekozen doelsoort.

Leg observaties waar mogelijk vast met tijdstip, soort (indien bekend), type signaal, locatie/zone en zekerheid. Houd waarnemingen en vangsten als afzonderlijke gebeurtenissen of expliciet gescheiden velden. Bestaande sessies met ontbrekende informatie blijven onbekend; import of migratie mag geen bevestigde nulvangst, aanbeet of waarneming afleiden uit het ontbreken van records.

#### Betrouwbaarheidsgrenzen en geleidelijke lokale personalisatie

Persoonlijke profielen worden per relevante combinatie van stek en doelsoort opgebouwd, maar krijgen pas invloed wanneer de gegevens daarvoor voldoende bruikbaar en vergelijkbaar zijn.

- Begin met de bestaande algemene biologische/prognosebasis als fallback.
- Laat lokale gegevens geleidelijk zwaarder meewegen naarmate het aantal én de kwaliteit van vergelijkbare waarnemingen toeneemt.
- Gebruik onzekerheidsmarges en toon aantallen/soorten bewijs; een klein aantal vangsten mag het algemene model niet domineren.
- Houd rekening met seizoensverschillen, inspanning, methode, doelsoort, datakwaliteit en mogelijke selectievertekening.
- Bij tegenstrijdige of schaarse data blijft de uitkomst voorzichtig en wordt de beperking zichtbaar.
- Bepaal minimumaantallen, gewichten en shrinkage pas na de read-only audit en backtest. Leg geen arbitraire drempels vast zonder empirische onderbouwing.

Kwaliteit gaat boven hoeveelheid. Een kleine hoeveelheid betrouwbare, goed beschreven sessies is waardevoller dan veel onvolledige of niet-vergelijkbare records.

#### Advies alleen wanneer de onderbouwing toereikend is

De coachlaag moet vóór het tonen van een tactisch advies controleren of de benodigde invoer en relevante bestaande engine-uitvoer beschikbaar en voldoende betrouwbaar zijn.

- Wind-/oeveradvies mag niet zelfstandig een werprichting afleiden uit alleen windrichting. Het vereist voldoende informatie over oeveroriëntatie, positie van de visser en relevante watergeometrie.
- Hengelpositionering vereist passende stek-/zonegegevens; ontbrekende geometrie leidt tot een voorzichtige algemene uitleg of geen positioneringsadvies.
- Voorvoeradvies vereist onder meer doelsoort, sessietiming, relevante stek-/watercontext en voldoende gegevens over voerstrategie; anders wordt geen stellige hoeveelheid of timing voorgeschreven.
- Advies over aas, methode of presentatie moet aansluiten op bekende invoer en relevante bestaande logica. Ontbrekende informatie wordt niet stilzwijgend ingevuld.
- De coach hergebruikt bestaande engines en hun kwaliteits-/consistentie-uitkomsten. Hij verzint geen eigen verborgen correcties en overschrijft geen engine-uitvoer.
- Als de onderbouwing onvoldoende is, legt de coach uit wat ontbreekt en geeft hij alleen een minder specifiek advies dat wel door de gegevens wordt gedragen.

De audit moet per adviescategorie vaststellen welke invoer, engines, kwaliteitscontroles en fallbacks daadwerkelijk bestaan voordat implementatie wordt ontworpen.

#### Lokale zelfstandige werking is een harde eis

De kern van VisCoach moet volledig zelfstandig kunnen werken binnen de bestaande lokale app-architectuur:
- Geen centrale AI, server, account, cloudopslag of betaald abonnement nodig voor normale coachberekeningen.
- Bestaande lokale sessies, vangsten, stekken, instellingen en engines vormen de basis voor persoonlijke analyse.
- Weers- of andere externe gegevens mogen optioneel via bestaande providers worden opgehaald wanneer verbinding beschikbaar is; de coach mag niet afhankelijk worden van een cloud-AI om een advies te berekenen.
- Offline beschikbare gegevens blijven bruikbaar en ontbrekende actuele netwerkdata worden als ontbrekend getoond, niet verzonnen.
- Cloudback-up, synchronisatie en eventuele externe diensten blijven uitgestelde, optionele uitbreidingen en geen afhankelijkheid van een roadmapfase.

### 4.2 Eén centrale analysebasis

- Bestaande prognose-, soort-, temperatuur-, habitat-, wind-, positionerings- en voorvoerlogica hergebruiken.
- Geen tweede prognose-engine.
- Geen tweede, los onderhouden vissoortendatabase.
- Geen dubbele opslag van locaties, sessies of vangsten.
- De coachlaag vertaalt bestaande uitkomsten naar praktische taal en mag geen verborgen score-aanpassingen uitvoeren.
- De coach maakt geen extra intakeformulier van de sessiestart: vissoort, stek en gewenste starttijd zijn de primaire keuzes; eindtijd is optioneel. Aanvullende registratie blijft optioneel en gebeurt in de bestaande actieve sessie.
- De coach mag bestaande prognosemomentopnames niet vervangen, samenvoegen met coachadviezen of hun learning/evaluatierol veranderen.

### 4.3 Offline-first en privacy

- De kernfunctionaliteit moet lokaal bruikbaar blijven.
- Geen verplichte accountregistratie voor het logboek of de coach.
- Geen verplichte cloud-AI-aanroep voor normale adviezen.
- Sessies, vangsten en persoonlijke stekken blijven lokaal opgeslagen.
- Netwerkgegevens zoals weersverwachtingen mogen worden bijgewerkt wanneer verbinding beschikbaar is; reeds beschikbare gegevens moeten bruikbaar blijven volgens de bestaande offline-aanpak.
- Externe synchronisatie of cloudback-up is optioneel en staat los van de kernfunctionaliteit.

### 4.4 Gratis kernproduct

Voorgesteld verdienmodel:
- Alle kernfuncties van VisCoach gratis.
- Geen abonnement voor prognoses, persoonlijke stekmodellen, statistieken of sessiebegeleiding.
- Geen advertenties.
- Geen verplichte accountregistratie.
- Eventueel een betaalde, optionele cloudback-up/synchronisatie of vrijwillige eenmalige bijdrage.
- Geen levenslange onbeperkte cloudopslag beloven tegen één eenmalige betaling zonder structurele kosten te dekken.

### 4.5 Bestaande app-functionaliteit behouden

- Bestaande sessieflow en live-sessie-interface hergebruiken.
- Meerdere actieve sessies blijven ondersteunen.
- Actieve sessies moeten bij opnieuw openen hervat kunnen worden.
- Bestaande tabs Prognose, Sessies, Statistieken, Locaties, Weer en Instellingen blijven beschikbaar.
- Import/export, Dexie/IndexedDB en bestaande gegevens moeten backwards-compatible blijven.
- Geen bestaande data verwijderen of stilzwijgend opnieuw interpreteren.

---

## 5. Roadmap in fases

De fases zijn afhankelijkheden en productmijlpalen, geen harde kalenderplanning. De volgorde is belangrijker dan een vooraf gekozen aantal weken.

## Fase 0 – Read-only audit en gegevensfundament

**Doel:** exact weten welke informatie de app nu al betrouwbaar kan gebruiken en welke velden ontbreken.

### Wat bestaat al?
- Sessies, vangsten, locaties en instellingen in de lokale database.
- Doelsoort- en locatiekeuze in de bestaande VisCoach-modal.
- Bestaande prognose- en analysemodules.
- Weers- en temperatuurhistorie en prognosesnapshots.
- Backup/import- en exportfunctionaliteit.

### Wat moet nog worden onderzocht?
Maak eerst een veld-voor-veld inventarisatie van de bestaande Dexie-tabellen en types. Controleer specifiek of de app onderscheid kan maken tussen:
- Doelvissoort en toevallig gevangen soorten.
- Daadwerkelijk gebruikte vismethode.
- Aas, voer en presentatie.
- Geplande versus effectieve vistijd.
- Aantal hengels en relevante positionering.
- Vangst, bevestigde nulvangst en onbekende uitkomst.
- Waargenomen activiteit en geen waarneming.
- Waarnemingen zoals bellen, springen, rollen, zichtbare vis en aanbeten.
- Plaats/zone waar de hengel lag.
- Gemeten versus geschatte watertemperatuur en meetmoment.

Dit is een auditlijst, geen besluit dat al deze velden nieuw moeten worden toegevoegd. Bestaande velden moeten worden hergebruikt. Alleen bewezen ontbrekende informatie mag leiden tot een datamodeluitbreiding.

### Technische aanpak
1. Inspecteer types, Dexie-schema, sessie- en vangstformulieren, backupnormalisatie en import/export.
2. Maak een datadictionary met veldnaam, type, bron, optioneel/verplicht, betrouwbaarheid en gebruik in analyse.
3. Maak een matrix van ontbrekende, afgeleide en onbekende waarden.
4. Ontwerp eventuele uitbreidingen als optionele, backwards-compatible velden.
5. Zorg dat oude backups en oude sessies correct blijven laden.
6. Voeg tests toe voor onbekende uitkomsten, onvolledige sessies, nulvangsten en gegevensbehoud.

### Bewijs en acceptatiecriteria
- Oude backups blijven importeerbaar.
- Nieuwe optionele velden veroorzaken geen regressies.
- Ontbrekende waarden worden niet als nul of neutraal behandeld.
- Een sessie zonder doelsoort of effectieve inspanning wordt niet onterecht als bewijs voor een doelsoort gebruikt.
- Een waarneming wordt niet als vangst opgeslagen.
- Een onbekende sessie-uitkomst wordt niet als bevestigde nulvangst geïnterpreteerd.

**Fase 0 is gereed wanneer:** er een gecontroleerde datadictionary is en het duidelijk is welke betrouwbare gegevens de coach kan gebruiken, zonder aannames over ontbrekende informatie.

### Prognosegegevens volledig en efficiënt bewaren

VisCoach moet zoveel mogelijk van de oorspronkelijke prognose bewaren om later te kunnen onderzoeken waarom een voorspelling wel of niet klopte en om modellen aantoonbaar te verbeteren. Dit betekent niet dat alle historische brondata bij iedere prognose opnieuw gekopieerd moeten worden.

**Ontwerpprincipes:**

1. **Onveranderlijke prognoseruns:** sla iedere relevante prognoseberekening op als een afzonderlijke, immutable run. Een latere herberekening of update maakt een nieuw record en overschrijft nooit de oorspronkelijke voorspelling.
2. **Volledige prognose-uitkomst:** bewaar de volledige relevante `DayPrognosis`, inclusief alle beschikbare `TimeSlotAnalysis`-tijdvakken, alternatieven, factoronderbouwing, onzekerheden, water-/temperatuurinformatie en samenvatting. Bewaar dus niet alleen het gekozen of beste tijdvak.
3. **Exacte invoer en herleidbaarheid:** leg minimaal vast wanneer de run is berekend, voor welke stek/locatie en doelsoort, welke gewenste starttijd en eventuele eindtijd zijn gebruikt, welke weersbron en ophaaltijd golden, welke model-/engineversies en parameters zijn gebruikt en welke relevante datakwaliteits- en historische samenvattingen de berekening beïnvloedden.
4. **Bewaar de gebruikte weerinvoer:** bewaar de feitelijke weersvoorspelling die de engine voor de berekening gebruikte, of een onveranderlijke verwijzing naar een gedeelde weathersnapshot. Gebruik bij evaluatie nooit achteraf bijgewerkte actuele weersdata alsof die destijds bekend waren.
5. **Geen onnodige kopieën:** kopieer niet de volledige historische sessie- en vangstendatabase in iedere prognoserun. Bewaar de relevante samenvattende kenmerken/aantallen en verwijs naar bestaande bronrecords waar dat veilig en reproduceerbaar kan.
6. **Referenties in plaats van duplicatie:** sessies en coachadviezen verwijzen naar de relevante prognoserun via een ID. Een coachadvies mag de prognose niet volledig dupliceren; het bewaart alleen de eigen adviesinhoud en de verwijzing naar de prognose waarop het gebaseerd is.
7. **Opslag en performance:** bereken een prognose één keer per run en hergebruik de opgeslagen uitkomst voor weergave en evaluatie. Laad historische data gericht, vermijd volledige database-scans bij iedere render en voeg alleen indexen toe voor aantoonbaar gebruikte zoek-/filtervelden. Houd zware evaluaties buiten de kritieke UI-renderflow.
8. **Opslagoptimalisatie pas op bewijs:** begin met een begrijpelijk, versieerbaar objectmodel in IndexedDB/Dexie. Voeg deduplicatie, compressie of extra caches pas toe wanneer metingen aantonen dat opslagomvang of rekentijd dit nodig maken. Correcte reproduceerbaarheid gaat vóór voortijdige optimalisatie.
9. **Backups:** alle prognoseruns, relaties en evaluatiegegevens moeten behouden blijven in backup/export en correct worden hersteld bij import. Oude backups zonder deze gegevens moeten compatibel blijven.

**Belangrijke evaluatieregel:** de Brier-score mag alleen worden gebruikt voor een vooraf gedefinieerde probabilistische uitkomst, bijvoorbeeld de kans op minimaal één gelande doelvis binnen een voldoende complete, daadwerkelijk bevist sessievenster. Een relatieve activiteitsscore (bijvoorbeeld 1–10) is geen kans en mag niet rechtstreeks als Brier-invoer worden gebruikt. Biologische activiteit, aanwezigheidssignalen, aanbeten en daadwerkelijke vangst blijven afzonderlijke uitkomsten. Niet-beviste tijdvakken en onbekende sessie-uitkomsten worden niet als nulvangst gescoord.

**Acceptatiecriteria voor dit onderdeel:**
- Een opgeslagen prognose kan later exact worden herleid tot de destijds gebruikte invoer, weerdata en modelversie.
- Alle tijdvakken en relevante onderbouwing blijven beschikbaar, ook wanneer de gebruiker maar één tijdvak kiest.
- Een latere update verandert geen eerder opgeslagen prognose.
- Een sessie verwijst naar de juiste prognoserun zonder volledige dubbele opslag.
- Historische evaluatie gebruikt alleen informatie die op het moment van voorspellen beschikbaar was.
- Opslag, berekening en UI-laadtijd worden met representatieve datasets getest; optimalisaties worden op meetresultaten gebaseerd.

---

## Fase 1 – Persoonlijk leerprofiel per stek en vissoort

**Doel:** een stek krijgt een eigen, groeiend profiel op basis van fysieke kenmerken, temperatuurgedrag, visactiviteit en historische resultaten.

### Wat bestaat al?
- Locaties met onder meer naam, watertype, diepte en optionele GPS-coördinaten.
- Sessies en vangsten per locatie.
- Temperatuurschatting en lokale/seizoensgebonden temperatuurcorrectie.
- Soortprofielen en habitat-/bewegingsanalyse.
- Wind/oever- en hengelpositioneringsanalyse.
- Statistieken en prognose-evaluatie.

### Wat ontbreekt?
Een samenhangend profiel dat bovenstaande informatie op een consistente manier per stek en vissoort samenbrengt. Bestaande statistieken of een temperatuurcorrectie zijn nog geen volledig lerend stekmodel.

### Voorgestelde profielstructuur
1. **Fysiek profiel:** watertype, diepte, oeveroriëntatie, beschutting, begroeiing, bodem en verbinding met ander water, voor zover bekend.
2. **Thermisch profiel:** gemeten en geschatte temperatuur, opwarm-/afkoelgedrag, onzekerheid en invloed van beschikbare weersgegevens.
3. **Activiteitsprofiel:** waarnemingen, vangsten, doelsoort, tijdvak en seizoen.
4. **Tactisch profiel:** methode, aas/voer, hengelpositie, sessieduur en resultaten.
5. **Bewijskwaliteit:** aantal vergelijkbare sessies, spreiding, ontbrekende velden en mate waarin conclusies op eigen gegevens berusten.

### Technische aanpak
- Eerst de bestaande sessie- en stekgegevens indexeren; niet direct een nieuwe database dupliceren.
- Een nieuwe service zoals `spotLearningEngine.ts` kan een read-only profiel samenstellen uit bestaande Dexie-data.
- Alleen wanneer berekende profielen te zwaar zijn om steeds opnieuw te maken, een cache of afgeleid profiel opslaan. De brongegevens blijven leidend.
- Profielen scheiden per locatie, soort en waar verantwoord seizoen/tijdvak.
- Sessies als belangrijke waarnemingseenheid behandelen. Meerdere vissen in één sessie zijn niet automatisch onafhankelijke bewijzen.
- Gebruik algemene biologische kennis als startpunt en eigen gegevens als lokale aanvulling, niet als vervanging van biologische grenzen.

### Voorbeeld van een verantwoord profiel
"Op deze stek warmt het water bij zonnige omstandigheden mogelijk sneller op dan op beschutte stekken. Er zijn nog te weinig vergelijkbare karpersessies om een betrouwbare voorkeur voor een bepaalde windrichting vast te stellen."

Dit voorbeeld is illustratief en geen bestaande conclusie over een specifieke Vislogboek-locatie.

### Bewijs en acceptatiecriteria
- Chronologische backtests: alleen oudere sessies gebruiken voor de kennis waarmee latere sessies worden voorspeld.
- Vergelijk algemeen model met lokaal stekmodel.
- Temperatuur: MAE, RMSE en bias.
- Vangstkans: Brier-score en calibratie.
- Resultaten uitsplitsen naar soort, seizoen en relevante omstandigheden wanneer de steekproef groot genoeg is.
- Kleine datasets moeten terugvallen op algemene kennis en een lage betrouwbaarheid tonen.
- Controle op datalekken: toekomstige sessies of metingen mogen geen eerdere voorspelling beïnvloeden.

**Fase 1 is gereed wanneer:** het lokale profiel aantoonbaar correcte gegevens gebruikt en op ongeziene historische sessies wordt vergeleken met een eenvoudige algemene basisvoorspelling. Het hoeft niet altijd beter te zijn; de app moet ook kunnen vaststellen wanneer er nog onvoldoende bewijs is.

---

## Fase 2 – VisCoach vóór de sessie: één eenvoudig visplan

**Doel:** de gebruiker hoeft niet zelf meerdere prognosetabbladen te interpreteren en hoeft vóór de sessie geen uitgebreide vragenlijst in te vullen. VisCoach vertaalt de bestaande analyse naar een begrijpelijk plan op basis van drie primaire keuzes.

### De drie primaire keuzes

1. **Vissoort:** bijvoorbeeld karper, brasem of alle soorten.
2. **Stek:** een bestaande stek of een nieuwe stek via de bestaande locatiefunctionaliteit.
3. **Gewenste starttijd:** de gebruiker geeft aan vanaf wanneer hij wil vissen. Een eindtijd is optioneel. Als de gebruiker wel een eindtijd of tijdsduur weet, kan die worden ingevuld; zonder eindtijd mag VisCoach geen vaste standaardduur aannemen of de gebruiker dwingen een eindtijd te kiezen. De prognose moet dan werken met de gekozen starttijd en de beschikbare tijdvakken, en de gebruiker kan later de gewenste duur aanpassen.

Aanvullende gegevens zoals aantal hengels, diepte, methode, aas, voer en presentatie zijn geen verplichte intake voor het ontvangen van een eerste advies. Ze kunnen waar relevant optioneel in de actieve sessie worden ingevuld. De coach gebruikt bekende gegevens en benoemt wat nog onbekend is; hij verzint geen invulling.

### Tijdvakvergelijking en keuzevrijheid

- VisCoach beoordeelt de gekozen periode en vergelijkt die waar zinvol met alternatieve tijdvakken.
- Vergelijkingen moeten eerlijk zijn: gebruik waar mogelijk dezelfde sessieduur, stek en vissoort, zodat niet ongemerkt verschillende inspanningen worden vergeleken.
- De gebruiker houdt altijd de keuze om op het oorspronkelijke tijdstip te vissen.
- Bij een verwaarloosbaar of onzeker verschil blijft de gekozen tijd leidend.
- Bij een relevant verschil toont VisCoach een alternatief met een korte uitleg.
- Alleen bij een duidelijk en voldoende onderbouwd verschil mag het advies nadrukkelijker voorstellen om de vistijd te verschuiven.
- Een hogere verwachte vangstkans door een langere sessie mag niet worden verward met gunstigere omstandigheden per uur. Sessieduur en omstandigheden worden afzonderlijk beoordeeld.
- Onzekerheid, ontbrekende gegevens en de hoeveelheid vergelijkbare persoonlijke sessies moeten zichtbaar blijven.

### Gewenste gebruikersflow

1. Als een actieve sessie bestaat, wordt de bestaande sessie hervat; VisCoach verdringt deze niet.
2. Als geen actieve sessie bestaat, biedt VisCoach twee gelijkwaardige instappen: **Nu vissen** en optioneel **Sessie plannen**.
3. Bij beide routes kiest de gebruiker vissoort, stek en gewenste starttijd. Een eindtijd is optioneel.
4. VisCoach toont de prognose en het plan voor de gekozen starttijd/periode, met eventuele relevante alternatieven.
5. De gebruiker kan doorklikken naar de technische Prognose-tab voor verdieping.
6. Bij **Nu vissen** start de gebruiker expliciet de sessie. Pas op dat moment wordt een actieve vissessie aangemaakt en wordt een verse, onveranderlijke startsnapshot vastgelegd.
7. Bij **Sessie plannen** wordt alleen een afzonderlijke geplande afspraak met de bijbehorende planprognose opgeslagen. Er ontstaat géén actieve vissessie en er worden geen sessie-uren of nulvangsten geregistreerd. De gebruiker kan de planning later starten, wijzigen/verzetten of annuleren.
8. Op het geplande moment start de sessie niet automatisch. De gebruiker bevestigt met **Start vissen**; de app maakt dan de actieve sessie aan en legt een nieuwe, actuele startsnapshot vast. De oorspronkelijke planprognose blijft apart bewaard zodat het verschil tussen de vooruitblik en de prognose bij daadwerkelijke start kan worden onderzocht.
9. Aanvullende gegevens zoals hengelaantal, methode, aas, voer, diepte en feitelijke presentatie kunnen in de actieve sessie optioneel worden ingevuld.

### Optioneel vooruit plannen en veilig sessiebeheer

Een geplande vissessie is nadrukkelijk geen actieve vissessie. Dit onderscheid voorkomt vervuilde sessiedata wanneer iemand uiteindelijk niet gaat vissen of vergeet de app te openen.

**Geplande sessie:**
- Plannen is optioneel; direct starten blijft altijd mogelijk.
- Bewaar de geplande datum/starttijd, optionele eindtijd, stek, doelsoort en verwijzing naar de prognoserun die bij het plannen is getoond.
- Gebruik een expliciete status, bijvoorbeeld `planned`, `started` of `cancelled`. Een verstreken planning kan als `overdue`/verlopen worden getoond of als geplande afspraak blijven staan totdat de gebruiker een keuze maakt.
- De gebruiker kan een planning wijzigen/verzetten, expliciet starten of annuleren (eventueel met reden zoals niet gegaan).
- Een planning die niet doorgaat wordt nooit automatisch omgezet in een sessie, nulvangst of negatieve modeluitkomst.
- Een prognose die ruim vooraf is gemaakt kan meer onzekerheid hebben. Toon dit eerlijk en bied vlak voor vertrek/verzameld startmoment een nieuwe berekening aan. De oorspronkelijke planprognose blijft onveranderd bewaard.

**Actieve vissessie:**
- Een actieve sessie ontstaat uitsluitend na een bewuste actie van de gebruiker: **Start vissen**.
- Leg bij daadwerkelijke start een nieuwe, verse startsnapshot vast. Koppel deze aan de sessie en bewaar de eerdere planprognose afzonderlijk.
- De gebruiker hoeft bij start geen eindtijd te weten. Starttijd is leidend; eindtijd en werkelijke duur worden pas bij stoppen vastgelegd. Eventuele verwachte duur blijft optionele planningscontext en wordt niet verward met de werkelijke sessieduur.
- Als een gebruiker vergeet de sessie te beëindigen, toon een duidelijke herinnering/waarschuwing en bied hervatten of beëindigen aan. Beëindig of beoordeel een sessie nooit automatisch als nulvangst op basis van verstreken tijd.
- Bij afsluiten wordt alleen de daadwerkelijk bevist periode/inspanning geëvalueerd. Tijdvakken waarin niet is gevist of waarvan de inspanning onbekend is, tellen niet als bevestigde nulvangst.

**Gescheiden prognosemomenten:**
1. **Planprognose:** wat VisCoach voorspelde toen de gebruiker vooruit plande.
2. **Startsnapshot:** de verse prognose op het moment dat de gebruiker daadwerkelijk begon met vissen; dit is de primaire voorspelling voor de sessie-evaluatie.
3. **Updateprognoses:** afzonderlijke nieuwe snapshots wanneer tijdens de sessie opnieuw wordt geanalyseerd. Geen enkele eerdere snapshot wordt overschreven.

Deze drie momenten maken het mogelijk om zowel de kwaliteit van vooruit plannen (hoe ver van tevoren, welke onzekerheid) als de kwaliteit van de voorspelling bij daadwerkelijke sessiestart te onderzoeken.

### Inhoud van het visplan

- **Wanneer:** beoordeling van de gewenste starttijd en, als een eindtijd bekend is, de gekozen sessieduur en relevante alternatieven.
- **Waar:** kansrijke oever, zone of positie, alleen als stekgegevens dit ondersteunen.
- **Wind en positionering:** windrichting ten opzichte van de oever, relevante kijkrichting en aanbevolen werp-/voerichting.
- **Hoe:** methode en presentatie, voor zover bekende context dit ondersteunt.
- **Wat:** aas- en voerstrategie, inclusief voorvoeradvies waar relevant.
- **Waarom:** korte uitleg over de bepalende omstandigheden en verwachte visbeweging.
- **Hoe zeker:** datakwaliteit, aantal vergelijkbare eigen sessies en ontbrekende informatie.

### Tactische positionering: wind, kijkrichting en werprichting

Dit is een expliciet onderdeel van het praktische visplan, niet slechts een losse weerregel.

- **Windrichting:** uit welke richting de wind komt en welke oever/zone daardoor mogelijk wordt beïnvloed.
- **Oeveroriëntatie:** hoe de lokale oever loopt ten opzichte van wind en stekgeometrie.
- **Kijkrichting:** welke waterzone de visser in de gaten kan houden om activiteit te herkennen.
- **Werprichting/voerichting:** welke bereikbare zone of lijn een kansrijke presentatie kan bieden.
- **Verandering tijdens de sessie:** relevante winddraaiing kan in de tijdvakprognose en latere sessie-updates worden meegenomen.

Wind uit een bepaalde richting bepaalt niet automatisch dat de visser recht tegen de wind in moet werpen. Een concreet advies vereist voldoende informatie over de positie van de visser, oeveroriëntatie, watergeometrie en bereikbare zones. Als die gegevens ontbreken, toont de coach hooguit een algemene windcontext en zegt hij expliciet dat een precieze werprichting niet betrouwbaar kan worden afgeleid.

De bestaande `bankWindEngine.ts` en `rodPositioningEngine.ts` zijn de eerste hergebruikskandidaten. De audit moet vaststellen welke invoer en uitvoer ze werkelijk ondersteunen; geen parallelle wind-/positioneringslogica bouwen.

### Technische aanpak

- Een coachservice, bijvoorbeeld `visCoachEngine.ts`, fungeert als samenvoegende beslissings- en presentatielaag.
- Invoer: doelsoort, locatie, gewenste starttijd, optionele eindtijd, bestaande prognose-uitvoer, lokaal profiel en datakwaliteit.
- Uitvoer als gestructureerd adviesobject, bijvoorbeeld:
  - gekozen periode en eventueel aanbevolen alternatief;
  - reden en grootte/zekerheid van het verschil;
  - aanbevolen zone/oever;
  - windcontext, kijkrichting en werp-/voerichting met onderbouwing;
  - tactiek/methode;
  - aas- en voeradvies;
  - redenen, onzekerheden en ontbrekende gegevens;
  - bron-/moduleverwijzingen en coachversie.
- De coachservice roept bestaande engines aan of ontvangt hun resultaten; hij kopieert geen biologische regels en berekent geen eigen verborgen prognosescore.
- De UI presenteert eerst de belangrijkste aanbeveling en laat technische details optioneel zien.
- Een eventuele welkomsttekst blijft ondersteunend; de kern van de pagina is het praktische visplan en de sessiebegeleiding. Ontbreekt context, dan wordt geen persoonlijke context verzonnen.
- Bij toevoegen van een nieuwe stek wordt de bestaande locatiefunctionaliteit hergebruikt en keert de gebruiker terug naar de coach met die stek geselecteerd.

### Sessie-start en momentopnames

Bij **Start sessie** moet de bestaande prognosemomentopname-functionaliteit behouden blijven. Die momentopname blijft de technische vastlegging van de prognose waarop de sessie en latere model-evaluatie steunen.

Daarnaast is een afzonderlijke, aanvullende **VisCoach-adviesmomentopname** gewenst. Die bewaart wat de gebruiker daadwerkelijk vóór de sessie te zien kreeg en welke keuzes hij maakte, bijvoorbeeld de gekozen soort, stek en gewenste vistijd, het aanbevolen of alternatieve tijdvak, tactische positionering en de redenen/onzekerheden. Deze adviesmomentopname verwijst naar de bijbehorende prognosemomentopname; zij dupliceert niet de volledige prognosegegevens en vervangt de prognosesnapshot niet.

De technische audit moet eerst vaststellen welke prognosevelden de huidige snapshot al bevat en hoe die aan een sessie wordt gekoppeld. Het bestaande prognosesnapshotmechanisme en de learning/evaluatie daarvan zijn een harde behoudseis. Als de bestaande prognosesnapshot bij sessiestart wordt gemaakt, moet de coachadviesregistratie daar veilig en expliciet naar verwijzen.

### Bewijs en acceptatiecriteria

- Testscenario's voor seizoenen, soorten, gewenste tijdvakken, alternatieve tijdvakken, windrichtingen en ontbrekende stekgeometrie.
- Alle adviesonderdelen moeten naar bestaande invoer en analyse-uitvoer te herleiden zijn.
- Tijdvakvergelijking houdt sessieduur, stek en vissoort gelijk of benoemt expliciet wanneer dat niet kan.
- Een minimaal verschil leidt niet tot een dwingend advies om de planning te wijzigen.
- Een windrichting wordt niet zonder lokale geometrie vertaald naar een stellige werprichting.
- De gekozen soort, stek en gewenste tijd blijven herkenbaar in advies en aangemaakte sessie.
- Start sessie opent direct de juiste actieve sessie; aanvullende gegevens blijven optioneel.
- De bestaande prognosemomentopname blijft bestaan en blijft gekoppeld aan sessie/evaluatie.
- De aanvullende coachadviesmomentopname verwijst naar de prognosesnapshot en wordt niet verward met een tweede prognose.
- Geen actieve sessie wordt overschreven of beëindigd.
- De gebruiker kan binnen enkele seconden de belangrijkste aanbeveling en reden begrijpen.

**Fase 2 is gereed wanneer:** de gebruiker met drie primaire keuzes een begrijpelijk en herleidbaar plan krijgt, een bewuste tijdkeuze kan maken en vanuit dat plan direct een sessie kan starten zonder bestaande sessie- of prognosefunctionaliteit te verliezen.

---

## Fase 3 – Adaptieve VisCoach tijdens de sessie

**Doel:** VisCoach blijft tijdens een actieve sessie actueel door bestaande gegevensstromen en prognose-/analysemodules te hergebruiken. De gebruiker hoeft niet voortdurend zelf een nieuwe analyse aan te vragen.

### Gebruikerservaring

- VisCoach is als herkenbaar, compact onderdeel geïntegreerd in de bestaande actieve sessie-interface.
- De bestaande sessiepagina blijft de centrale plek voor sessiegegevens, vangsten, hengels en waarnemingen. Er wordt geen tweede live-sessie- of vangstinterface gebouwd.
- De interface toont het oorspronkelijke plan, het laatst geldende coachadvies en alleen relevante veranderingen.
- De gebruiker houdt de controle: de coach doet voorstellen, maar verplaatst geen hengels, wijzigt geen sessiegegevens en voert geen tactiek automatisch uit.
- De gebruiker kan altijd handmatig een heranalyse aanvragen. Eventuele herinneringen zijn aanvullend en optioneel, niet de primaire update-mechaniek.

### Bestaande gegevensstromen als bron

De adaptieve sessiecoach gebruikt geen eigen weerophaalservice of tweede prognoseketen. De bestaande bronnen blijven leidend:

- De bestaande `weatherService` haalt weersverwachtingen op, gebruikt de bestaande lokale cache en publiceert de bestaande update-event(s).
- De bestaande prognoseweergave reageert al op de weerupdate en gebruikt de bestaande `prognosisEngine` en deelanalyses.
- Nieuwe vangsten, sessiegegevens, hengelwijzigingen, waarnemingen en gemeten watertemperaturen komen binnen via de bestaande invoer- en opslagfuncties.
- Bij opnieuw zichtbaar worden of heropenen van de app controleert de sessiecoördinator of de actieve sessie met de meest recente beschikbare gegevens moet worden herbeoordeeld.

De precieze event- en opslagkoppelingen worden bij implementatie op de actuele code gecontroleerd. De PWA kan niet garanderen dat periodieke verwerking doorgaat wanneer de app volledig gesloten is. Bij heropenen wordt achterstallige beoordeling hervat met de meest recente beschikbare gegevens.

### Nieuwe verantwoordelijkheid: sessiegebonden coachcoördinator

Er wordt één aanvullende service/coördinator gebouwd. Deze is nadrukkelijk **geen prognose-engine, biologische engine of tactische engine**. De verantwoordelijkheid is uitsluitend:

1. Reageren op relevante bestaande data-updates voor actieve sessies.
2. De actuele sessiecontext verzamelen.
3. De bestaande prognose-engine en relevante bestaande deelanalyses opnieuw laten rekenen wanneer de invoer werkelijk is gewijzigd.
4. De nieuwe uitkomsten vergelijken met de vorige sessiesnapshot en het laatst gegeven advies.
5. Bepalen of de gecombineerde wijziging betekenisvol is voor de praktische aanpak.
6. Alleen dan een nieuwe onveranderlijke snapshot en/of een nieuw coachadvies vastleggen.
7. Dubbele verwerking, herhaalde adviezen en onnodig wisselende aanbevelingen voorkomen.

De prognosepagina en VisCoach gebruiken dezelfde bestaande prognoseberekening en dezelfde gezaghebbende engines. De coördinator mag geen alternatieve score, verborgen biologische correctie of tweede interpretatie van dezelfde factoren introduceren.

### Betekenisvolle verandering en adviesdrempel

Een nieuwe weersmeting of forecast-refresh is op zichzelf geen reden om een nieuwe snapshot of advies te maken. De beoordeling kijkt naar het gecombineerde effect van relevante invoerverschillen en de resulterende prognose-/tactiekuitvoer.

- Een kleine losse schommeling, zoals een beperkte temperatuur- of windfluctuatie, leidt niet automatisch tot een nieuw advies.
- Een combinatie van veranderingen kan wel relevant zijn wanneer de bestaande analyses daardoor tot een wezenlijk andere praktische aanbeveling komen.
- Een nieuwe snapshot kan nodig zijn om een betekenisvol gewijzigde prognose vast te leggen, ook wanneer het praktische advies hetzelfde blijft.
- Een nieuw coachadvies wordt alleen opgeslagen wanneer de aanbevolen aanpak of de uitleg wezenlijk verandert.
- Een waarneming of vangst kan herbeoordeling activeren, maar wordt niet automatisch als bewijs voor afwezigheid of als vangst van de doelsoort geïnterpreteerd.
- Gebruik conservatieve hysterese en idempotente verwerking om heen-en-weer wisselen en dubbele records te voorkomen. Een kandidaatwijziging door alleen een weersupdate wordt bij een volgende afwijkende weerinvoer bevestigd; directe gebruikerswaarnemingen, sessiewijzigingen, handmatige controles en app-hervatten worden direct beoordeeld. Numerieke biologische/tactische drempels worden niet willekeurig gekozen; ze worden met bestaande modeluitvoer, domeinreview en tests onderbouwd.
- Luchtdruk, wind of temperatuur krijgen geen nieuwe biologische scorewerking alleen omdat zij in een update veranderen. De bestaande modelregels en hun onzekerheden blijven leidend.

### Onveranderlijke historie en herleidbaarheid

- De volledige prognosesnapshot bij daadwerkelijke sessiestart blijft behouden als oorspronkelijke sessieprognose.
- Een latere betekenisvolle prognosewijziging wordt als afzonderlijke update-snapshot opgeslagen; eerdere snapshots worden nooit overschreven.
- Het coachadvies wordt afzonderlijk vastgelegd en verwijst naar de prognosesnapshot waarop het steunt. De coachadviesregistratie dupliceert niet de volledige prognose.
- Elk nieuw advies verwijst waar mogelijk naar het vorige advies en bevat minimaal tijdstip, sessie-ID, gebruikte prognosesnapshot-ID, relevante gewijzigde invoer, reden, aanbeveling, onzekerheid en coach-/engineversies.
- Handmatige heranalyse, automatische data-update, gebruikerswaarneming en herinnering blijven als verschillende triggers herkenbaar.
- Acceptatie, afwijken of negeren van een advies en de werkelijk uitgevoerde tactiek worden afzonderlijk geregistreerd wanneer de gebruiker die informatie al vastlegt of eenvoudig kan aangeven.

### Wat bestaat al en wat wordt toegevoegd?

**Bestaand en te hergebruiken:** actieve sessies, live-sessie-interface, vangstregistratie, waarnemingen, weerservice/cache, weerupdate-event, prognose-engine, thermische-, wind-, habitat-, positionerings- en voorvoeranalyses, datakwaliteit en prognosesnapshots.

**Gerichte uitbreidingen:** sessiegebonden coachcoördinator, ontbrekende provenance-/snapshotvelden waar nodig, afzonderlijke coachadviesrecords en de koppeling met bestaande update-events en sessieopslag. De exacte minimale uitbreiding wordt bepaald op basis van de actuele types, Dexie-tabellen en backupservice.

### Offline- en lifecyclegedrag

- Tijdens gebruik reageert de coördinator op relevante updates van bestaande services en opslag.
- Bij terugkeer naar de app wordt de actieve sessie met de meest recente beschikbare gegevens gecontroleerd.
- Offline wordt de laatst beschikbare context gebruikt; verouderde of ontbrekende gegevens worden herkenbaar gemaakt.
- De sessie wordt nooit automatisch beëindigd of als nulvangst beoordeeld.
- Er wordt geen achtergrondverwerking beloofd wanneer de PWA volledig gesloten is.

### Bewijs en acceptatiecriteria

- Scenario-tests voor afzonderlijke kleine fluctuaties, gecombineerde weersveranderingen, winddraaiing, temperatuurverandering, neerslag, vangsten, waarnemingen en gewijzigde tactiek.
- Bestaande forecast-update triggert herbeoordeling van actieve sessies zonder een tweede forecast-service.
- Herhaalde identieke updates leveren geen dubbele snapshots of adviezen op.
- Kleine of niet-praktische veranderingen veroorzaken geen nieuw tactisch advies.
- Een betekenisvolle prognosewijziging kan een update-snapshot opleveren zonder onnodig nieuw advies.
- Een tactisch gewijzigd advies bevat een controleerbare reden en verwijst naar de juiste prognose- en advieshistorie.
- De startprognose en eerdere adviezen blijven onveranderd.
- Heropenen na offline/periode gesloten app hervat de beoordeling met beschikbare gegevens.
- Geen ongefundeerd advies tot verplaatsen of een biologische kanscorrectie op basis van één factor.

**Fase 3 is gereed wanneer:** actieve sessies automatisch op relevante bestaande gegevenswijzigingen worden herbeoordeeld, alleen betekenisvolle veranderingen tot nieuwe registraties leiden en ieder advies volledig herleidbaar blijft zonder dubbele engines of onnodige gebruikershandelingen.

---

## Fase 4 – Coachadvies vastleggen en evalueren

**Doel:** aantonen welke adviezen hielpen, welke niet en waar het model tekortschiet.

### Wat bestaat al?
- Prognosesnapshots.
- Koppeling van prognoses aan sessies.
- Temperatuurvalidatie en vangstkans-evaluatie.
- Brier-score, calibratie, MAE, RMSE en bias.
- Sessie-uitkomsten en vangsthistorie.

### Wat ontbreekt?
Een expliciete, onveranderlijke registratie van het coachadvies en de relatie met de uitgevoerde tactiek.

### Onderscheid tussen prognosemomentopname en coachadviesmomentopname

De bestaande **prognosemomentopname blijft behouden als zelfstandige, essentiële bron** voor de prognose-learning engine en prognose-evaluatie. Zij bevat de technische prognose-uitvoer die op het moment van vastleggen beschikbaar was en blijft volgens de bestaande koppeling aan de sessie verbonden. Deze functionaliteit mag niet worden vervangen, uitgekleed of overschreven door VisCoach.

Daarnaast wordt een afzonderlijke, aanvullende **VisCoach-adviesmomentopname** voorgesteld. Deze registreert niet opnieuw de volledige prognose, maar bewaart de vertaalslag die de gebruiker daadwerkelijk heeft gezien:
- Uniek advies-ID en coach-/modelversie.
- Tijdstip waarop het advies is getoond.
- Gekozen vissoort, stek en gewenste starttijd; eindtijd optioneel.
- Eventueel aanbevolen alternatief tijdvak en de reden voor het verschil.
- Voorgestelde zone/oever, windcontext, kijkrichting en werp-/voerichting, voor zover onderbouwd.
- Voorgestelde methode, presentatie, aas/voer voor zover bekend.
- Redenen, ontbrekende gegevens en betrouwbaarheid.
- Verwijzing naar de bestaande prognosemomentopname waarop het advies steunde (ID/referentie), plus profiel-/engineversies indien beschikbaar.
- Of de gebruiker het advies accepteerde, afweek of negeerde.

De coachadviesmomentopname is aanvullend en verwijst naar de prognosesnapshot; zij kopieert niet alle prognosevelden en neemt de rol van de prognosemomentopname niet over. Bij sessiestart moeten beide registraties logisch en veilig aan dezelfde sessiecontext kunnen worden gekoppeld. De audit moet eerst controleren wanneer en via welke route de huidige prognosesnapshot wordt aangemaakt, welke velden daarin staan en hoe de koppeling precies werkt.

### Latere coachbeslissingen en uitgevoerde tactiek

Iedere update tijdens de sessie kan een nieuw, afzonderlijk adviesrecord opleveren:
- Uniek advies-/update-ID en tijdstip.
- Sessie-ID en verwijzing naar het oorspronkelijke coachadvies.
- Nieuwe observaties en gewijzigde context die tot herbeoordeling leidden.
- Nieuw voorstel, redenen en onzekerheden.
- Of de gebruiker het voorstel accepteerde.
- Welke tactiek daadwerkelijk is uitgevoerd en wanneer.
- Gekoppelde sessie en uiteindelijke uitkomst.

Een eerder adviesrecord of prognosemomentopname mag achteraf niet worden aangepast om het passend te maken bij het resultaat. Nieuwe informatie leidt tot een nieuw record of een expliciete evaluatieverwijzing.

### Technische aanpak
- Eerst vaststellen of bestaande snapshots of tabellen delen van deze gegevens al kunnen opslaan.
- De bestaande prognosemomentopname en haar koppeling aan de sessie/learning engine ongewijzigd behouden.
- Alleen ontbrekende coachspecifieke gegevens toevoegen via een optioneel, versieerbaar datamodel.
- De coachadviesmomentopname expliciet laten verwijzen naar de prognosemomentopname; geen volledige dubbele prognose-opslag maken.
- Koppelingen naar sessies, prognosesnapshots en opeenvolgende coachadviezen expliciet maken.
- Een evaluatieservice bouwen die oorspronkelijke adviezen vergelijkt met de latere uitvoering en uitkomst.
- Geen causaliteit claimen op basis van simpele vangstpercentages. Een visser kan bijvoorbeeld een advies opvolgen juist op dagen waarop de omstandigheden al gunstiger zijn.

### Bewijs en acceptatiecriteria
Vergelijk minimaal:
- Algemene prognose zonder lokale stekkennis.
- Prognose met lokale stekkennis.
- Lokaal plan met sessiebegeleiding.

Meet waar de data dit toelaat:
- Kans op minimaal één doelvis per sessie.
- Vangsten per effectieve visuur.
- Resultaat per doelsoort, seizoen, tijdvak en methode.
- Brier-score en calibratie van vangstkansen.
- Temperatuurfout (MAE/RMSE/bias).
- Hoe vaak adviezen zijn opgevolgd en wat daarna gebeurde.
- Hoe vaak de coach een advies veranderde en of dat achteraf logisch was.

Gebruik chronologische evaluatie en voorkom dat dezelfde sessies tegelijk trainings- en testgegevens zijn. Houd rekening met verschillen in sessieduur, methode, doelsoort, hengels en inspanning.

### Geplande vistijd versus werkelijke sessieduur

Deze gegevens beantwoorden verschillende vragen en moeten afzonderlijk worden opgeslagen en geëvalueerd:

- **Gewenste/geplande vistijd vóór de sessie:** welke periode wilde de gebruiker bevissen en op welke periode baseerde VisCoach zijn advies?
- **Aanbevolen alternatief:** welk ander tijdvak stelde de coach eventueel voor en waarom?
- **Werkelijke start- en eindtijd:** wanneer is de gebruiker feitelijk begonnen en gestopt?
- **Werkelijke sessieduur en effectieve inspanning:** hoeveel tijd is daadwerkelijk gevist, rekening houdend met eventuele onderbrekingen als die betrouwbaar worden geregistreerd?

Gebruik de geplande periode om te evalueren of het tijdadvies en een eventuele tijdverschuiving relevant waren. Gebruik de werkelijke gevist uren om vangst per uur en de omstandigheden tijdens de daadwerkelijke inspanning te beoordelen. Een sessie die eerder stopt, mag niet worden behandeld alsof de volledige geplande periode zonder vangst is bevist.

Een langere sessie vergroot doorgaans de gelegenheid om een vis te vangen, maar bewijst niet dat de omstandigheden per uur gunstiger waren. Vergelijk tijdvakken daarom bij voorkeur bij gelijke sessieduur en beoordeel vangstkans/inspanning afzonderlijk van de weers- en activiteitskwaliteit. Een vangst in één kort tijdvak bewijst evenmin dat de hele geplande periode gunstig was.

**Fase 4 is gereed wanneer:** de app kan laten zien welke adviestypen voldoende bewijs hebben, welke niet en welke gegevens nog nodig zijn. Een verbetering in vangstresultaat mag alleen worden geclaimd als de evaluatie dat ondersteunt.

---

## Fase 5 – Complete VisCoach-ervaring en productafwerking

**Doel:** alle onderdelen samenbrengen in één consistente, begrijpelijke en betrouwbare gebruikerservaring.

### Gewenste ervaring
- Bij geen actieve sessie opent de VisCoach als praktische startpagina.
- Bij een actieve sessie opent de bestaande hervat-/live-sessieflow; VisCoach is daarin geïntegreerd.
- De gebruiker kiest vóór de sessie alleen vissoort, stek en gewenste starttijd; eindtijd is optioneel.
- De coach maakt een plan voor wanneer, waar en hoe, inclusief wind-/kijk-/werprichting waar lokale gegevens dat ondersteunen.
- De gebruiker kan de technische Prognose-tab openen voor verdieping.
- Start sessie opent direct de aangemaakte actieve sessie; aanvullende gegevens zoals hengels, methode, aas en voer kunnen daar optioneel worden ingevuld.
- Tijdens de sessie verwerkt de coach automatisch relevante updates uit bestaande gegevensstromen. Handmatige heranalyse blijft beschikbaar; herinneringen zijn optioneel.
- Geplande vistijd en daadwerkelijke sessieperiode/-duur worden apart bewaard.
- Na afloop worden prognose, coachadvies, uitvoering en resultaat afzonderlijk geëvalueerd.
- De volgende sessie kan profiteren van de nieuwe lokale gegevens.

### Technische afwerking
- Eén gedeelde bron voor soort, stek, sessie en prognosecontext.
- Geen dubbele opslag of dubbele berekeningen.
- Duidelijke foutafhandeling als weerdata niet beschikbaar zijn.
- Goede prestaties op mobiele apparaten.
- Offline-first werking.
- Toegankelijke bediening met grote, eenvoudige acties.
- Standaardweergave met korte adviezen; technische details alleen in de geavanceerde weergave.
- Backups en import/export behouden alle relevante gegevens.
- Cloudfunctionaliteit blijft optioneel.

### Bewijs en acceptatiecriteria
- End-to-end tests voor de volledige gebruikersreis.
- Regressietests voor sessies, vangsten, import/export, prognoses en instellingen.
- Praktijktest op echte Android-apparaten en in verschillende netwerkcondities.
- Geen dataverlies bij app afsluiten, heropenen of offline werken.
- De coach toont geen persoonlijke conclusies wanneer er onvoldoende vergelijkbare sessies zijn.
- De kernfunctionaliteit blijft gratis en zonder verplichte accountregistratie.

---

## 6. Meetplan: hoe bewijzen we dat VisCoach beter wordt?

Een mooie interface of een overtuigend geformuleerd advies is geen bewijs van kwaliteit. VisCoach moet op verschillende niveaus worden getoetst.

### 6.1 Datakwaliteit
- Percentage sessies met bekende doelsoort.
- Percentage sessies met bekende methode en effectieve vistijd.
- Dekking van geplande start-/eindtijd tegenover daadwerkelijke start-/eindtijd.
- Verschil tussen geplande en werkelijke sessieduur; afwijkingen mogen niet als prognosefout worden geïnterpreteerd.
- Aandeel sessies waarin de oorspronkelijke geplande periode daadwerkelijk is bevist.
- Percentage sessies met bruikbare locatie- en weerscontext.
- Aandeel bevestigde nulvangsten versus onbekende uitkomsten.
- Aantal ontbrekende of tegenstrijdige gegevens.

### 6.2 Temperatuurmodel
- MAE: gemiddelde absolute temperatuurfout.
- RMSE: foutmaat die grotere missers zwaarder bestraft.
- Bias: systematische over- of onderschatting.
- Resultaten per locatie, seizoen en meetafstand waar voldoende gegevens bestaan.

### 6.3 Vangstkansmodel
- Brier-score en calibratie uitsluitend voor vooraf gedefinieerde binaire uitkomsten, zoals minimaal één doelsoort geland binnen een voldoende complete sessie.
- Biologische activiteit apart beoordelen als relatieve/indexuitkomst; niet presenteren als gekalibreerde vangkans tenzij daarvoor een afzonderlijke, valide uitkomstdefinitie en backtest bestaan.
- Vergelijking met een eenvoudige basisvoorspelling.
- Alleen sessies met voldoende bekende doelsoort, inspanning en uitkomst gebruiken.

### 6.4 Advieskwaliteit
- Is het advies herleidbaar naar de invoer?
- Is het advies consistent met bestaande analysemodules?
- Wordt onzekerheid correct weergegeven?
- Worden ontbrekende gegevens gerespecteerd?
- Verandert advies alleen bij betekenisvolle nieuwe informatie?
- Worden onnodige tactische wijzigingen vermeden?

### 6.5 Praktijkresultaat
- Doelvisvangsten per effectieve visuur en, waar betrouwbaar afleidbaar, per hengeluur.
- Kans op minimaal één doelvis per sessie, met inspanning en sessieduur als expliciete context.
- Resultaten per methode, aas, stek, seizoen en tijdvak.
- Vergelijking van vergelijkbare sessies met en zonder opgevolgd coachadvies.

Praktijkresultaten zijn gevoelig voor veel factoren. Een eenvoudige voor/na-vergelijking is onvoldoende om te bewijzen dat de coach de oorzaak is van een beter resultaat. Gebruik waar mogelijk vergelijkbare sessies, chronologische backtests en expliciete beperkingen.

### 6.6 Geen datalekken in evaluatie
- Train op oudere gegevens en test op latere gegevens.
- Geen toekomstige watertemperatuurmetingen gebruiken om eerdere voorspellingen te verbeteren.
- Geen sessies uit de testperiode gebruiken om het model voor diezelfde periode te kalibreren.
- Meerdere vangsten uit één sessie niet als volledig onafhankelijke sessies tellen.
- Resultaten uitsplitsen wanneer voldoende gegevens bestaan; bij kleine aantallen geen sterke conclusies presenteren.

---

## 7. Prioriteiten en afhankelijkheden

| Prioriteit | Fase | Waarom deze volgorde? |
|---|---|---|
| P0 | Data-audit en datakwaliteit | Zonder betrouwbare invoer kan het model verkeerd leren |
| P1 | Persoonlijk stek-/soortprofiel | Dit levert de lokale kennisbasis |
| P2 | VisCoach-architectuur en geïntegreerde ervaring | Brengt bestaande analyses samen in een eenvoudige gebruikersinterface |
| P3 | Dynamische sessiecoach | Herbeoordeelt actieve sessies via bestaande gegevensstromen en engines |
| P4 | Coachadvies vastleggen en evalueren | Maakt adviezen, uitvoering en resultaten herleidbaar |
| P5 | Productafwerking en validatie | Borgt samenhang, toegankelijkheid, offlinegedrag en gebruikskwaliteit |

De VisCoach-interface en de technische coachlaag worden als één productfase ontworpen, maar met gescheiden verantwoordelijkheden gebouwd. De interface hergebruikt bestaande UI-componenten en gegevenspresentaties. De sessiecoördinator gebruikt bestaande engines en gegevensstromen; ontbrekende functionaliteit wordt toegevoegd aan de bestaande service-, model-, opslag- of UI-laag waar die verantwoordelijkheid thuishoort. De adaptieve sessielogica wordt vanaf het begin meegenomen in het ontwerp en gefaseerd geïmplementeerd; zij wordt niet uitgesteld tot na de interface.

---

## 8. Technische ontwerp- en implementatiebasis

De read-only technische audit is uitgevoerd op de bestaande repository. De architectuurrichting hieronder is door de gebruiker goedgekeurd en is vanaf dit punt leidend voor de VisCoach-implementatie.

### Bindende architectuur

1. **VisCoach is de gebruikersinterface en samenbrengende coachervaring.** De pagina hergebruikt bestaande UI-componenten, dataweergaven, formulieren en navigatie waar die passend zijn. Alleen ontbrekende VisCoach-specifieke presentatiecomponenten worden toegevoegd.
2. **Bestaande engines blijven gezaghebbend.** De bestaande prognose-, temperatuur-, wind-/oever-, habitat-/bewegings-, positionerings-, voorvoer-, datakwaliteits- en evaluatiemodules blijven de enige eigenaar van hun berekeningen en domeinregels.
3. **De coachservice is een coördinator, geen nieuwe voorspellende engine.** Zij verzamelt context, roept bestaande berekeningen aan, vergelijkt resultaten en bepaalt of een betekenisvolle sessiewijziging een nieuwe registratie of een nieuw advies rechtvaardigt.
4. **De actieve sessie blijft de primaire sessie-interface.** VisCoach wordt daarin geïntegreerd; er komt geen tweede live-sessie- of vangstregistratie.
5. **Bestaande gegevensstromen zijn de bron voor dynamische updates.** Weerupdates, vangsten, waarnemingen, temperatuurmetingen en sessiewijzigingen activeren waar relevant een herbeoordeling. Er wordt geen tweede weerophaal- of prognoseketen gebouwd.
6. **Geen ruis.** Een technische data-refresh is niet automatisch een nieuwe prognose- of adviesregistratie. Alleen betekenisvolle gecombineerde veranderingen leiden tot nieuwe snapshots/adviezen. Eerdere registraties blijven onveranderlijk.
7. **Herleidbaarheid.** Coachadviesrecords verwijzen naar de relevante prognosesnapshot en vorige adviesversie. Ze kopiëren niet de volledige prognose.
8. **Minimale gebruikersinteractie.** Automatische verwerking is de standaard waar de app actief is; handmatige heranalyse is aanvullend en herinneringen zijn optioneel. De gebruiker houdt controle over het uitvoeren van tactische voorstellen.
9. **Offline-first.** De kern blijft lokaal. Een volledig gesloten PWA kan geen continue achtergrondverwerking garanderen; bij opnieuw openen wordt de sessie met de meest recente beschikbare gegevens bijgewerkt.
10. **Kleine, controleerbare uitbreidingen.** Nieuwe gegevens worden toegevoegd aan de bestaande datamodellen, Dexie-opslag en backupcontracten. Geen dubbele database, soortlijst, locatieopslag of sessiebeheer.
11. **Veilige verwijdering.** Expliciete sessieverwijdering verwijdert de bijbehorende coachadviezen, maar behoudt gekoppelde planningshistorie en maakt alleen de verwijzing naar de verwijderde sessie los. Een prognosesnapshot die nog door een plan of advies wordt gebruikt, kan niet afzonderlijk worden verwijderd.

### Uitvoeringsvolgorde binnen de resterende VisCoach-fase

- **6A – Documentatie en datacontracten:** architectuur, bestaande componenten, gebeurtenissen, snapshot-/adviesrelaties en acceptatiecriteria eenduidig vastleggen.
- **6B – Backend en sessiecoördinatie:** minimale datamodellen/migraties, onveranderlijke advieshistorie, bestaande eventkoppelingen, betekenisvolle wijzigingsdetectie en tests.
- **6C – Gebruikersinterface:** VisCoach-start-/planervaring en integratie in de bestaande actieve sessie-interface, met hergebruik van bestaande componenten.
- **6D – Integratie en validatie:** end-to-end, offline/heropenen, backup/restore, regressies en praktijktest.

De volgorde mag intern in kleine pull requests worden verdeeld. De VisCoach-interface wordt niet geblokkeerd door onnodige backend-abstracties; omgekeerd mag de UI geen eigen berekeningen of beslisregels bevatten.

### Verplichte technische controles tijdens implementatie

- Bestaande prognosesnapshotvelden en de sessiekoppeling blijven behouden; uitbreidingen zijn additief.
- Planprognose, startsnapshot en betekenisvolle update-snapshots blijven onderscheidbaar.
- Onbekende eindtijd/duur blijft onbekend; geen standaardduur introduceren voor VisCoach.
- De bestaande backupversies blijven importeerbaar en nieuwe persistente records worden volledig geëxporteerd/hersteld.
- Meerdere actieve sessies en bestaande instaproutes blijven ondersteund.
- Geen automatische sessieafsluiting of automatische tactiekuitvoering.
- Geen willekeurige numerieke drempels voor weersverandering zonder onderbouwing en regressietests.
- Tests bewijzen alleen technisch gedrag; zij bewijzen niet automatisch biologische juistheid of praktijknauwkeurigheid.

## 9. Niet-doelen: wat VisCoach voorlopig niet hoeft te bouwen

Om focus en onderhoudbaarheid te behouden, zijn de volgende zaken geen prioriteit:
- Een openbare sociale community of vangstfeed.
- Een wereldwijde database met openbare exacte vangstlocaties.
- Eigen 2D/3D-bathymetrische kaarten of sonarvervanging.
- Een generieke chatbot die algemene visartikelen schrijft.
- Een tweede prognose-engine.
- Een zware cloud-ML-infrastructuur.
- Een abonnement of betaalmuur voor kernadvies.
- Een belofte dat de app vissen exact kan lokaliseren of vangst kan garanderen.

Externe kaart- of sonarbronnen kunnen later worden onderzocht als optionele invoer, maar mogen geen voorwaarde zijn voor de kernwerking.

---

## 10. Eindbeeld en definitie van succes

VisCoach is geslaagd wanneer de gebruiker met slechts drie primaire keuzes (vissoort, stek en gewenste starttijd; eindtijd optioneel) een praktisch en uitlegbaar plan krijgt dat rekening houdt met de specifieke stek, weersverloop, watertemperatuur en eigen ervaringen. Het advies helpt de gebruiker waar onderbouwd met tijdvak, zone, wind-/kijk-/werprichting, methode en aas/voer, zonder een uitgebreide verplichte intake.

De coach moet:
1. Per stek en soort leren wanneer er voldoende eigen gegevens zijn.
2. Een bruikbaar plan maken voor tijd, positie, wind-/kijk-/werprichting, methode en aas/voer.
3. De gebruiker vanuit het advies direct naar een nieuwe actieve sessie brengen, waar extra gegevens optioneel kunnen worden ingevuld.
4. Tijdens de sessie automatisch relevante veranderingen en waarnemingen verwerken via bestaande gegevensstromen; handmatige heranalyse blijft aanvullend beschikbaar en herinneringen zijn optioneel.
5. De oorspronkelijke prognosemomentopname behouden voor de bestaande prognose-learning engine en daarnaast het getoonde coachadvies afzonderlijk vastleggen.
6. Geplande vistijd en werkelijke sessie-inspanning onderscheiden en achteraf correct evalueren.
7. Zijn oorspronkelijke en latere coachadviezen bewaren en achteraf evalueren.
8. Biologische visactiviteit en concrete vangkans gescheiden presenteren en met passende methoden evalueren.
9. Resultaten eerlijk vergelijken met werkelijke visinspanning, inclusief actieve hengels en hengeluren waar betrouwbaar bekend.
10. Vangsten, aanbeten, aanwezigheidssignalen, geen waargenomen activiteit en onbekende uitkomsten afzonderlijk behandelen.
11. Lokale personalisatie geleidelijk en alleen op basis van voldoende kwalitatieve gegevens toepassen.
12. Tactisch advies alleen geven wanneer de benodigde invoer en engine-onderbouwing aanwezig zijn.
13. Aantoonbaar verbeteren waar data dat ondersteunt, en onzekerheid tonen waar dat niet zo is.
14. Volledig lokaal zelfstandig, offline-first, privacygericht en gratis bruikbaar blijven voor de kernfunctionaliteit.

**Het onderscheid van Vislogboek moet niet zijn dat het óók een voorspelling geeft. Het moet zijn dat het een controleerbare, persoonlijke leercyclus bouwt tussen stek, visser, omstandigheden, tactiek en resultaat.**

---

## 11. Bronnen en referenties

### Concurrentieonderzoek
- [Fishbrain – Google Play](https://play.google.com/store/apps/details?id=com.fishbrain.app)
- [Fishbrain – Features](https://fishbrain.com/features)
- [Fishing Points – Google Play](https://play.google.com/store/apps/details?id=com.gregacucnik.fishingpoints)
- [Fishing Points – Help Center](https://support.fishingpoints.app/hc/en-us/articles/26646581779090-What-is-Fishing-Points)
- [FishAngler – Google Play](https://play.google.com/store/apps/details?id=com.fishangler.fishangler)
- [FishAngler – officiële website](https://www.fishangler.com/)
- [FishAngler – FINN/productupdates](https://apps.apple.com/us/app/fishangler-fishing-app/id1073941118)
- [Fish Deeper – Google Play](https://play.google.com/store/apps/details?id=eu.deeper.fishdeeper)
- [Bobber – Google Play](https://play.google.com/store/apps/details?id=com.eeronautic.bobber)

### Eigen repository – bestaande technische basis
- [VisCoach-modal](https://github.com/sennzor-wq/Vislogboek/blob/main/src/components/viscoach/ViscoachModal.tsx)
- [VisCoach-service](https://github.com/sennzor-wq/Vislogboek/blob/main/src/services/viscoachService.ts)
- [VisCoach-basistests](https://github.com/sennzor-wq/Vislogboek/blob/main/test-viscoach-part1.ts)
- [Prognose-engine](https://github.com/sennzor-wq/Vislogboek/blob/main/src/services/prognosisEngine.ts)
- [Watertemperatuur-engine](https://github.com/sennzor-wq/Vislogboek/blob/main/src/services/waterThermalEngine.ts)
- [Evaluatie-engine](https://github.com/sennzor-wq/Vislogboek/blob/main/src/services/evaluationEngine.ts)
- [Vissoortprofielen](https://github.com/sennzor-wq/Vislogboek/blob/main/src/services/fishProfiles.ts)
- [Habitat- en bewegingsanalyse](https://github.com/sennzor-wq/Vislogboek/blob/main/src/services/habitatMovementEngine.ts)
- [Wind/oeveranalyse](https://github.com/sennzor-wq/Vislogboek/blob/main/src/services/bankWindEngine.ts)
- [Hengelpositionering](https://github.com/sennzor-wq/Vislogboek/blob/main/src/services/rodPositioningEngine.ts)
- [Voorvoer-engine](https://github.com/sennzor-wq/Vislogboek/blob/main/src/services/prebaitEngine.ts)
- [Datakwaliteit](https://github.com/sennzor-wq/Vislogboek/blob/main/src/services/dataQualityEngine.ts)
- [Projectcontext – huidige VisCoach-specificatie](https://github.com/sennzor-wq/Vislogboek/blob/main/PROJECT_CONTEXT.md#18-viscoach--toekomstige-startpagina-en-sessie-instap)

**Laatste inhoudelijke controle van de repository voor deze roadmap:** 2 november 2026. De aanvullende ontwerpprincipes zijn verwerkt op basis van de productbeslissingen; de read-only audit moet bestandsnamen, interfaces, datadekking en implementatiestatus opnieuw verifiëren voordat een fase wordt gebouwd.


---

## 9. Fase 0 – technische herstelstappen na code-audit

**Statuspeildatum: 6 november 2026.** Deze sectie is een aanvulling op de bestaande productarchitectuur. De implementatie loopt via aparte branches en PR's; wijzigingen worden niet rechtstreeks op `main` aangebracht.

### 9.1 P0 – gegevensbetrouwbaarheid vóór personalisatie

**Eerste implementatiepakket: legacy-import en soortspecifieke historie**

Bestanden en verantwoordelijkheden:

| Bestand | Technische functie |
|---|---|
| `src/types/index.ts` | Optionele provenance-/datakwaliteitsvelden voor legacy-sessies en vangsten |
| `src/services/backupService.ts` | Legacy normalisatie zonder verzonnen duur, eindtijd, doelsoort, vangstsoort/aantal of weer |
| `src/services/prognosisEngine.ts` | Soortspecifieke sessie-uitkomst op basis van echte vangstrecords; onbekende records uitsluiten |
| `src/services/sessionEffortEngine.ts` | Werkelijke hengeluren blijven leidend; geplande tijd niet als gerealiseerde inspanning gebruiken |
| `test-phase0-data-integrity.ts` | Regressietests voor legacy-import en scheiding tussen geplande en werkelijke duur |
| `package.json` | Expliciete testopdracht voor de P0-integriteitstests |

De optionele metadata is additief. Alleen wanneer een structurele IndexedDB-index of een niet-additieve wijziging nodig blijkt, wordt een nieuwe Dexie-versie toegevoegd. Geen onnodige databaseversie bump.

### 9.2 P0-acceptatiecriteria

1. Voltooide sessie zonder vangstrecords is onbekend, tenzij de bron nulvangst expliciet bevestigt.
2. Doelsoort wordt alleen uit expliciete bronvelden overgenomen.
3. Vangstsoort en aantal zijn alleen bruikbaar als ze in de bron bekend waren.
4. Missende tijd-/duur-/weervelden blijven onbekend en worden niet als echte observatie gebruikt.
5. Soortspecifiek succes wordt bepaald door vangstrecords van de voorspelde doelsoort, niet alleen door `session.outcome === 'catch'`.
6. Een vangst van een andere soort kan voor een expliciet geselecteerde doelsoort als geen doelsoortvangst gelden, maar wordt niet als doelsoortsucces geteld.
7. Een onbekend vangstaantal wordt niet als één vis in het Poisson-model gebruikt.
8. Geplande duur en geplande eindtijd tellen niet als werkelijke sessieduur.
9. Moderne back-ups blijven compatibel; legacy metadata blijft behouden bij export/import.
10. Geen automatische correctie of verwijdering van al bestaande lokale records.

### 9.3 P1 – prognoseperiode en tijdvakken

Na P0:

- `calculateDayPrognosis()` en `buildVisCoachPlan()` moeten dezelfde gekozen start-/eindperiode hanteren.
- De aanbevolen tijd wordt alleen gekozen uit tijdvakken die met de gekozen periode overlappen.
- Als de bestaande thermische invoer voor alle tijdvakken gelijk is, wordt geen schijnonderscheidende beste tijd gepresenteerd. Een echte rangschikking vereist tijdsafhankelijke onderbouwing; contextfactoren krijgen geen ongevalideerde numerieke bonus.
- Tijdsgrenzen worden expliciet in Europe/Amsterdam geïnterpreteerd en getest op middernacht en zomer-/wintertijd.

### 9.4 P1 – temperatuur en evaluatie

- Voeg aan de temperatuurwaarneming meettijdstip, meetdiepte en meetmethode/herkomst toe.
- Gebruik niet langer automatisch de sessiestart als meettijdstip wanneer de gebruiker later heeft gemeten.
- Koppel temperatuurvalidatie alleen aan een meting die ná de prognose en op dezelfde lokale doeldag is gedaan.
- Brier-score telt alleen unieke, geldige sessie-uitkomstparen voor dezelfde vooraf gedefinieerde gebeurtenis. Meerdere snapshots uit één sessie mogen niet ongemerkt als onafhankelijke sessies worden gepresenteerd.
- Rolling baseline blijft strikt chronologisch en gebruikt alleen informatie die vóór het prognosemoment bekend was.

### 9.5 P1 – duurafhankelijke tactiek

- `getActualSessionDurationHours()` levert uitsluitend werkelijke duur op en is leidend voor historische blootstellingsberekeningen.
- `getSessionDurationHours()` blijft de planning-/live-coachinghelper en mag voor een actieve sessie de geplande horizon teruggeven; gebruik deze helper niet voor historische vangsttempo's.
- Een onbekende werkelijke duur blijft `null`.
- `prebaitEngine.ts` mag een onbekende sessieduur niet stilzwijgend omzetten in drie uur wanneer het plan daarvan afhankelijk is.
- Geplande sessieduur blijft apart beschikbaar voor planning, niet voor historische blootstelling.

### 9.6 Volgorde en releasebeleid

1. P0 data-contract, import en soortspecifieke historie.
2. P0 regressietests en backup round-trip.
3. P1 duur-/tijdvaklogica en gekozen sessieperiode.
4. P1 temperatuurmeetmetadata en evaluatie-integriteit.
5. P2 tijdzones, datakwaliteitsrapportage en verdere observatie-/invoerverbeteringen.
6. Pas daarna persoonlijke stekprofielen en verdere tactische personalisatie.

Elke stap krijgt een afzonderlijke reviewbare PR. Een PR wordt niet als gereed beschouwd voordat typecheck, gerichte tests, productiebuild en relevante backup-/migratieregressies aantoonbaar zijn uitgevoerd. Biologische juistheid vereist daarnaast inhoudelijke validatie; een geslaagde test bewijst dat niet.

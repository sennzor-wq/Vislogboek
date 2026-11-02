# VisCoach – product roadmap en technisch ontwikkelplan

**Documentstatus:** productvoorstel / ontwerp, nog niet geïmplementeerd  
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

1. Vóór het vissen kiest de gebruiker alleen de **vissoort, stek en gewenste vistijd** (start- en eindtijd).
2. De bestaande prognose- en analysemodules bepalen wat op basis van de gegevens aannemelijk is.
3. VisCoach vertaalt die uitkomsten naar een begrijpelijk plan: wanneer, waar en hoe vissen, inclusief tactische positionering ten opzichte van wind en oever.
4. De gebruiker kan het plan volgen of bewust een ander tijdvak kiezen. Een alternatief wordt alleen nadrukkelijk aanbevolen als het verwachte verschil betekenisvol is en voldoende onderbouwd kan worden.
5. Met één actie start de gebruiker vanuit het plan een sessie. De app opent direct de nieuwe actieve sessie; aanvullende gegevens zoals hengels, methode, aas en voer kunnen daar optioneel worden ingevuld.
6. Tijdens de sessie is VisCoach geïntegreerd in de actieve sessiepagina. De visser kan zelf een nieuwe analyse aanvragen en kan optioneel herinneringen instellen voor een update.
7. De coach verwerkt relevante nieuwe omstandigheden, vangsten en observaties in een nieuw advies, zonder het oorspronkelijke advies of de oorspronkelijke prognose te overschrijven.
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

De huidige repository is read-only onderzocht op 2 november 2026. De onderstaande inventarisatie onderscheidt bestaande onderdelen van producteisen en toekomstig werk. Het bestaan van een service of component betekent niet automatisch dat de volledige gebruikersflow al af is of in de praktijk is gevalideerd.

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

De beoogde nieuwe instap reduceert de verplichte keuzes tot drie: vissoort, stek en concrete gewenste start- en eindtijd. Thuislocatie en afstand mogen ondersteunende context blijven, maar mogen geen extra verplichte intakevragen worden.

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
- Een volledig geïntegreerde VisCoach-startpagina die bij het openen van de app de centrale instap is wanneer geen actieve sessie bestaat.
- Een contextueel gegenereerde welkomstbibliotheek met minimaal 500 werkelijk verschillende, relevante varianten zoals vastgelegd in de bestaande productspecificatie.
- Een compleet, gebruiksvriendelijk advies dat de gekozen vistijd vergelijkt met relevante alternatieven en omstandigheden, tactiek, positie, wind-/kijk-/werprichting, aas/voer en onzekerheid samenbrengt in één coachplan.
- Een persoonlijk lerend profiel per stek en vissoort dat meer doet dan algemene historische statistieken tonen.
- Een sessiecoach die geïntegreerd is in de actieve sessiepagina en veranderingen en gebruikerswaarnemingen tijdens het vissen omzet in nieuwe tactische voorstellen.
- Een onveranderlijke historie van coachadviezen, uitgevoerde acties en resultaten waarmee de tactische waarde van adviezen kan worden geëvalueerd.

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

### 4.2 Eén centrale analysebasis

- Bestaande prognose-, soort-, temperatuur-, habitat-, wind-, positionerings- en voorvoerlogica hergebruiken.
- Geen tweede prognose-engine.
- Geen tweede, los onderhouden vissoortendatabase.
- Geen dubbele opslag van locaties, sessies of vangsten.
- De coachlaag vertaalt bestaande uitkomsten naar praktische taal en mag geen verborgen score-aanpassingen uitvoeren.
- De coach maakt geen extra intakeformulier van de sessiestart: vissoort, stek en gewenste start-/eindtijd zijn de drie primaire keuzes; aanvullende registratie blijft optioneel en gebeurt in de actieve sessie.
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
3. **Gewenste vistijd:** een concrete start- en eindtijd, bijvoorbeeld 13:00–17:00. Dit vervangt de oude primaire keuze voor alleen een sessieduur.

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
2. Als geen actieve sessie bestaat, opent VisCoach als praktische startpagina.
3. De gebruiker kiest vissoort, stek en gewenste start-/eindtijd.
4. VisCoach toont het plan en eventueel een beter alternatief tijdvak.
5. De gebruiker kan doorklikken naar de technische Prognose-tab voor verdieping.
6. De gebruiker kiest **Start sessie** vanuit hetzelfde plan.
7. De app maakt de sessie aan met de gekozen context en opent direct de nieuwe actieve sessiepagina. De gebruiker hoeft niet eerst naar het algemene sessieoverzicht te gaan om de sessie terug te zoeken.
8. Aanvullende gegevens zoals hengelaantal, methode, aas, voer, diepte en feitelijke presentatie kunnen in de actieve sessie optioneel worden ingevuld.

### Inhoud van het visplan

- **Wanneer:** beoordeling van de gekozen start-/eindtijd en een relevant alternatief.
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
- Invoer: doelsoort, locatie, gewenste start-/eindtijd, bestaande prognose-uitvoer, lokaal profiel en datakwaliteit.
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
- Welkomstteksten kunnen dynamisch uit gevalideerde context en beheerde tekstonderdelen worden opgebouwd. De eis van 500 varianten mag niet worden opgelost met 500 vrijwel identieke zinnen. Een neutrale tekst is verplicht als context ontbreekt.
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

**Doel:** de coach blijft niet hangen in de voorspelling die vóór vertrek is gemaakt. Hij is geïntegreerd in de actieve sessiepagina en kan relevante veranderingen en waarnemingen tijdens de sessie meenemen.

### Gebruikerservaring tijdens de actieve sessie

- De gebruiker blijft op de gewone actieve sessiepagina; VisCoach is daar als herkenbaar onderdeel geïntegreerd.
- De pagina toont het oorspronkelijke visplan, de relevante actuele omstandigheden en het laatst gegeven coachadvies.
- De gebruiker kan vanuit dezelfde pagina vangsten en sessiegegevens registreren en een nieuwe VisCoach-analyse aanvragen.
- Er is geen verplichte aparte VisCoach-pagina waar de gebruiker voortdurend naartoe moet navigeren.
- De coach geeft voorstellen; de gebruiker houdt altijd de controle en voert wijzigingen zelf uit.

### Updates: handmatig en optioneel op herinneringsinterval

Twee routes zijn gewenst:

1. **Handmatige update:** de gebruiker kan op ieder moment zelf op een knop drukken om een nieuwe analyse aan te vragen.
2. **Optionele herinnering:** de gebruiker kan instellen of en wanneer de app vraagt om een update, bijvoorbeeld na 30, 60 of 90 minuten of via een eigen interval. De gebruiker kan automatische herinneringen ook uitschakelen. Een herinnering is een uitnodiging om informatie te actualiseren, geen automatische wijziging van het advies.

Een praktische standaard kan 60 minuten zijn, maar dit is een productkeuze die bij gebruikerstests moet worden gevalideerd. De app mag niet ongevraagd pushberichten afdwingen. Op mobiele/PWA-platforms moeten de mogelijkheden en beperkingen van meldingen vooraf technisch worden onderzocht; een herinnering binnen de open app is niet hetzelfde als een gegarandeerde achtergrond-push.

### Snelle observaties en sessie-input

De update moet weinig invoer vragen. Gebruik waar mogelijk eenvoudige acties en reeds bekende sessiegegevens. Relevante observaties kunnen zijn:
- Vangst geregistreerd.
- Bellen.
- Springende vis.
- Rollende vis.
- Vis daadwerkelijk gezien.
- Aanbeet of gemiste aanbeet.
- Geen activiteit waargenomen.
- Aanpak gewijzigd, bijvoorbeeld aas/voer/methode of hengelpositie.
- Andere relevante waarneming.

Niet alle vragen zijn verplicht bij iedere update. Onbekende informatie blijft onbekend. Een vangst, een waarneming en het niet waarnemen van activiteit zijn verschillende soorten informatie. "Geen activiteit gezien" bewijst niet dat er geen vis aanwezig is.

### Hoe een update nieuw advies oplevert

1. De app legt het update-moment vast en verzamelt de meest recente sessiecontext, weers-/tijdvakgegevens, vangsten en expliciet ingevoerde observaties.
2. De coach beoordeelt welke informatie daadwerkelijk veranderd is sinds het vorige advies.
3. Kleine of onzekere veranderingen leiden hooguit tot een korte statusmelding, niet automatisch tot een tactiekwijziging.
4. Een relevante verandering kan aanleiding zijn om het bestaande plan opnieuw te beoordelen.
5. Een sterke verandering of betekenisvolle waarneming kan een concreet nieuw tactisch voorstel opleveren.
6. Het nieuwe advies vermeldt wat veranderde, waarom dat relevant is en hoe zeker de conclusie is.
7. De gebruiker accepteert, negeert of stelt het voorstel zelf bij. De coach voert geen fysieke of sessiewijziging automatisch uit.

Voorbeeld: na een uur zonder vangst en zonder zichtbare activiteit mag de coach dat als beperkt negatief signaal benoemen, maar niet concluderen dat de stek leeg is. Als daarna bellen of rollende vis wordt waargenomen, is dat een nieuw aanwezigheidssignaal dat de beoordeling kan veranderen.

### Wat bestaat al?

- Actieve sessies en bestaande live-sessie-interface.
- Vangstregistratie.
- Weersgegevens en tijdvakprognoses.
- Wind-, thermische, habitat- en positioneringsanalyses.
- Bestaande sessie- en prognosesnapshotkoppeling.

### Wat ontbreekt?

- Een geïntegreerd VisCoach-gedeelte op de actieve sessiepagina.
- Een eenvoudige, gestructureerde registratie van visactiviteit en relevante observaties tijdens de sessie.
- Handmatige heranalyse en optionele herinneringsinstellingen.
- Een mechanisme om advieswijzigingen te doseren en onnodige tactische wisselingen te voorkomen.
- Registratie van de vraag of een advies is opgevolgd en wat er daarna gebeurde.

### Technische aanpak

- Een `sessionCoachEngine.ts` kan actuele sessiecontext, observaties, tijdvakprognose en het oorspronkelijke coachplan combineren.
- Gebruik bestaande weers- en prognosemodules; herbereken niet zelfstandig een tweede vangstkans.
- Bewaar oorspronkelijke prognosemomentopname en coachadviesmomentopname ongewijzigd.
- Iedere latere analyse/advieswijziging wordt een afzonderlijk, tijdgestempeld coachadviesrecord dat verwijst naar de sessie en zo nodig naar de prognosecontext waarop het steunt.
- Houd een onderscheid tussen herinnering, door gebruiker aangevraagde analyse, waarneming en nieuw advies.
- Vermijd notificaties bij iedere kleine weersschommeling en onderzoek PWA-/Android-meldingsbeperkingen voordat achtergrondmeldingen worden beloofd.
- Advies bevat reden, bewijsbasis, onzekerheid en eventueel een expliciete actie die de gebruiker zelf kan uitvoeren.
- De gebruiker beslist zelf of hij het advies uitvoert.

### Bewijs en acceptatiecriteria

- Scenario-tests voor winddraaiing, temperatuurverandering, neerslag, vangsten, waarnemingen en uitblijven van activiteit.
- Handmatige update werkt zonder verplichte extra vragenlijst.
- Herinneringen kunnen worden uitgeschakeld en interval kan worden ingesteld.
- Kleine veranderingen veroorzaken geen onnodig nieuw tactisch advies.
- Waarnemingen worden niet als vangst of bewezen afwezigheid verwerkt.
- Geen advies tot verplaatsen zonder voldoende lokale context.
- De coach overschrijft het oorspronkelijke plan of eerdere adviezen niet.
- De gebruiker kan zien waarom een advies veranderde en of dit advies is opgevolgd.
- De actieve sessie blijft de centrale plek voor sessie-invoer en VisCoach.
- Offline gedrag blijft voorspelbaar met de laatst beschikbare gegevens.

**Fase 3 is gereed wanneer:** de coach binnen de actieve sessie relevante veranderingen kan signaleren, op verzoek of na een optionele herinnering een controleerbaar voorstel kan doen en niet onnodig vaak van tactiek wisselt.

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
- Gekozen vissoort, stek en gewenste start-/eindtijd.
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

Een adviesrecord mag achteraf niet worden aangepast om het passend te maken bij het resultaat. Nieuwe informatie leidt tot een nieuw record of een expliciete evaluatieverwijzing.

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
- De gebruiker kiest vóór de sessie alleen vissoort, stek en gewenste start-/eindtijd.
- De coach maakt een plan voor wanneer, waar en hoe, inclusief wind-/kijk-/werprichting waar lokale gegevens dat ondersteunen.
- De gebruiker kan de technische Prognose-tab openen voor verdieping.
- Start sessie opent direct de aangemaakte actieve sessie; aanvullende gegevens zoals hengels, methode, aas en voer kunnen daar optioneel worden ingevuld.
- Tijdens de sessie kan de gebruiker handmatig een update aanvragen of optionele herinneringen instellen.
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
- Brier-score voor binaire vangstuitkomsten.
- Calibratie: komen voorspelde kansen overeen met waargenomen frequenties?
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
- Doelvisvangsten per effectieve visuur.
- Kans op minimaal één doelvis per sessie.
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
| P2 | VisCoach vóór de sessie | Maakt de bestaande analyses bruikbaar voor de visser |
| P3 | Adaptieve sessiecoach | Breidt advies uit naar de daadwerkelijke vissessie |
| P4 | Coachadvies evalueren | Maakt aantoonbaar welke adviezen waarde toevoegen |
| P5 | Complete productervaring | Integreert alles en borgt gebruikskwaliteit |

De UI-startpagina mag parallel als ontwerp worden uitgewerkt, maar de definitieve advieslogica moet op de bestaande engines en datakwaliteit steunen. De adaptieve sessiecoach moet pas worden gebouwd wanneer de sessiecontext en waarnemingen betrouwbaar kunnen worden vastgelegd.

---

## 8. Eerste concrete ontwikkelopdracht: read-only technische audit

De eerste stap na goedkeuring van deze roadmap is nadrukkelijk **geen implementatie**.

Voer een read-only audit uit van de huidige repository en lever een technisch ontwerp op met:

1. Datadictionary van sessies, vangsten, locaties, instellingen, prognosesnapshots, bestaande snapshotkoppelingen en waarnemingen.
2. Exacte inventarisatie van het huidige moment waarop prognosesnapshots worden aangemaakt, de opgeslagen velden en de koppeling met sessies en learning/evaluatie. Bepaal expliciet welke coachadviesgegevens ontbreken; verander of vervang de prognosesnapshot niet.
2. Overzicht van bestaande invoervelden en formulieren voor doelsoort, methode, aas, vistijd, positie en visactiviteit.
3. Overzicht van alle bestaande prognose- en adviesmodules met hun invoer en uitvoer.
4. Overzicht van bestaande VisCoach-componenten, routes, state en sessie-instap.
5. Overzicht van de bestaande Dexie-tabellen en eventuele migratiebehoefte.
6. Backwards-compatibility-impact op import/export.
7. Exacte lijst van ontbrekende velden en waarom elk veld nodig is.
8. Voorstel voor de kleinste veilige technische uitbreidingen.
9. Testmatrix per fase en acceptatiecriteria.
10. Risico's voor bestaande sessies, vangsten, prognoses en performance.

**Auditregels:**
- Geen bestanden wijzigen.
- Geen code formatteren of refactoren.
- Geen database- of gebruikersdata wijzigen.
- Geen branch, commit of pull request maken tijdens de audit.
- Niet aannemen dat een functie ontbreekt voordat de huidige code is onderzocht.
- Lever per bevinding bewijs in de vorm van bestandsnaam, relevante functie/type en wat daar daadwerkelijk gebeurt.
- Maak onderscheid tussen bewezen implementatie, gedeeltelijke implementatie, documentatie-eis en nog niet geverifieerd gedrag.

Pas na beoordeling van de audit wordt een afzonderlijk implementatieplan opgesteld en per fase vrijgegeven.

---

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

VisCoach is geslaagd wanneer de gebruiker met slechts drie primaire keuzes (vissoort, stek en gewenste start-/eindtijd) een praktisch en uitlegbaar plan krijgt dat rekening houdt met de specifieke stek, weersverloop, watertemperatuur en eigen ervaringen. Het advies helpt de gebruiker waar onderbouwd met tijdvak, zone, wind-/kijk-/werprichting, methode en aas/voer, zonder een uitgebreide verplichte intake.

De coach moet:
1. Per stek en soort leren wanneer er voldoende eigen gegevens zijn.
2. Een bruikbaar plan maken voor tijd, positie, wind-/kijk-/werprichting, methode en aas/voer.
3. De gebruiker vanuit het advies direct naar een nieuwe actieve sessie brengen, waar extra gegevens optioneel kunnen worden ingevuld.
4. Tijdens de sessie geïntegreerd betekenisvolle veranderingen en waarnemingen verwerken, handmatig of via optionele herinneringen.
5. De oorspronkelijke prognosemomentopname behouden voor de bestaande prognose-learning engine en daarnaast het getoonde coachadvies afzonderlijk vastleggen.
6. Geplande vistijd en werkelijke sessie-inspanning onderscheiden en achteraf correct evalueren.
7. Zijn oorspronkelijke en latere coachadviezen bewaren en achteraf evalueren.
5. Aantoonbaar verbeteren waar data dat ondersteunt, en onzekerheid tonen waar dat niet zo is.
6. Offline-first, privacygericht en gratis bruikbaar blijven voor de kernfunctionaliteit.

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

**Laatste inhoudelijke controle van de repository:** 2 november 2026. Controleer bestandsnamen, interfaces en implementatiestatus opnieuw voordat een fase wordt gebouwd.

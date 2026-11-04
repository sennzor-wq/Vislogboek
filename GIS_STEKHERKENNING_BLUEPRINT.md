# Vislogboek — blueprint GIS-waterkaart en geavanceerde stekherkenning

**Status:** ontwerp ter goedkeuring; implementatie niet gestart  
**Versie:** 1.0  
**Datum:** 3 november 2026  
**Repository:** `sennzor-wq/Vislogboek`  
**Doelgebied eerste pilot:** Culemborg  
**Productonderdeel:** Vislogboek Coach  
**Documenttype:** afzonderlijke technische/product-blueprint

> **Statusregel:** dit document beschrijft de gewenste architectuur en het uitvoeringsplan. Het is geen bewijs dat GIS-import, waterherkenning, profielmatching, diepteberekening of Coach-integratie al in de applicatie aanwezig zijn. De actuele code blijft leidend voor wat daadwerkelijk is geïmplementeerd.

---

## 1. Doel en productvisie

De GIS-uitbreiding moet de Vislogboek Coach laten begrijpen **op welk water en op welk gedeelte van dat water iemand vist**, en welke onderwaterinformatie daar op basis van beschikbare gegevens verantwoord kan worden getoond.

De kernstroom is:

**GPS of handmatig gekozen stek → juiste watergang → positie langs de watergang → relevante meetprofielen → bodem-/diepte-informatie → kwaliteitsbeoordeling → Coach.**

De gebruiker hoeft bij normaal gebruik geen watergangcodes of profielnummers te kennen. De app herkent een waarschijnlijke watergang automatisch, maar vraagt om bevestiging wanneer meerdere watergangen dicht bij elkaar liggen of de match onvoldoende zeker is.

### Ontwerpprincipes

1. **Geen schijnzekerheid.** Een meting, leggerwaarde, modeluitkomst en interpolatieschatting zijn verschillende soorten informatie.
2. **Herleidbaarheid.** Iedere afgeleide uitkomst bewaart bron, bronversie, gebruikte profielen, methode en berekeningstijdstip.
3. **Eén gezaghebbende implementatie per domein.** Hergebruik bestaande infrastructuur en kwaliteitsvoorzieningen; bouw geen dubbele engines voor hetzelfde doel.
4. **Offline-first.** De kernapp blijft lokaal bruikbaar. GIS mag geen verplichte cloud- of externe AI-dienst introduceren.
5. **Additief en achterwaarts compatibel.** Bestaande IDs, sessies, vangsten, prognosesnapshots en gebruikersdata blijven behouden.
6. **Gefaseerd valideren.** Eerst Culemborg als pilot; uitbreiding volgt pas nadat koppelingen en uitkomsten controleerbaar zijn.
7. **Gebruikerscontrole.** GPS is een hulpmiddel; de gebruiker kan de visstekpin verplaatsen en een ambigue watermatch corrigeren.

## 2. Scope

### 2.1 Binnen scope

- De twee aangeleverde GIS-bronnen inventariseren, valideren en verwerken.
- Watergangen en relevante objecten binnen het afgesproken pilotgebied Culemborg selecteren.
- Ingemeten dwarsprofielen ruimtelijk aan watergangen koppelen.
- Leggerprofielen als afzonderlijke referentiebron koppelen.
- GPS-posities en handmatig gekozen visstekken aan watergangen relateren.
- Positie langs de watergang bepalen.
- Dwarsprofielen reconstrueren uit de meetpunten.
- Waar verantwoord diepte-/bodemschattingen tussen profielen berekenen.
- Meetdekking, herkomst, meetdatum, onzekerheid en kwaliteitsklasse registreren.
- Een versieerbare interface/API definiëren waarmee de Coach deze context optioneel kan gebruiken.

### 2.2 Buiten scope van de eerste pilot

- Een gegarandeerde landelijke, vlakdekkende dieptekaart.
- Dieptemetingen verzinnen op plaatsen zonder meetdekking.
- De exacte positie van aas of voer afleiden uit alleen de GPS-positie van de telefoon.
- Leggerdiepte als actuele waterdiepte presenteren.
- De bestaande prognose-engine of biologische kennislaag direct aanpassen.
- Nieuwe cloudaccounts, centrale opslag of een verplichte externe dienst introduceren.
- Bestaande sessies of prognoses achteraf wijzigen op basis van nieuwe GIS-data.

## 3. Bronbestanden en eerste inventarisatie

De gebruiker heeft de volgende bestanden aangeleverd:

1. `Ingemeten_Profielen_Wateren_ESRI_GDB.zip`
2. `Vastgesteld_LeggerWateren2025.gpkg`

Bij een eerdere eerste inspectie zijn de volgende aantallen gerapporteerd. Dit zijn **indicatieve inventarisatiecijfers**; de formele import moet alle lagen opnieuw tellen en valideren.

| Bron | Eerder gerapporteerde omvang | Beoogde rol |
|---|---:|---|
| Ingemeten profielen | circa 103.789 profiel-lijnrecords en 1.455.503 meetpunten | Feitelijke ingemeten dwarsprofielen en meetpunten |
| Legger Wateren 2025 | circa 161.864 hydroobjecten en 8.657 leggerprofielen | Officiële geometrie en legger-/norminformatie |

De eerdere inspectie meldde onder meer lagen voor vaste bodem en baggerlaag. De exacte laagindeling, veldbetekenis en relaties moeten tijdens de formele broninventarisatie worden bevestigd.

### 3.1 Te onderzoeken attributen

| Attribuut (indien aanwezig) | Mogelijk gebruik | Verplichte controle |
|---|---|---|
| `PROFIELNR` | Bronidentificatie van een profiel | Uniekheid, hergebruik en relatie met geometrie |
| `LAAG` | Onderscheid tussen bodemlagen | Domeinwaarden en betekenis uit metadata |
| `HOOGTE` | Verticale meetwaarde | Eenheid, verticaal referentiestelsel en plausibiliteit |
| `AFSTAND` | Horizontale positie binnen dwarsprofiel | Eenheid, nulpunt, richting en meetconventie |
| `VOLGNR` | Volgorde van meetpunten | Dubbele, ontbrekende of niet-monotone waarden |
| `DATUM` | Meetdatum | Formaat, tijdzone en ontbrekende waarden |

**Belangrijk:** veldnamen zijn aanwijzingen, geen definitieve semantiek. De betekenis wordt bevestigd aan de hand van bronmetadata en steekproeven.

## 4. Coördinatenstelsels en hoogtereferentie

De module moet coördinatenstelsels expliciet behandelen.

| Gegeven | Behandeling |
|---|---|
| Telefoon-GPS | Verwacht WGS84 / EPSG:4326 |
| Nederlandse metrische GIS-berekeningen | Waar passend transformeren naar RD New / EPSG:28992 |
| Verticale waarden | Verticale referentie afzonderlijk vaststellen; NAP alleen gebruiken als bronmetadata dit bevestigt |

Horizontale CRS en verticale hoogtereferentie zijn twee verschillende zaken. Een geometrie die naar RD New is getransformeerd, heeft daarmee nog geen gevalideerde NAP-hoogtes.

Bij import worden per laag vastgelegd:
- oorspronkelijke CRS;
- toegepaste transformatie;
- geometrievaliditeit en extent;
- verticale referentie en eenheid, indien bekend;
- eventuele ontbrekende of onzekere metadata.

De originele bronwaarden blijven beschikbaar zodat verwerking reproduceerbaar is.

## 5. Architectuuroverzicht

De GIS-functionaliteit wordt als een afzonderlijke module ontworpen. De bestaande app en prognose-engine blijven eigenaar van hun huidige domeinen.

| Stap | Component | Verantwoordelijkheid |
|---|---|---|
| 1 | Position Capture | GPS of handmatige pin ontvangen; nauwkeurigheid, tijdstip en bron vastleggen |
| 2 | Watermatcher | Kandidaat-watergangen vinden en ambiguïteit beoordelen |
| 3 | Segment Locator | Visstek op watergang projecteren en chainage bepalen |
| 4 | Profile Matcher | Relevante dwarsprofielen ruimtelijk koppelen |
| 5 | Profile Reconstructor | Dwarsdoorsneden uit geordende meetpunten opbouwen |
| 6 | Depth Estimator | Meting of expliciet gelabelde schatting leveren |
| 7 | Confidence & Provenance | Kwaliteit, onzekerheid, herkomst en dekking bepalen |
| 8 | GIS Data Interface | Geversioneerde, compacte resultaten beschikbaar stellen aan de Coach |

### Architectuurstroom

```text
GPS / handmatige visstekpin
            |
            v
      Watermatcher
            |
            v
  Watergang + segmentpositie
            |
            v
      Profile Matcher
            |
            v
   Profielreconstructie
            |
            v
   Diepte-/bodemschatting
            |
            v
 Confidence + provenance
            |
            v
   GIS-interface / API
            |
            v
     Vislogboek Coach
```

De module moet een nette uitkomst kunnen geven wanneer een stap geen resultaat heeft. Geen match of onvoldoende meetdekking mag nooit een crash of een verzonnen standaarddiepte veroorzaken.

## 6. GPS- en stekherkenning

### 6.1 Twee verschillende posities

De applicatie moet onderscheid bewaren tussen:

- **Angler position:** waar de visser staat of de telefoon zich bevindt.
- **Fishing spot:** waar de gebruiker daadwerkelijk vist, bijvoorbeeld de voerplek of aaspositie.

Een telefoon op de oever bepaalt niet automatisch waar het aas ligt. De eerste versie ondersteunt daarom:
1. automatische herkenning op basis van GPS;
2. een handmatig verplaatsbare pin op de kaart;
3. optioneel een ingevoerde werprichting en afstand, uitsluitend wanneer de gebruiker die informatie verstrekt.

### 6.2 Watermatcher

De watermatcher zoekt mogelijke watergangen rondom de opgegeven positie. De matching gebeurt in metrische coördinaten en gebruikt waar beschikbaar zowel waterganggeometrie als waterpolygonen/oeverbegrenzingen.

De matcher moet rekening houden met:
- afstand van GPS-punt tot watergang;
- positie op land, in water of nabij oever;
- parallelle sloten en hoofdwatergangen;
- kruisingen, duikers en aansluitende watergangen;
- meerdere kandidaten met vergelijkbare afstand;
- GPS-nauwkeurigheid en meettijdstip.

De dichtstbijzijnde lijn is niet automatisch de juiste watergang. Bij twijfel geeft de module kandidaten terug met afstand en matchreden en vraagt de app om bevestiging.

### 6.3 Positie langs de watergang (chainage)

Na keuze van een watergang wordt de visstek op de geometrie geprojecteerd. De module bewaart:
- gekozen watergang-/segment-ID;
- geprojecteerde positie;
- afstand van het oorspronkelijke punt tot de watergang;
- chainage: afstand langs de watergang vanaf een vast beginpunt;
- gekozen richting/segmentoriëntatie;
- eventuele gebruikerscorrectie.

Chainage is belangrijk: een profiel aan de andere kant van een bocht kan hemelsbreed dichtbij liggen, maar langs de watergang niet het relevante profiel zijn.

## 7. Meetprofielen koppelen aan watergangen

### 7.1 Ruimtelijke matching

De ingemeten profielen worden niet uitsluitend op profielnummer gekoppeld. De bronnen kunnen verschillende nummeringen en identificaties gebruiken.

De matcher beoordeelt minimaal:
1. of profiel- en waterganggeometrie in dezelfde metrische CRS staan;
2. of de profielgeometrie de watergang kruist of op een plausibele afstand passeert;
3. of de profieloriëntatie past bij een dwarsprofiel ten opzichte van de lokale watergangrichting;
4. waar de kruising/profielpositie langs de watergang ligt;
5. of profielbreedte en geometrie plausibel zijn;
6. of er meerdere mogelijke watergangen zijn.

Per koppeling wordt bewijs opgeslagen:
- bronprofiel-ID;
- watergang-/segment-ID;
- matchmethode;
- kruispunt of projectiepositie;
- afstand en chainage;
- matchscore of kwaliteitsstatus;
- validatiestatus en eventuele reden van twijfel.

Automatische matches met lage zekerheid worden niet stilzwijgend als definitief beschouwd.

### 7.2 Leggerprofielen

Leggerprofielen worden op vergelijkbare wijze ruimtelijk gepositioneerd, maar blijven een afzonderlijke gegevensbron. Ze kunnen onder andere referentiewaarden bevatten voor:
- bodembreedte;
- taludhellingen;
- bodemhoogte;
- ontwerp- of onderhoudsafmetingen.

Een leggerprofiel is niet hetzelfde als een actuele veldmeting.

## 8. Dwarsprofielen reconstrueren

De meetpunten worden per profiel en per bodemlaag gegroepeerd. De reconstructie gebruikt de gevalideerde puntvolgorde en/of afstandsmaat.

De gereconstrueerde dwarsdoorsnede bevat waar beschikbaar:
- horizontale positie binnen het profiel;
- hoogte;
- bodemlaag;
- bronpunt-ID en volgnummer;
- meetdatum;
- kwaliteit/validatiestatus.

De engine markeert:
- ontbrekende punten;
- dubbele afstanden of volgorden;
- onlogische hoogteverschillen;
- onverwachte sprongen;
- onvoldoende profielbreedte;
- onbekende eenheden of referentiestelsels.

De oorspronkelijke meetpunten worden nooit overschreven door opgeschoonde of geïnterpoleerde waarden.

## 9. Diepte-engine en interpolatie

De diepte-engine moet vier uitkomsttypen onderscheiden:

| Type | Betekenis | Presentatie |
|---|---|---|
| Direct gemeten | Een gevalideerde meting op de relevante positie | Gemeten waarde met bron en datum |
| Leggerreferentie | Waarde uit een vastgesteld leggerprofiel | Duidelijk als legger-/referentiewaarde |
| Geïnterpoleerd | Schatting tussen geschikte meetprofielen | Geschatte waarde met methode en onzekerheid |
| Niet beschikbaar | Geen geschikte gegevens | Geen numerieke diepteclaim |

### 9.1 Interpolatie langs de watergang

Wanneer meerdere geschikte meetprofielen beschikbaar zijn, kan de engine een schatting tussen profielen berekenen. Dit gebeurt op basis van chainage langs dezelfde watergang, niet uitsluitend op basis van hemelsbrede afstand.

Regels:
- alleen profielen met voldoende betrouwbare watergangmatch gebruiken;
- profielvolgorde langs de watergang controleren;
- afstand tussen profielen meenemen;
- interpolatiebereik configureren en onderbouwen;
- grote sprongen of discontinuïteiten detecteren;
- extrapolatie buiten het meetbereik weigeren of nadrukkelijk als lage zekerheid markeren;
- geen schatting presenteren alsof het een meting is.

### 9.2 Bodemhoogte is niet automatisch waterdiepte

Een bodemhoogte ten opzichte van NAP is geen actuele waterdiepte zonder actuele waterstand in hetzelfde verticale referentiestelsel.

Zonder geschikte waterstand kan de Coach wel bodemhoogte of profielvorm tonen, maar moet expliciet vermelden dat actuele waterdiepte niet exact uit de beschikbare gegevens kan worden afgeleid.

## 10. Confidence Engine en provenance

De kwaliteitsklassen hieronder zijn een intern ontwerpvoorstel, geen officiële meetstandaard. Drempelwaarden worden pas na bronanalyse en validatie vastgesteld.

| Klasse | Voorgestelde betekenis |
|---|---|
| **A — Direct gemeten** | Gevalideerd meetprofiel op of zeer dicht bij de relevante positie; datum en referentiestelsel bekend |
| **B — Sterk onderbouwde schatting** | Meerdere geschikte profielen ondersteunen interpolatie; geometrie en dekking zijn voldoende |
| **C — Beperkte zekerheid** | Profielen liggen relatief ver uiteen, zijn oud/incompleet of tonen sterke variatie |
| **D — Onvoldoende gegevens** | Geen bruikbare meting; eventueel alleen leggerinformatie of ongeldige profielmatch |

De kwaliteitsbeoordeling houdt minimaal rekening met:
- afstand tot profiel en afstand langs de watergang;
- aantal en spreiding van beschikbare profielen;
- meetdatum en mogelijke veranderingen door baggeren/onderhoud;
- volledigheid en consistentie van profielpunten;
- zekerheid van CRS en verticale referentie;
- variatie tussen aangrenzende profielen;
- bronsoort: gemeten, legger, geschat of handmatig ingevoerd.

Elke uitkomst bewaart provenance:
- bronbestand en datasetversie;
- bronlaag en bronrecord-ID's;
- gebruikte profiel-ID's;
- berekeningsmethode en parameters;
- berekeningstijdstip;
- kwaliteitsklasse en onzekerheid;
- eventuele handmatige correctie.

Bij klasse D toont de Coach “onvoldoende gegevens” en geen exact getal.

## 11. Voorgesteld logisch datamodel

Dit is een conceptueel model. Definitieve tabellen, opslagtechniek en migraties worden pas gekozen na inspectie van de bestaande applicatie en database.

| Entiteit | Doel |
|---|---|
| `water_bodies` | Wateridentiteit op hoofdniveau, bron-ID, naam, beheerder en datasetversie |
| `water_segments` | Individuele watergangsegmenten, geometrie, water-ID en chainage |
| `measured_profiles` | Ingemeten dwarsprofielen, bron-ID, geometrie, meetdatum en referentiestelsel |
| `profile_points` | Individuele meetpunten, profiel-ID, laag, volgnummer, afstand en hoogte |
| `legal_profiles` | Leggerprofielen en officiële referentiewaarden |
| `profile_water_mapping` | Ruimtelijke koppeling, matchmethode, afstand, score en validatiestatus |
| `fishing_spots` | GPS-/handmatige stekposities, locatiebron en privacy-instellingen |
| `depth_estimates` | Berekende uitkomst, type, waarde/bandbreedte, methode, confidence en bronprofielen |

De opslag moet aansluiten op de bestaande offline-first architectuur. De huidige projectbasis gebruikt React/TypeScript, PWA en Dexie/IndexedDB. Of een aparte ruimtelijke backend of PostGIS noodzakelijk is, wordt pas besloten na technische inspectie en een schaal-/performanceproef. Er wordt niet vooraf een cloudafhankelijkheid aangenomen.

## 12. GIS-interface richting de Coach

De Coach krijgt een compacte, versieerbare respons. Onderstaand voorbeeld beschrijft het gewenste contract en is **geen bestaand endpoint**:

```json
{
  "schemaVersion": "1.0",
  "spot": {
    "latitude": 51.947391,
    "longitude": 5.194094,
    "positionSource": "gps",
    "horizontalAccuracyM": null
  },
  "waterMatch": {
    "status": "matched | ambiguous | unmatched",
    "waterSegmentId": null,
    "distanceToSegmentM": null,
    "chainageM": null
  },
  "profileCoverage": {
    "measuredProfileCount": 0,
    "nearestAlongChannelM": null,
    "sourceDateRange": null
  },
  "depth": {
    "status": "measured | interpolated | legal_reference | unavailable",
    "valueM": null,
    "uncertaintyM": null,
    "confidence": "A | B | C | D"
  },
  "provenance": {
    "sources": [],
    "method": null,
    "computedAt": null
  }
}
```

Null betekent onbekend of niet beschikbaar en mag niet als nul worden geïnterpreteerd. De interface moet expliciet aangeven of de positie automatisch, handmatig of na gebruikersbevestiging is gekozen.

## 13. Integratie met de Vislogboek Coach

De eerste integratie is informatief. De Coach kan wateridentiteit, profieldekking, bodemvorm, taluds en onzekerheid tonen. De GIS-resultaten veranderen niet automatisch de biologische activiteitsscore of persoonlijke vangstkans.

Voordat GIS-context als prognose-input mag worden gebruikt:
- moet de herkomst en onzekerheid beschikbaar zijn;
- moet duidelijk zijn welke bestaande modelcomponent de informatie consumeert;
- moet dubbeltelling met bestaande factoren worden uitgesloten;
- moeten nieuwe prognoses de gebruikte GIS-dataset- en modelversie registreren;
- moet een afzonderlijke evaluatie aantonen dat de factor voorspellende waarde toevoegt.

Bestaande prognosesnapshots blijven onveranderlijk. GIS-data mogen historische prognoses niet achteraf herschrijven.

## 14. Privacy en offline-first

Exacte vissteklocaties kunnen privé-informatie zijn. Daarom:
- exacte stekken blijven standaard privé;
- delen vereist een expliciete gebruikershandeling;
- visserpositie en visstek worden als verschillende gegevens behandeld;
- alleen noodzakelijke locatiegegevens worden verwerkt;
- gebruikers moeten stekgegevens volgens het bestaande gegevensbeleid kunnen beheren;
- GIS mag geen account of cloudopslag vereisen voor kerngebruik;
- lokale opslag/cache wordt gebruikt waar technisch en juridisch passend;
- licentie-, bronvermeldings- en hergebruikvoorwaarden worden vóór publicatie gecontroleerd.

## 15. Implementatiefasen

### Fase 0 — Voorbereiding en baseline

- Lees projectcontext, roadmap en relevante implementatiedocumentatie.
- Inspecteer actuele code, opslag, offline-first architectuur en deployment.
- Inventariseer bronbestanden, lagen, velden, CRS, verticale referentie en licenties.
- Bepaal pilotgrens Culemborg.
- Leg huidige test-/buildstatus vast.

**Oplevering:** technische randvoorwaarden, broninventaris en reproduceerbaar importplan. Geen applicatiegedrag gewijzigd.

### Fase 1 — GIS-import en Culemborg-selectie

- Importeer bronbestanden in een gecontroleerde stagingomgeving.
- Valideer geometrieën, attributen, CRS en hoogtereferenties.
- Selecteer alle relevante watergangen, profielen en objecten voor het pilotgebied.
- Maak importlog, aantallenrapport en uitzonderingenlijst.

**Acceptatie:** import is reproduceerbaar; brondata zijn herleidbaar; onzekere metadata zijn expliciet gemarkeerd.

### Fase 2 — Watermatcher

- Bouw kandidaatselectie en metrische afstandsberekening.
- Detecteer parallelle en dicht bij elkaar liggende watergangen.
- Behandel GPS-nauwkeurigheid en punten op land/nabij de oever.
- Ondersteun ambigue resultaten en gebruikersbevestiging.

**Acceptatie:** representatieve testlocaties worden correct gematcht of expliciet als ambigu/onbekend gerapporteerd.

### Fase 3 — Profile Matcher

- Koppel meetprofielen ruimtelijk aan watergangsegmenten.
- Bepaal kruising, oriëntatie en chainage.
- Positioneer leggerprofielen afzonderlijk.
- Sla matchbewijs, score en uitzonderingen op.

**Acceptatie:** koppeltabel is controleerbaar en fout-/twijfelgevallen zijn zichtbaar.

### Fase 4 — Profielreconstructie en diepte-engine

- Reconstructie van dwarsprofielen uit meetpunten.
- Onderscheid tussen bodemlagen.
- Detectie van ontbrekende, dubbele en onlogische meetpunten.
- Diepte-/bodemschatting met begrensde interpolatie.
- Leggerreferenties gescheiden houden van metingen.

**Acceptatie:** profieluitkomsten zijn reproduceerbaar; meting, legger en schatting worden niet door elkaar gehaald.

### Fase 5 — Confidence en GIS-interface

- Kwaliteitsklassen en onzekerheidsregels implementeren.
- Provenance en datasetversies vastleggen.
- API-/interfacecontract implementeren en testen.
- Geen schijnprecisie bij onvoldoende gegevens.

**Acceptatie:** elke respons is herleidbaar, versieerbaar en valideerbaar.

### Fase 6 — Coach-integratie

- GIS-context optioneel aan de Coach beschikbaar maken.
- Waterherkenning en profieldekking tonen.
- Handmatige stekpin ondersteunen.
- Geen bestaande prognose- of sessielogica aanpassen zonder afzonderlijke toestemming.

**Acceptatie:** regressietests slagen; bestaande functionaliteit en historische data blijven intact.

### Fase 7 — Validatie en uitbreiding

- Testen op meerdere bekende Culemborgse visstekken.
- Uitkomsten waar mogelijk vergelijken met veldmetingen/echolood of betrouwbare lokale kennis.
- Afwijkingen en dekking documenteren.
- Pas na formele evaluatie besluiten over uitbreiding buiten Culemborg.

**Acceptatie:** pilot heeft meetbare kwaliteit, gedocumenteerde beperkingen en een expliciet go/no-go-besluit.

## 16. Acceptatietests

1. GPS in WGS84 wordt correct en reproduceerbaar naar de metrische GIS-CRS getransformeerd.
2. Een punt naast twee parallelle watergangen veroorzaakt geen ongefundeerde automatische keuze.
3. Een punt op land nabij een watergang wordt niet zonder waarschuwing als punt in het water behandeld.
4. Een handmatig verplaatste stekpin wordt bewaard en opnieuw gematcht.
5. Profielmatching gebruikt geometrie, oriëntatie en chainage; niet alleen profielnummer of hemelsbrede afstand.
6. Meetprofielen en leggerprofielen blijven afzonderlijke broncategorieën.
7. Profielpunten worden correct geordend; ontbrekende en dubbele punten worden gemarkeerd.
8. Bodemhoogte wordt niet als actuele waterdiepte getoond zonder waterstand in hetzelfde verticale referentiestelsel.
9. Interpolatie wordt geweigerd of gedegradeerd bij grote afstand, discontinuïteit of onzekere profielmatch.
10. Confidence D resulteert in “onvoldoende gegevens”, niet in een exact getal.
11. Afgeleide resultaten bewaren bronprofielen, bronversies, methode en berekeningstijdstip.
12. GIS-uitval of ontbrekende dekking breekt bestaande sessie- en prognosefuncties niet.
13. Bestaande sessies, vangsten, stekken, foto's, instellingen en prognosesnapshots blijven ongewijzigd.
14. GIS kan tijdens tests uitgeschakeld worden; bestaande prognose-uitkomsten blijven dan gelijk.
15. Licentie- en privacycontroles zijn afgerond voordat GIS-data in de gepubliceerde app worden aangeboden.

## 17. Risico's en beheersmaatregelen

| Risico | Mogelijk gevolg | Beheersmaatregel |
|---|---|---|
| Verkeerde CRS/verticale referentie | Verkeerde locaties of hoogtes | Metadata valideren; steekproefcontroles; NAP niet aannemen zonder bewijs |
| Parallelle watergangen | Verkeerde watermatch en profielen | Ambiguïteitsdetectie en gebruikersbevestiging |
| Verschillende profiel-ID's | Foutieve koppeling | Ruimtelijke matching met bewijs; ID alleen als attribuut |
| Te weinig meetprofielen | Onbetrouwbare interpolatie | Dekking tonen; extrapolatie beperken; confidence verlagen |
| Legger verward met actuele meting | Onjuiste diepteverwachting | Broncategorieën strikt scheiden en duidelijk labelen |
| Privéstek onbedoeld gedeeld | Privacyverlies | Exacte locaties standaard privé; delen opt-in |
| GIS te vroeg in prognose | Regressie of schijnverbetering | Eerst informatief; prognosegebruik pas na afzonderlijke evaluatie |
| Te grote dataset voor clientopslag | Trage app of opslagproblemen | Import-/queryproef en passende indexering; opslagkeuze baseren op metingen |

## 18. Besluiten vóór implementatie

De volgende punten worden in fase 0 vastgesteld en waar nodig ter goedkeuring voorgelegd:
1. Exacte pilotgrens: gemeentegrens Culemborg of een praktisch ruimer gebied.
2. Definitieve CRS en verticale referentie per bronlaag.
3. Bronlicenties en voorwaarden voor opslag, afgeleide producten en distributie.
4. Bestaande opslag- en deploymentmogelijkheden voor ruimtelijke data.
5. Beschikbaarheid van actuele waterstanden om bodemhoogte naar waterdiepte om te rekenen.
6. Privacygedrag voor GPS, handmatige stekken en synchronisatie.

## 19. Definition of Done — Culemborg-pilot

De pilot is pas geslaagd wanneer:
- een teststek naar een watergang wordt herleid of expliciet ambigu/onbekend wordt gemarkeerd;
- relevante meetprofielen reproduceerbaar worden gevonden;
- dwarsprofielen correct worden gereconstrueerd;
- meetdata, leggerreferenties en schattingen duidelijk gescheiden blijven;
- hoogtereferentie en beperkingen expliciet zijn;
- de Coach onzekerheid en bronherkomst toont;
- de bestaande app regressievrij blijft;
- resultaten op bekende stekken zijn gecontroleerd en de beperkingen zijn gedocumenteerd.

## 20. Document- en implementatiestatus

**Blueprintstatus:** ontwerp ter goedkeuring.  
**Implementatiestatus:** niet gestart.  
**Codewijzigingen:** geen onderdeel van deze blueprint-commit.  
**Databasewijzigingen:** niet uitgevoerd.  
**Branch/PR voor implementatie:** niet aangemaakt.  
**Volgende stap na toestemming:** uitsluitend fase 0 starten: actuele repository en architectuur inspecteren, brondata formeel inventariseren en de Culemborg-pilot afbakenen.

De gebruiker heeft expliciet gekozen voor de **geavanceerde** aanpak. Deze blueprint documenteert die keuze, maar geeft op zichzelf geen toestemming om de GIS-functionaliteit te implementeren.

---
## 21. Aanvullingen na technische review (4 november 2026)

Deze aanvullingen scherpen de oorspronkelijke blueprint aan. De geavanceerde architectuur blijft behouden. Dit document geeft geen toestemming voor implementatie in de productieapplicatie.

### 21.1 Angler position, fishing spot en positie in het dwarsprofiel

Leg drie afzonderlijke posities vast:
1. Angler position: GPS-positie van de visser/telefoon.
2. Fishing spot: daadwerkelijke beoogde visplek, handmatig gekozen of afgeleid uit expliciet ingevoerde werprichting en afstand.
3. Position within cross-section: positie van de fishing spot over de breedte van het dwarsprofiel.

Projectie op de hartlijn levert chainage op, maar bepaalt niet vanzelf de positie over de dwarsdoorsnede. Bepaal daarom waar geometrie en profieloriëntatie dit toelaten ook de dwarse offset. Als die offset niet betrouwbaar kan worden vastgesteld, claimt de module geen diepte op de exacte visplek maar toont zij het volledige dwarsprofiel.

Bewaar per positie de bron, oorspronkelijke coördinaten, GPS-nauwkeurigheid indien beschikbaar, gebruikerscorrectie, projectieafstand, chainage, dwarse offset en gebruikte geometrie-/profiel-ID's. Werprichting en afstand zijn optioneel en mogen nooit worden verondersteld.

### 21.2 Watergangidentiteit en segmenttopologie

Maak onderscheid tussen bronobject-ID, logisch watergang-ID (alleen indien de bronsemantiek dit ondersteunt), geometrisch segment-ID en netwerkverbindingen. Een niet-unieke broncode mag niet als primaire sleutel dienen.

Segmenten mogen alleen tot één logisch watergangnetwerk worden samengevoegd wanneer bronattributen en geometrische/netwerktopologie dat ondersteunen. Nabijheid alleen is onvoldoende: kruisingen, duikers, sifons en parallelle watergangen kunnen dicht bij elkaar liggen zonder dezelfde watergang te vormen.

Bewaar originele segmentgeometrie en de regels waarmee segmenten eventueel zijn gegroepeerd. Chainage moet reproduceerbaar zijn binnen een vastgelegde netwerkversie en richting. Bij onduidelijke richting of meerdere netwerkpaden wordt de positie ambigu gerapporteerd.

### 21.3 Profile Matcher: expliciete kandidaatbeoordeling

Verzamel eerst profielkandidaten en beoordeel ze daarna op minimaal:
- afstand van profielgeometrie tot watergang;
- wel/geen geometrische kruising en type kruising;
- hoek tussen profielrichting en lokale watergangrichting;
- profiel-lengte en plausibele dekking van beide oevers;
- positie/chainage van de kruising;
- aantal concurrerende watergangkandidaten;
- geometrievaliditeit en bronkwaliteit.

Een numerieke matchscore mag pas worden geïntroduceerd nadat representatieve positieve en negatieve voorbeelden handmatig zijn gelabeld. Tot die tijd gebruikt de PoC transparante statussen (matched, ambiguous, rejected, needs_review) en toont hij de bewijswaarden. Een niet-gekalibreerde score wordt nooit als waarschijnlijkheidspercentage gepresenteerd.

Profielen die meerdere watergangen kruisen, een onwaarschijnlijke hoek hebben of niet aantoonbaar bij het bedoelde water horen, worden niet automatisch gekoppeld.

### 21.4 Verticale referentie als harde voorwaarde

Een verticale referentie is een harde voorwaarde voor numerieke actuele waterdiepte, niet slechts een confidence-factor.

- Verticale CRS/datum, eenheid en eventuele transformatie moeten per bronlaag bekend en gevalideerd zijn.
- Een horizontale transformatie naar EPSG:28992 valideert geen verticale hoogtes.
- Bodemhoogte mag alleen met een waterstand worden gecombineerd als beide aantoonbaar dezelfde verticale referentie en compatibele eenheden gebruiken.
- Bij onbekende of incompatibele referentie wordt geen actuele waterdiepte berekend. Toon hoogstens de bronhoogte met waarschuwing of de profielvorm indien relatieve hoogtes betrouwbaar zijn.
- Een gemeten profiel blijft een historische momentopname; meetdatum en mogelijke onderhouds-/baggerwerkzaamheden blijven zichtbaar.

Verduidelijk het Coach-contract: measured mag een direct gemeten bodemhoogte/profiel betekenen, maar niet automatisch een actuele waterdiepte. Gebruik afzonderlijke velden voor bedElevation en waterDepth, elk met eigen type, eenheid, verticale referentie, bron en datum.

### 21.5 Interpolatie en extrapolatie

Interpolatie is alleen toegestaan wanneer beide begrenzende profielen aan dezelfde gevalideerde watergang/netwerkroute zijn gekoppeld, de volgorde langs chainage ondubbelzinnig is, de positie binnen het interval ligt, beide profielen voldoende compleet en vergelijkbaar zijn, er geen bekende discontinuïteit/kunstwerk/onderhoudsgrens tussen ligt en verticale referenties compatibel zijn.

Extrapolatie buiten het bereik van gemeten profielen wordt in de eerste pilot standaard niet als numerieke diepteschatting aangeboden. Toon de afstand tot het dichtstbijzijnde profiel en status unavailable of insufficient_coverage.

Numerieke drempels voor maximale profielafstand worden niet gegokt. Ze worden na de Culemborg-inventarisatie bepaald op basis van de feitelijke afstandsverdeling, profielvariatie en validatieresultaten. Iedere drempel wordt versiebeheerd.

### 21.6 Confidence: status plus bewijs, geen schijnprecisie

Bewaar afzonderlijke kwaliteitsdimensies voor watergangmatch, profielmatch, meetpunt-/profielkwaliteit, meetactualiteit, dekking/interpolatieafstand, verticale referentie en positiezekerheid van de fishing spot.

Een samengestelde A/B/C/D-klasse mag een harde blokkade niet overrulen. Onbekende verticale referentie blokkeert actuele waterdiepte, ook als geometrische matches goed zijn. Gebruik geen percentage dat als statistische kans kan worden gelezen tenzij dit met een representatieve validatieset is gekalibreerd. Toon begrijpelijke redenen en bewijswaarden.

### 21.7 Datasetversies en actualiteit

Elke import krijgt een onveranderlijke datasetversie met bronbestandsnaam en checksum, bronhouder en licentie, publicatie-/vaststellingsdatum indien bekend, importdatum, software- en transformatieversies, CRS/verticale referentie per laag, aantallen ingelezen/afgekeurde records en validatie-/uitzonderingenrapport.

Nieuwe datasets vervangen historische bronversies niet stilzwijgend. Afgeleide matches en schattingen verwijzen naar exacte datasetversies. Een herimport kan resultaten veranderen; dat moet zichtbaar en reproduceerbaar zijn. Bestaande sessies en prognosesnapshots worden niet achteraf herschreven.

### 21.8 Opslag- en performancebesluit op basis van benchmark

Leg de opslagkeuze pas vast na een reproduceerbare benchmark met de pilotselectie. Meet minimaal omvang van bron- en pilotdata, importtijd/geheugen, querytijd voor watergang- en profielzoekopdrachten, reconstructietijd, lokale opslaggrootte, offline-/updategedrag en impact op laadtijd en interacties van de bestaande app.

Laad niet alle circa 1,45 miljoen meetpunten in browsergeheugen of React-state. Verwerk GIS in een gecontroleerde preprocessing-/querylaag. De browser ontvangt alleen relevante watergangen, profielen en compacte provenance. Een ruimtelijke backend/PostGIS is een optie, geen vooraf vaststaand vereiste.

### 21.9 Validatieprotocol en meetbare acceptatie

Maak een handmatig gecontroleerde referentieset met:
- stekken met één duidelijke kandidaat-watergang;
- stekken naast parallelle/dichtbijgelegen watergangen;
- stekken bij kruisingen, duikers of kunstwerken;
- GPS-punten op de oever;
- locaties met en zonder nabijgelegen meetprofielen.

Leg per testgeval de bedoelde watergang, relevante segmenten, profiel-ID's en onzekerheid vast. Rapporteer minimaal het aantal correct gekoppelde stekken, ambigue/onbekende stekken, foutieve automatische matches, precisie van automatische matches, profielmatch-juistheid op de gecontroleerde subset, afstandsverdeling tot relevante profielen en aandeel locaties zonder betrouwbare numerieke diepte-uitkomst.

Veilig uitgangspunt voor de pilot: geen foutieve automatische watergangkeuze in de handmatig gecontroleerde referentieset. Ambigue gevallen mogen als ambigu worden teruggegeven. Een kleine referentieset bewijst geen landelijke nauwkeurigheid; rapporteer aantallen, noemers en beperkingen.

Stel numerieke foutmarges voor de diepte-engine pas vast wanneer onafhankelijke referentiemetingen met bekende datum, positie en verticale referentie beschikbaar zijn. Zonder zulke referenties valideert de PoC de geometrie- en dataketen, niet de absolute nauwkeurigheid van actuele waterdiepte.

### 21.10 Aanvullende acceptatietests

16. Angler position en fishing spot zijn afzonderlijke objecten en onafhankelijk aanpasbaar.
17. Chainage en dwarse profiel-offset worden niet met elkaar verward.
18. Een profiel dat meerdere watergangen kruist, wordt niet zonder onderbouwing automatisch toegewezen.
19. Niet-unieke broncodes veroorzaken geen overschrijving of onbedoelde samenvoeging.
20. Onbekende verticale referentie blokkeert actuele waterdiepte.
21. Interpolatie vindt alleen plaats tussen geschikte profielen op dezelfde ondubbelzinnige watergangroute.
22. Extrapolatie buiten meetbereik levert in de eerste pilot geen numerieke diepteclaim op.
23. Elke match en schatting verwijst naar onveranderlijke datasetversies en reproduceerbare parameters.
24. De referentieset rapporteert foutieve automatische matches afzonderlijk van ambigue/onbekende uitkomsten.
25. Een benchmark toont dat alleen relevante pilotgegevens worden opgehaald en niet alle bronmeetpunten in browsergeheugen worden geladen.

## 22. Eerstvolgende uitvoering: PoC vóór implementatie

De eerstvolgende praktische stap is een geïsoleerde, reproduceerbare GIS-PoC op de vijf afgesproken Culemborgse stekken en de twee bronbestanden. Dit is data-analyse, geen applicatie-implementatie.

De PoC levert:
1. broninventaris per relevante laag, inclusief CRS, verticale referentie, velden en aantallen;
2. kandidaat-watergangen per stek, inclusief afstanden en ambiguïteit;
3. gekozen of handmatig te beoordelen segmenten en chainage;
4. relevante gemeten profiel-ID's, profielposities en afstanden langs de watergang;
5. afzonderlijke Leggerprofielen;
6. gereconstrueerde dwarsprofielen met laagonderscheid en meetdatum;
7. expliciete beoordeling van verticale referentie en of absolute waterdiepte berekenbaar is;
8. uitzonderingen, ontbrekende data en onzekerheden;
9. reproduceerbare scripts, parameters en resultatenrapport.

De vijf pilotlocaties zijn:
- Lokkershoek speelplek — 51.943588, 5.191197
- Lokkershoek Pier — 51.944861, 5.192340
- Kanaal schapen #1 — 51.948939, 5.189031
- Vijver achter Kanaal schapen #1 — 51.948647, 5.189778
- Bomedikke speeltuin — 51.954158, 5.229510

De vier eerste locaties liggen relatief dicht bij elkaar. De PoC moet juist aantonen dat nabijgelegen, afzonderlijke wateren niet op basis van alleen de dichtstbijzijnde lijn worden verward. Bomedikke is een geografisch afzonderlijke controlelocatie.

**PoC-beperkingen:** geen wijzigingen aan app-code, database, bestaande stekken, prognose-engine of productieopslag. Geen automatische commits of deployment. Geen actuele waterdiepte claimen zonder gevalideerde verticale referentie en passende waterstand. Resultaten worden per stek met bronverwijzingen en reproduceerbare tussenstappen opgeleverd.

**Go/no-go na PoC:** pas na beoordeling van matching, profieldekking, verticale referenties, foutgevallen en benchmark wordt besloten of fase 1 van implementatie mag starten. De PoC zelf geeft geen toestemming voor implementatie.

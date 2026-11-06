# PROJECT_CONTEXT.md — Vislogboek
> **Doel van dit document:** blijvend product-, wetenschaps- en technisch projectgeheugen voor Vislogboek. Dit document is de leidende bron voor productrichting, architectuurprincipes, datakwaliteit, prognosevalidatie en ontwikkelafspraken.
>
> **Werkwijze voor iedere AI-/ontwikkelsessie:** lees dit document én controleer de actuele code voordat je een wijziging voorstelt of uitvoert. De code is de waarheid over wat daadwerkelijk is geïmplementeerd; dit document is de waarheid over wat het product moet worden en welke afspraken gelden. Werk dit document bij wanneer een afspraak, architectuurkeuze of status verandert.

**Project:** Vislogboek  
**Repository:** `sennzor-wq/Vislogboek`  
**Huidige technische basis bij opstellen:** React 19, TypeScript, Vite, PWA, Dexie 4 / IndexedDB, Open-Meteo  
**Documentstatus:** eerste geconsolideerde product- en technische blueprint op basis van de repository en de projectbesprekingen tot en met 1 november 2026.  
**Belangrijk:** dit is een richtinggevend ontwerp en code-audit op hoofdlijnen, geen claim dat alle hieronder beschreven toekomstige functionaliteit al bestaat.

---

## 1. Productvisie en missie

Vislogboek wordt een betrouwbare, wetenschappelijk onderbouwde en praktisch bruikbare visapp voor **beginnende én ervaren vissers**. De app helpt een gebruiker om voor een gekozen vissoort, locatie, gewenste start- en eindtijd en vistechniek een zo goed mogelijk onderbouwde verwachting en concreet visadvies te krijgen.

De app moet niet alleen een score tonen, maar uitleggen **waarom** een advies wordt gegeven, welke gegevens en kennis eraan ten grondslag liggen, hoe sterk het bewijs is en wat onzeker of onbekend blijft.

De kernbelofte:

1. **Feitelijk en transparant:** onderscheid tussen gemeten gegevens, weersverwachtingen, modelschattingen, gebruikerswaarnemingen en wetenschappelijke kennis.
2. **Soortspecifiek:** biologie, fysiologie, seizoensritme, habitat, gedrag en voorkeuren moeten per vissoort worden behandeld. Geen generieke aannames die zonder onderbouwing voor alle soorten gelden.
3. **Contextueel:** weer, water, locatie, diepte, oever, wind, stroming, tijdstip, seizoen, aas, voer, techniek, visdruk en waargenomen visactiviteit worden meegenomen waar de gegevens en onderbouwing dat toelaten.
4. **Persoonlijk lerend:** de gebruiker bouwt eerst met eigen sessies en prognoses een persoonlijke gegevensbasis op.
5. **Meetbaar verbeteren:** prognoses worden vooraf vastgelegd en achteraf objectief geëvalueerd, onder andere met de Brier-score en kalibratie.
6. **Eerlijk over onzekerheid:** geen schijnnauwkeurigheid, verzonnen waarden of overdreven vangstpercentages.
7. **Eén centrale kennis- en modelarchitectuur:** bestaande engines, bronnen en gegevens worden hergebruikt en verbeterd. Er worden nooit parallelle of dubbele engines gebouwd voor hetzelfde doel.

Vislogboek is nadrukkelijk meer dan een digitaal vangstboek. Het logboek is de empirische basis waarmee de advies- en prognosekwaliteit op termijn kan worden onderzocht en verbeterd.

## 2. Productfasering

### Fase 0 — Persoonlijke nulmeting en onderzoeksfase (huidige hoofdfase)

De eerste versie wordt primair door de eigenaar gebruikt. Het doel is een betrouwbare nulmeting opbouwen door gedurende bij voorkeur **12 tot 24 maanden** sessies vast te leggen in combinatie met vooraf opgeslagen prognoses. De exacte duur is geen harde garantie: de hoeveelheid en spreiding van bruikbare gegevens bepalen of de nulmeting voldoende is.

Doelen:
- Ervaren hoe de app zich in echte vissituaties gedraagt.
- Vaststellen of invoer praktisch en volledig genoeg is.
- Controleren of prognoses vooraf reproduceerbaar worden opgeslagen.
- Vastleggen van succesvolle sessies én bevestigde nulvangsten.
- Onbekende of onvolledige uitkomsten apart houden.
- Brier-score, kalibratie en prestaties per soort, seizoen, locatie, tijdvak en relevante omstandigheden volgen.
- Onderzoeken welke factoren werkelijk voorspellende waarde hebben en welke alleen aannemelijk lijken.
- Fouten, datakwaliteitsproblemen en systematische vertekeningen ontdekken voordat de app openbaar wordt.

Tijdens deze fase is het doel eerst een betrouwbare meetbasis te verzamelen, niet om de prognose voortdurend op kleine aantallen sessies te optimaliseren. Modelwijzigingen moeten versiebeheer en eerlijke voorwaartse evaluatie behouden.

### Fase 1 — Betrouwbare persoonlijke app

- Offline-first en lokaal bruikbaar.
- Eigen locaties, sessies, vangsten, waarnemingen, weergegevens en prognoses.
- Persoonlijke statistieken en evaluaties.
- Export en import van back-ups.
- Transparante bron- en onzekerheidsinformatie.
- Persoonlijke prognose op basis van algemene kennis plus voldoende eigen gegevens.
- Geen account of cloudverplichting.

### Fase 2 — Publieke gratis versie

De app beschikbaar maken voor andere vissers, beginners en gevorderden. De gratis variant moet daadwerkelijk bruikbaar zijn en mag niet afhankelijk zijn van een betaald abonnement om de basisfunctionaliteit te kunnen gebruiken.

Beoogde basis:
- Algemene soortprofielen, biologische kennis en bronverantwoorde prognoseregels.
- Weer- en locatiecontext.
- Sessie- en vangstregistratie.
- Lokale opslag als volwaardige privacyvriendelijke keuze.
- Persoonlijke prognoses op basis van eigen gegevens.
- Export/import en inzicht in de eigen evaluatie.

De precieze functies en infrastructuur worden later uitgewerkt; deze fase is nog niet volledig gebouwd.

### Fase 3 — Optionele cloud- en Plus-dienst

Gebruikers krijgen een expliciete keuze:
- **Lokaal / privé / gratis:** gegevens blijven op het eigen apparaat en worden niet voor gedeelde modelverbetering aangeleverd.
- **Cloud / Plus:** gebruiker kiest bewust voor cloudopslag en kan, met afzonderlijke duidelijke toestemming, bijdragen aan geanonimiseerde of gepseudonimiseerde gegevens voor gezamenlijke analyse en modelverbetering.

Cloudopslag en toestemming voor datagebruik zijn twee verschillende keuzes. Een gebruiker mag cloudopslag niet automatisch hoeven te accepteren als voorwaarde voor deelname aan datadeling, en omgekeerd. De uiteindelijke abonnementsvoorwaarden, bewaartermijnen, export, verwijdering, privacyverklaring en betaalinfrastructuur moeten vóór lancering expliciet worden ontworpen.

Gezamenlijke gegevens mogen pas invloed krijgen op algemene prognoses nadat de kwaliteit, representativiteit en validatie aantoonbaar voldoende zijn.

---

## 3. Wetenschappelijke en inhoudelijke uitgangspunten

### 3.1 Eén factor is nooit automatisch een bewezen vangstvoorspeller

De app mag weer- of natuurkundige omstandigheden beschrijven zonder automatisch te beweren dat ze de vangstkans verhogen of verlagen.

Voorbeelden:
- Luchtdruk en druktrend kunnen als weerscontext worden getoond. Een directe biologische bonus/malus is alleen toegestaan als daarvoor voldoende soortspecifiek bewijs bestaat.
- Windrichting kan relevant zijn voor drift, golfslag, oevertemperatuur, zuurstofuitwisseling en positionering, maar de uitwerking hangt af van water, oeveroriëntatie, seizoen, temperatuur en lokale geometrie.
- Luchttemperatuur is geen watertemperatuur.
- Een modelschatting van watertemperatuur is nooit een meting.
- Geen waarneming van visactiviteit betekent niet dat er geen vis aanwezig is.
- Een vangst op een stek bewijst niet op zichzelf dat één weersfactor de vangst heeft veroorzaakt.

### 3.2 Bronnen en bewijskracht

Alle kennis die de prognose of adviezen onderbouwt moet centraal worden geregistreerd, met ten minste:
- Unieke bron-/kennis-ID.
- Onderwerp en relevante vissoort(en).
- Bronverwijzing die controleerbaar is.
- Type bron (peer-reviewed onderzoek, overheids-/instituutbron, technische dataset, praktijkwaarneming, hypothese).
- Samenvatting van de bevinding.
- Bewijskracht: sterk, redelijk/gematigd, beperkt of onbekend.
- Beperkingen, populatie, geografische context en toepasbaarheid.
- Datum van beoordeling en eventueel herbeoordeling.
- Status: informatief, kandidaat voor modelgebruik, goedgekeurd voor prognose, afgewezen/verouderd.

Een bron in het register betekent niet automatisch dat deze factor in de prognose mag meetellen. Directe modeltoepassing vereist expliciete beoordeling en goedkeuring. Aannames moeten als aannames herkenbaar blijven.

### 3.3 Soortspecifieke biologie

Per soort moet de centrale kennislaag waar beschikbaar informatie bevatten over:
- Temperatuurgevoeligheid en metabolisme.
- Voedselopname, vertering en seizoensritme.
- Dag-/nachtactiviteit en schemergedrag.
- Habitat, diepte, dekking, bodem en waterkolom.
- Voortplantingsperiode en relevante gedragsveranderingen.
- Stromend versus stilstaand water.
- Relevante weers- en omgevingsreacties.
- Onzekerheid en geografische verschillen.

Fysiologische optimum- en tolerantiecurves mogen niet zonder bron of expliciete onderbouwing worden gepresenteerd als universele waarheid. De curves moeten soortspecifiek zijn en onzekerheid/variatie toelaten.

### 3.4 Scheid biologische activiteit van persoonlijke vangstkans

Dit is een harde ontwerpregel.

- **Biologische activiteitsindex (1–10):** relatieve indicatie van verwachte activiteit onder de omstandigheden. Dit is geen kanspercentage en mag niet als vangstgarantie worden geïnterpreteerd.
- **Persoonlijke vangstkans (%):** kans op ten minste één vangst van de gekozen doelsoort tijdens de gekozen sessieduur en binnen de relevante context. Alleen tonen als voldoende bruikbare, vergelijkbare gegevens beschikbaar zijn.
- **Verwacht aantal vissen:** aparte maat, indien voldoende data en een geschikt telmodel beschikbaar zijn.
- **Betrouwbaarheid/onzekerheid:** apart tonen; een hoog activiteitssignaal betekent niet automatisch dat de persoonlijke vangstkans betrouwbaar is.

De app mag geen vangstkans fabriceren wanneer het aantal bruikbare sessies onvoldoende is. In dat geval: `null` / “onvoldoende gegevens”, met uitleg welke data ontbreken.

---

## 4. Prognosemodel: conceptueel ontwerp

De prognose wordt opgebouwd uit één centrale orkestrerende prognose-engine. Deze gebruikt de centrale kennislaag, gegevensbronnen en gespecialiseerde deelanalyses. Deel-engines mogen een eigen afgebakende verantwoordelijkheid hebben, maar er mag per domein slechts één gezaghebbende implementatie zijn.

### 4.1 Invoergegevens

Waar beschikbaar:
- Doelsoort.
- Locatie en GPS-coördinaten.
- Watertype (plas, kanaal, rivier, polder, haven enz.).
- Diepte, diepteverloop, oeveroriëntatie en waar mogelijk bodem-/habitatkenmerken.
- Datum, starttijd, eindtijd en geplande sessieduur.
- Weer: luchttemperatuur, windrichting/-snelheid/-vlagen, neerslag, bewolking, zoninstraling, luchtdruk en druktrend.
- Water: gemeten watertemperatuur, diepte van meting, meettijd en eventueel geschatte temperatuur met bandbreedte.
- Waterbeweging, stroming, zicht, waterstand en andere beschikbare context.
- Waargenomen activiteit: springen/rollen, aasbellen, aanbeten, recente vangsten of expliciet geen waarneming.
- Techniek, hengelaantal, aas, voer, voermethode, haakaas en voorvoeren.
- Persoonlijke historie en, later, toegestane collectieve gegevens.

Niet elk veld hoeft verplicht te zijn. De app moet ontbrekende gegevens zichtbaar maken en mag ze niet stilzwijgend vervangen door verzonnen meetwaarden.

### 4.2 Prognose-output

Een prognose moet waar mogelijk tonen:
- Activiteitsindex per relevant tijdvak.
- Persoonlijke vangstkans en onzekerheidsinterval, alleen bij voldoende data.
- Beste en alternatieve tijdvakken.
- Korte, concrete uitleg van positieve, neutrale en negatieve factoren.
- Windrichting en windbestemming correct onderscheiden.
- Visbewegings- en habitatadvies, met expliciete afhankelijkheid van lokale water-/oevergegevens.
- Hengelpositionering en werp-/voeradvies waar locatie-informatie dat ondersteunt.
- Voorvoeradvies indien relevant.
- Bron-/bewijskracht per factor.
- Herkomst van gebruikte gegevens: gemeten, voorspeld, gemodelleerd, door gebruiker waargenomen of onbekend.
- Ontbrekende informatie en onzekerheden.
- Modelversie en prognosemoment.

De app moet bij voorkeur ook de weersontwikkeling vóór en na de sessie betrekken als dat biologisch of praktisch relevant is, niet uitsluitend de weersverwachting op de sessiedag.

### 4.3 Geen dubbeltelling

Eén onderliggende factor mag niet via verschillende deel-engines ongemerkt meerdere keren dezelfde invloed op de prognose krijgen. Bijvoorbeeld temperatuur die al in een thermische efficiëntiecurve is verwerkt, mag niet nogmaals als ongecontroleerde seizoensbonus worden toegevoegd.

Elke factor heeft één centrale definitie, bron/herkomst, toepassingsdoel en modelrol. De prognose-engine combineert de uitkomsten gecontroleerd en documenteert interacties.

### 4.4 Praktisch advies versus biologische score

Tactische adviezen (bijvoorbeeld werprichting, hengelpositionering, materiaalkeuze of aasaanbieding) mogen nuttig zijn zonder automatisch de biologische activiteitsindex of vangstkans te veranderen. Een advies mag pas de kansberekening beïnvloeden als de relatie aantoonbaar en afzonderlijk gevalideerd is.

---

## 5. Dataverzameling en sessielogboek

De kwaliteit van de prognose kan nooit beter zijn dan de kwaliteit van de waarnemingen. De app moet daarom sessies zorgvuldig en eenvoudig registreerbaar maken.

### 5.1 Sessiestatus

Houd minimaal onderscheid tussen:
- Actief.
- Afgerond met doelsoortvangst.
- Afgerond zonder doelsoortvangst (bevestigde nulvangst).
- Onbekend/onvoldoende geregistreerd.

Een sessie met een andere vissoort dan de doelsoort is voor de doelsoortprognose niet automatisch een succes. Een sessie met ontbrekende vangstregistratie is niet automatisch een nulvangst.

### 5.2 Registratievelden

Relevante gegevens zijn onder meer:
- Locatie en exacte vispositie, met privacybewuste instellingen.
- Start/eindtijd en effectieve visduur.
- Doelsoort(en) en werkelijk gevangen soort(en), aantallen, gewicht/lengte indien bekend.
- Groepssessiecontext: optioneel aantal deelnemers en het totale aantal hengels dat de hele groep gebruikt. Het bestaande veld `rodCount` betekent het totale aantal hengels van de groep, niet het aantal per visser.
- Optionele details per hengel (positie/zone, techniek, aas/presentatie en actieve tijdsintervallen) wanneer de gebruiker dit wil vastleggen.
- Techniek, aas, voer en voorvoer.
- Diepte en watertemperatuur (optioneel; meetmethode, diepte en tijd vastleggen).
- Weer bij start en tijdens sessie.
- Aanbeten en gemiste vissen als afzonderlijke aantallen/gebeurtenissen, niet als visaanwezigheidswaarneming.
- Waarnemingen van visactiviteit zoals springen/rollen, aasbellen en recente activiteit. Geen waarneming is geen bewijs van afwezigheid; oude registraties van `aanbeten` in het waarnemingstype blijven alleen voor compatibiliteit bestaan.
- Foto's en notities als optionele ondersteuning.
- Of gegevens live zijn ingevoerd of achteraf zijn geïmporteerd.

### 5.3 Historische en geïmporteerde gegevens

Historische sessies zijn waardevol voor beschrijvende statistiek en context, maar zijn niet automatisch geschikt voor prognosevalidatie. Voor een eerlijke Brier-evaluatie is een prognose nodig die vóór de sessie is vastgelegd. Achteraf opgehaalde historische weerdata maakt een sessie niet alsnog tot een vooraf voorspelde sessie.

Ontbrekende waarden blijven onbekend. Historische weerdata mag alleen worden toegevoegd met duidelijke bron, tijdzone en aanduiding dat het achteraf opgehaalde gegevens zijn.

---

## 6. Prognosemomentopnames en Brier-evaluatie

### 6.1 Onveranderlijke voorspelling

Elke te evalueren prognose wordt vóór de sessie als onveranderlijke momentopname opgeslagen. De voorspelling zelf mag achteraf niet worden aangepast op basis van de uitkomst.

Een snapshot moet minimaal vastleggen:
- Exact prognosemoment en doelmoment/-tijdvak.
- Doelsoort, locatie en geplande sessieduur.
- Gedefinieerde voorspellingsgebeurtenis (bijvoorbeeld: minimaal één doelvis gevangen).
- Voorspelde kans, indien beschikbaar.
- Activiteitsindex apart.
- Modelversie, modelconfiguratie en gebruikte parameters.
- Factoren, invoerwaarden, bron/herkomst en ontbrekende waarden die de voorspelling hebben bepaald.
- Weerprognose zoals die op het voorspellingstijdstip beschikbaar was (niet achteraf vervangen door werkelijk weer).
- Onzekerheidsinterval en reden voor eventuele niet-beschikbare kans.

### 6.2 Uitkomst koppelen

Na afronding wordt de sessie aan de juiste vooraf opgeslagen snapshot gekoppeld. De evaluatie mag alleen plaatsvinden wanneer:
- De sessie daadwerkelijk is afgerond.
- De doelsoort en uitkomst ondubbelzinnig bekend zijn.
- De voorspelde gebeurtenis en sessiecontext overeenkomen.
- De voorspelling vóór de sessie is vastgelegd.
- De uitkomst niet onbekend of onvolledig is.

Een sessie met een niet-doelsoort mag niet automatisch als succes voor de doelsoort worden geteld. Een vangststatus zonder bijbehorende soortregistratie mag niet stilzwijgend als doelsoortvangst worden aangenomen. Ambigue gevallen worden uitgesloten of ter correctie aangeboden.

### 6.3 Brier-score

Voor een binaire gebeurtenis:
- (p_i) = vooraf voorspelde kans op de gedefinieerde gebeurtenis, tussen 0 en 1.
- (o_i) = 1 als de gebeurtenis daadwerkelijk plaatsvond, anders 0.
- Brier-score = gemiddelde van ((p_i-o_i)^2).

Lager is beter; 0 is perfect. De score beoordeelt probabilistische voorspellingen, niet de biologische activiteitsindex.

Rapporteer naast Brier-score:
- Aantal geldige voorspelling-uitkomstparen.
- Gemiddelde voorspelde kans versus waargenomen frequentie.
- Kalibratiecurve/-tabel.
- Brier Skill Score ten opzichte van een vooraf gedefinieerde baseline.
- Betrouwbaarheidsintervallen of onzekerheidsindicatie.
- Resultaten per soort, locatie, seizoen, tijdvak en relevante horizon wanneer de aantallen dit toelaten.
- Resultaten per modelversie en evaluatieperiode.

### 6.4 Baseline en eerlijke validatie

Een baseline mag niet achteraf op dezelfde evaluatieset worden geoptimaliseerd en vervolgens als onafhankelijke referentie worden gepresenteerd. Definieer de naïeve/climatologische baseline op basis van uitsluitend de trainings-/historische gegevens die vóór de evaluatieperiode beschikbaar waren.

Gebruik chronologische, voorwaartse validatie (rolling/forward validation). Houd trainingsdata, kalibratiedata en testdata gescheiden. Voorkom dat dezelfde sessie of afgeleide informatie in zowel training als test terechtkomt.

### 6.5 Voldoende gegevens

Een lage minimumgrens kan nuttig zijn om de berekening technisch te tonen, maar is geen bewijs van betrouwbare modelkwaliteit. Vijf sessies mogen hoogstens als zeer voorlopige indicatie worden weergegeven, niet als statistisch sterke validatie.

Gebruik aantallen, spreiding, onzekerheidsintervallen en minimumvoorwaarden per analyse. Kleine subgroepen worden niet als betrouwbare soort-/seizoenconclusies gepresenteerd. Een model mag niet agressief worden bijgesteld op basis van enkele sessies.

### 6.6 Wat Brier wel en niet zegt

Brier-score meet de kwaliteit van de kansvoorspelling voor de gekozen binaire gebeurtenis. Hij bewijst niet dat een bepaalde factor causaal is, dat het advies tactisch optimaal was of dat het verwachte aantal vissen goed is. Voor aantallen, vangsttempo, duurafhankelijkheid en soortspecifieke vangstfrequentie zijn aanvullende passende evaluatiemethoden nodig.

---

## 7. Learning engine en modelverbetering

**Belangrijke huidige status:** in de huidige repository is een evaluatie-engine aanwezig die Brier-score, Brier Skill Score en kalibratiebins berekent. De prognose-engine gebruikt persoonlijke sessiehistorie voor een kansschatting. Dit is nog niet hetzelfde als een volwaardige adaptieve learning engine die op een gecontroleerde manier modelparameters leert en vrijgeeft. Bouw die ontbrekende functionaliteit later één keer centraal; maak geen tweede evaluatie- of learning-engine naast de bestaande.

### 7.1 Beoogde centrale learning-architectuur

Eén centrale learning-/modelbeheerlaag moet:
1. Alleen gevalideerde trainingsrecords ontvangen.
2. Herkomst, kwaliteit en toestemming van elk record kennen.
3. Per soort en relevante context voldoende vergelijkbare gegevens verzamelen.
4. Modelversies en parameterwijzigingen registreren.
5. Nieuwe modellen offline/in test kunnen evalueren.
6. Nieuwe modelversies vergelijken met de bestaande productieversie op dezelfde onafhankelijke testperioden.
7. Alleen na aantoonbare verbetering en kwaliteitscontrole promoveren.
8. Terugrollen naar een eerdere modelversie mogelijk maken.
9. Geen prognosemomentopnames of uitkomsten overschrijven.
10. Een audittrail bewaren: welke gegevens en modelversie leidden tot welke prognose.

### 7.2 Persoonlijk leren

In lokale modus bouwt de gebruiker een eigen gegevensbestand op. Persoonlijke prognoses kunnen geleidelijk worden afgestemd op eigen sessies, maar alleen bij voldoende vergelijkbare en betrouwbare gegevens. Bij weinig gegevens blijft de app terugvallen op de centrale algemene kennis en toont zij dat persoonlijke informatie beperkt is.

### 7.3 Collectief leren

In de latere cloud/Plus-fase kunnen gegevens van deelnemers kandidaat-trainingsdata worden. Ze worden niet automatisch opgenomen. Eerst volgen validatie, kwaliteitsclassificatie, duplicaatcontrole, plausibiliteitscontrole, representativiteitscontrole en detectie van mogelijke manipulatie.

### 7.4 Geen automatische zelfaanpassing zonder controle

Een lagere Brier-score in één kleine of toevallige steekproef is geen reden om modelgewichten direct te wijzigen. Experimentele modellen moeten naast de stabiele productieversie worden getest. Iedere wijziging moet reproduceerbaar zijn en aantoonbaar beter presteren op ongeziene, latere data.

---

## 8. Datakwaliteit, betrouwbaarheid en anti-vervuiling

De huidige code bevat al een eerste Data Quality Engine met herkomstcategorieën (gemeten, voorspeld, gemodelleerd, gebruikersrapportage, onbekend). Deze beoordeelt vooral de opgegeven status en aanwezigheid van een waarde. Dat is nuttig, maar bewijst niet dat een meting of gebruikersinvoer feitelijk correct is.

### 8.1 Kwaliteit op twee niveaus

Beoordeel afzonderlijk:
- **Veldkwaliteit:** kwaliteit van één waarde (bijvoorbeeld watertemperatuur, locatie, starttijd of soort).
- **Sessie-/recordkwaliteit:** volledigheid en interne consistentie van de volledige sessie en de koppeling met de prognose.

Een hoge kwaliteit van één veld maakt niet automatisch de hele sessie betrouwbaar.

### 8.2 Voorgestelde kwaliteitsniveaus

Gebruik voorlopig labels, geen schijnprecies betrouwbaarheidspercentage:
- **A — Gevalideerd:** sterke herkomst, voldoende volledigheid en controles doorstaan; geschikt voor relevante analyses.
- **B — Goed bruikbaar:** plausibel en voldoende compleet, met beperkte onzekerheden.
- **C — Beperkt bruikbaar:** gedeeltelijk, achteraf ingevoerd of met belangrijke ontbrekende velden; alleen gebruiken voor analyses waarvoor dat verantwoord is.
- **D — Onbetrouwbaar/in quarantaine:** tegenstrijdig, onwaarschijnlijk, vermoedelijk dubbel of onvoldoende verifieerbaar; niet gebruiken voor modeltraining.
- **Onbekend:** status of herkomst onvoldoende duidelijk.

Deze classificatie moet per toepassing verschillen. Een sessie kan bruikbaar zijn voor vangstfrequentie, maar niet voor analyse van watertemperatuur als die temperatuur ontbreekt.

### 8.3 Controles

Mogelijke controles:
- Verplichte logische tijdsvolgorde en realistische sessieduur.
- Locatie- en tijdzonevalidatie.
- Soort, aantal, gewicht en lengte op plausibiliteit.
- Geen negatieve waarden; nul is alleen geldig waar nul inhoudelijk betekenis heeft.
- Consistentie tussen vangstregels en sessie-uitkomst.
- Consistentie tussen doelsoort en geregistreerde vangst.
- Geen dubbele sessies, vangsten, snapshots of imports.
- Weerdata koppelen aan juiste coördinaten en lokale tijd.
- Meetbron, meettijd en meetdiepte voor watertemperatuur.
- Signaleer extreme of herhaald identieke patronen.
- Markeer imports en achteraf gewijzigde gegevens.
- Auditlog van correcties; overschrijf niet stilzwijgend de oorspronkelijke waarde.

### 8.4 Gebruikersbetrouwbaarheid

De betrouwbaarheid van een gebruiker mag niet simpelweg worden afgeleid uit het aantal vangsten of uit het feit dat iemand vaak invoert. Een gebruiker met veel vangsten is niet automatisch een nauwkeurige dataleverancier.

Bouw eventueel later een reputatie-/betrouwbaarheidsindicatie op basis van:
- Volledigheid en consistentie van registraties.
- Aandeel records dat controles doorstaat.
- Correcties en historische foutpatronen.
- Tijdige en controleerbare registratie.
- Onwaarschijnlijke duplicaten of afwijkingen.
- Onafhankelijke validatie waar mogelijk.

Laat betrouwbaarheid van gebruiker, kwaliteit van een individueel record en bewijskracht van een wetenschappelijke bron aparte begrippen blijven. Een gebruikersscore mag nooit een wetenschappelijke bronstatus vervangen.

---

## 9. Opslag, privacy en verdienmodel

### 9.1 Lokaal (gratis en privé)

- Dexie/IndexedDB als lokale opslag in de huidige PWA.
- Geen verplichte account, login of cloud.
- Data blijft op het apparaat van de gebruiker.
- Gebruiker kan een volledige, versiebeheerste back-up exporteren en importeren.
- Volledig herstel omvat alle persistente Dexie-tabellen, instellingen, prognosesnapshots, waarnemingen, weer-cache, foto's/media, IDs en relaties. Een nieuwe telefoon moet na herstel aanvoelen alsof het oorspronkelijke apparaat is voortgezet.
- Nieuwe persistente tabellen (coachadviezen, hengelrecords en lokale leerprofielen) moeten automatisch onderdeel worden van het backupcontract.
- Geen lokale gegevens delen voor collectieve learning zonder afzonderlijke expliciete toestemming.
- Duidelijke waarschuwing dat lokale browserdata verloren kan gaan bij apparaat-/browserproblemen; back-up blijft belangrijk.

### 9.2 Cloud / Plus (toekomstig)

Nog te ontwerpen:
- Veilige account- en authenticatielaag.
- Cloud database en API/backend.
- Synchronisatie tussen apparaten en conflictafhandeling.
- Versleuteling tijdens transport en waar passend opslag.
- Export, verwijdering en bewaartermijnen.
- Scheiding tussen privé cloudopslag en toestemming voor geanonimiseerde modelbijdrage.
- Abonnement, betaalstatus en toegangsrechten.
- Abuse-preventie, rate limiting, monitoring en back-ups.
- Privacy- en juridische beoordeling vóór publieke lancering.

De lokale modus moet blijven bestaan als volwaardige keuze. Cloud mag niet stilzwijgend worden ingeschakeld.

### 9.3 Gedeelde data

Verzamel voor gezamenlijke analyse alleen de gegevens die noodzakelijk zijn. Minimaliseer of anonimiseer/pseudonimiseer persoonsgegevens en exacte stekgegevens. Exacte vislocaties kunnen gevoelig zijn voor vissers en mogen niet zonder heldere toestemming publiek of collectief zichtbaar worden.

Toestemming moet specifiek, begrijpelijk, intrekbaar en los van de keuze voor cloudopslag zijn. Bij intrekking moet duidelijk zijn wat er met eerder opgenomen trainingsdata en reeds getrainde modelversies gebeurt; dit vereist een expliciet beleid.

---

## 10. Centrale architectuur en anti-duplicatiebeleid

### 10.1 Harde regel

**Voordat een nieuwe engine, bron, berekening, database-entiteit of service wordt gemaakt, moet eerst worden gecontroleerd of de bestaande code die verantwoordelijkheid al heeft.** Als er overlap bestaat, moet de bestaande module worden uitgebreid, opgeschoond of vervangen via een gecontroleerde refactor. Geen tweede implementatie naast de bestaande.

### 10.2 Huidige codekaart (gecontroleerd in repository)

| Bestaand onderdeel | Huidige verantwoordelijkheid | Richting |
|---|---|---|
| `src/services/prognosisEngine.ts` | Centrale prognoseberekening en orkestratie | Blijft de centrale ingang voor prognoses; geen tweede prognosis engine |
| `src/services/fishProfiles.ts` | Soortprofielen en thermische efficiëntie | Centrale soort-/fysiologische profielen uitbreiden en onderbouwen |
| `src/services/weatherService.ts` | Weerdata, ophalen/cache en historische weercontext | Eén centrale weerbronservice |
| `src/services/waterThermalEngine.ts` | Thermische ontwikkeling/watertemperatuurschatting | Eén centrale waterthermische analyse |
| `src/services/habitatMovementEngine.ts` | Habitat- en visbewegingsanalyse | Eén centrale habitat-/bewegingsanalyse |
| `src/services/rodPositioningEngine.ts` | Hengelpositionering en wind-/stekadvies | Tactische positionering hier centraliseren |
| `src/services/bankWindEngine.ts` | Relatie windrichting en oeveroriëntatie | Bestaande module hergebruiken |
| `src/services/prebaitEngine.ts` | Voorvoerstrategie | Bestaande module uitbreiden, niet dupliceren |
| `src/services/evaluationEngine.ts` | Snapshot-uitkomstkoppeling, Brier-score, BSS en kalibratie | Centrale evaluatie-engine; later gecontroleerd uitbreiden |
| `src/services/dataQualityEngine.ts` | Herkomst-/veldkwaliteitsbeoordeling | Uitbouwen tot veld- en recordkwaliteitslaag |
| `src/services/modelConsistencyEngine.ts` | Tegenstrijdige signalen zichtbaar maken | Hergebruiken voor onzekerheid/conflicten |
| `src/services/researchRegistry.ts` | Centrale kennis-/bronregistratie | Centrale wetenschappelijke kennislaag; bevat beoordeelde bronnen met expliciete beperkingen en goedkeuringsstatus |
| `src/services/statsEngine.ts` | Statistische verwerking | Bestaande statistiekservice hergebruiken |
| `src/services/viscoachService.ts` | Viscoach-advies | Adviezen laten steunen op centrale engines en bronregistratie |
| `src/services/backupService.ts` | Export/import en back-up | Behouden en uitbreiden voor migraties |
| `src/db/db.ts` | Dexie/IndexedDB schema en databasefuncties | Eén centrale lokale database-laag |
| `src/types/index.ts` | Centrale domeintypen | Schemawijzigingen hier consistent beheren |

De repository bevat daarnaast UI-componenten voor prognose, sessies, locaties, statistieken, weer, instellingen, vangsten en viscoach, plus testbestanden voor kernlogica, prognosemodules, back-up/import en Brier-integratie.

### 10.3 Nieuwe functionaliteit eerst in kaart brengen

Voor elke wijziging:
1. Zoek eerst in de code naar bestaande functie, type, service, bron en database-entiteit.
2. Beschrijf welke bestaande module verantwoordelijk is.
3. Hergebruik of verbeter die module.
4. Maak alleen een nieuwe module als er aantoonbaar een nieuwe, zelfstandige verantwoordelijkheid bestaat.
5. Leg de keuze vast in dit document en in codecommentaar waar architectonisch relevant.
6. Voeg tests toe die ook controleren dat bestaande functionaliteit niet dubbel of tegenstrijdig wordt uitgevoerd.

### 10.4 Scheiding van verantwoordelijkheden

- UI-componenten presenteren data en verzamelen invoer; ze bevatten geen eigen kopieën van prognose- of learninglogica.
- Engines berekenen één afgebakend domein.
- Centrale prognose-engine orkestreert.
- Research Registry beheert bewijs en goedgekeurde kennis.
- Data Quality beoordeelt herkomst/kwaliteit.
- Evaluation Engine meet prognoseprestaties.
- Learning/modelbeheer (toekomstig) beheert training, modelversies en promotie.
- Database-/repositorylaag beheert opslag en toegang.
- Externe bronnen worden via één service per brondomein ontsloten.

---

## 11. Huidige technische uitgangssituatie en aandachtspunten

### 11.1 Wat aantoonbaar aanwezig is

De huidige repository bevat:
- React 19 / TypeScript / Vite en PWA-configuratie.
- Dexie/IndexedDB met locaties, sessies, vangsten, weer-cache, instellingen, prognosemomentopnames en aanwezigheidwaarnemingen.
- Open-Meteo-service en historische weerfunctionaliteit.
- Soortprofielen en thermische efficiëntie.
- Prognose-engine met biologische activiteitsindex en persoonlijke kansschatting.
- Waterthermische, habitat-/bewegings-, wind-/oever-, hengelpositionerings- en voorvoeranalyses.
- Research Registry, Data Quality Engine en Model Consistency Engine.
- Evaluation Engine met Brier-score, Brier Skill Score en kalibratiebins.
- Automatische koppeling van een afgeronde sessie aan een vooraf vastgelegde snapshot wanneer de koppeling aanwezig is.
- Back-up/import en tests voor onder meer Brier-integratie en geavanceerde prognosemodules.

### 11.2 Wat nog niet als gerealiseerd mag worden beschouwd

Op basis van de huidige code-inspectie:
- De Research Registry bevat inmiddels een beoordeelde algemene bron over thermische modellen van meren; deze bron is bewust niet goedgekeurd als directe voorspellingsregel.
- De Data Quality Engine beoordeelt vooral aangeleverde status en aanwezigheid; hij kan de waarheid van een gebruikersmeting niet onafhankelijk verifiëren.
- De Evaluation Engine berekent evaluatiematen, maar is niet op zichzelf een learning engine die modelparameters leert en gecontroleerd uitrolt.
- Een publieke multi-user backend, accounts, cloudopslag, synchronisatie, abonnementen en gedeelde dataverwerking zijn nog niet aanwezig in de huidige lokale Dexie-architectuur.
- Een volwaardige contributor-reputatie-/datakwaliteitsclassificatie voor communitydata is nog toekomstig.
- Een Brier-score op zichzelf bewijst niet dat de gehele prognose of alle afzonderlijke factoren goed zijn.

### 11.3 Eerste technische auditpunten voor de volgende ontwikkelronde

Deze punten moeten vóór verdere uitbreiding gericht worden gecontroleerd en waar nodig getest/gecorrigeerd:
1. **Uitkomstkoppeling:** controleer dat een sessie met een vangst van een andere soort niet als doelsoortsucces wordt geëvalueerd. De huidige automatische koppeling bevat een fallback die bij een sessie-uitkomst ‘catch’ zonder passende geregistreerde vangst minimaal één doelvis kan tellen. Dit moet worden herzien: bij ontbrekende soortregistratie hoort de uitkomst onbekend/ongeldig voor die doelsoort te zijn, niet automatisch succes.
2. **Snapshot-volledigheid:** de huidige snapshot legt kernvelden vast, maar de volledige factorwaarden, bronherkomst, onzekerheidsredenen en modelconfiguratie moeten worden beoordeeld en waar nodig toegevoegd zodat een prognose achteraf exact te reconstrueren is.
3. **Snapshot-immutability:** controleer dat alleen uitkomstvelden na afronding kunnen worden gekoppeld en dat voorspelde waarden/condities nooit worden overschreven.
4. **Duur en event-definitie:** controleer dat voorspelde kans, sessieduur en doelsoort exact overeenkomen met de afgeronde sessie.
5. **Brier-baseline:** controleer de baselineberekening. Voor modelvergelijking moet de referentiekans vooraf/uitsluitend uit trainingshistorie komen, niet achteraf uit dezelfde testset.
6. **Kleine steekproeven:** de huidige technische minimumgrens voor een Brier-overzicht mag niet worden gepresenteerd als bewijs van robuuste validiteit. Voeg onzekerheid en aantallen toe.
7. **Ontbrekende weerdata:** controleer alle defaults/fallbacks in prognoseberekeningen. Een standaardwaarde zoals een vaste temperatuur, druk of wind mag niet ongemerkt als actuele waarneming meetellen wanneer brondata ontbreekt.
8. **Watertemperatuur:** controleer dat gemeten, geschatte en ontbrekende waarden overal strikt gescheiden blijven; geen fictieve watertemperatuur.
9. **Tijdzones:** lokale sessietijden moeten correct blijven in Europe/Amsterdam, inclusief zomer-/wintertijd en sessies over middernacht. Geen onbedoelde UTC-datumverschuiving.
10. **Dubbeltelling:** audit de combinatie van thermische efficiëntie, seizoen, tijdstip, wind en deel-engines op dubbele invloed.
11. **Historische data:** achteraf geïmporteerde sessies en historische weerdata mogen niet worden aangezien voor vooraf voorspelde testgevallen.
12. **Tests:** voer bestaande tests uit en voeg regressietests toe voor elk gecorrigeerd punt. Een geslaagde build alleen bewijst geen wetenschappelijke juistheid.

---

## 12. Ontwikkelproces en wijzigingsbeleid

Elke wijziging wordt vóór uitvoering getoetst aan deze blueprint.

### Verplichte wijzigingscheck

Een voorstel of AI-codewijziging moet beantwoorden:
1. Welk gebruikersprobleem lost dit op?
2. Welke bestaande module(s) zijn verantwoordelijk?
3. Is de functionaliteit al aanwezig? Zo ja, waarom is uitbreiding/refactor niet voldoende?
4. Welke gegevens en bronnen gebruikt de wijziging?
5. Zijn feiten, aannames, schattingen en gebruikerswaarnemingen duidelijk gescheiden?
6. Kan de wijziging de prognose, vangstkans, Brier-evaluatie of trainingsdata beïnvloeden?
7. Hoe wordt voorkomen dat voorspelling en uitkomst door elkaar lopen?
8. Welke tests bewijzen dat dit werkt en geen regressie veroorzaakt?
9. Welke documentatie en types moeten worden bijgewerkt?
10. Is de wijziging binnen de huidige fase, of hoort deze op de latere roadmap?

### AI-werkinstructie

- Lees dit bestand voordat je Vislogboek-code aanpast.
- Inspecteer de actuele repository; vertrouw niet uitsluitend op oude chatcontext of dit document.
- Behandel code als implementatiestatus en dit bestand als product-/architectuurafspraak.
- Verzin geen bestaande functies, databronnen, tests of resultaten.
- Maak geen tweede engine, bronregister, learningproces, database of prognoseberekening als er al een bestaande eigenaar is.
- Stel eerst een kort impact-/implementatieplan op bij grote wijzigingen.
- Voer wijzigingen klein en controleerbaar uit.
- Draai relevante tests, typecheck en production build wanneer mogelijk.
- Rapporteer welke bestanden zijn gewijzigd, welke tests zijn uitgevoerd en welke beperkingen resteren.
- Werk dit document bij wanneer afspraken of implementatiestatus veranderen.
- Vraag om verduidelijking als een nieuwe wens botst met een bestaande harde afspraak; kies niet stilzwijgend een richting.

### Definition of Done

Een wijziging is pas klaar wanneer:
- Functioneel gedrag overeenkomt met de vraag.
- Bestaande modules zijn hergebruikt of duplicatie aantoonbaar is voorkomen.
- Datakwaliteit en herkomst correct zijn verwerkt.
- Geen ontbrekende waarde als feitelijke meting wordt gepresenteerd.
- Prognose- en evaluatie-integriteit behouden blijven.
- Relevante tests slagen.
- Typecheck/build slagen, of fouten expliciet zijn gerapporteerd.
- Documentatie en deze blueprint actueel zijn.

---

## 13. Roadmap en prioriteiten

### Uitgevoerde verbetering — ontbrekende weerdata (geïmplementeerd; CI gecontroleerd)

De prognoseketen moet ontbrekende weerwaarden als **onbekend** behandelen, nooit als 0, een gemiddelde standaardwaarde of een neutrale meting. De implementatie voegt veldbeschikbaarheid en dagdekking toe, valideert plausibele waarden en onderdrukt de activiteitsindex wanneer gemeten of verantwoord geschatte watertemperatuur ontbreekt. De persoonlijke vangstkans wordt alleen getoond wanneer de thermische basis bekend is en de uurlijkse weersdekking volledig genoeg is; anders blijft deze `null`. Prognosesnapshots bewaren bij een onbeschikbare activiteitsindex `null` en koppelen geen verzonnen beste tijdvak. De UI toont de dekking en welke velden ontbreken. Luchttemperatuur mag niet als watertemperatuur worden gebruikt.

Dit is een gerichte uitbreiding van de bestaande prognose- en thermische engines; er wordt geen tweede engine toegevoegd. Bij ontbrekende wind- of thermische invoer wordt geen weersgestuurd hengelpositie-/oeveradvies gepresenteerd; bij ontbrekende ondersteunende context worden habitat- en tactische adviezen als laag betrouwbaar gemarkeerd. De regressietests dekken lege weerdata, gedeeltelijke velden en het niet hergebruiken van een oude watertemperatuurmeting voor een latere dag af. De Quality Gate is succesvol doorlopen op de implementatiebranch; visuele controle in Google AI Studio blijft een handmatige stap.

### Uitbreiding — lokale watertemperatuurmetingen als thermisch anker (geïmplementeerd op main; CI geslaagd)

De bestaande thermische analyse is uitgebreid zodat een echte watertemperatuurmeting van een eerdere sessie op **dezelfde stek** als startwaarde kan dienen voor een latere modelschatting. Een eerdere meting wordt niet als actuele meting gepresenteerd: de uitvoer houdt het onderscheid tussen `measuredWaterTemp` en `estimatedWaterTemp` intact.

De bestaande `waterThermalEngine.ts` gebruikt de meest recente bruikbare lokale meting en past daarop een eerste-orde thermische respons toe op basis van de beschikbare uurlijkse weersontwikkeling sinds die meting. Waterdiepte en watertype bepalen de thermische traagheid; wind beïnvloedt de menging en bewolking de indicatie van zoninstraling. De onzekerheidsmarge groeit met de tijd sinds de meting en onvolledige weersdekking. Bij een recente meting maar ontbrekende weerdata kan maximaal een korte-termijnschatting met ruime marge worden gebruikt; er wordt geen ontbrekende weersgeschiedenis verzonnen. Metingen van een andere stek en als benchmark gemarkeerde sessies worden niet als anker gebruikt.

**Wetenschappelijke beperking:** de warmte-uitwisselingsparameters zijn vooralsnog conservatieve startaannames, geen lokaal gekalibreerde natuurkundige parameters. De implementatie is bedoeld als eerste persoonlijke modelversie. Vergelijkingen tussen latere echte metingen en eerdere modelschattingen moeten worden verzameld voordat parameters per stek/seizoen worden bijgesteld of de nauwkeurigheid wordt geclaimd. De eerste meetreeksen zijn dus leerdata voor evaluatie, niet automatisch bewijs dat het model al nauwkeurig is.

### Verdere fase-3 verbeteringen — provenance, meteorologische invoer en chronologische kalibratie

- PR #19 bewaart meetanker-tijdstip, leeftijd en weersdekking ook wanneer een verouderd anker of ontbrekende weerhistorie geen verantwoord temperatuurgetal oplevert.
- PR #21 registreert de review van Piccolroaz et al. (2024) over warmtebalansmodellen voor meren. De bron beschrijft thermische traagheid en air-water-koppeling, maar is bewust niet goedgekeurd als directe vangst- of voorspellingsregel; locatie- en modelkalibratie blijven noodzakelijk.
- PR #22 bewaart optioneel kortgolvige zonnestraling, relatieve luchtvochtigheid en dauwpunt uit Open-Meteo in weersvoorspellingen en sessiesnapshots. Deze extra inputs wijzigen nog geen thermische modelcoëfficiënten.
- PR #23 voorkomt future leakage: lokale temperatuurkalibratie gebruikt uitsluitend geldige meetparen van doeldagen vóór de datum waarvoor de prognose wordt berekend.
- PR #24 vereist minimaal 72 uur voorafgaande geldige weershistorie voor een weather-only watertemperatuurschatting zonder lokaal meetanker. Eén losse dag luchttemperatuur wordt niet als waterprior gebruikt.

**Fase-3 afrondingsaudit — PR #27 (implementatiebranch; nog niet samengevoegd naar main):**
- Een deterministische testset met zes fictieve sessies en lokale watertemperatuurmetingen controleert opwarming, afkoeling, historische profielschatting, meetankerprioriteit, future leakage en de lokale datum rond middernacht. De onafhankelijke synthetische referentie gebruikt een thermische responstijd van 65 uur, afwijkend van de effectieve modeltijdconstante.
- Resultaten op de synthetische scenario's: opwarming 20,2 °C versus referentie 19,42 °C (absolute fout 0,78 °C); afkoeling 13,4 °C versus 13,98 °C (0,58 °C); historisch profiel 14,2 °C versus 14,15 °C (0,05 °C). De nieuwe suite heeft 12 controles; alle slagen in Quality Gate run #145. Dit zijn uitsluitend gecontroleerde testfixtures, geen bewijs van nauwkeurigheid in echte wateren.
- Een weather-only puntinschatting zonder lokaal meetanker of historisch waterprofiel toont geen smalle numerieke onzekerheidsrange meer. De schatting blijft indicatief en krijgt expliciet hoge, niet-gekwantificeerde onzekerheid.
- De Brier Skill Score gebruikt nu een chronologische rolling baseline van minimaal vijf eerdere gekoppelde uitkomsten van dezelfde doelsoort. De doeldag moet eerder zijn en de gekoppelde sessie moet vóór het prognosetijdstip zijn beëindigd; lopende nachtsessies tellen niet als bekende uitkomst. Zonder voldoende eerdere historie wordt geen BSS getoond.
- De vergelijking van de actuele datum gebruikt expliciet Europe/Amsterdam, zodat een meting rond 00:30 zomertijd bij de juiste lokale doeldag blijft.

**Fase 3 — audit afgerond op de implementatiebranch (praktijkvalidatie bewust uitgesteld):** de bestaande biologische en gedragsmatige soortmodellen blijven behouden als relatieve, voorlopige modellen; thermische optimumcurves en gewichten zijn geen universele biologische grenzen of gemeten vangstkansen. De KWO-praktijkbron over watertemperatuur en boilies (https://www.kwo.nl/watertemperatuur-en-het-inzetten-van-boilies-dit-is-wat-je-moet-weten/) ondersteunt de algemene richting dat voedselopname en vertering bij kou afnemen en bij opwarming geleidelijk toenemen, maar benadrukt ook verschillen tussen wateren. De genoemde circa 10 °C en 12+ °C zijn daarom contextuele vuistregels, geen harde modelschakelaars. De onafhankelijke synthetische audit en CI vormen de afrondingsbasis voor deze fase; echte MAE, RMSE, bias en onzekerheidsdekking zijn nog onbekend en worden pas na toekomstige meetparen onderzocht. Dat is een expliciete beperking, geen open implementatiepunt of reden om nu sessies te registreren. Zonnestraling wordt waar beschikbaar gebruikt; dauwpunt, luchtvochtigheid en wind blijven een kwalitatieve verdampingsindicatie totdat lokale validatie een kwantitatieve invloed rechtvaardigt. Automatische RWS-import blijft buiten scope.

**Afgebakende bevinding voor fase 5:** de tactische habitat- en voorvoermodules bevatten nog interne terugvalwaarden (onder andere 14 °C wanneer thermische data ontbreekt). Deze zijn niet in PR #27 gewijzigd omdat de kwaliteitspoorten voor tactische adviezen bij fase 5 horen; ze mogen niet als gemeten of gevalideerde invoer worden beschouwd en moeten daar expliciet worden aangepakt.

### Prioriteit 1 — Betrouwbaarheid van de huidige nulmeting
- Audit prognose- en snapshotlogica.
- Corrigeer doelsoort-/uitkomstkoppeling.
- Borg volledige, onveranderlijke prognosemomentopnames.
- Controleer ontbrekende data en defaults.
- Versterk Brier-evaluatie, baseline en kalibratie-uitleg.
- Test import, historische sessies en tijdzonegedrag.
- Zorg dat elke afgeronde sessie correct als vangst, bevestigde nulvangst of onbekend wordt geclassificeerd.

### Prioriteit 2 — Wetenschappelijke kennislaag
- Research Registry vullen met controleerbare bronnen.
- Soortprofielen en fysiologische aannames per soort reviewen.
- Elke prognosefactor labelen naar bewijssterkte en toepassingsstatus.
- Factoren zonder voldoende bewijs informatief tonen, niet automatisch als kansgewicht toepassen.

### Prioriteit 3 — Persoonlijke dataverzameling en inzicht
- Invoerkwaliteit en volledigheid verbeteren zonder het logboek omslachtig te maken.
- Persoonlijke analyses per soort, locatie, seizoen, tijdstip en techniek.
- Prognoseversies en voorwaartse evaluatie inzichtelijk maken.
- Pas na voldoende gegevens gecontroleerde persoonlijke kalibratie/learning toevoegen.

### Prioriteit 4 — Publieke gratis versie
- Multi-user-ready architectuur ontwerpen zonder lokale modus te verliezen.
- Onboarding voor beginners en uitgebreide details voor gevorderden.
- Privacy, toegankelijkheid, foutafhandeling en schaalbaarheid.
- Gratis kernfunctionaliteit en lokale opslag behouden.

### Prioriteit 5 — Cloud / Plus / collectieve learning
- Backend, accounts en synchronisatie.
- Afzonderlijke toestemming voor datadeling.
- Community-data-validatie en quarantainemechanisme.
- Contributor-/recordkwaliteitsclassificatie.
- Centrale learning pipeline, onafhankelijke validatie en modelpromotie.
- Abonnement en operationele kosten uitwerken.

---

## 14. Open ontwerpbeslissingen (nog niet definitief)

Deze punten moeten later met gegevens en technische afwegingen worden besloten; niet als reeds gemaakte afspraken behandelen:
- Exacte duur en stopcriteria van de persoonlijke nulmeting (12, 18 of 24 maanden; afhankelijk van datavolume en spreiding).
- Definitieve gebeurtenisdefinities per prognosetype: minimaal één doelvis, aantallen, vangsttempo of andere uitkomst.
- Hoe sessies met meerdere doelsoorten afzonderlijk worden geëvalueerd.
- Minimale aantallen en onzekerheidsdrempels per soort-/locatie-/seizoenssegment.
- Welke externe wetenschappelijke en omgevingsbronnen worden toegevoegd en onder welke licentie.
- Definitieve kwaliteitsniveaus, controles en eventuele contributor-score.
- Welke gegevens cloud/Plus bewaart en welke gegevens met toestemming voor gezamenlijke learning worden gebruikt.
- Backend, hosting, authenticatie, betaalprovider en kostenmodel.
- Hoe modelversies worden gekalibreerd, getest, vrijgegeven en teruggerold.
- Welke onderdelen van de gratis versie en Plus-versie uiteindelijk worden afgebakend.

---

## 15. Begrippen

- **Prognose:** vooraf vastgelegde verwachting voor een gedefinieerde gebeurtenis en context.
- **Snapshot:** onveranderlijke registratie van wat het model op een bepaald moment voorspelde en op welke informatie dat was gebaseerd.
- **Biologische activiteitsindex:** relatieve indicatie van biologische activiteit; geen vangstkans.
- **Persoonlijke vangstkans:** kans op de vooraf gedefinieerde doelsoortgebeurtenis tijdens een gekozen sessie.
- **Brier-score:** gemiddelde kwadratische fout van probabilistische voorspellingen voor een binaire uitkomst.
- **Kalibratie:** mate waarin voorspelde kansen overeenkomen met de frequentie waarmee gebeurtenissen werkelijk plaatsvinden.
- **Brier Skill Score:** vergelijking van de Brier-score met een vooraf vastgelegde referentie-/baselinemethode.
- **Dataprovenance:** herkomst van een gegeven (gemeten, voorspeld, gemodelleerd, gebruikerswaarneming of onbekend).
- **Datakwaliteit:** mate waarin een record compleet, plausibel, consistent en geschikt is voor een specifieke analyse.
- **Learning engine:** centrale, gecontroleerde pipeline die gevalideerde data gebruikt om modelversies te trainen/evalueren; niet hetzelfde als een Brier-berekening.
- **Nulmeting:** eerste gecontroleerde periode waarin prognoses vooraf worden opgeslagen en met echte afgeronde sessies worden vergeleken.

---

## 16. Leidende projectafspraak

**Vislogboek moet steeds beter worden door betrouwbare gegevens, controleerbare kennis en eerlijke evaluatie — niet door steeds meer losse scores of engines toe te voegen.**

Bij twijfel geldt:
1. Feiten boven aannames.
2. Transparantie boven schijnzekerheid.
3. Datakwaliteit boven datavolume.
4. Voorwaartse validatie boven achteraf passend maken.
5. Eén centrale bron en één engine per verantwoordelijkheid.
6. Bestaande functionaliteit verbeteren vóór iets nieuws bouwen.
7. Lokale privacy en gebruikerskeuze behouden.
8. Eerst betrouwbaarheid van de nulmeting, daarna pas collectieve learning en schaalvergroting.


---

## 17. GitHub Actions Quality Gate

**Status:** eerste CI Quality Gate toegevoegd in `.github/workflows/ci.yml`.

### Doel en werking
- Workflow start automatisch bij iedere push naar `main` en bij iedere Pull Request gericht op `main`.
- De workflow voert een reproduceerbare dependency-installatie uit met Bun en de bestaande `bun.lock`.
- Daarna worden TypeScript typecheck (`bun run lint`), de geselecteerde lokale regressie-/integratietests en de Vite production build uitgevoerd.
- Een mislukte stap maakt de workflow-run rood; latere stappen worden standaard niet uitgevoerd.
- De workflow publiceert of deployt de app niet en wijzigt geen productieomgeving.

### Geselecteerde tests
De workflow voert de bestaande scripts uit voor thermische/prognoselogica, Brier-integratie, forward validation, geavanceerde prognosemodules, hengelpositionering, thermische koppeling, veilige verwijdering, Viscoach/backup-normalisatie en backup-import.

`test-core-logic.ts` is bewust nog niet opgenomen: deze suite roept momenteel de live Open-Meteo API aan. Neem deze pas op in de verplichte CI-suite nadat externe netwerkcalls zijn gemockt of geïsoleerd, zodat CI reproduceerbaar blijft. De uitsluiting betekent niet dat deze tests inhoudelijk onbelangrijk zijn; ze moeten afzonderlijk worden uitgevoerd totdat ze deterministisch zijn gemaakt.

### Belangrijke beperking
De eerste workflow controleert pushes naar `main` nadat ze zijn aangekomen. Dit voorkomt op zichzelf geen directe push of publicatie vanuit Google AI Studio. Voor verplichte blokkering van merges moet later branch protection/ruleset worden ingesteld en moeten Pull Requests de Quality Gate doorstaan. Als Google AI Studio rechtstreeks naar `main` pusht, start CI na die push; de gebruiker moet de uitslag controleren voordat in AI Studio op Publish wordt gedrukt.

### CI is geen wetenschappelijke validatie
Een groene workflow bewijst dat de geselecteerde technische checks en tests slagen. Het bewijst niet dat biologische aannames, vangstpercentages of wetenschappelijke bronnen inhoudelijk juist zijn. Die vereisen afzonderlijke bronreview en voorwaartse evaluatie met voldoende gegevens.

### Definition of Done
Bij iedere relevante wijziging moeten de workflowresultaten worden gecontroleerd. Rapporteer altijd welke tests daadwerkelijk zijn uitgevoerd, welke tests bewust zijn uitgesloten en eventuele resterende beperkingen. Voeg geen tweede prognose-, evaluatie- of learning-engine toe als onderdeel van CI.

---

## 18. VisCoach — geïntegreerde gebruikersinterface en sessiecoach

**Status: architectuur goedgekeurd; implementatie in uitvoering.** VisCoach wordt de gebruiksvriendelijke gebruikersinterface boven op bestaande Vislogboek-functionaliteit. Het is geen tweede applicatie, prognose-engine, sessiebeheer of vangstregistratie. De interface hergebruikt bestaande componenten, gegevens, services en engines. Alleen ontbrekende functionaliteit wordt toegevoegd aan de bestaande technische laag waar die verantwoordelijkheid thuishoort.

### 18.1 Bindende architectuur

- **VisCoach-interface:** presenteert voorbereiding, praktisch advies, relevante veranderingen en sessiebegeleiding. De interface bevat geen eigen prognoseberekeningen of verborgen biologische/tactische regels.
- **Bestaande UI en functies:** bestaande locatiekeuze, soortselectie, prognoseweergave, sessiepagina, vangstregistratie, hengelgegevens en waarnemingen worden hergebruikt waar passend. Nieuwe UI-componenten worden alleen gemaakt wanneer een benodigde presentatievorm ontbreekt.
- **Bestaande engines:** `prognosisEngine`, `waterThermalEngine`, `bankWindEngine`, `habitatMovementEngine`, `rodPositioningEngine`, `prebaitEngine`, `fishProfiles`, `dataQualityEngine`, `modelConsistencyEngine` en `evaluationEngine` blijven eigenaar van hun bestaande berekeningen en domeinregels.
- **VisCoach-coördinator:** één aanvullende service/coördinator verbindt bestaande gegevensstromen en engine-uitvoer. Deze detecteert relevante sessiewijzigingen, vraagt bestaande berekeningen op, vergelijkt resultaten en beslist of een betekenisvolle wijziging een nieuw snapshot en/of coachadvies rechtvaardigt. Dit is geen tweede prognose- of tactische engine.
- **Bestaande gegevensstromen:** weerupdates, vangsten, sessiewijzigingen, hengelgegevens, waarnemingen en gemeten watertemperaturen blijven via hun bestaande services en opslag binnenkomen. Er wordt geen tweede weerophaalservice of parallelle gegevensketen gebouwd.
- **Opslag:** prognosesnapshots blijven de technische, onveranderlijke vastlegging van prognose-uitvoer. Coachadviesrecords bewaren de aan de gebruiker getoonde vertaalslag en verwijzen naar de prognosesnapshot; ze dupliceren niet de volledige prognose.
- **Actieve sessie:** de bestaande live-sessie-interface blijft de centrale plek voor sessie-invoer. VisCoach wordt daarin geïntegreerd; er komt geen tweede sessie- of vangstinterface.
- **Gebruikerscontrole:** de coach doet voorstellen. De gebruiker beslist of een tactiek wordt uitgevoerd. Sessies worden nooit automatisch beëindigd en tactieken worden nooit automatisch uitgevoerd.
- **Offline-first:** kernberekeningen en opslag blijven lokaal. Een volledig gesloten PWA kan geen continue achtergrondverwerking garanderen; bij terugkeer of heropenen wordt de actieve sessie met de meest recente beschikbare gegevens herbeoordeeld.

### 18.2 Rol en taal van de interface

- De VisCoach is de praktische start- en adviesinterface voor een nieuwe vissessie.
- De pagina geeft kort, direct en begrijpelijk Nederlands advies; geen lange chat of algemeen artikel.
- De gebruiker hoeft de interne engines of technische gegevensstructuur niet te kennen.
- Technische details, onderbouwing en onzekerheid blijven beschikbaar, maar zijn niet dominant in de standaardweergave.
- De VisCoach maakt duidelijk wanneer informatie ontbreekt en doet geen stellige claims die de beschikbare data niet ondersteunen.

### 18.3 Instap en keuzes

Wanneer geen actieve sessie hervat hoeft te worden, biedt VisCoach twee routes: **Nu vissen** en optioneel **Sessie plannen**.

De drie primaire keuzes zijn:
1. **Vissoort:** hergebruik de bestaande soortendatabase en profielen; geen tweede soortenlijst.
2. **Stek:** hergebruik de bestaande locatie-/stekdatabase en functionaliteit.
3. **Gewenste starttijd:** verplicht voor een sessieplan. De eindtijd is optioneel. Als eindtijd of duur onbekend is, blijft die onbekend; VisCoach verzint geen standaardduur en dwingt geen extra intake af.

Aanvullende informatie zoals hengelaantal, methode, aas, voer, diepte en presentatie blijft optioneel en wordt waar passend in de bestaande actieve sessie geregistreerd.

### 18.4 Visplan en bestaand advies

Na de primaire keuzes combineert VisCoach bestaande prognose-uitvoer en relevante bestaande deelanalyses tot een beknopt, praktisch plan:
- **Wanneer:** gekozen tijdvak en alleen relevante alternatieven. Vergelijk tijdvakken bij gelijke sessieduur; zonder bekende eindtijd wordt geen fictieve duur gebruikt.
- **Waar:** kansrijke zone/oever/positie alleen als lokale gegevens dit ondersteunen.
- **Wind en positionering:** bestaande wind-/oever- en positioneringsanalyse, zonder een werp- of kijkrichting te verzinnen bij ontbrekende geometrie.
- **Hoe en wat:** bestaande tactische, methode-, aas- en voorvoeruitvoer waar voldoende context beschikbaar is.
- **Waarom en hoe zeker:** korte uitleg van relevante factoren, gegevenskwaliteit, onzekerheid en ontbrekende informatie.

De interface vat bestaande engine-uitvoer samen en verandert de betekenis of score niet. Biologische activiteit, aanwezigheidssignalen en persoonlijke vangstkans blijven afzonderlijke begrippen.

### 18.5 Plannen en daadwerkelijke sessiestart

- **Sessie plannen** bewaart een afzonderlijke geplande afspraak en de planprognose die daarbij is getoond. Dit maakt geen actieve vissessie, sessie-uren of nulvangst aan.
- Een geplande sessie start nooit automatisch. De gebruiker bevestigt op het moment zelf met **Start vissen**.
- **Nu vissen** start eveneens pas na een expliciete gebruikersactie.
- Bij daadwerkelijke start wordt via de bestaande prognose-engine de actuele sessieprognose berekend en als volledige, onveranderlijke startsnapshot vastgelegd. Deze snapshot bevat de relevante exacte invoer, beschikbare weersverwachting, uitvoer, onzekerheid, provenance en gebruikte engine-/modelversies voor zover beschikbaar.
- Het coachadvies dat de gebruiker bij de start te zien krijgt, wordt als afzonderlijk record bewaard en verwijst naar de startsnapshot.
- De bestaande actieve sessie wordt geopend. De gekozen soort en stek worden doorgegeven. Eindtijd en werkelijke duur blijven onbekend totdat die werkelijk zijn vastgelegd.
- De bestaande sessiestart vanuit het tabblad Sessies blijft beschikbaar. Meerdere actieve sessies blijven ondersteund.
- Een vergeten actieve sessie wordt niet automatisch beëindigd of als nulvangst beoordeeld.

### 18.6 Dynamische begeleiding tijdens een actieve sessie

De dynamische sessielogica wordt vanaf het begin onderdeel van de architectuur en wordt in de backend/service-laag gebouwd, niet in de VisCoach-presentatiecomponent.

De bestaande gegevensstromen blijven de bron:
- De bestaande `weatherService` ververst weersinformatie, gebruikt de lokale cache en publiceert de bestaande update-event(s).
- De bestaande prognosepagina reageert al op weerupdates en gebruikt de bestaande prognose-engine en deelanalyses.
- Vangsten, aanbeten, waarnemingen, sessiewijzigingen, hengelgegevens en temperatuurmetingen komen via de bestaande invoer- en opslagfuncties binnen.
- Bij relevante updates, terugkeer naar de app en heropenen kan de sessiecoördinator actieve sessies opnieuw beoordelen.

De coördinator:
1. Ontvangt of detecteert een relevante wijziging in bestaande data.
2. Bepaalt welke actieve sessiecontext daardoor geraakt kan zijn.
3. Laat de bestaande prognose-engine en relevante deelanalyses opnieuw rekenen met dezelfde gezaghebbende logica als de Prognosepagina.
4. Vergelijkt de uitkomst met de vorige sessieprognose en het laatst getoonde advies.
5. Bepaalt of de gecombineerde verandering praktisch betekenisvol is.
6. Slaat alleen dan een update-snapshot en/of nieuw coachadvies op.

Een technische weer-refresh is niet automatisch een nieuwe prognose of een nieuw advies. Kleine afzonderlijke fluctuaties leiden niet tot onnodige wijzigingen. Een combinatie van factoren kan relevant zijn wanneer bestaande analyse-uitvoer daardoor wezenlijk verandert. Een kandidaatwijziging door alleen een weersupdate wordt bij een volgende afwijkende weerinvoer bevestigd; directe gebruikerswaarnemingen, sessiewijzigingen, handmatige controles en app-hervatten worden direct beoordeeld. Gebruik idempotentie en onderbouw eventuele numerieke biologische/tactische drempels met bestaande modeluitvoer en tests.

Een nieuwe prognosesnapshot kan worden opgeslagen als de prognose betekenisvol is veranderd, ook wanneer de praktische tactiek gelijk blijft. Een nieuw coachadvies wordt alleen opgeslagen wanneer de aanbeveling of relevante uitleg wezenlijk verandert. Elke registratie blijft onveranderlijk.

Elk coachadvies verwijst minimaal naar de sessie, relevante prognosesnapshot en indien van toepassing het vorige advies. Het bewaart tijdstip, trigger, gewijzigde context, aanbeveling, reden, onzekerheid en gebruikte versies. De volledige prognose wordt niet nogmaals in het adviesrecord gekopieerd.

Handmatige heranalyse blijft beschikbaar als aanvullende gebruikersactie. Herinneringen zijn optioneel. Automatische verwerking is de standaard waar de app actief is; wanneer de PWA volledig gesloten is, wordt geen continue achtergrondverwerking beloofd. Bij opnieuw openen wordt de meest recente beschikbare data gebruikt.

### 18.7 Coachadvies, uitvoering en evaluatie

- Oorspronkelijke planprognose, startsnapshot, latere update-snapshots en coachadviezen blijven afzonderlijk en onveranderlijk bewaard.
- Een advies kan worden geaccepteerd, genegeerd of aangepast; de feitelijk uitgevoerde tactiek wordt afzonderlijk vastgelegd wanneer die informatie beschikbaar is.
- Evaluatie vergelijkt prognose, getoond advies, werkelijke uitvoering en uitkomst afzonderlijk.
- Er wordt geen causaliteit geclaimd op basis van eenvoudige voor/na-vangstpercentages.
- Brier-score wordt alleen gebruikt voor een vooraf gedefinieerde probabilistische uitkomst; een biologische activiteitsindex is geen vangstkans.
- Vangst, aanbeet, aanwezigheid, geen waarneming en onbekende uitkomst blijven afzonderlijke gegevenscategorieën.

### 18.8 Hergebruik, opslag en implementatieregels

- Controleer en hergebruik bestaande componenten, services, engines, types en Dexie-tabellen voordat iets nieuws wordt gemaakt.
- Nieuwe persistente gegevens worden alleen toegevoegd wanneer de bestaande modellen onvoldoende informatie kunnen bewaren.
- Bij expliciete sessieverwijdering worden de bijbehorende coachadviezen verwijderd en blijft een gekoppelde geplande afspraak als historie bestaan; alleen de verwijzing naar de verwijderde sessie wordt losgemaakt.
- Een prognosesnapshot die nog door een plan of coachadvies wordt gebruikt, kan niet afzonderlijk worden verwijderd. Zo blijven verwijzingen en advieshistorie intact.
- Databasewijzigingen zijn additief en krijgen migratietests.
- Alle nieuwe persistente records en relaties worden opgenomen in backup/export/import/restore; oudere back-ups blijven compatibel.
- Bestaande sessies, vangsten, prognoses, navigatie en sessiestart buiten VisCoach blijven werken.
- De VisCoach-interface bevat geen eigen prognose- of tactiekberekeningen.
- Nieuwe componenten worden alleen gebouwd voor ontbrekende presentatie of interactie; de bestaande UI wordt niet zonder noodzaak vervangen.

### 18.9 Acceptatiecriteria

- De gebruiker krijgt met vissoort, stek en gewenste starttijd een begrijpelijk plan; eindtijd blijft optioneel.
- De startprognose is een volledige, onveranderlijke uitvoer van de bestaande prognose-engine.
- Het getoonde startadvies verwijst naar die prognosesnapshot.
- Actieve sessies reageren op relevante updates via bestaande gegevensstromen en bestaande engines.
- Kleine fluctuaties of identieke updates veroorzaken geen ruis, dubbele snapshots of dubbele adviezen.
- Betekenisvolle veranderingen leveren controleerbare nieuwe registraties op zonder eerdere gegevens te wijzigen.
- De bestaande sessie-interface, vangstregistratie en meerdere actieve sessies blijven werken.
- Offline en heropenen leiden tot voorspelbaar herstel met de meest recente beschikbare data.
- Backup/restore behoudt alle nieuwe records en relaties.
- De VisCoach blijft een eenvoudige gebruikersinterface; interne technische complexiteit blijft buiten beeld.

## 19. Soortneutrale watertemperatuurvalidatie en lokale seizoenskalibratie

**Status: geïmplementeerd op main; CI geslaagd op merge commit `d611f709ce7f252224e0b3f166add9d9ae437166`.** Visuele/manual test in Google AI Studio en de gepubliceerde PWA is nog niet uitgevoerd. Deze functionaliteit is een gedeelde omgevingslaag voor alle vissoorten. De thermische voorspelling zelf is niet karperspecifiek; de bestaande soortprofielen bepalen afzonderlijk wat een geschatte of gemeten watertemperatuur biologisch betekent voor Karper, Brasem, Snoek, Baars, Voorn, Zeelt, Snoekbaars, Meerval, Roofblei en Overig.

### 19.1 Scheiding van evaluaties
- De bestaande Brier-score blijft uitsluitend de probabilistische vangstprognose toetsen aan de werkelijke vangstuitkomst.
- Watertemperatuur wordt onafhankelijk getoetst met MAE, RMSE en gemiddelde bias (voorspeld minus gemeten).
- Temperatuurmetingen worden niet gebruikt als vangstuitkomst en temperatuurafwijkingen worden niet in de Brier-score verwerkt.
- De evaluatie is soortneutraal: een lokale watertemperatuurmeting is omgevingsinformatie en mag niet per vissoort dubbel meetellen.

### 19.2 Vooraf voorspellen en achteraf meten
- Een prognosesnapshot bewaart de voorspelde watertemperatuur en onzekerheidsrange alleen wanneer het om een modelschatting gaat; een reeds gemeten waarde wordt niet als voorspelling geteld.
- Bij afronding van een sessie wordt een geldige sessiemeting gekoppeld aan de snapshot, onafhankelijk van de vangstuitkomst.
- Alleen snapshots van dezelfde lokale sessiedag, stek en met een voorspellingstijdstip vóór de meting zijn geldige temperatuurparen.
- Het sessieformulier bevat een optioneel invoerveld voor de daadwerkelijk gemeten watertemperatuur (0–35 °C, stapgrootte 0,1 °C). Er is bewust geen apart meettijdstip: de sessiestart wordt gebruikt als meettijdstip voor de koppeling en evaluatie.
- Historische sessies zonder vooraf opgeslagen temperatuurprognose leveren geen achteraf geconstrueerde validatieparen op.

### 19.3 Voorzichtige automatische correctie
- De bestaande `evaluationEngine.ts` bevat de temperatuurvalidatiematen en de berekening van lokale kalibratie; er wordt geen tweede learning- of evaluation-engine toegevoegd.
- Correctie wordt alleen toegepast op een geschatte watertemperatuur, nooit op een echte meting.
- Voorlopige minimumvoorwaarde: ten minste 8 geldige metingen op exact dezelfde stek en in hetzelfde seizoen.
- De biascorrectie wordt met shrinkage afgezwakt en begrensd op maximaal 1,5 °C. Kleine datasets leiden dus niet tot grote verschuivingen.
- Kalibratie is onafhankelijk van de gekozen doelvissoort. De soortspecifieke thermische efficiëntie wordt daarna door de bestaande prognose-engine berekend.
- De prognoseweergave haalt snapshots één keer per verversing uit IndexedDB; de berekeningen zijn kleine lokale statistische bewerkingen. Er is geen extern AI-model, geen netwerkverzoek voor learning en geen zware ML-afhankelijkheid.
- Nieuwe kalibratie wordt alleen toegepast op voorspellingen die daarna worden berekend; eerder opgeslagen prognoses worden niet herschreven.

### 19.4 Beperkingen en volgende meetstappen
- Acht metingen is een voorzichtige technische startgrens, geen bewijs van wetenschappelijke representativiteit. Resultaten moeten met aantallen en onzekerheid worden geïnterpreteerd.
- De huidige thermische fysica blijft een vereenvoudigde benadering. Biascorrectie kan een systematische lokale afwijking verminderen, maar leert nog geen volledige niet-lineaire warmte-uitwisseling.
- Metingen op verschillende diepten worden nog niet afzonderlijk gemodelleerd. Leg bij een toekomstige meetveld-uitbreiding meetdiepte, meetmethode en exact meettijdstip vast.
- Validatie rapporteert alleen temperatuurfouten; modelpromotie of geavanceerde seizoens-/diepteparameters vereisen meer data en afzonderlijke voorwaartse tests.
- De sessie-opslag roept `autoSyncSessionOutcomeToSnapshot` aan wanneer een sessie wordt opgeslagen met een gekoppelde snapshot. De nieuwe temperatuurinvoer voedt deze bestaande koppeling; de sessiestart wordt als meettijdstip gebruikt.


---

## 20. Prestatieoptimalisatie — hergebruik van weer- en databasegegevens

**Status: de optimalisatie is gedeeltelijk aantoonbaar opgenomen in de huidige `main`; de oorspronkelijke branch `perf-weather-optimization` is niet als geheel samengevoegd.** Op 2 november 2026 stond deze branch 11 commits vóór en 119 commits achter `main` (diverged). Dit is een verschil in Git-geschiedenis, geen bewijs dat de wateroptimalisatie niet in de app zit.

### Uitgangspunten
- Optimalisatie mag de inhoudelijke prognose, onzekerheidsregels, dataprovenance of bestaande functies niet veranderen.
- De uurlijkse weersreeks blijft leidend. Weer- en windveranderingen binnen een tijdvak mogen niet verdwijnen door daggemiddelden of één representatieve waarde.
- Nieuwe weerdata via automatische of handmatige verversing moet een nieuwe prognoseberekening activeren.
- Lokale IndexedDB-gegevens blijven behouden; optimalisatie mag geen sessies, vangsten, stekken, snapshots of weerhistorie herschrijven of verwijderen.

### Doorgevoerde optimalisaties in deze branch
- De thermische extrapolatie gebruikte voor ieder uur opnieuw filters over de volledige weersreeks om 24-uurs- en 72-uursgemiddelden te berekenen. Dit is vervangen door vooraf berekende timestamps en prefix-sommen met schuivende venstergrenzen. De berekening gaat daarmee van herhaald scannen (kwadratisch gedrag) naar één lineaire doorloop, met dezelfde inclusieve tijdvensters.
- Geldige luchtdrukmetingen worden per forecast-array één keer voorbereid en via een WeakMap hergebruikt in de druktrendberekening. Dit voorkomt dat ieder tijdvak dezelfde validatiefilter opnieuw uitvoert; er wordt geen weerdata buiten de huidige prognoseronde bewaard.
- Geldige temperatuurvalidatieparen uit prognosesnapshots worden per snapshot-array één keer bepaald en hergebruikt voor de acht doeldagen. De snapshots blijven read-only; de cache is alleen in geheugen en wordt vrijgegeven zodra de array niet meer wordt gebruikt.
- Eigen sessies worden per invoer-array geïndexeerd op vissoort/tijdvak en op voltooide soort-/stekselectie. Vangsten worden één keer per array op sessie-ID gegroepeerd. Zo voeren de acht dagen en vier tijdvakken niet telkens dezelfde filters over alle sessies en vangsten uit.
- De windanalyse behoudt de representatieve richting voor bestaande regels, maar toont daarnaast opeenvolgende windrichtingen wanneer die binnen één tijdvak veranderen. De ruwe uurmetingen blijven ongewijzigd beschikbaar.
- Database-initialisatie en historische seeding worden één keer per app-runtime uitgevoerd. Een gewone data-refresh voert niet opnieuw alle initiële controles en seed-acties uit. De bestaande Dexie-database en records worden niet gewist of opnieuw opgebouwd.
- Bij het opslaan van één sessie, vangst of stek wordt alleen het betreffende record in de React-state bijgewerkt. Brede refreshes blijven beschikbaar voor import, herstel en verwijderflows.

### Status in de huidige `main`
- De lineaire prefix-somberekening met schuivende venstergrenzen voor 24-/72-uursgemiddelden is aanwezig in `src/services/waterThermalEngine.ts`.
- Caches voor luchtdrukmetingen en hergebruik van sessie-/vangstselecties zijn aanwezig in `src/services/prognosisEngine.ts`; de temperatuurvalidatieparen worden gecachet in `src/services/evaluationEngine.ts`.
- Eenmalige database-initialisatie per app-runtime is aanwezig in `src/db/db.ts`.
- Deze onderdelen zijn dus niet meer alleen branchwerk. De huidige `main` bevat inmiddels ook latere wijzigingen die ontbreken in de oude prestatiebranch. De resterende verschillen van die branch moeten afzonderlijk worden vergeleken; niet blind mergen.
- De code bevestigt dat optimalisaties zijn opgenomen, maar zonder een gecontroleerde benchmark op representatieve apparaten wordt geen concrete procentuele snelheidswinst geclaimd.

### Validatie
- De thermische en prognoseregressietests blijven onderdeel van de bestaande CI-suite.
- Een extra regressietest controleert dat een winddraaiing binnen één tijdvak zichtbaar blijft.
- Typecheck en production build moeten via GitHub Actions slagen voordat de branch kan worden samengevoegd.
- Een groene CI-run bewijst geen gemeten snelheidswinst op een fysiek toestel. Daarvoor is later een aparte, reproduceerbare performancebenchmark nodig.


## 21. Prognosepagina — standaard- en geavanceerde weergave

### Productdoel
De prognosepagina moet voor een gemiddelde of ervaren visser in enkele seconden begrijpelijk maken wat de prognose is, welke tijdvakken kansrijker zijn en welke praktische omstandigheden of tactische aandachtspunten relevant zijn. De pagina is geen documentatiepagina over de interne werking van het model. VisCoach is bedoeld voor de samengevoegde keuzehulp en concrete actie; de prognosepagina blijft het verdiepende overzicht van de modeluitkomst en omstandigheden.

### Weergaven
- **Standaardweergave (default):** praktische prognose, belangrijkste uitkomsten, relevante omstandigheden, korte thermische samenvatting, praktische positionering en bruikbare voer-/tijdvakadviezen. Lange technische toelichtingen, modelopbouw, gedetailleerde wind-/habitatmodulen en uitgebreide databeperkingen worden niet standaard getoond.
- **Geavanceerde weergave:** toont de bestaande technische uitleg, uitgebreide analyses, modelmatige nuances, onzekerheden en aanvullende detailvelden.
- De gebruiker kan de voorkeur wijzigen via Instellingen. Dezelfde voorkeur geldt ook voor de prognosepagina en blijft lokaal op het apparaat bewaard.

### Technische en dataprincipes
- Dit is uitsluitend een presentatiekeuze. Prognoseberekeningen, invoer, snapshots, modelversies, weerdata, historische sessies en lokale databasegegevens veranderen niet door de weergavekeuze.
- Geen bestaande uitleg of onderliggende data verwijderen; technische details blijven beschikbaar in de geavanceerde weergave.
- De standaardweergave mag onzekerheid of ontbrekende essentiële gegevens nooit verbergen wanneer die de betrouwbaarheid van de uitkomst wezenlijk beïnvloeden. Essentiële waarschuwingen en N/B-statussen blijven zichtbaar.
- Praktisch bruikbare adviezen (zoals aanbevolen tijdvak, zoekzone, positionering en voeradvies) blijven in de standaardweergave beschikbaar; technische onderbouwing en uitgebreide scenario’s horen in de geavanceerde weergave.
- De voorkeur wordt lokaal opgeslagen (`vislogboek.prognosis.advancedDetails`); geen nieuwe Dexie-tabel, schemawijziging of synchronisatie nodig.
- Bij toekomstige UI-uitbreidingen moeten nieuwe uitlegvelden standaard als praktisch (kort) of technisch (geavanceerd) worden geclassificeerd. Hergebruik bestaande engines en gegevens; maak geen parallelle prognoseberekeningen.

### Validatie
- Controleer standaardweergave als eerste-laag gebruikerservaring en geavanceerde weergave op behoud van bestaande technische informatie.
- Controleer dat wisselen tussen weergaven geen herberekening, netwerkverzoek, database-mutatie of verlies van prognose-/sessiedata veroorzaakt.
- CI/typecheck/build valideren de code; een aparte visuele handtest blijft nodig op mobiel en desktop.


### Uitbreiding — Statistieken en geavanceerde weergave
- Dezelfde centrale voorkeur voor geavanceerde prognosedetails bepaalt ook de zichtbaarheid van technische modelvalidatie op de Statistieken-pagina.
- In de standaardweergave blijven persoonlijke visresultaten, sessievergelijkingen, vangsten per vissoort en productiviteit per tijdvak zichtbaar.
- Technische modeltoetsing van watertemperatuur, empirische Brier-score, kanskalibratie en prognosemomentopnames zijn alleen zichtbaar in de geavanceerde weergave.
- Dit is uitsluitend presentatie: evaluatie, learning, Brier-berekening, watertemperatuurvalidatie en snapshots blijven altijd actief en ongewijzigd.


## 22. Prognosesnapshot pas opslaan bij definitieve sessie-opslag

### Probleem en gedrag
- De knop "Start Sessie op dit moment" legde voorheen direct een snapshot vast voordat het sessieformulier werd bevestigd. Als de gebruiker het formulier sloot, bleef een niet-gekoppelde snapshot achter.
- De prognosepagina geeft de gekozen prognose, duur, steknaam en tijdvak nu tijdelijk door aan het sessieformulier. Dit is alleen geheugenstatus; er vindt op dat moment geen IndexedDB-write plaats.
- Pas wanneer de gebruiker het formulier opslaat als nieuwe actieve sessie, schrijft één IndexedDB-transactie de prognosesnapshot en sessie weg en koppelt beide via `session.snapshotId` en `snapshot.linkedSessionId`.
- Als de transactie mislukt, worden zowel sessie als snapshot teruggedraaid. Bij annuleren wordt de transactie nooit gestart.
- De bestaande route voor een gewone nieuwe sessie (zonder vooraf gekozen prognose) en de bestaande snapshot-/evaluatie-engine blijven behouden.
- Een reeds bestaande ongekoppelde snapshot voor exact dezelfde datum, tijdvak, soort en stek mag volgens de bestaande deduplicatieregel worden hergebruikt en wordt dan aan de nieuwe sessie gekoppeld.

### Validatie en grenzen
- Nieuwe deterministische tests gebruiken fake-indexeddb en controleren dat niet-aanroepen bij annuleren geen records oplevert, dat bevestigen beide records atomair opslaat en dat een ongeldige sessie geen orphan-snapshot veroorzaakt.
- CI voert deze tests uit naast de bestaande typecheck, tests en productiebuild.
- Geen bestaande lokale gegevens worden gemigreerd, verwijderd of herschreven. Dit voorkomt nieuwe losse snapshots; bestaande orphan-snapshots blijven ongewijzigd.
- Google AI Studio publiceren en visuele controle op een fysiek toestel blijven aparte handmatige stappen.


## 23. Goedgekeurde verbeteropdracht — 32 punten

Op 2 november 2026 zijn de 32 verbeterpunten en de zes voorgestelde uitvoeringsfases expliciet goedgekeurd. Het uitvoeringsplan staat in `IMPLEMENTATION_PLAN_32_IMPROVEMENTS.md` en is leidend voor de concrete werkvolgorde en acceptatiecriteria.

Harde uitgangspunten:
- Bestaande offline-first architectuur en bestaande prognose-/deel-engines behouden en gericht verbeteren; geen dubbele engine bouwen.
- Biologische activiteit, persoonlijke vangstkans, verwacht aantal en betrouwbaarheid afzonderlijk behandelen.
- Gemeten, voorspelde, geschatte, waargenomen en onbekende waarden herkenbaar gescheiden houden.
- Geen ontbrekende sessieduur als standaard drie uur invullen; onbekende blootstelling niet gebruiken in het Poisson-inspanningsmodel.
- Doelsoortsucces uitsluitend baseren op soortspecifieke vangstregistratie of een ondubbelzinnige bevestigde nulvangst. Bijvangst is geen doelsoortsucces.
- Visaanwezigheidswaarnemingen niet omzetten in ongevalideerde vaste kansbonussen. Aanbeten blijven gescheiden van viswaarnemingen.
- Groepssessie blijft de primaire eenheid; `rodCount` is het totale aantal hengels in de groep. Per-hengeldetails zijn optioneel.
- Volledige lokale back-up en herstel van alle persistente gegevens, media, instellingen, caches, snapshots, waarnemingen en relaties is een harde eis.
- VisCoach gebruikt uitsluitend bestaande gevalideerde prognose- en tactische engines en wordt pas na verbetering van de onderliggende modellen volledig geïntegreerd.

### Implementatiestatus (5 november 2026)
- Implementatieplan toegevoegd en samengevoegd via PR #12.
- Fase 1 gegevenscorrectheid: kerncorrecties samengevoegd via PR #13; aparte opslag van sessiewaarnemingen samengevoegd via PR #15. Beide CI-runs geslaagd.
- Fase 2 volledige back-up en herstel: afgerond via PR #17; back-up v3 omvat alle zeven persistente Dexie-tabellen, instellingen en ingebedde foto's. Legacycompatibiliteit, volledige restore/merge, validatie en round-trip CI-tests toegevoegd.
- Fase 3 thermische modellen en provenance: afgerond en samengevoegd naar `main` via PR #27 (merge commit `390284a5bed6cfc4ade8448335fd4feae20cce2f`). PR #27 bevat synthetische thermische validatie (12 controles), expliciete onzekerheid zonder lokale waterreferentie, chronologische rolling Brier-baseline en Europe/Amsterdam-datumcorrectie. Quality Gate run #145 is volledig geslaagd: typecheck, regressie-, forward-validation-, waterthermische-, backup/restore-tests en productiebuild. Synthetische resultaten zijn uitsluitend softwarevalidatie en geen bewijs van praktijknauwkeurigheid. Echte lokale meetreeksen zijn geen voorwaarde voor fase-3-afronding; MAE/RMSE/bias en intervaldekking blijven onbekend totdat later natuurlijke meetdata beschikbaar zijn. Biologische soortprofielen blijven voorlopige relatieve modellen; KWO ondersteunt de kwalitatieve temperatuurrichting, niet universele harde drempels. RWS-import is bewust buiten scope.
- Fase 4 groepssessies en hengelinspanning: afgerond en samengevoegd via PR #30 op 2 november 2026 (merge commit `43541547260b8ed3a8e43c5b471f7fcaa88882d1`). De implementatie bevat optioneel deelnemersaantal, totaal hengelaantal, per-hengelrecords met positie/techniek/aas, actieve intervallen en gebeurtenissen, intervalgebaseerde hengeluren, additieve Dexie-tabel v3 en backup v4 met v1–v3-compatibiliteit. Quality Gate run #165 is volgens de PR-controle geslaagd, inclusief typecheck, regressies, veilige verwijdering, backup round-trip, hengelinspanningstests en productiebuild. Open intervallen worden bij sessieafronding gesloten; actieve sessies kunnen tussentijds worden bewerkt en hengeluren/gebeurtenissen zijn zichtbaar in sessiedetails.
- Fase 5 tactische kwaliteitspoorten (punten 22–26): **afgerond en samengevoegd naar `main`** via PR #28 (`be8c9c3c531626255b793c5c3dd25063be6dfad2`) en PR #33 (`09049d51ad3884fff286ad46f6dbb167b196fdbf`). De bestaande `dataQualityEngine` wordt hergebruikt; de Voerplanner onderdrukt hoeveelheden/timing bij ontbrekende essentiële context en beperkt persoonlijke vergelijkingen tot dezelfde stek/doelsoort. Habitat-/bewegings- en positioneringsadvies gebruiken geen verzonnen standaarddieptes, watertypes of windcondities; ontbrekende context, onzekerheid en hypothetische bewegingen worden expliciet gemaakt. Windrichting wordt alleen concreet gemaakt bij voldoende geldige data. Regressietests dekken onder meer ontbrekende invoer, directe viswaarnemingen, variabele wind, thermische prioriteit en bronregistratie. Quality Gate run #155 (PR #28) en run #210 (PR #33) zijn volgens de PR-validatie geslaagd. Dit is softwarematige kwaliteitsvalidatie, geen bewijs van universele biologische juistheid of praktijknauwkeurigheid. PR #29 is een aanvullende presentatieverbetering van de Voerplanner en is eveneens samengevoegd; geen afzonderlijke fase-5-blokkade.
- Fase 6 VisCoach-integratie (punten 27–32): **enige resterende fase** van de 32 goedgekeurde verbeterpunten; de volledige coachcyclus uit het implementatieplan is nog niet afgerond.
- Pre-publicatiebeveiliging: afzonderlijk uitgevoerd via PR #31, samengevoegd op 2 november 2026 (merge commit `f70b796ead043ed4ec9b6e70b3e3583e57aaef1b`). Dit is een aparte beveiligingsinspanning en telt niet als een van de 32 verbeterpunten.


## Fase 3 — waterthermisch model: aanvullende ontwerp- en implementatieregels

- Lokale actuele watertemperatuurmetingen zijn altijd leidend. Een schatting mag ze niet vervangen.
- Historische temperatuurprofielen mogen uitsluitend echte metingen gebruiken die vóór de doeldag zijn geregistreerd; modelvoorspellingen worden nooit als trainings-/referentiemeting gebruikt.
- De profielselectie geeft voorkeur aan dezelfde stek. Een terugval naar vergelijkbare wateren vereist gelijk watertype, nabijheid, voldoende onafhankelijke locaties en vergelijkbare bekende diepte.
- Een onbekende waterdiepte of onbekend watertype blijft onbekend; er wordt geen fictieve 2m-waterkolom aan een locatie toegekend.
- De berekening gebruikt waar aanwezig gemeten kortgolvige straling in plaats van uitsluitend bewolking als zonne-indicatie. Dauwpunt, relatieve luchtvochtigheid en wind worden gebruikt om verdampingspotentieel kwalitatief te duiden; ze veranderen de temperatuur niet en krijgen pas na lokale validatie een gekwantificeerde invloed op de onzekerheidsmarge.
- De implementatie is KNMI-geïnformeerd, niet het officiële KNMI-model. De KNMI-pagina beschrijft een gevalideerd model voor stilstaand zoet buitenwater, maar publiceert geen numerieke API of volledige implementatiespecificatie voor directe herimplementatie.
- Rijkswaterstaat WaterWebservices is geregistreerd als kandidaatbron voor echte historische oppervlaktewatermetingen. Automatische stationselectie en import blijven uitgeschakeld zolang meetpuntdekking en representativiteit voor kleine regionale wateren niet zijn vastgesteld.
- Nieuwe snapshots bewaren de herkomst, onzekerheid, historische basis, meetanker en weersdekking van de watertemperatuurschatting.

## GIS-stekherkenning en waterprofielen

Vislogboek krijgt een optionele GIS-laag die een GPS- of handmatig gekozen vispositie koppelt aan het juiste water, watersegment en beschikbare dwarsprofielen. De laag combineert ingemeten profielen met officiële Leggergegevens om onderwaterstructuur en, waar verantwoord, diepte-informatie aan de Coach te leveren. De eerste pilot richt zich op Culemborg.

**Gebruiksregels:**
- GPS is een startpunt; de gebruiker kan de daadwerkelijke vis-/voerpositie handmatig corrigeren.
- Onderscheid altijd ingemeten waarden, officiële ontwerp-/Leggergegevens, berekende interpolaties en onbekende waarden.
- Diepte is alleen een betrouwbare waterdiepte als bodemhoogte en actuele waterstand in een aantoonbaar passend verticaal referentiestelsel beschikbaar zijn. Ga niet uit van NAP of andere datums zonder metadata.
- Toon bij afgeleide waarden herkomst, datum en betrouwbaarheid; presenteer interpolatie nooit als meting.
- De GIS-laag blijft optioneel en geïsoleerd: bestaande logboek-, prognose- en Coach-functionaliteit mag hierdoor niet ongemerkt veranderen.

De volledige architectuur, databronnen, matching, profielreconstructie, onzekerheidsregels, fasering en acceptatiecriteria staan in [GIS_STEKHERKENNING_BLUEPRINT.md](GIS_STEKHERKENNING_BLUEPRINT.md). Dit projectcontextdocument bevat alleen de algemene uitgangspunten; de aparte blueprint is leidend voor de technische uitwerking. **Status: GIS-onderzoeksfase voor de huidige functionele doelstelling afgerond (5 november 2026); de beschikbare bronnen zijn voldoende voor algemene indicatieve diepte-informatie.** Dit is geen claim dat op iedere exacte voerplek een actuele diepte bekend is. Historische profielwaarden blijven tijdgebonden referenties; handmatige veldmetingen kunnen als afzonderlijke, gedateerde bron worden toegevoegd. De GIS-appimplementatie is nog niet gestart en valt buiten de 32 verbeterpunten.

 
## 16. Technische audit en herstelstatus — 6 november 2026

Deze sectie legt de uitkomst vast van de read-only audit en de daaropvolgende herstelbranch. Zij vult de eerdere ontwerpprincipes aan en beschrijft uitsluitend wijzigingen die aantoonbaar in de branch `audit/p0-data-integrity` zijn aangebracht. Een wijziging is pas onderdeel van de stabiele productbasis nadat de PR is gecontroleerd en samengevoegd.

### 16.1 Dataintegriteit bij legacy-import

De legacy-normalisatie mag ontbrekende bronwaarden niet meer omzetten in aannemelijke standaardwaarden. De import moet onbekend expliciet bewaren.

- Ontbrekende sessieduur blijft `undefined`; er wordt geen standaardduur van 180 minuten gebruikt.
- Een ontbrekende starttijd wordt niet meer als 12:00 geïnterpreteerd. Een datum-only placeholder blijft door `legacyImportQuality.startTimeKnown = false` herkenbaar als onbekend en mag niet voor tijdvak- of inspanningsanalyse worden gebruikt.
- Een ontbrekende eindtijd blijft `null`; er wordt geen eindtijd van 17:00 aangemaakt.
- Een sessie met legacy-status `completed` en zonder vangstregistraties wordt `unknown`, tenzij de bron expliciet `skunk_confirmed` bevat. Afwezigheid van vangstregels is geen bewijs van een bevestigde nulvangst.
- Doelsoorten worden uitsluitend overgenomen uit expliciete doelsoortvelden. Gevangen soorten worden niet als doelsoorten gereconstrueerd.
- Een vangstrecord zonder bekende soort, aantal of tijdstip krijgt een expliciete kwaliteitsvlag. De technische placeholders `Overig`, `0` en een datum-/importtijd zijn geen waarnemingen en moeten in analyses als onbekend worden behandeld.
- Legacyweer wordt alleen als snapshot overgenomen als alle vereiste numerieke velden én een echt tijdstip beschikbaar zijn. Ontbrekende temperatuur, druk, wind, richting, bewolking of neerslag worden niet ingevuld met vaste waarden.

De nieuwe optionele `legacyImportQuality`-metadata op sessies en vangsten is backward-compatible: bestaande records zonder deze metadata blijven volgens hun bestaande velden behandeld. `false` betekent expliciet onbekend; een ontbrekende vlag betekent dat de bestaande recordvorm geen legacy-onbekend markeerde.

### 16.2 Historische doelsoortuitkomsten

- Een sessie met algemene uitkomst `catch` is alleen een succes voor een specifieke doelsoort als een vangstrecord van die soort bestaat.
- Een sessie waarin een andere soort is gevangen, wordt niet automatisch als doelsoortsucces of bevestigde doelsoortnulvangst beschouwd; zonder passende doelsoortregistratie blijft de uitkomst voor die voorspelling onbekend.
- De tijdvakgeschiedenis vereist een expliciete doelsoortselectie en een soortspecifiek vangstrecord voor een succes. Legacy-sessies zonder bekende starttijd worden niet aan een tijdvak gekoppeld.
- Het Poisson-vangsttempo telt uitsluitend geregistreerde, bekende aantallen van de geselecteerde doelsoort. De fallback die een ontbrekend aantal of ontbrekend vangstrecord als één vis telde, is verwijderd.

### 16.3 Werkelijke versus geplande inspanning

`getSessionDurationHours()` gebruikt alleen werkelijk geregistreerde duur (`durationMinutes`) of een werkelijk start-/eindtijdpaar. `plannedDurationHours` en `plannedEndTime` mogen niet als gerealiseerde blootstelling of vangsttempo-noemer worden gebruikt. De bestaande berekening van hengeluren uit werkelijk geregistreerde hengelintervallen blijft een afzonderlijke, leidende maat voor hengelinspanning.

### 16.4 Evaluatie en veilige uitkomstkoppeling

Een vangst van een andere soort mag een soortspecifieke voorspelling niet in `skunk_confirmed` veranderen. Wanneer geen vangstrecord van de voorspelde doelsoort aanwezig is, blijft de uitkomst onbekend en wordt deze niet als nulvangst in de Brier-score opgenomen.

### 16.5 Reeds eerder geïmporteerde gegevens

Deze wijziging herschrijft geen bestaande IndexedDB-records. Gegevens die in een eerdere appversie al met standaardwaarden zijn geïmporteerd, kunnen niet betrouwbaar automatisch worden hersteld: de oorspronkelijke broninformatie is niet altijd meer te onderscheiden van echte invoer. Re-import vanuit de oorspronkelijke, ongewijzigde legacy-back-up is de veiligste route. Bewaar eerst een export van de huidige database en controleer de importpreview; overschrijf of verwijder geen bestaande data zonder afzonderlijke controle.

### 16.6 Verificatie en resterende auditpunten

De branch bevat een gerichte regressietest `test-audit-data-integrity.ts` en het npm-script `test:audit-data-integrity`. De test, TypeScript-controle en productiebuild moeten nog daadwerkelijk worden uitgevoerd; het bestaan van de test is geen geslaagde Quality Gate.

Nog niet in deze herstelstap afgerond:
- geselecteerd start-/eindtijdvenster correct koppelen aan het opgeslagen tijdvak;
- echte tijdsafhankelijke onderbouwing voor verschillen tussen tijdvakken, of expliciet geen onderscheid tonen;
- afzonderlijk meettijdstip, meetdiepte en meetmethode voor watertemperatuur;
- deduplicatie en strengere linkvalidatie in de Brier-evaluatie;
- centrale tijdzone-/DST-regels en regressietests;
- volledige backup-referentiële-integriteit en end-to-end datakwaliteitsrapportage.

Deze punten blijven op de herstelroadmap staan. Er worden geen nieuwe parallelle prognose-, weer-, evaluatie- of datakwaliteitsengines toegevoegd.

Aanvullend: de persoonlijke voorvoerhistorie in `prebaitEngine.ts` volgt dezelfde bewijsregel. Een sessie met algemene uitkomst `catch` telt voor een soortspecifieke voorvoervergelijking alleen mee als er een vangstrecord van die doelsoort bestaat. Expliciet bevestigde nulvangsten blijven bruikbaar. De VisCoach-prognosecoördinator geeft de bestaande vangstrecords door aan deze analyse; er is geen tweede vangsthistorie of aparte database toegevoegd.

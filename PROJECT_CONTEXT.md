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

Vislogboek wordt een betrouwbare, wetenschappelijk onderbouwde en praktisch bruikbare visapp voor **beginnende én ervaren vissers**. De app helpt een gebruiker om voor een gekozen vissoort, locatie, datum, tijdstip, sessieduur en vistechniek een zo goed mogelijk onderbouwde verwachting en concreet visadvies te krijgen.

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
- Aantal hengels, techniek, aas, voer en voorvoer.
- Diepte en watertemperatuur (optioneel; meetmethode, diepte en tijd vastleggen).
- Weer bij start en tijdens sessie.
- Aanbeten, gemiste vissen, lijnzwemmers en andere signalen.
- Waarnemingen van visactiviteit.
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
- Gebruiker kan back-up exporteren en importeren.
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
| `src/services/researchRegistry.ts` | Centrale kennis-/bronregistratie | Centrale wetenschappelijke kennislaag; register is momenteel leeg |
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
- De Research Registry is gedefinieerd, maar de centrale lijst met wetenschappelijke registraties is momenteel leeg.
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

### Uitgevoerde verbetering — ontbrekende weerdata (in ontwikkeling via PR)

De prognoseketen moet ontbrekende weerwaarden als **onbekend** behandelen, nooit als 0, een gemiddelde standaardwaarde of een neutrale meting. De implementatie voegt veldbeschikbaarheid en dagdekking toe, valideert plausibele waarden en onderdrukt de activiteitsindex wanneer gemeten of verantwoord geschatte watertemperatuur ontbreekt. De persoonlijke vangstkans wordt niet getoond wanneer essentiële thermische/weergegevens ontbreken of de dataset onvoldoende dekking heeft. De UI toont de dekking en welke velden ontbreken. Luchttemperatuur mag niet als watertemperatuur worden gebruikt.

Dit is een gerichte uitbreiding van de bestaande prognose- en thermische engines; er wordt geen tweede engine toegevoegd. De tactische deelmodules moeten bij ontbrekende invoer eveneens expliciet lage betrouwbaarheid en ontbrekende velden tonen. De regressietests moeten minimaal lege weerdata en gedeeltelijke velden afdekken. Deze wijziging geldt pas als afgerond nadat CI typecheck, alle bestaande tests en production build succesvol zijn.

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

## 18. VisCoach — toekomstige startpagina en sessie-instap

**Status: vastgelegde producteis / nog te bouwen.** De VisCoach wordt de eigen startpagina van Vislogboek. Bij het openen van de app wordt deze als een compacte popup-/landingspagina getoond wanneer er geen actieve vissessie is die hervat moet worden. Dit document beschrijft het gewenste gedrag; het betekent niet dat de pagina, tekstenbank of volledige flow al geïmplementeerd is.

### 18.1 Rol en uitgangspunten

- De VisCoach is de eerste advies- en startpagina voor een nieuwe vissessie.
- De pagina geeft een kort, direct en praktisch advies. Het is nadrukkelijk geen lange chat, uitgebreide dialoog of algemeen artikel.
- Adviezen zijn begrijpelijk in eenvoudige, alledaagse Nederlandse taal (Jip-en-Janneke-taal), zonder belangrijke nuance of onzekerheid weg te laten.
- De VisCoach gebruikt bestaande gegevens, prognoses, soortkennis en adviesmodules. Er mag geen parallelle prognose-engine of tweede verzameling biologische regels worden gebouwd.
- De VisCoach presenteert een advies voor de gekozen dag en context; ontbrekende gegevens en onzekerheden worden eerlijk vermeld. Geen verzonnen meetwaarden of schijnzekerheid.

### 18.2 Welkomstbericht en context

Bovenaan de VisCoach staat een korte, wisselende welkomsttekst die rekening houdt met de beschikbare context, zoals:
- Huidige locatie of geselecteerde stek.
- Actueel weer en/of de relevante weersverwachting.
- Omstandigheden zoals temperatuur, wind, neerslag, bewolking en luchtdruk, voor zover beschikbaar en relevant.
- Seizoen en maand.
- Eventueel andere bestaande, betrouwbare context uit de app.

De tekst mag dynamisch worden samengesteld uit bestaande gegevens en vooraf geschreven tekstonderdelen. Als alternatief of aanvulling mag een beheerde tekstenbank worden gebruikt. De gewenste omvang is **minimaal 500 inhoudelijk verschillende welkomstvarianten** die over relevante combinaties van omstandigheden, seizoenen, maanden en locaties kunnen rouleren. Het gaat om werkelijk verschillende en contextueel passende teksten, niet om 500 vrijwel identieke zinnen met alleen een woord of plaatsnaam vervangen. De tekstselectie moet variatie bieden en herhaling beperken. Als onvoldoende context beschikbaar is, moet een neutrale welkomsttekst worden gebruikt.

### 18.3 Drie keuzefilters

Bovenaan de VisCoach staan drie compacte dropdownfilters naast elkaar:
1. **Type vis:** de beschikbare vissoorten uit de bestaande soortendatabase/-profielen. Geen tweede, los onderhouden soortenlijst.
2. **Stek:** een bestaande, door de gebruiker opgeslagen vislocatie/visstek.
3. **Duur vissessie:** de gewenste geplande sessieduur.

De keuze in deze filters vormt samen de context voor het advies. De gekozen soort, stek en duur moeten consequent worden doorgegeven aan de bestaande prognose- en advieslogica en aan de sessie die vanuit de VisCoach wordt gestart.

### 18.4 Kort, gericht VisCoach-advies

Na het kiezen van soort, stek en sessieduur toont de VisCoach een beknopt advies voor de gekozen dag, opgebouwd uit bestaande prognose-uitvoer en relevante bestaande deelanalyses. Het advies bevat minimaal:

- **Beste vistijd:** welk tijdvak voor de gekozen vissoort en sessieduur het meest kansrijk lijkt, met een alternatief wanneer dat nuttig is. Baseer dit op de bestaande tijdvak-/prognose-informatie.
- **Wat betekenen de omstandigheden?:** vertaal de relevante prognosefactoren naar begrijpelijke taal. Benoem concreet wat bijvoorbeeld temperatuur, windrichting/-kracht, weersverloop, seizoen, luchtdruk of andere beschikbare factoren voor de gekozen soort en stek betekenen. Neem alleen factoren op die daadwerkelijk beschikbaar en relevant zijn.
- **Tactiek voor deze sessie:** een concrete, soort- en stekspecifieke aanpak. Gebruik daarvoor de bestaande tactische adviezen en analyses, zoals habitat-/visbewegingsanalyse, wind-/oeveranalyse, hengelpositionering en voorvoerstrategie waar relevant. Vertaal de uitkomsten naar begrijpelijke instructies: waar de vis mogelijk langs trekt, waar de hengel(s) het beste kunnen liggen, welke kant of zone interessant is en welke aanpak/voerstrategie passend is. Geef geen precieze plaatsingsclaim als lokale stekgegevens dat niet ondersteunen.
- **Onzekerheid:** maak kort duidelijk wanneer belangrijke informatie ontbreekt of het advies daardoor minder zeker is.

Houd de presentatie kort en scanbaar: enkele kernpunten en concrete acties, geen volledige opsomming van alle interne prognosevariabelen. De onderliggende informatie mag uitgebreid zijn; de VisCoach vat deze samen zonder de betekenis te verdraaien of relevante tegenstrijdigheden te verbergen.

### 18.5 Sessie starten vanuit de VisCoach

- De gebruiker kan vanuit het VisCoach-advies direct een vissessie starten.
- De nieuwe sessie krijgt de gekozen vissoort, stek, geplande duur en relevante prognose-/contextkoppeling mee, voor zover het bestaande sessiemodel deze gegevens ondersteunt.
- Na het starten wordt direct de bestaande live-sessie-interface geopend, zodat de gebruiker meteen vangsten en waarnemingen kan registreren. Bouw hiervoor geen tweede live-sessie- of vangstinterface.
- De bestaande mogelijkheid om vanuit het tabblad **Sessies** meerdere sessies te starten moet behouden blijven. De VisCoach vervangt deze bestaande instap niet.

### 18.6 Stek toevoegen vanuit de VisCoach

- Als de gewenste stek nog niet bestaat, moet de gebruiker vanuit de stekkeuze een nieuwe stek kunnen aanmaken via de bestaande locatie-/stekfunctionaliteit.
- Na het opslaan van de nieuwe stek keert de gebruiker terug naar de VisCoach-popup, niet naar een losstaande of doodlopende locatieschermflow.
- De zojuist aangemaakte stek wordt direct beschikbaar en geselecteerd in het stekfilter, zodat de gebruiker het advies kan bekijken en vanuit die context een sessie kan starten.
- Hergebruik de bestaande locatievalidatie, opslag en database-entiteiten.

### 18.7 Opstartgedrag, hervatten en sessiebehoud

Dit is een harde functionele eis, los van de VisCoach:

- Een actieve sessie moet actief blijven wanneer de gebruiker de app sluit, de browser/app per ongeluk afsluit, het apparaat opnieuw opstart of de app bewust verlaat.
- Sessiestatus en benodigde gegevens moeten duurzaam in de bestaande lokale database (Dexie/IndexedDB) worden opgeslagen. De sessie mag niet afhankelijk zijn van een open scherm, tijdelijke React-state of een actieve browser-tab.
- Bij het opnieuw openen van de app moet eerst worden gecontroleerd of er een of meer actieve sessies bestaan.
- Als er een actieve sessie is, mag de gebruiker niet opnieuw op de VisCoach-startpagina worden gezet alsof er nog geen sessie loopt. De app moet de actieve sessie kunnen hervatten en de live-sessie-interface openen. Bij meerdere actieve sessies moet de hervatlogica de gebruiker naar een bestaande actieve sessie brengen zonder andere actieve sessies te beëindigen of te overschrijven; zo nodig wordt een duidelijke keuze uit de actieve sessies getoond.
- De VisCoach-startpagina wordt getoond wanneer er geen actieve sessie is die hervat moet worden.
- Het sluiten of heropenen van de app mag nooit automatisch een sessie afronden, verwijderen of resetten.
- Meerdere actieve sessies blijven toegestaan, ook wanneer ze vanuit het bestaande tabblad Sessies zijn gestart.

### 18.8 Architectuur- en implementatieregels

- Controleer vóór implementatie de bestaande `Viscoach`-componenten en `viscoachService.ts`, prognose-engine, soortprofielen, habitat-/bewegingsanalyse, hengelpositionering, wind-/oeveranalyse, voorvoerengine, locatiefunctionaliteit, sessieflow en Dexie-datamodel.
- Breid bestaande services, types, repositories en componenten uit waar mogelijk. Maak geen tweede soortendatabase, locatieopslag, prognoseberekening, sessiebeheer of live-sessie-interface.
- De VisCoach-presentatielaag mag prognose-uitvoer samenvatten, maar mag zelf geen afwijkende prognoses of verborgen score-aanpassingen berekenen.
- Zorg dat filters, advies, aangemaakte sessie en opgeslagen prognose dezelfde gekozen soort, stek, datum/context en sessieduur gebruiken.
- Test in het bijzonder: startup zonder actieve sessie; startup met één actieve sessie; startup met meerdere actieve sessies; app/browser afsluiten en heropenen; sessie starten vanuit VisCoach; sessie starten vanuit Sessies; nieuwe stek toevoegen en terugkeren naar VisCoach; en behoud van bestaande vangstregistratie.
- Voeg pas UI, navigatie of de startpagina toe wanneer de VisCoach expliciet in de ontwikkelopdracht/roadmap wordt vrijgegeven. Voorbereidende services en datamodellen mogen bestaan, maar gelden niet als de gerealiseerde VisCoach-startpagina.


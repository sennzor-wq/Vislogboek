# PROJECT_CONTEXT.md — Vislogboek
> **Doel van dit document:** blijvend product-, wetenschaps- en technisch projectgeheugen voor Vislogboek. Dit document is de leidende bron voor productrichting, architectuurprincipes, datakwaliteit, prognosevalidatie en ontwikkelafspraken.
>
> **Werkwijze voor iedere AI-/ontwikkelsessie:** lees dit document én controleer de actuele code voordat je een wijziging voorstelt of uitvoert. De code is de waarheid over wat daadwerkelijk is geïmplementeerd; dit document is de waarheid over wat het product moet worden en welke afspraken gelden. Werk dit document bij wanneer een afspraak, architectuurkeuze of status verandert.

**Project:** Vislogboek  
**Repository:** `sennzor-wq/Vislogboek`  
**Huidige technische basis bij opstellen:** React 19, TypeScript, Vite, PWA, Dexie 4 / IndexedDB, Open-Meteo  
**Documentstatus:** leidende product- en technische projectcontext; product- en architectuurbasis bijgewerkt tot en met 7 november 2026, met uitgebreide optimalisatie-audit en voortgangsupdate tot en met 16 november 2026.  
**Belangrijk:** dit is een richtinggevend ontwerp en code-audit op hoofdlijnen, geen claim dat alle hieronder beschreven toekomstige functionaliteit al bestaat.


## Repository- en branchafspraken — leidend

- **`main` is de belangrijkste branch en de enige leidende branch voor de applicatie.** De actuele, werkende app-code en de officiële implementatiestatus worden altijd vanaf `main` beoordeeld.
- Alle wijzigingen aan applicatiecode, tests, configuratie, database-/migratiebestanden en build/deploy-inrichting moeten uiteindelijk gecontroleerd en gemerged zijn naar `main` voordat ze als onderdeel van de app worden beschouwd.
- Een andere branch is nooit een alternatieve bron van waarheid voor de applicatie. Een branch met documentatie of tijdelijk werk mag niet worden gebruikt als basis voor app-implementatie of als vervanging van `main`.
- Documentatiebranches mogen uitsluitend ondersteunend zijn. Als documentatie een actuele afspraak of implementatiestatus beschrijft, moet duidelijk zijn of die informatie al in `main` is verwerkt. Documentatie op een aparte branch betekent niet dat de app-code of status op `main` is gewijzigd.
- Maak **geen nieuwe branches** zonder dit vooraf met de gebruiker af te stemmen. Gebruik bestaande branches alleen met een duidelijk doel en controleer altijd de basisbranch.
- Voordat iets naar `main` wordt gemerged: bekijk de volledige diff, controleer welke bestanden geraakt worden, behoud bestaande functionaliteit en voer de relevante tests en productiebuild uit. Voer geen herstelactie, reset, rebase of overschrijving uit zonder eerst de impact vast te stellen.
- Bij twijfel geldt: **stop en rapporteer de bevinding; wijzig `main` niet op basis van aannames.**

---

## Documenthiërarchie en actuele projectstatus — peildatum 16 november 2026

Deze documenten hebben ieder een eigen rol en spreken elkaar niet tegen:

1. **Dit bestand (`PROJECT_CONTEXT.md`) is leidend voor de volledige app.** Het beschrijft productvisie, wetenschappelijke uitgangspunten, architectuur, datakwaliteit, privacy, ontwikkelafspraken en de actuele projectstatus. Bij tegenstrijdigheid is dit document leidend voor de bedoeling; de code op `main` blijft leidend voor wat daadwerkelijk is gebouwd.
2. **`IMPLEMENTATION_PLAN_32_IMPROVEMENTS.md` is het goedgekeurde uitvoeringsplan.** De 32 verbeterpunten zijn afgeleid van deze projectcontext. Het plan bepaalt de afgesproken fasering en acceptatiecriteria, maar kan de projectcontext of de actuele code niet overrulen.
3. **`VISCOACH_PRODUCT_ROADMAP.md` is de specifieke product- en technische blauwdruk voor VisCoach.** Deze roadmap werkt de VisCoach-ervaring en coachcyclus uit binnen de kaders van deze projectcontext. Het is geen tweede productvisie of een zelfstandige architectuur.
4. **`FASE0_DATA_DICTIONARY_AND_BASELINE.md` is het eerdere ondersteunende auditbewijs.** Het bevat de datadictionary en de read-only technische nulmeting op commit `65f56c4a7408d874defa415212b74cd165f01147` (6 november 2026).
5. **`VISLOGBOEK_VERBETERPLAN.md` is het actuele overkoepelende uitvoeringsplan.** Het bepaalt de volgorde en acceptatiecriteria voor de nieuwe optimalisatie.
6. **`FASE0_OPTIMIZATION_AUDIT.md` is het aanvullende auditbewijs voor de uitgebreide fase 0.** Deze audit is gestart op de actuele `main`-commit van 15 november 2026 en is nog in uitvoering. Het eerdere fase-0-document blijft een afgeronde historische nulmeting op zijn eigen commit.

### Status op basis van de actuele `main`

| Onderdeel | Status op 7 november 2026 | Betekenis |
|---|---|---|
| P0 — data-integriteit | Afgerond en gemerged via PR #39 | Geen nieuwe uitvoering nodig; regressiecriteria blijven gelden. |
| P1 — prognosekeuze en meetherkomst | Afgerond en gemerged via PR #40 | Geen nieuwe uitvoering nodig; regressiecriteria blijven gelden. |
| P2 — tijdzone, backuprelaties, Brier en engineprovenance | Afgerond en gemerged via PR #42, #43, #45 en #46 | Geen nieuwe uitvoering nodig; regressiecriteria blijven gelden. |
| 32-puntenplan, fasen 1–5 | Afgerond volgens de geregistreerde merges en Quality Gates | Deze werkzaamheden niet opnieuw uitvoeren. |
| 32-puntenplan, fase 6 | **Afgerond op `main` op 7 november 2026** | De geïntegreerde VisCoach-cyclus voldoet aan de softwarematige acceptatiecriteria; Quality Gate #491 is volledig geslaagd. Praktijkvalidatie blijft onderdeel van de doorlopende persoonlijke nulmeting. |
| Productfase 0 — persoonlijke nulmeting | Doorlopend | Echte sessies, vooraf opgeslagen prognoses en uitkomsten verzamelen; softwaretests zijn geen praktijkvalidatie. |
| Technische auditfase 0 (datadictionary, 6 november) | Afgerond als read-only audit op commit `65f56c4` | Historische technische inventarisatie; niet de uitgebreide optimalisatie-audit van 15 november. |
| Uitgebreide optimalisatie-auditfase 0 | **In uitvoering**; hercontrole op `main` en vervolgvalidatie tot en met `5dbf3b4` (16 november) | De eerste hercontrole staat in `FASE0_OPTIMIZATION_AUDIT.md` §19; de vervolgstatus, code-/testwijzigingen en nog uit te voeren Quality Gate staan in §20. De blueprint → code → UI → test-matrix is nog niet compleet. |

De technische baseline-audit is uitgevoerd op `main` commit `65f56c4a7408d874defa415212b74cd165f01147`; de bijbehorende Quality Gate run #42273675118 slaagde. De audit wijzigde geen applicatiecode en kon de lokale IndexedDB van een gebruikersapparaat niet uitlezen. Een geslaagde Quality Gate bewijst technische regressiecontrole, geen voorspellende nauwkeurigheid in echte vissessies.

De fase-6-uitvoering is op 7 november 2026 afgerond op `main`. De bestaande VisCoach-planvorming, startsnapshot, sessiegebonden coördinator, praktische adviesvergelijking, sessiehistorie, gebruikersfeedback en backuprelaties zijn met gerichte service-, database-, prognose- en evaluatietests gecontroleerd. Quality Gate #491 is volledig geslaagd op commit `ed459875329e03052a7ae442e806890fd3902983`: typecheck, alle regressie- en integratietests, dependency-audits en productiebuild.

De nieuwe tien-sessiesimulatie roept de bestaande `calculateDayPrognosis` en `evaluatePrognosisPerformance` aan. Bij 0–4 eerdere geldige sessies blijft de persoonlijke vangkans `null`; vanaf vijf eerdere geldige sessies berekent de engine in deze synthetische reeks respectievelijk 44%, 48%, 43%, 39% en 42%. De vijf numerieke, vooraf vastgelegde voorspellingen leveren een voorlopige Brier-score van 0,255 op. Dit bewijst de technische gegevensstroom, niet de voorspellende nauwkeurigheid in echte vissessies.

De service-integratietests dekken herbeoordeling bij `app_resume`, offline hervatten met gecachete weerdata, bevestiging van betekenisvolle weerswijzigingen, idempotentie, gelijktijdige events en atomische opslag af. Een fysieke Android-/browsercontrole van afzonderlijke modulelevenscycli of meerdere echte browsertabs is niet geclaimd. Dit is geen resterend softwareblokkerend acceptatiepunt; de persoonlijke nulmeting en praktijkvalidatie lopen door als afzonderlijke productfase 0.

Fase 6 is hiermee **softwarematig afgerond**. Er wordt geen tweede prognose-, evaluatie- of tactische engine toegevoegd.

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
- Gedefinieerde voorspellingsgebeurtenis (bijvoorbeeld: minimaal één doelvis gevangen).- Voorspelde kans, indien beschikbaar.
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
- Synchronisatie tussen apparaten en conflictafhandeling.- Versleuteling tijdens transport en waar passend opslag.
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
- Soortprofielen en thermische efficiëntie.- Prognose-engine met biologische activiteitsindex en persoonlijke kansschatting.
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

## Verbeter- en optimalisatietraject — leidend uitvoeringsplan (15 november 2026)

Het centrale, door de producteigenaar opgedragen optimalisatietraject staat in **[VISLOGBOEK_VERBETERPLAN.md](VISLOGBOEK_VERBETERPLAN.md)**. Dit document bepaalt de uitvoeringsvolgorde en acceptatiecriteria voor dataveiligheid, soortspecifieke biologische prognose, lerend stekprofiel, praktisch VisCoach-advies, praktijkvalidatie en administratie. De bestaande productvisie en technische blauwdrukken blijven inhoudelijk leidend; het verbeterplan organiseert de uitvoering en voorkomt parallelle/tegenstrijdige plannen.

**Uitgangspunten:** de kernfunctionaliteit blijft gratis en offline-first; bestaande gebruikersgegevens worden beschermd; bestaande engines worden eerst hergebruikt; prognoses worden biologisch soortspecifiek en onzekerheid wordt zichtbaar gemaakt; geen verbetering geldt als afgerond zonder tests, diff-review en passend bewijs. Historische benchmark-/testvangsten mogen na een afhankelijkhedenaudit worden verwijderd wanneer ze niet valide zijn of de productie verstoren. Echte gebruikersdata mag niet als onderdeel van deze cleanup worden verwijderd.

**Status per 15 november 2026:** het verbeterplan is vastgelegd op `main` en de uitgebreide read-only fase-0-audit is gestart op commit `4831fd6d7a200467c29773c574be7090674eca29`. Eerste bevindingen staan in `FASE0_OPTIMIZATION_AUDIT.md`. De vaste sessie van 19 oktober en vier canonieke vangsten zijn verdacht als benchmarkseed maar nog niet definitief geclassificeerd; historische records uit `src/data/historicalData.ts` zijn volgens de broncode uit een concrete gebruikersbackup geïmporteerd en worden beschermd. De huidige activiteitsscore is thermisch gedreven; windadvies wordt in de coachtekst alleen bij sterke wind getoond. Quality Gate-runs #503–#511 op de documentatie-updates faalden vrijwel direct zonder zichtbare workflowstappen of beschikbare logs. Run #510 rapporteerde `runner_id=0`; rerun van #503 bleef failure. Oorzaak onbekend; geen geslaagde Quality Gate op de huidige auditbaseline. Fase 0 blijft in uitvoering; fase 1 is nog niet gestart. Er is geen applicatiecode of gebruikersdatabase gewijzigd.


## Verplichte GitHub-werkwijze — altijd toepassen

- Bundel alle aanpassingen die bij één opdracht/werkeenheid horen in **één enkele Git-commit**. Sla nooit bestanden één voor één op via afzonderlijke commits.
- Gebruik standaard de commit-message-suffix **`[skip ci]`**, zodat documentatie- en andere wijzigingen niet onbedoeld GitHub Actions starten.
- Laat `[skip ci]` uitsluitend weg wanneer de gebruiker expliciet vraagt om de GitHub Action(s) te laten draaien.
- Als de gebruikte GitHub-interface geen multi-file commit in één keer ondersteunt, gebruik dan Git Trees + één commit (of een gelijkwaardige atomische Git-operatie). Gebruik niet als workaround meerdere Contents API-writes.
- Controleer vóór het committen de volledige verzamelde diff en de actuele HEAD van `main`; commit alleen de bedoelde bestanden.
- Controleer na het committen dat precies één commit is aangemaakt en dat alle bedoelde bestanden daarin zitten. Rapporteer commit-SHA, gewijzigde bestanden en of CI bewust is overgeslagen.
- Deze regel geldt voor documentatie, code, tests, configuratie, workflows en alle andere repositorybestanden. Alleen een expliciete afwijkende opdracht van de gebruiker kan hiervan afwijken.


## Eigenaarbesluit datagrondslag — 15 november 2026

Alle reeds bestaande historische vangstregistraties mogen bij de gecontroleerde reset worden verwijderd, inclusief vangsten uit de persoonlijke historische backupseed. De schone start mag geen oude vangsten opnieuw seedden of bij restore injecteren. Vangsten die na de reset worden ingevoerd moeten behouden blijven. Dit besluit omvat niet automatisch het verwijderen van sessies zonder vangst, locaties, prognosesnapshots, waarnemingen of overige gebruikersgegevens; zie `VISLOGBOEK_VERBETERPLAN.md` en `FASE0_OPTIMIZATION_AUDIT.md`.


## Definitief eigenaarbesluit — schone start sessies en vangsten (15 november 2026)

De eigenaar heeft toestemming gegeven om bij de gecontroleerde schone start **alle reeds bestaande historische sessies én alle vangstregistraties te verwijderen**, inclusief sessies zonder vangsten en records uit de oude persoonlijke backupseed. Nieuwe installaties mogen geen historische locaties, sessies of vangsten automatisch laden. De migratie mag alleen de bestaande sessie-/vangsthistorie en direct sessiegebonden afgeleide gegevens opruimen; locaties, instellingen, weercache, prognosehistorie, geplande sessies en niet-sessiegebonden waarnemingen blijven behouden. Prognoses gekoppeld aan verwijderde sessies worden ontkoppeld en niet langer als geëvalueerde uitkomsten beschouwd. Na de migratie ingevoerde sessies en vangsten moeten behouden blijven. Zie de definitieve voorwaarden in `VISLOGBOEK_VERBETERPLAN.md` en `FASE0_OPTIMIZATION_AUDIT.md`.


## Implementatiestatus schone start — 15 november 2026

De repositorywijziging introduceert databaseversie 5 met een eenmalige v4→v5 resetmigratie en verwijdert automatische historische seeddata en benchmarkinjectie bij backup-restore. Een regressietest voor de migratie is toegevoegd. Tests, build en lint moeten nog worden uitgevoerd; de wijziging geldt daarom nog niet als software-getest.

---

## Zelfstandig project — zelflerende prognose, foutdiagnose en VisCoach-feedbacklus

**Projectissue:** [#50 — Zelflerende prognose, foutdiagnose en VisCoach-feedbacklus](https://github.com/sennzor-wq/Vislogboek/issues/50)  
**Projectdocument:** [PROJECT_ZELFLERENDE_PROGNOSE.md](PROJECT_ZELFLERENDE_PROGNOSE.md)  
**Relatie:** zelfstandig projectspoor naast het overkoepelende optimalisatietraject #49. Het sluit inhoudelijk aan op fase 5, maar heeft een eigen scope, fasering, audit en acceptatiecriteria. Er wordt één gedeelde leerarchitectuur gebouwd; geen dubbele feedbacklus.

### Productdoel
Vislogboek moet een aantoonbaar lerend systeem worden: prognose vooraf vastleggen → sessie-uitkomst koppelen → evalueren → verklaren waarom een voorspelling afweek → datakwaliteit controleren → gevalideerde modelverbetering → nieuwe prognose en VisCoach-tactiek → opnieuw evalueren.

### Niet-onderhandelbare principes
- Brier-score is een evaluatiemaatstaf en diagnose-instrument, geen directe correctiefactor voor de vangstkans.
- Een slechte score leidt eerst tot foutdiagnose. Mogelijke oorzaken zijn modelbias, vervuilde of onvolledige invoer, onjuiste koppeling, onvergelijkbare sessies, selectiebias, kleine steekproef of toevalsvariatie.
- Oorspronkelijke snapshots en bronregistraties blijven onveranderd. Onbetrouwbare data wordt gemarkeerd met reden en auditspoor, niet stilzwijgend aangepast of verwijderd.
- Kalibratie en evaluatie worden chronologisch gescheiden om future leakage te voorkomen.
- Alleen gevalideerde, versieerbare en terugdraaibare correcties mogen toekomstige prognoses en passende VisCoach-adviezen beïnvloeden.
- Softwaretests en synthetische simulaties bewijzen niet zelfstandig de praktijknauwkeurigheid.
- Offline-first en gratis kernfunctionaliteit blijven behouden.

### Startstatus
Er zijn al bouwstenen in de repository: prognosis snapshots, sessie-uitkomstkoppeling, evaluationEngine, Brier/Brier Skill Score, forward-validation tests, historische sessieanalyse en watertemperatuurkalibratie. De directe terugkoppeling van Brier-evaluatie naar de vangstkans is niet aangetoond. De actuele codeketen en foutdiagnose moeten eerst opnieuw volledig worden geaudit. Zie issue #50 en het zelfstandige projectdocument.


## Voortgang uitgebreide optimalisatie-audit — 16 november 2026

De actuele `main`-commit is `5dbf3b4e8afcd67f5d879f2944c6f60eea71c55f`. In deze commit zijn verouderde historische benchmarkafhankelijkheden uit de evaluatietestfixtures verwijderd, zijn synthetische sessiekoppelingen toegevoegd en is de niet-aangeroepen historische datageneratorscript verwijderd. Er zijn geen historische vangstgegevens teruggezet.

De eigenaar heeft op de lokale Mac `bun run lint` uitgevoerd; `tsc --noEmit` eindigde zonder TypeScript-fouten. Dit is uitsluitend bewijs voor de typecheck. De volledige testsuite en productiebuild zijn op deze commit nog niet als geslaagd aangetoond.

De GitHub Quality Gate wordt aangevuld met de bestaande `test:clean-start-migration`-test. De test `test-core-logic.ts` is niet aan de CI toegevoegd zolang deze live Open-Meteo-aanroepen doet; de uitvoering daarvan blijft een afzonderlijke lokale netwerkafhankelijke controle. De eerstvolgende CI-run moet de forward-validationtests, de clean-startmigratietest en de overige bestaande Quality Gate-stappen beoordelen.

**Status:** fase 0 blijft open. Geen fase 1 gestart en geen praktijkvalidatie geclaimd. Zie `FASE0_OPTIMIZATION_AUDIT.md` §20 voor de actuele teststatus en resterende acties.


## GitHub Actions-status — 16 november 2026

Quality Gate-run #529 op commit `26576d0` eindigde als failure voordat een workflowstap werd uitgevoerd. De job bevatte nul stappen en er waren geen logs beschikbaar. Dit is geen mislukte testuitslag: de test- en buildstappen zijn niet gestart. De oorzaak is onbekend. Zie `FASE0_OPTIMIZATION_AUDIT.md` §21. De lokale typecheck is wel geslaagd; overige softwarevalidatie blijft open.


## Core-logic testanalyse — 16 november 2026

De eerste lokale uitvoering van `bun run tsx test-core-logic.ts` op de actuele code gaf 26 geslaagde en 25 mislukte controles. De oorzaken zijn geclassificeerd: temperatuurfixtures misten expliciete watertemperatuurmetingen; synthetische `catch`-sessies misten doelsoortgebonden `CatchItem`-records; en een oude test verwachtte een numerieke aanwezigheidsbonus waarvoor geen empirisch gevalideerde factor bestaat. De testfixtures worden gecorrigeerd zonder de strikte datakwaliteitsregels te versoepelen of een ongefundeerde bonus toe te voegen. De gewijzigde suite moet nog opnieuw lokaal worden uitgevoerd; zie §22 in `FASE0_OPTIMIZATION_AUDIT.md`.

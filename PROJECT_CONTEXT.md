# PROJECT_CONTEXT.md — Vislogboek
> **Doel van dit document:** blijvend product-, wetenschaps- en technisch projectgeheugen voor Vislogboek. Dit document is de leidende bron voor productrichting, architectuurprincipes, datakwaliteit, prognosevalidatie en ontwikkelafspraken.
>
> **Werkwijze voor iedere AI-/ontwikkelsessie:** lees dit document én controleer de actuele code voordat je een wijziging voorstelt of uitvoert. De code is de waarheid over wat daadwerkelijk is geïmplementeerd; dit document is de waarheid over wat het product moet worden en welke afspraken gelden. Werk dit document bij wanneer een afspraak, architectuurkeuze of status verandert.

**Project:** Vislogboek  
**Repository:** `sennzor-wq/Vislogboek`  
**Huidige technische basis bij opstellen:** React 19, TypeScript, Vite, PWA, Dexie 4 / IndexedDB, Open-Meteo  
**Documentstatus:** leidende product- en technische projectcontext; product- en architectuurbasis bijgewerkt tot en met 19 november 2026, met actuele Fase-2-audit, evaluatie- en toelatingsstatus.  
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

## Documenthiërarchie en actuele projectstatus — peildatum 19 november 2026

Deze documenten hebben ieder een eigen rol en spreken elkaar niet tegen:

1. **Dit bestand (`PROJECT_CONTEXT.md`) is leidend voor de volledige app.** Het beschrijft productvisie, wetenschappelijke uitgangspunten, architectuur, datakwaliteit, privacy, ontwikkelafspraken en de actuele projectstatus. Bij tegenstrijdigheid is dit document leidend voor de bedoeling; de code op `main` blijft leidend voor wat daadwerkelijk is gebouwd.
2. **`IMPLEMENTATION_PLAN_32_IMPROVEMENTS.md` is het goedgekeurde uitvoeringsplan.** De 32 verbeterpunten zijn afgeleid van deze projectcontext. Het plan bepaalt de afgesproken fasering en acceptatiecriteria, maar kan de projectcontext of de actuele code niet overrulen.
3. **`VISCOACH_PRODUCT_ROADMAP.md` is de specifieke product- en technische blauwdruk voor VisCoach.** Deze roadmap werkt de VisCoach-ervaring en coachcyclus uit binnen de kaders van deze projectcontext. Het is geen tweede productvisie of een zelfstandige architectuur.
4. **`FASE0_DATA_DICTIONARY_AND_BASELINE.md` is het eerdere ondersteunende auditbewijs.** Het bevat de datadictionary en de read-only technische nulmeting op commit `65f56c4a7408d874defa415212b74cd165f01147` (6 november 2026).
5. **`VISLOGBOEK_VERBETERPLAN.md` is het actuele overkoepelende uitvoeringsplan.** Het bepaalt de volgorde en acceptatiecriteria voor de nieuwe optimalisatie.
6. **`FASE0_OPTIMIZATION_AUDIT.md` is het aanvullende auditbewijs voor de uitgebreide fase 0.** Deze audit is gestart op de actuele `main`-commit van 15 november 2026 en is nog in uitvoering. Het eerdere fase-0-document blijft een afgeronde historische nulmeting op zijn eigen commit.
7. **`FASE2_PROGNOSE_AUDIT.md` is het gedetailleerde, doorlopende auditbewijs voor Fase 2.** Het document registreert de actuele codebevindingen, wetenschappelijke responsen, bronkwaliteit, datadekking, evaluatielabels en formele acceptatiestatus. Het is geen zelfstandige productvisie of vervanging van dit bestand.
8. **`MODELARCHITECTUUR_FASE2.md` legt de architectuurregels voor de Fase-2-prognose vast.** Het beschrijft hoe de responslagen, bronstatus, normalisatie, onzekerheid en evaluatie wel/niet mogen worden gecombineerd. Het volgt de product- en architectuurprincipes uit dit bestand.

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


### Correctie testfixtures watertemperatuur — 16 november 2026

De core-logic fixtures gebruiken voor temperatuurrespons en persoonlijke prognose nu minimaal 72 uur synthetische voorafgaande uurlijkse weersdata zonder een waarde via `userWaterTemp` mee te geven. Dat veld is uitsluitend voor een echte lokale meting. De tests moeten de weather-only modelschattingsroute controleren; directe meting en schatting blijven apart getest. Zie de aanvullende correctie in `FASE0_OPTIMIZATION_AUDIT.md`.


## Lokale Quality Gate volledig uitgevoerd — 16 november 2026

De eigenaar heeft alle stappen uit de actuele GitHub Actions Quality Gate lokaal uitgevoerd. De dependency-installatie, beide Bun-audits, TypeScript-typecheck, tests, productiebuild en dist-privacycontrole zijn zonder gemelde fouten voltooid. De drie laatst resterende workflowtests (`test-session-coach-integration.ts`, `test-viscoach-greetings.ts` en `test-weather-enrichment.ts`) zijn eveneens door de eigenaar uitgevoerd zonder fouten.

Belangrijke concrete resultaten: typecheck zonder diagnostiek; dependency-audits zonder kwetsbaarheden op de ingestelde niveaus; alle tests met expliciete tellingen slaagden; clean-startmigratie 16/16; backup-roundtrip 41/41; productiebuild geslaagd; `PASS: No private artifacts detected in dist`. De backup-importtest toonde alle verwachte fixture- en mergecontroles, maar de vastgelegde uitvoer bevatte geen expliciete formele eindtelling. De build gaf alleen niet-blokkerende waarschuwingen over `__dirname` en een JavaScript-chunk van circa 802 kB.

Aanvullend slaagde `test-core-logic.ts` lokaal met 51/51; deze netwerkafhankelijke test blijft buiten de GitHub Actions-workflow zolang Open-Meteo niet wordt gemockt. Er is geen GitHub Actions-run gestart; dit betreft lokale validatie door de eigenaar.

**Status fase 0:** nog in uitvoering. De volledige Quality Gate-validatie sluit de resterende blueprint → code → UI → test-matrix, repositorybrede benchmark-/seedverwijzingsaudit en backup-importregressies uit §19–22 niet af. Fase 1 blijft gesloten totdat die onderdelen zijn afgerond. Zie `FASE0_OPTIMIZATION_AUDIT.md` §23.


## Backupimportaudit — bevestigde bevindingen (16 november 2026)

Read-only hercontrole op `main` commit `60ac3c631522b1c2884a2313d91241dbb8053ceb` bevestigt dat de legacy v2-backup met `spots` en geneste `catches` wordt afgewezen voordat de importpreview verschijnt. De legacyroute in `normalizeRawBackup()` vult `plannedSessions` en `coachAdviceRecords` niet, terwijl `inspectImportFile()` beide arrays verplicht stelt. `test-backup-import.ts` controleert alleen normalisatie en mist deze volledige inspectieroute.

Verder ontbreken `plannedSessions` en `coachAdviceRecords` in `validateBackupPayloadLimits()` (per-collectielimieten, totaalrecordtelling en recursieve veldinspectie). De vervangketen `replaceWithImportData()` en de daadwerkelijke veiligheidsdownload zijn niet rechtstreeks end-to-end getest; de round-triptest roept `restoreBackupData()` direct aan.

**Fase 0 blijft read-only:** er is geen code- of testfix uitgevoerd. De bevindingen en vereiste regressiedekking staan in `FASE0_OPTIMIZATION_AUDIT.md` §24. Fase 1 blijft gesloten totdat de volledige audit is afgerond en geaccepteerd.


## Kernketenmatrix — controle 16 november 2026

De read-only traceerbaarheidsmatrix voor de kernketen prognose → VisCoach → sessie → evaluatie staat in `FASE0_OPTIMIZATION_AUDIT.md` §25. De App koppelt deze onderdelen daadwerkelijk: planberekening via bestaande prognose-engine, startsnapshot en sessiecommit, automatisch herbeoordelen van actieve sessies, coachfeedback en statistische evaluatie.

Belangrijkste open punten:
- De gekozen start-/tijdvensterkeuze wordt wel als `selectedTimeSlot` opgeslagen en getoond, maar de adviescopy gebruikt nog het beste tijdvak uit de gehele dagprognose. Dit kan een tegenstrijdige aanbeveling opleveren.
- Planopslag/-annulering en de volledige VisCoach-startflow hebben geen gerichte lifecycle-/UI-E2E-test.
- Er zijn geen browser-/component-E2E-scripts in `package.json`; UI-gedrag is voor deze audit statisch gevolgd.
- De service-integratietests voor snapshotcommit, actieve coachherbeoordeling, feedback en Brier-/temperatuurevaluatie zijn aanwezig. Praktijknauwkeurigheid is daarmee niet bewezen.

Fase 0 blijft read-only en in uitvoering; de resterende matrixdelen staan in audit §25.2.


## Stek- en geometrieaudit — 16 november 2026

De traceerbaarheidsmatrix staat in `FASE0_OPTIMIZATION_AUDIT.md` §26. Wind-, habitat- en positioneringsengines zijn gekoppeld aan de dagprognose en hebben scenario-tests. De datainvoer is echter niet volledig: de locatie-editor biedt geen gestructureerde `habitatFeatures`-invoer en gebruikt standaard GPS-coördinaten rond Culemborg voor nieuwe locaties en ongeldige invoer. Oeveroriëntatie kan wel vanuit Prognose worden ingesteld, maar niet in het standaard locatieformulier.

Dit is een concreet datakwaliteitsrisico: niet-bevestigde coördinaten kunnen als echte steklocatie worden opgeslagen. Er is geen code gewijzigd; dit blijft een fase-0-bevinding. Zie audit §26.1–26.2.


## Watertemperatuurketen — controle 16 november 2026

De read-only matrix staat in `FASE0_OPTIMIZATION_AUDIT.md` §27. De gewenste basiswerking is aanwezig: een actuele lokale meting heeft voorrang; zonder lokale meting kan de app een weerafgeleide of historisch onderbouwde schatting tonen; een eerdere lokale meting kan toekomstige dagen als schattingsanker ondersteunen. Synthetische tests dekken opwarming, afkoeling, meetprioriteit, meetouderdom en future leakage.

**Bevestigd open punt:** de registratie bewaart `waterTemperatureMeasuredAt`, maar `collectHistoricalWaterTemperatureObservations()` en `waterThermalEngine.ts` dateren sessiemetingen nog op `session.startTime`. Bovendien geeft live herbeoordeling de sessietemperatuur opnieuw door als actuele meting op het herbeoordelingstijdstip. Hierdoor kan een oude meting verkeerd worden gedateerd, opnieuw als actueel gelden en dubbel in het historische profiel terechtkomen. De benodigde regressiescenario's staan in audit §27.2. Geen code gewijzigd; fase 0 blijft read-only.


## Persoonlijk leren en sessie-inspanning — controle 16 november 2026

De matrix staat in `FASE0_OPTIMIZATION_AUDIT.md` §28. De bestaande prognose gebruikt echte sessies, doelsoort, stek, bevestigde nulvangsten en sessieduur voor een Poisson-rate. Persoonlijke segmentatie naar techniek, aas/voer en hengelinzet ontbreekt in die vangst-rate. De richtingsmodule biedt wel een beperkte, voorzichtige persoonlijke nuance na minimaal 11 sessies en 6 richtingsregistraties.

Hengelgegevens kunnen worden ingevoerd en `sessionEffortEngine.ts` bevat een geteste berekening van hengeluren, maar `SessionsView.tsx` roept die helper niet aan; ook prognose en statistieken gebruiken hem niet. Er is dus nog geen productintegratie van hengeluren. Verder telt `statsEngine.ts` onbekende aantallen via `count || 1` als één vis, terwijl de sessieweergave onbekende aantallen niet meetelt. Een directe `calculateStats()`-regressietest ontbreekt in de aangetroffen tests.

Er is geen centrale `spotLearningEngine.ts` aangetroffen. Of die nodig is, moet pas na afronding van de volledige audit worden besloten. Geen code gewijzigd.


## Fase-0-vervolg — biologische prognosefactoren (16 november 2026)

Audit §29 bevestigt dat de activiteitsscore alleen de soortspecifieke thermische efficiëntie gebruikt. Weer-, seizoen- en tijdsfactoren blijven context; habitat, oeverwind, persoonlijke vangstkans en voorvoer zijn aparte uitkomsten. De huidige tests tonen vooral softwarematige/synthetische werking en geen biologische praktijkvalidatie. De volledige factorcatalogus, hydrologische invoerhiaten en testlacunes zijn vastgelegd in de audit. Geen code gewijzigd.


## Fase-0-vervolg — PDF watertemperatuurmodel (16 november 2026)

De PDF `Watertemperatuur_Schatten_en_Voorspellen.pdf` is vergeleken met de huidige waterthermische engine (audit §30). De engine heeft al lokale meetankers, historische profielen, uurlijkse weerdata, instraling en onzekerheidsmetadata. De PDF voegt vooral een continue diepte-/windsnelheidsafhankelijke relaxatietijdconstante als kandidaat toe. Rechtstreekse overname is niet verantwoord: de PDF-formule verwacht wind in m/s terwijl de app km/u gebruikt, de tijdconstante moet bij uurlijkse stappen naar uren worden omgerekend en de PDF is intern inconsistent bij windstilte (vuistregel 8,75 dagen bij 2,5 m versus 24 dagen uit de dynamische formule). De huidige synthetische tests gebruiken een vaste 65-uursreferentie en bewijzen geen praktijknauwkeurigheid. Aanbeveling: experimentele kandidaatvarianten naast de huidige engine testen op identieke lokale meetankers en chronologische onafhankelijke meetreeksen, met MAE/RMSE/bias per horizon, diepte, wind, seizoen en watertype. Geen code gewijzigd.


## Fase-0-vervolg — beschikbaarheid watertemperatuurdata (16 november 2026)

Audit §31 controleert de opslag- en validatieketen. Prognosesnapshots kunnen de exacte weersinvoer en een later gemeten watertemperatuur met meetmetadata bewaren; de gebruikersrecords zelf staan in lokale IndexedDB en zijn niet zichtbaar vanuit GitHub. De werkelijke datasetomvang is dus nog onbekend. Bevestigd is ook dat de historische sessieverzamelaar `session.startTime` gebruikt in plaats van `waterTemperatureMeasuredAt`, wat eerst moet worden gecorrigeerd voordat sessiemetingen als betrouwbare historische waarnemingen worden gebruikt. Vervolg: lokale, read-only backup-telling en daarna bepalen of onafhankelijke empirische validatie haalbaar is. Geen code gewijzigd.


## Faseovergang en actuele uitvoeringsstatus — 16 november 2026

**Besluit producteigenaar:** de uitgebreide read-only fase-0-audit is afgerond en geaccepteerd. Zie `FASE0_OPTIMIZATION_AUDIT.md` §32 voor de formele acceptatie en volledige overdracht. De bevindingen uit die audit zijn niet automatisch opgelost; ze vormen de input voor de volgende uitvoeringsfase.

**FASE 1 GESTART — 16 november 2026**

Fase 1 richt zich eerst op dataveiligheid en het verwijderen van obsolete vaste benchmark-/demo-initialisatie uit het productiepad. De aanpak begint met een afhankelijkhedenaudit, gevolgd door gerichte codewijzigingen en regressietests voor database-initialisatie, backup/restore/merge-import en relaties. De bekende snapshot-importkwestie (mogelijk verweesde `linkedSessionId`), de vaste benchmarkreferenties en de clean-startvoorwaarden zijn expliciete aandachtspunten.

De clean-startafspraak blijft ongewijzigd: vóór de eenmalige migratie bestaande sessies en vangsten worden niet teruggebracht; nieuwe sessies en vangsten na de migratie moeten behouden blijven. Geen brede reset en geen verwijdering van locaties of overige gebruikersgegevens buiten de expliciet goedgekeurde scope.

**Uitgevoerd in deze faseovergang:** alleen documentatie bijgewerkt. Er is nog geen fase-1-applicatiecode gewijzigd en er is geen GitHub Actions-run gestart. Issue #49 blijft open.


## Fase-1-afhankelijkhedenaudit — 16 november 2026

Audit uitgevoerd op actuele `main` commit `0334b43c006bc172f5ba8d3afa7b800c8302a1f0`. Dit betreft een read-only code-/testaudit; er is geen applicatiecode of gebruikersdata gewijzigd en geen GitHub Actions-run gestart.

**Database en clean start**
- De huidige database-initialisatie maakt uitsluitend standaardinstellingen aan; er is geen actieve productie-seed voor historische locaties, sessies, vangsten of benchmarkrecords.
- De v5-migratie voert de expliciet goedgekeurde clean start uit en heeft een gerichte migratietest. Nieuwe sessies en vangsten blijven behouden bij herhaald initialiseren.
- Verouderde comments spreken nog over een altijd aanwezige benchmark/historische seeding; deze zijn niet in overeenstemming met de huidige code.
- De generieke `isBenchmark`-compatibiliteit is nog aanwezig in prognose/evaluatie, UI en veilige verwijdering. Dit is geen actieve seeding en kan voorlopig blijven om oude/importeerde records en fixtures veilig af te handelen.

**Bevestigde backup-/importproblemen**
1. Legacy-normalisatie vult `plannedSessions` en `coachAdviceRecords` niet standaard met lege arrays, terwijl de importinspectie beide verplicht stelt. Oudere formaten kunnen daardoor na normalisatie onterecht worden afgewezen.
2. De payloadlimieten controleren deze twee tabellen niet op collectiegrootte, totale recordaantallen en recursieve veld-/nestingslimieten.
3. Merge slaat benchmarklocaties en -sessies over, maar importeert prognosesnapshots alleen op ID. Een snapshot kan zo verwijzen naar een parent die tijdens dezelfde merge is overgeslagen.
4. Volledig herstel wist de huidige database en schrijft de backup integraal terug. Benchmarkrecords worden niet uitgesloten; een backup van vóór de clean start kan dus oude sessies/vangsten opnieuw introduceren. Alleen `isBenchmark` filteren is onvoldoende, omdat oude persoonlijke registraties die vlag mogelijk niet hebben.
5. De importpreview berekent wel `hasBenchmark`, maar toont dit niet. De gebruiker krijgt ook geen expliciete waarschuwing over een backup waarvan de clean-startstatus niet aantoonbaar is.

**Testdekking**
- De clean-startmigratietest dekt oude records, afhankelijke relaties, lege installatie en behoud van nieuwe records.
- De roundtriptest dekt restore, merge-idempotentie en relaties binnen een backupbestand, maar niet het overslaan van parents tijdens merge of benchmarkbeveiliging tijdens restore.
- De legacy-importtest controleert normalisatie en een simulatie, niet de volledige inspectie-/mergeketen.

**Vervolg:** eerst een expliciet backupgeneratie-/clean-startcontract vastleggen, zodat oude backups niet ongemerkt historische data terugbrengen en nieuwe records na de migratie niet verloren gaan. Daarna in één codewerkstroom de legacy-normalisatie, payloadlimieten, relationele merge/restore-policy, previewwaarschuwingen en regressietests corrigeren. Zie `VISLOGBOEK_VERBETERPLAN.md` voor de volledige afhankelijkhedenaudit en scope.

**Status fase 1:** afhankelijkhedenaudit grotendeels afgerond; codewerkstroom nog niet gestart. Issue #49 blijft open.


### Fase 1 backup/clean-start update — 16 november 2026

Nieuwe exports markeren `cleanStartVersion: 1`; bestaande v5-backups worden ook als post-clean-start beschouwd omdat v5 de clean-startmigratie introduceerde. Backups van v1-v4 blijven bruikbaar voor herstel van instellingen, locaties, weercache en zelfstandige gegevens, maar hun oude sessies/vangsten en sessiegebonden afhankelijke gegevens worden niet teruggezet. Prognoses en geplande sessies blijven behouden waar mogelijk, met oude sessiekoppelingen veilig ontkoppeld. De importpreview toont de status en aantallen overgeslagen records. Merge valideert parentbeschikbaarheid na filtering; limieten omvatten alle persistente collecties. Nieuwe sessies/vangsten in post-clean-startbackups blijven volledig herstelbaar. Gerichte regressietest toegevoegd; tests/build en review moeten nog plaatsvinden. Geen Actions gestart.


## Actuele voortgang optimalisatietraject — herbevestigd 16 november 2026

De actuele repository is gecontroleerd: `main` staat op `0bf6656407e45aa5f02f81c9fa7e91593862ac99` en de GitHub-repository staat op **public**. Dit statusblok vervangt eerdere voortgangsnotities in dit document die fase 0 of de backup/restore-werkstroom nog als niet afgerond beschrijven.

### Fase 0
Afgerond en door de producteigenaar geaccepteerd. De uitgebreide read-only audit en overdracht staan in `FASE0_OPTIMIZATION_AUDIT.md` §32. De bevindingen uit die audit blijven open uitvoerpunten; ze betekenen niet dat fase 0 opnieuw moet worden uitgevoerd.

### Fase 1 — huidige stand
De eerste samenhangende backup/clean-start-werkstroom is geïmplementeerd in commit `67c8a18391a7e29fbb22c438516c583e4ca94c2f`. De wijzigingen beschermen de eenmalige clean-startgrens bij legacy restore en merge, behouden nieuwe records uit post-clean-startbackups, tonen de gebruiker welke oude records worden overgeslagen en controleren relationele integriteit en payloadlimieten.

De volledige GitHub Actions Quality Gate is daarna geslaagd:
- Run [#43886994227](https://github.com/sennzor-wq/Vislogboek/actions/runs/43886994227)
- Getest op commit `0bf6656407e45aa5f02f81c9fa7e91593862ac99`
- Resultaat: **completed / success**
- Inclusief audits, typecheck, tests, backup-/restore-regressies, clean-startmigratie, productiebuild en controle dat de build geen private artefacten bevat.

De app-level handmatige controle (in de app een sessie maken, backup exporteren en terugzetten) is nog een afzonderlijke praktijktest. Softwaretests zijn niet hetzelfde als deze gebruikerscontrole.

### Wat nog moet gebeuren
1. Fase 1 afronden met een laatste gerichte audit van obsolete benchmark-/demo-verwijzingen, verouderde initialisatiecomments en de resterende relatie-/verwijderpaden. Alleen aantoonbaar dode code wordt verwijderd; generieke compatibiliteit en echte gebruikersdata blijven beschermd.
2. Fase-1-tests en volledige diff opnieuw beoordelen en de fase formeel accepteren wanneer alle criteria aantoonbaar zijn afgedekt.
3. Daarna fase 2 starten: soortspecifieke biologische activiteit en gedrag. Eerst bestaande prognose- en deel-engines/factoren in kaart brengen; geen tweede engine en geen onbewezen numerieke gewichten.
4. Fase 3–6 blijven in de vastgelegde volgorde gepland. De productpraktijkvalidatie met echte sessies en lokale watertemperatuurmetingen blijft een afzonderlijke doorlopende bewijsstroom.

**Werkafspraak blijft:** wijzigingen rechtstreeks op GitHub `main`, één atomische commit per werkpakket, documentatie in dezelfde commit, standaard `[skip ci]` tenzij een Quality Gate-run bewust nodig is. Geen GitHub Actions-run claimen zonder het resultaat daadwerkelijk te controleren.


### Fase 1 — kleine opschoning legacycompatibiliteit (16 november 2026)

Op `main` is de dode legacy-vertakking `isLokkershoek19 = false` verwijderd uit backupnormalisatie. De import gebruikt rechtstreeks de al bestaande locatie-ID en locatienaam uit de backup. De importuitkomst verandert hierdoor niet; er wordt geen Lokkershoek-locatie aangemaakt of verwijderd. De database-initialisatiecomments zijn in overeenstemming gebracht met het werkelijke gedrag: alleen standaardinstellingen worden geïnitialiseerd, geen benchmark- of historische records.

Generieke `isBenchmark`-compatibiliteit blijft behouden voor oude/ingevoerde records en veilige verwijdering. De wijziging staat klaar voor volledige validatie door de GitHub Quality Gate; de uitkomst wordt pas na controle van de run als geslaagd geregistreerd.

**Volgende:** controleer de resterende merge-/restore-parentrelaties en veilige verwijderpaden tegen de fase-1-acceptatiecriteria; pas daarna fase 1 formeel afronden.

## Faseovergang 1 → 2 — 16 november 2026

**Fase 1: afgerond en geaccepteerd.** De eigenaar heeft de praktische backup/restore-test in de app volledig uitgevoerd en bevestigd dat deze werkt: app openen, sessie aanmaken, backup maken en terugzetten. Dit vormt de app-level controle naast de eerder geslaagde softwarematige regressies en Quality Gate-run [#43886994227](https://github.com/sennzor-wq/Vislogboek/actions/runs/43886994227) op commit `0bf6656407e45aa5f02f81c9fa7e91593862ac99`. De beperkte legacy-opschoning staat op `main`; generieke `isBenchmark`-compatibiliteit blijft bewust behouden. De run op de latere cleanup-commit is niet als geslaagd geregistreerd zonder een bevestigde Actions-uitkomst.

**Fase 2: gestart — read-only audit en factorinventarisatie.** Onderzoek eerst de actuele code op `main`: bestaande activiteitsprognose, soortprofielen, thermische respons, weers-/water-/seizoensfactoren, habitat- en bewegingsmodellen, databronnen, onzekerheidsrepresentatie en chronologische evaluatie. Maak een traceerbare matrix van blueprintfactor → biologische hypothese → soort/tijdschaal → beschikbare meting of schatting → huidige code/UI → tests/evaluatie → status. Maak onderscheid tussen totale activiteit/voedingsactiviteit en habitatkeuze/verplaatsing. Er worden in deze audit geen gewichten verzonnen, geen engine gedupliceerd en geen modelgedrag aangepast.


## Fase 2 — eerste prognose-audit (16 november 2026)

De eerste read-only bevindingen staan in [FASE2_PROGNOSE_AUDIT.md](FASE2_PROGNOSE_AUDIT.md). De bestaande activiteitsindex in `prognosisEngine.ts` wordt numeriek alleen door de soortspecifieke thermische efficiëntie bepaald. Wind, druk, seizoen, tijdstip/licht, bewolking en neerslag zijn context; de aparte `habitatMovementEngine.ts` gebruikt wind-, thermiek-, locatie- en waarnemingscontext voor ruimtelijke inschatting. De profielen in `fishProfiles.ts` bevatten voorlopige thermische parameters en heuristische voorkeuren; bronvermeldingen ondersteunen niet automatisch exacte numerieke parameters.

Fase 2 blijft in audit totdat de volledige factor-/blueprintmatrix, UI-/snapshotketen, ontbrekende-temperatuurafhandeling, tests en beschikbare echte evaluatiedata zijn gecontroleerd. Er zijn nog geen modelgewichten gewijzigd en geen engine toegevoegd.


## Fase 2 — ontwerpdoel biologisch prognosemodel (16 november 2026)

De producteigenaar heeft bevestigd dat het doel een biologisch onderbouwd, soortspecifiek model is, niet een prognose die uitsluitend op watertemperatuur leunt. Het ontwerp en de auditcriteria staan in `FASE2_PROGNOSE_AUDIT.md` §5.

Het model moet drie afzonderlijke grootheden schatten: (1) totale activiteit, (2) voedselzoek-/foerageeractiviteit en (3) habitat-/locatiegeschiktheid. Een vangstverwachting is een aparte downstream-uitkomst waarin ook sessieduur, methode, presentatie, aas/voer en visserijinspanning meetellen. Geen van deze grootheden mag zonder onderbouwing als synoniem voor een andere worden gebruikt.

De zeven illustratieve factorfamilies zijn: watertemperatuur/verloop; wind/waterbeweging; seizoen/levenscyclus; licht/dag-nachtritme; luchtdruk/verandering; neerslag/weersverandering; zuurstof/stroming/overige watercondities. Eventuele percentages uit een voorbeeld zijn uitsluitend conceptueel en mogen niet als implementatiegewichten worden behandeld. Per soort worden respons, habitat, tijdsvenster, drempels, interacties en onzekerheid afzonderlijk onderbouwd.

Architectuurprincipe: omgevingsdata → soortspecifieke biologische respons → activiteit/foerageren → habitat/beweging → lokale leerlaag → betrouwbaarheid/ onzekerheid. Bestaande engines worden hergebruikt; geen dubbele engine. Factoren mogen interacties hebben en hoeven niet in een simpele gewogen som te passen. Ontbrekende gegevens blijven expliciet onbekend of onzeker.

**Status:** ontwerpdoel vastgelegd; fase 2 blijft audit. Er zijn nog geen gewichten, modelgedragingen of app-code gewijzigd en er is nog geen biologische prestatieverbetering aangetoond.


### Tweede auditronde fase 2 — 16 november 2026

De prognoseketen is deels gevolgd van `PrognosisView.tsx` via `calculateDayPrognosis()` naar de onveranderlijke snapshots en evaluatie. De UI toont `N/B` en de snapshot slaat `predictedActivityScore: null` op wanneer de thermische basis ontbreekt. De persoonlijke vangstkans gebruikt een aparte Poisson-blootstellingsberekening op basis van eigen sessie-/vangstdata en sessieduur; de huidige implementatie moduleert het historische vangsttempo daarnaast nog met een beperkte factor uit de dagactiviteitsscore. Dit verband moet in het toekomstige model expliciet worden getoetst.

Gevonden tekstuele inconsistentie: één onzekerheidsnotitie in `prognosisEngine.ts` zegt dat luchttemperatuur wordt gebruikt wanneer watertemperatuur niet beschikbaar is, terwijl de score-/UI-regels luchttemperatuur expliciet niet als vervanging behandelen. De UI en snapshot markeren de score wel als niet beschikbaar. Gerichte codecorrectie en regressietest staan open; nog niet gewijzigd.

De bestaande tests dekken veel thermische, habitat-, wind- en ontbrekende-data-scenario's, maar blijven synthetische tests en bewijzen geen praktijknauwkeurigheid. De lokale IndexedDB is niet vanuit de repository-audit uitleesbaar; de nieuwe persoonlijke meetreeks start conform clean-startafspraak opnieuw. De eerste factor-/datadekking en vervolgacties staan in `FASE2_PROGNOSE_AUDIT.md` §6.


### Fase 2 — eerste literatuurverkenning (16 november 2026)

De eerste soortgerichte literatuurverkenning is toegevoegd aan `FASE2_PROGNOSE_AUDIT.md` §7. Er zijn relevante studies gevonden over karpervoeding en temperatuur, zeelt- en meervalritmes, baars- en blankvoornactiviteit/habitat, brasem in winter en wetland, en snoek/snoekbaars/roofblei-beweging en habitatgebruik. De uitkomsten zijn niet onderling uitwisselbaar: telemetriebeweging, locomotorische activiteit, voedselopname, groei en vangbaarheid zijn verschillende responsvariabelen. De bestaande soortprofielgetallen zijn daarom nog niet gevalideerd door deze bronnen.

De belangrijkste ontwerpconsequentie is dat tijdvakvoorkeuren en seizoensprioren hypotheses blijven totdat ze soort-, levensfase- en watertype-specifiek zijn getoetst. Het generieke profiel `Overig` mag geen soortspecifieke precisie suggereren. Fase 2 blijft audit; geen modelwaarden gewijzigd.


### Parameterinventaris soortprofielen — 16 november 2026

De bestaande thermische profielwaarden voor negen soorten plus de generieke fallback `Overig` zijn geïnventariseerd in `FASE2_PROGNOSE_AUDIT.md` §8. De huidige optimum-/breedtewaarden en tijdvakvoorkeuren zijn voorlopige modelaannames; de gevonden literatuur bevestigt niet automatisch de exacte getallen. Ook wind-, druk-, regen-, bewolkings- en seizoensvelden zijn heuristisch en dragen momenteel niet numeriek bij aan de activiteitsindex. Geen profielwaarden gewijzigd.


De besproken karpervoorbeeldverdeling (30/17/15/12/8/8/10 procent over de zeven factorfamilies) is alleen illustratief en wordt niet als modelgewicht geïmplementeerd. Zie `FASE2_PROGNOSE_AUDIT.md` §5.2.


### Fase 2 — habitat-/wind-/positioneringsaudit (16 november 2026)

De bestaande bankWindEngine, habitatMovementEngine en rodPositioningEngine zijn afzonderlijk gevolgd. BankWind berekent oever-/windgeometrie; habitatMovement geeft kwalitatieve primaire/alternatieve zones en bewegingshypothesen; rodPositioning geeft tactische zoek-/hengeladviezen en is expliciet onafhankelijk van activiteitsindex en Poisson-vangkans. De habitat-confidence is heuristisch en geen gekalibreerde aanwezigheidkans. Deze modules zijn bruikbare bestaande bouwstenen, maar mogen niet als numerieke kansvoorspelling worden gepresenteerd. Details en resterende databeperkingen staan in FASE2_PROGNOSE_AUDIT.md §9. Fase 2 blijft audit.


### Fase 2 — watertemperatuur meettijd-provenance (16 november 2026)

De hercontrole vond dat waterTemperatureMeasuredAt wel in het sessietype bestaat, maar dat waterTemperatureHistory.ts en waterThermalEngine.ts sessie.waterTemperature nog op session.startTime dateren. Een gekoppelde snapshot kan dezelfde fysieke meting op het echte meettijdstip bewaren; omdat deduplicatie exact op locatie/tijd/temperatuur werkt, kan deze meting dubbel meetellen. Dit kan meetouderdom, thermische extrapolatie en historische profielen vertekenen. Zie FASE2_PROGNOSE_AUDIT.md §10. Geen code gewijzigd; eerst fallback- en deduplicatiebeleid vastleggen, daarna gerichte regressiefix.


De SessionModal biedt meetdatum/-tijd voor watertemperatuur als optioneel handmatig veld en vult dit niet automatisch. Ontbrekende meettijdstippen zijn daardoor een normale mogelijke invoerstatus. De fallback moet expliciet en onzekerheidsbewust worden ontworpen; session.startTime mag niet stilzwijgend als exact meetmoment gelden. Zie FASE2_PROGNOSE_AUDIT.md §10.


## Fase 2 — canonieke biologische bronnen en documentatieafspraak (16 november 2026)

De validatie op `main` bevestigt dat de bestaande soortprofielen al aanwezig zijn en worden hergebruikt. **`src/services/fishProfiles.ts` is de enige operationele bron van waarheid** voor de negen concrete soorten plus de generieke fallback `Overig`, inclusief thermische parameters, tijdvakvelden en overige voorlopige profielvoorkeuren. Er wordt geen tweede soortprofielbestand of parallelle parametercatalogus aangemaakt.

Het bestaande **`src/services/researchRegistry.ts`** is het centrale wetenschappelijke kennisregister. Het registreert onderwerp, relevante soorten, toepassingsgebied, bewijssterkte, samenvatting, beperkingen, bronverwijzingen, beoordelingsdatum en expliciete goedkeuring voor voorspellingsgebruik. Een bronregistratie betekent niet automatisch dat een factor numeriek in het model mag worden gebruikt. De bestaande `test-research-registry.ts` controleert onder meer de registerfuncties, soortgerichte bewijsopvraging en bronkoppelingen naar bestaande soortprofielen.

De `scientificReferences` in `fishProfiles.ts` blijven profielgebonden verwijzingen voor traceerbaarheid; de inhoudelijke bewijsbeoordeling blijft in `researchRegistry.ts`. Auditdocumenten mogen waarden en bewijsstatus analyseren, maar zijn geen runtimebron. De parameterwaardentabel uit audit §8 is daarom vervangen door een verwijzing naar de canonieke codebron, zodat waarden niet op twee plekken hoeven te worden bijgehouden.

**Gevalideerde bronbestanden:**
- `src/services/fishProfiles.ts` — operationele soortprofielen.
- `src/services/researchRegistry.ts` — centraal wetenschappelijk register.
- `test-research-registry.ts` — bestaande regressiechecks voor register en bronkoppelingen.
- `MODELARCHITECTUUR_FASE2.md` — modelkeuze en verantwoordelijkheden.
- `FASE2_PROGNOSE_AUDIT.md` §8 — profielbetekenis, voorlopige status en bewijsbeperkingen zonder gekopieerde parameterwaarden.

Deze wijziging is documentatie-only. Geen profielwaarden, bronnen, modeluitkomsten, gebruikersgegevens of app-code zijn gewijzigd.


## Fase 2 — watertemperatuur meettijd/provenance-fix (16 november 2026)

De historische temperatuurketen gebruikt voortaan uitsluitend het expliciete sessieveld `waterTemperatureMeasuredAt`; `session.startTime` wordt niet langer als vervangend meetmoment gebruikt. Sessie- en snapshotwaarnemingen worden alleen toegelaten wanneer het meettijdstip parsebaar is en zowel herkomst als meetmethode bekend zijn. Oudere records zonder die metadata blijven behouden, maar leveren geen thermisch anker of historische profielwaarneming totdat ze correct zijn aangevuld. Dit volgt de bestaande UI-uitleg en het typecontract.

Deduplicatie van historische sessie-/snapshotmetingen vergelijkt het absolute tijdstip, zodat equivalente ISO-notaties met verschillende tijdzone-offsets niet dubbel tellen. Regressietests dekken de expliciete meettijd, ontbrekende meettijd, onbekende bron/methode, benchmarkuitsluiting en dubbele snapshot-/sessiewaarneming. De code- en testwijzigingen zijn vastgelegd met `[skip ci]`; tests/build zijn niet als uitgevoerd of geslaagd geregistreerd. Fase 2 blijft open.


## Fase 2 — soortgerichte bewijsregistratie uitgebreid (16 november 2026)

De bestaande `src/services/researchRegistry.ts` is uitgebreid met gecontroleerde, soortgerichte literatuurregistraties zodat alle negen concrete profielsoorten minimaal één expliciete biologische bronregistratie hebben. De aanvullingen omvatten karperfoerageren, brasemwinteractiviteit en wetlandbeweging, snoek-/snoekbaarsbeweging, baarsactiviteit en habitat, blankvoorn-dieet-/habitatverschuivingen, zeeltvoedingsritme, meervalvoedingsritme/individuele variatie en roofbleimigratie.

Alle aanvullingen blijven `approvedForPrediction: false`. Dit verbetert brontraceerbaarheid, maar valideert geen bestaande thermische optimum-/breedteparameters en activeert geen numerieke factoren. `test-research-registry.ts` controleert nu ook dat alle negen concrete soorten een soortgekoppelde registratie hebben en dat de generieke fallback `Overig` niet als soort wordt geregistreerd.

De auditbron voor snoek/snoekbaars is gecorrigeerd: DOI `10.1007/s10750-024-05533-2` hoort bij Nolan et al. (online 2024; jaargang 2025), niet bij Cittadino et al. (2024). Geen app-modeluitvoer of profielparameters zijn gewijzigd. Tests/build zijn niet uitgevoerd; de commit gebruikt `[skip ci]`.


## Fase 2 — evidence-matrix en runtime-koppelingsstatus (16 november 2026)

De soortgerichte literatuur is in `FASE2_PROGNOSE_AUDIT.md` §7.6 geclassificeerd naar voedselopname/foerageren, activiteit/locomotie, habitat/beweging en groeidata. De dekking is ongelijk: karper, zeelt en meerval hebben de duidelijkste directe voedings-/foerageerbronnen; baars en blankvoorn hebben dieet-/voedselkeuzegegevens; snoek, snoekbaars en roofblei zijn in de huidige inventaris vooral via telemetrie en habitat-/bewegingsstudies onderbouwd; brasem vooral via winteractiviteit en seizoens-/habitatbeweging. Deze uitkomsten zijn niet uitwisselbaar.

Repositorybrede controle van de 41 TypeScript-/TSX-bronbestanden bevestigde dat het research register nog niet als runtime-poort wordt gebruikt. Alleen `dataQualityEngine.ts` importeert momenteel het type `DataStatus`; de prognose-, profiel-, habitat- en positioneringsengines lezen de geregistreerde kennis niet. Dit is bewust nog niet gekoppeld omdat geen nieuwe numerieke factor is goedgekeurd. Vóór toekomstige factoractivatie moet de relevante registratie expliciet worden gekoppeld en moet een test afdwingen dat niet-goedgekeurde kennis geen numerieke scorebijdrage levert.

De matrix en deze runtime-status wijzigen geen modelwaarden of app-uitvoer. Fase 2 blijft open.


## Fase 2 — correctie gedeelde snoek-/snoekbaarsbron (16 november 2026)

De telemetriestudie van Nolan et al. (2025; online 2024), DOI `10.1007/s10750-024-05533-2`, onderzoekt zowel snoek als snoekbaars. De bijbehorende registervermelding is daarom aan beide soorten gekoppeld; een regressietest controleert die koppeling. De evidence-matrix §7.6 is aangescherpt zodat voedingsmetingen, locomotorische activiteit, habitat-/bewegingsdata en groeidata niet door elkaar worden gehaald. Een groeistudie blijft uitsluitend groeibewijs en wordt niet als acute activiteitscurve gebruikt.


## Fase 2 — volledige meetprovenance in prognosesnapshots (16 november 2026)

Historische watertemperatuurwaarnemingen bewaren nu naast het expliciete meettijdstip ook het oorspronkelijke record-ID en recordtype (sessie/snapshot), registratiemoment, meetbron, meetmethode en meetdiepte. De velden zijn toegevoegd aan `HistoricalWaterTemperatureObservation` en aan de historische meetrecords in `PrognosisInputContext`. De bestaande snapshotbouwers geven de verzamelde observaties rechtstreeks door, zodat de metadata onderdeel wordt van de onveranderlijke inputcontext en fingerprint.

Gerichte regressietests controleren dat sessie- en snapshotrecords hun eigen metadata behouden. Dit verandert niet welke metingen worden toegelaten en verandert geen temperatuur- of visactiviteitsscore. Tests/build zijn niet uitgevoerd; commit gebruikt `[skip ci]`.


## Fase 2 — coach-herbeoordeling gebruikt sessiemetingen als historisch anker (16 november 2026)

Een extra provenancecontrole vond dat `sessionCoachService.ts` bij iedere live herbeoordeling de watertemperatuur van de actieve sessie opnieuw als actuele gebruikersmeting doorgaf. Daardoor kon een meting van de sessiestart uren later nog als actueel worden gepresenteerd. Dit is gecorrigeerd: de coach geeft geen sessiewaarde meer door als actuele invoer; de thermische engine gebruikt de sessie via de expliciete meettijd, bron en methode als historisch anker en berekent de latere temperatuur met de beschikbare weersontwikkeling.

De integratietest bevat nu een sessiemeting van een uur eerder en controleert dat de herbeoordelingssnapshot deze als `estimated_from_measurement` met de juiste meettijd en provenance bewaart. Test/build zijn niet uitgevoerd; commit gebruikt `[skip ci]`.


## Fase 2 — resterende snapshot-reproduceerbaarheidspunten (16 november 2026)

De vier prognose-/coach-inputcontext-bouwers gebruiken nu dezelfde historische watertemperatuurcollector en bewaren de provenance van historische metingen. Een aanvullende audit heeft twee resterende beperkingen vastgesteld: (1) de actuele handmatige watertemperatuur staat niet in alle builders als afzonderlijk veld in `PrognosisInputContext` en wordt door `PrognosisView` niet in de inputfingerprint opgenomen; (2) historische sessies, vangsten en waarnemingen worden in de context vooral via record-ID's en een fingerprint gerepresenteerd, niet via compacte featurewaarden. Daardoor is volledige replay na wijziging/verwijdering van bronrecords niet gegarandeerd.

Vóór modelkalibratie wordt een compacte, privacybewuste inputfeature-snapshot ontworpen. Deze bewaart alleen de variabelen die de prognose daadwerkelijk gebruikt, niet de volledige sessie-/vangstrecords. Fase 2 blijft open.


## Fase 2 — auditstatus watertemperatuurprovenance geconsolideerd (16 november 2026)

De oude audittekst die de oorspronkelijke `session.startTime`-fout beschreef, is vervangen door een actuele status. De implementatie gebruikt nu expliciete meettijdstippen en bekende bron/methode, bewaart de provenance van historische sessie-/snapshotrecords en voorkomt dat live coach-herbeoordeling een oude sessiemeting als actueel behandelt.

Open punten zijn: geen gedeelde fysieke measurement-ID (deduplicatie gebruikt locatie + absoluut meetmoment + temperatuur), handmatige actuele temperatuurinvoer is nog niet overal gestructureerd in inputcontext/fingerprint, en historische sessie-/vangst-/waarnemingsfeatures worden niet volledig als compacte replaybare waarden bewaard. Regressietests zijn toegevoegd maar nog niet uitgevoerd.

## GitHub-werkwijze — CI en commitberichten (afspraak gebruiker, 16 november 2026)

De commitconventie is afhankelijk van de zichtbaarheid van de repository en de beschikbare CI-credits:

- **Repository staat op public:** voeg `[skip ci]` niet standaard toe. CI mag normaal draaien.
- **Repository staat op private én de beschikbare CI-credits zijn op:** voeg `[skip ci]` toe om onnodige workflowruns te voorkomen.
- **Repository staat op private maar er zijn nog CI-credits:** `[skip ci]` is niet automatisch vereist; kies bewust op basis van de gewenste validatie en het resterende budget.

Controleer de actuele repositoryzichtbaarheid en credit-situatie voordat je de commitmessage kiest. Deze afspraak geldt voor toekomstige commits; bestaande commitberichten worden niet herschreven. Bundel samenhangende repositorywijzigingen steeds in één enkele commit.


### Fase 2 — handmatige watertemperatuur als reproduceerbare invoer (16 november 2026)

`PrognosisInputContext` bevat nu een afzonderlijk `manualWaterTemperatureInput`-object voor de actuele handmatige invoer. Het bewaart de temperatuur en het registratiemoment van de prognoserun; een onbekend fysiek meettijdstip, meetmethode of meetdiepte blijft expliciet onbekend en wordt niet afgeleid uit het registratiemoment. De prognoseweergave en live sessiestart gebruiken dit contract. De VisCoach-planbuilder en coach-herbeoordeling markeren het veld expliciet als niet van toepassing omdat zij geen actuele handmatige meting ontvangen; bij coach-herbeoordeling loopt de sessiemeting via de historische meetprovenance. De volledige context valt mee in de inputfingerprint. Regressiechecks zijn toegevoegd aan `test-thermal-and-prognosis.ts`, dat in de Quality Gate draait. De actuele Quality Gate-uitkomst voor de daaropvolgende replaybare-history-uitbreiding moet nog worden gecontroleerd.

Aanvullende correctie op 16 november 2026: de thermische engine markeert een sessiemeting niet langer als actuele meting alleen omdat deze minder dan zes uur oud is. Bij VisCoach-herbeoordeling blijft zo'n sessiemeting een historisch anker met het expliciete meettijdstip; de latere temperatuur wordt als `estimated_from_measurement` gepresenteerd. Alleen een afzonderlijk ingevoerde meting voor de huidige prognoserun geldt als actuele meting. De integratietest dekt dit scenario af. De volledige Quality Gate op de uiteindelijke fixbranch is groen, inclusief productiebuild en backup-/restore-regressies.


## Fase 2 — compacte replaybare historie in prognosesnapshots (16 november 2026)

De vier snapshotbouwers (PrognosisView, live sessiestart, VisCoach-planning en VisCoach-herbeoordeling) gebruiken nu dezelfde helper voor whitelisted historische features. `PrognosisInputContext` kan schema-versie 1 bevatten met:
- historische sessiekenmerken die modeluitvoer beïnvloeden, waaronder tijd/duur, doelsoorten/uitkomst, techniek, aasrichting, voorvoerstatus en meetprovenance;
- historische vangstkenmerken zoals sessiekoppeling, soort, aantal, tijdstip, gewicht/lengte, aas/techniek en importkwaliteitsvlaggen;
- historische waarnemingen met locatie-/sessiekoppeling, type en tijdstip;
- de exacte lokale watertemperatuurkalibratie die voor de run is gebruikt.

De featurelijsten zijn deterministisch op record-ID gesorteerd. Benchmarkrecords en bijbehorende vangsten/waarnemingen worden uitgesloten. De historie-fingerprint wordt uit dezelfde whitelist opgebouwd. Vrije notities, foto's en base64-inhoud worden niet in prognosesnapshots gekopieerd. De modelinput bevat daarnaast de bestaande handmatige temperatuurprovenance, historische temperatuurmetingen, locatiecontext, exacte weersinvoer en model-/engineversies.

Regressies controleren dat modelrelevante sessiewijzigingen (zoals aasrichting/voorvoerstatus) de fingerprint wijzigen en dat vrije notities/foto-inhoud buiten de feature-snapshot blijven. De VisCoach-integratietest controleert dat de werkelijk opgeslagen snapshot de whitelisted sessiekenmerken bevat.

**Beperking:** de gebruikte historische data-input is nu veel beter te reproduceren, maar de uitvoerbare modelcode zelf wordt niet gearchiveerd. Bij betekenisvolle wijzigingen aan logica of soortparameters moeten `modelVersion`/`engineVersions` worden verhoogd. De volledige Quality Gate voor deze featurebranch is groen: [run #43930702270](https://github.com/sennzor-wq/Vislogboek/actions/runs/43930702270), inclusief typecheck, regressietests, backup/restore en productiebuild.

## Fase 2 — uitbreiding soortspecifiek voedingsbewijs (16 november 2026)

Het centrale researchregister en de evidence matrix zijn uitgebreid met directe voedings-/dieetbronnen voor de negen concrete soorten:
- Karper: daggebonden graasgedrag en invloed van voedselaanbod in gesimuleerde vijvercondities.
- Brasem en Voorn: in-situ dagritme van zoöplanktonconsumptie; voor Voorn ook een herfstverschuiving van dag naar schemer/nacht.
- Snoek: veld-maaginhoud en seizoensdieet; seizoens- en temperatuurrelaties waren niet statistisch significant.
- Baars: veldmetingen van dagritme en seizoens-/lengteafhankelijke prooikeuze.
- Zeelt: directe veldmetingen van voedingsintensiteit met avond- en nachtelijke pieken in één klein eutroof water.
- Snoekbaars: gecontroleerde winter-/voorjaarsvoedingsrespons op temperatuur en levensfasegebonden dieetbewijs uit twee reservoirs.
- Meerval: directe veld-maaginhoud, seizoensvariatie en lengte-/leeftijdsafhankelijke prooikeuze.
- Roofblei: maaginhoud/stabiele isotopen tonen een levensfasegebonden verschuiving naar piscivorie.

Alle nieuwe registraties blijven `approvedForPrediction: false`. De bronopzetten verschillen sterk (veld, tank/kweek, maaginhoud, dieet of prooikeuze), en geografische overdraagbaarheid en levensfase zijn belangrijke beperkingen. De bijbehorende bronnen zijn ook gekoppeld aan de canonieke soortprofielen in `fishProfiles.ts`; er zijn geen numerieke profielparameters aangepast. De matrix maakt expliciet dat dieet geen dagritme bewijst, telemetrie geen voedselopname bewijst en groei geen acute voedingsactiviteit bewijst.

**Volgende stap:** een kwalitatieve, soortspecifieke voedingscontext ontwerpen met bronverwijzingen, meettype en onzekerheid. Geen numerieke factor, tijdvakbonus of temperatuurvermenigvuldiger activeren zonder voldoende direct en overdraagbaar bewijs plus lokale validatie.

### Fase 2 — checkpoint na PR #54 (16 november 2026)

- PR [#54](https://github.com/sennzor-wq/Vislogboek/pull/54) is squash-merged naar `main` als [16c2ebd](https://github.com/sennzor-wq/Vislogboek/commit/16c2ebd63f18a9913fa7234c2774c24ddada4d8a).
- Het researchregister en `fishProfiles.ts` bevatten soortspecifieke voedings-/dieetbronnen voor alle negen concrete soorten. Alle nieuwe bronnen blijven `approvedForPrediction: false`; geen runtime-score of numerieke profielparameter is aangepast.
- Quality Gate op PR-head [#43932012809](https://github.com/sennzor-wq/Vislogboek/actions/runs/43932012809) is volledig groen. Overlappende run #43931990396 is geannuleerd. Mergecommit-run [#43933698267](https://github.com/sennzor-wq/Vislogboek/actions/runs/43933698267) stond bij dit checkpoint nog queued en moet eerst groen worden bevestigd.
- Volgende actie: ontwerp een aparte kwalitatieve voedings-/foerageeruitkomst die uitsluitend brononderbouwde uitspraken gebruikt. Dieet/prooikeuze mag niet worden vertaald naar een tijdvakpiek of voedingsintensiteit als de studie dat niet heeft gemeten. Onbekende levensfase, lokaal prooiaanbod en overdraagbaarheid blijven expliciet onzeker.
- Daarna: evidence-gating- en laagseparatietests, UI-integratie en chronologische evaluatie. Fase 2 blijft open; fase 3 start pas na aantoonbare fase-2-acceptatie.


## Fase 2 — gemeten biologische uitkomsten geclassificeerd (16 november 2026)

PR [#55](https://github.com/sennzor-wq/Vislogboek/pull/55) is squash-merged als [f6c959c](https://github.com/sennzor-wq/Vislogboek/commit/f6c959c109fb096c75a6028cfa77cf89efa81574). Het researchregister heeft nu expliciete `ResearchOutcome`-labels en `getResearchByOutcome(species, outcome)`, zodat bronnen worden gefilterd op de respons die daadwerkelijk is gemeten (voedselopname, voedingsritme, foerageren, dieet/prooikeuze, locomotie, habitat, groei of voedingsfysiologie).

De Quality Gate op de PR-head [#43934137768](https://github.com/sennzor-wq/Vislogboek/actions/runs/43934137768) is volledig groen. De mergecommit-Quality-Gate moet nog worden gecontroleerd. De classificatie activeert geen modelinvloed: alle bronnen blijven `approvedForPrediction: false`, en prognose-runtime/UI/scores zijn niet gewijzigd.

**Volgende actie:** bouw een per-soort evidence-gated kwalitatieve voedingscontext. Directe voedingsintensiteit/-ritme, foraginggedrag, dieet/prooikeuze en telemetrie/habitat moeten afzonderlijke claims blijven. Alleen de responsvariabele die een bron werkelijk meet mag worden getoond; geen numerieke bonus of tijdvakscore. Voeg daarna UI- en regressietests toe.


### Fase 2 — per-soort voedingsbewijs vertaald naar toepassingsgrenzen (16 november 2026)

De per-soort toepasbaarheidsmatrix staat in [FASE2_PROGNOSE_AUDIT.md §13](FASE2_PROGNOSE_AUDIT.md). Kernbesluit: alleen bronnen met expliciet gemeten voedselopname/-ritme mogen zulke kwalitatieve claims dragen; foraginggedrag blijft een aparte claim; dieet/prooikeuze is uitsluitend dieetcontext; telemetrie/habitat en groei zijn geen voedingsproxy. Roofblei heeft momenteel geen directe dagelijkse voedingsintensiteitsbron; Overig heeft geen soortspecifieke dekking. Alle bronnen blijven `approvedForPrediction: false` en mogen geen numerieke score of tijdvakrangschikking beïnvloeden.

**Volgende actie:** pure, geteste service bouwen die per soort alleen de brongebonden kwalitatieve claims teruggeeft die de `ResearchOutcome`-classificatie ondersteunt. Daarna pas een beperkte UI-presentatie als biologische onderzoekscontext, zonder effect op activiteitsindex of persoonlijke vangstkans.


### Fase 2 — pure kwalitatieve voedingsbewijsservice (16 november 2026)

PR [#56](https://github.com/sennzor-wq/Vislogboek/pull/56) is gemerged als [d10e33e](https://github.com/sennzor-wq/Vislogboek/commit/d10e33e4005ab782e1fdbb80aa5457e546ed6f42). `feedingEvidenceService.ts` bundelt per soort direct gemeten voedselopname, voedingsritme, foraginggedrag, dieet en prooikeuze. Alleen expliciet goedgekeurde voedingsbronnen komen in de aparte `approvedFeedingEvidence`-collectie. De service is puur en verandert geen prognose, score, vangstkans of UI.

Quality Gate op de PR-head [#43934866369](https://github.com/sennzor-wq/Vislogboek/actions/runs/43934866369) is volledig groen. De Quality Gate op de mergecommit moet nog worden bevestigd.

**Volgende actie:** review het outputcontract en de veilige UI-presentatie als brongebonden onderzoekscontext (geen voedingsvoorspelling). Pas daarna beperkte UI-integratie toe, zonder numerieke factor of wijziging van de bestaande activiteitsindex/vangkans.


### Fase 2 — voedingsliteratuur zichtbaar in prognose (16 november 2026)

De prognoseweergave heeft nu een aparte sectie voor soortspecifieke voedingsliteratuur, met drie gescheiden groepen: gemeten voedselopname/-ritme, foerageergedrag en dieet/prooikeuze. Elke bron toont bij uitklappen de geregistreerde bevinding, beperkingen, referenties en bewijsstatus. De sectie is nadrukkelijk achtergrondinformatie en geen actuele voedingsvoorspelling voor de stek of datum. Voor 'Algemeen' wordt geen soortspecifiek bewijs gesuggereerd.

De UI leest alleen de pure `feedingEvidenceService`; er is geen koppeling naar de prognoseberekening. Activiteitsindex, beste vistijd, persoonlijke vangstkans en sessiesnapshots blijven ongewijzigd. PR-controle op typecheck, regressies en productiebuild is vereist vóór merge.

**Volgende stap:** na groene CI mergen en de mergecommit controleren. Daarna onderzoeken hoe lokale gebruikerswaarnemingen van daadwerkelijke foerageeractiviteit apart kunnen worden vastgelegd en chronologisch gevalideerd; geen automatische voedingsbonus.


### Fase 2 — audit lokale foerageerwaarnemingen (16 november 2026)

Belangrijke databeperking gevonden: huidige sessiewaarnemingen zijn een sessiesamenvatting. `syncSessionPresenceObservations()` gebruikt `session.updatedAt` als `timestamp` bij nieuwe records; dat is niet bewezen het werkelijke moment van waarnemen. Per sessie kan bovendien maar één record per type bestaan en soortidentificatie ontbreekt. Deze records zijn dus geen betrouwbare tijdvaklabels voor voedingskalibratie. De huidige prognose gebruikt ze uitsluitend als kwalitatieve context zonder numerieke bonus.

**Productbesluit:** geen aparte uitgebreide foerageerregistratie in de huidige roadmap. De gebruiker moet tijdens het vissen zo min mogelijk extra handelingen hoeven te verrichten. Bestaande waarnemingen blijven globale context en worden niet gebruikt als tijdgebonden trainingslabels. Een eventuele toekomstige uitbreiding moet optioneel, snel en aantoonbaar gebruiksvriendelijk zijn én voldoende meerwaarde voor de prognose opleveren. Geen nieuwe invoervelden, databasemigratie of modelinvloed zolang die afweging niet positief uitvalt.


### Fase 2 — thermische parameter-audit (16 november 2026)

De thermische curve is de enige numerieke factor in de huidige activiteitsindex. De asymmetrische Gaussische vorm, soortoptima, breedteparameters, efficiëntievloer en score-exponent zijn nog niet gefit of gevalideerd met representatieve velddata. De algemene literatuurverwijzingen ondersteunen het temperatuureffect, maar niet automatisch de exacte numerieke waarden per soort/levensfase/watertype. Profielgrenzen zijn voorlopig; ze mogen niet worden geïnterpreteerd als bewezen winterrust- of zuurstofstressgrenzen.

De beschrijvingen bij extreme temperaturen zijn daarom aangescherpt: alleen relatieve thermische modelrespons, geen stellige uitspraak over winterrust, foerageerstop of zuurstofstress zonder passende metingen. De scoreberekening zelf is ongewijzigd.

Ook vastgesteld: één thermische analyse per doeldag wordt gedeeld door alle tijdvakken. Omdat tijdstip-/schemeringsvoorkeuren momenteel geen scorebijdrage hebben, kan de thermische laag geen beste tijdvak onderscheiden. Dit blijft een expliciete modelbeperking totdat direct soortspecifiek gedragsbewijs en chronologische validatie een tijdvaklaag ondersteunen.


### Fase 2 — scope van de huidige activiteitsscore verduidelijkt (16 november 2026)

De UI noemt de bestaande 1–10-uitkomst voortaan 'thermische activiteitspotentie'. De score gebruikt alleen de voorlopige thermische soortcurve; overige weers-/seizoens-/tijdsfactoren blijven context en veranderen de score niet. Daarmee wordt voorkomen dat de gebruiker een thermische proxy verwart met totale visactiviteit of foerageergedrag. Ook lage thermische scores worden niet meer vertaald naar een stellige winterrust- of inactiviteitsclaim. De numerieke berekening en bestaande snapshotvelden zijn ongewijzigd.


### Fase 2 — thermische fysiologie als aparte evidence-uitkomst (16 november 2026)

Het researchregister onderscheidt nu `metabolic_rate` en `aerobic_scope` van voedingsintensiteit, voedingsritme, foerageren, locomotie en groei. Eerste studies zijn geregistreerd voor karper, snoek, baars, brasem, blankvoorn en snoekbaars, met expliciete beperkingen rond laboratoriumopzet, lichaamsgrootte, levensfase en overdraagbaarheid. Alle bronnen blijven niet-goedgekeurd voor numerieke modelinvloed. Er zijn geen soortparameters of scores aangepast.


### Fase 2 — thermische brondekking per soort vastgelegd (16 november 2026)

De nieuwe metabole/aerobe-scopebronnen zijn aan de canonieke soortprofielen gekoppeld en de audit bevat nu een dekkingstabel voor alle concrete soorten. De bronbasis is ongelijk: baars en snoekbaars hebben directere aerobe-scopegegevens, brasem/voorn SMR/RMR over een temperatuurreeks, terwijl karper/snoek beperkte metabole temperatuurmetingen hebben en zeelt/meerval/roofblei nog geen passende volledige curve in het register. Lichaamsgrootte en levensfase kunnen de respons veranderen. We voegen hiervoor geen verplichte gebruikersvelden toe; bestaande vangstlengtes zijn geen representatieve populatiesteekproef. Geen thermische profielparameters aangepast.


### Fase 2 — ontwerpbesluit tijdvakvoorkeur en gelijkwaardige uitkomsten (16 november 2026)

De prognose hoeft niet altijd één beste tijdvak aan te wijzen. Als omstandigheden tussen tijdvakken praktisch gelijk zijn en er geen relevante soortspecifieke gedragsfactor is die een verschil onderbouwt, toont de app de tijdvakken als gelijkwaardig. De visser kiest dan zelf wanneer hij vist; geen kunstmatige nachtvoorkeur.

Een natuurlijke voorkeur voor ochtend, schemering of nacht mag wel meewegen wanneer direct, soortspecifiek bewijs het relevante gedrag ondersteunt. Voedingsritme is bewijs voor voedingsgedrag; telemetrie/locomotie is niet automatisch bewijs voor meer voedselopname of vangstkans. De app onderscheidt duidelijke voorkeur, kleine/onzekere verschillen en geen betekenisvol verschil. Numerieke drempels en scores volgen pas na bronbeoordeling en validatie; er komt geen standaard tijdvakbonus.


### Fase 2 — gelijkwaardige tijdvakken correct gecommuniceerd (16 november 2026)

Een presentatiebug is hersteld: wanneer de tijdvakuitkomst `Geen betekenisvol onderscheid` was, meldde de samenvatting ten onrechte dat alle tijdvakken verstreken waren. De samenvatting onderscheidt nu gelijkwaardige tijdvakken van een verstreken dag en van ontbrekende thermische basisgegevens. Regressietests bewaken beide gevallen; scores en modelberekening zijn ongewijzigd.


### Fase 2 — soortspecifiek dagritmebewijs uitgebreid (16 november 2026)

Nieuwe gecontroleerde bronnen voor snoek, snoekbaars en roofblei zijn in het researchregister en de canonieke soortprofielen gekoppeld. De responsen blijven gescheiden: snoek heeft beperkte directe voedselopname-/verteringscontext en afzonderlijk bewegingsbewijs; snoekbaars heeft telemetriegegevens met vaak een bewegingspiek rond schemering en nachtelijke rustposities; roofblei vertoont in een langjarige noordelijke studie meestal hogere beweging rond dageraad/schemering, maar met duidelijke seizoens-/jaarvariatie. Geen van deze nieuwe bronnen is goedgekeurd als numerieke voorspellingsfactor. De snoekbaarsbeschrijving is genuanceerd van een universele nachtjager naar een schemeringsgerichte maar variabele soortbeschrijving. Regressietests bewaken dat locomotorisch bewijs niet als voedingsritme wordt geclassificeerd.


### Fase 2 — directe voedingsritmes voor snoek en snoekbaars toegevoegd (16 november 2026)

Het register bevat nu directe dagritmebronnen voor jonge snoek (dagactieve jacht; bifasisch ritme in planktivore fase) en snoekbaars in het Ladogameer (vroege ochtendpiek juni–augustus, tweede avondpiek in september). De beperkte levensfase-/watercontext is expliciet vastgelegd. Een afzonderlijke snoekstudie naar schemeringsgebonden habitatwisselingen blijft locomotorisch bewijs en wordt niet als voedingsritme geteld. Alle bronnen blijven niet-goedgekeurd voor numerieke modelinvloed.


### Fase 2 — dagdeelprofielen afgestemd op literatuur en onzekerheid (16 november 2026)

Kwalitatieve tijdvakvoorkeuren zijn gecorrigeerd waar ze botsten met gemeten voedingsritmes: geen algemene nachtvoorkeur voor karper, geen generieke nacht-/schemerpiek voor brasem, avond/nachtcontext voor zeelt, expliciete seizoensverschuivingen voor blankvoorn en baars, en geen verzonnen dagritme voor het algemene fallbackprofiel. De prognose-score en tijdvakrangschikking zijn ongewijzigd; regressietests bewaken de profielwaarden en de neutrale uitleg bij 'Algemeen'.


### Fase 2 — gescheiden dagritme-evidence service (16 november 2026)

Een pure `dielBehaviorEvidenceService` groepeert per soort direct voedingsritme, locomotorische activiteit en habitatgebruik als afzonderlijke bewijsstromen. Alleen soortgekoppelde bronnen worden meegenomen; goedgekeurde kennis blijft apart en alle huidige records blijven niet-goedgekeurd. De service berekent geen scores en leidt geen voedingsritme af uit telemetrie. Regressietests bewaken onder meer dat roofblei voorlopig alleen bewegingsbewijs heeft en dat `Overig` geen soortspecifiek dagritme erft.


### Fase 2 — lokale zonnecontext gekoppeld aan tijdvakken (16 november 2026)

De bestaande dagelijkse zonsopkomst-/zonsonderganggegevens uit de weerrespons worden nu per datum aan de vier kloktijdvakken gekoppeld. De UI kan daardoor laten zien in welk blok het brede overgangsvenster rond dageraad/zonsondergang valt, ongeacht seizoen. Dit is alleen kwalitatieve context; de vaste tijdvakken, scores en rangschikking zijn ongewijzigd. Ontbrekende zonnegegevens blijven onbekend. Een ±60-minutenvenster wordt niet als formele schemerdefinitie of numerieke bonus behandeld.


### Fase 2 — civiele schemering seizoensafhankelijk berekend (16 november 2026)

De voorlopige ±60-minutenband rond zonsopkomst/-ondergang is vervangen door een astronomische benadering van civiele dageraad/-schemering (zonmiddelpunt −6°), afgeleid uit lokale Open-Meteo-zonstijden en de breedtegraad van de stek. Regressietests bewaken plausibele winter-/zomerverschillen en dat de context correct in vaste klokblokken valt, inclusief een winterse schemering die in het middagblok kan vallen. Er wordt geen score of bonus toegevoegd.


### Fase 2 — literatuurinventarisatie dag-/nachtritmes uitgebreid (16 november 2026)

Het onderzoeksregister bevat nu aanvullende directe voedingsritmegegevens voor blankvoorn/brasem, blankvoorn afzonderlijk, baars en vroege juveniele meerval. Belangrijkste uitkomst: dag-/nachtgedrag blijkt contextafhankelijk; er zijn tegenstrijdige patronen tussen leeftijdsklassen, dieet en habitat. Roofblei- en snoekgegevens bevatten vooral beweging/habitat en mogen niet als directe voedingspieken worden gebruikt. Alle toevoegingen blijven niet-goedgekeurd voor scoring.


### Fase 2 — VisCoach-tijdvenster en levensfasebesluit (16 november 2026)

De adviescopy volgt nu het door de gebruiker gekozen tijdvak in plaats van automatisch het beste tijdvak van de hele dag. Bij een sessie over meerdere tijdvakken wordt geen enkele dagdeelwinnaar opgelegd. Dit is een correctie in de coachvertaling; er wordt geen biologische score aangepast.

De levensfase is vastgelegd als interne, optionele modelnuance en geen verplichte intake. Alleen betrouwbaar bekende levensfase-informatie mag later een soortspecifieke modifier activeren; ontbrekende informatie blijft onbekend en verhoogt de onzekerheid. Er is geen extra gebruikersinvoer toegevoegd.


### Fase 2 — volwassen meerval: veldtelemetrie als bewegingsbewijs (16 november 2026)

Het onderzoeksregister bevat nu Santos et al. (2025) over tien volwassen meervallen in een Portugees reservoir. De schemerpiek en hogere nachtelijke activiteit zijn gemeten via accelerometers; dieptegebruik varieert met seizoen en individu. Omdat geen directe voedselopname is gemeten, is de bron uitsluitend als locomotorische activiteit/habitatgebruik geclassificeerd. Geen voedingsritmefactor of tijdvakscore toegevoegd.


### Fase 2 — evidence-matrix dag-/nachtvoeding herzien (16 november 2026)

De literatuurinventarisatie onderscheidt nu acht soorten met directe tijdgebonden voedselopname van roofblei, waarvoor momenteel vooral dieet-/prooikeuze en beweging zijn onderbouwd. De studie naar volwassen meerval in een Portugees reservoir meet accelerometeractiviteit en dieptegebruik, geen voedselopname; deze is daarom uitsluitend als beweging/habitat geregistreerd. Alle bronnen blijven niet-goedgekeurd voor scoring. De bijgewerkte soort-/responsmatrix en overdraagbaarheidsgrenzen staan in FASE2_PROGNOSE_AUDIT.md §7 en §32.


### Fase 2 — baarsbron Ladogameer per soort geregistreerd (16 november 2026)

De studie van Fedorova & Drozzhina (1982) onderzocht zowel snoekbaars als baars. De bron is nu afzonderlijk aan baars gekoppeld en testbaar in de diel-evidence-service. De conclusie voor baars is geen vaste dagpiek: voedselopname was relatief sterker rond schemering en hing samen met prooigedrag. De registratie blijft niet-goedgekeurd voor scoring.


## Fase 2 — checkpoint 16 november 2026, PR #70 en #71

- PR [#70](https://github.com/sennzor-wq/Vislogboek/pull/70) is gemerged als `8088f194ecc1d6a08a2ba2f28d8495a8166cd6f3`: de gekozen vistijd stuurt de VisCoach-adviescopy. Bij meerdere tijdvakken wordt geen globale dagwinnaar als sessieadvies gepresenteerd. Levensfase blijft een optionele interne nuance; geen extra intakeveld.
- PR [#71](https://github.com/sennzor-wq/Vislogboek/pull/71) is gemerged als `4c95d55f513cdde175d1e108a7553a9c87d5bf8b`: volwassen meervaltelemetrie blijft uitsluitend bewegings-/dieptebewijs en de Ladogameerbron is afzonderlijk aan baars gekoppeld.
- Alle nieuw geregistreerde evidence blijft `approvedForPrediction: false`; er zijn geen scores, tijdvakgewichten of numerieke soortparameters geactiveerd.
- **Volgende stap binnen fase 2:** systematische overdraagbaarheidsmatrix per soort en bron, met gemeten respons, levensfase, seizoen, habitat/watertype, meetmethode, onderzoeksopzet en toepasbaarheid op Nederlandse binnenwateren. Daarna pas bepalen welke kwalitatieve claims in VisCoach bruikbaar zijn. Numerieke modelinvloed blijft afhankelijk van onafhankelijke, chronologisch gescheiden lokale validatie.


## Fase 2 — eerste overdraagbaarheidsmatrix dagritme per soort (16 november 2026)

De huidige literatuurregistraties zijn per soort samengebracht in `FASE2_PROGNOSE_AUDIT.md §34`. Acht van de negen concrete soorten hebben een vorm van direct tijdgebonden voedingsbewijs, maar de bronnen verschillen sterk in levensfase, seizoen, habitat, prooiaanbod en meetopzet. Voor roofblei ontbreekt directe dagdeel-resolved voedselopname. Bij snoek, baars, blankvoorn/brasem en meerval zijn levensfase-, seizoens- of habitatverschillen expliciet belangrijk.

Deze matrix is een inventarisatie van de bestaande registry, geen meta-analyse en geen formele modelgoedkeuring. Alle records blijven `approvedForPrediction: false`. Geen numerieke score, tijdvakgewicht of vangstkans is aangepast. De volgende stap is verificatie van de primaire publicaties voor de zwakst overdraagbare claims en een per-claim besluit over de veilige kwalitatieve toepassing. Geen verplichte levensfase-invoer toevoegen.


## Fase 2 — Bohl-juvenielenbron en Voorn-soortnaam (16 november 2026)

Bohl (1979; DOI 10.1007/BF00545241) is als afzonderlijke, niet-goedgekeurde registratie toegevoegd voor juveniele blankvoorn en brasem. De bron meet nachtelijke pelagische aanwezigheid en voedselopname vóór middernacht in kleine Beierse meren. Dit bewijs blijft levensfase-, habitat- en prooitypegebonden en wordt niet gebruikt om een algemene nachtvoorkeur voor volwassen vissen te claimen.

Het bestaande opslag-/typesleutelwoord `Voorn` verwijst naar `Rutilus rutilus` (blankvoorn). De zichtbare profielnaam is daarom gecorrigeerd naar 'Blankvoorn'; ruisvoorn (`Scardinius erythrophthalmus`) is een andere soort en heeft nog geen eigen profiel. Het interne type en bestaande sessiedata zijn niet gewijzigd.


## Fase 2 — primaire broncontrole baars/Bodenmeer (16 november 2026)

Bretzel et al. (2021; DOI 10.3389/fenvs.2021.670125) is in volledige tekst gecontroleerd. De 24-uurs voedingsgegevens betreffen juveniele 0+ baars in het pelagische deel van de Obersee en zijn gebaseerd op de herfstcampagne van 2018. De waargenomen dageraad-/schemerpieken en nachtelijke afname mogen niet als adult- of universeel baarsritme worden gebruikt. Maaginhoud blijft een proxy voor recente voedselopname, geen vangstkans. De registratie is op deze scope aangescherpt en blijft `approvedForPrediction: false`.


## Fase 2 — zeeltveldbron nader geverifieerd (16 november 2026)

Bezmaternykh & Shcherbina (2018; DOI 10.1134/S003294521804001X) is volledig gecontroleerd: 90 zeelten uit één circa 1,9-ha eutroof water in Perm krai, 66 met voedsel in het spijsverteringskanaal, bemonsterd ongeveer iedere drie uur tijdens de vegetatieperiode 2013. De tijdgebonden bevindingen blijven leeftijds-/habitatgebonden en zijn geen vangstkans. Een verschil tussen vertaalde samenvattingen over de laagste maandindex is vastgelegd; die claim wordt niet gebruikt. Geen score- of gewichtsaanpassing.


## Fase 2 — VisCoach biologische context en sessietijd-consistentie (16 november 2026)

De volgende codewijziging voegt een korte brongebonden biologische context toe aan VisCoach: directe dagritme-/voedingsmetingen worden gescheiden van beweging, habitat en dieet. Onbekende levensfase en lokale voedselcontext blijven onzeker; geen extra invoerveld en geen scorebonus. Opgeslagen start-/herbeoordelingsadviezen moeten het werkelijke sessietijdvak volgen; bij meerdere tijdvakken geen globale dagwinnaar.


## Fase 2 — karpervoedingsritme 2012: scope en verificatiestatus (16 november 2026)

Chen et al. (2012; DOI 10.1016/S1006-8104(12)60039-7) is op abstractniveau opnieuw gecontroleerd. Het gaat om `Cyprinus carpio haematopterus`, met volwassen (630–850 g) en jonge (61–91 g) vissen, experimenteel onderzocht bij 4–34 °C. De abstract meldt ochtend- en avondpieken en een temperatuurafhankelijke verbreding van het avondinterval onder 10 °C. Dit is geen veldbewijs voor wilde Nederlandse karpers of hengelvangbaarheid. Volledige methodedetails blijven open; de bron blijft `approvedForPrediction: false`.


### Fase 2 — primaire broncontrole roofblei en meerval (16 november 2026)

- Kärgenberg et al. (2022; DOI 10.1007/s10641-022-01298-6) is in volledige beschikbare tekst gecontroleerd. De studie volgt volwassen roofblei in het Estse Emajõgi-meer-riviersysteem; 54 vissen getagd, 53 met 12.435 bewegingsgebeurtenissen geanalyseerd. Dageraad-/schemerpatronen verschillen per maand en jaar; de gemeten respons is verplaatsing, niet voedselopname. De bron blijft uitsluitend locomotorisch/habitatbewijs.
- Boujard (1995; DOI 10.1016/0031-9384(95)00109-V) is als directe maar gecontroleerde voedingsritmebron voor meerval geregistreerd. Nachtelijke voedselopname in een zelfvoeropstelling, met duidelijke invloed van individuele versus groepshuisvesting. De abstract stelt levensfase en volledige omgevingsopzet niet vast.
- Santos et al. (2025; DOI 10.1111/eff.12817) is als afzonderlijke volwassen veldtelemetriebron geregistreerd (tien volwassen vissen, accelerometeractiviteit en diepte). Slavík & Horký (2012) is eveneens uitsluitend als EMG-bewegingsbewijs geclassificeerd.
- De matrix en VisCoach-context houden volwassen meervaltelemetrie (beweging/diepte/EMG), gecontroleerde voedselopname (levensfase onbekend) en vroege juveniele veldvoeding (pelagisch) gescheiden.
- Alle bronnen blijven approvedForPrediction false; er zijn geen biologische scores, tijdvakgewichten of vangstkansen gewijzigd.
- Resterend bronrisico: Chen et al. (2012) karper is nog alleen op abstractniveau geverifieerd; volledige methodedetails blijven open.


### Fase 2 — blankvoorn/brasem bronresponsen aangescherpt (16 november 2026)

- Haertel & Eckmann (2002) is in de toegankelijke Wiley-abstract gecontroleerd: direct dieet-/voedingsintensiteitsbewijs en dag-nacht habitatverschuiving in een klein 12-ha mesotroof meer. De studie toont niet dat totale voedselopname universeel hoger is in de nacht.
- Jacobsen et al. (2004) is afzonderlijk als radio-telemetrische beweging/habitatbron geclassificeerd (12–25 cm vissen, twee ondiepe meren, meerdere 48-uurs meetperioden). Dageraad-/schemerbeweging en helderheidsafhankelijke habitatverdeling zijn geen directe voedingsmetingen.
- Jamet et al. (1990) metadata/abstract gecontroleerd: 253 blankvoorns, 98–240 mm, vieruursintervallen op 20–21 juli 1988; 2–3-jarige vissen vooral middag tot schemering, oudere vissen dag én nacht. Leeftijd en dieet zijn essentieel voor overdracht.
- Vašek & Kubečka (2004) samenvatting en auteursbibliografie gecontroleerd: subadulte/volwassen brasem en blankvoorn, planktonisch dieet, dagvoeding en nachtelijke daling maagvulling; lengteklasse en maand beïnvloeden de bevinding.
- Registry en tests scheiden feeding intensity/rhythm van locomotor activity/habitat use. Alle bronnen blijven approvedForPrediction false; geen score, tijdvakgewicht of vangstkans gewijzigd.
- Open bronrisico blijft Chen et al. (2012): volledige methode niet toegankelijk via de gevonden ScienceDirect-weergave/PDF; alleen abstractniveau blijft geverifieerd.


### Fase 2 — formele Definition of Done vastgelegd (16 november 2026)

- FASE2_PROGNOSE_AUDIT.md §43 bevat nu de formele acceptatiecriteria: gescheiden responslagen, bronkwaliteit/overdraagbaarheid, waterdata-provenance, tijdvaklogica, lokale leerketen, minimale gebruikersinvoer en technische borging.
- Huidige status is expliciet: responslagen, provenance, VisCoach-selectie en evaluatieketen zijn technisch geborgd; primaire bron-/overdraagbaarheidsaudit loopt nog; lokale statistische kalibratie wacht op nieuwe sessies na clean start.
- Geen onbewezen score, tijdvakbonus of vangstkans wordt geactiveerd om de fase kunstmatig af te ronden.
- Fase 3 blijft geblokkeerd tot de implementatie-/evidence-criteria formeel zijn afgevinkt. Lokale kalibratieclaims blijven afhankelijk van voldoende nieuwe, vergelijkbare sessies.


### Fase 2 — broncontrole dagritme brasem, blankvoorn, snoek en snoekbaars (17 november 2026)

- Vašek & Kubečka (2004) is gecontroleerd via de beschikbare auteurs-/bibliografische informatie en samenvatting: daggebonden zoöplanktonvoeding bij subadulte/volwassen brasem en blankvoorn, met lengteklasse- en maandafhankelijkheid. Volledige methodedetails zijn nog niet onafhankelijk geverifieerd.
- Haertel & Eckmann (2002) en Hautala (2008) zijn op de uitgeverssamenvattingen gecontroleerd. Dieet/habitatverschuiving en voedingsintensiteit blijven gescheiden; de herfstverschuiving van blankvoorn naar schemer/nacht is boreaal en contextafhankelijk.
- Lucas et al. (1991) volledige uitgeverssamenvatting gecontroleerd: kleine prooien bij snoek overdag gevangen; verteringsmetabolisme loopt door in middag/nacht. Geen gekwantificeerde voedingspiek per tijdvak.
- Fedorova & Drozhzina (1982) voor snoekbaars blijft secundair ontsloten en methodologisch beperkt: vroege ochtendpiek juni–augustus, tweede avondpiek september; geen vaste tijdvakregel.
- Dubbele Poulet et al. (2005)-registratie verwijderd; canonieke bron blijft uitsluitend locomotorisch bewijs.
- Regressietests borgen deze classificaties en bronbeperkingen. Alle bronnen blijven niet-goedgekeurd voor voorspelling; geen score, tijdvakgewicht of vangstkans gewijzigd.
- Volgende broncontrole: volledige methoden/steekproefdetails waar mogelijk verifiëren en de resterende soortprofielen op onjuiste extrapolatie nalopen. Fase 2 blijft open; Fase 3 start niet.


### Fase 2 — snoekbaars-telemetrie volledig op methodescope gecontroleerd (17 november 2026)

- Poulet et al. (2005) volledige beschikbare paper gecontroleerd: 13 volwassen snoekbaarzen getagd, 9 gevolgd; maart–juni tijdens paaiperiode; 24-uursessies met posities om de twee uur; gemiddelde avondschemeringspiek in beweging met individuele variatie; verplaatsingsmaat is minimale afstand.
- Horký et al. (2008) volledige paper gecontroleerd: 8 volwassen snoekbaarzen in de Elbe, 47 volledige 24-uurscycli verspreid over 12 maanden, posities per circa drie uur; beweging piekte bij dageraad/schemering; nachtelijke ondiepe positie waarschijnlijk rust, niet jacht.
- Registry, tests en architectuur/auditdocumentatie bijgewerkt. Beide studies blijven uitsluitend movement/habitat evidence en niet-goedgekeurd voor voorspelling. Geen modelscore, tijdvakgewicht of vangstkans gewijzigd.


### Fase 2 — tijdvakfactor opgeschoond op bronclassificatie (17 november 2026)

- De laatste runtime-verwijzing naar de verouderde preferredSlots- en crepuscularBonus-velden is verwijderd; de velden zijn uit de soortprofielen geschrapt.
- De verklarende tijdvaktekst gebruikt nu de geclassificeerde diel-evidence: directe voedingsmetingen blijven contextgebonden en niet-goedgekeurd, beweging/habitat wordt niet als voedingsvoorkeur gepresenteerd en ontbrekend bewijs levert geen voorkeur op.
- De tijdvakscore blijft neutraal; geen activiteitsscore, rangschikking of vangstkans aangepast.
- Regressietests toegevoegd voor karper, roofblei en de generieke fallback.
- Volgende stap: resterende soortprofielen nalopen op andere claims die niet door de actuele registry worden gedekt; daarna de volledige vijf-responsketen en chronologische evaluatie als één geheel toetsen. Fase 2 blijft open; Fase 3 start niet.


### Fase 2 — volledige responsketen en parameteraudit (17 november 2026)

- De soortprofielen zijn gecontroleerd op actieve versus uitsluitend beschrijvende velden. Alleen `thermalOptimum`, `thermalWidthCold` en `thermalWidthWarm` sturen rechtstreeks de voorlopige visfysiologische thermische curve; temperatuur-ranges beïnvloeden alleen de uitleg/classificatie. Wind, druk, seizoen, bewolking en neerslag leveren geen numerieke biologische scorebijdrage. `seasonalWeights`, `pressureSensitivity` en `optimalPressureRange` zijn niet aangesloten op de actuele numerieke prognoseketen.
- Geconstateerd dat de per-soort `disruptiveWindThresholdKmH` alleen praktische windtekst stuurt (aasaanbieding/lijncontrole), niet een biologische score. De soortafhankelijke grens is daarom een opruimpunt; geen windbonus of vangstcorrectie is geactiveerd.
- De vijf responslagen zijn opnieuw als keten gecontroleerd: (1) voorlopige thermische activiteitspotentie, (2) voedings-/foerageerliteratuur als context zonder numerieke voedingsprognose, (3) kwalitatieve habitat-/bewegingshypothesen zonder aanwezigheidskans, (4) persoonlijke historische Poisson-vangkans met beperkte thermische dagscoreschaal, en (5) afzonderlijke datakwaliteit-, steekproef- en forward-evaluatiesignalen.
- De huidige Poisson-baseline is nog niet gesegmenteerd op techniek, aas/rig of gekozen tijdvak en integreert geen numerieke voedings- of habitatkans. Het Wilson-interval betreft historische sessiesuccesfractie, niet de Poisson-kans voor de geplande sessieduur.
- De thermische daganalyse wordt gedeeld door de vier kloktijdvakken; zonder gevalideerde tijdafhankelijke respons blijven gelijke tijdvakken gelijkwaardig.
- Volgende stap: herkomstmatrix van alle actieve numerieke aannames in de waterthermische schatting én visfysiologische curve. Daarna niet-aangesloten/misleidende profielvelden opruimen en de vijf lagen afzonderlijk testen. Fase 2 blijft open; Fase 3 start niet.

### Fase 2 — thermische parameterherkomst en evidence-aware modelrichting (17 november 2026)

- Waterthermische coëfficiënten zijn geïnventariseerd: responsgewichten per diepteklasse, tijdconstanten, 24/72-uursweging, zonnestralings- en windmengingscorrecties en de onzekerheidsmarge zijn heuristische implementatiekeuzes; de KNMI-bron onderbouwt de fysische factorfamilies, niet deze exacte waarden.
- De KNMI-verificatie van circa 1 °C geldt voor het eigen operationele model voor stilstaand zoet buitenwater, niet voor de vereenvoudigde Vislogboek-engine. De review van Piccolroaz et al. (2024) en de kalibratiestudie van Feldbauer et al. (2025; vier modellen, 73 meren) onderbouwen dat modelparameters en prestaties per model/watertype verschillen en lokale validatie nodig is.
- De soortcurves zijn niet volledig brongefit. SMR/RMR, aerobe scope en voedselopname blijven afzonderlijke responsvariabelen. Baars toont grootteafhankelijk aerobe-scopeoptimum; adulte snoekbaars heeft in een gecontroleerde kweekstudie een piek bij 18,8 °C en een breed 80%-bereik, terwijl juvenielen een ander optimum hebben. De huidige snoekbaarsprofielpiek van 15 °C is daarom gemarkeerd voor herbeoordeling, niet automatisch aangepast.
- Geen numerieke parameter of score gewijzigd. Volgende stap: evidence-aware thermische modelvorm ontwerpen en lokale waterthermische parameters valideren met echte tijdgestempelde metingen. Fase 2 blijft open; Fase 3 start niet.

### Fase 2 — thermische bronstatus in de prognose (17 november 2026)

- De temperatuurfactor toont per soort of het register directe aerobe-scopegegevens, alleen metabole temperatuurmetingen of geen vergelijkbare geregistreerde temperatuurdata bevat.
- Baars en snoekbaars tonen contextgebonden, niet-goedgekeurde aerobe-scopebronnen. Karper, snoek, brasem en blankvoorn tonen alleen metabole data; zeelt, meerval, roofblei en Overig tonen expliciet de ontbrekende bronbasis.
- De factor heet nu 'Thermische activiteitspotentie'. De toelichting verandert geen score, profielcurve, tijdvak of vangstkans.
- Regressietest bewaakt bronclassificatie en non-approval. Volgende stap blijft evidence-aware curve-ontwerp; geen numerieke parameters wijzigen zonder passende responsdata en validatie.

### Fase 2 — profielopschoning zonder scorewijziging (17 november 2026)

- Niet-gevalideerde profielvelden voor optimale/tolerabele temperatuurzones, barometerbereik, seizoensgewichten, drukgevoeligheid en soortspecifieke wind-/regen-/bewolkingsvoorkeuren zijn verwijderd.
- Windcontext is soortneutraal; geen per-vissoort harde-winddrempel of voorkeursrichting meer. Seizoen, druk, regen en bewolking wijzigen de thermische score niet.
- De actieve voorlopige Gaussische thermische curve (modelpiek en curvebreedtes) blijft exact behouden. Temperatuurimpact-label wordt neutraal omdat geen gevalideerde fysiologische grens bestaat; de activiteitsscore zelf verandert niet.
- Het profielpaneel noemt de waarden nu voorlopige modelinstellingen en toont geen optimale temperatuurzone of barometerbereik. Regressietest controleert neutrale impact.

### Fase 2 — thermische scoreband bij geschatte watertemperatuur (17 november 2026)

- Bij geschatte watertemperatuur met een beschikbaar temperatuurinterval toont de temperatuurfactor nu ook een indicatieve thermische scoreband.
- De band wordt door de bestaande curve berekend op de intervalgrenzen en de modelpiek indien die binnen het interval ligt. De centrale score blijft gelijk.
- De band is nadrukkelijk geen statistisch betrouwbaarheidsinterval en omvat niet de onzekerheid van de voorlopige soortcurve. Bij gemeten watertemperatuur wordt geen geschatte band getoond.
- Regressietest controleert dat de watertemperatuuronzekerheid transparant wordt getoond; geen modelparameters of vangstkans gewijzigd.

### Fase 2 — persoonlijke vangkans zuiver empirisch gehouden (17 november 2026)

- De vaste thermische multiplier (0,88–1,12) is uit het Poisson-vangstmodel verwijderd wegens ontbrekende empirische validatie.
- Persoonlijke vangstkans en verwacht aantal vangsten worden nu uitsluitend berekend uit historisch vangsttempo per geregistreerd visuur en de geplande sessieduur.
- Thermische activiteit blijft een aparte prognoselaag; voeding en habitat worden nog niet numeriek in de persoonlijke vangstkans geïntegreerd.
- Regressietest controleert dat verschillende thermische dagscores bij dezelfde historische sessies en duur dezelfde Poisson-vangkans geven.

### Fase 2 — Poisson-steekproefbasis verduidelijkt (17 november 2026)

- De UI noemt de categorie voortaan 'Steekproefbasis' in plaats van 'Betrouwbaarheid' en toont het aantal bruikbare Poisson-sessies.
- Nieuw veld `poissonSessionCount` telt exact de sessies met bekende duur én bruikbare vangstaantallen. De categoriegrenzen worden op dit aantal toegepast.
- Wilson-interval blijft apart: historische sessiesuccesfractie, niet de onzekerheid rond de Poisson-duurkans.
- Regressietest bewaakt het verschil tussen 11 vergelijkbare sessies en 9 bruikbare Poisson-sessies.

### Fase 2 — modelonderbouwing en betrouwbaarheid gescheiden (17 november 2026)

- De UI noemt thermische bronkwaliteit nu 'Databasis watertemperatuur' en de kwalitatieve labels voor positionering/habitat 'Onderbouwing'.
- Deze labels zijn geen gekalibreerde kansen of statistische betrouwbaarheidspercentages. De Wilson-interval blijft uitsluitend voor historische sessiesuccesfractie; Poisson-vangkans toont de eigen steekproefbasis.
- Alleen presentatietekst/tooltips gewijzigd; geen prognoseberekening of modelparameter gewijzigd.

### Fase 2 — versiezuivere Brier-validatie (17 november 2026)

- Prognoseversie verhoogd naar `v2.5-personal-poisson-baseline`; prognosis-engine naar `1.1.0` na verwijdering van de thermische multiplier uit de vangkans.
- Brier-evaluatie scoort uitsluitend snapshots van de actuele modelversie. Oudere modelversies worden apart uitgesloten en gerapporteerd.
- Afgeronde uitkomsten van oudere modelversies mogen wel als historische waarnemingen in de chronologische rolling baseline dienen; hun oude voorspelde kans wordt niet gebruikt.
- Regressietest controleert uitsluiting van oude modelversies en behoud van hun geldige historische uitkomsten voor de baseline.


### Fase 2 — modelversies zichtbaar in statistieken (17 november 2026)

- De Brier-sectie toont nu het totaal aan opgeslagen snapshots, hoeveel van de actuele modelversie zijn en hoeveel oudere/afwijkende versies buiten de actuele score blijven.
- De tellingen zijn expliciet opgenomen in `EvaluationResult` en regressietests bewaken de verdeling.
- Historische snapshots blijven bewaard; alleen de actuele modelversie wordt gescoord. Geldige oude sessie-uitkomsten blijven bruikbaar voor de chronologische baseline.


### Fase 2 — primaire thermische broncontrole baars en snoekbaars (17 november 2026)

- Christensen et al. (2020) volledig gecontroleerd: 120 baars voor respirometrie (5–882 g, 15–28 °C) en afzonderlijk 37 vissen voor temperatuurkeuze (3–74 g). Aerobe-scopeoptimum is grootteafhankelijk; onder 40 g werd geen optimum gevonden binnen het onderzochte bereik.
- Frisk et al. (2012) volledig gecontroleerd: 70 volwassen kweek-snoekbaarzen, zes bruikbare temperatuurbehandelingen 13–28 °C; berekend maximum 18,8 °C maar geen significant verschil in aerobe scope tussen 13 en 25 °C; bij 28 °C slechts n=3.
- Beide bronnen blijven fysiologische capaciteit, niet directe voeding of vangstkans. `approvedForPrediction:false`; geen numerieke modelparameter gewijzigd.


### Fase 2 — Brier-blootstellingsvergelijking en soortdiagnostiek (17 november 2026)

- Primaire Brier-evaluatie vereist gelijke vooraf voorspelde en werkelijk bevistijd op minuutprecisie; mismatch en onbekende duur worden apart geteld en uitgesloten.
- Geen achteraf omrekening van de kans, geen willekeurige tolerantie en geen tijdvakbonus; de bestaande vangstkans is niet per tijdvak voorspeld.
- Soortspecifieke Brier-score, gemiddelde voorspelde kans, gerealiseerde vangstfractie en N worden naast de totaalscore gerapporteerd.
- Dit is uitsluitend evaluatie achteraf; prognoseberekeningen en biologische gewichten worden niet aangepast.


### Tijdelijke CI-uitzondering — GHSA-fc5q-39xc-vjpf (17 november 2026)

- De dependency-audit blokkeerde op de ReDoS-advisory voor transitieve dependency `picomatch@4.0.7`; upstream betwist de classificatie en er was geen bevestigde gepubliceerde patchrelease.
- Met expliciete toestemming wordt alleen `GHSA-fc5q-39xc-vjpf` tijdelijk genegeerd in beide Bun-auditstappen. Alle andere dependency-audits blijven actief.
- Dit lost de melding niet op en verklaart de dependency niet veilig. Herbeoordeel en verwijder de uitzondering zodra een gepatchte release beschikbaar is of de advisory formeel wordt ingetrokken/gewijzigd.
- PR #96 blijft geblokkeerd voor merge totdat alle Quality Gate-stappen op de exacte PR-head en daarna op de mergecommit slagen.


### Fase 2 — audit vangsttijdstippen en hengelblootstelling (18 november 2026)

- Nieuwe vangsten krijgen standaard het moment waarop het vangstformulier wordt geopend; de gebruiker kan de tijd wijzigen, maar normale records bewaren geen expliciete bron-/bevestigingsstatus. `createdAt` is afzonderlijk het opslagmoment.
- Vangsttijd wordt niet tegen de sessiegrenzen gevalideerd. Legacy-imports hebben wel een expliciete `timestampKnown`-kwaliteitsvlag.
- Hengelperioden en gebeurtenissen zijn optioneel en handmatig. Gebeurtenissen worden niet automatisch gekoppeld aan vangstrecords; actieve intervallen tellen alleen mee als ze geldig zijn en worden binnen de sessiegrenzen begrensd.
- De bestaande hengeluren zijn geregistreerde intervallen, geen geverifieerde feitelijke inspanning. Geen ontbrekende hengeluren afleiden uit sessieduur × hengelaantal.
- Brier op sessie-uitkomst en totale sessieduur blijft onafhankelijk van deze velden. Tijdvak-/voedingsvalidatie blijft geblokkeerd totdat tijdherkomst en volledigheid beter zijn geborgd.
- Geen verplichte extra gebruikersinvoer of prognose-/biologische scorewijziging toegevoegd. Volgende stap: minimaal ontwerp voor automatische tijdherkomst en regressietests voor tijdvalidatie.


### Fase 2 — tijdvakervaring op sessiestart verduidelijkt (18 november 2026)

- De bestaande persoonlijke ervaring per tijdvak groepeert hele sessies op het lokale startuur. Sessies die meerdere tijdvakken beslaan worden niet over de tijdvakken verdeeld.
- De maat is een sessiesuccesfractie, geen tijdvakgebonden vangstkans. Zij beïnvloedt de thermische tijdvakscore of `bestTimeSlot` niet.
- UI-tekst verduidelijkt naar 'sessies gestart in dit tijdvak' en benoemt indeling op starttijd.
- Regressietest toegevoegd voor een zes uur durende sessie die Avond en Nacht beslaat; geen prognoseberekening of biologische parameter gewijzigd.


### Fase 2 — automatische tijdherkomst vastgelegd (18 november 2026)

- Automatisch tijdstip bij openen van het vangstformulier blijft de standaard; gebruiker kan aanpassen zonder extra handeling of bevestigingsvraag.
- Vangsten en nieuwe hengelgebeurtenissen bewaren `timestampEntryMode`: `automatic` of `user_adjusted`. Bij ongewijzigd bewerken blijft de bestaande status staan; oude records zonder status blijven ongeclassificeerd.
- `user_adjusted` is alleen gebruikersinvoer, geen onafhankelijke verificatie.
- Historische vangstfeatures nemen de herkomst op; `historyFeatureSchemaVersion` is verhoogd naar 2. Oude snapshots blijven schema 1.
- Hengelgebeurtenissen worden niet in prognosesnapshots gekopieerd zolang ze geen modelinput zijn.
- Regressietests controleren beide statussen, behoud van onbekende historie en feature-schema v2; ook de VisCoach-integratietest verwacht nu schema v2. Geen biologische score, tijdvakbonus, vangstkans of Brier-logica gewijzigd.


### Fase 2 — hengelinzetdatakwaliteit aangescherpt (18 november 2026)

- Geen intervalregistratie betekent onbekende hengelinzet, niet nul hengeluren.
- Lege eindtijdstring wordt niet gezien als een open interval; alleen null/ontbrekend kan bij een actieve sessie open zijn.
- Onvolledige intervallen en intervallen buiten sessiegrenzen worden expliciet geteld; ongeldige sessiegrenzen maken bestaande intervallen niet valideerbaar.
- Bij gedeeltelijke registratie toont de UI alleen het bruikbare geregistreerde subtotaal met waarschuwing, niet een misleidend volledig sessietotaal.
- Regressietests uitgebreid. Geen prognose-, biologische of tijdvakscore gewijzigd; geen verplichte invoer toegevoegd.


### Fase 2 — tijdvakdatakwaliteit en ontwerpgrenzen (18 november 2026)

- Huidige persoonlijke tijdvakervaring groepeert volledige sessies op starttijd; het is geen tijdvakvangstkans.
- Hengelintervallen kunnen geregistreerde hengeluren opleveren, maar ontbreken/partiële invoer blijven onbekend of onvolledig.
- Automatische vangsttijd is het moment waarop het formulier opent; aangepaste tijd is gebruikersrapportage. Geen van beide is onafhankelijk geverifieerd.
- Hengelgebeurtenissen zijn niet gekoppeld aan vangstrecords en mogen niet dubbel worden geteld.
- Meersoortige sessies hebben geen doelsoorttoewijzing per hengel; soortspecifieke inspanningsanalyse wordt daarom voorlopig beperkt tot sessies met één doelsoort.
- Een vangst in één tijdvak rechtvaardigt geen nulvangstlabel in andere tijdvakken. Alleen expliciet bevestigde nulvangstsessies kunnen sessiebreed nul leveren, naast bekende blootstelling.
- Volgende stap: beschrijvende offline tijdvakblootstellingsdiagnose, zonder prognosefeedback of extra verplichte invoer.


### Fase 2 — tijdvakblootstelling als standalone diagnose (18 november 2026)

- Pure helper `calculateTimeSlotRodExposure()` verdeelt expliciete hengelintervallen over de vier Amsterdamse tijdvakken, met DST-correctheid.
- Overlap wordt per hengel samengevoegd; ontbrekende/ongeldige intervallen blijven onbekend en krijgen kwaliteitscounts.
- Nog niet aangesloten op prognose, VisCoach of UI; geen vangstlabel, tijdvakscore, Brier- of biologische parameterwijziging.
- Nieuwe regressiesuite toegevoegd aan Quality Gate.


### Fase 2 — tijdvak-vangstbewijs gescheiden geclassificeerd (18 november 2026)

- Nieuwe audithelper onderscheidt automatische formulier-open-tijden, aangepaste gebruikersrapportages, legacy/onbekende tijden en ongeldige/buiten-sessie tijden.
- Alleen aangepaste gebruikersrapportage kan een positief tijdvaksignaal opleveren; andere tijdvakken blijven onbekend, nooit automatisch nul.
- Alleen expliciet bevestigde nulvangstsessies zonder gekoppelde vangsten leveren nul-labels op voor tijdvakken met geregistreerde blootstelling.
- Bijvangst, meersoortige sessies en groepsvangsten worden expliciet en voorzichtig behandeld.
- Diagnostisch/offline; geen prognose- of Brier-feedback.


### Fase 2 — persoonlijke tijdvakervaring duidelijker benoemd (18 november 2026)

- UI-kop gewijzigd naar "Eigen sessie-uitkomsten bij starts in dit tijdvak".
- Percentage omschreven als sessiesucces van sessies die in het tijdvak startten, niet als tijdvakvangstkans of vangsttempo.
- Berekening, tijdvakrangschikking en biologische scores ongewijzigd; regressietest controleert expliciete sessiesucces-tekst.


### Fase 2 — dubbele voedingsbron geconsolideerd (18 november 2026)

- De Římov 2004-studie voor brasem/blankvoorn stond tweemaal in het research register; dit is één canonieke bronregistratie geworden.
- Beide soorten behouden de bron en de beperking dat juveniele veldresultaten een tegengesteld nachtpatroon tonen.
- Geen bron goedgekeurd voor voorspelling; geen numerieke voedings- of tijdvakscore gewijzigd. Regressietest toegevoegd.


### Fase 2 — extra veldbewijs dieet roofblei (18 november 2026)

- Trzebiatowski & Leszczewicz (1976) toegevoegd als beperkte veldbron voor seizoensgebonden dieetcompositie van roofblei.
- Alleen `diet_composition`; geen voedingsintensiteit, diel-rhythm of foraging score.
- Roofblei blijft zonder directe geregistreerde soortspecifieke diel-feedingbron; geen tijdvakvoorkeur of voorspelfactor geactiveerd.


### Fase 2 — wild-karpervoeding beter onderbouwd (18 november 2026)

- Bajer et al. 2010 toegevoegd: directe nachtelijke voedselopname bij vrijlevende karper in één meer, met kunstmatig maïsvoer en beperkte meetperiode.
- Hundt et al. 2022 toegevoegd: PIT-waarnemingen bij bijgevoerd meerstations, vooral schemer/nacht, met grote individuele verschillen.
- Rahman et al. 2008 toegevoegd als gecontroleerd tegenbewijs: jonge karper graasde dag en nacht zonder duidelijke piek.
- Žák 2021 toegevoegd als afzonderlijk `angler_catch_distribution`-resultaat, niet als directe voedingsmeting.
- Alle bronnen blijven `approvedForPrediction: false`; geen nachtbonus, biologische score of tijdvakgewicht geactiveerd.


### Fase 2 — aasontmoeting gescheiden van vangbaarheid (18 november 2026)

- Ghosal et al. 2018 toegevoegd als directe maar contextgebonden veldmeting van volwassen-karperconsumptie bij een maïsbaitsite.
- Monk & Arlinghaus 2017 toegevoegd als `angler_vulnerability`-bewijs: aasontmoeting/bezoek alleen verklaarde individuele vangbaarheid niet significant.
- Aanwezigheid, voedselopname en vangbaarheid blijven aparte modelstappen; beide bronnen niet goedgekeurd voor numerieke voorspelling.


### Productbesluit 18 november 2026 — standaard- en geavanceerde prognoseweergave

- De bestaande instelling voor geavanceerde prognosedetails blijft de enige schakelaar; geen tweede instelling of aparte prognose-engine.
- Standaardweergave is gericht op snel begrijpen en handelen tijdens het vissen: kernuitkomsten en compacte praktische adviezen.
- Geavanceerde weergave bevat de onderzoekssectie per vissoort (gemeten voedselopname/voedingsritme en foerageergedrag), wetenschappelijke bronnen, uitgebreide prognose-uitleg, factoren, modelaannames en onzekerheidsdetails.
- Alleen de presentatie verandert. Berekeningen, biologische scores, modelgewichten, prognosehistorie en onderzoeksgegevens veranderen niet.
- Bij ontbrekende essentiële gegevens blijft in standaardweergave een korte waarschuwing zichtbaar; technische datakwaliteit en uitgebreide onzekerheidsuitleg blijven geavanceerd.


### VisCoach — dynamische sessiecoaching geaudit (18 november 2026)

- PR #125 squash-merged als `751852d2e68bbeb518efb971aa5e8a318136c1fe`; exacte PR-head Quality Gate run #44373580579 slaagde volledig, inclusief dependency-audits, typecheck, tests en productiebuild.
- De bestaande herbeoordelingscoördinator hergebruikt forecast/prognose en actuele tijdvakcontext; sessiecontext, techniek, temperatuur, stek, vangsten en waarnemingen worden meegenomen. Forecast-kandidaten worden conservatief bevestigd; hervatten van de app geldt niet als tweede forecastbevestiging.
- Open codepunten: techniek ontbreekt in `prognosisSignature()`; een gewijzigde prognosesignature maakt nu een adviesrecord zonder eerst de daadwerkelijke advies-/tactiekuitkomst te vergelijken; de signature dekt niet alle concrete presentatie- en voeruitkomsten.
- Gewenste scheiding: snapshotwijziging is niet automatisch advieswijziging. Geen nieuw advies wanneer de praktische aanpak gelijk blijft; wel een nieuw herleidbaar advies wanneer de gebruiker daadwerkelijk iets anders kan doen.
- De PWA kan niet doorlopend verwerken wanneer volledig gesloten; bij hervatten kan zij de actuele context opnieuw beoordelen.
- Dit is audit/voorbereiding. Het centrale fase-2-biologiemodel blijft hoofdspoor; centrale fase 3 blijft geblokkeerd tot formele fase-2-acceptatie.


### Fase 2 — zuurstof, stroming, regen en bewolking beoordeeld (18 november 2026)

- Vijf bronnen toegevoegd aan `src/services/researchRegistry.ts`: karpertelemetrie tijdens een winterse zuurstofcrisis (Bauer & Schlott 2006), karperactiviteit/dieptegebruik bij stroming (Benito et al. 2015), meta-analyse van rivierstroming en visbeweging (Taylor & Cooke 2012), foodscape-review (Ouellet et al. 2025) en Europese meta-analyse van paaigerelateerde migratietriggers (Schlautmann et al. 2026).
- Zuurstof is alleen bruikbaar als gemeten waterkwaliteitscontext; de karperbronnen tonen contextafhankelijke tolerantie en ondersteunen geen universele grens.
- Stroming kan beweging, habitatgebruik en voedseltoegankelijkheid beïnvloeden, maar beweging is niet gelijk aan voedselopname of vangstkans; stromende systemen zijn niet uitwisselbaar met stilstaand water.
- Regen en bewolking zijn in de nieuwe meta-analyse zeer schaars onderzocht en de respons betreft paaigerelateerde migratie, niet dagelijkse voeding of hengelvangst.
- Alle vijf bronnen blijven `approvedForPrediction: false`; geen numerieke modelparameters of prognoseberekeningen gewijzigd.


### VisCoach — wind/doelzone-consistentie gecorrigeerd (18 november 2026)

- Read-only codecontrole vond dat oudere windregels in `rodPositioningEngine.ts`, `habitatMovementEngine.ts` en `bankWindEngine.ts` nog een aanlandige oever als primaire zoekzone konden kiezen op basis van vaste windsnelheidsgrenzen.
- Dezelfde code kon bij warme omstandigheden en weinig wind een zuurstofrijke zone suggereren zonder opgeloste-zuurstofmeting.
- PR #128 verwijdert deze automatische zonekeuze en de betreffende 11/12/15 km/u-drempels. Lokale habitat, diepteovergang en directe waarnemingen bepalen de primaire doelzone; wind ondersteunt presentatie, werphoek, lijnbocht en hengelpositie.
- Windkant blijft hooguit een tweede vergelijkingszone wanneer lokale structuur/waarnemingen dit ondersteunen. Zuurstof wordt niet uit windstilte of temperatuur afgeleid.
- Regressies controleren dat de primaire habitatzone niet door wind alleen verandert en dat wind-/werpadvies behouden blijft. Geen biologische score of vangstkans gewijzigd.


### Fase 2 — soortdekking en invoerbaarheid omgevingsfactoren (18 november 2026)

- Research registry: 64 records; 0 goedgekeurd voor directe voorspelling.
- Alle negen doelsoorten hebben geregistreerde voedings-/dieetcontext en beweging-/habitatcontext, maar de gemeten respons verschilt per bron. Dit is geen gelijkwaardige dekking van dagelijkse voedselopname of hengelvangbaarheid.
- Directe hengelvangbaarheidsregistraties zijn momenteel geconcentreerd bij karper en zeelt; voor zeven andere doelsoorten is deze uitkomst nog niet vergelijkbaar in de registry vertegenwoordigd.
- Weerservice bevat wind, regen, bewolking, luchtdruk en temperatuur, maar geen opgeloste zuurstof of lokale stromingssnelheid/afvoer.
- Zuurstof en stroming blijven daarom buiten numerieke prognose zolang betrouwbare lokale meetinvoer ontbreekt; regen en bewolking blijven context, niet dagelijkse voedings- of vangstscore.
- De volgende fase-2-actie is het sluiten van de volledige factor-/bewijs-/datadekkingsmatrix per soort en gemeten respons. Geen gewichten, drempels of tijdvakbonussen geactiveerd.


### VisCoach — latere verfijning dynamische weerswijzigingen (18 november 2026)

Niet-blokkerende verbetering voor een latere uitwerkingsronde: onderscheid tussen een meet-/forecastmoment, een functioneel relevante verandering in een factor en een daadwerkelijk gewijzigde praktische actie. Kleine wijzigingen in windkracht of -richting veroorzaken niet automatisch een nieuw coachadvies. Een prognosewijziging zonder tactiekwijziging kan intern als snapshot worden vastgelegd; een nieuw gebruikersadvies volgt alleen wanneer de bestaande tactiek-/adviesuitkomst praktisch verandert. Factorgrenzen en eventuele hysterese worden later per factor onderzocht en gevalideerd; geen willekeurige numerieke grens invoeren. Dit punt is geen must voor de huidige fase en verandert de fasevolgorde niet.


### Fase 2 — dekking uitgesplitst naar gemeten biologische respons (18 november 2026)

- De 64 research-registryrecords zijn opnieuw geteld per soort en expliciete `measuredOutcomes`; zie `FASE2_PROGNOSE_AUDIT.md` §82 en `MODELARCHITECTUUR_FASE2.md` §69.
- Belangrijke nuance: algemene dieet-, bewegings- of habitatcontext betekent niet dat directe voedingsintensiteit, voedingsritme of hengelvangbaarheid is gemeten.
- Roofblei heeft momenteel geen expliciet geregistreerd direct voedingsintensiteits-, voedingsritme- of foerageerrecord. De beschikbare telemetrie is uitsluitend beweging/habitat; de dieetstudies meten dieet/prooikeuze.
- Hengelvangbaarheid blijft beperkt geregistreerd en gescheiden van voedings- en bewegingsbewijs.
- De aantallen tellen registry-records, niet onafhankelijke studies of bewijssterkte. Alle 64 records blijven `approvedForPrediction: false`; geen score, gewicht of tijdvakbonus gewijzigd.
- Volgende actie: gerichte literatuurcontrole op directe voedingsmetingen voor de dun bezette soorten en onafhankelijke hengelvangbaarheidsstudies; pas daarna kandidaatmodel/validatie verder uitwerken.


### Fase 2 — vangsttempo en individuele vangbaarheid beter onderscheiden (18 november 2026)

- Research registry uitgebreid van 64 naar 67 records met één baarsstudie naar recreatief hengelvangsttempo en twee onafhankelijke snoekstudies naar kunstaasschuwheid/individuele vangbaarheid.
- Nieuw outcome-type `angler_catch_rate` voorkomt dat hengeldagboekvangsttempo ten onrechte als individuele visvangbaarheid wordt geclassificeerd.
- De snoekstudies laten contextafhankelijke effecten zien van visserijdruk, visgrootte, aaskeuze en leren; de gerapporteerde populatieschatting van 43,2% geldt uitsluitend voor snoek boven 40 cm in één studiepopulatie.
- Geen van de nieuwe gegevens wordt als numerieke prognoseparameter gebruikt. Alle 67 records blijven `approvedForPrediction: false`; geen score, gewicht of tijdvakbonus gewijzigd.
- Zie `FASE2_PROGNOSE_AUDIT.md` §82 en `MODELARCHITECTUUR_FASE2.md` §70.


### Fase 2 — roofblei: voedingsincidentie onderscheiden van voedingsintensiteit (18 november 2026)

- Research registry uitgebreid van 67 naar 68 records met Krpo-Ćetković et al. (2010), een Donau-veldstudie van 198 voornamelijk subadulte roofbleien.
- Nieuw outcome-type `feeding_incidence` registreert de seizoensgebonden vacuïteitsindex (aandeel lege magen: 94,1% in november en 35,6% in juli) zonder dit ten onrechte als hoeveelheid voedselopname of dagritme te classificeren.
- De bron vult dus voedingsincidentie aan, maar directe kwantitatieve voedingsintensiteit en diel-feeding blijven voor roofblei onvoldoende gedekt.
- Alle 68 records blijven `approvedForPrediction: false`; geen modelscore, gewicht, tijdvakbonus of drempel gewijzigd.
- Zie `FASE2_PROGNOSE_AUDIT.md` §82 en `MODELARCHITECTUUR_FASE2.md` §71.


### Fase 2 — directe voedingsmetingen voor brasem, snoekbaars en meerval (18 november 2026)

- Research registry uitgebreid van 68 naar 71 records.
- Brasem: in-situ veldonderzoek naar dagelijkse zoöplanktonconsumptie en maagvulling (Vašek & Kubečka, 2004); uitkomst omvat voedingsintensiteit en voedingsritme binnen de onderzochte context.
- Snoekbaars: maandelijkse veldbemonstering over een jaar, met grootte- en seizoensverschillen in maagvulling/voedingsintensiteit en dieet (Özyurt et al., 2012).
- Meerval: gecontroleerde zelfvoederstudie met sterk nachtelijk voedingsritme, maar laboratoriumcontext (Boujard, 1995); niet gelijkstellen aan veldvangbaarheid.
- Scope-tests bewaken soort/outcome-vindbaarheid, studiecontext en niet-goedkeuring. Alle 71 records blijven `approvedForPrediction: false`; geen score, gewicht, tijdvakbonus of drempel gewijzigd.
- Zie `FASE2_PROGNOSE_AUDIT.md` §82 en `MODELARCHITECTUUR_FASE2.md` §72.


### Fase 2 — literatuurinventarisatie en actuele bewijsdekking (18 november 2026)

- PR #134 is squash-merged; de exacte PR-head Quality Gate run #805 slaagde volledig.
- De registry telt 71 records voor de negen doelsoorten. De korte gerichte controle van de overige zes soorten leverde geen aanvullende bron op die duidelijk sterk genoeg en aanvullend was om te registreren.
- De actuele uitsplitsing per soort en gemeten respons staat in `FASE2_PROGNOSE_AUDIT.md` §83. Deze aantallen zijn registry-records, geen onafhankelijke studies of bewijsgewichten.
- Belangrijkste lacunes blijven directe voedingsintensiteit/-ritme bij roofblei, bredere onafhankelijke vangbaarheidsstudies en lokale meetinvoer voor zuurstof, stroming en prooibeschikbaarheid.
- De literatuurinventarisatie is voor deze ronde voldoende afgerond; Fase 2 zelf is nadrukkelijk niet afgerond. Alle 71 records blijven `approvedForPrediction: false`.
- Geen modelscore, biologisch gewicht, tijdvakbonus of drempel is gewijzigd.

### Volgende acties Fase 2

1. Replaybaarheid van prognosesnapshots auditen: minimale compacte featurewaarden vaststellen voor reproduceerbare, chronologische evaluatie zonder dubbele opslag of onnodige persoonsgegevens.
2. De aparte voedings-/foerageerresponslaag ontwerpen met bronkwaliteit, meetrespons, soort, levensfase, seizoen, watertype, invoerbeschikbaarheid en onzekerheid.
3. Bestaande thermische, habitat-, oeverwind- en hengelpositioneringsengines hergebruiken; geen tweede model of dubbele berekening introduceren.
4. Pas daarna kandidaatmodel en chronologische validatie op echte, gekoppelde sessies uitwerken. Geen synthetische vangsten of willekeurige gewichten.
5. Fase 3 blijft geblokkeerd totdat alle Fase-2-acceptatiecriteria zijn aangetoond.


### Fase 2 — replaybaarheid-inputs gecontroleerd (18 november 2026)

- Read-only audit uitgevoerd op `prognosisEngine.ts`, `sessionCoachService.ts`, `PrognosisView.tsx`, types en regressietests.
- De vier snapshotroutes bewaren de voor die run beschikbare whitelisted historie, locatie-/stekcontext, tijdvak/duur/techniek, handmatige temperatuurprovenance, temperatuurkalibratie, historische watertemperatuurmetingen, exacte uurlijkse weersinvoer, ophaaltijd en model-/engineversies.
- Historische features zijn deterministisch gesorteerd; benchmarkdata, vrije notities en foto's worden uitgesloten. Schema v2 bewaart ook automatische versus aangepaste vangsttijdstempelherkomst.
- Tests bewaken whitelist, fingerprint, privacyuitsluiting, tijdstempelherkomst en opgeslagen sessiesnapshots.
- Geen aantoonbaar ontbrekend modelinputveld gevonden dat nu een wijziging vereist. De uitvoerbare modelcode wordt niet gearchiveerd; expliciete model-/engineversies blijven noodzakelijk.
- Geen codewijziging nodig uit deze audit.

**Volgende stap:** resterende Fase-2-acceptatiecriteria beoordelen en technische afronding scheiden van onderdelen die wachten op voldoende echte, chronologisch gekoppelde sessies. Fase 3 blijft geblokkeerd tot formele acceptatie.


### Fase 2 — audit actieve numerieke omzettingen (18 november 2026)

- De actieve thermische schaal `1 + 9 × thermalEfficiency^0.85` is aangemerkt als technische omzetting van een voorlopige soortcurve; exponent en 1–10-schaal zijn niet empirisch gekalibreerd.
- De persoonlijke Poisson-vangkans blijft een afzonderlijke empirische baseline op basis van bekende doelvisvangsten per geldige visduur. De Poisson-aanname is lokaal niet gevalideerd.
- Het 0,95-plafond en de steekproef-/vertrouwensdrempels zijn technische guards, geen wetenschappelijke limieten of statistische betrouwbaarheidsclaims.
- Geen berekening, parameter of UI-score gewijzigd. Zie `FASE2_PROGNOSE_AUDIT.md` §84.
- Fase 2 blijft open; lokale statistische kalibratie wacht op voldoende echte, vergelijkbare sessies.

### Fase 2 — formele acceptatiecontrole en Brier-tijdvenster (18 november 2026)

- De formele crosswalk van de zeven acceptatiecriteria staat in FASE2_PROGNOSE_AUDIT.md §85.
- De Brier-evaluator controleert naast voorspelde/werkelijke duur ook het geplande/werkelijke tijdvenster: exact op minuutprecisie, of via het opgeslagen targetSlot als oudere snapshot geen exact venster heeft.
- Waarnemingen zonder tijdvenster én zonder gekozen tijdvak worden apart geteld en uitgesloten; er wordt geen tolerantie of kansherleiding verzonnen.
- Een ontbrekende overdracht van geplande VisCoach-start/eindtijd naar de opgeslagen sessiesnapshot is hersteld.
- Regressies toegevoegd voor verschoven tijdvenster bij gelijke duur, afwijkende/ontbrekende duur en tijdvakfallback. Quality Gate staat nog open tot PR-validatie.
- Technische criteria 1, 3 en 6 zijn grotendeels gerealiseerd; criterium 4 grotendeels; criterium 5 wacht op de Quality Gate; criterium 2 blijft begrensd door voorlopige thermische priors en het ontbreken van goedgekeurde numerieke biologische bronnen.
- Fase 2 is niet formeel geaccepteerd. Lokale kalibratie wacht op voldoende echte, vergelijkbare sessies; Fase 3 start niet eerder.
### Fase 2 — Brier-tijdvenstercontrole afgerond (18 november 2026)

- PR #138 is squash-merged als 53bf5616b85edf5690043840855a7ebf87b15184.
- PR-head Quality Gate #44393169257 en main mergecommit Quality Gate #44393310926 zijn volledig geslaagd.
- Brier controleert voorspelde/werkelijke duur en gepland/werkelijk tijdvenster. Exacte vensters worden op minuutprecisie vergeleken; oudere snapshots vallen terug op het gekozen Amsterdamse starttijdvak; ontbrekende context wordt uitgesloten en apart geteld.
- De VisCoach-route bewaart geplande start/eindtijden in de sessiesnapshot. Regressies dekken verschoven vensters bij gelijke duur, duurmismatch, onbekende duur, tijdvakfallback en ontbrekende tijdcontext.
- Geen biologische score, gewicht, parameter of tijdvakbonus gewijzigd. Fase 2 blijft open wegens resterende wetenschappelijke/ontwerpbesluiten en lokale praktijkvalidatie; Fase 3 start niet.
### Fase 2 — soortspecifieke thermische bewijsstatus zichtbaar (18 november 2026)

- De profielmodal toont nu de thermische bewijsstatus uit de bestaande evidence-service.
- Baars en snoekbaars: aerobe-scopegegevens, niet goedgekeurd voor numerieke voorspelling.
- Karper, snoek, brasem en blankvoorn: metabole gegevens, geen aerobe-scopecurve; dit is geen directe maat voor activiteit, voedselopname of vangbaarheid.
- Zeelt, meerval en roofblei: geen vergelijkbare soortspecifieke thermische fysiologiebron in het register.
- Geen thermische curve, score, parameter of vangstkans gewijzigd. De expliciete keuze om voorlopige priors te behouden of bij onvoldoende bewijs uit te schakelen staat open in FASE2_PROGNOSE_AUDIT.md §86.
- Correctie acceptatiecrosswalk: §43 bevat zeven verplichte criteria; de crosswalk in §85 omvat ook criterium 7 (technische borging, tests, exacte PR-head/mergecommit Quality Gates en documentconsistentie).

### Fase 2 — thermische tijdvaktaal en startmetadata (18 november 2026)

- De kaart en samenvatting noemen de thermisch hoogste relatieve periode nu 'thermisch gunstigste tijdvak', niet 'beste vistijd'. Het blijft een temperatuurrespons, geen voedingspiek of vangstkans.
- 'Start sessie op dit moment' is alleen beschikbaar bij de prognose voor vandaag en bewaart het actuele Amsterdamse starttijdvak in de snapshot; het gebruikt niet langer het latere thermisch gunstigste tijdvak als startmetadata.
- VisCoach blijft de gekozen sessietijd volgen; bij sessies over meerdere tijdvakken wordt geen globale dagwinnaar opgedrongen.
- Geen thermische berekening, score, parameter of vangstkans gewijzigd. Zie FASE2_PROGNOSE_AUDIT.md §87.

### Fase 2 — resterende omgevingsfactoren beoordeeld (19 november 2026)

- De factorinventaris voor wind, regen, bewolking/licht, opgeloste zuurstof, stroming/afvoer, luchtdruk en troebelheid is vastgelegd in FASE2_PROGNOSE_AUDIT.md §88.
- Wind blijft praktische positionerings-/presentatiecontext, geen zelfstandige biologische of vangstkansbonus.
- Regen en bewolking hebben onvoldoende direct en overdraagbaar bewijs voor dagelijkse voeding of hengelvangst; paaigerelateerde migratie wordt niet als dagelijkse activiteit geïnterpreteerd.
- Zuurstof en stroming kunnen biologisch relevant zijn, maar ontbreken als betrouwbare actuele lokale invoer. Zonder meting blijven ze onbekend.
- Druk en troebelheid blijven contextafhankelijk; geen universele numerieke respons geactiveerd.
- Alle research-registryrecords blijven `approvedForPrediction:false`. Geen score, gewicht, drempel, tijdvakbonus of catchability-regel gewijzigd.
- De resterende factorinventaris is voor deze ronde beoordeeld. Volgende stap: formele acceptatiecrosswalk actualiseren en het ontwerpbesluit over de voorlopige thermische priors uit §86 afhandelen. Fase 2 blijft open; fase 3 blijft geblokkeerd.


### Fase 2 — actuele acceptatiecrosswalk (19 november 2026)

- De zeven formele acceptatiecriteria zijn opnieuw beoordeeld in `FASE2_PROGNOSE_AUDIT.md` §89 na PR #140, #141 en #142.
- De resterende omgevingsfactorinventaris is voor deze ronde afgerond (§88); er zijn geen nieuwe numerieke factoren geactiveerd.
- Technische snapshot-/Brier-keten en tijdvak-/VisCoach-selectie zijn gerealiseerd voor de huidige scope; lokale kalibratie wacht op echte vergelijkbare sessies.
- Formele blocker blijft criterium 2: besluit nodig over voorlopige thermische curves en validatie van de exacte curveparameters.
- Fase 2 is niet geaccepteerd. Fase 3 blijft geblokkeerd. Geen runtimeberekening, score, parameter of gebruikersinvoer gewijzigd.
### Fase 2 — gekozen begrenzing thermische curves (19 november 2026)

De gebruiker kiest optie A: behoud de bestaande thermische curves als transparante voorlopige modelprior binnen de bestaande prognose. De curves bepalen uitsluitend de relatieve thermische respons; ze verhogen niet zelfstandig voedingskans, voerhoeveelheid of persoonlijke vangstkans. De exacte parameters blijven ongevalideerd en worden niet als lokaal gevalideerd gepresenteerd.

De prognose blijft de centrale bron. VisCoach gebruikt de prognose en bestaande gespecialiseerde engines voor advies en tactiek, zonder een eigen prognose of parallelle biologische logica. Temperatuurrespons en voedingsgedrag blijven onderscheiden. Geen onnodige herbouw of nieuwe numerieke factoren.



### Fase 2 — ontwerpbesluit en volgende auditstap (19 november 2026)

- PR #147 is squash-merged als `5acd372a3be0ee31d1a5b7d422659e7ef4fee097`; de Quality Gate op de mergecommit (#44496021470) is geslaagd.
- De bestaande thermische curves blijven op keuze van de producteigenaar behouden als transparante voorlopige mechanistische prior. Dit valideert de exacte parameters niet en geeft geen toestemming voor extra numerieke factoren of gewichten.
- De bestaande prognose en dagscoreweergave blijven leidend.

**Einddoel scoreketen:** ieder relevant onderdeel van de prognose levert uiteindelijk een eigen dagelijkse factoruitkomst en een onderbouwde bijdrage aan de bestaande totaalscore. De bestaande scoreweergave blijft behouden. Ook de tijdvakken worden afzonderlijk beoordeeld met passende tijdvakdata en soort-/seizoen-/stekcontext. Zonder bewijs of betrouwbare invoer wordt geen arbitraire neutrale score of gewicht verzonnen; de factor blijft zichtbaar als onbekend/contextueel of uitgesloten.
 Alle factoren worden in de bestaande keten beoordeeld op rol, bewijs, databeschikbaarheid, onzekerheid, interactie en toetsbaarheid. Tijdvakvoorkeur combineert relevante prognosecontext met passend soortspecifiek voedings-/foerageerbewijs; beweging en thermische respons zijn niet automatisch voedings- of vangstbewijs.
- Brier evalueert de persoonlijke vangstkans tegenover gekoppelde sessie-uitkomsten; het stuurt biologische gewichten niet rechtstreeks bij. Activiteit, voeding, habitat en tijdvak vereisen passende afzonderlijke evaluatie.
- Volgende stap: kandidaatmodel-audit van de bestaande prognoseketen en een chronologisch validatieprotocol. Geen runtimewijziging of nieuwe factoractivatie vóór bewijs en Quality Gate. Fase 2 is niet formeel geaccepteerd; Fase 3 blijft geblokkeerd.


### Fase 2 — actuele codebevinding score- en tijdvakketen (19 november 2026)

De code-audit in `FASE2_PROGNOSE_AUDIT.md` §92 bevestigt dat de huidige dagscore feitelijk alleen de voorlopige thermische respons weergeeft. Eén dagelijkse waterthermische analyse wordt hergebruikt voor Nacht/Ochtend/Middag/Avond; de vier scores zijn daardoor gelijk. Weer-, seizoen- en tijdvakfactoren zijn contextueel en soortspecifiek voedingsritme is alleen verklarende tekst. De huidige tijdvakrangschikking kan dus nog geen echte voedingspiek of beste tijdvak bepalen.

Dit is een kritisch verschil met de gewenste geïntegreerde prognose, maar er worden geen ad-hoc gewichten of tijdvakbonussen toegevoegd. De bestaande scoreweergave en centrale prognose blijven behouden. Volgende stap: volledige factor-naar-code/UI/snapshot/evaluatie-traceermatrix en kandidaatmodel plus chronologisch validatieprotocol. Fase 2 blijft niet geaccepteerd; Fase 3 blijft geblokkeerd.


### Fase 2 — factortrace huidige prognoseketen (19 november 2026)

De volledige factor-naar-code/UI/snapshot/evaluatie-traceermatrix staat in `FASE2_PROGNOSE_AUDIT.md` §93. Huidige dagscore: uitsluitend thermische activiteitspotentie. Druk, wind, seizoen, licht/diel, bewolking en neerslag zijn context; habitat/beweging is een aparte ruimtelijke laag; persoonlijke vangstkans is een aparte empirische baseline. Brier evalueert die vangstkans, terwijl temperatuur eigen MAE/RMSE/bias-evaluatie heeft. Voor activiteit, voeding, habitat-aanwezigheid en tijdvakrangschikking ontbreken onafhankelijke evaluatiemaatstaven.

Volgende stap: kandidaatmodel en chronologisch validatieprotocol ontwerpen op basis van de volledige traceermatrix. Geen runtimefactoren, gewichten of tijdvakbonussen activeren voordat bewijs, databeschikbaarheid en onafhankelijke validatie zijn vastgelegd.


### Fase 2 — kandidaatmodel en chronologische validatie (19 november 2026)

De kandidaatmodelrichting en het validatieprotocol zijn uitgewerkt in `FASE2_PROGNOSE_AUDIT.md` §94. De bestaande dagscoreweergave en centrale prognose blijven behouden. Iedere relevante factor moet een eigen traceerbare factoruitkomst en, alleen bij voldoende bewijs/data, een onderbouwde bijdrage krijgen. Tijdvakken worden afzonderlijk beoordeeld met doelsoort, datum/seizoen, stek en tijdvakcondities. Habitat/aanwezigheid, persoonlijke vangstkans en betrouwbaarheid blijven afzonderlijke responsen.

Brier blijft evaluator van persoonlijke vangstkans; temperatuur, activiteit, voeding, habitat en tijdvak vereisen passende eigen evaluatie. Normalisatie, aggregatie, missing-data-regels en gewichten zijn nog niet definitief gekozen. Geen runtimewijziging of factoractivatie. Fase 2 blijft niet geaccepteerd; Fase 3 blijft geblokkeerd.


### Fase 2 — audit tactiektemperatuur en herstel documentatie (19 november 2026)

De voorvoer-audit uit PR #146 is hersteld als §96 in `FASE2_PROGNOSE_AUDIT.md`; §97 legt de aanvullende evidencecontrole van habitat-/positioneringsdrempels vast. Vijf aanvullende telemetriebronnen zijn als context in `researchRegistry.ts` opgenomen en blijven niet-goedgekeurd. Alle 76 bronnen hebben `approvedForPrediction: false`.

De temperatuurregels in voorvoer, habitat en positionering zijn aparte tactiek-/zoekhypothesen en leveren geen dagelijkse scorebijdrage. Enkele exacte grenzen en formuleringen zijn niet onderbouwd; met name de claim dat meerval onder 12 °C niet actief jaagt is te absoluut. De eerder goedgekeurde waarschuwingstekst in PrognosisView is hersteld. Geen voorvoerhoeveelheid, drempel, gewicht of scoreberekening aangepast.

Volgende stap: per soort de claim-/brontrace afronden en daarna de zevenpunts-acceptatiecrosswalk bijwerken. Fase 2 blijft open; Fase 3 blijft geblokkeerd.


### Fase 2 — claimcorrectie koudewaterpositionering (19 november 2026)

De broncontrole §97 leidde tot gerichte tekstcorrecties in de bestaande positioneringsengine voor snoek, zeelt, meerval en voorn. De eerdere absolute claims zijn vervangen door contextafhankelijke zoekhypothesen; de bestaande temperatuurcondities en zoneberekening zijn behouden. Regressietests bewaken dat onbewezen grenzen en gedragsclaims niet als feiten worden gepresenteerd.

Geen dagelijkse score, gewicht, temperatuurgrens, voerhoeveelheid of tijdvakbonus gewijzigd. Fase 2 blijft open; Fase 3 blijft geblokkeerd.


### Fase 2 — soortspecifieke registerdekking (19 november 2026)

De actuele soortdekking is bijgewerkt in `FASE2_PROGNOSE_AUDIT.md` §§78 en 99. Het register bevat 76 records, alle niet-goedgekeurd voor directe numerieke voorspelling. Nieuwe telemetriebronnen verdiepen de habitat-/bewegingscontext voor meerval, snoek en blankvoorn/brasem; zij valideren geen voedings- of vangstkansfactor. Roofblei heeft nog geen directe tijdgebonden voedingsbron. Fase 2 blijft open; Fase 3 blijft geblokkeerd.


### Fase 2 — broncontrole oudere profielreferenties (19 november 2026)

Zeven oudere profielreferenties zijn gecontroleerd en waar nodig bibliografisch gecorrigeerd. De audit §100 onderscheidt filtervoeding/prooikeuze, voedingsmechanica, groei, laboratoriumzwemactiviteit en reproductie van dagelijkse voedselopname en vangbaarheid. Zeven nieuwe contextregistraties zijn toegevoegd; alle 83 registry-records blijven niet-goedgekeurd voor directe voorspelling. Kestemont (1995) en Tartally (2000) blijven voorlopig achtergrondverwijzingen zonder modelstatus. Fase 2 blijft open; Fase 3 blijft geblokkeerd.


### Fase 2 — gerichte omgevingsfactorreview (19 november 2026)

De review van wind, luchtdruk, troebelheid, zuurstof, neerslag en stroming is vastgelegd in `FASE2_PROGNOSE_AUDIT.md` §101. Baarsbeweging toont beperkte wind-/drukeffecten; brasemactiviteit hangt in één ondiep meer samen met troebelheid; ernstige hypoxie verlaagt karpervoeropname in een laboratoriumstudie. Zuurstof ontbreekt als betrouwbare lokale invoer en blijft onbekend. Neerslag/stroming blijven context zonder voldoende direct doelsoortbewijs. Alle 86 registry-records blijven niet-goedgekeurd voor directe voorspelling. Fase 2 blijft open; Fase 3 blijft geblokkeerd.


### Fase 2 — actuele acceptatiestatus (19 november 2026)

De zevenpunts-acceptatiecrosswalk is gesynchroniseerd in `FASE2_PROGNOSE_AUDIT.md` §89. De thermische optie A is gekozen: de bestaande curve blijft een voorlopige prior, geen gevalideerde soortcurve. De research registry telt 86 unieke records; alle blijven niet-goedgekeurd voor directe numerieke voorspelling.

De huidige dagscore wordt numeriek alleen thermisch bepaald. De gewenste factorbijdragen en soort-/seizoen-/stekgevoelige tijdvakbeoordeling zijn nog niet actief. Voordat gewichten worden ontworpen, wordt eerst de doelrespons van de bestaande 1–10-score afgebakend en de factorstatus-/datadekkingsmatrix gesloten. Brier blijft uitsluitend persoonlijke vangstkans evalueren; activiteit, voeding, habitat en tijdvak vereisen eigen evaluatie. Fase 2 blijft open; Fase 3 blijft geblokkeerd.


### Fase 2 — actuele soort-/responsdekking (19 november 2026)

De exacte registrytelling per soort en gemeten respons staat in `FASE2_PROGNOSE_AUDIT.md` §82. Het register bevat 86 unieke records, alle niet-goedgekeurd voor directe numerieke voorspelling. De responsen voedingsintensiteit, voedingsritme, prooikeuze, beweging, habitat, vangbaarheid, fysiologie en groei blijven afzonderlijk. De volgende stap is de doelrespons van de bestaande dagscore afbakenen en de factor-/datadekkingsmatrix sluiten; daarna pas de aggregatie ontwerpen. Fase 2 blijft open; Fase 3 blijft geblokkeerd.


### Fase 2 — factorinventaris gesloten (19 november 2026)

De volledige factor-/input-/evaluatiematrix staat in `FASE2_PROGNOSE_AUDIT.md` §102. Per factor zijn respons, actuele invoer, huidige rol en vereiste onafhankelijke evaluatie vastgelegd. De bestaande factorinventaris is gesloten, maar het modelontwerp is nog niet formeel afgerond.

De bestaande dagscore blijft één score en wordt nu alleen thermisch bepaald. Voordat nieuwe bijdragen worden gebouwd, moet de doelrespons van die score worden bevestigd, daarna normalisatie, ontbrekende-data-regels en eigen evaluatie voor activiteit, voeding, habitat en tijdvak. Brier blijft uitsluitend persoonlijke vangstkans evalueren. Fase 2 blijft open; Fase 3 blijft geblokkeerd.


### Fase 2 — productbesluit bestaande 1–10-dagscore (19 november 2026)

De gebruiker heeft bevestigd dat de bestaande cijferschaal en scoreweergave behouden blijven. Eén eenvoudig dagcijfer moet direct helpen een gunstige of ongunstige dag te herkennen, met een begrijpelijke onderbouwing. Het cijfer staat voor de verwachte biologische activiteit- en voedings-/foerageerpotentie van de geselecteerde doelsoort; het is geen persoonlijke vangstkans, stekaanwezigheid of vangbaarheid. Geen nieuwe zichtbare deelscores of extra invoer.

De ontwerpregels en resterende modelstappen staan in `FASE2_PROGNOSE_AUDIT.md` §103. De huidige thermische berekening blijft voorlopig ongewijzigd totdat normalisatie, missing-data-regels, factorweging en chronologische validatie zijn afgerond. Fase 2 blijft open; Fase 3 blijft geblokkeerd.


### Fase 2 — minimale vangstregistratie bevestigd (19 november 2026)

De gebruiker wil voorkomen dat vangstregistratie administratief wordt. De basis is: 'Vis gevangen' → soort selecteren → opslaan. Vangsttijd automatisch vastleggen en aanpasbaar houden. Vooraf ingesteld hengel-/methodeprofiel en gewicht zijn optioneel; voer, aas, presentatie en andere materiaalgegevens zijn geen verplichte velden.

Vangstgebeurtenissen kunnen latere tijdvak- en tactiekanalyses voeden, maar mogen niet als directe voedingsactiviteitslabels worden behandeld. Vangstresultaten zijn mede afhankelijk van aanwezigheid, stek, inspanning en vangbaarheid; één vangst bewijst geen methode-effect en geen vangst bewijst geen inactiviteit. Zie FASE2_PROGNOSE_AUDIT.md §104. Bestaande flow eerst toetsen; geen administratieve uitbreiding of runtimewijziging zonder aantoonbare noodzaak.



### Fase 2 — factorresponsmatrix en beste beschikbare verwachting (19 november 2026)

De bestaande 1–10-score heeft nu een vastgesteld productdoel (§103), en de frictiearme vangstregistratie is vastgelegd in §104. §105 koppelt de geïnventariseerde factoren aan de biologische respons die ze werkelijk meten en ordent hun kandidaatprioriteit zonder universele percentages te verzinnen.

Vislogboek is een informatiebron, geen glazen bol. Het model moet de best verdedigbare prognose maken met beschikbare gegevens. Ontbrekende informatie blijft zichtbaar als onbekend en verlaagt de zekerheid, maar maakt de hele prognose niet automatisch onbruikbaar. De bestaande ene 1–10-score blijft behouden; tijdvakadvies moet dezelfde soortspecifieke doelrespons gebruiken. Normalisatie, coverage-regels, interacties en onafhankelijke chronologische validatie zijn de volgende stappen. Fase 2 blijft open; Fase 3 geblokkeerd.


### Fase 2 — normalisatie en onzekerheid uitgewerkt als ontwerpvoorstel (19 november 2026)

De uitwerking staat in `FASE2_PROGNOSE_AUDIT.md` §106 en de architectuursamenvatting in `MODELARCHITECTUUR_FASE2.md` §97. Elke kandidaatfactor moet naar een soortspecifieke, passende biologische respons worden genormaliseerd; een interne 0–1-index is geen kanspercentage. De bestaande 1–10-score blijft de enige gebruikersscore en krijgt pas na onafhankelijke kalibratie een vaste, versieerbare mapping.

Gemeten, geschatte, proxy/contextuele, onbekende, ongeldige, tegenstrijdige en niet-toepasselijke invoer blijven onderscheiden. Ontbrekende factoren worden niet stilzwijgend neutraal gemaakt en resterende gewichten worden niet verborgen herverdeeld. Een gedeeltelijke prognose blijft mogelijk wanneer die combinatie gevalideerd is; zonder bruikbare thermische basis of andere toegelaten directe responsinformatie blijft de huidige uitkomst N/B.

Dit is een ontwerpvoorstel, geen implementatie of formele Fase-2-acceptatie. Geen runtimegewichten, scoremapping, tijdvakbonussen of gebruikersflow gewijzigd. Fase 2 blijft open; Fase 3 blijft geblokkeerd.


### Fase 2 — technische thermische-baseline-audit (19 november 2026)

De huidige thermische profielcurve, exacte soortparameters, scoremapping en temperatuurstatussen zijn vastgelegd in `FASE2_PROGNOSE_AUDIT.md` §107 (architectuur §98). Het betreft een voorlopige softwareprior, geen gevalideerde voedselopname-/activiteitscurve. De ondergrens van de huidige efficiëntiefunctie betekent een theoretische minimumscore van circa 2,1/10. Een interne placeholder bij onbekende temperatuur is geen geldige prognose of trainingslabel.

Geen runtimewijziging; de bestaande 1–10-score blijft ongewijzigd. Fase 2 blijft open tot de biologische responslabels, parameterherkomst, vaste kalibratieankers en onafhankelijke validatie zijn onderbouwd.


### Fase 2 — bronvalidatie thermische profielcurves (19 november 2026)

De bronherkomst-audit staat in `FASE2_PROGNOSE_AUDIT.md` §108. De huidige registry bevat geen directe thermische-efficiëntie-/optimumrespons die de exacte soortcurves valideert. Metabolisme en aerobe scope zijn indirecte fysiologische eindpunten, geen dagelijkse voedselopname of vangbaarheid. De huidige curveparameters blijven voorlopige softwareprioren; geen parameter of bronstatus is aangepast.


### Fase 2 — soortspecifiek bewijs voor temperatuur en voeding (19 november 2026)

De bron-/responsmatrix staat in `FASE2_PROGNOSE_AUDIT.md` §109 (architectuur §100). Directe voedingsstudies voor karper, zeelt en snoekbaars zijn contextgebonden; blankvoorn heeft verweven temperatuur-/licht-/seizoensbewijs. Metabolisme, aerobe scope, groei, maagvulling en beweging blijven afzonderlijke responsen. Geen universele thermische curve is hiermee gevalideerd; geen bronstatus of runtimeparameter gewijzigd.


### Fase 2 — soortspecifieke responskaarten (19 november 2026)

De eerste responskaarten voor alle tien profielen staan in `FASE2_PROGNOSE_AUDIT.md` §110. Geen profiel heeft op basis van de huidige registry een volledig gevalideerde dagelijkse temperatuur-voedselopnamecurve. Directe voedingsmetingen bij karper, zeelt en snoekbaars zijn contextgebonden; andere soorten hebben vooralsnog onvoldoende directe thermische voedingsdata. Fysiologie, beweging, dagritme, habitat en vangst blijven afzonderlijke eindpunten. Geen modelparameter of runtime gewijzigd; Fase 2 blijft open.


### Fase 2 — responslabel-scheiding (19 november 2026)

Audit §111 legt vast dat voedselopname, foerageergedrag, beweging en vangst verschillende responsen zijn. Onderzoeken met verschillende levensfasen, voedseltypen of meetmethoden mogen niet als één curve worden samengevoegd. Geen runtimewijziging.


### Fase 2 — geconsolideerde audit- en architectuurstatus (19 november 2026)

De gedetailleerde actuele status staat in FASE2_PROGNOSE_AUDIT.md §§129–133 en de architectuursamenvatting in MODELARCHITECTUUR_FASE2.md §§103–106. De factorinventaris is inhoudelijk gesloten en per respons/doelsoort toegelaten als voorlopige prior, numerieke kandidaat, contextueel, onbekend of afzonderlijke responslaag.

Belangrijke actuele grenzen:
- De research registry bevat 86 records; geen record is goedgekeurd voor directe numerieke voorspelling.
- De bestaande thermische prior blijft volgens het expliciete optie-A-besluit de enige numerieke bijdrage aan de biologische 1–10-dagscore. Dit is een voorlopige softwareprior, geen wetenschappelijk gevalideerde soortcurve.
- Er zijn geen directe lokale labels voor fysiologische activiteit, voedselopname of biologische tijdvakvoorkeur. Brier/BSS blijft uitsluitend voor persoonlijke vangstkans; temperatuurfoutmaten blijven uitsluitend voor de watertemperatuurschatter.
- Vangsten, aanbeten, beweging en opportunistische aanwezigheidssignalen worden niet als directe voedingslabels gebruikt. Tijdvakblootstelling vereist expliciete hengelintervallen; automatische formulier-open-tijdstippen zijn geen werkelijk vangstmoment.
- De basisvangstflow blijft frictiearm. De huidige optionele hengel-/techniekregistratie is echter vrije tekst en nog geen selectie uit vooraf ingestelde herbruikbare hengelprofielen; dit is als afzonderlijk productbesluit vastgelegd.

**Formele status:** Fase 2 is nog niet geaccepteerd en Fase 3 blijft geblokkeerd. Er zijn geen nieuwe biologische gewichten, factoren, interacties, tijdvakbonussen of runtime-scorewijzigingen geactiveerd. De volgende ontwerpstap is de finale kandidaatmodelreview, met expliciete behandeling van de voorlopige thermische uitzondering binnen criterium 2 en de nog open productkeuze rond hengelprofielen/voorvoergrammen.


### Fase 2 — finale kandidaatmodelreview (20 november 2026)

De read-only review van de actuele main-code en de kandidaatarchitectuur is vastgelegd in `FASE2_PROGNOSE_AUDIT.md` §134 en samengevat in `MODELARCHITECTUUR_FASE2.md` §107. De kandidaat blijft één versiebeheerste, modulaire prognoseketen met gescheiden biologische responsen en aparte habitat-, vangbaarheids- en onzekerheidslagen.

De actuele 1–10-score wordt uitsluitend door de voorlopige thermische prior bepaald. Er zijn 0 goedgekeurde numerieke voedingsbronnen; dezelfde thermische dagrespons wordt voor de vier tijdvakken hergebruikt. De huidige lokale data bevatten geen directe labels om activiteit, voedselopname of een samengestelde biologische score onafhankelijk te valideren.

**Reviewuitkomst:** kandidaatarchitectuur inhoudelijk beoordeeld, kandidaatmodel niet numeriek toegelaten. Optie A blijft een transparante voorlopige uitzondering, geen wetenschappelijke validatie. Geen runtime-, score-, parameter-, gewicht-, interactie- of gebruikersflowwijziging. Fase 2 blijft open en niet geaccepteerd; Fase 3 blijft geblokkeerd.

Het hervattingspunt is nu: expliciete eigenaarbesluiten over de beperkte optie-A-uitzondering, voorvoergrammen bij lage invoerkwaliteit en vrije tekst versus optionele hengel-/methodepreset; daarnaast gericht zoeken naar bruikbare onafhankelijke directe biologische datasets. Daarna pas responsankers en chronologische baselinevergelijking. Geen extra verplichte invoer.


### Fase 2 — nieuwe directe 0+-snoekvoedingsbron beoordeeld (20 november 2026)

Nilsson-Örtman et al. (2026) en de open Dryad-data zijn toegevoegd aan de research registry als directe maar beperkte `feeding_intensity`-bron voor Snoek. De studie bevat 192 temperatuur-/zichtproeven bij 5, 9 en 13 °C plus 80 aanvullende verbruiningproeven. De voedingssnelheid reageerde opvallend zwak op temperatuur en zichtconditie; de enige duidelijke koepelvormige respons trad op bij 5 °C in helder water.

De bron betreft jonge 0+-snoek in laboratoriumarena's en is niet overdraagbaar als volwassen Nederlandse veldcurve. Volwassen snoeken in dezelfde publicatie leverden alleen lichaamstemperatuurdata, geen voedingslabels. Registry: 87 records, 0 numeriek goedgekeurd. De bron blijft `approvedForPrediction: false`; geen runtimefactor, parameter, gewicht of tijdvakbonus geactiveerd. Zie audit §135 en architectuur §108.


### Fase 2 — aanvullende modelgeschatte veldrantsoenen geregistreerd (20 november 2026)

Garcia & Adelman (1985) (karper) en Specziár (2002) (karper, brasem, blankvoorn) zijn toegevoegd aan de research registry als beperkte `feeding_intensity`-kandidaatbronnen. Beide schatten dagelijkse rantsoenen uit maag-/darminhoud en ledigingsmodellen. Garcia vond geen statistisch significant ochtend-/avondverschil; de brasemtemperatuurrelatie bij Specziár was gevoelig voor één uitgesloten waarneming.

De bronnen blijven `approvedForPrediction: false`; primaire methoden en steekproefcontext moeten verder worden gecontroleerd. Registry: 89 records, 0 numeriek goedgekeurd. Geen runtimefactor of gewicht geactiveerd. Zie audit §136 en architectuur §109.


### Fase 2 — volwassen baars veldrantsoen toegevoegd (20 november 2026)

Thorpe (1977) is als beperkte volwassen-baarsbron opgenomen: dagelijkse rantsoenen via maaginhoud/lediging, afnemend van circa 6,5% lichaamsgewicht/dag in juni tot 3,2% in september. De auteurs beschouwen de schattingen als minima wegens tragere lediging bij kooivissen; een watertemperatuurreeks ontbreekt. De bron blijft approvedForPrediction=false. Registry: 90 records, 0 numeriek goedgekeurd. Zie audit §137 en architectuur §110.


### Fase 2 — snoekdataset 2026: broncontext gecorrigeerd (20 november 2026)

De volwassen snoek-biosensorreeks van Nilsson-Örtman et al. (2026) is gemeten in drie experimentele vijvers, niet in een representatieve natuurlijke veldpopulatie; de data bevatten alleen lichaamstemperatuur, geen voedingslabels. De primaire paper rapporteert 24 0+-dieren in experiment 1 en drie uitgesloten proefwaarnemingen, terwijl de Dryad-README n=23 en drie individuen noemt. Experiment 2 had daarnaast twee uitsluitingen wegens schimmelinfectie. Ruwe bestanden waren via Dryad niet downloadbaar (HTTP 403), dus er is geen onafhankelijke heruitvoering geclaimd. De bron blijft beperkt en niet-goedgekeurd. Zie audit §138.


### Fase 2 — larvale baars/snoekbaars veldrantsoen geregistreerd (20 november 2026)

Worischka & Mehner (1998) is toegevoegd als beperkte veldgebaseerde voedingsintensiteitsbron voor larvale baars en snoekbaars. Dagelijkse rantsoenen zijn geschat uit uurlijkse maagvulling en maagledigingsmodellen; de methode is gevoelig voor bemonsteringsinterval. Levensfase en ontbrekende volledige primaire methodedetails verhinderen overdracht naar volwassen Nederlandse vis. Bron blijft niet-goedgekeurd voor voorspelling. Zie audit §139.


### Fase 2 — volwassen baars/blankvoorn seizoensrantsoen geregistreerd (20 november 2026)

Jamet (1994) is toegevoegd als beperkte veldbron voor volwassen baars en blankvoorn. Dagelijkse consumptie werd geschat uit maandelijkse maaginhoudsmonsters en een temperatuurafhankelijke maagledigingsfunctie. Dit levert seizoenscontext, geen zuivere temperatuurcurve of sessiegebonden tijdvakvoorkeur. Bron blijft niet-goedgekeurd voor voorspelling. Zie audit §140.


### Fase 2 — leeftijdsafhankelijk blankvoornritme en bronmethodes bevestigd (20 november 2026)

Jamet et al. (1990) is in de audit als beperkt direct voedingsritmebewijs opgenomen: 253 blankvoorns, vieruursbemonstering gedurende één zomerse 24-uurscyclus. Jongere vissen voedden vooral vanaf de middag tot schemering; oudere vissen ook overdag en 's nachts. Dit ondersteunt leeftijdsafhankelijke variatie, geen universele dusk-bonus.

De primaire methodesectie van Jamet (1994) is gecontroleerd. Dagelijkse consumptie is berekend uit maaginhoud en een temperatuurafhankelijke maagledigingsrate (Eggers-model) en vervolgens gerelateerd aan leeftijdsklasse-/populatieomvang. Dit blijft beperkte seizoens-/dieetcontext, geen directe individuele opname of onafhankelijke thermische respons.

Filipiak et al. (1997) is als kandidaat voor juveniele meerval-voerbehoefte beoordeeld. De beschikbare samenvatting meldt rantsoenen per metabool gewicht in brede temperatuurbanden, maar de precieze opname- en temperatuurmethodiek is niet voldoende geverifieerd. Geen registry-goedkeuring of runtimegebruik. Zie audit §§141–145.


### Fase 2 — actuele acceptatiestatus en broninventaris (20 november 2026)

De zevenpunts-crosswalk in `FASE2_PROGNOSE_AUDIT.md` §89 is geactualiseerd na de kandidaatmodelreview en broncontroles §§134–145. De Research Registry telt 92 unieke records; 0 zijn numeriek goedgekeurd. De eigenaarkeuze optie A blijft gelden: de bestaande thermische curves zijn uitsluitend voorlopige mechanistische prioren, geen gevalideerde soortspecifieke voedselopnamecurves.

De geïntegreerde score met directe voedingsbijdrage en een gevalideerde tijdvakrespons is nog niet gerealiseerd. Lokale biologische labels ontbreken. Brier blijft uitsluitend evaluatie van persoonlijke vangstkans. Voorvoergrammen/gating en een optionele hengel-/methodepreset blijven afzonderlijke open productbesluiten. Fase 2 is niet geaccepteerd; Fase 3 blijft geblokkeerd.


### Fase 2 — primaire methodecontrole meerval 2025 (20 november 2026)

Yazici et al. (2025) is op de volledige primaire tekst gecontroleerd. De studie meet maagvulling en dieet bij 200 meervallen in één Anatolisch stuwmeer. Het hoogste seizoens-FI viel in de winter (0,827), maar de wintersteekproef omvat slechts zeven vissen; seizoens- en leeftijdsgroepen zijn sterk ongelijk. Er is geen directe temperatuurcurve, individuele voedselopname of dagdeelrespons. Bron blijft limited/moderate context en approvedForPrediction=false; geen winterbonus of runtimewijziging. Zie audit §144.


### Fase 2 — snoekbron 2025: primaire statistische controle (20 november 2026)

Yazıcıoğlu et al. (2025) is op de volledige primaire PDF gecontroleerd. De maandelijkse oppervlaktetemperatuur-FI-correlatie is zwak en niet significant (r_s=0,117; p>0,05). De FI-waarden variëren numeriek per seizoen, maar het abstract bevat een intern p-waardeconflict (niet-significant genoemd met p<0,05); de resultaten geven geen eenduidige aparte FI-teststatistiek. De bron blijft limited en approvedForPrediction=false; geen thermische of seizoensbonus. Zie audit §145.


### Fase 2 — technische en documentatieafronding PR #189 (20 november 2026)

PR #189 is op `main` gemerged als `6661623cb591623c40ba7886a85a0cbb3c99ab86`. De exacte PR-head en mergecommit Quality Gates zijn geslaagd. Audit §§141–146 en de zevenpunts-crosswalk §89 zijn actueel. De Research Registry telt 92 records, 0 numeriek goedgekeurd.

Optie A is expliciet als eigenaarbesluit gesloten: thermische curves blijven uitsluitend een voorlopige mechanistische prior. Fase 2 is nog niet geaccepteerd; de geïntegreerde biologische score, directe lokale biologische labels, gevalideerde tijdvakrespons en twee afzonderlijke tactische productbesluiten blijven open. Fase 3 blijft geblokkeerd.


### Fase 2 — Prejs (1978) primaire blankvoornbron toegevoegd (20 november 2026)

De volledige primaire PDF van Prejs (1978) is gecontroleerd. Deze geeft dieetgebonden dag-/nachtvoedingsinformatie voor macrophyten-etende blankvoorn en passage-rate-schattingen voor dagelijkse planteninname. De auteur waarschuwt expliciet tegen generalisatie naar de soort als geheel; voedselgilde, populatie, leeftijd en omgeving zijn bepalend. Geen overdracht naar method-feederpellets of thermische curve. Registry telt 93 records, 0 numeriek goedgekeurd; zie audit §147.


### Fase 2 — Prejs (1978) toegevoegd als 93e bron (20 november 2026)

PR #191 voegt Prejs (1978) toe na volledige primaire PDF-controle. Het betreft dieetgebonden veldbewijs voor macrophyten-etende blankvoorn en een passage-rate-schatting van dagelijkse planteninname; geen soortbrede, pellet- of thermische respons. Registry telt 93 records, 0 numeriek goedgekeurd. Zowel de exacte PR-head als de mergecommit Quality Gate zijn volledig geslaagd. Zie audit §§147–148.


### Fase 2 — normalisatie- en coveragecontract vastgelegd (21 november 2026)

Audit §171 en architectuur §140 leggen de normalisatievolgorde, respons-/factoruitkomstmetadata, expliciete inputstatussen, ontbrekende-data-regels, overlappreventie en chronologische baseline-evaluatie vast. Dit is ontwerpdocumentatie, geen runtime-activatie: geen gewichten, scoremapping, biologische factor of tijdvakbonus gewijzigd.

De actuele Research Registry telt 93 unieke records, waarvan 0 numeriek goedgekeurd voor directe voorspelling. De thermische optie A blijft de enige bestaande numerieke baseline-uitzondering. Directe lokale labels voor biologische activiteit en voedselopname ontbreken; vangsten en aanbeten vervangen die labels niet. Punt 5 (voorvoer-confidence-gating) is technisch gesloten in audit §170. De optionele hengel-/methodepreset blijft een afzonderlijke UX-keuze. Fase 2 is niet geaccepteerd; Fase 3 blijft geblokkeerd.

Hervattingspunt: maak de labelbeschikbaarheid en evaluatievensters per responsfamilie concreet op basis van de bestaande sessie-/snapshotdata en de registry. Bepaal expliciet welke biologische responsen met huidige of realistisch verkrijgbare data toetsbaar zijn en welke alleen als context/onbekend kunnen blijven. Geen extra verplichte registratievelden en geen runtimegewichten.


### Fase 2 — lokale labelhaalbaarheid gecontroleerd (21 november 2026)

De read-only audit in FASE2_PROGNOSE_AUDIT.md §172 heeft de bestaande sessie-, vangst-, aanwezigheid-, hengel- en temperatuurvelden tegen hun werkelijke betekenis gecontroleerd. De huidige dataset ondersteunt temperatuurvoorspellingsvalidatie, persoonlijke vangstkans en beperkte kwalitatieve/exposure-aware context, maar geen directe onafhankelijke labels voor fysiologische activiteit, voedselopname of biologische tijdvakvoorkeur.

Aasbellen/bodemwoeling is alleen een subjectieve sessiebrede observatie zonder eigen tijdstip of intensiteit; vangsttijden zijn automatisch voorgesteld of door de gebruiker aangepast en blijven vangbaarheids-/uitkomstdata, geen directe voedingslabels. Er zijn geen velden, verplichte invoer, runtimecode of historische data gewijzigd.

Hervattingspunt: maak een respons- en evaluatiematrix met per respons de beschikbare labelbron, kwaliteitsfilters, evaluatiemetric, haalbaarheid nu en afhankelijkheid van toekomstige optionele observaties. Fase 2 blijft open; Fase 3 geblokkeerd.


### Fase 2 — respons- en evaluatiematrix vastgelegd (21 november 2026)

Audit §173 en architectuur §142 leggen per responsfamilie de bestaande labelbron, kwaliteitsfilters, evaluatiemetric en haalbaarheid vast. Watertemperatuur kan tegen latere fysieke meetevents worden gevalideerd met MAE/RMSE/bias en strikte forecast-as-of/provenance-controle. Persoonlijke vangstkans blijft apart en gebruikt de bestaande Brier-/kalibratie- en chronologische BSS-regels. Tijdvakvangsten zijn uitsluitend exposure-aware vangbaarheidscontext. Aanwezigheidssignalen blijven kwalitatief. Directe fysiologische activiteit, kwantitatieve voedselopname en biologisch voedingsritme zijn niet onafhankelijk toetsbaar met de huidige lokale labels.

Er zijn geen actuele lokale aantallen of coveragepercentages geclaimd: persoonlijke IndexedDB-data zijn niet beschikbaar via GitHub en de nieuwe meetreeks start volgens afspraak vanaf nul. De bestaande softwareminimums voor Brier/BSS zijn geen wetenschappelijke steekproefcriteria. Geen code, database, gebruikersdata, verplichte invoer, score of gewicht gewijzigd.

Hervattingspunt: inspecteer read-only of bestaande fysieke temperatuurmeetevents en immutable prognosesnapshots via de huidige opslag-/evaluatieketen chronologisch en zonder future leakage te koppelen zijn. Daarna kan alleen de uitvoerbare temperatuur- en persoonlijke-vangkansvalidatie worden voorbereid; biologische activiteit/voedingsvalidatie blijft afhankelijk van directe labels. Fase 2 blijft open; Fase 3 geblokkeerd.


### Fase 2 — begrenzing temperatuurvalidatiekoppeling vastgesteld (21 november 2026)

Read-only controle in audit §174 laat zien dat alle geldige sessiegebonden temperatuurmeetevents de historische temperatuurprofielcollector kunnen voeden, maar de huidige forecast-evaluatie slechts één scalaire sessiemeting per gekoppelde sessiestartsnapshot gebruikt. De bestaande pair-filter controleert forecast vóór meettijd en dezelfde lokale datum, niet exacte overeenkomst van het voorspelde thermische doelmoment met het fysieke meetmoment. MAE/RMSE/bias worden vanaf vijf paren getoond; lokale biaskalibratie vraagt acht paren op dezelfde stek en in hetzelfde seizoen. Dit zijn softwaredrempels, geen wetenschappelijke acceptatie.

Hervattingspunt: ontwerp read-only een veilige koppeling van afzonderlijke meetevents aan uitsluitend passende, vooraf vastgelegde voorspellingen, inclusief doelmomentmatching, deduplicatie en legacycompatibiliteit. Geen runtimecode, schema, historische data, scores, temperatuurbanden of gebruikersinvoer gewijzigd. Fase 2 blijft open; Fase 3 geblokkeerd.


### Fase 2 — ontwerp eventniveau-temperatuurvalidatie vastgelegd (21 november 2026)

Audit §175 en architectuur §144 beschrijven een read-only ontwerp om afzonderlijke fysieke temperatuurmeetevents aan vooraf vastgelegde prognoses te koppelen. Het ontwerp vereist dezelfde sessie/locatie, forecast vóór meetmoment, expliciet thermisch doelmoment, unieke event-/snapshottoewijzing en uitsluiting bij ambiguïteit. Events en legacy scalaire sessiesamenvatting worden niet dubbel geteld. Meerdere events uit één sessie gelden niet als onafhankelijke sessies; eventniveau-evaluatie wordt aanvankelijk gescheiden gehouden van biascalibratie.

De tijdtolerantie tussen thermisch doelmoment en fysieke meettijd is nog niet onderbouwd en wordt niet door mij ingevuld. Hervattingspunt: controleer read-only de semantiek van thermalAnalysis.targetTimestamp bij sessiestart- en sessie-updateprognoses; leg daarna een onderbouwde keuze ter goedkeuring voor. Geen runtimecode, schema, IndexedDB, gebruikersdata, snapshots, temperatuurcurves, scores of gewichten gewijzigd. Fase 2 blijft open; Fase 3 geblokkeerd.


### Fase 2 — ontbreken expliciet thermisch doelmoment bevestigd (21 november 2026)

Read-only controle in audit §176 bevestigt dat waterThermalEngine.targetTimestamp alleen wordt opgeslagen wanneer expliciet targetTime is doorgegeven. De algemene thermische analyse in sessiestart- en sessie-updateprognoses krijgt die parameter niet. Interne tijdvakberekeningen gebruiken wel een representatief doelmoment, maar slaan de bijbehorende thermische analyse niet op in TimeSlotAnalysis. targetWindowStart/End en forecastTimestamp zijn geen vervanging.

Daarom zijn de huidige opgeslagen sessiesnapshots onvoldoende om meerdere meetevents betrouwbaar aan predictedWaterTemperature te koppelen. Hervattingspunt: vergelijk twee ontwerpvarianten — voorspelling voor een concreet meetdoelmoment of vooraf vastgelegde tijdvakvoorspellingen — en leg de keuze voor vóór implementatie. Geen code, schema, IndexedDB, gebruikersdata, snapshots, prognose-uitkomsten, temperatuurcurves, scores of gewichten gewijzigd. Fase 2 blijft open; Fase 3 geblokkeerd.


### Fase 2 — eigenaar kiest route A voor temperatuurmeetvalidatie (21 november 2026)

De eigenaar heeft route A gekozen: één concreet thermisch meetdoelmoment, met één optionele watertemperatuurmeting per vissessie als normale praktische werkwijze. Er komt geen dagelijkse meetplicht of verplicht tweede meetmoment. Dit is geen hard maximum op de bestaande eventopslag; historische gegevens en compatibiliteit blijven behouden.

Een meetevent telt alleen als forecast-evaluatiepaar wanneer het aan één immutable, vóór de fysieke meting vastgelegde voorspelling met expliciet targetTimestamp en correcte forecast-as-of kan worden gekoppeld. De koppeling verwijst bij voorkeur naar de bestaande snapshot, zodat voorspelde waarden niet onnodig dubbel worden opgeslagen. Legacy events zonder zo'n vooraf vastgelegde voorspelling blijven bruikbaar voor temperatuurprofielen, maar niet voor deze forecast-evaluatie. Route B (vier tijdvakvoorspellingen) is afgevallen.

De concrete meet-/sessiestartworkflow en eventuele tijdtolerantie tussen doelmoment en meetmoment moeten nog technisch worden uitgewerkt; er wordt geen marge verzonnen. Dit besluit wijzigt nog geen runtimecode, schema, IndexedDB of gebruikersdata. Hervattingspunt: controleer de bestaande meetinvoer- en sessiestartflow en werk de minimale compatibele implementatie met regressietests uit. Fase 2 blijft open; Fase 3 geblokkeerd.

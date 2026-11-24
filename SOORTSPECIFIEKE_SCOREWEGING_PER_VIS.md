# Soortspecifieke scoreweging per vissoort

**Status:** uitgewerkte soortinventarisatie en voorlopige weegvolgorde; geen nieuwe numerieke gewichten geactiveerd.  
**Bronnen:** operationele soortprofielen in `src/services/fishProfiles.ts` en bewijsregistraties in `src/services/researchRegistry.ts`.  
**Reikwijdte:** de negen concrete vissoorten in Vislogboek. `Overig` krijgt geen biologisch soortprofiel of eigen soortscore zolang niet duidelijk is welke soort bedoeld wordt.

## Belangrijke rekenregel voor alle soorten

De vier prognose-uitkomsten blijven gescheiden: (1) fysiologische activiteit, (2) voedings-/foerageeractiviteit, (3) lokale aanwezigheid/habitat en (4) uiteindelijke vangkans. Een factor mag alleen meetellen in de uitkomst die de bron daadwerkelijk heeft onderzocht.

Per soort wordt de volgorde hieronder gebruikt om later gewichten vast te stellen. Dit is een **relatieve prioriteit**, geen percentageverdeling. In het research register staat momenteel geen enkele registratie op `approvedForPrediction: true`. De geregistreerde studies mogen daarom nog niet als numerieke bonus of correctiefactor in de runtime-score worden geactiveerd.

Waar de bestaande engine al een thermische activiteitsscore berekent, blijft watertemperatuur de huidige primaire numerieke basis. De profielcurve en parameters zijn echter voorlopige modelprioren en niet gevalideerd als lokale vangst- of voedingscurve. Andere factoren worden niet stilzwijgend bij de score opgeteld.

## Per vissoort

### 1. Karper (*Cyprinus carpio*)

| Uitkomst | Voorlopige weegvolgorde | Wat de informatie wel/niet ondersteunt |
|---|---|---|
| Fysiologische activiteit | 1. Watertemperatuur; 2. temperatuurverloop/acclimatisatie zodra meetbaar; 3. zuurstof alleen bij betrouwbare meting | Temperatuur/metabolisme is biologisch relevant. Zuurstoftekort kan voedselopname sterk drukken, maar de beschikbare hypoxiestudie gebruikte ernstige tankcondities; geen veldgewicht afleiden. |
| Voedingsactiviteit | 1. Directe soortspecifieke voedselopname/voedingsintensiteit; 2. context van dagritme en licht; 3. temperatuur als beïnvloedende context | Veldstudies laten uiteenlopende ritmes zien (ochtend/avond, nacht of geen duidelijke piek). Geen universele nachtbonus. Voedseltype, watertype en bijvoeren begrenzen overdraagbaarheid. |
| Aanwezigheid/habitat | 1. Lokale waarnemingen en habitatcontext; 2. diepte/dekking/waterbeweging als kwalitatieve aanwijzingen | Er is habitat- en bewegingsliteratuur, maar geen gevalideerde lokale aanwezigheidskans voor de stek. |
| Vangkans | 1. Echte karpervangsten per sessieduur en inspanning; daarna techniek, tijdvak en locatie | Geen voldoende lokale dataset voor nieuwe soortspecifieke vangstgewichten. |

**Kortom:** temperatuur is de huidige basis voor activiteit; voor azen zijn directe voedselopname en contextueel dagritme belangrijker dan algemene weersbonussen. Geen vast nacht- of zuurstofpercentage.

### 2. Brasem (*Abramis brama*)

| Uitkomst | Voorlopige weegvolgorde | Wat de informatie wel/niet ondersteunt |
|---|---|---|
| Fysiologische activiteit | 1. Watertemperatuur; 2. temperatuur-/seizoenscontext | Metabolisme is bij meerdere temperaturen onderzocht, maar de profielcurve blijft voorlopig. |
| Voedingsactiviteit | 1. Directe voedselopname/zoöplanktonconsumptie; 2. levensfase en voedseltype; 3. licht/dag-nachtritme als context | Subadult/volwassen brasem kan overdag zoöplankton consumeren; juveniele pelagische brasem kan 's nachts eten. Filtervoeding/prooigrootte is geen algemene aas- of intensiteitsscore. |
| Aanwezigheid/habitat | 1. Lokale waarnemingen; 2. troebelheid en habitatcontext; 3. wind alleen indirect via mogelijke resuspensie | Meerjarige PIT-studie koppelde activiteit aan troebelheid in één ondiep meer. Dat bewijst geen zelfstandige windbonus of universele troebelheidsdrempel. |
| Vangkans | 1. Echte brasemvangsten per inspanning; daarna tijdvak, locatie en techniek | Geen gevalideerde lokale vangstkansgewichten beschikbaar. |

**Kortom:** watertemperatuur blijft de huidige activiteitsbasis. Voor voedingsgedrag zijn levensfase, voedseltype en gemeten consumptie belangrijk; troebelheid is hooguit een contextfactor voor activiteit/habitat.

### 3. Snoek (*Esox lucius*)

| Uitkomst | Voorlopige weegvolgorde | Wat de informatie wel/niet ondersteunt |
|---|---|---|
| Fysiologische activiteit | 1. Watertemperatuur; 2. licht/zicht als afzonderlijke gedragscontext | Temperatuur beïnvloedt fysiologie, maar de huidige thermische curve is geen gevalideerde veldcurve voor volwassen snoek. |
| Voedings-/jachtactiviteit | 1. Directe voedselopname/jachtwaarneming; 2. licht, zicht en prooicontext; 3. temperatuur als fysiologische randvoorwaarde | Hartslagtelemetrie geeft directe voedingscontext maar kleine steekproef. Bewegingsactiviteit is niet hetzelfde als jacht of eten; juveniele dagritmes niet zonder meer op volwassen snoek toepassen. |
| Aanwezigheid/habitat | 1. Lokale waarnemingen en dekking/prooihabitat; 2. zichtbaarheid en schemercontext; 3. temperatuur/diepte als habitatcontext | Studies ondersteunen habitatwisselingen en beweging, maar geen lokale aanwezigheidskans. Stilstand kan hinderlaagjacht zijn en mag niet als inactiviteit worden geïnterpreteerd. |
| Vangkans | 1. Echte snoekvangsten per inspanning; daarna kunstaas/techniek, tijdvak en locatie | Er is geen voldoende lokale dataset voor numerieke vangstgewichten. |

**Kortom:** temperatuur voor fysiologische potentie; zicht, licht en prooicontext voor jacht/habitat. Niet simpelweg meer beweging gelijkstellen aan meer jacht.

### 4. Baars (*Perca fluviatilis*)

| Uitkomst | Voorlopige weegvolgorde | Wat de informatie wel/niet ondersteunt |
|---|---|---|
| Fysiologische activiteit | 1. Watertemperatuur; 2. lichaamsgrootte/thermische context indien bekend | Aerobe scope en zuurstofverbruik zijn temperatuur- en lichaamsgrootteafhankelijk. De huidige profielcurve is voorlopig. |
| Voedings-/jachtactiviteit | 1. Directe voedingsmetingen; 2. seizoen en licht/dagritme; 3. zicht/prooicontext | Veldstudies tonen seizoensafhankelijke dagritmes. Een gemeten bewegingspiek is geen directe voedselopnamepiek. |
| Aanwezigheid/habitat | 1. Lokale waarnemingen; 2. temperatuur en licht; 3. wind/druk alleen als zwakke context | Telemetrie van volwassen baarzen vond temperatuur en licht sterker dan druk en wind voor beweging; één meer en een specifieke volwassen populatie. Geen universele druk- of windbonus. |
| Vangkans | 1. Echte baarsvangsten per inspanning; daarna techniek, locatie en tijdvak | Externe vangst-rate studies zijn geen vervanging voor lokale persoonlijke kalibratie. |

**Kortom:** temperatuur en licht hebben de sterkste biologische basis voor beweging; voeding en vangkans moeten apart worden onderbouwd. Druk en wind krijgen geen zelfstandig hoog gewicht.

### 5. Blankvoorn (*Rutilus rutilus*)

| Uitkomst | Voorlopige weegvolgorde | Wat de informatie wel/niet ondersteunt |
|---|---|---|
| Fysiologische activiteit | 1. Watertemperatuur; 2. lichaamsgrootte en seizoenscontext indien bekend | Metabolisme is temperatuur- en grootteafhankelijk; de profielcurve blijft voorlopig. |
| Voedingsactiviteit | 1. Directe voedselopname; 2. voedselgilde/levensfase; 3. seizoen en licht/dagritme | Dag-/schemerritme verschilt met seizoen, habitat en leeftijd. Resultaten voor plantenetende vis zijn niet automatisch toepasbaar op pellet- of ander hengelaas. |
| Aanwezigheid/habitat | 1. Lokale waarnemingen; 2. helderheid/troebelheid en vegetatie; 3. seizoensmigratie alleen waar waterverbindingen vergelijkbaar zijn | Migratieonderzoek uit één meer-stroomsysteem is niet zomaar toepasbaar op geïsoleerde plassen. |
| Vangkans | 1. Echte blankvoornvangsten per inspanning; daarna aas/techniek, locatie en tijdvak | Geen lokale numerieke vangstgewichten beschikbaar. |

**Kortom:** temperatuur is de huidige fysiologische basis; voedingsritme moet worden uitgesplitst naar voedseltype, levensfase en seizoen. Migratiebewijs niet als lokale stekbonus gebruiken.

### 6. Zeelt (*Tinca tinca*)

| Uitkomst | Voorlopige weegvolgorde | Wat de informatie wel/niet ondersteunt |
|---|---|---|
| Fysiologische activiteit | 1. Watertemperatuur; 2. seizoen als biologische context | Er is nog weinig direct, overdraagbaar bewijs voor een exacte activiteitcurve; de profielparameters zijn voorlopig. |
| Voedingsactiviteit | 1. Directe veldmetingen van voedingsintensiteit/ritme; 2. seizoen en licht/nachtcontext; 3. temperatuur | Er zijn studies naar nachtelijke activiteit en seizoensgebonden voeding, maar beperkte overdraagbaarheid en beperkte bewijssterkte. Paaitemperatuur/groei zijn geen dagelijkse voedingsscore. |
| Aanwezigheid/habitat | 1. Lokale waarnemingen; 2. vegetatie, bodem en beschutting als kwalitatieve context | Geen gevalideerde lokale habitatkans. Informatie over karper-aasontmoeting is geen bewijs voor dezelfde respons bij zeelt. |
| Vangkans | 1. Echte zeeltvangsten per inspanning; daarna techniek, aas, tijdvak en locatie | Geen lokale numerieke vangstgewichten beschikbaar. |

**Kortom:** zeelt heeft een terughoudende, bewijsarme weging nodig. Temperatuur is voorlopig de enige bestaande numerieke fysiologische basis; nacht-/seizoensinvloed blijft kwalitatief totdat direct bewijs sterker is.

### 7. Snoekbaars (*Sander lucioperca*)

| Uitkomst | Voorlopige weegvolgorde | Wat de informatie wel/niet ondersteunt |
|---|---|---|
| Fysiologische activiteit | 1. Watertemperatuur; 2. zuurstof/aerobe scope alleen met betrouwbare soort- en contextdata | Er is fysiologisch temperatuuronderzoek, maar geen gevalideerde lokale activiteit- of vangstcurve. |
| Voedings-/jachtactiviteit | 1. Directe voedselopname; 2. seizoen/licht en prooigrootte; 3. temperatuur als context | Studies behandelen seizoensvoeding, dagelijkse voedselopname en dieet/prooikeuze. Dieet of prooikeuze is niet automatisch voedingsintensiteit of een vaste schemerbonus. |
| Aanwezigheid/habitat | 1. Lokale waarnemingen; 2. diepte/licht en habitatcontext; 3. seizoensbeweging | Telemetrie ondersteunt dagritme en habitatgebruik in specifieke rivieren/kanalen; geen universele lokale aanwezigheidskans. |
| Vangkans | 1. Echte snoekbaarsvangsten per inspanning; daarna techniek, diepte, locatie en tijdvak | Geen lokale numerieke vangstgewichten beschikbaar. |

**Kortom:** temperatuur voor fysiologische potentie; diepte/licht en directe voedingsgegevens voor jacht/habitat. Dieet- en paaigegevens niet omzetten naar een dagelijkse vangstbonus.

### 8. Meerval (*Silurus glanis*)

| Uitkomst | Voorlopige weegvolgorde | Wat de informatie wel/niet ondersteunt |
|---|---|---|
| Fysiologische activiteit | 1. Watertemperatuur; 2. seizoen als context | Het soortprofiel is voorlopig; de literatuurinventaris bevat meer beweging/habitat- dan directe thermische veldmetingen. |
| Voedingsactiviteit | 1. Directe voedselopname/foerageermeting; 2. seizoen en dag-nachtritme; 3. prooicontext | Er zijn studies naar voedingsritme, waaronder juveniele nachtelijke foerageeractiviteit. Leeftijd/levensfase en onderzoeksopzet beperken overdraagbaarheid naar volwassen wilde meerval. |
| Aanwezigheid/habitat | 1. Lokale waarnemingen; 2. seizoen, diepte en habitat; 3. dag-nachtbeweging als context | Telemetrie beschrijft seizoens- en daggebonden beweging, overwintering en habitatgebruik; beweging is geen directe voedselopname. |
| Vangkans | 1. Echte meervalvangsten per inspanning; daarna techniek, aas, locatie en tijdvak | Geen lokale numerieke vangstgewichten beschikbaar. |

**Kortom:** habitatbeweging en dag-nachtritme zijn relevante context, maar mogen niet worden verward met eten. Geen automatische nachtbonus zonder passende volwassen velddata.

### 9. Roofblei (*Leuciscus aspius*)

| Uitkomst | Voorlopige weegvolgorde | Wat de informatie wel/niet ondersteunt |
|---|---|---|
| Fysiologische activiteit | 1. Watertemperatuur; 2. seizoen als context | Het thermische profiel is voorlopig; de geregistreerde soortliteratuur richt zich vooral op beweging, habitat en dieet. |
| Voedings-/jachtactiviteit | 1. Directe voedselopname/voedingsfrequentie; 2. prooitype en levensfase; 3. seizoen/licht als context | De beschikbare registraties beschrijven vooral dieet, prooikeuze en voedingsincidentie. Dieet alleen levert geen dagelijkse intensiteit of tijdvakscore op. |
| Aanwezigheid/habitat | 1. Lokale waarnemingen; 2. rivier-/meerhabitat en seizoensbeweging; 3. licht/tijdvak als context | Telemetrie en bewegingsstudies ondersteunen habitat- en seizoenspatronen in specifieke systemen; geen lokale stek-kans. |
| Vangkans | 1. Echte roofbleivangsten per inspanning; daarna techniek, locatie en tijdvak | Geen lokale numerieke vangstgewichten beschikbaar. |

**Kortom:** voorlopig vooral habitat-/bewegingscontext; voor een numerieke voedingsscore ontbreken directe, overdraagbare voedingsmetingen. Geen afgeleide schemer- of oppervlaktebonus zonder bewijs.

## Gemeenschappelijke berekening zodra gewichten zijn onderbouwd

Voor elke soort en elke afzonderlijke uitkomst wordt dezelfde transparante rekenvorm gebruikt:

**Score = Σ(deelscore × soortspecifiek gewicht) / Σ(actieve soortspecifieke gewichten)**

- Iedere deelscore staat op een schaal van 0–100 en beschrijft één duidelijk gedefinieerde respons.
- De gewichten verschillen per soort én per uitkomst; ze worden pas numeriek ingevuld na bewijsbeoordeling en expliciete modelgoedkeuring.
- Niet-onderbouwde factoren krijgen geen gewicht en worden niet als neutraal of gemiddeld ingevuld.
- Bij ontbrekende invoer wordt de onzekerheid zichtbaar gemaakt; de score mag niet doen alsof alle factoren bekend zijn.
- Correlaties worden gecontroleerd om dubbeltelling te voorkomen, bijvoorbeeld seizoen versus watertemperatuur.
- Vangkans wordt later apart gekalibreerd met echte vangsten en sessieduur/inspanning; nooit door de activiteitsscore simpelweg als vangstpercentage te gebruiken.

## Wat dit document nadrukkelijk niet beweert

1. De prioriteitsvolgorde is geen wetenschappelijk vastgesteld percentagegewicht.
2. Een bron met `moderate` of `limited` bewijs is niet automatisch goedgekeurd voor directe modeltoepassing.
3. De geregistreerde literatuur is niet gelijkmatig sterk voor alle soorten en alle uitkomsten.
4. Synthetische tests kunnen de rekenlogica controleren, maar bewijzen niet dat de soortweging biologisch voorspellend is.
5. De huidige soortprofielen en thermische parameters blijven voorlopige modelinstellingen; deze inventarisatie wijzigt de runtime-score niet.

## Vervolgstatus

Deze inventarisatie legt per soort vast welke factoren voorlopig voorrang hebben en welke grenzen aan het bewijs gelden. De volgende inhoudelijke stap is per soort en uitkomst de onderliggende bewijsregistraties te beoordelen op directe meetrespons, levensfase, watertype, overdraagbaarheid en onzekerheid. Pas daarna kan een numeriek gewicht worden voorgesteld. Tot die expliciete goedkeuring blijft de bestaande runtime ongewijzigd.

---

# 8. Herzien modelontwerp — gescheiden biologische uitkomsten (v0.2)

**Status:** inhoudelijk herzien voorstel na beoordeling van PR #223; sluit aan op de gekozen architectuur in `MODELARCHITECTUUR_FASE2.md`. Geen percentages vastgesteld, geen numerieke factoren goedgekeurd en geen runtimewijziging.

## 8.1 Besluit: geen samengestelde activiteit-en-voedingsscore

De eerdere tabel met percentages uit modelprior v0.1 wordt **ingetrokken**. De verdeling van één scorebudget over fysiologische activiteit, voedingsrespons, licht, beweging en seizoen vermengde verschillende biologische uitkomsten. De percentages waren niet afgeleid uit vergelijkbare effectgroottes en mogen niet als uitgangspunt voor runtime-implementatie worden gebruikt.

De vier uitkomsten blijven gescheiden:

1. **Fysiologische activiteitspotentie:** thermische/fysiologische prestatiecapaciteit onder de omstandigheden. Dit is geen directe meting van zwemmen, azen of vangbaarheid.
2. **Voedings-/foerageeractiviteit:** voedselopname en foerageergedrag. Voedselopname, voedingsincidentie, voedingsritme en zoeken/prooi benaderen blijven afzonderlijke meetuitkomsten.
3. **Lokale aanwezigheid en habitatgeschiktheid:** of de soort zich op of nabij de gekozen plek kan bevinden. Dit is geen activiteitsscore.
4. **Uiteindelijke vangkans:** empirische kans binnen de gekozen sessieduur en inspanning, gebaseerd op echte vangst- en sessiegegevens.

Deze uitkomsten mogen elkaar informeren, maar niet onderling vervangen of tot één ongedifferentieerde score worden opgeteld. Een eventueel UI-besluit over het tonen van de afzonderlijke uitkomsten staat los van deze biologische modelgrens.

## 8.2 Wat wordt per uitkomst precies gemeten?

| Uitkomst | Doelvariabele | Geschikte bronrespons | Geen geldige vervanging |
|---|---|---|---|
| Fysiologische activiteitspotentie | Thermische/fysiologische prestatiecapaciteit | Soort- en levensfasepassende temperatuurrespons, aerobe scope of andere expliciet benoemde fysiologische maat | Maagvulling, dieet, telemetrische locatieverandering, vangstpercentage |
| Voedingsactiviteit | Daadwerkelijke voedselopname/intensiteit, met expliciete meetdefinitie | Voedselopname per tijdseenheid, maagvulling als begrensde proxy, directe voedingsfrequentie of passend voedingsritme | Dieet/prooikeuze, groei, alleen prooiaanwezigheid, alleen beweging |
| Foerageergedrag | Zoek-, graas-, aanval- of prooibenaderingsgedrag | Direct geobserveerde foerageerfrequentie of gedragsregistratie | Automatische gelijkstelling aan opgenomen voedsel |
| Lokale aanwezigheid/habitat | Aanwezigheid, habitatgebruik of geschiktheid | Lokale detecties, telemetrie/presence-data, habitatrespons in passend watertype | Algemene activiteit of voedselopname |
| Vangkans | Vangst per sessie/inspanning | Echte vangsten met vooraf vastgelegde prognose, sessieduur en context | Een biologische activiteitsscore als percentage |

Eén studie kan meerdere uitkomsten meten, maar alleen wanneer de meetmethoden dat afzonderlijk aantonen. Dezelfde telemetrische verplaatsing mag niet tegelijk als fysiologische activiteit, voedingsintensiteit en aanwezigheid worden geteld zonder aparte responsmetingen.

## 8.3 Factorrollen en rekenbehandeling

Factoren krijgen eerst een causale/meetkundige rol. Pas daarna wordt beoordeeld of ze binnen een specifieke uitkomst numeriek kunnen bijdragen.

| Factor of begrip | Primaire rol | Behandeling |
|---|---|---|
| Watertemperatuur | Omgevingsdriver van fysiologische respons; kan voeding beïnvloeden | Afzonderlijke soortspecifieke responscurve per uitkomst. De fysiologische curve mag niet automatisch als voedingscurve worden hergebruikt. |
| Temperatuurverloop/acclimatisatie | Modulator van thermische respons | Onderdeel van de thermische respons; geen tweede temperatuurbonus. Alleen gebruiken als meetgeschiedenis extra informatie toevoegt. |
| Zuurstof | Mogelijke fysiologische/gedragsmatige limiter | Geen gewone optelbonus. Alleen begrenzing/modifier bij betrouwbare meting en soort-, levensfase- en contextpassend bewijs. Geen universele drempel aannemen. |
| Licht, fotoperiode en dagritme | Tijdgebonden omgevingsdriver/modulator | Afzonderlijke soort- en uitkomstspecifieke respons. Geen algemene ochtend-, nacht- of schemerbonus. |
| Seizoen/biologische fase | Langzame context/modulator | Gebruik waar mogelijk aantoonbare biologische fase of seizoensrespons. Geen kalenderbonus en geen dubbeltelling met temperatuur of fotoperiode. |
| Locomotorische activiteit/visbeweging | Gemeten gedragsrespons of mogelijke uitkomst | Niet als zelfstandige oorzaak naast factoren die dezelfde beweging verklaren. Alleen gebruiken als expliciet gemeten doelvariabele of voor passende bewegings-/aanwezigheidsanalyse. |
| Stroming/waterbeweging | Omgevingsdriver en habitatcontext | Alleen numeriek binnen een specifieke uitkomst bij een gemeten respons. Niet verwarren met beweging van de vis. |
| Wind, luchtdruk en neerslag | Indirecte omgevingscontext | Geen zelfstandige bonus zonder onafhankelijke soortspecifieke respons. Mogelijke routes via menging, instroom, troebelheid, temperatuur of zuurstof expliciet modelleren en niet dubbel tellen. |
| Bewolking, zoninstraling en luchttemperatuur | Indirecte invoer voor waterthermiek of licht | Alleen via de relevante tussenliggende meting/schatting; niet daarnaast als scorebonus. |
| Troebelheid/zicht | Contextuele driver voor zicht, predator-prooi-interactie en habitatgebruik | Alleen conditioneel met passende soort-, gedrag- en watertypegegevens; effectrichting niet universeel vastleggen. |
| Diepte, bodem, vegetatie, beschutting en watertype | Habitatgeschiktheid/aanwezigheid | In habitatlaag, niet als algemene fysiologische of voedingsbonus. |
| Prooiaanbod | Voedselbeschikbaarheid/context | Alleen numeriek bij lokale, passende prooigegevens en aantoonbare relatie met de bedoelde voedingsrespons. Niet gelijkstellen aan voedselopname. |
| Dieet/prooikeuze | Beschrijving van gegeten prooien | Ecologische context; op zichzelf geen maat voor voedingsintensiteit of timing. |
| Paai, migratie en overwintering | Levenscyclus- of verplaatsingscontext | Alleen als de bron een relevante dagelijkse fysiologische of voedingsrespons meet. Migratie/aggregatie is niet automatisch meer azen. |
| Aas, voer, voorvoeren, hengeldruk en techniek | Visserij-/vangstcontext | Buiten biologische uitkomsten; eventueel relevant voor tactiek of de afzonderlijke empirische vangkans. |

## 8.4 Responscurves: gewicht alleen is niet genoeg

Voor iedere numeriek toegelaten factor moet vóór weging de respons zijn gedefinieerd:

- **Richting:** neemt de gemeten uitkomst toe, af, blijft deze gelijk of verandert de richting per bereik?
- **Vorm:** optimumcurve, drempel, verzadiging, monotone relatie, tijdvenster of interactie.
- **Bereik:** binnen welke gemeten temperatuur-, licht-, zuurstof- of andere band is de relatie waargenomen?
- **Soort en levensfase:** welke soort, grootte/levensfase, populatie en fysiologische toestand zijn onderzocht?
- **Context:** veld of laboratorium, stilstaand of stromend water, regio, seizoen en voedselregime.
- **Onzekerheid:** spreiding, steekproefomvang, herhaalbaarheid en overdraagbaarheid naar de Nederlandse doelcontext.

Een gewicht beschrijft pas daarna de relatieve bijdrage van een onderbouwde respons binnen één uitkomst. Het bepaalt niet de richting of vorm van die respons.

Voor temperatuur geldt: een thermische performance curve heeft doorgaans een stijgende zone, een optimumgebied en een afname buiten dat gebied. "Warmer is beter" is geen geldige generieke regel. De huidige profielparameters blijven voorlopige priors zolang bronnen geen overdraagbare soort- en uitkomstspecifieke curve ondersteunen.

## 8.5 Limiterende factoren zijn geen gewone opteltermen

Een ernstige beperking kan niet altijd worden gecompenseerd door een gunstige licht-, seizoens- of bewegingsscore. Mogelijke limiterende factoren worden daarom afzonderlijk beoordeeld:

1. Er bestaat een relevante meting of betrouwbare schatting.
2. De bron toont een effect op precies de betreffende uitkomst.
3. De respons past bij soort, levensfase, bereik en watertype.
4. De vorm volgt uit bewijs: bijvoorbeeld drempel, plafonnering, vermenigvuldigende modifier of interactie.
5. Zonder voldoende bewijs wordt geen harde cap of universele grens verzonnen; de factor blijft onbekend of kwalitatieve context.

Zuurstoftekort en thermische extremen zijn kandidaat-limiterende omstandigheden. Dit document stelt geen numerieke grens vast voor karper, meerval of een andere soort. Een grens uit één juveniele, aquacultuur- of laboratoriumstudie mag niet zonder overdraagbaarheidsbeoordeling als harde veldgrens worden gebruikt.

## 8.6 Soortspecifieke consequenties voor de negen profielen

De eerdere soortinventarisatie en bronrecord-ID's blijven bruikbaar als bewijsindex, maar deze interpretatie geldt:

- **Karper:** voedingsritmes verschillen tussen natuurlijke, bijgevoerd- en aasstationcontexten. Geen universele nachtbonus. Zuurstof alleen als mogelijke limiter bij passende meting; ernstige tankhypoxie is geen algemene veldcorrectie. Bronnen: `common-carp-temperature-feeding-rhythm-2012`, `common-carp-juvenile-foraging-temperature-2012`, `common-carp-adult-bait-site-night-feeding-2018`, `common-carp-wild-night-feeding-lake-2010`, `common-carp-wild-bait-station-feeding-2022`, `common-carp-simulated-pond-no-distinct-diel-peak-2008`, `common-carp-wild-river-diel-feeding-1992`.
- **Brasem:** zoöplanktonconsumptie, maagvulling en telemetrische activiteit zijn verschillende uitkomsten. Troebelheid uit één ondiep meer is geen universele voedingsfactor. Bronnen: `bream-in-situ-diel-zooplankton-consumption-2004`, `bream-roach-in-situ-diel-zooplankton-feeding-2004`, `roach-bream-metabolic-rate-temperature-2006`, `bream-activity-turbidity-shallow-lake-2019`.
- **Snoek:** hartslag-/voedingsmetingen, juveniele functionele respons en habitatwisselingen blijven afzonderlijk. Schemerige habitatverplaatsing bewijst geen schemerpiek in voedselopname. Bronnen: `northern-pike-heart-rate-feeding-day-1991`, `northern-pike-functional-response-temperature-browning-2026`, `northern-pike-field-seasonal-feeding-diet-2025`, `northern-pike-metabolic-rate-temperature-1982`.
- **Baars:** directe voedingsmetingen, aerobe-scope/temperatuur en telemetrische beweging ondersteunen verschillende uitkomsten. Een bewegingsrelatie met licht of temperatuur is niet automatisch een voedingsrelatie. Bronnen: `european-perch-aerobic-scope-size-temperature-2020`, `adult-perch-loch-leven-daily-ration-1977`, `perch-field-diel-feeding-seasonal-diet-1986`, `perch-lake-ladoga-diel-feeding-1982`, `perch-diel-feeding-lake-constance-2021`, `perch-fine-scale-abiotic-movement-lake-2018`.
- **Blankvoorn:** voedselopname en dagritme moeten worden gekoppeld aan voedselgilde, levensfase en watertype. Habitatmigratie en dieetverschuiving zijn geen dagelijkse voedingsintensiteit. Bronnen: `roach-diel-diet-and-habitat-shifts-2002-2004`, `roach-macrophyte-diel-feeding-and-daily-intake-prejs-1978`, `roach-autumnal-diel-feeding-shift-2008`, `roach-diel-feeding-cycle-lake-aydat-1990`, `bream-roach-in-situ-diel-zooplankton-feeding-2004`, `roach-bream-metabolic-rate-temperature-2006`, `roach-diel-movement-clear-turbid-lakes-2004`.
- **Zeelt:** veldmaaginhoud, gecontroleerd zelfvoeren en locomotorisch ritme zijn niet onderling uitwisselbaar. Overdracht tussen onderzoeksopzetten blijft beperkt. Bronnen: `tench-field-diel-seasonal-feeding-2018`, `tench-nocturnal-feeding-locomotor-rhythm-2005`, `tench-temperature-feeding-efficiency-2026`.
- **Snoekbaars:** voedselopname, aerobe scope en dag-/nachtverdeling blijven gescheiden. Lichtrespons mag niet alleen op basis van algemene soortbeschrijvingen een hoger gewicht krijgen. Bronnen: `pikeperch-winter-spring-feeding-temperature-2020`, `pikeperch-feeding-intensity-size-gonad-season-2012`, `pikeperch-lake-ladoga-daily-feeding-rhythm-1982`, `adult-pikeperch-aerobic-scope-temperature-2012`, `pikeperch-diel-activity-dusk-drainage-canal-2005`, `pikeperch-diel-distribution-elbe-river-2008`.
- **Meerval:** nachtelijke voedselopname bij vroege juvenielen mag niet worden gegeneraliseerd naar volwassen dieren. Volwassen telemetrische beweging/dieptegebruik is geen directe voedingsmaat. Temperatuurbegrenzing vereist passende soort- en levensfasegegevens. Bronnen: `wels-catfish-seasonal-diet-feeding-2025`, `european-catfish-diel-feeding-self-feeder-1995`, `wels-catfish-diel-feeding-rhythm-self-feeders-1995`, `juvenile-catfish-night-foraging-reservoirs-2025`, `european-catfish-feeding-and-activity-rhythms-1995-2012`, `adult-catfish-diel-activity-reservoir-2025`.
- **Roofblei:** volwassen telemetrie ondersteunt beweging/activiteit; voedingsincidentie en dieet bij subadulten zijn andere uitkomsten dan dagelijkse voedselopname. Prooivisactiviteit is hooguit indirecte voedingscontext bij lokale gegevens. Geschikt stromend/open habitat hoort bij aanwezigheid/habitat, niet als automatische voedingsbonus. De lage bewijsdekking blijft zichtbaar; 0% in een samengestelde voedingsweging is niet langer een geldige conclusie omdat die samengestelde weging vervalt. Bronnen: `asp-annual-diel-activity-northern-population-2022`, `asp-diel-seasonal-movement-river-lake-2016-2020`, `asp-seasonal-feeding-incidence-danube-2010`.

## 8.7 Tijdschalen en dag-/tijdvakuitvoer

De verschillende uitkomsten mogen hun eigen relevante tijdschaal hebben:

- **Langzame context:** thermische toestand/-historie, seizoen en biologische fase. Deze veranderen doorgaans geleidelijk en worden berekend op het doelmoment.
- **Snelle context:** licht/dagritme, kortdurende zuurstof- of stromingsverandering en tijdgebonden voedingsrespons. Deze kunnen per tijdsegment verschillen en vereisen passende tijdstempels.
- **Daguitkomst:** wordt, zodra dezelfde uitkomst per tijdsegment betrouwbaar beschikbaar is, afgeleid uit chronologische segmenten met passende duurweging. Er komt geen tweede dagformule die andere biologische factoren mengt.
- **Geen vermenging:** een daggemiddelde van fysiologische activiteit mag niet worden gecombineerd met een tijdvakscore voor voeding. Uitkomst en betekenis blijven gelijk binnen de aggregatie.
- **As-of-regel:** gegevens na het doelmoment mogen een eerdere prognose niet beïnvloeden. Ontbrekende uren, onbekende eindtijd en ontbrekende meetwaarden blijven expliciet onbekend.

Dit is een ontwerpregel voor toekomstige modeluitwerking; de huidige dag- en tijdvakberekening wordt hiermee niet gewijzigd.

## 8.8 Hoe gewichten later wél worden vastgesteld

Er komt in deze stap geen nieuwe percentageverdeling. Per soort én per afzonderlijke uitkomst wordt eerst een evidence matrix gevuld met:

1. bronrecord-ID en exacte gemeten responsvariabele;
2. directheid: directe meting, proxy of context;
3. richting en vorm van de respons;
4. gemeten bereik en eventuele limiterende zones;
5. soort, levensfase/grootte en onderzoekscontext;
6. overdraagbaarheid naar Nederlandse veldsituaties;
7. overlap/dubbeltelling met andere factoren;
8. bewijskwaliteit en onzekerheid;
9. toelatingsbesluit: numerieke kandidaat, kwalitatief/context of uitgesloten.

Een numeriek gewicht wordt alleen voorgesteld als er binnen dezelfde uitkomst voldoende vergelijkbare en onafhankelijke responsinformatie bestaat om een rangorde te verdedigen. Bewijskwaliteit alleen levert geen effectgrootte op. Als bronnen geen kwantitatieve rangorde ondersteunen, blijft de factor kwalitatief en wordt geen percentage ingevuld.

Ontbrekende invoer blijft onbekend. De engine mag ontbrekende factoren niet stilzwijgend als nul-effect behandelen, noch de overige gewichten zo herschalen dat de score een schijnbaar volledige dekking suggereert. Scoredekking en onzekerheid moeten afzonderlijk worden vastgelegd; bij ontbrekende essentiële basisinformatie kan een numerieke uitkomst niet verantwoord zijn.

## 8.9 Vervolgvolgorde

1. Koppel per soort de bestaande bronrecords aan de vier afzonderlijke uitkomsten en exacte responsvariabelen.
2. Beoordeel voor fysiologische activiteit eerst thermische respons en mogelijke limiterende omstandigheden.
3. Houd voor voedings-/foerageeractiviteit directe voedselopname, incidentie, ritme en foerageergedrag uit elkaar.
4. Gebruik voor aanwezigheid/habitat uitsluitend passende lokale of habitatresponsgegevens.
5. Leg voor iedere kandidaatfactor responscurve en toepassingsgrenzen vast.
6. Beoordeel pas daarna of een numerieke factorweging binnen die ene uitkomst verdedigbaar is.
7. Laat runtime, UI en opgeslagen snapshots ongewijzigd totdat een afzonderlijk, inhoudelijk goedgekeurd implementatievoorstel bestaat.

**Conclusie:** optie 2 is de gekozen modelrichting. Fysiologische activiteit en voedings-/foerageeractiviteit worden niet samengevoegd. De eerdere percentages uit v0.1 zijn ingetrokken; er is nog geen nieuwe numerieke weging vastgesteld. Habitat/aanwezigheid en persoonlijke vangkans blijven eveneens afzonderlijk.

# 9. Koppeling met \`vismodel_voorstel_v2.xlsx\` — direct bruikbare informatie (24-11-2026)

**Status:** eerste inhoudelijke koppeling; de overige Excel-inhoud is nog niet volledig gevalideerd.  
**Bronbestand:** \`vismodel_voorstel_v2.xlsx\`, versie 2, 11 tabbladen.  
**Uitgangspunt:** het bestaande \`researchRegistry.ts\` blijft de centrale bewijsregistratie. De Excel is een aanvullende bron-/parameterinventaris en wordt niet als tweede soortcatalogus of als gevalideerde modelconfiguratie overgenomen.

## 9.1 Informatie die direct als bewijsinput kan worden benut

Onderstaande bevindingen zijn al terug te vinden in het bestaande onderzoeksregister. Ze kunnen dus nu worden meegenomen in de evidence matrix, met behoud van de genoemde beperkingen. Dit betekent nog niet dat de Excel-parameters of een numeriek gewicht zijn goedgekeurd.

| Soort | Bestaand bronrecord | Wat de bron daadwerkelijk ondersteunt | Toegestane modelrol en grens |
|---|---|---|---|
| Karper | \`common-carp-juvenile-foraging-temperature-2012\` | Experimentele foerageersnelheid van jonge karpers (circa 90–105 mm) bij 16, 20, 24 en 28 °C; hoogste gemeten foerageersnelheid bij 24 °C. | Direct bewijs voor temperatuurafhankelijk foerageergedrag bij juvenielen. Niet zonder meer toepassen op volwassen karper of gebruiken als fysiologische optimumcurve. |
| Karper | \`common-carp-temperature-feeding-rhythm-2012\` | Experimentele voedselopname en voedingsritme bij een Aziatische ondersoort en verschillende temperatuurbehandelingen; zowel temperatuur als tijdstip beïnvloedden de gemeten opname. | Direct bewijs voor voedingsintensiteit/-ritme binnen de onderzochte populatie en proefopzet. Niet als universeel Nederlands dagritme of volwassen veldcurve behandelen. |
| Snoekbaars | \`adult-pikeperch-aerobic-scope-temperature-2012\` | Aerobe scope bij volwassen kweek-snoekbaars; modelmaximum 18,8 °C en afgeleid 80%-bereik 10,4–26,9 °C. Tussen 13 en 25 °C was geen significant verschil in aerobe scope aangetoond. | Fysiologische uitkomst. Geen directe voedings-, jacht- of vangstcurve. De brede niet-significante zone en beperkte 28 °C-steekproef blijven expliciet vermeld. |
| Snoekbaars | \`pikeperch-diel-activity-dusk-drainage-canal-2005\` | Veldonderzoek naar dagactiviteit van volwassen snoekbaars in een drainagekanaal in het voorjaar; gemeten uitkomst is locomotorische activiteit. | Ondersteunt tijdgebonden bewegingsactiviteit in de onderzochte context. Niet gelijkstellen aan voedselopname of een universele schemerbonus. |
| Meerval | \`adult-catfish-northern-fringe-seasonal-diel-movement-2024\` | Telemetrie van volwassen Europese meerval in het Zweedse Möckelnmeer; seizoensafhankelijk verticaal gedrag en verschillen tussen dag en nacht, met individuele en seizoensvariatie. | Ondersteunt seizoens- en tijdafhankelijk bewegings-/habitatgedrag. Geen directe meting van voedselopname; de noordelijke populatiecontext beperkt overdraagbaarheid. |
| Zeelt | \`tench-temperature-feeding-efficiency-2026\` | Experimentele vergelijking bij 18 en 25 °C; bij zeelt werd een lagere maximale voedselopname bij 25 °C dan bij 18 °C gerapporteerd. | Directe aanwijzing voor een niet-monotone temperatuurrelatie met voedselopname. Niet omzetten naar een volledige curve of optimum zonder de broncontext en meetgegevens nader te controleren. |
| Brasem en blankvoorn | \`bream-roach-in-situ-diel-zooplankton-feeding-2004\` | In-situ maaginhoud-/consumptieonderzoek rapporteerde voor de onderzochte zoöplankton-etende vissen een overwegend daggebonden voedingsritme en een nachtelijke daling van maagvulling. | Direct bewijs voor voedingsintensiteit/-ritme binnen de onderzochte voedselgilde, lengteklassen en het stuwmeer. Dit is aanvullend bestaand registerbewijs; het is niet dezelfde publicatie als de Říha et al. 2015-verwijzing in de Excel. |

## 9.2 Excel-waarden die niet rechtstreeks worden overgenomen

De volgende onderdelen zijn nuttig als hypotheses of als controlelijst, maar zijn op dit moment geen gevalideerde score-invoer:

- **Archetypegewichten (45/20/15/20 enz.):** afgeleid uit een oude eigen tabel en afgerond; geen gemeten effectgroottes. Bovendien mogen archetypen soortverschillen niet verbergen. Ze zijn geen numeriek gewicht voor een van de vier afzonderlijke uitkomsten.
- **Temperatuurcurves T0–T3:** meerdere onderliggende claims komen uit verschillende responsen (groei, voedselopname, foerageren, metabolisme, voorkeur of tolerantie). Alleen een bron met de juiste gemeten uitkomst mag een curve voor die uitkomst ondersteunen. Geschatte curve-eindpunten blijven priors.
- **Zuurstofdrempels:** het Excel-tabblad vermeldt zelf dat de drempels voor alle soorten schattingen zijn. Ze mogen niet als harde soortspecifieke limiter of vermenigvuldigingsfactor worden gebruikt.
- **Dagritmegetallen:** de meeste waarden zijn expliciet geschat. Een gemeten bewegingsritme mag niet worden omgezet in een voedingsritme; broncontext, seizoen en levensfase moeten behouden blijven.
- **Maandelijkse seizoensscores:** grotendeels geschat uit paai-/seizoensbeschrijvingen. Kalendermaand is geen directe maat voor voedingsdrang. Risico op dubbeltelling met temperatuur en fotoperiode.
- **Troebelheidsfactoren:** de getallen zijn geschat en de richting hangt af van soort, jachtwijze, prooi, licht en watertype. Telemetrische activiteit is niet automatisch voedingsactiviteit.
- **Voedsel-/prooiaanbodrubric:** klasse Laag/Gemiddeld/Hoog is geen lokale meting en prooiaanbod is niet hetzelfde als voedselopname.
- **Wateractiviteitsrubric:** de scores voor stil/zwak/matig/sterk zijn modelaannames; eerst moet worden vastgesteld of de invoer stroming, scheepvaart, gemaal of een andere waterbeweging representeert en welke uitkomst daarop reageert.
- **Ontbrekende drivers herschalen:** het Excel-voorstel herverdeelt het gewicht over beschikbare drivers. Dat kan een schijnbaar volledige score opleveren terwijl essentiële informatie ontbreekt. Dit wordt niet overgenomen zonder expliciete dekking- en onzekerheidsregels.

De bronvermelding in de Excel waarschuwt bovendien dat niet elke bron volledig is gelezen en dat sommige samenvattingen alleen op abstracts of fragmenten zijn gebaseerd. De daarin genoemde numerieke waarden worden daarom niet als geverifieerde bronextracties behandeld.

## 9.3 Gevolg voor de huidige score-uitwerking

1. De hierboven genoemde bestaande bronrecords worden meegenomen in de soort-/uitkomstmatrix; er wordt geen tweede bronregister of tweede soortcatalogus aangemaakt.
2. De bewijsrespons blijft gescheiden: fysiologie, voedselopname, foerageergedrag, locomotorische activiteit en habitatgebruik zijn niet onderling uitwisselbaar.
3. Een record kan een factor inhoudelijk ondersteunen zonder dat daarmee al een numeriek gewicht, curveparameter of limiterdrempel is vastgesteld.
4. De Excel-architectuur met habitatgate en mogelijke limiterende factoren is een bruikbare ontwerpgedachte, maar de concrete vermenigvuldigingsformule en parameters worden niet één-op-één overgenomen. Per biologische uitkomst moet eerst worden vastgesteld welke factorrol door bewijs wordt gedragen.
5. Er is in deze stap geen runtimecode gewijzigd en geen Excel-parameter goedgekeurd.

## 9.4 Voortgang en hervatpunt

**Afgerond in deze werkslag**
- Alle 11 Excel-tabbladen zijn geïnventariseerd.
- De bronlijst en de modeltabellen zijn vergeleken met het bestaande onderzoeksregister.
- De direct herbruikbare bestaande bewijsrecords en hun toegestane uitkomst zijn hierboven vastgelegd.
- Niet-gevalideerde Excel-aannames en parameters zijn expliciet uitgesloten van directe score-invoer.

**Huidige opdracht — nog niet afgerond**
- De bestaande soortspecifieke rangordes en bronrecords verder omzetten naar een evidence matrix per soort en per afzonderlijke uitkomst.
- Per factor vastleggen: directe meting/proxy/context, gemeten respons, richting/vorm, soort en levensfase, onderzoekscontext, overdraagbaarheid, overlap/dubbeltelling en onzekerheid.
- Pas daarna een verdedigbaar soortspecifiek wegingsvoorstel maken. Geen percentages afleiden uit alleen bewijssterkte of uit de Excel-archetypegewichten.

**Volgende stap na afronding van de huidige wegingstaak**
- De overige inhoud van \`vismodel_voorstel_v2.xlsx\` systematisch valideren: eerst de nog niet gekoppelde bronnen, daarna per tabblad de getallen en aannames.
- Nieuwe, voldoende gecontroleerde bronnen toevoegen aan het bestaande \`researchRegistry.ts\`; gevalideerde parameters pas na expliciete beoordeling in de bestaande soortprofielen/modelarchitectuur verwerken.
- Daarna pas beoordelen welke runtime-scoreberekeningen aangepast moeten worden.

**Hervatten vanaf:** de evidence matrix en soortspecifieke rangorde; de Excel-koppeling hierboven is vastgelegd en hoeft niet opnieuw vanaf nul te worden gedaan.

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

**Huidige opdracht — lopend**
- De eerste evidence matrix per soort en uitkomst is vastgelegd in sectie 10 (v0.1), op basis van de 94 bestaande registerrecords.
- De voorlopige prioriteiten zijn aangescherpt: fysiologische curvebeoordeling start bij baars en snoekbaars; voedingsbewijsbeoordeling start bij karper, brasem en blankvoorn.
- De primaire broncontrole van zes studies is vastgelegd in sectie 11. Dit heeft onder meer bevestigd dat de baarsrespons lichaamsgrootte-afhankelijk is, het snoekbaarsbereik breed is en cypriniden-voedingsritmes contextafhankelijk zijn.
- Nog uit te voeren: primaire broncontrole van overige kandidaatstudies, daarna responsvormen en toepassingsgrenzen vergelijken. Alleen bij voldoende vergelijkbare responsgegevens volgt een numeriek gewicht.

**Volgende stap na afronding van de huidige wegingstaak**
- De resterende inhoud van `vismodel_voorstel_v2.xlsx` systematisch valideren: eerst nog niet gekoppelde bronnen, daarna per tabblad de getallen en aannames.
- Nieuwe, voldoende gecontroleerde bronnen toevoegen aan het bestaande `researchRegistry.ts`; gevalideerde parameters pas na expliciete beoordeling in de bestaande soortprofielen/modelarchitectuur verwerken.
- Daarna pas beoordelen welke runtime-scoreberekeningen aangepast moeten worden.

**Hervatten vanaf:** primaire broncontrole van de resterende kandidaatstudies voor directe voedselopname en foerageergedrag bij de overige soorten. De Excel-koppeling, eerste evidence matrix en eerste zes broncontroles zijn vastgelegd en hoeven niet opnieuw vanaf nul te worden gedaan.

# 10. Eerste evidence matrix per soort en prognose-uitkomst (v0.1)

**Status:** eerste classificatie van de 94 bestaande registerrecords op basis van hun vastgelegde \`measuredOutcomes\`, samenvatting en beperkingen. Dit is een onderbouwde prioritering, nog geen numerieke weging.

## 10.1 Bewijsclassificatie

- **Direct:** het register noemt een meetuitkomst die inhoudelijk overeenkomt met de bedoelde prognose-uitkomst. Direct betekent niet automatisch sterk, overdraagbaar of klaar voor runtime.
- **Beperkt direct:** de bedoelde respons is gemeten, maar in een beperkte levensfase, laboratorium-/voeropstelling, één locatie, kleine steekproef of met beperkte bewijssterkte.
- **Indirect/context:** de bron meet een verwante respons, zoals groei, dieet, prooikeuze, beweging of habitatgebruik. Deze mag de bedoelde uitkomst niet vervangen.
- **Geen soortspecifiek bewijs in het register:** er is op dit moment geen passende soortspecifieke meetrespons geregistreerd.

De classificatie volgt de geregistreerde meetuitkomst, niet alleen de titel of het onderwerp van een bron. Een bron met meerdere meetuitkomsten kan in meer dan één kolom voorkomen, maar alleen voor de afzonderlijk geregistreerde responsen.

## 10.2 Matrix op hoofdlijnen

| Soort | Fysiologische prestatie | Voedingsintensiteit/-ritme | Foerageergedrag | Habitat/aanwezigheid | Vangkans |
|---|---|---|---|---|---|
| **Karper** | Beperkt direct: metabolisme (\`common-carp-acute-temperature-metabolism-1983\`). Voedingsfysiologie/hypoxie is een andere respons. | Direct, meerdere veld- en laboratoriumrecords; bewijs varieert beperkt–matig. Sterke contextverschillen tussen wild, rivier, bijgevoerd punt en proefopstelling. | Direct, onder meer juveniele temperatuurproef en veldstudies; niet gelijkstellen aan opgenomen voedsel. | Direct habitat-/bewegingsonderzoek, maar vooral beperkt en locatiegebonden; geen lokale stekkans. | Beperkt: vangstverdeling (\`common-carp-angling-competition-night-landings-2021\`) en kwetsbaarheid (\`common-carp-bait-encounter-angling-vulnerability-2017\`); geen lokale vangstkans. |
| **Brasem** | Direct voor metabolisme (\`roach-bream-metabolic-rate-temperature-2006\`); groei is alleen indirect. | Direct, matig bewijs voor in-situ consumptie/maagvulling en dagritme, maar gebonden aan voedselgilde, lengteklasse en meer. | Direct voor filtervoedgedrag en prooigrootte; niet automatisch aasopname. | Direct telemetrie-/habitatgebruik in meerdere contexten; geen gevalideerde lokale aanwezigheidsscore. | Geen soortspecifieke vangst-rate- of vangbaarheidsregistratie in het register. |
| **Snoek** | Beperkt direct: metabolisme (\`northern-pike-metabolic-rate-temperature-1982\`); spontane zwemactiviteit/groei is een andere respons. | Beperkt direct: voedsel-/maaginhoud- en functionele-responsmetingen; levensfase en onderzoekscontext beperken overdracht. | Indirect tot beperkt: jacht-/functionele respons is niet hetzelfde als dagelijkse voedselopname; habitatwisselingen zonder prooi zijn geen jachtpiek. | Direct telemetrie-/habitatonderzoek met matige bewijssterkte, maar locatiespecifiek. | Direct voor hengelvangbaarheid (\`northern-pike-wild-lure-shyness-protected-areas-2025\`, \`northern-pike-capture-probability-bait-learning-unexploited-2026\`); geen overdraagbare persoonlijke lokale vangstkans. |
| **Baars** | Direct: metabolisme en aerobe scope, met matige bewijssterkte en duidelijke grootte-/levensfaseafhankelijkheid (\`european-perch-aerobic-scope-size-temperature-2020\`). | Direct, meerdere veldmetingen van rantsoen/maaginhoud en dagritme; veel records beperkt, enkele matig; seizoen, lengte en voedseltype verschillen. | Beperkt/indirect via dieet- en prooikeuze; geen universele jachtfrequentie. | Direct telemetrie-/habitatgebruik met matige bewijssterkte; populatie- en meerverschillen. | Directe vangst-rate-studie (\`perch-recreational-angling-catch-rates-21-lakes-2013\`), maar vangsttempo wordt ook sterk door visser, techniek en aas beïnvloed. |
| **Blankvoorn** | Direct voor metabolisme (\`roach-bream-metabolic-rate-temperature-2006\`); groeistudies zijn geen fysiologische activiteit. | Direct, meerdere maaginhoud-/consumptie- en ritmestudies; matige en beperkte bewijssterkte. Sterk afhankelijk van voedselgilde, leeftijd, seizoen en habitat. | Direct voor sommige voedselgilden/prooikeuze, maar niet één generieke foerageerscore. | Direct telemetrie-/migratie- en habitatgebruik in specifieke meren en verbonden watersystemen; geen lokale aanwezigheidsscore. | Geen soortspecifieke vangst-rate- of vangbaarheidsregistratie in het register. |
| **Zeelt** | Geen passende directe meting van algemene fysiologische prestatie. Voedingsfysiologie bij temperatuur (\`tench-temperature-feeding-efficiency-2026\`) mag niet als metabolisme/aerobe scope worden gebruikt. | Direct veldbewijs voor voedselopname en ritme (\`tench-field-diel-seasonal-feeding-2018\`), met beperkt aanvullend gecontroleerd bewijs; locatie- en seizoensgebonden. | Beperkt; voedings-/bewegingsritme is geregistreerd, maar er is weinig afzonderlijk foerageergedrag gemeten. | Beperkt habitat-/aanwezigheidsbewijs. Het karper-zeelt aasontmoetingsonderzoek is geen lokale habitatkans. | Geen betrouwbare soortspecifieke vangst-rate-registratie; het gedeelde aasontmoetingsonderzoek verklaarde vangbaarheid niet significant. |
| **Snoekbaars** | Direct: metabolisme/aerobe scope bij volwassen kweekvis (\`adult-pikeperch-aerobic-scope-temperature-2012\`), matige bewijssterkte met belangrijke laboratorium- en levensfasebeperkingen. | Direct: maaginhoud-/voedingsintensiteit en voedingsritme; bewijs beperkt–matig, afhankelijk van seizoen, lengteklasse en water. | Indirect via dieet/prooikeuze; locomotorische schemeractiviteit is geen directe jacht- of voedselopnamepiek. | Direct telemetrie-/habitatgebruik in rivier-/kanaalcontexten; geen lokale stekkans. | Geen soortspecifieke vangst-rate- of vangbaarheidsregistratie in het register. |
| **Meerval** | Geen passende soortspecifieke registratie van metabolisme/aerobe scope. Groei en seizoensbeweging vervangen die meting niet. | Direct maar contextbeperkt: voedingsintensiteit/-ritme in gecontroleerde opstellingen en bij vroege juvenielen; volwassen veldgegevens zijn vooral dieet of beweging. | Direct bij vroege juvenielen (\`juvenile-catfish-night-foraging-reservoirs-2025\`); niet generaliseren naar volwassen wilde meerval. | Direct telemetrie-/habitatonderzoek met matige bewijssterkte; seizoen, diepte en populatie bepalen de patronen. | Geen soortspecifieke vangst-rate- of vangbaarheidsregistratie in het register. |
| **Roofblei** | Geen passende directe registratie van metabolisme/aerobe scope of fysiologische prestatie. | Beperkt direct voor voedingsincidentie (\`asp-seasonal-feeding-incidence-danube-2010\`), vooral subadulten; geen directe dagelijkse voedselopnamecurve. | Geen voldoende directe soortspecifieke foerageerfrequentie in het register; dieet/prooikeuze is context. | Direct telemetrie-/habitatonderzoek met matige bewijssterkte, maar rivier-/meer- en seizoensspecifiek. | Geen soortspecifieke vangst-rate- of vangbaarheidsregistratie in het register. |

## 10.3 Wat kan nu al de voorlopige prioriteit bepalen?

### Fysiologische prestatie

- **Eerste kandidaten voor verdere numerieke curvebeoordeling:** baars en snoekbaars (aerobe scope plus metabolisme), daarna brasem en blankvoorn (metabolisme).
- **Beperkte kandidaat:** karper en snoek (metabolisme gemeten, maar beperkt in temperatuurdekking/context).
- **Nog geen passende directe basis:** zeelt, meerval en roofblei. Voedselopname, groei of telemetrische beweging mag dit gat niet opvullen.

Dit betekent niet dat temperatuur biologisch irrelevant is voor de laatste drie soorten. Het betekent dat het huidige register nog geen passende soortspecifieke fysiologische curve ondersteunt. De bestaande runtimecurve blijft een voorlopige operationele prior, niet een gevalideerd bewijsresultaat.

### Voedingsintensiteit en voedingsritme

- **Meeste directe bewijsdekking:** karper, brasem en blankvoorn; voor elk gelden belangrijke verschillen naar voedseltype, levensfase, seizoen en onderzoeksopzet.
- **Direct bewijs aanwezig, maar context-/levensfasebeperkt:** baars, zeelt, snoekbaars en meerval.
- **Beperkte dekking:** snoek; de beschikbare responsen zijn schaars en deels indirect.
- **Geen basis voor een voedingsintensiteitsscore:** roofblei heeft vooral voedingsincidentie en dieet/prooikeuze; incidentie is niet hetzelfde als hoeveelheid voedsel per tijdseenheid.

Deze rangorde gaat over bewijsdekking, niet over de biologische grootte van het effect. Een soort met meer studies krijgt niet automatisch een hogere voedingsscore of groter modelgewicht.

### Foerageergedrag

Foerageergedrag blijft een afzonderlijke respons binnen de voedingslaag. De sterkste bruikbare registratiebasis zit bij karper; daarnaast zijn er soort-/voedselgildegebonden gegevens voor brasem en blankvoorn en juveniele gegevens voor meerval. Waar alleen dieet, prooikeuze, telemetrische beweging of voedselopname is gemeten, wordt geen aparte foerageerfrequentie afgeleid.

### Habitat en lokale aanwezigheid

Voor alle negen soorten bestaat enige habitat-/bewegingsinformatie, maar die gegevens beschrijven meestal habitatgebruik of verplaatsing in een specifiek watersysteem. Ze bewijzen niet dat een soort op het gekozen prognosepunt aanwezig is. Daarom:

- lokale waarnemingen/detecties zijn de primaire toekomstige invoer voor aanwezigheid;
- algemene habitatgeschiktheid kan voorlopig als kwalitatieve geschiktheidscontext dienen;
- de Excel-gate \`Ja/Beperkt/Nee = 1/0,5/0\` wordt niet als gevalideerde aanwezigheidskans overgenomen.

### Uiteindelijke vangkans

- **Baars:** er is een directe multi-lake vangst-rate-studie, maar die laat ook grote effecten van visserervaring, aas en techniek zien.
- **Snoek:** er is direct bewijs over hengelvangbaarheid en aangeleerde kunstaasschuwheid; dit is geen universele dagelijkse vangkans.
- **Karper:** er is vangstverdelings- en aasontmoetings-/kwetsbaarheidsbewijs, maar geen lokale sessiekans.
- **Overige soorten:** het register bevat geen passende soortspecifieke vangst-rate-registratie.

Voor geen enkele soort is er op basis van dit register al een gekalibreerde lokale vangkans. De vier biologische uitkomsten mogen dus niet worden omgezet naar een vangstpercentage.

## 10.4 Voorlopig wegingsbesluit

De huidige gegevens rechtvaardigen een **soort- en uitkomstspecifieke prioriteitsvolgorde**, maar nog geen betrouwbaar numeriek percentagebudget. Voor de eerstvolgende stap gelden deze beslissingen:

1. Alleen records met een passende \`measuredOutcomes\` mogen als direct bewijs voor de betreffende uitkomst in de matrix blijven staan.
2. Groei, dieet/prooikeuze, locomotorische activiteit en habitatgebruik blijven context wanneer de doeluitkomst voedselopname of fysiologische prestatie is.
3. De bewijssterkte (\`moderate\`, \`limited\`) bepaalt niet rechtstreeks het gewicht. Een effectgrootte of responsvorm is nodig om relatieve numerieke invloed te kunnen vergelijken.
4. Voor fysiologische activiteit kan de curvebeoordeling starten bij baars en snoekbaars; voor voeding bij karper, brasem en blankvoorn. Dit is de volgorde van bewijsbeoordeling, niet de rangorde van verwachte activiteit.
5. Voor aanwezigheid/habitat is eerst lokale detectie-/habitatinformatie nodig; voor vangkans zijn echte vangsten, sessieduur en inspanning nodig.
6. Geen numerieke Excel-archetypegewichten, zuurstofdrempels, troebelheidsfactoren of maand-/dagritmegetallen worden in deze matrix geactiveerd.

**Volgende werkslag:** controleer per eerste kandidaat de exacte primaire bronrespons, bereik, steekproef, levensfase en context. Maak daarna alleen waar effectgroottes vergelijkbaar zijn een numeriek voorstel. Waar dit niet kan, blijft de factor kwalitatief of krijgt hij geen actief gewicht.

# 11. Primaire broncontrole — eerste kandidaten (24-11-2026)

De eerste broncontrole is uitgevoerd op publicatie-/abstractniveau voor de volgende primaire studies. Dit verfijnt de evidence matrix; het is nog geen volledige systematische review van alle 94 records.

| Bronrecord | Gecontroleerde bevinding | Gevolg voor de weging |
|---|---|---|
| \`common-carp-juvenile-foraging-temperature-2012\` | Oyugi et al. onderzochten juveniele karpers van 90–105 mm bij 16, 20, 24 en 28 °C. De studie mat onder meer feeding rate (items/s) en functionele respons; de hoogste feeding rates traden op bij 24 °C. Groei was het hoogst rond 20–24 °C en lager bij 16 en 28 °C. | Directe temperatuurrespons voor foerageersnelheid bij juvenielen. De uitkomst is geen volwassen-karpercurve, geen algemene metabolismecurve en geen dagelijkse voedselopname in het veld. |
| \`common-carp-temperature-feeding-rhythm-2012\` | Chen et al. onderzochten een Aziatische ondersoort (\`C. carpio haematopterus\)) bij 4–34 °C, met volwassen dieren van 630–850 g en jonge dieren van 61–91 g. De abstract rapporteert twee voedingspieken en een temperatuurafhankelijke dagelijkse opname; de hoogste dagelijkse opname lag in deze proef bij 28 °C en daalde bij 34 °C. | Directe proefinformatie voor voedingsintensiteit en voedingsritme, maar beperkte overdraagbaarheid naar Nederlandse wilde karper. Geen universele kloktijden of volledige veldcurve overnemen. |
| \`european-perch-aerobic-scope-size-temperature-2020\` | Christensen et al. maten zuurstofverbruik en aerobe scope bij Europese baars over 15–28 °C en onderzochten daarnaast temperatuurvoorkeur. Het temperatuurpunt van de hoogste aerobe scope daalde met toenemende lichaamsmassa; vissen onder 40 g lieten binnen het onderzochte bereik geen daling van aerobe scope bij stijgende temperatuur zien. | Directe fysiologische basis, maar één universele baarscurve is onvoldoende. Lichaamsgrootte/levensfase is een relevante effectmodifier. De studie meet geen dagelijkse voedingsactiviteit of vangbaarheid. |
| \`adult-pikeperch-aerobic-scope-temperature-2012\` | Frisk et al. maten volwassen kweek-snoekbaars bij zes temperaturen tussen 13 en 28 °C. De berekende maximale metabole scope lag bij 18,8 °C, maar metabole scope verschilde niet significant tussen 13 en 25 °C. Het afgeleide 80%-bereik was 10,4–26,9 °C; de auteurs benadrukken een ontogenetische verschuiving ten opzichte van juvenielen. | Directe fysiologische respons, maar de 18,8 °C is geen smal bewezen activiteitsoptimum. De brede responszone, kweekcontext en levensfase moeten in de curvebeoordeling blijven staan. |
| \`roach-autumnal-diel-feeding-shift-2008\` | Hautala onderzocht blankvoorn in de littorale zone van één boreaal meer. De gemeten voedingsactiviteit verschoof in de herfst van overdag naar schemering toen de watertemperatuur van circa 20 naar 10 °C daalde; rond 5 °C bleef een laag maar stabiel niveau van nachtactiviteit bestaan. | Direct bewijs voor seizoens-/temperatuurafhankelijk voedingsritme in die habitat. Geen universele Nederlandse tijdvakfactor: predatierisico, licht, seizoen en voedselbeschikbaarheid zijn mede verklaringen. |
| \`bream-roach-in-situ-diel-zooplankton-feeding-2004\` | Vašek & Kubečka onderzochten in-situ zoöplanktonconsumptie bij subadulte/adulte brasem en blankvoorn in het Římov-stuwmeer. Bij de onderzochte microcrustaceeën-etende groepen was de voedingsperiodiciteit overwegend overdag, met een duidelijke daling van maagvulling in de nacht. | Direct bewijs voor de specifieke voedselgilde en onderzochte lengteklassen. Niet generaliseren naar bodemvoeding, ander aas of alle seizoenen. Dit is niet dezelfde publicatie als Říha et al. 2015 die in de Excel staat. |

## 11.1 Correcties en expliciete grenzen

- De waarde 24 °C uit Oyugi et al. is een maximum van gemeten **feeding rate bij juveniele karper** in een experiment; het is geen bewezen algemeen temperatuurmaximum voor alle karperactiviteit.
- Bij baars is lichaamsmassa een belangrijke modifier van de aerobe-scope- en temperatuurvoorkeurrelatie. Een profiel zonder lengte-/grootte-invoer moet deze onzekerheid zichtbaar houden.
- Bij snoekbaars is 18,8 °C het berekende maximum van metabole scope in de onderzochte volwassen kweekvis. De studie vond geen significant verschil in metabole scope tussen 13 en 25 °C; de 80%-band is breed. Het getal 18,8 °C mag dus niet als scherpe piek in de prognose worden vertaald.
- De twee cyprinidenstudies over dagritme laten zien waarom een generieke soortbonus niet verantwoord is: de respons verschilt per soort, voedselgilde, seizoen en habitat.
- De Excel-bron voor brasemdagritme (Říha et al. 2015) mag niet worden verward met de al geregistreerde Vašek & Kubečka-studie uit 2004. Beide kunnen relevant zijn, maar vereisen afzonderlijke registratie en broncontrole.

## 11.2 Status na deze broncontrole

**Afgerond:** eerste broncontrole van zes relevante studies en aanscherping van de interpretatie van de bijbehorende evidence records.

**Nog open binnen de huidige wegingstaak:** primaire broncontrole van overige kandidaatstudies, vooral directe voedselopname bij snoek, baars, zeelt, snoekbaars en meerval; vervolgens responsvormen en toepassingsgrenzen naast elkaar zetten. Pas wanneer responsen voldoende vergelijkbaar zijn, volgt een numeriek gewicht.

**Daarna:** de resterende Excel-tabbladen en bronverwijzingen volledig valideren en gevalideerde nieuwe informatie toevoegen aan het bestaande onderzoeksregister.

## 11.3 Aanvullende primaire broncontroles

| Bronrecord | Gecontroleerde bevinding | Gevolg voor de weging |
|---|---|---|
| \`northern-pike-functional-response-temperature-browning-2026\` | Nilsson-Örtman et al. onderzochten functionele respons en voedingssnelheid van jonge snoek in laboratoriumproeven bij drie temperaturen en verschillende bruinings-/zichtcondities. De gemeten effecten van temperatuur en bruining op voedingssnelheid waren opvallend zwak; meestal trad een asymptotische Type-II-respons op, met een koepelvormige Type-IV-respons in koud, helder water. | Directe voedings-/foerageerrespons, maar juveniel en laboratoriumgebonden. Dit spreekt tegen een sterke generieke temperatuur- of troebelheidsvermenigvuldiger voor snoekvoeding. |
| \`pikeperch-feeding-intensity-size-gonad-season-2012\` | Özyurt et al. bemonsterden snoekbaars maandelijks met kieuwnetten van juli 2009 tot juni 2010. Dieet verschilde met lengte; de maagvullings-/voedingsintensiteit piekte in oktober en maart en nam tussen oktober en februari af, door de auteurs gekoppeld aan de voortplantingsperiode. | Directe voedingsintensiteit met seizoens- en lengtecontext. Bruikbaar als kandidaat voor seizoens-/levensfase-respons, maar één water/populatie en geen universele maandscore. |
| \`perch-field-diel-feeding-seasonal-diet-1986\` | Rask onderzocht dieet en dagritme van baars in één klein, sterk humusrijk Fins meer. De voedingsactiviteit verschoof van duidelijke ochtend-/avondpieken in mei/juni naar een middagpiek in juli/augustus; dieet en prooikeuze verschilden bovendien per lengteklasse. | Directe voedings-/ritme-informatie, maar locatie-, seizoen- en groottegebonden. Een vaste schemerfactor voor baars is niet verdedigbaar. |
| \`juvenile-catfish-night-foraging-reservoirs-2025\` | Sajdlová et al. vonden vroege juveniele Europese meerval 's nachts pelagisch in drie Tsjechische reservoirs, meestal op 2–4 m diepte; maaginhoud bevestigde consumptie van Chaoborus-larven. | Direct bewijs voor nachtelijke voedselopname/foerageren en pelagisch voorkomen bij vroege juvenielen. Het is geen kwantitatieve voedselopnamesnelheid en mag niet naar volwassen meerval worden geëxtrapoleerd. |

**Tussenconclusie:** de eerste extra primaire controles versterken vooral de noodzaak om voedingsresponsen naar soort, lengteklasse, seizoen, prooitype en onderzoeksopzet te scheiden. De uitkomsten geven nog geen onderling vergelijkbare effectgroottes waarmee percentages kunnen worden berekend.

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
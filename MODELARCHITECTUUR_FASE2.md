# Modelarchitectuur Vislogboek — Fase 2

**Besluitdatum:** 16 november 2026  
**Status:** gekozen architectuur; numerieke herkalibratie nog niet uitgevoerd.

## 1. Besluit in één zin

Vislogboek krijgt **één versiebeheerste hybride prognoseketen met meerdere gescheiden uitkomsten**. We bouwen geen twee concurrerende totaalmodellen en voegen geen tweede engine toe voor een taak die al bestaat.

De uitkomsten blijven afzonderlijk:
1. fysiologische activiteitspotentie;
2. voedings-/foerageeractiviteit;
3. lokale aanwezigheid en habitatgeschiktheid;
4. uiteindelijke vangkans.

Deze vier uitkomsten hangen samen, maar zijn niet onderling uitwisselbaar. Een actieve vis hoeft niet op de gekozen stek te liggen; een aanwezige vis hoeft niet te azen; een azende vis hoeft niet vangbaar te zijn met de gekozen methode.

## 2. Bestaande modelklassen afgewogen

| Modelklasse | Geschikt voor | Besluit |
|---|---|---|
| Thermische performance curve (TPC) | Niet-lineaire relatie tussen watertemperatuur en een fysiologische respons | **Behouden als mechanistische basis** voor activiteitspotentie. Huidige curvevorm is voorlopig; de huidige soortparameters zijn niet gevalideerd. |
| Wisconsin Fish Bioenergetics / Dynamic Energy Budget (DEB) | Energieopname, vertering, metabolisme, groei en energiebudgetten | Niet als volledig app-model. Deze raamwerken zijn te zwaar en beantwoorden niet rechtstreeks de vraag naar activiteit/aasgedrag per uur en stek. Biologische inzichten kunnen wel als bron/prior dienen. |
| Species Distribution Models (SDM; o.a. GLM/GAM-achtige occurrence-modellen) | Habitatgeschiktheid en verspreiding op basis van aanwezigheid-/afwezigheidsdata | Methodische basis voor een latere habitat-/aanwezigheidslaag, niet als vervanging van het activiteitsmodel. Vereist representatieve lokale gegevens en validatie. |
| Individueel-gebaseerde habitatkeuze / optimal foraging | Keuze tussen plekken op basis van voedsel, temperatuur, risico en energiewinst | Principes gebruiken voor verklaringen; geen volledige individuele vissimulatie bouwen. Te veel onbekende parameters voor de huidige datagrondslag. |
| Empirisch vangstmodel (Poisson, negatief-binomiaal of hazard/tijd-tot-gebeurtenis) | Aanbeten/vangsten per inspanningsduur | Bestaande Poisson-benadering voorlopig als baseline behouden. Later toetsen op overdispersie en segmenteren naar soort, tijdvak, locatie, techniek en inspanning. |

## 3. Waarom deze keuze

- Volkoff & Rønnestad (2020), *Effects of temperature on feeding and digestive processes in fish*, beschrijven dat temperatuur metabolisme, voedselopname, vertering en gedrag beïnvloedt. De respons is soortspecifiek en hangt ook af van blootstellingsduur en snelheid van temperatuurverandering. DOI: https://doi.org/10.1080/23328940.2020.1765950
- Jørgensen, Enberg & Mangel (2016), *Modelling and interpreting fish bioenergetics*, benadrukken dat fysiologische modellen voor bredere ecologische voorspellingen moeten worden aangevuld met gedrag, levensgeschiedenis en trade-offs. DOI: https://doi.org/10.1111/jfb.12834
- De studie over habitatkeuze in *Ecological Modelling* (2004) laat zien dat verschillende aannames over voedsel- en temperatuurgedreven habitatkeuze tot verschillende voorspelde visverdelingen kunnen leiden. DOI: https://doi.org/10.1016/j.ecolmodel.2003.08.022
- De review over bio-energetische modellering in *Transactions of the American Fisheries Society* (2008) beschrijft dat habitatgebruik mede bepaalt welke lokale temperatuur- en activiteitscondities een vis ervaart.

Deze bronnen onderbouwen de modelstructuur en de noodzaak van soort-/contextspecifieke behandeling. Ze leveren **niet** automatisch numerieke gewichten voor onze Nederlandse stekken of vangstkans.

## 4. Gekozen architectuur

### Canonieke bronnen en geen dubbele profieladministratie

- `src/services/fishProfiles.ts` is de enige operationele bron van waarheid voor soortprofielen, profielparameters en de thermische soortrespons. Nieuwe of herziene profielwaarden worden uitsluitend daar aangepast.
- `src/services/researchRegistry.ts` is het centrale register voor wetenschappelijke kennis, bewijssterkte, beperkingen, bronverwijzingen en expliciete goedkeuring voor eventueel voorspellingsgebruik. Een registratie activeert niet automatisch een modelregel.
- De `scientificReferences` binnen een soortprofiel zijn traceerbaarheidsverwijzingen bij dat profiel; ze vormen geen tweede verzameling biologische parameterwaarden of een alternatieve bron van bewijsbeoordeling.
- Audit- en architectuurdocumenten beschrijven bevindingen en besluiten, maar kopiëren geen volledige parameterlijsten. Bij verschil is de actuele codebron leidend voor operationele waarden en het research register leidend voor de geregistreerde bewijsbeoordeling.
- `src/services/prognosisEngine.ts` consumeert de bestaande profielen; het mag geen eigen tweede soortprofielcatalogus introduceren.
- Het research register is momenteel bewijsadministratie en wordt nog niet door de runtime-prognose-engines geraadpleegd. Iedere toekomstige numerieke factor moet expliciet aan de juiste registratie worden gekoppeld; niet-goedgekeurde kennis mag geen scorebijdrage leveren.


### Laag A — fysiologische activiteitspotentie
- Hergebruik `calculateThermalEfficiency()` en de bestaande waterthermische engine.
- De thermische respons wordt per soort onderbouwd en waar nodig herzien.
- Temperatuurverloop, thermische traagheid/acclimatisatie en zuurstof kunnen later worden toegevoegd als betrouwbare invoer en soortspecifiek bewijs beschikbaar zijn.
- Deze uitkomst blijft een fysiologische potentie, geen directe aas- of vangstkans.

### Laag B — voedings-/foerageeractiviteit
- Afzonderlijke soortspecifieke respons op dag-nachtritme, seizoen, licht en relevante omgevingsfactoren.
- Een factor krijgt alleen numerieke invloed als de bron de betreffende gedragsmaat ondersteunt. Groei, migratie, aanwezigheid en voedselopname worden niet als dezelfde uitkomst behandeld.
- Tijdvakvoorkeuren blijven hypotheses zolang directe gedragsdata ontbreken.

### Laag C — lokale aanwezigheid/habitat
- Hergebruik `habitatMovementEngine`, `bankWindEngine` en `rodPositioningEngine`.
- Behoud voorlopig kwalitatieve zones en waarnemingsgestuurde verklaringen.
- Geen numerieke aanwezigheidskans totdat representatieve aanwezigheid-/afwezigheidswaarnemingen en lokale kalibratie beschikbaar zijn.
- Geen waarneming is geen bewijs van afwezigheid.

### Laag D — vangkans
- De bestaande persoonlijke vangstkans blijft een afzonderlijke empirische baseline.
- Latere kalibratie gebruikt sessieduur als expliciete exposure en toetst minimaal soort, tijdvak, locatie, techniek en inspanning.
- Een GLM/GAM of mixed-effects model is waarschijnlijk voldoende als de dataset dit ondersteunt. Een complex ML-model is niet de eerste keuze.
- De vangkans wordt niet berekend door activiteitsscore simpelweg als percentage te behandelen.

### Centrale infrastructuur
- De bestaande waterthermische engine blijft de enige bron voor gemeten/geschatte watertemperatuur.
- De bestaande evaluatie-engine blijft de centrale chronologische beoordelaar.
- De bestaande habitat- en positioneringsengines worden verbeterd waar nodig; geen duplicatie.
- Iedere betekenisvolle modelwijziging krijgt een modelversie en reproduceerbare tests.

### Voedings-/foerageerlaag: bewijs vóór scoring

De voedingslaag blijft een aparte biologische respons naast fysiologische activiteit. De laag beschrijft of en wanneer de soort waarschijnlijk foerageert, op welk type voedsel/prooi en onder welke ecologische context. Dit is niet hetzelfde als zwemactiviteit, aanwezigheid op de stek of kans dat een hengelaar een vis vangt.

De literatuur wordt per soort geclassificeerd op:
- gemeten respons: maagvulling/consumptie, directe foerageerobservatie, dieet/prooikeuze, telemetrie/activiteit of groei;
- veld versus gecontroleerde kweek-/tankopzet;
- levensfase/lengteklasse, watertype, seizoen, lichtregime, voedsel/prooiaanbod en temperatuur;
- overdraagbaarheid naar Nederlandse stilstaande en stromende wateren;
- onzekerheid en bronbeperkingen.

De literatuurinventaris bevat nu directe voedings-/dieetbronnen voor alle negen concrete soorten, maar de kwaliteit is ongelijk: sommige zijn veldmetingen, andere gecontroleerde kweekstudies of alleen dieet-/prooikeuze. Een bron die dieet beschrijft bewijst niet automatisch een dagritme; telemetrie bewijst niet automatisch voedselopname; groei bewijst geen acute voedingsactiviteit.

**Eerste implementatiestap:** een kwalitatieve, soortspecifieke voedingscontext met expliciete bewijsstatus en bronverwijzingen. Geen numerieke factor, tijdvakbonus of temperatuurvermenigvuldiger wordt geactiveerd zolang de overdraagbaarheid en relatie met lokale sessie-/vangstdata niet zijn aangetoond. De app kent doorgaans de leeftijds-/lengtesamenstelling en het natuurlijke prooiaanbod van de lokale vispopulatie niet; zulke factoren blijven daarom onbekend in plaats van ingevuld.

### Reproduceerbare historische invoer

Elke prognosesnapshot bewaart naast bronrecord-ID's een compacte whitelist van de historische sessie-, vangst- en waarnemingskenmerken die de bestaande engines kunnen beïnvloeden. Dezelfde canonieke helper wordt gebruikt door de vier snapshotbouwers. De fingerprint wordt uit diezelfde genormaliseerde featurepayload opgebouwd, zodat wijzigingen in bijvoorbeeld aasrichting, voorvoerstatus of meetprovenance niet ongemerkt buiten de invoercontrole vallen.

Vrije notities, foto's en base64-inhoud worden bewust niet gekopieerd. Benchmarksessies en gekoppelde vangsten/waarnemingen worden uitgesloten. De featurestructuur heeft een expliciete schema-versie; temperatuurkalibratie, handmatige invoer, historische watertemperatuurmetingen en de exacte weersinvoer worden afzonderlijk bewaard. Dit maakt de gebruikte data-invoer veel beter reproduceerbaar, maar archiveert niet de uitvoerbare modelcode. Daarom moeten model- en engineversies bij betekenisvolle logica- of parameterwijzigingen worden verhoogd.

## 5. Geen vaste factorpercentages

Er worden nu geen universele factorpercentages of willekeurige bonussen geactiveerd. De eerder besproken procentuele verdeling was uitsluitend illustratief.

Per soort en per uitkomst wordt eerst vastgelegd:
- welke responsvariabele de bron werkelijk meet;
- soort, levensfase, populatie, watertype en geografische context;
- temperatuur-/omgevingsbereik en onderzoeksopzet;
- sterkte van bewijs en overdraagbaarheid naar Nederlandse praktijkwateren;
- onzekerheid en mogelijke interacties.

Waar direct bewijs ontbreekt, blijft een factor context of een expliciete hypothese. Het model mag liever onzeker of onbekend rapporteren dan schijnprecisie geven.

## 6. Kalibratie en validatie

- Begin met mechanistische soortprofielen en bronverantwoorde priors.
- Gebruik lokale gegevens alleen voor lokale correcties; kleine aantallen vangsten mogen het algemene soortprofiel niet herschrijven.
- Elke testvoorspelling gebruikt uitsluitend gegevens die op dat moment al beschikbaar waren.
- Vergelijk met een eenvoudige baseline en rapporteer onder meer Brier-score/log-loss, kalibratie en onzekerheidsmarges.
- Scheid softwaretests, synthetische tests en echte praktijkvalidatie.
- Door de schone start van 2026 is er nu geen historische vangstset waarmee betrouwbare nieuwe gewichten kunnen worden getraind. Synthetische of benchmarkdata zijn geen praktijkbewijs.

## 7. Implementatievolgorde

1. Corrigeer eerst de gedocumenteerde meettijd-/deduplicatiekwestie van watertemperatuur (zie `FASE2_PROGNOSE_AUDIT.md` §10).
2. Bouw een evidence matrix per soort en per uitkomst: activiteit, voeding, habitat, groei of vangst.
3. Rond de factorprovenance en de whitelisted, replaybare historische feature-snapshot af voor alle prognose- en snapshotbouwers.
4. Herzie thermische profielparameters alleen waar de brondata dat rechtvaardigen; voeg curve- en regressietests toe.
5. Ontwikkel eerst een kwalitatieve, soortspecifieke voedingscontext met bronverwijzingen, meettype, overdraagbaarheid en onzekerheid. Activeer geen numerieke invloed zonder passende veldvalidatie.
6. Houd habitatuitvoer voorlopig kwalitatief tot voldoende lokale presence-data bestaan.
7. Herzie en kalibreer de vangkans pas met voldoende echte sessies en chronologische backtests.

**Huidige status:** architectuur gekozen en vastgelegd. Er zijn nog geen nieuwe numerieke gewichten, biologische bonussen, gekalibreerde aanwezigheidskansen of vervangende vangstformules geïmplementeerd. Fase 2 blijft open.


## 8. Voortgangscheckpoint — 16 november 2026

PR [#54](https://github.com/sennzor-wq/Vislogboek/pull/54) is gemerged als [16c2ebd](https://github.com/sennzor-wq/Vislogboek/commit/16c2ebd63f18a9913fa7234c2774c24ddada4d8a). Het researchregister en de canonieke soortprofielen bevatten nu voedings-/dieetbronnen voor alle negen concrete soorten. De exacte PR-head Quality Gate [#43932012809](https://github.com/sennzor-wq/Vislogboek/actions/runs/43932012809) is volledig groen. De mergecommit Quality Gate [#43933698267](https://github.com/sennzor-wq/Vislogboek/actions/runs/43933698267) was bij vastlegging nog queued; dit blijft een expliciet validatiepunt.

**Niet veranderd:** geen runtime-score, thermische parameter, factorweging of numerieke voedingsbonus. Alle nieuwe bewijsregistraties blijven `approvedForPrediction: false`.

**Eerstvolgende ontwerpstap:** bouw een afzonderlijke kwalitatieve voedings-/foerageercontext, niet een nieuwe totaalprognose. Per soort moet elke runtime-uitspraak verwijzen naar de geregistreerde bron en de daadwerkelijk gemeten respons (voedselopname/voedingsritme versus dieet/prooikeuze). Wanneer de bron alleen dieet of prooikeuze meet, mag de app daaruit geen tijdvakpiek of voedingsintensiteit afleiden. Als leeftijd/levensfase, lokaal prooiaanbod of overdraagbaarheid onbekend is, toon die beperking of laat de uitspraak weg.

Daarna volgen tests op evidence gating en laagseparatie, UI-integratie, chronologische evaluatie en pas ten slotte fase-2-acceptatie. Geen numerieke factor wordt geactiveerd zonder direct bewijs en passende lokale validatie.


## 9. Gemeten uitkomsten als evidence-gate (16 november 2026)

PR [#55](https://github.com/sennzor-wq/Vislogboek/pull/55) introduceert in het centrale researchregister `ResearchOutcome` en `getResearchByOutcome(species, outcome)`. Hiermee wordt niet langer alleen op onderwerptekst gezocht, maar expliciet op de respons die een studie daadwerkelijk heeft gemeten: voedselopname/-ritme, foerageergedrag, dieet/prooikeuze, locomotie, habitatgebruik, groei of voedingsfysiologie.

Deze classificatie verandert geen prognose-uitkomst en omzeilt `approvedForPrediction` niet. Alle bronnen blijven niet-goedgekeurd voor numerieke voorspelling. Een studie naar dieet of prooikeuze mag bijvoorbeeld niet worden gebruikt als bewijs voor tijdvakgebonden voedingsintensiteit. De Quality Gate op de PR-head [#43934137768](https://github.com/sennzor-wq/Vislogboek/actions/runs/43934137768) is volledig groen; de Quality Gate op de mergecommit volgt.

**Volgende ontwerpbeslissing:** maak per soort een expliciete evidence-gated voedingscontext. Voedingsintensiteit/-ritme en foraginggedrag blijven gescheiden van dieet/prooikeuze en van telemetrie/habitat. Alleen directe, passende responsvariabelen mogen een kwalitatieve voedingsuitspraak dragen; ontbrekende lokale prooibeschikbaarheid en levensfase blijven onzeker. Geen numerieke tijdvakbonus of samengestelde voedingsscore.


## 10. Per-soort evidence-gate voor kwalitatieve voedingscontext

De eerste toepassingsmatrix is vastgelegd in `FASE2_PROGNOSE_AUDIT.md §13`. De runtime mag geen algemene voedingsscore bouwen door alle literatuur samen te voegen. De regels zijn:

1. `feeding_intensity` / `feeding_rhythm`: alleen beschrijvende uitspraken over gemeten voedselopname en tijdritme, met populatie-/habitatbeperking.
2. `foraging_behavior`: uitsluitend het werkelijk waargenomen foerageer-/graasgedrag; niet gelijkstellen aan maagvulling of totale activiteit.
3. `diet_composition` / `prey_selection`: alleen prooikeuze/dieetcontext; nooit een voedingsintensiteit of beste tijdvak afleiden.
4. `locomotor_activity` / `habitat_use`: uitsluitend ruimtelijke/activiteitscontext; geen voedingsproxy.
5. `growth` / `feeding_physiology`: groeicontext of gecontroleerde fysiologische respons; niet rechtstreeks als veldvoedingsritme toepassen.

Zolang alle relevante bronnen `approvedForPrediction: false` hebben, is deze service informatief en kwalitatief. Ze mag geen `activityScore`, `personalCatchChance`, factorweging of tijdvakrangschikking wijzigen. De eerste code-stap is een pure service met tests voor de toegestane claims en negatieve gevallen (in het bijzonder Roofblei: dieet wel, dagelijkse voedingsintensiteit niet). UI-integratie volgt pas na die service-review.


## 11. Eerste kwalitatieve voedingsbewijsservice

De pure service `src/services/feedingEvidenceService.ts` is toegevoegd en gemerged in PR [#56](https://github.com/sennzor-wq/Vislogboek/pull/56). Per soort worden vijf bewijsstromen afzonderlijk teruggegeven: gemeten voedselopname, voedingsritme, foraginggedrag, dieetcompositie en prooikeuze. De service maakt daarnaast alleen expliciet goedgekeurde voedingsbronnen beschikbaar in een aparte collectie.

Dit is nog geen voorspellingslaag: de service wijzigt geen activiteit, vangstkans, tijdvakscore of UI. Alle huidige bronnen blijven niet-goedgekeurd. De PR Quality Gate [#43934866369](https://github.com/sennzor-wq/Vislogboek/actions/runs/43934866369) is volledig groen.

**Volgende stap:** review het consumentencontract en bepaal hoe een beperkte, brongebonden onderzoekscontext in de prognose-UI wordt weergegeven zonder de indruk te wekken dat er al een gekalibreerde voedingsprognose bestaat. Pas na die review UI-integratie uitvoeren; geen numerieke factor activeren.


## 12. Weergave van kwalitatieve voedingsliteratuur

De prognose-UI bevat een aparte sectie voor soortspecifieke voedingsliteratuur. De drie zichtbare bewijsgroepen blijven gescheiden: gemeten voedselopname/-ritme, foerageergedrag en dieet/prooikeuze. Bronbevindingen, beperkingen, referenties en bewijsstatus komen rechtstreeks uit `feedingEvidenceService` / `researchRegistry`; bronnen die meerdere uitkomsten meten worden per groep ontdubbeld.

De sectie is onderzoekscontext, geen voorspelling voor de huidige stek of datum. De UI wijzigt geen activiteitsscore, beste vistijd, persoonlijke vangstkans of sessiesnapshot. Bij 'Algemeen' wordt geen soortspecifieke conclusie getoond. Geen numerieke voedingsfactor of tijdvakbonus.

Volgende stap na groene CI: merge, controle mergecommit en daarna verkennen hoe eigen lokale waarnemingen van foerageeractiviteit apart kunnen worden geregistreerd en gevalideerd.


## 13. Lokale foerageerobservaties: datakwaliteit en invoerlast

De huidige sessie-editor bewaart waarnemingen als categorieën op sessieniveau. `syncSessionPresenceObservations()` zet bij nieuwe records `session.updatedAt` in het veld `timestamp`; dit is het registratie-/update-moment, niet aantoonbaar het fysieke waarnemingstijdstip. Ook kunnen niet meerdere gebeurtenissen van hetzelfde type binnen één sessie afzonderlijk worden vastgelegd. Deze records zijn bruikbaar als grove sessiecontext, niet als betrouwbare tijdgebonden voedingslabels. De huidige prognose kent hieraan geen numerieke bonus toe.

**Gebruiksgemakbesluit:** er wordt nu geen aparte uitgebreide foerageerregistratie gebouwd. Extra verplichte invoer tijdens het vissen past niet bij het doel van een laagdrempelige app. De bestaande waarnemingen blijven optionele, kwalitatieve context en worden niet gebruikt voor tijdvaktraining. Ontbrekende tijdstippen blijven onbekend; ze worden nooit afgeleid uit sessiestart, sessie-update of registratietijd.

Een eventuele latere uitbreiding moet optioneel en met minimale handelingen kunnen worden vastgelegd. Alleen als gebruikerswaarde en aantoonbare modelverbetering opwegen tegen de invoerlast, onderzoeken we een eenvoudige registratievorm. Tot dat moment geen nieuwe entiteit, migratie, invoerscherm of numerieke modelinvloed.


## 14. Thermische curve: expliciete voorlopige status

De huidige asymmetrische Gaussische curve en de per-soort `thermalOptimum`-/breedteparameters zijn een voorlopige modelvorm, geen uit gepubliceerde Nederlandse velddata gefitte respons. Ook de efficiëntievloer en de exponent in de omzetting naar 1–10 zijn technische modelkeuzes. Algemene temperatuur-/voedingsliteratuur onderbouwt het mechanisme, niet deze exacte numerieke waarden.

De profielvelden `optimalTempRange` en `tolerableTempRange` zijn daarom voorlopig en mogen niet worden gelezen als gevalideerde fysiologische grenzen. Teksten mogen uit een lage thermische modelrespons geen bewezen winterrust of stop van voedselopname afleiden. Hoge watertemperatuur is zonder opgeloste-zuurstofmeting evenmin bewijs van zuurstofstress.

Dezelfde thermische analyse wordt momenteel voor alle tijdvakken van één doeldag gebruikt; de bestaande tijdstip-/schemeringsnotities veranderen de score niet. De huidige engine kan daarom geen thermisch onderbouwd beste tijdvak selecteren. Een latere tijdvaklaag vereist directe soortspecifieke gedragsdata en chronologische validatie.


## 15. Presentatie van de huidige thermische score

De bestaande 1–10-uitkomst wordt in de UI aangeduid als **thermische activiteitspotentie**, niet als totale biologische activiteit. De huidige score wordt uitsluitend bepaald door de voorlopige soortspecifieke temperatuurcurve; wind, druk, seizoen, licht/tijdstip, bewolking en neerslag zijn op dit moment verklarende context en tellen numeriek niet mee. Dit onderscheid moet zichtbaar blijven totdat aanvullende gedragslagen afzonderlijk zijn onderbouwd en gevalideerd.

Een lage thermische score mag niet worden vertaald naar bewezen winterrust, volledige inactiviteit of een stop van voedselopname. De score is een relatieve modelschatting, geen directe observatie van visgedrag.


## 16. Evidence-classificatie voor thermische fysiologie

Het researchregister onderscheidt nu twee extra gemeten responsen:
- `metabolic_rate`: standaard-/routinezuurstofverbruik en andere expliciet gemeten metabole responsen;
- `aerobic_scope`: verschil tussen maximale en standaardmetabolische capaciteit.

Deze uitkomsten blijven gescheiden van `feeding_intensity`, `feeding_rhythm`, `foraging_behavior`, `locomotor_activity` en `growth`. Een hogere metabole snelheid is niet automatisch meer voedselopname, meer spontane activiteit of een hogere vangstkans. Aerobe scope is fysiologische capaciteit, geen rechtstreekse meting van gedrag.

De eerste bronnen laten soort-, grootte- en levensfaseverschillen zien. Ze worden alleen als biologische onderbouwing geregistreerd; alle nieuwe records zijn niet-goedgekeurd voor numeriek voorspellingsgebruik. Exacte soortcurves moeten nog afzonderlijk worden beoordeeld op responsvariabele, experimentele omstandigheden en overdraagbaarheid naar Nederlandse praktijkwateren.


## 17. Soortspecifieke thermische brondekking en grootte-effecten

De huidige brondekking is per soort ongelijk. Voor Baars en Snoekbaars is er direct onderzoek naar aerobe scope; bij Baars verschuift de optimale temperatuur met lichaamsmassa en bij Snoekbaars verschillen volwassen en juveniele temperatuurresponsen. Voor Brasem en Voorn zijn SMR/RMR-metingen over 5–23 °C beschikbaar. Voor Karper en Snoek zijn de gevonden metabole studies beperkter en leveren zij geen complete thermische optimumcurve. Voor Zeelt, Meerval en Roofblei ontbreekt momenteel een vergelijkbare soortspecifieke multi-temperatuur aerobe-scopecurve.

De app vraagt geen verplichte lengte-/leeftijdsgegevens voor een prognose. Geregistreerde vangstlengtes vormen geen representatieve steekproef van de aanwezige populatie. We gebruiken daarom geen verzonnen gemiddelde levensfase of lichaamsgroottecorrectie. Huidige soortparameters blijven voorlopig totdat de gekozen responsvariabele, bronoverdracht en onzekerheid per soort verdedigbaar zijn.


## 18. Tijdvakprognose: biologisch betekenisvol verschil, geen geforceerde winnaar

Een tijdvak krijgt alleen een hogere biologische voorkeur wanneer een relevante, soortspecifieke factor dat verschil onderbouwt. Een soortgebonden dag-/nacht-/schemeringsritme kan zo'n factor zijn wanneer de bron daadwerkelijk het relevante gedrag meet (bijvoorbeeld voedingsritme of foerageeractiviteit) en de overdraagbaarheid naar de voorspelde situatie verdedigbaar is. Habitat- of locomotiegegevens mogen niet zonder meer als voedingsbewijs worden gebruikt.

De prognose moet niet altijd één 'beste' tijdvak aanwijzen:
- **Duidelijke voorkeur:** er is voldoende onderbouwd verschil tussen tijdvakken; toon de voorkeur en de bepalende factor(en).
- **Klein verschil:** toon dat de tijdvakken dicht bij elkaar liggen en vermijd een stellige aanbeveling.
- **Geen betekenisvol verschil:** presenteer de tijdvakken als gelijkwaardig; geef geen kunstmatige winnaar en suggereer niet dat de gebruiker daarom 's nachts moet vissen.

De visser blijft altijd vrij in de keuze van het vistijdstip. De prognose ondersteunt die keuze, maar schrijft geen tijdstip voor. Een gelijkwaardige uitkomst is een geldige en nuttige prognose-uitkomst, geen tekortkoming die met willekeurige gewichten moet worden opgelost.

Implementatievoorwaarden: vergelijk tijdvakken alleen op factoren die aantoonbaar per tijdvak veranderen; gebruik geen standaard nacht-/schemerbonus; kalibreer soortspecifieke voorkeuren op direct gedragsbewijs; bepaal pas na validatie drempels voor 'klein' versus 'betekenisvol' verschil. Tot die tijd geen numerieke tijdvakscore of rangschikking toevoegen. De UI mag gelijkwaardigheid expliciet communiceren.


## 19. Samenvatting is consistent met de tijdvakstatus

De prognose-samenvatting maakt onderscheid tussen ontbrekende thermische basisgegevens, gelijkwaardige beschikbare tijdvakken, een onderbouwd beste toekomstig tijdvak en een dag waarvan alle tijdvakken verstreken zijn. Gelijkwaardige tijdvakken worden expliciet als zodanig beschreven; ze worden niet verward met verstreken tijdvakken. Dit wijzigt geen modelscore of biologische factor.


## 20. Dagritmebewijs: gemeten respons bepaalt de toegestane conclusie

Het researchregister bevat nu aparte tijdgebonden bronnen voor snoek, snoekbaars en roofblei. Elke bron wordt geclassificeerd naar de daadwerkelijk gemeten respons: voedselopname-/verteringscontext, locomotorische activiteit of habitatgebruik. Een bewegingspiek rond schemering is geen automatisch bewijs voor een voedingspiek; een nachtelijke locatie is geen bewijs voor nachtelijke jacht. De snoekbaarsprofieltekst benoemt daarom de schemeringsgerichte bewegingsbevinding met individuele en contextuele variatie, niet een universeel nachtactief patroon.

Alle nieuwe records blijven niet-goedgekeurd voor numerieke voorspelling. De bestaande tijdvakscore en de thermische berekening blijven ongewijzigd. Een volgende modelstap moet zonne-gerelateerde dageraad/schemering kunnen onderscheiden van vaste klokblokken en de gedragsresponsvariabele expliciet behouden.


## 21. Directe voedingsritmes: levensfase en seizoen blijven zichtbaar

Nieuwe directe bronnen laten zien dat jonge snoek overdag jaagt en in de planktivore fase een bifasisch voedingsritme kan hebben; dit mag niet worden veralgemeniseerd naar volwassen snoek. Voor snoekbaars in het Ladogameer werd een voedingspiek in de vroege ochtend van juni tot augustus en een tweede avondpiek in september beschreven. Deze lokale, seizoensgebonden uitkomst staat naast telemetrieonderzoek dat beweging rond schemering meet. Beide responsen worden afzonderlijk geregistreerd en niet automatisch tot één universele tijdvakvoorkeur samengevoegd.


## 22. Soortspecifieke dagdeelprofielen zijn kwalitatieve hypothesen

De canonieke dagdeelvoorkeuren zijn herzien op basis van direct voedingsbewijs waar beschikbaar. Karper krijgt geen algemene nachtvoorkeur; brasem is in de beschikbare in-situ studie vooral daggebonden; zeelt heeft beperkte maar directe avond-/nachtpieken; blankvoorn en baars vertonen seizoensafhankelijke verschuivingen. Het generieke fallbackprofiel bevat geen eigen dagdeelvoorkeur. Deze gegevens blijven beschrijvende context, geen numerieke tijdvakbonus of score. De vaste klokblokken zijn onvoldoende om zonsopkomst en schemering in alle seizoenen nauwkeurig te representeren.


## 23. Diel evidence service: responsvariabelen blijven gescheiden

`getSpeciesDielBehaviorEvidenceContext()` levert per soort afzonderlijke collecties voor `feeding_rhythm`, `locomotor_activity` en `habitat_use`. Het servicecontract gebruikt alleen expliciet soortgekoppelde research-registerrecords en houdt goedgekeurde kennis apart. Een soort met alleen telemetrie krijgt de scope `movement-only`; het systeem leidt daaruit geen voedingsritme af. Voor `Overig` worden geen soortspecifieke tijdpatronen geërfd. De service bevat geen tijdvakscore of modelgewichten en vormt een gecontroleerde inputlaag voor latere zonne-relatieve tijdvaklogica.


## 24. Zonne-relatieve context vóór eventuele tijdvakscoring

Open-Meteo levert voor elke prognosedatum lokale zonsopkomst en zonsondergang. Deze gegevens worden aan de bestaande vaste tijdvakken gekoppeld om te tonen welk tijdvak het brede overgangsvenster rond zonsopkomst/-ondergang omvat. Het venster van ±60 minuten is uitsluitend presentatieve context, geen gevalideerde biologische schemerduur of modelgewicht. De vier vaste klokblokken blijven bestaan; latere tijdvakscoring vereist eerst een beter onderbouwde, zonne-relatieve periode-indeling en chronologische validatie.


## 24. Zonne-relatieve perioden: civiele schemering, niet een vaste bonus

De tijdvakcontext gebruikt nu een schatting van civiele dageraad en civiele schemering op basis van de lokale sunrise/sunset-waarden en breedtegraad. De berekening verschuift mee met seizoen en latitude; de bestaande vier klokblokken blijven alleen als presentatielaag bestaan. Een soortvoorkeur voor dageraad, dag, schemering of nacht kan later aan deze zonneperioden worden gekoppeld, maar alleen met passende soortspecifieke gedragsdata. Civiele schemering zelf is geen voedingsbewijs en levert nu geen numerieke factor op.


## 25. Diel gedrag: bewijs per gemeten respons, niet per soortlabel

Het onderzoeksregister onderscheidt directe voedselopname/-ritmiek van locomotorische activiteit en habitatgebruik. De recente bronnen laten zien waarom dit nodig is: blankvoorn/brasem kunnen afhankelijk van levensfase, dieet en pelagisch/littoraal habitat een dag- of nachtpatroon laten zien; baars heeft een directe herfstwaarneming met oplopende maaginhoud richting schemering; vroege juveniele meerval foerageert ’s nachts, maar dat mag niet naar volwassen exemplaren worden geëxtrapoleerd. Voor snoek en roofblei is beweging niet automatisch jacht- of voedingsintensiteit.

Tijdvakmodellering blijft uitgeschakeld totdat het bewijs voldoende overdraagbaar en toetsbaar is. Elke toekomstige voorkeur moet gekoppeld zijn aan de daadwerkelijk gemeten respons, soort, levensfase, seizoen, habitat, lichtconditie en relevante onzekerheid. Tegenstrijdige studies blijven zichtbaar en worden niet gemiddeld tot een schijnbaar universele soortvoorkeur.


## 26. VisCoach-tijdvenster en levensfase

De gekozen starttijd is onderdeel van de primaire VisCoach-invoer. De adviesvertaling mag daarom niet zonder meer de globale bestTimeSlot van de dagprognose herhalen. Voor één gekozen tijdvak wordt de bijbehorende TimeSlotAnalysis.conclusion gebruikt. Een sessie die meerdere tijdvakken omvat, krijgt geen kunstmatige enkele winnaar; de globale dagvoorkeur blijft hooguit als afzonderlijke dagcontext zichtbaar. Dit verandert geen biologische score of rangschikking.

Levensfase wordt niet als verplicht gebruikersveld toegevoegd. De modelarchitectuur gebruikt levensfase alleen wanneer die betrouwbaar bekend is en de betreffende bron daadwerkelijk een levensfase-effect op de gemeten respons ondersteunt. Zonder die informatie blijft de soortbrede prior gelden met passende onzekerheid. Geen levensfase afleiden uit lengte zonder soortspecifieke, gevalideerde relatie.


## 27. Volwassen meerval: beweging en voedselopname strikt gescheiden

De volwassen veldtelemetrie van Santos et al. (2025) voegt een seizoensgebonden schemer-/nachtpatroon toe aan de locomotorische en dieptegebruikscontext van Europese meerval. Versnellingsmeters en druksensoren meten activiteit en diepte, niet rechtstreeks voedselopname. Ook wanneer auteurs bewegingspieken als mogelijke predatie/foerageeractiviteit interpreteren, blijft dit bewijs voor beweging/habitat; het mag niet worden samengevoegd met de directe, maar gecontroleerde voedingsmetingen van Boujard (1995). Geen tijdvakscore of voedingsbonus wordt geactiveerd.


## 28. Status VisCoach-selectie en bewijs-gating (16 november 2026)

De coachvertaling gebruikt nu het door de gebruiker gekozen sessievenster. Eén geselecteerd tijdvak wordt vertaald via de conclusie van dat tijdvak; een sessie die meerdere tijdvakken omvat krijgt geen geforceerde globale winnaar. De dagprognose blijft intact en wordt niet opnieuw berekend door de coachvertaling.

Levensfase is een optionele interne modifier, nooit een verplichte intake. Alleen expliciet en betrouwbaar bekende levensfasecontext mag een brongebonden nuance activeren. Bij onbekende levensfase blijft het soortbrede profiel gelden met passende onzekerheid; vangstlengte alleen is geen gevalideerde leeftijdsclassificatie.

De meest recente evidence-uitbreiding houdt volwassen meervaltelemetrie gescheiden van voedingsmetingen en koppelt de Ladogameer-voedingsbron apart aan baars. Alle betrokken bronnen blijven niet-goedgekeurd voor numerieke invloed. De volgende stap is een bron-voor-bron overdraagbaarheidsmatrix, niet het toevoegen van modelgewichten. Beoordeel responsvariabele, levensfase, seizoen, habitat/watertype, meetmethode, steekproefopzet en overdraagbaarheid naar Nederlandse binnenwateren. Tegenstrijdige of beperkte bronnen blijven zichtbaar als onzekerheid; geen universele soortvoorkeur construeren uit contextgebonden studies.


## 29. Eerste overdraagbaarheidsmatrix per soort

De eerste inventarisatie van het huidige researchregister laat zien dat directe tijdgebonden voedingsdata bij acht van de negen concrete soorten aanwezig is, maar de bruikbaarheid verschilt sterk. Karperbewijs is vooral gecontroleerd; brasem/blankvoorn laten leeftijds- en dieetafhankelijke dag-/nachtverschillen zien; snoek heeft beperkte volwassen tijdresolutie maar een levensfasegebonden juveniele bron; baars heeft meerdere maar seizoens-/prooigebonden veldpatronen; zeelt heeft een veldstudie uit één water plus gecontroleerd onderzoek; snoekbaars heeft een lokale seizoensgebonden dagritmebron; meerval heeft afzonderlijk adult gecontroleerd en juveniel veldbewijs. Voor roofblei ontbreekt directe dagdeel-resolved voedselopname.

Deze dekking betekent niet dat de tijdvakvoorkeur al voorspelbaar of overdraagbaar is. Elke conclusie moet de gemeten respons, levensfase, seizoen, habitat/watertype, prooiaanbod, meetmethode en geografische context behouden. Een soortlabel alleen is onvoldoende om bronnen samen te voegen. Tegenstrijdige bronnen blijven naast elkaar staan totdat hun context verklaard kan worden.

**Architectuurregel:** het model mag uitsluitend een claim op een responsvariabele baseren die de bron daadwerkelijk heeft gemeten. Directe voedselopname kan een kwalitatieve voedingsclaim ondersteunen; locomotie kan alleen bewegingscontext ondersteunen; habitatdata alleen habitatcontext; dieet/prooikeuze alleen dieetcontext. Geen van deze bronnen is op dit moment numeriek goedgekeurd. De matrix staat in `FASE2_PROGNOSE_AUDIT.md §34`.


## 30. Juveniele cypriniden: Bohl-bron geregistreerd met levensfasegrens

Bohl (1979; kleine Beierse meren) is nu als aparte bron aan Brasem en Voorn/blankvoorn gekoppeld. De studie combineert echoloodwaarnemingen en maaginhoud bij juveniele vissen en beschrijft nachtelijke pelagische aanwezigheid en voedselopname vóór middernacht. Dit vormt geen tegenspraak die een volwassen dagvoedingsprofiel moet overschrijven: levensfase, habitat en prooitype verschillen. De bron is zichtbaar als context, blijft niet-goedgekeurd voor numerieke voorspelling en activeert geen nachtbonus.

Het interne type `Voorn` blijft voor compatibiliteit bestaan maar staat biologisch voor `Rutilus rutilus` (blankvoorn). De onjuiste zichtbare combinatie 'Blankvoorn / Ruisvoorn' is gecorrigeerd; ruisvoorn is een andere soort en krijgt niet stilzwijgend dezelfde bronnen of profielparameters.


## 31. Baars: Bodenmeer-dagritmebron is juveniel en seizoensgebonden

De volledige Bretzel et al. (2021)-publicatie is gecontroleerd. De 24-uurs voedingsanalyse betreft juveniele 0+ baars in pelagisch habitat en is gebaseerd op herfstgegevens uit 2018. Het gemeten patroon (voedingspieken rond dageraad/schemering en afname in de nacht) mag niet als volwassen of universeel baarsprofiel worden gebruikt. Maaginhoud is een proxy voor recente opname; vangstmethode en prooigemeenschap zijn contextbeperkingen. De bron blijft niet-goedgekeurd voor numerieke voorspelling.


## 32. Zeelt: veldritme is beperkt tot één kleine waterlocatie en leeftijdsmix

De primaire publicatie van Bezmaternykh & Shcherbina (2018) is nader gecontroleerd: 90 vissen uit één klein eutroof water in Perm krai gedurende de vegetatieperiode van 2013, met circa drie-uurlijkse kieuwnetbemonstering; 66 vissen hadden voedsel in het spijsverteringskanaal. De avond-/nachtintervallen 18–21 en 00–03 zijn directe maaginhoud-/voedingsindexwaarnemingen, geen continue gedragsobservatie. Voedselkeuze verschilde met leeftijd. De bron blijft contextgebonden en niet-goedgekeurd; geen algemene nachtbonus.


## 33. VisCoach gebruikt literatuur als begrensde context, niet als verborgen score

De sessiecoach voegt een compacte biologische context toe vanuit `feedingEvidenceService` en `dielBehaviorEvidenceService`. Directe voedingsritmestudies worden onderscheiden van voedingsintensiteit zonder dagritme en van beweging/habitat/dieet. Wanneer levensfase en lokale voedselcontext onbekend zijn, wordt geen vaste tijdvakvoorkeur afgeleid. Er worden geen brongewichten, tijdvakbonussen of vangstkansen toegevoegd.

Ook opgeslagen sessieadviezen krijgen voortaan het tijdvak uit de echte sessie-start/eindtijd. Een sessie die meerdere tijdvakken bestrijkt krijgt geen globale dagwinnaar. De planweergave en het opgeslagen coachadvies volgen daarmee dezelfde selectie-regel.


## 34. Karper: temperatuur- en kloktijd uit de 2012-studie niet als veldvoorkeur behandelen

Chen et al. (2012) rapporteerden bij de ondersoort `Cyprinus carpio haematopterus` ochtend- en avondpieken in experimentele voedselopname bij volwassen (630–850 g) en jonge (61–91 g) vissen. Bij lage temperaturen verschoof/breidde het avondinterval uit; bij 6 °C bleef de opname zeer laag. Dit is directe voedselopname, maar niet hetzelfde als natuurlijke veldactiviteit of vangbaarheid. De abstract is gecontroleerd; volledige methodedetails moeten nog worden geverifieerd. Geen numerieke tijdvakbonus of overdracht naar alle levensfasen/populaties.


## 35. Meerval: gecontroleerd voedingsritme naast gescheiden veldresponsen

Boujard (1995) levert direct bewijs voor nachtelijke voedselopname in een gecontroleerde zelfvoeropstelling, maar de beschikbare abstract specificeert de levensfase niet en laat zien dat individuele versus groepshuisvesting het ritme beïnvloedt. De vroege juveniele veldstudie meet nachtelijke pelagische voedselopname. Twee volwassen veldtelemetriebronnen (Slavík & Horký, 2012; Santos et al., 2025) meten EMG-/accelerometeractiviteit en diepte, niet rechtstreeks voedselopname. Deze responsen blijven afzonderlijk in de registry en in VisCoach. Volwassen telemetrie mag niet als voedingsritme worden gelezen en de gecontroleerde voerautomaatstudie mag niet als veldvangstbewijs worden gepresenteerd. Alle records blijven niet-goedgekeurd voor numerieke voorspelling.


## 36. Blankvoorn: drie aparte tijdresponsen

De blankvoornliteratuur bevat drie verschillende responsen die niet tot één dagdeelbonus mogen worden samengevoegd:
1. Haertel & Eckmann (2002): dieet, habitat en seizoensafhankelijke voedingsintensiteit in een klein mesotroof meer; overdag littoraal/littorale prooi en ’s nachts pelagisch/pelagische prooi.
2. Jacobsen et al. (2004): radio-telemetrische beweging en habitatverdeling in twee ondiepe meren; dageraad-/schemeractiviteit, nachtminimum en een sterk helderheidsafhankelijk ruimtelijk patroon. Geen directe voedingsmeting.
3. Jamet et al. (1990): maaginhoud bij 253 vissen; 2–3-jarige blankvoorn voedde vooral vanaf 14:00 tot schemering, oudere vissen zowel dag als nacht.

De gezamenlijke broncontext ondersteunt dat levensfase, voedseltype, helderheid, predatiedruk en habitat het tijdgedrag beïnvloeden. Het model mag zonder betrouwbare levensfase- en lokale context geen vaste middag-, schemer- of nachtvoorkeur toekennen. Alle bronnen blijven niet-goedgekeurd voor numerieke voorspelling.


## 37. Fase 2 Definition of Done

De initiële biologische prognose is gereed wanneer zij de vijf responslagen gescheiden houdt (thermische activiteit, voeding/foerageren, aanwezigheid/habitat, vangstkans en betrouwbaarheid), alleen direct passende bronnen numeriek gebruikt, waterdata met provenance en onzekerheid verwerkt, en de chronologische lokale evaluatie zonder datalekken uitvoert. Onvoldoende onderbouwde factoren blijven uitleg/context of worden uit de numerieke prognose gehouden.

Tijdvakadvies wordt uitsluitend gevoed door soortspecifieke voedings-/foerageerevidence. Bewegings- of habitattelemetrie kan context geven, maar wordt niet omgezet in een voedingsbonus. Bij onvoldoende onderscheid blijven tijdvakken gelijkwaardig. De gekozen tijd stuurt VisCoach; een sessie die meerdere tijdvakken bestrijkt krijgt geen geforceerde globale winnaar.

De gebruiker hoeft geen levensfase of uitgebreide foerageerobservaties te registreren. Levensfase is een optionele interne modifier wanneer betrouwbaar bekend; onbekend betekent soortniveau met extra onzekerheid. Na de clean start wordt lokale kalibratie pas geclaimd zodra nieuwe vergelijkbare sessies voldoende bewijs leveren. Softwareminimums voor evaluatie zijn geen bewijs van statistische robuustheid.

Fase 3 start pas na formele afvinking van de technische/evidence-criteria in FASE2_PROGNOSE_AUDIT.md §43. Tot dat moment worden onbewezen factoren niet numeriek geactiveerd.


## 38. Verfijnde overdraagbaarheid van dagritmebronnen

De bronlaag onderscheidt bij blankvoorn/brasem de directe voedingsrespons van habitat- en dieetverschuivingen. Vašek & Kubečka (2004) ondersteunen daggebonden zoöplanktonvoeding bij specifieke lengteklassen en maanden in één meso-eutroof stuwmeer; Haertel & Eckmann (2002) beschrijven seizoensafhankelijke dieet- en voedingsintensiteitsveranderingen bij blankvoorn in een klein mesotroof meer. Hautala (2008) beschrijft een herfstverschuiving van dagvoeding naar schemering en later beperkte nachtactiviteit in een boreale oeverzone. Geen van deze bronnen rechtvaardigt een universele tijdvakbonus voor Nederlandse stekken.

Bij snoek wordt het tijdstip van prooivangst onderscheiden van het latere verteringsmetabolisme (Lucas et al., 1991). Bij snoekbaars blijft het Ladogameer-voedingsritme seizoenscontext met beperkte bronverificatie: vroege ochtend in juni–augustus en een tweede avondpiek in september. Dezelfde Poulet et al. (2005)-telemetriestudie heeft één canonieke registratie als bewegingsbewijs; beweging is geen voedingsmeting.

Alle registraties blijven niet-goedgekeurd voor numerieke voorspelling. Onbekende lokale prooisoort, levensfase, reproductiestatus, helderheid en habitat verhogen de onzekerheid. De volledige bron- en methodencontrole blijft onderdeel van Fase 2; er worden geen scores of gewichten geactiveerd.


## 39. Snoekbaars-telemetrie: steekproef en meetresolutie

De twee beschikbare primaire telemetriestudies zijn nu methodologisch explicieter vastgelegd. Poulet et al. (2005) volgden 9 van 13 getagde volwassen snoekbaarzen in een Zuid-Frans kanaal tijdens de paaiperiode, met 24-uursessies en posities per twee uur. Horký et al. (2008) volgden 8 volwassen vissen in de Elbe gedurende 12 maanden en 47 volledige 24-uurscycli, met posities per circa drie uur. Beide vonden hogere beweging tijdens twilight; de Elbe-studie vond nachtelijke ondiepe oeverposities die waarschijnlijk rust vertegenwoordigden.

Dit versterkt de betrouwbaarheid van de **bewegingsbeschrijving**, niet van een voedings- of vangstkansclaim. De app mag de schemeringspiek niet als directe voedingsbonus gebruiken. Individuele variatie, adulte levensfase, paaiperiode in de kanaalstudie en verschil tussen rivier en kanaal blijven expliciete transferbeperkingen.


## 40. Tijdvakcontext gebruikt uitsluitend geclassificeerd dagritmebewijs

De tijdvakfactor haalt zijn verklarende context nu uit dielBehaviorEvidenceService en niet meer uit de verouderde preferredSlots-/crepuscularBonus-velden in de soortprofielen. Directe tijdgebonden voedingsmetingen blijven contextueel en niet-goedgekeurd; telemetrie voor beweging/habitat levert geen voedingsvoorkeur op; zonder passend bewijs wordt geen voorkeur afgeleid. De numerieke tijdvakfactor blijft neutraal en de astronomische lichtcontext blijft apart. Regressietests bewaken karper, roofblei en Overig.
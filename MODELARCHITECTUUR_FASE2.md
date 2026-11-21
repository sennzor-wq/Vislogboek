# Modelarchitectuur Vislogboek — Fase 2

**Besluitdatum:** 16 november 2026  
**Status:** gekozen architectuur; numerieke herkalibratie nog niet uitgevoerd. Laatste architectuursynchronisatie: 19 november 2026. Fase 2 is nog niet formeel geaccepteerd; Fase 3 blijft geblokkeerd.

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


## 41. Vijf responslagen: expliciete implementatiestatus en koppelgrenzen

De prognose wordt ontworpen rond vijf afzonderlijke responsen. Hun huidige volwassenheidsniveau verschilt:

1. **Thermische activiteitspotentie** — numeriek aanwezig, maar de soortcurves zijn voorlopige mechanistische/modelpriors. De waterthermische schatting en de visfysiologische responscurve hebben elk eigen aannames en moeten apart worden gevalideerd.
2. **Voeding en foerageren** — de research registry en `feedingEvidenceService` classificeren de werkelijk gemeten respons per soort. Er is nog geen lokale numerieke voedings- of foerageerprognose.
3. **Aanwezigheid en habitatgeschiktheid** — bestaande habitat-/bewegings-/oeverwind-/positioneringsengines leveren kwalitatieve hypothesen, geen gekalibreerde aanwezigheidskans.
4. **Vangkans** — persoonlijke historische Poisson-baseline op basis van vergelijkbare sessies, vangstaantallen en geregistreerde visduur. Deze baseline wordt niet thermisch gecorrigeerd en is nog geen geïntegreerde berekening van aanwezigheid, voeding, techniek, aas en uitvoering.
5. **Betrouwbaarheid en evaluatie** — provenance, datakwaliteit, onzekerheidsnotities, steekproeflabels en chronologische Brier-evaluatie zijn afzonderlijke signalen. Er bestaat nog geen gevalideerde samengestelde betrouwbaarheidsscore.

**Koppelregel:** geen laag mag stilzwijgend als vervanging voor een andere respons worden gebruikt. Thermische efficiëntie is geen voedingsintensiteit; locomotie is geen jacht- of voedingssucces; habitatgeschiktheid is geen actuele aanwezigheid; historische vangstkans is geen zuiver biologische kans.

De tijdvakken delen momenteel dezelfde thermische analyse voor de doeldag. Zonder gevalideerde tijdafhankelijke voedings-/foerageerrespons blijven tijdvakken gelijkwaardig wanneer de thermische scores gelijk zijn. De gebruiker houdt de keuze; het model forceert geen beste tijdvak.

De huidige Poisson-vangkans wordt alleen als persoonlijke historische baseline gepresenteerd. De thermische dagscore beïnvloedt het geschatte vangsttempo beperkt, maar de voedings- en habitatlaag zijn nog niet numeriek geïntegreerd. De bestaande confidence-labels en intervallen mogen niet worden samengevoegd tot één totaalbetrouwbaarheidspercentage.

Volgende technische stap: parameterherkomstmatrix voor de actieve waterthermische en visfysiologische numerieke aannames; daarna opruimen van niet-aangesloten profielvelden en een expliciete testmatrix voor de vijf responslagen.

## 42. Thermische parameterherkomst en evidence-aware modelrichting

De huidige waterthermische schatter gebruikt heuristische tijdconstanten, responsgewichten, zonnestralings- en windmengingscorrecties. KNMI ondersteunt de fysische factorfamilies, maar niet de concrete Vislogboek-coëfficiënten. De KNMI-verificatie van circa 1 °C geldt voor het operationele KNMI-model en mag niet op deze vereenvoudigde implementatie worden geprojecteerd. Lokale biascorrectie is nog geen kalibratie van de onderliggende fysische parameters.

De visfysiologische curve gebruikt per soort een Gaussisch optimum en koude-/warme breedte. De literatuur meet per soort verschillende responsvariabelen: SMR/RMR, aerobe scope, voedselopname of beweging. Deze uitkomsten zijn niet onderling uitwisselbaar. Met name SMR/RMR-data die exponentieel stijgen over een temperatuurtraject bewijzen geen optimum voor activiteit. Baars en snoekbaars hebben directer aerobe-scopebewijs, maar tonen ook grootte-/levensfase- en aquacultuurbeperkingen. De huidige snoekbaarsparameter wijkt af van de gemeten adulte piek van 18,8 °C; dit blijft een reviewflag totdat overdraagbaarheid naar wilde populaties is beoordeeld.

**Modelregel voor de volgende iteratie:** pas alleen een thermische responsvorm toe die past bij de gemeten uitkomst. Gebruik aerobe scope voor fysiologische prestatiepotentie, SMR/RMR uitsluitend voor metabole temperatuurgevoeligheid, en voedselopname uitsluitend in de voedingslaag. Geen van deze uitkomsten mag rechtstreeks als vangstkans worden geïnterpreteerd. Waar een soortspecifieke curve ontbreekt, toon onzekerheid in plaats van een precies ogend optimum te fabriceren.

## 43. Bronstatus bij thermische activiteitspotentie

De prognose toont bij de temperatuurfactor een compacte, soortspecifieke toelichting op de werkelijk geregistreerde fysiologische responsvariabelen. Directe aerobe-scopecijfers worden onderscheiden van uitsluitend SMR/RMR-metingen en van soorten zonder vergelijkbare geregistreerde temperatuurdata. Alle huidige bronnen blijven niet-goedgekeurd voor numerieke voorspelling.

Deze bronstatus is alleen verklarend: ze wijzigt de voorlopige thermische curve, activiteitsscore, tijdvakrangschikking of vangstkans niet. De factor heet daarom **thermische activiteitspotentie**. SMR/RMR, aerobe scope, voedselopname en hengelvangbaarheid blijven afzonderlijke responsen.

## 44. Geen niet-gevalideerde profielgrenzen of weersvoorkeuren

De soortprofielen bevatten geen ongevalideerde optimale/tolerabele temperatuurzones, barometerbereiken, seizoensgewichten of soortspecifieke wind-/regen-/bewolkingsvoorkeuren meer. Deze velden gaven schijnprecisie en droegen niet bij aan een gevalideerde biologische score.

De bestaande thermische modelpiek en curvebreedtes blijven voorlopig actief als modelprior; de gebruikersweergave labelt ze expliciet als zodanig. Omdat er geen onderbouwde fysiologische grenswaarden zijn, blijft de impactclassificatie van de temperatuurfactor neutraal. De relatieve thermische score blijft ongewijzigd. Wind, druk, seizoen, bewolking en neerslag zijn uitsluitend context, zonder soortspecifieke profielbonus.

## 45. Propagatie van watertemperatuuronzekerheid

Bij een geschatte watertemperatuur met een beschikbaar modelinterval wordt de bestaande thermische curve geëvalueerd over dat interval. De gebruiker ziet naast de centrale score een indicatieve scoreband die uitsluitend de doorwerking van watertemperatuuronzekerheid weergeeft. Dit is geen statistisch betrouwbaarheidsinterval en omvat niet de onzekerheid van de soortspecifieke curve. Gemeten watertemperatuur krijgt geen geschatte scoreband. De centrale scoreberekening blijft ongewijzigd.

## 46. Persoonlijke Poisson-vangkans blijft empirisch gescheiden

De persoonlijke Poisson-vangkans wordt berekend uit het eigen historische vangsttempo per geregistreerd visuur en de geplande sessieduur. De eerdere vaste thermische multiplier is verwijderd omdat de relatie tussen de voorlopige thermische activiteitsscore en persoonlijke vangstfrequentie niet empirisch is gevalideerd.

Thermische activiteit, voeding en habitat blijven afzonderlijke responsen. Ze worden niet als numerieke correctie op de persoonlijke Poisson-baseline toegepast totdat een reproduceerbare koppeling chronologisch is gevalideerd. De vangstkans is dus een historische persoonlijke baseline, geen geïntegreerde biologische vangstprognose.

## 47. Poisson-steekproefbasis is geen betrouwbaarheidspercentage

Het label bij de persoonlijke Poisson-vangkans beschrijft uitsluitend de omvang van de bruikbare historische steekproef. Het aantal getoonde Poisson-sessies is exact het aantal sessies met bekende duur en bruikbare vangstaantallen dat de vangsttempo-schatting voedt. De categorie wordt niet aangeduid als statistische betrouwbaarheid.

Het 95%-Wilson-interval blijft een afzonderlijke maat voor de historische binomiale sessiesuccesfractie op basis van vergelijkbare sessies. Het is geen onzekerheidsinterval rond de Poisson-kans voor de geplande duur.

## 48. Kwalitatieve onderbouwing is geen statistische betrouwbaarheid

De labels voor waterthermische databasis, positioneringsadvies en habitatinschatting beschrijven kwalitatief de beschikbare bronbasis en context. Ze mogen niet worden gelezen als gekalibreerde kansen of statistische betrouwbaarheidspercentages. De UI gebruikt daarom 'Databasis watertemperatuur' en 'Onderbouwing stekadvies/habitatinschatting'.

De statistische Wilson-interval blijft uitsluitend gekoppeld aan de historische sessiesuccesfractie. De Poisson-vangkans toont haar eigen bruikbare steekproefomvang.

## 49. Versiezuivere forward validation

Elke wijziging van de berekeningslogica die de voorspelde vangkans beïnvloedt, verhoogt de prognosemodelversie en de bijbehorende engineversie. De Brier-score wordt uitsluitend berekend over momentopnames van de actuele modelversie. Oudere versies worden expliciet uitgesloten van de huidige modelscore.

Werkelijk afgeronde uitkomsten van oudere modelversies mogen wel worden gebruikt als historische waarnemingen in de chronologische naive baseline, mits de gekoppelde sessie aantoonbaar vóór het nieuwe prognosetijdstip is beëindigd. De oude voorspelde kans zelf wordt niet als trainingsuitkomst gebruikt.


## 50. Transparante telling van modelversies in evaluatie

De evaluatie-uitvoer onderscheidt `totalSnapshots`, `currentModelSnapshotCount` en `outdatedVersionCount`. De statistiekenweergave toont opgeslagen historie, actuele modelmomentopnames en oudere/afwijkende versies die niet in de huidige Brier-score meetellen. Dit is uitsluitend transparantie over de evaluatiesteekproef; het verwijdert of muteert geen historische gegevens.


## 51. Primaire aerobe-scopebronnen: omvang, levensfase en responsvorm

De volledige studies van Christensen et al. (2020) en Frisk et al. (2012) tonen waarom één vaste temperatuurpiek per soort te simplistisch is. Bij baars verschuift het aerobe-scopeoptimum met lichaamsmassa en is bij de gemodelleerde vissen onder 40 g geen optimum binnen het onderzochte bereik gevonden. Bij volwassen snoekbaars is de berekende 18,8 °C-piek onderdeel van een breed 80%-bereik (10,4–26,9 °C), terwijl de scope van 13–25 °C statistisch niet verschilde en de 28 °C-groep klein was (n=3). De aparte baars-temperatuurvoorkeurmeting is geen aerobe-scope-uitkomst.

Beide bronnen blijven mechanistische, laboratorium-/aquacultuurpriors; ze valideren geen directe voeding, activiteit in het wild of vangstkans. Geen numerieke curveparameters worden hieruit automatisch overgenomen. De bestaande profielen blijven voorlopig en niet-goedgekeurd voor voorspelling.


## 52. Brier vergelijkt gelijke voorspelde en werkelijke blootstellingsduur

De persoonlijke Poisson-vangkans wordt berekend voor de vooraf geplande sessieduur. De primaire Brier-score telt daarom alleen afgeronde sessies waarvan de werkelijke duur (endTime - startTime) op minuutprecisie gelijk is aan de duur in de onveranderlijke prognosesnapshot. Duurafwijkingen en ontbrekende/expliciet onbekende duur worden apart geteld en uitgesloten; de kans wordt niet achteraf omgerekend en er wordt geen willekeurige tolerantie toegepast. De huidige vangstkans is niet per tijdvak berekend, dus targetSlot wordt niet als Brier-eligibilitycriterium gebruikt.

Naast de totaalscore worden Brier-score, gemiddelde voorspelde kans, gerealiseerde vangstfractie en sessieaantal per doelsoort getoond. Deze soortdiagnostiek is beschrijvend, geen automatische feedback of zelftraining. Kleine aantallen blijven expliciet onzeker.


## 53. Tijdelijke uitzondering voor één betwiste dependency-advisory

De CI dependency-audits sluiten uitsluitend `GHSA-fc5q-39xc-vjpf` voor transitieve dependency `picomatch@4.0.7` tijdelijk uit. De advisory blijft als High gepubliceerd; upstream betwist de classificatie en er was geen bevestigde patchrelease beschikbaar bij vastlegging. Dit is een gedocumenteerde risico-uitzondering, geen veiligheidsverklaring. Alle andere production- en full-auditcontroles blijven actief. Herbeoordeel en verwijder de uitzondering zodra een gepatchte release beschikbaar is of de advisory formeel wordt ingetrokken/gewijzigd. Merge blijft afhankelijk van een volledig groene Quality Gate op PR-head én mergecommit.


## 54. Datakwaliteit van vangsttijd en hengelblootstelling

De huidige vangsttijd (`CatchItem.timestamp`) wordt bij een nieuwe invoer standaard gevuld met het moment waarop het formulier wordt geopend. De tijd is aanpasbaar, maar normale vangsten bewaren geen expliciete bron-/bevestigingsstatus. `createdAt` is het opslagmoment en kan vertraagde invoer signaleren, maar bewijst de werkelijke vangsttijd niet. Sessiegrenzen worden bij opslaan niet gecontroleerd. Legacy-imports kunnen via `legacyImportQuality.timestampKnown` expliciet onbekende tijdstippen markeren.

Hengelgebeurtenissen en actieve perioden zijn optionele, handmatige details. Gebeurtenissen worden niet automatisch aan vangstrecords gekoppeld en hebben geen volledigheidsstatus. Actieve perioden tellen alleen mee als het interval geldig is; de bestaande effort-engine begrenst op sessiegrenzen en voegt overlap per hengel samen, maar kan de feitelijke juistheid van handmatig ingevoerde tijden niet vaststellen.

Daarom geldt:
- Brier-validatie op sessie-uitkomst en totale sessieduur blijft onafhankelijk van deze velden.
- Vangsttijd is nog geen betrouwbaar onafhankelijk label voor tijdvak-/voedingsvalidatie.
- Hengeluren zijn geregistreerde inspanning, geen geverifieerde meetwaarde.
- Geen ontbrekende inzet afleiden uit sessieduur × hengelaantal.
- Tijdvak- en voedingsvalidatie blijft geblokkeerd tot tijdherkomst, volledigheid en sessiegrenzen voldoende zijn geborgd.

Een toekomstige verbetering moet de tijdherkomst zo veel mogelijk automatisch vastleggen, zonder extra verplichte gebruikersinvoer.


## 55. Persoonlijke tijdvakervaring: starttijdindeling is geen blootstellingsvalidatie

De persoonlijke ervaring die per tijdvak wordt getoond, groepeert afgeronde sessies op het lokale uur van `FishingSession.startTime`. De volledige sessie wordt aan dat starttijdvak toegewezen, ook wanneer zij meerdere tijdvakken beslaat. De maat is het percentage succesvolle sessies, geen tijdvakgebonden vangstkans of vangsttempo. Vangsttijdstippen en actieve hengelintervallen verdelen de sessie momenteel niet over tijdvakken.

Deze ervaring is uitsluitend beschrijvend. De thermische tijdvakscore en `bestTimeSlot` worden er niet door aangepast. De UI maakt de starttijdindeling expliciet; regressietests borgen dat een sessie over meerdere tijdvakken de thermische rangschikking niet beïnvloedt.


## 56. Herkomstmetadata voor geregistreerde tijden

Nieuwe vangsten krijgen bij openen van het formulier automatisch een tijdstip (`automatic`). Een gebruiker kan dit blijven aanpassen; bij een wijziging wordt `user_adjusted` opgeslagen. Bij het bewerken van bestaande records blijft de herkomst behouden als het tijdstip ongewijzigd blijft. Ontbrekende herkomst bij oudere registraties blijft ontbrekend; er wordt niets afgeleid uit `createdAt`.

Nieuwe hengelgebeurtenissen krijgen dezelfde metadata bij toevoegen en kunnen zonder extra invoerveld worden aangepast. De status `user_adjusted` is geen onafhankelijke tijdverificatie. Alleen vangsttijdherkomst wordt in de privacybewuste historische prognosefeatures opgenomen; hengelgebeurtenissen worden niet gekopieerd zolang de prognose-engine ze niet als input gebruikt. Historische featureversie is verhoogd naar 2; bestaande schema-1-snapshots blijven ongewijzigd.

Deze metadata verandert geen score, tijdvakrangschikking, Brier-uitkomst of biologische parameter en mag niet zelfstandig als voedingsactiviteit-label worden gebruikt.


## 57. Hengelinzet: onbekend onderscheiden van nul

Een hengel zonder geregistreerde actieve intervallen heeft onbekende inzet; de app mag dit niet als nul hengeluren presenteren. Alleen expliciet geregistreerde, parseerbare en positieve intervallen leveren uren op. Onvolledige intervallen worden uitgesloten en geteld. Intervallen buiten sessiegrenzen worden begrensd en afzonderlijk gemeld; ongeldige sessiegrenzen maken de aanwezige intervallen niet valideerbaar. Bij gedeeltelijke registratie is het totaal uitsluitend een geregistreerd subtotaal, geen volledige sessie-inzet.

Deze kwaliteitsmetadata is beschrijvend. Zij activeert geen tijdvakscore, catch probability of biologische modelparameter en voegt geen verplichte gebruikershandeling toe.


## 58. Tijdvakvalidatie: blootstelling en vangstlabels gescheiden houden

Een toekomstige tijdvakdiagnose mag alleen expliciet geregistreerde hengelintervallen als blootstelling gebruiken en moet ontbrekende inzet als onbekend houden. Intervallen worden op absolute tijdstempels gesplitst naar de bestaande tijdvakken in `Europe/Amsterdam`; DST mag niet via vaste UTC-offsets worden benaderd. Bij gedeeltelijke registratie is het resultaat een geregistreerd subtotaal, geen volledige blootstelling.

Vangsttijd-herkomst blijft essentieel: `automatic` is formulier-openmoment, `user_adjusted` is een gebruikersgerapporteerd tijdstip en oudere records zonder status blijven ongeclassificeerd. Geen van beide statussen is onafhankelijke verificatie. Een vangst in één tijdvak bewijst niet dat andere tijdvakken nulvangst hadden. Alleen expliciet bevestigde nulvangstsessies kunnen sessiebrede nuluitkomsten leveren, en alleen waar tijdvakblootstelling aantoonbaar is.

Soortspecifieke hengeluren zijn met de huidige datastructuur alleen veilig te vergelijken voor sessies met één doelsoort; per-hengel doelsoorttoewijzing ontbreekt. Hengelgebeurtenissen worden niet naast CatchItem-vangsten opgeteld zolang er geen unieke koppeling bestaat. Groepsvangsten blijven één geregistreerd tijdstip voor het opgegeven aantal.

Deze diagnose is beschrijvend en offline. Zij verandert geen Brier-score, vangstkans, tijdvakrangschikking of biologische parameter.


## 59. Standalone tijdvakblootstellingsdiagnose

`calculateTimeSlotRodExposure()` verdeelt uitsluitend expliciet geregistreerde actieve hengelintervallen over de vier Amsterdamse tijdvakken. Overlap wordt per hengel samengevoegd; meerdere hengels blijven afzonderlijke blootstelling. Onbekende en onvolledige registraties worden apart gerapporteerd. De berekening gebruikt absolute ISO-tijden en de `Europe/Amsterdam`-tijdzone, inclusief DST-overgangen.

Dit is een technische bouwsteen voor latere datakwaliteitsanalyse, geen prognose-input. Er zijn geen vangstlabels, soortspecifieke conclusies of negatieve uitkomsten aan gekoppeld.


## 60. Vangstbewijs per tijdvak: uitsluitend positieve gebruikersrapportage of bevestigde sessiebrede nul

De tijdvak-audit onderscheidt formulier-openmomenten (`automatic`) van door de gebruiker aangepaste vangsttijden (`user_adjusted`). Alleen de laatste kan een positief, gebruikersgerapporteerd tijdvaksignaal opleveren; dit is niet onafhankelijk geverifieerd. Ontbrekende/legacy-herkomst, automatische tijden, ongeldige tijden en tijden buiten de sessie blijven buiten de tijdvaklabels.

Een vangst in één tijdvak rechtvaardigt geen nulvangst in de overige tijdvakken. Een bevestigde nulvangstsessie zonder gekoppelde vangstrecords kan nuluitkomst geven uitsluitend voor tijdvakken met geregistreerde hengelblootstelling. Bijvangst wordt niet als doelsoortvangst gebruikt; meersoortige sessies worden niet soortspecifiek ingedeeld. Groepsvangsten behouden één registratiemoment voor het groepsaantal.

Deze helper is diagnostisch, niet voorspellend en heeft geen invloed op Brier, catch chance of biologische activiteit.


## 61. Presentatie van persoonlijke tijdvakervaring

De UI noemt de maat nu "Eigen sessie-uitkomsten bij starts in dit tijdvak". Het percentage heet "sessiesucces" en beschrijft het aandeel vergelijkbare sessies met doelsoortvangst uit sessies die in dat tijdvak startten. Het is geen vangstkans per uur of per tijdvak. De berekening en modelrangschikking veranderen niet.


## 62. Bronnen tellen op studie, niet op registratierecord

Het research register mag dezelfde publicatie niet als meerdere onafhankelijke bewijsbronnen laten meetellen doordat zij onder verschillende ID's of soortvolgordes is geregistreerd. De Římov 2004-voedingsstudie voor brasem/blankvoorn is daarom één canoniek record dat aan beide soorten gekoppeld is. Tegenstrijdige levensfase-/habitatbevindingen blijven in de beperkingen zichtbaar. Deze consolidatie wijzigt geen goedkeuring of score.


## 63. Roofblei: seizoensdieet is geen dagritme

De veldstudie uit de Szczecin Firth (1976) is als beperkte dieetcompositiebron geregistreerd. Zij beschrijft prooifrequenties per seizoen, maar meet geen dagelijkse voedingsintensiteit of tijdstipgebonden voedselopname. De roofblei blijft daarom `diet-only` in de voedingscontext; de telemetriestudies blijven `movement-only` voor tijdgebonden gedrag. Er volgt geen tijdvakvoorkeur uit deze bronnen.


## 64. Karper: veldvoeding, aasstationgedrag en wedstrijdvangst strikt scheiden

Het register bevat directe veldstudies naar karpervoeding bij bijgevoerd meerpunten (Bajer et al. 2010; Ghosal et al. 2018; Hundt et al. 2022), een natuurlijk-rivierstudie met maag-/voorkeeldarminhoud (Kwak et al. 1992), gecontroleerd tegenbewijs zonder duidelijke dagpiek bij jonge karpers (Rahman et al. 2008), en wedstrijdvangstverdeling als afzonderlijke uitkomst (Žák 2021). Kwak et al. vonden discontinu en sterk variabel voeren, met gemiddelde intensiteitspieken rond zonsopkomst en zonsondergang. De wedstrijdstudie is geen directe feeding-rhythm meting en krijgt daarom het eigen outcome-type `angler_catch_distribution`, dat niet door de voedings- of diel-feeding-services wordt gelezen.

De veldstudies laten geen universeel dagritme zien: nachtelijke voedselopname trad op bij specifieke bijgevoerd-punt-opzetten, terwijl de natuurlijke rivierstudie gemiddelde ochtend-/schemerpieken vond en de gesimuleerde jonge karpers geen duidelijke piek vertoonden. Individuele variatie, voedselbron, levensfase, seizoen, water en onderzoeksopzet begrenzen overdraagbaarheid. Alle bronnen blijven niet-goedgekeurd voor voorspelling; er wordt geen nacht-, ochtend- of schemerbonus of numerieke factor toegevoegd.


## 65. Aanwezigheid, aasopname en vangbaarheid zijn afzonderlijke stappen

De veldstudie van Monk & Arlinghaus (2017) ondersteunt expliciet dat het ontmoeten of bezoeken van een bijgevoerd aas niet voldoende is om individuele hengelvangbaarheid te verklaren. Daarom blijven in de architectuur gescheiden: (1) aanwezigheid/habitat, (2) foerageer- en daadwerkelijke aasopname, en (3) vangbaarheid/aanbeet en uitvoering. Ghosal et al. (2018) levert directe, maar contextgebonden consumptiemetingen bij één maïs-baitsite; de consumptiegegevens waren descriptief en mogen niet als universele tijdvakcurve worden gebruikt.

De nieuwe uitkomst `angler_vulnerability` blijft gescheiden van `feeding_rhythm`. Beide bronnen zijn informatief en niet goedgekeurd als numerieke voorspelfactor.


## 67. Meerval: noordelijke veldtelemetrie blijft beweging-/habitatbewijs

Bergström et al. (2024) voegt langdurige diepte-/temperatuurtelemetrie van volwassen meerval uit één noordelijke Zweedse populatie toe. De seizoens- en dagritmepatronen verfijnen de habitat-/bewegingscontext, maar de meetmethode registreert geen directe voedselopname. De bron is daarom alleen gekoppeld aan `locomotor_activity` en `habitat_use`, niet aan `feeding_rhythm` of `feeding_intensity`. De auteursinterpretatie van nachtelijke beweging als waarschijnlijk foerageren wordt niet als gemeten voedingsrespons behandeld. De registratie blijft niet-goedgekeurd; geen numerieke tijdvakbonus of thermische parameter volgt hieruit.


## 66. Presentatielaag: standaard versus geavanceerd

De prognose heeft één rekenmodel en één gegevensbasis, maar twee presentatieniveaus. De bestaande instelling `showAdvancedPrognosisDetails` schakelt uitsluitend uitgebreide UI-informatie aan of uit.

- **Standaard:** kernuitkomsten en praktische aanbevelingen, met alleen noodzakelijke waarschuwingen wanneer gegevens ontbreken.
- **Geavanceerd:** verklaringen per prognose-element, wetenschappelijke voedingsbronnen (gemeten voedselopname/voedingsritme en foerageergedrag), factoranalyses, bronbeperkingen, modelaannames en onzekerheids-/datakwaliteitsdiagnostiek.

Onderzoeksdata, berekeningen en opgeslagen prognoses blijven identiek. Dit is geen modelvariant, geen andere voorspelling en geen invloed op evaluatie. De UI mag in standaardmodus geen uitgebreide details of lege uitklapvlakken tonen.


## 68. Omgevingsfactoren: meetbaarheid begrenst de modelrol (18 november 2026)

De weather service haalt onder meer temperatuur, neerslag, neerslagkans, bewolking, zoninstraling, luchtdruk en windrichting/-snelheid op. De huidige invoerketen bevat geen directe opgeloste-zuurstofmeting en geen lokale stroomsnelheid of afvoer. Het veld `waterType` (bijvoorbeeld rivier/kanaal versus plas) is geen vervanging voor een stromingsmeting.

Daarom gelden de volgende grenzen:

- **Opgeloste zuurstof:** alleen een gemeten waarde kan een lokale zuurstofstatus vaststellen. Weer en windstilte mogen geen zuurstoftekort of zuurstofrijke refugia invullen.
- **Stroming:** zonder lokale stromingsdata blijft dit een kwalitatieve watertype-/habitatcontext. Riviermeta-analyses zijn niet rechtstreeks toepasbaar op stilstaand water.
- **Regen en bewolking:** beschikbaar als weerscontext, maar de gevonden kwantitatieve synthese betreft vooral paaigerelateerde migratie en heeft zeer beperkte dekking voor regen/bewolking. Geen dagelijkse voedings- of vangstscore.
- **Wind:** blijft een presentatie-/lijncontrolefactor en kan oppervlaktedrift helpen duiden; lokale habitat en directe waarnemingen bepalen de primaire doelzone.

De oorspronkelijke factorinventarisatie telde 64 records; na de aanvullende registratie van baars-catch-rate en twee snoek-vangbaarheidsstudies telt de registry nu 67 records. Alle records blijven niet-goedgekeurd voor directe voorspelling. De soortdekking verschilt per responsvariabele. Voor iedere toekomstige koppeling moet de gemeten respons passen bij de modeluitkomst: fysiologische activiteit is geen voedselopname, beweging is geen foerageren en voedselopname is geen hengelvangbaarheid.

De volledige dekking en invoerbeperkingen staan in `FASE2_PROGNOSE_AUDIT.md` §81. Geen bestaande score, gewicht of thermische parameter wordt door deze documentatie gewijzigd.


## 69. Bewijsdekking telt per gemeten respons, niet als algemene soortdekking

De registry bevat nu 68 records, maar een soort die zowel dieet-, beweging- als habitatcontext heeft, heeft daarmee niet automatisch direct bewijs voor voedingsintensiteit, voedingsritme of hengelvangbaarheid. De auditmatrix in `FASE2_PROGNOSE_AUDIT.md` §82 splitst records daarom uit naar de expliciet gemeten respons. Vooral roofblei heeft momenteel uitsluitend dieet-/prooikeuze- en bewegings-/habitatcontext; directe voedingsintensiteit, voedingsritme en foerageergedrag ontbreken in de registry. De telemetrie van roofblei blijft locomotorische activiteit/habitatgebruik en wordt niet als voeding gemodelleerd.

De aantallen registry-records zijn geen aantallen onafhankelijke studies en geen bewijsgewichten. Bronkwaliteit, populatie, levensfase, seizoen, watertype en meetmethode blijven leidend. Hengelvangbaarheid blijft gescheiden van aanwezigheid, beweging en voedselopname. Alle records blijven niet-goedgekeurd voor directe voorspelling; er worden geen biologische gewichten of tijdvakbonussen geactiveerd.


## 70. Hengelvangsttempo en individuele vangbaarheid zijn aparte uitkomsten

De research registry bevat nu naast `angler_catch_distribution` ook `angler_catch_rate` voor hengeldagboek-/vangsttempo en `angler_vulnerability` voor individuele gevoeligheid voor vangst. Heermann et al. (2013) registreerden baarsvangsttempo over 21 meren en lieten zien dat visserervaring, voorkeur, aas-/kunstaastype en omgevingscontext samenhangen met vangsten. Twee snoekstudies (Roser et al., first published 2024; Lucas et al., 2026) meten rechtstreeks verschillen in reactie op kunstaas en vangbaarheid, met duidelijke effecten van visserijdruk, visgrootte, aaskeuze en leereffecten.

Deze uitkomsten zijn niet onderling uitwisselbaar: catch rate uit hengeldagboeken is geen individuele kwetsbaarheid, en een schatting uit één populatie is geen universele vangstkans. De nieuwe records blijven niet-goedgekeurd voor directe voorspelling. Er volgt geen numerieke correctie of vangstbonus.


## 71. Voedingsincidentie is niet hetzelfde als voedingsintensiteit

Voor roofblei is een Donau-veldstudie geregistreerd die het aandeel lege magen per seizoen rapporteert (vacuïteitsindex). Dit is geclassificeerd als `feeding_incidence`: of voedsel in de maag aanwezig was in de bemonstering. Het meet niet hoeveel voedsel werd opgenomen, hoe sterk de vis dagelijks voedde of op welk dagdeel de opname plaatsvond. De overwegend subadulte steekproef en één riviertraject beperken overdraagbaarheid. De uitkomst vult daarom een aparte biologische kennislaag aan en activeert geen numerieke voedings- of tijdvakscore.


## 72. Directe voedingsmetingen: brasem, snoekbaars en meerval

De registry bevat drie aanvullende, soortspecifieke voedingsregistraties. Voor brasem is er in-situ bewijs van dagelijkse zoöplanktonconsumptie en maagvulling (Vašek & Kubečka, 2004); voor snoekbaars seizoensgebonden maagvulling/voedingsintensiteit en lengteafhankelijke dieetverandering (Özyurt et al., 2012); voor meerval een sterk nachtelijk zelfvoeder-ritme in gecontroleerde laboratoriumomstandigheden (Boujard, 1995).

Deze bewijzen zijn niet onderling gelijkwaardig. De brasemstudie is veldbewijs binnen één prooitype en reservoir; de snoekbaarsstudie meet seizoens- en grootteverschillen, niet het uur-tot-uur-ritme; de meervalstudie is laboratoriumbewijs en geen natuurlijke veldobservatie. Alle records blijven informatief en niet-goedgekeurd voor directe voorspelling. Geen generieke dag-/nachtbonus of seizoenscorrectie volgt hieruit.


## 73. Huidige bewijsdekking en grens tussen biologische context en voorspelling

Na PR #134 telt de registry 71 records. De actuele per-soortuitsplitsing en de beoordeling van de modelrol staan in `FASE2_PROGNOSE_AUDIT.md` §83. De belangrijkste ontwerpconclusies:

- De literatuurinventarisatie voor de negen doelsoorten is voor deze ronde voldoende afgerond; dit is geen wetenschappelijke validatie en sluit Fase 2 niet af.
- Directe voedingsmetingen, dieet/prooikeuze, beweging/habitat, hengelvangsttempo en individuele vangbaarheid blijven afzonderlijke responsen.
- Een veldmeting van maagvulling of voedselconsumptie kan biologische context leveren, maar is niet automatisch een maat voor opname van vissersaas of hengelvangbaarheid.
- Laboratoriumritmes (zoals de meervalstudie) mogen niet zonder veldbevestiging als tijdvakvoorkeur worden gebruikt.
- De bestaande thermische activiteitspotentie blijft een afzonderlijke fysiologische laag. De registry valideert de numerieke thermische curves niet zelfstandig.
- Lokale zuurstof, stroomsnelheid en actuele prooibeschikbaarheid blijven onbekend zolang de invoerketen geen betrouwbare metingen levert.

Alle 71 registry-records blijven `approvedForPrediction: false`. Er worden geen biologische gewichten, tijdvakbonussen of nieuwe drempels geactiveerd.

**Replaybaarheid gecontroleerd (18 november 2026):** de huidige snapshotroutes bewaren de voor iedere run beschikbare whitelist-features, exacte uurlijkse weersinvoer, locatie-/temperatuurcontext, meetprovenance en model-/engineversies. De tests dekken whitelist, fingerprint, privacyuitsluiting en tijdstempelherkomst. Geen aantoonbaar ontbrekend modelinputveld gevonden; uitvoerbare modelcode wordt niet gearchiveerd.

**Volgende technische stap:** toets de resterende Fase-2-acceptatiecriteria en bepaal welke onderdelen alleen wachten op voldoende echte, chronologisch gekoppelde sessies. Fase 3 blijft geblokkeerd tot formele Fase-2-acceptatie.


## 74. Numerieke schaal en vangstkans: expliciete status

De thermische activiteitsschaal `clamp(1 + 9 × thermalEfficiency^0.85, 1, 10)` is een technische omzetting van de voorlopige thermische curve. De exponent 0,85 en de schaal 1–10 zijn niet empirisch gekalibreerd en vormen geen biologische gewichtsfactor. De uitkomst is uitsluitend relatieve thermische activiteitspotentie.

De persoonlijke vangstkans blijft een afzonderlijke empirische Poisson-baseline: bekende doelvis-aantallen gedeeld door geldige geregistreerde visduur leveren `lambda`; vervolgens wordt `1 − exp(−lambda × sessieduur)` berekend. De Poisson-aanname is niet lokaal gevalideerd. Het plafond 0,95 en de minimum-/vertrouwensdrempels zijn technische guards, geen wetenschappelijke limieten of betrouwbaarheidsclaims.

De volledige parameterstatus en acceptatieconsequenties staan in `FASE2_PROGNOSE_AUDIT.md` §84. Geen koppeling met de thermische score, voedingscontext of habitatlaag wordt geactiveerd. Lokale kalibratie wacht op voldoende echte, vergelijkbare sessies.

## 75. Brier-validatie op werkelijk tijdvenster en formele Fase-2-status

De onafhankelijke Brier-evaluatie vereist vergelijkbare blootstelling. Naast de bestaande vergelijking van voorspelde en werkelijke sessieduur worden nu ook geplande en werkelijke tijdvensters vergeleken: exacte start/eindtijden op minuutprecisie, met een fallback op het vooraf gekozen Amsterdamse starttijdvak voor oudere snapshots. Ontbrekende tijdcontext wordt apart geteld en niet gescoord. De VisCoach-snapshotroute bewaart de geplande venstertijden bij het atomair opslaan van de sessie. Er worden geen arbitraire toleranties of achteraf omgerekende kansen gebruikt.

De formele crosswalk van de zeven Fase-2-acceptatiecriteria staat in FASE2_PROGNOSE_AUDIT.md §85. Technische scheiding, temperatuurprovenance en eenvoudige gebruikersinvoer zijn grotendeels gerealiseerd; lokale kalibratie wacht op echte vergelijkbare sessies. De voorlopige thermische soortcurves blijven een expliciete ontwerp-/bewijsbeperking. Alle 71 registry-records blijven niet-goedgekeurd voor numerieke voorspelling. Fase 2 is nog niet geaccepteerd en Fase 3 blijft geblokkeerd.
## 76. Validatiepoort tijdvenster — PR #138 afgerond

PR #138 is squash-merged als 53bf5616b85edf5690043840855a7ebf87b15184. De PR-head Quality Gate (#44393169257) en de main mergecommit Quality Gate (#44393310926) zijn volledig geslaagd. De Brier-evaluatie controleert duur én tijdvenster; exacte vensters worden op minuutprecisie vergeleken en oudere snapshots gebruiken het opgeslagen Amsterdamse starttijdvak. Onbekende tijdcontext wordt apart geteld en uitgesloten. De VisCoach-persistentieregel bewaart de geplande venstertijden. Er zijn geen prognosegewichten, scores of parameters gewijzigd.
## 77. Thermische evidence-status per soort in de profiel-UI

De profielmodal toont nu de soortspecifieke status uit de centrale thermische evidence-service: Baars en snoekbaars hebben geregistreerde aerobe-scopegegevens; Karper, Snoek, Brasem en Voorn hebben metabole gegevens zonder aerobe-scopecurve; Zeelt, Meerval en Roofblei hebben geen vergelijkbare soortspecifieke thermische fysiologiebron. Alle records blijven niet-goedgekeurd voor numerieke voorspelling. Dit maakt de herkomstbeperking zichtbaar, maar valideert de bestaande profielparameters niet. De formele keuze om de curves als voorlopige priors te behouden of voor onvoldoende onderbouwde soorten uit te schakelen blijft open; zie FASE2_PROGNOSE_AUDIT.md §86.

De zevende acceptatievoorwaarde betreft technische borging: regressies, typecheck, dependency-audits, productiebuild en Quality Gate op exacte PR-head én mergecommit, met consistente documentatie en issue #49. PR #138 en #139 zijn hiervoor volledig groen gevalideerd.

## 78. Thermische tijdvakuitvoer en feitelijke sessiestart

De algemene prognose presenteert het tijdvak met de hoogste relatieve thermische activiteitspotentie voortaan als 'thermisch gunstigste tijdvak', niet als bewezen beste vistijd. Dit is geen voedingspiek of vangstvoorkeur. De actie 'Start sessie op dit moment' is alleen beschikbaar bij de prognose voor vandaag en legt het actuele Amsterdamse starttijdvak vast in de snapshot in plaats van het latere thermisch gunstigste tijdvak. Bij VisCoach blijft de gekozen sessiestart leidend; bij sessies die meerdere tijdvakken beslaan wordt geen globaal dagwinnaar opgedrongen. Geen score of parameter is gewijzigd.

## 79. Omgevingsfactoren: respons, bewijs en invoer strikt gescheiden (19 november 2026)

De resterende factorinventaris is beoordeeld in FASE2_PROGNOSE_AUDIT.md §88. De uitkomst is een expliciete niet-activeringsbeslissing:

- Wind blijft praktische positionerings-/presentatiecontext; geen zelfstandige biologische of vangstkansbonus.
- Regen en bewolking hebben onvoldoende direct en overdraagbaar bewijs voor dagelijkse voeding of hengelvangst. Migratiebewijs wordt niet als dagelijkse voedingsrespons geïnterpreteerd.
- Opgeloste zuurstof en stroming kunnen biologisch relevant zijn, maar zijn lokaal niet betrouwbaar beschikbaar in de huidige invoerketen. Onbekend blijft onbekend.
- Druk en troebelheid blijven contextafhankelijk; er is geen universele richting of numerieke respons onderbouwd.

Alle bestaande registry-records blijven niet-goedgekeurd voor directe numerieke voorspelling. De volgende fase-2-stap is de resterende formele acceptatiebesluiten en kandidaatmodel-/validatievoorwaarden afhandelen; geen extra parallelle factorengine toevoegen.


## 80. Fase-2-acceptatiecrosswalk bijgewerkt (19 november 2026)

De actuele zevenpunts-crosswalk staat in `FASE2_PROGNOSE_AUDIT.md` §89. De factorinventaris is afgerond voor deze onderzoeksronde (§88), maar criterium 2 blijft formeel open door de bestaande numerieke thermische curves en de validatie van hun exacte parameters. De nieuwe omgevingsfactoren zijn niet numeriek geactiveerd. Lokale Brier-kalibratie wacht op voldoende echte, vergelijkbare sessies; dit blokkeert geen lokale nauwkeurigheidsclaims, maar die claims blijven verboden zolang data ontbreekt.

**Faseregie:** fase 2 is niet geaccepteerd; fase 3 blijft geblokkeerd. Eerst is een expliciet ontwerpbesluit nodig over het behouden van thermische curves als voorlopige mechanistische prior versus het uitschakelen van numerieke thermische activiteit waar passend direct bewijs ontbreekt. Geen runtimegedrag gewijzigd.
## 81. Ontwerpbesluit: thermische curves behouden als voorlopige prior (19 november 2026)

Optie A is gekozen. De bestaande asymmetrische thermische soortprofielen blijven actief binnen de bestaande prognoseketen als voorlopige mechanistische prior. Zij leveren uitsluitend een relatieve thermische activiteitspotentie op basis van de bestaande waterthermische engine.

- De curves zijn geen directe meting van totale activiteit, voedselopname, aasacceptatie, habitat-aanwezigheid of hengelvangbaarheid.
- De bestaande curveparameters en de omzetting naar 1–10 blijven expliciet voorlopig; geen exacte parameterfit of lokale validatie wordt geclaimd.
- Er is geen koppeling van de thermische score naar de voedings-/voorvoerlaag, persoonlijke Poisson-vangkans of Brier-evaluatie.
- De tijdvakpresentatie houdt thermische respons gescheiden van soortspecifiek voedings-/diel-gedrag. De thermische dagscore is op zichzelf geen bewijs voor een voedingspiek of beste vistijd.
- fishProfiles.ts blijft de enige operationele bron voor soortprofielen en thermische parameters. prognosisEngine.ts blijft de bestaande prognoseketen; VisCoach consumeert de uitkomsten en introduceert geen eigen prognose.
- Water-, habitat-, positionerings-, voedings- en evaluatie-engines behouden hun afzonderlijke verantwoordelijkheden. Geen dubbele logica of nieuwe modelarchitectuur.

Alle bronnen blijven onderworpen aan de bestaande evidence-status. Latere numerieke verfijning vereist directe soort-/levensfase-/contextpassende onderbouwing, regressietests en onafhankelijke chronologische evaluatie. Dit besluit is geen wetenschappelijke validatie van de huidige parameters.



## 82. Bestaande dagscore, factorbijdragen en tijdvakrespons

De bestaande prognose blijft de enige bron van prognostische uitkomsten en de huidige dagscoreweergave blijft behouden.

**Doel van de uiteindelijke aggregatie:** elk relevant prognoseonderdeel krijgt een eigen dagelijkse factoruitkomst en een bewijs-/datagedreven gewicht binnen de bestaande totaalscore. De huidige score-UI blijft behouden. De tijdvakbeoordeling past dezelfde factorarchitectuur afzonderlijk toe per tijdvak en combineert relevante tijdvakcondities met soortspecifiek voedings-/foerageergedrag en stek-/seizoencontext. Niet-onderbouwde of ontbrekende factoren worden niet met fictieve neutrale scores gevuld; hun status en effect op onzekerheid blijven expliciet.
 Deze architectuur voegt geen tweede score, parallelle forecast of eigen VisCoach-biologie toe.

### Dagscoreketen

Iedere factor uit de bestaande prognose wordt in de factorinventaris expliciet geclassificeerd: numerieke bijdrage, habitat-/bewegingsinformatie, kwalitatieve context, niet beschikbaar of uitgesloten met reden. Een numerieke bijdrage vereist een passende gemeten respons, relevante soort-/seizoens-/habitatcontext, betrouwbare invoer, traceerbare onzekerheid en een toetsbare rol. Een ontbrekende factor wordt niet als een fictieve neutrale waarde ingevuld. Gewichten en interacties worden niet gekozen op basis van intuïtie of kleine, vertekende vangstdatasets.

Wanneer een kandidaatmodel voldoende bewijs heeft, dragen de toegelaten factoren samen bij aan de bestaande dagschatting; de UI blijft de huidige score presenteren. Thermische activiteit blijft volgens §81 uitsluitend een voorlopige prior voor thermische respons en wordt niet vermenigvuldigd met voeding, persoonlijke vangstkans of Brier.

### Tijdvakbeoordeling

Tijdvakrespons wordt binnen dezelfde prognosecontext bepaald op basis van doelsoort, datum/seizoen, stek en relevante omstandigheden. Direct soortspecifiek voedings-/foerageerbewijs kan tijdvakvoorkeur ondersteunen wanneer de gemeten respons en context overdraagbaar zijn. Thermische respons, locomotorische activiteit, habitatgebruik, voedselopname en hengelvangbaarheid blijven gescheiden. Zonder betekenisvol bewijsverschil wordt geen tijdvakwinnaar geforceerd.

### Evaluatiegrenzen

Brier evalueert de persoonlijke vangstkans tegen de gekoppelde sessie-uitkomst en is geen directe gewichtstuner voor biologische factoren. Activiteit, voeding, habitat en tijdvakrangschikking vereisen passende eigen evaluatiemaatstaven. Prognosesnapshots blijven onveranderlijk; sessies en uitkomsten worden alleen gebruikt binnen chronologische, vergelijkbare en datakwaliteitsbewuste evaluatie.

Dit is het kader voor de volgende kandidaatmodel-audit. Het activeert geen nieuwe factor, gewicht, drempel of runtimeberekening.


## 83. Baseline huidige score- en tijdvakberekening (19 november 2026)

De huidige code-audit (§92 in `FASE2_PROGNOSE_AUDIT.md`) toont:

- Eén `analyzeWaterThermalDevelopment()`-resultaat wordt per prognosedatum berekend en aan alle vier tijdvakken doorgegeven.
- Daardoor gebruiken de vier tijdvakken dezelfde gemeten/geschatte watertemperatuur, thermische efficiëntie en activiteitsscore.
- De numerieke activiteitsscore gebruikt uitsluitend de voorlopige thermische respons. Druk, wind, seizoen, tijdstip/licht en bewolking/neerslag hebben geen numerieke bijdrage.
- Diel-/voedingsbewijs is verklarende context; persoonlijke tijdvakervaring wordt niet in de activiteitsscore gewogen.
- De dagscore middelt de vier gelijke tijdvakscorewaarden. De huidige tijdvakrangschikking kan daarom geen voedingsgedrag of werkelijk tijdvakverschil bepalen.
- Persoonlijke Poisson-vangkans blijft apart en wordt niet in de biologische activiteitsscore gemengd.

Dit is de baseline voor de volgende kandidaatmodel-audit. De gewenste geïntegreerde factorbijdragen en soort-/seizoen-/stekgevoelige tijdvakrespons zijn nog niet gerealiseerd. Behoud de bestaande UI en architectuur; voeg geen gewichten of tijdvakbonussen toe voordat bewijs, invoerdekking, onzekerheid en chronologische validatie zijn vastgelegd.


## 84. Factorverantwoordelijkheden en onafhankelijke evaluatie

De huidige factor-naar-code/UI/snapshot/evaluatie-traceermatrix staat in `FASE2_PROGNOSE_AUDIT.md` §93. De architectuur houdt de volgende uitkomsten strikt gescheiden:

- Thermische respons: voorlopige soortcurve op waterthermische invoer; dagscorebijdrage is nu uitsluitend thermisch; watertemperatuur wordt apart op MAE/RMSE/bias geëvalueerd.
- Meteorologische context: druk, wind, seizoen, licht/diel, bewolking en neerslag hebben nu geen numerieke bijdrage. Wind kan wel door de bestaande positionerings-/tactiekengines worden gebruikt.
- Habitat/aanwezigheid/beweging: ruimtelijke hypothese via bestaande habitatengine; geen totale activiteit of voeding.
- Voedings-/foerageergedrag en tijdvak: nu alleen brongebonden context; vereist directe passende evidence en eigen evaluatie voordat het numeriek kan rangschikken.
- Persoonlijke vangstkans: aparte historische Poisson-baseline; Brier/BSS toetst deze kans tegen gekoppelde sessie-uitkomsten en is geen directe tuner van biologische gewichten.

De volledige prognose-uitvoer en invoercontext worden in onveranderlijke snapshots opgeslagen. De volgende kandidaatmodelstap moet iedere factor koppelen aan respons, tijdschaal, inputdekking, onzekerheid, interacties en onafhankelijke evaluatie. Behoud de bestaande scoreweergave; geen parallelle prognose of niet-gevalideerde gewichten.


## 85. Kandidaatmodel en chronologische validatiepoort

De kandidaatmodelrichting en het validatieprotocol zijn uitgewerkt in `FASE2_PROGNOSE_AUDIT.md` §94. De bestaande prognose blijft de centrale keten en de huidige dagscoreweergave blijft behouden.

- Iedere relevante factor krijgt een eigen dagelijkse factoruitkomst, responsdefinitie, provenance, datadekking en onzekerheid. Alleen evidence- en data-geschikte factoren krijgen een expliciete gewogen bijdrage aan de bestaande totaalscore.
- De vier tijdvakken worden afzonderlijk beoordeeld met tijdvakcondities, doelsoort, datum/seizoen en stekcontext. Direct voedings-/foerageerbewijs kan tijdvakvoorkeur beïnvloeden; beweging en habitatgebruik zijn geen voedingsbonus.
- Habitat/aanwezigheid, persoonlijke vangstkans en betrouwbaarheid blijven afzonderlijke responsen. Brier/BSS evalueert alleen persoonlijke vangstkans; watertemperatuur heeft eigen foutmaten; activiteit, voeding, habitat en tijdvak vereisen eigen labels en evaluatiemaatstaven.
- Chronologische rolling-origin validatie vergelijkt kandidaat met de huidige thermische baseline op dezelfde ongeziene sessies. Geen future leakage, geen automatische gewichtstuning en geen historische snapshotmutatie.
- Normalisatie, aggregatie, ontbrekende-data-regel en gewichten zijn nog open ontwerpbesluiten; geen runtimeactivatie vóór formele review.

De exacte thermische curveparameters blijven ongevalideerd. De keuze voor een voorlopige prior is geen wetenschappelijke goedkeuring. Fase 2 blijft open; Fase 3 blijft geblokkeerd.


## 86. Temperatuurafhankelijke tactiekregels: evidence en scoregrens (19 november 2026)

De herstelde voorvoer-audit staat in `FASE2_PROGNOSE_AUDIT.md` §96; de aanvullende soortspecifieke habitat-/positioneringscontrole staat in §97. Deze tactiekregels zijn geen extra dagelijkse activiteitsscore.

- De voorvoerengine bevat temperatuurbanden, een interne suitabilityscore, soortfactoren en grammen. Algemene literatuur ondersteunt temperatuur als voedingscontext, niet de exacte grenzen, soortfactoren of hoeveelheden. De keuze om de numerieke waarden te behouden als heuristiek of uit te schakelen blijft een afzonderlijk besluit; geen runtimewijziging zonder expliciete goedkeuring.
- Habitat- en positioneringsengines gebruiken koude-/warme temperatuurgrenzen als ruimtelijke zoekhypothesen. De exacte grenzen zijn niet soortspecifiek gevalideerd. Vooral “geen actieve jacht” voor meerval onder 12 °C, “extreme winterrust” voor zeelt onder 11 °C en vaste snoek-/voorn-dieptedrempels zijn te stellig voor de beschikbare evidence.
- Nieuwe telemetriebronnen voor meerval, snoek en blankvoorn/voorn zijn toegevoegd aan de registry, allemaal `approvedForPrediction: false`. Bewegings-/habitatdata worden niet als voedselopname of vangstkans geclassificeerd.
- De bestaande PrognosisView-waarschuwing voor voerhoeveelheden is hersteld; exacte hoeveelheidsgating bij lage invoerkwaliteit blijft een apart open implementatiepunt. 

Geen dagelijkse score, thermische curve, gewicht of tijdvakbonus gewijzigd. Fase 2 blijft open; Fase 3 blijft geblokkeerd.


## 87. Koudewater-zoekhypothesen: claimgrenzen (19 november 2026)

De soortspecifieke koudewaterclaims uit `rodPositioningEngine.ts` zijn na de broncontrole in `FASE2_PROGNOSE_AUDIT.md` §97–§98 genuanceerd. De regels voor snoek, zeelt, meerval en voorn blijven tactische zoekhypothesen; de gebruikte 7–12 °C-condities zijn geen gevalideerde biologische omslagpunten. Met name volledige winterinactiviteit van meerval, “extreme winterrust” bij zeelt en een vaste zonnige-middagroute voor voorn worden niet meer als feit gepresenteerd.

De wijzigingen zijn uitsluitend tekst-/onzekerheidscorrecties in de bestaande positioneringsengine, met regressietests. Geen dagelijkse score, factorgewicht, thermische curve of tijdvakvoorkeur gewijzigd.


## 88. Actuele soortdekking in het research register

De actuele registerdekking en interpretatie staan in `FASE2_PROGNOSE_AUDIT.md` §§78 en 99. Het register bevat 86 records, alle `approvedForPrediction: false`. De extra telemetriebronnen voor meerval, snoek en blankvoorn/brasem verbeteren vooral de ruimtelijke bewegings-/habitatcontext; zij activeren geen voedings-, activiteit- of vangstkansfactor. Roofblei heeft nog geen directe geregistreerde tijdgebonden voedselopname; meerval- en karperbronnen moeten naar gecontroleerde voeropstelling versus natuurlijke veldrespons gescheiden blijven.


## 89. Bibliografische en uitkomstclassificatie oudere profielbronnen

De audit van oudere profielreferenties staat in `FASE2_PROGNOSE_AUDIT.md` §100. Bibliografisch gecorrigeerde bronnen zijn aan het research register toegevoegd met expliciete gemeten uitkomsten en beperkingen. Filtervoeding/prooigrootte, voedingsmechanica, groei, laboratoriumzwemactiviteit en reproductie blijven onderscheiden van dagelijkse voedselopname en vangbaarheid. Alle nieuwe registraties zijn niet-goedgekeurd voor directe voorspelling.


## 90. Omgevingsfactoren: bewijs en invoergrenzen

De factorreview in `FASE2_PROGNOSE_AUDIT.md` §101 onderscheidt beweging van voedselopname. Wind en luchtdruk hebben beperkte, contextafhankelijke telemetrieverbanden met baarsbeweging; troebelheid hangt in één ondiep meer samen met brasemactiviteit; ernstige hypoxie kan karpervoeropname sterk onderdrukken. Deze bronnen zijn niet goedgekeurd voor numerieke voorspelling. Zuurstof is biologisch relevant maar niet betrouwbaar als actuele lokale invoer beschikbaar; onbekend blijft onbekend. Neerslag en stroming blijven context zonder voldoende direct doelsoortbewijs. Geen universele bonus of drempel.


## 91. Actuele Fase-2-acceptatiegrenzen en volgorde

De actuele zevenpunts-crosswalk staat in `FASE2_PROGNOSE_AUDIT.md` §89. De gekozen thermische optie A blijft een voorlopige mechanistische prior; de exacte parameters zijn niet gevalideerd. De gewenste geïntegreerde dagscore wordt niet gebouwd door alle zichtbare outputs blind op te tellen: eerst moet de doelrespons van de bestaande 1–10-score expliciet worden afgebakend. Alleen factoren die dezelfde respons verklaren kunnen daarin een gewogen bijdrage krijgen. Habitat/aanwezigheid, persoonlijke vangstkans en betrouwbaarheid blijven afzonderlijke uitkomsten tenzij een apart samengesteld doel expliciet wordt vastgesteld en gevalideerd.

De huidige code gebruikt alleen thermische respons in de numerieke dagscore; tijdvakken delen dezelfde dagbrede thermische waarde. Brier toetst persoonlijke vangstkans, temperatuur heeft eigen foutmaten; activiteit, voeding, habitat en tijdvak vereisen eigen evaluatie. Geen nieuwe gewichten of tijdvakbonussen vóór factorstatus, datadekking, missing-data-regel, normalisatie en onafhankelijke validatie zijn vastgesteld. Fase 2 blijft open; Fase 3 geblokkeerd.


## 92. Actuele soortdekking per gemeten respons

De actuele per-soorttelling van alle gemeten uitkomsten staat in `FASE2_PROGNOSE_AUDIT.md` §82. Het register bevat 86 unieke records en alle blijven niet-goedgekeurd voor directe numerieke voorspelling. Voedingsintensiteit, voedingsincidentie, voedingsritme, foerageergedrag, voedingsfysiologie, dieet/prooikeuze, locomotorische activiteit, habitatgebruik, hengelvangbaarheid, aerobe scope, metabolisme en groei zijn afzonderlijk geteld. Geen van deze labels mag door naamsovereenkomst als een andere respons worden gebruikt.


## 93. Geconsolideerde factorstatus en ontwerpgrenzen

De volledige factor-/input-/evaluatiematrix staat in `FASE2_PROGNOSE_AUDIT.md` §102. De inventaris van de bestaande prognoseketen is gesloten: per factor zijn respons, actuele invoer, huidige rol en vereiste onafhankelijke evaluatie vastgelegd.

De enige huidige numerieke bijdrage aan de bestaande 1–10-dagscore blijft de voorlopige thermische prior. De wetenschappelijk zuivere kandidaat voor de uiteindelijke bestaande score is een geïntegreerde biologische activiteit-/voedingspotentie; habitat/aanwezigheid, persoonlijke vangstkans, vangbaarheid en betrouwbaarheid blijven afzonderlijke responsen tenzij een ander expliciet productdoel wordt gekozen. Normalisatie, missing-data-regel, interacties en gewichten zijn nog niet gekozen.

Brier evalueert persoonlijke vangstkans; temperatuurfoutmaten evalueren de watertemperatuurschatter. Activiteit, voeding, habitat en tijdvak vereisen eigen labels en evaluatie. Geen runtimegewichten of tijdvakbonussen activeren. Fase 2 blijft open; Fase 3 geblokkeerd.


## 94. Vastgesteld doel en presentatiecontract voor de bestaande dagscore

Het gebruikersbesluit en de volledige ontwerpregels staan in `FASE2_PROGNOSE_AUDIT.md` §103. De bestaande 1–10-schaal, cijfers, plaatsing en standaardweergave blijven behouden: één begrijpelijke totaalscore met een korte onderbouwing. Geen nieuwe zichtbare deelscores, tweede prognosescore, percentage of extra verplichte invoer.

De doelrespons is de verwachte biologische activiteit- en voedings-/foerageerpotentie van de geselecteerde doelsoort op die dag. Dit is nadrukkelijk niet de persoonlijke vangstkans, lokale aanwezigheid, hengelvangbaarheid of betrouwbaarheid. Deze responsen blijven afzonderlijk. De score wordt uiteindelijk gevoed door alleen die soortspecifieke factoren die dezelfde doelrespons onderbouwen en onafhankelijk gevalideerd zijn.

Voor implementatie zijn gemeenschappelijke normalisatie, stabiele 1–10-kalibratie, ontbrekende-data-/coverage-regels, dubbele-tellingpreventie, interacties en chronologische validatie verplicht. De thermische optie A blijft voorlopige prior. Brier/BSS blijft uitsluitend voor persoonlijke vangstkans. Geen runtimewijziging voordat Fase 2 formeel is geaccepteerd.


## 95. Minimaal vangstregistratiecontract

De vangstregistratie is bewust frictiearm. De primaire flow is 'Vis gevangen' → vissoort kiezen → opslaan. Het vangsttijdstip wordt automatisch voorgesteld en blijft aanpasbaar. Een vooraf ingesteld hengel-/methodeprofiel en gewicht zijn optioneel. Geen verplichte voer-, aas-, presentatie- of materiaalvelden; een sessiecontext mag hoogstens een niet-bindende standaard voorstellen.

Elke vangst is een eigen gebeurtenis binnen de sessie, zodat verschillende soorten, tijdstippen, hengelprofielen en gewichten per vangst mogelijk zijn. Ontbrekende optionele waarden blijven onbekend. Historische records worden niet kunstmatig aangevuld.

Vangsten ondersteunen achteraf tijdvak- en tactiekanalyses, maar zijn geen directe meting van voedingsactiviteit. Een vangst is mede afhankelijk van stek, aanwezigheid, inspanning, presentatie, aas en vangbaarheid; een nulvangst bewijst evenmin dat de vis niet actief was. Hengelprofiel/methode en gewicht mogen alleen in de responslaag worden gebruikt die zij werkelijk onderbouwen. Geen oorzaak-gevolgconclusie uit één vangst.

Volledige regels, minimale flow en validatiegrenzen: FASE2_PROGNOSE_AUDIT.md §104. Dit contract behoudt de bestaande registratie-ervaring en activeert geen nieuwe runtimevelden.



## 96. Factorrespons-hiërarchie en onzekerheidsprincipe

De kandidaatprioriteit en soortspecifieke responsdekking zijn uitgewerkt in FASE2_PROGNOSE_AUDIT.md §105. Dit is een ontwerpvolgorde, geen universele procentuele weging. De directe dagelijkse voedings-/foerageerrespons heeft de hoogste kandidaatprioriteit na de bestaande voorlopige thermische prior; seizoen/fysiologie en licht/dielgedrag moduleren deze alleen waar de soortspecifieke respons dit ondersteunt. Watercondities en meteorologische factoren blijven context of soort-/locatiespecifieke kandidaten totdat directe respons en meetdekking bestaan. Habitat/aanwezigheid, hengelvangbaarheid en betrouwbaarheid blijven aparte lagen.

De prognose moet de best verdedigbare verwachting geven met de gegevens die beschikbaar zijn. Ontbrekende invoer verlaagt dekking/zekerheid en wordt als onbekend behandeld, maar blokkeert niet automatisch de volledige score wanneer de overige gegevens een bruikbare inschatting ondersteunen. Geen fictieve neutrale waarde, verborgen herweging of ongefundeerde bonus. De gebruiker blijft één bestaande 1–10-score zien; tijdvakadvies gebruikt dezelfde doelrespons met tijdvakgebonden invoer. Geen runtimewijziging vóór normalisatie, coverage-regels, onafhankelijke evaluatie en chronologische vergelijking met de thermische baseline.


## 97. Normalisatie en onzekerheid zonder verborgen herweging

De volledige ontwerpuitwerking staat in `FASE2_PROGNOSE_AUDIT.md` §106. De architectuur hanteert per kandidaatfactor een expliciete keten: invoervalidatie → soort-/contextselectie → responsfunctie → genormaliseerde relatieve responsindex → referentie/afwijking → onzekerheids- en toelatingsmetadata.

De interne 0–1-index is een relatieve biologische responsindex binnen een gedefinieerd domein, geen kanspercentage, vangstkans of universele eenheid. Ruwe variabelen worden niet rechtstreeks opgeteld. De functie kan monotone, optimale, drempel- of verzadigingsvormen hebben, maar de vorm en referentie moeten uit passende soortspecifieke responsdata volgen.

Ontbrekende, geschatte, contextuele, ongeldige, tegenstrijdige en niet-toepasselijke invoer blijven afzonderlijke statussen. Een ontbrekende factor krijgt geen fictieve waarde. Geen automatische hernormalisatie van resterende gewichten en geen stilzwijgende neutrale bijdrage. Een gedeeltelijk onderbouwde prognose kan bruikbaar blijven wanneer de gebruikte factorcombinatie onafhankelijk is gevalideerd; anders valt het model terug op een gevalideerde beperktere baseline of N/B.

Datadekking en onzekerheid staan los van de biologische score: lage dekking verlaagt niet de biologische activiteit, maar begrenst de zekerheid van onze verwachting. De gebruiker houdt één bestaande 1–10-dagscore en bestaande tijdvakweergave; geen zichtbare deelsectoren, percentage of tweede score. De scoremapping moet met vaste referentieankers worden gekalibreerd en versieerbaar blijven, niet dagelijks relatief herschaald.

De huidige thermische optie A blijft de enige numerieke runtimebijdrage en de baseline. Een factor of interactie wordt pas toegelaten na passende directe respons, invoerkwaliteit, expliciete overlapcontrole, eigen onafhankelijke labels/metrics en chronologische verbetering ten opzichte van de thermische baseline. Brier blijft uitsluitend voor persoonlijke vangstkans. Geen runtimewijziging; Fase 2 blijft open en Fase 3 geblokkeerd.


## 98. Huidige thermische baseline: exacte mapping en onzekerheidsgrenzen

De actuele code-audit en soortparameters staan in `FASE2_PROGNOSE_AUDIT.md` §107. De bestaande prior gebruikt een asymmetrische Gaussische curve per soort, begrensd op efficiëntie 0,08–1,00, gevolgd door `1 + 9 × efficiency^0.85` en afronding op één decimaal. De dagscore is het gemiddelde van vier tijdvakscores die op dit moment dezelfde thermische respons delen.

De profieloptima en curvebreedtes zijn voorlopige softwareprioren, niet empirisch gevalideerde voedselopname-/activiteitscurves. Door de efficiëntievloer is de theoretische minimumscore ongeveer 2,1/10; de mapping benut de 1–10-schaal dus niet volledig. De relatieve efficiëntie-uitvoer mag niet als percentage biologische activiteit of voedselopname worden geïnterpreteerd.

Gemeten, geschatte en onbekende watertemperatuur moeten gescheiden blijven. De interne placeholder bij onbekende temperatuur is niet beschikbaar als prognose, wordt niet als scorelabel opgeslagen en mag nooit als neutrale factorbijdrage of trainingsdata worden gebruikt. Temperatuurinvoeronzekerheid en responsparameteronzekerheid zijn afzonderlijke bronnen.

Geen wijziging van profielparameters, formule, scoremapping of runtime. De baseline blijft ongewijzigd totdat responslabels, vaste referentieankers en onafhankelijke chronologische evaluatie beschikbaar zijn.


## 99. Herkomst en toelating van thermische profielparameters

De bronherkomst-audit staat in `FASE2_PROGNOSE_AUDIT.md` §108. De huidige research registry bevat geen direct gemeten `thermal_efficiency`- of `thermal_optimum`-respons die de exacte optimum-/breedtecombinaties per soort valideert. Vijf soortgebonden records meten metabolisme en/of aerobe scope (karper, snoek, baars, brasem/blankvoorn en snoekbaars); alle vijf zijn niet-goedgekeurd. Deze eindpunten mogen niet als dagelijkse voedselopname of vangbaarheid worden behandeld.

De bestaande soortcurves blijven voorlopige softwareprioren. Geen parameters afleiden uit metabolisme, aerobe scope, groei of een andere soort. Per soort moet de bronkaart directe temperatuurafhankelijke voedselopname onderscheiden van indirecte fysiologische context en de toepassingsgrenzen (levensfase, acclimatisatie, watertype, geografische context) vastleggen. Geen bronstatus is door deze audit gewijzigd en geen runtimeparameter is aangepast.


## 100. Temperatuurafhankelijke voedingsrespons: niet verwarren met thermische fysiologie

De soortspecifieke registrydekking staat in `FASE2_PROGNOSE_AUDIT.md` §109. Directe voedselopname-/voedingsstudies bestaan onder meer voor karper, zeelt en snoekbaars, maar zijn beperkt door ondersoort, grootteklasse, kweek-/laboratoriumcontext, beperkt aantal temperatuurbehandelingen of reproductiestatus. Blankvoorn heeft veldbewijs voor een seizoensgebonden dagritmeverschuiving waarbij temperatuur, licht en predatierisico verweven zijn. Snoek-maagvulling/temperatuurcorrelatie was niet significant. Meervalvoerautomaatritme is geen temperatuurrespons.

Deze bronnen ondersteunen geen universele soortcurve en valideren niet automatisch de bestaande profielparameters. Directe voedingsintensiteit, metabolisme, aerobe scope, groei, maagvulling en beweging blijven afzonderlijke eindpunten. Geen bronstatus, curvevorm of numerieke parameter is gewijzigd.


## 101. Soortspecifieke responskaarten en bewijsniveaus

De eerste responskaarten staan in `FASE2_PROGNOSE_AUDIT.md` §110. Per soort zijn temperatuurafhankelijke voedselopname, dagritme/voeding, fysiologie en beweging/habitat gescheiden. De huidige registry ondersteunt voor karper, zeelt en snoekbaars beperkte directe temperatuur-/voedingsobservaties, maar in contexten die niet zonder meer overdraagbaar zijn naar Nederlandse wilde populaties. Voor brasem, snoek, baars, blankvoorn, meerval en roofblei is de huidige directe temperatuur-voedingsdekking onvoldoende voor een eigen gekwantificeerde curve. Het generieke profiel Overig is geen soortspecifiek biologisch model.

Geen van de huidige profielen heeft hiermee een volledig gevalideerde dagelijkse temperatuur-voedselopnamecurve. Dagritmebronnen kunnen tijdvakcontext ondersteunen, maar beweging, habitatgebruik, metabolisme, aerobe scope, groei en vangst blijven aparte eindpunten. Geen vaste tijdvakbonus of geleende soortcurve. De huidige thermische baseline blijft ongewijzigd en onzekerheid blijft expliciet.


## 102. Responslabels blijven gescheiden

De aanvullende karperanalyse staat in `FASE2_PROGNOSE_AUDIT.md` §111. Voedselopname/consumptie, foerageersnelheid/voedselzoekgedrag, locomotorische activiteit en hengelvangst zijn verschillende responslabels. Een studie naar juveniele karper-foerageersnelheid is ondersteunend bewijs voor voedselzoekgedrag, maar geen directe adult-voedselopnamecurve of vangstcurve. Bronnen met verschillende soorten/ondersoorten, levensfasen, voedseltypen en experimentele context mogen niet worden samengevoegd alsof zij hetzelfde optimum meten.

Temperatuur kan meerdere stappen in het voedingsproces beïnvloeden, maar de respons is soort- en contextafhankelijk; zie Volkoff & Rønnestad (2020), reeds opgenomen in de research registry. Deze review ondersteunt de conceptuele scheiding, niet de exacte numerieke soortparameters. Geen runtime of bronstatus gewijzigd.


## 103. Werkelijke evaluatielabels en grenzen van de bestaande data (19 november 2026)

De actuele datamodelaudit staat in FASE2_PROGNOSE_AUDIT.md §130. De bestaande sessie-/snapshotketen levert:
- Afgeronde sessie-uitkomsten voor de persoonlijke vangstkans.
- Vooraf voorspelde en achteraf gemeten watertemperatuur voor de aparte temperatuurschattervalidatie.
- Beperkte beschrijvende tijdvakgegevens wanneer actieve hengelintervallen en betrouwbare, door de gebruiker aangepaste vangsttijdstippen bestaan.
- Optionele tijdgebonden hengelgebeurtenissen (aanbeet/gemist/vangst), maar deze zijn vangbaarheids-/interactieproxy's en worden nog niet door de tijdvakbewijs-audit verwerkt.

Er zijn geen directe lokale labels voor fysiologische activiteit, voedselopname of biologische tijdvakvoorkeur. Automatische formulier-open-tijdstippen zijn registratietijd, geen bewezen vangstmoment. Ontbrekende hengelintervallen zijn onbekende blootstelling, niet nul inzet. Een vangst, aanbeet, beweging of opportunistische aanwezigheidssignalering wordt niet als directe voedselopname gebruikt.

## 104. Onafhankelijke evaluatie per respons

De metric-/labelmatrix staat in FASE2_PROGNOSE_AUDIT.md §131:
- Watertemperatuurschatter: MAE/RMSE/bias en waar passend intervaldekking.
- Persoonlijke vangstkans: chronologische Brier/BSS en kalibratie.
- Thermische activiteit, voedselopname, habitat en biologische tijdvakvoorkeur: eigen passende directe labels en metrics; deze lokale labels ontbreken momenteel.
- Tijdvak-vangbaarheid: eventueel exposure-aware vangst-/aanbeetfrequentie per hengeluur, strikt als aparte praktijk-/vangbaarheidslaag.

Brier/BSS wordt niet gebruikt voor de biologische 1–10-score of automatische gewichtstuning. Vangstdata valideren niet rechtstreeks voedselopname. Modelvergelijking blijft rolling-origin, met vaste modelversies, dezelfde ongeziene waarnemingen, factorablaties en rapportage van negatieve resultaten. Geen automatische gewichtswijziging.

## 105. Factor-toelating en numerieke runtimegrens (19 november 2026)

De geconsolideerde factor-toelatingsmatrix staat in FASE2_PROGNOSE_AUDIT.md §132. De research registry bevat 86 records en 0 goedgekeurde records voor directe numerieke voorspelling. De huidige thermische prior is de enige numerieke bijdrage aan de biologische dagscore en blijft een expliciete voorlopige uitzondering, niet een wetenschappelijk gevalideerde curve.

Directe voedingsbronnen voor karper, zeelt, snoekbaars en enkele andere soorten zijn contextgebonden kandidaten; geen daarvan is automatisch toegelaten. Voedingsritme, beweging, dieet, prooikeuze, habitat, wind, druk, zuurstof, stroming, vangbaarheid en onzekerheid blijven hun eigen respons-/contextlaag. Voorvoergrammen zijn afzonderlijke tactiekheuristieken, geen biologische scorefactor; exacte hoeveelheden en invoerkwaliteitsgrens blijven een open productbesluit.

Geen nieuwe factor, gewicht, interactie of tijdvakbonus activeren voordat respons, bron, invoerkwaliteit en onafhankelijke validatie dit toelaten.

## 106. Vangstregistratie: architectuurcontract versus huidige UI (19 november 2026)

De huidige conformiteitscontrole staat in FASE2_PROGNOSE_AUDIT.md §133. De basisflow is laagdrempelig: vissoort kiezen; aantal staat standaard op 1; tijdstip wordt automatisch ingevuld en blijft aanpasbaar; gewicht, lengte, aas, hengel/techniek, foto en notities zijn optioneel. De gebruiker kan opslaan zonder deze optionele velden te vullen.

De huidige hengel-/techniekregistratie is echter een vrij tekstveld, geen selectie uit een vooraf ingesteld herbruikbaar profiel. Een SessionRod is sessiegebonden en vervangt geen gebruikerspreset. Dit verschil is gedocumenteerd; er is nog geen runtimewijziging of datamigratie gekozen. Een toekomstige preset moet optioneel blijven en de snelle vangstflow niet blokkeren.

**Architectuurstatus:** geen runtime-, score-, parameter-, gewicht- of gebruikersflowwijziging door deze documentatie. Fase 2 blijft open; Fase 3 geblokkeerd.


## 107. Finale kandidaatmodelreview en toelatingsbesluit (20 november 2026)

De read-only kandidaatmodelreview en de exacte huidige codeketen staan in `FASE2_PROGNOSE_AUDIT.md` §134. De passende kandidaat blijft één versiebeheerste, modulaire prognoseketen met intern gescheiden fysiologische/thermische potentie, voedings-/foerageerrespons, omgevingsmodulatie, habitat/aanwezigheid, vangbaarheid/persoonlijke vangstkans en datadekking/onzekerheid. Er komt geen tweede totaalmodel en geen ongedifferentieerde optelsom.

De huidige 1–10-score wordt op main uitsluitend door de voorlopige thermische prior bepaald: `1 + 9 × thermalEfficiency^0.85`. Dezelfde dagbrede thermische respons wordt momenteel voor de vier tijdvakken hergebruikt. De feedingEvidenceService heeft op basis van de huidige registry geen goedgekeurde numerieke voedingsbron. Habitat-/positioneringsengines, Brier/BSS en voorvoergrammen blijven afzonderlijke respons-/tactieklassen.

**Reviewbesluit:** optie A blijft uitsluitend als transparante voorlopige baseline-uitzondering behouden. De kandidaat is niet numeriek toegelaten als gecombineerd activiteit-/voedingsmodel: directe lokale biologische labels ontbreken en de exacte thermische parameters/scoremapping zijn niet onafhankelijk gevalideerd. Geen nieuwe factor, gewicht, interactie, scoremapping of tijdvakbonus activeren. De onafhankelijke biologische evaluatiepoort blijft open; Fase 2 is niet geaccepteerd en Fase 3 blijft geblokkeerd. Productbesluiten over voorvoergrammen bij lage invoerkwaliteit en optionele hengel-/methodepresets blijven expliciet bij de eigenaar.


## 108. Nieuwe directe maar levensfasegebonden voedingsbron voor snoek (20 november 2026)

Audit §135 registreert Nilsson-Örtman et al. (2026), Journal of Animal Ecology, DOI 10.1111/1365-2656.70233, en de open Dryad-data/code, DOI 10.5061/dryad.kkwh70sjc. De studie meet daadwerkelijk gegeten prooivissen bij jonge 0+-snoek in 192 proeven bij 5/9/13 °C en 80 aanvullende proeven over een verbruininggradiënt. De gevonden temperatuur-/verbruiningseffecten waren opvallend zwak; alleen de koude/heldere behandeling liet een koepelvormige Type-IV-respons zien.

De bron is in de research registry opgenomen als directe `feeding_intensity`-respons, maar blijft **limited** en `approvedForPrediction: false`: uitsluitend 0+-snoek, één Zuid-Zweedse populatie, laboratoriumarena's, gestandaardiseerde prooidichtheden en vrijwel uitsluitend jonge blankvoorn. De volwassen snoeken in dezelfde studie leverden alleen lichaamstemperatuurdata, geen gekoppelde voedingslabels. De bron valideert dus geen volwassen Nederlandse veldcurve, geen tijdvakvoorkeur en geen bestaande thermische profielparameter.

Registrytelling: 87 records, 0 numeriek goedgekeurd. Geen runtimefactor, gewicht of tijdvakbonus geactiveerd.


## 109. Modelgeschatte veldrantsoenen als beperkte voedingscontext (20 november 2026)

Audit §136 registreert Garcia & Adelman (1985) voor karper en Specziár (2002) voor karper, brasem en blankvoorn. Beide gebruiken maag-/darminhoud en ledigings-/rantsoenmodellen om dagelijkse voedselopname in het veld te schatten. De eerste rapporteert seizoensmetingen bij karper van april tot oktober en geen statistisch significant ochtend-/avondverschil. De tweede rapporteert temperatuurgerelateerde dagelijkse rantsoenen in één groot Hongaars meer; de brasemrelatie is afhankelijk van het weglaten van één waarneming.

Deze bronnen zijn bruikbare beperkte kandidaatcontext voor `feeding_intensity`, maar geen rechtstreeks geobserveerde individuele inname, lokale Nederlandse labels of gevalideerde thermische profielcurves. Beide blijven `approvedForPrediction: false`; de onderliggende methoden, steekproefcontext en overdraagbaarheid moeten eerst verder worden gecontroleerd. Geen runtimefactor of gewicht geactiveerd.


## 110. Volwassen baars: veldrantsoen als beperkte seizoenscontext (20 november 2026)

Audit §137 registreert Thorpe (1977): volwassen baars in Loch Leven, bemonsterd om de drie uur gedurende 24-uurscycli in zomerperioden. Het dagelijkse rantsoen werd geschat via maaginhoud en maaglediging en nam af van circa 6,5% lichaamsgewicht/dag in juni naar 3,2% in september. Door tragere lediging bij kooivissen zijn de schattingen minimaal; er is geen watertemperatuurreeks in de beschikbare samenvatting.

De bron is beperkte, niet-goedgekeurde `feeding_intensity`-/ritmecontext, geen Nederlandse veldcurve of validatie van thermische parameters. Geen runtimebijdrage.


## 111. Snoek 2026: volwassen temperatuurreeks is afkomstig uit experimentele vijvers

Audit §138 corrigeert de broncontext van Nilsson-Örtman et al. (2026). De zes volwassen snoeken met biosensoren werden twaalf maanden gevolgd in drie grote experimentele vijvers, niet in een representatieve natuurlijke meer-/rivierpopulatie. Hun lichaamstemperatuurdata bevatten geen gekoppelde voedingslabels. De Dryad-paginabeschrijving noemt ze vrijlevend, maar de primaire methodesectie beschrijft expliciet de experimentele vijvers; die primaire methode is leidend.

De 0+-voedingsproeven blijven directe maar contextgebonden laboratoriumdata. De primaire paper rapporteert 24 dieren in experiment 1 en drie uitgesloten proefwaarnemingen; de Dryad-README vermeldt n=23 en omschrijft het outlierveld als drie individuen. Experiment 2 sloot afzonderlijk twee dieren wegens schimmelinfectie uit. Deze aantallen en uitsluitingen zijn niet samengevoegd.

De dataset blijft limited en approvedForPrediction=false; geen volwassen veldcurve, voedingslabel uit de biosensorreeks of runtimefactor. De ruwe CSV/R-code kon via de Dryad-downloadlink niet onafhankelijk worden opgehaald (HTTP 403), dus geen claim van heruitvoering.


## 112. Larvale baars en snoekbaars: veldrantsoen op basis van maagvulling (20 november 2026)

Audit §139 registreert Worischka & Mehner (1998) als beperkte feeding_intensity-bron voor larvale baars en snoekbaars. De auteurs schatten dagelijkse rantsoenen uit uurlijkse maagvullingsmetingen gedurende 24 uur en lineaire/exponentiële maagledigingsfuncties. De gerapporteerde waarden zijn 0,21–0,27 g/g/dag bij larvale baars (13,1 mm) en 0,31–0,40 g/g/dag bij larvale snoekbaars (10,6 mm). Iedere derde uurmeting leverde slechts 41–72% van de rantsoenschatting met uurlijkse bemonstering.

Dit is geen rechtstreeks gewogen individuele voedselopname. Levensfase, methodegevoeligheid en ontbrekende volledige primaire methodedetails beperken overdraagbaarheid; geen volwassen curve of runtimebijdrage. De bron blijft approvedForPrediction=false.


## 113. Volwassen baars en blankvoorn: seizoensrantsoen als beperkte veldcontext (20 november 2026)

Audit §140 registreert Jamet (1994) voor volwassen baars en blankvoorn. De studie gebruikte maandelijkse maaginhoudsbemonstering in één eutroof Frans meer gedurende april 1987–juli 1988 en schatte dagelijkse consumptie met het Eggers-model (24-uursgemiddelde maaginhoud × temperatuurafhankelijke maagledigingsrate).

De bron ondersteunt uitsluitend context voor seizoensgebonden voedingsintensiteit en dieet. Het is een modelmatige schatting, geen direct gewogen individuele inname; maandelijkse bemonstering geeft geen tijdvakscore. Seizoen, prooiaanbod, zuurstof, habitat en voortplanting zijn verweven. Geen lokale validatie of runtimebijdrage; approvedForPrediction=false.


## 114. Levensfase en leeftijdsspecifiek tijdvakbewijs

Audit §141 registreert Jamet et al. (1990) als beperkt direct voedingsritmebewijs voor blankvoorn: 253 vissen (98–240 mm) bemonsterd per vier uur gedurende één zomerse 24-uurscyclus. Jongere 2–3-jarige vissen voedden vooral van 14:00 tot schemering; oudere vissen voedden dag en nacht met leeftijdsafhankelijke intensiteit en periodiciteit.

Dit bewijs ondersteunt een leeftijds-/dieetafhankelijke context, niet één universeel blankvoorn-tijdvakprofiel. De steekproef is één eutroof Frans meer en één zomerdatum; geen Nederlandse lokale validatie of method-feeder/catchability-label. Geen vaste dusk-bonus of numerieke tijdvakfactor afleiden.

## 115. Meerval: juveniele voerbehoefte is geen veldvangstrespons

Audit §142 registreert Filipiak et al. (1997) als kandidaat voor dagelijkse voerbehoefte van juveniele gekweekte meerval. De beschikbare samenvatting rapporteert 1–1,5% versus 2% W^0,8 dagelijkse voerbehoefte over brede temperatuurbanden 18–23 en 24–28 °C. De precieze opname-/restvoer- en temperatuurmethodiek is nog niet onafhankelijk geverifieerd.

De bron kan geen volwassen wilde meervalcurve, natuurlijke prooiconsumptie of method-feederrespons onderbouwen. Blijft buiten actieve parameters en registry-goedkeuring tot volledige methodologische verificatie.

## 116. Baars/blankvoorn: interpretatie van Eggers-consumptieschattingen

Audit §143 bevestigt Jamet (1994): dagelijkse consumptie is afgeleid uit gemiddelde maaginhoud en een temperatuurafhankelijke maagledigingsrate, en vervolgens aan leeftijdsklasse-/populatieomvang gerelateerd. Het is geen rechtstreekse individuele inname. Maandelijkse bemonstering, eutrofe meercontext en verweven seizoensfactoren beperken overdracht; geen thermische curve of tijdvakscore.


## 117. Actuele formele Fase-2-acceptatiecrosswalk (20 november 2026)

Audit §89 is bijgewerkt op basis van de kandidaatmodelreview §§134–145 en de actuele registrytelling: 92 unieke bronnen, 0 numeriek goedgekeurd. De eigenaarbeslissing optie A is expliciet geaccepteerd: de bestaande thermische curve blijft alleen een voorlopige mechanistische prior, niet een gevalideerde voedselopnamecurve.

De formele blockers zijn nu concreet gescheiden: (1) geïntegreerde dagscore met directe responsbijdragen bestaat nog niet; (2) bron-/levensfaseoverdracht blijft per soort beperkt; (3) er zijn geen directe lokale biologische labels; (4) een gevalideerde tijdvakrespons ontbreekt; (5) voorvoerhoeveelheden/gating en de optionele hengel-/methodepreset zijn afzonderlijke eigenaarbesluiten. Brier blijft uitsluitend voor persoonlijke vangstkans. Fase 2 blijft open; Fase 3 geblokkeerd.


## 118. Meerval: seizoensmaagvulling en steekproefonbalans

Audit §144 controleert de volledige primaire tekst van Yazici et al. (2025). De studie omvat 200 meervallen uit één Anatolisch stuwmeer, met maandelijkse bemonstering en maagvullings-/vacuïteitsindices. Het wintergemiddelde FI was het hoogst (0,827), maar de wintergroep telde slechts n=7 tegenover voorjaar n=49, zomer n=98 en herfst n=46. Leeftijdsgroepen waren eveneens ongelijk (n=3–81).

De studie ondersteunt beperkte veldcontext voor maagvulling en dieet, niet individuele dagelijkse opname, een temperatuurcurve of een diel-tijdvakrespons. Er is geen gerapporteerde watertemperatuurreeks per vangst; temperatuur wordt in de discussie als mogelijke verklaring genoemd, niet als gecontroleerde of onafhankelijk geanalyseerde respons. Geen winterbonus of numerieke runtimebijdrage; registrystatus blijft approvedForPrediction=false.


## 119. Snoek: veldmaagvulling 2025 en statistische brononzekerheid

Audit §145 controleert Yazıcıoğlu et al. (2025) op de volledige primaire PDF. De FI-waarden zijn numeriek hoger in zomer/herfst en lager in winter/voorjaar, maar de abstracttekst is statistisch tegenstrijdig: zij noemt de FI-seizoensverschillen niet significant en vermeldt tegelijk K-W p<0,05. De resultaten rapporteren p>0,05 expliciet voor VI, maar geven geen eenduidige aparte FI-teststatistiek. De registry houdt deze onzekerheid expliciet open.

De gemeten maandelijkse oppervlaktetemperatuur correleerde slechts zwak met FI (r_s=0,117; p>0,05). Gillnetten stonden minimaal twaalf uur van schemering tot de volgende ochtend; geen individuele voedingsmomenten. Geen thermische curve of diel-tijdvakbonus afleiden; bron blijft limited en non-approved.


## 120. Technische afronding PR #189 en actuele ontwerpstatus

PR #189 is gemerged naar `main` als `6661623cb591623c40ba7886a85a0cbb3c99ab86`; zowel de exacte PR-head als de mergecommit Quality Gate zijn volledig geslaagd. De bron-/overdraagbaarheidsbevindingen staan in audit §§141–145 en de actuele formele crosswalk in §89.

De eigenaarbeslissing optie A is gesloten: de thermische curves blijven een transparante voorlopige prior. Dit is geen wetenschappelijke validatie. De registry telt 92 bronnen, 0 numeriek goedgekeurd. Er is geen open technische gate voor deze wijzigingsreeks; de open fase-2-punten zijn inhoudelijk: geïntegreerde score, directe biologische labels, gevalideerde tijdvakrespons en afzonderlijke eigenaarbesluiten over voorvoerhoeveelheden/gating en optionele hengel-/methodepreset. Fase 3 blijft geblokkeerd.


## 122. Blankvoorn: macrophytenvoeding als dieetgebonden tijdvakbewijs

Audit §147 controleert Prejs (1978) op de volledige primaire PDF. De studie geeft direct maag-/darmvullingsbewijs voor een plantenetende blankvoorn-groep: de onderzochte groep voedde overdag door en macrophytenopname viel volgens de auteur vrijwel stil in volledige duisternis. Dit geldt niet voor de soort als geheel; het is afhankelijk van voedselgilde, populatie, leeftijd en lokale omstandigheden. De geschatte natuurlijke dagelijkse macrophytenrantsoenen (9,5–4,8% of 15,5–7,7% BW, afhankelijk van turnovervariant) zijn passage-rate-modeluitkomsten, geen rechtstreekse individuele veldmetingen.

De bron is geen method-feeder-/pelletbewijs, heeft slechts een temperatuurcontext rond 20 °C en ondersteunt geen thermische curve. Registry: limited, approvedForPrediction=false. Geen tijdvakbonus of runtimefactor.


## 123. Prejs (1978) en de dieetafhankelijke blankvoornrespons

Prejs (1978) is in audit §147 als 93e registry-record toegevoegd. De bron geeft beperkt direct veldbewijs voor macrophyten-etende blankvoorn en toont dat het tijdvakpatroon sterk kan verschillen naar voedselgilde. De auteur waarschuwt tegen generalisatie naar de soort als geheel. Geen method-feeder-/pelletrespons, thermische curve of numerieke tijdvakbonus. Registry blijft non-approved.

PR #191 is gemerged; de exacte PR-head Quality Gate is geslaagd. De mergecommit Quality Gate is eveneens volledig geslaagd; deze wijzigingsreeks is technisch gevalideerd.


## 124. Uitvoeringsprioriteit: engine-ontwerp boven verdere bronuitbreiding (20 november 2026)

De uitvoeringsvolgorde is aangescherpt in audit §149. De prognose-engine is het primaire Fase-2-product; verdere soortliteratuur is ondersteunend en wordt alleen opgezocht als zij een concreet ontwerp-, toelatings- of evaluatiebesluit verandert.

De P0-enginewerkzaamheden zijn: (1) één heldere doelrespons voor de bestaande 1–10-dagscore; (2) feature- en responscontract per factor, inclusief normalisatie, onzekerheid, ontbrekende invoer, interacties en dubbeltelling; (3) tijdspecifieke respons voor de vier tijdvakken; (4) onafhankelijke evaluatie per respons met passende labels, metrics, chronologische splitsing en baseline. Bestaande deel-engines worden hergebruikt; er wordt geen parallelle habitat-, wind- of temperatuurengine gebouwd.

Beweging, habitat en extra soortgedrag blijven afzonderlijke context-/coachlagen en zijn geen reden om de engine-afronding uit te stellen. Ze worden later alleen verdiept wanneer ze een concreet advies aantoonbaar verbeteren. Voorvoergrammen en optionele hengel-/methodepresets blijven aparte tactiek-/productbesluiten, niet blockers voor het biologische engine-ontwerp.

Stopcriterium voor literatuur: geen nieuwe bron verzamelen tenzij de uitkomst een responsclassificatie, parameter-/vormkeuze, overdraagbaarheidsgrens, featuretoelating, tijdvaklogica of evaluatielabel kan veranderen. Geen bronquota, geen geforceerde soortcurves en geen willekeurige gewichten. Ontbrekend bewijs blijft expliciet onbekend. Geen runtime- of scorewijziging vóór formele afronding en toetsing van Fase 2; Fase 3 blijft geblokkeerd.

## 125. Enginecontract: responslagen en tijdvaklogica (20 november 2026)

Audit §150 vertaalt de kandidaatarchitectuur naar een concrete verwerkingsketen. De engine moet eerst context en provenance valideren, daarna de voorlopige thermische prior en directe voedings-/foerageerrespons afzonderlijk behandelen, tijd-/omgevingsmodulatie alleen bij passend bewijs toepassen, en habitat/aanwezigheid, vangbaarheid en onzekerheid als afzonderlijke lagen houden.

Belangrijk ontwerpbesluit: thermische efficiëntie, voedselopname en tijdvakvoorkeur zijn verschillende responsen en mogen niet worden opgeteld voordat één gemeenschappelijke, onafhankelijk meetbare doelrespons en vaste scoreankers zijn gedefinieerd. De huidige code realiseert het productdoel nog niet als samengestelde respons; de bestaande 1–10-uitvoer is uitsluitend de voorlopige thermische prior.

De vier vensters blijven nacht 00–06, ochtend 06–12, middag 12–18 en avond 18–24. De huidige code gebruikt dezelfde dagbrede thermalAnalysis voor alle vier vensters; de weer-/zondata leveren vooral context en geen gevalideerde biologische tijdvakrangorde. Een toekomstige tijdvakrespons vereist tijdspecifieke watertemperatuur/provenance en directe soort-/contextpassende voedingslabels. Geen generieke schemerbonus.

De volledige factorresponsmatrix, invoerflow, tijdvakvoorwaarden en vervolgstappen staan in audit §150. Geen runtimewijziging; Fase 2 blijft open.


## 126. Open datasets en responsvalidatie: geen substituut tussen fysiologie, beweging en voeding

Audit §151 documenteert een gerichte controle van drie openbaar beschikbare datasets. Norin et al. (2024) meet bij juveniele marine Cunner metabolisme, beweging en dagelijkse pelletopname afzonderlijk; thermische plasticiteit van metabolisme en beweging viel niet samen, terwijl de voedselopname slechts als dagtotaal is vastgelegd. Monk & Arlinghaus (2018) biedt wilde karper-/zeelttelemetrie, aaslocatiebezoek en hengelinzet, maar geen gemeten voedselconsumptie. Rieble et al. (2026) biedt dagelijkse beweging van karper en baars, maar geen directe voedingslabels en heeft een catch-and-release-herstelcontext.

Deze datasets zijn daarom niet numeriek toegelaten voor de biologische dagscore of tijdvakvoeding. Ze bevestigen wel dat thermische fysiologie, beweging, voedselopname en hengelvangbaarheid gescheiden responsen moeten blijven. Hergebruik voor een eigen bewegings-/habitat- of vangbaarheidslaag kan later worden onderzocht. Geen runtimewijziging; Fase 2 blijft open.


## 127. Tijdresolutie van de waterthermische keten

Audit §152 stelt vast dat waterThermalEngine momenteel één geschatte watertemperatuur en -range per doeldag retourneert. De optionele targetHour in ThermalAnalysisOptions wordt niet gebruikt. prognosisEngine roept de thermische analyse eenmaal per dag aan en geeft hetzelfde resultaat door aan nacht, ochtend, middag en avond. De per-tijdvak uurlijkse weerssamples leveren momenteel context, geen tijdspecifieke thermische score.

Een echte tijdvaktemperatuur vereist een tijdstipgerichte uitbreiding van de bestaande canonieke waterThermalEngine, met uitsluitend op het prognosemoment beschikbare invoer, waterthermische toestandsontwikkeling, provenance en onzekerheid. Luchttemperatuur mag niet rechtstreeks als watertemperatuur worden gebruikt. Een tijdspecifieke thermische schatting valideert bovendien nog geen tijdvakvoedingsvoorkeur; daarvoor blijven directe voedingslabels nodig.

Geen runtimewijziging. Eerst een minimale API-/datadekkingstoets; daarna pas beslissen over implementatie. Fase 2 blijft open.


## 128. Bestaande waterthermische toestandsupdate behouden en verfijnen

Audit §153 verduidelijkt dat `waterThermalEngine` al een eenvoudige uur-voor-uur toestandsupdate bevat wanneer een echt meetanker en voldoende weerdekking beschikbaar zijn. De huidige code gebruikt een gemeten starttemperatuur, uurlijkse luchttemperatuur, 24-/72-uursgemiddelden, kortgolvige straling of bewolking, wind en vaste diepte-afhankelijke tijdconstanten. De uitkomst wordt echter samengevat tot één dagwaarde; de parameters zijn heuristisch en er is geen expliciet meerlaags temperatuurprofiel.

**Ontwerpbesluit:** geen nieuwe engine. Verbeter de bestaande canonieke `waterThermalEngine` en maak de toestand tijdstipgericht reproduceerbaar. Houd de echte watertemperatuur als toestand en lucht/zon/wind als warmte-uitwisselingsinvloeden. Een oppervlaktetemperatuur, bulktemperatuur en temperatuur op meetdiepte zijn niet onderling uitwisselbaar. Onbekende meetdiepte of waterdiepte blijft onbekend en verhoogt de onzekerheid.

De eerstvolgende stap is een dataflow-/coverage-audit van waterdiepte, meetdiepte, meettijd, tijdzone, weersvelden en forecast-as-of. Daarna volgt pas een minimale API-specificatie en tests; nog geen runtimewijziging. Een tijdspecifieke watertemperatuur blijft bovendien een thermische invoer, geen bewijs voor een tijdvakvoedingsvoorkeur.


## 129. Water- en meetdiepte als afzonderlijke thermische dimensies

Audit §154 toont dat de bestaande keten twee verschillende dieptes kent:
- locatie-waterdiepte (`FishingLocation.waterDepth`), die de thermische engine als grove proxy voor watermassa gebruikt;
- meetdiepte (`waterTemperatureMeasurementDepthM`), die bij sessies/snapshots kan worden opgeslagen maar momenteel niet in de thermische toestandsupdate of historische profielselectie wordt gebruikt.

Een historische profielmediaan kan daardoor momenteel waarnemingen van oppervlak en dieper water combineren. Dat is fysisch niet altijd representatief, vooral bij mogelijke stratificatie. In een volgende profielversie moeten meetdieptes expliciet worden gescheiden; onbekende meetdiepte blijft een eigen onzekerheidscategorie en wordt niet aan een bekende laag toegewezen.

De snelle prognose-invoer "Gemeten aan stek" wordt als actuele gebruikersmeting aan de engine doorgegeven, maar de fysieke meettijd, meetmethode en meetdiepte zijn in die route onbekend. Behoud deze eenvoudige route, maar behandel haar niet als een volledig gekarakteriseerde laagmeting of onafhankelijke kalibratie-observatie.

De uurlijkse Open-Meteo-data zijn in Europe/Amsterdam-tijd aangevraagd en leveren lucht-/stralings-/windforceringen. De engine parseert uurstrings met `Date`; de tijdzone van de runtime moet daarom expliciet worden getest. Houd bij tijdstipgerichte berekeningen `forecastAsOf`, `calculatedAt` en `targetTime` afzonderlijk.

Geen runtimewijziging. Volgende stap is specificeren van dieptelaagsemantiek, tijdzoneconversie en tests voordat de bestaande engine of profielselectie wordt aangepast.


## 130. Contract voor tijdstipgerichte waterthermische toestand

Audit §155 stelt de minimale richting vast voor een latere uitbreiding van de bestaande `waterThermalEngine`:

- één expliciet tijdzonebewust `targetTime`;
- afzonderlijk `forecastAsOf` en `calculatedAt`;
- een tijdgestempeld meetanker met herkomst/methode en meetdiepte indien bekend;
- locatie-waterdiepte/watertype apart van meetdiepte;
- uitvoer op het gevraagde tijdstip met onzekerheid, dekking, ankerherkomst en gebruikte meetdiepte/status.

De voorkeursberekening is één chronologische toestandsdoorloop vanaf het meetanker, met temperatuurtoestand op elk gevraagd tijdstip. De middagwaarde bouwt dus voort op de ochtendtoestand; het model voert niet vier losstaande dagberekeningen uit. Ontbrekende uren, onbekende diepte en onvoldoende forecastdekking worden niet met gemiddelden of standaardwaarden gevuld.

Voorlopig wordt één referentietemperatuur gemodelleerd. Een gelaagd verticaal temperatuurprofiel vereist voldoende onafhankelijke meetdieptes en wordt niet afgeleid uit één onbekend gepositioneerde meting. De ongebruikte `targetHour` wordt niet als los uurgetal uitgebreid; een expliciet tijdstip is vereist.

Geen runtimewijziging. Eerst testdekking voor meetdiepte, continuïteit, tijdzone/DST en forecast-as-of; daarna pas een implementatievoorstel.



## 131. Sessiegebonden watertemperatuurmetingen en lokale thermische traagheid

Audit §156 legt vast dat de gebruiker watertemperatuur tijdens vissessies wil meten, niet dagelijks of op vaste dagdelen. Iedere fysieke meting moet als afzonderlijke observatie worden bewaard, met werkelijk meettijdstip, temperatuur, stek/watertype, bron/methode, meetdiepte indien bekend en beschikbare weerscontext rond dat moment. Luchttemperatuur, windrichting/-snelheid en waar beschikbaar bewolking/straling worden aan het meetmoment gekoppeld; maand/seizoen/tijdvak zijn uit het tijdstip afleidbaar. Ontbrekende context blijft onbekend. De weerscontext bij de meting en de weersforcering ná de meting zijn afzonderlijke gegevensrollen.

De gemeten watertemperatuur is het startanker van de thermische toestand. Dezelfde toestand wordt chronologisch verder ontwikkeld; een stabiele luchttemperatuur en weinig wind rechtvaardigen geen abrupte daling van bijvoorbeeld 8 °C in de middag naar 5 °C 's avonds of 3–4 °C de volgende ochtend. Dit voorbeeld is een regressiescenario, geen vaste regel. De mate van verandering moet volgen uit de duur en sterkte van de weersforcering, watermassa/diepte, menging en expliciete onzekerheid.

De bestaande waterThermalEngine bevat al een heuristische uur-voor-uur demping. Lokale sessiemetingen kunnen deze respons en de seizoensprofielen later toetsen; zij valideren de huidige tijdconstanten niet automatisch. Geen dagelijkse meetplicht, geen fictieve tussenmetingen en geen runtime-/parameterwijziging voordat voldoende lokale waarnemingen en onafhankelijke validatie beschikbaar zijn. Zie audit §156.


## 132. Fase-2-closeout: technische implementatie versus onafhankelijke biologische validatie

Audit §157 is de actuele closeoutcontrole. De respons-/featurearchitectuur is ontworpen, maar de actieve 1–10-score blijft de expliciet gekozen voorlopige thermische prior; een geïntegreerde voedings-/activiteitsscore is niet numeriek toegelaten omdat directe, onafhankelijke doelresponslabels ontbreken. Brier blijft uitsluitend persoonlijke vangstkans; MAE/RMSE/bias blijven uitsluitend watertemperatuurvalidatie.

De resterende technische volgorde is: (1) tijdstipgerichte, tijdzonebewuste chronologische toestand in de bestaande waterThermalEngine, met targetTime, forecastAsOf, calculatedAt, anker/provenance en onzekerheid; (2) deterministische Europe/Amsterdam-/DST-parsing en regressies; (3) historische profielselectie op meetdiepte; (4) afzonderlijke sessiegebonden meetobservaties met beschikbare weerscontext op het fysieke meetmoment, zonder dagelijkse meetplicht. De huidige sessie heeft één watertemperatuurveld; meerdere fysieke meetmomenten binnen één sessie zijn daarmee nog niet als afzonderlijke records gemodelleerd.

De voorvoerengine bevat nog niet-gevalideerde exacte grammen en temperatuur-/soortdrempels; uitschakelen vereist expliciete productgoedkeuring. De vangstflow heeft vrije tekst, maar nog geen optionele herbruikbare hengel-/methodepreset. Deze productpunten blijven gescheiden van de biologische score.

Fase 2 kan niet eerlijk formeel worden geaccepteerd zolang technische tijdstip-/meetregistratiepunten openstaan en onafhankelijke biologische labels ontbreken. Geen synthetische labels, geforceerde literatuurquota, runtimegewichten of tijdvakbonussen. Fase 3 blijft geblokkeerd. Zie audit §157.


## 133. Uitvoering punt 1 — tijdstipgerichte waterthermische toestand (20 november 2026)

Punt 1 is geïmplementeerd in PR #203 en de PR-head- en mergecommit-Quality-Gates zijn groen. De bestaande waterThermalEngine accepteert nu `targetTime`; prognosisEngine berekent per tijdvak de toestand op het representatieve forecastmoment. Elk moment wordt chronologisch vanaf hetzelfde laatst geldige meetanker berekend. Metingen ná het doeltijdstip worden uitgesloten als anker; een huidige meting wordt voor toekomstige momenten een historisch startanker. Verstreken tijdvakken worden niet achteraf herschreven. De bestaande lokale biascorrectie blijft consistent.

De zichtbare 1–10-score, scoreformule, database, gebruikersinvoer en UI zijn niet gewijzigd. Regressietests dekken expliciete doeltijden en stabiliteit van 8 °C bij stabiele lucht en weinig wind. Dit is technische tijdstipfunctionaliteit, geen empirische validatie van de bestaande tijdconstanten.

Punt 2 blijft open: deterministische Europe/Amsterdam-/DST-parsing, expliciete forecast-as-of en voorkomen van forecast future leakage. Zie audit §158.


## 134. Uitvoering punt 2 — Amsterdamse tijd en forecast-as-of (20 november 2026)

Punt 2 is geïmplementeerd in PR #205; PR-head- en mergecommit-Quality-Gates zijn groen. Open-Meteo wordt voor forecast en archief met `timeformat=unixtime` aangeroepen. Uurlijkse data worden absolute UTC-ISO-instanties; lokale datum-/uurselectie gebruikt de centrale Europe/Amsterdam-parser. Oude timezone-loze cachewaarden blijven leesbaar en worden bij cachelezing genormaliseerd, inclusief deterministische behandeling van het dubbele herfstuur en afwijzing van niet-bestaande lente-uren.

`weatherFetchedAt` / `forecastAsOf` is expliciet onderscheiden van `calculatedAt`. Een forecastpayload die aantoonbaar na het berekeningstijdstip is opgehaald of een ongeldige as-of heeft, wordt niet gebruikt. Snapshot-weatherInput en as-of blijven immutable bewaard.

De Open-Meteo daily sunrise/sunset wordt naar lokale datum/tijd omgezet voor de bestaande schemerlogica. Regressies, volledige Quality Gate en productiebuild zijn groen. Zie audit §159.

Volgende stap: punt 3 — historische profielselectie op fysieke meetdiepte.


## 135. Uitvoering punt 3 — meetdieptebewuste historische temperatuurprofielen (20 november 2026)

Punt 3 is geïmplementeerd in PR #207; PR-head- en mergecommit-Quality-Gates zijn groen. Historische profielen worden niet meer samengesteld uit verschillende bekende meetdieptes of uit een mix van bekende en onbekende meetdieptes. Een expliciete doelmeetdiepte selecteert uitsluitend dezelfde diepte; zonder doelmeetdiepte is alleen een eenduidige historische laag toegestaan. Meerdere bekende lagen zonder bekend doelmeetniveau leveren geen profiel op.

De selectie blijft de totale waterdiepte apart gebruiken voor de nabijgelegen-stekkenfallback. De gekozen verticale meetdiepte wordt als provenance in WaterThermalAnalysis opgenomen. Geen databasewijziging, verplicht invoerveld of UI-wijziging. Zie audit §160.

Volgende stap: punt 4 — meerdere afzonderlijke fysieke meetmomenten per sessie met beschikbare weerscontext.


## 136. Uitvoering punt 4 — sessiegebonden watertemperatuurmeetevents

PR #211 implementeert WaterTemperatureMeasurement[] als geneste eventreeks op FishingSession. Elk fysiek meetmoment is een eigen record met eigen ID, oorspronkelijke locationId, temperatuur, measuredAt, afzonderlijk recordedAt, bron, methode, optionele meetdiepte en optionele WaterTemperatureWeatherContext. De scalaire sessievelden blijven uitsluitend compatibiliteitssamenvatting van de meest recente bruikbare meting. Legacy sessies worden niet herschreven; zonder event-array wordt de oude scalaire waarde als legacy-event getoond en onbekende meettijd blijft onbekend.

De keuze voor een geneste reeks voorkomt een aparte IndexedDB-tabel en migratie en blijft binnen bestaande sessieopslag en back-uptransacties. De JSON-import valideert eventstructuur en numerieke/tijdstempelgrenzen. Historische observatieverzameling behoudt afzonderlijke events; de profielberekening dedupliceert een snapshotkopie van dezelfde fysieke meting. VisCoach triggert herbeoordeling wanneer de fysieke eventreeks verandert.

De sessie-editor laat meerdere metingen per sessie toevoegen/verwijderen. Meetmoment start op actuele Europe/Amsterdam-tijd en is aanpasbaar; methode en meetdiepte zijn optioneel. Geen dagelijkse meetplicht of verplichte extra invoer. De beschikbare uurweerscontext wordt alleen gekoppeld bij een sample binnen 60 minuten; bron, uur, ophaaltijd en offset worden vastgelegd. Ontbrekende context blijft onbekend. Het betreft Open-Meteo-modelcontext, geen lokale directe weerwaarneming.

De fysieke measuredAt wordt ook aan ManualWaterTemperatureInput en de waterthermische engine doorgegeven. Daarmee wordt vanaf het echte meetanker doorgerekend en niet vanaf het moment waarop het sessierecord of snapshot wordt opgeslagen. Events met onbekende methode/herkomst of zonder exact meetmoment blijven bewaard maar voldoen niet aan de bestaande profielkwaliteitsregel.

Punt 4 geldt pas als afgerond na groene Quality Gate op de definitieve PR-head én de mergecommit. De technische registratie valideert nog niet de thermische tijdconstanten; daarvoor blijven echte lokale meetreeksen nodig. Zie audit §161.

## 137. Acceptatie punt 4 — sessiegebonden meetevents

Punt 4 is technisch afgerond in PR #211 en de exacte PR-head- en mergecommit-Quality-Gates zijn groen. Meerdere fysieke watertemperatuurmetingen per sessie worden als aparte geneste events bewaard, inclusief fysiek meettijdstip, apart registratiemoment, oorspronkelijke stek, bron/methode, optionele meetdiepte en beschikbare uurlijkse weerscontext. De fysieke meettijd wordt doorgegeven aan de waterthermische engine en de immutable startsnapshot.

Ontbrekende weerwaarden blijven onbekend; alleen een Open-Meteo-uurwaarde binnen 60 minuten wordt gekoppeld en als modelcontext met provenance bewaard. Er is geen dagelijkse meetplicht, geen verplicht extra invoerveld en geen nieuw IndexedDB-schema. Legacy sessievelden en back-ups blijven compatibel. Historische profielberekening gebruikt elk geldig meetevent en dedupliceert snapshotkopieën van dezelfde fysieke meting.

Dit valideert de registratieketen, niet de thermische tijdconstanten. Lokale thermische kalibratie blijft afhankelijk van toekomstige echte meetreeksen. Zie audit §162.

Volgende stap: punt 5 — voorvoeradviezen en confidence-gating auditen; numerieke runtimewijziging pas na expliciete productgoedkeuring.


## 138. Punt 5 — voorvoeruitvoer behouden, numerieke presentatie begrenzen (20 november 2026)

De eigenaar heeft bevestigd dat geen informatie verloren mag gaan. Daarom blijven alle bestaande temperatuurbanden, interne geschiktheidsscores, soortfactoren, hoeveelheden en persoonlijke voorvoervergelijkingen in `prebaitEngine` behouden. Er vindt geen herkalibratie of wijziging van de berekeningsregels plaats.

De enige runtime-aanpassing is confidence-gating in de algemene PrognosisView: exacte gramhoeveelheden worden uitsluitend getoond bij de bestaande invoerkwaliteit `Redelijk`. Bij lagere kwaliteit blijven kwalitatieve aanbevelingen en eventuele timing zichtbaar, maar worden exacte grammen verborgen. Dit geldt zowel voor voorafgaande voerbeurten als de sessiehoeveelheid. De bestaande disclaimer blijft duidelijk maken dat `Redelijk` de volledigheid van invoer beschrijft en geen wetenschappelijke validatie van de hoeveelheid inhoudt.

De wijziging raakt geen andere prognose-, weer-, habitat-, positionerings- of VisCoach-functie en voegt geen invoervelden toe. De temperatuurbanden blijven indicatieve tactische context.

## 139. Punt 5 technisch afgerond — voorvoerplanner en confidence-gating (21 november 2026)

De afgesproken scope van punt 5 is technisch afgerond. De bestaande `prebaitEngine`-berekeningen en interne uitkomsten zijn behouden. Een gerichte regressietest (`test-prebait-engine.ts`) is aan de Quality Gate toegevoegd en rapporteert negen geslaagde assertions. De bestaande VisCoach-sessieadviestest rapporteert 75 geslaagde assertions. Quality Gate-run [#1031](https://github.com/sennzor-wq/Vislogboek/actions/runs/44907219860) is volledig groen op `585d15299f95861312d64021949d0ffb6f95218e`, inclusief typecheck, overige regressietests, productiebuild en private-artifactcontrole.

De algemene PrognosisView is statisch gecontroleerd: één `Redelijk`-gate beschermt de gramweergave van zowel voorafgaande voerbeurten als de sessiehoeveelheid; de interne totaalsom wordt niet apart getoond. Er is geen bestaande React-componenttestinrichting, dus er is geen brede testinfrastructuur toegevoegd. Dit is voldoende technische controle voor deze afgebakende presentatielogica, geen biologische validatie.

De numerieke temperatuurbanden, soortfactoren en hoeveelheden blijven heuristische startindicaties. `Redelijk` betekent alleen dat de temperatuur- en stekgegevens voldoende compleet zijn; het bewijst niet dat de grammen biologisch juist zijn. Punt 5 is hiermee gesloten binnen de afgesproken scope. De overige Fase-2-acceptatiecriteria blijven open; Fase 2 is niet formeel geaccepteerd en Fase 3 blijft geblokkeerd.


## 140. Normalisatie- en coveragecontract v1 (21 november 2026)

Audit §171 concretiseert de normalisatie- en missing-data-architectuur zonder runtime-activatie. Elke factoruitkomst moet een expliciete responsfamilie, soort-/levensfasescope, ruwe waarde/eenheid, optionele vaste responsindex, inputstatus, provenance, geldigheidsvenster, onzekerheid, toelatingsstatus, overlapgroep en modelversie behouden.

De inputstatussen zijn onderscheiden als gemeten, geschat, proxy/context, onbekend, ongeldig, tegenstrijdig en niet van toepassing. Ontbrekend is geen neutrale waarde; gewichten worden niet stilzwijgend herverdeeld en er wordt geen algemeen coveragepercentage berekend zolang geen goedgekeurde weging en relevante-factornoemer bestaan. De bestaande optie-A-thermische prior blijft de baseline-uitzondering. Een gedeeltelijke gecombineerde kandidaat wordt pas toegelaten voor precies die coveragepatronen die onafhankelijk zijn gevalideerd.

Normalisatie gebruikt vaste referentieankers en een responsindex die geen kanspercentage is. Dagelijkse min-max-normalisatie, dubbele telling van dezelfde oorzaak, onbewezen interacties en generieke tijdvakbonussen zijn uitgesloten. Chronologische rolling-origin-validatie vergelijkt kandidaat en bevroren thermische baseline op dezelfde ongeziene waarnemingen, met factorablaties, responsgebonden metrics, segmentatie en expliciete rapportage van ontbrekende labels en negatieve resultaten.

De 93 registry-records bevatten 0 numeriek goedgekeurde bronnen. Directe lokale biologische labels ontbreken; daarom is dit uitsluitend een ontwerpcontract. Er zijn geen code, datamodel, score, gewichten, parameters of gebruikersinvoer gewijzigd. Fase 2 blijft open en Fase 3 geblokkeerd. Zie audit §171.


## 141. Read-only audit lokale biologische labels en evaluatiehaalbaarheid (21 november 2026)

Audit §172 volgt de daadwerkelijke datatypen en invoerflow. De app bewaart fysieke watertemperatuurmeetevents, sessiebrede kwalitatieve aanwezigheidscategorieën, sessietotalen voor aanbeten/gemiste vissen, vangstrecords met timestamp-provenance, optionele hengelgebeurtenissen en expliciete hengelactieve intervallen.

Deze bronnen meten verschillende responsen. Watertemperatuur is predictor-/schattervalidatie; vangst en bevestigde nulvangst voeden uitsluitend persoonlijke vangstkans; hengelintervallen leveren exposure voor beschrijvende vangbaarheid. `aasbellen_voedselactiviteit` is een subjectief, sessiebreed visueel signaal zonder eigen tijdstip, duur of intensiteit en is geen kwantitatieve voedselopname. Automatisch voorgestelde vangsttijdstippen worden terecht niet als betrouwbare tijdvaklabels gebruikt; user-adjusted tijden blijven zelfgerapporteerd.

Conclusie: de huidige lokale dataset bevat geen directe onafhankelijke labels voor fysiologische activiteit, hoeveelheid voedselopname of biologische tijdvakvoorkeur. Meer vangsten lossen die labelkloof niet op. Er worden geen verplichte velden of nieuwe UI voorgesteld; toekomstige directe observaties vragen een afzonderlijk productbesluit. Geen runtimewijziging of datamigratie. Zie audit §172.


## 142. Respons- en evaluatiematrix op bestaande labels (21 november 2026)

Audit §173 koppelt iedere responsfamilie aan de werkelijk beschikbare labels, kwaliteitsfilters en passende evaluatiemethode. Watertemperatuur wordt uitsluitend tegen latere fysieke meetevents getoetst (MAE/RMSE/bias, met forecast-as-of en meetdiepte/provenance). Persoonlijke vangstkans blijft een afzonderlijke kansrespons met Brier/kalibratie en BSS uitsluitend via de bestaande chronologische rolling baseline. Vangst per tijdvak blijft een exposure-aware beschrijving van persoonlijke vangbaarheid, niet van biologische activiteit. Sessiebrede aanwezigheidssignalen blijven kwalitatieve context.

Fysiologische activiteit, kwantitatieve voedselopname en biologisch voedingsritme zijn met de huidige lokale sessievelden niet onafhankelijk valideerbaar. Er worden geen vangsten, aanbeten of aasbellen tot biologische labels hernoemd. De lokale IndexedDB is niet via GitHub beschikbaar; actuele aantallen en coverage zijn daarom niet geclaimd. Bestaande softwaredrempels van vijf waarnemingen zijn geen wetenschappelijke acceptatiecriteria.

Deze stap is documentatie en code-contractanalyse, geen runtime-implementatie of biologische validatie. Geen verplichte invoer, opslagwijziging, score of gewicht toegevoegd. Fase 2 blijft open; Fase 3 geblokkeerd.


## 143. Begrenzing huidige temperatuurvalidatiekoppeling (21 november 2026)

Audit §174 bevestigt dat meerdere fysieke temperatuurmeetevents per sessie in de historische profielcollector worden verwerkt, maar dat de huidige onafhankelijke forecast-evaluatie nog één scalaire sessiemeting aan één gekoppelde sessiestartsnapshot gebruikt. De bestaande validatiefilter vereist forecast vóór meting en dezelfde lokale datum, maar controleert geen exacte gelijkheid tussen voorspeld thermisch doelmoment en fysiek meetmoment. De evaluatie-engine berekent MAE/RMSE/bias vanaf vijf paren; lokale biaskalibratie vereist acht paren op dezelfde stek en in hetzelfde seizoen. Deze softwaredrempels zijn geen wetenschappelijke acceptatiecriteria.

Daarom is de huidige evaluatie geen volledige validatie van alle afzonderlijke sessiemeetevents en nog geen bewijs van tijdstipnauwkeurigheid. Vervolg is eerst een read-only ontwerp voor doelmomentmatching, eventkoppeling en deduplicatie, met behoud van legacy scalaire data. Geen runtime- of datamodelwijziging. Fase 2 blijft open; Fase 3 geblokkeerd.


## 144. Ontwerp eventniveau-temperatuurvalidatie (21 november 2026)

Audit §175 definieert een read-only ontwerp voor afgeleide event-naar-snapshot-paren. Een paar vereist een uniek fysiek meetevent, dezelfde sessie en locatie, een expliciet vooraf berekende voorspelling, forecast vóór meetmoment en een opgeslagen thermisch doelmoment. Eén event en één snapshot mogen ieder maximaal één keer worden gebruikt; ambiguïteit leidt tot uitsluiting, niet tot willekeurige selectie. De legacy scalaire route blijft intact wanneer geen event-array bestaat; wanneer events bestaan wordt de scalaire samenvatting niet dubbel geteld.

Eventniveau-MAE/RMSE/bias blijft aanvankelijk gescheiden van lokale biascalibratie. Meerdere meetevents binnen één sessie tellen niet als meerdere onafhankelijke sessies. De toegestane tijdsafstand tussen thermisch doelmoment en fysiek meetmoment is nog niet onderbouwd; er wordt geen tolerantie verzonnen. Eerst semantiek van targetTimestamp controleren en de eigenaar laten besluiten; geen implementatie zonder expliciete goedkeuring. Geen runtime- of datamodelwijziging. Fase 2 blijft open; Fase 3 geblokkeerd.


## 145. Geen gegarandeerd thermisch doelmoment in huidige sessiesnapshots (21 november 2026)

Audit §176 toont dat waterThermalEngine.targetTimestamp alleen wordt gevuld bij een expliciete targetTime. De algemene thermische analyse voor sessiestart en sessie-update krijgt die parameter niet en bewaart daarom doorgaans null. De interne tijdvakberekening gebruikt wel een representatief slotTargetTime, maar TimeSlotAnalysis bewaart de bijbehorende thermische analyse niet. targetWindowStart/End en forecastTimestamp zijn andere tijdsbegrippen en mogen dit doelmoment niet vervangen.

Daarom kunnen bestaande sessiemeetevents niet betrouwbaar aan predictedWaterTemperature worden gekoppeld met alleen de huidige persistente snapshotvelden. §175 blijft het gewenste kwaliteitscontract, maar is nog niet direct implementeerbaar. Vergelijk eerst twee expliciete ontwerpvarianten: voorspelling voor een concreet meetdoelmoment versus vooraf vastgelegde tijdvakvoorspellingen. Geen implementatie zonder eigenaarbesluit; geen runtime- of schemawijziging. Fase 2 blijft open; Fase 3 geblokkeerd.

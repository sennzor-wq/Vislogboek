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

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
3. Rond de factorprovenance af voor alle prognose- en snapshotbouwers.
4. Herzie thermische profielparameters alleen waar de brondata dat rechtvaardigen; voeg curve- en regressietests toe.
5. Ontwikkel de voedingslaag met afzonderlijke bewijsklassen en expliciete onzekerheid.
6. Houd habitatuitvoer voorlopig kwalitatief tot voldoende lokale presence-data bestaan.
7. Herzie en kalibreer de vangkans pas met voldoende echte sessies en chronologische backtests.

**Huidige status:** architectuur gekozen en vastgelegd. Er zijn nog geen nieuwe numerieke gewichten, biologische bonussen, gekalibreerde aanwezigheidskansen of vervangende vangstformules geïmplementeerd. Fase 2 blijft open.

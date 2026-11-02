# Vislogboek — implementatieplan 32 goedgekeurde verbeterpunten

**Status:** goedgekeurd voor gefaseerde uitvoering  
**Goedgekeurd:** 2 november 2026  
**Repository:** `sennzor-wq/Vislogboek`  
**Basis:** actuele `main`, `PROJECT_CONTEXT.md`, `VISCOACH_PRODUCT_ROADMAP.md` en de read-only technische audit.

## Doel en werkwijze

Dit plan vertaalt de 32 goedgekeurde verbeterpunten naar veilige, controleerbare wijzigingen. De bestaande app, prognose-engine, biologische kennis, offline-first architectuur en alle werkende functies blijven leidend. Er wordt geen tweede engine gebouwd voor een domein waarvoor al een gezaghebbende implementatie bestaat.

Elke fase wordt op een afzonderlijke branch ontwikkeld, krijgt gerichte regressietests en wordt via een pull request aangeboden. Een fase is pas afgerond wanneer de relevante tests en productiebuild slagen en de diff is gecontroleerd. Er wordt geen handmatige Android-test geclaimd tenzij die daadwerkelijk is uitgevoerd.

## Harde randvoorwaarden

1. Offline-first blijft de standaard; geen cloud-, account-, centrale AI- of betaalde dienst als vereiste voor kernfunctionaliteit.
2. Bestaande data en IDs blijven behouden. Databasemigraties zijn additief en achterwaarts compatibel waar mogelijk.
3. Prognosesnapshots zijn onveranderlijk. Uitkomsten en evaluaties worden apart toegevoegd.
4. Gemeten, voorspelde, geschatte, door de gebruiker waargenomen en onbekende waarden blijven onderscheidbaar.
5. Geen standaardwaarde mag ontbrekende meetgegevens stilzwijgend maskeren.
6. Persoonlijke gegevens beïnvloeden modellen geleidelijk, met minimumaantallen, onzekerheid en terugval op algemene biologische kennis.
7. Bestaande engines worden hergebruikt en verbeterd; geen dubbele prognose-, temperatuur-, evaluatie- of tactische engine.
8. Back-up en herstel moeten alle persistente gebruikersgegevens en relaties bewaren en round-trip getest worden.

## Uitvoeringsvolgorde

### Voorbereidende stap — documentatie en baseline

- Dit plan vastleggen als projectdocument.
- `PROJECT_CONTEXT.md` en de VisCoach-roadmap synchroniseren: concrete start- en eindtijd als coachinput; groepssessies en totale hengels; volledige lokale back-up; betrouwbaarheids- en provenance-regels.
- Huidige test- en buildstatus op de actuele basis vastleggen.
- Per fase relevante bestaande tests en codepaden inventariseren.

**Acceptatie:** documenten spreken elkaar niet tegen; uitgangscommit en testresultaten zijn vastgelegd; geen applicatiegedrag gewijzigd.

### Fase 1 — gegevenscorrectheid, uitkomsten en snapshots (punten 1–6)

1. Doelsoortvangst uitsluitend afleiden uit soortspecifieke vangstregistratie of een ondubbelzinnige uitkomst; niet uit een algemene sessie-uitkomst alleen.
2. Biologische activiteit en persoonlijke vangstkans als afzonderlijke grootheden houden. Ongevalideerde vaste aanwezigheidspremies niet als bewezen kanscorrectie toepassen.
3. Ontbrekende sessieduur blijft onbekend; sluit onbekende blootstelling uit van duur-/inspanningsevaluatie.
4. Aanwezigheidswaarnemingen afzonderlijk opslaan en interpreteren; geen waarneming is geen bewijs van afwezigheid.
5. Aanbeten/missers onderscheiden van viswaarnemingen en voorkomen dat dezelfde gebeurtenis dubbel meetelt.
6. Snapshot en sessie atomair opslaan waar ze samen worden aangemaakt; snapshotcontext volledig bewaren, inclusief de toen beschikbare weersverwachting. Dedupe alleen op inhoudelijk passende sessiecontext.

**Tests:** doelsoort versus bijvangst; ontbrekende soort; onbekende duur; alle waarnemingstypen; geen dubbele telling; save-failure/cancel; snapshotkoppeling en immutable snapshot; weerssnapshot round-trip.

**Acceptatie:** geen vals doelsoortsucces of kunstmatige blootstelling; snapshot kan niet verweesd raken via normale sessiestartflow; bestaande historische records blijven leesbaar.

### Fase 2 — volledige lokale back-up en herstel (punten 7–11)

- Back-upformaat versiebeheer geven.
- Alle Dexie-tabellen exporteren: locaties, sessies, vangsten, instellingen, weer-cache, prognosesnapshots en aanwezigheidswaarnemingen.
- Foto's en andere media volledig meenemen, met behoud van verwijzingen/relaties.
- Import/merge en volledige restore alle relevante tabellen en instellingen laten herstellen.
- Validatie uitvoeren vóór mutatie; restore veilig en transactioneel uitvoeren waar Dexie dit ondersteunt.
- Bestaande back-ups blijven importeerbaar via expliciete migratie/compatibiliteitslogica.
- Nieuwe toekomstige tabellen (coachadviezen, per-hengelgegevens, lokale leerprofielen) moeten aan hetzelfde backupcontract worden toegevoegd.

**Tests:** export → lege database → import → volledige recordvergelijking per tabel; media/afbeeldingen; IDs en foreign-keyrelaties; merge zonder duplicaten; replace wist/restaureert exact; corrupte/incompatibele backup laat database ongemoeid; oudere backupcompatibiliteit.

**Acceptatie:** round-trip bewijst volledig herstel van alle persistente gebruikersdata. Cachebeleid wordt expliciet gedocumenteerd; geen persistente tabel wordt stilzwijgend overgeslagen.

### Fase 3 — domeinspecifieke schattingen en modelbetrouwbaarheid (punten 12–17)

- Voor elk element expliciet vastleggen of de waarde gemeten, voorspeld, geschat of onbekend is, inclusief tijdstip/herkomst en onzekerheid waar relevant.
- Bestaande waterthermische engine behouden en gericht verbeteren: laatste lokale meting als anker, thermische traagheid, tijd sinds meting, weersontwikkeling, diepte/watertype indien onderbouwd en oplopende onzekerheid bij meetgaten.
- Andere elementen via hun eigen fysische/meteorologische/biologische modellen behandelen; geen generieke procentuele correctie.
- Luchttemperatuur nooit als watertemperatuur presenteren.
- Algemene soortbiologie blijft de fallback; lokale data krijgt geleidelijk gewicht via shrinkage/kalibratie en alleen bij voldoende vergelijkbare waarnemingen.
- Activiteitsindex, vangstkans, verwacht aantal en onzekerheid afzonderlijk houden.
- Chronologische backtests uitvoeren zonder future leakage; evaluatiematen per modeldoel kiezen (temperatuur MAE/RMSE/bias; binaire kans Brier/kalibratie).

**Tests:** gemeten anker en thermische traagheid; oude meting → grotere onzekerheid; ontbrekende inputs; provenance; lokale data met kleine/grote steekproef; fallback; chronologische validatie; regressie van bestaande prognoses.

**Acceptatie:** geen schijnmetingen of ongefundeerde kanscorrecties; bestaande modeluitvoer blijft verklaarbaar en wordt aantoonbaar getest.

### Fase 4 — groepssessies, hengelinspanning en optionele hengeldetails (punten 18–21)

- Bestaande `rodCount` blijft het totale aantal hengels van de groepssessie betekenen.
- Optioneel aantal deelnemers toevoegen indien dit echt nodig is; geen verplichte persoonsaccounts of namen.
- Optionele per-hengelrecords ontwerpen met positie/zone, techniek, aas/presentatie, actieve intervallen en gebeurtenissen.
- Hengeluren berekenen als som van werkelijk actieve hengelintervallen.
- Sessie blijft de primaire observatie; hengels zijn geen onafhankelijke sessies.
- Oude sessies zonder detailrecords blijven volledig bruikbaar.

**Tests:** 1 visser/2 hengels; 3 vissers/6 hengels; ongelijke actieve tijden; ontbrekende intervallen; oude records; groepsuitkomst versus hengelattributie; backup round-trip van nieuwe records.

**Acceptatie:** correcte inspanningsmaat zonder bestaande sessies te breken of aantallen hengels als onafhankelijke bewijssteekproeven te tellen.

### Fase 5 — kwaliteitspoorten voor tactische modellen (punten 22–26)

- Bestaande `dataQualityEngine` als gedeelde kwaliteitsbron uitbreiden/gebruiken, zonder dubbele engine.
- Per advies vastleggen welke inputs vereist zijn en welke ontbreken.
- Wind-/werp-/kijkrichting alleen concreet maken met voldoende geometrie, oeveroriëntatie en visserpositie.
- Habitat-/bewegingsadvies onzekerheid en aannames laten doorgeven.
- Voorvoeradvies geen concrete hoeveelheden/timing laten geven wanneer essentiële context ontbreekt.
- Eén consistente aanpak voor minimumaantallen, spreiding, onzekerheid en geleidelijke persoonlijke weging, met domeinspecifieke criteria.

**Tests:** ontbrekende geometrie; ontbrekende diepte/watercontext; onvoldoende voorvoerdata; beperkte versus voldoende lokale historie; conflicterende engine-uitkomsten; bestaande adviezen en prognoses regressie.

**Acceptatie:** adviezen worden alleen zo specifiek als de gegevens toelaten; onzekerheid en ontbrekende context zijn zichtbaar.

### Fase 6 — VisCoach als geïntegreerde coachlaag (punten 27–32)

- Eerst afhankelijkheden van bestaande VisCoach-modal/service vaststellen; bruikbare onderdelen hergebruiken.
- Geen tweede prognose- of biologische engine.
- Instap: doelsoort, stek, gewenste start- en eindtijd; alternatieve tijdvakken vergelijken bij gelijke duur.
- Coachplan combineert bestaande prognose, activiteit, betrouwbare persoonlijke kans indien beschikbaar, wind/oever/positionering en tactiek met bron- en onzekerheidsinformatie.
- Plan start een sessie; actieve sessie biedt handmatige heranalyse en optionele herinneringen.
- Oorspronkelijke prognose en eerste coachadvies blijven onveranderlijk; nieuw advies wordt als aparte tijdgestempelde versie opgeslagen.
- Gepland en werkelijk gevist tijdvak afzonderlijk bewaren.
- Na afloop prognose, adviezen, uitgevoerde aanpak en uitkomst afzonderlijk evalueren.
- Alle nieuwe persistente gegevens opnemen in back-up/restore.

**Tests:** intake en tijdvakvergelijking; plan → sessie; actieve coach; heranalyse maakt nieuwe versie; originele snapshots blijven onveranderd; geplande versus werkelijke tijden; offline gebruik; backup/restore; volledige regressie.

**Acceptatie:** volledige coachcyclus werkt lokaal en gebruikt de bestaande gevalideerde engines.

## Test- en releasebeleid

- Baseline: `npm run lint` en `npm run build`, plus bestaande relevante tests.
- Per wijziging gerichte regressietests toevoegen of aanpassen.
- Na iedere fase: typecheck/lint, volledige testset die in het project is ingericht, productiebuild en diff-review.
- Testresultaten worden alleen als geslaagd gemeld wanneer ze daadwerkelijk zijn uitgevoerd.
- Geen PR automatisch mergen zonder controle van de diff en CI-resultaten.
- Geen wijzigingen aan live gebruikersdata; databasewijzigingen worden via migraties getest met representatieve oude records en backup/restore.
- Als een bevinding een grotere datamigratie of onomkeerbare wijziging vereist, eerst een veilige compatibiliteitsstrategie uitwerken.

## Risicobeheersing

| Risico | Beheersing |
|---|---|
| Historische sessies verkeerd classificeren | Conservatieve migratie; ambigue uitkomsten niet als doelsoortsucces tellen |
| Dataverlies bij backup/import | Volledige round-trip tests, validatie en transactionele restore |
| Modelregressie | Chronologische backtests en regressietests vóór vrijgave |
| Extra invoer maakt logboek omslachtig | Per-hengel- en deelnemersdetails optioneel houden |
| Schijnnauwkeurigheid | Provenance, onzekerheid en quality gates |
| Bestaande functionaliteit verdwijnt | Kleine PR's, expliciete regressietests en diff-review |
| Offlinewerking wordt afhankelijk van externe dienst | Alle kernberekeningen en opslag lokaal houden |

## Statusregistratie

Elke fase wordt hieronder bijgewerkt met branch/PR, gewijzigde onderdelen, testresultaten, openstaande punten en merge-status. Een punt is niet als afgerond gemarkeerd op basis van alleen code-aanwezigheid; tests en gedrag moeten dit ondersteunen.

- Voorbereidende stap: afgerond; implementatieplan PR #12 samengevoegd. Projectcontext wordt met deze documentatie-update gesynchroniseerd.
- Fase 1: afgerond; PR #13 (gegevenscorrectheid, doelsoortuitkomst, onbekende duur, aanwezigheid zonder kansbonus en atomische snapshots) en PR #15 (afzonderlijke opslag van sessiewaarnemingen) samengevoegd. CI geslaagd.
- Fase 2: afgerond; PR #17 samengevoegd. Back-up v3 exporteert en herstelt alle zeven persistente Dexie-tabellen, instellingen en ingebedde foto's; merge/replace, legacycompatibiliteit, validatie en round-trip tests zijn toegevoegd. CI (typecheck, alle regressies, round-trip-suite en productiebuild) geslaagd. Geen handmatige Android-test geclaimd.
- Fase 3: gepland.
- Fase 4: gepland.
- Fase 5: gepland.
- Fase 6: gepland.

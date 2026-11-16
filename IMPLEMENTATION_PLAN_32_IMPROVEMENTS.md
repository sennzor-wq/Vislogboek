# Vislogboek — implementatieplan 32 goedgekeurde verbeterpunten

**Status:** goedgekeurd voor gefaseerde uitvoering  
**Goedgekeurd:** 2 november 2026  
**Repository:** `sennzor-wq/Vislogboek`  
**Basis:** actuele `main`, `PROJECT_CONTEXT.md`, `VISCOACH_PRODUCT_ROADMAP.md` en de read-only technische audit.

## Doel en werkwijze

Dit plan vertaalt de 32 goedgekeurde verbeterpunten naar veilige, controleerbare wijzigingen. De bestaande app, prognose-engine, biologische kennis, offline-first architectuur en alle werkende functies blijven leidend. Er wordt geen tweede engine gebouwd voor een domein waarvoor al een gezaghebbende implementatie bestaat.

Elke wijziging wordt eerst getoetst aan de actuele `main`. Maak geen nieuwe branch zonder voorafgaande afstemming met de gebruiker. Gebruik alleen een afgestemde bestaande branch of een vooraf besproken werkwijze; wijzigingen tellen pas als onderdeel van de app nadat ze gecontroleerd op `main` staan. Iedere wijziging krijgt gerichte regressietests. Een fase is pas afgerond wanneer de relevante tests en productiebuild slagen en de volledige diff is gecontroleerd. Er wordt geen handmatige Android-test geclaimd tenzij die daadwerkelijk is uitgevoerd.

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
- `PROJECT_CONTEXT.md` en de VisCoach-roadmap synchroniseren: gewenste starttijd als verplichte coachinput en eindtijd optioneel; groepssessies en totale hengels; volledige lokale back-up; betrouwbaarheids- en provenance-regels.
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

**Aanvullende waterthermische uitwerking (fase 3):**
- Een actuele lokale watertemperatuurmeting blijft leidend; historische waarden zijn uitsluitend referentie/anker en worden nooit als actuele meting getoond.
- Historische profielen worden alleen opgebouwd uit echte, tijdgestempelde meetwaarden in sessies of geëvalueerde snapshots. Zelfde stek: minimaal 3 waarnemingen. Terugval naar hetzelfde watertype: minimaal 5 waarnemingen uit ten minste 2 locaties binnen 50 km, met dieptevergelijking wanneer beide dieptes bekend zijn. Alleen eerdere waarnemingen uit dezelfde of aangrenzende kalendermaand tellen mee.
- Een onbekend watertype of ontbrekende diepte blijft expliciet onbekend; er wordt geen standaarddiepte van 2 meter ingevuld.
- Gemeten kortgolvige straling krijgt voorrang op bewolking als zonne-invoer. Luchtvochtigheid, dauwpunt en wind leveren een kwalitatieve indicatie van verdampingspotentieel. Deze indicatie verandert de temperatuur niet en krijgt pas na lokale validatie een gekwantificeerde invloed op de onzekerheidsmarge. Bij een historisch profiel wordt de seizoensmediaan als starttoestand gebruikt en wordt de actuele weersafwijking ten opzichte van de voorafgaande 72 uur daarop toegepast; er wordt geen extra vrije mengcoëfficiënt toegevoegd.
- De aanpak is KNMI-geïnformeerd, maar geen één-op-één implementatie van het operationele KNMI-model. De openbare documentatie beschrijft processen en toepassingsgebied, maar biedt geen gedocumenteerde numerieke API of volledige implementatiespecificatie. De KNMI-gerapporteerde nauwkeurigheid wordt dus niet aan Vislogboek toegeschreven.
- Rijkswaterstaat WaterWebservices is als mogelijke bron van historische gemeten oppervlaktewatertemperaturen geregistreerd. Automatische stationselectie/import is nog niet geactiveerd: dekking van kleine regionale wateren en representativiteit van een meetstation moeten eerst per locatie worden vastgesteld.
- Temperatuurherkomst, historisch profiel, meetanker, onzekerheid en weersdekking worden in nieuwe prognosesnapshots vastgelegd.

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

**Bindende architectuur:** VisCoach is de gebruiksvriendelijke interface boven op bestaande gegevens, UI-componenten, services en engines. Er wordt geen tweede prognose-, biologische, tactische, sessie- of vangstengine gebouwd. Ontbrekende functionaliteit wordt toegevoegd aan de bestaande laag die daarvoor verantwoordelijk is.

#### 6A — Documentatie, contracten en bestaande onderdelen
- Bestaande VisCoach-modal/service, prognosepagina, actieve sessie-interface, weerupdates, prognose-engine, tactische modules, Dexie-tabellen en backupservice als uitgangspunt nemen.
- De VisCoach-presentatielaag gebruikt bestaande componenten en berekeningsuitvoer; alleen ontbrekende VisCoach-specifieke presentatie wordt nieuw gebouwd.
- Verplichte keuzes: doelsoort, stek en gewenste starttijd. Eindtijd is optioneel; onbekende duur blijft onbekend.
- Eén gedeeld sessie-/prognosecontextcontract voor plan, startsnapshot, actieve sessie en latere evaluatie.

#### 6B — Backend en dynamische sessiecoördinatie
- Eén sessiegebonden coachcoördinator toevoegen. Deze is geen prognose-engine: zij reageert op bestaande weer-, sessie-, vangst-, waarnemings- en meetupdates, roept de bestaande prognose-/analysemodules aan en vergelijkt hun uitkomsten.
- Bij daadwerkelijke sessiestart automatisch de volledige beschikbare uitvoer en exacte relevante invoer van de bestaande prognoseberekening als onveranderlijke startsnapshot bewaren.
- Tijdens de sessie alleen bij betekenisvolle gecombineerde veranderingen een update-snapshot en/of afzonderlijk coachadvies opslaan. Een data-refresh op zichzelf is geen aanleiding.
- Geen arbitraire vaste weersdrempels; betekenis wordt beoordeeld aan de hand van bestaande modeluitvoer, praktische adviesimpact, datakwaliteit en conservatieve hysterese/idempotentie.
- Coachadviesrecords verwijzen naar prognosesnapshot, sessie en eventueel het vorige advies; zij dupliceren de volledige prognose niet.
- Automatische verwerking tijdens gebruik en herbeoordeling bij terugkeer/heropenen. Geen continue achtergrondverwerking beloven wanneer de PWA volledig gesloten is.
- Handmatige heranalyse blijft aanvullend; herinneringen blijven optioneel.

#### 6C — Gebruiksvriendelijke VisCoach-interface
- Een compacte VisCoach-start-/planervaring bouwen met hergebruik van bestaande UI-componenten, stek-/soortgegevens, prognose-uitvoer en tactische resultaten.
- De interface toont praktische aanbevelingen, relevante redenen en onzekerheid; technische details blijven optioneel.
- VisCoach integreert in de bestaande actieve sessie-interface. De bestaande sessie-, vangst- en hengelregistratie blijft de primaire invoer; geen tweede live-sessie-interface.
- De gebruiker houdt de controle over het uitvoeren van voorstellen. Geen automatische sessieafsluiting of tactiekuitvoering.
- De bestaande sessie-instap buiten VisCoach en ondersteuning voor meerdere actieve sessies blijven behouden.

#### 6D — Integratie en validatie
- Plan → bewuste sessiestart → startsnapshot → automatische sessieherbeoordeling → betekenisvol nieuw advies → uitvoering → evaluatie.
- Backup/restore van alle nieuwe persistente records en relaties.
- Veilige verwijdering testen: coachadvies volgt de expliciete sessieverwijdering; planningshistorie blijft behouden; snapshots met plan-/adviesverwijzingen worden beschermd.
- Offlinegedrag, heropenen, dubbele events, herhaalde identieke weerdata, kleine fluctuaties en gecombineerde relevante veranderingen testen.
- Bestaande sessies, vangsten, prognoses, import/export en alle huidige instaproutes regressietesten.

**Tests:** bestaande engines worden aangeroepen in plaats van gedupliceerd; startprognose blijft onveranderlijk; betekenisvolle update-snapshot; advies zonder onnodige duplicaten; provenance en vorige adviesreferentie; optionele eindtijd; plan versus actieve sessie; PWA heropenen/offline; backup round-trip; volledige regressie en productiebuild.

**Acceptatie:** VisCoach is een gebruiksvriendelijke geïntegreerde interface op bestaande Vislogboek-functionaliteit; dynamische sessiebegeleiding gebruikt dezelfde bestaande gegevensstromen en engines; alle nieuwe adviezen zijn herleidbaar en alleen betekenisvolle veranderingen veroorzaken nieuwe registraties.

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
- Fase 3: afgerond en samengevoegd naar `main` via PR #27 (merge commit `390284a5bed6cfc4ade8448335fd4feae20cce2f`). De thermische provenance, meetankers, historische profielen, weersdekking, future-leakage-bescherming en synthetische audit zijn geïmplementeerd. Quality Gate run #145 is geslaagd, inclusief typecheck, regressies, forward validation, 12 synthetische temperatuurcontroles, backup/restore en productiebuild. Praktijkvalidatie met echte lokale watertemperatuurmetingen is uitgesteld tot zulke gegevens vanzelf beschikbaar komen en is geen blokkade voor afronding. Resultaten van synthetische tests worden niet als echte voorspellende nauwkeurigheid gepresenteerd. Biologische soortprofielen blijven voorlopige relatieve modellen; KWO-praktijkkennis ondersteunt de algemene temperatuurtrend, niet een universele harde grens. RWS-import is geen acceptatievoorwaarde.
- Fase 4: afgerond en samengevoegd naar `main` via PR #30 op 2 november 2026 (merge commit `43541547260b8ed3a8e43c5b471f7fcaa88882d1`). Punten 18–21 zijn geïmplementeerd: groepsgrootte en totaal hengelaantal, optionele per-hengelrecords, werkelijke hengeluren en sessie-als-primaire-eenheid. Dexie v3 en backup v4 voegen per-hengelrecords additief toe; v1–v3 blijven importeerbaar. Quality Gate run #165 is volgens de PR-controle geslaagd, inclusief typecheck, regressies, veilige verwijdering, backup round-trip, hengelinspanningstests en productiebuild. Open-intervallen worden bij het afronden van de sessie gesloten; actieve sessies kunnen tussentijds worden bewerkt. Per-hengelgebeurtenissen en actieve uren zijn zichtbaar in de sessiedetails.
- Fase 5: **afgerond en samengevoegd naar `main`** via PR #28 (Voerplanner/voorvoerkwaliteit; merge commit `be8c9c3c531626255b793c5c3dd25063be6dfad2`) en PR #33 (tactische modelbetrouwbaarheid, habitat-/bewegingsanalyse, hengelpositionering en soortbiologie; merge commit `09049d51ad3884fff286ad46f6dbb167b196fdbf`). PR #28 gebruikt de bestaande `dataQualityEngine`, onderdrukt concrete voerhoeveelheden/-timing bij ontbrekende essentiële context en begrenst persoonlijke vergelijkingen tot dezelfde stek en doelsoort. PR #33 verwijdert ongefundeerde standaardwaarden en gewichten, maakt ontbrekende context/aannames expliciet, voorkomt geforceerde wind-/kompasadviezen bij onvoldoende data en voegt gerichte regressietests toe. De bijbehorende Quality Gates zijn volgens de PR-validatie geslaagd: run #155 voor PR #28 en run #210 voor PR #33 (typecheck, regressies/tests en productiebuild; PR #33 vermeldt ook dependency-audits en controle op private artifacts). PR #29 is daarnaast samengevoegd en betreft alleen een compactere Voerplanner-weergave; deze is ondersteunend en niet nodig als afrondingsbewijs voor de fase. De kwaliteitscriteria zijn softwarematig afgedekt; dit bewijst geen universele biologische juistheid of praktijknauwkeurigheid van adviezen. Minimumaantallen en persoonlijke weging blijven domeinspecifiek en voorzichtig; ontbrekende of onvoldoende gegevens blijven zichtbaar. **Alle punten 22–26 zijn hiermee afgerond.**
- Fase 6: **afgerond op `main` op 7 november 2026**. De geïntegreerde VisCoach-cyclus voldoet aan de softwarematige acceptatiecriteria. De bestaande prognose-, sessie- en evaluatie-engines zijn hergebruikt; geen parallelle engine toegevoegd. De tien-sessiesimulatie in `test-thermal-and-prognosis.ts` roept de echte `calculateDayPrognosis` en `evaluatePrognosisPerformance` aan: bij 0–4 eerdere geldige sessies blijft de kans `null`, vanaf vijf eerdere sessies ontstaan in het synthetische scenario vijf numerieke kansen (44%, 48%, 43%, 39%, 42%) en vijf geldige Brier-waarnemingen (BS 0,255). De uitkomst is uitsluitend technisch testbewijs, geen praktijkvalidatie. Ook de startsnapshot-tijdgarantie, coachadvies met herleidbare rationale, kleine versus betekenisvolle wijzigingen, dubbele/gelijktijdige events, offline hervatten, backup/restore, veilige verwijdering en de bestaande instaproutes zijn in de regressie-/integratiesuites afgedekt. Quality Gate [#491](https://github.com/sennzor-wq/Vislogboek/actions/runs/42423374317) is volledig geslaagd op commit `ed459875329e03052a7ae442e806890fd3902983`, inclusief typecheck, alle tests, dependency-audits en productiebuild. Een fysieke Android-/multi-tab-browsercontrole is niet geclaimd; de persoonlijke praktijkvalidatie blijft doorlopen onder productfase 0. **Alle punten 27–32 zijn hiermee softwarematig afgerond.**

### Losse prestatiebranch — `perf-weather-optimization`
- Deze branch is niet samengevoegd als geheel. Vergelijking met `main` op 2 november 2026: 11 commits vóór op de gemeenschappelijke basis en 119 commits achter `main`; de branches zijn dus uiteen gaan lopen.
- Dit betekent niet dat de wateroptimalisatie ontbreekt in de huidige app. In de huidige `main` zijn de prefix-somoptimalisatie voor 24-/72-uursvensters in `waterThermalEngine.ts`, hergebruik van druk-/sessie-/vangstgegevens via caches in `prognosisEngine.ts`, temperatuurvalidatiecache in `evaluationEngine.ts` en eenmalige database-initialisatie aantoonbaar aanwezig.
- De branch bevat daarnaast oudere versies van bestanden die sindsdien op `main` verder zijn gewijzigd. De resterende branch-diff moet afzonderlijk worden beoordeeld; de branch mag niet als geheel worden gemerged of als ontbrekende functionaliteit worden beschouwd zonder die vergelijking.
- Een groene CI-run of codevergelijking bewijst op zichzelf geen gemeten snelheidswinst op een fysiek toestel. Daarvoor blijft een reproduceerbare benchmark nodig.


## Status voorbereidende stap / technische auditfase 0 — afgerond op 6 november 2026

De read-only audit en datadictionary zijn vastgelegd in [`FASE0_DATA_DICTIONARY_AND_BASELINE.md`](FASE0_DATA_DICTIONARY_AND_BASELINE.md).

- Baseline: `main` commit `65f56c4a7408d874defa415212b74cd165f01147`.
- Quality Gate: [run #42273675118](https://github.com/sennzor-wq/Vislogboek/actions/runs/42273675118), volledig geslaagd op de baselinecommit.
- Geïnventariseerd: TypeScript-domeintypen, Dexie schema v4, tien persistente tabellen, JSON-backup v5, import-/restorepaden, bestaande services, UI-koppelingen en testdekking.
- Datadictionary beschrijft veldbron, optioneel/verplicht, betrouwbaarheid en verantwoord analysegebruik. Ontbrekende waarden blijven onbekend; geplande en werkelijke inspanning blijven gescheiden.
- Geen applicatiecode of databasegegevens gewijzigd. De audit kon de IndexedDB-inhoud van een gebruikersapparaat niet uitlezen.
- Resterende aandachtspunten zijn expliciet geregistreerd in de audit; ze zijn geen reden om de nulmeting of testresultaten te overschatten.

**Acceptatie voorbereidende stap/Fase 0:** documentatie en codecontract zijn geïnventariseerd; datadictionary en baseline zijn vastgelegd; CI is geslaagd; er is geen applicatiegedrag gewijzigd. Fase 0 is hiermee gereed.


---

## Overkoepelende optimalisatie en uitvoeringsvolgorde (15 november 2026)

De producteigenaar heeft een aanvullend, overkoepelend optimalisatietraject opgedragen. De volgorde en acceptatiecriteria staan in **[VISLOGBOEK_VERBETERPLAN.md](VISLOGBOEK_VERBETERPLAN.md)**. Dit document met 32 verbeterpunten blijft bestaan als bestaand implementatieplan; het nieuwe verbeterplan organiseert de bredere samenhang en bepaalt de eerstvolgende fases. Overlappende werkzaamheden worden niet dubbel uitgevoerd: vóór iedere stap wordt gecontroleerd welke punten al op `main` zijn geïmplementeerd en getest.

Eerste stap: read-only baseline-audit. Daarna prioriteit voor veilige database-initialisatie en het verwijderen van uitsluitend ongeldige benchmark-/testdata, gevolgd door biologische prognose, lerend stekprofiel, tactisch advies en praktijkvalidatie. De toestemming om benchmarkvangsten te verwijderen geldt niet voor echte gebruikersgegevens. Documentatie en dit statusregister worden na iedere fase bijgewerkt.

**Status:** overkoepelend plan vastgelegd op `main`; de uitgebreide fase-0-audit is gestart op `main` commit `4831fd6d7a200467c29773c574be7090674eca29`. De eerdere technische audit van 6 november blijft afgerond op zijn eigen baseline, maar geldt niet als afronding van deze uitgebreidere audit. Eerste bevindingen en openstaande controles staan in [`FASE0_OPTIMIZATION_AUDIT.md`](FASE0_OPTIMIZATION_AUDIT.md). Fase 1 is nog niet gestart. Raadpleeg [`VISLOGBOEK_VERBETERPLAN.md`](VISLOGBOEK_VERBETERPLAN.md) voor actuele status en acceptatiecriteria.


## Aanvullende status — uitgebreide optimalisatie-audit (15 november 2026)

De uitgebreide read-only fase 0 is gestart op actuele `main` commit `4831fd6d7a200467c29773c574be7090674eca29`. De eerdere technische fase-0-audit van 6 november blijft geldig voor zijn eigen baseline en datadictionary, maar dekt niet automatisch de nieuwe traceerbaarheid van blueprint → code → UI → test of de actuele benchmark-/seedafhankelijkheden.

Eerste bevindingen:
- De database-initialisatie seedt nog steeds een vaste sessie van 19 oktober 2026 en vier canonieke vangsten. Deze records staan in code op `isBenchmark: false`; herkomst en verwijzingen moeten eerst worden vastgesteld.
- `src/data/historicalData.ts` beschrijft 10 sessies en 16 vangsten als afkomstig uit een concrete gebruikersbackup. Deze data wordt beschermd en niet als ongeldige benchmark verwijderd; wel wordt onderzocht hoe persoonlijke data uit het nieuwe-installatie seedpad wordt gehouden.
- De numerieke activiteitsscore is op dit moment thermisch gedreven; andere factoren worden als context verwerkt.
- De VisCoach-windsectie wordt alleen bij `strongWind` getoond; de huidige test verwacht expliciet dat deze bij zwakke wind ontbreekt. Dit wordt in fase 4 gericht herzien.
- Quality Gate-runs #503–#511 op de documentatie-updates eindigden vrijwel direct als failure zonder zichtbare workflowstappen of beschikbare logs. Run #510 rapporteerde `runner_id=0`; een rerun van #503 bleef eveneens failure. De oorzaak is onbekend en lijkt vóór de eerste workflowstap te liggen; er is geen geslaagde Quality Gate op de huidige auditbaseline.

Zie `FASE0_OPTIMIZATION_AUDIT.md` voor bronpaden, bewijs, beperkingen en openstaande controles. De audit blijft in uitvoering; geen fase-1-implementatie of verwijdering van gebruikersdata is gestart.


## Fase-0-auditverwijzing — 16 november 2026

De read-only matrix voor de centrale prognose-/VisCoach-/sessie-/evaluatieketen is toegevoegd aan `FASE0_OPTIMIZATION_AUDIT.md` §25. Deze bevestigt aanwezige service- en UI-koppelingen, maar markeert de volledige UI-lifecycle van VisCoach-planning en het starten van geplande sessies als onvoldoende direct getest. Ook is een mogelijke tegenstrijdigheid vastgesteld tussen het gekozen sessietijdvenster en de dagbrede aanbeveling. Zie §25.2 voor de resterende auditdelen. Geen applicatiecode gewijzigd.


## Fase-0-vervolg — stekgegevens en geometrie (16 november 2026)

Audit §26 bevestigt dat wind-, habitat- en positioneringsengines zijn geïntegreerd en scenario-getest. De locatie-invoer heeft echter open punten: standaard-GPS rond Culemborg kan onbedoeld als echte steklocatie worden opgeslagen, gestructureerde habitatkenmerken ontbreken in de gewone editor en oeveroriëntatie is alleen vanuit Prognose instelbaar. Deze punten zijn auditbevindingen; geen code gewijzigd.


## Fase-0-vervolg — persoonlijk leren en hengelinzet (16 november 2026)

Audit §28 bevestigt bestaande beperkte persoonlijke sessie-/soort-/stekstatistiek en een afzonderlijke richtingsnuance. Segmentatie naar techniek, aas/voer en hengeluren ontbreekt in de vangst-rate. De hengelurenhelper is getest maar niet geïntegreerd. De statistiekengine kan onbekende aantallen als één vis tellen en heeft geen aangetroffen directe regressietest. Een centrale stekleerlaag is nog niet aangetoond.

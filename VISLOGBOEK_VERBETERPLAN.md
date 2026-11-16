# Vislogboek — verbeter- en optimalisatieplan

**Status:** voorgesteld en door de producteigenaar opgedragen voor gefaseerde uitvoering  
**Vastgelegd:** 15 november 2026  
**Repository:** `sennzor-wq/Vislogboek`  
**Leidende branch:** `main`  
**Doel:** de bestaande Vislogboek-app aantoonbaar verbeteren op dataveiligheid, biologische prognosekwaliteit, persoonlijk stekleren en praktisch visadvies.

> Dit document is het centrale uitvoeringsplan voor de hieronder beschreven optimalisatie. Het vervangt de productvisie en bestaande technische blauwdrukken niet. Bij overlap worden bestaande ontwerpen hergebruikt; er worden geen parallelle engines of concurrerende roadmaps gestart. De actuele code op `main` bepaalt wat daadwerkelijk is geïmplementeerd.

## 1. Productuitgangspunten

1. De kern van Vislogboek blijft gratis: logboek, sessies, vangsten, prognoses, persoonlijk stekleren en VisCoach worden niet achter een abonnement of betaalmuur geplaatst.
2. Offline-first en lokale opslag blijven uitgangspunt. Geen account, cloud-AI of betaalde externe dienst is vereist voor de kern.
3. Bestaande gebruikersgegevens, IDs, relaties en prognosesnapshots worden beschermd. Geen destructieve initialisatie, stille overschrijving of impliciete interpretatie van ontbrekende gegevens. Alleen de expliciet goedgekeurde eenmalige v4→v5 schone-startmigratie vormt hierop een afgebakende uitzondering voor reeds bestaande sessies en vangsten.
4. Bestaande engines worden eerst onderzocht en hergebruikt. Een nieuwe engine is alleen toegestaan wanneer een aantoonbaar ontbrekende samenhangende functie dit vereist.
5. Een verbetering is pas afgerond wanneer tests, productiebuild, diff-review en relevante documentatiecontrole slagen. Een groene test bewijst op zichzelf geen biologische nauwkeurigheid.
6. Geen arbitraire biologische gewichten of prestatieclaims. Elke factor, respons, interactie en onzekerheid krijgt een onderbouwing en toetsbare rol.
7. Geen toekomstige informatie in historische voorspellingen of evaluaties (future leakage).
8. Als gewone opschoonactie mogen alleen benchmark-/testdata worden verwijderd wanneer zij ongeldig, misleidend of schadelijk voor de productie-ervaring zijn. Eenmalige uitzondering: de producteigenaar heeft op 15 november 2026 expliciet de v4→v5 schone start goedgekeurd, waarbij alle vóór de upgrade bestaande sessies en vangsten worden verwijderd, ook echte historische registraties en bevestigde nulvangstsessies. Deze uitzondering geldt uitsluitend voor die eenmalige migratie; zij is geen algemene toestemming voor latere verwijderacties.

## 2. Uitvoeringsvolgorde

De fases worden in deze volgorde uitgevoerd. Een fase wordt niet overgeslagen omdat een volgende functie zichtbaarder is. Per fase wordt eerst de actuele implementatie op `main` gecontroleerd; de hieronder genoemde bestanden en services zijn startpunten, geen aanname dat hun huidige inhoud ongewijzigd is.

### Fase 0 — Baseline, audit en meetbare uitgangssituatie

**Doel:** exact vaststellen wat er nu werkt, wat alleen in documentatie bestaat en waar de regressierisico's zitten.

Werk:
- Controleer actuele `main`, openstaande PR's, relevante branches, bestaande roadmaps, implementatieplan en Quality Gates.
- Maak een traceerbare matrix: blueprint-eis → code/service → UI-gebruik → test → status (aanwezig, gedeeltelijk, ontbreekt, onzeker).
- Breng alle benchmark-/seeddata, initialisatiepaden en verwijzingen ernaar in kaart.
- Leg bestaande prognose-uitvoer en evaluatiemaatstaven vast als baseline.
- Controleer welke gegevens per stek, soort, sessie en tactische actie werkelijk beschikbaar zijn.
- Geen productcode of gebruikersdata wijzigen tijdens deze audit.

**Acceptatie:**
- De matrix bevat bewijs in code/tests voor iedere conclusie.
- Benchmarkdata en alle verwijzingen/afhankelijkheden zijn geïdentificeerd.
- Er is een reproduceerbare baseline voor tests en prognose-evaluatie.
- Openstaande onzekerheden zijn expliciet benoemd.

### Fase 1 — Dataveiligheid en opschonen van ongeldige benchmarkdata

**Doel:** normale database-initialisatie mag nooit echte gebruikersgegevens vervangen of verwijderen.

Werk:
- Scheid productie-initialisatie, schema-upgrades, eenmalige migraties en ontwikkel-/benchmarkfixtures.
- Verwijder destructieve benchmark-seeding uit het normale productiepad.
- Onderzoek de vaste sessie van 19 oktober 2026 en de vier canonieke vangsten, inclusief alle code-, test-, UI-, documentatie- en evaluatieverwijzingen. De huidige code zet deze records op `isBenchmark: false`; hun herkomst moet daarom expliciet worden vastgesteld voordat ze worden verwijderd.
- Onderzoek ook `HISTORICAL_LOCATIONS`, `HISTORICAL_SESSIONS` en `HISTORICAL_CATCHES` uit `src/data/historicalData.ts`. Het bestand identificeerde deze 5 stekken, 10 sessies en 16 vangsten als afkomstig uit een concrete gebruikersbackup van 26 oktober 2026. Behandel deze records niet als benchmarkdata. Ze vallen alleen onder de expliciet goedgekeurde eenmalige v4→v5 schone-startmigratie; dit is geen algemene benchmarkopruiming.
- Haal persoonlijke backup-/historische fixtures uit het normale seedpad voor nieuwe installaties wanneer de herkomst is bevestigd; behoud bestaande lokale records en voer geen verwijdering/migratie uit zonder backup-, restore- en behoudtests.
- Verwijder alleen aantoonbaar ongeldige synthetische benchmarkvangsten en eventueel de volledige benchmark-sessie wanneer dit veilig kan.
- Behoud synthetische fixtures in tests waar ze nodig en duidelijk gemarkeerd zijn.
- Maak migratie/cleanup idempotent, transactioneel waar ondersteund, en veilig voor bestaande databases.
- Maak vooraf een export-/hersteltest en controleer dat echte sessies, vangsten, foto's/media, IDs en relaties behouden blijven.

**Acceptatie:**
- Herhaald initialiseren verandert geen bestaande gebruikersregistraties.
- Benchmarkdata verschijnt niet opnieuw in productie.
- Cleanup kan geen niet-benchmark gebruikersdata verwijderen.
- Backup → migratie/cleanup → restore is getest.
- Tests dekken lege database, bestaande database, herhaalde initialisatie en gedeeltelijk aanwezige benchmarkdata.

**Databesluit (15 november 2026):** de producteigenaar heeft expliciet een eenmalige v4→v5 schone start goedgekeurd. Deze migratie verwijdert alle vóór de upgrade bestaande sessies én vangsten, inclusief echte historische registraties, nulvangstsessies en records uit de persoonlijke historische backupseed. Ook direct sessiegebonden afgeleide gegevens worden opgeruimd: hengeldetails en coachadviezen worden verwijderd, sessiegekoppelde aanwezigheidwaarnemingen worden verwijderd, prognosesnapshots worden ontkoppeld en hun feitelijke evaluatie-uitkomsten worden gewist. Locaties, instellingen, weercache, geplande sessies, niet-sessiegebonden waarnemingen en de prognosesnapshots zelf blijven behouden. Nieuwe registraties na de migratie blijven bestaan. Dit is uitsluitend toestemming voor deze eenmalige migratie en geen algemene toestemming om later echte gebruikersdata te verwijderen. De volledige scope staat in PROJECT_CONTEXT.md en FASE0_OPTIMIZATION_AUDIT.md.

### Fase 2 — Soortspecifieke biologische activiteits- en gedragsprognose

**Doel:** van een hoofdzakelijk thermisch gedreven activiteitsscore naar een transparant, soortspecifiek model dat relevante invloeden en hun interacties beoordeelt.

Werk:
- Inventariseer alle blueprintfactoren en groepeer ze biologisch, meteorologisch, hydrologisch, seizoensgebonden en lokaal.
- Controleer per factor: biologische hypothese, soort(en), relevante tijdschaal, databron, meet-/schattingsstatus, richting van effect, interacties, onzekerheid en rol in model.
- Houd onderscheid tussen (a) totale activiteit/voedingsactiviteit en (b) habitatkeuze, lokale verplaatsing en ruimtelijke verdeling. Wind kan bijvoorbeeld de locatie beïnvloeden zonder automatisch de totale activiteit te verhogen.
- Modelleer actuele omstandigheden én voorafgaande ontwikkeling (waar gegevensdekking dit toelaat), met passende vertragingen en soortspecifieke respons.
- Behoud watertemperatuur als belangrijke factor, niet als enige bepalende factor.
- Laat ontbrekende of onbetrouwbare invoer zichtbaar doorwerken in onzekerheid; geen stilzwijgende neutrale defaults.
- Gebruik onderbouwde startparameters; leer gewichten niet blind uit een kleine of vertekende vangstdataset.
- Leg factorbijdragen en onzekerheid uitlegbaar vast in de prognose-uitvoer.
- Backtest chronologisch op sessies die niet voor training/kalibratie zijn gebruikt. Voorkom future leakage en vergelijk met een eenvoudige baseline.

**Acceptatie:**
- Iedere factor uit de blueprint heeft een expliciete status: actief in score, actief in habitat-/bewegingsmodel, alleen context, niet beschikbaar of bewust uitgesloten met onderbouwing.
- Factoren hebben tests voor relevante soorten, seizoenen, tijdsverloop en interacties.
- De nieuwe prognose wordt kwantitatief vergeleken met de baseline op ongeziene historische sessies.
- Resultaten en beperkingen worden eerlijk gerapporteerd; geen nauwkeurigheidsclaim op basis van alleen synthetische tests.

### Fase 3 — Geïntegreerd lerend stekprofiel per stek en doelsoort

**Doel:** bestaande gegevens en engines samenbrengen tot een persoonlijk, groeiend en controleerbaar profiel.

Werk:
- Hergebruik bestaande locatie-, sessie-, vangst-, temperatuur-, habitat-, wind-, positionerings- en evaluatiegegevens.
- Bouw of voltooi één centrale leer-/aggregatielaag (roadmap-kandidaat: `spotLearningEngine.ts`) alleen als de audit bevestigt dat die nog ontbreekt.
- Profielonderdelen: fysieke kenmerken; thermisch gedrag; soortactiviteit; habitat-/bewegingspatronen; tactische resultaten; bewijs- en datakwaliteit.
- Leer per combinatie van stek en doelsoort. Houd sessie-inspanning, hengeluren, methode, aas/voer, tijdvak, seizoen, nulvangsten en onbekende registraties uit elkaar.
- Gebruik alleen vergelijkbare sessies; voorkom dat een enkele vangst het profiel domineert.
- Laat persoonlijke gegevens geleidelijk meewegen met onzekerheidsmarges en terugval op de algemene biologische basis.
- Maak profielherkomst, aantallen en onzekerheid uitlegbaar.
- Bewaar historische voorspellingen als onveranderlijke snapshots; toekomstige sessies mogen oude voorspellingen niet beïnvloeden.

**Acceptatie:**
- Profieluitvoer is reproduceerbaar uit de beschikbare brongegevens.
- Testgevallen tonen correct gedrag bij weinig, ontbrekende, tegenstrijdige en voldoende rijke data.
- Chronologische validatie bewijst dat geen toekomstige gegevens worden gebruikt.
- Een persoonlijk profiel wordt alleen sterker waar bewijs dat rechtvaardigt; anders blijft de algemene basis leidend.

### Fase 4 — Praktisch VisCoach-plan en tactische positionering

**Doel:** bestaande analyse-engines consistent vertalen naar één uitvoerbaar advies vóór en tijdens de sessie.

Werk:
- Audit de volledige keten van `bankWindEngine.ts`, `rodPositioningEngine.ts`, `habitatMovementEngine.ts`, `prebaitEngine.ts`, prognose en coachservices tot aan de UI.
- Controleer specifiek waarom wind-/werprichtingadvies mogelijk alleen bij `strongWind` wordt getoond; windcontext moet ook bij normale en matige wind beschikbaar zijn wanneer relevant.
- Combineer vissoort, stek, starttijd, verwachte activiteit, waarschijnlijke viszone, wind, oeveroriëntatie, kijkrichting, werprichting, voer-/aasstrategie en onzekerheid.
- Geef geen exacte werprichting zonder voldoende geometrie: positie visser, oeveroriëntatie, watergrenzen en bereikbare zones.
- Geef bij ontbrekende context een bruikbare maar expliciet voorzichtige uitleg; verzin geen kompasrichting.
- Maak onderscheid tussen totale visactiviteit en de zone waar de vis waarschijnlijk aanwezig is.
- Tijdens de sessie: herbereken alleen bij relevante nieuwe omstandigheden/waarnemingen en leg vast welk advies op welk moment is gegeven.

**Acceptatie:**
- Advies is bruikbaar, soort- en stekspecifiek en herleidbaar tot engine-uitvoer.
- Windadvies wordt niet onnodig onderdrukt bij matige wind.
- Onvoldoende geometrie leidt niet tot een verzonnen werprichting.
- UI en adviesobject tonen dezelfde onderbouwing en onzekerheid.
- Regressietests dekken winddraaiing, oeveroriëntatie, ontbrekende geometrie en rustige wind.

### Fase 5 — Gesloten leercyclus en praktijkvalidatie

**Doel:** aantonen dat prognoses en coachadviezen door echte sessies toetsbaar worden en aantoonbaar verbeteren.

Werk:
- Koppel prognosesnapshots, gegeven adviezen, gekozen/uitgevoerde tactiek, sessie-inspanning, waarnemingen en resultaten.
- Maak onderscheid tussen doelsoortvangst, bevestigde nulvangst, andere soort en onbekende/onvolledige sessie.
- Evalueer zowel prognosekwaliteit als tactische advieswaarde; een vangst alleen bewijst niet dat het advies de oorzaak was.
- Gebruik chronologische backtests, geschikte kalibratiematen en steekproef-/onzekerheidsrapportage.
- Verzamel praktijkdata zonder gebruikersgegevens centraal te delen; lokale verwerking blijft de standaard.
- Verbeter alleen parameters waarvoor voldoende bewijs bestaat en registreer modelversies.

**Acceptatie:**
- Volledige keten vóór/tijdens/na sessie is traceerbaar.
- Geen datalek tussen train- en evaluatieperiode.
- Prognosekwaliteit en tactische waarde worden apart gerapporteerd.
- Elke geclaimde verbetering is reproduceerbaar en vergeleken met de vorige versie.

### Fase 6 — Afronding, administratie en releasecontrole

**Doel:** documentatie en werkelijke implementatiestatus lopen gelijk.

Werk:
- Werk `PROJECT_CONTEXT.md`, `VISCOACH_PRODUCT_ROADMAP.md` en `IMPLEMENTATION_PLAN_32_IMPROVEMENTS.md` bij na iedere relevante fase.
- Houd dit verbeterplan bij met status, PR/commit, tests, open punten en besluit.
- Verwijder verouderde of tegenstrijdige documentatie alleen na verwijzingscontrole.
- README is geen blocker; vervang de AI Studio-template pas wanneer de projectdocumentatie daar klaar voor is.
- Controleer gratis kernproduct, privacy, offline-first en backup/restore.

**Acceptatie:**
- Documentatie maakt onderscheid tussen ontworpen, geïmplementeerd, getest en praktijkgevalideerd.
- Alle fases hebben bewijs en resterende beperkingen.
- Release bevat geen ongecontroleerde benchmarkdata of regressie in gebruikersdata.

## 3. Verplichte werkwijze per wijziging

1. Lees de relevante projectcontext, roadmap en actuele code op `main`.
2. Formuleer het concrete probleem en de verwachte meetbare verbetering.
3. Controleer of een bestaande engine of component hergebruikt kan worden.
4. Voeg gerichte unit-, integratie- en regressietests toe.
5. Voer typecheck, relevante tests, volledige Quality Gate en productiebuild uit volgens de repositoryscripts.
6. Inspecteer de volledige diff op dataverlies, future leakage, ongefundeerde aannames, dubbele logica en documentatie-afwijkingen.
7. Werk dit plan en de projectadministratie bij met commit/PR, uitkomst en openstaande punten.
8. Markeer een onderdeel pas als voltooid wanneer bewijs beschikbaar is. Een code-implementatie is niet automatisch praktijkvalidatie.

## 4. Statusregister

| Fase | Status | Opmerking |
|---|---|---|
| 0. Baseline en audit | **In uitvoering** | De volledige lokale Quality Gate, inclusief tests, audits, typecheck en productiebuild, is op 16 november door de eigenaar uitgevoerd en geslaagd. De inhoudelijke blueprint/code/UI/test-matrix en repositorybrede verwijzingsaudit zijn nog niet afgetekend. De legacy v2-importfout en ontbrekende limietcontroles zijn bevestigd; zie `FASE0_OPTIMIZATION_AUDIT.md` §23–24. |
| 1. Dataveiligheid en benchmarkdata | Gepland | Benchmarkdata mag na afhankelijkhedenaudit worden verwijderd |
| 2. Biologische prognose | Gepland | Hoogste inhoudelijke prioriteit |
| 3. Lerend stekprofiel | Gepland | Bestaande engines en gegevens integreren |
| 4. Praktisch VisCoach-advies | Gepland | Wind-/werprichting en geometrie expliciet toetsen |
| 5. Gesloten leercyclus | Gepland | Praktijkvalidatie vereist |
| 6. Administratie en releasecontrole | Doorlopend | Documentatie bij elke fase bijwerken |

## 5. Fase 0 — auditlog en actuele voortgang (15 november 2026)

De uitgebreide read-only audit is gestart op actuele `main` commit `4831fd6d7a200467c29773c574be7090674eca29`. De bevindingen, bronpaden, voorlopige traceerbaarheidsmatrix en openstaande controles staan in [`FASE0_OPTIMIZATION_AUDIT.md`](FASE0_OPTIMIZATION_AUDIT.md).

Eerste bevestigde bevindingen:
- `src/db/db.ts` seedt bij normale database-initialisatie de vaste sessie `benchmark-session-20261019` en vier canonieke vangstrecords via `put()`. De records zijn in code als `isBenchmark: false` gemarkeerd; herkomst en referenties moeten eerst worden vastgesteld. Er is niets verwijderd.
- `src/data/historicalData.ts` vermeldt expliciet dat 5 locaties, 10 sessies en 16 vangsten uit een concrete gebruikersbackup van 26 oktober 2026 komen. Deze gegevens worden als echte gebruikersdata beschermd en mogen niet als benchmarkcleanup worden verwijderd. Wel moet worden onderzocht waarom persoonlijke data in het nieuwe-installatie seedpad zit.
- `src/services/prognosisEngine.ts` berekent de numerieke activiteitsindex momenteel op basis van thermische efficiëntie; wind, druk, seizoen, tijd/licht, bewolking en neerslag blijven context. Dit is een bewuste huidige beperking, geen bewijs dat die factoren biologisch irrelevant zijn.
- `src/services/sessionCoachService.ts` toont de wind-/werprichtingsectie alleen bij `strongWind`; `test-session-coach.ts` test expliciet dat de sectie bij zwakke wind ontbreekt. Dit is een concrete afwijking van de gewenste coachervaring voor latere fase 4.
- Bestaande soortprofielen, habitat-, wind-, positionerings-, voer-, evaluatie- en coachservices zijn aanwezig. Een centrale geïntegreerde stek-/soortleerlaag is nog niet aangetoond; de audit moet eerst bestaande aggregatie volledig volgen.
- Er zijn bij de controle geen openstaande PR's gevonden. Er zijn meerdere historische branches; `main` blijft de enige bron van waarheid.
- Quality Gate-runs #503–#511 op de documentatie-updates eindigden vrijwel direct als failure zonder zichtbare workflowstappen of beschikbare logs. Run #510 rapporteerde expliciet `runner_id=0`; een rerun van #503 bleef eveneens failure. De oorzaak is onbekend en lijkt vóór de eerste workflowstap te liggen. Er is dus geen geslaagde Quality Gate op de huidige auditbaseline. De oudere geslaagde Quality Gate op een eerdere commit geldt niet als bewijs voor deze baseline.

**Fase 0 blijft in uitvoering.** De eerste bevindingen zijn niet voldoende om fase 0 af te ronden of fase 1 te starten. Er is tijdens deze audit geen applicatiecode of gebruikersdatabase gewijzigd; alleen auditdocumentatie is toegevoegd/bijgewerkt.


### Vervolg fase-0-audit (15 november 2026)

De read-only audit is verder uitgebreid in [FASE0_OPTIMIZATION_AUDIT.md](FASE0_OPTIMIZATION_AUDIT.md). De actuele bevindingen zijn:
- De repository is private; een uitgeputte GitHub Actions-limiet is plausibel maar niet bewezen. De Quality Gate is statisch geïnventariseerd; typecheck, tests en build zijn nog niet lokaal uitgevoerd.
- De backupfixture bevat een beschermde referentiesessie op 19 oktober. De hard-coded sessie in db.ts lijkt inhoudelijk verwant, maar verschilt op techniek, weerdata, ID en granulariteit van vangstregels. Niet verwijderen of automatisch herschrijven.
- Backupnormalisatie zet de legacy-referentiesessie expliciet op isBenchmark: false; restore kan daarnaast een tweede ingebouwde representatie toevoegen. Merge-import kan bij overgeslagen benchmarks alsnog gekoppelde vangsten importeren. Prognose-, evaluatie-, sessie- en statistiekfilters vertrouwen grotendeels op benchmarkvlaggen.
- De algemene statistiekengine telt een legacyvangst met onbekend aantal (count: 0, countKnown: false) als één vis door count || 1; de Poisson-prognoseroute sluit diezelfde onbekende aantallen wel uit.
- De centrale activiteitsindex gebruikt uitsluitend de soortspecifieke thermische efficiëntie als numerieke factor. Wind, druk, seizoen, tijd/licht, bewolking en neerslag blijven context. Het research register bevat zeven registraties, alle zonder directe modelgoedkeuring; de runtime-goedkeuringspoort is niet aantoonbaar aan de actieve temperatuurprofielen gekoppeld.
- De sessie-editor vult standaard Karper, twee hengels, techniek en aas/voer in. De locatie-editor vult ontbrekende GPS aan met vaste Culemborg-coördinaten. Deze defaults kunnen onbevestigde gegevens als echte invoer laten gelden.
- Hengeluren worden berekend en getoond, maar zijn niet aantoonbaar opgenomen in de persoonlijke vangkansberekening. Oeveroriëntatie staat in het type, maar is niet beschikbaar in de gecontroleerde standaard locatie-editor.

**Besluit:** fase 0 blijft open. Geen app-code, IndexedDB, backup of vangstregistratie is gewijzigd. Fase 1 mag pas starten na afronding van de provenance-/import-/restoreketen en de resterende blueprint-, datadictionary- en testdekking-audit.


### Besluit gebruiker: ingebouwde benchmark verwijderen (15 november 2026)
De gebruiker heeft expliciet bevestigd dat de oude ingebouwde benchmarkavond uit de beginfase volledig mag verdwijnen. In fase 1 verwijderen we de ingebouwde benchmarklocatie, sessie, vangsten en alle bijbehorende productie-seed-, restore-, UI-, statistiek-, prognose- en evaluatieafhankelijkheden. De oorspronkelijke backupfixture met de historische referentiesessie en alle echte gebruikersdata blijven behouden. Restore mag geen demo-data toevoegen; merge-import mag geen verweesde vangsten creëren. Zie de implementatievoorwaarden in `FASE0_OPTIMIZATION_AUDIT.md`. Nog geen app-code of database gewijzigd.

Aanvullende fase-0-waarschuwing: `db.ts` seedt ook 5 locaties, 10 sessies en 16 vangsten uit een concrete persoonlijke backup van 26 oktober 2026 op nieuwe installaties. Dit is geen benchmark en mag niet worden verwijderd als onderdeel van benchmarkopschoning. Het vormt een afzonderlijk provenance-/privacyvraagstuk: nieuwe installaties zouden idealiter leeg starten of voorbeelddata expliciet opt-in maken, terwijl bestaande gebruikersdata behouden blijft. Zie auditsectie 14.


## Aanvullend eigenaarbesluit — schone historische vangstdataset (15 november 2026)

De eigenaar heeft expliciet toestemming gegeven om **alle reeds aanwezige historische vangstregistraties** te verwijderen, zodat Vislogboek vanaf de reset met een schone vangstdataset verdergaat in 2026. Deze toestemming is ruimer dan het eerdere besluit over alleen de ingebouwde benchmarkavond en omvat ook de historische vangstregels die uit de persoonlijke backup van 26 oktober 2026 in `historicalData.ts` zijn overgenomen.

Uitvoeringsgrenzen:
- Verwijdering mag pas plaatsvinden nadat alle productie-seed-, restore-, import-, statistiek-, prognose-, evaluatie-, UI- en testafhankelijkheden zijn geïnventariseerd.
- Nieuwe installaties mogen geen oude historische vangstdata automatisch seedden.
- Backup-restore mag uitsluitend de inhoud van de gekozen backup terugzetten; geen historische/demo-vangsten automatisch injecteren.
- Bestaande vangstregistraties van vóór de reset mogen in een expliciete, eenmalige migratie worden verwijderd. Maak de migratie idempotent, transactioneel waar mogelijk en testbaar met aantallen/IDs vóór en na.
- Vangsten die de gebruiker ná de schone start zelf registreert, mogen nooit door deze resetlogica worden verwijderd.
- Behoud overige gegevens (zoals locaties, instellingen, sessies, prognosesnapshots en waarnemingen) tenzij een aparte afhankelijkheidsanalyse aantoont dat een beperkte aanpassing noodzakelijk is. De huidige toestemming noemt expliciet historische vangsten; breid dit niet stilzwijgend uit naar alle sessies of alle lokale data.
- Test lege installatie, bestaande database, herhaalde migratie, backup-export/import en behoud van nieuwe vangsten.
- Rapporteer exact welke categorieën/IDs verwijderd worden en welke bewust behouden blijven.

**Open afbakening vóór destructieve implementatie:** bevestig of historische sessies zonder vangsten ook verwijderd mogen worden, of dat deze als lege sessiehistorie behouden moeten blijven. Tot die bevestiging blijven sessies behouden. Er is met dit besluit nog geen code of lokale database gewijzigd.


## Verplichte GitHub-werkwijze — altijd toepassen

- Bundel alle aanpassingen die bij één opdracht/werkeenheid horen in **één enkele Git-commit**. Sla nooit bestanden één voor één op via afzonderlijke commits.
- Gebruik standaard de commit-message-suffix **`[skip ci]`**, zodat documentatie- en andere wijzigingen niet onbedoeld GitHub Actions starten.
- Laat `[skip ci]` uitsluitend weg wanneer de gebruiker expliciet vraagt om de GitHub Action(s) te laten draaien.
- Als de gebruikte GitHub-interface geen multi-file commit in één keer ondersteunt, gebruik dan Git Trees + één commit (of een gelijkwaardige atomische Git-operatie). Gebruik niet als workaround meerdere Contents API-writes.
- Controleer vóór het committen de volledige verzamelde diff en de actuele HEAD van `main`; commit alleen de bedoelde bestanden.
- Controleer na het committen dat precies één commit is aangemaakt en dat alle bedoelde bestanden daarin zitten. Rapporteer commit-SHA, gewijzigde bestanden en of CI bewust is overgeslagen.
- Deze regel geldt voor documentatie, code, tests, configuratie, workflows en alle andere repositorybestanden. Alleen een expliciete afwijkende opdracht van de gebruiker kan hiervan afwijken.


## Aanvullend eigenaarbesluit — volledige sessie- en vangstreset (15 november 2026)

De eigenaar heeft bevestigd dat **alle historische sessies óók verwijderd mogen worden wanneer er geen vangsten aan gekoppeld zijn**. Dit besluit breidt de eerdere toestemming uit tot een volledige reset van de historische sessie- en vangstdataset.

Uitvoeringsscope:
- Verwijder bij de eenmalige schone-startmigratie alle sessies en alle vangstregistraties die vóór de migratie in de database aanwezig zijn.
- Verwijder sessiegebonden hengeldetails en coachadviezen; verwijder waarnemingen alleen wanneer ze expliciet aan een verwijderde sessie gekoppeld zijn.
- Bewaar locaties, instellingen, weercache en prognosemomentopnamen. Prognoses die aan verwijderde sessies gekoppeld waren moeten worden ontkoppeld en hun achteraf bekende sessie-uitkomst verliezen, zodat ze niet langer als geëvalueerde sessies tellen.
- Bewaar geplande sessies, maar verwijder de koppeling naar een verwijderde gestarte sessie.
- Nieuwe installaties mogen geen historische locatie-, sessie- of vangstgegevens automatisch seeden.
- Een expliciet door de gebruiker gekozen backup mag de inhoud ervan herstellen; de app mag daar nooit automatisch extra benchmark- of historische records aan toevoegen.
- Nieuwe sessies en vangsten die na de eenmalige migratie worden ingevoerd, mogen bij volgende app-starts of upgrades niet worden verwijderd.
- De migratie moet via een versie-upgrade precies één keer lopen, atomair en idempotent zijn, en een regressietest hebben voor zowel oude data als nieuw ingevoerde data.

**Status na implementatievoorstel:** de productiecode bevat nu de v4→v5 clean-startmigratie, verwijdert automatische historische seeding en injecteert geen benchmarkdata meer bij restore. De regressietest is toegevoegd maar moet nog lokaal worden uitgevoerd; totdat die test en de volledige build/lint zijn uitgevoerd, geldt dit als geïmplementeerd in code maar nog niet software-getest.


## 6. Voortgangsupdate — 16 november 2026

De uitgebreide fase-0-audit is voortgezet vanaf de actuele `main`. De huidige codebasis staat op commit `5dbf3b4e8afcd67f5d879f2944c6f60eea71c55f` vóór de documentatie-/CI-update.

Afgerond sinds de eerste hercontrole:
- Verouderde afhankelijkheden van historische benchmarkconstanten zijn uit `test-core-logic.ts` en `test-forward-validation.ts` gehaald; tests gebruiken eigen synthetische fixtures.
- De ongebruikte historische generator `scripts/generate-historical-data.ts` is verwijderd nadat geen caller of package-script was gevonden.
- De eigenaar heeft `bun run lint` lokaal uitgevoerd; TypeScript typecheck slaagde zonder gerapporteerde fouten.

Nu toegevoegd aan de Quality Gate:
- Uitvoering van het reeds bestaande package-script `bun run test:clean-start-migration`, zodat de v4→v5 schone-startmigratie niet alleen als los testsbestand bestaat maar ook door CI wordt gecontroleerd.

Nog niet afgerond:
- GitHub Actions Quality Gate-run #529 is automatisch gestart maar stopte vóór de eerste stap (nul uitgevoerde stappen, geen logs); dit is geen testresultaat. De deterministische clean-startmigratietest moet daarom lokaal worden uitgevoerd zolang de runner niet beschikbaar blijkt.
- `test-core-logic.ts` blijft een afzonderlijke lokale controle zolang live Open-Meteo-aanroepen niet zijn gemockt.
- De complete blueprint → code → UI → test-matrix, de repositorybrede verwijzingsaudit en de backup-importregressies moeten nog worden afgetekend.
- Fase 1 is nog niet gestart; softwarematige en praktijkvalidatie worden afzonderlijk bijgehouden.

De eerdere paragrafen in dit document beschrijven besluiten en tussenstanden op hun oorspronkelijke datum. Bij statusverschillen geldt deze voortgangsupdate samen met de actuele code en de meest recente sectie van `FASE0_OPTIMIZATION_AUDIT.md`.


### CI-uitkomst 16 november 2026

Quality Gate-run #529 op commit `26576d0` stopte vóór de eerste workflowstap. Geen enkele test, audit of build is uitgevoerd; de job bevat nul stappen en er zijn geen logs beschikbaar. De oorzaak is onbekend en wordt niet als applicatiefout aangemerkt. De lokale typecheck blijft de enige bevestigde controle naast de eerder vastgelegde testresultaten op oudere commits.


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

Zie `FASE0_OPTIMIZATION_AUDIT.md` §29. Audit §29 brengt de biologische prognosefactoren in kaart. De numerieke activiteitsscore gebruikt uitsluitend de soortspecifieke thermische efficiëntie van gemeten/geschatte watertemperatuur. Druk, wind, seizoen, dagdeel/schemering, bewolking en neerslag zijn context zonder scorebijdrage. Wind, diepte, watertype, lokale structuren en directe waarnemingen werken wel door in aparte habitat-, oeverwind- en positioneringsanalyses. Persoonlijke sessies leveren een afzonderlijke vangstkans; voorvoer en techniek zijn tactische adviezen, geen biologische scorefactoren. De thermische schatting wordt mede gevoed door luchttemperatuur, zonnestraling, bewolking, windmenging, diepte en historische ontwikkeling.

De audit vindt geen volledige factorcatalogus, geen aantoonbare gestructureerde keten voor onder meer opgeloste zuurstof, waterhelderheid, stroomsnelheid, waterstand, prooiaanbod of levensstadium, en geen volledige soort-/seizoen-/interactietestmatrix. Bestaande tests valideren vooral softwaregedrag en synthetische scenario's, niet de biologische juistheid van de score. Fase 2 vereist daarom waarschijnlijk inhoudelijke uitbreiding, maar er worden nog geen factoren of gewichten gekozen voordat hypothesen, bronnen, databeschikbaarheid en valideerbaarheid zijn vastgesteld. Geen code gewijzigd.


## Fase-0-vervolg — validatie PDF watertemperatuurmodel (16 november 2026)

Zie `FASE0_OPTIMIZATION_AUDIT.md` §30. De PDF `Watertemperatuur_Schatten_en_Voorspellen.pdf` is vergeleken met de huidige waterthermische engine (audit §30). De engine heeft al lokale meetankers, historische profielen, uurlijkse weerdata, instraling en onzekerheidsmetadata. De PDF voegt vooral een continue diepte-/windsnelheidsafhankelijke relaxatietijdconstante als kandidaat toe. Rechtstreekse overname is niet verantwoord: de PDF-formule verwacht wind in m/s terwijl de app km/u gebruikt, de tijdconstante moet bij uurlijkse stappen naar uren worden omgerekend en de PDF is intern inconsistent bij windstilte (vuistregel 8,75 dagen bij 2,5 m versus 24 dagen uit de dynamische formule). De huidige synthetische tests gebruiken een vaste 65-uursreferentie en bewijzen geen praktijknauwkeurigheid. Aanbeveling: experimentele kandidaatvarianten naast de huidige engine testen op identieke lokale meetankers en chronologische onafhankelijke meetreeksen, met MAE/RMSE/bias per horizon, diepte, wind, seizoen en watertype. Geen code gewijzigd.

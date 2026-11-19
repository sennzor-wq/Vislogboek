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
| 0. Baseline en audit | **Afgerond en geaccepteerd (16-11-2026)** | Read-only audit formeel geaccepteerd; overdracht vastgelegd in `FASE0_OPTIMIZATION_AUDIT.md` §32 en de faseovergangsregistratie. Open bevindingen zijn uitvoerpunten, geen reden om fase 0 opnieuw te openen. |
| 1. Dataveiligheid en benchmarkdata | **Afgerond en geaccepteerd (16-11-2026)** | Backup/restore- en clean-startbescherming geïmplementeerd; GitHub Quality Gate geslaagd op de gevalideerde werkstroom; legacy-vertakking opgeschoond; app-level export-/restorepraktijktest door eigenaar succesvol uitgevoerd. Generieke `isBenchmark`-compatibiliteit blijft behouden. |
| 2. Biologische prognose | **Gestart — audit en factorinventarisatie** | Eerst bestaande prognose-engine, soortprofielen, blueprintfactoren, databronnen en validatiepaden in kaart brengen; nog geen modelgewichten of enginewijzigingen. |
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


## Watertemperatuurdata — beschikbaarheid en validatie — 16 november 2026

Audit §31 bevestigt dat Vislogboek prognosesnapshots kan bewaren met de voorspelde watertemperatuur, exacte uurlijkse weersinvoer en later gemeten temperatuur inclusief meettijdstip, herkomst en methode. De daadwerkelijke gebruikersdata staat echter in lokale browser-IndexedDB en kan niet vanuit GitHub worden geteld. De sessiehistorie heeft bovendien een timestamp-probleem: de historische verzamelaar gebruikt `session.startTime` in plaats van `waterTemperatureMeasuredAt`. Eerst is een read-only telling van een lokale JSON-backup nodig; deel de backup niet op GitHub. Pas daarna beoordelen we of voldoende onafhankelijke meetparen beschikbaar zijn voor empirische validatie. Geen code gewijzigd.


## Formele faseovergang — 16 november 2026

**Fase 0: AFGEROND. Fase 1: GESTART.** De producteigenaar heeft de uitgebreide read-only audit in `FASE0_OPTIMIZATION_AUDIT.md` §§1–31 geaccepteerd. De audit is daarmee als fase afgerond; de geregistreerde bevindingen blijven openstaande uitvoerpunten en worden niet als opgelost beschouwd. Praktijkvalidatie is niet geclaimd.

### Start fase 1 — dataveiligheid en obsolete benchmarkdata

Fase 1 wordt uitgevoerd volgens de bestaande scope en acceptatiecriteria in dit plan. De eerste werkstroom is:
1. Afhankelijkheden van vaste benchmark-/demo-initialisatie en historische uitzonderingen volledig in kaart brengen.
2. Obsolete vaste benchmarkdata en uitsluitend daaraan gekoppelde productieafhankelijkheden verwijderen; generieke benchmarkfilters voor geïsoleerde testfixtures alleen behouden waar nodig.
3. Backup-/restore-/merge-importrelaties veilig maken, met bijzondere aandacht voor prognosesnapshots met een ontbrekende of overgeslagen `linkedSessionId`.
4. Regressietests toevoegen voor migratie, lege/bestaande database, herhaalde initialisatie, backup-import en parent-child-integriteit.
5. Controleren dat nieuwe gebruikerssessies en vangsten na de clean-startmigratie behouden blijven.

**Niet onderhandelbaar:** de expliciet goedgekeurde eenmalige clean-start blijft intact. Oude sessies en vangsten worden niet teruggebracht; nieuwe records worden niet verwijderd; locaties, instellingen en overige gegevens worden niet buiten de goedgekeurde scope opgeschoond. Geen destructieve wijziging zonder voorafgaande afhankelijkhedenaudit en regressiedekking.

**Voortgang bij start:** uitsluitend documentatie bijgewerkt. Fase-1-codewijzigingen en tests zijn nog niet uitgevoerd. Issue #49 blijft open tot alle fasen en acceptatiecriteria zijn afgerond.


## Fase-1-afhankelijkhedenaudit — 16 november 2026

**Auditbasis:** actuele GitHub-branch `main`, commit `0334b43c006bc172f5ba8d3afa7b800c8302a1f0`. Dit is een read-only audit; in deze werkstroom is geen applicatiecode gewijzigd en geen GitHub Actions-run gestart.

### 1. Database-initialisatie en clean start

- `initializeDatabaseOnce()` initialiseert uitsluitend `user_settings`. Er worden geen locaties, sessies, vangsten of benchmarkrecords gezaaid.
- De comments boven de initialisatie verwijzen nog naar een altijd aanwezige beschermde benchmark en historische seeding. Die comments zijn verouderd en moeten met de feitelijke implementatie in overeenstemming worden gebracht.
- Databaseversie 5 bevat de expliciet goedgekeurde eenmalige clean-startmigratie. Die wist de vóór de upgrade bestaande sessies, vangsten, sessiehengeldetails en coachadviezen; verwijdert sessiegekoppelde aanwezigheidswaarnemingen; ontkoppelt betrokken prognosesnapshots en wist hun evaluatie-uitkomsten; en maakt verwijzingen vanuit geplande sessies naar verwijderde sessies leeg.
- Gewone locaties, instellingen, weercache, losse locatie-waarnemingen, geplande sessies en prognosesnapshots blijven behouden. De technische locatie-ID `benchmark-location-lokkershoek` wordt alleen verwijderd wanneer geen gepland plan ernaar verwijst. Er vindt geen brede locatiereset plaats.
- `test-clean-start-migration.ts` dekt een v4-database, verwijdering van oude sessies/vangsten en afhankelijke records, behoud van gewone locaties en losse waarnemingen, ontkoppeling van snapshots/plannen, een lege nieuwe installatie en behoud van nieuw aangemaakte sessies/vangsten na herhaald initialiseren.

### 2. Benchmark-/demo-afhankelijkheden

- In de actuele productie-initialisatie is geen vaste benchmark- of demo-seed aangetroffen. De historische generator en het oude historische datamodulepad staan niet in de actuele repositoryboom.
- Generieke compatibiliteit met `isBenchmark` bestaat nog in types, prognosehistorie, evaluatie, sessie-/locatie-/snapshotweergave, veilige verwijdering en backupnormalisatie/-merge. Deze code maakt op zichzelf geen benchmarkrecords aan.
- De generieke uitsluiting van benchmarkrecords uit vergelijkbare sessies en onafhankelijke evaluatie kan voorlopig blijven voor oude/importeerde records en geïsoleerde fixtures. Er is geen reden om deze bescherming breed te verwijderen.
- Er is een legacy-normalisatievariabele `isLokkershoek19` die momenteel hard op `false` staat; dit is een dode compatibiliteitsvertakking. De geëxporteerde constante `LOKKERSHOEK_PIER_ID` en de technische benchmarklocatie-ID zijn afzonderlijke identifiers; verwijder geen echte gebruikerslocatie op basis van de naam Lokkershoek.

### 3. Backup/export en importvalidatie

- `collectBackupData()` exporteert de persistente tabellen, inclusief geplande sessies en coachadvieshistorie.
- `normalizeRawBackup()` vult voor oudere formaten standaardarrays voor onder meer weercache, snapshots, waarnemingen en hengeldetails, maar niet voor `plannedSessions` en `coachAdviceRecords`. `inspectImportFile()` eist beide arrays. Daardoor kan een oudere backup die deze tabellen nooit kende na normalisatie alsnog worden afgewezen.
- `validateBackupPayloadLimits()` neemt `plannedSessions` en `coachAdviceRecords` niet mee in de per-collectiegrenzen, totale recordtelling en recursieve veld-/nestingscontrole. De globale bestandsgroottecontrole blijft wel actief.
- De importpreview berekent `hasBenchmark`, maar de UI toont deze waarschuwing niet. De preview toont ook geen expliciete waarschuwing dat een backup met een exportdatum van vóór de clean start oude sessies/vangsten kan bevatten.

### 4. Merge-import: bevestigde relationele fout

- `mergeImportData()` slaat benchmarklocaties en benchmarksessies over. Vangsten en de meeste andere afhankelijke tabellen worden alleen toegevoegd als de vereiste parent in de doel-DB bestaat.
- Prognosesnapshots worden echter uitsluitend op snapshot-ID gecontroleerd en daarna onvoorwaardelijk toegevoegd. Een snapshot die in het backupbestand geldig naar een benchmarksessie of benchmarklocatie verwijst, kan daardoor alsnog worden geïmporteerd nadat die parent tijdens de merge is overgeslagen. Dat kan een verweesde `linkedSessionId` of locatieverwijzing opleveren.
- De huidige importvalidatie controleert relaties binnen het backupbestand vóór de merge, maar test niet de relationele integriteit ná de benchmarkfilters. De bestaande backup-roundtriptest bevat geen scenario waarin een parent tijdens merge wordt overgeslagen en de child toch wordt ingevoerd.
- Geplande sessies controleren of de locatie in de doel-DB bestaat en maken een ontbrekende `startedSessionId` leeg. Coachadviezen controleren beide parentrecords. Dit patroon moet consequent worden toegepast op snapshots en eventuele snapshotverwijzingen vanuit plannen.

### 5. Restore-import en clean-startbescherming

- `restoreBackupData()` wist alle tabellen en schrijft daarna de gevalideerde backupcollecties volledig terug, inclusief benchmarkrecords. De UI voert vooraf `inspectImportFile()` uit, maar die validatie staat benchmarkrecords toe; de restore zelf past geen benchmarkfilter toe.
- Daardoor kan een oude backup via **Volledig Vervangen** historische of benchmark-sessies/vangsten opnieuw in de database brengen. De merge-route sluit benchmarklocaties en -sessies wel uit, maar de restore-route niet.
- Alleen filteren op `isBenchmark` is onvoldoende voor de clean-startafspraak: historische records uit oudere persoonlijke backups kunnen `isBenchmark: false` of geen vlag hebben. De import moet daarom een expliciet, controleerbaar clean-start-/backupgeneratiecontract krijgen. Ambigue oude backups mogen niet stilzwijgend als post-clean-start worden behandeld.
- Ontwerpvoorstel voor de eerstvolgende codewerkstroom: voeg een expliciete clean-startgeneratie-/migratiemarkering toe aan nieuwe exports; bepaal een veilige compatibiliteitsregel voor backups zonder die markering; laat merge en restore dezelfde policy gebruiken; toon de importpreview de status en aantallen van uitgesloten records; en blokkeer een volledige vervanging wanneer de herkomst niet veilig kan worden vastgesteld. De precieze compatibiliteitsregel moet voorkomen dat nieuwe records die ná de migratie zijn aangemaakt verloren gaan.

### 6. Testdekking en vervolg

- `test-clean-start-migration.ts` dekt de migratie en behoud van nieuwe records.
- `test-backup-roundtrip.ts` dekt volledige export/restore, merge-idempotentie en verschillende ongeldige parentrelaties binnen een backupbestand.
- `test-backup-import.ts` test legacy-normalisatie en een handmatige merge-simulatie; het voert niet de volledige `inspectImportFile()` → `mergeImportData()`-keten uit.
- Ontbrekende regressies: legacy-normalisatie met ontbrekende optionele tabellen; payloadlimieten voor alle tabellen; benchmarkparent die tijdens merge wordt overgeslagen; snapshot-/planrelaties na merge; restore van benchmarkdata; en backup zonder aantoonbare post-clean-startmarkering.
- De volgende codewerkstroom wordt pas gestart nadat de backupgeneratie-/compatibiliteitspolicy is vastgelegd. Daarna worden de normalisatie-/limietfouten en relationele merge/restore-fouten samen met gerichte regressietests in één werkpakket opgelost.

**Status:** afhankelijkhedenaudit grotendeels afgerond; concrete import-/restore-risico's bevestigd. Geen code gewijzigd, geen gebruikersdata gewijzigd en geen Actions-run gestart.


### Fase 1 — backup/clean-startbeleid vastgelegd en geïmplementeerd (16 november 2026)

- Nieuwe exports krijgen `cleanStartVersion: 1`; v5-backups gelden eveneens als post-clean-start omdat database v5 de eenmalige clean-startmigratie uitvoert.
- Backups van v1-v4 worden niet geblokkeerd: instellingen, locaties, weercache en zelfstandige gegevens blijven herstelbaar, maar historische sessies en vangsten worden niet teruggezet of samengevoegd. Sessiegebonden details worden overgeslagen; snapshots en plannen worden veilig ontkoppeld.
- De importpreview meldt de legacy-status en aantallen sessies/vangsten die bewust worden overgeslagen.
- Merge controleert na filtering ook parentrelaties voor snapshots en geplande sessies. Payloadlimieten omvatten nu alle persistente collecties.
- Nieuwe post-clean-startbackups blijven volledig herstelbaar, inclusief nieuw ingevoerde sessies en vangsten. Restore blijft beschikbaar; geen algemene blokkade.
- Gerichte regressietest toegevoegd. Tests/build moeten nog worden uitgevoerd; geen Actions-run gestart.


### Fase 1 — backup/restore-werkstroom softwarematig gevalideerd (16 november 2026)

**Uitgevoerd op `main`:**
- Commit `67c8a18391a7e29fbb22c438516c583e4ca94c2f` (`fix: protect clean-start data during backup restore [skip ci]`) implementeert het expliciete clean-startcontract voor backup-export, restore en merge.
- Nieuwe exports schrijven `cleanStartVersion: 1`; bestaande v5-backups gelden als post-clean-start. Legacy v1-v4-backups blijven bruikbaar voor zelfstandige gegevens, maar brengen oude sessies/vangsten en sessiegebonden afhankelijke gegevens niet terug.
- Importpreview toont de legacy-status en aantallen overgeslagen sessies/vangsten.
- Merge controleert na filtering de aanwezigheid van parentrecords voor snapshots en geplande sessies; payloadlimieten omvatten alle persistente collecties.
- Regressies voor legacy-restore en post-clean-start roundtrip zijn toegevoegd.
- Commit `0bf6656407e45aa5f02f81c9fa7e91593862ac99` (`ci: enable manual quality gate runs`) maakt handmatige Quality Gate-runs mogelijk.

**Validatiebewijs:** GitHub Actions Quality Gate-run [#43886994227](https://github.com/sennzor-wq/Vislogboek/actions/runs/43886994227) is op commit `0bf6656407e45aa5f02f81c9fa7e91593862ac99` volledig afgerond met conclusie **success**. De dependency-audits, typecheck, regressie-/integratietests, clean-startmigratie, backupimport-/roundtriptests, productiebuild en controle op private artefacten zijn geslaagd. Dit is softwarematige validatie; de app-level praktijktest van backup exporteren en terugzetten is nog niet uitgevoerd en wordt niet als afgerond geclaimd.

**Status:** deze backup/restore-werkstroom is geïmplementeerd en softwarematig gevalideerd. Fase 1 als geheel blijft open.

**Volgende werkzaamheden fase 1:**
1. De resterende hard-coded benchmark-/demo-verwijzingen en verouderde database-initialisatiecomments opnieuw controleren op actuele `main`; alleen aantoonbaar dode code verwijderen.
2. De resterende merge-/restore-relaties en veilige verwijderpaden nalopen tegen de acceptatiecriteria; geen echte gebruikerslocaties of nieuwe sessies/vangsten verwijderen.
3. De fase-1-diff en tests als geheel reviewen en daarna de app-level backup/restore-praktijktest als afzonderlijke gebruikerscontrole registreren.
4. Pas na volledige fase-1-acceptatie fase 2 starten: de bestaande biologische prognose-engine en factorcatalogus onderzoeken, zonder nu al arbitraire gewichten toe te voegen.


### Fase 1 — verwijderen van verouderde initialisatieclaims en dode legacy-vertakking (16 november 2026)

- In `src/db/db.ts` zijn comments bijgewerkt: de initializer richt alleen lokale database-/standaardinstellingen in; er is geen beschermde benchmark of historische seeding in het normale initialisatiepad.
- In `src/services/backupService.ts` is de hard-coded `isLokkershoek19 = false`-vertakking verwijderd. De legacy-import gebruikt nu rechtstreeks de bestaande `spot_id` en `spot_name`/locatienaam. Omdat de conditie altijd false was, verandert dit geen importuitkomst en wordt geen locatie-ID herschreven.
- Generieke `isBenchmark`-ondersteuning en bescherming van records met die vlag blijven bewust behouden.
- De volledige GitHub Quality Gate wordt op deze bijgewerkte `main`-versie uitgevoerd; tot de uitslag beschikbaar is, blijft deze codewijziging in validatie.

**Volgende:** na de Quality Gate de resterende fase-1-acceptatiepunten nalopen, met speciale aandacht voor parent-child-relaties in merge/restore en veilige verwijdering. Daarna fase 1 formeel beoordelen.

### Faseovergang 1 → 2 — 16 november 2026

**Fase 1 is afgerond en door de producteigenaar geaccepteerd.** De app-level praktijktest is succesvol uitgevoerd: de eigenaar heeft de app geopend, een sessie aangemaakt, een backup geëxporteerd en deze backup teruggezet. De gebruiker bevestigt dat de volledige test werkt.

De fase-1-acceptatie is gebaseerd op:
- Clean-startgrens en legacy-backupbeleid: oude pre-clean-start sessies/vangsten worden niet ongemerkt teruggebracht; post-clean-startregistraties blijven herstelbaar.
- Importpreview, payloadlimieten en relationele merge-/restorecontroles zijn geïmplementeerd.
- Generieke `isBenchmark`-compatibiliteit en veilige verwijderbescherming blijven behouden.
- Database-initialisatiecomments zijn gecorrigeerd en de dode `isLokkershoek19 = false`-vertakking is verwijderd.
- GitHub Actions Quality Gate-run [#43886994227](https://github.com/sennzor-wq/Vislogboek/actions/runs/43886994227) slaagde op de backup/restore-werkstroomcommit. De latere beperkte opschoning is apart vastgelegd; de app-level praktijktest is door de eigenaar bevestigd.

**Fase 2 is gestart.** De eerste stap is een read-only inventarisatie van de huidige prognose-engine en alle relevante soortprofielen, factoren, brondata, onzekerheidsbehandeling en chronologische evaluatie. Bestaande engines worden hergebruikt; er worden nog geen arbitraire gewichten of concurrerende engine toegevoegd.


### Fase 2 — eerste code-audit (16 november 2026)

De eerste read-only inspectie is vastgelegd in [FASE2_PROGNOSE_AUDIT.md](FASE2_PROGNOSE_AUDIT.md). Bevestigd: de huidige activiteitsindex wordt uitsluitend numeriek gestuurd door de soortspecifieke thermische respons; wind, luchtdruk, seizoen, tijdstip/licht, bewolking en neerslag zijn uitlegbare context zonder scorebijdrage. De bestaande habitatbewegingsengine gebruikt deze context juist voor ruimtelijke/habitatinschatting. De soortprofielen bevatten voorlopige parameters en heuristische velden; hun bronnen bewijzen niet automatisch de numerieke modelwaarden. Volgende stap is de volledige factor → code → UI → data → testmatrix en controle van de scoreketen wanneer watertemperatuur ontbreekt. Er zijn nog geen modelwijzigingen uitgevoerd.


### Fase 2 — ontwerpdoel en auditbesluit (16 november 2026)

De producteigenaar heeft het doelbeeld bevestigd: een soortspecifiek biologisch model dat activiteit, voedselzoekgedrag en habitat-/locatiekeuze afzonderlijk beoordeelt en die uitkomsten uitlegbaar samenbrengt. De zeven factorfamilies en architectuur zijn vastgelegd in [FASE2_PROGNOSE_AUDIT.md §5](FASE2_PROGNOSE_AUDIT.md). Voorbeeldpercentages zijn illustratief, geen implementatiegewichten. Geen universele soortweging, geen arbitraire bonussen en geen vangstkans afleiden uit alleen activiteit.

**Status blijft:** fase 2 — audit en factorinventarisatie. Volgende werkstap: volledige code → UI → snapshot → testmatrix, bron-/parameterbeoordeling per soort en inventarisatie van echte evaluatiedata. Pas na die audit volgt een toetsbaar kandidaatmodel met baseline; daarna pas implementatie.


### Fase 2 — tweede auditronde (16 november 2026)

De tweede read-only ronde heeft de gegevensstroom deels gevolgd van PrognosisView via `calculateDayPrognosis()` naar snapshots en evaluatie. De UI en snapshotopslag respecteren de status 'niet beschikbaar' bij ontbrekende watertemperatuur. De persoonlijke Poisson-vangkans gebruikt eigen sessieduur en vangsttempo, met een bestaande beperkte modulatie uit de dagactiviteitsscore. Een tekstuele inconsistentie over luchttemperatuur als fallback is gevonden; gerichte correctie en regressietest zijn nog open. Bestaande tests dekken thermische en habitat-/windscenario's, maar zijn geen praktijkvalidatie. Details en eerste factor-/datamatrix: [FASE2_PROGNOSE_AUDIT.md §6](FASE2_PROGNOSE_AUDIT.md).

**Volgende:** bron-/parameterbeoordeling voor alle tien profielvermeldingen, volledige habitat-/wind-/positioneringsketen en gerichte correctie van de temperatuurfallbacktekst. Geen gewichten of modelgedrag gewijzigd.


### Fase 2 — eerste literatuurverkenning (16 november 2026)

De eerste literatuurverkenning per soort staat in [FASE2_PROGNOSE_AUDIT.md §7](FASE2_PROGNOSE_AUDIT.md). De bronnen ondersteunen soortspecifieke verschillen in voedingsritme, beweging, habitat en seizoensgedrag, maar meten verschillende uitkomsten en populaties. Ze valideren niet automatisch de bestaande numerieke thermische, wind-, druk- of seizoensparameters. Het generieke profiel `Overig` moet als fallback worden behandeld, niet als echte soort.

**Volgende:** de bestaande profielwaarden en bronverwijzingen één voor één beoordelen, bewijsstatus toevoegen en de ontbrekende directe voedings-/veldbronnen aanvullen. Geen code of gewichten gewijzigd.


### Fase 2 — parameterinventaris bestaande profielen (16 november 2026)

De actuele thermische optimum-/breedtewaarden, code-optimum bereiken en voorkeursvakken voor negen soorten plus de fallback `Overig` zijn vastgelegd in [FASE2_PROGNOSE_AUDIT.md §8](FASE2_PROGNOSE_AUDIT.md). Dit zijn huidige codewaarden, geen gevalideerde biologische parameters. De bron-/responsvariabele moet per parameter worden vastgesteld voordat deze als modelinput kan worden vertrouwd. Geen waarden gewijzigd.


De illustratieve karperverdeling 30/17/15/12/8/8/10 procent is expliciet in de audit opgenomen als denkkader, niet als gevalideerde parameter of lineaire implementatie. Zie `FASE2_PROGNOSE_AUDIT.md` §5.2.


### Fase 2 — habitat-/wind-/positioneringsketen gevolgd (16 november 2026)

De read-only trace van de bestaande bankWind-, habitatMovement- en rodPositioning-engines staat in [FASE2_PROGNOSE_AUDIT.md §9](FASE2_PROGNOSE_AUDIT.md). De habitatengine levert kwalitatieve zones en een heuristisch confidence-label, geen gekalibreerde aanwezigheidkans. De positioneringsengine is expliciet gescheiden van de activiteitsindex en Poisson-vangkans. Geen numerieke kans of bonus toegevoegd; fase 2 blijft audit.


### Fase 2 — meettijd-provenance watertemperatuur (16 november 2026)

De read-only controle bevestigt dat historische sessiemetingen momenteel op session.startTime worden gedateerd, terwijl het type een afzonderlijk waterTemperatureMeasuredAt-veld bevat. Snapshot- en sessiebronnen kunnen hierdoor dezelfde fysieke meting als twee verschillende waarnemingen behandelen. Zie [FASE2_PROGNOSE_AUDIT.md §10](FASE2_PROGNOSE_AUDIT.md). Eerst fallback- en deduplicatiebeleid vastleggen; daarna een gerichte fix met tests. Geen code gewijzigd.


Aanvulling §10: het meettijdstipveld is in SessionModal optioneel en wordt niet automatisch ingevuld. De fallbackpolicy moet dit expliciet verwerken; session.startTime is geen betrouwbare exacte meettijd.

---

## Voortgangscheckpoint — 18 november 2026

### Hoofdspoor: fase 2 biologische prognose

Fase 2 blijft in uitvoering; formele acceptatie is nog niet verleend en fase 3 is niet gestart. De actuele technische, biologische en evaluatiebevindingen staan in FASE2_PROGNOSE_AUDIT.md en MODELARCHITECTUUR_FASE2.md.

- PR #111 is squash-merged als commit `79e162da4f541829c8bf003d46635a587713a025`. Kwak et al. (1992) is als directe veldbron toegevoegd voor karper: maag-/voorkeeldarminhoud uit een natuurlijk riviersysteem toont discontinu en variabel voeren, gemiddeld met pieken rond zonsopkomst en zonsondergang.
- De bron is opgenomen in het research register, het karperprofiel, de fase-2-audit en de modelarchitectuur. De regressietest controleert bron, responsvariabelen, beperkingen en `approvedForPrediction: false`.
- De PR-head Quality Gate is volledig geslaagd, inclusief typecheck, evidence-registry-, feeding-/diel-tests en productiebuild. De bron blijft contextueel; er zijn geen scores, gewichten, tijdvakbonussen of vangstkansen gewijzigd.
- De bewijsdekking per soort en responsvariabele blijft onderwerp van audit. Directe voedselopname, foerageergedrag, beweging, habitat en hengelvangbaarheid blijven afzonderlijke bewijssoorten.

**Volgende acties fase 2:**
1. De resterende soort-/factorbronnen en hun overdraagbaarheid controleren, met expliciete scheiding van gemeten respons, levensfase, seizoen, watertype, meetmethode en geografische context.
2. De volledige factor → code → UI → snapshot → testmatrix afronden, inclusief de gevolgen van ontbrekende en geschatte invoer.
3. Pas na die audit een toetsbaar kandidaatmodel per responslaag formuleren en vergelijken met de bestaande baseline.
4. Chronologische onafhankelijke validatie en datavereisten vastleggen. Geen numerieke factor activeren zonder passende bron en validatie; lokale kalibratie blijft wachten op voldoende nieuwe, vergelijkbare sessies.

### Parallelle zijstroom: VisCoach-productverfijning

Deze zijstroom ondersteunt de hoofdroadmap, maar verandert de fasevolgorde niet en start fase 3 niet.

- PR #109 is squash-merged als commit `c45d8f524fc8ead283a91b778c75d84bb2bd88f9`: het productbesluit over afzonderlijk maar samenhangend advies (wanneer/waarom/waar) en tactiek (hoe presenteren/voeren/positioneren) is vastgelegd.
- PR #110 is squash-merged als commit `c2abbd2f38a08666cf8e7601b7bad050d8d672cb`: de read-only implementatie-audit en vervolgvolgorde staan in VISCOACH_PRODUCT_ROADMAP.md.
- De coach is al de standaard startpagina en gebruikt bestaande engines. De audit vond onder meer dat het gekozen starttijdvak nog niet alle tactische deel-engines aanstuurt, advies en tactiek één tekstveld zijn, biologische context nog als los standaardblok verschijnt, windtekst alleen bij sterke wind wordt getoond, habitat en wind niet expliciet worden verzoend en slechts een deel van de voorvoeruitkomst wordt benut.
- Er zijn geen VisCoach-berekeningen of gebruikersinvoer gewijzigd. De eerste invoer blijft doelvis, stek en gewenste starttijd; eindtijd en verdere sessiedetails blijven optioneel.

**Volgende acties VisCoach-zijstroom:** gerichte tijdvakdoorgifte naar de bestaande tactische engines; gestructureerde, achterwaarts compatibele advies-/tactiekvelden; begrijpelijke samenvoeging van habitat-, wind- en positioneringsuitkomsten; onderbouwde matige-windduiding; selectieve benutting van voorvoeruitkomsten; standaard-/geavanceerde presentatie en regressietests. Geen tweede prognose- of tactiekengine.

**Regie:** fase 2 blijft het hoofdspoor. De VisCoach-audit en productvoorbereiding lopen parallel. Fase 3 begint uitsluitend na formele fase-2-acceptatie.
### Aanvulling op checkpoint — bewijs en VisCoach-koppeling (18 november 2026)

- PR #113 is squash-merged als commit `26002ed043a2e8c2e8f48ec897e56642aec760b3`. Bergström et al. (2024) is als volwassen meerval-veldtelemetrie geregistreerd, uitsluitend voor locomotorische activiteit en habitat/dieptegebruik. De studie meet geen directe voedselopname en activeert daarom geen voedingsritme of tijdvakbonus.
- PR #114 is squash-merged als commit `10b722af471e8156b83474084d51a7cec5e53c86`. De gekozen starttijd stuurt nu de bestaande VisCoach-positionerings-, habitat-, oeverwind- en voorvoerberekeningen. Tijdens een live sessie wordt het actuele tijdvak gebruikt. De context wordt in snapshots bewaard en beperkte resterende weersdekking wordt gemeld.
- De dagbrede thermische score, algemene beste-tijdvakuitkomst en algemene Prognose-tab zijn ongewijzigd. Er is geen biologische factor, windbonus of tweede tactiekengine toegevoegd.

**Resterend:** fase 2 blijft open voor de volledige factor-/bewijs-/validatiematrix. In de VisCoach-zijstroom moeten advies en tactiek nog als afzonderlijke maar samenhangende velden worden opgeslagen en getoond; daarnaast volgen de standaard/advanced-presentatie, matige-windduiding, habitat-/windafstemming en selectieve voorvoervertaling. Fase 3 blijft geblokkeerd tot formele fase-2-acceptatie.
### Aanvulling — VisCoach-advies/tactiek en windduiding (18 november 2026)

PR #116 is squash-merged als commit `372954a972b41feddb87ba9966a4a63d8b641c7a`.

- De coach bewaart en toont nu aparte `advice`- en `tactics`-velden. Het bestaande samengestelde `recommendation` blijft voor compatibiliteit; oudere records vallen terug op dat veld.
- Het standaardplan toont geen zelfstandig biologisch-literatuurblok meer. De onderliggende bewijsregistratie en uitgebreide analyse blijven beschikbaar.
- De bestaande positioneringsengine levert nu expliciet de classificatie kalm/niet-kalm/ontbrekend. De coach kan daardoor ook relevante matige wind tactisch benoemen, zonder ontbrekende wind als matig te interpreteren of een nieuwe drempel/bonus te introduceren.
- De wijzigingen zijn met regressietests afgedekt; de exacte PR-head Quality Gate is volledig groen.

**Resterende VisCoach-zijstroom:** habitat- en winduitkomsten inhoudelijk samenbrengen tot één praktisch startpunt; het bestaande voorvoerplan vollediger maar selectief vertalen; UX- en terugvalgedrag afronden. Geen extra gebruikersinvoer of parallelle engine.

**Hoofdregie blijft ongewijzigd:** fase 2 biologische prognose is nog niet formeel geaccepteerd; fase 3 is niet gestart.
### Aanvulling — startzone en voorvoer vertaald; VisCoach-zijstroom gepauzeerd (18 november 2026)

PR #118 is squash-merged als commit `e7b51f8e0ff88a9834462ab40919a3f8a59abb43`.

- De VisCoach kiest één praktisch startpunt bij verschil tussen habitat en positionering. Lokale waarnemingen hebben prioriteit; anders krijgt een bruikbare habitatinschatting voorrang, tenzij die lage zekerheid heeft en de positioneringsanalyse redelijke zekerheid heeft. De andere zone blijft een tweede controlepunt.
- Wind wordt gebruikt voor presentatie en werprichting, niet als automatische reden om de primaire habitatzone te verlaten. Temperatuur blijft activiteitspotentie en geen exacte locatievoorspelling.
- De voorvoerengine wordt vertaald naar campagneadvies, sessievoer, voersamenstelling en persoonlijke historie indien beschikbaar. Exacte voorbereidende grammen vereisen `Redelijk` invoerkwaliteit; sessiehoeveelheden vereisen daarnaast een expliciet bekende sessieduur. Geen eindtijd betekent geen gegokte sessiehoeveelheid.
- De exacte PR-head Quality Gate is volledig groen (run #759), inclusief alle regressietests en productiebuild.

**Besluit werkverdeling:** de huidige VisCoach-zijstroom is op een bruikbaar tussenpunt gebracht. Geen verdere brede VisCoach-uitbreiding totdat de fase-2-audit en het kandidaatmodel weer een duidelijke volgende stap hebben. De hoofdprioriteit keert terug naar de biologische factorinventaris, soortspecifieke bewijsbeoordeling, datadekking en validatie. Fase 3 blijft geblokkeerd tot formele fase-2-acceptatie.
### Aanvulling — soortprofielen en weersfactoren-audit (18 november 2026)

PR #120 is squash-merged als commit `2b115383e57cfff05a43d935849a0e4a41ddbb10`.

- De verklarende soortprofielen zijn herschreven om fysiologie, voedselopname, beweging, habitat en vangbaarheid strikt te onderscheiden. Onbewezen vaste wind-, druk- en weersclaims zijn verwijderd of als niet-gevalideerde context gemarkeerd.
- De geavanceerde prognose waarschuwt nu dat profielnotities en bronvermeldingen geen validatie van de thermische optimum- en curvebreedteparameters betekenen.
- De numerieke thermische profielen en alle prognoseberekeningen zijn ongewijzigd.
- Het centrale research register bevat nu 59 registraties, allemaal `approvedForPrediction:false`. Drie nieuwe records behandelen Europese baarsbeweging bij drukvariabiliteit, een niet-overdraagbare yellow-perch-druk/voedselopname-proxy en een algemene review van troebelheid.
- De factorinventaris blijft open: wind, regen, bewolking, zuurstof en stroming vereisen verdere bronbeoordeling. Druk- en troebelheidseffecten zijn contextafhankelijk en rechtvaardigen geen universele bonus.
- De exacte PR-head Quality Gate is volledig groen (run #772), inclusief tests en productiebuild.

**Volgende hoofdspoorstap:** de resterende meteorologische/hydrologische factoren per soort beoordelen en de volledige matrix vastleggen: actief in activiteit, actief in habitat/beweging, alleen context, niet beschikbaar of bewust uitgesloten. Pas daarna het kandidaatmodel ontwerpen. Fase 3 blijft geblokkeerd.

### VisCoach — voorvoerhorizon en koude-waterpresentatie (18 november 2026)

Nieuwe productverbetering naar aanleiding van praktijktest van het gegenereerde VisCoach-advies:

- De VisCoach-voorvoerplanner kreeg tot nu toe standaard maximaal twee beschikbare voorbereidingsdagen, ook wanneer een sessie drie dagen vooruit werd gepland. De VisCoach moet de werkelijke kalenderdagen tot de sessie doorgeven, met behoud van de bestaande bovengrens van drie dagen en de bestaande soort-/temperatuurbeperkingen van de voerplanner.
- De coachtekst moet voorbereidingstiming ook bij matige datakwaliteit kunnen tonen, terwijl exacte grammen alleen bij de bestaande kwaliteit Redelijk zichtbaar blijven.
- Een ontbrekend watertype bij een reeds geselecteerde stek mag niet leiden tot de misleidende tekst “kies eerst een stek”. De coach benoemt het ontbrekende kenmerk, houdt exacte hoeveelheden achter en geeft waar mogelijk een bruikbare kwalitatieve instant-presentatie.
- Bij een voorzichtige koude-waterstrategie voor karper moet de gebruiker, zolang geen techniek is gekozen, het onderscheid begrijpen tussen een kleine PVA-presentatie bij een karperrig en een minimale method-feederkorfvulling. Dit zijn alternatieven voor instant vissen, geen voerbed en geen twee gelijktijdige tactieken.
- De tactiek blijft opgebouwd uit voorvoeren vóór de sessie, voeren/presenteren tijdens de sessie, hengelpositionering/werprichting en bijsturen tijdens de sessie. De prognose- en voerengine blijven de bron; er komt geen tweede biologische of voerengine.

**Uitvoering in deze wijzigingsset:** dynamische beschikbare voorbereidingsdagen in VisCoach, verbeterde ontbrekende-watertype-vertaling, zichtbare indicatieve timing bij matige zekerheid en regressietests voor drie dagen vooruit en koude instant-opties. Geen numerieke biologische parameters of prognose-/Brier-logica gewijzigd. Fase 2 blijft het hoofdspoor; fase 3 blijft geblokkeerd tot formele fase-2-acceptatie.


### VisCoach — doelzone en werprichting (18 november 2026)

Tactische verfijning: de werprichting moet voortkomen uit de gekozen zoekzone, niet automatisch uit de windrichting. Wind en oeveroriëntatie ondersteunen de keuze van vispositie, werphoek en lijncontrole. Bij zwakke wind is een windgestuurde kompasrichting overbodig; bij merkbare wind gebruikt de coach de bestaande oever-/positioneringsanalyse. Als de oever of doelzone onbekend is, geen exacte richting, afstand of diepte verzinnen. Regressietests toegevoegd voor zwakke wind met/zonder bruikbare doelzone en matige wind met bekende doelzone. Geen wijziging aan prognoseberekeningen of biologische parameters.

### Aanvullende VisCoach-audit — dynamisch advies en tactiek tijdens de sessie (18 november 2026)

De actuele code-audit is vastgelegd in `VISCOACH_PRODUCT_ROADMAP.md`, onder **Dynamische sessiecoach — aanvullende code-audit**.

Bevestigd: de bestaande sessiecoördinator hergebruikt de forecast- en prognoseketen, rekent met het actuele tijdvak, gebruikt conservatieve bevestiging voor weerswijzigingen en bewaart snapshots/adviezen herleidbaar. De app belooft terecht geen doorlopende achtergrondverwerking wanneer de PWA volledig gesloten is.

Twee concrete aandachtspunten zijn gevonden voor de latere fase-3-uitwerking:
- Een techniekwijziging staat wel in de invoerfingerprint, maar niet in de praktische prognosesignature. Een methodewijziging alleen kan daardoor buiten de adviesvergelijking vallen.
- Bij een gewijzigde signature worden nu steeds zowel een snapshot als een nieuw adviesrecord gemaakt. De vertaalde advies-/tactiekuitkomst wordt niet eerst vergeleken met het vorige advies. Prognose gewijzigd maar aanpak gelijk moet een snapshot kunnen opleveren zonder een nieuw handelingsadvies.

De vervolgaanpak is daarom: volledige triggerketen inventariseren; prognose- en advieswijziging scheiden; techniek- en tactiekuitkomsten expliciet meenemen; en regressies toevoegen voor methodewijziging, alleen gewijzigde dagwinnaar, doelzone-/voerwijziging, herhaalde forecasts en prognosewijziging zonder tactiekwijziging. De actieve sessie moet vervolgens kort tonen wat veranderde, waarom en welke actie eventueel zinvol is.

**Faseregie blijft ongewijzigd:** dit is audit/voorbereiding en geen start van fase 3. Fase 2 blijft het hoofdspoor; fase 3 wacht op formele fase-2-acceptatie. Er zijn in deze audit geen code of prognoseberekeningen gewijzigd.


## Voortgangscheckpoint — dynamische VisCoach-audit afgerond (18 november 2026)

PR #125 is squash-merged op `main` als commit `751852d2e68bbeb518efb971aa5e8a318136c1fe`. De exacte PR-head Quality Gate (run #44373580579, job #135046625307) is volledig geslaagd: dependency-audits, TypeScript-typecheck, alle regressie-/integratietests en productiebuild. De mergecommit is gecontroleerd; de connector rapporteerde geen afzonderlijke push-run/statuscheck voor die mergecommit. De merge is dus gebaseerd op de volledig groene exacte PR-head gate.

### VisCoach-productzijstroom — dynamische sessiecoaching

De read-only audit is vastgelegd in `VISCOACH_PRODUCT_ROADMAP.md`. De bestaande coördinator hergebruikt de weerservice en prognoseketen, rekent met het actuele tijdvak, neemt sessiecontext en techniek mee en hanteert conservatieve bevestiging van forecast-wijzigingen. De PWA kan niet continu herbeoordelen wanneer zij volledig gesloten is; bij hervatten kan de actuele context opnieuw worden beoordeeld.

De belangrijkste openstaande codepunten zijn:
- Techniek staat in de invoerfingerprint, maar niet in `prognosisSignature()`; een techniekwijziging alleen kan daardoor buiten de praktische adviesvergelijking vallen.
- Een gewijzigde signature leidt nu tot een nieuw snapshot én adviesrecord zonder eerst de feitelijke, voor de gebruiker zichtbare advies-/tactiekuitkomst met het vorige advies te vergelijken.
- De signature dekt niet alle concrete presentatie-, aas- en sessievoeruitkomsten.
- De coach moet onderscheid maken tussen geen praktische wijziging, alleen een gewijzigde prognose en een werkelijk gewijzigd handelingsadvies.

Gewenst gedrag: bij alleen een prognosewijziging mag een nieuw snapshot worden bewaard, maar er komt geen nieuw advies/melding als de aanpak gelijk blijft. Een techniek- of tactiekwijziging moet zelfstandig worden beoordeeld. Een werkelijk gewijzigd advies verwijst naar het juiste snapshot en vorige advies en benoemt kort wat veranderde, waarom en welke actie mogelijk zinvol is. De gebruiker houdt altijd de regie.

### Laatste VisCoach-wijzigingen op main

- PR #122: voorvoerhorizon tot maximaal drie kalenderdagen, correcte omgang met ontbrekend watertype en alternatieve kleine PVA-/method-feederpresentatie waar de bestaande planner een voorzichtige koude-waterstrategie onderbouwt.
- PR #123: veiligheidsnuance; onbekende watertemperatuur alleen is geen bewijs voor koudwatergedrag.
- PR #124: doelzone bepaalt waar het aas wordt gepresenteerd; wind en oeveroriëntatie ondersteunen positie/werphoek en lijncontrole, niet automatisch de vislocatie.
- PR #125: bovenstaande dynamische sessiecoach-audit gedocumenteerd.

### Hoofdspoor en volgende acties

Fase 2 biologische prognose blijft het hoofdspoor en is nog niet formeel geaccepteerd. Fase 3 blijft geblokkeerd. De eerstvolgende inhoudelijke fase-2-stap is de resterende meteorologische/hydrologische factorinventaris per soort afronden: neerslag, bewolking, opgeloste zuurstof en stroming, met strikte scheiding tussen fysiologische activiteit, voedselopname, habitat/beweging en vangbaarheid. Daarna de volledige factor-/bewijs-/datadekkingsmatrix sluiten en pas dan een kandidaatmodel plus chronologisch validatieprotocol ontwerpen. Geen numerieke factor of tijdvakbonus activeren zonder directe onderbouwing en onafhankelijke validatie.

Alle bronnen in het research register blijven `approvedForPrediction: false` totdat de relevante bewijs- en validatiecriteria aantoonbaar zijn gehaald.


## Correctie na wind-/doelzone-consistentiecontrole (18 november 2026)

Na PR #124 bleek een oude implementatielaag nog aanlandige wind als primaire zoekzone te gebruiken en bij warme windstilte zuurstofrijke zones te suggereren zonder directe zuurstofmeting. De correctie is uitgewerkt in PR #128: primaire zone op basis van lokale habitat/waarnemingen; wind uitsluitend voor presentatie, werphoek, lijncontrole en hengelpositie; geen zuurstofconclusie zonder meting. De regressies dekken wind-only zonewijzigingen en behoud van tactische windinformatie. Geen prognoseberekeningen of biologische parameters gewijzigd.


### Later te verbeteren — betekenisvolle verandering in dynamisch advies (18 november 2026)

Als niet-blokkerende verbetering voor de latere VisCoach-uitwerking vastgelegd: onderscheid tussen een nieuw meet-/forecastmoment, een functioneel relevante verandering in een factor en een daadwerkelijke wijziging van het praktische advies of de tactiek. Een nieuwe windmeting of kleine wijziging in snelheid/richting is niet automatisch een reden voor een nieuw advies. Alleen wanneer herbeoordeling met de bestaande prognose- en tactiekmodules tot een andere praktische actie leidt, wordt een nieuw coachadvies gemaakt; een interne prognosewijziging kan zonder advieswijziging als snapshot worden bewaard.

De exacte factorgrenzen, hysterese en bevestigingsregels worden later per factor onderzocht en gevalideerd. Geen arbitraire windsnelheidsdelta of universele drempel invoeren. Dit is geen must voor fase 2 en blokkeert de huidige voortgang niet.


### Fase 2 — resterende meteorologische/hydrologische factorinventaris beoordeeld (19 november 2026)

De resterende factorbeoordeling is uitgevoerd en vastgelegd in `FASE2_PROGNOSE_AUDIT.md` §88 en `MODELARCHITECTUUR_FASE2.md` §79.

- Wind: alleen praktische positionerings-/presentatiecontext; geen algemene biologische of vangstbonus.
- Regen/bewolking: onvoldoende direct, soortspecifiek bewijs voor dagelijkse voedings- of vangstrespons; paaigerelateerde migratie is geen dagelijkse visactiviteit.
- Opgeloste zuurstof/stroming: biologisch relevant in specifieke contexten, maar niet betrouwbaar lokaal beschikbaar in de huidige invoerketen; onbekend blijft onbekend.
- Luchtdruk/troebelheid: contextafhankelijk en onvoldoende voor een universele numerieke respons.
- Alle 71 research-registryrecords blijven niet-goedgekeurd voor directe numerieke voorspelling. Geen scores, parameters, drempels of tijdvakbonussen gewijzigd.

**Volgende hoofdspoorstap:** de formele Fase-2-acceptatiecrosswalk actualiseren en het expliciete ontwerpbesluit over de voorlopige thermische priors uit audit §86 voorbereiden. Daarna pas een kandidaatmodel-/chronologisch validatieprotocol afronden. Fase 3 blijft geblokkeerd tot formele Fase-2-acceptatie.


### Fase 2 — actuele acceptatiecrosswalk en resterende ontwerpbeslissing (19 november 2026)

De zeven formele criteria zijn opnieuw beoordeeld in `FASE2_PROGNOSE_AUDIT.md` §89. De factorinventaris uit §88 is afgerond voor deze onderzoeksronde; geen aanvullende omgevingsfactor is numeriek geactiveerd.

**Status:** technische borging, snapshot-/Brier-keten, tijdvakmetadata en huidige VisCoach-invoerflow zijn voor de huidige scope gerealiseerd. Lokale kalibratie wacht op voldoende echte, vergelijkbare sessies. De formele blocker blijft criterium 2: de exacte parameters van de bestaande thermische curves zijn niet onafhankelijk gevalideerd.

**Volgende stap:** expliciet ontwerpbesluit voorbereiden over (A) thermische curves transparant behouden als voorlopige mechanistische prior, of (B) numerieke thermische activiteit uitschakelen voor soorten zonder passende directe fysiologische basis. Dit besluit verandert niet automatisch runtimegedrag. Fase 2 blijft open; fase 3 blijft geblokkeerd.
### Fase 2 — ontwerpbesluit thermische prior (19 november 2026)

Optie A is gekozen: de bestaande thermische curves blijven actief als transparant gelabelde voorlopige mechanistische prior. Ze bepalen uitsluitend de relatieve thermische respons binnen de bestaande prognose. Ze worden niet gebruikt om zelfstandig voedingskans, voorvoerhoeveelheid, persoonlijke vangstkans of Brier-score te verhogen.

Dit is geen herontwerp van de prognose. De bestaande prognose blijft de centrale bron van prognostische uitkomsten; VisCoach consumeert de prognose en bestaande gespecialiseerde engines en maakt geen eigen prognose. Temperatuurrespons, voedingsgedrag, habitat/beweging, positionering en persoonlijke vangsthistorie blijven afzonderlijke respons-/informatielagen.

De exacte curveparameters blijven ongevalideerd en worden ook niet als lokaal gevalideerd gepresenteerd. Bronstatus en onzekerheid blijven zichtbaar. Geen nieuwe gewichten, drempels of tijdvakbonussen worden toegevoegd. Fase 2 blijft onder de bestaande zevenpunts-acceptatiecrosswalk vallen; fase 3 blijft geblokkeerd tot formele fase-2-acceptatie.



### Fase 2 — vervolg na thermisch ontwerpbesluit (19 november 2026)

- PR #147 is squash-merged als `5acd372a3be0ee31d1a5b7d422659e7ef4fee097`; de Quality Gate op de mergecommit (#44496021470) is geslaagd.
- Optie A is vastgelegd: bestaande thermische curves blijven uitsluitend als transparante voorlopige mechanistische prior actief. De exacte parameters zijn niet onafhankelijk gevalideerd; er worden geen nieuwe gewichten, drempels of tijdvakbonussen geactiveerd.
- De bestaande dagscoreweergave blijft behouden.

**Einddoel scoreketen verduidelijkt:** elk relevant prognoseonderdeel krijgt een eigen dagelijkse factoruitkomst en een onderbouwd gewicht in de bestaande totaalscore. De huidige scoreweergave blijft behouden. Per tijdvak wordt dezelfde factorlogica toegepast met tijdvakgebonden invoer en passend soortspecifiek voedings-/foerageerbewijs. Factoren zonder voldoende bewijs/data worden niet met een willekeurige neutrale waarde gevuld; zij blijven expliciet contextueel/onbekend of uitgesloten. Dit is het beoogde doel, niet de huidige werking.
 De volgende audit brengt per bestaande factor de huidige bijdrage, beoogde respons, bewijs, databeschikbaarheid, onzekerheid, interacties en evaluatiemethode in kaart. Alleen onderbouwde factoren kunnen later numeriek bijdragen; overige factoren blijven expliciete context, habitat-/bewegingsinformatie, onbekend of uitgesloten.
- Tijdvakvoorkeur wordt binnen dezelfde prognoseketen beoordeeld op doelsoort, datum/seizoen en stek. Direct voedings-/foerageerbewijs kan een tijdvak beïnvloeden; beweging en thermische respons worden niet automatisch als voeding of vangbaarheid vertaald.
- Brier blijft evaluatie van persoonlijke vangstkans versus sessie-uitkomsten, geen directe biologische gewichtstuner. Tussenlagen vereisen passende afzonderlijke evaluatie.
- **Volgende stap:** kandidaatmodel-audit van de bestaande prognoseketen en een chronologisch validatieprotocol uitwerken. Geen runtimefactoren of gewichten activeren voordat bewijs en acceptatiecriteria dit toestaan. Fase 2 blijft niet geaccepteerd; Fase 3 blijft geblokkeerd.


### Fase 2 — code-audit huidige scoreketen (19 november 2026)

De eerste trace van `calculateDayPrognosis()` en `analyzeTimeSlot()` staat in `FASE2_PROGNOSE_AUDIT.md` §92. De huidige dagscore is feitelijk de thermische score: dezelfde dagelijkse thermische analyse wordt in alle vier tijdvakken hergebruikt. Druk, wind, seizoen, tijdstip/licht, bewolking en neerslag zijn contextueel (`score: 0`); soortspecifiek voedingsritme is tekstuele context en persoonlijke tijdvakervaring wordt niet in de activiteitsscore verwerkt. De tijdvakrangschikking kan daardoor geen echte voedings-/tijdvakvoorkeur vaststellen.

Dit is een belangrijk verschil met de beoogde geïntegreerde scoreketen, geen toestemming voor een snelle numerieke bonus. De volgende stap is de volledige factor-naar-UI/snapshot/evaluatie-traceermatrix en het kandidaatmodel-/chronologische validatieprotocol. De bestaande scoreweergave blijft behouden; geen runtimewijziging, extra score of parallelle engine.


### Fase 2 — factor-naar-UI/snapshot/evaluatie-traceermatrix afgerond (19 november 2026)

De huidige implementatie is per factor verbonden met code, zichtbare UI, prognosesnapshot en evaluatie in `FASE2_PROGNOSE_AUDIT.md` §93. De dagscore heeft alleen een numerieke thermische bijdrage; de overige meteorologische en tijdvakfactoren zijn context. Habitat/beweging blijft een aparte ruimtelijke laag, persoonlijke vangstkans een afzonderlijke empirische baseline en Brier toetst uitsluitend die vangstkans. Temperatuur heeft eigen MAE/RMSE/bias-evaluatie. Voor activiteit, voeding, habitat-aanwezigheid en tijdvakrangschikking ontbreken nog onafhankelijke evaluatiemaatstaven.

**Volgende stap:** kandidaatmodel en chronologisch validatieprotocol ontwerpen op basis van deze traceermatrix. Geen nieuwe factor, gewicht, tijdvakbonus of runtimewijziging activeren vóór evidence-, data- en validatievoorwaarden zijn vastgesteld.


### Fase 2 — kandidaatmodel en validatieprotocol ontworpen (19 november 2026)

De kandidaatmodelrichting en het chronologische validatieprotocol zijn vastgelegd in `FASE2_PROGNOSE_AUDIT.md` §94 en `MODELARCHITECTUUR_FASE2.md` §85. Het ontwerp behoudt de bestaande dagscoreweergave en centrale prognoseketen. Factoren krijgen ieder een traceerbare respons, datastatus, onzekerheid en — alleen wanneer evidence en validatie dit toelaten — een eigen gewogen bijdrage. Habitat/aanwezigheid, persoonlijke vangstkans en betrouwbaarheid blijven onderscheiden responsen.

De vier tijdvakken worden uiteindelijk afzonderlijk beoordeeld met tijdvakcondities, doelsoort, datum/seizoen en stekcontext; directe voedings-/foerageerevidence kan de tijdvakvoorkeur beïnvloeden. Brier blijft uitsluitend de evaluator van persoonlijke vangstkans; temperatuur, activiteit, voeding, habitat en tijdvak vereisen eigen passende evaluatie. Geen gewichten of runtimefactoren geactiveerd. De normalisatie, aggregatie, ontbrekende-data-regel en gewichtsbepaling blijven open ontwerpbesluiten vóór implementatie. Fase 2 blijft niet geaccepteerd; Fase 3 blijft geblokkeerd.


### Fase 2 — herstel voorvoer-audit en vervolg habitat-/positioneringsbewijs (19 november 2026)

De eerder in PR #146 gemergde voorvoer-audit is teruggezet in `FASE2_PROGNOSE_AUDIT.md` §96 nadat bleek dat deze sectie bij een latere documentatiesynchronisatie uit het huidige bestand was verdwenen. §97 bevat de aanvullende bron-/claimcontrole van temperatuurafhankelijke habitat- en positioneringsregels. Vijf nieuwe telemetriebronnen voor meerval, snoek en blankvoorn/voorn zijn als niet-goedgekeurde registry-context toegevoegd; alle 76 registry-records blijven `approvedForPrediction: false`.

De huidige code gebruikt nog heuristische grenzen (<7–12 °C, afhankelijk van soort/regel) en bevat enkele te stellige formuleringen. Dit zijn ruimtelijke zoekhypothesen, geen dagscorefactoren. De meervalclaim “zonder actief te jagen” onder 12 °C is onvoldoende houdbaar; exacte grenzen voor zeelt, snoek en voorn zijn evenmin gevalideerd. De bestaande voerhoeveelheden blijven een afzonderlijk open besluit. Geen runtimeberekeningen of gewichten aangepast.

**Volgende stap:** de claim-/brontrace per soort afronden en per regel vastleggen of de tekst als voorzichtige zoekhypothese kan blijven, alleen context moet zijn of moet worden afgezwakt. Daarna de zevenpunts-crosswalk bijwerken. Fase 2 blijft niet geaccepteerd; Fase 3 blijft geblokkeerd.


### Fase 2 — koudewater-zoekclaims genuanceerd (19 november 2026)

Na de evidence-audit §97 zijn vier te stellige positioneringsteksten voor snoek, zeelt, meerval en voorn gecorrigeerd in `rodPositioningEngine.ts`. De 7–12 °C-condities en zonekeuzes zijn niet veranderd; alleen claims over vaste prooivisverplaatsing, extreme winterrust, volledige meervalinactiviteit en zonnige-middagverplaatsing zijn teruggebracht tot contextafhankelijke zoekhypothesen. Vier regressieasserties bewaken deze grenzen.

Geen score, gewicht, temperatuurgrens, gramadvies of tijdvakbonus gewijzigd. Volgende stap: de resterende factor-/brontrace afronden en daarna de zevenpunts-crosswalk bijwerken. Fase 2 blijft open; Fase 3 blijft geblokkeerd.


### Fase 2 — registerdekking per soort bijgewerkt (19 november 2026)

De actuele dekkingstabel in `FASE2_PROGNOSE_AUDIT.md` §78 is bijgewerkt op basis van 76 registerrecords; de aanvullende interpretatie staat in §99. Alle 76 bronnen blijven niet-goedgekeurd voor directe numerieke voorspelling. Roofblei mist directe tijdgebonden voedselopnamegegevens; meerval en karper hebben voedingsbronnen uit verschillende meetcontexten die niet als één respons mogen worden samengevoegd. De nieuwe snoek-/blankvoorntelemetrie voegt vooral bewegings-/habitatbewijs toe.

Geen factor, gewicht of score geactiveerd. Volgende stap: resterende bron-/claimtrace afronden en daarna de zevenpunts-crosswalk actualiseren. Fase 2 blijft open; Fase 3 blijft geblokkeerd.


### Fase 2 — oudere profielreferenties geverifieerd (19 november 2026)

Zeven oudere profielreferenties zijn bibliografisch gecontroleerd en waar nodig gecorrigeerd in `fishProfiles.ts`; de bijbehorende inhoud en beperkingen zijn vastgelegd in `FASE2_PROGNOSE_AUDIT.md` §100 en zeven contextrecords zijn toegevoegd aan de research registry. Filtervoeding/prooikeuze, voedingsmechanica, groei, laboratoriumzwemactiviteit en reproductie worden niet als dagelijkse voedselopname of vangbaarheid behandeld.

Het register bevat nu 83 unieke records; alle blijven `approvedForPrediction: false`. Kestemont (1995) en Tartally (2000) blijven bibliografisch niet geverifieerde achtergrondverwijzingen. Geen score, gewicht of thermische curve gewijzigd. Fase 2 blijft open; Fase 3 blijft geblokkeerd.

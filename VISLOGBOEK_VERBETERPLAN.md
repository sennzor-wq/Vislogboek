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


### Fase 2 — omgevingsfactoren gericht onderzocht (19 november 2026)

De gerichte review van wind, druk, troebelheid, zuurstof, neerslag en stroming staat in `FASE2_PROGNOSE_AUDIT.md` §101. Drie aanvullende bronnen zijn geregistreerd: baarsbeweging bij wind/druk, brasemactiviteit/troebelheid en karpervoeropname onder ernstige hypoxie. Alle 86 registry-records blijven niet-goedgekeurd voor directe voorspelling.

Belangrijk: zuurstof kan bij ernstige hypoxie de karpervoeropname sterk verlagen, maar de app heeft geen betrouwbare lokale zuurstofmeting. Deze factor blijft onbekend en wordt niet uit andere weerdata afgeleid. Wind/druk zijn vooral beweging/context; troebelheid is contextafhankelijk; neerslag/stroming hebben nog geen voldoende directe doelsoortbasis. Geen score of gewicht gewijzigd.

Volgende stap: de volledige factorstatus per soort en de zevenpunts-acceptatiecrosswalk actualiseren. Fase 2 blijft open; Fase 3 blijft geblokkeerd.


### Fase 2 — formele acceptatiecrosswalk gesynchroniseerd (19 november 2026)

De actuele zevenpuntscrosswalk is bijgewerkt in `FASE2_PROGNOSE_AUDIT.md` §89. De documentatie weerspiegelt nu de keuze voor thermische optie A, de actuele 86 registry-records, de volledige factortrace en de aanvullende soort-/omgevingsbronnen. Alle 86 bronnen blijven niet-goedgekeurd voor directe numerieke voorspelling.

**Huidige formele blockers:** de doelrespons van de bestaande 1–10-score expliciet afbakenen; factorstatus en datadekking per soort sluiten; normalisatie en ontbrekende-data-regel ontwerpen; onafhankelijke evaluatie voor activiteit, voeding, habitat en tijdvak vastleggen. Brier blijft uitsluitend evaluatie van persoonlijke vangstkans. De thermische curve blijft voorlopige prior, exacte parameters ongevalideerd. Geen runtimegewichten of tijdvakbonussen geactiveerd. Fase 2 blijft niet geaccepteerd; Fase 3 blijft geblokkeerd.

**Volgende stap:** factorstatus-/datadekkingsmatrix definitief sluiten, daarna pas doelrespons, normalisatie, missing-data-regel en kandidaataggregatie vastleggen. Vervolgens chronologisch valideren tegen de bestaande thermische baseline.


### Fase 2 — actuele responsdekking per soort gesloten in audit (19 november 2026)

De exacte registrytelling per soort en gemeten respons is bijgewerkt in `FASE2_PROGNOSE_AUDIT.md` §82. Alle 86 records blijven niet-goedgekeurd voor directe numerieke voorspelling. De belangrijkste gaten blijven directe voedingsintensiteit/-ritme voor roofblei, de overdraagbaarheid van gecontroleerde voedingsstudies bij meerval/karper en onafhankelijke validatie van activiteit, habitat en tijdvak.

**Volgende stap:** koppel deze responsdekking aan de doelrespons van de bestaande 1–10-score en sluit de factor-/datadekkingsmatrix. Daarna pas normalisatie, missing-data-regel en kandidaataggregatie uitwerken. Geen runtimegewichten of tijdvakbonussen activeren.


### Fase 2 — factorinventaris gesloten, modelontwerp nog open (19 november 2026)

De geconsolideerde factor-/input-/evaluatiematrix staat in `FASE2_PROGNOSE_AUDIT.md` §102. De inventaris van de bestaande prognoseketen is gesloten: per factor is de biologische respons, invoerbeschikbaarheid, huidige rol en vereiste onafhankelijke evaluatie vastgelegd. Ontbrekende zuurstof-, stromings-, troebelheids- en prooigegevens blijven expliciet onbekend; zij worden niet uit weerdata afgeleid.

**Nog open vóór scoremodelbouw:** doelrespons van de bestaande 1–10-score expliciet bevestigen; normalisatie, interacties en missing-data-regel ontwerpen; eigen evaluatie voor activiteit, voeding, habitat en tijdvak vastleggen; kandidaat chronologisch vergelijken met de thermische baseline. De huidige scoreweergave blijft behouden. Geen nieuwe gewichten of tijdvakbonussen. Fase 2 blijft niet geaccepteerd; Fase 3 blijft geblokkeerd.


### Fase 2 — gebruikersdoel van de bestaande 1–10-score vastgesteld (19 november 2026)

Het gebruikersbesluit is vastgelegd in `FASE2_PROGNOSE_AUDIT.md` §103: de bestaande cijferschaal, scoreweergave en één totaalcijfer blijven behouden. De score betekent biologische activiteit- en voedings-/foerageerpotentie van de doelsoort, niet persoonlijke vangstkans, stekaanwezigheid of vangbaarheid. De gebruiker krijgt een korte begrijpelijke onderbouwing; technische details en onzekerheid blijven in de verdiepende uitleg.

**Nog open vóór implementatie:** factor-specifieke normalisatie, stabiele vertaling naar 1–10, missing-data-/coverage-regels, dubbele-tellingpreventie, onderbouwde interacties/gewichten en chronologische validatie tegen de thermische baseline. Geen zichtbare deelscores, geen tweede score en geen runtimewijziging. Fase 2 blijft open; Fase 3 geblokkeerd.


### Fase 2 — minimaal vangstregistratiecontract (19 november 2026)

De vangstregistratie moet snel blijven: één actie 'Vis gevangen', vissoort kiezen en opslaan. Het tijdstip wordt automatisch ingevuld en blijft aanpasbaar. Een vooraf ingestelde hengel/methode en gewicht zijn optioneel. Geen verplichte voer-, aas-, presentatie- of materiaalregistratie.

De volledige regels staan in FASE2_PROGNOSE_AUDIT.md §104. Vangsten zijn bruikbaar voor tijdvak- en tactiekanalyse, maar zijn geen directe meting van voedingsactiviteit of bewijs dat hengel/voer de oorzaak was. Een nulvangst bewijst evenmin dat vissen niet actief waren. Geen extra invoer of runtimewijziging voordat de bestaande flow tegen dit contract is gecontroleerd.



### Fase 2 — factorresponsmatrix en onzekerheidsprincipe (19 november 2026)

Het productdoel van de bestaande 1–10-score is vastgesteld in FASE2_PROGNOSE_AUDIT.md §103; de minimale vangstregistratie in §104. De factor-naar-doelresponsmatrix en kandidaatprioriteit staan in §105. De eerdere blocker om de doelrespons nog te definiëren is daarmee vervallen.

De volgende ontwerpstap is normalisatie en coverage-/onzekerheidsbehandeling: de prognose moet de best verdedigbare verwachting maken met beschikbare gegevens. Ontbrekende factoren blijven expliciet onbekend en verlagen de zekerheid, maar blokkeren niet automatisch een bruikbare prognose. Geen fictieve neutrale waarden, verborgen herweging of willekeurige gewichten. Dagscore en tijdvakadvies blijven één samenhangende doelrespons; geen tweede score. Geen runtimewijziging en Fase 3 blijft geblokkeerd tot alle Fase-2-acceptatiecriteria zijn behaald.


### Fase 2 — normalisatie- en onzekerheidsarchitectuur uitgewerkt (19 november 2026)

De ontwerpuitwerking staat in `FASE2_PROGNOSE_AUDIT.md` §106 en is samengevat in `MODELARCHITECTUUR_FASE2.md` §97. Per factor wordt een ruwe invoer pas na validatie en soort-/contextselectie vertaald naar een genormaliseerde responsindex voor de juiste biologische doelrespons. Deze index is geen kanspercentage. De bestaande 1–10-score krijgt later een vaste, versieerbare kalibratie; geen dagelijkse herschaling.

Gemeten, geschatte, proxy/contextuele, ontbrekende, ongeldige, tegenstrijdige en niet-toepasselijke invoer worden onderscheiden. Onbekend wordt niet neutraal ingevuld en resterende gewichten worden niet stilzwijgend herverdeeld. Een gedeeltelijke prognose blijft mogelijk wanneer de betreffende factorcombinatie gevalideerd is; zonder bruikbare thermische basis en zonder andere toegelaten responsinformatie blijft de huidige uitkomst N/B.

**Nog open:** responsfuncties/referentieankers per soort invullen, app-invoer aan status koppelen, validatie per ontbrekend-data-patroon bepalen, onafhankelijke labels/metrics afronden en pas daarna kandidaataggregatie chronologisch vergelijken met de thermische baseline. Geen runtimewijziging, geen nieuwe score of verplichte gebruikersinvoer. Fase 2 blijft open; Fase 3 geblokkeerd.


### Fase 2 — technische thermische-baseline-audit (19 november 2026)

De exacte huidige soortparameters, Gaussische responsvorm, efficiëntievloer en 1–10-mapping zijn geauditeerd in `FASE2_PROGNOSE_AUDIT.md` §107; architectuursamenvatting in `MODELARCHITECTUUR_FASE2.md` §98. De huidige curve is een voorlopige softwareprior, geen gevalideerde directe voedselopname-/activiteitscurve. Door de efficiëntievloer 0,08 komt de theoretische minimumscore op circa 2,1/10. Gemeten, geschatte en onbekende watertemperatuur zijn onderscheiden; de interne placeholder bij onbekende invoer is geen geldige score of trainingslabel.

**Nog open:** parameterherkomst per soort verifiëren, statusoverdracht naar snapshots/evaluatie controleren, passend thermisch responslabel vastleggen en scoreankers onafhankelijk toetsen. Geen runtimewijziging of scoreaanpassing. Fase 2 blijft open; Fase 3 geblokkeerd.


### Fase 2 — herkomst thermische parameters gecontroleerd (19 november 2026)

De registry-audit in `FASE2_PROGNOSE_AUDIT.md` §108 vond geen directe thermische-efficiëntie-/optimumrespons die de exacte huidige profielcurves valideert. Vijf soortgebonden records meten metabolisme/aerobe scope (karper, snoek, baars, brasem/blankvoorn en snoekbaars); alle blijven niet-goedgekeurd en zijn geen directe dagelijkse voedselopnamecurves. De huidige parameters blijven voorlopige softwareprioren.

**Nog open:** per soort de directe temperatuur-voedselopnamebronnen onderscheiden van indirecte fysiologische context, inclusief levensfase, acclimatisatie, watertype en geografische overdraagbaarheid. Geen parameter of runtime gewijzigd; Fase 2 blijft open.


### Fase 2 — directe temperatuur-/voedingsrespons per soort in kaart gebracht (19 november 2026)

De relevante directe voedingsstudies en hun overdraagbaarheidsgrenzen staan in `FASE2_PROGNOSE_AUDIT.md` §109 (architectuur §100). Karper, zeelt en snoekbaars hebben contextgebonden directe voedselopnamebronnen; blankvoorn heeft verweven temperatuur-/licht-/seizoensbewijs; voor snoek en meerval zijn de beschikbare records geen bruikbare thermische voedingscurve. Dit bevestigt dat geen universele Gaussische curve of geleende soortparameters mogen worden aangenomen.

**Nog open:** per soort responskaarten maken, exacte responsvorm en referentie alleen kiezen waar de bron dat ondersteunt, en voldoende datadekking/validatie bepalen. Geen bron goedgekeurd en geen runtimeparameter gewijzigd.


### Fase 2 — eerste soortspecifieke responskaarten voltooid (19 november 2026)

De huidige bewijsdekking voor alle tien profielen is vastgelegd in `FASE2_PROGNOSE_AUDIT.md` §110 (architectuur §101). Karper, zeelt en snoekbaars hebben beperkte directe maar contextgebonden temperatuur-/voedingsstudies. Voor brasem, snoek, baars, blankvoorn, meerval en roofblei is de huidige registry onvoldoende voor een eigen gekwantificeerde temperatuur-voedingscurve. `Overig` blijft een generiek fallback-profiel en geen gevalideerde soort.

**Volgende werkzaamheden:** primaire bronmethoden en data van de drie beperkte directe studies verifiëren; ontbrekende soorten gericht onderzoeken; tijdritmebronnen scheiden naar directe voeding versus beweging/habitat; pas daarna referentieankers en kandidaatresponsfuncties ontwerpen. Geen runtimewijziging of bron goedgekeurd.


### Fase 2 — responslabels verder gescheiden (19 november 2026)

Audit §111 verduidelijkt dat voedselopname, foerageersnelheid, locomotorische activiteit en vangst verschillende eindpunten zijn. Met name de juveniele karperstudie meet foerageersnelheid en mag niet als adult-voedselopnamecurve worden gebruikt. Geen bronstatus, parameter of runtime gewijzigd.

### Fase 2 — geactualiseerde acceptatiecrosswalk en vervolgfase (19 november 2026)

De audit bevat nu een geactualiseerde zevenpunts-crosswalk in FASE2_PROGNOSE_AUDIT.md §129. De factorinventaris en soortresponskaarten (§§102–128), het productdoel (§103), de minimale vangstregistratie (§104), de factor-naar-responsmatrix (§105) en de normalisatie-/coverage-architectuur (§106) zijn vastgelegd. De audit is daarmee inhoudelijk veel verder, maar Fase 2 is **niet formeel geaccepteerd**.

De belangrijkste resterende blockers zijn: (1) onafhankelijke onderbouwing/toelating van de voorlopige thermische parameters en scoremapping; (2) passende onafhankelijke labels en metrics voor activiteit, voeding, habitat en tijdvak; (3) een tijdvakbeoordeling die niet simpelweg dezelfde dagthermische waarde hergebruikt; (4) controle van de bestaande vangstflow tegen het minimale contract; en (5) een expliciet besluit over de afzonderlijke numerieke voorvoergrammen bij onvoldoende invoerkwaliteit. De bestaande 1–10-score, gebruikersflow en scheiding met persoonlijke vangstkans blijven behouden.

**Volgende stap:** audit van het bestaande sessie-/vangst-/snapshotdatamodel om vast te stellen welke evaluatielabels werkelijk beschikbaar zijn. Geen extra verplichte invoer, geen nieuwe gewichten of runtimewijziging. Fase 3 blijft geblokkeerd tot formele Fase-2-acceptatie.

De documentintegriteitscorrectie PR #175 is gemerged als abe721db42d2d4e8bb7eb222e46a72d167cdc816. De Quality Gate op de mergecommit is completed/success.

### Fase 2 — sessie-, vangst- en snapshotlabels geaudit (19 november 2026)

De datamodelaudit staat in FASE2_PROGNOSE_AUDIT.md §130. De bestaande data ondersteunen al (1) persoonlijke vangstkans via afgeronde sessie-uitkomsten en vooraf opgeslagen snapshots, (2) watertemperatuurvalidatie via voorspelde versus achteraf gemeten waarden, en (3) beperkte beschrijvende tijdvakdiagnostiek via expliciete hengeluren en betrouwbaar aangepaste vangsttijdstippen.

De belangrijkste beperking is dat er geen directe lokale labels voor fysiologische activiteit of voedselopname bestaan. Een vangst, aanbeet, gemiste vis, beweging of aanwezigheidssignaal mag niet als directe voedingsmeting worden gebruikt. De bestaande Brier-evaluator toetst alleen persoonlijke vangstkans; de tijdvakbewijs-audit is beschrijvend en geen gekalibreerde tijdvakvoorspeller. Optionele hengelintervallen blijven de enige betrouwbare basis voor geregistreerde blootstelling; ontbrekende inzet wordt niet geschat.

De automatische vangsttijd bij openen van het formulier blijft gebruikersvriendelijk, maar wordt niet als werkelijk vangstmoment gebruikt zolang de gebruiker deze niet aanpast. SessionRodEvent bevat optionele tijdgebonden aanbeten/gemiste vissen/vangsten, maar wordt nog niet door de tijdvakbewijs-audit verwerkt; eerst moet soorttoeschrijving, exposure en dubbeltelling worden beoordeeld. Geen extra verplichte invoer of runtimewijziging.

**Volgende stap:** ontwerp de afzonderlijke evaluatiemaatstaven en minimumvoorwaarden per respons op basis van deze aantoonbaar beschikbare labels. Fase 2 blijft niet geaccepteerd; Fase 3 blijft geblokkeerd.

### Fase 2 — evaluatiekader per biologische respons uitgewerkt (19 november 2026)

De kandidaatmetrics en harde labelgrenzen staan in FASE2_PROGNOSE_AUDIT.md §131. Iedere metric toetst uitsluitend het eindpunt dat daadwerkelijk is gemeten: temperatuur-MAE/RMSE/bias voor de temperatuurschatter; Brier/BSS uitsluitend voor persoonlijke vangstkans; directe activiteit-/voedingslabels voor de biologische respons; en expliciete blootstelling voor tijdvak-vangbaarheidsanalyse.

Er zijn geen lokale directe labels voor fysiologische activiteit, voedselopname of biologische tijdvakvoorkeur. Vangsten, aanbeten, gemiste vissen, beweging en opportunistische aanwezigheidssignalen mogen deze labels niet vervangen. De bestaande tijdvakblootstellings- en vangstbewijs-audit is beschrijvend en nog geen gekalibreerde voorspeller. Geen extra verplichte invoer, nieuwe metric in runtime, gewichten of scorewijziging.

**Volgende stap:** sluit de factor-toelatingsmatrix per soort en respons met bronstatus, invoerkwaliteit, toepassingsgebied, label, metric en expliciet besluit (numeriek kandidaat/context/onbekend/uitgesloten). Daarna volgt de finale kandidaatmodelreview; Fase 2 blijft niet geaccepteerd en Fase 3 geblokkeerd.

### Fase 2 — factor-toelatingsmatrix per respons en soort gesloten (19 november 2026)

De geconsolideerde toelatingsmatrix staat in FASE2_PROGNOSE_AUDIT.md §132. De factorinventaris is nu per factorfamilie en per doelsoort ingedeeld als voorlopige numerieke prior, numerieke kandidaat, contextueel, onbekend of afzonderlijke responslaag. De registry bevat 86 records, waarvan 0 goedgekeurd zijn voor directe numerieke voorspelling. Geen van de tien profielen heeft een volledig gevalideerde soortspecifieke dagelijkse thermische voedselopnamecurve.

De enige numerieke bijdrage aan de biologische 1–10-dagscore blijft de bestaande thermische prior uit optie A; dit is een expliciete voorlopige uitzondering, geen wetenschappelijke validatie. Voorvoergrammen en habitat-/positioneringsdrempels blijven aparte tactiek-/ruimtelijke heuristieken. Geen nieuwe gewichten, factoren, interacties of tijdvakbonussen.

**Resterend:** formeel bepalen hoe de voorlopige thermische uitzondering binnen criterium 2 wordt geaccepteerd zonder de bewijsnorm te verlagen; de onafhankelijke evaluatiepoorten blijven open wegens ontbrekende directe lokale biologische labels. De afzonderlijke voorvoergrammen-/invoerkwaliteitbeslissing vereist eveneens expliciete goedkeuring voordat runtime wordt aangepast. Fase 2 blijft niet geaccepteerd; Fase 3 geblokkeerd.

### Fase 2 — vangstregistratiecontract tegen huidige UI gecontroleerd (19 november 2026)

De read-only conformiteitscontrole staat in FASE2_PROGNOSE_AUDIT.md §133. De gebruiker kan met een gekozen soort direct opslaan: aantal staat standaard op 1, vangsttijd wordt automatisch gevuld en blijft aanpasbaar, gewicht/lengte/aas/techniek/foto/notities zijn optioneel. De basisflow vereist geen extra invoer buiten de soortkeuze.

**Afwijking:** de vastgelegde wens noemt een optionele vooraf ingestelde hengel-/methodeconfiguratie. De huidige CatchModal heeft hiervoor alleen een vrij tekstveld en het CatchItem bevat geen herbruikbare profielreferentie. SessionRod is sessiegebonden en is geen gebruikerspreset.

Er wordt niets aangepast zonder expliciet productbesluit: óf de vrije tekst is voldoende en §104 wordt daarop verduidelijkt, óf een kleine optionele presetselectie wordt apart ontworpen. In beide gevallen blijft opslaan zonder hengel-/methodekeuze mogelijk. Geen runtimewijziging of migratie.


### Fase 2 — finale kandidaatmodelreview uitgevoerd (20 november 2026)

De read-only review van de actuele main-code en kandidaatarchitectuur staat in `FASE2_PROGNOSE_AUDIT.md` §134 en is samengevat in `MODELARCHITECTUUR_FASE2.md` §107. De kandidaat blijft één versiebeheerste modulaire prognoseketen; er komt geen tweede totaalmodel of ongedifferentieerde factorsom.

De huidige biologische 1–10-score blijft uitsluitend de voorlopige thermische prior. De voedingsbewijsservice heeft 0 goedgekeurde numerieke bronnen; habitat/positionering, persoonlijke vangstkans/Brier en voorvoergrammen blijven aparte lagen. Dezelfde thermische dagrespons wordt nu in de vier tijdvakken hergebruikt. Er ontbreken directe lokale labels om een samengesteld activiteit-/voedingsmodel onafhankelijk te valideren.

**Reviewuitkomst:** kandidaatarchitectuur inhoudelijk beoordeeld, kandidaatmodel niet numeriek toegelaten. Optie A blijft een expliciete voorlopige baseline-uitzondering, geen wetenschappelijke validatie. Geen runtime-, score-, parameter-, gewicht-, interactie- of UI-wijziging. Fase 2 blijft niet geaccepteerd; Fase 3 geblokkeerd.

**Volgende werkzaamheden:** expliciete eigenaarbesluiten vastleggen voor (1) de beperkte thermische optie-A-uitzondering, (2) de afzonderlijke voorvoergrammen bij lage invoerkwaliteit en (3) vrije tekst versus optionele hengel-/methodepreset. Parallel wordt alleen waar zinvol gezocht naar onafhankelijke directe biologische datasets; daarna volgen responsankers en chronologische baselinevergelijking. Geen extra verplichte gebruikersinvoer.


### Fase 2 — directe 0+-snoekvoedingsdataset uit 2026 toegevoegd (20 november 2026)

Een nieuwe open publicatie-/datasetcombinatie is gecontroleerd en toegevoegd aan `researchRegistry.ts`: Nilsson-Örtman et al. (2026), DOI 10.1111/1365-2656.70233, met reproduceerbare Dryad-data/code, DOI 10.5061/dryad.kkwh70sjc. De studie meet daadwerkelijk gegeten prooien door jonge 0+-snoek in 192 temperatuur-/zichtproeven en 80 aanvullende verbruiningproeven. De temperatuureffecten op voedingssnelheid waren opvallend zwak; de responsvorm was alleen bij 5 °C in helder water duidelijk koepelvormig.

De bron is geclassificeerd als directe `feeding_intensity`, bewijssterkte limited en niet-goedgekeurd voor voorspelling. De jonge levensfase, laboratoriumsetting, kleine Zuid-Zweedse populatie en prooidichtheidsafhankelijkheid verhinderen overdracht naar volwassen snoek in Nederlandse wateren. De volwassen snoeken in de studie leverden uitsluitend lichaamstemperatuurdata, geen voedingslabels. Het Snoek-profiel verwijst nu ook naar deze bron en de registrytest bewaakt de scope en niet-goedkeurde status.

Registry: 87 records, 0 goedgekeurd. Geen score-, parameter-, gewicht- of runtimewijziging.


### Fase 2 — aanvullende veldrantsoenbronnen voor karper, brasem en blankvoorn getrieerd (20 november 2026)

Twee oudere veldstudies zijn toegevoegd als beperkte, niet-goedgekeurde voedingsintensiteitsbronnen: Garcia & Adelman (1985) voor karper en Specziár (2002) voor karper, brasem en blankvoorn. Beide schatten dagelijkse rantsoenen via maag-/darminhoud en ledigingsmodellen. Garcia rapporteert geen statistisch significant ochtend-/avondverschil; Specziár rapporteert temperatuurrelaties voor karper/blankvoorn, terwijl de brasemrelatie gevoelig is voor één uitgesloten waarneming.

De methoden en steekproefcontext zijn nog niet volledig geverifieerd. De bronnen zijn geen lokale onafhankelijke labels en valideren geen bestaande thermische profielcurve. Registry: 89 records, 0 numeriek goedgekeurd. Geen runtimefactor, gewicht of tijdvakbonus geactiveerd.


### Fase 2 — volwassen baars veldrantsoen toegevoegd als beperkte bron (20 november 2026)

Thorpe (1977) is geregistreerd voor volwassen baars: 24-uurscycli met drie-uurlijkse bemonstering in de zomer; modelgeschat rantsoen daalde van circa 6,5% lichaamsgewicht/dag in juni naar 3,2% in september. Door tragere maaglediging bij kooivissen zijn dit minimale schattingen. De bron bevat in de publiek beschikbare samenvatting geen watertemperatuurreeks en valideert dus geen thermische curve.

Bron blijft limited en approvedForPrediction=false. Registry: 90 records, 0 numeriek goedgekeurd. Geen runtimefactor of tijdvakbonus geactiveerd.


### Fase 2 — snoekdataset 2026: primaire broncontext aangescherpt (20 november 2026)

De volledige primaire publicatie is vergeleken met de Dryad-metadata. De zes volwassen snoeken met lichaamstemperatuursensoren werden twaalf maanden gevolgd in drie experimentele vijvers; dit is geen representatieve natuurlijke veldpopulatie en bevat geen voedingslabels. De Dryad-paginabeschrijving noemt ze vrijlevend, maar de primaire methodesectie is leidend.

Er is ook een discrepantie vastgelegd: de paper noemt 24 0+-snoeken in experiment 1 en drie uitgesloten proefwaarnemingen; de Dryad-README noemt n=23 en spreekt van drie individuen. Experiment 2 sluit afzonderlijk twee dieren uit wegens schimmelinfectie. De ruwe data/R-code konden via Dryad niet worden gedownload (HTTP 403), dus geen onafhankelijke heruitvoering geclaimd. Bron blijft limited en approvedForPrediction=false. Geen runtimewijziging. Zie audit §138.


### Fase 2 — larvale baars/snoekbaars veldrantsoen toegevoegd (20 november 2026)

Worischka & Mehner (1998) is als beperkte veldgebaseerde feeding_intensity-bron toegevoegd voor larvale baars en snoekbaars. De dagelijkse rantsoenen zijn afgeleid uit uurlijkse maagvulling over 24 uur en lineaire/exponentiële maagledigingsfuncties; gerapporteerd is 0,21–0,27 g/g/dag voor larvale baars (13,1 mm) en 0,31–0,40 g/g/dag voor larvale snoekbaars (10,6 mm). Iedere derde uurmeting gaf slechts 41–72% van de schatting met uurlijkse bemonstering. De volledige primaire tekst was niet toegankelijk, zodat locatie, steekproef en temperatuurcontext nog niet zijn geverifieerd. Bron blijft limited en approvedForPrediction=false; geen runtimewijziging. Zie audit §139.


### Fase 2 — volwassen baars/blankvoorn seizoensrantsoen toegevoegd (20 november 2026)

Jamet (1994) is geregistreerd voor volwassen baars en blankvoorn als beperkte veldbron voor dagelijkse voedingsintensiteit en dieet. Maandelijkse maaginhoudsmonsters in één eutroof Frans meer (april 1987–juli 1988) zijn via het Eggers-model omgezet in dagelijkse consumptieschattingen met temperatuurafhankelijke maaglediging. De methode levert geen directe individuele inname of sessiegebonden tijdvaklabel; seizoen, prooiaanbod, zuurstof en habitat zijn verweven. Bron blijft limited en approvedForPrediction=false. Zie audit §140.


### Fase 2 — leeftijds- en methodeoverdracht verder afgebakend (20 november 2026)

De audit §§141–145 voegen drie broncontroles toe: leeftijdsafhankelijk voedingsritme bij blankvoorn (Jamet et al. 1990), juveniele kweekvoerbehoefte bij meerval (Filipiak et al. 1997) en primaire methodeverificatie van Eggers-consumptieschattingen bij volwassen baars/blankvoorn (Jamet 1994).

De resultaten versterken de scheiding tussen direct voedingsritme, dagelijkse kweekvoerbehoefte, modelgeschatte populatieconsumptie en individuele voedselopname. Geen van deze bronnen valideert een lokale Nederlandse thermische curve, universele tijdvakbonus of vangstkans. Alle blijven buiten actieve parameters; Fase 2 blijft open en Fase 3 geblokkeerd.


### Fase 2 — zevenpunts-acceptatiecrosswalk herijkt (20 november 2026)

De formele crosswalk in `FASE2_PROGNOSE_AUDIT.md` §89 is bijgewerkt op basis van de actuele kandidaatmodelreview en broninventaris. De registry telt 92 unieke records, 0 numeriek goedgekeurd. Optie A is de expliciet geaccepteerde productkeuze: de thermische curves blijven een voorlopige prior, niet een gevalideerde voedings- of vangstcurve.

De resterende blockers zijn de geïntegreerde biologische dagscore, overdraagbare soort-/levensfase-evidence, directe lokale biologische labels, een gevalideerde tijdvakrespons en twee afzonderlijke tactische productbesluiten (voorvoerhoeveelheden/gating en optionele hengel-/methodepreset). Fase 2 blijft open; Fase 3 blijft geblokkeerd.


### Fase 2 — meervalbron 2025 methodologisch aangescherpt (20 november 2026)

Yazici et al. (2025) is op de volledige primaire tekst gecontroleerd. De studie gebruikt maandelijkse maagvullingsindices bij 200 meervallen. Het winter-FI maximum (0,827) berust op slechts n=7; de andere seizoensgroepen tellen 49, 98 en 46 vissen. Leeftijdsgroepen zijn eveneens ongelijk. Er is geen directe individuele opname, watertemperatuurcurve of diel-label. Registry blijft niet-goedgekeurd; geen winterbonus of runtimefactor. Zie audit §144.


### Fase 2 — snoekbron 2025 statistische rapportage aangescherpt (20 november 2026)

De volledige primaire PDF van Yazıcıoğlu et al. (2025) is gecontroleerd. De FI-seizoenswaarden zijn numeriek, maar de abstracttekst is intern tegenstrijdig over significantie (p<0,05 terwijl de tekst “niet significant” zegt); de resultaten rapporteren geen eenduidige aparte FI-teststatistiek. De temperatuurcorrelatie is expliciet zwak en niet significant (r_s=0,117; p>0,05). Geen thermische curve of seizoensbonus. Zie audit §145.


### Fase 2 — PR #189 afgerond en formele status bijgewerkt (20 november 2026)

PR #189 is gemerged en zowel de exacte PR-head als mergecommit Quality Gate zijn groen. De broncontroles staan in audit §§141–145; de afgeronde gate en documentatiestatus in §146; de actuele zevenpunts-crosswalk in §89. Registry: 92 records, 0 numeriek goedgekeurd.

Optie A is als eigenaarbesluit gesloten. De thermische curve blijft een voorlopige prior, niet een gevalideerde voedingscurve. Fase 2 blijft open wegens de nog niet gerealiseerde geïntegreerde biologische score, ontbrekende directe lokale biologische labels, ontbrekende gevalideerde tijdvakrespons en open productbesluiten over voorvoerhoeveelheden/gating en optionele hengel-/methodepreset. Fase 3 blijft geblokkeerd.


### Fase 2 — dieetgebonden blankvoornritme verder afgebakend (20 november 2026)

Prejs (1978) is als primaire bron toegevoegd na volledige PDF-controle. Macrophyten-etende blankvoorn vertoonde in één specifieke veldcontext vrijwel geen plantenopname tijdens volledige duisternis; de auteur stelt expliciet dat dit niet als soortbrede regel geldt. De geschatte dagelijkse plantenrantsoenen komen uit een passage-rate-methode en zijn geen individuele directe veldmetingen. Geen method-feeder-/pelletvertaling of tijdvakbonus. Registry: 93 records, 0 numeriek goedgekeurd. Zie audit §147.


### Fase 2 — broninventaris naar 93 records uitgebreid (20 november 2026)

Prejs (1978) is als 93e bron toegevoegd met beperkte, dieet-/populatiegebonden blankvoorn-feeding-rhythm evidence. Geen overdracht naar method-feederpellets, thermische curve of soortbrede tijdvakbonus. PR #191 is gemerged; exacte PR-head en mergecommit Quality Gates zijn volledig geslaagd. Fase 2 blijft open; Fase 3 geblokkeerd.


### Fase 2 — engine-gerichte herprioritering en stopcriteria (20 november 2026)

De verdere Fase-2-uitvoering richt zich primair op de prognose-engine, niet op het vergroten van de literatuurregistratie. Audit §149 en modelarchitectuur §124 leggen de nieuwe werkvolgorde vast:

1. doelrespons en samenstelling van de bestaande 1–10-dagscore;
2. factor-/featurecontracten, normalisatie, ontbrekende data, onzekerheid, interacties en dubbeltelling;
3. tijdspecifieke respons voor de vier tijdvakken;
4. onafhankelijke evaluatie per biologische respons, met passende labels, metrics, chronologische toetsing en baselines.

Bestaande water-, habitat-, wind- en positioneringsengines worden hergebruikt. Extra soortkennis over beweging en habitat blijft optimalisatie voor later, tenzij zij een concrete enginebeslissing verandert. Nieuwe bronnen worden alleen uitgewerkt als zij een responsclassificatie, parameter-/vormkeuze, overdraagbaarheidsgrens, tijdvaklogica of evaluatieontwerp kunnen veranderen. Geen bronquota of geforceerde soortcurves.

Voorvoergrammen en optionele hengel-/methodepresets blijven afzonderlijke tactiek-/productbesluiten en blokkeren het biologische engine-ontwerp niet. Geen runtimefactor, gewicht, scoremapping of extra verplichte invoer is door deze herprioritering gewijzigd. Lokale labels blijven noodzakelijk voor latere lokale kalibratie en prestatieclaims, maar worden niet als voorwaarde gebruikt om het ontwerp zelf te documenteren. Fase 2 blijft open; Fase 3 geblokkeerd.

### Fase 2 — enginecontract en tijdvaklogica (20 november 2026)

Audit §150 en modelarchitectuur §125 leggen de volgende inhoudelijke ontwerpstap vast: de engine krijgt een expliciete verwerkingsketen van context/provenance, thermische prior, directe voedings-/foerageerrespons, alleen onderbouwde tijd-/omgevingsmodulatie, aparte habitat-/vangbaarheidslagen, scorecompositie, onzekerheid en onafhankelijke evaluatie.

De vier bestaande tijdvakken zijn 00–06, 06–12, 12–18 en 18–24. De huidige implementatie hergebruikt dezelfde dagbrede thermische analyse voor elk tijdvak; er bestaat dus nog geen afzonderlijk gevalideerde biologische tijdvakrangorde. Tijdvakvoorspelling vereist tijdspecifieke waterinformatie en directe voedings-/foerageerlabels. Geen generieke schemerbonus.

Thermische efficiëntie, voedselopname en tijdvakvoorkeur worden niet opgeteld voordat een gemeenschappelijke onafhankelijke referentie en vaste scoreankers bestaan. Geen runtime-, score-, UI- of invoerwijziging. Fase 2 blijft open; Fase 3 geblokkeerd.


### Fase 2 — gerichte controle van onafhankelijke datasets (20 november 2026)

Audit §151 registreert drie concrete openbare datasets. De controle vond geen overdraagbare onafhankelijke veldlabels die de samengestelde biologische dagscore of tijdvakvoeding nu kunnen valideren. De bronnen zijn wel nuttig voor responsafbakening: Norin et al. scheidt thermische fysiologie, beweging en dagtotaal voedselopname; Monk & Arlinghaus levert karper-/zeelttelemetrie en aasontmoeting/hengelvangbaarheid, geen werkelijk geconsumeerde hoeveelheid; Rieble et al. levert dagelijkse beweging van karper/baars, geen voedingslabels.

Besluit: geen van deze datasets wordt numeriek toegelaten voor de biologische score. Ze kunnen later uitsluitend voor hun eigen bewegings-/habitat-/vangbaarheidsrespons worden hergebruikt. De registry is bijgewerkt met één contextuele Cunner-bron (94 records, 0 numeriek goedgekeurd). Geen runtime-, score- of UI-wijziging; Fase 2 blijft open.


### Fase 2 — tijdresolutie van de waterthermische engine (20 november 2026)

Audit §152 documenteert een concrete codebevinding: de waterthermische engine retourneert één watertemperatuurschatting per doeldag; de gedeclareerde targetHour-optie wordt niet gebruikt en prognosisEngine deelt dezelfde thermalAnalysis met de vier tijdvakken. Uurlijkse weersdata is dus nog geen tijdspecifieke watertemperatuur.

De volgende ontwerpstap is een minimale tijdstipgerichte API voor de bestaande waterThermalEngine, inclusief tijdzone, voorspelmoment, waterthermische toestand, provenance en onzekerheid. Geen interpolatie of directe omzetting van luchttemperatuur naar watertemperatuur. Ook na zo'n technische uitbreiding zijn directe voedingslabels nog nodig om een biologische tijdvakvoorkeur te onderbouwen. Geen runtimewijziging; Fase 2 blijft open.


### Fase 2 — bestaande thermische toestandsupdate verdiept (20 november 2026)

Audit §153 en modelarchitectuur §128 verduidelijken dat `waterThermalEngine` al een eenvoudige uurlijkse toestandsupdate uitvoert bij een bruikbaar echt meetanker en voldoende weersdekking. De code gebruikt onder meer vaste diepte-afhankelijke tijdconstanten, zonnestraling/bewolking en een windmengingproxy, maar retourneert één dagwaarde. Deze parameters zijn heuristisch; er is nog geen expliciet temperatuurprofiel per dieptelaag en meetdiepte wordt nog niet als volwaardige toestanddimensie benut.

Vastgelegd besluit: de bestaande `waterThermalEngine` verbeteren, geen nieuwe engine bouwen. Volgende stap is de volledige dataflow en dekking van waterdiepte, meetdiepte, meettijd, tijdzone en uurlijkse weersvelden controleren. Daarna volgt een minimale tijdstipgerichte API-/testspecificatie. Geen runtime-, score-, gewicht-, UI- of invoerwijziging. Fase 2 blijft open; Fase 3 geblokkeerd.


### Fase 2 — datastroom watermetingen en weersherkomst gecontroleerd (20 november 2026)

Audit §154 en modelarchitectuur §129 leggen vast:
- locatie-waterdiepte en fysieke meetdiepte zijn verschillende gegevens;
- de bestaande historische profielselectie gebruikt meetdiepte nog niet en kan daardoor metingen uit verschillende waterlagen combineren;
- de snelle prognose-invoer "Gemeten aan stek" heeft wel een invoermoment maar geen expliciet fysiek meettijdstip, methode of meetdiepte;
- uurlijkse weerdata zijn Open-Meteo-forceringen, geen watertemperatuur; tijdzoneparsing van Amsterdam-uurstrings moet reproduceerbaar worden gemaakt;
- forecast-as-of, berekeningstijd en gevraagd tijdstip moeten apart blijven.

Volgende stap: ontwerp de minimale meet-/toestandsspecificatie en regressietests voor meetdieptes, onbekende meetdiepte, tijdzone/DST, forecast-as-of en tijdstipupdates. Bestaande `waterThermalEngine` blijft de enige engine. Geen runtime-, database-, score-, gewicht-, UI- of invoerwijziging. Fase 2 blijft open; Fase 3 geblokkeerd.


### Fase 2 — minimale tijdstipgerichte enginecontractschets (20 november 2026)

Audit §155 en modelarchitectuur §130 leggen de gewenste contractrichting vast voor de bestaande `waterThermalEngine`: expliciet tijdzonebewust doelmoment, afzonderlijke forecast-as-of en berekeningstijd, meetanker met herkomst/meetdiepte, locatie-waterdiepte apart van meetdiepte, en onzekerheids-/provenance-uitvoer.

De voorkeursstrategie is één chronologische toestandsdoorloop die de temperatuurtoestand op meerdere tijdstippen vastlegt. Middag bouwt voort op ochtend; geen vier onafhankelijke dagberekeningen of kunstmatige temperatuurinterpolatie. De huidige tests dekken thermische demping en grove diepteklassen, maar nog niet tijdspecifieke continuïteit, meetdiepteselectie, DST/runtimezone en forecast-as-of.

Volgende stap: tijdzone-/meetdiepte-semantiek en reproduceerbare fixtures concretiseren. Daarna pas implementatievoorstel binnen de bestaande engine. Geen runtime-, database-, score-, gewicht-, UI- of invoerwijziging. Fase 2 blijft open; Fase 3 geblokkeerd.


### Fase 2 — closeoutcontrole en resterende uitvoeringspoorten (20 november 2026)

PR #201 is gemerged; exacte PR-head en mergecommit Quality Gates zijn volledig geslaagd. De sessiegebonden meetstrategie en thermische traagheid staan in audit §156 en modelarchitectuur §131. PROJECT_CONTEXT.md is niet gewijzigd.

De closeoutcontrole staat in audit §157 en modelarchitectuur §132. Zij scheidt architectuurontwerp, runtime-implementatie en empirische validatie. De factor-/responsarchitectuur is voldoende ontworpen; de registry telt 94 records en 0 numeriek goedgekeurde biologische bronnen. De thermische optie-A-prior blijft een voorlopige productuitzondering, geen wetenschappelijke validatie. Directe lokale labels voor fysiologische activiteit of voedselopname ontbreken; vangsten, aanbeten en beweging zijn geen vervangende voedingslabels.

Resterend: tijdstipgerichte chronologische waterthermische API, deterministische Europe/Amsterdam-/DST- en forecast-as-of-verwerking, historische profielselectie op meetdiepte en afzonderlijke registratie van fysieke watertemperatuurmeetmomenten met beschikbare weerscontext. FishingSession heeft nu één watertemperatuurveld; meerdere meetevents binnen één sessie zijn nog niet afzonderlijk gemodelleerd.

Twee tactische productpunten blijven gescheiden: (1) niet-gevalideerde exacte voorvoergrammen/temperatuurbanden en inconsistente confidence-gating; numerieke uitschakeling (optie B) is aanbevolen maar vraagt expliciete eigenaarstoestemming; (2) de gewenste optionele herbruikbare hengel-/methodepreset ontbreekt nog in de vangstflow. Geen van beide mag verplichte invoer worden.

**Status:** Fase 2 niet formeel geaccepteerd; Fase 3 geblokkeerd. De hoofdtaak is gerichte technische uitvoering en toetsing, niet meer brede literatuuruitbreiding. Zie FASE2_PROGNOSE_AUDIT.md §157.


### Fase 2 — voortgang punt 1: tijdstipgerichte thermische toestand (20 november 2026)

Punt 1 is afgerond in [PR #203](https://github.com/sennzor-wq/Vislogboek/pull/203). De bestaande waterthermische engine ondersteunt nu een expliciet doeltijdstip en de vier tijdvakken gebruiken elk een chronologisch berekende toestand vanaf hetzelfde meetanker. Een latere meting wordt niet teruggeprojecteerd op eerdere tijdvakken. Een eerste regressie in de dagscore is gevonden en hersteld; de volledige Quality Gate is daarna groen gegaan op zowel de PR-head als de mergecommit.

Geen wijziging aan de zichtbare 1–10-score, scoreformule, database, UI of gebruikersinvoer. Dit is technische implementatie, geen empirische validatie van de thermische tijdconstanten.

**Volgende stap: punt 2 — deterministische tijdzone-/DST-verwerking en expliciete forecast-as-of.** Zie audit §158. Fase 2 blijft open; fase 3 geblokkeerd.


### Fase 2 — voortgang punt 2: Amsterdamse tijd en forecast-as-of (20 november 2026)

Punt 2 is afgerond in [PR #205](https://github.com/sennzor-wq/Vislogboek/pull/205). Open-Meteo forecast- en archiefdata gebruiken Unix-tijdstempels die naar absolute UTC-ISO-tijden worden omgezet. Lokale datum-/uurselectie gebruikt Europe/Amsterdam; dubbele herfst-02:00 en niet-bestaande lente-02:00 zijn getest. Oude caches blijven leesbaar en worden bij gebruik genormaliseerd.

De ophaaltijd van de forecast (`weatherFetchedAt`) is onderscheiden van het berekeningstijdstip. Forecastdata met een latere of ongeldige as-of worden niet gebruikt. Daily zonsopkomst/-ondergang blijft compatibel met de bestaande schemerberekening. PR-head- en mergecommit-Quality-Gates zijn groen.

**Volgende stap: punt 3 — historische temperatuurprofielen selecteren op meetdiepte.** Zie audit §159. Fase 2 blijft open; fase 3 geblokkeerd.


### Fase 2 — voortgang punt 3: meetdieptebewuste historische profielen (20 november 2026)

Punt 3 is afgerond in [PR #207](https://github.com/sennzor-wq/Vislogboek/pull/207). Historische profielen mengen geen verschillende bekende meetdieptes en ook geen bekende met onbekende dieptes. Bij een expliciet doelmeetniveau wordt uitsluitend die laag geselecteerd; zonder doelmeetniveau wordt alleen een eenduidige laag gebruikt. Bij meerdere mogelijke lagen wordt geen profiel geforceerd. De geselecteerde diepte is als provenance beschikbaar.

De bestaande totale waterdiepte blijft een aparte vergelijkingsfactor voor nabijgelegen stekken. Geen schema-, UI- of verplichte invoerwijziging. De Quality Gate is groen op PR-head en mergecommit.

**Volgende stap: punt 4 — afzonderlijke sessiegebonden meetevents met meettijd en beschikbare weerscontext.** Zie audit §160. Fase 2 blijft open; fase 3 geblokkeerd.


### Fase 2 — uitvoering punt 4: meerdere sessiemetingen en weerscontext (20 november 2026)

Punt 4 is uitgewerkt in [PR #211](https://github.com/sennzor-wq/Vislogboek/pull/211). De sessie-editor ondersteunt meerdere afzonderlijke meetevents per vissessie, met fysiek meettijdstip, apart registratiemoment, bron/methode, optionele meetdiepte en beschikbare weerscontext. Het meettijdstip staat standaard op de actuele Amsterdamse tijd en is aanpasbaar. Er is geen dagelijkse meetplicht en geen verplichte extra invoer.

De events zijn als array in het bestaande sessierecord opgeslagen; daardoor is geen nieuwe IndexedDB-tabel of migratie nodig en blijven bestaande sessie-/backupstromen compatibel. De oude scalaire velden blijven de samenvatting van de meest recente bruikbare meting. Legacy metingen blijven behouden; onbekende meettijd wordt niet verzonnen.

Weerscontext wordt alleen gekoppeld wanneer een uurlijkse Open-Meteo-waarde maximaal 60 minuten van het fysieke meetmoment afligt. Bron, weeruur, ophaaltijd en offset worden vastgelegd. Ontbrekende context blijft onbekend. De fysieke meettijd wordt ook als anker aan de waterthermische engine doorgegeven. Historische profielen kunnen elk geldig meetevent afzonderlijk gebruiken; dubbele snapshotkopieën tellen niet dubbel mee. Events met onbekende methode/herkomst blijven opgeslagen maar worden niet als gevalideerde profielmetingen gebruikt.

**Status:** implementatie en regressietests staan in PR #211; formele afvinking volgt uitsluitend na groene Quality Gate op de definitieve PR-head en mergecommit. Zie audit §161. Fase 2 blijft open; fase 3 geblokkeerd.

### Fase 2 — punt 4 afgerond; punt 5 startklaar (20 november 2026)

Punt 4 is afgerond in [PR #211](https://github.com/sennzor-wq/Vislogboek/pull/211). De PR-head én mergecommit Quality Gates zijn volledig groen. De sessie-editor ondersteunt afzonderlijke meetevents met fysiek meettijdstip, apart registratiemoment, optionele meetmethode/-diepte en beschikbare weerscontext. Het meettijdstip wordt ook als thermisch anker doorgegeven. Ontbrekende context blijft onbekend; er is geen dagelijkse meetplicht, verplichte invoer, nieuwe IndexedDB-tabel of migratie.

De back-upcompatibiliteit, historische profielketen, VisCoach-trigger en weerscontextmatching zijn getest. De registratieketen is technisch gevalideerd; fysieke thermische tijdconstanten nog niet. Zie audit §162.

**Volgende stap: punt 5 — voorvoeradviezen en confidence-gating auditen.** De exacte gramadviezen/temperatuurgrenzen zijn niet gevalideerd. We voeren geen runtimewijziging uit voordat het productbesluit expliciet is goedgekeurd. Fase 2 blijft open; fase 3 geblokkeerd.


### Fase 2 — werkonderdeel 8 afgerond: factor-/respons-crosswalk en sessie-intervalcontract (22 november 2026)

Werkonderdeel 8 is afgerond als read-only audit en contractvoorstel. De actuele factor-/respons-crosswalk en runtime-mapping staan in FASE2_PROGNOSE_AUDIT.md §§186–191; de intervalcontractuitwerking staat in §192 en MODELARCHITECTUUR_FASE2.md §§152–157.

De audit heeft de zes zichtbare prognosefactoren, aanvullende biologische responsen, persoonlijke vangstkans, aanwezigheid/habitat, positionering, voorvoer en historische sessiefeatures gekoppeld aan hun werkelijke invoer, runtimeconsumptie, bestaande registry-bewijs en validatiegrenzen. De registry telt 94 records, 0 numeriek goedgekeurd. De bestaande 1–10-score blijft bedoeld voor biologische activiteit-/voedings-/foerageerpotentie; persoonlijke vangstkans, habitat-aanwezigheid, vangbaarheid en tactiek blijven afzonderlijke respons-/advieslagen. VisCoach gebruikt de Prognose en vertaalt die naar een samenhangend plan; er komt geen tweede VisCoach-prognose.

VisCoach heeft al een gepland start-/eindinterval en bewaart dit in de snapshot/fingerprint, maar de prognose beoordeelt het volledige interval nog niet. Het contractvoorstel kiest als voorkeursrichting een hybride segmentatie op uurlijkse forecaststappen en tijdvak-/datumgrenzen, met voedingsbewijs uitsluitend op de resolutie van de bron. Een sessie zonder eindtijd krijgt geen verzonnen duur- of intervalscore. De persoonlijke Poisson-vangkans blijft apart.

**Nieuwe technische voorwaarde:** vóór intervalscoring moet de tijdstipgerichte waterThermalEngine een strikte as-of-invariant aantonen. De ankergestuurde update gebruikt weer tot targetTime, maar fallback-/contextpaden kunnen volledige doeldagstatistiek en noon-gecentreerde 24-/72-uursvensters gebruiken. Een metamorfische regressietest moet aantonen dat wijziging van weeruren ná het doelmoment de eerdere thermische toestand niet wijzigt. Zie audit §192.2.

Geen runtimecode, types, scoreformule, gewichten, drempels, UI, database, snapshots of gebruikersdata gewijzigd. Geen tests of biologische validatie geclaimd.

**Volgende stap volgens de bestaande Fase-2-uitvoeringsvolgorde: punt 5 — read-only audit van voorvoeradviezen en confidence-gating in de algemene Prognosepagina versus VisCoach.** Exacte gramadviezen/temperatuurgrenzen of gating worden niet gewijzigd zonder expliciet productbesluit. Daarna wordt de resterende score-/intervalarchitectuur verder uitgewerkt; de strikte thermische as-of-poort blijft verplicht vóór intervalimplementatie. Fase 2 blijft open; Fase 3 blijft geblokkeerd.


### Fase 2 — correctie status punt 5 en actuele volgende poort (22 november 2026)

Correctie op de vorige uitvoeringsnotitie: **punt 5 (voorvoerengine behouden en confidence-gating) is al afgerond**, niet startklaar. Het eigenaarbesluit staat in audit §163 en de technische afronding/Quality Gate in §170. De actuele code bevestigt dat PrognosisView exacte grammen alleen bij Redelijk toont; VisCoach toont sessiegrammen bovendien alleen bij een expliciet bekende sessieduur. Redelijk betekent invoercompleetheid, niet biologische validatie van grammen of temperatuurgrenzen. De engine-uitvoer is op eigenaarbesluit behouden; geen parameterwijziging nodig. Het optionele hengel-/methodepresetbesluit blijft apart open. Zie audit §193.

**Volgende technische poort:** voer een gerichte audit/testvoorbereiding uit voor de strikte targetTime-as-of-invariant in de bestaande waterThermalEngine, zoals vastgelegd in audit §192.2. De ankergestuurde route gebruikt chronologische weeruren tot het doelmoment, maar fallback-/contextpaden gebruiken nog volledige doeldagstatistiek en noon-gecentreerde 24-/72-uursvensters. Wijzig geen enginegedrag voordat de exacte testgevallen en verwachte uitkomsten zijn vastgesteld. Daarna kan de bestaande intervalcontractvoorkeur worden voorbereid voor implementatie. Fase 2 blijft open; Fase 3 blijft geblokkeerd.


### Fase 2 — nieuwe technische poort: strikte targetTime-as-of-invariant (22 november 2026)

Audit §194 heeft een gerichte beperking in de bestaande waterThermalEngine vastgesteld. De ankergestuurde route met bekend meetanker, bekende diepte en voldoende dekking gebruikt weer chronologisch tot het doelmoment. Dagbrede statistieken en noon-gecentreerde 24-/72-uursvensters blijven echter in trend-/context- en fallbackroutes actief. De huidige tests veranderen niet uitsluitend de weeruren ná targetTime en bewijzen daarom nog geen strikte tijdstipinvariant.

**Volgende stap:** test-first wijziging van de bestaande waterThermalEngine om te garanderen dat latere forecasturen de temperatuur op een eerder targetTime niet veranderen, en dat rolling 24-/72-uursvensters exact op targetTime eindigen. Test meetanker, historisch profiel, weather-only, onbekende diepte, onvoldoende dekking, vroege/middag/late doelmomenten, ontbrekende uren en DST. Behoud de bestaande ankergestuurde route en gebruik geen nieuwe tijdconstanten of biologische correcties. Zie audit §194 en architectuur §159.

Dit is een technische voorwaarde vóór de intervalscore. Geen runtimewijziging uitgevoerd in de read-only audit. Fase 2 blijft open; Fase 3 blijft geblokkeerd.



### Fase 2 — uitvoering minimale targetTime-as-of-correctie (22 november 2026)

De gerichte regressietest uit audit §194 is uitgevoerd. De eerste run bevestigde future-weather leakage in de weather-only schatting en thermische trend. Daarna is de bestaande `waterThermalEngine` minimaal aangepast: bij expliciet `targetTime` gebruiken de tijdstipgebonden doeldagkenmerken uitsluitend forecasturen tot en met dat tijdstip en eindigen de 24-/72-uursvensters op het exacte doelmoment. De bestaande dagbrede modus zonder expliciet doelmoment en de ankergestuurde chronologische extrapolatie zijn behouden. Voldoende voorafgaande 72-uursdekking kan een vroeg doelmoment met minder dan zes doeldaguren ondersteunen; toekomstige uren vullen die dekking niet aan.

Scenario 8.5 slaagt nu voor alle vier assertions (weather-only temperatuur en trend; meetanker-temperatuur en trend). GitHub Actions Quality Gate run 1096 is volledig groen: typecheck, timezone/DST-suite, kernprognose/thermische tests (71/0), overige tests, productiebuild en private-artifactcontrole.

De eerste testvariant bracht twee bestaande tests over gelijke tijdvaksscores aan het licht die nog een variabele doeldag gebruikten. De testfixture is aangepast naar een werkelijk stabiele meerdaagse reeks; de tijdspecifieke prognose wordt niet teruggezet naar dagbrede toekomstige informatie om oude gelijke-scores te forceren.

**Status:** minimale correctie technisch groen, PR #214 blijft draft en niet gemerged. De volledige randgevallenmatrix uit audit §194.4 is nog niet afgedekt. Volgende stap: gerichte test-first validatie van historisch profiel, onbekende diepte, onvoldoende-dekkingfallback, doelmomenten vóór/exact op/na 12:00, ontbrekende uren en thermische DST-overgangen. Pas daarna kan de as-of-poort als volledig gesloten worden beschouwd en de intervalscore verder worden voorbereid. Fase 2 blijft open; Fase 3 blijft geblokkeerd.



### Fase 2 — aanvullende targetTime-randgevallenmatrix (22 november 2026)

Scenario 8.6 is test-first uitgebreid met onbekende diepte, historische metingen die ná het doelmoment plaatsvinden, onvoldoende weerdekking, expliciete doelmomenten 08:00/12:00/15:00, een ontbrekend uur en de Amsterdamse lente- en herfst-DST-overgang. De uitbreiding staat in commit `0e36c617221be36e32749ab2d6d6bcaf698b2316`. Alleen `test-thermal-and-prognosis.ts` is in deze stap aangepast; productiecode is ongemoeid gelaten.

**Status:** GitHub Actions Quality Gate run 1107 is volledig groen. Scenario 8.5/8.6 slagen; kernprognose-/thermische tests: 80 geslaagd, 0 mislukt. De expliciet geplande as-of-randgevallenmatrix is daarmee gevalideerd. Dit is geen formele afronding van Fase 2: overige auditpunten en formele acceptatie blijven vereist. Fase 3 blijft geblokkeerd. Zie audit §196.



### Fase 2 — contractaudit intervalgrenzen en PrognosisInputContext (22 november 2026)

De thermische targetTime-as-of-poort is gevalideerd in Quality Gate 1107. De volgende stap uit het bestaande intervalcontract (§192.5 stap 2) is read-only gecontroleerd in audit §197: geplande start/eindtijden worden al als absolute ISO-grenzen op de pending- en opgeslagen snapshot bewaard en door de evaluatie gebruikt, maar ontbreken nog in `PrognosisInputContext`.

De minimale richting is twee optionele contextvelden (`targetWindowStart`, `targetWindowEnd`) die vanuit exact hetzelfde genormaliseerde ISO-paar worden gevuld als de bestaande top-level snapshotvelden. Oude snapshots blijven geldig; top-level velden blijven bestaan voor evaluatie/backward compatibility; onbekende eindtijd blijft null en geen verzonnen duur. De inputfingerprint neemt de intervalgrenzen al op, maar moet na de contextuitbreiding expliciet op consistentie worden getest. `historyFingerprint` blijft ongewijzigd.

**Volgende stap:** test-first dekking voor oude snapshots, context/top-level gelijkheid, onbekende eindtijd, fingerprintwijziging en legacy evaluatiefallback. Eerst het datetime-local/runtimezonecontract bevestigen; nog geen segmentatiehelper, intervalscore, scoregewichten of biologische aannames wijzigen. Fase 2 blijft open; Fase 3 blijft geblokkeerd. Zie audit §197.



### Fase 2 — implementatie intervalvelden in PrognosisInputContext (22 november 2026)

Op basis van audit §197 zijn twee optionele velden toegevoegd aan `PrognosisInputContext`: `targetWindowStart` en `targetWindowEnd`. De VisCoach-planbuilder normaliseert de geplande grenzen één keer naar ISO en hergebruikt exact die waarden voor inputcontext, fingerprintpayload en snapshot. De bestaande top-level snapshotgrenzen, evaluatiecode, legacygedrag en `historyFingerprint` blijven ongewijzigd.

De nieuwe regressietest voert de echte planbuilder uit met een lokale weerscache en controleert bekende/ onbekende eindtijd, context-/snapshotgelijkheid en fingerprintwijziging bij een ander interval. Er is geen database-migratie, segmentatiehelper, intervalscore, scoregewicht of biologische wijziging toegevoegd.

**Status:** GitHub Actions Quality Gate run 1117 is volledig groen. De snapshotcontracttests eindigden op 19 geslaagd, 0 mislukt; typecheck, overige suites, productiebuild en audits zijn eveneens groen. De daaropvolgende branchwijzigingen zijn uitsluitend documentatie. Zie audit §197.5.



### Fase 2 — tijdzonecontract voor intervalsegmentatie vastgelegd (22 november 2026)

Audit §198 heeft de bestaande `datetime-local`-semantiek read-only vastgesteld: invoer wordt in de runtime-/apparaatzone geparseerd, de gebruikte zone wordt bewaard, en daarna worden absolute ISO UTC-grenzen opgeslagen. Kalenderdatum, tijdvak en segmentlabels blijven expliciet `Europe/Amsterdam`. De segmenthelper gebruikt absolute tijd voor duur/overlap en Amsterdamse tijd voor lokale grenzen; DST beïnvloedt dus de elapsed duur. Geen UI- of tijdzonecode gewijzigd.

**Volgende stap:** test-first bouw van de pure intervalsegmentatiehelper uit audit §192.5 stap 3, met gedeeltelijke uren, uurstappen, tijdvak-/middernachtgrenzen, ontbrekende forecasturen en DST. De helper levert alleen segmenten en dekking, geen biologische score. Zie audit §198.



### Fase 2 — pure segmentatiehelper voor geplande sessie-intervallen (22 november 2026)

De eerste pure helper `segmentPrognosisInterval` is toegevoegd in `src/services/prognosisIntervalEngine.ts`. Hij gebruikt de canonieke ISO-grenzen, splitst op absolute uurgrenzen, bewaart gedeeltelijke uren, labelt met Amsterdamse datum/tijdvak en maakt ontbrekende of dubbele forecasturen expliciet onbekend. Onbekende eindtijd levert geen segmenten/duur; intervallen boven 24 verstreken uren worden geweigerd. Er wordt geen score of biologische factor berekend.

De testmatrix dekt partial hours, middernacht/tijdvak, ontbrekende uurdata, forecasturen buiten het interval, DST, dubbele samples en ongeldige/>24-uursgrenzen. Quality Gate 1132 is volledig groen; `test-session-snapshot-commit.ts` eindigde op 30 geslaagd, 0 mislukt. Volgende stap: factorresolutie en factor-specifieke datadekking per segment vastleggen, zonder scoregewichten te kiezen. Zie audit §199.



### Fase 2 — factorresolutie en datadekking voor intervalintegratie (22 november 2026)

De pure segmentatiehelper is groen gevalideerd in Quality Gate 1132. Daarna is read-only in audit §200 vastgelegd hoe de bestaande factoren en modules hun gegevens nu ophalen: thermische respons per 6-uurs slot/representatief forecastmoment; druk, wind, bewolking en neerslag met eigen samplevalidatie; persoonlijke ervaring per sessiestarttijdvak; vangkans uit historische sessieduur en vangsten; tactische wind/habitat/positionering rond het gekozen starttijdvak; aanwezigheid als gebruikerswaarneming; voorvoer als planningscontext; hengelblootstelling als achteraf geregistreerde intervallen.

**Volgende stap:** per factor de exacte benodigde velden, lookback, tijdresolutie en minimale dekking mappen naar de nieuwe segmenten. De generieke segmentdekking mag niet als factorbeschikbaarheid worden gelezen. De bestaande thermische score blijft de enige numerieke activiteitsscore; andere factoren blijven context of aparte uitkomsten totdat bewijs een andere rol rechtvaardigt. Geen gewichten of biologische bonus/malus invoeren. Zie audit §200.



### Fase 2 — factorvelden, validatie en lookback uitgewerkt (22 november 2026)

Audit §201 legt de bestaande geldigheidsranges en tijdsvensters per weerfactor vast. Belangrijk: de huidige 3-uit-6 minimumdekking hoort bij vaste 6-uurs tijdvakken en mag niet automatisch naar korte geplande sessies worden vertaald. Wind vereist snelheid én richting; druktrend vereist een aparte voorafgaande meting; thermische waterontwikkeling heeft eigen 24-/72-uurs- en ankerregels; optionele zonnestraling/vochtigheid/dauwpunt mogen niet als nul worden behandeld.

**Volgende stap:** formele factorresolutie kiezen voor intervalsegmenten (uursegment, tijdvak, kalenderdag of sessiebreed) en per factor een dekkingstatus definiëren. Eerst technisch/semantisch onderbouwen; nog geen minimumpercentage, scoregewicht of biologische bonus/malus verzinnen. Zie audit §§200–201.


### Fase 2 — factorresolutiematrix voor geplande sessie-intervallen (23 november 2026)

Audit §202 heeft per factor de huidige code-resolutie, vereiste velden/lookback, intervalkandidaat en ontbrekende-datagedrag vastgelegd. De uitkomst bewaart de bestaande semantiek: thermiek is kandidaat per segment met eigen targetTime-/24-/72-uurslookback; druktrend blijft tijdstipgebonden met voorafgaande meting; druk, wind, bewolking en neerslag houden voorlopig hun 6-uurs factorcontract; seizoen is kalenderdagcontext; tijd/licht is tijdvak-/datumcontext; persoonlijke ervaring blijft sessiestarttijdvak; persoonlijke Poisson-vangkans blijft sessiebreed; aanwezigheid blijft een waarnemingsgebeurtenis; tactische oeverwind/habitat/positionering blijven rond het starttijdvak; voorvoer blijft doeldag-/campagnegebonden; hengelblootstelling blijft achteraf.

**Status:** read-only audit afgerond en gedocumenteerd. Geen runtimecode, score, drempel, weging of gebruikersdata gewijzigd. Er is geen intervalminimumpercentage gekozen. De generieke uursegmentatie geldt niet als factorbeschikbaarheid.

**Volgende stap:** een beperkt interval-outputcontract vastleggen en test-first valideren: welke factorcontext per segment kan worden getoond, welke uitkomsten sessiebreed blijven en welke gegevens bij onvoldoende dekking onbekend blijven. Geen scorewijziging of tweede prognose-engine. Fase 2 blijft open; Fase 3 blijft geblokkeerd. Zie audit §202 en architectuur §167.


### Fase 2 — scope van de bestaande Prognose-uitvoer en VisCoach-vertaling (23 november 2026)

Audit §203 controleert de huidige keten: VisCoach gebruikt dezelfde `calculateDayPrognosis`, de geselecteerde startperiode stuurt de tactische conclusie en de persoonlijke Poisson-vangkans is sessiebreed op basis van geplande duur. De huidige kaart toont echter een combinatie van dagbrede score/beoordeling, starttijdvakgerichte tactiek en sessieduurgebonden vangkans. De dagscore is geen intervalscore; het huidige UI-label “Visactiviteit” is te ruim voor de voorlopige thermische activiteitspotentie. Dit is alleen vastgelegd, niet aangepast.

**Volgende stap:** de kleinste backward-compatible interval-outputstructuur specificeren zonder bestaande `DayPrognosis`-velden anders te interpreteren. Eerst contracttests voor onbekende eindtijd, meerdere tijdvakken, gedeeltelijke/missende factorinvoer en scheiding tussen dag-, starttijdvak- en sessie-uitkomsten. Geen tweede engine of gecombineerde intervalscores. Fase 2 blijft open; Fase 3 blijft geblokkeerd. Zie audit §203 en architectuur §168.


### Fase 2 — backward-compatible interval-outputcontract (23 november 2026)

Audit §204 en architectuur §169 leggen de contractgrens vast. Een pure adapter hergebruikt de bestaande uursegmentatie en `DayPrognosis`: dagcontext, starttijdvakcontext en één sessiebrede vangkans blijven gescheiden. Per segment worden absolute grenzen/duur, Amsterdamse datum/tijdvak, forecastdekking en afzonderlijk gevalideerde beschrijvende weersamples geleverd. Ontbrekende/ongeldige waarden blijven `unknown/null`; ontbrekende uren blijven segmenten; onbekende eindtijd levert geen segmenten of duur.

De adapter markeert expliciet dat thermische activiteit niet per segment wordt herberekend, drukfactoren hun bestaande tijdvak-/lookbackcontract houden en wind/neerslag/bewolking uitsluitend beschrijvende context zijn. VisCoach hoort de segmenten chronologisch tot één advies samen te voegen, zonder eigen scores of tweede prognosemodel.

**Status:** dit was de tussenstand bij het vastleggen van het contract; de adapter en VisCoach-koppeling zijn inmiddels uitgevoerd. Zie de vervolgregel hieronder en audit §205.


### Fase 2 — intervaluitvoer aangesloten op VisCoach (23 november 2026)

Audit §205 en architectuur §170 documenteren de eerste end-to-end koppeling. De bestaande VisCoach-planbuilder hergebruikt de ene bestaande dagprognose en bouwt daarnaast het interval-outputobject met de al opgehaalde uurforecast. De bestaande adviesfunctie ontvangt dit object optioneel en maakt één chronologisch sessieverhaal: aangrenzende segmenten met gelijke weerscontext worden samengevoegd; ontbrekende waarden worden niet ingevuld; dagscore, starttactiek en sessiebrede vangkans blijven gescheiden. Oude sessieadvies-/reassessment-paden blijven ongewijzigd wanneer zij geen intervalobject aanbieden.

**Status:** nieuwe-planroute en UI zijn aangesloten; Quality Gate run 45156084460 op commit `779f38ed6e6bbd64920e97c2bbca9c4eb187f6d8` is volledig groen, inclusief typecheck, intervalcontract-/VisCoach-tests, regressies en productiebuild. De forecastdekkingstekst maakt onderscheid tussen aanwezigheid van uurrecords en geldigheid van individuele velden. Geen tweede prognosemodel, intervalscores of gewichten toegevoegd.


### Fase 2 — scoresemantiek en gereedheid thermische intervaluitvoer (23 november 2026)

Audit §206 heeft de actuele `main`-code gecontroleerd. De bestaande 1–10-score gebruikt uitsluitend de voorlopige soortspecifieke thermische temperatuurcurve (`1 + 9 * efficiency^0.85`); overige weers- en tijdsfactoren blijven context zonder numerieke bonus/aftrek. De huidige tijdvakscore gebruikt één representatief forecastmoment per tijdvak; de dagscore is het ongewogen gemiddelde van vier tijdvakuitkomsten en is geen sessie-intervalscore.

De intervaladapter bevat nu alleen segmentgrenzen, forecastdekking en afzonderlijk gevalideerde beschrijvende weersamples. Thermische activiteit is expliciet nog niet per segment berekend. Een kandidaat per segment kan de bestaande `waterThermalEngine` met exact `targetTime = segment.startTime` en dezelfde soortcurve hergebruiken, maar dit is nog niet geïmplementeerd of goedgekeurd.

**Volgende stap:** werkpakket 18 — test-first contracttests voor kandidaat thermische segmentuitvoer, bron-/onzekerheidsstatus, strikte as-of-invariant en behoud van bestaande dag-/tijdvak-/sessie-uitkomsten. Nog geen sessieaggregatie, minimumdekking, nieuwe gewichten of biologische factoren kiezen. Fase 2 blijft open; Fase 3 blijft geblokkeerd. Zie audit §206.


---

## Actuele uitvoeringsstatus en eerstvolgende opdracht — 24 november 2026

**Dit is het enige actieve hervattingspunt.** De eigenaar heeft de watertemperatuurverbetering expliciet vóór de resterende score-audit geplaatst. Oudere verwijzingen naar de score-audit als eerstvolgende taak zijn daarmee historisch; de audit is uitgesteld, niet geannuleerd.

### Afgerond en bevestigd
- De interval-outputcontracten en VisCoach-koppeling zijn uitgevoerd en eerder geregistreerd.
- De geïntegreerde soortscore v1 is via PR [#223](https://github.com/sennzor-wq/Vislogboek/pull/223) gemerged; mergecommit `bf108f56cf9c937ae1fb915b310fd8bf4899ab8c`.
- De brede wetenschappelijke verkenning van het watertemperatuurmodel is gesloten: de basis voor oppervlaktewarmtebalans, verticale structuur, zoetwaterdichtheid, menging, ijs en initialisatie is voldoende.
- De vijf ontwerpvervolgstappen zijn read-only uitgevoerd en in de sectie **Technisch ontwerp watertemperatuurmodel** hieronder vastgelegd: actuele codeketen, fysisch modelontwerp, databronvergelijking, validatieprotocol en besluit-/implementatiegrenzen.
- De actuele `main`-baseline is commit `df4758ec196c7595ddc47664d451982bf3f7b314`. De daarop uitgevoerde Quality Gate run [45411964253](https://github.com/sennzor-wq/Vislogboek/actions/runs/45411964253) is geslaagd. Dit is bewijs voor die baseline, niet voor een nog niet uitgevoerde modelimplementatie.

### Huidige prioriteit — watertemperatuurmodel
De eerstvolgende werkstroom is het afronden en laten beoordelen van het technische ontwerp voor de bestaande `waterThermalEngine`. De voorgestelde architectuur is één verticale 1D-waterkolom met fysische warmtebalans, dichtheidsafhankelijke stratificatie, menging en ijsfase. De exacte implementatieparameters en bronintegratie zijn nog niet goedgekeurd.

### Uitgestelde werkstroom
De read-only audit van de scoreberekening en voedingsdriverdekking blijft uitgesteld. Deze wordt pas hervat nadat het watertemperatuurwerk de afgesproken ontwerp-/implementatiepoort heeft bereikt, of wanneer de eigenaar de prioriteit expliciet wijzigt. De bestaande scoreformule, gewichten en soortrespons blijven buiten de huidige ontwerpwerkstroom.

### Eerstvolgende opdracht
Leg het ontwerp ter beoordeling aan de eigenaar voor. Verwerk eventuele feedback in ditzelfde centrale plan. Pas na expliciete goedkeuring van de modelarchitectuur, uitvoerscope en databronstrategie mag een afgebakend implementatievoorstel worden gestart.

### Stop-/goedkeuringspoort
Tot expliciete goedkeuring blijven runtimecode, tests, parameters, formules, database, UI, databronintegraties, data-imports, externe aanvragen, accounts/secrets en deployment ongewijzigd. De ontwerpdocumentatie is geen impliciete toestemming om een van deze zaken uit te voeren.

### Relevante openstaande PR's op 24 november 2026
- PR [#222](https://github.com/sennzor-wq/Vislogboek/pull/222): documentatie-/Fase-2-auditwerk; open en niet gemerged.
- PR [#209](https://github.com/sennzor-wq/Vislogboek/pull/209) en [#210](https://github.com/sennzor-wq/Vislogboek/pull/210): twee verschillende voorstellen voor sessiegebonden temperatuurmetingen; beide open en niet gemerged. Niet als actuele `main`-implementatie behandelen en niet parallel voortzetten zonder expliciete keuze.
- PR [#200](https://github.com/sennzor-wq/Vislogboek/pull/200): ouder documentatievoorstel; open en niet gemerged.
De technische analyse in deze sessie is uitsluitend gebaseerd op actuele `main`, niet op code uit deze PR-branches.

Fase 2 blijft open. Fase 3 blijft geblokkeerd totdat de actuele fasepoorten formeel zijn gehaald.

---

## Documenthiërarchie en afsluiten van parallelle werkvoorraden — 24 november 2026

Deze sectie legt de documentrollen vast en introduceert **geen nieuwe uitvoeringsopdracht**. De hierboven vastgelegde actuele Fase-2-opdracht blijft ongewijzigd en is de enige eerstvolgende taak.

### Enige uitvoeringsautoriteit

`VISLOGBOEK_VERBETERPLAN.md` is het enige actieve uitvoeringsplan en statusregister. Alleen de actuele sectie **Actuele uitvoeringsstatus en eerstvolgende opdracht** bepaalt wat wordt uitgevoerd, in welke volgorde en wanneer het werk stopt of om eigenaarstoestemming vraagt.

Geen ander document, issue, roadmap, audit of historische notitie mag zelfstandig een taak activeren, de volgorde veranderen of een expliciete stop-/goedkeuringspoort omzeilen. Een verwijzing naar een ander document is uitsluitend een verwijzing naar inhoudelijke informatie, bewijs of kaders — nooit een impliciete opdracht.

### Rollen van de overige documenten

- `READ-FIRST.md`: uitsluitend startwijzer naar dit plan en de vaste repositoryregels; bevat geen eigen planning.
- `AGENTS.md`: beschrijft werkwijze en veiligheidsgrenzen; bepaalt geen projectspecifieke uitvoeringsvolgorde.
- `PROJECT_CONTEXT.md`: productvisie en vaste projectkaders; geen zelfstandige werkvoorraad.
- `IMPLEMENTATION_PLAN_32_IMPROVEMENTS.md`: goedgekeurd langetermijnkader en acceptatie-eisen; de dagelijkse/actuele uitvoering wordt uitsluitend vanuit dit verbeterplan aangestuurd.
- `FASE2_PROGNOSE_AUDIT.md`, `MODELARCHITECTUUR_FASE2.md` en `FASE2_UITVOERINGSRESULTATEN.md`: technische/biologische onderbouwing, architectuurgrenzen, bewijs en historische status. Oude vervolgstappen daarin zijn geen actieve opdrachten.
- `SOORTSPECIFIEKE_SCOREWEGING_PER_VIS.md` en `SOORTSPECIFIEKE_SCORE_WEGING.md`: inhoudelijke model- en soortreferenties; geen zelfstandige uitvoeringsplannen.
- `VISCOACH_PRODUCT_ROADMAP.md` en `PROJECT_ZELFLERENDE_PROGNOSE.md`: afzonderlijke projectsporen. Ze worden alleen actief wanneer dit verbeterplan ze expliciet in scope brengt en de vereiste eigenaarbesluiten aanwezig zijn.
- `FASE0_OPTIMIZATION_AUDIT.md` en `FASE0_DATA_DICTIONARY_AND_BASELINE.md`: historische fase-0-audits/baselines; raadpleeg ze alleen wanneer de actuele opdracht dat vereist.
- `PROJECT_WORK_QUEUE.md`: op 24 november 2026 gesloten als zelfstandige operationele queue. Het bestand blijft uitsluitend als historisch register bewaard; de oude actieve opdracht en PR-statussen mogen niet worden gevolgd.

### Conflict- en wijzigingsregel

Als een onderliggend document strijdige of verouderde informatie bevat, wordt die niet automatisch leidend. Stop bij een materieel conflict, controleer de actuele code/status en leg de benodigde correctie voor. Wijzig het leidende plan, scope of een eigenaarbesluit niet stilzwijgend. Historische inhoud blijft behouden; actuele status wordt waar nodig met een gedateerde correctie aangevuld.

Er bestaat vanaf deze vastlegging één actieve uitvoeringsvolgorde, geen tweede queue en geen impliciete heropening van afgesloten of afzonderlijke werksporen.


---

## Prioriteitsbesluit — watertemperatuurmodel eerst verbeteren (24 november 2026)

**Besluit producteigenaar:** de betrouwbaarheid van de watertemperatuur is op dit moment de hoogste productprioriteit, omdat deze temperatuur een belangrijke invoer vormt voor de Vislogboek-prognose en de daarop gebaseerde visadviezen. De watertemperatuur wordt daarom het **eerste verbeteronderwerp**. Dit besluit wijzigt expliciet de eerder hieronder vastgelegde eerstvolgende opdracht over de scoreberekening: die audit wordt niet geschrapt, maar uitgesteld totdat het watertemperatuurwerk is afgerond of de eigenaar anders besluit.

Dit is een prioriteitsbesluit, geen bewering dat de huidige implementatie al volledig is onderzocht en ook geen goedkeuring voor een vooraf gekozen formule of nieuwe engine.

### Probleemstelling en doel

De huidige uitvoer kan zonder lokale watertemperatuurmeting een waarde tonen die fysisch verdacht of onvoldoende verklaard is, zoals **-0,1 °C**. Een schatting zonder lokale meting is op zichzelf niet verkeerd: een fysisch onderbouwd model kan uit weersverloop, waterdiepte en warmte-uitwisseling een bruikbare schatting maken. De uitvoer moet echter herleidbaar zijn tot de werkelijk beschikbare invoer, de toestand van het water en de onzekerheid.

Het doel is niet om simpelweg een negatieve waarde af te kappen of één vaste correctie toe te passen. Het doel is een realistische, tijdsafhankelijke en waar mogelijk dieptebewuste watertemperatuurschatting te leveren, met expliciete bronstatus en onzekerheid. De temperatuur die relevant is voor de visprognose moet duidelijk worden onderscheiden van een oppervlaktetemperatuur of een gemiddelde over de waterkolom.

### Wetenschappelijke uitgangspunten en referentiekader

De volgende fysische uitgangspunten vormen het toetsingskader voor de audit en het ontwerp:

- Zoet water heeft zijn grootste dichtheid rond **4 °C**. Bij afkoeling boven circa 4 °C kan kouder water mengen en dalen; onder circa 4 °C is het gedrag andersom en kan kouder water boven warmer water blijven. Dit beïnvloedt verticale temperatuurprofielen en winterse afkoeling.
- De temperatuur van een waterlichaam reageert door zijn warmtecapaciteit doorgaans trager dan de luchttemperatuur. Waterdiepte en volume zijn daarom relevante randvoorwaarden; een luchttemperatuur mag niet rechtstreeks als watertemperatuur worden geïnterpreteerd.
- Warmte-uitwisseling aan het oppervlak is dynamisch. Relevante processen zijn onder meer voelbare warmte-uitwisseling door het temperatuurverschil tussen lucht en water, verdamping (mede afhankelijk van luchtvochtigheid en wind), inkomende zonnestraling en langgolvige uitstraling. Wind beïnvloedt de uitwisseling en menging.
- Ook waterbeweging/stroming, lokale beschutting, sneeuw/ijs en bijzondere lokale omstandigheden kunnen de representativiteit van een generieke schatting beïnvloeden.
- Een vereenvoudigde berekening met één vast warmteverlies in W/m² en alleen Q = m·c·ΔT is hoogstens een illustratie. Zij is geen voldoende model voor dagelijkse temperatuurontwikkeling wanneer de warmteflux, menging, straling en weersgeschiedenis niet dynamisch worden meegenomen.
- Een waarde onder 0 °C is niet automatisch wiskundig onmogelijk: opgeloste stoffen kunnen het vriespunt iets verlagen en onderkoeling kan onder bijzondere omstandigheden voorkomen. Dat is echter geen rechtvaardiging om zonder bewijs een volledige gewone zoetwaterkolom op een negatieve temperatuur te presenteren. De implementatie moet zulke uitzonderingen onderscheiden van een reken- of invoerfout; niet blind clampen en ook niet blind accepteren.

**Belangrijke externe referentie:** het KNMI beschrijft een operationeel model voor watertemperatuur en ijsvorming in stilstaand buitenwater. De modelbeschrijving noemt onder andere luchttemperatuur, relatieve vochtigheid, bewolking, wind, straling en verdamping, en geeft aan dat een waterlaag van circa 2 meter op een tijdschaal van meerdere dagen reageert. Het KNMI vermeldt voor de gesimuleerde watertemperatuur een nauwkeurigheid in de orde van ongeveer 1 °C onder de beschreven omstandigheden. Dit is een relevant referentiepunt, geen bewijs dat Vislogboek dezelfde methode al gebruikt en ook geen reden om het KNMI-model zonder aanpassing over te nemen.

Bronnen:
- KNMI, *Watertemperatuur- en ijsgroeimodel*: https://www.knmi.nl/kennis-en-datacentrum/achtergrond/watertemperatuur-en-ijsgroeimodel-van-het-knmi
- KNMI, *IJsdikte en watertemperatuur*: https://www.knmi.nl/nederland-nu/weer/waarschuwingen-en-verwachtingen/extra/ijsdikte-watertemperatuur
- NEMO Kennislink, *Weer wat geleerd: natuurijs*: https://www.nemokennislink.nl/publicaties/weer-wat-geleerd-natuurijs/
- Natuurijswijzer, *IJsvorming*: https://www.natuurijswijzer.nl/ijsontwikkeling/ijsvorming/

### Wat de eerste verbeteropdracht moet vaststellen

De eerste opdracht is een gerichte, read-only technische audit van de **daadwerkelijke huidige implementatie op main**. Beschrijf alleen wat in actuele code, tests en datastromen aantoonbaar aanwezig is. Eerdere chatbeschrijvingen of architectuurnamen gelden niet als bewijs.

1. Traceer de volledige keten van weerbron en tijdreeks naar de watertemperatuurschatting en vervolgens naar de soortrespons/prognose. Leg per invoerveld vast: bron, tijdstempel, eenheid, geldigheidscontrole, ontbrekendewaardegedrag en of het gemeten, voorspeld, afgeleid of geschat is.
2. Stel vast welke fysische processen de huidige engine werkelijk berekent en welke ontbreken of slechts met vaste correcties/tijdconstanten worden benaderd. Controleer in het bijzonder warmteopslag, diepte/volume, weersgeschiedenis, wind/menging, vochtigheid/verdamping, bewolking en kort-/langgolvige straling voor zover de benodigde invoer bestaat.
3. Stel vast wat de huidige uitkomst semantisch voorstelt: oppervlak, specifieke diepte, bodem, representatieve laag of gemiddelde. Controleer of verticale stratificatie en het zoetwater-dichtheidsmaximum rond 4 °C expliciet of impliciet worden behandeld.
4. Reconstrueer de herkomst van de negatieve voorbeeldwaarde (zoals -0,1 °C): exacte invoer, tussenstappen, eenheden, tijdsvenster, afronding, fallback en eventuele grenswaarden. Als die concrete casus niet reproduceerbaar is, noteer dat expliciet en verzin geen verklaring.
5. Beoordeel hoe lokale waterdiepte, stilstaand/stromend water, meetankers, eerdere temperatuurmetingen en onzekerheid werkelijk worden gebruikt. Controleer ook of de schatting strikt as-of het prognosemoment blijft en geen toekomstige informatie gebruikt.
6. Vergelijk de gevonden implementatie met de relevante KNMI-processen en leg per proces vast: aanwezig en aantoonbaar, gedeeltelijk/vereenvoudigd, ontbreekt, of niet te beoordelen door ontbrekende invoer.
7. Bepaal welke temperatuuruitvoer de visprognose nodig heeft en hoe die moet worden geïnterpreteerd. Houd gemeten watertemperatuur, gemodelleerde schatting, oppervlaktetemperatuur en diepte-/waterkolomrepresentatie uit elkaar. Maak onzekerheid en datakwaliteit zichtbaar zonder een schijnnauwkeurige waarde te suggereren.
8. Inventariseer bestaande tests en maak een voorstel voor fysische regressiegevallen, waaronder geleidelijke afkoeling, langdurige vorst, korte koude-inval, dooi, verschillende waterdieptes, windstil versus windrijk, ontbrekende invoer, meting versus schatting, 4 °C-overgang en vriespuntgedrag.

### Beoogde acceptatie van de verbetering

Na de audit wordt een concreet verbeterontwerp opgesteld dat de bestaande engine zoveel mogelijk hergebruikt en ten minste aan deze eisen voldoet:

- Geen directe gelijkstelling van luchttemperatuur aan watertemperatuur en geen ongefundeerde negatieve watertemperatuur.
- De berekening gebruikt relevante weersgeschiedenis en tijdsafhankelijke warmte-uitwisseling; de precieze processen en benodigde databronnen worden pas gekozen nadat de huidige implementatie en databeschikbaarheid zijn vastgesteld.
- Waterdiepte en het onderscheid tussen oppervlaktelaag en diepere waterlaag worden passend behandeld. Als de beschikbare invoer geen verticaal profiel kan dragen, wordt de beperking expliciet gemaakt in plaats van een profiel te verzinnen.
- De betekenis, bronstatus, ouderdom en onzekerheid van iedere temperatuuruitkomst zijn uitlegbaar.
- Gemeten waarden krijgen een expliciete, controleerbare rol als anker; ontbrekende metingen worden niet als gemeten of als zekerheid gepresenteerd.
- Historische berekeningen respecteren het prognosemoment (as-of) en gebruiken geen toekomstige weer- of meetgegevens.
- De temperatuurrespons blijft soortspecifiek waar de bestaande biologische profielen dat vereisen; de thermische schatting zelf wordt niet vermengd met willekeurige soortgewichten.
- Regressietests controleren fysisch plausibel gedrag over tijd en omstandigheden. Technische tests alleen gelden niet als bewijs van biologische nauwkeurigheid; waar mogelijk is vergelijking met onafhankelijke metingen nodig.

### Uitvoeringsvolgorde en grenzen

1. **Eerst:** de read-only audit uit bovenstaande opdracht op actuele main, inclusief reconstructie van de negatieve voorbeeldwaarde indien reproduceerbaar.
2. **Daarna:** leg de bevindingen en een concreet, toetsbaar verbeterontwerp voor, met expliciet onderscheid tussen bewezen tekortkomingen, aannames, ontbrekende invoer en resterende onzekerheid.
3. **Vervolgens:** werk de watertemperatuurverbetering als eerste implementatiewerkpakket uit en voer die gefaseerd uit binnen de bestaande architectuur. Geen parallelle watertemperatuur-engine starten zonder aantoonbare noodzaak.
4. **Validatie:** voeg gerichte fysische regressietests toe en voer de toepasselijke Quality Gate uit. Rapporteer technische correctheid, vergelijking met meetgegevens en biologische validatie afzonderlijk.
5. **Daarna pas:** hervat de eerder vastgelegde read-only audit van de geïntegreerde scoreberekening en driverdekking, tenzij de eigenaar de volgorde opnieuw wijzigt.

**Scopebescherming:** deze prioriteitswijziging geeft toestemming om watertemperatuur als eerste verbeteronderwerp te onderzoeken, te ontwerpen en als eerstvolgende implementatie voor te bereiden. Zij is geen toestemming om nu al een specifieke fysische formule, parameter, grenswaarde, nieuwe engine, scoreweging of UI-aanpassing te kiezen. Productiecode, tests, parameters, database, prognoseformule en UI blijven ongewijzigd totdat het ontwerp op basis van de audit concreet is en de eigenaar de betreffende implementatierichting expliciet heeft goedgekeurd.

**Actuele status:** prioriteit door eigenaar vastgesteld; documentatie vastgelegd; technische audit nog niet uitgevoerd. De bestaande scoreberekeningsaudit is uitgesteld en blijft behouden als eerstvolgende taak ná dit watertemperatuurwerk.



### Read-only audit van de actuele watertemperatuurketen — 24 november 2026

**Auditbasis:** actuele bronbestanden op `main`, na documentatiecommit `aa819195a2b6b070e07bf1a6e2dca795a177f4c7`. De runtimebestanden hieronder zijn in deze audit alleen gelezen; er zijn geen code-, test-, parameter-, database- of UI-wijzigingen uitgevoerd.

#### 1. Werkelijke invoerketen

- `src/services/weatherService.ts` — `getForecast` haalt de Open-Meteo-uurlijkse reeks op voor de coördinaten van de stek. De aanvraag omvat `past_days=3` en `forecast_days=8`, met luchttemperatuur op 2 m, relatieve luchtvochtigheid, dauwpunt, kortgolvige straling, neerslag, bewolking en wind. De cache wordt maximaal 30 minuten hergebruikt. De weer-API levert in deze keten geen watertemperatuur.
- De verplichte uurlijkse recordvelden worden alleen opgenomen wanneer tijd, luchttemperatuur, druk, wind, windrichting, neerslag, neerslagkans, bewolking en weercode eindig zijn. Luchtvochtigheid, dauwpunt en kortgolvige straling zijn optioneel en worden alleen toegevoegd wanneer hun waarden binnen de codevalidatie vallen.
- `src/services/waterThermalEngine.ts` ontvangt de weersreeks, stekdiepte/-watertype, een eventuele actuele handmatige watertemperatuur, historische sessies, historische meetevents, optioneel een doelmoment en forecastAsOf.
- Echte meetankers worden uit een expliciete handmatige meting of uit geldige historische sessiemetingen op dezelfde stek geselecteerd. De gebruikte historische sessiewaarde vereist een expliciet meettijdstip, bekende meetbron en meetmethode. Metingen na het doelmoment worden uitgesloten.
- `src/services/waterTemperatureHistory.ts` bouwt daarnaast een seizoensprofiel uit fysieke meetevents: minimaal drie metingen op dezelfde stek, of minimaal vijf metingen op ten minste twee vergelijkbare stekken van hetzelfde watertype binnen 50 km. De selectie beperkt zich tot dezelfde/naastliggende Amsterdamse kalendermaand en mengt bekende verschillende meetdieptes niet.
- `src/services/prognosisEngine.ts` roept de thermische engine aan en past daarna eventueel een lokale seizoensbiascorrectie toe uit `src/services/evaluationEngine.ts`. De thermische temperatuur is vervolgens invoer voor de bestaande soortspecifieke thermische respons; deze audit wijzigt die respons of de geïntegreerde score niet.

#### 2. Wat de huidige thermische engine aantoonbaar doet

**Route met een recente lokale meting als anker**
- Bij een actuele meting wordt de gemeten waarde rechtstreeks teruggegeven als gemeten temperatuur.
- Bij een eerdere meting wordt alleen bij bekende totale stekdiepte, maximaal 96 uur ouderdom en voldoende uurlijkse weersdekking (minimaal 65%, plus de bestaande minimale samplevoorwaarde) chronologisch geëxtrapoleerd.
- De huidige discrete tijdconstanten zijn 54 uur bij diepte tot en met 1,4 m, 96 uur in het middensegment en 150 uur boven 3,5 m. Watertype kan die waarden met vaste multipliers wijzigen.
- Per weersstap gebruikt de engine een evenwichtstemperatuur die bestaat uit 65% van het rollende 24-uursgemiddelde en 35% van het rollende 72-uursgemiddelde van de **luchttemperatuur**, plus een kleine vaste zoncorrectie. Kortgolvige straling heeft voorrang; anders wordt bewolking als proxy gebruikt.
- Wind verandert de effectieve tijdconstante met vaste categorie-multipliers. Dit is een benadering van menging, geen berekende stromings- of turbulentieprocessen.
- Bij een recente meting maar onvoldoende weerdekking wordt tot 24 uur een stabiliteitsaanname met een marge van ±1,0 °C gebruikt.

**Route zonder bruikbaar lokaal meetanker**
- Er is minimaal 72 uur geldige voorafgaande uurtemperatuurdata nodig.
- De puntwaarde wordt berekend uit een gewogen combinatie van het 72-uursgemiddelde en de doeldaggemiddelde **luchttemperatuur**, met een discrete responsweging op basis van diepte/watertype en eventueel een beperkte zonbonus.
- Als een historisch watertemperatuurprofiel bestaat, wordt dat als startreferentie gebruikt en wordt de weersafwijking ten opzichte van het 72-uursluchtgemiddelde toegevoegd.
- Zonder lokale meting of historisch profiel wordt de weerafgeleide puntwaarde wel getoond, maar zonder numerieke onzekerheidsband; de bronstatus en hoge, niet-gekwantificeerde onzekerheid worden expliciet vermeld.
- Bij onvoldoende weershistorie kan het historische profiel als enige referentie worden teruggegeven; zonder bruikbaar profiel blijft de temperatuur onbekend.

**Lokale kalibratie**
- `getWaterTemperatureCalibration` gebruikt alleen geldige voorspelling/meetparen op dezelfde stek en in hetzelfde seizoen, met minimaal acht paren. De bias wordt met shrinkage afgezwakt en de correctie begrensd op ±1,5 °C.
- De correctie wordt van de geschatte temperatuur afgetrokken. Na deze correctie bestaat geen fysieke ondergrenscontrole voor de temperatuur of onzekerheidsband.

#### 3. Bevestigde beperkingen en relevante hiaten

1. **Geen volledige fysische warmtebalans.** De engine gebruikt luchtgemiddelden, vaste diepte-/watertypeklassen, een eerste-orde relaxatie en kleine vaste stralingscorrecties. Zij berekent geen expliciete netto-energieflux in W/m² met afzonderlijke voelbare, latente en langgolvige stralingscomponenten.
2. **Verdamping wordt niet in de temperatuurupdate doorgerekend.** Relatieve luchtvochtigheid en dauwpunt bepalen samen met wind een beschrijvend verdampingspotentieel, maar die waarden veranderen de berekende watertemperatuur niet rechtstreeks.
3. **Neerslag en luchtdruk zijn geen directe thermische updatefactoren.** Ze zijn beschikbaar in de weerdata, maar worden niet in de temperatuurschatting verwerkt.
4. **Geen expliciete dichtheidsanomalie of faseovergang.** De engine modelleert niet dat zoet water rond 4 °C zijn grootste dichtheid heeft, rekent geen convectieve omslag rond 4 °C door en heeft geen ijs-/latente-warmtecomponent. Er is ook geen fysieke ondergrens voor een geschatte vloeibare watertemperatuur.
5. **Geen verticaal temperatuurprofiel.** De uitkomst is één scalaire temperatuur. `surfaceVsBulkNote` beschrijft kwalitatief mogelijke verschillen tussen oppervlak en bulk, maar er worden geen afzonderlijke oppervlakte-, midden- of bodemtemperaturen berekend.
6. **Diepte is grof geparametriseerd.** Totale stekdiepte stuurt enkele discrete klassen/tijdconstanten; het is geen continue warmtecapaciteits-/waterkolomberekening. Stroming, doorstroming, beschaduwing, bodemwarmte, oeverinvloed en lokale menggeometrie worden niet gemodelleerd.
7. **Meetdiepte is niet volledig aangesloten op de prognoseaanroep.** `ThermalAnalysisOptions` kent `measurementDepthM`, en historische profielselectie kan meetlagen scheiden. De huidige aanroepen vanuit `prognosisEngine.ts` geven dit doelmeetdiepteveld echter niet door. Totale stekdiepte en fysieke meetdiepte zijn dus niet hetzelfde contract.
8. **Weer-only absolute starttoestand is zwak onderbouwd.** Zonder meetanker of historisch profiel gebruikt de engine slechts de beschikbare 72 uur luchttemperatuur als basis voor een absolute watertemperatuur. Dat is onvoldoende om de voorafgaande thermische toestand van een watermassa na weken/maanden weerverloop te kennen, vooral bij diepere wateren.
9. **Beperkte ankerhorizon.** De meetankergestuurde extrapolatie stopt bij 96 uur. Daarna kan de route overschakelen op de weer-only schatting of historisch profiel; de actuele watertemperatuurtoestand wordt niet als doorlopende toestand over langere perioden bijgehouden.
10. **Doelmoment en opgeslagen temperatuur zijn niet overal gelijkwaardig.** Tijdvakberekeningen roepen de engine voor een representatief uurmoment aan, maar de algemene daganalyse wordt zonder expliciet `targetTime` uitgevoerd. De snapshots bewaren de algemene thermische analyse/temperatuur, niet vier afzonderlijke thermische doelmomenten. De algemene analyse heeft daardoor `targetTimestamp = null`; de opgeslagen puntwaarde is niet aan één exact fysiek meetdoelmoment gekoppeld.
11. **As-of-valid-time is getest, data-as-of vraagt nog een controle.** De engine beperkt weerssamples voor expliciete doelmomenten tot geldige tijdstempels op of vóór dat doelmoment; bestaande tests wijzigen latere weersuren en controleren dat de uitkomst gelijk blijft. `forecastAsOf` wordt in de thermische engine echter alleen genormaliseerd en teruggegeven, niet gebruikt om te eisen dat de weersdata al vóór het doelmoment beschikbaar was. De bovenliggende prognosecode weigert een forecast die ná het berekeningstijdstip is opgehaald, maar dat is niet hetzelfde als een garantie voor retrospectieve berekeningen dat `forecastAsOf <= targetTime`.
12. **De precieze waarde -0,1 °C is niet gereconstrueerd.** De actuele code laat wel meerdere routes toe die een negatieve modelschatting kunnen opleveren: de weer-only formule heeft geen ondergrens en volgt negatieve luchtgemiddelden; de meetankerroute heeft evenmin een fase-/vriespuntgrens; bovendien kan een positieve lokale biascorrectie tot maximaal 1,5 °C van de schatting aftrekken. Geldige fysieke meetwaarden en historische profielmetingen worden zelf op 0–35 °C begrensd. Zonder de oorspronkelijke forecastreeks, stekdiepte, meetankers, doeltijd en eventuele kalibratie kan niet worden vastgesteld welke route de getoonde -0,1 °C veroorzaakte.

#### 4. Bestaande testdekking en wat nog niet bewezen is

- `test-thermal-and-prognosis.ts` dekt onder meer geleidelijke opwarming/afkoeling, zon/bewolking, trendduiding, weer-only onzekerheidscommunicatie, een forecast die ná het berekeningstijdstip is opgehaald, en invarianten voor weersuren ná een expliciet `targetTime` (inclusief DST-randgevallen).
- `test-water-temperature-synthetic-validation.ts` gebruikt een expliciet synthetische eerste-orde referentie met een vaste responsduur van 65 uur en toetst opwarming, afkoeling en historisch profiel. De testdocumentatie noemt dit zelf een gecontroleerde synthetische waarheid, geen claim over alle echte wateren.
- `test-water-history-profile.ts` dekt onder meer historische meetdieptes, scheiding van lagen, nabije vergelijkbare stekken en onbekende totale diepte.
- `test-water-temperature-learning.ts` dekt uitsluiting van toekomstige meetresultaten bij lokale kalibratie.
- `test-water-thermal-coupling.ts` controleert dat de gemeten/geschatte temperatuur de bestaande soortrespons beïnvloedt.
- In de geïnspecteerde testgevallen is geen gerichte regressiematrix aangetroffen voor langdurige vorst, subnulschattingen, faseovergang/ijs, de dichtheidsanomalie rond 4 °C of een verticaal temperatuurprofiel. Een test met een gemeten watertemperatuur van 4 °C controleert de soortscore, niet de fysica van de waterthermische engine.
- De synthetische 65-uursreferentie valideert gedrag tegen een gekozen relaxatiecurve; zij is geen onafhankelijke praktijkmeting. Er is in deze audit geen lokale dataset uit de gebruikersdatabase gelezen en er zijn geen tests of Quality Gates uitgevoerd.

#### 5. Voorlopige conclusie en voorkeursrichting voor het eerste verbeterwerk

**Conclusie:** de bestaande engine heeft bruikbare bouwstenen — fysieke meetankers met provenance, historische meetprofielen, uurweerdata, dieptecontext, een chronologische ankerroute, onzekerheidsmetadata en lokale evaluatie/kalibratie. Het probleem is dus niet dat er helemaal geen model bestaat. De zwakke plek zit vooral in de absolute weer-only startschatting, de sterk vereenvoudigde warmte-uitwisseling en het ontbreken van een expliciet winter-/verticaal temperatuurmodel.

**Voorkeursrichting om ter goedkeuring uit te werken:**
- Behoud `waterThermalEngine` als de canonieke engine en hergebruik de bestaande meet-, historie-, provenance- en evaluatieketen. Start geen tweede concurrerende engine.
- Vervang de weer-only gewogen luchttemperatuur als absolute watertemperatuur door een fysisch onderbouwde toestandsbenadering die een geloofwaardige initiële waterstaat nodig heeft. Bepaal expliciet hoe die toestand wordt geïnitialiseerd wanneer geen lokale meting of historisch profiel bestaat; drie dagen luchtweer alleen mogen niet als voldoende kennis van de voorafgaande waterstaat worden voorgesteld.
- Ontwerp een KNMI-geïnspireerde, tijdsafhankelijke warmte-uitwisseling die de werkelijk beschikbare weerinvoer gebruikt en ontbrekende processen/velden zichtbaar laat. Neem vochtigheid/verdamping alleen numeriek op wanneer de relatie en eenheden fysisch zijn onderbouwd; een beschrijvend label is geen warmteflux.
- Behandel diepte en menging op een onderbouwde manier. Modelleer alleen afzonderlijke verticale lagen wanneer de invoer en validatie dat kunnen dragen; anders rapporteer één duidelijk gedefinieerde representatieve temperatuur met passende onzekerheid.
- Modelleer het winterse gedrag rond 4 °C en de overgang naar ijsvorming als een fysisch toestand-/faseprobleem. Los dit niet op met een willekeurige `Math.max(0, temp)`-correctie.
- Behoud de bestaande lokale biaskalibratie alleen als aanvullende empirische correctie binnen een fysisch plausibele modeluitkomst; kalibratie mag geen onmogelijke vloeibare watertemperatuur creëren.
- Maak het exacte thermische doelmoment en de bron-/data-as-of-tijd onderdeel van de reproduceerbare prognose-uitvoer.
- Houd de bestaande soortspecifieke temperatuurrespons en geïntegreerde scoreformule buiten deze eerste wijziging. Eerst de watertemperatuur zelf verbeteren; pas daarna kan de impact op de score afzonderlijk worden beoordeeld.

**Besluitpoort:** deze audit is read-only. De voorkeursrichting is een technisch voorstel en nog geen goedgekeurde formule, parameterisatie of datacontract. Voor implementatie moeten de initiële toestand, beschikbare meteorologische velden, winter-/ijsbehandeling, doeltemperatuurrepresentatie en validatiecriteria als één concreet ontwerp worden vastgesteld en door de eigenaar worden goedgekeurd.

**Auditstatus:** read-only code-/testinspectie uitgevoerd; geen runtimecode of tests gewijzigd en geen Quality Gate uitgevoerd. De volgende stap binnen dit eerste verbeteronderwerp is het concrete ontwerp opstellen en voorleggen. De scoreberekeningsaudit blijft uitgesteld.


### Aanvullend modelbesluit — KNMI als primaire wetenschappelijke basis en winterstratificatie verplicht (24 november 2026)

**Nadere expliciete richting van de eigenaar:** gebruik waar mogelijk de wetenschappelijke methode en fysische formuleringen van het KNMI als primaire betrouwbare basis voor de watertemperatuurschatting wanneer geen lokale meting beschikbaar is. Lokale, betrouwbare watertemperatuurmetingen blijven leidend zodra die beschikbaar zijn. De winterse dichtheidsanomalie van zoet water rond 4 °C en de gevolgen daarvan voor verticale temperatuurverdeling moeten expliciet in het verbeterde model worden meegenomen; dit mag niet als optionele latere verfijning worden behandeld.

#### Wat dit besluit betekent

1. **KNMI is de primaire referentie, niet slechts inspiratie.** Onderzoek eerst of de oorspronkelijke De Bruin & Wessels (1988)-methode en de operationele KNMI-uitwerking voldoende reproduceerbaar zijn om de relevante warmtebalans en ijs-/winterfysica rechtstreeks over te nemen. Gebruik originele wetenschappelijke publicaties en KNMI-documentatie als bron. Als een formule of parameter niet uit een primaire bron kan worden bevestigd, label die als onbekend; reconstrueer of verzin die niet.
2. **Metingen gaan vóór modeluitkomsten.** Een gevalideerde lokale meting op relevante diepte en nabij het doelmoment is de sterkste lokale informatie. De modelberekening blijft nuttig om de temperatuurontwikkeling tussen metingen te schatten, maar mag een betrouwbare actuele meting niet vervangen door een modelwaarde.
3. **Geen meetanker betekent niet: luchttemperatuur als watertemperatuur.** Dan moet de best onderbouwde KNMI-gebaseerde schatting worden gemaakt uit de beschikbare weersgeschiedenis, de waterdiepte en relevante lokale kenmerken. De kwaliteit van de initiële toestand en de onzekerheid moeten expliciet worden behandeld.
4. **Winterstratificatie is een harde modelvereiste.** Het modelontwerp moet het dichtheidsmaximum van zoet water rond 4 °C en de daaruit volgende winterse verticale ordening/menging meenemen. Het moet onderscheid kunnen maken tussen afkoeling van de bovenlaag, water rond/onder de 4 °C, dieper/bodemwater en het ontstaan van ijs, voor zover de modeltoestand en beschikbare gegevens dat toelaten. Eén enkele uniforme temperatuur voor de hele waterkolom is in de winter niet zonder meer voldoende voor de visserijtoepassing.
5. **Geen ongefundeerde negatieve vloeibare watertemperatuur.** Volg de fasefysica van het KNMI-model: zodra de toestand het vriespunt bereikt, moet het model onderscheid maken tussen vloeibaar water en ijsvorming/latente warmte. Een negatieve modelwaarde mag niet als gewone vloeibare watertemperatuur worden getoond zonder expliciete fysische grond en passende toestandrepresentatie.
6. **Eerst vaststellen wat het KNMI-model daadwerkelijk doet.** De publieke KNMI-beschrijving noemt de dichtheidsanomalie en legt uit dat bij stilstaand water en weinig wind water onder 4 °C zodanig ordent dat warmer water naar de bodem zakt. Tegelijk beschrijft een peer-reviewed modelintervergelijking het operationele KNMI-ijsgroeimodel als een éénlaagsmodel met één temperatuur voor de gehele waterkolom. Dit onderscheid is cruciaal: het KNMI-model is de primaire referentie voor de warmtebalans en faseovergang, maar mag niet zonder broncontrole worden voorgesteld als een volledig verticaal gestratificeerd meerlagenmodel. Het Vislogboek-ontwerp moet de noodzakelijke verticale winterstructuur expliciet toevoegen of koppelen aan een wetenschappelijk onderbouwde stratificatiebenadering, zonder ten onrechte te claimen dat dit al in de KNMI-éénlaagskern zit.
7. **Lokale toepasbaarheid en validatie.** Het KNMI noemt circa 1 °C nauwkeurigheid voor gesimuleerde temperatuur van stilstaand zoet buitenwater onder de beschreven omstandigheden. Die prestatie is een referentie, geen garantie voor iedere stek, stromend water, kleine vijver of dieptelaag. Valideer waar mogelijk tegen onafhankelijke lokale metingen, per diepte en seizoen; houd modelnauwkeurigheid en meet-/representativiteitsfout apart.

#### Bronnen die als primaire onderzoeksbasis gelden

- KNMI, *Watertemperatuur- en ijsgroeimodel van het KNMI* — beschrijving warmteoverdracht, meteorologische invoer, diepteafhankelijkheid en de 4 °C-dichtheidsanomalie: https://www.knmi.nl/kennis-en-datacentrum/achtergrond/watertemperatuur-en-ijsgroeimodel-van-het-knmi
- KNMI, *IJsdikte en watertemperatuur* — operationele toepassing voor stilstaand water van 2 m, straling, wind, verdamping, sneeuw/stroming en ensemble-onzekerheid: https://www.knmi.nl/nederland-nu/weer/waarschuwingen-en-verwachtingen/extra/ijsdikte-watertemperatuur
- De Bruin, H.A.R. & Wessels, H.R.A. (1988), *A model for the formation and melting of ice on surface waters*, Journal of Applied Meteorology 27, 164–173, DOI: 10.1175/1520-0450(1988)027<0164:AMFTFA>2.0.CO;2.
- De Bruijn et al. (2014), *An intercomparison study of ice thickness models in the Netherlands*, Tellus A, DOI: 10.3402/tellusa.v66.21244 — beschrijft het operationele KNMI-model als éénlaagsmodel; dit moet worden meegenomen bij de architectuurkeuze voor verticale stratificatie.
- KNMI, *Watertemperatuur* — beschrijft het 2 m-waterkolommodel en toepassing als watertemperatuurmodel: https://www.knmi.nl/kennis-en-datacentrum/uitleg/watertemperatuur

#### Consequentie voor de eerstvolgende ontwerpstap

Het ontwerp moet twee wetenschappelijk gescheiden maar gekoppelde onderdelen beoordelen:
- **KNMI-gebaseerde thermische/fasekern:** atmosferische warmte-uitwisseling, warmteopslag, straling, verdamping, windafhankelijkheid, ijsvorming en latente warmte, op basis van controleerbare bronformules.
- **Verticale waterkolom-/stratificatiebehandeling:** een expliciete diepteverdeling die de dichtheidsanomalie rond 4 °C en de relevante meng-/convectieprocessen kan representeren. Onderzoek of dit met een minimale meerlagenuitbreiding van de bestaande engine kan, en welke invoer/validatie dit vereist.

Dit besluit geeft toestemming om deze twee onderdelen inhoudelijk te onderzoeken en als voorkeursrichting uit te werken. Het keurt nog geen specifieke implementatie, numerieke discretisatie, extra databron, parameterwaarde of formule goed. De audit en het ontwerp blijven read-only totdat een concreet voorstel is voorgelegd en de eigenaar de implementatie expliciet heeft goedgekeurd.


### Aanvullend modelvereiste — zomerstratificatie expliciet meenemen (24 november 2026)

**Nadere richting van de eigenaar:** naast de al verplichte winterstratificatie moet ook zomerstratificatie onderdeel zijn van het ontwerp van de verticale waterkolom. Het model mag dus niet alleen het winterse gedrag rond 4 °C beschrijven; het moet de seizoensafhankelijke verticale temperatuurverdeling door het jaar heen kunnen representeren.

#### Fysisch onderscheid dat het ontwerp moet behouden

- **Zomerstratificatie:** opwarming door zoninstraling verwarmt vooral de bovenste waterlaag. Bovenin kan een warme, lichtere laag ontstaan boven koeler, dichter dieper water. De gelaagdheid wordt mede bepaald door instraling, windgedreven menging, diepte, vorm en beschutting van het water.
- **Winterstratificatie:** door het dichtheidsmaximum van zoet water rond 4 °C kan water kouder dan 4 °C juist lichter zijn. Bij voldoende rustige omstandigheden kan koud water boven warmer, dieper water liggen.
- **Overgangsperioden en menging:** tijdens voorjaars- en najaarsomslag kan de verticale gradiënt afnemen en kan de waterkolom door wind en convectie (grotendeels) mengen. Het model moet deze overgangen niet reduceren tot een vaste zomer-/winterregel.

#### Ontwerpconsequenties

1. Beoordeel de verticale waterkolom als een seizoensafhankelijk thermisch systeem, met zowel zomer- als winterstratificatie en de overgangsperioden daartussen.
2. Houd de fysische mechanismen gescheiden: zomerse stratificatie door opwarming en stabiliteit van warm, licht oppervlaktewater; winterse omgekeerde stratificatie door de dichtheidsanomalie rond 4 °C.
3. Onderzoek welke laagresolutie en welke processen minimaal nodig zijn om relevante dieptetemperaturen voor visserij te schatten. Kies geen aantal lagen of mengcoëfficiënten zonder wetenschappelijke onderbouwing en validatie.
4. Neem windgedreven menging, warmte-uitwisseling aan het oppervlak, diepte en waar mogelijk lokale stroming/beschutting mee voor zover de invoer dit betrouwbaar ondersteunt. Maak ontbrekende invoer en daardoor ontstane onzekerheid expliciet.
5. Valideer zomer- en winterprofielen afzonderlijk tegen onafhankelijke metingen op bekende dieptes; toets daarnaast voorjaars-/najaarsmenging en snelle weersomslagen.
6. Behandel dit als uitbreiding van hetzelfde canonieke thermische model, niet als een tweede concurrerende engine.

**Besluitstatus:** zomerstratificatie is hiermee een expliciete ontwerpeis, naast winterstratificatie. Dit is toestemming om het wetenschappelijke en technische ontwerp uit te werken; het is geen goedkeuring voor implementatie, een specifieke laagindeling, formule, parameterwaarde of extra databron. De bestaande read-only ontwerp-/goedkeuringspoort blijft ongewijzigd.


### Wetenschappelijke onderzoeksnotitie — verticale stratificatie (24 november 2026)

**Doel van deze notitie:** de zomer- en winterstratificatie vertalen naar toetsbare ontwerpvereisten voor één doorlopend thermisch model. Dit is een read-only onderzoeksuitwerking. Er is geen implementatie of parameterkeuze goedgekeurd.

#### 1. Wetenschappelijk onderscheid: één waterkolom, meerdere stabiliteitsregimes

Het model moet de temperatuurverdeling over de diepte als toestand behandelen. Zomer en winter zijn geen twee losstaande modellen en ook geen simpele omkering van één regel. De dichtheid als functie van temperatuur bepaalt of een temperatuurprofiel stabiel of instabiel is; de energiebalans, zonnestraling, wind en convectie bepalen vervolgens hoe dat profiel verandert.

- **Zomer:** kortgolvige zonnestraling wordt deels aan het oppervlak en deels in de waterkolom geabsorbeerd. De bovenlaag warmt daardoor op en kan lichter worden dan het diepere water. Een stabiele thermocline kan ontstaan. Wind levert turbulente menging en kan de gemengde bovenlaag verdiepen. Op rustige, zonnige dagen kan ook een sterke dagelijkse oppervlaktelaag ontstaan; dit hoeft niet gelijk te zijn aan de seizoensmatige stratificatie.
- **Winter vóór ijsvorming:** bij afkoeling wordt zoet water dichter totdat het circa 4 °C bereikt. Verdere afkoeling maakt het water juist lichter. Bij voldoende rustige omstandigheden kan daardoor een koude bovenlaag boven dieper water rond 4 °C blijven liggen. Wind en convectieve processen kunnen het profiel veranderen; een kalenderregel alleen is onvoldoende.
- **Onder ijs:** de water-/ijsgrens ligt rond het vriespunt, terwijl dieper water warmer kan blijven. Sneeuw en ijs beïnvloeden de warmteoverdracht. De faseovergang en latente warmte moeten als aparte toestand worden behandeld; een negatieve temperatuur mag niet als gewone vloeibare watertemperatuur worden gepresenteerd.
- **Voorjaars- en najaarsovergang:** de verticale gradiënten kunnen afnemen en de waterkolom kan (bijna) mengen. In het voorjaar kan zonnestraling dieper doordringen en bij water onder de temperatuur van maximale dichtheid convectie opwekken. In het najaar kan afkoeling van bovenaf de stratificatie afbreken. De overgang moet uit de fysica volgen, niet uit vaste maandgrenzen.

#### 2. Onderzochte modelreferentie: FLake

De openbare SURFEX-wetenschappelijke documentatie beschrijft FLake als een efficiënt één-dimensionaal (verticaal) bulkmodel met een tweelaagse parametrisatie: een bovenste gemengde laag en een onderliggende thermocline tot aan de bodem. Het model gebruikt een integraal warmtebudget, een entrainmentbenadering voor convectief verdiepen van de gemengde laag en een relaxatiebenadering voor windgedreven menging. De volumetrische absorptie van zonnestraling, bodemsediment, ijs en sneeuw zijn expliciete onderdelen van de modelbeschrijving.

De documentatie beschrijft ook een zoetwater-toestandsvergelijking met een dichtheidsmaximum bij 277,13 K (circa 4 °C). De genoemde kwadratische benadering gebruikt een empirische coëfficiënt van 1,6509 × 10⁻⁵ K⁻². Dit is een bronvermelde formulering uit de FLake/SURFEX-documentatie, niet een door Vislogboek gekozen of geïmplementeerde parameterisatie.

**Belangrijke toepassingswaarschuwing:** Sun et al. (2020) vergelijken vier 1D-modellen voor het ondiepe Lake Taihu (gemiddelde diepte 1,9 m). In de onderzochte configuraties had FLake duidelijke beperkingen bij de verticale temperatuurverdeling, waaronder koude afwijkingen onder 50 cm; de auteurs raden toepassing van FLake in zeer ondiepe meren (<5 m) tijdens warme perioden af. De studie laat bovendien zien dat oppervlakteruwheid, lichtuitdoving/penetratie en verticale menging voor ondiep water sterk bepalend zijn. Ook het beter presterende multilevel UOM-model had een tekortkoming bij de bodemtemperatuur door ontbrekende sedimentinvloed.

**Conclusie:** FLake is een waardevolle wetenschappelijke referentie voor de processen en de modelstructuur, maar mag niet zonder validatie als kant-en-klare engine voor alle Vislogboek-wateren worden overgenomen. Vooral ondiepe vijvers, sloten en ondiepe plassen vragen een afzonderlijke geschiktheids- en validatietoets.

#### 3. Consequenties voor de Vislogboek-architectuur

1. Behoud één canonieke thermische toestand in de bestaande `waterThermalEngine`; geen aparte zomer- en winterengine.
2. Behandel de verticale temperatuurverdeling als modeltoestand. De uitvoer moet een temperatuur op een opgegeven meet-/visdiepte kunnen afleiden; een gemiddelde watertemperatuur mag niet stilzwijgend als temperatuur op iedere diepte worden gebruikt.
3. Laat de zoetwater-dichtheidsrelatie de stabiliteit en het teken van de thermische expansie bepalen, zodat gedrag rond 4 °C fysisch kan veranderen. Leg nog geen formule of coëfficiënt vast voordat de toepassingsvoorwaarden en bronkeuze zijn gecontroleerd.
4. Neem de verdeling van kortgolvige straling over de diepte mee. De benodigde lichtuitdoving hangt samen met helderheid/troebelheid en is niet betrouwbaar uit luchttemperatuur alleen af te leiden. Ontbrekende waterhelderheid moet dus onzekerheid geven, geen verzonnen standaardwaarde.
5. Behandel wind als bron van turbulente menging, niet uitsluitend als een vaste correctiefactor op een afkoeltijd. De effectieve menging hangt ook af van waterdiepte, fetch/blootstelling, bestaande stratificatie en lokale beschutting.
6. Onderzoek warmte-uitwisseling met bodem/sediment. Dit kan met name in ondiepe wateren en tijdens koude perioden de bodemlaag beïnvloeden; laat dit niet verdwijnen in een generieke luchttemperatuurcorrectie.
7. Behandel ijs en sneeuw als een fase-/isolatietoestand die de randvoorwaarden aan het wateroppervlak verandert. De ijsmodule moet thermisch aansluiten op de waterkolom.
8. Maak de modeltoepasbaarheid afhankelijk van watertype. Een verticaal 1D-model kan horizontale advectie, doorstroming, sluizen, inlaat/uitlaat of lokale temperatuurpluimen niet vanzelf representeren. Voor stromend water moet een passende stromingsbehandeling of expliciet hogere onzekerheid worden onderzocht.
9. Houd totale waterdiepte, meetdiepte en doel-/visdiepte als afzonderlijke gegevens. De verticale profieluitvoer moet exact aangeven op welke diepte zij betrekking heeft.
10. Laat de seizoensregimes uit de fysica ontstaan. Gebruik kalenderseizoen hoogstens als context of initialisatie-informatie, niet als vervanging van de dichtheids-, warmte- en mengberekening.

#### 4. Validatie die vóór implementatie moet worden voorbereid

De ontwerpvalidatie moet ten minste afzonderlijke gevallen bevatten voor:
- zonnige, windstille zomerdagen met sterke dagelijkse opwarming van de bovenlaag;
- zomerse perioden met meerdere dagen stratificatie en een koelere bodemlaag;
- windtoename of bewolking die de gemengde laag verdiept/verandert;
- ondiep water waarin dagelijkse menging de verticale gradiënt grotendeels opheft;
- najaarsafkoeling en afbraak van zomerstratificatie;
- winterafkoeling door en onder 4 °C, inclusief inverse stratificatie;
- ijsvorming, sneeuwisolatie en warmte-uitwisseling onder ijs;
- voorjaarsopwarming onder/na ijs en hernieuwde menging;
- snelle weersomslagen en ontbrekende invoervelden;
- verschillende diepten, waterhelderheid, beschutting en stromingsklassen.

Vergelijk modeluitvoer waar mogelijk met onafhankelijke temperatuurmetingen op meerdere bekende dieptes en tijdstippen. Rapporteer per diepte en seizoen bias, MAE/RMSE, profielafwijking en onzekerheid. Splits kalibratie- en validatieperioden chronologisch; dezelfde meetreeks mag niet tegelijk parameters afstellen en de nauwkeurigheid bewijzen. Synthetische tests blijven nuttig voor fysische invarianten, maar gelden niet als praktijkvalidatie.

#### 5. Bronnen en reikwijdte

- Mironov, D. et al. / SURFEX Scientific Documentation v7.2 (2012), hoofdstuk 2.4, *Inland Water: Lake Model FLake*. Bevat de tweelaagse profielrepresentatie, integraal warmtebudget, menglaag-/convectiebehandeling, zoetwater-toestandsvergelijking en ijs-/sneeuwbeschrijving: https://gmd.copernicus.org/articles/6/929/2013/gmd-6-929-2013-supplement.pdf
- Sun, L. et al. (2020), *Improving a Multilevel Turbulence Closure Model for a Shallow Lake in Comparison With Other 1-D Models*, Journal of Advances in Modeling Earth Systems, DOI: 10.1029/2019MS001971. Modelvergelijking en beperkingen voor ondiepe meren: https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2019MS001971
- De Bruin, H.A.R. & Wessels, H.R.A. (1988), *A model for the formation and the melting of ice on surface waters*, Journal of Applied Meteorology 27, 164–173, DOI: 10.1175/1520-0450(1988)027<0164:AMFTFA>2.0.CO;2. Peer-reviewed KNMI-gerelateerde basis voor warmte-uitwisseling en ijsvorming op stilstaand water; de publicatiebeschrijving is bevestigd via Wageningen University & Research: https://research.wur.nl/en/publications/a-model-for-the-formation-and-the-melting-of-ice-on-surface-water/
- KNMI, *Watertemperatuur- en ijsgroeimodel van het KNMI* en de eerder in dit plan genoemde KNMI-pagina's blijven de primaire Nederlandse referentie voor de operationele warmtebalans en faseovergang.

#### 6. Ontwerpstatus en resterende onderzoeksvragen

**Vastgesteld:** zomer- én winterstratificatie horen in één verticaal thermisch model; de dichtheidsanomalie rond 4 °C is onderdeel van de stabiliteitsfysica; zonnestraling, windmenging, bodemwarmte en ijs/sneeuw zijn relevante processen; ondiepe wateren mogen niet zonder meer als diepe meren worden behandeld.

**Nog niet vastgesteld:** de uiteindelijke modelarchitectuur (tweelaags parametrisch, multilaags verticaal of een onderbouwde hybride), de laagindeling/resolutie, mengcoëfficiënten, stralingsdoordringing, bodemparameters, benodigde extra invoer en de numerieke tijdstap. De genoemde FLake-constanten zijn onderzoeksbronwaarden en geen goedgekeurde Vislogboek-instellingen.

**Volgende ontwerpstap:** maak een beargumenteerde vergelijking van (a) een FLake-achtige tweelaags parametrisatie, (b) een multilaags 1D-energie-/mengmodel en (c) een hybride die past bij ondiepe en diepe stilstaande wateren. Beoordeel per optie benodigde invoer, rekenlast, reproduceerbaarheid, ondersteuning van de 4 °C-dichtheidsanomalie, zomerthermocline, bodem/ijs, geschiktheid voor stromend water en haalbare validatie met de bestaande meetregistraties. Leg daarna één voorkeursontwerp met expliciete beperkingen en tests voor aan de eigenaar.

**Besluitpoort blijft gesloten voor implementatie:** deze onderzoeksnotitie autoriseert documentatie en ontwerpvergelijking. Zij autoriseert geen codewijziging, formulekeuze, parameterisatie, extra databron, databasewijziging of aanpassing van de bestaande score. De scoreberekeningsaudit blijft uitgesteld totdat het watertemperatuurwerk deze prioriteit heeft afgerond of de eigenaar de volgorde wijzigt.


### Vervolgonderzoek — modelarchitectuur en geschiktheid voor Vislogboek-wateren (24 november 2026)

**Aanleiding en scope:** vervolg op de vergelijking van KNMI, FLake, GLM, Simstrat, GOTM, Delft3D FM en PGRNN. Deze notitie werkt de nog openstaande vergelijking uit van (a) een tweelaags parametrisch model, (b) een multilaags 1D-waterkolommodel en (c) een hybride aanpak. De notitie is uitsluitend onderzoek en ontwerp; er is geen implementatie of parameterkeuze goedgekeurd.

#### 1. Nieuwe bevinding uit grootschalige modelvergelijking

Mesman et al. (2025), *Learning from a large-scale calibration effort of multiple lake temperature models* (Hydrology and Earth System Sciences 29, 1183–1209, DOI: 10.5194/hess-29-1183-2025), kalibreerden vier modellen voor 73 meren en vergeleken meerdere prestatiematen en meerclusters.

De resultaten nuanceren een algemene rangorde:

- De drie verticale 1D-modellen GLM, GOTM en Simstrat presteerden in het algemeen beter dan het 0.5D-model FLake, maar niet elk model won voor ieder meer of iedere prestatiemaat.
- Voor meer dan 90% van de meren waren ten minste twee modellen voor verschillende prestatiematen het beste. Modelkeuze moet dus afhangen van het watertype en de gewenste uitvoer.
- Simstrat presteerde relatief goed rond de thermocline in diepe, gematigd warme en warme meren; de auteurs relateren dit mede aan de interne-seicheparameterisatie.
- GLM presteerde rond de thermocline relatief goed in kleine gematigde meren.
- Voor de cluster grote ondiepe meren kon geen thermocline worden bepaald. Dat onderstreept dat niet elk ondiep water een stabiele seizoensmatige thermocline heeft.
- De studie benadrukt ook de gevoeligheid voor meteorologische forcing, wind- en stralingsschaling en lichtuitdoving. De gestandaardiseerde vergelijking liet instroom en uitstroom buiten beschouwing; resultaten mogen dus niet zonder meer worden vertaald naar wateren met relevante doorstroming.

**Gevolg voor Vislogboek:** GLM is een sterke eerste referentie voor een verticale waterkolom, maar geen universele winnaar. Simstrat blijft zinvol als profielreferentie voor dieper gestratificeerd water. Voor ondiepe, ondiepe-en-winderige en sterk beschutte wateren moet de toepasbaarheid afzonderlijk worden vastgesteld.

#### 2. Vergelijking van de drie architectuuropties

| Architectuur | Sterke punten | Beperkingen voor Vislogboek | Onderzoeksbeoordeling |
|---|---|---|---|
| Tweelaags parametrisch (FLake-achtig) | Lage rekencapaciteit; expliciete gemengde bovenlaag en onderliggende thermocline; processen zoals straling, bodem en ijs kunnen parametrisch worden meegenomen | Beperkte vrijheid om meerdere verticale gradiënten, lokale meetdieptes en complexe inverse profielen te beschrijven; prestaties kunnen per ondiep watertype sterk verschillen | Geschikt als snelle referentie/baseline, niet als voorkeurskern zonder lokale profielvalidatie |
| Multilaags 1D met vast raster | Directe temperatuur per dieptelaag; transparante energiebalans en verticale diffusie; eenvoudig te testen op behoud van energie en temperatuurgrenzen | Laagresolutie en numerieke diffusie beïnvloeden thermocline; menging en dichtheidsstabiliteit vragen expliciete parameterisatie; vaste lagen kunnen inefficiënt zijn bij sterk wisselende gradiënten | Fysisch passende kandidaat, maar vereist onderbouwde rasterkeuze en mengingsvalidatie |
| Multilaags 1D met flexibele/adaptieve lagen (GLM-achtig) | Lagen kunnen in dikte veranderen met stratificatie en menging; temperatuur-, dichtheids- en mengprofielen; kan thermocline gericht representeren | Meer implementatiecomplexiteit; vraagt meer locatie-invoer zoals hypsografie, lichtuitdoving, beginprofiel en waar relevant in-/uitstroom | Beste primaire onderzoeksreferentie voor de verticale kern, onder voorbehoud van invoerbeschikbaarheid en ondiepwater-validatie |
| Hybride: vereenvoudigde kern met adaptieve complexiteit per watertype | Kan eenvoudige berekening gebruiken waar water goed gemengd is en verticale resolutie verhogen wanneer profielvorming relevant is | Risico op moeilijk uitlegbare overgangen en meerdere rekenpaden; complexiteit mag pas worden toegevoegd als een aantoonbaar voordeel is | Interessante uiteindelijke productrichting, maar pas na vergelijking met één multilaags referentiemodel |

**Belangrijke ontwerpnuance:** een hybride aanpak betekent niet twee concurrerende thermische engines. Het blijft één canonieke toestand en één energiebalans. Eventuele vereenvoudiging of adaptieve resolutie moet een gecontroleerde numerieke modus van diezelfde engine zijn.

#### 3. Invoervereisten en huidige haalbaarheid

De GLM-documentatie en modeltoepassingen laten zien dat een bruikbare verticale simulatie meer nodig heeft dan alleen totale waterdiepte en weersverwachting. Typische invoer omvat:

- meteorologische tijdreeksen: luchttemperatuur, wind, kortgolvige straling, langgolvige straling of bewolking, relatieve vochtigheid en neerslag;
- morfometrie/hypsografie: wateroppervlak of bekkenoppervlak als functie van diepte, of een expliciet vereenvoudigde geometrische aanname;
- lichtuitdoving/doorzicht, bijvoorbeeld afgeleid uit Secchi-diepte;
- initiële verticale temperatuurverdeling met meetdieptes;
- waar relevant: in-/uitstroom, debiet en temperatuur/dichtheid daarvan;
- waar relevant: waterniveau, ijs/sneeuw en warmte-uitwisseling met sediment/bodem.

Een GLM-invoerhandleiding noemt onder meer hypsografische curve, extinctiecoëfficiënt, meteorologische forcing, in-/uitstroom en een initieel temperatuurprofiel als invoer. De 2019 Simstrat-toepassing op Zwitserse meren gebruikt eveneens uurlijkse meteorologie, hydrologische gegevens en meerkenmerken. Dit maakt duidelijk dat het rechtstreeks draaien van een volledige GLM/Simstrat-configuratie voor iedere Vislogboek-stek niet vanzelfsprekend is.

**Relatie met de bestaande Vislogboek-data-audit:** de huidige app heeft weerreeksen en een spotdiepte, maar de eerdere read-only audit heeft geen structureel beschikbare hypsografie, waterhelderheid/lichtuitdoving, verticale beginprofielen of volledige in-/uitstroomgegevens aangetoond. Historische metingen op verschillende dieptes zijn bovendien nog niet overal gekoppeld aan een expliciete doel-/meetdiepte in de huidige prognoseaanroep. Dit is een invoer- en representativiteitsbeperking, geen reden om ontbrekende waarden stilzwijgend te verzinnen.

Daarom zijn twee gebruiksmodi conceptueel nodig, maar nog niet technisch vastgelegd:
1. **Profiel ondersteund:** betrouwbare lokale metingen op één of meer dieptes en voldoende locatiekenmerken; verticale toestand kan worden geïnitialiseerd en lokaal getoetst.
2. **Profiel onvoldoende bekend:** geen bruikbaar beginprofiel of beperkte morfometrie/helderheid; de uitkomst moet een grotere, expliciet onderbouwde onzekerheid hebben. Een schijnbaar precies temperatuurgetal mag de ontbrekende begintoestand niet verhullen.

#### 4. Grenzen van een 1D-waterkolom voor verschillende watertypen

Een 1D-model veronderstelt in essentie dat de relevante horizontale variatie klein genoeg is om een verticale kolom representatief te laten zijn. Het is dus geen algemene oplossing voor elke Nederlandse watergang.

| Watertype | 1D-toepasbaarheid | Wat moet Vislogboek doen? |
|---|---|---|
| Stilstaande vijver of kleine plas, relatief homogeen | Vaak bruikbare eerste benadering, maar bodem-/oevereffecten en beschutting blijven relevant | Verticale kolom onderzoeken; ondiepwater-validatie verplicht |
| Diepe, relatief beschutte plas | Goede kandidaat voor verticale stratificatie | GLM/Simstrat-profielen als referentie vergelijken |
| Ondiepe, windgevoelige plas | Kan vaak goed mengen; dagelijkse gradiënten en windblootstelling zijn belangrijk | Toets of profielvorming überhaupt significant is; niet automatisch een thermocline aannemen |
| Water met relevante instroom/uitstroom of temperatuurpluim | 1D kan horizontale gradiënten en advectie missen | Invoerstatus expliciet maken; hogere onzekerheid of aparte hydrodynamische behandeling onderzoeken |
| Stromende sloot/rivier | Een enkele stilstaande kolom is vaak niet representatief door advectie en menging langs de stroom | Niet als standaard 1D-stilstaand-watergeval behandelen; eerst stromingsklasse en advectie-invloed bepalen |

Een 2023 review van lake-water-temperature-modellen beschrijft de 1D-aanname als verwaarlozing van relevante horizontale dichtheidsgradiënten. Voor kleine en middelgrote waterlichamen kan dat passend zijn, maar bij complexe geometrie, sterke horizontale stroming of lokale temperatuurpluimen niet vanzelfsprekend.

#### 5. Voorlopige architectuurvoorkeur

Op basis van de beschikbare bronnen is de meest verdedigbare richting:

1. **Behoud één canonieke `waterThermalEngine` en bestaande meet-/herkomstregistratie.**
2. **Gebruik een multilaags verticale waterkolom als primaire ontwerp-referentie**, met GLM als belangrijkste proces- en architectuurreferentie. Onderzoek adaptieve lagen tegenover een eenvoudiger vast raster voordat een implementatievorm wordt gekozen.
3. **Gebruik KNMI/De Bruin-Wessels als primaire referentie voor de oppervlaktewarmtebalans en faseovergang**, maar neem niet aan dat het operationele KNMI-éénlaagsmodel zelf de verticale stratificatie oplost.
4. **Gebruik Simstrat als onafhankelijke vergelijking** voor diepe stratificatie, menging, interne seiches en ijsprocessen; niet als automatische keuze voor ondiepe vijvers.
5. **Gebruik FLake als snelle parametrische benchmark**, niet als standaard verticale waarheid voor ondiepe wateren.
6. **Laat de modelcomplexiteit afhangen van de fysische situatie en de beschikbare invoer.** Een volledig 1D-profielmodel mag geen schijnnauwkeurigheid opleveren wanneer beginprofiel, lichtuitdoving, bodemvorm of stromingsgegevens ontbreken.
7. **Houd stromend water buiten de onbewezen geldigheidsclaim** van een stilstaande 1D-kolom. De modelstatus moet duidelijk aangeven wanneer advectie/horizontale verschillen onvoldoende worden beschreven.

Dit is een voorkeursrichting voor verdere uitwerking, geen definitieve goedkeuring van een raster, algoritme, parameter of implementatie.

#### 6. Validatie- en bewijsplan aangescherpt

De validatie moet modellen met exact dezelfde meteorologische forcing en dezelfde meetperioden vergelijken. Waar mogelijk worden de volgende drie referenties naast elkaar gezet:
- eenvoudige gemengde/één-temperatuur-baseline;
- tweelaags parametrische FLake-achtige referentie;
- multilaags GLM-achtige verticale referentie (en Simstrat voor representatieve dieper gestratificeerde gevallen).

Meetdata moeten op bekende dieptes en tijdstippen worden gescheiden in initialisatie/kalibratie en onafhankelijke validatie. Rapporteer minimaal:
- MAE, RMSE en bias per dieptelaag;
- fout in thermocline-diepte wanneer een thermocline werkelijk aanwezig is;
- afwijking in oppervlakte- en bodemtemperatuur;
- timing van opwarming, afkoeling, menging en omkering rond 4 °C;
- onzekerheidsdekking en gevoeligheid voor ontbrekende invoer;
- rekentijd en datavereisten per watertype.

Een ondiep water zonder meetbare thermocline mag niet worden beoordeeld op thermocline-diepte. Evenmin mag een model met ontbrekende bodemmetingen een goede bodemnauwkeurigheid claimen op basis van alleen oppervlaktedata.

#### 7. Bronnen

- Mesman, J.P. et al. (2025), *Learning from a large-scale calibration effort of multiple lake temperature models*, Hydrology and Earth System Sciences 29, 1183–1209, DOI: 10.5194/hess-29-1183-2025. Vergelijking van GLM, GOTM, Simstrat en FLake voor 73 meren, modelclusters en prestatiematen: https://hess.copernicus.org/articles/29/1183/2025/
- Hipsey et al. (2022), *Effects of dimensionality on the performance of hydrodynamic models for stratified lakes and reservoirs*, Geoscientific Model Development 15, 2197–2226. Beschrijving van GLM als 1D-model met flexibele Lagrangiaanse lagen en dynamische verticale stratificatie: https://gmd.copernicus.org/articles/15/2197/2022/
- *Lake Water Temperature Modeling in an Era of Climate Change: Data Sources, Models, and Future Prospects* (2024), Reviews of Geophysics, DOI: 10.1029/2023RG000816. Uitleg 1D-modelaannames, verticale transportvergelijking, morfometrie en toepasbaarheidsgrenzen: https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2023RG000816
- Eawag, Simstrat modelbeschrijving: verticale stratificatie, k-ε-menging, interne seiches, ijs en optionele AED2-koppeling: https://www.eawag.ch/en/department/surf/projects/simstrat/
- Gaudard et al. (2019), *Toward an open access to high-frequency lake modeling and statistics data for scientists and practitioners – the case of Swiss lakes using Simstrat v2.1*, Geoscientific Model Development 12, 3955–3974. Meteorologische en hydrologische invoer en meerkenmerken: https://gmd.copernicus.org/articles/12/3955/2019/
- GLM officiële documentatie: modelprocessen, configuratie en invoer: https://aquaticecodynamics.github.io/glm-aed/
- NETLAKE Toolbox, GLM-invoerbeschrijving: hypsografie, lichtuitdoving, meteorologie, in-/uitstroom en initieel temperatuurprofiel: https://eprints.dkit.ie/id/eprint/534/1/NETLAKE%20Toolbox%2003%20GLM.pdf

#### 8. Uitkomst en eerstvolgende actie

**Uitkomst van deze onderzoeksstap:** een GLM-achtige multilaags verticale kolom is de sterkste primaire onderzoeksreferentie voor Vislogboek, maar de volledige GLM-invoervereisten zijn niet aantoonbaar beschikbaar in de huidige app. De uiteindelijke productoplossing moet daarom worden ontworpen rond één verticale thermische toestand, expliciete invoerkwaliteit en onzekerheid, en afzonderlijke geldigheidsklassen voor stilstaand en stromend water. Een tweelaags model blijft nuttig als benchmark; Simstrat blijft een vergelijkingsreferentie voor diepe gestratificeerde wateren.

**Volgende actie:** maak een concrete gegevens-/invoermatrix voor de bestaande Vislogboek-app: per vereist modelveld vaststellen (a) aanwezig in database/type, (b) beschikbaar via bestaande weer- of locatiebron, (c) afleidbaar met betrouwbare methode, (d) alleen lokaal meetbaar, of (e) ontbrekend. Koppel dit aan de al uitgevoerde read-only code-audit en bepaal daarna welke modelvariant werkelijk uitvoerbaar is zonder niet-bestaande gegevens te veronderstellen.

**Status:** documentatie- en onderzoekswerk toegestaan; productiecode, formule, numerieke laagindeling, parameterwaarden, databronnen, database en score blijven ongewijzigd. De scoreberekeningsaudit blijft uitgesteld totdat het watertemperatuurwerk deze prioriteit heeft afgerond of de eigenaar de volgorde wijzigt.


### Read-only invoerinventaris — wat de huidige app werkelijk kan leveren (24 november 2026)

**Doel:** de vorige actie uitvoeren: modelinvoer per veld toetsen aan de actuele TypeScript-datatypen en service-aanroepen op `main`. Dit is een broncode-inspectie; er zijn geen lokale gebruikersrecords uitgelezen en geen code, database, instellingen of berekeningen gewijzigd.

#### 1. Gecontroleerde bronbestanden

- `src/types/index.ts` — `FishingLocation`, `WeatherSnapshot`, `WaterTemperatureWeatherContext`, `WaterTemperatureMeasurement` en `FishingSession`.
- `src/services/weatherService.ts` — Open-Meteo-aanvraag, validatie en omzetting van uurlijkse weersvelden.
- `src/services/waterThermalEngine.ts` — huidige thermische invoer, meetankers, historische profielselectie en tijdsvensters.
- `src/services/waterTemperatureHistory.ts` — verzamelen en selecteren van echte historische metingen.
- `src/services/prognosisEngine.ts` — daadwerkelijke aanroep van de thermische engine.

#### 2. Invoermatrix op basis van de actuele code

| Modelinvoer | Status in huidige app | Bewijs / beperking |
|---|---|---|
| Luchttemperatuur | **Aanwezig** | Uurlijkse Open-Meteo `temperature_2m`; opgeslagen als `WeatherHourlyForecast.temperature` |
| Windsnelheid en -richting | **Aanwezig** | Uurlijkse `wind_speed_10m` en `wind_direction_10m` |
| Relatieve luchtvochtigheid | **Aanwezig, optioneel per uur** | `relative_humidity_2m`; ontbrekende waarden worden niet kunstmatig ingevuld |
| Dauwpunt | **Aanwezig, optioneel per uur** | `dew_point_2m` |
| Kortgolvige zonnestraling | **Aanwezig, optioneel per uur** | `shortwave_radiation` |
| Bewolking | **Aanwezig** | `cloud_cover` |
| Neerslag | **Aanwezig** | `precipitation` en `precipitation_probability` |
| Luchtdruk | **Aanwezig** | `surface_pressure`; eerdere engine-audit stelde vast dat druk niet rechtstreeks de thermische update aandrijft |
| Langgolvige neerwaartse straling | **Niet rechtstreeks aanwezig** | Kan alleen via een expliciet onderbouwde afleiding of extra bron worden verkregen; geen afgeleide formule goedgekeurd |
| Historische weersdekking | **Beperkt** | De huidige Open-Meteo-aanvraag vraagt `past_days=3` en `forecast_days=8`; dit is geen volledige thermische voorgeschiedenis van weken/maanden |
| GPS-coördinaten | **Aanwezig, optioneel** | `FishingLocation.latitude/longitude`; vereist voor de bestaande weeropvraag |
| Totale/representatieve waterdiepte | **Aanwezig, optioneel** | `FishingLocation.waterDepth` in meter; dit is geen diepte-oppervlakteprofiel of bathymetrie |
| Watertype | **Aanwezig, grof geclassificeerd** | Kanaal, rivier, polder, plas/zandafgraving, stadswater, haven, overig/onbekend; geen kwantitatieve stromingsklasse |
| Actuele/historische watertemperatuur | **Aanwezig** | Sessievelden en `waterTemperatureMeasurements`; met tijdstip, bron, methode en optionele meetdiepte |
| Meerdere metingen op verschillende dieptes | **Opslag aanwezig; prognosekoppeling onvolledig** | `measurementDepthM` bestaat en historie kan dieptes scheiden; de actuele aanroep vanuit `prognosisEngine.ts` geeft geen `measurementDepthM` door aan `analyzeWaterThermalDevelopment` |
| Initieel verticaal temperatuurprofiel | **Niet als expliciet profielobject aanwezig** | Er kunnen afzonderlijke meetevents met meetdiepte zijn, maar geen aangetoond volledig, tijdgesynchroniseerd profiel met vereiste dekking |
| Waterhelderheid / Secchi-diepte / lichtuitdoving | **Niet aangetoond in locatie- of meettypen** | Geen structureel veld in `FishingLocation` of `WaterTemperatureMeasurement` |
| Hypsografie / oppervlakte als functie van diepte | **Niet aangetoond** | Alleen één `waterDepth`-waarde; geen diepte-oppervlaktecurve |
| Bodem-/sedimentwarmte-eigenschappen | **Niet aangetoond** | Geen bodemtype, sedimentparameters of gemeten bodemwarmteflux in de onderzochte invoertypen |
| Windfetch / kwantitatieve beschutting | **Niet aangetoond als fysische invoer** | `waterFacingDirection` en vrije `habitatFeatures` zijn geen gevalideerde fetch- of windreductieparameter |
| Instroom/uitstroom, debiet en watertemperatuur | **Niet aangetoond** | Geen structurele hydrologische forcing in de onderzochte locaties-/sessietypen |
| Stromingssnelheid / advectie | **Niet aangetoond** | Het onderscheid rivier/kanaal/polder is te grof om warmteadvectie te berekenen |

#### 3. Belangrijkste technische bevindingen

1. **Weerforcing is relatief rijk.** De app beschikt over een bruikbare basis van uurlijkse luchttemperatuur, wind, bewolking, kortgolvige straling, luchtvochtigheid, dauwpunt en neerslag. Dit sluit aan bij een belangrijk deel van de atmosferische invoer van fysische watermodellen.
2. **De volledige oppervlakte-energiebalans kan niet rechtstreeks uit de huidige velden worden berekend zonder aanvullende fysische afleiding.** Langgolvige straling ontbreekt als direct veld. Een eventuele afleiding moet later uit een controleerbare wetenschappelijke bron komen en afzonderlijk worden gevalideerd.
3. **De grootste beperking is de toestand van het water vóór de weersreeks.** Drie dagen terugkijkende weersdata en een actuele luchttemperatuurreeks leggen de thermische voorgeschiedenis van een watermassa niet vast. Zonder een bruikbaar lokaal meetanker of voldoende historische watertemperatuurdata blijft de absolute initiële toestand onzeker.
4. **De app heeft meer meetstructuur dan een enkel temperatuurgetal.** Metingen kunnen een tijdstip, methode, bron en diepte hebben. Dat is een bruikbare basis voor toekomstige profielvalidatie. De huidige prognoseaanroep geeft de doelmeetdiepte echter niet door, zodat deze mogelijkheid niet automatisch in de huidige berekening benut wordt.
5. **Een GLM-configuratie per stek is met de huidige locatiegegevens niet volledig te parametriseren.** Vooral hypsografie, lichtuitdoving, instroom/uitstroom en een betrouwbaar verticaal beginprofiel ontbreken als structurele gegevens.
6. **Een 1D-stilstaand-watermodel kan niet zonder meer voor alle geregistreerde watertypen gelden.** Rivieren en kanalen zijn wel als categorieën aanwezig, maar stromingssnelheid, debiet en advectie zijn niet beschikbaar. Een stilstaand-waterberekening voor die locaties moet daarom als beperkt toepassingsgebied of hogere onzekerheid worden behandeld, niet als bewezen representatie.

#### 4. Gevolg voor de architectuurkeuze

De volledige GLM-configuratie is geen directe drop-in voor de huidige Vislogboek-dataset. Dat verandert niet dat GLM de belangrijkste wetenschappelijke referentie voor verticale processen blijft.

De meest haalbare onderzoeksrichting is nu een **GLM-geïnformeerde, beperkte verticale modelkern** binnen de bestaande thermische engine, maar alleen als de volgende ontwerpstudie kan aantonen dat:
- de benodigde vereenvoudigingen fysisch verantwoord zijn;
- ontbrekende hypsografie, lichtuitdoving, bodem- en stromingsgegevens expliciet als onzekerheid of geldigheidsgrens worden behandeld;
- een gemeten beginwaarde of een onderbouwde initialisatiemethode de absolute temperatuurtoestand kan vastleggen;
- meerdere dieptemetingen werkelijk kunnen worden gebruikt om profielen te initialiseren en onafhankelijk te valideren;
- een eenvoudige goed-gemengde modus en een gestratificeerde modus dezelfde thermische toestand en energieboekhouding delen, in plaats van concurrerende engines te vormen.

**Nog niet besloten:** of een beperkt multilaags raster voldoende is, of adaptieve lagen noodzakelijk zijn; welke extra velden eventueel in de app thuishoren; hoe lang historische weersdata nodig zijn; hoe de langgolvige straling wordt afgeleid; en hoe stromend water wordt afgehandeld.

#### 5. Eerstvolgende concrete actie

Werk nu een **toepassings- en initialisatieontwerp** uit voor drie klassen:
1. stilstaand/klein en ondiep water;
2. stilstaand dieper of aantoonbaar gestratificeerd water;
3. stromend of hydrologisch beïnvloed water.

Per klasse moet het ontwerp vastleggen:
- wanneer een 1D-kolom geldig genoeg is;
- welke minimale metingen en locatiekenmerken nodig zijn;
- hoe de initiële toestand wordt bepaald wanneer geen actuele meting bestaat;
- wanneer alleen een oppervlaktetemperatuur, een verticaal profiel of helemaal geen betrouwbare schatting kan worden gegeven;
- welke onzekerheidsstatus zichtbaar moet zijn;
- welke validatiegegevens nodig zijn om de klasse vrij te geven.

**Status en goedkeuringspoort:** dit is een read-only inventaris van de huidige broncode en een ontwerpvoorstel. Er is geen implementatie, typewijziging, extra databron, parameter, formule, database- of scorewijziging uitgevoerd. Implementatie blijft geblokkeerd totdat de eigenaar een concreet ontwerp goedkeurt. De scoreberekeningsaudit blijft uitgesteld.


### Ontwerpuitwerking — toepassingsklassen en initialisatie van de waterkolom (24 november 2026)

**Doel:** de vorige actie concreet uitwerken: bepalen wanneer een verticale 1D-kolom bruikbaar is en hoe de thermische begintoestand verantwoord kan worden vastgesteld. Dit is een wetenschappelijke ontwerpuitwerking op basis van de review van Piccolroaz et al. (2024), GLM- en Simstrat-documentatie en de actuele Vislogboek-invoerinventaris. Geen implementatie of databronkeuze is goedgekeurd.

#### 1. Eerst een belangrijke correctie op de simpele driedeling

De indeling "ondiep = eenvoudig, diep = multilaags, stromend = apart" is nuttig als eerste oriëntatie, maar niet voldoende als fysische geldigheidscontrole.

Een 1D-waterkolommodel veronderstelt dat horizontale variatie en horizontale dichtheidsgradiënten voldoende klein zijn om één verticale kolom representatief te laten zijn. De review van Piccolroaz et al. (2024) beschrijft hiervoor onder andere de Lake Number/Wedderburn-benadering als maat voor de verhouding tussen stabiliserende stratificatie en door wind veroorzaakte verstoring. Ook de geometrie van het waterlichaam is relevant; complexe, vertakte of horizontaal sterk variërende wateren zijn niet vanzelfsprekend geschikt voor één 1D-kolom.

**Gevolg:** alleen `waterType`, totale diepte en lokale wind zijn niet genoeg om formeel vast te stellen dat een 1D-model geldig is. De huidige app heeft niet alle invoer om een Lake Number betrouwbaar te bepalen. We mogen de 1D-aanname daarom voorlopig alleen als toepassingshypothese gebruiken, niet als automatisch bewezen eigenschap van een stek.

#### 2. Toepassingsklassen voor het ontwerp

| Klasse | Fysische kenmerken | Modelgedrag dat onderzocht moet worden | Geldigheidsgrens |
|---|---|---|---|
| A. Ondiep en meestal goed gemengd | Kleine diepte; wind of dagelijkse convectie kan de waterkolom vaak mengen; bodeminvloed relatief belangrijk | Eén thermische toestand kan volstaan wanneer verticale verschillen aantoonbaar klein zijn; dezelfde engine moet kunnen opschalen naar meerdere lagen als een profiel ontstaat | Zonder profielmetingen mag "goed gemengd" niet alleen uit de diepte worden afgeleid |
| B. Stilstaand water met verticale stratificatie | Voldoende diepte/rust en zoninstraling voor een warme bovenlaag, thermocline en koelere diepe laag; in winter inverse stratificatie mogelijk | Multilaags verticale toestand; temperatuur op meet-/visdiepte; zomer-, winter- en overgangsregimes | Vereist voldoende begininformatie en lokale morfometrie; 1D blijft afhankelijk van beperkte horizontale variatie |
| C. Hydrologisch beïnvloed of stromend water | Rivier/kanaal, relevante in-/uitstroom, temperatuurpluim of advectie | Warmteadvectie en instroomtemperatuur kunnen de lokale temperatuur bepalen; een geïsoleerde stilstaande kolom is onvoldoende | Zonder debiet, stroomsnelheid en watertemperatuur van instroom mag geen hoge betrouwbaarheid worden geclaimd |

Klasse A en B hoeven geen afzonderlijke engines te worden. Ze kunnen conceptueel verschillende verticale resolutie van dezelfde toestand gebruiken: één goed-gemengde laag is een limietgeval van een model dat ook een profiel kan representeren. Dit moet later numeriek worden aangetoond en getest; het is nog geen keuze voor een algoritme.

Klasse C is geen simpele extra correctie op luchttemperatuur. Wanneer advectie bepalend is, moet die fysisch worden beschreven of de uitkomst expliciet als beperkt/onvoldoende onderbouwd worden gemarkeerd.

#### 3. Initialisatie: de absolute temperatuurtoestand is het kernprobleem

Een waterkolommodel rekent de verandering van een bestaande toestand door. Het kan de absolute temperatuur niet betrouwbaar uit alleen het weer van de komende dagen afleiden. De huidige app haalt drie dagen historische weersgegevens op en heeft geen aangetoond persistent meerlaags thermisch toestandsobject. Een scalar prognosesnapshot is niet hetzelfde als een volledig verticaal profiel.

De volgende initialisatievolgorde is daarom de meest verdedigbare ontwerpoptie:

1. **Actueel gemeten verticaal profiel:** meerdere betrouwbare metingen op bekende dieptes, met bijbehorende meettijd. Dit geeft de sterkste lokale beginconditie.
2. **Actuele meting op één diepte:** legt alleen de temperatuur rond die meetdiepte vast. Het volledige profiel is daarmee niet bekend; andere lagen moeten als onzeker worden behandeld of vanuit een eerder geldige modeltoestand worden doorberekend.
3. **Eerder geldige modeltoestand:** wanneer een toekomstige implementatie een gevalideerd profiel bewaart, kan de toestand chronologisch met nieuwe weerforcing worden voortgezet. De state moet versie, tijdstip, invoerherkomst en onzekerheid bewaren.
4. **Historische lokale profielmetingen:** kunnen een seizoensgebonden prior/verwachting leveren, maar zijn geen actuele meting en mogen niet als actuele toestand worden gepresenteerd.
5. **Geen lokaal meetanker of bruikbaar profiel:** een fysische spin-up zou een voldoende lange historische meteorologische forcing en locatiekenmerken nodig hebben om de invloed van een gekozen startprofiel te laten afnemen. De huidige drie dagen terugkijkende weerreeks is daarvoor geen aangetoonde basis. Zonder voldoende historische forcing en initiële informatie moet de absolute temperatuur als zwak bepaald worden gemarkeerd.

**Belangrijke grens:** "start op 4 °C" of "start op de gemiddelde luchttemperatuur" is geen wetenschappelijk neutrale oplossing. Zo'n aanname kan een numerieke berekening laten lopen, maar bewijst niet dat de werkelijke waterkolom die toestand had. Een eventuele spin-up-/initialisatiemethode moet worden getest op gevoeligheid voor de gekozen beginconditie en mag niet met een vaste startwaarde worden gelegitimeerd.

#### 4. Meetdiepte en profielregistratie

De huidige types ondersteunen `measurementDepthM` op echte temperatuurmetingen en meerdere metingsevents per sessie. De actuele prognoseaanroep geeft de doelmeetdiepte echter niet door aan de thermische engine. De volgende ontwerpcriteria volgen hieruit:

- Meetdiepte moet bij elke meting worden behouden; ontbrekende meetdiepte blijft expliciet onbekend en mag niet als oppervlaktemeting worden geïnterpreteerd.
- Metingen die een verticaal profiel vormen moeten voldoende dicht bij hetzelfde tijdstip en dezelfde locatie zijn genomen; verspreide seizoensmetingen zijn geen gelijktijdig profiel.
- Een meting op 0,3 m mag niet zonder onderbouwing als representatief voor 1,5 m worden gebruikt.
- Uitvoer moet expliciet aangeven of de waarde een oppervlaktemeting, bulk-/gemiddelde kolomtemperatuur of schatting op een specifieke diepte is.
- Validatie moet de gemeten diepte en de voorspelde diepte exact matchen of een expliciete interpolatiemethode toetsen.

#### 5. Onzekerheids- en uitvoerstatussen die het ontwerp nodig heeft

De volgende conceptuele statussen zijn voorgesteld om schijnprecisie te voorkomen; dit zijn geen goedgekeurde UI- of typeschemawijzigingen:

- **Gemeten op doelmoment en doel-/meetdiepte:** lokale meting leidend.
- **Profiel geïnitialiseerd uit meerdere metingen:** verticale toestand lokaal verankerd.
- **Eén diepte gemeten, overige lagen geschat:** alleen de gemeten laag sterk verankerd; profiel onzeker.
- **Doorgerekend vanuit eerdere modeltoestand:** modelcontinuïteit aanwezig; onzekerheid neemt toe met tijd en ontbrekende forcing.
- **Historisch seizoensprofiel als prior:** bruikbaar als achtergrond, niet als actuele meting.
- **Onvoldoende initiële informatie:** geen betrouwbare absolute temperatuurclaim; toon een expliciete onzekerheids-/onbekendstatus.

Een numeriek getal mag niet de indruk geven dat het profiel bekend is wanneer alleen de weersontwikkeling bekend is.

#### 6. Ontwerpconclusie

De kern van het temperatuurprobleem is niet alleen het kiezen van een betere formule voor warmteverlies. Het model moet drie zaken tegelijk beheersen:
- **toestand:** wat is de huidige temperatuurverdeling door de diepte?
- **ontwikkeling:** hoe veranderen warmte-invoer, warmteverlies, menging en faseovergang die toestand?
- **geldigheid:** is de gekozen waterkolomrepresentatie passend voor dit watertype en zijn de invoergegevens voldoende?

Daarom blijft de voorkeursrichting een GLM-geïnformeerde verticale toestand met KNMI-gebaseerde oppervlaktewarmtebalans, maar de implementatie moet pas worden ontworpen nadat initialisatie en geldigheid per watertype expliciet zijn geregeld. De eerste concrete technische ontwerpkeuze is niet het aantal lagen; het is de toestand-/initialisatie- en geldigheidsarchitectuur.

#### 7. Bronnen

- Piccolroaz, S. et al. (2024), *Lake Water Temperature Modeling in an Era of Climate Change: Data Sources, Models, and Future Prospects*, Reviews of Geophysics 62, e2023RG000816, DOI: 10.1029/2023RG000816. Zie de bespreking van 1D-modelaannames, horizontale homogeniteit, Lake Number/Wedderburn en bathymetrie: https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2023RG000816
- Hipsey et al., actuele GLM-documentatie. GLM beschrijft expliciet de 1D-aanname van geen horizontale variatie en de flexibele Lagrangiaanse lagen: https://aquaticecodynamics.github.io/glm-aed/
- Gaudard et al. (2019), *Toward an open access to high-frequency lake modeling and statistics data for scientists and practitioners – the case of Swiss lakes using Simstrat v2.1*, Geoscientific Model Development 12, 3955–3974. Laat zien dat modelprestaties ook samenhangen met meteorologische forcing, morfologie, hydrologische/throughflow-warmte en lichtpenetratie: https://gmd.copernicus.org/articles/12/3955/2019/

#### 8. Volgende actie

De volgende ontwerpstap is een **toestands- en gegevenscontract** voor de bestaande thermische engine uitwerken, zonder code te wijzigen. Dit contract moet vastleggen:
- wat de modeltoestand minimaal bevat (temperatuur per laag, laagdiepte/-grenzen, tijdstip, water-/ijsfase en onzekerheid);
- welke invoer verplicht, optioneel of onbekend mag zijn;
- hoe één dieptemeting, een verticaal profiel, een historische prior en een ontbrekend beginprofiel van elkaar verschillen;
- hoe de toestand chronologisch wordt voortgezet zonder toekomstige data te gebruiken;
- wanneer het model een getal mag tonen en wanneer alleen een onbekend-/lage-betrouwbaarheidsstatus verantwoord is;
- welke tests de 4 °C-dichtheidsanomalie, zomerthermocline, menging, ijsfase en energie-/temperatuurbehoud moeten bewijzen.

**Besluitpoort:** alleen het uitwerken en documenteren van dit contract is nu toegestaan. Geen type-, database-, UI-, formule-, parameter-, bron- of scorewijzigingen uitvoeren voordat het concrete ontwerp aan de eigenaar is voorgelegd en expliciet goedgekeurd.


### Aanvullend ontwerpbesluit in voorbereiding — initiële toestand, spin-up en zoet-/brakwater (24 november 2026)

**Aanleiding:** verdieping van het initialisatieonderzoek. Twee aanvullende wetenschappelijke punten zijn gevonden die de ontwerpvoorwaarden aanscherpen: (1) procesmodellen gebruiken een expliciete initiële watertemperatuurtoestand en vaak een lange spin-up; (2) het dichtheidsmaximum rond 4 °C geldt voor zuiver/zoet water en verschuift bij toenemende saliniteit.

#### 1. Wat laten echte modelstudies zien over initialisatie?

Mesman et al. (2025) beschrijven in hun vergelijking van 73 meren dat de initiële temperatuurprofielen werden geschat uit waargenomen watertemperaturen; beschikbare metingen rondom de startdatum werden gemiddeld om het initiële profiel te bepalen. De simulaties gebruikten vervolgens een spin-upperiode van één jaar. Dit is de werkwijze van die specifieke studie en geen universele voorgeschreven duur, maar het bewijst wel dat een volwaardige meerlagenmodelvergelijking niet simpelweg start vanuit alleen een paar uur of dagen weersverwachting.

Een studie naar operationele lake-modelinitialisatie beschrijft eveneens dat onnauwkeurige starttemperaturen fouten van meerdere graden kunnen veroorzaken en dat modelgebaseerde cycling/data-assimilatie een betere starttoestand kan opleveren dan een eenvoudige interpolatie van satelliettemperatuur. <https://gmd.copernicus.org/articles/15/6659/2022/>

Een globale lake-modelvergelijking laat zien dat verschillende onderzoeksgroepen verschillende initialisatiekeuzes gebruiken, waaronder gemeten profielen, een isotherm profiel van 4 °C of profielen op basis van gemiddelde luchttemperatuur. Dit zijn modelconfiguraties voor uiteenlopende onderzoeksdoelen; ze bewijzen niet dat 4 °C of gemiddelde luchttemperatuur een betrouwbare lokale startwaarde is voor een kortetermijn-visprognose. <https://gmd.copernicus.org/articles/15/4597/2022/>

**Ontwerpconclusie:** een vaste startwaarde van 4 °C of de actuele luchttemperatuur mag niet als standaardwaarheid worden gebruikt. Een spin-up kan alleen helpen wanneer de historische meteorologische forcing, locatiekenmerken en duur voldoende zijn om de gekozen beginconditie minder bepalend te maken. De benodigde duur moet per model/watertype met gevoeligheidstests worden vastgesteld. De huidige drie dagen historische weerdekking is hiervoor geen bewezen basis.

#### 2. Dichtheidsanomalie: expliciet onderscheid tussen zoet en brak/zout water

De dichtheidsmaximumtemperatuur rond 4 °C geldt voor zuiver water bij atmosferische druk. De TEOS-10-handleiding beschrijft dat de temperatuur van maximale dichtheid afhangt van absolute saliniteit en druk. Bij toenemende saliniteit verschuift het maximum naar lagere temperaturen; bij hoge saliniteit kan het zelfs onder het vriespunt liggen. Ook in brak water is de interactie tussen temperatuur en zoutgehalte relevant voor stratificatiestabiliteit.

**Gevolg voor Vislogboek:** de bestaande ontwerpeis "dichtheidsanomalie rond 4 °C" moet worden gelezen als de zoetwaterreferentie. Voor locaties waarvan zoetwaterkarakter niet betrouwbaar bekend is, mag het model niet zonder meer dezelfde zoetwater-dichtheidsrelatie als universele waarheid toepassen. De huidige `FishingLocation` heeft geen saliniteit-/geleidbaarheidsveld en de huidige meettypen registreren dit niet.

Er is nog geen besluit genomen om saliniteit als nieuw invoerveld toe te voegen. Eerst moet worden bepaald welke Nederlandse watertypen/locaties realistisch brak of zout kunnen zijn en of een eenvoudige classificatie (zoet / brak / onbekend) voldoende is of dat een meetbare geleidbaarheid/saliniteit nodig is.

#### 3. Conceptueel toestandscontract voor de toekomstige thermische engine

Dit is een ontwerpcontract op begripsniveau, geen TypeScript-interface of goedgekeurd databaseschema.

| Toestandsonderdeel | Minimale betekenis | Waarom noodzakelijk |
|---|---|---|
| Referentie-identiteit | Stek/waterlichaam en toepassingsklasse | Voorkomt dat een toestand onbedoeld tussen verschillende wateren wordt hergebruikt |
| Modeltijd en modelversie | Exact tijdstip, versie van fysica en invoercontract | Chronologische reproduceerbaarheid en geen future leakage |
| Verticale laagstructuur | Diepte-interval en temperatuur van iedere laag | Maakt temperatuur op visdiepte mogelijk |
| Waterkolomgeometrie | Totale diepte en waar beschikbaar oppervlakte/volume per diepte | Bepaalt warmtecapaciteit en laagvolume; vereenvoudigingen moeten expliciet zijn |
| Dichtheidsregime | Zoet/brak/zout/onbekend en gebruikte toestandsvergelijking | De 4 °C-anomalie mag alleen onder passende waterchemische aannames gelden |
| Fase | Vloeibaar water, ijs en waar relevant sneeuw als afzonderlijke toestand | Voorkomt negatieve vloeibare watertemperaturen en onjuiste isolatie/latente warmte |
| Bodem-/grensuitwisseling | Status en bron van bodemwarmte en oppervlaktefluxen | Maakt energie-uitwisseling controleerbaar |
| Hydrologische forcing | Instroom/uitstroom, debiet en temperatuur indien aanwezig | Nodig waar advectie de lokale warmtebalans beïnvloedt |
| Forcingdekking | Tijdreeks, bron, ophaaltijdstip, ontbrekende uren en variabelen | Voorkomt dat onvolledige of achteraf opgehaalde gegevens als volledige forcing gelden |
| Beginconditie en herkomst | Meting/profiel, eerdere modeltoestand, historisch prior of onbekend | Maakt duidelijk waarop de absolute temperatuurtoestand is gebaseerd |
| Onzekerheid en geldigheid | Onzekerheid per diepte plus geldigheidsstatus van het model | Voorkomt schijnprecisie en onterechte 1D-/zoetwaterclaims |

Afgeleide grootheden zoals dichtheid, stabiliteit, thermoclinediepte en temperatuur op een opgegeven visdiepte kunnen uit deze toestand worden berekend. Ze mogen niet worden opgeslagen of gepresenteerd alsof ze direct gemeten zijn.

#### 4. Initialisatiecontract — voorgestelde prioriteitsvolgorde

1. Gelijktijdig lokaal temperatuurprofiel op bekende dieptes en gevalideerde meetmethode.
2. Vorige gevalideerde modeltoestand voor dezelfde stek, met chronologische forcing en bekende modelversie.
3. Eén lokale temperatuurmeting op bekende diepte, met expliciete onzekerheid voor niet-gemeten lagen.
4. Historisch lokaal profiel uit vergelijkbare seizoens-/diepteomstandigheden, uitsluitend als prior en niet als actuele meting.
5. Geen bruikbare meting of toestand: alleen een modeluitkomst als een onderbouwde historische forcing/spin-up en locatie-invoer beschikbaar zijn; anders status "onvoldoende initiële informatie".

Deze volgorde is een ontwerpvoorstel. Het is nog niet besloten welke bronnen de app technisch gaat ondersteunen of hoe de toestand wordt opgeslagen.

#### 5. Bronvermelding

- Mesman et al. (2025), *Learning from a large-scale calibration effort of multiple lake temperature models*, HESS 29, 1183–1209. Initiële profielen gebaseerd op waargenomen watertemperatuur en één jaar spin-up in deze specifieke modelvergelijking: https://hess.copernicus.org/articles/29/1183/2025/
- Golub et al. (2022), *A framework for ensemble modelling of climate change impacts on lakes worldwide: the ISIMIP Lake Sector*, GMD 15, 4597–4623. Beschrijft uiteenlopende initialisatie- en spin-upkeuzes voor lokale en globale toepassingen: https://gmd.copernicus.org/articles/15/4597/2022/
- Mann et al. (2022), *Inland lake temperature initialization via coupled cycling with atmospheric data assimilation*, GMD 15, 6659–6681. Bespreekt het belang van nauwkeurige initiële watertemperatuur voor voorspellingen van dagen tot weken: https://gmd.copernicus.org/articles/15/6659/2022/
- IOC, SCOR & IAPSO (2010), *The International Thermodynamic Equation of Seawater — 2010*, UNESCO Manuals and Guides No. 56, §3.42. Temperatuur van maximale dichtheid als functie van saliniteit en druk: https://www.jodc.go.jp/info/ioc_doc/Manual/188170e.pdf

#### 6. Uitkomst en eerstvolgende actie

**Nieuwe vastgestelde randvoorwaarden:**
- Een goede meerlagenvoorspelling heeft een expliciete initiële temperatuurtoestand nodig; een korte weerreeks is geen vervanging.
- Een spin-up is geen magische reset: de duur moet aantoonbaar lang genoeg zijn voor de relevante diepe lagen en seizoensregimes.
- De 4 °C-dichtheidsanomalie is een zoetwaterreferentie; saliniteit kan de temperatuur van maximale dichtheid verschuiven.
- De huidige Vislogboek-typen bevatten geen saliniteit/geleidbaarheid, geen volledig verticaal profielobject en geen persistente meerlaagse modeltoestand.

**Volgende actie:** werk het toestandscontract om naar een formele ontwerpbeslissing met expliciete minimale, optionele en ontbrekende gegevens. Daarbij moet worden beslist welke watertypen binnen de eerste modelversie vallen (voorlopig bij voorkeur stilstaand zoet water), en welke wateren alleen een beperkte schatting of "onvoldoende invoer" mogen krijgen. Daarna pas kan een concrete implementatievoorstel worden opgesteld.

**Besluitpoort blijft gesloten:** geen code, types, database, UI, formules, parameters, nieuwe databronnen of scoreberekening wijzigen zonder expliciete goedkeuring. De scoreberekeningsaudit blijft uitgesteld.


### Formele ontwerpbeslissing in voorbereiding — eerste toepassingsscope en historische initialisatie (24 november 2026)

**Doel:** het toestandscontract vertalen naar een toetsbare eerste modelscope. Dit is een ontwerpbeslissing voor review, geen toestemming om code, databronnen, formules of parameters te wijzigen.

#### 1. Nieuwe bevinding: voldoende historische meteorologische forcing is in principe beschikbaar

De eerdere audit stelde vast dat de huidige `weatherService.ts` slechts `past_days=3` en `forecast_days=8` opvraagt. Dat is onvoldoende om zonder lokale watertemperatuurmeting de seizoensgebonden thermische begintoestand van een waterkolom te reconstrueren.

Er bestaan wel twee relevante historische bronnen:

**KNMI-waarnemingen**
- Het KNMI Data Platform heeft uurlijkse gevalideerde waarnemingen vanaf 1951.
- De dataset bevat stationwaarnemingen; de beschikbare variabelen omvatten onder meer luchttemperatuur, wind, waterdamp/dauwpunt en relatieve vochtigheid. KNMI-datasets beschrijven ook straling/bewolking en andere meteorologische waarnemingen, maar de exacte variabelen en volledigheid moeten per dataset/station en periode worden gecontroleerd.
- Gevalideerde data kunnen vertraagd beschikbaar komen en stationreeksen kunnen inhomogeniteiten bevatten door verplaatsingen en veranderde meetmethoden. Ze zijn dus geen perfecte lokale forcing voor iedere visstek.

**Open-Meteo Historical Weather API**
- Biedt uurlijkse heranalyse vanaf 1940 (ERA5) of 1950 (ERA5-Land), met onder meer luchttemperatuur, relatieve vochtigheid, dauwpunt, wind, bewolking, neerslag en zonnestraling.
- ERA5-Land heeft circa 0,1° (~11 km) ruimtelijke resolutie; ERA5 circa 0,25° (~25 km). De API documenteert dat heranalyse waarnemingen combineert met modelmatige schattingen en ruimtelijke gaten vult.
- Dit is een kandidaat voor continue coördinaatgebonden historische forcing, niet een lokale waarneming. De representativiteit voor kleine wateren, beschutting en lokale wind moet worden gevalideerd.

**Ontwerpgevolg:** een lange spin-up is niet bij voorbaat onmogelijk. De benodigde forcing kan mogelijk uit KNMI-stationdata en/of ERA5-Land worden opgebouwd. Er is nog geen keuze gemaakt tussen deze bronnen. De KNMI-fysica blijft de primaire wetenschappelijke referentie; de bron van meteorologische forcing is een afzonderlijke ontwerpkeuze.

#### 2. Voorgestelde eerste toepassingsscope

Voor de eerste versie van de nieuwe thermische berekening wordt voorgesteld:

**Binnen primaire scope**
- Stilstaand, zoet buitenwater.
- Kleine vijvers/plassen en grotere stilstaande plassen, maar met afzonderlijke validatie op ondiepe en diepere wateren.
- Een verticale waterkolom die zowel goed gemengde omstandigheden als zomerstratificatie, winterse inverse stratificatie en overgang/menging kan representeren.
- Temperatuur op een opgegeven diepte, mits de doel-/meetdiepte bekend is en de begininformatie voldoende is.

**Buiten primaire nauwkeurigheidsclaim**
- Stromende rivieren en kanalen wanneer advectie/debiet niet bekend is.
- Wateren met relevante instroom, lozing of temperatuurpluimen zonder die gegevens.
- Brak/zout water zonder betrouwbare saliniteit/geleidbaarheid of passende toestandsvergelijking.
- Wateren waarvan de horizontale verschillen zo groot zijn dat één verticale kolom niet representatief is.

Deze locaties hoeven niet per se uit Vislogboek te verdwijnen. Wel moet de uitkomst als beperkt toepasbaar of onvoldoende onderbouwd worden geclassificeerd. Een categorieveld zoals "rivier" of "kanaal" is op zichzelf geen kwantitatieve stromingsmeting.

#### 3. Voorgesteld initialisatiepad voor de eerste modelversie

De eerste modelversie moet twee paden expliciet ondersteunen:

**Pad A — lokaal gemeten**
1. Gebruik een betrouwbare lokale temperatuurmeting met tijdstip, locatie, methode en meetdiepte.
2. Gebruik een gelijktijdig profiel als dit beschikbaar is; anders wordt alleen de gemeten diepte direct verankerd.
3. Start de verticale toestand met expliciete onzekerheid in de niet-gemeten lagen.
4. Zet die toestand chronologisch voort met historische/actuele weerforcing.

**Pad B — geen lokale watertemperatuurmeting**
1. Haal historische meteorologische forcing op voor de locatie of het best representatieve KNMI-station.
2. Initialiseer met meerdere plausibele startprofielen, niet één verborgen vaste temperatuur.
3. Voer een gevoeligheids-/spin-uptest uit over meerdere startprofielen en perioden.
4. Beoordeel of de uitkomst op de gevraagde diepte voldoende naar dezelfde toestand convergeert.
5. Alleen als de uitkomst voldoende stabiel is en de forcing compleet genoeg is, mag een numerieke schatting met expliciet lagere betrouwbaarheid worden getoond.
6. Als startprofielen niet convergeren, forcing te kort/onvolledig is of de watertype-aannames niet passen, toon dan "onvoldoende informatie voor een betrouwbare absolute schatting" in plaats van een schijnprecies getal.

**Belangrijke nuance:** de éénjarige spin-up in Mesman et al. (2025) is een studieconfiguratie, geen standaardduur die Vislogboek moet kopiëren. De eerste onderzoeksbenchmark moet meerdere startprofielen en meerdere spin-upvensters vergelijken (bijvoorbeeld 30, 90, 180 en 365 dagen als experimentele vensters). Geen van deze perioden is al als productieparameter gekozen. De acceptatie moet worden gebaseerd op convergentie van de temperatuur per diepte, niet op de kalenderduur alleen.

#### 4. Minimale invoercontracten — ontwerpvoorstel

| Invoer | Primaire status | Gedrag als ontbrekend |
|---|---|---|
| Locatiecoördinaten | Verplicht | Geen locatiegebonden meteorologische forcing; geen lokale modelclaim |
| Doeltijd en tijdzone | Verplicht | Geen reproduceerbare tijdsgerichte voorspelling |
| Waterklasse (stilstaand/stromend/onbekend) | Verplicht voor geldigheidsbeoordeling | Onbekende klasse geeft beperkte toepasbaarheid |
| Zoet/brak/zout/onbekend | Verplicht als classificatie, exacte saliniteit optioneel | Onbekend mag de zoetwater-dichtheidsrelatie niet automatisch rechtvaardigen |
| Totale diepte | Verplicht voor waterkolom/KNMI-diepte-effect | Zonder diepte geen onderbouwde absolute thermische opslag |
| Historische meteorologische reeks | Verplicht voor pad B; voor pad A afhankelijk van verstreken tijd | Onvoldoende dekking leidt tot hogere onzekerheid of geen betrouwbare schatting |
| Temperatuur, wind, vochtigheid, bewolking, kortgolvige straling | Kernforcing; bron en dekking per variabele registreren | Ontbrekende kernforcing niet stilzwijgend invullen; alleen een onderbouwde afleiding na aparte validatie |
| Neerslag/sneeuw | Relevant voor neerslag- en ijsregime | Bij winter-/ijscondities ontbrekende sneeuwinformatie verhoogt onzekerheid |
| Actuele watertemperatuurmeting | Optioneel maar sterk gewenst | Zonder meting uitsluitend pad B |
| Meetdiepte en meetmethode | Verplicht bij een meetwaarde | Onbekende diepte/methode verlaagt bruikbaarheid als profielanker |
| Hypsografie/bodemvorm | Optioneel in eerste benadering | Vereenvoudigde geometrie moet als aanname en onzekerheidsbron worden geregistreerd |
| Waterhelderheid/lichtuitdoving | Optioneel in eerste benadering | Minder zekerheid over verdeling van zonnewarmte door de waterkolom |
| Stroming, debiet, instroomtemperatuur | Buiten primaire scope | Geen hoge betrouwbaarheid voor hydrologisch beïnvloede wateren |

"Verplicht" betekent hier: vereist voor de genoemde modelclaim, niet dat het veld al in de huidige app aanwezig is. De huidige code-inventaris toont dat meerdere van deze velden nog ontbreken.

#### 5. Modelstructuur: wat is nu wel en niet besloten?

**Wel als ontwerpuitgangspunt**
- Eén canonieke thermische toestand binnen de bestaande waterthermische engine.
- Een verticale temperatuurverdeling als wetenschappelijke referentie, GLM-geïnformeerd.
- KNMI/De Bruin-Wessels als primaire referentie voor oppervlaktewarmtebalans en ijs-/faseprocessen.
- De zoetwater-dichtheidsanomalie rond 4 °C en temperatuurafhankelijke dichtheidsstabiliteit moeten worden meegenomen.
- Dezelfde toestand moet een goed-gemengde kolom én een gestratificeerde kolom kunnen representeren.
- Lokale metingen zijn de sterkste initialisatie en validatiebron; heranalyse is meteorologische forcing, geen watermeting.

**Nog niet besloten**
- Vast raster of adaptieve Lagrangiaanse lagen.
- Aantal lagen of laagresolutie.
- Exacte warmtefluxformules en parameterwaarden.
- Keuze KNMI-stationdata versus ERA5-Land versus combinatie.
- Exacte spin-upduur of convergentiedrempel.
- Welke nieuwe locatie-/meetvelden in de app moeten worden toegevoegd.
- Of en hoe een persistente modeltoestand wordt opgeslagen.
- Exacte gebruikersinterface voor onzekerheid.

#### 6. Validatiepoorten vóór implementatie

Een kandidaatmodel mag pas als eerste versie worden voorgesteld wanneer het ten minste de volgende bewijzen kan leveren:

1. **Startconditie-onafhankelijkheid:** verschillende plausibele startprofielen convergeren voldoende op relevante doel-/visdieptes na de gekozen historische forcing.
2. **Warmtebalans:** geen onverklaarde energiecreatie/-verdwijning; fluxen en warmteopslag zijn controleerbaar.
3. **Zomerprofiel:** opwarming bovenlaag, thermocline en koelere onderlaag waar waarnemingen die tonen.
4. **Winterprofiel:** gedrag rond 4 °C, inverse stratificatie en geen normale vloeibare watertemperatuur onder 0 °C.
5. **Overgang en menging:** wind, afkoeling en convectie veroorzaken fysisch plausibele menging; geen kalendergestuurde kunstmatige omslag.
6. **Dieptevalidatie:** MAE, RMSE en bias per meetdiepte, met onafhankelijke meetperioden.
7. **Onzekerheid:** gerapporteerde onzekerheidsbanden worden getoetst op dekking; een lage betrouwbaarheid wordt niet als hoge precisie gepresenteerd.
8. **Watertypevaliditeit:** resultaten voor stilstaand zoet water worden niet zonder aparte tests doorgetrokken naar stromend of brak/zout water.
9. **Forecast-as-of discipline:** historische forcing, modelrun en meetdata worden op tijdstip/versie vastgelegd; toekomstige informatie mag geen historische voorspelling beïnvloeden.

#### 7. Bronnen voor deze ontwerpstap

- KNMI, *Watertemperatuur- en ijsgroeimodel van het KNMI*. Beschrijft gevalideerde prestaties voor stilstaand zoet buitenwater, oppervlaktewarmteoverdracht, diepteafhankelijkheid en wintergedrag: https://www.knmi.nl/kennis-en-datacentrum/achtergrond/watertemperatuur-en-ijsgroeimodel-van-het-knmi
- KNMI Data Platform, *Hourly, validated and automated in-situ ground-based meteorological observations*. Uurlijkse waarnemingen vanaf 1951, variabelen, validatievertraging en datasetbeperkingen: https://dataplatform.knmi.nl/dataset/hourly-in-situ-meteorological-observations-validated-1-0
- KNMI Data Platform, *Hourly observations technical documentation*. Beschrijving van variabelen zoals temperatuur, relatieve vochtigheid, dauwpunt, wind en overige velden: https://dataplatform.knmi.nl/dataset/docs/hourly-in-situ-meteorological-observations-1-0
- Open-Meteo, *Historical Weather API*. ERA5/ERA5-Land/IFS dekking, uurlijkse variabelen, resoluties en uitleg dat heranalyse waarnemingen combineert met modelmatige schattingen: https://open-meteo.com/en/docs/historical-weather-api
- Open-Meteo, *Historical Forecast API*. Historische voorspellingen vanaf circa 2022; nuttig voor aparte forecast-verificatie, niet als lange klimaatreeks: https://open-meteo.com/en/docs/historical-forecast-api
- GLM official documentation. 1D verticale temperatuur-, saliniteits- en dichtheidsprofielen, menging, oppervlakte/bodemprocessen en expliciete aanname van geen horizontale variatie: https://aquaticecodynamics.github.io/glm-aed/
- Mesman et al. (2025), *Learning from a large-scale calibration effort of multiple lake temperature models*, HESS 29, 1183–1209. Initialisatie op basis van gemeten profielen en één jaar spin-up binnen die studie; resultaten verschillen per meer en prestatiemaat: https://hess.copernicus.org/articles/29/1183/2025/

#### 8. Uitkomst en eerstvolgende actie

**Uitkomst:** de eerste modelversie kan zich het best richten op stilstaand zoet water. Een meting-onafhankelijk pad is wetenschappelijk onderzoekbaar doordat historische weerreeksen beschikbaar zijn, maar alleen als de modeltoestand vanuit verschillende startprofielen aantoonbaar convergeert. De huidige drie dagen weerhistorie is daarvoor onvoldoende. KNMI-stationwaarnemingen en ERA5-Land zijn kandidaatbronnen; nog geen van beide is geselecteerd of aangesloten.

**Volgende actie:** maak een reproduceerbaar offline onderzoeksprotocol (zonder productiecode te wijzigen) waarin één of meer representatieve wateren worden doorgerekend met:
- historische meteorologische forcing uit een kandidaatbron;
- meerdere plausibele beginprofielen;
- experimentele spin-upvensters van 30/90/180/365 dagen;
- ondiep en dieper stilstaand zoet water;
- vergelijking van modeltemperatuur met beschikbare onafhankelijke watertemperatuurprofielen.

Het protocol moet eerst vaststellen of de startconditie voldoende uitdempt en welke forcingbron het best aansluit op de KNMI-heat-balance-basis. Pas daarna wordt een concreet technisch implementatieontwerp aan de eigenaar voorgelegd.

**Besluitpoort blijft gesloten:** geen productiecode, types, database, UI, formule, parameters, extra databronnen, scoreberekening of deployment wijzigen zonder expliciete goedkeuring. Dit documenteert alleen de onderzoeksrichting. De scoreberekeningsaudit blijft uitgesteld.


### Validatieonderzoek — beschikbare Nederlandse en internationale temperatuurprofielen (24 november 2026)

**Doel:** nagaan welke echte watertemperatuurprofielen beschikbaar zijn om het voorgestelde model te toetsen. Dit onderzoek is read-only; er zijn geen meetbestanden gedownload/geïmporteerd, geen gebruikersrecords geraadpleegd en geen modelberekeningen uitgevoerd.

#### 1. Nederlandse referentie: Klinkenbergerplas

Het rapport *Haalbaarheid TEO Klinkenbergerplas* (Syntraal, 16 december 2021), opgesteld voor gemeenten Oegstgeest/Teylingen en Hoogheemraadschap Rijnland, bevat een concrete Nederlandse diepe-plas-casus:

- De plas wordt beschreven als geïsoleerd en nagenoeg stilstaand, met een oppervlak van circa 288.000 m² en een maximale diepte van circa 34 m.
- Hoogheemraadschap Rijnland leverde temperatuurmetingen aan over de periode 1985–2021.
- Het rapport toont een gemiddeld seizoensprofiel: de bovenste circa 6 m warmt in de zomer sterk op tot ongeveer 20 °C, terwijl op 15 m en dieper de temperatuur vrijwel jaarrond rond 4–5 °C blijft.
- Dit is precies het soort Nederlandse praktijkprofiel dat de noodzaak van een verticale temperatuurtoestand illustreert.

**Beperking:** het rapport publiceert grafieken en samenvattende profielen, niet de ruwe tijdgestempelde meetreeksen. De datahouder is Hoogheemraadschap Rijnland. Deze bron kan daarom nu als kwalitatieve/seizoensmatige referentie worden gebruikt; voor kwantitatieve kalibratie of onafhankelijke validatie moeten ruwe meetgegevens, meetdieptes, tijdstippen en meetmethoden worden opgevraagd en de gebruiksvoorwaarden worden vastgesteld.

Bron: Syntraal (2021), *Haalbaarheid TEO Klinkenbergerplas*, hoofdstuk 3.3–3.4, rapport R001-1322285JVN-V01-ygl-NL: https://doemee.oegstgeest.nl/uploads/4bf7ccfa-a9a1-4d3b-ad26-27ba03d63471/event_file/file/50fa9a0a-59ac-4328-a10f-cc1361cdf7ed/Eindrapport_Klinkenbergerplas.pdf

#### 2. Nederlandse ondiepe wateren: IJsselmeer, Tjeukemeer, Zwemlust

Mooij, de Senerpont Domis & Hülsmann (2008) onderzochten Nederlandse ondiepe eutrofe wateren met uiteenlopende omvang en diepte: IJsselmeer, Tjeukemeer en Zwemlust. Zij pasten een lucht-water-temperatuurmodel toe voor ondiepe, windblootgestelde en holomictische (doorgaans volledig gemengde) wateren.

De gerapporteerde residuele standaardafwijking was:
- IJsselmeer: 0,86 °C;
- Tjeukemeer: 0,94 °C;
- Zwemlust: 1,47 °C.

**Wat dit wel aantoont:** een relatief eenvoudige lucht-waterbenadering kan voor bepaalde Nederlandse ondiepe, windblootgestelde en goed gemengde wateren bruikbare resultaten geven.

**Wat dit niet aantoont:** dat zo'n model een verticale thermocline, diepe waterlaag, winterse inverse stratificatie of lokale temperatuur op willekeurige visdiepte kan voorspellen. Het is daarom een relevante ondiepwater-baseline, niet de volledige architectuur voor Vislogboek.

Bron: Mooij, W.M., de Senerpont Domis, L.N. & Hülsmann, S. (2008), *The impact of climate warming on water temperature, timing of hatching and young-of-the-year growth of fish in shallow lakes in the Netherlands*, Journal of Sea Research 60(1–2), 32–43, DOI: 10.1016/j.seares.2008.03.002. https://www.sciencedirect.com/science/article/abs/pii/S1385110108000166

#### 3. Internationale profieldata: 153 meren

Pilla et al. (2021) publiceerden een open dataset met zomerse verticale temperatuurprofielen uit 153 meren in 26 landen. De bestanden bevatten ruwe en geïnterpoleerde profielen plus metadata over locatie, morfometrie en waterkwaliteit.

**Geschiktheid:**
- nuttig om vorm en diepte van zomerprofielen, thermoclines en diepe temperaturen te toetsen;
- nuttig voor een onafhankelijke structurele vergelijking van een verticale modelkern;
- niet geschikt als enige validatiebron, omdat het om zomerse profielen gaat en de dataset geen Nederlandse winter-/ijsvalidatie vervangt.

Datarepository: Environmental Data Initiative, dataset 705: https://portal.edirepository.org/nis/mapbrowse?scope=edi&identifier=705  
Publicatie: Pilla et al. (2021), *Global data set of long-term summertime vertical temperature profiles in 153 lakes*, Scientific Data 8, 200, DOI: 10.1038/s41597-021-00983-y. https://www.nature.com/articles/s41597-021-00983-y

#### 4. Europese meerprofielen en lichtuitdoving

De European Multi Lake Survey-dataset beschrijft metingen van temperatuurprofielen en Secchi-diepte/doorzicht in Europese meren. De studie beschrijft hoe profielen met CTD-/profilingapparatuur of metingen op intervallen van 0,5 m zijn verzameld; bij ondiepe meren zonder thermocline werd tot nabij de bodem gemeten.

Deze dataset kan aanvullend helpen om de relatie tussen temperatuurprofiel en waterhelderheid/lichtpenetratie te onderzoeken. De precieze dekking, ruwe data, seizoensmomenten en hergebruikvoorwaarden moeten worden gecontroleerd voordat deze als validatieset wordt geselecteerd.

Bron: *A European Multi Lake Survey dataset of environmental variables, phytoplankton pigments and cyanotoxins* (Scientific Data, 2018): https://www.nature.com/articles/sdata2018226

#### 5. Voorgestelde rol per dataset

| Dataset/casus | Waterregime | Beschikbaarheid in geraadpleegde bron | Voorgestelde rol |
|---|---|---|---|
| Klinkenbergerplas | Diep, stilstaand, Nederlandse zoetwaterplas | Rapport met seizoensprofielen; ruwe meetdata niet gepubliceerd | Nederlandse kwalitatieve referentie; ruwe data bij Rijnland opvragen |
| IJsselmeer/Tjeukemeer/Zwemlust-studie | Ondiep, windblootgesteld, holomictisch | Peer-reviewed modelresultaten en gerapporteerde foutmaten | Baseline voor goed gemengd ondiep water |
| 153 meren dataset | Diverse meren, zomerse profielen | Open ruwe en geïnterpoleerde profielbestanden | Externe zomerprofielvalidatie |
| European Multi Lake Survey | Europese meren, profielen plus doorzicht | Open datasetpublicatie; inhoud/ruwe data nader verifiëren | Aanvullende profiel- en lichtpenetratieanalyse |

#### 6. Gevolg voor het validatieprotocol

Het validatieprotocol kan nu concreter worden opgebouwd in drie niveaus:

1. **Niveau 1 — proces- en profielvorm:** gebruik de open 153-meren dataset en Europese profieldata om te testen of de verticale kern realistische zomerse profielvormen kan representeren. Dit bewijst nog geen nauwkeurigheid voor Nederlandse stekken.
2. **Niveau 2 — Nederlandse watertypen:** gebruik de ondiepe Nederlandse modelstudie als baseline en Klinkenbergerplas als diepe gestratificeerde casus. Voor Klinkenbergerplas zijn ruwe data nodig voor een echte kwantitatieve toets.
3. **Niveau 3 — onafhankelijke lokale Vislogboek-validatie:** verzamel eigen metingen op bekende dieptes en tijdstippen. Deze data mogen niet tegelijk worden gebruikt om te kalibreren en om de nauwkeurigheid te claimen; houd een onafhankelijke validatieset apart.

Voor winterstratificatie, dooi, ijsvorming en het dichtheidsmaximum rond 4 °C is nog een afzonderlijke meet-/referentiebron nodig. De genoemde zomerdatasets kunnen deze tests niet afdekken.

#### 7. Uitkomst en eerstvolgende actie

**Uitkomst:** er zijn voldoende aanknopingspunten om een eerste profielgerichte validatie op te zetten zonder direct nieuwe sensoren te kopen. De internationale zomerdataset biedt open profielen; de Nederlandse Klinkenbergerplas biedt een relevante diepe-plas-referentie maar de ruwe data zijn niet openbaar in het rapport; de Nederlandse ondiepe merenstudie biedt een bruikbare baseline voor goed gemengd water.

**Volgende actie:** bepaal de precieze data-toegang en reproduceerbaarheid:
- controleer de download-/licentie-/metadata-informatie van de 153-meren dataset;
- controleer de bestanden en variabelen van de European Multi Lake Survey;
- identificeer de juiste contactroute bij Hoogheemraadschap Rijnland voor de Klinkenbergerplas-profielen en eventuele gebruiksvoorwaarden;
- zoek een Nederlandse winterprofiel-/ijsreferentie om de 4 °C- en faseovergangstests niet uitsluitend theoretisch te baseren.

**Besluitpoort blijft gesloten:** geen productiecode, database, UI, formules, parameters, nieuwe databronnen of scoreberekening wijzigen. Alleen onderzoeks- en documentatiewerk is uitgevoerd. De scoreberekeningsaudit blijft uitgesteld.


### Aanvullende validatiebevinding — Rijkswaterstaat/Deltares meetreeksen en wintertoets (24 november 2026)

**Aanleiding:** vervolg op de zoektocht naar Nederlandse winterprofielen en praktijkvalidatie. Er is een relevante Deltares-verificatierapportage gevonden met watertemperatuurmetingen en modelvergelijkingen op Nederlandse wateren.

#### 1. Deltares/LSM3-verificatie 2022

Het rapport *KPP 2022 - verificatie van LSM3 voor temperatuur* (Loos & Boderie, Deltares, 6 december 2022) beschrijft een verificatie van de watertemperatuurmodule in het Landelijk SOBEK Model (LSM3) over kalenderjaar 2018.

Belangrijke bevindingen:
- Er zijn zes validatielocaties gebruikt: IJsselmeer (Vrouwezand), Lekkanaal (Nieuwegein), Amsterdam-Rijnkanaal (Maarssen), Lek (Kinderdijk), Bergse Maas (Keizersveer) en Maas (Belfeld).
- Voor IJsselmeer (Vrouwezand) waren de metingen minder frequent: maandelijks in de winter en tweewekelijks in de zomer. Voor de overige locaties waren grotendeels continue metingen beschikbaar.
- De meetdiepte van de continue sensoren was volgens het rapport onbekend. Deze gegevens zijn dus niet zonder meer geschikt voor validatie van temperatuur op een exact bekende diepte.
- Het model volgde de jaarlijkse amplitude en timing over het algemeen goed, maar er waren duidelijke locatiespecifieke afwijkingen: winteronderschatting van circa 0,5–3,5 °C op twee Maaslocaties en zomeroverschatting tot circa 2,5 °C op ARK.
- De studie gebruikte meerdere KNMI-stations voor ruimtelijke meteorologische forcing en Waterinfo/Rijkswaterstaat-metingen voor water- en randtemperaturen.
- Het rapport documenteert ook dat gemeten watertemperatuurreeksen uitbijters en sensorproblemen kunnen bevatten; een Lobith-reeks werd na een periode waarin de sensor kennelijk lucht registreerde uitgesloten.

**Gevolg voor Vislogboek:** Nederlandse RWS/Deltares-data zijn een waardevolle externe referentie voor seizoensverloop en voor hydrologisch beïnvloede wateren. De gerapporteerde afwijkingen tonen tegelijk dat één landelijk model niet op elke locatie even goed presteert. Meetdiepte, sensorstatus, locatie-invloeden en kwaliteitscontrole moeten dus onderdeel zijn van iedere validatieset.

Bron: Loos, S. & Boderie, P. (2022), *KPP 2022 - verificatie van LSM3 voor temperatuur*, Deltares rapport 11208053-010-ZWS-0005, 6 december 2022: https://publicwiki.deltares.nl/download/attachments/119051127/11208053-010-ZWS-0005_v0.1-KPP%202022%20-%20verificatie%20van%20LSM3%20voor%20temperatuur%20-%20ter%20publicatie.pdf

#### 2. Wat dit toevoegt aan de wintervalidatie

De gevonden Nederlandse bronnen vullen elkaar aan, maar geen enkele bron dekt op zichzelf alle benodigde fysica:

- **KNMI-ijsgroeimodel:** primaire Nederlandse referentie voor stilstaand zoet buitenwater, oppervlaktemassa-/warmtebalans en ijsdikte. KNMI vermeldt circa 1 °C watertemperatuurnauwkeurigheid voor de beschreven toepassing en circa 10% voor ijsdikte; die claims zijn niet automatisch overdraagbaar naar alle Vislogboek-wateren.
- **Deltares LSM3:** praktijkverificatie met Nederlandse meetreeksen, ook in het winterhalfjaar, maar vooral voor grotere/netwerk- en stromingswateren en niet met overal bekende meetdiepte.
- **Klinkenbergerplas:** meerjarige seizoensprofielen van een diepe, nagenoeg stilstaande plas; bruikbaar voor verticale seizoensstructuur, maar ruwe data zijn niet opgenomen in het geraadpleegde rapport.
- **Open internationale profieldata:** nuttig voor zomerse verticale profielen; onvoldoende voor winterse inversie/ijsvalidatie.

Er is in deze zoekstap nog geen open Nederlandse ruwe winterdataset gevonden met gelijktijdige verticale temperatuurprofielen, bekende dieptes, tijdstippen en ijswaarnemingen in een stilstaande zoetwaterplas. Dit blijft een expliciete validatieleemte.

#### 3. Praktische data-toegangsroute

Voor RWS-data bestaat een officiële ontsluiting via Waterinfo en de Waterwebservices. Rijkswaterstaat beschrijft dat historische meetgegevens opgevraagd kunnen worden en dat onder meer watertemperatuur, stroming, afvoer en zoutgehalte beschikbaar zijn, afhankelijk van locatie en meetprogramma.

Voor de volgende onderzoeksstap moeten we per kandidaatlocatie eerst de meetcatalogus controleren op:
- meetgrootheid en compartiment;
- station/locatie en coördinaten;
- meetdiepte of sensorhoogte;
- meetfrequentie en tijdzone;
- kwaliteitsstatus en eventuele uitbijters;
- periode waarin de sensor daadwerkelijk in het water hing;
- beschikbaarheid van debiet/stroming en zoutgehalte waar relevant.

Bronnen:
- Rijkswaterstaat, Waterdata: https://www.rijkswaterstaat.nl/water/waterdata
- Waterinfo Extra, Waterinfo monitoring en downloadmogelijkheden: https://waterinfo-extra.rws.nl/data-sites/waterinfo/
- Deltares, *KPP 2022 - verificatie van LSM3 voor temperatuur* (hierboven).

#### 4. Aangescherpte validatiematrix

| Doel | Voorkeursreferentie | Wat kan hiermee worden getoetst? | Wat blijft onbewezen? |
|---|---|---|---|
| Oppervlakte-/bulk seizoensverloop stilstaand zoet water | KNMI-modelreferentie + lokale watertemperatuur | Opwarming/afkoeling, respons op weer, ijsvorming waar waarnemingen beschikbaar zijn | Volledig verticaal profiel zonder dieptemetingen |
| Diepe zomerstratificatie | Klinkenbergerplas ruwe profielen (indien verkregen) + open 153-meren dataset | Thermocline, bovenlaag, diepe laag | Nederlandse winterinversie als ruwe winterprofielen ontbreken |
| Ondiep goed gemengd water | Mooij et al. 2008 / geschikte lokale meetreeksen | Lucht-waterkoppeling en bulktemperatuur | Gedetailleerde verticale structuur |
| Stromende wateren | Deltares LSM3/RWS meetreeksen | Effect van meteorologische forcing, stroming en randtemperaturen | Vissteklokale temperatuur zonder passende hydrodynamische representatie |
| Winterstratificatie en ijs | KNMI ijsmodel + toekomstige lokale diepteprofielen/ijsmetingen | Faseovergang, ijsdikte, winterse warmtebalans | Multilaags inverse profiel als alleen ijsdikte/bulktemperatuur bekend is |

#### 5. Uitkomst en volgende actie

**Uitkomst:** we hebben nu een geloofwaardige externe Nederlandse validatieroute voor drie regimes: ondiep goed gemengd (Mooij et al.), diep gestratificeerd (Klinkenbergerplas) en hydrologisch/stromend (Deltares/RWS). De belangrijkste ontbrekende validatie blijft een open, tijdgestempelde winterreeks met meerdere bekende meetdieptes in stilstaand zoet water.

**Volgende actie:** inventariseer de RWS Waterinfo-catalogus op geschikte meetlocaties en meetdieptes en bepaal of er een stilstaand-waterreferentie met winterprofielen bestaat. Tegelijk moet voor Klinkenbergerplas de contact-/data-aanvraag bij Hoogheemraadschap Rijnland worden voorbereid, maar nog niet verzonden. Een aanvraag of externe benadering wordt pas gedaan na expliciete toestemming van de eigenaar.

**Besluitpoort blijft gesloten:** geen externe aanvraag, API-aansluiting, productiecode, database, UI, formule, parameter, scoreberekening of deployment uitvoeren zonder expliciete goedkeuring. De scoreberekeningsaudit blijft uitgesteld.


### Aanvullend dataonderzoek — RWS-meetpalen en Europese profieldata (24 november 2026)

**Doel:** de eerder gevonden RWS-meetreeksen verder beoordelen op verticale resolutie, winterdekking en daadwerkelijke toegankelijkheid. Dit is documentatieonderzoek; er zijn geen RWS-API-requests, downloads, externe aanvragen of modelberekeningen uitgevoerd.

#### 1. Sterke kandidaat voor verticale tijdreeksen: meetpaal Marker Wadden

De RWS/KIMA-datarapportage *Overzicht van meetdata op en rondom de Marker Wadden* (Daggenvoorde & Vermeulen, HKV, mei 2021) beschrijft een vaste meetpaal die op 25 april 2019 is geplaatst. Deze heeft twee YSI-multiparametersondes met watertemperatuur, geleidbaarheid en waterdiepte, op vaste hoogtes -1,2 m NAP en -3,4 m NAP. Dezelfde meetpaal meet onder meer waterstand, windrichting/-snelheid en luchtdruk; een ADCP levert stromingsrichting en -snelheid. De continue YSI-, waterstands- en meteorologische gegevens zijn door RWS verwerkt en opgeslagen in DONAR. De rapportage zegt dat aanvullende maandelijkse LICOR- en ADCP-data via de RWS-Servicedesk opvraagbaar zijn.

**Waarom dit belangrijk is:** twee gelijktijdige temperatuurhoogtes kunnen verticale temperatuurverschillen en hun tijdsontwikkeling laten zien. In combinatie met waterstand kunnen de vaste NAP-hoogtes worden omgerekend naar diepte onder het actuele wateroppervlak. Geleidbaarheid, stroming, wind en waterstand helpen bovendien om te beoordelen of een periode representatief is voor een stilstaand zoetwatermodel.

**Beperkingen:** Marker Wadden/Markermeer is geen geïsoleerde kleine visvijver. De locatie kan windgedreven menging, stroming en ruimtelijke/hydrodynamische invloeden hebben. Twee meetniveaus leveren geen volledig verticaal profiel en kunnen een thermocline niet altijd voldoende lokaliseren. De rapportage bewijst dat de meetopstelling en dataregistratie bestaan, maar niet dat de volledige ruwe tijdreeks nu zonder aanvraag publiek downloadbaar is. De meetdieptes ten opzichte van het wateroppervlak variëren bovendien met de waterstand.

Bron: Daggenvoorde, R. & Vermeulen, C.-J. (2021), *Datarapportage KIMA — Overzicht van meetdata op en rondom de Marker Wadden*, PR4443.10, §2.1.1, pp. 3–4: https://waterinfo-extra.rws.nl/publish/pages/187929/pr4443-10_eindrapport_datarapportage_kima.pdf

#### 2. RWS Waterdata: catalogusroute en belangrijke technische voorwaarden

De actuele RWS-documentatie beschrijft de WaterWebservices als een catalogusgestuurde route:
1. vraag de meetcatalogus op via MetadataService;
2. koppel Aquo-metadata, locaties en de koppeltabel via MessageID;
3. selecteer locatie, compartiment en grootheid;
4. controleer of waarnemingen voor de gewenste periode bestaan;
5. haal de tijdreeks op via OnlineWaarnemingenService.

Voor onderzoek moeten de kwaliteitswaardecodes behouden blijven en zelf worden beoordeeld; RWS adviseert niet vooraf uitsluitend de publieksfilter toe te passen. De documentatie noemt maxima per request en maakt duidelijk dat de exacte combinatie van locatie, meetgrootheid en metadata eerst uit de catalogus moet blijken.

**Belangrijke beperking van dit onderzoek:** de catalogus is een POST-webservice. In deze stap is de documentatie gecontroleerd, maar is de catalogus zelf niet opgevraagd. We hebben dus nog geen concrete RWS-locatie, meetreeks, sensorperiode of meetdiepte uit de actuele catalogus geverifieerd. De oudere Waterinfo-Extra-pagina beschrijft daarnaast verschillende historische downloadlimieten; voor een nieuwe dataworkflow moet de actuele WaterWebservices/WADAR-documentatie leidend zijn.

Bronnen:
- Rijkswaterstaat, *Waterdata — WaterWebservices*: https://rijkswaterstaatdata.nl/waterdata/
- Rijkswaterstaat, *Over waterdata*: https://rijkswaterstaatdata.nl/onze-data/waterdata/
- Waterinfo Extra, *Waterinfo*: https://waterinfo-extra.rws.nl/data-sites/waterinfo/

#### 3. RWS-CTD-profielen: technisch verticaal, maar ander waterregime

RWS beschrijft CTD-metingen (conductivity, temperature, depth) met verticale temperatuur- en geleidbaarheidsprofielen. De gepubliceerde meetstrategie betreft onder meer kust-/mariene transecten bij Terschelling, Rottumerplaat, Noordwijk, Walcheren en Goeree, en is niet op een vaste kalenderfrequentie gepland. Dit is bruikbaar als aanvullende kennis over verticale meetmethoden en stratificatie, maar niet als primaire validatieset voor stilstaand zoet binnenwater: de locaties zijn kust-/zoutwater en de bemonstering is varend/campagnegebonden.

Bron: RWS Waterinfo Extra, *CTD metingen*: https://waterinfo-extra.rws.nl/monitoring/chemie/oppervlakte-water/ctd-metingen/

#### 4. European Multi Lake Survey: wat de profieldata precies vertegenwoordigen

De publicatie beschrijft temperatuurprofielen die zijn gemeten met CTD-/profilingapparatuur of, waar die niet beschikbaar was, met handmetingen op intervallen van 0,5 m. In stratified lakes werd doorgaans gemeten tot de onderkant van de thermocline; in meren zonder thermocline, meestal ondiepe meren, tot circa 0,5 m boven de bodem. De dataset bevat onder meer sampling date, sampling depth, thermocline depth en een oppervlaktewatertemperatuur op 0,5 m.

**Beperking:** de profielopzet ondersteunt analyse van zomerstratificatie en ondiep gemengde meren, maar is geen doorlopende uurlijkse temperatuurreeks en levert op zichzelf geen Nederlandse winter-/ijsvalidatie. De exacte downloadbestanden en licentie moeten nog worden gecontroleerd voordat deze dataset in het offline validatieprotocol wordt opgenomen.

Bron: *A European Multi Lake Survey dataset of environmental variables, phytoplankton pigments and cyanotoxins* (Scientific Data, 2018): https://www.nature.com/articles/sdata2018226

#### 5. Aangescherpte kandidaatselectie

| Kandidaat | Verticaal detail | Tijddekking | Waterregime | Voorlopige rol |
|---|---|---|---|---|
| Marker Wadden meetpaal | Twee vaste NAP-hoogtes; waterstand nodig voor diepteconversie | Continue data vanaf plaatsing in 2019; actuele ruwe beschikbaarheid nog te verifiëren | Groot, wind-/stromingsgevoelig Markermeergebied | Sterke kandidaat voor verticale tijdsdynamiek, niet rechtstreeks representatief voor geïsoleerde vijvers |
| Markermeer Midden | Eén YSI-sonde volgens rapportage | Meetpaal bestond al vóór 2000; reeks en frequentie nog te verifiëren | Groot meer | Langere bulk-/oppervlaktereferentie, geen profielvalidatie |
| RWS CTD-transecten | Verticale profielen | Campagne-/vaarmomenten, geen vaste periode | Kust-/zoutwater | Alleen aanvullende fysische vergelijking |
| European Multi Lake Survey | Profielen tot thermocline of nabij bodem | Momentopnamen/surveydata | Diverse Europese meren | Profielvorm, thermocline en ondiep gemengd water |
| Klinkenbergerplas | Historische meerlaagse seizoensprofielen volgens rapport | 1985–2021 gerapporteerd; ruwe data nog op te vragen | Diepe, nagenoeg stilstaande zoetwaterplas | Beste inhoudelijke Nederlandse casus voor diepe stratificatie, mits ruwe data beschikbaar komen |

#### 6. Uitkomst en eerstvolgende actie

**Uitkomst:** er is nu een concretere Nederlandse bron voor gelijktijdige metingen op meerdere hoogtes: de Marker Wadden-meetpaal. De data lijken potentieel zeer waardevol voor het testen van verticale temperatuurverandering door de tijd, maar de locatie is hydrodynamisch niet gelijk aan een stilstaande visvijver en twee sensorniveaus zijn geen volledig profiel. De actuele RWS-catalogus is nog niet bevraagd; concrete beschikbaarheid en kwaliteitsstatus zijn dus niet bevestigd.

**Volgende actie:**
- bereid een gerichte, read-only cataloguscontrole voor van watertemperatuur (oppervlaktewater) bij Marker Wadden en Markermeer Midden, inclusief locatiecodes, meetmetadata, kwaliteitscodes, tijdsdekking en sensorhoogte;
- controleer of de continue meetpaaldata via WaterWebservices publiek opvraagbaar zijn of dat de RWS-Servicedesk nodig is;
- controleer de feitelijke downloadbestanden en licentie van de European Multi Lake Survey en EDI 705;
- houd Klinkenbergerplas-ruwe data als afzonderlijke data-aanvraag in voorbereiding; nog niet verzenden.

**Besluitpoort blijft gesloten:** geen API-integratie, data-import, modelberekening, productiecode, database, UI, formule, parameter, scoreberekening of deployment. Externe aanvragen blijven wachten op expliciete toestemming. De scoreberekeningsaudit blijft uitgesteld.


### Aanvulling dataherkomst en licentie — European Multi Lake Survey (24 november 2026)

De publicatie- en repositorymetadata van de European Multi Lake Survey zijn verder gecontroleerd. De EMLS-dataset betreft een gestandaardiseerde Europese meerinventarisatie uit de zomer van 2015, waaraan onderzoekers uit 27 landen deelnamen. De KNAW-repository vermeldt de dataset als afzonderlijk datasetrecord en geeft expliciet **CC0** als licentie voor de gekoppelde publicatie-/datasetregistratie. De publicatie beschrijft de verticale temperatuurprofielen en meetmethoden: CTD/profiling of, waar nodig, handmetingen op 0,5 m intervallen; ondiepe meren zonder thermocline zijn tot nabij de bodem bemeten.

**Gevolg:** EMLS is een haalbare kandidaat voor een reproduceerbare profielvorm-/thermocline-test, met bronvermelding volgens wetenschappelijke conventie. Het blijft een survey uit één zomer (2015), geen uurlijkse tijdreeks en geen wintervalidatie. De feitelijke downloadbestanden moeten bij de voorbereiding van het offline protocol nog worden gecontroleerd op volledigheid en kolomdefinities.

Bronnen:
- Mantzouki et al. (2018), *A European Multi Lake Survey dataset...*, Scientific Data 5, 180226: https://www.nature.com/articles/sdata2018226
- KNAW Pure datasetrecord, *The European Multi Lake Survey (EMLS) dataset ... 2015* (vermeldt CC0): https://pure.knaw.nl/portal/nl/datasets/the-european-multi-lake-survey-emls-dataset-of-physical-chemical-/
- KNAW publicatierecord en datasetkoppeling: https://pure.knaw.nl/portal/en/publications/a-european-multi-lake-survey-dataset-of-environmental-variables-p/datasets/

**EDI 705-status:** de publicatie bevestigt dat de Pilla et al. (2021)-bestanden (SiteInformation.csv, TempProfiles_Raw.csv, TempProfiles_Interpolated.csv) via EDI dataset 705 worden verspreid. De repositorypagina kon in deze controle niet worden geopend (HTTP 403); de specifieke licentie en de actuele downloadbaarheid zijn daarom nog niet bevestigd. Niet aannemen dat CC0 geldt zonder de datasetmetadata zelf te controleren.

Aanvullende bron: Pilla et al. (2021), *Global data set of long-term summertime vertical temperature profiles in 153 lakes*: https://www.nature.com/articles/s41597-021-00983-y

**Vervolg:** EMLS wordt voorlopig hoger geprioriteerd dan EDI 705 voor de eerste reproduceerbare profielvorm-test, omdat de datasetkoppeling en CC0-vermelding nu via KNAW zijn vastgesteld. EDI 705 blijft kandidaat totdat de repositorymetadata/licentie rechtstreeks zijn geverifieerd. Dit verandert niets aan de scope of besluitpoort van het model.


### Besluit onderzoeksfase — voldoende wetenschappelijke basis; door naar modelontwerp (24 november 2026)

**Besluit en werkwijze:** de brede literatuurverkenning voor het watertemperatuurmodel wordt hiermee afgesloten. Er is voldoende wetenschappelijke basis om een concreet ontwerp voor de eerste verbeterde modelversie uit te werken. Verder breed zoeken naar nog meer modellen of algemene literatuur heeft op dit moment minder waarde dan het vertalen van de bestaande kennis naar één samenhangend, toetsbaar ontwerp. Vervolgonderzoek wordt beperkt tot gerichte verificatie van gegevens die voor implementatie of validatie echt nodig blijken.

#### 1. Wetenschappelijke basis die we als voldoende beschouwen

1. **Oppervlaktewarmtebalans — KNMI/De Bruin & Wessels.** Watertemperatuur verandert door netto warmte-uitwisseling aan het oppervlak: inkomende kortgolvige zonnestraling, uitgaande langgolvige straling, voelbare warmte-uitwisseling met de lucht en verdampings-/latente warmteflux. Luchttemperatuur alleen is onvoldoende. Wind, luchtvochtigheid/dauwpunt en bewolking beïnvloeden de warmte-uitwisseling. Neerslag en sneeuw kunnen relevant zijn.
2. **Verticale warmteverdeling — GLM als architectuurreferentie.** Een meer of vijver kan niet altijd met één watertemperatuur worden beschreven. Een verticale 1D-toestand met een gemengde bovenlaag, thermocline en diepere laag kan zomerstratificatie en de vertraagde reactie van dieper water representeren. GLM is een wetenschappelijke architectuurreferentie; Vislogboek hoeft niet het volledige GLM-model te kopiëren.
3. **Zoetwaterdichtheid — winter én zomer.** In de zomer kan opwarming een lichtere bovenlaag boven koeler dieper water vormen. In de winter is de dichtheidsanomalie rond 4 °C essentieel: zoet water heeft rond 4 °C zijn grootste dichtheid; water kouder dan 4 °C kan boven warmer water blijven. Beide regimes en hun overgangen moeten uit dezelfde verticale fysica volgen.
4. **Menging en overgang.** Windgedreven turbulentie, convectie door oppervlakte-afkoeling en seizoensgebonden warmte-uitwisseling bepalen of lagen gemengd blijven of stratificeren. Lente- en herfstomslag mogen niet simpelweg op vaste kalenderdatums worden gezet.
5. **Bevriezing en faseovergang.** Vloeibaar zoet water mag niet als normale vloeistof onder 0 °C worden gerapporteerd. Bij ijsvorming moet energie naar de faseovergang; ijs en sneeuw beïnvloeden vervolgens de isolatie en verdere warmte-uitwisseling. Het KNMI-ijsgroeimodel is hiervoor een relevante Nederlandse referentie.
6. **Traagheid en diepte.** Dieper water heeft meer warmtecapaciteit en reageert doorgaans trager. De bestaande discrete tijdconstanten zijn een grove benadering; het nieuwe ontwerp moet warmteopslag en laagdiepte fysisch consistenter behandelen.
7. **Beginconditie en historische forcing.** Zonder lokale watertemperatuur is een actuele luchttemperatuurreeks van enkele dagen geen betrouwbare absolute beginconditie. Historische weersreeksen (KNMI-waarnemingen of ERA5-Land als kandidaat) kunnen spin-up mogelijk maken, maar alleen als verschillende plausibele startprofielen aantoonbaar naar vergelijkbare toestanden convergeren.
8. **Lokale meting en onzekerheid.** Een betrouwbare lokale watertemperatuurmeting op bekende diepte en tijd blijft de sterkste ankerinformatie. Een meting op één diepte bepaalt niet automatisch het hele verticale profiel. Onvoldoende informatie moet resulteren in grotere onzekerheid of de melding dat een betrouwbare absolute schatting niet mogelijk is.

**Belangrijke modelnuance:** het operationele KNMI-ijsgroeimodel is een effectieve referentie voor oppervlaktewarmtebalans en ijs, maar de beschreven operationele variant is een éénlaags/bulkmodel. Voor de verticale structuur gebruiken we GLM-achtige principes. We combineren dus relevante fysica uit beide bronnen; we doen niet alsof het KNMI-model zelf al een volledig verticaal meerlagenmodel is.

#### 2. Voorgestelde samenhangende modelrichting

Werk één bestaande thermische engine door tot één fysisch consistente, verticale 1D-watertoestand voor stilstaand zoet buitenwater:

- **Meteorologische forcing:** uurlijkse invoer op of nabij de steklocatie, met tijdstempel en bronkwaliteit. Relevante variabelen zijn luchttemperatuur, zonnestraling, langgolvige straling of een onderbouwde schatting daarvan, luchtvochtigheid/dauwpunt, wind, bewolking en neerslag; sneeuw waar relevant.
- **Oppervlaktefluxlaag:** netto warmte-uitwisseling aan het wateroppervlak volgens een KNMI/De Bruin-Wessels-geïnspireerde energiebalans. Leg fluxcomponenten afzonderlijk vast zodat de uitkomst controleerbaar is.
- **Verticale waterkolom:** representeer water in fysisch onderbouwde lagen, met laagdiepte, temperatuur, warmtecapaciteit en dichtheid. Laat zonlicht dieper doordringen afhankelijk van waterhelderheid wanneer gegevens dat toelaten; gebruik geen verzonnen helderheidswaarde als zekere meting.
- **Dichtheid en menging:** bepaal dichtheid uit temperatuur voor zoet water met het maximum rond 4 °C. Gebruik dichtheidsstabiliteit, windmenging en convectie om verticale menging en stratificatie te bepalen. Zomerstratificatie en winterse inverse stratificatie zijn uitkomsten van dezelfde fysica.
- **Bodem en randen:** neem bodemwarmte-uitwisseling en instroom/uitstroom alleen mee wanneer benodigde invoer en waterregime dit ondersteunen. Onbekende hydrologische invloeden worden als beperking/onzekerheid behandeld.
- **IJs/faseovergang:** behandel bevriezing, latente warmte en isolerende ijs-/sneeuwlaag expliciet genoeg om fysisch onmogelijke negatieve vloeibare watertemperaturen te voorkomen.
- **Uitvoer:** rapporteer temperatuur op de gevraagde meet-/visdiepte, plus waar mogelijk oppervlakte- en bodemtemperatuur, verticaal profiel, bron/herkomst, onzekerheid en modelstatus. Een bulktemperatuur mag niet stilzwijgend als temperatuur op iedere diepte worden gepresenteerd.

De eerste scope blijft **stilstaand, zoet, buitenwater**. Stromende wateren met onbekende advectie/discharge, brak/zout water zonder saliniteitscorrectie en sterke thermische lozingen vallen buiten de eerste nauwkeurigheidsclaim. Ondiep gemengde en diep gestratificeerde wateren moeten beide in ontwerp en validatie vertegenwoordigd zijn.

#### 3. Beginconditie zonder lokale watertemperatuur

Gebruik geen willekeurige vaste starttemperatuur en presenteer geen schijnnauwkeurige absolute waarde op basis van alleen de laatste 72 uur.

- Lokale meting met diepte en tijd: anker op die laag/diepte; overige lagen blijven onzeker totdat aanvullende gegevens of een onderbouwde reconstructie beschikbaar zijn.
- Lokaal verticaal profiel: initialiseert meerdere lagen rechtstreeks, met meetmethode en ouderdom als kwaliteitsinformatie.
- Geen lokale meting: gebruik historische meteorologische forcing en meerdere plausibele initiële verticale profielen.
- Gebruik experimentele spin-upvensters 30/90/180/365 dagen uitsluitend als gevoeligheidstest, niet vooraf als productieparameter.
- Beoordeel convergentie op voorspelde temperatuur op relevante dieptes en op de profieltoestand; als startprofielen niet voldoende convergeren, presenteer de absolute temperatuur niet als betrouwbaar.

KNMI-stationdata en ERA5-Land blijven kandidaatbronnen; er is nog geen bron geselecteerd of aangesloten. Heranalyse is geen lokale waarneming. De keuze volgt uit een gerichte vergelijking van dekking, variabelen, resolutie, tijdstempels, beschikbaarheid en validatieresultaten.

#### 4. Validatie: voldoende referenties om te beginnen, met één bekende leemte

De huidige referentiebasis is voldoende om het validatieontwerp te maken:
- KNMI/De Bruin-Wessels: Nederlandse oppervlakwarmtebalans en ijsreferentie voor stilstaand zoet water;
- Mooij et al. (2008): Nederlandse ondiepe, windblootgestelde, goed gemengde wateren als bulktemperatuur-baseline;
- Klinkenbergerplas (1985–2021 in rapport): Nederlandse diepe, nagenoeg stilstaande plas als seizoensprofielreferentie; ruwe diepte-/tijdreeksen moeten nog bij Rijnland worden geverifieerd;
- European Multi Lake Survey: zomerse verticale profielvormen en thermocline; momentopnamen, geen winterreeks;
- Pilla et al. (2021), 153 meren: aanvullende zomerse verticale profielvalidatie; repositorylicentie en downloadbestanden nog verifiëren;
- RWS/Deltares LSM3 en Marker Wadden meetpaal: nuttige Nederlandse praktijkreeksen en twee meetniveaus, maar hydrodynamisch niet zonder meer representatief voor stilstaande vijvers; actuele data-toegang en metadata moeten nog worden geverifieerd.

**Expliciete validatieleemte:** er is nog geen bevestigde open Nederlandse tijdreeks gevonden met gelijktijdige winterse verticale temperatuurprofielen op meerdere bekende dieptes in stilstaand zoet water, inclusief ijswaarnemingen. KNMI-fysica kan het ontwerp onderbouwen, maar vervangt deze onafhankelijke profielvalidatie niet. Dit is een gerichte open validatievraag, geen reden om de ontwerpstap uit te stellen.

#### 5. Ontwerp- en implementatievolgorde

De volgende stap is niet verder breed zoeken, maar een concreet technisch ontwerp maken dat aansluit op de bestaande thermische engine en de huidige data-/prognoseketen:

1. Leg het toestandsmodel vast: lagen, temperatuur, warmte-inhoud, dichtheid, menging, ijsstatus en onzekerheid.
2. Leg de benodigde meteorologische fluxen en bronvereisten vast; onderscheid gemeten, heranalyse, voorspeld en afgeleid.
3. Definieer initialisatiepaden met lokale meting/profiel en zonder lokale meting, inclusief convergentiecontrole.
4. Definieer dieptegerichte uitvoer en aansluiting op bestaande prognosecalls, zonder de soortrespons of totaalscore te wijzigen.
5. Maak een offline validatieprotocol met beschikbare datasets en synthetische fysische randgevallen; synthetische tests gelden niet als praktijkvalidatie.
6. Werk daarna een afgebakend implementatievoorstel uit met gewijzigde bestanden, opslagimpact, testmatrix, onzekerheden en terugvalgedrag.

#### 6. Onderzoeksstop en besluitpoort

**Onderzoeksstop:** de brede wetenschappelijke verkenning is voor de eerste ontwerpversie voldoende. Geen nieuwe algemene modelvergelijkingen of literatuurzoektochten tenzij het ontwerp een concrete onbeantwoorde fysische vraag blootlegt.

**Gericht vervolgonderzoek blijft nodig** voor uitsluitend:
- bevestigen van exacte meetreeksen, meetdieptes, kwaliteitscodes en licentie/datarechten;
- bepalen welke historische meteorologische bron technisch en inhoudelijk geschikt is;
- oplossen of expliciet documenteren van de Nederlandse winterprofiel-validatieleemte.

**Nog niet uitgevoerd:** geen modelontwerp tot implementatie vertaald, geen code/types/database/UI/formules/parameters gewijzigd, geen externe databron aangesloten, geen meetbestanden geïmporteerd, geen tests of productiebuild uitgevoerd, geen scoreberekening aangepast en geen deployment uitgevoerd. De scoreberekeningsaudit blijft uitgesteld.

**Besluit:** ga nu door naar de concrete technische ontwerpfase voor het verbeterde watertemperatuurmodel. De implementatiebesluitpoort blijft gesloten totdat het ontwerp en de wijzigingsscope aan de producteigenaar zijn voorgelegd en expliciet zijn goedgekeurd.


---

## Technisch ontwerp watertemperatuurmodel — 24 november 2026

**Status:** read-only ontwerpvoorstel; wacht op beoordeling en expliciete eigenaarstoestemming.  
**Broncodebaseline:** `main` op `df4758ec196c7595ddc47664d451982bf3f7b314`.  
**Scope:** één bestaande thermische engine verbeteren voor stilstaand, zoet, buitenwater. Geen tweede engine en geen wijzigingen aan biologische gewichten of scoreformules in deze ontwerpfase.

### 1. Uitkomst van de actuele code-audit

Actueel gecontroleerd:
- `src/services/waterThermalEngine.ts`
- `src/services/waterTemperatureHistory.ts`
- `src/services/prognosisEngine.ts`
- `src/services/weatherService.ts`
- `src/types/index.ts`
- `test-water-temperature-synthetic-validation.ts`

Bevestigde aansluitpunten en beperkingen:

1. `analyzeWaterThermalDevelopment` is de bestaande thermische ingang. De functie ontvangt stek, sessies, historische metingen, weersamples, optionele `targetTime`, `forecastAsOf` en `measurementDepthM`. Behoud deze publieke ingang waar mogelijk als compatibiliteitslaag.
2. `WaterTemperatureMeasurement` bewaart meetwaarde, fysiek meetmoment, registratiemoment, bron, methode, optionele meetdiepte en eventueel gekoppelde weercontext. `FishingSession` ondersteunt een lijst met meetgebeurtenissen. De historische profielservice selecteert echte metingen en houdt bekende meetdieptes gescheiden.
3. De prognose-aanroep in `calculateDayPrognosis` geeft momenteel geen `measurementDepthM` door aan de thermische engine. De diepteoptie bestaat dus op engine-niveau, maar is niet volledig aangesloten op de actuele prognoseketen.
4. De thermische toestand is nu één scalar. Diepte beïnvloedt vaste responscategorieën/tijdconstanten; er bestaat geen berekende verticale temperatuurkolom.
5. De huidige schatting gebruikt onder meer luchttemperatuurvensters, een beperkte zoncorrectie en windcategorieën. Langgolvige straling en voelbare/latente warmtefluxen worden niet als volledige energiebalans doorgerekend.
6. De huidige code bevat geen dichtheidsanomalie rond 4 °C, geen expliciete convectieve omkering en geen ijs-/latente-warmtefase. Een negatieve modelschatting kan daardoor ontstaan; de bestaande post-hoc lokale kalibratie kan de uitkomst verder verlagen zonder fysische fasecontrole.
7. `forecastAsOf` wordt genormaliseerd en gerapporteerd. De thermische engine begrenst de weersamples zelf niet op basis van het moment waarop de data beschikbaar kwam. De prognose-engine controleert wel een ongeldige/toekomstige ophaaltijd, maar dit is nog geen volledig bronbewust as-of-contract.
8. De huidige weerophaalroute via Open-Meteo bevat drie dagen recente historie en acht dagen verwachting. Dat is onvoldoende voor een betrouwbare absolute beginconditie van een diepe waterkolom.
9. De bestaande synthetische validatie gebruikt een onafhankelijk eerste-orde referentiemodel met een ingestelde tijdconstante. Dat is nuttig voor regressiecontrole, maar geen empirische validatie van echte meren of winter-/zomerstratificatie.
10. De thermische uitkomst voedt in `prognosisEngine.ts` de bestaande soortspecifieke thermische efficiëntie. De biologische curve/formule hoeft niet te veranderen, maar een verbeterde temperatuur kan vanzelfsprekend wel de numerieke fysiologische respons en daarmee de geïntegreerde score veranderen. Dit is een gevolg van een andere invoer, geen wijziging van scoregewichten.

### 2. Voorgestelde architectuur

#### 2.1 Eén bestaande engine, intern opgesplitst in heldere rekenlagen

Behoud `waterThermalEngine.ts` als bestaande publieke ingang en compatibiliteitslaag. Laat deze uiteindelijk één deterministische simulatie aanroepen. Geen concurrerende engine en geen dubbele bron van waarheid.

Voorgestelde interne verantwoordelijkheden:
- meteorologische invoer normaliseren en valideren;
- beginprofiel initialiseren of reconstrueren;
- oppervlaktefluxen berekenen;
- verticale warmteoverdracht en menging berekenen;
- dichtheidsstabiliteit en convectie bepalen;
- ijsvorming/smelting en isolatie verwerken;
- uitvoer op doel- en referentiedieptes afleiden;
- onzekerheid, bronherkomst en modelstatus samenstellen.

#### 2.2 Meteorologische forcing als bronbewust contract

Elke uurlijkse sample moet ten minste bevatten:
- UTC-tijdstip van de meteorologische waarneming/verwachting;
- bron en bron-/modelversie indien beschikbaar;
- ophaal-/publicatietijd en moment waarop de sample beschikbaar kwam;
- luchttemperatuur;
- windsnelheid en -richting of windvector, met bekende meet-/modelhoogte;
- relatieve luchtvochtigheid en/of dauwpunt;
- inkomende kortgolvige zonnestraling;
- inkomende langgolvige straling, of expliciet gemarkeerd als afgeleid;
- bewolking;
- neerslag en, waar beschikbaar, sneeuw.

Eenheden worden vóór de fysische berekening genormaliseerd. Geaccumuleerde stralingsenergie mag niet als momentane W/m² worden behandeld. Ontbrekende variabelen blijven ontbrekend; geen stilzwijgende nulwaarden of verzonnen gemiddelden. Afgeleide langgolvige straling krijgt een eigen herkomst en onzekerheidsbijdrage.

Het as-of-contract moet twee tijden onderscheiden:
- `targetTime`: het fysieke moment waarvoor de watertoestand wordt berekend;
- `forecastAsOf`/data-available-at: het moment waarop de gebruikte weerinformatie daadwerkelijk beschikbaar was.

Voor iedere prognoserun geldt dat geen sample of meetwaarde mag worden gebruikt die na de relevante beschikbaarheidsgrens bekend werd. Historische reanalyse mag worden gebruikt voor retrospectieve fysische validatie, maar niet worden voorgesteld als informatie die bij een historische operationele prognose al beschikbaar was.

#### 2.3 Verticale waterkolom — finite-volume benadering

Gebruik een 1D verticale kolom van wateroppervlak tot bodem, verdeeld in rekenvolumes. Per volume worden ten minste bijgehouden:
- boven- en onderdiepte en laagdikte;
- vloeibare watertemperatuur;
- warmte-inhoud/thermische capaciteit;
- temperatuurafhankelijke dichtheid;
- eventuele ijs-/fasefractie waar fysisch relevant.

Een fijnere resolutie nabij het oppervlak kan nodig zijn om snelle oppervlaktedynamiek te representeren; diepere lagen kunnen dikker zijn. Het aantal en de dikte van de cellen worden niet vooraf als willekeurig productgetal vastgezet. Kies de resolutie via grid-convergentietests: verdere verfijning mag de relevante dieptetemperaturen niet betekenisvol veranderen ten opzichte van de afgesproken numerieke tolerantie.

De uitvoer op een willekeurige gevraagde diepte volgt uit interpolatie tussen aangrenzende cellen, niet uit het selecteren van een willekeurige laag.

#### 2.4 Oppervlakte-energiebalans

Gebruik een expliciete netto-oppervlaktewarmteflux met afzonderlijke componenten:
- geabsorbeerde kortgolvige zonnestraling;
- inkomende en uitgaande langgolvige straling;
- voelbare warmte-uitwisseling tussen lucht en water;
- latente warmteflux door verdamping/condensatie;
- neerslag-/sneeuwbijdrage wanneer temperatuur en fase voldoende bekend zijn.

De fluxcomponenten moeten apart worden gelogd voor controle en validatie. De zonnestraling kan met een diepte-afhankelijke extinctie over de waterkolom worden verdeeld. Omdat waterhelderheid nu niet als betrouwbare invoer aanwezig is, moet die parameter als onzeker worden behandeld; geen vaste helderheid presenteren als lokale meting.

Wanneer langgolvige straling niet direct beschikbaar is, mag een gedocumenteerde schatting worden gebruikt met een grotere onzekerheidsbijdrage. Het model mag die ontbrekende component niet als nul behandelen.

#### 2.5 Dichtheid, zomer- en winterstratificatie

Gebruik een gevalideerde temperatuur-dichtheidsrelatie voor zoet water binnen het relevante temperatuurbereik, met maximale dichtheid rond 4 °C.

Dezelfde fysica moet beide stabiele regimes kunnen produceren:
- zomer: relatief warm, lichter oppervlaktewater boven koeler, dichter dieper water;
- winter: water kouder dan circa 4 °C kan boven water rond 4 °C blijven.

Convectieve menging wordt bepaald uit een fysisch instabiel dichtheidsprofiel en moet interne warmte behouden. Windmenging wordt gekoppeld aan windstress en de stabiliteit van de waterkolom; een sterkere stabiele stratificatie moet meer mengenergie vragen dan een gemengde kolom. Een simpele vaste kalenderregel voor omslag is niet toegestaan.

De precieze turbulentie-/mengparameterisatie is een modelparameter en moet met profieldata en gevoeligheidsanalyse worden onderbouwd. Wind alleen bepaalt de mengdiepte niet: waterdiepte, stratificatie en ontbrekende fetch-/oevergeometrie blijven relevante onzekerheden.

#### 2.6 Bodem, stroming en waterregime

De eerste nauwkeurigheidsclaim blijft beperkt tot stilstaand of nagenoeg stilstaand zoet buitenwater. Onbekende instroom, uitstroom en advectie mogen niet worden genegeerd en tegelijk als nauwkeurig gemodelleerd worden gepresenteerd.

Bodemwarmte-uitwisseling is relevant, vooral in ondiep water. Neem deze pas als gekwantificeerde flux op wanneer bodem-/sedimentinformatie of een gevalideerde begrensde parameterisatie beschikbaar is. Anders wordt de grensvoorwaarde expliciet vastgelegd en als onzekerheidsbron gerapporteerd.

Kanaal, rivier, haven en andere duidelijk stromende wateren vallen buiten de eerste nauwkeurigheidsclaim. Bij onduidelijk waterregime wordt de modelstatus onzeker/buiten scope; een waterType-label alleen bewijst niet dat een plas volledig stilstaand is.

#### 2.7 IJs en faseovergang

Behandel het water als een faseovergangsprobleem:
- vloeibaar zoet water wordt niet als gewone vloeistof onder het vriespunt gerapporteerd;
- bij het bereiken van de vriesconditie gaat verdere energieonttrekking naar latente warmte/ijsaanwas;
- ijsdikte en eventuele sneeuwlaag isoleren de vloeibare waterkolom;
- bij dooi wordt latente warmte voor smelten verwerkt.

Een simpele numerieke clamp op -0,1 °C is niet voldoende: het model moet onderscheid maken tussen vloeibaar water, ijsdek en eventuele gemengde overgangstoestand. Als de beschikbare gegevens geen betrouwbare ijsstatus ondersteunen, moet de uitvoer dat expliciet melden.

#### 2.8 Beginconditie en spin-up

Gebruik geen willekeurige vaste starttemperatuur als absolute waarheid.

Initialisatievolgorde:
1. Lokaal verticaal profiel met tijd, diepte, methode en bron: initialiseer de overeenkomstige lagen.
2. Eén lokale meting op bekende diepte: anker die diepte; overige lagen blijven onzeker.
3. Eén lokale meting zonder diepte: niet stilzwijgend aan een willekeurige laag koppelen. Behandel dit als een diepte-ambigu observatie met beperkte profielinformatie.
4. Geen lokale meting: voer historische weersforcing door meerdere plausibele startprofielen.

De eerder vastgelegde 30/90/180/365 dagen blijven experimentvensters, geen productieparameter. Test ook langere spin-up als de diepe laag niet convergeert. Convergentie wordt beoordeeld tussen verschillende beginprofielen op de relevante dieptes én op de profielstructuur. Als de uitkomsten niet voldoende convergeren, blijft de absolute temperatuur onbetrouwbaar en wordt dat in de status zichtbaar.

#### 2.9 Uitvoercontract en aansluiting

Behoud de bestaande `WaterThermalAnalysis`-velden waar mogelijk voor compatibiliteit, maar breid het conceptuele contract uit met:
- temperatuurprofiel per diepte-interval;
- oppervlakte-, bodem- en volumegewogen bulktemperatuur;
- doel-/meetdiepte waarop de gerapporteerde scalar betrekking heeft;
- vloeibaar/ijsstatus;
- onzekerheidsbijdragen (forcing, beginprofiel, meng-/optische parameters, meetkwaliteit);
- modelstatus (bijvoorbeeld gemeten, convergent geschat, niet geconvergeerd, onvoldoende invoer of buiten scope);
- volledige bron- en tijdstempelherkomst.

**Voorgestelde betekenis voor de bestaande scalar:** als expliciete doel-/visdiepte beschikbaar is, rapporteert de doeltemperatuur die diepte. Als die ontbreekt, is een volumegewogen bulktemperatuur de aanbevolen compatibele scalar; deze mag niet als oppervlaktetemperatuur of temperatuur op een onbekende visdiepte worden benoemd. Oppervlakte- en bodemtemperatuur blijven afzonderlijke profielvelden. Dit is een ontwerpkeuze ter goedkeuring, geen reeds geïmplementeerde wijziging.

De huidige prognoseketen moet de beschikbare meetdiepte expliciet doorgeven. Het bestaande meetevent-/historiepad blijft leidend; geen dubbele meetopslag. Of een volledig profiel ook in iedere onveranderlijke prognosesnapshot wordt opgeslagen, moet vóór implementatie worden afgewogen tegen opslagomvang en reproduceerbaarheid. De bestaande snapshot bewaart al weersinvoer en scalar temperatuurvalidatievelden.

#### 2.10 Kalibratie en biologische scoregrens

De bestaande lokale temperatuurkalibratie is een post-hoc correctie op de scalar. Deze moet opnieuw worden beoordeeld tegen de fysieke toestand: een biascorrectie mag geen vloeibaar water onder het vriespunt of een onmogelijke fase opleveren. Voorkeur is kalibratie te valideren als correctie op modelbias/fluxen of als begrensde observatiecorrectie mét fysische fasecontrole; niet blind een temperatuurwaarde aftrekken.

De bestaande soortcurves, fysiologische responsformule, voedingsrespons, 50/50-combinatie en geïntegreerde scoregewichten blijven ongewijzigd. Let op: als de nieuwe temperatuur als invoer van de bestaande thermische respons wordt gebruikt, kan de numerieke score wel veranderen doordat de temperatuurinvoer beter/anders is. Een volledige bevriezing van score-uitkomsten zou betekenen dat de nieuwe temperatuur eerst alleen als afzonderlijke modeluitvoer wordt getoond en nog niet in de bestaande respons wordt ingevoerd. Dit onderscheid moet vóór implementatie expliciet worden goedgekeurd.

### 3. Databronbesluit — voorkeursrichting, nog niet aangesloten

| Bron | Beoordeling | Voorgestelde rol |
|---|---|---|
| KNMI uurlijkse stationswaarnemingen | Echte lokale/regiometingen met luchttemperatuur, dauwpunt, vochtigheid, wind, bewolking, neerslag en globale straling. Dataset vermeldt CC BY 4.0. API-toegang vereist een API-key en is bestand-/tijdstipgericht. Stationafstand en variabeledekking moeten per stek worden gecontroleerd. | Onafhankelijke Nederlandse waarnemingsreferentie; eventueel forcing als nabijgelegen station voldoende representatief is. |
| ERA5-Land | Uurlijkse reanalyse vanaf 1950 op 0,1° raster. Bevat 2m-temperatuur, dauwpunt, windcomponenten, neerslag en neerwaartse korte- en langgolvige straling. Ongeveer vijf dagen vertraging; straling is geaccumuleerd en vereist correcte de-accumulatie. Geen lokale meting. | Voorkeurskandidaat voor lange historische spin-up, na controle tegen KNMI-waarnemingen. |
| Bestaande Open-Meteo-route | Al geïntegreerd en locatiegericht; huidige forecastaanvraag heeft drie dagen recente historie en acht dagen vooruit. De huidige types bevatten kortgolvige straling, dauwpunt, vochtigheid, wind en bewolking, maar geen expliciete langgolvige straling. | Voorlopig behouden voor korte actuele/toekomstige forcing; niet als enige bron voor de absolute beginconditie. |

Bronnen:
- KNMI uurlijkse automatische stationswaarnemingen en variabelen: https://dataplatform.knmi.nl/dataset/docs/hourly-in-situ-meteorological-observations-1-0
- KNMI dataset en CC BY 4.0: https://dataplatform.knmi.nl/dataset/hourly-in-situ-meteorological-observations-1-0
- KNMI Open Data API en API-keyvereiste: https://developer.dataplatform.knmi.nl/open-data-api
- ERA5-Land product guide, uurlijkse resolutie, 0,1° raster, historische dekking en vertraging: https://confluence.ecmwf.int/pages/viewpage.action?pageId=576394633
- ERA5-Land variabelen en stralingsconversie: https://developers.google.com/earth-engine/datasets/catalog/ECMWF_ERA5_LAND_HOURLY

**Voorkeursrichting:** ERA5-Land voor historische spin-up, KNMI voor onafhankelijke validatie en waar mogelijk lokale waarnemingsforcing, Open-Meteo voor de bestaande korte prognosehorizon. Dit is een architectuuradvies, geen definitieve integratiekeuze. Er is nog geen API-key aangevraagd, account aangemaakt, data opgevraagd of geïmporteerd. Voor implementatie moet ook de recente periode worden gecontroleerd op een mogelijke overgangskloof tussen de ERA5-Land-vertraging en de korte Open-Meteo-historie.

### 4. Validatieprotocol

#### 4.1 Fysische invarianten — eerst synthetisch

| Testgroep | Vereiste uitkomst |
|---|---|
| Energiebalans | Verandering van totale warmte-inhoud sluit aan op geïntegreerde grensfluxen; interne menging creëert of vernietigt geen warmte. |
| Dichtheidsanomalie | Zoetwaterdichtheid heeft een maximum rond 4 °C; stabiliteit wordt correct beoordeeld aan beide kanten daarvan. |
| Zomerstratificatie | Opwarming kan een lichtere warme bovenlaag boven koeler dieper water vormen en behouden. |
| Winterinversie | Water kouder dan 4 °C kan stabiel boven dieper, warmer water blijven. |
| Convectie | Afkoeling richting 4 °C kan dichter oppervlaktewater laten zinken; verdere afkoeling onder 4 °C mag niet met dezelfde dichtheidsrichting worden behandeld. |
| Windmenging | Meer mengenergie verzwakt een bestaande gradiënt; de totale warmte blijft behouden. |
| Overgang/seizoensomslag | Lente-/herfstomslag volgt uit forcing en stabiliteit, niet uit vaste kalenderregels. |
| IJs | Geen negatieve vloeibare watertemperatuur; latente warmte en isolatie beïnvloeden ijsaanwas en dooi. |
| Diepte-uitvoer | Interpolatie op bekende meetdieptes is reproduceerbaar; dieptes buiten de waterkolom worden afgewezen of als onbekend gemarkeerd. |
| Beginconditie | Verschillende plausibele startprofielen convergeren waar voldoende spin-up beschikbaar is; anders wordt de schatting als niet-convergent/onbetrouwbaar gemarkeerd. |
| As-of | Een sample, meting of reanalysebestand dat niet beschikbaar was op het prognosemoment verandert de historische operationele prognose niet. |

Numerieke toleranties voor energiebalans en gridconvergentie worden bepaald uit de gekozen solver/tijdstap en verfijningsproeven, niet willekeurig ingevuld.

#### 4.2 Empirische validatie — gescheiden naar watertype

- **Ondiep gemengd:** Mooij et al. (2008) en geschikte lokale meetreeksen voor bulktemperatuur en lucht-waterrespons.
- **Zomerprofiel/thermocline:** European Multi Lake Survey (EMLS) als eerste reproduceerbare profielvorm-test; EDI 705 als aanvullende kandidaat na licentie-/downloadcontrole.
- **Diepe Nederlandse plas:** Klinkenbergerplas-rapport als inhoudelijke referentie; ruwe tijd-/dieptebestanden zijn nog niet verkregen en vereisen een aparte toestemming voor aanvraag.
- **Verticale tijdsdynamiek:** RWS Marker Wadden-meetpaal met twee meetniveaus als aanvullende stress-/mengingsreferentie; niet zonder meer representatief voor stilstaande vijvers.
- **Stromend water:** Deltares/RWS uitsluitend als buiten-scope stresstest; niet gebruiken om nauwkeurigheid voor stilstaande vijvers te claimen.

**Bekende leemte:** nog geen bevestigde open Nederlandse wintertijdreeks met meerdere gelijktijdige dieptes in stilstaand zoet water plus ijswaarnemingen. Winterinversie en ijs krijgen daarom eerst sterke fysische/synthetische invarianttests; empirische wintervalidatie blijft expliciet open.

#### 4.3 Maatstaven en rapportage

Rapporteer minimaal:
- MAE, RMSE en gemiddelde bias in °C;
- fout per diepte, seizoen, diepteklasse en gemengd/gestratificeerd regime;
- fout op dezelfde meetdiepte als de referentiemeting;
- dekking van de voorspelde onzekerheidsintervallen;
- vergelijking met de huidige engine als baseline op exact dezelfde meetmomenten;
- resultaten op meren/perioden die niet zijn gebruikt voor parameterkeuze of kalibratie.

Synthetische tests bewijzen fysische randgevallen en softwaregedrag, geen praktijknauwkeurigheid. Geen algemene nauwkeurigheidsgarantie afleiden uit één dataset of één waterlichaam. Acceptatiedrempels worden pas vastgesteld nadat de beschikbare datasets, dieptes, kwaliteitscodes en steekproefomvang zijn geverifieerd.

### 5. Afgebakende implementatievolgorde na goedkeuring

1. Leg de invoer-/uitvoercontracten en modelstatussen definitief vast.
2. Bouw de pure verticale solver en afzonderlijke fysische componenten binnen de bestaande thermische engine.
3. Voeg fysische unit-/invarianttests toe voordat de prognoseketen wordt aangepast.
4. Voeg de historische forcing-/spin-upadapter toe na definitieve bron- en toegangsgoedkeuring.
5. Sluit lokale meetevents en meetdiepte aan; behoud bestaande historie en provenance.
6. Sluit de nieuwe uitvoer aan op dag- en tijdvakprognoses met expliciete as-of-grenzen.
7. Herbeoordeel lokale kalibratie en de betekenis van de bestaande scalar.
8. Voer volledige regressies, typecheck, Quality Gate en productiebuild uit; inspecteer de volledige diff en documenteer beperkingen.
9. Vergelijk met empirische meetreeksen; markeer praktijkvalidatie apart van synthetische teststatus.

### 6. Open besluiten vóór implementatie

1. **Scalar zonder doel-/visdiepte:** akkoord op volumegewogen bulktemperatuur als bestaande compatibele scalar, met afzonderlijke oppervlakte-/bodemtemperatuur en profiel? Voorkeursadvies: ja.
2. **Scorekoppeling:** mag de nieuwe temperatuur direct de bestaande soortspecifieke thermische respons voeden (formule/gewichten ongewijzigd, numerieke score kan veranderen), of moet de nieuwe temperatuur eerst los van de score zichtbaar worden? Voorkeursadvies: eerst fysische temperatuuruitvoer valideren; daarna gecontroleerd aansluiten.
3. **Waterregime:** welke bestaande watertypes mogen onder de eerste stilstaand-zoetwaterclaim vallen? Bij twijfel moet de status onzeker/buiten scope blijven; geen stromingsaanname op basis van alleen een naam.
4. **Databronnen:** akkoord op ERA5-Land als spin-upkandidaat, KNMI als onafhankelijke waarnemingsreferentie en Open-Meteo voor de prognosehorizon? Externe aansluiting blijft apart goedkeuringsplichtig.
5. **Kalibratie:** bestaande post-hoc seizoenscorrectie pas opnieuw activeren nadat fysische fasebegrenzing en dieptevergelijking aantoonbaar zijn getest.

### 7. Uitgevoerde werkzaamheden en grenzen

- De actuele codeketen, bestaande types, weerinvoer, meetgeschiedenis en relevante synthetische test zijn read-only geïnspecteerd.
- De databronnen zijn op documentatie-/metadata-niveau vergeleken; er zijn geen datasets gedownload of API's bevraagd.
- Het technische ontwerp, de validatiematrix en open besluiten zijn in dit centrale plan vastgelegd.
- Geen runtimecode, tests, formules, gewichten, parameters, database, UI of gebruikersdata gewijzigd.
- Geen tests of productiebuild uitgevoerd voor een modelwijziging; er is immers geen modelcode gewijzigd.
- Geen externe aanvraag, API-integratie, account, secret of deployment uitgevoerd.

**Huidige status:** ontwerpvoorstel gereed voor eigenaarreview. Implementatiebesluitpoort blijft gesloten. De scoreberekeningsaudit blijft uitgesteld.


---

## Eigenaaradvies en gekozen ontwerpuitgangspunten — 24 november 2026

De eigenaar heeft verduidelijkt dat dit product een **voorspellende vis-app** is. Een lokale meting is welkom en moet zwaar meewegen, maar het ontbreken ervan mag niet verhinderen dat de app een best mogelijke voorspelling geeft. Absolute exactheid is geen realistische eis; wetenschappelijke plausibiliteit, consistente trends, dieptebewustzijn, transparante onzekerheid en geen fysisch onmogelijke uitkomsten zijn de doelen.

Op basis daarvan worden de eerdere open ontwerpvragen als volgt ingevuld. Dit zijn de aanbevolen ontwerpbesluiten voor de volgende implementatiefase; dit document wijzigt op zichzelf nog geen runtimegedrag.

### Besluit 1 — Altijd een best-effort voorspelling

**Gekozen richting:** de engine levert voor iedere geldige stek en doeltijd een best-effort watertemperatuurvoorspelling, ook zonder lokale watertemperatuurmeting.

- Geen lokale meting betekent niet "onbekend" als eindresultaat. Het betekent een modelgestarte voorspelling met een bredere onzekerheidsmarge.
- Een meting verankert het model op de gemeten tijd en gemeten diepte. Zij wordt niet automatisch behandeld als actuele temperatuur op alle dieptes.
- Oudere geldige metingen blijven bruikbaar als historische ankers, waarbij het model de ontwikkeling vanaf het meetmoment doorrekent.
- Als beginprofiel, diepte of forcing zwak bekend is, blijft de beste puntschatting beschikbaar, maar krijgt zij een lagere betrouwbaarheidsstatus en ruimere onzekerheid.
- Alleen wanneer essentiële invoer ontbreekt of ongeldig is, mag de engine terugvallen op een expliciet gemarkeerde noodschatting. Ook dan geen schijnzekerheid.

**Waarom:** de primaire functie is voorspellen voor een vissessie. Een model dat bij ontbrekende lokale metingen niets voorspelt, voldoet niet aan dat doel. Een onzekerheidslabel is beter dan een lege uitkomst of een verzonnen zekerheid.

### Besluit 2 — Stekd iepte is de totale waterdiepte voor het verticale model

De bestaande `FishingLocation.waterDepth` is de diepte in meters en is de primaire bron voor de totale waterdiepte van de stek. De actuele thermische engine leest dit veld al. Gebruik deze waarde dus als geometrische bovengrens van de verticale waterkolom wanneer zij geldig is.

- Gebruik niet de historische sessiediepte of een meetdiepte als vervanging voor de totale stekd iepte.
- Een lokale watertemperatuurmeting met `measurementDepthM` beschrijft de temperatuur op die meetdiepte; dat is een andere grootheid dan de totale waterdiepte.
- Als de stekd iepte ontbreekt, blijft een voorspelling verplicht. Leid dan een expliciete diepteprior af uit het bekende watertype en eventueel andere beschikbare stekkenkenmerken, met ruime onzekerheid. Verzin geen exacte diepte en bewaar de gebruikte prior als modelaanname.
- Als er onvoldoende kenmerken zijn om zelfs een redelijke diepteprior te kiezen, gebruik een generieke ondiepe-waterkolom als noodscenario met zeer lage betrouwbaarheid en maak duidelijk dat de diepte onbekend was.
- Bij een opgegeven diepte die buiten plausibele grenzen valt of niet positief is, negeer de waarde als onbetrouwbare geometrie en val terug op dezelfde prior/noodroute.

### Besluit 3 — Verticale profielsimulatie blijft de gekozen fysische kern

Behoud de voorgestelde 1D verticale waterkolom. De engine rekent het temperatuurprofiel van oppervlak tot bodem door, met:
- oppervlakte-energiebalans;
- zonlichtpenetratie en onzekerheid door onbekende waterhelderheid;
- temperatuurafhankelijke zoetwaterdichtheid met maximum rond 4 °C;
- zomerstratificatie én winterse inverse stratificatie;
- windgedreven menging en convectie;
- faseovergang en isolatie door ijs/sneeuw;
- dieptebewuste beginconditie en historische spin-up.

Gebruik adaptieve of via convergentietests gekozen laagindeling. Leg geen willekeurig vast aantal lagen, vaste seizoensomslagdata of ongetoetste mengcoëfficiënten vast.

### Besluit 4 — Temperatuuruitvoer voor de vis-app

- De engine levert altijd een temperatuur voor de gevraagde doeltijd.
- Als een expliciete doel-/visdiepte bestaat, gebruik de voorspelde temperatuur op die diepte.
- Als geen visdiepte bekend is, gebruik de volumegewogen gemiddelde temperatuur van de waterkolom als compatibele centrale watertemperatuur voor de bestaande soortrespons. Dit is een pragmatische proxy, geen claim dat vissen zich op die gemiddelde diepte bevinden.
- Lever daarnaast oppervlakte-, bodem- en verticaal profiel waar de kwaliteit van de berekening dat toelaat.
- De bestaande UI hoeft niet direct het hele profiel te tonen; de interne uitvoer moet wel dieptebewust en controleerbaar zijn.
- Houd de meetdiepte, totale waterdiepte en eventuele visdiepte als drie afzonderlijke begrippen.

### Besluit 5 — Bestaande scorekoppeling behouden, zonder scoreformules te veranderen

**Gekozen richting:** na het halen van de fysische en regressie-validatie mag de nieuwe voorspelde centrale/gevraagde temperatuur de bestaande soortspecifieke thermische respons voeden. De bestaande soortcurves, gewichten en scoreformules blijven ongewijzigd.

De numerieke score kan daardoor veranderen omdat de temperatuuringang beter wordt. Dat is een verwacht gevolg en geen wijziging van de scoreberekening zelf. Tijdens ontwikkeling worden de oude en nieuwe temperatuuruitkomsten naast elkaar gevalideerd; activeer de nieuwe temperatuur pas voor de score nadat de afgesproken gates slagen. Geen aparte tweede score-engine.

### Besluit 6 — Watertype en buiten-scope situaties

De eerste nauwkeurigheidsclaim blijft voor stilstaand of nagenoeg stilstaand zoet buitenwater. Voor kanalen, rivieren, havens of stekken met onbekende sterke stroming:
- probeer nog steeds een best-effort voorspelling te leveren;
- gebruik beschikbare watertypekenmerken als context;
- verhoog onzekerheid en geef een beperking/status mee;
- presenteer de uitkomst niet als even goed gevalideerd als voor stilstaand water.

Brak/zout water zonder saliniteitscorrectie en sterke thermische lozingen blijven buiten de eerste nauwkeurigheidsclaim. Niet stilzwijgend de zoetwaterdichtheid gebruiken alsof saliniteit bekend nul is.

### Besluit 7 — Meteorologische bronnen

Hanteer de eerder geadviseerde taakverdeling als voorkeursarchitectuur:
- ERA5-Land als kandidaat voor historische spin-up;
- KNMI-stations als onafhankelijke Nederlandse waarnemingsreferentie en mogelijke forcing wanneer representatief;
- de bestaande Open-Meteo-route voor actuele en toekomstige forcing.

De overgang tussen vertraagde ERA5-Land-data en recente/verwachte Open-Meteo- of KNMI-data moet expliciet worden geharmoniseerd. Controleer tijdstempels, tijdzone, eenheden, stralingsaccumulatie, bronbeschikbaarheid en eventuele bias. Geen dubbele telling of discontinuïteit bij bronovergang. De databronnen worden pas na aparte implementatiegoedkeuring aangesloten.

### Besluit 8 — Lokale kalibratie wordt ondergeschikt aan de fysica

Gebruik lokale metingen om het model te initialiseren en te evalueren. Een eventuele biascorrectie mag niet achteraf een onmogelijke vloeibare temperatuur of onstabiel profiel veroorzaken. Herontwerp kalibratie bij voorkeur als beperkte parameter-/fluxcorrectie of als observatie-nudging op de juiste meetdiepte en meettijd, met behoud van energie- en fasegrenzen. De huidige post-hoc scalarcorrectie wordt niet zonder herontwerp overgenomen.

### Definitieve ontwerpprioriteiten

1. Voorspel altijd best-effort; lokale meting is een anker, geen vereiste.
2. Gebruik `FishingLocation.waterDepth` als totale stekd iepte wanneer bekend.
3. Gebruik een verticale 1D-fysische kolom met zomer- en winterstratificatie.
4. Maak voorspelling, doel-/meetdiepte, onzekerheid en herkomst expliciet.
5. Houd bestaande biologische respons en scoreformules intact; sluit de nieuwe temperatuur pas aan na validatie.
6. Gebruik de genoemde meteorologische bronrollen, maar sluit nog niets aan zonder implementatiebesluit.
7. Scoreberekenings-/driveraudit blijft uitgesteld.

**Huidige status:** inhoudelijke ontwerpkeuzes zijn op basis van de aanwijzing van de eigenaar ingevuld. De eerstvolgende stap is het vertalen van dit gekozen ontwerp naar een gefaseerd technisch implementatieplan en acceptatiecriteria. Runtime-implementatie blijft gescheiden van deze ontwerpbesluiten en wordt pas gestart na expliciete opdracht.

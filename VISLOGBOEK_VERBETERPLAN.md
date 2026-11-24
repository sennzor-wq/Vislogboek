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

**Dit is het enige actieve hervattingspunt voor de huidige Fase-2-werkstroom.** Oudere "volgende stap"-vermeldingen in historische secties blijven bewaard als auditspoor, maar zijn geen parallelle opdrachten wanneer ze afwijken van deze actuele status.

### Afgerond

- De interval-outputcontracten en VisCoach-koppeling zijn uitgevoerd en in de eerdere secties van dit plan geregistreerd.
- De operationele geïntegreerde soortscore v1 is geïmplementeerd via PR [#223](https://github.com/sennzor-wq/Vislogboek/pull/223).
- PR #223 is gemerged op 24 november 2026. Mergecommit: `bf108f56cf9c937ae1fb915b310fd8bf4899ab8c`.
- Quality Gate run [45379544577](https://github.com/sennzor-wq/Vislogboek/actions/runs/45379544577) op de exacte PR-head is geslaagd.
- De actuele architectuur en soortspecifieke score-documenten beschrijven de operationele v1. De oude status "PR #223 open/niet gemerged" in eerdere uitvoeringsnotities is achterhaald en wordt door de gedateerde correctie in `FASE2_UITVOERINGSRESULTATEN.md` vervangen.

### Huidige modelgrenzen

- Eén bestaande geïntegreerde score van 1–10 voor de dag en de vier tijdvakken.
- Fysiologische en voedings-/foerageerrespons blijven afzonderlijk berekend en uitlegbaar.
- De 50/50-combinatie en actieve profielwaarden zijn voorlopige operationele startwaarden, geen bewezen biologische verhouding of empirisch gefitte parameters.
- Onbekende drivers worden niet als nul of neutraal ingevuld; de oorspronkelijke driverdekking blijft zichtbaar.
- Lokale aanwezigheid/habitat en persoonlijke empirische vangkans blijven afzonderlijke uitkomsten.
- Prognose berekent; VisCoach vertaalt uitsluitend naar tactiek en advies.

### Eerstvolgende opdracht — read-only audit van scoreberekening en datadekking

Controleer de actuele code op `main` en leg in `FASE2_PROGNOSE_AUDIT.md` vast:

1. De exacte rekenketen van soortprofielen en voedingsrespons tot de bestaande tijdvakscore en dagscore.
2. Hoe de 50/50-combinatie omgaat met ontbrekende fysiologische of voedingsrespons.
3. Hoe de lage bekende voedingsdriverdekking (momenteel 35–45%) doorwerkt in de voedingsrespons én in de geïntegreerde score.
4. Of de zichtbare dekking en onzekerheid voldoende duidelijk gescheiden zijn van de score zelf.
5. Per vissoort waar dezelfde regels gelden en waar profiel-/dataverschillen een andere uitkomst geven.

**Acceptatiecriteria voor deze opdracht:**
- Read-only: geen runtimecode, tests, scoreformule, gewichten, parameters, database of UI aanpassen.
- Alle bevindingen zijn herleidbaar naar actuele code en bestaande tests.
- Onderscheid maken tussen softwarematig correct gedrag, modelmatige beperking en biologische onzekerheid.
- Geen nieuwe factor of weging voorstellen alsof die al is goedgekeurd.
- Lever een korte bevindingenlijst met concrete impact en eventueel een voorkeursadvies.

**Stop-/goedkeuringspoort:** na deze audit stopt het werk. Rapporteer de bevindingen en eventuele wijzigingsvoorstellen aan de eigenaar. Pas scoreformule, gewichten, parameters of UI pas aan na expliciete goedkeuring. Geen andere Fase-2-taak tussendoor starten.

Fase 2 blijft open en Fase 3 geblokkeerd totdat de formele acceptatiecriteria aantoonbaar zijn gehaald.


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

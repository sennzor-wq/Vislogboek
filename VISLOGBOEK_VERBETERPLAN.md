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
3. Bestaande gebruikersgegevens, IDs, relaties en prognosesnapshots worden beschermd. Geen destructieve initialisatie, stille overschrijving of impliciete interpretatie van ontbrekende gegevens.
4. Bestaande engines worden eerst onderzocht en hergebruikt. Een nieuwe engine is alleen toegestaan wanneer een aantoonbaar ontbrekende samenhangende functie dit vereist.
5. Een verbetering is pas afgerond wanneer tests, productiebuild, diff-review en relevante documentatiecontrole slagen. Een groene test bewijst op zichzelf geen biologische nauwkeurigheid.
6. Geen arbitraire biologische gewichten of prestatieclaims. Elke factor, respons, interactie en onzekerheid krijgt een onderbouwing en toetsbare rol.
7. Geen toekomstige informatie in historische voorspellingen of evaluaties (future leakage).
8. Alleen benchmark-/testdata mogen worden verwijderd wanneer zij ongeldig, misleidend of schadelijk voor de productie-ervaring zijn. Echte gebruikerssessies en vangsten worden nooit als opruimactie verwijderd.

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
- Onderzoek ook `HISTORICAL_LOCATIONS`, `HISTORICAL_SESSIONS` en `HISTORICAL_CATCHES` uit `src/data/historicalData.ts`. Het bestand zegt dat deze 5 stekken, 10 sessies en 16 vangsten uit een concrete gebruikersbackup van 26 oktober 2026 zijn geïmporteerd. Behandel deze records als echte gebruikersdata en verwijder ze niet als benchmarkopruiming.
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

**Databesluit:** de producteigenaar staat verwijdering toe van historische benchmark-/testvangsten die niet valide zijn of de werking verstoren. Dit is geen toestemming om echte gebruikersdata te verwijderen.

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
| 0. Baseline en audit | **In uitvoering** | Uitgebreide read-only audit op `main` commit `4831fd6d7a200467c29773c574be7090674eca29`; eerste bevindingen in `FASE0_OPTIMIZATION_AUDIT.md`; matrix, verwijzingsaudit en huidige CI-baseline nog afronden |
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

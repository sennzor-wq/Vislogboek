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
- Onderzoek de historische benchmarksessie en de vier canonieke vangsten, inclusief alle code-, test-, UI-, documentatie- en evaluatieverwijzingen.
- Verwijder ongeldige historische benchmarkvangsten en eventueel de volledige benchmark-sessie wanneer deze geen geldige praktijkdata vertegenwoordigt en veilig kan worden verwijderd.
- Verwijder bijbehorende testdata alleen uit productie-seed; behoud synthetische fixtures in tests waar ze nodig en duidelijk gemarkeerd zijn.
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
| 0. Baseline en audit | Te starten | Eerst actuele `main` en bestaande documentatie reconciliëren |
| 1. Dataveiligheid en benchmarkdata | Gepland | Benchmarkdata mag na afhankelijkhedenaudit worden verwijderd |
| 2. Biologische prognose | Gepland | Hoogste inhoudelijke prioriteit |
| 3. Lerend stekprofiel | Gepland | Bestaande engines en gegevens integreren |
| 4. Praktisch VisCoach-advies | Gepland | Wind-/werprichting en geometrie expliciet toetsen |
| 5. Gesloten leercyclus | Gepland | Praktijkvalidatie vereist |
| 6. Administratie en releasecontrole | Doorlopend | Documentatie bij elke fase bijwerken |

**Huidige status:** het plan is vastgelegd; de implementatiefases zijn nog niet als uitgevoerd aangemerkt. Er is met deze documentatievastlegging geen applicatiecode of gebruikersdatabase gewijzigd.

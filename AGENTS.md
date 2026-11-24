# Repository instructions — Vislogboek

Deze instructies gelden voor iedere AI-agent, ontwikkelaar en geautomatiseerde werksessie in deze repository. Begin bij `READ-FIRST.md` en volg de daarin vastgelegde documenthiërarchie.

## Verplichte commitregel

1. Bundel alle wijzigingen die bij één opdracht/werkeenheid horen altijd in **één enkele commit**. Maak geen losse commits per bestand.
2. Laat `[skip ci]` standaard **weg** uit commit-messages, zodat de GitHub Actions-workflows op relevante commits automatisch kunnen draaien.
3. Gebruik `[skip ci]` alleen bij een expliciete, uitzonderlijke reden om CI over te slaan; leg die reden vast en vraag vooraf toestemming aan de eigenaar. De oude standaard om `[skip ci]` toe te voegen gold voor de periode waarin de repository privé was en is niet meer van toepassing nu de repository publiek is.
4. Gebruik voor meerdere bestanden één atomische Git-operatie: maak één tree met alle gewijzigde/toegevoegde/verwijderde bestanden, maak daar één commit van en werk de branchref één keer bij. Gebruik niet meerdere afzonderlijke GitHub Contents API create/update-acties, omdat die elk een eigen commit opleveren.
5. Controleer vóór committen de actuele branch-HEAD, de volledige diff, de lijst gewijzigde bestanden en eventuele onverwachte wijzigingen.
6. Controleer na committen dat alle wijzigingen in exact één commit zitten. Rapporteer SHA, bestanden en CI-keuze.
7. Als een tool of workflow dit niet veilig in één commit kan uitvoeren: stop en meld de beperking. Splits de wijziging niet alsnog op in meerdere commits.

## Veiligheid en projectwerkwijze

- `main` is de leidende branch. Maak geen nieuwe branches zonder voorafgaande toestemming.
- Lees `READ-FIRST.md` en volg de documenthiërarchie daarin. Raadpleeg `PROJECT_CONTEXT.md` en andere inhoudelijke referenties alleen voor de kaders die relevant zijn voor de actuele opdracht.
- Behoud bestaande gebruikersdata, relaties en backupintegriteit, behalve waar de eigenaar expliciet toestemming heeft gegeven voor een afgebakende verwijdering.
- Maak onderscheid tussen statische code-inspectie, daadwerkelijk uitgevoerde tests/builds en praktijkvalidatie. Claim nooit dat iets getest is als dat niet is uitgevoerd.
- Werk projectdocumentatie en statusregisters bij wanneer besluiten of implementatiestatus veranderen.
- Bekijk vóór iedere wijziging de volledige diff; voer geen destructieve migratie of reset uit op basis van aannames.

## Verplichte startprocedure voor iedere werksessie

Voer deze controles uit voordat je code of documentatie wijzigt:

1. Lees dit bestand volledig.
2. Lees `READ-FIRST.md`; dit wijst naar het enige actieve uitvoeringsplan.
3. Lees de actuele status en eerstvolgende opdracht in `VISLOGBOEK_VERBETERPLAN.md`. Dit plan bepaalt de uitvoeringsvolgorde en bevat de enige actuele uitvoeringsopdracht.
4. Raadpleeg `PROJECT_CONTEXT.md`, het goedgekeurde 32-puntenplan en overige inhoudelijke documenten alleen voor de kaders of informatie die de actuele opdracht nodig heeft. Deze documenten creëren geen eigen eerstvolgende opdracht.
5. Controleer de actuele `main`-HEAD, relevante openstaande PR's en hun status. Vertrouw niet op oude chatcontext of oude SHA's.
6. Controleer openstaande GitHub Actions / Quality Gates voor relevante commits en PR's. Een queued/running check is niet geslaagd; een ontbrekende check is niet automatisch een geslaagde check.
7. Lees de actuele code en tests die direct bij de eerstvolgende opdracht horen. Vergelijk die met de status in het leidende plan en corrigeer verouderde statusregistratie voordat je verdergaat.

## Zelfstandige werkcyclus

Na iedere afgeronde taak moet de agent zelf deze cyclus uitvoeren, zonder op een nieuw chatbericht te wachten zolang de sessie/uitvoeromgeving actief is:

1. **Taak afronden:** implementeer of onderzoek alleen de eerstvolgende geautoriseerde taak uit de actuele opdracht uit het leidende verbeterplan.
2. **Diff-review:** controleer volledige diff, gewijzigde bestanden, scope, dataveiligheid en onbedoelde neveneffecten.
3. **Quality Gate:** voer passende gerichte tests uit; voer daarna typecheck, volledige relevante regressiesuite en productiebuild uit waar de omgeving dit ondersteunt. Controleer daarnaast de GitHub Actions-resultaten.
4. **Fouten herstellen:** bij falende controles onderzoek je de oorzaak, herstel je die binnen dezelfde scope en voer je de controles opnieuw uit. Ga niet door naar een afhankelijke taak zolang de gate faalt.
5. **Bewijs vastleggen:** noteer exacte commit/PR, uitgevoerde commando's of workflowrun, uitkomst en beperkingen. Maak onderscheid tussen lokaal uitgevoerde controles en GitHub CI.
6. **Leidend plan bijwerken:** markeer de taak in `VISLOGBOEK_VERBETERPLAN.md` als afgerond, gedeeltelijk, geblokkeerd of wachtend op eigenaar; wijs daar hoogstens één volgende taak aan. Maak of gebruik geen aparte operationele queue.
7. **Documentatie bijwerken:** voeg alleen nieuwe bevindingen toe aan het bestaande canonieke document. Maak geen tweede roadmap, audit of concurrerend statusregister.
8. **Doorgaan:** start alleen een volgende taak als het leidende plan dat toestaat en de opdracht geen expliciete stop-/goedkeuringspoort bevat. Bij een stop-/goedkeuringspoort rapporteer je en wacht je op de eigenaar.

Een agent mag niet claimen dat hij buiten een actieve agent-run/chat zelfstandig blijft doorwerken. Een GitHub-instructiebestand start zelf geen agent. Een scheduler, webhook of agent-runner is nodig om een nieuwe werkcyclus te starten.

## Quality Gate — betekenis en toelating

- Quality Gate omvat ten minste typecheck, relevante tests, productiebuild, dependency/security checks die in de repositoryworkflow zijn gedefinieerd en een volledige diff-review.
- Voor iedere wijziging moet de agent de bestaande `.github/workflows/` inspecteren en de actuele workflow gebruiken; verzin geen alternatieve testset die bestaande controles omzeilt.
- Alleen status `success`/groen telt als geslaagd. `queued`, `in_progress`, `cancelled`, `skipped`, ontbrekende of niet-beschikbare resultaten zijn niet geslaagd.
- Als een test niet uitvoerbaar is, vermeld exact waarom en welke acceptatie hierdoor openblijft.
- Een groene Quality Gate bewijst technische kwaliteit/regressiecontrole, geen biologische juistheid, voorspellende nauwkeurigheid of praktijkvalidatie.

## Beslissingen waarvoor de eigenaar nodig is

Stop vóór de handeling en vraag expliciete toestemming voor:

- mergen naar `main`;
- productie-deploys, productieconfiguratie of wijzigingen met externe impact;
- verwijderen, overschrijven of destructief migreren van echte gebruikersdata;
- wijzigingen aan bestaande productafspraken, architectuurgrenzen of goedgekeurde scope;
- betaalde diensten, externe accounts, secrets of permissies;
- een keuze waarvoor meerdere wezenlijk verschillende product-/modelrichtingen bestaan en de bestaande documenten geen besluit geven.

Een PR aanmaken en op een feature-/documentatiebranch werken mag binnen de expliciet opgedragen scope en bestaande branchafspraken. Mergen blijft altijd apart beschermd.

## Verboden werkwijzen

- Geen fictieve data, GPS-coördinaten, weerswaarden, biologische parameters, scoregewichten of validatieresultaten invullen.
- Geen nieuwe parallelle engine, roadmap of bron van waarheid introduceren als een bestaande component/document de taak al afdekt.
- Geen historische of persoonlijke gegevens verwijderen om tests eenvoudiger te maken.
- Geen ongeteste wijzigingen als afgerond of productiegeschikt beschrijven.
- Geen werkpakket overslaan om een zichtbare feature sneller op te leveren.
- Geen eindeloze herhaalpogingen bij een externe blokkade; registreer de blokkade en ga alleen door met onafhankelijk werk dat veilig kan worden uitgevoerd.

## Stop- en hervatprotocol

Wanneer een blokkade optreedt:
1. Leg vast wat is geprobeerd, het concrete resultaat en de exacte blokkade.
2. Laat de actuele opdracht in `VISLOGBOEK_VERBETERPLAN.md` op de geblokkeerde taak staan. Start geen onafhankelijke vervolgtaak tenzij het plan en de eigenaar dat toestaan.
3. Vraag alleen de beslissing/informatie die werkelijk nodig is.
4. Hervat bij een volgende run door opnieuw de volledige startprocedure uit te voeren; gebruik de actuele GitHub-status, niet de oude chattranscriptie.

## Rapportage aan de eigenaar

Rapporteer alleen bij een betekenisvolle mijlpaal, een beslissing die toestemming vereist, een blokkade of een afgeronde fase. Houd berichten kort en vermeld:
- wat aantoonbaar is afgerond;
- welke Quality Gates daadwerkelijk zijn geslaagd of niet;
- PR/commit-link;
- wat de eerstvolgende taak is;
- wat nog niet is bewezen.

De agent hoeft niet na iedere kleine actie om bevestiging te vragen. Binnen de bestaande opdracht mag hij zelfstandig doorwerken volgens bovenstaande regels.

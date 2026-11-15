# Repository instructions — Vislogboek

Deze instructies gelden voor iedere AI-agent, ontwikkelaar en geautomatiseerde werksessie in deze repository. Lees ook `PROJECT_CONTEXT.md` en de actuele relevante code voordat je wijzigingen voorstelt of uitvoert.

## Verplichte commitregel

1. Bundel alle wijzigingen die bij één opdracht/werkeenheid horen altijd in **één enkele commit**. Maak geen losse commits per bestand.
2. Voeg standaard **`[skip ci]`** toe aan de commit-message.
3. Laat `[skip ci]` alleen weg als de gebruiker expliciet vraagt om de GitHub Action(s) te laten draaien.
4. Gebruik voor meerdere bestanden één atomische Git-operatie: maak één tree met alle gewijzigde/toegevoegde/verwijderde bestanden, maak daar één commit van en werk de branchref één keer bij. Gebruik niet meerdere afzonderlijke GitHub Contents API create/update-acties, omdat die elk een eigen commit opleveren.
5. Controleer vóór committen de actuele branch-HEAD, de volledige diff, de lijst gewijzigde bestanden en eventuele onverwachte wijzigingen.
6. Controleer na committen dat alle wijzigingen in exact één commit zitten. Rapporteer SHA, bestanden en CI-keuze.
7. Als een tool of workflow dit niet veilig in één commit kan uitvoeren: stop en meld de beperking. Splits de wijziging niet alsnog op in meerdere commits.

## Veiligheid en projectwerkwijze

- `main` is de leidende branch. Maak geen nieuwe branches zonder voorafgaande toestemming.
- Lees `PROJECT_CONTEXT.md`, het relevante plan/de roadmap en actuele code voordat je implementeert.
- Behoud bestaande gebruikersdata, relaties en backupintegriteit, behalve waar de eigenaar expliciet toestemming heeft gegeven voor een afgebakende verwijdering.
- Maak onderscheid tussen statische code-inspectie, daadwerkelijk uitgevoerde tests/builds en praktijkvalidatie. Claim nooit dat iets getest is als dat niet is uitgevoerd.
- Werk projectdocumentatie en statusregisters bij wanneer besluiten of implementatiestatus veranderen.
- Bekijk vóór iedere wijziging de volledige diff; voer geen destructieve migratie of reset uit op basis van aannames.

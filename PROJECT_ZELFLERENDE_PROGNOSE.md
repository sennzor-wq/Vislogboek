# Zelflerende prognose, foutdiagnose en VisCoach-feedbacklus

**Projectstatus:** gestart als zelfstandig projectspoor; eerstvolgende stap is een read-only technische audit.  
**Issue:** [#50](https://github.com/sennzor-wq/Vislogboek/issues/50)  
**Hoofdoptimalisatietraject:** [#49](https://github.com/sennzor-wq/Vislogboek/issues/49)  
**Repository:** sennzor-wq/Vislogboek  
**Leidende branch:** main

## 1. Visie en doel

Vislogboek ontwikkelt zich tot een systeem dat niet alleen een prognose maakt, maar elke voorspelling controleert, begrijpt waarom die goed of fout was, mogelijke datavervuiling opspoort en op basis van voldoende betrouwbaar bewijs zijn volgende prognose én VisCoach-tactiek verbetert.

De centrale leerkring:

`Prognose → vissessie → evaluatie → foutdiagnose → datakwaliteitscontrole → gevalideerde verbetering → nieuwe prognose en tactiek → herhaling`

Dit project is zelfstandig te volgen en te plannen. Het hergebruikt bestaande engines en de uitkomsten van het bredere optimalisatieproject. Er komt geen tweede, concurrerende prognose- of evaluatie-engine.

## 2. Wat moet het systeem leren?

### 2.1 Prognosekwaliteit
- Was de voorspelde kans goed gekalibreerd?
- Is het model structureel te optimistisch of te voorzichtig?
- Verschilt dit per doelsoort, stek, seizoen, tijdvak of sessieduur?
- Is de prestatie beter dan een eenvoudige historische baseline?
- Hoeveel onafhankelijke, bruikbare sessies ondersteunen de conclusie?

### 2.2 Waarom een voorspelling afweek
Elke geëvalueerde prognose moet waar mogelijk een begrijpelijke verklaring krijgen. Een afwijking kan voortkomen uit:
1. **Modelbias:** de modelrelatie of parameters zijn structureel onjuist.
2. **Datakwaliteitsprobleem:** invoer is fout, ontbreekt, is verouderd of verkeerd gemeten.
3. **Koppelingsprobleem:** verkeerde sessie, snapshot, stek, doelsoort of tijdvenster gekoppeld.
4. **Scope-mismatch:** sessies zijn onvoldoende vergelijkbaar (duur, methode, seizoen, water of locatie).
5. **Selectiebias:** alleen bepaalde soorten sessies worden geregistreerd of geëvalueerd.
6. **Steekproefonzekerheid:** te weinig onafhankelijke sessies voor een stevige conclusie.
7. **Toeval / natuurlijke variatie:** een valide kansvoorspelling kan incidenteel niet uitkomen.

De app mag een oorzaak niet als feit presenteren wanneer de data alleen een hypothese ondersteunt. Gebruik statussen zoals vastgesteld, waarschijnlijk, mogelijk en onbekend.

## 3. Brier-score: rol en grenzen

Voor een binaire uitkomst is de individuele Brier-bijdrage:

`(p - o)^2`

waarbij `p` de voorspelde kans is (0–1) en `o` de waargenomen uitkomst (0 of 1). De gemiddelde Brier-score is lager bij betere probabilistische voorspellingen. De Brier Skill Score vergelijkt de score met een passende referentie-/baselinescore.

**Cruciale regel:** Brier is een evaluatiemaatstaf, geen directe correctiefactor. Een hoge score mag niet rechtstreeks worden vertaald naar bijvoorbeeld “trek 15 procentpunten van de volgende prognose af”. Eerst moet de app vaststellen of de fout door het model, de invoer, de koppeling of toeval komt.

Brier-score moet samen worden bekeken met onder andere:
- kalibratie/reliability per kansgroep;
- Brier Skill Score ten opzichte van een vooraf gedefinieerde baseline;
- aantallen en onafhankelijkheid van sessies;
- onzekerheidsintervallen;
- waar passend discriminatie en aanvullende probabilistische scores.

Een goede gemiddelde Brier-score kan subgroepen verbergen. Daarom moeten scope en steekproefomvang altijd zichtbaar zijn.

## 4. Datakwaliteit en vervuilingsdetectie

De diagnostische laag controleert ten minste:

### Prognose en snapshot
- Prognose is aantoonbaar vóór de sessiestart gemaakt.
- Snapshot is niet dubbel of onterecht hergebruikt.
- Exacte tijdstempel, tijdzone, tijdvak en doelvenster kloppen.
- De gebruikte model-, engine- en invoerversies zijn herleidbaar.
- Oorspronkelijke prognose en inputfingerprint zijn intact.

### Sessie en uitkomst
- De juiste sessie is aan de juiste snapshot gekoppeld.
- Doelsoort van prognose, sessie en vangstregistratie komt overeen.
- Vangst, bevestigde nulvangst en onbekende uitkomst zijn onderscheiden.
- Vangstaantallen, groepsvangsten en soortzekerheid zijn plausibel en correct geïnterpreteerd.
- Sessiestart, eindtijd, duur, actieve hengeluren en onderbrekingen zijn consistent.
- Dubbele sessies, vangsten of records worden gesignaleerd.

### Context en meetbronnen
- Stek-ID, GPS, waterdiepte en locatiecontext zijn bruikbaar.
- Weers- en watertemperatuurbron, meettijd en schattingsstatus zijn bekend.
- Ontbrekende waarden worden niet als echte nul of neutrale meting geïnterpreteerd.
- Handmatige correcties, imports en legacy-records zijn herkenbaar.
- Techniek, aas/voer en overige tactische invoer zijn niet als bevestigd feit behandeld wanneer ze alleen defaults waren.

### Besluit over records
Elk record krijgt een reproduceerbare kwaliteitsstatus en eventuele uitsluitreden. De ruwe gegevens blijven behouden. De diagnostiek verwijdert of herschrijft nooit stilzwijgend gebruikersdata.

## 5. Architectuur en gegevensstroom

1. **Prognose-snapshot:** onveranderlijke opslag van kans, tijd, scope, weer, water, invoerhistorie, datakwaliteit en engineversies.
2. **Uitkomstkoppeling:** sessie-uitkomst wordt gekoppeld aan maximaal de juiste voorafgaande prognose; ambiguïteit leidt tot uitsluiting of handmatige beoordeling.
3. **Evaluatielaag:** reproduceerbare Brier/Brier Skill Score en aanvullende geschikte metrics.
4. **Diagnoselaag:** analyseert de individuele fout en zoekt oorzaken in brondata, koppeling, scope, modelgedrag en steekproef.
5. **Leer-/kalibratielaag:** gebruikt uitsluitend geschikte, onafhankelijke en chronologisch toegestane gegevens.
6. **Modelregister:** bewaart versie, parameters, trainingsvenster, bewijs, validatieresultaten en rollbackstatus.
7. **Prognose en VisCoach:** gebruiken dezelfde goedgekeurde persoonlijke kennis waar relevant, met uitleg van bewijs en onzekerheid.
8. **Monitoring:** nieuwe sessies controleren of de verbetering standhoudt en geen regressie of datadrift veroorzaakt.

De architectuur moet onderscheid houden tussen:
- thermische/biologische activiteit;
- kans op minimaal één vangst binnen een bepaalde duur;
- verwachte aantallen/vangsttempo;
- habitatkeuze en lokale visverplaatsing;
- tactisch advies en kans op succes van een specifieke aanpak.

Deze uitkomsten zijn verwant, maar niet onderling uitwisselbaar.

## 6. Fasering

### Fase A — Read-only audit en datacontract
- Traceer de actuele keten snapshot → sessie → evaluatie → prognose → VisCoach.
- Controleer Brier-score en Brier Skill Score: exacte formules, populatie, uitsluitingen, minimumaantallen, duplicaatbescherming en baseline.
- Controleer of en waar evaluatieresultaten daadwerkelijk toekomstige prognoses beïnvloeden.
- Inventariseer bestaande temperatuurkalibratie en historische sessie-/Poissonmodellen.
- Definieer datacontract, kwaliteitsstatussen, uitkomstdefinities en fouttaxonomie.
- Leg een reproduceerbare baseline vast.
- Geen productcode of gebruikersdata wijzigen in deze fase.

**Acceptatie:** elke conclusie is gekoppeld aan actuele code, UI en tests; onbekende punten zijn expliciet; geen claims op basis van alleen documentatie.

### Fase B — Datakwaliteits- en foutdiagnose
- Implementeer deterministische datacontroles.
- Maak per prognose een uitlegbare foutkaart.
- Maak geaggregeerde diagnose per soort/plek/tijdvak/seizoen waar aantallen dat toelaten.
- Scheid bewezen dataproblemen van vermoedelijke problemen en natuurlijke variatie.
- Voeg tests toe voor vervuilde, ontbrekende, dubbele, tegenstrijdige en verkeerd gekoppelde gegevens.

**Acceptatie:** elke uitsluiting heeft een reden; diagnose is reproduceerbaar; brondata blijft intact.

### Fase C — Kalibratie en onafhankelijke validatie
- Meet kalibratie en Brier/Brier Skill Score met expliciete baseline.
- Gebruik chronologische train-/kalibratie-/testscheiding.
- Voorkom dat dezelfde sessie of latere data zowel kalibreren als onafhankelijk evalueren.
- Analyseer subgroepen alleen bij voldoende aantallen.
- Vergelijk met huidige model en eenvoudige baseline.

**Acceptatie:** verbetering is aantoonbaar op ongeziene, latere data; onzekerheid en beperkingen zijn gerapporteerd; geen future leakage.

### Fase D — Gecontroleerde modelterugkoppeling
- Voeg alleen correcties toe die door fase C zijn gevalideerd.
- Maak correcties begrensd, versieerbaar, uitlegbaar en terugdraaibaar.
- Registreer modelversie, datavenster, parameters, reden en verwachte impact.
- Brier-score wordt niet rechtstreeks als kanscorrectie gebruikt.
- Laat VisCoach alleen gevalideerde tactische patronen benutten; verwar vangstkans niet met habitat- of activiteitsadvies.

**Acceptatie:** oude snapshots veranderen niet; nieuwe prognoses verwijzen naar exacte modelversie; rollback is getest.

### Fase E — Praktijkvalidatie en doorlopende monitoring
- Volg nieuwe echte sessies als chronologische holdout.
- Detecteer modeldrift, datadrift en prestatieverslechtering.
- Vergelijk actuele en vorige modelversie en baseline.
- Schakel correcties uit of rol terug als prestaties verslechteren.
- Maak zichtbaar wat geleerd is, hoeveel sessies meetellen, welke zijn uitgesloten en hoe zeker de conclusie is.

**Acceptatie:** verbetering blijft overeind op echte latere sessies; softwarematige tests en synthetische simulaties worden apart gerapporteerd van praktijkbewijs.

## 7. Niet-doelen en waarborgen
- Geen black-box AI die zonder uitleg adviezen of kansen verandert.
- Geen automatische modelupdate op basis van één vangst of één slechte score.
- Geen directe Brier-score → vangstkans-correctie.
- Geen data verwijderen om de score mooier te maken.
- Geen gebruik van toekomstige gegevens in historische backtests.
- Geen ongefundeerde biologische gewichten of nauwkeurigheidsclaims.
- Geen betaalde cloud, verplicht account of externe AI nodig voor de kernfunctionaliteit.

## 8. Relatie met bestaand optimalisatietraject

Dit project heeft een eigen GitHub-issue en documentatie, maar blijft onderdeel van Vislogboek. Het overkoepelende plan #49 en met name de gesloten-leercyclusfase moeten naar dit project verwijzen en de resultaten hergebruiken. De bestaande evaluatie-, prognose-, temperatuur-, habitat- en VisCoach-engines blijven het uitgangspunt. Eerst aantonen wat ontbreekt; daarna pas uitbreiden.

## 9. Huidige status

| Onderdeel | Status |
|---|---|
| Bestaande prognose-snapshots | Aanwezig volgens code-audit; actuele volledige trace nog te doen |
| Sessie-uitkomstkoppeling | Aanwezig; randgevallen opnieuw auditen |
| Brier-score / Brier Skill Score | Aanwezig; exacte inclusie- en baselinewerking opnieuw auditen |
| Historische sessies in prognose | Aanwezig via succespercentage en Poisson-vangsttempo |
| Temperatuurfeedback | Aanwezig; afzonderlijke kalibratieroute |
| Brier als directe terugkoppeling naar vangstkans | Niet aangetoond |
| Verklaring per individuele Brier-bijdrage | Nog te auditen |
| Systematische datavervuilingsdiagnose | Nog te auditen / ontwerpen |
| Gevalideerde automatische modelcorrecties | Nog niet aangetoond |
| Praktijkvalidatie van verbeterde kanskalibratie | Nog te verzamelen |

**Eerstvolgende actie:** Fase A uitvoeren als read-only audit. Nog geen nieuwe leergewichten, correctiefactoren of automatische modelupdates implementeren.
## Thermische modelprior — begrensd gebruik (19 november 2026)

De bestaande thermische soortcurves blijven als voorlopige prior actief voor relatieve thermische respons binnen de bestaande prognose. De score wordt niet teruggekoppeld naar persoonlijke vangstkans, voedingsintensiteit of Brier-evaluatie. Exacte parameters blijven ongevalideerd; geen lokale nauwkeurigheidsclaim. Latere verfijning vereist passende soort-/levensfase-/watertype-evidence en onafhankelijke chronologische validatie.


# READ FIRST — Vislogboek

Dit bestand is het korte hervattingspunt. Het is geen tweede projectplan.

## Eerst lezen en leidende volgorde

1. `PROJECT_CONTEXT.md` — leidende product-, architectuur- en werkafspraken.
2. `IMPLEMENTATION_PLAN_32_IMPROVEMENTS.md` — goedgekeurd plan voor de 32 verbeterpunten en acceptatiecriteria.
3. `VISLOGBOEK_VERBETERPLAN.md` — leidend overkoepelend uitvoeringsplan; de sectie **Actuele uitvoeringsstatus en eerstvolgende opdracht** bepaalt de eerstvolgende actie.
4. `FASE2_PROGNOSE_AUDIT.md` — technisch/biologisch auditbewijs en bevindingen.
5. `MODELARCHITECTUUR_FASE2.md` — bindende architectuurgrenzen voor Fase 2.
6. `FASE2_UITVOERINGSRESULTATEN.md` — registratie van uitgevoerd werk en historische statuscorrecties.
7. `SOORTSPECIFIEKE_SCOREWEGING_PER_VIS.md` en `SOORTSPECIFIEKE_SCORE_WEGING.md` — inhoudelijke soortprofielen en rekenregels.
8. `VISCOACH_PRODUCT_ROADMAP.md` en `PROJECT_ZELFLERENDE_PROGNOSE.md` — afzonderlijke product-/leersporen.
9. `FASE0_OPTIMIZATION_AUDIT.md` en `FASE0_DATA_DICTIONARY_AND_BASELINE.md` — afzonderlijke fase-0-audits.

## Huidige status — 24 november 2026

- De operationele geïntegreerde Prognose-score v1 is geïmplementeerd in de bestaande engine via PR [#223](https://github.com/sennzor-wq/Vislogboek/pull/223).
- PR #223 is op 24 november 2026 gemerged naar `main`; mergecommit: `bf108f56cf9c937ae1fb915b310fd8bf4899ab8c`.
- Quality Gate run [45379544577](https://github.com/sennzor-wq/Vislogboek/actions/runs/45379544577) op de PR-head is geslaagd.
- De score blijft voorlopig en niet biologisch/empirisch gevalideerd. De 1–10-dagscore en vier tijdvakken blijven behouden; fysiologische en voedings-/foerageerrespons blijven afzonderlijk uitlegbaar.
- Fase 2 is niet formeel geaccepteerd. Fase 3 blijft geblokkeerd.
- Issue [#49](https://github.com/sennzor-wq/Vislogboek/issues/49) blijft het overkoepelende optimalisatietraject. Issue [#50](https://github.com/sennzor-wq/Vislogboek/issues/50) blijft een apart zelflerend-prognosespoor; niet tussendoor in de huidige opdracht trekken.

## Werkafspraken

- `main` is de enige bron van waarheid voor geïmplementeerde code en officiële uitvoeringsstatus.
- Verwijder of overschrijf geen historische auditinformatie; corrigeer status met een gedateerde aanvulling en verwijzing.
- Het uitvoeringsplan in `VISLOGBOEK_VERBETERPLAN.md` is leidend. Start geen volgende taak voordat de huidige acceptatiecriteria zijn gehaald.
- Geen nieuwe actieplannen, parallelle engines, concurrerende scores of scope-uitbreidingen.
- Geen wijzigingen aan scoreformule, gewichten, biologische parameters of productgedrag zonder expliciete goedkeuring van de eigenaar.
- Geen nieuwe branch zonder voorafgaande toestemming. Geen deployment zonder expliciete opdracht.

**Hervatten:** open `VISLOGBOEK_VERBETERPLAN.md` en voer uitsluitend de daar genoemde eerstvolgende opdracht uit. Als status of code niet overeenkomt met documentatie, stop en werk eerst de statusregistratie bij.

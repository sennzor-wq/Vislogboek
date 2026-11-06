# Vislogboek — interne documentatie

Deze branch bevat de interne projectdocumentatie en technische blauwdrukken van Vislogboek.

## Documenten

- [Projectcontext](PROJECT_CONTEXT.md) — architectuur, technische afspraken en actuele projectstatus.
- [VisCoach-roadmap](VISCOACH_PRODUCT_ROADMAP.md) — productrichting, fasering en acceptatiecriteria.
- [GIS-stekherkenning](GIS_STEKHERKENNING_BLUEPRINT.md) — technische blauwdruk voor geografische stekherkenning.
- [Verbeterplan](IMPLEMENTATION_PLAN_32_IMPROVEMENTS.md) — verzameld verbeter- en implementatieplan.

## Werkafspraken

1. Dit is de documentatiebranch; app-code en buildbestanden horen thuis in `main` van de app-repository.
2. Houd projectcontext en roadmap actueel wanneer architectuur- of productbesluiten wijzigen.
3. Wijzig technische blauwdrukken pas nadat de betreffende richting is besproken of goedgekeurd.
4. Documenteer status als gepland, in uitvoering, geïmplementeerd of vervallen. Maak onderscheid tussen gemergede code en open PR's.
5. Geen secrets, persoonlijke backups of productiegegevens in deze branch.

## Huidige stand — 6 november 2026

- PR #36 — welkomstmodal en contextgestuurde begroetingen: gemerged.
- PR #37 — onderscheid tussen startadvies en tussentijds coachadvies: gemerged.
- PR #39 — P0 dataintegriteit: gemerged na geslaagde Quality Gate.
- PR #40 — P1 prognose- en evaluatie-integriteit: gemerged na geslaagde Quality Gate.
- PR #41 — interne documentatie uit de app-root verwijderen: gemerged na geslaagde Quality Gate.
- Deze documentatiebranch is een aparte, docs-only branch binnen dezelfde GitHub-repository. Er is via de beschikbare GitHub-koppeling geen nieuwe repository aangemaakt; de documenten zijn wel buiten `main` veiliggesteld.

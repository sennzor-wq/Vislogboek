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

- P0 dataintegriteit: uitgewerkt en getest in app-PR #39; nog niet gemerged bij het maken van deze documentatiesnapshot.
- P1 prognose- en evaluatie-integriteit: uitgewerkt en getest in app-PR #40; nog niet gemerged bij het maken van deze documentatiesnapshot.
- Deze documentatiebranch is een veilige tussenstap binnen dezelfde GitHub-repository. Een aparte private repository kan later worden aangemaakt en gevuld vanuit deze branch.

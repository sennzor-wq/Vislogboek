# Soortspecifieke prognosescore — gewichten en berekening

**Status:** operationele v1 actief; voorlopige parameters en gewichten worden iteratief verfijnd  
**Doel:** iedere vissoort krijgt een eigen scoreopbouw op basis van de beschikbare biologische informatie over die soort.

## 1. Basisregel

Er komt geen universele weging voor alle vissoorten. Per vissoort én per prognose-uitkomst wordt bepaald welke factoren relevant zijn en hoe zwaar ze meetellen. Een factor krijgt alleen numeriek gewicht wanneer het beschikbare bewijs de betreffende uitkomst ondersteunt.

De score wordt dus niet gevuld met vaste percentages die voor iedere soort hetzelfde zijn. Ontbrekende of onvoldoende onderbouwde informatie krijgt geen verzonnen gemiddelde of bonus.

## 2. Wat telt zwaarder?

De prioriteit verschilt per uitkomst:

| Prognose-uitkomst | Zwaarst wegende factoren | Aanvullende factoren |
|---|---|---|
| **Fysiologische activiteit** | Watertemperatuur ten opzichte van de soortspecifieke thermische respons | Temperatuurverloop/acclimatisatie en zuurstof, zodra soortspecifiek onderbouwd en betrouwbaar beschikbaar |
| **Voedings-/foerageeractiviteit** | Soortspecifiek aangetoond voedingsgedrag, dag-nachtritme en seizoens-/lichtrespons | Temperatuur en andere omgevingsfactoren voor zover de bron een effect op de gemeten voedingsrespons aantoont |
| **Lokale aanwezigheid/habitat** | Soortspecifieke habitatvoorkeur en lokale waarnemingen | Wind, waterbeweging, diepte, dekking en voedsel-/zuurstofcontext; voorlopig kwalitatief zolang lokale aanwezigheid-data ontbreken |
| **Uiteindelijke vangkans** | Echte vangstgegevens voor dezelfde soort, met sessieduur/inspanning als blootstelling | Tijdvak, locatie, techniek en omstandigheden; pas wegen na voldoende echte gegevens |

Luchtdruk krijgt niet automatisch een zelfstandig gewicht. Zolang geen onafhankelijk, soortspecifiek effect is aangetoond, blijft dit hooguit contextinformatie. Ook worden samenhangende factoren niet dubbel geteld: bijvoorbeeld seizoen en watertemperatuur kunnen hetzelfde biologische signaal deels beschrijven.

## 3. Berekening van een score

Voor iedere soort en afzonderlijke uitkomst:

1. Zet iedere onderbouwde factor om naar een genormaliseerde deelscore van 0–100.
2. Ken per factor een soortspecifiek gewicht toe op basis van het bewijs voor precies die uitkomst.
3. Normaliseer de gewichten zodat de actieve gewichten samen 1 (of 100%) zijn.
4. Bereken de gewogen score: **score = Σ(deelscoreᵢ × gewichtᵢ) / Σ(actief gewichtᵢ)**.

Een factor zonder voldoende bewijs voor die uitkomst krijgt geen actief numeriek gewicht en telt niet mee in de noemer. De uitkomst vermeldt daarnaast welke factoren ontbreken en hoeveel onzekerheid dat veroorzaakt.

## 4. Hoe bepalen we het gewicht?

De volgorde van beoordeling is:

1. **Directheid:** meet de bron de bedoelde uitkomst rechtstreeks? Bijvoorbeeld voedselopname voor voedingsactiviteit, niet alleen groei of dieet.
2. **Effect:** hoe groot en consistent is het aangetoonde effect binnen het onderzochte bereik?
3. **Bewijskwaliteit:** veldonderzoek en herhaalde directe metingen wegen zwaarder dan indirecte aanwijzingen of een enkele gecontroleerde studie.
4. **Overdraagbaarheid:** past soort, levensfase, watertype, klimaat en onderzoekscontext bij de Nederlandse doelsoort/populatie?
5. **Onafhankelijkheid:** overlapt de factor niet grotendeels met een andere factor die al in de score zit?

De uiteindelijke gewichten worden per soort en uitkomst vastgelegd met bronverwijzing, bewijsstatus en onzekerheid. Als het bewijs geen betrouwbare numerieke rangorde toelaat, blijft de factor kwalitatief in plaats van dat we een percentage verzinnen.

## 5. Afzonderlijke responsen, één gebruikersscore

Fysiologische respons en voedings-/foerageerrespons blijven intern apart berekend en verklaarbaar, maar vormen samen één geïntegreerde 1–10-gebruikersscore. Dit maakt ze niet onderling uitwisselbaar:

- fysiologische capaciteit is niet hetzelfde als locomotorische activiteit;
- locomotie is niet hetzelfde als voedselzoeken of voedselopname;
- een voedingsrespons betekent niet dat de vis op de gekozen stek aanwezig is;
- aanwezigheid betekent niet dat de vis vangbaar is;
- persoonlijke vangkans blijft een aparte, empirische uitkomst en wordt niet rechtstreeks afgeleid van de biologische index.

## 6. Rekenvoorbeeld — alleen ter illustratie

Stel dat voor één soort en één uitkomst drie factoren voldoende onderbouwd zijn:

- factor A: deelscore 80, gewicht 0,50;
- factor B: deelscore 60, gewicht 0,30;
- factor C: deelscore 40, gewicht 0,20.

Dan wordt de score: (80 × 0,50) + (60 × 0,30) + (40 × 0,20) = **66**.

Dit voorbeeld laat alleen de rekenwijze zien. Het zijn geen vastgestelde Vislogboek-gewichten en het zegt niets over een concrete vissoort.

## 7. Huidige status

De operationele v1 is geactiveerd in de bestaande Prognose-engine. De eerste startparameters komen uit de bestaande soortprofielen en vismodel_voorstel_v2.xlsx: T0–T3-temperatuurcurves, soortspecifiek dagritme, seizoensfase en archetypegewichten voor de voedingsrespons. Deze waarden zijn expliciet voorlopig. Synthetische tests controleren de softwareberekening, niet de biologische juistheid of voorspellende nauwkeurigheid.

## 8. Geïntegreerde gebruikersscore met afzonderlijke biologische responsen

**Leidend besluit 24 november 2026:** de biologische responsen blijven afzonderlijk berekenbaar, maar worden vertaald naar één geïntegreerde vangstgerichte prognosescore van 1–10 in de bestaande dag- en vier tijdvakweergave. Dit vervangt de eerdere formulering in §5 dat alle vier uitkomsten ook voor de gebruikersscore volledig gescheiden moeten blijven.

Fysiologische capaciteit/respons, voedings-/foerageerrespons, locomotorische activiteit, lokale aanwezigheid/habitat en empirische persoonlijke vangkans blijven intern herkenbaar. Een fysiologische maat is niet automatisch beweging; beweging is niet automatisch foerageren; foerageren is niet automatisch voedselopname; aanwezigheid is niet automatisch vangbaarheid.

De fysiologische en voedings-/foerageerrespons vormen samen de onderliggende biologische basis van één vangstgerichte prognose-index. Dit is geen vangstpercentage of persoonlijke kans. De combinatie is geen verplicht rekenkundig gemiddelde. De soortspecifieke functie moet voorkomen dat lage locomotorische activiteit automatisch een gunstige voedingsrespons wegdrukt, en moet responsrichting, interacties, limiterende omstandigheden, bewijsstatus, onzekerheid en dubbeltelling meenemen. Aanwezigheid/habitat wordt alleen betrokken bij een expliciete gevalideerde koppeling.

Behoud de schaal 1–10 en de bestaande dagscore plus vier tijdvakscores. Prognose toont de volledige onderbouwing en afzonderlijke responsen.

**Verantwoordelijkheidsgrens:** Prognose berekent en verklaart de biologische responsen en geïntegreerde score en bewaart factoren, bron-ID's, bewijsstatus, invoer en onzekerheid. VisCoach consumeert deze output en vertaalt die, samen met sessie-, locatie- en techniekcontext, naar tactiek en praktisch advies. VisCoach maakt geen eigen biologische prognose, herweegt geen biologische factoren en verandert de score niet. Bij weinig verplaatsing maar gunstige gerichte voedselopname kan de prognosescore gunstig blijven; VisCoach adviseert dan een passende nauwkeurige presentatie en relevante voedsel-/habitatzone.

**Operationele status:** de bestaande dag-/tijdvakscore gebruikt nu de voorlopige responsfuncties en een transparante 50/50-samenvoeging van de beschikbare fysiologische en voedings-/foerageerrespons. De verfijning gebeurt iteratief binnen deze actieve berekening; geen nieuwe engine en geen herstart van het modelontwerp. Onbekende invoer wordt niet als nul ingevuld. De bestaande interval-, onbekend-, snapshot-, Europe/Amsterdam-, DST- en targetTime-as-of-contracten blijven leidend.


## 9. Actieve scoreberekening v1

De huidige runtime gebruikt per soort:
1. Een voorlopige T0–T3-trapeziumcurve voor de fysiologische thermische respons.
2. Een voedings-/foerageerrespons uit de soortspecifieke diel-profielen en maandelijkse seizoensfase.
3. De werkboek-archetypegewichten per soortprofiel. Alleen beschikbare dagritme- en seizoensgewichten worden genormaliseerd; voedsel-/prooiaanbod en wateractiviteit blijven onbekend en verlagen de zichtbare driverdekking.
4. Een voorlopige 50/50-combinatie van de beschikbare fysiologische en voedingsrespons tot de bestaande 1–10-index. Dit is een technische startregel, geen literatuur-afgeleide verhouding.
5. De bestaande vier tijdvakken en duurgewogen dagaggregatie.

De score is nu operationeel. De numerieke waarden blijven modelprioren en worden in volgende iteraties verfijnd. De research registry wordt niet automatisch goedgekeurd; bronstatus en operationele modelstatus blijven gescheiden.

**Prognose/VisCoach:** Prognose berekent en verklaart beide responsen, de geïntegreerde score, de factorbijdragen en onzekerheid. VisCoach gebruikt die uitkomsten uitsluitend om een praktische tactiek te vertalen en herberekent of herweegt geen biologie.

/**
 * Research Registry
 *
 * Centrale registratie van kennis die gebruikt kan worden ter onderbouwing
 * van prognose- en adviesregels.
 *
 * Belangrijk:
 * - Dit register verandert zelf geen vangstkansen.
 * - Het register bevat geen verborgen modelgewichten.
 * - Een registratie is geen automatische toestemming om een regel als
 *   harde voorspelfactor te gebruiken.
 *
 * De daadwerkelijke koppeling aan prognosemodellen gebeurt pas nadat een
 * factor afzonderlijk is beoordeeld.
 */

export type ResearchOutcome =
  | 'feeding_intensity'
  | 'feeding_rhythm'
  | 'foraging_behavior'
  | 'diet_composition'
  | 'prey_selection'
  | 'locomotor_activity'
  | 'habitat_use'
  | 'growth'
  | 'feeding_physiology'
  | 'metabolic_rate'
  | 'aerobic_scope';

export type EvidenceStrength =
  | 'strong'
  | 'moderate'
  | 'limited'
  | 'unknown';

export type KnowledgeApplication =
  | 'prognosis'
  | 'advice'
  | 'biology'
  | 'environment'
  | 'general';

export type DataStatus =
  | 'measured'
  | 'forecast'
  | 'modelled'
  | 'userReported'
  | 'unknown';

export interface ResearchRegistryEntry {
  /**
   * Unieke technische identifier.
   */
  id: string;

  /**
   * Onderwerp waarop de kennis betrekking heeft.
   * Bijvoorbeeld: temperatuur, seizoen, activiteit of habitat.
   */
  topic: string;

  /**
   * Vissoorten waarvoor deze kennis relevant is.
   *
   * Lege array betekent dat de kennis niet aan één specifieke soort
   * is gekoppeld.
   */
  species: string[];

  /**
   * Waarvoor deze kennis bedoeld is binnen de app.
   */
  application: KnowledgeApplication;

  /**
   * Mate van onderbouwing.
   *
   * strong   = relatief sterk onderbouwd
   * moderate = bruikbaar, maar contextafhankelijk
   * limited  = beperkte onderbouwing
   * unknown  = onderbouwing nog niet beoordeeld
   */
  evidenceStrength: EvidenceStrength;

  /** Wat de studie daadwerkelijk heeft gemeten; nooit afleiden uit alleen topic/summary. */
  measuredOutcomes?: ResearchOutcome[];

  /**
   * Korte, neutrale beschrijving van wat bekend is.
   *
   * Hier horen geen overdreven conclusies of exacte vangstclaims thuis.
   */
  summary: string;

  /**
   * Belangrijke beperkingen of onzekerheden.
   *
   * Dit veld is verplicht zodat onzekerheid niet verborgen blijft.
   */
  limitations: string[];

  /**
   * Optionele verwijzing naar de bron of interne documentatie.
   *
   * Een lege array betekent nadrukkelijk niet dat een aanname als feit
   * mag worden behandeld.
   */
  sourceReferences: string[];

  /**
   * Datum waarop de registratie voor het laatst is beoordeeld.
   */
  reviewedAt: string;

  /**
   * Geeft aan of deze registratie al is beoordeeld voor gebruik als
   * directe prognosefactor.
   *
   * false betekent: alleen informatieve kennis, nog geen modelregel.
   */
  approvedForPrediction: boolean;
}

/**
 * Centrale lijst met geregistreerde kennis.
 *
 * Alleen bronnen met een vastgelegde onderbouwing en expliciete beperkingen
 * worden toegevoegd. Een registratie wordt niet automatisch goedgekeurd voor
 * directe toepassing als voorspellingsregel.
 */
export const RESEARCH_REGISTRY: ResearchRegistryEntry[] = [

  {
    id: 'lake-temperature-models-multi-lake-calibration-2025',
    topic: 'watertemperatuur-modelkalibratie',
    species: [],
    application: 'environment',
    evidenceStrength: 'strong',
    summary: 'Een internationale kalibratiestudie vergeleek vier eendimensionale meerwatertemperatuurmodellen op 73 meren. Parameterwaarden, modelprestaties en parametersensitiviteit verschilden tussen modellen en clusters van meerkenmerken; geen model presteerde in alle meren het best.',
    limitations: [
      'De studie betreft meren met beschikbare temperatuurdata en valideert niet rechtstreeks de vereenvoudigde Vislogboek-engine of een specifieke Nederlandse stek.',
      'De resultaten ondersteunen model- en locatiespecifieke kalibratie, maar leveren geen kant-en-klare responsgewichten of tijdconstanten voor Vislogboek.',
      'Dit is omgevings-/modelkalibratiebewijs, geen directe vissoort-, voedings- of vangstkansfactor.'
    ],
    sourceReferences: [
      'Feldbauer, J., Mesman, J.P., Andersen, T.K. & Ladwig, R. (2025). Learning from a large-scale calibration effort of multiple lake temperature models. Hydrology and Earth System Sciences, 29, 1183–1199. https://doi.org/10.5194/hess-29-1183-2025'
    ],
    reviewedAt: '2026-11-17',
    approvedForPrediction: false,
  },

  {
    id: 'lake-thermal-models-piccolroaz-2024',
    topic: 'watertemperatuur',
    species: [],
    application: 'environment',
    evidenceStrength: 'moderate',
    summary: 'Meerlagige en hybride modellen beschrijven watertemperatuur als gevolg van de netto warmtebalans. Luchttemperatuur kan in vereenvoudigde modellen als proxy voor een deel van de warmte-uitwisseling dienen, maar thermische traagheid, waterdiepte/stratificatie, zonnestraling en andere warmtefluxen beïnvloeden de respons. Parameters zijn locatie- en modelafhankelijk en vragen kalibratie met waargenomen watertemperaturen.',
    limitations: [
      'De review behandelt uiteenlopende meren en modeltypen; uitkomsten zijn niet zonder meer overdraagbaar op iedere kleine plas, kanaal, rivier of lokale oeverzone.',
      'Luchttemperatuur alleen is geen actuele watertemperatuurmeting en een eenvoudige air-water-relatie kan seizoensafhankelijke hysterese en lokale omstandigheden missen.',
      'Vereenvoudigde warmte-uitwisselingsparameters moeten voor de betreffende locatie of representatieve watertypen worden gekalibreerd en chronologisch gevalideerd.',
      'Deze omgevingskennis is geen directe, bewezen vangstkansfactor voor een vissoort.'
    ],
    sourceReferences: [
      'Piccolroaz, S. et al. (2024). Lake Water Temperature Modeling in an Era of Climate Change: Data Sources, Models, and Future Prospects. Reviews of Geophysics, 62(1), e2023RG000816. https://doi.org/10.1029/2023RG000816',
      'https://pubs.usgs.gov/publication/70251990'
    ],
    reviewedAt: '2026-11-02',
    approvedForPrediction: false,
  },
  {
    id: 'knmi-still-water-temperature-model',
    topic: 'watertemperatuur',
    species: [],
    application: 'environment',
    evidenceStrength: 'strong',
    summary: 'Het KNMI beschrijft een operationeel water- en ijsgroeimodel voor stilstaand zoet buitenwater. De warmtebalans omvat lucht-waterwarmte-uitwisseling, verdamping, inkomende zonnestraling en nachtelijke uitstraling. Invoer omvat onder meer luchttemperatuur, relatieve vochtigheid, bewolking en wind; waterdiepte bepaalt de thermische traagheid. KNMI rapporteert voor het toepassingsgebied een verificatie binnen circa 1 °C.',
    limitations: [
      'De gerapporteerde nauwkeurigheid geldt voor het KNMI-model en zijn representatieve toepassing op stilstaand zoet buitenwater; dit is geen prestatiegarantie voor Vislogboek.',
      'Het ijsgroeimodel is beschreven voor een waterkolom van circa 2 meter en is niet zonder meer overdraagbaar naar ondiepe sloten, diepe zandwinplassen of stromende rivieren.',
      'De publiek beschikbare KNMI-pagina beschrijft de fysische processen, maar biedt geen gedocumenteerde numerieke API of volledige implementatiespecificatie om het operationele KNMI-model één-op-één in te bouwen.',
      'De Vislogboek-implementatie is daarom KNMI-geïnformeerd en niet het officiële KNMI-model; eigen parameters moeten chronologisch worden gevalideerd.'
    ],
    sourceReferences: [
      'KNMI. Watertemperatuur- en ijsgroeimodel van het KNMI. https://www.knmi.nl/kennis-en-datacentrum/achtergrond/watertemperatuur-en-ijsgroeimodel-van-het-knmi',
      'De Bruin, H.A.R. & Wessels, H.R.A. (1988). A model for the formation and melting of ice on surface waters. Journal of Applied Meteorology, 27, 164-173. https://doi.org/10.1175/1520-0450(1988)027<0164:AMFTFA>2.0.CO;2'
    ],
    reviewedAt: '2026-11-02',
    approvedForPrediction: false,
  },
  {
    id: 'rijkswaterstaat-historical-surface-water-temperature',
    topic: 'watertemperatuur',
    species: [],
    application: 'environment',
    evidenceStrength: 'strong',
    summary: 'Rijkswaterstaat biedt actuele en historische oppervlaktewaterwaarnemingen, waaronder temperatuur, via Waterinfo en de WaterWebservices. De nieuwe services ontsluiten meetreeksen via een metadata-catalogus en de OnlineWaarnemingenService; meetkwaliteit en meetlocatie moeten bij interpretatie behouden blijven.',
    limitations: [
      'Dekking is niet gegarandeerd voor regionale sloten, vijvers en kleine plassen; veel RWS-meetpunten representeren grotere rijkswateren.',
      'Een nabijgelegen meetpunt is niet automatisch representatief voor een ander watertype, diepte, stromingsregime of lokale oeverzone.',
      'Waarnemingen moeten op procesType, compartiment, grootheid, meettijd, meetdiepte en kwaliteitswaardecode worden gecontroleerd voordat ze een profiel mogen voeden.'
    ],
    sourceReferences: [
      'Rijkswaterstaat Data. Waterdata en WaterWebservices. https://rijkswaterstaatdata.nl/waterdata/',
      'Rijkswaterstaat. Waterdata. https://www.rijkswaterstaat.nl/water/waterdata'
    ],
    reviewedAt: '2026-11-02',
    approvedForPrediction: false,
  },
  {
    id: 'common-carp-acute-temperature-metabolism-1983',
    topic: 'acute-temperatuur-en-metabolisme',
    measuredOutcomes: ['metabolic_rate'],
    species: ['Karper'],
    application: 'biology',
    evidenceStrength: 'limited',
    summary: 'Een respirometrische studie bij karper, geacclimeerd op 19 °C, mat zuurstofverbruik, hartslag en ventilatie tijdens korte acute temperatuurveranderingen van 2–6 °C. De metabole respons veranderde snel met de lichaamstemperatuur; de gerapporteerde Q10 voor metabolisme was 2,61.',
    limitations: [
      'De vissen waren geacclimeerd op één uitgangstemperatuur (19 °C); de studie levert geen volledige langetermijn-temperatuurcurve of thermisch optimum.',
      'Het betreft acute laboratoriumblootstelling van maximaal 60 minuten, geen dagelijkse veldactiviteit of voedselopname.',
      'De bron ondersteunt temperatuurgevoeligheid van metabolisme, maar valideert niet de huidige karpercurve of haar numerieke parameters.'
    ],
    sourceReferences: [
      'Moffitt, B.P. & Crawshaw, L.I. (1983). Effects of Acute Temperature Changes on Metabolism, Heart Rate, and Ventilation Frequency in Carp Cyprinus carpio L. Physiological Zoology, 56(3), 397–403. https://doi.org/10.1086/physzool.56.3.30152604'
    ],
    reviewedAt: '2026-11-16',
    approvedForPrediction: false,
  },
  {
    id: 'northern-pike-metabolic-rate-temperature-1982',
    topic: 'temperatuur-en-metabolisme',
    measuredOutcomes: ['metabolic_rate'],
    species: ['Snoek'],
    application: 'biology',
    evidenceStrength: 'limited',
    summary: 'Een laboratoriumstudie bepaalde het metabolisme van snoek met zuurstofverbruik en rantsoenexperimenten. De gepubliceerde onderhoudsmetabolisme-relaties bevatten metingen bij 2 °C en 14 °C.',
    limitations: [
      'Twee temperatuurpunten zijn onvoldoende om een volledig optimum, asymmetrische curve of bovengrens vast te stellen.',
      'De bron onderzoekt energiehuishouding, niet rechtstreeks dagelijkse jachtactiviteit, voedselopname of hengelvangbaarheid.',
      'De studie rechtvaardigt geen directe numerieke wijziging van het huidige snoekprofiel.'
    ],
    sourceReferences: [
      'Diana, J.S. (1982). An experimental analysis of the metabolic rate and food utilization of northern pike. Comparative Biochemistry and Physiology Part A, 71(3), 395–399. https://doi.org/10.1016/0300-9629(82)90424-8'
    ],
    reviewedAt: '2026-11-16',
    approvedForPrediction: false,
  },
  {
    id: 'european-perch-aerobic-scope-size-temperature-2020',
    topic: 'temperatuur-lichaamsgrootte-en-aerobe-scope',
    measuredOutcomes: ['metabolic_rate', 'aerobic_scope'],
    species: ['Baars'],
    application: 'biology',
    evidenceStrength: 'moderate',
    summary: 'Respirometrisch onderzoek bij Europese baars onderzocht standaard- en maximale stofwisseling, aerobe scope en temperatuurvoorkeur bij acclimatisatietemperaturen van 15–28 °C. De optimale temperatuur voor aerobe scope en de temperatuurvoorkeur daalden met toenemende lichaamsmassa.',
    limitations: [
      'De relatie is lichaamsgrootte-afhankelijk; één universeel thermisch optimum voor alle baarzen is niet verdedigbaar.',
      'Het onderzoek vond plaats onder gecontroleerde laboratoriumomstandigheden en meet fysiologische capaciteit, niet rechtstreeks dagelijkse voedingsactiviteit of hengelvangbaarheid.',
      'De resultaten zijn een mechanistische prior, geen directe validatie van de bestaande Vislogboek-curve voor Nederlandse wateren.'
    ],
    sourceReferences: [
      'Christensen, E.A.F., Svendsen, M.B.S. & Steffensen, J.F. (2020). The combined effect of body size and temperature on oxygen consumption rates and the size-dependency of preferred temperature in European perch Perca fluviatilis. Journal of Fish Biology, 97(3), 794–803. https://doi.org/10.1111/jfb.14435'
    ],
    reviewedAt: '2026-11-16',
    approvedForPrediction: false,
  },
  {
    id: 'roach-bream-metabolic-rate-temperature-2006',
    topic: 'temperatuur-en-metabolisme',
    measuredOutcomes: ['metabolic_rate'],
    species: ['Brasem', 'Voorn'],
    application: 'biology',
    evidenceStrength: 'moderate',
    summary: 'Geautomatiseerde respirometrie onderzocht standaard- en routinezuurstofverbruik bij brasem en blankvoorn over 5–23 °C en een brede lichaamsmassaklasse. Beide soorten vertoonden exponentiële temperatuurafhankelijkheid, maar met soort- en levensfaseverschillen in Q10 en massaschaling.',
    limitations: [
      'Standaard- en routinezuurstofverbruik zijn fysiologische responsen; zij zijn niet hetzelfde als voedselopname, totale zwemactiviteit of hengelvangbaarheid.',
      'De studie is gecontroleerd laboratoriumonderzoek; de respons kan niet zonder meer worden vertaald naar een lokale veldcurve of een beste vistijd.',
      'De resultaten tonen juist soort- en grootteverschillen en ondersteunen geen gedeelde universele curve voor brasem en blankvoorn.'
    ],
    sourceReferences: [
      'Hölker, F. (2006). Effects of body size and temperature on metabolism of bream compared to sympatric roach. Animal Biology, 56(1), 23–37. https://doi.org/10.1163/157075606775904713',
      'Hölker, F. (2003). The metabolic rate of roach in relation to body size and temperature. Journal of Fish Biology, 62(3), 565–579. https://doi.org/10.1046/j.1095-8649.2003.00048.x'
    ],
    reviewedAt: '2026-11-16',
    approvedForPrediction: false,
  },
  {
    id: 'adult-pikeperch-aerobic-scope-temperature-2012',
    topic: 'temperatuur-en-aerobe-scope-levensfase',
    measuredOutcomes: ['metabolic_rate', 'aerobic_scope'],
    species: ['Snoekbaars'],
    application: 'biology',
    evidenceStrength: 'moderate',
    summary: 'Een gecontroleerde respirometrische studie bij volwassen snoekbaars mat standaard- en maximale stofwisseling bij 13–28 °C. De maximale aerobe scope lag bij 18,8 °C; het bereik met ten minste 80% van die maximale scope liep van 10,4 tot 26,9 °C. De auteurs rapporteerden daarnaast een ontogenetische verschuiving: juveniele snoekbaars heeft een hoger groeitemperatuurbereik dan adulten.',
    limitations: [
      'De vissen kwamen uit een commerciële kweekfaciliteit en werden in aquacultuurtanks onderzocht; overdracht naar vrijlevende Nederlandse populaties is onzeker.',
      'Het optimum betreft aerobe scope, niet een gemeten optimum voor foerageren, jachtactiviteit of hengelvangbaarheid.',
      'De bron laat zien dat levensfase belangrijk is; de app kent die meestal niet en mag de volwassen curve niet als universeel soortoptimum presenteren.'
    ],
    sourceReferences: [
      'Frisk, M., Skov, P.V. & Steffensen, J.F. (2012). Thermal optimum for pikeperch (Sander lucioperca) and the use of ventilation frequency as a predictor of metabolic rate. Aquaculture, 324–325, 151–157. https://doi.org/10.1016/j.aquaculture.2011.10.024'
    ],
    reviewedAt: '2026-11-16',
    approvedForPrediction: false,
  },
  {
    id: 'freshwater-fish-temperature-growth-four-species-tien-2024',
    topic: 'temperatuur-en-groei',
    measuredOutcomes: ['growth'],
    species: ['Brasem', 'Baars', 'Snoekbaars', 'Voorn'],
    application: 'biology',
    evidenceStrength: 'moderate',
    summary: 'Een Nederlandse meerstudie analyseerde groeiveranderingen van brasem, baars, snoekbaars en blankvoorn in IJsselmeer en Markermeer over meerdere decennia. De auteurs bespreken voor deze soorten optimale groeitemperaturen van grofweg 20–25 °C en een relatie tussen warmere zomers en groei van jonge vis.',
    limitations: [
      'Groei is niet hetzelfde als acute activiteit, voedselopname, vangbaarheid of de beste vistemperatuur.',
      'De uitkomsten zijn gebaseerd op populaties in grote Nederlandse meren en mogen niet zonder meer worden vertaald naar iedere levensfase, klein water of individuele stek.',
      'Deze bron valideert de bestaande thermische activiteitscurves of hun exacte optimum- en breedteparameters niet.'
    ],
    sourceReferences: [
      'Tien, N.S.H. et al. (2024). Temperature-related increase in growth rate in four freshwater lake fish species. Journal of Fish Biology. https://doi.org/10.1111/jfb.15745'
    ],
    reviewedAt: '2026-11-02',
    approvedForPrediction: false,
  },
  {
    id: 'fish-feeding-temperature-review-2020',
    topic: 'temperatuur-en-voedselopname',
    species: [],
    application: 'biology',
    evidenceStrength: 'moderate',
    summary: 'Een review beschrijft dat temperatuur stofwisseling, voedselzoekgedrag, voedselopname en vertering beïnvloedt. De richting en omvang verschillen sterk per soort, acclimatisatie, levensfase, duur en snelheid van temperatuurverandering; gematigde opwarming kan voedselopname verhogen, terwijl waarden buiten het soortspecifieke bereik die kunnen verlagen.',
    limitations: [
      'De review omvat uiteenlopende vissoorten en systemen; zij levert geen universele temperatuurcurve voor Nederlandse zoetwatervissen.',
      'Voedselopname en vertering zijn niet hetzelfde als totale zwemactiviteit of kans op een hengelvangst.',
      'Deze bron ondersteunt het belang van temperatuur als context, niet de exacte numerieke parameters van de Vislogboek-profielen.'
    ],
    sourceReferences: [
      'Volkoff, H. & Rønnestad, I. (2020). Effects of temperature on feeding and digestive processes in fish. Temperature, 7(4), 307–320. https://doi.org/10.1080/23328940.2020.1765950'
    ],
    reviewedAt: '2026-11-02',
    approvedForPrediction: false,
  },
  {
    id: 'common-carp-temperature-feeding-rhythm-2012',
    topic: 'dagritme-en-voedselopname',
    measuredOutcomes: ['feeding_intensity', 'feeding_rhythm', 'feeding_physiology'],
    species: ['Karper'],
    application: 'biology',
    evidenceStrength: 'limited',
    summary: 'Een experimentele studie naar de Aziatische ondersoort Cyprinus carpio haematopterus testte voedselopname bij 4–34 °C bij volwassen karpers van 630–850 g en jonge vissen van 61–91 g. In de samenvatting worden twee voedingspieken genoemd: 08:00–11:00 en 19:00–23:00. Onder 10 °C verschoof de avondpiek naar een breder interval tot 04:00; bij 6 °C bleef de gemeten voedselopname zeer laag. De dagelijkse opname was het hoogst bij 28 °C en nam bij 34 °C weer af.',
    limitations: [
      'De onderzochte ondersoort is Cyprinus carpio haematopterus; de uitkomsten zijn niet zonder meer overdraagbaar op alle Europese/Nederlandse karperpopulaties.',
      'De samenvatting noemt twee gewichtsklassen (volwassen 630–850 g; jong 61–91 g), maar geeft geen basis om de respons te generaliseren naar alle levensfasen of grote wilde karpers.',
      'De hier gecontroleerde gegevens zijn afkomstig uit het gepubliceerde abstract; experimentele tank-/voeropzet, acclimatisatieduur, lichtregime en replicatie moeten in de volledige publicatie worden nagegaan voordat de studie zwaarder wordt gewogen.',
      'De gemelde kloktijden zijn experimentele voedingspieken en geen veldwaarneming van natuurlijke foerageeractiviteit of hengelvangbaarheid.',
      'De studie ondersteunt dat voedselopname temperatuur- en tijdsafhankelijk kan zijn, maar valideert niet de huidige vaste tijdvakbonus of de precieze profielcurves.',
      'Een tijdstipvoorkeur mag pas als numerieke scorefactor worden gebruikt na passende soort-, seizoen- en watertypevalidatie.'
    ],
    sourceReferences: [
      'Chen, S. et al. (2012). Effect of Water Temperature on Feeding Rhythm in Common Carp (Cyprinus carpio haematopterus Temminck et Schlegel). Journal of Northeast Agricultural University (English Edition), 19(1), 57–61. https://doi.org/10.1016/S1006-8104(12)60039-7'
    ],
    reviewedAt: '2026-11-02',
    approvedForPrediction: false,
  },
  {
    id: 'tench-temperature-feeding-efficiency-2026',
    topic: 'temperatuur-en-voedselopname',
    measuredOutcomes: ['feeding_intensity', 'feeding_physiology'],
    species: ['Zeelt'],
    application: 'biology',
    evidenceStrength: 'limited',
    summary: 'Een experimentele vergelijking onderzocht zeelt bij 18 °C en 25 °C en vond bij zeelt een lagere maximale voedselopname bij 25 °C dan bij 18 °C. Dit onderstreept dat meer warmte niet automatisch meer voedselopname betekent.',
    limitations: [
      'De zeelt werd onderzocht als invasieve soort in het St. Lawrence-systeem; de uitkomst is contextgebonden en geen directe Nederlandse veldcurve.',
      'Twee temperatuurbehandelingen vormen geen volledig thermisch optimum of tolerantieprofiel.',
      'De studie meet voedselopname/voederefficiëntie, niet algemene activiteit of hengelvangbaarheid; niet gebruiken om de bestaande curve numeriek te herkalibreren.'
    ],
    sourceReferences: [
      'Benjamin, C., Hill, J. & Ricciardi, A. (2026). Thermal effects on feeding efficiency and body condition in invasive and native benthivorous freshwater fishes. Biological Invasions, 28, 51. https://doi.org/10.1007/s10530-026-03767-w'
    ],
    reviewedAt: '2026-11-02',
    approvedForPrediction: false,
  },

  {
    id: 'common-carp-juvenile-foraging-temperature-2012',
    topic: 'temperatuur-en-foerageergedrag',
    measuredOutcomes: ['foraging_behavior', 'growth'],
    species: ['Karper'],
    application: 'biology',
    evidenceStrength: 'moderate',
    summary: 'Een experimentele studie onderzocht gewone karperjuvenielen van circa 90–105 mm bij 16, 20, 24 en 28 °C. Temperatuur beïnvloedde de foraging rate en groei positief binnen het onderzochte bereik; de hoogste gemeten foerageersnelheid trad op bij 24 °C.',
    limitations: [
      'De studie onderzocht juvenielen in gecontroleerde omstandigheden; de uitkomst is niet rechtstreeks overdraagbaar op volwassen karper in Nederlandse buitenwateren.',
      'Foerageersnelheid en groei zijn verschillende responsvariabelen; groei is geen directe maat voor dagelijkse activiteit of vangbaarheid.',
      'De studie valideert niet de bestaande thermische profielcurve of de exacte optimum-/breedteparameters van Vislogboek.'
    ],
    sourceReferences: [
      'Oyugi, D.O., Cucherousset, J., Baker, D.J. & Britton, J.R. (2012). Effects of temperature on the foraging and growth rate of juvenile common carp, Cyprinus carpio. Journal of Thermal Biology, 37(1), 89–94. https://doi.org/10.1016/j.jtherbio.2011.11.005'
    ],
    reviewedAt: '2026-11-16',
    approvedForPrediction: false,
  },
  {
    id: 'common-bream-winter-activity-reservoir-2018',
    topic: 'winteractiviteit-en-habitat',
    measuredOutcomes: ['locomotor_activity', 'habitat_use'],
    species: ['Brasem'],
    application: 'biology',
    evidenceStrength: 'moderate',
    summary: 'Akoestische telemetrie in een Europees stuwmeer liet zien dat brasem ook in de winter actief bleef in een zone met relatief warmer en zuurstofrijk water. Foerageren werd op basis van de habitatcontext vermoed, maar niet als directe voedselopname gemeten.',
    limitations: [
      'De studie betreft één diep reservoir met een specifieke thermische en zuurstofstratificatie; dit is niet gelijk aan een ondiepe plas, kanaal of polderwater.',
      'Telemetrie meet detecties en beweging, niet rechtstreeks de hoeveelheid voedselopname of de kans op een hengelvangst.',
      'De studie levert geen universele winterbonus of numerieke temperatuurcurve voor brasem.'
    ],
    sourceReferences: [
      'Jurajda, P., Roche, K., Halačka, K., Mrkvová, M. & Zukal, J. (2018). Winter activity of common bream (Abramis brama L.) in a European reservoir. Fisheries Management and Ecology, 25, 163–171. https://doi.org/10.1111/fme.12275'
    ],
    reviewedAt: '2026-11-16',
    approvedForPrediction: false,
  },
  {
    id: 'common-bream-wetland-seasonal-movement-2026',
    topic: 'seizoensbeweging-en-habitat',
    measuredOutcomes: ['locomotor_activity', 'habitat_use'],
    species: ['Brasem'],
    application: 'biology',
    evidenceStrength: 'moderate',
    summary: 'Een tweejarige akoestische telemetriestudie volgde 170 brasems in het sterk verbonden River Bure-wetland. De gemeten bewegingsmaten waren gemiddeld hoger in de winter dan in de zomer; gebruik van zijwateren en off-channel habitats hing samen met de sterke laterale verbindingen.',
    limitations: [
      'Het onderzochte Britse wetland heeft een uitzonderlijk netwerk van verbonden zijwateren en is niet representatief voor ieder Nederlands water.',
      'Bewegingsmaten zijn geen directe maat voor voedselopname, totale activiteit of vangbaarheid.',
      'De studie ondersteunt seizoens- en habitatcontext, maar geen vaste tijdvakscore of universele winterweging.'
    ],
    sourceReferences: [
      'Cittadino, S., Tarkan, A.S., Aksu, S. et al. (2026). Effects of season and acoustic telemetry sample sizes on the detections and movements of potadromous common bream Abramis brama in a highly connected wetland system. Hydrobiologia, 853, 3287–3301. https://doi.org/10.1007/s10750-026-06142-x'
    ],
    reviewedAt: '2026-11-16',
    approvedForPrediction: false,
  },
  {
    id: 'northern-pike-lowland-river-movement-habitat-2025',
    topic: 'temperatuur-seizoen-en-habitatbeweging',
    measuredOutcomes: ['locomotor_activity', 'habitat_use'],
    species: ['Snoek', 'Snoekbaars'],
    application: 'biology',
    evidenceStrength: 'moderate',
    summary: 'Akoestische telemetrie in een sterk gereguleerde Engelse laaglandrivier liet zien dat snoekbewegingen samenhingen met seizoen en temperatuur. De bewegingsfrequentie nam toe bij oplopende watertemperatuur tot circa 15 °C en nam daarboven af; een off-channel marina vormde een belangrijk habitat.',
    limitations: [
      'De rivier was sterk gekanaliseerd en had slechts één belangrijke off-channel marina; habitatbeschikbaarheid verschilt sterk van natuurlijke meren en kleine Nederlandse wateren.',
      'De studie meet beweging en habitatgebruik, niet rechtstreeks voedselopname, jachtintensiteit of vangbaarheid.',
      'De waargenomen temperatuurrelatie mag niet als gevalideerde thermische activiteitscurve voor snoek worden overgenomen.'
    ],
    sourceReferences: [
      'Nolan, E.T., Hindes, A.M., Bolland, J.D. et al. (2025; first published online 2024). Movements and habitat use of native and invasive piscivorous fishes in a temperate and channelized lowland river. Hydrobiologia, 852, 2187–2206. https://doi.org/10.1007/s10750-024-05533-2'
    ],
    reviewedAt: '2026-11-16',
    approvedForPrediction: false,
  },
  {
    id: 'european-perch-activity-habitat-lakes-2002-2025',
    topic: 'dagritme-activiteit-en-habitat',
    measuredOutcomes: ['locomotor_activity', 'habitat_use'],
    species: ['Baars'],
    application: 'biology',
    evidenceStrength: 'moderate',
    summary: 'Radiotelemetrie bij volwassen baars liet dag- en schemerpatronen zien, maar ook duidelijke verschillen tussen eutrofe, mesotrofe en hypereutrofe meren. Een recente review bundelt de brede ecologische kennis en benadrukt variatie tussen populaties, habitat en levensfasen.',
    limitations: [
      'De veldstudies betreffen volwassen baars in specifieke Deense meren; activiteitspatronen verschilden tussen de onderzochte meren.',
      'De review omvat uiteenlopende geografische populaties en is geen directe meting van dagelijkse vangstkans.',
      'Deze bronnen rechtvaardigen geen universele voorkeursuren, vaste wind-/temperatuurgewichten of één profielcurve voor alle wateren.'
    ],
    sourceReferences: [
      'Jacobsen, L. (2002). Activity and food choice of piscivorous perch (Perca fluviatilis) in a eutrophic shallow lake: a radio-telemetry study. Freshwater Biology, 47, 2370–2379. https://doi.org/10.1046/j.1365-2427.2002.01005.x',
      'Jacobsen, L., Berg, S., Baktoft, H. & Skov, C. (2015). Behavioural strategy of large perch Perca fluviatilis varies between a mesotrophic and a hypereutrophic lake. Journal of Fish Biology, 86, 1016–1029. https://doi.org/10.1111/jfb.12613',
      'Ning, N., Barlow, C., Baumgartner, L.J. et al. (2025). A global review of the biology and ecology of the European perch, Perca fluviatilis. Reviews in Fish Biology and Fisheries, 35, 587–618. https://doi.org/10.1007/s11160-025-09924-z'
    ],
    reviewedAt: '2026-11-16',
    approvedForPrediction: false,
  },
  {
    id: 'roach-diel-diet-and-habitat-shifts-2002-2004',
    topic: 'dagritme-voedselopname-dieet-en-habitat',
    measuredOutcomes: ['feeding_intensity', 'feeding_rhythm', 'diet_composition', 'habitat_use'],
    species: ['Voorn'],
    application: 'biology',
    evidenceStrength: 'moderate',
    summary: 'In een klein mesotroof meer van circa 12 ha verschoof blankvoorn overdag naar het littoraal en at daar vooral littorale prooien; ’s nachts bevonden de vissen zich in het pelagiaal en domineerden pelagische prooien zoals Daphnia en Chaoborus. De studie rapporteerde daarnaast seizoensverschuivingen in dieet en dagritme van voedingsintensiteit; op geselecteerde dagen werden maaglediging en dieetverandering over 24 uur kwantitatief gevolgd.',
    limitations: [
      'De studie betreft één klein mesotroof meer en een specifieke prooigemeenschap; dit is geen universeel patroon voor alle Nederlandse wateren.',
      'Een dag-nachtverschuiving in habitat en dieet is niet automatisch een hogere totale voedselopname in één dagdeel of een hogere hengelvangbaarheid.',
      'De relatieve voedingsintensiteit en het belang van prooitypen verschilden per seizoen; de abstract geeft geen universeel kloktijdoptimum.'
    ],
    sourceReferences: [
      'Haertel, S.S. & Eckmann, R. (2002). Diel diet shift of roach and its implications for the estimation of daily rations. Journal of Fish Biology, 60, 876–892. https://doi.org/10.1111/j.1095-8649.2002.tb02415.x'
    ],
    reviewedAt: '2026-11-16',
    approvedForPrediction: false,
  },
  {
    id: 'roach-diel-movement-clear-turbid-lakes-2004',
    topic: 'dagritme-beweging-en-habitatgebruik',
    measuredOutcomes: ['locomotor_activity', 'habitat_use'],
    species: ['Voorn'],
    application: 'biology',
    evidenceStrength: 'moderate',
    summary: 'Radio-telemetrie volgde blankvoorns van 12–25 cm in twee ondiepe meren (helder en troebel) tijdens meerdere 48-uurs meetperioden. In beide meren was de bewegingsactiviteit doorgaans het hoogst rond dageraad en schemering en het laagst in de nacht. De middagactiviteit en ruimtelijke verdeling verschilden echter sterk met de helderheid: in het heldere meer bleven vissen overdag passief tussen waterplanten en verplaatsten zij zich ’s nachts naar het centrale meer; in het troebele meer was de verdeling overdag ruimer en lagen vissen ’s nachts dichter bij de oever.',
    limitations: [
      'De studie vergelijkt twee specifieke ondiepe meren en meerdere 48-uurs meetperioden; de patronen zijn niet universeel.',
      'De gemeten respons is radio-telemetrische beweging en habitatverdeling, geen directe voedselopname of vangstkans.',
      'Waterhelderheid en vermoedelijke predatiedruk beïnvloedden het gedrag; seizoen en lokale habitat begrenzen de overdraagbaarheid.'
    ],
    sourceReferences: [
      'Jacobsen, L., Berg, S., Jepsen, N. & Skov, C. (2004). Does roach behaviour differ between shallow lakes of different environmental state? Journal of Fish Biology, 65(1), 135–147. https://doi.org/10.1111/j.0022-1112.2004.00436.x'
    ],
    reviewedAt: '2026-11-16',
    approvedForPrediction: false,
  },
  {
    id: 'tench-nocturnal-feeding-locomotor-rhythm-2005',
    topic: 'nachtelijk-voedingsritme-en-locomotorische-activiteit',
    measuredOutcomes: ['feeding_intensity', 'feeding_rhythm', 'locomotor_activity'],
    species: ['Zeelt'],
    application: 'biology',
    evidenceStrength: 'limited',
    summary: 'Een gecontroleerde studie naar zelfgestuurde voedselopname en bewegingsritme bij zeelt vond sterk nachtelijk gedrag onder binnen- en buitencondities. Voedertijd kon het locomotorische ritme mede synchroniseren.',
    limitations: [
      'De studie gebruikte gecontroleerde voeropstellingen en is geen representatieve veldstudie van Nederlandse stekken.',
      'Nachtelijke locomotorische activiteit is niet hetzelfde als directe voedselopname in natuurlijke omstandigheden of vangbaarheid.',
      'Deze bron ondersteunt een biologische hypothese, maar geen harde vaste nachtbonus.'
    ],
    sourceReferences: [
      'Herrero, M.J., Pascual, M., Madrid, J.A. & Sánchez-Vázquez, F.J. (2005). Demand-feeding rhythms and feeding-entrainment of locomotor activity rhythms in tench (Tinca tinca). Physiology & Behavior, 84(4), 595–605. https://doi.org/10.1016/j.physbeh.2005.02.015'
    ],
    reviewedAt: '2026-11-16',
    approvedForPrediction: false,
  },

  {
    id: 'european-catfish-feeding-and-activity-rhythms-1995-2012',
    topic: 'dagritme-locomotorische-activiteit',
    measuredOutcomes: ['locomotor_activity'],
    species: ['Meerval'],
    application: 'biology',
    evidenceStrength: 'moderate',
    summary: 'Veldtelemetrie met EMG-fysiologische sensoren bij 20 Europese meervallen in de Elbe en Berounka tijdens voorjaar en zomer onderzocht activiteit in licht- en donkerperioden. De resultaten lieten site-specifieke patronen en duidelijke individuele verschillen zien; circa 35% van de individuen week af van het lokale gemeenschappelijke dagritme.',
    limitations: [
      'De gemeten EMG-respons is een maat voor spier-/bewegingsactiviteit en geen directe meting van voedselopname, prooiaanvallen of hengelvangbaarheid.',
      'De veldstudie betrof 20 gezenderde vissen in twee rivieren tijdens voorjaar en zomer; de steekproef en seizoensdekking zijn beperkt.',
      'Individuele en locatiegebonden verschillen waren substantieel; de soort mag niet als uitsluitend nachtactief worden gemodelleerd.'
    ],
    sourceReferences: [
      'Slavík, O. & Horký, P. (2012). Diel dualism in the energy consumption of the European catfish Silurus glanis. Journal of Fish Biology, 81, 2223–2234. https://doi.org/10.1111/j.1095-8649.2012.03436.x'
    ],
    reviewedAt: '2026-11-16',
    approvedForPrediction: false,
  },
  {
    id: 'adult-catfish-diel-activity-reservoir-2025',
    topic: 'seizoensafhankelijke-dagritme-beweging-en-dieptegebruik',
    measuredOutcomes: ['locomotor_activity', 'habitat_use'],
    species: ['Meerval'],
    application: 'biology',
    evidenceStrength: 'moderate',
    summary: 'Akoestische biotelemetrie volgde tien volwassen Europese meervallen in het Belver-stuwmeer aan de Taag (Portugal) van januari 2019 tot juli 2020. Accelerometers en druksensoren leverden ruim 1,3 miljoen geldige detecties voor activiteit en diepte. De activiteit vertoonde doorgaans een schemerpiek en een dagminimum, met uitzonderingen en seizoens-/individuele variatie; het dieptegebruik wisselde tussen winter en zomer.',
    limitations: [
      'De studie betreft tien volwassen vissen in één recent gekoloniseerd Portugees stuwmeer; overdracht naar Nederlandse wateren en populaties in het oorspronkelijke verspreidingsgebied is onzeker.',
      'De gemeten responsen zijn accelerometeractiviteit en dieptegebruik. Ook wanneer korte activiteitspieken mogelijk met predatie samenhangen, is geen directe voedselopname of jachtsucces gemeten.',
      'Individuele verschillen en seizoensafhankelijke omkering van verticale dag-nachtbeweging zijn substantieel; geen universele nachtelijke habitat- of voedingsclaim afleiden.'
    ],
    sourceReferences: [
      'Santos, G.S., Ribeiro, F., Pereira, E., Silva, A.F., Almeida, P.R., Ribeiro, D. & Quintella, B.R. (2025). Behaviour of the Apex Predator European Catfish (Silurus glanis) on a Recently Invaded Reservoir. Ecology of Freshwater Fish, 34(1), e12817. https://doi.org/10.1111/eff.12817'
    ],
    reviewedAt: '2026-11-16',
    approvedForPrediction: false,
  },
  {
    id: 'asp-diel-seasonal-movement-river-lake-2016-2020',
    topic: 'dagritme-seizoen-en-migratie',
    measuredOutcomes: ['locomotor_activity', 'habitat_use'],
    species: ['Roofblei'],
    application: 'biology',
    evidenceStrength: 'moderate',
    summary: 'Telemetriestudies in een rivier en een verbonden rivier-meersysteem beschrijven seizoensgebonden migratie en dag-/schemerbewegingen van roofblei. Meren werden vooral in voorjaar en zomer als foerageerhabitat gebruikt; winter- en paaibewegingen volgden andere ruimtelijke patronen.',
    limitations: [
      'De studies zijn uitgevoerd in specifieke Estse en Tsjechische riviersystemen met eigen barrières en habitatverbindingen.',
      'Migratie en locatiegebruik zijn geen directe metingen van dagelijkse voedselopname of hengelvangbaarheid.',
      'De bevindingen ondersteunen habitat- en seizoenscontext, geen vaste dagelijkse tijdvakscore voor Nederlandse wateren.'
    ],
    sourceReferences: [
      'Kärgenberg, E., Økland, F., Thalfeldt, M., Thorstad, E.B., Sandlund, O.T. & Tambets, M. (2020). Migration patterns of a potamodromous piscivore, asp (Leuciscus aspius), in a river–lake system. Journal of Fish Biology, 97, 996–1008. https://doi.org/10.1111/jfb.14454',
      'Horký, P. & Slavík, O. (2017). Diel and seasonal rhythms of asp Leuciscus aspius (L.) in a riverine environment. Ethology Ecology & Evolution, 29(5), 449–459. https://doi.org/10.1080/03949370.2016.1230560'
    ],
    reviewedAt: '2026-11-16',
    approvedForPrediction: false,
  },

  {
    id: 'common-carp-diel-grazing-food-type-2009',
    topic: 'dagritme-foerageren-en-voedseltype',
    measuredOutcomes: ['foraging_behavior', 'feeding_rhythm'],
    species: ['Karper'],
    application: 'biology',
    evidenceStrength: 'limited',
    summary: 'Een gecontroleerde studie onder gesimuleerde vijvercondities vond bij gewone karper meer graastijd overdag dan in de nacht. De verticale foerageerpositie veranderde met het beschikbare voedseltype: plankton in de waterkolom versus meer bodemgericht gedrag bij benthische ongewervelden.',
    limitations: [
      'De studie gebruikte kleine tanks met drie karpers per tank en is geen veldonderzoek in natuurlijke Nederlandse wateren.',
      'Voedselbeschikbaarheid en kunstvoer beïnvloedden het waargenomen gedrag; het patroon kan niet los van het voedselaanbod worden geïnterpreteerd.',
      'Dit ondersteunt een hypothese over dagritme en voedseltype, geen numerieke tijdvakbonus of directe vangstkans.'
    ],
    sourceReferences: [
      'Rahman, M.M. & Meyer, C.G. (2009). Effects of food type on diel behaviours of common carp Cyprinus carpio in simulated aquaculture pond conditions. Journal of Fish Biology, 74(10), 2269–2278. https://doi.org/10.1111/j.1095-8649.2009.02236.x'
    ],
    reviewedAt: '2026-11-16',
    approvedForPrediction: false,
  },
  {
    id: 'tench-field-diel-seasonal-feeding-2018',
    topic: 'dagritme-seizoen-en-voedselopname',
    measuredOutcomes: ['feeding_intensity', 'feeding_rhythm', 'diet_composition'],
    species: ['Zeelt'],
    application: 'biology',
    evidenceStrength: 'moderate',
    summary: 'Maaginhoudonderzoek van 90 zeelten in één klein, begroeid eutroof water in Perm krai (vegetatieperiode 2013; 66 maag-/darmkanalen bevatten voedsel) beschreef directe dag- en seizoensvariatie in voedselopname. Vissen werden met vaste kieuwnetten ongeveer iedere drie uur bemonsterd. De hoogste voedingsintensiteit werd gemeten tussen 18:00–21:00 en 00:00–03:00; de voedselkeuze verschilde bovendien tussen leeftijdsgroepen.',
    limitations: [
      'Het onderzoek betrof één klein, begroeid water van circa 1,9 ha in Perm krai en één vegetatieperiode (2013); slechts 66 van de 90 onderzochte vissen hadden voedsel in het spijsverteringskanaal.',
      'De vissen werden met vaste kieuwnetten ongeveer iedere drie uur bemonsterd; dit is een maaginhoud-/voedingsindex en geen continue directe observatie van individuele foerageeractiviteit.',
      'De onderzochte vissen waren 3–7+ jaar oud; voedselkeuze verschilde tussen leeftijdsgroepen, waaronder de groep van 6–7 jaar. Dit ondersteunt geen universele levensfase-onafhankelijke tijdvakvoorkeur.',
      'De vertaalde samenvattingen verschillen over de maand met de laagste consumptie-index; daarom wordt geen specifieke maandminimumclaim gebruikt.',
      'De gemeten tijdvakken mogen niet zonder lokale validatie als harde scorebonus worden gebruikt.'
    ],
    sourceReferences: [
      'Bezmaternykh, V.V. & Shcherbina, G.K. (2018). Feeding of Tench Tinca tinca (Cyprinidae) in a Small Eutrophic Water Body. Journal of Ichthyology, 58(4), 545–551. https://doi.org/10.1134/S003294521804001X'
    ],
    reviewedAt: '2026-11-16',
    approvedForPrediction: false,
  },
  {
    id: 'perch-field-diel-feeding-seasonal-diet-1986',
    topic: 'dagritme-seizoensdieet-en-prooikeuze',
    measuredOutcomes: ['feeding_intensity', 'feeding_rhythm', 'diet_composition', 'prey_selection'],
    species: ['Baars'],
    application: 'biology',
    evidenceStrength: 'limited',
    summary: 'Veldonderzoek naar baars in een klein humusrijk Fins meer beschreef seizoensverschillen in dieet en directe voedingsactiviteit. De activiteit verschoof van duidelijke ochtend- en avondpieken in mei/juni naar een middagpiek in juli/augustus; prooikeuze verschilde ook met de lengteklasse.',
    limitations: [
      'De studie betreft één klein, sterk humusrijk en zuurstofgestratificeerd meer in Zuid-Finland en één zomerperiode.',
      'De sterke grootte- en voedselbeschikbaarheidsafhankelijkheid kan niet worden vertaald naar één vast ritme voor alle baarspopulaties.',
      'De studie meet voedingsactiviteit in een specifieke ecologische context, niet hengelvangbaarheid.'
    ],
    sourceReferences: [
      'Rask, M. (1986). The diet and diel feeding activity of perch, Perca fluviatilis L., in a small lake in southern Finland. Annales Zoologici Fennici, 23, 49–56. https://www.annzool.net/PDF/anzf23/anz23-049-056.pdf'
    ],
    reviewedAt: '2026-11-16',
    approvedForPrediction: false,
  },
  {
    id: 'roach-autumnal-diel-feeding-shift-2008',
    topic: 'seizoensafhankelijk-dag-nachtritme',
    measuredOutcomes: ['feeding_intensity', 'feeding_rhythm'],
    species: ['Voorn'],
    application: 'biology',
    evidenceStrength: 'moderate',
    summary: 'Veldonderzoek in de litoraalzone van een groot boreaal meer vond bij blankvoorn in de herfst een verschuiving van dagvoeding naar schemering toen de watertemperatuur daalde van circa 20 naar 10 °C. Bij circa 5 °C bleef in de late herfst een laag maar stabiel niveau van nachtelijke voedingsactiviteit bestaan.',
    limitations: [
      'Het onderzoek vond plaats in een boreaal meer en een ondiepe, verlichte oeverzone; predatierisico, lichtregime en habitat kunnen het patroon verklaren.',
      'De relatie tussen temperatuur, licht en predatierisico is contextueel; temperatuur alleen is geen bewezen oorzaak.',
      'De waarneming rechtvaardigt geen vaste Nederlandse tijdvakbonus.'
    ],
    sourceReferences: [
      'Hautala, A. (2008). Autumnal shift from diurnal to nocturnal peaking feeding activity of Rutilus rutilus in boreal lake littoral zones. Journal of Fish Biology, 73(6), 1407–1418. https://doi.org/10.1111/j.1095-8649.2008.02020.x'
    ],
    reviewedAt: '2026-11-16',
    approvedForPrediction: false,
  },
  {
    id: 'bream-roach-in-situ-diel-zooplankton-feeding-2004',
    topic: 'dagritme-foerageren-op-zooplankton',
    measuredOutcomes: ['feeding_intensity', 'feeding_rhythm'],
    species: ['Brasem', 'Voorn'],
    application: 'biology',
    evidenceStrength: 'moderate',
    summary: 'In-situ maaginhoud- en consumptieonderzoek in het meso-eutrofe Římov-stuwmeer (Tsjechië) vond bij subadulte en volwassen brasem en blankvoorn die vrijwel uitsluitend op microcrustaceeën foerageerden een overwegend daggebonden voedingsritme met duidelijke nachtelijke daling van maagvulling. De dag-nachtverschillen werden bij blankvoorn van 200–270 mm en brasem van 220–330 mm in mei gezien; in augustus ook bij kleinere lengteklassen van circa 110–170 mm.',
    limitations: [
      'De studie onderzocht vooral foerageren op microcrustaceeën in één meso-eutroof stuwmeer; dit is niet hetzelfde als alle voedselbronnen of aasopname door hengelvis.',
      'De patronen waren afhankelijk van lengteklasse en maand; de gerapporteerde lengteklassen zijn geen directe leeftijdsindeling.',
      'De bevinding ondersteunt soort- en contextspecifieke dagritmehypothesen, maar geen universele activiteitsscore of vaste dagbonus.'
    ],
    sourceReferences: [
      'Vašek, M. & Kubečka, J. (2004). In situ diel patterns of zooplankton consumption by subadult/adult roach Rutilus rutilus, bream Abramis brama, and bleak Alburnus alburnus. Folia Zoologica, 53, 203–214. Author publication list: https://www.hbu.cas.cz/publikace/strana-7/?employeeId=651; bibliographic record: https://nas.er.usgs.gov/queries/references/ReferenceViewer.aspx?refnum=35171'
    ],
    reviewedAt: '2026-11-16',
    approvedForPrediction: false,
  },
  {
    id: 'northern-pike-field-seasonal-feeding-diet-2025',
    topic: 'seizoensdieet-en-voedingsintensiteit',
    measuredOutcomes: ['feeding_intensity', 'diet_composition'],
    species: ['Snoek'],
    application: 'biology',
    evidenceStrength: 'limited',
    summary: 'Maandelijkse maaginhoudanalyse van 133 snoeken uit een diep Anatolisch stuwmeer vond een overwegend visetend dieet, vooral zeelt en Atherina. De gemiddelde maagvullingsindex was numeriek hoger in de zomer en lager in de winter, maar de seizoensverschillen waren niet statistisch significant; de gemeten temperatuurcorrelatie was eveneens niet significant.',
    limitations: [
      'De studie betreft één diep stuwmeer in Centraal-Anatolië en een specifieke prooivisgemeenschap; dit verschilt van veel Nederlandse wateren.',
      'De seizoensverschillen in maagvulling waren niet statistisch significant en mogen niet als bewezen seizoensbonus worden geïnterpreteerd.',
      'Maaginhoud is een momentopname van voedselopname, geen directe maat voor jachtactiviteit of hengelvangbaarheid.'
    ],
    sourceReferences: [
      'Yazıcıoğlu, O., Yazıcı, R., Yağcı, A. & Yılmaz, M. (2025). Diet and feeding strategy of northern pike (Esox lucius L., 1758) inhabiting a deep dam lake in Central Anatolia, Türkiye. Folia Biologica (Kraków), 73, 92–103. https://doi.org/10.3409/fb_73-3.10'
    ],
    reviewedAt: '2026-11-16',
    approvedForPrediction: false,
  },
  {
    id: 'pikeperch-winter-spring-feeding-temperature-2020',
    topic: 'temperatuur-en-piscivore-voedselopname',
    measuredOutcomes: ['feeding_intensity', 'feeding_physiology'],
    species: ['Snoekbaars'],
    application: 'biology',
    evidenceStrength: 'limited',
    summary: 'Een gecontroleerde studie met gekweekte snoekbaarsbroedvis onderzocht voedselopname bij 4,5, 8,5 en 12,5 °C. De consumptie van prooivis nam significant toe van 4,5 naar 8,5 °C en was het hoogst bij 12,5 °C; vrouwtjes aten meer en reageerden sneller dan mannetjes.',
    limitations: [
      'Het betrof gekweekte broedvis tijdens de winter-/voorpaaiperiode en geen vrijlevende populatie in een Nederlands meer of kanaal.',
      'Sekse, prooigrootte, acclimatisatie en reproductiestatus beïnvloedden de respons.',
      'De resultaten zijn biologische context, geen overdraagbare veldcurve of numerieke hengelprognose.'
    ],
    sourceReferences: [
      'Malinovskyi, O., Blecha, M., Křišťan, J. & Policar, T. (2020). Feeding activity of pikeperch (Sander lucioperca) under winter and spring photothermal conditions of pre-spawning period. Aquaculture Research, 51(2), 852–857. https://doi.org/10.1111/are.14401'
    ],
    reviewedAt: '2026-11-16',
    approvedForPrediction: false,
  },
  {
    id: 'asp-pikeperch-ontogenetic-diet-two-reservoirs-2018',
    topic: 'levensfase-en-prooikeuze',
    measuredOutcomes: ['diet_composition', 'prey_selection'],
    species: ['Roofblei', 'Snoekbaars'],
    application: 'biology',
    evidenceStrength: 'moderate',
    summary: 'Maaginhoud- en stabiele-isotopenonderzoek in twee stuwmeren vond duidelijke levensfasegebonden dieetverschuivingen bij roofblei en snoekbaars. Kleine roofblei (<100 mm) aten vooral terrestrische en uitgekomen aquatische insecten; grotere exemplaren waren overwegend visetend. Grotere roofblei aten relatief meer cypriniden, terwijl grotere snoekbaars meer perciden consumeerde.',
    limitations: [
      'De studie betreft twee specifieke reservoirs; de prooigemeenschap en voedselbeschikbaarheid bepalen mede de waargenomen verschillen.',
      'De lengteklassen zijn geen directe leeftijdsindeling en de app kent de levensfase van de lokale populatie meestal niet.',
      'Dieet en prooikeuze zijn niet hetzelfde als dagelijkse voedingsintensiteit of vangstkans.'
    ],
    sourceReferences: [
      'Vašek, M., Eloranta, A.P., Vejříková, I. et al. (2018). Stable isotopes and gut contents indicate differential resource use by coexisting asp (Leuciscus aspius) and pikeperch (Sander lucioperca). Ecology of Freshwater Fish, 27, 1054–1065. https://doi.org/10.1111/eff.12414'
    ],
    reviewedAt: '2026-11-16',
    approvedForPrediction: false,
  },
  {
    id: 'wels-catfish-seasonal-diet-feeding-2025',
    topic: 'seizoensdieet-en-maagvulling',
    measuredOutcomes: ['feeding_intensity', 'diet_composition'],
    species: ['Meerval'],
    application: 'biology',
    evidenceStrength: 'moderate',
    summary: 'Maaginhoudonderzoek van 200 Europese meervallen uit een diep Anatolisch stuwmeer vond een breed dieet, met vis als belangrijk aandeel en zeelt als dominante prooi. De maagvullingsindex verschilde tussen seizoenen en was het hoogst in de winter en het laagst in de herfst; ook lengte en leeftijd hingen samen met dieet en maagvulling.',
    limitations: [
      'De studie betreft één diep stuwmeer in Centraal-Anatolië; de lokale prooigemeenschap verschilt van Nederlandse wateren.',
      'De auteurs bespreken mogelijke effecten van voortplanting, temperatuur, vertering en daglengte; de seizoensuitkomst is niet zonder meer causaal.',
      'Maagvulling is geen directe maat voor vangbaarheid en mag niet als vaste winterbonus worden gebruikt.'
    ],
    sourceReferences: [
      'Yazici, R., Yilmaz, M. & Yazıcıoğlu, O. (2025). Exploring Prey Selectivity and Feeding Habits of Wels Catfish (Silurus glanis L., 1758) in a Deep Anatolian Reservoir: Seasonal, Length, and Age-Dependent Diet Analysis. Aquaculture Nutrition, 2025, Article 4619857. https://doi.org/10.1155/anu/4619857'
    ],
    reviewedAt: '2026-11-16',
    approvedForPrediction: false,
  },

  {
    id: 'northern-pike-heart-rate-feeding-day-1991',
    topic: 'directe-voedselopname-en-dagactiviteit',
    measuredOutcomes: ['feeding_intensity'],
    species: ['Snoek'],
    application: 'biology',
    evidenceStrength: 'limited',
    summary: 'Hartslagtelemetrie bij vrijlevende snoek in twee Schotse meren schatte de voedselopname op circa 1,5% van het natte lichaamsgewicht per dag. Kleine prooien werden overdag gevangen; de daaropvolgende specifieke dynamische werking van voedsel (verteringsmetabolisme) liep door in middag en nacht. Dit is directe voedings-/verteringscontext, geen gekwantificeerde piek in dagelijkse voedselopname per tijdvak.',
    limitations: [
      'De telemetrieregistraties duurden maximaal vijf dagen en de studie betrof twee Schotse meren; overdraagbaarheid naar Nederlandse wateren is onzeker.',
      'De studie ondersteunt geen numerieke ochtend-, schemer- of nachtbonus en meet geen hengelvangbaarheid.',
      'Tijdstip van prooivangst moet worden onderscheiden van het latere verteringsmetabolisme.'
    ],
    sourceReferences: [
      'Lucas, M.C., Priede, I.G., Armstrong, J.D., Gindy, A.N.Z. & De Vera, L. (1991). Direct measurements of metabolism, activity and feeding behaviour of pike, Esox lucius L., in the wild, by the use of heart rate telemetry. Journal of Fish Biology, 39(3), 325–345. https://doi.org/10.1111/j.1095-8649.1991.tb04366.x'
    ],
    reviewedAt: '2026-11-16',
    approvedForPrediction: false,
  },
  {
    id: 'northern-pike-diel-movement-lac-ste-anne-1980',
    topic: 'dag-nachtritme-locomotorische-activiteit',
    measuredOutcomes: ['locomotor_activity'],
    species: ['Snoek'],
    application: 'biology',
    evidenceStrength: 'limited',
    summary: 'Ultrasone telemetrie bij zes snoeken in Lac Ste. Anne (Alberta), gevolgd gedurende 5–51 dagen, vond dat de vissen gedurende circa 80% van de observatie-intervallen inactief waren. Er was geen regelmatig dagritme in beweging behalve een sterke afname van beweging in de nacht.',
    limitations: [
      'Kleine steekproef van zes vissen in één Noord-Amerikaans meer; dit is geen universeel patroon voor Europese of Nederlandse snoek.',
      'Bewegingsactiviteit is bij een hinderlaagjager geen directe maat voor jacht- of voedingsactiviteit; stilstand kan juist bij foerageren horen.',
      'De studie rechtvaardigt geen vaste tijdvakscore of vangstbonus.'
    ],
    sourceReferences: [
      'Diana, J.S. (1980). Diel activity pattern and swimming speeds of northern pike (Esox lucius) in Lac Ste. Anne, Alberta. Canadian Journal of Fisheries and Aquatic Sciences, 37(9), 1454–1458. https://doi.org/10.1139/f80-187'
    ],
    reviewedAt: '2026-11-16',
    approvedForPrediction: false,
  },
  {
    id: 'pikeperch-diel-activity-dusk-drainage-canal-2005',
    topic: 'schemeringsritme-locomotorische-activiteit',
    measuredOutcomes: ['locomotor_activity'],
    species: ['Snoekbaars'],
    application: 'biology',
    evidenceStrength: 'moderate',
    summary: "Akoestische telemetrie volgde volwassen snoekbaars in het ondiepe, sterk troebele Fumemorte-kanaal in de Rhône-delta. Van 13 getagde vissen werden er 9 succesvol gevolgd tijdens maandelijkse 24-uursessies van maart tot juni 2002, met positiebepaling om de twee uur. Beide seksen vertoonden gemiddeld de hoogste bewegingsactiviteit rond de avondschemering; de individuele patronen verschilden en bij vrouwtjes hing het dagritme samen met watertemperatuur.",
    limitations: [
      'Het onderzoek betrof uitsluitend volwassen snoekbaars in één ondiep Zuid-Frans kanaal tijdens de paaiperiode in het voorjaar; dit is geen jaar-rond of Nederlands populatieprofiel.',
      'Van de 13 getagde vissen werden 9 succesvol gevolgd. De posities werden om de twee uur bepaald; de berekende verplaatsing is een minimale afstand en onderschat werkelijke beweging.',
      'De gemeten uitkomst is verplaatsing, niet rechtstreeks voedselopname, jachtsucces of vangstkans.',
      'Individuele dagritmes verschilden; schemering was een gemiddelde tendens en geen strikte regel.',
    ],
    sourceReferences: [
      'Poulet, N., Arzel, C., Messad, S., Lek, S. & Argillier, C. (2005). Diel activity of adult pikeperch Sander lucioperca (L.) in a drainage canal in the Mediterranean basin during spring. Hydrobiologia, 543, 79–90. https://doi.org/10.1007/s10750-004-6823-6'
    ],
    reviewedAt: '2026-11-17',
    approvedForPrediction: false,
  },
  {
    id: 'pikeperch-diel-distribution-elbe-river-2008',
    topic: 'dag-nachtverdeling-en-locomotorische-activiteit',
    measuredOutcomes: ['locomotor_activity', 'habitat_use'],
    species: ['Snoekbaars'],
    application: 'biology',
    evidenceStrength: 'moderate',
    summary: "Radio-telemetrie volgde 8 volwassen snoekbaarzen in de Elbe gedurende 12 maanden. In totaal werden 47 volledige 24-uurscycli geregistreerd, met positiebepaling per circa drie uur. Overdag verbleven de vissen vooral in dieper water van het hoofdkanaal, tijdens dageraad/schemering verplaatsten zij zich naar ondieper water en 's nachts lagen zij in de ondiepe oeverzone. De gemeten verplaatsingsactiviteit piekte significant tijdens beide schemerperioden en was het laagst in de nacht.",
    limitations: [
      'De studie volgde 8 volwassen vissen in één gereguleerde rivier; andere watertypen, populaties en levensfasen kunnen afwijken.',
      'De 47 24-uurscycli met posities per circa drie uur beschrijven ruimtelijke verplaatsing en habitatgebruik, niet de volledige continue activiteit.',
      'De gemeten uitkomst is locomotorische activiteit/habitatpositie, geen directe voedselopname, prooiaanval of hengelvangbaarheid.',
      'De auteurs interpreteren de nachtelijke ondiepe positie waarschijnlijk als rust en niet als bewijs van nachtelijke jacht.',
    ],
    sourceReferences: [
      'Horký, P., Slavík, O. & Bartoš, L. (2008). A telemetry study on the diurnal distribution and activity of adult pikeperch, Sander lucioperca (L.), in a riverine environment. Hydrobiologia, 614, 151–157. https://doi.org/10.1007/s10750-008-9503-0'
    ],
    reviewedAt: '2026-11-17',
    approvedForPrediction: false,
  },
  {
    id: 'asp-annual-diel-activity-northern-population-2022',
    topic: 'seizoensafhankelijk-dag-nachtritme-locomotorische-activiteit',
    measuredOutcomes: ['locomotor_activity', 'habitat_use'],
    species: ['Roofblei'],
    application: 'biology',
    evidenceStrength: 'moderate',
    summary: 'Een 32 maanden durende akoestische telemetriestudie van 53 volwassen roofbleien in een noordelijk meer-riviersysteem analyseerde 12.435 bewegingsgebeurtenissen. Bewegingsactiviteit was in de meeste maanden hoger rond dageraad en schemering dan overdag of ’s nachts, maar het patroon wisselde tussen maanden en jaren; in sommige zomermaanden ontbrak een duidelijk dagritme.',
    limitations: [
      'De studie betreft één noordelijke, aaneengesloten meer-rivierpopulatie; de sterke migratie- en stromingscontext is niet zonder meer overdraagbaar naar geïsoleerde Nederlandse plassen.',
      'De uitkomst is locomotorische activiteit/verplaatsing, geen direct gemeten voedselopname of vangstkans.',
      'Seizoens- en jaarvariatie zijn substantieel; een vaste dagelijkse schemerbonus is niet gerechtvaardigd.'
    ],
    sourceReferences: [
      'Kärgenberg, E., Sandlund, O.T., Thorstad, E.B., Thalfeldt, M., Økland, F., Kaasik, A. & Tambets, M. (2022). Annual and diel activity cycles of a northern population of the large migratory cyprinid fish asp (Leuciscus aspius). Environmental Biology of Fishes, 105, 1697–1711. https://doi.org/10.1007/s10641-022-01298-6'
    ],
    reviewedAt: '2026-11-16',
    approvedForPrediction: false,
  },

  {
    id: 'pike-juvenile-feeding-rhythm-first-year-1998', topic: 'levensfasegebonden-dagritme-en-voedselopname', measuredOutcomes: ['feeding_intensity', 'feeding_rhythm'], species: ['Snoek'], application: 'biology', evidenceStrength: 'limited',
    summary: 'Onderzoek naar jonge snoek in het eerste levensjaar beschreef dagactieve jacht in de planktivore, insectivore en piscivore ontwikkelingsstadia. In de planktivore fase was het voedingsritme duidelijk bifasisch. Het patroon is expliciet levensfase- en dieetstadiumgebonden.',
    limitations: ['De studie betreft uitsluitend jonge snoek jonger dan één jaar; dit patroon mag niet als volwassen snoekprofiel worden toegepast.','De voedingsfasen hangen samen met de overgang van plankton naar insecten en vis; de app vraagt niet standaard om levensfase of dieetstadium.','De studie levert geen gevalideerde numerieke tijdvakgewichten voor Nederlandse hengelwateren.'],
    sourceReferences: ['Coimbra, J.C., Pinto, I.D., Wurdig, N.L. & Do Carmo, D. (1998). Feeding rhythm and gastric emptying in the pike (Esox lucius L.) during the feeding changes below one year of age. Annales de Limnologie, 34(1), 107–116. https://www.limnology-journal.org/articles/limn/pdf/1998/01/limno19981p107.pdf'], reviewedAt: '2026-11-16', approvedForPrediction: false,
  },
  {
    id: 'pike-dusk-habitat-change-visibility-2012', topic: 'schemeringsafhankelijk-habitatwisselen-en-zicht', measuredOutcomes: ['locomotor_activity', 'habitat_use'], species: ['Snoek'], application: 'biology', evidenceStrength: 'moderate',
    summary: 'Een gecontroleerde studie vond bij snoek de meeste habitatwisselingen tijdens de schemering. Troebel water verminderde de voorkeur voor complex habitat. De proef vond plaats zonder prooien en soortgenoten, zodat het een routine-/habitatrespons meet en geen directe jacht- of voedselopnamepiek.',
    limitations: ['De proef vond plaats onder gecontroleerde omstandigheden en zonder prooien of soortgenoten; natuurlijke jachtinteracties ontbraken.','Habitatwisselen is geen directe maat voor voedselopname, vangstkans of de aanwezigheid van prooivis.','De uitkomst ondersteunt contextafhankelijke schemeringsbeweging, niet een universele schemerbonus.'],
    sourceReferences: ['Nilsson, P.A., Baktoft, H., Boel, M., Meier, K., Jacobsen, L., Rokkjær, E.M., Clausen, T. & Skov, C. (2012). Visibility conditions and diel period affect small-scale spatio-temporal behaviour of pike Esox lucius in the absence of prey and conspecifics. Journal of Fish Biology, 80(6), 2384–2389. https://doi.org/10.1111/j.1095-8649.2012.03284.x'], reviewedAt: '2026-11-16', approvedForPrediction: false,
  },
  {
    id: 'pikeperch-lake-ladoga-daily-feeding-rhythm-1982', topic: 'seizoensafhankelijk-dagritme-voedselopname', measuredOutcomes: ['feeding_intensity', 'feeding_rhythm'], species: ['Snoekbaars'], application: 'biology', evidenceStrength: 'limited',
    summary: 'Maaginhoud-/voedingsritmeonderzoek in het groeiseizoen van snoekbaars in het Ladogameer vond één dagelijkse voedingspiek in de vroege ochtend van juni tot en met augustus. In september werd een tweede avondpiek beschreven. De auteurs koppelden dit aan lichtomstandigheden en de dagelijkse verspreiding van prooivissen.',
    limitations: ['De studie betreft één groot Russisch meer en een specifieke vegetatie-/groeiperiode; de uitkomst is niet zonder meer overdraagbaar op Nederlandse plassen of kanalen.','De voedingspiek verschoof tussen maanden; één vaste ochtend-, avond- of nachtvoorkeur is niet gerechtvaardigd.','De reproductieperiode ging samen met lage voedselopname; voortplantingsstatus en prooibeschikbaarheid zijn niet bekend in de app.','De beschikbare metadata en samenvatting zijn secundair ontsloten; exacte steekproefomvang en methodedetails moeten bij hergebruik van de volledige oorspronkelijke publicatie opnieuw worden gecontroleerd.'],
    sourceReferences: ['Fedorova, G.V. & Drozzhina, K.S. (1982). Daily feeding rhythm of pike-perch, Stizostedion lucioperca, and perch, Perca fluviatilis, from Lake Ladoga. Journal of Ichthyology, 22(2), 52–60 (translated from Voprosy Ikhtiologii 22(2), 224–232).'], reviewedAt: '2026-11-16', approvedForPrediction: false,
  },
  {
    id: 'perch-lake-ladoga-diel-feeding-1982',
    topic: 'seizoensafhankelijke-voedselopname-en-dagritme',
    measuredOutcomes: ['feeding_intensity', 'feeding_rhythm'],
    species: ['Baars'],
    application: 'biology',
    evidenceStrength: 'limited',
    summary: 'Maaginhoud-/voedingsritmeonderzoek in het groeiseizoen van het Ladogameer beschreef actieve voedselopname door baars van juni tot september. De hoogste consumptie werd in juli en de laagste in september gevonden. Er waren geen uitgesproken vaste dagelijkse pieken; de voedselopname was relatief sterker tijdens schemeruren, mede door het dagelijkse gedrag van de prooivissen.',
    limitations: [
      'De studie betreft één groot Russisch meer en een specifieke vegetatie-/groeiperiode; overdraagbaarheid naar Nederlandse plassen of kanalen is onzeker.',
      'De auteurs vonden geen duidelijke vaste dagelijkse pieken voor baars; de schemerwaarneming is relatief en gekoppeld aan prooigedrag.',
      'De beschikbare metadata en samenvatting zijn secundair ontsloten; exacte steekproefomvang en methodedetails moeten bij gebruik van de volledige oorspronkelijke publicatie opnieuw worden gecontroleerd.',
      'De bron ondersteunt geen universele schemerbonus of vaste tijdvakscore.'
    ],
    sourceReferences: [
      'Fedorova, G.V. & Drozzhina, K.S. (1982). Daily feeding rhythm of pike-perch, Stizostedion lucioperca, and perch, Perca fluviatilis, from Lake Ladoga. Journal of Ichthyology, 22(2), 52–60 (translated from Voprosy Ikhtiologii 22(2), 224–232).'
    ],
    reviewedAt: '2026-11-16',
    approvedForPrediction: false,
  },
  {
    id: 'roach-bream-diel-zooplankton-feeding-2004',
    topic: 'dag-nachtritme-directe-voedselopname',
    measuredOutcomes: ['feeding_intensity', 'feeding_rhythm'],
    species: ['Voorn', 'Brasem'],
    application: 'biology',
    evidenceStrength: 'moderate',
    summary: 'In-situ maaginhoudonderzoek in het Římov-reservoir vond bij subadulte en volwassen blankvoorn en brasem die vrijwel uitsluitend op microcrustaceeën foerageerden een overwegend dagactief zoöplankton-voedingspatroon; maagvulling nam ’s nachts duidelijk af. Het effect werd in specifieke lengteklassen en maanden waargenomen.',
    limitations: [
      'De uitkomst geldt voor vis die in dit reservoir vrijwel uitsluitend op plankton foerageerde; andere voedseltypen en habitats kunnen een ander ritme opleveren.',
      'De steekproef en seizoensdekking zijn beperkt tot specifieke maanden en lengteklassen; leeftijd, grootte, prooiaanbod en licht beïnvloeden het patroon.',
      'Dit resultaat is niet universeel: ander veldonderzoek bij jonge blankvoorn en brasem vond juist nachtelijke pelagische aanwezigheid en nachtelijke voedselopname.',
      'De studie ondersteunt contextafhankelijke voedingsritmes, maar geen vaste dagbonus of tijdvakscore voor Nederlandse stekken.'
    ],
    sourceReferences: [
      'Vasek, M. & Kubecka, J. (2004). In situ diel patterns of zooplankton consumption by subadult/adult roach Rutilus rutilus, bream Abramis brama, and bleak Alburnus alburnus. Folia Zoologica, 53(2), 203–214.'
    ],
    reviewedAt: '2026-11-16',
    approvedForPrediction: false,
  },
  {
    id: 'juvenile-cyprinid-night-feeding-bavarian-lakes-1979',
    topic: 'levensfasegebonden-nachtelijke-pelagische-voedselopname',
    measuredOutcomes: ['feeding_intensity', 'feeding_rhythm', 'habitat_use'],
    species: ['Voorn', 'Brasem'],
    application: 'biology',
    evidenceStrength: 'moderate',
    summary: 'Twee jaar echoloodonderzoek en maaginhoudanalyse in kleine Beierse meren beschreef bij juveniele blankvoorn en brasem (naast ruisvoorn en alver) nachtelijke pelagische aanwezigheid en voedselopname vóór middernacht, met de hoogste voedingsintensiteit vóór middernacht. De verticale positie hing samen met watertransparantie en lichtintensiteit. In de winter werd geen periodieke migratie of voeding waargenomen.',
    limitations: [
      'De resultaten betreffen juveniele vissen en mogen niet worden samengevoegd met het volwassen/subadulte dagvoedingspatroon uit het Římov-reservoir.',
      'De studie beschrijft vooral nachtelijke pelagische migratie en plankton-/pelagische voedselopname; dit is geen bewijs voor nachtelijke bodemvoeding of hengelvangbaarheid op iedere stek.',
      'De waarnemingen komen uit kleine Beierse meren; seizoen, lichttransparantie, prooiaanbod en habitat begrenzen de overdraagbaarheid naar Nederlandse wateren.',
      'De bron ondersteunt een levensfase- en habitatgebonden nachtelijke voedingscontext, geen universele nachtbonus.'
    ],
    sourceReferences: [
      'Bohl, E. (1979). Diel pattern of pelagic distribution and feeding in planktivorous fish. Oecologia, 44(3), 368–375. https://doi.org/10.1007/BF00545241'
    ],
    reviewedAt: '2026-11-16',
    approvedForPrediction: false,
  },
  {
    id: 'roach-diel-feeding-cycle-lake-aydat-1990',
    topic: 'leeftijdsafhankelijk-dag-nachtritme-voedselopname',
    measuredOutcomes: ['feeding_intensity', 'feeding_rhythm'],
    species: ['Voorn'],
    application: 'biology',
    evidenceStrength: 'moderate',
    summary: 'Maaginhoudonderzoek bemonsterde 253 blankvoorns van 98–240 mm met intervallen van vier uur op 20–21 juli 1988 in het Franse Lac Aydat. Twee- en driejarige vissen voedden vooral vanaf 14:00 tot de schemering en selecteerden Cladocera; oudere vissen aten zowel overdag als ’s nachts met variabele intensiteit en periodiciteit en hadden een gemengder dieet.',
    limitations: [
      'De studie bemonsterde één meer gedurende twee zomerdagen; dit is beperkte temporele en geografische dekking.',
      'Leeftijdsgroepen verschilden in zowel timing als dieet; jongere vissen aten vooral zoöplankton en oudere vissen macrophyten, sediment en chironomiden.',
      'De aanwezigheid van baars in het bemonsteringsgebied werd als mogelijke contextfactor besproken.',
      'De app kent de leeftijd en het actuele dieet van de lokale blankvoorn meestal niet; geen vaste schemerbonus toepassen.'
    ],
    sourceReferences: [
      'Jamet, J.L., Gres, P., Lair, N. & Lasserre, G. (1990). Diel feeding cycle of roach (Rutilus rutilus, L.) in eutrophic Lake Aydat (Massif Central, France). Archiv für Hydrobiologie, 118(3), 371–382. https://doi.org/10.1127/archiv-hydrobiol/118/1990/371'
    ],
    reviewedAt: '2026-11-16',
    approvedForPrediction: false,
  },
  {
    id: 'perch-diel-feeding-lake-constance-2021',
    topic: 'seizoensgebonden-dagritme-directe-voedselopname',
    measuredOutcomes: ['feeding_intensity', 'feeding_rhythm'],
    species: ['Baars'],
    application: 'biology',
    evidenceStrength: 'moderate',
    summary: 'Een veldstudie in het pelagische deel van de Obersee (Bodenmeer) onderzocht onder meer juveniele 0+ baars. In de 24-uursanalyse van de herfst vertoonde baars maaginhoud-/voedingspieken rond dageraad en schemering, met een duidelijke afname na 21:00 en een minimum kort voor zonsopkomst. Dit is een seizoens- en levensfasegebonden pelagische waarneming.',
    limitations: [
      'De 24-uursanalyse is gebaseerd op herfstgegevens uit 2018; de studie onderzocht juveniele 0+ baars en de uitkomst mag niet worden toegepast op volwassen baars.',
      'Het betreft het pelagische habitat van één groot, diep meer met een specifieke prooigemeenschap en aanwezigheid van invasieve driedoornige stekelbaars.',
      'Maaginhoud en maagvulling zijn proxies voor recente voedselopname, niet een directe maat voor totale dagelijkse consumptie of hengelvangbaarheid.',
      'De auteurs gebruikten verschillende vangstmethoden overdag en ’s nachts; mogelijke verschillen in vangbaarheid zijn een methodische beperking.',
      'De uitkomst mag niet worden vertaald naar een universele schemerbonus of naar alle baarsstekken; prooiaanbod en habitat zijn bepalend.'
    ],
    sourceReferences: [
      'Bretzel, J.B. et al. (2021). Feeding Ecology of Invasive Three-Spined Stickleback (Gasterosteus aculeatus) in Relation to Native Juvenile Eurasian Perch (Perca fluviatilis) in the Pelagic Zone of Upper Lake Constance. Frontiers in Environmental Science, 9. https://doi.org/10.3389/fenvs.2021.670125 (juveniele 0+ baars; 24-uursanalyse herfst 2018)'
    ],
    reviewedAt: '2026-11-16',
    approvedForPrediction: false,
  },
  {
    id: 'european-catfish-diel-feeding-self-feeder-1995',
    topic: 'gecontroleerd-dagritme-voedselopname',
    measuredOutcomes: ['feeding_intensity', 'feeding_rhythm'],
    species: ['Meerval'],
    application: 'biology',
    evidenceStrength: 'limited',
    summary: 'Een gecontroleerde voedingsstudie met Europese meerval in individuele en groepshuisvesting en met vrije of tijdsbeperkte toegang tot zelfvoerautomaten rapporteerde sterk nachtelijke voedselopname. Bij overdag voeren nam de vrijwillige opname af; na terugkeer naar vrije toegang hernam het nachtelijke patroon binnen 24 uur. Individueel gehouden vissen konden een minder regelmatig/aritmisch patroon vertonen.',
    limitations: [
      'De studie betreft een gecontroleerde zelfvoeropstelling en geen veldmeting van natuurlijke jacht of voedselopname in Nederlandse wateren.',
      'Levensfase, lichaamslengte/gewicht, seizoen, watertype en exacte temperatuurcontext zijn niet uit de beschikbare abstract vastgesteld.',
      'Sociale context was relevant: individueel gehouden vissen vertoonden vaker een aritmisch patroon dan vissen in groepen.',
      'Een nachtelijk voerautomaatritme is geen directe maat voor natuurlijke prooiaanvallen, habitatbezetting of hengelvangbaarheid.'
    ],
    sourceReferences: [
      'Boujard, T. (1995). Diel rhythms of feeding activity in the European catfish, Silurus glanis. Physiology & Behavior, 58(4), 641–645. https://doi.org/10.1016/0031-9384(95)00109-V'
    ],
    reviewedAt: '2026-11-16',
    approvedForPrediction: false,
  },
  {
    id: 'juvenile-catfish-night-foraging-reservoirs-2025',
    topic: 'levensfasegebonden-nachtelijke-voedselopname',
    measuredOutcomes: ['feeding_intensity', 'feeding_rhythm', 'foraging_behavior', 'habitat_use'],
    species: ['Meerval'],
    application: 'biology',
    evidenceStrength: 'moderate',
    summary: 'Veldonderzoek in drie Tsjechische reservoirs bevestigde nachtelijke pelagische aanwezigheid en voedselopname bij vroege juveniele Europese meerval; maaginhoud bestond uit Chaoborus-larven. De juvenielen werden vooral op 2–4 m diepte aangetroffen.',
    limitations: [
      'De bevinding geldt specifiek voor vroege juvenielen, niet voor volwassen meerval.',
      'Het betreft drie reservoirs en een pelagische juveniele prooi-/habitatcontext; dit is niet automatisch representatief voor Nederlandse oevers of bodemvisserij.',
      'Nachtelijke aanwezigheid en voedselopname in dit levensstadium geven geen universele nachtbonus voor de soort.'
    ],
    sourceReferences: [
      'Sajdlová, Z., Jůza, T., Blabolil, P., Draštík, V. & Čech, M. (2025). Pelagic distribution and night foraging of early juvenile European catfish (Silurus glanis L.). Journal of Fish Biology, 106(6), 1893–1898. https://doi.org/10.1111/jfb.16072'
    ],
    reviewedAt: '2026-11-16',
    approvedForPrediction: false,
  },
];

/**
 * Zoekt alle registraties die betrekking hebben op een bepaald onderwerp.
 */
export function getResearchByTopic(
  topic: string
): ResearchRegistryEntry[] {
  const normalizedTopic = topic.trim().toLowerCase();

  return RESEARCH_REGISTRY.filter(
    (entry) => entry.topic.trim().toLowerCase() === normalizedTopic
  );
}

/**
 * Zoekt kennis die relevant is voor een specifieke vissoort.
 *
 * Registraties zonder specifieke soortkoppeling worden ook teruggegeven,
 * omdat deze algemene kennis kunnen bevatten.
 */
export function getResearchBySpecies(
  species: string
): ResearchRegistryEntry[] {
  const normalizedSpecies = species.trim().toLowerCase();

  return RESEARCH_REGISTRY.filter((entry) => {
    if (entry.species.length === 0) {
      return true;
    }

    return entry.species.some(
      (entrySpecies) =>
        entrySpecies.trim().toLowerCase() === normalizedSpecies
    );
  });
}

/**
 * Zoekt alleen bronnen waarvan het gemeten resultaat expliciet is geclassificeerd.
 * Dit is een literatuurfilter, geen vrijgave als voorspellingsfactor.
 */
export function getResearchByOutcome(
  species: string,
  outcome: ResearchOutcome
): ResearchRegistryEntry[] {
  const normalizedSpecies = species.trim().toLowerCase();
  return RESEARCH_REGISTRY.filter((entry) => {
    const appliesToSpecies = entry.species.length === 0 || entry.species.some(
      (entrySpecies) => entrySpecies.trim().toLowerCase() === normalizedSpecies
    );
    return appliesToSpecies && entry.measuredOutcomes?.includes(outcome) === true;
  });
}

/**
 * Controleert of een kennisregistratie daadwerkelijk is goedgekeurd voor
 * directe toepassing in een prognosemodel.
 *
 * Alleen 'strong' en 'moderate' onderbouwing kunnen in aanmerking komen.
 * De expliciete goedkeuring blijft altijd vereist.
 */
export function isApprovedPredictionKnowledge(
  entry: ResearchRegistryEntry
): boolean {
  if (!entry.approvedForPrediction) {
    return false;
  }

  return (
    entry.evidenceStrength === 'strong' ||
    entry.evidenceStrength === 'moderate'
  );
}

/**
 * Beschrijft de herkomst/status van gegevens die in een analyse worden
 * gebruikt.
 *
 * Dit type wordt in volgende Fase 1-stappen gebruikt om duidelijk te maken
 * of informatie gemeten, voorspeld of door een model geschat is.
 */
export interface DataProvenance {
  status: DataStatus;
  description: string;
  source?: string;
}
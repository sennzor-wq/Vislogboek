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
  | 'feeding_incidence'
  | 'feeding_rhythm'
  | 'foraging_behavior'
  | 'diet_composition'
  | 'prey_selection'
  | 'locomotor_activity'
  | 'habitat_use'
  | 'growth'
  | 'feeding_physiology'
  | 'metabolic_rate'
  | 'aerobic_scope'
  | 'angler_catch_distribution'
  | 'angler_catch_rate'
  | 'angler_vulnerability';

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
    summary: 'Volledige primaire studie: respirometrie bij 120 Europese baarzen van 5–882 g bij acclimatisatie op 15, 20, 25 en 28 °C; daarnaast temperatuurkeuze bij 37 kleinere baarzen van 3–74 g. Aerobe-scopeoptimum daalde met lichaamsmassa bij de gemodelleerde klassen 40–640 g; onder 40 g werd geen daling/optimum gevonden. Temperatuurvoorkeur is apart gemeten en daalde eveneens met lichaamsmassa.',
    limitations: [
      'De relatie is lichaamsgrootte-afhankelijk: voor de gemodelleerde klassen 40–640 g daalde het aerobe-scopeoptimum met massa; bij de klassen onder 40 g werd geen optimum gevonden omdat aerobe scope niet afnam binnen het onderzochte bereik.',
      'De 37 vissen in de shuttle-box (3–74 g) leverden een aparte temperatuurvoorkeurmeting; die uitkomst mag niet worden verward met de aerobe-scopecurve uit respirometrie.',
      'Het onderzoek vond plaats onder gecontroleerde laboratoriumomstandigheden en meet fysiologische capaciteit, niet rechtstreeks dagelijkse voedingsactiviteit of hengelvangbaarheid.',
      'De resultaten zijn een mechanistische prior, geen directe validatie van de bestaande Vislogboek-curve voor Nederlandse wateren.'
    ],
    sourceReferences: [
      'Christensen, E.A.F., Svendsen, M.B.S. & Steffensen, J.F. (2020). The combined effect of body size and temperature on oxygen consumption rates and the size-dependency of preferred temperature in European perch Perca fluviatilis. Journal of Fish Biology, 97(3), 794–803. https://doi.org/10.1111/jfb.14435'
    ],
    reviewedAt: '2026-11-17',
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
    summary: 'Volledige primaire studie: 70 volwassen kweek-snoekbaarzen verdeeld over temperatuurbehandelingen; zes bruikbare meetgroepen van 13–28 °C, na minimaal drie weken acclimatisatie. De berekende maximale aerobe scope lag bij 18,8 °C en het afgeleide 80%-bereik bij 10,4–26,9 °C. Belangrijke nuance: er was geen statistisch significant verschil in aerobe scope tussen 13 en 25 °C; bij 28 °C resteerden slechts drie complete dieren. Juveniele groeitemperaturen zijn hoger dan die van adulten.',
    limitations: [
      'De vissen kwamen uit een commerciële kweekfaciliteit en werden in aquacultuurtanks onderzocht; overdracht naar vrijlevende Nederlandse populaties is onzeker. De dieren acclimatiseerden minimaal drie weken, kregen 24 uur per dag dimlicht en werden voorafgaand aan de respirometrie minimaal drie dagen gevast.',
      'Hoewel het afgeleide modelmaximum 18,8 °C is, was aerobe scope niet significant verschillend tussen 13 en 25 °C. De 28 °C-groep leverde slechts drie complete metingen; bij 31 °C overleefde geen dier het volledige protocol.',
      'Het optimum betreft aerobe scope, niet een gemeten optimum voor foerageren, jachtactiviteit of hengelvangbaarheid.',
      'De bron laat zien dat levensfase belangrijk is; de app kent die meestal niet en mag de volwassen curve niet als universeel soortoptimum presenteren.'
    ],
    sourceReferences: [
      'Frisk, M., Skov, P.V. & Steffensen, J.F. (2012). Thermal optimum for pikeperch (Sander lucioperca) and the use of ventilation frequency as a predictor of metabolic rate. Aquaculture, 324–325, 151–157. https://doi.org/10.1016/j.aquaculture.2011.10.024'
    ],
    reviewedAt: '2026-11-17',
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
    id: 'adult-catfish-northern-fringe-seasonal-diel-movement-2024',
    topic: 'seizoensgebonden-dagritme-en-dieptegebruik-noordelijke-meervalpopulatie',
    measuredOutcomes: ['locomotor_activity', 'habitat_use'],
    species: ['Meerval'],
    application: 'biology',
    evidenceStrength: 'moderate',
    summary: 'Een veldstudie in het Zweedse Möckelnmeer volgde volwassen Europese meerval aan dataloggers. Van 55 gemerkte dieren werden 15 loggers teruggevonden; 11 bevatten langdurige hoogfrequente gedragsgegevens. Dieptemeting per minuut en temperatuurmeting per vijf minuten lieten seizoensafhankelijk verticaal gedrag zien: in februari–maart en juli–oktober was activiteit vaker hoger in de nacht, in april–juni was er geen dag-nachtverschil en in december–januari was de activiteit zeer laag. Van juli tot oktober stegen de vissen rond schemering van de bodem naar de bovenste waterlaag en keerden rond dageraad terug.',
    limitations: [
      'De studie betreft één geïsoleerde, genetisch onderscheiden noordelijke Zweedse populatie; de patronen zijn niet rechtstreeks overdraagbaar op Midden-/Zuid-Europese of Nederlandse meervalpopulaties.',
      'Hoewel 55 volwassen dieren werden gemerkt, leverden 15 teruggevonden loggers bruikbare data en hadden 11 loggers langdurige hoogfrequente gegevens.',
      'De sensoren maten diepte, temperatuur en daaruit afgeleide verticale beweging. Dit is locomotorisch-/habitatbewijs, geen directe meting van voedselopname, aascontact of vangbaarheid.',
      'De auteurs interpreteren het nachtelijke verticale gedrag in warme maanden als waarschijnlijk foerageren, maar dit blijft een gedragsinterpretatie en geen gemeten voedingsritme.'
    ],
    sourceReferences: [
      'Bergström, K., Berggren, H., Nordahl, O., Koch-Schmidt, P., Tibblin, P. & Larsson, P. (2024). Seasonal and Daily Movement Patterns by Wels Catfish (Silurus glanis) at the Northern Fringe of Its Distribution Range. Fishes, 9(7), 280. https://doi.org/10.3390/fishes9070280'
    ],
    reviewedAt: '2026-11-18',
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
    id: 'common-carp-adult-bait-site-night-feeding-2018',
    topic: 'adult-wild-carp-feeding-at-bait-site',
    measuredOutcomes: ['feeding_intensity', 'feeding_rhythm', 'foraging_behavior', 'habitat_use'],
    species: ['Karper'],
    application: 'biology',
    evidenceStrength: 'limited',
    summary: 'In Lake Steiger (67 ha) werden 30 volwassen karpers met radiozenders gevolgd. Na een zevendaagse voorperiode werd zeven dagen met maïs gevoerd; zakken met 25 kg voer werden iedere zes uur gewogen om consumptie te meten. Het nachtelijke voerbezoek en de gemeten consumptie namen sterk toe; tegen dag zeven was de nachtelijke consumptie ongeveer tienmaal de dagwaarde. Dit is directe veldmeting van voedselopname bij een kunstmatig bijgevoerd punt.',
    limitations: [
      'De studie vond plaats in één meer in Minnesota met één kunstmatig bijgevoerd punt; dit is geen meting van natuurlijk foerageren over het gehele meer.',
      'Het onderzoek gebruikte maïs en een korte baiting-periode van zeven dagen na een zevendaagse voorperiode; overdracht naar pellets, andere aassoorten, Nederlandse wateren en andere seizoenen is onzeker.',
      'De voedselconsumptie bestond uit enkele opgetelde meetwaarden en werd door de auteurs descriptief weergegeven, zonder formele statistische toetsing van die consumptiereeks.',
      'De bron ondersteunt een contextgebonden nachtelijk voedingssignaal bij volwassen wilde karper op een bijgevoerd punt, geen universele nachtbonus of numerieke tijdvakfactor.'
    ],
    sourceReferences: [
      'Ghosal, R., Eichmiller, J.J., Witthuhn, B.A. & Sorensen, P.W. (2018). Attracting Common Carp to a bait site with food reveals strong positive relationships between fish density, feeding activity, environmental DNA, and sex pheromone release that could be used in invasive fish management. Ecology and Evolution, 8(13), 6714–6727. https://doi.org/10.1002/ece3.4169'
    ],
    reviewedAt: '2026-11-18',
    approvedForPrediction: false,
  },
  {
    id: 'common-carp-bait-encounter-angling-vulnerability-2017',
    topic: 'aasontmoeting-en-hengelvangbaarheid',
    measuredOutcomes: ['foraging_behavior', 'habitat_use', 'angler_vulnerability'],
    species: ['Karper', 'Zeelt'],
    application: 'prognosis',
    evidenceStrength: 'moderate',
    summary: 'Whole-lake akoestische telemetrie in een meer van 25 ha onderzocht bij karper en zeelt onder meer zwemafstand, activiteitsruimte, tijd op bijgevoerd aas en wisselen tussen voerlocaties. Daarna werd op vaste bijgevoerd-locaties gevist. De vissen bezochten het aas, maar de gemeten ontmoetings-/bewegingskenmerken verklaarden de individuele verschillen in hengelvangbaarheid niet significant. De auteurs wijzen erop dat gedrag ná het ontmoeten van aas, zoals daadwerkelijke opname, bepalend kan zijn.',
    limitations: [
      'De studie betreft één meer, twee benthivore soorten en een specifieke experimentele opzet met vaste bijgevoerd-locaties; dit is geen universele maat voor vangbaarheid.',
      'De onderzochte ontmoetingskenmerken voorspelden de individuele vangbaarheid niet significant; aanwezigheid of bezoek aan aas mag dus niet gelijkgesteld worden aan een aanbeet of vangst.',
      'De frequentie van daadwerkelijke aasopname na ontmoeting werd niet rechtstreeks als verklarende gedragsvariabele gemeten.',
      'De studie levert geen dagritmebonus of directe tijdvakvoorkeur op; zij ondersteunt juist de scheiding tussen aanwezigheid, voedselopname en vangbaarheid.'
    ],
    sourceReferences: [
      'Monk, C.T. & Arlinghaus, R. (2017). Encountering a bait is necessary but insufficient to explain individual variability in vulnerability to angling in two freshwater benthivorous fish in the wild. PLOS ONE, 12(3), e0173989. https://doi.org/10.1371/journal.pone.0173989'
    ],
    reviewedAt: '2026-11-18',
    approvedForPrediction: false,
  },
  {
    id: 'common-carp-wild-night-feeding-lake-2010',
    topic: 'wild-diel-feeding-and-food-search',
    measuredOutcomes: ['feeding_intensity', 'feeding_rhythm', 'foraging_behavior', 'habitat_use'],
    species: ['Karper'],
    application: 'biology',
    evidenceStrength: 'moderate',
    summary: 'Veldonderzoek aan vrijlevende karpers in een meer in Minnesota combineerde een vijfdaagse meting van maïconsumptie per twee uur met telemetrie van 34 karpers. De gemeten consumptie nam na zonsondergang sterk toe, piekte midden in de nacht en daalde na zonsopkomst. In een tweede experiment bezochten gemerkte karpers een nieuw bijgevoerd punt vooral na zonsondergang en keerden zij na zonsopkomst terug naar hun daggebieden.',
    limitations: [
      'De directe consumptiemeting duurde vijf dagen op één meer en gebruikte maïs als kunstmatig aangeboden voedsel; dit is geen continue meting van natuurlijk foerageren.',
      'Het tweede experiment onderzocht een nieuw bijgevoerd punt en ruimtelijk leer-/zoekgedrag; bezoeken aan dat punt zijn contextgebonden en niet gelijk aan een universeel nachtelijk voedingsmaximum.',
      'De studie vond plaats in Minnesota bij zomertemperaturen van circa 23–27 °C; seizoen, watertype, natuurlijk voedselaanbod en Europese populaties kunnen het patroon veranderen.',
      'De bron ondersteunt een veldwaargenomen nachtelijk voedingspatroon onder de onderzochte omstandigheden, maar geen vaste Nederlandse tijdvakbonus of directe vangstkans.'
    ],
    sourceReferences: [
      'Bajer, P.G., Lim, H., Travaline, M.J., Miller, B.D. & Sorensen, P.W. (2010). Cognitive aspects of food searching behavior in free-ranging wild Common Carp. Environmental Biology of Fishes, 88(3), 295–300. https://doi.org/10.1007/s10641-010-9643-8'
    ],
    reviewedAt: '2026-11-18',
    approvedForPrediction: false,
  },
  {
    id: 'common-carp-wild-bait-station-feeding-2022',
    topic: 'diel-foerageren-en-sociale-aggregaties-bij-aasstations',
    measuredOutcomes: ['feeding_rhythm', 'foraging_behavior'],
    species: ['Karper'],
    application: 'biology',
    evidenceStrength: 'moderate',
    summary: 'Een veldstudie in het natuurlijke Parley Lake (Minnesota) volgde 344 PIT-gemerkte wilde karpers bij meerdere bijgevoerd gemonitorde locaties. Tijdens de 20-daagse voerperiode in 2020 werden 133 unieke karpers 616.593 keer gedetecteerd; de aggregaties bij de voerlocaties waren het actiefst van schemering tot zonsopkomst. Voedselbezoeken waren kort en de individuele bijdrage was sterk ongelijk verdeeld.',
    limitations: [
      'Het onderzoek betrof één meer in Minnesota en kunstmatig bijgevoerd gemonitorde stations; het meet activiteit bij aangelegde voedselpunten, niet het volledige natuurlijke foerageergedrag in het meer.',
      'PIT-detecties en afgeleide feeding bouts meten aanwezigheid en bezoekgedrag bij de stations, niet rechtstreeks de hoeveelheid gegeten voedsel per vis.',
      'De individuele verschillen waren groot; een gemiddelde schemer-/nachtpiek beschrijft niet iedere karper.',
      'De populatie, habitat en baiting-opzet zijn niet rechtstreeks overdraagbaar op een Nederlandse visvijver of Lokkershoek; geen numerieke tijdvakbonus afleiden.'
    ],
    sourceReferences: [
      'Hundt, P.J., White, L.A., Craft, M.E. & Bajer, P.G. (2022). Social associations in common carp (Cyprinus carpio): Insights from induced feeding aggregations for targeted management strategies. Ecology and Evolution, 12(3), e8666. https://doi.org/10.1002/ece3.8666'
    ],
    reviewedAt: '2026-11-18',
    approvedForPrediction: false,
  },
  {
    id: 'common-carp-simulated-pond-no-distinct-diel-peak-2008',
    topic: 'dag-nacht-foerageergedrag-in-gesimuleerde-vijvers',
    measuredOutcomes: ['feeding_rhythm', 'foraging_behavior'],
    species: ['Karper'],
    application: 'biology',
    evidenceStrength: 'limited',
    summary: 'Een videostudie in kleine gesimuleerde vijvers volgde jonge karpers van circa 80 g gedurende 24 uur. Karpers graasden zowel overdag als ’s nachts, maar vertoonden geen duidelijke dagelijkse graaspiek; de verticale positie hing mede samen met het aanwezige voedseltype.',
    limitations: [
      'De studie gebruikte kleine gesimuleerde vijvers en jonge karpers; dit is geen veldonderzoek aan volwassen karpers in natuurlijke Nederlandse wateren.',
      'Gedrag werd met periodieke video-opnamen bemonsterd en de resultaten zijn gekoppeld aan een polycultuur-/voercontext.',
      'Het ontbreken van een duidelijke piek in deze opzet staat naast nachtelijke veldwaarnemingen bij vrijlevende karpers; dit onderstreept context- en levensfaseafhankelijkheid.'
    ],
    sourceReferences: [
      'Rahman, M.M., Verdegem, M.C.J., Wahab, M.A., Hossain, M.Y. & Jo, Q. (2008). Effects of day and night on swimming, grazing and social behaviours of rohu Labeo rohita (Hamilton) and common carp Cyprinus carpio (L.) in simulated ponds. Aquaculture Research, 39(13), 1383–1392. https://doi.org/10.1111/j.1365-2109.2008.02007.x'
    ],
    reviewedAt: '2026-11-18',
    approvedForPrediction: false,
  },
  {
    id: 'common-carp-angling-competition-night-landings-2021',
    topic: 'tijdstipverdeling-van-hengelvangsten',
    measuredOutcomes: ['angler_catch_distribution'],
    species: ['Karper'],
    application: 'advice',
    evidenceStrength: 'limited',
    summary: 'Een analyse van 14 karperwedstrijden in vier Europese landen, elk met meer dan 100 gelande karpers, vond de meeste landingen gedurende de nacht met een piek tussen zonsondergang en zonsopkomst. Het tijdspatroon verschilde wel significant tussen wedstrijden.',
    limitations: [
      'De studie meet tijdstippen van wedstrijdvangsten, niet rechtstreeks voedselopname of foerageeractiviteit; vangstverdeling is een uitkomst van zowel visgedrag als hengelinspanning en vangbaarheid.',
      'De beschikbare wedstrijdgegevens leveren geen algemeen gevalideerde, vergelijkbare hengeluren-noemer per tijdvak; aantallen landingen zijn daarom geen tijdvakvangstkans of CPUE.',
      'Het betreft gespecialiseerde karperwedstrijden met grote volwassen karpers, intensieve voorvoerpraktijken en ervaren deelnemers; dit is niet één-op-één overdraagbaar op recreatief method-feederen.',
      'De verschillen tussen wedstrijden waren statistisch aanwezig; de studie rechtvaardigt geen universele nachtbonus.'
    ],
    sourceReferences: [
      'Žák, J. (2021). Diel pattern in common carp landings from angling competitions corresponds to their assumed foraging activity. Fisheries Research, 243, 106086. https://doi.org/10.1016/j.fishres.2021.106086'
    ],
    reviewedAt: '2026-11-18',
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
    id: 'common-carp-wild-river-diel-feeding-1992',
    topic: 'diel-voedselopname-in-natuurlijk-rivierhabitat',
    measuredOutcomes: ['feeding_intensity', 'feeding_rhythm', 'habitat_use'],
    species: ['Karper'],
    application: 'biology',
    evidenceStrength: 'moderate',
    summary: 'Veldonderzoek in de Vermilion River (Illinois) bepaalde de dagelijkse voedingschronologie en rantsoenen uit maag-/voorkeeldarminhoud van onder meer gewone karper. Bij karper was de voedselopname discontinu en sterk variabel tussen individuen, uren en maanden; de hoogste voedingsintensiteit werd gemiddeld rond zonsopkomst en zonsondergang gevonden. Ook het gebruikte microhabitat verschilde tussen perioden met hoge en lage voedselopname.',
    limitations: [
      'De studie betreft één natuurlijk riviersysteem in Illinois; de uitkomst is niet rechtstreeks overdraagbaar op Nederlandse stilstaande wateren of Lokkershoek.',
      'De auteurs rapporteren sterke variatie tussen individuen, uren en maanden. De ochtend-/schemerpieken zijn daarom geen vaste dagelijkse regel voor iedere karper.',
      'Maag-/voorkeeldarminhoud is een veldmaat voor recente voedselopname, geen directe maat voor aasopname aan een hengel of hengelvangbaarheid.',
      'De studie geeft geen specifieke onderbouwing voor method-feeder, pellets, voorvoerstrategie of een numerieke tijdvakbonus.'
    ],
    sourceReferences: [
      'Kwak, T.J., Wiley, M.J., Osborne, L.L. & Larimore, R.W. (1992). The application of diel feeding chronology to habitat suitability analysis of warmwater stream fishes. Canadian Journal of Fisheries and Aquatic Sciences, 49(7), 1417–1430. https://doi.org/10.1139/f92-157'
    ],
    reviewedAt: '2026-11-18',
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
      'De bevinding ondersteunt soort- en contextspecifieke dagritmehypothesen, maar geen universele activiteitsscore of vaste dagbonus.',
      'Ander veldonderzoek bij juveniele blankvoorn en brasem in kleine Beierse meren vond nachtelijke pelagische voedselopname; levensfase en habitat kunnen het patroon omkeren.'
    ],
    sourceReferences: [
      'Vašek, M. & Kubečka, J. (2004). In situ diel patterns of zooplankton consumption by subadult/adult roach Rutilus rutilus, bream Abramis brama, and bleak Alburnus alburnus. Folia Zoologica, 53, 203–214. Author publication list: https://www.hbu.cas.cz/publikace/strana-7/?employeeId=651; bibliographic record: https://nas.er.usgs.gov/queries/references/ReferenceViewer.aspx?refnum=35171'
    ],
    reviewedAt: '2026-11-18',
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
    id: 'asp-diet-seasonal-stettin-firth-1976',
    topic: 'seizoensgebonden-dieet-en-prooicompositie',
    measuredOutcomes: ['diet_composition'],
    species: ['Roofblei'],
    application: 'biology',
    evidenceStrength: 'limited',
    summary: 'Veldonderzoek in de Szczecin Firth op materiaal uit 1972 en 1974–1975 beschreef de dieetcompositie en frequentie van prooien bij roofblei. In de zomer bestond het hoofdvoedsel uit onder meer spiering, blankvoorn, stekelbaars, baars, alver en pos; in andere seizoenen werd vrijwel uitsluitend spiering aangetroffen. De studie onderzocht geen dagritme of tijdstipgebonden voedselopname.',
    limitations: [
      'De studie betreft één estuarium en historische bemonsteringen uit 1972 en 1974–1975; de prooigemeenschap is niet rechtstreeks overdraagbaar naar Nederlandse plassen of rivieren.',
      'De auteurs beperkten de voedingsanalyse tot voedselcompositie en frequentie van prooien; dit is geen meting van voedingsintensiteit, dagelijkse voedselopname of dag-nachtritme.',
      'Seizoensgebonden prooifrequentie weerspiegelt ook de lokale beschikbaarheid van prooien en rechtvaardigt geen vaste seizoens- of tijdvakbonus.'
    ],
    sourceReferences: [
      'Trzebiatowski, R. & Leszczewicz, T.L. (1976). A contribution to knowledge of biology and economic importance of Aspius aspius (L.) of the Szczecin Firth. Acta Ichthyologica et Piscatoria, 6(2), 103–118. https://doi.org/10.3750/aip1976.06.2.08'
    ],
    reviewedAt: '2026-11-18',
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
  {
    id: 'eurasian-perch-pressure-variability-movement-three-lakes-2020',
    topic: 'luchtdrukvariabiliteit-en-beweging',
    species: ['Baars'],
    application: 'biology',
    evidenceStrength: 'limited',
    measuredOutcomes: ['locomotor_activity'],
    summary: 'Een bacheloronderzoek met akoestische telemetrie volgde 54 Europese baarzen in drie boreale meren. Meer dagelijkse luchtdrukvariabiliteit hing in twee van de drie meren samen met minder zwemactiviteit; temperatuur en licht lieten eveneens meermeer- en contextafhankelijke resultaten zien.',
    limitations: [
      'Het betreft een bachelorproef en slechts drie boreale meren; per meer werden 14–21 vissen gevolgd.',
      'De relaties waren niet consistent in alle drie de meren. De auteurs benadrukken verschillen tussen meren en individuele lichaamsgrootte.',
      'De gemeten uitkomst is zwemafstand/beweging per dag, geen voedselopname, jachtintensiteit of hengelvangbaarheid.',
      'De studie ondersteunt geen universele drukregel of numerieke drukbonus voor Nederlandse baarzen.'
    ],
    sourceReferences: [
      'Sandberg, L. (2020). Movement of the Eurasian perch (Perca fluviatilis) – individual responses to abiotic factors. Umeå University, Degree Thesis in Biology, 15 ECTS. https://umu.diva-portal.org/smash/get/diva2:1446518/FULLTEXT01.pdf'
    ],
    reviewedAt: '2026-11-18',
    approvedForPrediction: false,
  },
  {
    id: 'yellow-perch-barometric-pressure-feeding-lab-2014',
    topic: 'barometrische-druk-en-voedselopname-verwante-soort',
    species: ['Perca flavescens (verwante soort; geen Europese baars)'],
    application: 'general',
    evidenceStrength: 'limited',
    measuredOutcomes: ['feeding_intensity'],
    summary: 'Een laboratoriumstudie met juveniele Noord-Amerikaanse yellow perch (Perca flavescens; 75–125 mm, 4–20 g) omvatte 12 proeven bij stijgende, dalende en stabiele luchtdruk. Er werd geen significant verband gevonden tussen luchtdruk en voedselconsumptie (P = 0,55); consumptie nam wel toe gedurende de studie, waarschijnlijk mede door gewenning aan de laboratoriumsituatie.',
    limitations: [
      'Perca flavescens is niet de Europese baars Perca fluviatilis; deze bron is uitsluitend een verwante-taxonomische vergelijking en wordt niet aan het Europese baarsprofiel gekoppeld.',
      'De studie gebruikte kleine juveniele vissen, weinig proeven en hergebruikte individuen; acclimatisatie was een expliciete verstorende factor.',
      'Een niet-significant resultaat in deze beperkte laboratoriumstudie bewijst niet dat luchtdruk voor alle vissoorten of omstandigheden irrelevant is.',
      'De bron rechtvaardigt geen algemene drukbonus of -malus voor voedselopname of vangstkans.'
    ],
    sourceReferences: [
      'VanderWeyst, D. (2014). The Effect of Barometric Pressure on Feeding Activity of Yellow Perch. Journal of Earth and Life Science, 50. https://www.bemidjistate.edu/directory/wp-content/uploads/sites/16/2023/02/2014-VanderWeyst-D.-The-effect-of-barometric-pressure-on-feeding-activity-of-yellow-perch..pdf'
    ],
    reviewedAt: '2026-11-18',
    approvedForPrediction: false,
  },
  {
    id: 'freshwater-fish-turbidity-predator-prey-review-2024',
    topic: 'troebelheid-en-predator-prooi-interacties',
    species: [],
    application: 'environment',
    evidenceStrength: 'moderate',
    summary: 'Een review van 281 peer-reviewed studies beschrijft dat toenemende troebelheid de zichtbaarheid, predator-prooi-interacties, foerageerstrategieën en habitatkeuze kan veranderen. De richting verschilt per soort en trofische rol; negatieve effecten werden vaker gemeld bij predatoren dan bij prooivissen.',
    limitations: [
      'De literatuur heeft sterke taxonomische, geografische en omgevingsbias; de review levert geen Nederlandse soortspecifieke responsfunctie.',
      'De resultaten zijn gemengd: veranderingen in activiteit of gedrag betekenen niet automatisch hogere of lagere voedselopname.',
      'In veel studies werd daadwerkelijke predatierisico- of vangstuitkomst niet gemeten; foerageergedrag is geen hengelvangbaarheid.',
      'De review biedt geen universele NTU-drempel, vaste richting van effect of numerieke activiteitbonus voor de negen Vislogboek-doelsoorten.'
    ],
    sourceReferences: [
      'Zanghi, C. & Ioannou, C.C. (2024). The impact of increasing turbidity on the predator–prey interactions of freshwater fishes. Freshwater Biology, 70(1), e14354. https://doi.org/10.1111/fwb.14354'
    ],
    reviewedAt: '2026-11-18',
    approvedForPrediction: false,
  },

  {
    id: 'common-carp-winter-oxygen-deficiency-telemetry-2006',
    topic: 'opgeloste-zuurstof-winteractiviteit-en-voedselopname',
    measuredOutcomes: ['locomotor_activity', 'feeding_intensity', 'habitat_use'],
    species: ['Karper'],
    application: 'biology',
    evidenceStrength: 'limited',
    summary: 'Radio-telemetrie volgde gewone karper in één met ijs en sneeuw bedekte aquacultuurvijver tijdens een winterse zuurstofcrisis. Karpers verplaatsten zich vanuit diepere delen naar ondiep water bij een instromende beek met beter zuurstofgehalte; voedselopname stopte tijdens de zuurstofcrisis en de totale activiteit correleerde significant met opgeloste zuurstof.',
    limitations: [
      'Dit is één aquacultuurvijver en een uitzonderlijke winterse zuurstofcrisis; de bevinding is geen normale dagelijkse zuurstofrespons voor Nederlandse recreatiewateren.',
      'De bron ondersteunt een verband met activiteit, habitatverplaatsing en het stoppen van voeding tijdens ernstige zuurstofproblemen, maar levert geen universele zuurstofdrempel voor karper.',
      'Andere veldtelemetrie toont dat karper in een andere context zeer zuurstofarme waterlagen kan benutten; tolerantie en habitatkeuze zijn dus contextafhankelijk.',
      'Zuurstof mag niet uit luchttemperatuur, watertemperatuur, regen of bewolking worden afgeleid. Zonder directe meting blijft deze factor onbekend.',
      'De studie meet geen hengelvangbaarheid en rechtvaardigt geen numerieke activiteit- of vangstkansbonus.'
    ],
    sourceReferences: [
      'Bauer, C. & Schlott, G. (2006). Reaction of common carp (Cyprinus carpio, L.) to oxygen deficiency in winter as an example for the suitability of radio telemetry for monitoring the reaction of fish to stress factors in pond aquaculture. Aquaculture Research, 37(3), 248–254. https://doi.org/10.1111/j.1365-2109.2005.01426.x'
    ],
    reviewedAt: '2026-11-18',
    approvedForPrediction: false,
  },
  {
    id: 'common-carp-flow-activity-depth-reservoir-2015',
    topic: 'stroming-en-activiteit-habitatgebruik',
    measuredOutcomes: ['locomotor_activity', 'habitat_use'],
    species: ['Karper'],
    application: 'biology',
    evidenceStrength: 'limited',
    summary: 'Een 19 maanden durende akoestische telemetriestudie in één klein reservoir aan de Ebro onderzocht activiteit en dieptegebruik van gewone karper. Activiteit en habitatgebruik verschilden tussen individuen en waren significant gerelateerd aan stroming; bij hogere stroming waren karpers gemiddeld minder actief en gebruikten zij ondieper water.',
    limitations: [
      'De studie betreft één stromingsgevoelig reservoir op een grote Spaanse rivier; de uitkomst is niet zonder meer overdraagbaar naar stilstaand Nederlands plaswater.',
      'De studie meet locomotorische activiteit en diepte-/habitatgebruik, niet rechtstreeks voedselopname, aasbezoek of hengelvangbaarheid.',
      'Individuele variatie was substantieel; de richting en omvang mogen niet als universele karperregel worden toegepast.',
      'De studie rapporteert ook gebruik van sterk hypoxische waterlagen door karper; dit waarschuwt tegen één algemene zuurstofgrens voor de soort.',
      'Geen numerieke stromingsbonus of -malus activeren zonder lokale stromingsdata en onafhankelijke validatie.'
    ],
    sourceReferences: [
      'Benito, J., Benejam, L., Zamora, L. & García-Berthou, E. (2015). Diel Cycle and Effects of Water Flow on Activity and Use of Depth by Common Carp. Transactions of the American Fisheries Society, 144(3), 491–501. https://doi.org/10.1080/00028487.2015.1017656'
    ],
    reviewedAt: '2026-11-18',
    approvedForPrediction: false,
  },
  {
    id: 'freshwater-river-flow-movement-activity-meta-analysis-2012',
    topic: 'stroming-en-visbeweging-meta-analyse',
    species: [],
    application: 'environment',
    evidenceStrength: 'moderate',
    summary: 'Een random-effects meta-analyse onderzocht rivierafvoer in relatie tot niet-migrerende verplaatsing, opwaartse en neerwaartse migratie en fijne-schaalactiviteit. Hogere afvoer hing samen met meer niet-migrerende verplaatsing en opwaartse migratie, maar niet significant met neerwaartse migratie of fijne-schaalactiviteit.',
    limitations: [
      'De respons verschilde per bewegingscategorie; meer verplaatsing betekent niet automatisch meer dagelijkse activiteit of voedselopname.',
      'De analyses voor fijne-schaalactiviteit en neerwaartse migratie omvatten elk slechts vijf effectgroottes; heterogeniteit en mogelijke publicatie-/inclusiebias waren aanwezig.',
      'De meta-analyse gaat over stromende rivieren en is niet rechtstreeks toepasbaar op stilstaand water.',
      'Geen universele stromingsbonus, tijdvakvoorkeur of vangstkansregel afleiden.'
    ],
    sourceReferences: [
      'Taylor, M.K. & Cooke, S.J. (2012). Meta-analyses of the effects of river flow on fish movement and activity. Environmental Reviews, 20(4), 211–219. https://doi.org/10.1139/a2012-009'
    ],
    reviewedAt: '2026-11-18',
    approvedForPrediction: false,
  },
  {
    id: 'freshwater-fish-foodscape-flow-accessibility-review-2025',
    topic: 'voedselbeschikbaarheid-en-toegankelijkheid-in-rivieren',
    species: [],
    application: 'environment',
    evidenceStrength: 'moderate',
    summary: 'Een review beschrijft voedselbeschikbaarheid voor vissen als de combinatie van voedselabundantie, toegankelijkheid en kwaliteit. Stroming, snelheid, turbulentie, zicht, habitatstructuur en waterkwaliteit beïnvloeden of vissen voedsel kunnen ontmoeten, vangen en consumeren; flow kan ook prooien verplaatsen en toegang tot zijwateren veranderen.',
    limitations: [
      'Dit is een conceptuele review van rivier-voedselnetwerken, geen soortspecifieke veldmeting of gekalibreerde responsfunctie.',
      'De auteurs gebruiken veel voorbeelden uit Noord-Amerikaanse stromende systemen; overdraagbaarheid naar Nederlandse stilstaande wateren en individuele Vislogboek-soorten moet afzonderlijk worden beoordeeld.',
      'Voedseltoegankelijkheid is niet hetzelfde als totale visactiviteit, daadwerkelijke voedselopname of hengelvangbaarheid.',
      'De review ondersteunt geen numerieke flow-, zuurstof- of zichtbonus.'
    ],
    sourceReferences: [
      'Ouellet, V. et al. (2025). Food for fish: Challenges and opportunities for quantifying foodscapes in river networks. WIREs Water, 12(1), e1752. https://doi.org/10.1002/wat2.1752'
    ],
    reviewedAt: '2026-11-18',
    approvedForPrediction: false,
  },
  {
    id: 'european-freshwater-spawning-migration-environmental-triggers-meta-analysis-2026',
    topic: 'omgevingsfactoren-en-paaimigratie',
    species: [],
    application: 'environment',
    evidenceStrength: 'limited',
    summary: 'Een Europese meta-analyse combineerde 112 studies, 685.333 individuen, 953 effectgroottes en 50 soorten om omgevingsfactoren bij paaigerelateerde migratie te onderzoeken. Watertemperatuur was de meest consistente trigger; stroming liet soort- en gildeafhankelijke reacties zien. Voor regen en bewolking waren de aantallen studies zeer klein (respectievelijk twee en één), waardoor geen betrouwbare algemene conclusie mogelijk is.',
    limitations: [
      'De onderzochte respons is paaigerelateerde migratie, niet dagelijkse locomotorische activiteit, voedselopname, foerageren of hengelvangbaarheid.',
      'Regen, bewolking en troebelheid hadden te weinig studies voor betekenisvolle formele meta-analyses; een niet-significant of zwak resultaat bewijst geen afwezigheid van effect.',
      'De stromingsrespons verschilde sterk tussen soorten en stromingsgilden; dit mag niet als universele factor worden toegepast.',
      'De huidige registry heeft geen afzonderlijk outcome-type voor spawning migration; daarom wordt deze bron niet ten onrechte als algemene locomotorische activiteit geclassificeerd.',
      'Geen regen-, bewolking-, stromings- of tijdvakbonus activeren op basis van deze bron.'
    ],
    sourceReferences: [
      'Schlautmann, C. et al. (2026). A Meta-Analysis on Environmental Triggers of Spawning Migrations Reveals a New Classification of Thermal Guilds in European Freshwater Fishes. Fish and Fisheries, 27(3), 478–495. https://doi.org/10.1111/faf.70063'
    ],
    reviewedAt: '2026-11-18',
    approvedForPrediction: false,
  },

  {
    id: 'perch-recreational-angling-catch-rates-21-lakes-2013',
    topic: 'recreational-angling-catch-rate-and-catchability',
    measuredOutcomes: ['angler_catch_rate'],
    species: ['Baars'],
    application: 'biology',
    evidenceStrength: 'moderate',
    summary: 'Een multi-lakeonderzoek met hengeldagboeken uit 21 meren in Mecklenburg-Vorpommern (2006–2007), aangevuld met een experimentele visserij op een grindplas in 2008, onderzocht factoren achter recreatieve baarsvangsten. Ervaring van de visser, soortvoorkeur en aas-/kunstaastype hadden grote invloed op vangsttempo; voedingsconditie, watertransparantie en seizoen hingen eveneens samen met vangsttempo of visgrootte. De auteurs koppelden hoge herfstvangsten aan seizoensgebonden voedselbeperking in de onderzochte populaties.',
    limitations: [
      'Hengeldagboeken combineren visbiologie met visserervaring, voorkeur, aaskeuze, inspanning en lokale populatieomstandigheden; de uitkomst is geen zuivere individuele visvangbaarheidsparameter.',
      'De studie betreft Duitse meren en één experimentele grindplas; lokale prooibeschikbaarheid en watertransparantie kunnen afwijken van Nederlandse stekken.',
      'De seizoensrelatie is contextgebonden en rechtvaardigt geen algemene herfstbonus of directe prognoseweging.'
    ],
    sourceReferences: [
      'Heermann, L., Emmrich, M., Heynen, M., Dorow, M., König, U. & Borcherding, J. (2013). Explaining recreational angling catch rates of Eurasian perch, Perca fluviatilis: the role of natural and fishing-related environmental factors. Fisheries Management and Ecology, 20(2–3), 187–200. https://doi.org/10.1111/fme.12000'
    ],
    reviewedAt: '2026-11-18',
    approvedForPrediction: false,
  },
  {
    id: 'northern-pike-wild-lure-shyness-protected-areas-2025',
    topic: 'pike-lure-shyness-and-angling-vulnerability-wild-population',
    measuredOutcomes: ['angler_vulnerability'],
    species: ['Snoek'],
    application: 'biology',
    evidenceStrength: 'moderate',
    summary: 'Onderzoek in drie paren van gedeeltelijk beschermde kustgebieden in de zuidelijke Oostzee vergeleek snoek in gebieden met lagere en hogere recreatieve visserijdruk. Snoeken in gebieden met lagere visserijdruk reageerden agressiever op kunstaas; ongeveer een derde van het verschil in hengelvangsttempo tussen beschermde en open locaties kon mogelijk aan schuwheid voor kunstaas worden toegeschreven. Dit is veldbewijs dat visserijdruk en aangeleerd gedrag de vangbaarheid kunnen beïnvloeden.',
    limitations: [
      'De studie betreft kustsnoek in de zuidelijke Oostzee en gedeeltelijk beschermde gebieden; overdracht naar binnenwateren, andere populaties en andere technieken is onzeker.',
      'Verschillen in populatieomvang en vangsttempo spelen naast kunstaasschuwheid mee; de geschatte bijdrage van schuwheid is voorzichtig en niet gelijk aan een universele individuele vangstkans.',
      'De studie ondersteunt geen vaste correctiefactor voor hengeldruk of kunstaas in de prognose.'
    ],
    sourceReferences: [
      'Roser, P., Radinger, J., Feldhege, F., Braun, M. & Arlinghaus, R. (2025; first published 2024). Getting Scarce and Lure Shy: Impacts of Recreational Fishing on Coastal Northern Pike (Esox lucius) Abundance, Size Structure and Vulnerability to Angling. Fisheries Management and Ecology, 32(3), e12769. https://doi.org/10.1111/fme.12769'
    ],
    reviewedAt: '2026-11-18',
    approvedForPrediction: false,
  },
  {
    id: 'northern-pike-capture-probability-bait-learning-unexploited-2026',
    topic: 'pike-capture-probability-bait-type-and-learning',
    measuredOutcomes: ['angler_vulnerability'],
    species: ['Snoek'],
    application: 'biology',
    evidenceStrength: 'moderate',
    summary: 'Een driejarige gestandaardiseerde hengelstudie in een voorheen onbeviste natuurlijke snoekpopulatie omvatte 22.213 worpen, 238 aanvallen en 69 gevangen snoeken met dood aas en twee typen softplastic kunstaas. Vangsttempo nam binnen sessies, tussen seizoenen en over onderzoeksjaren af; aaskeuze beïnvloedde aanval en vangst, en het effect van kunstaaservaring was afhankelijk van het type aas. De auteurs schatten dat 43,2% van de snoeken boven 40 cm tijdens de onderzoeksperiode vangbaar leek.',
    limitations: [
      'De 43,2% is een populatieschatting voor snoek boven 40 cm in één voorheen onbeviste populatie en is geen universele individuele vangstkans of inzetbare app-score.',
      'De studie gebruikte gestandaardiseerde roofvismethoden met kunstaas en dood aas; de uitkomst is niet rechtstreeks overdraagbaar naar witvis- of karpertechnieken.',
      'Vangbaarheid veranderde door visgrootte, seizoen, aaskeuze, herhaalde blootstelling en leereffecten; geen vaste aas- of hengeldrukbonus afleiden.'
    ],
    sourceReferences: [
      'Lucas, J., Ros, A., Geist, J. & Brinker, A. (2026). Capture Probability and Effects of Bait Type on Learning Behavior in an Unexploited Population of Northern Pike (Esox lucius). Fisheries Management and Ecology. First published 17 September 2026. https://doi.org/10.1111/fme.70108'
    ],
    reviewedAt: '2026-11-18',
    approvedForPrediction: false,
  },


  {
    id: 'asp-seasonal-feeding-incidence-danube-2010',
    topic: 'seasonal-feeding-incidence-and-diet-asp',
    measuredOutcomes: ['feeding_incidence', 'diet_composition', 'growth'],
    species: ['Roofblei'],
    application: 'biology',
    evidenceStrength: 'limited',
    summary: 'Een veldstudie onderzocht 198 roofbleien uit een 28,5 km lang deel van de Donau, met lengtes van 90–405 mm en leeftijden van 0+ tot 4+; de steekproef bestond voornamelijk uit subadulten. De onderzoekers rapporteerden een seizoensgebonden vacuïteitsindex (aandeel lege magen): 94,1% in november tegenover 35,6% in juli. Dit geeft een indirecte maat voor seizoensgebonden voedingsincidentie, naast dieetcompositie, conditie en groei.',
    limitations: [
      'De vacuïteitsindex meet het aandeel lege magen in de bemonstering; dit is geen directe hoeveelheid gegeten voedsel, individuele voedingsintensiteit of dagelijkse voedselopname.',
      'De studie bemonsterde voornamelijk subadulte roofblei (0+ tot 4+) in één Donau-traject; overdraagbaarheid naar volwassen roofblei, Nederlandse plassen en andere prooigemeenschappen is onzeker.',
      'De studie meet geen dag-nachtritme, hengelvangbaarheid of vangstkans en rechtvaardigt geen seizoens- of tijdvakbonus.'
    ],
    sourceReferences: [
      'Krpo-Ćetković, J., Hegediš, A. & Lenhardt, M. (2010). Diet and growth of asp, Aspius aspius (Linnaeus, 1758), in the Danube River near the confluence with the Sava River (Serbia). Journal of Applied Ichthyology, 26(4), 513–521. https://doi.org/10.1111/j.1439-0426.2010.01456.x'
    ],
    reviewedAt: '2026-11-18',
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
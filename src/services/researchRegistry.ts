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
    summary: 'Een experimentele studie naar gewone karper rapporteerde dagritmische voedselopname met pieken in de ochtend en avond over een breed getest temperatuurbereik. Bij lage watertemperatuur nam de totale voedselopname sterk af, terwijl het dagritme niet volledig verdween.',
    limitations: [
      'De onderzochte ondersoort, populatie en gecontroleerde omstandigheden zijn niet zonder meer representatief voor alle Nederlandse karperpopulaties en natuurlijke wateren.',
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
    topic: 'dagritme-voedselkeuze-en-habitat',
    measuredOutcomes: ['diet_composition', 'habitat_use', 'locomotor_activity'],
    species: ['Voorn'],
    application: 'biology',
    evidenceStrength: 'moderate',
    summary: 'Veldonderzoek naar blankvoorn beschreef verschuivingen in dieet en habitat tussen dag en nacht. Telemetrie in heldere en troebele ondiepe meren liet zien dat activiteit en ruimtelijke verdeling sterk met de helderheid en het meertype konden verschillen.',
    limitations: [
      'De studies betreffen specifieke kleine meren; de waargenomen dag-/nachtpatronen zijn niet universeel.',
      'Een verschuiving in dieet of habitat is niet automatisch een verandering in totale voedselopname of hengelvangbaarheid.',
      'Leeftijd, predatiedruk, helderheid, voedseltype en seizoen kunnen het patroon veranderen.'
    ],
    sourceReferences: [
      'Haertel, S.S. & Eckmann, R. (2002). Diel diet shift of roach and its implications for the estimation of daily rations. Journal of Fish Biology, 60, 876–892. https://doi.org/10.1111/j.1095-8649.2002.tb02415.x',
      'Jacobsen, L., Berg, S., Jepsen, N. & Skov, C. (2004). Does roach behaviour differ between shallow lakes of different environmental state? Journal of Fish Biology, 65, 135–147. https://doi.org/10.1111/j.0022-1112.2004.00436.x'
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
    id: 'pikeperch-diel-activity-drainage-canal-2005',
    topic: 'dagritme-activiteit-en-spawning-habitat',
    measuredOutcomes: ['locomotor_activity', 'habitat_use'],
    species: ['Snoekbaars'],
    application: 'biology',
    evidenceStrength: 'limited',
    summary: 'Akoestische telemetrie onderzocht de activiteit en beweging van volwassen snoekbaars in een drainagekanaal in Zuid-Frankrijk tijdens het voorjaar. De studie levert soortspecifieke informatie over dagritme, beweging en paaicontext.',
    limitations: [
      'De studie is beperkt tot één kanaal, één seizoen en een zuidelijk mediterraan klimaat.',
      'Beweging en paaigedrag zijn niet hetzelfde als dagelijkse voedselopname of vangbaarheid.',
      'De uitkomst mag niet als algemene Nederlandse jaarcurve of vaste schemerbonus worden gebruikt.'
    ],
    sourceReferences: [
      'Poulet, N., Arzel, C., Messad, S., Lek, S. & Argillier, C. (2005). Diel activity of adult pikeperch Sander lucioperca (L.) in a drainage canal in the Mediterranean basin during spring. Hydrobiologia, 543, 79–90. https://doi.org/10.1007/s10750-004-6823-6'
    ],
    reviewedAt: '2026-11-16',
    approvedForPrediction: false,
  },
  {
    id: 'european-catfish-feeding-and-activity-rhythms-1995-2012',
    topic: 'dagritme-voedingsactiviteit-en-individuele-variatie',
    measuredOutcomes: ['feeding_intensity', 'feeding_rhythm', 'locomotor_activity'],
    species: ['Meerval'],
    application: 'biology',
    evidenceStrength: 'moderate',
    summary: 'Een gecontroleerde voedingsstudie vond sterk nachtelijke voedselopname bij Europese meerval, terwijl veldtelemetrie in twee rivieren duidelijke individuele verschillen liet zien in dag-/nachtactiviteit. In de veldstudie hing EMG-activiteit samen met temperatuur en stroming.',
    limitations: [
      'De gecontroleerde voedingsstudie laat zien dat voerregime en sociale context het ritme kunnen veranderen.',
      'De veldstudie betrof een beperkte groep gezenderde vissen in twee rivieren tijdens voorjaar en zomer; individuele variatie was groot.',
      'Meerval mag daarom niet als uitsluitend nachtactief worden gemodelleerd en de studies leveren geen directe vangstkans.'
    ],
    sourceReferences: [
      'Boujard, T. (1995). Diel rhythms of feeding activity in the European catfish, Silurus glanis. Physiology & Behavior, 58(4), 641–645. https://doi.org/10.1016/0031-9384(95)00109-V',
      'Slavík, O. & Horký, P. (2012). Diel dualism in the energy consumption of the European catfish Silurus glanis. Journal of Fish Biology, 81, 2223–2234. https://doi.org/10.1111/j.1095-8649.2012.03436.x'
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
    summary: 'Maandelijkse maaginhoudanalyses van 90 zeelten uit één klein eutroof water in Perm beschreven directe dag- en seizoensvariatie in voedselopname. De hoogste voedingsintensiteit werd gemeten tussen 18:00–21:00 en 00:00–03:00; de voedselkeuze verschilde bovendien tussen leeftijdsgroepen.',
    limitations: [
      'Het onderzoek betrof één klein, begroeid water en de vegetatieperiode van één jaar; de uitkomst is niet universeel voor Nederlandse wateren.',
      'Leeftijdsgroepen verschilden in dieet, terwijl de app de leeftijd van de lokale zeeltpopulatie niet kent.',
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
    summary: 'In-situ maaginhoud- en consumptieonderzoek in het meso-eutrofe Rimov-stuwmeer vond bij subadulte en volwassen brasem en blankvoorn een overwegend daggebonden voedingsritme met duidelijk lagere maagvulling in de nacht. De grootteklassen en maand waarin verschillen zichtbaar waren, verschilden per soort.',
    limitations: [
      'De studie onderzocht vooral foerageren op microcrustaceeën in één stuwmeer; dit is niet hetzelfde als alle voedselbronnen of aasopname door hengelvis.',
      'De patronen waren afhankelijk van lengteklasse en maand.',
      'De bevinding ondersteunt soort- en contextspecifieke dagritmehypothesen, maar geen universele activiteitsscore.'
    ],
    sourceReferences: [
      'Vašek, M. & Kubečka, J. (2004). In situ diel patterns of zooplankton consumption by subadult/adult roach Rutilus rutilus, bream Abramis brama, and bleak Alburnus alburnus. Folia Zoologica, 53, 203–214. Bibliographic record: https://nas.er.usgs.gov/queries/references/ReferenceViewer.aspx?refnum=35171'
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
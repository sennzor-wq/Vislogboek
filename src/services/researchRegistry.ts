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
    id: 'freshwater-fish-temperature-growth-four-species-tien-2024',
    topic: 'temperatuur-en-groei',
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
  }
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
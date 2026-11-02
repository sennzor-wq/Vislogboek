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
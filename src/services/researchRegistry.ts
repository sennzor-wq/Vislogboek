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
  },

  {
    id: 'common-carp-juvenile-foraging-temperature-2012',
    topic: 'temperatuur-en-foerageergedrag',
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
    species: ['Snoek'],
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
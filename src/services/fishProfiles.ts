import { FishSpecies, TimeSlot } from '../types';

export interface SpeciesProfile {
  species: FishSpecies;
  dutchName: string;
  scientificName: string;
  description: string;
  assumptions: string[];
  scientificReferences: string[];       // Bronnen ondersteunen biologische context, niet automatisch de numerieke modelparameters
  // Modelinstellingen, geen universele soortgrenzen. Behandel als voorlopige
  // responsparameters totdat per soort/levensstadium/watertype een bron de exacte
  // waarden ondersteunt. De uitkomst is een relatieve modelschatting, geen gemeten activiteit.
  optimalTempRange: [number, number];
  tolerableTempRange: [number, number];
  thermalOptimum: number;
  thermalWidthCold: number;
  thermalWidthWarm: number;
  preferredSlots: TimeSlot[];
  crepuscularBonus: boolean;            // Schemering bonus (ochtend/avond)
  // Deze voorkeuren zijn voorlopig heuristisch. Windrichting en luchtdruk worden
  // niet gebruikt als automatische biologische bonus/malus in de activiteitsindex.
  preferredWindDirections: string[];
  disruptiveWindThresholdKmH: number;
  pressureSensitivity: 'hoog' | 'matig' | 'laag';
  optimalPressureRange: [number, number];
  rainPreference: 'licht_positief' | 'neutraal' | 'negatief';
  cloudPreference: 'bewolkt' | 'wisselend' | 'zonnig';
  seasonalWeights: {
    // Voorlopige relatieve seizoensprior (1-10), niet gelijk aan vangstkans.
    lente: number;
    zomer: number;
    herfst: number;
    winter: number;
  };
}

export const SPECIES_PROFILES: Record<FishSpecies, SpeciesProfile> = {
  Karper: {
    species: 'Karper',
    dutchName: 'Karper (Cyprinus carpio)',
    scientificName: 'Cyprinus carpio',
    description: 'Warmteminnende ectotherme bodemazer. Bij lage watertemperaturen vertraagt de spijsvertering en neemt voedselopname af; activiteit neemt doorgaans toe bij opwarming. Er is geen vaste universele temperatuurgrens voor piekactiviteit.',
    assumptions: [
      'Stofwisseling en voedselopname nemen doorgaans af bij dalende watertemperatuur. Een vaste grens voor winterrust geldt niet universeel; acclimatisatie, formaat, conditie en watertype spelen mee.',
      'Een lage luchttemperatuur leidt niet automatisch tot winterrust zolang de watermassa warmer blijft; beoordeel dit op basis van gemeten of geschatte watertemperatuur en thermische traagheid.',
      'Een gunstige barometer of wind kan een fysiologische watertemperatuurbeperking nooit compenseren.',
      'Watertemperatuur is een relevante fysiologische contextfactor. Een universeel optimaal bereik voor alle volwassen karpers en Nederlandse wateren is niet vastgesteld in dit profiel.',
      'Schemering en nachtelijke uren zijn in warme periodes productiever dan felle zon overdag.',
    ],
    scientificReferences: [
      'Volkoff, H. & Rønnestad, I. (2020). Effects of temperature on feeding and digestive processes in fish. Temperature, 7(4), 307–320. https://doi.org/10.1080/23328940.2020.1765950',
      'Chen, S. et al. (2012). Effect of Water Temperature on Feeding Rhythm in Common Carp. Journal of Northeast Agricultural University (English Edition), 19(1), 57–61. https://doi.org/10.1016/S1006-8104(12)60039-7',
      'Elliott, J.M. (1994) Quantitative Ecology and the Brown Trout / Teleost Bioenergetics.',
      'Wootton, R.J. (1998) Ecology of Teleost Fishes, 2nd ed. Kluwer Academic Publishers.',
      'Hepher, B. & Pruginin, Y. (1981) Commercial Fish Farming with special reference to Fish Culture in Israel.',
      'FAO Fisheries Synopsis No. 12 (1981) Biology and Culture of Cyprinus carpio.',
    ],
    optimalTempRange: [16, 24],
    tolerableTempRange: [8, 28],
    thermalOptimum: 21.0,
    thermalWidthCold: 5.8,
    thermalWidthWarm: 5.5,
    preferredSlots: ['Ochtend', 'Avond', 'Nacht'],
    crepuscularBonus: true,
    preferredWindDirections: ['ZW', 'W', 'Z'],
    disruptiveWindThresholdKmH: 35,
    pressureSensitivity: 'matig',
    optimalPressureRange: [1008, 1018],
    rainPreference: 'licht_positief',
    cloudPreference: 'bewolkt',
    seasonalWeights: { lente: 7.5, zomer: 8.5, herfst: 8.0, winter: 2.5 },
  },
  Brasem: {
    species: 'Brasem',
    dutchName: 'Brasem (Abramis brama)',
    scientificName: 'Abramis brama',
    description: 'Typische scholenvis en bodemazer. Foerageert in een breder temperatuurbereik dan karper, maar is gevoelig voor snelle drukschommelingen.',
    assumptions: [
      'Gedijt goed tussen 12 °C en 21 °C; aast ook in koudere maanden mits aaspresentatie subtiel is.',
      'Avond- en vroege ochtendschemering zijn natuurlijke foerageerpieken.',
      'Een directe, voorspelbare relatie tussen korte luchtdrukschommelingen en aasactiviteit is onvoldoende onderbouwd; luchtdruk wordt daarom niet als soortspecifieke bonus/malus gebruikt.',
      'Matige kabbel (10–22 km/u) brengt natuurlijk voedsel in beweging en verlaagt schuwheid.',
    ],
    scientificReferences: [
      'Volkoff, H. & Rønnestad, I. (2020). Effects of temperature on feeding and digestive processes in fish. Temperature, 7(4), 307–320. https://doi.org/10.1080/23328940.2020.1765950',
      'Tien, N.S.H. et al. (2024). Temperature-related increase in growth rate in four freshwater lake fish species. Journal of Fish Biology. https://doi.org/10.1111/jfb.15745 (groeirelatie; geen directe activiteit- of vangstcurve)',
      'Lammens, E.H.R.R. (1985) A test of resource partitioning in a gear-selected fish community.',
      'EIFAC Water Quality Criteria for European Freshwater Fish (FAO technical papers).',
      'Nagelkerke, L.A.J. & Sibbing, F.A. (1996) Efficiency of feeding mechanisms in Abramis brama.',
    ],
    optimalTempRange: [12, 21],
    tolerableTempRange: [6, 26],
    thermalOptimum: 17.5,
    thermalWidthCold: 6.2,
    thermalWidthWarm: 5.8,
    preferredSlots: ['Ochtend', 'Avond', 'Nacht'],
    crepuscularBonus: true,
    preferredWindDirections: ['ZW', 'W', 'NW'],
    disruptiveWindThresholdKmH: 35,
    pressureSensitivity: 'hoog',
    optimalPressureRange: [1010, 1020],
    rainPreference: 'licht_positief',
    cloudPreference: 'bewolkt',
    seasonalWeights: { lente: 8.0, zomer: 8.0, herfst: 7.5, winter: 4.0 },
  },
  Snoek: {
    species: 'Snoek',
    dutchName: 'Snoek (Esox lucius)',
    scientificName: 'Esox lucius',
    description: 'Koudwater-tolerante visuele hinderlaagjager. Blijft actief jagen bij lage watertemperaturen (4–14 °C) in najaar en winter.',
    assumptions: [
      'Gedijt uitstekend in koel water (7–15 °C); activiteit daalt juist in zeer warm zomerwater (> 21 °C).',
      'Zichtjager: bewolkte dagen met lichte golfslag breken het licht en maken prooivissen kwetsbaarder.',
      'Ochtend- en namiddagschemering leveren duidelijke jachtpieken op.',
      'Een naderend weersfront kan meerdere omstandigheden tegelijk veranderen; een afzonderlijk positief effect van luchtdruk op jachtactiviteit is niet vastgesteld.',
    ],
    scientificReferences: [
      'Volkoff, H. & Rønnestad, I. (2020). Effects of temperature on feeding and digestive processes in fish. Temperature, 7(4), 307–320. https://doi.org/10.1080/23328940.2020.1765950',
      'Casselman, J.M. (1978) Effects of water temperature on the growth and metabolism of Northern Pike (Esox lucius).',
      'Diana, J.S. (1979) The feeding pattern and daily ration of pike in Lac Ste. Anne, Alberta.',
      'Craig, J.F. (1996) Pike: Biology and Exploitation. Chapman & Hall.',
    ],
    optimalTempRange: [8, 17],
    tolerableTempRange: [3, 22],
    thermalOptimum: 12.5,
    thermalWidthCold: 6.5,
    thermalWidthWarm: 6.0,
    preferredSlots: ['Ochtend', 'Middag', 'Avond'],
    crepuscularBonus: true,
    preferredWindDirections: ['ZW', 'W', 'NW', 'N'],
    disruptiveWindThresholdKmH: 38,
    pressureSensitivity: 'matig',
    optimalPressureRange: [1006, 1018],
    rainPreference: 'licht_positief',
    cloudPreference: 'bewolkt',
    seasonalWeights: { lente: 6.5, zomer: 5.0, herfst: 9.0, winter: 8.0 },
  },
  Baars: {
    species: 'Baars',
    dutchName: 'Baars (Perca fluviatilis)',
    scientificName: 'Perca fluviatilis',
    description: 'Actieve scholen- en zichtjager. Houdt van dynamische lichtomstandigheden en matige temperaturen.',
    assumptions: [
      'Actief overdag met duidelijke pieken rond de ochtend- en namiddagschemering.',
      'Gunstig temperatuurbereik 10–20 °C; in de nazomer en vroege herfst zeer vraatzuchtig.',
      'Een direct effect van stabiele luchtdruk op jachtgedrag is niet betrouwbaar vastgesteld.',
      'Harde storm en troebel water door hevige stortbui belemmeren het visuele jagen.',
    ],
    scientificReferences: [
      'Volkoff, H. & Rønnestad, I. (2020). Effects of temperature on feeding and digestive processes in fish. Temperature, 7(4), 307–320. https://doi.org/10.1080/23328940.2020.1765950',
      'Tien, N.S.H. et al. (2024). Temperature-related increase in growth rate in four freshwater lake fish species. Journal of Fish Biology. https://doi.org/10.1111/jfb.15745 (groeirelatie; geen directe activiteit- of vangstcurve)',
      'Craig, J.F. (1987) The Biology of Perch and Related Fish. Croom Helm.',
      'Le Cren, E.D. (1958) Observations on the growth of perch (Perca fluviatilis) over twenty-two years.',
      'Thorpe, J.E. (1977) Synopsis of biological data on the perch. FAO Fisheries Synopsis No. 113.',
    ],
    optimalTempRange: [11, 20],
    tolerableTempRange: [4, 25],
    thermalOptimum: 16.5,
    thermalWidthCold: 6.0,
    thermalWidthWarm: 5.5,
    preferredSlots: ['Ochtend', 'Middag', 'Avond'],
    crepuscularBonus: true,
    preferredWindDirections: ['ZW', 'W', 'O'],
    disruptiveWindThresholdKmH: 35,
    pressureSensitivity: 'matig',
    optimalPressureRange: [1012, 1022],
    rainPreference: 'neutraal',
    cloudPreference: 'wisselend',
    seasonalWeights: { lente: 7.5, zomer: 8.0, herfst: 8.5, winter: 5.0 },
  },
  Voorn: {
    species: 'Voorn',
    dutchName: 'Blankvoorn / Ruisvoorn (Rutilus rutilus)',
    scientificName: 'Rutilus rutilus',
    description: 'Flexibele alleseter met hoge tolerantie voor koud water. Blijft de hele winter door foerageren.',
    assumptions: [
      'Gedijt in een breed temperatuurbereik (6–20 °C).',
      'In het najaar en de winter zijn de middaguren met lichte opwarming vaak het productiefst.',
      'Reageert positief op zachte westenwind met lichte kabbel; vermijdt storm.',
    ],
    scientificReferences: [
      'Volkoff, H. & Rønnestad, I. (2020). Effects of temperature on feeding and digestive processes in fish. Temperature, 7(4), 307–320. https://doi.org/10.1080/23328940.2020.1765950',
      'Tien, N.S.H. et al. (2024). Temperature-related increase in growth rate in four freshwater lake fish species. Journal of Fish Biology. https://doi.org/10.1111/jfb.15745 (groeirelatie; geen directe activiteit- of vangstcurve)',
      'Goldspink, C.R. (1979) The population density, growth rate and production of roach Rutilus rutilus in Tjeukemeer.',
      'Kubecka, J. (1993) Succession of fish communities in reservoirs of Central and Eastern Europe.',
    ],
    optimalTempRange: [10, 19],
    tolerableTempRange: [4, 24],
    thermalOptimum: 15.0,
    thermalWidthCold: 6.5,
    thermalWidthWarm: 6.0,
    preferredSlots: ['Ochtend', 'Middag', 'Avond'],
    crepuscularBonus: false,
    preferredWindDirections: ['ZW', 'W', 'Z'],
    disruptiveWindThresholdKmH: 32,
    pressureSensitivity: 'laag',
    optimalPressureRange: [1008, 1022],
    rainPreference: 'licht_positief',
    cloudPreference: 'wisselend',
    seasonalWeights: { lente: 8.0, zomer: 7.5, herfst: 8.0, winter: 6.0 },
  },
  Zeelt: {
    species: 'Zeelt',
    dutchName: 'Zeelt (Tinca tinca)',
    scientificName: 'Tinca tinca',
    description: 'Sterk warmteminnende, schuwe modder- en plantenbewoner. Vrijwel inactief bij koud water.',
    assumptions: [
      'Onder 12 °C daalt de activiteit zeer scherp; optimale voeding vindt plaats tussen 16 °C en 24 °C.',
      'Vroege ochtend (rond zonsopkomst) en late avondschemering zijn veruit de beste periodes.',
      'Kille noordenwind en plotselinge koufronten zetten zeelt vrijwel direct stil.',
    ],
    scientificReferences: [
      'Volkoff, H. & Rønnestad, I. (2020). Effects of temperature on feeding and digestive processes in fish. Temperature, 7(4), 307–320. https://doi.org/10.1080/23328940.2020.1765950',
      'Benjamin, C., Hill, J. & Ricciardi, A. (2026). Thermal effects on feeding efficiency and body condition in invasive and native benthivorous freshwater fishes. Biological Invasions, 28, 51. https://doi.org/10.1007/s10530-026-03767-w (experimentele voedselopname; beperkte overdraagbaarheid naar Nederlandse veldsituaties)',
      'Neophitou, C. (1993) Some biological data on tench (Tinca tinca L.) in Lake Pamvotis, Greece.',
      'Bryant, P. et al. (1980) Aquaculture of cyprinids: Environmental requirements and feeding of tench.',
    ],
    optimalTempRange: [16, 24],
    tolerableTempRange: [11, 27],
    thermalOptimum: 20.5,
    thermalWidthCold: 5.0,
    thermalWidthWarm: 5.0,
    preferredSlots: ['Ochtend', 'Avond'],
    crepuscularBonus: true,
    preferredWindDirections: ['Z', 'ZW'],
    disruptiveWindThresholdKmH: 30,
    pressureSensitivity: 'hoog',
    optimalPressureRange: [1010, 1020],
    rainPreference: 'licht_positief',
    cloudPreference: 'bewolkt',
    seasonalWeights: { lente: 7.5, zomer: 9.0, herfst: 5.0, winter: 1.0 },
  },
  Snoekbaars: {
    species: 'Snoekbaars',
    dutchName: 'Snoekbaars (Sander lucioperca)',
    scientificName: 'Sander lucioperca',
    description: 'Lichtschuwe diepwaterjager met reflecterend netvlies (tapetum lucidum). Uitgesproken nacht- en schemerjager.',
    assumptions: [
      'Vermijdt fel direct zonlicht; jaagt voornamelijk in de schemering en \'s nachts.',
      'Gedijt in koel tot matig water (8–18 °C).',
      'Troebel water en stabiele luchtdruk verhogen de jachtactiviteit.',
    ],
    scientificReferences: [
      'Volkoff, H. & Rønnestad, I. (2020). Effects of temperature on feeding and digestive processes in fish. Temperature, 7(4), 307–320. https://doi.org/10.1080/23328940.2020.1765950',
      'Tien, N.S.H. et al. (2024). Temperature-related increase in growth rate in four freshwater lake fish species. Journal of Fish Biology. https://doi.org/10.1111/jfb.15745 (groeirelatie; geen directe activiteit- of vangstcurve)',
      'Lappalainen, J. et al. (2003) Sander lucioperca biology and management in European freshwaters.',
      'Van Densen, W.L.T. (1985) Feeding and growth of 0+ pikeperch in relation to prey density.',
    ],
    optimalTempRange: [10, 18],
    tolerableTempRange: [5, 24],
    thermalOptimum: 15.0,
    thermalWidthCold: 6.2,
    thermalWidthWarm: 6.0,
    preferredSlots: ['Nacht', 'Avond', 'Ochtend'],
    crepuscularBonus: true,
    preferredWindDirections: ['W', 'ZW', 'NW'],
    disruptiveWindThresholdKmH: 36,
    pressureSensitivity: 'hoog',
    optimalPressureRange: [1010, 1020],
    rainPreference: 'licht_positief',
    cloudPreference: 'bewolkt',
    seasonalWeights: { lente: 7.0, zomer: 7.0, herfst: 8.5, winter: 6.5 },
  },
  Meerval: {
    species: 'Meerval',
    dutchName: 'Europese Meerval (Silurus glanis)',
    scientificName: 'Silurus glanis',
    description: 'Grootste inheemse zoetwaterroofvis. Warmteminnende nachtjager met uitstekende reuk- en tastzin.',
    assumptions: [
      'Vereist watertemperaturen boven 15 °C voor gerichte jacht; piekactiviteit boven 19 °C.',
      'Nachtelijke uren en broeierige zwoele avonden voor een zomers buienfront zijn topuren.',
    ],
    scientificReferences: [
      'Volkoff, H. & Rønnestad, I. (2020). Effects of temperature on feeding and digestive processes in fish. Temperature, 7(4), 307–320. https://doi.org/10.1080/23328940.2020.1765950',
      'Copp, G.H. et al. (2009) The biology, ecology and impact of non-native European catfish Silurus glanis.',
      'Kestemont, P. (1995) Nutrition and growth of Silurus glanis in European waters.',
    ],
    optimalTempRange: [18, 26],
    tolerableTempRange: [12, 28],
    thermalOptimum: 22.0,
    thermalWidthCold: 5.0,
    thermalWidthWarm: 5.0,
    preferredSlots: ['Nacht', 'Avond'],
    crepuscularBonus: true,
    preferredWindDirections: ['Z', 'ZW'],
    disruptiveWindThresholdKmH: 35,
    pressureSensitivity: 'hoog',
    optimalPressureRange: [1005, 1015],
    rainPreference: 'licht_positief',
    cloudPreference: 'bewolkt',
    seasonalWeights: { lente: 6.5, zomer: 9.0, herfst: 6.0, winter: 1.5 },
  },
  Roofblei: {
    species: 'Roofblei',
    dutchName: 'Roofblei (Aspius aspius)',
    scientificName: 'Aspius aspius',
    description: 'Pelagische oppervlaktejager in stromend water en bij gemalen/sluizen.',
    assumptions: [
      'Gedijt in stroming en warmte (14–22 °C).',
      'Actief overdag en in de avondschemering met luide oppervlaktekolken.',
    ],
    scientificReferences: [
      'Volkoff, H. & Rønnestad, I. (2020). Effects of temperature on feeding and digestive processes in fish. Temperature, 7(4), 307–320. https://doi.org/10.1080/23328940.2020.1765950',
      'Tartally, A. (2000) Data on the food of Aspius aspius in River Tisza.',
      'Pinder, A.C. (2001) Keys to larval and juvenile stages of British freshwater fishes.',
    ],
    optimalTempRange: [14, 23],
    tolerableTempRange: [8, 27],
    thermalOptimum: 18.5,
    thermalWidthCold: 5.5,
    thermalWidthWarm: 5.0,
    preferredSlots: ['Ochtend', 'Middag', 'Avond'],
    crepuscularBonus: true,
    preferredWindDirections: ['W', 'ZW'],
    disruptiveWindThresholdKmH: 35,
    pressureSensitivity: 'laag',
    optimalPressureRange: [1010, 1022],
    rainPreference: 'neutraal',
    cloudPreference: 'wisselend',
    seasonalWeights: { lente: 7.0, zomer: 8.5, herfst: 7.5, winter: 2.5 },
  },
  Overig: {
    species: 'Overig',
    dutchName: 'Algemeen / Gemiddeld',
    scientificName: 'Teleostei',
    description: 'Gemiddeld ecologisch model voor gematigde zoetwatervissen.',
    assumptions: [
      'Gebruikt een gewogen ecologisch gemiddelde.',
      'Matige temperaturen (12–18 °C) en stabiele omstandigheden vormen het nulpunt.',
    ],
    scientificReferences: [
      'Volkoff, H. & Rønnestad, I. (2020). Effects of temperature on feeding and digestive processes in fish. Temperature, 7(4), 307–320. https://doi.org/10.1080/23328940.2020.1765950',
      'Huet, M. (1970) Traité de Pisciculture. Éditions Ch. de Wyngaert, Bruxelles.',
      'Wootton, R.J. (1998) Ecology of Teleost Fishes. Kluwer Academic Publishers.',
    ],
    optimalTempRange: [12, 20],
    tolerableTempRange: [6, 25],
    thermalOptimum: 16.5,
    thermalWidthCold: 6.0,
    thermalWidthWarm: 5.5,
    preferredSlots: ['Ochtend', 'Avond'],
    crepuscularBonus: true,
    preferredWindDirections: ['ZW', 'W'],
    disruptiveWindThresholdKmH: 35,
    pressureSensitivity: 'matig',
    optimalPressureRange: [1010, 1020],
    rainPreference: 'licht_positief',
    cloudPreference: 'bewolkt',
    seasonalWeights: { lente: 7.5, zomer: 7.5, herfst: 8.0, winter: 4.5 },
  },
};

/**
 * Berekent de fysiologische temperatuurefficiëntie E_temp (0.08 - 1.0)
 * via een continue Gaussische responsfunctie.
 */
export function calculateThermalEfficiency(
  temp: number,
  profile: SpeciesProfile
): { efficiency: number; description: string; impact: 'positief' | 'neutraal' | 'negatief' } {
  const { thermalOptimum, thermalWidthCold, thermalWidthWarm, optimalTempRange, tolerableTempRange, species } = profile;
  const isCold = temp < thermalOptimum;
  const width = isCold ? thermalWidthCold : thermalWidthWarm;
  const diff = temp - thermalOptimum;

  // Bounded smooth Gaussian response [0.08, 1.0]
  const rawEfficiency = Math.exp(-(diff * diff) / (2 * width * width));
  const efficiency = Math.max(0.08, Math.min(1.0, rawEfficiency));

  let description = '';
  let impact: 'positief' | 'neutraal' | 'negatief' = 'neutraal';

  if (temp >= optimalTempRange[0] && temp <= optimalTempRange[1]) {
    impact = 'positief';
    description = `Temperatuur (${temp.toFixed(1)} °C) valt binnen het optimale bereik (${optimalTempRange[0]}–${optimalTempRange[1]} °C) voor ${species} (thermische efficiëntie: ${(efficiency * 100).toFixed(0)}%).`;
  } else if (temp < optimalTempRange[0] && temp >= tolerableTempRange[0]) {
    impact = efficiency < 0.45 ? 'negatief' : 'neutraal';
    description = `Temperatuur (${temp.toFixed(1)} °C) ligt onder het optimum van ${species}. De stofwisseling vertraagt geleidelijk (thermische efficiëntie: ${(efficiency * 100).toFixed(0)}%).`;
  } else if (temp < tolerableTempRange[0]) {
    impact = 'negatief';
    description = `Lage watertemperatuur (${temp.toFixed(1)} °C) dwingt ${species} tot een sterke spaarstand (thermische efficiëntie: ${(efficiency * 100).toFixed(0)}%). Foerageerdrang is sterk geremd (winterrust wordt fysiologisch gestuurd door koud water, niet direct door koude lucht).`;
  } else {
    impact = 'negatief';
    description = `Zeer hoge temperatuur (${temp.toFixed(1)} °C) kan zuurstofspanning verlagen en vis passief maken.`;
  }

  return { efficiency, description, impact };
}
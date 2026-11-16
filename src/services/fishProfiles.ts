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
      'Onderzoek beschrijft onder sommige omstandigheden ochtend- en avondpieken; een andere studie vond meer graastijd overdag dan in de nacht. Een vaste nachtvoorkeur is daarom niet aangetoond.',
    ],
    scientificReferences: [
      'Volkoff, H. & Rønnestad, I. (2020). Effects of temperature on feeding and digestive processes in fish. Temperature, 7(4), 307–320. https://doi.org/10.1080/23328940.2020.1765950',
      'Chen, S. et al. (2012). Effect of Water Temperature on Feeding Rhythm in Common Carp. Journal of Northeast Agricultural University (English Edition), 19(1), 57–61. https://doi.org/10.1016/S1006-8104(12)60039-7',
      'Rahman, M.M. & Meyer, C.G. (2009). Effects of food type on diel behaviours of common carp Cyprinus carpio in simulated aquaculture pond conditions. Journal of Fish Biology, 74(10), 2269–2278. https://doi.org/10.1111/j.1095-8649.2009.02236.x (gesimuleerde vijvercondities; geen wilde veldcurve)',
      'Elliott, J.M. (1994) Quantitative Ecology and the Brown Trout / Teleost Bioenergetics.',
      'Wootton, R.J. (1998) Ecology of Teleost Fishes, 2nd ed. Kluwer Academic Publishers.',
      'Hepher, B. & Pruginin, Y. (1981) Commercial Fish Farming with special reference to Fish Culture in Israel.',
      'FAO Fisheries Synopsis No. 12 (1981) Biology and Culture of Cyprinus carpio.',
          'Moffitt, B.P. & Crawshaw, L.I. (1983). Effects of Acute Temperature Changes on Metabolism, Heart Rate, and Ventilation Frequency in Carp Cyprinus carpio L. Physiological Zoology, 56(3), 397–403. https://doi.org/10.1086/physzool.56.3.30152604 (acute respons na acclimatisatie op 19 °C; geen volledige temperatuurcurve)',
],
    optimalTempRange: [16, 24],
    tolerableTempRange: [8, 28],
    thermalOptimum: 21.0,
    thermalWidthCold: 5.8,
    thermalWidthWarm: 5.5,
    preferredSlots: ['Avond', 'Nacht'],
    crepuscularBonus: false,
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
      'In-situ onderzoek vond overwegend daggebonden voedselopname en duidelijk lagere maagvulling in de nacht; een vaste schemerpiek is daarmee niet aangetoond.',
      'Een directe, voorspelbare relatie tussen korte luchtdrukschommelingen en aasactiviteit is onvoldoende onderbouwd; luchtdruk wordt daarom niet als soortspecifieke bonus/malus gebruikt.',
      'Matige kabbel (10–22 km/u) brengt natuurlijk voedsel in beweging en verlaagt schuwheid.',
    ],
    scientificReferences: [
      'Volkoff, H. & Rønnestad, I. (2020). Effects of temperature on feeding and digestive processes in fish. Temperature, 7(4), 307–320. https://doi.org/10.1080/23328940.2020.1765950',
      'Tien, N.S.H. et al. (2024). Temperature-related increase in growth rate in four freshwater lake fish species. Journal of Fish Biology. https://doi.org/10.1111/jfb.15745 (groeirelatie; geen directe activiteit- of vangstcurve)',
      'Vašek, M. & Kubečka, J. (2004). In situ diel patterns of zooplankton consumption by subadult/adult roach, bream and bleak. Folia Zoologica, 53, 203–214. (één stuwmeer; zoöplanktonconsumptie)',
      'Lammens, E.H.R.R. (1985) A test of resource partitioning in a gear-selected fish community.',
      'EIFAC Water Quality Criteria for European Freshwater Fish (FAO technical papers).',
      'Nagelkerke, L.A.J. & Sibbing, F.A. (1996) Efficiency of feeding mechanisms in Abramis brama.',
          'Hölker, F. (2006). Effects of body size and temperature on metabolism of bream compared to sympatric roach. Animal Biology, 56(1), 23–37. https://doi.org/10.1163/157075606775904713 (SMR/RMR 5–23 °C; laboratoriumrespons)',
],
    optimalTempRange: [12, 21],
    tolerableTempRange: [6, 26],
    thermalOptimum: 17.5,
    thermalWidthCold: 6.2,
    thermalWidthWarm: 5.8,
    preferredSlots: ['Ochtend', 'Middag', 'Avond'],
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
      'Telemetrie vond in enkele populaties vooral beweging overdag en weinig beweging in de nacht. Bij deze hinderlaagjager is beweging geen directe maat voor jacht: stilstand kan ook foerageergedrag zijn.',
      'Een naderend weersfront kan meerdere omstandigheden tegelijk veranderen; een afzonderlijk positief effect van luchtdruk op jachtactiviteit is niet vastgesteld.',
    ],
    scientificReferences: [
      'Volkoff, H. & Rønnestad, I. (2020). Effects of temperature on feeding and digestive processes in fish. Temperature, 7(4), 307–320. https://doi.org/10.1080/23328940.2020.1765950',
      'Casselman, J.M. (1978) Effects of water temperature on the growth and metabolism of Northern Pike (Esox lucius).',
      'Diana, J.S. (1979) The feeding pattern and daily ration of pike in Lac Ste. Anne, Alberta.',
      'Yazıcıoğlu, O. et al. (2025). Diet and feeding strategy of northern pike in a deep dam lake in Central Anatolia, Türkiye. Folia Biologica (Kraków), 73, 92–103. https://doi.org/10.3409/fb_73-3.10 (seizoensverschillen in maagvulling niet statistisch significant)',
      'Coimbra, J.C. et al. (1998). Feeding rhythm and gastric emptying in the pike (Esox lucius L.) during the feeding changes below one year of age. Annales de Limnologie, 34, 107–116. (alleen jonge snoek; dagactieve jacht en bifasisch planktivoor voedingsritme)',
      'Nilsson, P.A. et al. (2012). Visibility conditions and diel period affect small-scale spatio-temporal behaviour of pike Esox lucius in the absence of prey and conspecifics. Journal of Fish Biology, 80, 2384–2389. https://doi.org/10.1111/j.1095-8649.2012.03284.x (habitatwisselingen pieken bij schemering; geen directe voedingsmeting)',
      'Lucas, M.C. et al. (1991). Direct measurements of metabolism, activity and feeding behaviour of pike, Esox lucius L., in the wild, by the use of heart rate telemetry. Journal of Fish Biology, 39, 325–345. https://doi.org/10.1111/j.1095-8649.1991.tb04366.x (directe voedselopname-/verteringscontext; geen gekwantificeerde tijdvakpiek)',
      'Diana, J.S. (1980). Diel activity pattern and swimming speeds of northern pike (Esox lucius) in Lac Ste. Anne, Alberta. Canadian Journal of Fisheries and Aquatic Sciences, 37, 1454–1458. https://doi.org/10.1139/f80-187 (kleine telemetriesteekproef; beweging vooral overdag, niet gelijk aan jacht)',
      'Craig, J.F. (1996) Pike: Biology and Exploitation. Chapman & Hall.',
          'Diana, J.S. (1982). An experimental analysis of the metabolic rate and food utilization of northern pike. Comparative Biochemistry and Physiology Part A, 71(3), 395–399. https://doi.org/10.1016/0300-9629(82)90424-8 (metabolisme bij beperkte temperatuurpunten; geen volledig optimum)',
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
      'Een veldstudie vond ochtend- en avondpieken in mei/juni, maar een verschuiving naar een middagpiek in juli/augustus. Het dagritme verandert dus met seizoen en prooibeschikbaarheid.',
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
      'Rask, M. (1986). The diet and diel feeding activity of perch, Perca fluviatilis L., in a small lake in southern Finland. Annales Zoologici Fennici, 23, 49–56. https://www.annzool.net/PDF/anzf23/anz23-049-056.pdf (één specifiek meer en zomerperiode)',
          'Christensen, E.A.F., Svendsen, M.B.S. & Steffensen, J.F. (2020). The combined effect of body size and temperature on oxygen consumption rates and the size-dependency of preferred temperature in European perch Perca fluviatilis. Journal of Fish Biology, 97(3), 794–803. https://doi.org/10.1111/jfb.14435 (aerobe scope en temperatuurvoorkeur zijn lichaamsgrootte-afhankelijk)',
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
      'Een boreale meerstudie vond in de herfst een verschuiving van dagvoeding naar schemering bij afkoeling van circa 20 naar 10 °C en lage nachtelijke voedingsactiviteit rond 5 °C. Dit is habitat- en seizoensgebonden en geen universele Nederlandse winterregel.',
      'Reageert positief op zachte westenwind met lichte kabbel; vermijdt storm.',
    ],
    scientificReferences: [
      'Volkoff, H. & Rønnestad, I. (2020). Effects of temperature on feeding and digestive processes in fish. Temperature, 7(4), 307–320. https://doi.org/10.1080/23328940.2020.1765950',
      'Tien, N.S.H. et al. (2024). Temperature-related increase in growth rate in four freshwater lake fish species. Journal of Fish Biology. https://doi.org/10.1111/jfb.15745 (groeirelatie; geen directe activiteit- of vangstcurve)',
      'Goldspink, C.R. (1979) The population density, growth rate and production of roach Rutilus rutilus in Tjeukemeer.',
      'Kubecka, J. (1993) Succession of fish communities in reservoirs of Central and Eastern Europe.',
      'Hautala, A. (2008). Autumnal shift from diurnal to nocturnal peaking feeding activity of Rutilus rutilus in boreal lake littoral zones. Journal of Fish Biology, 73(6), 1407–1418. https://doi.org/10.1111/j.1095-8649.2008.02020.x (boreaal meer; herfst en lichtcontext)',
          'Hölker, F. (2003). The metabolic rate of roach in relation to body size and temperature. Journal of Fish Biology, 62(3), 565–579. https://doi.org/10.1046/j.1095-8649.2003.00048.x (SMR/RMR 5–23 °C; lichaamsgrootte-afhankelijk)',
      'Hölker, F. (2006). Effects of body size and temperature on metabolism of bream compared to sympatric roach. Animal Biology, 56(1), 23–37. https://doi.org/10.1163/157075606775904713 (vergelijkende laboratoriumstudie met brasem)',
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
      'In één klein eutroof water werden de hoogste voedingsintensiteiten gemeten tussen 18:00–21:00 en 00:00–03:00. Dit is een lokale veldbevinding; zeelt vertoonde ook in gecontroleerd onderzoek sterk nachtelijk gedrag, maar dit is geen universele kloktijd voor ieder water.',
      'Kille noordenwind en plotselinge koufronten zetten zeelt vrijwel direct stil.',
    ],
    scientificReferences: [
      'Volkoff, H. & Rønnestad, I. (2020). Effects of temperature on feeding and digestive processes in fish. Temperature, 7(4), 307–320. https://doi.org/10.1080/23328940.2020.1765950',
      'Benjamin, C., Hill, J. & Ricciardi, A. (2026). Thermal effects on feeding efficiency and body condition in invasive and native benthivorous freshwater fishes. Biological Invasions, 28, 51. https://doi.org/10.1007/s10530-026-03767-w (experimentele voedselopname; beperkte overdraagbaarheid naar Nederlandse veldsituaties)',
      'Neophitou, C. (1993) Some biological data on tench (Tinca tinca L.) in Lake Pamvotis, Greece.',
      'Bryant, P. et al. (1980) Aquaculture of cyprinids: Environmental requirements and feeding of tench.',
      'Bezmaternykh, V.V. & Shcherbina, G.K. (2018). Feeding of Tench Tinca tinca in a Small Eutrophic Water Body. Journal of Ichthyology, 58(4), 545–551. https://doi.org/10.1134/S003294521804001X (één klein water; voedingspieken 18–21 en 00–03)',
    ],
    optimalTempRange: [16, 24],
    tolerableTempRange: [11, 27],
    thermalOptimum: 20.5,
    thermalWidthCold: 5.0,
    thermalWidthWarm: 5.0,
    preferredSlots: ['Ochtend', 'Avond'],
    crepuscularBonus: false,
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
    description: 'Lichtschuwe diepwaterjager met reflecterend netvlies (tapetum lucidum). Telemetrieonderzoek vindt vaak een bewegingspiek rond de schemering, maar individuele, seizoens- en habitatverschillen zijn duidelijk.',
    assumptions: [
      'Bewegingsactiviteit piekt in meerdere telemetriestudies rond de schemering. Nachtelijke aanwezigheid in ondiep water kan rust zijn en bewijst geen nachtelijke jacht- of voedingspiek.',
      'Gedijt in koel tot matig water (8–18 °C).',
      'Troebel water en stabiele luchtdruk verhogen de jachtactiviteit.',
    ],
    scientificReferences: [
      'Volkoff, H. & Rønnestad, I. (2020). Effects of temperature on feeding and digestive processes in fish. Temperature, 7(4), 307–320. https://doi.org/10.1080/23328940.2020.1765950',
      'Tien, N.S.H. et al. (2024). Temperature-related increase in growth rate in four freshwater lake fish species. Journal of Fish Biology. https://doi.org/10.1111/jfb.15745 (groeirelatie; geen directe activiteit- of vangstcurve)',
      'Fedorova, G.V. & Drozhzina, K.S. (1982). Daily feeding rhythm of pike-perch, Stizostedion lucioperca, and perch, Perca fluviatilis, from Lake Ladoga. Journal of Ichthyology, 22, 52–60 (vroege ochtendpiek juni–augustus; tweede avondpiek in september; één meer)',
      'Poulet, N. et al. (2005). Diel activity of adult pikeperch Sander lucioperca in a drainage canal in the Mediterranean basin during spring. Hydrobiologia, 543, 79–90. https://doi.org/10.1007/s10750-004-6823-6 (schemeringspiek in beweging; voorjaar en individuele variatie)',
      'Horký, P., Slavík, O. & Bartoš, L. (2008). A telemetry study on the diurnal distribution and activity of adult pikeperch in a riverine environment. Hydrobiologia, 614, 151–157. https://doi.org/10.1007/s10750-008-9503-0 (nachtelijke oeverpositie waarschijnlijk rust, niet jacht)',
      'Lappalainen, J. et al. (2003) Sander lucioperca biology and management in European freshwaters.',
      'Van Densen, W.L.T. (1985) Feeding and growth of 0+ pikeperch in relation to prey density.',
      'Malinovskyi, O. et al. (2020). Feeding activity of pikeperch under winter and spring photothermal conditions of pre-spawning period. Aquaculture Research, 51(2), 852–857. https://doi.org/10.1111/are.14401 (gekweekte broedvis)',
      'Vašek, M. et al. (2018). Stable isotopes and gut contents indicate differential resource use by coexisting asp and pikeperch. Ecology of Freshwater Fish, 27, 1054–1065. https://doi.org/10.1111/eff.12414 (levensfase-/prooikeuze in twee reservoirs)',
          'Frisk, M., Skov, P.V. & Steffensen, J.F. (2012). Thermal optimum for pikeperch (Sander lucioperca) and the use of ventilation frequency as a predictor of metabolic rate. Aquaculture, 324–325, 151–157. https://doi.org/10.1016/j.aquaculture.2011.10.024 (volwassen kweekvis; aerobe scope en ontogenetische verschuiving)',
],
    optimalTempRange: [10, 18],
    tolerableTempRange: [5, 24],
    thermalOptimum: 15.0,
    thermalWidthCold: 6.2,
    thermalWidthWarm: 6.0,
    preferredSlots: ['Ochtend', 'Avond'],
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
      'Yazici, R. et al. (2025). Exploring Prey Selectivity and Feeding Habits of Wels Catfish in a Deep Anatolian Reservoir. Aquaculture Nutrition, 2025, Article 4619857. https://doi.org/10.1155/anu/4619857 (maaginhoud; lengte-/leeftijds- en seizoenscontext)',
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
      'Vašek, M. et al. (2018). Stable isotopes and gut contents indicate differential resource use by coexisting asp and pikeperch. Ecology of Freshwater Fish, 27, 1054–1065. https://doi.org/10.1111/eff.12414 (levensfase-/prooikeuze in twee reservoirs)',
      'Kärgenberg, E. et al. (2022). Annual and diel activity cycles of a northern population of the large migratory cyprinid fish asp (Leuciscus aspius). Environmental Biology of Fishes, 105, 1697–1711. https://doi.org/10.1007/s10641-022-01298-6 (53 volwassen vissen; seizoensafhankelijke bewegingspieken rond dageraad/schemering)',
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
      'Gebruikt een gewogen ecologisch gemiddelde. Er is geen soortspecifiek dag-/nachtritme voor dit fallbackprofiel vastgesteld.',
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
    preferredSlots: [],
    crepuscularBonus: false,
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
    description = `Temperatuur (${temp.toFixed(1)} °C) valt binnen het voorlopige profielbereik (${optimalTempRange[0]}–${optimalTempRange[1]} °C) voor ${species}. De thermische curve schat hier een relatief hoge efficiëntie (${(efficiency * 100).toFixed(0)}%); dit is geen gemeten activiteit of voedselopname.`;
  } else if (temp < optimalTempRange[0] && temp >= tolerableTempRange[0]) {
    impact = efficiency < 0.45 ? 'negatief' : 'neutraal';
    description = `Temperatuur (${temp.toFixed(1)} °C) ligt onder het voorlopige profieloptimum van ${species}. De thermische curve schat een lagere relatieve efficiëntie dan rond het optimum (${(efficiency * 100).toFixed(0)}%); dit meet niet rechtstreeks hoeveel de vis beweegt of foerageert.`;
  } else if (temp < tolerableTempRange[0]) {
    impact = 'negatief';
    description = `Watertemperatuur (${temp.toFixed(1)} °C) ligt onder de voorlopige ondergrens van het profiel voor ${species}. De thermische curve schat daardoor een lage relatieve efficiëntie (${(efficiency * 100).toFixed(0)}%). Deze profielgrens is geen gevalideerde fysiologische tolerantiegrens en stelt op zichzelf geen winterrust of stop van voedselopname vast.`;
  } else {
    impact = 'negatief';
    description = `Watertemperatuur (${temp.toFixed(1)} °C) ligt boven de voorlopige bovengrens van het profiel voor ${species}. De thermische curve schat een lagere relatieve efficiëntie (${(efficiency * 100).toFixed(0)}%). Hoge temperatuur alleen bewijst hier geen zuurstofstress: opgeloste zuurstof wordt niet gemeten.`;
  }

  return { efficiency, description, impact };
}
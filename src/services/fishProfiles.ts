import { FishSpecies } from '../types';

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
  thermalOptimum: number;
  thermalWidthCold: number;
  thermalWidthWarm: number;
}

export const SPECIES_PROFILES: Record<FishSpecies, SpeciesProfile> = {
  Karper: {
    species: 'Karper',
    dutchName: 'Karper (Cyprinus carpio)',
    scientificName: 'Cyprinus carpio',
    description: 'Warmteminnende ectotherme bodemazer. Watertemperatuur beïnvloedt stofwisseling en voedselopname, maar de dagelijkse voedingspiek verschilt per water, seizoen, levensfase en voedselaanbod.',
    assumptions: [
      'Afkoeling verlaagt doorgaans metabolisme en voedselopname. Acclimatisatie, lichaamsgrootte, conditie en watertype beïnvloeden de respons; een universele grens voor winterrust is niet vastgesteld.',
      'Veldstudies tonen verschillende dagritmes: wilde rivierkarper kan pieken rond zonsopkomst en zonsondergang; bijgevoerd meeronderzoek vond vaker nachtelijke consumptie; jonge karper in gesimuleerde vijvers vertoonde geen duidelijke dagelijkse piek. Er is geen vaste nachtvoorkeur.',
      'De thermische optimum- en breedtewaarden in dit profiel zijn voorlopige modelprioren, geen gemeten optimum voor volwassen karper in Nederlandse wateren.',
      'Algemene datakwaliteitsregel: koude lucht niet gelijkstaat aan koude watermassa; lage luchttemperatuur leidt niet automatisch tot winterrust zolang de watermassa warmer blijft. Gebruik gemeten of geschatte watertemperatuur; dit is geen karperspecifieke biologische voorkeur.',
      'Wind en luchtdruk zijn geen gevalideerde zelfstandige compensatie voor een thermische beperking en leveren geen numerieke activiteitbonus.',
    ],
    scientificReferences: [
      'Bernier, N.J., Gorissen, M.H.A.G. & Flik, G. (2012). Differential effects of chronic hypoxia and feed restriction on the expression of leptin and its receptor, food intake regulation and the endocrine stress response in common carp. Journal of Experimental Biology, 215(13), 2273–2282. https://doi.org/10.1242/jeb.066183 (27 karpers; 10% O₂-verzadiging gaf 79% lagere voedselopname; ernstige laboratoriumhypoxie)',
      'Volkoff, H. & Rønnestad, I. (2020). Effects of temperature on feeding and digestive processes in fish. Temperature, 7(4), 307–320. https://doi.org/10.1080/23328940.2020.1765950',


      'Garcia, L.M. & Adelman, I.R. (1985). An in situ estimate of daily food consumption and alimentary canal evacuation rates of common carp, Cyprinus carpio L. Journal of Fish Biology, 27(4), 487–493. https://doi.org/10.1111/j.1095-8649.1985.tb03196.x (veldschatting via darmlediging; geen significant ochtend-/avondverschil)',
      'Specziár, A. (2002). An in situ estimate of food consumption of five cyprinid species in Lake Balaton. Journal of Fish Biology, 60(5), 1237–1251. https://doi.org/10.1111/j.1095-8649.2002.tb01717.x (rantsoen geschat met Eggers/Elliott–Persson; één meer; contextgebonden temperatuurrelatie)',
      'Chen, S., Chen, W. & Fan, Z. (2012). Effect of Water Temperature on Feeding Rhythm in Common Carp (Cyprinus carpio haematopterus Temminck et Schlegel). Journal of Northeast Agricultural University (English Edition), 19(1), 57–61. https://doi.org/10.1016/S1006-8104(12)60039-7 (abstract: 4–34 °C; adult 630–850 g en young 61–91 g; ochtend-/avondpieken; gecontroleerde studie, geen veldvangstdata)',
      'Rahman, M.M. & Meyer, C.G. (2009). Effects of food type on diel behaviours of common carp Cyprinus carpio in simulated aquaculture pond conditions. Journal of Fish Biology, 74(10), 2269–2278. https://doi.org/10.1111/j.1095-8649.2009.02236.x (gesimuleerde vijvercondities; geen wilde veldcurve)',
      'Kwak, T.J., Wiley, M.J., Osborne, L.L. & Larimore, R.W. (1992). The application of diel feeding chronology to habitat suitability analysis of warmwater stream fishes. Canadian Journal of Fisheries and Aquatic Sciences, 49(7), 1417–1430. https://doi.org/10.1139/f92-157 (natuurlijk rivieronderzoek; discontinu en variabel voeren, met gemiddelde pieken rond zonsopkomst en zonsondergang)',
      'Elliott, J.M. (1994) Quantitative Ecology and the Brown Trout / Teleost Bioenergetics.',
      'Wootton, R.J. (1998) Ecology of Teleost Fishes, 2nd ed. Kluwer Academic Publishers.',
      'Hepher, B. & Pruginin, Y. (1981) Commercial Fish Farming with special reference to Fish Culture in Israel.',
      'FAO Fisheries Synopsis No. 12 (1981) Biology and Culture of Cyprinus carpio.',
          'Moffitt, B.P. & Crawshaw, L.I. (1983). Effects of Acute Temperature Changes on Metabolism, Heart Rate, and Ventilation Frequency in Carp Cyprinus carpio L. Physiological Zoology, 56(3), 397–403. https://doi.org/10.1086/physzool.56.3.30152604 (acute respons na acclimatisatie op 19 °C; geen volledige temperatuurcurve)',
],
    thermalOptimum: 21.0,
    thermalWidthCold: 5.8,
    thermalWidthWarm: 5.5,
  },
  Brasem: {
    species: 'Brasem',
    dutchName: 'Brasem (Abramis brama)',
    scientificName: 'Abramis brama',
    description: 'Scholenvis en bodem-/planktoneter. Veldonderzoek toont dat voedselopname en habitatgebruik verschillen met levensfase, seizoen en prooiaanbod; een universeel dagritme is niet vastgesteld.',
    assumptions: [
      'In-situ onderzoek bij subadulte en volwassen brasem vond overwegend daggebonden zoöplanktonconsumptie; onderzoek aan juveniele pelagische vis vond juist nachtelijke voedselopname. Levensfase en habitat begrenzen de overdraagbaarheid.',
      'Metabolisme is onderzocht over meerdere watertemperaturen, maar groei- en stofwisselingsdata leveren geen directe vangstcurve of exact veldoptimum. De thermische profielcurve blijft voorlopig.',
      'Een soortspecifieke drukgevoeligheid of vaste wind-/kabbelgrens is niet voldoende onderbouwd. Deze factoren leveren geen numerieke activiteitbonus.',
      'Windgedreven verplaatsing van natuurlijk voedsel is een mogelijke lokale tactische hypothese, geen gevalideerde brasem-activiteitsregel.',
    ],
    scientificReferences: [
      'Hansen, J.H., Brodersen, J., Baktoft, H. & Skov, C. (2019). Relationship between bream (Abramis brama) activity and water turbidity in a shallow lake under different season conditions. Journal of Limnology. https://doi.org/10.4081/jlimnol.2019.1883 (448 vissen, vier jaar; activiteit en troebelheid in één ondiep meer; geen directe voedselopnamemeting)',
      'Specziár, A. (2002). An in situ estimate of food consumption of five cyprinid species in Lake Balaton. Journal of Fish Biology, 60(5), 1237–1251. https://doi.org/10.1111/j.1095-8649.2002.tb01717.x (modelgeschat rantsoen; temperatuurrelatie gevoelig voor één brasemwaarneming)',
      'Volkoff, H. & Rønnestad, I. (2020). Effects of temperature on feeding and digestive processes in fish. Temperature, 7(4), 307–320. https://doi.org/10.1080/23328940.2020.1765950',
      'Tien, N.S.H. et al. (2024). Temperature-related increase in growth rate in four freshwater lake fish species. Journal of Fish Biology. https://doi.org/10.1111/jfb.15745 (groeirelatie; geen directe activiteit- of vangstcurve)',
      'Vašek, M. & Kubečka, J. (2004). In situ diel patterns of zooplankton consumption by subadult/adult roach, bream and bleak. Folia Zoologica, 53, 203–214. (één stuwmeer; zoöplanktonconsumptie)',
      'Bohl, E. (1979). Diel pattern of pelagic distribution and feeding in planktivorous fish. Oecologia, 44(3), 368–375. https://doi.org/10.1007/BF00545241 (juveniele blankvoorn en brasem; nachtelijke pelagische voeding in Beierse meren)',
      'Lammens, E.H.R.R. (1985). A test of a model for planktivorous filter feeding by bream Abramis brama. Environmental Biology of Fishes, 13(4), 289–296. https://doi.org/10.1007/BF00002913 (prooigroottekeuze en filtervoedingsmechanisme; geen voedingsintensiteit of dagritme)',
      'EIFAC Water Quality Criteria for European Freshwater Fish (FAO technical papers).',
      'Nagelkerke, L.A.J. & Sibbing, F.A. (1996). Efficiency of feeding on zebra mussel (Dreissena polymorpha) by common bream (Abramis brama), white bream (Blicca bjoerkna), and roach (Rutilus rutilus): the effects of morphology and behavior. Canadian Journal of Fisheries and Aquatic Sciences, 53(12), 2847–2861. (voedingsmechanica en efficiëntie; geen dagritme of dagelijkse voedselopname)',
          'Hölker, F. (2006). Effects of body size and temperature on metabolism of bream compared to sympatric roach. Animal Biology, 56(1), 23–37. https://doi.org/10.1163/157075606775904713 (SMR/RMR 5–23 °C; laboratoriumrespons)',
],
    thermalOptimum: 17.5,
    thermalWidthCold: 6.2,
    thermalWidthWarm: 5.8,
  },
  Snoek: {
    species: 'Snoek',
    dutchName: 'Snoek (Esox lucius)',
    scientificName: 'Esox lucius',
    description: 'Koudwatertolerante visuele hinderlaagjager. Voedselopname, beweging en habitatwisselingen zijn verschillende responsen: weinig beweging kan ook passen bij stilstaand jachtgedrag.',
    assumptions: [
      'Directe hartslagtelemetrie registreerde voedselopname bij wilde snoek, maar de steekproef was klein. Dagactieve voedingspatronen bij jonge 0+ snoek zijn niet zonder meer overdraagbaar op volwassen snoek.',
      'Telemetrie vond in sommige populaties meer beweging overdag en weinig beweging in de nacht. Bewegingsactiviteit is geen directe maat voor jacht- of voedselopname.',
      'Temperatuur beïnvloedt de fysiologie, maar de exacte thermische optimum- en breedtewaarden in dit profiel zijn niet gevalideerd als veldcurve voor voedselopname of vangbaarheid.',
      'Licht, zicht en troebelheid kunnen de prooiwaarneming beïnvloeden. Er is geen gevalideerde soortspecifieke wolken-, regen-, wind- of drukdrempel voor de activiteitsscore.',
    ],
    scientificReferences: [
      'Volkoff, H. & Rønnestad, I. (2020). Effects of temperature on feeding and digestive processes in fish. Temperature, 7(4), 307–320. https://doi.org/10.1080/23328940.2020.1765950',
      'Casselman, J.M. (1978). Effects of environmental factors on growth, survival, activity, and exploitation of northern pike. American Fisheries Society Special Publication 11, 114–128. (groei en laboratoriumzwemactiviteit; geen directe veldvoedingsritmecurve)',
      'Diana, J.S. (1979) The feeding pattern and daily ration of pike in Lac Ste. Anne, Alberta.',
      'Yazıcıoğlu, O. et al. (2025). Diet and feeding strategy of northern pike in a deep dam lake in Central Anatolia, Türkiye. Folia Biologica (Kraków), 73, 92–103. https://doi.org/10.3409/fb_73-3.10 (seizoensverschillen in maagvulling niet statistisch significant)',
      'Nilsson-Örtman, V. et al. (2026). Effects of temperature and browning on the functional response of a freshwater top predator. Journal of Animal Ecology, 95, 824–836. https://doi.org/10.1111/1365-2656.70233 (directe prooiconsumptie bij jonge 0+-snoek; zwakke temperatuureffecten; geen volwassen veldcurve)',
      'Coimbra, J.C. et al. (1998). Feeding rhythm and gastric emptying in the pike (Esox lucius L.) during the feeding changes below one year of age. Annales de Limnologie, 34, 107–116. (alleen jonge snoek; dagactieve jacht en bifasisch planktivoor voedingsritme)',
      'Nilsson, P.A. et al. (2012). Visibility conditions and diel period affect small-scale spatio-temporal behaviour of pike Esox lucius in the absence of prey and conspecifics. Journal of Fish Biology, 80, 2384–2389. https://doi.org/10.1111/j.1095-8649.2012.03284.x (habitatwisselingen pieken bij schemering; geen directe voedingsmeting)',
      'Lucas, M.C. et al. (1991). Direct measurements of metabolism, activity and feeding behaviour of pike, Esox lucius L., in the wild, by the use of heart rate telemetry. Journal of Fish Biology, 39, 325–345. https://doi.org/10.1111/j.1095-8649.1991.tb04366.x (directe voedselopname-/verteringscontext; geen gekwantificeerde tijdvakpiek)',
      'Diana, J.S. (1980). Diel activity pattern and swimming speeds of northern pike (Esox lucius) in Lac Ste. Anne, Alberta. Canadian Journal of Fisheries and Aquatic Sciences, 37, 1454–1458. https://doi.org/10.1139/f80-187 (kleine telemetriesteekproef; beweging vooral overdag, niet gelijk aan jacht)',
      'Craig, J.F. (1996) Pike: Biology and Exploitation. Chapman & Hall.',
          'Diana, J.S. (1982). An experimental analysis of the metabolic rate and food utilization of northern pike. Comparative Biochemistry and Physiology Part A, 71(3), 395–399. https://doi.org/10.1016/0300-9629(82)90424-8 (metabolisme bij beperkte temperatuurpunten; geen volledig optimum)',
],
    thermalOptimum: 12.5,
    thermalWidthCold: 6.5,
    thermalWidthWarm: 6.0,
  },
  Baars: {
    species: 'Baars',
    dutchName: 'Baars (Perca fluviatilis)',
    scientificName: 'Perca fluviatilis',
    description: 'Scholenvis en visuele jager. Veldonderzoek laat seizoensgebonden verschuivingen in voedingsritme zien; lichaamsgrootte beïnvloedt bovendien de fysiologische temperatuurrespons.',
    assumptions: [
      'Veldstudies vonden in sommige maanden ochtend- en avondpieken en in andere maanden een middagpiek. Dit zijn contextgebonden waarnemingen, geen vaste kloktijden voor ieder water.',
      'Lichaamsgrootte en temperatuur beïnvloeden zuurstofverbruik en aerobe scope. Dit fysiologische bewijs is geen directe vangst- of voedselopnamecurve.',
      'Een zelfstandig effect van stabiele luchtdruk op jachtgedrag is niet betrouwbaar vastgesteld; er wordt geen drukbonus toegepast.',
      'Zichtomstandigheden kunnen visueel jagen beïnvloeden, maar er is geen gevalideerde soortspecifieke drempel voor bewolking, regen of troebelheid.',
    ],
    scientificReferences: [
      'Nakayama, S., Doering-Arjes, P., Linzmaier, S., Briege, J., Klefoth, T., Pieterek, T. & Arlinghaus, R. (2018). Fine-scale movement ecology of a freshwater top predator, Eurasian perch (Perca fluviatilis), in response to the abiotic environment over the course of a year. Ecology of Freshwater Fish, 27(3), 798–812. https://doi.org/10.1111/eff.12393 (16 volwassen baarzen; temperatuur/licht dominanter dan druk/wind; beweging, geen directe voedselopname)',
      'Volkoff, H. & Rønnestad, I. (2020). Effects of temperature on feeding and digestive processes in fish. Temperature, 7(4), 307–320. https://doi.org/10.1080/23328940.2020.1765950',
      'Tien, N.S.H. et al. (2024). Temperature-related increase in growth rate in four freshwater lake fish species. Journal of Fish Biology. https://doi.org/10.1111/jfb.15745 (groeirelatie; geen directe activiteit- of vangstcurve)',
      'Craig, J.F. (1987) The Biology of Perch and Related Fish. Croom Helm.',
      'Le Cren, E.D. (1958) Observations on the growth of perch (Perca fluviatilis) over twenty-two years.',
      'Thorpe, J.E. (1977) Synopsis of biological data on the perch. FAO Fisheries Synopsis No. 113.',
      'Rask, M. (1986). The diet and diel feeding activity of perch, Perca fluviatilis L., in a small lake in southern Finland. Annales Zoologici Fennici, 23, 49–56. https://www.annzool.net/PDF/anzf23/anz23-049-056.pdf (één specifiek meer en zomerperiode)',
      'Thorpe, J.E. (1977). Daily ration of adult perch, Perca fluviatilis L. during summer in Loch Leven, Scotland. Journal of Fish Biology, 11(1), 55–68. https://doi.org/10.1111/j.1095-8649.1977.tb04098.x (volwassen veldbaars; rantsoenschatting met minimale waarden door tragere maaglediging bij kooivissen)',
      'Bretzel, J.B. et al. (2021). Feeding Ecology of Invasive Three-Spined Stickleback (Gasterosteus aculeatus) in Relation to Native Juvenile Eurasian Perch (Perca fluviatilis) in the Pelagic Zone of Upper Lake Constance. Frontiers in Environmental Science, 9. https://doi.org/10.3389/fenvs.2021.670125 (juveniele 0+ baars; 24-uursanalyse herfst 2018)',
      'Sandberg, L. (2020). Movement of the Eurasian perch (Perca fluviatilis) – individual responses to abiotic factors. Umeå University, Degree Thesis in Biology, 15 ECTS. https://umu.diva-portal.org/smash/get/diva2:1446518/FULLTEXT01.pdf (beweging; druk- en temperatuureffecten verschilden tussen drie meren; geen directe voedselopname)',
          'Christensen, E.A.F., Svendsen, M.B.S. & Steffensen, J.F. (2020). The combined effect of body size and temperature on oxygen consumption rates and the size-dependency of preferred temperature in European perch Perca fluviatilis. Journal of Fish Biology, 97(3), 794–803. https://doi.org/10.1111/jfb.14435 (aerobe scope en temperatuurvoorkeur zijn lichaamsgrootte-afhankelijk)',
],
    thermalOptimum: 16.5,
    thermalWidthCold: 6.0,
    thermalWidthWarm: 5.5,
  },
  Voorn: {
    species: 'Voorn',
    dutchName: 'Blankvoorn (Rutilus rutilus)',
    scientificName: 'Rutilus rutilus',
    description: 'Flexibele alleseter met een brede temperatuurtolerantie. Dagelijkse voedselopname verschuift met seizoen, leeftijd, habitat en prooiaanbod; er is geen universele dag-/nachtregel.',
    assumptions: [
      'Een boreale meerstudie vond in de herfst een verschuiving van dagvoeding naar schemering bij afkoeling. Dit is habitat- en seizoensgebonden en geen universele Nederlandse winterregel.',
      'Onderzoek aan subadulte/volwassen vis en aan juveniele pelagische vis laat verschillende dag-nachtpatronen zien. Levensfase en voedseltype moeten daarom gescheiden blijven.',
      'Metabolisme is over meerdere temperaturen onderzocht en is lichaamsgrootte-afhankelijk. De thermische optimum- en breedtewaarden in dit profiel zijn voorlopige prioren.',
      'Een vaste voorkeur voor westenwind of een soortspecifieke stormdrempel is niet voldoende onderbouwd; wind levert geen numerieke activiteitbonus.',
    ],
    scientificReferences: [
      'Volkoff, H. & Rønnestad, I. (2020). Effects of temperature on feeding and digestive processes in fish. Temperature, 7(4), 307–320. https://doi.org/10.1080/23328940.2020.1765950',
      'Tien, N.S.H. et al. (2024). Temperature-related increase in growth rate in four freshwater lake fish species. Journal of Fish Biology. https://doi.org/10.1111/jfb.15745 (groeirelatie; geen directe activiteit- of vangstcurve)',
      'Goldspink, C.R. (1979). The population density, growth rate and production of roach Rutilus rutilus (L.) in Tjeukemeer, The Netherlands. Journal of Fish Biology, 15(4), 473–498. https://doi.org/10.1111/j.1095-8649.1979.tb03632.x (populatie, groei en productie; geen dagdeelvoedingsmeting)',
      'Kubecka, J. (1993) Succession of fish communities in reservoirs of Central and Eastern Europe.',
      'Hautala, A. (2008). Autumnal shift from diurnal to nocturnal peaking feeding activity of Rutilus rutilus in boreal lake littoral zones. Journal of Fish Biology, 73(6), 1407–1418. https://doi.org/10.1111/j.1095-8649.2008.02020.x (boreaal meer; herfst en lichtcontext)',
      'Bohl, E. (1979). Diel pattern of pelagic distribution and feeding in planktivorous fish. Oecologia, 44(3), 368–375. https://doi.org/10.1007/BF00545241 (juveniele blankvoorn en brasem; nachtelijke pelagische voeding in Beierse meren)',
          'Hölker, F. (2003). The metabolic rate of roach in relation to body size and temperature. Journal of Fish Biology, 62(3), 565–579. https://doi.org/10.1046/j.1095-8649.2003.00048.x (SMR/RMR 5–23 °C; lichaamsgrootte-afhankelijk)',
      'Hölker, F. (2006). Effects of body size and temperature on metabolism of bream compared to sympatric roach. Animal Biology, 56(1), 23–37. https://doi.org/10.1163/157075606775904713 (vergelijkende laboratoriumstudie met brasem)',
      'Haertel, S.S. & Eckmann, R. (2002). Diel diet shift of roach and its implications for the estimation of daily rations. Journal of Fish Biology, 60, 876–892. https://doi.org/10.1111/j.1095-8649.2002.tb02415.x (12-ha mesotroof meer; dag-nachtverschuiving dieet/habitat en seizoensafhankelijke voedingsintensiteit)',
      'Specziár, A. (2002). An in situ estimate of food consumption of five cyprinid species in Lake Balaton. Journal of Fish Biology, 60(5), 1237–1251. https://doi.org/10.1111/j.1095-8649.2002.tb01717.x (modelgeschat rantsoen; één meer; historische veldcontext)',
      'Jacobsen, L., Berg, S., Jepsen, N. & Skov, C. (2004). Does roach behaviour differ between shallow lakes of different environmental state? Journal of Fish Biology, 65, 135–147. https://doi.org/10.1111/j.0022-1112.2004.00436.x (radio-telemetrie; beweging/habitat, geen directe voedselopname)',
      'Jamet, J.L., Gres, P., Lair, N. & Lasserre, G. (1990). Diel feeding cycle of roach in eutrophic Lake Aydat. Archiv für Hydrobiologie, 118(3), 371–382. https://doi.org/10.1127/archiv-hydrobiol/118/1990/371 (leeftijdsafhankelijk; 253 vissen, 98–240 mm)',
      'Vašek, M. & Kubečka, J. (2004). In situ diel patterns of zooplankton consumption by subadult/adult roach, bream and bleak. Folia Zoologica, 53, 203–214. https://www.hbu.cas.cz/publikace/strana-7/?employeeId=651 (subadult/adult; lengte- en maandafhankelijk)',
],
    thermalOptimum: 15.0,
    thermalWidthCold: 6.5,
    thermalWidthWarm: 6.0,
  },
  Zeelt: {
    species: 'Zeelt',
    dutchName: 'Zeelt (Tinca tinca)',
    scientificName: 'Tinca tinca',
    description: 'Benthische vis die vaak met vegetatie en zachte bodem wordt geassocieerd. Directe veldgegevens tonen lokale avond- en nachtelijke voedselpieken, maar geen universele kloktijd.',
    assumptions: [
      'Een veldstudie in één klein eutroof water vond hogere voedingsintensiteit in de avond en rond middernacht; gecontroleerd onderzoek ondersteunt nachtelijk gedrag. De uitkomst is contextgebonden.',
      'Temperatuur beïnvloedt de voedingsfysiologie, maar een harde grens onder 12 °C of een universeel optimaal voedingsbereik is niet vastgesteld voor alle Nederlandse wateren.',
      'Een kille noordenwind of koufront kan met veranderde omstandigheden samenvallen, maar een zelfstandig soortspecifiek effect is niet voldoende onderbouwd.',
      'Zuurstoftolerantie is geen maat voor optimale activiteit of vangbaarheid; de app meet opgeloste zuurstof niet.',
    ],
    scientificReferences: [
      'Volkoff, H. & Rønnestad, I. (2020). Effects of temperature on feeding and digestive processes in fish. Temperature, 7(4), 307–320. https://doi.org/10.1080/23328940.2020.1765950',
      'Benjamin, C., Hill, J. & Ricciardi, A. (2026). Thermal effects on feeding efficiency and body condition in invasive and native benthivorous freshwater fishes. Biological Invasions, 28, 51. https://doi.org/10.1007/s10530-026-03767-w (experimentele voedselopname; beperkte overdraagbaarheid naar Nederlandse veldsituaties)',
      'Neophitou, C. (1993). Some biological data on tench (Tinca tinca (L.)) in Lake Pamvotida (Greece). Acta Hydrobiologica, 35(4), 367–379. (groei, maturiteit en voortplantingsperiode; geen dagdeelvoedingsmeting)',
      'Bryant, P. et al. (1980) Aquaculture of cyprinids: Environmental requirements and feeding of tench.',
      'Bezmaternykh, V.V. & Shcherbina, G.K. (2018). Feeding of Tench Tinca tinca (Cyprinidae) in a Small Eutrophic Water Body. Journal of Ichthyology, 58(4), 545–551. https://doi.org/10.1134/S003294521804001X (90 vissen, 66 met voedsel; één 1,9-ha water; 3-uurs bemonstering; pieken 18–21 en 00–03)',
    ],
    thermalOptimum: 20.5,
    thermalWidthCold: 5.0,
    thermalWidthWarm: 5.0,
  },
  Snoekbaars: {
    species: 'Snoekbaars',
    dutchName: 'Snoekbaars (Sander lucioperca)',
    scientificName: 'Sander lucioperca',
    description: 'Lichtgevoelige roofvis. Telemetrie beschrijft schemergebonden beweging en wisselend dieptegebruik; aanwezigheid in ondiep water bewijst geen actieve voedselopname.',
    assumptions: [
      'Telemetrie vond in meerdere omgevingen schemergebonden bewegingspieken. Nachtelijke aanwezigheid in ondiep water kan rust of verplaatsing zijn en bewijst geen nachtelijke jachtpiek.',
      'Thermische fysiologiestudies betreffen deels volwassen kweekvis en laten levensfase-/lichaamsgrootte-effecten zien. De huidige thermische profielcurve is geen gevalideerd veldoptimum.',
      'Troebelheid kan de visuele jachtomstandigheden veranderen, maar de richting van het effect hangt af van licht, prooi en habitat. Een zelfstandig effect van stabiele luchtdruk is niet gevalideerd.',
    ],
    scientificReferences: [
      'Volkoff, H. & Rønnestad, I. (2020). Effects of temperature on feeding and digestive processes in fish. Temperature, 7(4), 307–320. https://doi.org/10.1080/23328940.2020.1765950',
      'Tien, N.S.H. et al. (2024). Temperature-related increase in growth rate in four freshwater lake fish species. Journal of Fish Biology. https://doi.org/10.1111/jfb.15745 (groeirelatie; geen directe activiteit- of vangstcurve)',
      'Fedorova, G.V. & Drozhzina, K.S. (1982). Daily feeding rhythm of pike-perch, Stizostedion lucioperca, and perch, Perca fluviatilis, from Lake Ladoga. Journal of Ichthyology, 22, 52–60 (vroege ochtendpiek juni–augustus; tweede avondpiek in september; één meer)',
      'Poulet, N. et al. (2005). Diel activity of adult pikeperch Sander lucioperca in a drainage canal in the Mediterranean basin during spring. Hydrobiologia, 543, 79–90. https://doi.org/10.1007/s10750-004-6823-6 (schemeringspiek in beweging; voorjaar en individuele variatie)',
      'Horký, P., Slavík, O. & Bartoš, L. (2008). A telemetry study on the diurnal distribution and activity of adult pikeperch in a riverine environment. Hydrobiologia, 614, 151–157. https://doi.org/10.1007/s10750-008-9503-0 (nachtelijke oeverpositie waarschijnlijk rust, niet jacht)',
      'Lappalainen, J., Dörner, H. & Wysujack, K. (2003). Reproduction biology of pikeperch (Sander lucioperca (L.)) – a review. Ecology of Freshwater Fish, 12(2), 95–106. https://doi.org/10.1034/j.1600-0633.2003.00005.x (voortplanting en paaigedrag; geen dagelijkse voedingsactiviteit)',
      'Van Densen, W.L.T. (1985) Feeding and growth of 0+ pikeperch in relation to prey density.',
      'Malinovskyi, O. et al. (2020). Feeding activity of pikeperch under winter and spring photothermal conditions of pre-spawning period. Aquaculture Research, 51(2), 852–857. https://doi.org/10.1111/are.14401 (gekweekte broedvis)',
      'Vašek, M. et al. (2018). Stable isotopes and gut contents indicate differential resource use by coexisting asp and pikeperch. Ecology of Freshwater Fish, 27, 1054–1065. https://doi.org/10.1111/eff.12414 (levensfase-/prooikeuze in twee reservoirs)',
          'Frisk, M., Skov, P.V. & Steffensen, J.F. (2012). Thermal optimum for pikeperch (Sander lucioperca) and the use of ventilation frequency as a predictor of metabolic rate. Aquaculture, 324–325, 151–157. https://doi.org/10.1016/j.aquaculture.2011.10.024 (volwassen kweekvis; aerobe scope en ontogenetische verschuiving)',
],
    thermalOptimum: 15.0,
    thermalWidthCold: 6.2,
    thermalWidthWarm: 6.0,
  },
  Meerval: {
    species: 'Meerval',
    dutchName: 'Europese Meerval (Silurus glanis)',
    scientificName: 'Silurus glanis',
    description: 'Grote benthische roofvis. Gecontroleerde studies beschrijven nachtelijke voedselopname; veldtelemetrie toont daarnaast seizoensgebonden beweging en dieptegebruik.',
    assumptions: [
      'Gecontroleerde zelfvoeronderzoeken tonen nachtelijke voedselopname, met mogelijke groeps- en individuele verschillen. Dit is niet automatisch een veldvangstcurve.',
      'Veldtelemetrie toont seizoensgebonden beweging en dieptegebruik. Bewegingsactiviteit is geen directe meting van voedselopname; noordelijke Zweedse populaties zijn niet zonder meer overdraagbaar op Nederlandse wateren.',
      'De thermische optimum- en breedtewaarden in dit profiel zijn voorlopige prioren. Vaste temperatuurgrenzen voor Nederlandse meerval zijn niet voldoende onderbouwd.',
      'Een bewegings- of dieptepatroon is geen vangstgarantie en mag niet rechtstreeks als voedingsbonus worden gebruikt.',
    ],
    scientificReferences: [
      'Volkoff, H. & Rønnestad, I. (2020). Effects of temperature on feeding and digestive processes in fish. Temperature, 7(4), 307–320. https://doi.org/10.1080/23328940.2020.1765950',
      'Boujard, T. (1995). Diel rhythms of feeding activity in the European catfish, Silurus glanis. Physiology & Behavior, 58(4), 641–645. https://doi.org/10.1016/0031-9384(95)00109-V (gecontroleerde zelfvoeropstelling; groeps-/isolatie-effecten; levensfase niet vastgesteld)',
      'Slavík, O. & Horký, P. (2012). Diel dualism in the energy consumption of the European catfish Silurus glanis. Journal of Fish Biology, 81, 2223–2234. https://doi.org/10.1111/j.1095-8649.2012.03436.x (EMG-bewegingsactiviteit; geen directe voedselopname)',
      'Santos, G.S. et al. (2025). Behaviour of the Apex Predator European Catfish (Silurus glanis) on a Recently Invaded Reservoir. Ecology of Freshwater Fish, 34(1), e12817. https://doi.org/10.1111/eff.12817 (volwassen telemetrie; accelerometeractiviteit en diepte, geen voedselopname)',
      'Bergström, K. et al. (2024). Seasonal and Daily Movement Patterns by Wels Catfish (Silurus glanis) at the Northern Fringe of Its Distribution Range. Fishes, 9(7), 280. https://doi.org/10.3390/fishes9070280 (11 langdurige volwassen-tagreeksen; seizoensgebonden diepte-/bewegingspatronen in één genetisch onderscheiden Zweedse populatie; geen directe voedselopname)',
      'Copp, G.H. et al. (2009). Voracious invader or benign feline? A review of the environmental biology of European catfish Silurus glanis in its native and introduced ranges. Fish and Fisheries, 10(3), 252–282. https://doi.org/10.1111/j.1467-2979.2008.00321.x (review; geen nieuwe primaire dagdeelrespons)',
      'Kestemont, P. (1995) Nutrition and growth of Silurus glanis in European waters.',
      'Yazici, R. et al. (2025). Exploring Prey Selectivity and Feeding Habits of Wels Catfish in a Deep Anatolian Reservoir. Aquaculture Nutrition, 2025, Article 4619857. https://doi.org/10.1155/anu/4619857 (maaginhoud; lengte-/leeftijds- en seizoenscontext)',
    ],
    thermalOptimum: 22.0,
    thermalWidthCold: 5.0,
    thermalWidthWarm: 5.0,
  },
  Roofblei: {
    species: 'Roofblei',
    dutchName: 'Roofblei (Aspius aspius)',
    scientificName: 'Aspius aspius',
    description: 'Pelagische roofvis die vaak met stromend water en open water wordt geassocieerd. Beschikbare bronnen beschrijven dieet en seizoensbeweging, maar directe tijdvakgebonden voedselopname is schaars.',
    assumptions: [
      'Telemetrie van een noordelijke populatie vond seizoensgebonden bewegingspieken rond dageraad en schemering. Dit is geen directe meting van voedselopname of vangbaarheid.',
      'Veldonderzoek beschrijft seizoensverschillen in prooicompositie. Dieetkeuze bewijst geen hogere voedingsintensiteit of vaste voorkeursuren.',
      'Stroming en habitatstructuur zijn ecologisch relevant, maar het temperatuurinterval en de thermische curve in dit profiel zijn geen gevalideerd optimum voor acute activiteit.',
      'Oppervlaktekolken kunnen een nuttige lokale waarneming zijn, maar zijn geen gegarandeerde maat voor voedselopname of vangstkans.',
    ],
    scientificReferences: [
      'Volkoff, H. & Rønnestad, I. (2020). Effects of temperature on feeding and digestive processes in fish. Temperature, 7(4), 307–320. https://doi.org/10.1080/23328940.2020.1765950',
      'Tartally, A. (2000) Data on the food of Aspius aspius in River Tisza.',
      'Vašek, M. et al. (2018). Stable isotopes and gut contents indicate differential resource use by coexisting asp and pikeperch. Ecology of Freshwater Fish, 27, 1054–1065. https://doi.org/10.1111/eff.12414 (levensfase-/prooikeuze in twee reservoirs)',
      'Kärgenberg, E. et al. (2022). Annual and diel activity cycles of a northern population of the large migratory cyprinid fish asp (Leuciscus aspius). Environmental Biology of Fishes, 105, 1697–1711. https://doi.org/10.1007/s10641-022-01298-6 (53 volwassen vissen; seizoensafhankelijke bewegingspieken rond dageraad/schemering)',
      'Pinder, A.C. (2001) Keys to larval and juvenile stages of British freshwater fishes.',
    ],
    thermalOptimum: 18.5,
    thermalWidthCold: 5.5,
    thermalWidthWarm: 5.0,
  },
  Overig: {
    species: 'Overig',
    dutchName: 'Algemeen / Gemiddeld',
    scientificName: 'Teleostei',
    description: 'Generiek terugvalprofiel wanneer geen van de negen concrete doelsoorten is geselecteerd. Dit is geen soortspecifiek biologisch model.',
    assumptions: [
      'De thermische curve is een voorlopige generieke prior en geen gemeten gemiddelde voor alle zoetwatervissen.',
      'Er wordt geen soortspecifiek dagritme, windvoorkeur of habitatvoorkeur verondersteld.',
      'Gebruik de uitkomst alleen als grove context; bij een concrete doelsoort hoort het betreffende soortprofiel.',
    ],
    scientificReferences: [
      'Volkoff, H. & Rønnestad, I. (2020). Effects of temperature on feeding and digestive processes in fish. Temperature, 7(4), 307–320. https://doi.org/10.1080/23328940.2020.1765950',
      'Huet, M. (1970) Traité de Pisciculture. Éditions Ch. de Wyngaert, Bruxelles.',
      'Wootton, R.J. (1998) Ecology of Teleost Fishes. Kluwer Academic Publishers.',
    ],
    thermalOptimum: 16.5,
    thermalWidthCold: 6.0,
    thermalWidthWarm: 5.5,
  },
};

/**
 * Berekent de fysiologische temperatuurefficiëntie E_temp (0.08 - 1.0)
 * via een continue Gaussische responsfunctie.
 */
/**
 * Voorlopige asymmetrische Gaussische profielprior. Parameters zijn geen
 * gemeten optimum- of tolerantiegrenzen; de uitkomst is geen gemeten activiteit.
 */
export function calculateThermalEfficiency(
  temp: number,
  profile: SpeciesProfile
): { efficiency: number; description: string; impact: 'positief' | 'neutraal' | 'negatief' } {
  const { thermalOptimum, thermalWidthCold, thermalWidthWarm, species } = profile;
  const width = temp < thermalOptimum ? thermalWidthCold : thermalWidthWarm;
  const diff = temp - thermalOptimum;
  const rawEfficiency = Math.exp(-(diff * diff) / (2 * width * width));
  const efficiency = Math.max(0.08, Math.min(1.0, rawEfficiency));
  const description = `Watertemperatuur (${temp.toFixed(1)} °C): de voorlopige thermische profielcurve voor ${species} schat een relatieve respons van ${(efficiency * 100).toFixed(0)}%. De modelpiek en curvebreedtes zijn geen gemeten optimum; er bestaat voor deze profielcurve geen gevalideerde fysiologische tolerantiegrens. Dit is geen directe meting van activiteit of voedselopname; lage temperatuur bewijst geen winterrust. opgeloste zuurstof wordt niet gemeten, dus hoge temperatuur alleen bewijst geen zuurstofstress.`;
  return { efficiency, description, impact: 'neutraal' };
}

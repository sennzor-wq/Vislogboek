import { FishingSession, WeatherHourlyForecast } from '../types';

export type WelcomeGreetingCategory =
  | 'neutral'
  | 'spring'
  | 'summer'
  | 'autumn'
  | 'winter'
  | 'rain'
  | 'dry'
  | 'cold'
  | 'warm'
  | 'long-break'
  | 'previous-catch'
  | 'previous-skunk';

export interface WelcomeGreetingContext {
  date?: Date;
  daysSinceLastSession?: number | null;
  previousSessionOutcome?: FishingSession['outcome'] | null;
  hasRecordedCatch?: boolean;
  weather?: WeatherHourlyForecast | null;
}

export interface WelcomeGreeting {
  id: string;
  category: WelcomeGreetingCategory;
  text: string;
}

const GREETINGS: Record<WelcomeGreetingCategory, string[]> = {
  neutral: [
    'Zin om weer eens aan de waterkant te staan?',
    'Welkom terug. Er ligt weer een nieuwe vissessie in het verschiet.',
    'Een nieuwe dag, een nieuwe kans om buiten te zijn.',
    'De hengels kunnen weer mee. Waar gaan we vandaag kijken?',
    'Mooi dat je VisCoach opent. Zullen we je volgende sessie voorbereiden?',
    'Elke vissessie begint met nieuwsgierigheid. Waar gaan we die vandaag op richten?',
    'Even vooruitkijken naar je volgende moment aan het water?',
    'Welkom! Laten we rustig bekijken wat een goede aanpak kan zijn.',
    'De waterkant roept misschien alweer. Heb je al een stek in gedachten?',
    'Een plan geeft houvast, maar ruimte om te ontdekken blijft belangrijk.',
    'Tijd om de omstandigheden eens naast je plannen te leggen.',
    'Leuk dat je er bent. Zullen we kijken wat vandaag mogelijk is?',
    'Een paar uurtjes buiten kan al genoeg zijn voor een mooie sessie.',
    'De volgende vissessie begint hier. Waar heb je zin in?',
    'Welkom bij VisCoach. We kijken samen naar de omstandigheden.',
    'Heb je al een idee welke vis je vandaag wilt zoeken?',
    'Misschien wordt het een korte sessie, misschien een lange. We plannen niets voor je in.',
    'Klaar om je volgende visavontuur voor te bereiden?',
    'De omstandigheden veranderen; jouw plan mag daarin meebewegen.',
    'Laten we eerst kijken waar en wanneer je wilt vissen.',
  ],
  spring: [
    'Het voorjaar komt op gang. Tijd om te ontdekken wat er aan de waterkant gebeurt.',
    'De dagen worden langer. Heb je alweer zin in een sessie?',
    'Het voorjaar brengt veranderende omstandigheden met zich mee. Kijk je mee?',
    'Een frisse voorjaarsdag kan een mooi moment zijn om het water te verkennen.',
    'De natuur komt weer tot leven. Wat zou je vandaag aan de waterkant tegenkomen?',
    'Het licht verandert en de dagen rekken op. Tijd voor een nieuw visplan?',
    'Voorjaar aan het water: rustig kijken en je plan op de omstandigheden afstemmen.',
    'De eerste langere dagen zijn er. Misschien past een extra uurtje vissen vandaag.',
    'Het seizoen schuift op. Laten we bekijken wat de voorspelling laat zien.',
    'Een voorjaarsbezoek aan je favoriete stek? VisCoach denkt met je mee.',
    'De temperatuur kan in het voorjaar flink wisselen. Neem de verwachting mee in je plan.',
    'De waterkant verandert met het seizoen. Wat wil je vandaag proberen?',
    'Een mooi moment om je stek weer eens aandachtig te bekijken.',
    'Voorjaar betekent langere dagen en nieuwe mogelijkheden om buiten te zijn.',
    'De komende weken veranderen de omstandigheden stap voor stap. We kijken naar vandaag.',
    'Heb je je voorjaarsmateriaal al klaarstaan?',
    'Een rustige verkenning kan in dit seizoen net zo waardevol zijn als een lange sessie.',
    'De lente is begonnen. Zullen we je volgende sessie voorbereiden?',
    'Kijk eens wat het weer voor je gekozen stek in petto heeft.',
    'Welkom terug aan het begin van een nieuw visseizoen.',
  ],
  summer: [
    'De zomerdagen zijn lang. Misschien past er vandaag nog een mooie sessie in.',
    'Een zomerse dag aan het water klinkt niet verkeerd. Zullen we vooruitkijken?',
    'De zon staat hoger en de dagen zijn lang. Houd ook rekening met warmte aan de oever.',
    'Tijd voor een zomers visplan? We bekijken eerst de omstandigheden.',
    'Een vroege of late sessie kan prettig zijn op warme dagen. Wat past bij jouw planning?',
    'De zomer biedt veel uren buitenlicht. Wanneer wil jij naar de waterkant?',
    'Vergeet op warme dagen je drinkwater en schaduw niet.',
    'Een zomerse avond aan het water heeft zo zijn charme.',
    'De temperatuur loopt op. We nemen de actuele verwachting mee in je voorbereiding.',
    'Misschien is een rustige ochtend aan het water iets voor vandaag.',
    'De lange dagen geven je wat meer ruimte om je sessie te plannen.',
    'Zomer aan de waterkant: maak een plan dat ook voor jou comfortabel is.',
    'Heb je zin in een avond- of ochtendsessie?',
    'Een beetje voorbereiding maakt een warme vissessie prettiger.',
    'De zomer is in volle gang. Welke stek wil je vandaag bekijken?',
    'Het is een mooi seizoen om buiten te zijn. Laten we de omstandigheden nalopen.',
    'Denk bij warmte ook aan voldoende drinken en bescherming tegen de zon.',
    'Een korte sessie kan op een warme dag precies goed zijn.',
    'De avonduren komen eraan. Misschien past dat bij jouw volgende vissessie.',
    'Welkom! Zullen we een zomers plan maken dat bij jouw tijd past?',
  ],
  autumn: [
    'De herfst is in aantocht. De omstandigheden aan het water veranderen mee.',
    'Kortere dagen, ander weer. Zullen we je sessie daarop afstemmen?',
    'De herfstkleuren verschijnen. Een mooi moment om weer eens naar je stek te gaan.',
    'De temperatuur kan in de herfst snel omslaan. Kijk de verwachting even met me na.',
    'Een frisse herfstdag aan het water kan heerlijk zijn met de juiste voorbereiding.',
    'De dagen worden korter. Houd bij je planning rekening met het beschikbare daglicht.',
    'Herfst aan de waterkant: rustig kijken wat de omstandigheden vandaag bieden.',
    'De wind kan in dit seizoen flink meespelen. We nemen hem mee in je plan.',
    'Een warme laag extra kleding kan in de herfst geen kwaad.',
    'Misschien is een middag aan het water vandaag een goed idee.',
    'De natuur verandert van kleur. Heb je al een herfstsessie gepland?',
    'De herfst vraagt soms om wat meer voorbereiding. VisCoach kijkt met je mee.',
    'Regen of wind op komst? We bekijken wat dat voor jouw gekozen moment betekent.',
    'Een rustige sessie tussen de herfstbuien door klinkt best goed.',
    'Het seizoen schuift verder. Wat wil je deze herfst nog proberen?',
    'De waterkant ziet er iedere week anders uit. Tijd voor een nieuw bezoek?',
    'Neem bij wisselvallig weer een droge set kleding mee.',
    'De avonden vallen eerder. We houden de tijd bij je planning in beeld.',
    'Een nieuwe herfstdag biedt weer nieuwe omstandigheden om te ontdekken.',
    'Welkom terug. Zullen we bekijken wat de herfst vandaag brengt?',
  ],
  winter: [
    'Het is winter. Een goede voorbereiding maakt een koude sessie aangenamer.',
    'De dagen zijn kort. Kijk goed welk tijdvak bij je plannen past.',
    'Een frisse winterdag vraagt om warme kleding en realistische verwachtingen.',
    'Ook in de winter kun je genieten van een rustige sessie aan het water.',
    'De omstandigheden zijn winters. Zullen we eerst de verwachting bekijken?',
    'Koude handen zijn niet ideaal. Denk aan warme lagen en handschoenen.',
    'Een korte winterse vissessie kan ook de moeite waard zijn.',
    'Het winterlicht is anders en de dagen zijn beperkt. Plan je tijd zorgvuldig.',
    'De temperatuur is laag in dit seizoen. Zorg vooral dat jij comfortabel blijft.',
    'Misschien past een sessie midden op de dag het beste bij je agenda.',
    'Winter aan de waterkant: rustig observeren en niets forceren.',
    'Controleer bij vorst ook de bereikbaarheid en veiligheid van je stek.',
    'Een warme drank mee kan een winterbezoek net wat prettiger maken.',
    'De winter vraagt soms om geduld. We bekijken wat de gegevens laten zien.',
    'De dagen worden langzaam weer langer. Heb je alweer een sessie in gedachten?',
    'Kleed je goed aan als je vandaag naar buiten gaat.',
    'Een heldere winterdag kan prachtig zijn aan het water.',
    'Het seizoen is rustig, maar je kunt nog steeds waardevolle waarnemingen doen.',
    'Zullen we een passend winterplan maken?',
    'Welkom terug. We kijken samen naar de winterse omstandigheden.',
  ],
  rain: [
    'Er is neerslag voor dit moment voorspeld. Neem je regenkleding mee als je gaat.',
    'Regen in de verwachting: misschien is een waterdichte jas vandaag handig.',
    'Het kan nat worden aan de waterkant. Houd daar rekening mee in je voorbereiding.',
    'De verwachting laat neerslag zien. Zullen we kijken welk tijdstip beter past?',
    'Een regenbui hoeft je plannen niet meteen te bepalen. Bekijk de timing vooraf.',
    'Paraplu of tentje mee? Er is regen in de verwachting.',
    'De voorspelling geeft kans op neerslag. We nemen dat mee zonder er te veel uit af te leiden.',
    'Een droge plek om je spullen neer te leggen kan vandaag prettig zijn.',
    'Regen op komst: controleer de verwachting voor het tijdvak waarin je wilt vissen.',
    'Het wordt mogelijk nat. Zorg dat je materiaal en kleding daarop voorbereid zijn.',
    'De lucht kan omslaan. Een extra droge laag is geen overbodige luxe.',
    'Er staat neerslag in de uurverwachting. Misschien wil je je starttijd aanpassen.',
    'Laat je niet verrassen door een bui; kijk vooraf naar het verloop van de verwachting.',
    'Regenkleding klaar? Dan kun je in elk geval voorbereid op pad.',
    'De weersverwachting noemt neerslag. Je kunt de tijdvakken naast elkaar leggen.',
    'Een bui kan je sessie minder comfortabel maken. We kijken naar alternatieve momenten.',
    'Houd rekening met natte oevers en gladde ondergrond.',
    'De voorspelling is wisselvallig. Een flexibel plan kan vandaag handig zijn.',
    'Neem iets mee om je spullen droog te houden.',
    'Er is regen voorzien. Zullen we samen een geschikt moment zoeken?',
  ],
  dry: [
    'Voor dit moment staat er geen neerslag in de verwachting. Dat scheelt in je voorbereiding.',
    'Het lijkt op dit moment droog te blijven. Heb je zin om naar de waterkant te gaan?',
    'Geen neerslag voor dit uur voorspeld. Een droge start klinkt prettig.',
    'De uurverwachting laat momenteel geen regen zien. Kijk je mee naar je visplan?',
    'Een droog moment aan de waterkant ligt in het verschiet. Waar wil je vissen?',
    'Voor nu is er geen regen voorzien. Misschien een mooi moment om eropuit te gaan.',
    'De verwachting is op dit moment droog. Vergeet je andere voorbereiding niet.',
    'Geen regen in de actuele uurverwachting. Zullen we je sessie plannen?',
    'Het weer geeft voorlopig geen neerslagsignaal voor dit uur.',
    'Een droge start is fijn. We bekijken ook de wind en temperatuur.',
    'Voor dit moment is het droog volgens de verwachting. Wat zijn je plannen?',
    'Geen neerslag voorzien in dit uur. Misschien kun je licht bepakt op pad.',
    'De huidige verwachting laat een droog uur zien. Tijd om je stek te kiezen?',
    'Droge omstandigheden maken het plannen net wat eenvoudiger.',
    'Op dit moment staat er geen regen in de uurverwachting. Laten we vooruitkijken.',
    'Een droog moment om buiten te zijn. Heb je je hengels al klaargezet?',
    'De regen lijkt voor dit uur geen rol te spelen. We kijken naar de rest van je plan.',
    'Voorlopig geen neerslag in de verwachting voor dit moment.',
    'Het is prettig als je spullen droog kunnen blijven. De uurverwachting is droog.',
    'Zullen we van dit droge moment gebruikmaken en je volgende sessie voorbereiden?',
  ],
  cold: [
    'Het is fris buiten. Een warme jas maakt je bezoek aan de waterkant prettiger.',
    'De temperatuur is laag. Denk aan warme kleding als je op pad gaat.',
    'Een koude start vandaag? Neem iets warms mee voor aan de waterkant.',
    'Het is behoorlijk fris volgens de verwachting. Maak het jezelf comfortabel.',
    'Bij deze temperatuur zijn warme handen geen overbodige luxe.',
    'De lucht is koud. Een thermoskan kan vandaag goed van pas komen.',
    'Kleed je warm aan als je vandaag langere tijd buiten wilt zijn.',
    'Het voelt fris aan. Misschien past een kortere sessie vandaag beter.',
    'De temperatuur vraagt om een extra laag kleding. Ben je er klaar voor?',
    'Een koude dag aan het water vraagt vooral om een goede voorbereiding.',
    'Houd jezelf warm en kijk welk moment vandaag het beste bij je past.',
    'Het is fris aan de waterkant. Vergeet je muts of handschoenen niet.',
    'De verwachting laat lage temperaturen zien. Zorg goed voor jezelf buiten.',
    'Een warme drank en droge kleding kunnen een koude sessie aangenamer maken.',
    'De temperatuur is aan de frisse kant. We bekijken rustig je visplannen.',
    'Op koude dagen is comfort belangrijk. Neem voldoende warme kleding mee.',
    'Het wordt een frisse sessie als je nu vertrekt. Ben je goed voorbereid?',
    'De kou kan het verblijf buiten minder comfortabel maken. Plan bewust je tijd.',
    'Een koude ochtend vraagt om een warme voorbereiding.',
    'Het is fris genoeg om een extra trui mee te nemen. Waar wil je vissen?',
  ],
  warm: [
    'Het is warm buiten. Neem voldoende water mee als je naar de waterkant gaat.',
    'De temperatuur loopt op. Denk aan schaduw en bescherming tegen de zon.',
    'Een warme dag vraagt om voldoende drinken en een comfortabele plek.',
    'Het is aangenaam warm volgens de verwachting. Vergeet zonbescherming niet.',
    'Bij deze temperatuur is een vroege of late sessie misschien prettiger.',
    'De warmte kan vermoeiend zijn. Zorg dat je voldoende kunt drinken.',
    'Het wordt warm aan de waterkant. Neem een pet en zonnebrand mee.',
    'Een warme middag? Kijk of een ander tijdstip beter bij je past.',
    'De temperatuur is stevig. Houd rekening met jezelf én je materiaal.',
    'Zoek bij warmte waar mogelijk een plek met schaduw.',
    'Het is warm genoeg om extra water mee te nemen. Goed voorbereid op pad?',
    'Een korte sessie kan op een warme dag precies goed zijn.',
    'De zon kan flink aanwezig zijn. Bescherm jezelf goed tijdens het vissen.',
    'Bij warm weer is comfort belangrijk. Plan een moment dat bij jou past.',
    'Het wordt een warme dag. Misschien is vissen in de ochtend of avond prettiger.',
    'Denk bij deze temperatuur aan drinken, schaduw en voldoende pauzes.',
    'De verwachting is warm. Maak je plan met oog voor je eigen comfort.',
    'Een warme dag aan het water vraagt om bescherming tegen de zon.',
    'Het is warm buiten. Zorg voor voldoende drinken voordat je vertrekt.',
    'De temperatuur is hoog genoeg om schaduw en verkoeling mee te nemen in je voorbereiding.',
  ],
  'long-break': [
    'Je laatste geregistreerde vissessie was {days} dagen geleden. Fijn dat je weer vooruitkijkt.',
    'Het is {days} dagen geleden sinds je laatste sessie. Heb je alweer zin in de waterkant?',
    'Na {days} dagen zonder geregistreerde sessie is het mooi om weer plannen te maken.',
    'Je bent {days} dagen niet geregistreerd aan het vissen geweest. Welkom terug!',
    'De laatste sessie staat {days} dagen terug in je logboek. Zullen we een nieuwe voorbereiden?',
    'Fijn dat je na {days} dagen weer een vissessie overweegt.',
    'Je logboek laat {days} dagen sinds de vorige sessie zien. Tijd voor een nieuw hoofdstuk?',
    'Na {days} dagen is er vast weer genoeg te ontdekken aan de waterkant.',
    'Het is {days} dagen geleden dat je laatste sessie begon. Mooi dat je er weer bent.',
    'Je laatste sessie is inmiddels {days} dagen geleden. Waar zou je nu willen vissen?',
    'Een pauze van {days} dagen: welkom terug bij VisCoach.',
    'Sinds je vorige sessie zijn {days} dagen verstreken. Zullen we rustig opnieuw beginnen?',
    'Je logboek heeft {days} dagen geen nieuwe sessie gezien. Leuk dat je terug bent.',
    'Na {days} dagen weer vooruitkijken naar vissen. We helpen je op weg.',
    'De vorige sessie was {days} dagen geleden. Misschien wordt het tijd voor een nieuw bezoek.',
    'Fijn om je weer te zien na {days} dagen. Welke stek trekt je aandacht?',
    'Je laatste geregistreerde sessie dateert van {days} dagen terug. Tijd voor nieuwe plannen?',
    'Er zit {days} dagen tussen je vorige sessie en vandaag. Welkom terug!',
    'Na {days} dagen kun je weer met een frisse blik naar je favoriete stek kijken.',
    'Je bent weer terug bij VisCoach. De vorige sessie was {days} dagen geleden.',
  ],
  'previous-catch': [
    'Vorige keer is een vangst geregistreerd. Benieuwd wat de volgende sessie brengt?',
    'Je vorige sessie leverde een geregistreerde vangst op. Zullen we weer vooruitkijken?',
    'Mooi resultaat bij je vorige geregistreerde sessie. Wat wordt je volgende plan?',
    'Er staat een vangst in je vorige sessieverslag. Tijd voor een nieuw avontuur?',
    'Je logboek bewaart een vangst van de vorige sessie. We kijken vooruit naar de volgende.',
    'Vorige keer was er succes aan de waterkant. Welke stek wil je nu proberen?',
    'Een vangst om op terug te kijken. Zullen we de omstandigheden voor vandaag bekijken?',
    'Je vorige sessie bevat een vangstregistratie. Misschien ontdek je vandaag weer iets nieuws.',
    'Leuk dat je weer gaat plannen na een sessie met vangst.',
    'De vorige sessie staat met vangst in je logboek. Wat wil je deze keer proberen?',
    'Er is vorige keer vis geregistreerd. We bouwen verder op je eigen waarnemingen.',
    'Je logboek laat een vangst zien van de vorige sessie. Klaar voor een nieuwe poging?',
    'Een mooie herinnering uit je vorige sessie. Laten we de volgende rustig voorbereiden.',
    'Vorige keer werd er vis gevangen. We kijken nu naar de omstandigheden van je nieuwe plan.',
    'Je vorige sessie had een vangst als resultaat. Wat wordt je volgende doel?',
    'Fijn om weer vooruit te kijken na je vorige vangstregistratie.',
    'Je eerdere vangst blijft mooi om terug te zien. Zullen we een nieuw plan maken?',
    'Vorige sessie: een vangst vastgelegd. Vandaag bekijken we de omstandigheden opnieuw.',
    'Je logboek heeft een vangstnotitie van de vorige sessie. Op naar nieuwe ervaringen.',
    'De vorige sessie leverde een vangstregistratie op. Waar gaan we nu kijken?',
  ],
  'previous-skunk': [
    'Vorige keer is een nulvangst bevestigd. Dat hoort soms bij vissen; nieuwe omstandigheden, nieuwe sessie.',
    'Je vorige sessie bleef volgens je registratie zonder vangst. Zullen we opnieuw vooruitkijken?',
    'Niet iedere sessie levert vis op. We bekijken rustig wat de omstandigheden nu laten zien.',
    'Vorige keer bleef het stil aan de waterkant. Misschien ontdek je vandaag iets nieuws.',
    'Je hebt de vorige sessie als nulvangst vastgelegd. Dat is ook waardevolle informatie.',
    'Een sessie zonder vangst hoort erbij. Wat zou je deze keer anders willen proberen?',
    'Vorige keer geen vangst geregistreerd als bevestigde uitkomst. Vandaag beginnen we met een frisse blik.',
    'Ook een rustige sessie levert ervaring op. Zullen we de volgende voorbereiden?',
    'Je vorige registratie was een bevestigde nulvangst. We kijken zonder aannames vooruit.',
    'Soms werkt het water niet mee. Laten we kijken wat de huidige gegevens zeggen.',
    'Een nulvangst is geen reden om het plezier te verliezen. Zin in een nieuwe sessie?',
    'Vorige keer bleef de vangst uit. De omstandigheden zijn inmiddels mogelijk anders.',
    'Je logboek bevat ook de stille sessies. Die helpen om eerlijk terug te kijken.',
    'Vandaag is een nieuwe sessie, geen herhaling van de vorige. Zullen we vooruitkijken?',
    'De vorige sessie leverde geen vangst op, maar wel een ervaring om mee te nemen.',
    'We laten de vorige nulvangst achter ons en bekijken de omstandigheden van nu.',
    'Een mindere sessie hoort erbij. Wat past vandaag bij jouw plannen?',
    'Vorige keer geen vis op de kant. Misschien wordt het vandaag vooral een mooie dag buiten.',
    'Je hebt de uitkomst eerlijk vastgelegd. Dat maakt je logboek juist waardevoller.',
    'Iedere sessie is anders. Laten we de volgende met een open blik voorbereiden.',
  ],
};

function getSeasonCategory(date: Date): WelcomeGreetingCategory {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

function getCategory(context: WelcomeGreetingContext): WelcomeGreetingCategory {
  if (context.daysSinceLastSession !== null && context.daysSinceLastSession !== undefined && context.daysSinceLastSession >= 14) {
    return 'long-break';
  }
  if (context.previousSessionOutcome === 'skunk_confirmed') return 'previous-skunk';
  if (context.previousSessionOutcome === 'catch' && context.hasRecordedCatch) return 'previous-catch';

  if (context.weather) {
    if (context.weather.temperature <= 8) return 'cold';
    if (context.weather.temperature >= 22) return 'warm';
    if (context.weather.precipitation > 0 || context.weather.precipitationProbability >= 50) return 'rain';
    if (context.weather.precipitation === 0 && context.weather.precipitationProbability < 20) return 'dry';
  }
  return getSeasonCategory(context.date || new Date());
}

export function selectWelcomeGreeting(
  context: WelcomeGreetingContext,
  previousGreetingId?: string | null
): WelcomeGreeting {
  const category = getCategory(context);
  const candidates = GREETINGS[category];
  const now = context.date || new Date();
  const dayOfYear = Math.floor((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(now.getFullYear(), 0, 0)) / 86400000);
  const historySeed = context.daysSinceLastSession ?? 0;
  let index = (dayOfYear + historySeed + (context.weather?.weatherCode ?? 0)) % candidates.length;
  let id = `${category}-${index + 1}`;
  if (id === previousGreetingId) {
    index = (index + 1) % candidates.length;
    id = `${category}-${index + 1}`;
  }
  let text = candidates[index];
  if (category === 'long-break') {
    text = text.replaceAll('{days}', String(context.daysSinceLastSession ?? 0));
  }
  return { id, category, text };
}

export function getGreetingLibrarySize(): number {
  return Object.values(GREETINGS).reduce((total, entries) => total + entries.length, 0);
}

/**
 * «Englische Namen auf Deutsch» (Noah 21.10.2026 «1a»): many names from the Excel import are English
 * («Food pouch left», «Hip bag», «Daily ride»). suggestDe(name) makes a German suggestion from a small
 * built-in dictionary (offline, free, no service); looksEnglish(name) says whether a name is worth one.
 * Ich › Daten › «Englische Namen» shows the suggestions; taking one over sets the item's nameDe
 * (nameOf shows it in the German UI) and never touches the original name.
 *
 * How a suggestion is made: phrases first («sleeping bag», «hip bag»), then word by word. Two nouns in
 * a row become one German word («frame bag» → Rahmentasche), an adjective takes the ending of its noun
 * («small bag» → Kleine Tasche), left/right/front/rear go to the end («Food pouch left» →
 * Verpflegungstasche links). Unknown words (brands, models) and numbers stay as they are.
 * Swiss spelling: «ss», never «ß». Pure, tested in tests/namesde.test.js.
 */

/** Settings row: the item ids whose suggestion was dismissed with «Nicht vorschlagen» (in backups). */
export const SKIP_KEY = 'namesde.skip';
/** The section on Ich › Daten, and the link to it. */
export const NAMES_HASH = '#/me/data?names';
/** Rows shown first; the rest behind «n weitere zeigen». */
export const NAMES_ROWS = 10;

// Nouns: 'German|gender|plural' (gender m, f, n or pl). Keys may be phrases of up to four words.
const N = {
  // bags and luggage
  bag: 'Tasche|f|Taschen', pouch: 'Tasche|f|Taschen', pocket: 'Tasche|f|Taschen', backpack: 'Rucksack|m|Rucksäcke', rucksack: 'Rucksack|m|Rucksäcke',
  daypack: 'Tagesrucksack|m|Tagesrucksäcke', pannier: 'Packtasche|f|Packtaschen', 'hip bag': 'Hüfttasche|f|Hüfttaschen', 'hip pack': 'Hüfttasche|f|Hüfttaschen',
  'fanny pack': 'Bauchtasche|f|Bauchtaschen', 'bum bag': 'Bauchtasche|f|Bauchtaschen', 'waist pack': 'Hüfttasche|f|Hüfttaschen', 'food pouch': 'Verpflegungstasche|f|Verpflegungstaschen',
  'food bag': 'Verpflegungstasche|f|Verpflegungstaschen', 'snack pouch': 'Snacktasche|f|Snacktaschen', 'feed bag': 'Vorbautasche|f|Vorbautaschen', 'stem bag': 'Vorbautasche|f|Vorbautaschen',
  'bar bag': 'Lenkertasche|f|Lenkertaschen', 'handlebar bag': 'Lenkertasche|f|Lenkertaschen', 'handlebar roll': 'Lenkerrolle|f|Lenkerrollen', 'seat bag': 'Satteltasche|f|Satteltaschen',
  'saddle bag': 'Satteltasche|f|Satteltaschen', 'seat pack': 'Satteltasche|f|Satteltaschen', 'frame bag': 'Rahmentasche|f|Rahmentaschen', 'half frame bag': 'Halbe Rahmentasche|f|Halbe Rahmentaschen',
  'top tube bag': 'Oberrohrtasche|f|Oberrohrtaschen', 'top tube': 'Oberrohr|n|Oberrohre', 'down tube': 'Unterrohr|n|Unterrohre', 'fork bag': 'Gabeltasche|f|Gabeltaschen',
  'fork cage': 'Gabelhalter|m|Gabelhalter', 'anything cage': 'Gabelhalter|m|Gabelhalter', 'dry bag': 'Packsack|m|Packsäcke', 'stuff sack': 'Packsack|m|Packsäcke',
  'compression sack': 'Kompressionssack|m|Kompressionssäcke', sack: 'Sack|m|Säcke', 'shopping bag': 'Einkaufstasche|f|Einkaufstaschen', 'tool roll': 'Werkzeugrolle|f|Werkzeugrollen',
  'wash bag': 'Kulturbeutel|m|Kulturbeutel', 'toiletry bag': 'Kulturbeutel|m|Kulturbeutel', 'hydration pack': 'Trinkrucksack|m|Trinkrucksäcke', bladder: 'Trinkblase|f|Trinkblasen',
  'water bladder': 'Trinkblase|f|Trinkblasen', 'hydration bladder': 'Trinkblase|f|Trinkblasen', cooler: 'Kühltasche|f|Kühltaschen', suitcase: 'Koffer|m|Koffer', luggage: 'Gepäck|n|Gepäck',
  case: 'Hülle|f|Hüllen', cover: 'Hülle|f|Hüllen', 'rain cover': 'Regenhülle|f|Regenhüllen', 'glasses case': 'Brillenetui|n|Brillenetuis', container: 'Behälter|m|Behälter',
  bottle: 'Flasche|f|Flaschen', 'water bottle': 'Trinkflasche|f|Trinkflaschen', 'bottle cage': 'Flaschenhalter|m|Flaschenhalter', cage: 'Halter|m|Halter', holder: 'Halter|m|Halter',
  mount: 'Halterung|f|Halterungen', strap: 'Riemen|m|Riemen', buckle: 'Schnalle|f|Schnallen', zipper: 'Reissverschluss|m|Reissverschlüsse', harness: 'Halterung|f|Halterungen',
  // clothing
  jacket: 'Jacke|f|Jacken', 'rain jacket': 'Regenjacke|f|Regenjacken', 'rain pants': 'Regenhose|f|Regenhosen', 'rain trousers': 'Regenhose|f|Regenhosen', 'down jacket': 'Daunenjacke|f|Daunenjacken',
  puffy: 'Daunenjacke|f|Daunenjacken', windbreaker: 'Windjacke|f|Windjacken', vest: 'Weste|f|Westen', gilet: 'Weste|f|Westen', jersey: 'Trikot|n|Trikots', shirt: 'Shirt|n|Shirts',
  't shirt': 'T-Shirt|n|T-Shirts', tee: 'T-Shirt|n|T-Shirts', 'base layer': 'Funktionsshirt|n|Funktionsshirts', baselayer: 'Funktionsshirt|n|Funktionsshirts', layer: 'Schicht|f|Schichten',
  'tank top': 'Top|n|Tops', sweater: 'Pullover|m|Pullover', jumper: 'Pullover|m|Pullover', pullover: 'Pullover|m|Pullover', shorts: 'Kurze Hose|f|Kurze Hosen',
  'bib shorts': 'Trägerhose|f|Trägerhosen', bibs: 'Trägerhose|f|Trägerhosen', 'cycling shorts': 'Velohose|f|Velohosen', 'bike shorts': 'Velohose|f|Velohosen', pants: 'Hose|f|Hosen',
  trousers: 'Hose|f|Hosen', tights: 'Lange Hose|f|Lange Hosen', underwear: 'Unterwäsche|f|Unterwäsche', briefs: 'Unterhose|f|Unterhosen', boxers: 'Unterhose|f|Unterhosen',
  bra: 'BH|m|BHs', 'sports bra': 'Sport-BH|m|Sport-BHs', glove: 'Handschuh|m|Handschuhe', mitten: 'Fäustling|m|Fäustlinge', sock: 'Socke|f|Socken', shoe: 'Schuh|m|Schuhe',
  boot: 'Stiefel|m|Stiefel', 'hiking boots': 'Wanderschuhe|pl|Wanderschuhe', sandal: 'Sandale|f|Sandalen', slipper: 'Hausschuh|m|Hausschuhe', 'flip flops': 'Flipflops|pl|Flipflops',
  overshoe: 'Überschuh|m|Überschuhe', 'shoe covers': 'Überschuhe|pl|Überschuhe', 'arm warmer': 'Armling|m|Armlinge', 'leg warmer': 'Beinling|m|Beinlinge', 'knee warmer': 'Knieling|m|Knielinge',
  'neck warmer': 'Halswärmer|m|Halswärmer', 'neck gaiter': 'Halstuch|n|Halstücher', scarf: 'Schal|m|Schals', headband: 'Stirnband|n|Stirnbänder', cap: 'Mütze|f|Mützen',
  beanie: 'Mütze|f|Mützen', hat: 'Hut|m|Hüte', 'sun hat': 'Sonnenhut|m|Sonnenhüte', helmet: 'Helm|m|Helme', glasses: 'Brille|f|Brillen', sunglasses: 'Sonnenbrille|f|Sonnenbrillen',
  goggles: 'Brille|f|Brillen', belt: 'Gurt|m|Gurte', dress: 'Kleid|n|Kleider', skirt: 'Rock|m|Röcke', swimsuit: 'Badekleid|n|Badekleider', 'swim trunks': 'Badehose|f|Badehosen',
  swimwear: 'Badesachen|pl|Badesachen', clothes: 'Kleider|pl|Kleider', clothing: 'Kleidung|f|Kleidung', outfit: 'Outfit|n|Outfits', 'knee pads': 'Knieschoner|pl|Knieschoner',
  // sleeping and camping
  'sleeping bag': 'Schlafsack|m|Schlafsäcke', 'sleeping bag liner': 'Schlafsack-Inlett|n|Schlafsack-Inletts', liner: 'Inlett|n|Inletts', 'sleeping pad': 'Schlafmatte|f|Schlafmatten',
  'sleeping mat': 'Schlafmatte|f|Schlafmatten', mat: 'Matte|f|Matten', pad: 'Matte|f|Matten', pillow: 'Kissen|n|Kissen', blanket: 'Decke|f|Decken', 'emergency blanket': 'Rettungsdecke|f|Rettungsdecken',
  quilt: 'Decke|f|Decken', tent: 'Zelt|n|Zelte', tarp: 'Tarp|n|Tarps', bivy: 'Biwaksack|m|Biwaksäcke', bivvy: 'Biwaksack|m|Biwaksäcke', 'bivy bag': 'Biwaksack|m|Biwaksäcke',
  'bivvy bag': 'Biwaksack|m|Biwaksäcke', stake: 'Hering|m|Heringe', peg: 'Hering|m|Heringe', 'tent stakes': 'Zeltheringe|pl|Zeltheringe', 'tent pegs': 'Zeltheringe|pl|Zeltheringe',
  pole: 'Stange|f|Stangen', 'tent poles': 'Zeltstangen|pl|Zeltstangen', 'trekking poles': 'Wanderstöcke|pl|Wanderstöcke', 'hiking poles': 'Wanderstöcke|pl|Wanderstöcke',
  footprint: 'Zeltunterlage|f|Zeltunterlagen', groundsheet: 'Zeltunterlage|f|Zeltunterlagen', hammock: 'Hängematte|f|Hängematten', 'mosquito net': 'Moskitonetz|n|Moskitonetze',
  stove: 'Kocher|m|Kocher', pot: 'Topf|m|Töpfe', pan: 'Pfanne|f|Pfannen', cup: 'Becher|m|Becher', mug: 'Tasse|f|Tassen', bowl: 'Schüssel|f|Schüsseln', plate: 'Teller|m|Teller',
  spoon: 'Löffel|m|Löffel', spork: 'Göffel|m|Göffel', fork: 'Gabel|f|Gabeln', knife: 'Messer|n|Messer', knives: 'Messer|pl|Messer', lighter: 'Feuerzeug|n|Feuerzeuge',
  matches: 'Streichhölzer|pl|Streichhölzer', canister: 'Kartusche|f|Kartuschen', 'gas canister': 'Gaskartusche|f|Gaskartuschen', fuel: 'Brennstoff|m|Brennstoffe',
  'water filter': 'Wasserfilter|m|Wasserfilter', water: 'Wasser|n|Wasser', filter: 'Filter|m|Filter', umbrella: 'Schirm|m|Schirme', towel: 'Handtuch|n|Handtücher',
  // food
  food: 'Essen|n|Essen', snack: 'Snack|m|Snacks', 'energy bar': 'Energieriegel|m|Energieriegel', 'energy gel': 'Energiegel|n|Energiegels', gel: 'Gel|n|Gels', drink: 'Getränk|n|Getränke',
  'drink mix': 'Getränkepulver|n|Getränkepulver', powder: 'Pulver|n|Pulver', electrolytes: 'Elektrolyte|pl|Elektrolyte', coffee: 'Kaffee|m|Kaffee', tea: 'Tee|m|Tees', sugar: 'Zucker|m|Zucker',
  salt: 'Salz|n|Salz', nut: 'Nuss|f|Nüsse', bread: 'Brot|n|Brote', cheese: 'Käse|m|Käse', chocolate: 'Schokolade|f|Schokoladen', rice: 'Reis|m|Reis', oats: 'Haferflocken|pl|Haferflocken',
  muesli: 'Müesli|n|Müesli', granola: 'Müesli|n|Müesli', fruit: 'Frucht|f|Früchte', 'dried fruit': 'Trockenfrüchte|pl|Trockenfrüchte', meal: 'Mahlzeit|f|Mahlzeiten',
  breakfast: 'Frühstück|n|Frühstücke', lunch: 'Mittagessen|n|Mittagessen', dinner: 'Abendessen|n|Abendessen', soup: 'Suppe|f|Suppen', 'peanut butter': 'Erdnussbutter|f|Erdnussbutter',
  // bike and repair
  bike: 'Velo|n|Velos', bicycle: 'Velo|n|Velos', 'road bike': 'Rennvelo|n|Rennvelos', 'gravel bike': 'Gravelvelo|n|Gravelvelos', frame: 'Rahmen|m|Rahmen', handlebar: 'Lenker|m|Lenker',
  handlebars: 'Lenker|m|Lenker', 'bar tape': 'Lenkerband|n|Lenkerbänder', grips: 'Griffe|pl|Griffe', grip: 'Griff|m|Griffe', saddle: 'Sattel|m|Sättel', seat: 'Sitz|m|Sitze',
  seatpost: 'Sattelstütze|f|Sattelstützen', 'seat post': 'Sattelstütze|f|Sattelstützen', stem: 'Vorbau|m|Vorbauten', wheel: 'Laufrad|n|Laufräder', tire: 'Reifen|m|Reifen', tyre: 'Reifen|m|Reifen',
  tube: 'Schlauch|m|Schläuche', 'inner tube': 'Schlauch|m|Schläuche', chain: 'Kette|f|Ketten', 'chain lube': 'Kettenöl|n|Kettenöle', 'chain oil': 'Kettenöl|n|Kettenöle', lube: 'Schmiermittel|n|Schmiermittel',
  oil: 'Öl|n|Öle', 'quick link': 'Kettenschloss|n|Kettenschlösser', 'chain link': 'Kettenglied|n|Kettenglieder', brake: 'Bremse|f|Bremsen', 'brake pad': 'Bremsbelag|m|Bremsbeläge',
  'brake pads': 'Bremsbeläge|pl|Bremsbeläge', 'disc brake': 'Scheibenbremse|f|Scheibenbremsen', rotor: 'Bremsscheibe|f|Bremsscheiben', pedal: 'Pedal|n|Pedale', cleat: 'Schuhplatte|f|Schuhplatten',
  derailleur: 'Schaltwerk|n|Schaltwerke', 'derailleur hanger': 'Schaltauge|n|Schaltaugen', cassette: 'Kassette|f|Kassetten', spoke: 'Speiche|f|Speichen', valve: 'Ventil|n|Ventile',
  sealant: 'Dichtmilch|f|Dichtmilch', 'tubeless sealant': 'Dichtmilch|f|Dichtmilch', plug: 'Stecker|m|Stecker', 'tire plug': 'Reifenflicken|m|Reifenflicken', fender: 'Schutzblech|n|Schutzbleche',
  mudguard: 'Schutzblech|n|Schutzbleche', kickstand: 'Ständer|m|Ständer', rack: 'Gepäckträger|m|Gepäckträger', bell: 'Glocke|f|Glocken', mirror: 'Spiegel|m|Spiegel', lock: 'Schloss|n|Schlösser',
  'chain lock': 'Kettenschloss|n|Kettenschlösser', 'cable lock': 'Kabelschloss|n|Kabelschlösser', pump: 'Pumpe|f|Pumpen', tool: 'Werkzeug|n|Werkzeuge', 'tire lever': 'Reifenheber|m|Reifenheber',
  'tyre lever': 'Reifenheber|m|Reifenheber', set: 'Set|n|Sets', patch: 'Flicken|m|Flicken', 'patch kit': 'Flickzeug|n|Flickzeuge', 'repair kit': 'Reparaturset|n|Reparatursets', kit: 'Set|n|Sets',
  'first aid kit': 'Erste-Hilfe-Set|n|Erste-Hilfe-Sets', 'first aid': 'Erste Hilfe|f|Erste Hilfe', part: 'Teil|n|Teile', 'spare parts': 'Ersatzteile|pl|Ersatzteile', 'zip tie': 'Kabelbinder|m|Kabelbinder',
  'cable tie': 'Kabelbinder|m|Kabelbinder', tape: 'Klebband|n|Klebbänder', 'duct tape': 'Gewebeband|n|Gewebebänder', rope: 'Seil|n|Seile', cord: 'Schnur|f|Schnüre', carabiner: 'Karabiner|m|Karabiner',
  'hex key': 'Inbusschlüssel|m|Inbusschlüssel', 'allen key': 'Inbusschlüssel|m|Inbusschlüssel', wrench: 'Schlüssel|m|Schlüssel', 'torque wrench': 'Drehmomentschlüssel|m|Drehmomentschlüssel',
  rag: 'Lappen|m|Lappen', brush: 'Bürste|f|Bürsten', gloves: 'Handschuhe|pl|Handschuhe',
  // light and electronics
  light: 'Licht|n|Lichter', lamp: 'Lampe|f|Lampen', headlamp: 'Stirnlampe|f|Stirnlampen', 'head torch': 'Stirnlampe|f|Stirnlampen', torch: 'Taschenlampe|f|Taschenlampen',
  flashlight: 'Taschenlampe|f|Taschenlampen', 'front light': 'Frontlicht|n|Frontlichter', 'rear light': 'Rücklicht|n|Rücklichter', 'tail light': 'Rücklicht|n|Rücklichter', taillight: 'Rücklicht|n|Rücklichter',
  battery: 'Akku|m|Akkus', 'battery pack': 'Akku|m|Akkus', 'power bank': 'Powerbank|f|Powerbanks', powerbank: 'Powerbank|f|Powerbanks', charger: 'Ladegerät|n|Ladegeräte', cable: 'Kabel|n|Kabel',
  'charging cable': 'Ladekabel|n|Ladekabel', 'usb cable': 'USB-Kabel|n|USB-Kabel', adapter: 'Adapter|m|Adapter', phone: 'Handy|n|Handys', 'phone mount': 'Handyhalterung|f|Handyhalterungen',
  watch: 'Uhr|f|Uhren', computer: 'Computer|m|Computer', 'bike computer': 'Velocomputer|m|Velocomputer', headphones: 'Kopfhörer|pl|Kopfhörer', earphones: 'Kopfhörer|pl|Kopfhörer',
  earbuds: 'Kopfhörer|pl|Kopfhörer', camera: 'Kamera|f|Kameras', 'heart rate monitor': 'Pulsgurt|m|Pulsgurte', 'heart rate strap': 'Pulsgurt|m|Pulsgurte', 'chest strap': 'Brustgurt|m|Brustgurte',
  sensor: 'Sensor|m|Sensoren', 'speed sensor': 'Geschwindigkeitssensor|m|Geschwindigkeitssensoren', 'cadence sensor': 'Trittfrequenzsensor|m|Trittfrequenzsensoren', 'solar panel': 'Solarpanel|n|Solarpanels',
  // body care and first aid
  sunscreen: 'Sonnencreme|f|Sonnencremes', 'sun cream': 'Sonnencreme|f|Sonnencremes', 'lip balm': 'Lippenpflege|f|Lippenpflege', cream: 'Creme|f|Cremes', 'chamois cream': 'Gesässcreme|f|Gesässcremes',
  toothbrush: 'Zahnbürste|f|Zahnbürsten', toothpaste: 'Zahnpasta|f|Zahnpasten', soap: 'Seife|f|Seifen', razor: 'Rasierer|m|Rasierer', 'toilet paper': 'WC-Papier|n|WC-Papier',
  tissues: 'Taschentücher|pl|Taschentücher', 'wet wipes': 'Feuchttücher|pl|Feuchttücher', 'hand sanitizer': 'Desinfektionsmittel|n|Desinfektionsmittel', medication: 'Medikamente|pl|Medikamente',
  medicine: 'Medikamente|pl|Medikamente', pills: 'Tabletten|pl|Tabletten', painkillers: 'Schmerzmittel|pl|Schmerzmittel', plaster: 'Pflaster|n|Pflaster', plasters: 'Pflaster|pl|Pflaster',
  bandage: 'Verband|m|Verbände', 'insect repellent': 'Mückenschutz|m|Mückenschutz', 'bug spray': 'Mückenschutz|m|Mückenschutz', 'ear plugs': 'Ohrstöpsel|pl|Ohrstöpsel', earplugs: 'Ohrstöpsel|pl|Ohrstöpsel',
  'eye mask': 'Schlafmaske|f|Schlafmasken', comb: 'Kamm|m|Kämme',
  // papers and small things
  wallet: 'Portemonnaie|n|Portemonnaies', money: 'Geld|n|Geld', cash: 'Bargeld|n|Bargeld', card: 'Karte|f|Karten', 'credit card': 'Kreditkarte|f|Kreditkarten', 'id card': 'Ausweis|m|Ausweise',
  passport: 'Pass|m|Pässe', ticket: 'Billett|n|Billette', key: 'Schlüssel|m|Schlüssel', 'house keys': 'Hausschlüssel|pl|Hausschlüssel', map: 'Karte|f|Karten', notebook: 'Notizbuch|n|Notizbücher',
  pen: 'Stift|m|Stifte', pencil: 'Bleistift|m|Bleistifte', book: 'Buch|n|Bücher', 'spare clothes': 'Ersatzkleider|pl|Ersatzkleider',
  // trips and riding
  ride: 'Fahrt|f|Fahrten', 'training ride': 'Trainingsfahrt|f|Trainingsfahrten', 'test ride': 'Probefahrt|f|Probefahrten', 'group ride': 'Gruppenfahrt|f|Gruppenfahrten', 'night ride': 'Nachtfahrt|f|Nachtfahrten',
  trip: 'Tour|f|Touren', tour: 'Tour|f|Touren', 'day trip': 'Tagestour|f|Tagestouren', 'bike trip': 'Velotour|f|Velotouren', 'bike tour': 'Velotour|f|Velotouren', 'bikepacking trip': 'Bikepacking-Tour|f|Bikepacking-Touren',
  'road trip': 'Reise|f|Reisen', journey: 'Reise|f|Reisen', travel: 'Reise|f|Reisen', route: 'Route|f|Routen', loop: 'Runde|f|Runden', lap: 'Runde|f|Runden', day: 'Tag|m|Tage', night: 'Nacht|f|Nächte',
  weekend: 'Wochenende|n|Wochenenden', week: 'Woche|f|Wochen', month: 'Monat|m|Monate', year: 'Jahr|n|Jahre', overnight: 'Übernachtung|f|Übernachtungen', overnighter: 'Übernachtung|f|Übernachtungen',
  commute: 'Arbeitsweg|m|Arbeitswege', 'daily commute': 'Täglicher Arbeitsweg|m|Tägliche Arbeitswege', training: 'Training|n|Trainings', workout: 'Training|n|Trainings', race: 'Rennen|n|Rennen',
  hike: 'Wanderung|f|Wanderungen', climb: 'Anstieg|m|Anstiege', descent: 'Abfahrt|f|Abfahrten', holiday: 'Ferien|pl|Ferien', holidays: 'Ferien|pl|Ferien', vacation: 'Ferien|pl|Ferien',
  camping: 'Camping|n|Camping', camp: 'Lager|n|Lager', mountain: 'Berg|m|Berge', mountains: 'Berge|pl|Berge', lake: 'See|m|Seen', river: 'Fluss|m|Flüsse', city: 'Stadt|f|Städte', road: 'Strasse|f|Strassen',
  street: 'Strasse|f|Strassen', trail: 'Weg|m|Wege', path: 'Weg|m|Wege', work: 'Arbeit|f|Arbeiten', office: 'Büro|n|Büros', gym: 'Fitnessstudio|n|Fitnessstudios', school: 'Schule|f|Schulen',
  shopping: 'Einkauf|m|Einkäufe', groceries: 'Einkäufe|pl|Einkäufe', home: 'Zuhause|n|Zuhause', morning: 'Morgen|m|Morgen', evening: 'Abend|m|Abende', afternoon: 'Nachmittag|m|Nachmittage',
  emergency: 'Notfall|m|Notfälle', rain: 'Regen|m|Regen', snow: 'Schnee|m|Schnee', wind: 'Wind|m|Winde', sun: 'Sonne|f|Sonnen', winter: 'Winter|m|Winter', summer: 'Sommer|m|Sommer',
  spring: 'Frühling|m|Frühlinge', autumn: 'Herbst|m|Herbste', fall: 'Herbst|m|Herbste', weather: 'Wetter|n|Wetter', 'packing list': 'Packliste|f|Packlisten', list: 'Liste|f|Listen',
  checklist: 'Checkliste|f|Checklisten', setup: 'Setup|n|Setups', gear: 'Ausrüstung|f|Ausrüstung', equipment: 'Ausrüstung|f|Ausrüstung', stuff: 'Sachen|pl|Sachen', things: 'Sachen|pl|Sachen',
  spare: 'Ersatz|m|Ersatz', extra: 'Extra|n|Extras', box: 'Box|f|Boxen', head: 'Kopf|m|Köpfe', hand: 'Hand|f|Hände', foot: 'Fuss|m|Füsse', feet: 'Füsse|pl|Füsse', neck: 'Hals|m|Hälse',
  knee: 'Knie|n|Knie', arm: 'Arm|m|Arme', leg: 'Bein|n|Beine', eye: 'Auge|n|Augen', ear: 'Ohr|n|Ohren', toe: 'Zehe|f|Zehen', size: 'Grösse|f|Grössen', colour: 'Farbe|f|Farben', color: 'Farbe|f|Farben',
};

// Words that join the next noun into one German word («spare tube» → Ersatzschlauch).
const PREFIX = {
  spare: 'Ersatz', sleeping: 'Schlaf', cooking: 'Koch', cycling: 'Velo', riding: 'Velo', hiking: 'Wander', travel: 'Reise', thermal: 'Thermo', wool: 'Woll', woollen: 'Woll',
  cotton: 'Baumwoll', leather: 'Leder', mini: 'Mini', main: 'Haupt', folding: 'Falt', charging: 'Lade', drinking: 'Trink', repair: 'Reparatur', emergency: 'Not', 'long sleeve': 'Langarm',
  'long sleeved': 'Langarm', 'short sleeve': 'Kurzarm', 'short sleeved': 'Kurzarm', merino: 'Merino', down: 'Daunen', camping: 'Camping', bike: 'Velo', rain: 'Regen', winter: 'Winter',
  summer: 'Sommer', wind: 'Wind', sun: 'Sonnen', first: 'Erste', tool: 'Werkzeug', water: 'Wasser', food: 'Essens', travelling: 'Reise', hand: 'Hand', head: 'Kopf', night: 'Nacht', day: 'Tages',
  road: 'Strassen', gravel: 'Gravel', mountain: 'Berg', training: 'Trainings', race: 'Renn', racing: 'Renn', work: 'Arbeits', shopping: 'Einkaufs', weekend: 'Wochenend', spring: 'Frühlings',
  autumn: 'Herbst', snow: 'Schnee', phone: 'Handy', battery: 'Akku', chain: 'Ketten', tire: 'Reifen', tyre: 'Reifen', frame: 'Rahmen', saddle: 'Sattel', seat: 'Sattel', handlebar: 'Lenker',
  fork: 'Gabel', stem: 'Vorbau', bottle: 'Flaschen', tent: 'Zelt', lake: 'See', city: 'Stadt', home: 'Haus', house: 'Haus', school: 'Schul', toilet: 'WC', wash: 'Wasch',
};

// Adjectives (base form; they take -er/-e/-es before a noun).
const ADJ = {
  small: 'klein', little: 'klein', big: 'gross', large: 'gross', long: 'lang', short: 'kurz', cold: 'kalt', hot: 'heiss', light: 'leicht', lightweight: 'leicht', heavy: 'schwer',
  new: 'neu', old: 'alt', red: 'rot', blue: 'blau', green: 'grün', black: 'schwarz', white: 'weiss', yellow: 'gelb', grey: 'grau', gray: 'grau', brown: 'braun', purple: 'violett',
  dry: 'trocken', wet: 'nass', clean: 'sauber', dirty: 'schmutzig', daily: 'täglich', weekly: 'wöchentlich', easy: 'locker', hard: 'hart', fast: 'schnell', quick: 'schnell', slow: 'langsam',
  waterproof: 'wasserdicht', windproof: 'winddicht', insulated: 'isoliert', reflective: 'reflektierend', thick: 'dick', thin: 'dünn', soft: 'weich', electric: 'elektrisch', wireless: 'kabellos',
  personal: 'persönlich', full: 'voll', empty: 'leer', half: 'halb', warm: 'warm', cool: 'kühl', extra: 'extra', additional: 'zusätzlich', second: 'zweit', third: 'dritt', last: 'letzt',
  next: 'nächst', own: 'eigen', usual: 'üblich', favourite: 'liebst', favorite: 'liebst', regular: 'normal', normal: 'normal', standard: 'standard', basic: 'einfach', simple: 'einfach',
  sunny: 'sonnig', rainy: 'regnerisch', windy: 'windig', snowy: 'verschneit', flat: 'flach', hilly: 'hügelig', steep: 'steil', fresh: 'frisch',
};

// Words that go to the end («Food pouch left» → Verpflegungstasche links).
const DIR = { left: 'links', right: 'rechts', front: 'vorne', rear: 'hinten', back: 'hinten', top: 'oben', bottom: 'unten', inside: 'innen', outside: 'aussen', upper: 'oben', lower: 'unten' };

// Small words.
const SMALL = { and: 'und', with: 'mit', for: 'für', without: 'ohne', or: 'oder', in: 'in', on: 'auf', to: 'nach', from: 'von', at: 'bei', per: 'pro', plus: 'plus', the: '', a: '', an: '', my: '', of: '' };

const ENDING = { m: 'er', f: 'e', n: 'es', pl: 'e' };

const noun = (s, plural = false) => {
  const [de, g, pl] = s.split('|');
  return plural ? { de: pl || de, g: 'pl' } : { de, g };
};
const lower = (s) => s.toLowerCase();

/** The singular stems of an English plural («bags» → bag, «batteries» → battery, «boxes» → box). */
function stems(w) {
  const out = [];
  if (w.length < 4 || !w.endsWith('s') || w.endsWith('ss')) return out;
  if (w.endsWith('ies')) out.push(`${w.slice(0, -3)}y`);
  out.push(w.slice(0, -1));
  if (w.endsWith('es')) out.push(w.slice(0, -2));
  return out;
}

/** Look one English word or phrase up: → { kind, de, g? } or null. */
function look(key, last = true) {
  if (N[key]) return { kind: 'noun', ...noun(N[key]) };
  if (PREFIX[key] && !N[key]) return { kind: 'prefix', de: PREFIX[key] };
  if (ADJ[key]) return { kind: 'adj', de: ADJ[key] };
  if (DIR[key]) return { kind: 'dir', de: DIR[key] };
  if (key in SMALL) return { kind: 'small', de: SMALL[key] };
  if (!last) return null;
  // a plural: the stem of the last word
  const parts = key.split(' ');
  for (const s of stems(parts.at(-1))) {
    const k = [...parts.slice(0, -1), s].join(' ');
    if (N[k]) return { kind: 'noun', ...noun(N[k], true) };
  }
  return null;
}

// A word: letters only (an apostrophe inside is fine); everything else is kept as written.
const TOKEN = /[A-Za-zÀ-ÖØ-öø-ÿ]+(?:'[A-Za-z]+)?|\s+|[^A-Za-zÀ-ÖØ-öø-ÿ\s]+/g;
const isWord = (s) => /^[A-Za-zÀ-ÖØ-öø-ÿ]/.test(s);
const MAX_PHRASE = 4;
// Phrases may hold spaces or a hyphen between their words («T-shirt», «long-sleeve»).
const joins = (s) => /^(\s+|-)$/.test(s);

/** The name as segments: { word, en, kind, de, g } or { sep }. */
function segments(name) {
  const toks = String(name ?? '').match(TOKEN) ?? [];
  const out = [];
  for (let i = 0; i < toks.length; ) {
    if (!isWord(toks[i])) {
      out.push({ sep: toks[i] });
      i++;
      continue;
    }
    // the longest phrase from here: word (sep word)*
    let hit = null;
    const words = [toks[i]];
    let j = i;
    const ends = [i];
    while (words.length < MAX_PHRASE && joins(toks[j + 1] ?? '') && isWord(toks[j + 2] ?? '')) {
      j += 2;
      words.push(toks[j]);
      ends.push(j);
    }
    for (let n = words.length; n >= 1 && !hit; n--) {
      const key = lower(words.slice(0, n).join(' '));
      const f = look(key, true);
      if (f) hit = { ...f, en: toks.slice(i, ends[n - 1] + 1).join(''), last: ends[n - 1] };
    }
    if (hit) {
      out.push({ word: true, en: hit.en, kind: hit.kind, de: hit.de, g: hit.g });
      i = hit.last + 1;
    } else {
      out.push({ word: true, en: toks[i], kind: 'keep', de: toks[i] });
      i++;
    }
  }
  return out;
}

const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const tail = (s) => (/[ -]/.test(s) ? s : s[0].toLowerCase() + s.slice(1));
const space = (s) => !!s && /^\s+$/.test(s.sep ?? '');

/** Two words become one: «Rahmen» + «Tasche» → Rahmentasche (with a hyphen when the first has one). */
function compound(a, b) {
  if (/[ -]/.test(a) || /[ -]/.test(b) || /[A-Z]{2}/.test(b)) return `${a}-${b}`;
  return a + tail(b);
}

/**
 * A German suggestion for an English name, or null when nothing in it is known (or nothing changes).
 * «Food pouch left» → «Verpflegungstasche links», «Hip bag» → «Hüfttasche», «Daily ride» → «Tägliche Fahrt».
 */
export function suggestDe(name) {
  const src = String(name ?? '').trim();
  if (!src) return null;
  let seg = segments(src);
  if (!seg.some((s) => s.word && s.kind !== 'keep' && s.kind !== 'small')) return null;
  // «light» before a noun is the adjective («Light jacket» → Leichte Jacke), else the lamp
  seg = seg.map((s, k) => {
    if (s.word && lower(s.en) === 'light' && space(seg[k + 1]) && seg[k + 2]?.word && seg[k + 2].kind === 'noun') return { ...s, kind: 'adj', de: ADJ.light, g: undefined };
    return s;
  });
  // a noun before a noun works as a prefix too
  const merged = [];
  for (let k = 0; k < seg.length; k++) {
    const s = seg[k];
    const prev = merged.at(-1);
    const gap = merged.at(-2);
    if (s.word && s.kind === 'noun' && space(prev) && gap?.word && (gap.kind === 'prefix' || gap.kind === 'noun')) {
      const first = gap.kind === 'noun' && PREFIX[lower(gap.en)] ? PREFIX[lower(gap.en)] : gap.de;
      merged.splice(-2, 2, { word: true, en: `${gap.en} ${s.en}`, kind: 'noun', de: compound(first, s.de), g: s.g });
      continue;
    }
    merged.push(s);
  }
  // a prefix with no noun after it reads as its own noun again
  for (const s of merged) if (s.word && s.kind === 'prefix') s.de = N[lower(s.en)] ? noun(N[lower(s.en)]).de : cap(s.de);
  // adjectives take the ending of the next noun
  for (let k = 0; k < merged.length; k++) {
    const s = merged[k];
    if (!(s.word && s.kind === 'adj')) continue;
    let m = k + 1;
    while (m < merged.length && (space(merged[m]) || (merged[m].word && merged[m].kind === 'adj'))) m++;
    const n = merged[m];
    // not when the noun holds its adjective already («Kurze Hose») or the word does not bend («extra»)
    if (n?.word && n.kind === 'noun' && ENDING[n.g] && !/^(extra|standard)$/.test(s.de) && !/ /.test(n.de)) s.de = s.de + ENDING[n.g];
  }
  // left, right, front, rear: to the end
  const dirs = merged.filter((s) => s.word && s.kind === 'dir').map((s) => s.de);
  const rest = merged.filter((s) => !(s.word && s.kind === 'dir'));
  let text = rest.map((s) => (s.word ? s.de : s.sep)).join('');
  if (dirs.length && rest.some((s) => s.word)) text = `${text.trim()} ${dirs.join(' ')}`;
  else if (dirs.length) text = dirs.join(' ');
  text = text.replace(/\s+/g, ' ').replace(/\s+([,.;:)])/g, '$1').replace(/\(\s+/g, '(').trim();
  const first = merged.find((s) => s.word && s.de);
  if (first && first.kind !== 'keep') text = cap(text);
  if (!text || lower(text) === lower(src)) return null;
  return text;
}

// German words that say a name is German already (beside umlauts and the endings below).
const GERMAN = new Set(
  'und mit für ohne oder links rechts vorne hinten oben unten aussen innen der die das ein eine einer eines für klein kleine gross grosse lang lange kurz kurze neu neue alt alte warm warme leicht leichte'.split(' '),
);
// English words that are German words too (or close): they say nothing either way.
const BOTH = new Set(['tour', 'route', 'gel', 'box', 'set', 'kit', 'training', 'camping', 'snack', 'filter', 'computer', 'adapter', 'sensor', 'shirt', 'pullover', 'outfit', 'setup', 'extra', 'winter', 'sommer', 'wind', 'arm', 'hand', 'plus', 'in', 'standard', 'normal', 'warm', 'tarp', 'powerbank', 'mini', 'merino', 'gravel', 'pedal']);
// German nouns of the dictionary (Tasche, Jacke, Helm …), minus the ones that are English words too.
const AMBIG = new Set(['tag', 'see', 'pass', 'lager', 'tee', 'rock', 'hut', 'not', 'top', 'hose', 'bar', 'kind', 'gift', 'die', 'man', 'also', 'fast', 'set', 'mini', 'merino', 'gravel', 'camping', 'handy']);
for (const v of Object.values(N)) for (const w of lower(v.split('|')[0]).split(/[ -]/)) if (w.length > 2 && !N[w] && !AMBIG.has(w)) GERMAN.add(w);
for (const v of Object.values(PREFIX)) if (v.length > 3 && !N[lower(v)] && !ADJ[lower(v)] && !AMBIG.has(lower(v))) GERMAN.add(lower(v));
const germanLike = (w) => GERMAN.has(w) || /sch|ung$|heit$|keit$|chen$|lein$|tz/.test(w);

/** Whether a name is English enough for a suggestion: English words in it, no umlauts, no German words. */
export function looksEnglish(name) {
  const s = String(name ?? '');
  if (!s.trim() || /[äöüÄÖÜß]/.test(s)) return false;
  const words = (s.match(/[A-Za-z]+/g) ?? []).map(lower);
  let en = 0;
  for (const w of words) {
    if (BOTH.has(w)) continue;
    const f = look(w);
    if (f && f.kind !== 'small') en++;
    else if (f && f.kind === 'small' && SMALL[w] !== w && SMALL[w] !== '') en++;
    else if (germanLike(w)) return false;
  }
  return en > 0;
}

/**
 * The items with an English name and a German suggestion, without the dismissed ones and without the
 * ones that have a German name already. → [{ id, name, suggestion }] sorted by name.
 */
export function openNames(items = [], skip = []) {
  const off = new Set(skip ?? []);
  const out = [];
  for (const i of items ?? []) {
    if (!i?.id || off.has(i.id) || i.nameDe || i.ownership === 'gone' || !looksEnglish(i.name)) continue;
    const suggestion = suggestDe(i.name);
    if (suggestion) out.push({ id: i.id, name: i.name, suggestion });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

/** For the guard test: every German text of the dictionary (Swiss spelling, never «ß»). */
export const dictionaryTexts = () => [...Object.values(N).flatMap((v) => v.split('|')), ...Object.values(PREFIX), ...Object.values(ADJ), ...Object.values(DIR), ...Object.values(SMALL)];
export const dictionarySize = () => Object.keys(N).length + Object.keys(PREFIX).length + Object.keys(ADJ).length + Object.keys(DIR).length + Object.keys(SMALL).length;

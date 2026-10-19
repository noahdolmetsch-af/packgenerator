/**
 * «Mehr Inhalt in der App» (Noah 15.10.2026 «hilf mir, die app zu bereichern mit content», overview
 * https://claude.ai/artifact/YShmafMSUx3cbCLgvTketW, answers «5a» and «a» = 1a 2a 3a 4a 5a): the tip
 * line, the fold «Das kann die App hier» and examples to take over on ten more places of the app.
 *   1a all ten areas at once, 2a only short sentences on the pages (no own «Wissen» page),
 *   3a examples to take over (a tap saves them as an own note; nothing comes into the data by itself),
 *   4a «Passt zu heute» on Packen and Unterwegs too (rain, heat, cold, wind, long tours),
 *   5a a tip may link to a free site (pageinfo.js tipLink).
 * Same shape as PAGES in pageinfo.js (which spreads these in): own words, each a suggestion that can be
 * switched off. Texts are English keys for t(), German in i18n/de/pagetexts.js. Facts are general
 * knowledge, written cautiously («often», «about»); no person, brand or private data.
 * The example templates of a trip («Tagestour», «Wochenende», «Tageswanderung») already live in
 * domains.js; example parts of building blocks belong to the round «Bausteine mehr» (SN3h).
 */

/** «Passt zu heute» while packing (4a): only on a day that fits (contextOf in pageinfo.js). */
const PACK_TODAY = [
  { id: 'pack-rain', kind: 'today', when: 'rain', note: 'only when rain is forecast', text: 'Rain is forecast: rain jacket on top, phone and papers in a dry bag.', link: 'meteo' },
  { id: 'pack-heat', kind: 'today', when: 'heat', note: 'only from 28 °C', text: 'Heat today: one bottle more and the sun cream within reach.', link: 'meteo' },
  { id: 'pack-cold', kind: 'today', when: 'cold', note: 'only below 5 °C', text: 'Cold today: long gloves, overshoes and a warm layer in the bag.', link: 'meteo' },
  { id: 'pack-wind', kind: 'today', when: 'wind', note: 'only with gusts from 50 km/h', text: 'Strong gusts today: a wind jacket weighs little and helps a lot.', link: 'meteo' },
  { id: 'pack-long', kind: 'today', when: 'long', note: 'only before a tour over 100 km', text: 'A long tour is coming: spare tube, pump and food for the whole day.' },
];
/** «Passt zu heute» on the way (4a). */
const RIDE_TODAY = [
  { id: 'ride-rain', kind: 'today', when: 'rain', note: 'only when rain is forecast', text: 'Rain today: brake earlier. White lines and metal covers are slippery when wet.', link: 'meteo' },
  { id: 'ride-heat', kind: 'today', when: 'heat', note: 'only from 28 °C', text: 'Heat today: ride the climbs in the morning and refill at every fountain.', link: 'meteo' },
  { id: 'ride-cold', kind: 'today', when: 'cold', note: 'only below 5 °C', text: 'Cold today: start a little too cool. After ten minutes it is right.', link: 'meteo' },
  { id: 'ride-wind', kind: 'today', when: 'wind', note: 'only with gusts from 50 km/h', text: 'Strong wind today: ride into the wind first and home with it at your back.', link: 'meteo' },
  { id: 'ride-long', kind: 'today', when: 'long', note: 'only before a tour over 100 km', text: 'Long day today: eat early and regularly, not only when you get hungry.' },
];

export const PAGE_TEXTS = {
  trips: {
    tips: [
      { id: 'trips-home-first', text: 'Plan the way home first. The last train decides how long the day may be.', link: 'sbb' },
      { id: 'trips-reserve', text: 'In many long-distance trains a bike needs a reservation in summer. Booking early pays off.', link: 'sbb' },
      { id: 'trips-template', text: 'A template from a good trip makes the next packing list almost by itself.' },
      { id: 'trips-buffer', text: 'Plan a little less than you think. An hour of buffer makes the day relaxed.' },
      { id: 'know-routes', kind: 'know', text: 'SchweizMobil shows signposted cycling routes all over Switzerland, national, regional and local.', link: 'schweizmobil' },
      { id: 'know-gradient', kind: 'know', text: 'On a slope of 5 % you climb 50 metres per kilometre.' },
    ],
    can: [
      { id: 'tpl', title: 'Start from a template', sub: 'Standard, yours or an example', href: '#/pack/templates' },
      { id: 'past', title: 'Past trips', sub: 'with Earth and Everest', href: '#/pack/past' },
      { id: 'debrief', title: 'Look back', sub: 'what was missing, what stays at home', href: '#/debrief' },
    ],
  },
  pack: {
    tips: [
      { id: 'pack-low', text: 'Heavy things low and close to the frame. That keeps the bike calm.' },
      { id: 'pack-top', text: 'What you need during the day belongs on top or in the frame bag.' },
      { id: 'pack-eve', text: 'Pack the evening before and tick off. In the morning only the fresh things are missing.' },
      { id: 'pack-unsure', text: 'Not sure? Take it along once and note in the debrief whether you needed it.' },
      { id: 'know-water', kind: 'know', text: 'A litre of water weighs a kilo. Often it is the heaviest thing in the luggage.' },
      { id: 'know-100g', kind: 'know', text: '100 g less hardly shows on one thing. Over twenty things it is two kilos.' },
      ...PACK_TODAY,
    ],
    can: [
      { id: 'tpl', title: 'Templates', sub: 'a list in one tap', href: '#/pack/templates' },
      { id: 'blocks', title: 'Building blocks', sub: 'things that come along together', href: '#/blocks' },
      { id: 'gear', title: 'Gear|page', sub: 'weights and places', href: '#/gear' },
    ],
    examples: [
      { id: 'ex-leave', title: 'Before you leave', lines: ['Tyres pumped', 'Lights charged', 'Phone and power bank charged', 'Bottles full', 'Ticket and ID'] },
    ],
  },
  ride: {
    tips: [
      { id: 'ride-eat', text: 'Eat something small before you get hungry, about every three quarters of an hour.' },
      { id: 'ride-sips', text: 'Drink a few sips often instead of a lot at once.' },
      { id: 'ride-note', text: 'Note what was missing right away. Two taps here and it is in the debrief.' },
      { id: 'ride-break', text: 'Take a short break before you are tired. Five minutes off the bike help more than you think.' },
      { id: 'know-carbs', kind: 'know', text: 'The body takes up only a limited amount of sugar per hour. Often 30 to 60 g of carbohydrates are named.' },
      { id: 'know-fountain', kind: 'know', text: 'Most village fountains in Switzerland give drinking water. Where not, a sign says «Kein Trinkwasser».' },
      ...RIDE_TODAY,
    ],
    can: [],
  },
  debrief: {
    tips: [
      { id: 'deb-soon', text: 'Write down right after the trip what was missing. The next day it is often gone.' },
      { id: 'deb-three', text: 'What was not needed three times may stay at home next time.' },
      { id: 'deb-short', text: 'One sentence is enough. «Next time two bottles» helps more than a long report.' },
      { id: 'deb-compare', text: 'Compare two trips side by side to see what changed.' },
      { id: 'know-forget', kind: 'know', text: 'Much of a day is forgotten within a few days. A short note keeps it.' },
      { id: 'know-twice', kind: 'know', text: 'A tour is nice twice: once on the bike and once looking back.' },
    ],
    can: [
      { id: 'logbook', title: 'Logbook', sub: 'all trips in one list', href: '#/debrief/logbook' },
      { id: 'learnings', title: 'Learnings', sub: 'what you want to do differently', href: '#/debrief/learnings' },
      { id: 'compare', title: 'Compare trips', sub: 'side by side', href: '#/debrief/compare' },
    ],
    examples: [
      { id: 'ex-next', title: 'Next time different', lines: ['Take along:', 'Leave at home:', 'Route:', 'Food:'] },
    ],
  },
  gear: {
    tips: [
      { id: 'gear-weigh', text: 'Weigh every thing once. Afterwards the app works out every packing list by itself.' },
      { id: 'gear-never', text: 'Things you never used on a trip show under «Save weight».' },
      { id: 'gear-star', text: 'Mark your best things with ☆. They come first when you choose.' },
      { id: 'gear-gone', text: 'A thing you no longer have can be marked as gone. It stays in your old trips.' },
      { id: 'know-gram', kind: 'know', text: 'One gram per thing sounds like little. With 120 things it is 120 g.' },
      { id: 'know-maker', kind: 'know', text: 'Makers often give the weight without bag or straps. Your own scale says what you really carry.' },
    ],
    can: [
      { id: 'blocks', title: 'Building blocks', sub: 'things that come along together', href: '#/blocks' },
      { id: 'never', title: 'Save weight', sub: 'never used and unweighed', href: '#/gear?view=never' },
      { id: 'wish', title: 'Wishlist', sub: 'what you want to buy', href: '#/gear?view=wish' },
      { id: 'import', title: 'Import a list', sub: 'from a table', href: '#/gear/import' },
    ],
  },
  wardrobe: {
    tips: [
      { id: 'ward-layers', text: 'Layers: the inner one carries sweat away, the middle one warms, the outer one keeps off wind and rain.' },
      { id: 'ward-cool', text: 'Start a little too cool. After ten minutes on the bike it is right.' },
      { id: 'ward-warmers', text: 'Arm and leg warmers turn a summer outfit into one for cool mornings.' },
      { id: 'ward-dry', text: 'Wet clothes cool much faster than dry ones. A dry layer for the break is worth its weight.' },
      { id: 'know-merino', kind: 'know', text: 'Merino wool smells less quickly than synthetic fibre. Good for several days.' },
      { id: 'know-hands', kind: 'know', text: 'Hands and feet get cold first: the body keeps its warmth in the trunk.' },
    ],
    can: [],
    examples: [
      { id: 'ex-degrees', title: 'What do I wear at how many degrees?', lines: ['Over 20 °C: short, a vest along', '12–20 °C: arm warmers, wind jacket', '5–12 °C: long, long gloves', 'Below 5 °C: also overshoes and a cap'] },
    ],
  },
  care: {
    tips: [
      { id: 'care-chain', text: 'Measure the chain now and then. With 11 and 12 speeds about 0.5 % stretch is the time to change it.' },
      { id: 'care-tyres', text: 'Tyres lose air even without a hole. Press them briefly before every ride.' },
      { id: 'care-oil', text: 'Clean the chain first, then oil it. Wipe off what is too much: dirt sticks to oil.' },
      { id: 'care-pads', text: 'Brake pads wear faster in rain and mud. Look at them after a wet ride.' },
      { id: 'know-chain', kind: 'know', text: 'A chain changed in time spares the cassette and the chainrings.' },
      { id: 'know-sealant', kind: 'know', text: 'Tubeless sealant dries out. Many makers advise topping it up every few months.' },
    ],
    can: [
      { id: 'strava', title: 'Check Strava rides', sub: 'which bike rode', href: '#/bikes?tab=care&view=strava-check' },
      { id: 'shop', title: 'Workshop', sub: 'visits and receipts', href: '#/bikes?tab=shop' },
      { id: 'ledger', title: 'Ride ledger', sub: 'km per bike', href: '#/debrief/ride' },
    ],
  },
  workshop: {
    tips: [
      { id: 'shop-creak', text: 'Write down before the visit when it creaks: which gear, how fast, after how many km.' },
      { id: 'shop-receipt', text: 'Photograph the receipt right away. For a warranty you find it again.' },
      { id: 'shop-old', text: 'Ask for the old parts. You see how worn they were.' },
      { id: 'shop-km', text: 'Note the km at the visit. Then the app knows when the next care is due.' },
      { id: 'shop-spring', text: 'Book before the season starts. In spring workshops are often full.' },
      { id: 'know-warranty', kind: 'know', text: 'In Switzerland the legal warranty for new things is two years, unless the contract says otherwise.' },
    ],
    can: [
      { id: 'care', title: 'Bike care', sub: 'what is due', href: '#/bikes?tab=care' },
      { id: 'compare', title: 'Compare bikes', sub: 'side by side', href: '#/bikes?tab=compare' },
    ],
  },
  me: {
    tips: [
      { id: 'me-inbox', text: 'A thought on the way? Quickly into the inbox. You can sort it later.' },
      { id: 'me-backup', text: 'A backup on the computer and one on the phone: then nothing gets lost.' },
      { id: 'me-note', text: 'A note can become a packing rule or a wish. Open it and choose.' },
      { id: 'me-search', text: 'The search finds functions too, for example «warranty».' },
      { id: 'know-device', kind: 'know', text: 'Everything stays on your device. Without a backup the data lives only in this browser.' },
      { id: 'know-offline', kind: 'know', text: 'Once opened, the app also starts without internet.' },
    ],
    can: [
      { id: 'inbox', title: 'Inbox', sub: 'catch quickly, sort later', href: '#/inbox' },
      { id: 'notes', title: 'Notes', sub: 'with checklists and photos', href: '#/notes' },
      { id: 'data', title: 'Data and backup', sub: 'save and restore', href: '#/me/data' },
      { id: 'handbook', title: 'Handbook', sub: 'every function with steps', href: '#/me/handbook' },
    ],
  },
};

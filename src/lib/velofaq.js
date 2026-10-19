/**
 * «Velo-FAQ» (Noah 19.10.2026 «lustiges und nützliches FAQ zu Velopflege, Reparatur und sinnvollem
 * Content»): questions and answers on care, breakdowns, wear, bikepacking and myths, each with a wink.
 * Page: Bikes › Care › «Bike FAQ» (#/bikes?tab=care&view=faq), loaded only when opened, works offline.
 * It complements the «Workshop cheat sheet» (spick.js: torque, breakdown steps) and the inspection
 * (inspect/): the FAQ answers «why» and «when», and links there for the steps.
 * Own questions: settings FAQ_OWN [{ id, q, a }] (add, change, move with arrows and drag, delete with Undo).
 * English source, German through t() (i18n/de/velofaq.js). Pure functions, tested in tests/velofaq.test.js.
 */

/** Key in the settings table: the own questions. */
export const FAQ_OWN = 'faqOwn';

/** The page and its links. */
export const FAQ_HREF = '#/bikes?tab=care&view=faq';
const SPICK = { label: 'Workshop cheat sheet', href: '#/bikes?tab=care&view=spick' };
const QUICK = { label: 'Quick check', href: '#/bikes?tab=care&view=inspect&level=quick' };
const FULL = { label: 'Full inspection', href: '#/bikes?tab=care&view=inspect&level=full' };
const MEASURE = { label: 'Enter values', href: '#/bikes?tab=compare&view=enter' };
const SERVICE = { label: 'Bike service', href: '#/bikes?tab=care' };
const SITPOS = { label: 'Sitting position', href: '#/me/tools/sitpos' };
const WARDROBE = { label: 'Wardrobe', href: '#/wardrobe' };
const POWER = { label: 'Power budget', href: '#/gear/power' };
const RIDE = { label: 'On the road', href: '#/ride' };

/** The topics, in the order of the page. */
export const FAQ_TOPICS = [
  { key: 'care', name: 'Care and cleaning' },
  { key: 'road', name: 'Breakdowns on the road' },
  { key: 'wear', name: 'Wear and parts' },
  { key: 'trip', name: 'Bikepacking and long rides' },
  { key: 'fit', name: 'Sitting and feeling good' },
  { key: 'weather', name: 'Weather and clothing' },
  { key: 'safe', name: 'Light, lock and safety' },
  { key: 'fuel', name: 'Eating and drinking' },
  { key: 'myth', name: 'Myths and excuses' },
];

/** The questions: q the question, a the answer, wink one line with a smile, link the place in the app. */
export const FAQ = [
  // Care and cleaning
  {
    key: 'wash',
    topic: 'care',
    q: 'How often should I wash my bike?',
    a: 'After muddy or wet rides, otherwise every few weeks. A bucket, a soft brush and bike cleaner are enough. Keep the pressure washer away from bearings, hubs and the headset.',
    wink: 'A clean bike is not faster. It just feels like it.',
  },
  {
    key: 'oil',
    topic: 'care',
    q: 'How do I oil the chain properly?',
    a: 'Clean the chain first. Then one drop on every roller while you pedal backwards, let it soak in for a few minutes and wipe off the rest well. The oil belongs inside the chain, not on the outside.',
    wink: 'A chain tattoo on your calf means: too much oil.',
  },
  {
    key: 'oilwhen',
    topic: 'care',
    q: 'When does the chain need oil?',
    a: 'When it sounds dry or squeaks, after rain and after washing. Wet lube for rain, dry lube for dust; wax lasts long on dry roads.',
    wink: 'A squeaking chain is not singing. It is calling for help.',
  },
  {
    key: 'pressure',
    topic: 'care',
    q: 'Which tyre pressure is right?',
    a: 'It depends on the tyre width, your weight with luggage and the surface. Start with a pressure calculator or the range on the tyre, then go lower in small steps until it grips well without the rim hitting. Never above what the tyre or rim allows.',
    wink: 'Rock hard is not fast. Just loud.',
    link: MEASURE,
  },
  {
    key: 'minute',
    topic: 'care',
    q: 'What do I check before every ride?',
    a: 'Brakes pull firmly, wheels sit tight, tyres have air. Lift the bike a few centimetres and let it drop: if something rattles, something is loose. One minute, done.',
    wink: 'One minute in the hallway saves an hour at the roadside.',
    link: QUICK,
  },
  {
    key: 'winter',
    topic: 'care',
    q: 'What does my bike need in winter?',
    a: 'Road salt eats everything made of metal. After salty roads rinse the bike with water, dry the chain and oil it again. Store the bike dry.',
    wink: 'Your bike needs no winter jacket. Just a shower after salt.',
  },
  {
    key: 'carbon',
    topic: 'care',
    q: 'Carbon parts: what do I watch out for?',
    a: 'Use a torque wrench and carbon paste, never more than the printed value. After a crash look for cracks and soft spots; when in doubt, let the bike shop check it.',
    wink: '«Feels tight» is not a unit.',
    link: SPICK,
  },
  // Breakdowns on the road
  {
    key: 'kit',
    topic: 'road',
    q: 'What belongs in the saddle bag?',
    a: 'A spare tube (also with tubeless), tyre levers, plugs for tubeless, a mini pump or CO₂, a multitool with a chain tool, a quick link, a few cable ties and some tape. On long trips add a spare derailleur hanger for your frame.',
    wink: 'Cable ties are the duct tape of cyclists.',
    link: SPICK,
  },
  {
    key: 'flat',
    topic: 'road',
    q: 'Flat tyre: tube or plug?',
    a: 'Tubeless: let the sealant work first, then plug. Fit a tube only when nothing holds. With a tube: always find the cause inside the tyre first, or the next flat follows right away.',
    wink: 'The thorn in the tyre is patient. It waits for your new tube.',
    link: SPICK,
  },
  {
    key: 'chain',
    topic: 'road',
    q: 'The chain broke. Now what?',
    a: 'Push out the broken link with the chain tool and join the chain with a quick link of the same speed count. Afterwards avoid the biggest cog with the big chainring. The steps are in the cheat sheet.',
    wink: 'Pushing is cycling too. Just slower.',
    link: SPICK,
  },
  {
    key: 'squeal',
    topic: 'road',
    q: 'Why do my disc brakes squeal?',
    a: 'Mostly water, dirt or oil on the pads or the rotor. Brake firmly a few times. If it stays, clean the rotor with isopropyl alcohol; oily pads must be replaced. Never spray chain oil near the brake.',
    wink: 'Disc brakes and chain oil: a love story with a bad ending.',
  },
  {
    key: 'creak',
    topic: 'road',
    q: 'Something creaks. Where?',
    a: 'First find out when: standing, sitting, pedalling or braking. Then check the bolts with the torque wrench: pedals, saddle, seatpost, stem, thru axles. The bottom bracket and the headset come last.',
    wink: 'Most creaks come from somewhere else than you think.',
    link: SPICK,
  },
  {
    key: 'shift',
    topic: 'road',
    q: 'The gears jump. What helps?',
    a: 'Often the cable has stretched: turn the barrel adjuster at the derailleur half a turn anticlockwise and test again. After a fall check the derailleur hanger first. A worn chain or cassette jumps too.',
    wink: 'Half a turn. Not five.',
  },
  // Wear and parts
  {
    key: 'chainwear',
    topic: 'wear',
    q: 'When does the chain need replacing?',
    a: 'Measure it with a chain checker. At about 0.5 % stretch a new chain is due. Wait much longer and the cassette and chainrings have to go too.',
    wink: 'A new chain costs a pizza. A new drivetrain costs a weekend away.',
    link: MEASURE,
  },
  {
    key: 'pads',
    topic: 'wear',
    q: 'How do I know the brake pads are worn?',
    a: 'Look into the caliper: with less than about 1 mm of pad left (without the backing plate), replace them. A scraping metal sound means it is already late: check the rotor too.',
    wink: 'Metal on metal only sounds good in music.',
    link: QUICK,
  },
  {
    key: 'tyres',
    topic: 'wear',
    q: 'When are the tyres worn?',
    a: 'When the wear marks are gone, the tread is flat, the casing shows through or there are cuts. The rear tyre wears faster. The better tyre belongs at the front.',
    wink: 'Threads showing is not vintage. It is a risk.',
  },
  {
    key: 'rotor',
    topic: 'wear',
    q: 'Do brake rotors wear out?',
    a: 'Yes. The minimum thickness is printed on the rotor, often about 1.5 mm. Measure with a calliper; below it, replace the rotor.',
    wink: 'Rotors are thin-skinned. Literally.',
  },
  {
    key: 'shop',
    topic: 'wear',
    q: 'How often should the bike go to the bike shop?',
    a: 'A full service once a year, more often if you ride a lot or in bad weather. Suspension forks and shocks have their own intervals in the manual. The app reminds you by km, hours or days.',
    wink: 'The bike shop is no defeat. It is a spa day for your bike.',
    link: SERVICE,
  },
  // Bikepacking and long rides
  {
    key: 'before',
    topic: 'trip',
    q: 'What do I check before a long tour?',
    a: 'A week before: chain, brake pads, tyres, every bolt with the torque wrench, the bags fitted and one test ride fully loaded. Never ride new parts for the first time on the trip.',
    wink: 'Day 1 is no test ride. It only feels like one.',
    link: FULL,
  },
  {
    key: 'bags',
    topic: 'trip',
    q: 'The bags rub the frame. What helps?',
    a: 'Protect the frame with frame tape where the straps sit. Pull the straps tight, and pack heavy things low and in the middle.',
    wink: 'Frame tape is cheaper than paint.',
  },
  {
    key: 'rain',
    topic: 'trip',
    q: 'It rained for days. What now?',
    a: 'Rinse the chain if you can, dry it and oil it again. Look at the brake pads every evening: in the rain grit wears them down fast.',
    wink: 'Wet lube was made for days like these.',
  },
  {
    key: 'ultra',
    topic: 'trip',
    q: 'What should I be able to fix myself in an ultra race?',
    a: 'A flat in under ten minutes, a broken chain, a rubbing brake and a loose bolt. Practise at home where it is warm, not at night in the rain at km 600.',
    wink: 'At km 600 every bolt holds a grudge.',
    link: SPICK,
  },
  {
    key: 'load',
    topic: 'trip',
    q: 'How much luggage can my bike take?',
    a: 'Look for the maximum total weight (rider, bike and luggage) in the manual. Carbon seatposts and handlebars often have their own limits for bags.',
    wink: 'Your bike does not mind the snacks. The rim might.',
  },
  // Sitting and feeling good
  { key: 'numb', topic: 'fit', q: 'My hands go numb. Why?', a: 'Usually too much weight on the hands or bent wrists. Change your grip often, keep the wrists straight, and try the handlebar a little higher. Padded gloves help.', wink: 'Your hands are for steering, not for carrying you.', link: SITPOS },
  { key: 'saddle', topic: 'fit', q: 'My bottom hurts. Is the saddle wrong?', a: 'Maybe, but first check the height, the tilt and your shorts. A saddle should fit your sit bones; many bike shops measure them. Give a new saddle a few rides before you judge it.', wink: 'Softer is not always better. Sofas make bad bikes.' },
  { key: 'height', topic: 'fit', q: 'How do I find the right saddle height?', a: 'Heel on the pedal at the lowest point: the leg is almost straight. Pedalling with the ball of the foot, the knee then stays slightly bent. Change it in steps of a few millimetres.', wink: 'Too low hurts the knees, too high the hips. Just right is in the middle.', link: SITPOS },
  { key: 'knee', topic: 'fit', q: 'My knee hurts after rides. What do I check?', a: 'Saddle height, saddle setback and the cleats are the usual suspects. Change one thing at a time. If it stays, get a bike fit or see a professional.', wink: 'Your knee is a good bike fitter. It just speaks loudly.' },
  { key: 'cadence', topic: 'fit', q: 'Pedal fast or push hard?', a: 'An easier gear and faster pedalling spare the knees and tire you less on long days. Shift early before a climb, not when you are already stuck.', wink: 'Grinding up in the big gear impresses nobody. Not even the hill.' },
  // Weather and clothing
  { key: 'layers', topic: 'weather', q: 'Cold in the morning, warm at noon: what do I wear?', a: 'Layers: a thin base layer, a jersey, a light vest or jacket, arm and leg warmers. Take something off before you sweat, put it on before you get cold.', wink: 'The onion principle works for cyclists and soups.', link: WARDROBE },
  { key: 'rainwear', topic: 'weather', q: 'Which rain jacket for the bike?', a: 'Breathable, long at the back, with a hood that fits under the helmet or none at all. Bright colours and reflectors help you be seen.', wink: 'No jacket keeps you dry for ten hours. A good one keeps you happy.' },
  { key: 'coldhands', topic: 'weather', q: 'Cold hands and feet: what helps?', a: 'Windproof gloves and overshoes, thin liner gloves underneath if needed. Shoes not too tight, so the blood flows. Warm drinks and enough food keep you warm too.', wink: 'Cold toes are your body asking for a café stop.' },
  { key: 'heat', topic: 'weather', q: 'Riding in the heat: what do I watch out for?', a: 'Start early, drink before you are thirsty and add salt or electrolytes on long rides. Light clothing and sun cream; plan shade and water stops.', wink: 'The sun takes no breaks. You have to.' },
  { key: 'wind', topic: 'weather', q: 'Headwind all day. Any tricks?', a: 'Get lower on the bike, choose an easier gear and keep an even pace. If you can, plan the route so the wind is behind you on the way home.', wink: 'Headwind is a hill that never ends. Tailwind is your fitness, of course.' },
  // Light, lock and safety
  { key: 'light', topic: 'safe', q: 'Which lights do I need?', a: 'White at the front, red at the back, bright enough to be seen in daylight too. On long rides a dynamo or lights that charge from a power bank. Reflectors on pedals and wheels help a lot.', wink: 'Be seen first, look cool second.' },
  { key: 'lock', topic: 'safe', q: 'Which lock is good enough?', a: 'A sturdy U-lock or folding lock, and a second lock for the wheel on longer stops. Lock the frame to something fixed. Busy, bright places are better than hidden corners.', wink: 'The best lock is the one you actually take along.' },
  { key: 'theft', topic: 'safe', q: 'What do I note now, in case the bike gets stolen?', a: 'The frame number, photos of the whole bike and its details, the receipt and the insurance. Note it in the app now, not afterwards. A hidden tracker can help.', wink: 'Thieves do not make appointments.' },
  { key: 'crash', topic: 'safe', q: 'I fell. What do I check on the bike?', a: 'Handlebar straight, brakes work, wheels spin true, derailleur and hanger straight, no cracks in the frame or carbon parts. A helmet that took a hit gets replaced.', wink: 'First check yourself, then the bike. In that order.', link: QUICK },
  { key: 'power', topic: 'safe', q: 'Will my power bank last the trip?', a: 'Add up what lights, GPS and phone need per day and compare it with what you can charge. On long rides charge whenever there is a socket.', wink: 'A café with a socket is worth two without.', link: POWER },
  // Eating and drinking
  { key: 'eat', topic: 'fuel', q: 'How much should I eat on long rides?', a: 'Little and often: something every 30 to 45 minutes, before you feel hungry. On long days plan real meals too.', wink: 'The hunger crash is always on time. You just never expect it.', link: RIDE },
  { key: 'drink', topic: 'fuel', q: 'How much should I drink?', a: 'Small sips regularly, more in the heat. In warm weather about one bottle per hour is a rough guide.', wink: 'Thirst is a late messenger.' },
  { key: 'snacks', topic: 'fuel', q: 'Which snacks work on the bike?', a: 'Things you can eat with one hand that do not melt: bananas, bars, dried fruit, nuts, sandwiches. Try new food at home, not on race day.', wink: 'Chocolate in summer is a drink.' },
  { key: 'water', topic: 'fuel', q: 'Where do I find water on the road?', a: 'Village fountains, cemeteries, petrol stations and cafés. Check whether the water is drinkable; many fountains in Switzerland are. In remote areas carry a filter.', wink: 'Ask nicely and you get water almost anywhere.' },
  { key: 'after', topic: 'fuel', q: 'What do I eat after a long ride?', a: 'Within about an hour something with carbohydrates and protein, and plenty to drink. A proper meal later.', wink: 'Recovery starts with dessert. More or less scientifically.' },
  // Myths and excuses
  {
    key: 'wd40',
    topic: 'myth',
    q: 'Is the classic water-displacing spray a chain oil?',
    a: 'No. It cleans and pushes water away, and it washes the lube out of the chain. Use real chain oil.',
    wink: 'Like shampoo as body lotion: technically liquid, still wrong.',
  },
  {
    key: 'hard',
    topic: 'myth',
    q: 'Harder tyres are faster, right?',
    a: 'Only on perfectly smooth roads. On normal tarmac and gravel a little less pressure rolls faster, because the tyre swallows the bumps instead of making the bike bounce. And it grips better.',
    wink: 'For once your bottom and physics agree.',
  },
  {
    key: 'fragile',
    topic: 'myth',
    q: 'Is carbon fragile?',
    a: 'Carbon is very strong in the directions it was built for, but sensitive to sharp knocks and to bolts that are too tight. Treat it with a torque wrench, not with fear.',
    wink: 'Carbon is no diva. Just a bit sensitive.',
  },
  {
    key: 'tools',
    topic: 'myth',
    q: 'Do I need expensive tools?',
    a: 'No. A multitool, a floor pump with a gauge, a chain checker and a small torque wrench cover most jobs. Buy the rest when you need it.',
    wink: 'The most important tool: knowing when the bike shop is better.',
  },
  {
    key: 'excuse',
    topic: 'myth',
    q: 'Is «my bike needs a service» a good reason not to ride?',
    a: 'Only if the brakes do not work. Otherwise: the one-minute check, and off you go.',
    wink: 'Nice try.',
    link: QUICK,
  },
];

/** Every text of the FAQ that goes through t() (the German test reads this list). */
export const FAQ_TEXTS = [
  ...FAQ_TOPICS.map((x) => x.name),
  ...FAQ.flatMap((f) => [f.q, f.a, f.wink, f.link?.label].filter(Boolean)),
];

/** The question of the day: the same all day, a different one tomorrow. day: 'YYYY-MM-DD'. */
export function faqOfDay(day, list = FAQ) {
  if (!list.length) return null;
  const n = Math.floor(Date.parse(`${day}T12:00:00Z`) / 864e5);
  return list[(((Number.isFinite(n) ? n : 0) % list.length) + list.length) % list.length];
}

/** The next question after key (the «Another one» button), round and round. */
export function nextFaq(key, list = FAQ) {
  if (!list.length) return null;
  const at = list.findIndex((f) => f.key === key);
  return list[(at + 1) % list.length];
}

/** The questions a search keeps: every word in the question, the answer or the wink (as shown). */
export function searchFaq(list, query = '', tr = (s) => s) {
  const words = String(query).toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!words.length) return list;
  return list.filter((f) => {
    const text = [f.q, f.a, f.wink].filter(Boolean).map((s) => `${s} ${tr(s)}`).join(' ').toLowerCase();
    return words.every((w) => text.includes(w));
  });
}

/** The own questions as stored (a list of { id, q, a }; anything else is left out). */
export const normOwn = (raw) =>
  (Array.isArray(raw) ? raw : []).filter((r) => r && typeof r.id === 'string' && typeof r.q === 'string' && r.q.trim()).map((r) => ({ id: r.id, q: r.q, a: String(r.a ?? '') }));

let seq = 0;
/** Add an own question. → the new list (unchanged when the question is empty). */
export function addOwn(list, q, a = '', now = Date.now()) {
  const text = String(q ?? '').trim();
  if (!text) return normOwn(list);
  return [...normOwn(list), { id: `faq-${now.toString(36)}-${(seq++).toString(36)}`, q: text, a: String(a ?? '').trim() }];
}
/** Change the question and/or the answer of an own question (an empty question keeps the old one). */
export const changeOwn = (list, id, patch) =>
  normOwn(list).map((r) =>
    r.id === id ? { ...r, ...(patch.q != null && String(patch.q).trim() ? { q: String(patch.q).trim() } : {}), ...(patch.a != null ? { a: String(patch.a).trim() } : {}) } : r,
  );
/** Remove an own question. → { list, row, at } (row and at for Undo). */
export function removeOwn(list, id) {
  const rows = normOwn(list);
  const at = rows.findIndex((r) => r.id === id);
  return at < 0 ? { list: rows, row: null, at: -1 } : { list: rows.filter((r) => r.id !== id), row: rows[at], at };
}
/** Put a removed question back at its place (Undo). */
export function restoreOwn(list, row, at) {
  const rows = normOwn(list);
  if (!row || rows.some((r) => r.id === row.id)) return rows;
  rows.splice(Math.max(0, Math.min(at, rows.length)), 0, row);
  return rows;
}
/** Move an own question (arrows and drag). */
export function moveOwn(list, from, to) {
  const rows = normOwn(list);
  if (from < 0 || from >= rows.length || to < 0 || to >= rows.length || from === to) return rows;
  const [r] = rows.splice(from, 1);
  rows.splice(to, 0, r);
  return rows;
}

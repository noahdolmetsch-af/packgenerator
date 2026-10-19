/**
 * «Velo-Inspektion» (Noah 19.10.2026 «1a 2a 3a 4a 5a», plan notes/velo-inspektion-2026-10-19/plan.md):
 * the checklist template, three levels, the guide of every point. Everything in the app bundle, so it
 * works offline. English source, German through t(). Own points and names never go through t().
 *
 * Built on «Velo im Griff» (Paket I): the torque values come from spick.js TORQUE (torque: [keys]),
 * the bike kind from bikekind.js, the part keys from care.js PARTS. Nothing is copied from the sources:
 * the steps are our own short sentences, the sources are links (LINKS).
 *
 * A point: { id, area, level, kinds?, needs?, name, measure?, part?, torque?, tools, steps, who, shop, tip?, links }
 *   level: the smallest level it belongs to (quick ⊂ monthly ⊂ full);
 *   kinds: only for these bike kinds (missing: all); needs: 'fork' | 'shock', only when the bike has that part;
 *   measure: { unit, warnAt, limit, low } a value to type (low: a low value is worn, e.g. rotor thickness);
 *   part: the care.js part this point checks (its history gets an entry when the inspection is saved);
 *   who: 'self' (no special tool), 'tool' (yourself, with a special tool), 'shop' (the bike shop);
 *   shop: one sentence «when to go to the bike shop»; tip: one best-practice sentence.
 */

/** The three levels (5a): what each covers and the standard interval (km and/or days, whichever comes first). */
export const LEVELS = [
  { key: 'quick', name: 'Quick check', short: 'Quick', mins: 2, every: null, text: 'Before a ride: air, brakes, axles, chain.' },
  { key: 'monthly', name: 'Monthly check', short: 'Monthly', mins: 15, every: { km: 500, days: 30 }, text: 'Measure the chain, look at the pads, check the bolts.' },
  { key: 'full', name: 'Full inspection', short: 'Full', mins: 75, every: { km: 1500, days: 90 }, text: 'Every point, with values and photos. At the start of the season and before big trips.' },
];
export const LEVEL = Object.fromEntries(LEVELS.map((l) => [l.key, l]));
export const LEVEL_RANK = { quick: 0, monthly: 1, full: 2 };

/** The areas of the checklist, in this order (the person can rename, delete, reorder and add areas). */
export const AREAS = [
  { id: 'frame', name: 'Frame and fork' },
  { id: 'drive', name: 'Drivetrain' },
  { id: 'brakes', name: 'Brakes' },
  { id: 'wheels', name: 'Wheels and tyres' },
  { id: 'cockpit', name: 'Cockpit and saddle' },
  { id: 'suspension', name: 'Suspension' },
  { id: 'extras', name: 'Lights and accessories' },
];

/** The sources (links, not copies). title is shown, lang tells the language of the page. */
export const LINKS = {
  canyon: { title: 'Canyon: bike inspection checklist', url: 'https://www.canyon.com/de-ch/blog-content/fahrrad-ratgeber/fahrrad-inspektion-checkliste/b20022025.html', lang: 'DE' },
  canyonMtb: { title: 'Canyon: mountain bike manual (PDF)', url: 'https://www.canyon.com/on/demandware.static/-/Library-Sites-canyon-shared/de/dw6c227452/documents/customer-service/mountain-bikes/canyon-mtb-manual.pdf', lang: 'DE' },
  canyonRoad: { title: 'Canyon: road bike manual (PDF)', url: 'https://www.canyon.com/on/demandware.static/-/Library-Sites-canyon-shared/de/dw06e84019/documents/customer-service/road-bikes/canyon-road-bike-manual.pdf', lang: 'DE' },
  parktool: { title: 'Park Tool: repair help', url: 'https://www.parktool.com/en-us/blog/repair-help', lang: 'EN' },
  chain: { title: 'Park Tool: when to replace a chain', url: 'https://www.parktool.com/en-us/blog/repair-help/when-to-replace-a-chain-on-a-bicycle', lang: 'EN' },
  pads: { title: 'Bike Gremlin: when to replace disc brake pads', url: 'https://bike.bikegremlin.com/20335/when-to-replace-bicycle-disc-brake-pads', lang: 'EN' },
  rotor: { title: 'SRAM: when to replace a brake rotor', url: 'https://support.sram.com/hc/en-us/articles/5927659863067-When-should-I-replace-my-SRAM-brake-rotor', lang: 'EN' },
  rockshox: { title: 'RockShox: service intervals', url: 'https://support.rockshox.com/hc/en-us/articles/4412306753947-How-often-should-I-service-my-RockShox-product', lang: 'EN' },
  fox: { title: 'Flow MTB: suspension service intervals (Fox and others)', url: 'https://flowmountainbike.com/features/flows-guide-to-understanding-suspension-service-intervals-and-upgrade-options/', lang: 'EN' },
  sealant: { title: 'Slowtwitch: tubeless sealant tips', url: 'https://www.slowtwitch.com/industry/tubeless-sealant-tips-and-strategy/', lang: 'EN' },
  torque: { title: 'Shimano: torque values (PDF)', url: 'https://si.shimano.com/en/pdfs/dm/TORQUE/DM-TORQUE-03-ENG.pdf', lang: 'EN' },
  suva: { title: 'Suva: bike check in six steps', url: 'https://www.suva.ch/de-ch/ueber-uns/magazin-und-medien/magazin/velo-check-wartung-in-sechs-schritten', lang: 'DE' },
  bfu: { title: 'BFU: bike equipment (PDF)', url: 'https://www.bfu.ch/media/t4nfjqzy/p-ab_z2_1-2_veloausruestung_de.pdf', lang: 'DE' },
};

/** «Who does it» (the shop light): yourself, yourself with a special tool, the bike shop. */
export const WHO = [
  { key: 'self', name: 'Yourself' },
  { key: 'tool', name: 'Yourself, special tool' },
  { key: 'shop', name: 'Bike shop' },
];

const MM_PAD = { unit: 'mm', warnAt: 1.5, limit: 1, low: true };
const MM_ROTOR = { unit: 'mm', warnAt: 1.6, limit: 1.5, low: true };

/** The checklist template (about 30 points). */
export const ITEMS = [
  // Frame and fork
  { id: 'wash', area: 'frame', level: 'full', name: 'Wash the bike first', tools: ['Bucket, soft brush, bike cleaner'], steps: ['Wash from top to bottom with little water pressure.', 'Dry it, especially the chain.', 'A clean bike shows cracks and leaks.'], who: 'self', shop: '', tip: 'Never point a pressure washer at bearings.', links: ['suva'] },
  { id: 'frame', area: 'frame', level: 'monthly', name: 'Frame and fork: cracks and dents', tools: ['Torch'], steps: ['Look at the joints, the dropouts and under the down tube.', 'Run a finger along the tubes: a crack catches.', 'Carbon: a dull spot or a crunch when pressed is a warning.'], who: 'self', shop: 'Any crack, dent or a crunch in carbon: stop riding and have it checked.', tip: 'Protect rub spots of cables and bags with tape.', links: ['canyon'] },
  { id: 'headset', area: 'frame', level: 'monthly', name: 'Headset: no play', torque: ['steerer'], tools: ['Hex keys'], steps: ['Pull the front brake and rock the bike back and forth.', 'Keep a finger on the gap between headset and frame: it must not move.', 'Turn the bar: it must turn smoothly, without notches.'], who: 'self', shop: 'Play that stays after tightening, or the bar turns in notches: bearings to the shop.', tip: '', links: ['parktool'] },
  { id: 'axles', area: 'frame', level: 'quick', name: 'Thru axles closed', torque: ['axle'], tools: [], steps: ['Check both axles are closed and tight.', 'Lever axles point backwards.'], who: 'self', shop: '', tip: 'After a crash: check that the wheels still sit straight.', links: ['canyonMtb'] },
  { id: 'hanger', area: 'frame', level: 'full', name: 'Derailleur hanger straight', tools: ['Hanger alignment gauge'], steps: ['Look from behind: the derailleur hangs straight under the cogs.', 'Bent: straighten with the gauge, or fit the spare hanger.'], who: 'tool', shop: 'No gauge or no spare: the shop straightens it in minutes.', tip: 'Carry a spare hanger on long trips: it fits only your frame.', links: ['parktool'] },
  // Drivetrain
  { id: 'chainclean', area: 'drive', level: 'quick', name: 'Chain clean and lubed', tools: ['Rag, chain lube'], steps: ['Wipe the chain with a rag while you turn the pedals backwards.', 'One drop of lube per roller, wait, wipe off the rest.'], who: 'self', shop: '', tip: 'After rain: dry and lube the chain on the same day.', links: ['parktool'] },
  { id: 'chainwear', area: 'drive', level: 'monthly', name: 'Chain wear', part: 'chain', measure: { unit: '%', warnAt: 0.4, limit: 0.5 }, tools: ['Chain checker'], steps: ['Put the checker on the chain, between the inner plates.', 'Read the value: 0.5 % on 11–13 speed, 0.75 % on 5–10 speed means replace.', 'Type the value: the app shows the trend.'], who: 'tool', shop: '', tip: 'A chain replaced in time saves the cassette and the chainrings.', links: ['chain'] },
  { id: 'cassette', area: 'drive', level: 'full', name: 'Cassette and chainrings: teeth', tools: ['Torch'], steps: ['Look at the teeth: sharp hooks or a shark-fin shape mean worn.', 'A new chain that skips under load: the cassette is worn too.'], who: 'self', shop: 'Cassette or chainring worn: replace (yourself with tools, or the shop).', tip: '', links: ['parktool'] },
  { id: 'shifting', area: 'drive', level: 'monthly', name: 'Shifting through all gears', torque: ['derailleur', 'cable'], tools: [], steps: ['Lift the rear wheel and shift through all gears.', 'Every gear must click in cleanly and run quietly.', 'Mechanical: turn the barrel adjuster a quarter turn at a time.'], who: 'self', shop: 'Still jumps after adjusting, or electronic shifting shows an error: shop.', tip: 'Electronic shifting: charge the battery before every trip.', links: ['parktool'] },
  { id: 'bb', area: 'drive', level: 'full', name: 'Bottom bracket and cranks: no play', torque: ['crank', 'chainring'], tools: ['Hex keys'], steps: ['Hold both cranks and push them sideways: nothing may move.', 'Turn the cranks without the chain: smooth, no grinding.'], who: 'self', shop: 'Play, grinding or creaking from the bottom bracket: shop (press tools).', tip: '', links: ['parktool'] },
  { id: 'pedals', area: 'drive', level: 'full', name: 'Pedals and cleats', torque: ['pedal'], tools: ['Pedal spanner or hex key'], steps: ['Pedals tight, turning smoothly, no play.', 'Cleats: worn edges make clicking in hard.'], who: 'self', shop: '', tip: 'Grease the pedal threads when you fit them.', links: ['parktool'] },
  // Brakes
  { id: 'brakefeel', area: 'brakes', level: 'quick', name: 'Brakes: firm pressure point', tools: [], steps: ['Pull each lever hard: it must stop well before the bar.', 'Push the bike: both brakes stop the wheel.'], who: 'self', shop: 'The lever goes to the bar or feels soft: bleed the brake (shop or bleed kit).', tip: 'Never pull the lever with the wheel out.', links: ['canyonMtb'] },
  { id: 'padsF', area: 'brakes', level: 'monthly', name: 'Brake pads front: thickness', part: 'padsF', measure: MM_PAD, tools: ['Torch, or calliper'], steps: ['Look into the caliper from above, or take the pads out.', 'Measure the pad without the backing plate.', 'Under 1 mm: replace. Never ride below 0.5 mm.'], who: 'self', shop: '', tip: 'Glazed pads after a long descent: sand them lightly.', links: ['pads'] },
  { id: 'padsR', area: 'brakes', level: 'monthly', name: 'Brake pads rear: thickness', part: 'padsR', measure: MM_PAD, tools: ['Torch, or calliper'], steps: ['Look into the caliper from above, or take the pads out.', 'Measure the pad without the backing plate.', 'Under 1 mm: replace. Never ride below 0.5 mm.'], who: 'self', shop: '', tip: '', links: ['pads'] },
  { id: 'rotorF', area: 'brakes', level: 'full', name: 'Brake rotor front: thickness', part: 'rotorF', measure: MM_ROTOR, torque: ['rotor', 'lockring'], tools: ['Calliper'], steps: ['Measure where the pads touch.', 'The minimum is printed on the rotor (often 1.5 mm).', 'Spin the wheel: a wobbling rotor rubs.'], who: 'tool', shop: '', tip: 'New pads with a new pad type: often a new rotor too.', links: ['rotor'] },
  { id: 'rotorR', area: 'brakes', level: 'full', name: 'Brake rotor rear: thickness', part: 'rotorR', measure: MM_ROTOR, torque: ['rotor', 'lockring'], tools: ['Calliper'], steps: ['Measure where the pads touch.', 'The minimum is printed on the rotor (often 1.5 mm).', 'Spin the wheel: a wobbling rotor rubs.'], who: 'tool', shop: '', tip: '', links: ['rotor'] },
  { id: 'hoses', area: 'brakes', level: 'full', name: 'Brake hoses and calipers', torque: ['caliper', 'lever'], tools: ['Hex keys'], steps: ['Follow each hose: no oil, no kinks, no rub spots.', 'Caliper and lever bolts tight.'], who: 'self', shop: 'Oil on the hose, the caliper or the rotor: shop at once, do not ride.', tip: 'Oil on pads: they cannot be cleaned, replace them.', links: ['parktool'] },
  // Wheels and tyres
  { id: 'pressure', area: 'wheels', level: 'quick', name: 'Tyre pressure', measure: { unit: 'bar' }, tools: ['Pump with gauge'], steps: ['Pump to your pressure (see the bike values).', 'Tubeless loses a little air every day.'], who: 'self', shop: '', tip: 'Wet roads and trails: a little less pressure for more grip.', links: ['bfu'] },
  { id: 'tyres', area: 'wheels', level: 'monthly', name: 'Tyres: tread and cuts', part: 'tyres', tools: ['Torch'], steps: ['Turn each wheel slowly and look at the tread and the sides.', 'Pull out glass and thorns.', 'A cut you can see the casing through: replace the tyre.'], who: 'self', shop: '', tip: 'The rear tyre wears about twice as fast as the front.', links: ['suva'] },
  { id: 'sealant', area: 'wheels', level: 'monthly', name: 'Tubeless sealant', part: 'tyres', tools: ['Valve core tool, sealant, syringe'], steps: ['Shake the wheel: you should hear sealant.', 'Top up every 2–7 months through the valve, sooner in heat.', 'Note the amount in ml.'], who: 'self', shop: '', tip: 'Latex balls inside the tyre: clean out when you change the tyre.', links: ['sealant'] },
  { id: 'true', area: 'wheels', level: 'full', name: 'Wheels true, spokes tight', tools: ['Spoke key'], steps: ['Spin the wheel and watch the gap at the brake or frame.', 'Squeeze spoke pairs: all should feel about the same.'], who: 'tool', shop: 'A wobble over 2 mm, a broken spoke, or a dented rim: shop.', tip: '', links: ['parktool'] },
  { id: 'hubs', area: 'wheels', level: 'full', name: 'Hubs and freehub: no play', tools: [], steps: ['Hold the wheel at the rim and push it sideways: no knock.', 'Pedal backwards: the freehub must not grab or stick.'], who: 'self', shop: 'Play or grinding in the hub: shop (bearings).', tip: '', links: ['parktool'] },
  // Cockpit and saddle
  { id: 'bolts', area: 'cockpit', level: 'monthly', name: 'Stem, bar, seatpost: torque', torque: ['stem', 'steerer', 'seatclamp', 'saddle'], tools: ['Torque wrench 2–15 Nm'], steps: ['Check each bolt with the torque wrench, crosswise.', 'The value printed on the part always wins.', 'Carbon: carbon paste, never more than printed.'], who: 'tool', shop: '', tip: 'A creak often comes from a dry seatpost or a loose bolt.', links: ['torque'] },
  { id: 'grips', area: 'cockpit', level: 'full', name: 'Grips or bar tape', tools: [], steps: ['Grips must not turn.', 'Bar tape: no holes, ends taped.'], who: 'self', shop: '', tip: '', links: ['parktool'] },
  { id: 'dropper', area: 'cockpit', level: 'full', kinds: ['mtb', 'gravel'], name: 'Dropper post', tools: [], steps: ['Press the lever: the post goes down and up smoothly.', 'Sideways play over a few mm: service soon.'], who: 'self', shop: 'Sinks under load or comes up slowly: service in the shop.', tip: 'Wipe the stanchion after a muddy ride.', links: ['fox'] },
  // Suspension
  { id: 'stanchions', area: 'suspension', level: 'quick', needs: 'fork', name: 'Stanchions clean, seals dry', tools: ['Clean rag'], steps: ['Wipe the stanchions after the ride.', 'An oily ring on the stanchion: the seals need a service.'], who: 'self', shop: 'Oil on the stanchions or scratches you can feel: shop.', tip: '', links: ['rockshox'] },
  { id: 'sag', area: 'suspension', level: 'monthly', needs: 'fork', name: 'Sag and air pressure', measure: { unit: '%' }, tools: ['Shock pump'], steps: ['Sit on the bike in riding position, then get off carefully.', 'Read the O-ring: sag about 20–30 % of the travel.', 'Type the value; the pressure goes into the bike values.'], who: 'tool', shop: '', tip: 'Check sag after a change in weight or luggage.', links: ['rockshox'] },
  { id: 'susp', area: 'suspension', level: 'full', needs: 'fork', name: 'Suspension service hours', tools: [], steps: ['Look at the riding hours on «Bike service».', 'RockShox: lower legs every 50 h. Fox: about every 100–125 h or once a year.'], who: 'shop', shop: 'Lower leg and damper services: in the shop, or yourself only with the service kit.', tip: 'Mud, rain and winter: service sooner.', links: ['rockshox', 'fox'] },
  { id: 'linkage', area: 'suspension', level: 'full', needs: 'shock', name: 'Rear linkage: no play', tools: ['Hex keys'], steps: ['Lift the rear wheel and move it sideways: no knock.', 'Check the pivot bolts are tight.'], who: 'self', shop: 'Play in the linkage: bearings in the shop.', tip: '', links: ['canyonMtb'] },
  // Lights and accessories
  { id: 'lights', area: 'extras', level: 'monthly', name: 'Lights and reflectors', tools: [], steps: ['Switch on front and rear: bright and aimed right.', 'Charge the batteries.'], who: 'self', shop: '', tip: 'In Switzerland lights are required in the dark.', links: ['bfu'] },
  { id: 'mounts', area: 'extras', level: 'full', name: 'Cages, computer mount, bags', torque: ['cage'], tools: ['Hex keys'], steps: ['Bottle cages, computer mount and bag straps tight.', 'Check rub spots from bags on the frame.'], who: 'self', shop: '', tip: '', links: ['parktool'] },
];
export const ITEM = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

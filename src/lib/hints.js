/**
 * Hinweistexte HT1–HT2 (Noah 14.10.2026 02:26 «kleiner hinweistext», mockups
 * https://claude.ai/artifact/TZDwRMUbwhFmiuxDDxSqhh approved 20:31 «HT1–HT2 freigegeben», answers «1a 2b 3a»):
 * a short card at the top of a page that says what the page is for. One sentence (lead), «Typisch hier»
 * with three situations, «Weiter unten» with chips that jump to a part of the page, and «Das kann die App
 * hier» that opens the fold at the end. × folds it to one quiet line «Was hier steht ›» (1a); on a phone
 * «Typisch hier» starts folded (2b); rolled out to the places of the app (3a), Home left out (HN0).
 * Pure data: English keys for t() (German in i18n/de/hinweis.js). icon: a key of ICONS in HintCard.svelte.
 * jumps: [label, id of the element on the page]; a chip shows only when its element is there.
 */
export const HINTS = {
  care: {
    lead: ['Here you see whether your bikes are ready.', 'The app works out from your kilometres what is due soon and collects everything for the bike shop.'],
    uses: [
      ['bike', 'After a trip', 'the km come by themselves, the app says what is getting due'],
      ['wrench', 'Done yourself', 'changed the chain? Tap «Done», the counter starts again'],
      ['shop', 'Before the bike shop', 'put the order together and share it'],
    ],
    jumps: [['Due now', 'due-h'], ['Bikes', 'bikes-h'], ['For the bike shop', 'shop-h'], ['Costs', 'cost-h'], ['Bike diary', 'diary-h']],
  },
  gear: {
    lead: ['Here is everything you own.', 'Each dot is a trip of the last 12 months, so you see what proves itself and what only rides along.'],
    uses: [
      ['bag', 'Before packing', 'find a thing, check its weight, mark it as a favourite'],
      ['scale', 'Getting lighter', '«Never used» shows what only rides along'],
      ['heart', 'Buying something new', 'onto the wishlist, the app sorts by use'],
    ],
    jumps: [['Views', 'views-h'], ['Wishlist', 'wish-h'], ['Analysis', 'gear-analysis']],
  },
  trips: {
    lead: ['Here are all your trips: planned, on the way and done.', 'Each card leads to the next step: plan, pack, ride or look back.'],
    uses: [
      ['plus', 'A new idea', 'start a trip from a template or from your last one'],
      ['bag', 'Before you leave', 'the card says how much is packed'],
      ['book', 'After the ride', 'a debrief keeps what you learned'],
    ],
    jumps: [['Planned|group', 'trips-plan'], ['With packing list|section', 'trips-done']], // Gesamttest 20.10.2026 B3
  },
  pack: {
    lead: ['Here the packing list of one trip comes together.', 'The app suggests what fits the trip and the weather; you decide.'],
    uses: [
      ['cloud', 'Weather changes', 'choose the weather again, the list follows'],
      ['scale', 'Too heavy', 'the weight shows the heaviest bag and the heaviest thing'],
      ['check', 'The evening before', 'pack bag by bag and tick off'],
    ],
    jumps: [['Fitted to the weather', 'wx-h'], ['Bags', 'bags-h']],
  },
  ride: {
    lead: ['Here is what you need on the way, big and readable in the sun.', 'What to wear, eat and drink now, the weather and where things are.'],
    uses: [
      ['clock', 'Every hour', 'the block of now says what fits'],
      ['note', 'Something is missing', 'two taps and it is in the debrief'],
      ['moon', 'In the evening', 'what to charge and what to lay out for tomorrow'],
    ],
    jumps: [['Note for the debrief', 'note-h'], ['Weather on the way', 'wx-h'], ['Charge tonight', 'chg-h']],
  },
  debrief: {
    lead: ['Here you look back on your rides and trips.', 'Your pace, what you learned and how trips compare, for the period you choose.'],
    uses: [
      ['book', 'After a trip', 'fill in the debrief while you still remember'],
      ['chart', 'Planning the next', 'your pace makes the time estimates better'],
      ['columns', 'Comparing', 'two trips side by side'],
    ],
    jumps: [['Last ride', 'last-h'], ['Your pace', 'pace-h'], ['Learned|review', 'learn-h'], ['Trips compared', 'cmp-h']],
  },
  wardrobe: {
    lead: ['Here are your clothes, from the inside out.', 'The app suggests what to wear for the weather of today or of your trip.'],
    uses: [
      ['sun', 'In the morning', '«What do I wear today?» gives one outfit'],
      ['shirt', 'Before a trip', 'the trip range shows what to take'],
      ['layers', 'Gaps', 'the onion shows where a layer is missing'],
    ],
    jumps: [['What do I wear today?', 'w-today'], ['Your onion', 'onion-h'], ['Your kits', 'kits-h']],
  },
  workshop: {
    lead: ['Here are your visits to the bike shop and their receipts.', 'What waits for the bike shop is on the left, the visits and costs on the right.'],
    uses: [
      ['wrench', 'Before the visit', 'collect what the bike shop should look at'],
      ['camera', 'After the visit', 'photograph the receipt, it stays with the bike'],
      ['shield', 'Warranty', 'the receipt is easy to find again'],
    ],
    jumps: [['For the bike shop', 'forshop-h'], ['Visits and receipts', 'visits-h'], ['Receipts', 'rc-h']],
  },
  me: {
    lead: ['Here are your data, the settings and help.', 'Everything stays on this device; a backup keeps it safe.'],
    uses: [
      ['save', 'Now and then', 'save a backup on the computer and the phone'],
      ['settings', 'Make it yours', 'language, start page and what the app asks'],
      ['help', 'Stuck', 'the handbook explains every function in steps'],
    ],
    jumps: [['Data', 'me-data-h'], ['Settings', 'me-set-h'], ['The app', 'me-app-h']],
  },
  aktiv: {
    lead: ['Here you tick off what you did today.', 'The rings count the last 7 days, so a rest day does not cost everything at once.'],
    uses: [
      ['check', 'After training', 'one tap ticks, a long press enters the time'],
      ['target', 'Goals', 'each activity with its own goal and window'],
      ['bike', 'Riding', 'rides from Strava count by themselves'],
    ],
    jumps: [['Tick off today', 'tick-h'], ['Rings', 'ring-h'], ['Goals × days', 'acts-h'], ['Bike this month', 'km-h']],
  },
  meditation: {
    lead: ['Here you start a session and see how it goes.', 'Like last time with one tap; the log and the look back show when it goes deepest.'],
    uses: [
      ['play', 'Short on time', '«Like last time» starts at once'],
      ['bell', 'Wandering thoughts', 'interval gongs bring you back'],
      ['chart', 'Looking back', 'week, month or year'],
    ],
    jumps: [['Timer', 'm-timer'], ['Look back|page', 'm-review']],
  },
  past: {
    lead: ['Here are the trips you rode.', 'For the period you choose: how far, how high, how wet, and which still wait for a debrief.'],
    uses: [
      ['book', 'After a trip', 'a trip without a debrief is marked'],
      ['chart', 'At the end of the year', 'your year in one line, with Earth and Everest'],
      ['plus', 'Once more', 'a trip that was good becomes the start of the next'],
    ],
    jumps: [['In this period', 'sum-h']],
  },
  notes: {
    lead: ['Here are the notes you keep.', 'With topics, checklists, photos and links; the pinned ones come first.'],
    uses: [
      ['note', 'An idea', 'write it down, the topic follows the text'],
      ['check', 'A list', 'a checklist with ticks, also for packing'],
      ['bag', 'Turn it into something', '«From a note becomes …» a packing rule or a wish'],
    ],
    jumps: [['Pinned', 'pin-h'], ['Topics', 'topics-h']],
  },
  inbox: {
    lead: ['Here land the notes you caught on the way.', 'File each one where it belongs: a receipt, a note, a wish or a packing rule.'],
    uses: [
      ['note', 'On the way', 'quickly from + New, sorting comes later'],
      ['camera', 'A receipt', 'a photo becomes a workshop visit'],
      ['check', 'Done', 'filed notes move to «Recently filed»'],
    ],
    jumps: [['To file', 'tofile-h'], ['Recently filed', 'recent-h']],
  },
  templates: {
    lead: ['Here are your templates for new trips.', 'A template keeps blocks and single items, so the next trip starts already packed.'],
    uses: [
      ['plus', 'A new kind of trip', 'make a template once, use it every time'],
      ['bag', 'After a good trip', 'turn its packing list into a template'],
      ['save', 'Not needed now', 'archive it, it comes back with one tap'],
    ],
    jumps: [['Your templates', 'tpl-all-h'], ['From your trips', 'tpl-src-h'], ['Archived', 'tpl-arch-h']],
  },
  rides: {
    lead: ['Here you upload a recorded ride as GPX.', 'The app shows pauses, planned against real and what you can learn from it.'],
    uses: [
      ['upload', 'After the ride', 'load the GPX file from your bike computer'],
      ['clock', 'Planning better', 'planned against real makes the next time plan closer'],
      ['book', 'Something learned', 'keep it with one tap, it goes to the debrief'],
    ],
    jumps: [['Saved rides', 'saved-h'], ['Good to know', 'know-h']],
  },
  inspiration: {
    lead: ['Here are your own links: rigs, packing lists, videos, routes and races.', 'The app recognises the kind of link; you take over what helps you.'],
    uses: [
      ['link', 'Found something', 'paste the link, the app sorts it'],
      ['bag', 'A good idea', 'take it over as a packing rule, a wish or a note'],
      ['flag', 'A race', 'with its dates, it shows up at Setup'],
    ],
    jumps: [['Add link|insp', 'if-add'], ['Taken over lately', 'if-rec-h'], ['Your links', 'if-list']],
  },
  equipment: {
    lead: ['Here are the parts of your bike with weight and price.', 'Values you enter once help with weight, wear and comparing bikes.'],
    uses: [
      ['wrench', 'A new part', 'tap the row and enter model, weight and price'],
      ['scale', 'Getting lighter', 'the weight per area shows where it adds up'],
      ['columns', 'Two bikes', '«Compare bikes» puts them side by side'],
    ],
    jumps: [['Components', 'eq-parts'], ['Weight per area', 'eq-w'], ['Most expensive parts', 'eq-p']],
  },
  rig: {
    lead: ['Here is your setup for one bike: photos, weight, bags and changes.', 'Ideas from others stay links you added yourself.'],
    uses: [
      ['camera', 'Before a trip', 'a photo of the packed bike'],
      ['bag', 'Bags', 'the bag plan shows what goes where'],
      ['note', 'Changed something', 'the setup log keeps it with the date'],
    ],
    jumps: [['My setup', 'rg-photos'], ['Total weight', 'rg-weight'], ['Bag plan', 'rg-bags'], ['Setup log', 'rg-log'], ['Your races', 'rg-races']],
  },
};

/** The hint of a page, or null. */
export const hintOf = (page) => HINTS[page] ?? null;

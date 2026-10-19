/**
 * Benutzerhandbuch (Noah 14.10.2026: «ein kurzes Handbuch: wie schalte ich jede Funktion auf und wie
 * nutze ich sie, mit Beispielen»): for every function of «What the app can do» (features.js) how to
 * switch it on, how to use it in 1–3 short steps, and one fictional example.
 *
 * HANDBOOK: one entry per FEATURES id: { on, steps, example }. on: what it needs first or where to
 * switch it on (null: always there, nothing to do). MINI_APPS_HANDBOOK: the small apps (miniapps.js),
 * how to add them to the home screen. Texts are English keys for t(); German in i18n/de/handbuch.js.
 * tools/handbuch.mjs writes docs/handbuch.md from it. Pure (no database, no screen), tested in
 * tests/handbook.test.js.
 */

export const HANDBOOK = {
  dayride: {
    on: 'Needs a trip that has started or ended.',
    steps: ['Tap «New» › «Quick start», or «Quick start» on Today.', 'Check the list; «Change» or «Undo» if it does not fit.'],
    example: 'Example: Sunday after last week’s 3 h loop → the same bike and list, with Sunday’s weather.',
  },
  blocks: {
    on: 'Needs a few items under Gear first.',
    steps: ['Open Gear › Building blocks to see or make blocks.', 'In a new trip, tap a block: its items join the list.'],
    example: 'Example: block «Rain» adds rain jacket, overshoes and a dry bag.',
  },
  templates: {
    on: 'Needs a trip first: «New» › «Plan a trip».',
    steps: ['Open a good trip and save it as a template.', 'Trips › Templates: start the next trip from it.'],
    example: 'Example: template «Weekend bikepacking» starts every 2-day trip with tent and stove.',
  },
  gpx: {
    on: 'Needs a trip first: «New» › «Plan a trip».',
    steps: ['Open the trip in Pack and tap «Add GPX route».', 'Pick the file; km, climbing and riding time fill in.'],
    example: 'Example: a 92 km route with 1400 m climbing → about 5 h riding time.',
  },
  homeweather: {
    on: 'Set your home place once: Me › Home place, or the link on Today.',
    steps: ['Type your postcode or town and choose it.', 'Today and Trips then show the weather and the best days.'],
    example: 'Example: home place 8000 → «Best days: Saturday and Sunday · dry».',
  },
  wxsuggest: {
    on: 'Needs a trip first: «New» › «Plan a trip».',
    steps: ['Open the trip; the weather suggestions sit in the packing list.', 'Take a suggestion with one tap, or leave it out.'],
    example: 'Example: Saturday 3 h gravel ride, 12 °C → the app adds arm warmers.',
  },
  weigh: {
    on: 'Needs a few items under Gear first.',
    steps: ['Open Gear and the weighing view («Start weighing»).', 'Put each item on the scale and type the grams.'],
    example: 'Example: the sleeping bag weighs 812 g instead of the guessed 900 g.',
  },
  fav: {
    on: 'Needs a few items under Gear first.',
    steps: ['Open an item and tap the ★.', 'All favourites are on one page under Gear.'],
    example: 'Example: ★ on your best headlamp and lightest jacket.',
  },
  wish: {
    on: 'Needs a few items under Gear first.',
    steps: ['Open Gear › Shopping and add what you want to buy, with price and weight.', 'The list shows which buy saves the most grams per franc.'],
    example: 'Example: a 300 g lighter tent for 250 francs beats a 40 g lighter cup for 30.',
  },
  unused: {
    on: 'Needs items and trips from at least a few months.',
    steps: ['Tap «Look through» on the tile, or filter Gear by «Long not used».', 'Archive what you no longer need, or keep it.'],
    example: 'Example: the second pump was on no trip for 12 months → archive it.',
  },
  'f.quickstart': {
    on: null,
    steps: ['On Today, tap «Quick start».', 'The ride for today is planned; «Open» or «Undo».'],
    example: 'Example: one click → today 2.5 h on your last bike, standard items, 14 °C and dry.',
  },
  'f.plan': {
    on: null,
    steps: ['Tap «New» › «Plan a trip», or «New trip» under Trips.', 'Fill in «Conditions»: sport, when, how long, start postcode.', 'Check the packing list in groups and save.'],
    example: 'Example: gravel, Saturday, 2 days, start 3000 → list with tent, stove and rain kit.',
  },
  'f.packblocks': {
    on: 'Needs a trip first: «New» › «Plan a trip».',
    steps: ['Open the trip in Pack.', 'Tap a big block button: the whole block goes in or out.'],
    example: 'Example: tap «Repair» → at most 8 parts for the ride: tube, levers, mini tool.',
  },
  'f.tripstate': {
    on: null,
    steps: ['Open Trips: under the title «n planned · n completed · n rated».', 'Tap a chip like «Completed»: only those trips show.'],
    example: 'Example: a trip after its last day shows «Completed» until you rate it.',
  },
  'f.wear': {
    on: 'Works best with clothes under Gear › Clothes and a home place.',
    steps: ['On Today, tap «What do I wear?».', 'See the clothes for the coldest hour of the ride.'],
    example: 'Example: 8 °C at 7 am → long bib, thermal jersey, gloves, from your own wardrobe.',
  },
  'f.onion': {
    on: 'Needs a trip first: «New» › «Plan a trip».',
    steps: ['Open the trip in Pack.', 'The layer check shows each layer for the coldest hour; take the kit it suggests.'],
    example: 'Example: 4 °C on the pass → base layer, jersey, wind vest and jacket.',
  },
  'f.shop': {
    on: 'Needs a trip first: «New» › «Plan a trip».',
    steps: ['Open the trip and the shopping and charging list.', 'Tick what you bought or charged.'],
    example: 'Example: Thursday before the trip: buy 6 bars, charge lights and GPS.',
  },
  'f.ballast': {
    on: 'Shows after a debrief marked items as not used.',
    steps: ['Open the trip in Pack; the ballast card lists unused items.', 'Choose «Leave at home» or «Keep» for each.'],
    example: 'Example: the spare shirt came along 3 times unused → leave it at home.',
  },
  'f.tripbike': {
    on: 'Needs a trip and at least two bikes.',
    steps: ['Open the trip in Pack and look at the bike comparison.', 'Switch the bike with one tap.'],
    example: 'Example: the gravel bike is 1.8 kg lighter for this trip than the touring bike.',
  },
  'f.switch': {
    on: 'Needs two or more trips.',
    steps: ['In the dark trip band, tap the small «more» button.', 'Choose the other trip.'],
    example: 'Example: from «Lake loop» to «Alps weekend» without going back to Trips.',
  },
  'f.assistent': {
    on: 'Always there: the button «Assistant» (sidebar, on the phone next to the search) or a question in the search.',
    steps: ['Ask the app: type a question or tap an example; the answer comes from your data, with a link.', 'Help me plan: answer four short questions, check the plan, «Create the trip».'],
    example: 'Example: «What is due on my bikes?» → the parts that are due, and «Open bike care».',
  },
  'f.ask': {
    on: 'Needs the helper code: Me › AI helper, switch on and save the code.',
    steps: ['Open the helper and type a few words.', 'Check the suggestion and take only what fits.'],
    example: 'Example: «2 days gravel, one night camping, rain likely» → a packing list suggestion.',
  },
  'f.wardrobe': {
    on: null,
    steps: ['Open Gear › Clothes.', 'Add clothes by layer and body zone; gaps go to the wishlist.'],
    example: 'Example: no warm gloves for the hands zone → «warm gloves» lands on the wishlist.',
  },
  'f.kit': {
    on: 'Needs a few clothes under Gear › Clothes.',
    steps: ['Under Gear › Clothes, choose the pieces of an outfit.', 'Tap «Save as a kit» and give it a name.'],
    example: 'Example: kit «Autumn 10 °C» with knee warmers, vest and thin gloves.',
  },
  'f.lighter': {
    on: 'Needs a few items under Gear first.',
    steps: ['Open an item under Gear, then its weight.', 'See lighter things from your own gear.'],
    example: 'Example: the 450 g jacket → your 210 g wind jacket would do.',
  },
  'f.select': {
    on: 'Needs a few items under Gear first.',
    steps: ['Under Gear, tap «Select» and mark many items.', 'Set a category, bag, building block or archive them at once.'],
    example: 'Example: 6 tools at once into the bag «Frame bag».',
  },
  'f.merge': {
    on: 'Needs two items that are really the same.',
    steps: ['Open one of the two items under Gear.', 'At the bottom, tap «Merge with …» and choose the other.'],
    example: 'Example: «Headlamp» and «Head lamp» become one item.',
  },
  'f.blockcheck': {
    on: 'Needs a few items under Gear first.',
    steps: ['Open Gear › Building blocks › «Check building blocks».', 'For each item: keep, out or elsewhere.'],
    example: 'Example: the stove in «Repair» → move it to «Cook».',
  },
  'f.gearimport': {
    on: 'Needs a gear list as a file (e.g. a spreadsheet export).',
    steps: ['Open the gear import and choose the file.', 'Take the safe rows at once, the others one tap each.'],
    example: 'Example: 120 rows → 110 safe at once, 10 checked by hand.',
  },
  bags: {
    on: 'Needs a trip first: «New» › «Plan a trip».',
    steps: ['Open the trip in Pack and tap «Start packing».', 'Go bag by bag and tick each item as it goes in.'],
    example: 'Example: saddle bag first: sleeping bag ✓, mat ✓, down jacket ✓.',
  },
  share: {
    on: 'Needs a trip first: «New» › «Plan a trip».',
    steps: ['Open the trip and tap «Print / PDF» or share.', 'Send the link, print it or save it as PDF.'],
    example: 'Example: send the list to a riding friend so you do not both pack a stove.',
  },
  ride: {
    on: 'Needs a trip that starts today or has started.',
    steps: ['Open the trip in Ride day.', 'The Now card shows the next stage, the weather and where each thing is.'],
    example: 'Example: 14:00 → «Next: climb 600 m · rain at 16:00 · jacket in the saddle bag».',
  },
  note: {
    on: null,
    steps: ['Tap «New» › «Note + photo».', 'Write or take a photo; sort it later in the Inbox.'],
    example: 'Example: «brake squeaks front» with a photo, sorted later to the bike.',
  },
  event: {
    on: 'Needs a trip marked as an event, with a start date.',
    steps: ['Open Bikes › Care or the trip; the preparation tasks show.', 'Tick each task; the lead times count down to the start.'],
    example: 'Example: a race in 21 days → «new tyres 14 days before», «service 10 days before».',
  },
  'f.tripcheck': {
    on: null,
    steps: ['Open Me › Checks per trip type.', 'Tick, sort or add rows, for one trip or for all.'],
    example: 'Example: ski tour evening before: read the avalanche report, dry the skins.',
  },
  'f.basecheck': {
    on: 'Needs a trip first: «New» › «Plan a trip».',
    steps: ['Open the trip in Ride day.', 'Tick the basic check before you leave.'],
    example: 'Example: lock ✓, bottle ✓, helmet ✓, tyres 2.5 bar ✓, keys ✓.',
  },
  'f.dayblocks': {
    on: 'Needs a trip first: «New» › «Plan a trip».',
    steps: ['Open the trip in Ride day.', 'Every 3 hours a block says what to wear, eat and switch on.'],
    example: 'Example: 17:00 block → lights on, eat a bar, arrive about 19:30 at your pace.',
  },
  'f.evening': {
    on: 'Needs a trip of several days.',
    steps: ['In Ride day, open the evening block.', 'Charge what it lists and lay out things for tomorrow.'],
    example: 'Example: day 1 evening → charge GPS and phone, lay out the warm layer for 6 am.',
  },
  'f.ridenote': {
    on: 'Needs a trip first: «New» › «Plan a trip».',
    steps: ['In Ride day, tap the note field.', 'Write it down; it lands in the debrief of this day.'],
    example: 'Example: «too few snacks after km 60» → shows again in the debrief.',
  },
  'f.finish': {
    on: 'Needs a trip first: «New» › «Plan a trip».',
    steps: ['In Ride day, tap «End the trip», earlier too.', '«Undo» if it was a mistake; then the next step shows.'],
    example: 'Example: rain on day 2 of 3 → end the trip early, then the debrief.',
  },
  debrief: {
    on: 'Needs a trip that has started or ended.',
    steps: ['Open Trips › Look back and choose the trip.', 'Answer the few questions; it takes about a minute.'],
    example: 'Example: «used: everything except the stove» → next time the stove is a question.',
  },
  learn: {
    on: 'Needs 3 finished debriefs of trips from a template.',
    steps: ['Open Trips › Templates.', 'Take or skip each suggestion to add or take out.'],
    example: 'Example: 3 times no use for the second tube → «take it out of the template?».',
  },
  pace: {
    on: 'Needs a ride with a GPX file: Trips › Look back › «Upload a ride».',
    steps: ['Trips › Look back › Your pace › «Upload ride»: choose a GPX file, check it and save.', 'From 5 rides of 20 km or more, every trip guesses its riding time with your own pace.'],
    example: 'Example: your pace is 19 km/h on gravel → a 76 km route shows about 4 h.',
  },
  trend: {
    on: 'Needs a few trips with weighed items.',
    steps: ['Open Trips › Look back and «Compare trips».', 'See how the base weight changes trip by trip.'],
    example: 'Example: base weight 9.2 kg in May, 7.8 kg in September.',
  },
  'f.unneeded': {
    on: 'Needs a trip that has started or ended.',
    steps: ['Open the debrief of the trip.', 'Tap what stayed in the bag; the app shows how much lighter it could be.'],
    example: 'Example: spare shirt and second lock unused → 480 g lighter next time.',
  },
  'f.missing': {
    on: 'Needs a trip that has started or ended.',
    steps: ['In the debrief, add what was missing.', 'Take a similar item, or put it on the wishlist.'],
    example: 'Example: «warm socks were missing» → your wool socks are suggested.',
  },
  'f.upload': {
    on: 'Needs a GPX or TCX file from your bike computer or app, or the CSV list from Strava or Garmin.',
    steps: ['Tap «New» › «Upload ride», or Trips › Look back. Several files at once work too.', 'Choose the file; distance, climbing, pauses and what saving does show.', 'Save: the card «Ride saved» says what happened; note up to 3 learnings.'],
    example: 'Example: planned 5 h, real 5 h 40 with 50 min of pauses.',
  },
  'f.past': {
    on: 'Needs a trip that has started or ended.',
    steps: ['Open Trips › Look back › Past trips.', 'Read km, climbing, time, rain and the learning per trip.'],
    example: 'Example: «Jura 2 days · 160 km · 2100 m · rain on day 2».',
  },
  'f.logbook': {
    on: null,
    steps: ['Open Trips › Look back › Logbook.', 'Add old trips too; filter by year and kind.'],
    example: 'Example: filter 2025 and «race» → all races of that year.',
  },
  'f.learnings': {
    on: 'Fills with every debrief and ride upload.',
    steps: ['Open Trips › Look back › Learnings.', 'Read them by topic or search a word.'],
    example: 'Example: search «food» → «eat every 45 minutes on long climbs».',
  },
  'f.best': {
    on: 'Needs a ride with a GPX file: Trips › Look back › «Upload a ride».',
    steps: ['Open Trips.', 'The «Best values» card shows your records; «All» shows more.'],
    example: 'Example: longest day 148 km, most climbing 2600 m.',
  },
  setup: {
    on: 'Needs a bike first: Bikes › «Add bike».',
    steps: ['Open Bikes and choose a bike.', 'Under setup, put each bag on its place with its weight.'],
    example: 'Example: saddle bag 1.4 kg, frame bag 0.9 kg, handlebar roll 1.1 kg.',
  },
  care: {
    on: 'Needs a bike with its parts and km.',
    steps: ['Open Bikes › Care.', 'See what is due; tick it when done.'],
    example: 'Example: chain at 2900 of 3000 km → «chain due soon».',
  },
  order: {
    on: 'Needs a bike with its parts and km.',
    steps: ['Open Bikes › Care and the workshop order.', 'Check the list and print it or save it as PDF.'],
    example: 'Example: «change chain, bleed brakes, check wheel bearings» on one page.',
  },
  receipt: {
    on: 'Needs a bike first: Bikes › «Add bike».',
    steps: ['Tap «New» › «Workshop visit» and take a photo of the receipt.', 'It waits in the Inbox; file it as a workshop visit later.'],
    example: 'Example: receipt for 85 francs → later a visit with «new brake pads».',
  },
  km: {
    on: 'Needs a bike first: Bikes › «Add bike».',
    steps: ['Tap «New» › «km for a bike».', 'Type what the counter says and save.'],
    example: 'Example: counter 12400 → Bike care knows the chain is due in 300 km.',
  },
  'f.kmimport': {
    on: 'Needs a Strava export (activities.csv) or Garmin FIT files.',
    steps: ['Open Bikes › Care › Import.', 'Choose the files; check which bike each ride goes to.'],
    example: 'Example: 40 rides from the export → 1850 km to the gravel bike.',
  },
  'f.strava': {
    on: 'Connect Strava under Bikes › Care › Strava.',
    steps: ['Tap «Connect Strava» and allow access.', 'Match each Strava bike to a bike in the app.'],
    example: 'Example: Saturday’s ride on Strava → its 64 km land on the right bike by themselves.',
  },
  'f.training': {
    on: 'Connect Strava under Bikes › Care › Strava.',
    steps: ['Open Aktiv › Training: the week with your plan and the look back.', 'Tap + on a day to plan a session with duration and zone.', 'Tap «Activities» and one activity: the minutes in each heart rate zone.'],
    example: 'Example: Tuesday 60 min in Z2 planned → after the run on Strava it shows as done.',
  },
  'f.analyses': {
    on: 'Connect Strava under Bikes › Care › Strava; power needs a power meter on the bike.',
    steps: ['Open Aktiv › Training › Activities and tap a ride: power, load, power curve and the analyses.', 'Open Training › Week: the analyses over the weeks under the look back.', 'Tap «…» on an analysis to hide or move it; «Adjust analyses» shows them all.'],
    example: 'Example: «First against second half» shows 4 % more heart rate in the second half at the same power.',
  },
  'f.weekreview': {
    on: null,
    steps: ['Open Aktiv › Week and tap «Week in review», or Training › Look back.', 'Read the five numbers, the strip Monday to Sunday and the highlights; ‹ › shows other weeks.', 'With the AI helper switched on: «Copy for Claude» copies the week as text; nothing is sent by itself.'],
    example: 'Example: 4:10 h, 96 km, 1’240 Hm, «+1:20» against the week before → «Keep your rhythm».',
  },
  'f.weight': {
    on: 'Nothing to switch on; it is voluntary.',
    steps: ['Open Me › Weight and tap «Enter weight».', 'Type your weight and save; the curve shows from the second entry.'],
    example: 'Example: 72 kg entered → the ride shows 2.6 W/kg.',
  },
  'f.velosetup': {
    on: 'Needs a bike under Bikes first.',
    steps: ['Open Bikes › Setup and choose the bike.', 'Add photos, check the total weight, add race-rig links with your own key words.'],
    example: 'Example: link to a race rig with key words «frame bag, 2 bottles» → a card with a drawn picture.',
  },
  'f.standardbike': {
    on: 'Needs at least two bikes.',
    steps: ['Open Bikes › Setup › «Standard bike and order» › «Change».', 'Move bikes with the arrows or tap «Make standard»; choose what a new trip brings.'],
    example: 'Example: gravel bike as standard → every new trip starts with it; a tap on the MTB counts for that trip only.',
  },
  'f.bagplan': {
    on: 'Needs a packing list with bags (Pack).',
    steps: ['Open Bikes › Setup › «Whole bag plan».', 'See the weight front, middle and rear; tap «Move» on a hint.'],
    example: 'Example: hint «Rear is heavy» → move the stove to the frame bag.',
  },
  'f.setuplog': {
    on: 'Needs a bike under Bikes first.',
    steps: ['Open Bikes › Setup › log and add what you changed.', 'After the next trip, note how it felt.'],
    example: 'Example: «New tyres 45 mm» on 3 May → 420 km since, «calmer on gravel».',
  },
  'f.lists': {
    on: null,
    steps: ['Open Me › «Lists and types» › Categories, or «Edit list» in Gear › Sort and filter.', 'Use the arrows for the order, the pen for name, symbol, hide and delete; «+ Own category» adds one.'],
    example: 'Example: rename «Tools & repair» to «Workshop», add «Photo» with a camera symbol.',
  },
  'f.komoot': {
    on: null,
    steps: ['In New tour or On the way tap «Tour from komoot»: komoot shows suggestions near you.', 'Share a tour from komoot to the app and create it as a planned trip.'],
    example: 'Example: a gravel round shared from komoot → a planned trip for tomorrow with the packing list of your last trip.',
  },
  // v0.134.0 «Inspiration»
  'f.inspiration': {
    on: null,
    steps: ['Open Inspiration (computer: sidebar; phone: Me › Inspiration) and paste your link.', 'Tap «What I take from it»: a packing rule, a wishlist item or a note.', 'A race gives a calendar file (.ics), a route a trip draft.'],
    example: 'Example: a rig video with the note «spare brake pads» → a quiet hint while packing your next trip.',
  },
  'f.problem': {
    on: 'Needs a bike first: Bikes › «Add bike».',
    steps: ['Tap «New» › «Problem with a bike».', 'One problem per row, with priority and deadline.'],
    example: 'Example: «rear brake rubs», high, by Friday → sorted for the workshop.',
  },
  'f.workshop': {
    on: 'Needs a bike first: Bikes › «Add bike».',
    steps: ['Open Bikes › Workshop.', 'Add a visit with amount, work and receipt photo.'],
    example: 'Example: 3 visits this year, 420 francs → 14 francs per 1000 km.',
  },
  'f.equipment': {
    on: 'Needs a bike first: Bikes › «Add bike».',
    steps: ['Open Bikes › Equipment.', 'Fill each part like a data sheet: name, details, weight, price.'],
    example: 'Example: «Crankset · 40 t · 680 g · 190 francs».',
  },
  'f.bikecompare': {
    on: 'Needs at least two bikes.',
    steps: ['Open Bikes › Equipment › all bikes.', 'Only rows with a value show; on a phone two bikes side by side.'],
    example: 'Example: gravel bike 9.4 kg against road bike 7.9 kg.',
  },
  'f.folder': {
    on: 'Needs a bike first: Bikes › «Add bike».',
    steps: ['Open a bike under Bikes and its folder.', 'Choose the sheets and save or print them as PDF.'],
    example: 'Example: bike pass and workshop order as one PDF for the service.',
  },
  'f.breakin': {
    on: 'Needs a new bike under Bikes.',
    steps: ['Open the bike’s folder and the break-in plan.', 'Follow the 4 steps; Today reminds you of the first service.'],
    example: 'Example: after 300 km → check spokes and cables, Today reminds you.',
  },
  'f.repairkit': {
    on: 'Needs a bike with its parts and km.',
    steps: ['Open the bike’s folder and the repair kit.', 'Missing things go to Gear with one tap.'],
    example: 'Example: 12-speed chain → «quick link 12-speed» is missing and goes to Gear.',
  },
  'f.warranty': {
    on: 'Needs a bike or part with a purchase date.',
    steps: ['Open the bike’s folder and «Warranty and receipts».', 'Add the end date; save it as a calendar file if you like.'],
    example: 'Example: frame warranty ends 1 June → reminder on 2 May.',
  },
  'f.theft': {
    on: 'Needs a bike first: Bikes › «Add bike».',
    steps: ['Open the bike’s folder and the theft sheet.', 'Add frame number, photos and insurance once.'],
    example: 'Example: frame number WTU123X45 and 3 photos, ready to print for the police.',
  },
  'f.partstart': {
    on: 'Needs a bike with its parts and km.',
    steps: ['Open Bikes › Care and the part.', 'Set when and at which km it was fitted, also from another bike.'],
    example: 'Example: wheels from the old bike, fitted at 8200 km → wear counts from there.',
  },
  'f.prep': {
    on: 'Needs a trip within 14 days and a bike with parts.',
    steps: ['Open Bikes › Care.', 'The card «before the trip» lists what the workshop still has to do.'],
    example: 'Example: trip in 10 days → «new brake pads» goes to the workshop order.',
  },
  'f.tick': {
    on: null,
    steps: ['Open Active, or the Active card on Today.', 'One tap ticks an activity; «Undo» takes it back.'],
    example: 'Example: tap «Stretching» → ticked for today.',
  },
  'f.check': {
    on: null,
    steps: ['Open Active › Today.', 'Answer sleep, energy and mood; the rings show 7 days.'],
    example: 'Example: sleep good, energy medium → the recovery ring fills a bit.',
  },
  'f.stopwatch': {
    on: null,
    steps: ['Under Active, long press an activity (right click on a computer).', 'Choose stopwatch; it keeps running on every page.'],
    example: 'Example: 15 min countdown for yoga → the singing bowl sounds at the end.',
  },
  'f.goals': {
    on: null,
    steps: ['Open Active › Goals.', 'Set a goal per day or for 7, 10 or 30 days, with a season if you like.'],
    example: 'Example: «3 times strength in 7 days», only from October to March.',
  },
  'f.yeargoals': {
    on: null,
    steps: ['Open Aktiv › Goals: «Year goals» with km, metres climbed and minutes.', 'Switch a goal off, or tap its number to change it.'],
    example: 'Example: year goal 4000 km and 40 000 m climbed; minutes switched off.',
  },
  // v0.147.0 Paket B (Termine buchen)
  'f.offers': {
    on: 'Needs the booking server; online payment only in test mode.',
    steps: ['Open Me › Offers and start «Tennis lesson», a tour, a bike service or your own offer.', 'Tap + on a day to open a free time, then send the link by WhatsApp.', 'New bookings show on Today; tap a time to see who comes or to cancel it.'],
    example: 'Example: Mondays 18:00 group lesson every week → a student books from the link, Today says «New booking».',
  },
  // v0.133.0
  'f.abfragen': {
    on: null,
    steps: ['Open Me › «Wi gaht\'s?»: switch questions on or off, change their rhythm or add your own.', 'From 07:00 and 20:30 the card on Today asks them; Me › Data › History shows all answers.'],
    example: 'Example: «How full is your battery?» three times a day → the tile «Morning round» shows sleep, energy and mood.',
  },
  // v0.135.0
  'f.medreview': {
    on: null,
    steps: ['Open Aktiv › Meditation › «Look back».', 'Switch between week, month and year; filter by kind or template.'],
    example: 'Example: October with 18 of 31 days, 6 h 40 min, longest session 35 min.',
  },
  'f.timer': {
    on: null,
    steps: ['Open the timer page, choose a kind and tap «Start»; «Big» shows only the clock.', 'At the end a singing bowl; the log keeps every timer with an optional note.'],
    example: 'Example: Pomodoro 25/5 four times → the log shows «Today 4× · 1 h 40 min».',
    },
  'f.pagetips': {
    on: null,
    steps: ['Open Packen, Unterwegs or another place: under the title is the tip of the day; «All tips ›» shows them all, each with a switch.', 'At the page end: «What the app can do here»; each row opens its place.', 'Some places show an example: «Save as note» keeps it under Me › Notes.'],
    example: 'Example: on a rainy day Packen says first to put the rain jacket on top; «Only useful tips» keeps the «Did you know» sentences away.',
  },
  'f.milestones': {
    on: 'Needs a goal under Active › Goals.',
    steps: ['Open Active › Activity › Milestones.', 'See the next star; pick a reward from the wishlist.'],
    example: 'Example: next star at 20 sessions → reward «new bottle».',
  },
  'f.meditation': {
    on: null,
    steps: ['Open Aktiv › Meditation.', 'Start like last time or from a template; choose the sounds.'],
    example: 'Example: 10 min, gong at start and end, calm clock on the screen.',
  },
  'f.medlog': {
    on: 'Nothing to switch on; it fills after your first meditation.',
    steps: ['Open Meditation › Logbook.', 'See every session, the streak heat map and your best time of day.'],
    example: 'Example: 12 days in a row, most often at 7 am.',
  },
  'f.medmore': {
    on: null,
    steps: ['Open Meditation › More.', 'Listen to the sounds; set kinds, places, quotes and your own links.'],
    example: 'Example: add the place «balcony» and a link to your favourite guided session.',
  },
  backup: {
    on: null,
    steps: ['Open Me › Data and backup.', 'Tap «Download backup»; keep the file safe or open it on another device.'],
    example: 'Example: once a week a backup file, moved to the new phone in one step.',
  },
  install: {
    on: null,
    steps: ['Open the app in the browser and tap «Add to home screen».', 'In Chrome also: menu ⋮ › «Install app».'],
    example: 'Example: the icon on the phone opens the packing list in the mountains without signal.',
  },
  lang: {
    on: null,
    steps: ['Open Me › Language.', 'Choose Deutsch or English.'],
    example: 'Example: switch to English to show the app to a friend.',
  },
  demo: {
    on: null,
    steps: ['Open Me › Data and backup › «Demo from a file».', 'Look around; «End demo» brings your own data back.'],
    example: 'Example: a demo with 3 fictional trips; afterwards all is as before.',
  },
  'f.search': {
    on: null,
    steps: ['Open the search (key /).', 'Type a command; it is entered right away.'],
    example: 'Example: «kette geölt gravel» → chain oiled on the gravel bike, today.',
  },
  'f.inbox': {
    on: null,
    steps: ['Open Me › Inbox.', 'Tap «File as …» and choose one of the 7 targets.'],
    example: 'Example: a receipt photo → «File as workshop visit».',
  },
  'f.notes': {
    on: null,
    steps: ['Open Me › Notes.', 'Write, dictate, add a photo, link or checklist; use #tags and pin up to 3.'],
    example: 'Example: note «#winter ride ideas» with a checklist of 4 routes.',
  },
  'f.docs': {
    on: null,
    steps: ['Open Me › Documents and tap «Add PDF» (a PDF or a photo of the paper).', 'Choose the group and «valid until»; the reminder comes 6 months before by itself.', 'Switch on «In the packing list»: every trip asks «ID and cash with you?».'],
    example: 'Example: identity card valid until 03.2027 → from 09.2026 «Renew identity card» under Reminders.',
  },
  'f.sync': {
    on: null,
    steps: ['On the device with the newer state: Me › Data and backup › «Send to phone» (or «Send to computer»).', 'On the other device: tap the file › Share › Pack Generator, or «Open backup».', 'The app says which is newer and suggests: replace, merge or nothing; a copy of before stays under «Before updates».'],
    example: 'Example: planned on the computer in the evening → sent to the phone → «Replace all data» → packing on the phone.',
  },
  'f.autosync': {
    on: 'Needs the internet now and then; it is free and the server cannot read your data.',
    steps: ['On the computer: Me › Data and backup › «Switch on sync»; a QR code and a code appear.', 'On the phone: point the camera at the QR code and tap «Pair» (or «I have a code» and type it).', 'From then on both sync by themselves; when the same entry changed on both, a window asks which version counts.'],
    example: 'Example: weight changed on the phone and the name on the computer → «Changed on both devices» → «Keep this one» or «Take this one».',
  },
  'f.camera': {
    on: 'On a phone or tablet; a computer shows the file dialog.',
    steps: ['Tap «Take photo» where a photo is added (note, item, bike, setup, problem); «Gallery» picks one you have.', 'New › Workshop visit opens the camera at once: photograph the receipt first, then fill in the rest.', 'A receipt with more pages: «Another page» after the first photo.'],
    example: 'Example: a two-page workshop bill → «Photograph the receipt» → «Another page» → shop and cost → Save.',
  },
  'f.docscan': {
    on: 'For Google Drive: «Connect Google Drive» once under Me › Documents (needs Strava connected on this device).',
    steps: ['Open Me › Documents and tap «Photograph document» (or New › «Photograph document»).', 'Photograph page by page or choose photos; check the corners, then «Save as PDF».', 'Open the new document: set the group, «valid until» and «In the packing list».'],
    example: 'Example: a workshop receipt → black and white PDF «Quittung Veloladen Muster» in «Imported PDFs» and in Drive.',
  },
  'f.mail': {
    on: 'Connect once under Me › Mail (needs Strava connected on this device).',
    steps: ['Open Me › Mail and tap «Connect with Google».', 'Tap a mail to read it; «Answer» or «New mail» writes one.', 'Under an appointment, «Mails to it» finds the mails about it.'],
    example: 'Example: the appointment «Velo-Service» → «Mails to it» shows the workshop’s confirmation.',
  },
  'f.agenda': {
    on: 'Connect once under Me › Appointments and tasks (needs Strava connected on this device).',
    steps: ['Open Me › Appointments and tasks, tick calendar and tasks and tap «Connect with Google».', 'The next 14 days and your open tasks appear; tick a task or add one, it changes in Google too.', '«New appointment» enters it in your Google calendar.'],
    example: 'Example: «Kette messen» due on Thursday → stands under «Next 7 days»; ticked in the app, it is done in Google Tasks too.',
  },
  'f.webshop': {
    on: 'Nothing to switch on; the orders wait on the server until the app fetches them.',
    steps: ['Open Me › Payments › Shop and add a product: a download, a code or a thing to send with postage and stock.', 'Copy the shop link and send it; people buy without the app or an account.', 'Under «Orders» mark «Paid», print the label and then «Shipped» with the tracking number.'],
    example: 'Example: a packing list as a download for CHF 5 → an order with TWINT message → «Paid» → the buyer gets the link by mail.',
  },
  'f.fitbit': {
    on: 'Connect Fitbit once under Me › Data and backup › Fitbit (needs Strava connected on this device).',
    steps: ['Tap «Connect with Google» and allow the values.', 'Back in the app, «Health data» shows how current each value is; «Choose values» switches single ones off.'],
    example: 'Example: you open the app in the morning → last night’s sleep and today’s resting heart rate are there.',
  },
  'f.autobackup': {
    on: 'Computer only: choose a folder under Me › Data and backup.',
    steps: ['Under «Auto-backup to a folder», tap «Choose folder».', 'After every change the newest backup lands there, plus one per day.'],
    example: 'Example: a folder that syncs to the cloud → always a fresh backup.',
  },
  'f.invoices': {
    on: 'Enter your account once (IBAN, name, town; TWINT number if you like). It stays only on this device.',
    steps: ['Open Me › Payments › Invoices and tap «New QR invoice».', 'Enter for whom, the amount and what for; send it by mail, as a PDF or copy the pay link.', 'When money arrives: «Paid», «Money received» or upload the bank statement.'],
    example: 'Example: tennis lesson 80.00 CHF to Mia → she pays with TWINT, message R-0001 → «Paid».',
  },
  'f.bills': {
    on: 'Nothing to switch on.',
    steps: ['Open Me › Payments › Invoices › tab «To pay».', 'Photograph the bill or enter it by hand; check the due date.', 'Pay in your e-banking with «Payment part», then tap «Paid».'],
    example: 'Example: workshop bill 189.50 CHF, due on the 17th → a reminder on the 14th.',
  },
  'f.tidy': {
    on: 'Only shows when something has «test» in its name.',
    steps: ['Open Me › Clean up test data.', 'Archive it all; «Undo» brings it back.'],
    example: 'Example: «Test trip 2» and «test bike» go to the archive.',
  },
  'f.playground': {
    on: null,
    steps: ['Open Me › Try it out › Playground, or «Try it» on a function.', 'Pack, ride and debrief a made-up trip; at the end all is as before.'],
    example: 'Example: try the ride day of a made-up 2-day trip without touching your data.',
  },
  'f.push': {
    on: 'Needs Chrome on the phone. Once: «Copy the address for cron-job.org» on this page and paste it in cron-job.org.',
    steps: ['Open Me › Reminders on the phone.', 'Switch on «On the phone» and allow notifications.', 'Switch on the reminders you want, one by one.'],
    example: 'Example: the evening before a trip at 19:00 «Tomorrow: Alpenrunde. The evening-before check is waiting.»',
  },
  'f.helper': {
    on: 'Me › AI helper: switch on «Show the AI helper in the app» and save the code.',
    steps: ['Paste the helper code; it stays on this device.', 'Before each request you see what goes to Claude; a monthly limit applies.', 'Pick the model: Sonnet 5.5 (default) or the cheaper Haiku 5.5. «Usage and costs» says what it costs.'],
    example: 'Example: switched off again → it shows nowhere, the code stays stored.',
  },
  'f.shortcuts': {
    on: 'Computer with a keyboard.',
    steps: ['Press ? to see the list.', 'g and a letter switch places; n is New, / is search.'],
    example: 'Example: g t → Trips, then n → plan a new trip.',
  },
  'f.theme': {
    on: null,
    steps: ['Open Me › Appearance.', 'Choose font, colour world, text size and light or dark.'],
    example: 'Example: dark with larger text for the evening.',
  },
  'f.explain': {
    on: null,
    steps: ['Point at a button, or hold it on a phone: it says what it does.', '«…» lists the other buttons, each with one line.'],
    example: 'Example: hold «Undo» → «Takes back the last change».',
  },
  // Paket Q «App klarer»
  'f.alerts': {
    on: null,
    steps: ["Open Me › Alerts and news.", "Type your region and tick your passes; weather and avalanche switch on or off.", "Under «Your sources» add, change or delete news sites with a feed."],
    example: "Example: region «Testtal» → an orange storm warning shows as one line on Today.",
  },
  'f.backuplock': {
    on: "Off at the start; if you forget the password, nobody can open these backups.",
    steps: ["Open Me › Data and backup › «Backup with a password».", "Switch it on and type the password twice.", "Export, Send and the folder backup are locked; opening asks for the password."],
    example: "Example: backup in Google Drive locked → on the phone «Import backup» asks for the password.",
  },
  'f.yearcheck': {
    on: null,
    steps: ["Once a year the window «Still right?» comes by itself.", "Tap «Still right» or «Change» for each value.", "Any time: Me › Data and backup › «Still right?»."],
    example: "Example: weight 72 kg from last year → «Change» → Bikes › Setup.",
  },
  'f.suggestoff': {
    on: null,
    steps: ["Open Me › Appearance › Suggestions.", "Switch off an area you do not want."],
    example: "Example: «Ideas in Active» off → Active shows no suggested actions.",
  },
  'f.tipweek': {
    on: null,
    steps: ["Look at the tile «Tip of the week» on Today.", "Tap its button to try it; next Monday a new tip comes."],
    example: "Example: «Templates» this week → «Open templates».",
  },
  'f.comeback': {
    on: null,
    steps: ["Open the app after three weeks or more away.", "The window «Welcome back» lists what is due and what is new.", "Tap a line to go there, or «Later» / «Not today»."],
    example: "Example: back from holiday → 2 care points and 3 new versions.",
  },
  'f.news': {
    on: null,
    steps: ['Open Me › What is new.', 'See the newest version, every function and all versions by month.'],
    example: 'Example: after an update read the 3 new things in one minute.',
  },
};

/** The small apps: each opens right on its area, with its own icon, and shares the data of the whole app. */
export const MINI_APPS_HANDBOOK = {
  title: 'Small apps',
  intro: ['Three parts of the app also open as a small app with their own home-screen icon.', 'Each opens directly on its area and shares the same data with the whole app.'],
  apps: [
    { key: 'meditation', title: 'Meditation', steps: ['In Chrome on the phone, open noahdolmetsch-af.github.io/packgenerator/apps/meditation/.', 'Tap the menu ⋮ › «Install app» or «Add to home screen».'], example: 'Example: tap the icon → straight into a 10 min meditation.' },
    { key: 'packliste', title: 'Packing list', steps: ['In Chrome on the phone, open noahdolmetsch-af.github.io/packgenerator/apps/packliste/.', 'Tap the menu ⋮ › «Install app» or «Add to home screen».'], example: 'Example: tap the icon → the open trip in Pack, ready to tick.' },
    { key: 'velopflege', title: 'Bike care', steps: ['In Chrome on the phone, open noahdolmetsch-af.github.io/packgenerator/apps/velopflege/.', 'Tap the menu ⋮ › «Install app» or «Add to home screen».'], example: 'Example: tap the icon → see what is due on the bike and tick the oiled chain.' },
  ],
};

const NONE = Object.freeze({ on: null, steps: [], example: '' });

/** The entry of a function (a FEATURES id); without one an empty entry. */
export const handbookOf = (id) => HANDBOOK[id] ?? NONE;

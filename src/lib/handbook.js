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
    steps: ['Open the trip in Pack and tap «Add GPX route».', 'Pick the file; km, climbing and riding time fill in.', 'Under the map: the profile coloured by gradient and every climb; tap a climb and the profile zooms to it.'],
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
  'f.packcleanup': {
    on: 'Needs a few items under Gear first.',
    steps: ['Open Gear › Building blocks › «Tidy up».', 'Check the suggestion: always with you, Repair on a day ride, Light, cold.', 'Tap «Apply»; Undo comes right after.'],
    example: 'Example: 32 things on every day ride → 9 always with you, Repair as a button.',
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
  'f.weekplan': {
    on: null,
    steps: ['Open Woche: Monday to Sunday with sport, dates, to-dos, holidays and bike service.', 'On Sunday tap «Plan the week»: four steps, the app suggests, you take or leave out.', 'Enter holidays once under Woche › Holidays; the training plan pauses if you want.'],
    example: 'Example: Friday to Sunday Jura weekend → the long ride falls away, «Measure the chain» is suggested for Wednesday.',
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
  'f.wohl': {
    on: 'Nothing to switch on; results show after about 10 days with a day score.',
    steps: ['Open Me › What is good for me.', 'Read your recipe, what does you good and the good combinations; «How does the app know?» shows the days behind each line.', 'Start a small experiment, set your wished mix, add Neuland, phases or season points.'],
    example: 'Example: «Days with at least 30 min outside: 8 instead of 6».',
  },
  'f.namesde': {
    on: 'Needs items from an import with English names.',
    steps: ['Open Me › Data and backup › English names.', 'Tap «Take over» for a suggestion, or «Do not suggest».'],
    example: 'Example: «Food pouch left» → «Verpflegungstasche links».',
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
  'f.garmin': {
    on: 'Needs a bike under Bikes first.',
    steps: ['Open Bikes: under «Garmin pages» tap a profile.', 'Switch pages on or off, choose Edge 1040 or 850, tick your sensors.', 'Open a page: see why each value is there, change fields, tick «Set up on the device?».'],
    example: 'Example: tick «Power pedals» → the page «Power in detail» appears, with 8 fields on the Edge 1040 and the Edge 850.',
  },
  'f.bagsetups': {
    on: 'Needs a bike with bags first: Gear › Bags.',
    steps: ['Open Bikes › My setup and tap «New setup».', 'In the setup choose the bags and put your things into them.', 'When planning a trip, tap «Setup: …» to take another one.'],
    example: 'Example: «Bikepacking 3 days» 12.4 kg base weight, «Day ride light» 10.9 kg.',
  },
  'f.sports': {
    on: null,
    steps: ['In New tour choose the sport: the sports you use most come first.', 'A bike sport brings its standard bike; tap another bike and «Make standard for …» to keep it for that sport.', 'On Trips, «New: every trip has a sport» suggests a sport for your old bike trips.'],
    example: 'Example: Gravel → the gravel bike is chosen; 2 days with a hotel → the hint «Switch to Bikepacking».',
  },
  'f.editall': {
    on: null,
    steps: ['A bike: the pen «Edit» next to its name; «Delete bike» asks which bike its trips get.', 'Problems: «…» › Rename or Delete. Learnings: tap one, or «+ Learning».', 'Sports, places on the bike, care parts: Me › «Lists and types».'],
    example: 'Example: you sold a bike → «Delete bike», its trips go to your new bike; «Undo» for 4 seconds.',
  },
  // 0.156.0 «Reise-Links»
  'f.travel': {
    on: null,
    steps: ['Open a trip, «Plan», «Getting there and staying»: the links that fit the trip show, with its place and days filled in.', 'Type your flight number: «Flightradar24» follows the flight live.', 'All links without a trip: Trips › Travel links (search «Reise-Links»).'],
    example: 'Example: a weekend in Lisbon with a hotel night → Booking.com for Saturday to Sunday, Google Flights, Rome2rio.',
  },
  'f.komoot': {
    on: null,
    steps: ['In New tour or On the way tap «Tour from komoot»: komoot shows suggestions near you.', 'Share a tour from komoot to the app and create it as a planned trip.'],
    example: 'Example: a gravel round shared from komoot → a planned trip for tomorrow with the packing list of your last trip.',
  },
  // Paket K «Unterwegs» (Noah 19.10.2026)
  'f.trainhome': {
    on: 'Set your home place in Me › Settings.',
    steps: ['On On the way tap «Home»; the location is read only then.', 'Read the next 3 trains, or open the way in Google Maps.'],
    example: 'Example: a flat tyre in the Jura → «Home» → the train at 17:04 from the station 800 m away.',
  },
  'f.handlebar': {
    on: null,
    steps: ['On On the way tap «Handlebar view»; the phone turns sideways where it can.', '«Choose numbers»: up to 6, with arrows or by dragging.'],
    example: 'Example: time, km, metres up and next meal big on the bar mount.',
  },
  'f.glove': {
    on: null,
    steps: ['Automatic switches on below 5 °C or on a ski tour day.', 'Set On or Off by hand in Me › Look or on On the way.'],
    example: 'Example: −2 °C in the morning → buttons grow by themselves, gloves stay on.',
  },
  'f.eatremind': {
    on: null,
    steps: ['On On the way choose 30, 45 or 60 min and tap «Start eat reminder».', '«Eaten» starts the next interval; «Stop» ends it.'],
    example: 'Example: start at 08:00 → 08:45 a buzz → «Eaten» → next at 09:30.',
  },
  // Paket W «Von der Haustür bis zurück» (Noah 20.10.2026)
  'f.arrived': {
    on: 'Choose your emergency contacts once in Before you leave.',
    steps: ['Open On the way, tap «Arrived safely», then «Share».'],
    example: 'Example: at the campsite in the Jura → «Arrived safely» → «Hi Anna and Ben, I arrived safely in Saignelégier at 18:10.»',
  },
  'f.planb': {
    on: null,
    steps: ['Set a shorter GPX or «Train home» in Planen.', 'With heavy rain or a storm, tap «Take plan B» on On the way; Undo brings the planned route back.'],
    example: 'Example: 14 mm of rain on Saturday → the 60 km variant instead of 110 km.',
  },
  'f.checkin': {
    on: null,
    steps: ['In Planen set until when you can check in each night.', 'Read the warning; call ahead with the number of the accommodation.'],
    example: 'Example: check-in until 20:00, arrival 20:40 → you would need 24 km/h instead of 19.',
  },
  'f.parked': {
    on: null,
    steps: ['On On the way tap «Bike parked»: photo, lock, save.', 'Later tap it again: the photo, the lock and «Way to the bike».'],
    example: 'Example: at the station in a big town → back after the museum with the map link.',
  },
  // Paket Z and SP (Noah 20.10.2026)
  'f.breakdown': {
    on: null,
    steps: ['In the debrief under «For next time» tap «Note a breakdown».', 'Choose what broke; with the tick a bike-care job waits in Velopflege.'],
    example: 'Example: a flat after the pass → a job «Check tyre and tube» and next time «Spare tube» as a suggestion.',
  },
  'f.sleepspots': {
    on: null,
    steps: ['In the debrief tap «Rate a place to sleep»: stars, note, the night.', 'Plan a trip nearby: Planen shows «Your places to sleep here».'],
    example: 'Example: a quiet campsite at the lake with 5 stars → it comes back on the next tour in the area.',
  },
  'f.postcard': {
    on: null,
    steps: ['In the debrief tap «Tour postcard» and add a photo if you like.', '«Share» opens the share sheet; on a computer «Save» downloads the picture.'],
    example: 'Example: a photo from the pass, the line of the tour and 212 km, 3100 m up, 2 days on one picture.',
  },
  'f.packtwo': {
    on: null,
    steps: ['In Planen fold open «Packing for two» and type a name.', 'Tap what the other person carries; the weight per person shows on top.'],
    example: 'Example: tent and stove with Lea → you 6.2 kg, Lea 4.8 kg.',
  },
  'f.laundry': {
    on: null,
    steps: ['In Planen fold open «In the wash» and tap the clothes still in the wash.', 'Two days before the trip a reminder waits in Merken.'],
    example: 'Example: the rain jacket in the wash on Tuesday → on Thursday Merken reminds you for the Saturday tour.',
  },
  'f.morninglist': {
    on: null,
    steps: ['In Planen fold open «Only on the morning» and tap phone, food or bottles.', 'On the morning of the start On the way shows them as a short list.'],
    example: 'Example: phone, sandwich from the fridge and two filled bottles on the departure morning.',
  },
  'f.packtime': {
    on: 'Can be hidden in the card «Pack faster».',
    steps: ['In Planen fold open «Packing time» and tap «Start packing».', 'Tap «Done packing»; the next trip shows the trend.'],
    example: 'Example: 42 min for the first weekend tour, 28 min for the next one.',
  },
  'f.departsheet': {
    on: null,
    steps: ['On On the way tap «Before you leave».', 'Check the tour, papers and numbers; «As PDF» makes the sheet to print.'],
    example: 'Example: the train ticket from Dokumente, Rega 1414 and a friend’s number on one page.',
  },
  'f.komoottour': {
    on: null,
    steps: ['On On the way under «More» tap «Open the tour in komoot».', 'No link yet: «Add the komoot link of this tour».'],
    example: 'Example: the gravel loop shared from komoot opens again with one tap at the start.',
  },
  'f.routeconvert': {
    on: null,
    steps: ['On On the way › More open «Route for other devices» and choose the GPX.', 'Save FIT for Garmin or KML for maps.'],
    example: 'Example: a GPX from a club mail → FIT → copied to the Edge as a course.',
  },
  'f.waterfood': {
    on: null,
    steps: ['On On the way › More open «Water and food».', 'Food with «one per N hours» shows needed against packed.'],
    example: 'Example: 6 h at 28 °C → 4.5 L, 3 refills with 1.5 L bottles, 1500 kcal.',
  },
  'f.ready': {
    on: 'Connect Fitbit (Me › Data) or Strava.',
    steps: ['Open On the way on the tour day, or the trip in Pack.', 'Read the line and the signs behind it; you decide.'],
    example: 'Example: 5.2 h sleep and HRV lower than usual → «maybe a shorter round today?».',
  },
  'f.listentip': {
    on: null,
    steps: ['In «Ready for today?» add a link for this kind of tour.', 'Rename or delete it with the pencil and the bin.'],
    example: 'Example: «Morning playlist» for bike tours, a mountain podcast for ski tours.',
  },
  'f.skyplaces': {
    on: null,
    steps: ['On On the way › More open «Sun, moon and places».', '«Load places» asks Wikipedia about start, middle and finish.'],
    example: 'Example: dark from 18:52, full moon on Friday, and a few lines about the castle on the way.',
  },
  // Paket 4 (Noah 19.10.2026 «1a», «3a»)
  'f.housecheck': {
    on: null,
    steps: ['On On the way tap «Before you leave»; the house check is below the way home.', '«Edit the list» to rename, delete, add or move lines.'],
    example: 'Example: stove off, windows closed, rubbish out, and your own line «Blinds down».',
  },
  'f.flatsitter': {
    on: null,
    steps: ['On the sheet «Before you leave» write what the sitter should do, and a note.', '«Share link» or «QR code»; the list is stored only in the link.'],
    example: 'Example: water the plants on Wednesday, empty the letterbox, the key is with the neighbour.',
  },
  'f.readytomorrow': {
    on: null,
    steps: ['The evening before a tour open the trip in Pack.', 'Read the hints in «Ready for tomorrow?»; with the AI helper on, ask it too.'],
    example: 'Example: 3 °C in the morning → gloves on top; still 4 things to pack; charge the lights.',
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
  'f.sportpage': {
    on: null,
    steps: ['Open Active › Sports and tap a sport.', '«Adjust blocks»: switch blocks off, rename them, move them or add your own.', 'Choose a colour for the sport there too.'],
    example: 'Example: Tennis without «Weather», with «Lessons» and «Matches» on top.',
  },
  'f.progress': {
    on: null,
    steps: ['Open a sport › History and progress.', 'Take a suggested measure or add your own, e.g. Leg press in kg.', 'The last values are filled in; + and − change them, «Save» keeps them.'],
    example: 'Example: «Leg press +10 kg in 6 weeks», the best value with a star.',
  },
  'f.mosaic': {
    on: null,
    steps: ['Open Active › Sports.', 'Each row is a sport, each square a day; the colour is the sport.', 'A goal shows how often you reached it.'],
    example: 'Example: Gym 3 of 2 times in 7 days, the row is ticked.',
  },
  'f.sportextras': {
    on: null,
    steps: ['Open a sport › «Adjust blocks».', 'Under «Add a block» choose e.g. Training plans, Lessons or Loops from home.', 'Its lines can be renamed, ticked and deleted.'],
    example: 'Example: Gravel › «Water and gravel on the route» shows fountains and the gravel share of a route.',
  },
  'f.bikeservice': {
    on: 'Needs a bike with its km.',
    steps: ['Bikes › Care › your bike: the card «Bike service».', '«Set up»: every 3000 km, 100 h or 365 days, each one can be off.', '«Service done» after the service; it is due again by whichever comes first.'],
    example: 'Example: mountain bike, 1400 km since the service at 14 km/h ≈ 100 h → due.',
  },
  'f.parttemplate': {
    on: null,
    steps: ['Bikes › Care › a bike › «Part template».', 'Choose road bike, gravel or mountain bike and switch parts on or off.', 'Own parts: add, rename, move, delete.'],
    example: 'Example: gravel gets «Bell»; every new gravel bike starts with it.',
  },
  'f.spick': {
    on: null,
    steps: ['Bikes › Care › a bike › «Workshop cheat sheet».', 'Torque values: the value on the part always wins.', '«Breakdown help»: short steps for flat tyre, chain, hanger, brake, spoke, creak.'],
    example: 'Example: thru axle 12–15 Nm; your stem says 5 Nm → add it as your own row.',
  },
  'f.partwear': {
    on: null,
    steps: ['Bikes › Care › a bike › «Wear» (also on the bike page).', 'Each part: a bar, km left and about when, from your km of the last 8 weeks.', 'A workshop visit with «replaced» starts the part at 0 km; «Service of the whole bike» sets the bike counter to 0.'],
    example: 'Example: chain 2600 of 3000 km → «400 km left · about in December».',
  },
  'f.setupphotos': {
    on: null,
    steps: ['Bikes › Care › a bike: «Setup photos» top right opens the timeline; «+ Photo» adds a setup of today.', '«…» at a photo: change the day, rename, show it behind the bike, remove.', 'Report a problem with several photos; cut the edges or keep them all as one PDF in Me › Documents.'],
    example: 'Example: photo of the new bag setup → it shows pale at the top of Bike care and lines up under this month.',
  },
  'f.wetchain': {
    on: null,
    steps: ['Ride in the rain: «Wear» shows «Dry and oil the chain», the phone reminds you at 19:00.', '«Done: chain oiled» writes a care entry for the chain, and the hint goes.', 'Switch it off: Bikes › Care › a bike › «Wear» › «Reminders».'],
    example: 'Example: 40 km in the rain → in the evening «Dry and oil the chain».',
  },
  'f.wearphotos': {
    on: null,
    steps: ['Bikes › Care › a bike › «Wear» › «Wear photos».', 'Take a photo per part; date and km are added.', 'Two photos: drag the slider to compare old and new.'],
    example: 'Example: tyre at 500 km next to the tyre at 2500 km.',
  },
  'f.sellbike': {
    on: null,
    steps: ['Bikes › Care › a bike › «Wear» › «Sale listing».', 'Type a price and more if you like; the text updates.', '«Copy» or «Share» it to the marketplace.'],
    example: 'Example: «Gravel bike, 4200 km, chain new at 3900 km, last service in May».',
  },
  'f.bikebox': {
    on: null,
    steps: ['Bikes › Care › a bike › «Wear» › «Pack the bike».', 'Tick each point; add, rename, move or delete points.', 'Take photos before packing, as proof if something breaks.'],
    example: 'Example: «Pedals off» ticked, photo of the frame from both sides.',
  },
  'f.sparestock': {
    on: null,
    steps: ['Bikes › Care › a bike › «Wear» › «Spare parts at home».', 'Add a row with a number, e.g. 2 chains.', 'You replace a chain yourself: one less; at 0 «Shopping list» adds it.'],
    example: 'Example: 2 chains, one change → «1 in stock».',
  },
  'f.brandkm': {
    on: null,
    steps: ['Bikes › Care › a bike › «Wear» › «What lasts longest».', 'Each brand with its average km, from your used-up parts.', 'A part that runs out shows the brand that lasted longest.'],
    example: 'Example: chains brand A 3400 km, brand B 2600 km.',
  },
  'f.springservice': {
    on: null,
    steps: ['Bikes › Care › a bike › «Wear» › «Reminders» › «Spring service».', 'Pick the month or «off».', 'The to-do in Kalender › Merken lists what is due on each bike.'],
    example: 'Example: 1 February: «Spring service: chain on the gravel bike, service of the road bike».',
  },
  'f.chainrotation': {
    on: null,
    steps: ['Bikes › Care › a bike › «Wear» › «Chain rotation» › «Add a chain».', 'Tap «Put on» on the chain that is on the bike.', 'After the set km the app says it is time to swap.'],
    example: 'Example: chain A 480 km, chain B 450 km; every 500 km a swap.',
  },
  'f.velofaq': {
    on: null,
    steps: ['Bikes › Care › «Bike FAQ» (also on every bike’s card).', 'On top the question of the day; «Another question» shows the next one.', 'Search or open a topic; «Your own questions» keeps what you learned.'],
    example: 'Example: search «squeal» → why disc brakes squeal and what helps.',
  },
  'f.inspect': {
    on: null,
    steps: ['Bikes › Care › a bike › «Inspection»: start the quick check, the monthly check or the full inspection.', 'Tap a state for every point; «How it works» shows tools, steps, torque and when the bike shop is better.', '«Done» saves values and photos; «Fix myself» and «Bike shop» become problems.'],
    example: 'Example: three rides in the rain → the monthly check comes sooner; chain at 0,35 % → about how many km are left.',
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
    steps: ['Open Me › «Wi gaht\'s?»: switch questions on or off, change their rhythm or add your own.', 'Tap «Edit questions and groups»: change, delete, sort and add questions and areas.', 'From 07:00 and 20:30 the card on Today asks them; «Skip» puts one away. Me › Data › History shows all answers.'],
    example: 'Example: «How full is your battery?» three times a day → the tile «Morning round» shows sleep, energy and mood.',
  },
  // v0.135.0
  'f.medreview': {
    on: null,
    steps: ['Open Aktiv › Meditation › «Look back».', 'Switch between week, month and year; filter by kind or template.'],
    example: 'Example: October with 18 of 31 days, 6 h 40 min, longest session 35 min.',
  },
  // v0.165.0
  'f.remember': {
    on: null,
    steps: ['Open Calendar › Remember and type a to-do; «New list» makes an own list such as «My ideas».', 'Tick a to-do off; «Undo» brings it back.'],
    example: 'Example: «Order new brake pads» → ticked off after the shop visit.',
  },
  'f.reminders': {
    on: null,
    steps: ['After a ride, before a trip or after bike care the app asks once whether it should remind you; «Never ask» stops it there.', 'Open Me › Reminders to switch one off or change when it comes.'],
    example: 'Example: Yoga on Tuesday → «Remind every Tuesday at 18:00?».',
  },
  'f.birthdays': {
    on: null,
    steps: ['Open Me › Reminders and add a birthday or a plant with its watering days.', 'When it is time it shows in Calendar › Remember.'],
    example: 'Example: a fern every 5 days → «Water the fern» in Remember.',
  },
  'f.measure': {
    on: null,
    steps: ['On Today tap «Record the pressure» or «Measure the chain» under the bike.', 'In Bikes › Enter values «Calculate the pressure» suggests a target pressure.'],
    example: "Example: the chain at its limit → the workshop order suggests «replace the chain».",
  },
  // Paket J «Berg, Schnee und Notfall»
  'f.snow': {
    on: null,
    steps: ['Plan a ski tour or hike with start place and date; from 16 days before, freezing level and fresh snow show under «Forecast».', 'The Ski tours page shows the line for the next tour; «Hide» takes the box away for one trip.'],
    example: 'Example: 0° at 2400 m, 15 cm fresh snow in the 3 days before → read the avalanche bulletin with that in mind.',
  },
  // Paket P2 «Skitour»
  'f.skiplan': {
    on: 'Needs a planned ski tour.',
    steps: ['Open Ski tours and tap «Plan the tour» on the next tour.', 'Tap the danger level of the bulletin and fill in what helps: your morning, conditions, metres and time.', 'After the tour «After the tour» shows plan and reality side by side.'],
    example: 'Example: level 3+, up at 05:40, peak planned 11:30 → reached at 11:50, 20 minutes later.',
  },
  'f.skiseason': {
    on: null,
    steps: ['Open Ski tours › Season.', 'Set a goal if you like, add wish tours, practice and courses.', 'Pick the ski in «After the tour»: its metres climbed add up here.'],
    example: 'Example: avalanche course two years ago → «Refresh» shows next to it.',
  },
  // Paket P5 «Eingang»
  'f.sortround': {
    on: 'Only when at least two notes wait in the Inbox.',
    steps: ['Open Me › Inbox.', 'Tap «Start the sorting round».', 'For each note tap «File», a chip, «Keep», «Delete» or «Skip».'],
    example: 'Example: «Rear brake squeaks» → suggestion «Problem on a bike» because «brake» appears.',
  },
  // Paket P4 «Aktiv»
  'f.tennistop': {
    on: 'Only on the page of the activity Tennis.',
    steps: ['Open Aktiv › Sports › Tennis.', 'Tap «Played» or «Like last time».', 'Booked a court? «Enter a time»: afterwards the app asks «Played?».'],
    example: 'Example: Thursday 18:00 booked → on Thursday evening «Played?» with «Yes, played».',
  },
  'f.yogaclasses': {
    on: null,
    steps: ['Open Aktiv › Meditation.', 'In the card Yoga tap «Add a class».', 'After the class tap «Was there» or «Skipped».'],
    example: 'Example: Thursday 18:30 Hatha every week → «Next regular class Thu 18:30».',
  },
  'f.goodday': {
    on: null,
    steps: ['At the end of the evening review tap «Keep this day».', 'Write what made it good and save.', 'In What is good for me tap «Repeat on Saturday».'],
    example: 'Example: «quiet morning, outside in the afternoon» → on Saturday morning the check reminds you.',
  },
  // Paket P3 «Warum? und Regeln»
  'f.decides': {
    on: null,
    steps: ['Open Me › How the app decides.', 'Search a rule or switch a block rule on or off.', 'In Plan, tap «Why?» next to a row to see its rule.'],
    example: 'Example: «Rain gear: from 30 % rain on the riding hours» → «Change on Blocks».',
  },
  'f.forgotten': {
    on: 'Only when a debrief of this trip type noted something missing.',
    steps: ['Open Pack of a trip.', 'At the top: «Most often forgotten».', 'Tap «Onto the list» or «To the evening before»; pin or × to take it out.'],
    example: 'Example: sun cream missing twice → on top of the list before the next trip.',
  },
  // Paket P1 «Packen und Strom»
  'f.newpack': {
    on: null,
    steps: ['Open Packen of a trip and «Add material».', 'Tap «Add a new item and pack it» under the building blocks.', 'Type the name and save: the item is in the chosen bag.'],
    example: 'Example: a new rain cover → saved and packed in one go.',
  },
  'f.powervalues': {
    on: 'Only for items in Electronics or Lights.',
    steps: ['Open an item and the row «Power».', 'Type battery, run and charge time and choose where each value comes from.', 'Or start the stopwatch when you plug it in and tap «Full · stop».'],
    example: 'Example: charges 3 h full → half about 1:12 h, a quarter about 36 min.',
  },
  'f.swissmap': {
    on: null,
    steps: ['Open Ski tours › Mountain and emergency › «Map with steep slopes», or the button in a mountain trip.', 'Switch the layers: slopes over 30°, ski touring routes, hiking trails; summer or winter map.'],
    example: 'Example: the ski route crosses a violet slope → there it is steeper than 40°.',
  },
  'f.sos': {
    on: null,
    steps: ['Open Ski tours › Mountain and emergency › «Emergency: show my position».', 'Call Rega 1414 or 112 with one tap and read out the position shown big.'],
    example: 'Example: LV95 2’600’000 / 1’200’000 at 1850 m → you tell Rega exactly where you are.',
  },
  'f.sosqr': {
    on: null,
    steps: ['Open Mountain and emergency › «Emergency QR», fill in the contact (or take one from a .vcf) and save.', 'Tap «Save the lock-screen image» and set it as the lock screen.'],
    example: 'Example: a helper scans the code on the locked phone and sees whom to call and your allergies.',
  },
  'f.scales': {
    on: null,
    steps: ['Open Mountain and emergency › «Signposts and grades».', 'Read the colour of the signpost or the grade from the guide (T1–T6, L–EX).'],
    example: 'Example: white-blue-white → alpine hiking trail, T4 to T6.',
  },
  'f.race': {
    on: null,
    steps: ['Open Trips › Races and tap «New race», or make one of your trips a race.', 'Under «Prepare» load the route files and the stops; «Plan» and «Strategy» play the race through with your assumptions.'],
    example: 'Example: climbing 650 → 550 m/h with luggage → the plan grows from 10 to 12 days, the beds move with it.',
  },
  'f.racemap': {
    on: null,
    steps: ['Open a race and tap «Map».', 'Tap the profile to see a spot on the map; press long on the map to set your own point.'],
    example: 'Example: the snow layer shows the pass at km 670 above the snow line.',
  },
  'f.climbs': {
    on: null,
    steps: ['Open a race and tap «Climbs».', 'Tap a climb: its gradient per 100 m, the numbers and when you are there.'],
    example: 'Example: the steepest 100 m at 12 % come right after a water fountain.',
  },
  'f.mapoffline': {
    on: null,
    steps: ['Open a race › «Map» › «Map offline».', 'Choose the map and the width, check the size and tap «Keep for offline».'],
    example: 'Example: a 1 km strip of the free map along 1000 km is about 30 MB.',
  },
  'f.energy': {
    on: null,
    steps: ['Enter your weight under Analysis › Weight and your values under Trips › Supplies.', 'Plan a tour with a route: the tour card, the race and the live map show what you use, eat and drink.'],
    example: 'Example: 4 h, 72 km, 1000 m up, 75 kg → about 2600 kcal used, eat 240 g carbohydrates.',
  },
  'f.gpxstops': {
    on: null,
    steps: ['Search the places along the route on the route card, under Supplies or on the race map.', 'Tap «GPX with … stops» and copy the file to the Garmin or import it in the Wahoo app.'],
    example: 'Example: 3 shops and 5 fountains on 120 km → on the Edge as 8 pins along the track.',
  },
  'f.weather': {
    on: null,
    steps: ['Tap the weather line on Today, on Active or on a trip.', 'Choose how long you ride: the app shows the best start; tap «Landi rain radar» for the rain.'],
    example: 'Example: 4 h ride, thunderstorms from 15:00 → best start 08:00, back about 12:00.',
  },
  'f.webcammap': {
    on: null,
    steps: ['Open the weather page › «My webcams» and tap «Place on the map» on a webcam.', 'Search the place and choose it. On the live map tap the webcam point.'],
    example: 'Example: the webcam on the pass ahead → one tap on the map shows if there is snow.',
  },
  'f.icepush': {
    on: null,
    steps: ['Set your home place on the weather page.', 'Under Me › Reminders on the phone switch on «Ice in the morning».'],
    example: 'Example: −2 °C and snow in the night → at 06:30 «Roads can be icy this morning».',
  },
  'f.webcams': {
    on: null,
    steps: ['Open the weather page › «My webcams».', 'Paste the address of the picture and tap «Add webcam»; «Make home cam» shows it small on Today.'],
    example: 'Example: the webcam of a pass → one tap shows if the road is white.',
  },
  'f.reroute': {
    on: null,
    steps: ['On the live map tap «⋯» › «Plan a new way to …», or press long on the map.', 'Choose a shop, a bed, a station or your own point, or search a place; tap «Plan». «GPX for Garmin» saves it.'],
    example: 'Example: at km 52 to the bakery 1.2 km off the route → 2.6 km detour, back on the route at km 54.',
  },
  'f.live': {
    on: null,
    steps: ['Tap «Start a ride» on Active, On the way or a trip.', 'Allow the location; keep the page open with the phone on the handlebar.'],
    example: 'Example: km 412 → the next shop in 2 km, open until 19:00.',
  },
  'f.livepause': {
    on: null,
    steps: ['Start a ride on the live map and tap the pause button bottom left.', 'For the auto-pause: open the sheet › «Settings», switch on «Auto-pause» and type your speed.'],
    example: 'Example: limit 4 km/h → at a red light the clock stops after 10 s and runs again when you ride on.',
  },
  'f.sensors': {
    on: 'Needs a browser with Bluetooth, e.g. Chrome on Android or on the computer.',
    steps: ['Open the sheet of the live map › «Sensors» and tap «Connect» for heart rate, power or cadence.', 'Pick your sensor; its values show live and after the ride as a curve.'],
    example: 'Example: chest strap connected → 142 bpm live, after the ride Ø 138 bpm with the curve.',
  },
  'f.datapages': {
    on: null,
    steps: ['On the live map, swipe left on the strip at the right edge, or tap the arrows on top.', 'Open the sheet › «Data pages» to add, rename, sort or delete pages and their fields.'],
    example: 'Example: page «Climb» → metres up to the summit, gradient and the profile ahead.',
  },
  'f.turns': {
    on: 'Needs a trip or race with a route (GPX).',
    steps: ['Start a ride on a trip with a route: the arrow comes from 1 km before a turn.', 'Switch the arrow or the voice off in the sheet › «Settings».'],
    example: 'Example: «In 200 m turn left», then «Turn left now».',
  },
  'f.laps': {
    on: null,
    steps: ['Tap the flag button on the live map for a new lap; the laps are in the sheet.', 'Ride a route of a trip a second time: «Against your last ride» shows in the sheet.'],
    example: 'Example: «−0:42» → 42 s faster than last time at the same km.',
  },
  'f.moreplaces': {
    on: null,
    steps: ['Open the place search on the live map or a race map and type your radius.', 'Under «My own places» add a place here, by a tap on the map or from a file.'],
    example: 'Example: a CSV of the race checkpoints → all as your own places on the map.',
  },
  'f.rwgps': {
    on: null,
    steps: ['Open a trip › «Route», tap «Link from Ride with GPS» and paste the link.', 'Tap «Load»: the route and its waypoints come in.'],
    example: 'Example: a public route link → 86 km, 1200 m up and 5 waypoints on the map.',
  },
  'f.ovnear': {
    on: null,
    steps: ['Open the sheet of the live map › «Public transport nearby» and tap «Find stops».', 'Tap a stop for its next departures.'],
    example: 'Example: Bahnhof 140 m → S1 in 7 min from platform 2.',
  },
  'f.sharepic': {
    on: null,
    steps: ['Stop the ride on the live map; under «Your ride» tap «Share picture».', 'Leave out the shape when you start at home.'],
    example: 'Example: 42.5 km, 1 h 52 min, 640 m → one picture for the chat.',
  },
  'f.sleeptonight': {
    on: null,
    steps: ['Open a race › «Race mode» (load the places under «Along the route» first).', 'Look at «Where do I sleep tonight?» and switch kinds on or off.', 'On the live map it shows in the sheet.'],
    example: 'Example: rain tonight → the bus stop with a roof in 6 km comes before the campsite in 4 km.',
  },
  'f.callhotels': {
    on: null,
    steps: ['Open a race › «Race mode» › «Hotels for tonight» (from 12:00, or tap «Show now»).', 'Call or write with the ready sentence; copy it with one tap.'],
    example: 'Example: arrival 22:15 in Lausanne → the sentence in French, «Bonjour, je voyage à vélo …».',
  },
  'f.powernap': {
    on: null,
    steps: ['Open a race › «Race mode» › «Power nap» and tap 10, 20 or 30 min.', 'Leave the app open with the screen on; set the phone\'s alarm too.', 'Tap «I am awake»: the nap goes into your sleep log.'],
    example: 'Example: awake for 19 hours → «a power nap of 20 minutes helps».',
  },
  'f.sleeplists': {
    on: null,
    steps: ['Open a race › «Along the route» › «Places to sleep from lists».', 'Choose a file or paste a link and tap «Load».'],
    example: 'Example: an organiser\'s GPX with 40 bivy spots → 12 of them near your route.',
  },
  'f.nightswx': {
    on: null,
    steps: ['Open a race › «Along the route» and tap «Load the weather».', 'Look at «Nights by the weather»; move a night yourself under «Strategy».'],
    example: 'Example: night 2 at km 310 with 80 % rain → 30 km further only 20 %.',
  },
  'f.racesample': {
    on: null,
    steps: ['Open Trips › Races › «See the sample race».', 'Tap «Show me around» for the tour, then do the small tasks in «Plan».'],
    example: 'Example: choose the tent → 2.2 kg more and the risks change at once.',
  },
  'f.skiequipment': {
    on: null,
    steps: ['Open Velos › Ausrüstung and tap «Add equipment»; pick a piece from Material and its sport.', 'Tap «Log a use» after a tour; the care shows here and on Today when it is due.'],
    example: 'Example: touring skis waxed every 10 uses → after the 10th use «Wax the base» is due.',
  },
  'f.gipfelbuch': {
    on: null,
    steps: ['Open Aktiv › Aktivität › «Summit book».', 'Under «Found in your rides» tap «Into the summit book» and give the place a name, or enter a place by hand.'],
    example: 'Example: a ride over a pass at 2100 m → «First pass over 2000 m» in the showcase.',
  },
  'f.routine': {
    on: null,
    steps: ['Tap a row of «What does me good» on Today to tick it off; a second tap takes it back.', '«Change list» adds, renames, sorts or deletes items, with their days and a time.'],
    example: 'Example: «A walk» ticked 12 days in a row → the tile shows the flame with 12 days.',
  },
  'f.insights': {
    on: null,
    steps: ['Open Me › Insights: every pair with at least 14 days of both values says in one sentence what goes together.', 'Me › Your questions › Analysis shows the strongest three and leads to all of them.', 'Weather, calendar appointments and own number questions are compared too; each own question can be switched off.'],
    example: 'Example: on days with more than 7 h of sleep your battery was 8 on average, otherwise 5.',
  },
  'f.form': {
    on: null,
    steps: ['Open Active: the card on top shows your readiness from 0 to 100 and what today suits.', 'Tap it for the page «Form and recovery»: what counts today, 12 weeks of fitness and form, and the tour readiness.'],
    example: 'Example: resting pulse 6 above your normal and a short night → 38, «Today suits an easy ride».',
  },
  'f.overview': {
    on: null,
    steps: ['Open Active and scroll to «In focus» and «Overview».', 'Tap a sport for its page, or the heart rate tile for «Body values» in five groups; enter blood pressure and water there.'],
    example: 'Example: «In focus» Bike shows 100.7 km and 5:54:01 in the last 7 days, one bar per day.',
  },
  'f.trainplans': {
    on: null,
    steps: ['Open Active › Training › Training plans and pick one of the four plans.', 'Set the start (back from the race day or from a day) and the hours per week, then «Try it».', 'Missed a session? The plan in use suggests a free day of this week.'],
    example: 'Example: «Multi-day race», race day 12 June, 8 h → 12 weeks from 22 March, long weekends from May.',
  },
  'f.feel': {
    on: null,
    steps: ['After each ride Active › Training asks «How hard was your ride?» (1 to 10).', 'Without heart rate the answer stands in for the zone in «Plan kept?»; without an answer nothing counts.'],
    example: 'Example: a ride without heart rate strap felt like 4 → it counts as zone 2.',
  },
  'f.frei': {
    on: null,
    steps: ['Open Me › Free time and choose one of the eight pages.', 'Everything is a suggestion: change, sort, hide or delete it, and add your own.'],
    example: 'Example: a recipe in «My collections» → «Ingredients to the shopping list» puts the missing ones on your list.',
  },
  'f.journal': {
    on: null,
    steps: ['Open Plan › Diary and tap «New entry», or «Dictate an entry» to speak.', 'Add photos, tags, place and weather; «From the app» adds the rides, sleep and notes of that day.'],
    example: 'Example: the question of the day «What made you smile today?» → «Answer by speaking» → three sentences in one minute.',
  },
  'f.impulse': {
    on: null,
    steps: ['Open Active › Impulses, or Me › Free time › Impulses.', 'Tap «Try it» or «Done it»; the areas can be renamed, sorted and deleted.'],
    example: 'Example: «Sunrise with breakfast» shows tomorrow’s sunrise at your home place and a short checklist.',
  },
  'f.shopping': {
    on: null,
    steps: ['Open Me › Everyday life › Shopping list and type what you need.', 'Tick what is in the basket; groups sort the list like the shop and can be renamed, sorted and deleted.'],
    example: 'Example: switch on «Together with the trip shopping»: the gels and bars of your next trip stand below your everyday points.',
  },
  'f.contracts': {
    on: null,
    steps: ['Open Me › Documents › Contracts and subscriptions, or Me › Everyday life.', 'Enter the cost, the end of the term and the notice period: the app shows the last day to cancel and reminds you in Remember.'],
    example: 'Example: phone contract ends 31 March, 2 months notice → last day 31 January, reminder 14 days before.',
  },
  'f.people': {
    on: null,
    steps: ['Open Me › Everyday life › Not seen for a while and add a person with «every 2 months».', 'After you met, tap «Seen today»; the quiet reminder in Remember starts again.'],
    example: 'Example: Alex, every 6 weeks, last seen 1 September → a to-do in Remember on 13 October, no alarm.',
  },
  'f.abroad': {
    on: null,
    steps: ['Give the trip a country under Plan › Pass, country, getting there.', 'Below it: the emergency numbers (change them per country), your travel insurance and «Convert» to the currency of the country.'],
    example: 'Example: country France → 112 and 15, your insurance with its phone, «Convert EUR».',
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
    steps: ['Open Me › Inbox.', 'Tap «File as …» and choose a target, or make a new place.'],
    example: 'Example: a receipt photo → «File as workshop visit».',
  },
  // Paket N (19.10.2026)
  'f.notelinks': {
    on: 'Needs at least two notes.',
    steps: ['Open a note and tap «Link a note», or take one from «Maybe related».', 'On the Notes page, «At a glance» shows tags and open points; a #tag searches.'],
    example: 'Example: note «Jura weekend» linked with «Packing list autumn» → one tap opens the other.',
  },
  'f.dreams': {
    on: null,
    steps: ['Open Trips › Dreams and write the name of a dream tour.', 'Tap it: change the kind of tour and the months it fits.', 'Tap «Plan the tour»: a trip draft on the first Saturday of the season.'],
    example: 'Example: «Over the Furka» → Alpine passes, July to September → trip on 3 July.',
  },
  'f.races': {
    on: 'Needs a race with a date in Inspiration, or a race in your Google calendar.',
    steps: ['Open Trips › Dreams › Races to plan.', 'Tap «Plan as a trip» and add the registration deadline.', 'Tick «Signed up» once you are registered.'],
    example: 'Example: a gravel race on 7 November → a trip with the race block, deadline 30 October.',
  },
  'f.compass': {
    on: null,
    steps: ['Open Me › My compass and add a goal with a day.', 'Type the steps, one per line: the app spreads the dates.', 'Once a week answer «How is it going?»; boxes keep ideas and resolutions.'],
    example: 'Example: «Ride the Alpenbrevet» by 1 July → 5 steps, one every few weeks.',
  },
  // Paket NE «Notizen wie Evernote» (Noah 20.10.2026)
  'f.drawphoto': {
    on: null,
    steps: ['Open a photo big, or a note, and tap «Draw».', 'Choose pen, highlighter, arrow, shape or text, a colour and a size.', 'Tap «Done»: the photo shows the drawing, and the lines stay changeable.'],
    example: 'Example: a photo of the brake → a red circle round the worn pad and the word «new».',
  },
  'f.richtext': {
    on: null,
    steps: ['Open a note and write in the text field.', 'The buttons above it make bold, a heading, a list, ticks or a table.', '«Write with marks» shows the text with ** and # instead.'],
    example: 'Example: «Packliste» as a heading, then ticks for tent, stove and gas.',
  },
  'f.noteattach': {
    on: null,
    steps: ['Open a note and tap «File» or «Scan».', 'Tap a file: the app shows it, also LibreOffice and RTF; a GPX as a small map, a calendar file with «Into my calendar».', 'Below a link «Keep … to read offline» saves the page as text with its pictures.'],
    example: 'Example: the bill of the bike service as a PDF and the route as a GPX in the note «Jura».',
  },
  'f.noteocr': {
    on: null,
    steps: ['Open a note with photos or a scanned PDF.', 'Tap «Make text in pictures searchable».', 'Search in Notes for a word from the picture.'],
    example: 'Example: a photo of a receipt → the search «Bremsbelag» finds the note.',
  },
  'f.noteremind': {
    on: null,
    steps: ['Open a note and tap «Remind me».', 'Choose the day and the time, then «Set the reminder».', 'With the reminders on the phone switched on, a message comes; in Notes it stays on top until «Done».'],
    example: 'Example: «Ersatzschlauch kaufen» for Friday 17:00.',
  },
  'f.notetrash': {
    on: null,
    steps: ['A deleted note goes to Notes › More › Trash and waits there 30 days.', '«Put back» brings it back with its files.', 'In a note «Earlier versions» shows the text from before; «Put this version back» takes it.'],
    example: 'Example: the packing list was shortened by mistake → «Earlier versions» → yesterday evening → put back.',
  },
  'f.noteformats': {
    on: null,
    steps: ['Open a note: Photo, Link, Place and Sketch add to it; «Share» sends it to Keep or a chat.', 'New note: «Start from» a template, or the QR button reads a code.', 'Notes › More › Take over from Google Keep: choose the .zip from Google Takeout.'],
    example: 'Example: a rest stop with place, two photos and a sketch of the route; shared to Keep.',
  },
  'f.next': {
    on: null,
    steps: ['Open Me › Project shelf.', 'Read «For you now» and «The way».', 'Open «Ideas» under «Look up» and tap a goal.'],
    example: 'Example: «Eingang is built and parked» → it goes online after your OK.',
  },
  'f.notes': {
    on: null,
    steps: ['Open Me › Notes.', 'Write, dictate, add a photo, link or checklist; use #tags and pin up to 3.'],
    example: 'Example: note «#winter ride ideas» with a checklist of 4 routes.',
  },
  'f.starters': {
    on: 'Needs at least two ridden trips of the same sport for «From your trips».',
    steps: ['Plan a new trip and tap «From your trips».', 'In Pack open «Suggestion list» and tick what you take; «Not needed» hides a line.'],
    example: 'Example: three ski tours → the new ski tour starts with skins, avalanche kit and thermos.',
  },
  'f.supplies': {
    on: 'Set an expiry date or a stock count on an item (window › «At home and supply»), or food counts by itself.',
    steps: ['Open Gear › Supplies and set what you have.', 'Two weeks before an item expires the app reminds you; what runs low is under «Buy again».'],
    example: 'Example: 2 of at least 6 energy gels → «Buy again: 4 energy gels».',
  },
  'f.table': {
    on: 'Works on a wide screen (computer); on the phone the list gets checkboxes.',
    steps: ['Switch the list to «Table» and edit in the cells.', 'Tick rows, choose a field and «Set for all»; «Undo» brings the old values back.'],
    example: 'Example: 12 items ticked → bag «Seat bag» for all in one step.',
  },
  'f.parkdays': {
    on: 'Downhill has it from the start; any other sport adds it under «Adjust blocks».',
    steps: ['Open Downhill under Sports.', 'In «Bike park days» tap «New bike park day».', 'Enter the park and the runs (+ and −), mark the protection check, save.'],
    example: 'Example: «Talpark · 12 runs · protection checked»; on top «3 days this year · 25 runs».',
  },
  'f.packside': {
    on: 'Only on a big screen (from about 1100 px wide).',
    steps: ['Open a trip in Pack.', 'Above the bags tap «All bags side by side».', 'Tick in any column; «One bag at a time» goes back.'],
    example: 'Example: frame bag, seat pack and handlebar bag in three columns, the ready check as the fourth.',
  },
  'f.readaloud': {
    on: 'Saying «ok» needs a microphone and the internet (Chrome listens over Google); the big button works always.',
    steps: ['Open a trip in Pack and tap «Read aloud».', 'Choose «Say «ok»» or «Button only»; the app reads one item after the other.'],
    example: 'Example: «Into frame bag: tyre levers» → «ok» → next item.',
  },
  'f.ownrules': {
    on: 'Needs an own building block with items in it (Gear › Building blocks).',
    steps: ['Open the block and tap «Add a rule».', 'Choose the value, e.g. «Travel there by train», and save.'],
    example: 'Example: block «Train things» with the bike ticket → suggested for every trip by train.',
  },
  'f.startfresh': {
    on: null,
    steps: ['Me › Data and backup › «Start fresh …» › «Delete everything».', 'Changed your mind? «Undo», or later «Before updates».'],
    example: 'Example: after testing with sample data → start fresh with your own gear.',
  },
  'f.tourpage': {
    on: 'Works for Strava rides, joined tours and tours with a packing list.',
    steps: ['Open Trips › Rides and tap a finished tour.', 'Under «Values», «Like on the Garmin» shows NP, the best minutes and your resting heart rate that day.', 'Under «Choose several», pick rides and join them into one tour.'],
    example: 'Example: two Strava rides of one weekend → join them, rename the tour, add photos.',
  },
  'f.fuel': {
    on: 'Works best with a GPX route on the trip; the places along the route come from the route search.',
    steps: ['Open Trips › Food and water and choose the trip.', 'Search the places along the route once; change your grams per hour, water and bottles under «Your values».', 'Switch to «My products» to see how many bars and gels to take.'],
    example: 'Example: 120 km with shops at km 55 and 110 → three sections, each with the grams and litres to carry.',
  },
  'f.power': {
    on: 'Counts every device on the trip from Electronics and Lights; values you set in the item (battery, how long it lasts) beat typical ones.',
    steps: ['Open Gear › Power, or in Pack «Charge the evening before» › «Power budget».', 'Change the nights with a socket or the hours; «Put on the packing list» adds the power bank and the charger.'],
    example: 'Example: 4 days in a bivouac with phone, light and bike computer → «Take: Power bank 20000».',
  },
  'f.lend': {
    on: null,
    steps: ['Open Gear › Lent out and make a new list for the guest.', 'Send it as a link or PDF; tap «Back» for each thing that comes back.'],
    example: 'Example: tent and sleeping mat to Sam, back on Sunday → a reminder on Sunday morning.',
  },
  'f.tools': {
    on: null,
    steps: ['Open Me › Toolbox, or the Toolbox tile on Today.', 'Choose a tool; «Fits right now» shows the ones for your next trip.', 'Everything works without the internet.'],
    example: 'Example: 3.2 bar → 46.4 psi for the tyre pump abroad.',
  },
  'f.pdftools': {
    on: null,
    steps: ['Open Me › Toolbox › PDF and choose PDFs or photos.', 'Put them in order with the arrows or by dragging.', 'Tap «Merge into one PDF» or «Make smaller», then «Save or share».'],
    example: 'Example: three receipt photos → one PDF of 3 pages for the insurance.',
  },
  'f.phototools': {
    on: '«Cut out» loads a model once (about 45 MB); after that it works offline.',
    steps: ['Open Me › Toolbox › Photos and choose a photo.', 'Drag the frame to cut, choose the size; «Cut out» removes the background.', 'Tap «Make photo», then «Save or share».'],
    example: 'Example: bike photo 4.2 MB → Medium 1280 px, about 300 KB.',
  },
  'f.money': {
    on: 'The rates need the internet once a day; offline the last ones count.',
    steps: ['Open Me › Toolbox › Currencies.', 'Type the amount and choose its currency.', 'See it in Franken and the other main currencies.'],
    example: 'Example: 24.50 EUR → about 23 CHF.',
  },
  'f.tripcosts': {
    on: 'For «Request by TWINT», add your TWINT number once under Me › Pay › Invoices.',
    steps: ['Open Me › Toolbox › Trip costs and choose the trip.', 'Add who was there, then each expense with who paid it; a receipt photo fills in amount and date.', 'Under «Who owes whom» tap «Request by TWINT».'],
    example: 'Example: you paid the hotel 180 CHF for three → Anna and Ben each pay you 60 CHF.',
  },
  'f.ablage': {
    on: null,
    steps: ['Open Me › Documents or Me › Toolbox › Links and files.', 'Tap «Add link» or «Add file» (up to 5 MB).', 'Move, rename or delete an entry with its buttons.'],
    example: 'Example: the timetable link and the train ticket as PDF, both in one place.',
  },
  'f.weblinks': {
    on: null,
    steps: ['Open Me › Tools and links.', 'Tap a link; it opens in a new tab. The eye switches a suggestion off.', '«Order» moves links and changes their group; groups can be renamed and deleted.'],
    example: 'Example: SBB opens the timetable to the start of your next trip, on its day.',
  },
  'f.chains': {
    on: null,
    steps: ['Open Me › Toolbox › Tool chains.', 'Use a ready chain or tap «New chain» and add steps.', 'Tap «Start» and choose the files; the steps run one after the other.'],
    example: 'Example: «Receipts as one PDF» turns 4 receipt photos into one small PDF to share.',
  },
  'f.convert': {
    on: 'HEIC needs the internet once; after that it works offline.',
    steps: ['Open Me › Toolbox › Picture format.', 'Choose JPG or PNG, then the pictures.', 'Tap «Save» on each, or «Save all».'],
    example: 'Example: IMG_0042.HEIC → IMG_0042.jpg for the online form.',
  },
  'f.video': {
    on: null,
    steps: ['Open Me › Toolbox › Make video smaller.', 'Choose the size, then the video.', 'Keep the page open until it is done, then «Save or share».'],
    example: 'Example: a 90 MB phone video → about 10 MB with «Small».',
  },
  'f.qr': {
    on: null,
    steps: ['Open Me › Toolbox › Make a QR code.', 'Type a text or link, or the WLAN name and password.', 'Show the code, or tap «Save as picture».'],
    example: 'Example: the guest WLAN as a code for friends at home.',
  },
  'f.mapmeasure': {
    on: 'The map needs the internet; the line stays on the device.',
    steps: ['Open Me › Toolbox › Measure a route.', 'Tap along the road, point by point; the length shows on top.', 'Tap «Save as GPX» to use it in a trip or on the Garmin.'],
    example: 'Example: the way to the lake, 12.4 km, as GPX.',
  },
  'f.gears': {
    on: null,
    steps: ['Open Me › Toolbox › Gear ratios.', 'Type the chainrings and the cassette, choose the wheel.', 'Read km/h, metres per turn or the ratio in the table.'],
    example: 'Example: 40 × 42 at 90 rpm → about 6 km/h for a steep climb.',
  },
  'f.level': {
    on: 'On a computer there is no motion sensor; use the phone.',
    steps: ['Open Me › Toolbox › Spirit level.', 'Lay the phone flat on the surface or stand it on its edge.', 'Read the degrees and the slope in percent.'],
    example: 'Example: saddle 2.5° nose down.',
  },
  'f.barcode': {
    on: 'The camera scan needs Chrome on the phone; typing the number works everywhere.',
    steps: ['Open Me › Toolbox › Bar code → gear.', 'Tap «Scan bar code» or type the number.', 'A known code opens its item; a new one: type a name, «Add to gear».'],
    example: 'Example: scan the tube box → the spare tube opens in Material.',
  },
  'f.light': {
    on: null,
    steps: ['Open Me › Toolbox › Magnifier and light.', 'Tap «Magnifier and light» and allow the camera.', 'Zoom, «Hold picture», or switch the light on.'],
    example: 'Example: read the tyre size 40-622 on a dark sidewall.',
  },
  'f.packphoto': {
    on: 'Downloads the recognition once (about 30 MB), then offline. KI-Helfer: needs internet; the photo goes out only after «Send photo».',
    steps: ['Lay the things out side by side and open Toolbox › Packing list by photo (or «Tick off by photo» in Pack).', 'Choose «Tick off» (the trip\'s list) or «Add new» (your gear), then take the photo.', 'Deselect what is wrong and confirm; answer «What is this?» once, the app remembers it on this device.'],
    example: 'Example: 9 things on the floor → 6 ticked on «Jura 3 days», the stove taught once as «Kocher».',
  },
  'f.sitpos': {
    on: 'Downloads the recognition once (about 20 MB); the picture stays on the device. Suggestions only, no medical rating.',
    steps: ['On the bike page tap «Sitting position» (or Toolbox › Sitting position).', 'Photo: one pedal at the bottom, taken from the side at hip height. Video: about 5 seconds of calm pedalling from the side.', 'Read knee, hip and back angles, type the saddle height and tap «Save with the bike»; the history stays with the bike.'],
    example: 'Example: knee 158° at the bottom → «a few millimetres lower»; after 3 mm lower 151°.',
  },
  'f.localai': {
    on: 'Load a model once: Me › Appearance › Handling › «AI on this device». With internet the AI helper answers if it is set up.',
    steps: ['Choose a model (small and fast, or a bit cleverer) and tap «Load to this device».', 'Tap «Check the speed» to see how quick this device is.', 'Ask a question in the search or tap «Ask the AI on this device» on the packing list, bike care or look back.'],
    example: 'Example: no signal on the pass, «What is missing for rain?» → the AI on the phone answers from your list.',
  },
  'f.dictate': {
    on: 'On by default: Me › Appearance › Handling › «Speak instead of type»; below it «Dictation and questions».',
    steps: ['Tap the microphone in a note field and speak; tap stop when you are done.', 'Say «Punkt», «Komma» or «neue Zeile» for the signs.', 'Ask a question in the note: the app answers from your data below it.'],
    example: 'Example: «Chain squeaks. What is due on the gravel?» → the parts that are due.',
  },
  'f.askfurther': {
    on: 'Always there under an answer; which services show: Me › Appearance › Handling.',
    steps: ['Ask the app or dictate a question.', 'Tap a service under the answer: it opens with your question.', 'Tick «Send my gear and learnings that fit along» if you want.'],
    example: 'Example: «Which jacket for 5 °C?» → Perplexity opens with the question.',
  },
  'f.searchvoice': {
    on: 'The microphone is always in the search; Me › Search hides it and switches each answer on or off.',
    steps: ['Tap the microphone next to the magnifier and say what you want.', 'One command that fits runs at once; «Undo» takes it back.', 'A question gets the app\'s answer; when the app knows nothing, Gemini answers or you ask further at Claude or ChatGPT.'],
    example: 'Example: say «note brake squeaks» → the note is in the Inbox.',
  },
  'f.aiprojects': {
    on: null,
    steps: ['Open Me › My AI projects.', 'Paste the address of a project or chat and give it a name.', 'Rename, delete or reorder it with the arrows or by dragging.'],
    example: 'Example: «Pack Generator» → your project on claude.ai.',
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
  // Paket R
  'f.account': {
    on: 'Needs the internet for the sign-in. The server keeps no e-mail and no name.',
    steps: ['Me › Data and backup › «Sign in with Google» (or «Switch on sync» for the way without an account).', 'Choose your Google account; the app comes back and switches on the sync.', 'On the other device: the same, «Sign in with Google». Both then keep the same data.'],
    example: 'Example: new phone → open the app → «Sign in with Google» → your gear and trips arrive.',
  },
  'f.privacy': {
    on: null,
    steps: ['Me › «Privacy and terms».', 'Read what stays on your device and what the server keeps when you switch it on.'],
    example: 'Example: before you switch on the sync, look at what the server keeps.',
  },
  'f.pros': {
    on: null,
    steps: ['Me › «Bike mechanic and guide» › «Add contact»: name, what they do, mail, booking page or phone.', '«Request»: choose the bike and the days that suit you, then «Write the mail» or «Open their booking page».', 'Change, delete and the order with the arrows or the handle.'],
    example: 'Example: your bike shop → «Request» → bike «Gravel» → «Tue or Thu morning» → «Write the mail».',
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
  'f.mailin': {
    on: 'Gmail connected under Me › Mail. For the label: one Gmail filter, set up once (the clicks are on Me › Mail).',
    steps: ['Open a mail under Me › Mail and tap «Into the app»; or give it the Gmail label «Packgenerator».', 'Open the Inbox: the mail stands there with its attachments and a tip.', 'Tap the button of an attachment (Documents, appointment, trip, bill) or «File as …».'],
    example: 'Example: a hotel confirmation with a PDF → «Looks like a booking · for the trip «Jura»» → the PDF into Documents, the mail onto the trip.',
  },
  'f.connections': {
    on: 'Nothing to switch on: Me › Connections shows what is connected.',
    steps: ['Open Me › Connections.', 'Tap a connection to open its page.', 'The switches below say what the app may do with the data.'],
    example: 'Example: «Strava: last fetch today 07:12» → your morning run is already ticked on Aktiv.',
  },
  'f.stravaticks': {
    on: 'On by itself once Strava is connected; switch it to «Suggest first» or «Off» under Me › Connections.',
    steps: ['Do your activity with Strava as always.', 'The next fetch ticks the matching Aktiv activity, or puts it under «From Strava» on Aktiv.', 'Under Me › Connections choose which Strava sport counts for which activity, and a bike for indoor rides.'],
    example: 'Example: a ski tour on Saturday → «Skitour» is ticked on Saturday; delete the tick and it does not come back.',
  },
  'f.owncal': {
    on: 'Switch on the calendar «Packgenerator» under Me › Connections and allow it once in Google (needs Google Calendar connected).',
    steps: ['Switch on «Enter tours in the calendar «Packgenerator»».', 'Tap «Allow in Google» once.', 'Every tour appears as an all-day appointment; two days before at 18:00 your phone reminds you to pack.'],
    example: 'Example: a tour from Saturday to Sunday → Thursday 18:00 the reminder «Tour: Jura».',
  },
  'f.notestasks': {
    on: 'Switch on «Open notes as tasks» under Me › Connections (needs Google Tasks connected).',
    steps: ['Write a note as always.', 'It appears in the list «Packgenerator Notizen» in Google Tasks.', 'Tick it there or here: it is done on both sides.'],
    example: 'Example: the note «Kettenöl kaufen» → ticked in Google Tasks on the phone → done in the app.',
  },
  'f.fitbitold': {
    on: 'Once: the Fitbit export from takeout.google.com.',
    steps: ['Export only «Fitbit» at takeout.google.com.', 'Open Me › Connections › Earlier Fitbit data and choose the .zip or its files.', 'Check the preview, change which Fitbit type counts for which activity, then «Take over».'],
    example: 'Example: 3 years of tennis from Fitbit → the tennis history and its stars are complete.',
  },
  'f.wxwatch': {
    on: 'Switch on «Weather alarm» under Me › Reminders on the phone (push must be set up once).',
    steps: ['Plan a tour; its start place, or else your home place, is where the weather is looked at.', 'Twice a day, from 10 days before up to the day before, the server compares the forecast.', 'A message comes only when something changes: the weather turns, gets good again, or a better day shows up.'],
    example: 'Example: tour on Saturday, rain forecast on Thursday → «The weather for Testtour turns. From Sun 25.10. it looks better.»',
  },
  'f.tourhints': {
    on: 'Nothing to switch on; the hints come from the route, the start time and the forecast.',
    steps: ['A stage after sunset brings light and reflective vest; the «Light alarm» push reminds you the evening before.', 'From UV 6 sunscreen and sunglasses; on a ski tour from UV 3 the glacier glasses.', 'On a loop with wind it says which way round gives the tailwind home.'],
    example: 'Example: loop of 60 km, wind from the west at 20 km/h → «Ride the round the other way».',
  },
  'f.rainsoon': {
    on: 'Switch on «Rain on the way» under Me › Reminders on the phone.',
    steps: ['The app sends the server where you should be every 30 minutes of the ride.', 'Every 15 minutes the server looks at the rain of the next 45 minutes there.', 'One message, then 2 hours quiet for that tour.'],
    example: 'Example: dry now, rain in 30 minutes near the pass → a message to keep the rain jacket at hand.',
  },
  'f.air': {
    on: 'Set your home place once; switch on «Ozone and pollen» for the tour morning message.',
    steps: ['The card on Aktiv shows today and tomorrow.', 'Strong pollen after the Swiss classes, ozone from 180 µg/m³.', 'Under «Which values count» switch off the pollen that do not bother you.'],
    example: 'Example: grasses strong tomorrow → «Strong pollen: Grasses.» on the card and in the morning message.',
  },
  'f.routepois': {
    on: 'Plan of a trip with a GPX route, in the route card under the map.',
    steps: ['Add a GPX route to the trip.', 'Search once while online; the list then stays on this device, also offline.', 'After changing the route, search again; «Load again» refreshes the list.'],
    example: 'Example: km 23 · Fountain · Village fountain, 80 m beside the route.',
  },
  'f.lake': {
    on: 'Nothing to switch on; the card on Aktiv fetches the value.',
    steps: ['Open Aktiv: the card «Lake Zurich» shows the water with the scale pleasant, fresh, cold, icy.', '«Sauna and lake today?»: one tap ticks the sauna or the swim; each swim keeps its water temperature, with your coldest one.', 'Under «Cold-water scale» set the limits that fit you.'],
    example: 'Example: 21.4 °C at Mythenquai, preview 22 °C on Saturday → a swim after the ride.',
  },
  'f.datastars': {
    on: 'Nothing to switch on; the stars come once there is data.',
    steps: ['Connect Strava or Fitbit, or answer the daily check.', 'Open Aktiv › Milestones.', 'The new stars stand under Bike, Fitbit and Everyday; switch off single ones.'],
    example: 'Example: 1000 km by bike this year → the second bike star.',
  },
  'f.trello': {
    on: 'Connect once under Calendar › Remember › Trello (needs Strava connected on this device and a workspace «Packgenerator» in Trello).',
    steps: ['Open Calendar › Remember and tap «Connect Trello»; allow it on Trello\'s page.', 'Your to-dos go to the list «To-dos» on the board «Packgenerator»; switch it off there if you like.', 'In a list\'s settings choose «Also in Trello»: the list and its points appear on the board.'],
    example: 'Example: «Licht prüfen» due today, written in Trello → it stands in Remember and «Important today»; ticked here, done there.',
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
  'f.tour': {
    on: null,
    steps: ['Tap «New here? Take the tour» in First steps on Today, or open Me › Handbook › Tour.', 'Choose the example trip (playground) or your own data, then tap «Next» through the steps.'],
    example: 'Example: on the top of Active, «Tour of Active (4 steps)» shows ticking off, the week, goals and more.',
  },
  'f.firststart': {
    on: 'Only on a new, empty app: it asks once when it opens for the first time.',
    steps: ['Choose the language and «Start with examples» or «Start empty»; then the short tour if you like.', 'Me › Data and backup › «Remove the examples» takes them away («Undo» brings them back); «Get the examples» brings them later.'],
    example: 'Example: a friend opens the link and sees the made-up «Jura loop» with its packing list right away.',
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
  'f.ownvalues': {
    on: null,
    steps: ['Open Me › Own values.', 'Change a number with − and + or type it; the pen renames or deletes it.', '«Back to Standard» brings the number back, «Deleted values» a deleted one.'],
    example: 'Example: packing starts 3 days before the trip, the backup reminder after 7 days.',
  },
  'f.ownreminders': {
    on: null,
    steps: ['Open Me › Own values › «+ Own reminder».', 'Name, «every N km» or «every N days», all bikes or one.', 'Bikes › Care shows it on the bike\'s page; «Done» starts it again.'],
    example: 'Example: «Check the tyre pressure» every 14 days for every bike.',
  },
  'f.ownbody': {
    on: null,
    steps: ['Open Me › Your questions and add an own question.', 'Choose «Number» with a unit, or the scale 1 to 10.', 'Body values › Own shows it with its curve.'],
    example: 'Example: «Back pain» 0 to 10 every evening.',
  },
  'f.listsmore': {
    on: null,
    steps: ['Open Me › Lists and types.', 'Pick a list, e.g. Kinds of bike.', 'The pen renames, hides or deletes; «+ Own» adds one; arrows and handle sort.'],
    example: 'Example: an own kind of bike «City bike», or a diary question of your own.',
  },
  'f.theme': {
    on: null,
    steps: ['Open Me › Appearance.', 'Choose font, colour world, text size and light or dark.'],
    example: 'Example: dark with larger text for the evening.',
  },
  'f.uisize': {
    on: null,
    steps: ['Open Me › Appearance › Size and light.', 'Move the slider or tap − and +; the app changes when you let go.', 'Switch on «Compact» for less space between.'],
    example: 'Example: 115 % on the phone for the way, 100 % on the computer.',
  },
  'f.custompage': {
    on: null,
    steps: ['At the end of a page tap «Customise this page».', 'Switch a part off to hide it, tap the pencil to rename it, sort with the arrows or by dragging.', 'Tabs: choose «Opens with»; Menu: hide or sort the places. «As at the start» puts the page back.'],
    example: 'Example: hide «Suggestions» on Appearance and put «Colour world» first.',
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
  'f.tripalert': {
    on: null,
    steps: ["Plan a trip with its start place (or set your region under Me › Alerts and news).", "From five days before, the app looks for MeteoSwiss warnings for its days and place; on a ski tour also the avalanche danger.", "A line on the trip says what; «Read more» opens the warning."],
    example: "Example: thunderstorm warning for your region on Saturday → one line on Saturday's trip.",
  },
  'f.helpsearch': {
    on: null,
    steps: ["Open the search (the magnifier or «/»).", "Type a whole question, e.g. «Where do I set the backup password?».", "«Fits your question» shows up to three functions with their first step; a tap opens it."],
    example: "Example: «Wo sehe ich die Lawinengefahr?» → Alerts and news.",
  },
  'f.offlinesave': {
    on: null,
    steps: ["Open your trip from three days before it starts.", "Tap «Save for the way»: the newest weather of the trip, the alerts and your news go onto the device.", "The line says what is saved and since when; the packing list is on the device anyway."],
    example: "Example: the evening before a tour in the mountains, tap once; up there the weather is still there.",
  },
  'f.news': {
    on: null,
    steps: ['Open Me › What is new.', 'See the newest version, every function and all versions by month.'],
    example: 'Example: after an update read the 3 new things in one minute.',
  },
  // Paket M «Aus Touren lernen»
  'f.diary': {
    on: 'Photos stay on this device; they are not in the backup.',
    steps: ['Open the debrief of a trip: the draft from Strava rides, weather and notes is there.', 'Change anything; «New draft» writes it again.', '«Photos of those days» adds photos of the trip days; «Copy» or «Share» the text.'],
    example: 'Example: «Day 1 · Saturday: 84 km, 1,240 m up in 4 h 10 min. Weather: 14 to 24 °C, dry.»',
  },
  'f.extraq': {
    on: null,
    steps: ['Open the debrief of a trip.', 'Under «More to learn» the 2 questions that fit the trip best are open; «Ask more» shows the others.', '«Adjust questions»: switch off, change the text, add your own, delete, order with arrows or by dragging.'],
    example: 'Example: after a rainy trip: «What helped you in the rain, and what did not?»',
  },
  'f.notetodo': {
    on: 'Google Tasks shows as a place once it is switched on under Me › Calendar and tasks.',
    steps: ['Open the debrief of a trip; the notes on the way are listed.', 'Choose under «To-dos go to»: a new checklist, one of your notes or a Google Tasks list.', 'Tap «As to-do» beside a note.'],
    example: 'Example: «brake squeaks» → checklist «To-dos after Jura round».',
  },
  'f.future': {
    on: null,
    steps: ['In the debrief write a sentence under «A message to your future self».', 'On the way of your next trip a closed letter «Mail from you!» waits.', 'Open it; «Read» puts it away.'],
    example: 'Example: «Take the warm gloves, the mornings were cold.»',
  },
  'f.quiz': {
    on: null,
    steps: ['The evening before a trip, tap «Quiz the evening before» on «Packed».', 'Answer the three questions; the streak counts the trips with a quiz before them.', 'Add, order, switch off or delete your own questions; hide kinds of suggestions; switch the quiz off at the top.'],
    example: 'Example: «In which bag is the stove?» → Frame bag. 2 of 3 right · Streak: 4 trips.',
  },
  'f.observations': {
    on: 'Needs data: Strava rides, Fitbit days or «How are you?» answers; with too little data it says so.',
    steps: ['Open Aktiv › Week › Week in review.', 'From Sunday the three observations of the week are at the top; they stay the same afterwards.', 'Hide a kind with «Do not show this kind any more»; earlier weeks are under «Older weeks».'],
    example: 'Example: «After a day on the bike you slept 35 min longer: 7:55 h against 7:20 h on the other nights.»',
  },
  'f.chronik': {
    on: 'Grows with every debrief, ride and learning.',
    steps: ['Open Trips › Look back › Chronicle, or the tile «Earlier at this time» on Today.', 'Choose «All», «Bike», «Trips», «Care», «Meditation» or «Notes»; the arrows and the month buttons change the month.', 'Tap a trip or ride to open its look back.'],
    example: 'Example: 19 October: «Jura heights» 2025, 132 km, «Too many tools with me».',
  },
  'f.gelernt': {
    on: null,
    steps: ['Open Trips › Look back › What the app learned.', '«Month»: up to 6 lines with numbers; the arrows go to other months.', '«Year»: the letter «Your year»; «Print» also saves it as PDF.'],
    example: 'Example: October: 2 trips, 121 km · 1 new learning · 1 thing stays at home now.',
  },
  'f.jahr': {
    on: 'Photos stay on this device; without a photo the route is drawn.',
    steps: ['Open Trips › Look back › Your year as pictures, from 1 December also the hint.', 'Tap, swipe or use the arrow keys; the cover chooses another year.', 'The last picture «Thank you for this year» leads to the year letter.'],
    example: 'Example: 21 trips, 1,746 km, 55 days on the way.',
  },  'f.neuland': {
    on: 'Works with a GPX route on the trip or an uploaded ride; without one, tick by hand.',
    steps: ['Open Trips › Look back › New ground.', 'Choose a collection: cantons, passes, huts, peaks, lakes, municipalities, countries or your own.', 'The app colours in what your routes reached; tap an entry for its day and trip, or tick it by hand.'],
    example: 'Example: a day trip over the Klausenpass → Uri and Glarus new, the Klausenpass ticked, two lines on the bingo card closer.',
  },
  'f.heatmap': {
    on: 'Works with Strava rides, uploaded GPX rides and routes recorded in the app.',
    steps: ['Open Trips › Look back › Heatmap.', 'Choose clouds or lines; filter by year, sport, bike or tour and everyday.', 'Tap a coloured line: the rides there show below, each with its page.'],
    example: 'Example: 2026, bike only → your way to work glows dark red, the Jura tour is a thin orange line.',
  },  'f.eveningtour': {
  },  'f.tickreview': {
    on: 'Works with what you tick off under «Heute abhaken» and with check questions that have a number.',
    steps: ['Open Active › Goals and tap «Evaluate».', 'Choose 30 days, 90 days or the year, and all activities or one.', 'Switch to «Your answers» for a check question; «…» on a card hides or moves it.'],
    example: 'Example: Meditation, 90 days → most often on Tuesday, mostly before 9 o’clock, 8 days in a row as the best run.',
  },
  'f.eveningtour': {
    on: 'Shows only on the days of a trip.',
    steps: ['On a trip day, open the evening review from Today.', 'Tap a number at «How was the trip today?»; a second tap takes it back.', 'The score goes into the debrief; the diary draft names it for that day.'],
    example: 'Example: day 2 of the Jura round → 8 of 10; the diary says «Rated in the evening: 8 of 10».',
  },
  'f.ridepage': {
    on: 'Needs Strava on this device; an uploaded GPX shows its own values. Older rides get their details bit by bit.',
    steps: ['Tap a Strava activity anywhere: Touren, Fahrten-Buch, Verlauf, the Rückblick of a trip or Aktiv › Training.', 'At the top: kind, commute, device, new best times, «How hard was it?» and your Strava comment.', 'Further down: laps, splits per km and segment times; «…» on a card hides or moves it.'],
    example: 'Example: Saturday ride → 3 laps from the lap button, km 12 the slowest, 2 new best times.',
  },


  // Paket S «Reise-Spur»
  'f.here': {
    on: 'Needs a trip that has started; the browser asks once to use the location.',
    steps: ['On the way: tap «I am here».', 'Add a sentence or a photo, then «Save place».'],
    example: 'Example: «Lunch at the lake» with a photo; it sits on the tour map at that spot.',
  },
  'f.record': {
    on: 'Needs a trip that has started; the browser asks once to use the location.',
    steps: ['On the way: tap «Record», then «Start recording».', 'Keep the phone on the handlebar with power; tap «Stop» at the end.'],
    example: 'Example: a day without the Garmin: the app draws the line; screen off for 20 min leaves a gap.',
  },
  'f.spurmap': {
    on: 'Needs Strava connected, a GPX ride, a recording or a place on the trip.',
    steps: ['Open the trip’s debrief › «Travel track».', 'Move and zoom the map, tap a day or a dot.'],
    example: 'Example: a 3-day tour shows three coloured lines, the lunch places and the photos.',
  },
  'f.spurlink': {
    on: 'Needs the internet once to make the link.',
    steps: ['«Travel track» › choose what goes in › «Make a link».', 'Send it; «Delete link» ends it at once.'],
    example: 'Example: the family follows the tour without an account; photos stay on your phone.',
  },
  'f.travelbook': {
    on: null,
    steps: ['«Travel track» › «Travel book as PDF».', 'Save or print the PDF.'],
    example: 'Example: a cover with the whole line, then one page per day with its photos.',
  },
};

/** The small apps: each opens right on its area, with its own icon, and shares the data of the whole app. */
export const MINI_APPS_HANDBOOK = {
  title: 'Small apps',
  intro: ['Four parts of the app also open as a small app with their own home-screen icon.', 'Each opens directly on its area and shares the same data with the whole app.'],
  apps: [
    { key: 'meditation', title: 'Meditation', steps: ['In Chrome on the phone, open noahdolmetsch-af.github.io/packgenerator/apps/meditation/.', 'Tap the menu ⋮ › «Install app» or «Add to home screen».'], example: 'Example: tap the icon → straight into a 10 min meditation.' },
    { key: 'packliste', title: 'Packing list', steps: ['In Chrome on the phone, open noahdolmetsch-af.github.io/packgenerator/apps/packliste/.', 'Tap the menu ⋮ › «Install app» or «Add to home screen».'], example: 'Example: tap the icon → the open trip in Pack, ready to tick.' },
    { key: 'velopflege', title: 'Bike care', steps: ['In Chrome on the phone, open noahdolmetsch-af.github.io/packgenerator/apps/velopflege/.', 'Tap the menu ⋮ › «Install app» or «Add to home screen».'], example: 'Example: tap the icon → see what is due on the bike and tick the oiled chain.' },
    { key: 'werkzeug', title: 'Toolbox', steps: ['In Chrome on the phone, open noahdolmetsch-af.github.io/packgenerator/apps/werkzeug/.', 'Tap the menu ⋮ › «Install app» or «Add to home screen».'], example: 'Example: tap the icon → the calculator, PDF and photo tools at once.' },
  ],
};

const NONE = Object.freeze({ on: null, steps: [], example: '' });

/** The entry of a function (a FEATURES id); without one an empty entry. */
export const handbookOf = (id) => HANDBOOK[id] ?? NONE;

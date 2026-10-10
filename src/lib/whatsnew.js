/**
 * v0.35.0 (Noah, from now on every release): "New in the last updates" at the top of "What the app
 * can do" (#/features), and once after an update a quiet line on Today. Each release adds an entry
 * at the top: version, date, 1-4 points in plain words (English keys for t(), German in
 * i18n/de/whatsnew.js), each with the address of the exact place ("Try it"), or no address when
 * the place no longer exists (older versions). The list goes back to the first version (0.1.0).
 * action 'data': the place is "Your data" on Today (nav.js openData) instead of an address.
 * Pure, tested in tests/whatsnew.test.js.
 */

export const WHATS_NEW = [
  {
    version: '0.67.0',
    date: '2026-10-10',
    points: [
      { text: 'The helper: once set up with your helper code, Claude suggests things for you. Everything is a suggestion you can change, and without setup the app works as before.', href: '#/helper' },
      { text: 'In "New trip", write the trip in one sentence: the helper fills in the conditions, the building blocks and a few items from your own gear.', href: '#/pack' },
      { text: '"Check the list" names what may be missing, what is double and what is heavy, with a lighter item of your own.', href: '#/pack' },
      { text: 'Bike care: the helper adds parts that will be due soon to "Due now", from your km, rides and notes, with a concrete check (chain gauge, pads, tyres).', href: '#/bikes?tab=care' },
    ],
  },
  {
    version: '0.66.0',
    date: '2026-10-09',
    points: [
      { text: 'New building blocks: Bivouac, Tent and Hotel/hut for the night, Repair, Charging, Light and Race for the ride, Food, Hygiene and Comfort to add. Your items moved along by themselves, nothing was lost.', href: '#/blocks' },
      { text: 'A new trip with nights asks: Bivouac, Bivouac + tent or Hotel/hut. Repair and Charging come on every ride, Light by itself when you ride into the dark; each can be taken off. Comfort is only offered, never ticked.', href: '#/pack' },
      { text: 'Check building blocks: one block after the other with weight and total, per item Keep, Out or Elsewhere, and what is probably missing, one tap to add. Every step can be undone.', href: '#/blocks/check' },
      { text: 'Warm is no block any more: its items come with the weather (below 10 °C unless they had their own temperature). Check them first in Check building blocks.', href: '#/blocks/check' },
    ],
  },
  {
    version: '0.65.0',
    date: '2026-10-09',
    points: [
      { text: 'Every bike shows its fit and setup at the top: saddle height, target tyre pressure, bar width and more. Tap a value to change it.', href: '#/bikes' },
      { text: '"Compare bikes" starts with these numbers for all bikes.', href: '#/bikes' },
      { text: 'Checking the tyre pressure shows the target beside the last value and fills it in; the base check names it too.', href: '#/bikes?tab=care' },
    ],
  },
  {
    version: '0.63.0',
    date: '2026-10-09',
    points: [
      { text: 'An item opens short: its name, its weight and one line on how it comes along. Everything else is a row that opens with one tap, one at a time.', href: '#/gear' },
      { text: 'Lighter alternatives from your own gear: the one you linked first, then up to two suggestions. "Doesn\'t fit" hides one, with Undo.', href: '#/gear' },
      { text: '"Never used" explains its rule when it is empty and shows what is on the way there: taken once or twice and never used.', href: '#/gear?view=never' },
    ],
  },
  {
    version: '0.61.0',
    date: '2026-10-09',
    points: [
      { text: '"Your pace" says your rule in one sentence. From 5 rides it guesses the riding time everywhere by itself, and "Back to the standard rule" undoes that with one tap.', href: '#/debrief/pace' },
      { text: 'Under the sentence, three small charts: your speed per ride, from flat to hilly, and the climbing per km, for 12 months or all.', href: '#/debrief/pace' },
      { text: 'The logbook is a diary of all your trips, newest first: km, Hm, time, weather and your notes, with a filter by year and kind of trip. A tap opens the trip.', href: '#/debrief/logbook' },
      { text: '"Learned" lists every learning by topic, nothing folded away.', href: '#/debrief/learnings' },
    ],
  },
  {
    version: '0.59.0',
    date: '2026-10-09',
    points: [
      { text: 'The packing list shows what you wear as the first card "On me", head to feet. A tap on a piece opens "Swap": the pieces of the same zone and layer, those that fit the weather first. One tap swaps, Undo takes it back.', href: '#/pack' },
      { text: 'The app remembers what you picked, so it comes first next time. Pieces without a °C range get their bar from warm, medium or cold.', href: '#/pack' },
      { text: '"Open in the wardrobe" shows the wardrobe for the trip: its temperature, dry, rain or any, and pieces that do not fit hidden when a fitting one is there.', href: '#/wardrobe' },
    ],
  },
  {
    version: '0.57.0',
    date: '2026-10-09',
    points: [
      { text: 'Bike care starts with an overview: a ring per bike, at most three cards for what is due, all problems in one list. Replacing or servicing a part is a short guided flow.', href: '#/bikes?tab=care' },
      { text: 'Every bike has the same part list with a spec sheet and its geometry. "Compare bikes" puts them side by side; an empty cell is filled with one tap.', href: '#/bikes' },
      { text: 'The Inbox is now "Eingang": grouped by day, one button "File" with seven targets. A receipt photo becomes a workshop visit, found under Bikes → Workshop.', href: '#/inbox' },
      { text: 'New page Notes: write, dictate, add a photo, a link or a checklist; topics, pinned notes and "Turn the note into …" a trip idea, a wish or a problem.', href: '#/notes' },
    ],
  },
  {
    version: '0.56.0',
    date: '2026-10-09',
    points: [
      { text: 'One page "Look back" instead of five: your last ride, the last 12 months with the year before, average and best, and your trips compared in 7 small charts and a table.', href: '#/debrief' },
      { text: 'Past trips is one table, on the phone too: km, Hm, time, rain, temperature, bike and one learning per trip. The name stays put while the other columns scroll; period, "Kind" and a search that finds learnings.', href: '#/pack/past' },
      { text: "A trip's saved debrief now tells what the trip was: numbers and weather per day, plan against real, what you can leave at home, learnings and what it means for the next trip.", href: '#/pack/past' },
    ],
  },
  {
    version: '0.51.0',
    date: '2026-10-09',
    points: [
      { text: "Tap a button on Today or on In the flow to tick an activity: one tap with Undo, tap again to take it back. A long press picks the place (Yoga studio or at home), the amount or the duration.", href: '#/flow' },
      { text: "In the flow: three rings over the last 7 days (move, mindful, recovery) and goals × days, every goal a rolling window (daily, 7, 10 or 30 days). Sports with a season rest until their months come.", href: '#/flow' },
      { text: "The stopwatch counts down to your target time, with a singing bowl at the start and the end and, if you like, in between (regularly, at chosen minutes or at random). Made small, it keeps running on every page.", href: '#/flow' },
      { text: "Daily check: sleep, energy, mood and a fourth question that changes each day, one tap each on 1–10. Every activity can be edited: name, symbol, ring, goal, minimum duration, season and what else counts.", href: '#/flow/goals' },
    ],
  },
  {
    version: '0.47.3',
    date: '2026-10-09',
    points: [
      { text: 'In a new trip, "Chilly" and "Rain" stay chosen when you tap them, also when the forecast chose them already, so the list gets the cold and the rain items. Dry or rain are two chips, as on the trip page.', href: '#/pack' },
      { text: 'The ••• menus (packing list, templates, trips in progress, bike care) stay fully on the screen on a phone: they move aside or open upwards.', href: '#/pack' },
      { text: '"No weather" takes the weather off again, in a new trip and on the trip page, also when the forecast chose it.', href: '#/pack' },
    ],
  },
  {
    version: '0.47.2',
    date: '2026-10-09',
    points: [
      { text: 'Gear has seven views, each with its count: All, Most used, Proven, Favourite things, Never used, Unweighed and Wishlist.', href: '#/gear' },
      { text: '"Dead weight" is now called "Never used", with one plain sentence per item: "Taken 4 times, never used".', href: '#/gear?view=never' },
      { text: 'Every item shows its trips as dots: used, along but not used, at home. On the computer the chosen card opens on the right; sorting and filters are in one sheet.', href: '#/gear' },
      { text: 'An item tells its year on tour, a rule learnt from your debriefs (like "Below 9 °C always used"), its last trips and a lighter alternative from your own gear.', href: '#/gear' },
    ],
  },
  {
    version: '0.47.1',
    date: '2026-10-09',
    points: [
      { text: 'The top card of a trip shows the ride time. Tap date, duration, weather or bike to change it right there; the list follows, Undo takes it back. A day ride no longer shows "1 day, no overnight stay".', href: '#/pack' },
      { text: '"Fitted to the weather" switches between cold, chilly, mild, warm and hot, dry or rain, in one tap. The forecast keeps its own range (10–16 °C stays 10–16), and the card says where the range comes from.', href: '#/pack' },
      { text: 'The Inbox shows the newest note on top, and a sorted note opens what it became (the repair, the wish). "More" shows only a small dot when notes wait.', href: '#/inbox' },
      { text: 'Bike care shows the problems of all bikes in one list, newest on top, each with a chip for the bike and the way to fix it. Parts and their history show the newest work first.', href: '#/bikes?tab=care' },
    ],
  },
  {
    version: '0.47.0',
    date: '2026-10-09',
    points: [
      { text: 'Wardrobe in the new look: the onion figure on the left filters by zone or layer and marks gaps with a pin, four narrow layer columns with a temperature bar per piece. "Still to sort" is a short list with one tap per row: a sorted row leaves, the next one moves up, Undo brings it back.', href: '#/wardrobe' },
      { text: 'A bike trip shows the bike drawing with each bag and its weight on top (or the setup photo, if there is one), next to it the weight in one dark card: base on the bike, on me, food and water.', href: '#/pack' },
      { text: 'Gear has a slim tab bar with small counters, round category dots and calmer cards. In the Inbox a sorted note leaves the list, the next one gets the focus, Undo puts it back.', href: '#/gear' },
      { text: 'Bike care reads calmer: one style for titles, rows, badges and numbers, links in quiet teal, no bold lists. What is due now stands as cards on top.', href: '#/bikes?tab=care' },
    ],
  },
  {
    version: '0.46.3',
    date: '2026-10-09',
    points: [
      { text: '"More" is calm again: the packing lists of your trips no longer stand on top as single rows. You find them under "Trips"; templates are under Plan, past trips under Look back.', href: '#/trips' },
    ],
  },
  {
    version: '0.46.2',
    date: '2026-10-09',
    points: [
      { text: '"Customise the start page" shows each section name readable on its line again (on the phone the names stood letter by letter in a narrow column).', href: '#/' },
    ],
  },
  {
    version: '0.46.1',
    date: '2026-10-09',
    points: [
      { text: 'Problem with a bike: several problems in one line, separated by commas or "and", become single repairs, each ticked off on its own. Under the field you see what will be saved.', href: '#/bikes?tab=care' },
      { text: 'Bike care shows the newest problems on top. The priority is a button in the row: tap it, then High, Medium or Low. The ••• menu opens upwards when there is no room below.', href: '#/bikes?tab=care' },
      { text: 'A dry day ride no longer brings rain gear (rain socks, latex gloves) because it is cold, and glasses for the dark only come in the rain or when the ride runs into the dark. A new day ride takes the temperatures of the last one, never its rain.', href: '#/pack' },
      { text: '"Trips" opens an overview of all trips by state (soon on the way, in planning, debrief open, ridden), each with one button to its next step. More → Packing lists has the lists, templates and past trips. The search on the phone opens as a clean page under the top bar.', href: '#/trips' },
    ],
  },
  {
    version: '0.46.0',
    date: '2026-10-09',
    points: [
      { text: 'Today is new: a greeting with the weather and an idea for a day ride, the next trip in one compact card, and "What do you want to do?" with the functions you use most in front.', href: '#/' },
      { text: '"Important today" shows at most three things, with "Lubed ✓" right in the row; next to it "Tried it yet?" shows a function you have not used yet. Test trips no longer count as the next trip.', href: '#/' },
      { text: 'The search at the top also does things: type "weigh", "day ride factor" or "chain lubed spark" and press Enter.', href: '#/' },
      { text: 'Three colour worlds, Glacier, Sandstone and Classic, each light or dark: More → Colours.', href: '#/' },
    ],
  },
  {
    version: '0.45.2',
    date: '2026-10-09',
    points: [
      { text: 'Problem with a bike from the + menu: choose the bike with one tap, one problem per line (or quick buttons like "Saddle too low"), a priority (required), a deadline if you like, an optional photo. Each line becomes its own open repair in Bike care, with Undo.', href: '#/bikes?tab=care' },
      { text: 'The app sorts each problem: myself (with the first step, e.g. "Pump to your pressure"), with a guide, bike shop (into the order for the shop) or part needed (onto the wishlist). One tap changes it; the same problem twice in 30 days brings a lasting fix.', href: '#/bikes?tab=care' },
      { text: 'Base check before every ride: lock, mini backpack, bottle, sunglasses, cap, wind jacket, plus helmet, charged devices, tyre pressure, phone and keys. It waits on the ride page until everything is with you.', href: '#/ride' },
    ],
  },
  {
    version: '0.45.1',
    date: '2026-10-09',
    points: [
      { text: 'Check import: a line that is twice in the file waits under "Unsure" (is twice in the file) instead of becoming a second item. "Merge with …" now works on the phone too.', href: '#/gear/import' },
      { text: 'Plan of a short day ride: when something is due at the bike, one quiet line with the number and a link to its bike care.', href: '#/pack' },
      { text: 'Backups hold only your data: two backups without a change are the same (the tips of the day stay on the device). Past and finished trips keep their list exactly as packed.', href: '#/', action: 'data' },
      { text: 'Small phones: words no longer break in the middle, the wishlist shows long names without the extra tag. Gear on the computer opens faster: each category first shows 12 items, then "Show all".', href: '#/gear' },
    ],
  },
  {
    version: '0.45.0',
    date: '2026-10-09',
    points: [
      { text: 'Wardrobe: warm to cold within a zone, quiet gaps like "No gloves below 5 °C" with "Add to wishlist", a photo per piece and "Save as kit …" for an outfit that Plan then suggests. Everyday-only clothes show only under Everyday; what the debriefs taught ("You run cold: +2 °C") is in the header with Reset.', href: '#/wardrobe' },
      { text: 'On Today "What do I wear today?": for a day ride at your home place, one piece per layer and zone from your own clothes; a tap opens the wardrobe.', href: '#/' },
      { text: 'Check import: after "Apply all safe ones" the line under the file says when it was applied, and an apply that adds nothing says so in words.', href: '#/gear/import' },
      { text: 'Phone and keyboard: small buttons and the places on the bike drawing have 44 px tap areas, gear category heads stay on two lines at 320 px, and after "Create trip" the focus goes to the new trip\'s name.', href: '#/gear' },
    ],
  },
  {
    version: '0.44.1',
    date: '2026-10-09',
    points: [
      { text: 'Keyboard: Escape in the phone search gives the focus back to the magnifier, and Escape closes an open row in the packing list.', href: '#/pack' },
      { text: 'Bigger tap areas on the phone: the gear category heads, "PG" at the top, "All ✓" and "All –" in the debrief and the bike care link in Plan.', href: '#/gear' },
      { text: 'Clearer words: Import backup says "1 trip" and "1 learning", and an empty ride file is called empty.', href: '#/', action: 'data' },
      { text: 'Offline the app keeps its own font (it fell back to the system font before).', href: '#/' },
    ],
  },
  {
    version: '0.44.0',
    date: '2026-10-09',
    points: [
      { text: 'Last 12 months: always the 12 months up to today, not a calendar year. Riding, packing, learned and bikes on one page, with small differences to the 12 months before.', href: '#/review' },
      { text: 'On Today a calm card with trips, km, nights outside and the base weight change, and the most interesting fact. It shows once a trip or a ride is in the 12 months.', href: '#/' },
      { text: 'Two small charts drawn to scale: km per month and the base weight per trip. Reached from Today, from Debrief and from More → Look back.', href: '#/review' },
    ],
  },
  {
    version: '0.43.0',
    date: '2026-10-09',
    points: [
      { text: 'Record weights (Gear → •••, or the quiet line "… without weight · weigh"): one thing per screen with a big grams field, "Save & next", "Skip" and Undo. Bikes and bags come first.', href: '#/gear?tab=weigh' },
      { text: 'The order of weighing: bags, sleep, outer and mid layers, then the rest; in each group what you take most often first.', href: '#/gear?tab=weigh' },
      { text: 'Select in Gear: the most used actions in the bar, the rest under •••. New: area and archive for many items at once, each with Undo.', href: '#/gear' },
      { text: 'Select in the wardrobe (layer and zone for many pieces) and in an open building block (remove many at once).', href: '#/wardrobe' },
    ],
  },
  {
    version: '0.42.0',
    date: '2026-10-09',
    points: [
      { text: "The wardrobe (More → Gear, or Gear → Wardrobe): your clothing by layer and body zone, °C on the right; new clothing waits in \"To sort\" with a guess from the name.", href: '#/wardrobe' },
      { text: "In Plan, one quiet line under the weather checks the onion: each layer and zone ✓ or a gap, with \"+ … in\" for your best item. From 30 % rain, rain protection belongs in it.", href: '#/pack' },
      { text: "Temperature kits from your Excel are building blocks: Plan suggests the kit for the coldest riding hour and adds its missing items with one tap, with Undo. The debrief asks \"Too cold | Fitted | Too warm\" and slowly shifts the kit borders.", href: '#/pack' },
      { text: "Check import, step 2: kits, building blocks (merge from 70 % of the same items), tasks as one preparation list (only before events and bikepacking of more than 4 nights) and old trips as notes in the Logbook.", href: '#/gear/import' },
    ],
  },
  {
    version: '0.41.0',
    date: '2026-10-09',
    points: [
      { text: 'Upload a ride (GPX) from New or from Debrief: distance, climbing, moving time and every pause of 5 minutes or more.', href: '#/debrief/ride' },
      { text: 'Planned vs real: with the trip of that day, the app compares distance, climbing, moving time and speed with the plan.', href: '#/debrief/ride' },
      { text: 'Up to 3 learnings per ride, like "You ride faster than planned"; each is kept with one tap, nothing without one.', href: '#/debrief/ride' },
      { text: 'On Android, share a GPX file to Pack Generator and it opens the upload. Without a trip the ride is saved on its own or becomes a past trip.', href: '#/debrief/ride' },
    ],
  },
  {
    version: '0.40.0',
    date: '2026-10-09',
    points: [
      { text: 'Calmer side pages: Inbox, Past trips, Debrief, Building blocks and What the app can do as short rows; explanations behind a small "?".', href: '#/inbox' },
      { text: 'Past trips is one list with the debrief state and the km on the right; Debrief keeps learnings, comparison and pace.', href: '#/pack/past' },
      { text: 'Chain wear at the replace limit (Today or Bike care) marks the chain as work needed and puts it on the wishlist, with Undo.', href: '#/bikes' },
      { text: 'New trip: the area and the other starts are folded, the standard comes first; Plan and the ride use the full width on a computer.', href: '#/pack' },
    ],
  },
  {
    version: '0.39.0',
    date: '2026-10-09',
    points: [
      { text: 'Templates are linked to your building blocks: change a building block and every template with it changes too.', href: '#/pack/templates' },
      { text: 'A new template in 3 steps: building blocks, single items, then the bike (optional) and its bags.', href: '#/pack/templates' },
      { text: 'The template list shows what is in each one, its weight, when you last used it and how often; a switch per area.', href: '#/pack/templates' },
      { text: 'Templates you have not used for a year get a quiet hint: keep or archive them. Nothing is deleted.', href: '#/pack/templates' },
    ],
  },
  {
    version: '0.38.0',
    date: '2026-10-09',
    points: [
      { text: 'Today: a ready light per bike and quick buttons: chain lubed, wear measured, washed, sealant, tyre pressure, km. Each with Undo.', href: '#/' },
      { text: '"Jump to" on Today: what is due, never used items, a year ago, the weekend and what is new.', href: '#/' },
      { text: 'The menu "More" at the top right holds the rarer pages and the Inbox; the search also finds pages.', href: '#/' },
      { text: 'Compact rows in Gear (the bag on wish) with swipe on a phone, and Bike care as one list: due first, the rest folded.', href: '#/gear' },
    ],
  },
  {
    version: '0.37.1',
    date: '2026-10-09',
    points: [
      { text: 'Merge items: a double or a collection item goes into the imported item(s); the app proposes the counterpart.', href: '#/gear/import' },
      { text: 'Templates, building blocks, bags and planned trips then use the new item; past trips stay complete.', href: '#/gear/import' },
      { text: 'Archived items no longer come into a new trip, also not from a template or a copy.', href: '#/pack' },
      { text: 'In the item window: "Merge with …" for any double.', href: '#/gear' },
    ],
  },
  {
    version: '0.37.0',
    date: '2026-10-08',
    points: [
      { text: 'Backpacks, hip bags and vests are real bags with litres and weight, in Your bags.', href: '#/bikes' },
      { text: 'On the bike there are two worn places, Back and Hip; their weight counts to On me, not to the bike.', href: '#/bikes' },
      { text: 'A trip without a bike takes your real backpack; the app suggests one by litres and area.', href: '#/pack' },
      { text: 'A quiet note when the items need more litres than the bag holds.', href: '#/pack' },
    ],
  },
  {
    version: '0.36.0',
    date: '2026-10-08',
    points: [
      { text: '"Check import": your reviewed gear list waits on its own page; nothing goes into Gear before you check it.', href: '#/gear/import' },
      { text: 'One button takes the safe ones; unsure items are decided with one tap. A backup comes first, "Undo" puts it back.', href: '#/gear/import' },
      { text: 'Items the list does not name can be archived: they move to Gone, past trips stay complete.', href: '#/gear/import' },
      { text: 'New areas for your items: Cycling, Hiking and Everyday.', href: '#/gear' },
    ],
  },
  {
    version: '0.35.0',
    date: '2026-10-08',
    points: [
      { text: 'Switch between your trips: the small "more" button in the dark band lists every trip and debrief still in progress.', href: '#/pack' },
      { text: 'After every change the band says "Saved ✓" for a moment.', href: '#/pack?day' },
      { text: 'Nothing typed is lost: a new trip, a new item and a quick note are kept as soon as you type, also when you close the window.', href: '#/pack' },
      { text: 'This list: what is new, with a button to try each point.', href: '#/features' },
    ],
  },
  {
    version: '0.34.0',
    date: '2026-10-08',
    points: [
      { text: 'Today shows the next step until the trip, with a small timeline.', href: '#/' },
      { text: 'A shopping list and a charge list for the days before the trip.', href: '#/pack?shop' },
      { text: 'On a trip of several days, On the way has a block for the evening.', href: '#/ride' },
      { text: 'Send the backup to your other device; an import says whether it is newer or older.', href: '#/', action: 'data' },
    ],
  },
  {
    version: '0.33.0',
    date: '2026-10-08',
    points: [
      { text: 'Every new trip brings everything in Standard, also from a template or a copy.', href: '#/pack' },
      { text: '"Leave at home" really takes the item out of Standard.', href: '#/gear' },
      { text: 'Standard items you did not use show on the ballast card (tools and what you wear never).', href: '#/pack' },
    ],
  },
  {
    version: '0.32.0',
    date: '2026-10-08',
    points: [
      { text: 'The same words everywhere: building blocks, templates, "On me".', href: '#/blocks' },
      { text: 'The item window has two switches: Standard and On me.', href: '#/gear' },
      { text: 'In Gear, the filter "Comes along" (computer): Standard, On me, in a building block, stays at home.', href: '#/gear' },
      { text: 'The building blocks page in three groups.', href: '#/blocks' },
    ],
  },
  // Below: the history back to the first version (docs/status.md, git log). Words of today where
  // a place was renamed; no "Try it" where the place no longer exists.
  {
    version: '0.31.0',
    date: '2026-10-08',
    points: [
      { text: 'Bike care shows one bike at a time, with at most three lines "Due now".', href: '#/care' },
      { text: 'Each part shows its last job (date, km, cost, who did it) and when it is due next.', href: '#/care' },
      { text: 'Setup: your bikes as tabs in the dark band, a large drawing and your standard bags.', href: '#/bikes' },
      { text: 'Whether you or the bike shop did the work, you choose when you log it.', href: '#/care' },
    ],
  },
  {
    version: '0.30.2',
    date: '2026-10-08',
    points: [
      { text: 'A search result opens the item straight away.', href: '#/gear' },
      { text: 'While packing, rows stay in place, so a quick tap never hits the wrong item.', href: '#/pack?day' },
      { text: 'New learnings come first on Today; the packing day shows "From earlier trips".', href: '#/' },
      { text: 'Plan a new trip also without a bike, with help for the first steps.', href: '#/pack' },
    ],
  },
  {
    version: '0.30.1',
    date: '2026-10-08',
    points: [
      { text: 'A quick double tap counts once; Undo after "Whole bag packed" opens the bag again.', href: '#/pack?day' },
      { text: 'Rename a trip by tapping its name.', href: '#/pack' },
      { text: 'Kilometres can be typed with an apostrophe or a point between the thousands.', href: '#/bikes' },
      { text: 'Templates read like "Standard + Rain + 3 single items".', href: '#/pack/templates' },
    ],
  },
  {
    version: '0.30.0',
    date: '2026-10-08',
    points: [
      { text: '"Plan a trip" opens one window: when, how long, weather, the Standard card and building blocks as chips.', href: '#/pack' },
      { text: 'Standard plus rain gear in four taps.', href: '#/pack' },
      { text: '"Good to know" shows up to three important cards, then tips "Did you know?".', href: '#/' },
      { text: 'A new page: what the app can do.', href: '#/features' },
    ],
  },
  {
    version: '0.29.2',
    date: '2026-10-08',
    points: [
      { text: 'A new trip starts with the standard set; templates sit folded under "Start from a template".', href: '#/pack' },
      { text: '"Day ride" packs the standard set plus the weather on the bike of your last trip.', href: '#/' },
      { text: 'A green card shows the new trip: name, bike, date, number of items and where to find it, with Change and Undo.' },
    ],
  },
  {
    version: '0.29.1',
    date: '2026-10-08',
    points: [
      { text: 'Packing is reliable: a quick second tap no longer takes the item out again.', href: '#/pack?day' },
      { text: 'A bag moves on only when it is really full.', href: '#/pack?day' },
    ],
  },
  {
    version: '0.29.0',
    date: '2026-10-08',
    points: [
      { text: 'Plan, Pack, On the way and Debrief share one dark band with tabs and an orange button to the next step.', href: '#/pack' },
      { text: 'Plan shows weather changes with a reason and Undo on each line.', href: '#/pack' },
      { text: 'On the way starts with "Now", notes in one tap.', href: '#/ride' },
      { text: 'The debrief comes filled in: one tap when all went as planned.', href: '#/debrief' },
    ],
  },
  {
    version: '0.28.0',
    date: '2026-10-08',
    points: [
      { text: 'Template suggestions are questions with their source, such as "unused on 3 of 3 trips".', href: '#/pack/templates' },
      { text: '"Not now" rests until three more debriefs; a history shows earlier decisions.', href: '#/pack/templates' },
      { text: 'Rain and cold items only count on trips with that weather.' },
      { text: 'First aid is its own building block and comes along only with a night out.', href: '#/blocks' },
    ],
  },
  {
    version: '0.27.0',
    date: '2026-10-08',
    points: [
      { text: 'Each packing line names its reason, such as "Below 6 °C".', href: '#/pack' },
      { text: 'Windows keep the keyboard focus; tap areas on a touch screen are at least 44 px.' },
      { text: 'Before an import you see what will be replaced.', href: '#/', action: 'data' },
      { text: 'Clear messages for broken photos, empty or very large GPX files and long links.' },
    ],
  },
  {
    version: '0.26.1',
    date: '2026-10-08',
    points: [
      { text: '"Your data" opens by itself only once.', href: '#/', action: 'data' },
      { text: 'A building block for the light at night.', href: '#/blocks' },
    ],
  },
  {
    version: '0.26.0',
    date: '2026-10-08',
    points: [
      { text: 'A new page Building blocks: make your own and rename them.', href: '#/blocks' },
      { text: 'In Gear, "Select" puts many items at once into a building block, a trip or a template, with Undo.', href: '#/gear' },
      { text: 'Templates ask "update or new" and remember days, night and bike.', href: '#/pack/templates' },
      { text: 'Notes on the way belong to the trip and the day.', href: '#/ride' },
    ],
  },
  {
    version: '0.25.1',
    date: '2026-10-08',
    points: [
      { text: '"Day ride" on Today makes the trip at once, with name, date and weather filled in.', href: '#/' },
      { text: 'The Trips and Bikes tiles have four buttons plus "More", such as entering km or a workshop visit.', href: '#/' },
      { text: '"Good to know" shows only cards with content, urgent ones first.', href: '#/' },
      { text: '"Today" is right between midnight and 2 am too.' },
    ],
  },
  {
    version: '0.25.0',
    date: '2026-10-07',
    points: [
      { text: 'A new trip asks for days, riding hours, night, weather and event, with a preview of what goes on the list.', href: '#/pack' },
      { text: 'Later changes apply at once with Undo; amounts you set by hand stay.', href: '#/pack' },
      { text: 'Short rides without an event show no bike care before the start.' },
    ],
  },
  {
    version: '0.24.1',
    date: '2026-10-07',
    points: [
      { text: 'Packing lines show only name, count and weight; a tap opens the rest.', href: '#/pack' },
      { text: 'Debrief right from Today: "All good" with Undo.', href: '#/' },
      { text: 'Select many items in Gear to change the category, move them to the wishlist or delete them.', href: '#/gear' },
      { text: 'A day ride from "New" to debrief: 8 clicks instead of 65.' },
    ],
  },
  {
    version: '0.24.0',
    date: '2026-10-07',
    points: [
      { text: '"All in, next" for each bag and "Everything packed" on the packing day.', href: '#/pack?day' },
      { text: '"All as planned" in the debrief and "All / none" for weather suggestions.', href: '#/debrief' },
      { text: 'Make a new item straight from the search.', href: '#/gear' },
      { text: 'One-day trips start without the overnight basics.' },
    ],
  },
  {
    version: '0.23.1',
    date: '2026-10-07',
    points: [
      { text: 'The language is in the profile menu.' },
      { text: 'Today folds on the phone; the category of an item can be changed on the phone too.', href: '#/' },
    ],
  },
  {
    version: '0.23.0',
    date: '2026-10-07',
    points: [
      { text: 'One navigation on every page: Today, Trips, Gear, Bikes; on the phone at the bottom with + in the middle.', href: '#/' },
      { text: 'Today shows the next trip with exactly one main action.', href: '#/' },
      { text: 'Gear starts with search, filter and list; a new item needs only name, category and status.', href: '#/gear' },
      { text: 'The category of an item can be changed; all its links stay.', href: '#/gear' },
    ],
  },
  {
    version: '0.22.1',
    date: '2026-10-07',
    points: [
      { text: 'Overdue is said in words, such as "for 3 weeks".' },
      { text: 'The event preparation shows only on trips marked "Event".', href: '#/pack' },
      { text: 'Gear fits a 390 px phone screen again.' },
    ],
  },
  {
    version: '0.22.0',
    date: '2026-10-07',
    points: [
      { text: 'Calmer type and colours; only the current main action is orange, with a visible focus ring.' },
      { text: 'Honest weights: sums say "known" and how many weights are missing.', href: '#/pack' },
      { text: 'A star before every item marks a favourite in one tap.', href: '#/gear' },
      { text: 'Today, Pack and Bike care show the same readiness.' },
    ],
  },
  {
    version: '0.21.0',
    date: '2026-10-07',
    points: [
      { text: 'Today lists what is still missing so the app can calculate for you, such as weighing bikes or loading a GPX.', href: '#/' },
      { text: 'Bikes and bike care on one page, with the tabs Setup and Care.', href: '#/bikes' },
      { text: 'Kinds of travel besides bikepacking: ski touring, weekend and long journeys, each with its own bags.', href: '#/pack' },
      { text: 'A page with all your favourite things, by kind of travel and ready to print.', href: '#/favorites' },
    ],
  },
  {
    version: '0.20.2',
    date: '2026-10-05',
    points: [
      { text: 'A big orange button takes you to the next step of the trip: packing day, on the way, debrief.', href: '#/pack' },
    ],
  },
  {
    version: '0.20.1',
    date: '2026-10-05',
    points: [
      { text: 'A whole trip plays through: new list, pack, on the way, end the trip, debrief.', href: '#/pack' },
      { text: '"End trip and debrief" ends the trip at once, not only the next day.', href: '#/ride' },
    ],
  },
  {
    version: '0.20.0',
    date: '2026-10-05',
    points: [
      { text: 'German and English: you choose the language for each device.' },
      { text: 'Buttons, dates and numbers switch with the language; what you wrote yourself stays as it is.' },
    ],
  },
  {
    version: '0.19.6',
    date: '2026-10-05',
    points: [
      { text: 'A new start page: the next trip in a dark band with a countdown, below it trips, gear and bikes.' },
      { text: 'Search across everything and a "New" button on every page.' },
      { text: '"Good to know": weather and sun times, a learning, your pace and the backup.', href: '#/' },
    ],
  },
  {
    version: '0.19.5',
    date: '2026-10-05',
    points: [
      { text: 'The ballast card: what came along but was not needed the last times, with "Leave at home" and "Keep".', href: '#/pack' },
      { text: 'Short marks at an item, such as "3× not used" or "Missed last time".', href: '#/pack' },
      { text: 'On the way goes block by block: what to put on and take off, what to eat and drink, when you need light.', href: '#/ride' },
    ],
  },
  {
    version: '0.19.4',
    date: '2026-10-05',
    points: [
      { text: 'Load your favourites from a file: every favourite gets a star.', href: '#/', action: 'data' },
      { text: 'Gear has a "Favourites" button; favourites come first when you add items.', href: '#/gear' },
    ],
  },
  {
    version: '0.19.3',
    date: '2026-10-05',
    points: [
      { text: 'Workshop order: everything due before the next trip as one order, to send as a message or print.', href: '#/care' },
      { text: 'A profile for each bike: km, workshop costs this year and what is due next.', href: '#/bikes' },
      { text: 'Compare your bikes side by side for a trip and switch with one tap.', href: '#/pack' },
      { text: 'A quick note from any page, with an optional photo; sort the notes later in the Inbox.', href: '#/inbox' },
    ],
  },
  {
    version: '0.19.2',
    date: '2026-10-05',
    points: [
      { text: 'Your trips compared: luggage per trip, used and not used, with a trend.', href: '#/debrief/compare' },
      { text: 'Gear shows what you never used: taken along, never needed.', href: '#/gear' },
      { text: 'The wishlist with a reason, sorted by benefit.', href: '#/gear' },
      { text: 'Mark a trip "Not riding": it stays, but no longer counts as the next trip.', href: '#/pack' },
    ],
  },
  {
    version: '0.19.0',
    date: '2026-10-05',
    points: [
      { text: 'Load GPX rides and the app works out your pace, with climbing and breaks.', href: '#/debrief/pace' },
      { text: 'Pack and On the way estimate riding time and arrival with your pace.', href: '#/ride' },
      { text: 'After three debriefs, templates suggest what can go and what should come along.', href: '#/pack/templates' },
    ],
  },
  {
    version: '0.18.2',
    date: '2026-10-05',
    points: [
      { text: 'One list "Before the trip" with the same count on Today, Pack and Bike care.', href: '#/pack' },
      { text: 'Overdue comes first and in red.' },
    ],
  },
  {
    version: '0.18.1',
    date: '2026-10-05',
    points: [
      { text: 'The packing day warns when the forecast is colder or wetter than what you packed.', href: '#/pack?day' },
      { text: 'In the debrief, "missed" suggests similar items from your gear.', href: '#/debrief' },
      { text: 'The packing day fits the phone without sideways scrolling.' },
    ],
  },
  {
    version: '0.18.0',
    date: '2026-10-05',
    points: [
      { text: 'On the way: all bags, the stage with km, climbing, riding time and an elevation profile.', href: '#/ride' },
      { text: 'Hour by hour weather at the start and at the finish, still visible offline.', href: '#/ride' },
      { text: 'From 14 days before a trip you see what the workshop still has to do.', href: '#/care' },
      { text: 'A demo file starts a demo mode; "End demo" resets everything.', href: '#/', action: 'data' },
    ],
  },
  {
    version: '0.17.1',
    date: '2026-10-04',
    points: [
      { text: 'A workshop visit without prices says "cost unknown" instead of CHF 0.', href: '#/care' },
      { text: 'The cost per 1000 km counts only once there is enough data.' },
    ],
  },
  {
    version: '0.17.0',
    date: '2026-10-04',
    points: [
      { text: 'Workshop visits for each bike: amount, work done, photos of the receipts and km.', href: '#/care' },
      { text: 'Coming up: services such as the yearly fork service and sealant every three months.', href: '#/care' },
      { text: 'Costs per year and per 1000 km.', href: '#/care' },
      { text: 'A photo gallery for each bike.', href: '#/bikes' },
    ],
  },
  {
    version: '0.16.0',
    date: '2026-10-04',
    points: [
      { text: 'A logbook of your past trips.', href: '#/debrief' },
      { text: 'Import rides from Strava or Garmin as a file; the km add up.', href: '#/debrief' },
      { text: 'Share a read-only link to the packing list, or save it as a PDF.', href: '#/pack' },
    ],
  },
  {
    version: '0.15.0',
    date: '2026-10-04',
    points: [
      { text: 'Load a GPX route: distance, climbing and estimated riding hours.', href: '#/pack' },
      { text: 'A weather forecast for each day of the trip; one click packs for it.', href: '#/pack' },
      { text: 'The last forecast stays visible offline.' },
      { text: 'A photo of your bike behind the bags.', href: '#/bikes' },
    ],
  },
  {
    version: '0.14.0',
    date: '2026-10-04',
    points: [
      { text: 'Packing day: full screen, bag by bag, in large type; the screen stays on.', href: '#/pack?day' },
      { text: 'Learnings show as a small hint at the matching item.', href: '#/pack' },
      { text: 'The debrief asks for the km and adds them to the bike.', href: '#/debrief' },
      { text: 'A reminder when the last backup is older than 14 days.', href: '#/', action: 'data' },
    ],
  },
  {
    version: '0.13.0',
    date: '2026-10-04',
    points: [
      { text: 'The debrief in three steps: how it was, go through the items, a summary with suggestions.' },
      { text: 'All learnings in one place, with a search.', href: '#/debrief/learnings' },
      { text: 'The start page shows the next trip with a countdown and what is still open.' },
    ],
  },
  {
    version: '0.12.0',
    date: '2026-10-04',
    points: [
      { text: 'Bags show their contents right on the bike.' },
      { text: 'Move items between bags, with Undo.' },
      { text: 'Calmer colours and a calmer header.' },
    ],
  },
  {
    version: '0.11.0',
    date: '2026-10-04',
    points: [
      { text: 'Weights in one line; the weather folds away.' },
      { text: 'Drag items between bags; short names in the drawing.' },
      { text: 'Edit templates directly.', href: '#/pack/templates' },
    ],
  },
  {
    version: '0.10.0',
    date: '2026-10-04',
    points: [
      { text: 'Templates: save a packing setup, update it and start new trips from it.', href: '#/pack/templates' },
      { text: 'A page with all your templates.', href: '#/pack/templates' },
    ],
  },
  {
    version: '0.9.1',
    date: '2026-10-04',
    points: [
      { text: 'Smaller + buttons and only one category open at a time.' },
      { text: 'The kind of ride as buttons that show what they add.' },
    ],
  },
  {
    version: '0.9.0',
    date: '2026-10-04',
    points: [
      { text: 'The ready check is one short list, with "Tick all checks" and "Save as my standard".', href: '#/pack?day' },
      { text: 'Items can be marked "On every trip".' },
    ],
  },
  {
    version: '0.8.0',
    date: '2026-10-04',
    points: [
      { text: 'A new Pack layout in three columns; the items not packed yet are folded by category.' },
      { text: 'Add with + or by dragging onto a bag; bag tiles with a fill bar.' },
      { text: 'On the phone a fixed bar shows which bag you are adding to.' },
    ],
  },
  {
    version: '0.7.1',
    date: '2026-10-04',
    points: [
      { text: 'Tyre pressure and sealant for each bike.', href: '#/care' },
      { text: 'A list of what was done when.', href: '#/care' },
      { text: 'The wear limit of the brake rotors for each bike.' },
    ],
  },
  {
    version: '0.7.0',
    date: '2026-10-04',
    points: [
      { text: 'Bike care: the parts of each bike with their history.', href: '#/care' },
      { text: 'Reminders by distance, such as a check every 1000 km or chain wax every 150 km.', href: '#/care' },
      { text: 'Preparation tasks for each trip.', href: '#/pack' },
    ],
  },
  {
    version: '0.6.0',
    date: '2026-10-04',
    points: [
      { text: 'Weather with a clothing suggestion, for cold and rain too.' },
      { text: 'A warning when a bag is too full, with a suggestion for another bag.' },
      { text: 'Weigh and print right from Pack; the load on the front and rear wheel.' },
      { text: 'An inventory check of your gear.', href: '#/gear' },
    ],
  },
  {
    version: '0.5.0',
    date: '2026-10-04',
    points: [
      { text: 'Bikes: your own bag list, bike setups with a drawing, bike and rider weight.', href: '#/bikes' },
      { text: 'Pack: pick a trip or start a new one, choose a bag on the drawing and add items.', href: '#/pack' },
      { text: 'Tick items off bag by bag, with a ready check and the system weight.', href: '#/pack?day' },
    ],
  },
  {
    version: '0.4.0',
    date: '2026-10-04',
    points: [
      { text: 'Gear categories fold open and shut.' },
      { text: 'The gear weight leaves out food and water; brand and model are separate.', href: '#/gear' },
      { text: 'Weighing starts with the items for every trip.' },
    ],
  },
  {
    version: '0.3.0',
    date: '2026-10-04',
    points: [
      { text: 'The Gear page: key figures, weight by category, the heaviest items, search and filter.', href: '#/gear' },
      { text: 'Add, edit and delete items; the wishlist kept apart.', href: '#/gear' },
      { text: 'Weigh mode: one item after the other, type the grams, save and next.', href: '#/gear' },
    ],
  },
  {
    version: '0.2.0',
    date: '2026-10-04',
    points: [
      { text: 'Your data stays on your device, in a local database.' },
      { text: '"Your data": export and import a backup, replace or merge.', href: '#/', action: 'data' },
      { text: 'An automatic backup into a folder on the computer.' },
      { text: 'Your packing spreadsheet can be converted for the app.' },
    ],
  },
  {
    version: '0.1.0',
    date: '2026-10-04',
    points: [
      { text: 'The app starts: install it on your phone and use it offline.' },
      { text: 'Open it in the browser, on any device.' },
    ],
  },
];

/** How many versions show open; the older ones fold away. */
export const SHOWN = 3;
/** localStorage: the newest version seen on Today. */
export const SEEN_KEY = 'whatsnew.seen';
/** The version before this list existed: a device with data but no mark comes from there. */
export const BEFORE = '0.34.0';

/** -1, 0 or 1 for two versions like "0.35.0" (missing parts count as 0). */
export function compareVersions(a = '0', b = '0') {
  const pa = String(a).split('.').map((x) => Number(x) || 0);
  const pb = String(b).split('.').map((x) => Number(x) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d < 0 ? -1 : 1;
  }
  return 0;
}

/** The entries to show open (the newest SHOWN) and the older ones (folded). */
export function splitNews(list = WHATS_NEW, shown = SHOWN) {
  return { recent: list.slice(0, shown), older: list.slice(shown) };
}

/** "0.35.0" → "0.35", "0.30.2" stays. */
export const shortVersion = (v) => String(v).replace(/\.0$/, '');

/**
 * The folded versions in calm groups by version range (0.30 to 0.39, 0.20 to 0.29, ...; 0.1 to
 * 0.9 the first), newest first: { key, from, to, entries } with from/to like "0.20" and "0.29".
 */
export function groupOlder(older = splitNews().older) {
  const groups = [];
  for (const e of older) {
    const [major = 0, minor = 0] = String(e.version).split('.').map((x) => Number(x) || 0);
    const key = `${major}.${Math.floor(minor / 10)}`;
    let g = groups.at(-1);
    if (!g || g.key !== key) groups.push((g = { key, entries: [] }));
    g.entries.push(e);
  }
  const minorOf = (e) => e.version.split('.').slice(0, 2).join('.');
  return groups.map(({ key, entries }) => ({ key, from: minorOf(entries.at(-1)), to: minorOf(entries[0]), entries }));
}

/**
 * Today's hint "New since your last visit": { show, mark }. seen: the stored version (null: none);
 * hasData: the device has trips, items or bikes (then it is an update from before this list, not a
 * first install). show: say it once now; mark: the version to store (null: nothing to store).
 * A first install (no mark, no data) shows nothing and stores the current version.
 */
export function newsHint(seen, hasData, current = WHATS_NEW[0].version) {
  const from = seen ?? (hasData ? BEFORE : null);
  if (from == null) return { show: false, mark: current };
  if (compareVersions(from, current) >= 0) return { show: false, mark: seen === current ? null : current };
  return { show: true, mark: current };
}

/** The entries newer than a version (what changed since the last visit). */
export const newerThan = (version, list = WHATS_NEW) => list.filter((e) => compareVersions(e.version, version) > 0);

/**
 * «Anleitungen überall» (Noah 19.10.2026 «verfasse für alle sinnvollen orte anl…» + «ja», tone: «lustig,
 * bikepacking oder ultracing kontext bezogen»): a short guide on top of every page where you could get
 * lost and that had none. The same «Einstieg» as the places (lib/intro/AreaIntro.svelte): three steps,
 * what to expect, a tip of the day. Every guide starts as one line («So nutzt du …»), opens with a tap,
 * folds again and × hides it (Me › Handbook brings it back). Nothing here is needed to use a page.
 * GUIDE_INTROS joins INTROS (intro.js), GUIDE_TIPS joins PAGES (pageinfo.js). English keys for t(),
 * German in i18n/de/anleitungen.js. Tested in tests/anleitungen.test.js.
 */

/** The pages (a key = the place of <AreaIntro place="…" />). */
export const GUIDE_INTROS = {
  planweek: {
    page: true,
    folded: true,
    name: "Plan the week|guide",
    title: "Four steps, then the week has a plan",
    things: [
      { icon: "calendar", title: "Fixed first|guide", text: "Dates and holidays come first. Everything else fits around them, like bivy spots around the climbs." },
      { icon: "goal", title: "Training and to-dos|guide", text: "The app suggests days. Take a suggestion, move it to another day or leave it out." },
      { icon: "wrench", title: "Bike service|guide", text: "Last step: what the bike needs this week. Every step can be skipped." },
    ],
    expect: "About ten minutes. Afterwards the week shows everything, and Today shows what is on today.",
  },
  away: {
    page: true,
    folded: true,
    name: "Holidays|guide",
    title: "Enter the holidays once, the week follows",
    things: [
      { icon: "calendar", title: "Enter the days|guide", text: "From and to, and what kind of time away it is. That is all you have to type." },
      { icon: "check", title: "Choose the follow-ups|guide", text: "Pause the training, service the bike before, prepare the packing list: each one is a switch." },
      { icon: "sun", title: "Enjoy|guide", text: "The holidays show as a bar in the week. The app stays quiet about training on those days." },
    ],
    expect: "Before you leave the bike gets its service and the list is ready. After you come back the plan starts again by itself.",
  },
  blockcheck: {
    page: true,
    folded: true,
    name: "Check building blocks|guide",
    title: "One block after the other, like a gear check before the start",
    things: [
      { icon: "blocks", title: "One block|guide", text: "You see its items with weight and the total of the block." },
      { icon: "check", title: "Keep, out or elsewhere|guide", text: "Decide per item. Elsewhere moves it to another block." },
      { icon: "back", title: "Undo|guide", text: "Every step can be undone, the last one first. Nothing is lost." },
    ],
    expect: "After the check your blocks are lighter and every trip gets the cleaned list.",
  },
  lists: {
    page: true,
    folded: true,
    name: "Lists and types|guide",
    title: "The words of the app, your way",
    things: [
      { icon: "list", title: "Choose a list|guide", text: "Categories, groups of the bike, care parts, note topics: each is its own list." },
      { icon: "copy", title: "Rename, add, sort|guide", text: "Tap the pen to rename. Arrows or drag change the order. The eye hides an entry." },
      { icon: "back", title: "Back to standard|guide", text: "Gone too far? «Reset to standard» brings the list back as it came." },
    ],
    expect: "Your words show everywhere in the app: in Gear, on the bike and in the notes.",
  },
  timer: {
    page: true,
    folded: true,
    name: "Timer|guide",
    title: "Five clocks for every situation",
    things: [
      { icon: "timer", title: "Choose the kind|guide", text: "Stopwatch, countdown, interval, Pomodoro or until a time." },
      { icon: "check", title: "Type the time|guide", text: "Words work too: «7 min», «1h 20m» or «until 17:30»." },
      { icon: "list", title: "Log|guide", text: "Every run lands in the log, with its start and end." },
    ],
    expect: "The clocks you use often move up under «Recently used».",
  },
  routine: {
    page: true,
    folded: true,
    name: "What does me good|guide",
    title: "Your small list of good habits",
    things: [
      { icon: "star", title: "Add|guide", text: "Take a suggestion with one tap, or write your own." },
      { icon: "calendar", title: "Days and time|guide", text: "Every item can have its days and a time, for example «stretch, Mon and Thu»." },
      { icon: "check", title: "Tick off on Today|guide", text: "The list shows on Today. One tap ticks it, a second tap takes it back." },
    ],
    expect: "After a few weeks you see what really became a habit, and what can go.",
  },
  dreams: {
    page: true,
    folded: true,
    name: "Dreams|guide",
    title: "From «one day» to a date",
    things: [
      { icon: "star", title: "Write it down|guide", text: "One line is enough: «Over the Furka and Grimsel» or «a 1000 km race»." },
      { icon: "calendar", title: "The right months|guide", text: "The year band suggests when each dream fits. You can change the months." },
      { icon: "map", title: "Plan the tour|guide", text: "One tap makes a trip draft from the dream, with its list." },
    ],
    expect: "Races keep their registration deadline here until you tick «Signed up». No more «Oh, closed yesterday».",
  },
  compass: {
    page: true,
    folded: true,
    name: "My compass|guide",
    title: "Goals in small steps, ideas in boxes",
    things: [
      { icon: "goal", title: "A goal with a day|guide", text: "Type the goal and when you want to reach it. You write the steps, the app spreads the dates." },
      { icon: "check", title: "How is it going?|guide", text: "Once a week the app asks. One tap answers." },
      { icon: "blocks", title: "Boxes|guide", text: "Resolutions, dreams, ideas: each box is a list in your own order." },
    ],
    expect: "A big goal becomes a row of small ones. Each ticked step is a small summit.",
  },
  supplies: {
    page: true,
    folded: true,
    name: "Supplies|guide",
    title: "What runs out or expires, before it does",
    things: [
      { icon: "calendar", title: "Best before|guide", text: "Enter the date: 2 weeks before, a reminder comes." },
      { icon: "scale", title: "Count the stock|guide", text: "How many you have and how many you want. Below the minimum it goes on the shopping list." },
      { icon: "cart", title: "Bought|guide", text: "One tap on «Bought» fills the stock again." },
    ],
    expect: "No more expired gel at kilometre 300. The list «Buy again» is ready before the shop.",
  },
  lend: {
    page: true,
    folded: true,
    name: "Lent out|guide",
    title: "Lend gear and get it back",
    things: [
      { icon: "list", title: "New list|guide", text: "Who borrows it, which things and until when. Two weeks unless you choose another day." },
      { icon: "copy", title: "Send|guide", text: "As a link or a PDF. The link carries only the names of the things." },
      { icon: "check", title: "Back|guide", text: "Tick what came back. Until then each thing shows here." },
    ],
    expect: "On the return day a reminder comes, if you switch it on. Your bivy bag finds its way home.",
  },
  toolbox: {
    page: true,
    folded: true,
    name: "Toolbox|guide",
    title: "Small helpers that fit in any bag",
    things: [
      { icon: "star", title: "Fits right now|guide", text: "On top up to three tools that fit the trip now." },
      { icon: "list", title: "Search|guide", text: "Type «PDF», «currency» or «QR» and the tool comes up." },
      { icon: "check", title: "Your order|guide", text: "Put the tools you need most on top, with arrows or drag." },
    ],
    expect: "Everything runs on the device, also without network on a pass.",
  },
  connections: {
    page: true,
    folded: true,
    name: "Connections|guide",
    title: "Where data comes in by itself",
    things: [
      { icon: "list", title: "All connections|guide", text: "Strava, Google, Fitbit and more: each with its state and when data last came in." },
      { icon: "check", title: "Switch on or off|guide", text: "Each connection has its switches, for example whether Strava ticks off Active." },
      { icon: "bike", title: "Sports to activities|guide", text: "Choose which Strava sport goes to which activity, and indoor rides to which bike." },
    ],
    expect: "Once connected, rides and dates come by themselves. You only ride.",
  },
  docs: {
    page: true,
    folded: true,
    name: "Documents|guide",
    title: "ID, insurance and tickets, at hand on the way",
    things: [
      { icon: "copy", title: "Add a document|guide", text: "Choose a file or photograph the paper. It goes into a group." },
      { icon: "calendar", title: "Valid until|guide", text: "With a date the app reminds you six months before it runs out." },
      { icon: "pack", title: "For the next trip|guide", text: "Mark papers for the packing list. They get ticked per trip." },
    ],
    expect: "Before the trip the app asks «ID and cash with you?», and the document opens with one tap.",
  },
  docscan: {
    page: true,
    folded: true,
    name: "Photograph document|guide",
    title: "From a crumpled paper to a clean PDF",
    things: [
      { icon: "copy", title: "Photograph|guide", text: "Page by page with the camera, or several photos from the gallery." },
      { icon: "check", title: "Check the edges|guide", text: "The app finds the paper by itself. Move the corners by hand if it missed one." },
      { icon: "list", title: "Save|guide", text: "One PDF of all pages, one PDF each, or keep the photos." },
    ],
    expect: "The PDF lands in Documents and is at hand on the way.",
  },
  merken: {
    page: true,
    folded: true,
    name: "Remember|guide",
    title: "Your to-dos first, the rest smaller",
    things: [
      { icon: "check", title: "Add a to-do|guide", text: "With or without a date. A repeating to-do moves on by itself." },
      { icon: "star", title: "Birthdays and plants|guide", text: "Own groups under the to-dos, the next one first." },
      { icon: "calendar", title: "What the app knows|guide", text: "Below, smaller: dates from trips, care and documents. Each source can be switched off." },
    ],
    expect: "A tick has «Undo». Done to-dos move to «Done», like finished stages.",
  },
  reminders: {
    page: true,
    folded: true,
    name: "Reminders|guide",
    title: "Everything the app reminds you of, in one place",
    things: [
      { icon: "list", title: "By area|guide", text: "Active, Trips, Bike and your own: each reminder with its switch." },
      { icon: "check", title: "Change|guide", text: "Tap a reminder to change when it comes." },
      { icon: "calendar", title: "Where it shows|guide", text: "Always in Calendar › Remember, and on the phone if you switch it on." },
    ],
    expect: "The app asks «Shall I remind you?» at the right moment. «Never ask» is fine too.",
  },
  mountain: {
    page: true,
    folded: true,
    name: "Mountain and emergency|guide",
    title: "Before the mountain: know where help is",
    things: [
      { icon: "heart", title: "Emergency|guide", text: "Your position big on the screen, with Rega 1414 and 112 one tap away.", href: "#/mountain/sos" },
      { icon: "copy", title: "Emergency QR|guide", text: "Your emergency card as a lock-screen image. Fill it in at home, not on the ridge.", href: "#/mountain/qr" },
      { icon: "map", title: "Map and scales|guide", text: "Slopes over 30°, ski routes, signpost colours and the SAC scales.", href: "#/mountain/scales" },
    ],
    expect: "You hope never to need it. That is exactly why it is ready.",
  },
  alerts: {
    page: true,
    folded: true,
    name: "Alerts and news|guide",
    title: "What concerns you on the way",
    things: [
      { icon: "sun", title: "For you|guide", text: "Weather warnings for your region, avalanche danger in winter and your passes." },
      { icon: "list", title: "News|guide", text: "The newest from your sources about velo and mountains." },
      { icon: "copy", title: "Your sources|guide", text: "Add, rename, change or delete a source." },
    ],
    expect: "Important warnings also show as one line on Today. Offline the last answer stays, with its time.",
  },
  checks: {
    page: true,
    folded: true,
    name: "Checks per trip type|guide",
    title: "The evening before and after the trip, per type",
    things: [
      { icon: "list", title: "Choose the type|guide", text: "Bikepacking, day ride, ski tour: each type has its own two lists." },
      { icon: "check", title: "Adjust|guide", text: "Add, rename, sort or remove rows. New trips start with your version." },
      { icon: "back", title: "Learn from debriefs|guide", text: "What was missing on earlier trips is suggested as a new row." },
    ],
    expect: "After a few trips you see how often each row was really ticked. Rows nobody ticks can go.",
  },
  equipment: {
    page: true,
    folded: true,
    name: "Equipment|guide",
    title: "Your main gear per sport, with its counter",
    things: [
      { icon: "star", title: "Add equipment|guide", text: "Pick an item from Gear, for example the running shoes or the tent." },
      { icon: "check", title: "Log a use|guide", text: "Each use adds to its counter: km, nights or hours." },
      { icon: "wrench", title: "Care|guide", text: "What is due shows on top, with «Done»." },
    ],
    expect: "You see when the tent needs new seam sealer, before the first rain night tells you.",
  },
  // Paket 2/3 pages: their branches add the one line <AreaIntro place="…" /> (handover in the PR)
  chronik: {
    page: true,
    folded: true,
    name: "Chronicle|guide",
    title: "Everything on one time line",
    things: [
      { icon: "calendar", title: "One page per month|guide", text: "Arrows or the jump bar take you to any month with entries." },
      { icon: "list", title: "Filter|guide", text: "Trips, rides, care, meditation or notes. Or only one bike." },
      { icon: "back", title: "Back then|guide", text: "On top: what you did at this time in earlier years." },
    ],
    expect: "Over the years this becomes your logbook. Only reading, nothing changes here.",
  },
  neuland: {
    page: true,
    folded: true,
    name: "New ground|guide",
    title: "What you reached for the first time",
    things: [
      { icon: "map", title: "Choose a collection|guide", text: "Cantons, passes, lakes and more: each with its count and a map." },
      { icon: "check", title: "Tick and untick|guide", text: "The app finds it on your routes. Your tick always wins." },
      { icon: "star", title: "Own collections|guide", text: "Add, rename, sort or switch off collections." },
    ],
    expect: "The canton bingo fills itself as you ride. Some cantons are suspiciously far away.",
  },
  quiz: {
    page: true,
    folded: true,
    name: "Quiz the evening before|guide",
    title: "Three questions, then the bag is in your head",
    things: [
      { icon: "check", title: "Answer|guide", text: "Three questions about the gear and the route of your next trip." },
      { icon: "star", title: "Streak|guide", text: "Each quiz before a trip adds to your streak." },
      { icon: "list", title: "Own questions|guide", text: "Add, change, sort or switch off questions." },
    ],
    expect: "The evening before a trip a small card on «Packed» leads here. Better a wrong answer tonight than no tube tomorrow.",
  },
  spur: {
    page: true,
    folded: true,
    name: "Travel track|guide",
    title: "One tour as a journey",
    things: [
      { icon: "map", title: "The map|guide", text: "The line of every day, with places, notes and photos." },
      { icon: "calendar", title: "Day by day|guide", text: "The timeline shows each day and where its line comes from." },
      { icon: "copy", title: "Share and book|guide", text: "A read link for the family and the travel book as PDF." },
    ],
    expect: "The family follows the line without asking «Where are you?» ten times a day.",
  },
  sports: {
    page: true,
    folded: true,
    name: "Sports|guide",
    title: "Every sport with the same blocks",
    things: [
      { icon: "list", title: "Open a sport|guide", text: "Equipment, packing list, history, goals, care and weather: the same for every sport." },
      { icon: "blocks", title: "Adjust blocks|guide", text: "Switch off, rename, move or add blocks per sport." },
      { icon: "chart", title: "Mosaic|guide", text: "All sports and meditation in one picture, with their goals." },
    ],
    expect: "Each sport gets its own page that learns from you, from gravel to tennis.",
  },
  frei: {
    page: true,
    folded: true,
    name: "Free time|guide",
    title: "Ideas for the hours without a plan",
    things: [
      { icon: "star", title: "Choose a page|guide", text: "Impulses, ideas and more: each page opens on its first visit." },
      { icon: "sun", title: "Impulses|guide", text: "Small ideas that fit the day. Also as a tab in Active." },
      { icon: "check", title: "Take or leave|guide", text: "Everything is a suggestion. «Not today» is a fine answer." },
    ],
    expect: "A free afternoon gets an idea, without becoming a programme.",
  },
};

/** The tips of each guide (pageinfo PAGES shape). */
export const GUIDE_TIPS = {
  planweek: {
    tips: [
      { id: "g-pw-sunday", text: "Sunday evening, a cup of tea, ten minutes: that is the whole planning. No race director needed." },
      { id: "g-pw-skip", text: "A step that does not fit this week? Skip it. A plan is a suggestion, not a time limit at the checkpoint." },
      { id: "g-pw-rest", text: "Plan a rest day on purpose. Even ultra riders sleep, at least a little." },
    ],
    can: [],
  },
  away: {
    tips: [
      { id: "g-aw-early", text: "Enter holidays early: a bike service a week before is calmer than a chain that breaks on day one." },
      { id: "g-aw-bikepacking", text: "A bikepacking week is time away too. The training plan may take a break while you ride." },
      { id: "g-aw-switch", text: "Every follow-up is a switch. Switch off what you do not need, nothing is a must." },
    ],
    can: [],
  },
  blockcheck: {
    tips: [
      { id: "g-bc-grams", text: "The third spare tube weighs about 100 g. Over 1000 km that is a lot of thinking about it." },
      { id: "g-bc-missing", text: "At the bottom the app shows what probably belongs in the block but is missing. One tap adds it." },
      { id: "g-bc-season", text: "Check your blocks once after the season, when you still remember what you never used." },
    ],
    can: [],
  },
  lists: {
    tips: [
      { id: "g-ls-own", text: "Call your bags what you call them on the road. «Snack bag» is allowed." },
      { id: "g-ls-delete", text: "Deleting a group never deletes its things: the app asks where they go." },
      { id: "g-ls-hide", text: "Hide what you never use instead of deleting it. The eye brings it back." },
    ],
    can: [],
  },
  timer: {
    tips: [
      { id: "g-tm-nap", text: "A 20-minute countdown is the classic power nap of ultra racers. On the sofa it works too." },
      { id: "g-tm-interval", text: "Intervals: 4 × 4 minutes hard, 3 minutes easy. The clock counts, you only suffer." },
      { id: "g-tm-big", text: "«Big» shows the clock across the whole screen, readable from the bike trainer." },
    ],
    can: [],
  },
  routine: {
    tips: [
      { id: "g-rt-three", text: "Three items are a habit, twelve are a second job. Start small." },
      { id: "g-rt-sort", text: "Drag or use the arrows: what comes first on your list comes first on Today." },
      { id: "g-rt-link", text: "Link an item to an activity in Active: then it ticks itself when you log the sport." },
    ],
    can: [],
  },
  dreams: {
    tips: [
      { id: "g-dr-month", text: "Tap a month in the year band: you see only the dreams that fit then." },
      { id: "g-dr-race", text: "A race in your Google calendar with «Race» in the title shows up here by itself." },
      { id: "g-dr-small", text: "Dreams may be small too: «coffee on the Pragel at sunrise» counts." },
    ],
    can: [],
  },
  compass: {
    tips: [
      { id: "g-cp-steps", text: "«Ride a 1000 km race» is a goal. «Ride 200 km in one day in May» is a step." },
      { id: "g-cp-idea", text: "An idea can become a goal with one tap, when it is ready." },
      { id: "g-cp-ai", text: "The AI suggestions for steps can be switched off at the bottom of the page." },
    ],
    can: [],
  },
  supplies: {
    tips: [
      { id: "g-sp-gel", text: "Gels from 2019 still taste like 2019. Better enter the date." },
      { id: "g-sp-cells", text: "Change expiry, stock and minimum right in the table cells, no window needed." },
      { id: "g-sp-gas", text: "Gas cartridges, first aid, tube patches: they count as supplies too, once they have a date." },
    ],
    can: [],
  },
  lend: {
    tips: [
      { id: "g-ld-photo", text: "Lend the sleeping bag dry and note it. A sleeping bag that comes back wet is a story for the debrief." },
      { id: "g-ld-device", text: "The list stays on your device. Nothing leaves it unless you send the link or the PDF." },
      { id: "g-ld-before", text: "Lending before your own trip? The return day is best a few days before you leave." },
    ],
    can: [],
  },
  toolbox: {
    tips: [
      { id: "g-tb-gear", text: "The gear ratio calculator answers the eternal question: will I make it up there with 40 × 50?" },
      { id: "g-tb-costs", text: "Trip costs splits the bill of a group tour. No more napkin maths at the hut." },
      { id: "g-tb-chain", text: "Tool chains run several tools after each other, for example photos to PDF." },
    ],
    can: [],
  },
  connections: {
    tips: [
      { id: "g-cn-suggest", text: "Not sure? Choose «suggest first»: the app asks before it ticks something off." },
      { id: "g-cn-stays", text: "Your logins stay when the app gets an update. No reconnecting after every release." },
      { id: "g-cn-off", text: "Everything here is optional. The app works without any connection too." },
    ],
    can: [],
  },
  docs: {
    tips: [
      { id: "g-dc-passport", text: "A passport that expires in the middle of the trip is a plot twist nobody needs. Enter the date." },
      { id: "g-dc-offline", text: "Documents stay on the device, so they open without network too." },
      { id: "g-dc-scan", text: "«Photograph document» makes a clean PDF from a photo of the paper.", button: "Photograph document", href: "#/me/docs/scan" },
    ],
    can: [],
  },
  docscan: {
    tips: [
      { id: "g-ds-light", text: "Daylight and a dark table make the sharpest scan. The hut table works too." },
      { id: "g-ds-bw", text: "Black and white is the start. For a receipt with colour stamps choose gray or colour." },
      { id: "g-ds-share", text: "On the phone you can share photos from the gallery straight into the app." },
    ],
    can: [],
  },
  merken: {
    tips: [
      { id: "g-mk-plant", text: "Plants get a «Watered» button. The cactus thanks you, quietly." },
      { id: "g-mk-race", text: "«Register for the race» is a to-do with a date. Better than a deadline in your head." },
      { id: "g-mk-reminders", text: "Reminders show here and only here, not on Today." },
    ],
    can: [],
  },
  reminders: {
    tips: [
      { id: "g-rm-chain", text: "A reminder to check the chain is cheaper than a new cassette. And quieter." },
      { id: "g-rm-reset", text: "Said «Never ask» too quickly? «Reset» brings the question back." },
      { id: "g-rm-phone", text: "For messages on the phone, switch on «Reminders on the phone».", button: "Reminders on the phone|guide", href: "#/me/push" },
    ],
    can: [],
  },
  mountain: {
    tips: [
      { id: "g-mt-battery", text: "A full battery is part of the emergency kit. A power bank weighs less than worry." },
      { id: "g-mt-qr", text: "Make the emergency QR before the season, so it is on the lock screen when you need it.", button: "Emergency QR|guide", href: "#/mountain/qr" },
      { id: "g-mt-rega", kind: 'know', text: "In Switzerland the air rescue Rega is reached on 1414.", source: "Rega" },
    ],
    can: [],
  },
  alerts: {
    tips: [
      { id: "g-al-pass", text: "Before a pass tour check whether it is open. A closed pass makes a long day longer." },
      { id: "g-al-refresh", text: "«Refresh» loads the newest. Otherwise the app looks by itself when it opens." },
      { id: "g-al-few", text: "Three good sources beat twenty loud ones. Delete what you never read." },
    ],
    can: [],
  },
  checks: {
    tips: [
      { id: "g-ck-lights", text: "«Lights charged?» belongs on every evening-before list. Ask any rider who arrived after dark." },
      { id: "g-ck-after", text: "After the trip: wash the bottles today. Tomorrow they have their own ecosystem." },
      { id: "g-ck-race", text: "A race has its own type: checkpoints, tracker, start number." },
    ],
    can: [],
  },
  equipment: {
    tips: [
      { id: "g-eq-shoes", text: "Running shoes last about 600 to 800 km. The counter knows when yours are done." },
      { id: "g-eq-bikes", text: "Bikes have their own place with their care. A chip on top leads there." },
      { id: "g-eq-filter", text: "Tap a sport on top to see only its equipment." },
    ],
    can: [],
  },
  // Paket 2/3 pages
  chronik: {
    tips: [
      { id: "g-ch-bike", text: "Filter by one bike and see its whole life: rides, service, the new tyre." },
      { id: "g-ch-winter", text: "A grey November? Look at last July. Motivation included." },
      { id: "g-ch-remember", text: "The chosen filter is remembered on this device." },
    ],
    can: [],
  },
  neuland: {
    tips: [
      { id: "g-nl-year", text: "«This year» or «all years»: both are good for bragging." },
      { id: "g-nl-plan", text: "A canton still missing? That is a dream tour waiting to be written down.", button: "Dreams|guide", href: "#/trips/dreams" },
      { id: "g-nl-search", text: "Search the list: a pass name is faster than scrolling." },
    ],
    can: [],
  },
  quiz: {
    tips: [
      { id: "g-qz-own", text: "Own question idea: «Where is the spare chain link?»" },
      { id: "g-qz-route", text: "Route questions help on long races: where is the last shop before the night?" },
      { id: "g-qz-off", text: "Not in the mood? The quiz can be switched off completely." },
    ],
    can: [],
  },
  spur: {
    tips: [
      { id: "g-sp-photos", text: "Photos stay on this device. The read link shows only what you share." },
      { id: "g-sp-gap", text: "A gap in the line is no drama: maybe the phone slept, maybe you did." },
      { id: "g-sp-book", text: "The travel book as PDF is a fine souvenir, also for a two-day loop." },
    ],
    can: [],
  },
  sports: {
    tips: [
      { id: "g-so-colour", text: "Each sport has its colour. Gravel brown is not a mistake." },
      { id: "g-so-order", text: "Put your main sport on top, with arrows or drag." },
      { id: "g-so-next", text: "«For next time» keeps what you want to do better on the next outing." },
    ],
    can: [],
  },
  frei: {
    tips: [
      { id: "g-fz-rest", text: "Free time after a long race may also mean: sofa. That counts." },
      { id: "g-fz-rain", text: "Rain? The impulses know indoor ideas too." },
      { id: "g-fz-own", text: "Add your own ideas, then the list gets more yours every week." },
    ],
    can: [],
  },
};

/** Pages that come with Paket 2/3: their guide is ready here, the page adds the line on its branch. */
export const GUIDE_LATER = ["spur"]; // the travel track page needs a trip with a track; the guide follows with U

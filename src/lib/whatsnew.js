/**
 * v0.35.0 (Noah, from now on every release): "New in the last updates" at the top of "What the app
 * can do" (#/features), and once after an update a quiet line on Today. Each release adds an entry
 * at the top: version, date, 1-4 points in plain words (English keys for t(), German in
 * i18n/de/whatsnew.js), each with the address of the exact place ("Try it"), or no address when
 * the place no longer exists (older versions). The list goes back to the first version (0.1.0).
 * v0.110.0 (I11): an entry may also have title, lead (one sentence) and test (the steps «How to test it»).
 * action 'data': the place is "Data and backup" (under Me since v0.94.0, nav.js openData) instead of an address.
 * v0.118.0 «Was ist neu 2» (mockups W1–W3, Noah 13.10.2026 «w1-w3 freigeben», answers 1a 2a 3a 4a 5a):
 * every version has its own title (relaxed, with a wink, at most one emoji), one sentence (lead), 1–3
 * main points (each with the place it leads to) and the small things in boxes: small: [{ box, text,
 * href? }] with box one of BOXES (New, Nicer, Fixed, Faster). All versions were rewritten once in this
 * style; versions, dates, addresses and test steps stayed.
 * Pure, tested in tests/whatsnew.test.js.
 */

export const WHATS_NEW = [
  {
    // v0.134.0 «Listen und Typen» (mockups LI1–LI4, Noah «LI1–LI4 freigegeben» 14.10.2026, «a»: categories first) on top of the «Standard-Paket»
    version: '0.134.0',
    date: '2026-10-14',
    title: 'Lists your way',
    lead: 'The categories of your gear are yours now: rename, add your own, hide, delete and change the order.',
    points: [
      { text: 'Me › Lists and types › Categories: arrows change the order, the pen opens a category (name, symbol, hide, delete).', href: '#/me/lists?categories' },
      { text: 'In Gear › Sort and filter, «Edit list» opens the categories right away.', href: '#/gear' },
    ],
    small: [{ box: 'nicer', text: 'Your changes stay apart from the Standard: «Back to Standard» brings everything back' }],
    test: [
      'Me › Lists and types › Categories: rename one category with the pen and save; in Gear the new name shows.',
      'Add an own category, then open «+ Item» in Gear: it is in the category choice.',
      'Back in Categories, tap «Back to Standard»: everything is as before.',
    ],
  },
  {
    // v0.133.0 «Design-Refresh» (bundle A): HG1 greeting, «Wi gaht's?» AB1–AB6 with the takeover of the daily check
    // (WG, fixed rounds 07:00/20:30), komoot SN1b–SN1d, SN4g, SN5 plus, SN6 plus, FE1/FE13/FE14/FE16
    version: '0.133.0',
    date: '2026-10-14',
    title: 'A greeting and your questions',
    lead: 'Today greets you by name, «Wi gaht\'s?» asks your questions in a morning and an evening round, and many pages are calmer.',
    points: [
      { text: '«Wi gaht\'s?»: 50 playful questions, 31 of them on, each with its own rhythm, asked at 07:00 and 20:30', href: '#/me/abfragen' },
      { text: 'Today greets you in Swiss German by the time of day; a tap tells how you are and what you are up to', href: '#/me/look' },
      { text: 'History and analysis: all your values in one place, with your normal range', href: '#/me/history' },
    ],
    small: [
      { box: 'new', text: 'Tour from komoot: suggestions near you, a shared tour becomes a planned trip', href: '#/trips' },
      { box: 'nicer', text: 'Functions, Trips, Favourites and the import check in a calmer look', href: '#/features' },
      { box: 'nicer', text: 'Tiles show «Open ›», every activity a ••• button, a short intro shows Today once; on the phone the main buttons sit at the bottom' },
    ],
    test: [
      'Open Today: the greeting stands on top; tap «Wie gaht\'s? / Was häsch vor?», choose and save.',
      'Open Me › «Wi gaht\'s?»: switch a question on, change its rhythm, add an own question, look at «Fixed rounds».',
      'From 07:00 the card on Today asks the morning questions; the tile «Morning round» shows sleep, energy and mood.',
      'Open Me › Data › History and Analysis: the answers stand there, old daily checks too.',
      'In «New tour» tap «Tour from komoot»: komoot opens with suggestions near you.',
      'On the phone open Trips and Material: the main button sits at the bottom.',
      'Open Today: the short intro shows three steps; tap «Skip». Tap ••• on an activity: duration, place and stopwatch open.',
    ],
  },
  {
    // v0.132.0 «Tagespaket» (PR #151, first numbered 0.125.0 + 0.126.0; 0.125.0 never went live, so its content ships here):
    // Tages-Check 1+2, Aktiv ausweiten AK1–AK3 (#150), Feinschliff A-J1, TZ-1, A-U1/A-U2/A-U5 (#152), Werte überall WU1–WU4 + SV1 (#153),
    // Velo-Setup UC3 (#155), Kluge Suche (#154), App-Wartung BF4/BF7/BF8, Bedienung FE2/6/7/8/9/10/11/17/18, Bezahlen BZ1/BZ2b (#156),
    // Kleine Apps + Handbuch (#157)
    version: '0.132.0',
    date: '2026-10-14',
    title: 'Lots of new things at once',
    lead: 'A bigger update in one go: a daily check, a week in Aktiv, your bike setup, a smarter search and small apps.',
    points: [
      { text: 'Daily check: a morning check and, from 20:30, a short evening review; your balance of nine areas in one ring on Today', href: '#/me/abfragen' },
      { text: 'Aktiv: a week with fixed dates and suggestions, a page for recovery and a short packing list for each sport', href: '#/flow/week' },
      { text: 'Setup per bike: photos, total weight, a bag plan and a log of what you changed', href: '#/bikes?tab=rig' },
    ],
    small: [
      { box: 'new', text: 'A search that finds similar words and small typos, and small apps for meditation, packing list and bike care with their own icon' },
      { box: 'new', text: 'Every trip shows its state, a year goal for km, metres climbed and minutes, a workshop visit saved on the bike', href: '#/trips' },
      { box: 'nicer', text: 'A backup before every update, high contrast outdoors, speaking instead of typing and an error never shows a white page', href: '#/me/data' },
    ],
    test: [
      'On Today tap «Start» in the check row: the morning check opens. Answer a few questions, tap «Done».',
      'On Today: «Your balance» shows the ring; tap «Your 15 questions» and switch a question off: the check no longer asks it.',
      'Open Aktiv › Heute and tap the card «Week».',
      'Open «Sport bag», tick a thing, then «All in».',
      'Open Aktiv › Goals: on the right «Year goals» with three rows; switch one off and tap a goal number to change it.',
      'Open Touren: under the title «n planned · n completed · n rated», then the chips. Tap «Completed»: only those trips show.',
      'Tap + (New) › Workshop visit: the km and the last workshop stand on a green field with «from …».',
      'Open Velos › Setup: photos, total weight, bag plan, log, comparison, races and ideas from others.',
      'Tap «Whole bag plan»: tap «Move» on a hint, the item is in the other bag of that packing list.',
      'Search «regenjacke» or «materal»: similar words and the corrected word are found; «backup» offers Data and backup on top, Enter opens it.',
      'On the phone open …/apps/meditation/ and add it to the home screen: it starts on Meditation, «Whole app» leads back.',
      'Open Me › Data and backup › «Before updates», and Me › «App maintenance».',
      'Open Me › Appearance › Handling: switch on «High contrast (outdoors)», choose where the app opens.',
      'Open Me › Payments: it explains what is prepared; nothing is locked and no money moves.',
    ],
  },
  {
    // v0.131.3 «Kamera-Knopf» (mockups K1–K4, Noah 14.10.2026 «K1–K4 freigegeben»)
    version: '0.131.3',
    date: '2026-10-14',
    title: 'Receipt photo in one tap',
    lead: 'On the phone the camera for a receipt opens with one tap, wherever a receipt is added.',
    points: [
      { text: 'Bikes › Workshop › Log a workshop visit: «Photograph the receipt» opens the camera', href: '#/bikes?tab=shop' },
      { text: 'Inbox › File as … Receipt: a note without a photo gets its receipt photo here', href: '#/inbox' },
    ],
    small: [
      { box: 'new', text: 'New › Workshop visit: the note shows «Photograph the receipt» too' },
      { box: 'nicer', text: '«Gallery» next to it still takes a photo from the phone; the computer keeps «Choose photo»' },
    ],
    test: [
      'On the phone, open Bikes › Workshop › «Log a workshop visit» and tap «Photograph the receipt»: the camera opens.',
      'Take the photo: it shows small in the window; save the visit.',
      'Write a note «Workshop receipt: …» without a photo, then Inbox › File › Receipt: «Photograph the receipt» is there.',
    ],
  },
  {
    // v0.131.2 «Velo-Reihenfolge» (Noah 13.10.2026 «1a», thread «Velo-Standard»; fix of the order 0.131.0 wrote)
    version: '0.131.2',
    date: '2026-10-14',
    title: 'Bikes back in line',
    lead: 'The bike tabs follow the order you chose again.',
    points: [
      { text: 'Bike tabs in your order, your main bike first.', href: '#/bikes' },
    ],
    small: [
      { box: 'fixed', text: 'The tidy-up of the last update had brought back the old order' },
    ],
    test: [
      'Open Velos: the tabs start with your main bike, in the order you chose.',
      'Open Velos › Pflege: the bikes come in the same order.',
    ],
  },
  {
    // v0.131.1 «Abhaken wieder abwählbar» (bug fix, Noah 14.10.2026; same look, so no mockup)
    version: '0.131.1',
    date: '2026-10-14',
    title: 'Ticked is ticked once',
    lead: 'A quick double tap no longer ticks an activity twice, so a tap takes it back again.',
    points: [
      { text: 'A ticked activity can be unticked again with one tap; «Undo» brings it back', href: '#/flow' },
    ],
    small: [
      { box: 'fixed', text: 'A quick double tap ticks only once; double ticks from before go away with the next untick' },
      { box: 'fixed', text: 'A ticked commute on «In the flow» can be tapped to take it back' },
    ],
    test: [
      'On Today tap an activity in «In the flow»: it is ticked. Tap it again: it is unticked.',
      'Tick it, then tap «Undo» in the message below: the tick is gone again.',
      'Tap an activity twice quickly: it is ticked once, one more tap unticks it.',
      'Tap «Commute», then tap the line «… today: commute»: the commute is taken back.',
    ],
  },
  {
    // v0.131.0 «Daten einmal bereinigen» (Noah 14.10.2026 «1a», «2-5a»; nothing new on screen, so no mockups)
    version: '0.131.0',
    date: '2026-10-14',
    title: 'Tidied up once',
    lead: 'Behind the scenes the app tidied up: old copies in your data moved into their new place, nothing got lost.',
    points: [
      { text: 'The weight checks from the Excel are a note now: Notes › «Weight checks from the Excel».', href: '#/notes' },
      { text: 'Old kits, old block marks and «On every trip» live in your building blocks; the old copies are gone.', href: '#/blocks' },
    ],
    small: [
      { box: 'nicer', text: 'Before tidying up, the app keeps a full copy of your data on this device' },
      { box: 'nicer', text: 'The order of your bikes and their extra names are part of your data now', href: '#/bikes' },
    ],
    test: [
      'Download a backup first: Ich › Daten › Backup.',
      'Open Notes: the note «Weight checks from the Excel» lists the weights from the Excel.',
      'Open Material and Bausteine: everything is in the same blocks as before; a new trip packs the same list.',
    ],
  },
  {
    // v0.124.0 «Neue Tour Teil 2» (mockups B4/B5, Noah 12.10.2026 «b2 b4 b5 ok»; B5 default a ★)
    version: '0.124.0',
    date: '2026-10-13',
    title: 'Blocks you can tap',
    lead: 'In Packen every building block is a big button now, and Repair travels light with at most 8 parts.',
    points: [
      { text: 'Building blocks as big buttons at the top of Packen: green with a check is on the trip, white with + can be added.', href: '#/pack?day' },
      { text: 'Repair on the way: the app suggests at most 8 light parts, the rest stays in the workshop and in your gear.', href: '#/pack?day' },
      { text: 'A slim Repair comes with every new trip as a suggestion; one tap takes it off.', href: '#/trips' },
    ],
    small: [
      { box: 'new', text: 'Hover or hold a block: it shows what is inside', href: '#/pack?day' },
      { box: 'nicer', text: 'The template buttons of a new trip use the same option buttons', href: '#/trips' },
    ],
    test: [
      'Open a bike trip and go to Packen: at the top «Building blocks · n on · m to choose».',
      'Tap a white block with +: it turns green with a check and its items are on the list. Tap it again: they go.',
      'With a Repair of more than 8 parts tap its dashed button: choose the parts and tap «Take 8 parts».',
    ],
  },
  {
    // v0.123.0 «Trophäen-Vitrine» (mockups TV1–TV2, Noah 13.10.2026 «tv1-tv2 freigeben»)
    version: '0.123.0',
    date: '2026-10-13',
    title: 'All your stars in one showcase',
    lead: 'Every star you reached, by area and year, on one page. Reached ones stay.',
    points: [
      { text: 'Trophy showcase: all stars by area and year', href: '#/flow/trophies' },
      { text: 'Trophy shelf: «See all trophies» opens it', href: '#/flow/milestones' },
    ],
    small: [{ box: 'new', text: 'Next within reach: the three closest stars', href: '#/flow/trophies' }],
    test: [
      'Open Aktiv › Aktivität › Milestones and tap «See all trophies» under the trophy shelf.',
      'Tap a year: only the stars of that year stay.',
    ],
  },
  {
    // v0.122.0 «Bugfix Dateneingabe» D1–D4 (Noah 13.10.2026 «D1–D4 freigegeben», answers «1a 2a 3b 4b 5a», D1a ★)
    version: '0.122.0',
    date: '2026-10-13',
    title: 'Values in one go',
    lead: 'Bike values go in right where you are: on the sheet or on one page, field after field.',
    points: [
      { text: 'The Pick-up check shows each value as a card: tap it, type, and «Next» opens the next one. − and + help, and «As before» keeps the old value.', href: '#/bikes' },
      { text: 'New page «Enter values» under Equipment: all values of a bike in four groups, every entry saves at once.', href: '#/bikes?tab=compare' },
      { text: '«Choose fields» hides fields you never need, for all bikes; «Own field» adds a value with name and unit.', href: '#/bikes?tab=compare' },
    ],
    test: [
      'Open a bike › Workshop › Pick-up check: tap a value, type a number and press Enter: the card is ticked and the next one opens.',
      'Go to Equipment › «Enter values»: type a value and press Enter, the next field gets the cursor.',
      'Tap «Choose fields», switch a field off: it is gone here, the Bike pass still shows it.',
    ],
  },
  {
    // v0.121.0 «Strava-Fahrten zählen mit» (mockups SZ1–SZ2, Noah 13.10.2026 «sz1-sz2 freigeben»)
    version: '0.121.0',
    date: '2026-10-13',
    title: 'Strava rides count along',
    lead: 'Your Strava rides now count in «This week» and «Bike this month», each ride once.',
    points: [
      // «Try it» takes the first point; '#/' does nothing when you are on Today already, so Aktiv comes first
      { text: 'Aktiv: «Bike this month» from your rides and Strava', href: '#/flow' },
      { text: 'Today: «This week» and «Bike this month» count your Strava rides', href: '#/' },
    ],
    small: [
      { box: 'nicer', text: 'A ride in «To check» counts after «Fits»', href: '#/bikes' },
    ],
    test: [
      'Connect Strava and ride once: on Today «This week» shows the day as active.',
      'Open Aktiv: «Bike this month» adds the Strava kilometres.',
    ],
  },
  {
    // v0.119.0 «Schnellstart» (mockups Q1–Q3, Noah 13.10.2026 00:05 «Q1–Q3 freigegeben»)
    version: '0.119.0',
    date: '2026-10-13',
    title: 'Trip in one click',
    lead: 'One click on Today plans a ride for today, and you stay on Today.',
    points: [
      { text: 'Quick start replaces the day ride: today, 2.5 hours, the bike you rode last, the standard items and the weather of the forecast.', href: '#/' },
      { text: 'The trip is called by the time you made it, like 202610130000; a green card has «Open» and «Undo».', href: '#/' },
      { text: 'A trip name field marks its whole name when you tap into it, so typing writes over it.', href: '#/trips' },
    ],
    test: [
      'On Today tap «Quick start»: you stay on Today, the green card says «Trip planned» with the time as the name.',
      'Tap «Undo»: the trip is gone again.',
      'Open a trip and tap its name: the whole name is marked; type a new one.',
    ],
  },
  {
    // v0.118.0 «Was ist neu 2» (mockups W1–W3) and «KI-Helfer ausblenden» (mockups K1–K4)
    version: '0.118.0',
    date: '2026-10-13',
    title: 'What is new, retold',
    lead: 'After an update every news item sits open and each line takes you there. And the AI helper takes a break until you call it.',
    points: [
      { text: 'Every version with its own title, one sentence and its main points', href: '#/me/news' },
      { text: 'Small things sorted into New, Nicer, Fixed and Faster', href: '#/me/news' },
      { text: 'AI helper off by default: one switch under Me brings it back everywhere', href: '#/helper' },
    ],
    small: [
      { box: 'nicer', text: 'All versions open, grouped by month', href: '#/me/news' },
    ],
    test: [
      'Open Me › What is new: every version is open, grouped by month.',
      'Tap a line of a version: its place opens.',
      'Open Me › AI helper: the switch is off. Switch it on: the six places say «on».',
    ],
  },
  {
    // v0.117.0 «Knöpfe neu» (mockups N1–N4, Noah 12.10.2026 «n1-n4 freigeben»)
    version: '0.117.0',
    date: '2026-10-13',
    title: 'Buttons that explain themselves',
    lead: 'Not sure what a button does? Point at it on the computer or hold it on the phone, and it tells you.',
    points: [
      { text: 'Bike care: one main button per row, the rest behind «…»', href: '#/bikes?tab=care' },
      { text: 'After «Done» one line says what was saved, with «Undo»', href: '#/bikes?tab=care' },
      { text: 'Button labels with at most two words, the long text on hover', href: '#/gear' },
    ],
    small: [
      { box: 'nicer', text: 'On the phone the buttons of a row sit under its text, card-wide', href: '#/inbox' },
    ],
    test: [
      'Open Bike care and point at «Done» (computer) or hold it (phone): the explanation shows, nothing is saved.',
      'Tap «…» in a row: every action with one line; on the phone the list opens from the bottom.',
      'Tap «Done»: the line at the bottom says what was saved; tap «Undo».',
    ],
  },
  {
    // 0.116.2 «Bugfix Dateneingabe» (Noah 13.10.2026): «enter» on a sheet jumped to other pages.
    version: '0.116.2',
    date: '2026-10-13',
    title: 'Enter bike values where you are',
    lead: '«Enter» on a sheet of the bike folder opens exactly that value, and saving brings you back to the sheet.',
    points: [
      { text: 'Fixed: «enter» on the Bike pass, the Pick-up check and the other sheets led to the top of another page. Now it opens just that value of this bike for typing, Save or Cancel brings you back to the sheet.', href: '#/bikes' },
      { text: '«Change values» on the Bike pass and the Pick-up check opens the bike\'s Equipment, where the measurements and parts are.', href: '#/bikes?tab=compare' },
    ],
    test: [
      'Open Bike › More › Folder › Pick-up check and tap «enter» next to Saddle height.',
      'Type a number and tap Save: you are back on the Pick-up check and the value is there.',
    ],
  },
  {
    // 0.116.1 (UI-Prüfung A1): an old debrief without its item list opened an empty page.
    version: '0.116.1',
    date: '2026-10-13',
    title: 'Old trips open again',
    lead: 'The debrief of an older trip opened an empty page; now it opens like any other.',
    points: [
      { text: 'Fixed: the debrief of an older trip (from an old backup or the Excel import) opened an empty page. It opens again, every item counted as used.', href: '#/pack/past' },
    ],
    test: [
      'Open Trips › Look back › Past trips and tap an older trip.',
      'The debrief opens with its numbers and «Not used».',
    ],
  },
  {
    // v0.116.0 «Strava-Verbindung» (E3, mockups S1–S5 approved by Noah 12.10.2026 13:39, heart rate P1–P6 22:07 UTC)
    version: '0.116.0',
    date: '2026-10-12',
    title: 'Strava, come on in 🚴',
    lead: 'Connect once, and your rides arrive with their bike, so every kilometre lands on the right one.',
    points: [
      { text: 'Connect Strava once: all old rides come, none counted twice', href: '#/bikes?tab=care&view=strava' },
      { text: 'New rides come by themselves, or with «Fetch now»', href: '#/bikes?tab=care&view=strava' },
      { text: 'Another bike in Strava? Today asks «Take over» or «Keep»', href: '#/' },
    ],
    small: [
      { box: 'new', text: 'Heart rate per ride, Ø and max, only to look at', href: '#/flow' },
      { box: 'new', text: 'A ride without a bike waits in «To check» with a suggestion', href: '#/bikes?tab=care&view=strava' },
    ],
    test: [
      'Open Bike › Care › Strava and tap «Connect with Strava».',
      'Log in to Strava and allow it: the app shows how many rides it found.',
      'Tap «Done», then «Fetch now»: the tile «Strava» on Today shows the result.',
      'Open the ride log of a bike: a ride with a heart rate monitor shows «Ø … · max … bpm».',
    ],
  },
  {
    // v0.115.0 Menü-Fix (Noah 12.10.2026): a ••• menu closes with one tap outside it.
    version: '0.115.0',
    date: '2026-10-12',
    title: 'Menus that take a hint',
    lead: 'A tap next to an open ••• menu closes it. No more hunting for the same ••• twice.',
    points: [
      { text: 'Bike care: the ••• of a problem closes with one tap beside it', href: '#/bikes?tab=care' },
      { text: 'Same for the packing list and the trips in progress', href: '#/pack' },
    ],
    test: [
      'Open Bikes › Care and tap ••• at a problem.',
      'Tap anywhere next to the menu: it closes at once.',
      'Tap ••• and pick an answer: it still works.',
    ],
  },
  {
    // v0.111.0 Bausteine bearbeiten: Vorabend- und Schluss-Check (mockups V1–V6)
    // v0.114.0 «Rahmenbedingungen» (Noah 12.10.2026, mockups B1–B3 approved).
    version: '0.114.0',
    date: '2026-10-12',
    title: 'A new trip, nicely framed',
    lead: 'Sport, weather from your postcode and the event: the new trip asks the right things and sorts the list into groups.',
    points: [
      { text: '«Conditions»: sport, weather from the start postcode, the event', href: '#/trips' },
      { text: 'Templates as buttons: Standard, yours and two examples', href: '#/trips' },
      { text: 'The packing list in four groups, with a picture per item', href: '#/trips' },
    ],
    small: [
      { box: 'nicer', text: 'Repair and Charging only come when you switch them on', href: '#/pack' },
    ],
    test: [
      'Open Trips and tap «New trip».',
      'Type your postcode under Weather: the forecast suggests the weather.',
      'Open «Choose a template» and tap «Weekend»: 2 days and Hotel/hut are set.',
    ],
  },
  {
    // v0.111.0 Bausteine bearbeiten: evening-before and after-trip check (mockups V1–V6)
    version: '0.111.0',
    date: '2026-10-12',
    title: 'Tick off at night, head out in the morning',
    lead: 'Bulletin read, skins packed, alarm set? The evening-before check asks, so you can sleep easy.',
    points: [
      { text: 'Evening-before check on «Packed», each trip type with its own list', href: '#/trips' },
      { text: 'After-trip check: dry the skins before they get musty', href: '#/trips' },
    ],
    small: [
      { box: 'new', text: '«Adjust the list»: your own points or ideas from earlier debriefs', href: '#/trips' },
      { box: 'nicer', text: 'Checks per trip type now live under Me', href: '#/me/checks' },
    ],
    test: [
      'Open a packed trip: tap «Evening-before check» under «Until the start» and tick a point.',
      'Tap «Adjust the list», add your own point and save it for all trips of the type.',
      'End a trip: tap the after-trip check under «Before you unpack».',
      'Open Me › Checks per trip type and choose another type.',
    ],
  },
  {
    // v0.110.0 Design-Refresh P10 (I11): the newest version also has a name, one sentence and the
    // steps «How to test it» (the card on top of Ich › Was ist neu); older versions do without.
    version: '0.110.0',
    date: '2026-10-12',
    title: 'What is new? Well, exactly this.',
    lead: 'Every function one by one, sorted the way you like. Your top 10 counts quietly, only on this device.',
    points: [
      { text: 'All functions with a search and six sorts', href: '#/me/news?all&sort=top' },
      { text: 'The tile «New» waves at you on Today for 14 days', href: '#/' },
    ],
    small: [
      { box: 'nicer', text: '«Do not show again» holds until the next update', href: '#/me/news' },
      { box: 'new', text: '«Your top 10» counts what you open, never in the playground', href: '#/me/news' },
    ],
    test: [
      'Open Me › What is new and tap «Your top 10».',
      'Tap «Go» at a function: its place opens.',
      'Go back: the function now counts once more.',
    ],
  },
  {
    version: '0.109.0',
    date: '2026-10-12',
    title: 'Debrief, freshly showered 🚿',
    lead: 'Trip over, legs tired, head full: the debrief now sorts it into two columns.',
    points: [
      { text: 'Trip ended and debrief in two columns, items as chips by bag', href: '#/debrief' },
      { text: 'Debrief with number tiles, your 12 months and the comparison', href: '#/debrief' },
    ],
    small: [
      { box: 'nicer', text: 'Learned, pace, logbook, past trips and rides in light cards', href: '#/debrief/logbook' },
    ],
  },
  {
    version: '0.108.0',
    date: '2026-10-12',
    title: 'Me, finally tidied up',
    lead: 'Four groups instead of a jumble box. And when the backup is due, a band on top tells you kindly.',
    points: [
      { text: 'Me in four groups, with a backup band on top', href: '#/me' },
      { text: 'Data and backup with three lights and a QR code for the phone', href: '#/me/data' },
    ],
    small: [
      { box: 'nicer', text: 'Inbox, notes, helper, home place, shortcuts and playground in the light look', href: '#/me' },
    ],
  },
  {
    version: '0.107.0',
    date: '2026-10-12',
    title: 'Active turns the lights on',
    lead: 'Today on top, goals with a path, milestones on a shelf. Plus a suggestion you can take as a challenge. Or not.',
    points: [
      { text: 'Active in light: today on top, goals with a path, milestones on a shelf', href: '#/flow' },
      { text: 'A suggestion for today, as a challenge if you like', href: '#/flow' },
    ],
    small: [
      { box: 'new', text: 'Page «Patterns»: records and what helped', href: '#/flow' },
      { box: 'nicer', text: 'Meditation log with a 13-week calendar', href: '#/flow' },
    ],
  },
  {
    version: '0.106.0',
    date: '2026-10-12',
    title: 'Packing, bag by bag',
    lead: 'Your bags as one tidy list: tap one, and its items unfold right below.',
    points: [
      { text: 'Packing shows your bags as one list, items open below', href: '#/pack' },
      { text: 'On the way: the day in blocks, what to wear, eat and drink now', href: '#/ride' },
    ],
    small: [
      { box: 'nicer', text: 'Swap, charging, still to decide and end the trip as light windows', href: '#/pack' },
    ],
  },
  {
    version: '0.105.0',
    date: '2026-10-12',
    title: 'Bikes, polished up',
    lead: 'The drawing and the bags open right on the page. Bike care says on top what is due.',
    points: [
      { text: 'Bikes in light, drawing and bags open on the page', href: '#/bikes' },
      { text: 'Bike care: what is due on top, each bike its own page', href: '#/bikes?tab=care' },
    ],
    small: [
      { box: 'nicer', text: 'Part, workshop visit, order, import and receipts in light windows', href: '#/bikes?tab=care' },
    ],
  },
  {
    version: '0.104.0',
    date: '2026-10-12',
    title: 'Trips, with a view',
    lead: 'Where you left off sits on top, and planning shows the route on a small map with the height profile.',
    points: [
      { text: 'Trips: continue on top, light tiles with a packing bar', href: '#/trips' },
      { text: 'Route on a small map, height profile and stages', href: '#/pack' },
    ],
    small: [
      { box: 'nicer', text: 'A new trip starts in one light window', href: '#/trips' },
    ],
  },
  {
    version: '0.103.0',
    date: '2026-10-12',
    title: 'Gear, list first',
    lead: 'Less chrome, more stuff: the list comes first, the tools in one row.',
    points: [
      { text: 'Gear shows the list first, the views on the right', href: '#/gear' },
      { text: 'An item opens with flat rows, the rare things under «More»', href: '#/gear' },
    ],
    small: [
      { box: 'nicer', text: 'Sort, filter, assign, merge and weigh as light cards', href: '#/gear' },
    ],
  },
  {
    version: '0.102.0',
    date: '2026-10-12',
    title: 'Swim or sauna?',
    lead: 'A new tile asks the important questions of life. And any suggestion can become a challenge.',
    points: [
      { text: 'Tile «Swim or sauna today?» with your own alternatives', href: '#/' },
      { text: 'Any suggestion becomes a challenge that counts by itself', href: '#/' },
    ],
    small: [
      { box: 'new', text: 'A challenge reached is celebrated as a milestone', href: '#/' },
    ],
  },
  {
    version: '0.101.0',
    date: '2026-10-12',
    title: 'Today, calm and bright',
    lead: 'The trip card counts the hours to go, and four new tiles keep you posted.',
    points: [
      { text: 'Trip card with hours to go, open steps and packing status', href: '#/' },
      { text: 'New tiles: This week, Bike this month, Next milestone, A year ago', href: '#/' },
    ],
    small: [
      { box: 'nicer', text: '«New» sorted by area, each way with its own picture', href: '#/' },
      { box: 'nicer', text: 'Search results in light, over the tiles', href: '#/' },
    ],
  },
  {
    version: '0.100.0',
    date: '2026-10-12',
    title: 'Step by step',
    lead: 'A trip now counts its four steps, and the next one always waits in the bar at the bottom.',
    points: [
      { text: 'The four steps of a trip, numbered', href: '#/pack' },
      { text: 'Bar at the bottom: «Step 1 of 4» and the main button', href: '#/pack' },
    ],
    small: [
      { box: 'nicer', text: 'Trip page in light, with «‹ Trips» to go back', href: '#/pack' },
    ],
  },
  {
    version: '0.99.0',
    date: '2026-10-12',
    title: 'Soft corners, confetti included 🎉',
    lead: 'Buttons and fields got rounder, empty pages got friendlier, and a full bag gets a little party.',
    points: [
      { text: 'Everything packed? A short burst of confetti', href: '#/pack' },
      { text: 'Empty pages with a picture and what to do next', href: '#/pack' },
    ],
    small: [
      { box: 'nicer', text: 'Buttons, fields and badges with soft corners and one height', href: '#/' },
      { box: 'nicer', text: '«Undo» notes at the bottom, dark and calm', href: '#/gear' },
    ],
  },
  {
    version: '0.98.0',
    date: '2026-10-12',
    title: 'Light up top, light on the side',
    lead: 'The top bar and the sidebar got a fresh coat of paint, and «New» moved to the top on the phone.',
    points: [
      { text: 'On the phone «New» (+) sits up top next to the search', href: '#/' },
      { text: 'Computer: sidebar with the pages of a place, «Me» at the bottom', href: '#/me' },
    ],
    small: [
      { box: 'nicer', text: 'Top bar and sidebar light and calm', href: '#/' },
    ],
  },
  {
    version: '0.97.0',
    date: '2026-10-12',
    title: 'Sage and Inter move in',
    lead: 'A calm colour world and a clear font for the whole app. Prefer it your way? Me › Appearance.',
    points: [
      { text: 'New look: colour world «Sage» and the font Inter', href: '#/me/look' },
      { text: 'Me › Appearance: 8 fonts, colour world, text size, light or dark', href: '#/me/look' },
    ],
    small: [
      { box: 'nicer', text: 'Dark mode stays, only on this device', href: '#/me/look' },
    ],
  },
  {
    version: '0.96.0',
    date: '2026-10-11',
    title: 'Everything the app can do',
    lead: 'Every function by situation, what you never tried on top, and «Take me there» to its place.',
    points: [
      { text: 'Functions by situation or by page, never used on top', href: '#/features' },
      { text: '«Take me there» and «Try it» in the playground', href: '#/features' },
    ],
    small: [
      { box: 'nicer', text: 'The search finds functions too, for example «warranty»', href: '#/features' },
    ],
  },
  {
    version: '0.95.0',
    date: '2026-10-11',
    title: 'Bikes, short and sweet',
    lead: 'Three rows instead of a long page, and importing rides got a big button.',
    points: [
      { text: 'Overview: care, bags and equipment as three rows', href: '#/bikes' },
      { text: '«Import rides» as a big button on the bike page', href: '#/bikes' },
    ],
    small: [
      { box: 'nicer', text: 'A missing weight or price is a quiet grey hint', href: '#/bikes?tab=compare' },
    ],
  },
  {
    version: '0.94.0',
    date: '2026-10-11',
    title: 'Today, your way',
    lead: 'Today is a wall of tiles: move them, resize them, take them away. And one series counts everything you do.',
    points: [
      { text: 'Customise Today: move, resize or remove tiles', href: '#/' },
      { text: '«+» adds any tile, with a «New» dot for two weeks', href: '#/' },
      { text: 'One series over everything, all milestones on one page', href: '#/flow/milestones' },
    ],
    small: [
      { box: 'nicer', text: '«Data and backup» now lives under Me', href: '#/me', action: 'data' },
    ],
  },
  {
    version: '0.93.0',
    date: '2026-10-11',
    title: 'Sit down, the clock knows the rest 🧘',
    lead: 'A new session in a few taps: minutes, sounds in between, and the clock you like to look at.',
    points: [
      { text: '«New session»: 10 to 60 minutes or any, sounds in between', href: '#/flow/act/meditation' },
      { text: 'Four clocks: ring, hourglass, moon or only the number', href: '#/flow/act/meditation' },
    ],
    small: [
      { box: 'new', text: '«Save as a template?» suggests a name by itself', href: '#/flow/act/meditation' },
    ],
  },
  {
    version: '0.92.0',
    date: '2026-10-11',
    title: 'What stayed in the bag?',
    lead: 'The debrief starts with the honest question, and counts how much lighter you could ride next time.',
    points: [
      { text: 'Debrief: tap what you did not need, see what you save', href: '#/trips' },
    ],
    small: [
      { box: 'nicer', text: '«What was missing?» and «How was it?» as short rows, button «Done»', href: '#/trips' },
    ],
  },
  {
    version: '0.91.0',
    date: '2026-10-11',
    title: 'No ride counted twice',
    lead: 'Old rides whose kilometres are already in your bikes now politely step aside.',
    points: [
      { text: 'Strava export: old rides without a bike are set aside', href: '#/bikes?tab=care' },
    ],
    small: [
      { box: 'fixed', text: 'A bike picked by hand checks its start value too', href: '#/bikes?tab=care' },
    ],
  },
  {
    version: '0.88.0',
    date: '2026-10-11',
    title: 'A playground for trying things',
    lead: 'Play a made-up trip from packing to debrief. When you stop, your data is exactly as before.',
    points: [
      { text: 'Me › «Try it out»: packing day, ride or debrief with a made-up trip', href: '#/me' },
      { text: 'Me › «Clean up test data»: archive, never delete', href: '#/me' },
    ],
    small: [
      { box: 'nicer', text: 'A trip ended early asks first and comes back with «Plan again»', href: '#/trips' },
    ],
  },
  {
    version: '0.86.0',
    date: '2026-10-11',
    title: 'Meditation in two taps',
    lead: 'Tap, sit, done. The meditation page got shorter and the running clock got quieter.',
    points: [
      { text: 'From «Tick off today» straight into a session', href: '#/flow' },
      { text: 'Short page: like last time, a template, this week, the log', href: '#/flow/act/meditation' },
    ],
    small: [
      { box: 'nicer', text: 'After the gong one sentence, the depth and «Done»', href: '#/flow/act/meditation' },
    ],
  },
  {
    version: '0.84.0',
    date: '2026-10-11',
    title: 'After the gong',
    lead: 'A calm look back at each session, and a log that remembers everything without being nosy.',
    points: [
      { text: 'Evaluation after the gong: depth, mood, what helped', href: '#/flow/act/meditation' },
      { text: 'The log with filters, heatmap and month comparison', href: '#/flow/act/meditation/log' },
    ],
    small: [
      { box: 'new', text: 'Start a past session again in one tap', href: '#/flow/act/meditation/log' },
    ],
  },
  {
    version: '0.83.0',
    date: '2026-10-11',
    title: 'Every screw in its place',
    lead: 'The new tab «Equipment» lists your bike like a maker\'s spec sheet, with weight and price.',
    points: [
      { text: 'Tab «Equipment»: every part in groups, with weight and price', href: '#/bikes?tab=compare' },
      { text: 'Your four key measurements as tiles on top', href: '#/bikes?tab=compare' },
    ],
    small: [
      { box: 'nicer', text: '«Compare bikes» only shows rows with a value', href: '#/bikes?tab=compare' },
    ],
  },
  {
    version: '0.81.0',
    date: '2026-10-11',
    title: 'Cushion time',
    lead: 'Meditation gets its own page, with intervals right on the round clock and seven built-in sounds.',
    points: [
      { text: 'Own meditation page: templates, kinds, sounds, places', href: '#/flow/act/meditation' },
      { text: 'Intervals right on the round clock', href: '#/flow/act/meditation' },
    ],
    small: [
      { box: 'new', text: 'Full screen while sitting, counts for your milestones', href: '#/flow/act/meditation' },
    ],
  },
  {
    version: '0.80.0',
    date: '2026-10-11',
    title: 'Behind the scenes',
    lead: 'Nothing to see, but a lot to gain: new versions now reach you faster.',
    points: [
      { text: 'The automatic checks run more steadily' },
    ],
    small: [
      { box: 'faster', text: 'New versions arrive sooner' },
    ],
  },
  {
    version: '0.79.0',
    date: '2026-10-11',
    title: 'Stars for showing up ⭐',
    lead: 'Your six favourite activities as tiles, and milestones that only show the next star.',
    points: [
      { text: 'Tab «Activity»: six favourites with playful names', href: '#/flow/activity' },
      { text: 'Milestones over all activities, a reached star stays', href: '#/flow/milestones' },
    ],
    small: [
      { box: 'new', text: 'More ideas to tick off, hide what you do not want', href: '#/flow/activity' },
    ],
  },
  {
    version: '0.78.0',
    date: '2026-10-10',
    title: 'Every place, its tabs',
    lead: 'Swipe sideways to the next tab, and every place remembers where you were.',
    points: [
      { text: 'Tabs on top of every place, swipe on the phone', href: '#/bikes' },
      { text: 'Trips as tiles with their route, ordered by state', href: '#/trips' },
    ],
    small: [
      { box: 'nicer', text: 'Debrief starts with what is open; Gear has «Shopping»', href: '#/debrief' },
      { box: 'new', text: 'After an update a calm sheet says what is new', href: '#/features?news' },
    ],
  },
  {
    version: '0.77.0',
    date: '2026-10-10',
    title: 'A helper, only when you ask',
    lead: 'Claude suggests packing lists, learnings and bike care. Without the code everything stays as before.',
    points: [
      { text: 'A few words become a packing list suggestion', href: '#/trips' },
      { text: '«Check the list» and a debrief draft from your notes', href: '#/trips' },
      { text: 'Suggestions in «Due now», all just suggestions', href: '#/bikes?tab=care' },
    ],
    small: [
      { box: 'new', text: 'Me › Helper: code only on this device, monthly limit CHF 5', href: '#/helper' },
    ],
  },
  {
    version: '0.76.0',
    date: '2026-10-10',
    title: 'Five places',
    lead: 'Today, Trips, Gear, Bikes and Active: at the bottom on the phone, in a sidebar on the computer.',
    points: [
      { text: 'Five places with their own pages', href: '#/' },
      { text: '«More» is gone, «Me» has language, theme, inbox and your data', href: '#/me' },
    ],
    small: [
      { box: 'nicer', text: '«New» as a round + on the phone, each place with its colour', href: '#/' },
      { box: 'new', text: 'Keyboard shortcuts: g plus a letter, n, / and ?', href: '#/me' },
    ],
  },
  {
    version: '0.75.0',
    date: '2026-10-10',
    title: 'Renaming, the same everywhere',
    lead: 'The pencil opens a small sheet, Enter saves, «Undo» waits 10 seconds. Also for gear on the phone.',
    points: [
      { text: 'Rename everywhere the same way, with «Undo»', href: '#/bikes' },
      { text: 'Importing rides learns which bike a ride type belongs to', href: '#/bikes?tab=care' },
    ],
    small: [
      { box: 'fixed', text: 'The back key keeps what you typed in a window', href: '#/gear' },
      { box: 'nicer', text: 'Gear summary in one line, lighter options under «Weight»', href: '#/gear' },
    ],
  },
  {
    version: '0.73.0',
    date: '2026-10-10',
    title: 'Today, a little quieter',
    lead: 'The greeting fits in one line, the next trip follows right after, and the photo is sharp now.',
    points: [
      { text: 'Greeting in one line, the next trip right after it', href: '#/' },
      { text: 'A sharp photo, on the phone as a slim band', href: '#/' },
    ],
    small: [
      { box: 'nicer', text: '«Suggestion for tomorrow» as a slim row on a trip day', href: '#/' },
    ],
  },
  {
    version: '0.70.0',
    date: '2026-10-10',
    title: 'Four more sheets for your bike',
    lead: 'Break-in plan, repair kit, warranty and a theft sheet: hopefully you only ever need three of them.',
    points: [
      { text: 'New sheets: break-in plan, repair kit, warranty, theft', href: '#/bikes' },
      { text: 'A new bike gets its break-in plan by itself', href: '#/bikes' },
      { text: 'Repair kit that fits the parts of the bike', href: '#/bikes' },
    ],
    small: [
      { box: 'new', text: 'Reminder 30 days before a warranty ends', href: '#/bikes' },
    ],
  },
  {
    version: '0.69.1',
    date: '2026-10-10',
    title: 'Rules for rides',
    lead: 'Tell the app once which bike a ride type belongs to, and it remembers.',
    points: [
      { text: 'Your own rule: a ride type belongs to a bike', href: '#/bikes?tab=care' },
    ],
    small: [
      { box: 'fixed', text: 'Long words no longer break in the middle', href: '#/flow' },
    ],
  },
  {
    version: '0.69.0',
    date: '2026-10-10',
    title: 'A folder per bike',
    lead: 'Bike pass, service plan, workshop order and pick-up check, filled in from your data.',
    points: [
      { text: 'Every bike has a folder with sheets, filled in by the app', href: '#/bikes' },
      { text: 'Share a sheet as a PDF or copy it as text', href: '#/bikes' },
    ],
    small: [
      { box: 'new', text: 'Ticked workshop jobs go straight into bike care', href: '#/bikes?tab=care' },
    ],
  },
  {
    version: '0.68.0',
    date: '2026-10-10',
    title: 'Every kilometre accounted for',
    lead: 'A ride log per bike: its kilometres are simply the sum of its rides.',
    points: [
      { text: 'Ride log per bike, unclear rides marked', href: '#/bikes?tab=care' },
      { text: 'Import a Strava export or Garmin files', href: '#/bikes?tab=care' },
      { text: 'Parts get a start point and count their own km', href: '#/bikes?tab=care' },
    ],
    small: [
      { box: 'new', text: 'Once a week Today compares the km with Strava', href: '#/' },
    ],
  },
  {
    version: '0.67.1',
    date: '2026-10-10',
    title: 'Small fixes, big smile',
    lead: 'Dates read like dates, bike types read like words.',
    points: [
      { text: 'Dates with the weekday, like «Sat, 10 Oct 2026»', href: '#/trips' },
    ],
    small: [
      { box: 'nicer', text: 'Bike types as words: full suspension, hardtail, gravel', href: '#/bikes?tab=care' },
      { box: 'fixed', text: 'Im Flow has its icon in the menu', href: '#/flow' },
    ],
  },
  {
    version: '0.67.0',
    date: '2026-10-10',
    title: 'Always one next step',
    lead: 'After packing, after the trip and after the debrief a calm page says what is done and what comes next.',
    points: [
      { text: 'A calm page between the steps, «Later» always works', href: '#/trips' },
      { text: 'The main button follows the date of the trip', href: '#/pack' },
      { text: '«Continue» on Today opens the step you are in', href: '#/' },
    ],
    small: [
      { box: 'fixed', text: 'Ending a trip early asks first and can be undone', href: '#/ride' },
    ],
  },
  {
    version: '0.66.0',
    date: '2026-10-09',
    title: 'New building blocks',
    lead: 'Bivouac, tent or hut, repair, charging and light: the list knows what a trip needs. Your stuff moved along, nothing got lost.',
    points: [
      { text: 'Blocks for the night, the ride and comfort', href: '#/blocks' },
      { text: 'A trip with nights asks: bivouac, tent or hut', href: '#/pack' },
      { text: 'Check the blocks: keep, out or elsewhere, one by one', href: '#/blocks/check' },
    ],
    small: [
      { box: 'nicer', text: '«Warm» is no block any more, its things come with the weather', href: '#/blocks/check' },
    ],
  },
  {
    version: '0.65.0',
    date: '2026-10-09',
    title: 'Your measurements on top',
    lead: 'Saddle height, tyre pressure, bar width: every bike shows its numbers on top. Tap one to change it.',
    points: [
      { text: 'Measurements on top of every bike', href: '#/bikes' },
      { text: '«Compare bikes» starts with these values', href: '#/bikes' },
    ],
    small: [
      { box: 'nicer', text: 'The tyre check already knows your target pressure', href: '#/bikes?tab=care' },
    ],
  },
  {
    version: '0.63.0',
    date: '2026-10-09',
    title: 'An item, at a glance',
    lead: 'Name, weight and how it comes along. Everything else waits one tap away.',
    points: [
      { text: 'An item opens short, one row opens at a time', href: '#/gear' },
      { text: 'Lighter options from your own gear', href: '#/gear' },
    ],
    small: [
      { box: 'nicer', text: '«Never used» explains its rule when empty', href: '#/gear?view=never' },
    ],
  },
  {
    version: '0.61.0',
    date: '2026-10-09',
    title: 'Your pace, in one sentence',
    lead: 'From 5 rides on the app guesses your riding time by itself. And the logbook becomes a real diary.',
    points: [
      { text: '«Your pace» as one sentence, with three small charts', href: '#/debrief/pace' },
      { text: 'The logbook as a diary of all your trips', href: '#/debrief/logbook' },
    ],
    small: [
      { box: 'new', text: '«Back to the standard rule» in one tap', href: '#/debrief/pace' },
      { box: 'nicer', text: '«Learned» lists everything by topic, nothing folded', href: '#/debrief/learnings' },
    ],
  },
  {
    version: '0.59.0',
    date: '2026-10-09',
    title: 'What are you wearing?',
    lead: '«On me» from head to toe as the first card. One tap swaps an item for one that fits the weather.',
    points: [
      { text: '«On me» as the first card, tap to swap', href: '#/pack' },
      { text: 'Open the wardrobe for this trip and its weather', href: '#/wardrobe' },
    ],
    small: [
      { box: 'nicer', text: 'The app remembers what you chose last time', href: '#/pack' },
    ],
  },
  {
    version: '0.57.0',
    date: '2026-10-09',
    title: 'Bike care with an overview',
    lead: 'One ring per bike, at most three cards for what is due, and all problems in one list.',
    points: [
      { text: 'Overview with a ring per bike and guided part changes', href: '#/bikes?tab=care' },
      { text: 'The same parts list per bike, «Compare bikes» side by side', href: '#/bikes' },
      { text: 'New page Notes: write, dictate, photo, checklist', href: '#/notes' },
    ],
    small: [
      { box: 'nicer', text: 'The inbox is now «Incoming», with «File» and seven places', href: '#/inbox' },
    ],
  },
  {
    version: '0.56.0',
    date: '2026-10-09',
    title: 'One debrief instead of five',
    lead: 'Your last ride, the last 12 months and your trips compared, on one page.',
    points: [
      { text: 'One page: last ride, 12 months, trips compared', href: '#/debrief' },
      { text: '«Past trips» as a table, also on the phone', href: '#/pack/past' },
    ],
    small: [
      { box: 'nicer', text: 'A saved debrief tells how the trip really was', href: '#/pack/past' },
    ],
  },
  {
    version: '0.51.0',
    date: '2026-10-09',
    title: 'In the flow',
    lead: 'Tick off an activity with one tap, three rings over 7 days, and a stopwatch with a singing bowl.',
    points: [
      { text: 'One tap ticks off an activity, with «Undo»', href: '#/flow' },
      { text: 'Three rings: move, mindful, recovery', href: '#/flow' },
      { text: 'Stopwatch with a singing bowl, keeps running on every page', href: '#/flow' },
    ],
    small: [
      { box: 'new', text: 'Daily check: sleep, energy, mood and one more question', href: '#/flow/goals' },
    ],
  },
  {
    version: '0.47.3',
    date: '2026-10-09',
    title: 'The weather listens to you',
    lead: 'Tap «Cool» or «Rain» and it stays, even when the forecast thought otherwise.',
    points: [
      { text: '«Cool» and «Rain» stay chosen when you tap them', href: '#/pack' },
      { text: '«No weather» takes the weather away again', href: '#/pack' },
    ],
    small: [
      { box: 'fixed', text: '••• menus stay fully on the phone screen', href: '#/pack' },
    ],
  },
  {
    version: '0.47.2',
    date: '2026-10-09',
    title: 'Seven ways to look at your gear',
    lead: 'All, most used, proven, favourites, never used, unweighed and the wishlist, each with its number.',
    points: [
      { text: 'Gear with seven views, each with its count', href: '#/gear' },
      { text: '«Dead weight» is now «Never used», with a clear sentence', href: '#/gear?view=never' },
      { text: 'Each item shows its trips as dots', href: '#/gear' },
    ],
    small: [
      { box: 'new', text: 'An item tells its year on tour and a rule from your debriefs', href: '#/gear' },
    ],
  },
  {
    version: '0.47.1',
    date: '2026-10-09',
    title: 'Change it right where it is',
    lead: 'Tap the date, the duration, the weather or the bike on the trip card, and it changes on the spot.',
    points: [
      { text: 'Trip card: change date, duration, weather or bike in place', href: '#/pack' },
      { text: '«Adapted to the weather» switches with one tap', href: '#/pack' },
    ],
    small: [
      { box: 'nicer', text: 'Inbox: the newest note on top', href: '#/inbox' },
      { box: 'nicer', text: 'All problems of all bikes in one list, newest first', href: '#/bikes?tab=care' },
    ],
  },
  {
    version: '0.47.0',
    date: '2026-10-09',
    title: 'A wardrobe in a new dress',
    lead: 'The onion figure filters by zone or layer, and «Still to sort» gets shorter with every tap.',
    points: [
      { text: 'Wardrobe with onion figure and «Still to sort»', href: '#/wardrobe' },
      { text: 'A bike trip shows the drawing with every bag and its weight', href: '#/pack' },
    ],
    small: [
      { box: 'nicer', text: 'Gear with a slim tab bar and calmer cards', href: '#/gear' },
      { box: 'nicer', text: 'Bike care reads calmer, what is due on top', href: '#/bikes?tab=care' },
    ],
  },
  {
    version: '0.46.3',
    date: '2026-10-09',
    title: '«More» takes a breath',
    lead: 'Your packing lists no longer crowd the top. You find them under «Trips».',
    points: [
      { text: 'Packing lists under «Trips», templates under Plan', href: '#/trips' },
    ],
  },
  {
    version: '0.46.2',
    date: '2026-10-09',
    title: 'Readable again',
    lead: 'On the phone the section names no longer stood letter by letter.',
    points: [
      { text: '«Customise the start page» shows every section on its line', href: '#/' },
    ],
  },
  {
    version: '0.46.1',
    date: '2026-10-09',
    title: 'One problem per line',
    lead: 'Several problems in one line become separate repairs, each to tick off on its own.',
    points: [
      { text: 'Several problems split into single repairs', href: '#/bikes?tab=care' },
      { text: '«Trips» opens an overview by state', href: '#/trips' },
    ],
    small: [
      { box: 'nicer', text: 'Priority as a button in the row', href: '#/bikes?tab=care' },
      { box: 'fixed', text: 'A dry day trip no longer brings rain gear because it is cold', href: '#/pack' },
    ],
  },
  {
    version: '0.46.0',
    date: '2026-10-09',
    title: 'Good morning, Today',
    lead: 'A greeting with the weather, the next trip in a compact card, and a search that does things.',
    points: [
      { text: 'Greeting with weather and a day-trip suggestion', href: '#/' },
      { text: '«Important today» shows at most three things, «Oiled ✓» right in the row', href: '#/' },
      { text: 'The search does things: «weigh», «chain oiled spark»', href: '#/' },
    ],
    small: [
      { box: 'new', text: 'Three colour worlds, Glacier, Sandstone and Classic', href: '#/' },
    ],
  },
  {
    version: '0.45.2',
    date: '2026-10-09',
    title: 'Something wrong with the bike?',
    lead: 'Problem on a bike from the plus menu: one line per problem, the app sorts out who fixes it.',
    points: [
      { text: '«Problem on a bike»: one line per problem, priority, photo', href: '#/bikes?tab=care' },
      { text: 'Each problem sorted: yourself, guide, workshop or part', href: '#/bikes?tab=care' },
    ],
    small: [
      { box: 'new', text: 'Basic check before every ride: lock, bottle, helmet and more', href: '#/ride' },
    ],
  },
  {
    version: '0.45.1',
    date: '2026-10-09',
    title: 'Tidy imports, honest backups',
    lead: 'A line that appears twice in the file waits instead of becoming a second item.',
    points: [
      { text: 'Double lines wait under «Unsure»', href: '#/gear/import' },
      { text: 'A day trip mentions what is due on the bike', href: '#/pack' },
    ],
    small: [
      { box: 'fixed', text: 'Two backups without changes are the same', href: '#/', action: 'data' },
      { box: 'faster', text: 'Gear on the computer opens faster', href: '#/gear' },
    ],
  },
  {
    version: '0.45.0',
    date: '2026-10-09',
    title: 'Warm to cold',
    lead: 'The wardrobe shows gaps like «No gloves below 5 °C» and saves an outfit as a kit.',
    points: [
      { text: 'Wardrobe from warm to cold, with gaps and kits', href: '#/wardrobe' },
      { text: '«What do I wear today?» on Today', href: '#/' },
    ],
    small: [
      { box: 'nicer', text: 'Import check says in words when it took over', href: '#/gear/import' },
      { box: 'fixed', text: 'Bigger tap targets on the phone', href: '#/gear' },
    ],
  },
  {
    version: '0.44.1',
    date: '2026-10-09',
    title: 'Fingers and keys',
    lead: 'Bigger tap targets, Escape where you expect it, and the app keeps its font offline.',
    points: [
      { text: 'Escape closes an open row in the packing list', href: '#/pack' },
      { text: 'Bigger tap targets on the phone', href: '#/gear' },
    ],
    small: [
      { box: 'nicer', text: 'Backup import speaks plainly: «1 trip», «1 learning»', href: '#/', action: 'data' },
      { box: 'fixed', text: 'Offline the app keeps its own font', href: '#/' },
    ],
  },
  {
    version: '0.44.0',
    date: '2026-10-09',
    title: 'Your last 12 months',
    lead: 'Always the 12 months up to today: riding, packing, learned and bikes on one page.',
    points: [
      { text: 'Last 12 months with small differences to the year before', href: '#/review' },
      { text: 'A calm card on Today with the most exciting number', href: '#/' },
    ],
    small: [
      { box: 'new', text: 'Two small charts: km per month, base weight per trip', href: '#/review' },
    ],
  },
  {
    version: '0.43.0',
    date: '2026-10-09',
    title: 'On the scale',
    lead: 'One item per screen, a big gram field, «Save & next». Bags and bikes first.',
    points: [
      { text: 'Weigh one item after the other, with «Undo»', href: '#/gear?tab=weigh' },
      { text: 'Select in Gear: trip type and archive for many at once', href: '#/gear' },
    ],
    small: [
      { box: 'nicer', text: 'A smart order: bags, sleeping, layers, then the rest', href: '#/gear?tab=weigh' },
      { box: 'new', text: 'Select in the wardrobe and in a block too', href: '#/wardrobe' },
    ],
  },
  {
    version: '0.42.0',
    date: '2026-10-09',
    title: 'The onion principle 🧅',
    lead: 'Your clothes by layer and body zone, and planning checks that every layer is there.',
    points: [
      { text: 'The wardrobe: clothes by layer and body zone', href: '#/wardrobe' },
      { text: 'Planning checks the onion and fills gaps in one tap', href: '#/pack' },
      { text: 'Temperature kits as blocks, adjusted by your debriefs', href: '#/pack' },
    ],
    small: [
      { box: 'new', text: 'Import step 2: kits, blocks, tasks and old trips', href: '#/gear/import' },
    ],
  },
  {
    version: '0.41.0',
    date: '2026-10-09',
    title: 'Planned versus real',
    lead: 'Upload a ride and see how it compares with the plan. Faster than planned? The app notices.',
    points: [
      { text: 'Upload a GPX ride: distance, climbing, time, breaks', href: '#/debrief/ride' },
      { text: 'Planned versus real for the trip of that day', href: '#/debrief/ride' },
    ],
    small: [
      { box: 'new', text: 'Up to 3 learnings per ride, only kept with a tap', href: '#/debrief/ride' },
      { box: 'new', text: 'Share a GPX file from Android straight to the app', href: '#/debrief/ride' },
    ],
  },
  {
    version: '0.40.0',
    date: '2026-10-09',
    title: 'Calmer side pages',
    lead: 'Short rows instead of walls of text. The explanations wait behind a small «?».',
    points: [
      { text: 'Side pages as short rows, help behind «?»', href: '#/inbox' },
      { text: 'Past trips as a list with the debrief state', href: '#/pack/past' },
    ],
    small: [
      { box: 'new', text: 'A worn chain goes onto the wishlist by itself', href: '#/bikes' },
      { box: 'nicer', text: 'New trip: the standard first, the rest folded', href: '#/pack' },
    ],
  },
  {
    version: '0.39.0',
    date: '2026-10-09',
    title: 'Templates that keep up',
    lead: 'Change a block, and every template changes with it. No more copying around.',
    points: [
      { text: 'Templates are linked to your blocks', href: '#/pack/templates' },
      { text: 'A new template in 3 steps', href: '#/pack/templates' },
    ],
    small: [
      { box: 'nicer', text: 'The list shows content, weight and how often used', href: '#/pack/templates' },
      { box: 'new', text: 'A quiet hint for templates unused for a year', href: '#/pack/templates' },
    ],
  },
  {
    version: '0.38.0',
    date: '2026-10-09',
    title: 'Ready to roll?',
    lead: 'A ready light per bike and quick buttons: chain oiled, wear measured, cleaned. Each with «Undo».',
    points: [
      { text: 'Ready light per bike with quick buttons', href: '#/' },
      { text: '«Jump to» on Today: due, never used, a year ago', href: '#/' },
    ],
    small: [
      { box: 'nicer', text: 'Menu «More» top right, the search finds pages', href: '#/' },
      { box: 'nicer', text: 'Compact rows in Gear, swipe on the phone', href: '#/gear' },
    ],
  },
  {
    version: '0.37.1',
    date: '2026-10-09',
    title: 'Two become one',
    lead: 'A double item merges into the imported one, and everything that used it follows along.',
    points: [
      { text: 'Merge a double item into the imported one', href: '#/gear/import' },
      { text: 'Templates, blocks and planned trips take the new item', href: '#/gear/import' },
    ],
    small: [
      { box: 'fixed', text: 'Archived items no longer come into a new trip', href: '#/pack' },
      { box: 'new', text: '«Merge with …» in the gear window', href: '#/gear' },
    ],
  },
  {
    version: '0.37.0',
    date: '2026-10-08',
    title: 'Real backpacks',
    lead: 'Backpacks, hip bags and vests are bags with litres and weight now.',
    points: [
      { text: 'Backpacks, hip bags and vests in Your bags', href: '#/bikes' },
      { text: 'A trip without a bike suggests a backpack by litres', href: '#/pack' },
    ],
    small: [
      { box: 'new', text: 'Back and Hip count to «On me», not to the bike', href: '#/bikes' },
      { box: 'new', text: 'A quiet note when the bag is too small', href: '#/pack' },
    ],
  },
  {
    version: '0.36.0',
    date: '2026-10-08',
    title: 'Check before it counts',
    lead: 'Your gear list waits on its own page. Nothing goes into Gear before you have looked at it.',
    points: [
      { text: '«Check import»: nothing goes in unchecked', href: '#/gear/import' },
      { text: 'One button for the safe ones, a backup first', href: '#/gear/import' },
    ],
    small: [
      { box: 'new', text: 'Items the list does not name can be archived', href: '#/gear/import' },
      { box: 'new', text: 'New areas: Cycling, Hiking and Everyday', href: '#/gear' },
    ],
  },
  {
    version: '0.35.0',
    date: '2026-10-08',
    title: 'Nothing gets lost',
    lead: 'Typed is kept: new trip, new item and note stay, even if you close the window.',
    points: [
      { text: 'Switch between trips in the dark band', href: '#/pack' },
      { text: 'Nothing typed gets lost when you close a window', href: '#/pack' },
    ],
    small: [
      { box: 'nicer', text: '«Saved ✓» shows briefly after every change', href: '#/pack?day' },
      { box: 'new', text: 'This list: what is new, with «Try it»', href: '#/features' },
    ],
  },
  {
    version: '0.34.0',
    date: '2026-10-08',
    title: 'The days before the trip',
    lead: 'Today shows the next step towards your trip, plus a shopping and a charging list.',
    points: [
      { text: 'The next step to the trip, with a small timeline', href: '#/' },
      { text: 'A shopping list and a charging list', href: '#/pack?shop' },
    ],
    small: [
      { box: 'new', text: 'An evening block on multi-day trips', href: '#/ride' },
      { box: 'new', text: 'Send a backup to the other device', href: '#/', action: 'data' },
    ],
  },
  {
    version: '0.33.0',
    date: '2026-10-08',
    title: 'Standard for real',
    lead: 'Every new trip brings everything from Standard, also from a template or a copy.',
    points: [
      { text: 'Every new trip brings all of Standard', href: '#/pack' },
      { text: 'Unused standard items land on the ballast card', href: '#/pack' },
    ],
    small: [
      { box: 'fixed', text: '«Leave at home» really takes the item out of Standard', href: '#/gear' },
    ],
  },
  {
    version: '0.32.0',
    date: '2026-10-08',
    title: 'Same words everywhere',
    lead: 'Blocks, templates and «On me»: one word for one thing, all over the app.',
    points: [
      { text: 'The same words everywhere, blocks in three groups', href: '#/blocks' },
      { text: 'Two switches in the gear window: Standard and On me', href: '#/gear' },
    ],
    small: [
      { box: 'new', text: 'Filter «Comes along» on the computer', href: '#/gear' },
      { box: 'nicer', text: 'The blocks page in three groups', href: '#/blocks' },
    ],
  },
  {
    version: '0.31.0',
    date: '2026-10-08',
    title: 'Who did the wrenching?',
    lead: 'Every part shows its last job, when it is due again and whether you or the bike shop did it.',
    points: [
      { text: 'Bike care with one bike open, at most three «Due now»', href: '#/care' },
      { text: 'Last job per part: date, km, cost and who', href: '#/care' },
    ],
    small: [
      { box: 'nicer', text: 'Setup with your bikes as tabs and a big drawing', href: '#/bikes' },
      { box: 'new', text: 'You or the bike shop, chosen when you log a job', href: '#/care' },
    ],
  },
  {
    version: '0.30.2',
    date: '2026-10-08',
    title: 'Steady fingers',
    lead: 'Rows stay put while you pack, so a quick tap never hits the wrong item.',
    points: [
      { text: 'Rows stay in place while packing', href: '#/pack?day' },
      { text: 'Plan a trip without a bike too', href: '#/pack' },
    ],
    small: [
      { box: 'nicer', text: 'A search hit opens the item directly', href: '#/gear' },
      { box: 'new', text: 'New learnings first on Today', href: '#/' },
    ],
  },
  {
    version: '0.30.1',
    date: '2026-10-08',
    title: 'Double tap, single count',
    lead: 'A quick double tap counts once, and «Undo» after a whole bag opens it again.',
    points: [
      { text: 'A quick double tap counts once', href: '#/pack?day' },
      { text: 'Rename a trip by tapping its name', href: '#/pack' },
    ],
    small: [
      { box: 'fixed', text: 'Kilometres with an apostrophe or a point between thousands', href: '#/bikes' },
      { box: 'nicer', text: 'Templates read like «Standard + Rain + 3 items»', href: '#/pack/templates' },
    ],
  },
  {
    version: '0.30.0',
    date: '2026-10-08',
    title: 'Plan a trip',
    lead: 'When, how long, weather, the standard card and blocks as chips: one window, and the list is ready.',
    points: [
      { text: '«Plan a trip» in one window', href: '#/pack' },
      { text: 'Standard plus rain gear in four taps', href: '#/pack' },
    ],
    small: [
      { box: 'nicer', text: '«Good to know» with up to three important cards', href: '#/' },
      { box: 'new', text: 'A new page: what the app can do', href: '#/features' },
    ],
  },
  {
    version: '0.29.2',
    date: '2026-10-08',
    title: 'Standard as a start',
    lead: 'A new trip starts with the standard set, and «Day trip» packs it on the bike of your last trip.',
    points: [
      { text: 'A new trip starts with the standard set', href: '#/pack' },
      { text: '«Day trip» packs standard plus weather', href: '#/' },
    ],
    small: [
      { box: 'nicer', text: 'A green card shows the new trip, with change and undo' },
    ],
  },
  {
    version: '0.29.1',
    date: '2026-10-08',
    title: 'Packing you can trust',
    lead: 'A quick second tap no longer takes the item out again. Phew.',
    points: [
      { text: 'A quick second tap no longer unpacks', href: '#/pack?day' },
    ],
    small: [
      { box: 'fixed', text: 'A bag only moves on when it is really full', href: '#/pack?day' },
    ],
  },
  {
    version: '0.29.0',
    date: '2026-10-08',
    title: 'One band for the whole trip',
    lead: 'Plan, pack, ride and debrief share a dark band with tabs and one button to the next step.',
    points: [
      { text: 'A dark band with tabs and the next step', href: '#/pack' },
      { text: 'On the way starts with «Now», notes in one tap', href: '#/ride' },
    ],
    small: [
      { box: 'nicer', text: 'Weather changes with a reason and undo per row', href: '#/pack' },
      { box: 'faster', text: 'Debrief prefilled: one tap if all went to plan', href: '#/debrief' },
    ],
  },
  {
    version: '0.28.0',
    date: '2026-10-08',
    title: 'Suggestions with a source',
    lead: 'The templates ask instead of decide, and say why, for example «unused on 3 of 3 trips».',
    points: [
      { text: 'Template suggestions as questions with a source', href: '#/pack/templates' },
      { text: 'First aid is its own block, only with a night out', href: '#/blocks' },
    ],
    small: [
      { box: 'nicer', text: '«Not now» rests until three more debriefs', href: '#/pack/templates' },
      { box: 'fixed', text: 'Rain and cold items only count on trips with that weather' },
    ],
  },
  {
    version: '0.27.0',
    date: '2026-10-08',
    title: 'Every row has its reason',
    lead: 'Why is this on the list? Every packing row now says it, for example «Below 6 °C».',
    points: [
      { text: 'Each packing row names its reason', href: '#/pack' },
      { text: 'Before an import you see what gets replaced', href: '#/', action: 'data' },
    ],
    small: [
      { box: 'nicer', text: 'Windows keep the keyboard focus, tap targets 44 px' },
      { box: 'fixed', text: 'Clear messages for broken photos and odd GPX files' },
    ],
  },
  {
    version: '0.26.1',
    date: '2026-10-08',
    title: 'Light for the night',
    lead: 'A block for riding into the dark, and «Your data» only opens by itself once.',
    points: [
      { text: 'A block for the light at night', href: '#/blocks' },
    ],
    small: [
      { box: 'fixed', text: '«Your data» opens by itself only once', href: '#/', action: 'data' },
    ],
  },
  {
    version: '0.26.0',
    date: '2026-10-08',
    title: 'Build your own blocks',
    lead: 'Create and rename blocks, and drop many items into one at once.',
    points: [
      { text: 'New page Blocks: create and rename your own', href: '#/blocks' },
      { text: '«Select» puts many items into a block, trip or template', href: '#/gear' },
    ],
    small: [
      { box: 'nicer', text: 'Templates ask «update or new»', href: '#/pack/templates' },
      { box: 'new', text: 'Notes on the way belong to the trip and the day', href: '#/ride' },
    ],
  },
  {
    version: '0.25.1',
    date: '2026-10-08',
    title: 'A day trip in one tap',
    lead: '«Day trip» on Today creates the trip right away, with name, date and weather.',
    points: [
      { text: '«Day trip» creates the trip at once', href: '#/' },
      { text: 'Tiles Trips and Bikes with four buttons plus «More»', href: '#/' },
    ],
    small: [
      { box: 'nicer', text: '«Good to know» only with content, urgent first', href: '#/' },
      { box: 'fixed', text: '«Today» is right between midnight and 2 am too' },
    ],
  },
  {
    version: '0.25.0',
    date: '2026-10-07',
    title: 'A new trip asks first',
    lead: 'Days, riding hours, night, weather and event, with a preview of what lands on the list.',
    points: [
      { text: 'New trip asks days, hours, night, weather and event', href: '#/pack' },
      { text: 'Later changes work at once, with undo', href: '#/pack' },
    ],
    small: [
      { box: 'nicer', text: 'Short rides without an event skip bike care before the start' },
    ],
  },
  {
    version: '0.24.1',
    date: '2026-10-07',
    title: 'From 65 clicks to 8',
    lead: 'A day trip from «New» to the debrief now takes 8 clicks. Your thumb says thanks.',
    points: [
      { text: 'Packing rows show only name, count and weight', href: '#/pack' },
      { text: 'Debrief right from Today: «All good»', href: '#/' },
      { text: 'Select several items in Gear at once', href: '#/gear' },
    ],
    small: [
      { box: 'faster', text: 'A day trip in 8 clicks instead of 65' },
    ],
  },
  {
    version: '0.24.0',
    date: '2026-10-07',
    title: 'All in, onwards',
    lead: 'One tap per bag on packing day, and «All as planned» in the debrief.',
    points: [
      { text: '«All in, next» per bag and «All packed»', href: '#/pack?day' },
      { text: '«All as planned» in the debrief', href: '#/debrief' },
    ],
    small: [
      { box: 'new', text: 'A new item straight from the search', href: '#/gear' },
      { box: 'nicer', text: 'One-day trips start without the overnight set' },
    ],
  },
  {
    version: '0.23.1',
    date: '2026-10-07',
    title: 'Small things for the phone',
    lead: 'Today folds up on the phone, and the language lives in the profile menu.',
    points: [
      { text: 'Today folded on the phone, item category changeable there too', href: '#/' },
    ],
    small: [
      { box: 'nicer', text: 'The language is in the profile menu' },
    ],
  },
  {
    version: '0.23.0',
    date: '2026-10-07',
    title: 'One navigation for all',
    lead: 'Today, Trips, Gear and Bikes on every page; on the phone at the bottom with + in the middle.',
    points: [
      { text: 'One navigation on every page', href: '#/' },
      { text: 'Today shows the next trip with one main action', href: '#/' },
    ],
    small: [
      { box: 'nicer', text: 'Gear starts with search, filter and list', href: '#/gear' },
      { box: 'new', text: 'The category of an item can change, links stay', href: '#/gear' },
    ],
  },
  {
    version: '0.22.1',
    date: '2026-10-07',
    title: 'Overdue, in words',
    lead: '«For 3 weeks» says more than a date. And Gear fits the phone again.',
    points: [
      { text: 'Event preparation only for trips marked «Event»', href: '#/pack' },
    ],
    small: [
      { box: 'nicer', text: 'Overdue in words, like «for 3 weeks»' },
      { box: 'fixed', text: 'Gear fits 390 px on the phone again' },
    ],
  },
  {
    version: '0.22.0',
    date: '2026-10-07',
    title: 'Honest weights',
    lead: 'Totals are called «known» and say how many weights are missing. Plus a star for your favourites.',
    points: [
      { text: 'Totals say «known» and how many weights are missing', href: '#/pack' },
      { text: 'A star marks a favourite in one tap', href: '#/gear' },
    ],
    small: [
      { box: 'nicer', text: 'Calmer type and colours, only the main action orange' },
      { box: 'nicer', text: 'Today, Pack and bike care show the same readiness' },
    ],
  },
  {
    version: '0.21.0',
    date: '2026-10-07',
    title: 'Ski tour, weekend, world trip',
    lead: 'More than bikepacking: new trip types, each with its own bags.',
    points: [
      { text: 'Trip types: ski tour, weekend and world trip', href: '#/pack' },
      { text: 'Bikes and bike care on one page', href: '#/bikes' },
    ],
    small: [
      { box: 'new', text: 'Today shows what the app still needs to calculate for you', href: '#/' },
      { box: 'new', text: 'A printable page with all your favourite items', href: '#/favorites' },
    ],
  },
  {
    version: '0.20.2',
    date: '2026-10-05',
    title: 'The big button',
    lead: 'Always clear what comes next: one big button leads to the next step of the trip.',
    points: [
      { text: 'One big button to the next step: packing day, ride, debrief', href: '#/pack' },
    ],
  },
  {
    version: '0.20.1',
    date: '2026-10-05',
    title: 'A trip from start to finish',
    lead: 'New list, pack, ride, end the trip, debrief: everything plays through in one go.',
    points: [
      { text: 'Play a whole trip from list to debrief', href: '#/pack' },
    ],
    small: [
      { box: 'fixed', text: '«End the trip» ends it at once, not the next day', href: '#/ride' },
    ],
  },
  {
    version: '0.20.0',
    date: '2026-10-05',
    title: 'Grüezi and hello',
    lead: 'German and English, chosen per device. What you wrote yourself stays as it is.',
    points: [
      { text: 'German and English, per device' },
    ],
    small: [
      { box: 'nicer', text: 'Dates and numbers follow the language' },
    ],
  },
  {
    version: '0.19.6',
    date: '2026-10-05',
    title: 'A new start page',
    lead: 'The next trip as a dark band with a countdown, below it Trips, Gear and Bikes.',
    points: [
      { text: 'The next trip with a countdown on the start page' },
      { text: 'Search over everything, «New» on every page' },
    ],
    small: [
      { box: 'new', text: '«Good to know»: weather, sun times, a learning, your pace', href: '#/' },
    ],
  },
  {
    version: '0.19.5',
    date: '2026-10-05',
    title: 'Ballast, begone',
    lead: 'What came along but was not needed the last few times gets a gentle «Leave at home?».',
    points: [
      { text: 'The ballast card: leave at home or keep', href: '#/pack' },
      { text: 'On the way block by block: wear, eat, drink, light', href: '#/ride' },
    ],
    small: [
      { box: 'new', text: 'Short marks like «3× not needed»', href: '#/pack' },
    ],
  },
  {
    version: '0.19.4',
    date: '2026-10-05',
    title: 'Favourites get a star',
    lead: 'Load your favourites from a file, and they come first when you add items.',
    points: [
      { text: 'Load favourites from a file', href: '#/', action: 'data' },
      { text: 'A «Favourites» button, favourites first when adding', href: '#/gear' },
    ],
  },
  {
    version: '0.19.3',
    date: '2026-10-05',
    title: 'Off to the workshop',
    lead: 'Everything due before the next trip as one order, ready to send or print.',
    points: [
      { text: 'Workshop order with everything due before the trip', href: '#/care' },
      { text: 'A profile per bike: km, costs, what is due next', href: '#/bikes' },
    ],
    small: [
      { box: 'new', text: 'Compare your bikes for a trip and switch in one tap', href: '#/pack' },
      { box: 'new', text: 'A note from any page, sort it later in the inbox', href: '#/inbox' },
    ],
  },
  {
    version: '0.19.2',
    date: '2026-10-05',
    title: 'Never needed?',
    lead: 'Gear shows what you took along but never used. Honest, but kind.',
    points: [
      { text: 'Your trips compared: luggage, used and not used', href: '#/debrief/compare' },
      { text: 'Gear shows what you never used', href: '#/gear' },
    ],
    small: [
      { box: 'new', text: 'The wishlist with a reason, sorted by use', href: '#/gear' },
      { box: 'new', text: 'Mark a trip as «Not riding»', href: '#/pack' },
    ],
  },
  {
    version: '0.19.0',
    date: '2026-10-05',
    title: 'Your own pace',
    lead: 'Load GPX rides, and the app learns how fast you really are, with climbing and breaks.',
    points: [
      { text: 'GPX rides teach the app your pace', href: '#/debrief/pace' },
      { text: 'Riding time and arrival with your pace', href: '#/ride' },
    ],
    small: [
      { box: 'new', text: 'After three debriefs the templates suggest changes', href: '#/pack/templates' },
    ],
  },
  {
    version: '0.18.2',
    date: '2026-10-05',
    title: 'Before the trip',
    lead: 'One list «Before the trip», with the same number on Today, Pack and bike care.',
    points: [
      { text: 'A list «Before the trip», the same number everywhere', href: '#/pack' },
    ],
    small: [
      { box: 'nicer', text: 'Overdue first and in red' },
    ],
  },
  {
    version: '0.18.1',
    date: '2026-10-05',
    title: 'Colder than packed?',
    lead: 'The packing day warns when the forecast is colder or wetter than your bags.',
    points: [
      { text: 'Packing day warns about colder or wetter weather', href: '#/pack?day' },
      { text: '«Was missing» suggests similar items from your gear', href: '#/debrief' },
    ],
    small: [
      { box: 'fixed', text: 'Packing day fits the phone without sideways scrolling' },
    ],
  },
  {
    version: '0.18.0',
    date: '2026-10-05',
    title: 'On the way',
    lead: 'All bags, the stage with height profile, and the weather hour by hour, offline too.',
    points: [
      { text: 'On the way: bags, stage, height profile', href: '#/ride' },
      { text: 'Weather hour by hour at start and finish, offline too', href: '#/ride' },
    ],
    small: [
      { box: 'new', text: 'From 14 days before a trip: what the workshop still has to do', href: '#/care' },
      { box: 'new', text: 'A demo mode, «End demo» resets everything', href: '#/', action: 'data' },
    ],
  },
  {
    version: '0.17.1',
    date: '2026-10-04',
    title: 'Unknown is not zero',
    lead: 'A workshop visit without prices says «cost unknown» instead of CHF 0.',
    points: [
      { text: 'Cost unknown instead of CHF 0', href: '#/care' },
    ],
    small: [
      { box: 'fixed', text: 'Cost per 1000 km only counts with enough data' },
    ],
  },
  {
    version: '0.17.0',
    date: '2026-10-04',
    title: 'Workshop visits',
    lead: 'Amount, jobs, photos of the receipts and km per bike, and what is coming up.',
    points: [
      { text: 'Workshop visits per bike with receipts', href: '#/care' },
      { text: 'Services like the yearly fork service', href: '#/care' },
    ],
    small: [
      { box: 'new', text: 'Costs per year and per 1000 km', href: '#/care' },
      { box: 'new', text: 'A photo gallery per bike', href: '#/bikes' },
    ],
  },
  {
    version: '0.16.0',
    date: '2026-10-04',
    title: 'A logbook and a link',
    lead: 'Your past trips in a logbook, rides from Strava or Garmin, and a packing list to share.',
    points: [
      { text: 'A logbook of your past trips', href: '#/debrief' },
      { text: 'Import rides from Strava or Garmin', href: '#/debrief' },
    ],
    small: [
      { box: 'new', text: 'Share the packing list as a link or a PDF', href: '#/pack' },
    ],
  },
  {
    version: '0.15.0',
    date: '2026-10-04',
    title: 'Route and weather',
    lead: 'Load a GPX route, and the forecast for every trip day packs along.',
    points: [
      { text: 'Load a GPX route: distance, climbing, riding hours', href: '#/pack' },
      { text: 'Forecast for every trip day, one click packs for it', href: '#/pack' },
    ],
    small: [
      { box: 'nicer', text: 'The last forecast stays visible offline' },
      { box: 'new', text: 'A photo of your bike behind the bags', href: '#/bikes' },
    ],
  },
  {
    version: '0.14.0',
    date: '2026-10-04',
    title: 'Packing day, full screen',
    lead: 'Bag by bag in big letters, and the screen stays on while your hands are busy.',
    points: [
      { text: 'Packing day full screen, the screen stays on', href: '#/pack?day' },
      { text: 'Learnings as a small hint at the right item', href: '#/pack' },
    ],
    small: [
      { box: 'new', text: 'The debrief adds the km to the bike', href: '#/debrief' },
      { box: 'new', text: 'A reminder when the last backup is older than 14 days', href: '#/', action: 'data' },
    ],
  },
  {
    version: '0.13.0',
    date: '2026-10-04',
    title: 'The first debrief',
    lead: 'How was it, go through the items, a summary with suggestions: three steps to learn from every trip.',
    points: [
      { text: 'The debrief in three steps' },
      { text: 'All learnings in one place, with a search', href: '#/debrief/learnings' },
    ],
    small: [
      { box: 'new', text: 'The start page shows the next trip with a countdown' },
    ],
  },
  {
    version: '0.12.0',
    date: '2026-10-04',
    title: 'Bags on the bike',
    lead: 'Bags show their contents right on the bike, and items move between them.',
    points: [
      { text: 'Bags show their contents on the bike' },
      { text: 'Move items between bags, with undo' },
    ],
    small: [
      { box: 'nicer', text: 'Calmer colours and a calmer header' },
    ],
  },
  {
    version: '0.11.0',
    date: '2026-10-04',
    title: 'Drag and drop',
    lead: 'Drag items between bags, and edit templates right where they are.',
    points: [
      { text: 'Drag items between bags' },
      { text: 'Edit templates directly', href: '#/pack/templates' },
    ],
    small: [
      { box: 'nicer', text: 'Weights in one line, the weather folds away' },
    ],
  },
  {
    version: '0.10.0',
    date: '2026-10-04',
    title: 'Templates are born',
    lead: 'Save a packing setup once and start new trips from it.',
    points: [
      { text: 'Save a packing setup as a template', href: '#/pack/templates' },
      { text: 'One page with all your templates', href: '#/pack/templates' },
    ],
  },
  {
    version: '0.9.1',
    date: '2026-10-04',
    title: 'Tidier packing',
    lead: 'Smaller + buttons, only one category open, and the kind of ride as buttons.',
    points: [
      { text: 'The kind of ride as buttons that show what they add' },
    ],
    small: [
      { box: 'nicer', text: 'Smaller + buttons, one category open at a time' },
    ],
  },
  {
    version: '0.9.0',
    date: '2026-10-04',
    title: 'The start check',
    lead: 'A short list before you go, and items marked «On every trip».',
    points: [
      { text: 'Start check as a short list, saved as your standard', href: '#/pack?day' },
    ],
    small: [
      { box: 'new', text: 'Mark items as «On every trip»' },
    ],
  },
  {
    version: '0.8.0',
    date: '2026-10-04',
    title: 'Three columns',
    lead: 'A new packing layout: what is not packed yet waits folded by category.',
    points: [
      { text: 'Packing in three columns, unpacked by category' },
      { text: 'Add with + or by dragging, bags with a fill bar' },
    ],
    small: [
      { box: 'nicer', text: 'On the phone a bar shows the bag you are filling' },
    ],
  },
  {
    version: '0.7.1',
    date: '2026-10-04',
    title: 'Pressure and sealant',
    lead: 'Tyre pressure and sealant per bike, and a list of what was done when.',
    points: [
      { text: 'Tyre pressure and sealant per bike', href: '#/care' },
      { text: 'A list of what was done when', href: '#/care' },
    ],
    small: [
      { box: 'new', text: 'Brake disc wear limit per bike' },
    ],
  },
  {
    version: '0.7.0',
    date: '2026-10-04',
    title: 'Bike care is here 🔧',
    lead: 'The parts of every bike with their history, and reminders by distance.',
    points: [
      { text: 'The parts of each bike with their history', href: '#/care' },
      { text: 'Reminders by distance, like chain wax every 150 km', href: '#/care' },
    ],
    small: [
      { box: 'new', text: 'Preparation tasks per trip', href: '#/pack' },
    ],
  },
  {
    version: '0.6.0',
    date: '2026-10-04',
    title: 'Weather-wise',
    lead: 'Clothing suggestions for cold and rain, and a warning when a bag is too full.',
    points: [
      { text: 'Weather with clothing suggestions' },
      { text: 'A warning when a bag is too full' },
    ],
    small: [
      { box: 'new', text: 'Weigh and print from Pack, weight front and rear' },
      { box: 'new', text: 'An inventory check of your gear', href: '#/gear' },
    ],
  },
  {
    version: '0.5.0',
    date: '2026-10-04',
    title: 'Bikes and bags',
    lead: 'Your own bags, bike setups with a drawing, and packing bag by bag.',
    points: [
      { text: 'Bikes: own bags, setups with a drawing, weights', href: '#/bikes' },
      { text: 'Pack: choose a bag on the drawing and add items', href: '#/pack' },
    ],
    small: [
      { box: 'new', text: 'Tick off bag by bag, with start check and system weight', href: '#/pack?day' },
    ],
  },
  {
    version: '0.4.0',
    date: '2026-10-04',
    title: 'Neater gear',
    lead: 'Categories fold, brand and model are separate, and weighing starts with what always comes along.',
    points: [
      { text: 'Gear weight without food and water, brand and model separate', href: '#/gear' },
    ],
    small: [
      { box: 'nicer', text: 'Categories fold open and shut' },
      { box: 'nicer', text: 'Weighing starts with the items for every trip' },
    ],
  },
  {
    version: '0.3.0',
    date: '2026-10-04',
    title: 'Gear, the page',
    lead: 'Key figures, weight by category, the heaviest items, and a weigh mode.',
    points: [
      { text: 'Gear with key figures, heaviest items, search and filter', href: '#/gear' },
      { text: 'Add, edit and delete items, the wishlist apart', href: '#/gear' },
    ],
    small: [
      { box: 'new', text: 'Weigh mode: grams in, save, next', href: '#/gear' },
    ],
  },
  {
    version: '0.2.0',
    date: '2026-10-04',
    title: 'Your data stays with you',
    lead: 'Everything in a local database on your device, with backups you control.',
    points: [
      { text: 'Data stays on your device' },
      { text: 'Export and import a backup, replace or merge', href: '#/', action: 'data' },
    ],
    small: [
      { box: 'new', text: 'Automatic backup into a folder on the computer' },
      { box: 'new', text: 'Your packing spreadsheet converts for the app' },
    ],
  },
  {
    version: '0.1.0',
    date: '2026-10-04',
    title: 'Hello, Pack Generator 👋',
    lead: 'It all started here: an app for packing, on the phone and offline.',
    points: [
      { text: 'Install it on your phone and use it offline' },
      { text: 'Open it in the browser, on any device' },
    ],
  },
];

/** How many versions show open; the older ones fold away. */
export const SHOWN = 3;
/** localStorage: the newest version seen on Today. */
export const SEEN_KEY = 'whatsnew.seen';
/** The version before this list existed: a device with data but no mark comes from there. */
export const BEFORE = '0.34.0';

/** v0.118.0 «Was ist neu 2» (answer 2a): the boxes of the small things, in this order (labels are keys for t()). */
export const BOXES = [
  { key: 'new', label: 'New|box' },
  { key: 'nicer', label: 'Nicer|box' },
  { key: 'fixed', label: 'Fixed|box' },
  { key: 'faster', label: 'Faster|box' },
];
export const boxLabel = (key) => BOXES.find((b) => b.key === key)?.label ?? 'New|box';

/** All lines of a version: the main points, then the small things. */
export const itemsOf = (e) => [...(e?.points ?? []), ...(e?.small ?? [])];

/** The news items of a few versions (the window after an update counts them). */
export const countNews = (entries = []) => ({ points: entries.reduce((n, e) => n + e.points.length, 0), small: entries.reduce((n, e) => n + (e.small?.length ?? 0), 0) });

/**
 * The picture of a line, from the place it leads to (a line may name its own `icon`): a key for
 * know/VersionNews.svelte. Most specific address first.
 */
const ICONS = [
  ['#/me/news', 'star'], ['#/features', 'star'], ['#/me/checks', 'check'], ['#/me/data', 'save'], ['#/me/look', 'palette'], ['#/helper', 'sparkles'],
  ['#/me', 'user'], ['#/inbox', 'inbox'], ['#/notes', 'note'], ['#/bikes?tab=care', 'wrench'], ['#/care', 'wrench'], ['#/bikes', 'bike'],
  ['#/wardrobe', 'shirt'], ['#/favorites', 'star'], ['#/gear', 'box'], ['#/flow', 'activity'], ['#/debrief', 'book'], ['#/review', 'book'],
  ['#/blocks', 'blocks'], ['#/pack?day', 'check'], ['#/pack/templates', 'copy'], ['#/pack', 'pack'], ['#/trips', 'route'], ['#/ride', 'compass'], ['#/', 'sun'],
];
export function iconOf(p) {
  if (p?.icon) return p.icon;
  if (p?.action === 'data') return 'save';
  const h = p?.href ?? '';
  return ICONS.find(([pre]) => (pre === '#/' ? h === '#/' : h.startsWith(pre)))?.[1] ?? 'sparkles';
}

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

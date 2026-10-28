// «332 sichtbar», Frage 2 (Noah 27.10.2026 «2a»): functions that show only in the right situation. The catalogue
// «What the app can do» says in one sentence when each one appears, so nobody looks for it in vain.
// heimat.js marks the same functions in GAPS with 'when' (tests/heimat.test.js checks both lists match).
export const WHEN = {
  'f.homecoming': 'Appears once a trip has ended, on its page «Trip ended».',
  'f.tripstate': 'Each trip shows «Planned», «Completed» or «Rated» next to its name.',
  'f.checkin': 'Appears on a trip with a booked night: the check-in time sits with the night.',
  'f.laundry': 'Appears on a packing list with clothes; the reminder comes two days before the trip.',
  'f.morninglist': 'Appears on the departure morning, under On the way.',
  'f.abroad': 'Appears on a trip in another country.',
  'f.tourhints': 'Appears on the packing list when the trip runs after sunset, has a high UV index or is a loop.',
  'f.tripalert': 'Appears on a planned trip when there is a weather or avalanche warning for its days.',
  'f.evening': 'Appears in the evening on a trip of several days.',
  'f.readytomorrow': 'Appears on the evening before a trip.',
  'f.prep': 'Appears from 14 days before a trip, under Bike care.',
  'f.springservice': 'Appears in February as a to-do in Merken, and after six weeks without a ride.',
  'f.feel': 'Appears after a ride, as a question.',
  'f.tipweek': 'On Today as a tile, as long as there are tips you have not tried yet.',
  'f.comeback': 'Appears when you open the app after three weeks away.',
  event: 'Appears on a trip marked as an event.',
  learn: 'Appears in a template once 3 trips made from it have a debrief.',
};

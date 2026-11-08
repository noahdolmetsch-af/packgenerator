// «Pin deckt keinen Text mehr» (UX-Test 08.11.2026, Befund D1 und 2b-13): der Pin lag am Computer auf der Brotkrume und auf Knöpfen, und sein Zweck stand nirgends
export default {
  title: 'The pin never covers text',
  lead: 'The pin for Quick Links stays off letters and buttons, and says what it does.',
  points: [
    { text: 'On a computer the pin no longer lies on the breadcrumb or on a button; with no free place there is no pin', go: { href: '#/bikes?tab=care&view=import', where: 'Under Bike › Care › Import rides, at the top right of the title.' } },
    { text: 'Rest the pointer on a pin: it says what it does, for the page or for the card', go: { href: '#/bikes?tab=care&view=import', where: 'Under Bike › Care › Import rides, at the top right of the title.' } },
  ],
  small: [],
  test: [
    'On a computer open Bike › Care › Import rides: the breadcrumb above the title reads in full, no pin lies on it.',
    'Rest the pointer on the pin at the title: it says «Pin this page to Quick Links, with its filter».',
    'Tap the pin: the page is in Quick Links; the same text now says a tap takes it out.',
  ],
  since: [],
  de: {
    'The pin never covers text': 'Der Pin deckt keinen Text mehr zu',
    'The pin for Quick Links stays off letters and buttons, and says what it does.': 'Der Pin für Quick Links bleibt weg von Buchstaben und Knöpfen und sagt, was er tut.',
    'On a computer the pin no longer lies on the breadcrumb or on a button; with no free place there is no pin': 'Am Computer liegt der Pin nicht mehr auf der Brotkrume oder auf einem Knopf; wo kein Platz frei ist, steht kein Pin',
    'Under Bike › Care › Import rides, at the top right of the title.': 'Unter Velos › Pflege › Fahrten importieren, oben rechts am Titel.',
    'Rest the pointer on a pin: it says what it does, for the page or for the card': 'Halte den Zeiger auf einen Pin: er sagt, was er tut, für die Seite oder für die Karte',
    'On a computer open Bike › Care › Import rides: the breadcrumb above the title reads in full, no pin lies on it.': 'Öffne am Computer Velos › Pflege › Fahrten importieren: die Brotkrume über dem Titel ist ganz lesbar, kein Pin liegt darauf.',
    'Rest the pointer on the pin at the title: it says «Pin this page to Quick Links, with its filter».': 'Halte den Zeiger auf den Pin am Titel: er sagt «Diese Seite an Quick Links anpinnen, mit ihrem Filter».',
    'Tap the pin: the page is in Quick Links; the same text now says a tap takes it out.': 'Tippe auf den Pin: die Seite ist in Quick Links; derselbe Text sagt jetzt, dass ein Tipp sie wieder herausnimmt.',
  },
};

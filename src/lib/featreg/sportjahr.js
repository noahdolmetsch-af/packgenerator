// «Sportjahr» (Noah 21.11.2026 «1 a dann b», Thread «Sportjahr», S3): Auswerten › Sportjahr
export default {
  features: [
    { id: 'f.sportjahr', group: 'data', title: 'Sports year page', text: 'All your sports together in hours: week, month, year or everything, the hours per month by sport with the year before as a line, where the time went (hours, units, days, km), records and streaks and the weeks with training, and at the bottom «Ticks and rhythm»: every tick of every activity (also meditation, sauna and the ride to work) with weekdays, time of day, course, best values and per month, for all activities or one. Strava and your ticks are read together; where no time was measured, the usual duration of the sport counts and says «ca.». Only to look at.', href: '#/auswerten/sportjahr', words: 'sportjahr stunden sportarten zeit woche monat jahr vorjahr rekorde serien einheiten tage km strava haken ca uebliche dauer sports year hours units days records streaks usual duration ticks rhythm haken rhythmus wochentag tageszeit bestwerte auswertung haken ausgewertet', moment: 'app' },
  ],
  howto: { 'f.sportjahr': ['Open Analysis and tap «Sports year».', 'Pick Week, Month, Year or Everything and read the hours, units and days at the top.', 'Switch «Where did the time go?» between hours, units, days and km.'] },
  handbook: {
    'f.sportjahr': {
      on: null,
      steps: ['Open Analysis and tap «Sports year».', 'Pick Week, Month, Year or Everything and read the hours, units and days at the top.', 'Switch «Where did the time go?» between hours, units, days and km.'],
      example: 'Example: the year view shows the hours of each month by sport and the year before as a dashed line.',
    },
  },
  home: { 'f.sportjahr': '#/auswerten/sportjahr' },
};

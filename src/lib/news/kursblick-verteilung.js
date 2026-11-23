// «Kursblick» Verteilung (Noah 23.11.2026 «einzelne neue Aktien … Obligationen. ETFs», «Krypto, Rohstoffe, Immobilien, Sparkonto»): the whole picture
export default {
  title: 'Kursblick: your whole picture with goals',
  lead: 'Under «Portfolio» Kursblick now shows how your holdings are split into groups, and how far each is from the goal you set.',
  points: [
    { text: 'Groups like gold, stocks and funds, bonds, crypto, real estate and savings: each gets a goal in percent and a band; you see how far you are off, in points and in francs', go: { href: '#/kurse/portfolio', steps: [{ sel: '[data-verteilung]' }] } },
    { text: 'Sort each title of your real portfolios into a group; practice portfolios never count', go: { href: '#/kurse/portfolio', steps: [{ sel: '[data-verteilung]' }] } },
    { text: 'Write down values by hand for what has no price: a savings account, a pillar-3a account, a flat, coins', go: { href: '#/kurse/portfolio', steps: [{ sel: '[data-hand-neu]' }] } },
  ],
  small: [{ box: 'new', text: 'Groups can be renamed, added and deleted; the titles and values go to another group or stay without one' }],
  test: ['Open Kursblick › «Portfolio» and scroll to «Your whole picture».', 'Tap «Value by hand», write «Savings account», choose «Savings and cash», write 5000 and save: the picture shows CHF 5’000.', 'Write 50 as the goal of «Savings and cash»: it says how far you are off.'],
  since: [],
  de: {
    'Kursblick: your whole picture with goals': 'Kursblick: dein Gesamtbild mit Zielen',
    'Under «Portfolio» Kursblick now shows how your holdings are split into groups, and how far each is from the goal you set.': 'Unter «Depot» zeigt Kursblick jetzt, wie dein Besitz auf Gruppen verteilt ist und wie weit jede vom Ziel weg ist, das du gesetzt hast.',
    'Groups like gold, stocks and funds, bonds, crypto, real estate and savings: each gets a goal in percent and a band; you see how far you are off, in points and in francs': 'Gruppen wie Gold, Aktien und Fonds, Obligationen, Krypto, Immobilien und Sparkonto: Jede bekommt ein Ziel in Prozent und einen Spielraum; du siehst, wie weit du weg bist, in Punkten und in Franken',
    'Sort each title of your real portfolios into a group; practice portfolios never count': 'Ordne jeden Titel deiner echten Depots einer Gruppe zu; Übungsdepots zählen nie',
    'Write down values by hand for what has no price: a savings account, a pillar-3a account, a flat, coins': 'Trag von Hand Werte ein für das, was keinen Preis hat: ein Sparkonto, ein Säule-3a-Konto, eine Wohnung, Münzen',
    'Groups can be renamed, added and deleted; the titles and values go to another group or stay without one': 'Gruppen kannst du umbenennen, hinzufügen und löschen; die Titel und Werte gehen in eine andere Gruppe oder bleiben ohne',
    'Open Kursblick › «Portfolio» and scroll to «Your whole picture».': 'Öffne Kursblick › «Depot» und scrolle zu «Dein Gesamtbild».',
    'Tap «Value by hand», write «Savings account», choose «Savings and cash», write 5000 and save: the picture shows CHF 5’000.': 'Tippe auf «Wert von Hand», schreib «Sparkonto», wähle «Sparkonto und Bargeld», schreib 5000 und speichere: Das Bild zeigt CHF 5’000.',
    'Write 50 as the goal of «Savings and cash»: it says how far you are off.': 'Schreib 50 als Ziel von «Sparkonto und Bargeld»: Es sagt, wie weit du weg bist.',
  },
};

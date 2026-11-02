// «Meilensteine aktiver machen» PR 6 (Noah 01.11.2026 «alle 1-6»): rewards on every sport page
export default {
  title: 'Rewards for every sport',
  lead: 'Hang a reward from your wishlist on any star of any sport, now on every sport page',
  points: [
    { text: 'Every sport page has «Reward»: choose a star and an item from your wishlist', go: { href: '#/', steps: [{ sel: '[data-section="acts"]' }], where: 'Open a sport under Active › My sports: «Reward» under the milestones.' } },
    { text: 'The «New star» window says «Your reward» when the star carries one, and «Your next stars» on Today marks it with a gift', go: { href: '#/', where: 'Shows after a tick that reaches the star, and on Today next to the star.' } },
  ],
  test: ['Open a sport under Active › My sports: «Reward» lets you choose a star and a wishlist item.', 'Tick until that star: the window says «Your reward».'],
  since: [],
  de: {
    'Rewards for every sport': 'Belohnungen für jede Sportart',
    'Hang a reward from your wishlist on any star of any sport, now on every sport page': 'Hänge eine Belohnung von deiner Wunschliste an einen Stern jeder Sportart, jetzt auf jeder Sportart-Seite',
    'Every sport page has «Reward»: choose a star and an item from your wishlist': 'Jede Sportart-Seite hat «Belohnung»: wähle einen Stern und etwas von deiner Wunschliste',
    'Open a sport under Active › My sports: «Reward» under the milestones.': 'Öffne eine Sportart unter Aktiv › Meine Sportarten: «Belohnung» bei den Meilensteinen.',
    'The «New star» window says «Your reward» when the star carries one, and «Your next stars» on Today marks it with a gift': 'Das Fenster «Neuer Stern» sagt «Deine Belohnung», wenn der Stern eine trägt, und «Deine nächsten Sterne» auf Heute markiert ihn mit einem Geschenk',
    'Shows after a tick that reaches the star, and on Today next to the star.': 'Erscheint nach dem Haken, der den Stern bringt, und auf Heute neben dem Stern.',
    'Open a sport under Active › My sports: «Reward» lets you choose a star and a wishlist item.': 'Öffne eine Sportart unter Aktiv › Meine Sportarten: bei «Belohnung» wählst du einen Stern und etwas von der Wunschliste.',
    'Tick until that star: the window says «Your reward».': 'Hake bis zu diesem Stern ab: das Fenster sagt «Deine Belohnung».',
  },
};

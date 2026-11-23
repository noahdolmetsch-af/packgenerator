// «Neue Ordnung» Schritt 6 (Noah 21.11.2026 «1a 2a 3a 4a 5a»): Ich in four groups, a sentence on how each stands
export default {
  title: 'Me in four groups',
  lead: 'Me has four groups now, and under each heading one sentence says how it stands.',
  points: [
    { text: 'Data, Settings, Help and More: under each heading a sentence such as the last backup, language and home place, or the version', go: { href: '#/me', steps: [{ sel: '[data-stand="data"]' }, { sel: '[data-stand="settings"]' }], where: 'Me, top right.' } },
    { text: 'Tennis has no group of its own any more: the row «Offers and requests» sits under Settings', go: { href: '#/me', steps: [{ sel: 'a[data-me-row="tennis"]' }], where: 'Me › Settings.' } },
  ],
  small: [],
  test: [
    'Open «Me»: «Waiting for you» is on top, then the groups Data, Settings, Help and More.',
    'Under «Data» and «Settings» a sentence says how it stands; the row «Offers and requests» is under «Settings».',
  ],
  since: [],
  de: {
    'Me in four groups': 'Ich in vier Gruppen',
    'Me has four groups now, and under each heading one sentence says how it stands.': 'Ich hat jetzt vier Gruppen, und unter jeder Überschrift sagt ein Satz, wie es steht.',
    'Data, Settings, Help and More: under each heading a sentence such as the last backup, language and home place, or the version': 'Daten, Einstellungen, Hilfe und Mehr: unter jeder Überschrift ein Satz, zum Beispiel das letzte Backup, Sprache und Wohnort oder die Version',
    'Me, top right.': 'Ich, oben rechts.',
    'Tennis has no group of its own any more: the row «Offers and requests» sits under Settings': 'Tennis hat keine eigene Gruppe mehr: Die Zeile «Angebote und Anfragen» steht unter Einstellungen',
    'Me › Settings.': 'Ich › Einstellungen.',
    'Open «Me»: «Waiting for you» is on top, then the groups Data, Settings, Help and More.': 'Öffne «Ich»: Oben steht «Wartet auf dich», dann die Gruppen Daten, Einstellungen, Hilfe und Mehr.',
    'Under «Data» and «Settings» a sentence says how it stands; the row «Offers and requests» is under «Settings».': 'Unter «Daten» und «Einstellungen» sagt ein Satz, wie es steht; die Zeile «Angebote und Anfragen» steht unter «Einstellungen».',
  },
};

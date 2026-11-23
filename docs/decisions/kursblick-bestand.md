# Kursblick Meine Zahlen: privat auf dem Gerät, von Hand statt geraten

23.11.2026 · Auftrag: Noah «ich gebe jetzt ausdrücklich alles frei» (23.11.2026) und «alles davon» (22.11.2026) (Thread «Mockup für Kurse von Gold, SMI und Aktien»); Koordinator: K-C in einem PR, Backup vom 23.11. 04:47 zum Prüfen

- **Bestand, Ziele und der Dividendenschalter sind private Daten** und liegen als drei Einstellungen (`kurse.bestand`, `kurse.ziele`, `kurse.mitdividenden`) auf dem Gerät. Sie kommen in die Sicherungsdatei (Noahs eigene Datei) und, versiegelt mit dem Abgleich-Code, in den Abgleich zwischen seinen Geräten; der Kursdienst hört nie etwas davon ausser dem Symbol eines Titels. Nie ins Repo, nie in Tests (nur erfundene Zahlen).
- **Dividenden und Splits trägt Noah von Hand ein.** Die Gratisquellen liefern Dividenden nicht verlässlich; eine Schätzung wäre nicht prüfbar. Ein Split vervielfacht die Stück, weil die Preise der Quelle schon um Splits bereinigt sind.
- **Teuerung:** Jahreswerte der Weltbank (Konsumentenpreise der Schweiz) statt Monatswerte des Bundesamts, weil die Schnittstelle des Bundesamts vor dem Bauen nicht prüfbar war. Quelle austauschbar. Die Zeit nach dem letzten bekannten Jahr rechnet mit dem letzten Wert und sagt «Schätzung».
- **Ziele zeigen sich beim Öffnen.** Eine Mitteilung bei geschlossener App (K16) ist nicht gebaut: Sie bräuchte die Ziele auf dem Server, und Noahs Regel heisst «private Daten nie an einen Server».
- Kein Bankname und kein Konto: das Sparkonto heisst nur, wie Noah es nennt («Mein Sparkonto»). Nur Zahlen, keine Anlageberatung.

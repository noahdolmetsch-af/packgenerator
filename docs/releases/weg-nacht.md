# Weg zum Ziel: Schrittart «Nachtplan»

PR # · 07.11.2026 · Auftrag: Noah «b» vom 05.11.2026 (Thread «Planen: Nachtplan im Weg»)

## Was ist neu
- Nichts Sichtbares. Die Seite «Weg zum Ziel» (K2) zeigt die Schrittart automatisch, sobald sie in der Liste `TYPES` steht.
- `src/lib/weg/types/nacht.js`: drei Schritte, die auf die **Strategie** des Rennens zeigen (`#/race/<Rennen>/strategy`, Biwak / Hotel / durchfahren pro Nacht):
  - **Für jede Nacht einen Platz wählen** (21 Tage vor dem Start): Haken, wenn jede Nacht des Rennens einen Platz hat oder auf «durchfahren» steht.
  - **Hotels und Zimmer voraus prüfen** (14 Tage): Haken, wenn jede Nacht mit «Hotel» einen Platz hat. Gibt es keine Hotel-Nacht, bleibt der Schritt von Hand.
  - **Nächte mit dem Wetter abgleichen** (3 Tage): immer von Hand, denn die Vorhersage taugt erst wenige Tage vorher.
- Der Streifen «x von 3 geregelt» zählt diese drei Schritte (`typeProgress(goal, 'nacht', …)`).
- `tests/weg-nacht.test.js`: Vorschläge und Tage, Haken von selbst (auch mit umbenanntem Schritt), kein Zurücknehmen, freie Ziele, kaputte Daten, Link, deutsche Texte, Vorlage.
- `src/lib/weg/types/index.js`: eine Zeile mehr. Die Prüfung der Liste in `tests/weg-rennplanung.test.js` verlangt nur noch, dass «Eigener Schritt» vorne steht und «Rennplanung» dabei ist, damit weitere Schrittarten sie nicht jedes Mal brechen.

## Was fällt weg oder rutscht tiefer
- nichts (keine Oberfläche)

## Selbst entschieden
- Alle Ziel-Arten bekommen die drei Schritte vorgeschlagen (Noah «b»: auch freie Ziele). Bei einem freien Ziel ohne Rennen hakt Noah sie von Hand ab; es wird nichts Neues gespeichert.
- Die Nächte eines Rennens kommen allein aus seinen Zeiten (Start, Schlafzeit, Renndauer, Ruhetage), also ohne Strecke. Hat das Rennen keinen eigenen Start, gilt der Starttag des Ziels um 06:00.
- Ohne Rennen, ohne gespeicherte Nächte oder bei kaputten Daten antwortet die Schrittart «unbekannt» und der Schritt bleibt von Hand.
- Wie bei der Rennplanung ist die deutsche Textdatei `de/weg-nacht.js` noch nicht in `de/index.js` eingehängt: kein Text wird angezeigt, bis die Seite (K2) die Schrittarten zeigt; sie hängt dann alle ein.
- Kein Eintrag in `features.js`, keine «Was ist neu»-Datei, keine Zeile in `docs/app-stand.md`: es gibt noch keine Seite. Die Fertig-Regel kommt mit K2.

## Entscheide (für decisions.md)
- 05.11.2026: Nachtplan im Weg = drei Schritte (Plätze, Hotels, Wetter), auch für freie Ziele (Noah «b»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Idee G «Weg zum Ziel»: Schrittart «Nachtplan» gebaut, sichtbar mit der Seite (K2). `docs/vorhaben.md` und `docs/roadmap.md` ändern sich nicht.

## Prüfschritte
Nichts zu prüfen auf der Seite. Die Tests laufen auf GitHub (build, e2e desktop).

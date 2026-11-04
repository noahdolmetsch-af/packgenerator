# Alles hier bei Material

PR «Alles hier bei Material» · 03.11.2026 · Auftrag: Noah «1a» und «freigabe» (Thread «Bringe versteckte Funktionen online»)

## Was ist neu
- Oben auf **Material** (Inventar, nicht auf der Wunschliste) das Feld **«Alles hier»** mit 14 Kacheln: Liste importieren, Bausteine, Bausteine prüfen, Packliste aufräumen, Kleiderschrank, Favoriten, Wunschliste, Einkaufs- und Ladeliste, Liste teilen oder drucken, Vorrat, Strombudget, Leihliste, Doppelte zusammenführen, Leichtere Alternativen.
- «Ändern» wie bei Velos: verschieben, ausblenden mit Rückgängig, wieder zeigen, «Wie am Anfang».
- `src/lib/alleshier.js`: eine Kachel kann jetzt auch eine Seite ohne eigene Funktion in `features.js` sein (`{ id, title, href }`), z. B. Favoriten und Wunschliste.

## Was fällt weg oder rutscht tiefer
- Nichts fällt weg. Der Inhalt von Material rutscht um das Feld nach unten. Die Kacheln lassen sich unter «Ändern» ausblenden.

## Selbst entschieden
- Nicht auf der Wunschliste und nicht beim Auswählen oder Wiegen: dort stört das Feld die Arbeit.
- Fertig-Regel: ein Weg zu bestehenden Funktionen, keine neue Funktion (wie bei Velos).

## Stand im Plan
- Versteckte Funktionen: Schritt 4 von 9. Aktiv und Auswerten warten auf den Vorschlag aus dem Thread «Aktiv und Auswerten».

## Prüfschritte
1. Öffne Material: Oben steht «Alles hier». Tippe «Vorrat»: die Seite öffnet sich.
2. Öffne die Wunschliste: dort ist das Feld nicht.

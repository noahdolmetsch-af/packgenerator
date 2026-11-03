# Fragen aus deinen Daten, Stufe 2, Schritt 1: Training aus Strava

PR folgt · 03.11.2026 · Auftrag: Noah «1b 2a 3a 4a 5a», «alle Vorschläge fest einplanen» und «bau Stufe 2» (Thread «Brainstorme intelligenteren Tagescheck»)

## Was ist neu
- Zwei neue Regeln im Kasten «Fragen aus deinen Daten» (Ich › Deine Abfragen):
  - **Nach einem langen Tag unterwegs:** War eine Strava-Aktivität gestern 3 Stunden oder länger (Arbeitswege zählen nicht), fragt der Morgen-Check «Wie fühlen sich die Beine nach gestern an?» und sagt, wie lange und wie weit du unterwegs warst.
  - **Pause vom Training:** Ist das letzte erfasste Training (Strava oder ein Tennisspiel) 4 Tage her oder mehr, fragt er «Was hat dich zuletzt vom Training abgehalten?».
- Beide Regeln haben Schalter, Schwelle (Stunden 1 bis 8, Tage 2 bis 14) und eigene Worte, mit «Zurück zum Standard».
- Gibt es noch keine Strava-Aktivitäten, steht im Kasten, warum die Regeln still sind, mit Link zu Ich › Verbindungen.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- «Lang» heisst Dauer in Bewegung (nicht «hart»): Zonen und Watt sind zu unterschiedlich, die Dauer ist eindeutig. «Hart» kann später als eigene Regel kommen.
- Gefragt wird nur am Tag nach der Aktivität. Wer die App erst später öffnet, wird nicht mehr gefragt.
- Pause zählt Strava-Aktivitäten jeder Art und Tennis (gespielt oder Stunde gegeben). Ohne ein einziges Training in den letzten 40 Tagen bleibt die Regel still, weil sich dann nichts zählen lässt.
- Die Antworten sind Chips (mehrere möglich) plus Satz; «Zu wenig gegessen» und «Noch hungrig» sind Beobachtungen, keine Bewertung.
- Die App-Stand-Datei `docs/app-stand.md` liegt noch nicht auf `main` (PR #742), deshalb ist sie hier nicht angepasst. Die Funktion «Fragen aus deinen Daten» ist dort noch ohne Zeile; sie bekommt die Zeile mit dem Merge von #742 oder mit dem nächsten PR danach.
- Fertig-Regel: wie bei den anderen Regeln (Katalogeintrag, Link «Regel ändern» im Fenster, «Gut zu wissen», Hinweis im leeren Zustand, Link «Sieh, was zusammenpasst»).
- Kein Schema- oder Backup-Format geändert: es werden nur bestehende Tabellen gelesen (Aktivitäten, Sport-Einträge der letzten 40 Tage).
- Dieser PR baut auf #750 auf (gleiche Dateien). Er wird nach dem Merge von #750 auf `main` aufgesetzt.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- «Fragen aus deinen Daten», Stufe 2: Training/Strava gebaut. Offen: Tennis, Wetter, Wiederholungsschutz, Zufallsfrage, Vermutungen testen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Deine Abfragen: «Fragen aus deinen Daten» zeigt jetzt fünf Regeln, die letzten zwei sind «Nach einem langen Tag unterwegs» und «Pause vom Training».
2. Bei «Nach einem langen Tag unterwegs» die Stunden auf 2 setzen und eine eigene Frage schreiben, dann «Zurück zum Standard».
3. Warst du gestern lange unterwegs oder vier Tage ohne Training, fragt der Morgen-Check mit «Warum frage ich das?».

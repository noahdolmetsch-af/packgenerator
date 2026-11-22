# Deine Routen kennen deine Fahrten

PR folgt · 21.11.2026 · Auftrag: Noah «1a 2b 3a 4a 5a» (Thread «Ideen für bessere App und Inhalte sammeln»), Vorschlag S3 «Route kennt deine Erfahrung». «Gegenwind zuerst» (S2) hat Noah gestrichen.

## Was ist neu
- Unter der Karte einer Tour mit Route (Plan › Route) steht, welche Stücke du nach einer Fahrt als **schlecht** markiert hast und bei welchem km sie auf der Route liegen. Gute Stücke werden gezählt. Das gilt für jede Route, auch für eine importierte von Komoot, Garmin oder Strava, nicht nur für eine, die die App selbst geplant hat.
- Ein Tipp auf «Wie neu ist diese Route für mich?» zählt, wie viel der Route du noch nie gefahren bist (gleiche Regel wie «Neue Kilometer»: Strecke bekannt, wenn eine frühere Fahrt höchstens 60 m daneben lag).
- Noch keine Stücke markiert? Dann steht dort ein Satz, der erklärt, wo man sie nach einer Fahrt markiert.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Die Hinweise stehen **dauerhaft unter der Karte**, nicht nur im Fenster «Route prüfen» beim Import. Grund: so gelten sie auch für Routen, die schon gespeichert sind, und das Fenster bleibt für Fehler der Datei (Sprünge, Höhen).
- «Wie neu?» rechnet erst **nach dem Tipp**, damit die Seite nicht langsamer wird (es werden alle Fahrten gelesen).
- Nur Hinweis: nichts wird verändert, nichts gespeichert, keine neue Tabelle, keine Datenänderung.
- Wege-Gedächtnis meidet schlechte Stücke weiterhin nur beim Neuplanen in der Live-Karte; das bleibt wie es ist.

## Entscheide (für decisions.md)
- 21.11.2026: «1a 2b 3a 4a 5a»: S1 Tempo genauer, S3 Route kennt Erfahrung, S4 Erkenntnisse mit Sicherheitsangabe (nach K3), S5 Hinweise lernen, S6 Lückenliste für «Frag die App» werden gebaut; S2 «Gegenwind zuerst» gestrichen (Noah).

## Stand im Plan (roadmap.md / vorhaben.md)
- Klügere App: S3 gebaut (PR offen), danach S5, S1, S6, S4.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Öffne eine Tour mit GPX-Route, Plan › Route: unter der Karte steht eine Zeile zu markierten Stücken oder der Hinweis, wie man sie markiert.
2. Tippe «Wie neu ist diese Route für mich?»: eine Zeile nennt den Anteil, der neu für dich ist.

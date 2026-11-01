# Neuland-Runde

PR (diese Änderung) · 27.10.2026 · Auftrag: Noah «1-5 a» (Thread «Träume und Neuland prominent machen»), Idee N2

## Was ist neu
- Touren › Träume › «Weisse Flecken in der Nähe»: ein angetippter Ort zeigt den Knopf «Runde hindurch».
- Das Fenster «Neuland-Runde» (`src/lib/neuland/SpotRoundSheet.svelte`, Logik `src/lib/neuland/runde.js`) fragt den freien Velo-Router (BRouter) einmal: eine Runde von zu Hause durch den Ort und auf anderem Weg zurück. Es zeigt km, Höhenmeter und Zeit.
- «Als Tour planen» macht eine Schnellstart-Tour mit dieser Runde (Rückgängig löscht sie), «GPX fürs Garmin» lädt die Runde, «Andere Seite» fährt andersherum.
- Neue Funktion im Katalog: `f.nlround`.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Die Runde ist ein Dreieck: zu Hause → Ort → ein Punkt 35° daneben auf 70 % der Entfernung → zu Hause. So ist der Rückweg ein anderer.
- Wie bei der Überraschungsrunde: eine Anfrage pro Tipp, nie im Hintergrund, Profil «trekking», Tempo «Neugierig» (19 km/h).
- Die Tour bekommt die Stunden aus der Fahrzeit (auf halbe Stunden gerundet).
- Der Knopf erscheint auch bei Orten, an denen du schon warst (eine Runde dorthin kann trotzdem neu sein).

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- «Träume und Neuland»: Schritt 4 von 20 (N2). Als Nächstes N13 «Ein Link wird ein Traum».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Träume öffnen, zu «Weisse Flecken in der Nähe» scrollen und einen Ort in der Liste antippen.
2. «Runde hindurch» antippen: km, Höhenmeter und Zeit erscheinen.
3. «Als Tour planen» antippen: eine neue Tour mit dieser Runde öffnet sich (Rückgängig löscht sie).

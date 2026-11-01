# Velos ausmustern

PR (Velos ausmustern, Schritt 1 von 2) · 1.11.2026 · Auftrag: Noah «velos ausmustern, archivieren und löschen», Antworten «1-5 a»

## Was ist neu
- Im «…»-Menü eines Velos: «Velo ausmustern» mit Grund (verkauft, verschenkt, defekt, anderer), Tag und Notiz. Mit «Rückgängig».
- Ausgemusterte Velos stehen eingeklappt ganz unten bei Velos, mit «Zurückholen» und «Bearbeiten» (dort bleibt «Löschen»).
- Sie fehlen überall, wo man ein Velo wählt (neue Tour, Pflege, km-Import, Verschleiss, Neu-Menü, Schnellnotiz, Standard-Velo). Touren, km, Besuche und Auswertungen bleiben unverändert.
- Gespeichert wird `bike.retired = { at, reason, note }` und `archived: true` (das Feld, das viele Seiten schon ausblenden). Kein Schema-Umbau, Backup und Sync nehmen das Feld wie alle anderen mit.

## Was fällt weg oder rutscht tiefer
- Nichts. Ausgemusterte Velos sind nur nicht mehr in den Auswahl-Listen.

## Selbst entschieden
- Der Verkaufstext (`SellPage`) und die Fotos (`WearPhotos`) filtern nicht, damit man für ein verkauftes Velo noch den Text und die Bilder findet.
- «Archiviert» (alte Daten mit `archived`) zeigt der Bereich ohne Grund an.

## Entscheide (für decisions.md)
- 1.11.2026: Ausmustern und Archivieren sind eins; Auswertungen zählen ausgemusterte Velos weiter; Auswahl-Listen zeigen sie nicht; Bereich unten eingeklappt; Löschen bleibt wie bisher (PR 2: klarere Warnung).

## Stand im Plan (roadmap.md / vorhaben.md)
- Schritt 2: Löschen mit Warnung «daran hängen N Touren …» und Hinweis «Besser ausmustern?».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Velos öffnen, beim Velo «…» › «Velo ausmustern» › bestätigen: das Velo verschwindet aus der Reihe.
2. Unten «1 ausgemustertes Velo» öffnen › «Zurückholen»: es ist wieder da.

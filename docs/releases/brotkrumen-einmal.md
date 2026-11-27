# Der Pfad nennt die Seite nur einmal

PR · 27.11.2026 · Auftrag: Noah (impeccable-Fund F-10 vom 26.11., 27.11. «gerne normal einreihen»)

## Was ist neu
- Über der Seite «Wi gaht's?» stand der Pfad «Auswerten › Verlauf › Wi gaht's? › Wi gaht's?»: der Reiter und die Seite haben denselben Namen. Jetzt steht dort «Auswerten › Verlauf › Wi gaht's?», die Seite zuletzt.
- Die Regel gilt für jede Seite, deren letzter Pfad-Schritt ihren eigenen Namen trägt, nicht nur für «Wi gaht's?».

## Was fällt weg oder rutscht tiefer
- Der doppelte letzte Pfad-Schritt fällt weg. Der Reiter «Wi gaht's?» ist damit nur noch als Seitentitel zu sehen, nicht mehr als Link im Pfad.

## Selbst entschieden
- Die Regel steht an einer Stelle (`withoutPage`, `src/lib/nav/wege.js`), nicht auf der einzelnen Seite, damit der Fehler nirgends wiederkommt.
- Die Zeile `Crumb` der Aktiv-Seiten bleibt unverändert: auf dem Handy zeigt sie nur den letzten Schritt, der dort nicht doppelt ist.
- Keine Datenänderung, kein Schema, kein `api/`.

## Entscheide (eigene Datei `docs/decisions/brotkrumen-einmal.md`)
- 27.11.2026: Die Seite steht im Pfad nur einmal.

## Stand im Plan (roadmap.md / vorhaben.md)
- Keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Verlauf › «Wi gaht's?» öffnen: der kleine Pfad über dem Titel lautet «Auswerten › Verlauf › Wi gaht's?».
2. Eine andere Seite mit Pfad öffnen (z. B. Ich › Darstellung): der Pfad ist wie zuvor.

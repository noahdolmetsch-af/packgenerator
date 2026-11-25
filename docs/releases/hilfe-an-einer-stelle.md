# Hilfe an einer Stelle: das «?»

PR #<Nummer> · 09.11.2026 · Auftrag: Noah «ja, 1-3» zu den Durchklick-Funden vom 08.11.2026 abends (Fund 1: «?» auf 132 von 155 Adressen leer, zwei Hilfe-Systeme), Thread «Hilfe-Karte nach dem Titel setzen»

## Was ist neu
- Das «?» oben ist die **eine Hilfe-Stelle** jeder Seite. Es zeigt jetzt auch den Inhalt der bisherigen Karte «Was du hier tun kannst»: jede Funktion der Seite mit «wofür», «Gut zu wissen» und «So geht's» (Schritte und Beispiel), die ersten vier und «Alle n zeigen». Vorher war das «?» auf 132 von 155 Adressen leer («Diese Seite hat noch keine eigene Hilfe»).
- Auf der Seite bleibt hinter dem Titel **nur eine Zeile** «Was du hier tun kannst · Hilfe öffnen». Ein Tipp darauf öffnet das «?»-Fenster. Der Punkt «n neu» an der Zeile bleibt (neue Funktionen seit dem letzten Öffnen).
- **Heute** bekommt einen Hilfetext im «?» (was die Seite zeigt, wo der Rest ist, wie man Teile ausblendet) und die Funktionen, die dort wohnen.
- Technik: neue Liste `src/lib/ui/SeitenInhaltListe.svelte`; `HelpButton.svelte` lädt Tipps und Schritte beim ersten Öffnen; `helpRows()` in `src/lib/seiteninhalt.js`; die Seite, die die App zeigt, kommt über `helpHere.route` ins «?» (manche Adressen führen auf eine andere Seite weiter).

## Was fällt weg oder rutscht tiefer
- Die aufklappbare Karte auf der Seite (mit «Einklappen» und der Wahl pro Seite): sie ist jetzt das «?»-Fenster. Der Inhalt bleibt vollständig, ein Tipp mehr bis zu ihm als vorher (Zeile → Fenster).
- Ich › Aussehen › «Karten auf den Seiten» («Alle Karten wieder einklappen»): entfällt, es gibt nichts mehr einzuklappen. Alte gespeicherte Wahlen (`seiteninhalt.folded`) bleiben unbenutzt in der Sicherung liegen und stören nicht.
- Im «?» steht die Funktionsliste der Seite vor der alten Liste «Das kann die App hier»; Funktionen, die in beiden stehen, erscheinen nur einmal.

## Selbst entschieden
- Die Zeile bleibt auf der Seite (statt sie ganz zu entfernen), damit die Hilfe dort gefunden wird, wo man sie braucht («oben nur eine Zeile», Vorschlag der Durchklick-Auswertung).
- Kein neues Hilfe-System: das «?» und seine Seitenhilfe (Hinweiskarte, «Das kann die App hier») bleiben, die Karte zieht dorthin um.
- Rund 23 Adressen ohne Karte und ohne Seitenhilfe (z. B. Fenster, Live-Karte) zeigen im «?» weiter «Diese Seite hat noch keine eigene Hilfe»; sie kommen mit eigenen Texten später.

## Entscheide (für decisions.md)
- 09.11.2026: Eine Hilfe-Stelle pro Seite, das «?»; auf der Seite nur eine Zeile (Noah «ja, 1-3»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Durchklick 08.11.2026 abends, Fund 1: erledigt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Planen › Notizen: hinter dem Titel steht die Zeile «Was du hier tun kannst». Tippen öffnet das «?»-Fenster mit den Funktionen der Seite.
2. Heute: «?» oben antippen: ein Hilfetext und die Funktionen von Heute.
3. Irgendeine andere Seite (Woche, Tagebuch, Velos › Pflege): «?» ist nicht mehr leer.

# Nächstes Wasser auf der Live-Karte

PR (diese Änderung) · 03.11.2026 · Noah 02.11. Vorschlag 2 («a»), 03.11. «freigabe bitte fortfahren»; Ziel 6 «Lange Fahrten unterwegs verstehen»

## Was ist neu
- Bei den «Stopps» der Live-Karte (mit Strecke) neu die Karte «Nächstes Wasser» (`water.js`): der nächste Hahn, Brunnen oder offene Laden vor dir mit Abstand und Ankunft, dazu ein Satz, ob die Flasche bis dorthin reicht («reicht», «reicht knapp», «reicht nicht»).
- Ein Laden zählt nur, wenn er bei deiner Ankunft offen ist (unbekannte Zeiten: «nicht sicher»); Hahn und Brunnen zählen immer.
- «Wie viel ist noch in deiner Flasche?»: Voll, Halb, Fast leer. Unter «Flasche und Trinken ändern» stellst du Flaschengrösse (Standard 1500 ml) und Trinken pro Stunde (Standard 500 ml, 0 = automatisch) selbst ein. Alles bleibt in diesem Browser.
- Ist vor dir nichts, steht, wie weit die Flasche reicht.

## Was fällt weg oder rutscht tiefer
- nichts. Eine Karte mehr oberhalb der Stopps-Liste.

## Selbst entschieden
- Annahme 500 ml pro Stunde, mit Reserve von einem Viertel für «reicht» (darunter «reicht knapp»). Alles ist änderbar.
- Wärme (mehr trinken) ist im Rechner vorbereitet (`drinkPerH`), wird in diesem PR noch nicht aus dem Wetter gefüttert.
- Gespeichert wird nur im Browser (kein Schema-Wechsel). Keine neue Funktion in `features.js`: es ist eine Karte auf der Live-Karte.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Vorschlag 2 gebaut; danach Notfall-Bett/Ausstieg, Kälte/Regen, Licht/Akku, Schritt 6 «Offline».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Live-Karte mit Strecke starten, bei den Stopps: die Karte «Nächstes Wasser» nennt den nächsten Ort und sagt, ob die Flasche reicht.
2. «Fast leer» antippen: der Satz ändert sich. «Flasche und Trinken ändern» öffnen und die Grösse einstellen.

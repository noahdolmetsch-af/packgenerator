# Nebelgrenze am Morgen

Auftrag: Noah «1a sonst „heute kein hochnebel - time to shine“, 2b, 3a» (Thread «Nebelgrenze beim Wetter anzeigen», Idee a nach PR Nebelgrenze).

## Was ist neu
- Eine Push-Nachricht um 07:00, von Oktober bis Februar, für den Wohnort: «Hochnebel bis ca. 800 m, ab 900 m Sonne.» Bei Nebel mit Wolken darüber: «Hochnebel bis ca. 800 m, darüber Wolken.» Ohne Nebel: «Heute kein Hochnebel - time to shine.» (Noah «1a»).
- Bei Sonne über dem Nebel nennt sie eine Fahrt von dir, die über den Nebel führt: «Ausfahrt über dem Nebel: Albis (bis 900 m).» Gemeint sind deine Touren mit Route, deren Start höchstens 60 km vom Wohnort liegt und deren höchster Punkt mindestens 100 m über der Nebelgrenze liegt, die nächste zuerst (Noah «2b»).
- Eigener Schalter «Nebelgrenze am Morgen» unter Ich › Push-Erinnerungen, Standard an, sobald Push an ist (Noah «3a»). Braucht den Wohnort.
- Der Server rechnet die Nebelgrenze mit derselben Regel wie die App (Luftschichten um 08:00); `tests/push-fog.test.js` hält beide gleich.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- «Sonst time to shine» gilt für Tage ohne Hochnebel. Bei Nebel mit Wolken darüber sagt die Nachricht die Wahrheit («darüber Wolken»), nicht «time to shine».
- Standard an: nur wenn Push selbst an ist (vorher kommt nichts). Dafür gilt für diesen Schalter die Ausnahme von «alles aus am Anfang»; `tests/push-schedule.test.js` und `tests/glaette.test.js` sind darauf angepasst (der Nebel-Schalter wird dort ausgeschaltet, wo es um anderes geht).
- Die Nachricht kommt um 07:00 (Glätte 06:30), die Rechnung nimmt 08:00 als Bezug, weil der Nebel dann meist noch steht. Die nächsten 7 Morgen werden vorgeplant, wie bei Glätte.
- Der Schalter steht ganz unten in der Liste der Push-Erinnerungen, damit die anderen Schalter ihren Platz behalten (der Wächter «jede Funktion ist auf ihrer Seite sichtbar» misst, wie weit unten «Anmeldung zum Rennen» steht).
- Von Oktober bis Februar (Hochnebelzeit), kein eigener Schalter für die Monate.
- Fahrt-Vorschläge nur aus Touren mit Route (die Höhe kennt die App nur dort). Die Namen gehen wie bei Tourtiteln an den eigenen Server.
- Neues in `api/_lib/push.js` und `api/push.js` (bestehende Dateien, keine neue unter `api/`): nach dem Merge den Vercel-Server «packgen» auf READY prüfen.
- Keine neue Funktion in `features.js`: gehört zu den Push-Erinnerungen.

## Entscheide (für decisions.md)
- 05.11.2026: Nebelgrenze am Morgen als Push mit Schalter, Standard an, mit Fahrt-Vorschlag über dem Nebel (Noah «1a 2b 3a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Wetter: Idee «Morgens-Hinweis» umgesetzt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Push-Erinnerungen: der Schalter «Nebelgrenze am Morgen» steht da (an, wenn Push an ist).
2. Am nächsten Morgen (Oktober bis Februar) um 07:00: eine Nachricht zur Nebelgrenze oder «time to shine». Dazu brauchst du Push an und den Wohnort.
3. Tipp auf die Nachricht öffnet die Wetterseite.

# Sammlungen: «In meine Sammlungen übernehmen»

PR #<Nummer> · 07.11.2026 · Auftrag: Noah «a» (Thread «Bauen: Freie Zeit Teil 1»), Rest aus «Sammlungen: teilen, drucken, Tour»

## Was ist neu
- Auf der geteilten Seite (`#/share/sammlung/…`) steht «In meine Sammlungen übernehmen». Ein Tippen legt die Sammlung als eigene Sammlung an (Typ «Eigene Sammlung», Name wie geteilt) mit allen Einträgen. Die ausgefüllten Felder stehen als Zeilen «Feld: Text» im Textfeld des Eintrags.
- Danach steht «Übernommen als …» mit «Öffnen» (führt in die Sammlung). Die Meldung hat «Rückgängig»: die Sammlung und ihre Einträge sind wieder weg.
- Nur der Text kommt mit: keine Fotos, keine Positionen, keine Tour (das war schon nie im Link).

## Was fällt weg oder rutscht tiefer
- nichts. Das blosse Öffnen der Seite liest und schreibt weiter nichts auf dem Gerät.

## Selbst entschieden
- Immer eine neue Sammlung, nie in eine bestehende hinein: so geht nichts durcheinander, umbenennen, ordnen und löschen geht wie bei jeder eigenen Sammlung.
- Typ «Eigene Sammlung» statt des Typs des Absenders: der Link trägt nur Beschriftungen, keine Feldschlüssel. Aus «Zutaten: Pasta» wird darum eine Zeile im Text.
- Zweimal tippen legt nur eine Sammlung an; ein erneutes Öffnen des Links und Übernehmen legt eine zweite an (bewusst, die Seite weiss nichts von früheren Übernahmen).
- Keine neue Funktion in `features.js` (Ergänzung zu «Meine Sammlungen»); Absprung ist der Link selbst.
- Speicher: nur die bestehenden Wege (Einstellung `frei`, Tabelle `frei`, Zeilen kind `entry`): kein neues Schema, nichts Neues im Backup.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Eine Sammlung mit Eintrag öffnen, «Als Seite teilen», den Link öffnen.
2. «In meine Sammlungen übernehmen» tippen, dann «Öffnen»: die Sammlung steht in deiner Liste.
3. «Rückgängig» in der Meldung: die Sammlung ist wieder weg.

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- Freie Zeit, Ergänzung «Sammlungen»: «In meine Sammlungen übernehmen» gebaut; offen bleibt der Absprung von der Tour-Seite zur verknüpften Sammlung.

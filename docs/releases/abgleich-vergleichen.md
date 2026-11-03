# Abgleich vergleichen

Auftrag: Noah 03.11.2026 «a» (Thread «Abgleich und Datenverlust Smartphone»): das Velo «Canyon Lux» fehlte auf dem Handy, die Ursache war nicht sicher.

## Was ist neu
- Ich › Daten und Backup › Handy und Computer: Knopf «Mit dem Server vergleichen». Er liest den Server (ohne etwas zu ändern) und zeigt mit Namen, was hier oder auf dem Server fehlt.
- «Fehlendes ergänzen» holt Fehlendes auf dieses Gerät und schickt Fehlendes zum Server. Nur Hinzufügen.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Auf dem anderen Gerät gelöschte Einträge werden nur genannt, nicht zurückgeholt (könnte Absicht sein).
- Kein Schema-Wechsel, nichts gelöscht oder überschrieben, keine neue Datei unter api/.
- Keine neue Funktion in features.js: gehört zu «Abgleich» (f.sync).

## Warum
Der Abgleich schickt nur, was er als geändert kennt. Ein Eintrag, den der Server nie bekam oder verlor, wird nie nochmals geschickt, und die Runde meldet trotzdem «Fertig». Der Vergleich macht das sichtbar.

## Prüfschritte (nach dem Merge)
1. Ich › Daten und Backup › Handy und Computer › «Mit dem Server vergleichen».
2. Auf dem Handy und auf dem Computer je einmal. Fehlt «Canyon Lux», steht es in der Liste.
3. «Fehlendes ergänzen» tippen, danach «Jetzt abgleichen».

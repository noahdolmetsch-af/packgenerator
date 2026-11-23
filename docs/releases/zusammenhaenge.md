# Zusammenhänge ab 20 Mal

Auftrag: Noah «1a 2a 3 gym normalfall 1h sonst a 4b 5a» (22.11.2026, Thread «Alle Sportarten und Erholung», Schritt L); «alles freigegeben» 23.11.2026

## Was ist neu
- Im Wochenrückblick (unter «Körper diese Woche») steht die Karte «Was in deinen Tagen zusammenpasst»: die Nacht nach Sauna, Meditation und Ähnlichem (den drei am häufigsten abgehakten Ritualen) gegen die anderen Nächte, Tiefschlaf in Minuten; und das Schlafgefühl («Wie hast du geschlafen?») gegen die Schlafminuten der Uhr.
- Eine Zeile spricht erst ab 20 Mal («Nach Sauna: Tiefschlaf 90 Min. gegen 60 Min. in den anderen Nächten (22 Mal)») und nennt, wie sicher es ist («Ziemlich sicher», «Wahrscheinlich», «Noch nicht sicher: kein klarer Unterschied»). Davor steht nur «Noch 14 Mal (6 bisher)».
- «So gerechnet» (zugeklappt) erklärt die Rechnung: Mittel der Nacht nach dem Ritual gegen alle anderen Nächte der letzten zwölf Monate (nur von der Uhr gemessene Nächte); die Sicherheit kommt aus dem Unterschied gegen die Schwankung (Welch-t): ab 2 «wahrscheinlich», ab 2,6 «ziemlich sicher».
- Rein lesend (`src/lib/flow/zusammenhang.js`), keine neue Einstellung, kein Schema.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- «Nach dem Ritual» heisst: die Nacht, die am Morgen nach dem Tag endet (Fitbit-Datum des Folgetags), wie bei «Was auffällt».
- Ritual = Aktivität in den Ringen Ruhe oder Geist; Haken von Tourtagen zählen nicht. Höchstens drei Rituale, die meistabgehakten zuerst.
- Beim Schlafgefühl zählt «über deinem eigenen Median» als erholt; bei vielen gleichen Antworten zählt der Median selbst zur guten Seite. Unterscheiden sich die Antworten kaum, steht das da, statt etwas zu rechnen.
- Die Karte erscheint nur, wenn mindestens ein Ritual abgehakt oder eine Schlafantwort da ist. Sie sagt nie «gut» oder «schlecht»; Zusammen heisst nicht verursacht.

## Entscheide (eigene Datei `docs/decisions/zusammenhaenge.md`)
- 22.11.2026: Zusammenhänge erst ab 20 Mal, mit Sicherheitsangabe und «So gerechnet»; bis dahin «Noch N».

## Stand im Plan (roadmap.md / vorhaben.md)
- Alle Sportarten und Erholung: L erledigt (J, K, L alle gebaut; D «Im Fokus» und E Heute-Kacheln bleiben offen).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Wochenrückblick: Karte «Was in deinen Tagen zusammenpasst» mit deinen Ritualen: «Noch N Mal» oder Zahlen mit «So sicher».
2. «So gerechnet» antippen: die Rechnung steht da.

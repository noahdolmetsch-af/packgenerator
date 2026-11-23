# Form und Erholung, klarer

PR #(folgt) · 23.11.2026 · Auftrag: Noah «ja» auf den 5-Punkte-Plan (Thread «Form und Erholung klüger machen»)

Auslöser: Noah fragte «was fällt dir auf und wie können wir das ganze noch besser und intelligenter und nützlicher machen» zur Seite Auswerten › Körper › Form und Erholung. Sie widersprach sich: oben 42 «Locker», in «Was heute zählt» «Du bist frisch», obwohl die HRV 42 % unter dem Normal lag und die Nacht 3 h 55 hatte; «Was auffällt» sagte «Nichts fällt auf», weil es nur den Ruhepuls ansah.

## Was ist neu
- **Eine Antwort für heute (Punkt 1):** ganz oben, aus Schlaf, HRV, Ruhepuls, «Wi gaht's?» und Form zusammen. Sind zwei oder mehr Erholungswerte deutlich tief (je mindestens 8 Punkte unter null), geht sie höchstens auf «locker»; ziehen sie zusammen 30 Punkte oder mehr nach unten, heisst es «Heute Ruhe oder eine lockere halbe Stunde», auch bei guter Form. Ein einzelner sehr tiefer Wert (15 Punkte) nimmt «bereit» auf «normal» zurück. Darunter stehen die Sätze der Werte, die zählen («HRV 42 % unter deinem Normal», «Geschlafen 3 h 55»), und, wenn die Form gut ist, «Deine Form ist gut, aber diese Werte wiegen heute mehr». Die Antwort hebt nie an, sie senkt nur. Dieselbe Antwort steht auf der Karte in Auswerten und unter «Dein Stand» im Training, damit sie sich nirgends widerspricht.
- **«Was auffällt» für alle Werte (Punkt 2):** steht direkt unter der Antwort, schaut auf Ruhepuls (wie bisher), HRV (letzte 3 Tage 15 % unter dem Normal, oder der neueste Wert 25 % darunter) und Schlaf (letzte Nächte 60 Min unter dem Normal, oder die letzte Nacht 120 Min darunter oder unter 5 h). Die Frage «Marker setzen?» kommt einmal für alle Beobachtungen. Sonst steht «Nichts fällt auf: Ruhepuls, HRV und Schlaf der letzten Tage liegen in deinem Normal.»
- **Tour-Bereitschaft nur bei einer Tour (Punkt 3):** der Abschnitt erscheint nur, wenn eine Tour läuft oder in 7 Tagen beginnt. Die erfundenen Beispiel-Touren («Jura-Runde (Beispiel)», «Seerunde (Beispiel)») zählen nie.
- **«Was wäre, wenn» als Sätze (Punkt 4):** Tag wählen, dann je Einheit ein Satz: «Kurz: 45 Min: Nach einer Woche ist deine Form etwa gleich wie mit einer Pause (ein Modell).» Minuten, Zone, Fitness/Müdigkeit/Form und die Tabelle mit den Spannen stehen unter «Anpassen und alle Zahlen sehen».
- **Verlauf zeigt zuerst nur die Form (Punkt 5):** Fitness, Müdigkeit und Ruhepuls schaltest du mit den Feldern über dem Diagramm zu. Jahre ohne Fahrten sind keine Tabellenzeile mehr unter «Form im Vergleich zu früher», sie stehen in einer geschlossenen Zeile («Jahre ohne Fahrten: 2021») mit Ruhepuls und Stunden.
- Neu: `src/lib/flow/form/tagesantwort.js`, `auffaellt-werte.js` (rein, getestet in `tests/form-antwort.test.js`), `tests/e2e/form-klueger.spec.js`.

## Was fällt weg oder rutscht tiefer
- Der Satz «Locker: Heute passt eine lockere Fahrt» allein oben: ersetzt durch die Antwort mit ihren Gründen.
- «Was auffällt» rutscht von weit unten (nach der Tour-Bereitschaft) direkt unter die Antwort.
- Die vier Linien im Verlauf sind nicht mehr alle sofort sichtbar: alter Weg: alle an; neuer Weg: nur Form, die anderen mit einem Tipp auf Fitness, Müdigkeit oder Ruhepuls.
- «Was wäre, wenn»: Minuten, Zone, Wahl Form/Müdigkeit/Fitness und die Zahlentabelle mit Spannen rutschen hinter «Anpassen und alle Zahlen sehen» (vorher immer offen).
- Tour-Bereitschaft ohne Tour in 7 Tagen: der Abschnitt fehlt (vorher: Hinweis «Keine Tour in den nächsten 7 Tagen» und frühere Touren). Die früheren mehrtägigen Touren zum Vergleichen erscheinen wieder, sobald eine Tour in 7 Tagen ansteht; die Touren selbst bleiben unter Touren.
- Jahre ohne Fahrten: von der Tabellenzeile in eine geschlossene Zeile; Ruhepuls und Stunden bleiben dort sichtbar.

## Selbst entschieden
- Die Grenzen (−8 Punkte «deutlich tief», −30 Punkte zusammen = Ruhe, −15 = ein sehr tiefer Wert) sind Annahmen aus der bestehenden Punkterechnung (`recoveryParts`), keine Medizin; die Antwort bleibt ein Vorschlag, keine Diagnose. Der Wert 42 selbst wird nicht verändert (andere Seiten nutzen ihn).
- Die Antwort steht auch auf der Karte in Auswerten und unter «Dein Stand»: dieselben zwei Sätze, damit die App sich nicht widerspricht. Die Trainingsvorschläge («Heute passt», Wochenvorschlag) rechnen weiter mit der alten Stufe; sie anzugleichen wäre ein eigener Schritt.
- «Was auffällt» meldet auch einen einzelnen sehr schlechten neuesten Wert (HRV, Schlaf): der Morgen zeigt genau diesen. Der Marker-Dialog bekommt den Zeitraum aller Beobachtungen.
- Jahre ohne Fahrten blendet die Seite nicht aus, sondern faltet sie ein (Regel «nichts darf wegfallen»; 2021 hatte noch einen Ruhepuls).
- Fertig-Regel: kein neuer Eintrag in `features.js` (keine neue Funktion, nur klarere Seite); «Gut zu wissen» und Einstieg unverändert; Zeile in `docs/app-stand.md` angepasst.
- Daten: keine Änderung an Speicher, Backup oder Sync (nur Anzeige), daher kein Backup nötig; Noahs Kopie vom 23.11. wurde nicht gebraucht.

## Entscheide (eigene Datei `docs/decisions/form-klueger.md`)
- 23.11.2026: Eine Antwort für heute, die nie anhebt; «Was auffällt» für alle Werte; Tour-Bereitschaft nur bei einer Tour.

## Stand im Plan (roadmap.md / vorhaben.md)
- Gehört zu Ziel «Eine App, die mich im Alltag unterstützt». Kein Plan geändert.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Körper › Form und Erholung: Oben steht eine Antwort. Heute (HRV tief, kurze Nacht) sollte «Heute Ruhe oder eine lockere halbe Stunde» stehen, mit den Werten darunter.
2. Direkt darunter «Was auffällt»: HRV und Schlaf sind genannt; «Marker setzen» öffnet das Fenster mit dem heutigen Tag.
3. «Verlauf» zeigt nur die Form; tippe auf Fitness, Müdigkeit, Ruhepuls, dann erscheinen die Linien.
4. «Was wäre, wenn …» zeigt zwei Sätze; «Anpassen und alle Zahlen sehen» öffnet die Tabelle. Ohne Tour in 7 Tagen fehlt «Tour-Bereitschaft» (keine Beispiel-Tour).

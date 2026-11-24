# Suche als Entdecker

Auftrag: Noah «1-5a» (Auftrag «Klarheit und Auffindbarkeit ab erstem Öffnen», Punkt V4; Thread «Versteckte Inhalte sichtbar machen bauen»).

## Was ist neu
- Die **leere Suche** zeigt zuerst «Das suchen viele»: sechs Wünsche zum Tippen (Abhaken, Packliste, Tourenvorschläge, Meilensteine, Velopflege, Wetter). Ein Tipp sucht danach in der Sprache der App.
- Darunter «Zuletzt geöffnet» und die letzten Suchwörter wie bisher; die **Befehle zum Ausprobieren** stehen hinter «Befehle zeigen» (zugeklappt).
- **Treffer sagen den Weg** aus derselben Quelle wie die Leiste (`nav.js`): bei Seiten und bei Funktionen steht «Auswerten › Fahrten» statt der alten Gruppe (Funktionen: vorher die Lage in der Tour, zum Beispiel «Nach der Tour»).
- Unter Treffern für Seiten und Funktionen steht «Nicht das Richtige? Karte der App › · Alle Funktionen ›».

## Was fällt weg oder rutscht tiefer
- Die drei Befehle («Kette geölt …», «Notiz …», «Tagestour») stehen nicht mehr offen, sondern hinter «Befehle zeigen» (ein Tipp tiefer). Sie funktionieren unverändert, auch wenn man sie tippt.
- Bei Funktionen steht unter dem Treffer der Weg statt der Situation («Vor der Tour»); die Situation ist weiter im Katalog.
- Sonst nichts.

## Selbst entschieden
- Die Zeile «+ als neues Material erfassen» bleibt wie sie ist: viele Tests und Wege hängen daran, und eine Wörterliste für «Material-Wörter» wäre geraten. Dafür führt die neue Zeile «Nicht das Richtige?» bei Seiten- und Funktionstreffern zur Karte.
- «Frag die App» steht schon ganz oben in den Treffern, wenn der Assistent an ist (Noah 15.10.2026 «3 a und b»); die Zusammenlegung von Assistent und Suche mit den Reitern «Finden | Fragen» gehört zum Auftrag «App aus Nutzersicht», Punkt 5, und kommt dort.
- Die sechs Wünsche sind fest; sie sind kein Katalog (kein eigener Zähler, keine Wertung).
- Keine Datenänderung.

## Entscheide
- Siehe `docs/decisions/karte-skizze.md` (V5).

## Stand im Plan
- Klarheit und Auffindbarkeit: V4 (Suche als Entdecker) und V5 (Ein Ort pro Seite) gebaut; V1 bis V3 baut ein anderer Thread.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Das Suchfeld antippen: «Das suchen viele» mit sechs Wünschen steht zuoberst.
2. «Meilensteine» antippen: der Treffer sagt «Auswerten › Fahrten».
3. «Befehle zeigen» antippen: die drei Befehle erscheinen.

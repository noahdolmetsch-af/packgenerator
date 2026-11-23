# Körperwerte: Hinweis, wenn die übliche Spanne fehlt

PR · 23.11.2026 · Auftrag: Noah «fehler?» (Thread «Diagramme überall verbessern»); Nachtrag zu «Körperwerte: übliche Spanne und ein Satz»

## Was ist neu
- Auswerten › Körper › Körperwerte: hat eine Kurve (Puls, HRV, VO2max …) zu wenige Werte für «Deine übliche Spanne», steht unter dem Diagramm eine ruhige Zeile «Zu wenige Werte für deine übliche Spanne (ab 10 Werten)». Vorher fehlte das Band ohne Erklärung.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Die Zeile steht unter dem Diagramm, nicht darüber (Content first), und nur dort, wo auch ein Band stehen würde (nicht bei Gewicht, Bettzeit, Hauttemperatur).
- «ab 10 Werten» statt «ab 10 Tagen», weil im Zeitraum «1 J» ein Punkt ein Monat ist.

## Entscheide (eigene Datei)
- Keine neuen; gehört zu `docs/decisions/diagramme-gewicht-satz.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- Nichts geändert.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Körper › Körperwerte › Puls, Zeitraum «7 Ta.»: unter dem Diagramm steht «Zu wenige Werte für deine übliche Spanne (ab 10 Werten)».
2. Zeitraum «4 Wo.»: die Zeile ist weg, das Band liegt hinter der Linie (wenn du 10 Tage mit Wert hast).

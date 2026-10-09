# Arbeitsweise: so entsteht jeder Release

Gilt ab 9.10.2026, 23:26, für alle folgenden Releases. Quelle: Noahs Anweisung im Projekt-Chat. Ersetzt den «Schnellmodus» vom 9.10.2026 (mehrere Pakete gleichzeitig, Mockups nur für ganz neue Seiten).

## 1. Nur ein Paket, höchstens zwei gleichzeitig

- Es läuft ein Paket, in Ausnahmefällen zwei. Ein Paket ist gebaut, getestet und als Pull Request offen oder in Arbeit.
- Ein neues Paket beginnt erst, wenn ein offenes gemergt oder abgebrochen ist.
- Die drei am 9.10.2026 schon gebauten Pakete (Material-Detail, Velo-Masse, Bausteine) werden noch fertig gemacht; danach gilt die Regel ohne Ausnahme.

## 2. Vor jedem Release: Mockups, Prüfung, a/b-Fragen

Kein Release wird gebaut, bevor diese Schritte erledigt sind:

1. **Mockups** für jeden Screen, Dialog und Zustand, den der Release neu macht oder sichtbar ändert. Computer (1440) und Handy (390), hell und dunkel. Auch kleine Änderungen an bestehenden Seiten bekommen ein Mockup.
2. **Noah prüft** die Mockups.
3. **a/b-Fragen:** zu jedem offenen Punkt eine Frage mit Optionen a/b, die Empfehlung mit ★ markiert, höchstens rund 10 Fragen pro Runde.
4. **Bauen** erst nach Noahs Antworten. Was Claude danach noch selbst entscheidet, steht im Pull Request unter «Selbst entschieden».

Damit gilt wieder die Regel aus [Design-Audits](design-audit.md): vor jedem neuen oder geänderten Screen zuerst ein Mockup, Noah gibt es frei.

## 3. Freigabe bleibt bei Noah

- Claude merged nie selbst. Claude öffnet den Pull Request, bringt die Tests auf Grün und gibt Noah den Link, die Testschritte und die Klicks «Merge pull request» → «Confirm merge».
- Jeder Pull Request hat eine Trello-Karte in «PG · Zur Freigabe» mit Link, Vorschau-Link und Testschritten. Nach dem Merge wandert sie nach «PG · Zu testen».

## 4. Unverändert

- Dokumentationsregel für jeden Release-PR (siehe [Projektdokumentation](README.md#dokumentationsregel-für-jeden-release-pr)).
- Keine persönlichen Daten im öffentlichen Repository; Tests und Bilder nutzen nur erfundene Daten.
- Alles in der App ist ein Vorschlag, nie zwingend, immer änderbar und abwählbar.

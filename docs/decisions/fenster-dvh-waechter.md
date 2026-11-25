# Fenster nie abgeschnitten

- **24.11.2026 (Noah «a und b», nach dem Bild des Fensters «Wi gaht's? am Abend», das mitten in der dritten Frage endete):** Jedes Fenster passt in den Bildschirm. Kopf und Fuss mit dem Hauptknopf bleiben fest, nur die Mitte scrollt, ein weicher Rand zeigt, dass es weitergeht (a). Dazu prüft ein Wächter jedes geprüfte Fenster bei Handy 390, Laptop 1440×800 und Computer 1440×900 (b): Hauptknopf ganz sichtbar, kein Knopf am Rand angeschnitten.
- Gebaut im gemeinsamen Gerüst (`dialog.sheet`, `.vdlg`, `.vd-head`, `.vd-foot` in `src/app.css`), nicht in jedem Fenster einzeln.
- Abgelehnt: jedes der rund 209 Fenster einzeln umbauen (zu gross, bricht Besitzer-Threads); stattdessen Gerüst plus Wächter, und ein Fenster wechselt auf `.vd-foot`, wenn es umgebaut wird.

# Tagesgrenze bleibt 4000, zuerst die Ursache

24.11.2026 · Auftrag: Noah «b» (Thread «Server-Klicks»)

- Anlass: Am 23.11.2026 war die Gesamtgrenze von 4000 Aufrufen erreicht (Wächter-Meldung #1665).
- Noah wählte «b: auf 8000 anheben». Die Zusage «bleibt in den Gratis-Grenzen» war falsch: Bei 4 Upstash-Befehlen pro Aufruf wären 8000 pro Tag rund 990 000 Befehle im Monat, gratis sind 500 000 (`tests/daycap.test.js`, Regel «0 Kosten»).
- Entscheid: Die Grenze bleibt 4000. Der Wächter nennt jetzt die lautesten Funktionen; danach wird die Ursache behoben (zum Beispiel ein Gerät, das zu oft nachfragt) oder Noah entscheidet neu mit der echten Zahl.

# Tests anderer Bereiche vor dem PR

24.11.2026 · Auftrag: Noah «a» (Thread «Regeln und Anweisungen auf neuen Stand bringen», Frage des Koordinators 12:38 UTC)

- **R31:** Wer eine Seite umbaut, sucht vor dem PR alle Tests, die diese Seite antippen, auch die anderer Bereiche, und lässt sie lokal laufen (verworfen: «wie bisher, rote Tests danach reparieren»).
- Grund: Am 24.11.2026 machten die PRs zu Plus-Menü (1655) und «Ich» (1681) main rot, weil Tests anderer Bereiche den alten Stand erwarteten. Lokal lief nur der eigene Test.

- **R32 (Noah 24.11.2026 16:29 «ich möchte, dass du ab sofort mehr antwortest. aktuell immer eher zu knapp»):** Antworten an Noah sind ausführlicher: was passiert ist, warum, was es für ihn bedeutet, nächster Schritt; einfach und auf Deutsch. Ersetzt «kurz» in R4 und die 80-Wörter-Grenze; R5 (nur mit Ergebnis, Blocker oder Frage) bleibt.
- **R33 (Noah 24.11.2026 16:31):** Jede Nachricht sagt klar, wovon die Rede ist: Thread verlinken, Thema in Worten, jede PR-Nummer mit Bedeutung in Worten, offenen Punkt benennen; nie nur Nummern oder Kürzel. Gilt für den Koordinator und alle Threads.
- **PR-Grenze gesenkt (Noah 24.11.2026 16:38 «lass uns die grenze auf 5-6 herunter tun. 6-9 ist mir zu vieles gleichzeitig»):** höchstens 6 PRs offen, Ziel 5 (R11.1, R12, R13). Ersetzt «höchstens 8 offen, davon 5–6 in der Prüfung» vom 10:27 («1a»); die alte Fassung steht in `docs/regeln-archiv.md`.
- **Projekt-Anweisung bereinigt (Noah «1-5a» 24.11.2026 16:45):** (1) «erst Analyse, Code nach Umsetzungsauftrag» gestrichen; (2) Massstab nur noch Klarheit, Auffindbarkeit und Leitfaden, nicht mehr die sechs Ziele (R1, `CLAUDE.md`, `docs/vorhaben.md`); (3) Datenschutz ausdrücklich: Bankname, IBAN, Konten, Beträge, Fotos, ICS-Token nie in Repo, Chat, Gedächtnis; Echtdaten-Entwürfe nie öffentlich (R26); (4) Ton: einfach erklären, Komplexität nur wo für Noahs Entscheid wichtig (R6); (5) der Leitfaden bleibt ganz.

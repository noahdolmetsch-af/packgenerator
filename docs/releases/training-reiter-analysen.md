# Training: ein Reiter für die Analysen

PR #1783 · 17.11.2026 · Auftrag: Noah «alle umsetzen 1-10» (Thread «UI-Test der Seite Flow Training», Fund 4)

## Was ist neu
- Training hat drei Reiter: «Woche», «Aktivitäten» und neu «Analysen». Im Reiter «Analysen» stehen die Auswertungen über die Wochen (Fitness/Form, Monat gegen Monat, Jahr gegen Jahr, FTP …), die Pulszonen und die FTP. Vorher standen sie unter dem Wochenplan; die Seite war am Computer 3 345 px, am Handy 4 550 px hoch.
- «Zonen ändern» bei einer Aktivität (`?zones=1`) öffnet den Reiter «Analysen» mit dem Formular.
- Der Satz in «Plan erfüllt?» sagt «Plane im Reiter «Woche» eine.» (vorher «Oben unter «Woche planen» planen.», was nicht mehr stimmt).

## Was fällt weg oder rutscht tiefer
- Auswertungen, Pulszonen und FTP stehen nicht mehr unter der Woche, sondern im Reiter «Analysen» (ein Tipp mehr). Der Sprung-Chip «Leistung und Analysen» führt dorthin.
- Die Pulszonen und die FTP waren vorher auch unter der Liste «Aktivitäten» zu sehen; dort stehen sie nicht mehr.

## Selbst entschieden
- Pulszonen und FTP wandern mit in den Reiter, weil sie zum Auswerten gehören.
- Der Reiter hat den Namen «Analysen» wie die Karten-Überschrift «Analysen über die Wochen».

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Training: unter Plan und Rückblick folgt nichts mehr.
2. Reiter «Analysen» tippen: Auswertungen, Pulszonen und FTP stehen dort.

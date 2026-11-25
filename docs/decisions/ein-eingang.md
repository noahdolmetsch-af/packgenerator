# Ein Eingang: Suche, Hilfe und Assistent

24.11.2026 · Noah «1-5a» (Analyse https://claude.ai/artifact/VKo4H59WkCwrXtS1fke6cf) und «1-3a» (Stufe 2) im Thread «Suche, Hilfe und Assistent zu einem vereinen».

- **3a** (erste Runde) Erst die klügere Suche (Stufe 1, `docs/decisions/suche-klug-sortiert.md`), dann Schritt für Schritt ein Eingang (diese Stufe).
- **4a** (erste Runde) Das «?» bleibt; die Hilfe zu dieser Seite steht zusätzlich als erste Zeile im Suchfenster.
- **1a** (Stufe 2) Blase und Lupe werden **eine Lupe mit kleinem Funken**; ein Tipp öffnet das eine Fenster. Das «?» bleibt ein eigenes Symbol (verworfen 1b: zwei Symbole, die dasselbe Fenster öffnen).
- **2a** (Stufe 2) «Assistent öffnen» steht **nur unter einer Frage**, nicht bei einfachen Suchwörtern und nicht bei leerem Feld (verworfen 2b: feste Zeile).
- **3a** (Stufe 2) Am Computer fällt die Blase oben rechts weg, das «?» bleibt (verworfen 3b: kleiner Link «Gespräch»). Der Assistent bleibt über das Suchfeld und seine Adresse erreichbar.
- Selbst entschieden: Die Zeile heisst «Assistent öffnen», nicht «Gespräch öffnen»; nach der Regel «ein Wort pro Sache» (`docs/namen.md`, Zeile 52) heisst die Seite weiter **Assistent**. «Weiter fragen bei …» ist eine zugeklappte Zeile und «Passt zu deiner Frage» fehlt, wenn die App schon geantwortet hat (Entwurf B). Die Hilfe-Zeile steht nicht, wenn die Leiste kein «?» hat (Gast, Mini-Apps).
- Offen: «Frag Gemini» (Assistent-Thread, eigener PR) hängt als dritter Reiter an der Assistent-Seite und braucht keine Änderung hier.

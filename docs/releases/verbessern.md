# Der Knopf «Verbessern» (Logbuch, Schritt 2 von 4)

21.11.2026 · Auftrag: Noah «freigabe» (Entwurf: https://claude.ai/artifact/V1T1DcxH66ej3EJrvRFHSt, Antworten «1a 2b 3a 4a 5a»; Thread «Neue Verbesserungen finden», Umsetzungsauftrag L2)

## Was ist neu
- Auf jeder Seite steht ein Knopf **«Verbessern»**. Antippen schaltet einen Modus ein: oben ein oranges Band («tippe auf den Block, den du meinst», «Ganze Seite», «Abbrechen»), der Block unter dem Finger oder der Maus bekommt einen orangen Rahmen mit seinem Namen.
- Der Blockname ist der Titel des Blocks (der kleinste Kasten mit Titel um die Stelle). Keine Seite wird einzeln vorbereitet.
- Das Fenster: 13 Arten in vier Gruppen, Dringlichkeit «Stört jetzt / Irgendwann», ein Satz (schreiben oder diktieren). Seite (mit Adresse), Block, Uhrzeit, Gerät und Breite werden automatisch dazugeschrieben und in einer Zeile gezeigt. Der Block lässt sich mit dem × weglassen.
- Ein Schalter «Knopf «Verbessern»» unter Ich › Darstellung › Bedienung blendet den Knopf aus (Standard an).
- Das Logbuch speichert neu den Seitentitel (`pageTitle`) mit dem Eintrag.

## Was fällt weg oder rutscht tiefer
- nichts (der Knopf ist neu; er sitzt unten links auf dem Handy und unten rechts am Computer und kann ausgeblendet werden)

## Selbst entschieden
- Ein Tipp auf den Block öffnet das Fenster sofort; die Ebene, die den Tipp fängt, sorgt dafür, dass darunter nichts ausgelöst wird (kein Link, kein Knopf).
- Am Computer zeigt der Rahmen schon beim Darüberfahren den Block; auf dem Handy erscheint er mit dem Tipp (hinter dem Fenster).
- In Browser-Tests (webdriver) ist der Knopf standardmässig aus, wie das Startfenster in `firststart.js`; ein Test schaltet ihn mit `ops.improve = 1` ein. So stört er keinen der anderen Tests.
- Die orange Farbe ist ein eigener Wert (`--improve`), weil `--hi` je nach Farbwelt grün ist.
- Das Foto der Seite (Schritt 3) und «Auftrag kopieren» (Schritt 4) fehlen noch; die Zeile im Fenster zeigt vorerst nur Seite, Block, Zeit und Gerät.
- «Gut zu wissen»: nicht gebaut (Logbuch steht nicht in `ON_PAGES`), wie in Schritt 1.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Verbesserungs-Logbuch: Schritt 2 von 4 gebaut (Ziel 1 «Eine App, die mich im Alltag unterstützt»).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Eine beliebige Seite öffnen, unten auf «Verbessern» tippen: oben erscheint das orange Band.
2. Einen Block mit Titel antippen: das Fenster zeigt «Block: …» und die Zeile «Wird mit gespeichert». «Text ändern» wählen, einen Satz schreiben (oder sprechen), «Speichern».
3. Ich › Verbesserungs-Logbuch: der Eintrag steht mit Seite und Block da.
4. Ich › Darstellung › Bedienung: «Knopf «Verbessern»» ausschalten, der Knopf verschwindet.

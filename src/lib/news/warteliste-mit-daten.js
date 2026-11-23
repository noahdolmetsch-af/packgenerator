// «Warteliste mit Daten» (Noah 22.11.2026, ein PR statt vieler): quiet question for slips, fog sea days, list of values. One news file for the whole PR (one version).
export default {
  title: "The waiting list with data: slips, fog sea and values",
  lead: "A quiet question for numbers that look like slips, a shelf for the days above the fog and a list of values for the insurance.",
  points: [
    {
      text: "A quiet line under a number asks «Did you mean 70 kg?» when it looks like a slip: body weight, the weight of a piece of gear, the km of the counter and an own length in minutes; saving always works",
      go: {
        href: "#/me/weight",
        where: "Me › Weight › Enter weight: under the field, after you leave it."
      }
    },
    {
      text: "Fog sea: «Remember today» keeps a day above the fog; the shelf «Fog sea» on the collection wall shows the days with name, height and photo",
      go: {
        href: "#/debrief/sammlung",
        where: "Trips › Look back › Collection wall, shelf «Fog sea»."
      }
    },
    {
      text: "Gear › List of values: all velos and gear with their price as a PDF for the insurance; missing prices you type in right there",
      go: {
        href: "#/gear/wertliste",
        steps: [
          {
            sel: "[data-wl-sum]"
          }
        ],
        where: "Gear › List of values (also at the end of a bike's theft sheet)."
      }
    }
  ],
  small: [
    {
      box: "new",
      text: "The photo of a fog sea day is also in the photo album",
      go: {
        href: "#/me/album",
        where: "Me › Photo album."
      }
    },
    {
      box: "new",
      text: "The hard limit for the weight is gone: the app only asks",
      go: null
    },
    {
      box: "new",
      text: "The card on Today also says quietly how many fog sea days this winter has",
      go: null
    }
  ],
  test: [
    "Open Me › Weight › Enter weight, type 700 and leave the field: the line asks «Did you mean 70 kg?». Tap «Yes, 70 kg»: the field shows 70.",
    "Open Trips › Look back › Collection wall: the shelf «Fog sea» is there; add a day with a name and save: the count says «1 fog sea day this winter».",
    "Open Gear › Alles hier › List of values: rows without a price say «Price missing»; type a price in a row: the sum grows, «Undo» takes it back."
  ],
  since: [
    "f.wertliste"
  ],
  de: {
    "The waiting list with data: slips, fog sea and values": "Die Warteliste mit Daten: Tippfehler, Nebelmeer und Wertliste",
    "A quiet question for numbers that look like slips, a shelf for the days above the fog and a list of values for the insurance.": "Eine leise Frage bei Zahlen, die nach Tippfehlern aussehen, ein Regal für die Tage über dem Nebel und eine Wertliste für die Versicherung.",
    "A quiet line under a number asks «Did you mean 70 kg?» when it looks like a slip: body weight, the weight of a piece of gear, the km of the counter and an own length in minutes; saving always works": "Eine leise Zeile unter einer Zahl fragt «Meintest du 70 kg?», wenn sie nach einem Tippfehler aussieht: Körpergewicht, Gewicht eines Gegenstands, Kilometerstand und eine eigene Dauer in Minuten; Speichern geht immer",
    "Fog sea: «Remember today» keeps a day above the fog; the shelf «Fog sea» on the collection wall shows the days with name, height and photo": "Nebelmeer: «Heute merken» hält einen Tag über dem Nebel fest; das Regal «Nebelmeer» auf der Sammel-Wand zeigt die Tage mit Name, Höhe und Foto",
    "Gear › List of values: all velos and gear with their price as a PDF for the insurance; missing prices you type in right there": "Material › Wertliste: alle Velos und das Material mit Preis als PDF für die Versicherung; fehlende Preise trägst du gleich dort ein",
    "The photo of a fog sea day is also in the photo album": "Das Foto eines Nebelmeer-Tags liegt auch im Foto-Album",
    "The hard limit for the weight is gone: the app only asks": "Die harte Grenze beim Gewicht ist weg: die App fragt nur",
    "The card on Today also says quietly how many fog sea days this winter has": "Die Karte auf Heute nennt auch leise, wie viele Nebelmeer-Tage dieser Winter hat",
    "Open Me › Weight › Enter weight, type 700 and leave the field: the line asks «Did you mean 70 kg?». Tap «Yes, 70 kg»: the field shows 70.": "Ich › Gewicht › Gewicht eintragen öffnen, 700 tippen und das Feld verlassen: die Zeile fragt «Meintest du 70 kg?». «Ja, 70 kg» antippen: das Feld zeigt 70.",
    "Open Trips › Look back › Collection wall: the shelf «Fog sea» is there; add a day with a name and save: the count says «1 fog sea day this winter».": "Touren › Rückblick › Sammel-Wand öffnen: das Regal «Nebelmeer» ist da; einen Tag mit Name anlegen und speichern: die Zahl sagt «1 Nebelmeer-Tag diesen Winter».",
    "Open Gear › Alles hier › List of values: rows without a price say «Price missing»; type a price in a row: the sum grows, «Undo» takes it back.": "Material › Alles hier › Wertliste öffnen: Zeilen ohne Preis sagen «Preis fehlt»; in einer Zeile einen Preis tippen: die Summe wächst, «Rückgängig» nimmt ihn zurück.",
    "Me › Weight › Enter weight: under the field, after you leave it.": "Ich › Gewicht › Gewicht eintragen: unter dem Feld, wenn du es verlässt.",
    "Trips › Look back › Collection wall, shelf «Fog sea».": "Touren › Rückblick › Sammel-Wand, Regal «Nebelmeer».",
    "Me › Photo album.": "Ich › Fotoalbum.",
    "Gear › List of values (also at the end of a bike's theft sheet).": "Material › Wertliste (auch am Ende des Diebstahl-Blatts eines Velos)."
  }
};

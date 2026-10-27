/**
 * All German texts, merged from one file per part of the app (keys are the English texts).
 */
import shell from './shell.js';
import stopps from './stopps.js';
import gear from './gear.js';
import pack from './pack.js';
import bikes from './bikes.js';
import ride from './ride.js';
import common from './common.js';
import tips from './tips.js';
import care from './care.js';
import setup from './setup.js';
import evening from './evening.js';
import schedule from './schedule.js';
import drafts from './drafts.js';
import importgear from './importgear.js';
import whatsnew from './whatsnew.js';
import backpacks from './backpacks.js';
import merge from './merge.js';
import today from './today.js';
import templates from './templates.js';
import calm from './calm.js';
import gpx from './gpx.js';
import wardrobe from './wardrobe.js';
import weigh from './weigh.js';
import review from './review.js';
import home from './home.js';
// «Heute neu» A «Ein Blick» (Noah 20.10.2026 «1A»)
import heutea from './heutea.js';
import rueckblick from './rueckblick.js';
import pflege from './pflege.js';
import flow from './flow.js';
import fix0691 from './fix0691.js';
import feinschliffMaterial from './feinschliff-material.js';
import blocks from './blocks.js';
import masse from './masse.js';
import tempo from './tempo.js';
import uebergaenge from './uebergaenge.js';
import fix0671 from './fix0671.js';
import kmbook from './kmbook.js';
import blaetter from './blaetter.js';
import orte from './orte.js';
import orte2 from './orte2.js';
import blaetter2 from './blaetter2.js';
import feinschliff from './feinschliff.js';
import heuteruhig from './heuteruhig.js';
import helfer from './helfer.js';
import hobby from './hobby.js';
import hobby2 from './hobby2.js';
import hobby3 from './hobby3.js';
import ausstattung from './ausstattung.js';
import medeinfach from './medeinfach.js';
import aufraeumen from './aufraeumen.js';
import medwunsch from './medwunsch.js';
import rueckblickantippen from './rueckblickantippen.js';
import allesfinden from './allesfinden.js';
import kachel from './kachel.js';
import velokurz from './velokurz.js';
import look from './look.js';
import head from './head.js';
import heute2 from './heute2.js';
import challenge from './challenge.js';
import material2 from './material2.js';
import touren2 from './touren2.js';
import velo2 from './velo2.js';
import packen2 from './packen2.js';
import aktiv2 from './aktiv2.js';
import ich2 from './ich2.js';
import rueckblick2 from './rueckblick2.js';
import wasneu2 from './wasneu2.js';
import strava from './strava.js';

// v0.111.0 Bausteine bearbeiten: evening-before and after-trip check
import checks from './checks.js';
import rahmen from './rahmen.js';
// v0.117.0 Knöpfe neu: short labels and what each button does
import knoepfe from './knoepfe.js';
// v0.118.0 Was ist neu 2 and KI-Helfer ausblenden
import wasneu3 from './wasneu3.js';
import kiaus from './kiaus.js';
// v0.119.0 Schnellstart: one click on Heute plans a trip
import schnellstart from './schnellstart.js';
import teil2 from './teil2.js';
// v0.125.0 A-J1: one way to record a workshop visit
import aj1 from './aj1.js';
// v0.125.0 TZ-1 «Zustand sichtbar»: the three trip states
import tz1 from './tz1.js';
// TZ-2 «Fest nach der Fahrt»: the fixed list, «Wieder öffnen», «Bist du gefahren?»
import tz2 from './tz2.js';
import au from './au.js';
// SN1 Unterwegs and SN6 Funktionen (mockup round «Seiten neu»)
import sna from './sna.js';
// SN2 + SN4 «Seiten neu»: Rückblick, Logbuch, Dein Tempo, Vergangene Touren
import snb from './snb.js';
// SN3, SN5, SN7 «Seiten neu»: Vorlagen, Bausteine, Import prüfen, Favoriten, the old windows
import snc from './snc.js';
// SN2+ «SN2 plus»: Puls und Leistung, Aus Vorlage, Logbuch-Filter, Tempo pro Velo und Untergrund, die Monate
import sn2plus from './sn2plus.js';
// SN4+ «SN4 plus»: Vergangene Touren mit Strava-Spalten, «Spalten» und «In Zahlen»
import sn4plus from './sn4plus.js';
// SN3+ «Bausteine je nach Lage»: the seven blocks with a rule, the suggestion in Packen, pass / country / getting there
import sn3plus from './sn3plus.js';
// SN2x «SN2 extra»: the whole Rückblick of one trip (groups, day switch, Puls und Leistung, U2–U6, Vergleich)
import sn2x from './sn2x.js';
// Data cleanup 14.10.2026: old fields and personal lists out of the code
import datenbereinigen from './datenbereinigen.js';

// Bugfix Dateneingabe D1–D4: values on the Pick-up check, «Enter values», own fields
import dateneingabe from './dateneingabe.js';
// v0.123.0 Trophäen-Vitrine: all stars by area and year
import vitrine from './vitrine.js';
// SK «Seiten-Kacheln» and «Links nach aussen»: the tiles at the page end, the links elsewhere, own links
import sk from './sk.js';
// SN5+ «SN5 plus»: Favoriten (bar, zuletzt dabei, Oft dabei, Als Baustein) and Import prüfen (weight, bag, Schon da, Letzte Importe)
import sn5plus from './sn5plus.js';
// SN4g–SN4i «Touren-Seite, Runde 2»: Band Packmodus, Geplant, Werte pro Tour, Filter FL1–FL8, alles offen, drei Kacheln
import sn4g from './sn4g.js';

// SN1b–SN1d «Tour aus komoot»: the row on Unterwegs and in «Neue Tour», the sheet, «In komoot öffnen»
import komoot from './komoot.js';

// SN6+ «SN6 plus»: Funktionen with progress, Passt gerade, Deine Top 5, Neu seit deinem letzten Besuch, So geht's
import sn6plus from './sn6plus.js';

// AB «Deine Abfragen»: the 50 questions in 10 areas, Ich › Deine Abfragen, the card on Heute, Ich › Daten › Verlauf
import abfragen from './abfragen.js';

// FE1, FE13, FE14, FE16: Daumen-Zone, Farbe nie allein, «?» an Ort und Stelle, passende Handy-Tastatur
import daumen from './daumen.js';

// HG1 «Begrüssung auf Heute»: the name question, «Dein Name» in Ich › Darstellung, the sheet behind the greeting
import hg1 from './hg1.js';

// v0.127.0 «Tages-Check» 1: morning check and evening review
import tagescheck from './tagescheck.js';
// v0.127.0 «Tages-Check» 2: the balance ring, the tiles, the 15 questions
import tagescheck2 from './tagescheck2.js';
import woche from './woche.js';
import sporttasche from './sporttasche.js';
import erholung from './erholung.js';

// «Werte überall» WU1–WU4 and «Strava verbinden» SV1
import werte from './werte.js';
// «App-Wartung» BF4 BF7 BF8: backup before updates, Strava free limits, the monthly check
import wartung from './wartung.js';
// Bedienung (Noah 13.10.2026): FE2 FE6 FE7 FE8 FE9 FE10 FE11 FE17 FE18
import bedienung from './bedienung.js';
// Kluge Suche: similar words, typos, filters, «Für Claude kopieren», Chrome-KI
import kisuche from './kisuche.js';
// UC3 Velos › Setup: photos, total weight, bag plan, setup log, ideas from others
import setuprig from './setuprig.js';
// Ich › Bezahlen (mockups BZ1 + BZ2b)
import bezahlen from './bezahlen.js';
// Kleine Apps: Meditation, Packliste, Velopflege with their own icon
import kleineapps from './kleineapps.js';
// Benutzerhandbuch: how to switch on and use every function (src/lib/handbook.js)
import handbuch from './handbuch.js';
// WG «Wi gaht's?» takes over the daily check: the round tile, «Feste Runden», the rows in Im Flow
import runden from './runden.js';
// KT «Kacheln antippbar»: «Öffnen ›», «•••» and the help line, the short intro of the start page
import kacheln from './kacheln.js';
// «Inhalte Flow» IF1–IF3: tip line, fold «Das kann die App hier», tiles «Weiter»
import pageinfo from './pageinfo.js';

// Kamera-Knopf: one tap opens the camera, always for receipts
import kamera from './kamera.js';
// Regeln der App: one rule per page (A a nothing jumps, C b a tap opens to edit)
import regeln from './regeln.js';
// Start-Karten: «Heute unterwegs» and «Letzter Abend» on Today instead of the jump
import startkarten from './startkarten.js';
// Standard-Velo VS1–VS4: star, order with arrows, the one question at the first trip
import standardvelo from './standardvelo.js';
// Werte messen Teil 1 (W1–W3): pick-up values and replaced parts on the sheets
import abholwerte from './abholwerte.js';
// Werte messen Teil 2 (W4–W6): tyre pressure, record the pressure, measure the chain
import messen from './messen.js';
// «Bausteine»: Velo-Pass und Werkstatt-Auftrag aus Bausteinen
import bausteine from './bausteine.js';

// «Inspiration» UC2-1, UC2-2, UC2-4: your own links, «Aus der Notiz wird …», the packing hint
import inspiration from './inspiration.js';

// v0.134.0 «Listen und Typen» (LI1–LI4)
import lists from './lists.js';
// v0.136.0 «Pfeile und Ziehen»
import pfeileziehen from './pfeileziehen.js';
// v0.136.0 «Paket 2b»: the fixes after 0.135.0
import paket2b from './paket2b.js';

// «Timer» (Z1–Z5) and «Meditation» (ME1–ME3)
import timer from './timer.js';
import meditationzentral from './meditation-zentral.js';

// Durchklick: «fällig» counts the same everywhere
import durchklick from './durchklick.js';

// «Training» TR1–TR4: Strava activities, heart rate zones, week plan
import training from './training.js';

// Ich › Bezahlen › Rechnungen: QR bill and TWINT (mockups QR1–QR9)
import rechnungen from './rechnungen.js';
// «Garmin-Seiten» GA-1–GA-10, GA-A1–A3: model data pages per bike
import garmin from './garmin.js';
// Taschen-Setups TS0–TS5: several bag setups per bike, compare, choose one when planning
import taschensetups from './taschensetups.js';
import push from './push.js';

// SL «Scrollen und Listen»: groups, jump bar, «Nach oben»
import listen from './listen.js';

// WS2: «Schnellstart» in Neu, Suche und Tipps
import ws2schnellstart from './ws2schnellstart.js';

// WS5: Velo-Kosten im Kopf, Strava neben «Fahrten importieren»
import ws5velokosten from './ws5velokosten.js';

// WS6: was zur Erholung zählt, unter den Ringen
import ws6erholung from './ws6erholung.js';

// RE «Regeln einheitlich»: one rain limit, the debrief with nothing ticked, «Pflege für …»
import einheitlich from './einheitlich.js';

// v0.143.0 «Wieder sichtbar» (WS2–WS7)
import wiedersichtbar from './wiedersichtbar.js';

// Paket 3 (0.145.0): the fixes from the pictures of 0.136.0
import paket3 from './paket3.js';

// P3b «Daten sicher»: Speicher behalten, Abgleich Handy–Computer, Kopie vor jedem Import
import datensicher from './datensicher.js';
import dokumente from './dokumente.js';
// P3b Teil 2 «Bedienregeln»
import bedienregeln from './bedienregeln.js';
// P8 «Automatischer Abgleich»
import abgleich from './abgleich.js';

// «Mehr Inhalt in der App» (Noah 15.10.2026, 1a–5a): tips, rows and examples on ten more places
import pagetexts from './pagetexts.js';

// Hinweistexte HT1–HT2 (Noah 14.10.2026, «1a 2b 3a»): the cards «Was hier steht»
import hinweis from './hinweis.js';

// Fitbit über Google Health (mockups G1–G2)
import fitbit from './fitbit.js';

// «Leistung und Analysen» TR5–TR7: power, weight, analyses on the activity and in the week
import leistung from './leistung.js';
import leistungAktivitaet from './leistung-aktivitaet.js';
import leistungAnalysen from './leistung-analysen.js';
import gewicht from './gewicht.js';
import leistungWoche from './leistung-woche.js';

// «Mehr Inhalt» Training T1–T5 and Wochenrückblick W1–W6
import trainingInhalt from './training-inhalt.js';

// Google Kalender und Aufgaben (GA): Ich › Termine und Aufgaben
import agenda from './agenda.js';
// Google Mail (GM): Ich › Mail
import mail from './mail.js';

// «Assistent» (Noah 15.10.2026): Frag die App + Hilf mir planen
import assistent from './assistent.js';

// Termine buchen (BU1–BU5): Ich › Angebote, freie Termine, Buchungsseite
import termine from './termine.js';

// Ich › Bezahlen › Shop: products, shop link, orders (mockups SHOP1–SHOP4b)
import shop from './shop.js';

// «Gruppen überall» (Noah 18.10.2026): rename and delete every group
import gruppen from './gruppen.js';

// AT1 «Abgeschlossene Touren aus Strava»
import aktivitaeten from './aktivitaeten.js';

// Höhenprofil HP1–HP5
import hoehenprofil from './hoehenprofil.js';

// GPX-Weg (Noah 15.10.2026 «1-5 a»): the way after the first GPX upload
import gpxweg from './gpxweg.js';

// Planungs-Notizen im Tour-Entwurf (IS 246–249)
import plannotes from './plannotes.js';
import notizenevernote from './notizenevernote.js';

// Handy kurz: at most three phone screens for Trips, Favourites and What is new
import handykurz from './handykurz.js';

// Bugfixes 0.132.2 + H3a: the same number everywhere, the «Test trip» switch
import bugfixes01322 from './bugfixes01322.js';

// W1 «Deine Fahrten»: compact rows in «Dein Tempo»
import deinefahrten from './deinefahrten.js';

// Merken (Kal1, PL1–PL3) and Erinnerungen (ER1–ER3): own to-dos and reminders
import merken from './merken.js';
// Merken: Geburtstage und Pflanzen (Noah 15.10.2026)
import geburtstage from './geburtstage.js';

// Ich › Eigene Werte «Mehr selbst einstellen» (IS 254–258)
import eigenewerte from './eigenewerte.js';

// «Ausrüstung» (AU1): main equipment per sport, its counter and care
import ausruestung from './ausruestung.js';

// Gipfelbuch für alle (Aktiv › Gipfelbuch)
import gipfelbuch from './gipfelbuch.js';

// Saisonstart-Check on a ski tour's page (October, November)
import saisonstart from './saisonstart.js';

// Sportart statt Tourart SA1–SA3: one sports list, a standard bike per sport, the old trips
import sportarten from './sportarten.js';

// 0.159.0 UI-Regeln Teil 1: the weight bar
import uiregeln from './uiregeln.js';

// Impeccable (18.10.2026): Unterwegs and the debrief of one trip
import impeccableUnterwegs from './impeccable-unterwegs.js';
// Impeccable (18.10.2026), Gruppe 3: Velos und Velopflege
import impeccableVelos from './impeccable-velos.js';
// Impeccable (18.10.2026): Eingang, Ich, Daten und Backup
import impeccableIch from './impeccable-ich.js';
// Impeccable 18.10.2026, Gruppe 2: Material, Bausteine, Einkauf
import impeccableMaterial from './impeccable-material.js';
// Impeccable 18.10.2026, Gruppe 1: Packen (blocks folded) and Planen (core line, overdue on top)
import impeccableTouren from './impeccable-touren.js';

// «Skitouren»: Touren › Skitouren and its pages
import ski from './ski.js';

// Skitour «Planen und Unterwegs» (SKB1–SKB3, SKB5, SKB6)
import skitag from './skitag.js';

// Einheitliche Formulare (19.10.2026): Form, Field, ChipChoice, formchecks.js
import formular from './formular.js';

// «Rückmeldungen» (Noah 19.10.2026 «1a 2a 3a 4b»): the delete question, Undo, lines after saving
import rueckmeldungen from './rueckmeldungen.js';
// «Alles selbst bearbeiten» (Noah 19.10.2026): add, rename and delete every kind of data
import allesbearbeiten from './allesbearbeiten.js';
// Paket O «Sportarten» (Noah 19.10.2026): gleiche Bausteine, Verlauf und Fortschritt, Helfer pro Sport
import sportbausteine from './sportbausteine.js';
// «Velo im Griff» (Noah 19.10.2026): Velo-Service nach km/Stunden/Tagen, Teilevorlage pro Velo-Art, Werkstatt-Spick
import veloimgriff from './veloimgriff.js';
// «Velo-Inspektion» (Noah 19.10.2026): Checkliste, drei Stufen, So geht's, Verlauf mit Fotos
import inspektion from './inspektion.js';

// SN3h–SN3j «Bausteine mehr»: nine new blocks, the stages, the groups of the Gesamtliste, «Baden» in Planen
import bausteinemehr from './bausteinemehr.js';



// HN4 (Meditation thread, home-komponenten): the small meditation card on Heute (MedCard.svelte)
import medhome from './medhome.js';
// HN4 + HN4b «Heute neu geordnet»: the day card, «Important today» in one line, the compact balance, Aktiv
import heuteneu from './heuteneu.js';

// Tages-Check zurück (Noah 18.10.2026): Seiten Morgen-Check und Abend-Rückblick, «Deine 15 Fragen», grosser Ring
import tagescheck3 from './tagescheck3.js';

// Impeccable Runde 2 (18.10.2026), Gruppe 3: Velos, Velopflege, Werkstatt, Ausstattung, Setup
import impeccable2Velos from './impeccable2-velos.js';
// Impeccable Runde 2 (18.10.2026): Unterwegs, Rückblick, Rückblick einer Tour, Fahrten
import impeccable2Rueckblick from './impeccable2-rueckblick.js';
// Impeccable Runde 2 (18.10.2026), Gruppe 5: Ich und Unterseiten
import impeccable2Ich from './impeccable2-ich.js';
// Impeccable runde 2 (18.10.2026), Gruppe 2: Material, Einkauf, Bausteine, Kleider, Favoriten, Import prüfen
import impeccable2Material from './impeccable2-material.js';
// Impeccable (18.10.2026): Aktiv › Heute and the timer
import impeccableAktiv from './impeccable-aktiv.js';
// Impeccable runde 2 (18.10.2026): Aktiv › Heute, the head line
import impeccable2Aktivheute from './impeccable2-aktivheute.js';
// Impeccable runde 2 (18.10.2026), Gruppe 4: Meditation, Training, Ziele, Aktivität, Timer
import impeccable2Aktiv from './impeccable2-aktiv.js';
// Impeccable 18.10.2026, Runde 2, Gruppe 1: Touren, Planen, Packen, Vorlagen, «Tour beendet»
import impeccable2Touren from './impeccable2-touren.js';

// Routine «Das tut mir gut» (mockups D1 + D2)
import routine from './routine.js';

// Windows on Heute (Noah 19.10.2026 «1a 3a»): the evening before a trip, the Wochenrückblick
import fenster from './fenster.js';

// «Erkenntnisse» (Noah 19.10.2026 «4b» + own page)
import erkenntnisse from './erkenntnisse.js';

// «Woche planen» WP1–WP4: the place «Woche», the Sunday planning, the holidays, «Diese Woche» on Heute
import wocheplanen from './wocheplanen.js';

// «Rundgang» and «Einstieg» on top of the places
import rundgang from './rundgang.js';

// Paket G «Daten kommen von selbst» (19.10.2026): Verbindungen, Strava hakt ab, Kalender, See, Fitbit-Altdaten, neue Sterne
import paketg from './paketg.js';
import seetemperatur from './seetemperatur.js';
import sterneg from './sterne-g.js';
import fitbitexport from './fitbitexport.js';
import allesanpassbar from './allesanpassbar.js';
import mailin from './mailin.js';

// «Brunnen und Velo-Werkstätten an der Strecke» (19.10.2026): src/lib/route/RoutePois.svelte
import routepois from './routepois.js';

// Paket N «Pläne und Träume» (19.10.2026)
import paketn from './paketn.js';

// Paket P «Was mir gut tut» (Noah 19.10.2026)
import wohl from './wohl.js';

// Paket H «Packen leichter» (Noah 19.10.2026): Tabelle, Vorräte, Ausleihen, Startlisten, Vorlesen
import packenleichter from './packenleichter.js';

// Paket J «Berg, Schnee und Notfall»
import bergnotfall from './bergnotfall.js';

// «Anleitungen überall» (Noah 19.10.2026): lib/guides.js
import anleitungen from './anleitungen.js';
import velofaq from './velofaq.js';

// Paket Q «App klarer» (Noah 19.10.2026); its spread stays last
import klarer from './klarer.js';

// Paket L «Werkzeugkasten» (Noah 19.10.2026): Rechner, Masse, Zeitzonen, Kompass, Sätze, PDF, Fotos
import werkzeugkasten from './werkzeugkasten.js';
// Strombudget pro Tour und Powerbank-Rechner (Noah 19.10.2026 «2a»)
import strom from './strom.js';
// Verpflegung (Noah 19.10.2026 «1a 2a 3a und b 4a 5a»)
import verpflegung from './verpflegung.js';

// Paket K «Unterwegs»
import unterwegs from './unterwegs.js';

// Paket M «Aus Touren lernen» and «Neuland»
import lernen from './lernen.js';
import lernenquiz from './lernenquiz.js';
import lernenrueckschau from './lernenrueckschau.js'; // Chronik, Was die App gelernt hat, Jahr als Bildgeschichte // Quiz am Vorabend, 3 Beobachtungen pro Woche
import neuland from './neuland.js';

// Paket S «Reise-Spur» (Noah 19.10.2026): Hier bin ich, Aufzeichnen, Tour-Karte, Link für die Familie, Reisebuch
import reisespur from './reisespur.js';

// Paket L2 «Bilderkennung» (Noah 19.10.2026): Packliste per Foto, Sitzposition per Foto oder Video
import bilderkennung from './bilderkennung.js';

// Paket R «Andere Menschen und Geld» (Noah 19.10.2026): Anmelden, Datenschutz, Tagesgrenze, Velomech und Guide
import paketr from './paketr.js';


// Trello (Noah 19.10.2026 «1a 2a 3b 4a 5a»): Merken and own lists with the board «Packgenerator»
import trello from './trello.js';


// «Strava-Fahrt vollständig» (Noah 19.10.2026 «1a 2a 3a 4a 5b»)
import stravafahrt from './stravafahrt.js';


// Paket U «Rennen»: Touren › Rennen (plan, strategy, prepare, along the route, race mode, after, sample race)
import rennen from './rennen.js';
import rennenVorbereiten from './rennen-vorbereiten.js';
import rennenStrecke from './rennen-strecke.js';
import rennenUnterwegs from './rennen-unterwegs.js';
import anstiege from './anstiege.js';
import offlineKarte from './offline-karte.js';
import karte from './karte.js';
import livekarte from './livekarte.js';
import orteKarte from './orte-karte.js';
import liveRoute from './live-route.js';
import livestart from './livestart.js';
// Paket T «Freie Zeit» (Noah 19.10.2026 «alle bauen»): Ich › Freie Zeit, Impulse, the line on Heute
import frei from './frei.js';
import tagebuch from './tagebuch.js';
// Paket V «Alltag» (Noah 19.10.2026 «3a oder b 4a 5a», «1a»): Ich › Alltag, contracts, people, abroad, flight
import alltag from './alltag.js';

// «Reise-Links» (Noah 19.10.2026 «1b 2b 3a 4a 5b»)
import reiselinks from './reiselinks.js';
// «Diktat» und KI-Fragen (Noah 19.10.2026)
import diktat from './diktat.js';
// «Trainingspläne» (Noah 19.10.2026): sample plans for ultracycling, felt effort 1–10
import trainingsplaene from './trainingsplaene.js';

// «Heute lädt nicht» (Noah 19.10.2026): the line while the database waits for another tab
import dbwait from './dbwait.js';
import neuladen from './neuladen.js';
// «Tour» (Noah 19.10.2026 «1a 2 beides 3b 4 beides 5a»): die Seite einer abgeschlossenen Tour
import tourseite from './tourseite.js';
import tourgepaeck from './tourgepaeck.js';
import tourauswertung from './tourauswertung.js';
// «Eine Tour, eine Seite» (0.174)
import einetour from './einetour.js';
// Gesamttest 20.10.2026: small fixes
import gesamttest20 from './gesamttest20.js';
// Gesamttest 20.10.2026, Runde 2: Aktiv, Check, lange Seiten
import gt20mine from './gt20mine.js';
// Gesamttest 20.10.2026 (Noah «1a»): Velos and Strava (B1, B6, B7, C8)
import gt20velos from './gt20velos.js';

// Gesamttest 20.10.2026, design findings (Noah «2a»)
import gt20design from './gt20design.js';

// Gesamttest 20.10.2026 (Touren, Planen/Packen, Rennen, Reise-Spur): Fahrten-Reiter, «mit Packliste», nächster Schritt
import gt20touren from './gt20touren.js';
// Noah 20.10.2026 «Check-Fragen selbst bearbeiten»: «Überspringen», questions and areas editable
import checkfragen from './checkfragen.js';
// «Datenseiten wie am Garmin» (Noah 20.10.2026): data pages on the live map
import datenseiten from './datenseiten.js';
// «Abbiege-Hinweise» (Noah 20.10.2026)
import abbiegen from './abbiegen.js';
// «Neue Quellen» 20.10.2026: Ride with GPS per Link, ÖV in der Nähe, Ladestationen
import quellen from './quellen.js';
// «Weitere Quellen» 20.10.2026: own radius, more kinds, own kinds (OpenStreetMap tags), own places from files
import orteQuellen from './orte-quellen.js';
// Noah 20.10.2026 «1a–5a»: change the tiles of «Heute abhaken»
import aktivkacheln from './aktivkacheln.js';
import tourplanen from './tourplanen.js';
import aktivneu from './aktivneu.js';
import uigrundlagen from './uigrundlagen.js';
import neueleiste from './neueleiste.js';
import heatmap from './heatmap.js';

// «Erster Start» (Noah 20.10.2026): «Mit Beispielen starten» / «Leer starten»
import erststart from './erststart.js';
// «Form und Erholung» und Garmin-Übersicht (Noah 20.10.2026)
import formgarmin from './formgarmin.js';
// «Datenseiten wie am Garmin» (Noah 20.10.2026): data pages on the live map
// Paket X «Umweg neu planen» (Noah 20.10.2026)
import umweg from './umweg.js';
// Paket Y «Wetter-Kern» (Noah 20.10.2026)
import wetterkern from './wetterkern.js';
import energie from './energie.js';
// Paket W «Von der Haustür bis zurück» (Noah 20.10.2026 «1a 2a 3a 4a»)
import haustuer from './haustuer.js';
// Paket Z «Aus jeder Tour lernen» and Paket SP «Schneller packen» (Noah 20.10.2026)
import tourlernen from './tourlernen.js';
import schnellpacken from './schnellpacken.js';
// «KI im Gerät» (Noah 20.10.2026): a small AI in the app, also without internet
import localai from './localai.js';
// Paket U4 «Schlafplätze im Rennen» (Noah 20.10.2026 «1a 2a 3a 4a 5a», «6a 7a 8a»)
import schlafplaetze from './schlafplaetze.js';
// «Verschleiss» (Noah 20.10.2026)
import verschleiss from './verschleiss.js';


// UI-Grundlagen (Noah 20.10.2026 «freigabe für alles»): ruhigere Liste, Knöpfe, Hilfe, Velopflege
// «Bilder in der App» (Noah 20.10.2026 «1b 2a 3a 4a 5a»)
import bilder from './bilder.js';
// «Verschleiss» (Noah 20.10.2026)
// Paket VG «Das Velo im Griff» (Noah 20.10.2026)
import velogriff from './velogriff.js';
// «Suche mit Sprache und Antworten» (Noah 21.10.2026)
import suche from './suche.js';
// Paket «Reste» (21.10.2026): Bikepark-Tage, alle Taschen nebeneinander, Formulare, LibreOffice/RTF
import reste from './reste.js';
// Impeccable-Prüfung 20.10.2026 (Noah «alles umsetzen»): tabs + «Mehr», one word per thing; spread last
import impeccable3 from './impeccable3.js';
// «Anpassen» (Noah 20.10.2026 «1a–5a»): Diese Seite anpassen, Reiter, Menü
import anpassen from './anpassen.js';

// «Auswertung wie Training» (Noah 20.10.2026): Aktiv › Ziele › Auswerten
import auswertungtk from './auswertungtk.js';
// «Packliste aufräumen» (Noah 21.10.2026 «5a»)
import packliste from './packliste.js';
// «Wie Strava» (Noah 21.10.2026): Strava's overview, Peak Power and the map in the Rückblick
import stravauebersicht from './stravauebersicht.js';
// Gesamttest 21.10.2026: phone fixes
import gt21fixes from './gt21fixes.js';
// C9 «Lange Vorlagen» (Noah 21.10.2026 «1a»): categories folded from 100 items; spread last
import gt21vorlagen from './gt21vorlagen.js';
// «Englische Namen auf Deutsch» (Noah 21.10.2026 «1a»): Ich › Daten; spread last
import gt21namen from './gt21namen.js';
import rueckblickkritik from './rueckblickkritik.js';
// Paket P2 «Skitour» (Noah 21.10.2026): Tour planen, Saison
import skitourplan from './skitourplan.js';
// Paket P1 «Packen und Strom» (Noah 21.10.2026)
import packenstrom from './packenstrom.js';
// Paket P3 «Warum? und Regeln» (Noah 21.10.2026)
import warumregeln from './warumregeln.js';
// Paket P4 «Aktiv» (Noah 21.10.2026)
import aktivp4 from './aktivp4.js';
import eingangp5 from './eingangp5.js';
import projektp7 from './projektp7.js';
import fotoalbum from './fotoalbum.js';
// Klick-Rundgang 22.10.2026: «Packen fertig bauen»
import packenfertig from './packenfertig.js';
// Klick-Rundgang 22.10.2026: «Nach der Tour, Material, Start»
import nachdertour from './nachdertour.js';
// «Aktiv neu» (Noah 22.10.2026): Aktiv zum Machen, Auswerten zum Anschauen; spread last
import aktivbereich from './aktivbereich.js';
// «Alltag fertig bauen» (Klick-Rundgang 22.10.2026): repairs of Mein Tag, Meine Woche, Velo pflegen; spread last
import alltagfertig from './alltagfertig.js';
// «Alltag sichtbar» (332 Use Cases, Noah 24.10.2026): Heute fällig, Merken tab, bike folder and Gear views one tap away
import alltagsichtbar from './alltagsichtbar.js';
import tourensichtbar from './tourensichtbar.js';
import livesichtbar from './livesichtbar.js';
// «Alles finden 2» (Noah 22.10.2026): help behind «?», «Alle n», Ich slim
import allesfinden2 from './allesfinden2.js';
// Klick-Rundgang H19 (Noah 24.10.2026 «freigabe für alle»): the + menu
import neuemenu from './neuemenu.js';
// «Meilensteine als Belohnung» (Noah 22.10.2026 «1a–5a»)
import meilensteinebelohnung from './meilensteinebelohnung.js';
// «Alles fertig» (Noah 24.10.2026): leftovers of the older threads; spread last
import allesfertig from './allesfertig.js';
// Paket B «Touren ohne Überraschung» (996 Ideen): Generalprobe, Gut ankommen, Kisten-Etiketten; spread last
import generalprobe from './generalprobe.js';
// Paket D «Mit Freunden» (996 Ideen, Noah 24.10.2026 «3b»): Ich › Mit Freunden; spread last
import freunde from './freunde.js';
// Paket C «Ruhig und persönlich» (996 Ideen): Ich › Ruhig und persönlich; spread last
import ruhigpersoenlich from './ruhigpersoenlich.js';
// Paket A «Ehrlicher Stand im Alltag» (996 Ideen): Warten, Listen und Ziele enden; spread last
import stand from './stand.js';
// Gruppen-Live-Karte (Noah 25.10.2026 «b»): friends on the live map through a link; spread last
import gruppenkarte from './gruppenkarte.js';
// «Kette vorausschauend» (Noah 25.10.2026): chain steps, forecast, reminders; spread last
import kettevoraus from './kettevoraus.js';
// «Eingaben überall» (Noah 26.10.2026): input bar on ten pages, templates per page, picture card; spread last
import eingaben from './eingaben.js';
// Einzelideen Planen (996 Ideen 12, 13, 14): Verbindungen mit Bedeutung, Erinnerung nach Ereignis, Papierkorb; spread last
import einzelplanen from './einzelplanen.js';
// Einzelideen Ich 29, 30, 31, 34, 36 (996 Ideen, Noah 25.10.2026); spread last
import ichgross from './ichgross.js'; // Einzelideen Ich 27, 28, 32, 33, 35 (Noah 26.10.2026 «1a 2a 3a 4a 5a»)
import ichideen from './ichideen.js';
// Einzelideen Heute (Noah 25.10.2026): Überraschungsrunde, Wetter zu Hause, Standzeit …; spread last
import heuteideen from './heuteideen.js';
import einzelgross from './einzelgross.js'; // Einzelideen Planen 10, 11, 15, 16: Pflanzenpass, Vorgänge, Erinnerungskarte
// Einzelideen Material und Überall (996 Ideen, Noah 25.10.2026); spread last
import einzeln from './einzeln.js';
// Touren-Ideen 41–49 (996 Ideen, Noah 25.10.2026); spread last
import tourena from './tourena.js';
// Touren-Ideen 44, 45, 47, 49 (Noah 26.10.2026 «1a 2b 3a 4b 5b»); spread last
import tourena2 from './tourena2.js';
// Paket «Touren b» (996 Ideen 50–58); spread last
import tourenb from './tourenb.js';
// «Computer-Breite besser nutzen» (UI-Ziel #14, Noah 26.10.2026): Touren and Auswerten in two columns; spread last
import computerbreite from './computerbreite.js';
// UI-Test 26.10.2026 (T1 and later small parts); spread last
import uitest from './uitest.js';
// «Heute ruhiger» (Noah 26.10.2026 «1a»): the small tiles on Heute as one list; spread last
import heuteruhiger from './heuteruhiger.js';
// Noah 26.10.2026 «1 3 6 7 8 12a»: Velo-Ergänzungen
import velo2610 from './velo2610.js';
// Live Navigation M9/M10 (Noah 26.10.2026): «Fahrt beenden» asks once, ride saved in Touren with its label; spread last
import livenavigation from './livenavigation.js';
import situationen from './situationen.js';
// «Was ziehe ich an? selbst anpassen» (Noah 27.10.2026): tauschen, Schicht dazu, Warum so?; spread last
import kleideranpassen from './kleideranpassen.js';
// Kontakt-QR-Code (Noah 27.10.2026 «1a 2b 3a 4a 5a»); spread last
import kontaktqr from './kontaktqr.js';
// Touren c (Einzelideen 60–70)
import tourenc from './tourenc.js';
// «App verstehen» (Noah 26.10.2026): Ich › App verstehen; spread last
import verstehen from './verstehen.js';
export default { ...blocks, ...flow, ...home, ...today, ...care, ...ride, ...bikes, ...gear, ...pack, ...shell, ...common, ...tips, ...setup, ...evening, ...schedule, ...drafts, ...importgear, ...whatsnew, ...backpacks, ...merge, ...templates, ...calm, ...gpx, ...wardrobe, ...weigh, ...review, ...rueckblick, ...tempo, ...pflege, ...masse, ...uebergaenge, ...fix0671, ...kmbook, ...blaetter, ...fix0691, ...blaetter2, ...heuteruhig, ...feinschliffMaterial, ...feinschliff, ...orte, ...helfer, ...orte2, ...hobby, ...hobby2, ...hobby3, ...ausstattung, ...medeinfach, ...aufraeumen, ...rueckblickantippen, ...medwunsch, ...kachel, ...velokurz, ...allesfinden, ...look, ...head, ...heute2, ...challenge, ...material2, ...touren2, ...velo2, ...packen2, ...aktiv2, ...ich2, ...rueckblick2, ...wasneu2, ...checks, ...rahmen, ...strava, ...knoepfe, ...wasneu3, ...kiaus, ...schnellstart, ...dateneingabe, ...vitrine, ...teil2, ...tagescheck, ...tagescheck2, ...woche, ...sporttasche, ...erholung, ...aj1, ...tz1, ...au, ...werte, ...wartung, ...bedienung, ...kisuche, ...setuprig, ...bezahlen, ...kleineapps, ...handbuch, ...datenbereinigen, ...sna, ...snb, ...tz2, ...snc, ...sn2plus, ...sn4plus, ...sn3plus, ...sn2x, ...sk, ...sn5plus, ...sn4g, ...komoot, ...sn6plus, ...abfragen, ...daumen, ...hg1, ...runden, ...kacheln, ...kamera, ...inspiration, ...lists, ...timer, ...meditationzentral, ...pageinfo, ...durchklick, ...training, ...rechnungen, ...pfeileziehen, ...paket2b, ...regeln, ...startkarten, ...standardvelo, ...listen, ...ws2schnellstart, ...ws5velokosten, ...ws6erholung, ...einheitlich, ...wiedersichtbar, ...paket3, ...aktivitaeten, ...hoehenprofil, ...gpxweg, ...plannotes, ...handykurz, ...bugfixes01322, ...abholwerte, ...messen, ...bausteine, ...garmin, ...taschensetups, ...merken, ...geburtstage, ...eigenewerte, ...ausruestung, ...gipfelbuch, ...saisonstart, ...sportarten, ...uiregeln, ...impeccableUnterwegs, ...impeccableVelos, ...impeccableIch, ...impeccableMaterial, ...impeccableTouren, ...deinefahrten, ...ski, ...skitag, ...datensicher, ...dokumente, ...bedienregeln, ...pagetexts, ...hinweis, ...fitbit, ...leistung, ...leistungAktivitaet, ...leistungAnalysen, ...gewicht, ...leistungWoche, ...trainingInhalt, ...agenda, ...assistent, ...termine, ...abgleich, ...push, ...mail, ...gruppen, ...shop, ...rueckmeldungen, ...formular, ...allesbearbeiten, ...bausteinemehr, ...medhome, ...heuteneu, ...tagescheck3, ...impeccable2Velos, ...impeccable2Rueckblick, ...impeccable2Ich, ...impeccable2Material, ...impeccableAktiv, ...impeccable2Aktivheute, ...impeccable2Aktiv, ...impeccable2Touren, ...routine, ...fenster, ...erkenntnisse, ...wocheplanen, ...rundgang, ...paketg, ...seetemperatur, ...sterneg, ...fitbitexport, ...routepois, ...paketn, ...wohl, ...packenleichter, ...bergnotfall, ...werkzeugkasten, ...unterwegs, ...lernen, ...lernenquiz, ...lernenrueckschau, ...neuland, ...reisespur, ...sportbausteine, ...veloimgriff, ...inspektion, ...bilderkennung, ...paketr, ...trello, ...stravafahrt, ...frei, ...alltag, ...strom, ...anleitungen, ...reiselinks, ...diktat, ...velofaq, ...trainingsplaene, ...rennen, ...rennenVorbereiten, ...rennenStrecke, ...rennenUnterwegs, ...anstiege, ...offlineKarte, ...karte, ...livekarte, ...livestart, ...orteKarte, ...liveRoute, ...tourseite, ...tourgepaeck, ...klarer, ...mailin, ...verpflegung, ...dbwait, ...gesamttest20, ...gt20mine, ...gt20velos, ...gt20design, ...gt20touren, ...heutea, ...neuladen, ...aktivkacheln, ...tourplanen, ...aktivneu, ...uigrundlagen, ...neueleiste, ...checkfragen, ...tourauswertung, ...heatmap, ...erststart, ...formgarmin, ...tagebuch, ...datenseiten, ...abbiegen, ...quellen, ...orteQuellen, ...umweg, ...haustuer, ...wetterkern, ...energie, ...tourlernen, ...schnellpacken, ...localai, ...schlafplaetze, ...verschleiss, ...bilder, ...velogriff, ...notizenevernote, ...suche, ...allesanpassbar, ...auswertungtk, ...anpassen, ...reste, ...packliste, ...impeccable3, ...einetour, ...stravauebersicht, ...rueckblickkritik, ...gt21fixes, ...gt21vorlagen, ...skitourplan, ...packenstrom, ...warumregeln, ...aktivp4, ...eingangp5, ...projektp7, ...fotoalbum, ...packenfertig, ...nachdertour, ...gt21namen, ...alltagfertig, ...allesfinden2, ...neuemenu, ...aktivbereich, ...stopps, ...meilensteinebelohnung, ...allesfertig, ...generalprobe, ...alltagsichtbar, ...tourensichtbar, ...livesichtbar, ...stand, ...ruhigpersoenlich, ...freunde, ...gruppenkarte, ...kettevoraus, ...eingaben, ...einzelplanen, ...ichideen, ...heuteideen, ...einzelgross, ...ichgross, ...einzeln, ...tourena, ...computerbreite, ...tourena2, ...tourenb, ...uitest, ...heuteruhiger, ...velo2610, ...livenavigation, ...situationen, ...kleideranpassen, ...kontaktqr, ...verstehen, ...tourenc };

# Kalkulationstool: Handy-Bedienung und gemeinsame Daten (Supabase)

Stand: 24.09.2026 · Status: vom Inhaber im Chat freigegeben (Teil 1 und 2), Spec zur Durchsicht

## 1. Ziel

Das Kalkulationstool (https://avekalkulation.netlify.app) soll auf dem Handy vollständig bedienbar sein. Handy und Computer sollen dieselben Daten zeigen: vor Ort beim Kunden Räume ins Handy tippen, im Büro am Computer weitermachen.

**Erfolgreich, wenn:**
- Ein Kunde, der auf dem Handy angelegt und mit Räumen gefüllt wurde, nach dem Neuladen am Computer mit allen Räumen erscheint (und umgekehrt).
- Alle 6 Reiter bei 320, 375 und 390 px Breite ohne seitliches Wischen und ohne abgeschnittene Inhalte bedienbar sind.
- Das Tool sich als App-Symbol auf iPhone und Android legen lässt und ohne Browserleiste öffnet.
- Ohne Anmeldung keine Kundendaten und keine Dateien abrufbar sind.
- Am Computer (ab 981 px) alles aussieht wie vorher und die Berechnung dieselben Beträge liefert.

## 2. Rahmen

**Vom Inhaber festgelegt:**
- Nutzung durch den Inhaber und einige Mitarbeiter. Alle sehen alles, keine Rollen.
- Vor Ort gibt es in der Regel Internet. Kein Offline-Modus.
- Datenablage bei Supabase, Region Frankfurt (eu-central-1).
- Der Code bleibt öffentlich auf GitHub (andre1426/ave-kalkulationstool), Hosting bleibt bei Netlify.

**Annahmen (vom Inhaber bestätigt):**
- Zugang nur per Einladung. Selbst-Registrierung ist abgeschaltet.
- Die Beispielkunden entfallen. Der Start ist mit einer leeren Kundenliste.
- Die Rechenlogik (`TURNUS`, `positionsBetrag`, `summe`) bleibt unverändert.

**Technisch:**
- Weiterhin statisches HTML/CSS/JS ohne Build-Schritt.
- Supabase-JS wird mit fester Version von `cdn.jsdelivr.net` geladen.
- Kein eigener Server und keine Netlify Functions.

## 3. Anmeldung

- Beim Start prüft die App, ob eine Supabase-Sitzung besteht. Ohne Sitzung erscheint nur die **Anmeldeseite**: Logo, E-Mail, Passwort und der Knopf „Anmelden“. Fehlermeldungen stehen auf Deutsch direkt am Formular, zum Beispiel „E-Mail oder Passwort falsch“ oder „Keine Verbindung“.
- Link „Passwort vergessen?“: Supabase schickt eine E-Mail zum Zurücksetzen. Die App erkennt die Rückkehr über den Link (`PASSWORD_RECOVERY`) und zeigt dann das Feld „Neues Passwort“.
- **Eingeladene Personen:** Die Einladungs-Mail von Supabase führt in die App. Dort vergibt die Person ihr eigenes Passwort (derselbe Ablauf wie „Neues Passwort“).
- Die Sitzung bleibt auf dem Gerät gespeichert (Supabase-Standard). Man bleibt angemeldet, bis man „Abmelden“ tippt.
- Unten in der Seitenleiste bzw. im Handy-Menü steht der **Name der angemeldeten Person** und darunter „Abmelden“. Den Namen verwaltet der Inhaber in Supabase (`user_metadata.name`), sonst wird die E-Mail-Adresse angezeigt. Die feste Angabe „André Pires / Geschäftsführer“ entfällt.
- Ist die Sitzung abgelaufen oder ungültig, erscheint wieder die Anmeldeseite.

## 4. Daten in Supabase

### 4.1 Tabellen

```sql
-- Ein Kunde samt Objekt und Raumbuch als ein Datensatz (entspricht dem heutigen Kunden-Objekt in app.js)
create table public.kunden (
  id            text primary key,              -- bisherige ID-Form, z. B. "k3f9a2c"
  daten         jsonb not null,                -- firma, objekt, raeume[], status, stundenlohn, grundriss …
  updated_at    timestamptz not null default now(),
  updated_by    text not null default ''       -- Anzeigename der Person, die zuletzt gespeichert hat
);

-- Firmenprofil für Ausschreibungen: genau eine Zeile
create table public.profil (
  id            int primary key default 1 check (id = 1),
  daten         jsonb not null,
  updated_at    timestamptz not null default now(),
  updated_by    text not null default ''
);
```

**Warum ein JSON-Feld pro Kunde:** Die App arbeitet heute schon mit genau diesem Kunden-Objekt. So bleibt der Umbau klein, und die Views ändern sich kaum. Die Räume werden nie ohne ihren Kunden gebraucht.

### 4.2 Zugriffsschutz (Row Level Security)

- Auf beiden Tabellen ist RLS eingeschaltet.
- Regel für beide: Lesen, Anlegen, Ändern und Löschen **nur für die Rolle `authenticated`**. Für `anon` gilt keine Regel, also hat `anon` keinen Zugriff.
- Der Supabase-URL und der öffentliche Schlüssel („publishable“ bzw. „anon“) stehen in `config.js`. Beide sind absichtlich öffentlich. Der Schutz kommt allein aus RLS. Der geheime Service-Schlüssel kommt **nie** ins Repository.

### 4.3 Dateien (Grundriss)

- Privater Speicher-Bucket `grundrisse`. Pfad `<kunden-id>/<zeitstempel>-<dateiname>`.
- Speicher-Regeln: Hochladen, Lesen und Löschen nur für `authenticated`.
- Im Kunden-Datensatz steht statt nur des Dateinamens: `grundriss: { name, pfad, groesse }`. Alte Werte (einfacher Text) werden als „nur Name“ angezeigt.
- Zum Öffnen erzeugt die App einen zeitlich begrenzten Link (signed URL, 5 Minuten) und öffnet ihn in einem neuen Tab.
- Erlaubt sind PDF, JPG, PNG, HEIC und DWG, höchstens 20 MB. Bei zu großen Dateien erscheint ein Hinweis, und es wird nichts hochgeladen.
- Am Handy bietet die Dateiauswahl auch „Foto aufnehmen“. Dafür gibt es einen zusätzlichen Knopf „Foto machen“ mit `accept="image/*" capture="environment"`.
- Ein neuer Grundriss ersetzt den alten im Datensatz. Die alte Datei wird gelöscht.

### 4.4 Laden und Speichern

- **Nach der Anmeldung:** alle Kunden und das Profil laden, sortiert nach `updated_at` (neueste zuerst).
- **Neu laden, wenn die App wieder sichtbar wird** (`visibilitychange`, zum Beispiel beim Wechsel vom Handy-Startbildschirm zurück in die App). Voraussetzung: Es gibt keine ungespeicherten Änderungen. Kein Live-Abgleich in Echtzeit.
- **Speichern:** Die bestehenden `save()`-Aufrufe bleiben.
  - `save()` merkt sich, welche Kunden sich gegenüber dem zuletzt gespeicherten Stand geändert haben (Vergleich des JSON-Texts). Nach 600 ms Ruhe schreibt es nur diese per `upsert`, mit `updated_at = now()` und `updated_by = Anzeigename`. Das Profil wird genauso behandelt.
  - `activeId` und `ui` (Ansicht, Berechnungsart) bleiben im `localStorage` des Geräts.
- **Speicheranzeige** oben auf jeder Seite, klein und unaufdringlich: „Speichert …“, „Gespeichert“ oder in Rot „Nicht gespeichert – keine Verbindung. [Erneut versuchen]“. Beim Verlassen der Seite mit ungespeicherten Änderungen warnt der Browser (`beforeunload`).
- **Gleichzeitiges Bearbeiten:** Bearbeiten zwei Personen denselben Kunden gleichzeitig, gilt die zuletzt gespeicherte Fassung. Das ist bei einem kleinen Team bewusst in Kauf genommen und wird nicht technisch verhindert.
- **„Zuletzt geändert“:** Das Textfeld `updated` („vor 2 Stunden“) entfällt. Die Übersicht zeigt `updated_by` und eine Zeitangabe aus `updated_at`: „heute 14:20“, „gestern 09:05“ oder „12.09.2026“.
- **Leere Kundenliste:** Die Übersicht zeigt „Noch keine Kunden“ mit dem Knopf „Neuen Kunden anlegen“. Grundriss, Raumbuch und Kalkulation zeigen ohne Kunde einen Hinweis mit demselben Knopf statt eines Fehlers.

## 5. Handy-Darstellung (bis 980 px Breite)

- **Kopfleiste** statt Seitenleiste: klebt oben, etwa 56 px hoch. Links das Logo, in der Mitte der Seitenname, rechts der Knopf ☰ (`aria-expanded`, Beschriftung „Menü“). Das Menü klappt als Fläche unter der Leiste auf, mit den 6 Reitern, dem Namen der angemeldeten Person und „Abmelden“. Es schließt sich beim Tippen auf einen Reiter, mit Esc und beim Wechsel auf Computerbreite.
- **Kundenwahl oben** (Kunde/Objekt): Die Auswahlfelder stehen untereinander und nehmen die volle Breite ein.
- **Schrittleiste** (Kundendaten → Kalkulation): zeigt nur die Nummern, darunter den Namen des aktuellen Schritts.
- **Raumbuch und Kalkulation:** Jede Tabellenzeile wird zu einer Karte. Oben steht der Raumname als Eingabefeld über die volle Breite, darunter die Felder im 2-Spalten-Raster, jeweils mit sichtbarer Beschriftung. Unten rechts auf der Karte stehen der Betrag bzw. der Löschen-Knopf. Umgesetzt wird das per CSS auf den bestehenden Tabellen (`display: block/grid` mit `data-label`), damit Computer- und Handy-Ansicht aus demselben Markup kommen.
- **Übersicht:** Jeder Vorgang wird zu einer Karte mit Firma, Objekt, Status-Plakette, „zuletzt geändert“ und „Öffnen“. Die Filter stehen untereinander.
- **Summenblock** der Kalkulation über die volle Breite. Die Knöpfe „Zurück“, „Als PDF / drucken“ und „Angebot senden“ stehen untereinander über die volle Breite.
- **Kundenvorschau / Angebot:** Die Schrift wird so skaliert, dass das Angebot ohne seitliches Wischen lesbar ist. Der Druck (`@media print`) bleibt unverändert.
- **Bedienung:**
  - Tippflächen mindestens 44 × 44 px.
  - Schriftgröße in Eingabefeldern mindestens 16 px, damit iOS nicht zoomt.
  - Zahlenfelder mit `inputmode="decimal"`, damit die Zahlentastatur erscheint. Die deutsche Komma-Eingabe bleibt über `parseNum` erhalten.
  - Sichere Ränder für iPhones mit Notch (`env(safe-area-inset-*)`).
- **Ab 981 px** gilt das bisherige Layout unverändert.

## 6. Als App installierbar

- `manifest.webmanifest`:
  - Name „AVE Kalkulation“, `display: standalone`, `start_url: "./"`, Farben passend zur Seitenleiste.
  - Symbole 192, 512 und maskable 512. Diese werden aus den vorhandenen AVE-Symbolen der Webseite übernommen (`ave-webseite/img/icon-*.png`).
- In `index.html`: `apple-touch-icon`, `theme-color`, `apple-mobile-web-app-capable`, `viewport-fit=cover`.
- `netlify.toml`: `Content-Type: application/manifest+json` für das Manifest.
- Kein Service Worker, da es keinen Offline-Modus gibt.

## 7. Dateien

| Datei | Änderung |
|---|---|
| `index.html` | Anmeldeseite, Kopfleiste und Menü-Knopf, Speicheranzeige, Manifest und Icons, Supabase-Skript, `config.js`, `db.js` |
| `config.js` (neu) | `SUPABASE_URL`, `SUPABASE_KEY` (öffentlich) |
| `db.js` (neu) | Alles, was mit Supabase spricht: anmelden, abmelden, Passwort, Kunden und Profil laden/speichern, Datei hoch-/runterladen. Die App kennt nur diese Funktionen. |
| `app.js` | Store auf `db.js` umgestellt (Laden nach Anmeldung, `save()` mit Änderungserkennung und Verzögerung), leere Kundenliste, „zuletzt geändert“, Grundriss-Upload und Foto, `data-label`/`inputmode` in den Tabellen, Menü-Logik. Die Rechenlogik bleibt unverändert. |
| `styles.css` | Handy-Layout, Anmeldeseite, Speicheranzeige |
| `manifest.webmanifest`, `assets/icon-*.png` (neu) | App-Symbol |
| `supabase/schema.sql` (neu) | Tabellen, RLS-Regeln, Bucket und Speicher-Regeln. Einmal im Supabase-SQL-Editor ausführen. |
| `tests/` (neu) | Browser-Testseite für die reinen Funktionen, Prüfskript für RLS |
| `README.md` | Einrichtung Supabase, Mitarbeiter einladen, Hinweise |

## 8. Fehlerfälle

- **Keine Verbindung beim Start:** Hinweis „Keine Verbindung zum Server“ mit dem Knopf „Erneut versuchen“. Keine leere Liste vortäuschen.
- **Speichern schlägt fehl:** Die Änderung bleibt im Speicher. Die Anzeige wird rot, und beim nächsten `save()` oder bei „Erneut versuchen“ wird es wiederholt.
- **Hochladen schlägt fehl:** Hinweis am Upload-Feld. Der Kunde bleibt unverändert.
- **Sitzung abgelaufen** (Fehler 401 oder JWT abgelaufen): Supabase erneuert die Sitzung automatisch. Klappt das nicht, erscheint die Anmeldeseite. Ungespeicherte Änderungen gehen dabei verloren, und darauf weist ein Hinweis hin.

## 9. Tests

- **Browser-Testseite** (`tests/tests.html`, ohne Framework, wie bei der Webseite) für die reinen Funktionen:
  - Änderungserkennung (welche Kunden sind geändert)
  - Zeitangabe „heute/gestern/Datum“
  - Grundriss-Wert alt (Text) und neu (Objekt)
  - Dateiprüfung (Endung, Größe)
  - Rechenlogik als Absicherung, dass sich die Beträge nicht ändern (Beispiel: 609,76 € brutto aus den bisherigen Beispielräumen)
- **RLS-Prüfung:** Ein Skript fragt `kunden`, `profil` und den Bucket nur mit dem öffentlichen Schlüssel und ohne Anmeldung ab. Erwartet: 0 Zeilen bzw. Zugriff verweigert. Anlegen ohne Anmeldung wird abgelehnt.
- **Ende-zu-Ende online:**
  - Anmelden, Kunde anlegen, Raumtext übernehmen, Preis ändern, Grundriss hochladen.
  - In einem zweiten Browser-Tab angemeldet neu laden: Alles ist da.
  - Abmelden: Die Anmeldeseite erscheint.
- **Darstellung:** Alle Reiter bei 320, 375, 390 und 1280 px. Seitenbreite gleich Fensterbreite (kein Überlauf), die Konsole ohne Fehler.

## 10. Einrichtung durch den Inhaber (Claude führt Schritt für Schritt)

1. Ein Supabase-Konto anlegen (am einfachsten „Continue with GitHub“) und ein neues Projekt mit der Region **Frankfurt (eu-central-1)** erstellen.
2. Den Inhalt von `supabase/schema.sql` im SQL-Editor einfügen und ausführen.
3. Unter Authentication die **Selbst-Registrierung ausschalten** („Allow new users to sign up“ aus) und als Weiterleitungsadresse `https://avekalkulation.netlify.app` eintragen.
4. Unter Authentication → Users sich selbst und die Mitarbeiter **einladen** („Invite user“) und bei jedem den Namen hinterlegen.
5. Projekt-URL und öffentlichen Schlüssel an Claude geben. Beides kommt in `config.js`.
6. **Datenschutz:** In den Supabase-Einstellungen den Auftragsverarbeitungsvertrag (DPA) abschließen. Die Datenschutzhinweise im Unternehmen um Supabase ergänzen.

## 11. Wichtige Hinweise für den Inhaber

- **Kostenloser Tarif:** Supabase pausiert kostenlose Projekte nach 7 Tagen ohne Nutzung. Man kann sie im Supabase-Dashboard mit einem Klick wieder starten, die Daten bleiben erhalten. Wird das Tool regelmäßig genutzt, passiert das nicht. Sonst gibt es den Pro-Tarif (ca. 25 $/Monat).
- **Datensicherung:** Der kostenlose Tarif hat keine herunterladbaren Sicherungen. Eine Export-Funktion ist nicht Teil dieses Umbaus (siehe 12).

## 12. Nicht Teil dieses Umbaus

- Offline-Modus
- Rollen und Rechte
- Live-Abgleich in Echtzeit
- Kunden löschen (gibt es heute auch nicht)
- Daten-Export und Sicherung
- KI-Anbindung
- Versand des Angebots per E-Mail aus der App
- Übernahme der Beispielkunden

# Ave Businesshygiene GmbH – Angebots- und Kalkulationstool

Lauffähige Web-App (HTML/CSS/JS, kein Build-Schritt) als Startpunkt für die Weiterentwicklung
in Claude Code. Setzt das Design aus dem Canvas 1:1 um – rechnet aber echt.

## Starten

```bash
cd ave-kalkulationstool
python3 -m http.server 8000
# danach http://localhost:8000 im Browser öffnen
```

Ein Doppelklick auf `index.html` funktioniert auch, allerdings speichert Safari über `file://`
nichts dauerhaft – deshalb besser über den lokalen Server starten.

## Aufbau

| Datei | Inhalt |
|---|---|
| `index.html` | Grundgerüst: Sidebar mit Navigation, Container für die Seiten |
| `styles.css` | Designtokens (Schwarz-Gold), Karten, Tabellen, Stepper, Druck-Layout |
| `app.js` | Daten, Berechnung, alle sechs Seiten, Hash-Router |
| `assets/logo.png` | Firmenlogo (Sidebar und Briefkopf) |

## Reiter

1. **Übersicht** – alle Vorgänge, Filter nach Kunde/Status, Suche
2. **Kunde anlegen** – Stammdaten Kunde und Objekt
3. **Grundriss** – Upload oder Raumbuch per Text (`Büros 120 m², 2× pro Woche`)
4. **Raumbuch** – bearbeitbare Räume mit Fläche, Belag, Nutzung, Turnus
5. **Kalkulation** – zwei Berechnungsarten, Kundenvorschau als fertiges Angebot, Druck/PDF
6. **Ausschreibung** – Unterlagen, KI-Einschätzung, Abgleich mit dem Firmenprofil

## Rechenlogik (`app.js`)

- `TURNUS` – Turnus → Einsätze pro Monat (4,33 Wochen/Monat)
- Methode **Preis pro m²**: `Betrag = Fläche × Preis/m²`
- Methode **Leistung pro Std.**: `Stunden = Fläche ÷ Leistung × Einsätze/Monat`,
  `Preis = Stunden × Stundenlohn`
- `summe()` liefert Netto, 19 % MwSt. und Brutto pro Monat

## Daten

Alles liegt im `localStorage` unter dem Schlüssel `ave-kalkulationstool-v1`
(Kunden mit Räumen, Firmenprofil, Oberflächenzustand). Beim ersten Start werden Beispieldaten
angelegt. Zum Zurücksetzen im Browser die Konsole öffnen und
`localStorage.removeItem('ave-kalkulationstool-v1')` ausführen.

## KI anbinden

In `app.js` steht die Funktion `fragenAnKI(frage)`. Dort eine eigene Backend-Route aufrufen:

```js
const r = await fetch('/api/ki', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ frage, profil: state.profil })
});
return (await r.json()).antwort;
```

Der API-Schlüssel gehört auf den Server, nicht in den Frontend-Code.

/* Ave Businesshygiene GmbH – Angebots- und Kalkulationstool
 * Reine Vanilla-JS-App, kein Build-Schritt. Daten liegen im localStorage.
 *
 * Aufbau:
 *   KONSTANTEN  – Turnus-Tabelle, Steuersatz, Firmendaten
 *   STORE       – Laden/Speichern/Seed der Daten
 *   HELFER      – Formatierung, Parsing, Icons
 *   VIEWS       – je eine render-Funktion pro Reiter
 *   ROUTER      – Hash-Routing (#/uebersicht, #/raumbuch, ...)
 */

/* ============================== KONSTANTEN ============================== */

const FIRMA = {
  name: 'Ave Businesshygiene GmbH',
  strasse: 'Waldeckerstraße 4',
  ort: '64546 Mörfelden-Walldorf',
  email: 'info@ave-businesshygiene.de',
  gf: 'André Pires'
};

const MWST = 0.19;

/** Turnus -> Einsätze pro Monat (4,33 Wochen/Monat). */
const TURNUS = {
  '1× wöchentlich': 4.33,
  '2× wöchentlich': 8.67,
  '3× wöchentlich': 13,
  '4× wöchentlich': 17.33,
  '5× wöchentlich': 21.67,
  '6× wöchentlich': 26,
  '7× wöchentlich': 30.33,
  '2× täglich': 43.33,
  '1× monatlich': 1,
  '2× monatlich': 2,
  '1× jährlich': 1 / 12,
  '2× jährlich': 2 / 12,
  '4× jährlich': 4 / 12
};

const STATUS = [
  'Stammdaten erfasst',
  'Grundriss hochgeladen',
  'Raumbuch erstellt',
  'Kalkulation erstellt',
  'An Kunden gesendet'
];

/* ================================ STORE ================================= */

const KEY = 'ave-kalkulationstool-v1';

const SEED = {
  activeId: 'k1',
  ui: { methode: 'preis', ansicht: 'intern' },
  profil: {
    umsatz: '', mitarbeiter: '', kunden: '', gruendung: '',
    haftpflicht: '', pq: '', referenzen: '',
    iso9001: true, iso14001: true, iso45001: false,
    tariftreue: false, unbedenklich: false, gewerbe: false
  },
  kunden: [
    {
      id: 'k1', firma: 'Musterfirma GmbH', ansprechpartner: 'M. Muster',
      telefon: '', email: '', objekt: 'Bürokomplex Musterstraße 12', objekttyp: 'Büro',
      strasse: 'Musterstraße 12', ort: '60000 Frankfurt am Main', notizen: '',
      status: 'Kalkulation erstellt', updated: 'vor 2 Stunden',
      stundenlohn: 15.8, grundriss: '',
      raeume: [
        { id: 'r1', name: 'Empfang',          flaeche: 28, belag: 'Fliese',  nutzung: 'Publikumsverkehr', turnus: '5× wöchentlich', leistung: 220, preisQm: 4.20 },
        { id: 'r2', name: 'Büro 1.01',        flaeche: 22, belag: 'Teppich', nutzung: 'Büro',             turnus: '3× wöchentlich', leistung: 260, preisQm: 2.80 },
        { id: 'r3', name: 'Flur EG',          flaeche: 46, belag: 'Fliese',  nutzung: 'Verkehrsfläche',   turnus: '5× wöchentlich', leistung: 480, preisQm: 3.60 },
        { id: 'r4', name: 'Besprechungsraum', flaeche: 19, belag: 'Teppich', nutzung: 'Büro',             turnus: '2× wöchentlich', leistung: 300, preisQm: 2.40 },
        { id: 'r5', name: 'Sanitärbereich',   flaeche: 14, belag: 'Fliese',  nutzung: 'Sanitär',          turnus: '5× wöchentlich', leistung: 90,  preisQm: 5.50 },
        { id: 'r6', name: 'Glasreinigung',    flaeche: 60, belag: 'Glas',    nutzung: 'Glasflächen',      turnus: '1× monatlich',   leistung: 30,  preisQm: 0.75 }
      ]
    },
    { id: 'k2', firma: 'Beispiel Verwaltung KG', ansprechpartner: '', telefon: '', email: '',
      objekt: 'Verwaltungsgebäude Nord', objekttyp: 'Büro', strasse: '', ort: '', notizen: '',
      status: 'Raumbuch erstellt', updated: 'gestern', stundenlohn: 15.8, grundriss: '', raeume: [] },
    { id: 'k3', firma: 'Musterpraxis Dr. Beispiel', ansprechpartner: '', telefon: '', email: '',
      objekt: 'Arztpraxis Zentrum', objekttyp: 'Praxis', strasse: '', ort: '', notizen: '',
      status: 'Grundriss hochgeladen', updated: 'vor 3 Tagen', stundenlohn: 15.8, grundriss: '', raeume: [] },
    { id: 'k4', firma: 'Beispiel Logistik GmbH', ansprechpartner: '', telefon: '', email: '',
      objekt: 'Lagerhalle Ost', objekttyp: 'Gewerbe', strasse: '', ort: '', notizen: '',
      status: 'Stammdaten erfasst', updated: 'vor 5 Tagen', stundenlohn: 15.8, grundriss: '', raeume: [] },
    { id: 'k5', firma: 'Musterhandel AG', ansprechpartner: '', telefon: '', email: '',
      objekt: 'Filiale Innenstadt', objekttyp: 'Gewerbe', strasse: '', ort: '', notizen: '',
      status: 'An Kunden gesendet', updated: 'vor 1 Woche', stundenlohn: 15.8, grundriss: '', raeume: [] }
  ]
};

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('localStorage nicht verfügbar – Daten gelten nur für diese Sitzung.', e);
  }
  return JSON.parse(JSON.stringify(SEED));
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    /* z. B. Safari über file:// – App läuft trotzdem, nur ohne Speichern. */
  }
}

function kunde() {
  return state.kunden.find(k => k.id === state.activeId) || state.kunden[0];
}

function setKunde(id) {
  state.activeId = id;
  save();
  render();
}

function neueId(prefix) {
  return prefix + Math.random().toString(36).slice(2, 8);
}

/* ================================ HELFER ================================ */

const euro = n => (isFinite(n) ? n : 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
const zahl = (n, d = 2) => (isFinite(n) ? n : 0).toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** "850.000 €" / "1.234,56" -> Zahl */
function parseNum(v) {
  if (typeof v === 'number') return v;
  const s = String(v ?? '').replace(/[^\d.,-]/g, '').replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  return isFinite(n) ? n : 0;
}

function heute() {
  return new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const ICON = {
  check: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
  clock: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 2"/></svg>',
  alert: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="7.5" x2="12" y2="13"/><line x1="12" y1="16.5" x2="12" y2="16.5"/></svg>',
  info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16.5"/><line x1="12" y1="7.5" x2="12" y2="7.5"/></svg>',
  upload: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 18a4.5 4.5 0 0 1-1-8.9A5.5 5.5 0 0 1 17.5 8 4 4 0 0 1 17 16"/><path d="M12 20v-8"/><path d="M9 15l3-3 3 3"/></svg>',
  sparkle: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z"/><path d="M18.5 16.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8Z"/></svg>',
  pencil: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  trash: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7"/><path d="M6 7l1 13.5A1.5 1.5 0 0 0 8.5 22h7a1.5 1.5 0 0 0 1.5-1.5L18 7"/></svg>'
};

function turnusSelect(value, attrs = '') {
  const opts = Object.keys(TURNUS)
    .map(t => `<option${t === value ? ' selected' : ''}>${t}</option>`).join('');
  return `<select ${attrs}>${opts}</select>`;
}

function kundenLeiste(extra = '') {
  const k = kunde();
  const opts = state.kunden.map(x =>
    `<option value="${x.id}"${x.id === k.id ? ' selected' : ''}>${esc(x.firma)}</option>`).join('');
  return `
    <div class="filterbar">
      <label for="kundeSel">Kunde</label>
      <select id="kundeSel" data-action="switch-kunde">${opts}</select>
      <label for="objektSel">Objekt</label>
      <select id="objektSel"><option>${esc(k.objekt || '—')}</option></select>
      ${extra || `<span class="spacer hint">Alle Angaben auf dieser Seite gelten für ${esc(k.firma)}</span>`}
    </div>`;
}

function stepper(aktiv) {
  const schritte = ['Kundendaten', 'Grundriss', 'Raumbuch', 'Kalkulation'];
  return '<div class="stepper">' + schritte.map((s, i) => {
    const nr = i + 1;
    const cls = nr < aktiv ? 'done' : nr === aktiv ? 'on' : '';
    const dot = nr < aktiv ? ICON.check.replace('15', '14').replace('15', '14') : nr;
    const line = i < schritte.length - 1
      ? `<div class="step-line${nr < aktiv ? ' done' : ''}"></div>` : '';
    return `<div class="step ${cls}"><div class="dot">${dot}</div><span>${s}</span></div>${line}`;
  }).join('') + '</div>';
}

/* ============================= BERECHNUNG =============================== */

/** Betrag einer Position pro Monat – je nach Methode. */
function positionsBetrag(raum, methode, stundenlohn) {
  if (methode === 'leistung') {
    return stundenMonat(raum) * stundenlohn;
  }
  return (raum.flaeche || 0) * (raum.preisQm || 0);
}

function stundenMonat(raum) {
  const faktor = TURNUS[raum.turnus] || 0;
  if (!raum.leistung) return 0;
  return (raum.flaeche || 0) / raum.leistung * faktor;
}

function summe(k, methode) {
  const netto = k.raeume.reduce((s, r) => s + positionsBetrag(r, methode, k.stundenlohn || 0), 0);
  const mwst = netto * MWST;
  return { netto, mwst, brutto: netto + mwst };
}

/* ================================ VIEWS ================================= */

const view = () => document.getElementById('view');

/* ------------------------------ Übersicht ------------------------------- */

let filter = { kunde: 'Alle Kunden', status: 'Alle Status', suche: '' };

function viewUebersicht() {
  const rows = state.kunden.filter(k => {
    if (filter.kunde !== 'Alle Kunden' && k.firma !== filter.kunde) return false;
    if (filter.status !== 'Alle Status' && k.status !== filter.status) return false;
    const q = filter.suche.trim().toLowerCase();
    if (q && !(k.firma + ' ' + k.objekt).toLowerCase().includes(q)) return false;
    return true;
  });

  const badge = s => s === 'An Kunden gesendet' ? 'badge done'
    : s === 'Kalkulation erstellt' ? 'badge gold' : 'badge';

  const ziel = s => s === 'Stammdaten erfasst' ? '#/grundriss'
    : s === 'Grundriss hochgeladen' ? '#/raumbuch' : '#/kalkulation';

  view().innerHTML = `
    <div class="page-head" style="margin-bottom:28px">
      <div>
        <h1>Übersicht</h1>
        <p class="lead">Alle laufenden Vorgänge von der Kundenanlage bis zum versendeten Angebot.</p>
      </div>
      <a class="btn btn-primary" href="#/kunde">+ Neuen Kunden anlegen</a>
    </div>

    <div class="filterbar">
      <label for="fKunde">Kunde</label>
      <select id="fKunde">
        ${['Alle Kunden', ...state.kunden.map(k => k.firma)]
          .map(o => `<option${o === filter.kunde ? ' selected' : ''}>${esc(o)}</option>`).join('')}
      </select>
      <label for="fStatus">Status</label>
      <select id="fStatus">
        ${['Alle Status', ...STATUS]
          .map(o => `<option${o === filter.status ? ' selected' : ''}>${esc(o)}</option>`).join('')}
      </select>
      <input id="fSuche" type="search" placeholder="Kunde oder Objekt suchen" value="${esc(filter.suche)}" aria-label="Kunde oder Objekt suchen">
    </div>

    <div class="card flat">
      <table>
        <thead>
          <tr><th>Kunde</th><th>Objekt</th><th>Status</th><th>Aktualisiert</th><th></th></tr>
        </thead>
        <tbody>
          ${rows.length ? rows.map(k => `
            <tr>
              <td class="name">${esc(k.firma)}</td>
              <td class="muted">${esc(k.objekt)}</td>
              <td><span class="${badge(k.status)}">${esc(k.status)}</span></td>
              <td class="muted">${esc(k.updated || '')}</td>
              <td class="right"><button class="link" data-open="${k.id}" data-ziel="${ziel(k.status)}">Öffnen →</button></td>
            </tr>`).join('')
            : `<tr><td colspan="5" class="muted">Keine Vorgänge für diesen Filter.</td></tr>`}
        </tbody>
      </table>
    </div>`;

  document.getElementById('fKunde').onchange = e => { filter.kunde = e.target.value; render(); };
  document.getElementById('fStatus').onchange = e => { filter.status = e.target.value; render(); };
  const s = document.getElementById('fSuche');
  s.oninput = e => {
    filter.suche = e.target.value;
    const pos = e.target.selectionStart;
    render();
    const n = document.getElementById('fSuche');
    n.focus(); n.setSelectionRange(pos, pos);
  };
  view().querySelectorAll('[data-open]').forEach(b => {
    b.onclick = () => { state.activeId = b.dataset.open; save(); location.hash = b.dataset.ziel; };
  });
}

/* ---------------------------- Kunde anlegen ----------------------------- */

function viewKunde() {
  view().innerHTML = `
    <div class="eyebrow">Neuer Vorgang</div>
    <h1>Kundendaten erfassen</h1>
    <p class="lead">Stammdaten des Kunden und des zu reinigenden Objekts.</p>

    ${stepper(1)}

    <div class="card">
      <h3>Kunde</h3>
      <div class="grid-2" style="margin-bottom:28px">
        <div><label class="field" for="firma">Firmenname</label><input id="firma" type="text" placeholder="z. B. Musterfirma GmbH"></div>
        <div><label class="field" for="ap">Ansprechpartner</label><input id="ap" type="text" placeholder="Vor- und Nachname"></div>
        <div><label class="field" for="tel">Telefon</label><input id="tel" type="tel" placeholder="+49 …"></div>
        <div><label class="field" for="mail">E-Mail</label><input id="mail" type="email" placeholder="name@firma.de"></div>
      </div>

      <h3>Objekt</h3>
      <div class="grid-2">
        <div><label class="field" for="objekt">Objektbezeichnung</label><input id="objekt" type="text" placeholder="z. B. Bürokomplex Musterstraße 12"></div>
        <div><label class="field" for="typ">Objekttyp</label>
          <select id="typ"><option>Büro</option><option>Praxis</option><option>Gewerbe</option><option>Wohnanlage</option><option>Sonstiges</option></select>
        </div>
        <div><label class="field" for="str">Straße &amp; Hausnummer</label><input id="str" type="text" placeholder="Musterstraße 12"></div>
        <div><label class="field" for="ort">PLZ &amp; Ort</label><input id="ort" type="text" placeholder="60000 Frankfurt am Main"></div>
      </div>

      <div style="margin-top:20px">
        <label class="field" for="notiz">Notizen</label>
        <textarea id="notiz" rows="3" placeholder="Besonderheiten, Zugang, Ansprechzeiten …"></textarea>
      </div>

      <div class="actions">
        <a class="btn btn-ghost" href="#/uebersicht">Abbrechen</a>
        <button class="btn btn-primary" id="speichern">Weiter: Grundriss hochladen</button>
      </div>
    </div>`;

  document.getElementById('speichern').onclick = () => {
    const firma = document.getElementById('firma').value.trim();
    if (!firma) { document.getElementById('firma').focus(); return; }
    const neu = {
      id: neueId('k'),
      firma,
      ansprechpartner: document.getElementById('ap').value.trim(),
      telefon: document.getElementById('tel').value.trim(),
      email: document.getElementById('mail').value.trim(),
      objekt: document.getElementById('objekt').value.trim(),
      objekttyp: document.getElementById('typ').value,
      strasse: document.getElementById('str').value.trim(),
      ort: document.getElementById('ort').value.trim(),
      notizen: document.getElementById('notiz').value.trim(),
      status: 'Stammdaten erfasst',
      updated: 'gerade eben',
      stundenlohn: 15.8,
      grundriss: '',
      raeume: []
    };
    state.kunden.unshift(neu);
    state.activeId = neu.id;
    save();
    location.hash = '#/grundriss';
  };
}

/* ------------------------------ Grundriss ------------------------------- */

function viewGrundriss() {
  const k = kunde();
  view().innerHTML = `
    ${kundenLeiste()}
    <h1>Grundriss hochladen</h1>
    <p class="lead">Grundriss hochladen – oder die Räume direkt als Text erfassen. Beides wird zum Raumbuch.</p>

    ${stepper(2)}

    <div class="dropzone" id="drop">
      <div class="disc">${ICON.upload}</div>
      <b>Grundriss hier ablegen oder Datei auswählen</b>
      <p>Unterstützte Formate: PDF, JPG, PNG, DWG</p>
      <button class="btn btn-primary" type="button" id="pick">Datei auswählen</button>
      <input type="file" id="file" accept=".pdf,.jpg,.jpeg,.png,.dwg" hidden>
      <div class="filelist" id="filelist">${k.grundriss ? 'Hochgeladen: ' + esc(k.grundriss) : ''}</div>
    </div>

    <div class="divider"><div class="rule"></div><span>oder</span><div class="rule"></div></div>

    <div class="card">
      <h3>Raumbuch per Text erfassen</h3>
      <p class="lead" style="margin-bottom:18px">Ein Raum pro Zeile: Bezeichnung, Fläche und Häufigkeit pro Woche.</p>
      <label class="field" for="txt">Beschreibung</label>
      <textarea id="txt" rows="8" placeholder="Büros 120 m², 2× pro Woche&#10;WC-Anlagen 18 m², 5× pro Woche&#10;Duschen 12 m², 5× pro Woche&#10;Besprechungsraum 25 m², 5× pro Woche&#10;Flur 40 m², 2× pro Woche"></textarea>
      <div class="actions split" style="margin-top:16px">
        <span class="hint">Erkannt werden z. B. „Büros 120 m², 2x wöchentlich“ oder „WC-Anlagen 5x“.</span>
        <button class="btn btn-primary" id="ausText">Raumbuch aus Text erstellen</button>
      </div>
    </div>

    <div class="note">${ICON.info}<p>Ob aus Grundriss oder Text – daraus entsteht ein fertiger Vorschlag fürs Raumbuch, den Sie im nächsten Schritt prüfen und anpassen.</p></div>

    <div class="actions">
      <a class="btn btn-ghost" href="#/kunde">Zurück</a>
      <a class="btn btn-primary" href="#/raumbuch">Weiter: Raumbuch erstellen</a>
    </div>`;

  const input = document.getElementById('file');
  const drop = document.getElementById('drop');
  document.getElementById('pick').onclick = () => input.click();
  drop.onclick = e => { if (e.target === drop || e.target.closest('.disc, b, p')) input.click(); };
  input.onchange = () => {
    if (!input.files.length) return;
    k.grundriss = input.files[0].name;
    k.status = 'Grundriss hochgeladen';
    k.updated = 'gerade eben';
    save(); render();
  };
  ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', e => {
    const f = e.dataTransfer.files[0];
    if (!f) return;
    k.grundriss = f.name; k.status = 'Grundriss hochgeladen'; k.updated = 'gerade eben';
    save(); render();
  });

  document.getElementById('ausText').onclick = () => {
    const raeume = parseRaumtext(document.getElementById('txt').value);
    if (!raeume.length) { alert('Keine Räume erkannt. Bitte pro Zeile einen Raum angeben.'); return; }
    k.raeume = raeume;
    k.status = 'Raumbuch erstellt';
    k.updated = 'gerade eben';
    save();
    location.hash = '#/raumbuch';
  };
}

/**
 * Wandelt Freitext in Raumbuch-Zeilen.
 * Erkennt Bezeichnung, Fläche (m²) und Häufigkeit (2x, 2× pro Woche, täglich, monatlich …).
 */
function parseRaumtext(text) {
  return String(text || '').split('\n').map(z => z.trim()).filter(Boolean).map(zeile => {
    const flaecheMatch = zeile.match(/(\d+[.,]?\d*)\s*(?:m²|m2|qm)/i);
    const flaeche = flaecheMatch ? parseNum(flaecheMatch[1]) : 0;

    let turnus = '1× wöchentlich';
    const malMatch = zeile.match(/(\d+)\s*(?:×|x|mal)/i);
    const proMonat = /monat/i.test(zeile);
    const proJahr = /jahr/i.test(zeile);
    const taeglich = /täglich|taeglich/i.test(zeile);

    if (taeglich) turnus = '5× wöchentlich';
    if (malMatch) {
      const n = Math.min(7, Math.max(1, parseInt(malMatch[1], 10)));
      if (proMonat) turnus = n >= 2 ? '2× monatlich' : '1× monatlich';
      else if (proJahr) turnus = n >= 4 ? '4× jährlich' : n >= 2 ? '2× jährlich' : '1× jährlich';
      else turnus = n + '× wöchentlich';
    } else if (proMonat) turnus = '1× monatlich';
    else if (proJahr) turnus = '1× jährlich';

    const name = zeile
      .replace(/(\d+[.,]?\d*)\s*(?:m²|m2|qm)/ig, '')
      .replace(/\d+\s*(?:×|x|mal)\s*(?:pro\s*)?(?:woche|wöchentlich|monat|monatlich|jahr|jährlich|täglich|tag)?/ig, '')
      .replace(/täglich|monatlich|jährlich|pro woche/ig, '')
      .replace(/[,;–-]+\s*$/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim() || 'Raum';

    return {
      id: neueId('r'), name, flaeche, belag: '', nutzung: '',
      turnus, leistung: 250, preisQm: 3.00
    };
  });
}

/* ------------------------------- Raumbuch -------------------------------- */

function viewRaumbuch() {
  const k = kunde();
  const gesamt = k.raeume.reduce((s, r) => s + (r.flaeche || 0), 0);

  view().innerHTML = `
    ${kundenLeiste()}
    <div class="page-head">
      <div>
        <h1>Raumbuch</h1>
        <p class="lead">Aus Grundriss oder Text erstellt – bitte prüfen und anpassen.</p>
      </div>
      <button class="btn btn-ghost" id="addRaum">+ Raum hinzufügen</button>
    </div>

    ${stepper(3)}

    <div class="card flat">
      <table>
        <thead>
          <tr><th>Raum</th><th>Fläche</th><th>Bodenbelag</th><th>Nutzung</th><th>Turnus</th><th></th></tr>
        </thead>
        <tbody>
          ${k.raeume.map((r, i) => `
            <tr data-i="${i}">
              <td><input class="w-160" type="text" value="${esc(r.name)}" data-f="name"></td>
              <td><input class="w-70" type="text" value="${zahl(r.flaeche, 0)}" data-f="flaeche"> m²</td>
              <td><input class="w-110" type="text" value="${esc(r.belag)}" data-f="belag"></td>
              <td><input class="w-110" type="text" value="${esc(r.nutzung)}" data-f="nutzung"></td>
              <td>${turnusSelect(r.turnus, 'class="w-160" data-f="turnus"')}</td>
              <td class="right">
                <button class="icon-btn" data-del="${i}" aria-label="Raum löschen">${ICON.trash}</button>
              </td>
            </tr>`).join('')}
          <tr class="total">
            <td>Gesamt</td><td class="value">${zahl(gesamt, 0)} m²</td><td colspan="4"></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="actions split">
      <a class="btn btn-ghost" href="#/grundriss">Zurück</a>
      <a class="btn btn-primary" href="#/kalkulation">Weiter: Kalkulation erstellen</a>
    </div>`;

  view().querySelectorAll('tbody tr[data-i]').forEach(tr => {
    const i = +tr.dataset.i;
    tr.querySelectorAll('[data-f]').forEach(el => {
      el.onchange = () => {
        const f = el.dataset.f;
        k.raeume[i][f] = (f === 'flaeche') ? parseNum(el.value) : el.value;
        k.updated = 'gerade eben';
        save(); render();
      };
    });
  });
  view().querySelectorAll('[data-del]').forEach(b => {
    b.onclick = () => { k.raeume.splice(+b.dataset.del, 1); save(); render(); };
  });
  document.getElementById('addRaum').onclick = () => {
    k.raeume.push({ id: neueId('r'), name: 'Neuer Raum', flaeche: 0, belag: '', nutzung: '', turnus: '1× wöchentlich', leistung: 250, preisQm: 3.00 });
    k.status = 'Raumbuch erstellt';
    save(); render();
  };
}

/* ------------------------------ Kalkulation ------------------------------ */

function viewKalkulation() {
  const k = kunde();
  const ansicht = state.ui.ansicht;
  const methode = state.ui.methode;
  const s = summe(k, methode);

  view().innerHTML = `
    ${kundenLeiste()}
    <div class="page-head">
      <div>
        <h1>Kalkulation</h1>
        <p class="lead">Berechnet aus dem Raumbuch. In der Kundenvorschau bereit zum Versand.</p>
      </div>
      <div class="toggle no-print">
        <button class="${ansicht === 'intern' ? 'on' : ''}" data-ansicht="intern">Interne Ansicht</button>
        <button class="${ansicht === 'kunde' ? 'on' : ''}" data-ansicht="kunde">Kundenvorschau</button>
      </div>
    </div>

    ${stepper(4)}

    ${ansicht === 'intern' ? internAnsicht(k, methode, s) : kundenAnsicht(k, s)}

    <div class="actions split">
      <a class="btn btn-ghost" href="#/raumbuch">Zurück</a>
      <div class="group">
        <button class="btn btn-ghost" id="pdf">Als PDF / drucken</button>
        <button class="btn btn-primary" id="senden">Angebot an Kunden senden</button>
      </div>
    </div>`;

  view().querySelectorAll('[data-ansicht]').forEach(b => {
    b.onclick = () => { state.ui.ansicht = b.dataset.ansicht; save(); render(); };
  });
  view().querySelectorAll('[data-methode]').forEach(b => {
    b.onclick = () => { state.ui.methode = b.dataset.methode; save(); render(); };
  });

  const lohn = document.getElementById('lohn');
  if (lohn) lohn.onchange = () => { k.stundenlohn = parseNum(lohn.value); save(); render(); };

  view().querySelectorAll('tbody tr[data-i]').forEach(tr => {
    const i = +tr.dataset.i;
    tr.querySelectorAll('[data-f]').forEach(el => {
      el.onchange = () => {
        const f = el.dataset.f;
        k.raeume[i][f] = (f === 'turnus') ? el.value : parseNum(el.value);
        k.status = 'Kalkulation erstellt';
        k.updated = 'gerade eben';
        save(); render();
      };
    });
  });

  document.getElementById('pdf').onclick = () => {
    if (state.ui.ansicht !== 'kunde') { state.ui.ansicht = 'kunde'; save(); render(); }
    setTimeout(() => window.print(), 100);
  };
  document.getElementById('senden').onclick = () => {
    const betreff = `Angebot ${FIRMA.name} – ${k.objekt || k.firma}`;
    const text = `Sehr geehrte Damen und Herren,

anbei unser Angebot für ${k.objekt || k.firma}.

Gesamtbetrag pro Monat: ${euro(s.brutto)} (inkl. 19 % MwSt.)

Mit freundlichen Grüßen
${FIRMA.gf}
${FIRMA.name}`;
    k.status = 'An Kunden gesendet';
    k.updated = 'gerade eben';
    save();
    location.href = `mailto:${k.email || ''}?subject=${encodeURIComponent(betreff)}&body=${encodeURIComponent(text)}`;
  };
}

function internAnsicht(k, methode, s) {
  const kopf = methode === 'preis'
    ? `<tr><th>Position</th><th>Fläche</th><th>Turnus</th><th>Preis / m² / Monat</th><th class="right">Betrag</th></tr>`
    : `<tr><th>Position</th><th>Fläche</th><th>Leistung (m²/Std.)</th><th>Turnus</th><th>Stundenlohn</th><th class="right">Preis</th></tr>`;

  const zeilen = k.raeume.map((r, i) => {
    const betrag = positionsBetrag(r, methode, k.stundenlohn || 0);
    if (methode === 'preis') {
      return `<tr data-i="${i}">
        <td class="name">${esc(r.name)}</td>
        <td><input class="w-70" type="text" value="${zahl(r.flaeche, 0)}" data-f="flaeche"> m²</td>
        <td>${turnusSelect(r.turnus, 'class="w-160" data-f="turnus"')}</td>
        <td><input class="w-90" type="text" value="${zahl(r.preisQm)}" data-f="preisQm"> €</td>
        <td class="right">${euro(betrag)}</td>
      </tr>`;
    }
    return `<tr data-i="${i}">
      <td class="name">${esc(r.name)}</td>
      <td><input class="w-70" type="text" value="${zahl(r.flaeche, 0)}" data-f="flaeche"> m²</td>
      <td><input class="w-90" type="text" value="${zahl(r.leistung, 0)}" data-f="leistung"> m²/Std.</td>
      <td>${turnusSelect(r.turnus, 'class="w-160" data-f="turnus"')}
          <div class="hint">= ${zahl(TURNUS[r.turnus] || 0, 0)}×/Monat · ${zahl(stundenMonat(r))} Std.</div></td>
      <td class="muted">${euro(k.stundenlohn || 0)}</td>
      <td class="right">${euro(betrag)}</td>
    </tr>`;
  }).join('');

  const spalten = methode === 'preis' ? 4 : 5;

  return `
    <div class="page-head no-print" style="margin-bottom:18px">
      <div class="hint" style="font-weight:600;color:var(--muted)">Berechnungsart</div>
      <div class="toggle">
        <button class="${methode === 'preis' ? 'on' : ''}" data-methode="preis">Preis pro m²</button>
        <button class="${methode === 'leistung' ? 'on' : ''}" data-methode="leistung">Leistung pro Std.</button>
      </div>
    </div>

    ${methode === 'leistung' ? `
      <div class="note" style="margin:0 0 18px">${ICON.info}
        <p>Preis je Position = Fläche ÷ Flächenleistung (m²/Std.) × Turnus (Einsätze pro Monat) × Stundenlohn.</p>
      </div>
      <div class="card tight" style="margin-bottom:20px;display:flex;align-items:center;gap:16px;flex-wrap:wrap">
        <label class="field" for="lohn" style="margin:0">Stundenlohn (für die Berechnung unten)</label>
        <input id="lohn" class="w-110" type="text" value="${zahl(k.stundenlohn || 0)}"> €/Std.
      </div>` : ''}

    <div class="card flat">
      <table>
        <thead>${kopf}</thead>
        <tbody>
          ${zeilen}
          <tr class="sum"><td colspan="${spalten}" class="right">Nettosumme</td><td class="right value">${euro(s.netto)}</td></tr>
          <tr class="sum"><td colspan="${spalten}" class="right">zzgl. 19 % MwSt.</td><td class="right">${euro(s.mwst)}</td></tr>
          <tr class="total"><td colspan="${spalten}" class="right">Gesamtsumme / Monat</td><td class="right value">${euro(s.brutto)}</td></tr>
        </tbody>
      </table>
    </div>`;
}

function kundenAnsicht(k, s) {
  const flaeche = k.raeume.filter(r => r.name !== 'Glasreinigung').reduce((a, r) => a + (r.flaeche || 0), 0);
  const anzahl = k.raeume.filter(r => r.name !== 'Glasreinigung').length;
  const glas = k.raeume.find(r => r.name === 'Glasreinigung');
  const glasBetrag = glas ? positionsBetrag(glas, state.ui.methode, k.stundenlohn || 0) : 0;
  const unterhalt = s.netto - glasBetrag;

  return `
    <div class="offer">
      <div class="offer-head">
        <div>
          <img src="assets/logo.png" alt="${esc(FIRMA.name)}">
          <div class="small">${esc(FIRMA.strasse)} · ${esc(FIRMA.ort)}<br>${esc(FIRMA.email)}</div>
        </div>
        <div class="meta">
          <b>Angebot</b>
          <div class="small">Angebot Nr. ${new Date().getFullYear()}-${String(state.kunden.indexOf(k) + 1).padStart(3, '0')}</div>
          <div class="small">Datum: ${heute()}</div>
        </div>
      </div>

      <div class="to">
        <div class="eyebrow" style="color:var(--nav-icon)">An</div>
        ${esc(k.firma)}<br>${esc(k.strasse || '')}<br>${esc(k.ort || '')}
      </div>

      <div class="subject">Angebot für die Unterhaltsreinigung – ${esc(k.objekt || '')}</div>
      <p>Sehr geehrte Damen und Herren, vielen Dank für Ihre Anfrage. Auf Basis der gemeinsamen Objektbegehung unterbreiten wir Ihnen gerne folgendes Angebot:</p>

      <table style="margin-bottom:24px">
        <thead><tr><th>Leistung</th><th class="right">Betrag</th></tr></thead>
        <tbody>
          <tr>
            <td>Unterhaltsreinigung, ${anzahl} Räume, gesamt ${zahl(flaeche, 0)} m²</td>
            <td class="right">${euro(unterhalt)}</td>
          </tr>
          ${glas ? `<tr><td>Glasreinigung, ${esc(glas.turnus)}</td><td class="right">${euro(glasBetrag)}</td></tr>` : ''}
          <tr class="sum"><td class="right">Nettosumme</td><td class="right">${euro(s.netto)}</td></tr>
          <tr class="sum"><td class="right">zzgl. 19 % MwSt.</td><td class="right">${euro(s.mwst)}</td></tr>
          <tr class="total"><td class="right">Gesamtbetrag / Monat</td><td class="right value">${euro(s.brutto)}</td></tr>
        </tbody>
      </table>

      <p class="terms">Das Angebot gilt vorbehaltlich einer abschließenden Objektbesichtigung. Laufzeit, Kündigungsfrist und weitere Konditionen entnehmen Sie bitte unseren Allgemeinen Geschäftsbedingungen.</p>
      <p class="sign">Mit freundlichen Grüßen<br><strong>${esc(FIRMA.gf)}</strong><br>Geschäftsführer, ${esc(FIRMA.name)}</p>
    </div>`;
}

/* ----------------------------- Ausschreibung ----------------------------- */

const AUSSCHREIBUNG_BEISPIEL = {
  titel: 'Gebäudereinigung Kreisverwaltung [Beispiel]',
  vergabestelle: 'Kreisverwaltung [Beispiel]',
  frist: '[Datum]',
  preisgewicht: 60,
  qualitaetsgewicht: 40,
  mindestumsatz: 500000,
  haftpflicht: 3000000,
  referenzen: 3
};

function kriterien(p, a = AUSSCHREIBUNG_BEISPIEL) {
  const refs = String(p.referenzen || '').split('\n').filter(z => z.trim()).length;
  return [
    { t: 'Qualitätsmanagement', g: 'ISO 9001', h: p.iso9001 ? 'Zertifikat vorhanden' : 'nicht hinterlegt', ok: !!p.iso9001 },
    { t: 'Umweltmanagement', g: 'ISO 14001', h: p.iso14001 ? 'Zertifikat vorhanden' : 'nicht hinterlegt', ok: !!p.iso14001 },
    { t: 'Mindestjahresumsatz', g: euro(a.mindestumsatz) + ' p. a.', h: p.umsatz ? esc(p.umsatz) : 'im Profil ergänzen', ok: parseNum(p.umsatz) >= a.mindestumsatz },
    { t: 'Referenzen', g: a.referenzen + ' vergleichbare Objekte', h: refs ? refs + ' hinterlegt' : 'im Profil ergänzen', ok: refs >= a.referenzen },
    { t: 'Betriebshaftpflicht', g: euro(a.haftpflicht) + ' Deckung', h: p.haftpflicht ? esc(p.haftpflicht) : 'im Profil ergänzen', ok: parseNum(p.haftpflicht) >= a.haftpflicht },
    { t: 'Tariftreue & Mindestlohn', g: 'Erklärung nach Landesvergabegesetz', h: p.tariftreue ? 'Erklärung liegt vor' : 'Formblatt beilegen', ok: !!p.tariftreue },
    { t: 'Unbedenklichkeitsbescheinigungen', g: 'Finanzamt, BG, Krankenkasse', h: p.unbedenklich ? 'liegen vor' : 'nicht älter als 6 Monate – anfordern', ok: !!p.unbedenklich, kritisch: true },
    { t: 'Handelsregister- & Gewerbeauszug', g: 'aktuelle Auszüge', h: p.gewerbe ? 'liegen vor' : 'anfordern', ok: !!p.gewerbe },
    { t: 'Präqualifikation', g: 'PQ-VOL oder Einzelnachweise', h: p.pq ? esc(p.pq) : 'im Profil ergänzen', ok: !!String(p.pq || '').trim() }
  ];
}

function viewAusschreibung() {
  const p = state.profil;
  const krit = kriterien(p);
  const erfuellt = krit.filter(k => k.ok).length;
  const quote = Math.round(erfuellt / krit.length * 100);
  const umfang = 2 * Math.PI * 50;
  const bogen = umfang * quote / 100;

  view().innerHTML = `
    <div class="eyebrow">Ausschreibungen</div>
    <h1>Ausschreibung prüfen</h1>
    <p class="lead" style="margin-bottom:28px">Unterlagen einlesen, Anforderungen mit dem Firmenprofil abgleichen und die Gewinnchance einschätzen.</p>

    <div class="filterbar">
      <label for="vergabe">Vergabestelle</label>
      <select id="vergabe"><option>Alle Vergabestellen</option><option selected>${esc(AUSSCHREIBUNG_BEISPIEL.vergabestelle)}</option></select>
      <label for="ausschr">Ausschreibung</label>
      <select id="ausschr"><option selected>${esc(AUSSCHREIBUNG_BEISPIEL.titel)}</option><option>Neue Ausschreibung</option></select>
      <span class="spacer hint">Analyse und Firmenprofil beziehen sich auf die gewählte Ausschreibung</span>
    </div>

    <div class="dropzone" id="dropA">
      <div class="disc">${ICON.upload}</div>
      <b>Ausschreibungsunterlagen hier ablegen</b>
      <p>Leistungsverzeichnis, Vergabeunterlagen, Formblätter – PDF, DOCX oder ZIP</p>
      <button class="btn btn-primary" type="button" id="pickA">Datei auswählen</button>
      <input type="file" id="fileA" multiple hidden>
      <div class="filelist" id="filelistA"></div>
    </div>

    <div style="display:flex;align-items:center;gap:14px;margin-top:40px;flex-wrap:wrap">
      <span class="ki-badge">${ICON.sparkle} KI-Analyse</span>
      <span class="eyebrow" style="margin:0">${esc(AUSSCHREIBUNG_BEISPIEL.titel)}</span>
      <span class="hint" style="color:var(--muted)">Abgleich mit dem Firmenprofil von ${esc(FIRMA.name)}</span>
    </div>

    <div class="analysis">
      <div class="card gauge">
        <svg width="160" height="160" viewBox="0 0 120 120" role="img" aria-label="Gewinnchance ${quote} Prozent">
          <defs><linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#7C5B1B"/><stop offset="55%" stop-color="#C79A3D"/><stop offset="100%" stop-color="#F0CE73"/>
          </linearGradient></defs>
          <circle cx="60" cy="60" r="50" fill="none" stroke="#EAE3D2" stroke-width="11"/>
          <circle cx="60" cy="60" r="50" fill="none" stroke="url(#ring)" stroke-width="11" stroke-linecap="round"
                  stroke-dasharray="${bogen.toFixed(1)} ${umfang.toFixed(1)}" transform="rotate(-90 60 60)"/>
          <text x="60" y="56" text-anchor="middle" font-family="Fraunces, serif" font-size="30" font-weight="700" fill="#1A1712">${quote} %</text>
          <text x="60" y="76" text-anchor="middle" font-family="Work Sans, sans-serif" font-size="11" fill="#6B6558">KI-Prognose</text>
        </svg>
        <h3 style="margin-top:14px">${quote >= 70 ? 'Gute Ausgangslage' : quote >= 40 ? 'Machbar – Lücken schließen' : 'Noch zu viele offene Punkte'}</h3>
        <p class="lead">${erfuellt} von ${krit.length} Eignungskriterien sind belegt.</p>
      </div>
      <div class="tiles">
        <div class="card tight tile">
          <div class="k">Eignungskriterien</div>
          <div class="v">${krit.length} geprüft</div>
          <div class="s">${erfuellt} belegt · ${krit.length - erfuellt} offen</div>
        </div>
        <div class="card tight tile">
          <div class="k">Zuschlagskriterien</div>
          <div class="v">Preis ${AUSSCHREIBUNG_BEISPIEL.preisgewicht} % · Qualität ${AUSSCHREIBUNG_BEISPIEL.qualitaetsgewicht} %</div>
          <div class="s">Preisgewicht hoch – Kalkulation eng führen</div>
        </div>
        <div class="card tight tile">
          <div class="k">Abgabefrist</div>
          <div class="v">${esc(AUSSCHREIBUNG_BEISPIEL.frist)}</div>
          <div class="s">Ortstermin verpflichtend – Termin einplanen</div>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:20px">
      <h3>${ICON.sparkle.replace('14', '17')} Einschätzung der KI</h3>
      <p style="font-size:14.5px;line-height:1.65;color:var(--ink);margin:0 0 14px">${kiText(krit, quote)}</p>
      <p class="hint" style="margin:0">Erzeugt aus den hochgeladenen Unterlagen und dem Firmenprofil. Ersetzt keine rechtliche Prüfung.</p>
    </div>

    <h2>Anforderungen im Abgleich mit ${esc(FIRMA.name)}</h2>
    <div class="card flat">
      <table>
        <thead><tr><th>Anforderung</th><th>Gefordert</th><th>${esc(FIRMA.name)}</th><th>Status</th></tr></thead>
        <tbody>
          ${krit.map(c => `
            <tr>
              <td class="name">${esc(c.t)}</td>
              <td class="muted">${c.g}</td>
              <td class="muted">${c.h}</td>
              <td>${c.ok
                ? `<span class="status ok">${ICON.check}erfüllt</span>`
                : c.kritisch
                  ? `<span class="status bad">${ICON.alert}fehlt</span>`
                  : `<span class="status open">${ICON.clock}offen</span>`}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>

    <div class="card" style="margin-top:20px">
      <label class="field" for="frage">${ICON.sparkle.replace('14', '17')} Frage an die KI zu dieser Ausschreibung</label>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <input id="frage" type="text" style="flex:1 1 380px;min-width:260px" placeholder="z. B. Welche Fristen und Termine muss ich einhalten?">
        <button class="btn btn-primary" id="fragen">Fragen</button>
      </div>
      <div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap">
        <button class="btn-chip">Welche Nachweise fehlen uns?</button>
        <button class="btn-chip">Wie ist die Vertragsstrafe geregelt?</button>
        <button class="btn-chip">Welcher Preis ist realistisch?</button>
        <button class="btn-chip">Fasse das Leistungsverzeichnis zusammen</button>
      </div>
      <div id="antwort" class="note" style="display:none"></div>
    </div>

    <h2>Firmenprofil – Eckdaten</h2>
    <p class="lead" style="margin-bottom:18px">Grundlage für jede Ausschreibungsprüfung. Einmal pflegen, bei jeder Analyse verwendet.</p>

    <div class="card">
      <div class="grid-3" style="margin-bottom:26px">
        <div><label class="field" for="p-umsatz">Jahresumsatz</label><input id="p-umsatz" data-p="umsatz" type="text" placeholder="z. B. 850.000 €" value="${esc(p.umsatz)}"></div>
        <div><label class="field" for="p-mitarbeiter">Mitarbeiter</label><input id="p-mitarbeiter" data-p="mitarbeiter" type="text" placeholder="Anzahl" value="${esc(p.mitarbeiter)}"></div>
        <div><label class="field" for="p-kunden">Kunden / Objekte</label><input id="p-kunden" data-p="kunden" type="text" placeholder="Anzahl betreuter Objekte" value="${esc(p.kunden)}"></div>
        <div><label class="field" for="p-gruendung">Gegründet</label><input id="p-gruendung" data-p="gruendung" type="text" placeholder="Jahr" value="${esc(p.gruendung)}"></div>
        <div><label class="field" for="p-haftpflicht">Betriebshaftpflicht</label><input id="p-haftpflicht" data-p="haftpflicht" type="text" placeholder="Deckungssumme" value="${esc(p.haftpflicht)}"></div>
        <div><label class="field" for="p-pq">Präqualifikation</label><input id="p-pq" data-p="pq" type="text" placeholder="PQ-Nummer" value="${esc(p.pq)}"></div>
      </div>

      <div class="field">Zertifikate &amp; Nachweise</div>
      <div class="checks" style="margin-bottom:26px">
        <label><input type="checkbox" data-p="iso9001" ${p.iso9001 ? 'checked' : ''}>ISO 9001 (Qualität)</label>
        <label><input type="checkbox" data-p="iso14001" ${p.iso14001 ? 'checked' : ''}>ISO 14001 (Umwelt)</label>
        <label><input type="checkbox" data-p="iso45001" ${p.iso45001 ? 'checked' : ''}>ISO 45001 (Arbeitsschutz)</label>
        <label><input type="checkbox" data-p="tariftreue" ${p.tariftreue ? 'checked' : ''}>Tariftreueerklärung</label>
        <label><input type="checkbox" data-p="unbedenklich" ${p.unbedenklich ? 'checked' : ''}>Unbedenklichkeitsbescheinigungen</label>
        <label><input type="checkbox" data-p="gewerbe" ${p.gewerbe ? 'checked' : ''}>Handelsregister- &amp; Gewerbeauszug</label>
      </div>

      <label class="field" for="p-referenzen">Referenzkunden</label>
      <textarea id="p-referenzen" data-p="referenzen" rows="4" placeholder="Ein Referenzobjekt pro Zeile: Kunde, Objektart, Fläche, Zeitraum">${esc(p.referenzen)}</textarea>

      <div class="actions"><button class="btn btn-primary" id="profilSpeichern">Firmenprofil speichern</button></div>
    </div>

    <div class="actions split">
      <a class="btn btn-ghost" href="#/uebersicht">Zurück zur Übersicht</a>
      <a class="btn btn-primary" href="#/kalkulation">Kalkulation für Ausschreibung starten</a>
    </div>`;

  const fa = document.getElementById('fileA');
  document.getElementById('pickA').onclick = () => fa.click();
  fa.onchange = () => {
    document.getElementById('filelistA').textContent =
      [...fa.files].map(f => f.name).join(' · ') || '';
  };

  view().querySelectorAll('[data-p]').forEach(el => {
    el.onchange = () => {
      state.profil[el.dataset.p] = el.type === 'checkbox' ? el.checked : el.value;
      save(); render();
    };
  });
  document.getElementById('profilSpeichern').onclick = () => { save(); render(); };

  view().querySelectorAll('.btn-chip').forEach(b => {
    b.onclick = () => { document.getElementById('frage').value = b.textContent; };
  });
  document.getElementById('fragen').onclick = async () => {
    const box = document.getElementById('antwort');
    box.style.display = 'flex';
    box.innerHTML = ICON.info + '<p>' + esc(await fragenAnKI(document.getElementById('frage').value)) + '</p>';
  };
}

function kiText(krit, quote) {
  const offen = krit.filter(k => !k.ok);
  const teile = [];
  teile.push(`Von ${krit.length} Eignungskriterien sind ${krit.length - offen.length} belegt – das ergibt eine Gewinnchance von rund ${quote} %.`);
  if (offen.length) {
    teile.push(`Offen sind: ${offen.map(o => o.t).join(', ')}. Ohne diese Nachweise droht der Ausschluss aus formalen Gründen, unabhängig vom Preis.`);
  } else {
    teile.push('Alle formalen Anforderungen sind belegt – entscheidend ist jetzt der Preis.');
  }
  teile.push(`Der Preis geht mit ${AUSSCHREIBUNG_BEISPIEL.preisgewicht} % in die Wertung ein: die Kalkulation am besten über die Flächenleistung rechnen, um belastbar zu bleiben.`);
  return teile.join(' ');
}

/**
 * Anbindung an ein Sprachmodell.
 * Hier den Aufruf an die eigene Backend-Route oder die Anthropic-API einsetzen,
 * z. B.:
 *   const r = await fetch('/api/ki', { method:'POST', body: JSON.stringify({ frage, profil: state.profil }) });
 *   return (await r.json()).antwort;
 * Der API-Schlüssel gehört NICHT in diese Datei, sondern auf den Server.
 */
async function fragenAnKI(frage) {
  if (!frage.trim()) return 'Bitte zuerst eine Frage eingeben.';
  return 'Noch keine KI angebunden. In app.js die Funktion fragenAnKI() mit der eigenen Backend-Route verbinden, dann wird diese Frage mit den hochgeladenen Unterlagen und dem Firmenprofil beantwortet.';
}

/* ================================ ROUTER ================================ */

const ROUTES = {
  uebersicht: viewUebersicht,
  kunde: viewKunde,
  grundriss: viewGrundriss,
  raumbuch: viewRaumbuch,
  kalkulation: viewKalkulation,
  ausschreibung: viewAusschreibung
};

function aktuelleRoute() {
  const r = location.hash.replace('#/', '').trim();
  return ROUTES[r] ? r : 'uebersicht';
}

function render() {
  const r = aktuelleRoute();
  document.querySelectorAll('#nav a').forEach(a =>
    a.classList.toggle('active', a.dataset.route === r));
  ROUTES[r]();

  const sel = document.querySelector('[data-action="switch-kunde"]');
  if (sel) sel.onchange = e => setKunde(e.target.value);

  window.scrollTo({ top: 0 });
}

window.addEventListener('hashchange', render);
document.addEventListener('DOMContentLoaded', () => {
  if (!location.hash) location.hash = '#/uebersicht';
  render();
});

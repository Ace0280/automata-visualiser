/* ═══════════════════════════════════════════════════
   ui.js — DOM Helpers, Toast, Table, Theme, History
   ═══════════════════════════════════════════════════ */

let nfaMode = false;

/* ── Toast ──────────────────────────────────────── */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}



/* ── NFA Toggle ─────────────────────────────────── */
function toggleNFA() {
  nfaMode = !nfaMode;
  automaton.isNFA = nfaMode;
  updateNFAUI();
}

function updateNFAUI() {
  const badge = document.getElementById('mode-badge');
  badge.textContent = nfaMode ? 'NFA MODE' : 'DFA MODE';
  badge.className = nfaMode ? 'badge nfa-badge' : 'badge dfa-badge';

  // Show/hide topbar convert button
  const convertBtn = document.getElementById('btn-convert-topbar');
  if (convertBtn) convertBtn.style.display = nfaMode ? 'inline-flex' : 'none';
}

function setNFAMode(isNFA) {
  nfaMode = isNFA;
  automaton.isNFA = isNFA;
  updateNFAUI();
}

/* ── Transition Table ───────────────────────────── */
function buildTransitionTable() {
  readFormIntoAutomaton();
  automaton.isNFA = nfaMode;
  buildTransitionTableFromData();
}

function buildTransitionTableFromData() {
  const cont = document.getElementById('trans-table-container');
  const allSymbols = nfaMode ? getAlphabetWithEpsilon() : automaton.alpha;
  const gtc = `80px ${allSymbols.map(() => '1fr').join(' ')}`;

  let html = `<div class="trans-grid">
    <div class="hdr" style="grid-template-columns:${gtc}">
      <span>State</span>${allSymbols.map(a => `<span>${a}</span>`).join('')}
    </div>`;

  automaton.states.forEach(st => {
    html += `<div class="trans-row" style="grid-template-columns:${gtc}">
      <span>${st}</span>`;
    allSymbols.forEach(sym => {
      const existing = automaton.transitions[st] && automaton.transitions[st][sym];
      const val = existing
        ? (Array.isArray(existing) ? existing.join(',') : existing)
        : '';
      html += `<input type="text" data-from="${st}" data-sym="${sym}"
               placeholder="${nfaMode ? '{...}' : '...'}" value="${val}">`;
    });
    html += `</div>`;
  });

  html += `</div>`;
  cont.innerHTML = html;
}

function getAlphabetWithEpsilon() {
  const syms = [...automaton.alpha];
  if (!syms.includes(EPSILON)) syms.push(EPSILON);
  return syms;
}

function readTransitionsFromTable() {
  const inputs = document.querySelectorAll('#trans-table-container input');
  automaton.transitions = {};
  inputs.forEach(inp => {
    const from = inp.dataset.from, sym = inp.dataset.sym;
    if (!automaton.transitions[from]) automaton.transitions[from] = {};
    const val = inp.value.trim();
    if (nfaMode) {
      automaton.transitions[from][sym] = val ? val.split(',').map(s => s.trim()) : [];
    } else {
      automaton.transitions[from][sym] = val;
    }
  });
}

/* ── Form Sync ──────────────────────────────────── */
function populateFormFromAutomaton() {
  document.getElementById('inp-states').value = automaton.states.join(', ');
  document.getElementById('inp-alpha').value  = automaton.alpha.join(', ');
  document.getElementById('inp-start').value  = automaton.start;
  document.getElementById('inp-final').value  = automaton.finals.join(', ');
}

/* ── Speed Control ──────────────────────────────── */
function getSimSpeed() {
  const slider = document.getElementById('speed-slider');
  return slider ? parseInt(slider.value, 10) : 700;
}

function initSpeedControl() {
  const slider = document.getElementById('speed-slider');
  const label  = document.getElementById('speed-label');
  if (!slider || !label) return;
  slider.addEventListener('input', () => {
    label.textContent = slider.value + 'ms';
  });
}

/* ── History Log ────────────────────────────────── */
function initHistoryPanel() {
  const header = document.querySelector('.history-header');
  const panel  = document.getElementById('history-panel');
  if (!header || !panel) return;
  header.addEventListener('click', () => {
    panel.classList.toggle('open');
  });
}

function addHistoryEntry(html) {
  const content = document.getElementById('history-content');
  if (!content) return;
  const entry = document.createElement('div');
  entry.className = 'history-entry';
  entry.innerHTML = html;
  content.appendChild(entry);
  content.scrollTop = content.scrollHeight;
}

function clearHistory() {
  const content = document.getElementById('history-content');
  if (content) content.innerHTML = '';
}

/* ── Export / Import ────────────────────────────── */
function handleExport() {
  readTransitionsFromTable();
  const json = exportAutomatonJSON();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'automaton.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Automaton exported!');
}

function handleImport() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const success = importAutomatonJSON(ev.target.result);
      if (success) {
        setNFAMode(automaton.isNFA);
        populateFormFromAutomaton();
        buildTransitionTableFromData();
        drawAutomaton();
        resetSim();
        showToast('Automaton imported!');
      } else {
        showToast('Import failed — invalid JSON.');
      }
    };
    reader.readAsText(file);
  });
  input.click();
}

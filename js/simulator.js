/* ═══════════════════════════════════════════════════
   simulator.js — DFA / NFA / ε-NFA Simulation Engine
   ═══════════════════════════════════════════════════ */

const sim = {
  step: 0,
  current: null,
  string: '',
  path: [],
  running: false,
  finished: false
};

/* ── Status & Display ───────────────────────────── */

function setStatus(type, text) {
  const el = document.getElementById('status-badge');
  el.className = 'status-badge status-' + type;
  el.textContent = text;
}

function renderCharDisplay() {
  const str = sim.string;
  let html = '';
  for (let i = 0; i < str.length; i++) {
    let cls = 'char-token';
    if (i === sim.step) cls += ' active';
    else if (i < sim.step) cls += ' done';
    html += `<div class="${cls}">${str[i]}</div>`;
  }
  document.getElementById('char-display').innerHTML = html;
}

function setTrace(msg) {
  document.getElementById('trace-log').innerHTML = msg;
}

/* ── Simulation Control ─────────────────────────── */

function initSimState() {
  sim.string   = document.getElementById('inp-string').value;
  sim.step     = 0;
  sim.path     = [automaton.start];
  sim.running  = true;
  sim.finished = false;

  clearHistory();
  resetAllHighlights();

  if (nfaMode) {
    const useEpsClosure = hasEpsilonTransitions();
    sim.current = useEpsClosure
      ? epsilonClosure(new Set([automaton.start]))
      : new Set([automaton.start]);

    sim.current.forEach(s => highlightNode(s, true));

    const stateStr = `{${[...sim.current].join(', ')}}`;
    addHistoryEntry(`<span class="step-num">Start</span> — <span class="state-info">${stateStr}</span>`);
    setTrace(`<span class="step">Start:</span> States = ${stateStr}`);
  } else {
    sim.current = automaton.start;
    highlightNode(sim.current, true);
    addHistoryEntry(`<span class="step-num">Start</span> — <span class="state-info">${automaton.start}</span>`);
    setTrace(`<span class="step">Start:</span> State = ${automaton.start}`);
  }

  renderCharDisplay();
  setStatus('running', 'RUNNING');
}

function startSim() {
  if (sim.finished) resetSim();
  if (!sim.running) initSimState();
  if (sim.string.length === 0) { finishSim(); return; }

  const speed = getSimSpeed();
  const interval = setInterval(() => {
    if (!sim.running || sim.finished) { clearInterval(interval); return; }
    const done = stepSimLogic();
    if (done) clearInterval(interval);
  }, speed);
}

function stepSim() {
  if (sim.finished) return true;
  if (!sim.running) initSimState();
  if (sim.string.length === 0) { finishSim(); return true; }
  return stepSimLogic();
}

function stepSimLogic() {
  if (sim.step >= sim.string.length) { finishSim(); return true; }

  const sym = sim.string[sim.step];
  resetAllHighlights();

  if (nfaMode) {
    const useEpsClosure = hasEpsilonTransitions();
    const nextSet = new Set();

    sim.current.forEach(state => {
      const t = automaton.transitions[state];
      if (!t) return;
      const targets = t[sym];
      if (!targets) return;
      const arr = Array.isArray(targets) ? targets : [targets];
      arr.forEach(tgt => {
        if (tgt) nextSet.add(tgt);
      });
      arr.forEach(tgt => {
        if (tgt) highlightEdge(state, tgt, true);
      });
    });

    // Apply epsilon closure on result
    sim.current = useEpsClosure ? epsilonClosure(nextSet) : nextSet;
    sim.current.forEach(s => highlightNode(s, true));

    const stateStr = `{${[...sim.current].join(', ')}}`;
    sim.path.push(stateStr);

    const msg = `<span class="step-num">Step ${sim.step+1}</span> Read '${sym}' → <span class="state-info">${stateStr}</span>`;
    addHistoryEntry(msg);
    setTrace(`<span class="step">Step ${sim.step+1}:</span> Read '${sym}' → ${stateStr}`);
  } else {
    const t = automaton.transitions[sim.current];
    const next = t ? t[sym] : null;
    if (!next) {
      const msg = `<span style="color:var(--reject)">Dead state reached at step ${sim.step+1}</span>`;
      addHistoryEntry(msg);
      setTrace(`<span style="color:var(--reject)">Dead state reached.</span>`);
      sim.running  = false;
      sim.finished = true;
      setStatus('reject', 'REJECT');
      renderCharDisplay();
      return true;
    }
    highlightEdge(sim.current, next, true);
    highlightNode(next, true);
    sim.path.push(next);

    const msg = `<span class="step-num">Step ${sim.step+1}</span> δ(${sim.current}, ${sym}) = <span class="state-info">${next}</span>`;
    addHistoryEntry(msg);
    setTrace(`<span class="step">Step ${sim.step+1}:</span> δ(${sim.current}, ${sym}) = ${next}`);
    sim.current = next;
  }

  sim.step++;
  renderCharDisplay();

  if (sim.step >= sim.string.length) { finishSim(); return true; }
  return false;
}

function finishSim() {
  sim.finished = true;
  sim.running  = false;
  let accepted = false;

  if (nfaMode) {
    accepted = [...sim.current].some(s => automaton.finals.includes(s));
  } else {
    accepted = automaton.finals.includes(sim.current);
  }

  setStatus(accepted ? 'accept' : 'reject', accepted ? 'ACCEPT' : 'REJECT');
  const pathStr = sim.path.join(' → ');
  const resultHtml = `<span style="color:${accepted ? 'var(--accept)' : 'var(--reject)'}">${accepted ? '✓ ACCEPTED' : '✗ REJECTED'}</span> | Path: ${pathStr}`;
  setTrace(resultHtml);
  addHistoryEntry(`<strong style="color:${accepted ? 'var(--accept)' : 'var(--reject)'}">${accepted ? '✓ ACCEPTED' : '✗ REJECTED'}</strong>`);

  // Open history panel to show results
  const panel = document.getElementById('history-panel');
  if (panel && !panel.classList.contains('open')) {
    panel.classList.add('open');
  }
}

function resetSim() {
  sim.step     = 0;
  sim.current  = null;
  sim.string   = '';
  sim.path     = [];
  sim.running  = false;
  sim.finished = false;

  resetAllHighlights();
  if (automaton.start) {
    highlightNode(automaton.start, false);
  }
  document.getElementById('char-display').innerHTML = '';
  setTrace('Ready. Press ▶ Simulate to start.');
  setStatus('idle', 'IDLE');
  clearHistory();
}

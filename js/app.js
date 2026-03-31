/* ═══════════════════════════════════════════════════
   app.js — Main Entry Point
   ═══════════════════════════════════════════════════ */

/**
 * Load a preset and sync the entire UI.
 */
function loadPreset(name) {
  applyPreset(name);
  setNFAMode(automaton.isNFA);
  populateFormFromAutomaton();
  document.getElementById('inp-string').value = PRESETS[name].testStr;
  buildTransitionTableFromData();
  drawAutomaton();
  resetSim();
  showToast('Preset loaded!');
}

/* ── Init ───────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  // Initialize UI components
  initThemeToggle();
  initSpeedControl();
  initHistoryPanel();

  // Wire sidebar buttons
  document.getElementById('btn-build-table').addEventListener('click', buildTransitionTable);
  document.getElementById('btn-draw-graph').addEventListener('click', drawAutomaton);
  document.getElementById('mode-badge').addEventListener('click', toggleNFA);
  document.getElementById('btn-simulate').addEventListener('click', startSim);
  document.getElementById('btn-step').addEventListener('click', stepSim);
  document.getElementById('btn-reset').addEventListener('click', resetSim);
  document.getElementById('btn-export').addEventListener('click', handleExport);
  document.getElementById('btn-import').addEventListener('click', handleImport);

  // Preset buttons
  document.querySelectorAll('[data-preset]').forEach(btn => {
    btn.addEventListener('click', () => loadPreset(btn.dataset.preset));
  });

  // Load default
  loadPreset('even_zeros');
});

/* ── Resize ─────────────────────────────────────── */
window.addEventListener('resize', () => {
  if (automaton.states.length) drawAutomaton();
});

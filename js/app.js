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
  initSpeedControl();
  initHistoryPanel();

  // Wire sidebar buttons
  document.getElementById('btn-build-table').addEventListener('click', buildTransitionTable);
  document.getElementById('btn-draw-graph').addEventListener('click', drawAutomaton);
  document.getElementById('mode-badge').addEventListener('click', toggleNFA);
  
  // Simulation controls
  document.getElementById('btn-simulate').addEventListener('click', startSim);
  document.getElementById('btn-step').addEventListener('click', stepSim);
  document.getElementById('btn-reset').addEventListener('click', resetSim);
  
  // Import/Export
  document.getElementById('btn-export').addEventListener('click', handleExport);
  document.getElementById('btn-import').addEventListener('click', handleImport);
  if (typeof exportLaTeX === 'function') document.getElementById('btn-export-latex').addEventListener('click', exportLaTeX);
  if (typeof exportCSV === 'function') document.getElementById('btn-export-csv').addEventListener('click', exportCSV);

  // Batch Testing
  if (typeof runBatch === 'function') {
    document.getElementById('btn-batch-run').addEventListener('click', runBatch);
    document.getElementById('btn-batch-close').addEventListener('click', () => {
      document.getElementById('batch-panel').style.display = 'none';
      document.getElementById('canvas-split-container').style.height = '100%';
    });
    document.getElementById('btn-batch-export').addEventListener('click', () => {
      if (typeof exportBatchCSV === 'function') exportBatchCSV(window.lastBatchResults || []);
    });
  }

  // URL Sharing
  if (typeof encodeAutomatonToURL === 'function') {
    document.getElementById('btn-share').addEventListener('click', () => {
      readTransitionsFromTable();
      const url = encodeAutomatonToURL();
      navigator.clipboard.writeText(url).then(() => {
        showToast('Link copied to clipboard!');
      }).catch(() => {
        prompt('Copy this link:', url);
      });
    });
  }

  // NFA -> DFA Converter
  if (typeof buildAndShowDFA === 'function') {
    document.getElementById('btn-convert-topbar').addEventListener('click', buildAndShowDFA);
    document.getElementById('btn-close-dfa').addEventListener('click', () => {
      document.getElementById('dfa-pane').style.display = 'none';
      // Redraw is handled by ResizeObserver
    });
    document.getElementById('btn-load-dfa').addEventListener('click', loadConvertedDFA);
  }

  // Regex Builder
  if (typeof handleRegexBuild === 'function') {
    document.getElementById('btn-regex-build').addEventListener('click', handleRegexBuild);
  }

  // Preset buttons
  document.querySelectorAll('[data-preset]').forEach(btn => {
    btn.addEventListener('click', () => loadPreset(btn.dataset.preset));
  });

  // Keyboard Shortcuts (Feature 5)
  document.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
    switch(e.key) {
      case ' ':      e.preventDefault(); stepSim(); break;
      case 'Enter':  startSim(); break;
      case 'r':
      case 'R':
      case 'Escape': resetSim(); break;
      case 'g':
      case 'G':      drawAutomaton(); break;
    }
  });

  // Check URL Hash for shared state
  if (typeof decodeAutomatonFromURL === 'function') {
    const sharedJSON = decodeAutomatonFromURL();
    if (sharedJSON) {
      const success = importAutomatonJSON(sharedJSON);
      if (success) {
        setNFAMode(automaton.isNFA);
        populateFormFromAutomaton();
        buildTransitionTableFromData();
        drawAutomaton();
        resetSim();
        showToast('Shared automaton loaded!');
        return; // Skip loading default preset
      }
    }
    
    // Also listen for hash changes
    window.addEventListener('hashchange', () => {
      const json = decodeAutomatonFromURL();
      if (json && importAutomatonJSON(json)) {
        setNFAMode(automaton.isNFA);
        populateFormFromAutomaton();
        buildTransitionTableFromData();
        drawAutomaton();
        resetSim();
        showToast('Shared automaton loaded!');
      }
    });
  }

  // Load default
  loadPreset('even_zeros');
});

/* ── Resize (Handled by ResizeObserver) ────────────────── */
// Observer to redraw automaton when container size changes
const resizeObserver = new ResizeObserver(entries => {
  for (let entry of entries) {
    if (entry.target.id === 'main-pane') {
      if (automaton && automaton.states && automaton.states.length) {
        redrawAutomaton();
      }
    } else if (entry.target.id === 'dfa-pane') {
      if (typeof convertedDFA !== 'undefined' && convertedDFA) {
        // DFA pane redraw also shouldn't reset NFA sim
        drawAutomatonToTarget(convertedDFA, '#dfa-result-svg');
      }
    }
  }
});

// Setup observers when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  const mainPane = document.getElementById('main-pane');
  const dfaPane = document.getElementById('dfa-pane');
  if (mainPane) resizeObserver.observe(mainPane);
  if (dfaPane) resizeObserver.observe(dfaPane);
});

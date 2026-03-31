/* ═══════════════════════════════════════════════════
   export.js — LaTeX / CSV Export Functions
   ═══════════════════════════════════════════════════ */

function exportLaTeX() {
  readTransitionsFromTable();
  const symbols = nfaMode ? getAlphabetWithEpsilon() : automaton.alpha;
  
  let headerRow = 'State & ' + symbols.join(' & ') + ' \\\\\\n\\hline\\n';
  let latex = '\\begin{tabular}{|c|' + symbols.map(() => 'c').join('|') + '|}\\n\\hline\\n' + headerRow;
  
  const rows = automaton.states.map(state => {
    const cells = symbols.map(sym => {
      let val = automaton.transitions[state] ? automaton.transitions[state][sym] : null;
      if (Array.isArray(val)) {
        if (val.length === 0) return '$\\emptyset$';
        return '\\{' + val.join(',') + '\\}';
      }
      return val || '—';
    });
    
    const isFinal = automaton.finals.includes(state);
    const isStart = (state === automaton.start);
    let prefix = '';
    if (isStart && isFinal) prefix = '*\\rightarrow ';
    else if (isStart) prefix = '\\rightarrow ';
    else if (isFinal) prefix = '*';
    
    return `${prefix}${state} & ` + cells.join(' & ') + ' \\\\';
  });
  
  latex += rows.join('\\n') + '\\n\\hline\\n\\end{tabular}';
  
  const blob = new Blob([latex.replace(/\\\\n/g, '\n')], { type: 'text/plain' });
  downloadBlob(blob, 'transition-table.tex');
}

function exportCSV() {
  readTransitionsFromTable();
  const symbols = nfaMode ? getAlphabetWithEpsilon() : automaton.alpha;
  
  let csv = 'State,' + symbols.join(',') + '\n';
  
  automaton.states.forEach(state => {
    const cells = symbols.map(sym => {
      let val = automaton.transitions[state] ? automaton.transitions[state][sym] : null;
      if (Array.isArray(val)) {
        return `"{${val.join(',')}}"`;
      }
      return val || '';
    });
    const isFinal = automaton.finals.includes(state) ? '*' : '';
    const isStart = state === automaton.start ? '->' : '';
    csv += `${isStart}${isFinal}${state},` + cells.join(',') + '\n';
  });
  
  const blob = new Blob([csv], { type: 'text/csv' });
  downloadBlob(blob, 'transition-table.csv');
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

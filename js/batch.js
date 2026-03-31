/* ═══════════════════════════════════════════════════
   batch.js — Batch String Testing
   ═══════════════════════════════════════════════════ */

window.lastBatchResults = [];

function runBatch() {
  const text = document.getElementById('inp-batch').value;
  const strings = text.split('\n').map(s => s.trim()).filter(s => s !== '');
  
  if(strings.length === 0) {
      showToast("Please enter at least one string to batch test.");
      return;
  }
  
  window.lastBatchResults = strings.map(s => silentSimulate(s));
  renderBatchTable(window.lastBatchResults);
  
  document.getElementById('batch-panel').style.display = 'flex';
  document.getElementById('canvas-split-container').style.height = 'calc(100% - 200px)';

  const accepts = window.lastBatchResults.filter(r => r.accepted).length;
  document.getElementById('batch-summary').textContent = `${accepts} / ${window.lastBatchResults.length} accepted`;
}

function silentSimulate(inputString) {
  if (!nfaMode) {
    let current = automaton.start;
    const path = [current];
    for (const char of inputString) {
      let targets = automaton.transitions[current] ? automaton.transitions[current][char] : null;
      let next = Array.isArray(targets) ? targets[0] : targets;
      if (!next) return { string: inputString, path, accepted: false };
      path.push(next);
      current = next;
    }
    return { string: inputString, path, accepted: automaton.finals.includes(current) };
  } else {
    let current = epsilonClosure(new Set([automaton.start]));
    const serializeSet = s => '{' + [...s].sort().join(',') + '}';
    const path = [serializeSet(current)];
    
    for (const char of inputString) {
      let nextSet = new Set();
      for (const st of current) {
        if (automaton.transitions[st] && automaton.transitions[st][char]) {
          const targets = automaton.transitions[st][char];
          if (Array.isArray(targets)) targets.forEach(t => nextSet.add(t));
          else nextSet.add(targets);
        }
      }
      current = epsilonClosure(nextSet);
      path.push(serializeSet(current));
    }
    const accepted = [...current].some(s => automaton.finals.includes(s));
    return { string: inputString, path, accepted };
  }
}

function renderBatchTable(results) {
  const cont = document.getElementById('batch-table-container');
  let html = `<table class="batch-table">
    <thead>
      <tr><th>#</th><th>String</th><th>Path</th><th>Result</th></tr>
    </thead>
    <tbody>`;
  
  results.forEach((res, i) => {
    const cls = res.accepted ? 'batch-result-accept' : 'batch-result-reject';
    const txt = res.accepted ? 'ACCEPT' : 'REJECT';
    const pathTxt = res.path.join(' &rarr; ');
    html += `<tr>
      <td>${i+1}</td>
      <td><span style="font-weight:600;color:var(--primary-dark)">${res.string || '<em>(empty)</em>'}</span></td>
      <td style="color:var(--text-secondary);font-size:10px;font-family:'JetBrains Mono',monospace;">${pathTxt}</td>
      <td class="${cls}">${txt}</td>
    </tr>`;
  });
  html += `</tbody></table>`;
  cont.innerHTML = html;
}

function exportBatchCSV(results) {
  let csv = "String,Path,Result\n";
  results.forEach(r => {
    csv += `"${r.string}","${r.path.join(' -> ')}","${r.accepted ? 'ACCEPT' : 'REJECT'}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'batch-results.csv';
  a.click();
  URL.revokeObjectURL(url);
}

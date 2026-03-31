/* ═══════════════════════════════════════════════════
   converter.js — NFA to DFA Subset Construction
   ═══════════════════════════════════════════════════ */

let convertedDFA = null;

function nfaToDFA() {
  const alphabet = automaton.alpha.filter(a => a !== EPSILON);
  const startClosure = epsilonClosure(new Set([automaton.start]));
  
  const dfaStates = [];
  const dfaTransitions = {};
  const queue = [startClosure];
  const visited = new Map();
  let labelCounter = 0;
  
  function getLabel(stateSet) {
    const key = [...stateSet].sort().join(',');
    if (visited.has(key)) return visited.get(key);
    const label = 'D' + labelCounter++;
    visited.set(key, label);
    dfaStates.push({ label, nfaStates: stateSet });
    return label;
  }

  const startLabel = getLabel(startClosure);
  
  while (queue.length > 0) {
    const current = queue.shift();
    const currentLabel = getLabel(current);
    dfaTransitions[currentLabel] = {};
    
    for (const sym of alphabet) {
      let nextSet = new Set();
      for (const nfaState of current) {
        let targets = automaton.transitions[nfaState] ? automaton.transitions[nfaState][sym] : [];
        if (!Array.isArray(targets) && targets) targets = [targets];
        if (targets) targets.forEach(t => { if (t) nextSet.add(t); });
      }
      
      nextSet = epsilonClosure(nextSet);
      
      if (nextSet.size === 0) {
        dfaTransitions[currentLabel][sym] = 'DEAD';
      } else {
        const nextLabel = getLabel(nextSet);
        dfaTransitions[currentLabel][sym] = nextLabel;
        const nextKey = [...nextSet].sort().join(',');
        if (!visited.has(nextKey)) queue.push(nextSet);
      }
    }
  }
  
  // ensure DEAD state exists if referenced
  let hasDead = false;
  for (const st in dfaTransitions) {
    for (const sym in dfaTransitions[st]) {
      if (dfaTransitions[st][sym] === 'DEAD') hasDead = true;
    }
  }
  if (hasDead) {
    dfaTransitions['DEAD'] = {};
    alphabet.forEach(sym => dfaTransitions['DEAD'][sym] = 'DEAD');
    dfaStates.push({ label: 'DEAD', nfaStates: new Set() });
  }
  
  const dfaFinals = dfaStates
    .filter(ds => [...ds.nfaStates].some(s => automaton.finals.includes(s)))
    .map(ds => ds.label);
    
  return {
    states: dfaStates.map(ds => ds.label),
    alpha: alphabet,
    start: startLabel,
    finals: dfaFinals,
    transitions: dfaTransitions,
    isNFA: false,
    stateMap: dfaStates
  };
}

function buildAndShowDFA() {
  readTransitionsFromTable(); // Ensure state is synced
  convertedDFA = nfaToDFA();
  
  document.getElementById('dfa-pane').style.display = 'flex';
  
  // Log construction steps to history
  let stepsLog = `<strong style="color:var(--primary)">Subset Construction Log:</strong><br>`;
  stepsLog += `Start: D0 = {${[...epsilonClosure(new Set([automaton.start]))].join(',')}}<br>`;
  
  convertedDFA.stateMap.forEach(ds => {
    convertedDFA.alpha.forEach(sym => {
      const tgt = convertedDFA.transitions[ds.label][sym];
      stepsLog += `&delta;(${ds.label}, ${sym}) = ${tgt || 'DEAD'}<br>`;
    });
  });
  
  if (typeof addHistoryEntry === 'function') addHistoryEntry(stepsLog);
  if (typeof drawAutomatonToTarget === 'function') {
      drawAutomatonToTarget(convertedDFA, '#dfa-result-svg');
  }
}

function loadConvertedDFA() {
  if (!convertedDFA) return;
  // Apply to global automaton
  automaton.states = convertedDFA.states;
  automaton.alpha = convertedDFA.alpha;
  automaton.start = convertedDFA.start;
  automaton.finals = convertedDFA.finals;
  automaton.transitions = convertedDFA.transitions;
  automaton.isNFA = false;
  
  setNFAMode(false);
  populateFormFromAutomaton();
  buildTransitionTableFromData();
  drawAutomaton();
  
  document.getElementById('dfa-pane').style.display = 'none';
  showToast('DFA loaded as active automaton.');
}

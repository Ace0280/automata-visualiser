/* ═══════════════════════════════════════════════════
   regex.js — Regex Parser & Thompson's Construction
   ═══════════════════════════════════════════════════ */

let rStateCounter = 0;

function new_r_state() {
  return 'r' + (rStateCounter++);
}

function parseRegex(regexStr) {
  let pos = 0;
  
  function parseExpr() {
    let left = parseConcat();
    while (pos < regexStr.length && regexStr[pos] === '|') {
      pos++;
      let right = parseConcat();
      left = { type: 'union', left, right };
    }
    return left;
  }
  
  function parseConcat() {
    let left = parseRepeat();
    while (pos < regexStr.length && !['|', ')', '*', '+', '?'].includes(regexStr[pos])) {
      let right = parseRepeat();
      left = { type: 'concat', left, right };
    }
    return left;
  }
  
  function parseRepeat() {
    let atom = parseAtom();
    if (pos < regexStr.length && (regexStr[pos] === '*' || regexStr[pos] === '+' || regexStr[pos] === '?')) {
      const op = regexStr[pos++];
      if (op === '*') return { type: 'star', child: atom };
      if (op === '+') return { type: 'plus', child: atom };
      if (op === '?') return { type: 'question', child: atom };
    }
    return atom;
  }
  
  function parseAtom() {
    if (pos >= regexStr.length) throw new Error("Unexpected end of expression");
    if (regexStr[pos] === '(') {
      pos++;
      let expr = parseExpr();
      if (regexStr[pos] !== ')') throw new Error("Mismatched parentheses");
      pos++;
      return expr;
    }
    if (['|', ')', '*', '+', '?'].includes(regexStr[pos])) {
      throw new Error(`Unexpected character: ${regexStr[pos]}`);
    }
    return { type: 'char', value: regexStr[pos++] };
  }
  
  return parseExpr();
}

function buildNFAFragment(astNode, transMap) {
  switch (astNode.type) {
    case 'char': {
      const s0 = new_r_state(), s1 = new_r_state();
      transMap[s0] = { [astNode.value]: [s1] };
      transMap[s1] = {};
      return { start: s0, accept: s1 };
    }
    case 'concat': {
      const left = buildNFAFragment(astNode.left, transMap);
      const right = buildNFAFragment(astNode.right, transMap);
      if (!transMap[left.accept]) transMap[left.accept] = {};
      if (!transMap[left.accept][EPSILON]) transMap[left.accept][EPSILON] = [];
      transMap[left.accept][EPSILON].push(right.start);
      return { start: left.start, accept: right.accept };
    }
    case 'union': {
      const left = buildNFAFragment(astNode.left, transMap);
      const right = buildNFAFragment(astNode.right, transMap);
      const s0 = new_r_state(), s1 = new_r_state();
      transMap[s0] = { [EPSILON]: [left.start, right.start] };
      transMap[s1] = {};
      if (!transMap[left.accept]) transMap[left.accept] = {};
      if (!transMap[left.accept][EPSILON]) transMap[left.accept][EPSILON] = [];
      transMap[left.accept][EPSILON].push(s1);
      
      if (!transMap[right.accept]) transMap[right.accept] = {};
      if (!transMap[right.accept][EPSILON]) transMap[right.accept][EPSILON] = [];
      transMap[right.accept][EPSILON].push(s1);
      
      return { start: s0, accept: s1 };
    }
    case 'star': {
      const inner = buildNFAFragment(astNode.child, transMap);
      const s0 = new_r_state(), s1 = new_r_state();
      transMap[s0] = { [EPSILON]: [inner.start, s1] };
      transMap[s1] = {};
      
      if (!transMap[inner.accept]) transMap[inner.accept] = {};
      if (!transMap[inner.accept][EPSILON]) transMap[inner.accept][EPSILON] = [];
      transMap[inner.accept][EPSILON].push(inner.start);
      transMap[inner.accept][EPSILON].push(s1);
      
      return { start: s0, accept: s1 };
    }
    case 'plus': {
      const inner1 = buildNFAFragment(astNode.child, transMap);
      const inner2 = buildNFAFragment({ type:'star', child: astNode.child }, transMap);
      if (!transMap[inner1.accept]) transMap[inner1.accept] = {};
      if (!transMap[inner1.accept][EPSILON]) transMap[inner1.accept][EPSILON] = [];
      transMap[inner1.accept][EPSILON].push(inner2.start);
      return { start: inner1.start, accept: inner2.accept };
    }
    case 'question': {
      const inner = buildNFAFragment(astNode.child, transMap);
      const s0 = new_r_state(), s1 = new_r_state();
      transMap[s0] = { [EPSILON]: [inner.start, s1] };
      transMap[s1] = {};
      if (!transMap[inner.accept]) transMap[inner.accept] = {};
      if (!transMap[inner.accept][EPSILON]) transMap[inner.accept][EPSILON] = [];
      transMap[inner.accept][EPSILON].push(s1);
      return { start: s0, accept: s1 };
    }
  }
}

function handleRegexBuild() {
  const inputStr = document.getElementById('inp-regex').value.replace(/\\s+/g, '');
  const errDiv = document.getElementById('regex-error');
  if (!inputStr) {
    errDiv.textContent = "Please enter a valid regular expression.";
    errDiv.style.display = 'block';
    return;
  }
  
  try {
    rStateCounter = 0;
    const ast = parseRegex(inputStr);
    const transMap = {};
    const frag = buildNFAFragment(ast, transMap);
    
    // Convert fragment to global Automaton
    const statesSet = new Set(Object.keys(transMap));
    const alphaSet = new Set();
    Object.values(transMap).forEach(ts => Object.keys(ts).forEach(k => {
      if (k !== EPSILON) alphaSet.add(k);
    }));
    
    automaton.states = [...statesSet].sort((a,b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));
    automaton.alpha = [...alphaSet].sort();
    automaton.start = frag.start;
    automaton.finals = [frag.accept];
    automaton.transitions = transMap;
    automaton.isNFA = true;
    
    setNFAMode(true);
    populateFormFromAutomaton();
    buildTransitionTableFromData();
    drawAutomaton();
    
    errDiv.style.display = 'none';
    showToast("NFA successfully built from Regex.");
  } catch(e) {
    errDiv.textContent = e.message;
    errDiv.style.display = 'block';
  }
}

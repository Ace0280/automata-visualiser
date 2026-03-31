/* ═══════════════════════════════════════════════════
   automaton.js — Data Model, Presets, ε-Closure
   ═══════════════════════════════════════════════════ */

const EPSILON = 'ε';

/**
 * Core automaton state — shared across all modules.
 */
const automaton = {
  states: [],
  alpha: [],
  start: '',
  finals: [],
  transitions: {},
  isNFA: false
};

/**
 * Built-in preset automata.
 */
const PRESETS = {
  even_zeros: {
    states: ['q0','q1'],
    alpha: ['0','1'],
    start: 'q0',
    finals: ['q0'],
    trans: {
      'q0': { '0': 'q1', '1': 'q0' },
      'q1': { '0': 'q0', '1': 'q1' }
    },
    isNFA: false,
    testStr: '0110'
  },

  ends_01: {
    states: ['q0','q1','q2'],
    alpha: ['0','1'],
    start: 'q0',
    finals: ['q2'],
    trans: {
      'q0': { '0': 'q1', '1': 'q0' },
      'q1': { '0': 'q1', '1': 'q2' },
      'q2': { '0': 'q1', '1': 'q0' }
    },
    isNFA: false,
    testStr: '101'
  },

  nfa_ab: {
    states: ['q0','q1','q2'],
    alpha: ['a','b'],
    start: 'q0',
    finals: ['q2'],
    trans: {
      'q0': { 'a': ['q0','q1'], 'b': ['q0'] },
      'q1': { 'b': ['q2'], 'a': [] },
      'q2': { 'a': [], 'b': [] }
    },
    isNFA: true,
    testStr: 'aab'
  },

  div3: {
    states: ['q0','q1','q2'],
    alpha: ['0','1'],
    start: 'q0',
    finals: ['q0'],
    trans: {
      'q0': { '0': 'q0', '1': 'q1' },
      'q1': { '0': 'q2', '1': 'q0' },
      'q2': { '0': 'q1', '1': 'q2' }
    },
    isNFA: false,
    testStr: '110'
  },

  nfa_epsilon: {
    states: ['q0','q1','q2'],
    alpha: ['a','b'],
    start: 'q0',
    finals: ['q2'],
    trans: {
      'q0': { 'a': ['q0'], 'b': [],     [EPSILON]: ['q1'] },
      'q1': { 'a': [],     'b': ['q1'], [EPSILON]: ['q2'] },
      'q2': { 'a': [],     'b': ['q2'], [EPSILON]: [] }
    },
    isNFA: true,
    testStr: 'abb'
  }
};

/**
 * Compute the epsilon closure of a set of states.
 * @param {Set<string>} stateSet
 * @returns {Set<string>}
 */
function epsilonClosure(stateSet) {
  const closure = new Set(stateSet);
  const stack = [...stateSet];

  while (stack.length > 0) {
    const state = stack.pop();
    const t = automaton.transitions[state];
    if (!t || !t[EPSILON]) continue;
    const targets = Array.isArray(t[EPSILON]) ? t[EPSILON] : [t[EPSILON]];
    for (const tgt of targets) {
      if (tgt && !closure.has(tgt)) {
        closure.add(tgt);
        stack.push(tgt);
      }
    }
  }

  return closure;
}

/**
 * Check whether the current automaton uses epsilon transitions.
 */
function hasEpsilonTransitions() {
  for (const state of automaton.states) {
    const t = automaton.transitions[state];
    if (!t) continue;
    if (t[EPSILON]) {
      const targets = Array.isArray(t[EPSILON]) ? t[EPSILON] : [t[EPSILON]];
      if (targets.some(tgt => tgt && tgt.length > 0)) return true;
    }
  }
  return false;
}

/**
 * Load a preset by name into the automaton object.
 * @param {string} name
 */
function applyPreset(name) {
  const p = PRESETS[name];
  if (!p) return;
  automaton.states = [...p.states];
  automaton.alpha  = [...p.alpha];
  automaton.start  = p.start;
  automaton.finals = [...p.finals];
  automaton.isNFA  = p.isNFA;

  // Deep copy transitions
  automaton.transitions = {};
  for (const [state, trans] of Object.entries(p.trans)) {
    automaton.transitions[state] = {};
    for (const [sym, val] of Object.entries(trans)) {
      automaton.transitions[state][sym] = Array.isArray(val) ? [...val] : val;
    }
  }
}

/**
 * Export automaton as a JSON string.
 */
function exportAutomatonJSON() {
  return JSON.stringify({
    states: automaton.states,
    alphabet: automaton.alpha,
    startState: automaton.start,
    finalStates: automaton.finals,
    transitions: automaton.transitions,
    isNFA: automaton.isNFA
  }, null, 2);
}

/**
 * Import automaton from a JSON string.
 * @param {string} jsonStr
 * @returns {boolean} success
 */
function importAutomatonJSON(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);
    automaton.states      = data.states || [];
    automaton.alpha       = data.alphabet || [];
    automaton.start       = data.startState || '';
    automaton.finals      = data.finalStates || [];
    automaton.transitions = data.transitions || {};
    automaton.isNFA       = data.isNFA || false;
    return true;
  } catch (e) {
    console.error('Import failed:', e);
    return false;
  }
}

/**
 * Read form data and populate automaton.
 */
function readFormIntoAutomaton() {
  automaton.states = parseList(document.getElementById('inp-states').value);
  automaton.alpha  = parseList(document.getElementById('inp-alpha').value);
  automaton.start  = document.getElementById('inp-start').value.trim();
  automaton.finals = parseList(document.getElementById('inp-final').value);
}

/**
 * Utility: parse a comma-separated string into a trimmed array.
 */
function parseList(str) {
  return str.split(',').map(s => s.trim()).filter(Boolean);
}

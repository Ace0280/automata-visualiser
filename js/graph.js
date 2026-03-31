/* ═══════════════════════════════════════════════════
   graph.js — D3.js Graph Rendering
   ═══════════════════════════════════════════════════ */

let svgData = { nodes: [], links: [] };

/**
 * Render the automaton as an SVG graph using D3.
 */
function drawAutomaton() {
  readTransitionsFromTable();

  const svg  = d3.select('#main-svg');
  const area = document.getElementById('canvas-area');
  const W    = area.clientWidth  || 700;
  const H    = area.clientHeight || 500;
  svg.attr('width', W).attr('height', H);
  svg.selectAll('*').remove();

  // Arrow markers
  const defs = svg.append('defs');

  defs.append('marker')
    .attr('id','arrowhead').attr('viewBox','0 -5 10 10')
    .attr('refX',28).attr('refY',0)
    .attr('markerWidth',6).attr('markerHeight',6)
    .attr('orient','auto')
    .append('path').attr('d','M0,-5L10,0L0,5').attr('fill','#64748b');

  defs.append('marker')
    .attr('id','arrowhead-active').attr('viewBox','0 -5 10 10')
    .attr('refX',28).attr('refY',0)
    .attr('markerWidth',6).attr('markerHeight',6)
    .attr('orient','auto')
    .append('path').attr('d','M0,-5L10,0L0,5').attr('fill','#7b61ff');

  // Build node positions (circular layout)
  const n = automaton.states.length;
  svgData.nodes = automaton.states.map((s, i) => {
    const angle = (2 * Math.PI * i / n) - Math.PI / 2;
    const r = Math.min(W, H) * 0.32;
    return { id: s, x: W/2 + r * Math.cos(angle), y: H/2 + r * Math.sin(angle) };
  });

  // Build edges — group multi-symbol transitions
  const edgeMap = {};
  const allSymbols = nfaMode ? getAlphabetWithEpsilon() : automaton.alpha;

  automaton.states.forEach(from => {
    allSymbols.forEach(sym => {
      const targets = automaton.transitions[from]
        ? (Array.isArray(automaton.transitions[from][sym])
            ? automaton.transitions[from][sym]
            : (automaton.transitions[from][sym] ? [automaton.transitions[from][sym]] : []))
        : [];
      targets.forEach(to => {
        if (!to) return;
        const key = `${from}__${to}`;
        if (!edgeMap[key]) edgeMap[key] = { source: from, target: to, labels: [] };
        edgeMap[key].labels.push(sym);
      });
    });
  });
  svgData.links = Object.values(edgeMap);

  const g = svg.append('g').attr('class','graph');

  // Draw edges
  svgData.links.forEach(link => {
    const src = svgData.nodes.find(n => n.id === link.source);
    const tgt = svgData.nodes.find(n => n.id === link.target);
    if (!src || !tgt) return;

    const edgeG = g.append('g')
      .attr('class','edge')
      .attr('id', `edge-${link.source}-${link.target}`);

    if (link.source === link.target) {
      // Self-loop
      const lx = src.x, ly = src.y - 28;
      const d = `M${lx-14},${ly+5} C${lx-30},${ly-40} ${lx+30},${ly-40} ${lx+14},${ly+5}`;
      edgeG.append('path').attr('d', d)
        .attr('marker-end','url(#arrowhead)')
        .attr('fill','none').attr('stroke','#64748b').attr('stroke-width',1.5);
      edgeG.append('text').attr('x', lx).attr('y', ly - 34)
        .attr('text-anchor','middle').attr('font-size',11).attr('fill','#64748b')
        .attr('font-family','Space Mono, monospace').text(link.labels.join(','));
    } else {
      // Straight or curved
      const hasReverse = svgData.links.some(l => l.source === link.target && l.target === link.source);
      const dx = tgt.x - src.x, dy = tgt.y - src.y;
      const len = Math.sqrt(dx*dx + dy*dy);
      const mx = (src.x + tgt.x)/2, my = (src.y + tgt.y)/2;
      const offset = hasReverse ? 30 : 0;
      const nx = -dy/len * offset, ny = dx/len * offset;
      const cx = mx + nx, cy = my + ny;

      const d = offset
        ? `M${src.x},${src.y} Q${cx},${cy} ${tgt.x},${tgt.y}`
        : `M${src.x},${src.y} L${tgt.x},${tgt.y}`;

      edgeG.append('path').attr('d', d)
        .attr('marker-end','url(#arrowhead)')
        .attr('fill','none').attr('stroke','#64748b').attr('stroke-width',1.5);

      const lx = cx || mx, ly = (cy || my) - 10;
      edgeG.append('text').attr('x', lx).attr('y', ly - 6)
        .attr('text-anchor','middle').attr('font-size',11).attr('fill','#64748b')
        .attr('font-family','Space Mono, monospace').text(link.labels.join(','));
    }
  });

  // Start arrow
  const startNode = svgData.nodes.find(n => n.id === automaton.start);
  if (startNode) {
    g.append('line')
      .attr('x1', startNode.x - 55).attr('y1', startNode.y)
      .attr('x2', startNode.x - 30).attr('y2', startNode.y)
      .attr('stroke','#00e5c0').attr('stroke-width',2)
      .attr('marker-end','url(#arrowhead)');
  }

  // Draw nodes
  svgData.nodes.forEach(nd => {
    const isFinal = automaton.finals.includes(nd.id);
    const isStart = nd.id === automaton.start;
    const nodeG = g.append('g')
      .attr('class', `state-node${isFinal ? ' final' : ''}${isStart ? ' start-state' : ''}`)
      .attr('id', `node-${nd.id}`)
      .attr('transform', `translate(${nd.x},${nd.y})`);

    nodeG.append('circle').attr('r', 26).attr('class','outer')
      .attr('fill', 'var(--inactive)')
      .attr('stroke', isStart ? '#00e5c0' : '#475569')
      .attr('stroke-width', 2);

    if (isFinal) {
      nodeG.append('circle').attr('r', 20)
        .attr('fill','none').attr('stroke','#00e5c0').attr('stroke-width',1.5);
    }

    nodeG.append('text')
      .attr('text-anchor','middle').attr('dominant-baseline','central')
      .attr('fill','#e2e8f0').attr('font-size',13)
      .attr('font-family','Space Mono, monospace').attr('font-weight',700)
      .text(nd.id);
  });

  resetSim();
}

/* ── Highlight Helpers ──────────────────────────── */

function highlightNode(id, active) {
  const el = document.getElementById(`node-${id}`);
  if (!el) return;
  const circle = el.querySelector('circle');
  if (active) {
    circle.setAttribute('fill','rgba(123,97,255,0.3)');
    circle.setAttribute('stroke','#7b61ff');
    circle.setAttribute('stroke-width','3');
    circle.style.filter = 'drop-shadow(0 0 8px rgba(123,97,255,0.6))';
  } else {
    const isStart = el.classList.contains('start-state');
    circle.setAttribute('fill','var(--inactive)');
    circle.setAttribute('stroke', isStart ? '#00e5c0' : '#475569');
    circle.setAttribute('stroke-width','2');
    circle.style.filter = '';
  }
}

function resetAllHighlights() {
  svgData.nodes.forEach(n => highlightNode(n.id, false));
  document.querySelectorAll('.edge path').forEach(p => {
    p.setAttribute('stroke','#64748b');
    p.setAttribute('stroke-width','1.5');
  });
  document.querySelectorAll('.edge text').forEach(t => {
    t.setAttribute('fill','#64748b');
  });
}

function highlightEdge(from, to, active) {
  const edgeEl = document.querySelector(`#edge-${from}-${to}`);
  if (!edgeEl) return;
  const path = edgeEl.querySelector('path');
  const text = edgeEl.querySelector('text');
  if (active) {
    if (path) { path.setAttribute('stroke','#7b61ff'); path.setAttribute('stroke-width','2.5'); }
    if (text) text.setAttribute('fill','#7b61ff');
  } else {
    if (path) { path.setAttribute('stroke','#64748b'); path.setAttribute('stroke-width','1.5'); }
    if (text) text.setAttribute('fill','#64748b');
  }
}

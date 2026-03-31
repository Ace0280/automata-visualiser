/* ═══════════════════════════════════════════════════
   graph.js — D3.js Graph Rendering
   ═══════════════════════════════════════════════════ */

let primarySvgData = { nodes: [], links: [] };

function drawAutomaton() {
  readTransitionsFromTable();
  const svgDataOut = { nodes: [], links: [] };
  drawAutomatonToTarget(automaton, '#main-svg', svgDataOut);
  primarySvgData = svgDataOut; // Save for active highlights
  resetSim();
}

/**
 * Core renderer that works on any automaton object and targets any SVG.
 */
function drawAutomatonToTarget(automatonObj, svgSelector, outDataObj = null) {
  const svg = d3.select(svgSelector);
  const container = svg.node().parentElement;
  
  const W = container.clientWidth || 700;
  const H = container.clientHeight || 500;
  svg.attr('width', W).attr('height', H);
  svg.selectAll('*').remove();

  const defs = svg.append('defs');
  const arrowheadId = 'arrowhead-' + svgSelector.replace('#','');
  const arrowheadSelfId = 'arrowhead-self-' + svgSelector.replace('#','');

  // Center-target marker (refX = 36 to shift tip perfectly to radius 26 boundary)
  defs.append('marker')
    .attr('id', arrowheadId).attr('viewBox','0 -5 10 10')
    .attr('refX', 36).attr('refY', 0)
    .attr('markerWidth', 6).attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path').attr('d','M0,-5L10,0L0,5').attr('fill','var(--primary)');

  // Boundary-target marker for self-loops (refX = 10 so tip is exactly at the end point)
  defs.append('marker')
    .attr('id', arrowheadSelfId).attr('viewBox','0 -5 10 10')
    .attr('refX', 10).attr('refY', 0)
    .attr('markerWidth', 6).attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path').attr('d','M0,-5L10,0L0,5').attr('fill','var(--primary)');

  const n = automatonObj.states.length;
  const nodes = automatonObj.states.map((s, i) => {
    const angle = (2 * Math.PI * i / n) - Math.PI / 2;
    const r = Math.min(W, H) * 0.32;
    return { id: s, x: W/2 + r * Math.cos(angle), y: H/2 + r * Math.sin(angle) };
  });

  const edgeMap = {};
  const allSymbols = automatonObj.isNFA ? (automatonObj.alpha.includes(EPSILON) ? automatonObj.alpha : [...automatonObj.alpha, EPSILON]) : automatonObj.alpha;

  automatonObj.states.forEach(from => {
    allSymbols.forEach(sym => {
      let targets = automatonObj.transitions[from] ? automatonObj.transitions[from][sym] : null;
      if (!targets) return;
      if (!Array.isArray(targets)) targets = [targets];
      targets.forEach(to => {
        if (!to) return;
        const key = `${from}__${to}`;
        if (!edgeMap[key]) edgeMap[key] = { source: from, target: to, labels: [] };
        edgeMap[key].labels.push(sym);
      });
    });
  });
  const links = Object.values(edgeMap);

  if (outDataObj) {
    outDataObj.nodes = nodes;
    outDataObj.links = links;
  }

  const g = svg.append('g').attr('class','graph');

  // Draw edges FIRST so they stay strictly behind solid nodes
  links.forEach(link => {
    const src = nodes.find(n => n.id === link.source);
    const tgt = nodes.find(n => n.id === link.target);
    if (!src || !tgt) return;

    const edgeG = g.append('g').attr('class','edge').attr('id', `edge-${link.source}-${link.target}`);

    if (link.source === link.target) {
      // Self loop ends on the boundary
      const lx = src.x, ly = src.y - 28;
      const d = `M${lx-14},${ly+5} C${lx-30},${ly-40} ${lx+30},${ly-40} ${lx+14},${ly+5}`;
      edgeG.append('path').attr('d', d).attr('marker-end',`url(#${arrowheadSelfId})`);
      edgeG.append('text').attr('x', lx).attr('y', ly - 34).text(link.labels.join(','));
    } else {
      // Cross-edge ending at center
      const hasReverse = links.some(l => l.source === link.target && l.target === link.source);
      const dx = tgt.x - src.x, dy = tgt.y - src.y;
      const len = Math.sqrt(dx*dx + dy*dy);
      const mx = (src.x + tgt.x)/2, my = (src.y + tgt.y)/2;
      const offset = hasReverse ? 30 : 0;
      const nx = -dy/len * offset, ny = dx/len * offset;
      const cx = mx + nx, cy = my + ny;

      const d = offset ? `M${src.x},${src.y} Q${cx},${cy} ${tgt.x},${tgt.y}` : `M${src.x},${src.y} L${tgt.x},${tgt.y}`;

      edgeG.append('path').attr('d', d).attr('marker-end',`url(#${arrowheadId})`);

      const lx = cx || mx, ly = (cy || my) - 10;
      edgeG.append('text').attr('x', lx).attr('y', ly - 6).text(link.labels.join(','));
    }
  });

  // Start arrow ending exactly in center
  const startNode = nodes.find(n => n.id === automatonObj.start);
  if (startNode) {
    g.append('line')
      .attr('x1', startNode.x - 70).attr('y1', startNode.y)
      .attr('x2', startNode.x).attr('y2', startNode.y) // Go all the way to center
      .attr('class', 'start-edge')
      .attr('stroke','var(--primary-dark)').attr('stroke-width',2)
      .attr('marker-end',`url(#${arrowheadId})`);
  }

  // Draw nodes LAST so they occlude underlying center lines via explicit D3 solid paints
  nodes.forEach(nd => {
    const isFinal = automatonObj.finals.includes(nd.id);
    const isStart = nd.id === automatonObj.start;
    const nodeG = g.append('g')
      .attr('class', `state-node${isFinal ? ' final' : ''}${isStart ? ' start-state' : ''}`)
      .attr('id', `node-${nd.id}`)
      .attr('transform', `translate(${nd.x},${nd.y})`);

    // Force strict caching override with hard DOM background paint
    nodeG.append('circle').attr('r', 26).attr('class','outer')
      .attr('fill', '#DCE6E1'); 

    if (isFinal) {
      nodeG.append('circle').attr('r', 20).attr('class','inner-final')
        .attr('stroke', 'var(--primary)').attr('stroke-width', 1.5).attr('fill', 'none');
    }

    nodeG.append('text').text(nd.id);
  });
}

// Logic relies heavily on CSS classes matching the updated styling
function highlightNode(id, active) {
  const el = document.getElementById(`node-${id}`);
  if (!el) return;
  if (active) el.classList.add('active');
  else el.classList.remove('active');
}

function resetAllHighlights() {
  primarySvgData.nodes.forEach(n => highlightNode(n.id, false));
  document.querySelectorAll('#main-svg .edge').forEach(e => e.classList.remove('active'));
}

function highlightEdge(from, to, active) {
  const edgeEl = document.querySelector(`#main-svg #edge-${from}-${to}`);
  if (!edgeEl) return;
  if (active) edgeEl.classList.add('active');
  else edgeEl.classList.remove('active');
}

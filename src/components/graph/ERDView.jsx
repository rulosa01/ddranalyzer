import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { GitBranch, X } from 'lucide-react';
import Badge from '../ui/Badge';
import NavLink from '../ui/NavLink';

const ERDView = ({ data, onNav }) => {
  const [selectedDb, setSelectedDb] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [focusedTO, setFocusedTO] = useState(null);
  const [hoveredTO, setHoveredTO] = useState(null);
  const [baseTableFilter, setBaseTableFilter] = useState('');
  const [viewMode, setViewMode] = useState('graph');
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  const db = data?.databases?.[selectedDb];
  const tos = db?.tableOccurrences || [];
  const rels = db?.relationships || [];

  const baseTables = useMemo(() => {
    return [...new Set(tos.map(to => to.baseTable).filter(Boolean))].sort();
  }, [tos]);

  // Build directed adjacency (left→right) and undirected adjacency
  const { adjacency, directed } = useMemo(() => {
    const adj = {};
    const dir = {};
    rels.forEach(rel => {
      if (!adj[rel.leftTable]) adj[rel.leftTable] = new Set();
      if (!adj[rel.rightTable]) adj[rel.rightTable] = new Set();
      adj[rel.leftTable].add(rel.rightTable);
      adj[rel.rightTable].add(rel.leftTable);
      if (!dir[rel.leftTable]) dir[rel.leftTable] = new Set();
      dir[rel.leftTable].add(rel.rightTable);
    });
    return { adjacency: adj, directed: dir };
  }, [rels]);


  const filteredTOs = useMemo(() => {
    let filtered = tos;
    if (baseTableFilter) {
      filtered = filtered.filter(to => to.baseTable === baseTableFilter);
    }
    if (focusedTO && !baseTableFilter) {
      const connected = adjacency[focusedTO] || new Set();
      filtered = filtered.filter(to => to.name === focusedTO || connected.has(to.name));
    }
    return filtered;
  }, [tos, baseTableFilter, focusedTO, adjacency]);

  const filteredRels = useMemo(() => {
    const visibleTONames = new Set(filteredTOs.map(to => to.name));
    return rels.filter(rel => visibleTONames.has(rel.leftTable) && visibleTONames.has(rel.rightTable));
  }, [rels, filteredTOs]);

  // Hierarchical layout algorithm
  const layout = useMemo(() => {
    if (filteredTOs.length === 0) return { nodes: [], edges: [], width: 400, height: 400, baseTableColors: {} };

    // Color assignment
    const baseTableColors = {};
    const colorPalette = [
      '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981',
      '#06b6d4', '#6366f1', '#f43f5e', '#84cc16', '#eab308'
    ];
    let colorIndex = 0;
    filteredTOs.forEach(to => {
      if (!baseTableColors[to.baseTable]) {
        baseTableColors[to.baseTable] = colorPalette[colorIndex % colorPalette.length];
        colorIndex++;
      }
    });

    const NODE_WIDTH = 180;
    const NODE_HEIGHT = 52;
    const H_GAP = 60;
    const V_GAP = 100;
    const PADDING = 80;

    // --- Hierarchical layer assignment via BFS ---
    const toNames = new Set(filteredTOs.map(to => to.name));
    const layers = {};
    const visited = new Set();

    // Find roots: TOs with no incoming edges from visible TOs, or most connections
    const visibleInDegree = {};
    filteredTOs.forEach(to => { visibleInDegree[to.name] = 0; });
    filteredRels.forEach(rel => {
      if (visibleInDegree[rel.rightTable] !== undefined) {
        visibleInDegree[rel.rightTable]++;
      }
    });

    let roots = filteredTOs.filter(to => visibleInDegree[to.name] === 0).map(to => to.name);
    // If no roots found (all have incoming), pick the ones with most connections
    if (roots.length === 0) {
      const sorted = [...filteredTOs].sort((a, b) => (adjacency[b.name]?.size || 0) - (adjacency[a.name]?.size || 0));
      roots = [sorted[0].name];
    }

    // BFS from roots
    const queue = roots.map(r => ({ name: r, layer: 0 }));
    roots.forEach(r => { visited.add(r); layers[r] = 0; });

    while (queue.length > 0) {
      const { name, layer } = queue.shift();
      const neighbors = adjacency[name] || new Set();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor) && toNames.has(neighbor)) {
          visited.add(neighbor);
          layers[neighbor] = layer + 1;
          queue.push({ name: neighbor, layer: layer + 1 });
        }
      }
    }

    // Orphans (disconnected TOs) go to last layer + 1
    const layerValues = Object.values(layers);
    const maxLayer = layerValues.length > 0 ? layerValues.reduce((a, b) => Math.max(a, b), 0) : 0;
    filteredTOs.forEach(to => {
      if (!visited.has(to.name)) {
        layers[to.name] = maxLayer + 1;
      }
    });

    // Group TOs by layer
    const layerGroups = {};
    filteredTOs.forEach(to => {
      const l = layers[to.name] ?? maxLayer + 1;
      if (!layerGroups[l]) layerGroups[l] = [];
      layerGroups[l].push(to);
    });

    // --- Median heuristic for reducing edge crossings ---
    const layerKeys = Object.keys(layerGroups).map(Number).sort((a, b) => a - b);
    // Build position index for ordering
    const positionInLayer = {};

    // Initial ordering: sort by base table within each layer for grouping
    layerKeys.forEach(l => {
      layerGroups[l].sort((a, b) => (a.baseTable || '').localeCompare(b.baseTable || '') || (a.name || '').localeCompare(b.name || ''));
      layerGroups[l].forEach((to, idx) => { positionInLayer[to.name] = idx; });
    });

    // Two passes of median ordering to reduce crossings
    for (let pass = 0; pass < 2; pass++) {
      for (let li = 1; li < layerKeys.length; li++) {
        const l = layerKeys[li];
        const prevLayer = layerKeys[li - 1];
        const prevPositions = {};
        layerGroups[prevLayer].forEach((to, idx) => { prevPositions[to.name] = idx; });

        // For each node in this layer, compute median position of its neighbors in the previous layer
        const medians = layerGroups[l].map(to => {
          const neighbors = [];
          const adj = adjacency[to.name] || new Set();
          for (const n of adj) {
            if (prevPositions[n] !== undefined) neighbors.push(prevPositions[n]);
          }
          neighbors.sort((a, b) => a - b);
          const median = neighbors.length > 0 ? neighbors[Math.floor(neighbors.length / 2)] : positionInLayer[to.name];
          return { to, median };
        });

        medians.sort((a, b) => a.median - b.median);
        layerGroups[l] = medians.map(m => m.to);
        layerGroups[l].forEach((to, idx) => { positionInLayer[to.name] = idx; });
      }
    }

    // --- Position nodes ---
    const nodes = [];
    const nodeMap = {};
    layerKeys.forEach(l => {
      const group = layerGroups[l];
      const layerWidth = group.length * (NODE_WIDTH + H_GAP) - H_GAP;
      group.forEach((to, idx) => {
        const x = PADDING + idx * (NODE_WIDTH + H_GAP);
        const y = PADDING + l * (NODE_HEIGHT + V_GAP);
        const node = {
          id: to.name,
          to,
          x,
          y,
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          color: baseTableColors[to.baseTable] || '#6b7280',
          baseTable: to.baseTable,
          external: to.externalFile,
          connectionCount: adjacency[to.name]?.size || 0,
          layer: l,
        };
        nodes.push(node);
        nodeMap[node.id] = node;
      });
    });

    // --- Calculate edges with bezier curves ---
    // Count edges between same pair to offset them
    const pairCount = {};
    const pairIndex = {};
    filteredRels.forEach(rel => {
      const key = [rel.leftTable, rel.rightTable].sort().join('|||');
      pairCount[key] = (pairCount[key] || 0) + 1;
    });

    const edges = filteredRels.map((rel, i) => {
      const source = nodeMap[rel.leftTable];
      const target = nodeMap[rel.rightTable];
      if (!source || !target) return null;

      // Self-referencing relationship
      if (rel.leftTable === rel.rightTable) {
        return {
          id: `${rel.leftTable}-${rel.rightTable}-${i}`,
          rel,
          source: rel.leftTable,
          target: rel.rightTable,
          selfRef: true,
          cx: source.x + source.width + 30,
          cy: source.y + source.height / 2,
          nodeX: source.x,
          nodeY: source.y,
          nodeW: source.width,
          nodeH: source.height,
          predicates: rel.predicates,
        };
      }

      const key = [rel.leftTable, rel.rightTable].sort().join('|||');
      if (!pairIndex[key]) pairIndex[key] = 0;
      const edgeIdx = pairIndex[key]++;
      const totalEdges = pairCount[key];
      const offset = (edgeIdx - (totalEdges - 1) / 2) * 20;

      // Connect from bottom of source to top of target (hierarchical top-to-bottom)
      const srcCx = source.x + source.width / 2;
      const srcCy = source.y + source.height / 2;
      const tgtCx = target.x + target.width / 2;
      const tgtCy = target.y + target.height / 2;

      let startX, startY, endX, endY;
      if (source.layer < target.layer) {
        // Source is above target
        startX = srcCx;
        startY = source.y + source.height;
        endX = tgtCx;
        endY = target.y;
      } else if (source.layer > target.layer) {
        // Source is below target (back edge)
        startX = srcCx;
        startY = source.y;
        endX = tgtCx;
        endY = target.y + target.height;
      } else {
        // Same layer — connect sides
        if (srcCx < tgtCx) {
          startX = source.x + source.width;
          startY = srcCy;
          endX = target.x;
          endY = tgtCy;
        } else {
          startX = source.x;
          startY = srcCy;
          endX = target.x + target.width;
          endY = tgtCy;
        }
      }

      // Control point for bezier curve
      const midX = (startX + endX) / 2 + offset;
      const midY = (startY + endY) / 2;

      return {
        id: `${rel.leftTable}-${rel.rightTable}-${i}`,
        rel,
        source: rel.leftTable,
        target: rel.rightTable,
        selfRef: false,
        startX,
        startY,
        endX,
        endY,
        midX,
        midY,
        offset,
        predicates: rel.predicates,
      };
    }).filter(Boolean);

    const maxX = nodes.length > 0 ? nodes.reduce((max, n) => Math.max(max, n.x + n.width), 0) + PADDING : 400;
    const maxY = nodes.length > 0 ? nodes.reduce((max, n) => Math.max(max, n.y + n.height), 0) + PADDING : 400;

    return { nodes, edges, width: maxX, height: maxY, baseTableColors };
  }, [filteredTOs, filteredRels, adjacency]);

  const handleMouseDown = (e) => {
    if (e.target === svgRef.current || e.target.tagName === 'svg' || (e.target.tagName === 'rect' && e.target.classList.contains('bg-rect'))) {
      setDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (dragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setDragging(false);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.max(0.1, Math.min(4, z * delta)));
  }, []);

  // Attach wheel listener as non-passive so preventDefault works
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const handleNodeClick = (node) => {
    if (focusedTO === node.id) {
      setFocusedTO(null);
    } else {
      setFocusedTO(node.id);
      setPan({ x: 0, y: 0 });
      setZoom(1);
    }
  };

  const handleNodeDoubleClick = (node) => {
    onNav('to', node.id, db.name);
  };

  const handleFitToScreen = useCallback(() => {
    const container = containerRef.current;
    if (!container || layout.nodes.length === 0) return;
    const rect = container.getBoundingClientRect();
    const scaleX = (rect.width - 40) / layout.width;
    const scaleY = (rect.height - 40) / layout.height;
    const newZoom = Math.min(scaleX, scaleY, 1.5);
    setZoom(newZoom);
    setPan({
      x: (rect.width - layout.width * newZoom) / 2,
      y: (rect.height - layout.height * newZoom) / 2,
    });
  }, [layout]);

  const clearFilters = () => {
    setFocusedTO(null);
    setBaseTableFilter('');
    setPan({ x: 0, y: 0 });
    setZoom(1);
  };

  if (!db || tos.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <GitBranch size={48} className="mx-auto mb-4 text-gray-300" />
        <p>No table occurrences found</p>
        <p className="text-sm text-gray-400 mt-2">Select a database with table occurrences to view the ERD</p>
      </div>
    );
  }

  const operatorSymbol = (type) => {
    const ops = { Equal: '=', NotEqual: '≠', GreaterThan: '>', GreaterThanOrEqual: '≥', GreaterThanOrEqualTo: '≥', LessThan: '<', LessThanOrEqual: '≤', LessThanOrEqualTo: '≤', CartesianJoin: '×', CartesianProduct: '×' };
    return ops[type] || type;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center gap-3 flex-wrap">
        <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
          <GitBranch size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">Entity Relationship Diagram</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filteredTOs.length}/{tos.length} TOs · {filteredRels.length}/{rels.length} relationships
            {focusedTO && <span className="text-violet-600 dark:text-violet-400"> · Focus: {focusedTO}</span>}
          </p>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setViewMode('graph')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'graph' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            Graph
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            List
          </button>
        </div>

        <select
          value={baseTableFilter}
          onChange={e => { setBaseTableFilter(e.target.value); setFocusedTO(null); }}
          className="text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <option value="">All Base Tables ({baseTables.length})</option>
          {baseTables.map(t => (
            <option key={t} value={t}>{t} ({tos.filter(to => to.baseTable === t).length})</option>
          ))}
        </select>

        {data.databases.length > 1 && (
          <select
            value={selectedDb}
            onChange={e => { setSelectedDb(Number(e.target.value)); clearFilters(); }}
            className="text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            {data.databases.map((d, i) => <option key={i} value={i}>{d.name}</option>)}
          </select>
        )}

        {(focusedTO || baseTableFilter) && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <X size={14} />
            Clear
          </button>
        )}
      </div>

      {/* Zoom controls */}
      {viewMode === 'graph' && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-2 flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="px-3 py-1 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 rounded-md">-</button>
            <span className="text-sm text-gray-600 dark:text-gray-300 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(4, z + 0.1))} className="px-3 py-1 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 rounded-md">+</button>
            <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="px-3 py-1 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 rounded-md text-xs">Reset</button>
            <button onClick={handleFitToScreen} className="px-3 py-1 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 rounded-md text-xs">Fit</button>
          </div>

          <span className="text-xs text-gray-500 dark:text-gray-400">Click to focus · Double-click to view details · Scroll to zoom</span>

          <div className="flex items-center gap-3 ml-auto flex-wrap">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Legend:</span>
            {Object.entries(layout.baseTableColors || {}).slice(0, 10).map(([table, color]) => (
              <button
                key={table}
                onClick={() => { setBaseTableFilter(table); setFocusedTO(null); }}
                className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
              >
                <div className="w-3 h-3 rounded" style={{ backgroundColor: color }}></div>
                <span className="text-xs text-gray-600 dark:text-gray-300">{table}</span>
              </button>
            ))}
            {Object.keys(layout.baseTableColors || {}).length > 10 && (
              <span className="text-xs text-gray-400 dark:text-gray-500">+{Object.keys(layout.baseTableColors).length - 10} more</span>
            )}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' ? (
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 p-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-200">Table Occurrence</th>
                  <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-200">Base Table</th>
                  <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-200">Connections</th>
                  <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-200">External</th>
                  <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTOs.map((to, i) => {
                  const connections = adjacency[to.name]?.size || 0;
                  const color = layout.baseTableColors[to.baseTable] || '#6b7280';
                  return (
                    <tr key={i} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: color }}></div>
                          <NavLink type="to" name={to.name} onClick={() => onNav('to', to.name, db.name)} />
                        </div>
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-300">{to.baseTable}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${connections > 0 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                          {connections}
                        </span>
                      </td>
                      <td className="p-3">
                        {to.externalFile ? (
                          <Badge color="ext" size="xs">{to.externalFile}</Badge>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => { setViewMode('graph'); setFocusedTO(to.name); setBaseTableFilter(''); }}
                          className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300"
                        >
                          Focus in graph
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredRels.length > 0 && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden mt-4">
              <div className="bg-pink-50 dark:bg-pink-900/20 px-4 py-2 border-b border-pink-100 dark:border-pink-900/40">
                <span className="font-medium text-pink-700 dark:text-pink-400 text-sm">Relationships ({filteredRels.length})</span>
              </div>
              <div className="max-h-96 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                    <tr>
                      <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-200">Left TO</th>
                      <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-200">Predicate</th>
                      <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-200">Right TO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRels.map((rel, i) => (
                      <tr key={i} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="p-3">
                          <NavLink type="to" name={rel.leftTable} small onClick={() => onNav('to', rel.leftTable, db.name)} />
                        </td>
                        <td className="p-3 text-center text-gray-500 dark:text-gray-400">
                          {rel.predicates?.map((p, j) => (
                            <span key={j} className="text-xs bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-2 py-0.5 rounded mx-0.5 inline-block mb-0.5">
                              {p.leftField} {operatorSymbol(p.type)} {p.rightField}
                            </span>
                          ))}
                        </td>
                        <td className="p-3">
                          <NavLink type="to" name={rel.rightTable} small onClick={() => onNav('to', rel.rightTable, db.name)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Graph View */
        <>
          <div
            ref={containerRef}
            className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900 cursor-grab relative"
            style={{ cursor: dragging ? 'grabbing' : 'grab' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              style={{ minWidth: layout.width * zoom, minHeight: layout.height * zoom }}
            >
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                <rect className="bg-rect" x="0" y="0" width={layout.width} height={layout.height} fill="#f9fafb" />

                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
                  </pattern>
                  <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#9ca3af" />
                  </marker>
                  <marker id="arrowhead-highlight" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#8b5cf6" />
                  </marker>
                </defs>
                <rect x="0" y="0" width={layout.width} height={layout.height} fill="url(#grid)" />

                {/* Edges */}
                {layout.edges.map(edge => {
                  const isHighlighted = focusedTO && (edge.source === focusedTO || edge.target === focusedTO);
                  const isHoverHighlighted = hoveredTO && (edge.source === hoveredTO || edge.target === hoveredTO);
                  const highlighted = isHighlighted || isHoverHighlighted;
                  const strokeColor = highlighted ? '#8b5cf6' : '#9ca3af';
                  const strokeW = highlighted ? 2.5 : 1.5;

                  if (edge.selfRef) {
                    // Self-referencing loop
                    const r = 25;
                    const x = edge.nodeX + edge.nodeW;
                    const y = edge.nodeY + edge.nodeH / 2;
                    return (
                      <g key={edge.id}>
                        <path
                          d={`M ${x} ${y - 8} C ${x + r * 2} ${y - r * 2}, ${x + r * 2} ${y + r * 2}, ${x} ${y + 8}`}
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth={strokeW}
                          markerEnd={highlighted ? 'url(#arrowhead-highlight)' : 'url(#arrowhead)'}
                        />
                      </g>
                    );
                  }

                  // Bezier curve path
                  const path = `M ${edge.startX} ${edge.startY} Q ${edge.midX} ${edge.midY} ${edge.endX} ${edge.endY}`;

                  // Label position (along the curve at t=0.5)
                  const labelX = 0.25 * edge.startX + 0.5 * edge.midX + 0.25 * edge.endX;
                  const labelY = 0.25 * edge.startY + 0.5 * edge.midY + 0.25 * edge.endY;

                  return (
                    <g key={edge.id}>
                      <path
                        d={path}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={strokeW}
                        markerEnd={highlighted ? 'url(#arrowhead-highlight)' : 'url(#arrowhead)'}
                      />
                      {/* Predicate labels */}
                      {edge.predicates?.length > 0 && (
                        <g transform={`translate(${labelX}, ${labelY})`}>
                          {edge.predicates.map((p, pi) => {
                            const label = `${p.leftField} ${operatorSymbol(p.type)} ${p.rightField}`;
                            const yOff = (pi - (edge.predicates.length - 1) / 2) * 14;
                            return (
                              <g key={pi}>
                                <rect
                                  x={-label.length * 3.2}
                                  y={yOff - 8}
                                  width={label.length * 6.4}
                                  height={14}
                                  rx="3"
                                  fill="white"
                                  fillOpacity="0.9"
                                  stroke={highlighted ? '#8b5cf6' : '#e5e7eb'}
                                  strokeWidth="0.5"
                                />
                                <text
                                  x={0}
                                  y={yOff + 2}
                                  fontSize="8"
                                  fill={highlighted ? '#7c3aed' : '#6b7280'}
                                  textAnchor="middle"
                                  fontFamily="monospace"
                                  className="pointer-events-none"
                                >
                                  {label}
                                </text>
                              </g>
                            );
                          })}
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* Nodes */}
                {layout.nodes.map(node => {
                  const isFocused = focusedTO === node.id;
                  const isConnected = focusedTO && adjacency[focusedTO]?.has(node.id);
                  const isHovered = hoveredTO === node.id;
                  const opacity = focusedTO ? (isFocused || isConnected ? 1 : 0.3) : 1;

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                      className="cursor-pointer"
                      onClick={() => handleNodeClick(node)}
                      onDoubleClick={() => handleNodeDoubleClick(node)}
                      onMouseEnter={() => setHoveredTO(node.id)}
                      onMouseLeave={() => setHoveredTO(null)}
                      style={{ opacity }}
                    >
                      {/* Node background */}
                      <rect
                        width={node.width}
                        height={node.height}
                        rx="8"
                        fill={isFocused ? '#1e1b4b' : 'white'}
                        stroke={isFocused ? '#8b5cf6' : isHovered ? '#6366f1' : '#e5e7eb'}
                        strokeWidth={isFocused ? 2.5 : isHovered ? 2 : 1}
                      />
                      {/* Color stripe on left */}
                      <rect
                        x="1"
                        y="1"
                        width="4"
                        height={node.height - 2}
                        fill={node.color}
                      />

                      {/* External indicator */}
                      {node.external && (
                        <g transform={`translate(${node.width - 20}, 4)`}>
                          <rect width="16" height="12" rx="3" fill="#ef4444" fillOpacity="0.9" />
                          <text x="8" y="9" textAnchor="middle" fontSize="7" fill="white" fontWeight="600">EXT</text>
                        </g>
                      )}

                      {/* TO name */}
                      <text
                        x={12}
                        y={20}
                        fontSize="11"
                        fontWeight="600"
                        fill={isFocused ? 'white' : '#1f2937'}
                        className="pointer-events-none"
                      >
                        {node.id.length > 22 ? node.id.slice(0, 20) + '…' : node.id}
                      </text>

                      {/* Base table name */}
                      <text
                        x={12}
                        y={36}
                        fontSize="9"
                        fill={isFocused ? '#a5b4fc' : '#9ca3af'}
                        className="pointer-events-none"
                      >
                        {(node.baseTable || '').length > 24 ? (node.baseTable || '').slice(0, 22) + '…' : (node.baseTable || '')}
                      </text>

                      {/* Connection count badge */}
                      {node.connectionCount > 0 && (
                        <g transform={`translate(-6, -6)`}>
                          <circle r="9" fill={node.color} />
                          <text x="0" y="3.5" textAnchor="middle" fontSize="8" fill="white" fontWeight="700">
                            {node.connectionCount}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* Hover tooltip */}
            {hoveredTO && !focusedTO && layout.nodes.find(n => n.id === hoveredTO) && (() => {
              const node = layout.nodes.find(n => n.id === hoveredTO);
              return (
                <div
                  className="absolute bg-gray-900 text-white text-xs rounded-lg px-3 py-2 pointer-events-none shadow-lg z-10"
                  style={{
                    left: node.x * zoom + pan.x + node.width * zoom / 2,
                    top: node.y * zoom + pan.y - 8,
                    transform: 'translate(-50%, -100%)',
                  }}
                >
                  <div className="font-medium">{hoveredTO}</div>
                  <div className="text-gray-300">Base: {node.baseTable}</div>
                  <div className="text-gray-300">{node.connectionCount} connection{node.connectionCount !== 1 ? 's' : ''}</div>
                  {node.external && <div className="text-red-300">External: {node.external}</div>}
                </div>
              );
            })()}
          </div>

          {/* Focused TO info panel */}
          {focusedTO && (
            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center gap-4">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: layout.baseTableColors[layout.nodes.find(n => n.id === focusedTO)?.baseTable] }}></div>
              <div className="flex-1">
                <span className="font-medium text-gray-800 dark:text-gray-100">{focusedTO}</span>
                <span className="text-gray-400 mx-2">→</span>
                <span className="text-gray-600 dark:text-gray-300">{layout.nodes.find(n => n.id === focusedTO)?.baseTable}</span>
                <span className="text-violet-500 dark:text-violet-400 ml-4 text-sm">{adjacency[focusedTO]?.size || 0} connections</span>
              </div>
              <button
                onClick={() => setFocusedTO(null)}
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Show All
              </button>
              <button
                onClick={() => onNav('to', focusedTO, db.name)}
                className="px-3 py-1.5 bg-violet-500 text-white text-sm rounded-lg hover:bg-violet-600 transition-colors"
              >
                View Details
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ERDView;

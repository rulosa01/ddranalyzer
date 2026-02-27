import React, { useState, useMemo, useRef } from 'react';
import { Code } from 'lucide-react';
import Badge from '../ui/Badge';
import NavLink from '../ui/NavLink';

const ScriptGraphView = ({ data, onNav }) => {
  const [selectedDb, setSelectedDb] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedScript, setSelectedScript] = useState(null);
  const [showOrphans, setShowOrphans] = useState(true); // Show all by default
  const [viewMode, setViewMode] = useState('list'); // 'graph' or 'list' - default to list
  const svgRef = useRef(null);

  const db = data?.databases?.[selectedDb];
  const scripts = db?.scripts || [];
  const reverseRefs = data?.reverseRefs || {};

  // Build script call graph
  const graph = useMemo(() => {
    if (scripts.length === 0) return { nodes: [], edges: [], width: 0, height: 0 };

    // Build adjacency list and find roots
    const calls = {};      // script -> scripts it calls
    const callers = {};    // script -> scripts that call it
    const allScripts = new Set(scripts.map(s => s.name));

    scripts.forEach(script => {
      calls[script.name] = [];
      callers[script.name] = callers[script.name] || [];

      (script.callsScripts || []).forEach(called => {
        if (!called.external && allScripts.has(called.name)) {
          calls[script.name].push(called.name);
          callers[called.name] = callers[called.name] || [];
          callers[called.name].push(script.name);
        }
      });
    });

    // Find root scripts (not called by anything, or on layouts)
    const roots = scripts.filter(s => {
      const scriptCallers = reverseRefs.scriptCallers?.[s.name] || [];
      const onLayouts = reverseRefs.scriptOnLayouts?.[s.name] || [];
      return scriptCallers.length === 0 || onLayouts.length > 0;
    });

    // Find orphan scripts (not called and not on layouts)
    const orphans = scripts.filter(s => {
      const scriptCallers = reverseRefs.scriptCallers?.[s.name] || [];
      const onLayouts = reverseRefs.scriptOnLayouts?.[s.name] || [];
      return scriptCallers.length === 0 && onLayouts.length === 0;
    });

    // Layout using levels
    const levels = {};
    const visited = new Set();

    const assignLevel = (name, level) => {
      if (visited.has(name)) return;
      visited.add(name);
      levels[name] = Math.max(levels[name] || 0, level);
      (calls[name] || []).forEach(called => assignLevel(called, level + 1));
    };

    roots.forEach(r => assignLevel(r.name, 0));

    // Handle any unvisited scripts
    scripts.forEach(s => {
      if (!visited.has(s.name)) {
        levels[s.name] = 0;
      }
    });

    // Group by level
    const byLevel = {};
    Object.entries(levels).forEach(([name, level]) => {
      if (!byLevel[level]) byLevel[level] = [];
      byLevel[level].push(name);
    });

    // Create nodes
    const NODE_WIDTH = 160;
    const NODE_HEIGHT = 36;
    const H_PADDING = 40;
    const V_PADDING = 60;

    const nodes = [];
    const nodeMap = {};

    Object.entries(byLevel).forEach(([level, names]) => {
      const levelNum = parseInt(level);
      const levelWidth = names.length * (NODE_WIDTH + H_PADDING);
      const startX = H_PADDING;

      names.forEach((name, i) => {
        const script = scripts.find(s => s.name === name);
        const isOrphan = orphans.some(o => o.name === name);
        const isRoot = roots.some(r => r.name === name);

        if (!showOrphans && isOrphan && !isRoot) return;

        const node = {
          id: name,
          script,
          x: startX + i * (NODE_WIDTH + H_PADDING),
          y: V_PADDING + levelNum * (NODE_HEIGHT + V_PADDING),
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          isOrphan,
          isRoot,
          callCount: (calls[name] || []).length,
          callerCount: (callers[name] || []).length,
        };
        nodes.push(node);
        nodeMap[name] = node;
      });
    });

    // Create edges
    const edges = [];
    scripts.forEach(script => {
      const source = nodeMap[script.name];
      if (!source) return;

      (script.callsScripts || []).forEach(called => {
        if (called.external) return;
        const target = nodeMap[called.name];
        if (!target) return;

        const startX = source.x + source.width / 2;
        const startY = source.y + source.height;
        const endX = target.x + target.width / 2;
        const endY = target.y;

        edges.push({
          id: `${source.id}-${target.id}`,
          source: source.id,
          target: target.id,
          startX,
          startY,
          endX,
          endY,
        });
      });
    });

    const maxX = Math.max(...nodes.map(n => n.x + n.width), 100) + H_PADDING * 2;
    const maxY = Math.max(...nodes.map(n => n.y + n.height), 100) + V_PADDING * 2;

    return { nodes, edges, width: maxX, height: maxY, orphanCount: orphans.length };
  }, [scripts, reverseRefs, showOrphans]);

  const handleMouseDown = (e) => {
    if (e.target === svgRef.current || e.target.tagName === 'svg' || e.target.tagName === 'rect') {
      setDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (dragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.max(0.2, Math.min(3, z * delta)));
  };

  if (!db || scripts.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <Code size={48} className="mx-auto mb-4 text-gray-300" />
        <p>No scripts found</p>
      </div>
    );
  }

  // Cross-file callers for current database scripts
  const crossFileCallers = useMemo(() => {
    const callers = {};
    for (const ref of data?.crossFileRefs || []) {
      if (ref.targetDb === db?.name) {
        if (!callers[ref.targetScript]) callers[ref.targetScript] = [];
        callers[ref.targetScript].push(ref);
      }
    }
    return callers;
  }, [data?.crossFileRefs, db?.name]);

  // Enhanced script list with cross-file info
  const scriptList = useMemo(() => {
    return scripts.map(script => {
      const callers = reverseRefs.scriptCallers?.[script.name] || [];
      const onLayouts = reverseRefs.scriptOnLayouts?.[script.name] || [];
      const crossFile = crossFileCallers[script.name] || [];
      const calls = script.callsScripts?.filter(c => !c.external).length || 0;
      const externalCalls = script.callsScripts?.filter(c => c.external).length || 0;

      // A script is reachable if it's called by other scripts, on layouts, or called from other files
      const isReachable = callers.length > 0 || onLayouts.length > 0 || crossFile.length > 0;

      return {
        ...script,
        callerCount: callers.length,
        layoutCount: onLayouts.length,
        crossFileCount: crossFile.length,
        callCount: calls,
        externalCallCount: externalCalls,
        isOrphan: !isReachable,
        isRoot: onLayouts.length > 0,
      };
    }).sort((a, b) => {
      // Sort: entry points first, then by caller count, then alphabetically
      if (a.isRoot !== b.isRoot) return a.isRoot ? -1 : 1;
      if (a.isOrphan !== b.isOrphan) return a.isOrphan ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
  }, [scripts, reverseRefs, crossFileCallers]);

  const orphanCount = scriptList.filter(s => s.isOrphan).length;
  const entryPointCount = scriptList.filter(s => s.isRoot).length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center gap-3 flex-wrap">
        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
          <Code size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">Script Dependencies</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {scripts.length} scripts · {entryPointCount} entry points · {orphanCount} potentially unused
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode('graph')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'graph' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            Graph
          </button>
        </div>

        {data.databases.length > 1 && (
          <select
            value={selectedDb}
            onChange={e => setSelectedDb(Number(e.target.value))}
            className="text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            {data.databases.map((d, i) => <option key={i} value={i}>{d.name}</option>)}
          </select>
        )}

        {viewMode === 'graph' && (
          <>
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                checked={showOrphans}
                onChange={e => setShowOrphans(e.target.checked)}
                className="rounded border-gray-300"
              />
              Show Unused ({orphanCount})
            </label>

            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="px-3 py-1 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 rounded-md">-</button>
              <span className="text-sm text-gray-600 dark:text-gray-300 w-12 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="px-3 py-1 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 rounded-md">+</button>
              <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="px-3 py-1 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 rounded-md text-xs">Reset</button>
            </div>
          </>
        )}
      </div>

      {/* List View */}
      {viewMode === 'list' ? (
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 p-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-4 text-sm text-amber-800 dark:text-amber-400">
            <strong>Note:</strong> "Potentially unused" scripts have no detected callers within this file and are not on any layout triggers.
            They may still be called from other files, startup scripts, or custom menus not captured in the DDR.
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-200">Script</th>
                  <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-200">Folder</th>
                  <th className="text-center p-3 font-medium text-gray-700 dark:text-gray-200">On Layouts</th>
                  <th className="text-center p-3 font-medium text-gray-700 dark:text-gray-200">Called By</th>
                  <th className="text-center p-3 font-medium text-gray-700 dark:text-gray-200">X-File</th>
                  <th className="text-center p-3 font-medium text-gray-700 dark:text-gray-200">Calls</th>
                  <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-200">Status</th>
                </tr>
              </thead>
              <tbody>
                {scriptList.map((script, i) => (
                  <tr key={i} className={`border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${script.isOrphan ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}>
                    <td className="p-3">
                      <NavLink type="script" name={script.name} onClick={() => onNav('script', script.name, db.name)} />
                    </td>
                    <td className="p-3 text-gray-500 dark:text-gray-400 text-xs">{script.folder || '-'}</td>
                    <td className="p-3 text-center">
                      {script.layoutCount > 0 ? (
                        <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full text-xs">{script.layoutCount}</span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {script.callerCount > 0 ? (
                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full text-xs">{script.callerCount}</span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {script.crossFileCount > 0 ? (
                        <span className="bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 px-2 py-0.5 rounded-full text-xs">{script.crossFileCount}</span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {script.callCount > 0 || script.externalCallCount > 0 ? (
                        <span className="text-gray-600 dark:text-gray-300 text-xs">
                          {script.callCount}{script.externalCallCount > 0 && <span className="text-red-500">+{script.externalCallCount}</span>}
                        </span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      {script.isRoot ? (
                        <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full text-xs font-medium">Entry Point</span>
                      ) : script.isOrphan ? (
                        <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full text-xs">Unused?</span>
                      ) : (
                        <span className="text-green-600 dark:text-green-400 text-xs">Referenced</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Graph View */
        <>
          {/* Legend */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-2 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-r from-amber-500 to-orange-500"></div>
              <span className="text-xs text-gray-600 dark:text-gray-300">Entry Point (on layout/trigger)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-white dark:bg-gray-700 border-2 border-amber-500"></div>
              <span className="text-xs text-gray-600 dark:text-gray-300">Regular Script</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-100 border-2 border-red-400"></div>
              <span className="text-xs text-gray-600 dark:text-gray-300">Potentially Unused</span>
            </div>
          </div>

          {/* SVG Canvas */}
          <div
            className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900 cursor-grab"
            style={{ cursor: dragging ? 'grabbing' : 'grab' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              style={{ minWidth: graph.width * zoom, minHeight: graph.height * zoom }}
            >
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                <rect x="0" y="0" width={graph.width} height={graph.height} fill="#f9fafb" />
                <defs>
                  <pattern id="script-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1" />
                  </pattern>
                  <marker id="script-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#9ca3af" />
                  </marker>
                  <linearGradient id="rootGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#ea580c" />
                  </linearGradient>
                </defs>
                <rect x="0" y="0" width={graph.width} height={graph.height} fill="url(#script-grid)" />

                {/* Edges */}
                {graph.edges.map(edge => {
                  const midY = (edge.startY + edge.endY) / 2;
                  const path = `M ${edge.startX} ${edge.startY} C ${edge.startX} ${midY}, ${edge.endX} ${midY}, ${edge.endX} ${edge.endY}`;
                  return (
                    <path key={edge.id} d={path} fill="none" stroke="#9ca3af" strokeWidth={1.5} markerEnd="url(#script-arrow)" />
                  );
                })}

                {/* Nodes */}
                {graph.nodes.map(node => (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    className="cursor-pointer"
                    onClick={() => { setSelectedScript(node); onNav('script', node.id, db.name); }}
                  >
                    <rect
                      width={node.width}
                      height={node.height}
                      rx="6"
                      fill={node.isOrphan ? '#fee2e2' : node.isRoot ? 'url(#rootGradient)' : 'white'}
                      stroke={selectedScript?.id === node.id ? '#1f2937' : node.isOrphan ? '#f87171' : '#f59e0b'}
                      strokeWidth={selectedScript?.id === node.id ? 3 : 2}
                    />
                    <text
                      x={node.width / 2}
                      y={node.height / 2 + 4}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="500"
                      fill={node.isRoot ? 'white' : '#374151'}
                      className="pointer-events-none"
                    >
                      {node.id.length > 20 ? node.id.slice(0, 18) + '...' : node.id}
                    </text>
                  </g>
                ))}
              </g>
            </svg>
          </div>

          {/* Selected Script Info */}
          {selectedScript && (
            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center gap-4">
              <Code size={16} className="text-amber-500" />
              <div className="flex-1">
                <span className="font-medium text-gray-800 dark:text-white">{selectedScript.id}</span>
                {selectedScript.isOrphan && <Badge color="ext" size="xs" className="ml-2">Unused?</Badge>}
                {selectedScript.isRoot && <Badge color="script" size="xs" className="ml-2">Entry Point</Badge>}
                <span className="text-gray-400 dark:text-gray-500 mx-2">·</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Calls {selectedScript.callCount} · Called by {selectedScript.callerCount}</span>
              </div>
              <button
                onClick={() => onNav('script', selectedScript.id, db.name)}
                className="px-3 py-1.5 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 transition-colors"
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

export default ScriptGraphView;

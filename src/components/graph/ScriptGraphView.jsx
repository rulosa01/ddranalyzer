import React, { useState, useMemo } from 'react';
import { Code, ArrowRight } from 'lucide-react';
import NavLink from '../ui/NavLink';

const ScriptGraphView = ({ data, onNav, activeDb = 0 }) => {
  const [showOrphans, setShowOrphans] = useState(true);
  const [viewMode, setViewMode] = useState('list');

  const db = data?.databases?.[activeDb];
  const scripts = db?.scripts || [];
  const reverseRefs = data?.reverseRefs || {};

  // Build per-root call trees for flow view
  const graphData = useMemo(() => {
    if (scripts.length === 0) return { entryTrees: [], orphanTrees: [], standaloneOrphans: [], calls: {} };

    // Cross-file callers
    const xFileCallers = {};
    for (const ref of data?.crossFileRefs || []) {
      if (ref.targetDb === db?.name) {
        if (!xFileCallers[ref.targetScript]) xFileCallers[ref.targetScript] = [];
        xFileCallers[ref.targetScript].push(ref);
      }
    }

    // Build adjacency
    const calls = {};
    const calledBy = {};
    const allScripts = new Set(scripts.map(s => s.name));

    scripts.forEach(script => {
      calls[script.name] = [];
      calledBy[script.name] = calledBy[script.name] || [];
      (script.callsScripts || []).forEach(called => {
        if (!called.external && allScripts.has(called.name)) {
          if (!calls[script.name].includes(called.name)) calls[script.name].push(called.name);
          calledBy[called.name] = calledBy[called.name] || [];
          if (!calledBy[called.name].includes(script.name)) calledBy[called.name].push(script.name);
        }
      });
    });

    // Find roots (no local callers)
    const roots = scripts.filter(s => (calledBy[s.name] || []).length === 0).map(s => s.name);

    // Classify roots
    const entryTrees = [];
    const orphanTrees = [];
    const standaloneOrphans = [];

    for (const root of roots) {
      const onLayouts = (reverseRefs.scriptOnLayouts?.[root] || []).length > 0;
      const hasXFile = (xFileCallers[root] || []).length > 0;
      const hasCallees = (calls[root] || []).length > 0;

      if (onLayouts || hasXFile) {
        entryTrees.push(root);
      } else if (hasCallees) {
        orphanTrees.push(root);
      } else {
        standaloneOrphans.push(root);
      }
    }

    // Handle cycles (scripts where everyone has a caller — no natural root)
    const allReachable = new Set();
    const markReachable = (name) => {
      if (allReachable.has(name)) return;
      allReachable.add(name);
      (calls[name] || []).forEach(c => markReachable(c));
    };
    roots.forEach(r => markReachable(r));

    const cycleRoots = [];
    for (const script of scripts) {
      if (!allReachable.has(script.name)) {
        cycleRoots.push(script.name);
        markReachable(script.name);
      }
    }

    entryTrees.sort((a, b) => a.localeCompare(b));
    orphanTrees.sort((a, b) => a.localeCompare(b));
    standaloneOrphans.sort((a, b) => a.localeCompare(b));

    return { entryTrees, orphanTrees, standaloneOrphans, cycleRoots, calls };
  }, [scripts, reverseRefs, data?.crossFileRefs, db?.name]);

  // Cross-file callers for list view
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

  // Enhanced script list for list view
  const scriptList = useMemo(() => {
    return scripts.map(script => {
      const callers = reverseRefs.scriptCallers?.[script.name] || [];
      const onLayouts = reverseRefs.scriptOnLayouts?.[script.name] || [];
      const crossFile = crossFileCallers[script.name] || [];
      const calls = script.callsScripts?.filter(c => !c.external).length || 0;
      const externalCalls = script.callsScripts?.filter(c => c.external).length || 0;
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
      if (a.isRoot !== b.isRoot) return a.isRoot ? -1 : 1;
      if (a.isOrphan !== b.isOrphan) return a.isOrphan ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
  }, [scripts, reverseRefs, crossFileCallers]);

  const orphanCount = scriptList.filter(s => s.isOrphan).length;
  const entryPointCount = scriptList.filter(s => s.isRoot).length;

  if (!db || scripts.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <Code size={48} className="mx-auto mb-4 text-gray-300" />
        <p>No scripts found</p>
      </div>
    );
  }

  const ScriptPill = ({ name, isOrphan }) => {
    const onLayouts = reverseRefs.scriptOnLayouts?.[name] || [];
    const isEntryPoint = onLayouts.length > 0;

    return (
      <button
        onClick={() => onNav('script', name, db.name)}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all hover:shadow-md text-left max-w-52 truncate shrink-0 ${
          isOrphan
            ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700 hover:border-red-400'
            : isEntryPoint
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-600 shadow-sm hover:shadow-lg'
              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-amber-300 dark:border-amber-600 hover:border-amber-500 dark:hover:border-amber-400'
        }`}
        title={name}
      >
        {name}
      </button>
    );
  };

  // Render a script's call tree as horizontal left-to-right flow
  const renderCallTree = (name, visited, isOrphanTree) => {
    const alreadySeen = visited.has(name);
    visited.add(name);
    const children = alreadySeen ? [] : (graphData.calls[name] || []);

    return (
      <div className="flex items-start" key={name}>
        <ScriptPill name={name} isOrphan={isOrphanTree} />
        {alreadySeen && <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-1 self-center" title="Recursive call">↩</span>}
        {children.length > 0 && (
          <>
            <ArrowRight size={14} className="text-gray-300 dark:text-gray-600 shrink-0 mx-1 mt-1.5" />
            <div className="flex flex-col gap-1">
              {children.map(child => renderCallTree(child, visited, isOrphanTree))}
            </div>
          </>
        )}
      </div>
    );
  };

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

        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode('flow')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'flow' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            Flow
          </button>
        </div>

        {viewMode === 'flow' && (
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={showOrphans}
              onChange={e => setShowOrphans(e.target.checked)}
              className="rounded border-gray-300"
            />
            Show Unused ({graphData.orphanTrees.length + graphData.standaloneOrphans.length})
          </label>
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
        /* Flow View */
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 p-4 space-y-2">
          {/* Legend */}
          <div className="flex items-center gap-5 mb-2 px-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-gradient-to-r from-amber-500 to-orange-500"></div>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">Entry Point</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-white dark:bg-gray-700 border-2 border-amber-400"></div>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">Sub-script</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-50 border-2 border-red-300"></div>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">Potentially Unused</span>
            </div>
          </div>

          {/* Entry point trees */}
          {graphData.entryTrees.map(root => (
            <div key={root} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 overflow-x-auto">
              {renderCallTree(root, new Set(), false)}
            </div>
          ))}

          {/* Cycle roots (rare — scripts in mutual recursion with no entry point) */}
          {graphData.cycleRoots.length > 0 && (
            <>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-4 px-1">
                Cyclic References ({graphData.cycleRoots.length})
              </div>
              {graphData.cycleRoots.map(root => (
                <div key={root} className="bg-purple-50/50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-xl px-4 py-3 overflow-x-auto">
                  {renderCallTree(root, new Set(), false)}
                </div>
              ))}
            </>
          )}

          {graphData.entryTrees.length === 0 && graphData.cycleRoots.length === 0 && !showOrphans && (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              <p>No active script chains found. Enable "Show Unused" to see orphan scripts.</p>
            </div>
          )}

          {/* Orphan scripts */}
          {showOrphans && (graphData.orphanTrees.length > 0 || graphData.standaloneOrphans.length > 0) && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                Potentially Unused ({graphData.orphanTrees.length + graphData.standaloneOrphans.length} scripts)
              </div>

              {/* Orphan chains (have callees but no entry point) */}
              {graphData.orphanTrees.map(root => (
                <div key={root} className="bg-red-50/50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 mb-2 overflow-x-auto">
                  {renderCallTree(root, new Set(), true)}
                </div>
              ))}

              {/* Standalone orphan scripts */}
              {graphData.standaloneOrphans.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {graphData.standaloneOrphans.map(name => (
                    <ScriptPill key={name} name={name} isOrphan />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScriptGraphView;

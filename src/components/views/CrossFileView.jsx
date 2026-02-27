import React, { useState, useMemo } from 'react';
import { ExternalLink, Layers, Table, Code, ArrowRight } from 'lucide-react';
import Badge from '../ui/Badge';
import NavLink from '../ui/NavLink';

const CrossFileView = ({ data, onNav }) => {
  const [tab, setTab] = useState('tos');
  const scriptRefs = data.crossFileRefs || [];
  const toRefs = data.crossFileTableRefs || [];

  const groupedScripts = useMemo(() => {
    const g = {};
    for (const r of scriptRefs) {
      const key = `${r.sourceDb} → ${r.targetDb}`;
      if (!g[key]) g[key] = [];
      g[key].push(r);
    }
    return g;
  }, [scriptRefs]);

  // Group TOs by external file they point to
  const groupedTOs = useMemo(() => {
    const g = {};
    for (const r of toRefs) {
      const key = `${r.toDb} → ${r.externalFile}`;
      if (!g[key]) g[key] = [];
      g[key].push(r);
    }
    return g;
  }, [toRefs]);

  // Group TOs by base table for a "which tables are referenced externally" view
  const tableGroups = useMemo(() => {
    const g = {};
    for (const r of toRefs) {
      const key = `${r.externalFile}::${r.baseTable}`;
      if (!g[key]) g[key] = { externalFile: r.externalFile, baseTable: r.baseTable, tos: [] };
      g[key].tos.push(r);
    }
    return Object.values(g).sort((a, b) => b.tos.length - a.tos.length);
  }, [toRefs]);

  const totalRefs = scriptRefs.length + toRefs.length;

  if (totalRefs === 0) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        <ExternalLink size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
        <p>No cross-file references found</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Shadow TOs and external script calls will appear here</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
          <ExternalLink size={24} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Cross-File References</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{toRefs.length} shadow TOs · {scriptRefs.length} external script calls</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {[
          { id: 'tos', label: 'Shadow TOs', icon: Layers, count: toRefs.length },
          { id: 'tables', label: 'By Base Table', icon: Table, count: tableGroups.length },
          { id: 'scripts', label: 'Script Calls', icon: Code, count: scriptRefs.length },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-red-500 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <t.icon size={14} />
            {t.label}
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${tab === t.id ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {tab === 'tos' && (
        <div className="space-y-4">
          {Object.entries(groupedTOs).map(([key, items]) => (
            <div key={key} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-violet-50 dark:bg-violet-900/20 px-4 py-3 border-b border-violet-100 dark:border-violet-900 flex items-center gap-3">
                <Layers size={16} className="text-violet-500" />
                <span className="font-medium text-violet-700 dark:text-violet-400">{key}</span>
                <Badge color="to" size="xs">{items.length} TOs</Badge>
              </div>
              <div className="p-4">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="text-left p-2 font-medium text-gray-700 dark:text-gray-200">TO Name</th>
                      <th className="text-left p-2 font-medium text-gray-700 dark:text-gray-200">Base Table</th>
                      <th className="text-left p-2 font-medium text-gray-700 dark:text-gray-200">External File</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((r, i) => (
                      <tr key={i} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="p-2">
                          <NavLink type="to" name={r.toName} small onClick={() => onNav('to', r.toName, r.toDb)} />
                        </td>
                        <td className="p-2 text-gray-600 dark:text-gray-300">{r.baseTable}</td>
                        <td className="p-2">
                          <Badge color="ext" size="xs">{r.externalFile}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          {toRefs.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Layers size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p>No shadow table occurrences found</p>
            </div>
          )}
        </div>
      )}

      {tab === 'tables' && (
        <div className="space-y-4">
          {tableGroups.map((group, gi) => (
            <div key={gi} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-3 border-b border-blue-100 dark:border-blue-900 flex items-center gap-3">
                <Table size={16} className="text-blue-500" />
                <span className="font-medium text-blue-700 dark:text-blue-400">{group.externalFile}::{group.baseTable}</span>
                <Badge color="to" size="xs">{group.tos.length} TOs</Badge>
              </div>
              <div className="p-4 flex flex-wrap gap-2">
                {group.tos.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-600">
                    <NavLink type="to" name={r.toName} small onClick={() => onNav('to', r.toName, r.toDb)} />
                    <span className="text-gray-400 dark:text-gray-500 text-xs">in {r.toDb}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {tableGroups.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Table size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p>No cross-file table references found</p>
            </div>
          )}
        </div>
      )}

      {tab === 'scripts' && (
        <div className="space-y-4">
          {Object.entries(groupedScripts).map(([key, items]) => (
            <div key={key} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-red-50 dark:bg-red-900/20 px-4 py-3 border-b border-red-100 dark:border-red-900 flex items-center gap-3">
                <Code size={16} className="text-red-500" />
                <span className="font-medium text-red-600 dark:text-red-400">{key}</span>
                <Badge color="ext" size="xs">{items.length}</Badge>
              </div>
              <div className="p-4 space-y-2">
                {items.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <NavLink type="script" name={r.sourceScript} onClick={() => onNav('script', r.sourceScript, r.sourceDb)} />
                    <ArrowRight size={14} className="text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-500 dark:text-gray-400">{r.targetScript}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {scriptRefs.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Code size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p>No cross-file script calls found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CrossFileView;

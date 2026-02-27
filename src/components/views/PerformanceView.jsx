import React, { useState, useMemo } from 'react';
import { Activity, Clock, Table, Code, Box, Zap, Eye } from 'lucide-react';
import NavLink from '../ui/NavLink';

const PerformanceView = ({ analysis, data, onNav }) => {
  const [tab, setTab] = useState('overview');
  const { performance } = analysis || {};

  const dbNames = data?.databases?.map(d => d.name) || [];
  const [filterDb, setFilterDb] = useState('');

  const filterItem = (items) => filterDb ? items?.filter(i => i.db === filterDb) : items;

  if (!performance) {
    return (
      <div className="p-6 text-center text-gray-500">
        <Activity size={48} className="mx-auto mb-4 text-gray-300" />
        <p>No performance data available</p>
      </div>
    );
  }

  const filteredCalcs = filterItem(performance.unstoredCalcs) || [];
  const filteredWide = filterItem(performance.wideTables) || [];
  const filteredLarge = filterItem(performance.largeScripts) || [];
  const filteredContainers = filterItem(performance.containerFields) || [];
  const filteredGlobals = filterItem(performance.globalFields) || [];

  const totalIssues = filteredCalcs.length + filteredWide.length + filteredLarge.length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
          <Activity size={24} className="text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Performance Hints</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {totalIssues} potential performance concerns identified
          </p>
        </div>
        {dbNames.length > 1 && (
          <select
            value={filterDb}
            onChange={e => setFilterDb(e.target.value)}
            className="text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="">All Databases</option>
            {dbNames.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-orange-500" />
            <span className="text-xs font-medium text-orange-700 dark:text-orange-400">Unstored Calcs</span>
          </div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{filteredCalcs.length}</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Table size={16} className="text-purple-500" />
            <span className="text-xs font-medium text-purple-700 dark:text-purple-400">Wide Tables</span>
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{filteredWide.length}</div>
        </div>
        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Code size={16} className="text-rose-500" />
            <span className="text-xs font-medium text-rose-700 dark:text-rose-400">Large Scripts</span>
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{filteredLarge.length}</div>
        </div>
        <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Box size={16} className="text-pink-500" />
            <span className="text-xs font-medium text-pink-700 dark:text-pink-400">Containers</span>
          </div>
          <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">{filteredContainers.length}</div>
        </div>
        <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-cyan-500" />
            <span className="text-xs font-medium text-cyan-700 dark:text-cyan-400">Global Fields</span>
          </div>
          <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{filteredGlobals.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'overview', label: 'Overview', icon: Eye },
          { id: 'calcs', label: 'Unstored Calcs', icon: Clock, count: filteredCalcs.length },
          { id: 'tables', label: 'Wide Tables', icon: Table, count: filteredWide.length },
          { id: 'scripts', label: 'Large Scripts', icon: Code, count: filteredLarge.length },
          { id: 'containers', label: 'Containers', icon: Box, count: filteredContainers.length },
          { id: 'globals', label: 'Globals', icon: Zap, count: filteredGlobals.length },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-orange-500 text-white shadow-lg'
                : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            <t.icon size={14} />
            {t.label}
            {t.count !== undefined && (
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${tab === t.id ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-600'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Performance Overview</h3>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <p>This analysis identifies potential performance bottlenecks in your FileMaker solution:</p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <Clock size={14} className="text-orange-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Unstored Calculations:</strong> Calcs using ExecuteSQL, Evaluate, or aggregate functions that must recalculate on every access</span>
                </li>
                <li className="flex items-start gap-2">
                  <Table size={14} className="text-purple-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Wide Tables:</strong> Tables with 50+ fields may impact record loading performance</span>
                </li>
                <li className="flex items-start gap-2">
                  <Code size={14} className="text-rose-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Large Scripts:</strong> Scripts with 100+ steps may be difficult to maintain and debug</span>
                </li>
                <li className="flex items-start gap-2">
                  <Box size={14} className="text-pink-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Container Fields:</strong> Consider external storage for large containers to optimize file size</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap size={14} className="text-cyan-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Global Fields:</strong> Globals consume memory per session - review if all are needed</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {tab === 'calcs' && (
        <PerformanceList
          items={filteredCalcs}
          columns={['table', 'field', 'reason', 'db']}
          emptyMessage="No unstored calculation concerns found"
          onNav={onNav}
        />
      )}

      {tab === 'tables' && (
        <PerformanceList
          items={filteredWide}
          columns={['name', 'fieldCount', 'db']}
          emptyMessage="No wide tables found"
          onNav={onNav}
          customRender={(item, col) => {
            if (col === 'fieldCount') return `${item.fieldCount} fields`;
            return item[col];
          }}
        />
      )}

      {tab === 'scripts' && (
        <PerformanceList
          items={filteredLarge}
          columns={['name', 'stepCount', 'folder', 'db']}
          emptyMessage="No large scripts found"
          onNav={onNav}
          type="script"
          customRender={(item, col) => {
            if (col === 'stepCount') return `${item.stepCount} steps`;
            return item[col];
          }}
        />
      )}

      {tab === 'containers' && (
        <PerformanceList
          items={filteredContainers}
          columns={['table', 'field', 'isGlobal', 'db']}
          emptyMessage="No container fields found"
          onNav={onNav}
          customRender={(item, col) => {
            if (col === 'isGlobal') return item.isGlobal ? 'Global' : 'Regular';
            return item[col];
          }}
        />
      )}

      {tab === 'globals' && (
        <PerformanceList
          items={filteredGlobals}
          columns={['table', 'field', 'dataType', 'db']}
          emptyMessage="No global fields found"
          onNav={onNav}
        />
      )}
    </div>
  );
};

const PerformanceList = ({ items, columns, emptyMessage, onNav, type, customRender }) => {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <Activity size={48} className="mx-auto mb-4 text-green-300 dark:text-green-700" />
        <p className="text-green-600 dark:text-green-400 font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
      <div className="max-h-96 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
            <tr>
              {columns.map(c => (
                <th key={c} className="text-left p-3 font-medium text-gray-700 dark:text-gray-200 capitalize">{c === 'db' ? 'Database' : c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className={`border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${item.severity === 'high' ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                {columns.map(c => (
                  <td key={c} className="p-3">
                    {c === 'name' && type === 'script' ? (
                      <NavLink type="script" name={item.name} onClick={() => onNav('script', item.name, item.db)} />
                    ) : customRender ? (
                      <span className="text-gray-600 dark:text-gray-300">{customRender(item, c) || '-'}</span>
                    ) : (
                      <span className="text-gray-600 dark:text-gray-300">{item[c] || '-'}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PerformanceView;

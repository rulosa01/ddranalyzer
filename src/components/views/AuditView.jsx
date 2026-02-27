import React, { useState, useMemo } from 'react';
import { Shield, Lock, Code, Grid3X3, Layout, Layers, TrendingUp, Activity, FileSearch, AlertTriangle, Trash2, Table, Zap, Heart, Box, Sparkles, Database, Clock } from 'lucide-react';
import Badge from '../ui/Badge';
import NavLink from '../ui/NavLink';

const AuditView = ({ data, analysis, onNav }) => {
  const [tab, setTab] = useState('security');
  const [filterDb, setFilterDb] = useState('');
  const { security, orphans, fieldUsage, performance, indirection } = analysis || {};

  const dbNames = data?.databases?.map(d => d.name) || [];
  const filterItem = (items) => filterDb ? items?.filter(i => i.db === filterDb) : items;

  const filteredSecurity = {
    fullAccessScripts: filterItem(security?.fullAccessScripts) || [],
    unrestrictedScripts: filterItem(security?.unrestrictedScripts) || [],
    totalFullAccess: filterItem(security?.fullAccessScripts)?.length || 0,
  };
  const filteredOrphans = {
    scripts: filterItem(orphans?.scripts) || [],
    fields: filterItem(orphans?.fields) || [],
    layouts: filterItem(orphans?.layouts) || [],
    tableOccurrences: filterItem(orphans?.tableOccurrences) || [],
  };

  // Field usage counts
  const unusedCount = filterItem(fieldUsage?.unused)?.length || 0;
  const rarelyUsedCount = filterItem(fieldUsage?.rarelyUsed)?.length || 0;

  // Performance counts
  const perfCalcs = filterItem(performance?.unstoredCalcs)?.length || 0;
  const perfWide = filterItem(performance?.wideTables)?.length || 0;
  const perfLarge = filterItem(performance?.largeScripts)?.length || 0;
  const perfIssues = perfCalcs + perfWide + perfLarge;

  // Indirection counts
  const indirSQL = filterItem(indirection?.executeSQL)?.length || 0;
  const indirEval = filterItem(indirection?.evaluate)?.length || 0;
  const indirDynamic = filterItem(indirection?.dynamicRefs)?.length || 0;
  const indirCount = indirSQL + indirEval + indirDynamic;

  const tabGroups = [
    {
      label: 'Security',
      color: 'red',
      tabs: [
        { id: 'security', label: 'Full Access', icon: Lock, count: filteredSecurity.totalFullAccess },
      ]
    },
    {
      label: 'Orphans',
      color: 'amber',
      tabs: [
        { id: 'orphan-scripts', label: 'Scripts', icon: Code, count: filteredOrphans.scripts.length },
        { id: 'orphan-fields', label: 'Fields', icon: Grid3X3, count: filteredOrphans.fields.length },
        { id: 'orphan-layouts', label: 'Layouts', icon: Layout, count: filteredOrphans.layouts.length },
        { id: 'orphan-tos', label: 'TOs', icon: Layers, count: filteredOrphans.tableOccurrences.length },
      ]
    },
    {
      label: 'Analysis',
      color: 'blue',
      tabs: [
        { id: 'field-usage', label: 'Field Usage', icon: TrendingUp, count: unusedCount + rarelyUsedCount },
        { id: 'performance', label: 'Performance', icon: Activity, count: perfIssues },
        { id: 'indirection', label: 'Indirection', icon: FileSearch, count: indirCount },
      ]
    }
  ];

  const getActiveColor = () => {
    for (const group of tabGroups) {
      if (group.tabs.some(t => t.id === tab)) return group.color;
    }
    return 'red';
  };
  const activeColor = getActiveColor();

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
          <Shield size={24} className="text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Audit & Analysis</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Security, cleanup, and performance analysis</p>
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

      {/* Organized tab groups */}
      <div className="space-y-3 mb-6">
        {tabGroups.map(group => (
          <div key={group.label} className="flex items-center gap-2">
            <span className={`text-xs font-medium text-${group.color}-600 dark:text-${group.color}-400 w-16`}>{group.label}</span>
            <div className="flex gap-1.5 flex-wrap">
              {group.tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    tab === t.id
                      ? `bg-${group.color}-500 text-white shadow-md`
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <t.icon size={12} />
                  {t.label}
                  {t.count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${tab === t.id ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'}`}>
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Security tab */}
      {tab === 'security' && (
        <div className="space-y-4">
          {filteredSecurity.fullAccessScripts.length > 0 ? (
            <>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle size={20} className="text-red-500" />
                  <span className="font-medium text-red-700 dark:text-red-400">Scripts Running with Full Access Privileges</span>
                </div>
                <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                  These scripts run with elevated privileges regardless of the user's privilege set.
                  {filteredSecurity.unrestrictedScripts.length > 0 && (
                    <span className="font-medium"> {filteredSecurity.unrestrictedScripts.length} are also included in menus (higher risk).</span>
                  )}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-200">Script</th>
                      <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-200">Database</th>
                      <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-200">Folder</th>
                      <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-200">In Menu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSecurity.fullAccessScripts.map((s, i) => (
                      <tr key={i} className={`border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${s.inMenu ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                        <td className="p-3">
                          <NavLink type="script" name={s.name} onClick={() => onNav('script', s.name, s.db)} />
                        </td>
                        <td className="p-3 text-gray-600 dark:text-gray-300">{s.db}</td>
                        <td className="p-3 text-gray-500 dark:text-gray-400 text-xs">{s.folder || '-'}</td>
                        <td className="p-3">
                          {s.inMenu ? (
                            <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded-full text-xs font-medium">Yes</span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 text-xs">No</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Shield size={48} className="mx-auto mb-4 text-green-300 dark:text-green-700" />
              <p className="text-green-600 dark:text-green-400 font-medium">No scripts with full access privileges found</p>
            </div>
          )}
        </div>
      )}

      {/* Orphan tabs */}
      {tab === 'orphan-scripts' && (
        <OrphanList
          items={filteredOrphans.scripts}
          type="script"
          columns={['name', 'db', 'folder']}
          onNav={onNav}
          emptyMessage="All scripts are referenced"
        />
      )}

      {tab === 'orphan-fields' && (
        <OrphanList
          items={filteredOrphans.fields}
          type="field"
          columns={['table', 'name', 'dataType', 'db']}
          onNav={onNav}
          emptyMessage="All fields are referenced"
        />
      )}

      {tab === 'orphan-layouts' && (
        <OrphanList
          items={filteredOrphans.layouts}
          type="layout"
          columns={['name', 'baseTable', 'db']}
          onNav={onNav}
          emptyMessage="All layouts are navigated to by scripts"
        />
      )}

      {tab === 'orphan-tos' && (
        <OrphanList
          items={filteredOrphans.tableOccurrences}
          type="to"
          columns={['name', 'baseTable', 'db']}
          onNav={onNav}
          emptyMessage="All table occurrences are in use"
        />
      )}

      {/* Field Usage tab */}
      {tab === 'field-usage' && (
        <FieldUsageContent analysis={analysis} data={data} onNav={onNav} filterDb={filterDb} />
      )}

      {/* Performance tab */}
      {tab === 'performance' && (
        <PerformanceContent analysis={analysis} data={data} onNav={onNav} filterDb={filterDb} />
      )}

      {/* Indirection tab */}
      {tab === 'indirection' && (
        <IndirectionContent analysis={analysis} data={data} onNav={onNav} filterDb={filterDb} />
      )}
    </div>
  );
};

const OrphanList = ({ items, type, columns, onNav, emptyMessage }) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <Trash2 size={48} className="mx-auto mb-4 text-green-300 dark:text-green-700" />
        <p className="text-green-600 dark:text-green-400 font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <div className="bg-amber-50 dark:bg-amber-900/20 px-4 py-3 border-b border-amber-100 dark:border-amber-900">
        <span className="text-amber-700 dark:text-amber-400 font-medium">{items.length} potentially unused {type}s found</span>
      </div>
      <div className="max-h-96 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
            <tr>
              {columns.map(c => (
                <th key={c} className="text-left p-3 font-medium text-gray-700 dark:text-gray-200 capitalize">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                {columns.map(c => (
                  <td key={c} className="p-3">
                    {c === 'name' ? (
                      <NavLink type={type} name={item.name} onClick={() => onNav(type, item.name, item.db)} />
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

// Content components for Audit sub-tabs
const FieldUsageContent = ({ analysis, data, onNav, filterDb }) => {
  const [usageTab, setUsageTab] = useState('unused');
  const [filterTable, setFilterTable] = useState('');
  const { fieldUsage } = analysis || {};

  const tables = useMemo(() => {
    if (!data?.databases) return [];
    if (filterDb) {
      const db = data.databases.find(d => d.name === filterDb);
      return db?.tables?.map(t => t.name) || [];
    }
    return data.databases.flatMap(db => db.tables?.map(t => `${db.name}::${t.name}`) || []);
  }, [data, filterDb]);

  const filterItem = (items) => {
    if (!items) return [];
    return items.filter(i => {
      if (filterDb && i.db !== filterDb) return false;
      if (filterTable && i.table !== filterTable) return false;
      return true;
    });
  };

  const filteredUnused = filterItem(fieldUsage?.unused);
  const filteredRarelyUsed = filterItem(fieldUsage?.rarelyUsed);
  const filteredModerate = filterItem(fieldUsage?.moderatelyUsed);
  const filteredHeavy = filterItem(fieldUsage?.heavilyUsed);

  if (!fieldUsage) {
    return (
      <div className="text-center py-12 text-gray-500">
        <TrendingUp size={48} className="mx-auto mb-4 text-gray-300" />
        <p>No field usage data available</p>
      </div>
    );
  }

  const usageTabs = [
    { id: 'unused', label: 'Unused', count: filteredUnused.length, color: 'red' },
    { id: 'rarely', label: 'Rarely Used', count: filteredRarelyUsed.length, color: 'amber' },
    { id: 'moderate', label: 'Moderate', count: filteredModerate.length, color: 'blue' },
    { id: 'heavy', label: 'Heavy', count: filteredHeavy.length, color: 'green' },
  ];

  const currentItems = usageTab === 'unused' ? filteredUnused :
    usageTab === 'rarely' ? filteredRarelyUsed :
    usageTab === 'moderate' ? filteredModerate : filteredHeavy;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex gap-1.5">
          {usageTabs.map(t => (
            <button
              key={t.id}
              onClick={() => setUsageTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                usageTab === t.id
                  ? `bg-${t.color}-500 text-white shadow-md`
                  : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              {t.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${usageTab === t.id ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-600'}`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
        {tables.length > 0 && (
          <select
            value={filterTable}
            onChange={e => setFilterTable(e.target.value)}
            className="text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 text-gray-700 dark:text-gray-200 focus:outline-none"
          >
            <option value="">All Tables</option>
            {tables.map(t => <option key={t} value={t.includes('::') ? t.split('::')[1] : t}>{t}</option>)}
          </select>
        )}
      </div>

      {currentItems.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Heart size={32} className="mx-auto mb-2 text-green-300 dark:text-green-700" />
          <p className="text-sm">No fields in this category</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="max-h-80 overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-200">Table</th>
                  <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-200">Field</th>
                  <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-200">Type</th>
                  <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-200">Refs</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.slice(0, 100).map((f, i) => (
                  <tr key={i} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="p-3 text-gray-600 dark:text-gray-300 text-xs">{f.table}</td>
                    <td className="p-3 font-mono text-cyan-600 dark:text-cyan-400">{f.name}</td>
                    <td className="p-3 text-gray-500 dark:text-gray-400 text-xs">{f.dataType}</td>
                    <td className="p-3 text-gray-400 text-xs">{f.refCount || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {currentItems.length > 100 && (
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400 border-t dark:border-gray-600">
              Showing first 100 of {currentItems.length} fields
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const PerformanceContent = ({ analysis, data, onNav, filterDb }) => {
  const [perfTab, setPerfTab] = useState('calcs');
  const { performance } = analysis || {};

  const filterItem = (items) => filterDb ? items?.filter(i => i.db === filterDb) : items;

  if (!performance) {
    return (
      <div className="text-center py-12 text-gray-500">
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

  const perfTabs = [
    { id: 'calcs', label: 'Unstored Calcs', count: filteredCalcs.length, color: 'orange' },
    { id: 'wide', label: 'Wide Tables', count: filteredWide.length, color: 'red' },
    { id: 'large', label: 'Large Scripts', count: filteredLarge.length, color: 'amber' },
    { id: 'containers', label: 'Containers', count: filteredContainers.length, color: 'purple' },
    { id: 'globals', label: 'Globals', count: filteredGlobals.length, color: 'blue' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 flex-wrap">
        {perfTabs.map(t => (
          <button
            key={t.id}
            onClick={() => setPerfTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              perfTab === t.id
                ? `bg-${t.color}-500 text-white shadow-md`
                : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            {t.label}
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${perfTab === t.id ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-600'}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {perfTab === 'calcs' && (
        filteredCalcs.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Zap size={32} className="mx-auto mb-2 text-green-300 dark:text-green-700" />
            <p className="text-sm">No unstored calculations found</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="bg-orange-50 dark:bg-orange-900/20 px-4 py-2 border-b border-orange-100 dark:border-orange-900/40 text-xs text-orange-700 dark:text-orange-400">
              Unstored calculations are re-evaluated each time they're accessed
            </div>
            <div className="max-h-80 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-200">Table</th>
                    <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-200">Field</th>
                    <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-200">DB</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCalcs.slice(0, 100).map((c, i) => (
                    <tr key={i} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="p-3 text-gray-600 dark:text-gray-300 text-xs">{c.table}</td>
                      <td className="p-3 font-mono text-orange-600 dark:text-orange-400">{c.name}</td>
                      <td className="p-3 text-gray-400 text-xs">{c.db}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {perfTab === 'wide' && (
        filteredWide.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Table size={32} className="mx-auto mb-2 text-green-300 dark:text-green-700" />
            <p className="text-sm">No tables with excessive fields found</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="bg-red-50 dark:bg-red-900/20 px-4 py-2 border-b border-red-100 dark:border-red-900/40 text-xs text-red-700 dark:text-red-400">
              Tables with many fields can impact performance and maintainability
            </div>
            <div className="max-h-80 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-200">Table</th>
                    <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-200">Fields</th>
                    <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-200">DB</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWide.map((t, i) => (
                    <tr key={i} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="p-3">
                        <NavLink type="table" name={t.name} onClick={() => onNav('table', t.name, t.db)} />
                      </td>
                      <td className="p-3 font-medium text-red-600 dark:text-red-400">{t.fieldCount}</td>
                      <td className="p-3 text-gray-400 text-xs">{t.db}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {perfTab === 'large' && (
        filteredLarge.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Code size={32} className="mx-auto mb-2 text-green-300 dark:text-green-700" />
            <p className="text-sm">No excessively large scripts found</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="bg-amber-50 dark:bg-amber-900/20 px-4 py-2 border-b border-amber-100 dark:border-amber-900/40 text-xs text-amber-700 dark:text-amber-400">
              Large scripts may benefit from being broken into smaller, reusable sub-scripts
            </div>
            <div className="max-h-80 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-200">Script</th>
                    <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-200">Steps</th>
                    <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-200">DB</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLarge.map((s, i) => (
                    <tr key={i} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="p-3">
                        <NavLink type="script" name={s.name} onClick={() => onNav('script', s.name, s.db)} />
                      </td>
                      <td className="p-3 font-medium text-amber-600 dark:text-amber-400">{s.stepCount}</td>
                      <td className="p-3 text-gray-400 text-xs">{s.db}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {perfTab === 'containers' && (
        filteredContainers.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Box size={32} className="mx-auto mb-2 text-green-300 dark:text-green-700" />
            <p className="text-sm">No container fields found</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="bg-purple-50 dark:bg-purple-900/20 px-4 py-2 border-b border-purple-100 dark:border-purple-900/40 text-xs text-purple-700 dark:text-purple-400">
              Container fields store binary data - consider external storage for large files
            </div>
            <div className="max-h-80 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-200">Table</th>
                    <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-200">Field</th>
                    <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-200">DB</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContainers.slice(0, 100).map((c, i) => (
                    <tr key={i} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="p-3 text-gray-600 dark:text-gray-300 text-xs">{c.table}</td>
                      <td className="p-3 font-mono text-purple-600 dark:text-purple-400">{c.name}</td>
                      <td className="p-3 text-gray-400 text-xs">{c.db}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {perfTab === 'globals' && (
        filteredGlobals.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Sparkles size={32} className="mx-auto mb-2 text-green-300 dark:text-green-700" />
            <p className="text-sm">No global fields found</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 border-b border-blue-100 dark:border-blue-900/40 text-xs text-blue-700 dark:text-blue-400">
              Global fields are session-specific and can use memory
            </div>
            <div className="max-h-80 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-200">Table</th>
                    <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-200">Field</th>
                    <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-200">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGlobals.slice(0, 100).map((g, i) => (
                    <tr key={i} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="p-3 text-gray-600 dark:text-gray-300 text-xs">{g.table}</td>
                      <td className="p-3 font-mono text-blue-600 dark:text-blue-400">{g.name}</td>
                      <td className="p-3 text-gray-500 dark:text-gray-400 text-xs">{g.dataType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
};

const IndirectionContent = ({ analysis, data, onNav, filterDb }) => {
  const { indirection } = analysis || {};

  const filterItem = (items) => filterDb ? items?.filter(i => i.db === filterDb) : items;
  const filteredSQL = filterItem(indirection?.executeSQL) || [];
  const filteredEval = filterItem(indirection?.evaluate) || [];
  const filteredDynamic = filterItem(indirection?.dynamicRefs) || [];
  const totalCount = filteredSQL.length + filteredEval.length + filteredDynamic.length;

  if (totalCount === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FileSearch size={48} className="mx-auto mb-4 text-gray-300" />
        <p>No indirection patterns detected</p>
        <p className="text-sm text-gray-400 mt-2">ExecuteSQL, Evaluate, and dynamic references will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredSQL.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-purple-50 dark:bg-purple-900/20 px-4 py-2 border-b border-purple-100 dark:border-purple-900/40 flex items-center gap-3">
            <Database size={14} className="text-purple-500" />
            <span className="font-medium text-purple-700 dark:text-purple-400 text-sm">ExecuteSQL ({filteredSQL.length})</span>
          </div>
          <div className="p-3 space-y-1.5 max-h-48 overflow-auto">
            {filteredSQL.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs p-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                {item.location === 'script' ? (
                  <>
                    <NavLink type="script" name={item.script} small onClick={() => onNav('script', item.script, item.db)} />
                    <span className="text-gray-400 dark:text-gray-500">step {item.step}</span>
                  </>
                ) : (
                  <>
                    <span className="text-gray-500 dark:text-gray-400">{item.table}::</span>
                    <span className="font-mono text-purple-600 dark:text-purple-400">{item.field}</span>
                    <Badge color="cf" size="xs">{item.location}</Badge>
                  </>
                )}
                <span className="text-gray-400 text-[10px] ml-auto">{item.db}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredEval.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-amber-50 dark:bg-amber-900/20 px-4 py-2 border-b border-amber-100 dark:border-amber-900/40 flex items-center gap-3">
            <Code size={14} className="text-amber-500" />
            <span className="font-medium text-amber-700 dark:text-amber-400 text-sm">Evaluate ({filteredEval.length})</span>
          </div>
          <div className="p-3 space-y-1.5 max-h-48 overflow-auto">
            {filteredEval.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs p-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                {item.location === 'script' ? (
                  <>
                    <NavLink type="script" name={item.script} small onClick={() => onNav('script', item.script, item.db)} />
                    <span className="text-gray-400 dark:text-gray-500">step {item.step}</span>
                  </>
                ) : (
                  <>
                    <span className="text-gray-500 dark:text-gray-400">{item.table}::</span>
                    <span className="font-mono text-amber-600 dark:text-amber-400">{item.field}</span>
                    <Badge color="cf" size="xs">{item.location}</Badge>
                  </>
                )}
                <span className="text-gray-400 text-[10px] ml-auto">{item.db}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredDynamic.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-rose-50 dark:bg-rose-900/20 px-4 py-2 border-b border-rose-100 dark:border-rose-900/40 flex items-center gap-3">
            <Zap size={14} className="text-rose-500" />
            <span className="font-medium text-rose-700 dark:text-rose-400 text-sm">Dynamic References ({filteredDynamic.length})</span>
          </div>
          <div className="p-3 space-y-1.5 max-h-48 overflow-auto">
            {filteredDynamic.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs p-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                <NavLink type="script" name={item.script} small onClick={() => onNav('script', item.script, item.db)} />
                <span className="text-gray-400 dark:text-gray-500">step {item.step}</span>
                <span className="text-gray-400 text-[10px] ml-auto">{item.db}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditView;

import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Activity, Trash2, Grid3X3, Table, ChevronRight } from 'lucide-react';
import Badge from '../ui/Badge';
import NavLink from '../ui/NavLink';
import { dtColors } from '../../constants/theme';

const FieldUsageView = ({ analysis, data, onNav }) => {
  const [tab, setTab] = useState('unused');
  const [filterDb, setFilterDb] = useState('');
  const [filterTable, setFilterTable] = useState('');
  const { fieldUsage } = analysis || {};

  const dbNames = data?.databases?.map(d => d.name) || [];

  // Get tables for current filter
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
      <div className="p-6 text-center text-gray-500">
        <TrendingUp size={48} className="mx-auto mb-4 text-gray-300" />
        <p>No field usage data available</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
          <TrendingUp size={24} className="text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Field Usage Analysis</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {fieldUsage.summary.total.toLocaleString()} fields · {fieldUsage.summary.unused} unused · {fieldUsage.summary.calculated} calculated
          </p>
        </div>
        <div className="flex gap-2">
          {dbNames.length > 1 && (
            <select
              value={filterDb}
              onChange={e => { setFilterDb(e.target.value); setFilterTable(''); }}
              className="text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="">All Databases</option>
              {dbNames.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          )}
          {tables.length > 0 && (
            <select
              value={filterTable}
              onChange={e => setFilterTable(e.target.value)}
              className="text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 max-w-48"
            >
              <option value="">All Tables</option>
              {tables.map(name => <option key={name} value={name.includes('::') ? name.split('::')[1] : name}>{name}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Trash2 size={16} className="text-red-500" />
            <span className="text-sm font-medium text-red-700 dark:text-red-400">Unused</span>
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{filteredUnused.length}</div>
          <p className="text-xs text-red-500 dark:text-red-500 mt-1">Not referenced anywhere</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={16} className="text-amber-500" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Rarely Used</span>
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{filteredRarelyUsed.length}</div>
          <p className="text-xs text-amber-500 dark:text-amber-500 mt-1">1 reference only</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={16} className="text-blue-500" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Moderate</span>
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{filteredModerate.length}</div>
          <p className="text-xs text-blue-500 dark:text-blue-500 mt-1">2-5 references</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-emerald-500" />
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Heavy Use</span>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{filteredHeavy.length}</div>
          <p className="text-xs text-emerald-500 dark:text-emerald-500 mt-1">6+ references</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'unused', label: 'Unused Fields', color: 'red', count: filteredUnused.length },
          { id: 'rarely', label: 'Rarely Used', color: 'amber', count: filteredRarelyUsed.length },
          { id: 'moderate', label: 'Moderate Use', color: 'blue', count: filteredModerate.length },
          { id: 'heavy', label: 'Heavy Use', color: 'emerald', count: filteredHeavy.length },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? `bg-${t.color}-500 text-white shadow-lg`
                : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
            style={tab === t.id ? { backgroundColor: t.color === 'red' ? '#ef4444' : t.color === 'amber' ? '#f59e0b' : t.color === 'blue' ? '#3b82f6' : '#10b981' } : {}}
          >
            {t.label}
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${tab === t.id ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-600'}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Field Lists */}
      {tab === 'unused' && (
        <FieldUsageList
          fields={filteredUnused}
          title="Unused Fields"
          subtitle="These fields have no references in scripts, layouts, or calculations"
          color="red"
          onNav={onNav}
        />
      )}
      {tab === 'rarely' && (
        <FieldUsageList
          fields={filteredRarelyUsed}
          title="Rarely Used Fields"
          subtitle="These fields are only referenced in one place"
          color="amber"
          onNav={onNav}
        />
      )}
      {tab === 'moderate' && (
        <FieldUsageList
          fields={filteredModerate}
          title="Moderately Used Fields"
          subtitle="These fields have 2-5 references"
          color="blue"
          onNav={onNav}
        />
      )}
      {tab === 'heavy' && (
        <FieldUsageList
          fields={filteredHeavy}
          title="Heavily Used Fields"
          subtitle="These fields have 6+ references - consider impact before changes"
          color="emerald"
          onNav={onNav}
        />
      )}
    </div>
  );
};

const FieldUsageList = ({ fields, title, subtitle, color, onNav }) => {
  const [expanded, setExpanded] = useState(null);

  if (fields.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Grid3X3 size={48} className="mx-auto mb-4 text-gray-300" />
        <p>No fields in this category</p>
      </div>
    );
  }

  // Group by table for better organization
  const byTable = fields.reduce((acc, field) => {
    const key = `${field.db}::${field.table}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(field);
    return acc;
  }, {});

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
      <div className={`bg-${color}-50 px-4 py-3 border-b border-${color}-100`} style={{ backgroundColor: color === 'red' ? '#fef2f2' : color === 'amber' ? '#fffbeb' : color === 'blue' ? '#eff6ff' : '#ecfdf5' }}>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium text-gray-700">{title}</span>
            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          </div>
          <Badge color="field" size="sm">{fields.length} fields</Badge>
        </div>
      </div>
      <div className="max-h-[32rem] overflow-auto">
        {Object.entries(byTable).map(([tableKey, tableFields]) => (
          <div key={tableKey} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 flex items-center gap-2">
              <Table size={14} className="text-blue-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{tableKey}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">({tableFields.length} fields)</span>
            </div>
            {tableFields.map((field, i) => (
              <div key={i} className="border-t border-gray-100 dark:border-gray-700 first:border-0">
                <div
                  className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => setExpanded(expanded === `${tableKey}::${field.name}` ? null : `${tableKey}::${field.name}`)}
                >
                  <Grid3X3 size={14} className="text-cyan-500 flex-shrink-0" />
                  <span className="font-mono text-sm text-gray-700 dark:text-gray-200 flex-1">{field.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${dtColors[field.dataType] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                    {field.dataType}
                  </span>
                  {field.isCalculated && <Badge color="cf" size="xs">Calc</Badge>}
                  {field.isGlobal && <Badge color="ext" size="xs">Global</Badge>}
                  {field.refCount > 0 && (
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">{field.refCount} refs</span>
                  )}
                  <ChevronRight size={14} className={`text-gray-400 transition-transform ${expanded === `${tableKey}::${field.name}` ? 'rotate-90' : ''}`} />
                </div>
                {expanded === `${tableKey}::${field.name}` && (
                  <div className="px-4 pb-3 bg-gray-50 dark:bg-gray-700/50 space-y-2">
                    {field.references.scripts.length > 0 && (
                      <div>
                        <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase">In {field.references.scripts.length} Script(s)</div>
                        <div className="flex flex-wrap gap-1.5">
                          {field.references.scripts.slice(0, 10).map((ref, j) => (
                            <NavLink key={j} type="script" name={ref.script} small onClick={() => onNav('script', ref.script, ref.db)} />
                          ))}
                          {field.references.scripts.length > 10 && <span className="text-xs text-gray-500 dark:text-gray-400">+{field.references.scripts.length - 10} more</span>}
                        </div>
                      </div>
                    )}
                    {field.references.layouts.length > 0 && (
                      <div>
                        <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase">On {field.references.layouts.length} Layout(s)</div>
                        <div className="flex flex-wrap gap-1.5">
                          {field.references.layouts.slice(0, 10).map((ref, j) => (
                            <NavLink key={j} type="layout" name={ref.layout} small onClick={() => onNav('layout', ref.layout, ref.db)} />
                          ))}
                          {field.references.layouts.length > 10 && <span className="text-xs text-gray-500 dark:text-gray-400">+{field.references.layouts.length - 10} more</span>}
                        </div>
                      </div>
                    )}
                    {field.references.calcs.length > 0 && (
                      <div>
                        <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase">In {field.references.calcs.length} Calculation(s)</div>
                        <div className="flex flex-wrap gap-1.5">
                          {field.references.calcs.slice(0, 10).map((ref, j) => (
                            <span key={j} className="text-[10px] bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 px-2 py-1 rounded-full border border-cyan-200 dark:border-cyan-800">{ref.table}.{ref.field}</span>
                          ))}
                          {field.references.calcs.length > 10 && <span className="text-xs text-gray-500 dark:text-gray-400">+{field.references.calcs.length - 10} more</span>}
                        </div>
                      </div>
                    )}
                    {field.references.scripts.length === 0 && field.references.layouts.length === 0 && field.references.calcs.length === 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 italic">No references found</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FieldUsageView;

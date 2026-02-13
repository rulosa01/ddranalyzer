import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Search, Database, Table, Layout, FileText, Link2, List, ChevronRight, ChevronDown, ExternalLink, Layers, GitBranch, Grid3X3, Box, Code, Hash, Lock, Zap, Eye, Play, ArrowRight, Filter, X, BarChart3, AlertCircle, Settings, Upload, Sparkles, Shield, Gauge, FileSearch, Trash2, AlertTriangle, ArrowUpDown, ArrowDownAZ, ArrowUpAZ, User, KeyRound, ShieldCheck, Heart, Activity, TrendingUp, TrendingDown, Clock, Moon, Sun } from 'lucide-react';

// Dark mode hook
const useDarkMode = () => {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('ddr-dark-mode');
      if (saved !== null) return JSON.parse(saved);
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const newValue = !prev;
      try {
        localStorage.setItem('ddr-dark-mode', JSON.stringify(newValue));
      } catch {}
      return newValue;
    });
  }, []);

  return { darkMode, toggleDarkMode };
};
import parseXMLFiles, { analyzeDatabase } from './ddr-parser';

// Modern light color palette
const C = {
  table: { bg: 'bg-gradient-to-br from-blue-500 to-blue-600', light: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', hover: 'hover:bg-blue-100' },
  field: { bg: 'bg-gradient-to-br from-cyan-500 to-cyan-600', light: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-600', hover: 'hover:bg-cyan-100' },
  to: { bg: 'bg-gradient-to-br from-violet-500 to-violet-600', light: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-600', hover: 'hover:bg-violet-100' },
  layout: { bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', hover: 'hover:bg-emerald-100' },
  script: { bg: 'bg-gradient-to-br from-amber-500 to-orange-500', light: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', hover: 'hover:bg-amber-100' },
  rel: { bg: 'bg-gradient-to-br from-pink-500 to-rose-500', light: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-600', hover: 'hover:bg-pink-100' },
  vl: { bg: 'bg-gradient-to-br from-yellow-500 to-amber-500', light: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-600', hover: 'hover:bg-yellow-100' },
  ext: { bg: 'bg-gradient-to-br from-red-500 to-red-600', light: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', hover: 'hover:bg-red-100' },
  cf: { bg: 'bg-gradient-to-br from-indigo-500 to-indigo-600', light: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600', hover: 'hover:bg-indigo-100' },
  account: { bg: 'bg-gradient-to-br from-slate-500 to-slate-600', light: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600', hover: 'hover:bg-slate-100' },
  privset: { bg: 'bg-gradient-to-br from-orange-500 to-red-500', light: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', hover: 'hover:bg-orange-100' },
  extpriv: { bg: 'bg-gradient-to-br from-teal-500 to-teal-600', light: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-600', hover: 'hover:bg-teal-100' },
};

// Data type colors - light theme
const dtColors = {
  'Text': 'bg-blue-100 text-blue-700 border border-blue-200',
  'Number': 'bg-violet-100 text-violet-700 border border-violet-200',
  'Date': 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  'Time': 'bg-teal-100 text-teal-700 border border-teal-200',
  'Timestamp': 'bg-cyan-100 text-cyan-700 border border-cyan-200',
  'Container': 'bg-pink-100 text-pink-700 border border-pink-200',
};

// Simple UI components
const Badge = ({ color = 'field', size = 'sm', children }) => {
  const sz = { xs: 'text-[10px] px-1.5 py-0.5', sm: 'text-xs px-2 py-0.5', md: 'text-sm px-2.5 py-1' };
  return <span className={`${C[color]?.light || 'bg-gray-100'} ${C[color]?.text || 'text-gray-600'} ${C[color]?.border || 'border-gray-200'} border ${sz[size]} rounded-full font-medium inline-flex items-center gap-1`}>{children}</span>;
};

const Icon = ({ type, size = 14, className = '' }) => {
  const p = { size, className };
  const icons = { table: Table, field: Grid3X3, to: Layers, layout: Layout, script: Code, rel: GitBranch, vl: List, ext: ExternalLink, db: Database, cf: Settings, account: User, privset: KeyRound, extpriv: ShieldCheck };
  const I = icons[type] || Box;
  return <I {...p} />;
};

const NavLink = ({ type, name, onClick, small }) => (
  <button onClick={onClick} className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md transition-all ${C[type]?.light || 'bg-gray-100'} ${C[type]?.text || 'text-gray-600'} hover:opacity-80 ${small ? 'text-xs' : 'text-sm'}`}>
    <Icon type={type} size={small ? 10 : 12} />
    <span className="truncate max-w-[180px]">{name}</span>
  </button>
);

const Section = ({ title, count, icon, color = 'field', defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  if (count === 0 && !children) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl mb-3 overflow-hidden shadow-sm">
      <button onClick={() => setOpen(!open)} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 text-left transition-colors">
        <span className="text-gray-400">{open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
        {icon}
        <span className="font-medium text-gray-700 flex-1 text-sm">{title}</span>
        {count !== undefined && <Badge color={color} size="xs">{count}</Badge>}
      </button>
      {open && children && <div className="border-t border-gray-100 bg-gray-50/50 max-h-64 overflow-auto">{children}</div>}
    </div>
  );
};

// Field detail row with full metadata
const FieldRow = ({ field, tableName, dbName, reverseRefs, onNav }) => {
  const [expanded, setExpanded] = useState(false);
  const fieldKey = `${tableName}::${field.name}`;
  const inScripts = reverseRefs?.fieldInScripts?.[fieldKey] || [];
  const onLayouts = reverseRefs?.fieldOnLayouts?.[fieldKey] || [];
  const inCalcs = reverseRefs?.fieldInCalcs?.[fieldKey] || [];
  const refCount = inScripts.length + onLayouts.length + inCalcs.length;

  return (
    <div className={`border-b border-gray-100 transition-colors ${expanded ? 'bg-white' : 'hover:bg-gray-50'}`}>
      <div className="px-4 py-3 flex items-start gap-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-medium text-gray-800">{field.name}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${dtColors[field.dataType] || 'bg-gray-100 text-gray-600'}`}>
              {field.dataType}
            </span>
            {field.fieldType !== 'Normal' && <Badge color="script" size="xs">{field.fieldType}</Badge>}
            {field.global && <Badge color="ext" size="xs">Global</Badge>}
            {field.indexed && <Badge color="to" size="xs">Indexed</Badge>}
          </div>
          <div className="flex flex-wrap gap-2 mt-2 text-[10px]">
            {field.autoEnter && <span className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full border border-violet-200">Auto: {field.autoEnter}</span>}
            {field.validation && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-200">Valid: {field.validation}</span>}
            {field.repetitions && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">Reps: {field.repetitions}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          {refCount > 0 && <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{refCount} refs</span>}
          <span className="text-gray-400">{expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 bg-gray-50 border-t border-gray-100">
          {field.comment && <div className="text-xs text-gray-500 italic pt-3">{field.comment}</div>}

          {field.calcText && (
            <div className="pt-2">
              <div className="text-[10px] font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Calculation</div>
              <pre className="text-[11px] bg-white p-3 rounded-lg overflow-x-auto font-mono text-cyan-700 border border-gray-200">{field.calcText}</pre>
            </div>
          )}

          {field.autoEnterCalc && (
            <div className="pt-2">
              <div className="text-[10px] font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Auto-Enter Calc</div>
              <pre className="text-[11px] bg-violet-50 p-3 rounded-lg overflow-x-auto font-mono text-violet-700 border border-violet-200">{field.autoEnterCalc}</pre>
            </div>
          )}

          {field.validationCalc && (
            <div className="pt-2">
              <div className="text-[10px] font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Validation Calc</div>
              <pre className="text-[11px] bg-red-50 p-3 rounded-lg overflow-x-auto font-mono text-red-700 border border-red-200">{field.validationCalc}</pre>
            </div>
          )}

          {inScripts.length > 0 && (
            <div className="pt-2">
              <div className="text-[10px] font-medium text-gray-500 mb-2 uppercase tracking-wide">Used in {inScripts.length} Script(s)</div>
              <div className="flex flex-wrap gap-1.5">
                {inScripts.slice(0, 10).map((ref, i) => (
                  <NavLink key={i} type="script" name={ref.script} small onClick={() => onNav('script', ref.script, ref.db)} />
                ))}
                {inScripts.length > 10 && <span className="text-xs text-gray-500 self-center">+{inScripts.length - 10} more</span>}
              </div>
            </div>
          )}

          {onLayouts.length > 0 && (
            <div className="pt-2">
              <div className="text-[10px] font-medium text-gray-500 mb-2 uppercase tracking-wide">On {onLayouts.length} Layout(s)</div>
              <div className="flex flex-wrap gap-1.5">
                {onLayouts.slice(0, 10).map((ref, i) => (
                  <NavLink key={i} type="layout" name={ref.layout} small onClick={() => onNav('layout', ref.layout, ref.db)} />
                ))}
                {onLayouts.length > 10 && <span className="text-xs text-gray-500 self-center">+{onLayouts.length - 10} more</span>}
              </div>
            </div>
          )}

          {inCalcs.length > 0 && (
            <div className="pt-2">
              <div className="text-[10px] font-medium text-gray-500 mb-2 uppercase tracking-wide">Referenced in {inCalcs.length} Calc Field(s)</div>
              <div className="flex flex-wrap gap-1.5">
                {inCalcs.slice(0, 10).map((ref, i) => (
                  <span key={i} className="text-[10px] bg-cyan-100 text-cyan-700 px-2 py-1 rounded-full border border-cyan-200">{ref.table}.{ref.field}</span>
                ))}
                {inCalcs.length > 10 && <span className="text-xs text-gray-500 self-center">+{inCalcs.length - 10} more</span>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Table detail panel
const TableDetail = ({ table, dbName, reverseRefs, data, onNav }) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const dataTypes = useMemo(() => {
    const types = new Set(table.fields.map(f => f.dataType));
    return Array.from(types).sort();
  }, [table.fields]);

  const filteredFields = useMemo(() => {
    return table.fields.filter(f => {
      const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase());
      const matchType = !typeFilter || f.dataType === typeFilter;
      return matchSearch && matchType;
    });
  }, [table.fields, search, typeFilter]);

  // Find ALL TOs across all files based on this table
  const allTOs = useMemo(() => {
    if (!data?.databases) return { local: [], external: [] };
    const local = [];
    const external = [];

    // Local TOs in same file based on this table
    const thisDb = data.databases.find(d => d.name === dbName);
    if (thisDb) {
      for (const to of thisDb.tableOccurrences || []) {
        if (to.baseTable === table.name && !to.externalFile) {
          local.push({ toName: to.name, db: dbName });
        }
      }
    }

    // Shadow TOs in OTHER files that point to this table in this file
    for (const r of data.crossFileTableRefs || []) {
      if (r.baseTable === table.name && r.externalFile === dbName) {
        external.push(r);
      }
    }

    return { local, external };
  }, [table.name, dbName, data]);

  const totalTOs = allTOs.local.length + allTOs.external.length;

  return (
    <div className="h-full flex flex-col">
      <div className="p-5 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 ${C.table.bg} rounded-xl flex items-center justify-center shadow-lg`}>
            <Table size={18} className="text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800 text-lg">{table.name}</h2>
            <div className="text-sm text-gray-500">{table.fieldCount} fields · {table.records} records</div>
          </div>
        </div>
        {table.comment && <p className="text-sm text-gray-500 italic">{table.comment}</p>}

        <div className="flex gap-2 mt-4">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filter fields..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-gray-700 placeholder-gray-400"
            />
          </div>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-gray-700"
          >
            <option value="">All Types</option>
            {dataTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {/* Table Occurrences section */}
        {totalTOs > 0 && (
          <div className="bg-gray-50 border-b border-gray-200">
            <Section title="Table Occurrences" count={totalTOs} icon={<Layers size={14} className="text-violet-500" />} color="to" defaultOpen={true}>
              <div className="p-3 space-y-3">
                {allTOs.local.length > 0 && (
                  <div>
                    <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-2">
                      In {dbName} ({allTOs.local.length})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {allTOs.local.map((to, i) => (
                        <NavLink key={i} type="to" name={to.toName} small onClick={() => onNav('to', to.toName, to.db)} />
                      ))}
                    </div>
                  </div>
                )}
                {allTOs.external.length > 0 && (
                  <div>
                    <div className="text-[10px] font-medium text-red-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <ExternalLink size={10} />
                      In Other Files ({allTOs.external.length})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {allTOs.external.map((r, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <NavLink type="to" name={r.toName} small onClick={() => onNav('to', r.toName, r.toDb)} />
                          <span className="text-[10px] text-gray-400">({r.toDb})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Section>
          </div>
        )}

        {/* Fields */}
        <div className="bg-white">
          {filteredFields.map((field, i) => (
            <FieldRow key={i} field={field} tableName={table.name} dbName={dbName} reverseRefs={reverseRefs} onNav={onNav} />
          ))}
        </div>
      </div>
    </div>
  );
};

// Script detail panel
const ScriptDetail = ({ script, dbName, reverseRefs, data, onNav }) => {
  const callers = reverseRefs?.scriptCallers?.[script.name] || [];
  const onLayouts = reverseRefs?.scriptOnLayouts?.[script.name] || [];

  const crossFileCallers = useMemo(() => {
    if (!data?.crossFileRefs) return [];
    return data.crossFileRefs.filter(r => r.targetScript === script.name && r.targetDb === dbName);
  }, [script.name, dbName, data]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-5 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${C.script.bg} rounded-xl flex items-center justify-center shadow-lg`}>
            <Code size={18} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-gray-800 text-lg truncate">{script.name}</h2>
            <div className="text-sm text-gray-500">{script.stepCount || script.steps?.length || 0} steps</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-2 bg-gray-50">
        <Section title="Called By" count={callers.length} icon={<Play size={14} className="text-amber-500" />} color="script">
          <div className="p-3 flex flex-wrap gap-1.5">
            {callers.map((c, i) => <NavLink key={i} type="script" name={c.script} small onClick={() => onNav('script', c.script, c.db)} />)}
          </div>
        </Section>

        {crossFileCallers.length > 0 && (
          <Section title="Called From Other Files" count={crossFileCallers.length} icon={<ExternalLink size={14} className="text-rose-500" />} color="script">
            <div className="p-3 space-y-2">
              {Object.entries(crossFileCallers.reduce((acc, r) => {
                (acc[r.sourceDb] = acc[r.sourceDb] || []).push(r);
                return acc;
              }, {})).map(([sourceDb, refs]) => (
                <div key={sourceDb}>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                    <Database size={12} />
                    <span className="font-medium">{sourceDb}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 ml-4">
                    {refs.map((r, i) => (
                      <NavLink key={i} type="script" name={r.sourceScript} small
                        onClick={() => onNav('script', r.sourceScript, r.sourceDb)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="On Layouts" count={onLayouts.length} icon={<Layout size={14} className="text-emerald-500" />} color="layout">
          <div className="p-3 flex flex-wrap gap-1.5">
            {onLayouts.map((l, i) => <NavLink key={i} type="layout" name={l.layout} small onClick={() => onNav('layout', l.layout, l.db)} />)}
          </div>
        </Section>

        {script.callsScripts?.length > 0 && (
          <Section title="Calls Scripts" count={script.callsScripts.length} icon={<ArrowRight size={14} className="text-amber-500" />} color="script">
            <div className="p-3 flex flex-wrap gap-1.5">
              {script.callsScripts.map((s, i) => (
                <NavLink key={i} type={s.external ? 'ext' : 'script'} name={s.external ? `${s.file}::${s.name}` : s.name} small
                  onClick={() => !s.external && onNav('script', s.name, dbName)} />
              ))}
            </div>
          </Section>
        )}

        {script.goesToLayouts?.length > 0 && (
          <Section title="Goes to Layouts" count={script.goesToLayouts.length} icon={<Layout size={14} className="text-emerald-500" />} color="layout">
            <div className="p-3 flex flex-wrap gap-1.5">
              {script.goesToLayouts.map((l, i) => <NavLink key={i} type="layout" name={l} small onClick={() => onNav('layout', l, dbName)} />)}
            </div>
          </Section>
        )}

        {script.fieldRefs?.length > 0 && (
          <Section title="Field References" count={script.fieldRefs.length} icon={<Grid3X3 size={14} className="text-cyan-500" />} color="field" defaultOpen={false}>
            <div className="p-3 text-xs font-mono text-gray-600 max-h-40 overflow-auto space-y-1">
              {script.fieldRefs.slice(0, 50).map((f, i) => <div key={i} className="py-0.5 hover:text-gray-800">{f}</div>)}
              {script.fieldRefs.length > 50 && <div className="text-gray-400">+{script.fieldRefs.length - 50} more</div>}
            </div>
          </Section>
        )}

        {script.variables?.length > 0 && (
          <Section title="Variables" count={script.variables.length} icon={<Hash size={14} className="text-violet-500" />} color="to" defaultOpen={false}>
            <div className="p-3 flex flex-wrap gap-1.5">
              {script.variables.slice(0, 30).map((v, i) => <span key={i} className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-full border border-violet-200">{v}</span>)}
            </div>
          </Section>
        )}

        {script.steps?.length > 0 && (
          <Section title="Steps" count={script.steps.length} icon={<List size={14} className="text-gray-500" />} color="field" defaultOpen={false}>
            <div className="p-3 text-xs space-y-0.5 max-h-[32rem] overflow-auto">
              {script.steps.map((step, i) => (
                <div key={i} className={`py-1.5 px-2 rounded ${!step.enabled ? 'opacity-50 bg-gray-100' : 'hover:bg-white'}`}>
                  <div className="flex items-start gap-2">
                    <span className="text-gray-400 w-6 text-right flex-shrink-0 font-mono">{step.index || i+1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-medium ${!step.enabled ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{step.name}</span>
                        {step.scriptRef && (
                          <NavLink type={step.externalFile ? 'ext' : 'script'} name={step.externalFile ? `${step.externalFile}::${step.scriptRef}` : step.scriptRef} small
                            onClick={() => !step.externalFile && onNav('script', step.scriptRef, dbName)} />
                        )}
                        {step.layoutRef && <NavLink type="layout" name={step.layoutRef} small onClick={() => onNav('layout', step.layoutRef, dbName)} />}
                        {step.table && <Badge color="table" size="xs">{step.table}</Badge>}
                        {!step.enabled && <Badge color="ext" size="xs">Disabled</Badge>}
                      </div>
                      {/* Show step details based on type */}
                      {step.text && step.text !== step.name && (
                        <div className="text-[11px] text-gray-500 mt-0.5 font-mono truncate" title={step.text}>{step.text}</div>
                      )}
                      {step.targetField && (
                        <div className="text-[11px] text-cyan-600 mt-0.5">→ {step.targetField}</div>
                      )}
                      {step.variableName && (
                        <div className="text-[11px] text-violet-600 mt-0.5">
                          {step.variableName}{step.repetition && ` [${step.repetition}]`}
                          {step.calculation && <span className="text-gray-400"> = </span>}
                          {step.calculation && <span className="text-gray-600 font-mono">{step.calculation.length > 60 ? step.calculation.slice(0, 60) + '...' : step.calculation}</span>}
                        </div>
                      )}
                      {step.condition && (
                        <div className="text-[11px] text-amber-600 mt-0.5 font-mono">
                          {step.condition.length > 80 ? step.condition.slice(0, 80) + '...' : step.condition}
                        </div>
                      )}
                      {step.url && (
                        <div className="text-[11px] text-blue-600 mt-0.5 font-mono truncate">{step.url}</div>
                      )}
                      {step.sortFields && (
                        <div className="text-[11px] text-gray-500 mt-0.5">Sort by: {step.sortFields.join(', ')}</div>
                      )}
                      {step.title && (
                        <div className="text-[11px] text-gray-500 mt-0.5">Title: {step.title}</div>
                      )}
                      {step.windowName && (
                        <div className="text-[11px] text-gray-500 mt-0.5">Window: {step.windowName}</div>
                      )}
                      {step.recordAction && (
                        <div className="text-[11px] text-gray-500 mt-0.5">{step.recordAction}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
};

// Layout detail panel
const LayoutDetail = ({ layout, dbName, reverseRefs, onNav }) => {
  const fromScripts = reverseRefs?.layoutFromScripts?.[layout.name] || [];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-5 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${C.layout.bg} rounded-xl flex items-center justify-center shadow-lg`}>
            <Layout size={18} className="text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800 text-lg">{layout.name}</h2>
            {layout.baseTable && <div className="text-sm text-gray-500">Based on: {layout.baseTable}</div>}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-2 bg-gray-50">
        {layout.baseTable && (
          <Section title="Base Table Occurrence" count={1} icon={<Layers size={14} className="text-violet-500" />} color="to">
            <div className="p-3">
              <NavLink type="to" name={layout.baseTable} onClick={() => onNav('to', layout.baseTable, dbName)} />
            </div>
          </Section>
        )}

        {layout.triggers?.length > 0 && (
          <Section title="Script Triggers" count={layout.triggers.length} icon={<Zap size={14} className="text-yellow-500" />} color="vl">
            <div className="p-3 space-y-2">
              {/* Layout-level triggers */}
              {layout.triggers.filter(t => t.level === 'layout' || !t.level).length > 0 && (
                <div className="mb-3">
                  <div className="text-[10px] font-medium text-gray-500 uppercase mb-1.5">Layout Triggers</div>
                  {layout.triggers.filter(t => t.level === 'layout' || !t.level).map((t, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm mb-1">
                      <span className="text-gray-600 text-xs bg-yellow-100 px-2 py-1 rounded border border-yellow-200">{t.type}</span>
                      <NavLink type="script" name={t.script} small onClick={() => onNav('script', t.script, dbName)} />
                    </div>
                  ))}
                </div>
              )}
              {/* Field-level triggers */}
              {layout.triggers.filter(t => t.level === 'field').length > 0 && (
                <div>
                  <div className="text-[10px] font-medium text-gray-500 uppercase mb-1.5">Field Triggers</div>
                  {layout.triggers.filter(t => t.level === 'field').map((t, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm mb-1">
                      <span className="text-gray-600 text-xs bg-cyan-100 px-2 py-1 rounded border border-cyan-200">{t.type}</span>
                      <NavLink type="script" name={t.script} small onClick={() => onNav('script', t.script, dbName)} />
                      <span className="text-[10px] text-gray-400">on {t.field}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>
        )}

        {layout.buttonScripts?.length > 0 && (
          <Section title="Button Scripts" count={layout.buttonScripts.length} icon={<Play size={14} className="text-amber-500" />} color="script">
            <div className="p-3 flex flex-wrap gap-1.5">
              {layout.buttonScripts.map((s, i) => <NavLink key={i} type="script" name={s} small onClick={() => onNav('script', s, dbName)} />)}
            </div>
          </Section>
        )}

        <Section title="Navigated From Scripts" count={fromScripts.length} icon={<ArrowRight size={14} className="text-amber-500" />} color="script">
          <div className="p-3 flex flex-wrap gap-1.5">
            {fromScripts.map((s, i) => <NavLink key={i} type="script" name={s.script} small onClick={() => onNav('script', s.script, s.db)} />)}
          </div>
        </Section>

        {layout.fields?.length > 0 && (
          <Section title="Fields on Layout" count={layout.fields.length} icon={<Grid3X3 size={14} className="text-cyan-500" />} color="field" defaultOpen={false}>
            <div className="p-3 text-xs font-mono text-gray-600 max-h-48 overflow-auto space-y-1">
              {layout.fields.slice(0, 50).map((f, i) => <div key={i} className="py-0.5 hover:text-gray-800">{f}</div>)}
              {layout.fields.length > 50 && <div className="text-gray-400">+{layout.fields.length - 50} more</div>}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
};

// TO detail panel
const TODetail = ({ to, dbName, reverseRefs, data, onNav }) => {
  const layouts = reverseRefs?.toLayouts?.[to.name] || [];
  const rels = reverseRefs?.toRelationships?.[to.name] || [];

  // Find other TOs across all files that share the same base table (siblings)
  const siblingTOs = useMemo(() => {
    if (!data?.crossFileTableRefs) return [];
    // If this TO is a shadow TO, find other shadow TOs pointing to the same external table
    if (to.externalFile) {
      return data.crossFileTableRefs.filter(r =>
        r.baseTable === to.baseTable && r.externalFile === to.externalFile && !(r.toName === to.name && r.toDb === dbName)
      );
    }
    // If this is a local TO, find shadow TOs in other files pointing to this base table in this db
    return data.crossFileTableRefs.filter(r =>
      r.baseTable === to.baseTable && r.externalFile === dbName
    );
  }, [to, dbName, data]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-5 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${to.externalFile ? C.ext.bg : C.to.bg} rounded-xl flex items-center justify-center shadow-lg`}>
            <Layers size={18} className="text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800 text-lg">{to.name}</h2>
            <div className="text-sm text-gray-500 flex items-center gap-2">
              Base: {to.baseTable}
              {to.externalFile && <Badge color="ext" size="xs">External: {to.externalFile}</Badge>}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-2 bg-gray-50">
        {to.externalFile && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-2">
            <div className="flex items-center gap-2 text-sm text-red-700">
              <ExternalLink size={14} />
              <span className="font-medium">Shadow TO</span>
            </div>
            <p className="text-xs text-red-600 mt-1">
              This table occurrence points to <strong>{to.baseTable}</strong> in external file <strong>{to.externalFile}</strong>
            </p>
          </div>
        )}

        {siblingTOs.length > 0 && (
          <Section
            title={to.externalFile ? "Other TOs Referencing Same Table" : "External TOs Pointing to This Table"}
            count={siblingTOs.length}
            icon={<ExternalLink size={14} className="text-red-500" />}
            color="ext"
          >
            <div className="p-3 space-y-2">
              {siblingTOs.map((r, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <NavLink type="to" name={r.toName} small onClick={() => onNav('to', r.toName, r.toDb)} />
                  <span className="text-gray-400 text-xs">in {r.toDb}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Layouts Using This TO" count={layouts.length} icon={<Layout size={14} className="text-emerald-500" />} color="layout">
          <div className="p-3 flex flex-wrap gap-1.5">
            {layouts.map((l, i) => <NavLink key={i} type="layout" name={l.layout} small onClick={() => onNav('layout', l.layout, l.db)} />)}
          </div>
        </Section>

        <Section title="Relationships" count={rels.length} icon={<GitBranch size={14} className="text-pink-500" />} color="rel">
          <div className="p-3 space-y-2 text-sm">
            {rels.map((r, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded text-xs ${r.side === 'left' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {r.side}
                </span>
                <NavLink type="rel" name={r.relationship} small onClick={() => onNav('rel', r.relationship, r.db)} />
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
};

// Relationship detail panel
const RelDetail = ({ rel, dbName, onNav }) => {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-5 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${C.rel.bg} rounded-xl flex items-center justify-center shadow-lg`}>
            <GitBranch size={18} className="text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800 text-lg">Relationship</h2>
            <div className="text-sm text-gray-500">ID: {rel.id}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-5 bg-gray-50">
        <div className="flex items-center justify-between gap-6 p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="text-center">
            <NavLink type="to" name={rel.leftTable} onClick={() => onNav('to', rel.leftTable, dbName)} />
          </div>
          <div className="flex-1 flex flex-col items-center gap-2">
            {rel.predicates?.map((p, i) => (
              <div key={i} className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-center">
                <div className="font-mono text-gray-700">{p.leftField} <span className="text-pink-500">{p.type === 'Equal' ? '=' : p.type}</span> {p.rightField}</div>
                {(p.cascadeCreate || p.cascadeDelete) && (
                  <div className="text-[11px] text-gray-500 mt-1">
                    {p.cascadeCreate && <span className="mr-3">↳ Create</span>}
                    {p.cascadeDelete && <span>↳ Delete</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <NavLink type="to" name={rel.rightTable} onClick={() => onNav('to', rel.rightTable, dbName)} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Account detail panel
const AccountDetail = ({ account, dbName, data }) => {
  // Find accounts with same privilege set
  const samePrivSet = useMemo(() => {
    if (!account.privilegeSet || !data?.databases) return [];
    const db = data.databases.find(d => d.name === dbName);
    return (db?.accounts || []).filter(a => a.privilegeSet === account.privilegeSet && a.name !== account.name);
  }, [account, dbName, data]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-5 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${C.account.bg} rounded-xl flex items-center justify-center shadow-lg`}>
            <User size={18} className="text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800 text-lg">{account.name}</h2>
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <Badge color={account.status === 'Active' ? 'layout' : 'ext'} size="xs">{account.status}</Badge>
              {account.managedBy && <span className="text-gray-400">· {account.managedBy}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3 bg-gray-50">
        {/* Security warnings */}
        {account.emptyPassword && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm text-red-700">
              <AlertTriangle size={14} />
              <span className="font-medium">Empty Password</span>
            </div>
            <p className="text-xs text-red-600 mt-1">This account has no password set.</p>
          </div>
        )}

        {/* Privilege Set */}
        <Section title="Privilege Set" count={1} icon={<KeyRound size={14} className="text-orange-500" />} color="privset">
          <div className="p-3">
            <div className="flex items-center gap-2">
              <Badge color="privset">{account.privilegeSet || 'None'}</Badge>
              {account.changePasswordOnNextLogin && (
                <Badge color="ext" size="xs">Must change password</Badge>
              )}
            </div>
          </div>
        </Section>

        {/* Other accounts with same privilege set */}
        {samePrivSet.length > 0 && (
          <Section title="Other Accounts with Same Privileges" count={samePrivSet.length} icon={<User size={14} className="text-slate-500" />} color="account">
            <div className="p-3 flex flex-wrap gap-1.5">
              {samePrivSet.map((a, i) => (
                <Badge key={i} color="account">{a.name}</Badge>
              ))}
            </div>
          </Section>
        )}

        {/* Description */}
        {account.description && (
          <Section title="Description" icon={<FileText size={14} className="text-gray-500" />} color="account">
            <div className="p-3 text-sm text-gray-600">{account.description}</div>
          </Section>
        )}
      </div>
    </div>
  );
};

// Privilege Set detail panel
const PrivSetDetail = ({ privset, dbName, data }) => {
  // Find accounts using this privilege set
  const accounts = useMemo(() => {
    if (!data?.databases) return [];
    const db = data.databases.find(d => d.name === dbName);
    return (db?.accounts || []).filter(a => a.privilegeSet === privset.name);
  }, [privset, dbName, data]);

  // Find extended privileges that include this set
  const extPrivs = useMemo(() => {
    if (!data?.databases) return [];
    const db = data.databases.find(d => d.name === dbName);
    return (db?.extendedPrivileges || []).filter(ep => ep.privilegeSets?.includes(privset.name));
  }, [privset, dbName, data]);

  const accessLevels = [
    { label: 'Records', value: privset.records, icon: Table },
    { label: 'Layouts', value: privset.layouts, canCreate: privset.layoutCreation, icon: Layout },
    { label: 'Scripts', value: privset.scripts, canCreate: privset.scriptCreation, icon: Code },
    { label: 'Value Lists', value: privset.valueLists, canCreate: privset.valueListCreation, icon: List },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-5 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${C.privset.bg} rounded-xl flex items-center justify-center shadow-lg`}>
            <KeyRound size={18} className="text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800 text-lg">{privset.name}</h2>
            {privset.comment && <div className="text-sm text-gray-500">{privset.comment}</div>}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3 bg-gray-50">
        {/* Access Levels */}
        <Section title="Access Levels" icon={<Shield size={14} className="text-orange-500" />} color="privset" defaultOpen={true}>
          <div className="p-3 space-y-2">
            {accessLevels.map((al, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <al.icon size={14} className="text-gray-400" />
                  {al.label}
                </div>
                <div className="flex items-center gap-2">
                  <Badge color={al.value === 'NoAccess' ? 'ext' : al.value === 'Modifiable' ? 'layout' : 'field'} size="xs">
                    {al.value || 'N/A'}
                  </Badge>
                  {al.canCreate && <Badge color="layout" size="xs">+Create</Badge>}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Permissions */}
        <Section title="Permissions" icon={<Lock size={14} className="text-orange-500" />} color="privset">
          <div className="p-3 flex flex-wrap gap-2">
            {privset.printing && <Badge color="layout" size="xs">Printing</Badge>}
            {privset.exporting && <Badge color="layout" size="xs">Exporting</Badge>}
            {privset.manageAccounts && <Badge color="ext" size="xs">Manage Accounts</Badge>}
            {privset.allowModifyPassword && <Badge color="field" size="xs">Modify Password</Badge>}
            {privset.overrideValidationWarning && <Badge color="field" size="xs">Override Validation</Badge>}
            {!privset.printing && !privset.exporting && !privset.manageAccounts && !privset.allowModifyPassword && (
              <span className="text-sm text-gray-400">No additional permissions</span>
            )}
          </div>
        </Section>

        {/* Menu Access */}
        <Section title="Menu Access" icon={<Settings size={14} className="text-gray-500" />} color="account">
          <div className="p-3">
            <Badge color={privset.menu === 'All' ? 'layout' : privset.menu === 'Minimal' ? 'ext' : 'field'}>
              {privset.menu || 'All'}
            </Badge>
          </div>
        </Section>

        {/* Accounts using this set */}
        <Section title="Accounts Using This Set" count={accounts.length} icon={<User size={14} className="text-slate-500" />} color="account">
          <div className="p-3 flex flex-wrap gap-1.5">
            {accounts.length > 0 ? accounts.map((a, i) => (
              <Badge key={i} color={a.status === 'Active' ? 'account' : 'ext'}>{a.name}</Badge>
            )) : <span className="text-sm text-gray-400">No accounts</span>}
          </div>
        </Section>

        {/* Extended Privileges */}
        {extPrivs.length > 0 && (
          <Section title="Extended Privileges" count={extPrivs.length} icon={<ShieldCheck size={14} className="text-teal-500" />} color="extpriv">
            <div className="p-3 flex flex-wrap gap-1.5">
              {extPrivs.map((ep, i) => <Badge key={i} color="extpriv">{ep.name}</Badge>)}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
};

// Extended Privilege detail panel
const ExtPrivDetail = ({ extpriv, dbName, data }) => {
  // Find privilege sets that have this extended privilege
  const privSets = useMemo(() => {
    if (!data?.databases) return [];
    const db = data.databases.find(d => d.name === dbName);
    return (db?.privilegeSets || []).filter(ps => extpriv.privilegeSets?.includes(ps.name));
  }, [extpriv, dbName, data]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-5 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${C.extpriv.bg} rounded-xl flex items-center justify-center shadow-lg`}>
            <ShieldCheck size={18} className="text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800 text-lg">{extpriv.name}</h2>
            {extpriv.comment && <div className="text-sm text-gray-500">{extpriv.comment}</div>}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3 bg-gray-50">
        {/* Assigned Privilege Sets */}
        <Section title="Assigned to Privilege Sets" count={extpriv.privilegeSets?.length || 0} icon={<KeyRound size={14} className="text-orange-500" />} color="privset">
          <div className="p-3 flex flex-wrap gap-1.5">
            {(extpriv.privilegeSets || []).length > 0 ? extpriv.privilegeSets.map((ps, i) => (
              <Badge key={i} color="privset">{ps}</Badge>
            )) : <span className="text-sm text-gray-400">Not assigned to any privilege sets</span>}
          </div>
        </Section>

        {/* Show privilege set details */}
        {privSets.length > 0 && (
          <Section title="Privilege Set Details" icon={<Shield size={14} className="text-orange-500" />} color="privset" defaultOpen={false}>
            <div className="p-3 space-y-2">
              {privSets.map((ps, i) => (
                <div key={i} className="text-sm p-2 bg-white rounded-lg border border-gray-100">
                  <div className="font-medium text-gray-700">{ps.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Records: {ps.records} · Layouts: {ps.layouts} · Scripts: {ps.scripts}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
};

// Stats view
const StatsView = ({ data }) => {
  const stats = useMemo(() => {
    let totals = { tables: 0, fields: 0, tos: 0, layouts: 0, scripts: 0, rels: 0, vls: 0, cfs: 0, accounts: 0, privsets: 0, extprivs: 0 };
    const perDb = [];

    for (const db of data.databases) {
      const dbStats = {
        name: db.name,
        tables: db.tables?.length || 0,
        fields: db.tables?.reduce((sum, t) => sum + (t.fields?.length || 0), 0) || 0,
        tos: db.tableOccurrences?.length || 0,
        layouts: db.layouts?.length || 0,
        scripts: db.scripts?.length || 0,
        rels: db.relationships?.length || 0,
        vls: db.valueLists?.length || 0,
        cfs: db.customFunctions?.length || 0,
        accounts: db.accounts?.length || 0,
        privsets: db.privilegeSets?.length || 0,
        extprivs: db.extendedPrivileges?.length || 0,
      };
      perDb.push(dbStats);
      for (const k of Object.keys(totals)) totals[k] += dbStats[k];
    }

    return { totals, perDb };
  }, [data]);

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Tables', value: stats.totals.tables, color: 'table' },
          { label: 'Fields', value: stats.totals.fields, color: 'field' },
          { label: 'TOs', value: stats.totals.tos, color: 'to' },
          { label: 'Layouts', value: stats.totals.layouts, color: 'layout' },
          { label: 'Scripts', value: stats.totals.scripts, color: 'script' },
          { label: 'Relationships', value: stats.totals.rels, color: 'rel' },
          { label: 'Value Lists', value: stats.totals.vls, color: 'vl' },
          { label: 'Custom Functions', value: stats.totals.cfs, color: 'cf' },
          { label: 'Accounts', value: stats.totals.accounts, color: 'account' },
          { label: 'Privilege Sets', value: stats.totals.privsets, color: 'privset' },
          { label: 'Ext Privileges', value: stats.totals.extprivs, color: 'extpriv' },
        ].map(s => (
          <div key={s.label} className={`${C[s.color].light} ${C[s.color].border} border rounded-xl p-5 shadow-sm`}>
            <div className={`text-3xl font-bold ${C[s.color].text}`}>{s.value.toLocaleString()}</div>
            <div className="text-sm text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4 font-medium text-gray-700">Database</th>
              <th className="text-right p-4 font-medium text-gray-700">Tables</th>
              <th className="text-right p-4 font-medium text-gray-700">Fields</th>
              <th className="text-right p-4 font-medium text-gray-700">TOs</th>
              <th className="text-right p-4 font-medium text-gray-700">Layouts</th>
              <th className="text-right p-4 font-medium text-gray-700">Scripts</th>
              <th className="text-right p-4 font-medium text-gray-700">Rels</th>
            </tr>
          </thead>
          <tbody>
            {stats.perDb.map((db, i) => (
              <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-800">{db.name}</td>
                <td className="p-4 text-right text-gray-600">{db.tables}</td>
                <td className="p-4 text-right text-gray-600">{db.fields}</td>
                <td className="p-4 text-right text-gray-600">{db.tos}</td>
                <td className="p-4 text-right text-gray-600">{db.layouts}</td>
                <td className="p-4 text-right text-gray-600">{db.scripts}</td>
                <td className="p-4 text-right text-gray-600">{db.rels}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Cross-file references view
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
      <div className="p-6 text-center text-gray-500">
        <ExternalLink size={48} className="mx-auto mb-4 text-gray-300" />
        <p>No cross-file references found</p>
        <p className="text-sm text-gray-400 mt-2">Shadow TOs and external script calls will appear here</p>
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
          <h2 className="text-xl font-bold text-gray-800">Cross-File References</h2>
          <p className="text-sm text-gray-500">{toRefs.length} shadow TOs · {scriptRefs.length} external script calls</p>
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
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <t.icon size={14} />
            {t.label}
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${tab === t.id ? 'bg-white/20' : 'bg-gray-100'}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {tab === 'tos' && (
        <div className="space-y-4">
          {Object.entries(groupedTOs).map(([key, items]) => (
            <div key={key} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-violet-50 px-4 py-3 border-b border-violet-100 flex items-center gap-3">
                <Layers size={16} className="text-violet-500" />
                <span className="font-medium text-violet-700">{key}</span>
                <Badge color="to" size="xs">{items.length} TOs</Badge>
              </div>
              <div className="p-4">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-2 font-medium text-gray-700">TO Name</th>
                      <th className="text-left p-2 font-medium text-gray-700">Base Table</th>
                      <th className="text-left p-2 font-medium text-gray-700">External File</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((r, i) => (
                      <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="p-2">
                          <NavLink type="to" name={r.toName} small onClick={() => onNav('to', r.toName, r.toDb)} />
                        </td>
                        <td className="p-2 text-gray-600">{r.baseTable}</td>
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
            <div className="text-center py-12 text-gray-500">
              <Layers size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No shadow table occurrences found</p>
            </div>
          )}
        </div>
      )}

      {tab === 'tables' && (
        <div className="space-y-4">
          {tableGroups.map((group, gi) => (
            <div key={gi} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex items-center gap-3">
                <Table size={16} className="text-blue-500" />
                <span className="font-medium text-blue-700">{group.externalFile}::{group.baseTable}</span>
                <Badge color="to" size="xs">{group.tos.length} TOs</Badge>
              </div>
              <div className="p-4 flex flex-wrap gap-2">
                {group.tos.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                    <NavLink type="to" name={r.toName} small onClick={() => onNav('to', r.toName, r.toDb)} />
                    <span className="text-gray-400 text-xs">in {r.toDb}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {tableGroups.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Table size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No cross-file table references found</p>
            </div>
          )}
        </div>
      )}

      {tab === 'scripts' && (
        <div className="space-y-4">
          {Object.entries(groupedScripts).map(([key, items]) => (
            <div key={key} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-red-50 px-4 py-3 border-b border-red-100 flex items-center gap-3">
                <Code size={16} className="text-red-500" />
                <span className="font-medium text-red-600">{key}</span>
                <Badge color="ext" size="xs">{items.length}</Badge>
              </div>
              <div className="p-4 space-y-2">
                {items.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <NavLink type="script" name={r.sourceScript} onClick={() => onNav('script', r.sourceScript, r.sourceDb)} />
                    <ArrowRight size={14} className="text-gray-400" />
                    <span className="text-gray-500">{r.targetScript}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {scriptRefs.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Code size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No cross-file script calls found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Audit View - Security & Orphans
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
          <h2 className="text-xl font-bold text-gray-800">Audit & Analysis</h2>
          <p className="text-sm text-gray-500">Security, cleanup, and performance analysis</p>
        </div>
        {dbNames.length > 1 && (
          <select
            value={filterDb}
            onChange={e => setFilterDb(e.target.value)}
            className="text-sm bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
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
            <span className={`text-xs font-medium text-${group.color}-600 w-16`}>{group.label}</span>
            <div className="flex gap-1.5 flex-wrap">
              {group.tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    tab === t.id
                      ? `bg-${group.color}-500 text-white shadow-md`
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <t.icon size={12} />
                  {t.label}
                  {t.count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${tab === t.id ? 'bg-white/20' : 'bg-gray-100'}`}>
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
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle size={20} className="text-red-500" />
                  <span className="font-medium text-red-700">Scripts Running with Full Access Privileges</span>
                </div>
                <p className="text-sm text-red-600 mb-4">
                  These scripts run with elevated privileges regardless of the user's privilege set.
                  {filteredSecurity.unrestrictedScripts.length > 0 && (
                    <span className="font-medium"> {filteredSecurity.unrestrictedScripts.length} are also included in menus (higher risk).</span>
                  )}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 font-medium text-gray-700">Script</th>
                      <th className="text-left p-3 font-medium text-gray-700">Database</th>
                      <th className="text-left p-3 font-medium text-gray-700">Folder</th>
                      <th className="text-left p-3 font-medium text-gray-700">In Menu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSecurity.fullAccessScripts.map((s, i) => (
                      <tr key={i} className={`border-t border-gray-100 hover:bg-gray-50 ${s.inMenu ? 'bg-red-50/50' : ''}`}>
                        <td className="p-3">
                          <NavLink type="script" name={s.name} onClick={() => onNav('script', s.name, s.db)} />
                        </td>
                        <td className="p-3 text-gray-600">{s.db}</td>
                        <td className="p-3 text-gray-500 text-xs">{s.folder || '-'}</td>
                        <td className="p-3">
                          {s.inMenu ? (
                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">Yes</span>
                          ) : (
                            <span className="text-gray-400 text-xs">No</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Shield size={48} className="mx-auto mb-4 text-green-300" />
              <p className="text-green-600 font-medium">No scripts with full access privileges found</p>
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
      <div className="text-center py-12 text-gray-500">
        <Trash2 size={48} className="mx-auto mb-4 text-green-300" />
        <p className="text-green-600 font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="bg-amber-50 px-4 py-3 border-b border-amber-100">
        <span className="text-amber-700 font-medium">{items.length} potentially unused {type}s found</span>
      </div>
      <div className="max-h-96 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {columns.map(c => (
                <th key={c} className="text-left p-3 font-medium text-gray-700 capitalize">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                {columns.map(c => (
                  <td key={c} className="p-3">
                    {c === 'name' ? (
                      <NavLink type={type} name={item.name} onClick={() => onNav(type, item.name, item.db)} />
                    ) : (
                      <span className="text-gray-600">{item[c] || '-'}</span>
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
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${usageTab === t.id ? 'bg-white/20' : 'bg-gray-100'}`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
        {tables.length > 0 && (
          <select
            value={filterTable}
            onChange={e => setFilterTable(e.target.value)}
            className="text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none"
          >
            <option value="">All Tables</option>
            {tables.map(t => <option key={t} value={t.includes('::') ? t.split('::')[1] : t}>{t}</option>)}
          </select>
        )}
      </div>

      {currentItems.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Heart size={32} className="mx-auto mb-2 text-green-300" />
          <p className="text-sm">No fields in this category</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="max-h-80 overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-700">Table</th>
                  <th className="text-left p-3 font-medium text-gray-700">Field</th>
                  <th className="text-left p-3 font-medium text-gray-700">Type</th>
                  <th className="text-left p-3 font-medium text-gray-700">Refs</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.slice(0, 100).map((f, i) => (
                  <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="p-3 text-gray-600 text-xs">{f.table}</td>
                    <td className="p-3 font-mono text-cyan-600">{f.name}</td>
                    <td className="p-3 text-gray-500 text-xs">{f.dataType}</td>
                    <td className="p-3 text-gray-400 text-xs">{f.refCount || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {currentItems.length > 100 && (
            <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 border-t">
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
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t.label}
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${perfTab === t.id ? 'bg-white/20' : 'bg-gray-100'}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {perfTab === 'calcs' && (
        filteredCalcs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Zap size={32} className="mx-auto mb-2 text-green-300" />
            <p className="text-sm">No unstored calculations found</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-orange-50 px-4 py-2 border-b border-orange-100 text-xs text-orange-700">
              Unstored calculations are re-evaluated each time they're accessed
            </div>
            <div className="max-h-80 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-700">Table</th>
                    <th className="text-left p-3 font-medium text-gray-700">Field</th>
                    <th className="text-left p-3 font-medium text-gray-700">DB</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCalcs.slice(0, 100).map((c, i) => (
                    <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="p-3 text-gray-600 text-xs">{c.table}</td>
                      <td className="p-3 font-mono text-orange-600">{c.name}</td>
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
          <div className="text-center py-8 text-gray-500">
            <Table size={32} className="mx-auto mb-2 text-green-300" />
            <p className="text-sm">No tables with excessive fields found</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-red-50 px-4 py-2 border-b border-red-100 text-xs text-red-700">
              Tables with many fields can impact performance and maintainability
            </div>
            <div className="max-h-80 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-700">Table</th>
                    <th className="text-left p-3 font-medium text-gray-700">Fields</th>
                    <th className="text-left p-3 font-medium text-gray-700">DB</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWide.map((t, i) => (
                    <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="p-3">
                        <NavLink type="table" name={t.name} onClick={() => onNav('table', t.name, t.db)} />
                      </td>
                      <td className="p-3 font-medium text-red-600">{t.fieldCount}</td>
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
          <div className="text-center py-8 text-gray-500">
            <Code size={32} className="mx-auto mb-2 text-green-300" />
            <p className="text-sm">No excessively large scripts found</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-amber-50 px-4 py-2 border-b border-amber-100 text-xs text-amber-700">
              Large scripts may benefit from being broken into smaller, reusable sub-scripts
            </div>
            <div className="max-h-80 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-700">Script</th>
                    <th className="text-left p-3 font-medium text-gray-700">Steps</th>
                    <th className="text-left p-3 font-medium text-gray-700">DB</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLarge.map((s, i) => (
                    <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="p-3">
                        <NavLink type="script" name={s.name} onClick={() => onNav('script', s.name, s.db)} />
                      </td>
                      <td className="p-3 font-medium text-amber-600">{s.stepCount}</td>
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
          <div className="text-center py-8 text-gray-500">
            <Box size={32} className="mx-auto mb-2 text-green-300" />
            <p className="text-sm">No container fields found</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-purple-50 px-4 py-2 border-b border-purple-100 text-xs text-purple-700">
              Container fields store binary data - consider external storage for large files
            </div>
            <div className="max-h-80 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-700">Table</th>
                    <th className="text-left p-3 font-medium text-gray-700">Field</th>
                    <th className="text-left p-3 font-medium text-gray-700">DB</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContainers.slice(0, 100).map((c, i) => (
                    <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="p-3 text-gray-600 text-xs">{c.table}</td>
                      <td className="p-3 font-mono text-purple-600">{c.name}</td>
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
          <div className="text-center py-8 text-gray-500">
            <Sparkles size={32} className="mx-auto mb-2 text-green-300" />
            <p className="text-sm">No global fields found</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-blue-50 px-4 py-2 border-b border-blue-100 text-xs text-blue-700">
              Global fields are session-specific and can use memory
            </div>
            <div className="max-h-80 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-700">Table</th>
                    <th className="text-left p-3 font-medium text-gray-700">Field</th>
                    <th className="text-left p-3 font-medium text-gray-700">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGlobals.slice(0, 100).map((g, i) => (
                    <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="p-3 text-gray-600 text-xs">{g.table}</td>
                      <td className="p-3 font-mono text-blue-600">{g.name}</td>
                      <td className="p-3 text-gray-500 text-xs">{g.dataType}</td>
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
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-purple-50 px-4 py-2 border-b border-purple-100 flex items-center gap-3">
            <Database size={14} className="text-purple-500" />
            <span className="font-medium text-purple-700 text-sm">ExecuteSQL ({filteredSQL.length})</span>
          </div>
          <div className="p-3 space-y-1.5 max-h-48 overflow-auto">
            {filteredSQL.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs p-1.5 hover:bg-gray-50 rounded">
                {item.location === 'script' ? (
                  <>
                    <NavLink type="script" name={item.script} small onClick={() => onNav('script', item.script, item.db)} />
                    <span className="text-gray-400">step {item.step}</span>
                  </>
                ) : (
                  <>
                    <span className="text-gray-500">{item.table}::</span>
                    <span className="font-mono text-purple-600">{item.field}</span>
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
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-amber-50 px-4 py-2 border-b border-amber-100 flex items-center gap-3">
            <Code size={14} className="text-amber-500" />
            <span className="font-medium text-amber-700 text-sm">Evaluate ({filteredEval.length})</span>
          </div>
          <div className="p-3 space-y-1.5 max-h-48 overflow-auto">
            {filteredEval.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs p-1.5 hover:bg-gray-50 rounded">
                {item.location === 'script' ? (
                  <>
                    <NavLink type="script" name={item.script} small onClick={() => onNav('script', item.script, item.db)} />
                    <span className="text-gray-400">step {item.step}</span>
                  </>
                ) : (
                  <>
                    <span className="text-gray-500">{item.table}::</span>
                    <span className="font-mono text-amber-600">{item.field}</span>
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
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-rose-50 px-4 py-2 border-b border-rose-100 flex items-center gap-3">
            <Zap size={14} className="text-rose-500" />
            <span className="font-medium text-rose-700 text-sm">Dynamic References ({filteredDynamic.length})</span>
          </div>
          <div className="p-3 space-y-1.5 max-h-48 overflow-auto">
            {filteredDynamic.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs p-1.5 hover:bg-gray-50 rounded">
                <NavLink type="script" name={item.script} small onClick={() => onNav('script', item.script, item.db)} />
                <span className="text-gray-400">step {item.step}</span>
                <span className="text-gray-400 text-[10px] ml-auto">{item.db}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Indirection View - ExecuteSQL, Evaluate, etc.
const IndirectionView = ({ analysis, data, onNav }) => {
  const [filterDb, setFilterDb] = useState('');
  const { indirection } = analysis || {};

  const filterItem = (items) => filterDb ? items?.filter(i => i.db === filterDb) : items;
  const filteredSQL = filterItem(indirection?.executeSQL) || [];
  const filteredEval = filterItem(indirection?.evaluate) || [];
  const filteredDynamic = filterItem(indirection?.dynamicRefs) || [];
  const totalCount = filteredSQL.length + filteredEval.length + filteredDynamic.length;

  const dbNames = data?.databases?.map(d => d.name) || [];

  if (totalCount === 0 && !filterDb) {
    return (
      <div className="p-6 text-center">
        <FileSearch size={48} className="mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500">No indirection patterns detected</p>
        <p className="text-sm text-gray-400 mt-2">ExecuteSQL, Evaluate, and dynamic references will appear here</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
          <FileSearch size={24} className="text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-800">Indirection Sources</h2>
          <p className="text-sm text-gray-500">Dynamic code execution and SQL queries ({totalCount} found)</p>
        </div>
        {dbNames.length > 1 && (
          <select
            value={filterDb}
            onChange={e => setFilterDb(e.target.value)}
            className="text-sm bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="">All Databases</option>
            {dbNames.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
        )}
      </div>

      {filteredSQL.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-purple-50 px-4 py-3 border-b border-purple-100 flex items-center gap-3">
            <Database size={16} className="text-purple-500" />
            <span className="font-medium text-purple-700">ExecuteSQL ({filteredSQL.length})</span>
          </div>
          <div className="p-4 space-y-2 max-h-64 overflow-auto">
            {filteredSQL.map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm p-2 hover:bg-gray-50 rounded-lg">
                {item.location === 'script' ? (
                  <>
                    <NavLink type="script" name={item.script} small onClick={() => onNav('script', item.script, item.db)} />
                    <span className="text-gray-400">step {item.step}</span>
                  </>
                ) : (
                  <>
                    <span className="text-gray-500">{item.table}::</span>
                    <span className="font-mono text-purple-600">{item.field}</span>
                    <Badge color="cf" size="xs">{item.location}</Badge>
                  </>
                )}
                <span className="text-gray-400 text-xs ml-auto">{item.db}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredEval.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-amber-50 px-4 py-3 border-b border-amber-100 flex items-center gap-3">
            <Zap size={16} className="text-amber-500" />
            <span className="font-medium text-amber-700">Evaluate ({filteredEval.length})</span>
          </div>
          <div className="p-4 space-y-2 max-h-64 overflow-auto">
            {filteredEval.map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm p-2 hover:bg-gray-50 rounded-lg">
                {item.location === 'script' ? (
                  <>
                    <NavLink type="script" name={item.script} small onClick={() => onNav('script', item.script, item.db)} />
                    <span className="text-gray-400">step {item.step}</span>
                  </>
                ) : (
                  <>
                    <span className="text-gray-500">{item.table}::</span>
                    <span className="font-mono text-amber-600">{item.field}</span>
                  </>
                )}
                <span className="text-gray-400 text-xs ml-auto">{item.db}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredDynamic.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-cyan-50 px-4 py-3 border-b border-cyan-100 flex items-center gap-3">
            <ArrowRight size={16} className="text-cyan-500" />
            <span className="font-medium text-cyan-700">Other Dynamic References ({filteredDynamic.length})</span>
          </div>
          <div className="p-4 space-y-2 max-h-64 overflow-auto">
            {filteredDynamic.map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm p-2 hover:bg-gray-50 rounded-lg">
                <Badge color="field" size="xs">{item.type}</Badge>
                {item.location === 'script' ? (
                  <NavLink type="script" name={item.script} small onClick={() => onNav('script', item.script, item.db)} />
                ) : (
                  <span className="font-mono text-gray-600">{item.table}::{item.field}</span>
                )}
                <span className="text-gray-400 text-xs ml-auto">{item.db}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {totalCount === 0 && filterDb && (
        <div className="text-center py-12 text-gray-500">
          <FileSearch size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No indirection patterns found in {filterDb}</p>
        </div>
      )}
    </div>
  );
};

// Report Card View - Complexity Metrics
const ReportCardView = ({ analysis, data }) => {
  const [filterDb, setFilterDb] = useState('');
  const metrics = analysis?.complexity;
  if (!metrics) return null;

  const dbNames = data?.databases?.map(d => d.name) || [];

  // Filter perDb data
  const filteredPerDb = filterDb ? metrics.perDb?.filter(d => d.name === filterDb) : metrics.perDb;

  // Recalculate totals when filtering
  const displayTotals = filterDb && filteredPerDb?.length === 1 ? {
    tables: filteredPerDb[0].tables,
    fields: filteredPerDb[0].fields,
    calcFields: filteredPerDb[0].calcFields,
    tableOccurrences: filteredPerDb[0].tos,
    relationships: filteredPerDb[0].rels,
    layouts: filteredPerDb[0].layouts,
    scripts: filteredPerDb[0].scripts,
    scriptSteps: filteredPerDb[0].scriptSteps,
  } : metrics.totals;

  // Calculate complexity score - recalculate when filtering by DB
  const { score, level, factors } = useMemo(() => {
    const totals = displayTotals;
    let calcScore = 0;
    const calcFactors = [];

    // Factor: Number of tables (0-15 points)
    const tableFactor = Math.min(totals.tables / 50, 1) * 15;
    calcScore += tableFactor;
    if (totals.tables > 30) calcFactors.push(`${totals.tables} tables`);

    // Factor: Number of fields (0-15 points)
    const fieldFactor = Math.min(totals.fields / 500, 1) * 15;
    calcScore += fieldFactor;
    if (totals.fields > 300) calcFactors.push(`${totals.fields} fields`);

    // Factor: Number of scripts (0-20 points)
    const scriptFactor = Math.min(totals.scripts / 200, 1) * 20;
    calcScore += scriptFactor;
    if (totals.scripts > 100) calcFactors.push(`${totals.scripts} scripts`);

    // Factor: Script complexity (0-15 points)
    const avgSteps = totals.scripts > 0 ? totals.scriptSteps / totals.scripts : 0;
    const stepFactor = Math.min(avgSteps / 50, 1) * 15;
    calcScore += stepFactor;
    if (avgSteps > 30) calcFactors.push(`${Math.round(avgSteps)} avg steps/script`);

    // Factor: Relationships (0-10 points)
    const relFactor = Math.min(totals.relationships / 100, 1) * 10;
    calcScore += relFactor;
    if (totals.relationships > 50) calcFactors.push(`${totals.relationships} relationships`);

    // Factor: TOs (0-10 points)
    const toFactor = Math.min(totals.tableOccurrences / 100, 1) * 10;
    calcScore += toFactor;
    if (totals.tableOccurrences > 50) calcFactors.push(`${totals.tableOccurrences} TOs`);

    // Factor: Calc fields ratio (0-10 points)
    const calcRatio = totals.fields > 0 ? totals.calcFields / totals.fields : 0;
    const calcFieldFactor = Math.min(calcRatio / 0.5, 1) * 10;
    calcScore += calcFieldFactor;
    if (calcRatio > 0.3) calcFactors.push(`${Math.round(calcRatio * 100)}% calc fields`);

    // Factor: Multi-file (0-5 points) - only when not filtering
    if (!filterDb && data?.databases?.length > 1) {
      calcScore += Math.min(data.databases.length, 5);
      calcFactors.push(`${data.databases.length} files`);
    }

    const finalScore = Math.round(calcScore);
    let calcLevel = 'Simple';
    if (finalScore >= 25 && finalScore < 50) calcLevel = 'Moderate';
    else if (finalScore >= 50 && finalScore < 75) calcLevel = 'Complex';
    else if (finalScore >= 75) calcLevel = 'Very Complex';

    return { score: finalScore, level: calcLevel, factors: calcFactors };
  }, [displayTotals, filterDb, data?.databases?.length]);

  const scoreColor = score < 25 ? 'text-green-500' : score < 50 ? 'text-yellow-500' : score < 75 ? 'text-orange-500' : 'text-red-500';
  const scoreBg = score < 25 ? 'from-green-500 to-emerald-500' : score < 50 ? 'from-yellow-500 to-amber-500' : score < 75 ? 'from-orange-500 to-red-500' : 'from-red-500 to-pink-500';

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
          <Gauge size={24} className="text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-800">Report Card</h2>
          <p className="text-sm text-gray-500">Solution complexity analysis</p>
        </div>
        {dbNames.length > 1 && (
          <select
            value={filterDb}
            onChange={e => setFilterDb(e.target.value)}
            className="text-sm bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="">All Databases</option>
            {dbNames.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
        )}
      </div>

      {/* Complexity Score */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
        <div className="flex items-center gap-8">
          <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${scoreBg} flex items-center justify-center shadow-lg`}>
            <div className="text-center text-white">
              <div className="text-4xl font-bold">{score}</div>
              <div className="text-xs opacity-80">/ 100</div>
            </div>
          </div>
          <div className="flex-1">
            <div className={`text-2xl font-bold ${scoreColor}`}>{level}</div>
            <p className="text-gray-500 mt-1">Complexity Level</p>
            {factors?.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Contributing factors:</p>
                <div className="flex flex-wrap gap-2">
                  {factors.map((f, i) => (
                    <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{f}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Totals Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Tables', value: displayTotals.tables, color: 'table' },
          { label: 'Fields', value: displayTotals.fields, color: 'field' },
          { label: 'Calc Fields', value: displayTotals.calcFields, color: 'cf' },
          { label: 'Table Occurrences', value: displayTotals.tableOccurrences, color: 'to' },
          { label: 'Relationships', value: displayTotals.relationships, color: 'rel' },
          { label: 'Layouts', value: displayTotals.layouts, color: 'layout' },
          { label: 'Scripts', value: displayTotals.scripts, color: 'script' },
          { label: 'Script Steps', value: displayTotals.scriptSteps, color: 'script' },
        ].map(m => (
          <div key={m.label} className={`${C[m.color].light} ${C[m.color].border} border rounded-xl p-4 shadow-sm`}>
            <div className={`text-2xl font-bold ${C[m.color].text}`}>{(m.value || 0).toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-1">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Per-Database Breakdown */}
      {!filterDb && metrics.perDb?.length > 1 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 font-medium text-gray-700">
            Per-Database Breakdown
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 font-medium text-gray-700">Database</th>
                <th className="text-right p-3 font-medium text-gray-700">Tables</th>
                <th className="text-right p-3 font-medium text-gray-700">Fields</th>
                <th className="text-right p-3 font-medium text-gray-700">TOs</th>
                <th className="text-right p-3 font-medium text-gray-700">Scripts</th>
                <th className="text-right p-3 font-medium text-gray-700">Avg Steps</th>
              </tr>
            </thead>
            <tbody>
              {metrics.perDb.map((db, i) => (
                <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-800">{db.name}</td>
                  <td className="p-3 text-right text-gray-600">{db.tables}</td>
                  <td className="p-3 text-right text-gray-600">{db.fields}</td>
                  <td className="p-3 text-right text-gray-600">{db.tos}</td>
                  <td className="p-3 text-right text-gray-600">{db.scripts}</td>
                  <td className="p-3 text-right text-gray-600">{db.avgStepsPerScript}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Field Usage View - Enhanced field analysis
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
          <h2 className="text-xl font-bold text-gray-800">Field Usage Analysis</h2>
          <p className="text-sm text-gray-500">
            {fieldUsage.summary.total.toLocaleString()} fields · {fieldUsage.summary.unused} unused · {fieldUsage.summary.calculated} calculated
          </p>
        </div>
        <div className="flex gap-2">
          {dbNames.length > 1 && (
            <select
              value={filterDb}
              onChange={e => { setFilterDb(e.target.value); setFilterTable(''); }}
              className="text-sm bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="">All Databases</option>
              {dbNames.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          )}
          {tables.length > 0 && (
            <select
              value={filterTable}
              onChange={e => setFilterTable(e.target.value)}
              className="text-sm bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 max-w-48"
            >
              <option value="">All Tables</option>
              {tables.map(name => <option key={name} value={name.includes('::') ? name.split('::')[1] : name}>{name}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Trash2 size={16} className="text-red-500" />
            <span className="text-sm font-medium text-red-700">Unused</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{filteredUnused.length}</div>
          <p className="text-xs text-red-500 mt-1">Not referenced anywhere</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={16} className="text-amber-500" />
            <span className="text-sm font-medium text-amber-700">Rarely Used</span>
          </div>
          <div className="text-2xl font-bold text-amber-600">{filteredRarelyUsed.length}</div>
          <p className="text-xs text-amber-500 mt-1">1 reference only</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={16} className="text-blue-500" />
            <span className="text-sm font-medium text-blue-700">Moderate</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{filteredModerate.length}</div>
          <p className="text-xs text-blue-500 mt-1">2-5 references</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-emerald-500" />
            <span className="text-sm font-medium text-emerald-700">Heavy Use</span>
          </div>
          <div className="text-2xl font-bold text-emerald-600">{filteredHeavy.length}</div>
          <p className="text-xs text-emerald-500 mt-1">6+ references</p>
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
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
            style={tab === t.id ? { backgroundColor: t.color === 'red' ? '#ef4444' : t.color === 'amber' ? '#f59e0b' : t.color === 'blue' ? '#3b82f6' : '#10b981' } : {}}
          >
            {t.label}
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${tab === t.id ? 'bg-white/20' : 'bg-gray-100'}`}>
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
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
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
          <div key={tableKey} className="border-b border-gray-100 last:border-0">
            <div className="bg-gray-50 px-4 py-2 flex items-center gap-2">
              <Table size={14} className="text-blue-500" />
              <span className="text-sm font-medium text-gray-700">{tableKey}</span>
              <span className="text-xs text-gray-400">({tableFields.length} fields)</span>
            </div>
            {tableFields.map((field, i) => (
              <div key={i} className="border-t border-gray-100 first:border-0">
                <div
                  className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setExpanded(expanded === `${tableKey}::${field.name}` ? null : `${tableKey}::${field.name}`)}
                >
                  <Grid3X3 size={14} className="text-cyan-500 flex-shrink-0" />
                  <span className="font-mono text-sm text-gray-700 flex-1">{field.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${dtColors[field.dataType] || 'bg-gray-100 text-gray-600'}`}>
                    {field.dataType}
                  </span>
                  {field.isCalculated && <Badge color="cf" size="xs">Calc</Badge>}
                  {field.isGlobal && <Badge color="ext" size="xs">Global</Badge>}
                  {field.refCount > 0 && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{field.refCount} refs</span>
                  )}
                  <ChevronRight size={14} className={`text-gray-400 transition-transform ${expanded === `${tableKey}::${field.name}` ? 'rotate-90' : ''}`} />
                </div>
                {expanded === `${tableKey}::${field.name}` && (
                  <div className="px-4 pb-3 bg-gray-50 space-y-2">
                    {field.references.scripts.length > 0 && (
                      <div>
                        <div className="text-[10px] font-medium text-gray-500 mb-1.5 uppercase">In {field.references.scripts.length} Script(s)</div>
                        <div className="flex flex-wrap gap-1.5">
                          {field.references.scripts.slice(0, 10).map((ref, j) => (
                            <NavLink key={j} type="script" name={ref.script} small onClick={() => onNav('script', ref.script, ref.db)} />
                          ))}
                          {field.references.scripts.length > 10 && <span className="text-xs text-gray-500">+{field.references.scripts.length - 10} more</span>}
                        </div>
                      </div>
                    )}
                    {field.references.layouts.length > 0 && (
                      <div>
                        <div className="text-[10px] font-medium text-gray-500 mb-1.5 uppercase">On {field.references.layouts.length} Layout(s)</div>
                        <div className="flex flex-wrap gap-1.5">
                          {field.references.layouts.slice(0, 10).map((ref, j) => (
                            <NavLink key={j} type="layout" name={ref.layout} small onClick={() => onNav('layout', ref.layout, ref.db)} />
                          ))}
                          {field.references.layouts.length > 10 && <span className="text-xs text-gray-500">+{field.references.layouts.length - 10} more</span>}
                        </div>
                      </div>
                    )}
                    {field.references.calcs.length > 0 && (
                      <div>
                        <div className="text-[10px] font-medium text-gray-500 mb-1.5 uppercase">In {field.references.calcs.length} Calculation(s)</div>
                        <div className="flex flex-wrap gap-1.5">
                          {field.references.calcs.slice(0, 10).map((ref, j) => (
                            <span key={j} className="text-[10px] bg-cyan-100 text-cyan-700 px-2 py-1 rounded-full border border-cyan-200">{ref.table}.{ref.field}</span>
                          ))}
                          {field.references.calcs.length > 10 && <span className="text-xs text-gray-500">+{field.references.calcs.length - 10} more</span>}
                        </div>
                      </div>
                    )}
                    {field.references.scripts.length === 0 && field.references.layouts.length === 0 && field.references.calcs.length === 0 && (
                      <p className="text-xs text-gray-500 italic">No references found</p>
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

// Performance Hints View
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
          <h2 className="text-xl font-bold text-gray-800">Performance Hints</h2>
          <p className="text-sm text-gray-500">
            {totalIssues} potential performance concerns identified
          </p>
        </div>
        {dbNames.length > 1 && (
          <select
            value={filterDb}
            onChange={e => setFilterDb(e.target.value)}
            className="text-sm bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="">All Databases</option>
            {dbNames.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-orange-500" />
            <span className="text-xs font-medium text-orange-700">Unstored Calcs</span>
          </div>
          <div className="text-2xl font-bold text-orange-600">{filteredCalcs.length}</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Table size={16} className="text-purple-500" />
            <span className="text-xs font-medium text-purple-700">Wide Tables</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">{filteredWide.length}</div>
        </div>
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Code size={16} className="text-rose-500" />
            <span className="text-xs font-medium text-rose-700">Large Scripts</span>
          </div>
          <div className="text-2xl font-bold text-rose-600">{filteredLarge.length}</div>
        </div>
        <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Box size={16} className="text-pink-500" />
            <span className="text-xs font-medium text-pink-700">Containers</span>
          </div>
          <div className="text-2xl font-bold text-pink-600">{filteredContainers.length}</div>
        </div>
        <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-cyan-500" />
            <span className="text-xs font-medium text-cyan-700">Global Fields</span>
          </div>
          <div className="text-2xl font-bold text-cyan-600">{filteredGlobals.length}</div>
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
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <t.icon size={14} />
            {t.label}
            {t.count !== undefined && (
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${tab === t.id ? 'bg-white/20' : 'bg-gray-100'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">Performance Overview</h3>
            <div className="space-y-3 text-sm text-gray-600">
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
      <div className="text-center py-12 text-gray-500">
        <Activity size={48} className="mx-auto mb-4 text-green-300" />
        <p className="text-green-600 font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="max-h-96 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {columns.map(c => (
                <th key={c} className="text-left p-3 font-medium text-gray-700 capitalize">{c === 'db' ? 'Database' : c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className={`border-t border-gray-100 hover:bg-gray-50 ${item.severity === 'high' ? 'bg-red-50/50' : ''}`}>
                {columns.map(c => (
                  <td key={c} className="p-3">
                    {c === 'name' && type === 'script' ? (
                      <NavLink type="script" name={item.name} onClick={() => onNav('script', item.name, item.db)} />
                    ) : customRender ? (
                      <span className="text-gray-600">{customRender(item, c) || '-'}</span>
                    ) : (
                      <span className="text-gray-600">{item[c] || '-'}</span>
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

// ERD View - Entity Relationship Diagram
const ERDView = ({ data, onNav }) => {
  const [selectedDb, setSelectedDb] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [focusedTO, setFocusedTO] = useState(null);
  const [baseTableFilter, setBaseTableFilter] = useState('');
  const [viewMode, setViewMode] = useState('graph'); // 'graph' or 'list'
  const svgRef = useRef(null);

  const db = data?.databases?.[selectedDb];
  const tos = db?.tableOccurrences || [];
  const rels = db?.relationships || [];

  // Get unique base tables for filtering
  const baseTables = useMemo(() => {
    const tables = [...new Set(tos.map(to => to.baseTable))].sort();
    return tables;
  }, [tos]);

  // Build adjacency map for focus mode
  const adjacency = useMemo(() => {
    const adj = {};
    rels.forEach(rel => {
      if (!adj[rel.leftTable]) adj[rel.leftTable] = new Set();
      if (!adj[rel.rightTable]) adj[rel.rightTable] = new Set();
      adj[rel.leftTable].add(rel.rightTable);
      adj[rel.rightTable].add(rel.leftTable);
    });
    return adj;
  }, [rels]);

  // Filter TOs based on base table filter and focus mode
  const filteredTOs = useMemo(() => {
    let filtered = tos;

    // Apply base table filter
    if (baseTableFilter) {
      filtered = filtered.filter(to => to.baseTable === baseTableFilter);
    }

    // Apply focus mode - show only focused TO and its direct connections
    if (focusedTO && !baseTableFilter) {
      const connected = adjacency[focusedTO] || new Set();
      filtered = filtered.filter(to => to.name === focusedTO || connected.has(to.name));
    }

    return filtered;
  }, [tos, baseTableFilter, focusedTO, adjacency]);

  // Filter relationships based on visible TOs
  const filteredRels = useMemo(() => {
    const visibleTONames = new Set(filteredTOs.map(to => to.name));
    return rels.filter(rel => visibleTONames.has(rel.leftTable) && visibleTONames.has(rel.rightTable));
  }, [rels, filteredTOs]);

  // Generate layout for TOs
  const layout = useMemo(() => {
    if (filteredTOs.length === 0) return { nodes: [], edges: [], width: 400, height: 400, baseTableColors: {} };

    // Group TOs by base table for coloring
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

    const NODE_WIDTH = 140;
    const NODE_HEIGHT = 40;
    const PADDING = 60;
    const COLS = Math.max(1, Math.ceil(Math.sqrt(filteredTOs.length)));

    // Sort TOs to keep related ones closer
    const sortedTOs = [...filteredTOs].sort((a, b) => {
      const aConnections = (adjacency[a.name]?.size || 0);
      const bConnections = (adjacency[b.name]?.size || 0);
      return bConnections - aConnections;
    });

    const nodes = sortedTOs.map((to, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      return {
        id: to.name,
        to,
        x: col * (NODE_WIDTH + PADDING) + PADDING,
        y: row * (NODE_HEIGHT + PADDING) + PADDING,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        color: baseTableColors[to.baseTable] || '#6b7280',
        baseTable: to.baseTable,
        external: to.externalFile,
        connectionCount: adjacency[to.name]?.size || 0,
      };
    });

    const nodeMap = {};
    nodes.forEach(n => nodeMap[n.id] = n);

    const edges = filteredRels.map((rel, i) => {
      const source = nodeMap[rel.leftTable];
      const target = nodeMap[rel.rightTable];
      if (!source || !target) return null;

      const angle = Math.atan2(
        (target.y + target.height / 2) - (source.y + source.height / 2),
        (target.x + target.width / 2) - (source.x + source.width / 2)
      );
      const startX = source.x + source.width / 2 + Math.cos(angle) * (source.width / 2);
      const startY = source.y + source.height / 2 + Math.sin(angle) * (source.height / 2);
      const endX = target.x + target.width / 2 - Math.cos(angle) * (target.width / 2);
      const endY = target.y + target.height / 2 - Math.sin(angle) * (target.height / 2);

      return {
        id: `${rel.leftTable}-${rel.rightTable}-${i}`,
        rel,
        source: rel.leftTable,
        target: rel.rightTable,
        startX,
        startY,
        endX,
        endY,
        predicates: rel.predicates,
      };
    }).filter(Boolean);

    const maxX = nodes.length > 0 ? Math.max(...nodes.map(n => n.x + n.width)) + PADDING : 400;
    const maxY = nodes.length > 0 ? Math.max(...nodes.map(n => n.y + n.height)) + PADDING : 400;

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

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.max(0.2, Math.min(3, z * delta)));
  };

  const handleNodeClick = (node) => {
    if (focusedTO === node.id) {
      // Click focused node again to clear focus
      setFocusedTO(null);
    } else {
      setFocusedTO(node.id);
      setPan({ x: 0, y: 0 });
      setZoom(1);
    }
  };

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

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3 flex-wrap">
        <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
          <GitBranch size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-gray-800">Entity Relationship Diagram</h2>
          <p className="text-sm text-gray-500">
            {filteredTOs.length}/{tos.length} TOs · {filteredRels.length}/{rels.length} relationships
            {focusedTO && <span className="text-violet-600"> · Focus: {focusedTO}</span>}
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('graph')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'graph' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Graph
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
          >
            List
          </button>
        </div>

        {/* Base table filter */}
        <select
          value={baseTableFilter}
          onChange={e => { setBaseTableFilter(e.target.value); setFocusedTO(null); }}
          className="text-sm bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
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
            className="text-sm bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            {data.databases.map((d, i) => <option key={i} value={i}>{d.name}</option>)}
          </select>
        )}

        {(focusedTO || baseTableFilter) && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 text-sm rounded-lg hover:bg-red-100 transition-colors"
          >
            <X size={14} />
            Clear
          </button>
        )}
      </div>

      {/* Zoom controls - only for graph view */}
      {viewMode === 'graph' && (
        <div className="bg-white border-b border-gray-200 px-6 py-2 flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="px-3 py-1 text-gray-600 hover:bg-white rounded-md">-</button>
            <span className="text-sm text-gray-600 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="px-3 py-1 text-gray-600 hover:bg-white rounded-md">+</button>
            <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="px-3 py-1 text-gray-600 hover:bg-white rounded-md text-xs">Reset</button>
          </div>

          <span className="text-xs text-gray-500">Click a TO to focus on its connections. Click again to unfocus.</span>

          <div className="flex items-center gap-3 ml-auto flex-wrap">
            <span className="text-xs text-gray-500 font-medium">Legend:</span>
            {Object.entries(layout.baseTableColors || {}).slice(0, 8).map(([table, color]) => (
              <button
                key={table}
                onClick={() => { setBaseTableFilter(table); setFocusedTO(null); }}
                className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
              >
                <div className="w-3 h-3 rounded" style={{ backgroundColor: color }}></div>
                <span className="text-xs text-gray-600">{table}</span>
              </button>
            ))}
            {Object.keys(layout.baseTableColors || {}).length > 8 && (
              <span className="text-xs text-gray-400">+{Object.keys(layout.baseTableColors).length - 8} more</span>
            )}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' ? (
        <div className="flex-1 overflow-auto bg-gray-50 p-4">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-700">Table Occurrence</th>
                  <th className="text-left p-3 font-medium text-gray-700">Base Table</th>
                  <th className="text-left p-3 font-medium text-gray-700">Connections</th>
                  <th className="text-left p-3 font-medium text-gray-700">External</th>
                  <th className="text-left p-3 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTOs.map((to, i) => {
                  const connections = adjacency[to.name]?.size || 0;
                  const color = layout.baseTableColors[to.baseTable] || '#6b7280';
                  return (
                    <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: color }}></div>
                          <NavLink type="to" name={to.name} onClick={() => onNav('to', to.name, db.name)} />
                        </div>
                      </td>
                      <td className="p-3 text-gray-600">{to.baseTable}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${connections > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
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
                          className="text-xs text-violet-600 hover:text-violet-800"
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

          {/* Relationships list */}
          {filteredRels.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mt-4">
              <div className="bg-pink-50 px-4 py-2 border-b border-pink-100">
                <span className="font-medium text-pink-700 text-sm">Relationships ({filteredRels.length})</span>
              </div>
              <div className="max-h-64 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left p-3 font-medium text-gray-700">Left TO</th>
                      <th className="text-left p-3 font-medium text-gray-700">Predicate</th>
                      <th className="text-left p-3 font-medium text-gray-700">Right TO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRels.map((rel, i) => (
                      <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="p-3">
                          <NavLink type="to" name={rel.leftTable} small onClick={() => onNav('to', rel.leftTable, db.name)} />
                        </td>
                        <td className="p-3 text-center text-gray-500">
                          {rel.predicates?.map((p, j) => (
                            <span key={j} className="text-xs bg-gray-100 px-2 py-0.5 rounded mx-0.5">
                              {p.leftField} {p.type === 'Equal' ? '=' : p.type} {p.rightField}
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
            className="flex-1 overflow-hidden bg-gray-50 cursor-grab"
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
              style={{ minWidth: layout.width * zoom, minHeight: layout.height * zoom }}
            >
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                <rect className="bg-rect" x="0" y="0" width={layout.width} height={layout.height} fill="#f9fafb" />

                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1" />
                  </pattern>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#9ca3af" />
                  </marker>
                  <marker id="arrowhead-highlight" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#8b5cf6" />
                  </marker>
                </defs>
                <rect x="0" y="0" width={layout.width} height={layout.height} fill="url(#grid)" />

                {/* Edges */}
                {layout.edges.map(edge => {
                  const isHighlighted = focusedTO && (edge.source === focusedTO || edge.target === focusedTO);
                  return (
                    <g key={edge.id}>
                      <line
                        x1={edge.startX}
                        y1={edge.startY}
                        x2={edge.endX}
                        y2={edge.endY}
                        stroke={isHighlighted ? '#8b5cf6' : '#9ca3af'}
                        strokeWidth={isHighlighted ? 3 : 2}
                        markerEnd={isHighlighted ? 'url(#arrowhead-highlight)' : 'url(#arrowhead)'}
                        className="transition-all"
                      />
                      {edge.predicates?.length > 0 && (
                        <text
                          x={(edge.startX + edge.endX) / 2}
                          y={(edge.startY + edge.endY) / 2 - 5}
                          fontSize="9"
                          fill={isHighlighted ? '#8b5cf6' : '#6b7280'}
                          textAnchor="middle"
                          className="pointer-events-none"
                        >
                          {edge.predicates[0].type === 'Equal' ? '=' : edge.predicates[0].type}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Nodes */}
                {layout.nodes.map(node => {
                  const isFocused = focusedTO === node.id;
                  const isConnected = focusedTO && adjacency[focusedTO]?.has(node.id);
                  const opacity = focusedTO ? (isFocused || isConnected ? 1 : 0.4) : 1;

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                      className="cursor-pointer"
                      onClick={() => handleNodeClick(node)}
                      style={{ opacity }}
                    >
                      <rect
                        width={node.width}
                        height={node.height}
                        rx="6"
                        fill={isFocused ? '#1f2937' : 'white'}
                        stroke={isFocused ? '#8b5cf6' : node.color}
                        strokeWidth={isFocused ? 3 : 2}
                        className="transition-all"
                      />
                      {node.external && (
                        <rect x={node.width - 18} y={2} width="16" height="12" rx="2" fill="#ef4444" />
                      )}
                      <text
                        x={node.width / 2}
                        y={node.height / 2 + 4}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="500"
                        fill={isFocused ? 'white' : '#374151'}
                        className="pointer-events-none"
                      >
                        {node.id.length > 16 ? node.id.slice(0, 14) + '...' : node.id}
                      </text>
                      {/* Connection count badge */}
                      {node.connectionCount > 0 && (
                        <g transform={`translate(${node.width - 8}, -8)`}>
                          <circle r="8" fill={node.color} />
                          <text x="0" y="3" textAnchor="middle" fontSize="8" fill="white" fontWeight="600">
                            {node.connectionCount}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>

          {/* Selected TO Info */}
          {focusedTO && (
            <div className="bg-white border-t border-gray-200 px-6 py-3 flex items-center gap-4">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: layout.baseTableColors[layout.nodes.find(n => n.id === focusedTO)?.baseTable] }}></div>
              <div className="flex-1">
                <span className="font-medium text-gray-800">{focusedTO}</span>
                <span className="text-gray-400 mx-2">→</span>
                <span className="text-gray-600">{layout.nodes.find(n => n.id === focusedTO)?.baseTable}</span>
                <span className="text-violet-500 ml-4 text-sm">{adjacency[focusedTO]?.size || 0} connections</span>
              </div>
              <button
                onClick={() => setFocusedTO(null)}
                className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 transition-colors"
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

// Script Dependency Graph View
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
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3 flex-wrap">
        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
          <Code size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-gray-800">Script Dependencies</h2>
          <p className="text-sm text-gray-500">
            {scripts.length} scripts · {entryPointCount} entry points · {orphanCount} potentially unused
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode('graph')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'graph' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Graph
          </button>
        </div>

        {data.databases.length > 1 && (
          <select
            value={selectedDb}
            onChange={e => setSelectedDb(Number(e.target.value))}
            className="text-sm bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            {data.databases.map((d, i) => <option key={i} value={i}>{d.name}</option>)}
          </select>
        )}

        {viewMode === 'graph' && (
          <>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showOrphans}
                onChange={e => setShowOrphans(e.target.checked)}
                className="rounded border-gray-300"
              />
              Show Unused ({orphanCount})
            </label>

            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="px-3 py-1 text-gray-600 hover:bg-white rounded-md">-</button>
              <span className="text-sm text-gray-600 w-12 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="px-3 py-1 text-gray-600 hover:bg-white rounded-md">+</button>
              <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="px-3 py-1 text-gray-600 hover:bg-white rounded-md text-xs">Reset</button>
            </div>
          </>
        )}
      </div>

      {/* List View */}
      {viewMode === 'list' ? (
        <div className="flex-1 overflow-auto bg-gray-50 p-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-sm text-amber-800">
            <strong>Note:</strong> "Potentially unused" scripts have no detected callers within this file and are not on any layout triggers.
            They may still be called from other files, startup scripts, or custom menus not captured in the DDR.
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-700">Script</th>
                  <th className="text-left p-3 font-medium text-gray-700">Folder</th>
                  <th className="text-center p-3 font-medium text-gray-700">On Layouts</th>
                  <th className="text-center p-3 font-medium text-gray-700">Called By</th>
                  <th className="text-center p-3 font-medium text-gray-700">X-File</th>
                  <th className="text-center p-3 font-medium text-gray-700">Calls</th>
                  <th className="text-left p-3 font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {scriptList.map((script, i) => (
                  <tr key={i} className={`border-t border-gray-100 hover:bg-gray-50 ${script.isOrphan ? 'bg-red-50/30' : ''}`}>
                    <td className="p-3">
                      <NavLink type="script" name={script.name} onClick={() => onNav('script', script.name, db.name)} />
                    </td>
                    <td className="p-3 text-gray-500 text-xs">{script.folder || '-'}</td>
                    <td className="p-3 text-center">
                      {script.layoutCount > 0 ? (
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs">{script.layoutCount}</span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {script.callerCount > 0 ? (
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">{script.callerCount}</span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {script.crossFileCount > 0 ? (
                        <span className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full text-xs">{script.crossFileCount}</span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {script.callCount > 0 || script.externalCallCount > 0 ? (
                        <span className="text-gray-600 text-xs">
                          {script.callCount}{script.externalCallCount > 0 && <span className="text-red-500">+{script.externalCallCount}</span>}
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      {script.isRoot ? (
                        <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-medium">Entry Point</span>
                      ) : script.isOrphan ? (
                        <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">Unused?</span>
                      ) : (
                        <span className="text-green-600 text-xs">Referenced</span>
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
          <div className="bg-white border-b border-gray-200 px-6 py-2 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-r from-amber-500 to-orange-500"></div>
              <span className="text-xs text-gray-600">Entry Point (on layout/trigger)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-white border-2 border-amber-500"></div>
              <span className="text-xs text-gray-600">Regular Script</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-100 border-2 border-red-400"></div>
              <span className="text-xs text-gray-600">Potentially Unused</span>
            </div>
          </div>

          {/* SVG Canvas */}
          <div
            className="flex-1 overflow-hidden bg-gray-50 cursor-grab"
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
            <div className="bg-white border-t border-gray-200 px-6 py-3 flex items-center gap-4">
              <Code size={16} className="text-amber-500" />
              <div className="flex-1">
                <span className="font-medium text-gray-800">{selectedScript.id}</span>
                {selectedScript.isOrphan && <Badge color="ext" size="xs" className="ml-2">Unused?</Badge>}
                {selectedScript.isRoot && <Badge color="script" size="xs" className="ml-2">Entry Point</Badge>}
                <span className="text-gray-400 mx-2">·</span>
                <span className="text-sm text-gray-500">Calls {selectedScript.callCount} · Called by {selectedScript.callerCount}</span>
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

// Search history hook
const useSearchHistory = (maxItems = 10) => {
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('ddr-search-history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addToHistory = useCallback((query) => {
    if (!query || query.length < 2) return;
    setHistory(prev => {
      const filtered = prev.filter(q => q.toLowerCase() !== query.toLowerCase());
      const newHistory = [query, ...filtered].slice(0, maxItems);
      try {
        localStorage.setItem('ddr-search-history', JSON.stringify(newHistory));
      } catch {}
      return newHistory;
    });
  }, [maxItems]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem('ddr-search-history');
    } catch {}
  }, []);

  const removeFromHistory = useCallback((query) => {
    setHistory(prev => {
      const newHistory = prev.filter(q => q !== query);
      try {
        localStorage.setItem('ddr-search-history', JSON.stringify(newHistory));
      } catch {}
      return newHistory;
    });
  }, []);

  return { history, addToHistory, clearHistory, removeFromHistory };
};

// Global Search View
const GlobalSearchView = ({ data, onNav }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const { history, addToHistory, clearHistory, removeFromHistory } = useSearchHistory();

  const performSearch = useCallback((searchQuery) => {
    const q = (searchQuery || query).trim().toLowerCase();
    if (!q || q.length < 2) {
      setResults(null);
      return;
    }

    // Add to history
    addToHistory(searchQuery || query);
    const found = {
      tables: [],
      fields: [],
      scripts: [],
      layouts: [],
      tos: [],
      valueLists: [],
      customFunctions: [],
    };

    for (const db of data.databases) {
      // Tables and fields
      for (const table of db.tables || []) {
        if (table.name.toLowerCase().includes(q)) {
          found.tables.push({ ...table, db: db.name });
        }
        for (const field of table.fields || []) {
          if (field.name.toLowerCase().includes(q) || field.calcText?.toLowerCase().includes(q)) {
            found.fields.push({ ...field, table: table.name, db: db.name });
          }
        }
      }

      // Scripts
      for (const script of db.scripts || []) {
        if (script.name.toLowerCase().includes(q)) {
          found.scripts.push({ ...script, db: db.name });
        }
      }

      // Layouts
      for (const layout of db.layouts || []) {
        if (layout.name.toLowerCase().includes(q)) {
          found.layouts.push({ ...layout, db: db.name });
        }
      }

      // TOs
      for (const to of db.tableOccurrences || []) {
        if (to.name.toLowerCase().includes(q)) {
          found.tos.push({ ...to, db: db.name });
        }
      }

      // Value Lists
      for (const vl of db.valueLists || []) {
        if (vl.name.toLowerCase().includes(q)) {
          found.valueLists.push({ ...vl, db: db.name });
        }
      }

      // Custom Functions
      for (const cf of db.customFunctions || []) {
        if (cf.name.toLowerCase().includes(q) || cf.calculation?.toLowerCase().includes(q)) {
          found.customFunctions.push({ ...cf, db: db.name });
        }
      }
    }

    setResults(found);
  }, [query, data, addToHistory]);

  const handleHistoryClick = (historyQuery) => {
    setQuery(historyQuery);
    performSearch(historyQuery);
  };

  const totalResults = results ? Object.values(results).reduce((sum, arr) => sum + arr.length, 0) : 0;

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
          <Search size={24} className="text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-800">Global Search</h2>
          <p className="text-sm text-gray-500">Search across all databases, tables, fields, scripts, and more</p>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search everything..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && performSearch()}
            className="w-full pl-12 pr-4 py-3 text-sm bg-white border border-gray-300 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
          />
        </div>
        <button
          onClick={() => performSearch()}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
        >
          Search
        </button>
      </div>

      {/* Search History */}
      {history.length > 0 && !results && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase">Recent Searches</span>
            <button onClick={clearHistory} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
              Clear History
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {history.map((h, i) => (
              <div key={i} className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg pr-1 group">
                <button
                  onClick={() => handleHistoryClick(h)}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  {h}
                </button>
                <button
                  onClick={() => removeFromHistory(h)}
                  className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {results && (
        <div className="space-y-4">
          <div className="text-sm text-gray-500 mb-4">
            Found {totalResults} result{totalResults !== 1 ? 's' : ''} for "{query}"
          </div>

          {results.tables.length > 0 && (
            <SearchResultSection title="Tables" items={results.tables} type="table" onNav={onNav} />
          )}
          {results.fields.length > 0 && (
            <SearchResultSection title="Fields" items={results.fields} type="field" onNav={onNav} renderItem={f => `${f.table}::${f.name}`} />
          )}
          {results.scripts.length > 0 && (
            <SearchResultSection title="Scripts" items={results.scripts} type="script" onNav={onNav} />
          )}
          {results.layouts.length > 0 && (
            <SearchResultSection title="Layouts" items={results.layouts} type="layout" onNav={onNav} />
          )}
          {results.tos.length > 0 && (
            <SearchResultSection title="Table Occurrences" items={results.tos} type="to" onNav={onNav} />
          )}
          {results.valueLists.length > 0 && (
            <SearchResultSection title="Value Lists" items={results.valueLists} type="vl" onNav={onNav} />
          )}
          {results.customFunctions.length > 0 && (
            <SearchResultSection title="Custom Functions" items={results.customFunctions} type="cf" onNav={onNav} />
          )}

          {totalResults === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Search size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No results found for "{query}"</p>
            </div>
          )}
        </div>
      )}

      {!results && (
        <div className="text-center py-12 text-gray-400">
          <Search size={48} className="mx-auto mb-4 text-gray-200" />
          <p>Enter a search term and press Enter or click Search</p>
        </div>
      )}
    </div>
  );
};

const SearchResultSection = ({ title, items, type, onNav, renderItem }) => (
  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
    <div className={`${C[type].light} px-4 py-3 border-b ${C[type].border} flex items-center gap-3`}>
      <Icon type={type} size={16} className={C[type].text} />
      <span className={`font-medium ${C[type].text}`}>{title}</span>
      <Badge color={type} size="xs">{items.length}</Badge>
    </div>
    <div className="p-3 flex flex-wrap gap-2 max-h-48 overflow-auto">
      {items.slice(0, 50).map((item, i) => (
        <NavLink
          key={i}
          type={type}
          name={renderItem ? renderItem(item) : item.name}
          small
          onClick={() => onNav(type, item.name, item.db)}
        />
      ))}
      {items.length > 50 && (
        <span className="text-xs text-gray-500 self-center">+{items.length - 50} more</span>
      )}
    </div>
  </div>
);

// File upload component
const FileUploader = ({ onDataLoaded, darkMode, toggleDarkMode }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [files, setFiles] = useState([]);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
    setError(null);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const parseFiles = async () => {
    if (files.length === 0) {
      setError('Please select at least one XML file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const parsedData = await parseXMLFiles(files);
      onDataLoaded(parsedData);
    } catch (err) {
      setError(`Parse error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen py-8 px-4 overflow-auto transition-colors ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'}`}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center relative">
          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className={`absolute right-0 top-0 p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-violet-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-500/25">
            <Database size={32} className="text-white" />
          </div>
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>FileMaker DDR Explorer</h1>
          <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Analyze your Database Design Reports</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Upload Card */}
          <div className={`rounded-2xl shadow-xl p-6 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              <Upload size={20} className="text-blue-500" />
              Upload DDR Files
            </h2>

            <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all group ${darkMode ? 'border-gray-600 hover:border-blue-500 hover:bg-blue-900/20' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'}`}>
              <Upload size={32} className={`mx-auto mb-2 group-hover:text-blue-500 transition-colors ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <label className="cursor-pointer">
                <span className="text-blue-500 hover:text-blue-600 font-medium transition-colors">Choose XML files</span>
                <input
                  type="file"
                  multiple
                  accept=".xml"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>or drag and drop</p>
            </div>

            {files.length > 0 && (
              <div className="mt-4 space-y-2 max-h-40 overflow-auto">
                {files.map((file, i) => (
                  <div key={i} className={`flex items-center gap-3 rounded-lg px-3 py-2 border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                    <FileText size={16} className={darkMode ? 'text-gray-400' : 'text-gray-400'} />
                    <span className={`flex-1 text-sm truncate ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{file.name}</span>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                    <button onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600 flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button
              onClick={parseFiles}
              disabled={loading || files.length === 0}
              className={`mt-4 w-full py-3 rounded-xl font-medium transition-all ${
                loading || files.length === 0
                  ? darkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-violet-500 text-white hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Sparkles size={18} className="animate-spin" />
                  Parsing...
                </span>
              ) : 'Analyze DDR Files'}
            </button>
          </div>

          {/* About Card */}
          <div className={`rounded-2xl shadow-xl p-6 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              <Heart size={20} className="text-pink-500" />
              About This Tool
            </h2>
            <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              DDR Explorer is a <strong>non-commercial tool</strong> built just for fun by FileMaker developers
              who wanted a better way to explore and analyze Database Design Reports. It's offered freely to the
              FileMaker community with no strings attached.
            </p>
            <div className={`mt-4 p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <strong>Prefer to run it locally?</strong> Download the source code and run it yourself:
              </p>
              <a
                href="https://github.com/rulosa01/ddranalyzer"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600 font-medium"
              >
                <ExternalLink size={14} />
                github.com/rulosa01/ddranalyzer
              </a>
            </div>
          </div>
        </div>

        {/* Privacy & Disclaimer Row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Privacy Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Shield size={20} className="text-emerald-500" />
              Privacy & Data Storage
            </h2>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4">
              <p className="text-emerald-800 font-medium text-sm">Your data never leaves your browser.</p>
            </div>
            <ul className="text-gray-600 text-sm space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">✓</span>
                <span>All DDR XML files are processed <strong>entirely in your browser</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">✓</span>
                <span>No data is uploaded to any server — there is no server</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">✓</span>
                <span>No cookies, no tracking, no analytics</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">✓</span>
                <span>When you close or refresh the page, all parsed data is gone</span>
              </li>
            </ul>
          </div>

          {/* Disclaimer Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <AlertTriangle size={20} className="text-amber-500" />
              Disclaimer
            </h2>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
              <p className="mb-2">
                <strong>This tool is provided "as-is" without warranty of any kind.</strong>
              </p>
              <p>
                The authors make no guarantees about the accuracy, completeness, or reliability of the analysis
                provided. Use at your own risk. This is not affiliated with or endorsed by Claris International Inc.
                or FileMaker, Inc.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pt-4">
          Made with ❤️ for the FileMaker community
        </div>
      </div>
    </div>
  );
};

// Main app component
export default function DDRExplorer() {
  const [data, setData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [activeDb, setActiveDb] = useState(0);
  const [view, setView] = useState('explorer');
  const [category, setCategory] = useState('tables');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [sortMode, setSortMode] = useState('default'); // 'default', 'alpha', 'alpha-desc', 'id'
  const { darkMode, toggleDarkMode } = useDarkMode();

  // Compute analysis when data changes
  const handleDataLoaded = useCallback((parsedData) => {
    setData(parsedData);
    const analysisResult = analyzeDatabase(parsedData);
    setAnalysis(analysisResult);
  }, []);

  const db = data?.databases?.[activeDb];
  const reverseRefs = data?.reverseRefs || {};

  const categories = [
    { id: 'tables', label: 'Tables', icon: 'table', items: db?.tables || [] },
    { id: 'tos', label: 'TOs', icon: 'to', items: db?.tableOccurrences || [] },
    { id: 'layouts', label: 'Layouts', icon: 'layout', items: db?.layouts || [] },
    { id: 'scripts', label: 'Scripts', icon: 'script', items: db?.scripts || [] },
    { id: 'rels', label: 'Relationships', icon: 'rel', items: db?.relationships || [] },
    { id: 'vls', label: 'Value Lists', icon: 'vl', items: db?.valueLists || [] },
    { id: 'cfs', label: 'Custom Functions', icon: 'cf', items: db?.customFunctions || [] },
    { id: 'accounts', label: 'Accounts', icon: 'account', items: db?.accounts || [] },
    { id: 'privsets', label: 'Privilege Sets', icon: 'privset', items: db?.privilegeSets || [] },
    { id: 'extprivs', label: 'Ext Privileges', icon: 'extpriv', items: db?.extendedPrivileges || [] },
  ];

  const currentCat = categories.find(c => c.id === category);
  const filteredItems = useMemo(() => {
    if (!currentCat) return [];
    let items = currentCat.items.filter(item => {
      const name = item.name || item.id || '';
      return name.toLowerCase().includes(search.toLowerCase());
    });

    if (sortMode === 'alpha') {
      items = [...items].sort((a, b) => (a.name || a.id || '').localeCompare(b.name || b.id || ''));
    } else if (sortMode === 'alpha-desc') {
      items = [...items].sort((a, b) => (b.name || b.id || '').localeCompare(a.name || a.id || ''));
    } else if (sortMode === 'id') {
      items = [...items].sort((a, b) => {
        const aId = parseInt(a.id) || 0;
        const bId = parseInt(b.id) || 0;
        return aId - bId;
      });
    }

    return items;
  }, [currentCat, search, sortMode]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!filteredItems || filteredItems.length === 0) return;
    if (view !== 'explorer') return;

    const currentIndex = selected ? filteredItems.indexOf(selected) : -1;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = currentIndex < filteredItems.length - 1 ? currentIndex + 1 : 0;
      setSelected(filteredItems[nextIndex]);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : filteredItems.length - 1;
      setSelected(filteredItems[prevIndex]);
    }
  }, [filteredItems, selected, view]);

  const handleNav = useCallback((type, name, targetDb) => {
    if (targetDb && targetDb !== db?.name) {
      const idx = data.databases.findIndex(d => d.name === targetDb);
      if (idx >= 0) setActiveDb(idx);
    }
    const catMap = { table: 'tables', to: 'tos', layout: 'layouts', script: 'scripts', rel: 'rels', vl: 'vls', cf: 'cfs' };
    if (catMap[type]) {
      setCategory(catMap[type]);
      setView('explorer');
    }
    const targetDb2 = targetDb || db?.name;
    const dbData = data.databases.find(d => d.name === targetDb2);
    if (dbData) {
      const catData = {
        table: dbData.tables, to: dbData.tableOccurrences, layout: dbData.layouts,
        script: dbData.scripts, rel: dbData.relationships, vl: dbData.valueLists, cf: dbData.customFunctions
      }[type];
      const item = catData?.find(i => (i.name || i.id) === name);
      if (item) setSelected(item);
    }
  }, [data, db]);

  // Show file uploader if no data loaded
  if (!data) {
    return <FileUploader onDataLoaded={handleDataLoaded} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />;
  }

  const renderDetail = () => {
    if (!selected) return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <Eye size={48} className="mx-auto mb-3 text-gray-300" />
          <p>Select an item to view details</p>
        </div>
      </div>
    );

    if (category === 'tables') return <TableDetail table={selected} dbName={db.name} reverseRefs={reverseRefs} data={data} onNav={handleNav} />;
    if (category === 'scripts') return <ScriptDetail script={selected} dbName={db.name} reverseRefs={reverseRefs} data={data} onNav={handleNav} />;
    if (category === 'layouts') return <LayoutDetail layout={selected} dbName={db.name} reverseRefs={reverseRefs} onNav={handleNav} />;
    if (category === 'tos') return <TODetail to={selected} dbName={db.name} reverseRefs={reverseRefs} data={data} onNav={handleNav} />;
    if (category === 'rels') return <RelDetail rel={selected} dbName={db.name} onNav={handleNav} />;
    if (category === 'accounts') return <AccountDetail account={selected} dbName={db.name} data={data} />;
    if (category === 'privsets') return <PrivSetDetail privset={selected} dbName={db.name} data={data} />;
    if (category === 'extprivs') return <ExtPrivDetail extpriv={selected} dbName={db.name} data={data} />;

    return (
      <div className="p-5">
        <h2 className="font-semibold text-gray-800 mb-3">{selected.name || selected.id}</h2>
        <pre className="text-xs bg-gray-50 p-4 rounded-xl overflow-auto text-gray-600 border border-gray-200">{JSON.stringify(selected, null, 2)}</pre>
      </div>
    );
  };

  return (
    <div className={`h-screen flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`px-5 py-3 flex items-center gap-5 shadow-sm border-b ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-500 rounded-lg flex items-center justify-center">
            <Database size={16} className="text-white" />
          </div>
          <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>DDR Explorer</span>
        </div>

        <select
          value={activeDb}
          onChange={e => { setActiveDb(Number(e.target.value)); setSelected(null); }}
          className={`text-sm rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border border-gray-300 text-gray-700'}`}
        >
          {data.databases.map((d, i) => <option key={i} value={i}>{d.name}</option>)}
        </select>

        <div className={`flex gap-1 ml-auto p-1 rounded-lg overflow-x-auto ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          {[
            { id: 'explorer', label: 'Explorer' },
            { id: 'search', label: 'Search' },
            { id: 'erd', label: 'ERD' },
            { id: 'scriptgraph', label: 'Scripts' },
            { id: 'audit', label: 'Audit' },
            { id: 'reportcard', label: 'Report' },
            { id: 'crossfile', label: 'X-File' },
          ].map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                view === v.id
                  ? 'bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-lg'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Main content */}
      {view === 'search' ? (
        <div className="flex-1 overflow-auto bg-gray-50">
          <GlobalSearchView data={data} onNav={handleNav} />
        </div>
      ) : view === 'erd' ? (
        <div className="flex-1 overflow-hidden">
          <ERDView data={data} onNav={handleNav} />
        </div>
      ) : view === 'scriptgraph' ? (
        <div className="flex-1 overflow-hidden">
          <ScriptGraphView data={data} onNav={handleNav} />
        </div>
      ) : view === 'audit' ? (
        <div className="flex-1 overflow-auto bg-gray-50">
          <AuditView data={data} analysis={analysis} onNav={handleNav} />
        </div>
      ) : view === 'reportcard' ? (
        <div className="flex-1 overflow-auto bg-gray-50">
          <ReportCardView analysis={analysis} data={data} />
        </div>
      ) : view === 'crossfile' ? (
        <div className="flex-1 overflow-auto bg-gray-50">
          <CrossFileView data={data} onNav={handleNav} />
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Category nav */}
          <div className="w-44 bg-white border-r border-gray-200 p-3">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setCategory(cat.id); setSelected(null); setSearch(''); }}
                className={`w-full text-left px-3 py-2.5 rounded-xl mb-1 flex items-center gap-3 text-sm transition-all ${
                  category === cat.id
                    ? `${C[cat.icon].bg} text-white shadow-lg`
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }`}
              >
                <Icon type={cat.icon} size={16} />
                <span className="flex-1">{cat.label}</span>
                <span className={`text-xs ${category === cat.id ? 'text-white/70' : 'text-gray-400'}`}>{cat.items.length}</span>
              </button>
            ))}
          </div>

          {/* Item list */}
          <div
            className="w-72 bg-gray-50 border-r border-gray-200 flex flex-col"
            tabIndex={0}
            onKeyDown={handleKeyDown}
          >
            <div className="p-3 border-b border-gray-200 space-y-2">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${currentCat?.label || ''}...`}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-white border border-gray-300 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div className="flex gap-1">
                {[
                  { id: 'default', label: 'Default', icon: List },
                  { id: 'alpha', label: 'A-Z', icon: ArrowDownAZ },
                  { id: 'alpha-desc', label: 'Z-A', icon: ArrowUpAZ },
                  { id: 'id', label: 'ID', icon: Hash },
                ].map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSortMode(s.id)}
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                      sortMode === s.id
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-100'
                    }`}
                    title={`Sort by ${s.label}`}
                  >
                    <s.icon size={12} />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              {filteredItems.map((item, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(item)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-200/50 flex items-center gap-3 text-sm transition-all ${
                    selected === item
                      ? 'bg-blue-50 text-blue-600 border-l-2 border-l-blue-500'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800 border-l-2 border-l-transparent'
                  }`}
                >
                  <Icon type={currentCat?.icon} size={14} className={selected === item ? 'text-blue-500' : 'text-gray-400'} />
                  <span className="truncate">{item.name || item.id}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Detail panel */}
          <div className="flex-1 overflow-hidden bg-white">
            {renderDetail()}
          </div>
        </div>
      )}
    </div>
  );
}

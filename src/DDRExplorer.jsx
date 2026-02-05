import React, { useState, useMemo, useCallback } from 'react';
import { Search, Database, Table, Layout, FileText, Link2, List, ChevronRight, ChevronDown, ExternalLink, Layers, GitBranch, Grid3X3, Box, Code, Hash, Lock, Zap, Eye, Play, ArrowRight, Filter, X, BarChart3, AlertCircle, Settings, Upload, Sparkles, Shield, Gauge, FileSearch, Trash2, AlertTriangle, ArrowUpDown, ArrowDownAZ, ArrowUpAZ } from 'lucide-react';
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
  const icons = { table: Table, field: Grid3X3, to: Layers, layout: Layout, script: Code, rel: GitBranch, vl: List, ext: ExternalLink, db: Database, cf: Settings };
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

  // Find shadow TOs in other files that point to this base table
  const externalTOs = useMemo(() => {
    if (!data?.crossFileTableRefs) return [];
    return data.crossFileTableRefs.filter(r => r.baseTable === table.name && r.externalFile === dbName);
  }, [table.name, dbName, data]);

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

        {externalTOs.length > 0 && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-red-700 mb-2">
              <ExternalLink size={14} />
              {externalTOs.length} external TO{externalTOs.length !== 1 ? 's' : ''} reference this table
            </div>
            <div className="flex flex-wrap gap-1.5">
              {externalTOs.map((r, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs">
                  <NavLink type="to" name={r.toName} small onClick={() => onNav('to', r.toName, r.toDb)} />
                  <span className="text-gray-400">in {r.toDb}</span>
                </div>
              ))}
            </div>
          </div>
        )}

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

      <div className="flex-1 overflow-auto bg-white">
        {filteredFields.map((field, i) => (
          <FieldRow key={i} field={field} tableName={table.name} dbName={dbName} reverseRefs={reverseRefs} onNav={onNav} />
        ))}
      </div>
    </div>
  );
};

// Script detail panel
const ScriptDetail = ({ script, dbName, reverseRefs, onNav }) => {
  const callers = reverseRefs?.scriptCallers?.[script.name] || [];
  const onLayouts = reverseRefs?.scriptOnLayouts?.[script.name] || [];

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
            <div className="p-3 text-xs font-mono space-y-1 max-h-96 overflow-auto">
              {script.steps.map((step, i) => (
                <div key={i} className="flex gap-3 py-1 px-2 hover:bg-white rounded">
                  <span className="text-gray-400 w-6 text-right flex-shrink-0">{step.index || i+1}</span>
                  <span className="text-gray-700">{step.name}</span>
                  {step.scriptRef && <NavLink type="script" name={step.scriptRef} small onClick={() => onNav('script', step.scriptRef, dbName)} />}
                  {step.layoutRef && <NavLink type="layout" name={step.layoutRef} small onClick={() => onNav('layout', step.layoutRef, dbName)} />}
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
              {layout.triggers.map((t, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="text-gray-600 text-xs bg-gray-100 px-2 py-1 rounded">{t.type}</span>
                  <NavLink type="script" name={t.script} small onClick={() => onNav('script', t.script, dbName)} />
                </div>
              ))}
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

// Stats view
const StatsView = ({ data }) => {
  const stats = useMemo(() => {
    let totals = { tables: 0, fields: 0, tos: 0, layouts: 0, scripts: 0, rels: 0, vls: 0, cfs: 0 };
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
  const { security, orphans } = analysis || {};

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

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
          <Shield size={24} className="text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-800">Security & Cleanup Audit</h2>
          <p className="text-sm text-gray-500">Identify security concerns and unused elements</p>
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

      <div className="flex gap-2 mb-6">
        {[
          { id: 'security', label: 'Security', icon: Lock, count: filteredSecurity.totalFullAccess },
          { id: 'scripts', label: 'Orphan Scripts', icon: Code, count: filteredOrphans.scripts.length },
          { id: 'fields', label: 'Orphan Fields', icon: Grid3X3, count: filteredOrphans.fields.length },
          { id: 'layouts', label: 'Orphan Layouts', icon: Layout, count: filteredOrphans.layouts.length },
          { id: 'tos', label: 'Orphan TOs', icon: Layers, count: filteredOrphans.tableOccurrences.length },
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

      {tab === 'scripts' && (
        <OrphanList
          items={filteredOrphans.scripts}
          type="script"
          columns={['name', 'db', 'folder']}
          onNav={onNav}
          emptyMessage="All scripts are referenced"
        />
      )}

      {tab === 'fields' && (
        <OrphanList
          items={filteredOrphans.fields}
          type="field"
          columns={['table', 'name', 'dataType', 'db']}
          onNav={onNav}
          emptyMessage="All fields are referenced"
        />
      )}

      {tab === 'layouts' && (
        <OrphanList
          items={filteredOrphans.layouts}
          type="layout"
          columns={['name', 'baseTable', 'db']}
          onNav={onNav}
          emptyMessage="All layouts are navigated to by scripts"
        />
      )}

      {tab === 'tos' && (
        <OrphanList
          items={filteredOrphans.tableOccurrences}
          type="to"
          columns={['name', 'baseTable', 'db']}
          onNav={onNav}
          emptyMessage="All table occurrences are in use"
        />
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

  const { score, level, factors } = metrics.complexity || {};
  const scoreColor = score < 25 ? 'text-green-500' : score < 50 ? 'text-yellow-500' : score < 75 ? 'text-orange-500' : 'text-red-500';
  const scoreBg = score < 25 ? 'from-green-500 to-emerald-500' : score < 50 ? 'from-yellow-500 to-amber-500' : score < 75 ? 'from-orange-500 to-red-500' : 'from-red-500 to-pink-500';

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

  const dbNames = data?.databases?.map(d => d.name) || [];

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

// Global Search View
const GlobalSearchView = ({ data, onNav }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);

  const performSearch = useCallback(() => {
    if (!query.trim() || query.length < 2) {
      setResults(null);
      return;
    }

    const q = query.toLowerCase();
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
  }, [query, data]);

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

      <div className="flex gap-3 mb-6">
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
          onClick={performSearch}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
        >
          Search
        </button>
      </div>

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
const FileUploader = ({ onDataLoaded }) => {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-xl w-full border border-gray-200">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-violet-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-500/25">
            <Database size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">FileMaker DDR Explorer</h1>
          <p className="text-gray-500 mt-2">Upload DDR XML files to analyze your database schema</p>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-all hover:bg-blue-50/50 group">
          <Upload size={36} className="mx-auto text-gray-400 mb-3 group-hover:text-blue-500 transition-colors" />
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
          <p className="text-xs text-gray-400 mt-2">or drag and drop</p>
        </div>

        {files.length > 0 && (
          <div className="mt-5 space-y-2">
            {files.map((file, i) => (
              <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                <FileText size={18} className="text-gray-400" />
                <span className="flex-1 text-sm text-gray-700 truncate">{file.name}</span>
                <span className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                <button onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 flex items-center gap-3">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <button
          onClick={parseFiles}
          disabled={loading || files.length === 0}
          className={`mt-6 w-full py-3.5 rounded-xl font-medium transition-all ${
            loading || files.length === 0
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
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
    return <FileUploader onDataLoaded={handleDataLoaded} />;
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
    if (category === 'scripts') return <ScriptDetail script={selected} dbName={db.name} reverseRefs={reverseRefs} onNav={handleNav} />;
    if (category === 'layouts') return <LayoutDetail layout={selected} dbName={db.name} reverseRefs={reverseRefs} onNav={handleNav} />;
    if (category === 'tos') return <TODetail to={selected} dbName={db.name} reverseRefs={reverseRefs} data={data} onNav={handleNav} />;
    if (category === 'rels') return <RelDetail rel={selected} dbName={db.name} onNav={handleNav} />;

    return (
      <div className="p-5">
        <h2 className="font-semibold text-gray-800 mb-3">{selected.name || selected.id}</h2>
        <pre className="text-xs bg-gray-50 p-4 rounded-xl overflow-auto text-gray-600 border border-gray-200">{JSON.stringify(selected, null, 2)}</pre>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-500 rounded-lg flex items-center justify-center">
            <Database size={16} className="text-white" />
          </div>
          <span className="font-semibold text-gray-800">DDR Explorer</span>
        </div>

        <select
          value={activeDb}
          onChange={e => { setActiveDb(Number(e.target.value)); setSelected(null); }}
          className="text-sm bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          {data.databases.map((d, i) => <option key={i} value={i}>{d.name}</option>)}
        </select>

        <div className="flex gap-1 ml-auto bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'explorer', label: 'Explorer' },
            { id: 'search', label: 'Search' },
            { id: 'audit', label: 'Audit' },
            { id: 'indirection', label: 'Indirection' },
            { id: 'reportcard', label: 'Report Card' },
            { id: 'crossfile', label: 'Cross-File' },
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
      </div>

      {/* Main content */}
      {view === 'search' ? (
        <div className="flex-1 overflow-auto bg-gray-50">
          <GlobalSearchView data={data} onNav={handleNav} />
        </div>
      ) : view === 'audit' ? (
        <div className="flex-1 overflow-auto bg-gray-50">
          <AuditView data={data} analysis={analysis} onNav={handleNav} />
        </div>
      ) : view === 'indirection' ? (
        <div className="flex-1 overflow-auto bg-gray-50">
          <IndirectionView analysis={analysis} data={data} onNav={handleNav} />
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
          <div className="w-72 bg-gray-50 border-r border-gray-200 flex flex-col">
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

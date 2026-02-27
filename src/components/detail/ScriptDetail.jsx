import React, { useMemo } from 'react';
import { Database, Code, Play, Layout, ArrowRight, Grid3X3, Hash, List, ExternalLink } from 'lucide-react';
import { C } from '../../constants/theme';
import Badge from '../ui/Badge';
import NavLink from '../ui/NavLink';
import Section from '../ui/Section';

const ScriptDetail = ({ script, dbName, reverseRefs, data, onNav }) => {
  const callers = reverseRefs?.scriptCallers?.[script.name] || [];
  const onLayouts = reverseRefs?.scriptOnLayouts?.[script.name] || [];

  const crossFileCallers = useMemo(() => {
    if (!data?.crossFileRefs) return [];
    return data.crossFileRefs.filter(r => r.targetScript === script.name && r.targetDb === dbName);
  }, [script.name, dbName, data]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${C.script.bg} rounded-xl flex items-center justify-center shadow-lg`}>
            <Code size={18} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-lg truncate">{script.name}</h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">{script.stepCount || script.steps?.length || 0} steps</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-2 bg-gray-50 dark:bg-gray-900">
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
          <Section title="Steps" count={script.steps.length} icon={<List size={14} className="text-gray-500 dark:text-gray-400" />} color="field" defaultOpen={false}>
            <div className="p-3 text-xs space-y-0.5 max-h-[32rem] overflow-auto">
              {script.steps.map((step, i) => (
                <div key={i} className={`py-1.5 px-2 rounded ${!step.enabled ? 'opacity-50 bg-gray-100 dark:bg-gray-700' : 'hover:bg-white dark:hover:bg-gray-700'}`}>
                  <div className="flex items-start gap-2">
                    <span className="text-gray-400 dark:text-gray-500 w-6 text-right flex-shrink-0 font-mono">{step.index || i+1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-medium ${!step.enabled ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-700 dark:text-gray-200'}`}>{step.name}</span>
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
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 font-mono truncate" title={step.text}>{step.text}</div>
                      )}
                      {step.targetField && (
                        <div className="text-[11px] text-cyan-600 dark:text-cyan-400 mt-0.5">→ {step.targetField}</div>
                      )}
                      {step.variableName && (
                        <div className="text-[11px] text-violet-600 dark:text-violet-400 mt-0.5">
                          {step.variableName}{step.repetition && ` [${step.repetition}]`}
                          {step.calculation && <span className="text-gray-400 dark:text-gray-500"> = </span>}
                          {step.calculation && <span className="text-gray-600 dark:text-gray-300 font-mono">{step.calculation.length > 60 ? step.calculation.slice(0, 60) + '...' : step.calculation}</span>}
                        </div>
                      )}
                      {step.condition && (
                        <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 font-mono">
                          {step.condition.length > 80 ? step.condition.slice(0, 80) + '...' : step.condition}
                        </div>
                      )}
                      {step.url && (
                        <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5 font-mono truncate">{step.url}</div>
                      )}
                      {step.sortFields && (
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Sort by: {step.sortFields.join(', ')}</div>
                      )}
                      {step.title && (
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Title: {step.title}</div>
                      )}
                      {step.windowName && (
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Window: {step.windowName}</div>
                      )}
                      {step.recordAction && (
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{step.recordAction}</div>
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

export default ScriptDetail;

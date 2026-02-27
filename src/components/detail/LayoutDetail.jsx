import React from 'react';
import { Search, Layout, Layers, Zap, Play, ArrowRight, Grid3X3 } from 'lucide-react';
import { C } from '../../constants/theme';
import NavLink from '../ui/NavLink';
import Section from '../ui/Section';

const LayoutDetail = ({ layout, dbName, reverseRefs, onNav }) => {
  const fromScripts = reverseRefs?.layoutFromScripts?.[layout.name] || [];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${C.layout.bg} rounded-xl flex items-center justify-center shadow-lg`}>
            <Layout size={18} className="text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-lg">{layout.name}</h2>
            {layout.baseTable && <div className="text-sm text-gray-500 dark:text-gray-400">Based on: {layout.baseTable}</div>}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-2 bg-gray-50 dark:bg-gray-900">
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
                  <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase mb-1.5">Layout Triggers</div>
                  {layout.triggers.filter(t => t.level === 'layout' || !t.level).map((t, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-300 text-xs bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded border border-yellow-200 dark:border-yellow-800">{t.type}</span>
                      <NavLink type="script" name={t.script} small onClick={() => onNav('script', t.script, dbName)} />
                    </div>
                  ))}
                </div>
              )}
              {/* Field-level triggers */}
              {layout.triggers.filter(t => t.level === 'field').length > 0 && (
                <div>
                  <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase mb-1.5">Field Triggers</div>
                  {layout.triggers.filter(t => t.level === 'field').map((t, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-300 text-xs bg-cyan-100 dark:bg-cyan-900/30 px-2 py-1 rounded border border-cyan-200 dark:border-cyan-800">{t.type}</span>
                      <NavLink type="script" name={t.script} small onClick={() => onNav('script', t.script, dbName)} />
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">on {t.field}</span>
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

export default LayoutDetail;

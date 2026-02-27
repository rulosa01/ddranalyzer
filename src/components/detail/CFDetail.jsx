import React, { useMemo } from 'react';
import { Code, FileText, Sparkles, Activity } from 'lucide-react';
import { C } from '../../constants/theme';
import Badge from '../ui/Badge';
import Section from '../ui/Section';

const CFDetail = ({ cf, dbName, data }) => {
  const signature = `${cf.name}( ${cf.parameterList?.join(' ; ') || ''} )`;

  // Find which calculations reference this custom function
  const usedIn = useMemo(() => {
    const refs = [];
    if (!data?.databases) return refs;
    for (const d of data.databases) {
      // Check field calculations
      for (const table of d.tables || []) {
        for (const field of table.fields || []) {
          const calc = (field.calculation || '') + (field.autoEnterCalc || '') + (field.validationCalc || '');
          if (calc.includes(cf.name)) {
            refs.push({ type: 'field', label: `${table.name}::${field.name}`, db: d.name });
          }
        }
      }
      // Check script steps
      for (const script of d.scripts || []) {
        for (const step of script.steps || []) {
          const stepText = JSON.stringify(step);
          if (stepText.includes(cf.name)) {
            refs.push({ type: 'script', label: script.name, db: d.name });
            break;
          }
        }
      }
      // Check other custom functions
      for (const otherCf of d.customFunctions || []) {
        if (otherCf.name !== cf.name && otherCf.calculation?.includes(cf.name)) {
          refs.push({ type: 'cf', label: otherCf.name, db: d.name });
        }
      }
    }
    return refs;
  }, [cf.name, data]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${C.cf.bg} rounded-xl flex items-center justify-center shadow-lg`}>
            <Sparkles size={18} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-lg truncate">{cf.name}</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>{cf.parameterList?.length || 0} parameter{cf.parameterList?.length !== 1 ? 's' : ''}</span>
              {!cf.visible && <Badge color="rel" size="xs">Hidden</Badge>}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-2 bg-gray-50 dark:bg-gray-900">
        {/* Signature */}
        <Section title="Signature" count={null} icon={<Code size={14} className="text-cyan-500" />} color="cf">
          <div className="p-3">
            <div className="font-mono text-sm bg-white dark:bg-gray-800 rounded-lg px-4 py-3 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 overflow-x-auto">
              {signature}
            </div>
            {cf.parameterList?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {cf.parameterList.map((p, i) => (
                  <Badge key={i} color="cf" size="xs">{p}</Badge>
                ))}
              </div>
            )}
          </div>
        </Section>

        {/* Calculation */}
        <Section title="Calculation" count={null} icon={<FileText size={14} className="text-violet-500" />} color="field">
          <div className="p-3">
            <pre className="text-xs bg-white dark:bg-gray-800 p-4 rounded-lg overflow-auto font-mono text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 whitespace-pre-wrap leading-relaxed max-h-96">{cf.calculation || '(empty)'}</pre>
          </div>
        </Section>

        {/* Usage */}
        <Section title="Used In" count={usedIn.length} icon={<Activity size={14} className="text-green-500" />} color="table" defaultOpen={usedIn.length > 0}>
          {usedIn.length > 0 ? (
            <div className="p-3 space-y-1.5">
              {usedIn.map((ref, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Badge color={ref.type === 'field' ? 'field' : ref.type === 'script' ? 'script' : 'cf'} size="xs">{ref.type}</Badge>
                  <span className="text-gray-700 dark:text-gray-200 font-mono text-xs">{ref.label}</span>
                  {ref.db !== dbName && <span className="text-[10px] text-gray-400">({ref.db})</span>}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 text-sm text-gray-400 dark:text-gray-500 italic">Not referenced in any calculations</div>
          )}
        </Section>
      </div>
    </div>
  );
};

export default CFDetail;

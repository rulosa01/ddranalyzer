import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { dtColors } from '../../constants/theme';
import Badge from '../ui/Badge';
import NavLink from '../ui/NavLink';

const FieldRow = ({ field, tableName, dbName, reverseRefs, onNav }) => {
  const [expanded, setExpanded] = useState(false);
  const fieldKey = `${tableName}::${field.name}`;
  const inScripts = reverseRefs?.fieldInScripts?.[fieldKey] || [];
  const onLayouts = reverseRefs?.fieldOnLayouts?.[fieldKey] || [];
  const inCalcs = reverseRefs?.fieldInCalcs?.[fieldKey] || [];
  const refCount = inScripts.length + onLayouts.length + inCalcs.length;

  return (
    <div className={`border-b border-gray-100 dark:border-gray-700 transition-colors ${expanded ? 'bg-white dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
      <div className="px-4 py-3 flex items-start gap-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-medium text-gray-800 dark:text-gray-100">{field.name}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${dtColors[field.dataType] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
              {field.dataType}
            </span>
            {field.fieldType !== 'Normal' && <Badge color="script" size="xs">{field.fieldType}</Badge>}
            {field.global && <Badge color="ext" size="xs">Global</Badge>}
            {field.indexed && <Badge color="to" size="xs">Indexed</Badge>}
          </div>
          <div className="flex flex-wrap gap-2 mt-2 text-[10px]">
            {field.autoEnter && <span className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full border border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800">Auto: {field.autoEnter}</span>}
            {field.validation && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">Valid: {field.validation}</span>}
            {field.repetitions && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">Reps: {field.repetitions}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
          {refCount > 0 && <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full dark:bg-gray-700 dark:text-gray-300">{refCount} refs</span>}
          <span className="text-gray-400 dark:text-gray-500">{expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
          {field.comment && <div className="text-xs text-gray-500 dark:text-gray-400 italic pt-3">{field.comment}</div>}

          {field.calcText && (
            <div className="pt-2">
              <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Calculation</div>
              <pre className="text-[11px] bg-white dark:bg-gray-800 p-3 rounded-lg overflow-x-auto font-mono text-cyan-700 dark:text-cyan-400 border border-gray-200 dark:border-gray-700">{field.calcText}</pre>
            </div>
          )}

          {field.autoEnterCalc && (
            <div className="pt-2">
              <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Auto-Enter Calc</div>
              <pre className="text-[11px] bg-violet-50 dark:bg-violet-900/20 p-3 rounded-lg overflow-x-auto font-mono text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800">{field.autoEnterCalc}</pre>
            </div>
          )}

          {field.validationCalc && (
            <div className="pt-2">
              <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Validation Calc</div>
              <pre className="text-[11px] bg-red-50 dark:bg-red-900/20 p-3 rounded-lg overflow-x-auto font-mono text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">{field.validationCalc}</pre>
            </div>
          )}

          {inScripts.length > 0 && (
            <div className="pt-2">
              <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Used in {inScripts.length} Script(s)</div>
              <div className="flex flex-wrap gap-1.5">
                {inScripts.slice(0, 10).map((ref, i) => (
                  <NavLink key={i} type="script" name={ref.script} small onClick={() => onNav('script', ref.script, ref.db)} />
                ))}
                {inScripts.length > 10 && <span className="text-xs text-gray-500 dark:text-gray-400 self-center">+{inScripts.length - 10} more</span>}
              </div>
            </div>
          )}

          {onLayouts.length > 0 && (
            <div className="pt-2">
              <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">On {onLayouts.length} Layout(s)</div>
              <div className="flex flex-wrap gap-1.5">
                {onLayouts.slice(0, 10).map((ref, i) => (
                  <NavLink key={i} type="layout" name={ref.layout} small onClick={() => onNav('layout', ref.layout, ref.db)} />
                ))}
                {onLayouts.length > 10 && <span className="text-xs text-gray-500 dark:text-gray-400 self-center">+{onLayouts.length - 10} more</span>}
              </div>
            </div>
          )}

          {inCalcs.length > 0 && (
            <div className="pt-2">
              <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Referenced in {inCalcs.length} Calc Field(s)</div>
              <div className="flex flex-wrap gap-1.5">
                {inCalcs.slice(0, 10).map((ref, i) => (
                  <span key={i} className="text-[10px] bg-cyan-100 text-cyan-700 px-2 py-1 rounded-full border border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800">{ref.table}.{ref.field}</span>
                ))}
                {inCalcs.length > 10 && <span className="text-xs text-gray-500 dark:text-gray-400 self-center">+{inCalcs.length - 10} more</span>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FieldRow;

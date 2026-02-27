import React from 'react';
import { List, Hash, Link2, Eye, ArrowUpAZ, ExternalLink } from 'lucide-react';
import { C } from '../../constants/theme';
import Badge from '../ui/Badge';
import NavLink from '../ui/NavLink';
import Section from '../ui/Section';

const VLDetail = ({ vl, dbName, onNav }) => {
  const typeLabel = vl.type === 'external' ? 'External' : vl.type === 'field' ? 'Field-Based' : 'Custom Values';
  const typeColor = vl.type === 'external' ? 'ext' : vl.type === 'field' ? 'field' : 'vl';

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${C.vl.bg} rounded-xl flex items-center justify-center shadow-lg`}>
            <List size={18} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-lg truncate">{vl.name}</h2>
            <Badge color={typeColor} size="xs">{typeLabel}</Badge>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-2 bg-gray-50 dark:bg-gray-900">
        {/* Custom values */}
        {vl.type === 'custom' && vl.values?.length > 0 && (
          <Section title="Values" count={vl.values.length} icon={<List size={14} className="text-yellow-500" />} color="vl">
            <div className="p-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 max-h-80 overflow-auto">
                {vl.values.map((v, i) => (
                  <div key={i} className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 flex items-center gap-3">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 w-5 text-right font-mono">{i + 1}</span>
                    <span>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </Section>
        )}

        {vl.type === 'custom' && (!vl.values || vl.values.length === 0) && (
          <Section title="Values" count={0} icon={<List size={14} className="text-yellow-500" />} color="vl">
            <div className="p-3 text-sm text-gray-400 dark:text-gray-500 italic">No values defined</div>
          </Section>
        )}

        {/* Field-based */}
        {vl.type === 'field' && (
          <>
            <Section title="Primary Field" count={null} icon={<Hash size={14} className="text-blue-500" />} color="field">
              <div className="p-3 space-y-2">
                <div className="font-mono text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 rounded-lg px-4 py-3 border border-gray-200 dark:border-gray-700">
                  {vl.sourceField}
                </div>
                {vl.primaryField && (
                  <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400">
                    {vl.primaryField.sort && <span className="flex items-center gap-1"><ArrowUpAZ size={12} /> Sorted</span>}
                  </div>
                )}
              </div>
            </Section>

            {vl.secondaryField && (
              <Section title="Secondary Field" count={null} icon={<Hash size={14} className="text-indigo-500" />} color="field">
                <div className="p-3 space-y-2">
                  <div className="font-mono text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 rounded-lg px-4 py-3 border border-gray-200 dark:border-gray-700">
                    {vl.secondaryField.table}::{vl.secondaryField.name}
                  </div>
                  <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400">
                    {vl.secondaryField.show && <span className="flex items-center gap-1"><Eye size={12} /> Show only second field</span>}
                    {vl.secondaryField.sort && <span className="flex items-center gap-1"><ArrowUpAZ size={12} /> Sorted</span>}
                  </div>
                </div>
              </Section>
            )}

            {vl.showRelated && (
              <Section title="Show Related Values" count={null} icon={<Link2 size={14} className="text-green-500" />} color="to">
                <div className="p-3">
                  <div className="text-sm text-gray-700 dark:text-gray-200">
                    Starting from: <span className="font-mono font-medium">{vl.showRelated.table}</span>
                  </div>
                </div>
              </Section>
            )}
          </>
        )}

        {/* External */}
        {vl.type === 'external' && vl.external && (
          <Section title="External Source" count={null} icon={<ExternalLink size={14} className="text-rose-500" />} color="ext">
            <div className="p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400">File:</span>
                <span className="font-mono text-gray-700 dark:text-gray-200">{vl.external.fileName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Value List:</span>
                <span className="font-mono text-gray-700 dark:text-gray-200">{vl.external.valueListName}</span>
              </div>
            </div>
          </Section>
        )}
      </div>
    </div>
  );
};

export default VLDetail;

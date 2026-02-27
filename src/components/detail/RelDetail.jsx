import React from 'react';
import { Layers, Link2, ArrowRight, ArrowUpDown, ArrowDownAZ, ArrowUpAZ, GitBranch } from 'lucide-react';
import { C } from '../../constants/theme';
import NavLink from '../ui/NavLink';
import Section from '../ui/Section';

const RelDetail = ({ rel, dbName, onNav }) => {
  const operatorLabel = (type) => {
    const ops = { Equal: '=', NotEqual: '≠', GreaterThan: '>', GreaterThanOrEqual: '≥', GreaterThanOrEqualTo: '≥', LessThan: '<', LessThanOrEqual: '≤', LessThanOrEqualTo: '≤', CartesianJoin: '×', CartesianProduct: '×' };
    return ops[type] || type;
  };

  const hasCascade = rel.leftCascadeCreate || rel.leftCascadeDelete || rel.rightCascadeCreate || rel.rightCascadeDelete;
  const hasSort = (rel.leftSort?.length > 0) || (rel.rightSort?.length > 0);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${C.rel.bg} rounded-xl flex items-center justify-center shadow-lg`}>
            <GitBranch size={18} className="text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-lg">{rel.leftTable} ↔ {rel.rightTable}</h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">{rel.predicates?.length || 0} predicate{rel.predicates?.length !== 1 ? 's' : ''}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-2 bg-gray-50 dark:bg-gray-900">
        {/* Table Occurrences */}
        <Section title="Table Occurrences" count={2} icon={<Layers size={14} className="text-violet-500" />} color="to">
          <div className="p-3 flex items-center justify-center gap-6">
            <NavLink type="to" name={rel.leftTable} onClick={() => onNav('to', rel.leftTable, dbName)} />
            <span className="text-gray-400 dark:text-gray-500 text-lg">↔</span>
            <NavLink type="to" name={rel.rightTable} onClick={() => onNav('to', rel.rightTable, dbName)} />
          </div>
        </Section>

        {/* Predicates */}
        <Section title="Join Predicates" count={rel.predicates?.length} icon={<Link2 size={14} className="text-pink-500" />} color="rel">
          <div className="p-3 space-y-2">
            {rel.predicates?.map((p, i) => (
              <div key={i} className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg px-4 py-3 border border-gray-200 dark:border-gray-700">
                <span className="font-mono text-sm text-gray-700 dark:text-gray-200 flex-1 text-right">{p.leftField}</span>
                <span className="text-pink-500 dark:text-pink-400 font-bold text-lg w-6 text-center">{operatorLabel(p.type)}</span>
                <span className="font-mono text-sm text-gray-700 dark:text-gray-200 flex-1">{p.rightField}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Cascade Rules */}
        {hasCascade && (
          <Section title="Cascade Rules" count={null} icon={<ArrowRight size={14} className="text-amber-500" />} color="field">
            <div className="p-3 grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">{rel.leftTable}</div>
                <div className="space-y-1 text-sm">
                  {rel.leftCascadeCreate && <div className="text-green-600 dark:text-green-400">Allow creation of related records</div>}
                  {rel.leftCascadeDelete && <div className="text-red-600 dark:text-red-400">Delete related records</div>}
                  {!rel.leftCascadeCreate && !rel.leftCascadeDelete && <div className="text-gray-400 dark:text-gray-500 italic">None</div>}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">{rel.rightTable}</div>
                <div className="space-y-1 text-sm">
                  {rel.rightCascadeCreate && <div className="text-green-600 dark:text-green-400">Allow creation of related records</div>}
                  {rel.rightCascadeDelete && <div className="text-red-600 dark:text-red-400">Delete related records</div>}
                  {!rel.rightCascadeCreate && !rel.rightCascadeDelete && <div className="text-gray-400 dark:text-gray-500 italic">None</div>}
                </div>
              </div>
            </div>
          </Section>
        )}

        {/* Sort Orders */}
        {hasSort && (
          <Section title="Sort Orders" count={null} icon={<ArrowUpDown size={14} className="text-blue-500" />} color="table">
            <div className="p-3 space-y-3">
              {rel.leftSort?.length > 0 && (
                <div>
                  <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase mb-1.5">{rel.leftTable}</div>
                  {rel.leftSort.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 ml-2">
                      {s.direction === 'Descending' ? <ArrowDownAZ size={14} className="text-blue-400" /> : <ArrowUpAZ size={14} className="text-blue-400" />}
                      <span className="font-mono">{s.field}</span>
                      <span className="text-xs text-gray-400">({s.direction})</span>
                    </div>
                  ))}
                </div>
              )}
              {rel.rightSort?.length > 0 && (
                <div>
                  <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase mb-1.5">{rel.rightTable}</div>
                  {rel.rightSort.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 ml-2">
                      {s.direction === 'Descending' ? <ArrowDownAZ size={14} className="text-blue-400" /> : <ArrowUpAZ size={14} className="text-blue-400" />}
                      <span className="font-mono">{s.field}</span>
                      <span className="text-xs text-gray-400">({s.direction})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
};

export default RelDetail;

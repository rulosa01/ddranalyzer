import React, { useState, useMemo } from 'react';
import { Search, Table, Layers, ExternalLink } from 'lucide-react';
import { C } from '../../constants/theme';
import Badge from '../ui/Badge';
import NavLink from '../ui/NavLink';
import Section from '../ui/Section';
import FieldRow from './FieldRow';

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
      <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 ${C.table.bg} rounded-xl flex items-center justify-center shadow-lg`}>
            <Table size={18} className="text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-lg">{table.name}</h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">{table.fieldCount} fields · {table.records} records</div>
          </div>
        </div>
        {table.comment && <p className="text-sm text-gray-500 dark:text-gray-400 italic">{table.comment}</p>}

        <div className="flex gap-2 mt-4">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filter fields..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-gray-700 dark:text-gray-200"
          >
            <option value="">All Types</option>
            {dataTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {/* Table Occurrences section */}
        {totalTOs > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <Section title="Table Occurrences" count={totalTOs} icon={<Layers size={14} className="text-violet-500" />} color="to" defaultOpen={true}>
              <div className="p-3 space-y-3">
                {allTOs.local.length > 0 && (
                  <div>
                    <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
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
                    <div className="text-[10px] font-medium text-red-500 dark:text-red-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <ExternalLink size={10} />
                      In Other Files ({allTOs.external.length})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {allTOs.external.map((r, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <NavLink type="to" name={r.toName} small onClick={() => onNav('to', r.toName, r.toDb)} />
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">({r.toDb})</span>
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
        <div className="bg-white dark:bg-gray-800">
          {filteredFields.map((field, i) => (
            <FieldRow key={i} field={field} tableName={table.name} dbName={dbName} reverseRefs={reverseRefs} onNav={onNav} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TableDetail;

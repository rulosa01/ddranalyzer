import React, { useMemo } from 'react';
import { C } from '../../constants/theme';

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
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="text-left p-4 font-medium text-gray-700 dark:text-gray-200">Database</th>
              <th className="text-right p-4 font-medium text-gray-700 dark:text-gray-200">Tables</th>
              <th className="text-right p-4 font-medium text-gray-700 dark:text-gray-200">Fields</th>
              <th className="text-right p-4 font-medium text-gray-700 dark:text-gray-200">TOs</th>
              <th className="text-right p-4 font-medium text-gray-700 dark:text-gray-200">Layouts</th>
              <th className="text-right p-4 font-medium text-gray-700 dark:text-gray-200">Scripts</th>
              <th className="text-right p-4 font-medium text-gray-700 dark:text-gray-200">Rels</th>
            </tr>
          </thead>
          <tbody>
            {stats.perDb.map((db, i) => (
              <tr key={i} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="p-4 font-medium text-gray-800 dark:text-gray-100">{db.name}</td>
                <td className="p-4 text-right text-gray-600 dark:text-gray-300">{db.tables}</td>
                <td className="p-4 text-right text-gray-600 dark:text-gray-300">{db.fields}</td>
                <td className="p-4 text-right text-gray-600 dark:text-gray-300">{db.tos}</td>
                <td className="p-4 text-right text-gray-600 dark:text-gray-300">{db.layouts}</td>
                <td className="p-4 text-right text-gray-600 dark:text-gray-300">{db.scripts}</td>
                <td className="p-4 text-right text-gray-600 dark:text-gray-300">{db.rels}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StatsView;

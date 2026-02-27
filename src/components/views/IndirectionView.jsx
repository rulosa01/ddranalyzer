import React, { useState } from 'react';
import { FileSearch, Database, Zap, ArrowRight, Code } from 'lucide-react';
import Badge from '../ui/Badge';
import NavLink from '../ui/NavLink';

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
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Indirection Sources</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Dynamic code execution and SQL queries ({totalCount} found)</p>
        </div>
        {dbNames.length > 1 && (
          <select
            value={filterDb}
            onChange={e => setFilterDb(e.target.value)}
            className="text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="">All Databases</option>
            {dbNames.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
        )}
      </div>

      {filteredSQL.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-purple-50 dark:bg-purple-900/20 px-4 py-3 border-b border-purple-100 dark:border-purple-900/40 flex items-center gap-3">
            <Database size={16} className="text-purple-500" />
            <span className="font-medium text-purple-700 dark:text-purple-400">ExecuteSQL ({filteredSQL.length})</span>
          </div>
          <div className="p-4 space-y-2 max-h-64 overflow-auto">
            {filteredSQL.map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                {item.location === 'script' ? (
                  <>
                    <NavLink type="script" name={item.script} small onClick={() => onNav('script', item.script, item.db)} />
                    <span className="text-gray-400">step {item.step}</span>
                  </>
                ) : (
                  <>
                    <span className="text-gray-500 dark:text-gray-400">{item.table}::</span>
                    <span className="font-mono text-purple-600 dark:text-purple-400">{item.field}</span>
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
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-amber-50 dark:bg-amber-900/20 px-4 py-3 border-b border-amber-100 dark:border-amber-900/40 flex items-center gap-3">
            <Zap size={16} className="text-amber-500" />
            <span className="font-medium text-amber-700 dark:text-amber-400">Evaluate ({filteredEval.length})</span>
          </div>
          <div className="p-4 space-y-2 max-h-64 overflow-auto">
            {filteredEval.map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                {item.location === 'script' ? (
                  <>
                    <NavLink type="script" name={item.script} small onClick={() => onNav('script', item.script, item.db)} />
                    <span className="text-gray-400 dark:text-gray-500">step {item.step}</span>
                  </>
                ) : (
                  <>
                    <span className="text-gray-500 dark:text-gray-400">{item.table}::</span>
                    <span className="font-mono text-amber-600 dark:text-amber-400">{item.field}</span>
                  </>
                )}
                <span className="text-gray-400 text-xs ml-auto">{item.db}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredDynamic.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-cyan-50 dark:bg-cyan-900/20 px-4 py-3 border-b border-cyan-100 dark:border-cyan-900/40 flex items-center gap-3">
            <ArrowRight size={16} className="text-cyan-500" />
            <span className="font-medium text-cyan-700 dark:text-cyan-400">Other Dynamic References ({filteredDynamic.length})</span>
          </div>
          <div className="p-4 space-y-2 max-h-64 overflow-auto">
            {filteredDynamic.map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                <Badge color="field" size="xs">{item.type}</Badge>
                {item.location === 'script' ? (
                  <NavLink type="script" name={item.script} small onClick={() => onNav('script', item.script, item.db)} />
                ) : (
                  <span className="font-mono text-gray-600 dark:text-gray-300">{item.table}::{item.field}</span>
                )}
                <span className="text-gray-400 text-xs ml-auto">{item.db}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {totalCount === 0 && filterDb && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <FileSearch size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p>No indirection patterns found in {filterDb}</p>
        </div>
      )}
    </div>
  );
};

export default IndirectionView;

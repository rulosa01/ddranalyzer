import React, { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import useSearchHistory from '../../hooks/useSearchHistory';
import Badge from '../ui/Badge';
import NavLink from '../ui/NavLink';
import Icon from '../ui/Icon';
import { C } from '../../constants/theme';

const GlobalSearchView = ({ data, onNav }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const { history, addToHistory, clearHistory, removeFromHistory } = useSearchHistory();

  const performSearch = useCallback((searchQuery) => {
    const q = (searchQuery || query).trim().toLowerCase();
    if (!q || q.length < 2) {
      setResults(null);
      return;
    }

    // Add to history
    addToHistory(searchQuery || query);
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
  }, [query, data, addToHistory]);

  const handleHistoryClick = (historyQuery) => {
    setQuery(historyQuery);
    performSearch(historyQuery);
  };

  const totalResults = results ? Object.values(results).reduce((sum, arr) => sum + arr.length, 0) : 0;

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
          <Search size={24} className="text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Global Search</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Search across all databases, tables, fields, scripts, and more</p>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search everything..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && performSearch()}
            className="w-full pl-12 pr-4 py-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
          />
        </div>
        <button
          onClick={() => performSearch()}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
        >
          Search
        </button>
      </div>

      {/* Search History */}
      {history.length > 0 && !results && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase">Recent Searches</span>
            <button onClick={clearHistory} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
              Clear History
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {history.map((h, i) => (
              <div key={i} className="flex items-center gap-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg pr-1 group">
                <button
                  onClick={() => handleHistoryClick(h)}
                  className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {h}
                </button>
                <button
                  onClick={() => removeFromHistory(h)}
                  className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {results && (
        <div className="space-y-4">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
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
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Search size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p>No results found for "{query}"</p>
            </div>
          )}
        </div>
      )}

      {!results && (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <Search size={48} className="mx-auto mb-4 text-gray-200 dark:text-gray-700" />
          <p>Enter a search term and press Enter or click Search</p>
        </div>
      )}
    </div>
  );
};

const SearchResultSection = ({ title, items, type, onNav, renderItem }) => (
  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
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

export default GlobalSearchView;

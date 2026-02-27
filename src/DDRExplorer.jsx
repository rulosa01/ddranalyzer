import React, { useState, useMemo, useCallback } from 'react';
import { Search, Database, Eye, Moon, Sun, List, ArrowDownAZ, ArrowUpAZ, Hash } from 'lucide-react';
import { analyzeDatabase } from './ddr-parser';
import useDarkMode from './hooks/useDarkMode';
import { C } from './constants/theme';
import Icon from './components/ui/Icon';
import FileUploader from './components/FileUploader';
import TableDetail from './components/detail/TableDetail';
import ScriptDetail from './components/detail/ScriptDetail';
import LayoutDetail from './components/detail/LayoutDetail';
import TODetail from './components/detail/TODetail';
import RelDetail from './components/detail/RelDetail';
import CFDetail from './components/detail/CFDetail';
import VLDetail from './components/detail/VLDetail';
import AccountDetail from './components/detail/AccountDetail';
import PrivSetDetail from './components/detail/PrivSetDetail';
import ExtPrivDetail from './components/detail/ExtPrivDetail';
import GlobalSearchView from './components/views/GlobalSearchView';
import ERDView from './components/graph/ERDView';
import ScriptGraphView from './components/graph/ScriptGraphView';
import AuditView from './components/views/AuditView';
import ReportCardView from './components/views/ReportCardView';
import CrossFileView from './components/views/CrossFileView';

// Main app component
export default function DDRExplorer() {
  const [data, setData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [activeDb, setActiveDb] = useState(0);
  const [view, setView] = useState('explorer');
  const [category, setCategory] = useState('tables');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [sortMode, setSortMode] = useState('default'); // 'default', 'alpha', 'alpha-desc', 'id'
  const { darkMode, toggleDarkMode } = useDarkMode();

  // Compute analysis when data changes
  const handleDataLoaded = useCallback((parsedData) => {
    setData(parsedData);
    const analysisResult = analyzeDatabase(parsedData);
    setAnalysis(analysisResult);
  }, []);

  const db = data?.databases?.[activeDb];
  const reverseRefs = data?.reverseRefs || {};

  const categories = [
    { id: 'tables', label: 'Tables', icon: 'table', items: db?.tables || [] },
    { id: 'tos', label: 'TOs', icon: 'to', items: db?.tableOccurrences || [] },
    { id: 'layouts', label: 'Layouts', icon: 'layout', items: db?.layouts || [] },
    { id: 'scripts', label: 'Scripts', icon: 'script', items: db?.scripts || [] },
    { id: 'rels', label: 'Relationships', icon: 'rel', items: db?.relationships || [] },
    { id: 'vls', label: 'Value Lists', icon: 'vl', items: db?.valueLists || [] },
    { id: 'cfs', label: 'Custom Functions', icon: 'cf', items: db?.customFunctions || [] },
    { id: 'accounts', label: 'Accounts', icon: 'account', items: db?.accounts || [] },
    { id: 'privsets', label: 'Privilege Sets', icon: 'privset', items: db?.privilegeSets || [] },
    { id: 'extprivs', label: 'Ext Privileges', icon: 'extpriv', items: db?.extendedPrivileges || [] },
  ];

  const currentCat = categories.find(c => c.id === category);
  const getItemLabel = useCallback((item) => {
    if (category === 'rels' && item.leftTable && item.rightTable) {
      return `${item.leftTable} ↔ ${item.rightTable}`;
    }
    return item.name || item.id || '';
  }, [category]);
  const filteredItems = useMemo(() => {
    if (!currentCat) return [];
    let items = currentCat.items.filter(item => {
      const name = getItemLabel(item);
      return name.toLowerCase().includes(search.toLowerCase());
    });

    if (sortMode === 'alpha') {
      items = [...items].sort((a, b) => getItemLabel(a).localeCompare(getItemLabel(b)));
    } else if (sortMode === 'alpha-desc') {
      items = [...items].sort((a, b) => getItemLabel(b).localeCompare(getItemLabel(a)));
    } else if (sortMode === 'id') {
      items = [...items].sort((a, b) => {
        const aId = parseInt(a.id) || 0;
        const bId = parseInt(b.id) || 0;
        return aId - bId;
      });
    }

    return items;
  }, [currentCat, search, sortMode, getItemLabel]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!filteredItems || filteredItems.length === 0) return;
    if (view !== 'explorer') return;

    const currentIndex = selected ? filteredItems.indexOf(selected) : -1;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = currentIndex < filteredItems.length - 1 ? currentIndex + 1 : 0;
      setSelected(filteredItems[nextIndex]);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : filteredItems.length - 1;
      setSelected(filteredItems[prevIndex]);
    }
  }, [filteredItems, selected, view]);

  const handleNav = useCallback((type, name, targetDb) => {
    if (targetDb && targetDb !== db?.name) {
      const idx = data.databases.findIndex(d => d.name === targetDb);
      if (idx >= 0) setActiveDb(idx);
    }
    const catMap = { table: 'tables', to: 'tos', layout: 'layouts', script: 'scripts', rel: 'rels', vl: 'vls', cf: 'cfs' };
    if (catMap[type]) {
      setCategory(catMap[type]);
      setView('explorer');
    }
    const targetDb2 = targetDb || db?.name;
    const dbData = data.databases.find(d => d.name === targetDb2);
    if (dbData) {
      const catData = {
        table: dbData.tables, to: dbData.tableOccurrences, layout: dbData.layouts,
        script: dbData.scripts, rel: dbData.relationships, vl: dbData.valueLists, cf: dbData.customFunctions
      }[type];
      const item = catData?.find(i => (i.name || i.id) === name);
      if (item) setSelected(item);
    }
  }, [data, db]);

  // Show file uploader if no data loaded
  if (!data) {
    return <FileUploader onDataLoaded={handleDataLoaded} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />;
  }

  const renderDetail = () => {
    if (!selected) return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <Eye size={48} className="mx-auto mb-3 text-gray-300" />
          <p>Select an item to view details</p>
        </div>
      </div>
    );

    if (category === 'tables') return <TableDetail table={selected} dbName={db.name} reverseRefs={reverseRefs} data={data} onNav={handleNav} />;
    if (category === 'scripts') return <ScriptDetail script={selected} dbName={db.name} reverseRefs={reverseRefs} data={data} onNav={handleNav} />;
    if (category === 'layouts') return <LayoutDetail layout={selected} dbName={db.name} reverseRefs={reverseRefs} onNav={handleNav} />;
    if (category === 'tos') return <TODetail to={selected} dbName={db.name} reverseRefs={reverseRefs} data={data} onNav={handleNav} />;
    if (category === 'rels') return <RelDetail rel={selected} dbName={db.name} onNav={handleNav} />;
    if (category === 'vls') return <VLDetail vl={selected} dbName={db.name} onNav={handleNav} />;
    if (category === 'cfs') return <CFDetail cf={selected} dbName={db.name} data={data} />;
    if (category === 'accounts') return <AccountDetail account={selected} dbName={db.name} data={data} />;
    if (category === 'privsets') return <PrivSetDetail privset={selected} dbName={db.name} data={data} />;
    if (category === 'extprivs') return <ExtPrivDetail extpriv={selected} dbName={db.name} data={data} />;

    return (
      <div className="p-5">
        <h2 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">{selected.name || selected.id}</h2>
        <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-4 rounded-xl overflow-auto text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">{JSON.stringify(selected, null, 2)}</pre>
      </div>
    );
  };

  return (
    <div className={`h-screen flex flex-col ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`px-5 py-3 flex items-center gap-5 shadow-sm border-b ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-500 rounded-lg flex items-center justify-center">
            <Database size={16} className="text-white" />
          </div>
          <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>DDR Explorer</span>
        </div>

        <select
          value={activeDb}
          onChange={e => { setActiveDb(Number(e.target.value)); setSelected(null); }}
          className={`text-sm rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border border-gray-300 text-gray-700'}`}
        >
          {data.databases.map((d, i) => <option key={i} value={i}>{d.name}</option>)}
        </select>

        <div className={`flex gap-1 ml-auto p-1 rounded-lg overflow-x-auto ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          {[
            { id: 'explorer', label: 'Explorer' },
            { id: 'search', label: 'Search' },
            { id: 'erd', label: 'ERD' },
            { id: 'scriptgraph', label: 'Scripts' },
            { id: 'audit', label: 'Audit' },
            { id: 'reportcard', label: 'Report' },
            { id: 'crossfile', label: 'X-File' },
          ].map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                view === v.id
                  ? 'bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-lg'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Main content */}
      {view === 'search' ? (
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          <GlobalSearchView data={data} onNav={handleNav} />
        </div>
      ) : view === 'erd' ? (
        <div className="flex-1 overflow-hidden">
          <ERDView data={data} onNav={handleNav} />
        </div>
      ) : view === 'scriptgraph' ? (
        <div className="flex-1 overflow-hidden">
          <ScriptGraphView data={data} onNav={handleNav} />
        </div>
      ) : view === 'audit' ? (
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          <AuditView data={data} analysis={analysis} onNav={handleNav} />
        </div>
      ) : view === 'reportcard' ? (
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          <ReportCardView analysis={analysis} data={data} />
        </div>
      ) : view === 'crossfile' ? (
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          <CrossFileView data={data} onNav={handleNav} />
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Category nav */}
          <div className="w-44 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-3">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setCategory(cat.id); setSelected(null); setSearch(''); }}
                className={`w-full text-left px-3 py-2.5 rounded-xl mb-1 flex items-center gap-3 text-sm transition-all ${
                  category === cat.id
                    ? `${C[cat.icon].bg} text-white shadow-lg`
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <Icon type={cat.icon} size={16} />
                <span className="flex-1">{cat.label}</span>
                <span className={`text-xs ${category === cat.id ? 'text-white/70' : 'text-gray-400'}`}>{cat.items.length}</span>
              </button>
            ))}
          </div>

          {/* Item list */}
          <div
            className="w-72 bg-gray-50 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600 flex flex-col"
            tabIndex={0}
            onKeyDown={handleKeyDown}
          >
            <div className="p-3 border-b border-gray-200 dark:border-gray-600 space-y-2">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${currentCat?.label || ''}...`}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div className="flex gap-1">
                {[
                  { id: 'default', label: 'Default', icon: List },
                  { id: 'alpha', label: 'A-Z', icon: ArrowDownAZ },
                  { id: 'alpha-desc', label: 'Z-A', icon: ArrowUpAZ },
                  { id: 'id', label: 'ID', icon: Hash },
                ].map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSortMode(s.id)}
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                      sortMode === s.id
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500'
                    }`}
                    title={`Sort by ${s.label}`}
                  >
                    <s.icon size={12} />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              {filteredItems.map((item, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(item)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-200/50 dark:border-gray-600/50 flex items-center gap-3 text-sm transition-all ${
                    selected === item
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-l-2 border-l-blue-500'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-800 dark:hover:text-gray-100 border-l-2 border-l-transparent'
                  }`}
                >
                  <Icon type={currentCat?.icon} size={14} className={selected === item ? 'text-blue-500' : 'text-gray-400'} />
                  <span className="truncate flex-1">{getItemLabel(item)}</span>
                  {category === 'vls' && item.type && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                      item.type === 'field' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                      item.type === 'external' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' :
                      'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>{item.type === 'field' ? 'Field' : item.type === 'external' ? 'Ext' : 'Custom'}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Detail panel */}
          <div className="flex-1 overflow-hidden bg-white dark:bg-gray-800">
            {renderDetail()}
          </div>
        </div>
      )}
    </div>
  );
}

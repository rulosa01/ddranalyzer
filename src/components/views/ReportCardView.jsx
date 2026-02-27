import React, { useState, useMemo } from 'react';
import { Gauge } from 'lucide-react';
import { C } from '../../constants/theme';

const ReportCardView = ({ analysis, data }) => {
  const [filterDb, setFilterDb] = useState('');
  const metrics = analysis?.complexity;
  if (!metrics) return null;

  const dbNames = data?.databases?.map(d => d.name) || [];

  // Filter perDb data
  const filteredPerDb = filterDb ? metrics.perDb?.filter(d => d.name === filterDb) : metrics.perDb;

  // Recalculate totals when filtering
  const displayTotals = filterDb && filteredPerDb?.length === 1 ? {
    tables: filteredPerDb[0].tables,
    fields: filteredPerDb[0].fields,
    calcFields: filteredPerDb[0].calcFields,
    tableOccurrences: filteredPerDb[0].tos,
    relationships: filteredPerDb[0].rels,
    layouts: filteredPerDb[0].layouts,
    scripts: filteredPerDb[0].scripts,
    scriptSteps: filteredPerDb[0].scriptSteps,
  } : metrics.totals;

  // Calculate complexity score - recalculate when filtering by DB
  const { score, level, factors } = useMemo(() => {
    const totals = displayTotals;
    let calcScore = 0;
    const calcFactors = [];

    // Factor: Number of tables (0-15 points)
    const tableFactor = Math.min(totals.tables / 50, 1) * 15;
    calcScore += tableFactor;
    if (totals.tables > 30) calcFactors.push(`${totals.tables} tables`);

    // Factor: Number of fields (0-15 points)
    const fieldFactor = Math.min(totals.fields / 500, 1) * 15;
    calcScore += fieldFactor;
    if (totals.fields > 300) calcFactors.push(`${totals.fields} fields`);

    // Factor: Number of scripts (0-20 points)
    const scriptFactor = Math.min(totals.scripts / 200, 1) * 20;
    calcScore += scriptFactor;
    if (totals.scripts > 100) calcFactors.push(`${totals.scripts} scripts`);

    // Factor: Script complexity (0-15 points)
    const avgSteps = totals.scripts > 0 ? totals.scriptSteps / totals.scripts : 0;
    const stepFactor = Math.min(avgSteps / 50, 1) * 15;
    calcScore += stepFactor;
    if (avgSteps > 30) calcFactors.push(`${Math.round(avgSteps)} avg steps/script`);

    // Factor: Relationships (0-10 points)
    const relFactor = Math.min(totals.relationships / 100, 1) * 10;
    calcScore += relFactor;
    if (totals.relationships > 50) calcFactors.push(`${totals.relationships} relationships`);

    // Factor: TOs (0-10 points)
    const toFactor = Math.min(totals.tableOccurrences / 100, 1) * 10;
    calcScore += toFactor;
    if (totals.tableOccurrences > 50) calcFactors.push(`${totals.tableOccurrences} TOs`);

    // Factor: Calc fields ratio (0-10 points)
    const calcRatio = totals.fields > 0 ? totals.calcFields / totals.fields : 0;
    const calcFieldFactor = Math.min(calcRatio / 0.5, 1) * 10;
    calcScore += calcFieldFactor;
    if (calcRatio > 0.3) calcFactors.push(`${Math.round(calcRatio * 100)}% calc fields`);

    // Factor: Multi-file (0-5 points) - only when not filtering
    if (!filterDb && data?.databases?.length > 1) {
      calcScore += Math.min(data.databases.length, 5);
      calcFactors.push(`${data.databases.length} files`);
    }

    const finalScore = Math.round(calcScore);
    let calcLevel = 'Simple';
    if (finalScore >= 25 && finalScore < 50) calcLevel = 'Moderate';
    else if (finalScore >= 50 && finalScore < 75) calcLevel = 'Complex';
    else if (finalScore >= 75) calcLevel = 'Very Complex';

    return { score: finalScore, level: calcLevel, factors: calcFactors };
  }, [displayTotals, filterDb, data?.databases?.length]);

  const scoreColor = score < 25 ? 'text-green-500' : score < 50 ? 'text-yellow-500' : score < 75 ? 'text-orange-500' : 'text-red-500';
  const scoreBg = score < 25 ? 'from-green-500 to-emerald-500' : score < 50 ? 'from-yellow-500 to-amber-500' : score < 75 ? 'from-orange-500 to-red-500' : 'from-red-500 to-pink-500';

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
          <Gauge size={24} className="text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Report Card</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Solution complexity analysis</p>
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

      {/* Complexity Score */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 mb-6 shadow-sm">
        <div className="flex items-center gap-8">
          <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${scoreBg} flex items-center justify-center shadow-lg`}>
            <div className="text-center text-white">
              <div className="text-4xl font-bold">{score}</div>
              <div className="text-xs opacity-80">/ 100</div>
            </div>
          </div>
          <div className="flex-1">
            <div className={`text-2xl font-bold ${scoreColor}`}>{level}</div>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Complexity Level</p>
            {factors?.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Contributing factors:</p>
                <div className="flex flex-wrap gap-2">
                  {factors.map((f, i) => (
                    <span key={i} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">{f}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Totals Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Tables', value: displayTotals.tables, color: 'table' },
          { label: 'Fields', value: displayTotals.fields, color: 'field' },
          { label: 'Calc Fields', value: displayTotals.calcFields, color: 'cf' },
          { label: 'Table Occurrences', value: displayTotals.tableOccurrences, color: 'to' },
          { label: 'Relationships', value: displayTotals.relationships, color: 'rel' },
          { label: 'Layouts', value: displayTotals.layouts, color: 'layout' },
          { label: 'Scripts', value: displayTotals.scripts, color: 'script' },
          { label: 'Script Steps', value: displayTotals.scriptSteps, color: 'script' },
        ].map(m => (
          <div key={m.label} className={`${C[m.color].light} ${C[m.color].border} border rounded-xl p-4 shadow-sm`}>
            <div className={`text-2xl font-bold ${C[m.color].text}`}>{(m.value || 0).toLocaleString()}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Per-Database Breakdown */}
      {!filterDb && metrics.perDb?.length > 1 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-100 dark:border-gray-600 font-medium text-gray-700 dark:text-gray-200">
            Per-Database Breakdown
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-200">Database</th>
                <th className="text-right p-3 font-medium text-gray-700 dark:text-gray-200">Tables</th>
                <th className="text-right p-3 font-medium text-gray-700 dark:text-gray-200">Fields</th>
                <th className="text-right p-3 font-medium text-gray-700 dark:text-gray-200">TOs</th>
                <th className="text-right p-3 font-medium text-gray-700 dark:text-gray-200">Scripts</th>
                <th className="text-right p-3 font-medium text-gray-700 dark:text-gray-200">Avg Steps</th>
              </tr>
            </thead>
            <tbody>
              {metrics.perDb.map((db, i) => (
                <tr key={i} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="p-3 font-medium text-gray-800 dark:text-gray-100">{db.name}</td>
                  <td className="p-3 text-right text-gray-600 dark:text-gray-300">{db.tables}</td>
                  <td className="p-3 text-right text-gray-600 dark:text-gray-300">{db.fields}</td>
                  <td className="p-3 text-right text-gray-600 dark:text-gray-300">{db.tos}</td>
                  <td className="p-3 text-right text-gray-600 dark:text-gray-300">{db.scripts}</td>
                  <td className="p-3 text-right text-gray-600 dark:text-gray-300">{db.avgStepsPerScript}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReportCardView;

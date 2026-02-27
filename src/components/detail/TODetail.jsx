import React, { useMemo } from 'react';
import { Layers, Layout, GitBranch, ExternalLink } from 'lucide-react';
import { C } from '../../constants/theme';
import Badge from '../ui/Badge';
import NavLink from '../ui/NavLink';
import Section from '../ui/Section';

const TODetail = ({ to, dbName, reverseRefs, data, onNav }) => {
  const layouts = reverseRefs?.toLayouts?.[to.name] || [];
  const rels = reverseRefs?.toRelationships?.[to.name] || [];

  // Find other TOs across all files that share the same base table (siblings)
  const siblingTOs = useMemo(() => {
    if (!data?.crossFileTableRefs) return [];
    // If this TO is a shadow TO, find other shadow TOs pointing to the same external table
    if (to.externalFile) {
      return data.crossFileTableRefs.filter(r =>
        r.baseTable === to.baseTable && r.externalFile === to.externalFile && !(r.toName === to.name && r.toDb === dbName)
      );
    }
    // If this is a local TO, find shadow TOs in other files pointing to this base table in this db
    return data.crossFileTableRefs.filter(r =>
      r.baseTable === to.baseTable && r.externalFile === dbName
    );
  }, [to, dbName, data]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${to.externalFile ? C.ext.bg : C.to.bg} rounded-xl flex items-center justify-center shadow-lg`}>
            <Layers size={18} className="text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-lg">{to.name}</h2>
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
              Base: {to.baseTable}
              {to.externalFile && <Badge color="ext" size="xs">External: {to.externalFile}</Badge>}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-2 bg-gray-50 dark:bg-gray-900">
        {to.externalFile && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-2">
            <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
              <ExternalLink size={14} />
              <span className="font-medium">Shadow TO</span>
            </div>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              This table occurrence points to <strong>{to.baseTable}</strong> in external file <strong>{to.externalFile}</strong>
            </p>
          </div>
        )}

        {siblingTOs.length > 0 && (
          <Section
            title={to.externalFile ? "Other TOs Referencing Same Table" : "External TOs Pointing to This Table"}
            count={siblingTOs.length}
            icon={<ExternalLink size={14} className="text-red-500" />}
            color="ext"
          >
            <div className="p-3 space-y-2">
              {siblingTOs.map((r, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <NavLink type="to" name={r.toName} small onClick={() => onNav('to', r.toName, r.toDb)} />
                  <span className="text-gray-400 text-xs">in {r.toDb}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Layouts Using This TO" count={layouts.length} icon={<Layout size={14} className="text-emerald-500" />} color="layout">
          <div className="p-3 flex flex-wrap gap-1.5">
            {layouts.map((l, i) => <NavLink key={i} type="layout" name={l.layout} small onClick={() => onNav('layout', l.layout, l.db)} />)}
          </div>
        </Section>

        <Section title="Relationships" count={rels.length} icon={<GitBranch size={14} className="text-pink-500" />} color="rel">
          <div className="p-3 space-y-2 text-sm">
            {rels.map((r, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded text-xs ${r.side === 'left' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                  {r.side}
                </span>
                <NavLink type="rel" name={r.relationship} small onClick={() => onNav('rel', r.relationship, r.db)} />
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
};

export default TODetail;

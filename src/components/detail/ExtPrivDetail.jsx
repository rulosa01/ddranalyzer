import React, { useMemo } from 'react';
import { KeyRound, Shield, ShieldCheck } from 'lucide-react';
import { C } from '../../constants/theme';
import Badge from '../ui/Badge';
import Section from '../ui/Section';

const ExtPrivDetail = ({ extpriv, dbName, data }) => {
  // Find privilege sets that have this extended privilege
  const privSets = useMemo(() => {
    if (!data?.databases) return [];
    const db = data.databases.find(d => d.name === dbName);
    return (db?.privilegeSets || []).filter(ps => extpriv.privilegeSets?.includes(ps.name));
  }, [extpriv, dbName, data]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${C.extpriv.bg} rounded-xl flex items-center justify-center shadow-lg`}>
            <ShieldCheck size={18} className="text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-lg">{extpriv.name}</h2>
            {extpriv.comment && <div className="text-sm text-gray-500 dark:text-gray-400">{extpriv.comment}</div>}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
        {/* Assigned Privilege Sets */}
        <Section title="Assigned to Privilege Sets" count={extpriv.privilegeSets?.length || 0} icon={<KeyRound size={14} className="text-orange-500" />} color="privset">
          <div className="p-3 flex flex-wrap gap-1.5">
            {(extpriv.privilegeSets || []).length > 0 ? extpriv.privilegeSets.map((ps, i) => (
              <Badge key={i} color="privset">{ps}</Badge>
            )) : <span className="text-sm text-gray-400 dark:text-gray-500">Not assigned to any privilege sets</span>}
          </div>
        </Section>

        {/* Show privilege set details */}
        {privSets.length > 0 && (
          <Section title="Privilege Set Details" icon={<Shield size={14} className="text-orange-500" />} color="privset" defaultOpen={false}>
            <div className="p-3 space-y-2">
              {privSets.map((ps, i) => (
                <div key={i} className="text-sm p-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600">
                  <div className="font-medium text-gray-700 dark:text-gray-200">{ps.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Records: {ps.records} · Layouts: {ps.layouts} · Scripts: {ps.scripts}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
};

export default ExtPrivDetail;

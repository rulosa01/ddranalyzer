import React, { useMemo } from 'react';
import { Table, Layout, Code, List, KeyRound, Lock, Settings, Shield, ShieldCheck, User } from 'lucide-react';
import { C } from '../../constants/theme';
import Badge from '../ui/Badge';
import Section from '../ui/Section';

const PrivSetDetail = ({ privset, dbName, data }) => {
  // Find accounts using this privilege set
  const accounts = useMemo(() => {
    if (!data?.databases) return [];
    const db = data.databases.find(d => d.name === dbName);
    return (db?.accounts || []).filter(a => a.privilegeSet === privset.name);
  }, [privset, dbName, data]);

  // Find extended privileges that include this set
  const extPrivs = useMemo(() => {
    if (!data?.databases) return [];
    const db = data.databases.find(d => d.name === dbName);
    return (db?.extendedPrivileges || []).filter(ep => ep.privilegeSets?.includes(privset.name));
  }, [privset, dbName, data]);

  const accessLevels = [
    { label: 'Records', value: privset.records, icon: Table },
    { label: 'Layouts', value: privset.layouts, canCreate: privset.layoutCreation, icon: Layout },
    { label: 'Scripts', value: privset.scripts, canCreate: privset.scriptCreation, icon: Code },
    { label: 'Value Lists', value: privset.valueLists, canCreate: privset.valueListCreation, icon: List },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${C.privset.bg} rounded-xl flex items-center justify-center shadow-lg`}>
            <KeyRound size={18} className="text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-lg">{privset.name}</h2>
            {privset.comment && <div className="text-sm text-gray-500 dark:text-gray-400">{privset.comment}</div>}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
        {/* Access Levels */}
        <Section title="Access Levels" icon={<Shield size={14} className="text-orange-500" />} color="privset" defaultOpen={true}>
          <div className="p-3 space-y-2">
            {accessLevels.map((al, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                  <al.icon size={14} className="text-gray-400 dark:text-gray-500" />
                  {al.label}
                </div>
                <div className="flex items-center gap-2">
                  <Badge color={al.value === 'NoAccess' ? 'ext' : al.value === 'Modifiable' ? 'layout' : 'field'} size="xs">
                    {al.value || 'N/A'}
                  </Badge>
                  {al.canCreate && <Badge color="layout" size="xs">+Create</Badge>}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Permissions */}
        <Section title="Permissions" icon={<Lock size={14} className="text-orange-500" />} color="privset">
          <div className="p-3 flex flex-wrap gap-2">
            {privset.printing && <Badge color="layout" size="xs">Printing</Badge>}
            {privset.exporting && <Badge color="layout" size="xs">Exporting</Badge>}
            {privset.manageAccounts && <Badge color="ext" size="xs">Manage Accounts</Badge>}
            {privset.allowModifyPassword && <Badge color="field" size="xs">Modify Password</Badge>}
            {privset.overrideValidationWarning && <Badge color="field" size="xs">Override Validation</Badge>}
            {!privset.printing && !privset.exporting && !privset.manageAccounts && !privset.allowModifyPassword && (
              <span className="text-sm text-gray-400">No additional permissions</span>
            )}
          </div>
        </Section>

        {/* Menu Access */}
        <Section title="Menu Access" icon={<Settings size={14} className="text-gray-500" />} color="account">
          <div className="p-3">
            <Badge color={privset.menu === 'All' ? 'layout' : privset.menu === 'Minimal' ? 'ext' : 'field'}>
              {privset.menu || 'All'}
            </Badge>
          </div>
        </Section>

        {/* Accounts using this set */}
        <Section title="Accounts Using This Set" count={accounts.length} icon={<User size={14} className="text-slate-500" />} color="account">
          <div className="p-3 flex flex-wrap gap-1.5">
            {accounts.length > 0 ? accounts.map((a, i) => (
              <Badge key={i} color={a.status === 'Active' ? 'account' : 'ext'}>{a.name}</Badge>
            )) : <span className="text-sm text-gray-400">No accounts</span>}
          </div>
        </Section>

        {/* Extended Privileges */}
        {extPrivs.length > 0 && (
          <Section title="Extended Privileges" count={extPrivs.length} icon={<ShieldCheck size={14} className="text-teal-500" />} color="extpriv">
            <div className="p-3 flex flex-wrap gap-1.5">
              {extPrivs.map((ep, i) => <Badge key={i} color="extpriv">{ep.name}</Badge>)}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
};

export default PrivSetDetail;

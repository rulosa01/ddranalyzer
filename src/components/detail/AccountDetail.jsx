import React, { useMemo } from 'react';
import { User, KeyRound, AlertTriangle, FileText } from 'lucide-react';
import { C } from '../../constants/theme';
import Badge from '../ui/Badge';
import Section from '../ui/Section';

const AccountDetail = ({ account, dbName, data }) => {
  // Find accounts with same privilege set
  const samePrivSet = useMemo(() => {
    if (!account.privilegeSet || !data?.databases) return [];
    const db = data.databases.find(d => d.name === dbName);
    return (db?.accounts || []).filter(a => a.privilegeSet === account.privilegeSet && a.name !== account.name);
  }, [account, dbName, data]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${C.account.bg} rounded-xl flex items-center justify-center shadow-lg`}>
            <User size={18} className="text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-lg">{account.name}</h2>
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <Badge color={account.status === 'Active' ? 'layout' : 'ext'} size="xs">{account.status}</Badge>
              {account.managedBy && <span className="text-gray-400 dark:text-gray-500">· {account.managedBy}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
        {/* Security warnings */}
        {account.emptyPassword && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
              <AlertTriangle size={14} />
              <span className="font-medium">Empty Password</span>
            </div>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">This account has no password set.</p>
          </div>
        )}

        {/* Privilege Set */}
        <Section title="Privilege Set" count={1} icon={<KeyRound size={14} className="text-orange-500" />} color="privset">
          <div className="p-3">
            <div className="flex items-center gap-2">
              <Badge color="privset">{account.privilegeSet || 'None'}</Badge>
              {account.changePasswordOnNextLogin && (
                <Badge color="ext" size="xs">Must change password</Badge>
              )}
            </div>
          </div>
        </Section>

        {/* Other accounts with same privilege set */}
        {samePrivSet.length > 0 && (
          <Section title="Other Accounts with Same Privileges" count={samePrivSet.length} icon={<User size={14} className="text-slate-500" />} color="account">
            <div className="p-3 flex flex-wrap gap-1.5">
              {samePrivSet.map((a, i) => (
                <Badge key={i} color="account">{a.name}</Badge>
              ))}
            </div>
          </Section>
        )}

        {/* Description */}
        {account.description && (
          <Section title="Description" icon={<FileText size={14} className="text-gray-500" />} color="account">
            <div className="p-3 text-sm text-gray-600">{account.description}</div>
          </Section>
        )}
      </div>
    </div>
  );
};

export default AccountDetail;

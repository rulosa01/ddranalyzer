import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import Badge from './Badge';

const Section = ({ title, count, icon, color = 'field', defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  if (count === 0 && !children) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl mb-3 overflow-hidden shadow-sm">
      <button onClick={() => setOpen(!open)} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors">
        <span className="text-gray-400 dark:text-gray-500">{open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
        {icon}
        <span className="font-medium text-gray-700 dark:text-gray-200 flex-1 text-sm">{title}</span>
        {count !== undefined && <Badge color={color} size="xs">{count}</Badge>}
      </button>
      {open && children && <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 max-h-64 overflow-auto">{children}</div>}
    </div>
  );
};

export default Section;

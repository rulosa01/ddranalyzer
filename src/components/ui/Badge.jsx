import React from 'react';
import { C } from '../../constants/theme';

const Badge = ({ color = 'field', size = 'sm', children }) => {
  const sz = { xs: 'text-[10px] px-1.5 py-0.5', sm: 'text-xs px-2 py-0.5', md: 'text-sm px-2.5 py-1' };
  return <span className={`${C[color]?.light || 'bg-gray-100'} ${C[color]?.text || 'text-gray-600'} ${C[color]?.border || 'border-gray-200'} border ${sz[size]} rounded-full font-medium inline-flex items-center gap-1`}>{children}</span>;
};

export default Badge;

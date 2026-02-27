import React from 'react';
import { C } from '../../constants/theme';
import Icon from './Icon';

const NavLink = ({ type, name, onClick, small }) => (
  <button onClick={onClick} className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md transition-all ${C[type]?.light || 'bg-gray-100 dark:bg-gray-700'} ${C[type]?.text || 'text-gray-600 dark:text-gray-300'} hover:opacity-80 ${small ? 'text-xs' : 'text-sm'}`}>
    <Icon type={type} size={small ? 10 : 12} />
    <span className="truncate max-w-[180px]">{name}</span>
  </button>
);

export default NavLink;

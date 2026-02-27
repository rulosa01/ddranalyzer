import React from 'react';
import { Table, Grid3X3, Layers, Layout, Code, GitBranch, List, ExternalLink, Database, Settings, Box, User, KeyRound, ShieldCheck } from 'lucide-react';

const Icon = ({ type, size = 14, className = '' }) => {
  const p = { size, className };
  const icons = { table: Table, field: Grid3X3, to: Layers, layout: Layout, script: Code, rel: GitBranch, vl: List, ext: ExternalLink, db: Database, cf: Settings, account: User, privset: KeyRound, extpriv: ShieldCheck };
  const I = icons[type] || Box;
  return <I {...p} />;
};

export default Icon;

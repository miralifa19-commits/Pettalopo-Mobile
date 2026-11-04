import React from 'react';
import { UserAccount } from '../../types';
import { MenuHeaderCard } from '../common/MenuHeaderCard';
interface Props { allMembers?: UserAccount[]; onBack?: () => void; }
const POSITIONS = [
  { title: 'Ketua Gugus Depan', match: (v: string) => v.includes('ketua gugus') },
  { title: 'Pembina', match: (v: string) => v.includes('pembina') && !v.includes('pembantu') },
  { title: 'Pembantu Pembina Putra', match: (v: string) => v.includes('pembantu pembina') && v.includes('putra') },
  { title: 'Pembantu Pembina Putri', match: (v: string) => v.includes('pembantu pembina') && v.includes('putri') },
];
export const MabigusView: React.FC<Props> = ({ allMembers = [], onBack }) => <div className="space-y-4 pb-24">
  <MenuHeaderCard title="Mabigus" subtitle="Majelis Pembimbing Gugus Depan" onBack={onBack || (() => {})} />
  {POSITIONS.map((position) => { const members = allMembers.filter((member) => position.match((member.jabatan || '').toLowerCase())); return <section key={position.title} className="rounded-2xl border border-slate-200 bg-white p-4"><h2 className="text-sm font-bold text-slate-900">{position.title}</h2>{members.length ? members.map((member) => <p key={member.uid || member.username} className="mt-2 text-sm text-slate-700">{member.nama}</p>) : <p className="mt-2 text-xs text-slate-400">Belum ditetapkan</p>}</section>; })}
</div>;

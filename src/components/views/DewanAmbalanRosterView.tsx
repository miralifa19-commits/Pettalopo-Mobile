import React from 'react';
import { UserAccount } from '../../types';
import { MenuHeaderCard } from '../common/MenuHeaderCard';
interface Props { allMembers?: UserAccount[]; onBack?: () => void; }
export const DewanAmbalanRosterView: React.FC<Props> = ({ allMembers = [], onBack }) => {
  const members = allMembers.filter((member) => member.role === 'dewan' || Boolean(member.isDewan))
    .sort((a, b) => (a.satuan || '').localeCompare(b.satuan || '') || (a.dewanJabatan || a.jabatan || '').localeCompare(b.dewanJabatan || b.jabatan || ''));
  return <div className="space-y-4 pb-24">
    <MenuHeaderCard title="Dewan Ambalan" subtitle="Susunan pengurus masa bakti berjalan" onBack={onBack || (() => {})} />
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      {members.length ? <div className="divide-y divide-slate-100">{members.map((member) => <div key={member.uid || member.username} className="py-3 first:pt-0 last:pb-0"><strong className="block text-sm text-slate-900">{member.nama}</strong><span className="mt-1 block text-xs text-slate-500">{member.dewanJabatan || member.jabatan || 'Pengurus Dewan Ambalan'} · {member.satuan} · Sangga {member.sangga}</span></div>)}</div> : <p className="py-6 text-center text-sm text-slate-400">Belum ada anggota Dewan Ambalan yang ditetapkan.</p>}
    </section>
  </div>;
};

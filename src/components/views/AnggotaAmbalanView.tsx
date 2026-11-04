import React, { useMemo, useState } from 'react';
import { UserAccount } from '../../types';
import { MenuHeaderCard } from '../common/MenuHeaderCard';

interface Props { allMembers?: UserAccount[]; onBack?: () => void; }
const UNITS = ['Perintis', 'Penegas', 'Pendobrak', 'Pencoba', 'Pelaksana'];

export const AnggotaAmbalanView: React.FC<Props> = ({ allMembers = [], onBack }) => {
  const [satuan, setSatuan] = useState<'Putra' | 'Putri'>('Putra');
  const members = useMemo(() => allMembers.filter((member) => member.satuan === satuan), [allMembers, satuan]);
  return <div className="space-y-4 pb-24">
    <MenuHeaderCard title="Anggota Ambalan" subtitle="Daftar anggota berdasarkan satuan" onBack={onBack || (() => {})} />
    <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-2">
      {(['Putra', 'Putri'] as const).map((unit) => <button key={unit} type="button" onClick={() => setSatuan(unit)} className={`rounded-xl px-3 py-3 text-sm font-bold ${satuan === unit ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-700'}`}>{unit} <small className="block text-[10px] font-medium opacity-75">Gudep {unit === 'Putra' ? '10-035' : '10-036'}</small></button>)}
    </div>
    {UNITS.map((unit) => {
      const list = members.filter((member) => member.sangga === unit);
      return <section key={unit} className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-2 flex items-center justify-between"><h2 className="text-sm font-bold text-slate-900">Sangga {unit}</h2><span className="text-xs text-slate-400">{list.length} anggota</span></div>
        {list.length ? <div className="divide-y divide-slate-100">{list.map((member) => <p key={member.uid || member.username} className="py-2 text-sm text-slate-700">{member.nama}</p>)}</div> : <p className="text-xs text-slate-400">Belum ada anggota.</p>}
      </section>;
    })}
  </div>;
};

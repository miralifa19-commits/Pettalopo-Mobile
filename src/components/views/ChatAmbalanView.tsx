import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Send, 
  ArrowLeft, 
  Share2, 
  Copy, 
  Sparkles, 
  Crown, 
  Users, 
  GraduationCap, 
  AlertTriangle, 
  CheckCheck, 
  Calendar, 
  Bot, 
  Clock, 
  ChevronRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { UserAccount, ProgramKerjaItem } from '../../types';
import { askKakCikalAI } from '../../services/aiChatService';
import { parseAgendaDate } from '../../utils/agendaDate';
import { 
  get8DewanPositions, 
  isUserInDewan, 
  getUserDewanJabatan, 
  subscribeTo8DewanPositions,
  Dewan8Position 
} from '../../data/dewanStructure';
import { db, auth } from '../../firebase/config';
import { collection, addDoc, onSnapshot, query, limit } from 'firebase/firestore';

interface ChatAmbalanViewProps {
  currentUser: UserAccount;
  programKerjaList?: ProgramKerjaItem[];
  onBack: () => void;
}

type GroupId = 'dewan_ambalan' | 'ambalan_aktif' | 'purna_ambalan';

interface RuangGroup {
  id: GroupId;
  title: string;
  subtitle: string;
  categoryBadge: string;
  icon: React.ReactNode;
  isDewanOnly?: boolean;
  minAgeDays?: number;
  maxAgeDays?: number;
}

interface MessageItem {
  id: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
  senderSangga?: string;
  text: string;
  time: string;
  createdAt?: number;
  createdAtNumber?: number;
  isMe: boolean;
  isAi?: boolean;
  isSystemNotice?: boolean;
  isProactiveReminder?: boolean;
  associatedProker?: ProgramKerjaItem;
}

export const ChatAmbalanView: React.FC<ChatAmbalanViewProps> = ({
  currentUser,
  programKerjaList = [],
  onBack
}) => {
  // Screen: 'list' (Halaman luar 3 grup) vs 'room' (Halaman dalam grup terpilih)
  const [currentScreen, setCurrentScreen] = useState<'list' | 'room'>('list');
  const [activeGroupId, setActiveGroupId] = useState<GroupId>('ambalan_aktif');

  // Umur dihitung dari tanggal lahir profil; anggota Dewan tetap memiliki akses Ambalan selama masa jabatan.
  const userAgeInfo = useMemo(() => {
    const birthValue = (currentUser as any).tanggalLahir || currentUser.ttl;
    let years = currentUser.usia ?? (currentUser as any).usiaTahun ?? 17;
    // Nilai 0 dipakai sebagai penanda usia yang belum berhasil dimuat,
    // bukan usia anggota yang valid.
    if (!Number.isFinite(years) || years <= 0) years = 17;
    if (birthValue) {
      const birth = new Date(`${birthValue}T00:00:00`);
      if (!Number.isNaN(birth.getTime())) {
        const today = new Date();
        years = today.getFullYear() - birth.getFullYear();
        const beforeBirthday = today.getMonth() < birth.getMonth() ||
          (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
        if (beforeBirthday) years--;
      }
    }
    const isPurna = years >= 21;
    return {
      isPurna,
      isCalonPenegak: years >= 14 && years < 21,
      ageYears: years,
      displayLabel: isPurna ? '21 tahun ke atas (Purna Ambalan)' : `${years} tahun (Anggota Ambalan)`
    };
  }, [currentUser.usia, currentUser.ttl, (currentUser as any).tanggalLahir, (currentUser as any).usiaTahun]);

  // Cari kegiatan 1 pekan ke depan dari program kerja
  const upcomingOneWeekProker = useMemo(() => {
    const today = new Date();
    const sorted = programKerjaList
      .map((item) => ({ item, date: parseAgendaDate(item.waktuPelaksanaan) }))
      .filter((entry) => entry.date)
      .sort((a, b) => a.date!.getTime() - b.date!.getTime());

    // Cari kegiatan dalam rentang 1 - 10 hari ke depan, atau proker pertama yang akan datang
    const nextWeekItem = sorted.find((entry) => {
      const diffMs = entry.date!.getTime() - today.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 14;
    }) || sorted[0];

    return nextWeekItem?.item || programKerjaList[0];
  }, [programKerjaList]);

  // Daftar 3 Grup Resmi Ruang Ambalan
  const GROUPS: RuangGroup[] = [
    {
      id: 'dewan_ambalan',
      title: 'Dewan Ambalan',
      subtitle: 'Pusat koordinasi dewan kerja & pendampingan Kak Cikal AI',
      categoryBadge: 'Fungsionaris Dewan • Ada Kak Cikal AI',
      icon: <Crown className="text-[#c81e28]" size={22} />,
      isDewanOnly: true
    },
    {
      id: 'ambalan_aktif',
      title: 'Ambalan La Surullah Petta Lopo',
      subtitle: 'Grup anggota Ambalan (usia 14 sampai sebelum 21 tahun)',
      categoryBadge: 'Penegak Bantara & Laksana Aktif',
      icon: <Users className="text-[#c81e28]" size={22} />
    },
    {
      id: 'purna_ambalan',
      title: 'Purna Ambalan La Surullah Petta Lopo',
      subtitle: 'Wadah silaturahmi alumni dan purna Ambalan (usia 21 tahun ke atas)',
      categoryBadge: 'Purna Bakti & Alumni Ambalan',
      icon: <GraduationCap className="text-[#c81e28]" size={22} />
    }
  ];

  const CHAT_STORAGE_KEY = 'pettalopo_chat_messages_v4';

  // Inisialisasi percakapan di 3 grup: muat dari penyimpanan lokal jika tersedia
  const [messagesByGroup, setMessagesByGroup] = useState<Record<GroupId, MessageItem[]>>(() => {
    try {
      const cached = localStorage.getItem(CHAT_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object' && parsed.ambalan_aktif) {
          return parsed;
        }
      }
    } catch {}

    const proker = upcomingOneWeekProker;
    const proactiveReminderText = proker
      ? `Salam Pramuka! ⚜️ Mengingatkan kakak-kakak Dewan Ambalan, satu pekan ke depan kita ada agenda ambalan:\n\n📌 *${proker.nama}*\n🗓️ *Waktu:* ${proker.waktuPelaksanaan}\n📍 *Tempat:* ${proker.tempat || 'Sanggar Gugus Depan'}\n👥 *Sasaran:* ${proker.sasaran || 'Seluruh Anggota'}\n\nApakah persiapan dewan sudah siap? Apakah butuh bantuan Kak Cikal?\n- Buatkan rundown acara terstruktur?\n- Buat konsep kekinian yang seru & bermakna?\n- Cek kesiapan logistik?\n- Draf undangan resmi WhatsApp?\n\nSilakan mention *@cikal* atau klik tombol di bawah, Kak Cikal siap melayani!`
      : `Salam Pramuka! ⚜️ Mengingatkan kakak-kakak Dewan Ambalan untuk mempersiapkan agenda latihan rutin pekan depan. Butuh bantuan Kak Cikal merancang materi atau rundown? Ketik *@cikal* siap melayani!`;

    return {
      dewan_ambalan: [
        {
          id: 'dewan-sys-1',
          senderId: 'ai_proactive',
          senderName: 'Kak Cikal (AI Ambalan)',
          senderRole: 'Asisten AI Resmi Dewan',
          text: proactiveReminderText,
          time: '07:30',
          isMe: false,
          isAi: true,
          isProactiveReminder: true,
          associatedProker: proker
        },
        {
          id: 'dewan-msg-1',
          senderId: 'pradana',
          senderName: 'Pradana Putra',
          senderRole: 'Pradana',
          senderSangga: 'Perintis',
          text: 'Salam Pramuka! ⚜️ Terima kasih pengingatnya Kak Cikal. Mohon rekan-rekan Dewan Sie Kegiatan dan Sie Perlengkapan merapat ke sanggar siang ini.',
          time: '08:15',
          isMe: false
        }
      ],
      ambalan_aktif: [
        {
          id: 'ambalan-sys-1',
          senderId: 'system',
          senderName: 'Sistem Ambalan',
          text: '📢 [Aturan Ambalan]: Sesuai ketentuan Gerakan Pramuka, anggota yang telah genap berusia 21 tahun secara otomatis dialihkan ke grup Purna Ambalan La Surullah Petta Lopo.',
          time: 'Info',
          isMe: false,
          isSystemNotice: true
        },
        {
          id: 'ambalan-msg-1',
          senderId: 'kerani',
          senderName: 'Kerani Putri',
          senderRole: 'Kerani',
          senderSangga: 'Penegas',
          text: 'Salam Pramuka! ⚜️ Latihan rutin hari Jumat membawa tongkat 160cm dan tali kur untuk materi pionering terpadu.',
          time: 'Kemarin',
          isMe: false
        }
      ],
      purna_ambalan: [
        {
          id: 'purna-sys-1',
          senderId: 'system',
          senderName: 'Sistem Ambalan',
          text: '⚜️ Selamat datang di Ruang Purna Ambalan La Surullah Petta Lopo. Wadah pengabdian berkelanjutan bagi kakak-kakak purna penegak yang telah berusia 21 tahun 1 hari ke atas.',
          time: 'Info',
          isMe: false,
          isSystemNotice: true
        },
        {
          id: 'purna-msg-1',
          senderId: 'alumni_1',
          senderName: 'Kak Syamsuddin, S.Pd',
          senderRole: 'Purna Pradana 2021',
          text: 'Salam Pramuka! Senang melihat adik-adik penegak terus aktif dan berprestasi. Kapan ada waktu kami para purna siap berbagi pengalaman kepemimpinan.',
          time: 'Kemarin',
          isMe: false
        }
      ]
    };
  });

  // Simpan riwayat chat ke penyimpanan lokal setiap kali ada perubahan
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messagesByGroup));
    } catch (err) {
      console.warn('Gagal menyimpan chat ke penyimpanan lokal:', err);
    }
  }, [messagesByGroup]);

  // Sinkronisasi realtime Firestore agar chat tetap ada dan tersinkronisasi antar anggota
  useEffect(() => {
    if (!auth.currentUser) return;
    try {
      const q = query(
        collection(db, 'ambalan_chats'),
        limit(120)
      );
      const unsub = onSnapshot(q, (snapshot) => {
        const incoming: Record<GroupId, MessageItem[]> = {
          dewan_ambalan: [],
          ambalan_aktif: [],
          purna_ambalan: []
        };

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const grp = data.groupId as GroupId;
          if (grp && incoming[grp]) {
            incoming[grp].push({
              id: docSnap.id,
              senderId: data.senderId || '',
              senderName: data.senderName || 'Anggota',
              senderRole: data.senderRole,
              senderSangga: data.senderSangga,
              text: data.text || '',
              time: data.time || '',
              createdAt: typeof data.createdAt === 'number' ? data.createdAt : undefined,
              createdAtNumber: typeof data.createdAtNumber === 'number' ? data.createdAtNumber : undefined,
              isMe: data.senderId === (currentUser.uid || auth.currentUser?.uid),
              isAi: data.isAi === true
            });
          }
        });

        // Dokumen lama dapat memakai createdAtNumber; jangan memakai orderBy
        // createdAt karena Firestore akan menghilangkan dokumen tanpa field itu.
        (Object.keys(incoming) as GroupId[]).forEach((grp) => {
          incoming[grp].sort((left: any, right: any) => {
            const leftTime = Number(left.createdAt ?? left.createdAtNumber ?? 0);
            const rightTime = Number(right.createdAt ?? right.createdAtNumber ?? 0);
            return leftTime - rightTime;
          });
        });

        setMessagesByGroup((prev) => {
          const next = { ...prev };
          let changed = false;
          (['dewan_ambalan', 'ambalan_aktif', 'purna_ambalan'] as GroupId[]).forEach((grp) => {
            if (incoming[grp].length > 0) {
              const defaultSys = prev[grp].filter((m) => m.isSystemNotice || m.isProactiveReminder);
              const map = new Map<string, MessageItem>();
              defaultSys.forEach((m) => map.set(m.id, m));
              prev[grp].forEach((m) => map.set(m.id, m));
              incoming[grp].forEach((m) => map.set(m.id, m));
              next[grp] = Array.from(map.values());
              changed = true;
            }
          });
          return changed ? next : prev;
        });
      }, (error) => {
        console.warn('Firestore ambalan_chats listener info:', error?.message);
      });

      return () => unsub();
    } catch (e) {
      console.warn('Gagal inisialisasi listener chat Firestore:', e);
    }
  }, [currentUser.uid]);

  const [inputText, setInputText] = useState('');
  // Mencegah satu aksi kirim diproses lebih dari sekali.
  const sendingMessageRef = useRef(false);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [copyToast, setCopyToast] = useState(false);
  const [purnaBlockedModal, setPurnaBlockedModal] = useState(false);

  // 8 Roda Dewan Ambalan Otomatis State
  const [dewan8Positions, setDewan8Positions] = useState<Dewan8Position[]>(() => get8DewanPositions());
  const [dewanBlockedModal, setDewanBlockedModal] = useState<boolean>(false);

  useEffect(() => subscribeTo8DewanPositions(setDewan8Positions), []);

  const userDewanJabatan = useMemo(() => getUserDewanJabatan(currentUser, dewan8Positions), [currentUser, dewan8Positions]);
  const isCurrentUserDewan = useMemo(() => isUserInDewan(currentUser, dewan8Positions), [currentUser, dewan8Positions]);

  useEffect(() => {
    if (activeGroupId === 'dewan_ambalan' && !isCurrentUserDewan) {
      setCurrentScreen('list');
      setActiveGroupId(userAgeInfo.isPurna ? 'purna_ambalan' : 'ambalan_aktif');
    }
  }, [activeGroupId, isCurrentUserDewan, userAgeInfo.isPurna]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesByGroup, activeGroupId, currentScreen]);

  const activeGroup = GROUPS.find((g) => g.id === activeGroupId) || GROUPS[0];
  const activeMessages = messagesByGroup[activeGroupId] || [];
  const visibleGroups = isCurrentUserDewan
    ? GROUPS.filter((group) => group.id !== 'purna_ambalan')
    : userAgeInfo.isPurna
    ? GROUPS.filter((group) => group.id === 'purna_ambalan')
    : userAgeInfo.isCalonPenegak
    ? GROUPS.filter((group) => group.id === 'ambalan_aktif')
    : [];

  // Handler memilih grup
  const handleSelectGroup = (groupId: GroupId) => {
    // Cek proteksi usia: anggota non-Dewan berusia 21 tahun ke atas masuk grup Purna
    if (groupId === 'ambalan_aktif' && userAgeInfo.isPurna && !isCurrentUserDewan) {
      setPurnaBlockedModal(true);
      return;
    }

    // Cek proteksi dewan ambalan: Hanya untuk fungsionaris dewan / pembina
    if (groupId === 'dewan_ambalan' && !isCurrentUserDewan) {
      setDewanBlockedModal(true);
      return;
    }

    setActiveGroupId(groupId);
    setCurrentScreen('room');
  };

  // Kirim pesan
  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = (customText || inputText).trim();
    if (!textToSend || isLoadingAi || sendingMessageRef.current) return;
    sendingMessageRef.current = true;

    const resolvedRole = userDewanJabatan || (currentUser.role === 'admin' ? 'Pembina' : currentUser.dewanJabatan || 'Anggota');

    const newMsg: MessageItem = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.uid || 'me',
      senderName: currentUser.nama,
      senderRole: resolvedRole,
      senderSangga: currentUser.sangga,
      text: textToSend,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      isMe: true
    };

    if (!customText) setInputText('');

    // Gunakan ID dokumen Firestore sebagai ID tampilan agar snapshot realtime
    // memperbarui pesan yang sama, bukan menambahkan salinan kedua.
    if (auth.currentUser) {
      try {
        const savedMessage = await addDoc(collection(db, 'ambalan_chats'), {
          groupId: activeGroupId,
          senderId: auth.currentUser.uid,
          senderName: currentUser.nama || 'Anggota',
          senderRole: resolvedRole,
          senderSangga: currentUser.sangga || '',
          text: textToSend,
          time: newMsg.time,
          createdAt: Date.now()
        });
        setMessagesByGroup((prev) => {
          const current = prev[activeGroupId] || [];
          if (current.some((message) => message.id === savedMessage.id)) return prev;
          return { ...prev, [activeGroupId]: [...current, { ...newMsg, id: savedMessage.id }] };
        });
      } catch (err) {
        console.warn('Gagal menyimpan pesan chat ke Firestore:', err);
        setMessagesByGroup((prev) => ({
          ...prev,
          [activeGroupId]: [...(prev[activeGroupId] || []), newMsg]
        }));
      }
    } else {
      setMessagesByGroup((prev) => ({
        ...prev,
        [activeGroupId]: [...(prev[activeGroupId] || []), newMsg]
      }));
    }

    // Aturan Kak Cikal: HANYA ada di grup Dewan Ambalan dan HANYA merespon bila di-@ atau disebut
    const isMentioningCikal = 
      textToSend.toLowerCase().includes('@cikal') || 
      textToSend.toLowerCase().includes('@kak cikal') ||
      textToSend.toLowerCase().includes('kak cikal') ||
      textToSend.toLowerCase().includes('cikal');

    if (activeGroupId === 'dewan_ambalan' && isMentioningCikal) {
      setIsLoadingAi(true);
      try {
        const cleanPrompt = textToSend.replace(/@cikal|@kak cikal/gi, '').trim();
        const responseText = await askKakCikalAI({
          prompt: cleanPrompt || 'Halo Kak Cikal, kami butuh bantuan persiapan dewan ambalan.',
          programKerjaList,
          actionType: textToSend.toLowerCase().includes('undangan') ? 'undangan' : 'rancang',
          selectedProker: upcomingOneWeekProker
        });

        const aiResponseMsg: MessageItem = {
          id: `ai-${Date.now()}`,
          senderId: 'ai',
          senderName: 'Kak Cikal (AI Ambalan)',
          senderRole: 'Asisten AI Resmi Dewan',
          text: `Salam Pramuka! ⚜️ Kak Cikal siap melayani kakak-kakak Dewan Ambalan.\n\n${responseText}`,
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          isMe: false,
          isAi: true
        };

        setMessagesByGroup((prev) => ({
          ...prev,
          dewan_ambalan: [...(prev.dewan_ambalan || []), aiResponseMsg]
        }));

        if (auth.currentUser) {
          addDoc(collection(db, 'ambalan_chats'), {
            groupId: 'dewan_ambalan',
            senderId: 'ai',
            senderName: 'Kak Cikal (AI Ambalan)',
            senderRole: 'Asisten AI Resmi Dewan',
            text: aiResponseMsg.text,
            time: aiResponseMsg.time,
            isAi: true,
            createdAt: Date.now()
          }).catch((err) => {
            console.warn('Gagal simpan respon AI ke Firestore:', err);
          });
        }
      } catch (err) {
        console.error('Kak Cikal error:', err);
      } finally {
        setIsLoadingAi(false);
      }
    }
    sendingMessageRef.current = false;
  };

  // Respon cepat dari pengingat proker Kak Cikal
  const handleQuickActionFromReminder = (actionText: string) => {
    handleSendMessage(undefined, `@Kak Cikal ${actionText} untuk kegiatan ${upcomingOneWeekProker?.nama || 'pekan depan'}`);
  };

  const handleShareToWhatsApp = (text: string) => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopyText = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 font-sans overflow-hidden select-none">
      
      {/* Toast Notification */}
      {copyToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-60 bg-slate-900/90 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2">
          <Check size={14} className="text-emerald-400" />
          <span>Teks berhasil disalin!</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* HALAMAN 1: HALAMAN LUAR - RUANG AMBALAN (DAFTAR 3 GRUP)   */}
      {/* ======================================================== */}
      {currentScreen === 'list' && (
        <div className="flex flex-col h-full min-h-0 bg-slate-50">
          
          {/* Header Merah Ruang Ambalan */}
          <header className="bg-[#c81e28] text-white px-4 py-3.5 shadow-md shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                type="button" 
                onClick={onBack}
                className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white"
                title="Kembali ke Beranda"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-base font-black tracking-tight leading-tight">Ruang Ambalan</h1>
                <span className="text-[10px] text-red-100 font-medium">Gudep 10-035 & 10-036 La Surullah Petta Lopo</span>
              </div>
            </div>

          </header>

          {/* List Grup Ambalan Tanpa Banner (Dewan Ambalan, Ambalan La Surullah Petta Lopo, Purna Ambalan) */}
          <div className="p-4 space-y-2.5 flex-1 min-h-0 overflow-y-auto overscroll-contain">
            {visibleGroups.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center text-xs text-slate-600">
                Akses grup Ambalan tersedia setelah memasuki usia Calon Penegak (14 tahun).
              </div>
            )}
            {visibleGroups.map((grp) => {
              return (
                <div
                  key={grp.id}
                  onClick={() => handleSelectGroup(grp.id)}
                  className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-[#c81e28] transition-all cursor-pointer flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-sm text-slate-900 leading-snug">
                      {grp.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-normal">
                      {grp.subtitle}
                    </p>
                  </div>

                  <ChevronRight size={18} className="text-slate-400 shrink-0" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* HALAMAN 2: HALAMAN DALAM GRUP (RUANG PERCAKAPAN MERAH)    */}
      {/* ======================================================== */}
      {currentScreen === 'room' && (
        <div className="flex flex-col h-full min-h-0 bg-[#f8f9fa]">
          
          {/* Header Merah Ruang Grup */}
          <header className="bg-[#c81e28] text-white px-3.5 py-3 shadow-md shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setCurrentScreen('list')}
                className="p-1 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white"
                title="Kembali ke Daftar Ruang Ambalan"
              >
                <ArrowLeft size={20} />
              </button>

              <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/20 text-white shrink-0">
                {activeGroup.icon}
              </div>

              <div className="min-w-0">
                <h2 className="text-sm font-black truncate leading-tight">
                  {activeGroup.title}
                </h2>
                <span className="text-[10px] text-red-100 truncate block">
                  {activeGroupId === 'dewan_ambalan'
                    ? 'Fungsionaris Dewan • Dilengkapi Kak Cikal AI'
                    : activeGroupId === 'ambalan_aktif'
                    ? 'Penegak Aktif Ambalan La Surullah Petta Lopo'
                    : 'Purna Ambalan La Surullah Petta Lopo'}
                </span>
              </div>
            </div>

            {/* Kak Cikal Tag/Indicator (Hanya di Dewan Ambalan) */}
            {activeGroupId === 'dewan_ambalan' && (
              <span className="px-2 py-1 rounded-full bg-white text-[#c81e28] text-[10px] font-black flex items-center gap-1 shadow-xs shrink-0">
                <Bot size={12} />
                <span>@cikal AI</span>
              </span>
            )}
          </header>

          {/* Notice khusus grup Dewan Ambalan terkait cara memanggil Kak Cikal */}
          {activeGroupId === 'dewan_ambalan' && (
            <div className="bg-red-50 border-b border-red-200 px-3.5 py-2 flex items-center justify-between text-[11px] text-slate-700 shrink-0">
              <span className="flex items-center gap-1.5 font-medium">
                <Bot size={14} className="text-[#c81e28] shrink-0" />
                <span>Ketik <strong>@cikal</strong> di pesan bila butuh bantuan konsep/rundown.</span>
              </span>
              <button
                type="button"
                onClick={() => setInputText((prev) => (prev ? `${prev} @cikal ` : '@cikal '))}
                className="px-2 py-0.5 rounded-md bg-[#c81e28] text-white font-bold text-[10px] hover:bg-[#a91b24]"
              >
                + @cikal
              </button>
            </div>
          )}

          {/* Chat Messages Container */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3.5 space-y-3">
            {activeMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}
              >
                {/* System Notice Bubble */}
                {msg.isSystemNotice ? (
                  <div className="w-full text-center my-2">
                    <span className="inline-block p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold max-w-sm shadow-xs">
                      {msg.text}
                    </span>
                  </div>
                ) : (
                  <div
                    className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-3.5 shadow-xs relative text-xs leading-relaxed ${
                      msg.isMe
                        ? 'bg-[#c81e28] text-white rounded-tr-none'
                        : msg.isAi
                        ? 'bg-white border-2 border-red-300 text-slate-900 rounded-tl-none shadow-md'
                        : 'bg-white border border-slate-200 text-slate-900 rounded-tl-none'
                    }`}
                  >
                    {/* Header Pengirim */}
                    {!msg.isMe && (
                      <div className="font-extrabold text-[11px] mb-1.5 flex items-center justify-between gap-2 border-b border-slate-100 pb-1">
                        <span className={msg.isAi ? 'text-[#c81e28] flex items-center gap-1' : 'text-slate-800'}>
                          {msg.isAi && <Bot size={13} />}
                          {msg.senderName}
                        </span>
                        {msg.senderRole && (
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            msg.isAi ? 'bg-red-100 text-[#b71922]' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {msg.senderRole}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Message Body */}
                    <div className="whitespace-pre-wrap font-sans text-xs">
                      {msg.text}
                    </div>

                    {/* Proactive Reminder Quick Action Buttons (Hanya dari Kak Cikal di Dewan) */}
                    {msg.isProactiveReminder && msg.associatedProker && (
                      <div className="mt-3 pt-2.5 border-t border-red-100 space-y-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#b71922] block">
                          Tanggapan Cepat Dewan untuk Kak Cikal:
                        </span>
                        <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold">
                          <button
                            type="button"
                            onClick={() => handleQuickActionFromReminder('Tolong buatkan rundown acara terstruktur')}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-[#b71922] text-left border border-red-200"
                          >
                            📝 Buat Rundown Acara
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickActionFromReminder('Tolong buatkan konsep kekinian yang seru & bermakna')}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-[#b71922] text-left border border-red-200"
                          >
                            💡 Konsep Kekinian
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickActionFromReminder('Tolong list kelengkapan logistik & perlengkapan')}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-[#b71922] text-left border border-red-200"
                          >
                            📋 Cek Perlengkapan
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickActionFromReminder('Tolong buatkan draf undangan resmi')}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-[#b71922] text-left border border-red-200"
                          >
                            ✉️ Draf Undangan Resmi
                          </button>
                        </div>
                      </div>
                    )}

                    {/* AI Sharing Action Buttons */}
                    {msg.isAi && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleShareToWhatsApp(msg.text)}
                          className="py-1 px-2.5 rounded-lg bg-[#25d366] hover:bg-[#1ebd59] text-white font-extrabold text-[10px] flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <Share2 size={11} />
                          <span>Bagikan ke WA</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyText(msg.text)}
                          className="py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                        >
                          <Copy size={11} />
                          <span>Salin</span>
                        </button>
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className={`flex items-center justify-end gap-1 text-[9px] mt-1.5 ${
                      msg.isMe ? 'text-red-200' : 'text-slate-400'
                    }`}>
                      <span>{msg.time}</span>
                      {msg.isMe && <CheckCheck size={13} className="text-white" />}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isLoadingAi && (
              <div className="flex items-start">
                <div className="bg-white rounded-2xl rounded-tl-none p-3 shadow-xs border border-red-200 text-xs text-slate-600 flex items-center gap-2">
                  <Bot size={16} className="text-[#c81e28] animate-bounce" />
                  <span>Kak Cikal sedang merancang jawaban untuk Dewan Ambalan...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Chat Input Bar */}
          <form 
            onSubmit={(e) => handleSendMessage(e)}
            className="p-3 bg-white flex items-center gap-2 shrink-0 border-t border-slate-200 shadow-md"
          >
            <div className="flex-1 flex items-center bg-slate-50 rounded-2xl px-3.5 py-2 border border-slate-200 focus-within:border-red-400">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  activeGroupId === 'dewan_ambalan'
                    ? 'Tulis pesan dewan (ketik @cikal untuk tanya AI)...'
                    : `Tulis pesan di ${activeGroup.title}...`
                }
                className="w-full text-xs text-slate-800 bg-transparent focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={!inputText.trim() || isLoadingAi}
              className="grid h-10 w-10 place-items-center rounded-2xl bg-[#c81e28] hover:bg-[#a91b24] text-white disabled:opacity-40 transition-all shrink-0 shadow-md active:scale-95 cursor-pointer"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL BLOCKED: 21 TAHUN 1 HARI OTOMATIS KE PURNA AMBALAN */}
      {/* ======================================================== */}
      {purnaBlockedModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-3.5 animate-in zoom-in-95 duration-150">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-amber-700 mx-auto">
              <GraduationCap size={32} />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-black text-base text-slate-900">
                Transisi ke Purna Ambalan
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Berdasarkan AD/ART Gerakan Pramuka, anggota yang telah mencapai umur <strong>21 tahun</strong> secara otomatis beralih status dari Penegak Aktif menjadi <strong>Purna Ambalan La Surullah Petta Lopo</strong>.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 text-center">
              Akses grup Anda telah dialihkan ke grup <strong>Purna Ambalan La Surullah Petta Lopo</strong>.
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPurnaBlockedModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  setPurnaBlockedModal(false);
                  setActiveGroupId('purna_ambalan');
                  setCurrentScreen('room');
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#c81e28] hover:bg-[#a91b24] text-white font-extrabold text-xs shadow-xs"
              >
                Buka Purna Ambalan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL BLOCKED: KHUSUS 8 FUNGSIONARIS DEWAN AMBALAN       */}
      {/* ======================================================== */}
      {dewanBlockedModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-3.5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-red-100 text-[#c81e28] mx-auto">
              <Crown size={30} />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-black text-base text-slate-900">
                Grup Khusus Dewan Ambalan
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Aplikasi otomatis mendeteksi bahwa akun Kak <strong>{currentUser.nama}</strong> saat ini belum terdaftar dalam 8 Roda Kepengurusan Dewan Ambalan La Surullah Petta Lopo.
              </p>
            </div>

            {/* List 8 Dewan Saat Ini */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500">
                <span>8 Roda Kepengurusan Saat Ini</span>
                <span>Fungsionaris</span>
              </div>
              <div className="space-y-1 text-[11px] max-h-36 overflow-y-auto">
                {dewan8Positions.map((pos) => (
                  <div key={pos.id} className="flex justify-between items-center py-0.5">
                    <span className="font-semibold text-slate-700">{pos.jabatan}</span>
                    <span className="font-bold text-slate-900">{pos.memberName}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[10px] text-slate-500 text-center leading-normal">
              Hak akses Dewan diberikan dan dialihkan oleh Admin Utama melalui menu <strong>Kelola Aplikasi → Kelola Dewan</strong>.
            </p>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => setDewanBlockedModal(false)}
                className="w-full py-2.5 rounded-xl bg-[#c81e28] hover:bg-[#a91b24] text-white font-extrabold text-xs shadow-xs cursor-pointer"
              >
                Tutup &amp; Buka Grup Lain
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

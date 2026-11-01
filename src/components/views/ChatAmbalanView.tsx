import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  ListPlus, 
  Plus, 
  Check, 
  CheckCheck, 
  Users, 
  X, 
  Calendar, 
  ShieldCheck, 
  MessageSquare,
  Sparkles,
  ClipboardList,
  Edit2,
  Trash2
} from 'lucide-react';
import { ChatMessage, ChatListItem, UserAccount } from '../../types';
import { 
  subscribeToAmbalanChats, 
  sendAmbalanChatMessage, 
  updateAmbalanChatList,
  DEFAULT_INITIAL_CHATS
} from '../../services/firebaseService';

interface ChatAmbalanViewProps {
  currentUser: UserAccount;
}

export const ChatAmbalanView: React.FC<ChatAmbalanViewProps> = ({ currentUser }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(DEFAULT_INITIAL_CHATS);
  const [inputText, setInputText] = useState('');
  
  // Modal State for creating a new list
  const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [firstItemNote, setFirstItemNote] = useState('');

  // Modal State for adding/editing my name on an existing list
  const [activeListMessage, setActiveListMessage] = useState<ChatMessage | null>(null);
  const [myListNote, setMyListNote] = useState('');

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time chat messages
  useEffect(() => {
    const unsubscribe = subscribeToAmbalanChats((msgs) => {
      setMessages(msgs);
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Send regular text message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;

    const newMsg: ChatMessage = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderId: currentUser.uid || currentUser.username,
      senderName: currentUser.nama,
      senderAvatar: currentUser.foto,
      senderGudep: currentUser.gudep,
      senderSangga: currentUser.sangga,
      senderRole: currentUser.role,
      type: 'text',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      createdAtNumber: Date.now()
    };

    setInputText('');
    await sendAmbalanChatMessage(newMsg);
  };

  // Create a new List message
  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newListTitle.trim();
    if (!title) return;

    const firstItem: ChatListItem = {
      id: `item_${Date.now()}`,
      name: currentUser.nama,
      userId: currentUser.uid || currentUser.username,
      userGudep: currentUser.gudep,
      userSangga: currentUser.sangga,
      addedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      note: firstItemNote.trim() || undefined
    };

    const newListMsg: ChatMessage = {
      id: `list_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderId: currentUser.uid || currentUser.username,
      senderName: currentUser.nama,
      senderAvatar: currentUser.foto,
      senderGudep: currentUser.gudep,
      senderSangga: currentUser.sangga,
      senderRole: currentUser.role,
      type: 'list',
      listTitle: title,
      listItems: [firstItem],
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      createdAtNumber: Date.now()
    };

    setIsCreateListModalOpen(false);
    setNewListTitle('');
    setFirstItemNote('');
    await sendAmbalanChatMessage(newListMsg);
  };

  // Open modal to add or edit my name on an existing list
  const handleOpenAddToList = (msg: ChatMessage) => {
    setActiveListMessage(msg);
    const myUid = currentUser.uid || currentUser.username;
    const existing = msg.listItems?.find(i => i.userId === myUid || i.name === currentUser.nama);
    setMyListNote(existing?.note || '');
  };

  // Submit adding or editing my entry on the list
  const handleSaveMyNameOnList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeListMessage) return;

    const myUid = currentUser.uid || currentUser.username;
    const currentItems = activeListMessage.listItems || [];
    const existingIndex = currentItems.findIndex(i => i.userId === myUid || i.name === currentUser.nama);

    let updatedList: ChatListItem[];
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    if (existingIndex >= 0) {
      // Edit existing entry
      updatedList = currentItems.map((item, idx) => 
        idx === existingIndex 
          ? { ...item, note: myListNote.trim() || undefined, addedAt: nowTime }
          : item
      );
    } else {
      // Append new entry
      const newItem: ChatListItem = {
        id: `item_${Date.now()}`,
        name: currentUser.nama,
        userId: myUid,
        userGudep: currentUser.gudep,
        userSangga: currentUser.sangga,
        addedAt: nowTime,
        note: myListNote.trim() || undefined
      };
      updatedList = [...currentItems, newItem];
    }

    // Bumps to bottom without creating duplicate spam!
    await updateAmbalanChatList(activeListMessage.id, updatedList, true);
    setActiveListMessage(null);
    setMyListNote('');
  };

  // Remove my entry from the list
  const handleRemoveMyNameFromList = async () => {
    if (!activeListMessage) return;
    const myUid = currentUser.uid || currentUser.username;
    const currentItems = activeListMessage.listItems || [];
    const updatedList = currentItems.filter(i => i.userId !== myUid && i.name !== currentUser.nama);

    await updateAmbalanChatList(activeListMessage.id, updatedList, true);
    setActiveListMessage(null);
    setMyListNote('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-125px)] sm:h-[calc(100vh-135px)] bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 shadow-md font-sans">
      
      {/* WA STYLE GROUP HEADER (Tema Merah Putih) */}
      <div className="bg-gradient-to-r from-[#e51c24] to-[#b81219] text-white px-4 py-3 flex items-center justify-between shadow-xs border-b border-red-700 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-full bg-white text-[#e51c24] flex items-center justify-center font-black text-sm shadow-xs border border-white shrink-0">
            ⚜️
          </div>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-black truncate leading-tight">
              Ambalan La Surullah
            </h2>
            <p className="text-[10px] text-white/90 truncate flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Grup Koordinasi Gudep 10-035 & 10-036</span>
            </p>
          </div>
        </div>

        {/* Action: Buat List Baru */}
        <button
          onClick={() => setIsCreateListModalOpen(true)}
          className="px-2.5 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-xs transition-all active:scale-95 shrink-0"
          title="Buat List Nama Baru Tanpa Spam"
        >
          <ListPlus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="hidden xs:inline">+ List Nama</span>
        </button>
      </div>

      {/* CHAT MESSAGES SCROLL AREA */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-[#fdf8f6]">
        
        {/* Anti-Spam Notice */}
        <div className="max-w-xs mx-auto p-2 bg-amber-50 rounded-xl border border-amber-200 text-center text-[10px] text-amber-900 leading-tight">
          💡 <strong>Fitur List Anti-Spam:</strong> Klik tombol <strong>+</strong> pada pesan list untuk mendaftarkan nama. Pesan akan diperbarui dan berpindah ke bawah tanpa membuat chat berulang!
        </div>

        {messages.map((msg) => {
          const isMe = msg.senderId === (currentUser.uid || currentUser.username) || msg.senderName === currentUser.nama;

          // RENDER INTERACTIVE LIST MESSAGE
          if (msg.type === 'list') {
            const listItems = msg.listItems || [];
            const myUid = currentUser.uid || currentUser.username;
            const isMyNameInList = listItems.some(i => i.userId === myUid || i.name === currentUser.nama);

            return (
              <div key={msg.id} className="flex justify-center my-2">
                <div className="w-full max-w-md bg-white rounded-2xl border-2 border-[#e51c24] shadow-md overflow-hidden animate-in fade-in zoom-in-98 duration-150">
                  
                  {/* List Header */}
                  <div className="bg-gradient-to-r from-[#e51c24] to-[#c9141b] text-white p-3 flex items-center justify-between border-b border-red-700">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shrink-0">
                        <ClipboardList className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] uppercase font-mono font-bold text-amber-200 block">
                          List Nama Resmi Ambalan:
                        </span>
                        <h4 className="text-xs sm:text-sm font-black truncate leading-tight">
                          {msg.listTitle}
                        </h4>
                      </div>
                    </div>

                    {/* Tombol "+" Gokil: Klik untuk edit / list nama */}
                    <button
                      onClick={() => handleOpenAddToList(msg)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md border-2 border-white transition-all active:scale-95 shrink-0 ml-2 ${
                        isMyNameInList
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                          : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                      }`}
                      title={isMyNameInList ? 'Ubah data saya di list' : 'Klik + untuk tambah nama ke list'}
                    >
                      {isMyNameInList ? <Edit2 className="w-3.5 h-3.5" /> : <Plus className="w-5 h-5 stroke-[3]" />}
                    </button>
                  </div>

                  {/* List Body */}
                  <div className="p-3 space-y-1.5 max-h-60 overflow-y-auto text-xs bg-white">
                    {listItems.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-2">
                        Belum ada yang mengisi list. Klik tombol + di atas untuk menjadi yang pertama!
                      </p>
                    ) : (
                      listItems.map((item, idx) => {
                        const isThisMe = item.userId === myUid || item.name === currentUser.nama;

                        return (
                          <div
                            key={item.id || idx}
                            className={`flex items-start justify-between p-2 rounded-xl text-xs transition-colors ${
                              isThisMe 
                                ? 'bg-red-50/80 border border-red-200' 
                                : 'bg-slate-50 border border-slate-100'
                            }`}
                          >
                            <div className="flex items-start gap-2 min-w-0 pr-2">
                              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-mono">
                                {idx + 1}
                              </span>
                              <div className="min-w-0">
                                <span className={`font-bold block truncate ${isThisMe ? 'text-[#e51c24]' : 'text-slate-800'}`}>
                                  {item.name} {isThisMe && '(Saya)'}
                                </span>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                                  {item.userSangga && <span>Sangga {item.userSangga}</span>}
                                  {item.userGudep && <span>• Gudep {item.userGudep}</span>}
                                  {item.note && <span className="text-amber-800 italic">" {item.note} "</span>}
                                </div>
                              </div>
                            </div>

                            <span className="text-[9px] font-mono text-slate-400 shrink-0 mt-0.5">
                              {item.addedAt}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* List Footer with Quick Add Button */}
                  <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">
                      Total: <strong>{listItems.length}</strong> anggota terdaftar
                    </span>

                    <button
                      onClick={() => handleOpenAddToList(msg)}
                      className="text-xs font-bold text-[#e51c24] hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isMyNameInList ? 'Edit Nama Saya' : 'Tambah Nama Saya'}</span>
                    </button>
                  </div>

                </div>
              </div>
            );
          }

          // RENDER REGULAR TEXT MESSAGE
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-full`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 py-2 text-xs shadow-xs relative ${
                  isMe
                    ? 'bg-red-600 text-white rounded-tr-xs border border-red-700'
                    : 'bg-white text-slate-800 rounded-tl-xs border border-slate-200'
                }`}
              >
                {/* Sender Header for Incoming */}
                {!isMe && (
                  <div className="flex items-center gap-1.5 mb-1 pb-1 border-b border-slate-100 text-[10px] font-bold">
                    <span className="text-[#e51c24]">{msg.senderName}</span>
                    {msg.senderSangga && (
                      <span className="text-slate-400 font-normal">
                        ({msg.senderSangga})
                      </span>
                    )}
                    {msg.senderRole === 'admin' && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 text-[9px] font-black">
                        👑 Pembina
                      </span>
                    )}
                  </div>
                )}

                {/* Text Content */}
                <p className="leading-relaxed whitespace-pre-wrap break-words">
                  {msg.text}
                </p>

                {/* Timestamp & Status */}
                <div className={`flex items-center justify-end gap-1 text-[9px] mt-1 ${isMe ? 'text-white/80' : 'text-slate-400'}`}>
                  <span>{msg.timestamp}</span>
                  {isMe && <CheckCheck className="w-3 h-3 text-amber-300 inline" />}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={chatBottomRef} />
      </div>

      {/* CHAT INPUT BAR (TEMA MERAH PUTIH) */}
      <form onSubmit={handleSendMessage} className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
        
        {/* Tombol Buat List Nama */}
        <button
          type="button"
          onClick={() => setIsCreateListModalOpen(true)}
          className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-[#e51c24] transition-colors shrink-0"
          title="Buat List Nama Baru"
        >
          <ListPlus className="w-5 h-5 text-[#e51c24]" />
        </button>

        {/* Input Text */}
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ketik pesan koordinasi..."
          className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#e51c24]"
        />

        {/* Tombol Kirim */}
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2.5 rounded-xl bg-[#e51c24] text-white hover:bg-[#c9141b] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* MODAL 1: BUAT LIST BARU */}
      {isCreateListModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <ListPlus className="w-4 h-4 text-[#e51c24]" />
                <span>Buat List Nama Baru</span>
              </h3>
              <button onClick={() => setIsCreateListModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateList} className="mt-3 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Judul List Nama *
                </label>
                <input
                  type="text"
                  required
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  placeholder="Contoh: Peserta Kemah Bakti atau Jadwal Piket"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#e51c24]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Catatan Anda (Opsional):
                </label>
                <input
                  type="text"
                  value={firstItemNote}
                  onChange={(e) => setFirstItemNote(e.target.value)}
                  placeholder="Contoh: Siap perlengkapan tenda"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none"
                />
              </div>

              <div className="p-2.5 bg-amber-50 rounded-xl text-[10px] text-amber-900">
                Nama Anda (<strong>{currentUser.nama}</strong>) akan otomatis terdaftar sebagai nomor 1 pada list ini.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateListModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#e51c24] text-white font-black shadow-xs border border-red-700 hover:bg-[#c9141b]"
                >
                  Kirim List ke Grup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT / TAMBAH NAMA SAYA PADA LIST (ICON + CLICK) */}
      {activeListMessage && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-[#e51c24]" />
                <span>Isi / Edit List Nama</span>
              </h3>
              <button onClick={() => setActiveListMessage(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMyNameOnList} className="mt-3 space-y-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-mono">List yang dituju:</span>
                <strong className="text-slate-900 font-bold block mt-0.5">
                  {activeListMessage.listTitle}
                </strong>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Anda:
                </label>
                <input
                  type="text"
                  disabled
                  value={currentUser.nama}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 font-bold cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Catatan Tambahan (Opsional):
                </label>
                <input
                  type="text"
                  value={myListNote}
                  onChange={(e) => setMyListNote(e.target.value)}
                  placeholder="Contoh: Bawa kompor lapangan / Hadir jam 08.00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#e51c24]"
                />
              </div>

              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-[10px] text-emerald-900 leading-tight">
                ✨ Nama Anda akan langsung masuk ke dalam list. Chat list ini akan otomatis diperbarui dan <strong>berpindah ke bawah</strong> tanpa menjadi spam chat!
              </div>

              <div className="pt-2 flex items-center justify-between gap-2">
                {/* Opsi batalkan nama jika sudah ada di list */}
                {activeListMessage.listItems?.some(
                  i => i.userId === (currentUser.uid || currentUser.username) || i.name === currentUser.nama
                ) ? (
                  <button
                    type="button"
                    onClick={handleRemoveMyNameFromList}
                    className="px-3 py-1.5 rounded-xl bg-red-50 text-red-600 font-bold text-xs hover:bg-red-100 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Nama</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveListMessage(null)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-[#e51c24] text-white font-black shadow-xs border border-red-700 hover:bg-[#c9141b]"
                  >
                    Simpan ke List
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

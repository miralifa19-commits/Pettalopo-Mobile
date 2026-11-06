import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase/config';
import {
  ProgramKerjaItem,
  AttendanceSession,
  AttendanceRecord,
  UserAccount,
  MateriBelajar
} from '../types';

/* ==========================================================
 *  1. ATTENDANCE SESSIONS & RECORDS
 * ========================================================== */

const SESSIONS_PATH = 'attendance_sessions';
const RECORDS_PATH = 'attendance_records';
const PROKER_PATH = 'program_kerja';
const USERS_PATH = 'users';

// Realtime active attendance session
export function subscribeToActiveSession(
  callback: (session: AttendanceSession | null) => void,
  onError?: (err: unknown) => void
) {
  try {
    const q = query(collection(db, SESSIONS_PATH));
    return onSnapshot(
      q,
      (snapshot) => {
        let active: AttendanceSession | null = null;
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as AttendanceSession;
          if (data.isOpen) {
            active = { ...data, id: docSnap.id };
          }
        });
        callback(active);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, SESSIONS_PATH);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, SESSIONS_PATH);
  }
}

// Toggle or Create Attendance Session (Admin only)
export async function toggleAttendanceSession(
  sessionId: string,
  isOpen: boolean,
  sessionData?: Partial<AttendanceSession>
): Promise<void> {
  const path = `${SESSIONS_PATH}/${sessionId}`;
  try {
    const docRef = doc(db, SESSIONS_PATH, sessionId);
    const existingSnap = await getDoc(docRef);

    if (existingSnap.exists()) {
      await updateDoc(docRef, {
        isOpen,
        ...(isOpen ? { openedAt: new Date().toISOString() } : { closedAt: new Date().toISOString() }),
        ...sessionData
      });
    } else {
      const newSession: AttendanceSession = {
        id: sessionId,
        title: sessionData?.title || 'Latihan Rutin Pramuka Penegak',
        date: sessionData?.date || new Date().toISOString().split('T')[0],
        isOpen,
        openedAt: new Date().toISOString(),
        openedBy: auth.currentUser?.email || 'admin',
        tipe: sessionData?.tipe || 'Latihan Rutin'
      };
      await setDoc(docRef, newSession);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Subscribe to Attendance Records for a session
export function subscribeToSessionRecords(
  sessionId: string,
  callback: (records: AttendanceRecord[]) => void,
  onError?: (err: unknown) => void
) {
  try {
    const q = query(
      collection(db, RECORDS_PATH),
      where('sessionId', '==', sessionId)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const records: AttendanceRecord[] = [];
        snapshot.forEach((docSnap) => {
          records.push({ ...docSnap.data(), id: docSnap.id } as AttendanceRecord);
        });
        callback(records);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, RECORDS_PATH);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, RECORDS_PATH);
  }
}

// Submit Attendance (By Member themselves or Admin)
export async function recordAttendance(record: Omit<AttendanceRecord, 'id'>, customId?: string): Promise<string> {
  const recordId = customId || `${record.sessionId}_${record.userId}`;
  const path = `${RECORDS_PATH}/${recordId}`;
  try {
    const docRef = doc(db, RECORDS_PATH, recordId);
    const fullRecord: AttendanceRecord = {
      ...record,
      id: recordId,
      timestamp: record.timestamp || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };
    await setDoc(docRef, fullRecord, { merge: true });
    return recordId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return '';
  }
}

/* ==========================================================
 *  2. PROGRAM KERJA REAL-TIME FIRESTORE SYNC
 * ========================================================== */

import { DEFAULT_PROGRAM_KERJA_ITEMS } from '../data/defaultProgramKerja';

export async function seedDefaultProgramKerja(items: ProgramKerjaItem[]): Promise<void> {
  try {
    for (const item of items) {
      const docRef = doc(db, PROKER_PATH, item.id);
      await setDoc(docRef, item, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, PROKER_PATH);
  }
}

export function subscribeToProgramKerja(
  callback: (list: ProgramKerjaItem[]) => void,
  onError?: (err: unknown) => void
) {
  try {
    const q = query(collection(db, PROKER_PATH));
    return onSnapshot(
      q,
      (snapshot) => {
        const items: ProgramKerjaItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ ...docSnap.data(), id: docSnap.id } as ProgramKerjaItem);
        });
        if (items.length < 24 && DEFAULT_PROGRAM_KERJA_ITEMS.length > 0) {
          seedDefaultProgramKerja(DEFAULT_PROGRAM_KERJA_ITEMS).catch(() => {});
          // Combine existing with missing defaults
          const existingIds = new Set(items.map(i => i.id));
          const combined = [...items, ...DEFAULT_PROGRAM_KERJA_ITEMS.filter(d => !existingIds.has(d.id))];
          callback(combined);
        } else {
          callback(items);
        }
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, PROKER_PATH);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, PROKER_PATH);
  }
}

export async function saveProgramKerjaItem(item: ProgramKerjaItem): Promise<void> {
  const path = `${PROKER_PATH}/${item.id}`;
  try {
    const docRef = doc(db, PROKER_PATH, item.id);
    await setDoc(docRef, item, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteProgramKerjaItem(id: string): Promise<void> {
  const path = `${PROKER_PATH}/${id}`;
  try {
    await deleteDoc(doc(db, PROKER_PATH, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/* ==========================================================
 *  3. USER PROFILES & AMBALAN ACCOUNT SYSTEM
 * ========================================================== */

export const DEFAULT_ADMIN_ACCOUNT: UserAccount = {
  uid: "admin_pembina_01",
  username: "admin",
  password: "ambalan10035",
  email: "admin@ambalan-pettalopo.sch.id",
  nama: "Pembina Gugus Depan",
  role: "admin",
  gudep: "10-035",
  satuan: "Putra",
  tingkat: "Penegak Garuda",
  sangga: "Perintis",
  jabatan: "Pembina Gugus Depan",
  nomorKta: "10.035.1985.001",
  usia: 38,
  keaktifan: "Sangat Aktif",
  createdAt: "2026-07-01"
};

export const DEFAULT_SEED_MEMBERS: UserAccount[] = [DEFAULT_ADMIN_ACCOUNT];

export async function seedDefaultMembers(): Promise<void> {
  try {
    for (const member of DEFAULT_SEED_MEMBERS) {
      const docRef = doc(db, USERS_PATH, member.uid!);
      await setDoc(docRef, member, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, USERS_PATH);
  }
}

export async function syncUserProfile(user: UserAccount): Promise<void> {
  if (!user.uid && !user.username) return;
  const uid = user.uid || `user_${user.username.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  const path = `${USERS_PATH}/${uid}`;
  try {
    const docRef = doc(db, USERS_PATH, uid);
    await setDoc(docRef, { ...user, uid }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function registerAmbalanUser(userData: Omit<UserAccount, 'uid'> & { uid?: string }): Promise<UserAccount> {
  const cleanUsername = userData.username.trim().toLowerCase().replace(/\s+/g, '_');
  const uid = userData.uid || `user_${cleanUsername}_${Date.now()}`;
  const path = `${USERS_PATH}/${uid}`;
  
  const newUser: UserAccount = {
    ...userData,
    uid,
    username: cleanUsername,
    createdAt: userData.createdAt || new Date().toISOString().split('T')[0]
  };

  try {
    const docRef = doc(db, USERS_PATH, uid);
    await setDoc(docRef, newUser);
    return newUser;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return newUser;
  }
}

export async function deleteUserAccount(uid: string): Promise<void> {
  const path = `${USERS_PATH}/${uid}`;
  try {
    await deleteDoc(doc(db, USERS_PATH, uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fetchUserProfile(uid: string): Promise<UserAccount | null> {
  const path = `${USERS_PATH}/${uid}`;
  try {
    const docSnap = await getDoc(doc(db, USERS_PATH, uid));
    if (docSnap.exists()) {
      return docSnap.data() as UserAccount;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export function subscribeToAllMembers(
  callback: (members: UserAccount[]) => void,
  onError?: (err: unknown) => void
) {
  try {
    const q = query(collection(db, USERS_PATH));
    return onSnapshot(
      q,
      (snapshot) => {
        const members: UserAccount[] = [];
        snapshot.forEach((docSnap) => {
          // Bersihkan data dummy lama jika masih tersisa di Firestore
          if (docSnap.id.startsWith('member_putra_') || docSnap.id.startsWith('member_putri_')) {
            deleteDoc(doc(db, USERS_PATH, docSnap.id)).catch(() => {});
          } else {
            members.push({ ...docSnap.data(), uid: docSnap.id } as UserAccount);
          }
        });

        // Jika database belum memiliki data sama sekali, pastikan akun Admin Utama tersinkron
        if (members.length === 0) {
          syncUserProfile(DEFAULT_ADMIN_ACCOUNT).catch(() => {});
          callback([DEFAULT_ADMIN_ACCOUNT]);
        } else {
          callback(members);
        }
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, USERS_PATH);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, USERS_PATH);
  }
}

/* ==========================================================
 *  4. AMBALAN GROUP CHAT & ANTI-SPAM LIST MESSAGES
 * ========================================================== */

const CHATS_PATH = 'ambalan_chats';

export const DEFAULT_INITIAL_CHATS: import('../types').ChatMessage[] = [
  {
    id: 'chat_welcome_01',
    senderId: 'admin_pembina_01',
    senderName: 'Amiruddin S., S.Pd.',
    senderGudep: '10-035',
    senderSangga: 'Perintis',
    senderRole: 'admin',
    type: 'text',
    text: 'Salam Pramuka! Selamat datang di grup obrolan resmi Ambalan La Surullah Petta Lopo. Gunakan wadah ini untuk koordinasi kegiatan sangga, sharing materi, dan absensi.',
    timestamp: '08:00',
    createdAtNumber: 1700000000000
  },
  {
    id: 'chat_list_kegiatan_01',
    senderId: 'member_pradana_putra',
    senderName: 'Muhammad Fadli Pratama',
    senderGudep: '10-035',
    senderSangga: 'Perintis',
    senderRole: 'anggota',
    type: 'list',
    listTitle: 'Daftar Hadir Latihan Rutin & Bakti Sanggar',
    listItems: [
      { id: 'item_1', name: 'Muhammad Fadli Pratama', userGudep: '10-035', userSangga: 'Perintis', addedAt: '08:15', note: 'Siap memimpin latihan pionering' },
      { id: 'item_2', name: 'Nurul Aisyah Wardani', userGudep: '10-036', userSangga: 'Penegas', addedAt: '08:20', note: 'Membawa perlengkapan P3K' },
      { id: 'item_3', name: 'Andi Tenri Sumpala', userGudep: '10-036', userSangga: 'Pendobrak', addedAt: '08:25', note: 'Notulensi & buku presensi siap' }
    ],
    timestamp: '08:15',
    createdAtNumber: 1700000010000
  }
];

export function subscribeToAmbalanChats(
  callback: (messages: import('../types').ChatMessage[]) => void,
  onError?: (err: unknown) => void
) {
  try {
    const q = query(collection(db, CHATS_PATH));
    return onSnapshot(
      q,
      (snapshot) => {
        const messages: import('../types').ChatMessage[] = [];
        snapshot.forEach((docSnap) => {
          messages.push({ ...docSnap.data(), id: docSnap.id } as import('../types').ChatMessage);
        });
        if (messages.length === 0) {
          seedDefaultChats().catch(() => {});
          callback(DEFAULT_INITIAL_CHATS);
        } else {
          messages.sort((a, b) => (a.createdAtNumber || 0) - (b.createdAtNumber || 0));
          callback(messages);
        }
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, CHATS_PATH);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, CHATS_PATH);
  }
}

export async function seedDefaultChats(): Promise<void> {
  try {
    for (const msg of DEFAULT_INITIAL_CHATS) {
      const docRef = doc(db, CHATS_PATH, msg.id);
      await setDoc(docRef, msg, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, CHATS_PATH);
  }
}

export async function sendAmbalanChatMessage(message: import('../types').ChatMessage): Promise<void> {
  const path = `${CHATS_PATH}/${message.id}`;
  try {
    const docRef = doc(db, CHATS_PATH, message.id);
    await setDoc(docRef, message);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateAmbalanChatList(
  chatId: string, 
  updatedListItems: import('../types').ChatListItem[],
  bumpToBottom: boolean = true
): Promise<void> {
  const path = `${CHATS_PATH}/${chatId}`;
  try {
    const docRef = doc(db, CHATS_PATH, chatId);
    const updates: Record<string, any> = {
      listItems: updatedListItems,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };
    if (bumpToBottom) {
      updates.createdAtNumber = Date.now();
    }
    await updateDoc(docRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/* ==========================================================
 *  5. ACTIVE KEGIATAN, EVALUASI & PRESENSI, NOTIFICATIONS
 * ========================================================== */

const ACTIVE_KEGIATAN_PATH = 'active_kegiatan';
const EVALUATIONS_PATH = 'kegiatan_evaluations';
const NOTIFICATIONS_PATH = 'ambalan_notifications';

export function subscribeToActiveKegiatanSession(
  callback: (session: import('../types').ActiveKegiatanSession | null) => void
) {
  try {
    const docRef = doc(db, ACTIVE_KEGIATAN_PATH, 'current_session');
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          callback(docSnap.data() as import('../types').ActiveKegiatanSession);
        } else {
          // Check local storage fallback
          const saved = localStorage.getItem('pettalopo_active_kegiatan');
          if (saved) {
            try { callback(JSON.parse(saved)); return; } catch {}
          }
          callback(null);
        }
      },
      () => {
        const saved = localStorage.getItem('pettalopo_active_kegiatan');
        if (saved) {
          try { callback(JSON.parse(saved)); return; } catch {}
        }
        callback(null);
      }
    );
  } catch {
    const saved = localStorage.getItem('pettalopo_active_kegiatan');
    if (saved) {
      try { callback(JSON.parse(saved)); } catch {}
    }
  }
}

export async function saveActiveKegiatanSession(
  session: import('../types').ActiveKegiatanSession
): Promise<void> {
  localStorage.setItem('pettalopo_active_kegiatan', JSON.stringify(session));
  try {
    const docRef = doc(db, ACTIVE_KEGIATAN_PATH, 'current_session');
    await setDoc(docRef, session);
  } catch (error) {
    console.warn('Fallback saving active kegiatan locally:', error);
  }
}

export async function stopActiveKegiatanSession(): Promise<void> {
  localStorage.removeItem('pettalopo_active_kegiatan');
  try {
    const docRef = doc(db, ACTIVE_KEGIATAN_PATH, 'current_session');
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('Fallback stopping active kegiatan locally:', error);
  }
}

export async function saveKegiatanEvaluation(
  evalData: import('../types').KegiatanEvaluation
): Promise<void> {
  // Save locally
  const saved = localStorage.getItem('pettalopo_evaluations_list');
  let currentList: import('../types').KegiatanEvaluation[] = [];
  if (saved) {
    try { currentList = JSON.parse(saved); } catch {}
  }
  // Remove duplicate if same member & kegiatan
  currentList = currentList.filter(
    (e) => !(e.kegiatanId === evalData.kegiatanId && e.memberName === evalData.memberName)
  );
  currentList.unshift(evalData);
  localStorage.setItem('pettalopo_evaluations_list', JSON.stringify(currentList));

  // Sync to firestore
  try {
    const docRef = doc(db, EVALUATIONS_PATH, evalData.id);
    await setDoc(docRef, evalData);
  } catch (error) {
    console.warn('Saved evaluation locally:', error);
  }
}

export function subscribeToKegiatanEvaluations(
  callback: (evals: import('../types').KegiatanEvaluation[]) => void
) {
  try {
    const q = query(collection(db, EVALUATIONS_PATH));
    return onSnapshot(
      q,
      (snapshot) => {
        const evals: import('../types').KegiatanEvaluation[] = [];
        snapshot.forEach((docSnap) => {
          evals.push(docSnap.data() as import('../types').KegiatanEvaluation);
        });
        if (evals.length > 0) {
          evals.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          localStorage.setItem('pettalopo_evaluations_list', JSON.stringify(evals));
          callback(evals);
        } else {
          const saved = localStorage.getItem('pettalopo_evaluations_list');
          if (saved) {
            try { callback(JSON.parse(saved)); return; } catch {}
          }
          callback([]);
        }
      },
      () => {
        const saved = localStorage.getItem('pettalopo_evaluations_list');
        if (saved) {
          try { callback(JSON.parse(saved)); return; } catch {}
        }
        callback([]);
      }
    );
  } catch {
    const saved = localStorage.getItem('pettalopo_evaluations_list');
    if (saved) {
      try { callback(JSON.parse(saved)); } catch {}
    }
  }
}

export async function addAmbalanNotification(
  notif: import('../types').AmbalanNotificationItem
): Promise<void> {
  const saved = localStorage.getItem('pettalopo_notifications_list');
  let current: import('../types').AmbalanNotificationItem[] = [];
  if (saved) {
    try { current = JSON.parse(saved); } catch {}
  }
  current = [notif, ...current.filter((n) => n.id !== notif.id)];
  localStorage.setItem('pettalopo_notifications_list', JSON.stringify(current));

  try {
    const docRef = doc(db, NOTIFICATIONS_PATH, notif.id);
    await setDoc(docRef, notif);
  } catch (error) {
    console.warn('Saved notification locally:', error);
  }
}

export function subscribeToAmbalanNotifications(
  callback: (notifs: import('../types').AmbalanNotificationItem[]) => void
) {
  try {
    const q = query(collection(db, NOTIFICATIONS_PATH));
    return onSnapshot(
      q,
      (snapshot) => {
        const items: import('../types').AmbalanNotificationItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as import('../types').AmbalanNotificationItem);
        });
        if (items.length > 0) {
          items.sort((a, b) => (b.createdAtNumber || 0) - (a.createdAtNumber || 0));
          callback(items);
        } else {
          const saved = localStorage.getItem('pettalopo_notifications_list');
          if (saved) {
            try { callback(JSON.parse(saved)); return; } catch {}
          }
          callback([]);
        }
      },
      () => {
        const saved = localStorage.getItem('pettalopo_notifications_list');
        if (saved) {
          try { callback(JSON.parse(saved)); return; } catch {}
        }
        callback([]);
      }
    );
  } catch {
    const saved = localStorage.getItem('pettalopo_notifications_list');
    if (saved) {
      try { callback(JSON.parse(saved)); } catch {}
    }
  }
}


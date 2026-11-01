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
        if (items.length === 0 && DEFAULT_PROGRAM_KERJA_ITEMS.length > 0) {
          seedDefaultProgramKerja(DEFAULT_PROGRAM_KERJA_ITEMS).catch(() => {});
          callback(DEFAULT_PROGRAM_KERJA_ITEMS);
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

export const DEFAULT_SEED_MEMBERS: UserAccount[] = [
  {
    uid: 'admin_pembina_01',
    username: 'admin',
    password: 'ambalan10035',
    email: 'amiruddin@smpialwasi-maros.sch.id',
    nama: 'Amiruddin S., S.Pd.',
    role: 'admin',
    gudep: '10-035',
    satuan: 'Putra',
    tingkat: 'Penegak Garuda',
    sangga: 'Perintis',
    jabatan: 'Pembina Gugus Depan',
    nomorKta: '10.035.1985.001',
    createdAt: '2026-07-01'
  },
  {
    uid: 'member_pradana_putra',
    username: 'muh_fadli',
    password: 'pramuka10035',
    nama: 'Muhammad Fadli Pratama',
    role: 'anggota',
    gudep: '10-035',
    satuan: 'Putra',
    tingkat: 'Penegak Laksana',
    sangga: 'Perintis',
    jabatan: 'Pradana Putra',
    nomorKta: '10.035.2008.012',
    createdAt: '2026-07-10'
  },
  {
    uid: 'member_pradana_putri',
    username: 'nurul_aisyah',
    password: 'pramuka10036',
    nama: 'Nurul Aisyah Wardani',
    role: 'anggota',
    gudep: '10-036',
    satuan: 'Putri',
    tingkat: 'Penegak Laksana',
    sangga: 'Penegas',
    jabatan: 'Pradana Putri',
    nomorKta: '10.036.2008.025',
    createdAt: '2026-07-10'
  },
  {
    uid: 'member_kerani',
    username: 'andi_tenri',
    password: 'kerani2026',
    nama: 'Andi Tenri Sumpala',
    role: 'anggota',
    gudep: '10-036',
    satuan: 'Putri',
    tingkat: 'Penegak Bantara',
    sangga: 'Pendobrak',
    jabatan: 'Kerani Dewan Ambalan',
    nomorKta: '10.036.2009.044',
    createdAt: '2026-07-15'
  },
  {
    uid: 'member_hartaka',
    username: 'ilham_ramadhan',
    password: 'hartaka2026',
    nama: 'Ilham Ramadhan',
    role: 'anggota',
    gudep: '10-035',
    satuan: 'Putra',
    tingkat: 'Penegak Bantara',
    sangga: 'Pencoba',
    jabatan: 'Hartaka / Bendahara',
    nomorKta: '10.035.2009.038',
    createdAt: '2026-07-15'
  },
  {
    uid: 'member_fajar',
    username: 'fajar_sidiq',
    password: 'fajar2026',
    nama: 'Fajar Sidiq Al-Farabi',
    role: 'anggota',
    gudep: '10-035',
    satuan: 'Putra',
    tingkat: 'Calon Bantara',
    sangga: 'Pelaksana',
    jabatan: 'Anggota Sangga',
    nomorKta: '10.035.2010.071',
    createdAt: '2026-08-01'
  }
];

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
          members.push({ ...docSnap.data(), uid: docSnap.id } as UserAccount);
        });
        if (members.length === 0) {
          seedDefaultMembers().catch(() => {});
          callback(DEFAULT_SEED_MEMBERS);
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

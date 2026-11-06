import { 
  signInWithPopup, 
  signOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  onSnapshot, 
  query, 
  orderBy,
  deleteDoc
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase/config';
import { UserProfile, UserStatus, UserPeran, AdminEmailRecord, SandiAksesConfig } from '../types/auth';

export const PRIMARY_ADMIN_EMAIL = 'miralifa19@gmail.com';

/**
 * Normalisasi sandi: trim spasi depan-belakang, ubah ke huruf kecil, spasi ganda jadi spasi tunggal.
 */
export function normalizeSandi(sandi: string): string {
  return sandi.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function isPrimaryAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();
}

/**
 * Masuk dengan Google menggunakan pop-up
 */
export async function signInWithGoogle(): Promise<FirebaseUser> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Login Google gagal:', error);
    throw error;
  }
}

/**
 * Keluar dari akun ambalan
 */
export async function signOutAmbalan(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Gagal keluar:', error);
    throw error;
  }
}

/**
 * Mengambil profil anggota dari Firestore `users/{uid}`
 */
export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) {
      return null;
    }
    const data = snap.data() as UserProfile;
    return {
      ...data,
      uid: snap.id,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    return null;
  }
}

/**
 * Mengambil atau menginisialisasi Sandi Akses Ambalan dari `config/akses`
 */
export async function getSandiAmbalan(): Promise<string> {
  try {
    const configRef = doc(db, 'config', 'akses');
    const snap = await getDoc(configRef);
    if (snap.exists()) {
      const data = snap.data() as SandiAksesConfig;
      return normalizeSandi(data.sandi || '');
    }
    // Jika belum ada di Firestore, gunakan sandi default ambalan
    return normalizeSandi('la surullah petta lopo');
  } catch (error) {
    console.warn('Gagal membaca sandi dari Firestore config/akses:', error);
    return normalizeSandi('la surullah petta lopo');
  }
}

/**
 * Verifikasi sandi yang dimasukkan oleh calon pendaftar
 */
export async function verifySandiAmbalan(inputSandi: string): Promise<boolean> {
  const normalizedInput = normalizeSandi(inputSandi);
  const actualSandi = await getSandiAmbalan();
  return normalizedInput === actualSandi;
}

/**
 * Pendaftaran akun anggota (wajib verifikasi sandi)
 */
export async function registerMemberProfile(params: {
  uid: string;
  namaLengkap: string;
  email: string;
  fotoUrl?: string;
  status: UserStatus;
  inputSandi: string;
}): Promise<UserProfile> {
  const isSandiValid = await verifySandiAmbalan(params.inputSandi);
  if (!isSandiValid) {
    throw new Error('Sandi belum tepat. Tanyakan kepada Dewan Ambalan ya, Kak.');
  }

  const profile: UserProfile = {
    uid: params.uid,
    namaLengkap: params.namaLengkap.trim(),
    status: params.status,
    peran: 'anggota',
    email: params.email,
    fotoUrl: params.fotoUrl || '',
    onboardingSelesai: false,
    nonaktif: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  try {
    const userRef = doc(db, 'users', params.uid);
    await setDoc(userRef, profile);
    return profile;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${params.uid}`);
    throw error;
  }
}

/**
 * Pendaftaran akun Admin (khusus miralifa19@gmail.com atau admin terdaftar, tanpa sandi)
 */
export async function registerAdminProfile(params: {
  uid: string;
  namaLengkap: string;
  email: string;
  fotoUrl?: string;
}): Promise<UserProfile> {
  const profile: UserProfile = {
    uid: params.uid,
    namaLengkap: params.namaLengkap.trim(),
    status: 'anggota_ambalan',
    peran: 'admin',
    email: params.email,
    fotoUrl: params.fotoUrl || '',
    onboardingSelesai: false,
    nonaktif: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  try {
    const userRef = doc(db, 'users', params.uid);
    await setDoc(userRef, profile);

    // Pastikan tersimpan di koleksi admins
    const adminRef = doc(db, 'admins', params.uid);
    await setDoc(adminRef, {
      email: params.email.toLowerCase(),
      nama: params.namaLengkap.trim(),
      addedBy: 'system',
      createdAt: Date.now(),
    }, { merge: true });

    return profile;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${params.uid}`);
    throw error;
  }
}

/**
 * Menyelesaikan tur onboarding satu kali
 */
export async function completeUserOnboarding(uid: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      onboardingSelesai: true,
      updatedAt: Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

/**
 * Ganti sandi ambalan dari Menu Admin (disimpan di config/akses)
 */
export async function updateSandiAmbalan(newSandi: string, adminUid: string): Promise<void> {
  const cleanSandi = normalizeSandi(newSandi);
  if (!cleanSandi) {
    throw new Error('Sandi ambalan tidak boleh kosong.');
  }

  try {
    const configRef = doc(db, 'config', 'akses');
    await setDoc(configRef, {
      sandi: cleanSandi,
      updatedAt: Date.now(),
      updatedBy: adminUid,
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'config/akses');
    throw error;
  }
}

/**
 * Berlangganan data seluruh pengguna (Khusus Admin)
 */
export function subscribeAllUsers(callback: (users: UserProfile[]) => void) {
  try {
    const usersCol = collection(db, 'users');
    return onSnapshot(usersCol, (snap) => {
      const list: UserProfile[] = [];
      snap.forEach((d) => {
        const item = d.data() as UserProfile;
        list.push({ ...item, uid: d.id });
      });
      callback(list);
    }, (error) => {
      console.warn('Gagal memuat daftar pengguna:', error);
    });
  } catch (err) {
    console.warn('subscribeAllUsers error:', err);
    return () => {};
  }
}

/**
 * Ubah peran anggota (dewan <-> anggota)
 */
export async function updateUserPeran(uid: string, peran: UserPeran): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      peran,
      updatedAt: Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    throw error;
  }
}

/**
 * Nonaktifkan atau aktifkan akun pengguna
 */
export async function toggleUserDisabled(uid: string, nonaktif: boolean): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      nonaktif,
      updatedAt: Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    throw error;
  }
}

/**
 * Berlangganan daftar email admin di koleksi `admins`
 */
export function subscribeAdminEmails(callback: (admins: AdminEmailRecord[]) => void) {
  try {
    const colRef = collection(db, 'admins');
    return onSnapshot(colRef, (snap) => {
      const list: AdminEmailRecord[] = [];
      snap.forEach((d) => {
        const item = d.data() as AdminEmailRecord;
        list.push({
          id: d.id,
          email: item.email || d.id,
          addedBy: item.addedBy,
          createdAt: item.createdAt,
        });
      });
      callback(list);
    }, (err) => {
      console.warn('Gagal memuat data admins:', err);
    });
  } catch (err) {
    return () => {};
  }
}

/**
 * Tambah email admin baru ke koleksi `admins`
 */
export async function addAdminEmail(email: string, adminUid: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Alamat email admin tidak valid.');
  }

  try {
    const adminDocRef = doc(db, 'admins', cleanEmail.replace(/[^a-zA-Z0-9]/g, '_'));
    await setDoc(adminDocRef, {
      email: cleanEmail,
      addedBy: adminUid,
      createdAt: Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `admins/${cleanEmail}`);
    throw error;
  }
}

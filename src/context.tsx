import React, { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode, type Dispatch, type SetStateAction } from 'react';
import { db } from './firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, getDocs } from 'firebase/firestore';

import {
  type User, type Lesson, type Grade, type DiaryEntry, type Student, type Test,
  type JournalColumn, type LessonTypeEntry, type CustomLessonType, type AttendanceRecord, type TestAttempt,
  type TestAssignment, adminUsers
} from './data';

// ==================== HELPERS ====================

function sanitize(obj: unknown): unknown {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (v !== undefined) clean[k] = sanitize(v);
  }
  return clean;
}

// ==================== COLLECTION HOOK ====================

function useFirestoreCollection<T extends { id: string }>(
  collectionName: string
): [T[], Dispatch<SetStateAction<T[]>>, boolean] {
  const [items, setItems] = useState<T[]>([]);
  const [loaded, setLoaded] = useState(false);

  // This ref tracks whether the first snapshot from Firestore has been received
  const firstSnapshotReceived = useRef(false);
  // This ref tracks the last known Firestore state to prevent echo loops
  const firestoreStateRef = useRef<Map<string, string>>(new Map());
  // This ref prevents the sync effect from running during its own writes
  const isSyncing = useRef(false);
  // Debounce timer
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Real-time listener via onSnapshot
  useEffect(() => {
    const colRef = collection(db, collectionName);
    const unsub = onSnapshot(colRef, (snapshot) => {
      // If we're currently syncing, skip this snapshot (it's our own echo)
      if (isSyncing.current) return;

      const docs: T[] = [];
      const stateMap = new Map<string, string>();
      snapshot.forEach(d => {
        const data = { id: d.id, ...d.data() } as T;
        docs.push(data);
        stateMap.set(d.id, JSON.stringify(d.data()));
      });

      firestoreStateRef.current = stateMap;
      firstSnapshotReceived.current = true;
      setItems(docs);
      setLoaded(true);
    }, (error) => {
      console.error(`Firestore error (${collectionName}):`, error);
      setLoaded(true);
    });
    return () => unsub();
  }, [collectionName]);

  // Sync local state changes to Firestore (debounced)
  useEffect(() => {
    // NEVER sync before first snapshot is received from Firestore
    if (!firstSnapshotReceived.current) return;
    if (!loaded) return;

    // Debounce to prevent rapid-fire syncs
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      syncToFirestore();
    }, 500);

    async function syncToFirestore() {
      // Build current local state map
      const localMap = new Map<string, string>();
      const localItemMap = new Map<string, T>();
      for (const item of items) {
        const { id, ...rest } = item;
        const json = JSON.stringify(sanitize(rest));
        localMap.set(id, json);
        localItemMap.set(id, item);
      }

      // Compare with last known Firestore state
      const remoteMap = firestoreStateRef.current;

      // Find items to add/update
      const toWrite: T[] = [];
      for (const [id, json] of localMap) {
        const remoteJson = remoteMap.get(id);
        if (remoteJson !== json) {
          toWrite.push(localItemMap.get(id)!);
        }
      }

      // Find items to delete
      const toDelete: string[] = [];
      for (const id of remoteMap.keys()) {
        if (!localMap.has(id)) {
          toDelete.push(id);
        }
      }

      // Nothing to do
      if (toWrite.length === 0 && toDelete.length === 0) return;

      isSyncing.current = true;

      try {
        const promises: Promise<void>[] = [];

        for (const item of toWrite) {
          const { id, ...rest } = item;
          const sanitized = sanitize(rest) as Record<string, unknown>;
          promises.push(setDoc(doc(db, collectionName, id), sanitized));
          // Update our reference
          firestoreStateRef.current.set(id, JSON.stringify(sanitize(rest)));
        }

        for (const id of toDelete) {
          promises.push(deleteDoc(doc(db, collectionName, id)));
          firestoreStateRef.current.delete(id);
        }

        await Promise.all(promises);
      } catch (err) {
        console.error(`Sync error (${collectionName}):`, err);
      } finally {
        // Give Firestore time to settle before accepting snapshots again
        setTimeout(() => {
          isSyncing.current = false;
        }, 1000);
      }
    }

    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, [items, loaded, collectionName]);

  return [items, setItems, loaded];
}

// ==================== AUTH ====================
interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>(null!);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    const admin = adminUsers.find(u => u.username === username && u.password === password);
    if (admin) {
      setUser(admin);
      localStorage.setItem('auth_user', JSON.stringify(admin));
      return true;
    }
    try {
      const snap = await getDocs(collection(db, 'students'));
      let found: Student | null = null;
      snap.forEach(d => {
        const s = { id: d.id, ...d.data() } as Student;
        if (s.username === username && s.password === password) found = s;
      });
      if (found) {
        const f = found as Student;
        const su: User = {
          id: f.id, username: f.username, password: f.password,
          role: 'student', name: `${f.lastName} ${f.firstName}`
        };
        setUser(su);
        localStorage.setItem('auth_user', JSON.stringify(su));
        return true;
      }
    } catch (e) { console.error('Login error:', e); }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('auth_user');
  }, []);

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};

// ==================== DATA ====================
interface DataContextType {
  lessons: Lesson[];
  setLessons: Dispatch<SetStateAction<Lesson[]>>;
  grades: Grade[];
  setGrades: Dispatch<SetStateAction<Grade[]>>;
  diaryEntries: DiaryEntry[];
  setDiaryEntries: Dispatch<SetStateAction<DiaryEntry[]>>;
  students: Student[];
  setStudents: Dispatch<SetStateAction<Student[]>>;
  tests: Test[];
  setTests: Dispatch<SetStateAction<Test[]>>;
  journalColumns: JournalColumn[];
  setJournalColumns: Dispatch<SetStateAction<JournalColumn[]>>;
  lessonTypes: LessonTypeEntry[];
  setLessonTypes: Dispatch<SetStateAction<LessonTypeEntry[]>>;
  customLessonTypes: CustomLessonType[];
  setCustomLessonTypes: Dispatch<SetStateAction<CustomLessonType[]>>;
  attendance: AttendanceRecord[];
  setAttendance: Dispatch<SetStateAction<AttendanceRecord[]>>;
  testAttempts: TestAttempt[];
  setTestAttempts: Dispatch<SetStateAction<TestAttempt[]>>;
  testRetakes: { id: string; studentId: string; testId: string; date: string }[];
  setTestRetakes: Dispatch<SetStateAction<{ id: string; studentId: string; testId: string; date: string }[]>>;
  testAssignments: TestAssignment[];
  setTestAssignments: Dispatch<SetStateAction<TestAssignment[]>>;
  loading: boolean;
}

const DataContext = createContext<DataContextType>(null!);
export const useData = () => useContext(DataContext);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lessons, setLessons, l1] = useFirestoreCollection<Lesson>('lessons');
  const [grades, setGrades, l2] = useFirestoreCollection<Grade>('grades');
  const [diaryEntries, setDiaryEntries, l3] = useFirestoreCollection<DiaryEntry>('diaryEntries');
  const [students, setStudents, l4] = useFirestoreCollection<Student>('students');
  const [tests, setTests, l5] = useFirestoreCollection<Test>('tests');
  const [journalColumns, setJournalColumns, l6] = useFirestoreCollection<JournalColumn>('journalColumns');
  const [lessonTypes, setLessonTypes, l7] = useFirestoreCollection<LessonTypeEntry>('lessonTypes');
  const [customLessonTypes, setCustomLessonTypes, l8] = useFirestoreCollection<CustomLessonType>('customLessonTypes');
  const [attendance, setAttendance, l9] = useFirestoreCollection<AttendanceRecord>('attendance');
  const [testAttempts, setTestAttempts, l10] = useFirestoreCollection<TestAttempt>('testAttempts');
  const [testRetakes, setTestRetakes, l11] = useFirestoreCollection<{ id: string; studentId: string; testId: string; date: string }>('testRetakes');
  const [testAssignments, setTestAssignments, l12] = useFirestoreCollection<TestAssignment>('testAssignments');

  const loading = !(l1 && l2 && l3 && l4 && l5 && l6 && l7 && l8 && l9 && l10 && l11 && l12);

  return (
    <DataContext.Provider value={{
      lessons, setLessons, grades, setGrades, diaryEntries, setDiaryEntries,
      students, setStudents, tests, setTests, journalColumns, setJournalColumns,
      lessonTypes, setLessonTypes, customLessonTypes, setCustomLessonTypes,
      attendance, setAttendance, testAttempts, setTestAttempts,
      testRetakes, setTestRetakes, testAssignments, setTestAssignments, loading,
    }}>
      {children}
    </DataContext.Provider>
  );
};

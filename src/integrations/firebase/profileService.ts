
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from './config';
import { FirebaseProfile } from './models';

const PROFILES_COLLECTION = 'profiles';

export class FirebaseProfileService {
  static async createOrUpdateProfile(userId: string, profileData: Partial<FirebaseProfile>) {
    try {
      const docRef = doc(db, PROFILES_COLLECTION, userId);
      const now = Timestamp.now();
      
      await setDoc(docRef, {
        ...profileData,
        id: userId,
        updatedAt: now,
        createdAt: now
      }, { merge: true });
      
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  static async getProfile(userId: string) {
    try {
      const docRef = doc(db, PROFILES_COLLECTION, userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { data: docSnap.data() as FirebaseProfile, error: null };
      } else {
        return { data: null, error: null };
      }
    } catch (error) {
      return { data: null, error };
    }
  }
}

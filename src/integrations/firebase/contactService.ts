
import { collection, doc, addDoc, updateDoc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from './config';
import { FirebaseContact } from './models';

const CONTACTS_COLLECTION = 'contacts';

export class FirebaseContactService {
  static async createContact(contactData: Omit<FirebaseContact, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, CONTACTS_COLLECTION), {
        ...contactData,
        createdAt: now,
        updatedAt: now
      });
      
      return { data: { id: docRef.id, ...contactData }, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  static async updateContact(id: string, updates: Partial<FirebaseContact>) {
    try {
      const docRef = doc(db, CONTACTS_COLLECTION, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
      
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  static async getContactsByUser(userId: string) {
    try {
      const q = query(
        collection(db, CONTACTS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const contacts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirebaseContact[];
      
      return { data: contacts, error: null };
    } catch (error) {
      return { data: [], error };
    }
  }

  static async findRelatedContacts(email?: string, phoneNumber?: string, userId?: string) {
    try {
      const allContacts: FirebaseContact[] = [];
      
      // Create separate queries for email and phone
      if (email) {
        const emailQuery = userId
          ? query(
              collection(db, CONTACTS_COLLECTION),
              where('email', '==', email),
              where('userId', '==', userId)
            )
          : query(
              collection(db, CONTACTS_COLLECTION),
              where('email', '==', email)
            );
        
        const emailSnapshot = await getDocs(emailQuery);
        emailSnapshot.docs.forEach(doc => {
          const contact = { id: doc.id, ...doc.data() } as FirebaseContact;
          if (!allContacts.find(c => c.id === contact.id)) {
            allContacts.push(contact);
          }
        });
      }
      
      if (phoneNumber) {
        const phoneQuery = userId
          ? query(
              collection(db, CONTACTS_COLLECTION),
              where('phoneNumber', '==', phoneNumber),
              where('userId', '==', userId)
            )
          : query(
              collection(db, CONTACTS_COLLECTION),
              where('phoneNumber', '==', phoneNumber)
            );
        
        const phoneSnapshot = await getDocs(phoneQuery);
        phoneSnapshot.docs.forEach(doc => {
          const contact = { id: doc.id, ...doc.data() } as FirebaseContact;
          if (!allContacts.find(c => c.id === contact.id)) {
            allContacts.push(contact);
          }
        });
      }
      
      return { data: allContacts, error: null };
    } catch (error) {
      return { data: [], error };
    }
  }
}

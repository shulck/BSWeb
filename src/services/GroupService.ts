import { 
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  onSnapshot,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from './firebase';
import { GroupModel, UserModel } from '../types/models';

export class GroupService {
  private static instance: GroupService;
  private groupMembers: Map<string, UserModel[]> = new Map();
  private listeners: Map<string, () => void> = new Map();

  static getInstance(): GroupService {
    if (!GroupService.instance) {
      GroupService.instance = new GroupService();
    }
    return GroupService.instance;
  }

  async fetchGroupMembers(groupId: string): Promise<UserModel[]> {
    try {
      const groupDoc = await getDoc(doc(db, 'groups', groupId));
      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }

      const groupData = groupDoc.data() as GroupModel;
      const members: UserModel[] = [];

      for (const memberId of groupData.members) {
        const userDoc = await getDoc(doc(db, 'users', memberId));
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserModel;
          members.push({
            ...userData,
            id: userDoc.id
          });
        }
      }

      this.groupMembers.set(groupId, members);
      return members;
    } catch (error) {
      console.error('Error fetching group members:', error);
      return [];
    }
  }

  subscribeToGroupMembers(groupId: string, callback: (members: UserModel[]) => void): () => void {
    const unsubscribe = onSnapshot(doc(db, 'groups', groupId), async (snapshot) => {
      if (!snapshot.exists()) return;

      const groupData = snapshot.data() as GroupModel;
      const members: UserModel[] = [];

      for (const memberId of groupData.members) {
        const userDoc = await getDoc(doc(db, 'users', memberId));
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserModel;
          members.push({
            ...userData,
            id: userDoc.id
          });
        }
      }

      this.groupMembers.set(groupId, members);
      callback(members);
    });

    this.listeners.set(groupId, unsubscribe);
    
    return () => {
      const unsub = this.listeners.get(groupId);
      if (unsub) {
        unsub();
        this.listeners.delete(groupId);
      }
    };
  }

  getCachedMembers(groupId: string): UserModel[] {
    return this.groupMembers.get(groupId) || [];
  }

  async joinGroup(groupCode: string, userId: string): Promise<GroupModel> {
    const q = query(collection(db, 'groups'), where('code', '==', groupCode));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('Группа с таким кодом не найдена');
    }
    
    const groupDoc = querySnapshot.docs[0];
    const groupData = groupDoc.data() as GroupModel;
    
    if (groupData.members.includes(userId)) {
      throw new Error('Вы уже участник этой группы');
    }
    
    await updateDoc(doc(db, 'groups', groupDoc.id), {
      pendingMembers: arrayUnion(userId)
    });
    
    return { ...groupData, id: groupDoc.id };
  }

  async approveUser(groupId: string, userId: string): Promise<void> {
    await updateDoc(doc(db, 'groups', groupId), {
      pendingMembers: arrayRemove(userId),
      members: arrayUnion(userId)
    });

    await updateDoc(doc(db, 'users', userId), {
      groupId: groupId
    });
  }

  async rejectUser(groupId: string, userId: string): Promise<void> {
    await updateDoc(doc(db, 'groups', groupId), {
      pendingMembers: arrayRemove(userId)
    });
  }

  async removeUser(groupId: string, userId: string): Promise<void> {
    await updateDoc(doc(db, 'groups', groupId), {
      members: arrayRemove(userId)
    });

    await updateDoc(doc(db, 'users', userId), {
      groupId: null
    });
  }
}

export const groupService = GroupService.getInstance();

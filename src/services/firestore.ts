import { 
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import {
  GroupModel,
  Event,
  TaskModel,
  Setlist,
} from '../types/models';

// ============= GROUP SERVICE =============

export class GroupService {
  static async createGroup(groupData: Omit<GroupModel, 'id'>): Promise<GroupModel> {
    const docRef = await addDoc(collection(db, 'groups'), groupData);
    return { ...groupData, id: docRef.id };
  }

  static async getUserGroups(userId: string): Promise<GroupModel[]> {
    const q = query(
      collection(db, 'groups'),
      where('members', 'array-contains', userId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as GroupModel[];
  }

  static async joinGroup(groupCode: string, userId: string): Promise<GroupModel> {
    const q = query(
      collection(db, 'groups'),
      where('code', '==', groupCode)
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      throw new Error('Группа не найдена');
    }
    
    const groupDoc = querySnapshot.docs[0];
    const groupData = groupDoc.data() as GroupModel;
    
    if (groupData.members.includes(userId)) {
      throw new Error('Вы уже в этой группе');
    }
    
    const updatedMembers = [...groupData.members, userId];
    await updateDoc(doc(db, 'groups', groupDoc.id), {
      members: updatedMembers
    });
    
    return { ...groupData, id: groupDoc.id, members: updatedMembers };
  }
}

// ============= EVENT SERVICE =============

export class EventService {
  static async createEvent(eventData: Omit<Event, 'id'>): Promise<Event> {
    const docRef = await addDoc(collection(db, 'events'), {
      ...eventData,
      date: Timestamp.fromDate(eventData.date),
    });
    
    return { ...eventData, id: docRef.id };
  }

  static async getGroupEvents(groupId: string): Promise<Event[]> {
    // Simplified query without ordering
    const q = query(
      collection(db, 'events'),
      where('groupId', '==', groupId)
    );
    
    const querySnapshot = await getDocs(q);
    const events = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        date: data.date.toDate(),
      };
    }) as Event[];

    // Sort in memory
    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  static async updateEvent(eventId: string, updates: Partial<Event>): Promise<void> {
    const updateData = { ...updates };
    if (updates.date) {
      updateData.date = Timestamp.fromDate(updates.date) as any;
    }
    
    await updateDoc(doc(db, 'events', eventId), updateData);
  }

  static async deleteEvent(eventId: string): Promise<void> {
    await deleteDoc(doc(db, 'events', eventId));
  }
}

// ============= TASK SERVICE (Updated to match iOS) =============

export class TaskService {
  private static listeners: Map<string, Unsubscribe> = new Map();
  private static taskCallbacks: Map<string, (tasks: TaskModel[]) => void> = new Map();

  static subscribeToTasks(groupId: string, callback: (tasks: TaskModel[]) => void): () => void {
    // Unsubscribe previous listener for this groupId if exists
    const existingListener = this.listeners.get(groupId);
    if (existingListener) {
      existingListener();
    }

    // Simplified query without ordering for tasks
    const q = query(
      collection(db, 'tasks'),
      where('groupId', '==', groupId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          dueDate: data.dueDate.toDate()
        };
      }) as TaskModel[];
      
      // Sort in memory by due date
      tasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
      
      callback(tasks);
    });

    this.listeners.set(groupId, unsubscribe);
    this.taskCallbacks.set(groupId, callback);

    return () => {
      const listener = this.listeners.get(groupId);
      if (listener) {
        listener();
        this.listeners.delete(groupId);
        this.taskCallbacks.delete(groupId);
      }
    };
  }

  static async addTask(taskData: Omit<TaskModel, 'id'>): Promise<boolean> {
    try {
      await addDoc(collection(db, 'tasks'), {
        ...taskData,
        dueDate: Timestamp.fromDate(taskData.dueDate)
      });
      return true;
    } catch (error) {
      console.error('Error adding task:', error);
      return false;
    }
  }

  static async toggleCompletion(task: TaskModel): Promise<boolean> {
    if (!task.id) return false;
    
    try {
      await updateDoc(doc(db, 'tasks', task.id), {
        completed: !task.completed
      });
      return true;
    } catch (error) {
      console.error('Error toggling task completion:', error);
      return false;
    }
  }

  static async deleteTask(task: TaskModel): Promise<boolean> {
    if (!task.id) return false;
    
    try {
      await deleteDoc(doc(db, 'tasks', task.id));
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      return false;
    }
  }

  static async updateTask(taskId: string, updates: Partial<TaskModel>): Promise<void> {
    const updateData = { ...updates };
    if (updates.dueDate) {
      updateData.dueDate = Timestamp.fromDate(updates.dueDate) as any;
    }
    
    await updateDoc(doc(db, 'tasks', taskId), updateData);
  }

  // Legacy methods for backward compatibility
  static async createTask(taskData: Omit<TaskModel, 'id'>): Promise<TaskModel> {
    const docRef = await addDoc(collection(db, 'tasks'), {
      ...taskData,
      dueDate: Timestamp.fromDate(taskData.dueDate)
    });
    
    return { ...taskData, id: docRef.id };
  }

  static async getGroupTasks(groupId: string): Promise<TaskModel[]> {
    const q = query(
      collection(db, 'tasks'),
      where('groupId', '==', groupId)
    );
    
    const querySnapshot = await getDocs(q);
    const tasks = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        dueDate: data.dueDate.toDate()
      };
    }) as TaskModel[];

    // Sort in memory
    return tasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }
}

// ============= SETLIST SERVICE =============

export class SetlistService {
  static async getGroupSetlists(groupId: string): Promise<Setlist[]> {
    const q = query(
      collection(db, 'setlists'),
      where('groupId', '==', groupId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        concertDate: data.concertDate?.toDate()
      };
    }) as Setlist[];
  }
}

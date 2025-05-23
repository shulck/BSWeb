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
import { TaskModel } from '../types/models';

export class TaskService {
  private static listeners: Map<string, Unsubscribe> = new Map();

  static subscribeToTasks(groupId: string, callback: (tasks: TaskModel[]) => void): () => void {
    const existingListener = this.listeners.get(groupId);
    if (existingListener) {
      existingListener();
    }

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
      
      tasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
      
      callback(tasks);
    });

    this.listeners.set(groupId, unsubscribe);

    return () => {
      const listener = this.listeners.get(groupId);
      if (listener) {
        listener();
        this.listeners.delete(groupId);
      }
    };
  }

  static async createTask(taskData: Omit<TaskModel, 'id'>): Promise<TaskModel> {
    const docRef = await addDoc(collection(db, 'tasks'), {
      ...taskData,
      dueDate: Timestamp.fromDate(taskData.dueDate)
    });
    
    return { ...taskData, id: docRef.id };
  }

  static async updateTask(taskId: string, updates: Partial<TaskModel>): Promise<void> {
    const updateData: any = { ...updates };
    if (updates.dueDate) {
      updateData.dueDate = Timestamp.fromDate(updates.dueDate);
    }
    
    await updateDoc(doc(db, 'tasks', taskId), updateData);
  }

  static async toggleCompletion(task: TaskModel): Promise<void> {
    if (!task.id) return;
    
    await updateDoc(doc(db, 'tasks', task.id), {
      completed: !task.completed
    });
  }

  static async deleteTask(task: TaskModel): Promise<void> {
    if (!task.id) return;
    
    await deleteDoc(doc(db, 'tasks', task.id));
  }
}

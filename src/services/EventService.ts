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
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { Event, EventType } from '../types/models';

export class EventService {
  private static instance: EventService;
  private events: Event[] = [];
  private listeners: ((events: Event[]) => void)[] = [];
  private isLoading = false;
  private errorMessage: string | null = null;
  private isOfflineMode = false;

  static getInstance(): EventService {
    if (!EventService.instance) {
      EventService.instance = new EventService();
    }
    return EventService.instance;
  }

  constructor() {
    this.setupNetworkMonitoring();
  }

  private setupNetworkMonitoring() {
    window.addEventListener('online', () => {
      this.isOfflineMode = false;
      console.log('🟢 Network connected');
    });

    window.addEventListener('offline', () => {
      this.isOfflineMode = true;
      console.log('🔴 Network disconnected');
    });

    this.isOfflineMode = !navigator.onLine;
  }

  subscribe(callback: (events: Event[]) => void): () => void {
    console.log('📝 Subscribing to events');
    this.listeners.push(callback);
    callback(this.events);
    
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners() {
    console.log('📢 Notifying listeners, events count:', this.events.length);
    this.listeners.forEach(listener => listener(this.events));
  }

  getLoadingState() {
    return {
      isLoading: this.isLoading,
      errorMessage: this.errorMessage,
      isOfflineMode: this.isOfflineMode
    };
  }

  // Helper function to prepare data for Firestore
  private prepareDataForFirestore(data: any): any {
    const prepared: any = {};
    
    Object.keys(data).forEach(key => {
      const value = data[key];
      
      // Skip undefined, null, empty strings, and empty arrays
      if (value === undefined || value === null || 
          (typeof value === 'string' && value.trim() === '') ||
          (Array.isArray(value) && value.length === 0)) {
        return;
      }
      
      // Convert dates to Timestamps
      if (value instanceof Date) {
        prepared[key] = Timestamp.fromDate(value);
      } else if (key === 'date' && typeof value === 'string') {
        // Handle date strings
        prepared[key] = Timestamp.fromDate(new Date(value));
      } else {
        prepared[key] = value;
      }
    });
    
    console.log('📋 Prepared data for Firestore:', prepared);
    return prepared;
  }

  async fetchEvents(groupId: string): Promise<Event[]> {
    console.log('🔍 Fetching events for group:', groupId);
    this.isLoading = true;
    this.errorMessage = null;

    if (this.isOfflineMode) {
      console.log('📱 Offline mode, loading from cache');
      return this.loadFromCache(groupId);
    }

    try {
      const q = query(
        collection(db, 'events'),
        where('groupId', '==', groupId)
      );

      console.log('🔍 Executing Firestore query...');
      const querySnapshot = await getDocs(q);
      console.log('📊 Query result - docs count:', querySnapshot.size);

      const events = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('📄 Processing document:', doc.id, data);
        return {
          ...data,
          id: doc.id,
          date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
          hotelCheckIn: data.hotelCheckIn?.toDate ? data.hotelCheckIn.toDate() : undefined,
          hotelCheckOut: data.hotelCheckOut?.toDate ? data.hotelCheckOut.toDate() : undefined
        };
      }) as Event[];

      // Sort in memory by date
      events.sort((a, b) => a.date.getTime() - b.date.getTime());

      console.log('✅ Processed events:', events);
      this.events = events;
      this.saveToCache(groupId, events);
      this.notifyListeners();
      
      return events;
    } catch (error: any) {
      console.error('❌ Error fetching events:', error);
      this.errorMessage = `Error loading events: ${error.message}`;
      return this.loadFromCache(groupId);
    } finally {
      this.isLoading = false;
    }
  }

  async addEvent(eventData: Omit<Event, 'id'>): Promise<boolean> {
    console.log('➕ Adding new event:', eventData);
    this.isLoading = true;
    this.errorMessage = null;

    if (this.isOfflineMode) {
      this.errorMessage = "Cannot add events in offline mode";
      this.isLoading = false;
      console.log('❌ Cannot add event - offline mode');
      return false;
    }

    try {
      // Prepare data for Firestore
      const firestoreData = this.prepareDataForFirestore(eventData);
      
      // Ensure required fields are present
      if (!firestoreData.title || !firestoreData.date || !firestoreData.groupId) {
        throw new Error('Missing required fields: title, date, or groupId');
      }
      
      console.log('💾 Saving to Firestore with data:', firestoreData);
      const docRef = await addDoc(collection(db, 'events'), firestoreData);
      console.log('✅ Event saved with ID:', docRef.id);

      // Add the new event to local array immediately
      const newEvent = {
        ...eventData,
        id: docRef.id
      } as Event;
      
      this.events.push(newEvent);
      this.events.sort((a, b) => a.date.getTime() - b.date.getTime());
      this.notifyListeners();

      // Also refresh from server to ensure consistency
      setTimeout(() => {
        this.fetchEvents(eventData.groupId);
      }, 500);
      
      return true;
    } catch (error: any) {
      console.error('❌ Error adding event:', error);
      this.errorMessage = `Error adding event: ${error.message}`;
      return false;
    } finally {
      this.isLoading = false;
    }
  }

  async updateEvent(event: Event): Promise<boolean> {
    if (!event.id) {
      console.error('❌ Cannot update event without ID');
      return false;
    }

    this.isLoading = true;
    this.errorMessage = null;

    if (this.isOfflineMode) {
      this.errorMessage = "Cannot update events in offline mode";
      this.isLoading = false;
      return false;
    }

    try {
      // Remove id from update data
      const { id, ...updateData } = event;
      
      // Prepare data for Firestore
      const firestoreData = this.prepareDataForFirestore(updateData);

      console.log('📝 Updating event:', id, firestoreData);
      await updateDoc(doc(db, 'events', id), firestoreData);
      console.log('✅ Event updated successfully');

      // Update local array immediately
      const index = this.events.findIndex(e => e.id === id);
      if (index !== -1) {
        this.events[index] = event;
        this.events.sort((a, b) => a.date.getTime() - b.date.getTime());
        this.notifyListeners();
      }

      // Also refresh from server
      setTimeout(() => {
        this.fetchEvents(event.groupId);
      }, 500);

      return true;
    } catch (error: any) {
      console.error('❌ Error updating event:', error);
      this.errorMessage = `Error updating event: ${error.message}`;
      return false;
    } finally {
      this.isLoading = false;
    }
  }

  async deleteEvent(event: Event): Promise<boolean> {
    if (!event.id) return false;

    this.isLoading = true;
    this.errorMessage = null;

    if (this.isOfflineMode) {
      this.errorMessage = "Cannot delete events in offline mode";
      this.isLoading = false;
      return false;
    }

    try {
      await deleteDoc(doc(db, 'events', event.id));
      
      // Remove from local array immediately
      this.events = this.events.filter(e => e.id !== event.id);
      this.notifyListeners();
      
      return true;
    } catch (error: any) {
      console.error('❌ Error deleting event:', error);
      this.errorMessage = `Error deleting event: ${error.message}`;
      return false;
    } finally {
      this.isLoading = false;
    }
  }

  // Cache methods
  private saveToCache(groupId: string, events: Event[]) {
    try {
      const cacheData = events.map(event => ({
        ...event,
        date: event.date.toISOString(),
        hotelCheckIn: event.hotelCheckIn?.toISOString(),
        hotelCheckOut: event.hotelCheckOut?.toISOString()
      }));
      
      localStorage.setItem(`events_${groupId}`, JSON.stringify(cacheData));
      console.log('💾 Events saved to cache');
    } catch (error) {
      console.warn('⚠️ Failed to save events to cache:', error);
    }
  }

  private loadFromCache(groupId: string): Event[] {
    try {
      const cached = localStorage.getItem(`events_${groupId}`);
      if (cached) {
        const events = JSON.parse(cached).map((event: any) => ({
          ...event,
          date: new Date(event.date),
          hotelCheckIn: event.hotelCheckIn ? new Date(event.hotelCheckIn) : undefined,
          hotelCheckOut: event.hotelCheckOut ? new Date(event.hotelCheckOut) : undefined
        }));
        
        console.log('📱 Loaded events from cache:', events);
        this.events = events;
        this.notifyListeners();
        
        if (this.isOfflineMode) {
          this.errorMessage = "Loaded from cache (offline mode)";
        }
        
        return events;
      }
    } catch (error) {
      console.warn('⚠️ Failed to load events from cache:', error);
    }
    
    console.log('❌ No cached events found');
    this.errorMessage = "No data available in offline mode";
    this.isLoading = false;
    return [];
  }

  // Utility methods
  eventsForDate(date: Date): Event[] {
    return this.events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
  }

  upcomingEvents(limit: number = 5): Event[] {
    const now = new Date();
    return this.events
      .filter(event => event.date > now)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, limit);
  }

  eventsByType(type: EventType): Event[] {
    return this.events.filter(event => event.type === type);
  }

  eventsInPeriod(startDate: Date, endDate: Date): Event[] {
    return this.events.filter(event => 
      event.date >= startDate && event.date <= endDate
    );
  }

  eventsForMonth(month: number, year: number): Event[] {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    return this.eventsInPeriod(startDate, endDate);
  }

  clearAllData() {
    this.events = [];
    this.errorMessage = null;
    this.notifyListeners();
  }
}

export const eventService = EventService.getInstance();

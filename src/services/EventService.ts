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

  async fetchEvents(groupId: string): Promise<Event[]> {
    console.log('🔍 Fetching events for group:', groupId);
    this.isLoading = true;
    this.errorMessage = null;

    if (this.isOfflineMode) {
      console.log('📱 Offline mode, loading from cache');
      return this.loadFromCache(groupId);
    }

    try {
      // Simplified query without ordering to avoid index requirement
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
          date: data.date.toDate(),
          hotelCheckIn: data.hotelCheckIn?.toDate(),
          hotelCheckOut: data.hotelCheckOut?.toDate()
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
      const firestoreData = {
        ...eventData,
        date: Timestamp.fromDate(eventData.date),
        hotelCheckIn: eventData.hotelCheckIn ? Timestamp.fromDate(eventData.hotelCheckIn) : null,
        hotelCheckOut: eventData.hotelCheckOut ? Timestamp.fromDate(eventData.hotelCheckOut) : null
      };

      console.log('💾 Saving to Firestore:', firestoreData);
      const docRef = await addDoc(collection(db, 'events'), firestoreData);
      console.log('✅ Event saved with ID:', docRef.id);

      // Refresh events immediately
      await this.fetchEvents(eventData.groupId);
      
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
    if (!event.id) return false;

    this.isLoading = true;
    this.errorMessage = null;

    if (this.isOfflineMode) {
      this.errorMessage = "Cannot update events in offline mode";
      this.isLoading = false;
      return false;
    }

    try {
      await updateDoc(doc(db, 'events', event.id), {
        ...event,
        date: Timestamp.fromDate(event.date),
        hotelCheckIn: event.hotelCheckIn ? Timestamp.fromDate(event.hotelCheckIn) : null,
        hotelCheckOut: event.hotelCheckOut ? Timestamp.fromDate(event.hotelCheckOut) : null
      });

      await this.fetchEvents(event.groupId);
      return true;
    } catch (error: any) {
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
      await this.fetchEvents(event.groupId);
      return true;
    } catch (error: any) {
      this.errorMessage = `Error deleting event: ${error.message}`;
      return false;
    } finally {
      this.isLoading = false;
    }
  }

  // Cache methods
  private saveToCache(groupId: string, events: Event[]) {
    try {
      localStorage.setItem(`events_${groupId}`, JSON.stringify(events.map(event => ({
        ...event,
        date: event.date.toISOString(),
        hotelCheckIn: event.hotelCheckIn?.toISOString(),
        hotelCheckOut: event.hotelCheckOut?.toISOString()
      }))));
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

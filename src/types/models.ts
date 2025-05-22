// BandSync Web - TypeScript Models

// ============= ENUMS =============

export enum UserRole {
 ADMIN = "Admin",
 MANAGER = "Manager", 
 MUSICIAN = "Musician",
 MEMBER = "Member"
}

export enum EventType {
 CONCERT = "Concert",
 FESTIVAL = "Festival", 
 REHEARSAL = "Rehearsal",
 MEETING = "Meeting",
 INTERVIEW = "Interview",
 PHOTOSHOOT = "Photoshoot",
 PERSONAL = "Personal"
}

export enum EventStatus {
 BOOKED = "Booked",
 CONFIRMED = "Confirmed"
}

export enum ChatType {
 GROUP = "group",
 DIRECT = "direct"
}

export enum FinanceType {
 INCOME = "Income",
 EXPENSE = "Expense"
}

export enum FinanceCategory {
 // Expenses
 LOGISTICS = "Logistics",
 ACCOMMODATION = "Accommodation", 
 FOOD = "Food",
 GEAR = "Equipment",
 PROMO = "Promotion",
 OTHER = "Other",
 // Income
 PERFORMANCE = "Performances",
 MERCH = "Merchandise",
 ROYALTIES = "Royalties",
 SPONSORSHIP = "Sponsorship"
}

export enum MerchCategory {
 CLOTHING = "Clothing",
 MUSIC = "Music",
 ACCESSORY = "Accessories",
 OTHER = "Other"
}

export enum MerchSaleChannel {
 CONCERT = "Concert",
 ONLINE = "Online", 
 STORE = "Store",
 GIFT = "Gift",
 OTHER = "Other"
}

export enum ModuleType {
 CALENDAR = "calendar",
 SETLISTS = "setlists", 
 FINANCES = "finances",
 MERCHANDISE = "merchandise",
 TASKS = "tasks",
 CHATS = "chats",
 CONTACTS = "contacts",
 ADMIN = "admin"
}

export enum TimeFrame {
 WEEK = "Week",
 MONTH = "Month",
 QUARTER = "Quarter", 
 YEAR = "Year",
 ALL = "All time"
}

// ============= MODELS =============

export interface UserModel {
 id: string;
 email: string;
 name: string;
 phone: string;
 groupId?: string;
 role: UserRole;
 isOnline?: boolean;
 lastSeen?: Date;
}

export interface GroupModel {
 id?: string;
 name: string;
 code: string;
 members: string[];
 pendingMembers: string[];
}

export interface Contact {
 id?: string;
 name: string;
 email: string; 
 phone: string;
 role: string;
 groupId: string;
 eventTag?: string;
 eventType?: string;
}

export interface Event {
 id?: string;
 title: string;
 date: Date;
 type: EventType;
 status: EventStatus;
 location?: string;
 organizerName?: string;
 organizerEmail?: string;
 organizerPhone?: string;
 coordinatorName?: string;
 coordinatorEmail?: string;
 coordinatorPhone?: string;
 hotelName?: string;
 hotelAddress?: string;
 hotelCheckIn?: Date;
 hotelCheckOut?: Date;
 fee?: number;
 currency?: string;
 notes?: string;
 schedule?: string[];
 setlistId?: string;
 groupId: string;
 isPersonal: boolean;
}

export interface Chat {
 id?: string;
 name: string;
 type: ChatType;
 participants: Record<string, boolean>;
 lastMessage?: string;
 lastMessageTime?: Date;
}

export interface GroupChatModel {
 groupId: string;
 bandId: string;
 adminId: string;
 groupName: string;
 members: string[];
 lastMessage: string;
 lastMessageSenderId: string;
 lastMessageTime?: number;
}

export interface Message {
 id?: string;
 chatId: string;
 senderId: string;
 text: string;
 timestamp: Date;
 replyTo?: string;
 seenBy: string[];
 deliveredTo: string[];
 isEdited: boolean;
}

export interface TaskModel {
 id?: string;
 title: string;
 description: string;
 assignedTo: string;
 dueDate: Date;
 completed: boolean;
 groupId: string;
}

export interface Song {
 id: string;
 title: string;
 durationMinutes: number;
 durationSeconds: number;
 bpm: number;
 key?: string;
 startTime?: Date;
}

export interface Setlist {
 id?: string;
 name: string;
 userId: string;
 groupId: string;
 isShared: boolean;
 songs: Song[];
 concertDate?: Date;
}

export interface MerchSizeStock {
 S: number;
 M: number;
 L: number;
 XL: number;
 XXL: number;
}

export interface MerchItem {
 id?: string;
 name: string;
 description: string;
 price: number;
 category: MerchCategory;
 subcategory?: string;
 stock: MerchSizeStock;
 groupId: string;
 imageURL?: string;
 imageUrls?: string[];
 lowStockThreshold: number;
 updatedAt: Date;
 createdAt: Date;
 barcode?: string;
 sku?: string;
 cost?: number;
}

export interface MerchSale {
 id?: string;
 itemId: string;
 size: string;
 quantity: number;
 date: Date;
 channel: MerchSaleChannel;
 groupId: string;
}

export interface FinanceRecord {
 id: string;
 type: FinanceType;
 amount: number;
 currency: string;
 category: string;
 details: string;
 date: Date;
 receiptUrl?: string;
 groupId: string;
}

export interface ModulePermission {
 moduleId: ModuleType;
 roleAccess: UserRole[];
}

export interface PermissionModel {
 id?: string;
 groupId: string;
 modules: ModulePermission[];
}

export interface MapPointModel {
 id: string;
 title: string;
 coordinate: {
   latitude: number;
   longitude: number;
 };
}

// ============= UTILITY CLASSES =============

// Event Type Colors (matching Swift exactly)
export class EventTypeUtils {
  static getColorHex(type: EventType): string {
    switch (type) {
      case EventType.CONCERT: return '#E63946';    // Red
      case EventType.FESTIVAL: return '#FFB703';   // Orange
      case EventType.REHEARSAL: return '#2A9D8F';  // Turquoise
      case EventType.MEETING: return '#457B9D';    // Blue
      case EventType.INTERVIEW: return '#8338EC';  // Purple
      case EventType.PHOTOSHOOT: return '#FF006E'; // Pink
      case EventType.PERSONAL: return '#A8DADC';   // Light Blue
      default: return '#A8DADC';
    }
  }

  static getDisplayName(type: EventType): string {
    switch (type) {
      case EventType.CONCERT: return 'Концерт';
      case EventType.FESTIVAL: return 'Фестиваль';
      case EventType.REHEARSAL: return 'Репетиция';
      case EventType.MEETING: return 'Встреча';
      case EventType.INTERVIEW: return 'Интервью';
      case EventType.PHOTOSHOOT: return 'Фотосессия';
      case EventType.PERSONAL: return 'Личное';
      default: return 'Событие';
    }
  }

  static getIcon(type: EventType): string {
    switch (type) {
      case EventType.CONCERT: return '🎤';
      case EventType.FESTIVAL: return '🎪';
      case EventType.REHEARSAL: return '🎹';
      case EventType.MEETING: return '👥';
      case EventType.INTERVIEW: return '🎙️';
      case EventType.PHOTOSHOOT: return '📸';
      case EventType.PERSONAL: return '👤';
      default: return '📅';
    }
  }
}

export class SongUtils {
 static getTotalSeconds(song: Song): number {
   return song.durationMinutes * 60 + song.durationSeconds;
 }

 static getFormattedDuration(song: Song): string {
   return `${song.durationMinutes.toString().padStart(2, '0')}:${song.durationSeconds.toString().padStart(2, '0')}`;
 }
}

export class SetlistUtils {
 static getTotalDuration(setlist: Setlist): number {
   return setlist.songs.reduce((total, song) => total + SongUtils.getTotalSeconds(song), 0);
 }

 static getFormattedTotalDuration(setlist: Setlist): string {
   const totalSeconds = this.getTotalDuration(setlist);
   const minutes = Math.floor(totalSeconds / 60);
   const seconds = totalSeconds % 60;
   return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
 }
}

export class MerchUtils {
 static getTotalStock(stock: MerchSizeStock): number {
   return stock.S + stock.M + stock.L + stock.XL + stock.XXL;
 }

 static hasLowStock(item: MerchItem): boolean {
   const total = this.getTotalStock(item.stock);
   
   if (total >= 50) return false;
   
   if (item.category === MerchCategory.CLOTHING) {
     const { S, M, L, XL, XXL } = item.stock;
     const threshold = item.lowStockThreshold;
     
     return (S > 0 && S <= threshold) ||
            (M > 0 && M <= threshold) ||
            (L > 0 && L <= threshold) ||
            (XL > 0 && XL <= threshold) ||
            (XXL > 0 && XXL <= threshold) ||
            total === 0;
   }
   
   return total <= item.lowStockThreshold;
 }

 static getSizesInStock(stock: MerchSizeStock): string[] {
   const sizes: string[] = [];
   if (stock.S > 0) sizes.push("S");
   if (stock.M > 0) sizes.push("M");
   if (stock.L > 0) sizes.push("L");
   if (stock.XL > 0) sizes.push("XL");
   if (stock.XXL > 0) sizes.push("XXL");
   return sizes;
 }

 static getProfitMargin(item: MerchItem): number | null {
   if (!item.cost || item.cost <= 0) return null;
   return ((item.price - item.cost) / item.price) * 100;
 }

 static generateSKU(item: MerchItem): string {
   if (item.sku && item.sku.length > 0) return item.sku;
   
   const categoryCode = {
     [MerchCategory.CLOTHING]: "CL",
     [MerchCategory.MUSIC]: "MU", 
     [MerchCategory.ACCESSORY]: "AC",
     [MerchCategory.OTHER]: "OT"
   }[item.category];
   
   const subcategoryCode = item.subcategory?.substring(0, 2).toUpperCase() ?? "XX";
   const nameCode = item.name.substring(0, 3).toUpperCase();
   const timestamp = Date.now() % 10000;
   
   return `${categoryCode}${subcategoryCode}${nameCode}${timestamp}`;
 }
}

export class ValidationService {
 static validateEmail(email: string): boolean {
   const trimmed = email.trim();
   const emailRegex = /^[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
   return emailRegex.test(trimmed);
 }

 static validateGroupName(name: string): { isValid: boolean; error?: string } {
   const trimmed = name.trim();
   
   if (trimmed.length === 0) {
     return { isValid: false, error: "Название группы не может быть пустым" };
   }
   
   if (trimmed.length < 2) {
     return { isValid: false, error: "Название группы должно содержать минимум 2 символа" };
   }
   
   if (trimmed.length > 50) {
     return { isValid: false, error: "Название группы не должно превышать 50 символов" };
   }
   
   return { isValid: true };
 }

 static validatePhone(phone: string): boolean {
   const trimmed = phone.trim();
   const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
   return phoneRegex.test(trimmed);
 }
}

export class PermissionUtils {
 static hasModuleAccess(permissions: PermissionModel, moduleType: ModuleType, userRole: UserRole): boolean {
   const modulePermission = permissions.modules.find(m => m.moduleId === moduleType);
   return modulePermission?.roleAccess.includes(userRole) ?? false;
 }

 static getAccessibleModules(permissions: PermissionModel, userRole: UserRole): ModuleType[] {
   return permissions.modules
     .filter(m => m.roleAccess.includes(userRole))
     .map(m => m.moduleId);
 }
}

export class TimeFrameUtils {
 static getDays(timeFrame: TimeFrame): number {
   switch (timeFrame) {
     case TimeFrame.WEEK: return 7;
     case TimeFrame.MONTH: return 30;
     case TimeFrame.QUARTER: return 90;
     case TimeFrame.YEAR: return 365;
     case TimeFrame.ALL: return 3650;
   }
 }

 static getDescription(timeFrame: TimeFrame): string {
   switch (timeFrame) {
     case TimeFrame.WEEK: return "Last 7 days";
     case TimeFrame.MONTH: return "Last 30 days";
     case TimeFrame.QUARTER: return "Last 3 months";
     case TimeFrame.YEAR: return "Last 12 months";
     case TimeFrame.ALL: return "All time";
   }
 }

 static getDateRange(timeFrame: TimeFrame): { start: Date; end: Date } {
   const end = new Date();
   const start = new Date();
   start.setDate(start.getDate() - this.getDays(timeFrame));
   return { start, end };
 }
}

// ============= FINANCE UTILITIES =============

export class FinanceUtils {
 static getCategoriesForType(type: FinanceType): FinanceCategory[] {
   switch (type) {
     case FinanceType.INCOME:
       return [FinanceCategory.PERFORMANCE, FinanceCategory.MERCH, FinanceCategory.ROYALTIES, FinanceCategory.SPONSORSHIP, FinanceCategory.OTHER];
     case FinanceType.EXPENSE:
       return [FinanceCategory.LOGISTICS, FinanceCategory.ACCOMMODATION, FinanceCategory.FOOD, FinanceCategory.GEAR, FinanceCategory.PROMO, FinanceCategory.OTHER];
   }
 }

 static calculateBalance(records: FinanceRecord[]): number {
   return records.reduce((balance, record) => {
     return record.type === FinanceType.INCOME 
       ? balance + record.amount 
       : balance - record.amount;
   }, 0);
 }

 static getTotalByType(records: FinanceRecord[], type: FinanceType): number {
   return records
     .filter(record => record.type === type)
     .reduce((total, record) => total + record.amount, 0);
 }

 static getRecordsByCategory(records: FinanceRecord[], category: FinanceCategory): FinanceRecord[] {
   return records.filter(record => record.category === category);
 }

 static getRecordsByTimeFrame(records: FinanceRecord[], timeFrame: TimeFrame): FinanceRecord[] {
   const { start, end } = TimeFrameUtils.getDateRange(timeFrame);
   return records.filter(record => record.date >= start && record.date <= end);
 }
}

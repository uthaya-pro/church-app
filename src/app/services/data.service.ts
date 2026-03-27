import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: string;
  joinDate: Date;
  status: 'active' | 'inactive' | 'pending';
  role: string;
}

export interface Event {
  id: string;
  title: string;
  date: Date;
  time: string;
  location: string;
  description: string;
  attendees: number;
  capacity: number;
}

export interface Donation {
  id: string;
  donor: string;
  amount: number;
  date: Date;
  category: string;
  method: 'cash' | 'check' | 'online' | 'other';
}

@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly apiUrl = 'http://localhost:3000';

  members = signal<Member[]>(this.loadFromStorage<Member[]>('members') || []);
  events = signal<Event[]>(this.loadFromStorage<Event[]>('events') || []);
  donations = signal<Donation[]>(this.loadFromStorage<Donation[]>('donations') || []);

  totalMembers = computed(() => this.members().length);
  activeMembersCount = computed(() => this.members().filter(m => m.status === 'active').length);
  eventsCount = computed(() => this.events().length);
  donationsThisMonth = computed(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    return this.donations()
      .filter(d => d.date.getFullYear() === year && d.date.getMonth() === month)
      .reduce((s, d) => s + d.amount, 0);
  });

  constructor(private http: HttpClient) {
    this.loadMembers();
    this.loadEvents();
    this.loadDonations();
  }

  private mapMember(m: any): Member {
    return {
      id: String(m.id),
      name: m.name,
      email: m.email,
      phone: m.phone,
      age: m.age,
      status: m.status,
      role: m.role,
      joinDate: m.joinDate ? new Date(m.joinDate) : new Date(),
    };
  }

  async loadMembers(): Promise<void> {
    try {
      const result = await firstValueFrom(this.http.get<Member[]>(`${this.apiUrl}/members`));
      const mapped = result.map(m => this.mapMember(m));
      this.members.set(mapped);
      this.saveToStorage('members', mapped);
    } catch {
      const fallback = this.loadFromStorage<Member[]>('members');
      if (fallback && fallback.length > 0) {
        this.members.set(fallback.map(m => ({ ...m, joinDate: new Date(m.joinDate) })));
      } else if (this.members().length === 0) {
        this.seedMembers();
      }
    }
  }

  async addMember(member: Member): Promise<Member> {
    try {
      const payload = {
        name: member.name,
        email: member.email,
        phone: member.phone,
        age: member.age,
        status: member.status,
        role: member.role,
        joinDate: member.joinDate.toISOString(),
      };
      const created = await firstValueFrom(this.http.post<Member>(`${this.apiUrl}/members`, payload));
      const mapped = this.mapMember(created);
      this.members.update(list => [...list, mapped]);
      this.saveToStorage('members', this.members());
      return mapped;
    } catch {
      const local = { ...member, id: Date.now().toString() };
      this.members.update(list => [...list, local]);
      this.saveToStorage('members', this.members());
      return local;
    }
  }

  async updateMember(updated: Member): Promise<Member> {
    try {
      const payload = {
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        age: updated.age,
        status: updated.status,
        role: updated.role,
        joinDate: updated.joinDate.toISOString(),
      };
      const result = await firstValueFrom(this.http.put<Member>(`${this.apiUrl}/members/${updated.id}`, payload));
      const mapped = this.mapMember(result);
      this.members.update(list => list.map(item => (item.id === mapped.id ? mapped : item)));
      this.saveToStorage('members', this.members());
      return mapped;
    } catch {
      this.members.update(list => list.map(item => (item.id === updated.id ? updated : item)));
      this.saveToStorage('members', this.members());
      return updated;
    }
  }

  async deleteMember(id: string): Promise<void> {
    try {
      await firstValueFrom(this.http.delete(`${this.apiUrl}/members/${id}`));
      this.members.update(list => list.filter(m => m.id !== id));
      this.saveToStorage('members', this.members());
    } catch {
      this.members.update(list => list.filter(m => m.id !== id));
      this.saveToStorage('members', this.members());
    }
  }

  getMemberById(id: string): Member | undefined {
    return this.members().find(m => m.id === id);
  }

  async loadEvents(): Promise<void> {
    if (this.events().length === 0) {
      const stored = this.loadFromStorage<Event[]>('events');
      if (stored && stored.length > 0) {
        this.events.set(stored.map(e => ({ ...e, date: new Date(e.date) })));
      } else {
        this.seedEvents();
      }
    }
  }

  async loadDonations(): Promise<void> {
    if (this.donations().length === 0) {
      const stored = this.loadFromStorage<Donation[]>('donations');
      if (stored && stored.length > 0) {
        this.donations.set(stored.map(d => ({ ...d, date: new Date(d.date) })));
      } else {
        this.seedDonations();
      }
    }
  }

  addEvent(event: Event) {
    this.events.update(list => [...list, event]);
    this.saveToStorage('events', this.events());
  }

  updateEvent(updated: Event) {
    this.events.update(list => list.map(e => (e.id === updated.id ? updated : e)));
    this.saveToStorage('events', this.events());
  }

  deleteEvent(id: string) {
    this.events.update(list => list.filter(e => e.id !== id));
    this.saveToStorage('events', this.events());
  }

  addDonation(donation: Donation) {
    this.donations.update(list => [...list, donation]);
    this.saveToStorage('donations', this.donations());
  }

  updateDonation(updated: Donation) {
    this.donations.update(list => list.map(d => (d.id === updated.id ? updated : d)));
    this.saveToStorage('donations', this.donations());
  }

  deleteDonation(id: string) {
    this.donations.update(list => list.filter(d => d.id !== id));
    this.saveToStorage('donations', this.donations());
  }

  private loadFromStorage<T>(key: string): T | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const data = window.localStorage.getItem(key);
        if (!data) return null;
        return JSON.parse(data) as T;
      }
    } catch {
      // ignore
    }
    return null;
  }

  private saveToStorage(key: string, data: any) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, JSON.stringify(data));
      }
    } catch {
      // ignore
    }
  }

  private seedMembers() {
    const sample: Member[] = [
      { id: '1', name: 'Joshua', email: 'josh@example.com', phone: '555-0101', age: '21', joinDate: new Date(2020, 0, 15), status: 'active', role: 'Member' },
      { id: '2', name: 'Mani', email: 'mani@example.com', phone: '555-0102', age: '21', joinDate: new Date(2021, 6, 22), status: 'active', role: 'Elder' },
      { id: '3', name: 'Kriti', email: 'kriti@example.com', phone: '555-0103', age: '21', joinDate: new Date(2019, 3, 10), status: 'active', role: 'Deacon' },
      { id: '4', name: 'Uthaya', email: 'uthaya@example.com', phone: '555-0104', age: '34', joinDate: new Date(2023, 11, 5), status: 'pending', role: 'Member' },
      { id: '5', name: 'Madesh', email: 'maadu@example.com', phone: '555-0105', age: '48', joinDate: new Date(2018, 2, 28), status: 'inactive', role: 'Member' },
    ];
    this.members.set(sample);
    this.saveToStorage('members', sample);
  }

  private seedEvents() {
    const sample: Event[] = [
      {
        id: '1',
        title: 'Sunday Service',
        date: new Date(),
        time: '10:00 AM',
        location: 'Main Sanctuary',
        description: 'Weekly Sunday worship service',
        attendees: 156,
        capacity: 200,
      },
      {
        id: '2',
        title: 'Bible Study',
        date: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000),
        time: '7:00 PM',
        location: 'Fellowship Hall',
        description: 'Weekly Bible discussion and prayer',
        attendees: 45,
        capacity: 60,
      },
    ];
    this.events.set(sample);
    this.saveToStorage('events', sample);
  }

  private seedDonations() {
    const sample: Donation[] = [
      { id: '1', donor: 'John Doe', amount: 250, date: new Date(), category: 'Tithes', method: 'online' },
      { id: '2', donor: 'Jane Smith', amount: 500, date: new Date(new Date().getTime() - 86400000), category: 'Building Fund', method: 'check' },
    ];
    this.donations.set(sample);
    this.saveToStorage('donations', sample);
  }
}

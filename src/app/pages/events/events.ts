import { Component, ChangeDetectionStrategy, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataService, Event as EventModel } from '../../services/data.service';

interface Event {
  id: string;
  title: string;
  date: Date;
  time: string;
  location: string;
  description: string;
  attendees: number;
  capacity: number;
}

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './events.html',
  styleUrl: './events.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventsComponent implements OnInit {
  events: any;
  isLoading = signal(false);
  selectedEvent = signal<any | null>(null);

  // form
  title = signal('');
  date = signal<string>(new Date().toISOString().slice(0, 10));
  time = signal('10:00 AM');
  location = signal('Main Sanctuary');
  description = signal('');
  capacity = signal<string | number | null>(100);

  constructor(private router: Router, private dataService: DataService) {}

  ngOnInit(): void {
    this.events = this.dataService.events;
    // DataService seeds events if empty
    this.isLoading.set(false);
  }

  addEvent(): void {
    if (!this.title().trim()) return;
    const newEvent: EventModel = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title: this.title().trim(),
      date: new Date(this.date()),
      time: this.time(),
      location: this.location(),
      description: this.description(),
      attendees: 0,
      capacity: Number(this.capacity() || 0),
    };
    this.dataService.addEvent(newEvent);
    // reset
    this.title.set('');
    this.date.set(new Date().toISOString().slice(0, 10));
    this.time.set('10:00 AM');
    this.location.set('Main Sanctuary');
    this.description.set('');
    this.capacity.set(100);
  }

  getAttendancePercentage(attendees: number, capacity: number): number {
    return Math.round((attendees / capacity) * 100);
  }

  viewDetails(event: any): void {
    this.selectedEvent.set(event);
  }

  closeDetail(): void {
    this.selectedEvent.set(null);
  }

  deleteEvent(eventId: string): void {
    this.dataService.deleteEvent(eventId);
    this.closeDetail();
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}

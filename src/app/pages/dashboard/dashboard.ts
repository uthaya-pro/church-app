import { Component, ChangeDetectionStrategy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataService } from '../../services/data.service';

interface StatCard {
  title: string;
  value: number | string;
  icon: string;
  color: 'blue' | 'green' | 'yellow' | 'red';
  change?: number;
}

interface Activity {
  id: string;
  title: string;
  date: Date;
  type:  'event' | 'donation' | 'member';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  stats = signal<StatCard[]>([]);
  activities = signal<Activity[]>([]);
  userEmail = signal('');
  isLoading = signal(true);

  constructor(private router: Router, private data: DataService) {
    // Avoid accessing window/localStorage during server-side rendering
    let email: string | null = null;
    try {
      if (typeof window !== 'undefined' && window?.localStorage) {
        email = window.localStorage.getItem('userEmail');
      }
    } catch (_e) {
      email = null;
    }
    this.userEmail.set(email || 'User');
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    // build stats from data service
    this.stats.set([
      {
        title: 'Total Members',
        value: this.data.totalMembers(),
        icon: '👥',
        color: 'blue',
      },
      {
        title: 'Active Members',
        value: this.data.activeMembersCount(),
        icon: '✅',
        color: 'green',
      },
      {
        title: 'Events Scheduled',
        value: this.data.eventsCount(),
        icon: '📅',
        color: 'yellow',
      },
      {
        title: 'Donations (This Month)',
        value: `$${this.data.donationsThisMonth()}`,
        icon: '💰',
        color: 'green',
      },
    ]);
    // a simple "activity" list could be built from recent items
    const actList: Activity[] = [];
    this.data.events().slice(-3).forEach(e => actList.push({ id: e.id, title: e.title, date: e.date, type: 'event' }));
    this.data.members().slice(-3).forEach(m => actList.push({ id: m.id, title: `Member registered: ${m.name}`, date: m.joinDate, type: 'member' }));
    this.data.donations().slice(-3).forEach(d => actList.push({ id: d.id, title: `Donation $${d.amount}`, date: d.date, type: 'donation' }));
    // sort by date descending
    actList.sort((a, b) => b.date.getTime() - a.date.getTime());
    this.activities.set(actList);
    this.isLoading.set(false);
  }

  navigateTo(page: string): void {
    this.router.navigate([`/${page}`]);
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    this.router.navigate(['/login']);
  }

  formatDate(date: Date): string {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  }
}

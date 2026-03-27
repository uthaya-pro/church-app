import { Component, ChangeDetectionStrategy, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { DataService, Member } from '../../services/data.service';

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './members.html',
  styleUrl: './members.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MembersComponent implements OnInit {
  // proxy to shared data service signals
  get members() {
    return this.data.members;
  }

  get totalMembers() {
    return this.data.totalMembers();
  }

  get activeMembers() {
    return this.data.activeMembersCount();
  }

  isLoading = signal(true);
  searchQuery = signal('');
  filterStatus = signal<'all' | 'active' | 'inactive' | 'pending'>('all');
  // stats are computed in the data service if needed

  // form state
  showForm = signal(false);
  newMember: Partial<Member> = {
    name: '',
    email: '',
    phone: '',
    role: '',
    age:'',
    status: 'active',
    joinDate: undefined,
  };

  constructor(private router: Router, private data: DataService) {}

  ngOnInit(): void {
    // data service already holds list (seeded or from storage);
    this.isLoading.set(false);
  }

  getMembers() {
    const filtered = this.members().filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(this.searchQuery().toLowerCase());
      const matchesFilter = this.filterStatus() === 'all' || m.status === this.filterStatus();
      return matchesSearch && matchesFilter;
    });
    return filtered;
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  trackById(index: number, member: Member) {
    return member.id;
  }

  /** form helpers */
  private updateStats(): void {
    // stats are computed in DataService; no-op
  }

  async submitForm(form?: NgForm): Promise<void> {
    // template form validation
    if (form && form.invalid) {
      return;
    }

    if (!this.newMember.name || !this.newMember.email || !this.newMember.phone || !this.newMember.role || !this.newMember.age) {
      return;
    }

    const member: Member = {
      id: Date.now().toString(),
      name: this.newMember.name,
      email: this.newMember.email,
      phone: this.newMember.phone,
      role: this.newMember.role,
      age: this.newMember.age,
      status: (this.newMember.status as Member['status']) || 'active',
      joinDate: this.newMember.joinDate ? new Date(this.newMember.joinDate) : new Date(),
    };

    await this.data.addMember(member);

    if (form) {
      form.resetForm();
    }
    this.resetForm();
    this.showForm.set(false);
  }

  cancelForm(form?: NgForm): void {
    if (form) {
      form.resetForm();
    }
    this.resetForm();
    this.showForm.set(false);
  }

  private resetForm(): void {
    this.newMember = {
      name: '',
      email: '',
      phone: '',
      role: '',
      age:'',
      status: 'active',
      joinDate: undefined,
    };
  }
}

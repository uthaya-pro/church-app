import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DataService, Member } from '../../services/data.service';

@Component({
  selector: 'app-member-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './member-detail.html',
  styleUrl: './member-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberDetailComponent implements OnInit {
  member = signal<Member | null>(null);
  editMode = signal(false);
  edited: Partial<Member> = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private data: DataService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const found = this.data.getMemberById(id);
      if (found) {
        this.member.set(found);
      } else {
        // not found, go back
        this.router.navigate(['/members']);
      }
    }
  }

  enableEdit(): void {
    const m = this.member();
    if (m) {
      this.edited = { ...m };
      this.editMode.set(true);
    }
  }

  async saveChanges(): Promise<void> {
    if (!this.edited.name || !this.edited.email || !this.edited.phone || !this.edited.role || !this.edited.age) {
      return;
    }
    const current = this.member();
    if (current) {
      const updated: Member = {
        ...current,
        ...this.edited,
        joinDate: this.edited.joinDate ? new Date(this.edited.joinDate) : current.joinDate,
      };
      await this.data.updateMember(updated);
      this.member.set(updated);
      this.editMode.set(false);
    }
  }

  async deleteMember(): Promise<void> {
    const current = this.member();
    if (current && confirm('Are you sure you want to delete this member?')) {
      await this.data.deleteMember(current.id);
      this.router.navigate(['/members']);
    }
  }

  goBack(): void {
    this.router.navigate(['/members']);
  }
}

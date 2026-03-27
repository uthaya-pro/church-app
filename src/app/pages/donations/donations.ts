import { Component, ChangeDetectionStrategy, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataService, Donation as DonationModel } from '../../services/data.service';

interface Donation {
  id: string;
  donor: string;
  amount: number;
  date: Date;
  category: string;
  method: 'cash' | 'check' | 'online' | 'other';
}

@Component({
  selector: 'app-donations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './donations.html',
  styleUrl: './donations.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DonationsComponent implements OnInit {
  // donations signal reference (set in ngOnInit)
  donations: any;
  isLoading = signal(false);
  selectedDonation = signal<any | null>(null);

  // form signals
  donor = signal('');
  amount = signal<string | number | null>(null);
  category = signal('Tithes');
  method = signal<'cash' | 'check' | 'online' | 'other'>('cash');
  date = signal<string>(new Date().toISOString().slice(0, 10));

  totalAmount = computed(() => this.donations().reduce((s: number, d: any) => s + (d.amount || 0), 0));
  monthlyAverage = computed(() => {
    const list = this.donations();
    if (list.length === 0) return 0;
    return Math.round(this.totalAmount() / list.length);
  });

  constructor(private router: Router, private dataService: DataService) {}

  ngOnInit(): void {
    // bind to service signals after DI
    this.donations = this.dataService.donations;
    // no initial load needed; DataService seeds data if empty
    this.isLoading.set(false);
  }

  addDonation(): void {
    const amt = Number(this.amount());
    if (!this.donor().trim() || !amt || isNaN(amt)) return;
    const newDonation: DonationModel = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      donor: this.donor().trim(),
      amount: amt,
      date: new Date(this.date()),
      category: this.category(),
      method: this.method(),
    };
    this.dataService.addDonation(newDonation);
    // reset form
    this.donor.set('');
    this.amount.set(null);
    this.date.set(new Date().toISOString().slice(0, 10));
  }

  viewDetails(donation: any): void {
    this.selectedDonation.set(donation);
  }

  closeDetail(): void {
    this.selectedDonation.set(null);
  }

  deleteDonation(donationId: string): void {
    this.dataService.deleteDonation(donationId);
    this.closeDetail();
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}

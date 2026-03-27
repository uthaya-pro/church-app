import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { EventsComponent } from './pages/events/events';
import { DonationsComponent } from './pages/donations/donations';
import { MembersComponent } from './pages/members/members';
import { MemberDetailComponent } from './pages/members/member-detail';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
  },
  {
    path: 'members',
    component: MembersComponent,
  },
  {
    path: 'members/:id',
    component: MemberDetailComponent,
  },
  
  {
    path: 'events',
    component: EventsComponent,
  },
  {
    path: 'donations',
    component: DonationsComponent,
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
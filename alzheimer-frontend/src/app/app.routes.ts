import { Routes } from '@angular/router';
import {
  AboutPageComponent,
  ContactPageComponent,
  DepartmentsPageComponent,
  DoctorsPageComponent,
  ServicesPageComponent,
  SignInPageComponent
} from './site-pages';
import { HomePageComponent } from './pages/home/home';
import { DashboardPageComponent } from './pages/dashboard/dashboard';
import { PatientRegisterPageComponent } from './pages/patient-register/patient-register';
import { CognitiveQuestionnairePageComponent } from './pages/cognitive-questionnaire/cognitive-questionnaire';
import { PatientHomePageComponent } from './pages/patient-home/patient-home';
import { AdminDashboardPageComponent } from './pages/admin/admin-dashboard/admin-dashboard';
import { AdminDoctorsPageComponent } from './pages/admin/admin-doctors/admin-doctors';
import { AdminPatientsPageComponent } from './pages/admin/admin-patients/admin-patients';
import { MriUploadPageComponent } from './pages/mri-upload/mri-upload';
import { PatientRecordListPageComponent } from './pages/patient-record-list/patient-record-list';
import { PatientRecordDetailPageComponent } from './pages/patient-record-detail/patient-record-detail';
import { AssessmentReviewPageComponent } from './pages/assessment-review/assessment-review';
import { MyResultsPageComponent } from './pages/my-results/my-results';
import { medecinGuard } from './guards/medecin-guard';
import { patientGuard } from './guards/patient-guard';
import { adminGuard } from './guards/admin-guard';

export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'about', component: AboutPageComponent },
  { path: 'departments', component: DepartmentsPageComponent },
  { path: 'services', component: ServicesPageComponent },
  { path: 'doctors', component: DoctorsPageComponent },
  { path: 'contact', component: ContactPageComponent },

  { path: 'sign-in', component: SignInPageComponent },
  { path: 'register', component: PatientRegisterPageComponent },

  {
    path: 'dashboard',
    component: DashboardPageComponent,
    canActivate: [medecinGuard]
  },
  {
    path: 'patients',
    component: PatientRecordListPageComponent,
    canActivate: [medecinGuard]
  },
  {
    path: 'patients/:id',
    component: PatientRecordDetailPageComponent,
    canActivate: [medecinGuard]
  },
  {
    path: 'patients/:email/mri-upload',
    component: MriUploadPageComponent,
    canActivate: [medecinGuard]
  },
  {
    path: 'assessments/:id',
    component: AssessmentReviewPageComponent,
    canActivate: [medecinGuard]
  },

  {
    path: 'home',
    component: PatientHomePageComponent,
    canActivate: [patientGuard]
  },
  {
    path: 'questionnaire',
    component: CognitiveQuestionnairePageComponent,
    canActivate: [patientGuard]
  },
  {
    path: 'my-results',
    component: MyResultsPageComponent,
    canActivate: [patientGuard]
  },

  {
    path: 'admin',
    component: AdminDashboardPageComponent,
    canActivate: [adminGuard]
  },
  {
    path: 'admin/doctors',
    component: AdminDoctorsPageComponent,
    canActivate: [adminGuard]
  },
  {
    path: 'admin/patients',
    component: AdminPatientsPageComponent,
    canActivate: [adminGuard]
  },

  { path: '**', redirectTo: '' }
];
import { Component,ViewEncapsulation,signal } from '@angular/core';
import { Router,RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth';

@Component({
  standalone: true,
  selector: 'app-about-page',
  imports: [RouterLink],
  template: `
    <main class="main">
      <section class="section">
        <div class="container section-title" data-aos="fade-up">
          <h2>About NeuroAssist</h2>
          <p>A platform built around one goal: helping cognitive changes get noticed and reviewed sooner.</p>
        </div>
        <div class="container" data-aos="fade-up" data-aos-delay="100">
          <div class="row align-items-center gy-5">
            <div class="col-lg-6">
              <img src="assets/img/health/facilities-9.webp" alt="Healthcare team" class="img-fluid rounded-4 shadow-sm">
            </div>
            <div class="col-lg-6">
              <h3 class="mb-3">Early detection, backed by real care teams</h3>
              <p>NeuroAssist pairs a short, accessible cognitive questionnaire with structured monitoring — so patients get more than a score, and clinicians get more than a spreadsheet.</p>
              <div class="row g-3 mt-3">
                <div class="col-md-6">
                  <div class="p-4 rounded-4 bg-white shadow-sm h-100">
                    <i class="bi bi-shield-check fs-2 text-primary"></i>
                    <h5 class="mt-3">Trusted Standards</h5>
                    <p class="mb-0">Every result is reviewed by a clinician — never an automated diagnosis.</p>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="p-4 rounded-4 bg-white shadow-sm h-100">
                    <i class="bi bi-people fs-2 text-primary"></i>
                    <h5 class="mt-3">Two Roles, One Platform</h5>
                    <p class="mb-0">Patients track their own results; clinicians manage their patient list in one place.</p>
                  </div>
                </div>
              </div>
              <a routerLink="/contact" class="btn btn-primary mt-4">Talk To Our Team</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  `
})
export class AboutPageComponent {}

@Component({
  standalone: true,
  selector: 'app-departments-page',
  template: `
    <main class="main">
      <section class="departments section">
        <div class="container section-title" data-aos="fade-up">
          <h2>How We Support Cognitive Health</h2>
          <p>Three connected areas that make up the NeuroAssist screening and monitoring pathway.</p>
        </div>
        <div class="container" data-aos="fade-up" data-aos-delay="100">
          <div class="row g-5">
            <div class="col-lg-4 col-md-6">
              <div class="department-card">
                <div class="department-icon"><i class="fas fa-clipboard-list"></i></div>
                <div class="department-image"><img src="assets/img/health/cardiology-1.webp" alt="Cognitive Assessment" class="img-fluid"></div>
                <div class="department-content">
                  <h3>Cognitive Assessment</h3>
                  <p>A short, structured questionnaire designed to surface early signs of memory and thinking changes.</p>
                </div>
              </div>
            </div>
            <div class="col-lg-4 col-md-6">
              <div class="department-card">
                <div class="department-icon"><i class="fas fa-brain"></i></div>
                <div class="department-image"><img src="assets/img/health/neurology-4.webp" alt="Neurology Department" class="img-fluid"></div>
                <div class="department-content">
                  <h3>Neurology</h3>
                  <p>Screening pathways for neurological and cognitive changes, supported by structured data and expert review.</p>
                </div>
              </div>
            </div>
            <div class="col-lg-4 col-md-6">
              <div class="department-card">
                <div class="department-icon"><i class="fas fa-chart-line"></i></div>
                <div class="department-image"><img src="assets/img/health/facilities-6.webp" alt="Patient Monitoring" class="img-fluid"></div>
                <div class="department-content">
                  <h3>Patient Monitoring</h3>
                  <p>Ongoing tracking of assessment results over time, giving care teams a clear view of how things evolve.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  `
})
export class DepartmentsPageComponent {}

@Component({
  standalone: true,
  selector: 'app-services-page',
  template: `
    <main class="main">
      <section class="featured-services section">
        <div class="container section-title" data-aos="fade-up">
          <h2>Services</h2>
          <p>What patients and clinicians get from the NeuroAssist platform.</p>
        </div>
        <div class="container" data-aos="fade-up" data-aos-delay="100">
          <div class="row g-4">
            <div class="col-lg-4 col-md-6">
              <div class="service-item h-100">
                <div class="service-image">
                  <img src="assets/img/health/neurology-4.webp" alt="MRI analysis" class="img-fluid">
                  <div class="service-overlay"><i class="fas fa-brain"></i></div>
                </div>
                <div class="service-content">
                  <h3>AI-Assisted MRI Analysis</h3>
                  <p>Brain MRI scans are classified by a deep-learning model, with a heatmap showing which regions
                    drove the prediction.</p>
                </div>
              </div>
            </div>
            <div class="col-lg-4 col-md-6">
              <div class="service-item h-100">
                <div class="service-image">
                  <img src="assets/img/health/consultation-4.webp" alt="Cognitive screening" class="img-fluid">
                  <div class="service-overlay"><i class="fas fa-clipboard-check"></i></div>
                </div>
                <div class="service-content">
                  <h3>Adaptive Cognitive Screening</h3>
                  <p>A conversational questionnaire that adjusts each question to the patient's previous answers,
                    and can be revisited over time.</p>
                </div>
              </div>
            </div>
            <div class="col-lg-4 col-md-6">
              <div class="service-item h-100">
                <div class="service-image">
                  <img src="assets/img/health/maternal-2.webp" alt="Doctor review" class="img-fluid">
                  <div class="service-overlay"><i class="fas fa-user-doctor"></i></div>
                </div>
                <div class="service-content">
                  <h3>Doctor Review</h3>
                  <p>Every AI-drafted finding reaches a real clinician, who validates or corrects it before anything
                    is shared back with the patient.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  `,
  styles: [`
    /* The bundled theme styles .service-item as a horizontal sidebar list row
       and .service-overlay as a full-bleed gradient. This page uses a card
       grid instead, so these rules are scoped under .featured-services to
       outrank the theme's two-class selectors. */
    .featured-services .service-item {
      display: flex;
      flex-direction: column;
      gap: 0;
      padding: 0;
      border-bottom: none;
      background: #fff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(17, 35, 68, 0.08);
      transition: transform 0.25s ease, box-shadow 0.25s ease;
    }

    .featured-services .service-item:hover {
      transform: translateY(-6px);
      box-shadow: 0 18px 40px rgba(17, 35, 68, 0.14);
    }

    .featured-services .service-image {
      position: relative;
      overflow: hidden;
      flex-shrink: 0;
    }

    .featured-services .service-image img {
      display: block;
      width: 100%;
      height: 220px;
      object-fit: cover;
      transition: transform 0.4s ease;
    }

    .featured-services .service-item:hover .service-image img {
      transform: scale(1.06);
    }

    .featured-services .service-overlay {
      position: absolute;
      inset: auto 20px -26px auto;
      width: 52px;
      height: 52px;
      padding: 0;
      border-radius: 50%;
      background: var(--accent-color, #3b82f6);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.15rem;
      box-shadow: 0 6px 16px rgba(59, 130, 246, 0.35);
    }

    .featured-services .service-content {
      padding: 2.25rem 1.5rem 1.75rem;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }

    .featured-services .service-content h3 {
      font-size: 1.15rem;
      font-weight: 700;
      margin: 0;
      color: var(--heading-color, #0f172a);
    }

    .featured-services .service-content p {
      margin: 0;
      font-size: 0.95rem;
      line-height: 1.65;
      color: var(--text-muted, #64748b);
    }
  `]
})
export class ServicesPageComponent {}

@Component({
  standalone: true,
  selector: 'app-doctors-page',
  template: `
    <main class="main">
      <section class="find-a-doctor section">
        <div class="container section-title" data-aos="fade-up">
          <h2>Care Team</h2>
          <p>The clinicians behind the results your assessments get reviewed by.</p>
        </div>
        <div class="container" data-aos="fade-up" data-aos-delay="100">
          <div class="row g-4">
            <div class="col-lg-3 col-md-6">
              <div class="doctor-card">
                <div class="doctor-image"><img src="assets/img/health/staff-2.webp" alt="Dr. Amanda Foster" class="img-fluid"></div>
                <div class="doctor-content">
                  <h4>Dr. Amanda Foster</h4>
                  <span class="specialty">Cognitive Health Specialist</span>
                  <p>Focused on preventive screening, early intervention, and patient-centered care planning.</p>
                </div>
              </div>
            </div>
            <div class="col-lg-3 col-md-6">
              <div class="doctor-card">
                <div class="doctor-image"><img src="assets/img/health/staff-6.webp" alt="Dr. Marcus Johnson" class="img-fluid"></div>
                <div class="doctor-content">
                  <h4>Dr. Marcus Johnson</h4>
                  <span class="specialty">Neurology Expert</span>
                  <p>Experienced in complex neurological assessments and long-term care coordination.</p>
                </div>
              </div>
            </div>
            <div class="col-lg-3 col-md-6">
              <div class="doctor-card">
                <div class="doctor-image"><img src="assets/img/health/staff-4.webp" alt="Dr. Rachel Williams" class="img-fluid"></div>
                <div class="doctor-content">
                  <h4>Dr. Rachel Williams</h4>
                  <span class="specialty">Geriatric Care</span>
                  <p>Delivering family-centered support for older patients and their caregivers.</p>
                </div>
              </div>
            </div>
            <div class="col-lg-3 col-md-6">
              <div class="doctor-card">
                <div class="doctor-image"><img src="assets/img/health/staff-8.webp" alt="Dr. David Chen" class="img-fluid"></div>
                <div class="doctor-content">
                  <h4>Dr. David Chen</h4>
                  <span class="specialty">Memory Clinic Lead</span>
                  <p>Specialized in reviewing borderline results and coordinating further evaluation when needed.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  `
})
export class DoctorsPageComponent {}

@Component({
  standalone: true,
  selector: 'app-contact-page',
  template: `
    <main class="main">
      <section class="section">
        <div class="container section-title" data-aos="fade-up">
          <h2>Contact</h2>
          <p>Questions about the platform, a patient's account, or a partnership? Reach out.</p>
        </div>
        <div class="container" data-aos="fade-up" data-aos-delay="100">
          <div class="row g-5">
            <div class="col-lg-5">
              <div class="p-4 bg-white rounded-4 shadow-sm h-100">
                <h4>Get In Touch</h4>
                <p>Reach our team for account support, care-team enquiries, or partnership questions.</p>
                <div class="mt-4">
                  <p><i class="bi bi-geo-alt text-primary me-2"></i> 123 Wellness Avenue, Care District, NY 10012</p>
                  <p><i class="bi bi-telephone text-primary me-2"></i> +1 (555) 987-6543</p>
                  <p><i class="bi bi-envelope text-primary me-2"></i> contact@neuroassist.example</p>
                </div>
              </div>
            </div>
            <div class="col-lg-7">
              <div class="p-4 bg-white rounded-4 shadow-sm">
                <div class="row g-3">
                  <div class="col-md-6"><input class="form-control" placeholder="Your name"></div>
                  <div class="col-md-6"><input class="form-control" placeholder="Email address"></div>
                  <div class="col-12"><input class="form-control" placeholder="Subject"></div>
                  <div class="col-12"><textarea class="form-control" rows="6" placeholder="How can we help?"></textarea></div>
                  <div class="col-12"><button class="btn btn-primary">Send Message</button></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  `
})
export class ContactPageComponent {}

@Component({
  standalone: true,
  selector: 'app-sign-in-page',
  imports: [RouterLink, FormsModule, CommonModule],
  encapsulation: ViewEncapsulation.None,
  styles: [`
    .auth-page {
      min-height: 100vh;
      background: var(--surface-alt, #f8fafc);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      font-family: var(--default-font, "Inter", "Roboto", sans-serif);
    }
    .auth-panel {
      background: var(--surface-color, #ffffff);
      border-radius: 20px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
      overflow: hidden;
      display: flex;
      max-width: 1100px;
      width: 100%;
      min-height: 600px;
    }
    .auth-brand {
      flex: 1;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      color: #ffffff;
      padding: 4rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .auth-brand h2 {
      font-size: 2.2rem;
      font-weight: 800;
      margin-bottom: 1rem;
      letter-spacing: -0.5px;
      background: linear-gradient(to right, #60a5fa, #a78bfa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .auth-brand p {
      font-size: 1.1rem;
      line-height: 1.6;
      color: #94a3b8;
    }
    .auth-brand-features {
      margin-top: 3rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .auth-brand-features .feature-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: 1rem;
      font-weight: 500;
      color: #e2e8f0;
    }
    .auth-brand-features .feature-icon {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      color: #60a5fa;
    }
    .auth-form-container {
      flex: 1;
      padding: 4rem;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .auth-form-container h3 {
      font-size: 1.8rem;
      font-weight: 700;
      color: var(--heading-color, #1e293b);
      margin-bottom: 0.5rem;
      letter-spacing: -0.5px;
    }
    .auth-form-container .subtitle {
      color: var(--text-muted, #64748b);
      margin-bottom: 2.5rem;
      font-size: 0.95rem;
    }
    .form-group {
      margin-bottom: 1.5rem;
    }
    .form-group label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-secondary, #475569);
      margin-bottom: 0.5rem;
    }
    .form-control {
      width: 100%;
      min-height: 52px;
      border-radius: 12px;
      border: 1px solid var(--border-color, #e2e8f0);
      background: var(--surface-alt, #f8fafc);
      padding: 0 1rem;
      font-size: 0.95rem;
      color: var(--heading-color, #1e293b);
      transition: all 0.2s ease;
    }
    .form-control:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
      background: #ffffff;
    }
    .alert-error {
      background: #fef2f2;
      color: #ef4444;
      border: 1px solid #fecaca;
      border-radius: 10px;
      padding: 0.85rem 1rem;
      font-size: 0.85rem;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .auth-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      font-size: 0.85rem;
    }
    .auth-actions a {
      color: #3b82f6;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.2s;
    }
    .auth-actions a:hover {
      color: #2563eb;
    }
    .btn-submit {
      width: 100%;
      min-height: 52px;
      border-radius: 12px;
      background: #3b82f6;
      color: #ffffff;
      font-weight: 600;
      font-size: 1rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
    }
    .btn-submit:hover:not(:disabled) {
      background: #2563eb;
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
    }
    .btn-submit:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    .signup-prompt {
      text-align: center;
      margin-top: 1.5rem;
      font-size: 0.88rem;
      color: var(--text-muted, #64748b);
    }
    .signup-prompt a {
      color: #3b82f6;
      font-weight: 600;
      text-decoration: none;
    }
    .signup-prompt a:hover {
      color: #2563eb;
      text-decoration: underline;
    }
    .back-to-home {
      display: block;
      text-align: center;
      margin-top: 2rem;
      font-size: 0.85rem;
      color: var(--text-muted, #64748b);
      text-decoration: none;
      font-weight: 500;
    }
    .back-to-home:hover {
      color: #3b82f6;
    }
    @media (max-width: 992px) {
      .auth-brand {
        display: none;
      }
      .auth-form-container {
        padding: 3rem;
      }
    }
  `],
  template: `
   <section class="auth-page">
    <div class="auth-panel">
      <div class="auth-brand">
        <div>
          <h2>NeuroAssist</h2>
          <p>
            Welcome to the secure administrative and clinical platform for early Alzheimer's detection and ongoing cognitive tracking.
          </p>
        </div>
        
        <div class="auth-brand-features">
          <div class="feature-item">
            <div class="feature-icon"><i class="bi bi-shield-lock"></i></div>
            <span>Secure Medical Environment</span>
          </div>
          <div class="feature-item">
            <div class="feature-icon"><i class="bi bi-graph-up-arrow"></i></div>
            <span>Real-time Patient Monitoring</span>
          </div>
          <div class="feature-item">
            <div class="feature-icon"><i class="bi bi-people"></i></div>
            <span>Seamless Doctor-Patient Coordination</span>
          </div>
        </div>
      </div>

      <div class="auth-form-container">
        <h3>Sign In</h3>
        <p class="subtitle">
          Enter your credentials to access your secure portal.
        </p>

        @if (errorMessage()) {
          <div class="alert-error">
            <i class="bi bi-exclamation-triangle-fill"></i>
            {{ errorMessage() }}
          </div>
        }

        <div class="form-group">
          <label>Email Address</label>
          <input
            class="form-control"
            type="email"
            placeholder="name@example.com"
            [value]="email()"
            (input)="email.set($any($event.target).value)"
            (keyup.enter)="login()"
          />
        </div>

        <div class="form-group">
          <label>Password</label>
          <input
            class="form-control"
            type="password"
            placeholder="••••••••"
            [value]="password()"
            (input)="password.set($any($event.target).value)"
            (keyup.enter)="login()"
          />
        </div>

        <div class="auth-actions">
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="remember">
            <label class="form-check-label" for="remember">
              Remember me
            </label>
          </div>
          <a href="#">Forgot password?</a>
        </div>

        <button
          class="btn-submit"
          (click)="login()"
          [disabled]="loading()">
          {{ loading() ? 'Signing In...' : 'Sign In' }}
        </button>

        <p class="signup-prompt">
          Don't have an account? <a routerLink="/register">Create one</a>
        </p>

        <a routerLink="/" class="back-to-home">
          ← Back to homepage
        </a>
      </div>
    </div>
  </section>
  `
})
export class SignInPageComponent {

  email    = signal('');
  password = signal('');
  loading  = signal(false);
  errorMessage = signal('');

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  login(): void {
    if (!this.email() || !this.password()) {
      this.errorMessage.set('Please fill in all fields');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.login({
      email: this.email(),
      password: this.password()
    }).subscribe({
      next: (response) => {
        this.loading.set(false);
        if (response.role === 'ADMIN') {
          this.router.navigate(['/admin']);
        } else if (response.role === 'MEDECIN') {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/home']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 0) {
          this.errorMessage.set('Server is unreachable');
        } else {
          this.errorMessage.set(err.error?.message || 'Invalid email or password');
        }
      }
    });
  }
}

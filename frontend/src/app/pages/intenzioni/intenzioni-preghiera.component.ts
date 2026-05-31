import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IntenzioniPreghieraService } from '../../core/services/intenzioni-preghiera.service';

@Component({
  selector: 'app-intenzioni-preghiera',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="hero-sm">
      <div class="container">
        <h1>Intenzioni di preghiera</h1>
        <p>Lascia qui la tua preghiera: sabato e/o domenica verrà offerta durante la S. Messa.</p>
      </div>
    </section>

    <div class="container page-content">
      <div class="intenzioni-layout">
        <aside class="versetto">
          <blockquote>
            «Non angustiatevi per nulla, ma in ogni necessità esponete a Dio le vostre
            richieste, con preghiere, suppliche e ringraziamenti; e la pace di Dio, che
            sorpassa ogni intelligenza, custodirà i vostri cuori e i vostri pensieri in
            Cristo Gesù.»
            <cite>Fil 4,6-7</cite>
          </blockquote>
        </aside>

        <div class="form-box">
          @if (inviata()) {
            <div class="grazie">
              <h2>Grazie 🙏</h2>
              <p>La tua intenzione è stata ricevuta e sarà affidata alla preghiera della comunità.</p>
              <button class="btn btn-outline" (click)="nuova()">Scrivi un'altra intenzione</button>
            </div>
          } @else {
            @if (error()) {
              <div class="alert alert-error">{{ error() }}</div>
            }
            <form (ngSubmit)="invia()" #f="ngForm">
              <div class="form-group">
                <label for="testo">La tua intenzione *</label>
                <textarea
                  id="testo"
                  name="testo"
                  rows="6"
                  [(ngModel)]="testo"
                  required
                  maxlength="2000"
                  placeholder="Scrivi qui la tua preghiera…"
                ></textarea>
              </div>
              <div class="form-group">
                <label for="nome">Nome (facoltativo)</label>
                <input
                  id="nome"
                  type="text"
                  name="nome"
                  [(ngModel)]="nome"
                  maxlength="120"
                  placeholder="Come vuoi essere ricordato/a"
                />
              </div>
              <button type="submit" class="btn btn-primary" [disabled]="loading() || !f.valid">
                {{ loading() ? 'Invio in corso…' : 'Invia la preghiera' }}
              </button>
            </form>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hero-sm {
      background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
      color: white;
      padding: 2.5rem 0;
      text-align: center;
    }
    .hero-sm h1 { color: white; margin-bottom: .4rem; }
    .hero-sm p { opacity: .85; margin: 0; max-width: 640px; margin-inline: auto; }
    .intenzioni-layout {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 2rem;
      align-items: start;
    }
    @media (max-width: 720px) {
      .intenzioni-layout { grid-template-columns: 1fr; }
    }
    .versetto blockquote {
      margin: 0;
      padding: 1.5rem;
      background: var(--color-bg-alt);
      border-left: 4px solid var(--color-secondary);
      border-radius: var(--radius);
      font-style: italic;
      color: var(--color-text);
    }
    .versetto cite {
      display: block;
      margin-top: 1rem;
      font-style: normal;
      font-weight: 600;
      color: var(--color-primary);
    }
    .form-box {
      background: white;
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      padding: 1.75rem;
    }
    .grazie { text-align: center; padding: 1rem 0; }
    .grazie h2 { margin-bottom: .5rem; }
    .grazie .btn { margin-top: 1rem; }
  `],
})
export class IntenzioniPreghieraComponent {
  private service = inject(IntenzioniPreghieraService);

  testo = '';
  nome = '';
  readonly loading = signal(false);
  readonly error = signal('');
  readonly inviata = signal(false);

  invia(): void {
    const testo = this.testo.trim();
    if (!testo) return;
    this.loading.set(true);
    this.error.set('');
    this.service.create({ testo, nome: this.nome.trim() || undefined }).subscribe({
      next: () => {
        this.loading.set(false);
        this.inviata.set(true);
      },
      error: () => {
        this.loading.set(false);
        this.error.set("Si è verificato un errore nell'invio. Riprova più tardi.");
      },
    });
  }

  nuova(): void {
    this.testo = '';
    this.nome = '';
    this.inviata.set(false);
    this.error.set('');
  }
}

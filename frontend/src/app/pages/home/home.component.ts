import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { NewsService } from '../../core/services/news.service';
import { EventiService } from '../../core/services/eventi.service';
import { EventCardComponent } from '../../shared/event-card/event-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, DatePipe, EventCardComponent],
  template: `
    <section class="hero">
      <div class="container">
        <h1>Parrocchia di Sant'Eligio</h1>
        <p class="tagline">Una comunità in cammino</p>
        <div class="hero-links">
          <a routerLink="/orari-messe" class="btn btn-primary">Orari delle Messe</a>
          <a routerLink="/eventi" class="btn btn-outline">Prossimi Eventi</a>
        </div>
      </div>
    </section>

    <div class="container page-content">
      <section class="section">
        <h2>Ultime Notizie</h2>
        @if (news().length > 0) {
          <div class="card-grid">
            @for (item of news().slice(0, 3); track item._id) {
              <article class="card">
                @if (item.immagine) {
                  <img [src]="item.immagine" [alt]="item.titolo" class="card-img">
                }
                <h3><a [routerLink]="['/notizie', item._id]">{{ item.titolo }}</a></h3>
                <time>{{ item.createdAt | date:'d MMMM yyyy':'':'it' }}</time>
                @if (item.categoria) {
                  <span class="badge">{{ item.categoria }}</span>
                }
              </article>
            }
          </div>
          <a routerLink="/notizie" class="link-more">Tutte le notizie &rarr;</a>
        } @else {
          <p class="empty">Nessuna notizia disponibile.</p>
        }
      </section>

      <section class="section">
        <h2>Prossimi Eventi</h2>
        @if (eventi().length > 0) {
          <div class="event-list">
            @for (evento of eventi(); track evento._id) {
              <app-event-card [evento]="evento" [showDescription]="false" />
            }
          </div>
          <a routerLink="/eventi" class="link-more">Tutti gli eventi &rarr;</a>
        } @else {
          <p class="empty">Nessun evento in programma.</p>
        }
      </section>
    </div>
  `,
  styles: [`
    .hero {
      position: relative;
      background:
        linear-gradient(135deg,
          color-mix(in srgb, var(--color-primary) 82%, transparent) 0%,
          color-mix(in srgb, var(--color-primary-dark) 88%, transparent) 100%),
        url('/assets/SantEligioFronte.webp') center / cover no-repeat;
      color: white;
      padding: 6rem 0 5rem;
      text-align: center;
    }
    .hero .container { position: relative; z-index: 1; }
    .hero h1 {
      color: white;
      font-size: 2.6rem;
      margin-bottom: .5rem;
      text-shadow: 0 2px 8px rgba(0,0,0,.35);
    }
    .tagline {
      font-size: 1.15rem;
      opacity: .95;
      margin-bottom: 2rem;
      text-shadow: 0 1px 6px rgba(0,0,0,.3);
    }
    .hero-links { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
    .hero .btn-outline { border-color: rgba(255,255,255,.7); color: white; &:hover { background: rgba(255,255,255,.1); } }
    .card-img { width: 100%; height: 160px; object-fit: cover; border-radius: 4px; margin-bottom: .75rem; }
    .event-list { display: grid; gap: 1rem; margin: 1rem 0; }
  `],
})
export class HomeComponent {
  private newsService = inject(NewsService);
  private eventiService = inject(EventiService);

  readonly news = toSignal(this.newsService.getAll(), { initialValue: [] });
  readonly eventi = toSignal(this.eventiService.getProssimi(3), { initialValue: [] });
}

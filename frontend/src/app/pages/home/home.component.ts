import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { NewsService } from '../../core/services/news.service';
import { EventiService } from '../../core/services/eventi.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, DatePipe],
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
          <ul class="event-list">
            @for (evento of eventi(); track evento._id) {
              <li class="event-item">
                <span class="event-date">{{ evento.dataInizio | date:'d MMM':'':'it' }}</span>
                <div class="event-info">
                  <strong>{{ evento.titolo }}</strong>
                  @if (evento.luogo) {
                    <span class="event-luogo">{{ evento.luogo }}</span>
                  }
                </div>
              </li>
            }
          </ul>
          <a routerLink="/eventi" class="link-more">Tutti gli eventi &rarr;</a>
        } @else {
          <p class="empty">Nessun evento in programma.</p>
        }
      </section>
    </div>
  `,
  styles: [`
    .hero {
      background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
      color: white;
      padding: 4rem 0 3rem;
      text-align: center;
    }
    .hero h1 { color: white; font-size: 2.4rem; margin-bottom: .5rem; }
    .tagline { font-size: 1.15rem; opacity: .85; margin-bottom: 2rem; }
    .hero-links { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
    .hero .btn-outline { border-color: rgba(255,255,255,.7); color: white; &:hover { background: rgba(255,255,255,.1); } }
    .card-img { width: 100%; height: 160px; object-fit: cover; border-radius: 4px; margin-bottom: .75rem; }
    .event-list { list-style: none; padding: 0; margin: 1rem 0; }
    .event-item {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding: .85rem 0;
      border-bottom: 1px solid var(--color-border);
      &:last-child { border-bottom: none; }
    }
    .event-date {
      min-width: 52px;
      text-align: center;
      background: var(--color-bg-alt);
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      padding: .3rem .5rem;
      font-size: .85rem;
      font-weight: 700;
      color: var(--color-primary);
    }
    .event-info { display: flex; flex-direction: column; gap: .15rem; }
    .event-luogo { font-size: .85rem; color: var(--color-text-muted); }
  `],
})
export class HomeComponent {
  private newsService = inject(NewsService);
  private eventiService = inject(EventiService);

  readonly news = toSignal(this.newsService.getAll(), { initialValue: [] });
  readonly eventi = toSignal(this.eventiService.getProssimi(3), { initialValue: [] });
}

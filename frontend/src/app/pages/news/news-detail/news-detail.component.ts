import { Component, inject } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import { NewsService } from '../../../core/services/news.service';

@Component({
  selector: 'app-news-detail',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <div class="container page-content">
      <a routerLink="/notizie" class="back">&larr; Tutte le notizie</a>

      @if (news()) {
        <article class="article">
          @if (news()!.immagine) {
            <img [src]="news()!.immagine" [alt]="news()!.titolo" class="article-img">
          }
          <div class="article-meta">
            <time>{{ news()!.createdAt | date:'d MMMM yyyy':'':'it' }}</time>
            @if (news()!.categoria) {
              <span class="badge">{{ news()!.categoria }}</span>
            }
          </div>
          <h1>{{ news()!.titolo }}</h1>
          <div class="article-body" [innerHTML]="news()!.testo"></div>
        </article>
      } @else {
        <p class="empty">Notizia non trovata.</p>
      }
    </div>
  `,
  styles: [`
    .back { display: inline-block; margin-bottom: 1.5rem; color: var(--color-text-muted); font-size: .9rem; }
    .article-img { width: 100%; max-height: 400px; object-fit: cover; border-radius: var(--radius); margin-bottom: 1.5rem; }
    .article-meta { display: flex; align-items: center; gap: .75rem; margin-bottom: .75rem; }
    time { font-size: .85rem; color: var(--color-text-muted); }
    .article-body { line-height: 1.8; margin-top: 1.5rem; }
  `],
})
export class NewsDetailComponent {
  private newsService = inject(NewsService);
  private route = inject(ActivatedRoute);

  readonly news = toSignal(
    this.route.paramMap.pipe(
      switchMap(params => this.newsService.getOne(params.get('id')!)),
    ),
  );
}

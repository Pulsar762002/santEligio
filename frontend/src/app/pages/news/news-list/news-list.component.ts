import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { toObservable } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import { NewsService } from '../../../core/services/news.service';
import { CategoriaNews } from '../../../core/models/news.model';

const CATEGORIE: CategoriaNews[] = ['liturgia', 'catechismo', 'caritas', 'eventi', 'comunicati'];

@Component({
  selector: 'app-news-list',
  standalone: true,
  imports: [RouterLink, DatePipe, TitleCasePipe, FormsModule],
  template: `
    <div class="container page-content">
      <h1>Notizie</h1>

      <div class="filters">
        <label for="cat">Filtra per categoria:</label>
        <select id="cat" [(ngModel)]="categoria" (ngModelChange)="onCategoria($event)">
          <option value="">Tutte</option>
          @for (c of categorie; track c) {
            <option [value]="c">{{ c | titlecase }}</option>
          }
        </select>
      </div>

      @if (news() && news()!.length > 0) {
        <div class="card-grid">
          @for (item of news()!; track item._id) {
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
      } @else {
        <p class="empty">Nessuna notizia trovata.</p>
      }
    </div>
  `,
  styles: [`
    .filters {
      display: flex;
      align-items: center;
      gap: .75rem;
      margin-bottom: 1.5rem;
      label { font-weight: 600; font-size: .9rem; }
      select { padding: .4rem .7rem; border: 1px solid var(--color-border); border-radius: var(--radius); font-size: .9rem; }
    }
    .card-img { width: 100%; height: 160px; object-fit: cover; border-radius: 4px; margin-bottom: .75rem; }
  `],
})
export class NewsListComponent {
  private newsService = inject(NewsService);

  readonly categorie = CATEGORIE;
  categoria = '';

  private readonly _categoria = signal<CategoriaNews | undefined>(undefined);

  readonly news = toSignal(
    toObservable(this._categoria).pipe(
      switchMap(cat => this.newsService.getAll(cat)),
    ),
  );

  onCategoria(value: string): void {
    this._categoria.set(value ? (value as CategoriaNews) : undefined);
  }
}

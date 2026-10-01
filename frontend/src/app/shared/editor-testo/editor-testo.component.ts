import {
  Component, ElementRef, Input, OnDestroy, ViewChild, AfterViewInit, forwardRef, inject, signal, NgZone,
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Avviso, ElencoConClasse, daTestoSemplice } from './editor-estensioni';
import { UploadsService } from '../../core/services/uploads.service';
import { MediaService } from '../../core/services/media.service';
import { Media } from '../../core/models/media.model';
import { assetUrl, assetUrlCompleto } from '../../core/utils/asset-url';

/**
 * Editor visuale "tipo Word" per i contenuti del sito (pagine, notizie, eventi).
 * Si usa come un input: <app-editor-testo name="contenuto" [(ngModel)]="..." />.
 * Salva HTML semplice (p, h3, strong, em, ul/ol, a, img, div.avviso) come prima.
 */
@Component({
  selector: 'app-editor-testo',
  standalone: true,
  imports: [FormsModule],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => EditorTestoComponent), multi: true }],
  template: `
    <div class="editor" [class.disabilitato]="disabilitato">
      <!-- mousedown annullato: i pulsanti non tolgono il cursore dal testo -->
      <div class="barra" role="toolbar" aria-label="Formattazione del testo" (mousedown)="$event.preventDefault()">
        <button type="button" title="Annulla (Ctrl+Z)" (click)="cmd('undo')" [disabled]="modoHtml()">↶</button>
        <button type="button" title="Ripeti (Ctrl+Y)" (click)="cmd('redo')" [disabled]="modoHtml()">↷</button>
        <span class="sep"></span>
        <button type="button" title="Titolo di sezione" [class.on]="attivo('heading')" (click)="cmd('titolo')" [disabled]="modoHtml()">Titolo</button>
        <button type="button" title="Grassetto (Ctrl+B)" [class.on]="attivo('bold')" (click)="cmd('bold')" [disabled]="modoHtml()"><b>G</b></button>
        <button type="button" title="Corsivo (Ctrl+I)" [class.on]="attivo('italic')" (click)="cmd('italic')" [disabled]="modoHtml()"><i>C</i></button>
        <span class="sep"></span>
        <button type="button" title="Elenco puntato" [class.on]="attivo('bulletList')" (click)="cmd('bullet')" [disabled]="modoHtml()">• Elenco</button>
        <button type="button" title="Elenco numerato" [class.on]="attivo('orderedList')" (click)="cmd('ordered')" [disabled]="modoHtml()">1. Elenco</button>
        <span class="sep"></span>
        <button type="button" title="Collegamento (seleziona prima il testo)" [class.on]="attivo('link')" (click)="link()" [disabled]="modoHtml()">🔗 Link</button>
        @if (immagini) {
          <button type="button" title="Inserisci un'immagine" (click)="apriImmagini()" [disabled]="modoHtml()">🖼 Immagine</button>
        }
        <button type="button" title="Riquadro evidenziato (es. avvisi, orari)" [class.on]="attivo('avviso')" (click)="cmd('avviso')" [disabled]="modoHtml()">⚠ Riquadro</button>
        @if (html) {
          <span class="spazio"></span>
          <button type="button" title="Modifica il codice HTML (solo admin)" [class.on]="modoHtml()" (click)="toggleHtml()">&lt;/&gt; HTML</button>
        }
      </div>

      @if (pannelloImmagini()) {
        <div class="immagini">
          <div class="immagini-testa">
            <label class="btn-carica">
              {{ caricamento() ? 'Caricamento…' : 'Carica dal computer' }}
              <input type="file" accept="image/*" (change)="carica($event)" [disabled]="caricamento()" hidden />
            </label>
            <span class="muted">oppure scegli dalla libreria:</span>
            <button type="button" class="chiudi" (click)="pannelloImmagini.set(false)">Chiudi ✕</button>
          </div>
          @if (errore()) { <p class="errore">{{ errore() }}</p> }
          <div class="griglia">
            @for (m of libreria(); track m._id) {
              <button type="button" class="miniatura" (click)="inserisciImmagine(m.url)" [title]="m.originalName">
                <img [src]="src(m.url)" [alt]="m.originalName" loading="lazy" />
              </button>
            } @empty {
              <p class="muted">Nessuna immagine nella libreria.</p>
            }
          </div>
        </div>
      }

      <div #area class="area prosa" [hidden]="modoHtml()"></div>
      @if (modoHtml()) {
        <textarea class="codice" [ngModel]="valore" (ngModelChange)="daHtml($event)" rows="14"></textarea>
      }
      <p class="aiuto">Invio = nuovo paragrafo · Maiusc+Invio = a capo nella stessa riga · puoi incollare da Word o da un'email.</p>
    </div>
  `,
  styles: [`
    .editor { border: 1px solid var(--color-border); border-radius: var(--radius); background: white; }
    .editor:focus-within { border-color: var(--color-secondary); box-shadow: 0 0 0 1px var(--color-secondary); }
    .barra { display: flex; flex-wrap: wrap; gap: .25rem; align-items: center; padding: .4rem;
             border-bottom: 1px solid var(--color-border); background: var(--color-bg-alt);
             border-radius: var(--radius) var(--radius) 0 0; position: sticky; top: 0; z-index: 2; }
    .barra button { font: inherit; font-size: .85rem; background: white; border: 1px solid var(--color-border);
                    border-radius: 4px; padding: .25rem .55rem; cursor: pointer; color: var(--color-text); min-width: 2rem; }
    .barra button:hover:not([disabled]) { border-color: var(--color-primary); }
    .barra button.on { background: var(--color-primary); border-color: var(--color-primary); color: white; }
    .barra button[disabled] { opacity: .4; cursor: default; }
    .sep { width: 1px; align-self: stretch; background: var(--color-border); margin: 0 .2rem; }
    .spazio { flex: 1; }
    .area { min-height: 220px; padding: .9rem 1rem; cursor: text; }
    .area ::ng-deep .ProseMirror { outline: none; min-height: 200px; }
    .area ::ng-deep .ProseMirror > *:first-child { margin-top: 0; }
    .area ::ng-deep img { max-width: 100%; height: auto; border-radius: var(--radius); }
    .area ::ng-deep img.ProseMirror-selectednode { outline: 3px solid var(--color-secondary); }
    .area ::ng-deep a { color: var(--color-primary); text-decoration: underline; }
    /* stessi stili della pagina pubblica (pagina.component) */
    .area ::ng-deep h3 { margin: 1.25rem 0 .5rem; font-size: 1.2rem; color: var(--color-primary); }
    .area ::ng-deep p { margin: 0 0 .8rem; }
    .area ::ng-deep ul, .area ::ng-deep ol { padding-left: 1.25rem; margin: 0 0 .8rem; }
    .area ::ng-deep li p { margin: 0; }
    .area ::ng-deep strong { color: var(--color-primary-dark); }
    .area ::ng-deep .avviso { background: #fdecea; border: 1px solid #f5c6c2; border-radius: 14px; padding: .9rem 1.2rem; margin: 1rem 0; }
    .area ::ng-deep .avviso strong { color: #c0392b; }
    .codice { width: 100%; border: none; border-radius: 0; font-family: ui-monospace, monospace; font-size: .85rem;
              padding: .9rem 1rem; min-height: 220px; resize: vertical; }
    .aiuto { margin: 0; padding: .35rem .75rem; font-size: .75rem; color: var(--color-text-muted); border-top: 1px dashed var(--color-border); }
    .immagini { padding: .75rem; border-bottom: 1px solid var(--color-border); background: var(--color-bg); }
    .immagini-testa { display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; margin-bottom: .6rem; }
    .btn-carica { background: var(--color-primary); color: white; padding: .3rem .8rem; border-radius: var(--radius); cursor: pointer; font-size: .85rem; }
    .chiudi { margin-left: auto; background: none; border: none; cursor: pointer; color: var(--color-text-muted); }
    .griglia { display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: .5rem; max-height: 230px; overflow-y: auto; }
    .miniatura { padding: 0; border: 2px solid transparent; border-radius: 4px; cursor: pointer; background: white; aspect-ratio: 1; overflow: hidden; }
    .miniatura:hover { border-color: var(--color-primary); }
    .miniatura img { width: 100%; height: 100%; object-fit: cover; }
    .muted { color: var(--color-text-muted); font-size: .85rem; }
    .errore { color: #b91c1c; font-size: .85rem; margin: 0 0 .5rem; }
    .disabilitato { opacity: .6; pointer-events: none; }
  `],
})
export class EditorTestoComponent implements ControlValueAccessor, AfterViewInit, OnDestroy {
  private uploads = inject(UploadsService);
  private media = inject(MediaService);
  private zone = inject(NgZone);

  /** Mostra il pulsante HTML (solo per l'admin). */
  @Input() html = false;
  /** Mostra il pulsante Immagine. */
  @Input() immagini = true;

  @ViewChild('area', { static: true }) area!: ElementRef<HTMLDivElement>;

  private editor?: Editor;
  valore = '';
  disabilitato = false;
  readonly modoHtml = signal(false);
  readonly pannelloImmagini = signal(false);
  readonly libreria = signal<Media[]>([]);
  readonly caricamento = signal(false);
  readonly errore = signal('');
  /** Forza l'aggiornamento dello stato dei pulsanti dopo ogni transazione. */
  private readonly tick = signal(0);
  src = assetUrl;

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.editor = new Editor({
        element: this.area.nativeElement,
        extensions: [
          StarterKit.configure({
            heading: { levels: [3] },
            bulletList: false,
            code: false,
            codeBlock: false,
            blockquote: false,
            horizontalRule: false,
            strike: false,
          }),
          ElencoConClasse,
          Avviso,
          Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener', target: '_blank' } }),
          Image,
        ],
        content: daTestoSemplice(this.valore),
        onUpdate: ({ editor }) => this.zone.run(() => {
          this.valore = editor.isEmpty ? '' : editor.getHTML();
          this.onChange(this.valore);
        }),
        onBlur: () => this.zone.run(() => this.onTouched()),
        onTransaction: () => this.zone.run(() => this.tick.update((n) => n + 1)),
      });
    });
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
  }

  // ── ControlValueAccessor ──
  writeValue(v: string | null): void {
    this.valore = v ?? '';
    if (this.editor && this.valore !== this.editor.getHTML()) {
      this.editor.commands.setContent(daTestoSemplice(this.valore), false);
    }
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(d: boolean): void {
    this.disabilitato = d;
    this.editor?.setEditable(!d);
  }

  // ── Comandi ──
  attivo(nome: string): boolean {
    this.tick();
    return !!this.editor?.isActive(nome);
  }

  cmd(c: string): void {
    const ch = this.editor?.chain().focus();
    if (!ch) return;
    switch (c) {
      case 'undo': ch.undo().run(); break;
      case 'redo': ch.redo().run(); break;
      case 'titolo': ch.toggleHeading({ level: 3 }).run(); break;
      case 'bold': ch.toggleBold().run(); break;
      case 'italic': ch.toggleItalic().run(); break;
      case 'bullet': ch.toggleBulletList().run(); break;
      case 'ordered': ch.toggleOrderedList().run(); break;
      case 'avviso':
        if (this.editor!.isActive('avviso')) ch.lift('avviso').run();
        else ch.wrapIn('avviso').run();
        break;
    }
  }

  link(): void {
    if (!this.editor) return;
    const attuale = this.editor.getAttributes('link')['href'] ?? '';
    const url = prompt('Indirizzo del collegamento (lascia vuoto per toglierlo):', attuale);
    if (url === null) return;
    const ch = this.editor.chain().focus().extendMarkRange('link');
    if (!url.trim()) {
      ch.unsetLink().run();
      return;
    }
    const href = /^(https?:|mailto:|tel:|\/)/i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
    if (this.editor.state.selection.empty && !attuale) {
      // nessun testo selezionato: inserisce l'indirizzo come testo del link
      this.editor.chain().focus()
        .insertContent([{ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] }, { type: 'text', text: ' ' }])
        .run();
    } else {
      ch.setLink({ href }).run();
    }
  }

  apriImmagini(): void {
    this.errore.set('');
    this.pannelloImmagini.set(!this.pannelloImmagini());
    if (this.pannelloImmagini()) {
      this.media.getAll().subscribe({
        next: (l) => this.libreria.set(l.filter((m) => (m.mimetype ?? '').startsWith('image/'))),
        error: () => this.libreria.set([]),
      });
    }
  }

  carica(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.caricamento.set(true);
    this.errore.set('');
    this.uploads.upload(file).subscribe({
      next: ({ url }) => {
        this.caricamento.set(false);
        input.value = '';
        this.inserisciImmagine(url);
      },
      error: () => {
        this.caricamento.set(false);
        input.value = '';
        this.errore.set('Caricamento non riuscito (formato o dimensione non ammessi?).');
      },
    });
  }

  inserisciImmagine(url: string): void {
    // URL completo: funziona anche nell'app e se il testo viene copiato altrove
    this.editor?.chain().focus().setImage({ src: assetUrlCompleto(url) }).run();
    this.pannelloImmagini.set(false);
  }

  // ── Modalità HTML (admin) ──
  toggleHtml(): void {
    if (this.modoHtml()) {
      this.editor?.commands.setContent(daTestoSemplice(this.valore), false);
    }
    this.modoHtml.set(!this.modoHtml());
  }

  daHtml(v: string): void {
    this.valore = v;
    this.onChange(v);
  }
}

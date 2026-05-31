import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="footer">
      <div class="container">
        <p>Parrocchia di Sant'Eligio &mdash; Via Fosso dell'Osa, 435 &mdash; 00132 Roma (RM)</p>
        <p>Tel. 06 2261045 &mdash; <a href="mailto:info&#64;parrocchiasanteligio.it">info&#64;parrocchiasanteligio.it</a></p>
        <p class="copy">&copy; {{ year }} Parrocchia di Sant'Eligio &mdash; C.F. 80175070582</p>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background: var(--color-primary-dark);
      color: rgba(255,255,255,.75);
      padding: 1.5rem 0;
      margin-top: 3rem;
      font-size: .9rem;
      text-align: center;
    }
    .footer a { color: var(--color-secondary); }
    .copy { margin: 0.25rem 0 0; font-size: .8rem; opacity: .7; }
    p { margin: 0; }
  `],
})
export class FooterComponent {
  readonly year = new Date().getFullYear();
}

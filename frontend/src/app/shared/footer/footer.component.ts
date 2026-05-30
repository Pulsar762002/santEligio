import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="footer">
      <div class="container">
        <p>Parrocchia di Sant'Eligio &mdash; Via Sant'Eligio &mdash; <a href="mailto:parrocchia&#64;santeligio.it">parrocchia&#64;santeligio.it</a></p>
        <p class="copy">&copy; {{ year }} Parrocchia di Sant'Eligio</p>
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

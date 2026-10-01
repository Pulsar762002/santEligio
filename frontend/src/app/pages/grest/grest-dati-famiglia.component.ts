import { Component, Input } from '@angular/core';
import { ControlContainer, FormsModule, NgForm } from '@angular/forms';
import { GrestDatiFamiglia } from '../../core/models/grest.model';

export function datiFamigliaVuoti(): GrestDatiFamiglia {
  return {
    nomePadre: '', cognomePadre: '', emailPadre: '', mobilePhonePadre: '',
    nomeMadre: '', cognomeMadre: '', emailMadre: '', mobilePhoneMadre: '',
    nomeFiglio: '', cognomeFiglio: '', natoA: '', natoIl: '', residenteA: '', via: '',
  };
}

// Genitori + dati anagrafici del figlio: usato in registrazione e nel modulo d'iscrizione.
// I campi si registrano nell'NgForm del componente padre (viewProviders).
@Component({
  selector: 'app-grest-dati-famiglia',
  standalone: true,
  imports: [FormsModule],
  styleUrls: ['./grest.scss'],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }],
  template: `
    <p class="muted nota">Compilate i dati di almeno uno dei due genitori (nome, cognome, email e cellulare).</p>
    <div class="row-2">
      <fieldset>
        <legend>Padre</legend>
        <div class="form-group">
          <label for="nomePadre">Nome</label>
          <input id="nomePadre" name="nomePadre" [(ngModel)]="dati.nomePadre" maxlength="80" />
        </div>
        <div class="form-group">
          <label for="cognomePadre">Cognome</label>
          <input id="cognomePadre" name="cognomePadre" [(ngModel)]="dati.cognomePadre" maxlength="80" />
        </div>
        <div class="form-group">
          <label for="emailPadre">Email</label>
          <input id="emailPadre" name="emailPadre" type="email" email [(ngModel)]="dati.emailPadre" maxlength="120" />
        </div>
        <div class="form-group">
          <label for="mobilePhonePadre">Cellulare</label>
          <input id="mobilePhonePadre" name="mobilePhonePadre" inputmode="numeric" pattern="[0-9]*"
                 [(ngModel)]="dati.mobilePhonePadre" maxlength="20" #cp="ngModel" />
          @if (cp.invalid) { <span class="hint obbligatoria">Solo cifre, senza spazi.</span> }
        </div>
      </fieldset>
      <fieldset>
        <legend>Madre</legend>
        <div class="form-group">
          <label for="nomeMadre">Nome</label>
          <input id="nomeMadre" name="nomeMadre" [(ngModel)]="dati.nomeMadre" maxlength="80" />
        </div>
        <div class="form-group">
          <label for="cognomeMadre">Cognome</label>
          <input id="cognomeMadre" name="cognomeMadre" [(ngModel)]="dati.cognomeMadre" maxlength="80" />
        </div>
        <div class="form-group">
          <label for="emailMadre">Email</label>
          <input id="emailMadre" name="emailMadre" type="email" email [(ngModel)]="dati.emailMadre" maxlength="120" />
        </div>
        <div class="form-group">
          <label for="mobilePhoneMadre">Cellulare</label>
          <input id="mobilePhoneMadre" name="mobilePhoneMadre" inputmode="numeric" pattern="[0-9]*"
                 [(ngModel)]="dati.mobilePhoneMadre" maxlength="20" #cm="ngModel" />
          @if (cm.invalid) { <span class="hint obbligatoria">Solo cifre, senza spazi.</span> }
        </div>
      </fieldset>
    </div>

    <fieldset>
      <legend>Figlio/a</legend>
      <div class="row-2">
        <div class="form-group">
          <label for="nomeFiglio" class="req">Nome</label>
          <input id="nomeFiglio" name="nomeFiglio" [(ngModel)]="dati.nomeFiglio" required maxlength="80" />
        </div>
        <div class="form-group">
          <label for="cognomeFiglio" class="req">Cognome</label>
          <input id="cognomeFiglio" name="cognomeFiglio" [(ngModel)]="dati.cognomeFiglio" required maxlength="80" />
        </div>
        <div class="form-group">
          <label for="natoA" class="req">Nato/a a</label>
          <input id="natoA" name="natoA" [(ngModel)]="dati.natoA" required maxlength="80" />
        </div>
        <div class="form-group">
          <label for="natoIl" class="req">Nato/a il</label>
          <input id="natoIl" name="natoIl" [(ngModel)]="dati.natoIl" required placeholder="gg/mm/aaaa"
                 pattern="(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])/[0-9]{4}" #dn="ngModel" />
          @if (dn.errors?.['pattern']) { <span class="hint obbligatoria">Formato gg/mm/aaaa (es. 05/09/2016).</span> }
        </div>
        <div class="form-group">
          <label for="residenteA" class="req">Residente a</label>
          <input id="residenteA" name="residenteA" [(ngModel)]="dati.residenteA" required maxlength="80" />
        </div>
        <div class="form-group">
          <label for="via" class="req">In via</label>
          <input id="via" name="via" [(ngModel)]="dati.via" required maxlength="120" />
        </div>
      </div>
    </fieldset>
  `,
  styles: [`.nota { font-size: .9rem; margin-top: 0; }`],
})
export class GrestDatiFamigliaComponent {
  @Input({ required: true }) dati!: GrestDatiFamiglia;
}

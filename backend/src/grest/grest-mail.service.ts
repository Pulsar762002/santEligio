import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import { escapeXml as esc } from './grest-pdf.service';

export type MotivoLink = 'attivazione' | 'reimpostazione';

// Email del Grest via SMTP (Brevo nel vecchio portale). Le credenziali stanno in
// GREST_SMTP_* nel .env; se mancano le email non partono e lo si segnala nei log.
@Injectable()
export class GrestMailService {
  private readonly logger = new Logger(GrestMailService.name);
  private readonly transporter: Transporter | null;

  constructor(private readonly config: ConfigService) {
    const host = config.get<string>('GREST_SMTP_HOST');
    this.transporter = host
      ? createTransport({
          host,
          port: Number(config.get('GREST_SMTP_PORT', 587)),
          secure: Number(config.get('GREST_SMTP_PORT', 587)) === 465,
          auth: {
            user: config.get<string>('GREST_SMTP_USER'),
            pass: config.get<string>('GREST_SMTP_PASS'),
          },
        })
      : null;
    if (!this.transporter) this.logger.warn('GREST_SMTP_HOST non impostato: email Grest disattivate');
  }

  linkAttivazione(token: string): string {
    const base = this.config.get<string>('GREST_PUBLIC_URL', 'https://parrocchiasanteligio.it');
    return `${base.replace(/\/$/, '')}/grest/attivazione?token=${encodeURIComponent(token)}`;
  }

  /** Invia il link per scegliere la password. Ritorna false se l'invio non è riuscito. */
  async inviaLink(
    destinatari: string[],
    figlio: { nomeFiglio: string; cognomeFiglio: string; username: string },
    token: string,
    motivo: MotivoLink,
  ): Promise<boolean> {
    if (!this.transporter || destinatari.length === 0) return false;
    const anno = this.config.get<string>('GREST_ANNO', '2026');
    const link = this.linkAttivazione(token);
    const bambino = `${esc(figlio.nomeFiglio)} ${esc(figlio.cognomeFiglio)}`;
    const intro =
      motivo === 'attivazione'
        ? `<p>Grazie per aver registrato <strong>${bambino}</strong> al Grest ${esc(anno)}.</p>
           <p><strong>Attivate il vostro account scegliendo una password:</strong></p>`
        : `<p>È stata richiesta la reimpostazione della password dell'account Grest di
           <strong>${bambino}</strong>.</p><p><strong>Scegliete una nuova password:</strong></p>`;
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#eef4f4;font-family:'Segoe UI',Arial,sans-serif;color:#1f2b2c">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px 12px">
    <table role="presentation" width="600" cellspacing="0" cellpadding="0"
           style="max-width:600px;background:#fff;border-radius:6px;border-top:4px solid #3B6EA5;padding:24px">
      <tr><td>
        <h2 style="color:#2D5884;margin-top:0">Grest ${esc(anno)} – Parrocchia di Sant'Eligio</h2>
        <p>Cari genitori,</p>
        ${intro}
        <p>Il vostro nome utente è: <strong>${esc(figlio.username)}</strong></p>
        <p style="text-align:center;margin:28px 0">
          <a href="${esc(link)}" style="background:#3B6EA5;color:#fff;padding:12px 24px;border-radius:6px;
             text-decoration:none;font-weight:bold;display:inline-block">Scegli la password</a>
        </p>
        <p style="font-size:14px;color:#5f6f70">Oppure copiate questo link nel browser:<br>
          <a href="${esc(link)}" style="color:#3B6EA5;word-break:break-all">${esc(link)}</a></p>
        <p style="font-size:13px;color:#5f6f70;margin-top:24px">Se non avete fatto voi questa richiesta
          ignorate questa email. Per domande contattate la parrocchia.<br>Parrocchia di Sant'Eligio</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
    try {
      await this.transporter.sendMail({
        from: this.config.get<string>(
          'GREST_MAIL_FROM',
          `"Parrocchia Sant'Eligio" <noreply@parrocchiasanteligio.it>`,
        ),
        to: destinatari.join(', '),
        subject:
          motivo === 'attivazione'
            ? `Conferma registrazione Grest ${anno}`
            : `Reimpostazione password Grest ${anno}`,
        html,
      });
      return true;
    } catch (err) {
      this.logger.error(`Invio email Grest fallito: ${(err as Error).message}`);
      return false;
    }
  }
}

import { Node, mergeAttributes } from '@tiptap/core';
import BulletList from '@tiptap/extension-bullet-list';

// Estensioni TipTap per l'HTML già usato nei contenuti del sito, così che le pagine
// esistenti si aprano e si salvino senza perdere nulla.

/** Riquadro evidenziato: <div class="avviso">…</div> (es. orari della segreteria). */
export const Avviso = Node.create({
  name: 'avviso',
  group: 'block',
  content: 'block+',
  defining: true,

  parseHTML() {
    return [{ tag: 'div.avviso' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { class: 'avviso' }), 0];
  },
});

/** Elenco puntato che conserva un'eventuale classe (es. <ul class="appuntamenti">). */
export const ElencoConClasse = BulletList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      class: {
        default: null,
        parseHTML: (el) => el.getAttribute('class'),
        renderHTML: (attrs) => (attrs['class'] ? { class: attrs['class'] } : {}),
      },
    };
  },
});

/**
 * Testo semplice storico (es. descrizioni eventi scritte con gli a capo):
 * lo trasforma in paragrafi, così l'editor non perde le righe.
 */
export function daTestoSemplice(valore: string): string {
  if (!valore || /<[a-z][\s\S]*>/i.test(valore)) return valore ?? '';
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return valore
    .split(/\n{2,}/)
    .map((par) => `<p>${esc(par).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

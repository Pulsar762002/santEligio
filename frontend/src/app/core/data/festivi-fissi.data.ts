/**
 * Solennità e giorni festivi a data fissa (verificati sul calendario liturgico
 * della CEI, chiesacattolica.it/liturgia-del-giorno) in cui si segue l'orario
 * festivo delle Messe anche se il giorno cade in settimana, indicizzati per
 * "MM-DD". Le feste mobili legate alla Pasqua (es. Lunedì dell'Angelo) non
 * sono incluse: dipendono dall'anno e non hanno una data fissa.
 */
export const FESTIVI_FISSI: string[] = [
  '01-01', // Maria Santissima Madre di Dio – Solennità
  '01-06', // Epifania del Signore – Solennità
  '08-15', // Assunzione della Beata Vergine Maria – Solennità
  '11-01', // Tutti i Santi – Solennità
  '12-08', // Immacolata Concezione della Beata Vergine Maria – Solennità
  '12-25', // Natale del Signore – Solennità
  '12-26', // Santo Stefano – Festa, giorno festivo civile
];

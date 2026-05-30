// Eseguito automaticamente da MongoDB al primo avvio del container
// Crea l'utente applicativo con permessi limitati al solo DB santeligio

db = db.getSiblingDB(process.env.MONGO_INITDB_DATABASE || 'santeligio');

db.createUser({
  user: 'santeligio_app',
  pwd: process.env.MONGO_APP_PASSWORD || 'app_password_change_me',
  roles: [{ role: 'readWrite', db: 'santeligio' }],
});

// ── Crea le collezioni con validazione schema base ────────────

db.createCollection('news', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['titolo', 'testo', 'createdAt'],
      properties: {
        titolo:    { bsonType: 'string', maxLength: 200 },
        testo:     { bsonType: 'string' },
        categoria: { bsonType: 'string', enum: ['liturgia', 'catechismo', 'caritas', 'eventi', 'comunicati'] },
        pubblicato:{ bsonType: 'bool' },
        immagine:  { bsonType: 'string' },
        createdAt: { bsonType: 'date' },
      },
    },
  },
});

db.createCollection('eventi', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['titolo', 'dataInizio', 'createdAt'],
      properties: {
        titolo:     { bsonType: 'string', maxLength: 200 },
        descrizione:{ bsonType: 'string' },
        dataInizio: { bsonType: 'date' },
        dataFine:   { bsonType: 'date' },
        luogo:      { bsonType: 'string' },
        pubblicato: { bsonType: 'bool' },
        createdAt:  { bsonType: 'date' },
      },
    },
  },
});

db.createCollection('orari_messe');
db.createCollection('sacramenti');
db.createCollection('gruppi');
db.createCollection('pagine');
db.createCollection('media');
db.createCollection('utenti');

// ── Indici ────────────────────────────────────────────────────
db.news.createIndex({ createdAt: -1 });
db.news.createIndex({ categoria: 1, pubblicato: 1 });
db.eventi.createIndex({ dataInizio: 1 });
db.utenti.createIndex({ email: 1 }, { unique: true });

print('✅  MongoDB inizializzato: DB santeligio, utente app, collezioni e indici creati.');

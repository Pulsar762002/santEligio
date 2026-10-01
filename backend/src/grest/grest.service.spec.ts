import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  BadRequestException, ConflictException, ForbiddenException, NotFoundException, UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { GrestService, emailDestinatari, generaUsername } from './grest.service';
import { GrestMailService } from './grest-mail.service';
import { GrestIscritto } from './schemas/grest-iscritto.schema';
import { GrestImpostazioni } from './schemas/grest-impostazioni.schema';
import { RegistrazioneDto } from './dto/registrazione.dto';

const registrazione = (): RegistrazioneDto => ({
  nomePadre: 'Mario', cognomePadre: 'Rossi', emailPadre: 'm@r.it', mobilePhonePadre: '333',
  nomeMadre: '', cognomeMadre: '', emailMadre: '', mobilePhoneMadre: '',
  nomeFiglio: 'luca maria', cognomeFiglio: 'de rossi', natoA: 'Roma', natoIl: '01/02/2016',
  residenteA: 'Roma', via: 'Via Roma 1',
});

describe('GrestService', () => {
  let service: GrestService;
  const config: Record<string, string> = {};
  const model = {
    countDocuments: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
  };
  const impostazioni = { findOne: jest.fn(), updateOne: jest.fn() };
  const jwt = { sign: jest.fn().mockReturnValue('jwt') };
  const mail = { inviaLink: jest.fn().mockResolvedValue(true), linkAttivazione: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    for (const k of Object.keys(config)) delete config[k];
    const moduleRef = await Test.createTestingModule({
      providers: [
        GrestService,
        { provide: getModelToken(GrestIscritto.name), useValue: model },
        { provide: getModelToken(GrestImpostazioni.name), useValue: impostazioni },
        { provide: ConfigService, useValue: { get: (k: string, d?: unknown) => config[k] ?? d } },
        { provide: JwtService, useValue: jwt },
        { provide: GrestMailService, useValue: mail },
      ],
    }).compile();
    service = moduleRef.get(GrestService);
    // nessuna scelta dell'admin salvata: valgono le variabili d'ambiente
    impostazioni.findOne.mockReturnValue({ lean: () => Promise.resolve(null) });
  });

  it('generaUsername matches the old CamelCase algorithm', () => {
    expect(generaUsername('luca maria', 'de rossi')).toBe('LucaMariaDeRossi');
    expect(generaUsername(' ANNA ', 'bianchi')).toBe('AnnaBianchi');
  });

  it('emailDestinatari skips empty and duplicate addresses', () => {
    expect(emailDestinatari({ emailPadre: 'a@b.it', emailMadre: 'a@b.it' })).toEqual(['a@b.it']);
    expect(emailDestinatari({ emailPadre: '', emailMadre: 'c@d.it' })).toEqual(['c@d.it']);
  });

  describe('registra', () => {
    it('creates an inactive account with a token and sends the activation email', async () => {
      model.countDocuments.mockResolvedValue(10);
      model.create.mockImplementation(async (d) => d);
      const out = await service.registra(registrazione());
      const creato = model.create.mock.calls[0][0];
      expect(creato).toMatchObject({
        username: 'LucaMariaDeRossi', usernameLower: 'lucamariaderossi', attivo: false,
      });
      expect(creato.activationToken).toMatch(/^[0-9a-f]{64}$/);
      expect(creato.password).toBeUndefined();
      expect(mail.inviaLink).toHaveBeenCalledWith(['m@r.it'], creato, creato.activationToken, 'attivazione');
      expect(out).toEqual({ username: 'LucaMariaDeRossi', emailInviata: true });
    });

    it('requires one complete parent', async () => {
      model.countDocuments.mockResolvedValue(0);
      await expect(
        service.registra({ ...registrazione(), mobilePhonePadre: '' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('enforces the maximum number of participants', async () => {
      config.GREST_MAX_ISCRITTI = '5';
      model.countDocuments.mockResolvedValue(5);
      await expect(service.registra(registrazione())).rejects.toBeInstanceOf(ForbiddenException);
      expect(model.create).not.toHaveBeenCalled();
    });

    it('is refused when registrations are closed', async () => {
      config.GREST_ISCRIZIONI_APERTE = 'false';
      await expect(service.registra(registrazione())).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('is refused when an admin closed registrations, whatever the env says', async () => {
      config.GREST_ISCRIZIONI_APERTE = 'true';
      impostazioni.findOne.mockReturnValue({ lean: () => Promise.resolve({ iscrizioniAperte: false }) });
      await expect(service.registra(registrazione())).rejects.toBeInstanceOf(ForbiddenException);
      expect(model.create).not.toHaveBeenCalled();
    });

    it('is accepted when an admin reopened registrations closed in the env', async () => {
      config.GREST_ISCRIZIONI_APERTE = 'false';
      impostazioni.findOne.mockReturnValue({ lean: () => Promise.resolve({ iscrizioniAperte: true }) });
      model.countDocuments.mockResolvedValue(0);
      model.create.mockImplementation(async (d) => d);
      await expect(service.registra(registrazione())).resolves.toMatchObject({ username: 'LucaMariaDeRossi' });
    });

    it('turns a duplicate username into 409', async () => {
      model.countDocuments.mockResolvedValue(0);
      model.create.mockRejectedValue({ code: 11000 });
      await expect(service.registra(registrazione())).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('impostazioni', () => {
    it('reports the env value when the admin never chose', async () => {
      config.GREST_ISCRIZIONI_APERTE = 'false';
      model.countDocuments.mockImplementation(async (f?: object) => (f ? 3 : 195));
      await expect(service.impostazioni()).resolves.toEqual({
        iscrizioniAperte: false, fonte: 'env', accessoRistretto: false, abilitati: 3,
        iscritti: 195, maxIscritti: 196,
      });
    });

    it('saves the admin choice as a single upserted document', async () => {
      model.countDocuments.mockResolvedValue(0);
      await service.aggiornaImpostazioni({ iscrizioniAperte: true });
      expect(impostazioni.updateOne).toHaveBeenCalledWith(
        { chiave: 'grest' }, { $set: { iscrizioniAperte: true } }, { upsert: true },
      );
    });
  });

  describe('accesso ristretto', () => {
    const ristretto = (v: boolean) =>
      impostazioni.findOne.mockReturnValue({ lean: () => Promise.resolve({ accessoRistretto: v }) });

    it('blocks login of families not enabled, after checking the password', async () => {
      const password = await bcrypt.hash('segreta', 4);
      ristretto(true);
      model.findOne.mockResolvedValue({ id: 'a', username: 'X', attivo: true, abilitato: false, password });
      await expect(service.login('x', 'segreta')).rejects.toBeInstanceOf(ForbiddenException);
      await expect(service.login('x', 'sbagliata')).rejects.toBeInstanceOf(UnauthorizedException);
      model.findOne.mockResolvedValue({ id: 'a', username: 'X', attivo: true, abilitato: true, password });
      await expect(service.login('x', 'segreta')).resolves.toMatchObject({ username: 'X' });
    });

    it('puoAccedere re-checks every request', async () => {
      const iscritto = (o: object) => model.findById.mockReturnValue({ select: () => ({ lean: () => Promise.resolve(o) }) });
      const id = '64b7f0f0f0f0f0f0f0f0f0f0';
      ristretto(true);
      iscritto({ attivo: true, abilitato: false });
      await expect(service.puoAccedere(id)).resolves.toBe(false);
      iscritto({ attivo: true, abilitato: true });
      await expect(service.puoAccedere(id)).resolves.toBe(true);
      ristretto(false);
      iscritto({ attivo: true, abilitato: false });
      await expect(service.puoAccedere(id)).resolves.toBe(true);
      iscritto({ attivo: false, abilitato: true });
      await expect(service.puoAccedere(id)).resolves.toBe(false);
      await expect(service.puoAccedere('non-valido')).resolves.toBe(false);
    });
  });

  describe('modifiche dei responsabili', () => {
    it('keep the consent given by the family', async () => {
      const doc: any = {
        autorizzazione: { consenso: true }, save: jest.fn(),
      };
      model.findById.mockImplementation((id: string) =>
        id ? Object.assign(Promise.resolve(doc), { select: () => ({ lean: () => Promise.resolve(doc) }) }) : null);
      const a = {
        dichiarazione1: false, dichiarazione2: true, dichiarazione3: false, dichiarazione4: false,
        dichiarazione5: false, dichiarazione6: true, dichiarazione7: true, allergie: 'latte',
        intolleranze: '', autorizzazione1: true, autorizzazione2: false, autorizzazione3: true, autorizzazione4: true,
      };
      await service.aggiornaAutorizzazioneAdmin('64b7f0f0f0f0f0f0f0f0f0f0', a);
      expect(doc.autorizzazione).toMatchObject({ ...a, consenso: true, dichiarazione8: false });
    });

    it('cannot create forms the family never filled', async () => {
      const doc: any = { autorizzazione: null, delega: null, save: jest.fn() };
      model.findById.mockResolvedValue(doc);
      await expect(service.aggiornaDelegaAdmin('64b7f0f0f0f0f0f0f0f0f0f0', { delegati: [] }))
        .rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('accepts the right password case-insensitively on the username', async () => {
      const password = await bcrypt.hash('segreta', 4);
      model.findOne.mockResolvedValue({ id: 'abc', username: 'LucaRossi', attivo: true, password });
      await expect(service.login(' LUCAROSSI ', 'segreta')).resolves.toEqual({
        access_token: 'jwt', username: 'LucaRossi',
      });
      expect(model.findOne).toHaveBeenCalledWith({ usernameLower: 'lucarossi' });
      expect(jwt.sign).toHaveBeenCalledWith({ sub: 'abc', username: 'LucaRossi', tipo: 'grest' });
    });

    it('rejects wrong passwords and inactive accounts', async () => {
      const password = await bcrypt.hash('segreta', 4);
      model.findOne.mockResolvedValue({ attivo: true, password });
      await expect(service.login('x', 'sbagliata')).rejects.toBeInstanceOf(UnauthorizedException);
      model.findOne.mockResolvedValue({ attivo: false, password });
      await expect(service.login('x', 'segreta')).rejects.toBeInstanceOf(UnauthorizedException);
      model.findOne.mockResolvedValue(null);
      await expect(service.login('x', 'segreta')).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('attiva', () => {
    it('sets a hashed password, activates and consumes the token', async () => {
      const doc: any = { username: 'LucaRossi', attivo: false, activationToken: 't', save: jest.fn() };
      model.findOne.mockResolvedValue(doc);
      await service.attiva({ token: 't', password: 'nuovapassword' });
      expect(model.findOne).toHaveBeenCalledWith({ activationToken: 't' });
      expect(doc.attivo).toBe(true);
      expect(doc.activationToken).toBeUndefined();
      expect(await bcrypt.compare('nuovapassword', doc.password)).toBe(true);
      expect(doc.save).toHaveBeenCalled();
    });

    it('rejects unknown tokens', async () => {
      model.findOne.mockResolvedValue(null);
      await expect(service.attiva({ token: 'x', password: 'nuovapassword' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('perModulo', () => {
    const doc = (o: object) => ({ toObject: () => o });

    it('refuses forms that were never saved', async () => {
      model.findById.mockResolvedValue(doc({ consenso: false, autorizzazione: null, delega: null }));
      for (const m of ['iscrizione', 'autorizzazione', 'delega'] as const) {
        await expect(service.perModulo('64b7f0f0f0f0f0f0f0f0f0f0', m)).rejects.toBeInstanceOf(ConflictException);
      }
    });

    it('returns 404 for invalid ids', async () => {
      await expect(service.perModulo('nope', 'iscrizione')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});

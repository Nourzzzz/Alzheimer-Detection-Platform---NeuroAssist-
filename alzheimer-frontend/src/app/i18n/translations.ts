import { Lang } from '../services/i18n';
import { coreFr, coreEn } from './keys/core';
import { patientFr, patientEn } from './keys/patient';
import { medecinFr, medecinEn } from './keys/medecin';
import { adminFr, adminEn } from './keys/admin';
import { siteFr, siteEn } from './keys/site';

// Keys are split per area so several areas can be translated independently.
// French is the reference language: every key must exist in `fr`, and `en`
// falls back to it when a translation is missing.
export const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  fr: { ...coreFr, ...patientFr, ...medecinFr, ...adminFr, ...siteFr },
  en: { ...coreEn, ...patientEn, ...medecinEn, ...adminEn, ...siteEn },
};

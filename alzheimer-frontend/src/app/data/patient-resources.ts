import { AlzheimerStage } from '../models/mri.model';
import { Lang } from '../services/i18n';

export type ResourceKind = 'association' | 'support' | 'learn' | 'prevention';

export interface PatientResource {
  id: string;
  url: string;
  kind: ResourceKind;
  /** Which validated stages this resource is offered for. */
  stages: AlzheimerStage[];
  /** Language the destination site is written in, shown as a badge. */
  siteLang: Lang;
  title: Record<Lang, string>;
  description: Record<Lang, string>;
}

export const RESOURCE_ICONS: Record<ResourceKind, string> = {
  association: 'bi-people-fill',
  support: 'bi-chat-heart-fill',
  learn: 'bi-journal-medical',
  prevention: 'bi-heart-pulse-fill',
};

/**
 * Hand-picked, checked links to recognised organisations. Deliberately kept out
 * of the language model's reach: a hallucinated address on a patient-facing
 * medical page would be worse than no link at all.
 */
export const PATIENT_RESOURCES: PatientResource[] = [
  {
    id: 'france-alzheimer',
    url: 'https://www.francealzheimer.org',
    kind: 'association',
    stages: ['MCI', 'AD'],
    siteLang: 'fr',
    title: { fr: 'France Alzheimer', en: 'France Alzheimer' },
    description: {
      fr: "Association nationale de familles : écoute, information et accompagnement, avec des antennes dans chaque département.",
      en: 'French national family association: listening, information and support, with a branch in every department.',
    },
  },
  {
    id: 'france-alzheimer-soutien',
    url: 'https://www.francealzheimer.org/nos-actions/nos-actions-de-soutien/',
    kind: 'support',
    stages: ['MCI', 'AD'],
    siteLang: 'fr',
    title: { fr: 'Groupes de parole et cafés mémoire', en: 'Support groups and memory cafés' },
    description: {
      fr: "Rencontrer d'autres personnes concernées, échanger avec des psychologues et participer à des ateliers près de chez vous.",
      en: 'Meet others in the same situation, talk with psychologists and join workshops near you.',
    },
  },
  {
    id: 'alz-support-groups',
    url: 'https://www.alz.org/help-support/community/support-groups',
    kind: 'support',
    stages: ['MCI', 'AD'],
    siteLang: 'en',
    title: { fr: "Groupes de soutien de l'Alzheimer's Association", en: "Alzheimer's Association support groups" },
    description: {
      fr: 'Groupes de soutien en ligne et en présentiel, pour les personnes concernées comme pour leurs proches aidants.',
      en: 'Online and in-person support groups, for people living with the disease and for their carers.',
    },
  },
  {
    id: 'alzheimers-society-support',
    url: 'https://www.alzheimers.org.uk/get-support',
    kind: 'support',
    stages: ['MCI', 'AD'],
    siteLang: 'en',
    title: { fr: "Alzheimer's Society — obtenir de l'aide", en: "Alzheimer's Society — get support" },
    description: {
      fr: 'Guides pratiques du quotidien et forum de discussion animé, pour les patients et leur entourage.',
      en: 'Practical day-to-day guides and a moderated discussion forum, for patients and those around them.',
    },
  },
  {
    id: 'alz-brain-health',
    url: 'https://www.alz.org/help-support/brain_health',
    kind: 'prevention',
    stages: ['CN', 'MCI'],
    siteLang: 'en',
    title: { fr: 'Préserver sa santé cérébrale', en: 'Looking after your brain health' },
    description: {
      fr: "Habitudes documentées — activité physique, sommeil, alimentation, vie sociale — qui aident à préserver la mémoire.",
      en: 'Evidence-based habits — exercise, sleep, diet, social life — that help protect memory.',
    },
  },
  {
    id: 'vaincre-alzheimer',
    url: 'https://www.vaincrealzheimer.org',
    kind: 'learn',
    stages: ['CN', 'MCI', 'AD'],
    siteLang: 'fr',
    title: { fr: 'Fondation Vaincre Alzheimer', en: 'Fondation Vaincre Alzheimer' },
    description: {
      fr: 'Informations vérifiées sur la maladie, la recherche en cours et la prévention, en français.',
      en: 'Reviewed information on the disease, ongoing research and prevention, in French.',
    },
  },
  {
    id: 'who-dementia',
    url: 'https://www.who.int/news-room/fact-sheets/detail/dementia',
    kind: 'learn',
    stages: ['CN', 'MCI', 'AD'],
    siteLang: 'en',
    title: { fr: 'OMS — aide-mémoire sur la démence', en: 'WHO — dementia fact sheet' },
    description: {
      fr: "Référence de l'Organisation mondiale de la santé : définitions, facteurs de risque et chiffres.",
      en: 'World Health Organization reference: definitions, risk factors and key figures.',
    },
  },
  {
    id: 'alzheimer-europe',
    url: 'https://www.alzheimer-europe.org',
    kind: 'association',
    stages: ['MCI', 'AD'],
    siteLang: 'en',
    title: { fr: 'Alzheimer Europe', en: 'Alzheimer Europe' },
    description: {
      fr: 'Annuaire des associations nationales en Europe, pour trouver un relais dans votre pays.',
      en: 'Directory of national associations across Europe, to find help in your own country.',
    },
  },
];

export function resourcesForStage(stage: AlzheimerStage | null): PatientResource[] {
  if (!stage) {
    return [];
  }
  return PATIENT_RESOURCES.filter((r) => r.stages.includes(stage));
}

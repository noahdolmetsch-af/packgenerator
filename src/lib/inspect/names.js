/**
 * «Velo-Inspektion»: the shown names. A name the person typed never goes through t(); a template name does.
 */
import { t } from '../i18n.svelte.js';
import { LEVEL } from './items.js';

export const pointName = (p) => p?.name ?? (p?.std ? t(p.std) : '');
export const areaName = (a) => (a?.id === '' ? t('No group') : a?.name ?? (a?.std ? t(a.std) : ''));
export const levelName = (key) => (LEVEL[key] ? t(LEVEL[key].name) : '');

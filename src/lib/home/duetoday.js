/**
 * «Alltag sichtbar» (Noah 24.10.2026 «1a»): «Heute fällig», one line on Heute with what is really due today:
 * to-dos (late or today), birthdays today, plants to water and bike care that is due. Nothing due, no line.
 * Pure; Home.svelte passes the Merken list (settings 'merken') and the care count (quickcare.js dueAll).
 * Each entry opens the place where it is done: Planen › Merken, or Velos › Pflege.
 */
import { groupTodos } from '../merken.js';
import { birthdayRows, plantRows } from '../merken/kinds.js';

/** [{ key, kind: 'todo' | 'birthday' | 'plant' | 'care', n, name?, href }] in this order. */
export function dueToday({ todos = [], today, care = 0 } = {}) {
  const out = [];
  const g = groupTodos(todos, today);
  const late = [...g.late, ...g.today];
  if (late.length) out.push({ key: 'todo', kind: 'todo', n: late.length, name: late.length === 1 ? late[0].text : null, href: '#/calendar' });
  for (const r of birthdayRows(todos, today)) if (r.in === 0 && !r.td.off) out.push({ key: `bday:${r.td.id}`, kind: 'birthday', n: 1, name: r.td.text, href: '#/calendar' });
  const plants = plantRows(todos, today).filter((r) => r.in <= 0 && !r.td.off);
  if (plants.length) out.push({ key: 'plant', kind: 'plant', n: plants.length, name: plants.length === 1 ? plants[0].td.text : null, href: '#/calendar' });
  if (care > 0) out.push({ key: 'care', kind: 'care', n: care, href: '#/bikes?tab=care' });
  return out;
}

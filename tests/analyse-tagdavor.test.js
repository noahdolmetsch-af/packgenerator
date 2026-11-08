// «Cardio-Belastung» Idee F: what you did on a day, from Fitbit workouts, ticks and rides (lib/analyse/tagdavor.js). Fictional names only.
import { describe, it, expect } from 'vitest';
import { workoutName, doneOn, doneText } from '../src/lib/analyse/tagdavor.js';

describe('workoutName', () => {
  it('takes the name Fitbit gave, else the type in plain words', () => {
    expect(workoutName({ name: 'Trailrun', type: 'RUNNING' })).toBe('Trailrun');
    expect(workoutName({ name: '', type: 'MOUNTAIN_BIKING' })).toBe('Mountain biking');
    expect(workoutName({ type: 'OTHER' })).toBe('');
    expect(workoutName(null)).toBe('');
  });
});

describe('doneOn', () => {
  it('puts Fitbit workouts first, then ticks, then rides, without doubles', () => {
    const r = doneOn({ workouts: [{ name: 'Joggen' }], ticked: ['Yoga', 'joggen'], rides: ['Velo'] }, 3);
    expect(r).toEqual({ names: ['Joggen', 'Yoga', 'Velo'], more: 0 });
  });
  it('keeps at most two and counts the rest', () => {
    const r = doneOn({ workouts: [{ name: 'Joggen' }, { name: 'Gehen' }], ticked: ['Yoga'], rides: [] });
    expect(r).toEqual({ names: ['Joggen', 'Gehen'], more: 1 });
    expect(doneText(r)).toBe('Joggen, Gehen +1');
  });
  it('is empty when nothing was done or recorded', () => {
    expect(doneText(doneOn({}))).toBe('');
    expect(doneText(doneOn({ workouts: [{ type: 'OTHER' }] }))).toBe('');
  });
});

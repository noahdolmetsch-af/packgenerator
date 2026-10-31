// «Gut zu wissen» über die Suche aus- und einblenden (Noah 28.10.2026 «b»): the search commands.
import { describe, it, expect } from 'vitest';
import { commandActions } from '../src/lib/search.js';
import { spokenCommand } from '../src/lib/suche/logic.js';

const kinds = (q) => commandActions(q).map((c) => c.kind);

describe('Gut zu wissen in the search', () => {
  it('«ausblenden» offers only hiding, and a spoken one runs at once', () => {
    expect(kinds('Gut zu wissen ausblenden')).toEqual(['tipsoff']);
    expect(kinds('tipps ausblenden')).toEqual(['tipsoff']);
    expect(kinds('hide tips')).toEqual(['tipsoff']);
    expect(spokenCommand(commandActions('Gut zu wissen ausblenden'))?.cmd).toEqual({ kind: 'tipsoff' });
  });
  it('«einblenden» offers only showing again', () => {
    expect(kinds('Gut zu wissen einblenden')).toEqual(['tipson']);
    expect(kinds('Tipps einblenden')).toEqual(['tipson']);
    expect(kinds('show tips')).toEqual(['tipson']);
  });
  it('the name alone offers both, and a spoken one waits for a choice', () => {
    expect(kinds('gut zu wissen')).toEqual(['tipsoff', 'tipson']);
    expect(spokenCommand(commandActions('gut zu wissen'))).toBeNull();
  });
  it('other words after it are a search, not the command', () => {
    expect(kinds('gut zu wissen velo')).toEqual([]);
  });
});

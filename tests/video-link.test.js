// «Video-Link statt Datei» (Noah 28.10.2026 «2a»): which links the note shows as video links.
import { describe, it, expect } from 'vitest';
import { isVideoLink } from '../src/lib/inspiration.js';
import DE from '../src/lib/i18n/de/index.js';

describe('video links in notes', () => {
  it('knows video sites and ordinary pages, also without https and with www', () => {
    expect(isVideoLink('https://www.youtube.com/watch?v=abc')).toBe(true);
    expect(isVideoLink('youtu.be/abc')).toBe(true);
    expect(isVideoLink('https://vimeo.com/12345')).toBe(true);
    expect(isVideoLink('https://example.org/packliste')).toBe(false);
    expect(isVideoLink('')).toBe(false);
    expect(isVideoLink('kein link')).toBe(false);
  });
  it('the new texts have German', () => {
    expect(DE['Video link: the video stays where it is']).toBeTruthy();
    expect(DE['The video is longer than 1 minute. Shorten it on the phone first, or keep it there and add its link under «Link».']).toBeTruthy();
  });
});

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { en } from '../i18n/en';
import { RELEASES, compareVersions, isVersion, releasesToAnnounce, type Release } from './releases';

const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { version: string };

describe('RELEASES', () => {
  it('starts with the version in package.json', () => {
    expect(RELEASES[0]?.version).toBe(pkg.version);
  });

  it('is newest first, with valid, unique versions and dates', () => {
    for (const [i, r] of RELEASES.entries()) {
      expect(isVersion(r.version), r.version).toBe(true);
      expect(r.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const older = RELEASES[i + 1];
      if (older) {
        expect(compareVersions(r.version, older.version), `${r.version} after ${older.version}`).toBeGreaterThan(0);
        expect(r.date >= older.date, `${r.version} dated before ${older.version}`).toBe(true);
      }
    }
  });

  it('says something in every release, in strings that exist', () => {
    for (const r of RELEASES) {
      expect(r.notes.length > 0 || r.fixes, r.version).toBeTruthy();
      for (const key of r.notes) expect(en[key], key).toBeTruthy();
    }
  });

  it('keeps notes brief', () => {
    for (const r of RELEASES) {
      expect(r.notes.length, r.version).toBeLessThanOrEqual(4);
      for (const key of r.notes) expect(en[key].length, key).toBeLessThanOrEqual(120);
    }
  });
});

describe('compareVersions', () => {
  it('compares numerically, not as text', () => {
    expect(compareVersions('2.10.0', '2.9.0')).toBeGreaterThan(0);
    expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
    expect(compareVersions('0.9.9', '1.0.0')).toBeLessThan(0);
    expect(compareVersions('bad', '0.0.0')).toBeLessThan(0);
  });
});

describe('releasesToAnnounce', () => {
  const list: Release[] = [
    { version: '1.2.0', date: '2026-01-03', notes: [], fixes: true },
    { version: '1.1.0', date: '2026-01-02', notes: [], fixes: true },
    { version: '1.0.0', date: '2026-01-01', notes: [], fixes: true },
  ];
  const versions = (rs: Release[]) => rs.map((r) => r.version);

  it('shows nothing to a brand new player', () => {
    expect(releasesToAnnounce(null, '1.2.0', false, list)).toEqual([]);
  });

  it('shows only the current release to a returning player with no record', () => {
    expect(versions(releasesToAnnounce(null, '1.2.0', true, list))).toEqual(['1.2.0']);
    expect(versions(releasesToAnnounce('garbage', '1.2.0', true, list))).toEqual(['1.2.0']);
  });

  it('shows every release since the last one seen, newest first', () => {
    expect(versions(releasesToAnnounce('1.0.0', '1.2.0', true, list))).toEqual(['1.2.0', '1.1.0']);
  });

  it('shows nothing when nothing changed, or after going back a version', () => {
    expect(releasesToAnnounce('1.2.0', '1.2.0', true, list)).toEqual([]);
    expect(releasesToAnnounce('1.2.0', '1.1.0', true, list)).toEqual([]);
  });

  it('never announces releases newer than the running game', () => {
    expect(versions(releasesToAnnounce('1.0.0', '1.1.0', true, list))).toEqual(['1.1.0']);
  });
});

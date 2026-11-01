import { fireEvent, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';
import { App } from './App';
import { makeCatalog, makeVideo } from './test/fixtures';

const catalog = makeCatalog([
  makeVideo({ vid: 'systems0001', title: 'A thoughtful systems talk' }),
]);

describe('App keyboard shortcut regression', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.location.hash = '#/';
  });

  // Regression: ISSUE-001 — browser extensions could intercept w before watch-later ran
  // Found by /qa on 2026-11-01
  // Report: .gstack/qa-reports/qa-report-localhost-2026-11-01.md
  test('adds the selected video to watch later when w keydown is intercepted', async () => {
    render(<App initialCatalog={catalog} />);
    fireEvent.keyDown(document.body, { key: 'j' });

    const interceptKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLocaleLowerCase() === 'w') event.stopPropagation();
    };
    document.addEventListener('keydown', interceptKeyDown, true);

    try {
      fireEvent.keyDown(document.body, { key: 'w' });
      fireEvent.keyUp(document.body, { key: 'w' });
    } finally {
      document.removeEventListener('keydown', interceptKeyDown, true);
    }

    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem('hackertube-personal:v1') ?? '{}');
      expect(saved.watchLater).toContain('systems0001');
    });
  });
});

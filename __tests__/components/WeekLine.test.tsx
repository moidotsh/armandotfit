// __tests__/components/WeekLine.test.tsx
//
// THE WEEK LINE — the front page's consistency register (the
// upending pass). The derivation is a pure function pinned to a
// supplied `now`; the render asserts the honest grammar:
//   - seven columns, Sunday-first (the analytics grid's grammar)
//   - AM + PM on one day count as 2 sessions
//   - a past day with no session counts 0 (prints '·')
//   - days AFTER today are `future` — the print is blank (a '·'
//     there would claim a rest day that has not happened)
//   - exactly one `isToday`
//   - the a11y label sums only through today (the future asserts
//     nothing) and the whole line is one button to THE LEDGER.

import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ThemeProvider } from '../../context';
import { WeekLine, buildWeekLineDays } from '../../components/composed';

function Wrap({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

// Wednesday, 2026-10-14 18:00 local — the week runs Sun 10-11 .. Sat 10-17.
const NOW = new Date(2026, 9, 14, 18, 0, 0);
const sessions = [
  { startedAt: '2026-10-14T07:15:00' }, // today AM
  { startedAt: '2026-10-14T17:45:00' }, // today PM — same day, second session
  { startedAt: '2026-10-13T07:15:00' }, // yesterday
  { startedAt: '2026-10-12T07:15:00' }, // Monday
];

describe('buildWeekLineDays — the derivation', () => {
  const days = buildWeekLineDays(sessions, NOW);

  it('returns seven columns, Sunday-first', () => {
    expect(days).toHaveLength(7);
    expect(days[0].key).toBe('2026-10-11'); // Sunday
    expect(days[6].key).toBe('2026-10-17'); // Saturday
  });

  it('counts AM and PM on one day as two sessions', () => {
    const today = days.find((d) => d.isToday);
    expect(today?.key).toBe('2026-10-14');
    expect(today?.count).toBe(2);
  });

  it('counts single sessions on their day', () => {
    expect(days.find((d) => d.key === '2026-10-13')?.count).toBe(1);
    expect(days.find((d) => d.key === '2026-10-12')?.count).toBe(1);
  });

  it('a past day with no session counts 0 (the print is a rest-day dot)', () => {
    expect(days.find((d) => d.key === '2026-10-11')?.count).toBe(0);
  });

  it('days after today are future — the week never states the future', () => {
    const future = days.filter((d) => d.key > '2026-10-14');
    expect(future).toHaveLength(3);
    expect(future.every((d) => d.future)).toBe(true);
    expect(future.every((d) => d.count === 0)).toBe(true);
  });

  it('marks exactly one today, and no past day is future', () => {
    expect(days.filter((d) => d.isToday)).toHaveLength(1);
    expect(days.filter((d) => d.key <= '2026-10-14').every((d) => !d.future)).toBe(true);
  });

  it('an empty log still yields the honest week (all zeros, today marked)', () => {
    const empty = buildWeekLineDays([], NOW);
    expect(empty).toHaveLength(7);
    expect(empty.every((d) => d.count === 0)).toBe(true);
    expect(empty.filter((d) => d.isToday)).toHaveLength(1);
  });

  it('a Sunday now anchors the week at itself', () => {
    const sundayNoon = new Date(2026, 9, 11, 12, 0, 0);
    const d = buildWeekLineDays([], sundayNoon);
    expect(d[0].isToday).toBe(true);
    expect(d.slice(1).every((x) => x.future)).toBe(true);
  });

  it('a Saturday now anchors the week with six past days', () => {
    const satEvening = new Date(2026, 9, 17, 20, 0, 0);
    const d = buildWeekLineDays([], satEvening);
    expect(d[6].isToday).toBe(true);
    expect(d.slice(0, 6).every((x) => !x.future)).toBe(true);
  });
});

describe('WeekLine — the render', () => {
  it('renders seven rail chars and seven count cells under one button', () => {
    const { container } = render(
      <Wrap>
        <WeekLine sessions={sessions} onPress={() => {}} now={NOW} testID="home-week" />
      </Wrap>,
    );
    const button = container.querySelector('[accessibilityrole="button"]');
    expect(button).not.toBeNull();
    const cells = container.querySelectorAll('[testid^="home-week-day-"]');
    expect(cells.length).toBe(7);
    // Rail + counts = 14 text nodes across the two rows.
    expect(button!.querySelectorAll('text').length).toBe(14);
  });

  it('future cells print nothing; past rest days print the dot; today prints its count', () => {
    const { container } = render(
      <Wrap>
        <WeekLine sessions={sessions} onPress={() => {}} now={NOW} testID="home-week" />
      </Wrap>,
    );
    const text = (key: string) =>
      container.querySelector(`[testid="home-week-day-${key}"]`)?.textContent ?? null;
    expect(text('2026-10-15')).toBe('');
    expect(text('2026-10-17')).toBe('');
    expect(text('2026-10-11')).toBe('·');
    expect(text('2026-10-14')).toBe('2');
    expect(text('2026-10-13')).toBe('1');
  });

  it('one press opens THE LEDGER', () => {
    let opened = 0;
    const { container } = render(
      <Wrap>
        <WeekLine sessions={sessions} onPress={() => { opened += 1; }} now={NOW} testID="home-week" />
      </Wrap>,
    );
    const button = container.querySelector('[accessibilityrole="button"]') as HTMLElement;
    fireEvent.click(button);
    expect(opened).toBe(1);
  });

  it('the a11y label sums only through today and says where it goes', () => {
    const { container } = render(
      <Wrap>
        <WeekLine sessions={sessions} onPress={() => {}} now={NOW} testID="home-week" />
      </Wrap>,
    );
    const label =
      container.querySelector('[accessibilityrole="button"]')?.getAttribute('accessibilitylabel') ?? '';
    expect(label).toContain('4 sessions');
    expect(label).toContain('analytics');
  });
});

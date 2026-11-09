// What a big ticket really holds: one row per problem, each its own ticket.
// causes.ts tells a month flip from the booking-v3 hint. It cannot see a date that moved by one
// day: those reports name no swapped month, and the desk listed them by hand (desk-notes.json).
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'shift' | 'unplaced';

export const PROBLEM_LABEL: Record<Problem, string> = {
  parser: 'shared parser reads dates month first',
  hint: 'booking-v3 form hints MM/DD to day-first tenants',
  shift: 'dates move by one day (time zone)',
  unplaced: 'no tenant on file, or tenant writes month first',
};

// The desk counts with its own view (CauseTable): every report under the cause its tenant and
// channel give, one-day moves included — "counted where they're filed, footnoted under it".
// So a one-day move counts in its cause's row AND in the `shift` row; `shift` is the footnote,
// made a ticket of its own.
export type ProblemGroup = {
  problem: Problem;
  // For `shift`: the cause row these reports are also counted in.
  filedUnder?: Problem[];
  reports: Report[];
  tenants: string[];
  channels: Record<string, number>;
  taggedAs: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
};

const tally = (xs: string[]) => xs.reduce<Record<string, number>>((n, x) => ({ ...n, [x]: (n[x] ?? 0) + 1 }), {});

export function splitTicket(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  shifted: readonly string[],
): { rows: number; unique: number; groups: ProblemGroup[] } {
  const rows = all.filter((r) => r.mergedInto === ticket);
  const merged = uniqueById(rows);
  const causeOfReport = (r: Report): Problem => causeOf(r, tenantOf(r)) ?? 'unplaced';
  const byProblem = new Map<Problem, Report[]>();
  for (const r of merged) {
    const p = causeOfReport(r);
    byProblem.set(p, [...(byProblem.get(p) ?? []), r]);
  }
  const moved = merged.filter((r) => shifted.includes(r.id));
  const groups: ProblemGroup[] = [...byProblem.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs,
        tenants: [...new Set(rs.map((r) => r.tenant))].sort(),
        channels: tally(rs.map((r) => r.channel)),
        taggedAs: tally(rs.map((r) => r.meta.intakeTag)),
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
      };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
  if (moved.length) {
    const days = moved.map((r) => r.receivedAt.slice(0, 10)).sort();
    groups.push({
      problem: 'shift',
      filedUnder: [...new Set(moved.map(causeOfReport))],
      reports: moved,
      tenants: [...new Set(moved.map((r) => r.tenant))].sort(),
      channels: tally(moved.map((r) => r.channel)),
      taggedAs: tally(moved.map((r) => r.meta.intakeTag)),
      firstSeen: days[0],
      lastSeen: days[days.length - 1],
    });
  }
  return { rows: rows.length, unique: merged.length, groups };
}

// Reports whose intake tag names a different problem than the one they belong to.
export function mistagged(g: ProblemGroup): number {
  return g.reports.filter((r) => r.meta.intakeTag !== g.problem).length;
}

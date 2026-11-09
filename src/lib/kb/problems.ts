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

// A report the desk read as a one-day move is that problem, whatever its tenant's locale says.
export function problemOf(r: Report, t: Tenant | undefined, shifted: readonly string[]): Problem {
  if (shifted.includes(r.id)) return 'shift';
  return causeOf(r, t) ?? 'unplaced';
}

export type ProblemGroup = {
  problem: Problem;
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
  const byProblem = new Map<Problem, Report[]>();
  for (const r of merged) {
    const p = problemOf(r, tenantOf(r), shifted);
    byProblem.set(p, [...(byProblem.get(p) ?? []), r]);
  }
  const groups = [...byProblem.entries()]
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
  return { rows: rows.length, unique: merged.length, groups };
}

// Reports whose intake tag names a different problem than the one they belong to.
export function mistagged(g: ProblemGroup): number {
  return g.reports.filter((r) => r.meta.intakeTag !== g.problem).length;
}

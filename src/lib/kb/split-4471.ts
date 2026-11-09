// #4471 split by problem, computed once from the ticket export and the desk's notes.
import reports from '#lib/data/reports-4471.json';
import notes from '#lib/data/desk-notes.json';
import type { Report } from '#lib/kb/causes';
import { tenantOf } from '#lib/kb/locales';
import { splitTicket, type Problem } from '#lib/kb/problems';

export const split4471 = splitTicket(reports as Report[], 4471, tenantOf, notes.oneDayMove);

export function countOf(problem: Problem): number {
  return split4471.groups.find((g) => g.problem === problem)?.reports.length ?? 0;
}

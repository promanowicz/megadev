<script lang="ts">
  import { split4471 } from '#lib/kb/split-4471';
  import { mistagged, PROBLEM_LABEL, type Problem } from '#lib/kb/problems';

  // issues: problem → link to the ticket filed for it.
  let { issues = {} }: { issues?: Partial<Record<Problem, string>> } = $props();

  const { rows, unique, groups } = split4471;
  const sum = groups.reduce((n, g) => n + g.reports.length, 0);
  const fmt = (o: Record<string, number>) =>
    Object.entries(o)
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => `${k} ×${n}`)
      .join(' · ');
  const issueNo = (url: string) => '#' + url.split('/').pop();
</script>

<p class="sum">
  <strong>{unique}</strong> reports in #4471 ({rows} export rows, {rows - unique} repeated by overlapping
  export pages) · <strong>{groups.length}</strong> problems
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>channel</th><th>intake tag</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each groups as g (g.problem)}
      <tr>
        <td><code>{g.problem}</code><br /><span class="label">{PROBLEM_LABEL[g.problem]}</span></td>
        <td><strong>{g.reports.length}</strong></td>
        <td>{g.tenants.length}</td>
        <td class="small">{fmt(g.channels)}</td>
        <td class="small">{fmt(g.taggedAs)}{#if mistagged(g)}<br /><span class="warn">{mistagged(g)} tagged wrong</span>{/if}</td>
        <td class="small">{g.firstSeen} → {g.lastSeen}</td>
        <td>{#if issues[g.problem]}<a href={issues[g.problem]}>{issueNo(issues[g.problem] ?? '')}</a>{:else}<span class="warn">none yet</span>{/if}</td>
      </tr>
    {/each}
  </tbody>
  <tfoot>
    <tr><td>total</td><td><strong>{sum}</strong></td><td colspan="5" class="small">{sum === unique ? 'every report in exactly one problem' : `${unique - sum} reports not placed`}</td></tr>
  </tfoot>
</table>

<style>
  .sum { font-size: 1.1rem; }
  .label, .small { color: var(--muted); font-size: 0.85em; }
  .warn { color: var(--warn); font-weight: 600; font-size: 0.85em; }
  tfoot td { font-weight: 600; }
</style>

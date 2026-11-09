<script lang="ts">
  import { countOf, split4471 } from '#lib/kb/split-4471';
  import type { Problem } from '#lib/kb/problems';

  // <ProblemCount problem="hint" /> · <ProblemCount of="unique" /> · <ProblemCount of="rows" />
  let { problem, of }: { problem?: Problem; of?: 'unique' | 'rows' | 'problems' } = $props();

  const n = $derived(
    problem
      ? countOf(problem)
      : of === 'rows'
        ? split4471.rows
        : of === 'problems'
          ? split4471.groups.length
          : split4471.unique,
  );
</script>

<strong>{n}</strong>

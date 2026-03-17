<script lang="ts">
  import type { Snippet } from 'svelte';
  
  interface Props {
    class?: string;
    children: Snippet;
  }
  
  let { class: className = '', children }: Props = $props();
</script>

<div class="bg-[#1A1A1A] text-white neo-border neo-shadow p-6 transition-all {className}">
  {@render children()}
</div>

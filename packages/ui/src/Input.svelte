<script lang="ts">
  interface Props {
    type?: 'text' | 'password' | 'email' | 'number';
    placeholder?: string;
    value?: string;
    error?: boolean;
    disabled?: boolean;
    class?: string;
    oninput?: (e: Event) => void;
  }
  
  let { 
    type = 'text',
    placeholder = '',
    value = $bindable(''),
    error = false,
    disabled = false,
    class: className = '',
    oninput
  }: Props = $props();
</script>

<input
  {type}
  {placeholder}
  {disabled}
  bind:value
  {oninput}
  class="bg-[#262626] text-white neo-border p-4 font-mono font-bold text-lg focus:outline-none focus:bg-[#333333] focus:shadow-neo-sm transition-all placeholder:text-white/20 {error ? 'border-red-500 bg-red-500/10' : ''} {className}"
/>

<script lang="ts">
  import type { Snippet } from 'svelte';
  
  interface Props {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    class?: string;
    onclick?: (e: MouseEvent) => void;
    children: Snippet;
  }
  
  let { 
    variant = 'primary', 
    size = 'md', 
    disabled = false,
    type = 'button',
    class: className = '',
    onclick,
    children 
  }: Props = $props();
  
  const variantClasses = {
    primary: 'bg-neo-blue text-white hover:bg-blue-600',
    secondary: 'bg-neo-black text-white hover:bg-neo-blue',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    ghost: 'bg-transparent hover:bg-white/10'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-lg'
  };
</script>

<button
  {type}
  {disabled}
  {onclick}
  class="neo-border font-bold transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed {variantClasses[variant]} {sizeClasses[size]} {className}"
>
  {@render children()}
</button>

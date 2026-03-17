<script lang="ts">
  import { Shield, Lock, Key, Globe } from 'lucide-svelte';
  import { translations } from '$lib/i18n';
  import type { Language } from '$lib/types';
  
  let masterPassword = '';
  let loginError = false;
  let language: Language = 'pt';
  
  $: t = translations[language];
  
  function handleLogin(e: Event) {
    e.preventDefault();
    if (masterPassword === 'fortivault2024') {
      window.location.href = '/dashboard';
    } else {
      loginError = true;
      setTimeout(() => loginError = false, 2000);
    }
  }
  
  function toggleLanguage() {
    const langs: Language[] = ['en', 'es', 'pt'];
    const idx = langs.indexOf(language);
    language = langs[(idx + 1) % langs.length];
  }
</script>

<div class="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
  <div class="w-full max-w-md flex flex-col gap-8">
    <div class="flex flex-col items-center gap-4">
      <div class="w-20 h-20 bg-neo-blue neo-border neo-shadow flex items-center justify-center">
        <Shield size={48} strokeWidth={3} class="text-white" />
      </div>
      <h1 class="text-5xl font-black tracking-tighter text-center">FORTIVAULT</h1>
      <p class="font-mono text-neo-blue font-bold text-xs uppercase tracking-widest">Zero-Knowledge Secure Storage</p>
    </div>

    <form onsubmit={handleLogin} class="neo-card flex flex-col gap-6 p-8">
      <div class="flex flex-col gap-2">
        <h2 class="text-2xl font-black uppercase tracking-tight">{t.loginTitle}</h2>
        <p class="text-xs font-mono opacity-50">{t.loginSubtitle}</p>
      </div>

      <div class="flex flex-col gap-2">
        <label class="font-mono text-[10px] font-bold uppercase opacity-50" for="password">{t.masterPassword}</label>
        <div class="relative">
          <Lock class="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
          <input 
            id="password"
            type="password" 
            bind:value={masterPassword}
            class="w-full neo-input pl-12 {loginError ? 'border-red-500 bg-red-500/10' : ''}"
            placeholder="••••••••••••"
          />
        </div>
        {#if loginError}
          <p class="text-red-500 font-mono text-[10px] font-bold">{t.errorLogin}</p>
        {/if}
      </div>

      <button type="submit" class="neo-button bg-neo-blue text-white py-4 text-lg flex items-center justify-center gap-2">
        <Key size={20} strokeWidth={3} />
        {t.unlock}
      </button>

      <div class="flex justify-center gap-4 mt-2">
        <button type="button" onclick={toggleLanguage} class="text-[10px] font-mono font-bold opacity-50 hover:opacity-100 flex items-center gap-1">
          <Globe size={12} />
          {language.toUpperCase()}
        </button>
      </div>
    </form>

    <p class="text-center font-mono text-[10px] opacity-30 uppercase tracking-[0.2em]">
      AES-256-GCM • RSA-4096 • ARGON2ID
    </p>
  </div>
</div>

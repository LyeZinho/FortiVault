<script lang="ts">
  import { Shield, Settings, LogOut, Globe, Monitor, Plus, Folder, Users, Share2, Search, Eye, Copy, Lock, X, Edit2, Save, Trash2, FileText, User as UserIcon, ExternalLink, Hash, Clock } from 'lucide-svelte';
  import { translations } from '$lib/i18n';
  import { MOCK_VAULTS, MOCK_SECRETS, MOCK_USERS, MOCK_AUDIT_LOGS } from '$lib/constants';
  import type { Language, Secret, Vault, User, AuditLog } from '$lib/types';
  import { onMount } from 'svelte';
  import * as OTPAuth from 'otpauth';

  // State
  let secrets = $state<Secret[]>(MOCK_SECRETS);
  let activeVaultId = $state('v1');
  let searchQuery = $state('');
  let selectedTag = $state<string | null>(null);
  let isDesktopConnected = $state(true);
  let revealingSecretId = $state<string | null>(null);
  let autoLockTimer = $state(0);
  let currentView = $state<'VAULT' | 'ADMIN'>('VAULT');
  let selectedSecret = $state<Secret | null>(null);
  let isEditing = $state(false);
  let language = $state<Language>('pt');
  let totpCodes = $state<Record<string, string>>({});
  
  // Admin State
  let users = $state<User[]>(MOCK_USERS);
  let auditLogs = $state<AuditLog[]>(MOCK_AUDIT_LOGS);
  let isInviting = $state(false);
  let inviteEmail = $state('');
  
  // Form State
  let editForm = $state<Partial<Secret>>({});
  
  let t = $derived(translations[language]);
  
  // Computed
  let allTags = $derived(() => {
    const tags = new Set<string>();
    secrets.forEach(s => s.tags.forEach(t => tags.add(t)));
    return Array.from(tags);
  });
  
  let filteredSecrets = $derived(() => {
    return secrets.filter(secret => {
      const matchesVault = secret.vaultId === activeVaultId;
      const matchesSearch = secret.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            secret.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            secret.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTag = !selectedTag || secret.tags.includes(selectedTag);
      return matchesVault && matchesSearch && matchesTag;
    });
  });
  
  // Effects
  onMount(() => {
    const updateTOTP = () => {
      const newCodes: Record<string, string> = {};
      secrets.forEach(s => {
        if (s.totpSecret) {
          try {
            const totp = new OTPAuth.TOTP({
              secret: s.totpSecret,
              digits: 6,
              period: 30
            });
            newCodes[s.id] = totp.generate();
          } catch (e) {
            console.error('Invalid TOTP secret', e);
          }
        }
      });
      totpCodes = newCodes;
    };
    
    updateTOTP();
    const interval = setInterval(updateTOTP, 1000);
    return () => clearInterval(interval);
  });
  
  // Auto-lock timer
  $effect(() => {
    if (revealingSecretId) {
      autoLockTimer = 60;
      const interval = setInterval(() => {
        autoLockTimer -= 1;
        if (autoLockTimer <= 1) {
          revealingSecretId = null;
          autoLockTimer = 0;
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  });
  
  // Handlers
  function handleReveal(e: MouseEvent, id: string) {
    e.stopPropagation();
    if (!isDesktopConnected) return;
    revealingSecretId = id;
  }
  
  function startEditing(secret: Secret) {
    editForm = { ...secret };
    isEditing = true;
  }
  
  function handleSaveEdit() {
    if (!editForm.id) return;
    secrets = secrets.map(s => s.id === editForm.id ? { ...s, ...editForm } as Secret : s);
    if (selectedSecret) {
      selectedSecret = { ...selectedSecret, ...editForm } as Secret;
    }
    isEditing = false;
  }
  
  function handleDeleteSecret(id: string) {
    secrets = secrets.filter(s => s.id !== id);
    selectedSecret = null;
  }
  
  function handleInviteUser() {
    if (!inviteEmail) return;
    const newUser: User = {
      id: `u${users.length + 1}`,
      email: inviteEmail,
      status: 'PENDING_KEY_EXCHANGE',
      groups: ['Default'],
      lastActive: 'Never'
    };
    users = [newUser, ...users];
    auditLogs = [{
      id: `l${auditLogs.length + 1}`,
      actor: 'pedrokalebdej1@gmail.com',
      action: 'INVITED',
      target: inviteEmail,
      timestamp: new Date().toISOString(),
      status: 'SUCCESS'
    }, ...auditLogs];
    inviteEmail = '';
    isInviting = false;
  }
  
  function toggleLanguage() {
    const langs: Language[] = ['en', 'es', 'pt'];
    const nextIndex = (langs.indexOf(language) + 1) % langs.length;
    language = langs[nextIndex];
  }
  
  function handleLogout() {
    window.location.href = '/';
  }
</script>

<div class="min-h-screen flex flex-col font-sans text-white">
  <!-- Status Header -->
  <header class="h-16 bg-neo-gray border-b-4 border-white flex items-center justify-between px-6 z-20">
    <div class="flex items-center gap-2">
      <Shield class="text-neo-blue" size={28} strokeWidth={3} />
      <h1 class="font-mono font-black text-2xl tracking-tighter">{t.title}</h1>
    </div>

    <div class="flex items-center gap-4">
      <div class="neo-border px-4 py-1 font-mono font-bold text-sm flex items-center gap-2 {isDesktopConnected ? 'bg-neo-blue' : 'bg-gray-500'}">
        <Monitor size={16} />
        {t.status}: {isDesktopConnected ? t.connected : t.offline}
      </div>
      
      <button onclick={() => currentView = currentView === 'VAULT' ? 'ADMIN' : 'VAULT'} class="p-2 hover:bg-white/5 transition-colors neo-border flex items-center gap-2 font-bold font-mono text-xs bg-neo-black">
        {#if currentView === 'VAULT'}
          <Settings size={16} />
          {t.admin}
        {:else}
          <Lock size={16} />
          {t.vaultView}
        {/if}
      </button>
      
      <button onclick={toggleLanguage} class="p-2 hover:bg-white/5 transition-colors neo-border flex items-center gap-2 font-bold font-mono text-xs">
        <Globe size={16} />
        {language.toUpperCase()}
      </button>

      <button onclick={handleLogout} class="p-2 hover:bg-white/5 transition-colors">
        <LogOut size={20} />
      </button>
    </div>
  </header>

  <div class="flex-1 flex overflow-hidden">
    <!-- Sidebar -->
    <aside class="w-72 bg-neo-gray border-r-4 border-white flex flex-col p-6 gap-8 overflow-y-auto">
      <button class="bg-neo-blue text-neo-white neo-button neo-shadow flex items-center justify-center gap-2 py-4 text-lg">
        <Plus size={24} strokeWidth={3} />
        {t.newSecret}
      </button>

      <nav class="flex flex-col gap-6">
        <div>
          <h2 class="font-mono text-xs font-bold text-white/50 uppercase mb-4 tracking-widest">{t.vaults}</h2>
          <div class="flex flex-col gap-2">
            {#each MOCK_VAULTS as vault}
              <button
                onclick={() => activeVaultId = vault.id}
                class="flex items-center gap-3 p-3 font-bold transition-all border-2 {activeVaultId === vault.id ? 'bg-neo-blue text-neo-white border-white shadow-neo-sm translate-x-[-2px] translate-y-[-2px]' : 'bg-[#2A2A2A] border-transparent hover:border-white hover:translate-x-[-1px] hover:translate-y-[-1px]'}"
              >
                {#if vault.type === 'PERSONAL'}
                  <Folder size={18} />
                {:else if vault.type === 'DEPARTMENT'}
                  <Users size={18} />
                {:else}
                  <Share2 size={18} />
                {/if}
                {vault.name}
              </button>
            {/each}
          </div>
        </div>

        <div>
          <h2 class="font-mono text-xs font-bold text-white/50 uppercase mb-4 tracking-widest">{t.tags}</h2>
          <div class="flex flex-wrap gap-2">
            <button 
              onclick={() => selectedTag = null}
              class="text-[10px] font-bold px-2 py-1 neo-border {!selectedTag ? 'bg-neo-blue text-white' : 'bg-[#2A2A2A]'}"
            >
              {t.allTags}
            </button>
            {#each allTags() as tag}
              <button
                onclick={() => selectedTag = tag}
                class="text-[10px] font-bold px-2 py-1 neo-border {selectedTag === tag ? 'bg-neo-blue text-white' : 'bg-[#2A2A2A]'}"
              >
                #{tag.toUpperCase()}
              </button>
            {/each}
          </div>
        </div>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 bg-[#121212] p-8 overflow-y-auto">
      <div class="max-w-6xl mx-auto flex flex-col gap-8">
        {#if currentView === 'VAULT'}
          <!-- Search Bar -->
          <div class="relative">
            <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={24} />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              bind:value={searchQuery}
              class="w-full neo-input pl-14"
            />
          </div>

          <!-- Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {#if filteredSecrets().length > 0}
              {#each filteredSecrets() as secret (secret.id)}
                <div 
                  onclick={() => selectedSecret = secret}
                  class="neo-card flex flex-col gap-4 hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-neo-lg cursor-pointer group"
                >
                  <div class="flex justify-between items-start">
                    <span class="bg-neo-blue text-neo-white font-mono text-xs px-2 py-1 border-2 border-white font-bold">
                      {secret.type}
                    </span>
                    <div class="flex gap-2">
                      {#each secret.tags.slice(0, 2) as tag}
                        <span class="text-[10px] font-mono opacity-50">#{tag}</span>
                      {/each}
                    </div>
                  </div>

                  <h3 class="text-2xl font-black uppercase tracking-tight leading-tight">
                    {secret.title}
                  </h3>

                  <div class="bg-[#2A2A2A] border-2 border-white p-3 font-mono text-sm relative overflow-hidden min-h-[3rem] flex items-center">
                    {#if revealingSecretId === secret.id}
                      <div class="text-neo-blue font-bold break-all whitespace-pre-wrap w-full">
                        {secret.value}
                      </div>
                    {:else}
                      <div class="text-white/30 tracking-widest truncate w-full">
                        ********************************
                      </div>
                    {/if}
                    
                    {#if revealingSecretId === secret.id}
                      <div 
                        class="absolute bottom-0 left-0 h-1 bg-neo-blue transition-all"
                        style="width: {(autoLockTimer / 60) * 100}%"
                      />
                    {/if}
                  </div>

                  {#if secret.type === 'LOGIN' && secret.totpSecret}
                    <div class="flex items-center justify-between bg-neo-black text-white p-2 neo-border">
                      <span class="text-[10px] font-mono opacity-60">TOTP</span>
                      <span class="font-mono font-bold tracking-widest text-neo-blue">
                        {totpCodes[secret.id] || '------'}
                      </span>
                    </div>
                  {/if}

                  <div class="flex gap-2">
                    <button 
                      onclick={(e) => handleReveal(e, secret.id)}
                      disabled={!isDesktopConnected}
                      class="flex-1 py-3 font-bold transition-all flex items-center justify-center gap-2 {isDesktopConnected ? 'bg-neo-black text-neo-white hover:bg-neo-blue' : 'bg-gray-400 text-white cursor-not-allowed'}"
                    >
                      <Eye size={18} />
                      {revealingSecretId === secret.id ? `${t.revealing} (${autoLockTimer}s)` : t.reveal}
                    </button>
                    <button class="w-12 border-2 border-white flex items-center justify-center hover:bg-white/10 transition-colors">
                      <Copy size={18} />
                    </button>
                  </div>
                </div>
              {/each}
            {:else}
              <div class="col-span-full py-20 flex flex-col items-center justify-center border-4 border-dashed border-white/20 rounded-xl">
                <div class="w-32 h-32 border-2 border-white/10 flex items-center justify-center mb-6">
                  <Search size={48} class="text-white/10" />
                </div>
                <p class="font-mono font-bold text-white/40 text-center uppercase">
                  {t.emptyState}
                </p>
              </div>
            {/if}
          </div>
        {:else}
          <!-- Admin View -->
          <div class="flex flex-col gap-8">
            <div class="flex justify-between items-end">
              <div>
                <h2 class="text-5xl font-black uppercase tracking-tighter">{t.admin}</h2>
                <p class="font-mono text-neo-blue font-bold">ZERO-KNOWLEDGE MANAGEMENT SYSTEM</p>
              </div>
              <button 
                onclick={() => isInviting = true}
                class="neo-button bg-neo-blue text-white flex items-center gap-2 py-4 px-8 text-lg"
              >
                <Plus size={24} strokeWidth={3} />
                {t.inviteUser}
              </button>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <!-- User List -->
              <div class="lg:col-span-2 flex flex-col gap-4">
                <h3 class="font-mono font-black text-xl border-b-4 border-white pb-2 flex items-center gap-2">
                  <Users size={20} /> {t.users}
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {#each users as user}
                    <div class="neo-card p-4 flex flex-col gap-3">
                      <div class="flex justify-between items-start">
                        <div class="flex flex-col">
                          <span class="font-bold text-lg truncate max-w-[200px]">{user.email}</span>
                          <span class="font-mono text-[10px] opacity-50">ID: {user.id}</span>
                        </div>
                        <span class="neo-badge {user.status === 'ACTIVE' ? 'bg-neo-blue text-white' : user.status === 'PENDING_KEY_EXCHANGE' ? 'bg-yellow-400 text-black' : 'bg-red-500 text-white'}">
                          {user.status === 'ACTIVE' ? t.active : user.status === 'PENDING_KEY_EXCHANGE' ? t.pending : t.deactivated}
                        </span>
                      </div>
                      
                      <div class="flex flex-wrap gap-1">
                        {#each user.groups as g}
                          <span class="text-[9px] font-mono border border-white/20 px-1">{g}</span>
                        {/each}
                      </div>

                      <div class="mt-2 pt-2 border-t border-white/10 flex justify-between items-center text-[10px] font-mono">
                        <span class="opacity-50">{t.lastActive}:</span>
                        <span>{user.lastActive}</span>
                      </div>

                      {#if user.publicKey}
                        <div class="bg-black p-2 neo-border flex items-center justify-between">
                          <span class="font-mono text-[8px] opacity-40">RSA_PUB_KEY</span>
                          <div class="flex gap-2">
                            <Copy size={12} class="cursor-pointer hover:text-neo-blue" />
                          </div>
                        </div>
                      {/if}
                    </div>
                  {/each}
                </div>
              </div>

              <!-- Audit Trail -->
              <div class="flex flex-col gap-4">
                <h3 class="font-mono font-black text-xl border-b-4 border-white pb-2 flex items-center gap-2">
                  <FileText size={20} /> {t.auditTrail}
                </h3>
                <div class="bg-black neo-border p-4 font-mono text-[10px] h-[500px] overflow-y-auto flex flex-col gap-2">
                  {#each auditLogs as log}
                    <div class="border-l-2 border-neo-blue pl-2 py-1">
                      <div class="flex justify-between text-neo-blue">
                        <span>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        <span class={log.status === 'DENIED' ? 'text-red-500' : 'text-green-500'}>
                          [{log.status}]
                        </span>
                      </div>
                      <div class="mt-1">
                        <span class="text-white font-bold">{log.actor}</span>
                        <span class="mx-1 opacity-50">{log.action}</span>
                        <span class="text-neo-blue">{log.target}</span>
                      </div>
                    </div>
                  {/each}
                  <div class="mt-auto pt-4 text-white/20 animate-pulse">
                    _ WAITING FOR EVENTS...
                  </div>
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </main>
  </div>

  <!-- Invite Modal -->
  {#if isInviting}
    <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-neo-black/90 backdrop-blur-md">
      <div class="bg-[#1E1E1E] neo-border neo-shadow-lg w-full max-w-md p-8 flex flex-col gap-6">
        <div class="flex justify-between items-center">
          <h2 class="text-3xl font-black uppercase tracking-tighter">{t.inviteUser}</h2>
          <button onclick={() => isInviting = false} class="hover:rotate-90 transition-transform">
            <X size={24} strokeWidth={3} />
          </button>
        </div>
        
        <div class="flex flex-col gap-2">
          <label class="font-mono text-xs font-bold opacity-50 uppercase" for="invite-email">EMAIL ADDRESS</label>
          <input 
            id="invite-email"
            type="email" 
            placeholder="user@company.com"
            bind:value={inviteEmail}
            class="neo-input" 
          />
        </div>

        <div class="bg-neo-blue/10 border-l-4 border-neo-blue p-4 font-mono text-[10px] text-neo-blue">
          NOTE: THE USER WILL RECEIVE AN ACTIVATION LINK TO GENERATE THEIR RSA KEYS LOCALLY.
        </div>

        <div class="flex gap-4">
          <button onclick={() => isInviting = false} class="flex-1 neo-button bg-[#2A2A2A]">{t.cancel}</button>
          <button onclick={handleInviteUser} class="flex-1 neo-button bg-neo-blue text-white">{t.inviteUser}</button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Detail Modal -->
  {#if selectedSecret}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neo-black/80 backdrop-blur-sm">
      <div class="bg-[#1E1E1E] neo-border neo-shadow-lg w-full max-w-2xl overflow-hidden">
        <div class="bg-neo-blue p-4 border-b-4 border-white flex justify-between items-center">
          <h2 class="text-white font-black text-xl uppercase tracking-tight flex items-center gap-2">
            <Lock size={20} />
            {isEditing ? `${t.edit}: ${selectedSecret.title}` : t.details}
          </h2>
          <button onclick={() => { selectedSecret = null; isEditing = false; }} class="text-white hover:rotate-90 transition-transform">
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        <div class="p-8 flex flex-col gap-6 max-h-[80vh] overflow-y-auto">
          {#if isEditing}
            <div class="flex flex-col gap-4">
              <div class="flex flex-col gap-1">
                <label class="font-mono text-xs font-bold opacity-50 uppercase" for="edit-title">TITLE</label>
                <input 
                  id="edit-title"
                  type="text" 
                  bind:value={editForm.title}
                  class="neo-input py-2 px-3 text-base" 
                />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col gap-1">
                  <label class="font-mono text-xs font-bold opacity-50 uppercase" for="edit-username">{t.username}</label>
                  <input 
                    id="edit-username"
                    type="text" 
                    bind:value={editForm.username}
                    class="neo-input py-2 px-3 text-base" 
                  />
                </div>
                <div class="flex flex-col gap-1">
                  <label class="font-mono text-xs font-bold opacity-50 uppercase" for="edit-url">{t.url}</label>
                  <input 
                    id="edit-url"
                    type="text" 
                    bind:value={editForm.url}
                    class="neo-input py-2 px-3 text-base" 
                  />
                </div>
              </div>
              <div class="flex flex-col gap-1">
                <label class="font-mono text-xs font-bold opacity-50 uppercase" for="edit-value">SECRET VALUE</label>
                <textarea 
                  id="edit-value"
                  bind:value={editForm.value}
                  rows={3} 
                  class="neo-input py-2 px-3 text-base resize-none" 
                />
              </div>
              <div class="flex flex-col gap-1">
                <label class="font-mono text-xs font-bold opacity-50 uppercase" for="edit-notes">{t.notes}</label>
                <textarea 
                  id="edit-notes"
                  bind:value={editForm.notes}
                  rows={2} 
                  class="neo-input py-2 px-3 text-base resize-none" 
                />
              </div>
              <div class="flex justify-end gap-4 mt-4">
                <button onclick={() => isEditing = false} class="neo-button bg-neo-gray">{t.cancel}</button>
                <button onclick={handleSaveEdit} class="neo-button bg-neo-blue text-white flex items-center gap-2">
                  <Save size={18} />
                  {t.save}
                </button>
              </div>
            </div>
          {:else}
            <div class="flex items-center justify-between">
              <div class="flex flex-col">
                <span class="text-neo-blue font-mono text-xs font-bold uppercase mb-1">{selectedSecret.type}</span>
                <h3 class="text-4xl font-black uppercase tracking-tighter">{selectedSecret.title}</h3>
              </div>
              <div class="flex gap-2">
                <button onclick={() => startEditing(selectedSecret!)} class="neo-button bg-neo-gray p-2">
                  <Edit2 size={20} />
                </button>
                <button onclick={() => handleDeleteSecret(selectedSecret!.id)} class="neo-button bg-red-500 text-white p-2">
                  <Trash2 size={20} />
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="flex flex-col gap-4">
                {#if selectedSecret.username}
                  <div class="flex flex-col gap-1">
                    <span class="font-mono text-[10px] font-bold opacity-50 uppercase flex items-center gap-1">
                      <UserIcon size={10} /> {t.username}
                    </span>
                    <div class="neo-border p-3 bg-neo-gray font-bold flex justify-between items-center group">
                      {selectedSecret.username}
                      <Copy size={14} class="opacity-0 group-hover:opacity-100 cursor-pointer" />
                    </div>
                  </div>
                {/if}
                {#if selectedSecret.url}
                  <div class="flex flex-col gap-1">
                    <span class="font-mono text-[10px] font-bold opacity-50 uppercase flex items-center gap-1">
                      <ExternalLink size={10} /> {t.url}
                    </span>
                    <a href={selectedSecret.url} target="_blank" rel="noreferrer" class="neo-border p-3 bg-neo-gray font-bold text-neo-blue underline flex justify-between items-center">
                      {selectedSecret.url}
                      <ChevronRight size={14} />
                    </a>
                  </div>
                {/if}
              </div>

              <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-1">
                  <span class="font-mono text-[10px] font-bold opacity-50 uppercase flex items-center gap-1">
                    <Hash size={10} /> {t.tags}
                  </span>
                  <div class="flex flex-wrap gap-2">
                    {#each selectedSecret.tags as tag}
                      <span class="bg-neo-black text-white text-[10px] px-2 py-1 neo-border">#{tag.toUpperCase()}</span>
                    {/each}
                  </div>
                </div>
                {#if selectedSecret.totpSecret}
                  <div class="flex flex-col gap-1">
                    <span class="font-mono text-[10px] font-bold opacity-50 uppercase flex items-center gap-1">
                      <Clock size={10} /> {t.totp}
                    </span>
                    <div class="neo-border p-3 bg-neo-black text-white font-mono text-2xl font-black text-center tracking-[0.5em] text-neo-blue">
                      {totpCodes[selectedSecret.id]}
                    </div>
                  </div>
                {/if}
              </div>
            </div>

            <div class="flex flex-col gap-1">
              <span class="font-mono text-[10px] font-bold opacity-50 uppercase">{t.details}</span>
              <div class="neo-border p-4 bg-neo-gray font-mono text-sm break-all whitespace-pre-wrap relative group">
                {revealingSecretId === selectedSecret.id ? selectedSecret.value : '********************************'}
                <button 
                  onclick={(e) => handleReveal(e, selectedSecret!.id)}
                  class="absolute right-4 top-4 bg-neo-black text-white p-2 neo-border hover:bg-neo-blue transition-colors"
                >
                  <Eye size={16} />
                </button>
              </div>
              {#if revealingSecretId === selectedSecret.id}
                <p class="text-[10px] font-mono text-neo-blue mt-1">
                  {t.autoLockMsg} {autoLockTimer}{t.seconds}
                </p>
              {/if}
            </div>

            {#if selectedSecret.notes}
              <div class="flex flex-col gap-1">
                <span class="font-mono text-[10px] font-bold opacity-50 uppercase">{t.notes}</span>
                <div class="neo-border p-4 bg-[#121212] italic text-sm">
                  {selectedSecret.notes}
                </div>
              </div>
            {/if}
          {/if}
        </div>
      </div>
    </div>
  {/if}

  <!-- Footer -->
  <footer class="h-10 bg-neo-black text-neo-white flex items-center px-6 justify-between font-mono text-[10px] uppercase tracking-widest">
    <div class="flex gap-6">
      <span>{t.status}: PEDROKALEB@GMAIL.COM</span>
      <span>VERSÃO: 1.0.4-STABLE</span>
    </div>
    <div class="flex gap-4">
      <span class="flex items-center gap-1">
        <div class="w-2 h-2 bg-green-500 rounded-full" />
        BRIDGE_OK
      </span>
      <span class="flex items-center gap-1">
        <div class="w-2 h-2 bg-green-500 rounded-full" />
        VAULT_SYNCED
      </span>
    </div>
  </footer>
</div>

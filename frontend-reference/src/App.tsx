import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Shield, 
  Plus, 
  Search, 
  Lock, 
  Key, 
  FileText, 
  Code, 
  Settings, 
  LogOut, 
  ChevronRight,
  Monitor,
  Eye,
  Copy,
  Folder,
  Users,
  Share2,
  X,
  Edit2,
  Save,
  Trash2,
  Tag,
  Clock,
  Moon,
  Sun,
  Globe,
  ExternalLink,
  User as UserIcon,
  Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as OTPAuth from 'otpauth';
import { MOCK_VAULTS, MOCK_SECRETS, MOCK_USERS, MOCK_AUDIT_LOGS } from './constants';
import { Secret, SecretType, User, AuditLog } from './types';

type View = 'VAULT' | 'ADMIN';

// --- Translations ---
const TRANSLATIONS = {
  en: {
    title: 'FORTIVAULT',
    newSecret: 'NEW SECRET',
    vaults: 'VAULTS',
    filters: 'FILTERS',
    searchPlaceholder: 'SEARCH SECRET (EX: AWS, GITHUB...)',
    emptyState: 'NO SECRET DETECTED IN THIS VAULT',
    reveal: 'REVELAR ON DESKTOP',
    revealing: 'EXPIRING...',
    edit: 'EDIT',
    save: 'SAVE',
    cancel: 'CANCEL',
    delete: 'DELETE',
    status: 'STATUS',
    connected: 'DESKTOP_CONNECTED',
    offline: 'OFFLINE',
    tags: 'TAGS',
    username: 'USERNAME',
    url: 'URL',
    notes: 'NOTES',
    totp: 'TOTP CODE',
    metadata: 'METADATA',
    details: 'SECRET DETAILS',
    autoLockMsg: 'Auto-locking in',
    seconds: 's',
    darkMode: 'DARK MODE',
    language: 'LANGUAGE',
    personal: 'Personal',
    department: 'Department',
    shared: 'Shared',
    allTags: 'ALL TAGS',
    admin: 'ADMINISTRATION',
    users: 'USERS',
    auditTrail: 'AUDIT TRAIL',
    inviteUser: 'INVITE USER',
    active: 'ACTIVE',
    pending: 'PENDING_KEY_EXCHANGE',
    deactivated: 'DEACTIVATED',
    groups: 'GROUPS',
    lastActive: 'LAST ACTIVE',
    publicKey: 'PUBLIC KEY',
    vaultView: 'VIEW VAULT',
    login: 'LOGIN',
    password: 'PASSWORD',
    masterPassword: 'MASTER PASSWORD',
    unlock: 'UNLOCK VAULT',
    loginTitle: 'SECURE ACCESS',
    loginSubtitle: 'ENTER YOUR MASTER PASSWORD TO DECRYPT THE VAULT',
    errorLogin: 'INVALID MASTER PASSWORD'
  },
  es: {
    title: 'FORTIVAULT',
    newSecret: 'NUEVO SECRETO',
    vaults: 'BOVEDAS',
    filters: 'FILTROS',
    searchPlaceholder: 'BUSCAR SECRETO (EJ: AWS, GITHUB...)',
    emptyState: 'NO SE DETECTÓ NINGÚN SECRETO EN ESTA BÓVEDA',
    reveal: 'REVELAR EN ESCRITORIO',
    revealing: 'EXPIRANDO...',
    edit: 'EDITAR',
    save: 'GUARDAR',
    cancel: 'CANCELAR',
    delete: 'ELIMINAR',
    status: 'ESTADO',
    connected: 'ESCRITORIO_CONECTADO',
    offline: 'DESCONECTADO',
    tags: 'ETIQUETAS',
    username: 'USUARIO',
    url: 'URL',
    notes: 'NOTAS',
    totp: 'CÓDIGO TOTP',
    metadata: 'METADATOS',
    details: 'DETALLES DEL SECRETO',
    autoLockMsg: 'Bloqueo automático en',
    seconds: 's',
    darkMode: 'MODO OSCURO',
    language: 'IDIOMA',
    personal: 'Personal',
    department: 'Departamento',
    shared: 'Compartido',
    allTags: 'TODAS LAS ETIQUETAS',
    admin: 'ADMINISTRACIÓN',
    users: 'USUARIOS',
    auditTrail: 'TRAZA DE AUDITORÍA',
    inviteUser: 'INVITAR USUARIO',
    active: 'ACTIVO',
    pending: 'PENDIENTE_KEY_EXCHANGE',
    deactivated: 'DESACTIVADO',
    groups: 'GRUPOS',
    lastActive: 'ÚLTIMA ACTIVIDAD',
    publicKey: 'LLAVE PÚBLICA',
    vaultView: 'VER BÓVEDA',
    login: 'INICIAR SESIÓN',
    password: 'CONTRASEÑA',
    masterPassword: 'CONTRASEÑA MAESTRA',
    unlock: 'DESBLOQUEAR BÓVEDA',
    loginTitle: 'ACCESO SEGURO',
    loginSubtitle: 'INGRESE SUA CONTRASEÑA MAESTRA PARA DESCRIPTAR LA BÓVEDA',
    errorLogin: 'CONTRASEÑA MAESTRA INVÁLIDA'
  },
  pt: {
    title: 'FORTIVAULT',
    newSecret: 'NOVO SEGREDO',
    vaults: 'COFRES',
    filters: 'FILTROS',
    searchPlaceholder: 'BUSCAR SEGREDO (EX: AWS, GITHUB...)',
    emptyState: 'NENHUM SEGREDO DETECTADO NESTE COFRE',
    reveal: 'REVELAR NO DESKTOP',
    revealing: 'EXPIRANDO...',
    edit: 'EDITAR',
    save: 'SALVAR',
    cancel: 'CANCELAR',
    delete: 'EXCLUIR',
    status: 'STATUS',
    connected: 'DESKTOP_CONECTADO',
    offline: 'OFFLINE',
    tags: 'TAGS',
    username: 'USUÁRIO',
    url: 'URL',
    notes: 'NOTAS',
    totp: 'CÓDIGO TOTP',
    metadata: 'METADADOS',
    details: 'DETALHES DO SEGREDO',
    autoLockMsg: 'Auto-bloqueio em',
    seconds: 's',
    darkMode: 'MODO ESCURO',
    language: 'IDIOMA',
    personal: 'Pessoal',
    department: 'Departamento',
    shared: 'Compartilhado',
    allTags: 'TODAS AS TAGS',
    admin: 'ADMINISTRAÇÃO',
    users: 'USUÁRIOS',
    auditTrail: 'TRILHA DE AUDITORIA',
    inviteUser: 'CONVIDAR USUÁRIO',
    active: 'ATIVO',
    pending: 'PENDENTE_KEY_EXCHANGE',
    deactivated: 'DESATIVADO',
    groups: 'GRUPOS',
    lastActive: 'ÚLTIMA ATIVIDADE',
    publicKey: 'CHAVE PÚBLICA',
    vaultView: 'VER COFRE',
    login: 'ENTRAR',
    password: 'SENHA',
    masterPassword: 'SENHA MESTRA',
    unlock: 'DESBLOQUEAR COFRE',
    loginTitle: 'ACESSO SEGURO',
    loginSubtitle: 'DIGITE SUA SENHA MESTRA PARA DESCRIPTOGRAFAR O COFRE',
    errorLogin: 'SENHA MESTRA INVÁLIDA'
  }
};

type Language = keyof typeof TRANSLATIONS;

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  const [secrets, setSecrets] = useState<Secret[]>(MOCK_SECRETS);
  const [activeVaultId, setActiveVaultId] = useState<string>('v1');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isDesktopConnected, setIsDesktopConnected] = useState(true);
  const [revealingSecretId, setRevealingSecretId] = useState<string | null>(null);
  const [autoLockTimer, setAutoLockTimer] = useState<number>(0);
  
  // UI State
  const [currentView, setCurrentView] = useState<View>('VAULT');
  const [selectedSecret, setSelectedSecret] = useState<Secret | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [language, setLanguage] = useState<Language>('pt');
  const [totpCodes, setTotpCodes] = useState<Record<string, string>>({});

  // Admin State
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(MOCK_AUDIT_LOGS);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  // Form State for Editing
  const [editForm, setEditForm] = useState<Partial<Secret>>({});

  const t = TRANSLATIONS[language];

  // --- Force Dark Mode ---
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);
  useEffect(() => {
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
      setTotpCodes(newCodes);
    };

    updateTOTP();
    const interval = setInterval(updateTOTP, 1000);
    return () => clearInterval(interval);
  }, [secrets]);

  // --- Auto-lock Logic ---
  useEffect(() => {
    let interval: any;
    if (revealingSecretId) {
      setAutoLockTimer(60);
      interval = setInterval(() => {
        setAutoLockTimer(prev => {
          if (prev <= 1) {
            setRevealingSecretId(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [revealingSecretId]);

  // --- Dark Mode Effect ---
  // Removed toggle logic, forced dark mode in initial useEffect.

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    secrets.forEach(s => s.tags.forEach(t => tags.add(t)));
    return Array.from(tags);
  }, [secrets]);

  const filteredSecrets = useMemo(() => {
    return secrets.filter(secret => {
      const matchesVault = secret.vaultId === activeVaultId;
      const matchesSearch = secret.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            secret.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            secret.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTag = !selectedTag || secret.tags.includes(selectedTag);
      return matchesVault && matchesSearch && matchesTag;
    });
  }, [activeVaultId, searchQuery, selectedTag, secrets]);

  const handleReveal = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!isDesktopConnected) return;
    setRevealingSecretId(id);
  };

  const startEditing = (secret: Secret) => {
    setEditForm({ ...secret });
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!editForm.id) return;
    
    setSecrets(prev => prev.map(s => s.id === editForm.id ? { ...s, ...editForm } as Secret : s));
    setSelectedSecret(prev => prev ? { ...prev, ...editForm } as Secret : null);
    setIsEditing(false);
  };

  const handleDeleteSecret = (id: string) => {
    setSecrets(prev => prev.filter(s => s.id !== id));
    setSelectedSecret(null);
  };

  const handleInviteUser = () => {
    if (!inviteEmail) return;
    const newUser: User = {
      id: `u${users.length + 1}`,
      email: inviteEmail,
      status: 'PENDING_KEY_EXCHANGE',
      groups: ['Default'],
      lastActive: 'Never'
    };
    setUsers([newUser, ...users]);
    setAuditLogs([{
      id: `l${auditLogs.length + 1}`,
      actor: 'pedrokalebdej1@gmail.com',
      action: 'INVITED',
      target: inviteEmail,
      timestamp: new Date().toISOString(),
      status: 'SUCCESS'
    }, ...auditLogs]);
    setInviteEmail('');
    setIsInviting(false);
  };

  const toggleLanguage = () => {
    const langs: Language[] = ['en', 'es', 'pt'];
    const nextIndex = (langs.indexOf(language) + 1) % langs.length;
    setLanguage(langs[nextIndex]);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real Zero-Knowledge app, this would be used to derive the decryption key
    if (masterPassword === 'fortivault2024') {
      setIsAuthenticated(true);
      setLoginError(false);
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 2000);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setMasterPassword('');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6 font-sans text-white">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md flex flex-col gap-8"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-neo-blue neo-border neo-shadow flex items-center justify-center">
              <Shield size={48} strokeWidth={3} className="text-white" />
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-center">FORTIVAULT</h1>
            <p className="font-mono text-neo-blue font-bold text-xs uppercase tracking-widest">Zero-Knowledge Secure Storage</p>
          </div>

          <form onSubmit={handleLogin} className="neo-card flex flex-col gap-6 p-8">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-black uppercase tracking-tight">{t.loginTitle}</h2>
              <p className="text-xs font-mono opacity-50">{t.loginSubtitle}</p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-mono text-[10px] font-bold uppercase opacity-50">{t.masterPassword}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                <input 
                  type="password" 
                  autoFocus
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  className={`w-full neo-input pl-12 ${loginError ? 'border-red-500 bg-red-500/10' : ''}`}
                  placeholder="••••••••••••"
                />
              </div>
              {loginError && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 font-mono text-[10px] font-bold"
                >
                  {t.errorLogin}
                </motion.p>
              )}
            </div>

            <button 
              type="submit"
              className="neo-button bg-neo-blue text-white py-4 text-lg flex items-center justify-center gap-2"
            >
              <Key size={20} strokeWidth={3} />
              {t.unlock}
            </button>

            <div className="flex justify-center gap-4 mt-2">
              <button 
                type="button"
                onClick={toggleLanguage} 
                className="text-[10px] font-mono font-bold opacity-50 hover:opacity-100 flex items-center gap-1"
              >
                <Globe size={12} />
                {language.toUpperCase()}
              </button>
            </div>
          </form>

          <p className="text-center font-mono text-[10px] opacity-30 uppercase tracking-[0.2em]">
            AES-256-GCM • RSA-4096 • ARGON2ID
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans text-neo-black dark:text-white">
      {/* Status Header */}
      <header className="h-16 bg-neo-gray dark:bg-[#1A1A1A] border-b-4 border-neo-black dark:border-white flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-2">
          <Shield className="text-neo-blue" size={28} strokeWidth={3} />
          <h1 className="font-mono font-black text-2xl tracking-tighter">{t.title}</h1>
        </div>

        <div className="flex items-center gap-4">
          <motion.div 
            animate={{ 
              backgroundColor: isDesktopConnected ? '#3B82F6' : '#4B5563',
              color: '#FFFFFF'
            }}
            className="neo-border px-4 py-1 font-mono font-bold text-sm flex items-center gap-2"
          >
            <Monitor size={16} />
            {t.status}: {isDesktopConnected ? t.connected : t.offline}
          </motion.div>
          
          <button 
            onClick={() => setCurrentView(currentView === 'VAULT' ? 'ADMIN' : 'VAULT')} 
            className="p-2 hover:bg-white/5 transition-colors neo-border flex items-center gap-2 font-bold font-mono text-xs bg-neo-black"
          >
            {currentView === 'VAULT' ? <Settings size={16} /> : <Lock size={16} />}
            {currentView === 'VAULT' ? t.admin : t.vaultView}
          </button>
          
          <button onClick={toggleLanguage} className="p-2 hover:bg-white/5 transition-colors neo-border flex items-center gap-2 font-bold font-mono text-xs">
            <Globe size={16} />
            {language.toUpperCase()}
          </button>

          <button onClick={handleLogout} className="p-2 hover:bg-white/5 transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 bg-neo-gray dark:bg-[#1A1A1A] border-r-4 border-neo-black dark:border-white flex flex-col p-6 gap-8 overflow-y-auto">
          <button className="bg-neo-blue text-neo-white neo-button neo-shadow flex items-center justify-center gap-2 py-4 text-lg hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg">
            <Plus size={24} strokeWidth={3} />
            {t.newSecret}
          </button>

          <nav className="flex flex-col gap-6">
            <div>
              <h2 className="font-mono text-xs font-bold text-black/50 dark:text-white/50 uppercase mb-4 tracking-widest">{t.vaults}</h2>
              <div className="flex flex-col gap-2">
                {MOCK_VAULTS.map(vault => (
                  <button
                    key={vault.id}
                    onClick={() => setActiveVaultId(vault.id)}
                    className={`flex items-center gap-3 p-3 font-bold transition-all border-2 ${
                      activeVaultId === vault.id 
                        ? 'bg-neo-blue text-neo-white border-neo-black dark:border-white shadow-neo-sm translate-x-[-2px] translate-y-[-2px]' 
                        : 'bg-white dark:bg-[#2A2A2A] border-transparent hover:border-neo-black dark:hover:border-white hover:translate-x-[-1px] hover:translate-y-[-1px]'
                    }`}
                  >
                    {vault.type === 'PERSONAL' && <Folder size={18} />}
                    {vault.type === 'DEPARTMENT' && <Users size={18} />}
                    {vault.type === 'SHARED' && <Share2 size={18} />}
                    {vault.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-mono text-xs font-bold text-black/50 dark:text-white/50 uppercase mb-4 tracking-widest">{t.tags}</h2>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setSelectedTag(null)}
                  className={`text-[10px] font-bold px-2 py-1 neo-border ${!selectedTag ? 'bg-neo-blue text-white' : 'bg-white dark:bg-[#2A2A2A]'}`}
                >
                  {t.allTags}
                </button>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`text-[10px] font-bold px-2 py-1 neo-border ${selectedTag === tag ? 'bg-neo-blue text-white' : 'bg-white dark:bg-[#2A2A2A]'}`}
                  >
                    #{tag.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-[#121212] p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto flex flex-col gap-8">
            {currentView === 'VAULT' ? (
              <>
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={24} />
                  <input
                    type="text"
                    placeholder={t.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full neo-input pl-14"
                  />
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <AnimatePresence mode="popLayout">
                    {filteredSecrets.length > 0 ? (
                      filteredSecrets.map(secret => (
                        <motion.div
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          key={secret.id}
                          onClick={() => setSelectedSecret(secret)}
                          className="neo-card flex flex-col gap-4 hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-neo-lg cursor-pointer group"
                        >
                          <div className="flex justify-between items-start">
                            <span className="bg-neo-blue text-neo-white font-mono text-xs px-2 py-1 border-2 border-white font-bold">
                              {secret.type}
                            </span>
                            <div className="flex gap-2">
                              {secret.tags.slice(0, 2).map(tag => (
                                <span key={tag} className="text-[10px] font-mono opacity-50">#{tag}</span>
                              ))}
                            </div>
                          </div>

                          <h3 className="text-2xl font-black uppercase tracking-tight leading-tight">
                            {secret.title}
                          </h3>

                          <div className="bg-[#2A2A2A] border-2 border-white p-3 font-mono text-sm relative overflow-hidden min-h-[3rem] flex items-center">
                            {revealingSecretId === secret.id ? (
                              <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-neo-blue font-bold break-all whitespace-pre-wrap w-full"
                              >
                                {secret.value}
                              </motion.div>
                            ) : (
                              <div className="text-white/30 tracking-widest truncate w-full">
                                ********************************
                              </div>
                            )}
                            
                            {revealingSecretId === secret.id && (
                              <motion.div 
                                initial={{ width: '100%' }}
                                animate={{ width: '0%' }}
                                transition={{ duration: 60, ease: 'linear' }}
                                className="absolute bottom-0 left-0 h-1 bg-neo-blue"
                              />
                            )}
                          </div>

                          {secret.type === 'LOGIN' && secret.totpSecret && (
                            <div className="flex items-center justify-between bg-neo-black text-white p-2 neo-border">
                              <span className="text-[10px] font-mono opacity-60">TOTP</span>
                              <span className="font-mono font-bold tracking-widest text-neo-blue">
                                {totpCodes[secret.id] || '------'}
                              </span>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <button 
                              onClick={(e) => handleReveal(e, secret.id)}
                              disabled={!isDesktopConnected}
                              className={`flex-1 py-3 font-bold transition-all flex items-center justify-center gap-2 ${
                                isDesktopConnected 
                                  ? 'bg-neo-black text-neo-white hover:bg-neo-blue' 
                                  : 'bg-gray-400 text-white cursor-not-allowed'
                              }`}
                            >
                              <Eye size={18} />
                              {revealingSecretId === secret.id ? `${t.revealing} (${autoLockTimer}s)` : t.reveal}
                            </button>
                            <button className="w-12 border-2 border-white flex items-center justify-center hover:bg-white/10 transition-colors">
                              <Copy size={18} />
                            </button>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="col-span-full py-20 flex flex-col items-center justify-center border-4 border-dashed border-white/20 rounded-xl">
                        <div className="w-32 h-32 border-2 border-white/10 flex items-center justify-center mb-6">
                          <Search size={48} className="text-white/10" />
                        </div>
                        <p className="font-mono font-bold text-white/40 text-center uppercase">
                          {t.emptyState}
                        </p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-8">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-5xl font-black uppercase tracking-tighter">{t.admin}</h2>
                    <p className="font-mono text-neo-blue font-bold">ZERO-KNOWLEDGE MANAGEMENT SYSTEM</p>
                  </div>
                  <button 
                    onClick={() => setIsInviting(true)}
                    className="neo-button bg-neo-blue text-white flex items-center gap-2 py-4 px-8 text-lg"
                  >
                    <Plus size={24} strokeWidth={3} />
                    {t.inviteUser}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* User List */}
                  <div className="lg:col-span-2 flex flex-col gap-4">
                    <h3 className="font-mono font-black text-xl border-b-4 border-white pb-2 flex items-center gap-2">
                      <Users size={20} /> {t.users}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {users.map(user => (
                        <div key={user.id} className="neo-card p-4 flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                              <span className="font-bold text-lg truncate max-w-[200px]">{user.email}</span>
                              <span className="font-mono text-[10px] opacity-50">ID: {user.id}</span>
                            </div>
                            <span className={`neo-badge ${
                              user.status === 'ACTIVE' ? 'bg-neo-blue text-white' : 
                              user.status === 'PENDING_KEY_EXCHANGE' ? 'bg-yellow-400 text-black' : 
                              'bg-red-500 text-white'
                            }`}>
                              {user.status === 'ACTIVE' ? t.active : t.pending}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-1">
                            {user.groups.map(g => (
                              <span key={g} className="text-[9px] font-mono border border-white/20 px-1">{g}</span>
                            ))}
                          </div>

                          <div className="mt-2 pt-2 border-t border-white/10 flex justify-between items-center text-[10px] font-mono">
                            <span className="opacity-50">{t.lastActive}:</span>
                            <span>{user.lastActive}</span>
                          </div>

                          {user.publicKey && (
                            <div className="bg-black p-2 neo-border flex items-center justify-between">
                              <span className="font-mono text-[8px] opacity-40">RSA_PUB_KEY</span>
                              <div className="flex gap-2">
                                <Copy size={12} className="cursor-pointer hover:text-neo-blue" />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Audit Trail */}
                  <div className="flex flex-col gap-4">
                    <h3 className="font-mono font-black text-xl border-b-4 border-white pb-2 flex items-center gap-2">
                      <FileText size={20} /> {t.auditTrail}
                    </h3>
                    <div className="bg-black neo-border p-4 font-mono text-[10px] h-[500px] overflow-y-auto flex flex-col gap-2">
                      {auditLogs.map(log => (
                        <div key={log.id} className="border-l-2 border-neo-blue pl-2 py-1">
                          <div className="flex justify-between text-neo-blue">
                            <span>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                            <span className={log.status === 'DENIED' ? 'text-red-500' : 'text-green-500'}>
                              [{log.status}]
                            </span>
                          </div>
                          <div className="mt-1">
                            <span className="text-white font-bold">{log.actor}</span>
                            <span className="mx-1 opacity-50">{log.action}</span>
                            <span className="text-neo-blue">{log.target}</span>
                          </div>
                        </div>
                      ))}
                      <div className="mt-auto pt-4 text-white/20 animate-pulse">
                        _ WAITING FOR EVENTS...
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {isInviting && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-neo-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-[#1E1E1E] neo-border neo-shadow-lg w-full max-w-md p-8 flex flex-col gap-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black uppercase tracking-tighter">{t.inviteUser}</h2>
                <button onClick={() => setIsInviting(false)} className="hover:rotate-90 transition-transform">
                  <X size={24} strokeWidth={3} />
                </button>
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs font-bold opacity-50 uppercase">EMAIL ADDRESS</label>
                <input 
                  type="email" 
                  placeholder="user@company.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="neo-input" 
                />
              </div>

              <div className="bg-neo-blue/10 border-l-4 border-neo-blue p-4 font-mono text-[10px] text-neo-blue">
                NOTE: THE USER WILL RECEIVE AN ACTIVATION LINK TO GENERATE THEIR RSA KEYS LOCALLY.
              </div>

              <div className="flex gap-4">
                <button onClick={() => setIsInviting(false)} className="flex-1 neo-button bg-[#2A2A2A]">{t.cancel}</button>
                <button onClick={handleInviteUser} className="flex-1 neo-button bg-neo-blue text-white">{t.inviteUser}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedSecret && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neo-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-neo-white dark:bg-[#1E1E1E] neo-border neo-shadow-lg w-full max-w-2xl overflow-hidden"
            >
              <div className="bg-neo-blue p-4 border-b-4 border-neo-black dark:border-white flex justify-between items-center">
                <h2 className="text-white font-black text-xl uppercase tracking-tight flex items-center gap-2">
                  <Lock size={20} />
                  {isEditing ? `${t.edit}: ${selectedSecret.title}` : t.details}
                </h2>
                <button onClick={() => { setSelectedSecret(null); setIsEditing(false); }} className="text-white hover:rotate-90 transition-transform">
                  <X size={24} strokeWidth={3} />
                </button>
              </div>

              <div className="p-8 flex flex-col gap-6 max-h-[80vh] overflow-y-auto">
                {isEditing ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-xs font-bold opacity-50 uppercase">TITLE</label>
                      <input 
                        type="text" 
                        value={editForm.title || ''} 
                        onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                        className="neo-input py-2 px-3 text-base" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="font-mono text-xs font-bold opacity-50 uppercase">{t.username}</label>
                        <input 
                          type="text" 
                          value={editForm.username || ''} 
                          onChange={e => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                          className="neo-input py-2 px-3 text-base" 
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-mono text-xs font-bold opacity-50 uppercase">{t.url}</label>
                        <input 
                          type="text" 
                          value={editForm.url || ''} 
                          onChange={e => setEditForm(prev => ({ ...prev, url: e.target.value }))}
                          className="neo-input py-2 px-3 text-base" 
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-xs font-bold opacity-50 uppercase">SECRET VALUE</label>
                      <textarea 
                        value={editForm.value || ''} 
                        onChange={e => setEditForm(prev => ({ ...prev, value: e.target.value }))}
                        rows={3} 
                        className="neo-input py-2 px-3 text-base resize-none" 
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-xs font-bold opacity-50 uppercase">{t.notes}</label>
                      <textarea 
                        value={editForm.notes || ''} 
                        onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                        rows={2} 
                        className="neo-input py-2 px-3 text-base resize-none" 
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-xs font-bold opacity-50 uppercase">{t.tags} (COMMA SEPARATED)</label>
                      <input 
                        type="text" 
                        value={editForm.tags?.join(', ') || ''} 
                        onChange={e => setEditForm(prev => ({ ...prev, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                        className="neo-input py-2 px-3 text-base" 
                      />
                    </div>
                    <div className="flex justify-end gap-4 mt-4">
                      <button onClick={() => setIsEditing(false)} className="neo-button bg-neo-gray dark:bg-[#2A2A2A]">{t.cancel}</button>
                      <button onClick={handleSaveEdit} className="neo-button bg-neo-blue text-white flex items-center gap-2">
                        <Save size={18} />
                        {t.save}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-neo-blue font-mono text-xs font-bold uppercase mb-1">{selectedSecret.type}</span>
                        <h3 className="text-4xl font-black uppercase tracking-tighter">{selectedSecret.title}</h3>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => startEditing(selectedSecret)} className="neo-button bg-neo-gray dark:bg-[#2A2A2A] p-2">
                          <Edit2 size={20} />
                        </button>
                        <button onClick={() => handleDeleteSecret(selectedSecret.id)} className="neo-button bg-red-500 text-white p-2">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="flex flex-col gap-4">
                        {selectedSecret.username && (
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-[10px] font-bold opacity-50 uppercase flex items-center gap-1">
                              <UserIcon size={10} /> {t.username}
                            </span>
                            <div className="neo-border p-3 bg-neo-gray dark:bg-[#2A2A2A] font-bold flex justify-between items-center group">
                              {selectedSecret.username}
                              <Copy size={14} className="opacity-0 group-hover:opacity-100 cursor-pointer" />
                            </div>
                          </div>
                        )}
                        {selectedSecret.url && (
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-[10px] font-bold opacity-50 uppercase flex items-center gap-1">
                              <ExternalLink size={10} /> {t.url}
                            </span>
                            <a href={selectedSecret.url} target="_blank" rel="noreferrer" className="neo-border p-3 bg-neo-gray dark:bg-[#2A2A2A] font-bold text-neo-blue underline flex justify-between items-center">
                              {selectedSecret.url}
                              <ChevronRight size={14} />
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-[10px] font-bold opacity-50 uppercase flex items-center gap-1">
                            <Hash size={10} /> {t.tags}
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {selectedSecret.tags.map(tag => (
                              <span key={tag} className="bg-neo-black text-white text-[10px] px-2 py-1 neo-border">#{tag.toUpperCase()}</span>
                            ))}
                          </div>
                        </div>
                        {selectedSecret.totpSecret && (
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-[10px] font-bold opacity-50 uppercase flex items-center gap-1">
                              <Clock size={10} /> {t.totp}
                            </span>
                            <div className="neo-border p-3 bg-neo-black text-white font-mono text-2xl font-black text-center tracking-[0.5em] text-neo-blue">
                              {totpCodes[selectedSecret.id]}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-[10px] font-bold opacity-50 uppercase">{t.details}</span>
                      <div className="neo-border p-4 bg-neo-gray dark:bg-[#2A2A2A] font-mono text-sm break-all whitespace-pre-wrap relative group">
                        {revealingSecretId === selectedSecret.id ? selectedSecret.value : '********************************'}
                        <button 
                          onClick={(e) => handleReveal(e, selectedSecret.id)}
                          className="absolute right-4 top-4 bg-neo-black text-white p-2 neo-border hover:bg-neo-blue transition-colors"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                      {revealingSecretId === selectedSecret.id && (
                        <p className="text-[10px] font-mono text-neo-blue mt-1">
                          {t.autoLockMsg} {autoLockTimer}{t.seconds}
                        </p>
                      )}
                    </div>

                    {selectedSecret.notes && (
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-[10px] font-bold opacity-50 uppercase">{t.notes}</span>
                        <div className="neo-border p-4 bg-neo-white dark:bg-[#121212] italic text-sm">
                          {selectedSecret.notes}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="h-10 bg-neo-black text-neo-white flex items-center px-6 justify-between font-mono text-[10px] uppercase tracking-widest">
        <div className="flex gap-6">
          <span>{t.status}: PEDROKALEB@GMAIL.COM</span>
          <span>VERSÃO: 1.0.4-STABLE</span>
        </div>
        <div className="flex gap-4">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            BRIDGE_OK
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            VAULT_SYNCED
          </span>
        </div>
      </footer>
    </div>
  );
}


# FortiVault 🛡️

**Gerenciador de Senhas Descentralizado e Seguro**

FortiVault é um gerenciador de senhas offline-first com sincronização P2P, autenticação de dois fatores (2FA) e criptografia avançada. Desenvolvido com Next.js 15 (frontend) e FastAPI (backend).

## 🌟 Principais Recursos

- **🔐 Criptografia Zero-Knowledge**: Suas senhas são criptografadas localmente usando algoritmos AES-256
- **🔒 Autenticação de Dois Fatores (2FA)**: Suporte completo a TOTP com códigos de backup
- **📱 PWA (Progressive Web App)**: Funciona offline e pode ser instalado como aplicativo
- **🌐 Sincronização P2P**: Sincronize entre dispositivos sem servidores centrais
- **📊 Análise de Segurança**: Detecta senhas fracas, duplicadas e compromissadas
- **💾 Backup Seguro**: Backups criptografados com recuperação fácil
- **🎨 Interface Moderna**: UI responsiva com suporte a modo escuro/claro
- **⚡ Offline-First**: Funciona completamente offline

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (Next.js 15)  │◄──►│   (FastAPI)     │◄──►│   (SQLite)      │
│                 │    │                 │    │                 │
│ • React 19      │    │ • Python 3.11+  │    │ • Encrypted     │
│ • TypeScript    │    │ • Cryptography  │    │ • Local Storage │
│ • Tailwind CSS  │    │ • JWT + 2FA     │    │ • Backups       │
│ • Shadcn/ui     │    │ • Argon2 Hash   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Início Rápido

### Pré-requisitos

- **Node.js 18+** e **pnpm** (frontend)
- **Python 3.11+** e **pip** (backend)
- **Git** para versionamento

### Instalação em 3 Passos

1. **Clone o repositório:**
```bash
git clone https://github.com/seu-usuario/FortiVault.git
cd FortiVault
```

2. **Configure o backend:**
```bash
cd backend
pip install -r requirements.txt
python main.py
```

3. **Configure o frontend:**
```bash
# Em outro terminal
pnpm install
pnpm dev
```

✅ **Pronto!** Acesse http://localhost:3000

## 📖 Documentação

- [📥 **Instalação Completa**](./installation.md) - Guia detalhado de instalação
- [⚙️ **Configuração**](./configuration.md) - Configurações avançadas
- [🔌 **API Reference**](./api-reference.md) - Documentação completa da API
- [🛠️ **Desenvolvimento**](./development.md) - Guia para desenvolvedores
- [❓ **Solução de Problemas**](./troubleshooting.md) - Problemas comuns e soluções
- [🔒 **Segurança**](./security.md) - Práticas de segurança e auditoria
- [🔄 **Deployment**](./deployment.md) - Guias de implantação

## 🛡️ Segurança

FortiVault implementa as melhores práticas de segurança:

- **Criptografia AES-256** para dados em repouso
- **Argon2** para hash de senhas
- **JWT com refresh tokens** para autenticação
- **TOTP 2FA** com códigos de backup
- **Headers de segurança** HTTP
- **Content Security Policy (CSP)**
- **Auditoria de segurança** automática

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, leia nosso [Guia de Contribuição](./contributing.md).

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](../LICENSE) para detalhes.

## 🆘 Suporte

- 🐛 **Issues**: [GitHub Issues](https://github.com/seu-usuario/FortiVault/issues)
- 💬 **Discussões**: [GitHub Discussions](https://github.com/seu-usuario/FortiVault/discussions)
- 📧 **Email**: suporte@fortivault.com

---

**Desenvolvido com ❤️ para manter suas senhas seguras**

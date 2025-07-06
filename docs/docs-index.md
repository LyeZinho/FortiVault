# 📚 Documentação FortiVault

Bem-vindo à documentação completa do FortiVault - Gerenciador de Senhas Descentralizado e Seguro.

## 📖 Índice de Documentação

### 🚀 Primeiros Passos
- [**README Principal**](./README.md) - Visão geral do projeto e início rápido
- [**📥 Instalação**](./installation.md) - Guia completo de instalação em diferentes ambientes
- [**⚙️ Configuração**](./configuration.md) - Configurações avançadas e personalização

### 🔧 Desenvolvimento
- [**🛠️ Desenvolvimento**](./development.md) - Guia completo para desenvolvedores
- [**🤝 Contribuição**](./contributing.md) - Como contribuir com o projeto
- [**🔌 API Reference**](./api-reference.md) - Documentação completa da API REST

### 🚀 Deploy e Produção
- [**🚀 Deployment**](./deployment.md) - Guias de deploy para diferentes ambientes
- [**🔒 Segurança**](./security.md) - Práticas de segurança e implementações

### 🆘 Suporte
- [**❓ Solução de Problemas**](./troubleshooting.md) - Problemas comuns e soluções

## 🎯 Guias por Persona

### 👤 Usuário Final
Se você quer apenas usar o FortiVault:
1. [Instalação](./installation.md) - Como instalar
2. [Configuração Básica](./configuration.md#configurações-de-interface) - Personalizar interface
3. [Solução de Problemas](./troubleshooting.md) - Se algo der errado

### 👨‍💻 Desenvolvedor
Se você quer contribuir ou modificar o FortiVault:
1. [Desenvolvimento](./development.md) - Configuração do ambiente
2. [API Reference](./api-reference.md) - Entender a API
3. [Contribuição](./contributing.md) - Como contribuir
4. [Segurança](./security.md) - Práticas de segurança

### 🚀 DevOps/SysAdmin
Se você quer fazer deploy em produção:
1. [Instalação](./installation.md) - Preparar ambiente
2. [Configuração](./configuration.md) - Configurações de produção
3. [Deployment](./deployment.md) - Deploy em diferentes ambientes
4. [Segurança](./security.md) - Configurações de segurança
5. [Solução de Problemas](./troubleshooting.md) - Diagnóstico e correções

## 🔍 Busca Rápida

### Por Funcionalidade

| Funcionalidade | Documentação |
|----------------|--------------|
| **Autenticação 2FA** | [API Reference](./api-reference.md#endpoints-de-2fa) \| [Segurança](./security.md#autenticação-de-dois-fatores-2fatotp) |
| **Backup/Restore** | [API Reference](./api-reference.md#endpoints-de-backup) \| [Configuração](./configuration.md#configurações-de-backup) |
| **Criptografia** | [Segurança](./security.md#implementações-de-criptografia) \| [Desenvolvimento](./development.md) |
| **Docker Deploy** | [Deployment](./deployment.md#deploy-com-docker) |
| **P2P Sync** | [API Reference](./api-reference.md#endpoints-de-sincronização) \| [Configuração](./configuration.md#configurações-de-sincronização-p2p) |
| **Rate Limiting** | [Segurança](./security.md#segurança-da-api) \| [API Reference](./api-reference.md#limitação-de-taxa-rate-limiting) |

### Por Tecnologia

| Tecnologia | Documentação |
|------------|--------------|
| **Next.js** | [Desenvolvimento](./development.md#frontend) \| [Deployment](./deployment.md) |
| **FastAPI** | [Desenvolvimento](./development.md#backend) \| [API Reference](./api-reference.md) |
| **Docker** | [Deployment](./deployment.md#deploy-com-docker) \| [Instalação](./installation.md#instalação-com-docker) |
| **SQLite** | [Configuração](./configuration.md#banco-de-dados) \| [Segurança](./security.md#segurança-do-banco-de-dados) |
| **TypeScript** | [Desenvolvimento](./development.md#typescriptjavascript) \| [Contribuição](./contributing.md) |
| **Python** | [Desenvolvimento](./development.md#python) \| [API Reference](./api-reference.md) |

### Por Ambiente

| Ambiente | Documentação |
|----------|--------------|
| **Desenvolvimento** | [Desenvolvimento](./development.md#configuração-do-ambiente-de-desenvolvimento) |
| **Docker** | [Deployment](./deployment.md#deploy-com-docker) |
| **AWS/Cloud** | [Deployment](./deployment.md#deploy-em-cloud-providers) |
| **Raspberry Pi** | [Deployment](./deployment.md#self-hosted-raspberry-pi) |
| **Desktop App** | [Deployment](./deployment.md#desktop-app-electron) |

## 📊 Status da Documentação

| Documento | Status | Última Atualização |
|-----------|--------|-------------------|
| README.md | ✅ Completo | 2024-07-06 |
| installation.md | ✅ Completo | 2024-07-06 |
| configuration.md | ✅ Completo | 2024-07-06 |
| api-reference.md | ✅ Completo | 2024-07-06 |
| development.md | ✅ Completo | 2024-07-06 |
| deployment.md | ✅ Completo | 2024-07-06 |
| security.md | ✅ Completo | 2024-07-06 |
| troubleshooting.md | ✅ Completo | 2024-07-06 |
| contributing.md | ✅ Completo | 2024-07-06 |

## 🔄 Atualizações da Documentação

### Como Contribuir

A documentação é mantida junto com o código. Para contribuir:

1. **Pequenas correções**: Edite diretamente no GitHub
2. **Grandes alterações**: Siga o [Guia de Contribuição](./contributing.md)
3. **Novos documentos**: Discuta primeiro nas [GitHub Discussions](https://github.com/seu-usuario/FortiVault/discussions)

### Padrões de Documentação

- **Formato**: Markdown (.md)
- **Estilo**: Claro, conciso e com exemplos
- **Emojis**: Use para melhor organização visual
- **Código**: Sempre com syntax highlighting
- **Links**: Preferencialmente relativos entre documentos

## 🌐 Documentação Online

Esta documentação também está disponível online:
- **GitHub Pages**: [https://seu-usuario.github.io/FortiVault](https://seu-usuario.github.io/FortiVault)
- **GitBook**: [https://fortivault.gitbook.io](https://fortivault.gitbook.io)

## 📱 Formatos Alternativos

### PDF
```bash
# Gerar PDF da documentação
pandoc docs/*.md -o FortiVault-Documentation.pdf
```

### EPUB
```bash
# Gerar EPUB para e-readers
pandoc docs/*.md -o FortiVault-Documentation.epub
```

### Site Estático
```bash
# Gerar site estático com MkDocs
mkdocs build
```

## ❓ Dúvidas Frequentes

### Como encontrar informações específicas?
1. Use o índice acima por funcionalidade/tecnologia
2. Use Ctrl+F para buscar na página
3. Consulte a [Solução de Problemas](./troubleshooting.md) para problemas comuns

### A documentação está desatualizada?
1. Verifique a data de última atualização
2. Abra uma [issue](https://github.com/seu-usuario/FortiVault/issues) reportando
3. Contribua com correções seguindo o [Guia de Contribuição](./contributing.md)

### Como sugerir melhorias na documentação?
1. Abra uma [GitHub Discussion](https://github.com/seu-usuario/FortiVault/discussions)
2. Abra uma [issue](https://github.com/seu-usuario/FortiVault/issues) com label "documentation"
3. Envie um Pull Request com melhorias

## 📞 Suporte

### Canais de Suporte

- 🐛 **Issues**: [GitHub Issues](https://github.com/seu-usuario/FortiVault/issues)
- 💬 **Discussões**: [GitHub Discussions](https://github.com/seu-usuario/FortiVault/discussions)
- 📧 **Email**: docs@fortivault.com
- 🔧 **Discord**: [Canal #docs](https://discord.gg/fortivault-docs)

### Tipos de Suporte

| Tipo | Canal Recomendado | Tempo de Resposta |
|------|------------------|-------------------|
| **Bug na documentação** | GitHub Issues | 1-2 dias |
| **Dúvida de uso** | GitHub Discussions | 1-3 dias |
| **Sugestão de melhoria** | GitHub Discussions | 3-7 dias |
| **Colaboração** | Discord | Imediato |

---

**📚 Documentação mantida com ❤️ pela comunidade FortiVault**

*Última atualização desta página: 6 de julho de 2025*

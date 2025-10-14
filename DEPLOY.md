git# 🚀 Deploy no Netlify - Semaninha

## **Configuração Necessária**

### **1. Variáveis de Ambiente no Netlify**

No painel do Netlify, vá em **Site settings > Environment variables** e adicione:

```
VITE_SPOTIFY_CLIENT_ID=sua_chave_spotify_aqui
VITE_SPOTIFY_CLIENT_SECRET=sua_chave_secreta_spotify_aqui
VITE_SPOTIFY_REDIRECT_URI=https://seu-site.netlify.app/
VITE_LASTFM_API_KEY=sua_chave_lastfm_aqui
```

**⚠️ IMPORTANTE:** O `VITE_SPOTIFY_REDIRECT_URI` deve ser o domínio real do seu site no Netlify!

### **2. Configuração do Build**

O arquivo `netlify.toml` já está configurado com:
- ✅ Comando de build: `npm run build`
- ✅ Pasta de publicação: `dist`
- ✅ Secrets scanning configurado
- ✅ Headers de segurança
- ✅ Redirects para SPA

### **3. Processo de Deploy**

1. **Conecte seu repositório** ao Netlify
2. **Configure as variáveis de ambiente** (passo 1)
3. **Deploy automático** será feito a cada push
4. **Verifique o build** no painel do Netlify

## **🔒 Segurança das Chaves**

- ✅ **NUNCA** commite arquivos `.env` no Git
- ✅ **SEMPRE** use variáveis de ambiente no Netlify
- ✅ **Verifique** se as chaves estão sendo usadas corretamente

## **📁 Estrutura de Arquivos**

```
semaninha/
├── netlify.toml          ← Configuração do Netlify
├── .gitignore            ← .env já está ignorado
├── DEPLOY.md             ← Este arquivo
└── src/
    └── services/
        ├── spotify.ts     ← Usa VITE_SPOTIFY_*
        └── lastfm.ts      ← Usa VITE_LASTFM_API_KEY
```

## **🚨 Solução de Problemas**

### **Erro de Secrets Scanning**
Se ainda aparecer erro de secrets:
1. Verifique se as variáveis estão configuradas no Netlify
2. Confirme que o arquivo `.env` não está no repositório
3. Use o arquivo `netlify.toml` para configurar o secrets scanning

### **Build Falhando**
1. Verifique se todas as dependências estão no `package.json`
2. Confirme se o Node.js 18+ está sendo usado
3. Verifique os logs de build no Netlify

## **✅ Checklist de Deploy**

- [ ] Variáveis de ambiente configuradas no Netlify
- [ ] Arquivo `.env` não está no repositório
- [ ] `netlify.toml` configurado corretamente
- [ ] Build local funcionando (`npm run build`)
- [ ] Deploy automático configurado

## **🔗 Links Úteis**

- [Netlify Docs](https://docs.netlify.com/)
- [Environment Variables](https://docs.netlify.com/environment-variables/get-started/)
- [Build Configuration](https://docs.netlify.com/configure-builds/overview/)

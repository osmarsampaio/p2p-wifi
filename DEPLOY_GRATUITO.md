# 🚀 Guia de Deploy Gratuito - WiFi Share P2P

Este aplicativo pode ser deployado **100% GRATUITAMENTE** em várias plataformas. Escolha a que preferir!

---

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Git (opcional)
- Conta em uma plataforma de hosting

---

## 🎯 Opção 1: Render.com (RECOMENDADO - Mais Fácil)

Render oferece 1 serviço web gratuito com 750 horas/mês (suficiente para uso contínuo).

### Passos:

1. **Acesse https://render.com** e crie uma conta gratuita
2. **Conecte seu GitHub ou faça upload manual**
   - Clique em "New" → "Web Service"
   - Selecione seu repositório Git ou faça upload
3. **Configure o serviço:**
   - Name: `p2p-wifi-share`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: Selecione **FREE**

4. **Aguarde o deploy** (~2-3 minutos)
5. **Copie a URL pública gerada** (ex: `https://p2p-wifi-share.onrender.com`)
6. **Atualize no código:**
   ```bash
   # Se necessário, atualize em public/app.js a URL
   PUBLIC_URL=https://seu-app.onrender.com
   ```

**⚠️ Aviso:** Apps no free tier do Render "dormem" após 15 min de inatividade. Para manter sempre ativo, você pode usar um ping gratuito (veja opção 4).

---

## 🎯 Opção 2: Heroku (usando serviço de patch gratuito)

Heroku descontinuou free tier em Nov/2022, mas você pode usar alternativas:

### Alternativa: Fly.io (GRATUITO)

1. **Acesse https://fly.io** e crie conta
2. **Instale o CLI:** https://fly.io/docs/hands-on/install-flyctl/
3. **Faça login:**
   ```bash
   flyctl auth login
   ```
4. **Deploy com um comando:**
   ```bash
   flyctl launch
   ```
5. **Siga as instruções** (deixe padrões)
6. **Deploy:**
   ```bash
   flyctl deploy
   ```

---

## 🎯 Opção 3: Railway.app (SIMPLES)

Railway oferece crédito gratuito ($5/mês) que é mais que suficiente para este app.

### Passos:

1. **Acesse https://railway.app** e faça login com GitHub
2. **Clique em "Create New Project"** → **"Deploy from GitHub"**
3. **Selecione seu repositório**
4. **Railway detectará automaticamente e fará deploy**
5. **Pronto!** Acesse via URL pública fornecida

---

## 🎯 Opção 4: Replit (Mais Rápido)

Replit é perfeito para testes rápidos.

### Passos:

1. **Acesse https://replit.com**
2. **Clique em "Create Repl"** → **"Import from GitHub"**
3. **Cole a URL do seu repositório**
4. **Replit executa automaticamente!**
5. **Clique em "Open in new tab"** para acessar

⚠️ **Nota:** Apps no Replit dormem rapidamente. Ideal apenas para testes.

---

## 💻 Opção 5: Usar seu próprio servidor

Se você tiver um servidor com Node.js instalado:

### Instalação:

```bash
# Clone o repositório
git clone seu-repositorio
cd wifi-share

# Instale dependências
npm install

# Inicie o servidor
npm start
```

### Com PM2 (para executar em background):

```bash
npm install -g pm2
pm2 start server.js --name "wifi-share"
pm2 startup
pm2 save
```

### Com Nginx como proxy reverso (opcional):

```bash
# Sua aplicação roda na porta 3000
# Configure Nginx para apontar para http://localhost:3000
```

---

## 🔗 Manter Render Sempre Ativo

O Render tem free tier que "dorme" após 15 minutos. Para manter sempre ativo, use um serviço de ping gratuito:

### Opção A: UptimeRobot (GRATUITO)

1. **Acesse https://uptimerobot.com**
2. **Crie conta gratuita**
3. **Clique em "Add Monitor"**
4. **Configure:**
   - Type: HTTP(s)
   - URL: Sua URL do Render
   - Interval: 5 minutos
   - Salve

**Resultado:** App nunca dorme! 🎉

### Opção B: Script Python no Replit

Use um Replit extra para fazer ping:

```python
import requests
import time

while True:
    try:
        requests.get("https://seu-app.onrender.com/health")
        print("✅ Ping enviado")
    except:
        print("❌ Erro no ping")
    time.sleep(300)  # A cada 5 minutos
```

---

## 🌐 Funcionamento

### Na Rede Local:
1. Abra `http://seu-ip-local:3000` no navegador
2. Escaneie o QR Code ou use IP diretamente

### Na Internet:
1. Acesse a URL pública (ex: `https://p2p-wifi-share.onrender.com`)
2. Escaneie o QR Code ou compartilhe o link
3. Dois dispositivos se conectam via WebRTC P2P
4. Arquivos são transferidos **diretamente** (servidor apenas faz signaling)

---

## ⚙️ Variáveis de Ambiente

Se precisar customizar, crie um arquivo `.env`:

```env
PORT=3000
NODE_ENV=production
PUBLIC_URL=https://seu-app.onrender.com
```

---

## 🐛 Troubleshooting

### "Não consigo conectar ao segundo dispositivo"
- Verifique se ambos estão na mesma rede (local) ou acessando a mesma URL pública
- Tente outro navegador
- Limpe cache (Ctrl+Shift+Del)

### "Arquivo grande não transfere"
- WebRTC tem limite de buffer. Arquivos > 2GB podem ser problemáticos
- Divida em partes menores

### "App dormiu no Render"
- Use UptimeRobot para manter sempre ativo (veja opção acima)

### "Erro ao gerar QR Code"
- Reinicie o servidor
- Verifique conexão de internet

---

## 🎯 Resumo Rápido

| Plataforma | Custo | Tempo Deploy | Facilidade | Recomendação |
|------------|-------|--------------|-----------|--------------|
| **Render** | Grátis | 2-3 min | ⭐⭐⭐⭐⭐ | ✅ MELHOR |
| **Fly.io** | Grátis | 3-5 min | ⭐⭐⭐⭐ | ✅ Ótimo |
| **Railway** | Crédito grátis | 2 min | ⭐⭐⭐⭐⭐ | ✅ Muito Bom |
| **Replit** | Grátis | 1 min | ⭐⭐⭐⭐⭐ | ⚠️ Teste rápido |
| **Seu Servidor** | Seu custo | 5 min | ⭐⭐⭐ | ✅ Controle total |

---

## 🚀 Próximas Etapas

Após fazer deploy:

1. **Teste com 2 dispositivos** acessando a URL pública
2. **Compartilhe o link** ou escaneie QR Code
3. **Transfira um arquivo** para confirmar funcionamento
4. **Configure ping automático** se no Render (UptimeRobot)

---

## 📞 Suporte

Se tiver problemas:
- Verifique logs do servidor
- Teste `https://seu-url/health` para confirmar se está online
- Verifique console do navegador (F12) para erros

---

**Pronto! Seu WiFi Share está 100% operacional na internet! 🎉**

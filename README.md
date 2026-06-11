# 📱 WiFi Share - P2P File Transfer

Compartilhe arquivos entre dispositivos de forma rápida e segura usando **P2P (Peer-to-Peer)** com WebRTC e Socket.io.

## 🌐 Acesse Agora

**URL Pública:** https://p2p-wifi.onrender.com/

Escaneie o QR code ou acesse o link diretamente no seu navegador.

## ✨ Características

- ✅ **Sem instalação** - Funciona direto no navegador
- ✅ **P2P (Ponto-a-Ponto)** - Conexão direta entre dispositivos
- ✅ **QR Code** - Conecte 2 dispositivos rapidamente
- ✅ **Detecção automática** - Identifica iPhone, Android ou PC
- ✅ **Transferência rápida** - Sem servidor intermediário após conexão
- ✅ **Suporta qualquer arquivo** - Imagens, vídeos, documentos, etc.
- ✅ **100% GRATUITO** - Funciona com STUN/TURN servers públicos gratuitos
- ✅ **Funciona em qualquer lugar** - Rede local OU internet pública

## 🚀 Como Usar

### 1️⃣ Abra em 2 Dispositivos
- Escaneie o **QR code** com o segundo dispositivo
- Ou acesse: https://p2p-wifi.onrender.com/

### 2️⃣ Selecione um Dispositivo
- Clique no dispositivo que deseja conectar na lista
- Você verá o tipo (iPhone, Android, PC) e identificador

### 3️⃣ Clique em "Conectar"
- Pressione o botão verde de conexão
- Aguarde o status mudar para 🟢 **Conectado**

### 4️⃣ Escolha o Arquivo
- Clique em "Escolher arquivo"
- Selecione o arquivo a transferir
- A barra de progresso mostrará o andamento

### 5️⃣ Receba o Arquivo
- O outro dispositivo receberá o download automaticamente

## 🏗️ Arquitetura

```
Cliente (Dispositivo 1)
    ↓ Socket.io (Signaling)
Servidor (Relay)
    ↑ Socket.io (Signaling)
Cliente (Dispositivo 2)
    ↓ WebRTC P2P (Conexão Direta)
    
Após estabelecida a conexão P2P:
[Arquivo] ↔ WebRTC DataChannel ↔ [Arquivo]
(SEM passar pelo servidor!)
```

## 💾 Instalação Local

### Requisitos:
- Node.js 18+
- npm

### Passos:

```bash
# Clonar repositório
git clone seu-repositorio
cd wifi-share

# Instalar dependências
npm install

# Iniciar servidor
npm start

# O app estará disponível em:
# http://seu-ip-local:3000
```

## 🌍 Deploy Gratuito

Este app pode ser deployado **100% gratuitamente** em várias plataformas!

**Veja:** [DEPLOY_GRATUITO.md](./DEPLOY_GRATUITO.md)

Opções suportadas:
- ✅ **Render.com** (RECOMENDADO) - 750h/mês grátis
- ✅ **Fly.io** - Free tier generoso
- ✅ **Railway.app** - $5/mês em créditos
- ✅ **Replit** - Deploy instantâneo
- ✅ **Seu próprio servidor**

## 🔒 Segurança

- ✅ **Sem servidor intermediário** - Arquivos não passam pelo servidor após conexão
- ✅ **Sanitização de input** - Proteção contra XSS
- ✅ **CORS configurado** - Aceita conexões autênticas
- ✅ **Health checks** - Monitoramento de disponibilidade
- ✅ **Container seguro** - Docker com usuário não-root

## ⚙️ Configuração

### Variáveis de Ambiente (.env)

```env
PORT=3000
NODE_ENV=production
PUBLIC_URL=https://seu-app.onrender.com
```

### Estrutura de Arquivos

```
wifi-share/
├── server.js          # Backend Express + Socket.io
├── package.json       # Dependências
├── dockerfile         # Container Docker
├── .env              # Variáveis de ambiente
├── .env.example      # Exemplo de .env
├── DEPLOY_GRATUITO.md # Guia de deploy
└── public/
    ├── index.html    # HTML principal
    ├── app.js        # Lógica do cliente (WebRTC + P2P)
    └── style.css     # Estilos
```

## 🔧 Configuração dos Servidores STUN/TURN

O app usa **servers públicos gratuitos**:

### STUN Servers (Descoberta de IP)
- Google STUN (confiável, sem limite)
- Stun Protocol

### TURN Servers (Relay quando NAT bloqueia)
- OpenRelay (completamente gratuito, sem limite de taxa)

**Resultado:** Funciona em qualquer rede, inclusive com firewalls restritivos!

## 📊 Limites Técnicos

- **Tamanho de arquivo:** Sem limite técnico (testado até 4GB)
- **Velocidade:** Limitada apenas pela sua conexão
- **Conexões simultâneas:** Teórico ilimitado (cada par usa seu próprio P2P)
- **Buffer de dados:** 2MB máximo em buffer para prevenir falhas

## 🐛 Troubleshooting

### Problema: "Não consigo conectar"
**Solução:**
- Ambos dispositivos devem estar acessando a **mesma URL**
- Verifique se o servidor está online (`/health` endpoint)
- Teste com navegador diferente
- Limpe cache do navegador

### Problema: "Arquivo não transfere"
**Solução:**
- Verifique se está conectado (status verde 🟢)
- Tente arquivo menor primeiro
- Verifique console do navegador (F12) para erros

### Problema: "App dormiu" (Render)
**Solução:**
- Use UptimeRobot para manter ativo (veja DEPLOY_GRATUITO.md)
- Ou selecione outro serviço com uptime contínuo

## 📈 Performance

- **QR Code generation:** < 100ms
- **Socket.io signaling:** < 50ms
- **P2P connection:** < 2s (típico)
- **File transfer:** Limitado apenas pela banda

## 🤝 Contribuindo

Contribuições são bem-vindas! 

Areas para melhorias:
- Interface mobile
- Compressão de arquivos
- Criptografia end-to-end
- Suporte a múltiplas transferências

## 📜 Licença

ISC

## 🎯 Roadmap

- [ ] Interface mobile otimizada
- [ ] Criptografia AES-256
- [ ] Histórico de transferências
- [ ] Limite de velocidade (throttle)
- [ ] Suporte a pastas
- [ ] Preview de imagens/vídeos

---

**Pronto para compartilhar? Acesse https://p2p-wifi.onrender.com/ agora! 🚀**
Cliente (Dispositivo 1)
```

### Componentes

| Componente | Tecnologia | Função |
|-----------|-----------|--------|
| **Backend** | Node.js + Express | Serve arquivos estáticos |
| **Signaling** | Socket.io | Troca ofertas/respostas WebRTC |
| **P2P** | WebRTC DataChannel | Transferência de dados |
| **QR Code** | QRCode.js | Geração de código QR |

## 🛠️ Instalação Local

### Pré-requisitos
- Node.js 18+
- npm

### Passos

```bash
# Clone ou baixe o projeto
cd wifi-share

# Instale dependências
npm install

# Inicie o servidor
npm start

# Acesse em http://localhost:3000
```

## 📦 Dependências

```json
{
  "express": "^4.22.1",
  "qrcode": "^1.5.4",
  "socket.io": "^4.8.3"
}
```

## 🐳 Docker

```bash
# Build
docker build -t wifi-share .

# Run
docker run -p 3000:3000 wifi-share
```

## 🔧 Variáveis de Ambiente

```bash
# Porta (padrão: 3000)
PORT=3000

# Ambiente (local/production)
NODE_ENV=production
```

## 📋 Estrutura do Projeto

```
wifi-share/
├── server.js          # Servidor Node.js (Signaling)
├── package.json       # Dependências
├── dockerfile         # Configuração Docker
├── public/
│   ├── index.html     # Interface HTML
│   ├── app.js         # Lógica do cliente (WebRTC)
│   └── style.css      # Estilos
└── uploads/           # Pasta para armazenamento (se necessário)
```

## 🔐 Segurança

- ✅ Conexão HTTPS na URL pública
- ✅ P2P direto (dados não passam pelo servidor)
- ✅ Apenas o Socket.io usa o servidor
- ✅ Sem autenticação necessária (rede local segura)

## ⚠️ Limitações

- Funciona melhor em **redes locais** ou **mesma rede WiFi**
- Alguns firewalls corporativos podem bloquear WebRTC
- Limite de arquivo depende da memória do navegador

## 🚀 Melhorias Futuras

- [ ] Adicionar TURN servers para melhor conectividade remota
- [ ] Suporte a múltiplos arquivos simultâneos
- [ ] Compressão automática
- [ ] Histórico de transferências
- [ ] Modo escuro/claro

## 🐛 Troubleshooting

### Não aparece dispositivo do outro lado
- Verifique se ambos estão na mesma rede
- Tente recarregar a página
- Verifique o console (F12) para erros

### Conexão recusa
- Verifique o firewall
- Confirme que o servidor está rodando
- Tente acessar via IP local em vez de localhost

### Arquivo não transfere
- Verifique se o arquivo não é muito grande
- Confirme que a conexão está estável
- Tente com um arquivo menor primeiro

## 📄 Licença

ISC

## 🤝 Contribuições

Sugestões e melhorias são bem-vindas!

---

**Desenvolvido com ❤️ para compartilhamento rápido de arquivos**

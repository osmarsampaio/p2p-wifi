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

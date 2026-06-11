# 🧪 Guia de Testes - WiFi Share P2P

## 📋 Testes Locais

### Preparação

```bash
# 1. Instale dependências
npm install

# 2. Inicie o servidor
npm start

# Você verá:
# 🚀 Servidor rodando na porta 3000
# 🌐 Acesso local: http://192.168.X.X:3000
```

### Teste 1: Conexão Local (2 dispositivos na mesma rede)

1. **Dispositivo 1 (PC):**
   - Abra `http://seu-ip-local:3000` (ex: http://192.168.1.5:3000)

2. **Dispositivo 2 (Celular/Tablet):**
   - Abra navegador
   - Digite `http://seu-ip-local:3000`
   - OU escaneie o QR Code

3. **Teste:**
   - Clique em "Conectar"
   - Aguarde status 🟢
   - Selecione um arquivo pequeno (1-10 MB)
   - Transfira para o outro dispositivo

### Teste 2: Loopback (2 abas do mesmo navegador)

```bash
# Útil para testes rápidos

1. Abra 2 abas em http://localhost:3000
2. Em cada aba, você verá uma como "PC (xxxxx)"
3. Clique "Conectar" em uma das abas
4. Aguarde conexão estabelecer
5. Envie um arquivo
```

### Teste 3: Conexão via Internet

Se estiver deployado (ex: Render):

1. **Dispositivo 1:**
   - Abra `https://seu-app.onrender.com`

2. **Dispositivo 2:**
   - Abra a mesma URL
   - Conecte normalmente

---

## 🔍 Debug

### Ver logs do servidor

```bash
# Terminal onde você rodou `npm start`
# Você verá:

✅ Dispositivo conectado: Android (abc12)
📨 Sinal offer de ab12 para c34de
📨 Sinal answer de c34de para ab12
✅ Conexão P2P estabelecida
```

### Ver logs do navegador (F12)

```javascript
// Abra DevTools (F12) → Console

// Você verá:
🔌 Conectando ao servidor WebSocket...
✅ Conectado ao servidor. Socket ID: abc123def...
🔨 Criando nova conexão P2P com: xyz789...
📝 Criando oferta SDP...
✅ Local description setada
```

### Endpoints para teste

```bash
# Health check
curl http://localhost:3000/health
# Resposta: {"status":"ok","timestamp":"...","environment":"development"}

# QR Code endpoint
curl http://localhost:3000/qrcode
# Resposta: {"qr":"data:image/png;base64,...","url":"http://..."}
```

---

## 📝 Casos de Teste

### Caso 1: Arquivo Pequeno (< 1 MB)
- [ ] Upload bem-sucedido
- [ ] Download bem-sucedido
- [ ] Progresso visível na barra
- [ ] Status muda para "Conectado" ✅

### Caso 2: Arquivo Médio (1-50 MB)
- [ ] Transferência não congela UI
- [ ] Progresso atualiza normalmente
- [ ] Arquivo baixa corretamente

### Caso 3: Arquivo Grande (50-500 MB)
- [ ] Não há erro de buffer
- [ ] Progressão é linear
- [ ] Reconexão automática (se desconectar)

### Caso 4: Tipos de Arquivo
- [ ] Imagem (.jpg, .png, .gif)
- [ ] Vídeo (.mp4, .avi)
- [ ] Áudio (.mp3, .wav)
- [ ] Documento (.pdf, .docx)
- [ ] Compactado (.zip, .rar, .7z)
- [ ] Texto (.txt, .json)

### Caso 5: Reconexão
- [ ] Fechar aba e reconectar
- [ ] Desligar WiFi e religar
- [ ] Mudar de rede (4G ↔ WiFi)
- [ ] Conexão deve ser re-estabelecida

### Caso 6: Múltiplos Dispositivos
- [ ] Conectar PC → Celular
- [ ] Conectar Celular → Celular
- [ ] Conectar PC → PC
- [ ] Todos devem funcionar

### Caso 7: Performance
- [ ] QR Code gerado em < 1 segundo
- [ ] Conexão estabelecida em < 3 segundos
- [ ] Transferência 1MB leva < 5 segundos (WiFi)

---

## 🐛 Troubleshooting durante testes

### "Não aparecem dispositivos"
```bash
# Verifique:
1. Ambos estão na mesma URL?
2. Network tab (F12) mostra conexão WebSocket?
3. Socket.io conectou? ("✅ Conectado" no console)
```

### "Arquivo não envia"
```bash
# Verifique:
1. Status mostra 🟢 Conectado?
2. DataChannel está aberto? (onopen foi chamado)
3. Arquivo está no limite de tamanho?
4. Console mostra mensagens de envio?
```

### "Reconexão não funciona"
```bash
# Verifique:
1. Limite de reconexão atingido (máx 5 tentativas)
2. Status mostra tentativas: "🔄 Reconectando..."
3. Aguarde 2-10 segundos entre tentativas (exponential backoff)
```

---

## 📊 Checklist Pré-Produção

- [ ] App funciona em rede local
- [ ] App funciona na internet (Render/Fly.io)
- [ ] QR Code funciona em ambos os casos
- [ ] Transferências funcionam em ambos os cenários
- [ ] Reconnection automática funciona
- [ ] Servidor mantém saúde (health check passa)
- [ ] Sem erros de segurança (CORS, XSS, etc)
- [ ] Performance é aceitável (< 3s para conectar)
- [ ] Logs são informativos e úteis

---

## 🚀 Teste de Carga

Para testar com muitos dispositivos conectados:

```javascript
// Abra console do navegador e execute:

for(let i = 0; i < 5; i++) {
    setTimeout(() => {
        window.open("https://seu-url.onrender.com", "_blank");
    }, i * 1000);
}

// Isso abre 5 abas simultaneamente
// Verifique se todos conectam sem problemas
```

---

## 📈 Métricas para Monitorar

1. **Taxa de sucesso de conexão:** > 95%
2. **Tempo médio de conexão:** < 3 segundos
3. **Taxa de erro de transferência:** < 1%
4. **Uptime:** > 99% (em produção)
5. **Tempo de resposta do health check:** < 100ms

---

**Pronto para testes? Execute `npm start` e comece! 🚀**

function getDevice() {
    const ua = navigator.userAgent
    if (/iphone/i.test(ua)) return "iPhone"
    if (/android/i.test(ua)) return "Android"
    return "PC"
}

const DEVICE_NAME_KEY = "p2pShareDeviceName"

function getStoredDeviceName() {
    try {
        return localStorage.getItem(DEVICE_NAME_KEY)
    } catch (e) {
        return null
    }
}

function storeDeviceName(name) {
    try {
        localStorage.setItem(DEVICE_NAME_KEY, name)
    } catch (e) {
        // localStorage indisponível (modo privado, etc.) — segue sem persistir
    }
}

// O socket só conecta de fato depois que a pessoa define um nome (ver bloco de nomeação no fim do arquivo)
const socket = io({ autoConnect: false })

socket.on("connect", () => {
    console.log("✅ Conectado ao servidor. Socket ID:", socket.id)
})

socket.on("disconnect", () => {
    console.log("❌ Desconectado do servidor")
    setStatus("🔴 Desconectado do servidor")
})

let selectedUser = null
let peerConnection
let dataChannel
let channelReady = false
let file
let iceCandidateQueue = []
let remoteDescriptionSet = false
let reconnectAttempts = 0
let maxReconnectAttempts = 5
let isInitiator = false // corrige bug: quem abriu a conexão original, e não "tem dataChannel"
window.fileReceiveState = null

// Gerar QR Code ao carregar
fetch("/qrcode")
.then(res => res.json())
.then(data => {
    document.getElementById("qr").src = data.qr
    document.getElementById("link").innerText = data.url
})

// Atualizar lista de usuários
socket.on("users", (users) => {
    const ul = document.getElementById("users")
    ul.innerHTML = ""
    users.forEach(u => {
        if (u.id === socket.id) return
        const li = document.createElement("li")
        li.innerText = u.device + " (" + u.id.slice(0,5) + ")"
        li.onclick = () => {
            document.querySelectorAll("li").forEach(el => el.classList.remove("selected"))
            li.classList.add("selected")
            selectedUser = u.id
        }
        ul.appendChild(li)
    })
})

const config = {
    iceServers: [
        // Google STUN servers (100% gratuito e confiável)
        { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" },
        
        // Stun Protocol (gratuito)
        { urls: "stun:stun.stunprotocol.org:3478" },
        
        // OpenRelay TURN (100% gratuito, sem limite de taxa)
        {
            urls: ["turn:openrelay.metered.ca:80", "turn:openrelay.metered.ca:443"],
            username: "openrelayproject",
            credential: "openrelayproject"
        },
        {
            urls: "turn:openrelay.metered.ca:80?transport=tcp",
            username: "openrelayproject",
            credential: "openrelayproject"
        },
        {
            urls: "turn:openrelay.metered.ca:443?transport=tcp",
            username: "openrelayproject",
            credential: "openrelayproject"
        }
    ],
    iceCandidatePoolSize: 10
}

// Tipos de arquivo permitidos (sem limite de tamanho)
const ALLOWED_FILE_TYPES = [
    'image/*',
    'video/*',
    'audio/*',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/*',
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/x-tar',
    'application/x-gzip'
]

function validateFileType(file) {
    // Verifica se o tipo de arquivo está na lista de permitidos
    const isAllowed = ALLOWED_FILE_TYPES.some(type => {
        if (type.endsWith('/*')) {
            const category = type.split('/*')[0]
            return file.type.startsWith(category)
        }
        return file.type === type
    })
    
    // Se não tiver tipo MIME (arquivos sem extensão ou desconhecidos), permite
    if (!file.type) {
        console.warn("⚠️ Arquivo sem tipo MIME detectado, permitindo por segurança")
        return true
    }
    
    return isAllowed
}

function createPeer(targetId) {
    console.log("🔨 Criando nova conexão P2P com:", targetId)
    
    peerConnection = new RTCPeerConnection(config)
    iceCandidateQueue = []
    remoteDescriptionSet = false
    
    // Monitorar estado da conexão
    peerConnection.onconnectionstatechange = () => {
        const state = peerConnection.connectionState
        console.log("📊 Estado da conexão:", state)
        
        if (state === "connected") {
            console.log("✅ Conexão P2P estabelecida")
            setStatus("🟢 Conectado")
            reconnectAttempts = 0 // Reset contador de reconexão
        } else if (state === "failed") {
            console.error("❌ Conexão falhou")
            setStatus("❌ Conexão falhou - tente novamente")
            // Tentar reconexão automática
            attemptReconnect()
        } else if (state === "disconnected") {
            setStatus("🔴 Desconectado")
            // Tentar reconexão automática
            attemptReconnect()
        }
    }
    
    // Monitorar estado do ICE
    peerConnection.oniceconnectionstatechange = () => {
        const state = peerConnection.iceConnectionState
        console.log("❄️ Estado ICE:", state)
    }
    
    // Enviar ICE candidates
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            console.log("🧊 ICE candidate encontrado:", event.candidate.candidate.split(" ")[7])
            socket.emit("signal", {
                to: targetId,
                type: "ice-candidate",
                candidate: event.candidate
            })
        } else {
            console.log("✅ ICE gathering completo")
        }
    }
    
    // Receber datachannel (para quem aceita)
    peerConnection.ondatachannel = (event) => {
        console.log("📥 DataChannel recebido:", event.channel.label)
        dataChannel = event.channel
        setupDataChannel()
    }
}

// Função de reconexão automática
function attemptReconnect() {
    if (reconnectAttempts >= maxReconnectAttempts) {
        console.error("❌ Máximo de tentativas de reconexão atingido")
        setStatus("❌ Não foi possível reconectar")
        return
    }
    
    reconnectAttempts++
    console.log(`🔄 Tentando reconectar (${reconnectAttempts}/${maxReconnectAttempts})...`)
    setStatus(`🔄 Reconectando... (${reconnectAttempts}/${maxReconnectAttempts})`)
    
    setTimeout(() => {
        if (selectedUser && peerConnection && peerConnection.connectionState !== "connected") {
            // Limpar conexão antiga
            if (peerConnection) {
                peerConnection.close()
            }
            
            // Criar nova conexão
            createPeer(selectedUser)
            
            // Se for o iniciador original (e não quem apenas recebeu o convite), recriar oferta
            if (isInitiator) {
                dataChannel = peerConnection.createDataChannel("file")
                setupDataChannel()
                
                peerConnection.createOffer({
                    offerToReceiveAudio: false,
                    offerToReceiveVideo: false
                }).then(offer => {
                    peerConnection.setLocalDescription(offer)
                    socket.emit("signal", {
                        to: selectedUser,
                        type: "offer",
                        sdp: offer
                    })
                }).catch(error => {
                    console.error("❌ Erro ao reconectar:", error)
                })
            }
        }
    }, 2000 * reconnectAttempts) // Exponential backoff
}

// Iniciar conexão (Lado que clica no botão)
document.getElementById("connectBtn").onclick = async () => {
    if (!selectedUser) return alert("Selecione um dispositivo")
    if (peerConnection && peerConnection.connectionState === "connected") {
        return alert("Já conectado a um dispositivo")
    }
    
    console.log("🚀 Iniciando conexão com:", selectedUser)
    setStatus("🟡 Conectando...")
    
    try {
        isInitiator = true
        createPeer(selectedUser)
        
        // Criar datachannel no iniciador
        dataChannel = peerConnection.createDataChannel("file")
        setupDataChannel()
        
        // Criar oferta
        console.log("📝 Criando oferta SDP...")
        const offer = await peerConnection.createOffer({
            offerToReceiveAudio: false,
            offerToReceiveVideo: false
        })
        
        await peerConnection.setLocalDescription(offer)
        console.log("✅ Local description setada")
        
        // Enviar oferta
        console.log("📤 Enviando oferta ao servidor...")
        socket.emit("signal", {
            to: selectedUser,
            type: "offer",
            sdp: offer
        })
    } catch (error) {
        console.error("❌ Erro ao iniciar:", error)
        setStatus("❌ Erro: " + error.message)
    }
}

// Processar ICE candidates enfileirados
async function processIceCandidateQueue() {
    while (iceCandidateQueue.length > 0 && remoteDescriptionSet) {
        const candidate = iceCandidateQueue.shift()
        try {
            await peerConnection.addIceCandidate(candidate)
            console.log("✅ ICE candidate adicionado")
        } catch (error) {
            console.warn("⚠️ Erro ao adicionar ICE:", error)
        }
    }
}

// Receber oferta
socket.on("signal", async (data) => {
    console.log("📨 Sinal recebido:", data.type)
    
    if (data.type === "offer") {
        console.log("📥 Oferta recebida de:", data.from)
        selectedUser = data.from
        isInitiator = false
        setStatus("🟡 Conectando...")
        
        try {
            createPeer(data.from)
            
            // Settar remote description da oferta
            console.log("📝 Processando oferta...")
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp))
            remoteDescriptionSet = true
            console.log("✅ Remote description setada (oferta)")
            
            // Processar ICE candidates que chegaram antes
            await processIceCandidateQueue()
            
            // Criar resposta
            console.log("📝 Criando resposta...")
            const answer = await peerConnection.createAnswer()
            await peerConnection.setLocalDescription(answer)
            console.log("✅ Local description setada (resposta)")
            
            // Enviar resposta
            console.log("📤 Enviando resposta...")
            socket.emit("signal", {
                to: data.from,
                type: "answer",
                sdp: answer
            })
        } catch (error) {
            console.error("❌ Erro ao processar oferta:", error)
            setStatus("❌ Erro: " + error.message)
        }
    }
    
    else if (data.type === "answer") {
        console.log("📥 Resposta recebida")
        
        try {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp))
            remoteDescriptionSet = true
            console.log("✅ Remote description setada (resposta)")
            
            // Processar ICE candidates enfileirados
            await processIceCandidateQueue()
        } catch (error) {
            console.error("❌ Erro ao processar resposta:", error)
            setStatus("❌ Erro: " + error.message)
        }
    }
    
    else if (data.type === "ice-candidate" && peerConnection) {
        try {
            if (remoteDescriptionSet) {
                await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate))
                console.log("✅ ICE candidate adicionado imediatamente")
            } else {
                iceCandidateQueue.push(new RTCIceCandidate(data.candidate))
                console.log("📋 ICE candidate enfileirado (aguardando remote description)")
            }
        } catch (error) {
            console.warn("⚠️ Erro ao processar ICE:", error)
        }
    }
})

function setStatus(text) {
    document.getElementById("status").innerText = text
    console.log("📌 Status:", text)
}

function setupDataChannel() {
    if (!dataChannel) return
    
    dataChannel.binaryType = "arraybuffer"
    
    dataChannel.onopen = () => {
        channelReady = true
        console.log("✅ DataChannel aberto - pronto para enviar")
        setStatus("🟢 Conectado")
        document.getElementById("fileInput").disabled = false
    }
    
    dataChannel.onclose = () => {
        channelReady = false
        console.log("❌ DataChannel fechado")
        setStatus("🔴 Desconectado")
        document.getElementById("fileInput").disabled = true
    }
    
    dataChannel.onerror = (error) => {
        console.error("❌ Erro no DataChannel:", error)
        setStatus("❌ Erro: " + error.message)
    }
    
    dataChannel.onmessage = (event) => {
        if (typeof event.data === "string") {
            const msg = JSON.parse(event.data)
            
            if (msg.type === "meta") {
                console.log("📥 Meta recebida:", msg.name, msg.size, "bytes")
                window.fileReceiveState = {
                    fileName: msg.name,
                    fileSize: msg.size,
                    chunks: [],
                    receivedSize: 0
                }
            } else if (msg.type === "end") {
                finishFileDownload()
            }
            return
        }
        
        // Receber chunks do arquivo
        if (window.fileReceiveState) {
            window.fileReceiveState.chunks.push(event.data)
            window.fileReceiveState.receivedSize += event.data.byteLength
            const progress = (window.fileReceiveState.receivedSize / window.fileReceiveState.fileSize) * 100
            document.getElementById("progress").value = progress
            console.log("📥 Recebido:", progress.toFixed(1) + "%")
        }
    }
}

function finishFileDownload() {
    if (!window.fileReceiveState) return
    
    const { fileName, chunks } = window.fileReceiveState
    const blob = new Blob(chunks)
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
    
    setStatus("🟢 Download concluído: " + fileName)
    console.log("✅ Arquivo baixado com sucesso")
    document.getElementById("progress").value = 0
}

document.getElementById("fileInput").addEventListener("change", async () => {
    if (!channelReady) return alert("Conecte primeiro")
    
    file = document.getElementById("fileInput").files[0]
    if (!file) return
    
    // Validar tipo de arquivo
    if (!validateFileType(file)) {
        alert("Tipo de arquivo não permitido. Tipos permitidos: imagens, vídeos, áudio, documentos PDF, Office, texto e arquivos compactados.")
        document.getElementById("fileInput").value = ""
        return
    }
    
    try {
        console.log("📤 Iniciando envio de arquivo:", file.name, file.size, "bytes")
        
        // Enviar metadados
        dataChannel.send(JSON.stringify({
            type: "meta",
            name: file.name,
            size: file.size
        }))
        
        // Enviar arquivo em chunks
        const chunkSize = 64 * 1024 // 64KB chunks
        let offset = 0
        
        const sendChunk = () => {
            if (offset >= file.size) {
                dataChannel.send(JSON.stringify({ type: "end" }))
                setStatus("🟢 Arquivo enviado com sucesso")
                document.getElementById("progress").value = 0
                document.getElementById("fileInput").value = ""
                console.log("✅ Transferência concluída")
                return
            }
            
            const chunk = file.slice(offset, offset + chunkSize)
            const reader = new FileReader()
            
            reader.onload = (e) => {
                dataChannel.send(e.target.result)
                offset += chunkSize
                const progress = (offset / file.size) * 100
                document.getElementById("progress").value = Math.min(progress, 100)
                
                // Enviar próximo chunk se buffer não está muito cheio
                if (dataChannel.bufferedAmount < 2 * 1024 * 1024) {
                    sendChunk()
                } else {
                    setTimeout(sendChunk, 100)
                }
            }
            
            reader.readAsArrayBuffer(chunk)
        }
        
        sendChunk()
    } catch (error) {
        console.error("❌ Erro ao enviar arquivo:", error)
        setStatus("❌ Erro: " + error.message)
    }
})

console.log("✅ App.js carregado com sucesso")

// ============================================================
// Nomeação do dispositivo — precisa acontecer antes de conectar
// ============================================================
function startSession(name) {
    const modal = document.getElementById("nameModal")
    if (modal) modal.setAttribute("aria-hidden", "true")

    const currentNameEl = document.getElementById("currentDeviceName")
    if (currentNameEl) currentNameEl.textContent = name

    console.log("🔌 Conectando ao servidor WebSocket como:", name)
    socket.io.opts.query = { device: name }
    socket.connect()
}

function openNameModal(prefill) {
    const modal = document.getElementById("nameModal")
    const input = document.getElementById("nameInput")
    if (!modal || !input) return
    input.value = ""
    input.placeholder = prefill ? `Ex: ${prefill} da Ana` : "Como você quer ser visto?"
    modal.setAttribute("aria-hidden", "false")
    setTimeout(() => input.focus(), 50)
}

const nameForm = document.getElementById("nameForm")
if (nameForm) {
    nameForm.addEventListener("submit", (event) => {
        event.preventDefault()
        const input = document.getElementById("nameInput")
        const value = (input.value || "").trim().slice(0, 30) || getDevice()
        storeDeviceName(value)
        startSession(value)
    })
}

const editNameBtn = document.getElementById("editNameBtn")
if (editNameBtn) {
    editNameBtn.addEventListener("click", () => {
        openNameModal(getDevice())
    })
}

const existingName = getStoredDeviceName()
if (existingName) {
    startSession(existingName)
} else {
    openNameModal(getDevice())
}

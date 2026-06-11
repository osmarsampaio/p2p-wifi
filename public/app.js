function getDevice() {
    const ua = navigator.userAgent
    if (/iphone/i.test(ua)) return "iPhone"
    if (/android/i.test(ua)) return "Android"
    return "PC"
}

const socket = io({
    query: { device: getDevice() }
})

console.log("🔌 Conectando ao servidor WebSocket...")
socket.on("connect", () => {
    console.log("✅ Conectado ao servidor. Socket ID:", socket.id)
})

socket.on("disconnect", () => {
    console.log("❌ Desconectado do servidor")
})

let selectedUser = null
let peerConnection
let dataChannel
let channelReady = false
let file

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
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" },
        {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject"
        },
        {
            urls: "turn:openrelay.metered.ca:443",
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
    ]
}

function createPeer(targetId) {
    peerConnection = new RTCPeerConnection(config)

    // Monitorar estado da conexão
    peerConnection.onconnectionstatechange = () => {
        const state = peerConnection.connectionState
        console.log("Estado da conexão:", state)
        if (state === "failed") {
            setStatus("❌ Conexão falhou, tentando reconectar...")
            setTimeout(() => {
                peerConnection.close()
                createPeer(targetId)
            }, 2000)
        }
    }

    // Monitorar ICE candidates
    peerConnection.onicecandidate = e => {
        if (e.candidate) {
            console.log("ICE candidate encontrado:", e.candidate.candidate)
            socket.emit("ice-candidate", {
                to: targetId,
                candidate: e.candidate
            })
        } else {
            console.log("ICE gathering completo")
        }
    }

    peerConnection.ondatachannel = e => {
        dataChannel = e.channel
        setupChannel(dataChannel)
    }

    // Timeout de 30 segundos
    const timeout = setTimeout(() => {
        if (!channelReady) {
            setStatus("⏱️ Timeout - Verifique a conexão e tente novamente")
            console.error("Conexão P2P expirou após 30 segundos")
        }
    }, 30000)

    // Limpar timeout quando conectar
    peerConnection.ondatachannel = (e) => {
        clearTimeout(timeout)
        dataChannel = e.channel
        setupChannel(dataChannel)
    }
}

// Iniciar conexão (Lado que envia)
document.getElementById("connectBtn").onclick = async () => {
    if (!selectedUser) return alert("Selecione um dispositivo")

    setStatus("🟡 Conectando...")
    console.log("🔗 Iniciando conexão P2P com:", selectedUser)

    try {
        createPeer(selectedUser)
        dataChannel = peerConnection.createDataChannel("file")
        setupChannel(dataChannel)

        const offer = await peerConnection.createOffer()
        await peerConnection.setLocalDescription(offer)

        console.log("📤 Enviando oferta...")
        socket.emit("offer", { to: selectedUser, offer })
    } catch (error) {
        setStatus("❌ Erro ao criar oferta: " + error.message)
        console.error("Erro:", error)
    }
}

// Receber oferta (Lado que aceita)
socket.on("offer", async (data) => {
    console.log("📥 Oferta recebida de:", data.from)
    selectedUser = data.from // Define quem enviou a oferta como alvo
    setStatus("🟡 Conectando...")
    
    try {
        createPeer(data.from)
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer))
        const answer = await peerConnection.createAnswer()
        await peerConnection.setLocalDescription(answer)

        console.log("📤 Enviando resposta...")
        socket.emit("answer", { to: data.from, answer })
    } catch (error) {
        console.error("Erro ao processar oferta:", error)
        setStatus("❌ Erro ao processar oferta: " + error.message)
    }
})

socket.on("answer", async (data) => {
    console.log("📥 Resposta recebida")
    try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer))
        console.log("✅ Resposta processada")
    } catch (error) {
        console.error("Erro ao processar resposta:", error)
        setStatus("❌ Erro ao processar resposta: " + error.message)
    }
})

socket.on("ice-candidate", async (data) => {
    if (data.candidate && peerConnection) {
        try {
            await peerConnection.addIceCandidate(data.candidate)
        } catch (e) { 
            console.warn("Erro ao adicionar ICE candidate:", e)
        }
    }
})

function setStatus(text) {
    document.getElementById("status").innerText = text
}

function setupChannel(channel) {
    channel.binaryType = "arraybuffer"
    let received = []
    let receivedSize = 0
    let fileSize = 0
    let fileName = ""

    channel.onopen = () => {
        channelReady = true
        setStatus("🟢 Conectado")
        document.getElementById("fileInput").disabled = false
        console.log("✅ DataChannel aberto")
    }

    channel.onclose = () => {
        channelReady = false
        setStatus("🔴 Desconectado")
        document.getElementById("fileInput").disabled = true
        console.log("❌ DataChannel fechado")
    }

    channel.onerror = (error) => {
        console.error("❌ Erro no DataChannel:", error)
        setStatus("❌ Erro na conexão: " + error.message)
    }

    channel.onmessage = async (e) => {
        if (typeof e.data === "string") {
            const msg = JSON.parse(e.data)
            if (msg.type === "meta") {
                fileName = msg.name
                fileSize = msg.size
                received = []
                receivedSize = 0
                console.log("📥 Recebendo arquivo:", fileName, fileSize, "bytes")
            }
            if (msg.type === "end") {
                const blob = new Blob(received)
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = fileName
                a.click()
                setStatus("🟢 Download concluído: " + fileName)
                console.log("✅ Arquivo recebido com sucesso")
            }
            return
        }
        received.push(e.data)
        receivedSize += e.data.byteLength
        document.getElementById("progress").value = (receivedSize / fileSize) * 100
    }
}

document.getElementById("fileInput").addEventListener("change", () => {
    if (!channelReady) return alert("Conecte primeiro")
    file = document.getElementById("fileInput").files[0]
    if (!file) return

    dataChannel.send(JSON.stringify({ type: "meta", name: file.name, size: file.size }))
    sendFile()
})

function sendFile() {
    const chunkSize = 16 * 1024 // 16kb para maior estabilidade
    let offset = 0

    function sendChunk() {
        while (offset < file.size && dataChannel.bufferedAmount < 1024 * 1024) {
            const slice = file.slice(offset, offset + chunkSize)
            const reader = new FileReader()
            reader.onload = (e) => {
                dataChannel.send(e.target.result)
                offset += slice.size
                document.getElementById("progress").value = (offset / file.size) * 100
                if (offset >= file.size) {
                    dataChannel.send(JSON.stringify({ type: "end" }))
                } else {
                    sendChunk()
                }
            };
            reader.readAsArrayBuffer(slice)
            return
        }
        if (offset < file.size) setTimeout(sendChunk, 10)
    }
    sendChunk()
}
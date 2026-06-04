function getDevice() {
    const ua = navigator.userAgent
    if (/iphone/i.test(ua)) return "iPhone"
    if (/android/i.test(ua)) return "Android"
    return "PC"
}

const socket = io({
    query: { device: getDevice() }
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
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
}

function createPeer(targetId) {
    peerConnection = new RTCPeerConnection(config)

    peerConnection.onicecandidate = e => {
        if (e.candidate) {
            socket.emit("ice-candidate", {
                to: targetId,
                candidate: e.candidate
            })
        }
    }

    peerConnection.ondatachannel = e => {
        dataChannel = e.channel
        setupChannel(dataChannel)
    }
}

// Iniciar conexão (Lado que envia)
document.getElementById("connectBtn").onclick = async () => {
    if (!selectedUser) return alert("Selecione um dispositivo")

    createPeer(selectedUser)
    dataChannel = peerConnection.createDataChannel("file")
    setupChannel(dataChannel)

    const offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)

    socket.emit("offer", { to: selectedUser, offer })
    setStatus("🟡 Conectando...")
}

// Receber oferta (Lado que aceita)
socket.on("offer", async (data) => {
    selectedUser = data.from // Define quem enviou a oferta como alvo
    createPeer(data.from)

    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer))
    const answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)

    socket.emit("answer", { to: data.from, answer })
})

socket.on("answer", async (data) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer))
})

socket.on("ice-candidate", async (data) => {
    if (data.candidate && peerConnection) {
        try {
            await peerConnection.addIceCandidate(data.candidate)
        } catch (e) { console.error("Erro ICE:", e) }
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
    }

    channel.onmessage = async (e) => {
        if (typeof e.data === "string") {
            const msg = JSON.parse(e.data)
            if (msg.type === "meta") {
                fileName = msg.name
                fileSize = msg.size
                received = []
                receivedSize = 0
            }
            if (msg.type === "end") {
                const blob = new Blob(received)
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = fileName
                a.click()
                setStatus("🟢 Download concluído")
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
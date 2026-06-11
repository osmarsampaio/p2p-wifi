const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const QRCode = require("qrcode")
const os = require("os")

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: [
            "https://p2p-wifi.onrender.com",
            "http://localhost:3000",
            "http://localhost",
            /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/,
            /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/
        ],
        methods: ["GET", "POST"]
    }
})

app.use(express.static("public"))

let users = []

function getLocalIP() {
    const nets = os.networkInterfaces()
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === "IPv4" && !net.internal) {
                return net.address
            }
        }
    }
}

app.get("/qrcode", async (req, res) => {
    let url
    
    // Se está no Render (detecta pela host do request)
    if (req.get("host").includes("onrender.com") || process.env.NODE_ENV === "production") {
        url = `https://p2p-wifi.onrender.com/`
    } else {
        // Uso local
        const ip = getLocalIP()
        url = `http://${ip}:3000`
    }
    
    const qr = await QRCode.toDataURL(url)
    res.json({ qr, url })
})

io.on("connection", (socket) => {
    const device = socket.handshake.query.device || "Desconhecido"
    users.push({ id: socket.id, device })
    
    console.log(`✅ Dispositivo conectado: ${device} (${socket.id.slice(0, 5)})`)
    
    // Notifica todos os usuários sobre a nova lista
    io.emit("users", users)

    socket.on("disconnect", () => {
        users = users.filter(u => u.id !== socket.id)
        console.log(`❌ Dispositivo desconectado: ${socket.id.slice(0, 5)}`)
        io.emit("users", users)
    })

    // Sistema de signaling unificado
    socket.on("signal", (data) => {
        console.log(`📨 Sinal ${data.type} de ${socket.id.slice(0, 5)} para ${data.to.slice(0, 5)}`)
        
        // Retransmitir para o outro dispositivo
        io.to(data.to).emit("signal", {
            type: data.type,
            from: socket.id,
            sdp: data.sdp,
            candidate: data.candidate
        })
    })

    // Manter compatibilidade com eventos antigos
    socket.on("offer", (data) => {
        console.log(`📤 Oferta de ${socket.id.slice(0, 5)} para ${data.to.slice(0, 5)}`)
        io.to(data.to).emit("offer", {
            offer: data.offer,
            from: socket.id
        })
    })

    socket.on("answer", (data) => {
        console.log(`📥 Resposta de ${socket.id.slice(0, 5)} para ${data.to.slice(0, 5)}`)
        io.to(data.to).emit("answer", {
            answer: data.answer,
            from: socket.id
        })
    })

    socket.on("ice-candidate", (data) => {
        io.to(data.to).emit("ice-candidate", {
            candidate: data.candidate,
            from: socket.id
        })
    })
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`)
    if (process.env.NODE_ENV === "production") {
        console.log("📱 URL pública: https://p2p-wifi.onrender.com/")
    }
})
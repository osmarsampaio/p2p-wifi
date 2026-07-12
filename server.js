const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const QRCode = require("qrcode")
const os = require("os")
require("dotenv").config()

const app = express()
const server = http.createServer(app)

// Configurar CORS mais permissivo para funcionar em qualquer lugar
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: false
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
    return "localhost"
}

// Rota raiz para health check do Docker
app.get("/", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() })
})

app.get("/qrcode", async (req, res) => {
    try {
        let url
        const host = req.get("host") || ""
        const isProduction = process.env.NODE_ENV === "production" || host.includes("onrender.com") || host.includes("render.com")

        if (isProduction) {
            // Usa a URL pública explícita se foi configurada, senão monta a partir do host real da requisição
            url = process.env.PUBLIC_URL || `https://${host}`
        } else {
            // Uso local - pegar IP da máquina
            const ip = getLocalIP()
            const port = process.env.PORT || 3000
            url = `http://${ip}:${port}`
        }
        
        const qr = await QRCode.toDataURL(url, {
            margin: 1,
            color: { dark: "#121110", light: "#f3ece1" }
        })
        res.json({ qr, url })
    } catch (error) {
        console.error("❌ Erro ao gerar QR Code:", error.message)
        res.status(500).json({ error: "Erro ao gerar QR Code" })
    }
})

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({ 
        status: "ok", 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        version: require("./package.json").version
    })
})

// Função de validação de device
function validateDevice(device) {
    if (!device || typeof device !== "string") {
        return "Desconhecido"
    }
    // Sanitizar input - remover caracteres perigosos
    const sanitized = device.replace(/[<>\"']/g, "").trim()
    return sanitized.substring(0, 50) || "Desconhecido"
}

io.on("connection", (socket) => {
    const device = validateDevice(socket.handshake.query.device)
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
        // Validação básica
        if (!data || !data.to || !data.type) {
            console.warn("⚠️ Dados inválidos de signal recebidos")
            return
        }

        console.log(`📨 Sinal ${data.type} de ${socket.id.slice(0, 5)} para ${data.to.slice(0, 5)}`)
        
        // Retransmitir para o outro dispositivo
        io.to(data.to).emit("signal", {
            type: data.type,
            from: socket.id,
            sdp: data.sdp,
            candidate: data.candidate
        })
    })
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`)
    if (process.env.NODE_ENV === "production") {
        console.log("📱 URL pública: https://p2p-wifi.onrender.com/")
    } else {
        const ip = getLocalIP()
        console.log(`🌐 Acesso local: http://${ip}:${PORT}`)
    }
})

// Graceful shutdown
process.on("SIGTERM", () => {
    console.log("📛 SIGTERM recebido, encerrando gracefully...")
    server.close(() => {
        console.log("✅ Servidor encerrado")
        process.exit(0)
    })
})

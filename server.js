const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const QRCode = require("qrcode")
const os = require("os")

const app = express()
const server = http.createServer(app)
const io = new Server(server)

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
    const ip = getLocalIP()
    const url = `http://${ip}:3000`
    const qr = await QRCode.toDataURL(url)
    res.json({ qr, url })
})

io.on("connection", (socket) => {
    const device = socket.handshake.query.device || "Desconhecido"
    users.push({ id: socket.id, device })
    
    // Notifica todos os usuários sobre a nova lista
    io.emit("users", users)

    socket.on("disconnect", () => {
        users = users.filter(u => u.id !== socket.id)
        io.emit("users", users)
    })

    // Retransmissão de sinais WebRTC (Signal Relay)
    socket.on("offer", (data) => {
        io.to(data.to).emit("offer", {
            offer: data.offer,
            from: socket.id
        })
    })

    socket.on("answer", (data) => {
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

server.listen(3000, () => {
    console.log("🚀 Servidor rodando em http://localhost:3000")
})
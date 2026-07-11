/**
 * ui.js — camada visual sobre o app.js original.
 * Não contém lógica de WebRTC/signaling: só reflete o estado
 * já existente (status, progresso, lista de dispositivos) na interface.
 */

// ---- Estado do "bridge" de sinal (body[data-state]) ----
const bodyEl = document.body

function setConsoleState(state) {
  bodyEl.setAttribute("data-state", state)
}

// Reaproveita a função global setStatus() do app.js e a estende
if (typeof window.setStatus === "function") {
  const originalSetStatus = window.setStatus
  window.setStatus = function (text) {
    originalSetStatus(text)

    const statusText = document.querySelector("#status .readout__text")
    if (statusText) statusText.textContent = text.replace(/^[^\wÀ-ÿ]+\s*/u, "")

    if (/conectando|reconectando/i.test(text)) setConsoleState("connecting")
    else if (/conectado|enviado|concluído/i.test(text) && !/desconectado|não/i.test(text)) setConsoleState("connected")
    else if (/erro|falhou|não foi possível/i.test(text)) setConsoleState("error")
    else setConsoleState("idle")
  }
}

// ---- Medidor segmentado (espelha a <progress> nativa) ----
const nativeProgress = document.getElementById("progress")
const bars = document.querySelectorAll(".meter__bars span")
const meter = document.querySelector(".meter")

function syncMeter() {
  const value = nativeProgress ? Number(nativeProgress.value) || 0 : 0
  const litCount = Math.round((value / 100) * bars.length)
  bars.forEach((bar, i) => bar.classList.toggle("lit", i < litCount))
  if (meter) meter.setAttribute("aria-valuenow", String(Math.round(value)))
  requestAnimationFrame(syncMeter)
}
requestAnimationFrame(syncMeter)

// ---- Placeholder de "nenhum dispositivo encontrado" ----
const usersList = document.getElementById("users")

function refreshEmptyPlaceholder() {
  if (!usersList) return
  const hasRealItems = usersList.querySelector("li:not(.freq-empty)")
  const placeholder = usersList.querySelector(".freq-empty")

  if (!hasRealItems && !placeholder) {
    const li = document.createElement("li")
    li.className = "freq-empty"
    li.setAttribute("data-placeholder", "")
    li.textContent = "Procurando dispositivos por perto…"
    usersList.appendChild(li)
  } else if (hasRealItems && placeholder) {
    placeholder.remove()
  }
}

if (usersList) {
  new MutationObserver(refreshEmptyPlaceholder).observe(usersList, { childList: true })
}

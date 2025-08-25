const BACKEND_URL = "https://orcamentistabeckend.onrender.com/chat";

let isSending = false; // evita envios duplicados

// util
function showTyping(messages) {
  const el = document.createElement("div");
  el.className = "msg bot";
  el.innerText = "Digitando…";
  messages.appendChild(el);
  return el;
}
function appendMsg(messages, who, text) {
  const div = document.createElement("div");
  div.className = `msg ${who}`;
  div.innerText = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

// envio
async function sendMessage() {
  if (isSending) return; // trava reentrância
  const input = document.getElementById("input");
  const messages = document.getElementById("messages");
  const btn = document.getElementById("send-btn");

  const text = (input.value || "").trim();
  if (!text) return;

  // exige token
  const clientToken = localStorage.getItem("clientToken");
  if (!clientToken) {
    const overlay = document.getElementById("login-overlay");
    if (overlay) overlay.style.display = "flex";
    return;
  }

  // UI
  appendMsg(messages, "user", text);
  const typing = showTyping(messages);
  isSending = true;
  btn.disabled = true;

  try {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), 75000);

    const resp = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Client-Token": clientToken
      },
      body: JSON.stringify({ message: text }),
      signal: ctrl.signal
    });
    clearTimeout(id);

    const body = await resp.text();
    let data = null;
    try { data = JSON.parse(body); } catch {}

    typing.remove();

    if (!resp.ok) {
      const errText = (data?.error || body || "Erro desconhecido do servidor.");
      appendMsg(messages, "bot", `⚠️ Erro ${resp.status}: ${errText}`);
      console.error("Backend error:", resp.status, errText);
    } else {
      const reply = data?.reply || "Sem resposta do servidor.";
      appendMsg(messages, "bot", reply);
    }
  } catch (err) {
    typing.remove();
    appendMsg(messages, "bot", "⚠️ Erro de rede/CORS. Tente novamente em alguns segundos.");
    console.error("Falha de rede:", err);
  } finally {
    isSending = false;
    btn.disabled = false;
    input.value = "";
    input.focus();
  }
}

// listeners únicos
window.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("send-btn");
  const input = document.getElementById("input");
  btn?.addEventListener("click", sendMessage);
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });

  // login overlay: abre se não houver token
  const token = localStorage.getItem("clientToken");
  const overlay = document.getElementById("login-overlay");
  const loginBtn = document.getElementById("login-btn");
  const tokenInput = document.getElementById("token-input");

  if (!token && overlay) overlay.style.display = "flex";
  loginBtn?.addEventListener("click", () => {
    const v = (tokenInput?.value || "").trim();
    if (!v) return;
    localStorage.setItem("clientToken", v);
    if (overlay) overlay.style.display = "none";
  });
});
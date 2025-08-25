// === CONFIG ===
const BACKEND_URL = "https://orcamentistabeckend.onrender.com/chat";
const ME_URL = "https://orcamentistabeckend.onrender.com/me";

let CLIENT_TOKEN = null; // será lido do localStorage ou do login

// util: salvar/ler token
function setToken(t) {
  CLIENT_TOKEN = (t || "").trim();
  if (CLIENT_TOKEN) localStorage.setItem("client_token", CLIENT_TOKEN);
}
function getSavedToken() {
  return localStorage.getItem("client_token") || "";
}

// UI helpers
function showTyping(messages) {
  const el = document.createElement("div");
  el.className = "msg bot";
  el.innerText = "Digitando…";
  messages.appendChild(el);
  return el;
}
function appendBot(text) {
  const messages = document.getElementById("messages");
  const botMsg = document.createElement("div");
  botMsg.className = "msg bot";
  botMsg.innerText = text;
  messages.appendChild(botMsg);
  messages.scrollTop = messages.scrollHeight;
}
function appendUser(text) {
  const messages = document.getElementById("messages");
  const userMsg = document.createElement("div");
  userMsg.className = "msg user";
  userMsg.innerText = text;
  messages.appendChild(userMsg);
  messages.scrollTop = messages.scrollHeight;
}

// Login overlay
function toggleLogin(show) {
  const overlay = document.getElementById("login-overlay");
  overlay.style.display = show ? "flex" : "none";
}
async function afterLoginUI() {
  // badge + botão sair
  const badge = document.getElementById("session-badge");
  const label = document.getElementById("session-label");
  const logout = document.getElementById("logout-btn");
  if (CLIENT_TOKEN) {
    badge.style.display = "inline-flex";
    label.textContent = `Conectado: ${CLIENT_TOKEN}`;
    logout.style.display = "inline-block";
  } else {
    badge.style.display = "none";
    logout.style.display = "none";
  }

  // opcional: mostrar status do plano
  try {
    const r = await fetch(ME_URL, {
      headers: { "X-Client-Token": CLIENT_TOKEN }
    });
    if (r.ok) {
      const me = await r.json();
      appendBot(`Bem-vindo, ${CLIENT_TOKEN} — Plano: ${me.plan} (${me.price}). Uso: ${me.used}/${me.monthlyLimit} no mês.`);
    }
  } catch {}
}

// Enviar mensagem
async function sendMessage() {
  if (!CLIENT_TOKEN) {
    toggleLogin(true);
    return;
  }

  const input = document.getElementById("input");
  const messages = document.getElementById("messages");
  const text = (input.value || "").trim();
  if (!text) return;

  appendUser(text);
  const typing = showTyping(messages);

  try {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), 90000);

    const resp = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Client-Token": CLIENT_TOKEN
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
      let msg = data?.error || body || "Erro desconhecido do servidor.";
      if (resp.status === 401) msg = "Faltou o token do cliente.";
      if (resp.status === 403) msg = "Token inválido ou não cadastrado.";
      if (resp.status === 429) msg = `Limite do plano atingido: ${data?.used}/${data?.limit} (${data?.plan}).`;
      appendBot(`⚠️ Erro ${resp.status}: ${msg}`);
      console.error("Backend error:", resp.status, msg);
      return;
    }

    const reply = data?.reply || "Sem resposta do servidor.";
    const usage = data?.usage;
    appendBot(
      usage
        ? `${reply}\n\n— Plano: ${usage.plan} | Uso: ${usage.used}/${usage.limit} mês`
        : reply
    );
  } catch (err) {
    typing.remove();
    if (err.name === "AbortError") {
      appendBot("⏳ Servidor iniciando… tente novamente agora.");
    } else {
      appendBot("⚠️ Erro de rede/CORS. Tente novamente em alguns segundos.");
    }
    console.error("Falha de rede:", err);
  }

  input.value = "";
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  // token salvo?
  const saved = getSavedToken();
  if (saved) {
    setToken(saved);
    toggleLogin(false);
    afterLoginUI();
  } else {
    toggleLogin(true);
  }

  // botões login / logout
  const loginBtn = document.getElementById("login-btn");
  const tokenInput = document.getElementById("token-input");
  const logoutBtn = document.getElementById("logout-btn");

  loginBtn?.addEventListener("click", async () => {
    const t = tokenInput.value.trim();
    if (!t) return;
    setToken(t);
    toggleLogin(false);
    afterLoginUI();
  });

  logoutBtn?.addEventListener("click", () => {
    localStorage.removeItem("client_token");
    setToken(null);
    appendBot("Sessão encerrada. Faça login novamente para continuar.");
    toggleLogin(true);
  });

  // Enter envia
  const input = document.getElementById("input");
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
});
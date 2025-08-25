// ===== CONFIG =====
const BACKEND_URL = "https://orcamentistabeckend.onrender.com/chat";

// ===== UI helpers =====
function showTyping(messagesEl) {
  const el = document.createElement("div");
  el.className = "msg bot";
  el.innerText = "Digitando…";
  messagesEl.appendChild(el);
  return el;
}

function appendMsg(messagesEl, who, text) {
  const div = document.createElement("div");
  div.className = `msg ${who}`;
  div.innerText = text;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// ===== LOGIN overlay =====
const overlay = document.getElementById("login-overlay");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const tokenInput = document.getElementById("token-input");
const sessionBadge = document.getElementById("session-badge");
const sessionLabel = document.getElementById("session-label");

function showLogin() {
  document.body.classList.add("show-login");
  overlay.style.display = "flex";
  tokenInput && tokenInput.focus();
}
function hideLogin() {
  overlay.style.display = "none";
  document.body.classList.remove("show-login");
}

function updateSessionUI() {
  const tok = localStorage.getItem("clientToken");
  if (tok) {
    sessionBadge.style.display = "inline-flex";
    sessionLabel.textContent = tok;
    logoutBtn.style.display = "inline-block";
  } else {
    sessionBadge.style.display = "none";
    logoutBtn.style.display = "none";
  }
}

window.addEventListener("load", () => {
  const tok = localStorage.getItem("clientToken");
  if (!tok) showLogin();
  updateSessionUI();
});

loginBtn?.addEventListener("click", () => {
  const v = (tokenInput.value || "").trim().toLowerCase();
  if (!v) { alert("Informe seu token."); return; }
  localStorage.setItem("clientToken", v);
  hideLogin();
  updateSessionUI();
});

logoutBtn?.addEventListener("click", () => {
  localStorage.removeItem("clientToken");
  showLogin();
  updateSessionUI();
});

// ===== CHAT =====
async function sendMessage() {
  const messages = document.getElementById("messages");
  const input = document.getElementById("input");
  const text = (input.value || "").trim();
  if (!text) return;

  const clientToken = localStorage.getItem("clientToken");
  if (!clientToken) { showLogin(); return; }

  appendMsg(messages, "user", text);
  const typing = showTyping(messages);

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
      return;
    }

    const reply = data?.reply || "Sem resposta do servidor.";
    appendMsg(messages, "bot", reply);

  } catch (err) {
    typing.remove();
    appendMsg(messages, "bot", "⚠️ Erro de rede/CORS. Tente novamente em alguns segundos.");
    console.error("Falha de rede:", err);
  }

  input.value = "";
}

// botão e Enter
document.getElementById("send-btn")?.addEventListener("click", sendMessage);
document.getElementById("input")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});
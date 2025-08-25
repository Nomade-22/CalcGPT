// === CONFIG ===
const BACKEND_URL = "https://orcamentistabeckend.onrender.com/chat";
// defina o token do cliente cadastrado no USER_PLAN do backend (nome-sobrenome ou tok-xxx)
const CLIENT_TOKEN = "joao-silva"; // exemplo: "maria-oliveira" ou "carlos-santos"

// opcional: pedir token ao carregar a página
// const CLIENT_TOKEN = prompt("Digite seu token de acesso:")?.trim();

function showTyping(messages) {
  const el = document.createElement("div");
  el.className = "msg bot";
  el.innerText = "Digitando…";
  messages.appendChild(el);
  return el;
}

async function sendMessage() {
  const input = document.getElementById("input");
  const messages = document.getElementById("messages");
  const text = (input.value || "").trim();
  if (!text) return;

  // mensagem do usuário
  const userMsg = document.createElement("div");
  userMsg.className = "msg user";
  userMsg.innerText = text;
  messages.appendChild(userMsg);

  // indicador de digitando
  const typing = showTyping(messages);

  try {
    // timeout de 75s (Render free pode hibernar)
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), 75000);

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
      if (resp.status === 401) msg = "⚠️ Faltou o token do cliente.";
      if (resp.status === 403) msg = "⚠️ Token inválido ou não cadastrado.";
      if (resp.status === 429) msg = `⚠️ Limite do plano atingido: ${data?.used}/${data?.limit}`;
      
      const botErr = document.createElement("div");
      botErr.className = "msg bot";
      botErr.innerText = `Erro ${resp.status}: ${msg}`;
      messages.appendChild(botErr);
      console.error("Backend error:", resp.status, msg);
      return;
    }

    const reply = data?.reply || "Sem resposta do servidor.";
    const usage = data?.usage;
    const botMsg = document.createElement("div");
    botMsg.className = "msg bot";
    botMsg.innerText = usage
      ? `${reply}\n\n— Plano: ${usage.plan} | Uso: ${usage.used}/${usage.limit} msgs`
      : reply;
    messages.appendChild(botMsg);

  } catch (err) {
    typing.remove();
    const botMsg = document.createElement("div");
    botMsg.className = "msg bot";
    if (err.name === "AbortError") {
      botMsg.innerText = "⏳ Servidor acordando, tente de novo.";
    } else {
      botMsg.innerText = "⚠️ Erro de rede/CORS. Tente novamente em alguns segundos.";
    }
    messages.appendChild(botMsg);
    console.error("Falha de rede:", err);
  }

  input.value = "";
  messages.scrollTop = messages.scrollHeight;
}

// tecla Enter envia
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("input");
  if (!input) return;
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
});
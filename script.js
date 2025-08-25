const BACKEND_URL = "https://orcamentistabeckend.onrender.com/chat";

// opcional: indicador "digitando..."
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

  // typing
  const typing = showTyping(messages);

  try {
    // timeout de 75s (Render free pode demorar para acordar)
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), 75000);

    const resp = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      const botErr = document.createElement("div");
      botErr.className = "msg bot";
      botErr.innerText = `⚠️ Erro ${resp.status}: ${errText}`;
      messages.appendChild(botErr);
      console.error("Backend error:", resp.status, errText);
      return;
    }

    const reply = data?.reply || "Sem resposta do servidor.";
    const botMsg = document.createElement("div");
    botMsg.className = "msg bot";
    botMsg.innerText = reply;
    messages.appendChild(botMsg);

  } catch (err) {
    typing.remove();
    const botMsg = document.createElement("div");
    botMsg.className = "msg bot";
    botMsg.innerText = "⚠️ Erro de rede/CORS. Tente novamente em alguns segundos.";
    messages.appendChild(botMsg);
    console.error("Falha de rede:", err);
  }

  input.value = "";
  messages.scrollTop = messages.scrollHeight;
}

const BACKEND_URL = "https://orcamentistabeckend.onrender.com/chat";
const CLIENT_TOKEN = "tok-joao-123"; // defina um token por cliente

// ...dentro do fetch:
const resp = await fetch(BACKEND_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Client-Token": CLIENT_TOKEN
  },
  body: JSON.stringify({ message: text })
});
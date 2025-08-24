// URL do seu backend no Render
const BACKEND_URL = "https://orcamentistabeckend.onrender.com/chat";

async function sendMessage() {
  const input = document.getElementById("input");
  const messages = document.getElementById("messages");

  const text = (input.value || "").trim();
  if (!text) return;

  // 1) mostra a mensagem do usuário na tela
  const userMsg = document.createElement("div");
  userMsg.className = "msg user";
  userMsg.innerText = text;
  messages.appendChild(userMsg);

  // 2) chama o backend
  try {
    const resp = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    // se o backend estiver “acordando”, a primeira resposta pode demorar ~30–60s
    const data = await resp.json();

    // 3) mostra a resposta da IA
    const botMsg = document.createElement("div");
    botMsg.className = "msg bot";
    botMsg.innerText = data.reply || "Sem resposta do servidor.";
    messages.appendChild(botMsg);
  } catch (err) {
    const botMsg = document.createElement("div");
    botMsg.className = "msg bot";
    botMsg.innerText = "⚠️ Erro ao conectar com o servidor.";
    messages.appendChild(botMsg);
  }

  // 4) limpa input e rola pro fim
  input.value = "";
  messages.scrollTop = messages.scrollHeight;
}
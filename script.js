// URL do seu backend no Render
const BACKEND_URL = "https://orcamentistabeckend.onrender.com/chat";

async function sendMessage() {
  const input = document.getElementById("input");
  const messages = document.getElementById("messages");

  const text = (input.value || "").trim();
  if (!text) return;

  // mostra a mensagem do usuário
  const userMsg = document.createElement("div");
  userMsg.className = "msg user";
  userMsg.innerText = text;
  messages.appendChild(userMsg);

  try {
    const resp = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    // lê a resposta (pode demorar um pouco na 1ª vez por causa do plano grátis)
    const data = await resp.json();

    // mostra a resposta da IA
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

  input.value = "";
  messages.scrollTop = messages.scrollHeight;
}
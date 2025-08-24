async function sendMessage() {
  const input = document.getElementById("input");
  const messages = document.getElementById("messages");

  if (!input.value.trim()) return;

  // Exibir mensagem do usuário
  const userMsg = document.createElement("div");
  userMsg.className = "msg user";
  userMsg.textContent = input.value;
  messages.appendChild(userMsg);

  // Chamar backend (a ser configurado)
  try {
    const response = await fetch("https://seu-backend.onrender.com/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input.value })
    });

    const data = await response.json();

    const botMsg = document.createElement("div");
    botMsg.className = "msg bot";
    botMsg.textContent = data.reply;
    messages.appendChild(botMsg);
  } catch (err) {
    const botMsg = document.createElement("div");
    botMsg.className = "msg bot";
    botMsg.textContent = "⚠️ Erro ao conectar com o servidor.";
    messages.appendChild(botMsg);
  }

  input.value = "";
  messages.scrollTop = messages.scrollHeight;
}

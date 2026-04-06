/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

const API_URL = "https://openai-api-key.charleslee49ers.workers.dev/";
const SYSTEM_PROMPT =
  "You are a concise L'Oréal beauty assistant. Only answer questions about L'Oréal products, routines, and recommendations. If the user asks about anything else, politely say you can only help with L'Oréal products, routines, and recommendations. Keep answers short, helpful, and practical.";

const messages = [{ role: "system", content: SYSTEM_PROMPT }];

// Set initial message
chatWindow.innerHTML = "";

function appendMessage(role, text) {
  const message = document.createElement("div");
  message.className = `msg ${role}`;
  message.textContent = text;
  chatWindow.appendChild(message);
  message.scrollIntoView({ behavior: "smooth", block: "end" });
}

appendMessage(
  "ai",
  "Ask me about L'Oréal products, routines, or recommendations.",
);

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = userInput.value.trim();

  if (!text) {
    return;
  }

  appendMessage("user", text);
  messages.push({ role: "user", content: text });
  userInput.value = "";
  userInput.focus();

  // Send the full message history to the worker so it can reply in context.
  appendMessage("ai", "Thinking...");
  const thinkingMessage = chatWindow.lastElementChild;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages,
      }),
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      throw new Error("No response content returned by the API.");
    }

    thinkingMessage.textContent = reply;
    thinkingMessage.scrollIntoView({ behavior: "smooth", block: "end" });
    messages.push({ role: "assistant", content: reply });
  } catch (error) {
    thinkingMessage.textContent =
      "Sorry, I could not get a response right now. Please try again.";
    thinkingMessage.scrollIntoView({ behavior: "smooth", block: "end" });
  }
});

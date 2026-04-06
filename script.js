/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

const API_URL = "https://openai-api-key.charleslee49ers.workers.dev/";
const SYSTEM_PROMPT =
  "You are a polite, friendly, and concise L'Oréal beauty assistant. Answer only questions about L'Oréal products, routines, recommendations, ingredients, shades, skin/hair concerns, and other beauty-related topics connected to L'Oréal brands. Remember the user's name if they share it during this chat session, and use it naturally in later replies when appropriate. Always use respectful language, acknowledge the user's request kindly, and offer helpful next-step suggestions when relevant. If a question is unrelated to L'Oréal or outside beauty topics, politely refuse by apologizing briefly and explaining that you can only help with L'Oréal beauty products, routines, and recommendations. Keep responses short, clear, and practical.";

const messages = [];
const conversationState = {
  name: "",
  recentQuestions: [],
};

// Set initial message
chatWindow.innerHTML = "";

function appendMessage(role, text) {
  const message = document.createElement("div");
  message.className = `msg ${role}`;

  // Add a small label so users can easily see who sent each message.
  const label = role === "user" ? "You" : "L'Oréal Assistant";
  message.textContent = `${label}: ${text}`;

  chatWindow.appendChild(message);

  return message;
}

function getUserMessage() {
  return userInput.value.trim();
}

function updateConversationState(text) {
  const nameMatch = text.match(
    /(?:my name is|i am|i'm|im)\s+([A-Za-z][A-Za-z'-]*)/i,
  );

  if (nameMatch) {
    conversationState.name = nameMatch[1];
  }

  conversationState.recentQuestions.push(text);

  if (conversationState.recentQuestions.length > 5) {
    conversationState.recentQuestions.shift();
  }
}

function buildSessionContext() {
  const contextParts = [];

  if (conversationState.name) {
    contextParts.push(`User name: ${conversationState.name}.`);
  }

  if (conversationState.recentQuestions.length > 0) {
    contextParts.push(
      `Recent user questions: ${conversationState.recentQuestions.join(" | ")}.`,
    );
  }

  return contextParts.length > 0
    ? `Session context: ${contextParts.join(" ")}`
    : "Session context: No user name or question history has been shared yet.";
}

function buildMessagesForRequest() {
  return [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "system", content: buildSessionContext() },
    ...messages,
  ];
}

async function fetchAssistantReply() {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: buildMessagesForRequest(),
    }),
  });

  if (!response.ok) {
    throw new Error("API request failed.");
  }

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content;

  if (!reply) {
    throw new Error("No response content returned by the API.");
  }

  return reply;
}

appendMessage(
  "ai",
  "Hi there! I am here to help with L'Oréal products, routines, and personalized recommendations. What would you like to explore today?",
);

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // 1) Capture user input from the chat interface.
  const text = getUserMessage();

  if (!text) {
    return;
  }

  // 2) Reset the visible chat so the latest question appears above the reply.
  chatWindow.innerHTML = "";

  // 3) Display the user's message in the chat window.
  appendMessage("user", text);
  updateConversationState(text);
  messages.push({ role: "user", content: text });
  userInput.value = "";
  userInput.focus();

  // Show a temporary loading message while waiting for the API.
  const thinkingMessage = appendMessage("ai", "Thinking...");

  try {
    // 4) Send the request to OpenAI Chat Completions (via the worker endpoint).
    const reply = await fetchAssistantReply();

    // 5) Display the chatbot response clearly in the chat interface.
    thinkingMessage.textContent = `L'Oréal Assistant: ${reply}`;

    messages.push({ role: "assistant", content: reply });
  } catch (error) {
    thinkingMessage.textContent =
      "L'Oréal Assistant: Sorry, I could not get a response right now. Please try again.";
  }
});

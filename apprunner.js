const ChatGPT = require("./chatgpt.js");

async function chatBotsConversation() {
  const chatbot = new ChatGPT("https://chat.openai.com/");
  await chatbot.initializeBrowser();

  console.log("Chatbot sent a message.");
  await chatbot.sendMessage("Search for the latest todays Python Remote Jobs of 3 years experience in Eligible for Pakistan.");

  await chatbot.closeBrowser();
}

chatBotsConversation();

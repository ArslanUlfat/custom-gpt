const puppeteer = require("puppeteer");
const crypto = require("crypto");
const axios = require("axios");
require('dotenv').config();

const SLACK_WEBHOOK_URL = process.env.PY_SLACK_URL;

class ChatGPT {
  constructor(chatbotUrl = "https://chat.openai.com/", headless = false) {
    this.browser = null;
    this.page = null;
    this.headless = headless;
    this.chatbotUrl = chatbotUrl;
    this.isFirstMessage = true;
    this.lastMessage = "";
    this.lastReply = "";
    this.letTimeout = 290000;
    this.conversationHistory = [];
    this.handleERRact = false;
    this.id = crypto.randomBytes(16).toString("hex") + ".json";
  }

  async initializeBrowser() {
    if (this.headless) {
      this.browser = await puppeteer.launch();
    } else {
      this.browser = await puppeteer.connect({
        browserURL: "http://127.0.0.1:9222",
      });
    }
    this.page = await this.browser.newPage();
    console.log("Browser initialized");
  }

  async randomDelay() {
    const delay = Math.floor(Math.random() * (20000 - 8000 + 1) + 8000);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  async parseGptReply() {
    try {
      await this.randomDelay();

      await this.page.waitForSelector(
        'div[data-message-author-role="assistant"]',
        { delay: 16000 }
      );

      const replyText = await this.page.evaluate(() => {
        const replyElements = document.querySelectorAll(
          'div[data-message-author-role="assistant"]'
        );
        const lastReplyElement = replyElements[replyElements.length - 1];
        return lastReplyElement ? lastReplyElement.innerText : "No reply found";
      });

      await axios.post(SLACK_WEBHOOK_URL, {
        text: `*ChatGPT Reply:*\n${replyText}`,
      });

      console.log(`Reply sent to Slack: ${replyText}`);
    } catch (error) {
      console.log(`Failed to save conversation to file: ${error.message}`);
    }
  }

  async sendMessage(message, timeout = this.letTimeout) {
    message = message.replace(/\n/g, " ") + " ALWAYS USE WEB BROSING IF NEEDED";
    await this.randomDelay();
    await this.page.bringToFront();
    await this.page.evaluate(() => {
      window.scrollBy(0, window.innerHeight);
    });
    try {
      if (this.isFirstMessage) {
        await this.page.goto(this.chatbotUrl);
        this.isFirstMessage = false;
      }

      await this.page.waitForSelector("#prompt-textarea", { timeout });

      await this.page.type("#prompt-textarea", message, { delay: 60 });

      await this.page.click('[data-testid="send-button"]');
      this.lastMessage = message;
      this.conversationHistory.push(`message : ${message} \n`);
      await this.parseGptReply();
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
  }

  async closeBrowser() {
    await this.browser.close();
    console.log("Browser closed");
  }
}

module.exports = ChatGPT;

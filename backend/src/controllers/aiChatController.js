/**
 * AEROTWIN AI - AI Copilot Controller
 */

const grokService = require('../services/grokService');
const db = require('../config/db');

async function chat(req, res) {
  try {
    const { prompt, context } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required.' });

    // Execute through Grok / Offline Knowledge Engine
    const result = await grokService.askCopilot(prompt, context || {});

    // Save to chat history
    await db.saveChatMessage({
      id: 'chat_' + Date.now(),
      user_id: req.user ? req.user.id : 'demo_user',
      prompt,
      response: result.response,
      source: result.source,
      created_at: new Date().toISOString()
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getHistory(req, res) {
  try {
    const history = await db.getChatHistory(req.user ? req.user.id : null);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { chat, getHistory };

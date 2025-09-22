const express = require('express');
const db = require('../config/db');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Get messages for a conversation (conversation_id)
router.get('/:conversationId/messages', authenticate, async (req, res) => {
  try {
    const messages = await db.findBy('messages', { conversation_id: req.params.conversationId }, '*');
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a message
router.post('/:conversationId/messages', authenticate, async (req, res) => {
  try {
    const payload = {
      conversation_id: req.params.conversationId,
      sender_id: req.user.id,
      body: req.body.body,
      created_at: new Date()
    };
    const message = await db.insert('messages', payload, '*');
    res.json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;
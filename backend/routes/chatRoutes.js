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

// Get recent messages for a user
router.get('/messages/recent/:userId', authenticate, async (req, res) => {
  const userId = req.params.userId;
  try {
    // Example: get last 20 messages for this user (adjust query as needed)
    const messages = await db.query(
      'SELECT * FROM messages WHERE sender_id = $1 OR receiver_id = $1 ORDER BY created_at DESC LIMIT 20',
      [userId]
    );
    res.json(messages.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

module.exports = router;
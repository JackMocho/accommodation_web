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

// Get recent messages for a user (inbox)
router.get('/messages/recent/:userId', authenticate, async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  try {
    // Get last 20 messages where user is sender or receiver
    const messages = await db.query(
      `SELECT * FROM messages 
       WHERE sender_id = $1 OR receiver_id = $1 
       ORDER BY created_at DESC LIMIT 20`,
      [userId]
    );
    res.json(messages.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get all messages for a rental (thread)
router.get('/messages/:rentalId', authenticate, async (req, res) => {
  const rentalId = parseInt(req.params.rentalId, 10);
  if (isNaN(rentalId)) return res.status(400).json({ error: 'Invalid rental ID' });
  try {
    const messages = await db.query(
      `SELECT * FROM messages 
       WHERE rental_id = $1 
       ORDER BY created_at ASC`,
      [rentalId]
    );
    res.json(messages.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a message (from client or landlord)
router.post('/send', authenticate, async (req, res) => {
  const { rental_id, sender_id, receiver_id, message, parent_id } = req.body;
  if (!rental_id || !sender_id || !receiver_id || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const payload = {
      sender_id,
      receiver_id,
      rental_id,
      parent_id: parent_id || null,
      message,
      created_at: new Date()
    };
    const result = await db.insert('messages', payload, '*');
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;
const express = require('express');
const db = require('../config/db');
const { authenticate } = require('../middleware/authMiddleware');
const router = express.Router();

// add UUID validator
const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  // treat userId as string (UUID) and validate
  const userId = req.params.userId;
  if (!uuidV4Regex.test(userId)) {
    return res.status(400).json({ error: 'Invalid userId: expected UUID' });
  }
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

// Get messages between two users (conversation)
router.get('/messages/:otherId', authenticate, async (req, res) => {
  const userId = req.user && req.user.id;
  const otherId = req.params.otherId;

  // Validate UUIDs before querying DB
  if (!userId || !uuidV4Regex.test(userId) || !uuidV4Regex.test(otherId)) {
    return res.status(400).json({ error: 'Invalid UUID format for user id(s)' });
  }

  try {
    const { rows } = await db.query(
      `SELECT *
         FROM messages
        WHERE (sender_id = $1 AND receiver_id = $2)
           OR (sender_id = $2 AND receiver_id = $1)
     ORDER BY created_at ASC`,
      [userId, otherId]
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Send a message (from client or landlord)
router.post('/send', authenticate, async (req, res) => {
  // enforce sender as authenticated user (prevent client from faking numeric id)
  const sender_id = req.user && req.user.id;
  const { rental_id, receiver_id, message, parent_id } = req.body;

  if (!sender_id || !receiver_id || !message || typeof rental_id === 'undefined') {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // validate UUIDs where expected
  if (!uuidV4Regex.test(sender_id) || !uuidV4Regex.test(receiver_id)) {
    return res.status(400).json({ error: 'Invalid UUID for sender or receiver' });
  }

  // rental_id may be an integer id in your schema; keep numeric check
  const rentalIdNum = Number(rental_id);
  if (!Number.isInteger(rentalIdNum)) {
    return res.status(400).json({ error: 'Invalid rental_id: expected integer' });
  }

  try {
    const payload = {
      sender_id,
      receiver_id,
      rental_id: rentalIdNum,
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
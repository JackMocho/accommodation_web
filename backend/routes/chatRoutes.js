const express = require('express');
const router = express.Router();
const db = require('../utils/supabaseClient');
const { authenticate } = require('../middleware/authMiddleware');

// send message
router.post('/', authenticate, async (req, res) => {
  try {
    const { receiver_id, rental_id, message, parent_id } = req.body;
    if (!receiver_id || !message) return res.status(400).json({ error: 'receiver_id and message required' });
    const inserted = await db.insert('messages', {
      sender_id: req.user.id,
      receiver_id,
      rental_id: rental_id || null,
      parent_id: parent_id || null,
      message
    });
    res.json(inserted);
  } catch (err) {
    console.error('Send message error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// get messages between authenticated user and another user (or by rental)
router.get('/', authenticate, async (req, res) => {
  try {
    const { withUser, rental_id } = req.query;
    if (withUser) {
      const sql = `
        SELECT * FROM messages
        WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
        ORDER BY created_at ASC;
      `;
      const rows = (await db.query(sql, [req.user.id, parseInt(withUser)])).rows;
      return res.json(rows);
    }
    if (rental_id) {
      const rows = await db.findBy('messages', { rental_id });
      return res.json(rows);
    }
    // return recent messages involving user
    const sql = `
      SELECT * FROM messages
      WHERE sender_id = $1 OR receiver_id = $1
      ORDER BY created_at DESC
      LIMIT 100;
    `;
    const rows = (await db.query(sql, [req.user.id])).rows;
    res.json(rows);
  } catch (err) {
    console.error('Get messages error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
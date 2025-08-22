const express = require('express');
const { logError } = require('../utils/logger');
const router = express.Router();
const supabase = require('../utils/supabaseClient');

// Send message (new or reply)
router.post('/send', async (req, res) => {
  const { sender_id, receiver_id, message, rental_id, parent_id } = req.body;
  if (!sender_id || !receiver_id || !message || !rental_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const { error } = await supabase.from('messages').insert([{
      sender_id,
      receiver_id,
      message,
      rental_id,
      parent_id: parent_id || null
    }]);
    if (error) {
      console.error('Supabase insert error:', error); // <-- Add this line
      throw error;
    }
    res.json({ success: true });
  } catch (err) {
    logError(err, req);
    res.status(500).json({ error: err.message || 'Failed to send message' }); // <-- Return real error
  }
});

// Reply to a message (for threaded replies)
router.post('/reply/:messageId', async (req, res) => {
  const { messageId } = req.params;
  const { sender_id, receiver_id, message, rental_id } = req.body;
  if (!sender_id || !receiver_id || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const { error } = await supabase.from('messages').insert([{
      sender_id,
      receiver_id,
      message,
      rental_id: rental_id || null,
      parent_id: messageId
    }]);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    logError(err, req);
    res.status(500).json({ error: 'Failed to send reply' });
  }
});

// Fetch messages for a rental
router.get('/messages/:rental_id', async (req, res) => {
  const { rental_id } = req.params;
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('rental_id', rental_id)
      .order('created_at', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Fetch recent messages for a user (inbox)
router.get('/messages/recent/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*, rentals(title)')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    // Attach rental_title for each message
    const messages = data.map(msg => ({
      ...msg,
      rental_title: msg.rentals?.title || msg.rental_id,
    }));
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get all chats for a user
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Send a message (duplicate of /send, but kept for compatibility)
router.post('/message', async (req, res) => {
  const message = req.body;
  const { data, error } = await supabase.from('messages').insert([message]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
});

// Get all messages between admin and a user
router.get('/admin/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

module.exports = router;
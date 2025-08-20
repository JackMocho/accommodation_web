const express = require('express');
const { logError } = require('../utils/logger');
const router = express.Router();
const supabase = require('../utils/supabaseClient');

// Send message (new or reply)
router.post('/send', async (req, res) => {
  const { sender_id, receiver_id, message, rental_id, parent_id } = req.body;
  if (!sender_id || !receiver_id || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const { error } = await supabase.from('messages').insert([{
      sender_id,
      receiver_id,
      message,
      rental_id: rental_id || null,
      parent_id: parent_id || null
    }]);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    logError(err, req);
    res.status(500).json({ error: 'Failed to send message' });
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
  const userId = req.params.userId;
  if (!userId) {
    return res.status(400).json({ error: 'User id required' });
  }
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }
    if (!data) {
      return res.status(404).json({ error: 'No messages found' });
    }
    res.json(data);
  } catch (err) {
    console.error('Chat fetch error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
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
    // Adjust this query to match your chat schema
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`from.eq.${userId},to.eq.${userId}`)
      .order('created_at', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

module.exports = router;
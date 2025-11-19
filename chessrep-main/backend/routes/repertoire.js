const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
// const Opening = require('../models/Opening');

// Get user's repertoire
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('repertoire.openingId');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.repertoire);
  } catch (error) {
    console.error('Error fetching repertoire:', error);
    res.status(500).json({ message: 'Error fetching repertoire' });
  }
});

// Add opening to repertoire
router.post('/', auth, async (req, res) => {
  try {
    const { openingId } = req.body;
    
    if (!openingId) {
      return res.status(400).json({ message: 'Opening ID is required' });
    }

    // const opening = await Opening.findById(openingId);
    // if (!opening) {
    //   return res.status(404).json({ message: 'Opening not found' });
    // }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if opening is already in repertoire
    const exists = user.repertoire.some(item => 
      item.openingId.toString() === openingId
    );

    if (exists) {
      return res.status(400).json({ message: 'Opening already in repertoire' });
    }

    user.repertoire.push({
      openingId,
      addedAt: new Date()
    });

    await user.save();
    res.json(user.repertoire);
  } catch (error) {
    console.error('Error adding to repertoire:', error);
    res.status(500).json({ message: 'Error adding to repertoire' });
  }
});

// Remove opening from repertoire
router.delete('/:openingId', auth, async (req, res) => {
  try {
    const { openingId } = req.params;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.repertoire = user.repertoire.filter(item => 
      item.openingId.toString() !== openingId
    );

    await user.save();
    res.json(user.repertoire);
  } catch (error) {
    console.error('Error removing from repertoire:', error);
    res.status(500).json({ message: 'Error removing from repertoire' });
  }
});

// Update repertoire order
router.put('/order', auth, async (req, res) => {
  try {
    const { order } = req.body;
    
    if (!Array.isArray(order)) {
      return res.status(400).json({ message: 'Order must be an array' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify all IDs in order exist in repertoire
    const repertoireIds = user.repertoire.map(item => item.openingId.toString());
    const isValidOrder = order.every(id => repertoireIds.includes(id));

    if (!isValidOrder) {
      return res.status(400).json({ message: 'Invalid order array' });
    }

    // Reorder repertoire
    user.repertoire = order.map(id => 
      user.repertoire.find(item => item.openingId.toString() === id)
    );

    await user.save();
    res.json(user.repertoire);
  } catch (error) {
    console.error('Error updating repertoire order:', error);
    res.status(500).json({ message: 'Error updating repertoire order' });
  }
});

module.exports = router; 
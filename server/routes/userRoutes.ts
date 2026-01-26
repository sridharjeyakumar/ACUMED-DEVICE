import express from 'express';
import UserMaster from '../models/UserMaster';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await UserMaster.find().select('-hash_password').sort({ user_id: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await UserMaster.findOne({ user_id: req.params.id }).select('-hash_password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create new user
router.post('/', async (req, res) => {
  try {
    const { user_id, employee_id, password, N_password_expiry_days, active } = req.body;
    
    // Hash password
    const hash_password = await bcrypt.hash(password || 'defaultPassword123', 10);
    
    const passwordExpiryDate = new Date();
    passwordExpiryDate.setDate(passwordExpiryDate.getDate() + (N_password_expiry_days || 90));

    const user = new UserMaster({
      user_id,
      employee_id,
      hash_password,
      Date_password_changed_date: new Date(),
      Date_password_expiry_date: passwordExpiryDate,
      N_password_expiry_days: N_password_expiry_days || 90,
      active: active !== false,
    });
    
    const savedUser = await user.save();
    const userResponse = savedUser.toObject();
    delete userResponse.hash_password;
    res.status(201).json(userResponse);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'User ID already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { employee_id, password, N_password_expiry_days, active } = req.body;
    const updateData: any = {
      employee_id,
      active: active !== false,
    };

    // Update password if provided
    if (password) {
      updateData.hash_password = await bcrypt.hash(password, 10);
      updateData.Date_password_changed_date = new Date();
      if (N_password_expiry_days) {
        const passwordExpiryDate = new Date();
        passwordExpiryDate.setDate(passwordExpiryDate.getDate() + N_password_expiry_days);
        updateData.Date_password_expiry_date = passwordExpiryDate;
        updateData.N_password_expiry_days = N_password_expiry_days;
      }
    } else if (N_password_expiry_days) {
      const passwordExpiryDate = new Date();
      passwordExpiryDate.setDate(passwordExpiryDate.getDate() + N_password_expiry_days);
      updateData.Date_password_expiry_date = passwordExpiryDate;
      updateData.N_password_expiry_days = N_password_expiry_days;
    }

    const user = await UserMaster.findOneAndUpdate(
      { user_id: req.params.id },
      updateData,
      { new: true, runValidators: true }
    ).select('-hash_password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const user = await UserMaster.findOneAndDelete({ user_id: req.params.id });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;


import express from 'express';
import UserLoginHistory from '../models/UserLoginHistory';

const router = express.Router();

// Get all login histories
router.get('/', async (req, res) => {
  try {
    const histories = await UserLoginHistory.find().sort({ Date_login_Date: -1, Time_login_Time: -1 });
    res.json(histories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch login histories' });
  }
});

// Get login history by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const histories = await UserLoginHistory.find({ user_id: req.params.userId })
      .sort({ Date_login_Date: -1, Time_login_Time: -1 });
    res.json(histories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch login histories' });
  }
});

// Get login history by ID
router.get('/:id', async (req, res) => {
  try {
    const history = await UserLoginHistory.findById(req.params.id);
    if (!history) {
      return res.status(404).json({ error: 'Login history not found' });
    }
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch login history' });
  }
});

// Create new login history
router.post('/', async (req, res) => {
  try {
    const { user_id, Date_login_Date, Time_login_Time, Date_Logout_Date, Time_Logout_Time } = req.body;
    
    const loginHistory = new UserLoginHistory({
      user_id,
      Date_login_Date: Date_login_Date ? new Date(Date_login_Date) : new Date(),
      Time_login_Time: Time_login_Time || new Date().toTimeString().slice(0, 8),
      Date_Logout_Date: Date_Logout_Date ? new Date(Date_Logout_Date) : undefined,
      Time_Logout_Time: Time_Logout_Time || undefined,
    });
    
    await loginHistory.save();
    res.status(201).json(loginHistory);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create login history' });
  }
});

// Update login history
router.put('/:id', async (req, res) => {
  try {
    const { Date_login_Date, Time_login_Time, Date_Logout_Date, Time_Logout_Time } = req.body;
    
    const updateData: any = {};
    if (Date_login_Date) updateData.Date_login_Date = new Date(Date_login_Date);
    if (Time_login_Time) updateData.Time_login_Time = Time_login_Time;
    if (Date_Logout_Date) updateData.Date_Logout_Date = new Date(Date_Logout_Date);
    if (Time_Logout_Time) updateData.Time_Logout_Time = Time_Logout_Time;

    const history = await UserLoginHistory.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!history) {
      return res.status(404).json({ error: 'Login history not found' });
    }
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update login history' });
  }
});

// Delete login history
router.delete('/:id', async (req, res) => {
  try {
    const history = await UserLoginHistory.findByIdAndDelete(req.params.id);
    if (!history) {
      return res.status(404).json({ error: 'Login history not found' });
    }
    res.json({ message: 'Login history deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete login history' });
  }
});

export default router;




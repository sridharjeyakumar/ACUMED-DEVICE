import express from 'express';
import RoleMaster from '../models/RoleMaster';

const router = express.Router();

// Get all roles
router.get('/', async (req, res) => {
  try {
    const roles = await RoleMaster.find().sort({ roll_id: 1 });
    res.json(roles);
  } catch (error: any) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch roles' });
  }
});

// Get role by ID
router.get('/:id', async (req, res) => {
  try {
    const role = await RoleMaster.findOne({ roll_id: req.params.id });
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    res.json(role);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch role' });
  }
});

// Create new role
router.post('/', async (req, res) => {
  try {
    const { roll_id, roll_description, remarks, active } = req.body;
    const role = new RoleMaster({ roll_id, roll_description, remarks, active: active !== false });
    await role.save();
    res.status(201).json(role);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Role ID already exists' });
    }
    res.status(500).json({ error: 'Failed to create role' });
  }
});

// Update role
router.put('/:id', async (req, res) => {
  try {
    const { roll_description, remarks, active } = req.body;
    const role = await RoleMaster.findOneAndUpdate(
      { roll_id: req.params.id },
      { roll_description, remarks, active: active !== false },
      { new: true, runValidators: true }
    );
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    res.json(role);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// Delete role
router.delete('/:id', async (req, res) => {
  try {
    const role = await RoleMaster.findOneAndDelete({ roll_id: req.params.id });
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete role' });
  }
});

export default router;


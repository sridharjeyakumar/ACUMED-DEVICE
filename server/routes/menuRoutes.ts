import express from 'express';
import MenuMaster from '../models/MenuMaster';

const router = express.Router();

// Get all menus
router.get('/', async (req, res) => {
  try {
    const menus = await MenuMaster.find().sort({ menu_id: 1 });
    res.json(menus);
  } catch (error: any) {
    console.error('Error fetching menus:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch menus' });
  }
});

// Get menu by ID
router.get('/:id', async (req, res) => {
  try {
    const menu = await MenuMaster.findOne({ menu_id: req.params.id });
    if (!menu) {
      return res.status(404).json({ error: 'Menu not found' });
    }
    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

// Create new menu
router.post('/', async (req, res) => {
  try {
    const { menu_id, menu_desc, active } = req.body;
    const menu = new MenuMaster({ menu_id, menu_desc, active: active !== false });
    await menu.save();
    res.status(201).json(menu);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Menu ID already exists' });
    }
    res.status(500).json({ error: 'Failed to create menu' });
  }
});

// Update menu
router.put('/:id', async (req, res) => {
  try {
    const { menu_desc, active } = req.body;
    const menu = await MenuMaster.findOneAndUpdate(
      { menu_id: req.params.id },
      { menu_desc, active: active !== false },
      { new: true, runValidators: true }
    );
    if (!menu) {
      return res.status(404).json({ error: 'Menu not found' });
    }
    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update menu' });
  }
});

// Delete menu
router.delete('/:id', async (req, res) => {
  try {
    const menu = await MenuMaster.findOneAndDelete({ menu_id: req.params.id });
    if (!menu) {
      return res.status(404).json({ error: 'Menu not found' });
    }
    res.json({ message: 'Menu deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete menu' });
  }
});

export default router;


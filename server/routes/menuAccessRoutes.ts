import express from 'express';
import MenuAccessMaster from '../models/MenuAccessMaster';

const router = express.Router();

// Get all menu accesses
router.get('/', async (req, res) => {
  try {
    const accesses = await MenuAccessMaster.find().sort({ rold_id: 1, menu_id: 1 });
    res.json(accesses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch menu accesses' });
  }
});

// Get menu access by role and menu
router.get('/:roldId/:menuId', async (req, res) => {
  try {
    const access = await MenuAccessMaster.findOne({
      rold_id: req.params.roldId,
      menu_id: req.params.menuId,
    });
    if (!access) {
      return res.status(404).json({ error: 'Menu access not found' });
    }
    res.json(access);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch menu access' });
  }
});

// Create new menu access
router.post('/', async (req, res) => {
  try {
    const { rold_id, menu_id, access, can_add, can_edit, can_view, can_cancel } = req.body;
    const menuAccess = new MenuAccessMaster({
      rold_id,
      menu_id,
      access: access !== false,
      can_add: can_add !== false,
      can_edit: can_edit !== false,
      can_view: can_view !== false,
      can_cancel: can_cancel !== false,
    });
    await menuAccess.save();
    res.status(201).json(menuAccess);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Menu access already exists for this role and menu' });
    }
    res.status(500).json({ error: 'Failed to create menu access' });
  }
});

// Update menu access
router.put('/:roldId/:menuId', async (req, res) => {
  try {
    const { access, can_add, can_edit, can_view, can_cancel } = req.body;
    const menuAccess = await MenuAccessMaster.findOneAndUpdate(
      { rold_id: req.params.roldId, menu_id: req.params.menuId },
      {
        access: access !== false,
        can_add: can_add !== false,
        can_edit: can_edit !== false,
        can_view: can_view !== false,
        can_cancel: can_cancel !== false,
      },
      { new: true, runValidators: true }
    );
    if (!menuAccess) {
      return res.status(404).json({ error: 'Menu access not found' });
    }
    res.json(menuAccess);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update menu access' });
  }
});

// Delete menu access
router.delete('/:roldId/:menuId', async (req, res) => {
  try {
    const menuAccess = await MenuAccessMaster.findOneAndDelete({
      rold_id: req.params.roldId,
      menu_id: req.params.menuId,
    });
    if (!menuAccess) {
      return res.status(404).json({ error: 'Menu access not found' });
    }
    res.json({ message: 'Menu access deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete menu access' });
  }
});

export default router;


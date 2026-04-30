import express from 'express';
import {
    createUser,
    deleteUser,
    getUserById,
    getUsers,
    loginUser,
    updateUser,
} from '../controllers/userController.mjs';
import { requireAuth } from '../middleware/authMiddleware.mjs';

const router = express.Router()

router.post('/', createUser)
router.post('/login', loginUser)
router.get('/', getUsers)
router.get('/:id', getUserById)
router.put('/:id', requireAuth, updateUser)
router.delete('/:id', requireAuth, deleteUser)

export default router

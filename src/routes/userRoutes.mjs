import express from 'express';
import {
    createUser,
    deleteUser,
    getUserById,
    getUsers,
    loginUser,
    updateUser,
} from '../controllers/userController.mjs';

const router = express.Router()

router.post('/', createUser)
router.post('/login', loginUser)
router.get('/', getUsers)
router.get('/:id', getUserById)
router.put('/:id', updateUser)
router.delete('/:id', deleteUser)

export default router

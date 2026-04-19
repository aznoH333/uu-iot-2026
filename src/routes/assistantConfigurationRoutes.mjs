import express from 'express';
import {
    createAssistantConfiguration,
    deleteAssistantConfiguration,
    getAssistantConfigurationById,
    getAssistantConfigurations,
    updateAssistantConfiguration,
} from '../controllers/assistantConfigurationController.mjs';
import { requireAuth } from '../middleware/authMiddleware.mjs';

const router = express.Router()

router.post('/', requireAuth, createAssistantConfiguration)
router.get('/', requireAuth, getAssistantConfigurations)
router.get('/:id', requireAuth, getAssistantConfigurationById)
router.put('/:id', requireAuth, updateAssistantConfiguration)
router.delete('/:id', requireAuth, deleteAssistantConfiguration)

export default router

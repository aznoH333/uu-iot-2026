import { randomUUID } from 'crypto';
import AssistantConfiguration from '../models/AssistantConfiguration.mjs';
import { hideMongoId, hideMongoIds } from '../utils/responseUtils.mjs';

export const createAssistantConfiguration = async (req, res) => {
    try {
        const assistantConfiguration = await AssistantConfiguration.create({
            id: randomUUID(),
            ownerId: req.user.id,
            assistantName: 'Robot',
            systemPrompt: '',
            topicRestrictions: '',
            assistantVoice: 'placeholder',
        })

        return res.status(201).json(hideMongoId(assistantConfiguration))
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to create assistant configuration',
        })
    }
}

export const getAssistantConfigurations = async (req, res) => {
    try {
        const assistantConfigurations = await AssistantConfiguration.find({
            ownerId: req.user.id,
        })

        return res.status(200).json(hideMongoIds(assistantConfigurations))
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to get assistant configurations',
        })
    }
}

export const getAssistantConfigurationById = async (req, res) => {
    try {
        const assistantConfiguration = await AssistantConfiguration.findOne({
            id: req.params.id,
            ownerId: req.user.id,
        })

        if (!assistantConfiguration) {
            return res.status(404).json({
                message: 'Assistant configuration not found',
            })
        }

        return res.status(200).json(hideMongoId(assistantConfiguration))
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to get assistant configuration',
        })
    }
}

export const updateAssistantConfiguration = async (req, res) => {
    const { assistantName, systemPrompt, topicRestrictions, assistantVoice } = req.body
    const updates = {}

    if (assistantName !== undefined) {
        updates.assistantName = assistantName
    }

    if (systemPrompt !== undefined) {
        updates.systemPrompt = systemPrompt
    }

    if (topicRestrictions !== undefined) {
        updates.topicRestrictions = topicRestrictions
    }

    if (assistantVoice !== undefined) {
        updates.assistantVoice = assistantVoice
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({
            message: 'At least one field must be provided for update',
        })
    }

    try {
        const assistantConfiguration = await AssistantConfiguration.findOneAndUpdate(
            {
                id: req.params.id,
                ownerId: req.user.id,
            },
            updates,
            {
                returnDocument: 'after',
                runValidators: true,
            },
        )

        if (!assistantConfiguration) {
            return res.status(404).json({
                message: 'Assistant configuration not found',
            })
        }

        return res.status(200).json(hideMongoId(assistantConfiguration))
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to update assistant configuration',
        })
    }
}

export const deleteAssistantConfiguration = async (req, res) => {
    try {
        const assistantConfiguration = await AssistantConfiguration.findOneAndDelete({
            id: req.params.id,
            ownerId: req.user.id,
        })

        if (!assistantConfiguration) {
            return res.status(404).json({
                message: 'Assistant configuration not found',
            })
        }

        return res.status(204).send()
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to delete assistant configuration',
        })
    }
}

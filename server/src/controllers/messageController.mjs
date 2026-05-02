import { randomUUID } from 'crypto';
import AssistantConfiguration from '../models/AssistantConfiguration.mjs';
import Device from '../models/Device.mjs';
import Message from '../models/Message.mjs';
import UserDeviceRelation from '../models/UserDeviceRelation.mjs';
import { hideMongoId, hideMongoIds } from '../utils/responseUtils.mjs';

export const createMessage = async (req, res) => {
    const { apiKey, content } = req.body

    if (!apiKey || !content) {
        return res.status(400).json({
            message: 'apiKey and content are required',
        })
    }

    try {
        const device = await Device.findOne({ apiKey })

        if (!device) {
            return res.status(404).json({
                message: 'Device not found',
            })
        }

        if (!device.activeUserRelation) {
            return res.status(400).json({
                message: 'Device does not have an active user relation',
            })
        }

        const activeRelation = await UserDeviceRelation.findOne({
            id: device.activeUserRelation,
            deviceId: device.id,
        })

        if (!activeRelation) {
            return res.status(404).json({
                message: 'Active user relation not found',
            })
        }

        if (!activeRelation.activeConfigurationId) {
            return res.status(400).json({
                message: 'Active user relation does not have an active configuration',
            })
        }

        const configuration = await AssistantConfiguration.findOne({
            id: activeRelation.activeConfigurationId,
        })

        if (!configuration) {
            return res.status(404).json({
                message: 'Assistant configuration not found',
            })
        }

        const createdMessage = await Message.create({
            id: randomUUID(),
            messageOrigin: 'user',
            createdDate: new Date(),
            content,
            configurationId: activeRelation.activeConfigurationId,
        })

        return res.status(201).json(hideMongoId(createdMessage))
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to create message',
        })
    }
}

export const getMessages = async (req, res) => {
    const { configurationId } = req.params

    if (!configurationId) {
        return res.status(400).json({
            message: 'configurationId is required',
        })
    }

    try {
        const configuration = await AssistantConfiguration.findOne({
            id: configurationId,
            ownerId: req.user.id,
        })

        if (!configuration) {
            return res.status(404).json({
                message: 'Assistant configuration not found',
            })
        }

        const messages = await Message.find({
            configurationId,
        }).sort({ createdDate: 1 })

        return res.status(200).json(hideMongoIds(messages))
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to get messages',
        })
    }
}

export const updateMessage = async (req, res) => {
    const { messageOrigin, content, configurationId } = req.body
    const updates = {}

    if (messageOrigin !== undefined) {
        updates.messageOrigin = messageOrigin
    }

    if (content !== undefined) {
        updates.content = content
    }

    if (configurationId !== undefined) {
        updates.configurationId = configurationId
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({
            message: 'At least one field must be provided for update',
        })
    }

    try {
        const existingMessage = await Message.findOne({ id: req.params.id })

        if (!existingMessage) {
            return res.status(404).json({
                message: 'Message not found',
            })
        }

        const currentConfiguration = await AssistantConfiguration.findOne({
            id: existingMessage.configurationId,
            ownerId: req.user.id,
        })

        if (!currentConfiguration) {
            return res.status(404).json({
                message: 'Message not found',
            })
        }

        if (configurationId !== undefined) {
            const targetConfiguration = await AssistantConfiguration.findOne({
                id: configurationId,
                ownerId: req.user.id,
            })

            if (!targetConfiguration) {
                return res.status(404).json({
                    message: 'Assistant configuration not found',
                })
            }
        }

        const updatedMessage = await Message.findOneAndUpdate(
            {
                id: req.params.id,
            },
            updates,
            {
                returnDocument: 'after',
                runValidators: true,
            },
        )

        if (!updatedMessage) {
            return res.status(404).json({
                message: 'Message not found',
            })
        }

        return res.status(200).json(hideMongoId(updatedMessage))
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to update message',
        })
    }
}

export const deleteMessage = async (req, res) => {
    try {
        const existingMessage = await Message.findOne({ id: req.params.id })

        if (!existingMessage) {
            return res.status(404).json({
                message: 'Message not found',
            })
        }

        const configuration = await AssistantConfiguration.findOne({
            id: existingMessage.configurationId,
            ownerId: req.user.id,
        })

        if (!configuration) {
            return res.status(404).json({
                message: 'Message not found',
            })
        }

        await Message.deleteOne({ id: req.params.id })

        return res.status(204).send()
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to delete message',
        })
    }
}

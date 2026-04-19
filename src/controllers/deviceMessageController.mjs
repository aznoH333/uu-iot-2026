import { randomUUID } from 'crypto';
import AssistantConfiguration from '../models/AssistantConfiguration.mjs';
import Device from '../models/Device.mjs';
import DeviceMessage from '../models/DeviceMessage.mjs';
import UserDeviceRelation from '../models/UserDeviceRelation.mjs';

export const createDeviceMessage = async (req, res) => {
    const { deviceId } = req.params
    const { content } = req.body

    if (!deviceId || !content) {
        return res.status(400).json({
            message: 'deviceId and content are required',
        })
    }

    try {
        const device = await Device.findOne({ id: deviceId })

        if (!device) {
            return res.status(404).json({
                message: 'Device not found',
            })
        }

        if (!device.activeUserRelation) {
            return res.status(400).json({
                message: 'Device does not have an active user',
            })
        }

        const activeRelation = await UserDeviceRelation.findOne({ id: device.activeUserRelation })

        if (!activeRelation) {
            return res.status(404).json({
                message: 'Active device relation not found',
            })
        }

        if (!activeRelation.activeConfigurationId) {
            return res.status(400).json({
                message: 'Active device relation does not have an active configuration',
            })
        }

        const deviceMessage = await DeviceMessage.create({
            id: randomUUID(),
            messageOrigin: 'user',
            createdDate: new Date(),
            content,
            configurationId: activeRelation.activeConfigurationId,
        })

        return res.status(201).json(deviceMessage)
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to create device message',
        })
    }
}

export const getDeviceMessages = async (req, res) => {
    const { deviceId } = req.params

    if (!deviceId) {
        return res.status(400).json({
            message: 'deviceId is required',
        })
    }

    try {
        const relation = await UserDeviceRelation.findOne({
            userId: req.user.id,
            deviceId,
        })

        if (!relation) {
            return res.status(404).json({
                message: 'User is not assigned to this device',
            })
        }

        if (!relation.activeConfigurationId) {
            return res.status(400).json({
                message: 'User device relation does not have an active configuration',
            })
        }

        const deviceMessages = await DeviceMessage.find({
            configurationId: relation.activeConfigurationId,
        }).sort({ createdDate: 1 })

        return res.status(200).json(deviceMessages)
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to get device messages',
        })
    }
}

export const updateDeviceMessage = async (req, res) => {
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
        const existingMessage = await DeviceMessage.findOne({ id: req.params.id })

        if (!existingMessage) {
            return res.status(404).json({
                message: 'Device message not found',
            })
        }

        const currentConfiguration = await AssistantConfiguration.findOne({
            id: existingMessage.configurationId,
            ownerId: req.user.id,
        })

        if (!currentConfiguration) {
            return res.status(404).json({
                message: 'Device message not found',
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

        const deviceMessage = await DeviceMessage.findOneAndUpdate(
            {
                id: req.params.id,
            },
            updates,
            {
                returnDocument: 'after',
                runValidators: true,
            },
        )

        if (!deviceMessage) {
            return res.status(404).json({
                message: 'Device message not found',
            })
        }

        return res.status(200).json(deviceMessage)
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to update device message',
        })
    }
}

export const deleteDeviceMessage = async (req, res) => {
    try {
        const existingMessage = await DeviceMessage.findOne({ id: req.params.id })

        if (!existingMessage) {
            return res.status(404).json({
                message: 'Device message not found',
            })
        }

        const configuration = await AssistantConfiguration.findOne({
            id: existingMessage.configurationId,
            ownerId: req.user.id,
        })

        if (!configuration) {
            return res.status(404).json({
                message: 'Device message not found',
            })
        }

        await DeviceMessage.deleteOne({ id: req.params.id })

        return res.status(204).send()
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to delete device message',
        })
    }
}

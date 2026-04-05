import { randomUUID } from 'crypto';
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

        if (!device.activeUser) {
            return res.status(400).json({
                message: 'Device does not have an active user',
            })
        }

        const activeRelation = await UserDeviceRelation.findOne({ id: device.activeUser })

        if (!activeRelation) {
            return res.status(404).json({
                message: 'Active device relation not found',
            })
        }

        const deviceMessage = await DeviceMessage.create({
            id: randomUUID(),
            messageOrigin: 'user',
            userId: activeRelation.userId,
            deviceId,
            createdDate: new Date(),
            content,
        })

        return res.status(201).json(deviceMessage)
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to create device message',
        })
    }
}

export const getDeviceMessages = (req, res) => {
    res.status(501).send()
}

export const getDeviceMessageById = (req, res) => {
    res.status(501).send()
}

export const updateDeviceMessage = (req, res) => {
    res.status(501).send()
}

export const deleteDeviceMessage = (req, res) => {
    res.status(501).send()
}

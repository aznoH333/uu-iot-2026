import mongoose from 'mongoose';

const deviceMessageSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true,
        },
        messageOrigin: {
            type: String,
            enum: ['user', 'assistant', 'system'],
            required: true,
        },
        userId: {
            type: String,
            required: true,
        },
        deviceId: {
            type: String,
            required: true,
        },
        createdDate: {
            type: Date,
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
    },
    {
        versionKey: false,
    },
)

const DeviceMessage = mongoose.model('DeviceMessage', deviceMessageSchema)

export default DeviceMessage

import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
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
        configurationId: {
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

const Message = mongoose.model('Message', messageSchema)

export default Message

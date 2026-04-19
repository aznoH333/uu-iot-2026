import mongoose from 'mongoose';

const assistantConfigurationSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true,
        },
        ownerId: {
            type: String,
            required: true,
        },
        assistantName: {
            type: String,
        },
        systemPrompt: {
            type: String,
        },
        topicRestrictions: {
            type: String,
        },
        assistantVoice: {
            type: String,
        },
    },
    {
        versionKey: false,
    },
)

const AssistantConfiguration = mongoose.model(
    'AssistantConfiguration',
    assistantConfigurationSchema,
)

export default AssistantConfiguration

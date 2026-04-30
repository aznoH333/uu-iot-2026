import mongoose from 'mongoose';

const userDeviceRelationSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true,
        },
        userId: {
            type: String,
            required: true,
        },
        deviceId: {
            type: String,
            required: true,
        },
        activeConfigurationId: {
            type: String,
        },
        userRole: {
            type: String,
            enum: ['user', 'admin'],
            required: true,
        },
    },
    {
        versionKey: false,
    },
)

const UserDeviceRelation = mongoose.model('UserDeviceRelation', userDeviceRelationSchema)

export default UserDeviceRelation

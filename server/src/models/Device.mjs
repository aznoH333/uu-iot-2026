import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true,
        },
        name: {
            type: String,
        },
        activeUserRelation: {
            type: String,
        },
    },
    {
        versionKey: false,
    },
)

const Device = mongoose.model('Device', deviceSchema)

export default Device

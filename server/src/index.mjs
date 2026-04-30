import express from 'express'
import mongoose from 'mongoose';
import cors from 'cors'
import assistantConfigurationRouter from './routes/assistantConfigurationRoutes.mjs';
import messageRouter from './routes/messageRoutes.mjs';
import deviceRouter from './routes/deviceRoutes.mjs';
import userRouter from './routes/userRoutes.mjs';
import userDeviceRelationRouter from './routes/userDeviceRelationRoutes.mjs';


const app = express()
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}))
app.use(express.json())

mongoose.connect('mongodb://127.0.0.1:27017/test')
    .then(() => console.log('Connected!'));

app.get('/', (req, res) => {
    res.send('Hello World')
})

app.use('/users', userRouter)
app.use('/devices', deviceRouter)
app.use('/messages', messageRouter)
app.use('/user-device-relations', userDeviceRelationRouter)
app.use('/assistant-configurations', assistantConfigurationRouter)

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000')
})

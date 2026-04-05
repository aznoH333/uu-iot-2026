import express from 'express'
import mongoose from 'mongoose';
import deviceRouter from './routes/deviceRoutes.mjs';
import userRouter from './routes/userRoutes.mjs';


const app = express()

app.use(express.json())

mongoose.connect('mongodb://127.0.0.1:27017/test')
    .then(() => console.log('Connected!'));

app.get('/', (req, res) => {
    res.send('Hello World')
})

app.use('/users', userRouter)
app.use('/devices', deviceRouter)

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000')
})

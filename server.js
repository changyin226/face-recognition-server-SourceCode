const express = require('express')
const app = express()
const bcrypt = require('bcrypt-nodejs')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const db = require('knex')({
  client: 'pg',
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  }
})
const redisClient = require("redis").createClient(process.env.REDIS_URL);

const register = require('./controllers/register')
const sign = require('./controllers/sign')
const getProfile = require('./controllers/profile')
const image = require('./controllers/image')
const requireAuth = require('./middleware/authorization')

app.use(cors())
app.use(express.json())

app.post('/signin', sign.signInAuthentication(db, bcrypt, redisClient, jwt))
app.post('/signout', sign.signOutHandler(redisClient))
app.post('/register', register(db, bcrypt, redisClient, jwt))
app.get('/profile/:id', requireAuth(redisClient), getProfile(db))
app.put('/image', requireAuth(redisClient), image.imageHandler(db))
app.post('/imageurl', requireAuth(redisClient), image.apiCallHandler())

app.listen(process.env.PORT || 3000, () => {
  console.log(`app is running on port ${process.env.PORT}`)
})

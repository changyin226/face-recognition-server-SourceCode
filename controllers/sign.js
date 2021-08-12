const { promisify } = require("util");

const signInHandler = (db, bcrypt, req, res) => {
    const { email, password } = req.body
    const emailReg = /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/
    const passwordReg = new RegExp(/[A-Za-z].*[0-9]|[0-9].*[A-Za-z]/)
    const passwordReg1 = new RegExp(/^[0-9A-Za-z]+$/)
    const isValidEmail =  emailReg.test(email)
    const isValidPassword = passwordReg.test(password) && passwordReg1.test(password)
    if(!(isValidEmail && isValidPassword)) return Promise.reject('帳號或密碼錯誤，請重新登入')
  
    return db('login').select('hash').where({email})
      .then(data => {
        if (!data.length) return Promise.reject('帳號或密碼錯誤，請重新登入')
        const isValid = bcrypt.compareSync(password, data[0].hash);
        if(isValid) {
          return db('users').where({email})
            .then(user => user[0])
            .catch(() => Promise.reject())
        }
        return Promise.reject('帳號或密碼錯誤，請重新登入')
      })
      .catch((err) => {
        if (err === '帳號或密碼錯誤，請重新登入') return Promise.reject(err)
        return Promise.reject('連線發生錯誤，請再試一次')
      })
}

const createToken = (user, redisClient, jwt) => {
  const { email, id } = user
  const jwtPayload = { email }
  const expire = 24 * 60 * 60
  const token = jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: expire })
  const setAsync = promisify(redisClient.set).bind(redisClient)
  return setAsync(token, id, 'EX', expire)
    .then(() => ({ token }))
    .catch(() => Promise.reject('發生錯誤，請再試一次'))
}

const signInAuthentication = (db, bcrypt, redisClient, jwt) => (req, res) => {
  let { authorization } = req.headers
  if (authorization) {
    authorization = authorization.replace('Bearer ', '')
    redisClient.get(authorization, (err, reply) => {
      if (err || !reply) return res.status(401).json('授權過期，請重新登入')
      return res.json(reply)
    })
  }
  else {
    signInHandler(db, bcrypt, req, res)
      .then(user => createToken(user, redisClient, jwt))
      .then(token => res.json(token))
      .catch(err => res.status(400).json(err))
  }
}

const signOutHandler = (redisClient) => (req, res) => {
  let { authorization } = req.headers
  authorization = authorization.replace('Bearer ', '')
  redisClient.del(authorization, (err, reply) => {
    if (err || !reply) return res.status(400).json('發生錯誤，請再試一次')
    return res.json('登出成功')
  })  
}

module.exports = {
  signOutHandler,
  signInAuthentication
}
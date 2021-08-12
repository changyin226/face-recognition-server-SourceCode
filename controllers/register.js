const { promisify } = require("util");

const registerHandler = (db, bcrypt, req, res) => {
  const { name, email, password } = req.body
  const nameReg = new RegExp(/^[0-9A-Za-z]+$/);
  const emailReg = /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/
  const passwordReg = new RegExp(/[A-Za-z].*[0-9]|[0-9].*[A-Za-z]/)
  const passwordReg1 = new RegExp(/^[0-9A-Za-z]+$/)
  const isValidName = nameReg.test(name)
  const isValidEmail =  emailReg.test(email)
  const isValidPassword = password.length >= 8 && passwordReg.test(password) && passwordReg1.test(password)
  if(!(isValidName && isValidEmail && isValidPassword)) return Promise.reject('請確實輸入姓名、信箱、密碼')
  
  const hash = bcrypt.hashSync(password);
  return db.transaction(trx => {
    trx('login').insert({
      hash,
      email
    }).then(() => {
      return trx('users')
        .insert({
          name,
          email,
          joined: new Date()
        })
        .returning('*')
        .then(user => user[0])
    })
      .then(trx.commit)
      .catch(() => trx.rollback('Email已被使用，請更換Email'))
  })
  .catch((err) => {
    if(err === 'Email已被使用，請更換Email') return Promise.reject(err)
    return Promise.reject('連線發生錯誤，請再試一次')
  })
}

const createToken = (user, redisClient, jwt) => {
  const { email, id } = user
  const jwtPayload = { email }
  const expire = 24 * 60 * 60
  const token = jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: expire });
  const setAsync = promisify(redisClient.set).bind(redisClient)
  return setAsync(token, id, 'EX', expire)
    .then(() => ({ token }))
    .catch(() => Promise.reject('發生錯誤，請再登入一次'))
}

const registerAuthentication = (db, bcrypt, redisClient, jwt) => (req, res) => {
  registerHandler(db, bcrypt, req, res)
    .then(user => createToken(user, redisClient, jwt))
    .then(token => res.json(token))
    .catch(err => res.status(400).json(err))
}

module.exports = registerAuthentication
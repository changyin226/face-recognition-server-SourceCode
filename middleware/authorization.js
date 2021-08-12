const requireAuth = (redisClient) => (req, res, next) => {
  let { authorization } = req.headers
  if (!authorization) return res.status(401).json('未經授權')
  authorization = authorization.replace('Bearer ', '')
  redisClient.get(authorization, (err, reply) => {
    if (err || !reply) return res.status(401).json('授權過期，請重新登入')
    return next()
  })
}

module.exports = requireAuth
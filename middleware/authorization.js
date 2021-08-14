const requireAuth = (redisClient) => (req, res, next) => {
  let { authorization } = req.headers
  if (!authorization) return res.status(401).json('未經授權')
  authorization = authorization.replace('Bearer ', '')
  redisClient.get(authorization, (err, reply) => {
    if (err || !reply) return res.status(401).json('授權過期，請重新登入')
    const { id } = req.params
    if(id) {
      if(reply !== id) {
        return res.status(401).json('該Token不能查找此筆資料')
      }
      return next()
    }
    return next()
  })
}

module.exports = requireAuth
const getProfileHandler = (db) => (req, res) => {
  const { id } = req.params;
  db('users').where({id})
    .then(user => {
      const response = {
        user: user[0],
        message: '登入成功'
      }
      return res.json(response)
    })
    .catch(() => res.status(400).json('連線發生錯誤，請重新登入一次'))
}

module.exports = getProfileHandler
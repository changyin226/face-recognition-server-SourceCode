const Clarifai = require('clarifai')

const app = new Clarifai.App({
  apiKey: process.env.CLARIFAI_KEY
});

const apiCallHandler = () => (req, res) => {
  app.models
    .predict(Clarifai.FACE_DETECT_MODEL, req.body.input)
    .then(data => {
      if(!data.outputs[0].data.regions) return res.status(400).json('請提供含有明顯人臉的圖片')
      return res.json(data)
    })
    .catch(() => res.status(400).json('連線發生錯誤或圖片網址格式錯誤，請再試一次'))
}

const imageHandler = (db) => (req, res) => {
  const { id } = req.body
  db('users').where({id})
    .increment('entries', 1)
    .returning('entries')
    .then(entries => res.json(entries[0]))
    .catch(() => {res.status(400).json('總數增加發生錯誤，請再試一次')})
}

module.exports = {
  imageHandler,
  apiCallHandler
}
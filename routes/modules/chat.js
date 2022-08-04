const express = require('express')
const router = express.Router()
const chatController = require('../../controllers/chat-controller')

router.get('/', chatController.getChatPage)
router.get('/userinfo', chatController.getSelfInfo)
module.exports = router

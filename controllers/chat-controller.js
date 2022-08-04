const helpers = require('../_helpers')

const socketIoController = {
  getChatPage: (req, res, next) => {
    res.render('users/user-chat-room', { chatRoom: true })
  },
  getSelfInfo: (req, res, next) => {
    const currentUser = helpers.getUser(req)
    return res.json({ status: 'success', currentUser })
  }
}

module.exports = socketIoController

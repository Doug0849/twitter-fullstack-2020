const helpers = require('../_helpers')

const socketIoController = {
  getChatroom: (req, res, next) => {
    const currentUser = helpers.getUser(req)
    res.render('chatroom/chatroom', { currentUser, role: currentUser.role, chatRoom: true })
  },
  getSelfInfo: (req, res, next) => {
    const currentUser = helpers.getUser(req)
    return res.json({ status: 'success', currentUser })
  }
}

module.exports = socketIoController

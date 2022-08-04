const helpers = require('../_helpers')

const chatController = {
  getChatroom: (req, res, next) => {
    const currentUser = helpers.getUser(req)
    res.render('chatroom/chatroom', { currentUser, role: currentUser.role })
  }
}

module.exports = chatController

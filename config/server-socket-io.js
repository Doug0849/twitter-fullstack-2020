const { Server } = require('socket.io')
const { User, Message } = require('../models/')

const io = new Server(3200, {
  cors: { origin: ['http://localhost:3000'] }
})

io.on('connection', async socket => {
  const userId = socket.handshake.query.userId
  // 確認伺服器裡面沒有重複使用者
  // if (sockets.some(socket => socket.data.id === userId)) {
  //   return socket.disconnect()
  // }
  const user = await User.findByPk(userId, { raw: true })
  let sockets = await io.fetchSockets()
  const messages = await Message.findAll({
    include: {
      model: User,
      attributes: ['name', 'avatar'],
      as: 'Sender'
    },
    raw: true,
    nest: true,
    order: [['createdAt', 'ASC']]
  })

  socket.on('connecting', async () => {
    const userList = []
    if (user) {
      socket.data.id = user.id
      socket.data.name = user.name
      socket.data.account = user.account
      socket.data.avatar = user.avatar
      if (sockets) {
        sockets.forEach((socket, i) => {
          userList[i] = {
            id: socket.data.id,
            name: socket.data.name,
            account: socket.data.account,
            avatar: socket.data.avatar
          }
        })
      }
      const messageData = {
        senderId: socket.data.id,
        receiveId: null,
        content: '上線了'
      }
      await Message.create(messageData)
      io.emit('connecting', socket.data.name, userList, messages)
    }
  })
  socket.on('send-message', async (message, time) => {
    const messageData = {
      senderAvatar: socket.data.avatar,
      senderId: socket.data.id,
      receiveId: null,
      content: message
    }
    await Message.create(messageData)
    socket.broadcast.emit('receive-message', socket.data.avatar, message, time)
  })
  socket.on('disconnect', async () => {
    const userList = []
    sockets = await io.fetchSockets()
    if (sockets) {
      sockets.forEach((socket, i) => {
        userList[i] = {
          id: socket.data.id,
          name: socket.data.name,
          account: socket.data.account,
          avatar: socket.data.avatar
        }
      })
    }
    const messageData = {
      senderId: socket.data.id,
      receiveId: null,
      content: '已離開'
    }
    await Message.create(messageData)
    io.emit('disconnect-message', socket.data.name, userList)
  })
})

module.exports = io

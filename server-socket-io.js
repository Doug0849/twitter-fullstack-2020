const app = require('./app')
const { createServer } = require('http')
const { Server } = require('socket.io')
const httpServer = createServer(app)
const port = process.env.PORT || 3000
const io = new Server(httpServer, { /* options */ })

const { User, Message } = require('./models')
const { Op } = require('sequelize')

io.on('connect', async socket => {
  const userId = socket.handshake.query.userId
  const socketId = socket.id
  // 以下為聊天室
  socket.on('connecting-chatroom', async () => {
    // 確認伺服器裡面沒有重複使用者
    const sockets = await io.fetchSockets()
    if (sockets.some(socket =>
      socket.data.id === userId &&
    )) {
      return socket.disconnect()
    }
    const user = await User.findByPk(userId, { raw: true })
    const messages = await Message.findAll({
      where: { receiverId: null },
      include: {
        model: User,
        attributes: ['name', 'avatar'],
        as: 'Sender'
      },
      raw: true,
      nest: true,
      order: [['createdAt', 'ASC']]
    })
    const userList = []
    if (user) {
      socket.data.id = user.id
      socket.data.socketId = socketId
      socket.data.name = user.name
      socket.data.account = user.account
      socket.data.avatar = user.avatar
      socket.join(socket.data.account)
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
      // const messageData = {
      //   senderId: socket.data.id,
      //   receiveId: null,
      //   content: '上線了'
      // }
      // await Message.create(messageData)
      io.emit('online', socket.data.name, userList)
      return io.to(socket.data.account).emit('connecting', messages)
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
    io.emit('chatroom-notice')
    return socket.broadcast.emit('receive-message', socket.data.avatar, message, time)
  })

  socket.on('disconnect', async () => {
    const userList = []
    const sockets = await io.fetchSockets()
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
    // const messageData = {
    //   senderId: socket.data.id,
    //   receiveId: null,
    //   content: '已離開'
    // }
    // await Message.create(messageData)
    return io.emit('disconnect-message', socket.data.name, userList)
  })
  // 以上為聊天室
  // 以下為連上私人時的事件
  socket.on('connecting-private', async () => {
    const user = await User.findByPk(userId,
      { attributes: ['id', 'name', 'account', 'avatar'] }
    )
    const users = await User.findAll({
      where: { id: { [Op.notIn]: [user.id] } },
      attributes: ['id', 'name', 'account', 'avatar']
    })
    if (!user) return
    socket.data.id = user.id
    socket.data.name = user.name
    socket.data.account = user.account
    socket.data.avatar = user.avatar
    socket.join(socket.data.account) // 連上私人頻道時，就將自己加入跟自己帳號一樣的房間

    const userList = users.map(user => ({ ...user.toJSON() }))

    // 只對自己發送，更新私聊清單事件，不對自己發送的話，其他連線到私人頻道的都會被影響
    return io.to(socket.data.account).emit('user-list', userList)
  })

  // 取得歷史訊息事件
  socket.on('get-pv-history', async receiverId => {
    const senderId = socket.data.id
    const messages = await Message.findAll({
      where: {
        senderId: [senderId, receiverId],
        receiverId: [senderId, receiverId]
      },
      include: { model: User, as: 'Sender' },
      raw: true,
      nest: true
    })
    // 要再補一個撈出來的訊息當中，如果receiver是自己的，就要在have_read改為true
    // 只對自己發送取得歷史訊息的事件
    return io.to(socket.data.room).emit('get-pv-history', messages)
  })
  // 寄出私人訊息事件
  socket.on('send-pv-msg', async (message, time, room, receiverId) => {
    const messageData = {
      senderId: socket.data.id,
      receiverId: receiverId,
      content: message,
      have_read: false
    }
    // 資料庫紀錄訊息
    await Message.create(messageData)
    const senderData = {
      id: socket.data.id,
      name: socket.data.name,
      account: socket.data.account,
      avatar: socket.data.avatar
    }
    // 對指定房間發送訊息
    io.to(room).emit('private-notice')
    return io.to(room).emit('receive-pv-msg', senderData, message, time)
  })
})

httpServer.listen(port, () => {
  console.info(`Example app listening on http://localhost:${port}`)
})

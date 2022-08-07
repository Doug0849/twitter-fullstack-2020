const app = require('./app')
const { createServer } = require('http')
const { Server } = require('socket.io')
const httpServer = createServer(app)
const port = process.env.PORT || 3000
const io = new Server(httpServer, { /* options */ })

const { User, Message, Notice, Readuser } = require('./models')
const { Op } = require('sequelize')

io.on('connect', async socket => {
  const userId = socket.handshake.query.userId
  const socketId = socket.id
  socket.on('check-new-message', () => {
    checkNewMessage(userId, socketId)
  })
  // // 以下為聊天室
  socket.on('connecting-chatroom', async () => {
    io.socketsJoin('public')
    // 確認伺服器裡面沒有重複使用者
    const sockets = await io.fetchSockets()
    if (sockets.some(socket => socket.data.id === userId)) {
      return socket.disconnect()
    }
    // 從資料庫找出使用者自己的資料
    const user = await User.findByPk(userId, { raw: true })
    // 進到聊天室就找出所有公共訊息
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
    // 將所有公共訊息的id序號存入清單
    const messagesId = messages.map(message => {
      return message.id
    })
    // 最後一個message是否已經被自己讀過
    const lastReadMessage = await Readuser.findAll({
      where: { readId: userId },
      order: [['messageId', 'DESC']],
      limit: 1,
      raw: true
    })
    // 如果找不到任何符合的，代表一次都沒讀過，全部message寫入Readuser做紀錄
    if (!lastReadMessage[0]) {
      messagesId.map(async messageId => {
        return await Readuser.create({
          messageId: messageId,
          readId: userId
        })
      })
    }
    const messageLastIdIndex = messagesId.length - 1
    const messageId = messagesId[messageLastIdIndex]
    // 確認是否最後一個訊息沒有讀，如果找不出資料代表沒讀
    // 就從上一個有找到的message_id + 1開始，到最後一個，全部寫入，如果有找出代表有讀過
    const lastNoReadMessage = await Readuser.findAll({
      where: { messageId: messageId, readId: userId },
      raw: true
    })
    console.log(lastNoReadMessage)
    // if (!lastNoReadMessage[0]) {
    //   messagesId.map(async id => {
    //     if (id > lastReadMessage[0].messageId) {
    //       return await Readuser.create({
    //         messageId: id,
    //         readId: userId
    //       })
    //     }
    //   })
    // }

    // 將使用者資料存入socket.data
    // const userList = []
    // if (user) {
    //   socket.data.id = user.id
    //   socket.data.socketId = socketId
    //   socket.data.name = user.name
    //   socket.data.account = user.account
    //   socket.data.avatar = user.avatar
    //   socket.join(socket.data.account)
    //   // 所有sockets在線使用者，將自己的socket資料存入使用者清單
    //   if (sockets) {
    //     sockets.forEach((socket, i) => {
    //       userList[i] = {
    //         id: socket.data.id,
    //         name: socket.data.name,
    //         account: socket.data.account,
    //         avatar: socket.data.avatar
    //       }
    //     })
    //   }
    // }
    //     // const set = new Set()
    //     // const noDubleUserList = userList.filter(u => !set.has(u.id) ? set.add(u.id) : false)
    //     // 傳訊給所有人online事件
    //     io.emit('online', socket.data.name, userList)
    //     // 回應自己show-public-history事件
    //     return io.to(socket.data.account).emit('show-public-history', messages)
    //   }
  })

  // socket.on('send-message', async (message, time) => {
  //   const messageData = {
  //     senderAvatar: socket.data.avatar,
  //     senderId: socket.data.id,
  //     receiveId: null,
  //     content: message
  //   }
  //   await Message.create(messageData)
  //   // 發送訊息後立刻寫入已讀當中
  //   const lastMessageId = await Message.findAll({
  //     where: { receiverId: null },
  //     order: [['createdAt', 'DESC']],
  //     limit: 1,
  //     raw: true
  //   })
  //   const readUserData = {
  //     messageId: lastMessageId[0].id,
  //     readId: userId
  //   }
  //   await Readuser.create(readUserData)
  //   return socket.broadcast.emit('receive-message', socket.data.avatar, message, time)
  // })

  // socket.on('disconnect', async () => {
  //   const userList = []
  //   const sockets = await io.fetchSockets()
  //   if (sockets) {
  //     sockets.forEach((socket, i) => {
  //       userList[i] = {
  //         id: socket.data.id,
  //         name: socket.data.name,
  //         account: socket.data.account,
  //         avatar: socket.data.avatar
  //       }
  //     })
  //   }
  //   return io.emit('disconnect-message', socket.data.name, userList)
  // })
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
    // 如果receiver是自己，所有的have_read改為true，已讀
    await Message.update({ haveRead: true }, {
      where: {
        receiverId: userId,
        haveRead: false
      }
    })
    // 只對自己發送取得歷史訊息的事件
    return io.to(socket.data.account).emit('get-pv-history', messages)
  })
  // 寄出私人訊息事件
  socket.on('send-pv-msg', async (message, time, receiveSocketUser, receiverId) => {
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
    io.to(receiveSocketUser).emit('private-notice')
    return io.to(receiveSocketUser).emit('receive-pv-msg', senderData, message, time)
  })
})

// 伺服器監聽
httpServer.listen(port, () => {
  console.info(`Example app listening on http://localhost:${port}`)
})

// 以下為是否有新訊息確認
async function checkNewMessage(userId, selfSocketId) {
  try {
    let noNewPv = false
    let noNotice = false
    let noNewPublic = false
    // 確認有沒有新私訊
    const checkPvNewMessage = await Message.findAll({
      where: { receiverId: userId, have_read: false },
      order: [['createdAt', 'DESC']],
      limit: 1
    })
    if (!checkPvNewMessage[0]) {
      noNewPv = true
    }
    io.to(selfSocketId).emit('private-notice', noNewPv)

    // 確認有沒有新通知
    const checkNotice = await Notice.findAll({
      where: { receivedId: userId, isChecked: false },
      order: [['createdAt', 'DESC']]
    })

    if (!checkNotice[0]) {
      noNotice = true
    }
    io.to(selfSocketId).emit('check-notice', noNotice)

    // 確認有沒有新的公共未讀
    // 先找出最後一個公共message id
    const lastPublicMessage = await Message.findAll({
      where: { receiverId: null },
      order: [['createdAt', 'DESC']],
      limit: 1,
      raw: true
    })
    const lastPublicMessageId = lastPublicMessage[0].id
    // 確認讀過的資料中，有沒有我對最後一個message id讀過的紀錄
    const checkReadLastMessage = await Readuser.findAll({
      where: { messageId: lastPublicMessageId, readId: userId },
      raw: true
    })
    // 如果是空的，代表有讀過，代表沒有新訊息
    if (checkReadLastMessage[0]) {
      noNewPublic = true
    }
    io.to(selfSocketId).emit('check-public', noNewPublic)
  } catch (err) {
    console.log(err)
  }
}

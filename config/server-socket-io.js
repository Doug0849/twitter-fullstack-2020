// server 端用物件來建立 socket.io，
const { Server } = require('socket.io')

// 建立伺服器，PORT為3200
const io = new Server(3200, {
  // 伺服器雖然架在3200，但是是透過 express.js localhost:3000 才進來的
  cors: {
    origin: ['http://localhost:3000']
  }
})

// 伺服器連線時
io.on('connection', async socket => {
  // 有人連線先cosole.log他的id
  console.log(socket.id)
  // 將所有使用者存起來
  let sockets = await io.fetchSockets()
  // --------------------------------------------------------
  // 回應connecting事件處理方式，將傳來的name傳給所有人(io.emit包含自己)
  socket.on('connecting', self => {
    const userList = []
    if (self) {
      // 確認伺服器裡面沒有重複使用者
      // const joinUserId = self.id
      // if (sockets.some(socket => socket.data.id === joinUserId)) {
      //   return socket.disconnect()
      // }
      // 將自己的資料丟進自己的socket中
      socket.data.id = self.id
      socket.data.name = self.name
      socket.data.account = self.account
      socket.data.avatar = self.avatar
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
      io.emit('connecting', self.name, userList)
    }
  })
  // --------------------------------------------------------
  // 伺服器收到 socket.on，參數事件名稱 'send-message' 時，
  // 將從客戶端發來的多個參數用一個函式處理。
  socket.on('send-message', (who, message, room, time) => {
    if (room === '') {
      socket.broadcast.emit('receive-message', who, message, time)
    } else {
      // 這個to的用法是傳給某個使用者ID訊息，其他人看不到。
      // 所以將其他使用者id貼到room的input，就可以拿這個參數來傳私訊
      socket.to(room).emit('receive-message', who, message)
    }
  })
  // --------------------------------------------------------
  // 收到斷線訊息後的處理
  socket.on('disconnect', async () => {
    const userList = []
    // 重新取得名單
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
    // 將名單發送disconnect-message事件給全部人
    io.emit('disconnect-message', socket.data.name, userList)
  })
})

module.exports = io

(async function getUserAndConnect() {
  try {
    const res = await axios.get('/chatroom/userinfo')
    const userId = res.data.currentUser.id
    const socket = io({ query: { userId } })

    // 聊天室選取聊天室介面元素
    // 從這開始
    const mainLogs = document.querySelector('#main-logs')
    if (mainLogs) {
      socket.on('connect', async () => {
        socket.emit('connecting-chatroom')
      })
      const chatForm = document.querySelector('#chat-form') || ''
      const connectUsers = document.querySelector('#connect-users')
      const inputMessage = document.querySelector('#input-message')

      chatForm.addEventListener('submit', e => {
        e.preventDefault()
        const message = inputMessage.value
        const time = createTime()

        if (message === '') return
        socket.emit('send-message', message, time)
        displayMessage(message, time)
        inputMessage.value = ''
      })

      socket.on('show-public-history', messages => {
        displayHistory(messages)
      })

      socket.on('online', (someoneName, connectUsers) => {
        noticeOnline(someoneName)
        updateConnectUsers(connectUsers)
      })

      socket.on('receive-message', (senderAvatar, message, time) => {
        receiveMessage(senderAvatar, message, time)
      })

      socket.on('disconnect', self => {
        console.log(socket.connected)
      })

      socket.on('disconnect-message', (name, connectUsers) => {
        disconnectMessage(name)
        updateConnectUsers(connectUsers)
      })

      // -------------------------------------------------
      

      function displayMessage(message, time) {
        mainLogs.innerHTML = `
  <div class="row g-0 align-items-end justify-content-end mb-2 me-2">
              <div class="col-7 row justify-content-end">
                <p class="col-auto sended-msg bg-brand fs-6 py-2 px-3 mb-0 fw-light text-white"
                  style="border-radius: 1rem 1rem 0 1rem;">
                  ${message}
                </p>
              </div>
                <small class="col-12 msg-time text-black-50 fw-bold text-end" style="font-size: 0.5rem;">${time}</small>
            </div>
  ` + mainLogs.innerHTML
      }

      function receiveMessage(someoneAvatar, message, time) {
        mainLogs.innerHTML = `
  <div class="row g-0 align-items-end justify-content-start mb-2" style="max-width: 60%;">
              <div class="col-1">
                <img src="${someoneAvatar}" alt="" class="logs-avatar ms-2 rounded-circle"
                  style="object-fit: cover; height: 40px; weight:40px;">
              </div>
              <div class="col-11 row justify-content-start">
                <p class="col-auto received-msg bg-secondary bg-opacity-25 fs-6 py-2 px-3 mb-0 fw-light"
                  style="border-radius: 1rem 1rem 1rem 0; max-weight:50%; margin-left: 20px;">
                  ${message}
                </p>
              </div>
                <small class="col-12 msg-time text-black-50 fw-bold text-start" style="font-size: 0.5rem; margin-left: 51px;">${time}</small>
            </div>
  ` + mainLogs.innerHTML
      }

      function updateConnectUsers(onlineList) {
        connectUsers.innerHTML = ''
        onlineList.forEach(user => {
          connectUsers.innerHTML =
            `
    <div class="user-wrapper border-bottom mb-2 p-2">
    <img src="${user.avatar}" alt="" class="avatar-sm rounded-circle" id="chatroom-avatar-{{this.id}}">
    <strong>${user.name}</strong>
    <span>@${user.account}</span>
    </div>
    ` + connectUsers.innerHTML
        })
      }

      function disconnectMessage(name) {
        mainLogs.innerHTML = `
  <div class="row g-0 justify-content-center mb-2">
              <span
                class="col-auto badge rounded-pill bg-secondary bg-opacity-25 py-1 px-2 fw-light text-secondary">${name}已離開</span>
            </div>` + mainLogs.innerHTML
      }

      function createTime() {
        const date = new Date()
        let hour = date.getHours()
        let minutes = date.getMinutes()
        let word = '上午'

        if (hour >= 12) {
          hour = hour - 12
          word = '下午'
        }

        if (hour === 0) {
          hour = 0
        }

        minutes = minutes < 10 ? '0' + minutes : minutes
        return `${word} ${hour}:${minutes}`
      }

      function displayHistory(messages) {
        messages.forEach(msg => {
          if (msg.content.includes('上線了')) {
            return noticeOnline(msg.Sender.name)
          }
          if (msg.content.includes('已離開')) {
            return disconnectMessage(msg.Sender.name)
          }
          if (msg.senderId === userId) {
            const time = formatTime(msg.createdAt)
            return displayMessage(msg.content, time)
          }
          if (msg.senderId !== userId) {
            const time = formatTime(msg.createdAt)
            return receiveMessage(msg.Sender.avatar, msg.content, time)
          }
        })
      }

      function formatTime(time) {
        let word = ''
        const timeArray = time.slice(11, 16).split(':')
        let hour = Number(timeArray[0]) + 8
        if (hour > 24) {
          hour -= 24
          word = '上午'
        }
        if (hour > 12) {
          hour -= 12
          word = '下午'
        }
        if (hour < 12) {
          hour = '0' + hour.toString()
          word = '上午'
        }
        return word + ' ' + hour + ':' + timeArray[1]
      }
    }
    // 到這裡
  } catch (err) {
    console.log(err)
  }
})()

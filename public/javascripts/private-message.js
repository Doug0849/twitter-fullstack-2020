const chatroomMenu = document.querySelector('#chatroom')
const userId = Number(chatroomMenu.dataset.userid)
const socket = io({ query: { userId } }) // io('http://localhost:3200', { query: { userId } })
socket.on('connect', async () => {
  socket.emit('connecting-private')
})
// 私訊時的私訊介面元素及全域變數
let room
let receiverId
const mainLogs = document.querySelector('#main-logs')
const pvMsgNotice = document.querySelector('#private-notice') || ''
const chatroomNotice = document.querySelector('#chatroom-notice') || ''
if (mainLogs) {
  const chatForm = document.querySelector('#chat-form') || ''
  const userList = document.querySelector('#users-list') || ''
  const inputMessage = document.querySelector('#input-message') || ''
  const sendButton = document.querySelector('#send-message') || ''
  const logsTitleName = document.querySelector('#logs-title-name') || ''
  const logsTitleAccount = document.querySelector('#logs-title-account') || ''
  socket.on('user-list', userList => {
    shoAllUser(userList)
  })

  // 使用者卡片被點擊時
  userList.addEventListener('click', async e => {
    room = e.target.dataset.account
    receiverId = e.target.dataset.userid
    logsTitleName.textContent = e.target.dataset.name
    logsTitleAccount.textContent = '@' + e.target.dataset.account
    sendButton.removeAttribute('disabled')
    getPvHistory(receiverId)
  })

  chatForm.addEventListener('submit', e => {
    e.preventDefault()
    const message = inputMessage.value
    const time = createTime()

    if (message === '') return
    socket.emit('send-pv-msg', message, time, room, receiverId)
    displayMessage(message, time)
    inputMessage.value = ''
  })

  socket.on('receive-pv-msg', (senderData, message, time) => {
    logsTitleName.textContent = senderData.name
    logsTitleAccount.textContent = '@' + senderData.account
    getPvHistory(senderData.id) // 取得所有訊息包含剛剛最新的傳送的
    room = senderData.account
    receiverId = senderData.id
    sendButton.removeAttribute('disabled')
  })

  // 對伺服器送來的 get-pv-history 事件，做呈現訊息到版面的動作。
  socket.on('get-pv-history', messages => {
    displayHistory(messages)
  })

  // -------------------------------------------------
  // function
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

  function shoAllUser(onlineList) {
    userList.innerHTML = ''
    onlineList.forEach(user => {
      userList.innerHTML =
        `
    <div class="user-wrapper border-bottom mb-2 p-2 position-relative h-100">
    <div class="position-absolute w-100 h-100 user-btn" data-userid="${user.id}" data-account="${user.account}" data-name="${user.name}"></div>
    <img src="${user.avatar}" alt="" class="avatar-sm rounded-circle" id="chatroom-avatar-{{this.id}}">
    <strong>${user.name}</strong>
    <span>@${user.account}</span>
    </div>
    ` + userList.innerHTML
    })
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

  function getPvHistory(receiverId) {
    mainLogs.innerHTML = ''
    return socket.emit('get-pv-history', receiverId)
  }

  function displayHistory(messages) {
    messages.forEach(msg => {
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
    } else if (hour > 12) {
      hour -= 12
      word = '下午'
    } else {
      hour = '0' + hour.toString()
      word = '下午'
    }
    return word + ' ' + hour + ':' + timeArray[1]
  }
}

socket.on('private-notice', () => {
  pvMsgNotice.removeAttribute('hidden')
})

socket.on('chatroom-notice', () => {
  chatroomNotice.removeAttribute('hidden')
})

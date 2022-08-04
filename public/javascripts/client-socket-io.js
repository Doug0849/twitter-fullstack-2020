// client 端載入 socket.io
// 需先在main.hbs掛載CDN socket.io才有辦法const socket = io()
// socket伺服器架在localhost:3200
const socket = io('http://localhost:3200')
const socketId = socket.id
let res
let self
// 當伺服器連上線時connect
socket.on('connect', async () => {
  // 每次連線，先透過api取得自身資料
  res = await axios.get('/chatroom/userinfo')
  self = res.data.currentUser
  // --------------------------------------------------------
  // 等伺服器建立連線後
  // 馬上發送第一個事件connecting到伺服器，參數夾帶自己的資料
  socket.emit('connecting', self)
  // 發送connecting事件
})

// 選取聊天室介面元素
const connectUsers = document.querySelector('#connect-users')
const mainLogs = document.querySelector('#main-logs')
const inputMessage = document.querySelector('#input-message')
const chatForm = document.querySelector('#chat-form')

// 當form表單送出的時候
chatForm.addEventListener('submit', e => {
  e.preventDefault()
  const message = inputMessage.value
  const time = new Date().getHours() + ':' + new Date().getMinutes()
  // const someone = self.name + `(${socket.id.slice(0, 5)})`
  const someoneAvatar = self.avatar

  if (message === '') return

  // socket.emit 為發送訊息給伺服器，第1個參數為事件名稱 send-message
  // 第2,3,4,5...參數可以是任何物件，接著看到伺服器端
  socket.emit('send-message', someoneAvatar, message, time)
  displayMessage('mySelf', message, time)
  inputMessage.value = ''
})

socket.on('connecting', (selfName, connectUsers) => {
  noticeOnline(selfName)
  updateconnectUsers(connectUsers)
})

socket.on('receive-message', (someoneAvatar, message, time) => {
  receiveMessage(someoneAvatar, message, time)
})

// 一離開畫面就會送出斷線訊息
socket.on('disconnect', self => {
  console.log(socket.connected)
})

// 從伺服器接到 disconnect-message事件後顯示disconnectMessage和更新名單
socket.on('disconnect-message', (name, connectUsers) => {
  disconnectMessage(name)
  updateconnectUsers(connectUsers)
})

// -------------------------------------------------
// function
function noticeOnline (userName) {
  mainLogs.innerHTML += `
  <div class="row g-0 justify-content-center mb-2">
              <span
                class="col-auto badge rounded-pill bg-secondary bg-opacity-25 py-1 px-2 fw-light text-secondary">${userName}上線了</span>
            </div>`
}

function displayMessage (someoneAvatar, message, time) {
  mainLogs.innerHTML += `
  <div class="row g-0 align-items-end justify-content-end mb-2 me-2">
              <div class="col-7 row justify-content-end">
                <p class="col-auto sended-msg bg-brand fs-6 py-2 px-3 mb-0 fw-light text-white"
                  style="border-radius: 1rem 1rem 0 1rem;">
                  ${message}
                </p>
              </div>
                <small class="col-12 msg-time text-black-50 fw-bold text-end" style="font-size: 0.5rem;">${time}</small>
            </div>
  `
}

function receiveMessage (someoneAvatar, message, time) {
  mainLogs.innerHTML += `
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
  `
}

function updateconnectUsers (onlineList) {
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

function disconnectMessage (name) {
  mainLogs.innerHTML += `
  <div class="row g-0 justify-content-center mb-2">
              <span
                class="col-auto badge rounded-pill bg-secondary bg-opacity-25 py-1 px-2 fw-light text-secondary">${name}已離開</span>
            </div>`
}

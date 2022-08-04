// client 端載入 socket.io
// 需先在main.hbs掛載CDN socket.io才有辦法const socket = io()
// socket伺服器架在localhost:3200
const socket = io('http://localhost:3200')
let res
let self
// 當伺服器連上線時connect
socket.on('connect', async () => {
  // 每次連線，先透過api取得自身資料
  res = await axios.get('/chat/userinfo')
  self = res.data.currentUser
  // --------------------------------------------------------
  // 等伺服器建立連線後
  // 馬上發送第一個事件connecting到伺服器，參數夾帶自己的資料
  socket.emit('connecting', self)
  // 發送connecting事件
})

// 選取聊天室介面元素
const userList = document.querySelector('#user-list')
const displayBox = document.querySelector('#display-box')
const joinRoomButton = document.querySelector('#room-button')
const messageInput = document.querySelector('#message-input')
const roomInput = document.querySelector('#room-input')
const form = document.querySelector('#form')

// 當form表單送出的時候
form.addEventListener('submit', e => {
  e.preventDefault()
  const message = messageInput.value
  const time = new Date().getHours() + ':' + new Date().getMinutes()
  const room = roomInput.value
  const who = self.name + `(${socket.id.slice(0, 5)})`

  if (message === '') return

  // socket.emit 為發送訊息給伺服器，第1個參數為事件名稱 send-message
  // 第2,3,4,5...參數可以是任何物件，接著看到伺服器端
  socket.emit('send-message', who, message, room, time)
  displayMessage('mySelf', message, time)
  messageInput.value = ''
})

socket.on('connecting', (selfName, userList) => {
  noticeOnline(selfName)
  updateUserList(userList)
})

socket.on('receive-message', (who, message, room, time) => {
  displayMessage(who, message, room, time)
})

// 一離開畫面就會送出斷線訊息
socket.on('disconnect', self => {
  console.log(socket.connected)
})

// 從伺服器接到 disconnect-message事件後顯示disconnectMessage和更新名單
socket.on('disconnect-message', (name, userList) => {
  disconnectMessage(name)
  updateUserList(userList)
})

// -------------------------------------------------
// function
function noticeOnline(userName) {
  displayBox.innerHTML = `
  <span>(${userName})上線了</span><br>` + displayBox.innerHTML
}

function displayMessage(who, message, time) {
  displayBox.innerHTML = `
  <span>${who}說: ${message} ${time}</span><br>` + displayBox.innerHTML
}

function updateUserList(onlineList) {
  userList.innerHTML = ''
  onlineList.forEach(user => {
    userList.innerHTML = `
    <img src="${user.avatar}" class="avatar-sm" alt="">
    <span>${user.name}@${user.account}在線</span><br>` + userList.innerHTML
  })
}

function disconnectMessage(name) {
  displayBox.innerHTML = `
  <span>${name}已離開</span><br>` + displayBox.innerHTML
}

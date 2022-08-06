
dayjs.extend(window.dayjs_plugin_relativeTime)

let page = 2
const url = window.location.protocol + '//' + window.location.host + '/api/tweets/'
const observeTarget = document.getElementById('tweets-end')

const observer = new IntersectionObserver(function (entries) {
  if (entries[0].intersectionRatio <= 0) return
  lazyLoading()
})

// 開始觀察
observer.observe(observeTarget)

async function lazyLoading () {
  try {
    observer.unobserve(observeTarget)
    const response = await axios.get(url + page)
    const user = response.data.currentUser
    const tweets = response.data.tweets
    if (!tweets.length) {
      endHTML()
      activeLikeBtn()
      activeReplyBtn()
    }
    await tweets.forEach(tweet => {
      injectHTMl(getTemplate(tweet, user))
    })
    const newObserveTarget = document.getElementById('tweets-end')
    observer.observe(newObserveTarget)
    activeLikeBtn()
    activeReplyBtn()
    page++
  } catch (error) {
    console.error(error)
  }
}

function injectHTMl (content) {
  const target = document.querySelector('.tweet-container')
  const innerHTML = target.innerHTML
  const index = innerHTML.indexOf('<div id="tweets-end')
  const front = innerHTML.slice(0, index - 1)
  const end = innerHTML.slice(index)
  target.innerHTML = front + content + end
}

function endHTML () {
  const target = document.querySelector('.tweet-container')
  const innerHTML = target.innerHTML
  const index = innerHTML.indexOf('<div id="tweets-end')
  const front = innerHTML.slice(0, index - 1)
  const end = getEndHTML()
  target.innerHTML = front + end
}

function getTemplate (tweet, user) {
  let innerHTML = ''
  innerHTML += `
  <div class="tweet-cards border-bottom border-1 mb-2">
          <div class="d-flex flex-nowrap ms-3 mt-3">
            <div class="avatar-container me-1">
              <a href="/users/${tweet.User.id}/tweets">
                <img src="${tweet.User.avatar}" alt="" class="avatar-sm rounded-pill"
                  id="tweet-avatar-${tweet.User.id}">
              </a>
            </div>
            <div class="user-description-container d-flex flex-column text-start ms-1 me-3 w-100">
              <div class="user-name-account mb-2">
                <a href="/users/${tweet.User.id}/tweets" class="name-link">
                  <h6 class="user-name fw-bold fs-5 " id="tweet-name-${tweet.User.id}">${tweet.User.name}</h6>
                </a>
                <a href="/users/${tweet.User.id}/tweets" class="account-link">
                  <span class="user-account fw-normal fs-6"
                    id="tweet-account-${tweet.User.id}">@${tweet.User.account}</span>
                </a>
                <span class="fw-normal fs-6" id="tweet-time-${tweet.id}">・${dayjs(tweet.createdAt).fromNow()}</span>
              </div>
              <a href="/tweets/${tweet.id}/replies" class="description-link">
                <div class="description me-4" id="description-${tweet.id}">
                  <p class="description-content">${tweet.description}</p>
                </div>
              </a>
              <div class="description-like-btn-container mb-3">
                <button class="reply-btn me-5 d-flex align-items-center" data-bs-toggle="modal"
                  data-bs-target="#reply-modal-${tweet.id}" data-tweetid="${tweet.id}" data-userid="${tweet.User.id}">
                  <i class="reply"></i>
                  <span class="reply-count ms-2" id="reply-count-${tweet.id}">${tweet.Replies.length}</span>
                </button>
  `
  if (tweet.isLiked) {
    innerHTML += `
    <button type="button" class="d-flex align-items-center like-submit-btn liked"data-tweetid="${tweet.id}">
      <i class="like"></i>
      <span class="like-count ms-2">${tweet.Likes.length}</span>
    </button>
    `
  } else {
    innerHTML += `
    <button type="button" class="d-flex align-items-center like-submit-btn" data-tweetid="${tweet.id}">
      <i class="like outline-like"></i>
      <span class="like-count ms-2">${tweet.Likes.length}</span>
    </button>
    `
  }
  innerHTML += `
        </div>
      </div>
    </div>
  </div>
  `
  innerHTML += `
  <div class="modal fade" id="reply-modal-${tweet.id}" tabindex="-1" aria-labelledby="ModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header d-flex justify-content-start">
          <i class="close ms-0" data-bs-dismiss="modal" aria-label="Close"></i>
        </div>
        <div class="reply-wrapper d-flex flex-wrap mt-3 ms-3">
          <div class="modal-avatar-container me-1">
            <div class="modal-avatar-border">
              <img src="${tweet.User.avatar}" alt="" class="avatar-sm rounded-pill modal-user-avatar"
                id="modal-user-avatar">
            </div>
          </div>
          <div class="modal-description-container d-flex flex-column text-start ms-1">
            <div class="user-name-account mb-2">
              <span class="modal-user-name fw-bold fs-5" id="modal-user-name">${tweet.User.name}</span>
              <span class="modal-user-account fw-normal fs-6" id="modal-user-account">@${tweet.User.account}</span>
              <span class="modal-time fw-normal fs-6" id="modal-time">${dayjs(tweet.createdAt).fromNow()}</span>
            </div>
            <p class="modal-description me-4" id="modal-description">${tweet.description}</p>
          </div>
        </div>
        <div class="tweet-input modal-body">
          <form action="/tweets/${tweet.id}/replies" method="POST" class="reply-form needs-validation" id="reply-form"
            data-userid="${user.id}" data-tweetid="${tweet.id}">
            <div class="d-flex flex-wrap mt-1">
              <div class="me-1">
                <img src="${user.avatar}" alt="" class="avatar-sm rounded-pill">
              </div>
              <textarea class="reply-description-input w-auto border border-0 ms-1 mb-1" name="comment" id="comment-${tweet.id}" cols="65" rows="8" placeholder="有什麼新鮮事？" maxlength="140"></textarea>
            </div>
            <div class="modal-footer border border-0">
              <div class="d-flex justify-content-end align-times-center w-100 mb-3">
                <div class="reply-description-length text-black-50 ms-auto me-3 fs-6 align-self-center"
                  id="reply-description-length"></div>
                <button type="submit" class="reply-btn-send send-button btn btn-brand rounded-pill px-3 me-3"
                  id="reply-btn-send" data-userid="${user.id}" data-tweetid="${tweet.id}" data-bs-dismiss="modal" disabled>回覆</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
  `
  return innerHTML
}

function getEndHTML () {
  return `
  <div class="tweet-cards border-bottom border-1 mb-2">
    <div class="d-flex flex-nowrap ms-3 mt-3">
      <div class="avatar-container me-1">
        <a href="#">
          <i class="logo avatar-sm rounded-pil"></i>
        </a>
      </div>
      <div class="user-description-container d-flex flex-column text-start ms-1 me-3 w-100">
        <div class="user-name-account mb-2">
          <a href="#" class="name-link">
            <h6 class="user-name fw-bold fs-5 ">Alphitter</h6>
          </a>
          <a href="/tweets" class="account-link">
            <span class="user-account fw-normal fs-6">@Alphitter</span>
          </a>
        </div>
        <div class="description me-4" id="description-{{this.id}}">
          <ul>
            <li>
              <h5 class="description-content">歡迎使用Alphitter：</h1>
            </li>
            <li>此為預設說明 α 文，若想開始追蹤使用者推文，可以嘗試點擊右側推薦名單，並重新整理頁面，即可看到追蹤者的 α 文。</li>
            <li>您可以透過上方輸入框，輸入想說的話，來發出自己的第一則 α 文。</li>
            <li>左側推文按鈕則是可以讓你隨時隨地想發推就發推。</li>
            <li>追蹤後，可以透過回文按鈕來回覆 α 文，也可以透過點擊愛心，來加入喜歡的 α 文。</li>
            <li>左邊個人資料，可以看到自己的版面，自己的推文，自己的回覆，自己的喜歡 α 文。</li>
            <li>自己的版面點擊跟隨中文字以及跟隨者，能看到正在追隨清單和追隨者單。</li>
            <li>自己的版面點擊編輯個人資料，可以編輯大頭照、背景圖、名稱、自我介紹。</li>
            <li>左邊設定為帳號相關設定，可以設定自己的帳號(不得和他人重複)、名稱、email(不得和他人重複)、重設密碼</li>
            <li>右側為熱門推薦使用者，可以瞧瞧他們 α 了什麼?<br></li>
            <li>點擊追蹤者或自己的推文，可以進到推文的回覆詳細頁面，來看看大家回應了些什麼<br></li>
            <li>您也可以在推文的回覆詳細頁面，點擊回覆按鈕來回覆，愛心按鈕加入喜歡<br></li>
            <li>您也可以觀看別人的版面，來瞧瞧別人都發了些什麼 α 文，回覆了那些內容，以及喜歡的 α 文<br></li>
            </p>
            </ol>
        </div>
      </div>
    </div>
  </div>
  `
}

function activeLikeBtn () {
  const likeSubmitBtn = document.querySelectorAll('.like-submit-btn')
  const likedIcon = document.querySelectorAll('.like') || ''
  const likedNumbers = document.querySelectorAll('.like-count') || ''
  likeSubmitBtn.forEach((btn, i) => {
    btn.addEventListener('click', async e => {
      try {
        const tweetId = btn.dataset.tweetid || ''
        if (btn.matches('.liked')) {
          likedNumbers[i].textContent--
          btn.classList.toggle('liked')
          likedIcon[i].classList.toggle('outline-like')
          await axios.post(`/tweets/${tweetId}/unlike`)
        } else {
          likedNumbers[i].textContent++
          btn.classList.toggle('liked')
          likedIcon[i].classList.toggle('outline-like')
          await axios.post(`/tweets/${tweetId}/like`)
        }
      } catch (err) {
        console.log(err)
      }
    })
  })
}

function activeReplyBtn () {
  const replyForm = document.querySelectorAll('.reply-form') || ''
  const replyTextArea = document.querySelectorAll('.reply-description-input') || ''
  const replyDescriptionLength = document.querySelectorAll('.reply-description-length') || ''
  const replyTweetBtn = document.querySelectorAll('.reply-btn-send') || ''

  if (replyForm) {
    replyForm.forEach((form, i) => {
      replyForm[i].addEventListener('keyup', e => {
        if (replyTextArea[i].value.length === 0) {
          replyTweetBtn[i].setAttribute('disabled', '')
          replyDescriptionLength[i].classList.remove('text-black-50')
          replyDescriptionLength[i].classList.add('text-error')
          replyDescriptionLength[i].textContent = '內容不可空白'
        }
        if (replyTextArea[i].value.length > 0) {
          replyTweetBtn[i].removeAttribute('disabled')
          replyDescriptionLength[i].classList.add('text-black-50')
          replyDescriptionLength[i].classList.remove('text-error')
          replyDescriptionLength[i].textContent = replyTextArea[i].value.length + '/140'
        }
        if (replyTextArea[i].value.length > 140) {
          replyTweetBtn[i].setAttribute('disabled', '')
          replyDescriptionLength[i].classList.remove('text-black-50')
          replyDescriptionLength[i].classList.add('text-error')
          replyDescriptionLength[i].textContent = '字數不可超過140字 , ' + replyTextArea[i].value.length + '/140'
        }
      })
    })

    replyForm.forEach((form, i) => {
      replyForm[i].addEventListener('click', async e => {
        if (e.target.classList.contains('reply-btn-send')) {
          e.preventDefault()
          e.stopPropagation()
          const userId = e.target.dataset.userid
          const tweetId = e.target.dataset.tweetid
          const comment = document.querySelector(`#comment-${tweetId}`)
          await axios.post(`/tweets/${tweetId}/replies`, {
            UserId: userId,
            TweetId: tweetId,
            comment: comment.value
          })
          comment.value = ''
          const count = document.querySelector(`#reply-count-${tweetId}`)
          const amount = Number(count.textContent) + 1
          count.textContent = amount
        }
      })
    })
  }
}

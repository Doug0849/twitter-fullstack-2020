
dayjs.extend(window.dayjs_plugin_relativeTime)

const url = 'http://' + window.location.host + '/api/tweets'

const intersectionObserver = new IntersectionObserver(function (entries) {
  if (entries[0].intersectionRatio <= 0) return
  lazyLoading()
})

// 開始觀察
intersectionObserver.observe(document.getElementById('tweets-end'))

function lazyLoading () {
  axios
    .get(url)
    .then(response => {
      const user = response.data.currentUser
      const tweets = response.data.tweets
      tweets.forEach(tweet => {
        injectHTMl(getTemplate(tweet, user))
      })
    })
    .catch(err => console.log(err))
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

function injectHTMl (content) {
  const target = document.querySelector('.tweet-container')
  const innerHTML = target.innerHTML
  const index = innerHTML.indexOf('<div id="first-tweet')
  const front = innerHTML.slice(0, index - 1)
  const end = innerHTML.slice(index)
  target.innerHTML = front + content + end
}

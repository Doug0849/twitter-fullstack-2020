const helpers = require('../_helpers')
const { getOffset } = require('../helpers/pagination-helper')
const getTopUser = require('../helpers/top-user-helper')
const {
  localFileHandler,
  imgurFileHandler
} = require('../helpers/file-helpers')
const fileHelper =
  process.env.NODE_ENV === 'production' ? imgurFileHandler : localFileHandler

const { User, Followship, Reply, Tweet, Like, Notice } = require('../models')

const apiController = {
  getUserInfo: async (req, res, next) => {
    try {
      const currentUserId = Number(helpers.getUser(req).id)
      const userId = Number(req.params.id)
      if (currentUserId !== userId) {
        return res.status(200).json({
          status: 'error',
          message: "Can not edit other user's account!"
        })
      }
      const existUser = await User.findByPk(userId, { raw: true })
      if (!existUser) throw new Error("Account didn't exist!")
      const name = existUser.name
      return res.json({ status: 'success', name, existUser })
    } catch (err) {
      next(err)
    }
  },
  postUserInfo: async (req, res, next) => {
    try {
      const currentUser = helpers.getUser(req)
      if (currentUser.id !== Number(req.params.id)) {
        return res.status(200).json({ status: 'error', message: '你只能編輯你自己的檔案' })
      }
      const editUser = await User.findByPk(Number(req.params.id))
      const { name, introduction } = req.body
      if (!name) {
        return res.status(200).json({ status: 'error', message: '名稱不能為空白' })
      }
      let avatar
      let coverPhoto
      if (req.files) {
        req.files.avatar ? (avatar = await fileHelper(req.files.avatar[0])) : (avatar = currentUser.avatar)
        req.files.coverPhoto
          ? (coverPhoto = await fileHelper(req.files.coverPhoto[0]))
          : (coverPhoto = currentUser.coverPhoto)
      }
      const patchedUser = await editUser.update({
        name,
        introduction,
        avatar,
        coverPhoto
      })
      res.json({ status: 200, data: patchedUser })
    } catch (err) {
      next(err)
    }
  },
  putFollow: async (req, res, next) => {
    try {
      const currentUser = helpers.getUser(req)
      const followingId = Number(req.body.id)
      if (Number(currentUser.id) === followingId) {
        return res.status(200).json({
          status: 'error',
          message: "You can't follow yourself"
        })
      }

      const user = await User.findByPk(followingId, { raw: true })
      if (!user) throw new Error("User didn't exist")
      if (user.role === 'admin') {
        return res.status(200).json({
          status: 'error',
          message: "You can't follow admin"
        })
      }

      const isFollowed = await Followship.findOne({
        where: { followerId: currentUser.id, followingId }
      })
      const data = isFollowed ? isFollowed.toJSON() : ''
      if (isFollowed) {
        if (data.willNotice) {
          await Notice.destroy({
            where: {
              receivedId: currentUser.id,
              objectType: `Tweet-${followingId}`
            }
          })
        }
        const destroyedFollowship = await isFollowed.destroy()
        return res.status(200).json({
          status: 'success',
          message: 'followship destroyed',
          followship: destroyedFollowship
        })
      }

      const newFollowship = await Followship.create({
        followerId: currentUser.id,
        followingId
      })
      await Notice.create({
        title: `${currentUser.name} 開始追蹤你`,
        receivedId: followingId,
        objectType: 'Followship',
        objectId: '',
        description: '',
        authorAvatar: currentUser.avatar,
        isChecked: false
      })
      return res.status(200).json({
        status: 'success',
        message: 'followship created',
        followship: newFollowship
      })
    } catch (err) {
      console.log(err)
      next(err)
    }
  },

  postTweetReply: async (req, res, next) => {
    const User = helpers.getUser(req)
    const comment = req.body.comment
    const TweetId = req.params.id
    const existTweet = await Tweet.findByPk(TweetId, { raw: true })
    if (!existTweet) {
      return res.status(200).json({
        status: 'error',
        message: '這個推文已經不存在！'
      })
    }
    if (!comment) {
      return res.status(200).json({
        status: 'error',
        message: '內容不可空白！'
      })
    }
    const data = await Reply.create({ UserId: User.id, TweetId, comment })
    const ids = User.Followers.filter(u => u.Followship.willNotice).map(
      u => u.id
    )
    existTweet.description =
      existTweet.description.length > 80
        ? `${existTweet.description.substring(0, 80)}...`
        : existTweet.description
    for await (const id of ids) {
      await Notice.create({
        title: `${User.name} 有新的回覆`,
        receivedId: id,
        objectType: `Tweet-${User.id}`,
        objectId: TweetId,
        description: existTweet.description,
        authorAvatar: User.avatar,
        isChecked: false
      })
    }
    return res.status(200).json({
      status: 'success',
      data: {
        data,
        uid: existTweet.UserId,
        id: User.id,
        name: User.name,
        account: User.account,
        avatar: User.avatar
      }
    })
  },
  patchWillNotice: async (req, res, next) => {
    try {
      const User = helpers.getUser(req)
      const targetId = req.body.id
      const followship = await Followship.findOne({
        where: { followerId: User.id, followingId: targetId }
      })
      const data = followship.toJSON()
      const updateFollowship = await followship.update({
        willNotice: !followship.willNotice
      })

      if (data.willNotice) {
        Notice.destroy({
          where: { receivedId: User.id, objectType: `Tweet-${targetId}` }
        })
      }
      res.status(200).json({
        status: 'success',
        message: 'successfully patch notice',
        updateFollowship
      })
    } catch (err) {
      next(err)
    }
  },
  getTweets: async (req, res, next) => {
    try {
      const limit = 10
      const page = Number(req.params.page)
      console.log(page)
      const offset = getOffset(limit, page)
      const currentUser = helpers.getUser(req)
      const followingsId = currentUser.Followings.map(user => user.id)
      const topUser = await getTopUser(currentUser)
      const tweets = await Tweet.findAll({
        where: { UserId: [...followingsId, currentUser.id] },
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'description', 'createdAt'],
        include: [
          { model: User, attributes: ['id', 'name', 'account', 'avatar'] },
          { model: Reply, attributes: ['id'] },
          { model: Like, attributes: ['id'] }
        ],
        limit,
        offset
      })
      const likedTweetsId = req.user?.Likes ? currentUser.Likes.map(lt => lt.TweetId) : []
      const data = tweets.map(tweets => ({
        ...tweets.toJSON(),
        isLiked: likedTweetsId.includes(tweets.id)
      }))
      res.json({
        tweets: data,
        role: currentUser.role,
        currentUser,
        topUser
      })
    } catch (err) {
      next(err)
    }
  }
}

module.exports = apiController

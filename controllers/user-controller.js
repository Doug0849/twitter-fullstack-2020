const bcrypt = require('bcrypt-nodejs')
const helpers = require('../_helpers')
const {
  imgurFileHandler,
  localFileHandler
} = require('../helpers/file-helpers')

const { User, Tweet, Like, Reply, Followship } = require('../models')

const userController = {
  signUpPage: async (req, res, next) => {
    try {
      res.render('signup')
    } catch (err) {
      next(err)
    }
  },
  signUp: async (req, res, next) => {
    try {
      let { account, name, email, password, checkPassword } = req.body
      if (!account || !name || !email || !password) {
        throw new Error('Please complete all required fields')
      }
      if (password !== checkPassword) throw new Error('Passwords do not match!')
      const existAccount = await User.findOne({ where: { account } })
      if (existAccount) throw new Error('Account already exists!')
      const existEmail = await User.findOne({ where: { email } })
      if (existEmail) throw new Error('Email already exists!')
      name = name.trim()
      if (name.length > 50) {
        throw new Error("Name can't have too many characters.")
      }

      const hash = bcrypt.hashSync(password, bcrypt.genSaltSync(10))
      const userData = { account, name, email, password: hash }
      await User.create(userData)
      req.flash('success_messages', '您已成功註冊帳號！')
      // return res.render('signin')
      res.redirect(302, '/signin')
      // delete userData.password
      // return res.json(userData)
    } catch (err) {
      next(err)
    }
  },
  signInPage: async (req, res, next) => {
    try {
      res.render('signin')
    } catch (err) {
      next(err)
    }
  },
  signIn: async (req, res, next) => {
    try {
      req.flash('success_messages', '成功登入！')
      res.redirect('/tweets')
      // const userData = req.user.toJSON()
      // delete userData.password
      // res.json({
      //   status: 'success',
      //   data: {
      //     user: userData
      //   }
      // })
    } catch (err) {
      next(err)
    }
  },
  logout: async (req, res, next) => {
    try {
      req.flash('success_messages', '成功登出！')
      req.logout()
      res.redirect('/signin')
    } catch (err) {
      next(err)
    }
  },
  getUserFollowings: async (req, res, next) => {
    try {
      const userId = Number(req.params.id)
      const user = await User.findByPk(userId, {
        include: [
          { model: User, as: 'Followers' },
          { model: User, as: 'Followings' }
        ],
        order: [['Followings', 'created_at', 'DESC']]
      })
      user.Followings[0]
        ? res.json({ status: 'success', data: user.Followings })
        : res.json({ status: 'success', data: null })
    } catch (err) {
      next(err)
    }
  },
  getUserFollowers: async (req, res, next) => {
    try {
      const userId = Number(req.params.id)
      const user = await User.findByPk(userId, {
        include: [
          { model: User, as: 'Followers' },
          { model: User, as: 'Followings' }
        ],
        order: [['Followers', 'created_at', 'DESC']]
      })
      user.Followers[0]
        ? res.json({ status: 'success', data: user.Followers })
        : res.json({ status: 'success', data: null })
    } catch (err) {
      next(err)
    }
  },
  getUserTweets: async (req, res, next) => {
    try {
      const currentUser = helpers.getUser(req)
      const userId = Number(req.params.id)
      let topUser = await User.findAll({
        include: [{ model: User, as: 'Followers' }]
      })
      topUser = topUser
        .map(user => ({
          ...user.toJSON(),
          followerCount: user.Followers.length,
          isFollowed: currentUser.Followings.some(f => f.id === user.id)
        }))
        .sort((a, b) => b.followerCount - a.followerCount)
      let profileUser = await User.findByPk(userId, {
        include: [
          { model: User, as: 'Followers', attributes: ['id'] },
          { model: User, as: 'Followings', attributes: ['id'] }
        ]
      })
      if (!profileUser) throw new Error("This user didn't exist!")
      profileUser = profileUser.toJSON()
      if (profileUser.Followers.map(fr => fr.id === currentUser.id)) {
        profileUser.isFollowed = true
      }
      const userTweets = await Tweet.findAll({
        where: { user_id: userId },
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'description', 'createdAt'],
        include: [
          { model: User, attributes: ['id', 'name', 'account', 'avatar'] },
          { model: Reply, attributes: ['id'] },
          { model: Like, attributes: ['id'] }
        ]
      })
      const likedTweetsId = req.user?.Likes
        ? currentUser.Likes.map(lt => lt.TweetId)
        : []
      const data = userTweets.map(tweets => ({
        ...tweets.toJSON(),
        isLiked: likedTweetsId.includes(tweets.id)
      }))
      console.log(profileUser)
      res.render('users/user-tweets', {
        tweets: data,
        role: currentUser.role,
        currentUser,
        profileUser,
        topUser,
        tab: 'tweets'
      })
    } catch (err) {
      next(err)
    }
  },
  getUserLikes: async (req, res, next) => {
    try {
      const currentUser = helpers.getUser(req)
      const userId = Number(req.params.id)
      let topUser = await User.findAll({
        include: [{ model: User, as: 'Followers' }]
      })
      topUser = topUser
        .map(user => ({
          ...user.toJSON(),
          followerCount: user.Followers.length,
          isFollowed: currentUser.Followings.some(f => f.id === user.id)
        }))
        .sort((a, b) => b.followerCount - a.followerCount)
      let profileUser = await User.findByPk(userId, {
        include: [
          { model: User, as: 'Followers', attributes: ['id'] },
          { model: User, as: 'Followings', attributes: ['id'] }
        ]
      })
      if (!profileUser) throw new Error("This user didn't exist!")
      profileUser = profileUser.toJSON()
      if (profileUser.Followers.map(fr => fr.id === currentUser.id)) {
        profileUser.isFollowed = true
      }
      const userTweets = await Tweet.findAll({
        where: { user_id: userId },
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'description', 'createdAt'],
        include: [
          { model: User, attributes: ['id', 'name', 'account', 'avatar'] },
          { model: Reply, attributes: ['id'] },
          { model: Like, attributes: ['id'] }
        ]
      })
      const likedTweetsId = req.user?.Likes
        ? currentUser.Likes.map(lt => lt.TweetId)
        : []
      const data = userTweets.map(tweets => ({
        ...tweets.toJSON(),
        isLiked: likedTweetsId.includes(tweets.id)
      }))
      console.log(profileUser)
      res.render('users/user-tweets', {
        tweets: data,
        role: currentUser.role,
        currentUser,
        profileUser,
        topUser,
        tab: 'likes'
      })
    } catch (err) {
      next(err)
    }
  },
  getUserReplies: async (req, res, next) => {
    try {
      const currentUser = helpers.getUser(req)
      const userId = Number(req.params.id)
      let topUser = await User.findAll({
        include: [{ model: User, as: 'Followers' }]
      })
      topUser = topUser
        .map(user => ({
          ...user.toJSON(),
          followerCount: user.Followers.length,
          isFollowed: currentUser.Followings.some(f => f.id === user.id)
        }))
        .sort((a, b) => b.followerCount - a.followerCount)
      let profileUser = await User.findByPk(userId, {
        include: [
          { model: User, as: 'Followers', attributes: ['id'] },
          { model: User, as: 'Followings', attributes: ['id'] }
        ]
      })
      if (!profileUser) throw new Error("This user didn't exist!")
      profileUser = profileUser.toJSON()
      if (profileUser.Followers.map(fr => fr.id === currentUser.id)) {
        profileUser.isFollowed = true
      }
      const userTweets = await Tweet.findAll({
        where: { user_id: userId },
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'description', 'createdAt'],
        include: [
          { model: User, attributes: ['id', 'name', 'account', 'avatar'] },
          { model: Reply, attributes: ['id'] },
          { model: Like, attributes: ['id'] }
        ]
      })
      const likedTweetsId = req.user?.Likes
        ? currentUser.Likes.map(lt => lt.TweetId)
        : []
      const data = userTweets.map(tweets => ({
        ...tweets.toJSON(),
        isLiked: likedTweetsId.includes(tweets.id)
      }))
      console.log(profileUser)
      res.render('users/user-tweets', {
        tweets: data,
        role: currentUser.role,
        currentUser,
        profileUser,
        topUser,
        tab: 'replies'
      })
    } catch (err) {
      next(err)
    }
  },
  postFollow: async (req, res, next) => {
    try {
      const UserId = Number(helpers.getUser(req).id)
      const followingId = Number(req.body.id)
      if (UserId === followingId) {
        req.flash('error_messages', "You can't follow yourself")
        return res.redirect(200, 'back')
      }

      const user = await User.findByPk(followingId)
      if (!user) throw new Error("User didn't exist")
      if (user.role === 'admin') {
        req.flash('error_messages', "You can't follow admin")
        return res.redirect('back')
      }

      const isFollowed = await Followship.findOne({
        where: { followerId: UserId, followingId }
      })

      if (isFollowed) {
        await isFollowed.destroy()
        return res.redirect('back')
      }

      await Followship.create({
        followerId: UserId,
        followingId
      })
      return res.redirect('/')
    } catch (err) {
      next(err)
    }
  },
  postUnfollow: async (req, res, next) => {
    try {
      const UserId = helpers.getUser(req).id
      const followingId = Number(req.params.id)
      const user = await User.findByPk(followingId)
      if (!user) throw new Error("User didn't exist")
      const followship = await Followship.findOne({
        where: { followerId: UserId, followingId }
      })
      if (!followship) throw new Error("You haven't follow this user")
      const destroyedFollowship = await followship.destroy()
      return res.status(302).json({ status: 'success', destroyedFollowship })
      // res.json({ status: 'success', destroyedFollowship })
    } catch (err) {
      next(err)
    }
  },
  getSettingPage: async (req, res, next) => {
    try {
      const currentUser = helpers.getUser(req)
      res.render('users/user-setting', { role: currentUser.role, currentUser })
    } catch (err) {
      next(err)
    }
  },
  getTopUser: async (req, res, next) => {
    try {
      const currentUser = helpers.getUser(req)
      let topUser = await User.findAll({
        include: [{ model: User, as: 'Followers' }]
      })
      topUser = topUser
        .map(user => ({
          ...user.toJSON(),
          followerCount: user.Followers.length,
          isFollowed: currentUser.Followings.some(f => f.id === user.id),
          password: null
        }))
        .sort((a, b) => b.followerCount - a.followerCount)
      res.json({ status: 'success', topUser, currentUser })
      // res.render('tweets', { topUser, currentUser })
    } catch (err) {
      next(err)
    }
  },
  postUserInformation: async (req, res, next) => {
    try {
      const currentUser = helpers.getUser(req)
      if (currentUser.id !== Number(req.params.id)) {
        throw new Error("You can't edit others info")
      }
      const editUser = await User.findByPk(Number(req.params.id))
      const { name, introduction } = req.body
      if (!name) throw new Error('Name is required')
      const avatar = await localFileHandler(req.files.avatar[0])
      const coverPhoto = await localFileHandler(req.files.coverPhoto[0])
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
  }
}

module.exports = userController

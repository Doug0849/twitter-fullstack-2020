const express = require('express')
const router = express.Router()

const userController = require('../../controllers/user-controller')

router.get('/:id/followings', userController.getUserFollowings)
router.get('/:id/followers', userController.getUserFollowers)
router.patch('/:id/setting', userController.patchUserSetting)
router.get('/setting', userController.getUserSettingPage)
router.get('/:id/tweets', userController.getUserTweets)
router.get('/:id/replies', userController.getUserReplies)
router.get('/:id/likes', userController.getUserLikes)
router.get('/topUsers', userController.getTopUser)

module.exports = router

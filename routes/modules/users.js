const express = require('express')
const router = express.Router()

const userController = require('../../controllers/user-controller')

const upload = require('../../middleware/multer')

router.get('/:id/followings', userController.getUserFollowings)
router.get('/:id/followers', userController.getUserFollowers)
router.get('/:id/setting', userController.getSettingPage)
router.get('/:id/tweets', userController.getUserTweets)
router.get('/:id/replies', userController.getUserReplies)
router.get('/:id/likes', userController.getUserLikes)
router.get('/topUsers', userController.getTopUser)
router.put(
  '/:id/info',
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'coverPhoto', maxCount: 1 }
  ]),
  userController.postUserInformation
)

module.exports = router

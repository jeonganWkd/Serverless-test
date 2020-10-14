const express = require("express");

const {
  uploadPhoto,
  getMyPosts,
  updatePost,
  deletePost,
  getFriendsPost,
} = require("../controllers/posts");

const auth = require("../middleware/auth");

const router = express.Router();

//  api/v1/posts
router.route("/").post(auth, uploadPhoto);
router.route("/me").get(auth, getMyPosts);
router.route("/:post_id").put(auth, updatePost);
router.route("/:post_id").delete(auth, deletePost);
router.route("/").get(auth, getFriendsPost);

module.exports = router;

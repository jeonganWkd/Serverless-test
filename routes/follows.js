const express = require("express");

const {
  follows,
 
} = require("../controllers/follows");

const auth = require("../middleware/auth");

const router = express.Router();

//  api/v1/follows
router.route("/").post(auth, follows);



module.exports = router;

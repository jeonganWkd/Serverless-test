const path = require("path");
const connection = require("../db/mysql_connection");

//@desc             친구맺기
//@route            POST/api/v1/follws
//@request          user_id(auth), friend_user_id
//@response         success

exports.follows = async (req, res, next) => {
  let user_id = req.user.id;
  let friend_user_id = req.body.friend_user_id;

  if (!user_id || !friend_user_id) {
    res
      .status(400)
      .json({ success: false, message: "파라미터가 잘못되었습니다" });
    return;
  }

  //table의 unique를 활용
  let query = "insert into sns_follow (user_id, friend_user_id) values (?,?)";
  let data = [user_id, friend_user_id];

  try {
    [result] = await connection.query(query, data);
    res.status(200).json({ success: true, message: "친구가 되었습니다" });
  } catch (e) {
    res.status(500).json({ success: false, error: e });
  }
};



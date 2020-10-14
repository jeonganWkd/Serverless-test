const jwt = require("jsonwebtoken");
const connection = require("../db/mysql_connection");

const auth = async (req, res, next) => {
  let token;
  try {
    token = req.header("Authorization");
    token = token.replace("Bearer ", "");
  } catch (e) {
    res.status(401).json({ success: false });
    return;
  }

  let user_id;
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    user_id = decoded.user_id;
  } catch (e) {
    res.status(401).json({ success: false, message: "e" });
    return;
  }

  let query = `select u.id, u.email, u.created_at, t.token \
  from sns_token as t \
  join sns_user as u \
  on t.user_id = u.id \
  where t.user_id = ${user_id} and t.token = "${token}"`;

  console.log(query);
  try {
    [rows] = await connection.query(query);
    console.log(rows);
    if (rows.length == 0) {
      res.status(401).json({ success: false, message: "e2" });
      return;
    } else {
      req.user = rows[0];
      next();
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({ success: false });
    return;
  }
};

module.exports = auth;

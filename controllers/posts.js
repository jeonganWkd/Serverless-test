const connection = require("../db/mysql_connection");
const path = require("path");
const { listenerCount } = require("../db/mysql_connection");

//@desc             사진 1장과 내용을 업로드
//@route            POST/api/v1/posts
//@request          photo, content, user_id(auth)
//@response         success

exports.uploadPhoto = async (req, res, next) => {
  let user_id = req.user.id;
  let photo = req.files.photo;
  let content = req.body.content;

  if (photo.mimetype.startsWith("image") == false) {
    res
      .status(400)
      .json({ success: false, message: "사진파일 형식이 아닙니다" });
    return;
  }
  if (photo.size > process.env.MAX_FILE_SIZE) {
    res.status(400).json({ success: false, message: "파일 크기가 큽니다" });
    return;
  }
  //사진파일 이름은 유저아이디와 현재날짜로 생성
  photo.name = `photo_${user_id}_${Date.now()}${path.parse(photo.name).ext}`;

  let fileUploadPath = `${process.env.FILE_UPLOAD_PATH}/${photo.name}`;

  photo.mv(fileUploadPath, async (err) => {
    if (err) {
      console.log(err);
      return;
    }
  });
  let query =
    "insert into sns_post (user_id, photo_url, content) values (?,?,?)";
  let data = [user_id, photo.name, content];

  try {
    [result] = await connection.query(query, data);
    res.status(200).json({ success: true, message: "업로드 완료!" });
    return;
  } catch (e) {
    res.status(500).json({ success: false, error: e });
    return;
  }
};

//@desc         내가 작성한 포스트 정보 가져오기(25개씩)
//@route        GET/api/v1/posts/me?offset=0&limit=25
//@request      user_id(auth), offset, limit
//@response     success, items[], cnt

exports.getMyPosts = async (req, res, next) => {
  let user_id = req.user.id;
  let offset = req.query.offset;
  let limit = req.query.limit;

  //에러처리코드
  if (!user_id || !offset || !limit) {
    res
      .status(400)
      .json({ success: false, message: "파라미터가 잘못되었습니다" });
    return;
  }

  let query = "select * from sns_post where user_id = ? limit ?,?";
  let data = [user_id, Number(offset), Number(limit)];

  try {
    [rows] = await connection.query(query, data);
    res.status(200).json({ success: true, items: rows, cnt: rows.length });
    return;
  } catch (e) {
    res.status(500).json({ success: false });
    return;
  }
};

//@desc         포스팅 수정하기
//@route        PUT/api/v1/posts/:post_id
//@request      user_id(auth), photo, content
//@response     success

exports.updatePost = async (req, res, next) => {
  let post_id = req.params.post_id;
  let user_id = req.user.id;
  let photo = req.files.photo;
  let content = req.body.content;

  //본인의 포스팅을 수정하는게 맞는지 확인
  let query = "select * from sns_post where id=?";
  let data = [post_id];

  try {
    [rows] = await connection.query(query, data);
    //(rows의 0번째에 들어있는 user_id)확인
    //다른사람의 포스팅을 바꾸려하면 에러처리
    if (rows[0].user_id != user_id) {
      req.status(401).json({ success: false });
      return;
    }
  } catch (e) {
    res.status(500).json({ success: false });
    return;
  }

  //본인의 포스팅이 맞을 때 수정 가능
  if (photo.mimetype.startsWith("image") == false) {
    res
      .status(400)
      .json({ success: false, message: "사진파일 형식이 아닙니다" });
    return;
  }
  if (photo.size > process.env.MAX_FILE_SIZE) {
    res.status(400).json({ success: false, message: "파일 크기가 큽니다" });
    return;
  }
  //사진파일 이름은 유저아이디와 현재날짜로 생성
  photo.name = `photo_${user_id}_${Date.now()}${path.parse(photo.name).ext}`;

  let fileUploadPath = `${process.env.FILE_UPLOAD_PATH}/${photo.name}`;

  photo.mv(fileUploadPath, async (err) => {
    if (err) {
      console.log(err);
      return;
    }
  });

  query = "update sns_post set photo_url = ?, content = ? where id = ?";
  data = [photo.name, content, post_id];

  try {
    [result] = await connection.query(query, data);
    res.status(200).json({ success: true, message: "수정완료!" });
    return;
  } catch (e) {
    res.status(500).json({ success: false });
    return;
  }
};

//@desc         포스팅 삭제
//@route        delete/api/v1/posts/:post_id
//@request      post_id, user_id(auth)
//@response     success

exports.deletePost = async (req, res, next) => {
  let post_id = req.params.post_id;
  let user_id = req.user.id;

  if (!post_id || !user_id) {
    res
      .status(400)
      .json({ success: false, message: "파라미터가 잘못되었습니다" });
    return;
  }
  //본인의 포스팅을 삭제하는게 맞는지 확인
  let query = "select * from sns_post where id=?";
  let data = [post_id];

  try {
    [rows] = await connection.query(query, data);
    //(rows의 0번째에 들어있는 user_)id확인
    //다른사람의 포스팅을 바꾸려하면 에러처리
    if (rows[0].user_id != user_id) {
      req.status(401).json({ success: false });
      return;
    }
  } catch (e) {
    res.status(500).json({ success: false });
    return;
  }

  //본인의 포스팅이 맞으면 삭제가능
  query = "delete from sns_post where id = ?";
  data = [post_id];

  try {
    [result] = await connection.query(query, data);
    res.status(200).json({ success: true, message: "삭제 완료" });
    return;
  } catch (e) {
    res.status(500).json({ success: false });
    return;
  }
};

//@desc                 내 친구들의 포스팅 불러오기(25개씩)
//@route                GET/api/v1/posts?offset=0&limit=25
//@request              user_id(auth)
//@response             success, items[], cnt

exports.getFriendsPost = async (req, res, next) => {
  let user_id = req.user.id;
  let offset = req.query.offset;
  let limit = req.query.limit;

  if (!user_id || !offset || !limit) {
    res
      .status(400)
      .json({ success: false, message: "파라미터가 잘못되었습니다" });
    return;
  }
  //나와 친구를 맺은 친구들의 포스팅을 전부 가져오는 쿼리
  let query =
    "select p.* \
  from sns_follow as f \
  join sns_post as p \
  on f.friend_user_id = p.user_id \
  where f.user_id = ? \
  order by p.created_at desc \
  limit ?,?";

  let data = [user_id, Number(offset), Number(limit)];

  try {
    [rows] = await connection.query(query, data);
    res.status(200).json({ success: true, items: rows, cnt: rows.length });
    return;
  } catch (e) {
    res.status(500).json({ success: false });
  }
};

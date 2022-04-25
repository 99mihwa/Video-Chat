const express = require("express");
const socket = require("socket.io");
const app = express();

//추가한 부분
const connect = require("./schemas/index");
connect();
const cookieParser = require("cookie-parser");
const cors = require("cors");
const mainRouter = require("./routes/main");
//const authMiddleware = require("./middleware/authMiddleware");
const Users = require("./schemas/users"); //Users DB 연결하기
const moment = require('moment'); 
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");
const Logins = require("./schemas/logins"); //logins DB 연결하기
const bodyParser = require('body-parser');
const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator"); // 회원가입 정보 필터링 라이브러리
const Users = require("../schemas/users"); //Users DB 연결하기
const jwt = require("jsonwebtoken");
const fs = require("fs");
const myKey = fs.readFileSync(__dirname + "/key.txt").toString(); // 토큰 시크릿 키값 불러오기


//Starts the server

let server = app.listen(4000, function () {
  console.log("Server is running");
});

app.use(express.static("public"));
app.use(cors({ credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));


// 로그인
app.post(
  "/login",

  // userId 규칙 : 비어있지 않기
  body("userId").notEmpty(),

  // userId 규칙 : 비어있지 않기
  body("userPassword").notEmpty(),

  async (req, res) => {
    // 에러 핸들링 함수 (양식에 안맞으면 400상태와 에러메세지 반환)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ msg: errors.array() });
    }

    // FE가 입력한 정보로 DB조회
    const { userId, userPassword } = req.body;
    const user = await Users.findOne({ userId, userPassword });

    // 가입안된 닉네임일때 혹은 비밀번호가 틀릴때 400상태와 에러메세지 반환
    if (!user) {
      res.status(400).send({
        msg: "닉네임 혹은 패스워드를 다시 확인해주세요.",
      });
      return;
    }  

    // 토큰 발급단계 (Id와 닉네임 담기)
    const userInfo = await Users.findOne({ userId });
    const { userNickname } = userInfo;

    /// payload에 userId, userNickname 담기
    const payload = { userId, userNickname };
    const secret = myKey;
    const options = {
      issuer: "MHlee", // 발행자
      expiresIn: "2h", // 만료시간 설정 : [날짜: $$d, 시간: $$h, 분: $$m, 그냥 숫자만 넣으면 ms단위]
    };

    // 토큰 생성 및 발급
    const token = jwt.sign(payload, secret, options);
    res.status(200).json({ token: token, msg: "로그인이 완료 되었습니다." });

  }
);

//app.use(authMiddleware)

// //  유저 접속 정보 DB저장
// app.post("/", authMiddleware, async (req, res) => {
//   const { userId } = res.locals.userDB;
//   const connectedAt = moment().format('YYYY-MM-DD HH:mm:ss');
//   const socketId = socket.id
//   await Logins.create({ userId, connectedAt, socketId});
//   });



//Upgrades the server to accept websockets.

let io = socket(server, {
  cors : {
      origin:"*", //여기에 명시된 서버만 호스트만 내서버로 연결을 허용할거야
      methods: ["GET","POST"],
  },
})

//라우터 연결
app.use("/main", [mainRouter]);

//Triggered when a client is connected.

io.on("connection", function (socket) {
  console.log("인덱스 User Connected :" + socket.id);
  
  var loginID = {};

  socket.on("login", function(login) {
    console.log("서버가 login 이벤트를 받았습니다"); 
    const userId = socket.userId;
    const connectedAt = moment().format('YYYY-MM-DD HH:mm:ss');
    const socketId = socket.id

    console.log("userId:",userId,"connectedAt:",connectedAt,"socketId:",socketId); 
	});


  //Triggered when a peer hits the join room button.

  socket.on("join", function (roomName) {
    let rooms = io.sockets.adapter.rooms;
    let room = rooms.get(roomName);

    //room == undefined when no such room exists.
    if (room == undefined) {
      socket.join(roomName);
      socket.emit("created");
    } else if (room.size == 1) {
      //room.size == 1 when one person is inside the room.
      socket.join(roomName);
      socket.emit("joined");
    } else {
      //when there are already two people inside the room.
      socket.emit("full");
    }
    console.log(rooms);
  });

  //Triggered when the person who joined the room is ready to communicate.
  socket.on("ready", function (roomName) {
    socket.broadcast.to(roomName).emit("ready"); //Informs the other peer in the room.
  });

  //Triggered when server gets an icecandidate from a peer in the room.

  socket.on("candidate", function (candidate, roomName) {
    console.log(candidate);
    socket.broadcast.to(roomName).emit("candidate", candidate); //Sends Candidate to the other peer in the room.
  });

  //Triggered when server gets an offer from a peer in the room.

  socket.on("offer", function (offer, roomName) {
    socket.broadcast.to(roomName).emit("offer", offer); //Sends Offer to the other peer in the room.
  });

  //Triggered when server gets an answer from a peer in the room.

  socket.on("answer", function (answer, roomName) {
    socket.broadcast.to(roomName).emit("answer", answer); //Sends Answer to the other peer in the room.
  });
});


  
  

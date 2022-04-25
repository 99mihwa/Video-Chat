const express = require("express");
const socket = require("socket.io");
const app = express();

//추가한 부분
const connect = require("./schemas/index");
connect();
const cookieParser = require("cookie-parser");
const cors = require("cors");
const mainRouter = require("./routes/main");
const Logins = require("../schemas/logins"); //logins DB 연결하기
const moment = require('moment'); 
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

//Starts the server

let server = app.listen(4000, function () {
  console.log("Server is running");
});

app.use(express.static("public"));
app.use(cors({ credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

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

   // 유저 접속 정보 DB저장
   const connectedAt = moment().format('YYYY-MM-DD HH:mm:ss');
   const connectUserId = user.userId
   const socketId = socket.id
   await Logins.create({
     connectUserId,
     connectedAt,
     socketId
   });

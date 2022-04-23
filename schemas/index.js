const mongoose = require("mongoose");
const fs = require("fs");
const pw = fs.readFileSync(__dirname + "/pw.txt").toString();

const connect = () => {
  mongoose
    .connect(
      `mongodb+srv://videoChatPrac:${pw}@cluster0.tt37j.mongodb.net/test`,
      { ignoreUndefined: true }
    )
    .catch((err) => {
      console.error(err);
      console.log("여기?");
    });
};

module.exports = connect;

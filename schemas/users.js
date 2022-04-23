const mongoose = require("mongoose");

const UsersSchema = mongoose.Schema({
  // Users
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  userPassword: {
    type: String,
    required: true,
  },
  userNickname: {
    type: String,
    required: true,
  }
});

module.exports = mongoose.model("users", UsersSchema);

const mongoose = require("mongoose");

const LoginsSchema = mongoose.Schema({
  // Logins
  connectUserId: {
    type: String,
    required: true,
  },
  connectedAt: {
    type: Date,
    required: true,
  },
  socketId: {
    type: String,
    required: true,
  }
});

module.exports = mongoose.model("logins", LoginsSchema);

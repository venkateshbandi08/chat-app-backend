const mongoose = require("mongoose");

const messages = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RegisterUser",
  },
  userName: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  data: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("messageModel", messages);

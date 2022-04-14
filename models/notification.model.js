const mongoose = require("mongoose");
/**
 *  CREATE NOTIFICATION MODEL
 */
const notification = new mongoose.Schema({
  notified_user: [
    {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
  ],
  notification_message: {
    type: String,
  },
  notification_date: {
    type: Date,
    default: new Date(),
  },
});

module.exports = mongoose.model("notifications", notification);

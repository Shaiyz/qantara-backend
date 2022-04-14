const mongoose = require("mongoose");
/**
 *  CREATE CUSTOMER ADDRESS MODEL
 */
const Customer = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "users",
  },
  phone: {
    type: String,
  },
  addresses: [
    {
      type: new mongoose.Schema({
        street: {
          type: String,
        },
        zip: {
          type: String,
        },
        state: {
          type: String,
        },
        country: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "countries",
        },
        city: {
          type: String,
        },
      }),
    },
  ],
});

module.exports = mongoose.model("customers", Customer);

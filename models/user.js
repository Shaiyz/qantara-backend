const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { sendEmail } = require("../util");
const crypto = require("crypto");

/**
 *  CREATE USER MODEL EITHER FOR ADMIN OR CUSTOMER
 */
const User = new mongoose.Schema(
  {
    first_name: {
      type: String,
      // required: [true, "'first_name' must be required"],
    },
    middle_name: {
      type: String,
    },
    user_name: {
      type: String,
    },
    last_name: {
      type: String,
      // required: [true, "'last_name' must be required"],
    },
    email: {
      type: String,
      lowercase: true,
      unique: [true, "'email' must be unique"],
    },
    phone: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    password: {
      type: String,
    },
    role: {
      type: String,
      required: true,
      enum: ["customer", "admin", "superadmin"],
    },
    qantara_code: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

const randomString = (length) => {
  const secret = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var result = "";

  for (var i = length; i > 0; --i)
    result += secret[Math.round(Math.random() * (secret.length - 1))];

  return result;
};

User.pre("validate", function (next) {
  if (this.role === "customer") {
    this.first_name = this.email.split("@")[0].split(".")[0];
    this.last_name = this.email.split("@")[0].split(".")[1] || "";
    this.user_name = this.last_name
      ? `${this.first_name} ${this.last_name}`
      : this.first_name;

    this.qantara_code = `${randomString(2)}-${randomString(4)}-${randomString(
      2
    )}`;
  } else {
    var first_string = "";
    var rcode = "";
    if (this.first_name !== undefined) {
      let name = this.first_name.charAt(0).toUpperCase();
      first_string = first_string + name;
    }

    if (this.last_name !== undefined) {
      let l_name = this.last_name[0].charAt(0).toUpperCase();
      first_string = first_string + l_name;
    }

    const num = global.USERS + parseInt(process.env.USER_INITIAL_POS) + "";
    this.qantara_code = `${first_string}-${"0".repeat(
      10 - num.length
    )}${num}-${rcode}`;

    global.USERS += 1;
  }

  if (this.role !== undefined) {
    rcode = this.role[0].charAt(0).toUpperCase();
  }

  next();
});

User.pre("save", function (next) {
  if (!this.password) this.password = process.env.DEFAULT_USER_PASSWORD;
  if (this.role !== "admin") {
    this.password = bcrypt.hashSync(this.password, 10);
  }
  next();
});
User.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  return resetToken;
};

User.statics.checkPassword = function (pass, hashedPass) {
  return bcrypt.compareSync(pass, hashedPass);
};

module.exports = mongoose.model("users", User);

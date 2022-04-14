const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { sendEmail, sendEmailTitan } = require("../util");
const crypto = require("crypto");

/**
 *  CREATE USER MODEL EITHER FOR ADMIN OR CUSTOMER
 */
const User = new mongoose.Schema({
  first_name: {
    type: String,
    required: [true, "'first_name' must be required"],
  },
  middle_name: {
    type: String,
  },
  last_name: {
    type: String,
    required: [true, "'last_name' must be required"],
  },
  email: {
    type: String,
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
    enum: ["customer", "admin"],
  },
  qantara_code: {
    type: String,
    required: true,
    unique: true,
  },
});
User.pre("validate", function (next) {
  var first_string = "";
  var rcode = "";
  if (this.first_name !== undefined) {
    let name = this.first_name.charAt(0).toUpperCase();
    first_string = first_string + name;
  }
  if (this.middle_name !== undefined) {
    let m_name = this.middle_name[0].charAt(0).toUpperCase();
    first_string = first_string + m_name;
  }
  if (this.last_name !== undefined) {
    let l_name = this.last_name[0].charAt(0).toUpperCase();
    first_string = first_string + l_name;
  }
  if (this.role !== undefined) {
    rcode = this.role[0].charAt(0).toUpperCase();
  }
  const num = global.USERS + parseInt(process.env.USER_INITIAL_POS) + "";
  this.qantara_code = `${first_string}-${"0".repeat(
    10 - num.length
  )}${num}-${rcode}`;
  global.USERS += 1;
  next();
});
User.pre("save", function (next) {
  if (!this.password) this.password = process.env.DEFAULT_USER_PASSWORD;
  // if (this.email !== undefined) {
  //   let sendMail;

  //   sendMail = sendEmail(this.email, {
  //     email: this.email,
  //     password: this.password,
  //     subject: "User Register",
  //     message: "You have been added to the system.",
  //   });

  //   sendMail
  //     .then(() => {
  //       this.password = bcrypt.hashSync(this.password, 10);
  //     })
  //     .catch(next)
  //     .finally(() => next());
  // } else {
  this.password = bcrypt.hashSync(this.password, 10);
  next();
  // }
});
User.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  return resetToken;
};

User.statics.checkPassword = function (pass, hashedPass) {
  return bcrypt.compareSync(pass, hashedPass);
};

module.exports = mongoose.model("users", User);

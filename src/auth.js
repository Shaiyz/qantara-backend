const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const passportJWT = require("passport-jwt");
const { User } = require("../models");
passport.use(
  "local",
  new LocalStrategy(
    {
      usernameField: "email",
    },
    function (email, password, callback) {
      User.findOne(
        {
          email: email,
        },
        function (err, doc) {
          if (err) {
            callback(err, null, { message: err.message });
          }
          if (!doc) {
            callback(null, null, { message: "User Not Registered" });
          } else if (!User.checkPassword(password, doc.password)) {
            callback(null, null, { message: "Incorrect Password" });
          } else if (!doc.isActive) {
            callback(null, null, { message: "Inactive User Can't Login" });
          } else {
            callback(null, doc, { message: "Login Successful" });
          }
        }
      );
    }
  )
);
passport.use(
  "local1",
  new LocalStrategy(
    {
      usernameField: "phone",
    },
    function (phone, password, callback) {
      console.log(phone);
      User.findOne(
        {
          phone: phone,
        },
        function (err, doc) {
          if (err) {
            callback(err, null, { message: err.message });
          }
          if (!doc) {
            callback(null, null, { message: "User Not Registered" });
          } else if (!User.checkPassword(password, doc.password)) {
            callback(null, null, { message: "Incorrect Password" });
          } else if (!doc.isActive) {
            callback(null, null, { message: "In active user cannot login" });
          } else {
            doc
              .populate("role")
              .execPopulate()
              .then((c) => callback(null, c, { message: "Login Successful" }))
              .catch((e) => callback(e, null, { message: e.message }));
          }
        }
      );
    }
  )
);
passport.use(
  "local2",
  new LocalStrategy(
    {
      usernameField: "eksplode_code",
    },
    function (eksplode_code, password, callback) {
      User.findOne(
        {
          eksplode_code: eksplode_code,
        },
        function (err, doc) {
          //console.log(doc);
          if (err) {
            callback(err, null, { message: err.message });
          }
          if (!doc) {
            callback(null, null, { message: "User Not Registered" });
          } else if (!doc.isActive) {
            callback(null, null, { message: "In active user cannot login" });
          } else {
            callback(null, doc, { message: "Login Successful" });
          }
        }
      );
    }
  )
);


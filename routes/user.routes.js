const router = require("express").Router();
const { User, Customer, Favorite, Cart } = require("../models");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const { login } = require("../middlewares");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { sendEmail, getRandomChars } = require("../util");

/**
 * @route           POST /user/login
 * @description     Login with email and password
 */
router.post("/login", (req, res, next) => {
  passport.authenticate("local", { session: false }, (error, user, info) => {
    if (error || !user) {
      res.status(500).json({ message: info.message });
    } else if (!user.isActive) {
      res.status(500).json({ message: "Inactive user can't login" });
    } else {
      const { password, ...rest } = user;
      const token = jwt.sign(rest.toObject(), process.env.JWT_SECRET_KEY);
      let response = { data: { user }, token, message: "Login success" };
      if (user.role === "customer") {
        Customer.findOne({ user: user._id })
          .populate("user addresses.country")
          .exec()
          .then((doc) => {
            if (!doc)
              return Promise.reject(new Error("Customer doesn't exist'"));
            response.data = {
              ...doc.toObject(),
              addresses: doc.addresses.map((ua) => ({
                ...ua.toObject(),
                country: {
                  ...ua.toObject().country,
                  cities: undefined,
                },
                city: ua.country.cities.find(
                  (uac) => uac._id + "" == ua.city + ""
                ),
              })),
            };
            return Promise.all([
              Favorite.findOne({ customer: doc._id })
                .populate([
                  {
                    path: "items",
                    populate: [{ path: " product" }],
                  },
                ])
                .exec(),
              Cart.findOne({ customer: doc._id })
                .populate([
                  {
                    path: "items",
                    populate: [{ path: " product" }],
                  },
                ])
                .exec(),
            ]);
          })
          .then(([favorite, cart]) => {
            response = { ...response, favorite, cart };
            res.status(200).json(response);
          })
          .catch((error) => {
            res.status(500).json({ message: error.message });
          });
      } else {
        res.status(200).json(response);
      }
    }
  })(req, res, next);
});

/**
 * @route           POST /user/signin
 * @description     Login with phone and password
 */
router.post("/signin", (req, res, next) => {
  passport.authenticate("local1", { session: false }, (error, user, info) => {
    if (error || !user) {
      res.status(500).json({ message: info.message });
    } else {
      const token = jwt.sign(user.toObject(), process.env.JWT_SECRET_KEY);
      res.status(200).json({ data: user, token });
    }
  })(req, res, next);
});

/**
 * @route           POST /user/qantaracode/signin
 * @description     Login with qantaracode and password
 */
router.post("/qantaracode/signin", (req, res, next) => {
  passport.authenticate("local2", { session: false }, (error, user, info) => {
    if (error || !user) {
      return res.status(500).json({ message: info.message });
    } else {
      const token = jwt.sign(user.toObject(), process.env.JWT_SECRET_KEY);
      res.status(200).json({ data: user, token });
    }
  })(req, res, next);
});
/**
 * @route   POST /user/create/admin
 * @desc    Create an admin user
 * @body    { user_name, email,phone, password }
 */

router.post("/create/admin", (req, res, next) => {
  new User({ ...req.body, role: "admin" })
    .save()
    .then((doc) => {
      res.status(200).json({
        data: doc,
        message: "Admin Created Successfully",
      });
    })
    .catch((error) => {
      res.status(500).json({ message: error.message });
    });
});

/**
 * @route         POST /user/create
 * @description   Insert a user record
 */
router.post("/create", (req, res, next) => {
  new User(req.body)
    .save()
    .then((doc) => doc.execPopulate())
    .then((doc) => {
      if (!doc) return Promise.reject(new Error("Couldn't Create User"));
      res.status(200).json({ data: doc });
    })
    .catch((error) => res.status(500).json({ message: error.message }));
});

/**
 * @route           GET /user
 * @description     Get user limits records
 * @query           ?email={}&role={}&_id={}&name={}&fields={}
 */
router.get("/", (req, res, next) => {
  let query = {};
  let fields = "";
  if ("role" in req.query) query.role = req.query.role;
  if ("isActive" in req.query) query.isActive = req.query.isActive;
  if ("email" in req.query) query.email = req.query.email;
  if ("phone" in req.query) query.phone = req.query.phone;
  if ("_id" in req.query) query._id = { $in: req.query._id.split(",") };
  if ("name" in req.query)
    query.user_name = { $regex: req.query.name, $options: "i" };
  if ("fields" in req.query) fields = req.query.fields.replace(",", " ");
  User.find(query)
    .select(fields)
    .exec()
    .then((doc) => {
      res.status(200).json({ data: doc });
    })
    .catch((error) => res.status(500).json({ message: error.message }));
});

router.get("/my", login("Validating with Token"), (req, res, next) => {
  User.findOne({ _id: req.user._id })
    .then((user) => {
      if (!user) return Promise.reject(new Error("Token Error"));
      const token = jwt.sign(user.toObject(), process.env.JWT_SECRET_KEY);
      let response = { data: { user }, token, message: "Login success" };
      if (user.role === "customer") {
        return Customer.findOne({ user: user._id })
          .populate("user addresses.country")
          .exec()
          .then((doc) => {
            if (!doc)
              return Promise.reject(new Error("Customer doesn't exist'"));
            response.data = {
              ...doc.toObject(),
              addresses: doc.addresses.map((ua) => ({
                ...ua.toObject(),
                country: {
                  ...ua.toObject().country,
                  cities: undefined,
                },
                city: ua.country.cities.find(
                  (uac) => uac._id + "" == ua.city + ""
                ),
              })),
            };
            return Promise.all([
              Favorite.findOne({ customer: doc._id })
                .populate([
                  {
                    path: "items",
                    populate: [{ path: " product" }],
                  },
                ])
                .exec(),
              Cart.findOne({ customer: doc._id })
                .populate([
                  {
                    path: "items",
                    populate: [{ path: " product" }],
                  },
                ])
                .exec(),
            ]);
          })
          .then(([favorite, cart]) =>
            Promise.resolve({ ...response, favorite, cart })
          )
          .catch((error) => Promise.reject(error));
      } else {
        return Promise.resolve(response);
      }
    })
    .then((doc) => {
      res.status(200).json({ ...doc });
    })
    .catch((error) => {
      res.status(500).json({ message: error.message });
    });
});

/**
 * @route   POST /user/create/customer
 * @desc    Create a Customer
 * @body    { name, email, password, phone, address: { name, zip, city, state, country } }
 */
router.post("/create/customer", (req, res, next) => {
  const ud = {
    user_name: req.body.user_name,
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    email: req.body.email,
    password: req.body.password,
    role: "customer",
  };
  const cd = {
    phone: req.body.phone,
    addresses: [req.body.address],
  };
  new User(ud)
    .save()
    .then((doc) => {
      return new Customer({ ...cd, user: doc._id }).save();
    })
    .then((doc) => doc.populate("user").execPopulate())
    .then((doc) => {
      return Promise.all([
        new Favorite({ customer: doc._id }).save(),
        new Cart({ customer: doc._id }).save(),
        doc,
      ]);
    })
    .then(([favorite, cart, customer]) => {
      res.status(200).json({
        data: customer,
        favorite: favorite,
        cart: cart,
        message: "Customer, Cart and Favorite List Created Successfully",
      });
    })
    .catch((error) => {
      res.status(500).json({ message: error.message });
    });
});

/**
 * @route   PUT /user/:user_id
 * @desc    Edit a user
 * Only for development, Use PUT /customer/:customer_id and PUT /admin/:admin_id instead.
 */

router.put("/:user_id", (req, res, next) => {
  User.findOneAndUpdate(
    { _id: req.params.user_id },
    { ...req.body },
    { new: true, useFindAndModify: false }
  )
    .then((doc) => {
      res.status(200).json({ data: doc, message: "Updated" });
    })
    .catch((error) => {
      res.status(500).json({ message: error.message });
    });
});

/**
 * @route   PUT /user/password/change
 * @desc    Change Password
 * @body    { _id, curr_pass, new_pass }
 */

router.put("/:id/password/change", (req, res, next) => {
  if (!("curr_pass" in req.body && "new_pass" in req.body))
    return res.status(400).json({ message: "Invalid Request Format" });
  User.findById(req.params.id)
    .then((doc) => {
      if (!doc) {
        return Promise.reject(new Error("No Such User Found"));
      } else if (!User.checkPassword(req.body.curr_pass, doc.password)) {
        return Promise.reject(new Error("Current Password is incorrect"));
      } else {
        return User.findByIdAndUpdate(
          req.params.id,
          { password: bcrypt.hashSync(req.body.new_pass, 10) },
          { new: true }
        ).exec();
      }
    })
    .then((doc) => {
      const token = jwt.sign(doc.toObject(), process.env.JWT_SECRET_KEY);
      res.status(200).json({ message: "Password Changed", data: doc, token });
    })
    .catch((error) => {
      res.status(500).json({ message: error.message });
    });
});

/**
 * @route       DELETE /user/:id
 * @description Delete a user record by id
 */
router.delete("/:id", (req, res, next) => {
  User.findByIdAndDelete(req.params.id)
    .then((doc) => {
      res.status(200).json({ data: doc, status: "Object Deleted" });
    })
    .catch((error) => {
      res.status(500).json({ message: error.message });
    });
});

/**
 * @route   POST /user/ipaddress
 * @desc    Verify User Ip Address
 * @body    { ip? }
 */
router.post("/ipaddress", (req, res, next) => {
  User.findOne({ ip_address: req.body.ip }, { new: true })
    .then((doc) => {
      if (!doc) {
        res.status(401).json({ code: 401, message: "Ip Address Not exist..!" });
      } else {
        res
          .status(201)
          .json({ code: 201, message: "Ip Address Sucessfully matched..!!" });
      }
    })
    .catch((error) => {
      res.status(500).json({ message: error.message });
    });
});

/**
 * @route       PUT /user/password/forgot
 * @description Send Email of a new password
 */

router.put("/password/forget", (req, res, next) => {
  const password = getRandomChars(8);
  User.findOneAndUpdate(
    { email: req.body.email },
    { password: bcrypt.hashSync(password, 10) },
    { new: true }
  )
    .then((doc) => {
      if (!doc)
        return Promise.reject(
          new Error(`User with Email '${req.body.email}' Not Found`)
        );
      return sendEmail(doc.email, {
        email: doc.email,
        password,
        message:
          "Here is your new password. Make sure to change after logging in with this password",
      });
    })
    .then(() => {
      res.status(200).json({ data: { status: "Email Sent" } });
    })
    .catch((error) => {
      res.status(500).json({ message: error.message });
    });
});

//delete user
router.delete("/:id", (req, res) => {
  User.FindOneAndDelete({ _id: req.params.id })
    .then(() => res.status(200).json({ message: "User Deleted" }))
    .catch((err) => res.status(400));
});
module.exports = router;

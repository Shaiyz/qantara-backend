// Express App Setup
require("dotenv/config");
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
require("./auth");

/**
 * Creating the app
 */
const app = express();
/**
 * Configuration
 */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.options((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin,X-REquested-with,Authorization"
  );
  res.header("Access-Control-Allow-Origin", "PUT,POST,PATCH,DELETE,GET");
  res.status(200).json({});
});
/**
 * Logging Middleware
 */
app.use(require("morgan")("dev"));

// Initialization
// const app = express();
app.use(cors());
app.use(bodyParser.json());
// Express route handlers
app.get("/test", (req, res) => {
  res.status(200).send({ text: "Simple Node App Working!" });
});
app.get("/", (req, res, next) => {
  res.status(200).json({ message: "Backend is Live" });
});

/**
 * Routes
 */
app
  .use("/user", require("../routes/user.routes"))
  .use("/country", require("../routes/country.routes"))
  .use("/delivery", require("../routes/delivery.routes"))
  .use("/category", require("../routes/category.routes"))
  .use("/subcategory", require("../routes/subcategory.routes"))
  .use("/productimage", require("../routes/productimages.routes"))
  .use("/product", require("../routes/product.routes"))
  .use("/customer", require("../routes/customer.routes"))
  .use("/favorite", require("../routes/favorite.routes"))
  .use("/cart", require("../routes/cart.routes"))
  .use("/contactus", require("../routes/contactus/contactus.routes"))
  .use("/order", require("../routes/order.routes"))
  .use("/file", require("../routes/upload.routes"))
  .use("/notifications", require("../routes/notification.routes"));

app.use("*", (req, res, next) => {
  res
    .status(404)
    .json({ message: `${req.method} ${req.originalUrl} Not Found` });
});
/**
 * Connect to mongodb
 */

mongoose
  .connect(process.env.DB, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
  })
  .then(() => {
    return Promise.all([
      mongoose.connection.db.collection("orders").countDocuments(),
      mongoose.connection.db.collection("users").countDocuments(),
    ]);
  })
  .then((doc) => {
    global.ORDERS = doc[0] + doc[3];
    global.USERS = doc[1];
    global.console.log("Environment Initialized");
  })
  .catch((error) => {
    console.log(error.message);
  });
module.exports = app;

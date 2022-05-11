const jwt = require("jsonwebtoken");
const { User } = require("../models");

const Authenticate = async (req, res, next) => {
  try {
    console.log(req.headers.authorization);

    const token = req.headers.authorization.split(" ")[1];
    const verifyToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const rootUser = await User.findOne({
      _id: verifyToken?.id || verifyToken?._id,
    });

    if (!rootUser) {
      throw new Error("User Not Found");
    }

    req.token = token;
    req.user = rootUser;
    next();
  } catch (error) {
    res.status(500).send({ message: "Unauthorized: No token provided" });
  }
};

module.exports = Authenticate;

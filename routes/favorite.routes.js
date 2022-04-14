const router = require("express").Router();
const { Favorite } = require("../models");
const { url_decode } = require("../util");

/**
 * @route		GET /favorite
 * @desc		Fetch  Favorite Records
 * @query		{ _id?, customer?, from?, to?, page?, populate?: url_encode([...])}
 */
router.get("/", (req, res, next) => {
  let populate = "";
  let query = {};
  let projections = { sort: "-_id" };

  if ("page" in req.query) {
    projections.skip = (parseInt(req.query.page) - 1) * process.env.PAGE_SIZE;
    projections.limit = parseInt(process.env.PAGE_SIZE);
  }

  if ("_id" in req.query) {
    query._id = { $in: req.query._id.split(",") };
  }
  if ("customer" in req.query) {
    query.customer = { $in: req.query.customer.split(",") };
  }

  if ("from" in req.query) {
    query.date_updated = { $gt: new Date(req.query.from) };
  }
  if ("to" in req.query) {
    query.date_updated = query.date_updated
      ? { ...query.date_updated, $lt: new Date(req.query.to) }
      : { $lt: new Date(req.query.to) };
  }

  if ("populate" in req.query) {
    populate = url_decode(req.query.populate);
  }

  Favorite.find(query, null, projections)
    .populate(populate)
    .exec()
    .then((doc) => {
      res.status(200).json({ data: doc });
    })
    .catch((error) => {
      res.status(500).json({ message: error.message });
    });
});

router.use("/", require("./unit.routes"));

module.exports = router;

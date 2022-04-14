const router = require("express").Router();
const { Country } = require("../models");

/**
 * @route		POST /country
 * @desc		Insert Country records
 * @body		{ country_name }
 */

router.post("/", (req, res, next) => {
  new Country(req.body)
    .save()
    .then((doc) => {
      res.status(200).json({ data: doc, message: "Country Record Saved" });
    })
    .catch((error) => {
      res.status(500).json({ message: error.message });
    });
});

/**
 * @route		GET /Country
 * @desc		Fetch Country records
 * @query		{ _id?, Country_typename, city_name }
 */

router.get("/", (req, res, next) => {
  let query = {};
  let projections = { sort: "-_id" };
  if ("_id" in req.query) query._id = { $in: req.query._id.split(",") };
  if ("country_name" in req.query) query.country_name = req.query.country_name;
  if ("published" in req.query) query.published = true;
  // if ("city_name" in req.query) query["cities.city_name"] = req.query.city_name;
  if ("isActive" in req.query) query["cities.isActive"] = true;
  Country.find(query, null, projections)
    .then((doc) => {
      res.status(200).json({ data: doc });
    })
    .catch((error) => {
      res.status(500).json({ message: error.message });
    });
});

/**
 * @route		PUT /Country/:country_id
 * @desc		Edit Country records
 * @body		{ country_name }
 */

router.put("/:country_id", (req, res, next) => {
  Country.findByIdAndUpdate(req.params.country_id, req.body, { new: true })
    .then((doc) => {
      res.status(200).json({ data: doc, message: "Country Record Changed" });
    })
    .catch((error) => {
      res.status(500).json({ message: error.message });
    });
});

/**
 * @route		DELETE /Country/:country_id
 * @desc		DELETE Country record
 */

router.delete("/:country_id", (req, res, next) => {
  Country.findByIdAndDelete(req.params.country_id)
    .then((doc) => {
      res.status(200).json({ message: "Country Record Deleted" });
    })
    .catch((error) => {
      res.status(500).json({ message: error.message });
    });
});

/**
 * Route for city
 */
router.use("/city", require("./city.routes"));
module.exports = router;

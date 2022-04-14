const router = require("express").Router();
const { Country } = require("../models");

/**
 * @route		POST /country/city/counrty_id
 * @desc		Insert City records
 * @body		{ city_name }
 */

router.post("/:country_id", (req, res, next) => {
  const update = req.body.cities;
  Country.findOneAndUpdate(
    {
      _id: req.params.country_id,
    },
    {
      $push: { cities: update },
    },
    { new: true, useFindAndModify: true }
  )
    .select("-cities")
    .then((doc) => {
      res.status(200).json({ data: doc, message: "City Record Saved" });
    })
    .catch((error) => {
      res.status(500).json({ message: error.message });
    });
});

/**
 * @route		PUT /Country/:country_id/:city_id
 * @desc		Edit City records
 * @body		{ country_name }
 */

router.put("/:country_id/:city_id", (req, res, next) => {
  const update = req.body;
  Country.findOneAndUpdate(
    {
      _id: req.params.country_id,
    },
    {
      $set: Object.keys(update).reduce((acc, curr) => {
        acc[`cities.$[att].${curr}`] = update[curr];
        return acc;
      }, {}),
    },
    {
      new: true,
      arrayFilters: [{ "att._id": req.params.city_id }],
    }
  )
    .select("-cities")
    .then((doc) => {
      res.status(200).json({ data: doc, message: "City Record Changed" });
    })
    .catch((error) => {
      res.status(500).json({ message: error.message });
    });
});

module.exports = router;

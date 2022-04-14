const router = require("express").Router();
const { Unit, Product, Cart, Favorite } = require("../models");
const { ObjectId } = require("mongoose").Types;
const { url_decode } = require("../util");
const { validate_request } = require("../middlewares");

function get_target(url) {
  let target = { model: null, name: null, type: null, type_name: null };
  switch (url.split("/")[1]) {
    case "cart":
      target.model = Cart;
      target.name = "Cart";
      break;
    case "favorite":
      target.model = Favorite;
      target.name = "Favorite";
      break;
    default:
      break;
  }
  return target;
}

/**
 * @route		POST 	/cart/:pri_id/unit
 * 						/favorite/pri_id/unit
 * @desc		Insert a new product/service unit into items in cart/favorite
 * @body		{ product }
 * @query		{ populate?: url_encode([...]) }
 * @summary		There are two types of body objects here. For a successful operation, you must specify the 'type' in query which is either equal to 'product' or 'services'.
 * 				If its 'products' then you specify the first type of body object and vice versa
 */

router.post(
  "/:pri_id/unit",
  validate_request([
    { name: "params", values: ["pri_id"], regex: "ObjectId" },
    { name: "body", values: ["product"], regex: "ObjectId" },
  ]),
  (req, res, next) => {
    const target = get_target(req.originalUrl);
    let populate = "";
    if ("populate" in req.query) {
      populate = url_decode(req.query.populate);
    }
    let req_f = [];
    if (target.name === "Cart") {
      req_f = ["product", "quantity"];
    } else {
      req_f = ["product"];
    }

    if (!req_f.every((i) => i in req.body)) {
      return res.status(500).json({
        message: "Invalid Request Format in 'body'",
        required_fields: req_f,
      });
    }
    new Unit(req.body)
      .save()
      .then((doc) => {
        return target.model
          .findByIdAndUpdate(
            req.params.pri_id,
            {
              $set: {
                date_updated: new Date(),
              },
              $push: {
                items: doc._id,
              },
            },
            { new: true }
          )
          .populate(populate)
          .exec();
      })
      .then((doc) => {
        if (!doc)
          return Promise.reject(new Error(`No such ${target.name} Found`));
        res.status(200).json({ data: doc, message: "Item added to list" });
      })
      .catch((error) => {
        res.status(500).json({ message: error.message });
      });
  }
);

/**
 * @route		GET 	/cart/:pri_id/unit
 * 						/favorite/:pri_id/unit
 * @desc		Fetch Items in Cart, Favorite
 * @query		{ _id?, page?, populate?: url_encode([...])}
 * @summary	Fetches elements in a cart/favorite list
 */

router.get("/:pri_id/unit", (req, res, next) => {
  const target = get_target(req.originalUrl);
  let query_m = { _id: req.params.pri_id };
  let query_u = {};
  let projections = [{ $sort: { _id: -1 } }];
  if ("_id" in req.query)
    query_u._id = { $in: req.query._id.split(",").map((i) => ObjectId(i)) };

  if ("page" in req.query) {
    projections.push({
      $skip: (parseInt(req.query.page) - 1) * process.env.PAGE_SIZE,
    });
    projections.push({ $limit: parseInt(process.env.PAGE_SIZE) });
  }
  target.model
    .findOne(query_m)
    .select("items")
    .then((doc) => {
      if (!doc)
        return Promise.reject(new Error(`No such ${target.name} Found`));
      if (doc.items && doc.items.length > 0) {
        if (
          query_u._id &&
          !query_u._id.$in.every((i) => doc.items.includes(i.toString()))
        )
          return Promise.reject(
            new Error("One of the _id in query doesn't match")
          );
        return Unit.findWithVariation(
          {
            _id: query_u._id
              ? query_u._id
              : { $in: doc.items.map((i) => ObjectId(i)) },
          },
          req.query.page
        );
      } else {
        return Promise.reject(new Error(`This ${target.name} has no Items`));
      }
    })
    .then((doc) => {
      res.status(200).json({
        data: doc,
        message: req.query.update ? "Unit Updated Successfully" : undefined,
      });
    })
    .catch((error) => {
      res.status(500).json({ message: error.message });
    });
});

/**
 * @route		PUT cart/:pri_id/unit/:unit_id
 * 				PUT favorite/:pri_id/unit/:unit_id
 * @desc		Edit a product/service unit in items in cart/favorite/
 * @body		{ product }
 * @query   { populate: url_decode([...])}
 */

router.put(
  "/:pri_id/unit/:unit_id",
  validate_request([
    { name: "params", values: ["pri_id", "unit_id"], regex: "ObjectId" },
    { name: "body", values: ["product"], regex: "ObjectId" },
  ]),
  (req, res, next) => {
    const target = get_target(req.originalUrl);
    let populate = "";
    if ("populate" in req.query) {
      populate = url_decode(req.query.populate);
    }
    target.model
      .findById(req.params.pri_id)
      .select("items")
      .then((doc) => {
        if (!doc)
          return Promise.reject(new Error(`No such ${target.name} Found`));
        else if (
          doc.items &&
          doc.items.length > 0 &&
          doc.items.includes(req.params.unit_id)
        ) {
          return Promise.all([
            Unit.findByIdAndUpdate(req.params.unit_id, req.body, {
              new: true,
            }),
            doc,
          ]);
        } else {
          return Promise.reject(
            new Error(`No Such Item Found in ${target.name}`)
          );
        }
      })
      .then((doc) => {
        return target.model
          .findByIdAndUpdate(
            req.params.pri_id,
            {
              date_updated: new Date(),
            },
            { new: true }
          )
          .populate(populate)
          .exec();
      })
      .then((doc) => {
        res
          .status(200)
          .json({ data: doc, message: `${target.name} Item Updated` });
      })
      .catch((error) => {
        res.status(500).json({ message: error.message });
      });
  }
);

/**
 * @route		DELETE cart/:pri_id/unit/:unit_id
 * 				DELETE favorite/:pri_id/unit/:unit_id
 * @desc		DELETE a product/service unit in items in cart/favorite
 */

router.delete(
  "/:pri_id/unit/:unit_id",
  validate_request([
    { name: "params", values: ["pri_id", "unit_id"], regex: "ObjectId" },
  ]),
  (req, res, next) => {
    let populate = "";
    if ("populate" in req.query) {
      populate = url_decode(req.query.populate);
    }
    const target = get_target(req.originalUrl);
    target.model
      .findById(req.params.pri_id)
      .select("items")
      .then((doc) => {
        if (!doc)
          return Promise.reject(new Error(`No such ${target.name} Found`));
        else if (
          doc.items &&
          doc.items.length > 0 &&
          doc.items.includes(req.params.unit_id)
        ) {
          return Unit.findByIdAndDelete(req.params.unit_id);
        } else {
          return Promise.reject(
            new Error(`No Such Item Found in ${target.name}`)
          );
        }
      })
      .then((doc) => {
        return target.model
          .findByIdAndUpdate(
            req.params.pri_id,
            {
              $set: {
                date_updated: new Date(),
              },
              $pull: {
                items: req.params.unit_id,
              },
            },
            { new: true }
          )
          .populate(populate)
          .exec();
      })
      .then((doc) => {
        res.status(200).json({
          data: doc,
          message: `Unit Deleted and ${target.name} Items updated Successfully `,
        });
      })
      .catch((error) => {
        res.status(500).json({ message: error.message });
      });
  }
);

module.exports = router;

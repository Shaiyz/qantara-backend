const router = require("express").Router();
const { Customer, User } = require("../models");
const { url_decode } = require("../util");
/**
 * @route		GET /customer
 * @desc		Fetch all customers. Pagination Available
 * @query		{ _id?, user?, active?, name?, email?, address_name?, city?, state?, country?, populate: url_encode([...]) }
 * @other		if you provide _id or user then no other query params should be given.
 */
router.get("/", (req, res, next) => {
  let cus_query = {};
  let user_query = {};
  let populate = "";
  let projections = { sort: "-_id" };

  if ("_id" in req.query) cus_query._id = { $in: req.query._id.split(",") };
  if ("user" in req.query) cus_query.user = { $in: req.query.user.split(",") };
  if ("address" in req.query)
    cus_query["addresses.address"] = {
      $regex: req.query.address,
      $options: "i",
    };
  if ("city" in req.query)
    cus_query["addresses.city"] = { $regex: req.query.city, $options: "i" };
  if ("state" in req.query)
    cus_query["addresses.state"] = {
      $regex: req.query.state,
      $options: "i",
    };
  if ("country" in req.query)
    cus_query["addresses.country"] = {
      $regex: req.query.country,
      $options: "i",
    };

  if ("name" in req.query)
    user_query.name = { $regex: req.query.name, $options: "i" };
  if ("email" in req.query)
    user_query.email = { $regex: req.query.email, $options: "i" };
  if ("active" in req.query)
    user_query.active = ["false", "0", "null", false, 0, null].every(
      (i) => i !== req.body.active
    );

  if ("populate" in req.query) {
    populate = url_decode(req.query.populate);
  }

  let query = null;
  if (Object.keys(user_query).length > 0) {
    query = new Promise((resolve, reject) => {
      User.find(user_query, "_id", projections)
        .then((doc) => {
          return Customer.find({
            user: { $in: doc.map((d) => d._id) },
          })
            .populate(populate)
            .exec();
        })
        .then(resolve)
        .catch(reject);
    });
  } else {
    query = Customer.find(cus_query, null, projections)
      .populate(populate)
      .exec();
  }

  query
    .then((doc) => {
      res.status(200).json({ data: doc });
    })
    .catch((error) => {
      res.status(500).json({ message: error.message });
    });
});

/**
 * @route		PUT /customer/:customer_id
 * @desc 		Change customer details.
 * @body		{ name?, phone?, address?: {_id, address?, zip?, city?, state?, country?, operation: ['add', 'edit', 'delete'] } }
 * if an address is to be changed, then you must specify _id of the said address in the placeholder above and assign operation to 'edit'
 * Similarly for operation='delete' _id is required in the address object
 * if a new address is to be added, then you must not include _id field in the placeholder above and assign operation to 'add'
 */
router.put("/:customer_id", (req, res, next) => {
  let u_ud = {};
  let c_ud = {};
  if ("name" in req.body) {
    u_ud.name = req.body.name;
  }
  if ("active" in req.body) {
    u_ud.active = ["false", "0", "null", false, 0, null].every(
      (i) => i !== req.body.active
    );
  }
  if ("phone" in req.body) {
    c_ud.phone = req.body.phone;
  }
  if ("address" in req.body) {
    if (req.body.address.operation === "add") {
      delete req.body.address["_id"];
      delete req.body.address["operation"];
      if (!["city", "country"].every((e) => e in req.body.address)) {
        res.status(500).json({
          message:
            "If a new address is added,  'city',  'country' must be given in 'address'",
        });
      }
      c_ud["$push"] = { addresses: req.body.address };
    } else if (req.body.address.operation === "delete") {
      if (!req.body.address._id) {
        res.status(200).json({
          message: "Please specify '_id' field for 'delete' address operation",
        });
      }
      c_ud["$pull"] = {
        addresses: { _id: req.body.address._id },
      };
    } else {
      res.status(500).json({
        message:
          "Please specify an operation in address. Either 'add' or 'delete'",
      });
    }
  }
  Customer.findById(req.params.customer_id)
    .then((doc) => {
      if (!doc) return Promise.reject(new Error("No Such Customer Found"));
      return Promise.all([
        User.findByIdAndUpdate(doc.user, u_ud, { new: true }),
        Customer.findByIdAndUpdate(req.params.customer_id, c_ud, {
          new: true,
          arrayFilters: c_ud.$set ? [{ "addr._id": req.body.address._id }] : [],
        })
          .populate("user addresses.country")
          .exec(),
      ]);
    })
    .then(([user, customer]) => {
      res.status(200).json({
        data: {
          ...customer.toObject(),
          addresses: customer.addresses.map((ua) => ({
            ...ua.toObject(),
            country: {
              ...ua.toObject().country,
              cities: undefined,
            },
            city: ua.country.cities.find((uac) => uac._id + "" == ua.city + ""),
          })),
        },
        message: "Update Successfull",
      });
    })
    .catch((error) => {
      res.status(500).json({ message: error.message });
    });
});

/**
 * @route		DELETE /customer/:customer_id
 * @desc 		Delete a customer
 */
router.delete("/:customer_id", (req, res, next) => {
  Customer.findByIdAndDelete(req.params.customer_id)
    .then((doc) => {
      if (!doc) return Promise.reject(new Error("No Such Customer Found"));
      return User.findByIdAndDelete(doc.user);
    })
    .then((doc) => {
      res.status(200).json({ message: "Deletion Successful" });
    })
    .catch((error) => {
      res.status(500).json({ message: error.message });
    });
});

module.exports = router;

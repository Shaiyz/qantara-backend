const mongoose = require("mongoose");
const { send_email, get_future_date } = require("../util");
const User = require("./user.js");

/**
 *  CREATE ORDER MODEL
 */
const Order = new mongoose.Schema({
  order_track_id: {
    type: String,
    required: true,
    unique: true,
  },
  total_price: {
    type: Number,
  },
  total_sales_tax: {
    type: Number,
  },
  items: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "units",
    },
  ],
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "customers",
  },
  shipping_address: {
    type: new mongoose.Schema(
      {
        street: {
          type: String,
          required: true,
        },
        zip: {
          type: String,
          required: true,
        },
        city: {
          type: String,
          required: true,
        },
        state: {
          type: String,
          required: true,
        },
        country: {
          type: String,
          required: true,
        },
      },
      { _id: false }
    ),
    required: true,
  },
  billing_address: {
    type: new mongoose.Schema(
      {
        street: {
          type: String,
          required: true,
        },
        zip: {
          type: String,
          required: true,
        },
        city: {
          type: String,
          required: true,
        },
        state: {
          type: String,
          required: true,
        },
        country: {
          type: String,
          required: true,
        },
      },
      { _id: false }
    ),
    required: true,
  },
  status: {
    type: new mongoose.Schema(
      {
        checked_out: {
          type: new mongoose.Schema(
            {
              date: {
                type: Date,
                default: new Date(),
              },
              message: {
                type: String,
              },
            },
            { _id: false }
          ),
        },
        declined: {
          type: new mongoose.Schema(
            {
              date: {
                type: Date,
                default: new Date(),
              },
              message: {
                type: String,
              },
            },
            { _id: false }
          ),
        },
        in_progress: {
          type: new mongoose.Schema(
            {
              date: {
                type: Date,
                default: new Date(),
              },
              message: {
                type: String,
              },
            },
            { _id: false }
          ),
        },
        delivered: {
          type: new mongoose.Schema(
            {
              date: {
                type: Date,
                default: new Date(),
              },
              message: {
                type: String,
              },
            },
            { _id: false }
          ),
        },
        return: {
          type: new mongoose.Schema(
            {
              date: {
                type: Date,
                default: new Date(),
              },
              message: {
                type: String,
              },
            },
            { _id: false }
          ),
        },
      },
      { _id: false }
    ),
  },
  billing_details: {
    type: new mongoose.Schema(
      {
        payment_type: {
          type: String,
          enum: ["cash-on-delivery", "online"],
        },
        delivery_charges: {
          type: Number,
        },
      },
      { _id: false }
    ),
  },
});

Order.pre("validate", function (next) {
  const num = global.ORDERS + parseInt(process.env.INITIAL_POS) + "";
  this.order_track_id = `EKS-${"0".repeat(10 - num.length)}${num}`;
  global.ORDERS += 1;
  next();
});

// Order.methods.send_email = async function () {
//   try {
//     const order = await this.model("orders")
//       .findOne({ _id: this._id })
//       .populate([
//         {
//           path: "items",
//           populate: [
//             {
//               path: "product",
//             },
//           ],
//         },
//         {
//           path: "customer",
//           populate: [
//             {
//               path: "user",
//               select: "-password",
//             },
//           ],
//         },
//       ])
//       .exec();
//     await send_email(
//       "order",
//       "Qantara-ORDER",
//       {
//         redirect: process.env.FRONTEND,
//         message:
//           "Thank you for Shopping with us. You order has been received. You will soon be approached by our team",
//         ...order.toObject(),
//       },
//       null,
//       { to: [order.customer.user.email], bcc: [process.env.ADMIN_EMAIL] }
//     );
//     return true;
//   } catch (e) {
//     return false;
//   }
// };

module.exports = mongoose.model("orders", Order);

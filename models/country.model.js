const mongoose = require("mongoose");
/**
 *  CREATE COUNTRY AND LIST OF CITIES ACCORDING TO THAT COUNRTY
 */
const country = new mongoose.Schema({
  country_name: {
    type: String,
    unique: [true, "country already exists"],
  },
  published: {
    type: Boolean,
    default: true,
  },
  // cities: [
  //   {
  //     type: new mongoose.Schema({
  //       city_name: {
  //         type: String,
  //         unique: [true, "city already exists"],
  //       },
  //       isActive: {
  //         type: Boolean,
  //         default: true,
  //       },
  //     }),
  //   },
  // ],
});

module.exports = mongoose.model("countries", country);

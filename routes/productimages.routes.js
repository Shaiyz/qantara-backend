const express = require("express");
const router = express.Router();

const aws = require("aws-sdk");
const multerS3 = require("multer-s3");
const multer = require("multer");
const path = require("path");
const url = require("url");

/**
 * express.Router() creates modular, mountable route handlers
 * A Router instance is a complete middleware and routing system; for this reason, it is often referred to as a “mini-app”.
 */
/**
 * PROFILE IMAGE STORING STARTS
 */
const s3 = new aws.S3({
  // accessKeyId: "AKIA6PDBSATZNQWUH77A",
  // secretAccessKey: "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",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  Bucket: "image-assets-bucket",
});
/**
 * Single Upload
 */
// Multiple File Uploads ( max 4 )
const uploadsBusinessGallery = multer({
  storage: multerS3({
    s3: s3,
    bucket: "image-assets-bucket",
    acl: "public-read",
    key: function (req, file, cb) {
      cb(
        null,
        path.basename(file.originalname, path.extname(file.originalname)) +
          "-" +
          Date.now() +
          path.extname(file.originalname)
      );
    },
  }),
  limits: { fileSize: 15728640 }, // In bytes: 15728640 bytes = 15 MB
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).array("galleryImage", 15);
/**
 * Check File Type
 * @param file
 * @param cb
 * @return {*}
 */
function checkFileType(file, cb) {
  // Allowed ext
  const filetypes = /jpeg|jpg|png|gif/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error: image file Only!");
  }
}
/**
 * @route POST /productimage/product-images-upload
 * @desc Upload ony image file and return path
 * @access public
 */
router.post("/product-images-upload", (req, res) => {
  console.log("inloop");
  uploadsBusinessGallery(req, res, (error) => {
    console.log("files", req.files);
    if (error) {
      console.log("errors", error);
      res.json({ error: error });
    } else {
      // If File not found
      if (req.files === undefined) {
        console.log("Error: No File Selected!");
        res.json("Error: No File Selected");
      } else {
        // If Success
        let fileArray = req.files,
          fileLocation;
        const galleryImgLocationArray = [];
        for (let i = 0; i < fileArray.length; i++) {
          fileLocation = fileArray[i].location;
          galleryImgLocationArray.push(fileLocation);
        }
        // Save the file name into database
        res.json({
          filesArray: fileArray,
          locationArray: galleryImgLocationArray,
        });
      }
    }
  });
});

module.exports = router;

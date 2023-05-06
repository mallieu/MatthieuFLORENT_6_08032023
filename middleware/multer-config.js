const multer = require("multer");
const path = require("path");

const MIME_TYPES = {
    "image/jpg": "jpg",
    "image/jpeg": "jpg",
    "image/png": "png",
};

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, "images");
    },
    filename: (req, file, callback) => {
        const name = file.originalname.split(" ").join("_");
        const nameWithoutExtension = path.parse(name).name.replace(/ /g, "_");
        const extension = MIME_TYPES[file.mimetype];
        callback(null, nameWithoutExtension + Date.now() + "." + extension);
    },
    fileFilter: (req, file) => {
        return (
            file.mimetype === "image/jpeg" ||
            file.mimetype === "image/jpg" ||
            file.mimetype === "image/png"
        );
    },
});

// Attention, 'image' correspond à ce qui est attendu par la requête
module.exports = multer({ storage: storage }).single("image");

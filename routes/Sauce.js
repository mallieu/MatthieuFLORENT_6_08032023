const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const multer = require("../middleware/multer-config");
const sauceCtrl = require("../controllers/Sauce");
const preventXSS = require("../middleware/preventXSS");

router.get("/:id", preventXSS, auth.checkUserAuth, sauceCtrl.getOneSauce);
router.get("/", preventXSS, auth.checkUserAuth, sauceCtrl.getAllSauce);
router.post("/", preventXSS, auth.checkUserAuth, multer, sauceCtrl.createSauce);
router.put("/:id", preventXSS, auth.checkUserAuth, auth.checkSauceCreator, multer, sauceCtrl.modifySauce);
router.delete("/:id", preventXSS, auth.checkUserAuth, auth.checkSauceCreator, sauceCtrl.deleteSauce);
router.post("/:id/like", preventXSS, auth.checkUserAuth, sauceCtrl.likesSauce);

module.exports = router;

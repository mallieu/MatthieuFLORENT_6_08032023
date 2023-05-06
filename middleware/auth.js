const jwt = require("jsonwebtoken");
const Sauce = require("../models/Sauce");
const User = require("../models/User");

// Vérifie que l'utilisateur est bien enregistré
module.exports.checkUserAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization.split(" ")[1]; // Enlève le mot Bearer
        const decodedToken = jwt.verify(token, process.env.SECRETKEY);
        const userId = decodedToken.userId;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({
                message: "Utilisateur invalide",
            });
        } else {
            req.auth = {
                userId: userId,
            };
            next();
        }
    } catch (error) {
        res.status(401).json({ error });
    }
};

// Vérifie que l'utilisateur est bien propriétaire de la sauce
module.exports.checkSauceCreator = async (req, res, next) => {
    try {
        const token = req.headers.authorization.split(" ")[1]; // Enlève le mot Bearer
        const decodedToken = jwt.verify(token, process.env.SECRETKEY);
        const sauce = await Sauce.findById(req.params.id);
        if (sauce.userId.includes(decodedToken.userId)) {
            next();
        } else {
            return res.status(500).json({
                message: "Utilisateur invalide",
            });
        }
    } catch (error) {
        return res.status(500).json({ message: error });
    }
};

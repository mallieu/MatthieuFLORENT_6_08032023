const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("validator");

const User = require("../models/User");
exports.signup = async (req, res) => {
    try {
        if (!validator.isEmail(req.body.email)) {
            throw new Error("Email non valide");
        }
        if (
            !req.body.password.match(/[0-9]/g) ||
            !req.body.password.match(/[a-z]/g) ||
            !req.body.password.match(/[^a-zA-Z\d]/g) ||
            !req.body.password.match(/[A-Z]/g) ||
            !validator.isLength(req.body.password, { min: 8, max: 20 })
        ) {
            throw new Error(
                "Le mot de passe doit contenir au moins 1 caractère majuscule, 1 chiffre, au moins 1 caractère spécial et être compris entre 8 et 20 caractères."
            );
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = new User({
            email: req.body.email,
            password: hashedPassword,
        });
        await user.save();
        res.status(201).json({
            message: "Utilisateur créé !",
        });
    } catch (error) {
        console.log(error);
        res.status(400).json({
            error,
        });
    }
};

exports.login = async (req, res) => {
    const user = await User.findOne({
        email: req.body.email,
    });
    if (!user) {
        return res.status(401).json({
            error: "Informations de connexion invalides",
        });
    }
    const validPassword = await bcrypt.compare(
        req.body.password,
        user.password
    );
    if (!validPassword) {
        return res.status(401).json({
            error: "Informations de connexion invalides",
        });
    }
    res.status(200).json({
        userId: user._id,
        token: jwt.sign(
            {
                userId: user._id,
            },
            process.env.SECRETKEY,
            {
                expiresIn: "24h",
            }
        ),
    });
};

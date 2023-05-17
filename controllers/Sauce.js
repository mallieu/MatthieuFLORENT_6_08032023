const Sauce = require("../models/Sauce");
const fs = require("fs");
const requestValidation = require("../middleware/requestValidation");

// Crée une sauce
exports.createSauce = async (req, res) => {
    try {
        const sauce = new Sauce({
            ...JSON.parse(req.body.sauce),
            userId: req.auth.userId,
            imageUrl: `${req.protocol}://${req.get("host")}/images/${
                req.file.filename
            }`,
        });
        sauce.heat = parseInt(sauce.heat); // Garantit typeof Number
        const sauceObject = sauce; // sauceObject la procédure de validation
        const validation = await requestValidation(sauce, sauceObject);
        if (!validation) {
            // Supprime l'image générée en cas d'erreur de validation
            if (sauceObject.imageUrl !== undefined) {
                let sauceObjectFileName =
                    sauceObject.imageUrl.split("/images/")[1];
                fs.existsSync(`images/${sauceObjectFileName}`)
                    ? fs.unlinkSync(`images/${sauceObjectFileName}`)
                    : (sauceObjectFileName = null);
            }
            return res.status(400).json({
                message: "La validation a échouée",
            });
        }
        await sauce.save(); // Enregistre la sauce dans mongoDB
        return res.status(201).json({
            message: "Sauce ajoutée !",
        });
    } catch (error) {
        // Supprime l'image générée en cas d'erreur
        if (req.file && req.file.path) {
            fs.unlink(req.file.path, () => {});
        }
        res.status(500).json({
            error
        });
    }
};

// Modifie une sauce
exports.modifySauce = async (req, res) => {
    try {
        const isFileUploaded = req.file;
        const sauce = await Sauce.findOne({
            _id: req.params.id,
        });
        if (!sauce) {
            return res.status(404).json({
                error: "Le produit n'existe pas",
            });
        }
        const sauceFileName = sauce.imageUrl.split("/images/")[1];
        // Gère la modification avec ou sans image
        // A noter que le format de la requete est différent suivant le cas (JSON ou string)
        let sauceObject = isFileUploaded
            ? {
                  ...JSON.parse(req.body.sauce),
                  imageUrl: `${req.protocol}://${req.get("host")}/images/${
                      req.file.filename
                  }`,
              }
            : {
                  ...req.body,
              };

        sauceObject.heat = parseInt(sauceObject.heat); // Garantit typeof Number
        delete sauceObject._userId; // Évite la génération d'un nouvel ID
        const sauceObjectPrototype = {
            ...sauce._doc, // Enlève les propriétés liées à mongoDB
            ...sauceObject,
        };
        const validation = await requestValidation(sauce, sauceObjectPrototype);
        if (isFileUploaded && !validation) {
            // Supprime l'image générée en cas d'erreur de validation
            fs.unlinkSync(`images/${isFileUploaded.filename}`);
            return res.status(400).json({
                message: "La validation a échouée",
            });
        }
        if (!validation) {
            return res.status(400).json({
                message: "La validation a échouée",
            });
        }
        if (isFileUploaded) {
            fs.existsSync(`images/${sauceFileName}`)
                ? fs.unlinkSync(`images/${sauceFileName}`)
                : (sauceObject.imageUrl = `${req.protocol}://${req.get(
                      "host"
                  )}/images/${req.file.filename}`);
        }

        // Met à jour la sauce dans mongoDB
        await Sauce.updateOne(
            {
                _id: req.params.id,
            },
            {
                ...sauceObject,
                _id: req.params.id,
            }
        );
        res.status(201).json({
            message: "Sauce mise à jour correctement !",
        });
    } catch (error) {
        // Supprime l'image générée en cas d'erreur
        if (req.file && req.file.path) {
            fs.unlink(req.file.path, () => {});
        }
        res.status(500).json({
            error: error.message,
        });
    }
};

// Supprime une sauce
exports.deleteSauce = async (req, res) => {
    try {
        const sauce = await Sauce.findOne({
            _id: req.params.id,
        });
        if (!sauce) {
            return res.status(404).json({
                message: "Le produit n'existe pas",
            });
        } else {
            const filename = sauce.imageUrl.split("/images/")[1];
            if (fs.existsSync(`images/${filename}`)) {
                fs.unlinkSync(`images/${filename}`);
            }
            await Sauce.deleteOne({
                _id: req.params.id,
            });
            res.status(200).json({
                message: "Sauce supprimée !",
            });
        }
    } catch (error) {
        res.status(500).json({
            error: error.message,
        });
    }
};

// Affiche une page Sauce
exports.getOneSauce = async (req, res) => {
    try {
        const sauce = await Sauce.findOne({
            _id: req.params.id,
        });
        if (!sauce) {
            return res.status(404).json({
                error: "La sauce n'a pas été trouvée",
            });
        }
        res.status(200).json(sauce);
    } catch (error) {
        res.status(500).json({
            error: error.message,
        });
    }
};

// Affiche l'ensemble des sauces
exports.getAllSauce = async (req, res) => {
    try {
        const sauces = await Sauce.find();
        if (!sauces) {
            return res.status(404).json({
                message: "La sauce ou les sauces n'ont pas été trouvées",
            });
        }
        res.status(200).json(sauces);
    } catch (error) {
        res.status(500).json({
            error: error.message,
        });
    }
};

// Gestion des likes d'une sauce
exports.likesSauce = async function (req, res) {
    try {
        const like = Number(req.body.like);
        const userId = req.auth.userId;
        const sauce = await Sauce.findOne({
            _id: req.params.id,
        });
        if (!sauce) {
            return res.status(404).json({
                error: "La sauce n'a pas été trouvée",
            });
        }

        // Vérifie la validité des votes de la sauce et de l'utilisateur
        await checkUserStatus(sauce, userId);

        // Gère les votes sur un objet pour éviter de modifier la sauce en cas d'erreur
        const sauceObject = sauce;

        if (isNaN(like) || like > 1 || like < -1) {
            throw new Error("Like is not a valid number!");
        }
        if (like == 1) {
            sauceLike(sauceObject, userId);
        }
        if (like == 0) {
            sauceNeutral(sauceObject, userId);
        }
        if (like == -1) {
            sauceDislike(sauceObject, userId);
        }

        const validation = await requestValidation(sauce, sauceObject);
        if (!validation) {
            return res.status(400).json({
                message: "La validation a échouée",
            });
        }

        await Sauce.updateOne(
            {
                _id: req.params.id,
            },
            sauceObject
        );
        console.log("nouvelle sauce", sauce);
        res.status(200).json({
            message: "Le vote a été pris en compte",
        });
    } catch (error) {
        res.status(500).json({
            error: error.message,
        });
    }
};

const checkUserStatus = async (sauceObject, userId) => {
    await removeUserDuplicates(sauceObject);
    const liking = sauceObject.usersLiked.includes(userId);
    const disliking = sauceObject.usersDisliked.includes(userId);
    // Supprime les votes de l'utilisateur s'il est en doublon
    if (liking === true && disliking === true) {
        removeLike(sauceObject, userId, liking);
        removeDislike(sauceObject, userId, disliking);
        console.log("L'utilisateur a été régularisé");
    }
};

const removeUserDuplicates = async (sauceObject) => {
    // Supprime les utilisateurs en doublon
    sauceObject.usersLiked = sauceObject.usersLiked.filter(
        (user, index) => sauceObject.usersLiked.indexOf(user) === index
    );
    sauceObject.usersDisliked = sauceObject.usersDisliked.filter(
        (user, index) => sauceObject.usersDisliked.indexOf(user) === index
    );
    // Fait correspondre le nombre de votes au nombre d'utilisateurs
    sauceObject.likes = sauceObject.usersLiked.length;
    sauceObject.dislikes = sauceObject.usersDisliked.length;
};

const sauceLike = (sauceObject, userId) => {
    const liking = sauceObject.usersLiked.includes(userId);
    const disliking = sauceObject.usersDisliked.includes(userId);
    if (liking === true) {
        removeLike(sauceObject, userId, liking);
    } else {
        if (disliking === true) {
            removeDislike(sauceObject, userId, disliking);
        }
        sauceObject.usersLiked.push(userId);
        sauceObject.likes += 1;
    }
};

const sauceDislike = (sauceObject, userId) => {
    const liking = sauceObject.usersLiked.includes(userId);
    const disliking = sauceObject.usersDisliked.includes(userId);
    if (disliking === true) {
        removeDislike(sauceObject, userId, disliking);
    } else {
        if (liking === true) {
            removeLike(sauceObject, userId, liking);
        }
        sauceObject.usersDisliked.push(userId);
        sauceObject.dislikes += 1;
    }
};

const sauceNeutral = (sauceObject, userId) => {
    const liking = sauceObject.usersLiked.includes(userId);
    const disliking = sauceObject.usersDisliked.includes(userId);
    if (liking === true) {
        removeLike(sauceObject, userId, liking);
    } else if (disliking === true) {
        removeDislike(sauceObject, userId, disliking);
    }
};

const removeDislike = (sauceObject, userId) => {
    const dislikedIndex = sauceObject.usersDisliked.indexOf(userId);
    if (dislikedIndex !== -1) {
        sauceObject.usersDisliked.splice(dislikedIndex, 1);
        sauceObject.dislikes -= 1;
    }
};

const removeLike = (sauceObject, userId) => {
    const likedIndex = sauceObject.usersLiked.indexOf(userId);
    if (likedIndex !== -1) {
        sauceObject.usersLiked.splice(likedIndex, 1);
        sauceObject.likes -= 1;
    }
};

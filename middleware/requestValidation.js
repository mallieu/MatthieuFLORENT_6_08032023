const mongoose = require("mongoose");
const inputValidation = require("../middleware/inputValidation");

// Renvoie une validation au format booléen
// Si un test est false, la validation est false
// actualObject => Objet initial de la requête avant modification
// futureObject => Objet modifié en cours de vérification
module.exports = async function (actualObject, futureObject) {
    const checkAllFields = async function () {
        const schemaFieldsTypes = await getSchemaFieldsTypes(actualObject);
        const compareSchemaAndObject = await compareFields(
            actualObject,
            futureObject,
            schemaFieldsTypes
        );
        return compareSchemaAndObject;
    };
    const requestValidation = await checkAllFields();
    return requestValidation;
};

// Définit le schéma à l'origine de l'objet et les champs nécessaires
const getSchemaFieldsTypes = async (actualObject) => {
    const modelName = actualObject.constructor.modelName; // Retrouve le nom
    const Model = mongoose.model(modelName); // Utilise le nom pour retrouver le schema mongoose
    const schemaFieldsTypes = {};
    Model.schema.eachPath((path, schemaType) => {
        // Exclut les items générés par mongoose
        if (path.startsWith("_")) {
            return;
        }
        const fieldType = schemaType.instance; // Définit l'ensemble des proprités avec leur typeof
        schemaFieldsTypes[path] = fieldType; // Les enregistre
    });
    return schemaFieldsTypes;
};

// Vérifie la conformité de la requête avec le schéma de l'objet
const compareFields = async (actualObject, futureObject, schemaFieldsTypes) => {
    // Utilisé principalement pour faire correspondre l'index avec les propriétés du schéma)
    const schemaKeys = Object.keys(actualObject.schema.paths);

    // Récupère le type et le passe en miniscule pour être conforme
    const schemaFieldsTypesValues = Object.values(schemaFieldsTypes).map(
        (key) => key.toLowerCase()
    );

    // Tableaux récoltant les erreurs de champs potentielles
    const missingFields = [];
    const wrongTypeof = [];
    for (const field in schemaFieldsTypes) {
        // Gère les différences entre array (mongoose) et object (JS)
        schemaFieldsTypesValues[schemaKeys.indexOf(field)] === "array"
            ? (schemaFieldsTypesValues[schemaKeys.indexOf(field)] = "object")
            : schemaFieldsTypesValues[schemaKeys.indexOf(field)];

        // Le champ userId est géré /middleware/auth.js
        if (field === "userId") {
            continue;
        }

        // Vérifie si les types des champs correspondent et si futureObject les a
        if (
            typeof futureObject[field] !==
            schemaFieldsTypesValues[schemaKeys.indexOf(field)]
        ) {
            if (!Object.prototype.hasOwnProperty.call(futureObject, field)) {
                wrongTypeof.push(field);
            }
        }
        // Vérifie à partir du schema si futureObject ou actualObject ont tous les champs
        if (!schemaKeys.includes(field)) {
            if (!Object.prototype.hasOwnProperty.call(futureObject, field)) {
                missingFields.push(field);
            }
        }
        // Vérifie le contenu de chaque élément selon son typeof
        inputValidation(typeof futureObject[field], futureObject[field]);
    }
    // En cas d'erreur, les erreurs sont réparties dans ces tableaux
    if (wrongTypeof.length > 0) {
        return false;
    }
    if (missingFields.length > 0) {
        return false;
    }
    // Validation des valeurs attendues
    if (
        isNaN(futureObject.heat) ||
        futureObject.heat < 1 ||
        futureObject.heat > 10
    ) {
        return false;
    }
    if (isNaN(futureObject.likes) || futureObject.likes < 0) {
        return false;
    }
    if (isNaN(futureObject.dislikes) || futureObject.dislikes < 0) {
        return false;
    }
    return true;
};

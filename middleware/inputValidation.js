const validator = require("validator");

function inputValidation(typeOfField, contentOfField) {
  const errors = [];

  const regexString = /^[a-zA-ZàâäéèêëîïôöùûüÿçÀÂÄÉÈÊËÎÏÔÖÙÛÜŸÇ\s\-,()\.'!?]+$/i;

  switch (typeOfField) {
    case "object":
      if (Array.isArray(contentOfField)) {
        // Vérifie la validité d'un array
        contentOfField.forEach((value, index) => {
          if (!validator.isLength(value, { min: 1, max: 255 })) {
            errors.push(`Invalid value at index ${index}`);
          }
        });
      } else {
        // Vérifie le contenu d'un array
        Object.keys(contentOfField).forEach((key) => {
          const value = contentOfField[key];
          if (!validator.isLength(value.toString(), { min: 1, max: 255 })) {
            errors.push(`Invalid value for property '${key}'`);
          }
          if (!regexString.test(value)) {
            errors.push(`Invalid input data for property '${key}'`);
          }
        });
      }
      break;

    case "string":
      if (contentOfField.startsWith("http://localhost:3000/")) {
        if (!contentOfField.includes("/images/")) {
          errors.push("Invalid URL");
        }
        break;
      } else {
        if (!validator.isLength(contentOfField, { min: 1, max: 255 })) {
          errors.push("Invalid length input data");
        }
        if (!regexString.test(contentOfField)) {
          errors.push(`Invalid input data: ${contentOfField}`);
        }
        break;
      }

    case "number":
      if (!validator.isInt(contentOfField.toString())) {
        errors.push(`Invalid input data: ${contentOfField}`);
      }
      break;

    default:
      errors.push("Invalid request input");
      break;
  }

  return errors;
}

module.exports = inputValidation;

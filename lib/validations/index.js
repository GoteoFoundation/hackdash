/**
 * Functions to validate models
 */
import {theme} from '../../config/config.json'

const validations = require('lib/validations/model_validations');
let theme_validations;

try {
  theme_validations = require('../../themes/' + theme + '/validations');
  console.log('Found custom validations', theme_validations);
} catch(e) {
  console.log('No custom validations for theme ' + theme);
}

export const validateUser = (model) => {
  // Check if the theme has some custom validations
  if(theme_validations && theme_validations.validateUser)
    return theme_validations.validateUser(model);
  return validateUser.validateUser(model);
};


// This file is not in ES6 because client uses it
import {theme} from '../../config/config.json'
let roles
try {
  roles = require('../../themes/' + theme + '/roles.json');
} catch(e) {
  roles = require('../../config/roles.json');
}

export default roles

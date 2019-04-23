// This file is not in ES6 because client uses it
import {theme} from '../../config/config.json'
let statuses
try {
  statuses = require('../../themes/' + theme + '/statuses.json');
} catch(e) {
  statuses = require('../../config/statuses.json');
}

export default statuses

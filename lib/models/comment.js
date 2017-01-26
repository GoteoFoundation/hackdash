
/**
 * Project schema
 */

import {Schema} from 'mongoose';
import config from '../../config/config.json';

const types = config.commentTypes || [];

export default {
  'project':      { type: Schema.ObjectId, required: true, ref: 'Project' },
  'user':         { type: Schema.ObjectId, required: true, ref: 'User' },
  'type':         { type: String, enum: types, default: types[0] },
  'comment':      { type: String, required: true },
  'created_at':   { type: Date, default: Date.now }
}

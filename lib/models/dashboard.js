
/**
 * Dashboard schema
 */

import {Schema} from 'mongoose';

export default {
  'domain':           String,
  'title':            String,
  'description':      String,
  'link':             String,
  'open':             { type: Boolean, default: true },
  'private':          { type: Boolean, default: false },
  'inactiveStatuses': [String],
  'showcase':         [String],
  'owner':            { type: Schema.ObjectId, ref: 'User' },
  'created_at':       { type: Date, default: Date.now },
  'covers':           [String],
  'projectsCount':    Number
};

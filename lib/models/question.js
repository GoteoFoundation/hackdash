
/**
 * Question schema
 *
 * Every question will be bind to a collection or a dashboard (or both)
 */

import {Schema} from 'mongoose';

export default {
  'collection':   { type: Schema.ObjectId, ref: 'Collection' },
  'board':      { type: Schema.ObjectId, ref: 'Dashboard' },
  'creator':      { type: Schema.ObjectId, required: true, ref: 'User' },
  'title':        { type: String, required: true },
  'created_at':   { type: Date, default: Date.now }
};

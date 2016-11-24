
/**
 * Form schema
 *
 * Every form will be bind to a collection or a dashboard (or both)
 */

import {Schema} from 'mongoose';

export default {
  'group':        { type: Schema.ObjectId, ref: 'Collection' },
  'domain':       { type: String, ref: 'Dashboard' },
  'creator':      { type: Schema.ObjectId, required: true, ref: 'User' },
  'active':       { type: Boolean, default: true },
  'title':        { type: String, required: true },
  'description':        { type: String },
  // 'type':         { type: String, required: true, default: 'text' }, // text, textarea, boolean, select, uploads
  'created_at':   { type: Date, default: Date.now }
};

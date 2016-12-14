
/**
 * Project schema
 */

import {Schema} from 'mongoose';
import statuses from '../../config/statuses.json';
import _ from 'underscore';

const status = _.pluck(statuses, 'status');

export default {
  'title':        { type: String, required: true },
  'domain':       String,
  'description':  { type: String, required: true },
  'leader':       { type: Schema.ObjectId, required: true, ref: 'User' },
  'status':       { type: String, enum: status, default: status[0] },
  'contributors': [{ type: Schema.ObjectId, ref: 'User'}],
  'followers':    [{ type: Schema.ObjectId, ref: 'User'}],
  'cover':        String,
  'link':         String,
  'tags':         [String],
  // Responses to forms
  'forms':        [{
    form: { type: Schema.ObjectId, required:true, ref: 'Form' },
    responses: [{
      question: { type: Schema.ObjectId, required:true, ref: 'Form.questions'},
      value: Schema.Types.Mixed
    }]
  }],
  'created_at':   { type: Date, default: Date.now }
};

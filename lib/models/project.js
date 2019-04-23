
/**
 * Project schema
 */

import {Schema} from 'mongoose';
import statuses from '../settings/statuses';
import _ from 'underscore';

const status = _.pluck(statuses, 'status');

export default {
  'title':        { type: String, required: true },
  // 'projectId':    { type: Number, unique: true, required: true},
  'domain':       String,
  'private':      { type: Boolean, default: false },
  'description':  { type: String, required: true },
  'leader':       { type: Schema.ObjectId, required: true, ref: 'User' },
  'status':       { type: String, enum: status, default: status[0] },
  'contributors': [{ type: Schema.ObjectId, ref: 'User'}],
  'followers':    [{ type: Schema.ObjectId, ref: 'User'}],
  'cover':        String,
  'link':         String,
  'tags':         [String],
  'extra':        Schema.Types.Mixed, // For statuses custom fields
  // Responses to forms
  'forms':        [{
    form: { type: Schema.ObjectId, required:true, ref: 'Form' },
    responses: [{
      question: { type: Schema.ObjectId, required:true, ref: 'Form.questions'},
      value: Schema.Types.Mixed
    }]
  }],
  'location':     {
                    type: {type: String},
                    city: String,
                    zip: String,
                    region: String,
                    country: String,
                    coordinates: {type: [Number], index: '2dsphere'}
                  },
  'created_at':   { type: Date, default: Date.now },
  'commentsCount':    Number
};

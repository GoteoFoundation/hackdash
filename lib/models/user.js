
/**
 * User Schema
 */

import {Schema} from 'mongoose';
import confRoles from '../settings/roles';
import _ from 'underscore';

const roles = _.pluck(confRoles, 'roles');

export default {
  'provider':     { type: String, required: true },
  'provider_id':  Number,
  'userId':       { type: Number, unique: true},
  'username':     { type: String, required: true },
  'role':         { type: String, enum: roles, default: roles[0] },
  'skills':       { type: [String], default: [] },
  'name':         { type: String, required: true },
  'email':        { type: String, validate: /.+@.+\..+/ }, // TODO: Improve this validation
  'password':     String,
  'resetPasswordToken': String,
  'resetPasswordExpires': Date,
  'picture':      String,
  // Dashboard admins
  'admin_in':     { type: [String], default: [] },
  // Collections admins
  'group_admin_in':     { type: [Schema.ObjectId], default: [] },
  'bio':          String,
  'birthdate':    Date,
  'gender':       String,
  'social':       {
                  facebook: String,
                  twitter: String,
                  instagram: String,
                  google: String,
                  linkedin: String,
                  github: String
  },
  'location':     {
                    type: {type: String},
                    city: String,
                    zip: String,
                    region: String,
                    country: String,
                    coordinates: {type: [Number], index: '2dsphere'}
                  },
  'notifications':[{
                    key: String,
                    value: String,
                    date: {
                      type: Date,
                      default: Date.now
                    }
                  }],
  'created_at':   {type: Date, default: Date.now },
  'commentsCount':    Number,
  'tokens': [ {
              token: String,
              name: String
            } ]
};

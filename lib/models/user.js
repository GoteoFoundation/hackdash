
/**
 * User Schema
 */

export default {
  'provider':     { type: String, required: true },
  'provider_id':  Number,
  'username':     { type: String, required: true },
  'name':         { type: String, required: true },
  'email':        { type: String, validate: /.+@.+\..+/ }, // TODO: Improve this validation
  'password':     String,
  'resetPasswordToken': String,
  'resetPasswordExpires': Date,
  'picture':      String,
  'superadmin':   { type: Boolean, default: false },
  'admin_in':     { type: [String], default: [] },
  'bio':          String,
  'created_at':   {type: Date, default: Date.now }
};

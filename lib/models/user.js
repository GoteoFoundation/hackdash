
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
  'birthdate':    Date,
  'gender':       String,
  'location':     {
                    type: {type: String, default: 'Point'},
                    city: String,
                    zip: String,
                    region: String,
                    country: String,
                    coordinates: {type: [Number], index: '2dsphere'}
                  },
  'created_at':   {type: Date, default: Date.now }
};

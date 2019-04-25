import {User} from 'lib/models';


/**
 * Throws errors if any problem found
 */
export const validateUser = async (model) => {
  if (!model.name){
    throw new Error("name_required");
  }

  if (!model.email){
    throw new Error("email_required");
  }

  // Check email existing
  var exists = await User.findOne({email: model.email}).exec();
  if(exists && exists.email !== model.email) {
    throw new Error("email_existing");
  }
}

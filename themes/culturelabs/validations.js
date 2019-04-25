import {isGravatar, isValid} from 'lib/utils/gravatar';

const original = require('lib/validations/model_validations');

export const validateUser = async (model) => {
  // Apply default validations
  console.log("name",model.name,"email",model.email,"picture",model.picture);
  await original.validateUser(model);
  // Apply additional validations
  // Bio is required
  if(!model.bio) throw new Error('bio_required');
  if(!model.picture) throw new Error('picture_required');
  // check if is a empty gravatar picture
  if(isGravatar(model.picture) && !await isValid(model.picture)) throw new Error('picture_required');
  // set default role if empty
  if(!model.role) model.role = 'maker';
}

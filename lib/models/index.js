
/**
 * Database connection and models definition. It takes care of the app data
 */

/**
 * Module dependencies
 */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt-nodejs';
import {db} from 'config';

import UserSchema from './user';
import ProjectSchema from './project';
import DashboardSchema from './dashboard';
import CollectionSchema from './collection';

/**
 * Module scope constants
 */

const {Schema} = mongoose;

/*
 * DB Connection
 */

mongoose.connect(db.url || (`mongodb://${db.host}/${db.name}`));

/**
 * Models declaration
 */
const user_schema = new Schema(UserSchema);
// methods ======================
// generating a hash
user_schema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
user_schema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

user_schema.index({location: '2dsphere'});

export const User = mongoose.model('User', user_schema);
export const Project = mongoose.model('Project', new Schema(ProjectSchema));
export const Dashboard = mongoose.model('Dashboard', new Schema(DashboardSchema));
export const Collection = mongoose.model('Collection', new Schema(CollectionSchema));

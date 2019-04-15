
/**
 * Database connection and models definition. It takes care of the app data
 */

/**
 * Module dependencies
 */

import mongoose from 'mongoose';
import { autoIncrement } from 'mongoose-plugin-autoinc';
import bcrypt from 'bcrypt-nodejs';
import {db} from '../../config/config.json';

import UserSchema from './user';
import ProjectSchema from './project';
import DashboardSchema from './dashboard';
import CollectionSchema from './collection';
import FormSchema from './form';
import CommentSchema from './comment';

/**
 * Module scope constants
 */

mongoose.Promise = global.Promise;
const {Schema} = mongoose;
/*
 * DB Connection
 */

// const connection = mongoose.createConnection(db.url || `mongodb://${db.host}/${db.name}`);
mongoose.connect(db.url || (`mongodb://${db.host}/${db.name}`), { useMongoClient: true});
// mongoose.openUri(db.url || (`mongodb://${db.host}/${db.name}`));
// autoIncrement.initialize(mongoose);

/**
 * Models declaration
 */
const user_schema = new Schema(UserSchema);
// Addons: numeric ID
user_schema.plugin(autoIncrement, { model: 'User', field: 'userId', startAt: 1, incrementBy: 1 });
// methods ======================
// generating a hash
user_schema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
user_schema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

const project_schema = new Schema(ProjectSchema);
// Addons: numeric ID
// project_schema.plugin(autoIncrement, { model: 'Project', field: 'projectId', startAt: 1, incrementBy: 1 });

export const User = mongoose.model('User', user_schema);
export const Project = mongoose.model('Project', project_schema);
export const Dashboard = mongoose.model('Dashboard', new Schema(DashboardSchema));
export const Collection = mongoose.model('Collection', new Schema(CollectionSchema));
export const Form = mongoose.model('Form', new Schema(FormSchema));
export const Comment = mongoose.model('Comment', new Schema(CommentSchema));

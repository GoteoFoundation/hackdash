/**
 * Helpers for finding users, projects, etc
 */

import {User,Project} from 'lib/models';
import _ from 'underscore';

export const findUsersInDashboards = (dashboards, callback) => {
  console.log('dashboards to find', dashboards);
  Project.find({domain: {$in: dashboards}}).exec(function(err, projects){
    _.each(projects, function(p){
      // Find owner
      User.findOne({_id: p.leader}, function(err, u){
        console.log('Find user', u.name, u.email, 'for project', p.title);
        //TODO: check if user has received communication already
        if(_.isFunction(callback)) {
          callback(u, p);
        }
      });
    });
  });
}

export const addSentTypeForUser = (user, type, id) => {
  const event = {key: type.toString(), value: id.toString()};
  user.notifications.push(event);
  user.save(function(err, u){
    if(err) return console.log('ERROR', err);
  });
}

export const checkNotificationSent = (user, key, value) => {
  let search = {
    key: key.toString(),
    value: value.toString()
  };
  return _.findWhere(user.notifications || [], search);
}

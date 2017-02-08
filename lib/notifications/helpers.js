/**
 * Helpers for finding users, projects, etc
 */

import {User,Project,Dashboard,Form,Collection} from 'lib/models';
import _ from 'underscore';

export const findFormsForProject = (project, callback) => {
  if(typeof callback !== 'function') {
    callback = function(){};
  }

  Dashboard.findOne({domain: project.domain}, function(err, dashboard){
    if(err) {
      // throw new Error(err);
      console.error('ERROR', err);
    }
    // Find collections for this dashboard
    Collection.find({dashboards: dashboard._id}, function(err, cols) {
      if(err) {
        // throw new Error(err);
        console.error('ERROR', err);
      }
      Form.find({
        $or: [
          {group: {$in: _.pluck(cols, '_id')}},
          {domain: dashboard.domain}
          ]
      }, function(err, forms) {
        if(err) {
          // throw new Error(err);
          console.error('ERROR', err);
        }
        console.log('FOUND Forms', forms);
        callback(forms);
      });
    })
  });

}

export const findUsersInDashboards = (dashboards, callback) => {
  if(typeof callback !== 'function') {
    callback = function(){};
  }
  console.log('dashboards to find', dashboards);
  Project.find({domain: {$in: dashboards}})
    .populate('leader', '_id name email notifications')
    .exec(function(err, projects) {
      if(err) {
        console.error('ERROR: ' +err);
        return;
      }
      _.each(projects, function(p){
        var u = p.leader;
        // Find owner
        console.log('Find user', u.name, u.email, 'for project', p.title);
        if(u) {
          callback(u, p);
        }
      });
  });
}

export const addSentTypeForUser = (user, type, id) => {
  const event = {key: type.toString(), value: id.toString()};
  user.notifications = user.notifications || [];
  user.notifications.push(event);
  user.save(function(err, u){
    if(err) return console.error('ERROR', err);
  });
}

export const checkNotificationSent = (user, key, value) => {
  let search = {
    key: key.toString(),
    value: value.toString()
  };
  let found = _.findWhere(user.notifications, search);
  // console.log('check', user, key, value, found);
  return found;
}

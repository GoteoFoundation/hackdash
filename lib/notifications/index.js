
/**
 * Sends Emails to users on events. Needs configuration in config/config.js to be correctly used
 */

/**
 * Module dependencies
 */

import {Collection,Dashboard} from 'lib/models';
import {sendJoinMail,sendOpenedFormMail,sendUserPassworResetMail} from './mailing.js';
import {findUsersInDashboards,addSentTypeForUser,checkNotificationSent} from './helpers.js';
import _ from 'underscore';

export function handleProjectMail(data) {
	switch(data.type) {
	  case "project_join":
  		console.log('MAIL DATA FOR PROJECT JOIN', data.from.email, data.to.email, data.project.title);
  		sendJoinMail(data);
		break;
  }
}

export function handleFormMail(data) {

  const checkAndSendFormMail = (u, p) => {
    switch(data.type) {
      case 'form_opened':
        // check if notification already sent
        if(!checkNotificationSent(u, data.type, data.form._id)) {
          sendOpenedFormMail({to: u, project: p, form: data.form}, function(err, info) {
            if(err) return console.log('ERROR sending mail to ', u.email, err);
            addSentTypeForUser(u, data.type, data.form._id);
          });
        } else {
          console.log('Already sent notification for', u.email, data.type, data.form._id);
        }
      break;
    }
  }

  switch(data.type) {
    case 'form_opened':
      console.log(data);
      // TODO: check user preferences about emails
      if(data.form.group) {
        Collection.findOne({_id: data.form.group}, function(err, col) {
          console.log('Send to dashboards leaders in Collection', col);
          Dashboard.find({_id: {$in: col.dashboards}}).exec(function(err, dashboards){
            findUsersInDashboards(_.pluck(dashboards, 'domain'), checkAndSendFormMail);
          });
        });
      } else {
        console.log('Send to dashboard leader', data.form.domain);
        findUsersInDashboards([data.form.domain], checkAndSendFormMail);
      }
    break;
  }
}

export function handleUserMail(data) {
	switch(data.type) {
	  case "new_password":
		console.log('New password to', data.to.email);
    sendUserPassworResetMail(data);
		break;
  }
}

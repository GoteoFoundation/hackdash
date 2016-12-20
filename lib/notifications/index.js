
/**
 * Sends Emails to users on events. Needs configuration in config/config.js to be correctly used
 */

/**
 * Module dependencies
 */

import {Collection,Dashboard,Form} from 'lib/models';
import {sendJoinMail,sendOpenedFormMail,sendUserPassworResetMail,sendUserWelcomeMail,sendProjectCreatedMail} from './mailing.js';
import {findUsersInDashboards,findFormsForProject,addSentTypeForUser,checkNotificationSent} from './helpers.js';
import _ from 'underscore';

export function handleProjectMail(data) {

  const checkAndSendFormMail = (u, f) => {
    if(!checkNotificationSent(u, 'form_opened', f._id)) {
      sendOpenedFormMail({to: u, project: data.project, form: f}, function(err, info) {
        if(err) return console.error('ERROR sending mail to ', u.email, err);
        addSentTypeForUser(u, 'form_opened', f._id);
      });
    } else {
      console.log('Already sent notification for', u.email, 'form_opened', f._id);
    }
  }

	switch(data.type) {
    case "project_join":
      // console.log('MAIL DATA FOR PROJECT JOIN', data.from.email, data.to.email, data.project.title);
      sendJoinMail(data);
      break;
    case "project_created":
      // console.log('MAIL DATA FOR PROJECT CREATED', data.from.email, data.to.email, data.project.title);
      sendProjectCreatedMail(data);
      // break;
    case "project_updated":
      // Find forms for this project
      findFormsForProject(data.project, function(forms) {
        _.each(forms, function(f) {
          if(f.open) {
            checkAndSendFormMail(data.from, f);
          }
        });

      });
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
            if(err) return console.error('ERROR sending mail to ', u.email, err);
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
      // TODO: check user preferences about emails
      if(data.form.group) {
        Collection.findById(data.form.group, function(err, col) {
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

    case "welcome":
      console.log('welcome to user', data.to.email);
      // check if notification already sent
      if(!checkNotificationSent(data.to, data.type, data.to.email)) {
        console.log('Sending notification!');
        sendUserWelcomeMail(data);
        addSentTypeForUser(data.to, data.type, data.to.email);
      } else {
        console.log('Already sent notification for', data.to.email, data.type, data.to.email);
      }
  		break;
  }
}

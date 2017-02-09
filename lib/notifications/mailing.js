/**
 * Mail template functions
 */

import nodemailer from 'nodemailer';
import marked from 'marked';
import {mailer,mailerFrom,publicHost,host} from 'config/config';
import __ from 'lib/utils/locale';
import _ from 'underscore';

const transport = nodemailer.createTransport(mailer);

const wrapper = (txt) => {
  let template = _.template(__('template_email_wrapper_body'));
  console.log(template({content: txt, host: publicHost, host_name: host}));
  return marked(template({
      content: txt,
      host: publicHost,
      host_name: host
    }));
};

const sWrapper = (txt) => {
  let template = _.template(__('template_email_wrapper'));
  return template({subject: txt});
}

const errorHandler = (err, info) => {
  if(err) return console.log('EMAIL SEND ERR', err);
  console.log('Message sent: ' + info.response);
}

// Project Join Email
export const sendJoinMail = ({from, to, project}, callback) => {
  if(!_.isFunction(callback)) callback = errorHandler;
  transport.sendMail({
    from: mailerFrom,
    to: to.email,
    subject: sWrapper(_.template(__('template_user_joined_project'))({
        name: from.name
      })),
    html: wrapper(_.template(__('template_user_joined_project_body'))({
        name: from.name,
        project: project,
        host: publicHost
      }))
  }, callback);
}

export const sendProjectCreatedMail = ({from, project}, callback) => {
  if(!_.isFunction(callback)) callback = errorHandler;
  transport.sendMail({
    from: mailerFrom,
    to: from.email,
    subject: sWrapper(_.template(__('template_project_created'))({
        name: from.name
      })),
    html: wrapper(_.template(__('template_project_created_body'))({
        name: from.name,
        project: project,
        host: publicHost
      }))
  }, callback);
}

export const sendOpenedFormMail = ({to, project, form}, callback) => {
  if(!_.isFunction(callback)) callback = errorHandler;
  transport.sendMail({
    from: mailerFrom,
    to: to.email,
    subject: sWrapper(_.template(__('template_new_project_form'))({
        title: form.title
      })),
    html: wrapper(_.template(__('template_new_project_form_body'))({
        host: publicHost,
        project: project,
        form: form
      }))
  }, callback);
}

export const sendUserPassworResetMail = ({to, token}, callback) => {
  if(!_.isFunction(callback)) callback = errorHandler;
  transport.sendMail({
    from: mailerFrom,
    to: to.email,
    subject: sWrapper(__('template_lost_password')),
    html: wrapper(_.template(__('template_lost_password_body'))({
      token: token,
      host: publicHost,
      host_name: host
    }))
  }, callback);
}

export const sendUserWelcomeMail = ({to}, callback) => {
  if(!_.isFunction(callback)) callback = errorHandler;
  transport.sendMail({
    from: mailerFrom,
    to: to.email,
    subject: sWrapper(__('template_user_welcome')),
    html: wrapper(_.template(__('template_user_welcome_body'))({
      host: publicHost,
      name: to.name
    }))
  }, callback);
}

export const sendNewCommentOwnerMail = ({to,project,from,comment}, callback) => {
  if(!_.isFunction(callback)) callback = errorHandler;
  transport.sendMail({
    from: mailerFrom,
    to: to.email,
    subject: sWrapper(__('template_new_owner_comment')),
    html: wrapper(_.template(__('template_new_comment_owner_body'))({
      host: publicHost,
      name: to.name,
      comment: comment,
      from: from.name,
      project: project
    }))
  }, callback);
}

export const sendNewCommentUserMail = ({to,project,from,comment}, callback) => {
  if(!_.isFunction(callback)) callback = errorHandler;
  transport.sendMail({
    from: mailerFrom,
    to: to.email,
    subject: sWrapper(__('template_new_user_comment')),
    html: wrapper(_.template(__('template_new_comment_user_body'))({
      host: publicHost,
      name: to.name,
      comment: comment,
      from: from.name,
      project: project
    }))
  }, callback);
}

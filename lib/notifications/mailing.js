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
    html: sWrapper(_.template(__('template_user_joined_project'))({
        name: from.name,
        title: project.title,
        host: publicHost,
        'id': project._id
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
        project_id: project._id,
        project_title: project.title,
        form_id: form._id,
        form_title: form.title
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

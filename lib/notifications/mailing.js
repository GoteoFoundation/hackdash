/**
 * Mail template functions
 */

import nodemailer from 'nodemailer';
import marked from 'marked';
import {mailer,mailerFrom,publicHost} from 'config';
import _ from 'underscore';

const transport = nodemailer.createTransport(mailer);

const wrapper = (txt) => {
  let t = "### Wotify message:\n\n";
  t += txt;
  t += `\n\n*Please do no reply this email, this is an automated response from [wotify.co](${publicHost})*`;
  t += `\n\n![Wotify](${publicHost}/images/mini-logo-wotify.png)`
  return marked(t);
};

const sWrapper = (txt) => {
  return "[Wotify] " + txt;
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
    subject: sWrapper(`${from.name} joined your project!`),
    html: wrapper(`Hi there! **${from.name}** Joined your project [${project.title}](${publicHost}/projects/${project._id}).`)
  }, callback);
}

export const sendOpenedFormMail = ({to, project, form}, callback) => {
  if(!_.isFunction(callback)) callback = errorHandler;
  transport.sendMail({
    from: mailerFrom,
    to: to.email,
    subject: sWrapper(`${form.title} form for you project!`),
    html: wrapper(`Hi there! A new form has been created for your project [${project.title}](${publicHost}/projects/${project._id}).

We expect you to answer it as soon as posible.

Please be so kind to fill it here:

**${form.title}:**

[${publicHost}/forms/${form._id}](${publicHost}/forms/${form._id})

Thank you!`)
  }, callback);
}

export const sendUserPassworResetMail = ({to, token}, callback) => {
  if(!_.isFunction(callback)) callback = errorHandler;
  transport.sendMail({
    from: mailerFrom,
    to: to.email,
    subject: sWrapper(`Password reset request`),
    html: wrapper(`Hi there! Someone (hopefully you) has made a request to generate a new password for [wotify.co](${publicHost}/).\n\nPlease click on the following link, or paste this into your browser to complete the process:\n\n${publicHost}/lost-password/${token}\n\n### If you did not request this, please ignore this email and your password will remain unchanged.`)
  }, callback);
}


/**
 * Sends Emails to users on events. Needs configuration to be correctly used
 */

/**
 * Module dependencies
 */

import nodemailer from 'nodemailer';
import marked from 'marked';
import {mailer,mailerFrom,publicHost} from 'config';

const transport = nodemailer.createTransport(mailer);

const wrapper = (txt) => {
	let t = "### Wotify message:\n\n";
	t += txt;
	t += `\n\n*Please do no reply this email, this is an automated response from [wotify.co](${publicHost})*`;
	t += `\n\n![Wotify](${publicHost}/images/mini-logo-wotify.png)`
	return marked(t);
};

const errorHandler = (err, info) => {
	if(err) return console.log('EMAIL SEND ERR', err);
	console.log('Message sent: ' + info.response);
}

// Project Join Email
const sendJoinMail = ({from, to, project}) => transport.sendMail({
  from: mailerFrom,
  to: to.email,
  subject: `[Wotify] ${from.name} joined your project!`,
  html: wrapper(`Hi there! **${from.name}** Joined your project [${project.title}](${publicHost}/projects/${project._id}).`)
}, errorHandler);



export default function handleMail(data) {
	switch(data.type) {
	  case "project_join":
		console.log('MAIL DATA FOR PROJECT JOIN', data.from.email, data.to.email, data.project.title);
		sendJoinMail(data);
		break;

	case "":
  }
}

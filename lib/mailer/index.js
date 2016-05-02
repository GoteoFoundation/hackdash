
/**
 * Sends Emails to users on events. Needs configuration to be correctly used
 */

/**
 * Module dependencies
 */

import nodemailer from 'nodemailer';
import {mailer} from 'config';

const transport = nodemailer.createTransport("SMTP", mailer);

const sendJoinMail = ({from, to, project}) => transport.sendMail({
  from: from.email,
  to: to.email,
  subject: `[Wotify] ${from.email} joined your project!`,
  html: `<h1>Wotify</h1><p>Hi there! ${from.name} Joined your project <strong>${data.project.title}</strong>.</p>` // TODO change this)
});

export default function handleMail(data) {
	switch(data.type) {
	  case "join":
		sendJoinMail(data);
		break;
  }
}

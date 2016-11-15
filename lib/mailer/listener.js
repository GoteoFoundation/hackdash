/**
 * Handles events internally and sends emails if needed
 */

import bus from 'lib/bus';
import handleMail from 'lib/mailer';
import {User} from 'lib/models';

// Projects notifications
bus.on('post', function(data){
	// TODO: check user preferences about emails
	User.findOne({_id: data.project.leader}, function(err, owner){
		if(err) throw err;
		handleMail({
			type: data.type,
			from: data.user,
			to: owner,
			project: data.project
		});
	});
});

/**
 * Handles events internally and sends emails if needed
 */

import bus from 'lib/bus';
import {handleProjectMail,handleUserMail,handleFormMail} from 'lib/notifications';
import {User} from 'lib/models';

// Projects notifications
bus.on('post', function(data){
	// TODO: check user preferences about emails
	User.findOne({_id: data.project.leader}, function(err, owner){
		if(err) throw err;
		handleProjectMail({
			type: data.type,
			from: data.user,
			to: owner,
			project: data.project
		});
	});
});

// User notifications
bus.on('user', function(data){
  handleUserMail({
    type: data.type,
    to: data.user,
    token: data.token
  });
});

// Form notifications
bus.on('form', function(data){
	handleFormMail({
		type: data.type,
		to: data.user,
		form: data.form
	});
});

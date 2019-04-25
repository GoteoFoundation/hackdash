/**
 * Handles events internally and sends emails if needed
 */

import bus from 'lib/bus';
import {handleProjectMail,handleUserMail,handleFormMail,handleCommentMail} from 'lib/notifications';
import {User,Comment} from 'lib/models';
import _ from 'underscore';

// Projects notifications
bus.on('project_notification', function(data){
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
bus.on('user_notification', function(data){
  handleUserMail({
    type: data.type,
    to: data.user,
    token: data.token
  });
});

// Form notifications
bus.on('form_notification', function(data){
  handleFormMail({
    type: data.type,
    to: data.user,
    form: data.form
  });
});

// Comment notifications
bus.on('comment_notification', function(data){
  User.findOne({_id: data.project.leader}, function(err, owner){
    if(err) throw err;
    // Comment to owner
    handleCommentMail({
      type: 'owner_comment',
      from: data.user,
      to: owner,
      project: data.project,
      comment: data.comment
    });
  });
  Comment
    .find({project: data.project._id})
    .select('user comment')
    .populate('user', 'name email')
    .exec(function(err, comments){
      if(err) throw err;
      var done = [];
      _.each(comments, function(c){
        if(_.indexOf(done, c.user.email) != -1) {
          // console.log('Skipping', c.user.email);
          return;
        }
        console.log('SEND TO', c.user.toString());
        // Comment to participating users
        handleCommentMail({
          type: 'user_comment',
          from: data.user,
          to: c.user,
          project: data.project,
          comment: data.comment
        });
        done.push(c.user.email);
      });
    });
});

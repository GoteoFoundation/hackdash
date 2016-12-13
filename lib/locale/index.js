export default {
  en: {
      "template_email_wrapper": "[HackDash] <%= subject %>",
      "template_email_wrapper_body": "### HackDash message:\n\n<%= content %>\n\n*Please do no reply this email, this is an automated response from [<%= host_name %>]({<%= host %>)*\n\n![HackDash](<%= host %>/images/logohack.png)",

      "template_user_joined_project": "<%= name %> joined your project!",
      "template_user_joined_project_body": "Hi there! **<%= name %>** Joined your project [<%= title %>](<%= host %>/projects/<%= id %>).",

      "template_new_project_form": "<%= title %> form for you project!",
      "template_new_project_form_body": "Hi there! A new form has been created for your project [<%= project_title %>](<%= host %>/projects/<%= project_id %>).\n\nWe expect you to answer it as soon as posible.\n\nPlease be so kind to fill it here:\n\n**<%= form_title %>:**\n\n[<%= host %>/forms/<%= form_id %>](<%= host %>/forms/<%= form_id %>)\n\nThank you!",

      "template_lost_password": "Password reset request",
      "template_lost_password_body": "Hi there! Someone (hopefully you) has made a request to generate a new password for [<%= host_name %>](<%= host %>/).\n\nPlease click on the following link, or paste this into your browser to complete the process:\n\n<%= host %>/lost-password/<%= token %>\n\n### If you did not request this, please ignore this email and your password will remain unchanged.",
  }
}

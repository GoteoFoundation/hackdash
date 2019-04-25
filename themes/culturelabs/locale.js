/*eslint-disable */
module.exports = {
  "en" : {
    "bio_required": "Please write something about you!",
    "picture_required": "Please add and image for your profile!",
    "Hackathon Title":"Board Title",
    "Share your app to the world.": "Share your app with the world.",
    "Inform Progress to community.":"Share progress with your community.",
    "title_default": "Wotify Board: cooking recipes 4 social innovation",
    "description_default": "Co-creating projects. Upload your project. Add colaborators. Inform status. Share your app.",
    "about_you":"Something about you",
    "The HackDash was born": "Wotify Dashboard is a repository of events and projects where the \"Co-creation made Agile\" methodology is applied (developed by <a href=\"http://platoniq.net/\" data-bypass=\"true\" target=\"__blank\">Platoniq</a> as part of the Europeana Creative project). Wotify Dashboard is a fork of <a href=\"https://github.com/Platoniq/wotify\" data-bypass=\"true\" target=\"__blank\">Hackdash</a>.",

    "template_email_wrapper": "[Wotify] <%= subject %>",
    "template_email_wrapper_body": "### Wotify message:\n\n<%= content %>\n\n \n\n*Please do no reply this email, this is an automated response from [<%= host_name %>]({<%= host %>)*\n\n \n\n![Wotify](<%= host %>/images/mail-logos.png)",

    "template_user_welcome": "Your journey in the Wotify boards for CultureLabs starts here!",
    "template_user_welcome_body": "Hi *<%= name %>*!\n\nThanks for creating your user profile in Wotify Boards for CultureLabs.\n\nThe boards are a platform for pilot organisers to improve and keep track of their project development. The boards are also an opportunity for the other partners to be involved and support the development of the pilots and the improvement of their recipes.\n\n**Important:** Please ensure that your profile has an avatar and some lines about you, otherwise you won't be able to create projects.\n\n- If you've got any trouble using the platform, drop us an email at [wotify@platoniq.net](mailto:wotify@platoniq.net)",
    "template_project_created": "Your pilot idea looks great!",
    "template_project_created_body": "Wow! The Idea (*<%= project.title %>*) you just formulated in **Wotify boards for CultureLabs** looks just amazing.\n\nIf you need to rework it in the following weeks, upload an image or boost it a little more, you will always find it following this link:\n\n<%= host %>/projects/<%= project._id %>\n\nWith warm wishes"
  }
}

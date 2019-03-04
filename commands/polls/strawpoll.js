/* Config */
const commando = require('discord.js-commando');
const db = require('/app/server.js');
const {
  stripIndents
} = require('common-tags');
const request = require('node-superfetch');

class Strawpoll extends commando.Command {
  constructor(client) {
    super(client, {
      name: 'strawpoll',
      group: 'polls',
      memberName: 'strawpoll',
      usage: 'strawpoll <"title"> <"option 1"> <"option 2">...',
      description: 'Creates a strawpoll. **R**',
      throttling: {
        usages: 1,
        duration: 10
      },
      args: [{
        key: 'title',
        prompt: 'The correct usage of `!strawpoll` is `!strawpoll "**title**" ["option 1"] ["option 2"]...`',
        type: 'string',
        max: 200
      }, {
        key: 'options',
        prompt: 'The correct usage of `!strawpoll` is `!strawpoll "title" **["option 1"] ["option 2"]**...`',
        type: 'string',
        infinite: true,
        max: 140
      }]
    });
  }
  hasPermission(message) {
    var ownerId = db.getOwnerId(message.guild.id);
    var config = db.getConfig(ownerId);
    if (config.restrictedCommandRoles) return message.member.roles.some(r => config.restrictedCommandRoles.includes(r.name));
  }
  async run(message, {
    title,
    options
  }) {
    if (options.length < 2) { // If there are less than 2 options
      message.channel.send('Please provide more than one option.'); // Output error
      return; // Return
    } else if (options.length > 31) { // If there are more than 30 options
      message.channel.send('Please provide thirty or less options.'); // Output error
      return; // Return
    }
    try {
      // Try to create the strawpoll
      const {
        body
      } = await request.post('https://www.strawpoll.me/api/v2/polls').set({
        'Content-Type': 'application/json'
      }).send({
        title,
        options
      });
      message.channel.send(stripIndents`${body.title}http://www.strawpoll.me/${body.id}`); // Display the strawpoll
      message.delete(); // Delete the message
    } catch (err) { // Catch any error
      message.channel.send(`Oh no, an error occurred: \`${err.message}\`. Try again later!`); // Output error
      return; // Return
    }
  }
}
module.exports = Strawpoll;
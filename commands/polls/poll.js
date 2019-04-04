/* Config */
const commando = require('discord.js-commando');
const db = require('/app/server.js');

class Poll extends commando.Command {
  constructor(client) {
    super(client, {
      name: 'poll',
      group: 'polls',
      memberName: 'poll',
      usage: 'poll <"question">',
      description: 'Creates a yes/no/maybe poll in the channel. **R**',
      throttling: {
        usages: 1,
        duration: 10
      },
      args: [{
        key: 'question',
        prompt: 'The correct usage of `!poll` is `!poll **question**',
        type: 'string'
      }]
    });
  }
  hasPermission(message) {
    var config = db.getConfig(message.guild.id);
    if (config.restrictedCommandRoles) return message.member.roles.some(r => config.restrictedCommandRoles.includes(r.name));
  }
  async run(message, args) {
    message.channel.send('**' + args.question + '**').then(function (message) { // Send the question
      message.react("👎"); // React with a thumbs down
      message.react("👍"); // React with a thumbs up
      message.react("🤷"); // React with a shrug
    }).catch(function (error) { // Catch any error
      console.log(error); // Output error
    });
    message.delete(); // Delete the message
  }
}
module.exports = Poll;
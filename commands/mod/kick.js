/* Config */
const commando = require('discord.js-commando');
const db = require('/app/server.js');

class Kick extends commando.Command {
  constructor(client) {
    super(client, {
      name: 'kick',
      group: 'mod',
      memberName: 'kick',
      usage: 'kick <@username> *<"reason">*',
      description: 'Kicks a member. **M**',
      args: [{
        key: 'member',
        prompt: 'The correct usage of `!kick` is `!kick **@username** "reason"`',
        type: 'user'
      },
      {
        key: 'reason',
        prompt: 'The correct usage of `!kick` is `!kick @username "**reason**"`',
        type: 'string',
        default: ''
      }
      ]
    });
  }
  hasPermission(message) {
    var ownerId = db.getOwnerId(message.guild.id);
    var config = db.getConfig(ownerId);
    if (config.modCommandRoles) return message.member.roles.some(r => config.modCommandRoles.includes(r.name));
  }

  async run(message, {
    member,
    reason
  }) {
    var ownerId = db.getOwnerId(message.guild.id);
    var config = db.getConfig(ownerId);
    if (config.modSystemEnabled) { // If the moderation commands are enabled
      if (member != null || member != undefined) { // If the member exists
        member.kick(reason); // Kick the member
      } else { // Otherwise
        message.channel.send('There is no user with that username.'); // Output error
        return; // Return
      }
      message.delete(); // Delete the message
    }
  }
}
module.exports = Kick;
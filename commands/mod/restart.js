/* Config */
const commando = require('discord.js-commando');
const db = require('/app/server.js');

class Restart extends commando.Command {
  constructor(client) {
    super(client, {
      name: 'restart',
      group: 'mod',
      memberName: 'restart',
      usage: 'restart',
      description: 'Restarts the bot. **M**'
    });
  }
  hasPermission(message) {
    var ownerId = db.getOwnerId(message.guild.id);
    var config = db.getConfig(ownerId);
    if (config.modCommandRoles) return message.member.roles.some(r => config.modCommandRoles.includes(r.name));
  }

  async run(message, args) {
    var ownerId = db.getOwnerId(message.guild.id);
    var config = db.getConfig(ownerId);
    if (config.modSystemEnabled) { // If the moderation commands are enabled
      message.channel.send('The bot is now restarting.'); // Confirm the restart
      setTimeout(function () {
        process.exit(); // Restart the bot
      }, 1000);
    }
  }
}
module.exports = Restart;
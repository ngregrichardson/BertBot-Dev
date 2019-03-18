/* Config */
const commando = require('discord.js-commando');
const db = require('/app/server.js');

class Channel extends commando.Command {
  constructor(client) {
    super(client, {
      name: 'channel',
      group: 'mod',
      memberName: 'channel',
      usage: 'channel <add|remove> <"name"> *<text|voice>*',
      description: 'Manages channels. **M**',
      args: [{
        key: 'term',
        prompt: 'The correct usage of `!channel` is `!channel **add|remove** "name" text|voice`',
        type: 'string'
      },
      {
        key: 'name',
        prompt: 'The correct usage of `!channel` is `!channel add|remove "**name**" text|voice`',
        type: 'string',
        default: ''
      },
      {
        key: 'type',
        prompt: 'The correct usage of `!channel` is `!channel add|remove "name" **text|voice**`',
        type: 'string',
        default: 'text'
      }
      ]
    });
  }
  hasPermission(message) {
    var config = db.getConfig(message.guild.id);
    if (config.modCommandRoles) return message.member.roles.some(r => config.modCommandRoles.includes(r.name));
  }

  async run(message, {
    term,
    name,
    type
  }) {
    var config = db.getConfig(message.guild.id);
    if (config.modSystemEnabled) { // If the moderation commands are enabled
      if (term == 'add') { // If we are adding
        console.log(!message.guild.channels.find('name', name));
        if (!message.guild.channels.find('name', name)) { // If the channel does not exist
          message.guild.createChannel(name, type); // Create the channel
          message.channel.send('The #' + name + ' channel was created.'); // Confirm the creation
        } else { // Otherwise
          message.channel.send('There is already a channel with that name.'); // Output error
          return; // Return
        }
      } else if (term == 'remove') {
        if (message.guild.channels.find('name', name)) { // If the channel exists
          message.guild.channels.find('name', name).delete(); // Delete the channel
          message.channel.send('The #' + name + ' channel was removed.'); // Confirm the deletion
        } else { // Otherwise
          message.channel.send('There is no channel with that name.'); // Output error
          return; // Return
        }
      } else { // Otherwise
        message.channel.send('The correct usage of `!channel` is `!channel **add|remove** "name" text|voice`'); // Output error
      }
    }
  }
}
module.exports = Channel;
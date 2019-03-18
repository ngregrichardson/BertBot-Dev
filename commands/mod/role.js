const commando = require('discord.js-commando');
const db = require('/app/server.js');

class Role extends commando.Command {
  constructor(client) {
    super(client, {
      name: 'role',
      group: 'mod',
      memberName: 'role',
      usage: 'role <add|remove> <@username> <role>',
      description: 'Manages roles. **M**',
      args: [{
        key: 'term',
        prompt: 'The correct usage of `!role` is `!role **add|remove** @username role`',
        type: 'string'
      },
      {
        key: 'member',
        prompt: 'The correct usage of `!role` is `!role add|remove **@username** role`',
        type: 'user'
      },
      {
        key: 'role',
        prompt: 'The correct usage of `!role` is `!role add|remove @username **role**`',
        type: 'string'
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
    member,
    role
  }) {
    var config = db.getConfig(message.guild.id);
    if (config.modSystemEnabled) { // If the moderation commands are enabled
      if (member == null || member == undefined) { // If the member doesn't exists
        message.channel.send('There is no user with that username.'); // Output error
        return; // Return
      }
      if (term == 'add') { // If we're adding
        member.addRole(message.guild.roles.find(role => role.name == role)); // Add the role to the member
      } else if (term == 'remove') { // If we're removing
        member.removeRole(message.guild.roles.find(role => role.name == role)); // Remove the role to the member
      } else { // Otherwise
        message.channel.send('The correct usage of `!role` is `!role **add|remove** @username`'); // Output error
        return; // Return
      }
    }
  }
}
module.exports = Role;
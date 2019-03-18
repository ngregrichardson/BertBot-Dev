/* Config */
const commando = require('discord.js-commando');
const db = require('/app/server.js');

class Spam extends commando.Command {
  constructor(client) {
    super(client, {
      name: 'spam',
      group: 'spam',
      memberName: 'spam',
      usage: 'spam <add|remove> <@username>',
      description: 'Manages the spam chat. **R**',
      args: [{
        key: 'term',
        prompt: 'The correct usage of `!spam` is `!spam **add|remove** @username`',
        type: 'string'
      },
      {
        key: 'user',
        prompt: 'The correct usage of `!spam` is `!spam add|remove **@username**`',
        type: 'user'
      }
      ]
    });
  }
  hasPermission(message) {
    var config = db.getConfig(message.guild.id);
    if (config.restrictedCommandRoles) return message.member.roles.some(r => config.restrictedCommandRoles.includes(r.name));
  }
  async run(message, {
    term,
    user
  }) {
    let member;
    let role = message.guild.roles.find(r => r.name == 'student'); // Get the student role
    let spamRole = message.guild.roles.find(r => r.name == 'spam'); // Get the spam role
    if (term != undefined && user == undefined) { // If we have a term but no user
      member = message.member; // Set the member to the author
    } else if (user != undefined && term != undefined) { // If we have a term and a user
      member = message.guild.members.find(m => m.id == user.id); // Set the member to the user
    } else { // Otherwise
      message.channel.send('The correct usage of `!spam` is `!spam **add|remove @username**`'); // Output error
      return; // Return
    }
    if (member.roles.find(r => r.id == role.id)) { // If the member is a student
      if (term == 'add') { // If we are adding
        if (member.roles.find(r => r.id == spamRole.id)) { // If the member has the spam role
          message.channel.send('This user is already in #spam.'); // Output error
          return; // Return
        } else { // Otherwise
          member.addRole(spamRole).catch(console.error); // Add the role to the member
        }
      } else if (term == 'remove') { // If we are removing
        if (member.roles.find(r => r.id == spamRole.id)) { // If the member has the spam role
          member.removeRole(spamRole).catch(console.error); // Remove the role from the member
        } else { // Otherwise
          message.channel.send('This user is not in #spam.'); // Output error
          return; // Return
        }
      } else { // Otherwise
        message.channel.send('The correct usage of `!spam` is `!spam **add|remove** @username`'); // Output error
      }
    }
  }
}
module.exports = Spam;
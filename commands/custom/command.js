/* Config */
const commando = require('discord.js-commando');
const fs = require('fs');
const db = require('/app/server.js');

/* Command template */
var file1 = "const commando = require('discord.js-commando'); class ";
var file2 = " extends commando.Command { constructor(client) { super(client, { name: '";
var file3 = "', group: 'custom', memberName: '";
var file4 = "', description: '";
var file5 = "' }); } async run(message, args) { message.channel.send('";
var file6 = "'); } } module.exports = ";
var file7 = ";";

class Command extends commando.Command {
  constructor(client) {
    super(client, {
      name: 'command',
      group: 'custom',
      memberName: 'command',
      usage: 'command <add|remove> <name> <"description"> <"response">',
      description: 'Manages custom commands. **R**',
      args: [{
          key: 'action',
          prompt: 'The correct usage of `!command` is `!command **add|remove** name "description" "response"',
          type: 'string'
        },
        {
          key: 'name',
          prompt: 'The correct usage of `!command` is `!command add|remove **name** "description" "response"',
          type: 'string'
        },
        {
          key: 'description',
          prompt: 'The correct usage of `!command` is `!command add|remove name "**description**" "response"',
          type: 'string',
          default: ''
        },
        {
          key: 'response',
          prompt: 'The correct usage of `!command` is `!command add|remove name "description" "**response**"',
          type: 'string',
          default: ''
        }
      ]
    });
  }
  hasPermission(message) {
    var config = db.getConfig(message.guild.id);
    if (config.restrictedCommandRoles) return message.member.roles.some(r => config.restrictedCommandRoles.includes(r.name));
  }

  async run(message, {
    action,
    name,
    description,
    response
  }) {
    if (action == 'add') { // If we're adding
      if (!doesCommandExist(name)) { // If the command doesn't exist
        var data = file1 + capitalize(name) + file2 + name + file3 + name + file4 + description + file5 + response + file6 + capitalize(name) + file7; // Create the command file
        fs.writeFileSync('commands/custom/' + name + '.js', data); // Create the new command file
        var commands = db.get('commands').value(); // Get the command list from the database
        commands[name] = name; // Add the command to the list
        db.set('commands', commands).write(); // Write the updated command list to the database
        message.channel.send('The !' + name + ' command was added. The bot is now restarting.'); // Confirm the creation
      } else { // If the command already exists
        message.channel.send('The !' + name + ' command already exists. Please run the command again with another name.'); // Output error
      }
    } else if (action == 'remove') { // If we're removing
      if (doesCommandExist(name)) { // If the command exists
        fs.unlinkSync('commands/custom/' + name + '.js'); // Delete the command file
        var commands = db.get('commands').value(); // Get the command list from the database
        delete commands[name]; // Remove the command from the list
        db.set('commands', commands).write(); // Write the updated command list to the database
        message.channel.send('The !' + name + ' command was removed. The bot is now restarting.'); // Confirm the deletion
      } else { // If the command doesn't exist
        message.channel.send('The !' + name + ' command does not exist.'); // Output error
      }
    } else { // Otherwise
      message.channel.send('The correct usage of `!command` is `!command **add|remove** name "description" "response"');
    }
  }
}
module.exports = Command;

// Capitalize the command name
function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Check if a command exists
function doesCommandExist(name) {
  var commands = db.get('commands').value();
  for (var command in commands) {
    if (command == name) {
      return true;
    }
  }
  return false;
}
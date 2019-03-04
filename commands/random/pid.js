/* Config */
const commando = require('discord.js-commando');

class PID extends commando.Command {
  constructor(client) {
    super(client, {
      name: 'pid',
      group: 'random',
      memberName: 'pid',
      usage: 'pid',
      description: 'Calculates 100% correct calculated PID values.',
      throttling: {
        usages: 1,
        duration: 60
      }
    });
  }
  async run(message, args) {
    var p = Math.random(); // Generate random P value
    var i = Math.random(); // Generate random I value
    var d = Math.random(); // Generate random D value
    message.channel.send("Your correct values are:\n\nP: " + p + "\n\nI: " + i + "\n\nD: " + d); // Display PID values
  }
}
module.exports = PID;
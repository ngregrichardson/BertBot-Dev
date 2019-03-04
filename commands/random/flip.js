/* Config */
const commando = require('discord.js-commando');
var results = ["heads", "tails"];

class Flip extends commando.Command {
  constructor(client) {
    super(client, {
      name: 'flip',
      group: 'random',
      memberName: 'flip',
      usage: 'flip',
      description: 'Flips a coin.',
      throttling: {
        usages: 1,
        duration: 60
      }
    });
  }
  async run(message, args) {
    message.channel.send('It was ' + results[Math.floor(Math.random() * results.length)]); // Display heads or tails
  }
}
module.exports = Flip;
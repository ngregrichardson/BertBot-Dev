/* Config */
const commando = require('discord.js-commando');
var cool = require('cool-ascii-faces');

class Mood extends commando.Command {
  constructor(client) {
    super(client, {
      name: 'mood',
      group: 'random',
      memberName: 'mood',
      usage: 'mood',
      description: 'What a mood.',
      throttling: {
        usages: 1,
        duration: 60
      }
    });
  }
  async run(message, args) {
    message.channel.send(cool()); // Display random cool ascii face
  }
}
module.exports = Mood;
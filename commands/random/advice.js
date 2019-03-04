/* Config */
const commando = require('discord.js-commando');
const Discord = require('discord.js');
const request = require('node-superfetch');

class Advice extends commando.Command {
  constructor(client) {
    super(client, {
      name: 'advice',
      group: 'random',
      memberName: 'advice',
      usage: 'advice *<search term>*',
      description: 'Gives important advice.',
      throttling: {
        usages: 1,
        duration: 60
      },
      args: [{
        key: 'term',
        prompt: 'The correct usage of `!advice` is `!advice "**search term**"`',
        type: 'string',
        default: ''
      }]
    });
  }
  async run(message, {
    term
  }) {
    if (term) { // If there is a term
      const {
        body
      } = await request.get('https://api.adviceslip.com/advice/search/' + term); // Get advice from that term
      if (JSON.parse(body).slips.length != 0) { // If there is advice with that term
        message.channel.send(JSON.parse(body).slips[Math.floor(Math.random() * JSON.parse(body).slips.length)].advice); // Display the advice
      } else { // Otherwise
        message.channel.send('Sorry, there is no advice for that.'); // Output error
      }
    } else { // Otherwise
      const {
        body
      } = await request.get('https://api.adviceslip.com/advice'); // Get random advice
      message.channel.send(JSON.parse(body).slip.advice); // Display the advice
    }
  }
}
module.exports = Advice;
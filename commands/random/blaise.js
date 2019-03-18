/* Config */
const commando = require('discord.js-commando');
const db = require('/app/server.js');
const DadJokes = require('dadjokes-wrapper');
const dj = new DadJokes();

class Blaise extends commando.Command {
  constructor(client) {
    super(client, {
      name: 'blaise',
      group: 'random',
      memberName: 'blaise',
      usage: 'blaise *<search term>*',
      description: 'Tells a dad joke.',
      throttling: {
        usages: 1,
        duration: 600
      },
      args: [{
        key: 'term',
        prompt: 'The correct usage of `!blaise` is `!blaise "**search term**"`',
        type: 'string',
        default: ''
      }]
    });
  }
  async run(message, {
    term
  }) {
    var config = db.getConfig(message.guild.id);
    // If the channel is whitelisted
    if (config.blaiseWhitelistedChannelNames.includes(message.channel.name) || config.blaiseWhitelistedChannelNames.includes("allowAll")) {
      if (term) { // If there is a term
        dj.searchJoke({
          'term': term
        }).then(function (res) { // Get a joke from that term
          if (res.total_jokes != 0) { // If there are jokes with that term
            message.channel.send(res.results[Math.floor(Math.random() * res.results.length)].joke); // Display the joke
          } else { // Otherwise
            message.channel.send('Sorry, there are no jokes with that keyword'); // Output error
          }
        });
      } else { // Otherwise
        dj.randomJoke().then(function (res) { // Get a random joke
          message.channel.send(res); // Display the joke
        });
      }
    }
  }
}
module.exports = Blaise;
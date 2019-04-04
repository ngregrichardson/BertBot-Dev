/* Config */
const commando = require('discord.js-commando');

class Winner extends commando.Command {
  constructor(client) {
    super(client, {
      name: 'winner',
      group: 'random',
      memberName: 'winner',
      usage: 'winner',
      description: 'Displays the guaranteed winners of the next FRC season.',
      throttling: {
        usages: 1,
        duration: 60
      }
    });
  }
  async run(message, args) {
    var date = new Date(); // Get the current date
    var year;
    if (date.getMonth() <= 4) { // If we are before the end of the season
      year = date.getFullYear(); // We want the winners of the current year
    } else { // Otherwise
      year = date.getFullYear() + 1; // We want the winners of the next year
    }
    // Display the winners of the correct season
    message.channel.send("FRC Teams **#" + Math.floor(Math.random() * 7331) + "**, **#" + Math.floor(Math.random() * 7331) + "**, and **#" + Math.floor(Math.random() * 7331) + "** will win in the " + year + " season!");
  }
}
module.exports = Winner;
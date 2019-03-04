/* Config */
const commando = require('discord.js-commando');
const Discord = require('discord.js');

class Feedback extends commando.Command {
  constructor(client) {
    super(client, {
      name: 'feedback',
      group: 'info',
      memberName: 'feedback',
      usage: 'feedback',
      description: 'Displays the link for feedback on the bot.',
      throttling: {
        usages: 1,
        duration: 60
      }
    });
  }
  async run(message, args) {
    // Create embed with link to the Trello
    let embed = new Discord.RichEmbed().setColor("#127ABD").setTitle(`Feedback`).setDescription(`Please provide any feature requests or bug reports **[here](https://trello.com/b/UCVxVlJC/be%CA%B3%E1%B5%97bot)**`);
    message.channel.send(embed); // Send the embed
  }
}
module.exports = Feedback;
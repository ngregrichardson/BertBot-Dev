/* Config */
const commando = require('discord.js-commando');
const Discord = require('discord.js');
const request = require('node-superfetch');
const wiki = require('wikijs').default;

class Whatis extends commando.Command {
  constructor(client) {
    super(client, {
      name: 'whatis',
      group: 'info',
      memberName: 'whatis',
      usage: 'whatis *<search term>*',
      description: 'Searches Wikipedia.',
      args: [{
        key: 'term',
        prompt: 'The correct usage of `!whatis` is `!whatis "**search term**"',
        type: 'string'
      }]
    });
  }
  async run(message, {
    term
  }) {
    wiki().search(term).then(function (page) { // Search the term on wikipedia
      wiki().page(page.results[0]).then(async function (result) { // Get the page from the search
        const image = await result.mainImage(); // Get the main image
        let embed = new Discord.RichEmbed().setColor("#127ABD").setTitle(`${result.raw.title}`); // Create embed
        if (image != undefined) embed.setImage(image); // If there is an image, add it to the embed
        embed.setDescription(`**[ARTICLE LINK](${result.raw.fullurl})**`); // Add the link to the article
        message.channel.send(embed); // Send the embed
      });
    })
  }
}
module.exports = Whatis;
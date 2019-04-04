/* Config */
const commando = require('discord.js-commando');
const Discord = require('discord.js');
const request = require('node-superfetch');
const countries = require("i18n-iso-countries");

class Tba extends commando.Command {
  constructor(client) {
    super(client, {
      name: 'tba',
      group: 'tba',
      memberName: 'tba',
      usage: 'tba <team number>',
      description: 'Displays information about an FRC team.',
      throttling: {
        usages: 1,
        duration: 60
      },
      args: [{
        key: 'teamNumber',
        prompt: 'The correct usage of `!tba` is `!tba **teamNumber**`',
        type: 'string'
      }]
    });
  }
  async run(message, {
    teamNumber
  }) {
    // Get TBA information with team number
    const {
      body
    } = await request.get('https://www.thebluealliance.com/api/v3/team/frc' + teamNumber + '?X-TBA-Auth-Key=' + process.env.TBAKEY);
    // Create embed
    let embed = new Discord.RichEmbed().setColor("#127ABD").setThumbnail(`https://www.countryflags.io/${countries.getAlpha2Code(body.country == 'USA' ? 'United States of America' : body.country, 'en')}/flat/64.png`).setTitle(`${body.nickname} | ${body.team_number} | ${body.city}, ${body.state_prov}`).setURL(`https://www.thebluealliance.com/team/${teamNumber}`).setDescription(`Team Number: ${body.team_number}`).addField('Location', `${body.city}, ${body.state_prov}`).addField('Website', `${body.website}`);
    message.channel.send(embed); // Send the embed
  }
}
module.exports = Tba;
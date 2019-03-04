/* Config */
const commando = require('discord.js-commando');
const Discord = require('discord.js');
const request = require('node-superfetch');

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
    let embed = new Discord.RichEmbed().setColor("#127ABD").setTitle(`${body.nickname}`).setDescription(`Team Number: ${body.team_number}\nLocation: ${body.city}, ${body.state_prov}\n**[Website](${body.website})**\n**[TBA Page](https://www.thebluealliance.com/team/${teamNumber})**`);
    message.channel.send(embed); // Send the embed
  }
}
module.exports = Tba;
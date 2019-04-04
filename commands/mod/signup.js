const commando = require('discord.js-commando');
const db = require('/app/server.js');

class Signup extends commando.Command {
  constructor(client) {
    super(client, {
      name: 'signup',
      group: 'mod',
      memberName: 'signup',
      usage: 'signup',
      description: 'Sends a link to the owner to sign up. **M**',
      ownerOnly: true
    });
  }

  async run(message, {
    term,
    member,
    role
  }) {
    message.guild.owner.send(`Follow this link to sign up for customization: https://bert-dev.glitch.me/signup?serverId=${message.guild.id}`);
  }
}
module.exports = Signup;
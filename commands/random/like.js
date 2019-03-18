/* Config */
const commando = require('discord.js-commando');
const Discord = require('discord.js');
const db = require('/app/server.js');

class Like extends commando.Command {
  constructor(client) {
    super(client, {
      name: 'like',
      group: 'random',
      memberName: 'like',
      usage: 'like <count|top>',
      description: 'Displays the amount of likes.',
      throttling: {
        usages: 1,
        duration: 30
      },
      args: [{
        key: 'term',
        prompt: 'The correct usage of `!like` is `!like **count|top**`',
        type: 'string',
        default: ''
      }]
    });
  }
  async run(message, {
    term
  }) {
    var config = db.getConfig(message.guild.id);
    if (config.likeCounterEnabled) { // If like counter is enabled
      var likes; // Get likes from database
      var values = [];
      var top;
      if (term == 'top') { // If we're looking for the top 5
        likes = db.getLikes();
        for (var member in likes) { // For every member 
          values.push({
            'name': member,
            'likes': likes[member]
          }); // Add them to values array
        }
        if (values.length < 5) { // If there are less than 5 values
          top = values.sort((a, b) => b.likes - a.likes).splice(0, values.length); // Sort the likes
        } else { // Otherwise
          top = values.sort((a, b) => b.likes - a.likes).splice(0, 5); // Sort the likes, then cut out all but the top 5
        }
        // Create embed
        let embed = new Discord.RichEmbed().setColor("#127ABD").setTitle(`**Top Likes**`);
        for (var i = 0; i < top.length; i++) { // For each member in the top 5
          // Add an embed field for each member
          embed.addField(`**${i + 1}. ** ${top[i].name}: **${top[i].likes}** likes`, `------------------------`);
        }
        message.channel.send(embed); // Send the embed
      } else if (term == 'count') { // If we are looking for the user's count
        likes = db.getUserLikes(message.author);
        if (likes) { // If the user has likes
          var grammar;
          likes == 1 ? grammar = " like!" : grammar = " likes!"; // Make sure the grammar is correct :)
          message.author.send("You have " + likes + grammar); // Message the user with their like count
        } else { // Otherwise
          message.author.send("You do not have any likes yet."); // Output error
        }
      } else { // Otherwise
        message.channel.send('You must specify `count` or `top` for this command.'); // Output error
      }
    }
  }
}
module.exports = Like;
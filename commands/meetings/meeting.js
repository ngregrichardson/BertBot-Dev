/* Config */
const commando = require('discord.js-commando');
const Discord = require('discord.js');
const db = require('/app/server.js');
const moment = require('moment');

class Meeting extends commando.Command {
  constructor(client) {
    super(client, {
      name: 'meeting',
      group: 'meetings',
      memberName: 'meeting',
      usage: 'meeting <add|remove> <"description"> <day> <month> <start time> <am|pm>',
      description: 'Manages meetings. **R**',
      args: [{
        key: 'action',
        prompt: 'The correct usage of `!meeting` is `!meeting **add|remove** "description" day month time am|pm',
        type: 'string'
      },
      {
        key: 'description',
        prompt: 'The correct usage of `!meeting` is `!meeting add|remove "**description**" day month time am|pm',
        type: 'string',
        default: ''
      },
      {
        key: 'day',
        prompt: 'The correct usage of `!meeting` is `!meeting add|remove "description" **day** month time am|pm',
        type: 'string',
        default: ''
      },
      {
        key: 'month',
        prompt: 'The correct usage of `!meeting` is `!meeting add|remove "description" day **month** time am|pm',
        type: 'string',
        default: ''
      },
      {
        key: 'time',
        prompt: 'The correct usage of `!meeting` is `!meeting add|remove "description" day month **time** am|pm',
        type: 'string',
        default: ''
      },
      {
        key: 'ampm',
        prompt: 'The correct usage of `!meeting` is `!meeting add|remove "description" day month time **am|pm**',
        type: 'string',
        default: 'tf'
      }
      ]
    });
  }
  hasPermission(message) {
    var config = db.getConfig(message.guild.id);
    if(config.restrictedCommandRoles) return message.member.roles.some(r => config.restrictedCommandRoles.includes(r.name));
  }

  async run(message, {
    action,
    description,
    day,
    month,
    time,
    ampm
  }) {
    var meetings = db.getConfig(message.guild.id).meetings;
    if (action == 'add') { // If we're adding
      // Create the date
      var date = moment(`${moment().month(month).format('M')}-${parseInt(day)}-${moment().year()}-${parseInt(time.split(':')[0])}-${parseInt(time.split(':')[1])}-${ampm.toLowerCase()}`, 'M-D-YYYY-h-m-a').toObject();
      date.description = description; // Add the description to the date object
      date.time = time; // Add the time to the date object
      date.month = moment(date).format('MMMM');
      date.ampm = ampm.toLowerCase();
      meetings[`${Object.keys(meetings).length}`] = date; // Add the date to the meeting list
      db.updateMeetings(message.guild.id, meetings); // Write the updated meeting list to the database
      message.channel.send('The meeting was added.'); // Confirm the creation
    } else if (action == 'remove') { // If we're removing
      // If there are no meetings, output error
      if (Object.getOwnPropertyNames(meetings).length == 0) message.channel.send('There is no meeting on that date.');
      for (var meeting in meetings) { // For every meeting in meetings
        if (meetings[meeting].date == parseInt(day) && meetings[meeting].months == moment().month(month).format('M') - 1) { // If the month and day match the meeting
          // Create confirmation embed
          let embed = new Discord.RichEmbed().setTimestamp(Date.now()).setColor("#127ABD").setTitle(`Are you sure you want to remove this? (yes/no)`).setDescription(`**Upcoming meeting on:** ${moment(meetings[meeting]).format('dddd, MMMM Do, h:mm')}\n\n**Meeting Plans:** ${meetings[meeting].description}`);
          message.channel.send(embed); // Send the embed
          var collector = new Discord.MessageCollector(message.channel, m => m.author.id == message.author.id, {
            time: 10000
          }); // Listen for response
          collector.on('collect', message => { // On a response
            if (message.content.toLowerCase() == "yes") { // If yes
              delete meetings[meeting]; // Delete the meeting
              db.updateMeetings(message.guild.id, meetings); // Write the updated meeting list 
              message.channel.send('The meeting was removed.'); // Confirm the deletion
              collector.stop(); // Stop the collector
            } else if (message.content.toLowerCase() == "no") { // If no
              message.channel.send('The removal process was aborted.'); // Confirm the abort
              collector.stop(); // Stop the collector
            } else { // Otherwise
              message.channel.send('The correct usage is `yes|no`'); // Output error
            }
          });
        } else { // Otherwise
          message.channel.send('There is no meeting on that date.'); // Output error
        }
      }
    } else { // Otherwise
      message.channel.send('The correct usage of `!meeting` is `!meeting **add|remove** "description" day month time'); // Output error
    }
  }
}
module.exports = Meeting;
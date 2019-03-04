/* Config */
const commando = require('discord.js-commando');

class Kickoff extends commando.Command {
  constructor(client) {
    super(client, {
      name: 'kickoff',
      group: 'info',
      memberName: 'kickoff',
      usage: 'kickoff',
      description: 'Displays the amount of time until kickoff.'
    });
  }
  async run(message, args) {
    var now = new Date(); // Get the current date
    var year;
    var pastKickoff = new Date(new Date().getFullYear(), 0, 1); // Set the pastKickoff to Jan. 1st
    while (pastKickoff.getDay() !== 6) { // While it is before the first Saturday
      pastKickoff.setDate(pastKickoff.getDate() + 1); // Add one until it is equal to Saturday (6)
    }
    if (pastKickoff < now) { // If we are past kickoff
      year = now.getFullYear() + 1; // The next kickoff is in the next year
    } else { // Otherwise
      year = now.getFullYear(); // The kickoff is still in this year
    }

    var kickoff = new Date(year, 0, 6, 10, 30); // Set the next kickoff as the first day of January in the correct year
    while (kickoff.getDay() !== 6) { // While it is before the first Saturday
      kickoff.setDate(kickoff.getDate() + 1); // Add one until it is equal to Saturday (6)
    }
    var t = getTimeRemaining(kickoff); // Get the remaining time
    // Send the remaining time in the channel
    message.channel.send("There are **" + t.days + "** days, **" + t.hours + "** hours, **" + t.minutes + "** minutes, and **" + t.seconds + "** seconds left until the " + year + " kickoff!");
  }
}
module.exports = Kickoff;

// Get the remaining time
function getTimeRemaining(endtime) {
  var t = Date.parse(endtime) - Date.parse(new Date());
  var seconds = Math.floor((t / 1000) % 60);
  var minutes = Math.floor((t / 1000 / 60) % 60);
  var hours = Math.floor((t / (1000 * 60 * 60)) % 24);
  var days = Math.floor(t / (1000 * 60 * 60 * 24));
  return {
    'total': t,
    'days': days,
    'hours': hours,
    'minutes': minutes,
    'seconds': seconds
  };
}
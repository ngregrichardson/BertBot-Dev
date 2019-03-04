/* Config */
const fs = require('fs');
const db = require('/app/server.js');
const moment = require('moment');
/* Discord Packages */
const Discord = require('discord.js');
const commando = require('discord.js-commando');
/* Trello Packages */
const Trello = require('trello-events');
const RapidAPI = require('rapidapi-connect');
/* Gmail Packages */
var imaps = require('imap-simple');
var sendEmail = require('gmail-send')({
  user: process.env.GFROM,
  pass: process.env.GP,
  to: process.env.GTO
});
var emailConfigs = [];
/* Discord Setup */
const bot = new commando.Client();
bot.registry.registerGroup('random', 'Random');
bot.registry.registerGroup('info', 'Info');
bot.registry.registerGroup('polls', 'Polls');
bot.registry.registerGroup('spam', 'Spam');
bot.registry.registerGroup('meetings', 'Meetings');
bot.registry.registerGroup('custom', 'Custom');
bot.registry.registerGroup('mod', 'Mod');
bot.registry.registerGroup('tba', 'Tba');
bot.registry.registerDefaults();
bot.registry.registerCommandsIn(__dirname + "/commands");
bot.login(process.env.TOKEN);
/* Swear Bot Setup */
const profanities = JSON.parse(fs.readFileSync('swears.json'));
const rapid = new RapidAPI(process.env.R1, process.env.R2);
let latestActivityId = fs.existsSync('.latestActivityID') ? fs.readFileSync('.latestActivityID') : 0
const trelloEventHandlers = [];

/* Bot Added */
bot.on("guildCreate", guild => {
  guild.owner.send(`Thanks for adding BertBot! To sign up and configure BertBot, please go here: https://bertbot.glitch.me/signup?serverId=${guild.id}`);
})

/* Bot Setup */
bot.on('ready', () => {
  for (var guild in bot.guilds) {
    var ownerId = db.getOwnerId(guild.id);
    var config = db.getConfig(ownerId);

    /* Trello Events Setup */
    if (config.trelloNotificationsOn) {
      if (!guild) {
        console.log(`Server with ID "${config.serverId}" not found! Trello notifications can't function without a valid server and channel.\nPlease add the correct server ID to your configuration and ensure I have proper access.\nYou may need to add me to your server using this link:\n    https://discordapp.com/api/oauth2/authorize?client_id=${bot.user.id}&permissions=8&scope=bot`);
      } else if (!guild.channels.has(config.trelloNotificationChannelId)) {
        console.log(`Channel with ID "${config.trelloNotificationChannelId}" not found! Trello notifications can't function without a valid channel.\nPlease add the correct channel ID to your configuration and ensure I have proper access.`);
      } else if (!config.watchedTrelloBoardIds || config.watchedTrelloBoardIds.length < 1) {
        console.log(`No board IDs provided! Please add at least one to your configuration. The board ID can be found in the URL: https://trello.com/b/TRELLO_ID/urtrelloboardname`);
      }
      trelloEventHandlers.push(new Trello({
        pollFrequency: 10000,
        minId: latestActivityId,
        start: false,
        trello: {
          boards: config.watchedTrelloBoardIds,
          key: config.trelloKey,
          token: trelloToken
        }
      }));
      trelloEventHandlers[trelloEventHandlers.length - 1].start();
    }

    /* Gmail Reader */
    if (config.orderSystemEnabled) {
      emailConfigs.push({
        imap: {
          user: config.orderFrom,
          password: config.orderFromPassword,
          host: 'imap.gmail.com',
          port: 993,
          tls: true,
          authTimeout: 3000
        }
      });
      setInterval(function () {
        imaps.connect(emailConfigs[emailConfigs.length - 1]).then(function (connection) { // Connect to the email
          return connection.openBox('ARCHIVE').then(function () { // Open the inbox
            var searchCriteria = [ // Search the inbox for
              ['FROM', config.orderTo], // Emails from
              'UNSEEN' // Unopened
            ];
            var fetchOptions = {
              bodies: ['HEADER', 'TEXT'], // Get the headers and text
              markSeen: true // Mark the email as read
            };
            return connection.search(searchCriteria, fetchOptions).then(function (results) { // When the search is done
              var subjects = results.map(function (res) { // Get the subjects
                return res.parts.filter(function (part) {
                  return part.which === 'HEADER';
                })[0].body.subject[0];
              });
              for (var i = 0; i < subjects.length; i++) { // For each email
                if (!subjects[i].includes('#')) return; // If it doesn't include a #
                var id = subjects[i].substring(subjects[i].indexOf('#') + 1); // Get the ID
                rapid.call('Trello', 'getCardChecklists', { // Get the checklist from the card
                  'apiKeys': config.trelloKey, // Auth
                  'accessToken': config.trelloToken, // Auth
                  'cardIdOrShortlink': id // Card ID
                }).on('success', (payload) => { // When it gets the checklist
                  if (payload == undefined) return;
                  for (var j = 0; j < payload[0].checkItems.length; j++) { // For each item in the checklist
                    if (payload[0].checkItems[j].name == config.orderPlacedChecklistItemName) { // If the item is called 'Order Placed'
                      rapid.call('Trello', 'updateCardCheckItem', { // Update the checklist item
                        'apiKeys': config.trelloKey, // Auth
                        'accessToken': config.trelloToken, // Auth
                        'cardIdOrShortlink': id, // Card ID
                        'idCheckItem': payload[0].checkItems[j].id, // Checklist item ID
                        'state': 'complete' // State to set to
                      }).on('success', (payload) => { // When it updates the checklist item
                        rapid.call('Trello', 'getBoardLists', { // Get the id of the list to move to
                          'apiKeys': config.trelloKey, // Auth
                          'accessToken': config.trelloToken, // Auth
                          'boardId': config.orderRequestBoardId // Board ID
                        }).on('success', (payload) => { // When it gets the list of lists
                          var listId; // List ID
                          for (var k = 0; k < payload.length; k++) { // For each list
                            if (payload[k].name == config.orderPlacedListName) { // If it is the list
                              listId = payload[k].id; // Get the id
                              break; // Break out of the loop
                            }
                          }
                          rapid.call('Trello', 'updateSingleCard', { // Update the card list
                            'apiKeys': config.trelloKey, // Auth
                            'accessToken': config.trelloToken, // Auth
                            'cardIdOrShortlink': id, // Card ID
                            'idList': listId // List ID
                          }).on('success', (payload) => { // When it moves the card
                            //console.log('Completed!'); // Confirmation
                          }).on('error', (payload) => { // If it couldn't move the card
                            console.log("Error moving card: " + payload); // Print the error
                          });
                        }).on('error', (payload) => {
                          console.log("Error getting list: " + payload); // Print the error
                        });
                      }).on('error', (payload) => { // If it couldn't update the checklist
                        console.log("Error updating checklist: " + payload); // Print the error
                      });
                      break; // Break from the loop
                    }
                  }
                }).on('error', (payload) => { // If it couldn't retrieve the checklist
                  console.log("Error retrieving checklist: " + payload); // Print the error
                });
              }
            });
          });
        });
      }, 60000);
    }

    if (config.meetingNotificationsEnabled) {
      setInterval(function () {
        var meetings = config.meetings;
        for (var meeting in meetings) {
          var remaining = moment(meetings[meeting]).diff(moment(), 'hours');
          if (remaining <= 23) {
            let embed = new Discord.RichEmbed().setTimestamp(Date.now()).setColor("#127ABD").setTitle(`Upcoming meeting on: ${moment(meetings[meeting]).format('dddd, MMMM Do, h:mm')}`).setDescription(`**Meeting Plans:** ${meetings[meeting].description}`);
            bot.channels.get(config.meetingNotificationsChannelId).send(embed);
            delete meetings[meeting];
            db.updateMeetings(bot.guild.id, meetings);
          }
        }
      }, 10000);
    }
  }
  console.log(`== Bot logged in as @${bot.user.tag}. Ready for action! ==`)
});

/* Swear Filter */
bot.on('message', message => { // When a message is sent
  if (message.channel.type == 'dm') return;
  var ownerId = db.getOwnerId(message.guild.id);
  var config = db.getConfig(ownerId);
  if (config.swearFilterEnabled) {
    // If the message is not in the spam chat, not in dms, and not from BertBot himself
    if (!config.swearFilterWhitelistedChannelNames.includes(message.channel.name) && message.author.id !== bot.user.id && message.channel.type !== 'dm') {
      for (var i = 0; i < profanities.length; i++) { // Run through each profane word
        for (var x = 0; x < message.content.split(" ").length; x++) { // Run through each word in the message, splitting at the spaces
          if (message.content.toLowerCase().split(" ")[x] == profanities[i].toLowerCase()) { // If any of the words match
            var time = new Date(); // Get the date and time
            message.guild.owner.send(`**${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}** | **${message.author.username}** tired to say **${profanities[i]}** in **${message.channel.name}**. **${message.content}`); // Send a message to the server owner
            message.author.send(`Your message in **${message.channel.name}** was deleted because it contained **${profanities[i]}**. If this is a mistake, contact your server owner. Otherwise, you might want to retry sending your message like this: ${message.content.replace(profanities[i], "****")}`); // Send a message to the author
            message.delete(); // Delete the message
            return; // Move on
          }
        }
      }
    }
  }
});

/* Like Tracker */

bot.on('messageReactionAdd', function (messageReaction, user) {
  if (message.channel.type == 'dm') return;
  var ownerId = db.getOwnerId(messageReaction.message.guild.id);
  var config = db.getConfig(ownerId);
  if (config.likeCounterEnabled) {
    if (messageReaction._emoji.name == '👍') {
      var author = messageReaction.message.author.username;
      var reactor = user.username;
      if (author != reactor) {
        var current = db.getUserLikes(messageReaction.message.author).likes;
        if (current == null || current == undefined) {
          current = 0;
        }
        current++;
        db.updateLikes(author, current);
      }
    }
  }
});

/*
 ** ====================================
 ** Trello event handlers and functions.
 ** ====================================
 */
for (var events in trelloEventHandlers) {
  // Fired when a card is created
  events.on('createCard', (event, board) => {
    if (!eventEnabled(`cardCreated`)) return
    let embed = getEmbedBase(event)
      .setTitle(`New card created under __${event.data.list.name}__!`)
      .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Card created under __${event.data.list.name}__ by **[${config.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
    send(addDiscordUserData(embed, event.memberCreator))
  })
  // Fired when a card is updated (description, due date, position, associated list, name, and archive status)
  events.on('updateCard', (event, board) => {
    let embed = getEmbedBase(event)
    if (event.data.old.hasOwnProperty("desc")) {
      if (!eventEnabled(`cardDescriptionChanged`)) return
      embed
        .setTitle(`Card description changed!`)
        .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Card description changed (see below) by **[${config.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
        .addField(`New Description`, typeof event.data.card.desc === "string" && event.data.card.desc.trim().length > 0 ? (event.data.card.desc.length > 1024 ? `${event.data.card.desc.trim().slice(0, 1020)}...` : event.data.card.desc) : `*[No description]*`)
        .addField(`Old Description`, typeof event.data.old.desc === "string" && event.data.old.desc.trim().length > 0 ? (event.data.old.desc.length > 1024 ? `${event.data.old.desc.trim().slice(0, 1020)}...` : event.data.old.desc) : `*[No description]*`)
      send(addDiscordUserData(embed, event.memberCreator))
    } else if (event.data.old.hasOwnProperty("due")) {
      if (!eventEnabled(`cardDueDateChanged`)) return
      embed
        .setTitle(`Card due date changed!`)
        .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Card due date changed to __${event.data.card.due ? new Date(event.data.card.due).toUTCString() : `[No due date]`}__ from __${event.data.old.due ? new Date(event.data.old.due).toUTCString() : `[No due date]`}__ by **[${config.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
      send(addDiscordUserData(embed, event.memberCreator))
    } else if (event.data.old.hasOwnProperty("pos")) {
      if (!eventEnabled(`cardPositionChanged`)) return
      embed
        .setTitle(`Card position changed!`)
        .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Card position in list __${event.data.list.name}__ changed by **[${config.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
      send(addDiscordUserData(embed, event.memberCreator))
    } else if (event.data.old.hasOwnProperty("idList")) {
      if (!eventEnabled(`cardListChanged`)) return
      embed
        .setTitle(`Card list changed!`)
        .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Card moved to list __${event.data.listAfter.name}__ from list __${event.data.listBefore.name}__ by **[${config.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
      send(addDiscordUserData(embed, event.memberCreator))
    } else if (event.data.old.hasOwnProperty("name")) {
      if (!eventEnabled(`cardNameChanged`)) return
      embed
        .setTitle(`Card name changed!`)
        .setDescription(`**CARD:** *[See below for card name]* — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Card name changed (see below) by **[${config.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
        .addField(`New Name`, event.data.card.name)
        .addField(`Old Name`, event.data.old.name)
      send(addDiscordUserData(embed, event.memberCreator))
    } else if (event.data.old.hasOwnProperty("closed")) {
      if (event.data.old.closed) {
        if (!eventEnabled(`cardUnarchived`)) return
        embed
          .setTitle(`Card unarchived!`)
          .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Card unarchived and returned to list __${event.data.list.name}__ by **[${config.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
        send(addDiscordUserData(embed, event.memberCreator))
      } else {
        if (!eventEnabled(`cardArchived`)) return
        embed
          .setTitle(`Card archived!`)
          .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Card under list __${event.data.list.name}__ archived by **[${config.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
        send(addDiscordUserData(embed, event.memberCreator))
      }
    }
  })
  // Fired when a card is deleted
  events.on('deleteCard', (event, board) => {
    if (!eventEnabled(`cardDeleted`)) return
    let embed = getEmbedBase(event)
      .setTitle(`Card deleted!`)
      .setDescription(`**EVENT:** Card deleted from list __${event.data.list.name}__ by **[${config.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
    send(addDiscordUserData(embed, event.memberCreator))
  })
  // Fired when a comment is posted, or edited
  events.on('commentCard', (event, board) => {
    let embed = getEmbedBase(event)
    if (event.data.hasOwnProperty("textData")) {
      if (!eventEnabled(`commentEdited`)) return
      embed
        .setTitle(`Comment edited on card!`)
        .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Card comment edited (see below for comment text) by **[${config.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
        .addField(`Comment Text`, event.data.text.length > 1024 ? `${event.data.text.trim().slice(0, 1020)}...` : event.data.text)
        .setTimestamp(event.data.dateLastEdited)
      send(addDiscordUserData(embed, event.memberCreator))
    } else {
      if (!eventEnabled(`commentAdded`)) return
      embed
        .setTitle(`Comment added to card!`)
        .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Card comment added (see below for comment text) by **[${config.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
        .addField(`Comment Text`, event.data.text.length > 1024 ? `${event.data.text.trim().slice(0, 1020)}...` : event.data.text)
      send(addDiscordUserData(embed, event.memberCreator))
    }
  })
  // Fired when a member is added to a card
  events.on('addMemberToCard', (event, board) => {
    let embed = getEmbedBase(event)
      .setTitle(`Member added to card!`)
      .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Member **[${config.realNames ? event.member.fullName : event.member.username}](https://trello.com/${event.member.username})**`)
    let editedEmbed = addDiscordUserData(embed, event.member)
    if (event.member.id === event.memberCreator.id) {
      if (!eventEnabled(`memberAddedToCardBySelf`)) return
      editedEmbed.setDescription(editedEmbed.description + ` added themselves to card.`)
      send(editedEmbed)
    } else {
      if (!eventEnabled(`memberAddedToCard`)) return
      editedEmbed.setDescription(editedEmbed.description + ` added to card by **[${config.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
      send(addDiscordUserData(editedEmbed, event.memberCreator))
    }
  })
  // Fired when a member is removed from a card
  events.on('removeMemberFromCard', (event, board) => {
    let embed = getEmbedBase(event)
      .setTitle(`Member removed from card!`)
      .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Member **[${config.realNames ? event.member.fullName : event.member.username}](https://trello.com/${event.member.username})**`)
    let editedEmbed = addDiscordUserData(embed, event.member)
    if (event.member.id === event.memberCreator.id) {
      if (!eventEnabled(`memberRemovedFromCardBySelf`)) return
      editedEmbed.setDescription(editedEmbed.description + ` removed themselves from card.`)
      send(editedEmbed)
    } else {
      if (!eventEnabled(`memberRemovedFromCard`)) return
      editedEmbed.setDescription(editedEmbed.description + ` removed from card by **[${config.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
      send(addDiscordUserData(editedEmbed, event.memberCreator))
    }
  })
  // Fired when a list is created
  events.on('createList', (event, board) => {
    if (!eventEnabled(`listCreated`)) return
    let embed = getEmbedBase(event)
      .setTitle(`New list created!`)
      .setDescription(`**EVENT:** List __${event.data.list.name}__ created by **[${config.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
    send(addDiscordUserData(embed, event.memberCreator))
  })
  // Fired when a list is renamed, moved, archived, or unarchived
  events.on('updateList', (event, board) => {
    let embed = getEmbedBase(event)
    if (event.data.old.hasOwnProperty("name")) {
      if (!eventEnabled(`listNameChanged`)) return
      embed
        .setTitle(`List name changed!`)
        .setDescription(`**EVENT:** List renamed to __${event.data.list.name}__ from __${event.data.old.name}__ by **[${config.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
      send(addDiscordUserData(embed, event.memberCreator))
    } else if (event.data.old.hasOwnProperty("pos")) {
      if (!eventEnabled(`listPositionChanged`)) return
      embed
        .setTitle(`List position changed!`)
        .setDescription(`**EVENT:** List __${event.data.list.name}__ position changed by **[${config.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
      send(addDiscordUserData(embed, event.memberCreator))
    } else if (event.data.old.hasOwnProperty("closed")) {
      if (event.data.old.closed) {
        if (!eventEnabled(`listUnarchived`)) return
        embed
          .setTitle(`List unarchived!`)
          .setDescription(`**EVENT:** List __${event.data.list.name}__ unarchived by **[${config.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
        send(addDiscordUserData(embed, event.memberCreator))
      } else {
        if (!eventEnabled(`listArchived`)) return
        embed
          .setTitle(`List archived!`)
          .setDescription(`**EVENT:** List __${event.data.list.name}__ archived by **[${config.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
        send(addDiscordUserData(embed, event.memberCreator))
      }
    }
  })
  // Fired when an attachment is added to a card
  events.on('addAttachmentToCard', (event, board) => {
    if (config.orderRequestEmailSystemOn) {
      if (event.data.list.name == config.orderRequestedListName) { // If the attachment is in the 'Orders Requested' list
        if (event.data.attachment != undefined) { // If the attachment exists
          sendEmail({ // Send an email
            subject: 'New order form from ' + event.memberCreator.fullName + '! #' + event.data.card.id, // Create the subject line
            html: '<a href="' + event.data.attachment.url + '" style="text-decoration:none;color:black;font-size:200%;">Here is the form!</a><br><p>Reply "Order Completed" to mark complete on the Trello</p>' // Create the email
          }, function (err, res) { // Callback
            if (err) { // If there is an error
              console.log("Error sending email: " + err); // Print the error
            }
          });
        }
      }
    }
    if (!eventEnabled(`attachmentAddedToCard`)) return
    let embed = getEmbedBase(event)
      .setTitle(`Attachment added to card!`)
      .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Attachment named \`${event.data.attachment.name}\` added to card by **[${config.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
    send(addDiscordUserData(embed, event.memberCreator))
  })
  // Fired when an attachment is removed from a card
  events.on('deleteAttachmentFromCard', (event, board) => {
    if (!eventEnabled(`attachmentRemovedFromCard`)) return
    let embed = getEmbedBase(event)
      .setTitle(`Attachment removed from card!`)
      .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Attachment named \`${event.data.attachment.name}\` removed from card by **[${config.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
    send(addDiscordUserData(embed, event.memberCreator))
  })
  // Fired when a checklist is added to a card (same thing as created)
  events.on('addChecklistToCard', (event, board) => {
    if (!eventEnabled(`checklistAddedToCard`)) return
    let embed = getEmbedBase(event)
      .setTitle(`Checklist added to card!`)
      .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Checklist named \`${event.data.checklist.name}\` added to card by **[${config.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
    send(addDiscordUserData(embed, event.memberCreator))
  })
  // Fired when a checklist is removed from a card (same thing as deleted)
  events.on('removeChecklistFromCard', (event, board) => {
    if (!eventEnabled(`checklistRemovedFromCard`)) return
    let embed = getEmbedBase(event)
      .setTitle(`Checklist removed from card!`)
      .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Checklist named \`${event.data.checklist.name}\` removed from card by **[${config.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
    send(addDiscordUserData(embed, event.memberCreator))
  })
  // Fired when a checklist item's completion status is toggled
  events.on('updateCheckItemStateOnCard', (event, board) => {
    if (event.data.checkItem.state === "complete") {
      if (!eventEnabled(`checklistItemMarkedComplete`)) return
      let embed = getEmbedBase(event)
        .setTitle(`Checklist item marked complete!`)
        .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Checklist item under checklist \`${event.data.checklist.name}\` marked complete by **[${config.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
        .addField(`Checklist Item Name`, event.data.checkItem.name.length > 1024 ? `${event.data.checkItem.name.trim().slice(0, 1020)}...` : event.data.checkItem.name)
      send(addDiscordUserData(embed, event.memberCreator))
    } else if (event.data.checkItem.state === "incomplete") {
      if (!eventEnabled(`checklistItemMarkedIncomplete`)) return
      let embed = getEmbedBase(event)
        .setTitle(`Checklist item marked incomplete!`)
        .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Checklist item under checklist \`${event.data.checklist.name}\` marked incomplete by **[${config.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
        .addField(`Checklist Item Name`, event.data.checkItem.name.length > 1024 ? `${event.data.checkItem.name.trim().slice(0, 1020)}...` : event.data.checkItem.name)
      send(addDiscordUserData(embed, event.memberCreator))
    }
  })

  /*
   ** =======================
   ** Miscellaneous functions
   ** =======================
   */
  events.on('maxId', (id) => {
    if (latestActivityId == id) return
    latestActivityId = id
    fs.writeFileSync('.latestActivityID', id)
  })
  const send = (embed, content = ``) => config.channel.send(`${content}`, {
    embed: embed
  }).catch(err => console.error(err))
  const eventEnabled = (type) => config.enabledTrelloNotifications.length > 0 ? config.enabledTrelloNotifications.includes(type) : true
  const logEventFire = (event) => console.log(`${new Date(event.date).toUTCString()} - ${event.type} fired`)
  const getEmbedBase = (event) => new Discord.RichEmbed()
    .setFooter(`${config.guild.members.get(bot.user.id).displayName} • ${event.data.board.name} [${event.data.board.shortLink}]`, bot.user.displayAvatarURL)
    .setTimestamp(event.hasOwnProperty(`date`) ? event.date : Date.now())
    .setColor("#127ABD")
  // adds thumbanail and appends user mention to the end of the description, if possible
  const addDiscordUserData = (embed, member) => {
    if (config.userIDs[member.username]) {
      let discordUser = config.guild.members.get(config.userIDs[member.username])
      if (discordUser) embed
        .setThumbnail(discordUser.user.displayAvatarURL)
        .setDescription(`${embed.description} / ${discordUser.toString()}`)
    }
    return embed
  }
}
/* Ping */
const http = require('http');
setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 280000);
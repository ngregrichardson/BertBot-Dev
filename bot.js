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
const trelloEventHandlers = [];

/* Bot Added */
bot.on("guildCreate", guild => {
  guild.owner.send(`Thanks for adding BertBot! To sign up and configure BertBot, please go here: https://bertbot.glitch.me/signup?serverId=${guild.id}`);
})

/* Bot Setup */
bot.on('ready', () => {
  for (var guild in bot.guilds) {
    var config = db.getConfig(guild.id);

    /* Trello Events Setup */
    if (config.trelloNotificationsEnabled) {
      if (!guild) {
        console.log(`Server with ID "${config.serverId}" not found! Trello notifications can't function without a valid server and channel.\nPlease add the correct server ID to your configuration and ensure I have proper access.\nYou may need to add me to your server using this link:\n    https://discordapp.com/api/oauth2/authorize?client_id=${bot.user.id}&permissions=8&scope=bot`);
      } else if (!guild.channels.has(config.trelloNotificationsChannelId)) {
        console.log(`Channel with ID "${config.trelloNotificationsChannelId}" not found! Trello notifications can't function without a valid channel.\nPlease add the correct channel ID to your configuration and ensure I have proper access.`);
      } else if (!config.watchedTrelloBoardIds || config.watchedTrelloBoardIds.length < 1) {
        console.log(`No board IDs provided! Please add at least one to your configuration. The board ID can be found in the URL: https://trello.com/b/TRELLO_ID/urtrelloboardname`);
      }
      trelloEventHandlers.push(new Trello({
        pollFrequency: 10000,
        minId: 0,
        start: false,
        trello: {
          boards: config.watchedTrelloBoardIds,
          key: config.trelloKey,
          token: config.trelloToken
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
          if (remaining <= 24) {
            let embed = new Discord.RichEmbed().setTimestamp(Date.now()).setColor("#127ABD").setTitle(`Upcoming meeting on: ${moment(meetings[meeting]).format('dddd, MMMM Do, h:mm')}`).setDescription(`**Meeting Plans:** ${meetings[meeting].description}`);
            bot.channels.get(config.meetingNotificationsChannelId).send(embed);
            delete meetings[meeting];
            db.updateMeetings(bot.guild.id, meetings);
          }
        }
      }, 10000);
    }
  }
  console.log(`== Bot logged in as @${bot.user.tag}! ==`);
});

/* Swear Filter */
bot.on('message', message => { // When a message is sent
  if (message.channel.type == 'dm') return;
  db.getConfig(message.guild.id).then((config) => {
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
  }).catch((err) => {
    console.log(err);
  });
});

/* Like Tracker */

bot.on('messageReactionAdd', function (messageReaction, user) {
  if (messageReaction.message.channel.type == 'dm') return;
  var config = db.getConfig(messageReaction.message.guild.id);
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
    let embed = getEmbedBase(event, config)
      .setTitle(`New card created under __${event.data.list.name}__!`)
      .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Card created under __${event.data.list.name}__ by **[${event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
      db.getConfigs().then((configs) => {
        for(var config in configs){
          if (config.watchedTrelloBoardIds.includes(board.id)) {
            send(embed, config)
          }
        }
      });
  })
  // Fired when a card is updated (description, due date, position, associated list, name, and archive status)
  events.on('updateCard', (event, board) => {
    let embed = getEmbedBase(event, config)
    if (event.data.old.hasOwnProperty("desc")) {
        db.getConfigs().then((configs) => {
          for(var config in configs){
            if (config.watchedTrelloBoardIds.includes(board.id)) {
              if (!eventEnabled(`cardDescriptionChanged`, config)) return
              embed
                .setTitle(`Card description changed!`)
                .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Card description changed (see below) by **[${event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
                .addField(`New Description`, typeof event.data.card.desc === "string" && event.data.card.desc.trim().length > 0 ? (event.data.card.desc.length > 1024 ? `${event.data.card.desc.trim().slice(0, 1020)}...` : event.data.card.desc) : `*[No description]*`)
                .addField(`Old Description`, typeof event.data.old.desc === "string" && event.data.old.desc.trim().length > 0 ? (event.data.old.desc.length > 1024 ? `${event.data.old.desc.trim().slice(0, 1020)}...` : event.data.old.desc) : `*[No description]*`)
              send(embed, config)
            }
          }
        });
    } else if (event.data.old.hasOwnProperty("due")) {
        db.getConfigs().then((configs) => {
          for(var config in configs){
            if (config.watchedTrelloBoardIds.includes(board.id)) {
              if (!eventEnabled(`cardDueDateChanged`, config)) return
              embed
                .setTitle(`Card due date changed!`)
                .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Card due date changed to __${event.data.card.due ? new Date(event.data.card.due).toUTCString() : `[No due date]`}__ from __${event.data.old.due ? new Date(event.data.old.due).toUTCString() : `[No due date]`}__ by **[${event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
              send(embed, config)
            }
          }
        });
    } else if (event.data.old.hasOwnProperty("pos")) {
        db.getConfigs().then((configs) => {
          for(var config in configs){
            if (config.watchedTrelloBoardIds.includes(board.id)) {
              if (!eventEnabled(`cardPositionChanged`, config)) return
              embed
                .setTitle(`Card position changed!`)
                .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Card position in list __${event.data.list.name}__ changed by **[${event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
              send(embed, config)
            }
          }
        });
    } else if (event.data.old.hasOwnProperty("idList")) {
        db.getConfigs().then((configs) => {
          for(var config in configs){
            if (config.watchedTrelloBoardIds.includes(board.id)) {
              if (!eventEnabled(`cardListChanged`, config)) return
              embed
                .setTitle(`Card list changed!`)
                .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Card moved to list __${event.data.listAfter.name}__ from list __${event.data.listBefore.name}__ by **[${event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
              send(embed, config)
            }
          }
        });
    } else if (event.data.old.hasOwnProperty("name")) {
        db.getConfigs().then((configs) => {
          for(var config in configs){
            if (config.watchedTrelloBoardIds.includes(board.id)) {
              if (!eventEnabled(`cardNameChanged`, config)) return
              embed
                .setTitle(`Card name changed!`)
                .setDescription(`**CARD:** *[See below for card name]* — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Card name changed (see below) by **[${event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
                .addField(`New Name`, event.data.card.name)
                .addField(`Old Name`, event.data.old.name)
              send(embed, config)
            }
          }
        });
    } else if (event.data.old.hasOwnProperty("closed")) {
      if (event.data.old.closed) {
          db.getConfigs().then((configs) => {
            for(var config in configs){
              if (config.watchedTrelloBoardIds.includes(board.id)) {
                if (!eventEnabled(`cardUnarchived`, config)) return
                embed
                  .setTitle(`Card unarchived!`)
                  .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Card unarchived and returned to list __${event.data.list.name}__ by **[${event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
                send(embed, config)
              }
            }
          });
      } else {
          db.getConfigs().then((configs) => {
            for(var config in configs){
              if (config.watchedTrelloBoardIds.includes(board.id)) {
                if (!eventEnabled(`cardArchived`, config)) return
                embed
                  .setTitle(`Card archived!`)
                  .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Card under list __${event.data.list.name}__ archived by **[${event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
                send(embed, config)
              }
            }
          });
      }
    }
  })
  // Fired when a card is deleted
  events.on('deleteCard', (event, board) => {
      db.getConfigs().then((configs) => {
        for(var config in configs){
          if (config.watchedTrelloBoardIds.includes(board.id)) {
            if (!eventEnabled(`cardDeleted`, config)) return
            let embed = getEmbedBase(event, config)
              .setTitle(`Card deleted!`)
              .setDescription(`**EVENT:** Card deleted from list __${event.data.list.name}__ by **[${event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
            send(embed, config)
          }
        }
      });
  })
  // Fired when a comment is posted, or edited
  events.on('commentCard', (event, board) => {
    let embed = getEmbedBase(event, config)
    if (event.data.hasOwnProperty("textData")) {
        db.getConfigs().then((configs) => {
          for(var config in configs){
            if (config.watchedTrelloBoardIds.includes(board.id)) {
              if (!eventEnabled(`commentEdited`, config)) return
              embed
                .setTitle(`Comment edited on card!`)
                .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Card comment edited (see below for comment text) by **[${event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
                .addField(`Comment Text`, event.data.text.length > 1024 ? `${event.data.text.trim().slice(0, 1020)}...` : event.data.text)
                .setTimestamp(event.data.dateLastEdited)
              send(embed, config)
            }
          }
        });
    } else {
        db.getConfigs().then((configs) => {
          for(var config in configs){
            if (config.watchedTrelloBoardIds.includes(board.id)) {
              if (!eventEnabled(`commentAdded`, config)) return
              embed
                .setTitle(`Comment added to card!`)
                .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Card comment added (see below for comment text) by **[${event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
                .addField(`Comment Text`, event.data.text.length > 1024 ? `${event.data.text.trim().slice(0, 1020)}...` : event.data.text)
              send(embed, config)
            }
          }
        });
    }
  })
  // Fired when a member is added to a card
  events.on('addMemberToCard', (event, board) => {
    let embed = getEmbedBase(event, config)
      .setTitle(`Member added to card!`)
      .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Member **[${event.member.username}](https://trello.com/${event.member.username})**`)
    if (event.member.id === event.memberCreator.id) {
      db.getConfigs().then((configs) => {
        for(var config in configs){
          if (config.watchedTrelloBoardIds.includes(board.id)) {
            if (!eventEnabled(`memberAddedToCardBySelf`, config)) return
            embed.setDescription(embed.description + ` added themselves to card.`)
            send(embed, config)
          }
        }
      });
    } else {
      db.getConfigs().then((configs) => {
        for(var config in configs){
          if (config.watchedTrelloBoardIds.includes(board.id)) {
            if (!eventEnabled(`memberAddedToCard`, config)) return
            embed.setDescription(embed.description + ` added to card by **[${event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
            send(embed, config)
          }
        }
      });
    }
  })
  // Fired when a member is removed from a card
  events.on('removeMemberFromCard', (event, board) => {
    let embed = getEmbedBase(event, config)
      .setTitle(`Member removed from card!`)
      .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Member **[${event.member.username}](https://trello.com/${event.member.username})**`)
    if (event.member.id === event.memberCreator.id) {
      db.getConfigs().then((configs) => {
        for(var config in configs){
          if (!eventEnabled(`memberRemovedFromCardBySelf`, config)) return
          embed.setDescription(embed.description + ` removed themselves from card.`)
          if (config.watchedTrelloBoardIds.includes(board.id)) {
            send(embed, config)
          }
        }
      });
    } else {
      db.getConfigs().then((configs) => {
        for(var config in configs){
          if (config.watchedTrelloBoardIds.includes(board.id)) {
            if (!eventEnabled(`memberRemovedFromCard`, config)) return
      embed.setDescription(embed.description + ` removed from card by **[${event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
            send(embed, config)
          }
        }
      });
    }
  })
  // Fired when a list is created
  events.on('createList', (event, board) => {
      db.getConfigs().then((configs) => {
        for(var config in configs){
          if (config.watchedTrelloBoardIds.includes(board.id)) {
            if (!eventEnabled(`listCreated`, config)) return
            let embed = getEmbedBase(event, config)
              .setTitle(`New list created!`)
              .setDescription(`**EVENT:** List __${event.data.list.name}__ created by **[${event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
            send(embed, config)
          }
        }
      });
  })
  // Fired when a list is renamed, moved, archived, or unarchived
  events.on('updateList', (event, board) => {
    let embed = getEmbedBase(event, config)
    if (event.data.old.hasOwnProperty("name")) {
        db.getConfigs().then((configs) => {
          for(var config in configs){
            if (config.watchedTrelloBoardIds.includes(board.id)) {
              if (!eventEnabled(`listNameChanged`, config)) return
              embed
              .setTitle(`List name changed!`)
              .setDescription(`**EVENT:** List renamed to __${event.data.list.name}__ from __${event.data.old.name}__ by **[${event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
              send(embed, config)
            }
          }
        });
    } else if (event.data.old.hasOwnProperty("pos")) {
        db.getConfigs().then((configs) => {
          for(var config in configs){
            if (config.watchedTrelloBoardIds.includes(board.id)) {
              if (!eventEnabled(`listPositionChanged`, config)) return
              embed
                .setTitle(`List position changed!`)
                .setDescription(`**EVENT:** List __${event.data.list.name}__ position changed by **[${event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
              send(embed, config)
            }
          }
        });
    } else if (event.data.old.hasOwnProperty("closed")) {
      if (event.data.old.closed) {
          db.getConfigs().then((configs) => {
            for(var config in configs){
              if (config.watchedTrelloBoardIds.includes(board.id)) {
                if (!eventEnabled(`listUnarchived`, config)) return
                embed
                  .setTitle(`List unarchived!`)
                  .setDescription(`**EVENT:** List __${event.data.list.name}__ unarchived by **[${event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
                send(embed, config)
              }
            }
          });
      } else {
          db.getConfigs().then((configs) => {
            for(var config in configs){
              if (config.watchedTrelloBoardIds.includes(board.id)) {
                if (!eventEnabled(`listArchived`, config)) return
                embed
                  .setTitle(`List archived!`)
                  .setDescription(`**EVENT:** List __${event.data.list.name}__ archived by **[${event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
                send(embed, config)
              }
            }
          });
      }
    }
  })
  // Fired when an attachment is added to a card
  events.on('addAttachmentToCard', (event, board) => {
    console.log(board);
    db.getConfigs().then((configs) => {
      for(var config in configs){
        if (config.watchedTrelloBoardIds.includes(board.id)) {
          if (!eventEnabled(`attachmentAddedToCard`, config)) return
          let embed = getEmbedBase(event, config)
            .setTitle(`Attachment added to card!`)
            .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Attachment named \`${event.data.attachment.name}\` added to card by **[${event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
          send(embed, config)
          if (config.orderSystemEnabled) {
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
        }
      }
    });
  })
  // Fired when an attachment is removed from a card
  events.on('deleteAttachmentFromCard', (event, board) => {
      db.getConfigs().then((configs) => {
        for(var config in configs){
          if (config.watchedTrelloBoardIds.includes(board.id)) {
            if (!eventEnabled(`attachmentRemovedFromCard`, config)) return
            let embed = getEmbedBase(event, config)
              .setTitle(`Attachment removed from card!`)
              .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Attachment named \`${event.data.attachment.name}\` removed from card by **[${event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
            send(embed, config)
          }
        }
      });
  })
  // Fired when a checklist is added to a card (same thing as created)
  events.on('addChecklistToCard', (event, board) => {
      db.getConfigs().then((configs) => {
        for(var config in configs){
          if (config.watchedTrelloBoardIds.includes(board.id)) {
            if (!eventEnabled(`checklistAddedToCard`, config)) return
            let embed = getEmbedBase(event, config)
              .setTitle(`Checklist added to card!`)
              .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Checklist named \`${event.data.checklist.name}\` added to card by **[${event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
            send(embed, config)
          }
        }
      });
  })
  // Fired when a checklist is removed from a card (same thing as deleted)
  events.on('removeChecklistFromCard', (event, board) => {
      db.getConfigs().then((configs) => {
        for(var config in configs){
          if (config.watchedTrelloBoardIds.includes(board.id)) {
            if (!eventEnabled(`checklistRemovedFromCard`, config)) return
            let embed = getEmbedBase(event, config)
              .setTitle(`Checklist removed from card!`)
              .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Checklist named \`${event.data.checklist.name}\` removed from card by **[${event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
            send(embed, config)
          }
        }
      });
  })
  // Fired when a checklist item's completion status is toggled
  events.on('updateCheckItemStateOnCard', (event, board) => {
    if (event.data.checkItem.state === "complete") {
        db.getConfigs().then((configs) => {
          for(var config in configs){
            if (config.watchedTrelloBoardIds.includes(board.id)) {
              if (!eventEnabled(`checklistItemMarkedComplete`, config)) return
              let embed = getEmbedBase(event, config)
                .setTitle(`Checklist item marked complete!`)
                .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Checklist item under checklist \`${event.data.checklist.name}\` marked complete by **[${event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
                .addField(`Checklist Item Name`, event.data.checkItem.name.length > 1024 ? `${event.data.checkItem.name.trim().slice(0, 1020)}...` : event.data.checkItem.name)
              send(embed, config)
            }
          }
        });
    } else if (event.data.checkItem.state === "incomplete") {
        db.getConfigs().then((configs) => {
          for(var config in configs){
            if (config.watchedTrelloBoardIds.includes(board.id)) {
              if (!eventEnabled(`checklistItemMarkedIncomplete`, config)) return
              let embed = getEmbedBase(event, config)
                .setTitle(`Checklist item marked incomplete!`)
                .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Checklist item under checklist \`${event.data.checklist.name}\` marked incomplete by **[${event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
                .addField(`Checklist Item Name`, event.data.checkItem.name.length > 1024 ? `${event.data.checkItem.name.trim().slice(0, 1020)}...` : event.data.checkItem.name)
              send(embed, config)
            }
          }
        });
    }
  })

  /*
   ** =======================
   ** Miscellaneous functions
   ** =======================
   */
  const send = (embed, config) => bot.channels.find(channel => channel.id == config.trelloNotificationsChannelId).send(`${''}`, {
    embed: embed
  }).catch(err => console.error(err))
  const eventEnabled = (type, config) => console.log(type);//config.enabledTrelloNotifications.length > 0 ? config.enabledTrelloNotifications.includes(type) : true
  const logEventFire = (event) => console.log(`${new Date(event.date).toUTCString()} - ${event.type} fired`)
  const getEmbedBase = (event, config) => new Discord.RichEmbed()
    .setFooter(`${config.botName} • ${event.data.board.name} [${event.data.board.shortLink}]`, bot.user.displayAvatarURL)
    .setTimestamp(event.hasOwnProperty(`date`) ? event.date : Date.now())
    .setColor("#127ABD")
}
/* Ping */
const http = require('http');
setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 280000);
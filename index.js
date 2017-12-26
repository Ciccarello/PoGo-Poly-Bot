/* jshint esversion: 6 */
/* jshint node: true */
const Discord = require("discord.js"),
	client = new Discord.Client(),
	TwitterStream = require('twitter-stream-api'),
	newUsers = [],
	request = require('request').defaults({
		encoding: null
	}),
	DateTime = require('datetime-converter-nodejs'),
	Moment = require('moment-timezone'),
	moment = require('moment'),
	Exif = require("simple-exiftool"),
	textract = require("textract"),
	Jimp = require("jimp"),
	GMapsAPI = require("./classes/GMapsAPI.js"),
	GMapsObj = new GMapsAPI(),
	Address = require("./classes/Address.js"),
	AddressObj = new Address(),
	PokedexCmd = require("./classes/PokedexCmd.js"),
	PokedexObj = new PokedexCmd(),
	Invite = require("./classes/Invite.js"),
	InviteObj = new Invite(),
	TAddDel = require("./classes/TAddDel.js"),
	TAddDelObj = new TAddDel(),
	Userinfo = require("./classes/Userinfo.js"),
	UserinfoObj = new Userinfo(),
	Help = require("./classes/Help.js"),
	HelpObj = new Help(),
	Callme = require("./classes/Callme.js"),
	CallmeObj = new Callme(),
	BotContact = require("./classes/BotContact.js"),
	BotContactObj = new BotContact(),
	ghbLevelPattern = new RegExp(/Level 1|Level 2|Level 3|Level 4|Level 5/i),
	raid1Pattern = new RegExp(/L1|level 1|L1|T1|tier 1|Tier 1/i),
	raid2Pattern = new RegExp(/L2|level 2|L2|tier 2|Tier 2|T2/i),
	raid3Pattern = new RegExp(/L3|level 3|L3|tier 3|Tier 3|T3/i),
	raid4Pattern = new RegExp(/L4|level 4|L4|tier 4|Tier 4|T4/i),
	raid5Pattern = new RegExp(/L5|level 5|L5|tier 5|Tier 5|T5/i),
	raidChannelPattern = new RegExp(/raids/);

var raidBosses = require('./data/raidboss.json'),
twitterKeys = {
	consumer_key : "poyJARVI2vqGmfyaEIabWXlmm",
	consumer_secret : "LxqjoxmofSTWsbScn7wUNxd7DKDjNJ6bjFvf9CPrUEHhcTGO9f",
	token : "288824671-XwJxXH5n9eNmXwbffb5oXP99USx3rysrxj2Ypo38",
	token_secret : "lfZ6lD3Ju5CfykIRMPLaMAnUHrbpbXl3d8yg0ynAsYR9K"
},
	Twitter = new TwitterStream(twitterKeys, false),
	//2839430431 = https://twitter.com/PokemonGoApp
	//849344094681870336 = https://twitter.com/NianticHelp
	//575930104 = https://twitter.com/metaphorminute  REMOVED, FOR TESTING
	
	twitterUsers = [ '2839430431' , '849344094681870336'], //
	timesAnHour = 0;


client.login("Mzk0MTMyNTcyNzYzODQ4NzA1.DSAKTA.d2r7QnChHAAcLD7mqXeYczsK4Mo");

client.on("ready", () => {
	console.log("I am ready!");
	client.setInterval( everyHour, 900000 );//3600000 1800000 1200000 900000 60000
});

Twitter.stream('statuses/filter', {
	follow: twitterUsers
});

Twitter.on('connection success', function (uri) {
    console.log('connection success', uri);
});

Twitter.on('data', function (obj) {
	console.log('message received');
    let tweet = JSON.parse(obj.toString()),
		messageContent = '';
		//console.log(tweet);
	if(typeof tweet.user !== 'undefined' && tweet.user !== null){
		console.log(tweet.user.id_str);
		if( twitterUsers.includes( tweet.user.id_str ) ){
			console.log("User matches followed users");
			messageContent = `@everyone BREAKING NEWS from ${tweet.user.screen_name} https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`;
			client.guilds.forEach((item, index)=>{
				let announcements = '';
				announcements = item.channels.find('name', 'announcements');
				if ( announcements ) {
					announcements.send( messageContent );
				}
			});
		}
	}
});

client.on("guildMemberAdd", (member) => {
	const guild = member.guild;
	
	console.log(`New User "${member.user.username}" has joined "${member.guild.name}"`);
	member.user.send(`Welcome! ${member.user.username} to **${member.guild.name}**
  Here are a few things to start with:
  1. __**Please**__ go ahead and read the **#rules** channel for general information, as well as rules and guidelines on how to use the **PoGoPoly** discord server.
  2. __**Please Do Not**__ post raids in the **#general** channel, use the **#raids** channel. It helps keep the conversations organized.  
  3. If you don't see any of the other channels please be patient. Contact an admin, and someone will give you permissions as soon as possible.
  4. To change your nickname, you can use the \`.callme\` command followed by the nickname you want to use. Your nickname will only change in this server.  Changing it to your PoGo account name will help others identify you.
  5. Use @here to notify active users in the current channel. It will help you call the attention of people that may be interested in your post, but __please do not misuse__ @here. Use it only when absolutely necessary.
  6. You can use the \`.tadd\` and \`.tdel\` commands to receive @ notifications for specific tiers of raids.  For example, try .tadd T5 or .tadd tier 5.
	7. Use the voice channels in times of inclement weather.
  8. Under no circumstances should you cause drama or fight with other members. If you need to talk, create a private group chat and talk it out there.
  Happy Hunting, hope you catch 'em all.`);

	let role = member.guild.roles.find("name", 'Member');
	member.addRole(role).catch(console.error);
	
	
  if (!newUsers[guild.id]){
	 newUsers[guild.id] = new Discord.Collection(); 
  } 
  newUsers[guild.id].set(member.id, member.user);
});

client.on("guildMemberRemove", (member) => {
  const guild = member.guild;
  if ( newUsers[guild.id] && newUsers[guild.id].has(member.id) ){
	  newUsers[guild.id].delete(member.id);
  }
});

function everyHour(){
	let currentDate = Moment().tz('America/New_York').format('YYYY-MM-DD HH:MM:SS');
	let currentDateString = Moment().tz('America/New_York').format( 'YYYY-MM-DD');
	let currentTime = Moment().tz('America/New_York');
	if( currentTime.hour() <= 23 && currentTime.hour() >= 6 ){
		client.guilds.forEach((item, index)=>{
			if ( newUsers[index] && newUsers[index].size > 0 && timesAnHour == 0) {
				const userlist = newUsers[index].map(u => u.toString()).join(" ");
				item.channels.find('name', 'announcements').send("Welcome our new members!\n" + userlist);
				newUsers[index].clear();
			}

			/*
			 * Clear pinned messages on raid channels. (only 1 right now)
			 */
			
				item.channels.forEach((item, index)=>{
					if( raidChannelPattern.test( item.name ) ){
						item.fetchPinnedMessages()
						.then((pinnedMessages)=>{
							if( pinnedMessages.size > 0){
								pinnedMessages.forEach(( message, index)=>{
									let timerEnds = new Date( currentDateString + ' ' + message.embeds[0].fields[2].value );
									//console.log( timerEnds );
									//console.log( currentDate );
									let	isExpired = moment( currentDate ).isAfter( timerEnds );
									
									//console.log( 'timerends: ' + timerEnds + ' currentTime: '+ currentDate + ' isExpired: '+isExpired );
									if( isExpired ){
										message.unpin();
									}

								});
							}
						})
						.catch((error)=>{
							if(error){
								console.log(error);
							}
						});
					}
				});
		});
	}
	if( timesAnHour >= 3 ){
		timesAnHour = 0;
	}else{
		timesAnHour++;
	}
}

client.on("message", (message) => {
	// Set the prefix
	let prefix = ".",
		channelName = message.channel.name,
		currentTime = Moment().tz('America/New_York');
	
	if( message.system && message.type === 'PINS_ADD' && raidChannelPattern.test(channelName) && message.author.username === 'PoGoPolyBot' ){
		message.delete();
	}
	
	if( message.author.username == 'GymHuntrBot' ){
		if( message.embeds.length > 0 && message.embeds[0].url && ghbLevelPattern.test(message.embeds[0].title)){
			let raidLevel = '';
			if(raid1Pattern.test(message.embeds[0].title)) raidLevel = 'T1';
			if(raid2Pattern.test(message.embeds[0].title)) raidLevel = 'T2';
			if(raid3Pattern.test(message.embeds[0].title)) raidLevel = 'T3';
			if(raid4Pattern.test(message.embeds[0].title)) raidLevel = 'T4';
			if(raid5Pattern.test(message.embeds[0].title)) raidLevel = 'T5';
			let coordinates = message.embeds[0].url;
			coordinates = coordinates.replace( 'https://GymHuntr.com/#', '');

			let cityChannelName = GMapsObj.getCityChannelName(coordinates);
			if( cityChannelName === 'fort_lauderdale' ){
				cityChannelName = 'ft_lauderdale';			
			}
				let descSplit = message.embeds[0].description.split('\n');
				let content;
				
				if(descSplit.length == 4)
				{
				content = descSplit,
					raidBoss = content[1],
					raidBossLvl = raidLevel;
					raidBossImg = message.embeds[0].thumbnail.url,
					ssTakenDate = new Date(message.createdTimestamp),
					gymResults = content[0],
					timerResults = content[3].replace( '*Raid Ending: ', '').replace(' hours ', ':').replace(' min ', ':').replace(' sec*', ''),//*Raid Ending: 1 hours 35 min 34 sec*
					endedTime = '',
					timerArr = {};
				}
				console.log(content);
				if (timerResults !== '') {
					timerArr = timerResults.split(':');
					endedTime = moment(ssTakenDate).add({ hours: timerArr[0], minutes: timerArr[1], seconds: timerArr[2] }).tz('America/New_York').format("h:mm:ss A");
				}
				if( raidBoss ){
						let raidBossMention = message.guild.roles.find('name', raidLevel),
						raidChannel = '';
					raidBossMention = (raidBossMention) ? '<@&' + raidBossMention.id + '>' : '';
					raidChannel = message.guild.channels.find('name', 'raids');
					if ( raidChannel ) {
						raidChannel.send(`Gymhuntr has found a ${raidBossMention} Raid`, {
							"embed": {
								"color": 3447003,
								"title": 'Raid Posted!',
								"thumbnail": {
									"url": raidBossImg,
								},
								"fields": [{
									"name": "Gym",
									"value": gymResults,
									"inline": true
								}, {
									"name": "Timer",
									"value": timerResults,
									"inline": true
								}, {
									"name": "Ends At",
									"value": endedTime,
									"inline": true
								}]
							}
						} ).then(message => {
							message.pin();
						});
					}
				}
		}
	}
	
	if (message.author.bot) return;
	
	if( message.isMentioned(message.guild.members.get("394132572763848705")) ){
		BotContactObj.display(message);
	}
	
	/*
	 * CALLME
	 */
	if (message.content.startsWith(prefix + "callme")) {
		CallmeObj.display(prefix, message);
	}
	
	/*
	 * HELP
	 */
	if (message.content.startsWith(prefix + "help")) {
		HelpObj.display(prefix, message);
	}
	
	/*
	 * test Command
	 */
	 if (message.content.startsWith(prefix + "test")) {
		 //Put stuff here to test.
	 }
	
	/*
	 * USERINFO Command
	 */
	if (message.content.startsWith(prefix + "userinfo")) {
		UserinfoObj.display(prefix, message, channelName);
	}
	
	/*
	 *  tadd - tdel Command
	 */
	if (message.content.startsWith(prefix + "tdel")) {
		TAddDelObj.tdel(prefix, message);
	} else if (message.content.startsWith(prefix + "tadd")) {
		TAddDelObj.tadd(prefix, message);
	}
	
	/*
	 * INVITE COMMAND
	 */
	if (message.content.startsWith(prefix + "invite")) {
		InviteObj.genInvite(message);
	}

	/*
	 * POKEDEX COMMAND
	 */
	if (message.content.startsWith(prefix + "pokedex")) {
		PokedexObj.display(prefix, message);
	}
	/*
	 * ADDRESS COMMAND
	 */
	if (message.content.startsWith(prefix + "address")) {
		AddressObj.display(message, prefix, GMapsObj);
		}

});
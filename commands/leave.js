const Discord = require('discord.js');
const index = require(`../index.js`);
var client = index.getClient();

module.exports = {
    name: 'leave',
    description: `Leaves the user's voice channel`,
    aliases: ['l', 'disconnect'],
    // usage: '[usage]',
    // cooldown: seconds,
    guildOnly: true,
    enabled: true,
    async execute(message, args) {
        if (client.voice.connections.get(message.guild.id) != undefined) {
            let channelName = client.voice.connections.get(message.guild.id).channel.name;
            let disconnecting = await message.channel.send(new Discord.MessageEmbed()
                .setDescription(`:arrows_counterclockwise: Disconnecting from \`${channelName}`)
                .setColor(`#0083FF`));
            client.voice.connections.get(message.guild.id).disconnect();

            disconnecting.edit(new Discord.MessageEmbed()
                .setDescription(`:arrow_left: Disconnected from \`${channelName}\``)
                .setColor(`#0083FF`));
        } else {
            message.channel.send(new Discord.MessageEmbed()
                .setDescription(`<:cross:729019052571492434> I'm not in a voice channel`)
                .setColor(`#FF3838`));
        }
    }
};
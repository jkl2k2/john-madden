const Discord = require(`discord.js`);
const fs = require(`fs`);

module.exports = {
    name: 'prefix',
    description: 'Sets the server\'s prefix',
    // aliases: ['aliases'],
    args: true,
    usage: '[prefix]',
    // altUsage: 'command',
    // cooldown: 5,
    guildOnly: true,
    enabled: true,
    restrictions: {
        resolvable: [`MANAGE_GUILD`],
    },
    type: 'admin',
    execute(message, args) {
        let serverConfig = JSON.parse(fs.readFileSync(`./config/serverConfig.json`, `utf8`));

        serverConfig[message.guild.id] = {
            name: message.guild.name,
            prefix: args.join(" ")
        };

        fs.writeFile(`./config/serverConfig.json`, JSON.stringify(serverConfig, null, `\t`), err => {
            if (err) console.error(err);
        });

        message.channel.send(new Discord.MessageEmbed()
            .setDescription(`<:check:728881238970073090> Prefix for \`${message.guild.name}\` successfully set to \`${args.join(" ")}\``)
            .setColor(`#2EC14E`)
            .setFooter(`Changed by ${message.author.username}`, message.author.avatarURL())
            .setTimestamp());
    }
};
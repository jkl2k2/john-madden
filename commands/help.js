const Discord = require('discord.js');
const index = require(`../index.js`);
const fs = require(`fs`);

module.exports = {
    name: 'help',
    description: 'Shows all commands',
    // aliases: [],
    // usage: '[command]',
    cooldown: 5,
    // guildOnly: false,
    enabled: true,
    async execute(message, args) {
        const { commands } = message.client;
        var client = index.getClient();

        let serverConfig = JSON.parse(fs.readFileSync(`./config/serverConfig.json`, `utf8`));

        let prefix = serverConfig[message.guild.id].prefix;

        if (!args.length) {
            // Send list of commands

            var generalHelp = new Discord.MessageEmbed();

            generalHelp.setAuthor(`Use ${prefix}help [command name] to get info on a specific command`, client.user.avatarURL());

            generalHelp.addField(`Voice`, `tts\njoin\nleave`, true);
            generalHelp.addField(`General`, `help\nping`, true);
            generalHelp.addField(`Admin`, `prefix`, true);

            return message.channel.send(generalHelp);
        }

        const name = args[0].toLowerCase();
        const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

        if (!command) {
            return message.channel.send(new Discord.MessageEmbed()
                .setDescription(`<:cross:729019052571492434> Sorry, \`${prefix}${name}\` is not a valid command`)
                .setColor(`#FF3838`));
        }

        var commandHelp = new Discord.MessageEmbed();

        if (name != command.name) {
            commandHelp.setDescription(`*(Redirected from ${prefix}${name})*`);
        }

        commandHelp.setAuthor(prefix + command.name, client.user.avatarURL());

        // Aliases
        if (command.aliases) commandHelp.addField(`**Aliases**`, command.aliases.join(', '));

        // Description
        if (command.description) commandHelp.addField(`**Description**`, command.description);

        // Restrictions
        if (command.restrictions) {
            if (command.restrictions.resolvable && command.restrictions.resolvable.length > 0) {
                commandHelp.addField(`**Required Permissions**`, `\`${command.restrictions.resolvable.join(", ")}\``);
            } else if (command.restrictions.id && command.restrictions.id.length > 0) {
                commandHelp.addField(`**Restricted Command**`, `Only certain users can access this command`);
            }
        }

        // Usage
        if (command.usage) {
            if (command.altUsage) {
                commandHelp.addField(`**Usage**`, `\`${prefix}${command.name} ${command.usage}\`\n*Or alternatively*\n\`${prefix}${command.name} ${command.altUsage}\``);
            } else {
                commandHelp.addField(`**Usage**`, `\`${prefix}${command.name} ${command.usage}\``);
            }
        }

        // Guild only
        if (command.guildOnly) commandHelp.addField(`**Servers only**`, `Only usable in servers, not DMs`);
        if (!command.guildOnly) commandHelp.addField(`**Servers or DMs**`, `Usable in both servers and bot's DMs`);

        // Arguments
        // if (command.args) commandHelp.addField(`**Arguments required**`, `Providing the required arguments is required`);

        // Cooldown
        commandHelp.addField(`**Cooldown**`, `${command.cooldown || 3} second(s)`);

        message.channel.send(commandHelp);
    },
};
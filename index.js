//#region Requires
const { TOKEN, OWNER_ID } = require(`./config/config.json`);
const Discord = require(`discord.js`);
const fs = require(`fs`);
//#endregion

//#region Initialize client
const client = new Discord.Client();
client.commands = new Discord.Collection();
const cooldowns = new Discord.Collection();
//#endregion

//#region Exports
module.exports = {
    getClient: function () {
        return client;
    }
};
//#endregion

//#region Load commands
// Initialize command files
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}
//#endregion

//#region Client ready
client.once(`ready`, () => {
    console.log(`Bot initialized: active in ${client.guilds.cache.size} servers`);
    client.user.setActivity({ type: `PLAYING`, name: `Moonbase Alpha` });
});
//#endregion

//#region On message
client.on(`message`, message => {
    // Ignore bots
    if (message.author.bot) return;

    // Read serverConfig
    let serverConfig = JSON.parse(fs.readFileSync(`./config/serverConfig.json`, `utf8`));

    if (!serverConfig[message.guild.id]) {
        console.log(`New server registered with serverConfig\nName: "${message.guild.name}"\nID: ${message.guild.id}`);

        // Register server with default prefix
        serverConfig[message.guild.id] = {
            name: message.guild.name,
            prefix: `=`
        };

        // Write to serverConfig.json
        fs.writeFile(`./config/serverConfig.json`, JSON.stringify(serverConfig, null, `\t`), err => {
            if (err) console.error(err);
        });
    }

    // If server name changed
    if (serverConfig[message.guild.id] && serverConfig[message.guild.id].name != message.guild.name) {
        console.log(`Updating server in serverConfig\nPrevious Name: "${serverConfig[message.guild.id].name}"\nNew Name: "${message.guild.name}"\nID: ${message.guild.id}`);

        // Update server config with new name
        serverConfig[message.guild.id] = {
            name: message.guild.name,
            prefix: serverConfig[message.guild.id].prefix
        };

        // Write to serverConfig.json
        fs.writeFile(`./config/serverConfig.json`, JSON.stringify(serverConfig, null, `\t`), err => {
            if (err) console.error(err);
        });
    }

    // Establish prefix
    let prefix = serverConfig[message.guild.id].prefix;

    // If message is only bot mention, show prefix
    if (message.content == "<@!736445476353736775>") {
        return message.channel.send(new Discord.MessageEmbed()
            .setDescription(`:information_source: My prefix for the server \`${message.guild.name}\` is currently \`${prefix}\``)
            .setColor(`#0083FF`));
    }

    if (!message.content.startsWith(prefix)) return;

    // Put args into array
    const args = message.content.slice(prefix.length).split(/ +/);
    const argsShifted = [...args];
    argsShifted.shift();

    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) return;

    // If guild-only, no DMs allowed
    if (command.guildOnly && message.channel.type !== 'text') {
        return message.channel.send(new Discord.MessageEmbed()
            .setDescription(`<:cross:729019052571492434> Sorry, that command is only usable in servers`)
            .setColor(`#FF3838`));
    }

    // If command needs arguments
    if (command.args && !args.length) {
        let noArgs = new Discord.MessageEmbed();
        let msg = `You didn't use \`${prefix}${command.name}\` correctly, ${message.author.username}`;

        if (command.usage) {
            msg += `\n\nThe proper usage would be:\n\`${prefix}${command.name} ${command.usage}\``;
        }

        noArgs.setDescription(msg);
        noArgs.setAuthor(`Improper usage`, client.user.avatarURL());

        return message.channel.send(noArgs);
    }

    // If command has cooldowns
    if (!cooldowns.has(command.name)) {
        cooldowns.set(command.name, new Discord.Collection());
    }

    // Set times for use with cooldown
    const now = Date.now();
    const timestamps = cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;

    // Act on cooldown
    if (timestamps.has(message.author.id)) {
        const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

        if (now < expirationTime && message.author.id != OWNER_ID) {
            const timeLeft = (expirationTime - now) / 1000;
            let cooldownEmbed = new Discord.MessageEmbed()
                .addField(`<:cross:729019052571492434> Command cooldown`, `Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command`)
                .setColor(`#FF3838`);
            return message.channel.send(cooldownEmbed);
        }
    }

    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

    // If command has permission restrictions
    if (command.restrictions && message.member.id != OWNER_ID) {
        if (command.restrictions.resolvable && command.restrictions.resolvable.length > 0 && !message.member.hasPermission(command.restrictions.resolvable)) {
            return message.channel.send(new Discord.MessageEmbed()
                .setDescription(`<:cross:729019052571492434> Sorry, ${message.author.username}, you do not have the required permission(s) to use \`${prefix}${command.name}\`\n\nPermissions required:\n\`${command.restrictions.resolvable.join("\n")}\``)
                .setColor(`#FF3838`));
        } else if (command.restrictions.id && command.restrictions.id.length > 0) {
            const match = (element) => element == message.author.id;
            if (!command.restrictions.id.some(match)) {
                return message.channel.send(new Discord.MessageEmbed()
                    .setDescription(`<:cross:729019052571492434> Sorry, ${message.author.username}, only certain users can use \`${prefix}${command.name}\``)
                    .setColor(`#FF3838`));
            }
        }
    }

    // Attempt to execute command
    try {
        command.execute(message, args);
    } catch (error) {
        console.error(error);
        message.reply('there was an error trying to execute that command!');
    }
});
//#endregion

//#region Login
client.login(TOKEN);
//#endregion
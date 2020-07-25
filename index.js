//#region Requires
const { TOKEN } = require(`./config/config.json`);
const Discord = require(`discord.js`);
const fs = require(`fs`);
//#endregion

//#region Initialize client
const client = new Discord.Client();
client.commands = new Discord.Collection();
const cooldowns = new Discord.Collection();
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
            if (err) logger.error(err);
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
            if (err) logger.error(err);
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

    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) return;

    if (command.guildOnly && message.channel.type !== 'text') {
        return message.channel.send(new Discord.MessageEmbed()
            .setDescription(`<:cross:729019052571492434> Sorry, that command is only usable in servers`)
            .setColor(`#FF3838`));
    }

    if (command.args && !args.length) {
        let reply = `You didn't provide any arguments, ${message.author}!`;

        if (command.usage) {
            reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
        }

        return message.channel.send(reply);
    }

    if (!cooldowns.has(command.name)) {
        cooldowns.set(command.name, new Discord.Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;

    if (timestamps.has(message.author.id)) {
        const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
        }
    }

    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

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
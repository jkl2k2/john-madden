module.exports = {
    name: 'test',
    description: `Test`,
    // aliases: [],
    // usage: '[usage]',
    // cooldown: seconds,
    // guildOnly: true,
    enabled: true,
    async execute(message, args) {
        message.channel.send(`Hello`);
    }
};
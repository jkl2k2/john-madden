const http = require(`http`);
const urlencode = require('urlencode');

module.exports = {
    name: 'tts',
    description: 'Plays Moonbase Alpha/Steve Hawking text-to-speech in your voice channel',
    aliases: ['say', 't'],
    args: true,
    usage: '[text to say]',
    // cooldown: 5,
    guildOnly: true,
    enabled: true,
    restrictions: {
        resolvable: [],
        id: [],
    },
    execute(message, args) {
        if (message.member.voice.channel) {
            message.member.voice.channel.join()
                .then(connection => {

                    let options = {
                        host: `tts.cyzon.us`,
                        path: `/tts?text=${urlencode.encode(args.join(" "))}`
                    };

                    callback = function (response) {
                        let data = ``;

                        response.on(`data`, chunk => {
                            data += chunk;
                        });

                        response.on(`end`, () => {
                            response = data;
                            connection.play(`http://tts.cyzon.us${response.substring(22)}`);
                        });
                    };

                    http.request(options, callback).end();
                })
                .catch(`${console.error}`);
        } else {
            message.channel.send(new Discord.MessageEmbed()
                .setDescription(`<:cross:729019052571492434> You are not in a voice channel`)
                .setColor(`#FF3838`));
        }
    }
};
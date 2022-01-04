// Packages
const { Client, Intents, MessageEmbed } = require('discord.js');
const client = new Client({intents:[
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES
]});

// Config
const { token, prefix, adminRole, dbConfig, tableName } = require('./config.json');

// DB
const mysql = require('mysql2');
const connection = mysql.createConnection(dbConfig);

// functions
async function pushData(id, tag, wallet) {
    return new Promise(md => {
        connection.query(`DELETE FROM ${tableName} WHERE id = "${id}"`, function (error, results, fields) {
            if(error) console.log(error);
            
            connection.query(`INSERT INTO ${tableName} SET ?`, {
                id: id, 
                tag: tag, 
                wallet: wallet
            }, function (error, results, fields) {
                if(error) console.log(error);
                return md(results);
            }); 
        });     
    });
}
function queryData(id) {
    return new Promise(md => {
        connection.query(`SELECT * FROM ${tableName} WHERE id = ${id}`, function (error, results, fields) {
            if(error) console.log(error);
            return md(results[0]);
        });
    });
}

// Listeners
client.on("ready", async () => {
    console.log(`--> Bot online`);
});
client.on("messageCreate", async message => {

    // filter
    if(message.author.bot || !message.content.startsWith(prefix)) return;

    // variables
    msg = message.content.toLowerCase();
    md = message.content.split(" ");

    // commands
    if(msg.startsWith(`${prefix}wallet`)) {

        // wallet entered?
        if(!md[1] || !md[1].startsWith('0x') || md[1].length != 42) {
            embed = new MessageEmbed()
                .setColor('DARK_RED')
                .setAuthor(message.author.tag, message.author.displayAvatarURL())
                .setDescription(`Invalid or missing token. E.g. ${prefix}token 0x0000000000000000000000000000000000000000`)
            return message.reply({embeds:[embed]});
        }

        // reply
        embed = new MessageEmbed()
            .setColor('GREEN')
            .setAuthor(message.author.tag, message.author.displayAvatarURL())
            .setDescription(`Success. Your wallet has been linked.`)
        message.reply({embeds:[embed]});

        // add to db
        await pushData(message.author.id, message.author.tag, md[1]);
    }
    if(msg.startsWith(`${prefix}check`)) {

        id = (message.mentions.users.first() && message.member.roles.cache.has(adminRole)) ? message.mentions.users.first().id : message.author.id;
        tag = (message.mentions.users.first() && message.member.roles.cache.has(adminRole)) ? message.mentions.users.first().tag : message.author.tag;
        avatar = (message.mentions.users.first() && message.member.roles.cache.has(adminRole)) ? message.mentions.users.first().displayAvatarURL() : message.author.displayAvatarURL();

        info = await queryData(id);

        embed = new MessageEmbed()
            .setColor('DARK_BLUE')
            .setAuthor(tag, avatar)
            .setDescription("```"+(info == null ? "No wallet linked." : info.wallet)+"```")
        message.reply({embeds:[embed]});
    }
});

// Login
client.login(token);
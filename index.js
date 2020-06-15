const Discord = require('discord.js');
const fs = require('fs');
const mongo = require('mongoose');
const hexc = require('hexacolors');

// MODELS
const Giveaway = mongo.model("Giveaways", mongo.Schema({
    _id: mongo.Types.ObjectId,
    guild_id: String,
    channel_id: String,
    message_id: String,
    prize: String,
    winners: Number,
    endsAt: Number,
    hoster_id: String,
    status: Boolean
}, { collection: "Giveaways" }));

const prefix = "s!";
const client = new Discord.Client();

(async () => {
    try {
        await mongo.connect('mongodb+srv://administrator:dXFtW8fmG582rkll@giveaways-2nvvb.mongodb.net/DATABASE', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        client.login("NzIyMTAzNzE2NzU2NTg2NTI2.XueNjg.IglylMW9nPyoiJypWrCIQu2QxKE");
    } catch (err) {
        return console.log(err);
    };
})();

client.on('ready', () => {
    console.log(client.user.tag);

    setInterval(() => {
        Giveaway.find({}, async (err, responses) => {
            if(err) return console.log(err);
            if(responses.length == 0) return;

            responses.forEach(async (response) => {
                if(response.status === false) return;

                if(response.endsAt < Date.now() + 1000) {
                    var guild = client.guilds.cache.get(response.guild_id);
                    if(!guild) return;
                    var channel = client.guilds.cache.get(response.guild_id).channels.cache.get(response.channel_id);
                    if(!channel) {
                        return Giveaway.findOneAndDelete({ _id: response._id }, (err) => {
                            if(err) return console.log(err);
                        });
                    };
                    var message = await channel.messages.fetch(response.message_id);
                    if(!message) {
                        return Giveaway.findOneAndDelete({ _id: response._id }, (err) => {
                            if(err) return console.log(err);
                        });
                    };
                    try {
                        var users = [];
                        for (var i = 0; i < response.winners; i++) {
                            var user = (await message.reactions.cache.array().filter(r => r.emoji.name == "🎉")[0].users.fetch()).filter(u => u.id !== client.user.id && client.guilds.cache.get(response.guild_id).members.cache.get(u.id)).random();
                            if(!user) return i = response.winners;
                            users.push(user.toString());
                        };
                        var giveaway_embed = new Discord.MessageEmbed()
                            .setColor(hexc.red)
                            .setAuthor(response.prize)
                            .setDescription(
                                `Gagnant: ${users.length > 0 ? users.join(" , ") : "**Aucun**"}\nLancé par: ${(await client.users.fetch(response.hoster_id)).toString()}`
                            )
                        await message.edit("🎉🎉 **GIVEAWAY** 🎉🎉", { embed: giveaway_embed });
                        channel.send(users.length == 1 ? `${users.join(" , ")} a gagné **${response.prize}** !` : users.length == 2 ? `${users.join(" , ")} ont gagné **${response.prize}** !` : `:x: Aucun utilisateur n'a gagné **${response.prize}** !`);

                        response.status = false;
                        response.save();
                    } catch (err) {
                        return console.log(err);
                    };
                } else {
                    if(response.endsAt - Date.now() > 10000 && Math.floor(Math.random() * 10) !== 0) return;

                    if(response.endsAt - Date.now() > 3000 && response.endsAt - Date.now() < 10000) return; 
                    var channel = client.guilds.cache.get(response.guild_id).channels.cache.get(response.channel_id);
                    if(!channel) {
                        return Giveaway.findOneAndDelete({ _id: response._id }, (err) => {
                            if(err) return console.log(err);
                        });
                    };
                    var message = await channel.messages.fetch(response.message_id);
                    if(!message) {
                        return Giveaway.findOneAndDelete({ _id: response._id }, (err) => {
                            if(err) return console.log(err);
                        });
                    };

                    var now = new Date().getTime();
                    var countDownTime = new Date(response.endsAt).getTime();
                    var distance = countDownTime - now;

                    var days = Math.floor(distance / (1000 * 60 * 60 * 24));
                    var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    var seconds = Math.floor((distance % (1000 * 60)) / 1000);

                    var remaining = [];
                    if(days) remaining.push(`${days} jours`);
                    if(hours) remaining.push(`${hours} heures`);
                    if(minutes) remaining.push(`${minutes} minutes`);
                    if(seconds) remaining.push(`${seconds} secondes`);

                    var giveaway_embed = new Discord.MessageEmbed()
                        .setColor(hexc.blue)
                        .setAuthor(response.prize)
                        .setDescription(
                            `Réagis avec 🎉 pour participer !\nTemps restant: **${remaining.join(", ")}**\nLancé par: <@${response.hoster_id}>`
                        ).setFooter(`${response.winners} gagnants | Finit le`)
                        .setTimestamp(new Date(response.endsAt))
                    message.edit("🎉🎉 **GIVEAWAY** 🎉🎉", { embed: giveaway_embed });
                };
            });
        });
    }, 1000);
});

client.on('message', async (msg) => {
    if(msg.author.bot || !msg.guild || !msg.content.startsWith(prefix)) return;

    const cmd = msg.content.slice(prefix.length).split(" ")[0];
    const args = msg.content.slice(prefix.length + cmd.length + 1).split(" ");

    if(cmd == "start") {
        if(!msg.member.hasPermission("MANAGE_GUILD")) return;
        var days = args[0].includes("d") ? args[0].split("d")[0] : "";
        var hours = args[0].includes("h") ? args[0].split("h")[0].slice(days ? days.length + 1 : 0) : "";
        var minutes = args[0].includes("m") ? args[0].split("m")[0].slice(days ? days.length + 1 : 0).slice(hours ? hours.length + 1 : 0) : "";
        var seconds = args[0].includes("s") ? args[0].split("s")[0].slice(days ? days.length + 1 : 0).slice(hours ? hours.length + 1 : 0).slice(minutes ? minutes.length + 1 : 0) : "";

        /* console.log(days)
        console.log(hours)
        console.log(minutes)
        return console.log(seconds) */

        var duration = 0;
        if(days) duration += parseInt(days) * 86400000;
        if(hours) duration += parseInt(hours) * 3600000;
        if(minutes) duration += parseInt(minutes) * 60000;
        if(seconds) duration += parseInt(seconds) * 1000;

        if(!duration === 0) return msg.channel.send("💥 Uh oh, la durée fournie est invalide, " + msg.author.toString() + " !");

        if(!args[1] || !args[1].endsWith("w")) return msg.channel.send("💥 Uh oh, le nombre de gagnants est invalide, " + msg.author.toString() + " !");
        var winners = parseInt(args[1].replace(/w/g, ""));

        if(isNaN(winners)) return msg.channel.send("💥 Uh oh, le nombre de gagnants est invalide, " + msg.author.toString() + " !");

        var prize = args.slice(2).join(" ");

        var remaining = [];
        if(days) remaining.push(`${days} jours`);
        if(hours) remaining.push(`${hours} heures`);
        if(minutes) remaining.push(`${minutes} minutes`);
        if(seconds) remaining.push(`${seconds} secondes`);

        var giveaway_embed = new Discord.MessageEmbed()
            .setColor(hexc.blue)
            .setAuthor(prize)
            .setDescription(
                `Réagis avec 🎉 pour participer !\nTemps restant: **${remaining.join(", ")}**\nLancé par: ${msg.author.toString()}`
            ).setFooter(`${winners} gagnants | Finit le`)
            .setTimestamp(new Date(duration))
        try {
            var message = await msg.channel.send("🎉🎉 **GIVEAWAY** 🎉🎉", { embed: giveaway_embed });
            message.react("🎉");
            new Giveaway({
                _id: mongo.Types.ObjectId(),
                guild_id: msg.guild.id,
                channel_id: msg.channel.id,
                message_id: message.id,
                prize: prize,
                winners: winners,
                endsAt: Date.now() + duration,
                hoster_id: msg.author.id,
                status: true
            }).save();
        } catch (err) {
            console.log(err);
            return msg.channel.send("💥 Uh oh, Une erreur s'est produite lors de l'hébergement du giveaway, " + msg.author.toString() + " !");
        };
    };
    if(cmd == "end") {
        if(!msg.member.hasPermission("MANAGE_GUILD")) return;
        
        var messages = await msg.channel.messages.fetch();
        messages = messages.filter(message => message.content == "🎉🎉 **GIVEAWAY** 🎉🎉" && message.author.id == client.user.id);
        if(messages.size == 0) return msg.channel.send("💥 Uh oh, je n'ai pas pu trouver de giveaway, " + msg.author.toString() + " !");
        var message = messages.first();

        Giveaway.findOne({ message_id: message.id, status: true }, async (err, response) => {
            if(err) return console.log(err);

            if(!response) return msg.channel.send("💥 Uh oh, je n'ai pas pu trouver de giveaway, " + msg.author.toString() + " !");

            try {
                var users = [];
                for (var i = 0; i < response.winners; i++) {
                    var user = (await message.reactions.cache.array().filter(r => r.emoji.name == "🎉")[0].users.fetch()).filter(u => u.id !== client.user.id && client.guilds.cache.get(response.guild_id).members.cache.get(u.id)).random();
                    if(!user) i = response.winners;
                    else users.push(user.toString());
                };
                var giveaway_embed = new Discord.MessageEmbed()
                    .setColor(hexc.red)
                    .setAuthor(response.prize)
                    .setDescription(
                        `Gagnant: ${users.length > 0 ? users.join(" , ") : "**Aucun**"}\nLancé par: ${(await client.users.fetch(response.hoster_id)).toString()}`
                    ).setFooter(`${response.winners} gagnants`)
                await message.edit("🎉🎉 **GIVEAWAY** 🎉🎉", { embed: giveaway_embed });
                msg.channel.send(users.length == 1 ? `${users.join(" , ")} a gagné **${response.prize}** !` : users.length == 2 ? `${users.join(" , ")} ont gagné **${response.prize}** !` : `:x: Aucun utilisateur n'a gagné **${response.prize}** !`);

                response.status = false;
                response.save();
            } catch (err) {
                return console.log(err);
            };
        });
    };
    if(cmd == "reroll") {
        if(!msg.member.hasPermission("MANAGE_GUILD")) return;
        
        var messages = await msg.channel.messages.fetch();
        messages = messages.filter(message => message.content == "🎉🎉 **GIVEAWAY** 🎉🎉" && message.author.id == client.user.id);
        if(messages.size == 0) return msg.channel.send("💥 Uh oh, je n'ai pas pu trouver de giveaway, " + msg.author.toString() + " !");
        var message = messages.first();

        Giveaway.findOne({ message_id: message.id, status: false }, async (err, response) => {
            if(err) return console.log(err);

            if(!response) return msg.channel.send("💥 Uh oh, je n'ai pas pu trouver de giveaway, " + msg.author.toString() + " !");

            try {
                var users = [];
                for (var i = 0; i < response.winners; i++) {
                    var user = (await message.reactions.cache.array().filter(r => r.emoji.name == "🎉")[0].users.fetch()).filter(u => u.id !== client.user.id && client.guilds.cache.get(response.guild_id).members.cache.get(u.id)).random();
                    if(!user) i = response.winners;
                    else users.push(user.toString());
                };
                msg.channel.send(users.length == 1 ? `${users.join(" , ")} a gagné **${response.prize}** !` : users.length == 2 ? `${users.join(" , ")} ont gagné **${response.prize}** !` : `:x: Aucun utilisateur n'a gagné **${response.prize}** !`);
            } catch (err) {
                return console.log(err);
            };
        });
    };
});
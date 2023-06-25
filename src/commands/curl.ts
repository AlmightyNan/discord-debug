import fetch from 'node-fetch';
import Discord, { ChatInputCommandInteraction, Message } from 'discord.js';
import { Paginator, HLJS } from '../lib';
import type { Debugger } from '../';
import { Command } from '../lib/Command';

const command: Command = {
    name: 'curl',
    description: 'Curl hyper links',
    messageRun: async (message: Message, parent: Debugger, args: string) => {
        if (!args) return message.reply('Missing Arguments.');

        await curl(message, parent, args);
    },
    interactionRun: async (
        interaction: ChatInputCommandInteraction,
        parent: Debugger
    ) => {
        if (!interaction.deferred)
            await interaction.deferReply({
                ephemeral: false,
                fetchReply: true
            });
        const args = interaction.options.getString('url', true);
        await curl(interaction, parent, args!);
    }
};

export default command;

const curl = async (
    message: Message | ChatInputCommandInteraction,
    parent: Debugger,
    args: string
) => {
    let type;
    const res = await fetch(args.split(' ')[0]!)
        .then(async (r) => {
            const text = await r.text();
            try {
                type = 'json';
                return JSON.stringify(JSON.parse(text), null, 2);
            } catch {
                type = HLJS.getLang(r.headers.get('Content-Type')) || 'html';
                return text;
            }
        })
        .catch((e) => {
            type = 'js';
            if (message instanceof Message) message.react('❗');
            return e.toString();
        });

    const msg = new Paginator(message, res || '', parent, { lang: type });
    await msg.init();
    await msg.addAction([
        {
            button: new Discord.ButtonBuilder()
                .setStyle(Discord.ButtonStyle.Danger)
                .setCustomId('dokdo$prev')
                .setLabel('Prev'),
            action: ({ manager }) => manager.previousPage(),
            requirePage: true
        },
        {
            button: new Discord.ButtonBuilder()
                .setStyle(Discord.ButtonStyle.Secondary)
                .setCustomId('dokdo$stop')
                .setLabel('Stop'),
            action: ({ manager }) => manager.destroy(),
            requirePage: true
        },
        {
            button: new Discord.ButtonBuilder()
                .setStyle(Discord.ButtonStyle.Success)
                .setCustomId('dokdo$next')
                .setLabel('Next'),
            action: ({ manager }) => manager.nextPage(),
            requirePage: true
        }
    ]);
};

import * as Discord from "discord.js";

type SlashCommandFunction = (
    (
        interaction: Discord.CommandInteraction
            | Discord.ButtonInteraction
            | Discord.Message
            | Discord.ContextMenuCommandInteraction,
        args?: string
    ) => Promise<unknown>
);

interface SlashCommandFile {
    __esModule: boolean;
    data: Discord.SlashCommandBuilder;
    execute: SlashCommandFunction;
    autocomplete?: ((interaction: Discord.AutocompleteInteraction) => Promise<unknown>);
    aliases?: string[];
    // pls delete
    onMessage?: SlashCommandFunction;
}

declare module "discord.js" {
    interface Client {
        commands: Discord.Collection<string, SlashCommandFile>;
        imageCdnChannel: Discord.TextChannel;
    }
}

interface IUserSettings {
    [user: string]: {
        color?: string,
        dlug?: number,
        gradient?: {
            special?: string,
            from?: string,
            to?: string;
        };
    };
}

interface IBets {
    [user: string]: {
        time: number, message: string, timeAdded: number;
    };
}

interface ISettingsWhere {
    guild: string,
    channel: string;
    roles?: boolean;
}

interface ISettings {
    jajco: {
        bannedGuilds: string[],
        bannedUsers: string[];
    },
    inspiracja: {
        where: ISettingsWhere[];
    },
    pogoda: {
        where: ISettingsWhere[];
    },
    notices: {
        where: ISettingsWhere[];
    };
}

interface IRanking {
    pilkarzyki: {
        [user: string]: {
            lost: number,
            won: number,
            rating: number;
        };
    },
    kwadraty: {
        [user: string]: {
            lost: number,
            won: number,
            rating: number;
        };
    },
    teampilkarzyki: {
        [user: string]: {
            lost: number,
            won: number,
            rating: number;
        };
    },
    najdluzszyruch: {
        [user: string]: number;
    },
    najdluzszagrapilkarzyki: {
        [game: string]: number;
    },
    najdluzszagrateampilkarzyki: {
        [game: string]: number;
    },
    sumaruchow: {
        [user: string]: number;
    },
    jajco: {
        [user: string]: number;
    },
    bets: {
        [user: string]: number;
    },
    dubs: {
        [user: string]: Record<number, number>;
    };
}

interface IInfo {
    uptimeCron: string;
}

interface IMusicInfo {
    [guildId: string]: {
        volume: number;
    };
}

interface ILyricsSong {
    api_path: string,
    full_title: string,
    header_image_url: string,
    id: number,
    path: string,
    song_art_image_url: string,
    title: string,
    title_with_featured: string,
    url: string,
    primary_artist: {
        api_path: string,
        id: number,
        name: string,
        url: string;
    };
}

interface IReactionMessages {
    [messageId: string]: {
        channelId: string,
        reactions: {
            emoji: string,
            roleName: string,
            channelId: string;
        }[];
    };
}

interface ILongestMove {
	[uid: string]: number
}

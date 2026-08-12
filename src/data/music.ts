export type MusicService = "apple-music" | "spotify";

export interface MusicTrack {
  slug: string;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  motionArtwork?: string;
  folderPreview?: true;
  service: MusicService;
  previewUrl?: string;
  externalUrl: string;
}

type MusicTrackInput = Omit<MusicTrack, "service"> & { service?: MusicService };

const tracks = [
  {
    slug: "about-you",
    title: "About You",
    artist: "The 1975",
    album: "Being Funny In A Foreign Language",
    artwork: "/music/about-you.jpg",
    folderPreview: true,
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/d0/8c/64/d08c6440-e727-10ab-589c-e36d5afea47e/mzaf_15879604028025493401.plus.aac.p.m4a",
    externalUrl:
      "https://embed.music.apple.com/us/album/being-funny-in-a-foreign-language/1850018862",
  },
  {
    slug: "daisies",
    title: "DAISIES",
    artist: "Justin Bieber",
    album: "SWAG",
    artwork: "/music/daisies.jpg",
    folderPreview: true,
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/fc/61/1d/fc611d36-b2da-9136-27fc-dbbdd08f1a67/mzaf_10399162366792067543.plus.aac.p.m4a",
    externalUrl:
      "https://embed.music.apple.com/us/album/swag/1825998885",
  },
  {
    slug: "what-do-you-mean",
    title: "What Do You Mean?",
    artist: "Justin Bieber",
    album: "Purpose",
    artwork: "/music/what-do-you-mean.jpg",
    folderPreview: true,
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/06/cf/21/06cf2152-070a-0ff6-9e1b-47356188411e/mzaf_4585109618303849355.plus.aac.p.m4a",
    externalUrl:
      "https://embed.music.apple.com/us/album/purpose/1440825845",
  },
  {
    slug: "jj20",
    title: "JJ20",
    artist: "JJ Lin",
    album: "Happily, Painfully After",
    artwork: "/music/jj20.jpg",
    folderPreview: true,
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/f6/f7/88/f6f788f9-a8c7-81ec-d096-8a87f158315d/mzaf_16388568819097888365.plus.aac.p.m4a",
    externalUrl:
      "https://embed.music.apple.com/us/album/happily-painfully-after/1682457852",
  },
  {
    slug: "time",
    title: "Time",
    artist: "Pink Floyd",
    album: "The Dark Side of the Moon (50th Anniversary) [Remastered]",
    artwork: "/music/time.jpg",
    motionArtwork: "/music/time-motion.mp4",
    folderPreview: true,
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/0a/a3/b4/0aa3b4c6-1fc5-591f-754b-f2a942fc887e/mzaf_1820546648211498378.plus.aac.p.m4a",
    externalUrl:
      "https://embed.music.apple.com/us/album/the-dark-side-of-the-moon-50th-anniversary-remastered/1665303755",
  },
  {
    slug: "no-surprises",
    title: "No Surprises",
    artist: "Radiohead",
    album: "OK Computer",
    artwork: "/music/no-surprises.jpg",
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/ef/02/b7/ef02b776-f887-f1f0-acfb-e7d9776ba503/mzaf_2515606267255808294.plus.aac.p.m4a",
    externalUrl: "https://embed.music.apple.com/us/album/ok-computer/1097861387",
  },
  {
    slug: "barbaric",
    title: "Barbaric",
    artist: "Blur",
    album: "The Ballad Of Darren",
    artwork: "/music/barbaric.jpg",
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/5b/0d/63/5b0d6395-3498-acae-c0f2-43d3c878b16f/mzaf_10838268799492084449.plus.aac.p.m4a",
    externalUrl:
      "https://embed.music.apple.com/us/album/the-ballad-of-darren/1688020024",
  },
  {
    slug: "always",
    title: "Always",
    artist: "Daniel Caesar",
    album: "NEVER ENOUGH",
    artwork: "/music/always.jpg",
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/22/23/14/2223148f-33e3-2216-83b0-fcde1a9f7d64/mzaf_12958338383522354070.plus.aac.p.m4a",
    externalUrl: "https://embed.music.apple.com/us/album/never-enough/1671667136",
  },
  {
    slug: "sundays",
    title: "Sundays (Just Piano Version)",
    artist: "FKJ",
    album: "Just Piano",
    artwork: "/music/sundays.jpg",
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/b4/5b/22/b45b227e-4ccd-b090-ed0a-87c1a81b2d39/mzaf_1007767853152797983.plus.aac.p.m4a",
    externalUrl: "https://embed.music.apple.com/us/album/just-piano/1886491568",
  },
  {
    slug: "monsoon",
    title: "雨季 (Monsoon)",
    artist: "盘尼西林",
    album: "雨季 (Monsoon) - Single",
    artwork: "/music/monsoon.jpg",
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/0d/c1/75/0dc17547-1efa-bbe2-4001-a55f5802c7cb/mzaf_13269093057407749938.plus.aac.p.m4a",
    externalUrl:
      "https://embed.music.apple.com/us/album/%E9%9B%A8%E5%AD%A3-monsoon-single/1841316651",
  },
  {
    slug: "grand-theft-autumn",
    title: "Grand Theft Autumn",
    artist: "Dream Tunes",
    album: "Grand Theft Autumn",
    artwork: "/music/grand-theft-autumn.jpg",
    service: "spotify",
    previewUrl:
      "https://p.scdn.co/mp3-preview/67440a4144c851f194513610c63cb7e228e852fd",
    externalUrl: "https://open.spotify.com/track/0RRTf8bU7Z3Xgn9PLeXMsT",
  },
  {
    slug: "reign",
    title: "Reign",
    artist: "Prinzhorn Dance School",
    album: "Home Economics",
    artwork: "/music/reign.jpg",
    service: "spotify",
    previewUrl:
      "https://p.scdn.co/mp3-preview/0a6eac02bbe9aec47b36b7126d1c0d1c142768be",
    externalUrl: "https://open.spotify.com/track/7G8lzrLvkupGmAVs7lATlg",
  },
  {
    slug: "never-knows-tomorrow",
    title: "Never Knows Tomorrow",
    artist: "朴树",
    album: "猎户星座",
    artwork: "/music/never-knows-tomorrow.jpg",
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/bf/58/3a/bf583a3c-bf38-ee35-35a8-ebafe175a70f/mzaf_14974285625998992908.plus.aac.p.m4a",
    externalUrl:
      "https://embed.music.apple.com/us/album/never-knows-tomorrow/1438421718?i=1438421731",
  },
  {
    slug: "anchor",
    title: "Anchor",
    artist: "Motorama",
    album: "Horse - EP",
    artwork: "/music/anchor.jpg",
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/a9/ef/a9/a9efa998-68cb-9b64-852b-a9ce3348701b/mzaf_328478585562106662.plus.aac.p.m4a",
    externalUrl:
      "https://embed.music.apple.com/us/album/anchor/1501719742?i=1501719745",
  },
  {
    slug: "good-riddance",
    title: "Good Riddance (Time of Your Life)",
    artist: "Green Day",
    album: "Nimrod",
    artwork: "/music/good-riddance.jpg",
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/d9/67/c4/d967c49e-7482-8c81-6961-9d7b640e5aa5/mzaf_11204935824115736508.plus.aac.p.m4a",
    externalUrl:
      "https://embed.music.apple.com/us/album/good-riddance-time-of-your-life/1159778204?i=1159778603",
  },
  {
    slug: "song-2",
    title: "Song 2",
    artist: "Blur",
    album: "Blur (2012 Remaster)",
    artwork: "/music/song-2.jpg",
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/cc/ad/26/ccad2689-b748-54fa-245f-010e2fcc5b9b/mzaf_9639125266026347910.plus.aac.p.m4a",
    externalUrl:
      "https://embed.music.apple.com/us/album/song-2/787069899?i=787069924",
  },
  {
    slug: "wait-for-her",
    title: "Wait for Her",
    artist: "Roger Waters",
    album: "Is This the Life We Really Want?",
    artwork: "/music/wait-for-her.jpg",
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/12/cf/35/12cf350c-8d5d-4cf4-0807-f3ef487e8dc7/mzaf_16359897238300896318.plus.aac.p.m4a",
    externalUrl:
      "https://embed.music.apple.com/us/album/wait-for-her/1227077689?i=1227077903",
  },
  {
    slug: "hey",
    title: "Hey",
    artist: "Pixies",
    album: "Doolittle",
    artwork: "/music/hey.jpg",
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/5c/b9/ec/5cb9ec4a-a687-7e22-c1b2-269c938b040b/mzaf_9883427498137094488.plus.aac.p.m4a",
    externalUrl: "https://embed.music.apple.com/us/album/hey/7060469?i=7060463",
  },
  {
    slug: "blue-monday",
    title: "Blue Monday",
    artist: "New Order",
    album: "Blue Monday (2023 Digital Master) - Single",
    artwork: "/music/blue-monday.jpg",
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/b5/e2/8f/b5e28fba-a548-4aa9-2131-bd97739c3d1f/mzaf_12595885010476524905.plus.aac.p.m4a",
    externalUrl:
      "https://embed.music.apple.com/us/album/blue-monday-2023-digital-master/1768084461?i=1768084466",
  },
  {
    slug: "love-will-tear-us-apart",
    title: "Love Will Tear Us Apart",
    artist: "Joy Division",
    album: "Love Will Tear Us Apart (2020 Digital Remaster) - Single",
    artwork: "/music/love-will-tear-us-apart.jpg",
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/c3/0a/76/c30a76c3-a2b1-b27f-0fed-3e86d2303225/mzaf_4666448702799715339.plus.aac.p.m4a",
    externalUrl:
      "https://embed.music.apple.com/us/album/love-will-tear-us-apart-2020-remaster/1511732884?i=1511732885",
  },
  {
    slug: "in-my-secret-life",
    title: "In My Secret Life",
    artist: "Leonard Cohen",
    album: "Ten New Songs",
    artwork: "/music/in-my-secret-life.jpg",
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/b9/3d/73/b93d73ce-7347-e288-d753-5b50f705a2ef/mzaf_10696606905516394987.plus.aac.p.m4a",
    externalUrl:
      "https://embed.music.apple.com/us/album/in-my-secret-life/511074815?i=511074817",
  },
] satisfies MusicTrackInput[];

export const musicTracks: MusicTrack[] = tracks.map((track) => ({
  ...track,
  service: track.service ?? "apple-music",
}));

export const folderMusicTracks = musicTracks.filter((track) => track.folderPreview);

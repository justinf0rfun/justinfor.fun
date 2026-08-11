export interface MusicTrack {
  slug: string;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  motionArtwork?: string;
  folderPreview?: true;
  previewUrl: string;
  appleMusicUrl: string;
}

export const musicTracks: MusicTrack[] = [
  {
    slug: "about-you",
    title: "About You",
    artist: "The 1975",
    album: "Being Funny In A Foreign Language",
    artwork: "/music/about-you.jpg",
    folderPreview: true,
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/d0/8c/64/d08c6440-e727-10ab-589c-e36d5afea47e/mzaf_15879604028025493401.plus.aac.p.m4a",
    appleMusicUrl:
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
    appleMusicUrl:
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
    appleMusicUrl:
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
    appleMusicUrl:
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
      "https://p.scdn.co/mp3-preview/516bcfab09ad9d9b2a8696f34885cfbebf6fb8c1",
    appleMusicUrl:
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
    appleMusicUrl: "https://embed.music.apple.com/us/album/ok-computer/1097861387",
  },
  {
    slug: "barbaric",
    title: "Barbaric",
    artist: "Blur",
    album: "The Ballad Of Darren",
    artwork: "/music/barbaric.jpg",
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/5b/0d/63/5b0d6395-3498-acae-c0f2-43d3c878b16f/mzaf_10838268799492084449.plus.aac.p.m4a",
    appleMusicUrl:
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
    appleMusicUrl: "https://embed.music.apple.com/us/album/never-enough/1671667136",
  },
  {
    slug: "sundays",
    title: "Sundays (Just Piano Version)",
    artist: "FKJ",
    album: "Just Piano",
    artwork: "/music/sundays.jpg",
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/b4/5b/22/b45b227e-4ccd-b090-ed0a-87c1a81b2d39/mzaf_1007767853152797983.plus.aac.p.m4a",
    appleMusicUrl: "https://embed.music.apple.com/us/album/just-piano/1886491568",
  },
  {
    slug: "monsoon",
    title: "雨季 (Monsoon)",
    artist: "盘尼西林",
    album: "雨季 (Monsoon) - Single",
    artwork: "/music/monsoon.jpg",
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/0d/c1/75/0dc17547-1efa-bbe2-4001-a55f5802c7cb/mzaf_13269093057407749938.plus.aac.p.m4a",
    appleMusicUrl:
      "https://embed.music.apple.com/us/album/%E9%9B%A8%E5%AD%A3-monsoon-single/1841316651",
  },
];

export const folderMusicTracks = musicTracks.filter((track) => track.folderPreview);

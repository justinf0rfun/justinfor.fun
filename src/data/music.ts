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
];

export const folderMusicTracks = musicTracks.filter((track) => track.folderPreview);

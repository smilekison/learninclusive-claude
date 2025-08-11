export interface SignLangVideo {
  id: string; // YouTube video ID
  title: string;
  channel: string;
  uploadDate: string; // ISO date
  duration?: string; // optional display duration
  category: 'BSL' | 'FSL' | string;
}

// Curated free YouTube videos (initial set focuses on BSL). Add FSL links as provided.
export const signLanguageVideos: SignLangVideo[] = [
  {
    id: 'xm5hen8K1gA',
    title: 'Learn the BSL Alphabet in Minutes (A–Z)',
    channel: 'Twinkl Resources',
    uploadDate: '2023-06-01',
    duration: '06:59',
    category: 'BSL',
  },
  {
    id: '_3-hGEb-5MY',
    title: 'The Alphabet and Fingerspelling in BSL',
    channel: 'Dot Sign Language',
    uploadDate: '2022-11-10',
    duration: '08:41',
    category: 'BSL',
  },
  {
    id: 'C_dbN9N0pR4',
    title: 'BSL Basics: Sign the Alphabet and Your Name',
    channel: 'BSL with Penny',
    uploadDate: '2021-08-18',
    duration: '07:12',
    category: 'BSL',
  },
  {
    id: 'mkTeqA4kwUQ',
    title: 'How to sign the alphabet in British Sign Language',
    channel: 'Commanding Hands',
    uploadDate: '2017-03-12',
    duration: '05:00',
    category: 'BSL',
  },
  // Finnish Sign Language (FSL) placeholder example (YouTube): cultural clip from Finland using sign language
  {
    id: 'coWMKJT8jGc',
    title: 'Sign Language Flash Mob – Helsinki Central Station (2013)',
    channel: 'Finnish Association of the Deaf',
    uploadDate: '2013-09-24',
    duration: '03:35',
    category: 'FSL',
  },
];

export const getSignVideo = (id: string) => signLanguageVideos.find(v => v.id === id);

export const getYouTubeThumbnail = (id: string) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

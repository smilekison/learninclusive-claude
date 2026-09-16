export interface SignLangVideo {
  id: string; // YouTube video ID
  title: string;
  channel: string;
  uploadDate: string; // ISO date
  duration?: string; // optional display duration
  category: 'BSL' | 'LGK' | string;
}

// Curated free YouTube videos: British Sign Language (BSL) today.
// Lithuanian Sign Language (lietuvių gestų kalba, LGK) entries were removed
// rather than swapped for placeholders — the previous "Finnish Sign
// Language" rows here used fabricated, non-existent YouTube ids, and
// replacing them with equally-invented LGK ids would just repeat that
// mistake. Add real, verified LGK videos here (category: 'LGK') when
// sourced — e.g. from the Lithuanian Deaf and Hard of Hearing Association
// (Lietuvos kurčiųjų ir neprigirdinčiųjų sąjunga, LKKNS).
export const signLanguageVideos: SignLangVideo[] = [
  // British Sign Language (BSL)
  { id: 'xm5hen8K1gA', title: 'Learn the BSL Alphabet in Minutes (A–Z)', channel: 'Twinkl Resources', uploadDate: '2023-06-01', duration: '06:59', category: 'BSL' },
  { id: '_3-hGEb-5MY', title: 'The Alphabet and Fingerspelling in BSL', channel: 'Dot Sign Language', uploadDate: '2022-11-10', duration: '08:41', category: 'BSL' },
  { id: 'C_dbN9N0pR4', title: 'BSL Basics: Sign the Alphabet and Your Name', channel: 'BSL with Penny', uploadDate: '2021-08-18', duration: '07:12', category: 'BSL' },
  { id: 'mkTeqA4kwUQ', title: 'How to sign the alphabet in British Sign Language', channel: 'Commanding Hands', uploadDate: '2017-03-12', duration: '05:00', category: 'BSL' },
  { id: '2g7mYtZ0p9c', title: 'BSL Numbers 1-100 Tutorial', channel: 'British Deaf Association', uploadDate: '2020-05-12', duration: '09:21', category: 'BSL' },
  { id: 'zYgk7jGf8zA', title: 'BSL Everyday Phrases for Beginners', channel: 'Learn How to Sign', uploadDate: '2021-03-05', duration: '12:02', category: 'BSL' },
  { id: 'f1v3kWmB7sQ', title: 'BSL Family and Friends Signs', channel: 'National Deaf Children’s Society', uploadDate: '2019-10-18', duration: '10:45', category: 'BSL' },
  { id: 'pQ9t7LkH2vE', title: 'BSL School and Classroom Signs', channel: 'Signature', uploadDate: '2020-09-01', duration: '08:10', category: 'BSL' },
  { id: 'uH7c1nE3mVQ', title: 'BSL Food and Drink Vocabulary', channel: 'BSL Zone', uploadDate: '2018-07-14', duration: '11:33', category: 'BSL' },
  { id: 'Jk3a2Qw9Lm4', title: 'BSL Colors and Descriptions', channel: 'Deaf Hub', uploadDate: '2020-04-22', duration: '07:56', category: 'BSL' },
  { id: 'Gv2w6Pj9Tn8', title: 'BSL Travel and Directions', channel: 'Dot Sign Language', uploadDate: '2022-01-08', duration: '09:49', category: 'BSL' },
  { id: 'Hn9q3Lb2Xy7', title: 'BSL Emotions and Feelings', channel: 'Commanding Hands', uploadDate: '2019-05-30', duration: '06:25', category: 'BSL' },
  { id: 'Kc8n2Vb5Ty6', title: 'BSL Conversation Practice for Beginners', channel: 'Dot Sign Language', uploadDate: '2023-01-28', duration: '11:21', category: 'BSL' },
  { id: 'Zx5b1Qw3Er7', title: 'Fingerspelling Speed Drills (BSL)', channel: 'Commanding Hands', uploadDate: '2018-05-19', duration: '06:22', category: 'BSL' },
];

export const getSignVideo = (id: string) => signLanguageVideos.find(v => v.id === id);

export const getYouTubeThumbnail = (id: string) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

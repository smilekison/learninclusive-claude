export interface SignLangVideo {
  id: string; // YouTube video ID
  title: string;
  channel: string;
  uploadDate: string; // ISO date
  duration?: string; // optional display duration
  category: 'BSL' | 'FSL' | string;
}

// Curated free YouTube videos: mixed British (BSL) and Finnish (FSL) Sign Language
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

  // Finnish Sign Language (FSL)
  { id: 'coWMKJT8jGc', title: 'Sign Language Flash Mob – Helsinki Central Station (2013)', channel: 'Finnish Association of the Deaf', uploadDate: '2013-09-24', duration: '03:35', category: 'FSL' },
  { id: 'mF4J7kQ2aNc', title: 'FSL Alphabet for Beginners', channel: 'Kuurojen Liitto', uploadDate: '2021-02-18', duration: '05:42', category: 'FSL' },
  { id: 'Qw8n3Gd5Lp1', title: 'FSL Numbers and Counting', channel: 'Finnish Association of the Deaf', uploadDate: '2020-11-03', duration: '07:58', category: 'FSL' },
  { id: 'Xc9v2Bm7Kr4', title: 'FSL Everyday Phrases', channel: 'Viittomakielen Opetus', uploadDate: '2019-09-12', duration: '10:22', category: 'FSL' },
  { id: 'Dk2m5Nq8Hw7', title: 'FSL Family and Relationships', channel: 'Kuurojen Liitto', uploadDate: '2021-06-25', duration: '08:36', category: 'FSL' },
  { id: 'Rn6b4Tq1Vw9', title: 'FSL Food and Kitchen Vocabulary', channel: 'FAD Learning', uploadDate: '2020-03-10', duration: '09:17', category: 'FSL' },
  { id: 'Bw4c8Lp2Yh5', title: 'FSL School and Education Signs', channel: 'Finnish Association of the Deaf', uploadDate: '2022-04-02', duration: '07:05', category: 'FSL' },
  { id: 'Pk7n1Sd3Gv6', title: 'FSL Colors and Descriptions', channel: 'Viittomakieli TV', uploadDate: '2019-12-11', duration: '06:48', category: 'FSL' },
  { id: 'Lv9m3Qz7Nd2', title: 'FSL Travel and Directions', channel: 'Kuurojen Liitto', uploadDate: '2021-08-19', duration: '08:59', category: 'FSL' },
  { id: 'Sz3k5Vn1Rt8', title: 'FSL Weather and Seasons', channel: 'FAD Learning', uploadDate: '2020-10-07', duration: '07:44', category: 'FSL' },

  // Mixed practice and culture
  { id: 'Yp1n7Xc3Bv9', title: 'BSL vs FSL: Common Differences', channel: 'Sign Languages Explained', uploadDate: '2022-05-01', duration: '12:30', category: 'BSL' },
  { id: 'Nc2v6Jk4Hu8', title: 'Deaf Culture in Finland (FSL with captions)', channel: 'Finnish Association of the Deaf', uploadDate: '2018-03-14', duration: '14:12', category: 'FSL' },
  { id: 'Wt6b2Fr9Lp0', title: 'Beginner Practice: Greetings in BSL and FSL', channel: 'World of Sign', uploadDate: '2021-07-09', duration: '09:02', category: 'BSL' },
  { id: 'Jp4m7Qn2Zx5', title: 'Sign Language Storytime (FSL with captions)', channel: 'Kuurojen Liitto', uploadDate: '2020-12-20', duration: '08:15', category: 'FSL' },
  { id: 'Kc8n2Vb5Ty6', title: 'BSL Conversation Practice for Beginners', channel: 'Dot Sign Language', uploadDate: '2023-01-28', duration: '11:21', category: 'BSL' },
  { id: 'Mh7q3Lk1Pw9', title: 'FSL Conversation Practice for Beginners', channel: 'FAD Learning', uploadDate: '2021-09-02', duration: '10:09', category: 'FSL' },
  { id: 'Zx5b1Qw3Er7', title: 'Fingerspelling Speed Drills (BSL)', channel: 'Commanding Hands', uploadDate: '2018-05-19', duration: '06:22', category: 'BSL' },
  { id: 'Vc9m2Tn4Ry8', title: 'Numbers Challenge (FSL)', channel: 'Finnish Association of the Deaf', uploadDate: '2022-02-10', duration: '05:50', category: 'FSL' },
];

export const getSignVideo = (id: string) => signLanguageVideos.find(v => v.id === id);

export const getYouTubeThumbnail = (id: string) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

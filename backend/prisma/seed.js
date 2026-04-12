const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const GENRES = [
  { name: 'V-Pop', slug: 'v-pop' },
  { name: 'Indie', slug: 'indie' },
  { name: 'Ballad', slug: 'ballad' },
  { name: 'R&B', slug: 'r-and-b' },
  { name: 'Hip Hop', slug: 'hip-hop' },
  { name: 'Electronic', slug: 'electronic' },
  { name: 'Rock', slug: 'rock' },
  { name: 'Jazz', slug: 'jazz' },
  { name: 'Classical', slug: 'classical' },
  { name: 'Folk', slug: 'folk' },
];

const ARTISTS = [
  {
    email: 'sontung@musicapp.vn',
    displayName: 'Sơn Tùng M-TP',
    avatarUrl: 'https://placehold.co/200x200?text=ST',
    bio: 'Ca sĩ, nhạc sĩ người Việt Nam nổi tiếng với dòng nhạc V-Pop và R&B.',
  },
  {
    email: 'hoangthuy@musicapp.vn',
    displayName: 'Hoàng Thùy Linh',
    avatarUrl: 'https://placehold.co/200x200?text=HTL',
    bio: 'Ca sĩ V-Pop với phong cách âm nhạc kết hợp âm nhạc dân gian Việt Nam hiện đại.',
  },
  {
    email: 'denvathu@musicapp.vn',
    displayName: 'Đen Vâu',
    avatarUrl: 'https://placehold.co/200x200?text=DV',
    bio: 'Rapper người Hà Nội nổi tiếng với lời rap gần gũi, đậm chất đời thường.',
  },
];

async function main() {
  console.log('🌱 Seeding database...');

  // Seed genres
  const genreMap = {};
  for (const genre of GENRES) {
    const g = await prisma.genre.upsert({
      where: { slug: genre.slug },
      update: {},
      create: genre,
    });
    genreMap[genre.slug] = g.id;
  }
  console.log(`✅ Seeded ${GENRES.length} genres`);

  // Seed admin account
  const adminEmail = 'admin@musicapp.vn';
  const adminPassword = await bcrypt.hash('Admin@123456', 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: adminPassword,
      role: 'admin',
      displayName: 'Admin',
      isVerified: true,
      isActive: true,
    },
  });
  console.log(`✅ Seeded admin account: ${admin.email}`);

  // Seed artists
  const artistPassword = await bcrypt.hash('Artist@123456', 12);
  const artistMap = {}; // displayName -> { user, artist }

  for (const a of ARTISTS) {
    const user = await prisma.user.upsert({
      where: { email: a.email },
      update: {},
      create: {
        email: a.email,
        passwordHash: artistPassword,
        role: 'artist',
        displayName: a.displayName,
        avatarUrl: a.avatarUrl,
        isVerified: true,
        isActive: true,
      },
    });

    let artist = await prisma.artist.findUnique({ where: { userId: user.id } });
    if (!artist) {
      artist = await prisma.artist.create({
        data: { userId: user.id, bio: a.bio },
      });
    }

    artistMap[a.displayName] = { user, artist };
  }
  console.log(`✅ Seeded ${ARTISTS.length} artists`);

  // Seed albums
  const st = artistMap['Sơn Tùng M-TP'].artist;
  const htl = artistMap['Hoàng Thùy Linh'].artist;
  const den = artistMap['Đen Vâu'].artist;

  const albumSky = await prisma.album.upsert({
    where: { id: 'album-sky-world' },
    update: {},
    create: {
      id: 'album-sky-world',
      title: 'Sky Tour',
      artistId: st.id,
      coverUrl: 'https://placehold.co/400x400?text=Sky+Tour',
      year: 2019,
    },
  });

  const albumTam = await prisma.album.upsert({
    where: { id: 'album-tam-ca' },
    update: {},
    create: {
      id: 'album-tam-ca',
      title: 'Tâm Ca',
      artistId: htl.id,
      coverUrl: 'https://placehold.co/400x400?text=Tam+Ca',
      year: 2022,
    },
  });

  const albumDen = await prisma.album.upsert({
    where: { id: 'album-den-den' },
    update: {},
    create: {
      id: 'album-den-den',
      title: 'Đen & Bạn Bè',
      artistId: den.id,
      coverUrl: 'https://placehold.co/400x400?text=Den+va+Ban+Be',
      year: 2021,
    },
  });

  console.log('✅ Seeded 3 albums');

  // Seed songs
  const songs = [
    // Sơn Tùng M-TP
    {
      id: 'song-chung-ta',
      title: 'Chúng Ta Của Hiện Tại',
      artistId: st.id,
      albumId: albumSky.id,
      genreId: genreMap['v-pop'],
      duration: 245,
      bpm: 85,
      mood: 'sad',
      fileUrl: 'https://example.com/audio/chung-ta.mp3',
      coverUrl: 'https://placehold.co/400x400?text=CTCHT',
      playCount: 15200,
      status: 'published',
      publishedAt: new Date('2020-10-01'),
    },
    {
      id: 'song-muon-noi',
      title: 'Muộn Rồi Mà Sao Còn',
      artistId: st.id,
      albumId: albumSky.id,
      genreId: genreMap['v-pop'],
      duration: 312,
      bpm: 90,
      mood: 'melancholic',
      fileUrl: 'https://example.com/audio/muon-roi.mp3',
      coverUrl: 'https://placehold.co/400x400?text=MRMC',
      playCount: 22400,
      status: 'published',
      publishedAt: new Date('2022-01-01'),
    },
    {
      id: 'song-hay-trao',
      title: 'Hãy Trao Cho Anh',
      artistId: st.id,
      albumId: albumSky.id,
      genreId: genreMap['r-and-b'],
      duration: 278,
      bpm: 100,
      mood: 'energetic',
      fileUrl: 'https://example.com/audio/hay-trao.mp3',
      coverUrl: 'https://placehold.co/400x400?text=HTCA',
      playCount: 31000,
      status: 'published',
      publishedAt: new Date('2019-07-01'),
    },
    // Hoàng Thùy Linh
    {
      id: 'song-ke-mong',
      title: 'Kẻ Mộng Mơ',
      artistId: htl.id,
      albumId: albumTam.id,
      genreId: genreMap['indie'],
      duration: 198,
      bpm: 78,
      mood: 'dreamy',
      fileUrl: 'https://example.com/audio/ke-mong.mp3',
      coverUrl: 'https://placehold.co/400x400?text=KMM',
      playCount: 8900,
      status: 'published',
      publishedAt: new Date('2022-03-15'),
    },
    {
      id: 'song-ghen-co-vy',
      title: 'Ghen Cô Vy',
      artistId: htl.id,
      albumId: albumTam.id,
      genreId: genreMap['v-pop'],
      duration: 215,
      bpm: 120,
      mood: 'fun',
      fileUrl: 'https://example.com/audio/ghen-co-vy.mp3',
      coverUrl: 'https://placehold.co/400x400?text=GCV',
      playCount: 45000,
      status: 'published',
      publishedAt: new Date('2020-02-23'),
    },
    // Đen Vâu
    {
      id: 'song-troi-hom-nay',
      title: 'Trời Hôm Nay Nhiều Mây Cực',
      artistId: den.id,
      albumId: albumDen.id,
      genreId: genreMap['hip-hop'],
      duration: 267,
      bpm: 95,
      mood: 'chill',
      fileUrl: 'https://example.com/audio/troi-hom-nay.mp3',
      coverUrl: 'https://placehold.co/400x400?text=THNNMC',
      playCount: 12300,
      status: 'published',
      publishedAt: new Date('2021-06-01'),
    },
    {
      id: 'song-di-ve-nha',
      title: 'Đi Về Nhà',
      artistId: den.id,
      albumId: albumDen.id,
      genreId: genreMap['hip-hop'],
      duration: 234,
      bpm: 88,
      mood: 'nostalgic',
      fileUrl: 'https://example.com/audio/di-ve-nha.mp3',
      coverUrl: 'https://placehold.co/400x400?text=DVN',
      playCount: 18700,
      status: 'published',
      publishedAt: new Date('2021-09-10'),
    },
    {
      id: 'song-mang-tien',
      title: 'Mang Tiền Về Cho Mẹ',
      artistId: den.id,
      albumId: albumDen.id,
      genreId: genreMap['hip-hop'],
      duration: 256,
      bpm: 92,
      mood: 'emotional',
      fileUrl: 'https://example.com/audio/mang-tien.mp3',
      coverUrl: 'https://placehold.co/400x400?text=MTVCM',
      playCount: 27600,
      status: 'published',
      publishedAt: new Date('2022-05-20'),
    },
  ];

  for (const song of songs) {
    await prisma.song.upsert({
      where: { id: song.id },
      update: {},
      create: song,
    });
  }
  console.log(`✅ Seeded ${songs.length} songs`);

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

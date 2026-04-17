const getPresignedUrl = jest.fn().mockResolvedValue('https://s3.example.com/audio/song-uuid.mp3?mock=1');

module.exports = { getPresignedUrl };

import 'isomorphic-fetch';
import ytdl from 'ytdl-core';

import { Channel, Video, Thumbnail } from '../graphql/connectors';

const prefix = 'https://www.googleapis.com/youtube/v3';
const apiKey = 'AIzaSyDeFkttvdLyrHWrxoSS36rhT-YaYuJvfjc';

export const getChannelByName = async username => {
  const url = `${prefix}/channels?part=snippet&key=${apiKey}&forUsername=${username}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw await response.text();
  }

  const data = await response.json();
  const { id, etag, snippet } = data.items[0];
  const { title, description, publishedAt, thumbnails } = snippet;

  return {
    id,
    etag,
    username,
    title,
    description,
    publishedAt,
  };
};

export const refreshVideosOnChannel = async channelId => {
  const channel = await Channel.findById(channelId);

  const url = `${prefix}/search?part=snippet&order=date&type=video&key=${apiKey}&channelId=${channelId}`;
  const response = await fetch(url, {
    headers: {
      'If-None-Match': channel.etag,
    }
  });

  if (!response.ok) {
    throw await response.text();
  }

  const data = await response.json();
  data.items.forEach(async video => {
    try {
      const { etag, id, snippet } = video;
      const { publishedAt, title, description, thumbnails } = snippet;

      await Video.insertOrUpdate({
        id: id.videoId,
        channelId,
        title,
        description,
        publishedAt,
        etag,
      });

      for (const type in thumbnails) {
        const { url, width, height } = thumbnails[type];
        Thumbnail.create({ type, url, width, height, videoId: id.videoId });
      }
    } catch (error) {
      console.log(`And error occured refreshing videos: ${error}`);
    }
  });
};

export const refreshAllVideos = () => {
  const channels = Channel.findAll();
  const promises = channels.map(channel => (
    refreshVideosOnChannel(channel.id)
  ));

  return Promise.all(promises).catch(error => {
    console.log(`refreshAllVideos failed: ${error}`);
  });
};

export const getDetailsForVideo = async videoId => {
  try {
    return await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`);
  } catch (error) {
    console.error(`Failed to fetch details for video ${videoId}: ${error}`);
  }
};

export const getSubtitlesForVideo = async videoId => {
  try {
    const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`);
    const captions = info.player_response.captions;
    if (!captions) return null;

    const tracks = captions.playerCaptionsTracklistRenderer.captionTracks;

    return tracks.map(track => ({
      name: track.name.simpleText,
      languageCode: track.languageCode,
      remoteUrl: track.baseUrl,
      url: `/subtitles?url=${encodeURIComponent(track.baseUrl)}`,
      vssId: track.vssId,
      isTranslatable: track.isTranslatable,
    }));
  } catch (error) {
    console.error(`Failed to fetch subtitles for video ${videoId}: ${error}`);
  }
};
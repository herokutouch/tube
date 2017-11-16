import { GraphQLScalarType } from 'graphql';
import { Kind } from 'graphql/language';

import { User, Video, Channel, Thumbnail, addUser, verifyLogin } from './connectors';
import { getChannelByName, refreshVideosOnChannel, getSubtitlesForVideo } from '../utils/ytapi';

export default {
  Query: {
    videos(_, args, context) {
      console.log('context', context);
      return Video.findAll({ where: args });
    },
    video(_, args) {
      return Video.findById(args.id);
    },
    channels(_, args) {
      return Channel.findAll({ where: args });
    },
  },
  Mutation: {
    async loginUser(_, args, context) {
      console.log('context', context);
      if (await verifyLogin(args)) {
        context.user = await User.findOne({
          where: {
            username: args.username,
          },
        });
        return true;
      }
      return false;
    },
    addUser(_, args) {
      return addUser(args);
    },
    async addChannel(_, args) {
      const matches = await Channel.findAndCount({ where: args });
      if (matches.count) {
        throw `A channel with the username ${args.username} already exists`;
      }

      const channel = await getChannelByName(args.username);
      const created = await Channel.create(channel);
      await refreshVideosOnChannel(channel.id);
      return created.dataValues;
    },
  },
  Video: {
    channel(obj) {
      return Channel.findById(obj.dataValues.channelId);
    },
    thumbnails(obj) {
      return Thumbnail.findAll({
        where: {
          videoId: obj.dataValues.id,
        },
      });
    },
    subtitles(obj) {
      return getSubtitlesForVideo(obj.dataValues.id);
    },
  },
  Channel: {
    videos(obj) {
      return Video.findAll({
        where: {
          channelId: obj.dataValues.id,
        }
      });
    },
  },
  Date: new GraphQLScalarType({
    name: 'Date',
    description: 'Date custom scalar type',
    parseValue(value) {
      return new Date(value); // value from the client
    },
    serialize(value) {
      return value.getTime(); // value sent to the client
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.INT) {
        return parseInt(ast.value, 10); // ast value is always in string format
      }
      return null;
    },
  }),
};

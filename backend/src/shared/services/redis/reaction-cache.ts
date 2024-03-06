import { BaseCache } from '@src/shared/services/redis/base.cache';
import Logger from 'bunyan';
import { find } from 'lodash';
import { config } from '@src/config';
import { ServerError } from '@src/shared/globals/helpers/error-handler';
import { Helpers } from '@src/shared/globals/helpers/helpers';
import { IReactionDocument, IReactions } from '@src/features/reactions/interfaces/reaction.interface';

const log: Logger = config.createLogger('ReactionCache');

export class ReactionCache extends BaseCache {
  constructor() {
    super('reactionCache');
  }

  public async savePostReactionToCache(
    key: string,
    reaction: IReactionDocument,
    postReactions: IReactions,
    type: string,
    previousReaction: string
  ): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      // first of all check if the user had added a reaction before.
      if (previousReaction) {
        // call to remove reaction method
        this.removePostReactionFromCache(key, reaction.username, postReactions);
      }

      // if no previous reaction, create one
      if (type) {
        // so here we add the new redis list hash
        await this.client.LPUSH(`reations:${key}`, JSON.stringify(reaction));
        // Then we update the respective post the reactions field
        const dataToSave: string[] = ['reactions', JSON.stringify(postReactions)];
        await this.client.HSET(`posts:${key}`, dataToSave);
      }
    } catch (error) {
      log.error('post add reaction error: ', error);
      throw new ServerError('Redis server error. Try again');
    }
  }

  public async removePostReactionFromCache(key: string, username: string, postReactions: IReactions): Promise<void> {
    // key above is the post id
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      // since we are saving the reactions in a redis list and not cache we need to use LRANGE to fetch data from the list

      const response: string[] = await this.client.LRANGE(`reactions:${key}`, 0, -1);

      // initialize multi
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      const userPreviousReaction: IReactionDocument = this.getPreviousReaction(response, username) as IReactionDocument;

      // To remove an element from a redis list we use LREM
      // in this case 1 means remove only one element;
      multi.LREM(`reactions:${key}`, 1, JSON.stringify(userPreviousReaction));
      await multi.exec();

      // Then we update the respective post the reactions field
      const dataToSave: string[] = ['reactions', JSON.stringify(postReactions)];
      await this.client.HSET(`posts:${key}`, dataToSave);
    } catch (error) {
      log.error('post  reaction remove error: ', error);
      throw new ServerError('server error. Try again');
    }
  }

  private getPreviousReaction(response: string[], username: string): IReactionDocument | undefined {
    const list: IReactionDocument[] = [];

    // the response parameter contains reactions as strings from redis
    // so we convert them to their respective   types first.

    for (const item of response) {
      list.push(Helpers.parseJson(item) as IReactionDocument);
    }

    // then we manouvre through each list and return the list with only records that much the username
    return find(list, (listItem: IReactionDocument) => {
      return listItem.username === username;
    });
  }
}

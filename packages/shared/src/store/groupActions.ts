import * as api from '../api';
import * as db from '../db';
import { createDevLogger } from '../debug';
import * as sync from './sync';

const logger = createDevLogger('groupActions', true);

export async function createGroup({
  currentUserId,
  title,
  shortCode,
}: {
  currentUserId: string;
  title: string;
  shortCode: string;
}): Promise<{ group: db.Group; channel: db.Channel }> {
  logger.log(`${shortCode}: creating group`);
  try {
    await api.createGroup({
      title,
      shortCode,
    });

    logger.log(
      `${shortCode}: api.createGroup succeeded, creating default channel`
    );
    const groupId = `${currentUserId}/${shortCode}`;

    await api.createDefaultChannel({
      groupId,
      currentUserId,
    });

    logger.log(`${shortCode}: api.createDefaultChannel succeeded`);

    await sync.syncNewGroup(groupId);
    await sync.syncUnreads(); // ensure current user gets registered as a member of the channel
    const group = await db.getGroup({ id: groupId });

    logger.log(`got group?`, group);

    if (group && group.channels.length) {
      const channel = group.channels[0];
      return { group, channel };
    }

    // TODO: should we have a UserFacingError type?
    throw new Error('Something went wrong');
  } catch (e) {
    console.error(`${shortCode}: failed to create group`, e);
    throw new Error('Something went wrong');
  }
}

export async function getGroupsHostedBy(userId: string): Promise<db.Group[]> {
  try {
    // query backend for all groups the ship hosts
    const groups = await api.findGroupsHostedBy(userId);

    const clientGroups = api.toClientGroupsFromPreview(groups);
    // insert any we didn't already have
    await db.insertGroups(clientGroups, false);

    const groupIds = clientGroups.map((g) => g.id);
    const groupPreviews = await db.getGroupPreviews(groupIds);
    return groupPreviews;
  } catch (e) {
    throw new Error(`Couldn't find groups hosted by ${userId}`);
  }
}

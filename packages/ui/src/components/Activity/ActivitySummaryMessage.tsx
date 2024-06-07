import { toPostContent } from '@tloncorp/shared/dist/api';
import * as api from '@tloncorp/shared/dist/api';
import * as db from '@tloncorp/shared/dist/db';
import * as ub from '@tloncorp/shared/dist/urbit';
import { PropsWithChildren, useMemo } from 'react';
import React from 'react';

import { useContact } from '../../contexts';
import { Image, SizableText, Text, View, XStack, YStack } from '../../core';
import { getChannelTitle } from '../../utils';
import AuthorRow from '../AuthorRow';
import { Avatar } from '../Avatar';
import ContactName from '../ContactName';
import ContentRenderer from '../ContentRenderer';
import { GalleryPost } from '../GalleryPost';
import { ListItem } from '../ListItem';
import { ActivityEventContent } from './ActivityEventContent';

function SummaryMessageRaw({
  summary,
  newestPostContact,
}: {
  summary: db.SourceActivityEvents;
  newestPostContact: db.Contact | null;
}) {
  const relevancy = getRelevancy(summary);
  const newest = summary.newest;
  const count = summary.all.length;
  const plural = summary.all.length > 1;
  const newestContact = useContact(newest.authorId ?? '');
  const otherSet = new Set<string>();
  summary.all.forEach((event) => {
    if (event.authorId && event.authorId !== newest.authorId) {
      otherSet.add(event.authorId);
    }
  });
  const otherAuthors = Array.from(otherSet);

  const NewestAuthor = useMemo(() => {
    return (
      <ContactName fontSize="$s" userId={newest.authorId ?? ''} showNickname />
    );
  }, [newest.authorId]);

  const Authors = useMemo(() => {
    return (
      <>
        <ContactName
          fontSize="$s"
          userId={newest.authorId ?? ''}
          showNickname
        />
        {otherAuthors[0] && (
          <>
            {`${otherAuthors[1] ? ', ' : ' and '}`}
            <ContactName fontSize="$s" userId={otherAuthors[0]} showNickname />
          </>
        )}
        {otherAuthors[1] && (
          <>
            {', and '}
            <ContactName fontSize="$s" userId={otherAuthors[1]} showNickname />
          </>
        )}
      </>
    );
  }, [newest.authorId, otherAuthors]);

  // if it's a mention, life is easy and we just say what it is
  if (relevancy === 'mention') {
    return (
      <SummaryMessageWrapper>
        {NewestAuthor}
        {` mentioned you in a ${postName(newest)}`}
      </SummaryMessageWrapper>
    );
  }

  if (relevancy === 'dm') {
    const message =
      count === 1 ? ' sent you a message' : ` sent you ${count} messages`;
    return (
      <SummaryMessageWrapper>
        {NewestAuthor}
        {message}
      </SummaryMessageWrapper>
    );
  }

  if (relevancy === 'groupchat') {
    return (
      <SummaryMessageWrapper>
        {Authors}
        {' messaged the group'}
      </SummaryMessageWrapper>
    );
  }

  if (relevancy === 'postInYourChannel') {
    return (
      <SummaryMessageWrapper>
        {`New ${postName(newest, plural)} from `}
        {Authors}
      </SummaryMessageWrapper>
    );
  }

  if (relevancy === 'replyToGalleryOrNote') {
    const message = `commented on your ${postName(newest)}`;
    return (
      <SummaryMessageWrapper>
        {Authors}
        {` ${message}`}
      </SummaryMessageWrapper>
    );
  }

  if (relevancy === 'replyToChatPost') {
    const message = `replied to your message`;
    return (
      <SummaryMessageWrapper>
        {Authors}
        {` ${message}`}
      </SummaryMessageWrapper>
    );
  }

  if (relevancy === 'involvedThread') {
    const message = `replied in a thread you're involved in`;
    return (
      <SummaryMessageWrapper>
        {Authors}
        {` ${message}`}
      </SummaryMessageWrapper>
    );
  }

  if (summary.all.length === 1) {
    // // if the activity source is unread, we use that total count
    // const count =
    //   newest.type === 'reply'
    //     ? newest.post?.threadUnread?.count ?? summary.all.length
    //     : newest.channel?.unread?.count ?? summary.all.length;

    return (
      <SizableText color="$secondaryText">
        <ContactName userId={newest.authorId ?? ''} showNickname />
        {` ${postVerb(newest.channel?.type ?? 'chat')} a ${postName(newest)}`}
      </SizableText>
    );
  }

  const uniqueAuthors = new Set<string>();
  summary.all.forEach((event) => uniqueAuthors.add(event.authorId ?? ''));
  if (uniqueAuthors.size === 1) {
    return (
      <SizableText color="$secondaryText">
        <ContactName
          userId={newest.authorId ?? ''}
          fontWeight="500"
          showNickname
        />
        {` ${postVerb(newest.channel?.type ?? 'chat')} ${count} ${postName(newest, count > 1)}`}
      </SizableText>
    );
  } else {
    <SizableText color="$secondaryText">
      {`${postVerb(newest.channel?.type ?? 'chat')} ${count} ${postName(newest, count > 1)}`}
    </SizableText>;
  }
}

export const SummaryMessage = React.memo(SummaryMessageRaw);

function SummaryMessageWrapper({ children }: PropsWithChildren) {
  return (
    <SizableText color="$secondaryText" size="$s" marginRight="$xl">
      {children}
    </SizableText>
  );
}

function postName(event: db.ActivityEvent, plural?: boolean) {
  const isThread = Boolean(event.parentId);
  const channelType = event.channel?.type ?? 'chat';

  // if (isThread) {
  //   if (channelType === 'gallery' || channelType === 'notebook') {
  //     return `comment${plural ? 's' : ''}`;
  //   }
  //   return plural ? 'replies' : 'reply';
  // }

  const name =
    channelType === 'gallery'
      ? 'block'
      : channelType === 'notebook'
        ? 'note'
        : 'message';
  return `${name}${plural ? 's' : ''}`;
}

function postVerb(channelType: string) {
  return channelType === 'gallery'
    ? 'added'
    : channelType === 'notebook'
      ? 'added'
      : 'sent';
}

type ActivityRelevancy =
  | 'mention'
  | 'involvedThread'
  | 'replyToGalleryOrNote'
  | 'replyToChatPost'
  | 'dm'
  | 'groupchat'
  | 'postInYourChannel';

export function getRelevancy(
  summary: db.SourceActivityEvents
): ActivityRelevancy {
  const currentUserId = api.getCurrentUserId();
  const newest = summary.newest;

  if (newest.isMention) {
    return 'mention';
  }

  if (newest.type === 'post' && newest.channel?.type === 'dm') {
    return 'dm';
  }

  if (newest.type === 'post' && newest.channel?.type === 'groupDm') {
    return 'groupchat';
  }

  if (
    newest.type === 'reply' &&
    (newest.channel?.type === 'gallery' ||
      newest.channel?.type === 'notebook') &&
    newest.parentAuthorId === currentUserId
  ) {
    return 'replyToGalleryOrNote';
  }

  if (newest.type === 'reply' && newest.parentAuthorId === currentUserId) {
    return 'replyToChatPost';
  }

  if (
    newest.type === 'post' &&
    newest.channelId?.includes(`/${currentUserId}/`)
  ) {
    return 'postInYourChannel';
  }

  if (newest.type === 'reply' && newest.shouldNotify) {
    return 'involvedThread';
  }

  console.error(
    'Unknown relevancy type for activity summary. Defaulting to involvedThread.',
    summary
  );
  return 'involvedThread';
}

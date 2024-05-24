import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { sync } from '@tloncorp/shared';
import * as db from '@tloncorp/shared/dist/db';
import * as store from '@tloncorp/shared/dist/store';
import * as urbit from '@tloncorp/shared/dist/urbit';
import { PostScreenView } from '@tloncorp/ui';
import { useCallback, useEffect, useLayoutEffect, useMemo } from 'react';

import { useShip } from '../contexts/ship';
import { useImageUpload } from '../hooks/useImageUpload';
import storage from '../lib/storage';
import type { HomeStackParamList } from '../types';

type PostScreenProps = NativeStackScreenProps<HomeStackParamList, 'Post'>;

// TODO: Pull from actual settings
const defaultCalmSettings = {
  disableAppTileUnreads: false,
  disableAvatars: false,
  disableNicknames: false,
  disableRemoteContent: false,
  disableSpellcheck: false,
};

export default function PostScreen(props: PostScreenProps) {
  useLayoutEffect(() => {
    if (props.navigation.isFocused()) {
      props.navigation.getParent()?.setOptions({
        tabBarStyle: {
          display: 'none',
        },
      });
    }

    return () => {
      props.navigation.getParent()?.setOptions({
        tabBarStyle: {
          display: undefined,
        },
      });
    };
  }, [props.navigation]);

  const postParam = props.route.params.post;
  const { data: post } = store.usePostWithRelations({
    id: postParam.id,
  });
  const { data: threadPosts } = store.useThreadPosts({
    postId: postParam.id,
    authorId: postParam.authorId,
    channelId: postParam.channelId,
  });

  const { data: channel } = store.useChannel({ id: postParam.channelId });
  const groupQuery = store.useGroup({
    id: channel?.groupId ?? '',
  });
  const { data: contacts } = store.useContacts();
  const { contactId } = useShip();
  const uploadInfo = useImageUpload({
    uploaderKey: `${postParam.channelId}/${postParam.id}`,
  });

  const posts = useMemo(() => {
    return post ? [...(threadPosts ?? []), post] : null;
  }, [post, threadPosts]);

  useEffect(() => {
    if (channel?.groupId) {
      sync.syncGroup(channel?.groupId);
    }
  }, [channel?.groupId]);

  const sendReply = async (content: urbit.Story) => {
    store.sendReply({
      authorId: contactId!,
      content,
      channel: channel!,
      parentId: post!.id,
      parentAuthor: post!.authorId,
    });
    uploadInfo.resetImageAttachment();
  };

  const handleGoToImage = useCallback(
    (post: db.Post, uri?: string) => {
      // @ts-expect-error TODO: fix typing for nested stack navigation
      props.navigation.navigate('ImageViewer', { post, uri });
    },
    [props.navigation]
  );

  const getDraft = useCallback(async () => {
    try {
      const draft = await storage.load({ key: `draft-${postParam.id}` });
      return draft;
    } catch (e) {
      console.log('Error loading draft', e);
      return null;
    }
  }, [postParam.id]);

  const storeDraft = useCallback(
    async (draft: urbit.JSONContent) => {
      try {
        await storage.save({ key: `draft-${postParam.id}`, data: draft });
      } catch (e) {
        console.log('Error saving draft', e);
      }
    },
    [postParam.id]
  );

  const clearDraft = useCallback(async () => {
    try {
      await storage.remove({ key: `draft-${postParam.id}` });
    } catch (e) {
      console.log('Error clearing draft', e);
    }
  }, [postParam.id]);

  return contactId ? (
    <PostScreenView
      contacts={contacts ?? null}
      calmSettings={defaultCalmSettings}
      currentUserId={contactId}
      posts={posts}
      channel={channel ?? null}
      goBack={props.navigation.goBack}
      sendReply={sendReply}
      groupMembers={groupQuery.data?.members ?? []}
      uploadInfo={uploadInfo}
      handleGoToImage={handleGoToImage}
      getDraft={getDraft}
      storeDraft={storeDraft}
      clearDraft={clearDraft}
    />
  ) : null;
}
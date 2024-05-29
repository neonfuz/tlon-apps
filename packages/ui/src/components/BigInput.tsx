import { EditorBridge } from '@10play/tentap-editor';
import * as db from '@tloncorp/shared/dist/db';
import { useEffect, useRef, useState } from 'react';
import { Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ScrollView } from 'react-native-reanimated/lib/typescript/Animated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image, Input, getToken } from 'tamagui';

import { Text, View, YStack } from '../core';
import AttachmentSheet from './AttachmentSheet';
import { Icon } from './Icon';
import { LoadingSpinner } from './LoadingSpinner';
import { MessageInput } from './MessageInput';
import { InputToolbar } from './MessageInput/InputToolbar';
import { MessageInputProps } from './MessageInput/MessageInputBase';

export function BigInput({
  channelType,
  channelId,
  groupMembers,
  shouldBlur,
  setShouldBlur,
  send,
  storeDraft,
  clearDraft,
  getDraft,
  editingPost,
  setEditingPost,
  editPost,
  setShowBigInput,
  placeholder,
  uploadInfo,
}: {
  channelType: db.ChannelType;
} & MessageInputProps) {
  const [title, setTitle] = useState('');
  const [showAttachmentSheet, setShowAttachmentSheet] = useState(false);
  const editorRef = useRef<{
    editor: EditorBridge | null;
    setEditor: (editor: EditorBridge) => void;
  }>(null);
  const scrollY = useSharedValue(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const isScrolledPastThreshold = useSharedValue(false);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  useAnimatedReaction(
    () => scrollY.value,
    (currentScrollY) => {
      if (currentScrollY <= -150) {
        isScrolledPastThreshold.value = true;
      } else {
        isScrolledPastThreshold.value = false;
      }
    }
  );

  const height = useDerivedValue(() => {
    return isScrolledPastThreshold.value
      ? withTiming(150, { duration: 300 })
      : interpolate(scrollY.value, [0, -150], [50, 150], 'clamp');
  });

  const imageHeightChangeStyle = useAnimatedStyle(() => {
    return {
      height: height.value,
    };
  });

  const onScrollEndDrag = () => {
    if (isScrolledPastThreshold.value) {
      scrollViewRef.current?.scrollTo({ y: -150, animated: true });
    }
  };

  const { top } = useSafeAreaInsets();
  const { width } = Dimensions.get('screen');
  const titleInputHeight = getToken('$4xl', 'space');
  const keyboardVerticalOffset = top + titleInputHeight;

  return (
    <YStack height="100%" width="100%">
      {channelType === 'notebook' && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              // height: 150,
              zIndex: 10,
              // paddingTop: topOffset,
            },
            // imageTranslateYStyle,
            imageHeightChangeStyle,
          ]}
        >
          <TouchableOpacity
            onPress={() => {
              if (isScrolledPastThreshold.value) {
                setShowAttachmentSheet(true);
                editorRef.current?.editor?.blur();
              } else {
                scrollViewRef.current?.scrollTo({ y: -150, animated: true });
              }
            }}
          >
            {uploadInfo?.imageAttachment && !uploadInfo.uploading ? (
              <Image
                source={{ uri: uploadInfo.imageAttachment }}
                resizeMode="cover"
                style={{
                  width: '100%',
                  height: '100%',
                  borderBottomLeftRadius: 16,
                  borderBottomRightRadius: 16,
                }}
              />
            ) : (
              <YStack
                backgroundColor="$primaryText"
                width="100%"
                height="100%"
                borderBottomLeftRadius="$xl"
                borderBottomRightRadius="$xl"
                padding="$2xl"
                alignItems="center"
                justifyContent="center"
                gap="$l"
              >
                {uploadInfo?.uploading ? (
                  <LoadingSpinner />
                ) : (
                  <>
                    <Icon type="Camera" color="$background" />
                    <Text color="$background">
                      Choose an optional cover image
                    </Text>
                  </>
                )}
              </YStack>
            )}
          </TouchableOpacity>
        </Animated.View>
      )}
      <Animated.ScrollView
        ref={scrollViewRef}
        style={[{ height: '100%', width: '100%' }]}
        // scrollEnabled={!editorIsFocused}
        onScroll={scrollHandler}
        onScrollEndDrag={onScrollEndDrag}
        scrollEventThrottle={16}
        scrollToOverflowEnabled
        contentContainerStyle={{
          paddingTop: channelType === 'notebook' ? 50 : 0,
        }}
      >
        {channelType === 'notebook' && (
          <View backgroundColor="$background" width="100%">
            <Input
              size="$xl"
              height={titleInputHeight}
              backgroundColor="$background"
              borderColor="transparent"
              placeholder="New Title"
              onChangeText={setTitle}
            />
          </View>
        )}
        <View width="100%" height="100%">
          <MessageInput
            shouldBlur={shouldBlur}
            setShouldBlur={setShouldBlur}
            send={send}
            title={title}
            image={uploadInfo?.uploadedImage ?? undefined}
            channelId={channelId}
            groupMembers={groupMembers}
            storeDraft={storeDraft}
            clearDraft={clearDraft}
            getDraft={getDraft}
            editingPost={editingPost}
            setEditingPost={setEditingPost}
            editPost={editPost}
            setShowBigInput={setShowBigInput}
            floatingActionButton
            showAttachmentButton={false}
            backgroundColor="$background"
            paddingHorizontal="$m"
            placeholder={placeholder}
            bigInput
            showToolbar={channelType === 'notebook'}
            channelType={channelType}
            ref={editorRef}
          />
        </View>
      </Animated.ScrollView>
      {channelType === 'notebook' &&
        editorRef.current &&
        editorRef.current.editor && (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'position'}
            keyboardVerticalOffset={keyboardVerticalOffset}
            style={{
              width,
              position: 'absolute',
              bottom: 0,
              flex: 1,
            }}
          >
            <InputToolbar editor={editorRef.current.editor} />
          </KeyboardAvoidingView>
        )}
      {channelType === 'notebook' && uploadInfo && (
        <AttachmentSheet
          showAttachmentSheet={showAttachmentSheet}
          setShowAttachmentSheet={setShowAttachmentSheet}
          setImage={uploadInfo?.setAttachments}
        />
      )}
    </YStack>
  );
}

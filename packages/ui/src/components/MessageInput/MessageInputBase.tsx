import { Upload } from '@tloncorp/shared/dist/api';
import { Story } from '@tloncorp/shared/dist/urbit';
import { PropsWithChildren, useMemo } from 'react';

import { ArrowUp } from '../../assets/icons';
import { View, XStack, YStack } from '../../core';
import { IconButton } from '../IconButton';
import AttachmentButton from './AttachmentButton';

export interface MessageInputProps {
  shouldBlur: boolean;
  setShouldBlur: (shouldBlur: boolean) => void;
  send: (content: Story, channelId: string) => void;
  channelId: string;
  setImageAttachment: (image: string | null) => void;
  uploadedImage?: Upload | null;
  canUpload?: boolean;
}

export const MessageInputContainer = ({
  children,
  onPressSend,
  setImageAttachment,
  uploadedImage,
  canUpload,
}: PropsWithChildren<{
  onPressSend?: () => void;
  setImageAttachment: (image: string | null) => void;
  uploadedImage?: Upload | null;
  canUpload?: boolean;
}>) => {
  const hasUploadedImage = useMemo(
    () => !!(uploadedImage && uploadedImage.url !== ''),
    [uploadedImage]
  );
  const uploadIsLoading = useMemo(
    () => uploadedImage?.status === 'loading',
    [uploadedImage]
  );
  const sendIconColor = useMemo(
    () => (uploadIsLoading ? '$secondaryText' : '$primaryText'),
    [uploadIsLoading]
  );

  return (
    <YStack>
      <XStack
        paddingHorizontal="$m"
        paddingVertical="$s"
        gap="$l"
        alignItems="flex-end"
        justifyContent="space-between"
      >
        {hasUploadedImage ? null : canUpload ? (
          <View paddingBottom="$m">
            <AttachmentButton
              uploadedImage={uploadedImage}
              setImage={setImageAttachment}
            />
          </View>
        ) : null}
        {children}
        <View paddingBottom="$m">
          <IconButton
            color={sendIconColor}
            disabled={uploadIsLoading}
            onPress={onPressSend}
          >
            {/* TODO: figure out what send button should look like */}
            <ArrowUp />
          </IconButton>
        </View>
      </XStack>
    </YStack>
  );
};

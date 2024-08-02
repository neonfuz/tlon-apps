import * as db from '@tloncorp/shared/dist/db';
import { useMemo } from 'react';

import { useContact } from '../contexts';
import { ScrollView, SizableText, View, XStack, YStack } from '../core';
import { ContactAvatar } from './Avatar';
import { BioDisplay } from './BioDisplay';
import { Button } from './Button';
import ContactName from './ContactName';
import { FavoriteGroupsDisplay } from './FavoriteGroupsDisplay';
import { GenericHeader } from './GenericHeader';

interface Props {
  userId: string;
  onBack: () => void;
}

export function UserProfileScreenView(props: Props) {
  const userContact = useContact(props.userId);
  const hasBio = !!userContact?.bio?.length;
  const favoriteGroups = useMemo(() => {
    return userContact?.pinnedGroups?.map((g) => g.group) ?? [];
  }, [userContact?.pinnedGroups]);

  return (
    <View flex={1}>
      <GenericHeader goBack={props.onBack} />
      <ScrollView flex={1}>
        <YStack marginTop="$2xl">
          <View marginHorizontal="$2xl" marginBottom="$3xl">
            <UserInfoRow
              userId={props.userId}
              hasNickname={!!userContact?.nickname?.length}
            />
          </View>

          <View marginHorizontal="$l" marginBottom="$xl">
            <ProfileButtons />
          </View>

          <YStack marginHorizontal="$l" gap="$l">
            {hasBio ? <BioDisplay bio={userContact?.bio ?? ''} /> : null}
            {favoriteGroups.length ? (
              <FavoriteGroupsDisplay groups={favoriteGroups as db.Group[]} />
            ) : null}
          </YStack>
          {!hasBio && !favoriteGroups.length ? (
            <XStack justifyContent="center" marginTop={120}>
              <SizableText color="$tertiaryText">
                Nothing to see here...
              </SizableText>
            </XStack>
          ) : null}
        </YStack>
      </ScrollView>
    </View>
  );
}

function UserInfoRow(props: { userId: string; hasNickname: boolean }) {
  return (
    <XStack alignItems="center">
      <ContactAvatar contactId={props.userId} size="$5xl" marginRight="$xl" />
      <YStack flexGrow={1}>
        {props.hasNickname ? (
          <>
            <ContactName userId={props.userId} showNickname size="$xl" />
            <ContactName userId={props.userId} color="$secondaryText" />
          </>
        ) : (
          <ContactName userId={props.userId} size="$xl" />
        )}
      </YStack>
    </XStack>
  );
}

function ProfileButtons() {
  // TODO: implement dynamically, no op for now
  return (
    <XStack gap="$m">
      <ProfileButton title="Message" />
      <ProfileButton title="Add pal" />
    </XStack>
  );
}

function ProfileButton(props: { title: string }) {
  return (
    <Button
      borderWidth={0}
      flexGrow={1}
      paddingVertical={14} // that extra 2px tho
      paddingHorizontal="$2xl"
      borderRadius="$xl"
    >
      <Button.Text size="$l">{props.title}</Button.Text>
    </Button>
  );
}

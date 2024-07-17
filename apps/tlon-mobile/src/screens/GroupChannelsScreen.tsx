import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as db from '@tloncorp/shared/dist/db';
import * as store from '@tloncorp/shared/dist/store';
import { AppDataContextProvider, GroupChannelsScreenView } from '@tloncorp/ui';
import { useCallback } from 'react';

import type { RootStackParamList } from '../types';

type GroupChannelsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'GroupChannels'
>;

export function GroupChannelsScreen({
  route,
  navigation,
}: GroupChannelsScreenProps) {
  const groupParam = route.params.group;
  const groupQuery = store.useGroup({ id: groupParam.id });
  const handleChannelSelected = useCallback(
    (channel: db.Channel) => {
      navigation.navigate('Channel', {
        channel: channel,
      });
    },
    [navigation]
  );
  const handleGoBackPressed = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const contactsQuery = store.useContacts();

  return (
    <AppDataContextProvider contacts={contactsQuery.data ?? null}>
      <GroupChannelsScreenView
        onChannelPressed={handleChannelSelected}
        onBackPressed={handleGoBackPressed}
        group={groupQuery.data ?? route.params.group}
        channels={groupQuery.data?.channels ?? route.params.group.channels}
      />
    </AppDataContextProvider>
  );
}

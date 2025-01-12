import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { NOTIFY_PROVIDER, NOTIFY_SERVICE } from '@tloncorp/app/constants';
import { getEasUpdateDisplay } from '@tloncorp/app/lib/platformHelpers';
import * as store from '@tloncorp/shared/dist/store';
import {
  AppSetting,
  GenericHeader,
  ListItem,
  SizableText,
  Stack,
  View,
  YStack,
} from '@tloncorp/ui';
import { preSig } from '@urbit/aura';
import * as Application from 'expo-application';
import * as Updates from 'expo-updates';
import { useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'AppInfo'>;

const BUILD_VERSION = `${Platform.OS === 'ios' ? 'iOS' : 'Android'} ${Application.nativeBuildVersion}`;

export function AppInfoScreen(props: Props) {
  const { data: appInfo } = store.useAppInfo();
  const easUpdateDisplay = useMemo(() => getEasUpdateDisplay(Updates), []);

  const onPressPreviewFeatures = useCallback(() => {
    props.navigation.navigate('FeatureFlags');
  }, [props.navigation]);

  return (
    <View flex={1}>
      <GenericHeader
        title="App Info"
        goBack={() => props.navigation.goBack()}
      />
      <ScrollView>
        <YStack marginTop="$xl" marginHorizontal="$2xl" gap="$s">
          <AppSetting title="Build version" value={BUILD_VERSION} copyable />
          <AppSetting title="OTA Update" value={easUpdateDisplay} copyable />
          <AppSetting
            title="Notify provider"
            value={preSig(NOTIFY_PROVIDER)}
            copyable
          />
          <AppSetting title="Notify service" value={NOTIFY_SERVICE} copyable />
          {appInfo ? (
            <>
              <AppSetting
                title="Desk version"
                value={appInfo.groupsVersion}
                copyable
              />
              <AppSetting
                title="Desk source"
                value={appInfo.groupsSyncNode}
                copyable
              />
              <AppSetting
                title="Desk hash"
                value={appInfo.groupsHash.split('.').pop() ?? 'n/a'}
                copyable
              />
            </>
          ) : (
            <View>
              <SizableText color="$negativeActionText">
                Cannot load app info settings
              </SizableText>
            </View>
          )}

          <Stack marginTop="$xl">
            <ListItem onPress={onPressPreviewFeatures}>
              <ListItem.SystemIcon icon="Bang" rounded />
              <ListItem.MainContent>
                <ListItem.Title>Feature previews</ListItem.Title>
              </ListItem.MainContent>
              <ListItem.SystemIcon
                icon="ChevronRight"
                backgroundColor={'transparent'}
                position="relative"
                left="$m"
              />
            </ListItem>
          </Stack>
        </YStack>
      </ScrollView>
    </View>
  );
}

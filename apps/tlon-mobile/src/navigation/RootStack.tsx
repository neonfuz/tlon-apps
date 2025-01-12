import { useFocusEffect } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useIsDarkMode } from '@tloncorp/app/hooks/useIsDarkMode';
import { useTheme } from '@tloncorp/ui';
import { Platform, StatusBar } from 'react-native';

import { ActivityScreenController } from '../controllers/ActivityScreenController';
import { ChannelScreenController } from '../controllers/ChannelScreenController';
import { ChannelSearchScreenController } from '../controllers/ChannelSearchScreenController';
import { ChatListScreenController } from '../controllers/ChatListScreenController';
import { GroupChannelsScreenController } from '../controllers/GroupChannelsScreenController';
import ImageViewerScreenController from '../controllers/ImageViewerScreenController';
import { PostScreenController } from '../controllers/PostScreenController';
import { AppInfoScreen } from '../screens/AppInfo';
import { AppSettingsScreen } from '../screens/AppSettingsScreen';
import { BlockedUsersScreen } from '../screens/BlockedUsersScreen';
import { ChannelMembersScreen } from '../screens/ChannelMembersScreen';
import { ChannelMetaScreen } from '../screens/ChannelMetaScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { FeatureFlagScreen } from '../screens/FeatureFlagScreen';
import { ManageAccountScreen } from '../screens/ManageAccountScreen';
import { PushNotificationSettingsScreen } from '../screens/PushNotificationSettingsScreen';
import { UserBugReportScreen } from '../screens/UserBugReportScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import type { RootStackParamList } from '../types';
import { GroupSettingsStack } from './GroupSettingsStack';
import { SettingsStack } from './SettingsStack';

const Root = createNativeStackNavigator<RootStackParamList>();

export function RootStack() {
  const isDarkMode = useIsDarkMode();

  // Android status bar has a solid color by default, so we clear it
  useFocusEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setBarStyle(isDarkMode ? 'light-content' : 'dark-content');
    }
  });

  const theme = useTheme();

  return (
    <Root.Navigator
      initialRouteName="ChatList"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background.val },
      }}
    >
      {/* top level tabs */}
      <Root.Screen
        name="ChatList"
        component={ChatListScreenController}
        options={{ animation: 'none', gestureEnabled: false }}
      />
      <Root.Screen
        name="Activity"
        component={ActivityScreenController}
        options={{ animation: 'none', gestureEnabled: false }}
      />
      <Root.Screen
        name="Profile"
        component={SettingsStack}
        options={{ animation: 'none', gestureEnabled: false }}
      />

      {/* individual screens */}
      <Root.Screen name="GroupSettings" component={GroupSettingsStack} />
      <Root.Screen name="Channel" component={ChannelScreenController} />
      <Root.Screen
        name="ChannelSearch"
        component={ChannelSearchScreenController}
      />
      <Root.Screen name="Post" component={PostScreenController} />
      <Root.Screen
        name="GroupChannels"
        component={GroupChannelsScreenController}
      />
      <Root.Screen
        name="ImageViewer"
        component={ImageViewerScreenController}
        options={{ animation: 'fade' }}
      />

      <Root.Screen name="AppSettings" component={AppSettingsScreen} />
      <Root.Screen
        name="ManageAccount"
        component={ManageAccountScreen}
        options={{ gestureEnabled: false }}
      />
      <Root.Screen name="BlockedUsers" component={BlockedUsersScreen} />
      <Root.Screen name="AppInfo" component={AppInfoScreen} />
      <Root.Screen name="FeatureFlags" component={FeatureFlagScreen} />
      <Root.Screen
        name="PushNotificationSettings"
        component={PushNotificationSettingsScreen}
      />
      <Root.Screen name="UserProfile" component={UserProfileScreen} />
      <Root.Screen name="EditProfile" component={EditProfileScreen} />
      <Root.Screen name="WompWomp" component={UserBugReportScreen} />
      <Root.Screen name="ChannelMembers" component={ChannelMembersScreen} />
      <Root.Screen name="ChannelMeta" component={ChannelMetaScreen} />
    </Root.Navigator>
  );
}

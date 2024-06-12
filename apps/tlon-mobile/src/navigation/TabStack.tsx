import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from '@tloncorp/ui';

import NavBar from '../navigation/NavBarView';
import type { TabParamList } from '../types';
import { HomeStack } from './HomeStack';
import { SettingsStack } from './SettingsStack';

const ActivityScreen = (props: any) => {
  return (
    <View backgroundColor="$background" flex={1}>
      <View flex={1} />
      <NavBar navigation={props.navigation} />
    </View>
  );
};

const Tab = createNativeStackNavigator<TabParamList>();

export const TabStack = () => {
  return (
    <Tab.Navigator
      id="TabBar"
      initialRouteName="Groups"
      screenOptions={{
        headerShown: false,
        animation: 'none',
      }}
    >
      <Tab.Screen
        name="Groups"
        component={HomeStack}
        options={{
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Activity"
        component={ActivityScreen}
        options={{
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStack}
        options={{
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
};

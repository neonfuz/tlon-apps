import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ProfileScreen from '@tloncorp/app/features/settings/ProfileScreen';

import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export function ProfileScreenController(props: Props) {
  return (
    <ProfileScreen
      navigateToAppSettings={() => props.navigation.navigate('AppSettings')}
      navigateToEditProfile={() => props.navigation.navigate('EditProfile')}
      navigateToErrorReport={() => props.navigation.navigate('WompWomp')}
      navigateToProfile={(userId: string) =>
        props.navigation.navigate('UserProfile', { userId })
      }
      navigateToHome={() => props.navigation.navigate('ChatList')}
      navigateToNotifications={() => props.navigation.navigate('Activity')}
      navigateToSettings={() => props.navigation.navigate('Profile')}
    />
  );
}

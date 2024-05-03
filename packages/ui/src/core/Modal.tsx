import { ComponentProps } from 'react';
import { Modal as RNModal } from 'react-native';

import { Overlay } from './Overlay';
import { View, ZStack } from './tamagui';

export function Modal(props: ComponentProps<typeof RNModal>) {
  const onDismiss = () => {
    if (props.onDismiss) {
      props.onDismiss();
    }
  };

  return (
    <RNModal transparent={true} {...props}>
      <ZStack flex={1} justifyContent="center" alignItems="center">
        <Overlay onPress={onDismiss} />
        <View flex={1} position="absolute" onPress={onDismiss}>
          {props.children}
        </View>
      </ZStack>
    </RNModal>
  );
}

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BRANCH_DOMAIN, BRANCH_KEY } from '@tloncorp/app/constants';
import { useGroupContext } from '@tloncorp/app/hooks/useGroupContext';
import * as db from '@tloncorp/shared/dist/db';
import * as store from '@tloncorp/shared/dist/store';
import { uploadAsset, useCanUpload } from '@tloncorp/shared/dist/store';
import {
  AttachmentProvider,
  Button,
  DeleteSheet,
  MetaEditorScreenView,
} from '@tloncorp/ui';
import { useCallback, useState } from 'react';

import { GroupSettingsStackParamList } from '../../types';

type GroupMetaScreenProps = NativeStackScreenProps<
  GroupSettingsStackParamList,
  'GroupMeta'
>;

export function GroupMetaScreen(props: GroupMetaScreenProps) {
  const { groupId } = props.route.params;
  const { group, setGroupMetadata, deleteGroup } = useGroupContext({
    groupId,
  });
  const canUpload = useCanUpload();
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
  const { enabled, describe } = store.useLure({
    flag: groupId,
    branchDomain: BRANCH_DOMAIN,
    branchKey: BRANCH_KEY,
  });

  const handleSubmit = useCallback(
    (data: db.ClientMeta) => {
      setGroupMetadata(data);
      props.navigation.goBack();
      if (enabled) {
        describe({
          title: data.title ?? '',
          description: data.description ?? '',
          image: data.iconImage ?? '',
          cover: data.coverImage ?? '',
        });
      }
    },
    [setGroupMetadata, props.navigation, enabled, describe]
  );

  const handlePressDelete = useCallback(() => {
    setShowDeleteSheet(true);
  }, []);

  return (
    <AttachmentProvider canUpload={canUpload} uploadAsset={uploadAsset}>
      <MetaEditorScreenView
        chat={group}
        title={'Edit group info'}
        goBack={props.navigation.goBack}
        onSubmit={handleSubmit}
      >
        <Button heroDestructive onPress={handlePressDelete}>
          <Button.Text>Delete group for everyone</Button.Text>
        </Button>
        <DeleteSheet
          title={group?.title ?? 'This Group'}
          itemTypeDescription="group"
          open={showDeleteSheet}
          onOpenChange={setShowDeleteSheet}
          deleteAction={deleteGroup}
        />
      </MetaEditorScreenView>
    </AttachmentProvider>
  );
}

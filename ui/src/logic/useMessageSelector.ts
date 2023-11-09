import { difference } from 'lodash';
import ob from 'urbit-ob';
import { useCallback, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useLocalStorage } from 'usehooks-ts';
import { ShipOption } from '@/components/ShipSelector';
import {
  SendMessageVariables,
  useChatState,
  useDmUnreads,
  useMultiDms,
  useSendMessage,
} from '@/state/chat';
import createClub from '@/state/chat/createClub';
import { PostEssay } from '@/types/channel';
import { createMessage } from '@/state/chat/utils';
import { WritDelta } from '@/types/dms';
import { createStorageKey, newUv } from './utils';

export default function useMessageSelector() {
  const navigate = useNavigate();
  const location = useLocation();
  const newClubId = useMemo(() => newUv(), []);
  const [ships, setShips] = useLocalStorage<ShipOption[]>(
    createStorageKey('new-dm-ships'),
    []
  );
  const isMultiDm = ships.length > 1;
  const shipValues = useMemo(() => ships.map((o) => o.value), [ships]);
  const multiDms = useMultiDms();
  const { data: unreads } = useDmUnreads();
  const { mutate: sendMessage } = useSendMessage();

  const existingDm = useMemo(() => {
    if (ships.length !== 1) {
      return null;
    }

    return (
      Object.entries(unreads).find(([flag, _unread]) => {
        const theShip = ships[0].value;
        const sameDM = theShip === flag;
        return sameDM;
      })?.[0] ?? null
    );
  }, [ships, unreads]);

  const existingMultiDm = useMemo(() => {
    if (!shipValues.length) {
      return null;
    }
    const clubId = Object.entries(multiDms).reduce<string>((key, [k, v]) => {
      const theShips = [...v.hive, ...v.team].filter((s) => s !== window.our);
      if (theShips.length < 2) {
        // not a valid multi-DM
        return key;
      }

      const sameDM =
        difference(shipValues, theShips).length === 0 &&
        shipValues.length === theShips.length;
      const unread = unreads[key];
      const newUnread = unreads[k];
      const newer =
        !unread || (unread && newUnread && newUnread.last > unread.last);
      if (sameDM && newer) {
        return k;
      }

      return key;
    }, '');

    return clubId !== '' ? clubId : null;
  }, [multiDms, shipValues, unreads]);

  const onEnter = useCallback(
    async (invites: ShipOption[]) => {
      if (existingDm) {
        navigate(`/dm/${existingDm}`);
      } else if (existingMultiDm) {
        navigate(`/dm/${existingMultiDm}`);
      } else if (isMultiDm) {
        await createClub(
          newClubId,
          invites.filter((i) => i.value !== window.our).map((s) => s.value)
        );
        navigate(`/dm/${newClubId}`);
      } else {
        navigate(`/dm/${invites[0].value}`);
      }

      setShips([]);
    },
    [existingMultiDm, existingDm, isMultiDm, setShips, navigate, newClubId]
  );

  const sendDm = useCallback(
    async (variables: SendMessageVariables) => {
      const { whom } = variables;
      if (isMultiDm && shipValues && whom !== existingMultiDm) {
        await createClub(whom, shipValues);
      }

      // useChatState.getState().sendMessage(whom, essay);
      sendMessage(variables);

      setShips([]);
      navigate(`/dm/${isMultiDm ? whom : whom}`);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isMultiDm, JSON.stringify(shipValues), existingMultiDm, setShips, navigate]
  );

  const whom = useMemo(
    () =>
      ships.length > 0
        ? isMultiDm
          ? existingMultiDm || newClubId
          : ships[0].value
        : '',
    [existingMultiDm, isMultiDm, newClubId, ships]
  );

  const validShips = useMemo(
    () =>
      Boolean(shipValues.length) &&
      shipValues.every((ship) => ob.isValidPatp(ship)),
    [shipValues]
  );

  const action = existingDm || existingMultiDm ? 'Open' : 'Create';
  const isSelectingMessage = useMemo(() => ships.length > 0, [ships]);

  useEffect(() => {
    if (!location.pathname.includes('/dm/new')) {
      if (existingMultiDm && location.pathname.includes(existingMultiDm)) {
        navigate(`/dm/new/${existingMultiDm}`);
      } else if (existingDm && location.pathname.includes(existingDm)) {
        navigate(`/dm/new/${existingDm}`);
      }
      return;
    }
    if (existingDm) {
      navigate(`/dm/new/${existingDm}`);
    } else if (existingMultiDm) {
      navigate(`/dm/new/${existingMultiDm}`);
    } else {
      navigate(`/dm/new`);
    }
  }, [existingDm, existingMultiDm, navigate, location.pathname]);

  return {
    action,
    existingDm,
    existingMultiDm,
    isSelectingMessage,
    onEnter,
    sendDm,
    setShips,
    ships,
    validShips,
    whom,
  };
}

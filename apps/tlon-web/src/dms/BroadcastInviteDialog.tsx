import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';

import Dialog from '../components/Dialog';
import ShipSelector, { ShipOption } from '../components/ShipSelector';
import { useCohort, useCohorts } from '@/state/broadcasts';
import api from '@/api';
import { stringToTa } from '@/logic/utils';

interface BroadcastInviteDialogProps {
  inviteIsOpen: boolean;
  setInviteIsOpen: (open: boolean) => void;
  whom?: string;
  mode: 'add' | 'del';
  create: boolean;
}

export default function BroadcastInviteDialog({
  inviteIsOpen,
  setInviteIsOpen,
  whom,
  mode = 'add',
  create = false,
}: BroadcastInviteDialogProps) {
  const navigate = useNavigate();
  const [ships, setShips] = useState<ShipOption[]>([]);
  const targets = useCohort(whom || '').targets; //NOTE '' stubs out
  const invalidShips = ships.filter((ship) => {
    if (!targets) {
      return false;
    }
    if (mode === 'add') {
      return targets.includes(ship.value);
    } else {
      return !targets.includes(ship.value);
    }
  });
  const showError = invalidShips.length > 0;
  const [nameValue, setNameValue] = useState('');
  const { refetch: refetchCohorts } = useCohorts();

  const onEnter = useCallback(async () => {
    navigate(`/dm/broadcasts/${whom}`);
  }, [navigate, whom]);

  const submitHandler = useCallback(async () => {
    if (create && nameValue) {
      const ta = stringToTa(nameValue);
      const json = {
        'add-cohort': {
          cohort: ta,
          targets: ships.map((so) => {
            return so.value;
          })
        }
      };
      const after = () => {
        refetchCohorts();
        navigate(`/dm/broadcasts/${ta}`);
        setInviteIsOpen(false);
        setNameValue('');
        setShips([]);
      };
      api.poke({
        mark: 'broadcaster-action', app: 'broadcaster', json,
        onSuccess: ()=>after(), onError: ()=>after()
      });
    } else
    if (whom && !showError) {
      let json;
      if (mode === 'add') {
        json = {
          'add-cohort': {
            cohort: whom,
              targets: ships.map((so) => {
                return so.value;
              })
          }
        };
      } else {
        json = {
          'del-cohort': {
            cohort: whom,
              targets: ships.map((so) => {
                return so.value;
              })
          }
        };
      }
      //TODO  refetch just this specific cohort
      api.poke({
        mark: 'broadcaster-action', app: 'broadcaster', json,
        onSuccess: refetchCohorts, onError: refetchCohorts
      });
      setInviteIsOpen(false);
      setShips([]);
    }
  }, [nameValue, create, whom, showError, ships, refetchCohorts, navigate, mode, setInviteIsOpen]);

  return (
    <Dialog
      open={inviteIsOpen}
      onOpenChange={setInviteIsOpen}
      containerClass="w-full sm:max-w-xl overflow-visible"
      className="mb-64 bg-transparent p-0"
    >
      <div className="card">
        <div className="mb-4 flex flex-col space-y-4">
          <h2 className="text-lg font-bold">Add to Broadcast</h2>
          {create ? (<input
            autoFocus
            type="text"
            placeholder="Cohort Name"
            value={nameValue}
            onChange={(e)=>setNameValue(e.target.value)}
            className="input alt-highlight w-full border-gray-200 bg-transparent text-lg font-semibold focus:bg-transparent"
          />) : null}
          <ShipSelector ships={ships} setShips={setShips} onEnter={onEnter} />
          {showError && (
            <div className="text-red">
              {invalidShips.map((s, i) => {
                if (i === invalidShips.length - 1) {
                  return (
                    <>
                      {invalidShips.length > 1 ? 'and ' : ''}
                      <strong>{s.label || s.value}</strong>{' '}
                    </>
                  );
                }

                return (
                  <>
                    <strong>{s.label || s.value}</strong>
                    {`${invalidShips.length > 2 ? ',' : ''} `}
                  </>
                );
              })}
              {invalidShips.length > 1 ? 'are' : 'is'} {mode === 'add' ? 'already' : 'not'} in this chat.
            </div>
          )}
        </div>
        <div className="flex justify-end space-x-2">
          <button
            className="secondary-button"
            onClick={() => { setInviteIsOpen(false); setShips([]); }}
          >
            Cancel
          </button>
          <button
            disabled={showError}
            className="button"
            onClick={submitHandler}
          >
            {mode === 'add' ? 'Add' : 'Remove'}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

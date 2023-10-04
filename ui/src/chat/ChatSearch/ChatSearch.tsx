import cn from 'classnames';
import { VirtuosoHandle } from 'react-virtuoso';
import useDebounce from '@/logic/useDebounce';
import useMedia, { useIsMobile } from '@/logic/useMedia';
import { isTalk } from '@/logic/utils';
import React, { KeyboardEvent, PropsWithChildren, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Link } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { disableDefault } from '@/logic/utils';
import { useInfiniteChatSearch } from '@/state/chat/search';
import bigInt from 'big-integer';
import { useSafeAreaInsets } from '@/logic/native';
import ChatSearchResults from './ChatSearchResults';
import SearchBar from './SearchBar';

interface RouteParams {
  chShip: string;
  chName: string;
  query: string;
  [key: string]: string;
}

type ChatSearchProps = PropsWithChildren<{
  whom: string;
  root: string;
  placeholder: string;
}>;

export default function ChatSearch({
  whom,
  root,
  placeholder,
  children,
}: ChatSearchProps) {
  const navigate = useNavigate();
  const { query } = useParams<RouteParams>();
  const isMobile = useIsMobile();
  const isSmall = useMedia('(min-width: 768px) and (max-width: 1099px)');
  const safeAreaInsets = useSafeAreaInsets();
  const scrollerRef = React.useRef<VirtuosoHandle>(null);
  const [rawInput, setRawInput] = React.useState(query || '');
  const [selected, setSelected] = React.useState<{
    index: number;
    time: bigInt.BigInteger;
  }>({ index: -1, time: bigInt.zero });
  const { scan, isLoading, fetchNextPage } = useInfiniteChatSearch(
    whom,
    query || ''
  );
  const debouncedSearch = useDebounce((input: string) => {
    if (!input) {
      navigate(`${root}/search`);
      return;
    }

    navigate(`${root}/search/${input}`);
  }, 500);

  const onChange = useCallback(
    (newValue: string) => {
      setRawInput(newValue);
      debouncedSearch(newValue);
    },
    [debouncedSearch]
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLLabelElement>) => {
      if (event.key === 'Escape') {
        navigate(root);
      }

      if (event.key === 'Enter' && selected.index >= 0) {
        const { time } = selected;
        const writ = scan.get(time);
        const scrollTo = `?msg=${time.toString()}`;
        const to = writ?.memo.replying
          ? `${root}/message/${writ.memo.replying}${scrollTo}`
          : `${root}${scrollTo}`;
        navigate(to);
      }

      const arrow = event.key === 'ArrowDown' || event.key === 'ArrowUp';
      const scroller = scrollerRef.current;
      if (!arrow || !scroller || scan.size === 0) {
        return;
      }

      event.preventDefault();
      const next = event.key === 'ArrowDown' ? 1 : -1;
      const index =
        selected === undefined
          ? 0
          : (selected.index + next + scan.size) % scan.size;
      scroller.scrollIntoView({
        index,
        behavior: 'auto',
        done: () => {
          setSelected({ index, time: [...scan.keys()][index] });
        },
      });
    },
    [root, selected, scan, navigate]
  );

  const preventClose = useCallback((e: Event) => {
    const target = e.target as HTMLElement;
    const hasNavAncestor = target.id === 'search' || target.closest('#search');

    if (hasNavAncestor) {
      e.preventDefault();
    }
  }, []);

  const onDialogClose = useCallback(
    (open: boolean) => {
      if (!open) {
        navigate(root);
      }
    },
    [navigate, root]
  );

  const backTo = isMobile && isTalk ? '/' : root;

  return (
    <div
      className="border-b-2 border-gray-50 bg-white"
      style={{ paddingTop: safeAreaInsets.top }}
    >
      <div
        className={cn(
          'flex w-full flex-1 items-center justify-between space-x-2',
          isSmall || isMobile ? 'p-3' : 'p-2'
        )}
      >
        <div className="max-w-[240px] flex-none">
          {!isMobile && !isSmall ? children : null}
        </div>
        <div className="relative flex-1">
          <label
            className="relative flex w-full items-center"
            onKeyDown={onKeyDown}
          >
            <SearchBar
              value={rawInput}
              setValue={onChange}
              placeholder={placeholder}
              isSmall={isSmall}
            />
          </label>
          <Dialog.Root open modal={false} onOpenChange={onDialogClose}>
            <Dialog.Content
              onInteractOutside={preventClose}
              onOpenAutoFocus={disableDefault}
              className="absolute left-0 top-[40px] z-50 w-full outline-none"
            >
              <section
                tabIndex={0}
                role="listbox"
                aria-setsize={scan?.size || 0}
                id="search-results"
                className={cn(
                  'default-focus dialog border-2 border-transparent shadow-lg dark:border-gray-50',
                  query ? 'flex h-[60vh] min-h-[480px] flex-col' : 'h-[200px]'
                )}
              >
                <ChatSearchResults
                  ref={scrollerRef}
                  whom={whom}
                  root={root}
                  scan={scan}
                  isLoading={isLoading}
                  query={query}
                  selected={selected.index}
                  endReached={() => fetchNextPage()}
                />
              </section>
            </Dialog.Content>
          </Dialog.Root>
        </div>
        {!isSmall && (
          <Link to={backTo} className="default-focus secondary-button">
            Cancel
          </Link>
        )}
      </div>
    </div>
  );
}

import { useParams } from 'react-router';

import ChatSearch, { ChatSearchProps } from '@/chat/ChatSearch/ChatSearch';
import { useInfiniteChatSearch } from '@/state/chat/search';

export default function DmSearch(
  props: Omit<ChatSearchProps, 'scan' | 'query' | 'isLoading' | 'endReached'>
) {
  const { query } = useParams<{ query: string }>();
  const {
    scan,
    isLoading,
    fetchNextPage,
    depth,
    oldestMessageSearched,
    hasNextPage,
  } = useInfiniteChatSearch(props.whom, query || '');
  return (
    <ChatSearch
      {...props}
      query={query}
      scan={scan}
      isLoading={isLoading}
      endReached={fetchNextPage}
      searchDetails={{
        depth,
        oldestMessageSearched,
        numResults: scan.toArray().length,
        searchComplete: !hasNextPage,
      }}
    >
      {props.children}
    </ChatSearch>
  );
}

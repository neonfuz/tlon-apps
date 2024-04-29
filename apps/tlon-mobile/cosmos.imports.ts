// This file is automatically generated by Cosmos. Add it to .gitignore and
// only edit if you know what you're doing.
import { RendererConfig, UserModuleWrappers } from 'react-cosmos-core';

import * as fixture0 from './src/App.fixture';
import * as fixture16 from './src/fixtures/ActionSheet.fixture';
import * as fixture15 from './src/fixtures/Button.fixture';
import * as fixture14 from './src/fixtures/Channel.fixture';
import * as fixture13 from './src/fixtures/ChannelHeader.fixture';
import * as fixture12 from './src/fixtures/ChannelSwitcherSheet.fixture';
import * as fixture11 from './src/fixtures/GroupList.fixture';
import * as fixture10 from './src/fixtures/GroupListItem.fixture';
import * as fixture9 from './src/fixtures/HeaderButton.fixture';
import * as fixture8 from './src/fixtures/ImageViewer.fixture';
import * as fixture7 from './src/fixtures/Input.fixture';
import * as fixture6 from './src/fixtures/MessageActions.fixture';
import * as fixture5 from './src/fixtures/MessageInput.fixture';
import * as fixture4 from './src/fixtures/PostScreen.fixture';
import * as fixture3 from './src/fixtures/ScreenHeader.fixture';
import * as fixture2 from './src/fixtures/SearchBar.fixture';
import * as fixture1 from './src/fixtures/TlonButton.fixture';
import * as decorator0 from './src/fixtures/cosmos.decorator';

export const rendererConfig: RendererConfig = {
  playgroundUrl: 'http://localhost:5001',
  rendererUrl: null,
};

const fixtures = {
  'src/App.fixture.tsx': { module: fixture0 },
  'src/fixtures/TlonButton.fixture.tsx': { module: fixture1 },
  'src/fixtures/SearchBar.fixture.tsx': { module: fixture2 },
  'src/fixtures/ScreenHeader.fixture.tsx': { module: fixture3 },
  'src/fixtures/PostScreen.fixture.tsx': { module: fixture4 },
  'src/fixtures/MessageInput.fixture.tsx': { module: fixture5 },
  'src/fixtures/MessageActions.fixture.tsx': { module: fixture6 },
  'src/fixtures/Input.fixture.tsx': { module: fixture7 },
  'src/fixtures/ImageViewer.fixture.tsx': { module: fixture8 },
  'src/fixtures/HeaderButton.fixture.tsx': { module: fixture9 },
  'src/fixtures/GroupListItem.fixture.tsx': { module: fixture10 },
  'src/fixtures/GroupList.fixture.tsx': { module: fixture11 },
  'src/fixtures/ChannelSwitcherSheet.fixture.tsx': { module: fixture12 },
  'src/fixtures/ChannelHeader.fixture.tsx': { module: fixture13 },
  'src/fixtures/Channel.fixture.tsx': { module: fixture14 },
  'src/fixtures/Button.fixture.tsx': { module: fixture15 },
  'src/fixtures/ActionSheet.fixture.tsx': { module: fixture16 },
};

const decorators = {
  'src/fixtures/cosmos.decorator.tsx': { module: decorator0 },
};

export const moduleWrappers: UserModuleWrappers = {
  lazy: false,
  fixtures,
  decorators,
};

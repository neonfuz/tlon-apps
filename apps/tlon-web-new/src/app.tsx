// Copyright 2024, Tlon Corporation
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { Provider as TamaguiProvider } from '@tloncorp/app/provider';
import { sync } from '@tloncorp/shared';
import * as api from '@tloncorp/shared/dist/api';
import cookies from 'browser-cookies';
import { usePostHog } from 'posthog-js/react';
import React, { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  NavigateFunction,
  Route,
  BrowserRouter as Router,
  Routes,
  useNavigate,
} from 'react-router-dom';

import { ActivityScreenController } from '@/controllers/ActivityScreenController';
import { ChannelScreenController } from '@/controllers/ChannelScreenController';
import { ChatListScreenController } from '@/controllers/ChatListScreenController';
import { GroupChannelsScreenController } from '@/controllers/GroupChannelsScreenController';
import ImageViewerScreenController from '@/controllers/ImageViewerScreenController';
import { PostScreenController } from '@/controllers/PostScreenController';
import { ProfileScreenController } from '@/controllers/ProfileScreenController';
import EyrieMenu from '@/eyrie/EyrieMenu';
import { useMigrations } from '@/lib/webDb';
import { ANALYTICS_DEFAULT_PROPERTIES } from '@/logic/analytics';
import useAppUpdates, { AppUpdateContext } from '@/logic/useAppUpdates';
import useErrorHandler from '@/logic/useErrorHandler';
import useIsStandaloneMode from '@/logic/useIsStandaloneMode';
import { useIsDark } from '@/logic/useMedia';
import { preSig } from '@/logic/utils';
import { toggleDevTools, useLocalState, useShowDevTools } from '@/state/local';
import { useAnalyticsId, useLogActivity, useTheme } from '@/state/settings';

const ReactQueryDevtoolsProduction = React.lazy(() =>
  import('@tanstack/react-query-devtools/build/lib/index.prod.js').then(
    (d) => ({
      default: d.ReactQueryDevtools,
    })
  )
);

function authRedirect() {
  document.location = `${document.location.protocol}//${document.location.host}`;
}

function checkIfLoggedIn() {
  if (!('ship' in window)) {
    authRedirect();
  }

  const session = cookies.get(`urbauth-~${window.ship}`);
  if (!session) {
    fetch('/~/name')
      .then((res) => res.text())
      .then((name) => {
        if (name !== preSig(window.ship)) {
          authRedirect();
        }
      })
      .catch(() => {
        authRedirect();
      });
  }
}

function handleGridRedirect(navigate: NavigateFunction) {
  const query = new URLSearchParams(window.location.search);

  if (query.has('landscape-note')) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    navigate(decodeURIComponent(query.get('landscape-note')!));
  } else if (query.has('grid-link')) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    navigate(decodeURIComponent(query.get('landscape-link')!));
  }
}

function NewAppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ChatListScreenController />} />
      <Route path="/activity" element={<ActivityScreenController />} />
      <Route
        path="/group/:ship/:name"
        element={<GroupChannelsScreenController />}
      />
      <Route
        path="/group/:ship/:name/channel/:chType/:chShip/:chName/:postId?"
        element={<ChannelScreenController />}
      />
      <Route
        path="/group/:ship/:name/channel/:chType/:chShip/:chName/post/:authorId/:postId"
        element={<PostScreenController />}
      />
      <Route
        path="/dm/:chShip/post/:authorId/:postId"
        element={<PostScreenController />}
      />
      <Route
        path="/image/:postId/:uri"
        element={<ImageViewerScreenController />}
      />
      <Route path="/dm/:chShip" element={<ChannelScreenController />} />
      <Route path="/profile" element={<ProfileScreenController />} />
    </Routes>
  );
}

function MigrationCheck({ children }: PropsWithChildren) {
  const { success, error } = useMigrations();
  if (!success && !error) {
    return null;
  }
  if (error) {
    throw error;
  }
  return <>{children}</>;
}

const App = React.memo(function AppComponent() {
  const navigate = useNavigate();
  const handleError = useErrorHandler();
  const isDarkMode = useIsDark();

  useEffect(() => {
    handleError(() => {
      checkIfLoggedIn();
      handleGridRedirect(navigate);
    })();
  }, [handleError, navigate]);

  useEffect(() => {
    api.configureClient({
      shipName: window.our,
      shipUrl: '',
      onReset: () => sync.syncStart(),
      onChannelReset: () => sync.handleDiscontinuity(),
    });
    sync.syncStart();
  }, []);

  return (
    <div className="flex h-full w-full flex-col">
      <MigrationCheck>
        <SafeAreaProvider>
          <TamaguiProvider defaultTheme={isDarkMode ? 'dark' : 'light'}>
            <NewAppRoutes />
          </TamaguiProvider>
        </SafeAreaProvider>
      </MigrationCheck>
    </div>
  );
});

function RoutedApp() {
  const mode = import.meta.env.MODE;
  const [userThemeColor, setUserThemeColor] = useState('#ffffff');
  const showDevTools = useShowDevTools();
  const isStandAlone = useIsStandaloneMode();
  const logActivity = useLogActivity();
  const posthog = usePostHog();
  const analyticsId = useAnalyticsId();
  const { needsUpdate, triggerUpdate } = useAppUpdates();
  const body = document.querySelector('body');
  const colorSchemeFromNative =
    window.nativeOptions?.colorScheme ?? window.colorscheme;

  const appUpdateContextValue = useMemo(
    () => ({ needsUpdate, triggerUpdate }),
    [needsUpdate, triggerUpdate]
  );

  const basename = () => {
    if (mode === 'mock' || mode === 'staging') {
      return '/';
    }

    return '/apps/groups';
  };

  const theme = useTheme();
  const isDarkMode = useIsDark();

  useEffect(() => {
    const onFocus = () => {
      useLocalState.setState({ inFocus: true });
    };
    window.addEventListener('focus', onFocus);

    const onBlur = () => {
      useLocalState.setState({ inFocus: false });
    };
    window.addEventListener('blur', onBlur);

    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  useEffect(() => {
    window.toggleDevTools = () => toggleDevTools();
  }, []);

  useEffect(() => {
    if (
      (isDarkMode && theme === 'auto') ||
      theme === 'dark' ||
      colorSchemeFromNative === 'dark'
    ) {
      document.body.classList.add('dark');
      useLocalState.setState({ currentTheme: 'dark' });
      setUserThemeColor('#000000');
    } else {
      document.body.classList.remove('dark');
      useLocalState.setState({ currentTheme: 'light' });
      setUserThemeColor('#ffffff');
    }
  }, [isDarkMode, theme, colorSchemeFromNative]);

  useEffect(() => {
    if (isStandAlone) {
      // this is necessary for the desktop PWA to not have extra padding at the bottom.
      body?.style.setProperty('padding-bottom', '0px');
    }
  }, [isStandAlone, body]);

  useEffect(() => {
    if (posthog && analyticsId !== '' && logActivity) {
      posthog.identify(analyticsId, ANALYTICS_DEFAULT_PROPERTIES);
    }
  }, [posthog, analyticsId, logActivity]);

  useEffect(() => {
    if (posthog) {
      if (showDevTools) {
        posthog.debug();
      } else {
        posthog.debug(false);
      }
    }
  }, [posthog, showDevTools]);

  return (
    <Router basename={basename()}>
      <Helmet>
        <title>Tlon</title>
        <meta name="theme-color" content={userThemeColor} />
      </Helmet>
      <AppUpdateContext.Provider value={appUpdateContextValue}>
        <TooltipProvider delayDuration={0} skipDelayDuration={400}>
          <App />
        </TooltipProvider>
      </AppUpdateContext.Provider>
      {showDevTools && (
        <>
          <React.Suspense fallback={null}>
            <ReactQueryDevtoolsProduction />
          </React.Suspense>
          <div className="fixed bottom-4 right-4">
            <EyrieMenu />
          </div>
        </>
      )}
    </Router>
  );
}

export default RoutedApp;

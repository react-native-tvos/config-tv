import {
  ConfigPlugin,
  withAppDelegate,
  createRunOncePlugin,
} from '@expo/config-plugins';

type ConfigData = {
  enable?: boolean;
};

/**
 * Apply expo-no-apns configuration for Expo SDK 49 projects.
 */
const withExpoNoApns: ConfigPlugin<ConfigData> = (config, _params = {}) => {
  config = withExpoAppDelegate(config, _params);

  return config;
};

const withExpoAppDelegate: ConfigPlugin<ConfigData> = (config, _params) => {
  return withAppDelegate(config, (config) => {
    const text = config.modResults.contents;

    const linesToRemove = `
// Explicitly define remote notification delegates to ensure compatibility with some third-party libraries
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
  return [super application:application didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
}

// Explicitly define remote notification delegates to ensure compatibility with some third-party libraries
- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
  return [super application:application didFailToRegisterForRemoteNotificationsWithError:error];
}

// Explicitly define remote notification delegates to ensure compatibility with some third-party libraries
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  return [super application:application didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
}
`;
    config.modResults.contents = text.replace(linesToRemove, '');
    return config;
  });
};

const pkg = {
  // Prevent this plugin from being run more than once.
  // This pattern enables users to safely migrate off of this
  // out-of-tree `@config-plugins/expo-no-apns` to a future
  // upstream plugin in `expo-no-apns`
  name: 'expo-no-apns',
  // Indicates that this plugin is dangerously linked to a module,
  // and might not work with the latest version of that module.
  version: 'UNVERSIONED',
};

export default createRunOncePlugin(withExpoNoApns, pkg.name, pkg.version);

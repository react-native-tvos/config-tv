import { ConfigPlugin, createRunOncePlugin } from 'expo/config-plugins';

import { ConfigData } from './types';
import { withTVAndroidManifest } from './withTVAndroidManifest';
import { withTVAppleIconImages } from './withTVAppleIconImages';
import { withTVInfoPlist } from './withTVInfoPlist';
import { withTVPodfile } from './withTVPodfile';
import { withTVSplashScreen } from './withTVSplashScreen';
import { withTVXcodeProject } from './withTVXcodeProject';
import { withTVAndroidRemoveFlipper } from './withTVAndroidRemoveFlipper';
import { withTVAndroidBannerImage } from './withTVAndroidBannerImage';
import { isTVEnabled, packageNameAndVersion, verboseLog } from './utils';

const withTVNoEffect: ConfigPlugin<ConfigData> = (config, params = {}) => {
  verboseLog(
    `${packageNameAndVersion}: isTV == false, plugin will have no effect`,
    {},
  );
  return config;
};

const withTVPlugin: ConfigPlugin<ConfigData> = (config, params = {}) => {
  const isTV = isTVEnabled(params);
  if (!isTV) {
    config = withTVNoEffect(config, params);
    return config;
  }
  config = withTVAppleIconImages(config, params); // This should be done before Apple Xcode project config
  config = withTVXcodeProject(config, params);
  config = withTVPodfile(config, params);
  config = withTVInfoPlist(config, params);
  config = withTVSplashScreen(config, params);
  config = withTVAndroidBannerImage(config, params); // This should be done before Android manifest config
  config = withTVAndroidManifest(config, params);
  config = withTVAndroidRemoveFlipper(config, params);

  return config;
};

const pkg = require('../package.json');

export default createRunOncePlugin(withTVPlugin, pkg.name, pkg.version);

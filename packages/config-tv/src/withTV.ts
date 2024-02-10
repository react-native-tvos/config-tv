import { ConfigPlugin, createRunOncePlugin } from 'expo/config-plugins';

import { ConfigData } from './types';
import { withTVAndroidManifest } from './withTVAndroidManifest';
import { withTVPodfile } from './withTVPodfile';
import { withTVSplashScreen } from './withTVSplashScreen';
import { withTVXcodeProject } from './withTVXcodeProject';
import { withTVAndroidRemoveFlipper } from './withTVAndroidRemoveFlipper';
import { withTVAndroidBannerImage } from './withTVAndroidBannerImage';

const withTVPlugin: ConfigPlugin<ConfigData> = (config, params = {}) => {
  config = withTVXcodeProject(config, params);
  config = withTVPodfile(config, params);
  config = withTVSplashScreen(config, params);
  config = withTVAndroidBannerImage(config, params); // This should be done before Android manifest config
  config = withTVAndroidManifest(config, params);
  config = withTVAndroidRemoveFlipper(config, params);

  return config;
};

const pkg = require('../package.json');

export default createRunOncePlugin(withTVPlugin, pkg.name, pkg.version);

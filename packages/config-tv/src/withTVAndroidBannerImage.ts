import {
  ConfigPlugin,
  WarningAggregator,
  withDangerousMod,
} from 'expo/config-plugins';
import { existsSync, promises } from 'fs';
import path from 'path';

import { ConfigData } from './types';
import { isTVEnabled, showVerboseWarnings, androidTVBanner } from './utils';

const pkg = require('../package.json');

const drawableDirectoryNames = [
  'drawable',
  'drawable-hdpi',
  'drawable-mdpi',
  'drawable-xhdpi',
  'drawable-xxhdpi',
  'drawable-xxxhdpi',
];

/** Copies TV banner image to the Android resources drawable folders. If image does not exist, throw an exception. */
export const withTVAndroidBannerImage: ConfigPlugin<ConfigData> = (
  c,
  params = {},
) => {
  const isTV = isTVEnabled(params);
  const verbose = showVerboseWarnings(params);
  const androidTVBannerPath = androidTVBanner(params);

  return withDangerousMod(c, [
    'android',
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    async (config) => {
      if (!isTV) {
        return config;
      }
      if (!androidTVBannerPath) {
        return config;
      }

      if (verbose) {
        WarningAggregator.addWarningAndroid(
          'manifest',
          `${pkg.name}@${pkg.version}: adding TV banner image ${androidTVBannerPath} to Android resources`,
        );
      }

      for (const drawableDirectoryName of drawableDirectoryNames) {
        const drawableDirectoryPath = path.join(
          config.modRequest.platformProjectRoot,
          'app',
          'src',
          'main',
          'res',
          drawableDirectoryName,
        );
        if (!existsSync(drawableDirectoryPath)) {
          await promises.mkdir(drawableDirectoryPath);
        }
        await promises.copyFile(
          androidTVBannerPath,
          path.join(drawableDirectoryPath, 'tv_banner.png'),
        );
      }
      return config;
    },
  ]);
};

import { ConfigPlugin, withDangerousMod } from 'expo/config-plugins';
import { existsSync, promises } from 'fs';
import path from 'path';

import { ConfigData } from './types';
import { androidTVBanner, verboseLog } from './utils';

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
  const androidTVBannerPath = androidTVBanner(params);

  return withDangerousMod(c, [
    'android',
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    async (config) => {
      if (!androidTVBannerPath) {
        return config;
      }

      verboseLog(
        `adding TV banner image ${androidTVBannerPath} to Android resources`,
        {
          params,
          platform: 'android',
          property: 'manifest',
        },
      );

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

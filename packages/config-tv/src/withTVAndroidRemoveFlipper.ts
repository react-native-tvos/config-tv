import { ConfigPlugin, withDangerousMod } from 'expo/config-plugins';
import { promises } from 'fs';
import { globSync } from 'glob';
import path from 'path';

import { ConfigData } from './types';
import { shouldRemoveFlipperOnAndroid, verboseLog } from './utils';

/** Dangerously makes or reverts TV changes in the project Podfile. */
export const withTVAndroidRemoveFlipper: ConfigPlugin<ConfigData> = (
  c,
  params = {},
) => {
  const androidRemoveFlipper = shouldRemoveFlipperOnAndroid(params);

  return withDangerousMod(c, [
    'android',
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    async (config) => {
      if (androidRemoveFlipper) {
        // Modify main application
        const mainApplicationFile = mainApplicationFilePath(
          config.modRequest.platformProjectRoot,
        );
        verboseLog('removing Flipper from MainApplication file', {
          params,
          platform: 'android',
          property: 'manifest',
        });
        const mainApplicationContents = await promises.readFile(
          mainApplicationFile,
          'utf8',
        );
        const mainApplicationModifiedContents = commentOutLinesWithString(
          mainApplicationContents,
          'Flipper',
        );
        await promises.writeFile(
          mainApplicationFile,
          mainApplicationModifiedContents,
          'utf-8',
        );

        // Modify app/build.gradle
        const buildGradleFile = appBuildGradleFilePath(
          config.modRequest.platformProjectRoot,
        );
        verboseLog('removing Flipper from android/app/build.gradle', {
          params,
          platform: 'android',
          property: 'manifest',
        });
        const buildGradleContents = await promises.readFile(
          buildGradleFile,
          'utf-8',
        );
        const buildGradleModifiedContents = commentOutLinesWithString(
          buildGradleContents,
          'flipper',
        );
        await promises.writeFile(
          buildGradleFile,
          buildGradleModifiedContents,
          'utf-8',
        );
      }

      return config;
    },
  ]);
};

const mainApplicationFilePath = (androidRoot: string) => {
  const paths = globSync(`${androidRoot}/**/MainApplication.*`);
  if (paths.length > 0) {
    return paths[0];
  } else {
    throw new Error('AndroidApplication path not found');
  }
};

const appBuildGradleFilePath = (androidRoot: string) =>
  path.resolve(androidRoot, 'app', 'build.gradle');

const commentOutLinesWithString = (contents: string, searchString: string) => {
  return contents
    .split('\n')
    .map((line) => {
      if (line.indexOf(searchString) !== -1) {
        return line.replace(/^/, '// ');
      }
      return line;
    })
    .join('\n');
};

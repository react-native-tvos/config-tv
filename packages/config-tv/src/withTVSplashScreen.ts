import { ConfigPlugin, withDangerousMod } from 'expo/config-plugins';
import { promises } from 'fs';
import path from 'path';

import { ConfigData } from './types';
import { packageNameAndVersion, verboseLog } from './utils';

/** Dangerously makes changes needed for TV in SplashScreen.storyboard. */
export const withTVSplashScreen: ConfigPlugin<ConfigData> = (
  config,
  params = {},
) => {
  return withDangerousMod(config, [
    'ios',
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    async (config) => {
      if (!config.modRequest.projectName) {
        throw new Error(
          `The ${packageNameAndVersion} plugin requires a configured project name.`,
        );
      }
      const file = path.join(
        config.modRequest.platformProjectRoot,
        config.modRequest.projectName,
        'SplashScreen.storyboard',
      );

      const contents = await promises.readFile(file, 'utf8');

      const modifiedContents = addTVSplashScreenModifications(contents);

      verboseLog('modifying SplashScreen.storyboard for tvOS', {
        params,
        platform: 'ios',
        property: 'splashscreen',
      });
      await promises.writeFile(file, modifiedContents, 'utf-8');

      return config;
    },
  ]);
};

const splashScreenStringsForPhone = [
  'com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB',
  'targetRuntime="iOS.CocoaTouch"',
  'id="retina5_5"',
  '<deployment identifier="iOS"/>',
];

const splashScreenStringsForTV = [
  'com.apple.InterfaceBuilder.AppleTV.Storyboard',
  'targetRuntime="AppleTV"',
  'id="appleTV"',
  '<deployment identifier="tvOS"/>',
];

function modifySource(
  src: string,
  originalStrings: string[],
  replacementStrings: string[],
): string {
  let modifiedSource = src;
  originalStrings.forEach((s, i) => {
    const original = new RegExp(`${s}`, 'g');
    const replacement = replacementStrings[i];
    modifiedSource = modifiedSource.replace(original, replacement);
  });
  return modifiedSource;
}

export function addTVSplashScreenModifications(src: string): string {
  return modifySource(
    src,
    splashScreenStringsForPhone,
    splashScreenStringsForTV,
  );
}

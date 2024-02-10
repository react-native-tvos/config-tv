import { ExpoConfig } from 'expo/config';
import {
  AndroidConfig,
  ConfigPlugin,
  withAndroidManifest,
} from 'expo/config-plugins';
import { promises as fs } from 'fs';
import path from 'path';

import { ConfigData } from './types';
import { androidTVBanner, isTVEnabled, verboseLog } from './utils';

const pkg = require('../package.json');

const { getMainActivity, getMainApplication } = AndroidConfig.Manifest;

export const withTVAndroidManifest: ConfigPlugin<ConfigData> = (
  config,
  params = {},
) => {
  const isTV = isTVEnabled(params);
  const androidTVBannerPath = androidTVBanner(params);

  return withAndroidManifest(config, async (config) => {
    if (!isTV) {
      // nothing to do
      return config;
    }
    config.modResults = await setLeanBackLauncherIntent(
      config,
      config.modResults,
      params,
    );
    config.modResults = await removePortraitOrientation(
      config,
      config.modResults,
      params,
    );
    if (androidTVBannerPath) {
      config.modResults = setTVBanner(
        config,
        config.modResults,
        params,
        androidTVBannerPath,
      );
    }
    return config;
  });
};

const LEANBACK_LAUNCHER_CATEGORY = 'android.intent.category.LEANBACK_LAUNCHER';

function getMainLaunchIntent(
  androidManifest: AndroidConfig.Manifest.AndroidManifest,
) {
  const mainActivity = getMainActivity(androidManifest);
  const intentFilters = mainActivity?.['intent-filter'];
  const mainLaunchIntents = (intentFilters ?? []).filter((i) => {
    const action = i.action ?? [];
    if (action.length === 0) {
      return false;
    }
    return action[0]?.$['android:name'] === 'android.intent.action.MAIN';
  });
  return mainLaunchIntents.length ? mainLaunchIntents[0] : undefined;
}

function leanbackLauncherCategoryExistsInMainLaunchIntent(
  mainLaunchIntent: AndroidConfig.Manifest.ManifestIntentFilter,
): boolean {
  const mainLaunchCategories = mainLaunchIntent.category ?? [];
  const mainLaunchIntentCategoriesWithLeanbackLauncher =
    mainLaunchCategories.filter(
      (c) => c.$['android:name'] === LEANBACK_LAUNCHER_CATEGORY,
    );
  return mainLaunchIntentCategoriesWithLeanbackLauncher.length > 0;
}

export function setLeanBackLauncherIntent(
  _config: Pick<ExpoConfig, 'android'>,
  androidManifest: AndroidConfig.Manifest.AndroidManifest,
  params: ConfigData,
): AndroidConfig.Manifest.AndroidManifest {
  const mainLaunchIntent = getMainLaunchIntent(androidManifest);
  if (!mainLaunchIntent) {
    throw new Error(
      `${pkg.name}@${pkg.version}: no main intent in main activity of Android manifest`,
    );
  }
  if (!leanbackLauncherCategoryExistsInMainLaunchIntent(mainLaunchIntent)) {
    // Leanback needs to be added
    verboseLog(
      'adding TV leanback launcher category to main intent in AndroidManifest.xml',
      {
        params,
        platform: 'android',
        property: 'manifest',
      },
    );
    const mainLaunchCategories = mainLaunchIntent.category ?? [];
    mainLaunchCategories.push({
      $: {
        'android:name': LEANBACK_LAUNCHER_CATEGORY,
      },
    });
    mainLaunchIntent.category = mainLaunchCategories;
  }
  return androidManifest;
}

export async function removePortraitOrientation(
  _config: Pick<ExpoConfig, 'android'>,
  androidManifest: AndroidConfig.Manifest.AndroidManifest,
  params: ConfigData,
): Promise<AndroidConfig.Manifest.AndroidManifest> {
  const mainActivity = getMainActivity(androidManifest);
  if (mainActivity?.$) {
    const metadata: typeof mainActivity.$ = mainActivity?.$ ?? {};
    if (metadata['android:screenOrientation']) {
      verboseLog('removing screen orientation from AndroidManifest.xml', {
        params,
        platform: 'android',
        property: 'manifest',
      });
      delete metadata['android:screenOrientation'];
    }
  }
  return androidManifest;
}

export function setTVBanner(
  _config: Pick<ExpoConfig, 'android'>,
  androidManifest: AndroidConfig.Manifest.AndroidManifest,
  params: ConfigData,
  androidTVBannerPath: string | undefined,
): AndroidConfig.Manifest.AndroidManifest {
  if (!androidTVBannerPath) {
    return androidManifest;
  }
  const mainApplication = getMainApplication(androidManifest);
  if (mainApplication?.$) {
    const metadata: typeof mainApplication.$ = mainApplication?.$ ?? {};
    verboseLog('adding TV banner to AndroidManifest.xml', {
      params,
      platform: 'android',
      property: 'manifest',
    });
    metadata['android:banner'] = '@drawable/tv_banner';
  }
  return androidManifest;
}

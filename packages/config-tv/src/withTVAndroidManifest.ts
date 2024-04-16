import { ExpoConfig } from 'expo/config';
import {
  AndroidConfig,
  ConfigPlugin,
  withAndroidManifest,
} from 'expo/config-plugins';

import { ConfigData } from './types';
import {
  androidTVBanner,
  isAndroidTVRequired,
  packageNameAndVersion,
  verboseLog,
} from './utils';

const { getMainActivity, getMainApplication } = AndroidConfig.Manifest;

export const withTVAndroidManifest: ConfigPlugin<ConfigData> = (
  config,
  params = {},
) => {
  const androidTVBannerPath = androidTVBanner(params);

  return withAndroidManifest(config, (config) => {
    config.modResults = setLeanBackLauncherIntent(
      config,
      config.modResults,
      params,
    );
    config.modResults = removePortraitOrientation(
      config,
      config.modResults,
      params,
    );
    config.modResults = addTouchscreenHardwareFeatureToManifest(
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
      `${packageNameAndVersion}: no main intent in main activity of Android manifest`,
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

export function removePortraitOrientation(
  _config: Pick<ExpoConfig, 'android'>,
  androidManifest: AndroidConfig.Manifest.AndroidManifest,
  params: ConfigData,
): AndroidConfig.Manifest.AndroidManifest {
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

export function addTouchscreenHardwareFeatureToManifest(
  _config: Pick<ExpoConfig, 'android'>,
  androidManifest: AndroidConfig.Manifest.AndroidManifest,
  params: ConfigData,
): AndroidConfig.Manifest.AndroidManifest {
  // Add `<uses-feature android:name="android.hardware.touchscreen" android:required="false"/>` to the AndroidManifest.xml
  if (!Array.isArray(androidManifest.manifest['uses-feature'])) {
    androidManifest.manifest['uses-feature'] = [];
  }
  if (
    !androidManifest.manifest['uses-feature'].find(
      (item) => item.$['android:name'] === 'android.hardware.touchscreen',
    ) &&
    !androidManifest.manifest['uses-feature'].find(
      (item) => item.$['android:name'] === 'android.hardware.faketouch',
    ) &&
    !androidManifest.manifest['uses-feature'].find(
      (item) => item.$['android:name'] === 'android.software.leanback',
    )
  ) {
    verboseLog(
      'adding TV touchscreen hardware feature tag to AndroidManifest.xml',
      {
        params,
        platform: 'android',
        property: 'manifest',
      },
    );
    androidManifest.manifest['uses-feature']?.push({
      $: {
        'android:name': 'android.hardware.touchscreen',
        'android:required': 'false',
      },
    });
    androidManifest.manifest['uses-feature']?.push({
      $: {
        'android:name': 'android.hardware.faketouch',
        'android:required': 'false',
      },
    });
    // add android.software.leanback to false
    androidManifest.manifest['uses-feature']?.push({
      $: {
        'android:name': 'android.software.leanback',
        'android:required': isAndroidTVRequired(params) ? 'true' : 'false',
      },
    });
  }
  return androidManifest;
}

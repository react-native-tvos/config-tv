import { WarningAggregator } from 'expo/config-plugins';
import { boolish } from 'getenv';

import { ConfigData } from './types';

class Env {
  /** Enable prebuild for TV */
  get EXPO_TV() {
    return boolish('EXPO_TV', false);
  }
}

const debug = require('debug')(
  'expo:react-native-tvos:config-tv',
) as typeof console.log;

const env = new Env();

const pkg = require('../package.json');

const defaultTvosDeploymentVersion = '13.4';

export function isTVEnabled(params: ConfigData): boolean {
  return env.EXPO_TV || (params?.isTV ?? false);
}

export function showVerboseWarnings(params: ConfigData): boolean {
  return params?.showVerboseWarnings ?? false;
}

export function tvosDeploymentTarget(params: ConfigData): string {
  return params?.tvosDeploymentTarget ?? defaultTvosDeploymentVersion;
}

export function shouldRemoveFlipperOnAndroid(params: ConfigData): boolean {
  return params?.removeFlipperOnAndroid ?? true;
}

export function androidTVBanner(params: ConfigData): string | undefined {
  return params?.androidTVBanner;
}

export function verboseLog(
  message: string,
  options: {
    params: ConfigData;
    platform: 'android' | 'ios';
    property: string;
  },
) {
  const { params, platform, property } = options;
  const verbose = showVerboseWarnings(params);
  if (verbose) {
    WarningAggregator.addWarningForPlatform(
      platform,
      property,
      `${pkg.name}@${pkg.version}: ${message}`,
    );
  } else {
    debug(`${property}: ${message}`);
  }
}

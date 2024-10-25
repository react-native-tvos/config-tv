import { boolish } from "getenv";

import { ConfigData } from "../types";

class Env {
  /** Enable prebuild for TV */
  get EXPO_TV() {
    return boolish("EXPO_TV", false);
  }
}

const env = new Env();

const pkg = require("../../package.json");

const defaultTvosDeploymentVersion = "13.4";

export const packageNameAndVersion = `${pkg.name}@${pkg.version}`;

export function isTVEnabled(params: ConfigData): boolean {
  return env.EXPO_TV || (params?.isTV ?? false);
}

export function tvosDeploymentTarget(params: ConfigData): string {
  return params?.tvosDeploymentTarget ?? defaultTvosDeploymentVersion;
}

export function shouldRemoveFlipperOnAndroid(params: ConfigData): boolean {
  return params?.removeFlipperOnAndroid ?? true;
}

export function isAndroidTVRequired(params: ConfigData): boolean {
  return params?.androidTVRequired ?? false;
}

export function androidTVBanner(params: ConfigData): string | undefined {
  return params?.androidTVBanner;
}

export function androidTVIcon(params: ConfigData): string | undefined {
  return params?.androidTVIcon;
}

export const appleTVImageTypes = [
  "icon",
  "iconSmall",
  "iconSmall2x",
  "topShelf",
  "topShelf2x",
  "topShelfWide",
  "topShelfWide2x",
];

export function appleTVImagePathForType(params: ConfigData, imageType: string) {
  switch (imageType) {
    case "icon":
      return params?.appleTVImages?.icon;
    case "iconSmall":
      return params?.appleTVImages?.iconSmall;
    case "iconSmall2x":
      return params?.appleTVImages?.iconSmall2x;
    case "topShelf":
      return params?.appleTVImages?.topShelf;
    case "topShelf2x":
      return params?.appleTVImages?.topShelf2x;
    case "topShelfWide":
      return params?.appleTVImages?.topShelfWide;
    case "topShelfWide2x":
      return params?.appleTVImages?.topShelfWide2x;
    default:
      return undefined;
  }
}

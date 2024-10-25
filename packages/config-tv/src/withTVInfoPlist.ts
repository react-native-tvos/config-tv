import { ConfigPlugin, withInfoPlist } from "expo/config-plugins";

import { ConfigData } from "./types";
import { verboseLog } from "./utils";

export const withTVInfoPlist: ConfigPlugin<ConfigData> = (c, params = {}) => {
  verboseLog("Modifying UIRequiredDeviceCapabilities for TV", {
    params,
    platform: "ios",
    property: "Info.plist",
  });
  return withInfoPlist(c, (config) => {
    config.modResults.UIRequiredDeviceCapabilities = ["arm64"];
    return config;
  });
};

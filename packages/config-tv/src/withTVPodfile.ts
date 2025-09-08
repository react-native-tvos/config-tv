import { mergeContents } from "@expo/config-plugins/build/utils/generateCode";
import { ConfigPlugin, withDangerousMod } from "expo/config-plugins";
import { promises } from "fs";
import path from "path";

import { ConfigData } from "./types";
import { verboseLog } from "./utils";

/** Dangerously makes or reverts TV changes in the project Podfile. */
export const withTVPodfile: ConfigPlugin<ConfigData> = (c, params = {}) => {
  return withDangerousMod(c, [
    "ios",
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    async (config) => {
      const file = path.join(config.modRequest.platformProjectRoot, "Podfile");

      const contents = await promises.readFile(file, "utf8");

      const modifiedContents = addTVPodfileModifications(contents);

      verboseLog("modifying Podfile for tvOS", {
        params,
        platform: "ios",
        property: "podfile",
      });
      await promises.writeFile(file, modifiedContents, "utf-8");

      return config;
    },
  ]);
};

// const MOD_TAG = "react-native-tvos-import";

export function addTVPodfileModifications(src: string): string {
  if (src.indexOf("platform :tvos") !== -1) {
    return src;
  }
  // We no longer need the custom podspecs source
  /*
  const newSrc = mergeContents({
    tag: MOD_TAG,
    src,
    newSrc:
      "source 'https://github.com/react-native-tvos/react-native-tvos-podspecs.git'\nsource 'https://cdn.cocoapods.org/'\n",
    anchor: /^/,
    offset: 0,
    comment: "#",
  }).contents;
   */
  return src.replace("platform :ios", "platform :tvos");
}

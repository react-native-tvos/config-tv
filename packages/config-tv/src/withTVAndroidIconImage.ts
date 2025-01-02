import { ConfigPlugin, withDangerousMod } from "expo/config-plugins";
import { existsSync, promises } from "fs";
import path from "path";

import { ConfigData } from "./types";
import { androidTVIcon, verboseLog } from "./utils";

const drawableDirectoryNames = [
  "drawable",
  "mipmap",
  "mipmap-hdpi",
  "mipmap-mdpi",
  "mipmap-xhdpi",
  "mipmap-xxhdpi",
  "mipmap-xxxhdpi",
];

/** Copies TV Icon image to the Android resources drawable folders. If image does not exist, throw an exception. */
export const withTVAndroidIconImage: ConfigPlugin<ConfigData> = (
  c,
  params = {},
) => {
  const androidTVIconPath = androidTVIcon(params);

  return withDangerousMod(c, [
    "android",
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    async (config) => {
      if (!androidTVIconPath) {
        return config;
      }

      verboseLog(
        `adding TV Icon image ${androidTVIconPath} to Android resources`,
        {
          params,
          platform: "android",
          property: "manifest",
        },
      );

      for (const drawableDirectoryName of drawableDirectoryNames) {
        const drawableDirectoryPath = path.join(
          config.modRequest.platformProjectRoot,
          "app",
          "src",
          "main",
          "res",
          drawableDirectoryName,
        );
        if (!existsSync(drawableDirectoryPath)) {
          await promises.mkdir(drawableDirectoryPath);
        }
        if (drawableDirectoryName === "drawable") {
          await promises.copyFile(
            androidTVIconPath,
            path.join(drawableDirectoryPath, "tv_icon.png"),
          );
        } else {
          // SDK 52 adds a webp ic_launcher, which could lead to duplicate resource build error
          if (!existsSync(path.join(drawableDirectoryPath, "ic_launcher.webp"))) {
            await promises.copyFile(
              androidTVIconPath,
              path.join(drawableDirectoryPath, "ic_launcher.png"),
            );
          }
          if (!existsSync(path.join(drawableDirectoryPath, "ic_launcher_round.webp"))) {
            await promises.copyFile(
                androidTVIconPath,
                path.join(drawableDirectoryPath, "ic_launcher_round.png"),
            );
          }
        }
      }
      return config;
    },
  ]);
};

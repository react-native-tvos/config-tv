import { ConfigPlugin, IOSConfig, withDangerousMod } from "expo/config-plugins";
import { existsSync } from "fs";
import path from "path";

import { ConfigData } from "./types";
import {
  appleTVImageTypes,
  appleTVImagePathForType,
  verboseLog,
  createBrandAssetsAsync,
  SourceImageJson,
  type SourceBrandAssetsJson,
} from "./utils";

const { getProjectName } = IOSConfig.XcodeUtils;

/**
 * Constructs Apple TV brand assets from images passed into the `appleTVImages` plugin property
 * If any images do not exist, an exception is thrown.
 */
export const withTVAppleIconImages: ConfigPlugin<ConfigData> = (
  c,
  params = {},
) => {
  return withDangerousMod(c, [
    "ios",
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    async (config) => {
      if (!params.appleTVImages) {
        return config;
      }

      verboseLog(`adding Apple TV brand assets to Apple TV native code`, {
        params,
        platform: "ios",
        property: "xcodeproject",
      });

      appleTVImageTypes.forEach((imageType) => {
        const imagePath = appleTVImagePathForType(params, imageType);
        if (!imagePath) {
          throw new Error(`One or more image paths not defined`);
        }
        if (!existsSync(imagePath)) {
          throw new Error(`No image found at path ${imagePath}`);
        }
      });

      const projectRoot = config.modRequest.projectRoot;

      const iosImagesPath = path.join(
        getIosNamedProjectPath(projectRoot),
        IMAGES_PATH,
      );

      const iconSmallSourceImages: SourceImageJson[] = [
        {
          path: params.appleTVImages.iconSmall,
          scale: "1x",
        },
        {
          path: params.appleTVImages.iconSmall2x,
          scale: "2x",
        },
      ];

      const iconLargeSourceImages: SourceImageJson[] = [
        {
          path: params.appleTVImages.icon,
          scale: "1x",
        },
      ];

      /*
      const appStoreIconSourceImages: SourceImageJson[] = [
        {
          path: params.appleTVImages.icon,
        },
      ];
       */

      const topShelfSourceImages: SourceImageJson[] = [
        {
          path: params.appleTVImages.topShelf,
          scale: "1x",
        },
        {
          path: params.appleTVImages.topShelf2x,
          scale: "2x",
        },
      ];

      const topShelfWideSourceImages: SourceImageJson[] = [
        {
          path: params.appleTVImages.topShelfWide,
          scale: "1x",
        },
        {
          path: params.appleTVImages.topShelfWide2x,
          scale: "2x",
        },
      ];

      const sourceBrandAssets: SourceBrandAssetsJson = {
        name: "TVAppIcon",
        assets: [
          {
            role: "top-shelf-image",
            size: "1920x720",
            imageSet: {
              name: "Top Shelf Image",
              sourceImages: topShelfSourceImages,
            },
          },
          {
            role: "top-shelf-image-wide",
            size: "2320x720",
            imageSet: {
              name: "Top Shelf Image Wide",
              sourceImages: topShelfWideSourceImages,
            },
          },
          /*
          {
            role: 'primary-app-icon',
            size: '1280x768',
            imageStack: {
              name: 'App Icon - App Store',
              sourceLayers: [
                {
                  name: 'Front',
                  sourceImages: appStoreIconSourceImages,
                },
                {
                  name: 'Middle',
                  sourceImages: appStoreIconSourceImages,
                },
                {
                  name: 'Back',
                  sourceImages: appStoreIconSourceImages,
                },
              ],
            },
          },
           */
          {
            role: "primary-app-icon",
            size: "400x240",
            imageStack: {
              name: "App Icon - Small",
              sourceLayers: [
                {
                  name: "Front",
                  sourceImages: iconSmallSourceImages,
                },
                {
                  name: "Middle",
                  sourceImages: iconSmallSourceImages,
                },
                {
                  name: "Back",
                  sourceImages: iconSmallSourceImages,
                },
              ],
            },
          },
          {
            role: "primary-app-icon",
            size: "1280x768",
            imageStack: {
              name: "App Icon - Large",
              sourceLayers: [
                {
                  name: "Front",
                  sourceImages: iconLargeSourceImages,
                },
                {
                  name: "Middle",
                  sourceImages: iconLargeSourceImages,
                },
                {
                  name: "Back",
                  sourceImages: iconLargeSourceImages,
                },
              ],
            },
          },
        ],
      };

      await createBrandAssetsAsync(iosImagesPath, sourceBrandAssets);

      return config;
    },
  ]);
};

function getIosNamedProjectPath(projectRoot: string): string {
  const projectName = getProjectName(projectRoot);
  return path.join(projectRoot, "ios", projectName);
}

const IMAGES_PATH = "Images.xcassets";

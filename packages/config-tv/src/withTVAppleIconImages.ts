import { ConfigPlugin, IOSConfig, withDangerousMod } from "expo/config-plugins";
import { existsSync } from "fs";
import path from "path";

import { AppleTVIconLayers, AppleTVImages, ConfigData } from "./types";
import {
  verboseLog,
  createBrandAssetsAsync,
  SourceImageJson,
  SourceImageLayerJson,
  type SourceBrandAssetsJson,
} from "./utils";

const { getProjectName } = IOSConfig.XcodeUtils;

// tvOS draws the layers of an app icon in this order, front first
const layerNames = ["Front", "Middle", "Back"] as const;

type LayerName = (typeof layerNames)[number];

type IconScale = {
  scale: string;
  image?: string;
  layers?: AppleTVIconLayers;
};

/**
 * Maps one scale of an app icon to the image for each of its layers.
 * A single image is used for every layer, which renders as a flat icon.
 */
function layerImagesForScale(
  iconScale: IconScale,
): Partial<Record<LayerName, string>> {
  if (iconScale.layers) {
    const { front, middle, back } = iconScale.layers;
    return middle
      ? { Front: front, Middle: middle, Back: back }
      : { Front: front, Back: back };
  }
  if (iconScale.image) {
    return {
      Front: iconScale.image,
      Middle: iconScale.image,
      Back: iconScale.image,
    };
  }
  return {};
}

function sourceImages(
  scales: { scale: string; image?: string }[],
): SourceImageJson[] {
  return scales.flatMap(({ scale, image }) =>
    image ? [{ path: image, scale }] : [],
  );
}

function sourceLayersForIcon(iconScales: IconScale[]): SourceImageLayerJson[] {
  const layerImagesByScale = iconScales.map((iconScale) => ({
    scale: iconScale.scale,
    layerImages: layerImagesForScale(iconScale),
  }));
  return layerNames
    .map((name) => ({
      name,
      sourceImages: layerImagesByScale.flatMap(({ scale, layerImages }) =>
        sourceImages([{ scale, image: layerImages[name] }]),
      ),
    }))
    .filter((layer) => layer.sourceImages.length > 0);
}

/**
 * Builds the Apple TV brand assets from the `appleTVImages` plugin property.
 * If any image is not defined, or does not exist, an exception is thrown.
 */
export function appleTVSourceBrandAssets(
  images: AppleTVImages,
): SourceBrandAssetsJson {
  const iconSmallScales: IconScale[] = [
    { scale: "1x", image: images.iconSmall, layers: images.iconSmallLayers },
    {
      scale: "2x",
      image: images.iconSmall2x,
      layers: images.iconSmall2xLayers,
    },
  ];

  const iconLargeScales: IconScale[] = [
    { scale: "1x", image: images.icon, layers: images.iconLayers },
  ];

  // An app icon scale can be given as a single image or as layers, but not neither
  const everyImageDefined =
    [...iconSmallScales, ...iconLargeScales].every(
      (iconScale) => iconScale.image ?? iconScale.layers,
    ) &&
    [
      images.topShelf,
      images.topShelf2x,
      images.topShelfWide,
      images.topShelfWide2x,
    ].every((image) => image !== undefined);
  if (!everyImageDefined) {
    throw new Error(`One or more image paths not defined`);
  }

  const iconSmallSourceLayers = sourceLayersForIcon(iconSmallScales);

  const iconLargeSourceLayers = sourceLayersForIcon(iconLargeScales);

  /*
  const appStoreIconSourceImages: SourceImageJson[] = [
    {
      path: images.icon,
    },
  ];
   */

  const topShelfSourceImages = sourceImages([
    { scale: "1x", image: images.topShelf },
    { scale: "2x", image: images.topShelf2x },
  ]);

  const topShelfWideSourceImages = sourceImages([
    { scale: "1x", image: images.topShelfWide },
    { scale: "2x", image: images.topShelfWide2x },
  ]);

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
          sourceLayers: iconSmallSourceLayers,
        },
      },
      {
        role: "primary-app-icon",
        size: "1280x768",
        imageStack: {
          name: "App Icon - Large",
          sourceLayers: iconLargeSourceLayers,
        },
      },
    ],
  };

  for (const asset of sourceBrandAssets.assets) {
    const assetSourceImages = [
      ...(asset.imageSet?.sourceImages ?? []),
      ...(asset.imageStack?.sourceLayers ?? []).flatMap(
        (layer) => layer.sourceImages,
      ),
    ];
    for (const image of assetSourceImages) {
      if (!existsSync(image.path)) {
        throw new Error(`No image found at path ${image.path}`);
      }
    }
  }

  return sourceBrandAssets;
}

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

      const projectRoot = config.modRequest.projectRoot;

      const iosImagesPath = path.join(
        getIosNamedProjectPath(projectRoot),
        IMAGES_PATH,
      );

      await createBrandAssetsAsync(
        iosImagesPath,
        appleTVSourceBrandAssets(params.appleTVImages),
      );

      return config;
    },
  ]);
};

function getIosNamedProjectPath(projectRoot: string): string {
  const projectName = getProjectName(projectRoot);
  return path.join(projectRoot, "ios", projectName);
}

const IMAGES_PATH = "Images.xcassets";

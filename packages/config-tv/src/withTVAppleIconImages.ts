import { ConfigPlugin, IOSConfig, withDangerousMod } from "expo/config-plugins";
import { existsSync } from "fs";
import path from "path";

import { AppleTVIconLayers, AppleTVImages, ConfigData } from "./types";
import {
  verboseLog,
  createBrandAssetsAsync,
  existingBrandAssetsAsync,
  ContentsJsonAsset,
  SourceBrandAssetJson,
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

type CandidateBrandAsset = SourceBrandAssetJson & { required: boolean };

function assetName(asset: SourceBrandAssetJson): string {
  return asset.imageSet?.name ?? asset.imageStack?.name ?? asset.role;
}

function hasSourceImages(asset: SourceBrandAssetJson): boolean {
  return (
    (asset.imageSet?.sourceImages.length ?? 0) > 0 ||
    (asset.imageStack?.sourceLayers.length ?? 0) > 0
  );
}

/**
 * Returns the brand asset to write, as a single element array so that an optional asset
 * with no image anywhere can be left out entirely.
 */
function resolveBrandAsset(
  asset: SourceBrandAssetJson,
  required: boolean,
  existingAssets: ContentsJsonAsset[],
): SourceBrandAssetJson[] {
  if (hasSourceImages(asset)) {
    return [asset];
  }
  const existingFilename = existingAssets.find(
    (existing) => existing.role === asset.role && existing.size === asset.size,
  )?.filename;
  if (existingFilename) {
    verboseLog(`keeping the existing ${assetName(asset)} brand asset`, {
      platform: "ios",
      property: "xcodeproject",
    });
    return [{ role: asset.role, size: asset.size, existingFilename }];
  }
  if (required) {
    throw new Error(`No image or existing brand asset for ${assetName(asset)}`);
  }
  verboseLog(
    `no image or existing brand asset for ${assetName(asset)}, it will not be set`,
    { platform: "ios", property: "xcodeproject" },
  );
  return [];
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
 * A brand asset with no image given keeps the one already in the catalog. The app icons
 * are required, so an exception is thrown when one is in neither place. If an image is
 * given but does not exist, an exception is thrown.
 */
export function appleTVSourceBrandAssets(
  images: AppleTVImages,
  existingAssets: ContentsJsonAsset[] = [],
): SourceBrandAssetsJson {
  const iconSmallSourceLayers = sourceLayersForIcon([
    { scale: "1x", image: images.iconSmall, layers: images.iconSmallLayers },
    {
      scale: "2x",
      image: images.iconSmall2x,
      layers: images.iconSmall2xLayers,
    },
  ]);

  const iconLargeSourceLayers = sourceLayersForIcon([
    { scale: "1x", image: images.icon, layers: images.iconLayers },
  ]);

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

  const candidateAssets: CandidateBrandAsset[] = [
    {
      required: false,
      role: "top-shelf-image",
      size: "1920x720",
      imageSet: {
        name: "Top Shelf Image",
        sourceImages: topShelfSourceImages,
      },
    },
    {
      required: false,
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
      required: true,
      role: "primary-app-icon",
      size: "400x240",
      imageStack: {
        name: "App Icon - Small",
        sourceLayers: iconSmallSourceLayers,
      },
    },
    {
      required: true,
      role: "primary-app-icon",
      size: "1280x768",
      imageStack: {
        name: "App Icon - Large",
        sourceLayers: iconLargeSourceLayers,
      },
    },
  ];

  const sourceBrandAssets: SourceBrandAssetsJson = {
    name: BRAND_ASSETS_NAME,
    assets: candidateAssets.flatMap(({ required, ...asset }) =>
      resolveBrandAsset(asset, required, existingAssets),
    ),
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
        appleTVSourceBrandAssets(
          params.appleTVImages,
          await existingBrandAssetsAsync(iosImagesPath, BRAND_ASSETS_NAME),
        ),
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

const BRAND_ASSETS_NAME = "TVAppIcon";

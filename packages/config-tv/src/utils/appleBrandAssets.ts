import { promises as fs } from "fs";
import path from "path";

export type ContentsJsonImageIdiom = "tv";

export type ContentsJsonImageAppearance = {
  appearance: "luminosity";
  value: "dark";
};

export type ContentsJsonImageScale = "1x" | "2x" | "3x";

export type ContentsJsonImageRole =
  | "primary-app-icon"
  | "top-shelf-image"
  | "top-shelf-image-wide";

export interface ContentsJsonImage {
  appearances?: ContentsJsonImageAppearance[];
  idiom: ContentsJsonImageIdiom;
  size?: string;
  scale?: ContentsJsonImageScale;
  filename: string;
}

export interface ContentsJsonImageLayer {
  filename: string;
}

export interface ContentsJsonAsset {
  filename?: string;
  idiom?: ContentsJsonImageIdiom;
  role?: ContentsJsonImageRole;
  size?: string;
}

export interface ContentsJson {
  assets?: ContentsJsonAsset[];
  images?: ContentsJsonImage[];
  layers?: ContentsJsonImageLayer[];
  info: {
    version: number;
    author: string;
  };
}

export interface SourceImageJson {
  path: string;
  scale?: string;
}

export interface SourceImageSetJson {
  name: string;
  sourceImages: SourceImageJson[];
}

export interface SourceImageLayerJson {
  name: string;
  sourceImages: SourceImageJson[];
}

export interface SourceImageStackJson {
  name: string;
  sourceLayers: SourceImageLayerJson[];
}

export interface SourceBrandAssetJson {
  role: ContentsJsonImageRole;
  size: string;
  imageStack?: SourceImageStackJson;
  imageSet?: SourceImageSetJson;
}

export interface SourceBrandAssetsJson {
  name: string;
  assets: SourceBrandAssetJson[];
}

/**
 * Writes the Config.json which is used to assign images to their respective platform, dpi, and idiom.
 *
 * @param directory path to add the Contents.json to.
 * @param contents image json data
 */
export async function writeContentsJsonAsync(
  directory: string,
  options: {
    assets?: ContentsJsonAsset[];
    images?: ContentsJsonImage[];
    layers?: ContentsJsonImageLayer[];
  },
): Promise<void> {
  await fs.mkdir(directory, { recursive: true });

  await fs.writeFile(
    path.join(directory, "Contents.json"),
    JSON.stringify(
      {
        assets: options.assets,
        images: options.images,
        layers: options.layers,
        info: {
          version: 1,
          // common practice is for the tool that generated the icons to be the "author"
          author: "expo",
        },
      },
      null,
      2,
    ),
  );
}

/**
 * Creates an image set directory with its Contents.json and any images
 */
export async function createImageSetAsync(
  destinationPath: string,
  imageSet: SourceImageSetJson,
) {
  const imageSetPath = path.join(destinationPath, `${imageSet.name}.imageset`);
  await writeContentsJsonAsync(imageSetPath, {
    images: imageSet.sourceImages.map((image: any) => ({
      filename: path.basename(image.path),
      idiom: "tv",
      scale: image.scale,
    })),
  });
  for (const image of imageSet.sourceImages) {
    await fs.copyFile(
      image.path,
      path.join(imageSetPath, path.basename(image.path)),
    );
  }
}

/**
 * Creates an image stack layer directory with its Contents.json and any images
 */
export async function createImageStackLayerAsync(
  destinationPath: string,
  layer: SourceImageLayerJson,
) {
  const imageStackLayerPath = path.join(
    destinationPath,
    `${layer.name}.imagestacklayer`,
  );
  await writeContentsJsonAsync(imageStackLayerPath, {});
  await createImageSetAsync(imageStackLayerPath, {
    name: "Content",
    sourceImages: layer.sourceImages,
  });
}

/**
 * Creates an image stack directory with its Contents.json and any layers
 */
export async function createImageStackAsync(
  destinationPath: string,
  stack: SourceImageStackJson,
) {
  const imageStackPath = path.join(destinationPath, `${stack.name}.imagestack`);
  await writeContentsJsonAsync(imageStackPath, {
    layers: stack.sourceLayers.map((layer) => ({
      filename: `${layer.name}.imagestacklayer`,
    })),
  });
  for (const sourceLayer of stack.sourceLayers) {
    await createImageStackLayerAsync(imageStackPath, {
      name: sourceLayer.name,
      sourceImages: sourceLayer.sourceImages,
    });
  }
}

/**
 * Creates a brand assets directory with its Contents.json and any assets
 */
export async function createBrandAssetsAsync(
  destinationPath: string,
  brandAssets: SourceBrandAssetsJson,
) {
  const brandAssetsPath = path.join(
    destinationPath,
    `${brandAssets.name}.brandassets`,
  );
  await writeContentsJsonAsync(brandAssetsPath, {
    assets: brandAssets.assets.map((brandAsset) => {
      if (brandAsset.imageStack) {
        return {
          filename: `${brandAsset.imageStack.name}.imagestack`,
          role: brandAsset.role,
          size: brandAsset.size,
          idiom: "tv",
        };
      } else if (brandAsset.imageSet) {
        return {
          filename: `${brandAsset.imageSet.name}.imageset`,
          role: brandAsset.role,
          size: brandAsset.size,
          idiom: "tv",
        };
      } else {
        return {}; // Should never happen, but need this to keep Typescript happy
      }
    }),
  });
  for (const asset of brandAssets.assets) {
    if (asset.imageSet) {
      await createImageSetAsync(brandAssetsPath, asset.imageSet);
    }
    if (asset.imageStack) {
      await createImageStackAsync(brandAssetsPath, asset.imageStack);
    }
  }
}

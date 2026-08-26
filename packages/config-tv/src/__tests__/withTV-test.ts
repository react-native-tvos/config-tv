import { ExpoConfig } from "expo/config";
import { AndroidConfig } from "expo/config-plugins";
import { promises as fs } from "fs";
import { vol } from "memfs";
import { join, resolve } from "path";

import {
  originalPodfile,
  originalSplashScreen,
  originalAndroidManifest,
  originalAndroidManifestNoMainIntent,
} from "./testConstants";
import {
  createBrandAssetsAsync,
  SourceImageJson,
  SourceBrandAssetsJson,
  tvosDeploymentTarget,
} from "../utils";
import {
  removePortraitOrientation,
  setLeanBackLauncherIntent,
  setTVBanner,
  setTVIcon,
} from "../withTVAndroidManifest";
import { appleTVSourceBrandAssets } from "../withTVAppleIconImages";
import { addTVPodfileModifications } from "../withTVPodfile";
import { addTVSplashScreenModifications } from "../withTVSplashScreen";

const { readAndroidManifestAsync } = AndroidConfig.Manifest;

jest.mock("fs");

const projectRoot = "/wat";

describe("withTV iOS/tvOS tests", () => {
  beforeEach(() => {
    vol.reset();
  });
  test("Add TV Podfile changes", async () => {
    const modifiedPodfile = addTVPodfileModifications(originalPodfile);
    expect(modifiedPodfile).toMatchSnapshot();
  });
  test("Add TV splash screen changes", async () => {
    const modifiedSplashScreen =
      addTVSplashScreenModifications(originalSplashScreen);
    expect(modifiedSplashScreen).toMatchSnapshot();
  });
  test("Create Apple TV brand assets", async () => {
    vol.fromJSON(
      {
        "assets/images/icon.png": "icon.png",
        "assets/images/iconSmall.png": "iconSmall.png",
        "assets/images/topShelf.png": "topShelf.png",
        "assets/images/topShelf2x.png": "topShelf2x.png",
      },
      projectRoot,
    );
    const iconSourceImages: SourceImageJson[] = [
      {
        path: join(projectRoot, "assets/images/iconSmall.png"),
        scale: "1x",
      },
      {
        path: join(projectRoot, "assets/images/icon.png"),
        scale: "2x",
      },
    ];
    const topShelfSourceImages: SourceImageJson[] = [
      {
        path: join(projectRoot, "assets/images/topShelf.png"),
        scale: "1x",
      },
      {
        path: join(projectRoot, "assets/images/topShelf2x.png"),
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
          role: "primary-app-icon",
          size: "400x240",
          imageStack: {
            name: "App Icon",
            sourceLayers: [
              {
                name: "Front",
                sourceImages: iconSourceImages,
              },
              {
                name: "Middle",
                sourceImages: iconSourceImages,
              },
              {
                name: "Back",
                sourceImages: iconSourceImages,
              },
            ],
          },
        },
      ],
    };
    await createBrandAssetsAsync(projectRoot, sourceBrandAssets);
    const topLevelContentJson = await fs.readFile(
      resolve(projectRoot, "TVAppIcon.brandassets", "Contents.json"),
      { encoding: "utf-8" },
    );
    expect(topLevelContentJson).toMatchSnapshot();
    const appIconStackContentJson = await fs.readFile(
      resolve(
        projectRoot,
        "TVAppIcon.brandassets",
        "App Icon.imagestack",
        "Contents.json",
      ),
      { encoding: "utf-8" },
    );
    expect(appIconStackContentJson).toMatchSnapshot();
    const appIconFrontLayerJson = await fs.readFile(
      resolve(
        projectRoot,
        "TVAppIcon.brandassets",
        "App Icon.imagestack",
        "Front.imagestacklayer",
        "Contents.json",
      ),
      { encoding: "utf-8" },
    );
    expect(appIconFrontLayerJson).toMatchSnapshot();
    const appIconContents = await fs.readFile(
      resolve(
        projectRoot,
        "TVAppIcon.brandassets",
        "App Icon.imagestack",
        "Front.imagestacklayer",
        "Content.imageset",
        "icon.png",
      ),
      { encoding: "utf-8" },
    );
    expect(appIconContents).toEqual("icon.png");
  });
});

describe("appleTVSourceBrandAssets", () => {
  const imageNames = [
    "icon-1280x768.png",
    "icon-400x240.png",
    "icon-800x480.png",
    "topShelf.png",
    "topShelf2x.png",
    "topShelfWide.png",
    "topShelfWide2x.png",
    "front-400x240.png",
    "middle-400x240.png",
    "back-400x240.png",
  ];

  const imagePath = (name: string) => join(projectRoot, "assets/images", name);

  const flatImages = {
    icon: imagePath("icon-1280x768.png"),
    iconSmall: imagePath("icon-400x240.png"),
    iconSmall2x: imagePath("icon-800x480.png"),
    topShelf: imagePath("topShelf.png"),
    topShelf2x: imagePath("topShelf2x.png"),
    topShelfWide: imagePath("topShelfWide.png"),
    topShelfWide2x: imagePath("topShelfWide2x.png"),
  };

  const imageStackNamed = (
    brandAssets: SourceBrandAssetsJson,
    name: string,
  ) => {
    const imageStack = brandAssets.assets.find(
      (asset) => asset.imageStack?.name === name,
    )?.imageStack;
    if (!imageStack) {
      throw new Error(`No image stack named ${name}`);
    }
    return imageStack;
  };

  beforeEach(() => {
    vol.reset();
    vol.fromJSON(
      Object.fromEntries(
        imageNames.map((name) => [`assets/images/${name}`, name]),
      ),
      projectRoot,
    );
  });

  test("repeats a single icon image across all three layers", () => {
    const iconSmall = imageStackNamed(
      appleTVSourceBrandAssets(flatImages),
      "App Icon - Small",
    );
    expect(iconSmall.sourceLayers.map((layer) => layer.name)).toEqual([
      "Front",
      "Middle",
      "Back",
    ]);
    for (const layer of iconSmall.sourceLayers) {
      expect(layer.sourceImages).toEqual([
        { path: imagePath("icon-400x240.png"), scale: "1x" },
        { path: imagePath("icon-800x480.png"), scale: "2x" },
      ]);
    }
  });

  test("gives each layer its own artwork when layers are set", () => {
    const iconSmall = imageStackNamed(
      appleTVSourceBrandAssets({
        ...flatImages,
        iconSmallLayers: {
          front: imagePath("front-400x240.png"),
          middle: imagePath("middle-400x240.png"),
          back: imagePath("back-400x240.png"),
        },
      }),
      "App Icon - Small",
    );
    expect(
      iconSmall.sourceLayers.map((layer) => layer.sourceImages[0].path),
    ).toEqual([
      imagePath("front-400x240.png"),
      imagePath("middle-400x240.png"),
      imagePath("back-400x240.png"),
    ]);
  });

  test("omits the middle layer when no scale supplies one", () => {
    const layers = {
      front: imagePath("front-400x240.png"),
      back: imagePath("back-400x240.png"),
    };
    const iconSmall = imageStackNamed(
      appleTVSourceBrandAssets({
        ...flatImages,
        iconSmall: undefined,
        iconSmall2x: undefined,
        iconSmallLayers: layers,
        iconSmall2xLayers: layers,
      }),
      "App Icon - Small",
    );
    expect(iconSmall.sourceLayers.map((layer) => layer.name)).toEqual([
      "Front",
      "Back",
    ]);
  });

  test("layers take precedence over the single image for the same scale", () => {
    const iconSmall = imageStackNamed(
      appleTVSourceBrandAssets({
        ...flatImages,
        iconSmallLayers: {
          front: imagePath("front-400x240.png"),
          middle: imagePath("middle-400x240.png"),
          back: imagePath("back-400x240.png"),
        },
      }),
      "App Icon - Small",
    );
    // iconSmall2x is still a single image, so it contributes to every layer
    expect(iconSmall.sourceLayers[0].sourceImages).toEqual([
      { path: imagePath("front-400x240.png"), scale: "1x" },
      { path: imagePath("icon-800x480.png"), scale: "2x" },
    ]);
  });

  test("throws when an app icon has neither an image nor layers", () => {
    expect(() =>
      appleTVSourceBrandAssets({ ...flatImages, icon: undefined }),
    ).toThrow("One or more image paths not defined");
  });

  test("still throws when a top shelf image is not defined", () => {
    expect(() =>
      appleTVSourceBrandAssets({ ...flatImages, topShelf: undefined }),
    ).toThrow("One or more image paths not defined");
  });

  test("throws when a layer image does not exist", () => {
    expect(() =>
      appleTVSourceBrandAssets({
        ...flatImages,
        iconLayers: {
          front: imagePath("front-1280x768.png"),
          back: imagePath("back-1280x768.png"),
        },
      }),
    ).toThrow(`No image found at path ${imagePath("front-1280x768.png")}`);
  });
});

describe("with TV Android tests", () => {
  beforeEach(() => {
    vol.reset();
  });
  test("Adds leanback launcher intent category for TV builds", async () => {
    vol.fromJSON(
      {
        "androidManifest.xml": originalAndroidManifest,
      },
      projectRoot,
    );
    const originalManifest = await readAndroidManifestAsync(
      resolve(projectRoot, "androidManifest.xml"),
    );
    const modifiedManifest = setLeanBackLauncherIntent({}, originalManifest, {
      isTV: true,
      showVerboseWarnings: false,
    });
    expect(JSON.stringify(modifiedManifest).indexOf("LEANBACK")).not.toEqual(
      -1,
    );
  });
  test("Adds TV banner to main application", async () => {
    vol.fromJSON(
      {
        "androidManifest.xml": originalAndroidManifest,
      },
      projectRoot,
    );
    const originalManifest = await readAndroidManifestAsync(
      resolve(projectRoot, "androidManifest.xml"),
    );
    const modifiedManifest = setTVBanner(
      {},
      originalManifest,
      {
        isTV: true,
        showVerboseWarnings: false,
      },
      "bogus",
    );
    expect(
      JSON.stringify(modifiedManifest).indexOf("android:banner"),
    ).not.toEqual(-1);
  });
  test("Adds TV icon to main application", async () => {
    vol.fromJSON(
      {
        "androidManifest.xml": originalAndroidManifest,
      },
      projectRoot,
    );
    const originalManifest = await readAndroidManifestAsync(
      resolve(projectRoot, "androidManifest.xml"),
    );
    const modifiedManifest = setTVIcon(
      {},
      originalManifest,
      {
        isTV: true,
        showVerboseWarnings: false,
      },
      "bogus",
    );
    expect(
      JSON.stringify(modifiedManifest).indexOf("android:icon"),
    ).not.toEqual(-1);
  });
  test("Throws if manifest has no main intent", async () => {
    vol.fromJSON(
      {
        "androidManifest.xml": originalAndroidManifestNoMainIntent,
      },
      projectRoot,
    );
    const originalManifest = await readAndroidManifestAsync(
      resolve(projectRoot, "androidManifest.xml"),
    );
    try {
      setLeanBackLauncherIntent({}, originalManifest, {
        isTV: true,
        showVerboseWarnings: false,
      });
      // Should not reach this line
      expect(true).toBe(false);
    } catch (e) {
      expect(e.message).toContain(
        "no main intent in main activity of Android manifest",
      );
    }
  });
  test("Removes orientation from activity metadata for TV builds", async () => {
    vol.fromJSON(
      {
        "androidManifest.xml": originalAndroidManifest,
      },
      projectRoot,
    );
    const originalManifest = await readAndroidManifestAsync(
      resolve(projectRoot, "androidManifest.xml"),
    );
    const modifiedManifest = removePortraitOrientation({}, originalManifest, {
      isTV: false,
      showVerboseWarnings: false,
    });
    expect(
      JSON.stringify(modifiedManifest).indexOf("screenOrientation"),
    ).toEqual(-1);
  });
});

describe("tvosDeploymentTarget", () => {
  const configWithBuildProperties = (
    deploymentTarget: string,
  ): ExpoConfig => ({
    name: "test",
    slug: "test",
    plugins: [
      ["expo-build-properties", { ios: { deploymentTarget } }],
    ],
  });

  const configWithoutBuildProperties: ExpoConfig = {
    name: "test",
    slug: "test",
    plugins: [["some-other-plugin", {}]],
  };

  const configWithNoPlugins: ExpoConfig = {
    name: "test",
    slug: "test",
  };

  test("uses plugin param tvosDeploymentTarget when provided", () => {
    const result = tvosDeploymentTarget(
      { isTV: true, tvosDeploymentTarget: "16.0" },
      configWithBuildProperties("17.0"),
      "18.0",
    );
    expect(result).toBe("16.0");
  });

  test("falls back to expo-build-properties ios.deploymentTarget", () => {
    const result = tvosDeploymentTarget(
      { isTV: true },
      configWithBuildProperties("17.0"),
      "18.0",
    );
    expect(result).toBe("17.0");
  });

  test("falls back to Expo default iOS deployment target", () => {
    const result = tvosDeploymentTarget(
      { isTV: true },
      configWithoutBuildProperties,
      "18.0",
    );
    expect(result).toBe("18.0");
  });

  test("falls back to hardcoded default when no config or Expo default", () => {
    const result = tvosDeploymentTarget({ isTV: true });
    expect(result).toBe("15.1");
  });

  test("falls back to hardcoded default when config has no plugins", () => {
    const result = tvosDeploymentTarget(
      { isTV: true },
      configWithNoPlugins,
    );
    expect(result).toBe("15.1");
  });

  test("falls back to hardcoded default when config has no expo-build-properties", () => {
    const result = tvosDeploymentTarget(
      { isTV: true },
      configWithoutBuildProperties,
    );
    expect(result).toBe("15.1");
  });
});

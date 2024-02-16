import { AndroidConfig } from '@expo/config-plugins';
import { promises as fs } from 'fs';
import { vol } from 'memfs';
import { join, resolve } from 'path';

import {
  originalPodfile,
  originalSplashScreen,
  originalAndroidManifest,
  originalAndroidManifestNoMainIntent,
} from './testConstants';

import {
  removePortraitOrientation,
  setLeanBackLauncherIntent,
  setTVBanner,
} from '../withTVAndroidManifest';
import { addTVPodfileModifications } from '../withTVPodfile';
import { addTVSplashScreenModifications } from '../withTVSplashScreen';
import {
  createBrandAssetsAsync,
  SourceImageJson,
  SourceBrandAssetsJson,
} from '../utils';

const { readAndroidManifestAsync } = AndroidConfig.Manifest;

jest.mock('fs');

const projectRoot = '/wat';

describe('withTV iOS/tvOS tests', () => {
  beforeEach(() => {
    vol.reset();
  });
  test('Add TV Podfile changes', async () => {
    const modifiedPodfile = addTVPodfileModifications(originalPodfile);
    expect(modifiedPodfile).toMatchSnapshot();
  });
  test('Add TV splash screen changes', async () => {
    const modifiedSplashScreen =
      addTVSplashScreenModifications(originalSplashScreen);
    expect(modifiedSplashScreen).toMatchSnapshot();
  });
  test('Create Apple TV brand assets', async () => {
    vol.fromJSON(
      {
        'assets/images/icon.png': 'icon.png',
        'assets/images/iconSmall.png': 'iconSmall.png',
        'assets/images/topShelf.png': 'topShelf.png',
        'assets/images/topShelf2x.png': 'topShelf2x.png',
      },
      projectRoot,
    );
    const iconSourceImages: SourceImageJson[] = [
      {
        path: join(projectRoot, 'assets/images/iconSmall.png'),
        scale: '1x',
      },
      {
        path: join(projectRoot, 'assets/images/icon.png'),
        scale: '2x',
      },
    ];
    const topShelfSourceImages: SourceImageJson[] = [
      {
        path: join(projectRoot, 'assets/images/topShelf.png'),
        scale: '1x',
      },
      {
        path: join(projectRoot, 'assets/images/topShelf2x.png'),
        scale: '2x',
      },
    ];
    const sourceBrandAssets: SourceBrandAssetsJson = {
      name: 'TVAppIcon',
      assets: [
        {
          role: 'top-shelf-image',
          size: '1920x720',
          imageSet: {
            name: 'Top Shelf Image',
            sourceImages: topShelfSourceImages,
          },
        },
        {
          role: 'primary-app-icon',
          size: '400x240',
          imageStack: {
            name: 'App Icon',
            sourceLayers: [
              {
                name: 'Front',
                sourceImages: iconSourceImages,
              },
              {
                name: 'Middle',
                sourceImages: iconSourceImages,
              },
              {
                name: 'Back',
                sourceImages: iconSourceImages,
              },
            ],
          },
        },
      ],
    };
    await createBrandAssetsAsync(projectRoot, sourceBrandAssets);
    const topLevelContentJson = await fs.readFile(
      resolve(projectRoot, 'TVAppIcon.brandassets', 'Contents.json'),
      { encoding: 'utf-8' },
    );
    expect(topLevelContentJson).toMatchSnapshot();
    const appIconStackContentJson = await fs.readFile(
      resolve(
        projectRoot,
        'TVAppIcon.brandassets',
        'App Icon.imagestack',
        'Contents.json',
      ),
      { encoding: 'utf-8' },
    );
    expect(appIconStackContentJson).toMatchSnapshot();
    const appIconFrontLayerJson = await fs.readFile(
      resolve(
        projectRoot,
        'TVAppIcon.brandassets',
        'App Icon.imagestack',
        'Front.imagestacklayer',
        'Contents.json',
      ),
      { encoding: 'utf-8' },
    );
    expect(appIconFrontLayerJson).toMatchSnapshot();
    const appIconContents = await fs.readFile(
      resolve(
        projectRoot,
        'TVAppIcon.brandassets',
        'App Icon.imagestack',
        'Front.imagestacklayer',
        'Content.imageset',
        'icon.png',
      ),
      { encoding: 'utf-8' },
    );
    expect(appIconContents).toEqual('icon.png');
  });
});

describe('with TV Android tests', () => {
  beforeEach(() => {
    vol.reset();
  });
  test('Adds leanback launcher intent category for TV builds', async () => {
    vol.fromJSON(
      {
        'androidManifest.xml': originalAndroidManifest,
      },
      projectRoot,
    );
    const originalManifest = await readAndroidManifestAsync(
      resolve(projectRoot, 'androidManifest.xml'),
    );
    const modifiedManifest = setLeanBackLauncherIntent({}, originalManifest, {
      isTV: true,
      showVerboseWarnings: false,
    });
    expect(JSON.stringify(modifiedManifest).indexOf('LEANBACK')).not.toEqual(
      -1,
    );
  });
  test('Adds TV banner to main application', async () => {
    vol.fromJSON(
      {
        'androidManifest.xml': originalAndroidManifest,
      },
      projectRoot,
    );
    const originalManifest = await readAndroidManifestAsync(
      resolve(projectRoot, 'androidManifest.xml'),
    );
    const modifiedManifest = setTVBanner(
      {},
      originalManifest,
      {
        isTV: true,
        showVerboseWarnings: false,
      },
      'bogus',
    );
    expect(
      JSON.stringify(modifiedManifest).indexOf('android:banner'),
    ).not.toEqual(-1);
  });
  test('Throws if manifest has no main intent', async () => {
    vol.fromJSON(
      {
        'androidManifest.xml': originalAndroidManifestNoMainIntent,
      },
      projectRoot,
    );
    const originalManifest = await readAndroidManifestAsync(
      resolve(projectRoot, 'androidManifest.xml'),
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
        'no main intent in main activity of Android manifest',
      );
    }
  });
  test('Removes orientation from activity metadata for TV builds', async () => {
    vol.fromJSON(
      {
        'androidManifest.xml': originalAndroidManifest,
      },
      projectRoot,
    );
    const originalManifest = await readAndroidManifestAsync(
      resolve(projectRoot, 'androidManifest.xml'),
    );
    const modifiedManifest = removePortraitOrientation({}, originalManifest, {
      isTV: false,
      showVerboseWarnings: false,
    });
    expect(
      JSON.stringify(modifiedManifest).indexOf('screenOrientation'),
    ).toEqual(-1);
  });
});

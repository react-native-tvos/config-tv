import {
  ConfigPlugin,
  ExportedConfigWithProps,
  withXcodeProject,
  XcodeProject,
} from "expo/config-plugins";

import { ConfigData } from "./types";
import { tvosDeploymentTarget, verboseLog } from "./utils";

/**
 * Reads the existing IPHONEOS_DEPLOYMENT_TARGET from the Xcode project build settings.
 * This represents Expo's default iOS deployment target as set during prebuild.
 */
function getExpoDefaultIosDeploymentTarget(
  project: XcodeProject,
): string | undefined {
  const configurations = project.pbxXCBuildConfigurationSection();
  // @ts-ignore
  for (const { buildSettings } of Object.values(configurations || {})) {
    if (buildSettings?.IPHONEOS_DEPLOYMENT_TARGET) {
      return buildSettings.IPHONEOS_DEPLOYMENT_TARGET;
    }
  }
  return undefined;
}

export const withTVXcodeProject: ConfigPlugin<ConfigData> = (
  config,
  params,
) => {
  return withXcodeProject(config, async (config) => {
    const expoDefaultIosDeploymentTarget =
      getExpoDefaultIosDeploymentTarget(config.modResults);
    const deploymentTarget = tvosDeploymentTarget(
      params,
      config,
      expoDefaultIosDeploymentTarget,
    );
    config.modResults = await setXcodeProjectBuildSettings(config, {
      project: config.modResults,
      params,
      deploymentTarget,
    });
    return config;
  });
};

export function setXcodeProjectBuildSettings(
  _: ExportedConfigWithProps<XcodeProject>,
  {
    project,
    params,
    deploymentTarget,
  }: {
    project: XcodeProject;
    params: ConfigData;
    deploymentTarget: string;
  },
): XcodeProject {
  const configurations = project.pbxXCBuildConfigurationSection();
  // @ts-ignore
  for (const { buildSettings } of Object.values(configurations || {})) {
    // Guessing that this is the best way to emulate Xcode.
    // Using `project.addToBuildSettings` modifies too many targets.
    if (buildSettings !== undefined) {
      buildSettings.SDKROOT = "appletvos";
    }
    if (typeof buildSettings?.PRODUCT_NAME !== "undefined") {
      verboseLog(`modifying target ${buildSettings?.PRODUCT_NAME} for tvOS`, {
        params,
        platform: "ios",
        property: "xcodeproject",
      });
      buildSettings.TARGETED_DEVICE_FAMILY = "3";
      buildSettings.TVOS_DEPLOYMENT_TARGET = deploymentTarget;
      if (typeof buildSettings?.IOS_DEPLOYMENT_TARGET !== "undefined") {
        delete buildSettings?.IOS_DEPLOYMENT_TARGET;
      }
      if (params.appleTVImages) {
        // set the app icon source
        buildSettings.ASSETCATALOG_COMPILER_APPICON_NAME = "TVAppIcon";
        buildSettings.ASSETCATALOG_COMPILER_INCLUDE_ALL_APPICON_ASSETS = "YES";
      }
    }
  }

  return project;
}

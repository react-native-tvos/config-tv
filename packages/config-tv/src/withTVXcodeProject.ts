import { ExpoConfig } from "@expo/config-types";
import {
  ConfigPlugin,
  withXcodeProject,
  XcodeProject,
} from "expo/config-plugins";

import { ConfigData } from "./types";
import { tvosDeploymentTarget, verboseLog } from "./utils";

export const withTVXcodeProject: ConfigPlugin<ConfigData> = (
  config,
  params,
) => {
  const deploymentTarget = tvosDeploymentTarget(params);
  return withXcodeProject(config, async (config) => {
    config.modResults = await setXcodeProjectBuildSettings(config, {
      project: config.modResults,
      params,
      deploymentTarget,
    });
    return config;
  });
};

export function setXcodeProjectBuildSettings(
  config: Pick<ExpoConfig, "ios">,
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
        if (buildSettings.ASSETCATALOG_COMPILER_APPICON_NAME === "AppIcon") {
          buildSettings.ASSETCATALOG_COMPILER_APPICON_NAME = "TVAppIcon";
        }
      }
    }
  }

  return project;
}

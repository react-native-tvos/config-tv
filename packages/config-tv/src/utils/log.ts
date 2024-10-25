import { ConfigData } from "../types";

const debug = require("debug")(
  "expo:react-native-tvos:config-tv",
) as typeof console.log;

export function verboseLog(
  message: string,
  options?: {
    params?: ConfigData;
    platform?: "android" | "ios";
    property?: string;
  },
) {
  const tokens = [message];
  options?.property && tokens.unshift(options?.property);
  options?.platform && tokens.unshift(options?.platform);
  debug(tokens.join(": "));
}

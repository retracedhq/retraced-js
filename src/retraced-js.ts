import * as util from "util";

export interface RetracedConfig {
  apiKey: string;
}

export default class RetracedJS {
  private config: RetracedConfig;

  constructor(config: RetracedConfig) {
    this.config = config;
  }
}

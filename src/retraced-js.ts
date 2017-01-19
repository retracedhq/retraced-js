import "isomorphic-fetch";
import * as url from "url";

const defaultEndpoint = "https://api.retraced.io/v1";

export interface Config {
  projectId: string;
  apiKey: string;
  endpoint?: string;
}

export interface Target {
  id: string;
  displayName?: string;
  type?: string;
  url?: string;
  fields?: { [key: string]: any; };
}

export interface Actor {
  id: string;
  displayName?: string;
  type?: string;
  url?: string;
}

export interface Event {
  action: string;
  teamId: string;
  crud?: string;
  created?: number;
  actor?: Actor;
  target?: Target;
  sourceIp?: string;
  description?: string;
  isFailure?: boolean;
  isAnonymous?: boolean;
  fields?: { [key: string]: any; };
}

export class Client {
  private config: Config;

  constructor(config: Config) {
    if (!config.endpoint) {
      config.endpoint = defaultEndpoint;
    }
    this.config = config;
  }

  public async reportEvent(event: Event) {
    const { endpoint, apiKey, projectId } = this.config;

    const response = await fetch(`${endpoint}/project/${projectId}/event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Token token=${apiKey}`,
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      throw new Error(`Unexpected HTTP response: ${response.status} ${response.statusText}`);
    }
  }

  public async getViewerToken(teamId: string): Promise<string> {
    const { endpoint, apiKey, projectId } = this.config;

    const q = url.format({ query: { team_id: teamId } });
    const urlWithQuery = `${endpoint}/project/${projectId}/viewertoken${q}`;
    const response = await fetch(urlWithQuery, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Token token=${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Unexpected HTTP response: ${response.status} ${response.statusText}`);
    }

    const responseObj = await response.json();
    return responseObj.token;
  }
}

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
  url?: string;
  type?: string;
  // fields?: { [key: string]: any; };
}

export interface Actor {
  id: string;
  displayName?: string;
  url?: string;
  // type?: string;
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
  // fields?: { [key: string]: any; };
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

    const requestBody: any = {
      action: event.action,
      team_id: event.teamId,
      crud: event.crud,
      created: event.created,
      source_ip: event.sourceIp,
      description: event.description,
      is_failure: event.isFailure,
      is_anonymous: event.isAnonymous,
    };

    if (event.actor) {
      requestBody.actor = {
        id: event.actor.id,
        name: event.actor.displayName,
        url: event.actor.url,
      };
    }

    if (event.target) {
      requestBody.object = {
        id: event.target.id,
        name: event.target.displayName,
        url: event.target.url,
        type: event.target.type,
      };
    }

    const response = await fetch(`${endpoint}/project/${projectId}/event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Token token=${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Unexpected HTTP response: ${response.status} ${response.statusText}`);
    }
  }

  public async getViewerToken(teamId: string, isAdmin?: boolean): Promise<string> {
    const { endpoint, apiKey, projectId } = this.config;

    const q = url.format({
      query: {
        team_id: teamId,
        is_admin: !!isAdmin,
      },
    });
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

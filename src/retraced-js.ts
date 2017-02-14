import "isomorphic-fetch";
import * as url from "url";
import { Event, verifyHash } from "./event";

const defaultEndpoint = "https://api.retraced.io/v1";

export interface Config {
  projectId: string;
  apiKey: string;
  endpoint?: string;
}

export interface NewEventRecord {
  id: string;
  hash: string;
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
      group: event.group,
      crud: event.crud,
      created: event.created,
      actor: event.actor,
      target: event.target,
      source_ip: event.sourceIp,
      description: event.description,
      is_failure: event.isFailure,
      is_anonymous: event.isAnonymous,
      fields: event.fields,
    };

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

    const newEvent: NewEventRecord = await response.json();
    try {
      verifyHash(event, newEvent);
    } catch (err) {
      throw new Error(`Our local hash calculation did not match the server's: ${err}`);
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

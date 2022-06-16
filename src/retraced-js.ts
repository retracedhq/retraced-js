import fetch from "node-fetch";
import * as url from "url";
import * as _ from "lodash";
import { Event, verifyHash } from "./event";
import { StructuredQuery, EventNode, EventNodeMask, EventsConnection } from "./graphql";

const defaultEndpoint = "https://api.retraced.io";

export interface Config {
  /** projectId is the retraced projectId */
  projectId: string;
  /** apiKey is an API token for the retraced publisher api */
  apiKey: string;
  /** endpoint is the retraced api base url, default is `https://api.retraced.io` */
  endpoint?: string;
  /** component is an identifier for a specific component of a vendor app platform */
  component?: string;
  /** version is an identifier for the specific version of this component, usually a git SHA */
  version?: string;
  /** viewLogAction is the action logged when a Viewer Token is used, default is `audit.log.view` */
  viewLogAction?: string;
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

  // confirms the hash and returns the ID of the event
  public async reportEvent(event: Event): Promise<string> {
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
      component: this.config.component,
      version: this.config.version,
    };

    const response = await fetch(`${endpoint}/publisher/v1/project/${projectId}/event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `token=${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Unexpected HTTP response: ${response.status} ${response.statusText}`);
    }

    const newEvent: NewEventRecord = await response.json() as NewEventRecord;
    try {
      verifyHash(event, newEvent);
    } catch (err) {
      throw new Error(`Local event hash calculation did not match the server's: ${err}`);
    }

    return newEvent.id;
  }

  // confirms the hash and returns the IDs of the new events
  public async reportEvents(events: Event[]): Promise<string[]> {
    const { endpoint, apiKey, projectId } = this.config;

    const requestBody: any = _.map(events, event => {
      return {
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
        component: this.config.component,
        version: this.config.version,
      };
    });

    const response = await fetch(`${endpoint}/publisher/v1/project/${projectId}/event/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `token=${apiKey}`,
        },
        body: JSON.stringify({ events: requestBody }),
      });

    if (!response.ok) {
      throw new Error(`Unexpected HTTP response: ${response.status} ${response.statusText}`);
    }

    const newEvents: NewEventRecord[] = await response.json() as NewEventRecord[];
    try {
      _.forEach(newEvents, (newEvent, index) => {
        verifyHash(events[index], newEvent);
      });
    } catch (err) {
      throw new Error(`Local event hash calculation did not match the server's: ${err}`);
    }

    return newEvents.map((newEvent) => newEvent.id);
  }

  public async getViewerToken(groupId: string, actorId: string, isAdmin?: boolean): Promise<string> {
    const { endpoint, apiKey, projectId, viewLogAction } = this.config;

    const q = url.format({
      query: {
        group_id: groupId,
        actor_id: actorId,
        is_admin: !!isAdmin,
        view_log_action: viewLogAction,
      },
    });
    const urlWithQuery = `${endpoint}/publisher/v1/project/${projectId}/viewertoken${q}`;
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

    const responseObj = (await response.json()) as any;
    return responseObj.token;
  }

  public async query(q: StructuredQuery, mask: EventNodeMask, pageSize: number): Promise<EventsConnection> {
    const { endpoint, apiKey, projectId } = this.config;

    const conn = new EventsConnection(
      `${endpoint}/publisher/v1/project/${projectId}/graphql`,
      `Token token=${apiKey}`,
      q,
      mask,
      pageSize,
    );

    await conn.init();

    return conn;
  }
}

import * as _ from "lodash";
import * as crypto from "crypto";
import * as util from "util";

import { NewEventRecord } from "./retraced-js";

export interface Target {
  id: string;
  name?: string;
  href?: string;
  type?: string;
}

export interface Actor {
  id: string;
  name?: string;
  href?: string;
}

export interface Group {
  id: string;
  name?: string;
}

export interface Event {
  action: string;
  group?: Group;
  crud?: string;
  created?: number;
  actor?: Actor;
  target?: Target;
  sourceIp?: string;
  description?: string;
  isFailure?: boolean;
  isAnonymous?: boolean;
  fields?: { [key: string]: string; };
}

const requiredFields = [
  "action",
];

const requiredSubfields = [
  // group.id is required if group is present
  ["group", "group.id"],
  // target.id is required if target is present
  ["target", "target.id"],
  // actor.id is required if actor is present
  ["actor", "actor.id"],
];

// Produces a canonical hash string representation of an event.
export function verifyHash(event: Event, newEvent: NewEventRecord): string {
  for (const fieldName of requiredFields) {
    if (_.isEmpty(_.get(event, fieldName))) {
      throw new Error(`Canonicalization failed: missing required event attribute '${fieldName}'`);
    }
  }

  for (const [fieldName, requiredSubfield] of requiredSubfields) {
    const hasField = !_.isEmpty(_.get(event, fieldName));
    const missingSubfield = hasField && _.isEmpty(_.get(event, requiredSubfield));
    if (missingSubfield) {
      throw new Error(`Canonicalization failed: attribute '${requiredSubfield}' is required if '${fieldName}' is present.`);
    }
  }

  const canonicalString = buildHashTarget(event, newEvent);
  const hasher = crypto.createHash("sha256");
  hasher.update(canonicalString);
  const hashResult = hasher.digest("hex");

  if (hashResult !== newEvent.hash) {
    throw new Error(`hash mismatch, local=${hashResult}, remote=${newEvent.hash}`);
  }

  return hashResult;
}

export function buildHashTarget(event: Event, newEvent: NewEventRecord): string {
  let canonicalString = "";
  canonicalString += `${encodePassOne(newEvent.id)}:`;
  canonicalString += `${encodePassOne(event.action)}:`;
  canonicalString += _.isEmpty(event.target) ? ":" : `${encodePassOne(event.target!.id)}:`;
  canonicalString += _.isEmpty(event.actor) ? ":" : `${encodePassOne(event.actor!.id)}:`;
  canonicalString += _.isEmpty(event.group) ? ":" : `${encodePassOne(event.group!.id)}:`;
  canonicalString += _.isEmpty(event.sourceIp) ? ":" : `${encodePassOne(event.sourceIp!)}:`;
  canonicalString += event.isFailure ? "1:" : "0:";
  canonicalString += event.isAnonymous ? "1:" : "0:";

  if (!event.fields) {
    canonicalString += ":";
  } else {
    const sortedKeys = _.keys(event.fields).sort();
    for (const key of sortedKeys) {
      const value = event.fields[key];
      const encodedKey = encodePassTwo(encodePassOne(key));
      const encodedValue = encodePassTwo(encodePassOne(value));
      canonicalString += `${encodedKey}=${encodedValue};`;
    }
  }
  return canonicalString;
}

function encodePassOne(valueIn: string): string {
  // % -> %25
  // : -> %3A
  return valueIn.replace(/%/g, "%25").replace(/:/g, "%3A");
}

function encodePassTwo(valueIn: string): string {
  // = -> %3D
  // ; -> %3B
  return valueIn.replace(/=/g, "%3D").replace(/;/g, "%3B");
}

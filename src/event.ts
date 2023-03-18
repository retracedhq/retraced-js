import * as _ from "lodash";
import * as crypto from "crypto";

import { NewEventRecord } from "./retraced-js";

export interface EventFields {
  [key: string]: string;
}

export interface Target {
  id: string;
  name?: string;
  href?: string;
  type?: string;
  fields?: EventFields;
}

export interface Actor {
  id: string;
  name?: string;
  href?: string;
  fields?: EventFields;
}

export interface Group {
  id: string;
  name?: string;
  fields?: EventFields;
}

interface EventCreation {
  created?: Date;
}

export interface EventInternal {
  action: string;
  group?: Group;
  crud?: "c" | "r" | "u" | "d";
  actor?: Actor;
  target?: Target;
  source_ip?: string;
  description?: string;
  is_failure?: boolean;
  is_anonymous?: boolean;
  fields?: EventFields;
  external_id?: string; // map to external id if needed
  indexes?: EventFields; // additional custom indexes, use sparingly
}

export interface Event extends EventCreation, EventInternal {}

const requiredFields = ["action"];

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
  const { hashResult, hashTarget } = computeHash(event, newEvent.id);

  if (hashResult !== newEvent.hash) {
    throw new Error(`hash mismatch, local=${hashResult}, remote=${newEvent.hash}, target=${hashTarget}`);
  }

  return hashResult;
}

export function computeHash(event: Event, id: string): { hashResult: string; hashTarget: string } {
  if (!id) {
    throw new Error("Canonicalization failed: missing required event attribute 'id'");
  }

  for (const fieldName of requiredFields) {
    if (_.isEmpty(_.get(event, fieldName))) {
      throw new Error(`Canonicalization failed: missing required event attribute '${fieldName}'`);
    }
  }

  for (const [fieldName, requiredSubfield] of requiredSubfields) {
    const hasField = !_.isEmpty(_.get(event, fieldName));
    const missingSubfield = hasField && _.isEmpty(_.get(event, requiredSubfield));
    if (missingSubfield) {
      throw new Error(
        `Canonicalization failed: attribute '${requiredSubfield}' is required if '${fieldName}' is present.`
      );
    }
  }

  const hashTarget = buildHashTarget(event, id);
  const hasher = crypto.createHash("sha256");
  hasher.update(hashTarget);
  const hashResult = hasher.digest("hex");

  return { hashResult, hashTarget };
}

export function buildHashTarget(event: Event, id: string): string {
  let canonicalString = "";
  canonicalString += `${encodePassOne(id)}:`;
  canonicalString += `${encodePassOne(event.action)}:`;
  canonicalString += _.isEmpty(event.target) ? ":" : `${encodePassOne(event.target!.id)}:`;
  canonicalString += _.isEmpty(event.actor) ? ":" : `${encodePassOne(event.actor!.id)}:`;
  canonicalString += _.isEmpty(event.group) ? ":" : `${encodePassOne(event.group!.id)}:`;
  canonicalString += _.isEmpty(event.source_ip) ? ":" : `${encodePassOne(event.source_ip!)}:`;
  canonicalString += event.is_failure ? "1:" : "0:";
  canonicalString += event.is_anonymous ? "1:" : "0:";

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

  if (event.external_id) {
    canonicalString += `:${encodePassOne(event.external_id)}`;
  }

  if (event.indexes) {
    canonicalString += ":";
    const sortedKeys = _.keys(event.indexes).sort();
    for (const key of sortedKeys) {
      const value = event.indexes[key];
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
  return valueIn ? (valueIn.replace ? valueIn.replace(/%/g, "%25").replace(/:/g, "%3A") : valueIn) : valueIn;
}

function encodePassTwo(valueIn: string): string {
  // = -> %3D
  // ; -> %3B
  return valueIn ? (valueIn.replace ? valueIn.replace(/=/g, "%3D").replace(/;/g, "%3B") : valueIn) : valueIn;
}

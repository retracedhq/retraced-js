# retraced-js

[![CircleCI](https://circleci.com/gh/retracedhq/retraced-js.svg?style=svg)](https://circleci.com/gh/retracedhq/retraced-js)

This is the official NodeJS client for interacting with the Retraced API. Retraced is an "audit logs as a service" provider, allowing developers to easily implement audit logging in their multi-tenant products and services. For more information, see the official website: https://boxyhq.com/audit-logs

## Installation

### yarn

```shell
yarn add @retracedhq/retraced
```

### npm

```shell
npm i -s @retracedhq/retraced
```

## Usage

```typescript
import * as Retraced from "@retracedhq/retraced";

// Initialize the client with your information.
const retraced = new Retraced.Client({
  apiKey: "your api key goes here",
  projectId: "your project id goes here",
});

// Report some audit events!
async function createNewRecord(request) {
  const newRecord = /* transform request into newRecord */
  // ... some more business logic here ...

  // Now construct the audit event to be reported to Retraced.
  const event = {
    action: "some.record.created",
    group: {
      id: "12345",
      name: "My Rad Customer",
    }
    crud: "c",
    source_ip: request.ip,
    actor: {
      id: "ultra.employee@customertowne.xyz",
      displayName: "Ultra Employee",
      url: "https://customertowne.xyz/employees/123456",
    },
    target: {
      id: newRecord.id,
      displayName: newRecord.name,
      url: "https://customertowne.xyz/records/" + newRecord.id,
    },
  };

  // The Retraced client's methods are asynchronous.
  // You can "fire and forget" them...
  retraced.reportEvent(event);

  // ... "await" them...
  console.log("Reporting...");
  await retraced.reportEvent(event);
  console.log("Finished reporting!");

  // ... or treat them as Promises.
  console.log("Reporting...");
  retraced.reportEvent(event)
    .then(() => { console.log("Finished reporting!"); })
    .catch((err) => handleError(err));
}
```

## Next Steps

For more details on the structure of Retraced events, please visit the [official documentation](https://boxyhq.com/docs/retraced/overview).

import { suite, test, slow, timeout, skip, only } from "mocha-typescript";
import { expect } from "chai";

import * as Retraced from "./";

@suite class RetracedJSTests {
  @test public "should instantiate"() {
    const garbo = new Retraced.Client({
      apiKey: "lmao rn tbqh",
      projectId: "aaaahahahahahahaha",
    });

    expect(garbo).to.exist;
  }

  @test public "should fail the hash check"() {
    const testEvent: Retraced.Event = {
      action: "just.a.test",
      group: {
        id: "Customer: XYZ",
        name: "Some Customer",
      },
      sourceIp: "1.2.3.4",
      isAnonymous: true,
      fields: {
        custom: "123",
        Custom: "Rate = 50%",
      },
    };

    const fakeNew: Retraced.NewEventRecord = {
      id: "0123456789abcdefg",
      hash: "XXXXXXXXX",
    };

    let explosion;
    try {
      Retraced.verifyHash(testEvent, fakeNew);
    } catch (err) {
      explosion = err;
    }

    expect(explosion).to.exist;
  }

  @test public "should pass the hash check"() {
    const testEvent: Retraced.Event = {
      action: "even.more.of.a.test",
      group: {
        id: "%% :: some %% customer :: %%",
        name: "A Customer",
      },
      actor: {
        id: "user@domain.xyz",
        name: "Chauncey O'Farragut",
      },
      target: {
        id: "some_object01234",
        name: "Important Business Widget",
      },
      isAnonymous: false,
      isFailure: true,
      fields: {
        ";zyx=cba;abc=xyz": "nothing special",
        ";Zyx=Cba%Abc=Xyz": "% hi there %",
      },
    };

    const fakeNew: Retraced.NewEventRecord = {
      id: "abf053dc4a3042459818833276eec717",
      hash: "5b570bff4628b35262fb401d2f6c9bb38d29e212f6e0e8ea93445b4e5a253d50",
    };

    let explosion;
    try {
      Retraced.verifyHash(testEvent, fakeNew);
    } catch (err) {
      explosion = err;
    }

    expect(explosion).to.not.exist;
  }

  @test public "should generate a hash target without a group specified"() {
    const testEvent: Retraced.Event = {
      action: "even.more.of.a.test",
      actor: {
        id: "user@domain.xyz",
        name: "Chauncey O'Farragut",
      },
      target: {
        id: "some_object01234",
        name: "Important Business Widget",
      },
      isAnonymous: false,
      isFailure: true,
      fields: {
        "abc=xyz": "nothing special",
      },
    };

    const fakeNew: Retraced.NewEventRecord = {
      id: "kfbr392",
      hash: "ignored",
    };

    const expected = "kfbr392:even.more.of.a.test:some_object01234:user@domain.xyz:::1:0:abc%3Dxyz=nothing special;";
    expect(Retraced.buildHashTarget(testEvent, fakeNew)).to.equal(expected);
  }

  @test public "should generate a GraphQL query string requesting all fields"() {
    const mask: Retraced.EventNodeMask = {
      id: true,
      action: true,
      description: true,
      group: {
        id: true,
        name: true,
      },
      actor: {
        id: true,
        name: true,
        href: true,
        fields: true,
      },
      target: {
        id: true,
        name: true,
        href: true,
        type: true,
        fields: true,
      },
      crud: true,
      display: {
        markdown: true,
      },
      is_failure: true,
      is_anonymous: true,
      source_ip: true,
      country: true,
      loc_subdiv1: true,
      loc_subdiv2: true,
      received: true,
      created: true,
      canonical_time: true,
      component: true,
      version: true,
      fields: true,
      raw: true,
    };

    const output: string = Retraced.graphQLQuery(mask);
    const answer = `query Search($query: String!, $last: Int, $before: String) {
  search(query: $query, last: $last, before: $before) {
    totalCount,
    pageInfo {
      hasPreviousPage
    }
    edges {
      cursor
      node {
        id
        action
        description
        group {
          id
          name
        }
        actor {
          id
          name
          href
          fields
        }
        target {
          id
          name
          href
          type
          fields
        }
        crud
        display {
          markdown
        }
        received
        created
        canonical_time
        is_failure
        is_anonymous
        country
        loc_subdiv1
        loc_subdiv2
        component
        version
        fields
        raw
      }
    }
  }
}`;

    expect(output).to.equal(answer);
  }

  @test public "should generate a GraphQL query string requesting a subset of available fields"() {
    const mask: Retraced.EventNodeMask = {
      action: true,
      actor: {
        name: true,
      },
      received: true,
    };
    const output: string = Retraced.graphQLQuery(mask);
    const answer = `query Search($query: String!, $last: Int, $before: String) {
  search(query: $query, last: $last, before: $before) {
    totalCount,
    pageInfo {
      hasPreviousPage
    }
    edges {
      cursor
      node {
        action
        actor {
          name
        }
        received
      }
    }
  }
}`;

    expect(output).to.equal(answer);
  }

  @test public "should format received, created, and fields on raw event node response"() {
    const raw: Retraced.RawEventNode = {
      action: "user.login",
      created: "2017-06-01T00:00:01Z",
      received: "2017-06-01T00:00:02Z",
      fields: [{
        key: "oauth",
        value: "google",
      }, {
        key: "tries",
        value: "2",
      }],
    };
    const answer: Retraced.EventNode = {
      action: "user.login",
      created: new Date("2017-06-01T00:00:01Z"),
      received: new Date("2017-06-01T00:00:02Z"),
      fields: {
        oauth: "google",
        tries: "2",
      },
    };
    const output = Retraced.formatRawEventNode(raw);

    expect(output).to.deep.equal(answer);
  }

  @test public "should stringify structured query objects"() {
    const queryObj: Retraced.StructuredQuery = {
      action: "user.*",
      received_start: new Date("2017-06-01T00:00:00Z"),
      received_end: new Date("2017-07-01T00:00:00Z"),
      description: "web login",
      crud: "c",
      actor_id: "user@domain.xyz",
      actor_name: "Some Actor",
    };
    const answer = `action:"user.*" crud:c received:2017-06-01T00:00:00.000Z,2017-07-01T00:00:00.000Z actor.name:"Some Actor" actor.id:user@domain.xyz description:"web login"`;
    const queryString = Retraced.stringifyStructuredQuery(queryObj);

    expect(queryString).to.equal(answer);
  }
}

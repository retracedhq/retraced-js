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
}

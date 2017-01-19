import { suite, test, slow, timeout, skip, only } from "mocha-typescript";
import { assert, expect } from "chai";

import * as Retraced from "./";

@suite class RetracedJSTests {
  @test public "should instantiate"() {
    const garbo = new Retraced.Client({
      apiKey: "lmao rn tbqh",
      projectId: "aaaahahahahahahaha",
    });

    expect(garbo).to.exist;
  }
}

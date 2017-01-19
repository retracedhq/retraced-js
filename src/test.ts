import { suite, test, slow, timeout, skip, only } from "mocha-typescript";
import { assert } from "chai";

import RetracedJS from "./";

@suite class RetracedJSTests {
  @test public "should instantiate"() {
    const garbo = new RetracedJS({
      apiKey: "lmao rn tbqh",
    });
    assert.isNotNull(garbo);
  }
}

/** @odoo-module */

import * as classic from "base.classic";
import * as aliased from "base.aliased";
export * as relative from "./addons/base/relative";
import * as john from "john";

function what() {
  aliased.foo;
  classic.foo;
}

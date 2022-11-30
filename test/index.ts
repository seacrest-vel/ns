import { readFileSync } from "fs"
import { join } from "path"
import { Component } from "../src/component"

const component = new Component(`<component name="foo" bar="baz"> {} </component>`, {name: "foo", bar: "baz", key: "val"})
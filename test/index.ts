import { readFileSync } from "fs";
import { join } from "path";
import { Component } from "../src/component";
import { NodeStruct } from "../src/node-struct";

const html = readFileSync(join(__dirname, "table-col.html"), "utf-8")
const tableRowHTML = readFileSync(join(__dirname, "table-row.html"), "utf-8")

// const node = NodeStruct.swap(html)
// const nodeRow = NodeStruct.swap(tableRowHTML)

const tableRow = new Component("table-col", NodeStruct.revert(tableRowHTML), {"justify-self": ["center"]})
const tableCol = new Component("table-col", NodeStruct.revert(html), {"justify-self": ["center"], justify: ["center"], align: ["middle"]})

const tableColElt = "<table-col justify-self=\"right\" align=\"bottom\"><span>span text</span></span></table-col>";
const tableRowElt = `<table-row justify-self=\"left\">
    ${tableColElt}
  </table-row>`;

const tableColNS = NodeStruct.revert(tableColElt);

const componentMarkup = tableCol.output(NodeStruct.revert(tableRowElt))


const ns = new NodeStruct({})


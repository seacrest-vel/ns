import { html2json, Node } from "html2json";
import { NodeStruct } from "../src/ee";
import { ElementStruct } from "../src/types";

const node: ElementStruct = {type: "text", tag: "div", text: "text", attributes: {"class": "div", id: "elt"}, children: [{text: "element text"}]}

const markup = NodeStruct.create(node)
const list = NodeStruct.create({children: [node, node]})
const node2 = html2json(markup)


// console.log(list);
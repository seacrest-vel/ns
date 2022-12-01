import { Component } from "./component";
import { Node as N } from "html2json";
import { NodeStruct } from "./ee";

class ElementStruct {
  constructor() {
    console.log("hallooo");
    
  }
  type?: "element" | "text";
  text?: string;
  tag?: string;
  attributes?: { [key: string]: string };
  children?: ElementStruct[];
  html?: ()  => string;
}

class NodeChild {
  node: "comment" | "element" | "root" | "text";
  attr?: {[key: string]: string | string[]};
  child?: N | N[];
  text?: string;
  tag?: string;
}

interface Props {
  name: string;
  import?: Component[]
}

type Attributes = {[key: string]: string | string[]};
type Values = {[key: string]: string};

export {
  Props,
  Attributes,
  Values,
  ElementStruct,
  NodeChild
}
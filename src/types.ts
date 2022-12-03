import { Component } from "./component";
import { Node as N } from "html2json";
import { NodeStruct } from "./node-struct";

class ElementStruct {
  type?: "element" | "text";
  text?: string;
  tag?: string;
  attributes?: { [key: string]: string };
  children?: ElementStruct[];
  html?: ()  => string;
}

export type {
  ElementStruct
}
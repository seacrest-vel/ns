import { html2json, json2html, Node } from "html2json";

type NS = {
  type?: "element" | "text";
  text?: string;
  tag?: string;
  attributes?: { [key: string]: string };
  children?: NS[];
}

export class NodeStruct {
  type?: "element" | "text";
  text?: string;
  tag?: string;
  attributes?: { [key: string]: string };
  children?: NodeStruct[];
  markup?: string;

  static styles: {[key: string]: string[]} = {
    fs: [ "font-size", "px" ],
    fw: [ "font-weight" ],
    ln: [ "line-height", "px" ],
    cl: ["color"],
    h: [ "height", "px" ],
    w: [ "width", "px" ],
  };

  static struct?: NS
  
  constructor(public ns?: NS) {
    NodeStruct.struct = ns;
  }

  static swap (value: string | Node): string | Node {
    return typeof value === "string" ? html2json(value) : json2html(value as Node);
  }

  static convert(ns: NS)  {
    return html2json(NodeStruct.createMarkup(ns));
  }

  static revertList(...node: Node[]): NS[] {
    return node.map(node => NodeStruct.revert(node));
  }

  static revert (value: string | Node): NS {
    const {node, attr, child, tag, text}: Node = typeof value === "string" ? html2json(value) : value;

    switch (node) {
      case "root": {
        if (!child || (child as Node[]).length !== 1) {
          return {} as NS;
        } else {
          return { ...(child as Node[])[0] } as unknown as NS;
        }
      } 

      case "element": {
        return {
          tag,
          type: (tag ? "element" : "text"),
          attributes: attr && Object.fromEntries(Object.entries(attr).map(([key, val]) => [key, (typeof val === "string" ? val : val.join(" "))])),
          children: this.revertList(...(child as Node[]))
        } as NodeStruct;
      }

      case "text": {
        return { type: "text", text } as NS
      }
      default: return {} as NS;
    }
  }
 
  static ejectEntry(node: Node | undefined): [ Node | undefined, Node[] | undefined] {
    if (node?.node === "root") {
      if (!node.child) return [ undefined, undefined ];
      if (!(node.child instanceof Array) && node.child) return [ node.child, undefined ];
      if ((node.child as Node[]).length === 1) {
        return [(node.child as Node[])[0], undefined]
      } else {
        const list = node.child.map<Node | undefined>((node) => {
          const [first] = this.ejectEntry(node);
          return first;
        });
        return [undefined, list as Node[] ]
      }
    }
    return [undefined, undefined]
  }

  static eject(node: Node | undefined): {node: Node | undefined, list: Node[] | undefined} {
    const [elt, ls] = this.ejectEntry(node);
    return { node: elt, list: ls };
  }

  static define(ns: NS) {
    console.log(ns);
    
    const results: {isNodeStruct?: boolean} = {};
    const node = new NodeStruct(ns);
    if (NodeStruct.struct && node.ns) {
      const NS = Object.values(NodeStruct.struct)
      results.isNodeStruct = Object.values(node.ns).filter((value, i) => typeof value === typeof NS[i]).length === NS.length;
      return results;
    }
    results.isNodeStruct = false;
    return results;
  }


  static createMarkup({tag, text, children, type, attributes}: NS): string {
    if (!tag && children) {
      return children.map<string>(node => NodeStruct.createMarkup(node)).join("");
    }
    children = [...(children || [])];
    type = tag ? "element" : "text";
    if (type === "text") {
      return text || "";
    } else {
      const attrs = attributes ? Object.entries(attributes).map(([k, v]) => ` ${k}="${v}"`).join('') : "";
      if (tag === "img" || tag === "input") {
        return `<${tag}${attrs}/>`;
      }
      
      return `<${tag}${attrs}>${children.map(elt => NodeStruct.createMarkup(elt)).join("") || text || ""}</${tag}>`
    }
  }

  createStyles(signature: string, as: "inline" | "css"): string {
    const splitSignature = (signature: string, delimeter: string = ""): [string, string] => {
      if (delimeter) {
        return <[string, string]>signature.split(delimeter);
      }
      const val = signature.replace(/\D+/g, "");
      const prop = signature.replace(val, "");
      return [prop, val];
    }

    const getStyleFromEntry = ([property, value]: [string, string]) => {
      const match = /(\D+\d+|\D+_\D+)/g.test(signature);
      if (!match) return "";
      
      if (!(property in NodeStruct.styles)) return "";
      const [prop, measures] = NodeStruct.styles[property];
      if (prop === "color" && value.at(0) === "x") {
        value = value.replace("x", "#");
      }
      return `${prop}: ${value}${measures || ""};` ;
    }    
    
    if (!signature.includes("-")) {
      return getStyleFromEntry(signature.includes("_") ? splitSignature(signature, "_") : splitSignature(signature));

    } else {
      return signature
        .split("-")
        .filter(style => style)
        .map(style => getStyleFromEntry(style.includes("_") ? splitSignature(style, "_") : splitSignature(style)))
        .reduce((prev, curr) => prev + curr);
    }
  }

  generateCSS(...classes: string[]): string {
    let css = "";
    classes.forEach(cls => {

      if (!cls.includes("-")) {
        let prop = cls.replace(/\D+/, "");
        if (!(prop in NodeStruct.styles)) return "";
      };

      css += `.${cls}{${this.createStyles(cls, "inline")}}`;

      if (cls.includes("mob")) {
        css = `@media(max-width: 767px){${css}}` ;
      }

      if (cls.includes("dsk") || cls.includes("desk")) {
        css = `@media(min-width: 768px){${css}}` ;
      }
    });

    return css;
  }

  
}

function countStr(substr: string, str: string, del?: string): number {
  const len = substr.length;
  const list = [];

  const s = str.replace(new RegExp(substr, 'g'), "");
  for(let i = len; i <= str.length - s.length; i+=len) {
    list.push(i)
  }

  return list.length;
}

function raw(markup: string) {
  
}


export type {
  NS
}
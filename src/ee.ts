import { html2json, json2html, Node } from "html2json";
import { ElementStruct } from "./types";

type foo = keyof Node


export class NodeStruct {
  constructor(public node: ElementStruct) {
  }


  static convert(value: string | Node | ElementStruct): string | Node {    
    if ((value as ElementStruct)?.type) return html2json(NodeStruct.create(value as ElementStruct));
    return typeof value === "string" ? html2json(value) : json2html(value as Node);
  }

  static revertList(...node: Node[]): ElementStruct[] {
    return node.map(node => NodeStruct.revert(node));
  }

  static revert (value: string | Node): ElementStruct {
    const {node, attr, child, tag, text}: Node = typeof value === "string" ? html2json(value) : value;

    switch (node) {
      case "root": {
        if (!child || (child as Node[]).length !== 1) {
          return {} as ElementStruct;
        } else {
          return {...(child as Node[])[0]} as ElementStruct;
        }
      } 

      case "element": {
        return {
          tag,
          type: (tag ? "element" : "text"),
          attributes: attr && Object.fromEntries(Object.entries(attr).map(([key, val]) => [key, (typeof val === "string" ? val : val.join(" "))])),
          children: this.revertList(...(child as Node[]))
        } as ElementStruct;
      }

      case "text": {
        return { type: "text", text } as ElementStruct
      }
      default: return {} as ElementStruct;
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




  static create({tag, text, children, type, attributes}: ElementStruct): string {
    if (!tag && children) {
      return children.map<string>(node => NodeStruct.create(node)).join("");
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
      
      return `<${tag}${attrs}>${children.map(elt => NodeStruct.create(elt)).join("") || text || ""}</${tag}>`
    }
  }
}
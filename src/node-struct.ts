import { html2json, json2html, Node } from "html2json";

type NS = {
  type?: "element" | "text";
  text?: string;
  tag?: string;
  attributes?: { [key: string]: string[] };
  children?: NS[];
  name?: string;
}

export class NodeStruct {
  public type?: "element" | "text";
  public text?: string;
  public tag?: string;
  public attributes?: { [key: string]: string[] };
  public children?: NodeStruct[];
  
  
  static styles: {[key: string]: string[]} = {
    fs: [ "font-size", "px" ],
    fw: [ "font-weight" ],
    ln: [ "line-height", "px" ],
    cl: ["color"],
    h: [ "height", "px" ],
    w: [ "width", "px" ],
    ff: [ "font-family" ]
  };
  
  
  static initialNS: NS = {type: undefined, tag: undefined, attributes: undefined, children: undefined, text: undefined, name: undefined};
  static configuredNS: {[key: string]: NS} = { default: this.initialNS };
  public nodes: {[key: string]: NS} = {default: NodeStruct.initialNS};
  public node: NS = NodeStruct.initialNS;
  
  constructor(public ns?: NS) {
    NodeStruct.config(ns);

    ns?.name ? this.nodes[ns.name] = NodeStruct.configuredNS[ns.name] : this.node = NodeStruct.configuredNS["default"];

  }

  static config(nodeStruct: NS = NodeStruct.initialNS): void {
    const config = {...NodeStruct.initialNS, ...nodeStruct};
    this.configuredNS["default"] = {...config};
    if (config.name) {
      this.configuredNS[config.name] = {...config};
    }
  }

  static add(name?: string): NS {
    return NodeStruct.configuredNS[name || "default"];
  }


  static swap(value: string | Node): string | Node {
    return typeof value === "string" ? html2json(value) : json2html(value as Node);
  }

  static swapJSON(ns: NS): Node {
    return html2json(NodeStruct.convert(ns));
  }

  static revert (value: string | Node, trim: boolean = false): NS {
    let n: Node = typeof value === "string" ? html2json(value) : value;
    const {node, attr, child, tag, text} = n;

    switch (node) {
      case "root": {
        if (!child) return {type: "text", text: ""} as NS;
        if (child && !(child instanceof Array)) return this.revert(child, trim)
        if (child instanceof Array && child.length === 1) return this.revert(child[0], trim)

        return { children: [...child.map(c => this.revert(c, trim))] };
      } 

      case "element": {
        return {
          tag,
          type: (tag ? "element" : "text"),
          text: !Array.isArray(child) ? child : "",
          attributes: attr ? Object.fromEntries(Object.entries(attr).map(([key, val]) => [ key, [...(val && typeof val === "string" ? [val] : [...val])] ] )) : undefined,
          children: child && Array.isArray(child) ? (child as Node[]).map(node => NodeStruct.revert(node, trim)) : child ? NodeStruct.revert(child, trim) : child
        } as NS;
      }

      case "text": {
        return { type: "text", text: trim && text ? text.replace(/\r/g, "").replace(/\n/g, "") : text } as NS
      }
      default: return {text: ""} as NS;
    }
  }


  static convert({tag, text, children, type, attributes}: NS, trim: boolean = false): string {
    
    const handleSpaces = (text?: string): string => {
      if (text && trim) {
        const startContentSpaces = text.startsWith(" ") && text.length > 1 && !text.includes(new RegExp(`\s{${text.length}}`, 'g').exec(text) ? new RegExp(`\s{${text.length}}`, 'g').exec(text)![0] : "  ");
        const endContentSpaces = text.endsWith(" ") && text.length > 1 && !text.includes(/\s+/g.exec(text) ? /\s+/g.exec(text)![0] : "  ");
        text = text.trim();

        if (startContentSpaces) {
          text = " " + text;
        }
        if (endContentSpaces) {
          text += " ";
        }
  
        return text;
      }

      return text || "";
    }
    
    
    if (!tag && children) {
      const c = children.map<string>(node => NodeStruct.convert(node, trim));

      text = handleSpaces(text);
      
      return !!c.length ? c.join("") : text || "";
    }

    children = [...(children || [])];
    type = tag ? "element" : "text";
    if (type === "text") {
      text = handleSpaces(text);
      
      return text || "";
    } else {
        const attrs = attributes ? Object.entries(attributes)
          .map(([k, v]) =>  " " + k + (NodeStruct.isAttrValue(v) ? (v.length === 1 ? `="${v[0]}"` : `="${v.join(" ")}"`) : ""))
          .join("") : "";
        if (tag === "img" || tag === "input") {
          return `<${tag}${attrs}/>`;
        }
        const c = children.map(elt => NodeStruct.convert(elt, trim));

        text = handleSpaces(text);
        
        return `<${tag}${attrs}>${ !!c.length ? c.join("") : text || ""}</${tag}>`;
    }
  }



  protected createStyles(styles: "inline" | "css", ...signature: string[]): string {
    const splitSignature = (signature: string, delimeter: string = ""): [string, string] => {
      
      if (delimeter) {
        return <[string, string]>signature.split(delimeter);
      }
      const val = signature.replace(/\D+/g, "");
      const prop = signature.replace(val, "");
      return [prop, val];
    }

    const getStyleFromEntry = ([property, value]: [string, string]) => {
      const match = /(\D+\d+|\D+_\D+)/g.test(signature.join("-"));
      if (!match) return "";
      
      if (!(property in NodeStruct.styles)) return "";
      const [prop, measures] = NodeStruct.styles[property];
      if (prop === "color" && value.at(0) === "x") {
        value = value.replace("x", "#");
      }
      if (prop === "font-family") {
        value = `"${value}" sans-serif`;
      }
      return `${prop}: ${value}${measures || ""};` ;
    }
    
    switch (styles) {
      case "inline": {
        if (signature.length === 1 && !signature[0].includes("-")) {
          return getStyleFromEntry(signature[0].includes("_") ? splitSignature(signature[0], "_") : splitSignature(signature[0]));
    
        } else {
          return signature
            .join("-")
            .split("-")
            .filter(isEmtyString => isEmtyString)
            .map(style => getStyleFromEntry(style.includes("_") ? splitSignature(style, "_") : splitSignature(style)))
            .join("");
        }
      }
      case "css": {
        return signature.map(cls => {
          let css = `.${cls}{${this.createStyles("inline", cls)}}`;

          if (cls.includes("mob")) {
            css = `@media(max-width: 767px){${css}}` ;
          }

          if (cls.includes("dsk") || cls.includes("desk")) {
            css = `@media(min-width: 768px){${css}}` ;
          }

          return css;
        }).join("");
      }
    }
  }

  static fix(ns:NS) {
    return NodeStruct.revert(NodeStruct.convert(ns, true));
  }

  static isAttrValue(attr: string[] | undefined): boolean {
    if (attr) {
      return !!attr.length && !!attr[0];
    }
    return false;
  }

  matchTimes(substr: string, str: string, del?: string): number {
    const len = substr.length;
    const list = [];
  
    const s = str.replace(new RegExp(substr, 'g'), "");
    for(let i = len; i <= str.length - s.length; i+=len) {
      list.push(i)
    }
  
    return list.length;
  }
  
}


export type { NS, Node }
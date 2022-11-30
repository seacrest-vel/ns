import { html2json, json2html, Node } from "html2json";
import { NodeResolver } from "./ee";
import { baseName } from "./config.json";
import { Attributes, Props, Values } from "./types";

export class Component<P = Props> extends NodeResolver {
  public name: string;
  public node: Node;
  private children: Node[] = [];
  private values: Values = {};

  constructor(private markup: string, private props: P & Props) {
    super();
    this.name = props.name;
    this.parseElements(markup);
  

    this.node = html2json(this.markup);

  }

  resolveAttributes(attr?: Attributes): Attributes | undefined {
    if (!attr) return;
    return Object.fromEntries(Object.entries(attr).map(([key, value]) => {
      if (value instanceof Array) {
        value = value.join(' ');
      }

      if (value.includes('{') && value.includes('}')) {
        value = value.slice((value.indexOf('{') + 1), value.indexOf('}'));
      }

      return [key, value];
    }));
  }

  resolveChildren(children: Node[]): Node[] {
    return children.map(node => this.resolveNode(node));
  }

  resolveNode(node: Node): Node {
    const attr = this.resolveAttributes(node.attr)
    if (attr) node.attr = {...attr};

    if (node.tag && !(node.tag.includes('-'))) {
      node = {...this.resolveNode(node)};
    } else {
      const components = this.props.import?.filter(component => component.name === node.tag);
      const component = !!components?.length ? components[0]: null;
        
      if (component && node.child) {
        node = this.getNodeChildren(component.node, node.child);
      }
    }
    
    if (node.node === "text" && (node.text)?.includes("{") && node.text.includes("}")) {
      node.text = this.evaluate(node.text, this.values);
    }

    return {...node};
  }

  parseElements(markup: string): void {

    const base = (html2json(markup).child as Node[])[0];
    if (base.tag !== baseName || !base.attr?.name) {
      throw new Error(`Component signature error: \nBase element has to be at least \n<${baseName} name="[Component Name]">\n</${baseName}>`);
    }

    if (this.props.name !== base.attr.name) {
      throw new Error(`Component signature error: \nComponent's name is not the same as properties one`);
    }

    if (!base.child) {
      throw new Error(`Component signature error: \nBase element has to contain at least one child element`);
    }
    
    const undeclaredProps = Object.entries(base.attr).filter(([prop]) => !this.props.hasOwnProperty(prop));
    if (!!undeclaredProps.length) {
      const [wrongKey, wrongVal] = undeclaredProps[0];
      throw new Error(`Component signature error: \nBase element includes undeclared property >> ${wrongKey}="${wrongVal}"`);
    } else {
      this.values = {...(base.attr as Values)};
    }

    this.children = [...(base.child as Node[])];

    
  }

  getNodeChildren(node: Node, children: Node | Node[]): Node {
    if (node.tag === "children") {
      node.child = children;
      return node;
    } else {
      return this.getNodeChildren(node, children);
    }
  }

  evaluate(str: string, values: Values): string {
    let res = str;
    
    Object.entries(values).forEach(([key, value]) => {res = res.replace(new RegExp(`{${key}}`, "g"), value.toString())});
  
    return res;
  }

  resolve(maprkup: string, props: P & Props) {
  }
}
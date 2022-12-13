import { NodeStruct, NS } from "./node-struct";

export type Props = {[key: string]: string[]} & {key?: string[]}

export class Component extends NodeStruct {
  styles = "";
  
  constructor(public readonly name: string, public markupStruct: NS, private props: Props = {}) {
    super();
  }

  output(nodeStruct: NS, styles: boolean = false): string {
    const markupStruct = this.resolve(nodeStruct);

    return NodeStruct.convert(markupStruct, true);
  }


  updateProps(ns: NS): NS {
    if (ns.attributes) {
      this.props = <Props>{...this.props, ...Object.fromEntries(Object.entries(ns.attributes).filter(([k, v]) => k in this.props))};
    }
    return ns;
  }


  resolveProps(ns: NS = this.markupStruct, styles = false): NS {

    if (ns.attributes) {

      if (ns.attributes.class) {
        this.styles = this.resolveStyles(...ns.attributes.class);
      }
      
      ns.attributes = Object.fromEntries(Object.entries(ns.attributes).map(([prop, value]) => {
        if (prop === "key") return [prop, value];
        
        const valsInProps = value.filter(val => val in this.props!).map(val => this.props![val]);
        const valsNotInProps = value.filter(val => !(val in this.props!));
        
        const values = [...valsNotInProps, ...valsInProps.flat()];

        return [prop, values];
      }));
    }

    if (ns.children) {
      ns.children = [...ns.children.map(child => this.resolveProps(child))];
    }

    return ns
  }

  resolveStyles(...styles: string[]) {
    return this.createStyles("css", ...styles);
  }

  resolveChildren(children?: NS[]) {
    const markup = NodeStruct.convert(this.markupStruct);
    
    if (children) {
      const childrenMarkup = NodeStruct.convert({children: [...children]});
      
      return NodeStruct.revert(markup.replace("<children></children>", childrenMarkup)); 
    }

    return NodeStruct.revert(markup.replace("<children></children>", ""));
  }



  private resolve(ns: NS): NS {
    this.updateProps(ns);
    this.markupStruct = this.resolveProps();
    this.markupStruct = this.resolveChildren(ns.children);

    return this.markupStruct;
  }
}
import { Component } from "./component";


interface Props {
  name: string;
  import?: Component[]
}

type Attributes = {[key: string]: string | string[]};
type Values = {[key: string]: string};

export {
  Props,
  Attributes,
  Values
}
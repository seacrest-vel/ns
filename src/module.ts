import { Component, Props } from "./component";

type ModuleConfig = {
  name: string,
  prefix: string,
  components: {
    name: string,
    src: string,
    props: Props
  }[]
}

export class Module  {
  public name: string;
  

  constructor() {

  }
  

  config({name, prefix = "ns", components}: ModuleConfig) {

  }
}
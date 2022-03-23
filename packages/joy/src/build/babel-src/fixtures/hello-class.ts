export class HelloClass extends Object {
  public msg: string;
  public msg1: string;
  public msg2: string;

  constructor(msg: string) {
    super();
    this.msg = msg;
  }

  public hello() {
    return "Hello " + this.msg;
  }
}

import { ReactModel, Model } from "@symph/tempo";

interface State {
  counter: number;
  hello: string;
}

@Model()
export class CalculateModel extends ReactModel<State> {
  public getInitState(): State {
    return {
      counter: 1,
      hello: "hello joy",
    };
  }

  async add(number: number) {
    let { counter } = this.state;

    counter += number;
    this.setState({
      counter,
    });
  }
}

// export default model()(CalculateModel)

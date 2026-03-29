import { checkIidxCsv } from "../../iidx.js";

export class RuleIidxCsv {
  get errorMessage() {
    return "CSVにエラーがあります。";
  }

  valueIsValid(value) {
    const result = checkIidxCsv(value);
    if (!result.isValid) {
      console.error(`invalid csv at line ${result.line}: ${result.error}`);
    }
    return result.isValid;
  }
}

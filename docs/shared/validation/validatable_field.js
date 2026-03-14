export default class ValidatableField {
  constructor(textInput, label, rules) {
    this.textInput = textInput;
    this.label = label;
    this.rules = rules;

    this._inputWatcher = null;
  }

  warnIfInvalid() {
    const violatedRule = this.rules.find(
      (rule) => !rule.valueIsValid(this.textInput.value),
    );
    if (violatedRule == null) {
      return false;
    }

    this.textInput.classList.add("warning");
    this.label.innerText = violatedRule.errorMessage;

    this._inputWatcher = (_event) => {
      if (violatedRule.valueIsValid(this.textInput.value)) {
        this.clearWarning();
      }
    };
    this.textInput.addEventListener("change", this._inputWatcher);

    return true;
  }

  clearWarning() {
    if (this._inputWatcher != null) {
      this.textInput.removeEventListener("change", this._inputWatcher);
      this._inputWatcher = null;
    }
    this.textInput.classList.remove("warning");
    this.label.innerText = "";
  }
}

export default interface IValidationRule {
    isValid(param: string): [boolean, string];
    isMatch(type: string): boolean;
    setParams(params: any): void;
    setErrorMessage(message: string): void;
}

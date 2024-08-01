/**
 * Interface for a validation rule.
 */
export default interface IValidationRule {
    /**
     * Validates the provided parameter.
     * @param param - The value to be validated.
     * @returns A tuple with a boolean indicating if the value is valid, and a string with the error message if invalid.
     */
    isValid(param: string): [boolean, string];

    /**
     * Checks if the rule matches the given type.
     * @param type - The type of validation rule.
     * @returns A boolean indicating if the rule matches the type.
     */
    isMatch(type: string): boolean;

    /**
     * Sets parameters for the validation rule.
     * @param params - An object containing parameters for the rule.
     */
    setParams(params: any): void;

    /**
     * Sets a custom error message for the validation rule.
     * @param message - The custom error message.
     */
    setErrorMessage(message: string): void;
}

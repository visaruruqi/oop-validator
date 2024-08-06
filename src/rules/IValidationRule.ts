/**
 * Interface for a validation rule.
 */
export default class IValidationRule {
    /**
     * Validates the provided parameter.
     * @param param - The value to be validated.
     * @returns A tuple with a boolean indicating if the value is valid, and a string with the error message if invalid.
     */
    // @ts-ignore
    isValid(param: string): [boolean, string] {
        throw new Error("isValid method must be implemented");
    }

    /**
     * Checks if the rule matches the given type.
     * @param type - The type of validation rule.
     * @returns A boolean indicating if the rule matches the type.
     */
    // @ts-ignore
    isMatch(type: string): boolean {
        throw new Error("isMatch method must be implemented");
    }

    /**
     * Sets parameters for the validation rule.
     * @param params - An object containing parameters for the rule.
     */
    // @ts-ignore
    setParams(params: any): void {
        throw new Error("setParams method must be implemented");
    }

    /**
     * Sets a custom error message for the validation rule.
     * @param message - The custom error message.
     */
    // @ts-ignore
    setErrorMessage(message: string): void {
        throw new Error("setErrorMessage method must be implemented");
    }
}

import IValidationRule from "./IValidationRule.ts";
import RequiredValidationRule from "./RequiredValidationRule.ts";
import MinValidationRule from "./MinValidationRule.ts";
import MaxValidationRule from "./MaxValidationRule.ts";
import EmailValidationRule from "./EmailValidationRule.ts";
import DomainValidationRule from "./DomainValidationRule.ts";
import RegexValidationRule from "./RegexValidationRule.ts";
import BankAccountValidationRule from "./BankAccountValidationRule.ts";
import CreditCardValidationRule from "./CreditCardValidationRule.ts";
import ZipCodeValidationRule from "./ZipCodeValidationRule.ts";
import PhoneNumberValidationRule from "./PhoneNumberValidationRule.ts";
import DateValidationRule from "./DateValidationRule.ts";
import UrlValidationRule from "./UrlValidationRule.ts";
import UsernameValidationRule from "./UsernameValidationRule.ts";
import PasswordStrengthValidationRule from "./PasswordStrengthValidationRule.ts";
import IpAddressValidationRule from "./IpAddressValidationRule.ts";
import CurrencyValidationRule from "./CurrencyValidationRule.ts";
import SocialSecurityValidationRule from "./SocialSecurityValidationRule.ts";

export default class ValidationEngine {
    private rules: IValidationRule[] = [];

    constructor(initialRules: Array<string | { rule: string, params: any, message?: string } | IValidationRule> = []) {
        initialRules.forEach(rule => this.addRule(rule));
    }

    getRules(): IValidationRule[] {
        return this.rules;
    }

    addRule(rule: string | { rule: string, params: any, message?: string } | IValidationRule) {
        if (typeof rule === 'object' && 'isValid' in rule) {
            this.rules.push(rule as IValidationRule);
        } else {
            const newRule = this.createRule(rule);
            if (newRule) {
                this.rules.push(newRule);
            }
        }
    }

    private createRule(rule: string | { rule: string, params: any, message?: string }): IValidationRule | null {
        let type: string;
        let params: any = {};
        let message: string | undefined;

        if (typeof rule === 'string') {
            type = rule;
        } else {
            type = rule.rule;
            params = rule.params;
            message = rule.message;
        }

        let validationRule: IValidationRule | null = null;

        switch (type.toLowerCase()) {
            case 'required':
                validationRule = new RequiredValidationRule();
                break;
            case 'min':
                validationRule = new MinValidationRule();
                break;
            case 'max':
                validationRule = new MaxValidationRule();
                break;
            case 'email':
                validationRule = new EmailValidationRule();
                break;
            case 'domain':
                validationRule = new DomainValidationRule();
                break;
            case 'regex':
                validationRule = new RegexValidationRule(params.regex || '');
                break;
            case 'bankaccount':
                validationRule = new BankAccountValidationRule();
                break;
            case 'creditcard':
                validationRule = new CreditCardValidationRule();
                break;
            case 'zipcode':
                validationRule = new ZipCodeValidationRule();
                break;
            case 'phone':
                validationRule = new PhoneNumberValidationRule();
                break;
            case 'date':
                validationRule = new DateValidationRule();
                break;
            case 'url':
                validationRule = new UrlValidationRule();
                break;
            case 'username':
                validationRule = new UsernameValidationRule();
                break;
            case 'password':
                validationRule = new PasswordStrengthValidationRule();
                break;
            case 'ip':
                validationRule = new IpAddressValidationRule();
                break;
            case 'currency':
                validationRule = new CurrencyValidationRule();
                break;
            case 'ssn':
                validationRule = new SocialSecurityValidationRule();
                break;
            default:
                console.warn(`Unknown validation rule: ${type}`);
                break;
        }

        if (validationRule) {
            validationRule.setParams(params);
            if (message) {
                validationRule.setErrorMessage(message);
            }
        }

        return validationRule;
    }

    isValid(param: string, type: string): [boolean, string] {
        const rule = this.rules.find(r => r.isMatch(type));
        if (rule) {
            return rule.isValid(param.trim());
        }
        return [false, `No matching rule found for type: ${type}`];
    }

    validateValue(value: any): { isValid: boolean, errors: string[] } {
        const errors: string[] = [];

        this.rules.forEach(rule => {
            const [isValid, errorMessage] = rule.isValid(value);
            if (!isValid) {
                errors.push(errorMessage);
            }
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}



import IValidationRule from "./IValidationRule";
import RequiredValidationRule from "./RequiredValidationRule";
import MinValidationRule from "./MinValidationRule";
import MaxValidationRule from "./MaxValidationRule";
import EmailValidationRule from "./EmailValidationRule";
import DomainValidationRule from "./DomainValidationRule";
import RegexValidationRule from "./RegexValidationRule";
import BankAccountValidationRule from "./BankAccountValidationRule";
import CreditCardValidationRule from "./CreditCardValidationRule";
import ZipCodeValidationRule from "./ZipCodeValidationRule";
import PhoneNumberValidationRule from "./PhoneNumberValidationRule";
import DateValidationRule from "./DateValidationRule";
import UrlValidationRule from "./UrlValidationRule";
import UsernameValidationRule from "./UsernameValidationRule";
import PasswordStrengthValidationRule from "./PasswordStrengthValidationRule";
import IpAddressValidationRule from "./IpAddressValidationRule";
import CurrencyValidationRule from "./CurrencyValidationRule";
import SocialSecurityValidationRule from "./SocialSecurityValidationRule";
import NumericMinValidationRule from "./NumericMinValidationRule";
import NumericMaxValidationRule from "./NumericMaxValidationRule";
import NumberValidationRule from "./NumberValidationRule";

export default class ValidationEngine {
    private rules: IValidationRule[] = [];
    private ruleKeyMap = new Map<IValidationRule, string>();
    private currentErrors: string[] = [];
    private currentIsValid: boolean = true;

    constructor(initialRules: Array<string | { rule: string, params: any, message?: string } | IValidationRule> = []) {
        initialRules.forEach(rule => this.addRule(rule));
    }

    getRules(): IValidationRule[] {
        return this.rules;
    }

    getErrors(): string[] {
        return [...this.currentErrors];
    }

    getIsValid(): boolean {
        return this.currentIsValid;
    }

    reset(): void {
        this.currentErrors = [];
        this.currentIsValid = true;
    }

    addRule(rule: string | { rule: string, params: any, message?: string } | IValidationRule, ruleInstance?: IValidationRule) {
        if (ruleInstance !== undefined && typeof rule === 'string') {
            // New overload: addRule('mykey', ruleInstance)
            ruleInstance.ruleKey = rule;
            this.rules.push(ruleInstance);
            this.ruleKeyMap.set(ruleInstance, rule);
        } else if (typeof rule === 'object' && 'isValid' in rule) {
            // Existing: addRule(IValidationRule instance)
            this.rules.push(rule as IValidationRule);
            if ((rule as IValidationRule).ruleKey) {
                this.ruleKeyMap.set(rule as IValidationRule, (rule as IValidationRule).ruleKey);
            }
        } else {
            // Existing: addRule('required') or addRule({ rule: 'min', params: ... })
            const newRule = this.createRule(rule as string | { rule: string, params: any, message?: string });
            if (newRule) {
                this.rules.push(newRule);
                const key = typeof rule === 'string' ? rule : (rule as any).rule;
                const normalizedKey = key.toLowerCase();
                this.ruleKeyMap.set(newRule, normalizedKey);
                newRule.ruleKey = normalizedKey;
            }
        }
    }

    removeRule(key: string): void {
        const idx = this.rules.findIndex(r => this.ruleKeyMap.get(r) === key);
        if (idx !== -1) {
            this.ruleKeyMap.delete(this.rules[idx]);
            this.rules.splice(idx, 1);
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
            case 'numericmin':
                validationRule = new NumericMinValidationRule();
                break;
            case 'numericmax':
                validationRule = new NumericMaxValidationRule();
                break;
            case 'number':
                validationRule = new NumberValidationRule();
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

    validateValue(value: any): { isValid: boolean, errors: string[], errorsByRule: Record<string, boolean> } {
        const errors: string[] = [];
        const errorsByRule: Record<string, boolean> = {};

        this.rules.forEach(rule => {
            const [isValid, errorMessage] = rule.isValid(value);
            const key = this.ruleKeyMap.get(rule);
            if (!isValid) {
                errors.push(errorMessage);
                if (key) errorsByRule[key] = true;
            } else {
                if (key) errorsByRule[key] = false;
            }
        });

        this.currentErrors = errors;
        this.currentIsValid = errors.length === 0;

        return { isValid: errors.length === 0, errors, errorsByRule };
    }
}

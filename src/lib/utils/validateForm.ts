export interface FieldError {
    field: string;
    message: string;
}

export function validateInquiry(data: any) {
    const errors: FieldError[] = [];

    if (!data.name || data.name.trim().length === 0) {
        errors.push({ field: 'name', message: '성함을 입력해 주세요.' });
    }

    if (!data.company || data.company.trim().length === 0) {
        errors.push({ field: 'company', message: '회사명을 입력해 주세요.' });
    }

    if (!data.phone || !validatePhone(data.phone)) {
        errors.push({ field: 'phone', message: '올바른 연락처(010-0000-0000)를 입력해 주세요.' });
    }

    if (data.email && !validateEmail(data.email)) {
        errors.push({ field: 'email', message: '올바른 이메일 형식을 입력해 주세요.' });
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

export function validateEmail(email: string) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

export function validatePhone(phone: string) {
    const re = /^010-\d{3,4}-\d{4}$/;
    return re.test(phone);
}

export function sanitizeInput(input: string) {
    return input.replace(/[<>]/g, '');
}

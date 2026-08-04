const argon2 = require("argon2");

class PasswordService {
    async hashPassword(password) {
        try {
            return await argon2.hash(password, {
                type: argon2.argon2id,
                memoryCost: 2 ** 16, // 64MB
                timeCost: 3,
                parallelism: 1,
                hashLength: 32
            })
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async verifyPassword(password, hashedPassword) {
        try {
            return await argon2.verify(hashedPassword, password);
        } catch (error) {
            throw new Error(error.message);
        }
    }

    validatePasswordStrength(password) {
    if (typeof password !== 'string') {
        const err = new Error('Password must be a string');
        err.statusCode = 400;
        throw err;
    }

    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];

    if (password.length < minLength) errors.push('at least 8 characters');
    if (!hasUpperCase) errors.push('one uppercase letter');
    if (!hasLowerCase) errors.push('one lowercase letter');
    if (!hasNumbers) errors.push('one number');
    if (!hasSpecialChar) errors.push('one special character');

    if (errors.length > 0) {
        const err = new Error(`Password must contain: ${errors.join(', ')}`);
        err.statusCode = 400;
        throw err;
    }

    return true;
}
}

module.exports = new PasswordService();
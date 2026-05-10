import { z } from 'zod';

const E164_REGEX = /^\+[1-9]\d{4,14}$/;

export const e164Phone = z
    .string()
    .regex(E164_REGEX, 'Telefone inválido. Use formato internacional (+5511999999999)')
    .optional();

export const e164PhoneOptional = z
    .union([z.literal(''), e164Phone])
    .optional()
    .transform((v) => (v === '' ? undefined : v));

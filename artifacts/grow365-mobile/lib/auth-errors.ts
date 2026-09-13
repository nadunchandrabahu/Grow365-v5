import { AuthError } from '@supabase/supabase-js';

export interface AuthFormErrors {
  email?: string;
  password?: string;
  name?: string;
  form?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | undefined {
  const value = email.trim();
  if (!value) return 'Enter your email address.';
  if (!EMAIL_PATTERN.test(value)) {
    return 'Enter a complete email address, such as name@example.com.';
  }
  return undefined;
}

export function validatePassword(password: string): string | undefined {
  if (!password) return 'Enter your password.';
  if (password.length < 8) {
    return 'Use at least 8 characters for your password.';
  }
  return undefined;
}

export function validateName(name: string): string | undefined {
  if (!name.trim()) return 'Enter the name you would like us to use.';
  if (name.trim().length < 2) return 'Use at least 2 characters for your name.';
  return undefined;
}

export function authErrorMessage(error: unknown): string {
  if (!(error instanceof AuthError)) {
    return 'We could not complete that request. Check your connection and try again.';
  }

  const message = error.message.toLowerCase();
  if (message.includes('invalid login credentials')) {
    return 'The email address or password is incorrect. Check both and try again.';
  }
  if (message.includes('email not confirmed')) {
    return 'Confirm your email using the message we sent, then try signing in again.';
  }
  if (message.includes('user already registered')) {
    return 'An account already uses this email address. Sign in or reset your password instead.';
  }
  if (message.includes('password')) {
    return 'That password is not accepted. Use at least 8 characters and try again.';
  }
  if (message.includes('rate') || message.includes('too many')) {
    return 'Too many attempts were made. Wait a few minutes, then try again.';
  }
  return 'We could not complete that request. Check your details and try again.';
}
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from './firebaseClient.js';

const ACCOUNT_DOMAIN = 'concursos-elite.firebaseapp.com';

export function normalizeUsername(username) {
  return username.trim().toLowerCase();
}

export function validateUsername(username) {
  return /^[a-z0-9._-]{3,24}$/.test(normalizeUsername(username));
}

export function generateRecoveryCode() {
  const bytes = new Uint8Array(24);
  globalThis.crypto.getRandomValues(bytes);
  const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '').match(/.{1,4}/g).join('-').toUpperCase();
}

export async function getUsernameEmail(username) {
  const normalized = normalizeUsername(username);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
  const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  return `u-${hash.slice(0, 40)}@${ACCOUNT_DOMAIN}`;
}

function normalizeRecoveryCode(code) {
  return code.replace(/[^a-z0-9]/gi, '').toUpperCase();
}

export async function createUsernameAccount(username, recoveryCode) {
  const email = await getUsernameEmail(username);
  return createUserWithEmailAndPassword(auth, email, normalizeRecoveryCode(recoveryCode));
}

export async function recoverUsernameAccount(username, recoveryCode) {
  const email = await getUsernameEmail(username);
  return signInWithEmailAndPassword(auth, email, normalizeRecoveryCode(recoveryCode));
}

export function leaveUsernameAccount() {
  return signOut(auth);
}

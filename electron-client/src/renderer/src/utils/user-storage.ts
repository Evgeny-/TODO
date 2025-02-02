export function setJwtAuthToken(token: string | null) {
  sessionStorage.setItem('token', token ?? '');
}

export function getJwtAuthToken() {
  return sessionStorage.getItem('token');
}

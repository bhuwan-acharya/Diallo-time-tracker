export const decodeToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1])); // Decode the Base64 payload
    return payload;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};
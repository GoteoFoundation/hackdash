import _ from "underscore";
import axios from "axios";

// Simple check if a string is a gravatar url
export const isGravatar = (url) => /[www\.]gravatar\.com\/avatar\//.test(url);

// Obtain hash from gravatar url
export const getHash = (url) => {
  const matches = /gravatar.com\/avatar\/([a-z0-9]*)/.exec(url);
  return matches && matches[1];
};

const testUrl = async (url) => {
  try {
    const response = await axios.head(url);
    return true;
  } catch (error) {
    // console.log(error);
    return false;
  }
};

// check image availability to check if gravatar is valid
export const isValid = (url) => {
  const hash = getHash(url);
  // console.log(hash);
  if(hash) return testUrl(`https://www.gravatar.com/avatar/${hash}?d=404`);
  return false;
};

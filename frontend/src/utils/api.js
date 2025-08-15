// src/utils/api.js
import axios from 'axios';

export default axios.create({
  baseURL: 'http://localhost:5000/api/rentals', // no trailing slash needed
});
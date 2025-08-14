// src/utils/api.js
import axios from 'axios';
import { supabase } from './SupabaseClient';

export default axios.create({
  baseURL: 'http://localhost:5000/api/rentals', // no trailing slash needed
});

// Fetch rentals
export async function fetchRentals() {
  const { data, error } = await supabase.from('rentals').select('*');
  if (error) throw error;
  return data;
}

// Add rental
export async function addRental(rental) {
  const { data, error } = await supabase.from('rentals').insert([rental]);
  if (error) throw error;
  return data;
}
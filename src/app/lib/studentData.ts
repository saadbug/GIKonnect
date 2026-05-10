
import { supabase } from './supabase';

/**
 * Dynamically retrieves a student's name from the Supabase database.
 * @param regNo The registration number to search for (e.g., "2023623")
 */
export async function getStudentName(regNo: string | number): Promise<string | null> {
  const searchReg = String(regNo).trim();

  const { data, error } = await supabase
    .from('students')
    .select('name')
    .eq('reg_no', searchReg)
    .single();

  if (error || !data) {
    console.error(`Error fetching student ${searchReg}:`, error?.message);
    return null;
  }

  // Format the name nicely to Title Case
  return toTitleCase(data.name.trim());
}

function toTitleCase(str: string): string {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}
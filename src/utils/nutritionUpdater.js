import { supabase } from '../supabaseClient';

/**
 * Recalculates nutrition status for all students based on their latest BMI record.
 *
 * Rules:
 * Severely Wasted – BMI < 12
 * Wasted – BMI ≥ 12 and < 14
 * Normal – BMI ≥ 14 and < 18.5
 * Overweight – BMI ≥ 18.5 and < 23
 * Obese – BMI ≥ 23
 *
 * Only updates students who have a BMI record. Students without BMI records are left as is.
 *
 * @returns {Promise<number>} The number of student records updated.
 */
export async function recalculateStudentNutritionStatus() {
  // 1. Fetch all students (id, nutrition_status)
  const { data: students, error: sError } = await supabase
    .from('students')
    .select('id, nutrition_status')
    .range(0, 9999);

  if (sError) throw sError;

  // 2. Fetch all BMI records
  // We need to get the latest BMI record for each student.
  const { data: bmiRecords, error: bError } = await supabase
    .from('bmi_records')
    .select('student_id, bmi, created_at')
    .order('created_at', { ascending: false })
    .range(0, 9999);

  if (bError) throw bError;

  // 3. Process records to find the latest BMI for each student
  const latestBmiMap = {};
  bmiRecords.forEach(record => {
    // Since records are ordered by created_at desc, the first one encountered for a student is the latest.
    if (!latestBmiMap[record.student_id]) {
      latestBmiMap[record.student_id] = record;
    }
  });

  const updates = [];

  for (const student of students) {
    const bmiRecord = latestBmiMap[student.id];
    if (bmiRecord) {
      const bmi = parseFloat(bmiRecord.bmi);
      let status = 'Unknown';

      if (bmi < 12) status = 'Severely Wasted';
      else if (bmi >= 12 && bmi < 14) status = 'Wasted';
      else if (bmi >= 14 && bmi < 18.5) status = 'Normal';
      else if (bmi >= 18.5 && bmi < 23) status = 'Overweight';
      else if (bmi >= 23) status = 'Obese';

      // Compare status
      // We also handle cases where current status is null/undefined
      const currentStatus = student.nutrition_status || 'Unknown';

      if (status !== currentStatus) {
        updates.push({
          id: student.id,
          nutrition_status: status
        });
      }
    }
  }

  // 4. Perform updates
  let updatedCount = 0;
  const CHUNK_SIZE = 20; // Conservative batch size

  for (let i = 0; i < updates.length; i += CHUNK_SIZE) {
    const chunk = updates.slice(i, i + CHUNK_SIZE);

    // Execute updates in parallel for the chunk
    await Promise.all(chunk.map(u =>
      supabase.from('students').update({ nutrition_status: u.nutrition_status }).eq('id', u.id)
    ));

    updatedCount += chunk.length;
  }

  return updatedCount;
}

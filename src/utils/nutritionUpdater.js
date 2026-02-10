import { supabase } from '../supabaseClient';

export const recalculateNutritionStatus = async () => {
  try {
    // 1. Fetch all students (id, nutrition_status)
    const { data: students, error: sError } = await supabase
      .from('students')
      .select('id, nutrition_status')
      .range(0, 9999);

    if (sError) throw sError;

    // 2. Fetch all BMI records (student_id, bmi, created_at)
    // Ordered by created_at desc so the first one we see for a student is the latest.
    const { data: bmiRecords, error: bError } = await supabase
      .from('bmi_records')
      .select('student_id, bmi, created_at')
      .order('created_at', { ascending: false })
      .range(0, 9999);

    if (bError) throw bError;

    // 3. Map student -> latest BMI
    const latestBmiMap = {};
    bmiRecords.forEach(record => {
      if (!latestBmiMap[record.student_id]) {
        latestBmiMap[record.student_id] = parseFloat(record.bmi);
      }
    });

    // 4. Calculate new statuses and group by target status
    const updates = {
      'Severely Wasted': [],
      'Wasted': [],
      'Normal': [],
      'Overweight': [],
      'Obese': [],
      'Unknown': [] // For students who have BMI records but somehow fell through? No, this is just for safety.
    };

    let updateCount = 0;

    for (const student of students) {
      const bmi = latestBmiMap[student.id];

      // If no BMI, skip updating (leave as is or Unknown, but prompt says "Leave students without BMI records as Unknown")
      // If their current status is something else but they have NO BMI, maybe we should set to Unknown?
      // But prompt says "Leave students without BMI records as Unknown." which implies don't touch them if they don't have BMI, or set them to Unknown if they don't have BMI.
      // However, "Update all students whose Nutrition Status is currently Unknown by computing their status based on existing BMI records..." suggests the focus is on those with BMI.
      // I will only update students who have a valid BMI record.
      if (bmi === undefined || bmi === null || isNaN(bmi)) continue;

      let status = 'Unknown';
      if (bmi < 12) status = 'Severely Wasted';
      else if (bmi < 14) status = 'Wasted';
      else if (bmi < 18.5) status = 'Normal';
      else if (bmi < 23) status = 'Overweight';
      else status = 'Obese'; // >= 23

      // Check if update is needed
      // Normalize current status to Title Case just in case
      const currentStatus = student.nutrition_status || 'Unknown';

      if (currentStatus !== status) {
        if (updates[status]) {
            updates[status].push(student.id);
            updateCount++;
        }
      }
    }

    // 5. Perform batch updates
    const promises = [];
    for (const [status, ids] of Object.entries(updates)) {
      if (ids.length > 0) {
        // Update in batches of 1000 just in case
        const batchSize = 1000;
        for (let i = 0; i < ids.length; i += batchSize) {
          const batch = ids.slice(i, i + batchSize);
          promises.push(
            supabase
              .from('students')
              .update({ nutrition_status: status })
              .in('id', batch)
          );
        }
      }
    }

    await Promise.all(promises);
    return { success: true, updated: updateCount };

  } catch (error) {
    console.error("Error recalculating nutrition status:", error);
    return { success: false, error };
  }
};

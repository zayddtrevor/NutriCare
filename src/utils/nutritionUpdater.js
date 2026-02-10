import { supabase } from "../supabaseClient";

/**
 * Recalculates nutrition status for students with 'Unknown' status based on their latest BMI record.
 *
 * Rules:
 * Severely Wasted – BMI < 12
 * Wasted – BMI ≥ 12 and < 14
 * Normal – BMI ≥ 14 and < 18.5
 * Overweight – BMI ≥ 18.5 and < 23
 * Obese – BMI ≥ 23
 */
export async function recalculateNutritionStatus() {
  try {
    console.log("Starting nutrition status recalculation...");

    // 1. Fetch all students who need update (nutrition_status is null, 'Unknown', or '-')
    const { data: students, error: studentError } = await supabase
      .from("students")
      .select("id, nutrition_status");

    if (studentError) throw studentError;

    const targetStudents = students.filter(
      (s) => !s.nutrition_status || s.nutrition_status === "Unknown" || s.nutrition_status === "-"
    );

    if (targetStudents.length === 0) {
      console.log("No students found with 'Unknown' status.");
      return { success: true, count: 0, message: "No students needed updates." };
    }

    console.log(`Found ${targetStudents.length} students to check.`);

    // 2. Fetch all BMI records to find the latest for each student
    // Optimization: Fetch only needed columns and sort by created_at desc
    const { data: allBmiRecords, error: bmiError } = await supabase
      .from("bmi_records")
      .select("student_id, bmi, created_at")
      .order("created_at", { ascending: false });

    if (bmiError) throw bmiError;

    // Map student_id -> latest BMI record
    const latestBmiMap = {};
    allBmiRecords.forEach((record) => {
      // Since we ordered by created_at desc, the first one we see is the latest
      if (!latestBmiMap[record.student_id]) {
        latestBmiMap[record.student_id] = record;
      }
    });

    // 3. Determine updates
    const updates = [];
    for (const student of targetStudents) {
      const record = latestBmiMap[student.id];
      if (record && record.bmi != null) {
        const bmi = parseFloat(record.bmi);
        let status = "Unknown";

        if (bmi < 12) status = "Severely Wasted";
        else if (bmi >= 12 && bmi < 14) status = "Wasted";
        else if (bmi >= 14 && bmi < 18.5) status = "Normal";
        else if (bmi >= 18.5 && bmi < 23) status = "Overweight";
        else if (bmi >= 23) status = "Obese";

        // Only update if we calculated a valid status
        if (status !== "Unknown") {
          updates.push({
            id: student.id,
            nutrition_status: status
          });
        }
      }
    }

    console.log(`Identified ${updates.length} students to update.`);

    // 4. Perform updates (Batching requests)
    // We use .update() to ensure we only modify the nutrition_status column
    const BATCH_SIZE = 20; // Concurrent requests
    let updatedCount = 0;

    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch = updates.slice(i, i + BATCH_SIZE);
      const promises = batch.map(u =>
        supabase
          .from("students")
          .update({ nutrition_status: u.nutrition_status })
          .eq("id", u.id)
      );

      await Promise.all(promises);
      updatedCount += batch.length;
      console.log(`Updated ${updatedCount} / ${updates.length} students...`);
    }

    return {
      success: true,
      count: updatedCount,
      message: `Successfully updated ${updatedCount} students.`
    };

  } catch (error) {
    console.error("Recalculation error:", error);
    return { success: false, error };
  }
}

import { supabase } from "../supabaseClient";
import { fetchBmiRecords } from "../services/studentService";

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

    // 1. Fetch all BMI records to find the latest for each student
    const allBmiRecords = await fetchBmiRecords();

    // Map student_id -> latest BMI record
    const latestBmiMap = {};
    allBmiRecords.forEach((record) => {
      // Since we ordered by created_at desc, the first one we see is the latest
      if (!latestBmiMap[record.student_id]) {
        latestBmiMap[record.student_id] = record;
      }
    });

    // 2. Determine updates
    const updates = [];

    // Iterate over the latest records we found
    for (const studentId in latestBmiMap) {
      const record = latestBmiMap[studentId];

      // Check if status is Unknown/Null/-
      const currentStatus = record.nutrition_status;
      const needsUpdate = !currentStatus || currentStatus === "Unknown" || currentStatus === "-";

      if (needsUpdate && record.bmi != null) {
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
            id: record.id, // Update the BMI record itself
            nutrition_status: status
          });
        }
      }
    }

    console.log(`Identified ${updates.length} BMI records to update.`);

    if (updates.length === 0) {
      return { success: true, count: 0, message: "No BMI records needed updates." };
    }

    // 3. Perform updates (Batching requests)
    // We use .update() on bmi_records table
    const BATCH_SIZE = 20; // Concurrent requests
    let updatedCount = 0;

    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch = updates.slice(i, i + BATCH_SIZE);
      const promises = batch.map(u =>
        supabase
          .from("bmi_records")
          .update({ nutrition_status: u.nutrition_status })
          .eq("id", u.id)
      );

      await Promise.all(promises);
      updatedCount += batch.length;
      console.log(`Updated ${updatedCount} / ${updates.length} records...`);
    }

    return {
      success: true,
      count: updatedCount,
      message: `Successfully updated ${updatedCount} BMI records.`
    };

  } catch (error) {
    console.error("Recalculation error:", error);
    return { success: false, error };
  }
}

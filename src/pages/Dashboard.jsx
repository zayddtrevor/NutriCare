import { useEffect, useState } from "react";
import { GraduationCap, UserCheck, BarChart3 } from "lucide-react";
import { supabase } from "../supabaseClient";
import "./Dashboard.css";

export default function Dashboard() {
  const [studentCount, setStudentCount] = useState(0);
  const [teacherCount, setTeacherCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch total students count
        const { count: studentsCount, error: studentsError } =
          await supabase
            .from("students")
            .select("*", { count: "exact", head: true });

        if (studentsError) throw studentsError;
        console.log("Total students fetched:", studentsCount);
        setStudentCount(studentsCount);

        // Fetch total teachers count
        const { count: teachersCount, error: teachersError } =
          await supabase
            .from("teachers")
            .select("*", { count: "exact", head: true });

        if (teachersError) throw teachersError;
        setTeacherCount(teachersCount);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = [
    {
      id: 1,
      title: "Total Students",
      value: loading ? "..." : studentCount,
      color: "green",
      icon: <GraduationCap />,
    },
    {
      id: 2,
      title: "Total Teachers",
      value: loading ? "..." : teacherCount,
      color: "blue",
      icon: <UserCheck />,
    },
    {
      id: 3,
      title: "Active Reports",
      value: 8,
      color: "orange",
      icon: <BarChart3 />,
    },
  ];

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h2>Dashboard Overview</h2>
        <p className="subtitle">Monitor key metrics across the system.</p>
      </header>

      <section className="dashboard-cards">
        {stats.map((s) => (
          <article key={s.id} className={`dashboard-card ${s.color}`}>
            <div className="icon-area">{s.icon}</div>
            <div className="stat-info">
              <h4>{s.title}</h4>
              <div className="stat-value">{s.value}</div>
            </div>
          </article>
        ))}
      </section>

      <section className="welcome-section">
        <h3>Welcome, Admin!</h3>
        <p>
          This is your main dashboard. Live student and teacher counts are now
          powered by Supabase.
        </p>
      </section>
    </div>
  );
}

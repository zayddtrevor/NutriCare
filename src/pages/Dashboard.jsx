import { useEffect, useState } from "react";
import { GraduationCap, UserCheck, BarChart3, Activity } from "lucide-react";
import { supabase } from "../supabaseClient";
import StatCard from "../components/common/StatCard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "./Dashboard.css";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export default function Dashboard() {
  const [studentCount, setStudentCount] = useState(0);
  const [teacherCount, setTeacherCount] = useState(0);
  const [gradeData, setGradeData] = useState([]);
  const [nutritionData, setNutritionData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch students for count and charts
        const { data: students, error: studentsError } = await supabase
          .from("students")
          .select("grade_level, nutrition_status");

        if (studentsError) throw studentsError;

        setStudentCount(students.length);

        // Process Grade Data
        const gradeCounts = students.reduce((acc, curr) => {
          const grade = curr.grade_level || "Unknown";
          acc[grade] = (acc[grade] || 0) + 1;
          return acc;
        }, {});

        const processedGradeData = Object.keys(gradeCounts)
          .map((key) => ({
            name: `Grade ${key}`,
            count: gradeCounts[key],
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        setGradeData(processedGradeData);

        // Process Nutrition Data
        const nutritionCounts = students.reduce((acc, curr) => {
          const status = curr.nutrition_status || "Unknown";
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});

        const processedNutritionData = Object.keys(nutritionCounts).map(
          (key, index) => ({
            name: key,
            value: nutritionCounts[key],
          })
        );

        setNutritionData(processedNutritionData);

        // Fetch total teachers count
        const { count: teachersCount, error: teachersError } = await supabase
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
      icon: <GraduationCap size={24} />,
    },
    {
      id: 2,
      title: "Total Teachers",
      value: loading ? "..." : teacherCount,
      color: "blue",
      icon: <UserCheck size={24} />,
    },
    {
      id: 3,
      title: "Nutrition Reports",
      value: loading ? "..." : nutritionData.length > 0 ? nutritionData.reduce((a, b) => a + b.value, 0) : 0,
      color: "orange",
      icon: <Activity size={24} />,
    },
    {
      id: 4,
      title: "Active Reports", // Placeholder as per original
      value: 8,
      color: "purple",
      icon: <BarChart3 size={24} />,
    },
  ];

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h2>Dashboard Overview</h2>
          <p className="subtitle">Monitor key metrics across the system.</p>
        </div>
      </header>

      <section className="dashboard-stats-grid">
        {stats.map((s) => (
          <StatCard
            key={s.id}
            label={s.title}
            value={s.value}
            icon={s.icon}
            color={s.color}
          />
        ))}
      </section>

      <div className="dashboard-charts-grid">
        <div className="chart-container">
          <h3>Students per Grade</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={gradeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-container">
          <h3>Nutrition Status Distribution</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={nutritionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {nutritionData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

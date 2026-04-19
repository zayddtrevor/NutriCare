import { useEffect, useState } from "react";
import {
  GraduationCap,
  UserCheck,
  BarChart3,
  Users,
  Calendar,
  TrendingUp,
  Activity,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { supabase } from "../supabaseClient";
import { getPHDate } from "../constants/schoolData";
import CountUp from "react-countup";
import "./Dashboard.css";

// --- Components ---

const DashboardHeader = () => {
  const [greeting, setGreeting] = useState("Good Morning");
  const [subtext, setSubtext] = useState("Here’s your system summary for today.");
  const today = getPHDate();

  useEffect(() => {
    const hour = today.getHours();

    if (hour >= 5 && hour < 12) {
      setGreeting("Good Morning");
      setSubtext("Here’s your system summary for today.");
    } else if (hour >= 12 && hour < 17) {
      setGreeting("Good Afternoon");
      setSubtext("Here’s what’s happening so far.");
    } else {
      // 17:00 - 04:59 (includes late night/early morning until 5am)
      setGreeting("Good Evening");
      setSubtext("Here’s today’s activity overview.");
    }
  }, []);

  return (
    <div className="dashboard-header-card fade-in">
      <div className="header-left">
        <div className="greeting-wrapper">
          <h1>{greeting}, Admin!</h1>
          <div className="system-health-badge" title="All systems operational">
            <span className="health-dot"></span>
            <span className="health-text">System Healthy</span>
          </div>
        </div>
        <p>{subtext}</p>
      </div>
      <div className="header-right">
        <div className="date-badge">
          <Calendar size={16} />
          <span>{format(today, "MMMM d, yyyy")}</span>
        </div>
      </div>
    </div>
  );
};

const DashboardStatCard = ({ title, value, label, icon: Icon, color, loading }) => {
  return (
    <div className={`premium-stat-card ${color} fade-in`}>
      <div className="stat-card-content">
        <div className={`stat-icon-wrapper icon-${color}`}>
          <Icon size={24} strokeWidth={2} />
        </div>
        <div className="stat-text">
          <span className="stat-label">{title}</span>
          <h2 className="stat-value">
            {loading ? (
              <div
                style={{
                  width: '80px',
                  height: '32px',
                  background: 'rgba(255,255,255,0.25)',
                  borderRadius: '6px',
                  animation: 'pulse 1.5s infinite ease-in-out'
                }}
              />
            ) : (
              <CountUp end={value} duration={2} separator="," />
            )}
          </h2>
        </div>
      </div>
      <div className="stat-decoration">
        {/* Subtle decorative element if needed, or keep clean */}
      </div>
    </div>
  );
};

const AnalyticsSection = ({ presentCount }) => {
  // Mock Data for Chart
  const data = [
    { name: 'Mon', students: 120, meals: 110 },
    { name: 'Tue', students: 132, meals: 125 },
    { name: 'Wed', students: 101, meals: 98 },
    { name: 'Thu', students: 134, meals: 130 },
    { name: 'Fri', students: 150, meals: 145 },
    { name: 'Sat', students: 80,  meals: 75 },
    { name: 'Sun', students: 90,  meals: 85 },
  ];

  return (
    <div className="analytics-container fade-in-delayed">
      {/* Chart Card */}
      <div className="analytics-card chart-card">
        <div className="card-header">
          <h3>Weekly Overview</h3>
          <div className="legend">
            <div className="legend-item"><span className="dot students"></span> Students Logged</div>
            <div className="legend-item"><span className="dot meals"></span> Meals Served</div>
          </div>
        </div>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#349bf0" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#349bf0" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorMeals" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5cbd5f" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#5cbd5f" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="students"
                stroke="#349bf0"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorStudents)"
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="meals"
                stroke="#5cbd5f"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorMeals)"
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Stats Card */}
      <div className="analytics-card stats-list-card">
        <div className="card-header">
          <h3>Quick Stats</h3>
        </div>
        <div className="quick-stats-list">
          <div className="quick-stat-item hover-effect">
            <div className="qs-icon bg-green-light">
              <UserCheck size={20} className="text-green" />
            </div>
            <div className="qs-info">
              <span className="qs-label">Present Today</span>
              <span className="qs-value">{presentCount || 0}</span>
            </div>
          </div>
          <div className="quick-stat-item hover-effect">
            <div className="qs-icon bg-red-light">
              <Users size={20} className="text-red" />
            </div>
            <div className="qs-info">
              <span className="qs-label">Absent Today</span>
              <span className="qs-value">48</span>
            </div>
          </div>
          <div className="quick-stat-item hover-effect">
            <div className="qs-icon bg-purple-light">
              <TrendingUp size={20} className="text-purple" />
            </div>
            <div className="qs-info">
              <span className="qs-label">Most Active Grade</span>
              <span className="qs-value">Grade 3</span>
            </div>
          </div>
        </div>

        <div className="system-status-banner">
          <div className="status-icon-bg">
            <Activity size={16} />
          </div>
          <span>System is running smoothly.</span>
        </div>
      </div>
    </div>
  );
};

const NutritionSummary = () => {
  // Mock Data for Nutrition Summary
  const stats = [
    { label: "Normal", value: 65, color: "#10b981" },
    { label: "Wasted", value: 15, color: "#f59e0b" },
    { label: "Severely Wasted", value: 5, color: "#ef4444" },
    { label: "Overweight", value: 10, color: "#3b82f6" },
    { label: "Obese", value: 5, color: "#8b5cf6" },
  ];

  return (
    <div className="nutrition-summary-card fade-in-more-delayed">
      <div className="card-header">
        <h3>Nutrition Summary Snapshot</h3>
      </div>
      <div className="nutrition-bars">
        {stats.map((stat, idx) => (
          <div key={idx} className="nutrition-bar-item">
            <div className="nb-label">
              <span>{stat.label}</span>
              <span className="nb-value">{stat.value}%</span>
            </div>
            <div className="progress-bg">
              <div
                className="progress-fill"
                style={{ width: `${stat.value}%`, backgroundColor: stat.color }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AlertsSection = () => {
  const alerts = [
    { type: "critical", message: "5 students flagged as Severely Wasted" },
    { type: "warning", message: "Grade 3 has high absence rate today" },
    { type: "info", message: "BMI records missing for 12 students" },
  ];

  return (
    <div className="alerts-card fade-in-more-delayed">
      <div className="card-header">
        <h3>Alerts & Flags</h3>
      </div>
      <div className="alerts-list">
        {alerts.map((alert, idx) => (
          <div key={idx} className={`alert-item ${alert.type}`}>
            <div className="alert-icon">
              <AlertTriangle size={18} />
            </div>
            <div className="alert-content">
              <p className="alert-message">{alert.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [studentCount, setStudentCount] = useState(0);
  const [teacherCount, setTeacherCount] = useState(0);
  const [bmiCount, setBmiCount] = useState(0);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch total students count
        const { count: studentsCount, error: studentsError } =
          await supabase
            .from("students")
            .select("*", { count: "exact", head: true });

        if (!studentsError) setStudentCount(studentsCount || 0);
        console.log("Dashboard Student Count:", studentsCount);

        // Fetch total teachers count
        const { count: teachersCount, error: teachersError } =
          await supabase
            .from("teachers")
            .select("*", { count: "exact", head: true });

        if (!teachersError) setTeacherCount(teachersCount || 0);

        // Fetch BMI records count (for "Active Reports") - Unique students with BMI records
        const { data: bmiData, error: bmiError } =
            await supabase
            .from("bmi_records")
            .select("student_id")
            .range(0, 9999);

        if (!bmiError && bmiData) {
          const uniqueBmiCount = new Set(bmiData.map(r => r.student_id)).size;
          setBmiCount(uniqueBmiCount);
        }

        // Fetch attendance count for today
        const todayKey = format(getPHDate(), "yyyy-MM-dd");
        const { count: attCount, error: attError } =
            await supabase
            .from("attendance")
            .select("*", { count: "exact", head: true })
            .eq("attendance_date", todayKey);

        if (!attError) setAttendanceCount(attCount || 0);
        console.log("Dashboard Attendance Count:", attCount);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="dashboard-page-premium">
      <div className="dashboard-container">

        {/* 1. Header Section */}
        <DashboardHeader />

        {/* 2. Top Stat Cards */}
        <section className="dashboard-stats-grid">
          <DashboardStatCard
            title="Total Students"
            value={studentCount}
            loading={loading}
            icon={GraduationCap}
            color="green"
          />
          <DashboardStatCard
            title="Total Teachers"
            value={teacherCount}
            loading={loading}
            icon={UserCheck}
            color="blue"
          />
          <DashboardStatCard
            title="Active Reports"
            value={bmiCount}
            loading={loading}
            icon={BarChart3}
            color="orange"
          />
        </section>

        {/* 3. Analytics Section */}
        <AnalyticsSection presentCount={attendanceCount} />

        {/* 4. Health & Alerts (Replaces Quick Action Panel) */}
        <section className="dashboard-bottom-grid">
          <NutritionSummary />
          <AlertsSection />
        </section>

      </div>
    </div>
  );
}

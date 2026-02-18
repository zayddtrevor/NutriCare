import { useEffect, useState } from "react";
import {
  GraduationCap,
  UserCheck,
  BarChart3,
  Users,
  Calendar,
  TrendingUp,
  UserPlus,
  FileText,
  Settings,
  ArrowRight,
  ChevronRight,
  Activity
} from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { supabase } from "../supabaseClient";
import "./Dashboard.css";

// --- Components ---

const DashboardHeader = () => {
  const [greeting, setGreeting] = useState("Good Morning");
  const today = new Date();

  useEffect(() => {
    const hour = today.getHours();

    // Time Divisions:
    // Early Morning: 5 a.m. – 8 a.m.
    // Morning: 8 a.m. – 12 p.m. (Sunrise/Late Morning combined)
    // Noon/Midday: 12 p.m.
    // Early Afternoon: 12 p.m. – 3 p.m.
    // Afternoon: 12 p.m. – 5 p.m. (Simplified overlap)
    // Late Afternoon: 4 p.m. – 6 p.m.
    // Evening: 5 p.m. – 9 p.m. or 10 p.m.
    // Night/Late Night: 9 p.m. – 4 a.m.
    // Midnight: 12 a.m.

    // Simplified logic based on common greetings:
    if (hour >= 5 && hour < 12) {
      setGreeting("Good Morning");
    } else if (hour >= 12 && hour < 17) {
      setGreeting("Good Afternoon");
    } else if (hour >= 17 && hour < 21) {
      setGreeting("Good Evening");
    } else {
      setGreeting("Good Night"); // Late Night / Early Morning
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
        <p>Here’s your system summary today</p>
      </div>
      <div className="header-right">
        <div className="date-badge">
          <Calendar size={16} />
          <span>{format(today, "MMMM d, yyyy")}</span>
        </div>
        {/* 'View Reports' button removed as per feedback */}
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
          <h2 className="stat-value">{loading ? "..." : value}</h2>
        </div>
      </div>
      <div className="stat-decoration">
        {/* Subtle decorative element if needed, or keep clean */}
      </div>
    </div>
  );
};

const AnalyticsSection = () => {
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
              <span className="qs-value">1,642</span>
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

const QuickActionPanel = () => {
  const actions = [
    {
      title: "Manage Students",
      subtitle: "View & edit student records",
      icon: Users,
      color: "blue",
      link: "/management?tab=students"
    },
    {
      title: "Manage Teachers",
      subtitle: "Add or remove staff",
      icon: UserPlus,
      color: "green",
      link: "/management?tab=teachers"
    },
    {
      title: "View Reports",
      subtitle: "Check daily analytics",
      icon: FileText,
      color: "orange",
      link: "/reports"
    }
  ];

  return (
    <div className="quick-actions-grid fade-in-more-delayed">
      {actions.map((action, idx) => (
        <Link to={action.link} key={idx} className="quick-action-card hover-lift">
          <div className={`qa-icon icon-${action.color}`}>
            <action.icon size={24} strokeWidth={2} />
          </div>
          <div className="qa-text">
            <span className="qa-title">{action.title}</span>
            <span className="qa-subtitle">{action.subtitle}</span>
          </div>
          <ChevronRight size={20} className="qa-arrow" />
        </Link>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [studentCount, setStudentCount] = useState(0);
  const [teacherCount, setTeacherCount] = useState(0);
  const [bmiCount, setBmiCount] = useState(0);
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

        // Fetch total teachers count
        const { count: teachersCount, error: teachersError } =
          await supabase
            .from("teachers")
            .select("*", { count: "exact", head: true });

        if (!teachersError) setTeacherCount(teachersCount || 0);

        // Fetch BMI records count (for "Active Reports")
        const { count: bmiTotal, error: bmiError } =
            await supabase
            .from("bmi_records")
            .select("*", { count: "exact", head: true });

        if (!bmiError) setBmiCount(bmiTotal || 0);

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
        <AnalyticsSection />

        {/* 4. Quick Action Panel */}
        <QuickActionPanel />

      </div>
    </div>
  );
}

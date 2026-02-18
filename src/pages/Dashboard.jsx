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
  ChevronRight
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
  const today = new Date();

  return (
    <div className="dashboard-header-card">
      <div className="header-left">
        <h1>Good Morning, Admin</h1>
        <p>Here’s your system summary today</p>
      </div>
      <div className="header-right">
        <div className="date-badge">
          <Calendar size={16} />
          <span>{format(today, "MMMM d, yyyy")}</span>
        </div>
        <Link to="/reports" className="btn-header-action">
          View Reports
        </Link>
      </div>
    </div>
  );
};

const DashboardStatCard = ({ title, value, label, icon: Icon, color, loading }) => {
  return (
    <div className={`premium-stat-card ${color}`}>
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
    <div className="analytics-container">
      {/* Chart Card */}
      <div className="analytics-card chart-card">
        <div className="card-header">
          <h3>Weekly Overview</h3>
          <div className="legend">
            <span className="dot students"></span> Students
            <span className="dot meals"></span> Meals
          </div>
        </div>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#349bf0" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#349bf0" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorMeals" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5cbd5f" stopOpacity={0.2}/>
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
              />
              <Area
                type="monotone"
                dataKey="students"
                stroke="#349bf0"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorStudents)"
              />
              <Area
                type="monotone"
                dataKey="meals"
                stroke="#5cbd5f"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorMeals)"
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
          <div className="quick-stat-item">
            <div className="qs-icon bg-green-light">
              <UserCheck size={20} className="text-green" />
            </div>
            <div className="qs-info">
              <span className="qs-label">Present Today</span>
              <span className="qs-value">1,642</span>
            </div>
          </div>
          <div className="quick-stat-item">
            <div className="qs-icon bg-red-light">
              <Users size={20} className="text-red" />
            </div>
            <div className="qs-info">
              <span className="qs-label">Absent Today</span>
              <span className="qs-value">48</span>
            </div>
          </div>
          <div className="quick-stat-item">
            <div className="qs-icon bg-purple-light">
              <TrendingUp size={20} className="text-purple" />
            </div>
            <div className="qs-info">
              <span className="qs-label">Most Active Grade</span>
              <span className="qs-value">Grade 3</span>
            </div>
          </div>
        </div>

        <div className="mini-banner">
          <p>System is running smoothly.</p>
        </div>
      </div>
    </div>
  );
};

const QuickActionPanel = () => {
  const actions = [
    {
      title: "Go to Student Management",
      icon: Users,
      color: "blue",
      link: "/management?tab=students"
    },
    {
      title: "Go to Teacher Management",
      icon: UserPlus,
      color: "green",
      link: "/management?tab=teachers"
    },
    {
      title: "Open Reports",
      icon: FileText,
      color: "orange",
      link: "/reports"
    }
  ];

  return (
    <div className="quick-actions-grid">
      {actions.map((action, idx) => (
        <Link to={action.link} key={idx} className="quick-action-card">
          <div className={`qa-icon icon-${action.color}`}>
            <action.icon size={24} strokeWidth={2} />
          </div>
          <span className="qa-title">{action.title}</span>
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

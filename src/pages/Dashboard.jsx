import { useEffect, useState, useCallback } from "react";
import {
  GraduationCap,
  UserCheck,
  BarChart3,
  Users,
  Calendar,
  TrendingUp,
  Activity,
  AlertTriangle,
  Info
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
import CountUp from "react-countup";
import { normalizeNutritionStatus, STATUS_COLORS } from "../utils/nutritionUtils";
import "./Dashboard.css";

// --- Components ---

const DashboardHeader = () => {
  const [greeting, setGreeting] = useState("Good Morning");
  const [subtext, setSubtext] = useState("Here’s your system summary for today.");
  const today = new Date();

  useEffect(() => {
    const hour = today.getHours();

    if (hour >= 5 && hour < 12) {
      setGreeting("Good Morning");
      setSubtext("Here’s your system summary for today.");
    } else if (hour >= 12 && hour < 17) {
      setGreeting("Good Afternoon");
      setSubtext("Here’s what’s happening so far.");
    } else {
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
    </div>
  );
};

const AnalyticsSection = ({ presentCount, absentCount }) => {
  // Mock Data for Chart (kept as mock for now as per scope, but could be dynamic)
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
              <span className="qs-value">{absentCount || 0}</span>
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

const NutritionSummary = ({ stats, loading }) => {
  // Define order and color mapping using STATUS_COLORS
  const displayOrder = ["Normal", "Wasted", "Severely Wasted", "Overweight", "Obese", "Unknown"];

  // Calculate total for percentages
  const total = Object.values(stats).reduce((a, b) => a + b, 0) || 1;

  const getPercentage = (val) => Math.round((val / total) * 100);

  return (
    <div className="nutrition-summary-card fade-in-more-delayed">
      <div className="card-header">
        <h3>Nutrition Summary Snapshot</h3>
      </div>
      <div className="nutrition-bars">
        {loading ? (
           <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>Loading nutrition data...</div>
        ) : (
          displayOrder.map((status) => {
             const count = stats[status] || 0;
             const percent = getPercentage(count);
             // Get color from utils. If not found, default to gray.
             // STATUS_COLORS returns semantic name (green, red, etc.), but we need hex for style or class.
             // Dashboard.css uses classes or inline styles?
             // The previous implementation used inline styles with hex codes.
             // I'll define a hex map here or use CSS classes.
             // CSS classes are cleaner: .progress-fill.green
             const colorName = STATUS_COLORS[status] || "gray";

             // Map semantic names to Hex for inline style (matching previous implementation style)
             const hexMap = {
                 green: "#10b981",
                 yellow: "#f59e0b",
                 red: "#ef4444",
                 blue: "#3b82f6",
                 purple: "#8b5cf6",
                 gray: "#6b7280"
             };

             return (
              <div key={status} className="nutrition-bar-item">
                <div className="nb-label">
                  <span>{status}</span>
                  <span className="nb-value">{percent}%</span>
                </div>
                <div className="progress-bg">
                  <div
                    className="progress-fill"
                    style={{ width: `${percent}%`, backgroundColor: hexMap[colorName] }}
                  ></div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const HealthRiskAlerts = ({ alerts, lastUpdated }) => {
  return (
    <div className="alerts-card fade-in-more-delayed">
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3>Health & Risk Alerts</h3>
          <span className="live-indicator" title="Live Updates">
            <span className="live-dot"></span>
            LIVE
          </span>
        </div>
        <span className="last-updated">Updated {lastUpdated}</span>
      </div>
      <div className="alerts-list">
        {alerts.length === 0 ? (
           <div className="alert-item info">
             <div className="alert-icon"><Info size={18} /></div>
             <div className="alert-content">
               <p className="alert-message">No critical alerts at the moment.</p>
             </div>
           </div>
        ) : (
          alerts.map((alert, idx) => (
            <div key={idx} className={`alert-item ${alert.type} slide-in`}>
              <div className="alert-icon">
                {alert.type === 'critical' ? <AlertTriangle size={18} /> :
                 alert.type === 'warning' ? <AlertTriangle size={18} /> :
                 <Info size={18} />}
              </div>
              <div className="alert-content">
                <p className="alert-message">{alert.message}</p>
                <span className="alert-time">{alert.time}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [studentCount, setStudentCount] = useState(0);
  const [teacherCount, setTeacherCount] = useState(0);
  const [bmiCount, setBmiCount] = useState(0);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [absentCount, setAbsentCount] = useState(0);

  const [nutritionStats, setNutritionStats] = useState({ Normal: 0, Wasted: 0, "Severely Wasted": 0, Overweight: 0, Obese: 0, Unknown: 0 });
  const [alerts, setAlerts] = useState([]);
  const [lastUpdated, setLastUpdated] = useState("just now");

  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
      try {
        const now = new Date();
        setLastUpdated(format(now, "h:mm:ss a"));

        // 1. Fetch Basic Counts (Students, Teachers, BMI, Attendance)
        const [
            studentsHead,
            teachersHead,
            bmiHead,
            attendanceHead
        ] = await Promise.all([
            supabase.from("students").select("*", { count: "exact", head: true }),
            supabase.from("teachers").select("*", { count: "exact", head: true }),
            supabase.from("bmi_records").select("*", { count: "exact", head: true }),
            supabase.from("attendance").select("*", { count: "exact", head: true }).eq("attendance_date", format(now, "yyyy-MM-dd"))
        ]);

        const totalStudents = studentsHead.count || 0;
        setStudentCount(totalStudents);
        setTeacherCount(teachersHead.count || 0);
        setBmiCount(bmiHead.count || 0);

        const present = attendanceHead.count || 0;
        setAttendanceCount(present);
        setAbsentCount(totalStudents - present); // Simple calc

        // 2. Fetch Detailed Data for Nutrition Summary & Alerts
        // We need all students and their latest BMI to compute accurate summary
        const { data: studentsData, error: stError } = await supabase
            .from("students")
            .select("id, nutrition_status")
            .range(0, 9999);

        const { data: bmiData, error: bmiError } = await supabase
            .from("bmi_records")
            .select("student_id, nutrition_status, created_at")
            .order("created_at", { ascending: false })
            .range(0, 9999);

        if (stError) throw stError;

        // Map latest BMI
        const bmiMap = {};
        if (bmiData) {
            bmiData.forEach(r => {
                if (!bmiMap[r.student_id]) bmiMap[r.student_id] = r;
            });
        }

        // Calculate Stats & Alerts
        const stats = { Normal: 0, Wasted: 0, "Severely Wasted": 0, Overweight: 0, Obese: 0, Unknown: 0 };
        let severeCount = 0;
        let missingBmiCount = 0;

        if (studentsData) {
            studentsData.forEach(s => {
                const bmiRec = bmiMap[s.id];
                const rawStatus = bmiRec?.nutrition_status || s.nutrition_status;
                const status = normalizeNutritionStatus(rawStatus);

                if (stats[status] !== undefined) stats[status]++;

                if (status === "Severely Wasted") severeCount++;

                if (!bmiRec) missingBmiCount++;
            });
        }

        setNutritionStats(stats);

        // Generate Alerts
        const newAlerts = [];

        if (severeCount > 0) {
            newAlerts.push({
                type: "critical",
                message: `${severeCount} students flagged as Severely Wasted`,
                time: "Live"
            });
        }

        if (missingBmiCount > 0) {
            newAlerts.push({
                type: "info",
                message: `BMI records missing for ${missingBmiCount} students`,
                time: "Live"
            });
        }

        if ((totalStudents - present) > 0) {
             newAlerts.push({
                type: "warning",
                message: `${totalStudents - present} students absent today`,
                time: "Today"
            });
        }

        setAlerts(newAlerts);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
        fetchDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

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
        <AnalyticsSection presentCount={attendanceCount} absentCount={absentCount} />

        {/* 4. Health & Alerts (Replaces Quick Action Panel) */}
        <section className="dashboard-bottom-grid">
          <NutritionSummary stats={nutritionStats} loading={loading} />
          <HealthRiskAlerts alerts={alerts} lastUpdated={lastUpdated} />
        </section>

      </div>
    </div>
  );
}

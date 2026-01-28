import { useState, useEffect } from "react";
import {
  ArrowRight,
  Users,
  Target,
  BarChart3,
  Shield,
  Lock,
  Activity,
  Zap,
  TrendingUp, 
  FileText,
} from "lucide-react";

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const [activeMetric, setActiveMetric] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHeroVisible, setIsHeroVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("mousemove", handleMouseMove);

    setTimeout(() => setIsHeroVisible(true), 100);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveMetric((prev) => (prev + 1) % 4);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const [particles] = useState(() =>
    Array.from({ length: 20 }, () => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 5}s`,
      animationDuration: `${5 + Math.random() * 10}s`,
    })),
  );
  const features = [
    {
      icon: <Users className="w-5 h-5" />,
      title: "Role-Based Access Control",
      description: "Granular permissions with organization-scoped security",
      stat: "99.9%",
      statLabel: "Security Score",
    },
    {
      icon: <Target className="w-5 h-5" />,
      title: "Sprint & Task Management",
      description:
        "Agile workflows with dependency tracking and burndown analytics",
      stat: "40%",
      statLabel: "Faster Delivery",
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: "Real-Time Reporting",
      description: "Executive dashboards and automated status notifications",
      stat: "<100ms",
      statLabel: "Response Time",
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Audit & Compliance",
      description: "Comprehensive logging with SOX and GDPR compliance",
      stat: "100%",
      statLabel: "Audit Coverage",
    },
    {
      icon: <Lock className="w-5 h-5" />,
      title: "Enterprise Security",
      description:
        "2FA authentication with encrypted data at rest and in transit",
      stat: "AES-256",
      statLabel: "Encryption",
    },
    {
      icon: <Activity className="w-5 h-5" />,
      title: "Resource Allocation",
      description:
        "Capacity planning with skill matrix and utilization tracking",
      stat: "85%",
      statLabel: "Utilization Rate",
    },
  ];

  const metrics = [
    {
      value: "15K+",
      label: "Active Projects",
      subtext: "Under management",
      icon: <FileText className="w-4 h-4" />,
    },
    {
      value: "99.9%",
      label: "Uptime SLA",
      subtext: "Guaranteed availability",
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      value: "65K+",
      label: "Team Members",
      subtext: "Across organizations",
      icon: <Users className="w-4 h-4" />,
    },
    {
      value: "<100ms",
      label: "API Response",
      subtext: "Average latency",
      icon: <Zap className="w-4 h-4" />,
    },
  ];

  // const liveActivities = [
  //   {
  //     task: "PROJ-101: JWT Authentication",
  //     status: "In Progress",
  //     progress: 65,
  //     user: "R. Kumar",
  //     time: "2m ago",
  //   },
  //   {
  //     task: "PROJ-089: QA Test Cases",
  //     status: "Under Review",
  //     progress: 90,
  //     user: "A. Patel",
  //     time: "5m ago",
  //   },
  //   {
  //     task: "PROJ-045: Payment Gateway",
  //     status: "Blocked",
  //     progress: 40,
  //     user: "S. Khan",
  //     time: "12m ago",
  //   },
  // ];

  return (
    <>
      <style>{`
  @keyframes float {
    0%, 100% {
      transform: translate(0, 0) rotate(0deg);
    }
    33% {
      transform: translate(30px, -30px) rotate(120deg);
    }
    66% {
      transform: translate(-20px, 20px) rotate(240deg);
    }
  }

  @keyframes gradient {
    0%, 100% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
  }

  @keyframes progress {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(0);
    }
  }

  @keyframes slide-in {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes scan {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  @keyframes particle {
    0% {
      transform: translateY(0) translateX(0);
      opacity: 0;
    }
    10% {
      opacity: 1;
    }
    90% {
      opacity: 1;
    }
    100% {
      transform: translateY(-100vh) translateX(50px);
      opacity: 0;
    }
  }

  @keyframes pulse-slow {
    0%, 100% {
      opacity: 0.2;
    }
    50% {
      opacity: 0.4;
    }
  }

  .animate-float {
    animation: float 20s ease-in-out infinite;
  }

  .animate-gradient {
    background-size: 200% 200%;
    animation: gradient 3s ease infinite;
  }

  .animate-progress {
    animation: progress 1.5s ease-out;
  }

  .animate-slide-in {
    animation: slide-in 0.5s ease-out forwards;
    opacity: 0;
  }

  .animate-fade-in-up {
    animation: fade-in-up 0.6s ease-out forwards;
    opacity: 0;
  }

  .animate-scan {
    animation: scan 3s ease-in-out infinite;
  }

  .animate-particle {
    animation: particle linear infinite;
  }

  .animate-pulse-slow {
    animation: pulse-slow 3s ease-in-out infinite;
  }

  .bg-size-200 {
    background-size: 200% auto;
  }

  /* Smooth transitions for reduced motion preference */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`}</style>
      ;
      <div className="min-h-screen bg-neutral-100 overflow-hidden">
        {/* Animated Background Grid */}
        <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
          <div
            className="absolute inset-0 transition-transform duration-1000 ease-out"
            style={{
              backgroundImage: `
              linear-gradient(to right, #171717 1px, transparent 1px),
              linear-gradient(to bottom, #171717 1px, transparent 1px)
            `,
              backgroundSize: "60px 60px",
              transform: `translate(${mousePosition.x * 0.02}px, ${
                mousePosition.y * 0.02
              }px)`,
            }}
          />
        </div>

        {/* Floating Orbs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute top-20 left-20 w-96 h-96 bg-neutral-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"
            style={{ animationDelay: "0s" }}
          />
          <div
            className="absolute top-40 right-20 w-96 h-96 bg-neutral-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"
            style={{ animationDelay: "2s" }}
          />
          <div
            className="absolute bottom-20 left-1/3 w-96 h-96 bg-neutral-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"
            style={{ animationDelay: "4s" }}
          />
        </div>

        {/* Navigation */}
        <nav
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
            scrollY > 20
              ? "bg-white/80 backdrop-blur-xl border-b border-neutral-300 shadow-lg"
              : "bg-transparent"
          }`}
        >
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="w-9 h-9 bg-neutral-900 rounded-md flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span className="text-white font-bold text-base">PMS</span>
              </div>
              <div className="transition-transform duration-300 group-hover:translate-x-1">
                <div className="text-sm font-semibold text-neutral-900">
                  Project Management System
                </div>
                <div className="text-xs text-neutral-600">
                  Enterprise Platform
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="/login"
                className="px-5 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-all duration-300 hover:scale-105"
              >
                Sign in
              </a>
              <a
                href="/register"
                className="group px-5 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-all duration-300 flex items-center gap-2 hover:shadow-xl hover:shadow-neutral-900/20 hover:scale-105"
              >
                Request access
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </a>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div
              className={`max-w-4xl transition-all duration-1000 ${
                isHeroVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              {/* Animated Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-300 rounded-md text-xs font-medium text-neutral-700 mb-8 hover:border-neutral-900 transition-all duration-300 hover:shadow-lg cursor-default group">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <Lock className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform duration-300" />
                <span>Secure • Monitored • Compliant</span>
              </div>

              {/* Main Heading with Stagger Animation */}
              <h1 className="text-5xl md:text-6xl font-semibold text-neutral-900 leading-tight mb-6">
                <span
                  className={`inline-block transition-all duration-700 delay-100 ${
                    isHeroVisible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-10"
                  }`}
                >
                  Centralized platform for
                </span>
                <br />
                <span
                  className={`inline-block transition-all duration-700 delay-200 bg-clip-text text-transparent bg-linear-to-r from-neutral-900 via-neutral-700 to-neutral-900 bg-size-200 animate-gradient ${
                    isHeroVisible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-10"
                  }`}
                >
                  operational excellence
                </span>
              </h1>

              {/* Description */}
              <p
                className={`text-lg text-neutral-600 leading-relaxed mb-8 max-w-2xl transition-all duration-700 delay-300 ${
                  isHeroVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-10"
                }`}
              >
                Enterprise-grade project management with comprehensive task
                execution, resource allocation, and real-time visibility across
                organizational boundaries.
              </p>

              {/* CTA Buttons */}
              <div
                className={`flex flex-col sm:flex-row items-start gap-4 mb-12 transition-all duration-700 delay-400 ${
                  isHeroVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-10"
                }`}
              >
                <a
                  href="/register"
                  className="group px-6 py-3 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-all duration-300 flex items-center gap-2 hover:shadow-2xl hover:shadow-neutral-900/30 hover:scale-105"
                >
                  Request account
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300" />
                </a>
                <a
                  href="/login"
                  className="px-6 py-3 bg-white text-neutral-900 border border-neutral-300 rounded-lg text-sm font-medium hover:border-neutral-900 transition-all duration-300 hover:shadow-lg hover:scale-105"
                >
                  Secure sign-in
                </a>
              </div>

              {/* Compliance Notice with Icons */}
              <div
                className={`space-y-2 transition-all duration-700 delay-500 ${
                  isHeroVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-10"
                }`}
              >
                {[
                  {
                    icon: <Shield className="w-3.5 h-3.5" />,
                    text: "All access and activity is monitored under organizational policy",
                  },
                  {
                    icon: <Lock className="w-3.5 h-3.5" />,
                    text: "Role-based permissions enforced across all workspaces",
                  },
                  {
                    icon: <Activity className="w-3.5 h-3.5" />,
                    text: "Audit logging enabled for compliance and security review",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-700 transition-colors duration-300 cursor-default"
                  >
                    <span className="text-neutral-400">{item.icon}</span>
                    <span>• {item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced Dashboard Preview */}
            <div
              className={`mt-20 relative transition-all duration-1000 delay-600 ${
                isHeroVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              {/* Glow Effect */}
              <div className="absolute -inset-4 bg-linear-to-r from-neutral-200 via-neutral-300 to-neutral-200 rounded-2xl blur-2xl opacity-20 animate-pulse-slow" />

              {/* <div className="relative bg-white border border-neutral-300 rounded-lg p-6 shadow-2xl hover:shadow-3xl transition-shadow duration-500">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-200">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-neutral-900">
                      Live Dashboard
                    </span>
                    <span className="text-xs text-neutral-500">
                      Real-time updates
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-neutral-400" />
                    <span className="text-xs text-neutral-500">
                      Last updated: Just now
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> 
                  <div className="space-y-4">
                    <div className="group bg-linear-to-r from-neutral-50 to-white border border-neutral-200 rounded-md p-4 hover:border-neutral-900 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium text-neutral-600">
                          Active Projects
                        </div>
                        <TrendingUp className="w-3.5 h-3.5 text-green-600 group-hover:scale-125 transition-transform duration-300" />
                      </div>
                      <div className="text-2xl font-semibold text-neutral-900 group-hover:scale-110 transition-transform duration-300">
                        24
                      </div>
                      <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <span className="inline-block w-1 h-1 bg-green-600 rounded-full animate-pulse" />
                        +3 this month
                      </div>
                    </div>

                    <div className="group bg-linear-to-br from-neutral-50 to-white border border-neutral-200 rounded-md p-4 hover:border-neutral-900 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium text-neutral-600">
                          Team Utilization
                        </div>
                        <Activity className="w-3.5 h-3.5 text-blue-600 group-hover:scale-125 transition-transform duration-300" />
                      </div>
                      <div className="text-2xl font-semibold text-neutral-900 group-hover:scale-110 transition-transform duration-300">
                        87%
                      </div>
                      <div className="mt-2 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-blue-500 to-blue-600 rounded-full animate-progress"
                          style={{ width: "87%" }}
                        />
                      </div>
                    </div>
                  </div>
 
                  <div className="md:col-span-2 space-y-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium text-neutral-900 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-neutral-600" />
                        Recent Activity
                      </div>
                      <div className="text-xs text-neutral-500 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        Live
                      </div>
                    </div>

                    {liveActivities.map((item, i) => (
                      <div
                        key={i}
                        className="group bg-linear-to-r from-neutral-50 to-white border border-neutral-200 rounded-md p-3 hover:border-neutral-900 transition-all duration-300 hover:shadow-md animate-slide-in"
                        style={{ animationDelay: `${i * 150}ms` }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1">
                            <div className="text-xs font-medium text-neutral-900 group-hover:text-neutral-700 transition-colors">
                              {item.task}
                            </div>
                          </div>
                          <div
                            className={`text-xs px-2 py-0.5 rounded transition-all duration-300 group-hover:scale-105 ${
                              item.status === "In Progress"
                                ? "bg-blue-100 text-blue-700"
                                : item.status === "Approved"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            {item.status}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {item.user}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.time}
                          </span>
                        </div>

                        <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-linear-to-r from-neutral-800 to-neutral-900 rounded-full transition-all duration-700 group-hover:from-neutral-700 group-hover:to-neutral-800"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div> */}
            </div>
          </div>
        </section>

        {/* Animated Metrics Bar */}
        <section className="py-12 px-6 bg-white border-y border-neutral-300 relative overflow-hidden">
          {/* Scanning Line Effect */}
          <div className="absolute top-0 left-0 h-0.5 bg-linear-to-r from-transparent via-neutral-900 to-transparent w-full animate-scan" />

          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {metrics.map((metric, index) => (
                <div
                  key={index}
                  className={`group text-center transition-all duration-500 cursor-pointer ${
                    activeMetric === index
                      ? "scale-110"
                      : "opacity-70 scale-100"
                  }`}
                  onMouseEnter={() => setActiveMetric(index)}
                >
                  <div className="flex items-center justify-center mb-2 group-hover:scale-125 transition-transform duration-300">
                    <div
                      className={`p-2 rounded-lg ${
                        activeMetric === index
                          ? "bg-neutral-900 text-white"
                          : "bg-neutral-100 text-neutral-600"
                      } transition-all duration-300`}
                    >
                      {metric.icon}
                    </div>
                  </div>
                  <div
                    className={`text-3xl font-semibold mb-1 transition-all duration-300 ${
                      activeMetric === index
                        ? "text-neutral-900"
                        : "text-neutral-700"
                    }`}
                  >
                    {metric.value}
                  </div>
                  <div className="text-sm font-medium text-neutral-700 group-hover:text-neutral-900 transition-colors">
                    {metric.label}
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">
                    {metric.subtext}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid with Stagger Animation */}
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-semibold text-neutral-900 mb-3">
                Production-level capabilities
              </h2>
              <p className="text-neutral-600 max-w-2xl mx-auto">
                Built for enterprise teams requiring secure, auditable, and
                scalable project operations
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group relative bg-white border border-neutral-300 rounded-lg p-6 hover:border-neutral-900 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 cursor-pointer animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Hover Gradient Background */}
                  <div className="absolute inset-0 bg-linear-to-r from-neutral-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />

                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-neutral-100 rounded-md flex items-center justify-center text-neutral-900 group-hover:bg-neutral-900 group-hover:text-white transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
                        {feature.icon}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-neutral-900 group-hover:scale-110 transition-transform duration-300">
                          {feature.stat}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {feature.statLabel}
                        </div>
                      </div>
                    </div>

                    <h3 className="text-base font-semibold text-neutral-900 mb-2 group-hover:text-neutral-700 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-neutral-600 leading-relaxed">
                      {feature.description}
                    </p>

                    {/* Progress indicator */}
                    <div className="mt-4 h-1 bg-neutral-200 rounded-full overflow-hidden">
                      <div className="h-full bg-neutral-900 rounded-full w-0 group-hover:w-full transition-all duration-1000" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section with Particles */}
        <section className="relative py-20 px-6 bg-neutral-900 overflow-hidden">
          {/* Animated Particles */}
          {/* Animated Particles */}
          <div className="absolute inset-0 overflow-hidden">
            {particles.map((style, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full animate-particle"
                style={style}
              />
            ))}
          </div>

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-3xl font-semibold text-white mb-4">
              Ready to streamline your operations?
            </h2>
            <p className="text-neutral-400 mb-8 max-w-2xl mx-auto">
              Request access to create your organizational workspace. All access
              requests are reviewed and approved by system administrators.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/register"
                className="group px-8 py-3 bg-white text-neutral-900 rounded-lg text-sm font-medium hover:bg-neutral-100 transition-all duration-300 flex items-center gap-2 hover:shadow-2xl hover:shadow-white/20 hover:scale-105"
              >
                Request account
                <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300" />
              </a>
              <a
                href="/login"
                className="px-8 py-3 bg-neutral-800 text-white border border-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-700 transition-all duration-300 hover:scale-105"
              >
                Sign in to workspace
              </a>
            </div>
            <p className="text-xs text-neutral-500 mt-8 flex items-center justify-center gap-2">
              <Lock className="w-3 h-3" />
              Access is monitored and recorded. Unauthorized use is prohibited.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-6 bg-neutral-900 border-t border-neutral-800">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-neutral-500">
              <div className="flex items-center gap-3 group cursor-pointer">
                <div className="w-7 h-7 bg-white rounded flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-neutral-900 font-bold text-xs">
                    PMS
                  </span>
                </div>
                <span className="group-hover:text-neutral-300 transition-colors">
                  Project Management System
                </span>
              </div>

              <div>© 2026 Enterprise Platform. All rights reserved.</div>

              <div className="flex items-center gap-6 text-xs">
                <a
                  href="#"
                  className="hover:text-white transition-all duration-300 hover:scale-105"
                >
                  Privacy Policy
                </a>
                <a
                  href="#"
                  className="hover:text-white transition-all duration-300 hover:scale-105"
                >
                  Terms of Service
                </a>
                <a
                  href="#"
                  className="hover:text-white transition-all duration-300 hover:scale-105"
                >
                  System Status
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

// import { useState, useEffect } from 'react';
// import { ArrowRight, CheckCircle, Users, Target, BarChart3, Shield, Lock, Activity } from 'lucide-react';

// export default function LandingPage() {
//   const [scrollY, setScrollY] = useState(0);
//   const [activeMetric, setActiveMetric] = useState(0);

//   useEffect(() => {
//     const handleScroll = () => setScrollY(window.scrollY);
//     window.addEventListener('scroll', handleScroll);
//     return () => window.removeEventListener('scroll', handleScroll);
//   }, []);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setActiveMetric((prev) => (prev + 1) % 4);
//     }, 2500);
//     return () => clearInterval(interval);
//   }, []);

//   const features = [
//     {
//       icon: <Users className="w-5 h-5" />,
//       title: "Role-Based Access Control",
//       description: "Granular permissions with organization-scoped security"
//     },
//     {
//       icon: <Target className="w-5 h-5" />,
//       title: "Sprint & Task Management",
//       description: "Agile workflows with dependency tracking and burndown analytics"
//     },
//     {
//       icon: <BarChart3 className="w-5 h-5" />,
//       title: "Real-Time Reporting",
//       description: "Executive dashboards and automated status notifications"
//     },
//     {
//       icon: <Shield className="w-5 h-5" />,
//       title: "Audit & Compliance",
//       description: "Comprehensive logging with SOX and GDPR compliance"
//     },
//     {
//       icon: <Lock className="w-5 h-5" />,
//       title: "Enterprise Security",
//       description: "2FA authentication with encrypted data at rest and in transit"
//     },
//     {
//       icon: <Activity className="w-5 h-5" />,
//       title: "Resource Allocation",
//       description: "Capacity planning with skill matrix and utilization tracking"
//     }
//   ];

//   const metrics = [
//     { value: "15K+", label: "Active Projects", subtext: "Under management" },
//     { value: "99.9%", label: "Uptime SLA", subtext: "Guaranteed availability" },
//     { value: "65K+", label: "Team Members", subtext: "Across organizations" },
//     { value: "<100ms", label: "API Response", subtext: "Average latency" }
//   ];

//   const capabilities = [
//     { text: "Cross-functional team collaboration" },
//     { text: "Automated workflow orchestration" },
//     { text: "Multi-project portfolio management" },
//     { text: "Integration with GitHub, Azure DevOps, Slack" },
//     { text: "Custom notification routing and templates" },
//     { text: "Detailed audit trails for compliance" }
//   ];

//   return (
//     <div className="min-h-screen bg-neutral-100">
//       {/* Navigation */}
//       <nav
//         className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
//           scrollY > 20
//             ? 'bg-white/95 backdrop-blur-sm border-b border-neutral-300 shadow-sm'
//             : 'bg-transparent'
//         }`}
//       >
//         <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
//           <div className="flex items-center gap-3">
//             <div className="w-9 h-9 bg-neutral-900 rounded-md flex items-center justify-center">
//               <span className="text-white font-bold text-base">PMS</span>
//             </div>
//             <div>
//               <div className="text-sm font-semibold text-neutral-900">Project Management System</div>
//               <div className="text-xs text-neutral-600">Enterprise Platform</div>
//             </div>
//           </div>

//           <div className="flex items-center gap-3">
//             <a
//               href="/login"
//               className="px-5 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
//             >
//               Sign in
//             </a>
//             <a
//               href="/register"
//               className="px-5 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-all duration-200 flex items-center gap-2"
//             >
//               Request access
//               <ArrowRight className="w-4 h-4" />
//             </a>
//           </div>
//         </div>
//       </nav>

//       {/* Hero Section */}
//       <section className="pt-32 pb-20 px-6">
//         <div className="max-w-7xl mx-auto">
//           <div className="max-w-4xl">
//             {/* Badge */}
//             <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-300 rounded-md text-xs font-medium text-neutral-700 mb-8">
//               <Lock className="w-3.5 h-3.5" />
//               Secure • Monitored • Compliant
//             </div>

//             {/* Main Heading */}
//             <h1 className="text-5xl md:text-6xl font-semibold text-neutral-900 leading-tight mb-6">
//               Centralized platform for<br />
//               operational excellence
//             </h1>

//             {/* Description */}
//             <p className="text-lg text-neutral-600 leading-relaxed mb-8 max-w-2xl">
//               Enterprise-grade project management with comprehensive task execution,
//               resource allocation, and real-time visibility across organizational boundaries.
//             </p>

//             {/* CTA Buttons */}
//             <div className="flex flex-col sm:flex-row items-start gap-4 mb-12">
//               <a
//                 href="/register"
//                 className="px-6 py-3 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-all duration-200 flex items-center gap-2"
//               >
//                 Request account
//                 <ArrowRight className="w-4 h-4" />
//               </a>
//               <a
//                 href="/login"
//                 className="px-6 py-3 bg-white text-neutral-900 border border-neutral-300 rounded-lg text-sm font-medium hover:border-neutral-900 transition-all duration-200"
//               >
//                 Secure sign-in
//               </a>
//             </div>

//             {/* Compliance Notice */}
//             <div className="text-xs text-neutral-500 space-y-1">
//               <p>• All access and activity is monitored under organizational policy</p>
//               <p>• Role-based permissions enforced across all workspaces</p>
//               <p>• Audit logging enabled for compliance and security review</p>
//             </div>
//           </div>

//           {/* Dashboard Preview */}
//           <div className="mt-20 relative">
//             <div className="bg-white border border-neutral-300 rounded-lg p-6 shadow-sm">
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 {/* Left Column - Stats */}
//                 <div className="space-y-4">
//                   <div className="bg-neutral-50 border border-neutral-200 rounded-md p-4">
//                     <div className="text-xs font-medium text-neutral-600 mb-2">Active Projects</div>
//                     <div className="text-2xl font-semibold text-neutral-900">24</div>
//                     <div className="text-xs text-neutral-500 mt-1">+3 this month</div>
//                   </div>
//                   <div className="bg-neutral-50 border border-neutral-200 rounded-md p-4">
//                     <div className="text-xs font-medium text-neutral-600 mb-2">Team Utilization</div>
//                     <div className="text-2xl font-semibold text-neutral-900">87%</div>
//                     <div className="text-xs text-neutral-500 mt-1">Target: 85%</div>
//                   </div>
//                 </div>

//                 {/* Middle Column - Tasks */}
//                 <div className="md:col-span-2 space-y-3">
//                   <div className="flex items-center justify-between mb-3">
//                     <div className="text-sm font-medium text-neutral-900">Recent Activity</div>
//                     <div className="text-xs text-neutral-500">Last 24 hours</div>
//                   </div>

//                   {[
//                     { task: "PROJ-101: JWT Authentication", status: "In Progress", progress: 65 },
//                     { task: "PROJ-089: QA Test Cases", status: "Under Review", progress: 90 },
//                     { task: "PROJ-045: Payment Gateway", status: "Blocked", progress: 40 }
//                   ].map((item, i) => (
//                     <div key={i} className="bg-neutral-50 border border-neutral-200 rounded-md p-3">
//                       <div className="flex items-center justify-between mb-2">
//                         <div className="text-xs font-medium text-neutral-900">{item.task}</div>
//                         <div className={`text-xs px-2 py-0.5 rounded ${
//                           item.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
//                           item.status === 'Under Review' ? 'bg-amber-100 text-amber-700' :
//                           'bg-red-100 text-red-700'
//                         }`}>
//                           {item.status}
//                         </div>
//                       </div>
//                       <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
//                         <div
//                           className="h-full bg-neutral-900 transition-all duration-500"
//                           style={{ width: `${item.progress}%` }}
//                         />
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Metrics Bar */}
//       <section className="py-12 px-6 bg-white border-y border-neutral-300">
//         <div className="max-w-7xl mx-auto">
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
//             {metrics.map((metric, index) => (
//               <div
//                 key={index}
//                 className={`text-center transition-all duration-300 ${
//                   activeMetric === index ? 'scale-105' : 'opacity-70'
//                 }`}
//               >
//                 <div className="text-3xl font-semibold text-neutral-900 mb-1">
//                   {metric.value}
//                 </div>
//                 <div className="text-sm font-medium text-neutral-700">
//                   {metric.label}
//                 </div>
//                 <div className="text-xs text-neutral-500 mt-1">
//                   {metric.subtext}
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Features Grid */}
//       <section className="py-20 px-6">
//         <div className="max-w-7xl mx-auto">
//           <div className="mb-16">
//             <h2 className="text-3xl font-semibold text-neutral-900 mb-3">
//               Production-level capabilities
//             </h2>
//             <p className="text-neutral-600 max-w-2xl">
//               Built for enterprise teams requiring secure, auditable, and scalable project operations
//             </p>
//           </div>

//           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
//             {features.map((feature, index) => (
//               <div
//                 key={index}
//                 className="group bg-white border border-neutral-300 rounded-lg p-6 hover:border-neutral-900 hover:shadow-md transition-all duration-200"
//               >
//                 <div className="w-10 h-10 bg-neutral-100 rounded-md flex items-center justify-center text-neutral-900 mb-4 group-hover:bg-neutral-900 group-hover:text-white transition-all duration-200">
//                   {feature.icon}
//                 </div>
//                 <h3 className="text-base font-semibold text-neutral-900 mb-2">
//                   {feature.title}
//                 </h3>
//                 <p className="text-sm text-neutral-600 leading-relaxed">
//                   {feature.description}
//                 </p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Capabilities List */}
//       <section className="py-20 px-6 bg-white">
//         <div className="max-w-7xl mx-auto">
//           <div className="grid md:grid-cols-2 gap-16 items-start">
//             <div>
//               <h2 className="text-3xl font-semibold text-neutral-900 mb-4">
//                 Comprehensive workflow orchestration
//               </h2>
//               <p className="text-neutral-600 leading-relaxed mb-8">
//                 Designed for complex organizational structures with multiple projects,
//                 distributed teams, and strict governance requirements.
//               </p>
//               <div className="space-y-3">
//                 {capabilities.map((item, i) => (
//                   <div key={i} className="flex items-start gap-3">
//                     <CheckCircle className="w-5 h-5 text-neutral-900 shrink-0 mt-0.5" />
//                     <span className="text-sm text-neutral-700">{item.text}</span>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             <div className="bg-neutral-50 border border-neutral-300 rounded-lg p-8">
//               <div className="mb-6">
//                 <div className="text-sm font-medium text-neutral-900 mb-4">System Architecture</div>
//                 <div className="space-y-3">
//                   <div className="flex items-center justify-between text-xs">
//                     <span className="text-neutral-600">Frontend Layer</span>
//                     <span className="font-medium text-neutral-900">React + TypeScript</span>
//                   </div>
//                   <div className="flex items-center justify-between text-xs">
//                     <span className="text-neutral-600">API Gateway</span>
//                     <span className="font-medium text-neutral-900">ASP.NET Core</span>
//                   </div>
//                   <div className="flex items-center justify-between text-xs">
//                     <span className="text-neutral-600">Database</span>
//                     <span className="font-medium text-neutral-900">SQL Server</span>
//                   </div>
//                   <div className="flex items-center justify-between text-xs">
//                     <span className="text-neutral-600">Message Queue</span>
//                     <span className="font-medium text-neutral-900">Azure Service Bus</span>
//                   </div>
//                   <div className="flex items-center justify-between text-xs">
//                     <span className="text-neutral-600">Hosting</span>
//                     <span className="font-medium text-neutral-900">Azure Cloud</span>
//                   </div>
//                 </div>
//               </div>

//               <div className="pt-6 border-t border-neutral-300">
//                 <div className="text-sm font-medium text-neutral-900 mb-3">Security Standards</div>
//                 <div className="flex flex-wrap gap-2">
//                   {['SOX Compliant', 'GDPR Ready', 'ISO 27001', 'SOC 2 Type II'].map((badge) => (
//                     <span key={badge} className="px-2.5 py-1 bg-white border border-neutral-300 rounded text-xs font-medium text-neutral-700">
//                       {badge}
//                     </span>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* CTA Section */}
//       <section className="py-20 px-6 bg-neutral-900">
//         <div className="max-w-4xl mx-auto text-center">
//           <h2 className="text-3xl font-semibold text-white mb-4">
//             Ready to streamline your operations?
//           </h2>
//           <p className="text-neutral-400 mb-8 max-w-2xl mx-auto">
//             Request access to create your organizational workspace. All access requests
//             are reviewed and approved by system administrators.
//           </p>
//           <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
//             <a
//               href="/register"
//               className="px-8 py-3 bg-white text-neutral-900 rounded-lg text-sm font-medium hover:bg-neutral-100 transition-all duration-200 flex items-center gap-2"
//             >
//               Request account
//               <ArrowRight className="w-4 h-4" />
//             </a>
//             <a
//               href="/login"
//               className="px-8 py-3 bg-neutral-800 text-white border border-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-700 transition-all duration-200"
//             >
//               Sign in to workspace
//             </a>
//           </div>
//           <p className="text-xs text-neutral-500 mt-8">
//             Access is monitored and recorded. Unauthorized use is prohibited.
//           </p>
//         </div>
//       </section>

//       {/* Footer */}
//       <footer className="py-8 px-6 bg-neutral-900 border-t border-neutral-800">
//         <div className="max-w-7xl mx-auto">
//           <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-neutral-500">
//             <div className="flex items-center gap-3">
//               <div className="w-7 h-7 bg-white rounded flex items-center justify-center">
//                 <span className="text-neutral-900 font-bold text-xs">PMS</span>
//               </div>
//               <span>Project Management System</span>
//             </div>

//             <div>
//               © 2026 Enterprise Platform. All rights reserved.
//             </div>

//             <div className="flex items-center gap-6 text-xs">
//               <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
//               <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
//               <a href="#" className="hover:text-white transition-colors">System Status</a>
//             </div>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// }

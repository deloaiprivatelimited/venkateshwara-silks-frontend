import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";

const Login: React.FC = () => {
  const navigate = useNavigate();
  
  // Changed 'email' to 'username' to match API requirement
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Exact Base URL from the image provided
    const BASE_URL = "https://api.abhi.deloai.com";

    try {
      const response = await fetch(`${BASE_URL}/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // --- SUCCESS (200) ---
        // 1. Store the token for future API calls
        localStorage.setItem("token", data.token);
        
        // 2. Store user info for the App's Auth Guard (PrivateRoutes)
        localStorage.setItem("user", JSON.stringify(data.admin));

        // 3. Navigate to Dashboard
        navigate("/dashboard", { replace: true });
      } else {
        // --- ERROR (401, etc) ---
        // Use the message from the API or a fallback
        setError(data.message || "Invalid credentials. Please try again.");
      }
    } catch (err) {
      // --- NETWORK ERROR ---
      setError("Unable to connect to the server. Please check your internet.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-gray-50">
      
      {/* --- Left Side: Brand/Visual --- */}
      <div className="hidden lg:flex w-1/2 bg-orange-600 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1727430228383-aa1fb59db8bf?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center opacity-100 "></div>
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600/80 to-orange-900/80"></div>

        <div className="relative z-10 text-white p-12 max-w-lg">
           <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8 border border-white/20 shadow-xl">
              <ShieldCheck size={32} className="text-white" />
           </div>
           <h1 className="text-4xl font-bold mb-4">Venkateshwara Silks</h1>
           <p className="text-orange-100 text-lg leading-relaxed">
             Secure inventory management system.
           </p>
        </div>
      </div>

      {/* --- Right Side: Login Form --- */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 lg:p-24 bg-white">
        <div className="w-full max-w-md space-y-8">
          
          <div className="lg:hidden text-center mb-8">
            <h2 className="text-2xl font-bold text-orange-600">VenkateshwaraSilks</h2>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900">Admin Login</h2>
            <p className="mt-2 text-gray-500">Please enter your username and password.</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  placeholder="admin"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-center text-gray-400 mt-8">
            Authorized personnel only. <br/> IP Address logged for security.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
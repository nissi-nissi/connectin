import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/register", { email, password });
      login(response.data);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
        <h1 className="mb-1 text-2xl font-bold text-slate-900">Create Account</h1>
        <p className="mb-6 text-sm text-slate-600">Start storing and sharing files in your cloud drive.</p>

        <div className="mb-4">
          <label className="mb-1 block text-sm text-slate-700">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-600"
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm text-slate-700">Password</label>
          <input
            type="password"
            minLength={6}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-600"
          />
        </div>

        {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

        <button
          disabled={loading}
          type="submit"
          className="w-full rounded-lg bg-brand-600 px-3 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-70"
        >
          {loading ? "Creating..." : "Register"}
        </button>

        <p className="mt-4 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-brand-700 hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Register;

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { login } from "../api/authApi"

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      setTimeout(() => navigate("/dashboard"), 300)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    loginMutation.mutate({ username, password })
  }

  return (
    <div className="min-h-screen flex flex-col industrial-grid bg-surface font-body-md">
      <main className="flex-grow flex flex-col items-center justify-center px-6 py-8">
        <div className="text-center mb-8 w-full">
          <div className="inline-flex items-center justify-center p-4 bg-white rounded-xl mb-4 border border-outline-variant shadow-sm">
            <span className="material-symbols-outlined text-primary text-[40px]">precision_manufacturing</span>
          </div>
          <h1 className="font-display-lg text-display-lg text-primary tracking-tight">SmartInventory</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Enterprise Resource Planning</p>
        </div>

        <div className="w-full max-w-[400px] bg-white border border-outline-variant rounded-xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="font-label-md text-label-md text-on-surface-variant block uppercase" htmlFor="username">Username/Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline text-body-lg">person</span>
                </div>
                <input
                  className="block w-full pl-8 pr-4 py-4 bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-body-md focus:border-primary-container focus:ring-0 transition-all outline-none"
                  id="username"
                  name="username"
                  placeholder="e.g. admin_rice_mill"
                  required
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-end">
                <label className="font-label-md text-label-md text-on-surface-variant block uppercase" htmlFor="password">Password</label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline text-body-lg">lock</span>
                </div>
                <input
                  className="block w-full pl-8 pr-8 py-4 bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-body-md focus:border-primary-container focus:ring-0 transition-all outline-none"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-outline hover:text-primary transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-body-lg">{showPassword ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>

            {loginMutation.isError && (
              <p className="font-body-sm text-body-sm text-error bg-error-container/20 px-3 py-2 rounded-lg">
                {loginMutation.error instanceof Error ? loginMutation.error.message : "Login failed. Please try again."}
              </p>
            )}

            <div className="pt-2 space-y-4">
              <button
                type="submit"
                disabled={loginMutation.isPending}
                className={`w-full h-14 rounded-lg font-title-md text-title-md flex items-center justify-center gap-2 transition-all shadow-md ${
                  loginMutation.isSuccess
                    ? "bg-secondary text-on-secondary"
                    : "bg-primary-container text-on-primary-container hover:brightness-95 active:scale-[0.98]"
                }`}
              >
                {loginMutation.isPending ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : loginMutation.isSuccess ? (
                  <span className="material-symbols-outlined">check_circle</span>
                ) : (
                  <span className="material-symbols-outlined">arrow_forward</span>
                )}
                {loginMutation.isPending ? "Authenticating..." : loginMutation.isSuccess ? "Success" : "Login"}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4 w-full">
          <a className="font-label-md text-label-md text-primary hover:underline decoration-2 underline-offset-4 transition-all" href="#">Forgot Password?</a>
          <div className="w-full h-[1px] bg-outline-variant opacity-50"></div>
          <div className="flex items-center gap-4">
            <a className="flex items-center gap-1 font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#">
              <span className="material-symbols-outlined text-[18px]">support_agent</span>
              Help Support
            </a>
            <span className="text-outline-variant">•</span>
            <a className="flex items-center gap-1 font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#">
              <span className="material-symbols-outlined text-[18px]">security</span>
              Privacy Policy
            </a>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center">
        <p className="font-label-sm text-label-sm text-outline flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-[14px]">verified_user</span>
          Secure End-to-End Encryption Enabled
        </p>
      </footer>

      <div className="fixed inset-0 z-[-1] opacity-[0.03] overflow-hidden pointer-events-none">
        <img
          className="w-full h-full object-cover"
          alt=""
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDaZ3n7jg1wWwvaWDXnWNbwK50ZcTcOEpzY8R47wROCYmi9EwgTlxJYh5UwnM9TJrUNxQky-Eu6TFdfj_5t1_HceVLSoYZkrCv06ne8l3wXvJ3O7c-0ZSVF6dHfak3VoQ0XfTmvQlqadwVyl7vr-gql2VtVkioPv9QLdhtfYQ8ylBjjc84iys4CwRct7f1gJoGiDq6nvOtenX54B1rmUTbLSQLTKi5cq_39wUvDOfNeUNk20MMR3bKJm3kW86rXevgWZxtPna3noSQ"
        />
      </div>
    </div>
  )
}

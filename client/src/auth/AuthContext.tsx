// src/auth/AuthContext.tsx
import { createContext, ReactNode, useContext, useMemo, useState } from 'react'
import { authApi } from '../api/auth'

type AuthUser = {
  id: string
  loginName: string
  firstName: string
  lastName: string
}

type LoginInput =
    | { loginName: string; loginPassword: string }
    | [string, string]

type AuthContextValue = {
  token: string | null
  user: AuthUser | null
  login: (input: LoginInput) => Promise<void>
  register: (data: {
    firstName: string
    lastName: string
    loginName: string
    loginPassword: string
  }) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function decodeJwtPayload(token: string): Record<string, unknown> {
  const payloadBase64Url = token.split('.')[1]
  const payloadBase64 = payloadBase64Url.replace(/-/g, '+').replace(/_/g, '/')
  const padded = payloadBase64.padEnd(Math.ceil(payloadBase64.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  const json = new TextDecoder().decode(bytes)
  return JSON.parse(json)
}

function decodeUserFromToken(token: string): AuthUser | null {
  try {
    const payload = decodeJwtPayload(token) as Partial<AuthUser>
    return {
      id: payload.id,
      loginName: payload.loginName,
      firstName: payload.firstName,
      lastName: payload.lastName,
    }
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))

  const [user, setUser] = useState<AuthUser | null>(() => {
    const storedToken = localStorage.getItem('token')
    return storedToken ? decodeUserFromToken(storedToken) : null
  })

  const saveToken = (newToken: string) => {
    localStorage.setItem('token', newToken)
    setToken(newToken)
    setUser(decodeUserFromToken(newToken))
  }

  const login = async (input: LoginInput) => {
    const credentials = Array.isArray(input)
        ? { loginName: input[0], loginPassword: input[1] }
        : input

    const response = await authApi.login(credentials)
    saveToken(response.token)
  }

  const register = async (data: {
    firstName: string
    lastName: string
    loginName: string
    loginPassword: string
  }) => {
    await authApi.register(data)

    const response = await authApi.login({
      loginName: data.loginName,
      loginPassword: data.loginPassword,
    })

    saveToken(response.token)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  const value = useMemo(
      () => ({
        token,
        user,
        login,
        register,
        logout,
      }),
      [token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}

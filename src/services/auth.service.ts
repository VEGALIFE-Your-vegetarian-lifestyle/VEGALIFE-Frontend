export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload extends LoginPayload {
  name: string
}

export const authService = {
  login: async (payload: LoginPayload) => {
    void payload
    throw new Error('Backend API contracts will be documented separately.')
  },
  register: async (payload: RegisterPayload) => {
    void payload
    throw new Error('Backend API contracts will be documented separately.')
  },
  me: async () => {
    throw new Error('Backend API contracts will be documented separately.')
  },
}
